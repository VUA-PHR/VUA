-- BDL v1 spike schema (PROPOSED — frozen only by the first AMF+BDL vertical
-- slice, per docs/architecture/bdl_EN.md).
--
-- Admission rule: every column must answer "which boundary capability row
-- and which filter/mapping query needs it?" (see
-- docs/research/bdl-v1-boundary_EN.md). Columns failing the rule are out:
-- etag / last_modified (100% null across the 135,973-record corpus) and
-- source_updated_at (no stable BOOTH source — standing decision) are
-- deliberately absent.
--
-- Deliberately absent per the v1 boundary: automatic entity/alias
-- resolution, compatibility matrices, Google Doc/Drive body capture (only
-- source_url + nullable source_sha256 are recorded until Google's automated
-- access policy review concludes).

CREATE TABLE products (
  product_id             TEXT PRIMARY KEY,        -- VUA corpus identity
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
  source_published_at    TEXT,                    -- ADMITTED BY RULING: stable location confirmed
                                                  -- (#js-item-published-date, rendered); null in static archives
  content_hash           TEXT NOT NULL,           -- sha256 of the observed HTML (content-addressed)
  observed_at            TEXT NOT NULL,           -- pipeline observation time, NOT a BOOTH publish time
  run_id                 TEXT,
  processor_version      TEXT NOT NULL,           -- which pipeline produced this row (provenance of trust)
  robots_sha256          TEXT,
  robots_url             TEXT,
  missing_fields         TEXT                     -- JSON array: honest extraction gaps
);

CREATE TABLE term_observations (                 -- boundary IN-2: terms provenance
  observation_id INTEGER PRIMARY KEY,
  product_id     TEXT NOT NULL REFERENCES products(product_id),
  kind           TEXT NOT NULL CHECK (kind IN ('vn3', 'tos')),
  source_kind    TEXT NOT NULL CHECK (source_kind IN ('link', 'image', 'body_text')),
  source_url     TEXT,                           -- e.g. the Google Docs/Drive license link, kept verbatim
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
  confirmed_by_human INTEGER NOT NULL DEFAULT 0, -- 1 = human-confirmed, filterable
  observed_at        TEXT NOT NULL
);

CREATE TABLE artifact_mappings (                 -- boundary IN-4: downloaded file -> source product
  artifact_sha256      TEXT NOT NULL,            -- the downloaded artifact's content hash
  product_id           TEXT NOT NULL REFERENCES products(product_id),
  native_subproduct_id TEXT,
  channel              TEXT,
  mapped_at            TEXT NOT NULL,
  PRIMARY KEY (artifact_sha256, product_id)
);

-- Boundary IN-5 query support.
CREATE INDEX idx_products_category ON products(source_category);
CREATE INDEX idx_products_status   ON products(status);
CREATE INDEX idx_products_search   ON products(search_text_normalized);
CREATE INDEX idx_term_obs_product  ON term_observations(product_id);
CREATE INDEX idx_term_obs_key      ON term_observations(term_key);
CREATE INDEX idx_term_obs_kind     ON term_observations(kind);
CREATE INDEX idx_compat_product    ON compatibility_observations(product_id);
CREATE INDEX idx_artifact_product  ON artifact_mappings(product_id);
