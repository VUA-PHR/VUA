# VPM asset-package Spike closure record

Date: 2026-09-03
Status: pre-B3 implementation evidence, not a publication capability

## Conclusion

VUA can keep a source `.unitypackage` unchanged, create a `local-reusable` VPM package in an isolated
Unity `2022.3.22f1` staging project, and install it into a fresh validation project through VUA's
`vrc-get` library adapter. Copying directly into `Packages/` is no longer final installation evidence.

This Spike does not pull all of B6 forward. It adds only the local-package registration, complete change
preview, digest binding, and apply seam. ALCOM/VCC project compatibility, repositories, and general
environment management remain in B6.

## Fixed boundaries

- Creation, installation, and public release are separate use cases; this slice cannot publish.
- Users see a name inherited from the source folder; collisions use `Name (2)`, `Name (3)`. VUA persists
  a valid machine ID in its local identity record. Users neither enter nor see it.
- Dependencies must be explicit in the generated manifest. A missing dependency makes the `vrc-get`
  preview reject installation; removing the declaration to make a test pass is forbidden.
- Source GUIDs, `.meta` files, and relative hierarchy are retained. Hard-coded `Assets/` paths are
  reported and are not rewritten without a type-specific rule.
- License evidence supports a local-use disposition only; `local-reusable` does not imply redistribution rights.
- Package Manager discovery and loading one expected asset prove `minimum_structure`, not Avatar, outfit,
  material, animation, or Modular Avatar semantics.

## Executable-input ruling

Before Unity starts, VUA scans C#, assemblies, native plugins, `Editor` content, and build entry points.
One pending execution batch receives one decision: snapshot and continue; continue without a new snapshot,
optionally remembered for this session only; or cancel.

The decision is bound to the source digest and executable-file inventory. Without it the result is
`vua.vpm_spike.risk_decision_required`, and no Unity staging project is created. VUA does not claim that a
project snapshot can reverse effects outside the project.

## Process and recovery

Every external invocation has a positive timeout, distinct exit and cancellation state, and bounded output.
On Windows each invocation enters a dedicated Job Object; timeout, cancellation, and normal parent exit
converge the owned process tree and report `processTreeClean`.

Output stays under the run's `work` area until `vrc-get` installation and minimum Unity validation succeed,
then it is atomically published. A run without a terminal result can be moved to a sibling quarantine by the
recovery command, making the original run name safe to retry. Completed runs are not moved.

Machine results conform to `schemas/vpm-package-spike/v0.1/result.schema.json`; consumers branch on stable
result codes rather than log prose.

## Local evidence

- The same Unity-exported synthetic input completed conversion, `vrc-get` installation, and Unity validation
  in two fresh roots. Canonical manifest, package-tree, and deterministic archive digests matched; the source
  was unchanged before and after both runs.
- One lawfully obtained developer outfit repeated successfully in two fresh roots. Each validation project
  was a fresh copy of the read-only VRChat SDK, lilToon, and Modular Avatar baseline, and the generated package
  explicitly declared its lilToon dependency. Private assets, paths, projects, logs, and outputs remain outside Git.
- A Unity-exported synthetic input containing an Editor script was rejected before Unity without a decision;
  after choosing snapshot-and-continue it completed actual installation and minimum loading validation.
- A run with an unavailable declared dependency failed during `vrc-get` preview and published nothing. Its
  incomplete directory was quarantined successfully and the original run name became reusable.
- A manual screenshot confirmed that a fresh Unity `2022.3.22f1` validation project displayed the installed
  package, its `Runtime` hierarchy, and outfit prefab thumbnails. Because it contains private assets, the image
  remains in the local evidence directory. The observation still proves only `minimum_structure`, not semantics.

## Deferred to B3

B3 integrates this seam with formal Orchestrator tasks, confirmation, snapshots, Build Records, recovery state,
and new Bridge operations. Full Avatar/outfit semantic validation and dependency candidate/revision workflows
remain B3 work and are not claimed by this Spike.
