# VUA Orchestrator

> 状态：已迁移的本地验证基线
> 来源：旧 VUA `GLM/orchestrator`，提交 `efb2f7f`
> 更新：2026-09-01

本 crate 是与 Electron、React 和 Tauri 无关的 Rust 应用核心。当前迁入内容包括环境检测、工具
能力、任务运行时、JSONL 恢复基线、原子状态文件、外部进程端口、VPM 双后端、Recipe v2、
Assembly、Unity Bridge 作业适配器以及合成固定夹具。

## 本次迁移调整

- crate 从 `vrcua-orchestrator` 更名为 `vua-orchestrator`；
- 本地项目目录从 `.vrcua` 更名为 `.vua`；
- 错误码前缀从 `vrcua.*` 更名为 `vua.*`；
- Unity Bridge 入口和参数改为新的 VUA 命名，C# 侧将在 Unity Bridge 阶段同步；
- 排除真实 Avatar 分析夹具，只保留 `example.invalid` 合成数据；
- `TaskEventV1` 新增必填 `correlationId`，并同步 Schema 与固定示例；
- 未迁移 Tauri command、旧前端手抄契约、旧文档和 GitHub workflow。

## 已验证

2026-09-01 在 Windows 本地执行：

```text
cargo check --workspace
cargo test --locked --workspace
cargo clippy --locked --workspace --all-targets -- -D warnings
```

结果：137 项自动测试通过，3 项需要真实机器或网络的手动测试被显式忽略；Clippy 零警告。

## 尚未完成

- Electron Main 与 Rust sidecar 的真实 IPC transport、握手和进程监督；
- SQLite 权威状态、项目级持久租约和完整恢复动作；
- 由 Rust IPC DTO 自动或机械生成 TypeScript bindings；
- Electron Gateway 接入；
- 新命名的 C# Unity Bridge 与真实 Unity 2022 冒烟；
- CI 验证。

当前 JSONL journal 与 StateFile 是迁入的可测试基线，不代表持久状态最终架构已经完成。
