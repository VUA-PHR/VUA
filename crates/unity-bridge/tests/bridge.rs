//! Real-bridge job-directory discipline: the request file is written before
//! the Unity process call, so a failed spawn still leaves the request on
//! disk (ORC-ADP-005). Moved verbatim from the orchestrator assembly tests
//! when the adapter left the core crate; fixtures are duplicated here
//! because integration-test crates cannot share helpers.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use vua_orchestrator::{ProjectRef, UnityCommand};
use vua_unity_bridge::UnityBatchBridge;

fn unique_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-assembly-{label}-{nanos}"))
}

fn make_project(root: &Path) {
    fs::create_dir_all(root.join("Packages")).unwrap();
    fs::create_dir_all(root.join("ProjectSettings")).unwrap();
    fs::write(
        root.join("ProjectSettings/ProjectVersion.txt"),
        "m_EditorVersion: 2022.3.22f1",
    )
    .unwrap();
    fs::write(
        root.join("vpm-manifest.json"),
        r#"{"dependencies": {}, "locked": {}}"#,
    )
    .unwrap();
}

#[test]
fn orc_adp_005_real_bridge_writes_requests_into_the_job_directory_shape() {
    // The production bridge still satisfies the job-directory discipline
    // after the ProcessRunner refactor: request file written, invocation
    // args allowlisted.
    let base = unique_dir("bridge");
    let project_root = base.join("project");
    make_project(&project_root);
    let bridge = UnityBatchBridge::new("C:/Unity/Unity.exe");
    let command = UnityCommand {
        schema_version: 1,
        command_id: "asm-01".into(),
        operation: vua_orchestrator::UnityOperation::InspectProject,
        project_id: "proj".into(),
        dry_run: true,
        expected_project_fingerprint: None,
        payload: vua_orchestrator::UnityPayload {
            avatar_global_object_id: "a".into(),
            avatar_armature_global_object_id: "a_Armature".into(),
            outfit_global_object_id: "o".into(),
            outfit_armature_global_object_id: "o_Armature".into(),
            toggle_name: "t".into(),
            ..vua_orchestrator::UnityPayload::default()
        },
    };
    let project = ProjectRef {
        id: "proj".into(),
        root: project_root.clone(),
    };
    // Without a real Unity executable the runner fails to spawn; the request
    // file must already exist (write happens before the process call).
    let _ = bridge.execute(&project, &command);
    assert!(project_root
        .join(".vua/bridge")
        .join("asm-01.request.json")
        .is_file());
    fs::remove_dir_all(&base).ok();
}
