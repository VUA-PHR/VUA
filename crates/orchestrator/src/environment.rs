//! Read-only environment detection (E-ENV smoke, O4 `inspect_environment`).
//!
//! Every check is a targeted observation of a configured, well-known root —
//! never a scan, never a write (ORC-WF-001: Inspect is read-only by type and
//! by test). Detection output is the data payload the frontend
//! `EnvironmentPort` renders directly: `title`/`description` are player
//! language, `facts` carries the engineering view. A machine without a
//! component yields a deterministic "missing" result, never a bubbled-up
//! error (ORC-ERR-005: every failure names the next step).
//!
//! # 中文逐段讲解（E-ENV 审阅）
//!
//! 环境检测引擎回答一个问题："这台机器现在能不能玩/能不能创作？"
//! 七个检查分两个辖区（对齐前端 DeployerView 的 play/create 分区）：
//!
//! play 辖区 —— `check_vrchat`（在注入的 Steam 库根下定点看
//! `VRChat/VRChat.exe` 在不在）、`check_steamvr`（`SteamVR` 目录；缺失是
//! warning 不是 error，桌面玩家不需要它——这个判断只有引擎能下，前端
//! 只认三色结论）、`check_network`（对 `vrchat.com:443` 做 TCP 连接探测，
//! 能连上就行，不发请求不登录）。
//!
//! create 辖区 —— `check_unity_hub`（默认安装路径定点探测）、
//! `check_unity_editors`（枚举 Unity Hub 的编辑器目录：目录名解析出版本号
//! `2022.3.22f1`，必须含 `Editor` 子目录，垃圾目录名跳过，按版本新到旧
//! 排序；根目录打不开是"检测失败"带 `read_failed` 码，与"没装编辑器"
//! 严格区分）、`check_vpm_cli`（经 ProcessRunner 跑 `--version`，复用
//! E-PKG 的进程纪律；二进制不在=确定未装，超时=检测失败带码）、
//! `check_disk_space`（kernel32 的 `GetDiskFreeSpaceExW` 直接 FFI，不引
//! 依赖；阈值判断属于引擎：不足 10GiB error、不足 30GiB warning，前端
//! 不做词法猜测）。
//!
//! 数据形状 `EnvironmentCheckItemV1` 就是前端 CheckItem 的超集：
//! `id`（稳定检查 ID，修复计划将来按它索引）+ `zone` + `title`/
//! `description`（玩家语言数据负载，中文直接由引擎给出，前端查表渲染） +
//! `status`（三色）+ `error_code`（只有"检测本身失败"才填；"没装"是
//! 正常结论不带码）+ `facts`（工程视图：路径、版本、字节数、探测记录）。
//!
//! 两个结构级要点：`EnvironmentRoots` 把所有探测路径做成可注入——测试
//! 全跑在合成目录树上，不依赖测试机的真实安装；只读性有测试证明
//! （检测前后对观察目标做全树指纹比对，一个字节都不许变）。

use crate::process::{ProcessRunner, ProcessSpec};
use crate::time::Clock;
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

/// Deployer zones, mirroring the frontend `CheckZone` (v0.4.0 §2.1).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Zone {
    Play,
    Create,
}

/// The three renderer states of a check (frontend `CheckStatus`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CheckStatusV1 {
    Ok,
    Warning,
    Error,
}

/// One check result: a data payload rendered by the deployer cards.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentCheckItemV1 {
    pub schema_version: u8,
    /// Stable check id, e.g. `vrchat`, `unity_editors` (fix plans key on it).
    pub id: String,
    pub zone: Zone,
    pub title: String,
    pub status: CheckStatusV1,
    pub description: String,
    /// Set when the *detection itself* failed; a missing component does not
    /// set this — that is a normal finding (验收: 无 VRChat 机器返回确定
    /// "未安装"而非错误).
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

/// Injectable well-known roots. Defaults target a standard Windows install;
/// tests substitute synthetic trees, so no test depends on this machine.
#[derive(Debug, Clone)]
pub struct EnvironmentRoots {
    /// Steam library roots; games live under `<root>/<AppName>`.
    pub steam_common: Vec<PathBuf>,
    /// `%USERPROFILE%\AppData\LocalLow` on Windows.
    pub local_low: PathBuf,
    pub unity_hub_exe: PathBuf,
    /// Unity Hub's per-version editor folders.
    pub unity_editors_root: PathBuf,
    /// Fixed vrc-get identity probed through the process runner.
    pub vrc_get_executable: String,
    /// Drive whose free space is reported (VUA data root).
    pub disk_target: PathBuf,
    /// Free-space thresholds in GiB (conclusions belong to the data source,
    /// not the renderer).
    pub disk_warning_gib: f64,
    pub disk_error_gib: f64,
    /// `host:port` TCP probes for plain reachability.
    pub network_probes: Vec<String>,
}

impl Default for EnvironmentRoots {
    fn default() -> Self {
        let user_profile = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_default();
        let local_app_data = std::env::var("LOCALAPPDATA")
            .unwrap_or_else(|_| format!("{user_profile}\\AppData\\Local"));
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
            disk_warning_gib: 30.0,
            disk_error_gib: 10.0,
            network_probes: vec!["vrchat.com:443".to_owned()],
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

    /// Read-only snapshot of one zone (frontend `runCheck(zone)` payload).
    pub fn inspect_zone(&self, zone: Zone) -> Vec<EnvironmentCheckItemV1> {
        match zone {
            Zone::Play => vec![
                self.check_vrchat(),
                self.check_steamvr(),
                self.check_network(),
            ],
            Zone::Create => vec![
                self.check_unity_hub(),
                self.check_unity_editors(),
                self.check_vpm_cli(),
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

    // --- play zone ---

    fn check_vrchat(&self) -> EnvironmentCheckItemV1 {
        for root in &self.roots.steam_common {
            let exe = root.join("VRChat").join("VRChat.exe");
            if exe.is_file() {
                return item(
                    "vrchat",
                    Zone::Play,
                    "VRChat 本体",
                    CheckStatusV1::Ok,
                    "已找到 VRChat 安装".to_owned(),
                    None,
                    json!({ "exe": exe.to_string_lossy() }),
                );
            }
        }
        item(
            "vrchat",
            Zone::Play,
            "VRChat 本体",
            CheckStatusV1::Error,
            "未找到 VRChat；请先通过 Steam 安装 VRChat".to_owned(),
            None,
            json!({ "searchedRoots": roots_display(&self.roots.steam_common) }),
        )
    }

    fn check_steamvr(&self) -> EnvironmentCheckItemV1 {
        for root in &self.roots.steam_common {
            let install = root.join("SteamVR");
            if install.is_dir() {
                return item(
                    "steamvr",
                    Zone::Play,
                    "SteamVR",
                    CheckStatusV1::Ok,
                    "已找到 SteamVR".to_owned(),
                    None,
                    json!({ "root": install.to_string_lossy() }),
                );
            }
        }
        // SteamVR is only needed for VR play; a desktop player is fine
        // without it, so absence is a warning, not a blocker.
        item(
            "steamvr",
            Zone::Play,
            "SteamVR",
            CheckStatusV1::Warning,
            "未找到 SteamVR；仅桌面模式游玩时无需安装".to_owned(),
            None,
            json!({ "searchedRoots": roots_display(&self.roots.steam_common) }),
        )
    }

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
        if reachable.is_empty() {
            return item(
                "network",
                Zone::Play,
                "网络连接",
                CheckStatusV1::Error,
                "无法连接 VRChat 服务器；请检查网络后重试".to_owned(),
                None,
                json!({ "reachable": reachable, "unreachable": unreachable }),
            );
        }
        item(
            "network",
            Zone::Play,
            "网络连接",
            CheckStatusV1::Ok,
            "网络连接正常".to_owned(),
            None,
            json!({ "reachable": reachable, "unreachable": unreachable }),
        )
    }

    // --- create zone ---

    fn check_unity_hub(&self) -> EnvironmentCheckItemV1 {
        let exe = &self.roots.unity_hub_exe;
        match std::fs::metadata(exe) {
            Ok(metadata) if metadata.is_file() => item(
                "unity_hub",
                Zone::Create,
                "Unity Hub",
                CheckStatusV1::Ok,
                "已找到 Unity Hub".to_owned(),
                None,
                json!({ "exe": exe.to_string_lossy() }),
            ),
            Ok(_) => item(
                "unity_hub",
                Zone::Create,
                "Unity Hub",
                CheckStatusV1::Error,
                "Unity Hub 路径异常；请重新安装 Unity Hub".to_owned(),
                None,
                json!({ "exe": exe.to_string_lossy() }),
            ),
            Err(_) => item(
                "unity_hub",
                Zone::Create,
                "Unity Hub",
                CheckStatusV1::Error,
                "未找到 Unity Hub；请先安装 Unity Hub".to_owned(),
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
                    "Unity 编辑器",
                    CheckStatusV1::Error,
                    "未安装任何 Unity 编辑器；请通过 Unity Hub 安装 2022.3".to_owned(),
                    None,
                    json!({ "root": root_display }),
                );
            }
            Err(error) => {
                return item(
                    "unity_editors",
                    Zone::Create,
                    "Unity 编辑器",
                    CheckStatusV1::Error,
                    "Unity 编辑器目录无法读取；请检查权限后重试".to_owned(),
                    Some(crate::environment::error_codes::READ_FAILED.to_owned()),
                    json!({ "root": root_display, "reason": error.to_string() }),
                );
            }
        };
        let mut editors: Vec<(EditorVersion, PathBuf)> = Vec::new();
        for entry in read_dir.flatten() {
            let path = entry.path();
            if !path.is_dir() || !path.join("Editor").is_dir() {
                continue;
            }
            if let Some(version) = parse_editor_version(&entry.file_name().to_string_lossy()) {
                editors.push((version, path));
            }
        }
        if editors.is_empty() {
            return item(
                "unity_editors",
                Zone::Create,
                "Unity 编辑器",
                CheckStatusV1::Error,
                "未安装任何 Unity 编辑器；请通过 Unity Hub 安装 2022.3".to_owned(),
                None,
                json!({ "root": root_display }),
            );
        }
        editors.sort_by(|left, right| {
            let left = (left.0.major, left.0.minor, left.0.patch);
            let right = (right.0.major, right.0.minor, right.0.patch);
            right.cmp(&left)
        });
        let listed: Vec<Value> = editors
            .iter()
            .map(|(version, path)| {
                json!({ "version": version.display, "path": path.to_string_lossy() })
            })
            .collect();
        item(
            "unity_editors",
            Zone::Create,
            "Unity 编辑器",
            CheckStatusV1::Ok,
            format!("已安装 {} 个 Unity 编辑器", editors.len()),
            None,
            json!({ "root": root_display, "editors": listed }),
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
                    "VPM 命令行 (vrc-get)",
                    CheckStatusV1::Ok,
                    format!("vrc-get 可用（{version}）"),
                    None,
                    json!({ "version": version, "exe": exe }),
                )
            }
            Ok(outcome) if outcome.timed_out => item(
                "vpm_cli",
                Zone::Create,
                "VPM 命令行 (vrc-get)",
                CheckStatusV1::Error,
                "vrc-get 探测超时；请稍后重试".to_owned(),
                Some(error_codes::PROBE_FAILED.to_owned()),
                json!({ "exe": exe }),
            ),
            Ok(outcome) => item(
                "vpm_cli",
                Zone::Create,
                "VPM 命令行 (vrc-get)",
                CheckStatusV1::Error,
                "未找到可用的 vrc-get；将在环境部署时提供安装引导".to_owned(),
                None,
                json!({ "exe": exe, "exitCode": outcome.exit_code }),
            ),
            // A missing binary is a normal finding, not a detection failure
            // (验收: 无 vrc-get 机器返回确定"未安装").
            Err(_) => item(
                "vpm_cli",
                Zone::Create,
                "VPM 命令行 (vrc-get)",
                CheckStatusV1::Error,
                "未找到可用的 vrc-get；将在环境部署时提供安装引导".to_owned(),
                None,
                json!({ "exe": exe }),
            ),
        }
    }

    fn check_disk_space(&self) -> EnvironmentCheckItemV1 {
        let target = self.roots.disk_target.to_string_lossy().into_owned();
        match free_disk_bytes(&self.roots.disk_target) {
            Ok((free, total)) => {
                let free_gib = free as f64 / (1024.0 * 1024.0 * 1024.0);
                let (status, description) = if free_gib < self.roots.disk_error_gib {
                    (
                        CheckStatusV1::Error,
                        format!(
                            "可用空间不足 {:.0} GiB；Avatar 项目至少需要 {:.0} GiB",
                            free_gib, self.roots.disk_error_gib
                        ),
                    )
                } else if free_gib < self.roots.disk_warning_gib {
                    (
                        CheckStatusV1::Warning,
                        format!(
                            "可用空间偏少（{:.0} GiB）；建议清理至 {:.0} GiB 以上",
                            free_gib, self.roots.disk_warning_gib
                        ),
                    )
                } else {
                    (CheckStatusV1::Ok, format!("可用空间 {:.0} GiB", free_gib))
                };
                item(
                    "disk_space",
                    Zone::Create,
                    "磁盘空间",
                    status,
                    description,
                    None,
                    json!({
                        "target": target,
                        "freeBytes": free,
                        "totalBytes": total,
                    }),
                )
            }
            Err(code) => item(
                "disk_space",
                Zone::Create,
                "磁盘空间",
                CheckStatusV1::Error,
                "无法读取磁盘空间；请检查目标磁盘".to_owned(),
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
    title: &str,
    status: CheckStatusV1,
    description: String,
    error_code: Option<String>,
    facts: Value,
) -> EnvironmentCheckItemV1 {
    EnvironmentCheckItemV1 {
        schema_version: crate::ENVELOPE_SCHEMA_VERSION,
        id: id.to_owned(),
        zone,
        title: title.to_owned(),
        status,
        description,
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

struct EditorVersion {
    display: String,
    major: i64,
    minor: i64,
    patch: i64,
}

/// `2022.3.22f1` → display "2022.3.22f1", sort key (2022, 3, 22). Directory
/// names that do not look like an editor version are ignored.
fn parse_editor_version(name: &str) -> Option<EditorVersion> {
    let mut parts = name.split('.');
    let major = parts.next()?.parse::<i64>().ok()?;
    let minor = parts.next()?.parse::<i64>().ok()?;
    let rest = parts.next()?;
    let patch_digits: String = rest
        .chars()
        .take_while(|character| character.is_ascii_digit())
        .collect();
    let patch = patch_digits.parse::<i64>().ok()?;
    Some(EditorVersion {
        display: name.to_owned(),
        major,
        minor,
        patch,
    })
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
