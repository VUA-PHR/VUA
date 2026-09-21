-- BDL production schema v0.2 (FROZEN — frozen by the production seat, wt-4
-- batch 166, 2026-09-22, per collab/proposals/030 §5.1 ruling (production
-- seat owns the build) and the「Schema＋正负例向量＋至少一端消费测试」freeze
-- triad, all three landed together:
--   schema ....... this file + the executable migration chain
--                  (schemas/bdl/v0.1/001_initial.sql + 002_dependency_
--                  observations.sql);
--   vectors ...... vectors/ — nine positive + eight negative vectors, one
--                  JSON file each (P1–P9 / N1–N8; the vector file form is
--                  frozen per the 030 inline-thread registration of this
--                  batch, data-seat objections ride the errata batch);
--   consumer test  crates/bdl-store/tests/dependency_observations_schema_
--                  v02.rs — drives every vector file against the migration
--                  chain and the fresh authority, all green this batch.
-- Zero runtime claims: the bdl-store still runs format v0.1 (zero store code
-- changed in the freeze batch); the v0.2 store landing is the NEXT slice.
-- The dep_kind granularity, the last open item of the draft, is ruled here:
-- four values, no 'unity_or_sdk_version' — see the dep_kind note below and
-- the no-information-loss argument frozen in the protocol book
-- (docs/protocols/bdl-dependency-observations-v0.2_EN/ZH.md).
--
-- v0.2 is the next version of the PERSISTENT FORMAT (format_version '0.2').
-- Two changes over v0.1, both from collab/proposals/030 (BOARD #46) and the
-- data-seat inline stance on it:
--
--   1. compatibility_observations.source_span closed set expands
--      ('body','subproduct_name','image') -> + 'title' + 'description_link'.
--      SQLite cannot alter a CHECK constraint in place: expanding the set is a
--      table rebuild and therefore a PERSISTENT-FORMAT migration obligation
--      (v0.1 -> v0.2 via 002_dependency_observations.sql), never an in-place
--      reshape. Survey evidence: product titles carry compressed compatibility
--      claims ("17アバター対応") and description links are a distinct span
--      kind (030 §1 samples 2/3).
--
--   2. NEW TABLE dependency_observations — the product-dependency observation
--      face (one declared dependency per row, observation paradigm, same law
--      as term_/compatibility_observations: verbatim evidence, no semantic
--      rewriting, no derived dependency-graph assertions). Confidence is TWO
--      separate dimensions in TWO separate columns and must never be merged:
--      extraction_method = WHICH PAGE LAYOUT the declaration was lifted from
--      (closed set), extracted_by = WHO/WHAT extracted it (identity, open).
--
-- This file is the full readable authority for what v0.2 means and executes
-- standalone on an empty database; the executable MIGRATION chain for existing
-- v0.1 databases is schemas/bdl/v0.1/001_initial.sql followed by
-- 002_dependency_observations.sql (STRICT tables, bdl_meta.format_version,
-- user_version fencing — same pattern as v0.1). The readable authority and the
-- executable forms must stay in sync; the consumer test pins that the fresh
-- authority and the migrated chain carry the same logical shape.
--
-- Admission rule carries over from v0.1 (docs/research/bdl-v1-boundary_ZH.md):
-- every column must answer "which capability row and which query needs it?".
-- Identity conventions carry over unchanged: product ids are namespaced corpus
-- identities ("booth:<native_product_id>"); artifact identity is CONTENT
-- ("sha256:<hex>"); warehouse item and copy ids are VUA-generated local
-- identities. The empty state is the final state — an absent observation is
-- never backfilled with guessed content, and survey failures land as honest
-- tombstones, never placeholder rows.

CREATE TABLE bdl_meta (
  key   TEXT PRIMARY KEY,               -- 'format_version' => '0.2'
  value TEXT NOT NULL
);

INSERT INTO bdl_meta(key, value) VALUES ('format_version', '0.2');

-- ================= Observations =================

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

-- REBUILT in v0.2 (CHECK expansion — persistent-format migration, data kept):
CREATE TABLE compatibility_observations (        -- boundary IN-3: declared compatibility lines
  observation_id     INTEGER PRIMARY KEY,
  product_id         TEXT NOT NULL REFERENCES products(product_id),
  raw_quote          TEXT NOT NULL,              -- verbatim quote, no semantic rewriting
  source_span        TEXT NOT NULL CHECK (source_span IN
                       ('body', 'subproduct_name', 'image',
                        'title', 'description_link')),   -- v0.2: +title, +description_link
  confirmed_by_human INTEGER NOT NULL DEFAULT 0,
  observed_at        TEXT NOT NULL
);
CREATE INDEX idx_compat_product ON compatibility_observations(product_id);

-- ================= v0.2 addition: product dependency observations =================

-- One DECLARED dependency per row, quoted verbatim from the public page.
-- Survey reality (030 §1): dependency information lives in free text with
-- per-author layout habits — headings, version-pinned bullet lines, one-line
-- declarations, prose — and nowhere in any structured BOOTH field. Anything
-- extracted is stored as an EVIDENCED OBSERVATION, never as a fact claim.
--
-- Closed sets (FROZEN — the dep_kind granularity was the draft's last open
-- item; ruled as stated below, operator-preauthorized direction finalized by
-- the production seat, wt-4 batch 166):
--   dep_kind           = 'shader' | 'tool_package' | 'avatar_base' | 'other'
--     FROZEN as the DEPENDENT-THING type (single choice, four values). There
--     is deliberately NO 'unity_or_sdk_version' member — an engine/SDK pin
--     ("- Unity 2022.3.22f1") lands as dep_kind='other' with version_hint
--     carrying the pin. The five-value draft alternative is REJECTED: it
--     conflated two orthogonal dimensions (what is depended upon / what
--     constraint attaches) in one single-choice field, so a "lilToon＋2.3.2~"
--     declaration (030 §1 sample 1: a shader pin WITH a version) would
--     already have to pick 'shader' and ride version_hint anyway. Narrowing
--     loses NO survey information: the thing type stays in dep_kind, the
--     constraint stays in version_hint (as written), the evidence stays in
--     raw_quote/source_span; "has a version constraint" is derivable at read
--     time from version_hint IS NOT NULL — a read-time derivation
--     (availabilityRaw->availabilityStatus precedent), never a stored fact.
--   source_span        = 'body' | 'subproduct_name' | 'image' | 'title' |
--                        'description_link'   (same closed set as the
--                        compatibility_observations v0.2 rebuild)
--   extraction_method  = 'explicit_heading' | 'bullet' | 'one_line' | 'prose'
--                        | 'title' | 'link'
--     Confidence dimension 1: the page-layout form the quote was lifted from.
--     Downstream (the dependencies.* query family, data seat, ruling 030
--     §5.7 case A) derives advisory confidence from this — output is ever a
--     SUGGESTION with evidence, never a fact claim; low-confidence
--     observations stay in the library and surface no suggestion.
--   extracted_by       = open TEXT (identity of the extractor: 'human' first
--     precedent, later pipeline versions may append). Confidence dimension 2.
--     Deliberately NOT merged with extraction_method and NOT given its own
--     closed set (term_observations.extracted_by precedent).
--
-- Identity resolution (030 §1 sample 3 mislink evidence): a description link
-- that resolves to another BDL product fills resolved_ref_product_id and MUST
-- carry resolution_evidence; the store-level hard law is
-- evidence-must-accompany-resolution (CHECK). Unconfirmed resolutions
-- (confirmed_by_human = 0, the DEFAULT) are clues only — the read-side
-- derivation rule table (versioned, availabilityRaw->availabilityStatus
-- precedent) never turns them into suggestions. The evidence JSON shape is
-- frozen with this file:
--   [{"linkText": <string>, "linkUrl": <string>, "span": <source_span member>,
--     "note": <string|null>}]
CREATE TABLE dependency_observations (
  observation_id          INTEGER PRIMARY KEY,
  product_id              TEXT NOT NULL REFERENCES products(product_id),
  dep_kind                TEXT NOT NULL CHECK (dep_kind IN
                            ('shader', 'tool_package', 'avatar_base', 'other')),
  dep_name                TEXT NOT NULL,       -- the dependency's name AS WRITTEN ('lilToon'); no normalization, no equivalence guessing
  raw_quote               TEXT NOT NULL,       -- verbatim quote, no semantic rewriting
  source_span             TEXT NOT NULL CHECK (source_span IN
                            ('body', 'subproduct_name', 'image',
                             'title', 'description_link')),
  version_hint            TEXT,                -- the version string AS WRITTEN ('2.3.2~'); no normalization; carries ALL version constraints (engine/SDK pins included — see dep_kind above)
  resolved_ref_product_id TEXT REFERENCES products(product_id), -- nullable; set only via the resolution path
  resolution_evidence     TEXT,                -- JSON array, shape frozen above; NOT NULL whenever resolved_ref_product_id is NOT NULL (CHECK)
  confirmed_by_human      INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_by_human IN (0, 1)),
  extraction_method       TEXT NOT NULL CHECK (extraction_method IN
                            ('explicit_heading', 'bullet', 'one_line',
                             'prose', 'title', 'link')),
  extracted_by            TEXT NOT NULL,       -- extractor identity ('human' in the first landing); open, not a closed set
  observed_at             TEXT NOT NULL,       -- pipeline observation time, NOT a BOOTH publish time
  processor_version       TEXT NOT NULL,
  content_hash            TEXT,                -- sha256 of the observed page the quote came from; nullable when carried across observations
  run_id                  TEXT,
  CHECK (resolved_ref_product_id IS NULL OR resolution_evidence IS NOT NULL)
);

CREATE INDEX idx_dep_obs_product ON dependency_observations(product_id);
CREATE INDEX idx_dep_obs_kind    ON dependency_observations(dep_kind);
CREATE INDEX idx_dep_obs_name    ON dependency_observations(dep_name);

-- ================= B4 additions: the acquisition pipeline (unchanged) =================

CREATE TABLE download_events (
  event_id            INTEGER PRIMARY KEY,
  download_id         TEXT NOT NULL,           -- port-assigned, stable across retry attempts
  attempt             INTEGER NOT NULL,        -- 1-based; same downloadId, incremented per fresh retry
  kind                TEXT NOT NULL,           -- started|progress|interrupted|completed|cancelled|failed (v0.1 closed set, see 001_initial.sql)
  source_url          TEXT NOT NULL,
  initiated_from_page_url TEXT,                -- page context at click time (correlation input)
  url_chain           TEXT,                    -- JSON array of strings; redirect chain at click time
  suggested_file_name TEXT,
  stored_path         TEXT,                    -- VUA-managed staging path; the ONLY path field
  expected_bytes      INTEGER,
  received_bytes      INTEGER,
  resumable           INTEGER NOT NULL DEFAULT 0, -- the port's resumability verdict (canResume), never self-observed headers
  failure_kind        TEXT,                    -- policy | unknown, failed events only
  occurred_at         TEXT NOT NULL,
  UNIQUE (download_id, attempt, kind, occurred_at)
);
CREATE INDEX idx_download_events_id   ON download_events(download_id, attempt);
CREATE INDEX idx_download_events_kind ON download_events(kind);

-- Inspection facts are PER CONTENT (download-events protocol: completed ≠
-- admitted). Re-downloading the same content never duplicates this row —
-- physical copies live in artifact_copies instead (warehouse-layout ruling 2:
-- no deduplication).
CREATE TABLE local_artifacts (
  artifact_sha256     TEXT PRIMARY KEY,        -- content identity, AMF-computed
  size_bytes          INTEGER NOT NULL,
  suggested_file_name TEXT,
  inspection_state    TEXT NOT NULL,           -- untrusted|inspected|admitted|rejected (v0.1 closed set)
  rejection_reason    TEXT,                    -- honest user-facing verdict; null unless rejected
  inspected_at        TEXT,
  download_id         TEXT,                    -- nullable: artifacts can enter by batch import too
  first_seen_at       TEXT NOT NULL
);
CREATE INDEX idx_artifacts_state ON local_artifacts(inspection_state);

-- Warehouse items (warehouse-layout rulings 1/2/5): one folder per material
-- package under the (user-changeable) warehouse root; generated VPM packages
-- and original material folders are siblings within an entry.
-- artifact_mode is the per-entry CONSUMPTION PREFERENCE override (null =
-- follow the shell-level global default, resolved dynamically at read time —
-- never a generation trigger and never a statement that a VPM exists).
CREATE TABLE warehouse_items (
  warehouse_item_id TEXT PRIMARY KEY,          -- VUA-generated local identity
  display_name      TEXT NOT NULL,
  folder_name       TEXT NOT NULL UNIQUE,      -- folder under the warehouse root (semantic tree)
  kind              TEXT NOT NULL,             -- imported_material | downloaded_material
  artifact_mode     TEXT,                      -- use_original_unitypackage | generate_vpm | null (global default)
  created_at        TEXT NOT NULL
);

-- Physical copies (warehouse-layout ruling 2): one row per file in the
-- semantic tree. role separates originals from generated VPM packages —
-- the delete-originals flow removes original rows (with their files) and
-- keeps generated_vpm rows.
CREATE TABLE artifact_copies (
  copy_id            TEXT PRIMARY KEY,          -- VUA-generated copy identity
  artifact_sha256    TEXT NOT NULL REFERENCES local_artifacts(artifact_sha256),
  warehouse_item_id  TEXT NOT NULL REFERENCES warehouse_items(warehouse_item_id),
  relative_path      TEXT NOT NULL,             -- path within the package folder
  stored_path        TEXT NOT NULL,             -- absolute location (updated on moves)
  role               TEXT NOT NULL,             -- original | generated_vpm (v0.1 closed set)
  created_at         TEXT NOT NULL,
  UNIQUE (warehouse_item_id, relative_path)
);
CREATE INDEX idx_copies_artifact ON artifact_copies(artifact_sha256);

-- Boundary IN-4: downloaded artifact CONTENT -> source product. Many-to-many
-- fact — the same content can be referenced by several product pages, and the
-- fact does not follow copy count or warehouse organization. Repeated
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

-- ================= Boundary IN-5 query support =================

CREATE INDEX idx_products_category ON products(source_category);
CREATE INDEX idx_products_status   ON products(status);
CREATE INDEX idx_products_search   ON products(search_text_normalized);
CREATE INDEX idx_term_obs_product  ON term_observations(product_id);
CREATE INDEX idx_term_obs_key      ON term_observations(term_key);
CREATE INDEX idx_term_obs_kind     ON term_observations(kind);
