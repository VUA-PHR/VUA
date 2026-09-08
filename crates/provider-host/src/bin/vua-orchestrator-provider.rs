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
        })
    });
    // W20 production-use-case command face: the recipe document store lives
    // under the provider data root (AMF production-domain document store).
    let use_cases = std::env::var("VUA_PROVIDER_DATA").ok().map(|data| {
        vua_provider_host::ProductionUseCaseConfig {
            recipes: std::sync::Arc::new(vua_orchestrator::RecipeDocumentStore
                ::new_with_system_clock(
                    std::path::Path::new(&data).join("production").join("recipes"),
                )),
        }
    });
    let input = stdin_reader();
    let output = std::io::stdout().lock();
    vua_provider_host::run_provider_host_with_services(
        input, output, database_path, production, downloads, warehouse, use_cases,
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
