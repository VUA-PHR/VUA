//! E-VPM-DUAL direct tests for the VpmBackend port: digest completeness,
//! VCC CLI arg shapes, and template-based creation. Each test cites its ORC
//! requirement (ORC-TST-006).

#![allow(clippy::result_large_err)]

use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use vua_orchestrator::{
    FakeProcessRunner, FixedClock, PackageRequestV1, PackageSourceV01, ProcessOutcome,
    ProjectRef, VpmBackend, CREDENTIAL_ENV_REMOVALS,
};
use vua_project_manager::{VccCliBackend, VrcGetLibBackend};

fn unique_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-vpmbe-{label}-{nanos}"))
}

fn backend_with(runner: Arc<FakeProcessRunner>) -> VccCliBackend {
    VccCliBackend::new(
        runner,
        Arc::new(FixedClock::new(&["2026-08-31T09:00:00.000Z"])),
        "vpm",
    )
}

fn success(outcome_stdout: &str) -> ProcessOutcome {
    ProcessOutcome {
        exit_code: Some(0),
        timed_out: false,
        cancelled: false,
        process_tree_clean: true,
        stdout: outcome_stdout.to_owned(),
        stderr: String::new(),
        truncated: false,
    }
}

fn minimal_vpm_project(root: &std::path::Path) -> ProjectRef {
    minimal_vpm_project_at(root, "2022.3.22f1")
}

fn minimal_vpm_project_at(root: &std::path::Path, editor_version: &str) -> ProjectRef {
    fs::create_dir_all(root.join("Packages")).unwrap();
    fs::create_dir_all(root.join("ProjectSettings")).unwrap();
    fs::write(
        root.join("Packages/manifest.json"),
        r#"{"dependencies":{}}"#,
    )
    .unwrap();
    fs::write(
        root.join("Packages/vpm-manifest.json"),
        r#"{"dependencies":{},"locked":{}}"#,
    )
    .unwrap();
    fs::write(
        root.join("ProjectSettings/ProjectVersion.txt"),
        format!("m_EditorVersion: {editor_version}\n"),
    )
    .unwrap();
    ProjectRef {
        id: "vpm-local-spike".to_owned(),
        root: root.to_owned(),
    }
}

// --- R2-2: env 剥离基线 ---

#[test]
fn orc_adp_003_credential_env_removals_strip_tokens_from_children() {
    let base = unique_dir("env");
    fs::create_dir_all(base.join("proj")).unwrap();
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Ok(success("vpm 0.1.28")));
    let backend = backend_with(runner.clone());

    let _ = backend.create_project(&base, "proj", Some("Avatar"));

    let spec = runner.calls()[0].clone();
    assert_eq!(spec.args.first().map(String::as_str), Some("new"));
    for credential in CREDENTIAL_ENV_REMOVALS {
        assert!(
            spec.removals.iter().any(|key| key == credential),
            "{credential} must be stripped (R2-2)"
        );
    }
    // 代理变量保留：vrc-get/VCC 下载可能依赖用户代理。
    assert!(!spec.removals.iter().any(|key| key.contains("PROXY")));
    fs::remove_dir_all(&base).ok();
}

// --- VCC CLI 后端：创建参数形状（官方 vpm/cli.md 语法） ---

#[test]
fn orc_adp_004_vcc_cli_create_project_uses_documented_vpm_new_syntax() {
    let base = unique_dir("vcc-create");
    fs::create_dir_all(&base).unwrap();
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Ok(success("vpm 0.1.28")));
    // 模拟 `vpm new` 的真实落盘：模板目录复制出项目骨架
    runner.on_run(|spec: &vua_orchestrator::ProcessSpec| {
        if spec.args.first().map(String::as_str) == Some("new") {
            let name = &spec.args[1];
            let parent = PathBuf::from(&spec.args[spec.args.len() - 1]);
            let root = parent.join(name);
            fs::create_dir_all(root.join("ProjectSettings")).unwrap();
            fs::write(
                root.join("ProjectSettings/ProjectVersion.txt"),
                "m_EditorVersion: 2022.3.22f1",
            )
            .unwrap();
        }
    });
    let backend = backend_with(runner.clone());

    let project = backend
        .create_project(&base, "My World", Some("World"))
        .unwrap();
    assert!(project.root.join(".vua/project.json").is_file());

    let spec = runner.calls()[0].clone();
    assert_eq!(
        spec.args,
        vec![
            "new".to_owned(),
            "My World".to_owned(),
            "World".to_owned(),
            "-p".to_owned(),
            base.to_string_lossy().into_owned(),
        ]
    );
    fs::remove_dir_all(&base).ok();
}

#[test]
fn orc_adp_004_vcc_cli_rejects_option_like_project_names_before_spawn() {
    let base = unique_dir("vcc-invalid-name");
    fs::create_dir_all(&base).unwrap();
    let runner = Arc::new(FakeProcessRunner::new());
    let backend = backend_with(runner.clone());

    let error = backend
        .create_project(&base, "--help", Some("Avatar"))
        .expect_err("a project name must not be reinterpreted as a CLI option");
    assert_eq!(error.category, vua_orchestrator::ErrorCategory::Validation);
    assert!(runner.calls().is_empty());
    fs::remove_dir_all(&base).ok();
}

// --- 模板创建（ADR-0006 §4：复制 → productName → 校验 → 登记） ---

#[test]
fn orc_adp_004_template_creation_copies_sets_product_name_and_registers() {
    let base = unique_dir("template");
    let environment_root = base.join("VRChatCreatorCompanion");
    let template_dir = environment_root.join("VRCTemplates").join("Avatar");
    fs::create_dir_all(template_dir.join("ProjectSettings")).unwrap();
    fs::create_dir_all(template_dir.join("Packages")).unwrap();
    fs::write(
        template_dir.join("ProjectSettings/ProjectVersion.txt"),
        "m_EditorVersion: 2022.3.22f1",
    )
    .unwrap();
    fs::write(
        template_dir.join("ProjectSettings/ProjectSettings.asset"),
        "someKey: 1\n  productName: TemplateProject\notherKey: 2\n",
    )
    .unwrap();
    fs::write(template_dir.join("Packages/manifest.json"), "{}").unwrap();

    let project = vua_project_manager::create_from_template(
        &environment_root,
        &base.join("workspace"),
        "My Avatar",
        Some("Avatar"),
    )
    .unwrap();

    // 模板内容已复制
    assert!(project.root.join("Packages/manifest.json").is_file());
    // productName 已替换为项目名
    let settings =
        fs::read_to_string(project.root.join("ProjectSettings/ProjectSettings.asset")).unwrap();
    assert!(settings.contains("  productName: \"My Avatar\""));
    assert!(!settings.contains("TemplateProject"));
    // 引擎登记文件存在（FileSystemProjectStore::initialize）
    assert!(project.root.join(".vua/project.json").is_file());
    fs::remove_dir_all(&base).ok();
}

#[test]
fn orc_adp_004_template_missing_is_a_typed_dependency_error() {
    let base = unique_dir("no-template");
    fs::create_dir_all(&base).unwrap();
    let error = vua_project_manager::create_from_template(
        &base,
        &base.join("workspace"),
        "Nope",
        Some("Ghost"),
    )
    .expect_err("missing template must be a typed error");
    assert_eq!(error.code, "vua.vpm.template_missing");
    assert_eq!(error.category, vua_orchestrator::ErrorCategory::Dependency);
    fs::remove_dir_all(&base).ok();
}

#[test]
fn b3_spike_local_package_is_registered_previewed_and_installed_by_vrc_get() {
    let base = unique_dir("local-package");
    let environment_root = base.join("isolated-vpm-environment");
    let package_root = base.join("generated-package");
    fs::create_dir_all(package_root.join("Runtime")).unwrap();
    fs::write(package_root.join("Runtime/hello.txt"), "hello\n").unwrap();
    fs::write(
        package_root.join("package.json"),
        r#"{
  "name": "com.ph-r.vua.local.synthetic",
  "displayName": "Synthetic",
  "version": "0.0.1",
  "unity": "2022.3",
  "vpmDependencies": {}
}"#,
    )
    .unwrap();
    let project = minimal_vpm_project(&base.join("validation-project"));
    let backend = VrcGetLibBackend::with_environment_root(environment_root.clone(), true).unwrap();

    backend.register_local_package(&package_root).unwrap();
    // Registration is idempotent within the private environment.
    backend.register_local_package(&package_root).unwrap();
    let request = PackageRequestV1 {
        package_id: "com.ph-r.vua.local.synthetic".to_owned(),
        version: Some("0.0.1".to_owned()),
    };
    let preview = backend
        .preview_install(&project, std::slice::from_ref(&request))
        .unwrap();
    assert_eq!(preview.items.len(), 1);
    assert_eq!(preview.items[0].package_id, request.package_id);
    assert!(!preview.destructive);

    backend
        .apply_install(&project, &[request], &preview.digest)
        .unwrap();

    let vpm_manifest = fs::read_to_string(project.root.join("Packages/vpm-manifest.json")).unwrap();
    assert!(vpm_manifest.contains("com.ph-r.vua.local.synthetic"));
    assert!(
        project
            .root
            .join("Packages/com.ph-r.vua.local.synthetic/package.json")
            .is_file(),
        "the package must be installed by vrc-get, not copied by the test"
    );
    assert!(environment_root.join("settings.json").is_file());
    fs::remove_dir_all(&base).ok();
}

#[test]
fn b3_spike_rejects_an_invalid_local_package_before_preview() {
    let base = unique_dir("invalid-local-package");
    let package_root = base.join("not-a-package");
    fs::create_dir_all(&package_root).unwrap();
    let backend =
        VrcGetLibBackend::with_environment_root(base.join("isolated-vpm-environment"), true)
            .unwrap();

    let error = backend.register_local_package(&package_root).unwrap_err();
    assert_eq!(error.code, "vua.vpm.local_package_invalid");
    fs::remove_dir_all(&base).ok();
}

#[test]
fn b3_install_roundtrip_is_digest_bound_and_honest_in_preview() {
    let base = unique_dir("b3-install-drift");
    let environment_root = base.join("isolated-vpm-environment");
    let package_root = base.join("generated-package");
    fs::create_dir_all(package_root.join("Runtime")).unwrap();
    fs::write(package_root.join("Runtime/hello.txt"), "hello\n").unwrap();
    fs::write(
        package_root.join("package.json"),
        r#"{
  "name": "com.ph-r.vua.local.synthetic",
  "displayName": "Synthetic",
  "version": "0.0.1",
  "unity": "2022.3",
  "vpmDependencies": {}
}"#,
    )
    .unwrap();
    let project = minimal_vpm_project(&base.join("install-project"));
    let backend = VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();
    backend.register_local_package(&package_root).unwrap();
    let request = PackageRequestV1 {
        package_id: "com.ph-r.vua.local.synthetic".to_owned(),
        version: Some("0.0.1".to_owned()),
    };
    let preview = backend
        .preview_install(&project, std::slice::from_ref(&request))
        .unwrap();
    assert_eq!(preview.items.len(), 1);
    assert_eq!(preview.items[0].kind, vua_orchestrator::ChangeKindV1::Install);

    // The double-digest discipline on the install path (026 A2 frozen word
    // face, same port-level anchor as the A1 removal test): a stale
    // confirmation is refused as a typed RECOVERABLE conflict — re-preview
    // and re-confirm, never a silent overwrite (honesty rule 3).
    let forged = format!("0{}", &preview.digest[1..]);
    assert_ne!(forged, preview.digest);
    let error = backend
        .apply_install(&project, std::slice::from_ref(&request), &forged)
        .unwrap_err();
    assert_eq!(error.code, "vua.vpm.preview_drift");
    assert_eq!(error.category, vua_orchestrator::ErrorCategory::Conflict);
    assert!(
        error.recoverable,
        "digest drift is a recoverable conflict, never a terminal failure"
    );
    assert!(
        !project
            .root
            .join("Packages/com.ph-r.vua.local.synthetic/package.json")
            .is_file(),
        "a drifted apply must not install anything"
    );

    // The honest confirmation passes and really installs via vrc-get.
    backend
        .apply_install(&project, &[request], &preview.digest)
        .unwrap();
    let manifest = fs::read_to_string(project.root.join("Packages/vpm-manifest.json")).unwrap();
    assert!(
        manifest.contains("com.ph-r.vua.local.synthetic"),
        "the confirmed install is applied by vrc-get"
    );
    fs::remove_dir_all(&base).ok();
}

/// The port install receipt contract (026 A2 wiring, 2026-09-19): the
/// backend answers `{"applied": items}` — the item array the wire layer
/// lifts verbatim into the frozen audit receipt (`appliedItems`, with the
/// confirmedDigest echo and the requestedPackages rows). A result without
/// that array is a port-contract violation the wire refuses; this test
/// pins the shape the audit receipt's third part is sourced from.
#[test]
fn b3_apply_install_receipt_carries_the_applied_items() {
    let base = unique_dir("b3-install-receipt");
    let environment_root = base.join("isolated-vpm-environment");
    let package_root = base.join("generated-package");
    fs::create_dir_all(package_root.join("Runtime")).unwrap();
    fs::write(package_root.join("Runtime/hello.txt"), "hello\n").unwrap();
    fs::write(
        package_root.join("package.json"),
        r#"{
  "name": "com.ph-r.vua.local.synthetic",
  "displayName": "Synthetic",
  "version": "0.0.1",
  "unity": "2022.3",
  "vpmDependencies": {}
}"#,
    )
    .unwrap();
    let project = minimal_vpm_project(&base.join("receipt-project"));
    let backend = VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();
    backend.register_local_package(&package_root).unwrap();
    let request = PackageRequestV1 {
        package_id: "com.ph-r.vua.local.synthetic".to_owned(),
        version: Some("0.0.1".to_owned()),
    };
    let preview = backend
        .preview_install(&project, std::slice::from_ref(&request))
        .unwrap();

    let receipt = backend
        .apply_install(&project, &[request], &preview.digest)
        .unwrap();
    let applied = receipt
        .get("applied")
        .and_then(|value| value.as_array())
        .expect("the port receipt carries the applied item array");
    assert_eq!(applied.len(), preview.items.len());
    let item = &applied[0];
    assert_eq!(item["packageId"], "com.ph-r.vua.local.synthetic");
    assert_eq!(item["kind"], "install");
    assert_eq!(
        item["version"], "0.0.1",
        "install items carry the resolved target version"
    );
    assert!(
        item["reason"].is_null(),
        "install items carry no machine reason (removal-only field)"
    );
    fs::remove_dir_all(&base).ok();
}

/// The frozen A2 version-selection semantics at the port (026 A2 freeze
/// batch): a null request row resolves to the resolver-picked LATEST
/// STABLE (`VersionSelector::latest_for`, prereleases never auto-selected)
/// and an exact pin rides `specific_version` verbatim — the wire receipt's
/// `requestedPackages` rows carry these semantics, this test pins the port
/// behavior they project.
#[test]
fn b3_preview_install_null_version_selects_the_latest_stable() {
    let base = unique_dir("b3-install-null-version");
    let environment_root = base.join("isolated-vpm-environment");
    let package_root = base.join("generated-package");
    fs::create_dir_all(package_root.join("Runtime")).unwrap();
    fs::write(package_root.join("Runtime/hello.txt"), "hello\n").unwrap();
    fs::write(
        package_root.join("package.json"),
        r#"{
  "name": "com.ph-r.vua.local.synthetic",
  "displayName": "Synthetic",
  "version": "0.0.1",
  "unity": "2022.3",
  "vpmDependencies": {}
}"#,
    )
    .unwrap();
    let project = minimal_vpm_project(&base.join("null-version-project"));
    let backend = VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();
    backend.register_local_package(&package_root).unwrap();

    // null row: the resolver picks the latest stable (the only version
    // registered here), the plan item carries the resolved version.
    let null_version = PackageRequestV1 {
        package_id: "com.ph-r.vua.local.synthetic".to_owned(),
        version: None,
    };
    let preview = backend
        .preview_install(&project, std::slice::from_ref(&null_version))
        .unwrap();
    assert_eq!(preview.items.len(), 1);
    assert_eq!(
        preview.items[0].version.as_deref(),
        Some("0.0.1"),
        "a null row resolves to the latest stable version"
    );

    // exact pin: the requested string rides through verbatim.
    let pinned = PackageRequestV1 {
        package_id: "com.ph-r.vua.local.synthetic".to_owned(),
        version: Some("0.0.1".to_owned()),
    };
    let preview = backend
        .preview_install(&project, std::slice::from_ref(&pinned))
        .unwrap();
    assert_eq!(preview.items[0].version.as_deref(), Some("0.0.1"));
    fs::remove_dir_all(&base).ok();
}

/// A3 port facts (proposal 026 A3 wiring batch, 2026-09-19): the served
/// wire row `packages.registerOps` is gated on
/// `VpmBackend::register_capabilities().register_local_package` BEFORE
/// submit, so the port-level capability declaration IS the flip switch —
/// the frozen word face keeps the row honestly unavailable until the
/// environment override lands, and this test pins the flip. Same law as
/// the 025 catalog declaration: the implementing backend declares exactly
/// its implemented face; the non-implementing backend stays declared-none
/// (ORC-DEV-004: no implementation, no reservation).
#[test]
fn b3_register_capabilities_declare_exactly_the_local_package_face() {
    let base = unique_dir("b3-register-caps");
    let backend =
        VrcGetLibBackend::with_environment_root(base.join("isolated-vpm-environment"), true)
            .unwrap();

    let caps = backend.register_capabilities();
    assert!(
        caps.register_local_package,
        "the library implements registration in-process (vrc-get 0.0.16 \
         Settings::add_user_package), so the override declares it"
    );

    // VccCliBackend implements no registration arm — it stays declared-none
    // (honest absence: an undeclared face can never be requested through
    // the wire gate, and the trait-default port arm stays unreachable).
    let cli = backend_with(Arc::new(FakeProcessRunner::new()));
    assert_eq!(
        cli.register_capabilities(),
        vua_orchestrator::RegisterCapabilities::NONE,
        "no implementation, no declaration"
    );
    fs::remove_dir_all(&base).ok();
}

/// The isolated-settings I/O leg (026 A3 freeze word face): a failure
/// loading the backend environment's settings.json answers
/// `vua.vpm.local_package_register_failed` (ExternalFailure) through
/// `map_local_package_io` — never a guessed success, never a validation
/// code (the settings leg is the environment's, not the package's; the
/// package-shaped refusals own `local_package_invalid`). The wire folds
/// this code into the rejected `execution_failed` arm carrying the
/// original code in detail (per-code mapping, mapping table entry 2).
#[test]
fn b3_register_io_failure_answers_local_package_register_failed() {
    let base = unique_dir("b3-register-io");
    let environment_root = base.join("isolated-vpm-environment");
    // A package-shaped world passes the two validation legs
    // (canonicalize + package.json presence) and reaches the settings leg.
    let package_root = base.join("generated-package");
    fs::create_dir_all(package_root.join("Runtime")).unwrap();
    fs::write(
        package_root.join("package.json"),
        r#"{
  "name": "com.ph-r.vua.local.synthetic",
  "displayName": "Synthetic",
  "version": "0.0.1",
  "unity": "2022.3",
  "vpmDependencies": {}
}"#,
    )
    .unwrap();
    // The environment's settings.json as a DIRECTORY makes the settings
    // load fail with a non-NotFound io error (try_load_json answers None
    // only for a missing file — a directory open propagates), which rides
    // map_local_package_io into the typed register-failed code.
    fs::create_dir_all(environment_root.join("settings.json")).unwrap();
    let backend = VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();

    let error = backend.register_local_package(&package_root).unwrap_err();
    assert_eq!(error.code, "vua.vpm.local_package_register_failed");
    assert_eq!(error.category, vua_orchestrator::ErrorCategory::ExternalFailure);
    fs::remove_dir_all(&base).ok();
}

/// Idempotent set-add, environment-side evidence (026 A3 freeze word
/// face): first registration (Success) and the repeat (AlreadyAdded)
/// collapse into ONE success fact — the environment keeps EXACTLY ONE
/// userPackageFolders entry for the package root, no duplicate row is
/// ever written. This is the port-side fact the wire's idempotence test
/// (two rounds, identical registered receipts) projects.
#[test]
fn b3_register_idempotence_keeps_exactly_one_settings_entry() {
    let base = unique_dir("b3-register-idempotent");
    let environment_root = base.join("isolated-vpm-environment");
    let package_root = base.join("generated-package");
    fs::create_dir_all(package_root.join("Runtime")).unwrap();
    fs::write(
        package_root.join("package.json"),
        r#"{
  "name": "com.ph-r.vua.local.synthetic",
  "displayName": "Synthetic",
  "version": "0.0.1",
  "unity": "2022.3",
  "vpmDependencies": {}
}"#,
    )
    .unwrap();
    let backend = VrcGetLibBackend::with_environment_root(environment_root.clone(), true).unwrap();

    backend.register_local_package(&package_root).unwrap();
    backend.register_local_package(&package_root).unwrap();

    let settings: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(environment_root.join("settings.json")).unwrap())
            .unwrap();
    let folders = settings["userPackageFolders"]
        .as_array()
        .expect("settings.json carries the userPackageFolders array");
    assert_eq!(
        folders.len(),
        1,
        "Success and AlreadyAdded collapse into one success fact: exactly one entry"
    );
    let registered = folders[0].as_str().unwrap();
    let canonical = std::fs::canonicalize(&package_root).unwrap();
    assert_eq!(
        std::path::PathBuf::from(registered),
        canonical,
        "the single entry is the canonicalized package root"
    );
    fs::remove_dir_all(&base).ok();
}


// --- B6: general project/package management path ---

/// Builds the B3 local-package world (isolated environment + generated
/// package + project) and installs the package through the digest-bound
/// path, so removal and listing tests start from a real installed state.
fn installed_world(label: &str) -> (VrcGetLibBackend, ProjectRef, PathBuf) {
    let base = unique_dir(label);
    let environment_root = base.join("isolated-vpm-environment");
    let package_root = base.join("generated-package");
    fs::create_dir_all(package_root.join("Runtime")).unwrap();
    fs::write(package_root.join("Runtime/hello.txt"), "hello\n").unwrap();
    fs::write(
        package_root.join("package.json"),
        r#"{
  "name": "com.ph-r.vua.local.synthetic",
  "displayName": "Synthetic",
  "version": "0.0.1",
  "unity": "2022.3",
  "vpmDependencies": {}
}"#,
    )
    .unwrap();
    let project = minimal_vpm_project(&base.join("managed-project"));
    let backend = VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();
    backend.register_local_package(&package_root).unwrap();
    let request = PackageRequestV1 {
        package_id: "com.ph-r.vua.local.synthetic".to_owned(),
        version: Some("0.0.1".to_owned()),
    };
    let preview = backend
        .preview_install(&project, std::slice::from_ref(&request))
        .unwrap();
    backend
        .apply_install(&project, &[request], &preview.digest)
        .unwrap();
    (backend, project, base)
}

#[test]
fn b6_list_packages_reports_the_installed_content_of_one_project() {
    let (backend, project, base) = installed_world("b6-list");
    let packages = backend.list_packages(&project).unwrap();
    assert_eq!(packages.len(), 1);
    assert_eq!(packages[0].package_id, "com.ph-r.vua.local.synthetic");
    assert_eq!(packages[0].version, "0.0.1");
    assert!(packages[0].dependencies.is_empty());
    fs::remove_dir_all(&base).ok();
}

#[test]
fn b6_remove_roundtrip_is_digest_bound_and_honest_in_preview() {
    let (backend, project, base) = installed_world("b6-remove");
    let package_ids = vec!["com.ph-r.vua.local.synthetic".to_owned()];

    let preview = backend.preview_remove(&project, &package_ids).unwrap();
    assert_eq!(preview.items.len(), 1);
    assert_eq!(
        preview.items[0].kind,
        vua_orchestrator::ChangeKindV1::Remove
    );
    assert!(!preview.destructive, "removing the only package breaks nothing");

    // The double-digest discipline: a stale confirmation is refused as a
    // typed RECOVERABLE conflict (026 A1 frozen word face: re-preview and
    // re-confirm, never a silent overwrite — honesty rule 3 at the port).
    let forged = format!("sha256-deadbeef{}", &preview.digest[14..]);
    let error = backend
        .apply_remove(&project, &package_ids, &forged)
        .unwrap_err();
    assert_eq!(error.code, "vua.vpm.preview_drift");
    assert_eq!(error.category, vua_orchestrator::ErrorCategory::Conflict);
    assert!(
        error.recoverable,
        "digest drift is a recoverable conflict, never a terminal failure"
    );

    backend
        .apply_remove(&project, &package_ids, &preview.digest)
        .unwrap();
    let packages = backend.list_packages(&project).unwrap();
    assert!(packages.is_empty(), "the package is gone from the project");
    let manifest = fs::read_to_string(project.root.join("Packages/vpm-manifest.json")).unwrap();
    assert!(
        !manifest.contains("com.ph-r.vua.local.synthetic"),
        "the manifest no longer references the removed package"
    );
    fs::remove_dir_all(&base).ok();
}

/// The port removal receipt contract (026 A1 wiring, 2026-09-19): the
/// backend answers `{"removed": items}` — the item array the wire layer
/// lifts verbatim into the frozen audit receipt (`removedItems`). A result
/// without that array is a port-contract violation the wire refuses; this
/// test pins the shape the audit receipt's third part is sourced from.
#[test]
fn b6_apply_remove_receipt_carries_the_removed_items() {
    let (backend, project, base) = installed_world("b6-remove-receipt");
    let package_ids = vec!["com.ph-r.vua.local.synthetic".to_owned()];
    let preview = backend.preview_remove(&project, &package_ids).unwrap();

    let applied = backend
        .apply_remove(&project, &package_ids, &preview.digest)
        .unwrap();
    let removed = applied
        .get("removed")
        .and_then(|value| value.as_array())
        .expect("the port receipt carries the removed item array");
    assert_eq!(removed.len(), preview.items.len());
    let item = &removed[0];
    assert_eq!(item["packageId"], "com.ph-r.vua.local.synthetic");
    assert_eq!(item["kind"], "remove");
    assert!(
        item["version"].is_null(),
        "removal items carry no target version"
    );
    assert!(
        item["reason"].as_str().is_some_and(|reason| !reason.is_empty()),
        "removal items carry the machine reason"
    );
    fs::remove_dir_all(&base).ok();
}

#[test]
fn b6_removing_an_uninstalled_package_is_a_typed_validation_error() {
    let (backend, project, base) = installed_world("b6-remove-miss");
    let preview_result = backend.preview_remove(&project, &["com.example.absent".to_owned()]);
    let error = preview_result.expect_err("an absent package must be a typed error");
    assert_eq!(error.code, "vua.vpm.package_not_installed");
    assert_eq!(
        error.category,
        vua_orchestrator::ErrorCategory::Validation
    );
    fs::remove_dir_all(&base).ok();
}

#[test]
fn b6_project_registry_reports_vcc_compatible_registrations() {
    let (backend, project, base) = installed_world("b6-registry");

    // Seed the VCC-compatible registry the way a manager does: register the
    // project through the library's own project-management API.
    let io = vrc_get_vpm::io::DefaultEnvironmentIo::new(
        base.join("isolated-vpm-environment").into_boxed_path(),
    );
    let project_io =
        vrc_get_vpm::io::DefaultProjectIo::new(project.root.clone().into_boxed_path());
    tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(async move {
            let mut connection = vrc_get_vpm::environment::VccDatabaseConnection::connect(&io)
                .await
                .unwrap();
            let unity_project = vrc_get_vpm::UnityProject::load(project_io).await.unwrap();
            connection.add_project(&unity_project).await.unwrap();
            // The registry persists only on an explicit save.
            connection.save(&io).await.unwrap();
        });

    let registered = backend.project_registry().unwrap();
    assert_eq!(registered.len(), 1);
    assert_eq!(
        registered[0].path,
        project.root.to_string_lossy().into_owned()
    );
    assert_eq!(registered[0].name, "managed-project");
    fs::remove_dir_all(&base).ok();
}

// --- 025 P2 read faces: subscription world + per-package catalog ---

/// Writes a synthetic repository-cache file (the flat LocalCachedRepository
/// JSON shape vrc-get itself persists) with three versions of one synthetic
/// package: a yanked 0.9.0, a compatible 1.0.0, and a 2.0.0 whose minimum
/// Unity (2022.4) exceeds the 2022.3 test project. All data synthetic.
fn synthetic_repo_cache(cache_path: &std::path::Path) {
    fs::create_dir_all(cache_path.parent().unwrap()).unwrap();
    // The LocalCachedRepository file wraps the repository document in a
    // `repo` key (the shape vrc-get itself persists).
    let cache = serde_json::json!({
        "repo": {
            "name": "Synthetic Repo",
            "id": "com.vua.test.repo.synthetic",
            "url": "https://example.invalid/vua/synthetic-repo.json",
            "packages": {
            "com.vua.test.catalog.synthetic": {
                "versions": {
                    "0.9.0": {
                        "name": "com.vua.test.catalog.synthetic",
                        "displayName": "Synthetic Catalog",
                        "version": "0.9.0",
                        "unity": "2022.3",
                        "vpmDependencies": {},
                        "vrc-get": { "yanked": true }
                    },
                    "1.0.0": {
                        "name": "com.vua.test.catalog.synthetic",
                        "displayName": "Synthetic Catalog",
                        "version": "1.0.0",
                        "unity": "2022.3",
                        "vpmDependencies": {}
                    },
                    "2.0.0": {
                        "name": "com.vua.test.catalog.synthetic",
                        "displayName": "Synthetic Catalog",
                        "version": "2.0.0",
                        "unity": "2022.4",
                        "vpmDependencies": {}
                    }
                }
            }
            }
        }
    });
    fs::write(cache_path, cache.to_string()).unwrap();
}

/// Writes a minimal VCC-shaped settings.json carrying exactly the given
/// userRepos entries (the subscription face is the world).
fn synthetic_settings(environment_root: &std::path::Path, user_repos: serde_json::Value) {
    fs::create_dir_all(environment_root).unwrap();
    fs::write(
        environment_root.join("settings.json"),
        serde_json::json!({ "userRepos": user_repos }).to_string(),
    )
    .unwrap();
}

fn p2_repo_world(label: &str) -> (VrcGetLibBackend, ProjectRef, std::path::PathBuf) {
    let base = unique_dir(label);
    let environment_root = base.join("isolated-vpm-environment");
    let cached_repo = environment_root.join("Repos").join("synthetic-repo.json");
    synthetic_repo_cache(&cached_repo);
    synthetic_settings(
        &environment_root,
        serde_json::json!([{
            "localPath": cached_repo.display().to_string(),
            "url": "https://example.invalid/vua/synthetic-repo.json"
        }]),
    );
    let project = minimal_vpm_project(&base.join("managed-project"));
    let backend = VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();
    (backend, project, base)
}

#[test]
fn p2_list_repos_projects_the_subscription_face_with_per_repo_cache_facts() {
    let base = unique_dir("p2-repos");
    let environment_root = base.join("isolated-vpm-environment");
    let cached_repo = environment_root.join("Repos").join("synthetic-repo.json");
    synthetic_repo_cache(&cached_repo);
    let never_refreshed = environment_root.join("Repos").join("never-refreshed.json");
    synthetic_settings(
        &environment_root,
        serde_json::json!([
            {
                "localPath": cached_repo.display().to_string(),
                "name": "Synthetic Repo",
                "id": "com.vua.test.repo.synthetic",
                "url": "https://example.invalid/vua/synthetic-repo.json"
            },
            {
                "localPath": never_refreshed.display().to_string(),
                "url": "https://example.invalid/vua/never-refreshed.json"
            },
            {
                "localPath": base.join("local-directory-repo").display().to_string()
            }
        ]),
    );
    let backend =
        VrcGetLibBackend::with_environment_root(environment_root.clone(), true).unwrap();

    // The capability is declared exactly now that the faces are implemented.
    assert!(backend.catalog_capabilities().catalog);

    let rows = backend.list_repos().unwrap();
    assert_eq!(rows.len(), 3, "row order = subscription order, nothing dropped");
    let cached = &rows[0];
    assert_eq!(
        cached.repo_id.as_deref(),
        Some("com.vua.test.repo.synthetic")
    );
    assert_eq!(cached.name.as_deref(), Some("Synthetic Repo"));
    assert_eq!(
        cached.url.as_deref(),
        Some("https://example.invalid/vua/synthetic-repo.json")
    );
    assert!(cached.cached, "the refreshed cache file exists");

    let stale = &rows[1];
    assert!(!stale.cached, "subscribed-but-never-refreshed is its own honest listed state");
    assert_eq!(stale.name.as_deref(), None, "absent facts project as null");
    assert_eq!(stale.repo_id.as_deref(), None);

    let local_dir = &rows[2];
    assert_eq!(
        local_dir.url.as_deref(),
        None,
        "a local-directory repo carries no url (honest null)"
    );
    assert!(!local_dir.cached, "its repo.json was never established");

    // VccCliBackend stays declared-none with the default absence arm (zero
    // change to the five-bit closed set or its backend).
    let cli = backend_with(Arc::new(FakeProcessRunner::new()));
    assert!(!cli.catalog_capabilities().catalog);
    let error = cli.list_repos().unwrap_err();
    assert_eq!(error.code, "vua.vpm.capability_missing");
    fs::remove_dir_all(&base).ok();
}

#[test]
fn p2_list_repos_answers_an_honest_empty_subscription() {
    let base = unique_dir("p2-repos-empty");
    let environment_root = base.join("isolated-vpm-environment");
    synthetic_settings(&environment_root, serde_json::json!([]));
    let backend =
        VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();

    let rows = backend.list_repos().unwrap();
    assert!(
        rows.is_empty(),
        "zero subscriptions is a valid, honest answer"
    );
    fs::remove_dir_all(&base).ok();
}

#[test]
fn p2_package_catalog_reports_repo_versions_with_judgment_facts() {
    let (backend, project, base) = p2_repo_world("p2-catalog");

    let catalog = backend
        .package_catalog(&project, "com.vua.test.catalog.synthetic")
        .unwrap();
    assert_eq!(
        catalog.source,
        PackageSourceV01::Repo,
        "the package resolves from a repository cache"
    );
    assert_eq!(
        catalog.project_path,
        project.root.to_string_lossy().into_owned()
    );
    assert_eq!(catalog.package_id, "com.vua.test.catalog.synthetic");
    assert_eq!(catalog.display_name.as_deref(), Some("Synthetic Catalog"));
    assert!(!catalog.installed);
    assert_eq!(
        catalog.update_available, None,
        "not installed = judgment not executed (null), never \"no update\""
    );
    let versions: Vec<&str> = catalog
        .versions
        .iter()
        .map(|row| row.version.as_str())
        .collect();
    assert_eq!(versions, vec!["0.9.0", "1.0.0", "2.0.0"], "semver ascending");
    assert!(
        catalog.versions[0].yanked,
        "the repo-cache yank fact carries verbatim"
    );
    assert!(!catalog.versions[1].yanked);
    assert_eq!(
        catalog.versions[0].compatible, Some(true),
        "a 2022.3 minimum is satisfied by the 2022.3 project"
    );
    assert_eq!(catalog.versions[1].compatible, Some(true));
    assert_eq!(
        catalog.versions[2].compatible, Some(false),
        "2.0.0 requires a newer Unity — false, not null"
    );
    fs::remove_dir_all(&base).ok();
}

/// Synthetic repository cache for the 025 inline special-case pins: the
/// public VPM package identifiers the library's special cases key on,
/// with fully synthetic versions and unity constraints.
fn special_case_repo_cache(cache_path: &std::path::Path) {
    fs::create_dir_all(cache_path.parent().unwrap()).unwrap();
    let cache = serde_json::json!({
        "repo": {
            "name": "Synthetic SpecialCase Repo",
            "id": "com.vua.test.repo.specialcase",
            "url": "https://example.invalid/vua/specialcase-repo.json",
            "packages": {
                "com.vrchat.avatars": {
                    "versions": {
                        "3.4.0": {
                            "name": "com.vrchat.avatars",
                            "version": "3.4.0",
                            "unity": "2019.4",
                            "vpmDependencies": {}
                        },
                        "3.5.0": {
                            "name": "com.vrchat.avatars",
                            "version": "3.5.0",
                            "unity": "2022.3",
                            "vpmDependencies": {}
                        }
                    }
                },
                "com.vrchat.core.vpm-resolver": {
                    "versions": {
                        "0.1.26": {
                            "name": "com.vrchat.core.vpm-resolver",
                            "version": "0.1.26",
                            "unity": "2019.4",
                            "vpmDependencies": {}
                        },
                        "0.1.27": {
                            "name": "com.vrchat.core.vpm-resolver",
                            "version": "0.1.27",
                            "unity": "2022.3",
                            "vpmDependencies": {}
                        }
                    }
                }
            }
        }
    });
    fs::write(cache_path, cache.to_string()).unwrap();
}

/// 025 inline thread (core stance on implementation-stance item 2: the
/// general-branch-only landing was rejected — the field must re-create the
/// FULL library `unity_compatible` semantics). Each divergence example
/// below is a case the general minimum-constraint branch alone would get
/// WRONG (it would answer true where the library answers false, or miss
/// the exact-match arm), so these pins prove the special cases are live:
/// VRCSDK 3.4 (2019-only SDK) and resolver ≤0.1.26 against a 2022 project
/// judge false; VRCSDK 3.5+ against a Unity 6000 project judges false
/// (the exact-major.minor arm exists precisely to prevent treating
/// VRCSDK-for-2022 as Unity-6000-compatible); the 2019 project keeps the
/// special-case positives; resolver 0.1.27 escapes the special case into
/// the general branch. Synthetic data only; the com.vrchat.* identifiers
/// are the public names the special cases key on.
#[test]
fn p2_package_catalog_compatible_recreates_the_full_library_special_cases() {
    let base = unique_dir("p2-specialcase");
    let environment_root = base.join("isolated-vpm-environment");
    let cached_repo = environment_root.join("Repos").join("specialcase-repo.json");
    special_case_repo_cache(&cached_repo);
    synthetic_settings(
        &environment_root,
        serde_json::json!([{
            "localPath": cached_repo.display().to_string(),
            "url": "https://example.invalid/vua/specialcase-repo.json"
        }]),
    );
    let backend = VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();

    let project_2022 = minimal_vpm_project(&base.join("proj-2022"));
    let project_6000 = minimal_vpm_project_at(&base.join("proj-6000"), "6000.0.23f1");
    let project_2019 = minimal_vpm_project_at(&base.join("proj-2019"), "2019.4.31f1");

    let compatible_of = |project: &ProjectRef, package: &str, version: &str| {
        let catalog = backend.package_catalog(project, package).unwrap();
        catalog
            .versions
            .iter()
            .find(|row| row.version == version)
            .unwrap_or_else(|| panic!("version {version} of {package} must be enumerated"))
            .compatible
    };

    // 2022.3 project: the 2019-only special cases judge false exactly where
    // the general branch would answer true.
    assert_eq!(
        compatible_of(&project_2022, "com.vrchat.avatars", "3.4.0"),
        Some(false),
        "VRCSDK 3.4 is 2019-only: false on a 2022 project (general branch would say true)"
    );
    assert_eq!(
        compatible_of(&project_2022, "com.vrchat.core.vpm-resolver", "0.1.26"),
        Some(false),
        "resolver ≤0.1.26 is 2019-only: false on a 2022 project (general branch would say true)"
    );
    assert_eq!(
        compatible_of(&project_2022, "com.vrchat.core.vpm-resolver", "0.1.27"),
        Some(true),
        "resolver 0.1.27 escapes the special case into the general branch"
    );
    assert_eq!(
        compatible_of(&project_2022, "com.vrchat.avatars", "3.5.0"),
        Some(true),
        "VRCSDK 3.5 with a 2022.3 constraint on a 2022.3 project: exact match holds"
    );

    // Unity 6000 project + VRCSDK 3.5+ (the divergence that motivated the
    // library's exact-match arm): library false, general branch would say
    // true (6000 >= 2022.3).
    assert_eq!(
        compatible_of(&project_6000, "com.vrchat.avatars", "3.5.0"),
        Some(false),
        "VRCSDK-for-2022 must NOT read compatible against a Unity 6000 project"
    );

    // 2019.4 project: the special-case positives hold...
    assert_eq!(
        compatible_of(&project_2019, "com.vrchat.avatars", "3.4.0"),
        Some(true),
        "VRCSDK 3.4 on its 2019 home: true"
    );
    assert_eq!(
        compatible_of(&project_2019, "com.vrchat.core.vpm-resolver", "0.1.26"),
        Some(true),
        "resolver 0.1.26 on its 2019 home: true"
    );
    // ...and the exact-match arm still rejects a 2022-constrained SDK.
    assert_eq!(
        compatible_of(&project_2019, "com.vrchat.avatars", "3.5.0"),
        Some(false),
        "VRCSDK 3.5 (2022.3 constraint) on a 2019.4 project: exact match fails"
    );

    fs::remove_dir_all(&base).ok();
}

/// 025 inline ruling 6 / packages-catalog v0.2 freeze batch: the backend
/// declares the v0.2 word face exactly when it implements the V02 method
/// (ORC-DEV-004: no implementation, no reservation), and the v0.2 result
/// carries the REQUIRED cacheSourced disclosure fact (informational, never
/// an error). In this offline synthetic world every catalog answer is
/// served through the cache-degradation path, so the fact reads true; the
/// v0.1 face keeps serving the field-less frozen shape (its type has no
/// such key, so a fabricated annotation is unrepresentable there).
#[test]
fn p2_package_catalog_v02_declares_and_discloses_the_cache_sourced_fact() {
    let (backend, project, base) = p2_repo_world("p2-catalog-v02");

    assert!(
        backend.catalog_v02(),
        "the backend declares v0.2 exactly when it implements package_catalog_v02"
    );

    let catalog = backend
        .package_catalog_v02(&project, "com.vua.test.catalog.synthetic")
        .unwrap();
    assert!(
        catalog.cache_sourced,
        "offline world = this result was served through the cache-degradation path"
    );
    // The v0.2 facts are the frozen v0.1 facts verbatim plus the disclosure.
    assert_eq!(catalog.package_id, "com.vua.test.catalog.synthetic");
    assert_eq!(catalog.project_path, project.root.to_string_lossy());
    assert_eq!(catalog.versions.len(), 3, "same enumerated facts");
    assert_eq!(catalog.versions[1].compatible, Some(true));
    fs::remove_dir_all(&base).ok();
}

#[test]
fn p2_package_catalog_judges_update_available_against_the_installed_version() {
    let (backend, project, base) = p2_repo_world("p2-update");
    let manifest_path = project.root.join("Packages/vpm-manifest.json");

    // Installed 0.9.0 (the yanked one): a strictly newer compatible version
    // (1.0.0) exists, so the frozen judgment answers true. Yanked candidates
    // and versions beyond the project's Unity are excluded by the selector.
    // Installed = the package folder under Packages/ PLUS the locked entry.
    let install = |version: &str| {
        let package_dir = project
            .root
            .join("Packages")
            .join("com.vua.test.catalog.synthetic");
        fs::create_dir_all(&package_dir).unwrap();
        fs::write(
            package_dir.join("package.json"),
            format!(
                r#"{{"name":"com.vua.test.catalog.synthetic","displayName":"Synthetic Catalog","version":"{version}","unity":"2022.3","vpmDependencies":{{}}}}"#
            ),
        )
        .unwrap();
        fs::write(
            &manifest_path,
            format!(
                r#"{{"dependencies":{{"com.vua.test.catalog.synthetic":{{"version":"{version}"}}}},"locked":{{"com.vua.test.catalog.synthetic":{{"version":"{version}","dependencies":{{}}}}}}}}"#
            ),
        )
        .unwrap();
    };
    install("0.9.0");
    let catalog = backend
        .package_catalog(&project, "com.vua.test.catalog.synthetic")
        .unwrap();
    assert!(catalog.installed);
    assert_eq!(
        catalog.update_available,
        Some(true),
        "a strictly newer compatible version exists"
    );

    // Installed 1.0.0 is already the latest compatible version: an honest
    // false conclusion, never null.
    install("1.0.0");
    let catalog = backend
        .package_catalog(&project, "com.vua.test.catalog.synthetic")
        .unwrap();
    assert_eq!(catalog.update_available, Some(false));
    fs::remove_dir_all(&base).ok();
}

#[test]
fn p2_package_catalog_local_source_is_honest_and_an_absent_package_is_typed() {
    // Register-only world: the package exists in the environment's local set
    // but is NOT installed in the project (no apply step).
    let base = unique_dir("p2-local");
    let environment_root = base.join("isolated-vpm-environment");
    let package_root = base.join("generated-package");
    fs::create_dir_all(package_root.join("Runtime")).unwrap();
    fs::write(package_root.join("Runtime/hello.txt"), "hello\n").unwrap();
    fs::write(
        package_root.join("package.json"),
        r#"{
  "name": "com.ph-r.vua.local.synthetic",
  "displayName": "Synthetic",
  "version": "0.0.1",
  "unity": "2022.3",
  "vpmDependencies": {}
}"#,
    )
    .unwrap();
    let project = minimal_vpm_project(&base.join("managed-project"));
    let backend = VrcGetLibBackend::with_environment_root(environment_root, true).unwrap();
    backend.register_local_package(&package_root).unwrap();

    let catalog = backend
        .package_catalog(&project, "com.ph-r.vua.local.synthetic")
        .unwrap();
    assert_eq!(
        catalog.source,
        PackageSourceV01::Local,
        "registered in the environment without any repository"
    );
    assert!(
        catalog.versions.is_empty(),
        "a local-source package honestly carries no repo versions"
    );
    assert!(
        !catalog.installed,
        "registered in the environment is not installed in this project"
    );
    assert_eq!(catalog.update_available, None);
    assert_eq!(catalog.display_name.as_deref(), Some("Synthetic"));

    let error = backend
        .package_catalog(&project, "com.example.absent")
        .unwrap_err();
    assert_eq!(
        error.code, "vua.vpm.no_matching_package",
        "absent from both repo caches and the local set is the reused typed code"
    );
    fs::remove_dir_all(&base).ok();
}

