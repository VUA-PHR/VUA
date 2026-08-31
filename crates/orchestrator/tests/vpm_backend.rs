//! E-VPM-DUAL direct tests for the VpmBackend port: digest completeness,
//! VCC CLI arg shapes, and template-based creation. Each test cites its ORC
//! requirement (ORC-TST-006).

#![allow(clippy::result_large_err)]

use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use vua_orchestrator::{
    FakeProcessRunner, FixedClock, ProcessOutcome, VccCliBackend, VpmBackend,
    CREDENTIAL_ENV_REMOVALS,
};

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
        stdout: outcome_stdout.to_owned(),
        stderr: String::new(),
        truncated: false,
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

    let project = vua_orchestrator::create_from_template(
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
    let error = vua_orchestrator::create_from_template(
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
