# Warehouse Layout and Material Import Ruling


> Document version: ADR
> Status: Accepted — product-owner ruling (2026-09-06)
> Scope: B4 Warehouse physical layout, import semantics and artifact-mode setting
> Normative effect: constrains the physical semantics of the BDL warehouse tables, the
> material-import feature surface and the settings item; the mapping layer is defined in
> `schemas/bdl/v0.1/schema.sql`
> Ruling background: the open items of the download-events protocol v0.1 draft
> (`docs/protocols/download-events-v0.1.md`)

## Rulings

1. **Root location: default follows the data directory, user-changeable.** The
   warehouse root defaults to what the unified path resolver provides (following the
   Data Profile: installed → `%LOCALAPPDATA%\VUA\<channel>\<profile>\warehouse`,
   portable → `<portable-root>\Data\warehouse`) and is exposed as a **user-changeable
   setting**. Relocation/rescan behavior for existing entries after a settings change
   is an implementation detail (see open notes) and does not block B4.

2. **Semantic directory tree, no artifact deduplication.** The warehouse is organized
   by material package: one folder per package. Multiple copies of the same content are
   a legitimate state — if a user wants two, or a hundred, copies of the same asset,
   they have their reasons; VUA neither deduplicates nor merges. Correspondingly the
   BDL schema splits into two layers: **inspection facts by content** (`local_artifacts`
   keyed on sha256 — inspection state/size are idempotent per content) and **physical
   copies by entry** (`artifact_copies`: copy id, owning package, in-package relative
   path, absolute path). The content-to-product correlation facts
   (`artifact_mappings`) stay idempotent per content regardless of copy count.

3. **Browsability: users do not browse the disk.** The warehouse is presented by VUA's
   own content manager (a restatement of a standing ruling). Old BDB had no real users
   and carries no compatibility burden — no directory conventions need to be preserved
   for Explorer browsing.

4. **Import = copy-in, with batch support.** Import copies materials from their
   original location **into** the warehouse (originals untouched). Batch import is
   mandatory: multi-select folders, each folder becomes one material-package entry.

5. **Artifact-mode setting (generated VPM vs original package).** The generated VPM
   package and the material folder are siblings within an entry. The material
   import/download settings expose the choice:
   - **Use VPM package** (optional: delete the original files after generation) — maps
     to the `local_reusable_vpm` channel of material-intake v0.1;
   - **Use the original .unitypackage** (**default**) — maps to `direct_unity_package`.

   "Delete originals after generation" is a destructive option: it executes only after
   the VPM is generated AND verified, and the deletion must appear in the task result
   and receipt audit — never silently.

## Consequences

- `schemas/bdl/v0.1/schema.sql` revision (committed in the same batch): the
  `artifact_copies` table is introduced; `local_artifacts` loses its single
  `stored_path`; `warehouse_items` gains a unique in-warehouse `folder_name`; the former
  `warehouse_artifacts` table is dropped (copy rows carry their owning entry).
- The content hash (`sha256`) remains the idempotency key for inspection and source
  correlation; copy count never affects correlation facts.
- The download **staging** directory (the download-events protocol's `storedPath`) and
  the warehouse root are two different directories: the former defaults to the data
  directory and is not a user setting; the latter is a user setting.

## Open notes

- Relocation/rescan of existing entries after a root-settings change (decided during
  implementation; does not block the B4 main line);
- The folder→package recognition rule for batch import (page-observation-driven vs
  pure filesystem judgment, to be aligned with the extraction spec).
