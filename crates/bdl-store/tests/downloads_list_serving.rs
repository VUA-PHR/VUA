//! Contract anchor for `schemas/bdl-queries/v0.4` (IMP-2 batch-B data
//! source — proposal 015 §7 data stance, accepted): the
//! `downloads.listCompleted` vector drives the real read face, the
//! assembled result validates against the frozen result schema, the
//! negative vectors stay rejected, and the v0.4 closed set is exactly the
//! six query methods.
//!
//! The face's membership predicate is the SAME server-side fact the v0.4
//! adoption guard consumes (`staging_completion` + staging file present at
//! the reported size), so the list is the guard's mirror. The honest empty
//! state (no downloads yet = empty set) is pinned, and paths never appear
//! in the assembled rows.
//!
//! The wire envelope version stays pinned to the routing batch: the
//! v0.4 face freezes here ahead of the provider-host route (the
//! `BDL_QUERIES_SCHEMA_VERSION` envelope constant rises with the core
//! wiring batch, the same contract-first split as bdl-commands v0.4).

use serde_json::{json, Value};
use std::path::PathBuf;
use vua_bdl_store::download_events::{
    DownloadEventConsumer, DownloadEventKind, DownloadEventV01,
};
use vua_bdl_store::{BdlStore, CompletedDownloadRow};

fn schema_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/bdl-queries/v0.4")
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

const LIST_COMPLETED_REQUEST: &str = "examples/downloads-list-completed.request.json";
const LIST_COMPLETED_RESULT: &str = "examples/downloads-list-completed.result.json";
const NEGATIVES: &[&str] = &[
    "examples/invalid-downloads-list-completed-params.json",
    "examples/invalid-schema-version.json",
    // Carried from v0.3: the v0.4 closed set keeps the five v0.3 methods
    // with their params unchanged, so their negative vectors stay negative.
    "examples/invalid-availability-filter.json",
    "examples/invalid-entity-filter.json",
    "examples/invalid-entry-kind.json",
];

fn unique_dir(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "vua-downloads-list-v04-{tag}-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// One delivery recorded in BDL's own event log, backed by a real staging
/// file of exactly `body.len()` bytes (or no file when `stage` is false).
fn ingest_delivery(
    consumer: &DownloadEventConsumer,
    staging_dir: Option<(&PathBuf, &[u8])>,
    download_id: &str,
    completed_at: &str,
) {
    let (stored, received) = match staging_dir {
        Some((dir, body)) => {
            let path = dir.join(format!("{download_id}-material-pack.zip"));
            std::fs::write(&path, body).unwrap();
            (
                Some(path.to_string_lossy().into_owned()),
                Some(body.len() as u64),
            )
        }
        None => (None, None),
    };
    for kind in [DownloadEventKind::Started, DownloadEventKind::Completed] {
        consumer
            .ingest(&DownloadEventV01 {
                schema_version: "0.1".into(),
                kind,
                download_id: download_id.into(),
                attempt: 1,
                source_url: format!("https://booth.example.com/download/1000001/{download_id}"),
                initiated_from_page_url: None,
                url_chain: None,
                suggested_file_name: Some("material-pack.zip".into()),
                stored_path: stored.clone(),
                expected_bytes: received,
                received_bytes: received,
                resumable: false,
                failure_kind: None,
                occurred_at: completed_at.into(),
            })
            .unwrap();
    }
}

fn enveloped(rows: &[CompletedDownloadRow]) -> Value {
    let downloads: Vec<Value> = rows
        .iter()
        .map(|row| {
            json!({
                "downloadId": row.download_id,
                "sourceUrl": row.source_url,
                "suggestedFileName": row.suggested_file_name,
                "receivedBytes": row.received_bytes,
                "completedAt": row.completed_at,
                "adoptedWarehouseItemIds": row.adopted_warehouse_item_ids,
            })
        })
        .collect();
    json!({
        "schemaVersion": "0.4",
        "operation": "downloads.listCompleted",
        "result": { "downloads": downloads },
    })
}

#[test]
fn list_completed_vector_validates_against_the_query_schema() {
    let vector = read_json(LIST_COMPLETED_REQUEST);
    let errors: Vec<String> = query_validator()
        .iter_errors(&vector)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect();
    assert!(errors.is_empty(), "the request vector must validate: {errors:?}");
}

#[test]
fn list_completed_result_vector_validates_against_the_result_schema() {
    let vector = read_json(LIST_COMPLETED_RESULT);
    let errors: Vec<String> = result_validator()
        .iter_errors(&vector)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect();
    assert!(errors.is_empty(), "the result vector must validate: {errors:?}");
}

#[test]
fn negative_vectors_are_rejected_by_the_query_schema() {
    let validator = query_validator();
    for name in NEGATIVES {
        let vector = read_json(name);
        assert!(
            !validator.is_valid(&vector),
            "{name} is a negative vector and must not validate"
        );
    }
}

#[test]
fn operation_closed_set_is_exactly_the_six_queries() {
    let schema = read_json("query.schema.json");
    let operations: Vec<String> = schema["properties"]["operation"]["enum"]
        .as_array()
        .unwrap()
        .iter()
        .map(|value| value.as_str().unwrap().to_owned())
        .collect();
    assert_eq!(
        operations,
        vec![
            "catalog.list",
            "catalog.detail",
            "catalog.status",
            "warehouse.listEntries",
            "warehouse.entryDetail",
            "downloads.listCompleted",
        ]
    );
}

/// The empty state is the final state: with no download facts at all the
/// face answers an empty set — never a guess.
#[test]
fn list_completed_answers_the_honest_empty_set_without_download_facts() {
    let store = BdlStore::open_in_memory().unwrap();
    let rows = store.list_adoptable_downloads().unwrap();
    assert!(rows.is_empty());
    let errors: Vec<String> = result_validator()
        .iter_errors(&enveloped(&rows))
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect();
    assert!(errors.is_empty(), "the empty envelope must validate: {errors:?}");
}

/// The mirror property: only downloads whose fold sits at a completed
/// delivery with the staging file physically present at the reported size
/// list — an in-flight download, a file gone, and a size-drifted file all
/// stay honestly absent. Listed rows carry the adoption links, and paths
/// never appear.
#[test]
fn list_completed_mirrors_the_adoption_guard_predicate() {
    let store = BdlStore::open_in_memory().unwrap();
    let staging_dir = unique_dir("staging");
    let consumer = DownloadEventConsumer::new(&store);

    // Adoptable: completed with the staging file at the reported size.
    ingest_delivery(
        &consumer,
        Some((&staging_dir, b"PK good fixture")),
        "dl-good",
        "2026-09-10T09:00:00.000Z",
    );
    // Not adoptable: completed event but the staging file is gone.
    ingest_delivery(
        &consumer,
        Some((&staging_dir, b"PK vanished")),
        "dl-vanished",
        "2026-09-10T09:01:00.000Z",
    );
    std::fs::remove_file(staging_dir.join("dl-vanished-material-pack.zip")).unwrap();
    // Not adoptable: file drifted from the completed receipt's size.
    ingest_delivery(
        &consumer,
        Some((&staging_dir, b"PK drifted fixture")),
        "dl-drifted",
        "2026-09-10T09:02:00.000Z",
    );
    let drifted = staging_dir.join("dl-drifted-material-pack.zip");
    std::fs::write(&drifted, b"PK drifted").unwrap();

    // Never even completed: no completed event at all.
    consumer
        .ingest(&DownloadEventV01 {
            schema_version: "0.1".into(),
            kind: DownloadEventKind::Started,
            download_id: "dl-unfinished".into(),
            attempt: 1,
            source_url: "https://booth.example.com/download/1000001/unfinished".into(),
            initiated_from_page_url: None,
            url_chain: None,
            suggested_file_name: None,
            stored_path: None,
            expected_bytes: None,
            received_bytes: None,
            resumable: false,
            failure_kind: None,
            occurred_at: "2026-09-10T09:03:00.000Z".into(),
        })
        .unwrap();

    let rows = store.list_adoptable_downloads().unwrap();
    assert_eq!(rows.len(), 1, "only the adoptable delivery lists");
    let row = &rows[0];
    assert_eq!(row.download_id, "dl-good");
    assert_eq!(row.source_url, "https://booth.example.com/download/1000001/dl-good");
    assert_eq!(row.suggested_file_name.as_deref(), Some("material-pack.zip"));
    assert_eq!(row.received_bytes, b"PK good fixture".len() as u64);
    assert!(row.adopted_warehouse_item_ids.is_empty());
    // Paths never appear in the assembled row shape.
    let envelope_text = enveloped(&rows).to_string().to_lowercase();
    assert!(
        !envelope_text.contains("path"),
        "the wire shape must not carry path fields"
    );

    // After a real adoption the row's adoption links light up: the entry
    // whose content came from this download is reported on the row.
    let item = store
        .create_warehouse_item("adopted-pack", "downloaded_material", "2026-09-10T10:00:00.000Z")
        .unwrap();
    let fixture_sha = format!("sha256:{}", "a".repeat(64));
    store
        .record_untrusted_artifact(&vua_bdl_store::NewLocalArtifact {
            artifact_sha256: fixture_sha.clone(),
            size_bytes: 15,
            suggested_file_name: Some("material-pack.zip".into()),
            download_id: Some("dl-good".into()),
            first_seen_at: "2026-09-10T10:00:01.000Z".into(),
        })
        .unwrap();
    store
        .record_artifact_copy(
            &item.warehouse_item_id,
            &fixture_sha,
            "material-pack.zip",
            "whatever",
            vua_bdl_store::CopyRole::Original,
            "2026-09-10T10:00:02.000Z",
        )
        .unwrap();
    let rows = store.list_adoptable_downloads().unwrap();
    assert_eq!(
        rows[0].adopted_warehouse_item_ids,
        vec![item.warehouse_item_id],
        "the adoption link rides the row"
    );
    let errors: Vec<String> = result_validator()
        .iter_errors(&enveloped(&rows))
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect();
    assert!(errors.is_empty(), "the assembled result must validate: {errors:?}");
}
