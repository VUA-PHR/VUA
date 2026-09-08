//! Catalog read-face wire tests (W12 closeout; bdl-queries v0.3).
//!
//! The host consumes the data-side frozen vectors from
//! `schemas/bdl-queries/v0.3/examples` through the real frame loop. The
//! assembly (bdl-store) produces the result payload; the wire face wraps it
//! into the frozen `{ schemaVersion, operation, result }` document — so the
//! wire answer must equal the direct store assembly for the same params
//! (the face adds nothing, hides nothing) and must validate against the
//! frozen result schema. Honest empty states are pinned over the wire
//! (no observation rows: list = empty set, status.health = unknown);
//! tombstones are never cards; closed-set violations are contract errors,
//! never silently empty answers.

use std::fs;
use std::io::Cursor;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;

use serde_json::{json, Value};
use vua_bdl_store::{ArtifactMode, BdlStore, CatalogListParams};
use vua_provider_host::{run_provider_host_with_services, WarehouseConfig};

fn schema_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/bdl-queries/v0.3")
}

fn read_json(relative: &str) -> Value {
    let bytes = fs::read(schema_dir().join(relative)).expect("schema/vector must exist");
    serde_json::from_slice(&bytes).expect("schema/vector must be valid JSON")
}

fn query_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_json("query.schema.json")).expect("frozen query schema")
}

fn result_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_json("result.schema.json")).expect("frozen result schema")
}

static SEQUENCE: AtomicU32 = AtomicU32::new(0);

struct World {
    base: PathBuf,
    database_path: PathBuf,
    bdl: Arc<BdlStore>,
}

impl Drop for World {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
    }
}

fn make_world(label: &str) -> World {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let serial = SEQUENCE.fetch_add(1, Ordering::Relaxed);
    let base = std::env::temp_dir().join(format!(
        "vua-provider-catalog-{label}-{}-{nanos}-{serial}",
        std::process::id()
    ));
    fs::create_dir_all(base.join("bdl")).expect("temp layout");
    let bdl = Arc::new(BdlStore::open(base.join("bdl").join("bdl.db")).expect("BDL opens"));
    World { database_path: base.join("tasks.db"), bdl, base }
}

fn seed(world: &World, product_id: &str) {
    world
        .bdl
        .seed_product(product_id, product_id.trim_start_matches("booth:"))
        .expect("seed product");
}

/// A tombstone (`status = 'missing'`) is observation-side bookkeeping — the
/// production surface has no write path for it, so the test writes it
/// through a second connection (mirroring the bdl-store consumer tests).
fn insert_tombstone(world: &World, product_id: &str) {
    rusqlite::Connection::open(world.bdl.path().unwrap())
        .expect("aux connection opens")
        .execute(
            "INSERT INTO products(
                product_id, native_product_id, source_url, status,
                content_hash, observed_at, processor_version
             ) VALUES (?1, ?2, ?3, 'missing', ?4, ?5, 'fixture')",
            rusqlite::params![
                product_id,
                product_id.trim_start_matches("booth:"),
                format!("https://booth.example.com/items/{product_id}"),
                "sha256:0000000000000000000000000000000000000000000000000000000000000000",
                "2026-09-08T00:00:00.000Z",
            ],
        )
        .expect("tombstone row inserted");
}

/// Runs one bdl-queries request vector through the real frame loop with the
/// warehouse (BDL) wired.
fn run_query(world: &World, request_id: &str, operation: &str, params: Value) -> Vec<Value> {
    let frame = json!({
        "frameVersion": "0.1",
        "frameId": format!("frame-{request_id}"),
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": request_id,
            "correlationId": format!("corr-{request_id}"),
            "kind": "query",
            "method": operation,
            "params": params,
        },
    });
    let warehouse = WarehouseConfig {
        bdl: world.bdl.clone(),
        warehouse_root: world.base.join("warehouse"),
        global_default: ArtifactMode::UseOriginalUnitypackage,
        executor: None,
    };
    let mut output = Vec::new();
    run_provider_host_with_services(
        Cursor::new(format!("{frame}\n")),
        &mut output,
        &world.database_path,
        None,
        None,
        Some(warehouse),
        None,
    )
    .expect("the frame loop must stay alive for catalog vectors");
    String::from_utf8(output)
        .expect("output is UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("output lines are frames"))
        .collect()
}

#[test]
fn catalog_request_vectors_are_consumable_query_documents() {
    let validator = query_validator();
    for name in [
        "examples/catalog-list.request.json",
        "examples/catalog-detail.request.json",
        "examples/catalog-status.request.json",
    ] {
        let vector = read_json(name);
        assert!(validator.is_valid(&vector), "{name} must validate");
    }
}

#[test]
fn empty_table_answers_the_honest_empty_state_over_the_wire() {
    let world = make_world("empty");
    let validator = result_validator();

    // 空态即终态: until the observation pipeline lands rows, list is the
    // empty set and status.health is unknown — over the wire, not just in
    // the assembly.
    let frames = run_query(&world, "req-list", "catalog.list", json!({}));
    let value = &frames[0]["payload"]["value"];
    assert!(validator.is_valid(value), "{value}");
    assert_eq!(value["schemaVersion"], "0.3");
    assert_eq!(value["operation"], "catalog.list");
    assert_eq!(value["result"]["total"], 0);
    assert_eq!(value["result"]["entries"], json!([]));

    let frames = run_query(&world, "req-status", "catalog.status", json!({}));
    let value = &frames[0]["payload"]["value"];
    assert!(validator.is_valid(value), "{value}");
    assert_eq!(value["operation"], "catalog.status");
    assert_eq!(value["result"]["health"], "unknown");
    assert_eq!(value["result"]["revision"]["catalogUpdatedSeq"], Value::Null);
    assert_eq!(value["result"]["revision"]["datasetRevision"], "0.1");
}

#[test]
fn catalog_list_wire_equals_the_store_assembly_and_never_serves_tombstones() {
    let world = make_world("list");
    let validator = result_validator();
    seed(&world, "booth:1000001");
    seed(&world, "booth:1000002");
    insert_tombstone(&world, "booth:1000004");

    // The positive vector, reworded to the seeded ids (no text filter — the
    // seeded rows carry no presentation fields yet).
    let request = read_json("examples/catalog-list.request.json");
    let mut params = request["params"].clone();
    params["text"] = Value::Null;
    let frames = run_query(&world, "req-list", "catalog.list", params);
    let value = &frames[0]["payload"]["value"];
    assert!(validator.is_valid(value), "{value}");
    assert_eq!(value["operation"], "catalog.list");
    // The face wraps the store assembly unchanged: total excludes the
    // tombstone and the entries are exactly the store's answer.
    let assembled = world
        .bdl
        .catalog_list(&CatalogListParams::default())
        .expect("store assembly");
    assert_eq!(value["result"], serde_json::to_value(&assembled).unwrap());
    assert_eq!(assembled.total, 2, "tombstones are never cards");
    let ids: Vec<&str> = assembled.entries.iter().map(|e| e.product_id.as_str()).collect();
    assert_eq!(ids, ["booth:1000001", "booth:1000002"], "productId ascending");

    // The text filter matches the productId substring and only that entry.
    let mut filtered = request["params"].clone();
    filtered["text"] = json!("1000002");
    let frames = run_query(&world, "req-filter", "catalog.list", filtered);
    let value = &frames[0]["payload"]["value"];
    assert!(validator.is_valid(value), "{value}");
    assert_eq!(value["result"]["total"], 1);
    assert_eq!(value["result"]["entries"][0]["productId"], "booth:1000002");
}

#[test]
fn catalog_detail_serves_cards_and_answers_not_found_for_misses() {
    let world = make_world("detail");
    let validator = result_validator();
    seed(&world, "booth:1000001");
    insert_tombstone(&world, "booth:1000004");

    // The positive vector, reworded to the seeded id: the assembled detail
    // equals the store assembly and validates against the frozen schema.
    let request = read_json("examples/catalog-detail.request.json");
    let frames = run_query(&world, "req-detail", "catalog.detail", request["params"].clone());
    let value = &frames[0]["payload"]["value"];
    assert!(validator.is_valid(value), "{value}");
    assert_eq!(value["operation"], "catalog.detail");
    let assembled = world
        .bdl
        .catalog_detail("booth:1000001")
        .expect("store assembly")
        .expect("seeded card exists");
    assert_eq!(value["result"], serde_json::to_value(&assembled).unwrap());
    assert_eq!(value["result"]["product"]["productId"], "booth:1000001");

    // A miss is the application-face not-found — never a fabricated product.
    let frames = run_query(
        &world,
        "req-miss",
        "catalog.detail",
        json!({ "productId": "booth:9999999" }),
    );
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.catalog.product_not_found");

    // A tombstone is observation-side data: the catalog face does not serve
    // it as a card either.
    let frames = run_query(
        &world,
        "req-tomb",
        "catalog.detail",
        json!({ "productId": "booth:1000004" }),
    );
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.catalog.product_not_found");
    assert!(!result_validator().is_valid(&frames[0]["payload"]["error"]));
}

#[test]
fn catalog_status_health_follows_the_pipeline_bookkeeping_counter() {
    let world = make_world("status");
    seed(&world, "booth:1000001");

    // Seeded product rows alone do not make the catalog "ok": health tracks
    // the observation pipeline's bookkeeping counter, not row presence.
    let frames = run_query(&world, "req-status-before", "catalog.status", json!({}));
    let value = &frames[0]["payload"]["value"];
    assert!(result_validator().is_valid(value), "{value}");
    assert_eq!(value["result"]["health"], "unknown");
    assert_eq!(value["result"]["revision"]["catalogUpdatedSeq"], Value::Null);

    // The pipeline bookkeeping counter (an auxiliary row here — the
    // production write path belongs to the pipeline) turns the health ok,
    // and the counter value travels the revision.
    rusqlite::Connection::open(world.bdl.path().unwrap())
        .expect("aux connection opens")
        .execute(
            "INSERT INTO bdl_meta(key, value) VALUES ('catalog_updated_seq', '7')",
            [],
        )
        .expect("bookkeeping counter written");
    let frames = run_query(&world, "req-status-after", "catalog.status", json!({}));
    let value = &frames[0]["payload"]["value"];
    assert!(result_validator().is_valid(value), "{value}");
    assert_eq!(value["result"]["health"], "ok");
    assert_eq!(value["result"]["revision"]["catalogUpdatedSeq"], 7);
}

#[test]
fn closed_set_violations_are_contract_errors_not_empty_answers() {
    let world = make_world("params");
    seed(&world, "booth:1000001");
    let validator = result_validator();

    // The frozen negative vectors drive the wire: entityType is outside the
    // v0.3 closed set and "in stock" is outside the stable enum.
    for name in [
        "examples/invalid-entity-filter.json",
        "examples/invalid-availability-filter.json",
    ] {
        let request = read_json(name);
        let frames = run_query(&world, "req-invalid", "catalog.list", request["params"].clone());
        assert_eq!(
            frames[0]["payload"]["error"]["code"],
            "vua.catalog.invalid_params",
            "{name}"
        );
    }

    // detail: an unknown key, an explicit null, and an empty string are all
    // contract errors.
    for params in [
        json!({ "productId": "booth:1000001", "extra": 1 }),
        json!({ "productId": null }),
        json!({ "productId": "" }),
        json!({}),
    ] {
        let frames = run_query(&world, "req-detail-invalid", "catalog.detail", params);
        assert_eq!(frames[0]["payload"]["error"]["code"], "vua.catalog.invalid_params");
    }

    // status: the closed set is {} — any key at all is a contract error.
    let frames = run_query(&world, "req-status-invalid", "catalog.status", json!({ "x": 1 }));
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.catalog.invalid_params");

    // Every error path stays an application error: it never validates as a
    // frozen result.
    assert!(!validator.is_valid(&frames[0]["payload"]["error"]));
}

#[test]
fn warehouse_read_face_vectors_drive_cards_and_detail_over_the_wire() {
    let world = make_world("wh-read");
    let validator = result_validator();
    let item = world
        .bdl
        .create_warehouse_item("Fixture Material Pack", "imported_material", "2026-09-08T00:00:00.000Z")
        .expect("seed entry");

    // listEntries: the frozen closed set {} drives the whole card list; the
    // wire result equals the store assembly (face adds nothing, hides
    // nothing) and resolves effective modes against the composed global.
    let request = read_json("examples/warehouse-list-entries.request.json");
    let frames = run_query(&world, "req-wh-list", "warehouse.listEntries", request["params"].clone());
    let value = &frames[0]["payload"]["value"];
    assert!(validator.is_valid(value), "{value}");
    assert_eq!(value["operation"], "warehouse.listEntries");
    let assembled = world
        .bdl
        .warehouse_entry_cards(ArtifactMode::UseOriginalUnitypackage)
        .expect("store assembly");
    assert_eq!(
        value["result"]["entries"],
        serde_json::to_value(&assembled).unwrap()
    );
    assert_eq!(value["result"]["entries"][0]["warehouseItemId"], item.warehouse_item_id);
    assert_eq!(
        value["result"]["entries"][0]["effectiveArtifactMode"],
        "use_original_unitypackage",
        "no persisted global and no override: the env initial rules"
    );

    // entryDetail: the seeded id round-trips with the full fact payload.
    let request = read_json("examples/warehouse-entry-detail.request.json");
    let mut params = request["params"].clone();
    params["warehouseItemId"] = json!(item.warehouse_item_id);
    let frames = run_query(&world, "req-wh-detail", "warehouse.entryDetail", params);
    let value = &frames[0]["payload"]["value"];
    assert!(validator.is_valid(value), "{value}");
    assert_eq!(value["operation"], "warehouse.entryDetail");
    let assembled = world
        .bdl
        .warehouse_entry_detail(&item.warehouse_item_id, ArtifactMode::UseOriginalUnitypackage)
        .expect("store assembly")
        .expect("seeded entry exists");
    assert_eq!(
        value["result"]["entry"],
        serde_json::to_value(&assembled).unwrap()
    );

    // A miss is the frozen application-face entry_not_found — never a
    // fabricated entry.
    let frames = run_query(
        &world,
        "req-wh-miss",
        "warehouse.entryDetail",
        json!({ "warehouseItemId": "whi-does-not-exist" }),
    );
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.entry_not_found");
}

#[test]
fn warehouse_read_face_closed_set_violations_are_contract_errors() {
    let world = make_world("wh-params");

    // listEntries takes no filter: any key at all is a contract error.
    let frames = run_query(
        &world,
        "req-wh-list-invalid",
        "warehouse.listEntries",
        json!({ "kind": "imported_material" }),
    );
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.invalid_params");

    // entryDetail's closed set is { warehouseItemId }: unknown keys, an
    // explicit null, and an empty string are contract errors.
    for params in [
        json!({ "warehouseItemId": "whi-x", "extra": 1 }),
        json!({ "warehouseItemId": null }),
        json!({ "warehouseItemId": "" }),
        json!({}),
    ] {
        let frames = run_query(&world, "req-wh-detail-invalid", "warehouse.entryDetail", params);
        assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.invalid_params");
    }
}

#[test]
fn unknown_catalog_methods_and_unwired_bdl_answer_typed_errors() {
    let world = make_world("unwired");

    // An unknown catalog.* method is the shared unknown-method validation.
    let frames = run_query(&world, "req-unknown", "catalog.snapshot", json!({}));
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.provider.unknown_method");

    // Without the warehouse wiring there is no BDL read face: an honest
    // typed unavailable, never a fabricated empty answer.
    let frame = json!({
        "frameVersion": "0.1",
        "frameId": "frame-unwired",
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": "req-unwired",
            "correlationId": "corr-unwired",
            "kind": "query",
            "method": "catalog.list",
            "params": {},
        },
    });
    let mut output = Vec::new();
    run_provider_host_with_services(
        Cursor::new(format!("{frame}\n")),
        &mut output,
        &world.database_path,
        None,
        None,
        None,
        None,
    )
    .expect("frame loop runs");
    let frames: Vec<Value> = String::from_utf8(output)
        .unwrap()
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.catalog.unavailable");
}
