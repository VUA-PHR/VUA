use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};
use vua_orchestrator::{
    AvatarSetupRequest, AvatarSetupWorkflow, Diagnostic, DiagnosticSeverity,
    FileSystemProjectStore, FileSystemSnapshotStore, ProjectRef, ResultStatus, UnityResult,
    VpmProjectProvisioner, WorkflowStage,
};
use vua_unity_bridge::UnityBatchBridge;

fn project() -> ProjectRef {
    let suffix = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    ProjectRef {
        id: format!("test-{suffix}"),
        root: std::env::temp_dir().join(format!("vua-test-{suffix}")),
    }
}

fn initialize(project: &ProjectRef) {
    fs::create_dir_all(project.root.join("Assets")).unwrap();
    fs::create_dir_all(project.root.join("Packages")).unwrap();
    fs::create_dir_all(project.root.join("ProjectSettings")).unwrap();
    fs::write(
        project.root.join("ProjectSettings/ProjectVersion.txt"),
        "m_EditorVersion: 2022.3.22f1",
    )
    .unwrap();
    FileSystemProjectStore::initialize(project).unwrap();
}

#[test]
fn vpm_project_creation_is_honestly_unsupported_in_the_cli_backend() {
    // Fix 4: `vrc-get new` never existed in the upstream CLI command enum
    // (verified against the vrc-get source). Creation stays honestly
    // unsupported until the dual-backend slice (ADR-0006 draft) lands.
    let provisioner = VpmProjectProvisioner::new("vrc-get");
    let parent = std::env::temp_dir();
    let error = provisioner
        .create_avatar_project(&parent, "My Avatar", "id")
        .expect_err("creation must be reported as unsupported");
    assert!(matches!(
        error,
        vua_orchestrator::ProjectProvisionError::Unsupported(_)
    ));
}

#[test]
fn serialized_command_matches_the_cross_language_wire_shape() {
    let payload = vua_orchestrator::UnityPayload {
        avatar_global_object_id: "avatar".into(),
        avatar_armature_global_object_id: "avatar-armature".into(),
        outfit_global_object_id: "outfit".into(),
        outfit_armature_global_object_id: "outfit-armature".into(),
        toggle_name: "夏装".into(),
        ..vua_orchestrator::UnityPayload::default()
    };
    let command = vua_orchestrator::UnityCommand {
        schema_version: 1,
        command_id: "wire-01".into(),
        operation: vua_orchestrator::UnityOperation::InstallOutfit,
        project_id: "p1".into(),
        dry_run: false,
        expected_project_fingerprint: Some("v1:abc".into()),
        payload,
    };
    let json = serde_json::to_value(command).unwrap();
    assert_eq!(json["schemaVersion"], 1);
    assert_eq!(json["operation"], "install_outfit");
    assert_eq!(json["payload"]["toggleName"], "夏装");
}

#[test]
fn unity_invocation_is_allowlisted_and_does_not_use_a_shell() {
    let args = UnityBatchBridge::invocation_args(
        std::path::Path::new("C:/Project"),
        std::path::Path::new("C:/Project/.vua/bridge/request.json"),
        std::path::Path::new("C:/Project/.vua/bridge/result.json"),
    );
    assert!(args
        .windows(2)
        .any(|pair| pair == ["-executeMethod", "Vua.Editor.Bridge.BridgeEntryPoint.Run"]));
    assert!(!args
        .iter()
        .any(|argument| argument.contains("cmd.exe") || argument.contains("powershell")));
}

fn request(project: ProjectRef) -> AvatarSetupRequest {
    AvatarSetupRequest {
        workflow_id: "outfit-demo".into(),
        project,
        avatar_global_object_id: "avatar".into(),
        avatar_armature_global_object_id: "avatar-armature".into(),
        outfit_global_object_id: "outfit".into(),
        outfit_armature_global_object_id: "outfit-armature".into(),
        toggle_name: "新衣装".into(),
    }
}

#[test]
fn completes_the_guided_vertical_slice() {
    let project = project();
    initialize(&project);
    fs::write(project.root.join("Assets/before.txt"), "original").unwrap();

    let mut workflow = AvatarSetupWorkflow::new(request(project.clone()));
    let plan = workflow.plan();
    assert_eq!(plan.steps.len(), 6);
    assert_eq!(
        plan.steps
            .iter()
            .filter(|step| step.mutates_project)
            .count(),
        2
    );
    workflow.confirm(&FileSystemSnapshotStore).unwrap();

    while let Some(command) = workflow.next_command(Some("fingerprint".into())).unwrap() {
        let data = if command.command_id.ends_with("-06") {
            serde_json::json!({"estimatedRating": "good", "triangles": 12000})
        } else {
            serde_json::Value::Null
        };
        workflow
            .accept_result(UnityResult {
                schema_version: 1,
                command_id: command.command_id,
                status: ResultStatus::Succeeded,
                changed_paths: Vec::new(),
                diagnostics: Vec::new(),
                data,
            })
            .unwrap();
    }

    assert_eq!(workflow.stage(), WorkflowStage::Completed);
    assert_eq!(workflow.report().completed_operations.len(), 6);
    assert_eq!(workflow.report().performance["estimatedRating"], "good");
    fs::remove_dir_all(project.root).unwrap();
}

#[test]
fn failed_mutation_enters_recovery_and_restores_snapshot() {
    let project = project();
    initialize(&project);
    fs::write(project.root.join("Assets/before.txt"), "original").unwrap();

    let mut workflow = AvatarSetupWorkflow::new(request(project.clone()));
    workflow.plan();
    workflow.confirm(&FileSystemSnapshotStore).unwrap();
    fs::write(project.root.join("Assets/after.txt"), "mutation").unwrap();

    let command = workflow.next_command(None).unwrap().unwrap();
    let error = workflow.accept_result(UnityResult {
        schema_version: 1,
        command_id: command.command_id,
        status: ResultStatus::Failed,
        changed_paths: Vec::new(),
        diagnostics: vec![Diagnostic {
            code: "test.failure".into(),
            severity: DiagnosticSeverity::Error,
            message: "simulated failure".into(),
        }],
        data: serde_json::Value::Null,
    });
    assert!(error.is_err());
    assert_eq!(workflow.stage(), WorkflowStage::Recover);

    workflow.recover(&FileSystemSnapshotStore).unwrap();
    assert!(project.root.join("Assets/before.txt").exists());
    assert!(!project.root.join("Assets/after.txt").exists());
    assert!(project
        .root
        .join(".vua/recovery/outfit-demo-before/Assets/after.txt")
        .exists());
    fs::remove_dir_all(project.root).unwrap();
}
