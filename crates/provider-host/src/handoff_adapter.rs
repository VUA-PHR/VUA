//! The core assembly adapter for `release.openForHandoff` (proposal 023
//! assembly slice, BOARD #30): adapts the production-domain mechanism port
//! [`vua_unity_bridge::handoff::EditorHandoffPort`] (unity-bridge handoff
//! module, production slice 1) to the frozen core-side use-case contract
//! [`vua_orchestrator::ReleaseHandoffPort`].
//!
//! This adapter is a MECHANICAL translation of the two frozen faces — it
//! adds no judgment semantics of its own:
//!
//! - probe `Open(trail)` → the handshake trail IS the completion fact
//!   (core freeze ruling 3: completion = Bridge handshake arrival; the
//!   trail exists and its process is alive, so the wait has nothing left
//!   to wait for). Best-effort OS focus fires as a side action and enters
//!   neither the judgment nor the fact (production stance ③).
//! - probe `Closed` → launch (`Unity.exe -projectPath`, credential-stripped
//!   R2-2 baseline, never awaited — the editor is long-lived), then wait
//!   for the handshake within the production-domain default budget. A wait
//!   that runs and times out is the honest `HandshakeTimeout` — never a
//!   guessed success; a launch that could not even be attempted is the
//!   `Err` class (the task face maps it to `vua.job.handoff_launch_failed`).
//! - any mechanism `Err` (probe I/O failure, launch spawn failure, wait
//!   I/O failure) is reported through `HandoffPortError` with the real
//!   cause as `detail` — never folded into a guessed path.
//!
//! Version note: the already-open path delivers the user to the editor
//! session that is ACTUALLY open; the record-version mismatch guard lives
//! in the admission-time editor-identity resolution (ruling 5), which
//! selects the launch executable. VUA never restarts or second-guesses a
//! running editor (production stance: the duplicate-open guard keeps the
//! launch path safe; focus is best-effort).
//!
//! Honest-absence convergence: with this adapter wired by the default
//! provider assembly (`vua-orchestrator-provider`), the
//! `vua.release_handoff.unavailable` code stops being the default answer
//! of an unwired port and remains only for an explicitly port-less
//! assembly (tests / hosted embeddings that choose absence) — the route
//! then runs the full admission flow instead.

use std::sync::Arc;

use vua_orchestrator::{HandoffLaunch, HandoffOutcome, HandoffPortError, ReleaseHandoffPort};
use vua_unity_bridge::handoff::{
    DefaultEditorHandoff, EditorHandoffPort, EditorOpenState, HandoffError,
    DEFAULT_HANDSHAKE_BUDGET,
};

/// Adapts the production-domain mechanism port to the core use-case port.
/// The default construction wires the real OS mechanism
/// ([`DefaultEditorHandoff`]); tests inject the mechanism parts through
/// [`EditorHandoffAdapter::with_editor`].
pub struct EditorHandoffAdapter {
    editor: Arc<dyn EditorHandoffPort>,
}

impl EditorHandoffAdapter {
    /// Real mechanism wiring (detached launcher, system wait, OS liveness,
    /// OS window focus).
    pub fn new() -> Self {
        Self {
            editor: Arc::new(DefaultEditorHandoff::new()),
        }
    }

    /// Test/alternative-mechanism wiring: any `EditorHandoffPort`
    /// implementation (the production-domain port accepts part injection).
    pub fn with_editor(editor: Arc<dyn EditorHandoffPort>) -> Self {
        Self { editor }
    }

    fn focus_quietly(&self, pid: u32) {
        // Best-effort side action (production stance ③): the outcome never
        // enters the completion judgment and never enters the handoff fact.
        let _ = self.editor.focus(pid);
    }
}

impl Default for EditorHandoffAdapter {
    fn default() -> Self {
        Self::new()
    }
}

impl ReleaseHandoffPort for EditorHandoffAdapter {
    fn open_for_handoff(&self, launch: &HandoffLaunch) -> Result<HandoffOutcome, HandoffPortError> {
        match self.editor.probe(&launch.project_root) {
            Err(error) => Err(HandoffPortError {
                detail: error.to_string(),
            }),
            Ok(EditorOpenState::Open(trail)) => {
                // Already open: the valid, live handshake trail is the
                // completion fact itself (ruling 3). Focus the existing
                // window as a courtesy side action; never launch a second
                // editor over a live session.
                self.focus_quietly(trail.pid);
                Ok(HandoffOutcome::HandshakeArrived)
            }
            Ok(EditorOpenState::Closed) => {
                // Launch path: Unity's own duplicate-open guard keeps this
                // safe even against a racing user launch (production slice
                // mechanism fact). "Process started" is NOT the completion
                // fact — the handshake wait below owns the verdict.
                self.editor
                    .launch(&launch.editor_exe, &launch.project_root)
                    .map_err(|error| HandoffPortError {
                        detail: error.to_string(),
                    })?;
                match self
                    .editor
                    .await_handshake(&launch.project_root, DEFAULT_HANDSHAKE_BUDGET)
                {
                    Ok(trail) => {
                        self.focus_quietly(trail.pid);
                        Ok(HandoffOutcome::HandshakeArrived)
                    }
                    Err(HandoffError::HandshakeTimeout { .. }) => {
                        // The wait ran within the budget and no handshake
                        // arrived: the honest timeout outcome — the task
                        // face maps it to a recoverable failure, never a
                        // guessed success.
                        Ok(HandoffOutcome::HandshakeTimeout)
                    }
                    Err(error) => Err(HandoffPortError {
                        detail: error.to_string(),
                    }),
                }
            }
        }
    }
}
