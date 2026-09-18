//! Migrated envelope candidates used by the transitional runtime and journal.
//!
//! `AppErrorV1`, `CommandAcceptedV1`, `TaskEventV1`, and the nine task states
//! preserve useful tested semantics from the earlier core. Their fixtures live
//! in `schemas/orchestrator/envelope-v1/`, but B1 explicitly classifies them as
//! input to the application contract rather than a frozen Gateway wire format.
//! The v0.1 Provider maps these values explicitly; Renderer code and persistence
//! never consume these Rust types directly.
//!
//! # 中文逐段讲解（E-S0 审阅）
//!
//! 本文件保留早期 Rust runtime 与过渡 journal 已验证的信封语义。它不是
//! TypeScript 前端、Gateway 与持久化三方共用的类型来源；B1 应用契约通过显式
//! DTO 映射吸收其中仍成立的错误、任务状态和 revision 行为。
//!
//!
//! `ErrorCategory` —— 错误的九大类（validation=用户输入不对、
//! conflict=状态冲突（比如两个人同时改）、permission=权限不够、
//! dependency=缺依赖、unavailable=功能没接上、timeout=超时、
//! cancelled=用户取消、external_failure=外部工具出错、internal=我们
//! 自己的 bug）。封闭枚举：想加第十类必须走契约修订，防止随手塞。
//! serde 的 snake_case 让 Rust 的 `ExternalFailure` 在 JSON 里变成
//! `external_failure`；Provider 映射会决定候选应用契约是否保留该值。
//!
//! `ParamValue` —— 一条本地化参数的值，只能是字符串/数字/布尔三种。
//! `#[serde(untagged)]` 的意思是：JSON 里来什么形状就按什么形状接住，
//! 不需要在 JSON 里写明"我是字符串"。这就是错误参数能跨语言传输的
//! 原因（ORC-ERR-001）。
//!
//! `AppErrorV1` —— 统一错误信封。设计要点：
//! `code` 是给程序/日志搜索用的稳定错误码（如 `vua.task.timeout`）；
//! `messageKey` + `params` 是给用户看的文案钥匙——Rust 端永远不拼
//! 用户文案，前端拿钥匙去四语言字符串表里查（业务代码零中文字面量）；
//! `recoverable`（能不能回到安全状态继续）和 `retryable`（能不能原样
//! 重试）分开，因为"可以回滚"不代表"重试会有不同结果"；
//! `correlationId` 串起一次操作在前后端、日志、事件里的所有痕迹；
//! `internal` 类错误绝不允许携带堆栈、SQL、完整路径、命令行——
//! 隐私纪律（ORC-ERR-004），敏感上下文只能进 `redactedContext`。
//! `schema_version` 固定为 1：将来字段破坏性变更时升版本，消费方
//! 看到不认识的版本就拒绝，而不是猜。
//!
//! `TaskState` —— 候选的九个任务状态。引擎内部阶段可以更细；B1 应用契约
//! 当前保留这九态行为，但不通过 Rust enum 直接向前端暴露。
//! `is_terminal()` 标出四个终态：终态之后任何转换都非法，这是
//! "先到终态者赢、不被超时看门狗覆盖"规则的判断依据。
//!
//! `TaskEventV1<P>` —— 过渡 runtime 的任务事件信封。`revision` 每个任务内
//! 单调递增；应用契约保留“发现跳号后重取权威快照”的语义，但不复用 journal
//! payload。`payload: P` 让 Rust 内部调用处保持定型。
//!
//! `CommandAcceptedV1` —— 一条"会被执行成任务"的命令被接受后返回的
//! 回执：taskId + 接受时的 revision + 初始状态。关键是它只在 journal
//! 落盘之后才发出去（写先于说，ORC-STA-006）。
//!
//! `tests/contracts.rs` 继续锁住迁移固定实例；正式跨语言契约由
//! `packages/contracts/src/application-contract.ts` 与 Provider 测试拥有。

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// Wire schema version of every envelope struct in this module.
pub const ENVELOPE_SCHEMA_VERSION: u8 = 1;

/// Stable error categories (ORC-ERR-001..005). The set is closed; new
/// categories require a contract revision.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCategory {
    Validation,
    Conflict,
    Permission,
    Dependency,
    Unavailable,
    Timeout,
    Cancelled,
    ExternalFailure,
    Internal,
}

/// A localized-parameter value: string, number or boolean (ORC-ERR-001).
///
/// 变体顺序有讲究：untagged 反序列化按声明顺序逐个尝试，`Flag(bool)` 放最前
/// 确保 JSON 的 `true` 不会被当作数字 1.0 抢走。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ParamValue {
    Flag(bool),
    Number(f64),
    Text(String),
}

/// Unified user-facing error envelope (ORC-ERR-001..005).
///
/// `code` is stable and searchable; user-facing text goes through
/// `messageKey` + `params`. `internal` errors never expose stacks, SQL,
/// full paths or command lines — only `correlationId` and redacted context.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppErrorV1 {
    pub schema_version: u8,
    pub code: String,
    pub category: ErrorCategory,
    pub message_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<BTreeMap<String, ParamValue>>,
    pub recoverable: bool,
    pub retryable: bool,
    pub correlation_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub field_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub redacted_context: Option<BTreeMap<String, ParamValue>>,
}

impl AppErrorV1 {
    /// Builds a minimal error with a fresh correlation id.
    #[must_use]
    pub fn new(
        code: impl Into<String>,
        category: ErrorCategory,
        message_key: impl Into<String>,
        correlation_id: impl Into<String>,
    ) -> Self {
        Self {
            schema_version: ENVELOPE_SCHEMA_VERSION,
            code: code.into(),
            category,
            message_key: message_key.into(),
            params: None,
            recoverable: false,
            retryable: false,
            correlation_id: correlation_id.into(),
            field_path: None,
            redacted_context: None,
        }
    }

    #[must_use]
    pub fn with_recoverable(mut self, recoverable: bool) -> Self {
        self.recoverable = recoverable;
        self
    }

    #[must_use]
    pub fn with_retryable(mut self, retryable: bool) -> Self {
        self.retryable = retryable;
        self
    }

    #[must_use]
    pub fn with_param(mut self, key: impl Into<String>, value: ParamValue) -> Self {
        self.params
            .get_or_insert_with(BTreeMap::new)
            .insert(key.into(), value);
        self
    }
}

/// The nine outward task states (ORC §7.2). Internal workflow stages map onto
/// these; nothing outside the runtime observes finer-grained stages.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskState {
    Queued,
    Preparing,
    Running,
    WaitingForInput,
    Paused,
    Succeeded,
    SucceededWithWarnings,
    Failed,
    Cancelled,
}

impl TaskState {
    /// Terminal states accept no further transitions (ORC-WF-007).
    #[must_use]
    pub fn is_terminal(self) -> bool {
        matches!(
            self,
            Self::Succeeded | Self::SucceededWithWarnings | Self::Failed | Self::Cancelled
        )
    }
}

impl std::fmt::Display for TaskState {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = serde_json::to_value(self)
            .ok()
            .and_then(|value| value.as_str().map(str::to_owned))
            .unwrap_or_else(|| "unknown".into());
        formatter.write_str(&name)
    }
}

/// Returned by a command that will run as a task. Emitted only after the
/// journal has durably recorded the acceptance (ORC-IPC-008, ORC-STA-006).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandAcceptedV1 {
    pub schema_version: u8,
    pub task_id: String,
    pub accepted_revision: u64,
    pub initial_state: TaskState,
}

/// Low-frequency task lifecycle event (ORC-IPC-003, ORC-STA-003..005).
///
/// `revision` is monotonic per task; a gap, reorder or unknown schema version
/// forces consumers to re-query a full snapshot. `payload` is typed at each
/// usage site; the envelope itself is versioned.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskEventV1<P = serde_json::Value> {
    pub schema_version: u8,
    pub task_id: String,
    pub revision: u64,
    /// RFC 3339 timestamp produced by the runtime clock.
    pub occurred_at: String,
    /// Correlates this event with the command, task logs and diagnostics that
    /// produced it.
    pub correlation_id: String,
    pub kind: TaskEventKind,
    pub state: TaskState,
    pub payload: P,
}

/// Closed set of task event kinds for the minimal runtime.
///
/// `PersistenceFailed` is the one kind that is never persisted: it reports
/// in-session that a mutation could not be committed (journal/SQLite write
/// failure) and the task is frozen awaiting inspection. It exists so the
/// frozen condition is visible as a failure at the moment it happens
/// (honesty discipline #2) instead of only surfacing as `inspect_required`
/// after the next restart.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskEventKind {
    Accepted,
    StateChanged,
    Progress,
    CancelRequested,
    Completed,
    PersistenceFailed,
}
