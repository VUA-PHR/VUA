//! packages-repos / packages-catalog v0.1 consumer tests (proposal 025 P2
//! freeze batch, 2026-09-17): the core-side consumer of the P2 read faces.
//! The frozen `schemas/packages-repos/v0.1/` and `schemas/packages-catalog/
//! v0.1/` schemas pin the wire result shapes; the example vectors drive
//! JSON-Schema validation directly, and a fake backend's port facts are
//! projected through serde and validated against the same schemas — the
//! port→wire consumer loop is nailed here first. The REAL backend
//! consumption (`VrcGetLibBackend` implementing `list_repos` /
//! `package_catalog`) is the environment implementation slice and lands
//! with its own tests; this file pins the contract side and the trait
//! default absence arms (a backend that does not implement the P2 faces
//! answers `capability_missing` and declares `CatalogCapabilities::NONE`).
//! Everything runs against synthetic data — no machine-specific facts, no
//! network.

#![allow(clippy::result_large_err)]

use std::fs;
use std::path::Path;

use serde_json::{json, Value};
use vua_orchestrator::{
    CatalogCapabilities, CatalogVersionV01, PackageCatalogV01, PackageRequestV1, PackageSourceV01,
    ProjectRef, RepoInfoV01, VpmBackend,
};
use vua_orchestrator::AppErrorV1;

fn read_repo_json(relative: &str) -> Value {
    // Tests run from the crate directory; the schemas live at the repo root.
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let path = Path::new(manifest_dir).join("../..").join(relative);
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

fn repos_command_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_repo_json(
        "schemas/packages-repos/v0.1/command.schema.json",
    ))
    .unwrap()
}

fn repos_result_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_repo_json(
        "schemas/packages-repos/v0.1/result.schema.json",
    ))
    .unwrap()
}

fn catalog_command_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_repo_json(
        "schemas/packages-catalog/v0.1/command.schema.json",
    ))
    .unwrap()
}

fn catalog_result_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_repo_json(
        "schemas/packages-catalog/v0.1/result.schema.json",
    ))
    .unwrap()
}

fn violations(validator: &jsonschema::Validator, instance: &Value) -> Vec<String> {
    validator
        .iter_errors(instance)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect()
}

/// The trait-default backend: implements only the methods without defaults,
/// inheriting every default absence arm (the P2 faces and the catalog
/// capability declaration among them).
struct MinimalBackend;

impl VpmBackend for MinimalBackend {
    fn name(&self) -> &'static str {
        "minimal-fake"
    }
    fn capabilities(&self) -> vua_orchestrator::VpmCapabilities {
        vua_orchestrator::VpmCapabilities {
            create_project: false,
            preview_install: false,
            list_packages: false,
            remove_packages: false,
            project_registry: false,
        }
    }
    fn preview_install(
        &self,
        _project: &ProjectRef,
        _packages: &[PackageRequestV1],
    ) -> Result<vua_orchestrator::ChangePreviewV1, AppErrorV1> {
        unreachable!("not exercised in this suite")
    }
    fn apply_install(
        &self,
        _project: &ProjectRef,
        _packages: &[PackageRequestV1],
        _confirmed_digest: &str,
    ) -> Result<serde_json::Value, AppErrorV1> {
        unreachable!("not exercised in this suite")
    }
    fn create_project(
        &self,
        _parent: &std::path::Path,
        _name: &str,
        _template: Option<&str>,
    ) -> Result<ProjectRef, AppErrorV1> {
        unreachable!("not exercised in this suite")
    }
}

/// A backend that implements the P2 read faces with synthetic facts (the
/// contract-side consumer loop; the real facts come with the environment
/// implementation slice).
struct FakeCatalogBackend;

impl VpmBackend for FakeCatalogBackend {
    fn name(&self) -> &'static str {
        "fake-catalog"
    }
    fn capabilities(&self) -> vua_orchestrator::VpmCapabilities {
        vua_orchestrator::VpmCapabilities {
            create_project: false,
            preview_install: false,
            list_packages: false,
            remove_packages: false,
            project_registry: false,
        }
    }
    fn preview_install(
        &self,
        _project: &ProjectRef,
        _packages: &[PackageRequestV1],
    ) -> Result<vua_orchestrator::ChangePreviewV1, AppErrorV1> {
        unreachable!("not exercised in this suite")
    }
    fn apply_install(
        &self,
        _project: &ProjectRef,
        _packages: &[PackageRequestV1],
        _confirmed_digest: &str,
    ) -> Result<serde_json::Value, AppErrorV1> {
        unreachable!("not exercised in this suite")
    }
    fn create_project(
        &self,
        _parent: &std::path::Path,
        _name: &str,
        _template: Option<&str>,
    ) -> Result<ProjectRef, AppErrorV1> {
        unreachable!("not exercised in this suite")
    }
    fn catalog_capabilities(&self) -> CatalogCapabilities {
        CatalogCapabilities { catalog: true }
    }
    fn list_repos(&self) -> Result<Vec<RepoInfoV01>, AppErrorV1> {
        Ok(vec![
            RepoInfoV01 {
                repo_id: Some("official".into()),
                name: Some("Official".into()),
                url: Some("https://vpm.example/vpm.json".into()),
                local_path: Some("C:\\cache\\official.json".into()),
                cached: true,
            },
            RepoInfoV01 {
                repo_id: Some("curated".into()),
                name: Some("Curated".into()),
                url: Some("https://vpm.example/curated.json".into()),
                local_path: None,
                cached: false,
            },
            RepoInfoV01 {
                repo_id: Some("local-tools".into()),
                name: Some("Local tools".into()),
                url: None,
                local_path: Some("D:\\vpm-local\\repo.json".into()),
                cached: true,
            },
        ])
    }
    fn package_catalog(
        &self,
        project: &ProjectRef,
        package_id: &str,
    ) -> Result<PackageCatalogV01, AppErrorV1> {
        Ok(PackageCatalogV01 {
            project_path: project.root.to_string_lossy().to_string(),
            package_id: package_id.to_owned(),
            display_name: Some("Avatar Optimizer".into()),
            source: PackageSourceV01::Repo,
            installed: true,
            update_available: Some(true),
            versions: vec![
                CatalogVersionV01 { version: "1.6.2".into(), yanked: true, compatible: Some(true) },
                CatalogVersionV01 { version: "1.7.0".into(), yanked: false, compatible: Some(true) },
                CatalogVersionV01 { version: "1.9.0-beta.1".into(), yanked: false, compatible: None },
            ],
        })
    }
}

#[test]
fn repos_schema_admits_positive_vectors_and_rejects_negative_ones() {
    let command = repos_command_validator();
    let result = repos_result_validator();

    let request = read_repo_json("schemas/packages-repos/v0.1/examples/packages-list-repos.request.json");
    assert!(command.is_valid(&request), "{:?}", violations(&command, &request));

    let listing = read_repo_json("schemas/packages-repos/v0.1/examples/packages-list-repos.result.json");
    assert!(result.is_valid(&listing), "{:?}", violations(&result, &listing));

    let empty = read_repo_json("schemas/packages-repos/v0.1/examples/packages-list-repos-empty.result.json");
    assert!(result.is_valid(&empty), "{:?}", violations(&result, &empty));

    // A global configuration face accepts NO parameter key.
    let extra_param = read_repo_json("schemas/packages-repos/v0.1/examples/invalid-repos-params-extra-key.request.json");
    assert!(
        !command.is_valid(&extra_param),
        "an extra params key must be a shape violation"
    );

    // The false-assertion guard: the health face is a P2 non-goal, an
    // invented health field invalidates the row.
    let health_row = read_repo_json("schemas/packages-repos/v0.1/examples/invalid-repo-row-health-field.result.json");
    assert!(!result.is_valid(&health_row), "invented health field must be invalid");

    // cached is the REQUIRED per-repo cache-hit fact: a row without it is
    // invalid, never silently tolerated.
    let missing_cached = read_repo_json("schemas/packages-repos/v0.1/examples/invalid-repo-row-missing-cached.result.json");
    assert!(!result.is_valid(&missing_cached), "missing cached fact must be invalid");
}

#[test]
fn catalog_schema_admits_positive_vectors_and_rejects_negative_ones() {
    let command = catalog_command_validator();
    let result = catalog_result_validator();

    let request = read_repo_json("schemas/packages-catalog/v0.1/examples/packages-package-catalog.request.json");
    assert!(command.is_valid(&request), "{:?}", violations(&command, &request));

    for positive in [
        "schemas/packages-catalog/v0.1/examples/packages-package-catalog.result.json",
        "schemas/packages-catalog/v0.1/examples/packages-package-catalog-local.result.json",
        "schemas/packages-catalog/v0.1/examples/packages-package-catalog-not-installed.result.json",
    ] {
        let doc = read_repo_json(positive);
        assert!(result.is_valid(&doc), "{positive}: {:?}", violations(&result, &doc));
    }

    let missing_id = read_repo_json("schemas/packages-catalog/v0.1/examples/invalid-catalog-missing-package-id.request.json");
    assert!(!command.is_valid(&missing_id), "missing packageId must be invalid");

    // On-demand granularity: no pagination / preference switches exist —
    // an invented params key is a shape violation.
    let extra_param = read_repo_json("schemas/packages-catalog/v0.1/examples/invalid-catalog-extra-param.request.json");
    assert!(!command.is_valid(&extra_param), "an extra params key must be a shape violation");

    let invented_field = read_repo_json("schemas/packages-catalog/v0.1/examples/invalid-catalog-version-extra-field.result.json");
    assert!(!result.is_valid(&invented_field), "invented changelogUrl must be invalid");

    // source is a two-state word; the desktop third state composes with
    // `installed` and "installed" as a source VALUE is outside the word
    // list.
    let word_outside = read_repo_json("schemas/packages-catalog/v0.1/examples/invalid-catalog-source-word-outside.result.json");
    assert!(!result.is_valid(&word_outside), "source=installed is outside the two-state word");
}

#[test]
fn trait_default_answers_capability_missing_and_declares_none() {
    let backend = MinimalBackend;
    assert_eq!(backend.catalog_capabilities(), CatalogCapabilities::NONE);

    let err = backend.list_repos().unwrap_err();
    assert_eq!(err.code, "vua.vpm.capability_missing");

    let err = backend
        .package_catalog(
            &ProjectRef { id: "demo".into(), root: std::path::PathBuf::from("C:/proj") },
            "com.example.pkg",
        )
        .unwrap_err();
    assert_eq!(err.code, "vua.vpm.capability_missing");
}

#[test]
fn fake_backend_port_facts_project_onto_the_frozen_wire_shapes() {
    let backend = FakeCatalogBackend;
    assert!(backend.catalog_capabilities().catalog);

    // Port facts → serde projection → repos result schema.
    let repos = backend.list_repos().unwrap();
    let envelope = json!({
        "schemaVersion": "0.1",
        "operation": "packages.listRepos",
        "result": {
            "schemaVersion": "vua.packages-repos/v0.1",
            "repos": repos,
        },
    });
    let validator = repos_result_validator();
    assert!(validator.is_valid(&envelope), "{:?}", violations(&validator, &envelope));
    assert_eq!(envelope["result"]["schemaVersion"], "vua.packages-repos/v0.1");
    let rows = envelope["result"]["repos"].as_array().unwrap();
    assert_eq!(rows.len(), 3);
    // Nullable identifier/location facts project verbatim (null = honest
    // absence), and the cache-hit fact rides every row.
    assert_eq!(rows[2]["url"], serde_json::Value::Null);
    assert_eq!(rows[1]["cached"], serde_json::Value::Bool(false));

    // Port facts → serde projection → catalog result schema. The family
    // const is an envelope-assembly fact (P1 discipline), stamped here.
    let catalog = backend
        .package_catalog(
            &ProjectRef { id: "demo".into(), root: std::path::PathBuf::from("C:/proj") },
            "com.anatawa12.avatar-optimizer",
        )
        .unwrap();
    let mut result = serde_json::to_value(&catalog).unwrap();
    result["schemaVersion"] = json!("vua.packages-catalog/v0.1");
    let envelope = json!({
        "schemaVersion": "0.1",
        "operation": "packages.packageCatalog",
        "result": result,
    });
    let validator = catalog_result_validator();
    assert!(validator.is_valid(&envelope), "{:?}", violations(&validator, &envelope));
    assert_eq!(envelope["result"]["schemaVersion"], "vua.packages-catalog/v0.1");
    // Enum projection: the port snake_case source lands as the frozen
    // two-state word.
    assert_eq!(envelope["result"]["source"], "repo");
    // The judgment-conclusion null discipline: versions carry per-version
    // compatibility with null = not evaluated (unknown project Unity
    // version), never false.
    let versions = envelope["result"]["versions"].as_array().unwrap();
    assert_eq!(versions[2]["compatible"], serde_json::Value::Null);
}
