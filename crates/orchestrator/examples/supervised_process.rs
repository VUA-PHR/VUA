//! B3 pre-spike harness over VUA's process boundary. It gives local Unity
//! smoke runs the same bounded output, timeout, cancellation and Windows
//! process-tree containment that production adapters consume.

use std::path::PathBuf;
use std::time::Duration;

use serde_json::json;
use vua_orchestrator::{ProcessRunner, ProcessSpec, StdProcessRunner};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args_os().skip(1);
    let result_path = PathBuf::from(args.next().ok_or(
        "usage: supervised_process <result.json> <cancel-file> <timeout-ms> -- <exe> [args...]",
    )?);
    let cancel_path = PathBuf::from(args.next().ok_or("missing cancellation path")?);
    let timeout_ms: u64 = args
        .next()
        .ok_or("missing timeout")?
        .to_string_lossy()
        .parse()?;
    if timeout_ms == 0 {
        return Err("timeout must be positive".into());
    }
    if args.next().as_deref() != Some(std::ffi::OsStr::new("--")) {
        return Err("missing -- before executable".into());
    }
    let executable = PathBuf::from(args.next().ok_or("missing executable")?);
    let process_args = args
        .map(|value| value.to_string_lossy().into_owned())
        .collect();
    let spec = ProcessSpec {
        executable,
        args: process_args,
        working_dir: None,
        timeout: Duration::from_millis(timeout_ms),
        output_limit: 256 * 1024,
        ..Default::default()
    };
    let outcome = StdProcessRunner.run_cancellable(&spec, &|| cancel_path.is_file())?;
    let result_code = if outcome.timed_out {
        "vua.vpm_spike.process_timeout"
    } else if outcome.cancelled {
        "vua.vpm_spike.process_cancelled"
    } else if outcome.exit_code != Some(0) {
        "vua.vpm_spike.process_exit_nonzero"
    } else if !outcome.process_tree_clean {
        "vua.vpm_spike.residual_process"
    } else {
        "vua.vpm_spike.ok"
    };
    let value = json!({
        "schemaVersion": "vua.supervised-process-result/v0.1",
        "resultCode": result_code,
        "exitCode": outcome.exit_code,
        "timedOut": outcome.timed_out,
        "cancelled": outcome.cancelled,
        "processTreeClean": outcome.process_tree_clean,
        "stdout": outcome.stdout,
        "stderr": outcome.stderr,
        "outputTruncated": outcome.truncated,
    });
    let temporary = result_path.with_extension("json.tmp");
    if let Some(parent) = result_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&temporary, serde_json::to_vec_pretty(&value)?)?;
    std::fs::rename(temporary, result_path)?;
    Ok(())
}
