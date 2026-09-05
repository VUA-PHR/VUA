//! LocalArtifact inspection — the AMF gate between transfer completion and
//! trusted content (download-events protocol v0.1: completed ≠ admitted).
//!
//! B4 implements the minimal mechanical set: size bound, extension
//! allowlist, streaming SHA-256. Source and page-context cross-checks stay
//! with AMF, expressed as the separate `admit` decision. Verdicts are
//! idempotent per content: re-inspecting an already-concluded artifact
//! returns the stored verdict instead of erroring.

use crate::bdl_store::{
    ArtifactInspectionState, ArtifactRecordingOutcome, BdlStore, BdlStoreError, NewLocalArtifact,
    StoredArtifact,
};
use crate::time::Clock;
use sha2::{Digest, Sha256};
use std::io::Read;
use std::path::Path;

/// Inspection thresholds. The defaults map to the two material-intake v0.1
/// channels: direct `.unitypackage` and `.zip`-carried local VPM work.
#[derive(Debug, Clone)]
pub struct InspectionPolicy {
    pub max_bytes: u64,
    /// Lowercase extensions without the leading dot.
    pub allowed_extensions: Vec<String>,
}

impl Default for InspectionPolicy {
    fn default() -> Self {
        Self {
            max_bytes: 8 * 1024 * 1024 * 1024,
            allowed_extensions: ["unitypackage", "zip"]
                .iter()
                .map(|extension| extension.to_string())
                .collect(),
        }
    }
}

#[derive(Debug)]
pub enum InspectionError {
    Io(std::io::Error),
    Store(BdlStoreError),
}

impl From<std::io::Error> for InspectionError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

impl From<BdlStoreError> for InspectionError {
    fn from(error: BdlStoreError) -> Self {
        Self::Store(error)
    }
}

impl std::fmt::Display for InspectionError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(error) => write!(formatter, "artifact staging file failed: {error}"),
            Self::Store(error) => write!(formatter, "{error}"),
        }
    }
}

impl std::error::Error for InspectionError {}

pub struct ArtifactInspectionRequest<'a> {
    /// The staged file (`storedPath` — the only path field the protocol
    /// carries).
    pub file_path: &'a Path,
    pub suggested_file_name: Option<&'a str>,
    pub download_id: Option<&'a str>,
}

pub struct ArtifactInspector<'a> {
    store: &'a BdlStore,
    clock: &'a dyn Clock,
    policy: InspectionPolicy,
}

impl<'a> ArtifactInspector<'a> {
    pub fn new(store: &'a BdlStore, clock: &'a dyn Clock) -> Self {
        Self {
            store,
            clock,
            policy: InspectionPolicy::default(),
        }
    }

    pub fn with_policy(
        store: &'a BdlStore,
        clock: &'a dyn Clock,
        policy: InspectionPolicy,
    ) -> Self {
        Self {
            store,
            clock,
            policy,
        }
    }

    /// Run the mechanical inspection. The content identity is computed
    /// before any row exists, so the recorded lifecycle is always keyed by
    /// content, never by path or name.
    pub fn inspect(
        &self,
        request: &ArtifactInspectionRequest<'_>,
    ) -> Result<StoredArtifact, InspectionError> {
        let metadata = std::fs::metadata(request.file_path)?;
        let size_bytes = metadata.len();
        let identity = format!("sha256:{}", hex_lower(&sha256_file(request.file_path)?));
        let now = self.clock.now_rfc3339();
        let recording = self.store.record_untrusted_artifact(&NewLocalArtifact {
            artifact_sha256: identity.clone(),
            size_bytes,
            suggested_file_name: request.suggested_file_name.map(str::to_string),
            download_id: request.download_id.map(str::to_string),
            first_seen_at: now.clone(),
        })?;
        if recording.outcome == ArtifactRecordingOutcome::Existing
            && recording.artifact.inspection_state != ArtifactInspectionState::Untrusted
        {
            // Content already concluded (maybe by an earlier download):
            // inspection is idempotent per content — never re-judged.
            return Ok(recording.artifact);
        }

        let rejection_reason = self.rejection_reason(request, size_bytes);
        match rejection_reason {
            Some(reason) => Ok(self
                .store
                .transition_artifact(&identity, ArtifactInspectionState::Rejected, &now, Some(&reason))?),
            None => Ok(self
                .store
                .transition_artifact(&identity, ArtifactInspectionState::Inspected, &now, None)?),
        }
    }

    /// AMF's admission decision after its own source and page-context
    /// cross-check. Keeps the original `inspected_at` verdict time.
    pub fn admit(&self, artifact_sha256: &str) -> Result<StoredArtifact, InspectionError> {
        Ok(self.store.transition_artifact(
            artifact_sha256,
            ArtifactInspectionState::Admitted,
            &self.clock.now_rfc3339(),
            None,
        )?)
    }

    fn rejection_reason(
        &self,
        request: &ArtifactInspectionRequest<'_>,
        size_bytes: u64,
    ) -> Option<String> {
        if size_bytes > self.policy.max_bytes {
            return Some(format!(
                "size {size_bytes} exceeds the allowed maximum {}",
                self.policy.max_bytes
            ));
        }
        let name = request
            .suggested_file_name
            .map(std::path::PathBuf::from)
            .or_else(|| Some(request.file_path.to_path_buf()));
        let extension = name
            .as_deref()
            .and_then(|path| path.extension())
            .and_then(|extension| extension.to_str())
            .map(|extension| extension.to_ascii_lowercase());
        match extension {
            None => Some("file name carries no extension to allow-list".into()),
            Some(extension) if !self.policy.allowed_extensions.contains(&extension) => {
                Some(format!("extension \".{extension}\" is not in the allowed list"))
            }
            Some(_) => None,
        }
    }
}

fn sha256_file(path: &Path) -> std::io::Result<[u8; 32]> {
    let mut file = std::fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = vec![0u8; 1024 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(hasher.finalize().into())
}

fn hex_lower(bytes: &[u8]) -> String {
    let mut output = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        output.push(char::from_digit(u32::from(byte >> 4), 16).expect("nibble"));
        output.push(char::from_digit(u32::from(byte & 0x0f), 16).expect("nibble"));
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::time::FixedClock;

    fn clock(readings: &[&str]) -> FixedClock {
        FixedClock::new(readings)
    }

    fn temp_file(name: &str, contents: &[u8]) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "vua-inspect-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join(name);
        std::fs::write(&path, contents).unwrap();
        path
    }

    fn request<'a>(path: &'a Path, suggested: Option<&'a str>) -> ArtifactInspectionRequest<'a> {
        ArtifactInspectionRequest {
            file_path: path,
            suggested_file_name: suggested,
            download_id: Some("dl-1"),
        }
    }

    #[test]
    fn passing_inspection_records_the_content_identity_and_verdict() {
        let store = BdlStore::open_in_memory().unwrap();
        let clock = clock(&["2026-09-06T08:16:00.000Z"]);
        let inspector = ArtifactInspector::new(&store, &clock);
        let contents = b"PK\x03\x04 synthetic material fixture, not real product content";
        let path = temp_file("material-pack.zip", contents);

        let artifact = inspector.inspect(&request(&path, Some("material-pack.zip"))).unwrap();
        let mut hasher = Sha256::new();
        hasher.update(contents);
        let expected = format!("sha256:{}", hex_lower(&hasher.finalize()));
        assert_eq!(artifact.artifact_sha256, expected);
        assert_eq!(artifact.size_bytes, contents.len() as u64);
        assert_eq!(artifact.inspection_state, ArtifactInspectionState::Inspected);
        assert_eq!(artifact.inspected_at.as_deref(), Some("2026-09-06T08:16:00.000Z"));
        assert_eq!(artifact.download_id.as_deref(), Some("dl-1"));

        let admitted = inspector.admit(&artifact.artifact_sha256).unwrap();
        assert_eq!(admitted.inspection_state, ArtifactInspectionState::Admitted);
        assert_eq!(
            admitted.inspected_at.as_deref(),
            Some("2026-09-06T08:16:00.000Z"),
            "admission keeps the mechanical verdict time"
        );
        std::fs::remove_dir_all(path.parent().unwrap()).ok();
    }

    #[test]
    fn oversize_and_extension_failures_reject_with_honest_reasons() {
        let store = BdlStore::open_in_memory().unwrap();
        let clock = clock(&["2026-09-06T08:16:00.000Z"]);
        let policy = InspectionPolicy {
            max_bytes: 4,
            ..InspectionPolicy::default()
        };
        let inspector = ArtifactInspector::with_policy(&store, &clock, policy);

        let big = temp_file("big.zip", b"0123456789");
        let rejected = inspector.inspect(&request(&big, Some("big.zip"))).unwrap();
        assert_eq!(rejected.inspection_state, ArtifactInspectionState::Rejected);
        assert!(
            rejected.rejection_reason.as_deref().unwrap_or("").starts_with("size 10 exceeds"),
            "honest size verdict: {:?}",
            rejected.rejection_reason
        );

        let executable = temp_file("setup.exe", b"tiny");
        let rejected = inspector.inspect(&request(&executable, Some("setup.exe"))).unwrap();
        assert_eq!(rejected.inspection_state, ArtifactInspectionState::Rejected);
        assert_eq!(
            rejected.rejection_reason.as_deref(),
            Some("extension \".exe\" is not in the allowed list")
        );

        let extensionless = temp_file("README", b"R33D");
        let rejected = inspector.inspect(&request(&extensionless, None)).unwrap();
        assert_eq!(rejected.inspection_state, ArtifactInspectionState::Rejected);
        assert_eq!(
            rejected.rejection_reason.as_deref(),
            Some("file name carries no extension to allow-list")
        );
        std::fs::remove_dir_all(big.parent().unwrap()).ok();
    }

    #[test]
    fn inspection_is_idempotent_per_content_across_downloads() {
        let store = BdlStore::open_in_memory().unwrap();
        let clock = clock(&["2026-09-06T08:16:00.000Z"]);
        let inspector = ArtifactInspector::new(&store, &clock);
        let contents = b"PK\x03\x04 identical content, second download";
        let first = temp_file("first.zip", contents);
        let second = temp_file("second.zip", contents);

        let first_artifact = inspector.inspect(&request(&first, Some("first.zip"))).unwrap();
        let second_request = ArtifactInspectionRequest {
            file_path: &second,
            suggested_file_name: Some("second.zip"),
            download_id: Some("dl-2"),
        };
        let second_artifact = inspector.inspect(&second_request).unwrap();
        assert_eq!(second_artifact.download_id.as_deref(), Some("dl-1"), "the original sighting row stays");
        assert_eq!(second_artifact.inspection_state, ArtifactInspectionState::Inspected);
        assert_eq!(first_artifact.artifact_sha256, second_artifact.artifact_sha256);

        // A rejected content stays rejected on re-inspection, without a
        // second verdict pass.
        let policy = InspectionPolicy {
            allowed_extensions: vec!["unitypackage".into()],
            ..InspectionPolicy::default()
        };
        let strict = ArtifactInspector::with_policy(&store, &clock, policy);
        let zip_again = temp_file("again.zip", b"PK\x03\x04 rejected content");
        let rejected = strict.inspect(&request(&zip_again, Some("again.zip"))).unwrap();
        assert_eq!(rejected.inspection_state, ArtifactInspectionState::Rejected);
        let replay = strict.inspect(&request(&zip_again, Some("again.zip"))).unwrap();
        assert_eq!(replay.inspection_state, ArtifactInspectionState::Rejected);
        std::fs::remove_dir_all(first.parent().unwrap()).ok();
    }

    #[test]
    fn a_missing_staging_file_is_an_error_not_a_verdict() {
        let store = BdlStore::open_in_memory().unwrap();
        let clock = clock(&["2026-09-06T08:16:00.000Z"]);
        let inspector = ArtifactInspector::new(&store, &clock);
        let missing = std::env::temp_dir().join("vua-inspect-does-not-exist.zip");
        assert!(matches!(
            inspector.inspect(&request(&missing, Some("missing.zip"))),
            Err(InspectionError::Io(_))
        ));
    }
}
