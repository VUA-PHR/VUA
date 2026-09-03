#![allow(clippy::result_large_err)]

use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use vua_orchestrator::{
    NanosTaskIdGenerator, NewTask, SqliteTaskStore, SubmitRequest, SystemClock, TaskEventKind,
    TaskExit, TaskMutation, TaskRecoveryDisposition, TaskRuntime, TaskState,
};

fn database_path(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-task-store-{label}-{nanos}.db"))
}

fn wait_for_terminal(runtime: &TaskRuntime, task_id: &str) {
    let deadline = Instant::now() + Duration::from_secs(10);
    loop {
        let snapshot = runtime.snapshot(task_id).expect("task exists");
        if snapshot.state.is_terminal() {
            return;
        }
        assert!(Instant::now() < deadline, "task did not finish");
        std::thread::sleep(Duration::from_millis(5));
    }
}

#[test]
fn b2_sqlite_runtime_commits_before_publish_and_recovers_revision() {
    let path = database_path("runtime");
    let store = Arc::new(SqliteTaskStore::open(&path).unwrap());
    let runtime = TaskRuntime::with_sqlite(
        store.clone(),
        Arc::new(SystemClock),
        Arc::new(NanosTaskIdGenerator::default()),
    )
    .unwrap();
    let events = runtime.subscribe();
    let accepted = runtime
        .submit(SubmitRequest {
            correlation_id: Some("corr-sqlite-runtime".into()),
            timeout: None,
            job: Box::new(|context| {
                context.emit_progress(serde_json::json!({"step": 1}));
                Ok(TaskExit::Done(serde_json::json!({"ok": true})))
            }),
        })
        .unwrap();
    wait_for_terminal(&runtime, &accepted.task_id);

    let published: Vec<_> = events.try_iter().collect();
    let persisted = store.events_after(&accepted.task_id, 0).unwrap();
    assert_eq!(published.len(), persisted.len());
    assert_eq!(
        published
            .iter()
            .map(|event| (event.revision, event.kind, event.state))
            .collect::<Vec<_>>(),
        persisted
            .iter()
            .map(|event| (event.revision, event.kind, event.state))
            .collect::<Vec<_>>()
    );
    assert!(persisted
        .iter()
        .any(|event| event.kind == TaskEventKind::Progress));

    let durable_revision = store.task(&accepted.task_id).unwrap().unwrap().revision;
    drop(runtime);
    store.checkpoint().unwrap();
    drop(store);

    let reopened = Arc::new(SqliteTaskStore::open(&path).unwrap());
    let restarted = TaskRuntime::with_sqlite(
        reopened.clone(),
        Arc::new(SystemClock),
        Arc::new(NanosTaskIdGenerator::default()),
    )
    .unwrap();
    let recovered = restarted.snapshot(&accepted.task_id).unwrap();
    assert_eq!(recovered.state, TaskState::Succeeded);
    assert_eq!(recovered.revision, durable_revision);
    assert_eq!(
        recovered.recovery_disposition,
        TaskRecoveryDisposition::None
    );
    reopened.checkpoint().unwrap();
    drop(restarted);
    drop(reopened);
    std::fs::remove_file(path).ok();
}

#[test]
fn b2_sqlite_cancel_intent_is_one_durable_monotonic_event() {
    let path = database_path("cancel");
    let store = Arc::new(SqliteTaskStore::open(&path).unwrap());
    let runtime = TaskRuntime::with_sqlite(
        store.clone(),
        Arc::new(SystemClock),
        Arc::new(NanosTaskIdGenerator::default()),
    )
    .unwrap();
    let accepted = runtime
        .submit(SubmitRequest {
            correlation_id: None,
            timeout: None,
            job: Box::new(|context| {
                while !context.check_cancel() {
                    std::thread::yield_now();
                }
                Ok(TaskExit::Cancelled)
            }),
        })
        .unwrap();
    runtime.cancel(&accepted.task_id).unwrap();
    runtime.cancel(&accepted.task_id).unwrap();
    wait_for_terminal(&runtime, &accepted.task_id);
    let events = store.events_after(&accepted.task_id, 0).unwrap();
    assert_eq!(
        events
            .iter()
            .filter(|event| event.kind == TaskEventKind::CancelRequested)
            .count(),
        1
    );
    assert!(events
        .windows(2)
        .all(|pair| pair[1].revision == pair[0].revision + 1));
    store.checkpoint().unwrap();
    drop(runtime);
    drop(store);
    std::fs::remove_file(path).ok();
}

#[test]
fn b2_interrupted_task_keeps_real_state_and_requires_inspection() {
    let path = database_path("inspect-required");
    {
        let store = SqliteTaskStore::open(&path).unwrap();
        store
            .accept_task(&NewTask {
                task_id: "task-interrupted".into(),
                correlation_id: "corr-interrupted".into(),
                occurred_at: "2026-09-02T00:00:00.000Z".into(),
            })
            .unwrap();
        store
            .mutate_task(
                "task-interrupted",
                1,
                "2026-09-02T00:00:01.000Z",
                TaskMutation::Transition {
                    state: TaskState::Preparing,
                    payload: serde_json::Value::Null,
                },
            )
            .unwrap()
            .unwrap();
        store
            .mutate_task(
                "task-interrupted",
                2,
                "2026-09-02T00:00:02.000Z",
                TaskMutation::Transition {
                    state: TaskState::Running,
                    payload: serde_json::Value::Null,
                },
            )
            .unwrap()
            .unwrap();
        store.checkpoint().unwrap();
    }

    let store = Arc::new(SqliteTaskStore::open(&path).unwrap());
    let runtime = TaskRuntime::with_sqlite(
        store.clone(),
        Arc::new(SystemClock),
        Arc::new(NanosTaskIdGenerator::default()),
    )
    .unwrap();
    let recovered = runtime.snapshot("task-interrupted").unwrap();
    assert_eq!(recovered.state, TaskState::Running);
    assert_eq!(
        recovered.recovery_disposition,
        TaskRecoveryDisposition::InspectRequired
    );
    assert!(runtime.subscribe().try_recv().is_err());
    store.checkpoint().unwrap();
    drop(runtime);
    drop(store);
    std::fs::remove_file(path).ok();
}
