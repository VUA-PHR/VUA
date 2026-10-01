//! Acquire the reviewed official Unity CLI on this user's machine. No downloaded scripts,
//! PATH/registry writes, redistribution, automatic updates, account or license acceptance.
//! The pinned digest and signature are checked before the executable enters discovery.
use crate::unity_install::safe_install_root;
use sha2::{Digest, Sha256};
use std::{
    io::{Read, Write},
    path::{Path, PathBuf},
    time::Duration,
};
use vua_orchestrator::deployment::{DeploymentInstaller, DeploymentInstallerKind};

pub(super) const CLI_VERSION: &str = "1.0.0-beta.11";
pub(super) const CLI_SHA256: &str =
    "4cad9230dd98cc8d123d3ef9d18fef5e7ee65f353814c3cf9d94d9129293dda3";
const CLI_URL: &str =
    "https://public-cdn.cloud.unity3d.com/hub/prod/cli/1.0.0-beta.11/unity-windows-x64.exe";
const CLI_SIZE: u64 = 26_154_920;
const CLI_REGIONAL_URL: &str =
    "https://public-cdn.cloud.unitychina.cn/hub/prod/cli/1.0.0-beta.11/unity-windows-x64.exe";

pub(super) fn managed_cli_path(data_root: &Path) -> PathBuf {
    data_root
        .join("environment/unity-cli")
        .join(CLI_VERSION)
        .join("bin/unity.exe")
}

pub(super) fn planned_cli(data_root: &Path, editor_root: &str) -> Option<DeploymentInstaller> {
    let exe = managed_cli_path(data_root);
    // Only this audited x64 artifact is supported. Never overwrite another binary in the
    // owned slot: corruption or a foreign upgrade requires inspection instead of replacement.
    if !cfg!(all(windows, target_arch = "x86_64"))
        || !path_absent(&exe)
        || !path_absent(&exe.with_file_name("unity.exe.partial"))
        || !safe_install_root(exe.parent()?)
    {
        return None;
    }
    Some(DeploymentInstaller {
        kind: DeploymentInstallerKind::UnityCliBootstrap,
        location: exe.to_str()?.into(),
        version: CLI_VERSION.into(),
        file_sha256: CLI_SHA256.into(),
        editor_root: editor_root.into(),
    })
}

pub(super) fn acquire_cli(
    data_root: &Path,
    confirmed: &DeploymentInstaller,
) -> Result<(), &'static str> {
    if planned_cli(data_root, &confirmed.editor_root).as_ref() != Some(confirmed) {
        return Err("vua.deployment.plan_changed");
    }
    let target = managed_cli_path(data_root);
    let parent = target.parent().ok_or("vua.deployment.invalid_location")?;
    std::fs::create_dir_all(parent).map_err(|_| "vua.deployment.cli_acquisition_failed")?;
    if !safe_install_root(parent) {
        return Err("vua.deployment.invalid_location");
    }
    let runtime =
        tokio::runtime::Runtime::new().map_err(|_| "vua.deployment.cli_acquisition_failed")?;
    let stage = parent.join("unity.exe.partial");
    // A leftover partial download is inspect-required; never truncate an unknown file.
    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&stage)
        .map_err(|_| "vua.deployment.cli_acquisition_failed")?;
    let owned = OwnedStage(stage.clone());
    let download_result = runtime.block_on(async {
        let client = reqwest::Client::builder()
            .https_only(true)
            // Unity redirects this artifact to its regional CDN on this workstation.
            // Only fixed HTTPS destinations qualify; integrity remains pinned.
            .redirect(reqwest::redirect::Policy::custom(|attempt| {
                if attempt.previous().len() <= 2 && permitted_destination(attempt.url().as_str()) {
                    attempt.follow()
                } else {
                    attempt.error("unreviewed Unity CLI redirect")
                }
            }))
            .connect_timeout(Duration::from_secs(30))
            .timeout(Duration::from_secs(600))
            .build()
            .map_err(|_| "vua.deployment.cli_acquisition_failed")?;
        let mut response = client
            .get(CLI_URL)
            .send()
            .await
            .map_err(|_| "vua.deployment.cli_acquisition_failed")?;
        if response.status() != reqwest::StatusCode::OK
            || response.content_length().is_some_and(|n| n != CLI_SIZE)
        {
            return Err("vua.deployment.cli_acquisition_failed");
        }
        let mut size = 0;
        let mut digest = Sha256::new();
        while let Some(chunk) = response
            .chunk()
            .await
            .map_err(|_| "vua.deployment.cli_acquisition_failed")?
        {
            size += chunk.len() as u64;
            if size > CLI_SIZE {
                return Err("vua.deployment.cli_integrity_failed");
            }
            digest.update(&chunk);
            file.write_all(&chunk)
                .map_err(|_| "vua.deployment.cli_acquisition_failed")?;
        }
        if size != CLI_SIZE || hex_digest(digest) != CLI_SHA256 {
            return Err("vua.deployment.cli_integrity_failed");
        }
        file.sync_all()
            .map_err(|_| "vua.deployment.cli_acquisition_failed")?;
        Ok(())
    });
    drop(file); // Close the handle before deleting an owned partial on any download failure.
    download_result?;
    if !verified_artifact(&stage) {
        return Err("vua.deployment.cli_integrity_failed");
    }
    // A hard-link publication is create-only, even if another process creates target after
    // the check. Unlike rename-with-replacement, it cannot overwrite an unrelated file.
    std::fs::hard_link(&stage, &target).map_err(|_| "vua.deployment.cli_acquisition_failed")?;
    drop(owned);
    Ok(())
}

fn hex_digest(digest: Sha256) -> String {
    digest
        .finalize()
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}
fn permitted_destination(url: &str) -> bool {
    matches!(url, CLI_URL | CLI_REGIONAL_URL)
}
// symlink_metadata detects dangling links too. Unreadable slots are not absent and
// cannot authorize a new acquisition; an owned interrupted partial needs manual inspection.
fn path_absent(path: &Path) -> bool {
    std::fs::symlink_metadata(path).is_err_and(|e| e.kind() == std::io::ErrorKind::NotFound)
}
fn verified_artifact(path: &Path) -> bool {
    let Ok(mut file) = std::fs::File::open(path) else {
        return false;
    };
    if !file.metadata().is_ok_and(|m| m.len() == CLI_SIZE) {
        return false;
    }
    let mut digest = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];
    let mut total = 0;
    loop {
        let Ok(n) = file.read(&mut buffer) else {
            return false;
        };
        if n == 0 {
            break;
        }
        total += n as u64;
        if total > CLI_SIZE {
            return false;
        }
        digest.update(&buffer[..n]);
    }
    total == CLI_SIZE
        && hex_digest(digest) == CLI_SHA256
        && crate::deployment_trust::trusted_unity_executable(path)
}

struct OwnedStage(PathBuf);
impl Drop for OwnedStage {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn redirects_cannot_change_host_version_artifact_or_scheme() {
        assert!(permitted_destination(CLI_URL));
        assert!(permitted_destination(CLI_REGIONAL_URL));
        for destination in [
            CLI_URL.replace("https://", "http://"),
            CLI_URL.replace("beta.11", "beta.12"),
            CLI_URL.replace("unity-windows-x64.exe", "UnityHubSetup.exe"),
            format!("{CLI_URL}?mirror=other"),
            CLI_URL.replace("unity3d.com", "unity3d.com.example.org"),
        ] {
            assert!(!permitted_destination(&destination));
        }
    }
    #[test]
    fn an_existing_binary_is_never_replaced_and_untrusted_bytes_are_not_executed() {
        let root = std::env::temp_dir().join(format!("vua-cli-bootstrap-{}", std::process::id()));
        let exe = managed_cli_path(&root);
        std::fs::create_dir_all(exe.parent().unwrap()).unwrap();
        std::fs::write(&exe, b"foreign synthetic binary").unwrap();
        assert!(planned_cli(&root, r"C:\Editors").is_none());
        assert!(!verified_artifact(&exe));
        assert_eq!(std::fs::read(&exe).unwrap(), b"foreign synthetic binary");
        std::fs::remove_file(&exe).unwrap();
        let partial = exe.with_file_name("unity.exe.partial");
        std::fs::write(&partial, b"unknown interrupted download").unwrap();
        assert!(planned_cli(&root, r"C:\Editors").is_none());
        assert_eq!(
            std::fs::read(&partial).unwrap(),
            b"unknown interrupted download"
        );
        std::fs::remove_file(&partial).unwrap();
        // Remove only the known synthetic directories, never a recursive cleanup.
        let mut cursor = exe.parent().unwrap().to_path_buf();
        loop {
            std::fs::remove_dir(&cursor).unwrap();
            if cursor == root {
                break;
            }
            cursor = cursor.parent().unwrap().into();
        }
    }
}
