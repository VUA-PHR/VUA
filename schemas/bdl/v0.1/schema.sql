-- BDL production schema v0.1 (PROPOSED — frozen by the first AMF+BDL vertical
-- slice, per docs/architecture/bdl_ZH.md; the AMF+BDL vertical slice IS B4).
--
-- Evolved from schemas/bdl-spike/v0.1/schema.sql (corpus-validated: 135,973
-- record-v2 records + 100 a1-smoke normalized rows + two golden anchors). The
-- four observation tables are carried over UNCHANGED; the B4 additions are
-- download_events / local_artifacts / warehouse_items / warehouse_artifacts,
-- each justified against the v1 boundary IN rows.
--
-- Admission rule (docs/research/bdl-v1-boundary_ZH.md): every column must
-- answer "which boundary capability row and which filter/mapping query needs
-- it?" Deliberately absent everywhere: etag, last_modified,
-- source_updated_at (corpus-rejected dead fields). BDL v2 capabilities
-- (relationship edges, alias tables) are NOT here — see
-- docs/research/bdl-v2-capability-list_ZH.md; they land as versioned
-- migrations, never as in-place reshapes.
--
-- Identity conventions:
--   product ids are namespaced corpus identities ("booth:<native_product_id>");
--   child tables use the same namespace key;
--   artifact identity is content ("sha256:<hex>" of the inspected file);
--   warehouse item ids are VUA-generated local identities (stable, never
--   derived from display names).

CREATE TABLE bdl_meta (
  key   TEXT PRIMARY KEY,               -- 'schema_version' => '0.1'
  value TEXT NOT NULL
);

-- ================= Observations (carried over from the spike, unchanged) =================

CREATE TABLE products (
  product_id             TEXT PRIMARY KEY,        -- VUA corpus identity ("booth:<id>")
  native_product_id      TEXT NOT NULL,           -- BOOTH product id
  source_url             TEXT NOT NULL,
  final_url              TEXT,
  status                 TEXT NOT NULL,           -- complete | missing (tombstone; 404/410 kept, never deleted)
  source_locale          TEXT,
  source_category        TEXT,                    -- BOOTH display category, no inference
  title                  TEXT,                    -- article .summary h2; ld+json fallback
  description            TEXT,                    -- visible body + shop__text sections in DOM order
  age_restriction        TEXT,
  adult                  INTEGER NOT NULL DEFAULT 0, -- 1 only with the explicit BOOTH Adult badge
  availability           TEXT,                    -- JSON-LD offers.availability
  price_amount           TEXT,                    -- single-price products only
  price_currency         TEXT,
  shop_name              TEXT,
  shop_url               TEXT,
  image_urls             TEXT,                    -- JSON array of strings
  video_urls             TEXT,                    -- JSON array of strings
  subproducts            TEXT,                    -- JSON array of {variation_id, name, price_amount, price_currency, availability}
  search_text_normalized TEXT,                    -- body+title+shop+subproduct names projection
  source_published_at    TEXT,                    -- admitted by ruling; null until rendered capture exists
  content_hash           TEXT NOT NULL,           -- sha256 of the observed HTML (content-addressed)
  observed_at            TEXT NOT NULL,           -- pipeline observation time, NOT a BOOTH publish time
  run_id                 TEXT,
  processor_version      TEXT NOT NULL,
  robots_sha256          TEXT,
  robots_url             TEXT,
  missing_fields         TEXT                     -- JSON array: honest extraction gaps
);

CREATE TABLE term_observations (                 -- boundary IN-2: terms provenance
  observation_id INTEGER PRIMARY KEY,
  product_id     TEXT NOT NULL REFERENCES products(product_id),
  kind           TEXT NOT NULL CHECK (kind IN ('vn3', 'tos')),
  source_kind    TEXT NOT NULL CHECK (source_kind IN ('link', 'image', 'body_text')),
  source_url     TEXT,
  source_sha256  TEXT,                           -- null until fetching is policy-cleared
  term_key       TEXT,                           -- null = raw observation awaiting vocabulary mapping
  extracted_by   TEXT NOT NULL,                  -- 'human' in v1
  note           TEXT,
  observed_at    TEXT NOT NULL
);

CREATE TABLE compatibility_observations (        -- boundary IN-3: declared compatibility lines
  observation_id     INTEGER PRIMARY KEY,
  product_id         TEXT NOT NULL REFERENCES products(product_id),
  raw_quote          TEXT NOT NULL,              -- verbatim quote, no semantic rewriting
  source_span        TEXT NOT NULL CHECK (source_span IN ('body', 'subproduct_name', 'image')),
  confirmed_by_human INTEGER NOT NULL DEFAULT 0,
  observed_at        TEXT NOT NULL
);

-- ================= B4 additions: the acquisition pipeline =================

-- Boundary IN-5 support + download-events protocol v0.1: the normalized
-- download lifecycle as reported by the F4 port (transport facts only — no
-- credentials, no content identity; the sha256 lives in local_artifacts).
CREATE TABLE download_events (
  event_id            INTEGER PRIMARY KEY,
  download_id         TEXT NOT NULL,           -- port-assigned, stable across retry attempts
  attempt             INTEGER NOT NULL,        -- 1-based; same downloadId, incremented per retry
  kind                TEXT NOT NULL CHECK (kind IN
                        ('started', 'progress', 'interrupted', 'completed',
                         'cancelled', 'failed')),
  source_url          TEXT NOT NULL,
  initiated_from_page_url TEXT,                -- page context at click time (correlation input)
  suggested_file_name TEXT,
  stored_path         TEXT,                    -- VUA-managed staging path; the ONLY path field
  expected_bytes      INTEGER,                 -- Content-Length when the server sent one
  received_bytes      INTEGER,
  resumable           INTEGER NOT NULL DEFAULT 0, -- 1 only with observed Accept-Ranges/206
  failure_kind        TEXT CHECK (failure_kind IN ('network', 'disk', 'policy', 'server')),
  occurred_at         TEXT NOT NULL
);
CREATE INDEX idx_download_events_id   ON download_events(download_id, attempt);
CREATE INDEX idx_download_events_kind ON download_events(kind);

-- The inspected file identity (download-events protocol: completed ≠
-- admitted). One row per content digest — re-downloads are idempotent.
CREATE TABLE local_artifacts (
  artifact_sha256     TEXT PRIMARY KEY,        -- content identity, AMF-computed
  size_bytes          INTEGER NOT NULL,
  suggested_file_name TEXT,
  stored_path         TEXT NOT NULL,           -- updated on warehouse moves
  inspection_state    TEXT NOT NULL CHECK (inspection_state IN
                        ('untrusted', 'inspected', 'admitted', 'rejected')),
  inspected_at        TEXT,
  download_id         TEXT,                    -- nullable: artifacts can enter by import too
  first_seen_at       TEXT NOT NULL
);
CREATE INDEX idx_artifacts_state ON local_artifacts(inspection_state);

-- Boundary IN-4: downloaded artifact -> source product. Many-to-many fact —
-- the same file can be referenced by several product pages. Repeated
-- submissions are idempotent (primary key).
CREATE TABLE artifact_mappings (
  artifact_sha256      TEXT NOT NULL REFERENCES local_artifacts(artifact_sha256),
  product_id           TEXT NOT NULL REFERENCES products(product_id),
  native_subproduct_id TEXT,
  channel              TEXT,
  mapped_at            TEXT NOT NULL,
  PRIMARY KEY (artifact_sha256, product_id)
);
CREATE INDEX idx_artifact_product ON artifact_mappings(product_id);

-- Warehouse mapping (B4): VUA-owned organization on top of admitted
-- artifacts. The artifact->product facts above never change with warehouse
-- organization.
CREATE TABLE warehouse_items (
  warehouse_item_id TEXT PRIMARY KEY,          -- VUA-generated local identity
  display_name      TEXT NOT NULL,
  kind              TEXT NOT NULL,             -- artifact family (e.g. 'unitypackage'), no semantic inference
  created_at        TEXT NOT NULL
);

CREATE TABLE warehouse_artifacts (
  warehouse_item_id TEXT NOT NULL REFERENCES warehouse_items(warehouse_item_id),
  artifact_sha256   TEXT NOT NULL REFERENCES local_artifacts(artifact_sha256),
  mapped_at         TEXT NOT NULL,
  PRIMARY KEY (warehouse_item_id, artifact_sha256)
);
CREATE INDEX idx_warehouse_artifacts_artifact ON warehouse_artifacts(artifact_sha256);

-- ================= Boundary IN-5 query support (carried over) =================

CREATE INDEX idx_products_category ON products(source_category);
CREATE INDEX idx_products_status   ON products(status);
CREATE INDEX idx_products_search   ON products(search_text_normalized);
CREATE INDEX idx_term_obs_product  ON term_observations(product_id);
CREATE INDEX idx_term_obs_key      ON term_observations(term_key);
CREATE INDEX idx_term_obs_kind     ON term_observations(kind);
CREATE INDEX idx_compat_product    ON compatibility_observations(product_id);
