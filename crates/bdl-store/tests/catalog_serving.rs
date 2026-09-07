//! W12 consumer tests: the catalog serving face (catalog.list/detail/status)
//! against the frozen `schemas/bdl-queries/v0.3` vocabulary.
//!
//! One end consumes the frozen vectors for real: positive request vectors
//! drive the assembly, assembled results validate against the frozen result
//! schema, and the honest empty state (观察管线未落数据前 list = 空集、
//! status.health = unknown) is pinned so a later pipeline cannot silently
//! change it. Tombstones are never cards; out-of-closed-set params are
//! contract errors, never silently empty answers. Auxiliary rows (tombstones,
//! the pipeline bookkeeping counter) are written through a second connection
//! to the same file-backed store — the production surface stays test-free.

use serde_json::{json, Value};
use std::path::PathBuf;
use vua_bdl_store::{
    AvailabilityStatus, BdlStore, CatalogListParams, CatalogListResult, BDL_FORMAT_VERSION,
    BDL_QUERIES_SCHEMA_VERSION,
};

fn schema_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/bdl-queries/v0.3")
}

fn read_json(relative: &str) -> Value {
    let bytes = std::fs::read(schema_dir().join(relative)).expect("schema/vector must exist");
    serde_json::from_slice(&bytes).expect("schema/vector must be valid JSON")
}

fn query_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_json("query.schema.json")).unwrap()
}

fn result_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_json("result.schema.json")).unwrap()
}

fn violations(validator: &jsonschema::Validator, instance: &Value) -> Vec<String> {
    validator
        .iter_errors(instance)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect()
}

/// The frozen result document is an envelope: { schemaVersion, operation,
/// result }. The assembly produces the result payload; the provider face
/// wraps it. Tests validate the assembled payload inside the envelope.
fn enveloped(operation: &str, result: Value) -> Value {
    json!({
        "schemaVersion": BDL_QUERIES_SCHEMA_VERSION,
        "operation": operation,
        "result": result,
    })
}

struct World {
    database_path: PathBuf,
    store: BdlStore,
}

impl World {
    fn open(label: &str) -> Self {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let base =
            std::env::temp_dir().join(format!("vua-catalog-{label}-{}-{nanos}", std::process::id()));
        std::fs::create_dir_all(&base).unwrap();
        let database_path = base.join("bdl.sqlite");
        let store = BdlStore::open(&database_path).expect("store opens");
        Self { database_path, store }
    }

    /// A second connection to the same file-backed store for auxiliary
    /// observation-side rows (tombstones, the pipeline bookkeeping counter).
    fn aux(&self) -> rusqlite::Connection {
        rusqlite::Connection::open(&self.database_path).expect("aux connection opens")
    }
}

impl Drop for World {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(self.database_path.parent().unwrap());
    }
}

fn seed(world: &World, product_id: &str) {
    world
        .store
        .seed_product(product_id, product_id.trim_start_matches("booth:"))
        .unwrap();
}

fn insert_tombstone(world: &World, product_id: &str) {
    world
        .aux()
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
                "2026-09-07T00:00:00.000Z",
            ],
        )
        .unwrap();
}

#[test]
fn w12_empty_table_answers_the_honest_empty_set() {
    let world = World::open("empty");
    let result = world.store.catalog_list(&CatalogListParams::default()).unwrap();
    assert_eq!(result.total, 0, "no observation rows yet: 空态即终态");
    assert!(result.entries.is_empty());
    let serialized =
        enveloped("catalog.list", serde_json::to_value(&result).unwrap());
    assert!(
        result_validator().is_valid(&serialized),
        "even the empty set must match the frozen result shape"
    );
    assert_eq!(world.store.catalog_detail("booth:1000001").unwrap(), None);
}

#[test]
fn w12_list_vector_params_drive_the_assembly_and_validate() {
    let world = World::open("list");
    seed(&world, "booth:1000002");
    seed(&world, "booth:1000001");

    // The frozen positive vector parses into the closed-set params.
    let request = read_json("examples/catalog-list.request.json");
    assert!(query_validator().is_valid(&request), "positive vector validates");
    let params = CatalogListParams::from_value(&request["params"]).unwrap();

    // `text: "uniform"` matches no fixture productId: the honest total is 0.
    let filtered = world.store.catalog_list(&params).unwrap();
    assert_eq!(filtered.total, 0);
    assert!(filtered.entries.is_empty());

    // Without the text filter both observed rows assemble, productId
    // ascending, and the result validates against the frozen result schema.
    let unfiltered = CatalogListParams { text: None, ..params.clone() };
    let result = world.store.catalog_list(&unfiltered).unwrap();
    assert_eq!(result.total, 2);
    assert_eq!(
        result
            .entries
            .iter()
            .map(|entry| entry.product_id.as_str())
            .collect::<Vec<_>>(),
        vec!["booth:1000001", "booth:1000002"],
        "entries are ordered by productId ascending"
    );
    let serialized =
        enveloped("catalog.list", serde_json::to_value(&result).unwrap());
    let errors = violations(&result_validator(), &serialized);
    assert!(errors.is_empty(), "assembled list must validate: {errors:?}");

    // Honest empty presentation shapes until the pipeline observes them.
    let card = &result.entries[0];
    assert_eq!(card.title, None);
    assert_eq!(card.price, None);
    assert_eq!(card.image_url, None);
    assert!(card.image_urls.is_empty());
    assert_eq!(card.availability_raw, None);
    assert_eq!(card.availability_status, AvailabilityStatus::Unknown);
    assert_eq!(card.entity_count, 0, "entity storage belongs to BDL v2");
    assert!(card.entity_types.is_empty());
}

#[test]
fn w12_pagination_slices_after_the_total() {
    let world = World::open("paging");
    for id in ["booth:1000001", "booth:1000002", "booth:1000003"] {
        seed(&world, id);
    }
    let params = CatalogListParams { limit: 2, offset: 1, ..CatalogListParams::default() };
    let result: CatalogListResult = world.store.catalog_list(&params).unwrap();
    assert_eq!(result.total, 3, "total is computed before limit/offset");
    assert_eq!(result.entries.len(), 2);
    assert_eq!(
        result
            .entries
            .iter()
            .map(|entry| entry.product_id.as_str())
            .collect::<Vec<_>>(),
        vec!["booth:1000002", "booth:1000003"]
    );
}

#[test]
fn w12_availability_filters_answer_honestly() {
    let world = World::open("availability");
    seed(&world, "booth:1000001");

    let unknown = CatalogListParams {
        availability_status: Some(AvailabilityStatus::Unknown),
        ..Default::default()
    };
    assert_eq!(world.store.catalog_list(&unknown).unwrap().total, 1);

    // No row carries a derived available/unavailable status yet: the filter
    // never fabricates a match.
    for status in [AvailabilityStatus::Available, AvailabilityStatus::Unavailable] {
        let params = CatalogListParams { availability_status: Some(status), ..Default::default() };
        let result = world.store.catalog_list(&params).unwrap();
        assert_eq!(result.total, 0, "{status:?} filter answers the empty set");
        assert!(result.entries.is_empty());
    }
}

#[test]
fn w12_tombstones_are_never_cards() {
    let world = World::open("tombstone");
    seed(&world, "booth:1000001");
    insert_tombstone(&world, "booth:1000999");

    let result = world.store.catalog_list(&CatalogListParams::default()).unwrap();
    assert_eq!(result.total, 1, "a 404/410 keepsake is not a catalog card");
    assert_eq!(result.entries[0].product_id, "booth:1000001");
    assert_eq!(world.store.catalog_detail("booth:1000999").unwrap(), None);
}

#[test]
fn w12_detail_validates_against_the_frozen_schema() {
    let world = World::open("detail");
    seed(&world, "booth:1000001");

    let request = read_json("examples/catalog-detail.request.json");
    assert!(query_validator().is_valid(&request), "positive vector validates");
    let detail = world
        .store
        .catalog_detail("booth:1000001")
        .unwrap()
        .expect("seeded product serves");

    let serialized =
        enveloped("catalog.detail", serde_json::to_value(&detail).unwrap());
    let errors = violations(&result_validator(), &serialized);
    assert!(errors.is_empty(), "assembled detail must validate: {errors:?}");
    assert_eq!(serialized["result"]["product"]["productId"], "booth:1000001");
    assert_eq!(serialized["result"]["product"]["availabilityStatus"], "unknown");
    assert_eq!(
        serialized["result"]["product"]["adult"], false,
        "adult is only an explicit badge"
    );
    assert_eq!(serialized["result"]["product"]["entityCount"], 0);
    assert_eq!(world.store.catalog_detail("booth:404").unwrap(), None);
}

#[test]
fn w12_status_is_unknown_until_the_pipeline_counter_exists() {
    let world = World::open("status");

    let request = read_json("examples/catalog-status.request.json");
    assert!(query_validator().is_valid(&request), "positive vector validates");

    let status = world.store.catalog_status().unwrap();
    let serialized =
        enveloped("catalog.status", serde_json::to_value(&status).unwrap());
    let errors = violations(&result_validator(), &serialized);
    assert!(errors.is_empty(), "status must validate: {errors:?}");
    assert_eq!(serialized["result"]["health"], "unknown", "no pipeline bookkeeping yet");
    assert_eq!(serialized["result"]["revision"]["catalogUpdatedSeq"], Value::Null);
    assert_eq!(
        serialized["result"]["revision"]["datasetRevision"],
        BDL_FORMAT_VERSION
    );

    // Once the observation pipeline keeps its counter, health turns ok.
    world
        .aux()
        .execute("INSERT INTO bdl_meta(key, value) VALUES ('catalog_updated_seq', '42')", [])
        .unwrap();
    let status = world.store.catalog_status().unwrap();
    let serialized =
        enveloped("catalog.status", serde_json::to_value(&status).unwrap());
    assert_eq!(serialized["result"]["health"], "ok");
    assert_eq!(serialized["result"]["revision"]["catalogUpdatedSeq"], 42);
    assert!(result_validator().is_valid(&serialized));
}

#[test]
fn w12_schema_version_constant_matches_the_frozen_vocabulary() {
    assert_eq!(BDL_QUERIES_SCHEMA_VERSION, "0.3");
    let _ = json!({"anchor": true});
}
