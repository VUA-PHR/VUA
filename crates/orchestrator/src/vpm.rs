//! VPM package engine (E-PKG smoke): fixed vrc-get discovery, read-only
//! planning, hash-bound confirmation, verified snapshots, bounded process
//! execution, manifest verification and rollback. The `vrc-get` invocation is
//! a single narrow function so the engine can later move onto the vrc-get
//! library without touching call sites (research: CLI is not the long-term
//! runtime dependency).
//!
//! # 中文逐段讲解（E-PKG 审阅）
//!
//! 这是第一个走完整"统一生命周期"的引擎：计划 → 确认 → 快照 → 执行 →
//! 验证 → journal。每一步都对着 ORC 需求编号，审阅时可以逐条对照。
//!
//!
//! `discover()` —— 开机自检：对固定路径的 vrc-get 跑一次 `--version`。
//! 探测失败（二进制不在/退出码非 0/超时）→ 引擎根本不构造，返回
//! `unavailable` 类错误——**半好使的引擎不存在**（ORC-ADP-002/007）。
//! 版本号从输出第一行截取，登记进 capability。
//!
//! `plan_install()` —— 纯只读（ORC-WF-001）。做四件事：
//! 校验输入：包 ID 只允许 `[A-Za-z0-9._-]`、显式拒绝 `..`；版本号同理
//! ——**在计划阶段就拒绝注入尝试**，后面的执行根本见不到恶意串
//! （有测试断言此时 runner 零调用）；
//! 读 `vpm-manifest.json`：原始字节做 FNV-1a 指纹（项目漂移检测的
//! 基准），解析出"该包当前装没装、装的什么版本"；
//! 判定 noop：请求的版本已装 → 计划就是一步"确认已装"，不做任何
//! 变更（ORC-WF-011 幂等）；
//! 生成有序步骤（快照/安装/核对）并用计划内容做哈希 → planId =
//! `plan-<hash>`（内容寻址：同样输入必得同样计划，测试可断言）。
//!
//! `confirm()` —— **从计划内容重新计算哈希**再比对。只比对传入的
//! 哈希字段拦不住篡改（测试证明过：改了内容带着原哈希来，一样要拦）。
//! 确认记录携带确认时间，形成 ORC-WF-003 的绑定。
//!
//! `execute()` 的五道门，顺序不可换——
//! 第一道 noop：已装同版本的计划直接返回，零进程调用；
//! 第二道漂移门：重读 manifest 算指纹，与计划时不符即 `Conflict`
//! 错误（确认后项目被人改过 = 旧确认作废，ORC-WF-004）；
//! 第三道快照门：`create_verified` 对 Packages + manifest 做验证过的
//! 范围快照——快照失败不进执行（ORC-WF-005）；
//! 第四道执行：经 ProcessRunner 跑 vrc-get install（类型化参数 + 超时），
//! 超时得 `install_timeout`（可重试），非零退出得 `install_failed`
//! 带退出码；
//! 第五道领域级核对（ORC-WF-009）：vrc-get 说成功不算数——重读
//! manifest，包真的出现在 dependencies 里且版本对得上才算数，
//! 否则 `verify_failed`（快照还在，可回滚）。
//!
//! `rollback()` —— 用 E-PKG 的 `restore_verified` 恢复快照：先核对
//! manifest 再动项目，当前状态隔离进 `.vua/recovery/`。
//!
//! `install_invocation()` —— **vrc-get CLI 的唯一接缝**。调研结论是
//! CLI 终将换成 vrc-get 库调用（交互式 CLI 不适合做子进程），届时
//! 只改这一个函数，引擎与测试全不动。`-p` 项目 flag 的准确性在
//! 真实安装冒烟（`--ignored` 手动测试）里核实。
//!
//! `fnv1a_hex()` —— FNV-1a 64 位指纹：10 行、跨进程稳定、无依赖。
//! 它是"内容变化检测器"，不是密码学哈希——真正的 SHA-256 只在
//! 需要抗碰撞性的地方（Recipe digest）使用。

use crate::capability::{CapabilityReport, CapabilitySource, CapabilityState};
use crate::contracts::{AppErrorV1, ErrorCategory, ParamValue};
use crate::filesystem::FileSystemSnapshotStore;
use crate::process::{ProcessRunner, ProcessSpec};
use crate::time::Clock;
use crate::SnapshotRef;
use crate::TaskContext;
use serde_json::{json, Value};
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

/// Stable vpm engine error codes (ORC-ERR-001). Owned by this module.
pub mod error_codes {
    pub const EXECUTABLE_MISSING: &str = "vua.vpm.executable_missing";
    pub const PACKAGE_INVALID: &str = "vua.vpm.package_invalid";
    pub const MANIFEST_INVALID: &str = "vua.vpm.manifest_invalid";
    pub const MANIFEST_DRIFT: &str = "vua.vpm.manifest_drift";
    pub const PLAN_HASH_MISMATCH: &str = "vua.vpm.plan_hash_mismatch";
    pub const SNAPSHOT_FAILED: &str = "vua.vpm.snapshot_failed";
    pub const INSTALL_FAILED: &str = "vua.vpm.install_failed";
    pub const INSTALL_TIMEOUT: &str = "vua.vpm.install_timeout";
    pub const VERIFY_FAILED: &str = "vua.vpm.verify_failed";
}

const DEFAULT_INSTALL_TIMEOUT: Duration = Duration::from_secs(600);
const DEFAULT_OUTPUT_LIMIT: usize = 256 * 1024;
const SNAPSHOT_SCOPES: [&str; 2] = ["Packages", "vpm-manifest.json"];

/// The vrc-get backend, bound to one fixed executable.
pub struct VpmEngine {
    runner: Arc<dyn ProcessRunner>,
    snapshots: FileSystemSnapshotStore,
    clock: Arc<dyn Clock>,
    executable: PathBuf,
    version: String,
    install_timeout: Duration,
    output_limit: usize,
}

impl std::fmt::Debug for VpmEngine {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("VpmEngine")
            .field("executable", &self.executable)
            .field("version", &self.version)
            .finish()
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct InstallRequest {
    pub project: crate::ProjectRef,
    pub package_id: String,
    /// `None` resolves to the latest version ("latest" semantics live at the
    /// engine, never in a shell-joined string).
    pub version: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PlanStepV1 {
    pub operation: String,
    pub description: String,
    pub mutates_project: bool,
    pub snapshot_scopes: Vec<String>,
}

/// The complete, serializable plan (ORC-WF-002 minimal content).
#[derive(Debug, Clone, PartialEq)]
pub struct InstallPlanV1 {
    pub plan_id: String,
    pub plan_hash: String,
    pub package_id: String,
    pub version: String,
    pub project_id: String,
    /// Absolute project root bound into the plan; a moved or renamed project
    /// invalidates the confirmation.
    pub project_root: String,
    /// FNV-1a of the raw `vpm-manifest.json` bytes at plan time; execution
    /// refuses to run when the live fingerprint differs (ORC-WF-004).
    pub project_fingerprint: String,
    /// True when the requested package+version is already installed: the
    /// plan is an explicit no-op instead of a silent re-install (ORC-WF-011).
    pub noop: bool,
    pub steps: Vec<PlanStepV1>,
}

/// Confirmation binds the exact plan hash; a tampered or stale hash is
/// rejected before anything runs (ORC-WF-003).
#[derive(Debug, Clone, PartialEq)]
pub struct InstallConfirmation {
    pub plan: InstallPlanV1,
    pub confirmed_at: String,
    pub correlation_id: String,
}

impl VpmEngine {
    /// Probes the fixed executable with `--version`; a failed probe produces
    /// an `unavailable` capability instead of a half-working engine
    /// (ORC-ADP-002, ORC-ADP-007).
    pub fn discover(
        runner: Arc<dyn ProcessRunner>,
        clock: Arc<dyn Clock>,
        executable: impl Into<PathBuf>,
    ) -> Result<Self, AppErrorV1> {
        let executable = executable.into();
        let spec = ProcessSpec {
            executable: executable.clone(),
            args: vec!["--version".to_owned()],
            working_dir: None,
            timeout: Duration::from_secs(30),
            output_limit: DEFAULT_OUTPUT_LIMIT,
            ..Default::default()
        };
        let outcome = runner.run(&spec).map_err(|error| {
            AppErrorV1::new(
                error_codes::EXECUTABLE_MISSING,
                ErrorCategory::Unavailable,
                "errors.vpm.executableMissing",
                "corr-vpm-discovery",
            )
            .with_param("reason", ParamValue::Text(error.to_string()))
        })?;
        if !outcome.success() {
            return Err(AppErrorV1::new(
                error_codes::EXECUTABLE_MISSING,
                ErrorCategory::Unavailable,
                "errors.vpm.executableMissing",
                "corr-vpm-discovery",
            )
            .with_param(
                "exitCode",
                ParamValue::Number(f64::from(outcome.exit_code.unwrap_or(-1))),
            ));
        }
        let version = outcome
            .stdout
            .lines()
            .next()
            .unwrap_or("unknown")
            .trim()
            .to_owned();
        Ok(Self {
            runner,
            snapshots: FileSystemSnapshotStore,
            clock,
            executable,
            version,
            install_timeout: DEFAULT_INSTALL_TIMEOUT,
            output_limit: DEFAULT_OUTPUT_LIMIT,
        })
    }

    pub fn version(&self) -> &str {
        &self.version
    }

    /// Read-only plan (ORC-WF-001): reads the project manifest, classifies
    /// the change and derives ordered steps. Never touches the project.
    pub fn plan_install(&self, request: &InstallRequest) -> Result<InstallPlanV1, AppErrorV1> {
        validate_package_id(&request.package_id)?;
        if let Some(version) = &request.version {
            validate_version(version)?;
        }
        let (raw, manifest) = read_manifest(&request.project.root)?;
        let correlation = "corr-vpm-plan";
        let fingerprint = fnv1a_hex(raw.as_bytes());
        let requested = request
            .version
            .clone()
            .unwrap_or_else(|| "latest".to_owned());
        let installed = installed_version(&manifest, &request.package_id);
        let noop = installed.as_deref() == Some(requested.as_str());
        let scope_list: Vec<String> = SNAPSHOT_SCOPES
            .iter()
            .map(|scope| scope.to_string())
            .collect();

        let steps = if noop {
            vec![PlanStepV1 {
                operation: "verify_manifest".to_owned(),
                description: "确认包已安装，无需重复操作".to_owned(),
                mutates_project: false,
                snapshot_scopes: Vec::new(),
            }]
        } else {
            vec![
                PlanStepV1 {
                    operation: "snapshot".to_owned(),
                    description: "为项目创建可回滚快照（Packages 与清单文件）".to_owned(),
                    mutates_project: false,
                    snapshot_scopes: scope_list.clone(),
                },
                PlanStepV1 {
                    operation: "vpm_install".to_owned(),
                    description: format!(
                        "通过 vrc-get 安装 {}（{}）",
                        request.package_id,
                        if request.version.is_some() {
                            requested.as_str()
                        } else {
                            "最新版本"
                        }
                    ),
                    mutates_project: true,
                    snapshot_scopes: Vec::new(),
                },
                PlanStepV1 {
                    operation: "verify_manifest".to_owned(),
                    description: "核对安装结果并确认项目清单一致".to_owned(),
                    mutates_project: false,
                    snapshot_scopes: Vec::new(),
                },
            ]
        };

        let mut plan = InstallPlanV1 {
            plan_id: String::new(),
            plan_hash: String::new(),
            package_id: request.package_id.clone(),
            version: requested,
            project_id: request.project.id.clone(),
            project_root: request.project.root.to_string_lossy().into_owned(),
            project_fingerprint: fingerprint,
            noop,
            steps,
        };
        let plan_bytes = serde_json::to_vec(&plan_content(&plan))
            .map_err(|error| internal_error(correlation, &error))?;
        let plan_hash = fnv1a_hex(&plan_bytes);
        plan.plan_hash = plan_hash.clone();
        plan.plan_id = format!("plan-{plan_hash}");
        Ok(plan)
    }

    /// Confirms an exact plan hash. The hash is recomputed from the plan
    /// content, so a tampered plan fails even when its recorded hash field is
    /// replayed (ORC-WF-003).
    pub fn confirm(
        &self,
        plan: &InstallPlanV1,
        presented_hash: &str,
    ) -> Result<InstallConfirmation, AppErrorV1> {
        let correlation = format!("corr-{}", plan.plan_id);
        let plan_bytes = serde_json::to_vec(&plan_content(plan))
            .map_err(|error| internal_error(&correlation, &error))?;
        let recomputed = fnv1a_hex(&plan_bytes);
        if presented_hash != recomputed || plan.plan_hash != recomputed {
            return Err(AppErrorV1::new(
                error_codes::PLAN_HASH_MISMATCH,
                ErrorCategory::Conflict,
                "errors.vpm.planHashMismatch",
                correlation,
            ));
        }
        Ok(InstallConfirmation {
            plan: plan.clone(),
            confirmed_at: self.clock.now_rfc3339(),
            correlation_id: correlation,
        })
    }

    /// Executes a confirmed plan: fingerprint re-check, verified snapshot,
    /// bounded process run, manifest verification. Returns the result payload
    /// that becomes the task's completion payload.
    pub fn execute(
        &self,
        confirmation: &InstallConfirmation,
        context: Option<&TaskContext>,
    ) -> Result<Value, AppErrorV1> {
        let plan = &confirmation.plan;
        let correlation = confirmation.correlation_id.clone();

        // Drift gate runs BEFORE the noop replay (Fix 6): a confirmed plan
        // whose premise no longer holds (the package was removed since) must
        // surface as drift, never as a fake idempotent success
        // (ORC-WF-004; recovery matrix: "确认后项目被修改 → 指纹冲突，不执行").
        let project_root = PathBuf::from(&plan.project_root);
        let (raw, _) = read_manifest(&project_root)?;
        let live_fingerprint = fnv1a_hex(raw.as_bytes());
        if live_fingerprint != plan.project_fingerprint {
            return Err(AppErrorV1::new(
                error_codes::MANIFEST_DRIFT,
                ErrorCategory::Conflict,
                "errors.vpm.manifestDrift",
                correlation.clone(),
            )
            .with_recoverable(true));
        }
        if plan.noop {
            return Ok(json!({
                "noop": true,
                "package": plan.package_id,
                "version": plan.version,
                "planId": plan.plan_id,
            }));
        }

        // Verified snapshot before any mutation (ORC-WF-005). The id carries
        // an attempt suffix (Fix 6): a failed attempt leaves its snapshot in
        // place for diagnosis, and a retry of the SAME plan must not collide
        // with it (AlreadyExists would make the plan permanently unrunnable).
        let attempt = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|value| value.as_nanos() % 1_000_000_000)
            .unwrap_or(0);
        let snapshot_id = format!("{}-snap-{}", plan.plan_id, attempt);
        let project = crate::ProjectRef {
            id: plan.project_id.clone(),
            root: project_root,
        };
        let verified = self
            .snapshots
            .create_verified(&project, &snapshot_id, &SNAPSHOT_SCOPES)
            .map_err(|error| {
                AppErrorV1::new(
                    error_codes::SNAPSHOT_FAILED,
                    ErrorCategory::ExternalFailure,
                    "errors.vpm.snapshotFailed",
                    correlation.clone(),
                )
                .with_param("reason", ParamValue::Text(error.to_string()))
            })?;
        let snapshot = verified.reference;
        if let Some(context) = context {
            context.emit_progress(json!({
                "step": "snapshot", "snapshotId": snapshot.id,
            }));
        }

        // Bounded process run through the runner port (ORC-ADP-001..003).
        let args = install_invocation(
            &plan.package_id,
            if plan.version == "latest" {
                None
            } else {
                Some(&plan.version)
            },
            &project.root,
        );
        let spec = ProcessSpec {
            executable: self.executable.clone(),
            args,
            working_dir: None,
            timeout: self.install_timeout,
            output_limit: self.output_limit,
            ..Default::default()
        };
        let outcome = self
            .runner
            .run(&spec)
            .map_err(|error| process_error(&correlation, error))?;
        if outcome.timed_out {
            return Err(AppErrorV1::new(
                error_codes::INSTALL_TIMEOUT,
                ErrorCategory::Timeout,
                "errors.vpm.installTimeout",
                correlation.clone(),
            )
            .with_recoverable(true)
            .with_retryable(true));
        }
        if !outcome.success() {
            return Err(AppErrorV1::new(
                error_codes::INSTALL_FAILED,
                ErrorCategory::ExternalFailure,
                "errors.vpm.installFailed",
                correlation.clone(),
            )
            .with_recoverable(true)
            .with_param(
                "exitCode",
                ParamValue::Number(f64::from(outcome.exit_code.unwrap_or(-1))),
            ));
        }

        // Domain-level verify: the manifest must now contain the package
        // (ORC-WF-009: a "successful" backend result still gets validated).
        let (_, manifest) = read_manifest(&project.root)?;
        let installed = installed_version(&manifest, &plan.package_id);
        let version_ok = match installed.as_deref() {
            None => false,
            Some(version) => plan.version == "latest" || version == plan.version,
        };
        if !version_ok {
            return Err(AppErrorV1::new(
                error_codes::VERIFY_FAILED,
                ErrorCategory::ExternalFailure,
                "errors.vpm.verifyFailed",
                correlation.clone(),
            )
            .with_recoverable(true)
            .with_param("package", ParamValue::Text(plan.package_id.clone())));
        }
        if let Some(context) = context {
            context.emit_progress(json!({
                "step": "verify", "installedVersion": installed,
            }));
        }

        Ok(json!({
            "noop": false,
            "package": plan.package_id,
            "version": installed,
            "planId": plan.plan_id,
            "snapshotId": snapshot.id,
        }))
    }

    /// Rollback path after a failed or drifted execution: restores the
    /// verified snapshot (recovery matrix: recover → validate recovery).
    pub fn rollback(
        &self,
        project: &crate::ProjectRef,
        snapshot: &SnapshotRef,
    ) -> Result<(), AppErrorV1> {
        self.snapshots
            .restore_verified(project, snapshot)
            .map_err(|error| {
                AppErrorV1::new(
                    error_codes::SNAPSHOT_FAILED,
                    ErrorCategory::ExternalFailure,
                    "errors.vpm.rollbackFailed",
                    "corr-vpm-rollback",
                )
                .with_param("reason", ParamValue::Text(error.to_string()))
            })
    }

    /// Capability source reporting the discovered engine as ready.
    pub fn capability_source(&self, name: &str) -> impl CapabilitySource {
        struct Source {
            name: String,
            version: String,
        }
        impl CapabilitySource for Source {
            fn report(&self) -> CapabilityReport {
                let _ = &self.version;
                CapabilityReport {
                    name: self.name.clone(),
                    state: CapabilityState::Ready,
                }
            }
        }
        Source {
            name: name.to_owned(),
            version: self.version.clone(),
        }
    }
}

// --- helpers ---

/// Canonical plan content used for hashing: everything except the id/hash
/// pair itself.
fn plan_content(plan: &InstallPlanV1) -> Value {
    json!({
        "packageId": plan.package_id,
        "version": plan.version,
        "projectId": plan.project_id,
        "projectRoot": plan.project_root,
        "projectFingerprint": plan.project_fingerprint,
        "noop": plan.noop,
        "steps": plan.steps.iter().map(|step| json!({
            "operation": step.operation,
            "description": step.description,
            "mutatesProject": step.mutates_project,
            "snapshotScopes": step.snapshot_scopes,
        })).collect::<Vec<_>>(),
    })
}

/// FNV-1a 64-bit, hex encoded. Stable across processes; content hashes move
/// to a proper algorithm with H-RECOVERY if cross-version stability of the
/// persisted plan store ever demands it.
pub fn fnv1a_hex(bytes: &[u8]) -> String {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in bytes {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{hash:016x}")
}

/// Reads `vpm-manifest.json` from a project root: (raw text, parsed value).
/// A missing manifest reads as an empty project (empty fingerprint), a
/// corrupt one is a hard validation error.
fn read_manifest(project_root: &Path) -> Result<(String, Value), AppErrorV1> {
    let path = project_root.join("vpm-manifest.json");
    match std::fs::read_to_string(&path) {
        Ok(text) => {
            let parsed: Value = serde_json::from_str(&text).map_err(|error| {
                AppErrorV1::new(
                    error_codes::MANIFEST_INVALID,
                    ErrorCategory::Validation,
                    "errors.vpm.manifestInvalid",
                    "corr-vpm-plan",
                )
                .with_param("reason", ParamValue::Text(error.to_string()))
            })?;
            Ok((text, parsed))
        }
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok((String::new(), Value::Null)),
        Err(error) => Err(AppErrorV1::new(
            error_codes::MANIFEST_INVALID,
            ErrorCategory::Permission,
            "errors.vpm.manifestUnreadable",
            "corr-vpm-plan",
        )
        .with_param("reason", ParamValue::Text(error.to_string()))),
    }
}

/// Installed version from `dependencies`; tolerates the object form
/// (`{"version": "1.2.3"}`) and the plain-string legacy form.
fn installed_version(manifest: &Value, package_id: &str) -> Option<String> {
    let dependencies = manifest.get("dependencies")?;
    let entry = dependencies.get(package_id)?;
    if let Some(version) = entry.get("version").and_then(Value::as_str) {
        return Some(version.to_owned());
    }
    entry.as_str().map(str::to_owned)
}

/// The single narrow vrc-get invocation (smoke shape; the exact project flag
/// is re-verified during the manual local smoke, and this function is the
/// only place to adjust).
fn install_invocation(package_id: &str, version: Option<&str>, project_root: &Path) -> Vec<String> {
    let mut args = vec!["install".to_owned(), package_id.to_owned()];
    if let Some(version) = version {
        args.push(version.to_owned());
    }
    args.push("-p".to_owned());
    args.push(project_root.to_string_lossy().into_owned());
    args
}

fn validate_package_id(value: &str) -> Result<(), AppErrorV1> {
    let valid = !value.is_empty()
        && !value.contains("..")
        && value.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '.' | '-' | '_')
        });
    if valid {
        Ok(())
    } else {
        Err(AppErrorV1::new(
            error_codes::PACKAGE_INVALID,
            ErrorCategory::Validation,
            "errors.vpm.packageInvalid",
            "corr-vpm-plan",
        )
        .with_param("package", ParamValue::Text(value.to_owned())))
    }
}

fn validate_version(value: &str) -> Result<(), AppErrorV1> {
    let valid = !value.is_empty()
        && value.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '.' | '-' | '+' | '_')
        });
    if valid {
        Ok(())
    } else {
        Err(AppErrorV1::new(
            error_codes::PACKAGE_INVALID,
            ErrorCategory::Validation,
            "errors.vpm.versionInvalid",
            "corr-vpm-plan",
        )
        .with_param("version", ParamValue::Text(value.to_owned())))
    }
}

fn process_error(correlation: &str, error: crate::process::ProcessError) -> AppErrorV1 {
    AppErrorV1::new(
        error_codes::INSTALL_FAILED,
        ErrorCategory::ExternalFailure,
        "errors.vpm.installFailed",
        correlation.to_owned(),
    )
    .with_recoverable(true)
    .with_param("reason", ParamValue::Text(error.to_string()))
}

fn internal_error(correlation: &str, error: &serde_json::Error) -> AppErrorV1 {
    AppErrorV1::new(
        "vua.vpm.internal",
        ErrorCategory::Internal,
        "errors.vpm.internal",
        correlation.to_owned(),
    )
    .with_param("reason", ParamValue::Text(error.to_string()))
}
