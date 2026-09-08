//! M6 EAC package (proposal 006 R3): the candidate re-verification
//! primitive — the read-only half of the termination face.
//!
//! R3: before every termination, the candidate is re-verified against the
//! allowlist entry — name, PID, path, and signature; ANY element that
//! cannot be re-verified refuses the termination (R3: 核验失败不算发现，
//! 不得猜测补齐). This module performs the read-only checks that can run
//! without the termination privilege:
//!
//! - name match against the entry (from the process snapshot);
//! - executable path read (OpenProcess with
//!   PROCESS_QUERY_LIMITED_INFORMATION + QueryFullProcessImageNameW — a
//!   read-only query) and case-insensitive pattern match;
//! - signature: **unverified in v0.1** — the WinVerifyTrust binding lands
//!   with the termination slice; until then the overall verdict is
//!   honestly Refused (SignatureUnverified), because R3 refuses when any
//!   element cannot be verified. The refusal is the DESIGNED v0.1
//!   outcome, not a defect.
//!
//! v0.1 never opens a process with termination rights and never calls
//! TerminateProcess — that is the next slice, behind its own confirmation
//! chain (R5/R6).

use serde::Serialize;

use crate::eac_allowlist::{path_pattern_matches, AllowlistEntryV01};
use crate::eac_probe::ProcessSnapshotSource;

/// Verification-check codes (vua.eac_verify.*).
pub mod codes {
    pub const NAME_MISMATCH: &str = "vua.eac_verify.name_mismatch";
    pub const PATH_MISMATCH: &str = "vua.eac_verify.path_mismatch";
    pub const PATH_UNREADABLE: &str = "vua.eac_verify.path_unreadable";
    pub const PROCESS_NOT_FOUND: &str = "vua.eac_verify.process_not_found";
    pub const SIGNATURE_UNVERIFIED: &str = "vua.eac_verify.signature_unverified";
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SignatureState {
    /// v0.1 constant: the WinVerifyTrust binding is not wired yet; the
    /// honest state for every candidate is unverified.
    Unverified,
}

/// One check with its outcome.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerificationCheck {
    pub code: &'static str,
    pub passed: bool,
    pub detail: String,
}

/// The overall verdict.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Verdict {
    Verified,
    Refused,
}

/// The full re-verification report for one candidate PID.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CandidateVerificationV01 {
    pub schema_version: &'static str,
    pub pid: u32,
    pub verdict: Verdict,
    pub signature_state: SignatureState,
    pub checks: Vec<VerificationCheck>,
}

pub const EAC_VERIFY_SCHEMA_VERSION: &str = "vua.eac_verify/v0.1";

/// Reads the executable path of `pid` (read-only query). Windows-only;
/// other targets report unreadable (the product is Windows-first).
fn read_process_image_path(pid: u32) -> Option<String> {
    #[cfg(windows)]
    {
        use windows_sys::Win32::System::Threading::{
            OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION,
        };
        let handle = unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid) };
        if handle.is_null() {
            return None;
        }
        let mut buffer = [0u16; 2048];
        let mut length = buffer.len() as u32;
        let ok = unsafe {
            windows_sys::Win32::System::Threading::QueryFullProcessImageNameW(
                handle,
                0,
                buffer.as_mut_ptr(),
                &mut length,
            )
        };
        unsafe { windows_sys::Win32::Foundation::CloseHandle(handle) };
        if ok == 0 || length == 0 {
            return None;
        }
        Some(String::from_utf16_lossy(&buffer[..length as usize]))
    }
    #[cfg(not(windows))]
    {
        let _ = pid;
        None
    }
}

/// Re-verifies the candidate `pid` against `entry` (R3). The candidate
/// must still be in the process snapshot (a vanished candidate is a
/// refusal, not a success). Every check lands in the report; the verdict
/// is Verified only when ALL checks pass — in v0.1 the signature check is
/// always unverified, so the designed verdict is Refused until the
/// termination slice wires WinVerifyTrust.
pub fn verify_candidate(
    pid: u32,
    entry: &AllowlistEntryV01,
    source: &dyn ProcessSnapshotSource,
) -> CandidateVerificationV01 {
    let mut checks = Vec::new();

    // Check 1: the candidate is still in the table under the entry's name.
    let snapshot_entry = source.snapshot().ok().and_then(|entries| {
        entries.into_iter().find(|candidate| candidate.pid == pid)
    });
    let name_matched = match &snapshot_entry {
        Some(candidate) if candidate.image_name.to_ascii_lowercase() == entry.process_name => {
            checks.push(VerificationCheck {
                code: codes::NAME_MISMATCH,
                passed: true,
                detail: format!("image name matches {}", entry.process_name),
            });
            true
        }
        Some(candidate) => {
            checks.push(VerificationCheck {
                code: codes::NAME_MISMATCH,
                passed: false,
                detail: format!(
                    "image name {} does not match {}",
                    candidate.image_name, entry.process_name
                ),
            });
            false
        }
        None => {
            checks.push(VerificationCheck {
                code: codes::PROCESS_NOT_FOUND,
                passed: false,
                detail: format!("pid {pid} is no longer in the process table"),
            });
            false
        }
    };

    // Check 2: the executable path reads and matches the entry's pattern.
    let image_path: Option<String> = snapshot_entry
        .as_ref()
        .and_then(|candidate| candidate.path.clone())
        .or_else(|| read_process_image_path(pid));
    let path_matched = match &image_path {
        Some(path) => {
            let matches =
                path_pattern_matches(&entry.expected_path_pattern, path).is_some();
            checks.push(VerificationCheck {
                code: codes::PATH_MISMATCH,
                passed: matches,
                detail: if matches {
                    format!("{path} matches the expected path pattern")
                } else {
                    format!(
                        "{path} does not match the expected path pattern {}",
                        entry.expected_path_pattern
                    )
                },
            });
            matches
        }
        None => {
            checks.push(VerificationCheck {
                code: codes::PATH_UNREADABLE,
                passed: false,
                detail: "the executable path could not be read — refusing (never guessed)"
                    .to_owned(),
            });
            false
        }
    };
    // Check 3 (v0.1): signature unverified — honest refusal until the
    // WinVerifyTrust binding lands with the termination slice.
    let signature_state = SignatureState::Unverified;
    checks.push(VerificationCheck {
        code: codes::SIGNATURE_UNVERIFIED,
        passed: false,
        detail: "signature verification is not wired in v0.1 — R3 refuses when any element cannot be verified".to_owned(),
    });

    // v0.1: the signature state is always Unverified, so the designed
    // verdict is Refused for every candidate — the WinVerifyTrust binding
    // lands with the termination slice and flips the signature check only.
    let signature_verified = signature_state != SignatureState::Unverified;
    let verdict = if name_matched && path_matched && signature_verified {
        Verdict::Verified
    } else {
        Verdict::Refused
    };

    CandidateVerificationV01 {
        schema_version: EAC_VERIFY_SCHEMA_VERSION,
        pid,
        verdict,
        signature_state,
        checks,
    }
}
