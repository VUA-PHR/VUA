# VUA Orchestrator

本 Crate 是 VUA 当前可测试的应用核心基线，包含环境与工具能力检测、任务运行时、可恢复本地状态
适配器、外部进程端口、Recipe 与 Assembly 应用行为、Unity Bridge 作业支持和合成夹具。

Rust 实现、Crate 布局、托管方式和传输均属于实现细节，不是产品不变量。Renderer 只能通过版本化
应用 Gateway 使用它，不能依赖私有 Crate 类型。

当前验证覆盖工作区检查、锁定依赖测试、警告视为错误的 Clippy、SQLite `0.1` 权威任务状态、项目级
fencing 租约、受监督 Provider 进程，以及共享的 Unity Bridge 请求/结果示例。仍待后续阶段完成的
内容包括真实 Electron Gateway 整合、首个 Orchestrator—Unity 用例、最终三路径项目管理适配器和
发行制品验证。

本仓库采用 Apache-2.0；第三方依赖继续受各自许可证约束，详见根目录第三方声明。

B0 对现有行为、拒绝假设和过渡持久化负债的逐项裁定见
[Orchestrator 迁移资产记录](MIGRATION_ASSETS_ZH.md)。
