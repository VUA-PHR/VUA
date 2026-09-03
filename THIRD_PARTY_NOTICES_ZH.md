# 第三方声明

VUA 包含或依赖第三方软件。这些组件继续受其各自许可证约束；本仓库的 Apache-2.0 许可证不会取代
第三方许可证。

## 当前源码依赖

当前 Rust 工作区直接声明以下第三方 Crate：

| 依赖 | 声明的许可证类别 | 用途 |
| --- | --- | --- |
| `vrc-get-vpm` | MIT | VRChat 包与项目操作 |
| `tokio` | MIT | 异步运行时 |
| `reqwest` | MIT OR Apache-2.0 | HTTP 客户端 |
| `rusqlite` | MIT | Orchestrator 权威任务 SQLite 适配器 |
| `serde`, `serde_json` | MIT OR Apache-2.0 | 序列化 |
| `sha2` | MIT OR Apache-2.0 | 内容哈希 |
| `windows-sys` | MIT OR Apache-2.0 | Windows Job Object 进程树监督 |
| `jsonschema` | MIT | 测试中的 Schema 验证 |

`rusqlite` 使用 `bundled` 功能静态构建 SQLite；SQLite 本身属于公有领域。该依赖由 Orchestrator
持久化适配器拥有。若未来替换驱动，只能在保持数据库格式、事务、耐久和恢复特征测试的前提下移除。

Unity Bridge Package 声明 VRChat Avatars SDK 和 Modular Avatar 为 Unity Package 依赖。它们从各自
包源解析，不因 VUA 而重新许可。

本文件是便于阅读的摘要，不是完整、自动生成的软件物料清单。`Cargo.lock`、Unity Package Manifest
和未来的 JavaScript Lockfile 才是依赖快照的权威来源。当前传递依赖除多种宽松许可证外，还包含
MPL-2.0、Unicode-3.0、Zlib、CDLA-Permissive-2.0 等许可证组件。

## 分发规则

发布二进制前，项目必须针对该次精确构建生成并审查完整的依赖与许可证清单，保留所有必要的许可
证和署名文本，并逐项批准随包提供的第三方二进制。支持连接用户外部安装的软件不代表拥有再分发
该软件的许可。

如果本摘要与某项依赖的许可证正文冲突，以该依赖的许可证正文为准。
