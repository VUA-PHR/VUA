//! N1 Windows installation adapter. Vendor executable discovery and command syntax live here.
//!
//! Hub owns downloads, installation and licensing. VUA never edits Hub's global install path,
//! changes the VR runtime, invokes a shell, or accepts renderer-supplied commands. An automatic
//! action requires a trusted Unity-signed Hub, a working documented CLI, and the exact confirmed
//! installation root. Unsupported/deprecated CLI behavior degrades to official UI guidance.

use crate::{verify_editor_path_system, EditorPathVerdict, VccSettingsFileReader};
use std::{
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};
use vua_orchestrator::deployment::{
    DeploymentAction, DeploymentAdapter, DeploymentIntent, DeploymentObservation,
    DeploymentPresence, DeploymentPurpose,
};
use vua_orchestrator::{
    EnvironmentEngine, EnvironmentPresence, EnvironmentRoots, ProcessRunner, ProcessSpec,
    StdProcessRunner, SystemClock,
};

const UNITY_VERSION: &str = vua_orchestrator::PRODUCTION_TARGET;
// Official release archive: https://unity.com/releases/editor/whats-new/2022.3.22f1
const UNITY_CHANGESET: &str = "887be4894c44";

pub struct WindowsDeploymentAdapter {
    engine: EnvironmentEngine,
    runner: Arc<dyn ProcessRunner>,
}

impl WindowsDeploymentAdapter {
    pub fn new(roots: EnvironmentRoots) -> Self {
        let runner: Arc<dyn ProcessRunner> = Arc::new(StdProcessRunner);
        Self {
            engine: EnvironmentEngine::new(
                runner.clone(),
                Arc::new(SystemClock),
                roots,
                Arc::new(VccSettingsFileReader),
            ),
            runner,
        }
    }

    /// Return only the actually observed executable. The renderer cannot nominate a program.
    fn hub(&self) -> Option<PathBuf> {
        self.engine
            .inspect_deployment_components()
            .iter()
            .find(|f| f.id == "unity_hub" && f.presence == EnvironmentPresence::Detected)
            .and_then(|f| f.facts.get("exe").and_then(|s| s.as_str()))
            .map(PathBuf::from)
    }

    fn run(
        &self,
        executable: &Path,
        args: &[&str],
        seconds: u64,
    ) -> Result<vua_orchestrator::ProcessOutcome, &'static str> {
        self.runner
            .run(&ProcessSpec {
                executable: executable.into(),
                args: args.iter().map(|s| (*s).into()).collect(),
                timeout: Duration::from_secs(seconds),
                output_limit: 64 * 1024,
                ..ProcessSpec::default()
            })
            .map_err(|_| "vua.deployment.process_failed")
    }

    fn hub_supported(&self, hub: &Path, intent: &DeploymentIntent) -> bool {
        if !safe_install_root(Path::new(&intent.editor_root)) {
            return false;
        }
        if !crate::deployment_trust::trusted_unity_executable(hub) {
            return false;
        }
        let Ok(help) = self.run(hub, &["--", "--headless", "help"], 30) else {
            return false;
        };
        if !help.success() || help.truncated || !help.stdout.contains("install-modules") {
            return false;
        }
        let Ok(root) = self.run(hub, &["--", "--headless", "install-path", "--get"], 30) else {
            return false;
        };
        // No global path mutation and no guessing among diagnostic lines. Non-plain output
        // is an unsupported CLI response, requiring the user to use Hub instead.
        root.success()
            && !root.truncated
            && same_windows_path(root.stdout.trim(), &intent.editor_root)
    }
}

fn same_windows_path(a: &str, b: &str) -> bool {
    a.replace('/', "\\")
        .trim_end_matches('\\')
        .eq_ignore_ascii_case(b.replace('/', "\\").trim_end_matches('\\'))
}

fn editor_observation(intent: &DeploymentIntent) -> DeploymentObservation {
    let root = Path::new(&intent.editor_root).join(UNITY_VERSION);
    let (presence, version) = if !root.exists() {
        (DeploymentPresence::Missing, Some(UNITY_VERSION.into()))
    } else {
        match verify_editor_path_system(&root) {
            EditorPathVerdict::Verified(v)
                if v.classification == vua_orchestrator::EditorClass::ProductionTarget =>
            {
                (DeploymentPresence::Verified, Some(v.version))
            }
            EditorPathVerdict::Verified(v) => (DeploymentPresence::Unsuitable, Some(v.version)),
            EditorPathVerdict::Refused(_) => (DeploymentPresence::DetectionFailed, None),
        }
    };
    DeploymentObservation {
        component: "unity_editor".into(),
        presence,
        location: Some(root.to_string_lossy().into()),
        version,
    }
}

fn android_observation(intent: &DeploymentIntent, editor_ready: bool) -> DeploymentObservation {
    let root = Path::new(&intent.editor_root)
        .join(UNITY_VERSION)
        .join("Editor/Data/PlaybackEngines/AndroidPlayer");
    let found = [
        "SDK/platform-tools/adb.exe",
        "NDK/source.properties",
        "OpenJDK/bin/java.exe",
        "UnityEditor.Android.Extensions.dll",
    ]
    .iter()
    .all(|p| root.join(p).is_file());
    DeploymentObservation {
        component: "android_modules".into(),
        presence: if found && editor_ready {
            DeploymentPresence::Verified
        } else {
            DeploymentPresence::Missing
        },
        location: Some(root.to_string_lossy().into()),
        version: Some(UNITY_VERSION.into()),
    }
}

impl DeploymentAdapter for WindowsDeploymentAdapter {
    fn observe(&self, intent: &DeploymentIntent) -> Vec<DeploymentObservation> {
        let mut facts: Vec<_> = self
            .engine
            .inspect_deployment_components()
            .into_iter()
            .map(|f| {
                let location = f
                    .facts
                    .get("exe")
                    .or_else(|| f.facts.get("path"))
                    .or_else(|| f.facts.get("root"))
                    .and_then(|p| p.as_str())
                    .map(str::to_owned);
                let complete = location
                    .as_ref()
                    .is_some_and(|p| component_files_present(&f.id, Path::new(p)));
                DeploymentObservation {
                    component: f.id,
                    presence: match f.presence {
                        EnvironmentPresence::Detected if complete => DeploymentPresence::Verified,
                        EnvironmentPresence::Detected => DeploymentPresence::Unsuitable,
                        EnvironmentPresence::NotDetected => DeploymentPresence::Missing,
                        EnvironmentPresence::DetectionFailed => DeploymentPresence::DetectionFailed,
                    },
                    location,
                    version: None,
                }
            })
            .collect();
        let editor = editor_observation(intent);
        facts.push(android_observation(
            intent,
            editor.presence == DeploymentPresence::Verified,
        ));
        facts.push(editor);
        let creator = intent.purposes.iter().any(|p| {
            matches!(
                p,
                DeploymentPurpose::PcAvatar | DeploymentPurpose::QuestAvatar
            )
        });
        let supported = creator
            && self
                .hub()
                .is_some_and(|hub| self.hub_supported(&hub, intent));
        facts.push(DeploymentObservation {
            component: "hub_install_api".into(),
            presence: if supported {
                DeploymentPresence::Verified
            } else {
                DeploymentPresence::Missing
            },
            location: None,
            version: None,
        });
        facts
    }

    fn install(
        &self,
        intent: &DeploymentIntent,
        action: DeploymentAction,
    ) -> Result<(), &'static str> {
        intent.validate()?;
        let _machine_lease = InstallLease::acquire()?;
        let hub = self.hub().ok_or("vua.deployment.hub_missing")?;
        // Recheck identity and CLI at the mutation boundary, not only when the plan was shown.
        if !self.hub_supported(&hub, intent) {
            return Err("vua.deployment.hub_unsupported");
        }
        let args = install_args(action)?;
        // User cancellation is cooperative BEFORE/AFTER the installer. The process runner's
        // two-hour timeout contains only this invocation's owned tree, never an existing Hub.
        // Interrupted/timed-out installs may leave partial files: reinspection, no rollback.
        let outcome = self.run(&hub, &args, 7200)?;
        if !outcome.success() {
            return Err("vua.deployment.install_failed");
        }
        let after = self.observe(intent);
        let component = if action == DeploymentAction::InstallEditor {
            "unity_editor"
        } else {
            "android_modules"
        };
        if !after
            .iter()
            .any(|f| f.component == component && f.presence == DeploymentPresence::Verified)
        {
            return Err("vua.deployment.verification_failed");
        }
        Ok(())
    }
}

/// Closed vendor command vocabulary. Purpose/path input cannot become an argument list.
fn install_args(action: DeploymentAction) -> Result<Vec<&'static str>, &'static str> {
    match action {
        DeploymentAction::InstallEditor => Ok(vec![
            "--",
            "--headless",
            "install",
            "--version",
            UNITY_VERSION,
            "--changeset",
            UNITY_CHANGESET,
            "--errors",
        ]),
        DeploymentAction::AddAndroidModules => Ok(vec![
            "--",
            "--headless",
            "install-modules",
            "--version",
            UNITY_VERSION,
            "--module",
            "android",
            "android-sdk-ndk-tools",
            "android-open-jdk",
            "--errors",
        ]),
        _ => Err("vua.deployment.action_refused"),
    }
}

/// All VUA instances in this Windows session share one installer lock. The OS releases the
/// handle on crash; an abandoned live lock is a refusal, never implicit installer recovery.
#[cfg(windows)]
struct InstallLease(windows_sys::Win32::Foundation::HANDLE);
#[cfg(windows)]
impl InstallLease {
    fn acquire() -> Result<Self, &'static str> {
        use windows_sys::Win32::{
            Foundation::{WAIT_ABANDONED, WAIT_OBJECT_0},
            System::Threading::{CreateMutexW, ReleaseMutex, WaitForSingleObject},
        };
        let name: Vec<u16> = "Local\\VUA.EnvironmentDeployment.v01"
            .encode_utf16()
            .chain(Some(0))
            .collect();
        // SAFETY: null default security; name is NUL-terminated and lives through creation.
        let handle = unsafe { CreateMutexW(std::ptr::null(), 0, name.as_ptr()) };
        if handle.is_null() {
            return Err("vua.deployment.lock_unavailable");
        }
        // SAFETY: the handle is valid; zero wait never blocks the Provider request loop.
        let waited = unsafe { WaitForSingleObject(handle, 0) };
        if waited == WAIT_OBJECT_0 {
            return Ok(Self(handle));
        }
        // An abandoned acquisition grants ownership; release it while refusing this action.
        unsafe {
            if waited == WAIT_ABANDONED {
                ReleaseMutex(handle);
            }
            windows_sys::Win32::Foundation::CloseHandle(handle);
        }
        Err("vua.deployment.busy")
    }
}
#[cfg(windows)]
impl Drop for InstallLease {
    fn drop(&mut self) {
        // SAFETY: only a successful owner constructs this guard; it drops on that thread.
        unsafe {
            windows_sys::Win32::System::Threading::ReleaseMutex(self.0);
            windows_sys::Win32::Foundation::CloseHandle(self.0);
        }
    }
}
#[cfg(not(windows))]
struct InstallLease;
#[cfg(not(windows))]
impl InstallLease {
    fn acquire() -> Result<Self, &'static str> {
        Err("vua.deployment.unsupported_platform")
    }
}

/// Presence means the selected application's entry point was observed, not that it was
/// launched or its hardware worked. Incomplete installations require inspection, not overwrite.
fn component_files_present(component: &str, location: &Path) -> bool {
    match component {
        "steam" => location.join("steam.exe").is_file(),
        "steamvr" => location.join("bin/win64/vrmonitor.exe").is_file(),
        "pico_runtime" => location.join("PICO Connect.exe").is_file(),
        "unity_hub" | "vrchat" => location.is_file(),
        _ => false,
    }
}

/// Existing ancestors must be ordinary directories. Fail closed on unreadable ancestors,
/// junctions/symlinks or files, so a confirmed root cannot intentionally redirect installation.
fn safe_install_root(root: &Path) -> bool {
    if !cfg!(windows) || !root.is_absolute() {
        return false;
    }
    for ancestor in root.ancestors() {
        match std::fs::symlink_metadata(ancestor) {
            Ok(meta) => {
                #[cfg(windows)]
                {
                    use std::os::windows::fs::MetadataExt;
                    if meta.file_attributes() & 0x400 != 0 {
                        return false;
                    }
                }
                if !meta.is_dir() || meta.file_type().is_symlink() {
                    return false;
                }
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(_) => return false,
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn adapter_never_overwrites_or_uninstalls_from_a_read_only_action() {
        for action in [
            DeploymentAction::Retain,
            DeploymentAction::Inspect,
            DeploymentAction::ManualInstall,
        ] {
            assert!(install_args(action).is_err());
        }
        let args = install_args(DeploymentAction::InstallEditor).unwrap();
        assert!(args.windows(2).any(|p| p == ["--version", UNITY_VERSION]));
        assert!(args
            .windows(2)
            .any(|p| p == ["--changeset", UNITY_CHANGESET]));
        let modules = install_args(DeploymentAction::AddAndroidModules).unwrap();
        assert!(
            modules.contains(&"android-sdk-ndk-tools") && modules.contains(&"android-open-jdk")
        );
        assert!(!args.contains(&"--latest") && !args.contains(&"install-path"));
    }
    #[test]
    fn empty_directory_does_not_verify_a_runtime() {
        let root = std::env::temp_dir().join(format!("vua-empty-runtime-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        for component in ["steam", "steamvr", "pico_runtime", "unity_hub", "vrchat"] {
            assert!(!component_files_present(component, &root));
        }
        std::fs::remove_dir(root).unwrap();
    }
    #[test]
    fn redirected_or_file_install_roots_are_refused() {
        assert!(!safe_install_root(Path::new("relative")));
        let root = std::env::temp_dir().join(format!("vua-file-root-{}", std::process::id()));
        std::fs::write(&root, b"synthetic").unwrap();
        assert!(!safe_install_root(&root.join("Editors")));
        std::fs::remove_file(root).unwrap();
    }
    #[cfg(windows)]
    #[test]
    fn install_lock_refuses_another_thread_until_the_first_owner_releases() {
        let held = InstallLease::acquire().unwrap();
        assert!(std::thread::spawn(|| InstallLease::acquire().is_err())
            .join()
            .unwrap());
        drop(held);
        assert!(InstallLease::acquire().is_ok());
    }
}
