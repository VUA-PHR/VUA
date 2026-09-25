# Unity Editor and Path-Like Configuration Form — Decision


> Document version: ADR
> Status: Accepted — product-owner ruling (2026-09-12)
> Scope: the configuration form of the Unity editor path and all path-like settings
> (settings surface, validation, security tiers, presentation)
> Normative effect: governs the environment-deployment settings surface, environment-detection
> presentation, editor provisioning for the direct production chain and the local VPM
> generation chain, and every future path-like setting; aligns with the
> [Unity Editor compatibility policy](../compatibility/unity-editor.md) and the design
> standard
> Ruling background: the work cluster proposed three options for editor-path configuration
> (A: build a small config surface / B: keep the status quo / C: auto-detect only). Reviewed
> for interaction comfort, efficiency, and security; the composed form below was adopted by
> user ruling (2026-09-12) and ordered frozen into a file.

## Ruling

1. **Zero-config by default**: when exactly one production-target editor (global
   `2022.3.22f1`) is detected, activate directly; the settings page only presents facts
   (path, version, provenance) and a "Change" affordance. With multiple candidates, choose
   by policy (production-target version first, then the Unity Hub default); the selection
   process is invisible to the user. **Manual selection is never a required step on the
   standard path.**
2. **Remedial manual selection**: a manual picker appears only when detection fails or no
   candidate matches the production target — and only then. A manual path must pass three
   checks:
   ① **Identity** — read the version string to confirm it is a Unity editor; never trust
   the path name;
   ② **Version** — exact global `2022.3.22f1` earns the "production target" badge; other
   versions receive the unsupported-environment diagnosis and guidance per the
   [compatibility policy](../compatibility/unity-editor.md) and are **never silently used**;
   ③ **Trust display** — state plainly that "VUA will run production operations on this
   machine with this program" (batch mode executes code with the user's privileges), with a
   confirmation before first actual use; the choice is recorded as a user decision.
3. **Location and timing**: path selection lives only in the "Environment & Paths" settings
   section — **never mid-task**. When a task finds no editor, it shows an honest empty state
   plus a one-click jump to settings; no mid-task picker (mid-task prompts create "just pick
   anything" pressure, the channel through which wrong paths enter production).
4. **One config surface feeds both chains**: the direct chain (`.unitypackage` direct
   import) and the local VPM generation chain read the same editor configuration; the
   "generate VPM alternative" experimental switch's backend activates with it. No second
   place to configure.
5. **Failure is an empty state plus guidance**: detection failure = empty fact + a remedy
   entry point, never a blocker for other features.

## General rules for path-like configuration

Applies to every path-like setting (Unity editor, `vrc-get`, VCC/ALCOM, Steam/SteamVR,
download/staging directories, project directories):

1. **Detection first; facts shown with provenance**: every path-like capability has a
   detection source; show the detected result and where it came from ("from the Hub
   registry" / "user-selected" / "managed by an external manager");
2. **Manual entry is always validated**: no bare text fields; validate identity/version/
   writability per tool type;
3. **Failure is an empty state plus guidance**, not an error;
4. **Security tiers**: paths that get **executed** (editor, `vrc-get`, other executables)
   require identity + version verification + first-use confirmation; paths that are only
   **read/written** (download/staging/project directories) require writability checks and
   system-directory guards (especially the Warehouse "delete originals" flow — pointing it
   at a system directory is an incident);
5. **Stored per machine**: path settings are local machine settings; they never enter
   projects or Build Records, and are treated as personal information for diagnostic
   redaction;
6. **One settings home**: a single "Environment & Paths" section lists each tool with its
   status (detected / manual / missing); no path pickers scattered across pages.

## Implementation guidance and acceptance

Acceptance criteria for implementation slices:

1. Standard installs activate with zero configuration (detection presented as fact, with
   provenance);
2. Each of the three manual-path checks has a rejection path (fake editor / wrong version /
   user cancel);
3. Detection failure renders a guided empty state and blocks nothing else;
4. Both chains read the same configuration (no second copy);
5. The "Environment & Paths" section shows provenance per row (detected / manual /
   externally managed).

Relationship to existing documents: Unity version determination and diagnosis follow the
[Unity Editor compatibility policy](../compatibility/unity-editor.md); settings
persistence and presentation discipline follow the design standard; **configuration
activation is not end-to-end verification** — the W25 real-machine window and gate-acceptance
evidence requirements are not relaxed by this ruling; diagnostic redaction (M9) checks
against general rule 5.

## Document changelog

- ADR accepted (2026-09-12): after reviewing the three options (A: small config surface /
  B: status quo / C: auto-detect only), adopted the composed form "zero-config by default +
  remedial manual selection + validation and trust display", generalized into the rules for
  all path-like configuration.
