-- BDL v0.2 migration: persistent-format v0.1 -> v0.2 (FROZEN — frozen by the
-- production seat, wt-4 batch 166, 2026-09-22, together with the readable
-- authority schemas/bdl/v0.2/schema.sql, the vectors/ directory and the
-- consumer test; see the authority header for the freeze triad).
--
-- Executable form of the v0.2 change set against an existing v0.1 database
-- (schemas/bdl/v0.1/001_initial.sql baseline, user_version = 1). Same
-- migration discipline as v0.1 (STRICT tables, bdl_meta.format_version,
-- user_version fencing — the HOST sets user_version = 2 after this batch
-- commits, exactly as the v0.1 host set it to 1 after MIGRATION_001).
--
-- Change set (collab/proposals/030 + data-seat inline stance):
--   1. compatibility_observations.source_span CHECK expands
--      ('body','subproduct_name','image') -> + 'title' + 'description_link'.
--      SQLite cannot alter a CHECK in place: REBUILD the table, copy every
--      v0.1 row verbatim, drop the old table, rename. Data loss is a
--      migration failure, not an acceptable cost.
--   2. dependency_observations created (the product-dependency observation
--      face; column law documented in schemas/bdl/v0.2/schema.sql).
--
-- bdl_meta.format_version moves '0.1' -> '0.2' HERE (inside the migration),
-- because the readable authority says v0.2 means format_version '0.2'; the
-- host's user_version fencing stays host-owned.

-- ---- 1. compatibility_observations rebuild (source_span CHECK expansion) ----

CREATE TABLE compatibility_observations_v02 (
  observation_id     INTEGER PRIMARY KEY,
  product_id         TEXT NOT NULL REFERENCES products(product_id),
  raw_quote          TEXT NOT NULL,
  source_span        TEXT NOT NULL CHECK (source_span IN
                       ('body', 'subproduct_name', 'image',
                        'title', 'description_link')),
  confirmed_by_human INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_by_human IN (0, 1)),
  observed_at        TEXT NOT NULL
) STRICT;

-- Verbatim carry-over: v0.1 rows only ever hold v0.1 spans, all of which
-- remain members of the v0.2 closed set — this INSERT cannot fail on
-- well-formed v0.1 data, and any failure here must abort the migration.
INSERT INTO compatibility_observations_v02
  (observation_id, product_id, raw_quote, source_span, confirmed_by_human, observed_at)
SELECT observation_id, product_id, raw_quote, source_span, confirmed_by_human, observed_at
FROM compatibility_observations;

DROP TABLE compatibility_observations;
ALTER TABLE compatibility_observations_v02 RENAME TO compatibility_observations;
CREATE INDEX idx_compat_product ON compatibility_observations(product_id);

-- ---- 2. dependency_observations (new table) ----

CREATE TABLE dependency_observations (
  observation_id          INTEGER PRIMARY KEY,
  product_id              TEXT NOT NULL REFERENCES products(product_id),
  dep_kind                TEXT NOT NULL CHECK (dep_kind IN
                            ('shader', 'tool_package', 'avatar_base', 'other')),
  dep_name                TEXT NOT NULL,
  raw_quote               TEXT NOT NULL,
  source_span             TEXT NOT NULL CHECK (source_span IN
                            ('body', 'subproduct_name', 'image',
                             'title', 'description_link')),
  version_hint            TEXT,
  resolved_ref_product_id TEXT REFERENCES products(product_id),
  resolution_evidence     TEXT,
  confirmed_by_human      INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_by_human IN (0, 1)),
  extraction_method       TEXT NOT NULL CHECK (extraction_method IN
                            ('explicit_heading', 'bullet', 'one_line',
                             'prose', 'title', 'link')),
  extracted_by            TEXT NOT NULL,
  observed_at             TEXT NOT NULL,
  processor_version       TEXT NOT NULL,
  content_hash            TEXT,
  run_id                  TEXT,
  CHECK (resolved_ref_product_id IS NULL OR resolution_evidence IS NOT NULL)
) STRICT;

CREATE INDEX idx_dep_obs_product ON dependency_observations(product_id);
CREATE INDEX idx_dep_obs_kind    ON dependency_observations(dep_kind);
CREATE INDEX idx_dep_obs_name    ON dependency_observations(dep_name);

-- ---- 3. format_version fencing ----

UPDATE bdl_meta SET value = '0.2' WHERE key = 'format_version';
