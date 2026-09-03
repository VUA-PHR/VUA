CREATE TABLE vua_metadata (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
) STRICT;

INSERT INTO vua_metadata(key, value) VALUES ('format_version', '0.1');

CREATE TABLE tasks (
    task_id TEXT PRIMARY KEY NOT NULL,
    correlation_id TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN (
        'queued', 'preparing', 'running', 'waiting_for_input', 'paused',
        'succeeded', 'succeeded_with_warnings', 'failed', 'cancelled'
    )),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    cancel_requested INTEGER NOT NULL DEFAULT 0 CHECK (cancel_requested IN (0, 1)),
    error_json TEXT,
    result_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE task_events (
    event_id INTEGER PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    revision INTEGER NOT NULL CHECK (revision >= 1),
    kind TEXT NOT NULL CHECK (kind IN (
        'accepted', 'state_changed', 'progress', 'cancel_requested', 'completed'
    )),
    state TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    correlation_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    UNIQUE(task_id, revision)
) STRICT;

CREATE INDEX task_events_after_revision
    ON task_events(task_id, revision);

CREATE TABLE command_idempotency (
    command_kind TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    request_fingerprint TEXT NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(task_id),
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(command_kind, idempotency_key)
) STRICT;

CREATE TABLE project_lease_generations (
    project_identity TEXT PRIMARY KEY NOT NULL,
    generation INTEGER NOT NULL CHECK (generation >= 1)
) STRICT;

CREATE TABLE project_mutation_leases (
    project_identity TEXT PRIMARY KEY NOT NULL
        REFERENCES project_lease_generations(project_identity),
    generation INTEGER NOT NULL CHECK (generation >= 1),
    owner_instance_id TEXT NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(task_id),
    acquired_at TEXT NOT NULL,
    heartbeat_at TEXT NOT NULL,
    recovery_required INTEGER NOT NULL DEFAULT 0 CHECK (recovery_required IN (0, 1)),
    recovery_marked_at TEXT,
    inspection_id TEXT
) STRICT;
