//! B3 real-Unity local matrix (M3 gate). These tests launch the actual
//! Unity 2022.3.22f1 in batchmode against synthetic projects built in the
//! temp directory, so they are ignored by default and never run in CI:
//!
//!   VUA_UNITY_EXECUTABLE="C:\Program Files\Unity\Hub\Editor\2022.3.22f1\Editor\Unity.exe" \
//!   cargo test -p vua-orchestrator --test material_exec_real -- --ignored --nocapture
//!
//! The synthetic target project embeds the repository Bridge package plus a
//! minimal stub for the Modular Avatar assembly reference — the stub exists
//! only inside the temp project, never in the repository.

use flate2::write::GzEncoder;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tar::{Builder, Header};

use vua_orchestrator::{
    BuildRecordStore, FileSystemSnapshotStore, MaterialEntryMode, MaterialExecutor,
    MaterialIntakeConfirmationV01, MaterialIntakeEngine,
    MaterialIntakeStepKind, ProjectRef, RiskDecisionChoice, RiskDecisionV01,
    UnityBatchBridge, UnityBridge, VpmBackend,
};

const UNITY_VERSION_LINE: &str = "m_EditorVersion: 2022.3.22f1\nm_EditorVersionWithEdition: 2022.3.22f1\n";

// --- scaffolding ---

fn temp_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-mexec-real-{label}-{nanos}"))
}

fn copy_dir_recursive(source: &Path, target: &Path) -> std::io::Result<()> {
    fs::create_dir_all(target)?;
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let target = target.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_dir_recursive(&entry.path(), &target)?;
        } else {
            fs::copy(entry.path(), target)?;
        }
    }
    Ok(())
}

/// Builds a minimal but compilable Unity project embedding the repository
/// Bridge package. The Modular Avatar reference is satisfied by an empty
/// stub package — the Bridge's B3 operations never touch MA types.
fn build_target_project(label: &str) -> (PathBuf, ProjectRef) {
    let root = temp_dir(label);
    let bridge_package_src =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../unity/Packages/com.ph-r.vua");
    fs::create_dir_all(root.join("Assets")).unwrap();
    fs::create_dir_all(root.join("ProjectSettings")).unwrap();
    fs::create_dir_all(root.join("Packages")).unwrap();
    fs::write(root.join("ProjectSettings/ProjectVersion.txt"), UNITY_VERSION_LINE).unwrap();
    // A real AMF production project carries the VRChat SDK (VRC expression
    // assets inside material packages need its types to load). The SDK is
    // copied from an existing local VCC project — discovered through the
    // standard VCC settings file — instead of a registry round-trip, which
    // packages.vrchat.com denies without VRChat account credentials. The
    // candidate project's UPM manifest dependencies (com.unity.* runtime
    // packages) are inherited so the copied SDK compiles.
    let mut manifest_dependencies = serde_json::json!({
        "com.unity.textmeshpro": "3.0.6"
    });
    let mut sdk_seeded = false;
    let vcc_settings = std::env::var("LOCALAPPDATA")
        .map(|local| PathBuf::from(local).join("VRChatCreatorCompanion/settings.json"))
        .ok();
    if let Some(settings_path) = vcc_settings {
        if let Ok(settings) = fs::read_to_string(&settings_path) {
            if let Ok(value) = serde_json::from_str::<Value>(&settings) {
                if let Some(projects) = value.get("userProjects").and_then(Value::as_array) {
                    for candidate in projects {
                        let Some(candidate) = candidate.as_str() else {
                            continue;
                        };
                        let sdk = Path::new(candidate).join("Packages/com.vrchat.avatars");
                        if !sdk.is_dir() {
                            continue;
                        }
                        for package in ["com.vrchat.avatars", "com.vrchat.base"] {
                            let from = Path::new(candidate).join("Packages").join(package);
                            if from.is_dir() {
                                copy_dir_recursive(
                                    &from,
                                    &root.join("Packages").join(package),
                                )
                                .unwrap();
                            }
                        }
                        // Inherit the candidate's UPM manifest dependencies
                        // (com.unity.* runtime packages) so the copied SDK
                        // compiles in the bare project.
                        if let Ok(candidate_manifest) = fs::read_to_string(
                            Path::new(candidate).join("Packages/manifest.json"),
                        ) {
                            let deps = serde_json::from_str::<Value>(&candidate_manifest)
                                .ok()
                                .and_then(|manifest| {
                                    manifest.get("dependencies").cloned()
                                })
                                .and_then(|deps| deps.as_object().cloned());
                            if let Some(deps) = deps {
                                if let Some(target) = manifest_dependencies.as_object_mut() {
                                    for (key, dep) in deps {
                                        target.insert(key, dep);
                                    }
                                }
                            }
                        }
                        sdk_seeded = true;
                        break;
                    }
                }
            }
        }
    }
    println!("sdk seeded from local VCC project: {sdk_seeded}");
    fs::write(
        root.join("Packages/manifest.json"),
        serde_json::to_string_pretty(&serde_json::json!({
            "dependencies": manifest_dependencies
        }))
        .unwrap(),
    )
    .unwrap();
    // Copy only the runtime pieces of the Bridge package; the NUnit test
    // assembly has no framework to resolve against in this bare project.
    copy_dir_recursive(
        &bridge_package_src.join("Editor"),
        &root.join("Packages/com.ph-r.vua/Editor"),
    )
    .unwrap();
    fs::copy(bridge_package_src.join("package.json"), root.join("Packages/com.ph-r.vua/package.json"))
        .unwrap();
    // Stub package satisfying the Bridge asmdef reference.
    let stub = root.join("Packages/nadena.dev.modular-avatar.core");
    fs::create_dir_all(&stub).unwrap();
    fs::write(
        stub.join("package.json"),
        r#"{ "name": "nadena.dev.modular-avatar.core", "version": "0.0.0-stub" }"#,
    )
    .unwrap();
    fs::write(
        stub.join("nadena.dev.modular-avatar.core.asmdef"),
        r#"{ "name": "nadena.dev.modular-avatar.core", "rootNamespace": "" }"#,
    )
    .unwrap();
    // The Bridge's editor code references the MA component types; the stub
    // declares them so the assembly compiles. B3 operations never touch
    // them — they exist for install_outfit/create_toggle only.
    // The Bridge's editor code references the MA component types; the stub
    // declares them with the exact member shapes the Bridge uses. B3
    // operations never touch them — they exist for install_outfit and
    // create_toggle only.
    fs::write(
        stub.join("StubComponents.cs"),
        r#"using System.Collections.Generic;
using UnityEngine;

namespace nadena.dev.modular_avatar.core
{
    public class AvatarObjectReference
    {
        public AvatarObjectReference() { }
        public AvatarObjectReference(GameObject target) { }
    }

    public enum PortableControlType { Menu, Toggle, Submenu, Action }

    public class PortableControl
    {
        public PortableControlType Type;
        public int Value;
    }

    public class ToggledObject
    {
        public AvatarObjectReference Object;
        public bool Active;
    }

    public class ModularAvatarMergeArmature : MonoBehaviour
    {
        public AvatarObjectReference mergeTarget;
        public void InferPrefixSuffix() { }
    }

    public class ModularAvatarMenuInstaller : MonoBehaviour { }

    public class ModularAvatarMenuItem : MonoBehaviour
    {
        public string label;
        public PortableControl PortableControl = new PortableControl();
        public bool isDefault;
    }

    public class ModularAvatarObjectToggle : MonoBehaviour
    {
        public List<ToggledObject> Objects;
    }
}
"#,
    )
    .unwrap();
    (
        root.clone(),
        ProjectRef {
            id: "project".into(),
            root,
        },
    )
}

/// Writes a minimal valid `.unitypackage` (tar.gz with guid folders,
/// `asset`, `asset.meta`, `pathname` entries per Unity convention).
fn write_unitypackage(path: &Path, entries: &[(&str, &str)]) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).unwrap();
    }
    let file = fs::File::create(path).unwrap();
    let mut tar = Builder::new(GzEncoder::new(file, flate2::Compression::default()));
    for (guid, pathname) in entries {
        let mut meta = Header::new_gnu();
        let meta_bytes = format!("fileFormatVersion: 2\nguid: {guid}\n").into_bytes();
        meta.set_size(meta_bytes.len() as u64);
        meta.set_cksum();
        tar.append_data(&mut meta, format!("{guid}/asset.meta"), meta_bytes.as_slice()).unwrap();
        let mut body = Header::new_gnu();
        body.set_size(b"synthetic asset payload".len() as u64);
        body.set_cksum();
        tar.append_data(&mut body, format!("{guid}/asset"), b"synthetic asset payload".as_slice())
            .unwrap();
        let mut path_header = Header::new_gnu();
        let path_bytes = pathname.as_bytes();
        path_header.set_size(path_bytes.len() as u64);
        path_header.set_cksum();
        tar.append_data(&mut path_header, format!("{guid}/pathname"), path_bytes).unwrap();
    }
    tar.finish().unwrap();
}

fn unity_executable() -> PathBuf {
    PathBuf::from(std::env::var("VUA_UNITY_EXECUTABLE").expect(
        "VUA_UNITY_EXECUTABLE must point at Unity.exe (2022.3.22f1)",
    ))
}

fn fingerprint(bridge: &dyn UnityBridge, project: &ProjectRef) -> String {
    let result = bridge
        .execute(
            project,
            &vua_orchestrator::UnityCommand {
                schema_version: 1,
                command_id: format!("harness-inspect-{}", std::process::id()),
                operation: vua_orchestrator::UnityOperation::InspectProject,
                project_id: project.id.clone(),
                dry_run: true,
                expected_project_fingerprint: None,
                payload: Default::default(),
            },
        )
        .expect("real inspect must succeed");
    assert_eq!(result.status, vua_orchestrator::ResultStatus::Succeeded);
    result
        .data
        .get("projectFingerprint")
        .and_then(Value::as_str)
        .expect("inspect returns the project fingerprint")
        .to_owned()
}

use serde_json::Value;

fn confirmation_for(plan: &vua_orchestrator::MaterialIntakePlanV01) -> MaterialIntakeConfirmationV01 {
    MaterialIntakeConfirmationV01 {
        plan: plan.clone(),
        risk_decision: RiskDecisionV01 {
            choice: RiskDecisionChoice::Continue,
            source_fingerprint: plan.source.source_fingerprint.clone(),
            risk_fingerprint: plan.source.risk_fingerprint.clone(),
            remember_for_session: false,
        },
        confirmed_at: "2026-09-04T00:00:00Z".into(),
        correlation_id: "real-corr".into(),
    }
}

// --- the real vertical slice ---

#[test]
#[ignore = "manual: launches real Unity 2022.3.22f1 (VUA_UNITY_EXECUTABLE) against a real source folder (VUA_REAL_SOURCE_FOLDER)"]
fn m3_real_direct_vertical_slice_succeeds_and_records() {
    let unity = unity_executable();
    let source = PathBuf::from(
        std::env::var("VUA_REAL_SOURCE_FOLDER")
            .expect("VUA_REAL_SOURCE_FOLDER must hold the .unitypackage files"),
    );
    let (project_root, project) = build_target_project("direct");

    let bridge: Arc<dyn UnityBridge> = Arc::new(UnityBatchBridge::new(unity));
    let fingerprint = fingerprint(bridge.as_ref(), &project);
    println!("real project fingerprint: {fingerprint}");

    let inspection = MaterialIntakeEngine
        .inspect_folder(&source, "real-corr")
        .expect("source inspects");
    let plan = MaterialIntakeEngine
        .plan(
            MaterialEntryMode::DirectUnityPackage,
            project.id.clone(),
            fingerprint,
            inspection.clone(),
            "real-corr",
        )
        .expect("plan builds");
    let confirmation = confirmation_for(&plan);

    let started = Instant::now();
    let executor = MaterialExecutor::new(
        bridge,
        FileSystemSnapshotStore,
        Arc::new(NoVpm),
        BuildRecordStore::new(project_root.join(".vua/records")),
        Arc::new(vua_orchestrator::SystemClock),
        temp_dir("direct-temp"),
        "2022.3.22f1",
    );
    let report = executor.execute(&confirmation, &source, &project, &project_root.join(".vua/artifacts"));
    let elapsed = started.elapsed();
    println!("executor wall time: {elapsed:?}");

    assert_eq!(
        report.status,
        vua_orchestrator::MaterialExecutionStatus::Succeeded,
        "report: {report:?}"
    );
    assert_eq!(report.rollback, vua_orchestrator::RollbackOutcome::NotNeeded);
    assert!(report
        .completed_steps
        .contains(&MaterialIntakeStepKind::WriteBuildRecord));

    let record = vua_orchestrator::BuildRecordStore::new(project_root.join(".vua/records"))
        .read(&report.build_record_id.expect("record id"))
        .expect("receipt published");
    let validation = record.validation.expect("validation evidence");
    assert!(validation.unity_validated, "a real Unity validated the assets");
    let import_job = record
        .bridge_jobs
        .iter()
        .find(|job| job.operation.contains("ImportUnityPackage"))
        .expect("import evidence");
    assert!(
        import_job.changed_paths.len() >= 100,
        "a real avatar package imports a large asset tree: {:?}",
        import_job.changed_paths.len()
    );
    println!("imported: {:?}", import_job.changed_paths.len());

    // The snapshot stays on disk as the recovery point of record.
    assert!(project_root.join(".vua/snapshots").exists());

    if project_root.exists() {
        fs::remove_dir_all(&project_root).unwrap();
    }
    if source.exists() {
        fs::remove_dir_all(&source).unwrap();
    }
}

/// A stale project fingerprint must be rejected by the real Bridge and the
/// verified snapshot must be restored — the typed path a concurrent change
/// would take in production.
#[test]
#[ignore = "manual: launches real Unity 2022.3.22f1 (VUA_UNITY_EXECUTABLE)"]
fn m3_real_stale_fingerprint_is_rejected_and_restored() {
    let unity = unity_executable();
    let (project_root, project) = build_target_project("reject");
    let source = temp_dir("reject-source");
    fs::create_dir_all(&source).unwrap();
    write_unitypackage(
        &source.join("outfit-pack.unitypackage"),
        &[(
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "Assets/VuaSynthetic/SampleOutfit.txt",
        )],
    );

    let bridge: Arc<dyn UnityBridge> = Arc::new(UnityBatchBridge::new(unity));
    let inspection = MaterialIntakeEngine
        .inspect_folder(&source, "real-corr")
        .expect("source inspects");
    // Deliberately stale: the fingerprint cannot match the real project.
    let plan = MaterialIntakeEngine
        .plan(
            MaterialEntryMode::DirectUnityPackage,
            project.id.clone(),
            "stale-fingerprint",
            inspection,
            "real-corr",
        )
        .expect("plan builds");
    let confirmation = confirmation_for(&plan);

    let executor = MaterialExecutor::new(
        bridge,
        FileSystemSnapshotStore,
        Arc::new(NoVpm),
        BuildRecordStore::new(project_root.join(".vua/records")),
        Arc::new(vua_orchestrator::SystemClock),
        temp_dir("reject-temp"),
        "2022.3.22f1",
    );
    let report = executor.execute(&confirmation, &source, &project, &project_root.join(".vua/artifacts"));

    assert_eq!(
        report.status,
        vua_orchestrator::MaterialExecutionStatus::Failed,
        "the real Bridge rejects the stale fingerprint"
    );
    assert_eq!(
        report.error_code.as_deref(),
        Some("vua.material.bridge_rejected")
    );
    assert_eq!(report.rollback, vua_orchestrator::RollbackOutcome::Restored);

    let record = vua_orchestrator::BuildRecordStore::new(project_root.join(".vua/records"))
        .read(&report.build_record_id.expect("record id"))
        .expect("failed runs are recorded");
    assert_eq!(record.status, vua_orchestrator::BuildRecordStatus::Failed);
    assert!(
        record.bridge_jobs[0]
            .status
            .eq_ignore_ascii_case("rejected"),
        "the real Bridge rejected the stale fingerprint: {:?}",
        record.bridge_jobs[0]
    );

    if project_root.exists() {
        fs::remove_dir_all(&project_root).unwrap();
    }
    if source.exists() {
        fs::remove_dir_all(&source).unwrap();
    }
}

/// Placeholder backend: the direct path never touches VPM installation.
struct NoVpm;

impl VpmBackend for NoVpm {
    fn name(&self) -> &'static str {
        "none"
    }

    fn capabilities(&self) -> vua_orchestrator::VpmCapabilities {
        vua_orchestrator::VpmCapabilities {
            create_project: false,
            preview_install: false,
        }
    }

    fn create_project(
        &self,
        _parent: &Path,
        _name: &str,
        _template: Option<&str>,
    ) -> Result<ProjectRef, vua_orchestrator::AppErrorV1> {
        panic!("the direct path must not reach the vpm backend")
    }

    fn preview_install(
        &self,
        _project: &ProjectRef,
        _packages: &[vua_orchestrator::PackageRequestV1],
    ) -> Result<vua_orchestrator::ChangePreviewV1, vua_orchestrator::AppErrorV1> {
        panic!("the direct path must not reach the vpm backend")
    }

    fn apply_install(
        &self,
        _project: &ProjectRef,
        _packages: &[vua_orchestrator::PackageRequestV1],
        _confirmed_digest: &str,
    ) -> Result<serde_json::Value, vua_orchestrator::AppErrorV1> {
        panic!("the direct path must not reach the vpm backend")
    }
}
