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
    let stdin = std::io::stdin();
    let stdout = std::io::stdout();
    vua_orchestrator::run_provider_host(
        BufReader::new(stdin.lock()),
        stdout.lock(),
        database_path,
    )?;
    Ok(())
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
