use std::io::BufReader;
use std::path::PathBuf;

fn main() {
    if let Err(error) = run() {
        eprintln!("VUA Orchestrator Provider failed: {error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let database_path = parse_database_path()?;
    #[cfg(windows)]
    let _job = vua_provider_host::ProviderJobGuard::contain_current_process_tree()?;
    // Production capability comes entirely from the environment: with
    // VUA_UNITY_EDITOR + VUA_PROVIDER_DATA set, the real material intake
    // executor serves production.*; without them every production method
    // answers a typed unavailable error.
    let production = vua_provider_host::production_config_from_env();
    // Download acquisition (B4/F4-4): when a data directory is configured,
    // the provider serves download.ingest / download.retry and folds port
    // events into the BDL database under <data>/bdl.
    let mut bdl = None;
    let downloads = std::env::var("VUA_PROVIDER_DATA").ok().map(|data| {
        let store = vua_bdl_store::BdlStore::open(
            std::path::Path::new(&data).join("bdl").join("bdl.db"),
        )
        .map(std::sync::Arc::new)
        .expect("BDL store must open");
        bdl = Some(store.clone());
        vua_provider_host::DownloadConfig { bdl: store }
    });
    // Warehouse maintenance (B4/proposal 005): with VUA_WAREHOUSE_ROOT set,
    // the provider serves the artifact-mode trio over the same BDL database.
    // Generation reuses the production executor when the Unity environment is
    // configured; without it the generate command answers a typed unavailable
    // error while the mode and deletion commands keep working.
    let warehouse = std::env::var("VUA_WAREHOUSE_ROOT").ok().and_then(|root| {
        let warehouse_root = PathBuf::from(&root);
        if !warehouse_root.is_absolute() {
            eprintln!(
                "VUA provider: VUA_WAREHOUSE_ROOT must be an absolute path; warehouse stays unavailable"
            );
            return None;
        }
        let global_default = match std::env::var("VUA_WAREHOUSE_DEFAULT_MODE").ok().as_deref() {
            None | Some("") => vua_bdl_store::ArtifactMode::UseOriginalUnitypackage,
            Some(mode) => match vua_bdl_store::ArtifactMode::parse(mode) {
                Ok(mode) => mode,
                Err(_) => {
                    eprintln!(
                        "VUA provider: VUA_WAREHOUSE_DEFAULT_MODE={mode} is not a frozen mode; \
                         warehouse stays unavailable"
                    );
                    return None;
                }
            },
        };
        let store = match bdl.clone() {
            Some(store) => store,
            None => {
                let data = std::env::var("VUA_PROVIDER_DATA").ok()?;
                vua_bdl_store::BdlStore::open(
                    std::path::Path::new(&data).join("bdl").join("bdl.db"),
                )
                .map(std::sync::Arc::new)
                .expect("BDL store must open")
            }
        };
        Some(vua_provider_host::WarehouseConfig {
            bdl: store,
            warehouse_root,
            global_default,
            executor: production.as_ref().map(|config| config.executor.clone()),
            // The bdl-queries v0.5 dependencies read face: the REAL query
            // executor (reading the BDL library) is a later
            // data/production-domain implementation ring — the slot stays
            // None (the honest absence) until that batch lands and flips
            // the defaulted `dependencies_capabilities` accessor (the
            // recipe-export loop-3 flip precedent).
            dependencies_queries: None,
        })
    });
    // The Hub editors root the selection enumerates when no explicit
    // injection is set; overridable for tests and non-Hub installs,
    // defaulting to the standard Hub location. The editor selection, the
    // project-domain editor snapshot, and the environment detection all
    // observe the same root.
    let editors_root_override =
        std::env::var_os("VUA_UNITY_EDITORS_ROOT").map(std::path::PathBuf::from);
    let unity_editors_root = editors_root_override
        .clone()
        .unwrap_or_else(|| {
            std::path::PathBuf::from("C:/Program Files/Unity/Hub/Editor")
        });
    // W20 production-use-case command face: the recipe document store lives
    // under the provider data root (AMF production-domain document store).
    // W20 production-use-case command face (recipe/plan/job/record). The
    // Bridge the orchestrated jobs execute through reuses the editor the
    // assembly face selects (U10 slice); the target project root has its
    // own variable.
    let use_cases = std::env::var("VUA_PROVIDER_DATA").ok().map(|data| {
        // U10 editor selection (proposal 021 stance 2 + integration ruling):
        // explicit injection > production-target auto-selection > none. The
        // explicit injection (the shell-injected, verified manual pick)
        // releases execution; an auto-selected candidate is resolved for
        // presentation and the job precheck only — the gate-3 first-use
        // confirmation lives on the desktop settings face, so the
        // transition period keeps job execution honestly unavailable.
        let explicit_editor = std::env::var_os("VUA_UNITY_EDITOR")
            .map(std::path::PathBuf::from);
        let editor_selection = vua_orchestrator::select_editor(
            explicit_editor,
            &vua_orchestrator::installed_unity_editors(&unity_editors_root),
        );
        let bridge: std::sync::Arc<dyn vua_orchestrator::UnityBridge> =
            if editor_selection.releases_execution() {
                std::sync::Arc::new(vua_unity_bridge::UnityBatchBridge::new(
                    editor_selection
                        .path()
                        .expect("a released selection carries its editor path")
                        .to_path_buf(),
                )) as std::sync::Arc<dyn vua_orchestrator::UnityBridge>
            } else {
                match &editor_selection {
                    vua_orchestrator::EditorSelection::AutoSelected { editor } => eprintln!(
                        "VUA provider: production-target editor detected at {} ({}); \
                         job execution waits for the first-use confirmation in setup \
                         and stays unavailable",
                        editor.path.display(),
                        editor.parsed.display,
                    ),
                    vua_orchestrator::EditorSelection::Unavailable { reason } => eprintln!(
                        "VUA provider: no usable editor selection ({reason:?}); \
                         job execution stays unavailable"
                    ),
                    vua_orchestrator::EditorSelection::Explicit { .. } => unreachable!(
                        "a released selection takes the executing bridge branch"
                    ),
                }
                std::sync::Arc::new(vua_unity_bridge::UnityBatchBridge::new(
                    std::path::PathBuf::new(),
                ))
            };
        let project_root = std::env::var_os("VUA_PROJECT_ROOT")
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|| {
                eprintln!("VUA provider: VUA_PROJECT_ROOT unset; job execution stays unavailable");
                std::path::PathBuf::new()
            });
        let production_root = std::path::Path::new(&data).join("production");
        vua_provider_host::ProductionUseCaseConfig {
            recipes: std::sync::Arc::new(vua_orchestrator::RecipeDocumentStore
                ::new_with_system_clock(production_root.join("recipes"))),
            plans: std::sync::Arc::new(vua_orchestrator::PlanDocumentStore
                ::new(production_root.join("plans"))),
            evidence: std::sync::Arc::new(vua_orchestrator::EvidenceStore
                ::new(production_root.join("evidence"))),
        // M7 inspection slice: the evidence store lives beside the other AMF
        // production-domain document stores; the editor version is observed
        // from the selected editor path ("unknown" when the path states
        // none — the evidence never invents one).
        inspections: std::sync::Arc::new(vua_orchestrator::InspectionEvidenceStore
            ::new(production_root.join("inspections"))),
        editor_version: editor_selection
            .path()
            .and_then(|path| {
                vua_orchestrator::editor_version_from_path(path)
            })
            .unwrap_or_else(|| "unknown".to_owned()),
        records: std::sync::Arc::new(vua_orchestrator::RecipeRecordStore
            ::new(production_root.join("records"))),
        bridge,
        project_root,
        editor_selection,
        // Proposal 023 assembly slice (BOARD #30): the default assembly
        // wires the REAL process/window adapter (EditorHandoffPort ->
        // ReleaseHandoffPort). The frozen honest-absence answer
        // `vua.release_handoff.unavailable` stops being the default face of
        // an unwired port and converges to the explicitly port-less
        // assembly's exception path; the route now runs the full admission
        // flow (build_unknown / editor_unresolved / task acceptance).
        // Real-machine end-to-end evidence belongs to the W25 window — no
        // end-to-end claim is made here.
        handoff: Some(std::sync::Arc::new(
            vua_provider_host::EditorHandoffAdapter::new(),
        )),
        // Proposal 029 B-face loop 3: the REAL on-disk export executor is
        // wired and its capability override flips the served row — the read
        // face derives drafts from the 013 inspection facts (declared VPM
        // dependencies + locked pins, the observed editor version, the VUA
        // identity tri-state). Real-machine export evidence stays W25 (O-2).
        draft_exporter: Some(std::sync::Arc::new(
            vua_orchestrator::OnDiskProjectDraftExporter::new(),
        )),
    }
    });
    // Project-domain command face (proposals 013/014) + environment
    // detection (BG-16): both ride the same desktop-injected runtime
    // composition the download and use-case faces ride — VUA_PROVIDER_DATA
    // marks the shell-injected runtime root. Without the injection they
    // keep their typed unavailable answers (`vua.project.unavailable` /
    // the honest empty snapshot) — honest absence, never a fabricated
    // wiring.
    let runtime_face_wired = std::env::var("VUA_PROVIDER_DATA").is_ok();
    // Proposal 004: the VCC settings resolution order is single-sourced in
    // the core `EnvironmentRoots::default()` (LOCALAPPDATA first, legacy
    // Roaming fallback); the registered-project guard and the environment
    // detection consume the same candidates. The default is the documented
    // production shape; the one intentional deviation is the editors-root
    // override (tests / non-Hub installs), kept consistent with the
    // selection face above.
    let environment_roots = {
        let mut roots = vua_orchestrator::EnvironmentRoots::default();
        if let Some(root) = editors_root_override {
            roots.unity_editors_root = root;
        }
        roots
    };
    let vcc_settings_candidates = environment_roots.vcc_settings_candidates.clone();
    let project_ops = if runtime_face_wired {
        Some(vua_provider_host::ProjectOpsConfig {
            vcc_settings_candidates: vcc_settings_candidates.clone(),
            manager_roots: vua_project_manager::ManagerRoots::default(),
            editor_roots: vec![unity_editors_root],
        })
    } else {
        eprintln!(
            "VUA provider: VUA_PROVIDER_DATA unset; project command face stays unavailable"
        );
        None
    };
    // Proposal 024 P1 (packages-query v0.1): the packages read face rides a
    // real VrcGetLibBackend injected at assembly, sharing the SAME
    // environment-root fact source the project_ops / 013 aggregate reads
    // (the core `EnvironmentRoots::default()` candidates[0] directory — the
    // core self-audit convergence in proposal 024's inline thread). Without
    // the injection the face keeps its typed honest absence; the engine's
    // own default root stays reserved for tests / standalone environments.
    let vpm = if runtime_face_wired {
        let environment_root = vcc_settings_candidates
            .first()
            .and_then(|candidate| candidate.parent())
            .map(|directory| directory.to_path_buf());
        match environment_root {
            Some(directory) => match vua_project_manager::VrcGetLibBackend::with_environment_root(
                directory, false,
            ) {
                Ok(backend) => Some(
                    std::sync::Arc::new(backend)
                        as std::sync::Arc<dyn vua_orchestrator::VpmBackend>,
                ),
                Err(error) => {
                    eprintln!(
                        "VUA provider: vrc-get backend failed to initialize ({}); packages face stays unavailable",
                        error.code,
                    );
                    None
                }
            },
            None => {
                eprintln!(
                    "VUA provider: no VCC settings candidate resolved; packages face stays unavailable"
                );
                None
            }
        }
    } else {
        eprintln!(
            "VUA provider: VUA_PROVIDER_DATA unset; packages face stays unavailable"
        );
        None
    };
    let environment = if runtime_face_wired {
        Some(vua_provider_host::EnvironmentConfig {
            roots: environment_roots,
            vcc_settings_candidates,
        })
    } else {
        eprintln!(
            "VUA provider: VUA_PROVIDER_DATA unset; environment detection stays unavailable"
        );
        None
    };
    let input = stdin_reader();
    let output = std::io::stdout().lock();
    vua_provider_host::run_provider_host_full(
        input, output, database_path, production, downloads, warehouse, use_cases,
        project_ops, environment,
        // Proposal 021 routing: no injected verifier — the route falls
        // back to the primitive's system wiring, the full entry's
        // documented default (`verify_editor_path_system`).
        None,
        // Proposal 024 P1: the real vrc-get-lib engine, sharing the 013
        // aggregate's environment-root fact source.
        vpm,
    )?;
    Ok(())
}

/// The host's reader thread needs a `Send` reader; std's `StdinLock` is not
/// `Send` on this toolchain. The provider process is the single consumer of
/// stdin, so we open an independent handle to it as an owned `File` — the
/// handle closes only when the reader (and the process) ends.
#[cfg(windows)]
fn stdin_reader() -> BufReader<std::fs::File> {
    use std::os::windows::io::FromRawHandle;
    use windows_sys::Win32::System::Console::{GetStdHandle, STD_INPUT_HANDLE};

    let handle = unsafe { GetStdHandle(STD_INPUT_HANDLE) };
    if handle.is_null() {
        eprintln!("VUA provider: no stdin handle available");
        std::process::exit(1);
    }
    unsafe { BufReader::new(std::fs::File::from_raw_handle(handle)) }
}

fn parse_database_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let mut arguments = std::env::args_os().skip(1);
    match (arguments.next(), arguments.next(), arguments.next()) {
        (Some(flag), Some(path), None) if flag == "--database" => {
            let path = PathBuf::from(path);
            if !path.is_absolute() {
                return Err("Provider database path must be absolute".into());
            }
            Ok(path)
        }
        _ => Err("usage: vua-orchestrator-provider --database <absolute-path>".into()),
    }
}
