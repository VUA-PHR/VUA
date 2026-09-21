//! Draft-batch consumer test for `schemas/bdl/v0.2` (the product-dependency
//! observation face) — wt-4 batch 164, the pre-freeze schema design ring of
//! collab/proposals/030 (BOARD #46).
//!
//! This file consumes the DRAFT schema files directly and touches NO
//! bdl-store code: the store still runs format v0.1, and the v0.2 store
//! landing belongs to the freeze slice. What is pinned here, per the
//!「Schema＋正负例向量＋至少一端消费测试」discipline:
//!
//! - the v0.1 -> v0.2 migration chain preserves v0.1 rows verbatim (CHECK
//!   rebuild is a persistent-format obligation, data loss is a failure);
//! - the expanded source_span closed set accepts the new members and keeps
//!   the v0.1 word face (no swing back);
//! - dependency_observations accepts the positive vectors and rejects every
//!   negative vector (closed sets, NOT NULL laws, the two confidence
//!   dimensions as two columns, the resolution-evidence hard law, FKs);
//! - the fresh readable authority (schema.sql) and the migrated chain
//!   (001 + 002) carry the same logical shape.
//!
//! Positive-vector wording quotes the 030 §1 survey sample phrases (public
//! page free text, no paid content); negative vectors are synthetic words.

use rusqlite::Connection;

const MIGRATION_001: &str = include_str!("../../../schemas/bdl/v0.1/001_initial.sql");
const MIGRATION_002: &str = include_str!("../../../schemas/bdl/v0.2/002_dependency_observations.sql");
const AUTHORITY_V02: &str = include_str!("../../../schemas/bdl/v0.2/schema.sql");

const PRODUCT_A: &str = "booth:6584744";
const PRODUCT_B: &str = "booth:3087170";

fn open_v01_with_product() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.pragma_update(None, "foreign_keys", "ON").unwrap();
    conn.execute_batch(MIGRATION_001).unwrap();
    for (product_id, native_id) in [("booth:6584744", "6584744"), ("booth:3087170", "3087170")] {
        conn.execute(
            "INSERT INTO products (product_id, native_product_id, source_url, status,
                 content_hash, observed_at, processor_version)
             VALUES (?1, ?2, ?3, 'complete', 'sha256:' || hex(zeroblob(32)), ?4, 'obs-0.1')",
            rusqlite::params![product_id, native_id,
                format!("https://booth.pm/ja/items/{native_id}"), "2026-09-21T00:00:00.000Z"],
        )
        .unwrap();
    }
    conn
}

fn migrate_to_v02() -> Connection {
    let conn = open_v01_with_product();
    conn.execute_batch(MIGRATION_002).unwrap();
    conn
}

fn insert_dependency(conn: &Connection, columns: &[&str], values: &[&dyn rusqlite::ToSql]) {
    let sql = format!(
        "INSERT INTO dependency_observations ({}) VALUES ({})",
        columns.join(", "),
        vec!["?"; values.len()].join(", ")
    );
    conn.execute(&sql, values).unwrap();
}

fn expect_reject(conn: &Connection, sql: &str, values: &[&dyn rusqlite::ToSql]) {
    let result = conn.execute(sql, values);
    let err = result.expect_err("the negative vector must be rejected");
    assert!(
        matches!(err, rusqlite::Error::SqliteFailure(f, _) if f.code == rusqlite::ErrorCode::ConstraintViolation),
        "expected a constraint violation, got: {err}"
    );
}

fn fmt_version(conn: &Connection) -> String {
    conn.query_row("SELECT value FROM bdl_meta WHERE key = 'format_version'", [], |row| {
        row.get::<_, String>(0)
    })
    .unwrap()
}

// ---------------------------------------------------------------------------
// Migration: v0.1 rows survive the CHECK rebuild verbatim; format moves on.
// ---------------------------------------------------------------------------

#[test]
fn migration_preserves_v01_rows_and_moves_the_format_version() {
    let conn = open_v01_with_product();
    conn.execute(
        "INSERT INTO compatibility_observations
             (product_id, raw_quote, source_span, confirmed_by_human, observed_at)
         VALUES (?1, '・liltoon 2.3.2~', 'body', 1, '2026-09-21T00:00:00.000Z')",
        rusqlite::params![PRODUCT_A],
    )
    .unwrap();

    conn.execute_batch(MIGRATION_002).unwrap();

    assert_eq!(fmt_version(&conn), "0.2");
    let (quote, span, confirmed, observed): (String, String, i64, String) = conn
        .query_row(
            "SELECT raw_quote, source_span, confirmed_by_human, observed_at
             FROM compatibility_observations WHERE product_id = ?1",
            rusqlite::params![PRODUCT_A],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .unwrap();
    assert_eq!(quote, "・liltoon 2.3.2~");
    assert_eq!(span, "body");
    assert_eq!(confirmed, 1);
    assert_eq!(observed, "2026-09-21T00:00:00.000Z");
}

// ---------------------------------------------------------------------------
// Expanded source_span closed set — new members in, v0.1 face stable, no
// foreign word admitted (spans BOTH rebuilt tables).
// ---------------------------------------------------------------------------

#[test]
fn rebuilt_compat_table_accepts_new_spans_and_keeps_the_v01_word_face() {
    let conn = migrate_to_v02();
    for span in ["body", "subproduct_name", "image", "title", "description_link"] {
        conn.execute(
            "INSERT INTO compatibility_observations
                 (product_id, raw_quote, source_span, observed_at)
             VALUES (?1, '17アバター対応', ?2, '2026-09-22T00:00:00.000Z')",
            rusqlite::params![PRODUCT_A, span],
        )
        .unwrap_or_else(|_| panic!("span '{span}' must be accepted after the rebuild"));
    }
    for foreign in ["heading", "summary", "prose"] {
        expect_reject(
            &conn,
            "INSERT INTO compatibility_observations
                 (product_id, raw_quote, source_span, observed_at)
             VALUES (?1, 'x', ?2, '2026-09-22T00:00:00.000Z')",
            &[&PRODUCT_A, &foreign],
        );
    }
}

// ---------------------------------------------------------------------------
// Positive vectors for dependency_observations (030 §1 survey archetypes).
// ---------------------------------------------------------------------------

#[test]
fn dependency_observations_accept_the_positive_vectors() {
    let conn = migrate_to_v02();

    // P1 version-pinned bullet line under an explicit heading
    //    (survey sample 1: "・liltoon 2.3.2~" under「〇前提環境」).
    insert_dependency(
        &conn,
        &["product_id", "dep_kind", "dep_name", "raw_quote", "source_span",
            "version_hint", "extraction_method", "extracted_by",
            "observed_at", "processor_version"],
        &[&PRODUCT_A, &"shader", &"liltoon", &"・liltoon 2.3.2~", &"body",
            &"2.3.2~", &"explicit_heading", &"human",
            &"2026-09-22T00:00:00.000Z", &"dep-0.1"],
    );

    // P2 one-line declaration ("Shader: Liltoon"), P5 prose, P6 bullet —
    // the extraction_method closed set covers each layout form.
    for (method, quote) in [
        ("one_line", "Shader: Liltoon"),
        ("prose", "本ギミックはlilToonのカスタムパラメータとして作動します。"),
        ("bullet", "●最新verのliltoonを使用してください。"),
    ] {
        insert_dependency(
            &conn,
            &["product_id", "dep_kind", "dep_name", "raw_quote", "source_span",
                "extraction_method", "extracted_by", "observed_at", "processor_version"],
            &[&PRODUCT_A, &"shader", &"lilToon", &quote, &"body",
                &method, &"human", &"2026-09-22T00:00:00.000Z", &"dep-0.1"],
        );
    }

    // P3 title-span declaration (survey sample 5 title suffix【liltoon】).
    insert_dependency(
        &conn,
        &["product_id", "dep_kind", "dep_name", "raw_quote", "source_span",
            "extraction_method", "extracted_by", "observed_at", "processor_version"],
        &[&PRODUCT_A, &"shader", &"lilToon", &"【liltoon】機能盛り沢山！", &"title",
            &"title", &"human", &"2026-09-22T00:00:00.000Z", &"dep-0.1"],
    );

    // Every closed-set span member lands on the new table too.
    for span in ["subproduct_name", "image", "description_link"] {
        insert_dependency(
            &conn,
            &["product_id", "dep_kind", "dep_name", "raw_quote", "source_span",
                "extraction_method", "extracted_by", "observed_at", "processor_version"],
            &[&PRODUCT_A, &"tool_package", &"Modular Avatar", &"MA対応", &span,
                &"link", &"human", &"2026-09-22T00:00:00.000Z", &"dep-0.1"],
        );
    }

    // Engine/SDK pin under the draft proposal: dep_kind='other' and the pin
    // rides version_hint (survey sample 3: "- Unity 2022.3.22f1").
    insert_dependency(
        &conn,
        &["product_id", "dep_kind", "dep_name", "raw_quote", "source_span",
            "version_hint", "extraction_method", "extracted_by",
            "observed_at", "processor_version"],
        &[&PRODUCT_A, &"other", &"Unity", &"- Unity 2022.3.22f1", &"body",
            &"2022.3.22f1", &"bullet", &"human",
            &"2026-09-22T00:00:00.000Z", &"dep-0.1"],
    );

    // P4 confirmed resolution: a resolved reference MUST carry evidence
    // (sample-1 lilToon product link resolved to its BDL identity).
    let evidence = r#"[{"linkText":"lilToon","linkUrl":"https://lilxyzw.booth.pm/items/3087170","span":"body","note":null}]"#;
    insert_dependency(
        &conn,
        &["product_id", "dep_kind", "dep_name", "raw_quote", "source_span",
            "resolved_ref_product_id", "resolution_evidence", "confirmed_by_human",
            "extraction_method", "extracted_by", "observed_at", "processor_version"],
        &[&PRODUCT_A, &"shader", &"lilToon", &"lilToon 本体", &"description_link",
            &PRODUCT_B, &evidence, &1,
            &"link", &"human", &"2026-09-22T00:00:00.000Z", &"dep-0.1"],
    );

    // The two confidence dimensions are two independent columns: a pipeline
    // extractor with an open identity word may sit next to any layout form.
    insert_dependency(
        &conn,
        &["product_id", "dep_kind", "dep_name", "raw_quote", "source_span",
            "extraction_method", "extracted_by", "observed_at", "processor_version"],
        &[&PRODUCT_A, &"avatar_base", &"Lapwing", &"『Lapwing』対応", &"subproduct_name",
            &"explicit_heading", &"pipeline:dep-0.1", &"2026-09-22T00:00:00.000Z", &"dep-0.1"],
    );

    // confirmed_by_human defaults to 0 (unconfirmed by default — the mislink
    // evidence makes human confirmation the explicit, recorded step).
    let confirmed: i64 = conn
        .query_row(
            "SELECT confirmed_by_human FROM dependency_observations
             WHERE dep_name = 'Modular Avatar' LIMIT 1",
            [],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(confirmed, 0);

    // An unconfirmed resolution row may exist (clue, never suggestion), and
    // evidence may precede any resolution.
    insert_dependency(
        &conn,
        &["product_id", "dep_kind", "dep_name", "raw_quote", "source_span",
            "resolved_ref_product_id", "resolution_evidence",
            "extraction_method", "extracted_by", "observed_at", "processor_version"],
        &[&PRODUCT_A, &"shader", &"liltoon", &"◎Liltoon", &"description_link",
            &PRODUCT_A, &r#"[{"linkText":"◎Liltoon","linkUrl":"https://booth.pm/ja/items/4993931","span":"body","note":"mislink suspect"}]"#,
            &"link", &"human", &"2026-09-22T00:00:00.000Z", &"dep-0.1"],
    );
}

// ---------------------------------------------------------------------------
// Negative vectors.
// ---------------------------------------------------------------------------

#[test]
fn dependency_observations_reject_the_negative_vectors() {
    let conn = migrate_to_v02();
    let at = "2026-09-22T00:00:00.000Z";
    let base = "INSERT INTO dependency_observations (product_id, dep_kind, dep_name,
        raw_quote, source_span, extraction_method, extracted_by, observed_at, processor_version)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)";

    // dep_kind outside the DRAFT closed set — including the v0.1-draft
    // 'unity_or_sdk_version' member, whose rejection pins this draft's
    // granularity proposal (version constraints ride version_hint). If the
    // freeze batch amends the set, this vector is amended with it.
    for kind in ["unity_or_sdk_version", "engine", ""] {
        expect_reject(&conn, base,
            &[&PRODUCT_A, &kind, &"x", &"q", &"body", &"prose", &"human", &at, &"dep-0.1"]);
    }
    // source_span foreign word.
    expect_reject(&conn, base,
        &[&PRODUCT_A, &"shader", &"x", &"q", &"heading", &"prose", &"human", &at, &"dep-0.1"]);
    // extraction_method foreign word.
    expect_reject(&conn, base,
        &[&PRODUCT_A, &"shader", &"x", &"q", &"body", &"manual", &"human", &at, &"dep-0.1"]);
    // NOT NULL laws: raw_quote / dep_name / extraction_method / extracted_by.
    expect_reject(&conn,
        "INSERT INTO dependency_observations (product_id, dep_kind, dep_name, raw_quote,
             source_span, extraction_method, extracted_by, observed_at, processor_version)
         VALUES (?1, 'shader', 'x', NULL, 'body', 'prose', 'human', ?2, 'dep-0.1')",
        &[&PRODUCT_A, &at]);
    expect_reject(&conn,
        "INSERT INTO dependency_observations (product_id, dep_kind, dep_name, raw_quote,
             source_span, extraction_method, extracted_by, observed_at, processor_version)
         VALUES (?1, 'shader', NULL, 'q', 'body', 'prose', 'human', ?2, 'dep-0.1')",
        &[&PRODUCT_A, &at]);
    expect_reject(&conn,
        "INSERT INTO dependency_observations (product_id, dep_kind, dep_name, raw_quote,
             source_span, extraction_method, extracted_by, observed_at, processor_version)
         VALUES (?1, 'shader', 'x', 'q', 'body', NULL, 'human', ?2, 'dep-0.1')",
        &[&PRODUCT_A, &at]);
    expect_reject(&conn,
        "INSERT INTO dependency_observations (product_id, dep_kind, dep_name, raw_quote,
             source_span, extraction_method, extracted_by, observed_at, processor_version)
         VALUES (?1, 'shader', 'x', 'q', 'body', 'prose', NULL, ?2, 'dep-0.1')",
        &[&PRODUCT_A, &at]);
    // confirmed_by_human is a strict 0/1 flag.
    expect_reject(&conn,
        "INSERT INTO dependency_observations (product_id, dep_kind, dep_name, raw_quote,
             source_span, confirmed_by_human, extraction_method, extracted_by,
             observed_at, processor_version)
         VALUES (?1, 'shader', 'x', 'q', 'body', 2, 'prose', 'human', ?2, 'dep-0.1')",
        &[&PRODUCT_A, &at]);

    // The resolution hard law: a resolved reference without evidence.
    expect_reject(&conn,
        "INSERT INTO dependency_observations (product_id, dep_kind, dep_name, raw_quote,
             source_span, resolved_ref_product_id, resolution_evidence,
             extraction_method, extracted_by, observed_at, processor_version)
         VALUES (?1, 'shader', 'lilToon', 'q', 'description_link', ?2, NULL,
                 'link', 'human', ?3, 'dep-0.1')",
        &[&PRODUCT_A, &PRODUCT_B, &at]);

    // A dangling resolved reference (no such product) violates the FK.
    expect_reject(&conn,
        "INSERT INTO dependency_observations (product_id, dep_kind, dep_name, raw_quote,
             source_span, resolved_ref_product_id, resolution_evidence,
             extraction_method, extracted_by, observed_at, processor_version)
         VALUES (?1, 'shader', 'lilToon', 'q', 'description_link', 'booth:9999999',
                 '[{\"linkText\":\"x\",\"linkUrl\":\"u\",\"span\":\"body\",\"note\":null}]',
                 'link', 'human', ?2, 'dep-0.1')",
        &[&PRODUCT_A, &at]);

    // A dangling owning product violates the FK too.
    expect_reject(&conn, base,
        &[&"booth:9999999", &"shader", &"x", &"q", &"body", &"prose", &"human", &at, &"dep-0.1"]);
}

// ---------------------------------------------------------------------------
// The fresh readable authority and the migrated chain carry the same shape.
// ---------------------------------------------------------------------------

fn logical_shape(conn: &Connection) -> std::collections::BTreeMap<String, Shape> {
    let mut shape = std::collections::BTreeMap::new();
    let tables: Vec<String> = {
        let mut stmt = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
            .unwrap();
        stmt.query_map([], |row| row.get::<_, String>(0)).unwrap()
            .map(|r| r.unwrap()).collect()
    };
    for table in tables {
        let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})")).unwrap();
        // Normalization note: STRICT tables (the executable discipline — 001/
        // 002) make every PRIMARY KEY column implicitly NOT NULL, while the
        // readable authority (schema.sql, the v0.1 two-form contract) omits
        // STRICT. A key column is an identity column either way, so the pk
        // columns' notnull bit is normalized to 1; everything else must be
        // literally equal.
        let columns: Vec<(String, String, i64, Option<String>, i64)> = stmt
            .query_map([], |row| {
                let name: String = row.get(1)?;
                let col_type: String = row.get(2)?;
                let mut notnull: i64 = row.get(3)?;
                let default: Option<String> = row.get(4)?;
                let pk: i64 = row.get(5)?;
                if pk > 0 {
                    notnull = 1;
                }
                Ok((name, col_type, notnull, default, pk))
            })
            .unwrap()
            .map(|r| r.unwrap())
            .collect();
        let mut stmt = conn.prepare(&format!("PRAGMA index_list({table})")).unwrap();
        let mut indexes: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(1))
            .unwrap()
            .map(|r| r.unwrap())
            .filter(|name| !name.starts_with("sqlite_"))
            .collect();
        indexes.sort();
        shape.insert(table, Shape { columns, indexes });
    }
    shape
}

#[derive(Debug, PartialEq, Eq)]
struct Shape {
    columns: Vec<(String, String, i64, Option<String>, i64)>,
    indexes: Vec<String>,
}

#[test]
fn fresh_authority_equals_the_migrated_chain() {
    let fresh = Connection::open_in_memory().unwrap();
    fresh.execute_batch(AUTHORITY_V02).unwrap();

    let migrated = migrate_to_v02();

    assert_eq!(fmt_version(&fresh), "0.2");
    assert_eq!(fmt_version(&migrated), "0.2");

    let fresh_shape = logical_shape(&fresh);
    let migrated_shape = logical_shape(&migrated);
    assert_eq!(fresh_shape, migrated_shape, "fresh authority and 001+002 chain must agree");
    assert_eq!(fresh_shape.len(), 10, "bdl_meta + nine v0.1 tables + dependency_observations");
}
