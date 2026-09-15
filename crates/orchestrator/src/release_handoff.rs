//! The `release.openForHandoff` core use-case face (proposal 023 freeze
//! batch follow-up slice 2: task orchestration facts + completion-judgment
//! types + editor-identity resolution wiring). The contract face (word
//! list row, params closed set, fact shape, error-code closed set) was
//! frozen in the 2026-09-16 core freeze batch; this module lands the CORE
//! side of the implementation domain:
//!
//! 1. **The process/window domain port** (`ReleaseHandoffPort`): the
//!    production-domain contract (023 production stance: the Bridge command
//!    face presumes an already-open project, so the handoff is editor-process
//!    lifecycle management — unity-bridge v3 gains zero operations). The
//!    port owns both paths (launch via `Unity.exe -projectPath` when the
//!    project is closed, OS focus when open) AND the handshake wait — the
//!    completion judgment lives behind this port and is NEVER "process
//!    started" (core freeze ruling 3: completion = Bridge handshake
//!    arrival, 001 chain; OS focus enters neither the judgment nor the
//!    fact). The concrete adapter lands with the production-domain slice;
//!    this trait IS the frozen cross-domain contract for it.
//! 2. **Editor-identity resolution** (`resolve_handoff_editor`, core
//!    freeze ruling 5): explicit injection (021 authority) > the build
//!    record's carried editor version matched against observed candidates >
//!    typed unresolved (the route answers `vua.release_handoff.
//!    editor_unresolved`; diagnosis reuses the environment.verifyEditor
//!    semantics — no new vocabulary).
//! 3. **The handoff fact document** (`build_handoff_fact`): the frozen
//!    five-key closed set (schemaVersion/buildId/projectId/editor
//!    {exePath,version}/occurredAt) — no upload-status field exists by
//!    construction (honesty rules 1/2 pinned by shape; the negative vector
//!    pins it).
//!
//! Honest-absence note: when the port is NOT wired into the provider host,
//! the route answers `vua.release_handoff.unavailable` — the frozen
//! honest-absence semantics stay the default until the production-domain
//! adapter slice lands.

use serde_json::{json, Value};
use std::path::PathBuf;

/// The `release.openForHandoff` family version constant (c914cf2 standing
/// rule: every word-list row owns its version constant; never borrowed from
/// another family). Mirrors the TS face in `@vua/contracts`.
pub const RELEASE_HANDOFF_SCHEMA_VERSION: &str = "0.1";

/// Everything the process/window port needs to perform one handoff. The
/// project root is a trusted-side internal fact (the provider's configured
/// project) — it drives `-projectPath` inside the adapter and NEVER
/// appears on the wire (023 authority-anchor 6, storedPath discipline).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HandoffLaunch {
    pub build_id: String,
    pub project_id: String,
    pub project_root: PathBuf,
    pub editor_exe: PathBuf,
    pub editor_version: String,
}

/// The port's outcome. `HandshakeArrived` is the ONLY completion fact
/// (ruling 3); a wait budget exhausted without a handshake is an honest
/// named outcome the task maps to a failure — never a guessed success.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HandoffOutcome {
    HandshakeArrived,
    HandshakeTimeout,
}

/// Why the port could not even attempt the wait (external failure class on
/// the task face; the detail travels as the error's `detail` param).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HandoffPortError {
    pub detail: String,
}

/// The production-domain process/window port (023 follow-up slice 1's
/// contract). Implementations: the real adapter (production domain —
/// process launch / OS focus / handshake wait) and, in tests, fakes. The
/// call is blocking by design: the task runtime executes jobs on dedicated
/// worker threads (ORC-CON-002), so a minutes-long editor start does not
/// block the host loop.
pub trait ReleaseHandoffPort: Send + Sync {
    /// Opens or focuses the target editor on the project and waits for the
    /// Bridge handshake (001 chain). Returns the outcome; `Err` means the
    /// handoff could not be attempted (launch failure) — a wait that runs
    /// and times out is `Ok(HandoffOutcome::HandshakeTimeout)`, because
    /// the wait itself did happen and its honest result is "no handshake".
    fn open_for_handoff(&self, launch: &HandoffLaunch) -> Result<HandoffOutcome, HandoffPortError>;
}

/// Where a candidate editor identity came from (resolution order, ruling 5).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HandoffEditorSource {
    /// The 021 explicit injection (highest priority; short-circuits).
    ExplicitInjection,
    /// An observed production-target editor (021 auto-selection face; the
    /// record's carried editor version is matched against these).
    ProductionTarget,
}

/// One observed editor identity (exe path + version read from the
/// executable per the editor-verify gate-1 discipline — never the
/// directory name).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HandoffEditorCandidate {
    pub source: HandoffEditorSource,
    pub exe_path: PathBuf,
    pub version: String,
}

/// Why resolution failed. The route maps every variant to the SAME typed
/// wire error `vua.release_handoff.editor_unresolved` (closed set — the
/// reason variants are diagnosis detail, not new vocabulary).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HandoffEditorUnresolved {
    /// An explicit injection existed but its identity could not be
    /// established at resolution time (environment changed since the 021
    /// confirmation) — reported, never silently replaced by a lower tier.
    ExplicitInjectionUnverifiable { detail: String },
    /// No editor was observed at all (021 selection face: Unavailable).
    NoEditorObserved,
    /// Editors were observed but none carries the build record's editor
    /// version — opening a different version would trigger Unity project
    /// upgrade side effects (production stance: the record's editor is the
    /// most faithful target).
    NoCandidateForRecordVersion { record_version: String },
}

/// Resolves the handoff editor identity (ruling 5):
/// explicit injection > record version match among observed candidates >
/// typed unresolved. The explicit candidate short-circuits (021 semantics:
/// the manual path already carried its own verification + confirmation);
/// it is NOT re-matched against the record version.
pub fn resolve_handoff_editor(
    candidates: &[HandoffEditorCandidate],
    record_editor_version: &str,
) -> Result<HandoffEditorCandidate, HandoffEditorUnresolved> {
    if let Some(explicit) = candidates
        .iter()
        .find(|candidate| candidate.source == HandoffEditorSource::ExplicitInjection)
    {
        // An explicit injection that reached resolution carries an
        // identity read from the executable (the host assembles candidates
        // through the editor-verify face); unverifiable injections never
        // become candidates at all, so presence here means established.
        return Ok(explicit.clone());
    }
    let observed: Vec<&HandoffEditorCandidate> = candidates
        .iter()
        .filter(|candidate| candidate.source == HandoffEditorSource::ProductionTarget)
        .collect();
    if observed.is_empty() {
        return Err(HandoffEditorUnresolved::NoEditorObserved);
    }
    let wanted = record_editor_version.trim();
    observed
        .into_iter()
        .find(|candidate| candidate.version.trim() == wanted)
        .cloned()
        .ok_or_else(|| HandoffEditorUnresolved::NoCandidateForRecordVersion {
            record_version: wanted.to_owned(),
        })
}

/// Reads the record's carried editor version from a build-record v0.3
/// document (camelCase wire face; the stored document IS the wire shape —
/// `RecipeRecordStore` stores the published document verbatim).
pub fn record_editor_version(record: &Value) -> Option<&str> {
    record
        .get("unityEditorVersion")
        .and_then(Value::as_str)
        .filter(|version| !version.is_empty())
}

/// Reads the record's carried project identity from a build-record v0.3
/// document.
pub fn record_project_id(record: &Value) -> Option<&str> {
    record
        .get("projectId")
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
}

/// Builds the handoff fact document: the frozen five-key closed set
/// (schemaVersion/buildId/projectId/editor{exePath,version}/occurredAt).
/// There is NO upload-status field and this builder cannot be talked into
/// adding one — the upload happens in the official SDK and is never a VUA
/// fact (honesty rules 1/2 pinned by shape; the negative vector pins it).
pub fn build_handoff_fact(
    build_id: &str,
    project_id: &str,
    editor_exe: &str,
    editor_version: &str,
    occurred_at: &str,
) -> Value {
    json!({
        "schemaVersion": RELEASE_HANDOFF_SCHEMA_VERSION,
        "buildId": build_id,
        "projectId": project_id,
        "editor": {
            "exePath": editor_exe,
            "version": editor_version,
        },
        "occurredAt": occurred_at,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn explicit_candidate() -> HandoffEditorCandidate {
        HandoffEditorCandidate {
            source: HandoffEditorSource::ExplicitInjection,
            exe_path: PathBuf::from("C:/Unity/2019.4.31f1/Editor/Unity.exe"),
            version: "2019.4.31f1".to_owned(),
        }
    }

    fn target_candidate(version: &str) -> HandoffEditorCandidate {
        HandoffEditorCandidate {
            source: HandoffEditorSource::ProductionTarget,
            exe_path: PathBuf::from(format!("C:/Unity/{version}/Editor/Unity.exe")),
            version: version.to_owned(),
        }
    }

    // ---- Resolution (ruling 5) ----

    #[test]
    fn explicit_injection_short_circuits_over_any_observed_candidate() {
        // Ruling 5 tier 1: the explicit injection wins even when its
        // version differs from the record's — the 021 manual pick is the
        // authority and is not re-matched.
        let candidates = vec![explicit_candidate(), target_candidate("2022.3.22f1")];
        let resolved =
            resolve_handoff_editor(&candidates, "2022.3.22f1").expect("explicit wins");
        assert_eq!(resolved.source, HandoffEditorSource::ExplicitInjection);
        assert_eq!(resolved.version, "2019.4.31f1");
    }

    #[test]
    fn record_version_match_resolves_from_observed_candidates() {
        // Ruling 5 tier 2: no explicit injection; the record's carried
        // editor version picks among observed production targets.
        let candidates = vec![
            target_candidate("2021.3.5f1"),
            target_candidate("2022.3.22f1"),
        ];
        let resolved =
            resolve_handoff_editor(&candidates, "2022.3.22f1").expect("record version matches");
        assert_eq!(resolved.version, "2022.3.22f1");
    }

    #[test]
    fn version_mismatch_is_an_honest_unresolved_never_a_guess() {
        // Opening a different editor version would trigger Unity project
        // upgrade side effects — the resolution refuses instead of picking
        // "closest" (production stance: no best-effort version drift).
        let candidates = vec![target_candidate("2021.3.5f1")];
        assert_eq!(
            resolve_handoff_editor(&candidates, "2022.3.22f1"),
            Err(HandoffEditorUnresolved::NoCandidateForRecordVersion {
                record_version: "2022.3.22f1".to_owned(),
            })
        );
    }

    #[test]
    fn no_observed_editor_is_an_honest_unresolved() {
        let candidates = vec![];
        assert_eq!(
            resolve_handoff_editor(&candidates, "2022.3.22f1"),
            Err(HandoffEditorUnresolved::NoEditorObserved)
        );
    }

    #[test]
    fn resolution_tolerates_whitespace_only_version_drift() {
        let candidates = vec![HandoffEditorCandidate {
            source: HandoffEditorSource::ProductionTarget,
            exe_path: PathBuf::from("C:/Unity/2022.3.22f1/Editor/Unity.exe"),
            version: " 2022.3.22f1 ".to_owned(),
        }];
        let resolved =
            resolve_handoff_editor(&candidates, "2022.3.22f1 ").expect("trimmed match");
        assert_eq!(resolved.version, " 2022.3.22f1 ");
    }

    // ---- Record readers ----

    #[test]
    fn record_readers_read_the_camel_case_v03_face() {
        let record = json!({
            "schemaVersion": "0.3",
            "buildId": "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99",
            "projectId": "proj-synthetic-avatar-a",
            "unityEditorVersion": "2022.3.22f1",
        });
        assert_eq!(record_editor_version(&record), Some("2022.3.22f1"));
        assert_eq!(record_project_id(&record), Some("proj-synthetic-avatar-a"));
    }

    #[test]
    fn record_readers_treat_missing_or_empty_identity_as_absent() {
        let record = json!({"schemaVersion": "0.3", "buildId": "b1"});
        assert_eq!(record_editor_version(&record), None);
        assert_eq!(record_project_id(&record), None);
        let empty = json!({"projectId": "", "unityEditorVersion": ""});
        assert_eq!(record_editor_version(&empty), None);
        assert_eq!(record_project_id(&empty), None);
    }

    // ---- Fact builder ----

    #[test]
    fn fact_is_exactly_the_frozen_five_key_closed_set() {
        let fact = build_handoff_fact(
            "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99",
            "proj-synthetic-avatar-a",
            "C:/Unity/2022.3.22f1/Editor/Unity.exe",
            "2022.3.22f1",
            "2026-09-16T02:30:00Z",
        );
        let object = fact.as_object().expect("fact is an object");
        let mut keys: Vec<_> = object.keys().cloned().collect();
        keys.sort();
        assert_eq!(
            keys,
            vec!["buildId", "editor", "occurredAt", "projectId", "schemaVersion"]
        );
        assert_eq!(fact["schemaVersion"], "0.1");
        assert_eq!(fact["editor"]["exePath"], "C:/Unity/2022.3.22f1/Editor/Unity.exe");
        assert_eq!(fact["editor"]["version"], "2022.3.22f1");
        // Honesty rule 1/2 by shape: no upload-status-like field exists.
        assert!(object.get("uploadStatus").is_none());
        assert!(object.get("upload").is_none());
    }

    // ---- Port contract (fake consumer, ruling-15 local-first shape) ----

    #[test]
    fn port_contract_consumes_a_fake_and_reports_only_honest_outcomes() {
        struct FakePort {
            outcome: Result<HandoffOutcome, HandoffPortError>,
            seen: std::sync::Mutex<Option<HandoffLaunch>>,
        }
        impl ReleaseHandoffPort for FakePort {
            fn open_for_handoff(
                &self,
                launch: &HandoffLaunch,
            ) -> Result<HandoffOutcome, HandoffPortError> {
                *self.seen.lock().expect("lock") = Some(launch.clone());
                self.outcome.clone()
            }
        }
        let launch = HandoffLaunch {
            build_id: "b1".to_owned(),
            project_id: "proj-1".to_owned(),
            project_root: PathBuf::from("C:/proj"),
            editor_exe: PathBuf::from("C:/Unity/2022.3.22f1/Editor/Unity.exe"),
            editor_version: "2022.3.22f1".to_owned(),
        };
        let port = FakePort {
            outcome: Ok(HandoffOutcome::HandshakeArrived),
            seen: std::sync::Mutex::new(None),
        };
        let port: Box<dyn ReleaseHandoffPort> = Box::new(port);
        assert_eq!(port.open_for_handoff(&launch), Ok(HandoffOutcome::HandshakeArrived));
        let timeout_port: Box<dyn ReleaseHandoffPort> = Box::new(FakePort {
            outcome: Ok(HandoffOutcome::HandshakeTimeout),
            seen: std::sync::Mutex::new(None),
        });
        assert_eq!(
            timeout_port.open_for_handoff(&launch),
            Ok(HandoffOutcome::HandshakeTimeout)
        );
        let failed_port: Box<dyn ReleaseHandoffPort> = Box::new(FakePort {
            outcome: Err(HandoffPortError {
                detail: "launch failed".to_owned(),
            }),
            seen: std::sync::Mutex::new(None),
        });
        assert!(failed_port.open_for_handoff(&launch).is_err());
    }
}
