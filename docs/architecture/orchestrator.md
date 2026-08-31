# Rust Orchestrator 架构

> 状态：已接受
> 范围：`crates/orchestrator` 及其本地适配器
> 更新：2026-09-01
> 规范效力：有

## 责任

Orchestrator 是 VUA 本地应用核心，负责：

- 命令、查询、任务和能力用例；
- Inspect/Plan/Confirm/Snapshot/Execute/Validate/Recover 工作流；
- revision、幂等、取消、恢复和项目级修改互斥；
- Recipe 到 ProjectSpec、执行计划与 Build Record 的应用协调；
- SQLite、文件、进程、网络、项目管理、运行时工具和 Unity Bridge 端口；
- 结构化诊断与隐私过滤。

它不负责 React 页面、Electron 窗口、远程网页渲染、Unity 对象实现和第三方工具 UI。

## 代码边界

```text
crates/orchestrator/
├─ domain/        纯规则、状态与值对象
├─ application/   用例、工作流和授权边界
├─ ports/         输入/输出能力接口
├─ adapters/      SQLite、文件、进程、HTTP、Unity 等实现
└─ composition/   运行时装配与配置
```

核心 crate 不依赖 Electron、React 或 Tauri。IPC DTO 与领域类型显式映射，不能为了生成前端类型而
把桌面框架派生宏引入领域层。

## Sidecar 生命周期

Electron Main 启动一个与当前应用实例绑定的 Orchestrator sidecar，并通过版本化、带帧边界的
本地 IPC 通信。协议至少支持握手、版本协商、请求 ID、关联 ID、取消、事件、关闭和最大帧限制。

- Main 负责进程监督，不负责恢复决策；
- Sidecar 异常退出后，Main 展示不可用状态并可按策略重启；
- 重启后的恢复来自持久状态，不来自 Renderer 内存；
- IPC 断开不能被解释为任务自动取消；
- 多窗口共享同一应用核心，不各自创建独立权威状态。

## 状态与并发

- SQLite 是权威持久状态；审计导出不能与其共同裁决恢复结果；
- 权威写入使用 revision/CAS，冲突返回可恢复错误；
- 同一个 Unity 项目同时只允许一个修改型工作流；
- 外部副作用在执行前记录意图，在安全边界后记录结果；
- 事件只在事务提交后发布，并携带对应 revision；
- 幂等记录保存足以识别重复命令和重用既有结果的信息。

数据库驱动、租约细节、恢复表结构和 IPC 编码仍需版本化协议与实现 Spike，不在本架构文档中
假装已经解决。

## 外部进程

所有进程启动通过专用适配器：

- 参数数组传递，不拼接 Shell 字符串；
- 默认继承正常用户环境，同时显式剥离令牌、凭据和与目标工具无关的危险变量；
- 每种工具登记所需的最小附加环境、工作目录、超时、取消和退出码语义；
- 不执行素材压缩包内的脚本或二进制；
- Windows 子进程生命周期纳入 Job Object 或等价监督；
- 日志截断并脱敏，不能泄漏付费素材路径和账户信息。

## 迁移原则

旧 `GLM/orchestrator` 只作为代码和验证证据来源。可迁移 Rust 领域/应用逻辑、端口、适配器、
测试和固定向量；Tauri command、旧 IPC、旧目录布局和未接受草案不进入新核心。
