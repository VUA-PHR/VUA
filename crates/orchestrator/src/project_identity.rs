//! Privacy-preserving identity for an existing local Unity project path.

use sha2::{Digest, Sha256};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ProjectIdentity(String);

#[derive(Debug)]
pub enum ProjectIdentityError {
    Resolve(std::io::Error),
    NonUnicodePath,
    InvalidDigest,
}

impl std::fmt::Display for ProjectIdentityError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Resolve(error) => {
                write!(formatter, "project path could not be resolved: {error}")
            }
            Self::NonUnicodePath => formatter.write_str("project path is not valid Unicode"),
            Self::InvalidDigest => formatter.write_str("project identity digest is invalid"),
        }
    }
}

impl std::error::Error for ProjectIdentityError {}

impl ProjectIdentity {
    /// Resolves an existing directory, normalizes its Windows final path, and
    /// retains only a SHA-256 digest. The clear path is never part of this
    /// value and therefore cannot enter the task database through lease APIs.
    pub fn from_existing_path(path: impl AsRef<Path>) -> Result<Self, ProjectIdentityError> {
        let canonical = std::fs::canonicalize(path).map_err(ProjectIdentityError::Resolve)?;
        let text = canonical
            .to_str()
            .ok_or(ProjectIdentityError::NonUnicodePath)?;
        let normalized = normalize_final_path(text);
        let digest = Sha256::digest(normalized.as_bytes());
        Ok(Self(format!("sha256:{}", hex_lower(&digest))))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub(crate) fn from_persisted(value: String) -> Result<Self, ProjectIdentityError> {
        let Some(hex) = value.strip_prefix("sha256:") else {
            return Err(ProjectIdentityError::InvalidDigest);
        };
        if hex.len() != 64 || !hex.bytes().all(|byte| byte.is_ascii_hexdigit()) {
            return Err(ProjectIdentityError::InvalidDigest);
        }
        Ok(Self(format!("sha256:{}", hex.to_ascii_lowercase())))
    }

    #[cfg(test)]
    pub(crate) fn from_test_label(label: &str) -> Self {
        let digest = Sha256::digest(label.as_bytes());
        Self(format!("sha256:{}", hex_lower(&digest)))
    }
}

impl std::fmt::Display for ProjectIdentity {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.0)
    }
}

fn normalize_final_path(path: &str) -> String {
    let without_extended_prefix = if let Some(unc) = path.strip_prefix("\\\\?\\UNC\\") {
        format!("\\\\{unc}")
    } else {
        path.strip_prefix("\\\\?\\").unwrap_or(path).to_owned()
    };
    let separated = without_extended_prefix.replace('/', "\\");
    if separated.len() > 3 {
        separated.trim_end_matches('\\').to_owned()
    } else {
        separated
    }
}

fn hex_lower(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut encoded = String::with_capacity(bytes.len() * 2);
    for &byte in bytes {
        encoded.push(HEX[(byte >> 4) as usize] as char);
        encoded.push(HEX[(byte & 0x0f) as usize] as char);
    }
    encoded
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalization_removes_windows_extended_prefix_and_trailing_separator() {
        assert_eq!(
            normalize_final_path("\\\\?\\C:\\Work\\Avatar\\"),
            r"C:\Work\Avatar"
        );
        assert_eq!(
            normalize_final_path("\\\\?\\UNC\\server\\share\\Avatar\\"),
            r"\\server\share\Avatar"
        );
    }

    #[test]
    fn identity_contains_only_a_versioned_digest() {
        let identity = ProjectIdentity::from_existing_path(".").unwrap();
        assert!(identity.as_str().starts_with("sha256:"));
        assert_eq!(identity.as_str().len(), 71);
        assert!(!identity.as_str().contains("VUA"));
    }

    #[test]
    fn equivalent_existing_path_spellings_have_one_identity() {
        let direct = ProjectIdentity::from_existing_path(".").unwrap();
        let through_child = ProjectIdentity::from_existing_path("crates/..").unwrap();
        assert_eq!(direct, through_child);
    }
}
