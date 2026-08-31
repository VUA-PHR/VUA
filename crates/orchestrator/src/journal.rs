//! Versioned append-only workflow journal (ORC-STO-004..005).
//!
//! The journal is the durability boundary of the runtime: a task is only
//! "accepted" after its acceptance entry is written and flushed. On restart,
//! [`recover_from_journal`] reconstructs per-task state and classifies
//! unfinished tasks. Unknown journal major versions stop automatic recovery
//! and require manual diagnosis instead of guessing.
//!
//! # 中文逐段讲解（E-S0 审阅）
//!
//! journal 是整个引擎的"黑匣子"：进程随时可能被杀（断电、崩溃、用户强退），
//! 落盘的每一行就是一句"发生过什么"。文件是 **JSONL**（一行一条 JSON），
//! 只追加、不修改——追加写天然抗中断：最坏情况是最后一行写了一半
//! （torn write），回放时当作损坏尾部忽略即可，前面的行完好无损。
//!
//!
//! `JournalEntryV1` —— 一行 = `{schemaVersion, seq, taskId, kind,
//! occurredAt, payload}`。`seq` 是**整个文件级**的单调序号（跨任务共享），
//! 重启后由运行时接续，保证回放顺序与追加顺序一致。`payloadKind` 是
//! tagged 枚举的判别字段——回放时遇到不认识的 payload 类型会**解析失败**
//! 而不是悄悄丢掉，宁可停机人工看也不猜测（ORC-TYP-006）。
//!
//! 四种 `JournalEntryKind`：
//! `Accepted`：任务被接受（含 CommandAcceptedV1 回执）。**先写这行，
//! 再告诉调用者"已接受"**——写不出来就不接受（ORC-STA-006 的落地）。
//! `StateChanged`：状态九态之间的每次迁移。
//! `CancelRequested`：用户请求取消（此刻任务还没停！取消是协作式，
//! 任务在安全边界自己退出后才写 Completed）。
//! `Completed`：终态，携带终态、错误（若有）和结果负载。
//!
//! `JournalSink` trait —— 抽象"往哪写"。生产实现 `JournalWriter`（文件），
//! 测试实现 `MemoryJournal`（内存 Vec）。运行时只认 trait，所以
//! "journal 写失败要拒绝命令"这类规则可以用一个两行的 Failing 假实现
//! 直接测出来。
//!
//! `JournalWriter::append` —— 每次追加都走 `write → flush →
//! sync_data`（fsync）。flush 只保证进了 OS 缓冲，sync_data 才保证落了
//! 盘——没有这一步，断电时"已接受"可能是谎言。慢（毫秒级）但只在任务
//! 生命周期事件时发生，频率极低，值得。
//!
//! `recover_from_journal` —— 重启后的回放器。逐行解析：
//! 遇到 `schemaVersion != 1` → 标记 `unknown_version` 并**停止**回放
//! （ORC-STO-005：跨大版本不猜）；
//! 遇到解析不了的行 → 标记 `corrupt_tail` 并停止（torn write，只有
//! 最后一行可能这样）；
//! 每个任务聚合出"最后已知状态 + 最后 revision + 是否请求过取消 +
//! 是否终态"，未到终态的任务分类为 `NeedsInspect`（重启前可能正在
//! 改项目，先重新检查再决定继续还是回滚）。
//! 注意：`Completed` 条目的 result 不参与回放聚合——恢复只需要
//! "到没到终态"，结果负载属于业务层。
//!
//! `index_map` —— 手写的"保持插入顺序的小 Map"。只为了回放时任务按
//! 首次出现顺序排列（前端显示稳定），为这 30 行不引一个依赖 crate。

use crate::contracts::{AppErrorV1, CommandAcceptedV1, TaskState};
use serde::{Deserialize, Serialize};
use std::fs::{File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// Current journal major version. Bumping it requires a migration note;
/// readers refuse automatic recovery across major versions.
pub const JOURNAL_SCHEMA_VERSION: u8 = 1;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum JournalEntryKind {
    Accepted,
    StateChanged,
    CancelRequested,
    Completed,
}

/// Payload carried by a journal entry, tagged so unknown payload kinds fail
/// loudly instead of silently coercing (ORC-TYP-006).
// Result/Completed 变体比 Accepted 大很多：Box 化会让 serde 形状多一层
// 包装，journal 是纯内部格式，保持扁平值类型更划算（审阅后裁定量产取舍）。
#[allow(clippy::large_enum_variant)]
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "payloadKind", rename_all = "snake_case")]
pub enum JournalPayload {
    Accepted {
        accepted: CommandAcceptedV1,
    },
    StateChanged {
        state: TaskState,
    },
    CancelRequested,
    Completed {
        state: TaskState,
        error: Option<AppErrorV1>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        result: Option<serde_json::Value>,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntryV1 {
    pub schema_version: u8,
    pub seq: u64,
    pub task_id: String,
    pub kind: JournalEntryKind,
    pub occurred_at: String,
    pub payload: JournalPayload,
}

/// Durability boundary of the runtime (ORC-STA-006): a task is only accepted
/// after its acceptance entry is durably recorded through this sink.
pub trait JournalSink: Send + Sync {
    fn append(&self, entry: &JournalEntryV1) -> Result<(), JournalError>;
    fn path(&self) -> Option<&Path>;
}

impl JournalSink for JournalWriter {
    fn append(&self, entry: &JournalEntryV1) -> Result<(), JournalError> {
        JournalWriter::append(self, entry)
    }

    fn path(&self) -> Option<&Path> {
        Some(&self.path)
    }
}

/// In-memory journal for tests and Gateway snapshot fixtures.
#[derive(Debug, Default)]
pub struct MemoryJournal {
    entries: Mutex<Vec<JournalEntryV1>>,
}

impl MemoryJournal {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn snapshot(&self) -> Vec<JournalEntryV1> {
        self.entries
            .lock()
            .expect("memory journal poisoned")
            .clone()
    }
}

impl JournalSink for MemoryJournal {
    fn append(&self, entry: &JournalEntryV1) -> Result<(), JournalError> {
        self.entries
            .lock()
            .expect("memory journal poisoned")
            .push(entry.clone());
        Ok(())
    }

    fn path(&self) -> Option<&Path> {
        None
    }
}

/// Append-only JSONL journal. Every write is flushed and fsynced before the
/// caller proceeds (ORC-STA-006).
pub struct JournalWriter {
    path: PathBuf,
    file: Mutex<File>,
}

#[derive(Debug)]
pub enum JournalError {
    Io(std::io::Error),
    Encode(serde_json::Error),
}

impl std::fmt::Display for JournalError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(error) => write!(formatter, "journal write failed: {error}"),
            Self::Encode(error) => write!(formatter, "journal encode failed: {error}"),
        }
    }
}

impl JournalWriter {
    /// Opens (or creates) the journal for appending, creating parent
    /// directories as needed.
    pub fn open(path: impl Into<PathBuf>) -> Result<Self, JournalError> {
        let path = path.into();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(JournalError::Io)?;
        }
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
            .map_err(JournalError::Io)?;
        Ok(Self {
            path,
            file: Mutex::new(file),
        })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Appends one entry and durably flushes it before returning.
    pub fn append(&self, entry: &JournalEntryV1) -> Result<(), JournalError> {
        // 一行 JSON + 换行符：JSONL 的追加单位，中途断电最坏只伤最后一行
        let mut line = serde_json::to_string(entry).map_err(JournalError::Encode)?;
        line.push('\n');
        {
            let mut file = self.file.lock().expect("journal writer poisoned");
            // 三连击：write（进用户缓冲）→ flush（进 OS）→ sync_data（落盘）。
            // 返回 Ok 即向调用者保证"这行断电也不会丢"。
            file.write_all(line.as_bytes()).map_err(JournalError::Io)?;
            file.flush().map_err(JournalError::Io)?;
            file.sync_data().map_err(JournalError::Io)?;
        }
        Ok(())
    }
}

/// What a recovered task requires after restart (O3 classification, minimal).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RecoveredDisposition {
    /// Reached a terminal state before the restart; nothing to do.
    Terminal,
    /// Was accepted but never reached a terminal state: re-Inspect before any
    /// further action (recovery matrix: "应用在可能变更时退出 → 先 Inspect").
    NeedsInspect,
}

#[derive(Debug, Clone, PartialEq)]
pub struct RecoveredTask {
    pub task_id: String,
    pub last_state: TaskState,
    pub last_revision: u64,
    pub cancel_requested: bool,
    pub disposition: RecoveredDisposition,
    pub error: Option<AppErrorV1>,
}

#[derive(Debug, Clone, PartialEq, Default)]
pub struct RecoveryReport {
    pub tasks: Vec<RecoveredTask>,
    /// The journal contains an unknown major version: automatic recovery is
    /// forbidden (ORC-STO-005); route to manual diagnosis.
    pub unknown_version: bool,
    /// The journal tail is torn or corrupt: entries after it were ignored.
    pub corrupt_tail: bool,
    pub last_seq: u64,
}

/// Replays a journal file into a per-task recovery report.
pub fn recover_from_journal(path: impl AsRef<Path>) -> RecoveryReport {
    let file = match File::open(path) {
        Ok(file) => file,
        Err(_) => return RecoveryReport::default(),
    };
    let mut report = RecoveryReport::default();
    struct TaskReplay {
        last_state: TaskState,
        last_revision: u64,
        cancel_requested: bool,
        terminal: bool,
        error: Option<AppErrorV1>,
    }

    impl Default for TaskReplay {
        fn default() -> Self {
            Self {
                last_state: TaskState::Queued,
                last_revision: 0,
                cancel_requested: false,
                terminal: false,
                error: None,
            }
        }
    }
    let mut tasks: index_map::IndexMap<TaskReplay> = index_map::IndexMap::new();

    for line in BufReader::new(file).lines() {
        let Ok(line) = line else {
            report.corrupt_tail = true;
            break;
        };
        if line.trim().is_empty() {
            continue;
        }
        let Ok(entry) = serde_json::from_str::<JournalEntryV1>(&line) else {
            report.corrupt_tail = true;
            break;
        };
        if entry.schema_version != JOURNAL_SCHEMA_VERSION {
            report.unknown_version = true;
            break;
        }
        // seq 必须严格递增：重复或倒退说明 journal 被手工编辑过或存在
        // 并发写，按损坏尾部处理（Fix 3，拒绝而不是带病回放）。
        if entry.seq <= report.last_seq {
            report.corrupt_tail = true;
            break;
        }
        report.last_seq = entry.seq;
        let replay = tasks.entry_or_default(entry.task_id.clone());
        match entry.payload {
            JournalPayload::Accepted { accepted } => {
                replay.last_state = accepted.initial_state;
                replay.last_revision = accepted.accepted_revision;
            }
            JournalPayload::StateChanged { state } => {
                replay.last_state = state;
                replay.last_revision = entry.seq;
                // 兼容 R2-5 修复前已经写出的 journal：旧实现可能先记录
                // 终态 StateChanged，再尝试 Completed。新实现只用一条
                // Completed 原子提交终态与结果，但恢复仍须识别旧数据。
                if state.is_terminal() {
                    replay.terminal = true;
                }
            }
            JournalPayload::CancelRequested => {
                replay.cancel_requested = true;
            }
            JournalPayload::Completed { state, error, .. } => {
                replay.last_state = state;
                replay.last_revision = entry.seq;
                replay.terminal = true;
                replay.error = error;
            }
        }
    }

    report.tasks = tasks
        .into_entries()
        .into_iter()
        .map(|(task_id, replay)| {
            let disposition = if replay.terminal {
                RecoveredDisposition::Terminal
            } else {
                RecoveredDisposition::NeedsInspect
            };
            RecoveredTask {
                task_id,
                last_state: replay.last_state,
                last_revision: replay.last_revision,
                cancel_requested: replay.cancel_requested,
                disposition,
                error: replay.error,
            }
        })
        .collect();
    report
}

/// Insertion-ordered map small enough to avoid a dependency for one use.
mod index_map {
    use std::collections::HashMap;

    pub struct IndexMap<V> {
        order: Vec<String>,
        entries: HashMap<String, V>,
    }

    impl<V> IndexMap<V> {
        pub fn new() -> Self {
            Self {
                order: Vec::new(),
                entries: HashMap::new(),
            }
        }

        pub fn entry_or_default(&mut self, key: String) -> &mut V
        where
            V: Default,
        {
            if !self.entries.contains_key(&key) {
                self.order.push(key.clone());
                self.entries.insert(key.clone(), V::default());
            }
            self.entries.get_mut(&key).expect("just inserted")
        }

        pub fn into_entries(mut self) -> Vec<(String, V)> {
            self.order
                .into_iter()
                .map(|key| {
                    let value = self.entries.remove(&key).expect("ordered key");
                    (key, value)
                })
                .collect()
        }
    }

    impl<V> Default for IndexMap<V> {
        fn default() -> Self {
            Self::new()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::contracts::ENVELOPE_SCHEMA_VERSION;
    use std::time::UNIX_EPOCH;

    fn temp_path(label: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("vua-journal-{label}-{nanos}.jsonl"))
    }

    fn accepted_entry(seq: u64, task_id: &str, revision: u64) -> JournalEntryV1 {
        JournalEntryV1 {
            schema_version: JOURNAL_SCHEMA_VERSION,
            seq,
            task_id: task_id.into(),
            kind: JournalEntryKind::Accepted,
            occurred_at: "2026-08-30T00:00:00.000Z".into(),
            payload: JournalPayload::Accepted {
                accepted: CommandAcceptedV1 {
                    schema_version: ENVELOPE_SCHEMA_VERSION,
                    task_id: task_id.into(),
                    accepted_revision: revision,
                    initial_state: TaskState::Queued,
                },
            },
        }
    }

    fn state_entry(seq: u64, task_id: &str, state: TaskState) -> JournalEntryV1 {
        JournalEntryV1 {
            schema_version: JOURNAL_SCHEMA_VERSION,
            seq,
            task_id: task_id.into(),
            kind: JournalEntryKind::StateChanged,
            occurred_at: "2026-08-30T00:00:00.000Z".into(),
            payload: JournalPayload::StateChanged { state },
        }
    }

    #[test]
    fn appended_entries_are_durable_and_replayable() {
        let path = temp_path("durable");
        let writer = JournalWriter::open(&path).unwrap();
        writer.append(&accepted_entry(1, "task-a", 1)).unwrap();
        writer
            .append(&state_entry(2, "task-a", TaskState::Running))
            .unwrap();
        writer.append(&accepted_entry(3, "task-b", 1)).unwrap();

        let report = recover_from_journal(&path);
        assert!(!report.unknown_version);
        assert!(!report.corrupt_tail);
        assert_eq!(report.last_seq, 3);
        assert_eq!(report.tasks.len(), 2);

        let task_a = report
            .tasks
            .iter()
            .find(|task| task.task_id == "task-a")
            .unwrap();
        assert_eq!(task_a.last_state, TaskState::Running);
        assert_eq!(task_a.disposition, RecoveredDisposition::NeedsInspect);

        let task_b = report
            .tasks
            .iter()
            .find(|task| task.task_id == "task-b")
            .unwrap();
        assert_eq!(task_b.last_state, TaskState::Queued);
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn terminal_completion_yields_terminal_disposition() {
        let path = temp_path("terminal");
        let writer = JournalWriter::open(&path).unwrap();
        writer.append(&accepted_entry(1, "task-a", 1)).unwrap();
        writer
            .append(&JournalEntryV1 {
                schema_version: JOURNAL_SCHEMA_VERSION,
                seq: 2,
                task_id: "task-a".into(),
                kind: JournalEntryKind::Completed,
                occurred_at: "2026-08-30T00:00:01.000Z".into(),
                payload: JournalPayload::Completed {
                    state: TaskState::Succeeded,
                    error: None,
                    result: None,
                },
            })
            .unwrap();

        let report = recover_from_journal(&path);
        assert_eq!(report.tasks[0].disposition, RecoveredDisposition::Terminal);
        assert_eq!(report.tasks[0].last_state, TaskState::Succeeded);
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn unknown_major_version_stops_automatic_recovery() {
        let path = temp_path("unknown-version");
        let writer = JournalWriter::open(&path).unwrap();
        writer.append(&accepted_entry(1, "task-a", 1)).unwrap();
        let mut future = accepted_entry(2, "task-a", 2);
        future.schema_version = 2;
        writer.append(&future).unwrap();
        writer
            .append(&state_entry(3, "task-a", TaskState::Running))
            .unwrap();

        let report = recover_from_journal(&path);
        assert!(
            report.unknown_version,
            "unknown major version must stop recovery"
        );
        assert_eq!(
            report.last_seq, 1,
            "entries after the version marker are ignored"
        );
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn corrupt_tail_is_reported_and_ignored() {
        let path = temp_path("corrupt");
        let writer = JournalWriter::open(&path).unwrap();
        writer.append(&accepted_entry(1, "task-a", 1)).unwrap();
        writer
            .append(&JournalEntryV1 {
                schema_version: JOURNAL_SCHEMA_VERSION,
                seq: 2,
                task_id: "task-a".into(),
                kind: JournalEntryKind::Completed,
                occurred_at: "2026-08-30T00:00:01.000Z".into(),
                payload: JournalPayload::Completed {
                    state: TaskState::Succeeded,
                    error: None,
                    result: None,
                },
            })
            .unwrap();
        // Simulate a torn write.
        {
            use std::io::Write;
            let mut file = OpenOptions::new().append(true).open(&path).unwrap();
            file.write_all(b"{\"schemaVersion\":1,\"seq\":3,\"task")
                .unwrap();
        }

        let report = recover_from_journal(&path);
        assert!(report.corrupt_tail);
        assert_eq!(report.last_seq, 2);
        assert_eq!(report.tasks[0].disposition, RecoveredDisposition::Terminal);
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn missing_journal_recovers_to_an_empty_report() {
        let path = temp_path("missing");
        let report = recover_from_journal(&path);
        assert!(report.tasks.is_empty());
        assert_eq!(report.last_seq + 1, 1);
    }
}
