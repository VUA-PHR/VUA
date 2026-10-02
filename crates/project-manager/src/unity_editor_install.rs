//! N1's direct Editor installer: a region-aware policy selects the source, Unity's original
//! Windows installer performs installation, and the official CLI registers the result.
//! Keep acquisition and installation here rather than in the renderer or application core.

use md5::{Digest as Md5Digest, Md5};
use sha2::{Digest, Sha256};
use std::{
    io::{Read, Write},
    path::{Path, PathBuf},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use vua_orchestrator::deployment::{
    DeploymentActivity, DeploymentPhase, DeploymentReporter, EditorDownloadPolicy,
    EditorDownloadSource,
};
use vua_orchestrator::{ProcessError, ProcessRunner, ProcessSpec};

pub(super) const SOURCE_PAGE: &str = vua_orchestrator::deployment::UNITY_EDITOR_SOURCE;
const EDITOR_URL: &str = "https://download.unity3d.com/download_unity/887be4894c44/Windows64EditorInstaller/UnitySetup64-2022.3.22f1.exe";
// Unity Release API / CLI dry-run for the exact global Windows x64 changeset.
const EDITOR_MD5: &str = "4b5bcea63f3de8377e69d127d3ce4c1d";
const MAX_EDITOR_BYTES: u64 = 4 * 1024 * 1024 * 1024;
const DOWNLOAD_ERROR: &str = "vua.deployment.editor_download_failed";
const INTEGRITY_ERROR: &str = "vua.deployment.editor_integrity_failed";

fn cached_installer(data_root: &Path) -> PathBuf {
    data_root.join("environment/unity-editor/2022.3.22f1/UnitySetup64-2022.3.22f1.exe")
}

/// A debug-only local file reuses a browser download during real-machine development.
/// It follows the same checksum/signature check as network acquisition, and does not
/// introduce an executable-path input into the desktop Gateway.
fn development_installer() -> Option<PathBuf> {
    if cfg!(debug_assertions) {
        std::env::var_os("VUA_DEV_EDITOR_INSTALLER").map(PathBuf::from)
    } else {
        None
    }
}

pub(super) fn install_editor(
    data_root: &Path,
    editor_root: &str,
    runner: &dyn ProcessRunner,
    policy: &EditorDownloadPolicy,
    report: &mut DeploymentReporter<'_>,
) -> Result<PathBuf, &'static str> {
    let destination = Path::new(editor_root).join(vua_orchestrator::PRODUCTION_TARGET);
    if !crate::unity_install::safe_install_root(&destination) || destination.exists() {
        return Err("vua.deployment.plan_changed");
    }
    let installer = match development_installer() {
        Some(file) => {
            verify_installer(&file, report)?;
            file
        }
        None => acquire_installer(data_root, policy, report)?,
    };
    // Downloads can take minutes. Recheck immediately before the installer so a
    // newly created installation or redirected ancestor triggers a fresh plan.
    if !crate::unity_install::safe_install_root(&destination) || destination.exists() {
        return Err("vua.deployment.plan_changed");
    }
    // /D must be the final *unquoted* tail, including directories containing spaces.
    // ProcessRunner owns that Windows quoting behavior and all process lifetime handling.
    let spec = ProcessSpec {
        executable: installer,
        args: vec!["/S".into()],
        windows_nsis_install_dir: Some(destination.clone()),
        timeout: Duration::from_secs(1800),
        output_limit: 64 * 1024,
        ..ProcessSpec::default()
    };
    report(DeploymentActivity::new(DeploymentPhase::Installing))?;
    let outcome = runner.run(&spec).map_err(|error| match error {
        ProcessError::Io(error) if error.raw_os_error() == Some(740) => {
            "vua.deployment.elevation_required"
        }
        ProcessError::Io(error) if error.raw_os_error() == Some(1223) => {
            "vua.deployment.elevation_declined"
        }
        _ => "vua.deployment.process_failed",
    })?;
    // The elevated OS-owned process is waited directly, then its Editor is inspected.
    if !outcome.success() {
        return Err("vua.deployment.install_failed");
    }
    report(DeploymentActivity::new(DeploymentPhase::Inspecting))?;
    match crate::verify_editor_path_system(&destination) {
        crate::EditorPathVerdict::Verified(identity)
            if identity.classification == vua_orchestrator::EditorClass::ProductionTarget =>
        {
            Ok(destination)
        }
        _ => Err("vua.deployment.verification_failed"),
    }
}

fn acquire_installer(
    data_root: &Path,
    policy: &EditorDownloadPolicy,
    report: &mut DeploymentReporter<'_>,
) -> Result<PathBuf, &'static str> {
    let target = cached_installer(data_root);
    let parent = target.parent().ok_or(DOWNLOAD_ERROR)?;
    if !crate::unity_install::safe_install_root(parent) {
        return Err("vua.deployment.invalid_location");
    }
    std::fs::create_dir_all(parent).map_err(|_| DOWNLOAD_ERROR)?;
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| DOWNLOAD_ERROR)?
        .as_nanos();
    if target.exists() {
        match verify_installer(&target, report) {
            Ok(_) => return Ok(target),
            Err(INTEGRITY_ERROR) => {
                // Preserve the rejected cache for local diagnosis and leave the download
                // slot reusable. Only this managed cache entry is moved; no user file is deleted.
                report(DeploymentActivity {
                    cause: Some(INTEGRITY_ERROR),
                    ..DeploymentActivity::new(DeploymentPhase::CacheRejected)
                })?;
                std::fs::rename(
                    &target,
                    parent.join(format!("UnitySetup64-{nonce}.rejected.exe")),
                )
                .map_err(|_| DOWNLOAD_ERROR)?;
            }
            Err(error) => return Err(error),
        }
    }
    let runtime = tokio::runtime::Runtime::new().map_err(|_| DOWNLOAD_ERROR)?;
    let client = reqwest::Client::builder()
        .https_only(true)
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) VUA-N1")
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            // Switch routes before downloading gigabytes of a regional replacement.
            if attempt.previous().len() >= 6 || is_regional_redirect(attempt.url()) {
                attempt.stop()
            } else {
                attempt.follow()
            }
        }))
        .connect_timeout(Duration::from_secs(30))
        .read_timeout(Duration::from_secs(60))
        .timeout(Duration::from_secs(7200))
        .build()
        .map_err(|_| DOWNLOAD_ERROR)?;
    for (index, source) in policy.sources.iter().enumerate() {
        report(DeploymentActivity::from_source(
            DeploymentPhase::ResolvingSource,
            *source,
        ))?;
        let url = match source {
            EditorDownloadSource::Official => EDITOR_URL.to_owned(),
            EditorDownloadSource::Nounitycn => match runtime.block_on(mirror_link(&client)) {
                Ok(url) => url,
                Err(error) => {
                    source_failed(*source, error, report)?;
                    continue;
                }
            },
        };
        let stage = parent.join(format!("UnitySetup64-{nonce}-{index}.partial.exe"));
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&stage)
            .map_err(|_| DOWNLOAD_ERROR)?;
        let owned = OwnedDownload(stage.clone());
        let downloaded = runtime.block_on(download(&client, &url, *source, &mut file, report));
        drop(file);
        match downloaded.and_then(|()| verify_installer(&stage, report)) {
            Ok(sha256) => {
                // Publish without replacing another file. Each attempt owns only its stage.
                std::fs::hard_link(&stage, &target).map_err(|_| DOWNLOAD_ERROR)?;
                drop(owned);
                let source_page = match source {
                    EditorDownloadSource::Official => {
                        vua_orchestrator::deployment::UNITY_OFFICIAL_EDITOR_SOURCE
                    }
                    EditorDownloadSource::Nounitycn => SOURCE_PAGE,
                };
                let record = serde_json::json!({"source":source, "sourcePage":source_page,
                    "downloadRoute":url, "version":vua_orchestrator::PRODUCTION_TARGET,
                    "changeset":"887be4894c44", "officialMd5":EDITOR_MD5, "fileSha256":sha256});
                std::fs::write(
                    parent.join("acquisition.json"),
                    serde_json::to_vec_pretty(&record).map_err(|_| DOWNLOAD_ERROR)?,
                )
                .map_err(|_| DOWNLOAD_ERROR)?;
                return Ok(target);
            }
            Err("vua.deployment.cancelled") => return Err("vua.deployment.cancelled"),
            Err(error) => source_failed(*source, error, report)?,
        }
    }
    // Each failure is already a durable source-specific progress fact. The application
    // includes those facts in the Hub handoff instead of flattening them into one error.
    Err("vua.deployment.hub_fallback_required")
}

fn source_failed(
    source: EditorDownloadSource,
    cause: &'static str,
    report: &mut DeploymentReporter<'_>,
) -> Result<(), &'static str> {
    report(DeploymentActivity {
        cause: Some(cause),
        ..DeploymentActivity::from_source(DeploymentPhase::SourceFailed, source)
    })
}

/// Follow the version page's actual Windows button. A relay is not implied by the
/// site's branding; official acquisition never requests this page.
async fn mirror_link(client: &reqwest::Client) -> Result<String, &'static str> {
    let page = client
        .get(SOURCE_PAGE)
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|_| DOWNLOAD_ERROR)?;
    if !page.status().is_success() || page.content_length().is_some_and(|n| n > 2_000_000) {
        return Err(DOWNLOAD_ERROR);
    }
    let html = page.text().await.map_err(|_| DOWNLOAD_ERROR)?;
    let link = selected_download(&html).ok_or("vua.deployment.editor_source_changed")?;
    Ok(link.to_owned())
}

async fn download(
    client: &reqwest::Client,
    url: &str,
    source: EditorDownloadSource,
    file: &mut std::fs::File,
    report: &mut DeploymentReporter<'_>,
) -> Result<(), &'static str> {
    report(DeploymentActivity::from_source(
        DeploymentPhase::Downloading,
        source,
    ))?;
    let mut response = client
        .get(url)
        .header(
            reqwest::header::REFERER,
            match source {
                EditorDownloadSource::Official => {
                    vua_orchestrator::deployment::UNITY_OFFICIAL_EDITOR_SOURCE
                }
                EditorDownloadSource::Nounitycn => SOURCE_PAGE,
            },
        )
        .send()
        .await
        .map_err(download_error)?;
    if response.status().is_redirection() {
        let regional = response
            .headers()
            .get(reqwest::header::LOCATION)
            .and_then(|h| h.to_str().ok())
            .and_then(|location| response.url().join(location).ok())
            .is_some_and(|url| is_regional_redirect(&url));
        return Err(if regional {
            "vua.deployment.editor_regional_redirect"
        } else {
            "vua.deployment.editor_redirect_failed"
        });
    }
    if response.status() != reqwest::StatusCode::OK {
        return Err("vua.deployment.editor_http_failed");
    }
    if response
        .content_length()
        .is_some_and(|n| n == 0 || n > MAX_EDITOR_BYTES)
    {
        return Err(DOWNLOAD_ERROR);
    }
    let expected = response.content_length();
    let mut total = 0u64;
    let mut last_report = Instant::now();
    report(byte_progress(
        DeploymentPhase::Downloading,
        Some(source),
        0,
        expected,
    ))?;
    while let Some(chunk) = response.chunk().await.map_err(download_error)? {
        total += chunk.len() as u64;
        if total > MAX_EDITOR_BYTES {
            return Err(INTEGRITY_ERROR);
        }
        file.write_all(&chunk).map_err(|_| DOWNLOAD_ERROR)?;
        if last_report.elapsed() >= Duration::from_secs(1) {
            report(byte_progress(
                DeploymentPhase::Downloading,
                Some(source),
                total,
                expected,
            ))?;
            last_report = Instant::now();
        }
    }
    if expected.is_some_and(|n| n != total) || total == 0 {
        return Err(INTEGRITY_ERROR);
    }
    report(byte_progress(
        DeploymentPhase::Downloading,
        Some(source),
        total,
        expected,
    ))?;
    file.sync_all().map_err(|_| DOWNLOAD_ERROR)
}

fn download_error(error: reqwest::Error) -> &'static str {
    if error.is_timeout() {
        "vua.deployment.editor_download_timeout"
    } else {
        DOWNLOAD_ERROR
    }
}

fn byte_progress(
    phase: DeploymentPhase,
    source: Option<EditorDownloadSource>,
    completed: u64,
    total: Option<u64>,
) -> DeploymentActivity {
    DeploymentActivity {
        completed_bytes: Some(completed),
        total_bytes: total,
        source,
        ..DeploymentActivity::new(phase)
    }
}

fn is_regional_redirect(url: &reqwest::Url) -> bool {
    url.host_str()
        .is_some_and(|host| host == "unitychina.cn" || host.ends_with(".unitychina.cn"))
}

/// The initial source is a version index, so use the actual href rather than guessing a
/// new version or accepting an arbitrary page-selected executable. HTML stays unexecuted.
fn selected_download(html: &str) -> Option<&str> {
    if html.len() > 2_000_000 {
        return None;
    }
    html.split("href=\"")
        .skip(1)
        .filter_map(|part| part.split('"').next())
        .find(|url| *url == EDITOR_URL)
}

fn verify_installer(
    path: &Path,
    report: &mut DeploymentReporter<'_>,
) -> Result<String, &'static str> {
    let mut file = std::fs::File::open(path).map_err(|_| INTEGRITY_ERROR)?;
    let size = file.metadata().map_err(|_| INTEGRITY_ERROR)?.len();
    if size == 0 || size > MAX_EDITOR_BYTES {
        return Err(INTEGRITY_ERROR);
    }
    let mut md5 = Md5::new();
    let mut sha256 = Sha256::new();
    let mut buffer = [0u8; 256 * 1024];
    let mut total = 0u64;
    let mut last_report = Instant::now();
    report(byte_progress(
        DeploymentPhase::Verifying,
        None,
        0,
        Some(size),
    ))?;
    loop {
        let n = file.read(&mut buffer).map_err(|_| INTEGRITY_ERROR)?;
        if n == 0 {
            break;
        }
        total += n as u64;
        if total > MAX_EDITOR_BYTES {
            return Err(INTEGRITY_ERROR);
        }
        md5.update(&buffer[..n]);
        sha256.update(&buffer[..n]);
        if last_report.elapsed() >= Duration::from_secs(1) {
            report(byte_progress(
                DeploymentPhase::Verifying,
                None,
                total,
                Some(size),
            ))?;
            last_report = Instant::now();
        }
    }
    if total != size
        || format!("{:x}", md5.finalize()) != EDITOR_MD5
        || !crate::deployment_trust::trusted_unity_executable(path)
    {
        return Err(INTEGRITY_ERROR);
    }
    report(byte_progress(
        DeploymentPhase::Verifying,
        None,
        total,
        Some(size),
    ))?;
    Ok(sha256
        .finalize()
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect())
}

struct OwnedDownload(PathBuf);
impl Drop for OwnedDownload {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Exercise HTTP headers, actual transfer accounting and route failure without
    /// downloading an Editor or touching a user's network configuration.
    #[test]
    fn download_reports_bytes_and_preserves_the_mirror_referrer() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let url = format!("http://{}/installer", listener.local_addr().unwrap());
        let server = std::thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            socket
                .set_read_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            let mut request = Vec::new();
            let mut buffer = [0; 512];
            while !request.windows(4).any(|bytes| bytes == b"\r\n\r\n") {
                let n = socket.read(&mut buffer).unwrap();
                assert!(n > 0);
                request.extend_from_slice(&buffer[..n]);
            }
            socket
                .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 4\r\nConnection: close\r\n\r\ntest")
                .unwrap();
            String::from_utf8(request).unwrap()
        });
        let path = std::env::temp_dir().join(format!(
            "vua-download-progress-{}.partial",
            std::process::id()
        ));
        let mut file = std::fs::File::create(&path).unwrap();
        let cleanup = OwnedDownload(path.clone());
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let client = reqwest::Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap();
        let mut events = Vec::new();
        runtime
            .block_on(download(
                &client,
                &url,
                EditorDownloadSource::Nounitycn,
                &mut file,
                &mut |event| {
                    events.push(event);
                    Ok(())
                },
            ))
            .unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), b"test");
        let last = events.last().unwrap();
        assert_eq!(last.completed_bytes, Some(4));
        assert_eq!(last.total_bytes, Some(4));
        assert!(server
            .join()
            .unwrap()
            .contains(&format!("referer: {SOURCE_PAGE}")));
        drop(file);
        drop(cleanup);
    }

    #[test]
    fn cancellation_during_verification_reaches_the_caller() {
        let path =
            std::env::temp_dir().join(format!("vua-verify-cancel-{}.partial", std::process::id()));
        std::fs::write(&path, b"test").unwrap();
        let _cleanup = OwnedDownload(path.clone());
        assert_eq!(
            verify_installer(&path, &mut |_| Err("vua.deployment.cancelled")),
            Err("vua.deployment.cancelled")
        );
    }
    #[test]
    fn regional_replacement_switches_routes_before_file_transfer() {
        for url in [
            "https://download.unitychina.cn/download_unity/installer.exe",
            "https://unitychina.cn/installer.exe",
        ] {
            assert!(is_regional_redirect(&reqwest::Url::parse(url).unwrap()));
        }
        assert!(!is_regional_redirect(
            &reqwest::Url::parse(EDITOR_URL).unwrap()
        ));
    }
    #[test]
    fn source_cannot_select_a_different_changeset_or_program() {
        assert_eq!(
            selected_download(&format!("<a href=\"{EDITOR_URL}\">Windows</a>")),
            Some(EDITOR_URL)
        );
        for url in [
            EDITOR_URL.replace("887be4894c44", "other"),
            EDITOR_URL.replace("unity3d.com", "example.com"),
            "https://example.com/tool.exe".to_owned(),
        ] {
            assert!(selected_download(&format!("<a href=\"{url}\">Download</a>")).is_none());
        }
    }
    #[test]
    fn partial_or_foreign_installer_is_not_executed_or_replaced() {
        let file =
            std::env::temp_dir().join(format!("vua-editor-integrity-{}.exe", std::process::id()));
        std::fs::write(&file, b"synthetic incomplete installer").unwrap();
        assert_eq!(
            verify_installer(&file, &mut |_| Ok(())),
            Err(INTEGRITY_ERROR)
        );
        assert_eq!(
            std::fs::read(&file).unwrap(),
            b"synthetic incomplete installer"
        );
        std::fs::remove_file(file).unwrap();
    }
}
