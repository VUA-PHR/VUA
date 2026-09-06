-- M3/T1: production domain identity registry (B main draft section 1).
-- Domain identities (inspectionId / planId) are STABLE document identities
-- that survive retries and recoveries; task ids remain attempt-scoped run
-- handles. The registry binds each domain identity to its document and to
-- the run/execution context Kernel handed over once at startInspection.

CREATE TABLE production_domain_records (
    domain_id     TEXT PRIMARY KEY NOT NULL,
    kind          TEXT NOT NULL CHECK (kind IN ('inspection', 'plan')),
    task_id       TEXT NOT NULL REFERENCES tasks(task_id),
    document_json TEXT NOT NULL,
    binding_json  TEXT NOT NULL,
    created_at    TEXT NOT NULL
) STRICT;

CREATE INDEX idx_domain_records_task ON production_domain_records(task_id);
