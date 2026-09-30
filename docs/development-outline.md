# VUA development sequence

> Document version: 3.4.0
> Status: Accepted
> Updated: 2026-09-30
> Authority: User rulings of 2026-09-28 and the 2026-09-30 account/external-tool scope and release-decoupling updates
> Scope: N1-N7, real-machine deployment and real-material workflows, continuing Beta
> Normative effect: Schedules accepted product work; product scope belongs to product-boundary.md

## Reading context

**For people:** the sequence and acceptance tables describe what each stage should let you do
and what evidence establishes success; detailed implementation choices belong elsewhere.

**If you are an Agent:** use the user's current task and its acceptance row to bound the slice.
Do not mark a gate complete from document edits, simulated results or code presence. Record the
actual environment, outputs, remaining blockers and whether UI human acceptance is still pending.
The role table assigns responsibility, not standing sessions or permission to dispatch agents.

## Direction and historical disposition

Build the shortest usable path, run it, fix its first blocker, then broaden coverage. Prefer
small working slices to complete module designs. Known non-blocking gaps and technical debt may
carry forward with their impact, workaround, and follow-up recorded. Do not require every agent
to clear every issue before another independent path proceeds. Keep necessary cross-module
inputs, outputs, errors, and format changes explicit, without speculative framework work.

The N sequence replaces the M/W development schedule. M0-M3 remain historical records. Old M4's
closure is withdrawn as proof of complete material management; its scope is reopened under N5.
The user's report that M4 only provided basic loading and SQLite creation is an audit trigger,
not an already verified technical finding. Audit existing capabilities before deciding what to
retain, complete, or rewrite. Do not discard working code by assumption. Old tags, artifacts,
and release notes remain immutable; Git history preserves the old M schedule. M5 and later
old schedules, indivisible W25 windows, and global waits for human operation are superseded.

VUA remains Beta until the author explicitly requests a different release stage. There is no
scheduled v1.0.0 or production-safety guarantee. Passing a gate proves its recorded scenarios,
not universal compatibility or defect-free operation. N stages define outcomes and acceptance;
product versions are selected independently from actual release changes. One stage can span
several releases, and a release can include slices from several stages. Publication does not
close a stage. Beta is lifecycle metadata; historical package versions and tags are unchanged.
See [versioning](release/versioning.md).

## New sequence

| Gate | User task | Initial status |
| --- | --- | --- |
| N1 | Deploy the software and settings needed to play or edit Avatars | Active priority; acceptance pending |
| N2 | Connect to upstream VRCFaceTracking and hyblocker Space Calibrator | Planned; exactly these two acceptance targets |
| N3 | Produce a complex real-material Avatar and hand it to VRC SDK | Planned |
| N4 | Save, share, and reproduce Recipes across real workflows | Planned |
| N5 | Audit and redo old M4 material management, including BOOTH acquisition | Planned; capability audit required before rework |
| N6 | Recover interrupted work and maintain installed environments | Planned |
| N7 | Distribute and regress a Beta installer with illustrated user instructions | Planned |

Gate order is delivery order, not a prohibition on useful independent work. Minimum material
handling needed by N3 lands there; full material-management rework follows the N5 audit. No gate
below is declared passed by this document. Every mandatory acceptance row must be exercised;
non-blocking defects may remain documented, but an untested required outcome is not a pass.

## Test environments and evidence

| Environment | Source and use | Evidence limit |
| --- | --- | --- |
| Current workstation | User reports SteamVR, PICO Runtime, and VRChat installed, no Unity; first incremental-deployment target | This is a different machine from the earlier development host, not a blank system |
| Local uninstall/reinstall | Explicitly authorized by the user for deployment development and testing on this machine | Registry, environment variables, caches, and drivers may remain; never call this a completely clean Windows install |
| Local Windows VM | Create a fresh Windows VM and retain a pre-install snapshot if available; use for repeatable install/configuration tests | Does not replace physical headset, GPU, runtime, or driver validation; VM availability is not assumed |
| Separate local project/root | New Unity projects and isolated data/output roots for production and reproduction | Clean project does not mean clean OS |
| Remote CI | Build, synthetic-data tests, and an explicitly recorded Windows image/version matrix | No paid assets, account sessions, personal orders, or user projects; a build badge is not cross-version runtime acceptance |

Local uninstall/reinstall is permitted; no additional blanket prohibition or reauthorization is
introduced here. Select the software involved in the test, record before/after state, preserve
user data and unrelated projects, and use its supported uninstall/install mechanism. Permission
to reinstall software does not authorize wiping the OS or deleting unrelated data. This policy
change does not itself execute any uninstallation.

Before remote CI coverage, do not claim guaranteed operation on other Windows versions. After
CI exists, report only the exact image/version and operations actually tested; CI alone does not
prove headset behavior, account workflows, or all Windows versions. If a VM is unavailable,
continue on the current workstation and label the baseline accurately.

UI requires human usability acceptance: understandable labels, discoverable actions, and the
ability to complete the task without misleading or stuck screens. Non-UI acceptance may be
performed by agents/scripts against real software, devices, files, and outputs; a human is not
required to click through every operation. Account login, license acceptance, final upload, and
other platform-required user actions remain explicit handoffs. A device prerequisite blocks only
the dependent case, not unrelated development. Synthetic input is valid component evidence but
must not be relabeled as a real-device or real-material success.

Each run records date, source revision/dirty state, actual OS baseline, software versions, input
identities, operation, passed/failed/blocked/not_run outcome, evidence location, and omitted steps.
Raw material, account data, logs, and projects remain local under ignored output roots. An agent
run is acceptable evidence; simulated success or a result inferred solely from source is not.

A read-only starting inventory is available as:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/real-machine-baseline.ps1
```

The policy option affects only that process. Output is local under `_local_real_machine/`.
This inventory does not install, launch, or approve any workflow. The existing material_exec_real
harness is in vua-unity-bridge and can use synthetic inputs or an MA stub; inspect each case's
actual provenance before using it for N3 acceptance.

## N1: purpose-driven deployment

User task: choose what to do; VUA identifies missing prerequisites and helps install them.
Deliver purpose-driven install/update/uninstall plus validation, repair/retry, component additions,
version records, and limited configuration backup. Full-machine images, universal downgrade, and
a general environment version manager are not prerequisites.

| Function | Required behavior and observable acceptance |
| --- | --- |
| Choose purpose | Distinguish desktop play, PICO PCVR, PC Avatar editing, and Quest Avatar editing; multiple choices are possible. Desktop play alone does not require Unity or SteamVR |
| Inspect | Report installed, missing, unsuitable-version, and detection-failed separately; correctly identify this machine's existing play stack and absent Unity |
| Plan | Explain each retain/install/update/component/configuration action, location, reason, optional items, and user handoff before execution; do not silently choose latest incompatible versions |
| Execute | Show real download/installation/configuration state and the failed step; starting an installer is not installation success |
| Configure | Record old/new values and scope for necessary changes; installing Unity does not silently change the existing VR runtime |
| Validate | Reinspect after install; actually launch Unity and open a disposable project with real SDK/MA dependencies; test play launch separately from device behavior |
| Repeat | A second run reuses satisfied prerequisites and installs only missing components; failed operations have a usable retry or manual path |

First local path: keep existing SteamVR/PICO/VRChat, choose PC Avatar editing, install global
Unity 2022.3.22f1 and necessary components, resolve actual SDK/MA dependencies, and open the test
project. Exercise each declared purpose on an applicable environment; record missing equipment
as blocked rather than inventing results. UI gets human review; backend operations may be automated.

### Initial account guidance acceptance

This is part of N1's first usable path; [product scope](product-boundary.md#account-onboarding-user-ruling-2026-09-30)
owns the account and later-experiment boundaries. Use official pages in the isolated built-in
browser, with explicit client/system-browser handoff when needed. Do not add an Auth Broker or
a generic account/token manager before this path works.

| Case | Required behavior and observable acceptance |
| --- | --- |
| New player | Offer Steam and VRChat registration guidance; users submit official forms themselves. Guide adding VRChat to the Steam library and installing/launching through Steam. An opened page is recorded as opened, not as an account or successful installation |
| Existing player | Allow skipping existing accounts; guide the official Steam-platform-account upgrade/link path when needed, without storing credentials or inventing a VUA binding |
| Optional creator | Offer Unity and BOOTH/pixiv registration only for the creator route. Explain purchase and Hub/SDK handoffs. Skipping them leaves the play route usable |
| Upload eligibility | Explain full VRChat account plus New User or higher; show user-reported or unknown eligibility honestly. Normal-play guidance promises no promotion date. A Visitor can continue local preparation/testing; only upload remains gated |
| Interrupt/decline | Closing a page, refusing consent, failed registration or blocked embedding leaves a resume/manual route. CAPTCHA, terms, account linking and payment stay with the user |
| Privacy | First-slice registration sessions are nonpersistent and isolated; no cookie/password/token values in app state, IPC, Agent context or logs. Ending the guide session clears its temporary state. Saved progress does not imply authenticated verification |

Use synthetic data for automated guide-state tests and real official pages for local flow checks;
account submissions require the user's actions. Record those steps as blocked/not_run until performed.
VRChat web-information reading and experimental persistence follow the first usable delivery;
they are not first-round blockers. N5 BOOTH account-library acceptance remains unchanged.

## N2: exactly two gameplay tools

The acceptance set contains **both and only** these independently distributed tools:

1. [VRCFaceTracking](https://github.com/benaclejames/VRCFaceTracking): guide installation from
   [Steam](https://store.steampowered.com/app/3329480/) and hardware-module/OSC setup in the upstream UI.
2. [hyblocker/OpenVR-SpaceCalibrator](https://github.com/hyblocker/OpenVR-SpaceCalibrator): guide
   [Steam installation](https://store.steampowered.com/app/3368750/), device selection and calibration
   in its own UI, retaining the official application's functionality.

Required hardware modules are not extra top-level tools. Other tools remain outside N2. Record
the actual upstream release, install source, modules and device versions used in each local run;
Steam's current release is not a fixed test version. The delivery path is guided Steam library
addition and installation, followed by supported external invocation and status observation.

| Function | Required behavior and observable acceptance for each tool |
| --- | --- |
| Applicability | Explain the purpose, test hardware and prerequisites; neither tool becomes compulsory for ordinary play |
| Discover/install | Detect a supported existing installation; otherwise open its official installation route. After the user installs through Steam/upstream, refresh detection. Opening the store is not installation success; unknown versions remain unknown |
| Launch/status | Launch on explicit request through a supported route; distinguish missing, installed, running, detection failure and functional verification. A process alone proves only running |
| Face setup | Guide the user to the required VRCFT hardware module, VRChat OSC setting and compatible Avatar; module installation remains in VRCFT. Verify real tracking/OSC output on the named device |
| Mixed-space setup | Guide SteamVR prerequisites, reference/target device selection, sampling and applying calibration in Space Calibrator. Record an actual measured calibration; do not implement its internal overlay-to-driver IPC |
| Missing capability | Missing hardware, unsupported versions, disconnects or unavailable status leave an explicit unknown/blocked result and manual route. Exercise reconnect without reporting fabricated tracking success |
| Stop/update/remove | Guide the owning application's or Steam's supported stop/update/removal route and reinspect afterward; preserve unrelated play functionality and user configuration. VUA does not own upstream processes or force-terminate them as task children |

Real functional evidence is still required for both targets. External connection reduces VUA's
implementation burden, not the N2 real-hardware acceptance standard. Agents/scripts can collect
non-UI evidence from permitted outputs; UI receives human review. Lack of hardware leaves the
relevant case pending. No requirement to automate every calibration mode or rebuild upstream UI.

Later diagnostics may examine documented logs/configuration through a separately scoped adapter;
automatic configuration edits, internal IPC and calibration control are not initial requirements.
Any future copied source or bundled binary needs a new scope and distribution review under
[third-party notices](../THIRD_PARTY_NOTICES.md).

## N3: complex real-material Avatar production

User task: combine owned materials in one project and hand the result to VRC SDK.
Minimum successful case: **one real Avatar + at least two actively used dependencies/plugins +
at least six other real materials, together in one project and one production run**. Do not count
individual files from one package as separate materials or install unused plugins to meet the count.

| Function | Required behavior and observable acceptance |
| --- | --- |
| Intake | Admit the actual materials as usable production inputs, not merely copied files; retain original sources |
| Relationships | Resolve or ask the user to confirm dependencies and targets; reuse shared dependencies; identify conflicting versions or relationships by material |
| Target selection | Clearly select which Avatar/object receives each outfit, accessory, or operation; ambiguity is resolved explicitly |
| Assembly | Execute imports, bindings, and supported settings through the Bridge; verify actual object relationships, not only a success receipt |
| Records | Record material/dependency inputs and each operation/result, with a locatable failed step |
| SDK handoff | The real SDK recognizes the resulting Avatar and reaches its build/upload-check flow; merely opening Unity does not pass |
| Existing projects | ALCOM/VCC originals stay read-only; create an independent VUA-managed copy and reinspect it before changes |

Run the full complex case, repeat it in a separate clean project, and exercise a missing-dependency
or relationship-conflict variant with a concrete resolution path. Agents may drive real Unity,
Bridge, and SDK and inspect bindings/build outputs/logs. Actual account upload is not mandatory
for this gate and remains a user action. N5's complete library work does not block minimum intake.

## N4: Recipe and multi-flow reproduction

| User task | Required behavior and observable acceptance |
| --- | --- |
| Save/reopen | Preserve material references, dependencies, and supported modifications across restart |
| Reproduce | Build the declared relationships/settings in a second project using actual owned inputs |
| Reapply | Avoid unintended duplicate objects, menus, parameters, and bindings |
| Resolve conflicts | Explain conflicting inputs and the effect of the four choices in the product boundary; apply the chosen behavior |
| Share | Export declarations without paid material bodies; supplement missing sources only for referenced materials and remember confirmed correlations |
| Retry after completion | Identify missing material/dependencies and execute after they are supplied |

Use N3's complex case for new-project reproduction, repeated application, changed Recipe
application, missing-then-supplied inputs, and conflict cases. Validate relationships/settings,
not byte equality of all Unity-generated metadata. Exercise original-package intake and the
experimental local-VPM route separately; neither proves the other.

## N5: audit and redo material management

### Mandatory first step: capability audit

Before rework, inspect existing implementation, reachable UI/Gateway paths, tests, and local run
evidence. Produce a capability table with: user action, code entry, reachable/not reachable,
verified behavior, evidence, missing behavior, and retain/complete/replace decision. Unknown
means unverified, not absent. Audit local intake, warehouse queries/maintenance, BDL persistence,
BOOTH account/library enumeration, downloads, and cloud-to-local import end to end where possible.

The prior M4 closure no longer establishes completion, but the user's initial assessment is not
proof that all code is missing. Basic loading and SQLite creation alone do not close N5. Preserve
working capabilities and fix measured gaps rather than automatically rewriting the subsystem.

### Required acquisition acceptance: two distinct BOOTH workflows

1. **Account library to local catalog, then selective download.** The user signs into their own
   BOOTH account through the local session. VUA automatically retrieves the account's available
   material list and builds/refreshes its local catalog without downloading every file. It handles
   multiple pages and repeated refresh without duplicate records, reports partial retrieval and
   expired sessions, and distinguishes cloud-listed from locally downloaded material. The user
   chooses materials/files to download; only that selection is downloaded, inspected, and linked
   to local records. Restart and refresh preserve the catalog and downloaded-file associations.
2. **Import material already available in the cloud account.** From the signed-in BOOTH cloud
   material/page entry, the user chooses an already accessible item and imports it into the local
   Warehouse and material-selection flow. Missing local content is acquired through the authorized
   download path; an existing local copy is recognized or a duplicate decision is shown. Verify
   source/file association and that the imported item can be selected for production. Browsing a
   page or finishing a download alone is not successful import.

Here cloud means BOOTH content available to that account, not a VUA-operated asset server. These
are separate acceptance rows, not a purchase flow. Respect entitlement, authentication, age and
access controls; no whole-site crawl or purchase bypass. Account/session/order data, catalog and
paid files stay local. Unit/CI tests use representative synthetic data; account runs remain local.
Do not assume an upstream API or scraping approach before capability investigation.

### Required library behavior

| User task | Required behavior and observable acceptance |
| --- | --- |
| Understand intake | Distinguish successful, duplicate, unsupported, and failed items; partial success is visible |
| Find material | Search by name and supported filters; distinguish similarly named entries |
| Maintain files | Show associated local files and missing status; permit relinking missing files |
| Maintain provenance | Local use need not start with a BOOTH ID; allow correcting and retaining source associations |
| Manage versions | Same-name different-content material is distinguishable and never silently overwritten; the production input version is explicit |
| Manage relationships | Show known dependencies, distinguish suggestions from confirmations, and correct mistaken associations |
| Remove/clean | Distinguish removing a catalog record from deleting files; explain effects on Recipe references |
| Produce | Library selection reaches actual production and records can identify their source inputs |

Use a real local collection containing duplicates, same-name versions, missing files, multi-file
packages, and dependencies. Define supported directory/archive behavior during the audit; an old
issue merely being registered is not acceptance. Close the gate only with both acquisition paths
and library outcomes exercised; remaining non-blocking limitations are named.

## N6: recovery and environment maintenance

| User task | Required behavior and observable acceptance |
| --- | --- |
| Cancel | Explain whether cancellation took effect or is waiting on a non-interruptible operation |
| Restart | Surface unfinished tasks for inspection and explicit choice, never silent continuation |
| Retry | Use actual completed state rather than blindly repeat everything or reuse stale approval |
| Handle drift | Reinspect relevant externally changed software, configuration, or projects before executing |
| Restore settings | Restore supported VUA-owned changes; show conflicts with subsequent external edits |
| Update/remove | Support each adapter's actual update, component-addition, and uninstall abilities, not universal downgrades |
| Export inventory | Record versions/components/configuration for redeployment; do not describe it as a machine image |

Inject interruption, cancellation, missing inputs, and external changes into both deployment and
complex production. Show a workable next action even if it requires reinstall or manual repair.
N6 consolidates recovery; basic failures/retry cannot all be deferred from earlier gates.

## N7: Beta installer, regression, and illustrated user guide

| Deliverable | Required behavior and observable acceptance |
| --- | --- |
| Installer | Launch without a development checkout, developer commands, or hidden development-machine files |
| Regression | Exercise supported deployment, both N2 tools, complex production, Recipe reproduction, and audited material workflows through the packaged build |
| Upgrade | Preserve or explicitly migrate material records, Recipes, settings and run history from a named earlier Beta |
| UI review | A human can find the main entry points, understand states and complete tasks; fix misleading or stuck screens |
| Known issues | List tested scope, remaining problems, workarounds, and next work; remain Beta with no production-safety promise |
| Illustrated user guide | Deliver an end-user guide with screenshots of the actual tested release, using references the user will supply at N7 |

The guide covers install/first launch, purpose-based deployment, both tools, BOOTH login/catalog/
selective download/cloud import, local material management, complex Avatar production, Recipe
reproduction, SDK handoff, and common failure/retry paths. Each procedure gives its starting state,
numbered actions with readable screenshots, expected result, and what to do when it differs.
Screenshots match the named build and actual labels, with credentials, account/order information,
and private material removed or safely substituted. Do not use invented UI as acceptance evidence.
Observe repository asset/privacy rules for published illustrations. Human UI/guide review confirms
the instructions can be followed. Missing user references block only final reference-dependent
presentation, not other N7 work; do not invent what the references contain.

## Execution roles (six roles)

Roles express ownership, not mandatory standing sessions or separate branches. An ordinary session
may wear several hats. Collab is retired and preserved under docs/archive/2026-09-29/. A future
collaboration mechanism needs a new design and acceptance; these hats do not dispatch agents.

| Role | Ownership |
| --- | --- |
| Integration | N-gate evidence, versions, docs/registry, integration, CI, plan review |
| Desktop | Electron/Main/preload, React UI, typed TS Gateway, actual UI acceptance and guide capture |
| Core | Application use cases, durable tasks/recovery, domain ports, Provider, application contracts |
| Production | Unity Bridge, production execution, Unity packages, SDK handoff and real production evidence |
| Data | BDL, acquisition, Warehouse/material inspection, catalog and download contracts |
| Environment | Project/package managers, environment/install adapters, external-tool deployment |

Domain owners own schema changes; Desktop registers the TS/Gateway face. Keep input/output/error
contracts sufficient for cross-module work. Use existing core-owned ports for adapter placement;
do not move vendor behavior into views or the application core merely to deliver faster.

## Agent-plan handoff and subsequent review

The user will notify agents to revise their own plans. This document does not dispatch messages,
create roles, or replace their plans on their behalf. Once revised plans are available, review:

- Every task maps to an N gate/version and a concrete user action/result, with prerequisites,
  evidence method, current code to reuse, and deferred gaps.
- Neither old M closure nor old post-v1 scheduling overrides the new sequence. N5 starts with audit.
- N1 accounts are guided registration/library/linking only; N2 connects to exactly the two named upstream tools through Steam installation guidance and supported external invocation.
- N3 has the full 1 + 2 + 6 simultaneous case, not a single outfit or simulated substitute.
- N5 includes both BOOTH acquisition workflows; N7 includes the actual screenshot guide.
- Local reinstall permission, OS claim limits, human UI review and automated non-UI acceptance
  are preserved. Partial work is not presented as completed acceptance.

Prioritize the first real blocker, repair and rerun it, then expand. Record bounded compromises;
do not turn documentation completeness, speculative coverage, or idle agent activity into goals.

## Document changelog

- 3.4.0 (2026-09-30): decouple N stages from product versions while retaining every delivery outcome and acceptance requirement.

- 3.3.1 (2026-09-30): state the selected external-tool delivery path directly.

- 3.3.0 (2026-09-30): add four-platform guided account acceptance and define Steam installation guidance and upstream external-connection acceptance for N2.

- 3.2.0 (2026-09-29): add human/Agent reading contexts without changing N acceptance or version mapping.


- 3.1.0 (2026-09-28): user ruling — the collab mechanism is frozen and unmaintained from the
  N-sequence adoption; ordinary development is the only active entry; roles remain ownership hats.
- 3.0.0 (2026-09-28): replace M/W scheduling with the user-approved N1-N7 Beta sequence, capability-first N5 rework, exact N2 tools, local reinstall tests, automated non-UI acceptance, and N7 illustrated guide.
- 2.1.0 (2026-09-23): historical M release-gate/version-map definition; superseded for active scheduling by 3.0.0.
