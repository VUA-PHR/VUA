//! B3 pre-spike harness: register one generated local package in an isolated
//! vrc-get environment, preview the exact change set, then apply it to a fresh
//! validation project. This is not a product CLI.

use std::path::PathBuf;

use serde_json::json;
use vua_orchestrator::{AppErrorV1, PackageRequestV1, ProjectRef, VpmBackend};
use vua_project_manager::VrcGetLibBackend;

fn app<T>(result: Result<T, AppErrorV1>) -> Result<T, Box<dyn std::error::Error>> {
    result.map_err(|error| {
        std::io::Error::other(
            serde_json::to_string(&error).unwrap_or_else(|_| error.code.to_owned()),
        )
        .into()
    })
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args_os().skip(1);
    let environment_root =
        PathBuf::from(args.next().ok_or(
            "usage: vpm_local_install <isolated-environment> <package-root> <project-root>",
        )?);
    let package_root = PathBuf::from(args.next().ok_or("missing package root")?);
    let project_root = PathBuf::from(args.next().ok_or("missing project root")?);
    if args.next().is_some() {
        return Err("unexpected extra argument".into());
    }
    if environment_root.exists() {
        return Err(format!(
            "isolated environment already exists: {}",
            environment_root.display()
        )
        .into());
    }

    let manifest: serde_json::Value =
        serde_json::from_slice(&std::fs::read(package_root.join("package.json"))?)?;
    let package_id = manifest["name"]
        .as_str()
        .ok_or("package manifest has no string name")?
        .to_owned();
    let version = manifest["version"]
        .as_str()
        .ok_or("package manifest has no string version")?
        .to_owned();
    let request = PackageRequestV1 {
        package_id: package_id.clone(),
        version: Some(version),
    };
    let project = ProjectRef {
        id: "vpm-spike-validation".to_owned(),
        root: project_root.clone(),
    };

    let backend = app(VrcGetLibBackend::with_environment_root(
        environment_root.clone(),
        true,
    ))?;
    app(backend.register_local_package(&package_root))?;
    let preview = app(backend.preview_install(&project, std::slice::from_ref(&request)))?;
    let applied = app(backend.apply_install(&project, &[request], &preview.digest))?;
    let installed_manifest = project_root
        .join("Packages")
        .join(&package_id)
        .join("package.json");
    if !installed_manifest.is_file() {
        return Err("vrc-get returned success but the installed package is absent".into());
    }

    println!(
        "{}",
        serde_json::to_string_pretty(&json!({
            "schemaVersion": "vua.vpm-local-install-result/v0.1",
            "backend": backend.name(),
            "packageId": package_id,
            "preview": preview,
            "applied": applied,
            "installedManifest": installed_manifest,
            "isolatedEnvironment": environment_root,
        }))?
    );
    Ok(())
}
