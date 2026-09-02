# Orchestrator Provider

本包定义 Electron Kernel 内部使用的可替换 Orchestrator Provider v0.1 接口，提供不依赖 Rust、
Electron、FFI、子进程、SQLite 或 Unity 的受控模拟适配器，以及 B2 选定的受监督独立进程适配器。

Provider 接收版本化应用值并负责生命周期；Renderer 不导入本包。独立进程适配器只接受绝对可执行
文件和数据库路径，使用受限环境、无 shell 的管道协议，并显式处理握手、崩溃、重启和安全关闭。

语义权威见 [VUA 应用契约 v0.1](../../docs/protocols/application-contract-v0.1_ZH.md)和
[受监督 Provider 进程协议 v0.1](../../docs/protocols/provider-process-v0.1_ZH.md)。
