# Orchestrator 架构

[English](orchestrator_EN.md) | [简体中文](orchestrator_ZH.md)

> 状态：已接受
> 范围：Orchestrator 应用核心及其本地适配器
> 更新：2026-09-02
> 规范效力：有

## 责任

Orchestrator 是 VUA 本地应用核心，负责：

- 命令、查询、任务和能力用例；
- Inspect/Plan/Confirm/Snapshot/Execute/Validate/Recover 工作流；
- revision、幂等、取消、恢复和项目级修改互斥；
- Recipe 到 ProjectSpec、执行计划与 Build Record 的应用协调；
- SQLite、文件、进程、网络、项目管理、运行时工具和 Unity Bridge 端口；
- 结构化诊断与隐私过滤。

React 拥有页面，Electron 拥有窗口与远程网页渲染，Unity Bridge 拥有 Unity 对象，第三方应用拥有
自身 UI。

## 逻辑分层

```text
Orchestrator
├─ domain         纯规则、状态与值对象
├─ application    用例、工作流和授权边界
├─ ports          输入/输出能力接口
├─ adapters       SQLite、文件、进程、HTTP、Unity 等实现
└─ bootstrap      固定启动装配与配置
```

已接受实现保持 Orchestrator 为 Rust，并采用受监督独立进程 Provider。Gateway DTO 与 Rust 应用类型
显式映射；传输类型停留在 Provider 边界。选择理由与移除路径见
[ADR：Orchestrator 受监督独立进程托管](../decisions/orchestrator-supervised-provider_ZH.md)。

## 托管与 Gateway 边界

Electron Main 通过 Kernel 托管或监督一个可信 Orchestrator Provider。Provider
负责值转换、生命周期协调和 Orchestrator 用例转发。

- Gateway 只公开版本化命令、查询、任务操作、事件和能力快照；
- 请求 ID、关联 ID、取消语义和错误码属于独立于传输的应用契约；
- Orchestrator 暂时不可用时，Main 展示明确的降级状态并按实现策略恢复；
- 恢复来自持久状态；
- Gateway 暂时不可达期间，已接受任务保持原生命周期；
- 多窗口共享同一权威应用核心。

Provider 关闭时先关闭新调用入口，再按契约等待进行中修改到达可恢复边界；超时后由用户选择继续
等待或强制退出。受监督进程实现必须证明握手、崩溃侦测、显式重启、进程树清理和从权威持久状态
恢复。Provider 替换只能发生在空闲关闭边界。

B1 的传输无关请求、任务、取消、操作级 Capability 与安全关闭语义见
[应用契约 v0.1](../protocols/application-contract-v0.1_ZH.md)。该候选契约在 M2 真实整合前不构成
稳定 Gateway v1。

B2 的 SQLite 表、事务、幂等、耐久与重启语义见
[任务存储格式 v0.1](../protocols/task-store-v0.1_ZH.md)；进程封帧、握手、监督、单实例与关闭语义见
[受监督 Provider 进程协议 v0.1](../protocols/provider-process-v0.1_ZH.md)。

## 状态与并发

- SQLite 是权威持久状态；审计导出只提供只读证据；
- 权威写入使用 revision/CAS，冲突返回可恢复错误；
- 同一个 Unity 项目同时只允许一个修改型工作流；
- 外部副作用在执行前记录意图，在安全边界后记录结果；
- 事件只在事务提交后发布，并携带对应 revision；
- 幂等记录保存足以识别重复命令和重用既有结果的信息。

数据库驱动、租约、恢复表、Provider 传输、进程监督和关闭行为已由 B2 实现与测试定型。Panic 到
稳定应用错误的完整映射随 B3 首个真实用例继续覆盖。

## 外部进程

所有进程启动通过专用适配器：

- 使用参数数组传递；
- 默认继承正常用户环境，同时显式剥离令牌、凭据和与目标工具无关的危险变量；
- 每种工具登记所需的最小附加环境、工作目录、超时、取消和退出码语义；
- 只执行来自可信安装源且进入允许清单的程序；
- Windows 子进程生命周期纳入 Job Object 或等价监督；
- 日志截断并脱敏，隐藏付费素材路径和账户信息。
