//! Document digest and `vuar0.2` share-code codec (test-format "摘要算法" and
//! "编码").
//!
//! Digest profile: canonical JSON is produced by serde_json's default
//! `BTreeMap` key ordering plus shortest round-trip number formatting. For
//! ASCII-keyed recipe documents this is byte-identical to RFC 8785 JCS; the
//! full UTF-16 key-order and ECMAScript number-format corner cases are
//! pinned by vector tests when digests become persisted wire identity
//! (H-STATE). Until then the digest is a process-stable document fingerprint,
//! which is what save-conflict and plan-binding semantics need.

use super::model::{RecipeV02, RECIPE_FORMAT_VERSION};
use crate::contracts::{AppErrorV1, ErrorCategory};
use serde::Serialize;
use serde_json::Value;
use sha2::{Digest as ShaDigest, Sha256};

pub const SHARE_PREFIX: &str = "vuar0.2.";
/// Proposal hard limit: decoded payload may not exceed 256 KiB.
pub const MAX_DECODED_BYTES: usize = 256 * 1024;
/// Proposal target for regular exports; exceeding it is allowed but flagged
/// to the caller through the payload size.
pub const RECOMMENDED_MAX_BYTES: usize = 64 * 1024;

/// `sha256:<64 lowercase hex>` over the canonical JSON encoding.
pub fn document_digest(value: &impl Serialize) -> Result<String, AppErrorV1> {
    let canonical = canonical_json(value)?;
    let digest = Sha256::digest(canonical.as_bytes());
    Ok(format!("sha256:{}", hex_lower(&digest)))
}

/// Deterministic JSON encoding: object keys sorted (serde_json default
/// `BTreeMap`), no whitespace.
pub fn canonical_json(value: &impl Serialize) -> Result<String, AppErrorV1> {
    let json = serde_json::to_value(value).map_err(|error| {
        AppErrorV1::new(
            "vua.recipe.serialize_failed",
            ErrorCategory::Internal,
            "errors.recipe.serializeFailed",
            "corr-recipe-digest",
        )
        .with_param(
            "reason",
            crate::contracts::ParamValue::Text(error.to_string()),
        )
    })?;
    write_canonical(&json)
}

fn write_canonical(value: &Value) -> Result<String, AppErrorV1> {
    match value {
        Value::Object(map) => {
            // 显式排序：vrc-get-vpm 依赖启用了 serde_json 的 preserve_order
            // （特性叠加到全仓），Map 不再按 BTreeMap 有序迭代。JCS 的完整
            // UTF-16 键序规则对 ASCII 键与按字节排序等价（H-IPC 补全）。
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let mut out = String::with_capacity(64);
            out.push('{');
            for (index, key) in keys.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                out.push_str(&serde_json::to_string(key).map_err(json_error)?);
                out.push(':');
                out.push_str(&write_canonical(&map[*key])?);
            }
            out.push('}');
            Ok(out)
        }
        Value::Array(items) => {
            let mut out = String::with_capacity(16);
            out.push('[');
            for (index, item) in items.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                out.push_str(&write_canonical(item)?);
            }
            out.push(']');
            Ok(out)
        }
        other => serde_json::to_string(other).map_err(json_error),
    }
}

fn json_error(error: serde_json::Error) -> AppErrorV1 {
    AppErrorV1::new(
        "vua.recipe.serialize_failed",
        ErrorCategory::Internal,
        "errors.recipe.serializeFailed",
        "corr-recipe-digest",
    )
    .with_param(
        "reason",
        crate::contracts::ParamValue::Text(error.to_string()),
    )
}

fn hex_lower(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

// --- share code ---

/// Encodes a recipe as `vuar0.2.<unpadded base64url of UTF-8 JSON>`.
pub fn encode_share_code(recipe: &RecipeV02) -> Result<String, AppErrorV1> {
    let json = serde_json::to_vec(recipe).map_err(json_error)?;
    Ok(format!("{SHARE_PREFIX}{}", base64_url_encode(&json)))
}

/// Decodes and validates a share code. Structural failures (prefix, payload,
/// size, JSON, schema version) are hard errors; domain issues are returned
/// alongside the recipe for the importer flow ("显示来源和期望态预览 →
/// 用户确认保存").
pub fn decode_share_code(
    code: &str,
) -> Result<(RecipeV02, Vec<super::model::RecipeIssue>), AppErrorV1> {
    let payload = code
        .strip_prefix(SHARE_PREFIX)
        .ok_or_else(|| share_error("vua.recipe.share_prefix_invalid"))?;
    let bytes = base64_url_decode(payload)
        .ok_or_else(|| share_error("vua.recipe.share_payload_invalid"))?;
    if bytes.len() > MAX_DECODED_BYTES {
        return Err(share_error("vua.recipe.share_too_large"));
    }
    let recipe: RecipeV02 = serde_json::from_slice(&bytes)
        .map_err(|_| share_error("vua.recipe.share_payload_invalid"))?;
    if recipe.format_version != RECIPE_FORMAT_VERSION {
        return Err(share_error("vua.recipe.share_version_invalid"));
    }
    let issues = super::validate::validate_recipe(&recipe);
    Ok((recipe, issues))
}

fn share_error(code: &str) -> AppErrorV1 {
    AppErrorV1::new(
        code,
        ErrorCategory::Validation,
        "errors.recipe.shareInvalid",
        "corr-recipe-share",
    )
}

// --- base64url without padding (RFC 4648 §5), hand-rolled to stay
// dependency-free; round-trip and vector tested below. ---

const ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

pub fn base64_url_encode(input: &[u8]) -> String {
    let mut out = String::with_capacity(input.len().div_ceil(3) * 4);
    for chunk in input.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let triple = (b0 << 16) | (b1 << 8) | b2;
        out.push(ALPHABET[(triple >> 18) as usize & 63] as char);
        out.push(ALPHABET[(triple >> 12) as usize & 63] as char);
        if chunk.len() > 1 {
            out.push(ALPHABET[(triple >> 6) as usize & 63] as char);
        }
        if chunk.len() > 2 {
            out.push(ALPHABET[triple as usize & 63] as char);
        }
    }
    out
}

pub fn base64_url_decode(input: &str) -> Option<Vec<u8>> {
    let mut out = Vec::with_capacity(input.len() * 3 / 4);
    let mut buffer: u32 = 0;
    let mut bits = 0u32;
    for character in input.bytes() {
        let value = match character {
            b'A'..=b'Z' => character - b'A',
            b'a'..=b'z' => character - b'a' + 26,
            b'0'..=b'9' => character - b'0' + 52,
            b'-' => 62,
            b'_' => 63,
            b'=' => return None, // canonical form carries no padding
            _ => return None,
        } as u32;
        buffer = (buffer << 6) | value;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((buffer >> bits) as u8);
        }
    }
    // Leftover bits must be zero for a canonical encoding.
    if bits >= 6 || (buffer & ((1u32 << bits) - 1)) != 0 {
        return None;
    }
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha256_matches_known_vectors() {
        let digest = Sha256::digest(b"");
        assert_eq!(
            hex_lower(&digest),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
        let digest = Sha256::digest(b"abc");
        assert_eq!(
            hex_lower(&digest),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }

    #[test]
    fn canonical_json_sorts_object_keys() {
        let value: Value =
            serde_json::from_str(r#"{"b": 1, "a": {"z": true, "c": [3, 1]}}"#).unwrap();
        assert_eq!(
            canonical_json(&value).unwrap(),
            r#"{"a":{"c":[3,1],"z":true},"b":1}"#
        );
    }

    #[test]
    fn base64_url_roundtrips_and_rejects_padding() {
        for sample in [
            &b""[..],
            b"f",
            b"fo",
            b"foo",
            b"foob",
            b"fooba",
            b"foobar",
            &[0u8, 255, 10, 128, 7][..],
        ] {
            let encoded = base64_url_encode(sample);
            assert_eq!(base64_url_decode(&encoded).as_deref(), Some(sample));
            assert!(!encoded.contains('='));
        }
        assert_eq!(base64_url_encode(b"f"), "Zg");
        assert_eq!(base64_url_encode(b"fo"), "Zm8");
        assert_eq!(base64_url_encode(b"foo"), "Zm9v");
        assert_eq!(base64_url_decode("Zg=="), None, "padding is rejected");
        assert_eq!(
            base64_url_decode("Zg+/"),
            None,
            "standard alphabet is rejected"
        );
    }

    #[test]
    fn document_digest_is_stable_across_key_order() {
        let left: Value = serde_json::from_str(r#"{"a": 1, "b": {"x": true, "y": null}}"#).unwrap();
        let right: Value =
            serde_json::from_str(r#"{"b": {"y": null, "x": true}, "a": 1}"#).unwrap();
        assert_eq!(
            document_digest(&left).unwrap(),
            document_digest(&right).unwrap()
        );
        let digest = document_digest(&left).unwrap();
        assert!(digest.starts_with("sha256:"));
        assert_eq!(digest.len(), "sha256:".len() + 64);
    }
}
