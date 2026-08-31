//! Tool discovery engine (E-TOOLS smoke): a registration table drives
//! read-only discovery of community tools — installation state and versions
//! only. Calibration, input emulation and face tracking functionality stays
//! out of VUA; the catalog honestly reports what the user has and where the
//! tool's data goes (ToolCard 四要素, v0.3.3 §8.1).
//!
//! Registry facts supplied by the product owner (2026-08-30):
//! - OpenVR-SpaceCalibrator: official builds on GitHub; players commonly run
//!   community continuous-calibration builds, which are portable single
//!   executables that may live anywhere (e.g. the desktop). v0 probes the
//!   SteamVR driver folder for driver-style installs; portable builds are
//!   only detected when their folder is added to the search roots.
//! - VRCFaceTracking: latest releases ship via Steam (app 3329480); the
//!   project was formerly fully open source.
//! - OpenVR-InputEmulator: long-unmaintained but still-working SteamVR
//!   plugin by matzman666.
//! - vrc-get: CLI probed through the process runner (same discipline as the
//!   environment engine).
//!
//! # 中文逐段讲解（E-TOOLS 审阅）
//!
//! 工具页的引擎半边 = "登记表 + 探针"。登记表 `TOOL_REGISTRY` 是静态的
//! （编译期固定）：每条登记带 ToolCard 四要素（purpose 解决什么问题 /
//! dataDestination 数据去哪 / maintainer 谁维护 / installed 是否已装），
//! 外加 homepage（"打开主页"走系统浏览器）和 category（前端分组参考）。
//! 登记表之外的东西**永远不会出现**——没有"扫描你电脑里装了什么"这回事。
//!
//! 探针三种：`Directory`/`File`（在某类根下看目录/文件在不在——
//! InputEmulator 看 SteamVR drivers 目录、VRCFaceTracking 看 Steam 库目录）、
//! `Command`（跑 `--version` 探 CLI，如 vrc-get——失败即"未安装"，
//! 不是检测错误）。根全部来自 `ToolsRoots`（可注入）；特别注意
//! `Extra` 根：SpaceCalibrator 社区版是绿色单文件、玩家放哪的都有，
//! 引擎**只在用户指定的文件夹**里找，绝不默认扫描桌面/下载目录——
//! 这条纪律有测试钉死（`no default scan roots` 断言）。
//!
//! 探测结果只会让 `installed` 变 true/false：探测失败（二进制不在、
//! 超时）都是确定性的"未发现"，与 E-ENV 的"未安装不是错误"同一条纪律。
//! 命中路径和版本号进 `facts`（工程视图），SpaceCalibrator 卡片上额外
//! 带一条 portableNote 说明社区版的探测边界。

use crate::process::{ProcessRunner, ProcessSpec};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

const PROBE_TIMEOUT: Duration = Duration::from_secs(20);
const OUTPUT_LIMIT: usize = 64 * 1024;

/// Where a probe looks. Roots are injected so tests never touch this machine.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProbeRoot {
    /// `<steam library>/steamapps/common` roots supplied by the caller.
    SteamCommon,
    /// `<steam library>/steamapps/common/SteamVR/drivers` derived from the
    /// Steam common roots.
    SteamVrDrivers,
    /// User-data root (e.g. `%LOCALAPPDATA%`).
    LocalAppData,
    /// Extra search roots supplied by the caller (settings-provided portable
    /// tool locations); never defaults to scanning user folders.
    Extra,
}

#[derive(Debug, Clone)]
pub enum ToolProbe {
    /// A directory whose existence marks the tool installed.
    Directory {
        root: ProbeRoot,
        relative: &'static str,
    },
    /// A file whose existence marks the tool installed.
    File {
        root: ProbeRoot,
        relative: &'static str,
    },
    /// A CLI probed through the process runner (`--version`).
    Command { executable: &'static str },
}

/// One registered tool. Static data payload — the frontend renders these
/// strings directly (ToolCard 四要素).
#[derive(Debug, Clone)]
pub struct ToolRegistration {
    pub id: &'static str,
    pub name: &'static str,
    pub purpose: &'static str,
    pub data_destination: &'static str,
    pub maintainer: &'static str,
    pub homepage: &'static str,
    pub category: &'static str,
    pub probes: &'static [ToolProbe],
}

/// The registration table. New tools join here with their engine slice;
/// nothing outside the registry is ever reported (验收: 未登记工具不出现).
pub const TOOL_REGISTRY: &[ToolRegistration] = &[
    ToolRegistration {
        id: "openvr-space-calibrator",
        name: "OpenVR-SpaceCalibrator",
        purpose:
            "把头显与 tracker 的空间原点对齐；混合追踪（如 Vive Tracker + 其他品牌头显）校准必备",
        data_destination: "本地运行；校准结果保存在本机 SteamVR 配置中，不联网上传",
        maintainer: "pushrax（原版）+ 社区持续校准版（如 bd_+af 等构建）",
        homepage: "https://github.com/pushrax/OpenVR-SpaceCalibrator",
        category: "calibration",
        probes: &[
            ToolProbe::Directory {
                root: ProbeRoot::SteamVrDrivers,
                relative: "openvr_spacecalibrator",
            },
            // Community builds are portable single executables; they are
            // found only in user-designated search roots, never by scanning.
            ToolProbe::File {
                root: ProbeRoot::Extra,
                relative: "OpenVR-SpaceCalibrator.exe",
            },
        ],
    },
    ToolRegistration {
        id: "vrcface-tracking",
        name: "VRCFaceTracking",
        purpose: "摄像头/眼动面捕，把表情实时驱动到 VRChat Avatar",
        data_destination: "面捕画面本机处理；表情参数经 OSC 直接送入 VRChat，不经过 VUA",
        maintainer: "VRCFaceTracking 团队（最新版本经 Steam 发行）",
        homepage: "https://store.steampowered.com/app/3329480/VRCFaceTracking/",
        category: "face-tracking",
        probes: &[ToolProbe::Directory {
            root: ProbeRoot::SteamCommon,
            relative: "VRCFaceTracking",
        }],
    },
    ToolRegistration {
        id: "openvr-input-emulator",
        name: "OpenVR-InputEmulator",
        purpose: "手柄输入模拟与绑定重映射（社区经典工具；长期未更新但仍可用）",
        data_destination: "本地 SteamVR 插件；不联网",
        maintainer: "matzman666（社区）",
        homepage: "https://github.com/matzman666/OpenVR-InputEmulator",
        category: "input",
        probes: &[ToolProbe::Directory {
            root: ProbeRoot::SteamVrDrivers,
            relative: "OpenVR-InputEmulator",
        }],
    },
    ToolRegistration {
        id: "vrc-get",
        name: "vrc-get（VPM 命令行）",
        purpose: "命令行管理 VPM 仓库、包与 Unity 项目；VUA 包管理引擎基于同一生态",
        data_destination: "本地运行；读写本机 VPM 仓库设置与项目清单",
        maintainer: "vrc-get 项目（anatawa12 等）",
        homepage: "https://github.com/vrc-get/vrc-get",
        category: "package-cli",
        probes: &[ToolProbe::Command {
            executable: "vrc-get",
        }],
    },
];

/// Injectable roots. Defaults target a standard Windows setup; tests
/// substitute synthetic trees.
#[derive(Debug, Clone)]
pub struct ToolsRoots {
    pub steam_common: Vec<PathBuf>,
    pub local_app_data: PathBuf,
    /// Caller-provided locations for portable single-file tools (e.g. a
    /// folder the user picked in settings). Empty by default — VUA never
    /// scans Desktop/Downloads on its own.
    pub extra_search_roots: Vec<PathBuf>,
}

impl Default for ToolsRoots {
    fn default() -> Self {
        let local_app_data = std::env::var("LOCALAPPDATA")
            .or_else(|_| {
                std::env::var("USERPROFILE")
                    .or_else(|_| std::env::var("HOME"))
                    .map(|profile| format!("{profile}\\AppData\\Local"))
            })
            .unwrap_or_default();
        Self {
            steam_common: vec![PathBuf::from(
                "C:\\Program Files (x86)\\Steam\\steamapps\\common",
            )],
            local_app_data: PathBuf::from(local_app_data),
            extra_search_roots: Vec::new(),
        }
    }
}

/// One discovered tool: a data payload rendered directly by the tools page.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCardV1 {
    pub schema_version: u8,
    pub id: String,
    pub name: String,
    /// 能解决什么问题（四要素之一）。
    pub purpose: String,
    pub installed: bool,
    /// 数据会发送到哪里（四要素之一）。
    pub data_destination: String,
    /// 由谁维护（四要素之一）。
    pub maintainer: String,
    /// "打开主页"的系统浏览器交接地址。
    pub homepage: String,
    pub category: String,
    /// 工程视图：版本、命中的路径、探测记录。
    pub facts: Value,
}

pub struct ToolsEngine {
    runner: Arc<dyn ProcessRunner>,
    roots: ToolsRoots,
}

impl ToolsEngine {
    pub fn new(runner: Arc<dyn ProcessRunner>, roots: ToolsRoots) -> Self {
        Self { runner, roots }
    }

    /// Read-only discovery pass over the registry, in registry order.
    pub fn inspect(&self) -> Vec<ToolCardV1> {
        TOOL_REGISTRY
            .iter()
            .map(|registration| self.check(registration))
            .collect()
    }

    fn check(&self, registration: &ToolRegistration) -> ToolCardV1 {
        let mut installed = false;
        let mut found_paths: Vec<String> = Vec::new();
        let mut version: Option<String> = None;
        let mut probed: Vec<Value> = Vec::new();

        for probe in registration.probes {
            match probe {
                ToolProbe::Directory { root, relative } | ToolProbe::File { root, relative } => {
                    let is_file = matches!(probe, ToolProbe::File { .. });
                    let mut hit = false;
                    for path in self.resolve_root(*root) {
                        let candidate = path.join(relative);
                        let exists = if is_file {
                            candidate.is_file()
                        } else {
                            candidate.is_dir()
                        };
                        probed.push(json!({
                            "kind": if is_file { "file" } else { "directory" },
                            "path": candidate.to_string_lossy(),
                            "exists": exists,
                        }));
                        if exists {
                            hit = true;
                            found_paths.push(candidate.to_string_lossy().into_owned());
                        }
                    }
                    installed = installed || hit;
                }
                ToolProbe::Command { executable } => {
                    let spec = ProcessSpec {
                        executable: PathBuf::from(executable),
                        args: vec!["--version".to_owned()],
                        working_dir: None,
                        timeout: PROBE_TIMEOUT,
                        output_limit: OUTPUT_LIMIT,
                        ..Default::default()
                    };
                    match self.runner.run(&spec) {
                        Ok(outcome) if outcome.success() => {
                            installed = true;
                            let line = outcome.stdout.lines().next().unwrap_or("").trim();
                            if !line.is_empty() {
                                version = Some(line.to_owned());
                            }
                            probed.push(json!({
                                "kind": "command",
                                "executable": executable,
                                "version": line,
                            }));
                        }
                        Ok(outcome) => {
                            probed.push(json!({
                                "kind": "command",
                                "executable": executable,
                                "exitCode": outcome.exit_code,
                                "timedOut": outcome.timed_out,
                            }));
                        }
                        Err(error) => {
                            // A missing binary is a normal finding, not a
                            // detection failure.
                            probed.push(json!({
                                "kind": "command",
                                "executable": executable,
                                "available": false,
                                "reason": error.to_string(),
                            }));
                        }
                    }
                }
            }
        }

        let mut facts = json!({
            "probed": probed,
            "foundPaths": found_paths,
        });
        if let Some(version) = &version {
            facts["version"] = json!(version);
        }
        if registration.id == "openvr-space-calibrator" {
            // Community builds are portable single executables; document the
            // detection boundary honestly on the card itself.
            facts["portableNote"] = json!(
                "社区持续校准版多为绿色单文件，可放在任意目录运行；未在探测根中找到不代表未安装"
            );
        }
        ToolCardV1 {
            schema_version: crate::ENVELOPE_SCHEMA_VERSION,
            id: registration.id.to_owned(),
            name: registration.name.to_owned(),
            purpose: registration.purpose.to_owned(),
            installed,
            data_destination: registration.data_destination.to_owned(),
            maintainer: registration.maintainer.to_owned(),
            homepage: registration.homepage.to_owned(),
            category: registration.category.to_owned(),
            facts,
        }
    }

    fn resolve_root(&self, root: ProbeRoot) -> Vec<PathBuf> {
        match root {
            ProbeRoot::SteamCommon => self.roots.steam_common.clone(),
            ProbeRoot::SteamVrDrivers => self
                .roots
                .steam_common
                .iter()
                .map(|common| common.join("SteamVR").join("drivers"))
                .collect(),
            ProbeRoot::LocalAppData => vec![self.roots.local_app_data.clone()],
            ProbeRoot::Extra => self.roots.extra_search_roots.clone(),
        }
    }
}

/// Convenience for tests and diagnostics.
pub fn registry_ids() -> Vec<&'static str> {
    TOOL_REGISTRY
        .iter()
        .map(|registration| registration.id)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn registry_covers_the_product_owner_supplied_tools() {
        assert_eq!(
            registry_ids(),
            vec![
                "openvr-space-calibrator",
                "vrcface-tracking",
                "openvr-input-emulator",
                "vrc-get",
            ]
        );
        // The ToolCard 四要素 must be non-empty for every entry.
        for registration in TOOL_REGISTRY {
            assert!(!registration.purpose.is_empty(), "{}", registration.id);
            assert!(
                !registration.data_destination.is_empty(),
                "{}",
                registration.id
            );
            assert!(!registration.maintainer.is_empty(), "{}", registration.id);
            assert!(
                registration.homepage.starts_with("https://"),
                "{}",
                registration.id
            );
        }
    }
}
