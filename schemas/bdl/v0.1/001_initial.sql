-- BDL v0.1 initial migration.
--
-- Executable form of schemas/bdl/v0.1/schema.sql (the readable authority).
-- The two must stay in sync: schema.sql freezes what v0.1 means, this file
-- runs it under the orchestrator's migration discipline (STRICT tables,
-- bdl_meta.format_version, user_version fencing — same pattern as
-- schemas/orchestrator-task-store/v0.1/001_initial.sql).
--
-- Table order satisfies foreign keys at creation time: products before its
-- observation children, local_artifacts and warehouse_items before copies,
-- local_artifacts and products before artifact_mappings.

CREATE TABLE bdl_meta (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
) STRICT;

INSERT INTO bdl_meta(key, value) VALUES ('format_version', '0.1');

-- ================= Observations (carried over from the spike, unchanged) =================

CREATE TABLE products (
  product_id             TEXT PRIMARY KEY NOT NULL,
  native_product_id      TEXT NOT NULL,
  source_url             TEXT NOT NULL,
  final_url              TEXT,
  status                 TEXT NOT NULL CHECK (status IN ('complete', 'missing')),
  source_locale          TEXT,
  source_category        TEXT,
  title                  TEXT,
  description            TEXT,
  age_restriction        TEXT,
  adult                  INTEGER NOT NULL DEFAULT 0 CHECK (adult IN (0, 1)),
  availability           TEXT,
  price_amount           TEXT,
  price_currency         TEXT,
  shop_name              TEXT,
  shop_url               TEXT,
  image_urls             TEXT,
  video_urls             TEXT,
  subproducts            TEXT,
  search_text_normalized TEXT,
  source_published_at    TEXT,
  content_hash           TEXT NOT NULL,
  observed_at            TEXT NOT NULL,
  run_id                 TEXT,
  processor_version      TEXT NOT NULL,
  robots_sha256          TEXT,
  robots_url             TEXT,
  missing_fields         TEXT
) STRICT;

CREATE TABLE term_observations (
  observation_id INTEGER PRIMARY KEY,
  product_id     TEXT NOT NULL REFERENCES products(product_id),
  kind           TEXT NOT NULL CHECK (kind IN ('vn3', 'tos')),
  source_kind    TEXT NOT NULL CHECK (source_kind IN ('link', 'image', 'body_text')),
  source_url     TEXT,
  source_sha256  TEXT,
  term_key       TEXT,
  extracted_by   TEXT NOT NULL,
  note           TEXT,
  observed_at    TEXT NOT NULL
) STRICT;

CREATE TABLE compatibility_observations (
  observation_id     INTEGER PRIMARY KEY,
  product_id         TEXT NOT NULL REFERENCES products(product_id),
  raw_quote          TEXT NOT NULL,
  source_span        TEXT NOT NULL CHECK (source_span IN ('body', 'subproduct_name', 'image')),
  confirmed_by_human INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_by_human IN (0, 1)),
  observed_at        TEXT NOT NULL
) STRICT;

-- ================= B4 additions: the acquisition pipeline =================

CREATE TABLE download_events (
  event_id            INTEGER PRIMARY KEY,
  download_id         TEXT NOT NULL,
  attempt             INTEGER NOT NULL CHECK (attempt >= 1),
  kind                TEXT NOT NULL CHECK (kind IN
                        ('started', 'progress', 'interrupted', 'completed',
                         'cancelled', 'failed')),
  source_url          TEXT NOT NULL,
  initiated_from_page_url TEXT,
  url_chain           TEXT,
  suggested_file_name TEXT,
  stored_path         TEXT,
  expected_bytes      INTEGER CHECK (expected_bytes IS NULL OR expected_bytes >= 0),
  received_bytes      INTEGER CHECK (received_bytes IS NULL OR received_bytes >= 0),
  resumable           INTEGER NOT NULL DEFAULT 0 CHECK (resumable IN (0, 1)),
  failure_kind        TEXT CHECK (failure_kind IN ('policy', 'unknown')),
  occurred_at         TEXT NOT NULL,
  UNIQUE (download_id, attempt, kind, occurred_at)
) STRICT;

CREATE INDEX idx_download_events_id   ON download_events(download_id, attempt);
CREATE INDEX idx_download_events_kind ON download_events(kind);

CREATE TABLE local_artifacts (
  artifact_sha256     TEXT PRIMARY KEY NOT NULL,
  size_bytes          INTEGER NOT NULL CHECK (size_bytes >= 0),
  suggested_file_name TEXT,
  inspection_state    TEXT NOT NULL CHECK (inspection_state IN
                        ('untrusted', 'inspected', 'admitted', 'rejected')),
  rejection_reason    TEXT,
  inspected_at        TEXT,
  download_id         TEXT,
  first_seen_at       TEXT NOT NULL
) STRICT;

CREATE INDEX idx_artifacts_state ON local_artifacts(inspection_state);

CREATE TABLE warehouse_items (
  warehouse_item_id TEXT PRIMARY KEY NOT NULL,
  display_name      TEXT NOT NULL,
  folder_name       TEXT NOT NULL UNIQUE,
  kind              TEXT NOT NULL CHECK (kind IN ('imported_material', 'downloaded_material')),
  artifact_mode     TEXT CHECK (artifact_mode IN ('use_original_unitypackage', 'generate_vpm')),
  created_at        TEXT NOT NULL
) STRICT;

CREATE TABLE artifact_copies (
  copy_id            TEXT PRIMARY KEY NOT NULL,
  artifact_sha256    TEXT NOT NULL REFERENCES local_artifacts(artifact_sha256),
  warehouse_item_id  TEXT NOT NULL REFERENCES warehouse_items(warehouse_item_id),
  relative_path      TEXT NOT NULL,
  stored_path        TEXT NOT NULL,
  role               TEXT NOT NULL CHECK (role IN ('original', 'generated_vpm')),
  created_at         TEXT NOT NULL,
  UNIQUE (warehouse_item_id, relative_path)
) STRICT;

CREATE INDEX idx_copies_artifact ON artifact_copies(artifact_sha256);

CREATE TABLE artifact_mappings (
  artifact_sha256      TEXT NOT NULL REFERENCES local_artifacts(artifact_sha256),
  product_id           TEXT NOT NULL REFERENCES products(product_id),
  native_subproduct_id TEXT,
  channel              TEXT,
  mapped_at            TEXT NOT NULL,
  PRIMARY KEY (artifact_sha256, product_id)
) STRICT;

CREATE INDEX idx_artifact_product ON artifact_mappings(product_id);

-- ================= Boundary IN-5 query support (carried over) =================

CREATE INDEX idx_products_category ON products(source_category);
CREATE INDEX idx_products_status   ON products(status);
CREATE INDEX idx_products_search   ON products(search_text_normalized);
CREATE INDEX idx_term_obs_product  ON term_observations(product_id);
CREATE INDEX idx_term_obs_key      ON term_observations(term_key);
CREATE INDEX idx_term_obs_kind     ON term_observations(kind);
CREATE INDEX idx_compat_product    ON compatibility_observations(product_id);
