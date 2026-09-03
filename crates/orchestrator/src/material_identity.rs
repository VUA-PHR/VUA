//! Local ownership of hidden VPM machine IDs and visible folder names.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalPackageIdentity {
    pub source_key: String,
    pub package_id: String,
    pub display_name: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IdentityDocument {
    #[serde(default = "identity_version")]
    schema_version: String,
    #[serde(default)]
    identities: Vec<LocalPackageIdentity>,
}

fn identity_version() -> String {
    "0.1".to_owned()
}

pub struct LocalPackageIdentityStore {
    path: PathBuf,
}

impl LocalPackageIdentityStore {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self { path: path.into() }
    }

    pub fn resolve(
        &self,
        source_folder: &Path,
        requested_name: &str,
    ) -> io::Result<LocalPackageIdentity> {
        if requested_name.trim().is_empty() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "empty display name",
            ));
        }
        let canonical = source_folder.canonicalize()?;
        if !canonical.is_dir() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "source is not a directory",
            ));
        }
        let key = digest_text(&canonical.to_string_lossy().to_ascii_lowercase());
        let mut document = self.load()?;
        if document.schema_version != "0.1" {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "unknown identity version",
            ));
        }
        if let Some(existing) = document
            .identities
            .iter()
            .find(|value| value.source_key == key)
        {
            return Ok(existing.clone());
        }
        let base = requested_name.trim();
        let mut display_name = base.to_owned();
        let mut suffix = 2_u32;
        while document
            .identities
            .iter()
            .any(|value| value.display_name == display_name)
        {
            display_name = format!("{base} ({suffix})");
            suffix += 1;
        }
        let slug = machine_slug(base);
        let package_id = format!("com.ph-r.vua.local.{slug}.{}", &key[7..19]);
        let identity = LocalPackageIdentity {
            source_key: key,
            package_id,
            display_name,
        };
        document.identities.push(identity.clone());
        document
            .identities
            .sort_by(|left, right| left.source_key.cmp(&right.source_key));
        self.save(&document)?;
        Ok(identity)
    }

    fn load(&self) -> io::Result<IdentityDocument> {
        if !self.path.exists() {
            return Ok(IdentityDocument {
                schema_version: identity_version(),
                identities: Vec::new(),
            });
        }
        serde_json::from_slice(&fs::read(&self.path)?)
            .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error))
    }

    fn save(&self, document: &IdentityDocument) -> io::Result<()> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }
        let temporary = self.path.with_extension("tmp");
        let bytes = serde_json::to_vec_pretty(document)
            .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error))?;
        {
            let mut output = OpenOptions::new()
                .create(true)
                .truncate(true)
                .write(true)
                .open(&temporary)?;
            output.write_all(&bytes)?;
            output.write_all(b"\n")?;
            output.sync_all()?;
        }
        if self.path.exists() {
            fs::remove_file(&self.path)?;
        }
        fs::rename(temporary, &self.path)
    }
}

fn machine_slug(value: &str) -> String {
    let mut slug = String::new();
    let mut separator = false;
    for character in value.chars().flat_map(char::to_lowercase) {
        if character.is_ascii_alphanumeric() {
            slug.push(character);
            separator = false;
        } else if !separator && !slug.is_empty() {
            slug.push('-');
            separator = true;
        }
    }
    while slug.ends_with('-') {
        slug.pop();
    }
    if slug.len() > 32 {
        slug.truncate(32);
        while slug.ends_with('-') {
            slug.pop();
        }
    }
    if slug.len() < 3 {
        "asset".to_owned()
    } else {
        slug
    }
}

fn digest_text(value: &str) -> String {
    let bytes = Sha256::digest(value.as_bytes());
    let mut output = String::from("sha256:");
    for byte in bytes {
        use std::fmt::Write as _;
        write!(&mut output, "{byte:02x}").expect("writing to String");
    }
    output
}
