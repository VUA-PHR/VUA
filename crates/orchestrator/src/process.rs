//! Process runner port (ORC-ADP-001..003, ORC-CON-004, O6 minimal): external
//! programs are executed through a fixed executable identity with typed
//! arguments, a mandatory timeout and bounded output. No shell, ever.
//!
//! # 中文逐段讲解（E-PKG 审阅）
//!
//! 这是所有"调外部程序"的唯一通道——vrc-get、Unity batchmode 都走它，
//! 不许任何代码自己 `Command::new`（E-ASSEMB 时把 bridge/provision 迁进来了，
//! 就是为了消灭第二个进程管理点）。
//!
//!
//! `ProcessSpec` —— 一次调用的完整描述：固定可执行文件路径（不进 PATH
//! 搜索拼命令）、类型化参数数组（`ProcessSpec.args` 由各引擎拼装，用户
//! 输入先经校验才能进来——ORC-ADP-004 的"不接收 View 拼的参数数组"）、
//! *必填**超时（没有默认无限等待这回事，ORC-CON-004）、输出上限。
//!
//! `StdProcessRunner::run` 的四道工序：
//! `Command::new(executable)` + `.args()` —— 直接 exec，**不经
//! cmd/powershell**，从根上消灭命令注入（ORC-ADP-001）；
//! 两个读线程分别抽干 stdout/stderr（见 `drain_bounded`）——不抽干
//! 会怎样？子进程写满 OS 管道缓冲（约 64KB）就卡死在 write 上，
//! 父进程却在 wait → 双方互等死锁。抽干同时只保留前 limit 字节，
//! 内存有上界；
//! 轮询 `try_wait` 直到退出码或超时——std 没有带超时的 wait，只能
//! 5ms 一次轮询；超时就 `kill()` 后再 `wait()` 收尸（不留僵尸）。
//! 注意 v0 只杀直接子进程，Unity 再拉起的孙进程是已知局限
//! （Windows Job Object 方案在 O6 硬化清单里）；
//! 汇总 `ProcessOutcome`：退出码、是否超时、截断后的输出。
//!
//! `drain_bounded` —— `total > limit` 才置 truncated 标记并追加
//! `...[truncated]` 尾注：消费方看到尾注就知道日志被剪过。
//!
//! `FakeProcessRunner` —— 消费者契约测试的核心道具（ORC-DEV-003）：
//! `calls` 记录每次收到的 spec → 测试断言"参数必须是这四个、不许
//! 出现 cmd.exe"；
//! `script` 队列按次回放脚本化结果（空队列默认成功）；
//! `on_run` 副作用钩子 → 模拟"后端真的改了项目状态"（比如装包后
//! 写 manifest），让引擎层的验证逻辑有真东西可验；
//! `clear_calls` → 把 discovery 探测的调用清零，让断言从已知点计数。
//!
//! 错误只有一个 `Io` 变体：进程调用的一切失败都归结为 io::Error，
//! 各引擎负责把它翻译成自己的稳定错误码（如 `vua.vpm.install_failed`）。

use std::collections::VecDeque;
use std::io::Read;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// One external process invocation. `args` are typed values assembled by the
/// owning adapter — never user-joined strings (ORC-ADP-004).
#[derive(Debug, Clone, PartialEq)]
pub struct ProcessSpec {
    pub executable: PathBuf,
    pub args: Vec<String>,
    pub working_dir: Option<PathBuf>,
    /// Mandatory wall-clock budget (ORC-CON-004: unlimited waits are not
    /// accepted).
    pub timeout: Duration,
    /// Cap on captured stdout/stderr in bytes; excess is drained and marked
    /// truncated (ORC-ADP-003).
    pub output_limit: usize,
    /// 环境覆盖（Fix 8 / R2-2, ORC-ADP-003）：默认完整继承 VUA 进程环境
    /// （本地单机应用中那是用户自己的环境）；键命中 `removals` 时从子进程
    /// 环境剥离，`sets` 逐键覆盖。各适配器统一叠加
    /// [`CREDENTIAL_ENV_REMOVALS`] 凭据剥离基线；代理变量按工具决定是否
    /// 剥离（vrc-get/VCC 下载可能确实需要用户代理）。
    pub removals: Vec<String>,
    pub sets: std::collections::BTreeMap<String, String>,
}

/// 凭据类环境变量剥离基线（R2-2）：这些变量对 VUA 调用的工具没有正当
/// 用途，剥离防止 VUA 进程环境里的第三方令牌流入子进程。代理变量不在
/// 基线内——vrc-get/VCC 下载可能依赖用户代理；按工具策略在 H-IPC 细化。
pub const CREDENTIAL_ENV_REMOVALS: &[&str] = &[
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "GH_ENTERPRISE_TOKEN",
    "GIT_TOKEN",
    "NPM_TOKEN",
    "NODE_AUTH_TOKEN",
    "CARGO_REGISTRY_TOKEN",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_SESSION_TOKEN",
    "AZURE_CLIENT_SECRET",
    "GOOGLE_APPLICATION_CREDENTIALS",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
];

impl Default for ProcessSpec {
    fn default() -> Self {
        Self {
            executable: PathBuf::new(),
            args: Vec::new(),
            working_dir: None,
            timeout: Duration::ZERO,
            output_limit: 0,
            // 安全基线属于 ProcessRunner 边界，而不是每个调用方的可选
            // 约定。所有通过 `..Default::default()` 构造的生产适配器都会
            // 继承父进程环境，同时剥离已知凭据；工具仍可按需追加变量。
            removals: CREDENTIAL_ENV_REMOVALS
                .iter()
                .map(|name| (*name).to_owned())
                .collect(),
            sets: std::collections::BTreeMap::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ProcessOutcome {
    pub exit_code: Option<i32>,
    /// True when the timeout fired and the process was killed.
    pub timed_out: bool,
    pub stdout: String,
    pub stderr: String,
    pub truncated: bool,
}

impl ProcessOutcome {
    pub fn success(&self) -> bool {
        !self.timed_out && self.exit_code == Some(0)
    }
}

#[derive(Debug)]
pub enum ProcessError {
    Io(std::io::Error),
}

impl std::fmt::Display for ProcessError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(error) => write!(formatter, "process execution failed: {error}"),
        }
    }
}

impl std::error::Error for ProcessError {}

pub trait ProcessRunner: Send + Sync {
    fn run(&self, spec: &ProcessSpec) -> Result<ProcessOutcome, ProcessError>;
}

/// Real runner over `std::process`. The child is spawned without a shell;
/// output is drained on dedicated threads and capped; the timeout kills the
/// child (process-tree termination for nested spawners lands with the O6
/// hardening slice and is a known v0 limitation).
#[derive(Debug, Default)]
pub struct StdProcessRunner;

impl ProcessRunner for StdProcessRunner {
    fn run(&self, spec: &ProcessSpec) -> Result<ProcessOutcome, ProcessError> {
        // 直接 exec 固定可执行文件：参数是独立数组元素传给 OS 的 execve，
        // 不存在"被 shell 重新解释"的环节，注入无从谈起（ORC-ADP-001）。
        // stdin 直接关闭：外部工具不该等输入。
        let mut command = Command::new(&spec.executable);
        command
            .args(&spec.args)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        if let Some(dir) = &spec.working_dir {
            command.current_dir(dir);
        }
        // 环境覆盖（Fix 8）：先剥离再设置；未列出的变量原样继承。
        for key in &spec.removals {
            command.env_remove(key);
        }
        for (key, value) in &spec.sets {
            command.env(key, value);
        }
        let mut child = command.spawn().map_err(ProcessError::Io)?;

        // 两条独立的抽干线：无论子进程输出多少、多快，管道都不会积压，
        // 父进程可以专心等退出（见 drain_bounded 的死锁说明）。
        let mut stdout_pipe = child.stdout.take().expect("stdout piped");
        let mut stderr_pipe = child.stderr.take().expect("stderr piped");
        let limit = spec.output_limit;
        let stdout_reader = std::thread::spawn(move || drain_bounded(&mut stdout_pipe, limit));
        let stderr_reader = std::thread::spawn(move || drain_bounded(&mut stderr_pipe, limit));

        let deadline = Instant::now() + spec.timeout;
        let mut timed_out = false;
        let exit_code = loop {
            match child.try_wait().map_err(ProcessError::Io)? {
                Some(status) => break status.code(),
                None => {
                    if Instant::now() >= deadline {
                        let _ = child.kill();
                        let _ = child.wait();
                        timed_out = true;
                        break None;
                    }
                    std::thread::sleep(Duration::from_millis(5));
                }
            }
        };

        let (stdout, stdout_truncated) = stdout_reader
            .join()
            .map_err(|_| ProcessError::Io(std::io::Error::other("stdout reader panicked")))?;
        let (stderr, stderr_truncated) = stderr_reader
            .join()
            .map_err(|_| ProcessError::Io(std::io::Error::other("stderr reader panicked")))?;
        Ok(ProcessOutcome {
            exit_code,
            timed_out,
            stdout,
            stderr,
            truncated: stdout_truncated || stderr_truncated,
        })
    }
}

/// Reads a pipe to EOF while retaining at most `limit` bytes, so a chatty
/// child can neither grow memory unboundedly nor deadlock on a full pipe.
fn drain_bounded(pipe: &mut impl Read, limit: usize) -> (String, bool) {
    let mut kept: Vec<u8> = Vec::new();
    let mut total: usize = 0;
    let mut chunk = [0u8; 8192];
    loop {
        match pipe.read(&mut chunk) {
            Ok(0) => break,
            Ok(read) => {
                total += read;
                if kept.len() < limit {
                    let remaining = limit - kept.len();
                    kept.extend_from_slice(&chunk[..read.min(remaining)]);
                }
            }
            Err(error) if error.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(_) => break,
        }
    }
    let truncated = total > limit;
    let mut text = String::from_utf8_lossy(&kept).into_owned();
    if truncated {
        text.push_str("\n...[truncated]");
    }
    (text, truncated)
}

/// Scripted runner for tests and consumer contracts (ORC-DEV-003): records
/// every spec, replays scripted outcomes, and can apply a side effect so
/// engine-level tests can simulate the backend mutating project state.
type SideEffect = Box<dyn Fn(&ProcessSpec) + Send + Sync>;

#[derive(Default)]
pub struct FakeProcessRunner {
    calls: Mutex<Vec<ProcessSpec>>,
    script: Mutex<VecDeque<Result<ProcessOutcome, String>>>,
    on_run: Mutex<Option<SideEffect>>,
}

impl FakeProcessRunner {
    pub fn new() -> Self {
        Self::default()
    }

    /// Queues one outcome; when the script is empty the runner answers with a
    /// successful empty outcome.
    pub fn push(&self, outcome: Result<ProcessOutcome, String>) -> &Self {
        self.script
            .lock()
            .expect("fake script poisoned")
            .push_back(outcome);
        self
    }

    pub fn on_run(&self, effect: impl Fn(&ProcessSpec) + Send + Sync + 'static) -> &Self {
        *self.on_run.lock().expect("fake on_run poisoned") = Some(Box::new(effect));
        self
    }

    pub fn calls(&self) -> Vec<ProcessSpec> {
        self.calls.lock().expect("fake calls poisoned").clone()
    }

    pub fn call_count(&self) -> usize {
        self.calls.lock().expect("fake calls poisoned").len()
    }

    /// Drops recorded calls, e.g. after the discovery probe, so assertions
    /// can count calls from a known point.
    pub fn clear_calls(&self) -> &Self {
        self.calls.lock().expect("fake calls poisoned").clear();
        self
    }
}

impl ProcessRunner for FakeProcessRunner {
    fn run(&self, spec: &ProcessSpec) -> Result<ProcessOutcome, ProcessError> {
        self.calls
            .lock()
            .expect("fake calls poisoned")
            .push(spec.clone());
        if let Some(effect) = self.on_run.lock().expect("fake on_run poisoned").as_ref() {
            effect(spec);
        }
        let next = self
            .script
            .lock()
            .expect("fake script poisoned")
            .pop_front();
        match next {
            Some(Ok(outcome)) => Ok(outcome),
            Some(Err(message)) => Err(ProcessError::Io(std::io::Error::other(message))),
            None => Ok(ProcessOutcome {
                exit_code: Some(0),
                timed_out: false,
                stdout: String::new(),
                stderr: String::new(),
                truncated: false,
            }),
        }
    }
}

/// Convenience for tests: a scripted outcome with an exit code.
pub fn outcome_with_exit(code: i32, stderr: &str) -> ProcessOutcome {
    ProcessOutcome {
        exit_code: Some(code),
        timed_out: false,
        stdout: String::new(),
        stderr: stderr.to_owned(),
        truncated: false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn node_spec(script: &str, timeout: Duration, limit: usize) -> ProcessSpec {
        ProcessSpec {
            executable: PathBuf::from("node"),
            args: ["-e".to_owned(), script.to_owned()].into_iter().collect(),
            working_dir: None,
            timeout,
            output_limit: limit,
            ..Default::default()
        }
    }

    #[test]
    fn orc_adp_001_std_runner_executes_typed_args_without_a_shell() {
        let outcome = StdProcessRunner
            .run(&node_spec(
                "console.log('typed-args-ok')",
                Duration::from_secs(15),
                4096,
            ))
            .unwrap();
        assert!(outcome.success(), "{outcome:?}");
        assert!(outcome.stdout.contains("typed-args-ok"));
        assert!(!outcome.truncated);
    }

    #[test]
    fn orc_adp_003_every_process_spec_inherits_the_credential_hygiene_baseline() {
        let spec = ProcessSpec::default();
        for credential in CREDENTIAL_ENV_REMOVALS {
            assert!(
                spec.removals.iter().any(|name| name == credential),
                "default process boundary must strip {credential}"
            );
        }
        assert!(
            !spec.removals.iter().any(|name| name == "HTTP_PROXY"),
            "proxy inheritance remains an explicit per-tool decision"
        );
    }

    #[test]
    fn orc_con_004_std_runner_enforces_the_timeout_and_kills_the_child() {
        let started = Instant::now();
        let outcome = StdProcessRunner
            .run(&node_spec(
                "setTimeout(() => {}, 30_000)",
                Duration::from_millis(120),
                4096,
            ))
            .unwrap();
        assert!(outcome.timed_out);
        assert!(started.elapsed() < Duration::from_secs(10));
    }

    #[test]
    fn orc_adp_003_std_runner_bounds_captured_output() {
        let outcome = StdProcessRunner
            .run(&node_spec(
                "process.stdout.write('x'.repeat(5_000_000))",
                Duration::from_secs(60),
                1024,
            ))
            .unwrap();
        assert!(outcome.truncated);
        assert!(outcome.stdout.len() <= 1024 + "\n...[truncated]".len());
        assert!(outcome.stdout.starts_with('x'));
    }

    #[test]
    fn orc_dev_003_fake_runner_records_specs_and_replays_script() {
        let runner = FakeProcessRunner::new();
        runner.push(Ok(outcome_with_exit(2, "boom")));
        let spec = node_spec("1", Duration::from_secs(1), 128);
        let first = runner.run(&spec).unwrap();
        assert_eq!(first.exit_code, Some(2));
        let second = runner.run(&spec).unwrap();
        assert_eq!(second.exit_code, Some(0), "empty script answers success");
        assert_eq!(runner.call_count(), 2);
        assert_eq!(runner.calls()[0], spec);
    }
}
