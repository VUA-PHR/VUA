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
    let _job = vua_orchestrator::ProviderJobGuard::contain_current_process_tree()?;
    // Production capability comes entirely from the environment: with
    // VUA_UNITY_EDITOR + VUA_PROVIDER_DATA set, the real material intake
    // executor serves production.*; without them every production method
    // answers a typed unavailable error.
    let production = vua_orchestrator::production_config_from_env();
    // Download acquisition (B4/F4-4): when a data directory is configured,
    // the provider serves download.ingest / download.retry and folds port
    // events into the BDL database under <data>/bdl.
    let downloads = std::env::var("VUA_PROVIDER_DATA").ok().map(|data| {
        let bdl = vua_bdl_store::BdlStore::open(
            std::path::Path::new(&data).join("bdl").join("bdl.db"),
        )
        .map(std::sync::Arc::new)
        .expect("BDL store must open");
        vua_orchestrator::DownloadConfig { bdl }
    });
    let input = stdin_reader();
    let output = std::io::stdout().lock();
    vua_orchestrator::run_provider_host_with_downloads(
        input, output, database_path, production, downloads,
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
