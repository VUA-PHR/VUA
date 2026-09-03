//! Read-only environment detection (E-ENV smoke, O4 `inspect_environment`).
//!
//! Every check is a targeted observation of a configured, well-known root —
//! never a scan, never a write (ORC-WF-001: Inspect is read-only by type and
//! by test). A machine without a component yields a deterministic
//! "not detected" result, never a bubbled-up error (ORC-ERR-005: every
//! failure names the next step).
//!
//! # 检测器契约（presence 模型）
//!
//! 检测器只汇报事实：`presence`（detected / not_detected /
//! detection_failed 三值）+ 裸 `facts`（路径、版本串、字节数、探测记录）+
//! 稳定 ID。引擎不做策略决策——"缺失算 warning 还是 error"、磁盘阈值、
//! 修复文案全部属于前端与修复计划的消费者侧。`detection_failed` 只在
//! **观测本身失败**（目录不可读、探测超时、平台不支持）时出现，并且必须
//! 携带稳定错误码；"没装"是正常结论不带码（验收：无 vrc-get 机器返回
//! 确定"未安装"而非错误）。
//!
//! # 中文逐项说明
//!
//! Play 辖区 —— `steam`（注册表 InstallPath → 默认路径，再解析
//! `libraryfolders.vdf` 枚举全部游戏库根，多盘安装不再误报）、
//! `vrchat` / `steamvr`（在发现的库根下定点观测；Steam 缺失时退回配置
//! 根）、`openxr_runtime`（Khronos 注册表 ActiveRuntime → 运行时 JSON 的
//! 名称：当前串流会走谁）、五个头显运行时存在性检查
//! `oculus_runtime` / `pico_runtime` / `vive_runtime` /
//! `virtual_desktop` / `alvr`（候选根存在性，候选根可注入，确切路径的
//! 核实记录在环境检测 Spike 的开放问题）、`network`（对 `vrchat.com:443`
//! 做 TCP 探测，不发请求不登录）、`windows`（OS 版本注册表）、`gpu`
//! （显示适配器类注册表 DriverDesc）。
//!
//! Create 辖区 —— `unity_hub`（默认安装路径定点探测）、
//! `unity_editors`（枚举 Unity Hub 编辑器目录并按支持矩阵分类
//! production_target / migration_source / other_unity_version /
//! tuanjie_family，分类事实进 facts）、`vpm_cli`（经 ProcessRunner 跑
//! `--version`）、`vcc`（VCC settings.json 能力：存在性、格式、注册项目
//! 数——与包后端 vrc-get-vpm 同源）、`disk_space`（kernel32 的
//! `GetDiskFreeSpaceExW` 直接 FFI，只报字节数；阈值判断属于消费者）。
//!
//! 结构级要点：`EnvironmentRoots` 把所有探测路径与注册表访问做成可注入
//! ——测试全跑在合成目录树与合成注册表上，不依赖测试机的真实安装；只读
//! 性有测试证明（检测前后对观察目标做全树指纹比对，一个字节都不许变）。

use crate::editor_targets;
use crate::environment_managers;
use crate::process::{ProcessRunner, ProcessSpec};
use crate::time::Clock;
use crate::win_registry::{RegistryHive, RegistrySource};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io;
use std::net::{TcpStream, ToSocketAddrs};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

/// Stable environment error codes (ORC-ERR-001). These mark *detection*
/// failures, not environment findings.
pub mod error_codes {
    pub const READ_FAILED: &str = "vua.env.read_failed";
    pub const PROBE_FAILED: &str = "vua.env.probe_failed";
    pub const UNSUPPORTED_PLATFORM: &str = "vua.env.unsupported_platform";
}

const PROBE_TIMEOUT: Duration = Duration::from_secs(30);
const NETWORK_TIMEOUT: Duration = Duration::from_secs(3);
const OUTPUT_LIMIT: usize = 64 * 1024;

const STEAM_REGISTRY_SUBKEY: &str = "SOFTWARE\\WOW6432Node\\Valve\\Steam";
const OPENXR_REGISTRY_SUBKEY: &str = "SOFTWARE\\Khronos\\OpenXR\\1";
const WINDOWS_CURRENT_VERSION_SUBKEY: &str = "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion";
const GPU_CLASS_SUBKEY: &str =
    "SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}";

/// Deployer zones, mirroring the frontend navigation (v0.4.0 §2.1).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Zone {
    Play,
    Create,
}

/// What the detector observed: the thing, its absence, or a failed
/// observation. Severity ("is a missing SteamVR an error or a warning?")
/// is a consumer-side decision and deliberately not expressed here.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EnvironmentPresence {
    Detected,
    NotDetected,
    DetectionFailed,
}

/// One check result: presence plus the raw facts consumers render or plan
/// from. `error_code` is set only when `presence` is `DetectionFailed`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentCheckItemV1 {
    pub schema_version: u8,
    /// Stable check id, e.g. `steam`, `unity_editors` (fix plans and the
    /// frontend severity table key on it).
    pub id: String,
    pub zone: Zone,
    pub presence: EnvironmentPresence,
    /// Set only when the *observation itself* failed; a missing component
    /// is a normal finding without a code.
    pub error_code: Option<String>,
    /// Engineering view: paths, versions, byte counts, probe results.
    pub facts: Value,
}

/// Full read-only snapshot across both zones.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentSnapshotV1 {
    pub schema_version: u8,
    pub items: Vec<EnvironmentCheckItemV1>,
    pub captured_at: String,
}

/// Candidate roots for headset runtime detection. Every list is ordered
/// and every path is a targeted observation, not a scan; exact locations
/// for vendors that ship no stable documented path stay injectable so a
/// real machine can confirm them without a code change.
#[derive(Debug, Clone)]
pub struct VrRuntimeRoots {
    pub oculus: Vec<PathBuf>,
    pub pico: Vec<PathBuf>,
    pub vive: Vec<PathBuf>,
    pub virtual_desktop: Vec<PathBuf>,
    pub alvr: Vec<PathBuf>,
}

impl Default for VrRuntimeRoots {
    fn default() -> Self {
        let local_app_data = std::env::var("LOCALAPPDATA")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_default();
        let program_files =
            std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_owned());
        Self {
            oculus: vec![
                PathBuf::from(&local_app_data).join("Oculus"),
                PathBuf::from(&program_files).join("Oculus"),
            ],
            pico: vec![
                PathBuf::from(&program_files).join("PICO Connect"),
                PathBuf::from(&local_app_data).join("Programs").join("PICO Connect"),
            ],
            vive: vec![PathBuf::from(&program_files).join("VIVE")],
            virtual_desktop: vec![PathBuf::from(&local_app_data).join("VirtualDesktop")],
            alvr: vec![PathBuf::from(&local_app_data).join("alvr")],
        }
    }
}

/// Injectable well-known roots. Defaults target a standard Windows install;
/// tests substitute synthetic trees and a synthetic registry, so no test
/// depends on this machine.
#[derive(Debug, Clone)]
pub struct EnvironmentRoots {
    /// Fallback Steam library roots used only when Steam itself is not
    /// found; the `steam` check derives real roots from the install and
    /// its `libraryfolders.vdf`.
    pub steam_common: Vec<PathBuf>,
    /// `%USERPROFILE%\AppData\LocalLow` on Windows.
    pub local_low: PathBuf,
    pub unity_hub_exe: PathBuf,
    /// Unity Hub's per-version editor folders.
    pub unity_editors_root: PathBuf,
    /// Fixed vrc-get identity probed through the process runner.
    pub vrc_get_executable: String,
    /// Drive whose free space is reported (VUA data root); consumers own
    /// the thresholds.
    pub disk_target: PathBuf,
    /// `host:port` TCP probes for plain reachability.
    pub network_probes: Vec<String>,
    /// Registry view (production: real registry; tests: synthetic).
    pub registry: Arc<dyn RegistrySource>,
    /// Steam install candidates probed when the registry has no answer.
    pub steam_install_candidates: Vec<PathBuf>,
    /// Headset runtime candidate roots.
    pub vr_runtime_roots: VrRuntimeRoots,
    /// VCC settings candidates, same resolution order the package backend
    /// uses (LOCALAPPDATA first, legacy Roaming fallback).
    pub vcc_settings_candidates: Vec<PathBuf>,
}

impl Default for EnvironmentRoots {
    fn default() -> Self {
        let user_profile = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_default();
        let local_app_data = std::env::var("LOCALAPPDATA")
            .unwrap_or_else(|_| format!("{user_profile}\\AppData\\Local"));
        let roaming_app_data = std::env::var("APPDATA")
            .unwrap_or_else(|_| format!("{user_profile}\\AppData\\Roaming"));
        Self {
            steam_common: vec![PathBuf::from(
                "C:\\Program Files (x86)\\Steam\\steamapps\\common",
            )],
            local_low: PathBuf::from(format!("{user_profile}\\AppData\\LocalLow")),
            unity_hub_exe: PathBuf::from(format!(
                "{local_app_data}\\Programs\\Unity Hub\\Unity Hub.exe"
            )),
            unity_editors_root: PathBuf::from("C:\\Program Files\\Unity\\Hub\\Editor"),
            vrc_get_executable: "vrc-get".to_owned(),
            disk_target: PathBuf::from(&user_profile),
            network_probes: vec!["vrchat.com:443".to_owned()],
            registry: Arc::new(crate::win_registry::WindowsRegistrySource),
            steam_install_candidates: vec![PathBuf::from(
                "C:\\Program Files (x86)\\Steam",
            )],
            vr_runtime_roots: VrRuntimeRoots::default(),
            vcc_settings_candidates: vec![
                PathBuf::from(&local_app_data)
                    .join("VRChatCreatorCompanion")
                    .join("settings.json"),
                PathBuf::from(&roaming_app_data)
                    .join("VRChatCreatorCompanion")
                    .join("settings.json"),
            ],
        }
    }
}

pub struct EnvironmentEngine {
    runner: Arc<dyn ProcessRunner>,
    clock: Arc<dyn Clock>,
    roots: EnvironmentRoots,
}

impl EnvironmentEngine {
    pub fn new(
        runner: Arc<dyn ProcessRunner>,
        clock: Arc<dyn Clock>,
        roots: EnvironmentRoots,
    ) -> Self {
        Self {
            runner,
            clock,
            roots,
        }
    }

    /// Read-only snapshot of one zone.
    pub fn inspect_zone(&self, zone: Zone) -> Vec<EnvironmentCheckItemV1> {
        match zone {
            Zone::Play => vec![
                self.check_steam(),
                self.check_vrchat(),
                self.check_steamvr(),
                self.check_openxr_runtime(),
                self.check_brand_runtime("oculus_runtime", &self.roots.vr_runtime_roots.oculus),
                self.check_brand_runtime("pico_runtime", &self.roots.vr_runtime_roots.pico),
                self.check_brand_runtime("vive_runtime", &self.roots.vr_runtime_roots.vive),
                self.check_brand_runtime(
                    "virtual_desktop",
                    &self.roots.vr_runtime_roots.virtual_desktop,
                ),
                self.check_brand_runtime("alvr", &self.roots.vr_runtime_roots.alvr),
                self.check_network(),
                self.check_windows(),
                self.check_gpu(),
            ],
            Zone::Create => vec![
                self.check_unity_hub(),
                self.check_unity_editors(),
                self.check_vpm_cli(),
                self.check_vcc(),
                self.check_disk_space(),
            ],
        }
    }

    /// Read-only snapshot of everything (O4 use case).
    pub fn inspect_all(&self) -> EnvironmentSnapshotV1 {
        let mut items = self.inspect_zone(Zone::Play);
        items.extend(self.inspect_zone(Zone::Create));
        EnvironmentSnapshotV1 {
            schema_version: crate::ENVELOPE_SCHEMA_VERSION,
            items,
            captured_at: self.clock.now_rfc3339(),
        }
    }

    // --- play zone: Steam chain ---

    /// Locates the Steam install (registry first, then candidate roots)
    /// and derives every library's `steamapps/common` from
    /// `libraryfolders.vdf`, so multi-drive installs are observed instead
    /// of assumed.
    fn discover_steam(&self) -> Option<(PathBuf, Vec<PathBuf>)> {
        let mut install: Option<PathBuf> = self
            .roots
            .registry
            .get_string(RegistryHive::LocalMachine, STEAM_REGISTRY_SUBKEY, "InstallPath")
            .map(PathBuf::from)
            .filter(|path| path.is_dir());
        if install.is_none() {
            install = self
                .roots
                .steam_install_candidates
                .iter()
                .find(|candidate| candidate.is_dir())
                .cloned();
        }
        let install = install?;
        let mut library_roots = vec![install.join("steamapps").join("common")];
        for library in parse_vdf_library_roots(&install.join("steamapps").join("libraryfolders.vdf"))
        {
            let common = library.join("steamapps").join("common");
            if !library_roots.contains(&common) {
                library_roots.push(common);
            }
        }
        Some((install, library_roots))
    }

    fn check_steam(&self) -> EnvironmentCheckItemV1 {
        match self.discover_steam() {
            Some((install, library_roots)) => item(
                "steam",
                Zone::Play,
                EnvironmentPresence::Detected,
                None,
                json!({
                    "path": install.to_string_lossy(),
                    "libraryRoots": library_roots
                        .iter()
                        .map(|root| root.to_string_lossy())
                        .collect::<Vec<_>>(),
                }),
            ),
            None => item(
                "steam",
                Zone::Play,
                EnvironmentPresence::NotDetected,
                None,
                json!({
                    "registryKey": format!("HKLM\\{STEAM_REGISTRY_SUBKEY}:InstallPath"),
                    "searchedCandidates": roots_display(&self.roots.steam_install_candidates),
                }),
            ),
        }
    }

    fn check_vrchat(&self) -> EnvironmentCheckItemV1 {
        let library_roots = self.effective_library_roots();
        for root in &library_roots {
            let exe = root.join("VRChat").join("VRChat.exe");
            if exe.is_file() {
                return item(
                    "vrchat",
                    Zone::Play,
                    EnvironmentPresence::Detected,
                    None,
                    json!({ "exe": exe.to_string_lossy() }),
                );
            }
        }
        item(
            "vrchat",
            Zone::Play,
            EnvironmentPresence::NotDetected,
            None,
            json!({ "searchedRoots": roots_display(&library_roots) }),
        )
    }

    fn check_steamvr(&self) -> EnvironmentCheckItemV1 {
        let library_roots = self.effective_library_roots();
        for root in &library_roots {
            let install = root.join("SteamVR");
            if install.is_dir() {
                return item(
                    "steamvr",
                    Zone::Play,
                    EnvironmentPresence::Detected,
                    None,
                    json!({ "root": install.to_string_lossy() }),
                );
            }
        }
        item(
            "steamvr",
            Zone::Play,
            EnvironmentPresence::NotDetected,
            None,
            json!({ "searchedRoots": roots_display(&library_roots) }),
        )
    }

    /// Library roots for game checks: the discovered Steam libraries when
    /// Steam is present, the configured fallback roots otherwise.
    fn effective_library_roots(&self) -> Vec<PathBuf> {
        self.discover_steam()
            .map(|(_, roots)| roots)
            .unwrap_or_else(|| self.roots.steam_common.clone())
    }

    // --- play zone: VR runtimes ---

    /// The active OpenXR runtime: which vendor's bridge a PCVR session
    /// would actually use. Read from the Khronos registry key, then the
    /// referenced runtime JSON's display name.
    fn check_openxr_runtime(&self) -> EnvironmentCheckItemV1 {
        let active = self
            .roots
            .registry
            .get_string(RegistryHive::LocalMachine, OPENXR_REGISTRY_SUBKEY, "ActiveRuntime")
            .or_else(|| {
                self.roots
                    .registry
                    .get_string(RegistryHive::CurrentUser, OPENXR_REGISTRY_SUBKEY, "ActiveRuntime")
            });
        let Some(runtime_json) = active else {
            return item(
                "openxr_runtime",
                Zone::Play,
                EnvironmentPresence::NotDetected,
                None,
                json!({ "registryKeys": [
                    format!("HKLM\\{OPENXR_REGISTRY_SUBKEY}:ActiveRuntime"),
                    format!("HKCU\\{OPENXR_REGISTRY_SUBKEY}:ActiveRuntime"),
                ] }),
            );
        };
        let runtime_json_path = PathBuf::from(&runtime_json);
        let runtime_name = std::fs::read_to_string(&runtime_json_path)
            .ok()
            .and_then(|text| serde_json::from_str::<Value>(&text).ok())
            .and_then(|value| {
                value
                    .pointer("/runtime/name")
                    .and_then(Value::as_str)
                    .map(str::to_owned)
            });
        match runtime_name {
            Some(name) => item(
                "openxr_runtime",
                Zone::Play,
                EnvironmentPresence::Detected,
                None,
                json!({ "activeRuntimePath": runtime_json, "runtimeName": name }),
            ),
            None => item(
                "openxr_runtime",
                Zone::Play,
                EnvironmentPresence::DetectionFailed,
                Some(error_codes::READ_FAILED.to_owned()),
                json!({ "activeRuntimePath": runtime_json }),
            ),
        }
    }

    /// Presence check for one headset runtime family: ordered candidate
    /// roots, first hit wins. A vendor without a stable documented path
    /// keeps its candidates injectable (see the environment spike
    /// findings' open questions).
    fn check_brand_runtime(&self, id: &str, candidates: &[PathBuf]) -> EnvironmentCheckItemV1 {
        for candidate in candidates {
            if candidate.exists() {
                return item(
                    id,
                    Zone::Play,
                    EnvironmentPresence::Detected,
                    None,
                    json!({
                        "root": candidate.to_string_lossy(),
                        "searchedCandidates": roots_display(candidates),
                    }),
                );
            }
        }
        item(
            id,
            Zone::Play,
            EnvironmentPresence::NotDetected,
            None,
            json!({ "searchedCandidates": roots_display(candidates) }),
        )
    }

    // --- play zone: machine identity ---

    fn check_network(&self) -> EnvironmentCheckItemV1 {
        let mut reachable: Vec<String> = Vec::new();
        let mut unreachable: Vec<String> = Vec::new();
        for probe in &self.roots.network_probes {
            if tcp_reachable(probe) {
                reachable.push(probe.clone());
            } else {
                unreachable.push(probe.clone());
            }
        }
        let presence = if reachable.is_empty() {
            EnvironmentPresence::NotDetected
        } else {
            EnvironmentPresence::Detected
        };
        item(
            "network",
            Zone::Play,
            presence,
            None,
            json!({ "reachable": reachable, "unreachable": unreachable }),
        )
    }

    /// Windows identity: product name, display version, build. Facts only;
    /// minimum-spec conclusions belong to consumers.
    fn check_windows(&self) -> EnvironmentCheckItemV1 {
        let product = self
            .roots
            .registry
            .get_string(RegistryHive::LocalMachine, WINDOWS_CURRENT_VERSION_SUBKEY, "ProductName");
        let display_version = self
            .roots
            .registry
            .get_string(RegistryHive::LocalMachine, WINDOWS_CURRENT_VERSION_SUBKEY, "DisplayVersion");
        let build = self
            .roots
            .registry
            .get_string(RegistryHive::LocalMachine, WINDOWS_CURRENT_VERSION_SUBKEY, "CurrentBuildNumber");
        if product.is_none() && display_version.is_none() && build.is_none() {
            return item(
                "windows",
                Zone::Play,
                EnvironmentPresence::NotDetected,
                None,
                json!({ "registryKey": format!("HKLM\\{WINDOWS_CURRENT_VERSION_SUBKEY}") }),
            );
        }
        item(
            "windows",
            Zone::Play,
            EnvironmentPresence::Detected,
            None,
            json!({
                "productName": product,
                "displayVersion": display_version,
                "build": build,
            }),
        )
    }

    /// Display adapters by class-guid `DriverDesc` across the first ten
    /// class slots — slot 0000/0001 are frequently virtual display drivers
    /// (IddCx, remote-desktop mirrors) while the physical GPU sits later.
    /// Facts only — performance conclusions belong to analysis.
    fn check_gpu(&self) -> EnvironmentCheckItemV1 {
        let gpu_slots: [&str; 10] =
            ["0000", "0001", "0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009"];
        let gpus: Vec<String> = gpu_slots
            .iter()
            .filter_map(|slot| {
                self.roots
                    .registry
                    .get_string(RegistryHive::LocalMachine, &format!("{GPU_CLASS_SUBKEY}\\{slot}"), "DriverDesc")
            })
            .collect();
        let presence = if gpus.is_empty() {
            EnvironmentPresence::NotDetected
        } else {
            EnvironmentPresence::Detected
        };
        item("gpu", Zone::Play, presence, None, json!({ "gpus": gpus }))
    }

    // --- create zone ---

    fn check_unity_hub(&self) -> EnvironmentCheckItemV1 {
        let exe = &self.roots.unity_hub_exe;
        match std::fs::metadata(exe) {
            Ok(metadata) if metadata.is_file() => item(
                "unity_hub",
                Zone::Create,
                EnvironmentPresence::Detected,
                None,
                json!({ "exe": exe.to_string_lossy() }),
            ),
            _ => item(
                "unity_hub",
                Zone::Create,
                EnvironmentPresence::NotDetected,
                None,
                json!({ "exe": exe.to_string_lossy() }),
            ),
        }
    }

    fn check_unity_editors(&self) -> EnvironmentCheckItemV1 {
        let root_display = self.roots.unity_editors_root.to_string_lossy().into_owned();
        let read_dir = match std::fs::read_dir(&self.roots.unity_editors_root) {
            Ok(read_dir) => read_dir,
            Err(error) if error.kind() == io::ErrorKind::NotFound => {
                return item(
                    "unity_editors",
                    Zone::Create,
                    EnvironmentPresence::NotDetected,
                    None,
                    json!({ "root": root_display }),
                );
            }
            Err(error) => {
                return item(
                    "unity_editors",
                    Zone::Create,
                    EnvironmentPresence::DetectionFailed,
                    Some(error_codes::READ_FAILED.to_owned()),
                    json!({ "root": root_display, "reason": error.to_string() }),
                );
            }
        };
        let mut editors: Vec<(editor_targets::ParsedEditorVersion, PathBuf)> = Vec::new();
        for entry in read_dir.flatten() {
            let path = entry.path();
            if !path.is_dir() || !path.join("Editor").is_dir() {
                continue;
            }
            if let Some(parsed) =
                editor_targets::parse_editor_version(&entry.file_name().to_string_lossy())
            {
                editors.push((parsed, path));
            }
        }
        if editors.is_empty() {
            return item(
                "unity_editors",
                Zone::Create,
                EnvironmentPresence::NotDetected,
                None,
                json!({ "root": root_display }),
            );
        }
        editors.sort_by(|left, right| {
            let left = (left.0.major, left.0.minor, left.0.patch, left.0.release_number);
            let right = (right.0.major, right.0.minor, right.0.patch, right.0.release_number);
            right.cmp(&left)
        });
        let listed: Vec<Value> = editors
            .iter()
            .map(|(parsed, path)| {
                let (classification, guidance_code) = editor_targets::classify_editor(parsed);
                json!({
                    "version": parsed.display,
                    "path": path.to_string_lossy(),
                    "classification": classification,
                    "guidanceCode": guidance_code,
                })
            })
            .collect();
        item(
            "unity_editors",
            Zone::Create,
            EnvironmentPresence::Detected,
            None,
            json!({
                "root": root_display,
                "productionTarget": editor_targets::PRODUCTION_TARGET,
                "editors": listed,
            }),
        )
    }

    fn check_vpm_cli(&self) -> EnvironmentCheckItemV1 {
        let exe = &self.roots.vrc_get_executable;
        let spec = ProcessSpec {
            executable: PathBuf::from(exe),
            args: vec!["--version".to_owned()],
            working_dir: None,
            timeout: PROBE_TIMEOUT,
            output_limit: OUTPUT_LIMIT,
            ..Default::default()
        };
        match self.runner.run(&spec) {
            Ok(outcome) if outcome.success() => {
                let version = outcome
                    .stdout
                    .lines()
                    .next()
                    .unwrap_or("")
                    .trim()
                    .to_owned();
                item(
                    "vpm_cli",
                    Zone::Create,
                    EnvironmentPresence::Detected,
                    None,
                    json!({ "version": version, "exe": exe }),
                )
            }
            Ok(outcome) if outcome.timed_out => item(
                "vpm_cli",
                Zone::Create,
                EnvironmentPresence::DetectionFailed,
                Some(error_codes::PROBE_FAILED.to_owned()),
                json!({ "exe": exe }),
            ),
            // A missing binary or a failing probe is a normal missing
            // finding, not a detection failure (验收: 无 vrc-get 机器返回
            // 确定"未安装").
            Ok(outcome) => item(
                "vpm_cli",
                Zone::Create,
                EnvironmentPresence::NotDetected,
                None,
                json!({ "exe": exe, "exitCode": outcome.exit_code }),
            ),
            Err(_) => item(
                "vpm_cli",
                Zone::Create,
                EnvironmentPresence::NotDetected,
                None,
                json!({ "exe": exe }),
            ),
        }
    }

    /// VCC capability, reading the same settings resolution order the
    /// package backend uses. Counts only: project paths stay in the
    /// spike snapshot, not in the deployer card facts.
    fn check_vcc(&self) -> EnvironmentCheckItemV1 {
        let mut diagnostics = Vec::new();
        let capability = environment_managers::read_vcc_settings(
            &self.roots.vcc_settings_candidates,
            &mut diagnostics,
        );
        let presence = match capability.presence {
            environment_managers::ManagerPresence::Found => EnvironmentPresence::Detected,
            environment_managers::ManagerPresence::NotFound => EnvironmentPresence::NotDetected,
            environment_managers::ManagerPresence::ReadFailed => {
                EnvironmentPresence::DetectionFailed
            }
        };
        let error_code = capability.error_code.map(str::to_owned);
        let diagnostic_details: Vec<Value> = diagnostics
            .iter()
            .map(|diagnostic| {
                json!({ "code": diagnostic.code, "severity": diagnostic.severity, "detail": diagnostic.detail })
            })
            .collect();
        item(
            "vcc",
            Zone::Create,
            presence,
            error_code,
            json!({
                "settingsPath": capability.settings_path,
                "projectsSource": capability.projects_source,
                "registeredProjects": capability.user_projects.len(),
                "registeredFolders": capability.local_project_folders.len(),
                "diagnostics": diagnostic_details,
            }),
        )
    }

    fn check_disk_space(&self) -> EnvironmentCheckItemV1 {
        let target = self.roots.disk_target.to_string_lossy().into_owned();
        match free_disk_bytes(&self.roots.disk_target) {
            Ok((free, total)) => item(
                "disk_space",
                Zone::Create,
                EnvironmentPresence::Detected,
                None,
                json!({
                    "target": target,
                    "freeBytes": free,
                    "totalBytes": total,
                }),
            ),
            Err(code) => item(
                "disk_space",
                Zone::Create,
                EnvironmentPresence::DetectionFailed,
                Some(code.unwrap_or_else(|| error_codes::UNSUPPORTED_PLATFORM.to_owned())),
                json!({ "target": target }),
            ),
        }
    }
}

// --- helpers ---

#[allow(clippy::too_many_arguments)]
fn item(
    id: &str,
    zone: Zone,
    presence: EnvironmentPresence,
    error_code: Option<String>,
    facts: Value,
) -> EnvironmentCheckItemV1 {
    EnvironmentCheckItemV1 {
        schema_version: crate::ENVELOPE_SCHEMA_VERSION,
        id: id.to_owned(),
        zone,
        presence,
        error_code,
        facts,
    }
}

fn roots_display(roots: &[PathBuf]) -> Vec<String> {
    roots
        .iter()
        .map(|root| root.to_string_lossy().into_owned())
        .collect()
}

/// Extracts library install paths from Steam's `libraryfolders.vdf` —
/// the `"path"` entries, with VDF's escaped backslashes unescaped. An
/// unreadable or unexpected file yields no extra roots (the Steam install
/// root itself remains a library).
fn parse_vdf_library_roots(vdf_path: &Path) -> Vec<PathBuf> {
    let Ok(text) = std::fs::read_to_string(vdf_path) else {
        return Vec::new();
    };
    let mut roots = Vec::new();
    for line in text.lines() {
        let trimmed = line.trim();
        let Some(rest) = trimmed.strip_prefix("\"path\"") else {
            continue;
        };
        let value = rest.trim();
        let value = value
            .strip_prefix('"')
            .and_then(|rest| rest.strip_suffix('"'))
            .unwrap_or(value);
        if value.is_empty() {
            continue;
        }
        roots.push(PathBuf::from(value.replace("\\\\", "\\")));
    }
    roots
}

fn tcp_reachable(probe: &str) -> bool {
    let Ok(addrs) = probe.to_socket_addrs() else {
        return false;
    };
    for address in addrs {
        if TcpStream::connect_timeout(&address, NETWORK_TIMEOUT).is_ok() {
            return true;
        }
    }
    false
}

/// `(free_bytes, total_bytes)` for the drive holding `path`. Windows uses the
/// kernel32 `GetDiskFreeSpaceExW` export directly — one well-understood call
/// instead of a new dependency (ORC-DEV-005).
#[cfg(windows)]
fn free_disk_bytes(path: &Path) -> Result<(u64, u64), Option<String>> {
    use std::os::windows::ffi::OsStrExt;

    #[link(name = "kernel32")]
    extern "system" {
        fn GetDiskFreeSpaceExW(
            lpDirectoryName: *const u16,
            lpFreeBytesAvailableToCaller: *mut u64,
            lpTotalNumberOfBytes: *mut u64,
            lpTotalNumberOfFreeBytes: *mut u64,
        ) -> i32;
    }

    let wide: Vec<u16> = path
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let mut free: u64 = 0;
    let mut total: u64 = 0;
    let mut reserved: u64 = 0;
    let ok = unsafe { GetDiskFreeSpaceExW(wide.as_ptr(), &mut free, &mut total, &mut reserved) };
    if ok == 0 {
        return Err(Some(error_codes::READ_FAILED.to_owned()));
    }
    Ok((free, total))
}

#[cfg(not(windows))]
fn free_disk_bytes(_path: &Path) -> Result<(u64, u64), Option<String>> {
    Err(Some(error_codes::UNSUPPORTED_PLATFORM.to_owned()))
}
