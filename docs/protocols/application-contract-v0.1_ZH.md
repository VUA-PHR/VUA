# VUA 应用契约 v0.1

[English](application-contract-v0.1_EN.md) | [简体中文](application-contract-v0.1_ZH.md)

> 状态：B1 候选开发契约  
> 范围：Electron Kernel 与 Orchestrator Provider 之间的应用语义  
> 更新：2026-09-02  
> 规范效力：约束 B1 实现与测试；M2 真实整合前不构成稳定 Gateway v1

## 目的与边界

本契约定义与托管、FFI、进程和消息传输无关的应用值。Electron Main/Kernel 把允许的 Gateway 调用
映射到本契约；Provider 再把本契约显式映射到 Rust 应用用例。Renderer 不接触 Provider 生命周期、
Rust 类型、SQLite 行、journal payload、原生句柄或子进程消息。

版本值为字符串 `0.1`。任何请求、响应、事件、握手和生命周期结果都必须携带该值；未知版本明确
拒绝，不根据产品版本或载荷形状猜测。

## B1 最小用例面

| 种类 | 方法 | 语义 |
| --- | --- | --- |
| Query | `application.getSnapshot` | 返回应用 revision 与操作级能力快照 |
| Query | `task.list` | 返回当前可见任务的权威快照集合 |
| Query | `task.get` | 返回一个任务的权威快照 |
| Command | `task.requestCancellation` | 对稳定任务实例提交单调、幂等的取消意图 |

B1 不加入 Recipe、Assembly、环境部署或 Unity 修改命令。这些方法只能由后续纵向切片在所属用例和
端口明确后扩展。

## 标识、错误与 revision

- `requestId` 标识一次调用，`correlationId` 关联一次用户意图及其后续任务和诊断；
- 修改命令携带稳定 `commandId`，Provider 对重复 ID 返回既有结果或明确冲突，不重复副作用；
- `AppErrorV01` 使用稳定代码、本地化键与参数，分别表达 `recoverable` 和 `retryable`，不得携带
  SQL、堆栈、Cookie、令牌、完整用户路径或付费素材文件名；
- Query 返回权威快照 revision。任务事件 revision 在单个任务内单调增加；事件出现重复或跳号时，
  消费者按 `task.get` 或 `task.list` 重取快照；
- Event 是事务提交后事实的通知，不是权威状态副本。B1 模拟 Provider 验证该语义；SQLite 事务后
  发布由 B2 证明。

## 任务与取消

对外任务状态沿用候选九态：`queued`、`preparing`、`running`、`waiting_for_input`、`paused`、
`succeeded`、`succeeded_with_warnings`、`failed`、`cancelled`。后四项是终态，终态不得被取消、超时
或迟到结果覆盖。

任务快照必须携带 `recoveryDisposition`：正常任务为 `none`；进程重启后遗留的非终态任务保留最后
真实 `state`，并标为 `inspect_required`。后者不表示仍在执行，也不得自动转成暂停或失败；必须先
重新 Inspect 外部项目，再由后续恢复用例决定继续或回滚。

`task.requestCancellation` 绑定 `taskId` 与 `commandId`，可以携带用户点击时看到的
`observedRevision`。正常进度造成 revision 变化时不拒绝取消；该值只用于诊断。响应必须区分：

- `requested`：取消意图首次被接受；
- `already_requested`：相同任务已经收到取消意图；
- `already_terminal`：任务已经终止，原终态保持不变。

请求取消不等于已经取消。只有任务在安全边界结束并提交 `cancelled` 终态后，界面才能显示取消完成。

## 操作级 Capability

Capability 以稳定 `operationId` 逐项报告 `available` 或 `unavailable`，不可用项携带结构化原因。
模块级“就绪/降级/不可用”只允许作为表现层从操作项派生，不能反向覆盖具体操作结论。

例如错误 Unity 版本可以保留环境诊断操作，同时拒绝项目修改；离线包管理可以允许读取缓存并拒绝
刷新；VCC/ALCOM 项目可以允许检查而不宣称具备 VUA 原生创建能力。

## Provider 接口

Provider 是 Kernel 内部可信接口，必须提供：

1. `start()`：返回支持的应用契约版本、Provider 构建身份和实例身份；
2. `invoke()`：只接受显式应用请求联合，不提供通用 channel、反射调用或任意方法名；
3. `subscribe()`：订阅类型化应用事件，取消订阅只影响观察者，不影响任务生命周期；
4. `prepareShutdown()`：先关闭新调用入口，再等待进行中的修改任务到达安全边界，等待时间有明确上限；
5. `continueShutdown()`：超时后只接受 `wait` 或带用户决定 ID 的 `force`。Provider 不得自行把超时
   等同强制退出。

正常关闭返回 `safe_to_stop`。超过时限返回 `needs_user_choice` 和仍阻塞的任务摘要；选择继续等待会
产生新的有界等待，选择强制退出必须携带 Kernel 生成的 `userDecisionId`，供诊断和后续恢复关联。

Provider 的具体托管形态、握手封帧、崩溃监督、SQLite 租约和 Windows 进程树策略已由 B2 的
[受监督 Provider 进程协议 v0.1](provider-process-v0.1_ZH.md)定型，不属于 v0.1 应用值。

## B1 验证门槛

- TypeScript 类型与运行时检查拒绝未知版本、未知方法和混合 Command/Query 形状；
- 模拟 Provider 验证 Query 只读、取消幂等、终态优先、操作级 Capability、事件 gap 后重取快照；
- 模拟 Provider 验证停止接收新调用、安全关闭、超时后选择以及强制退出必须有用户决定 ID；
- 测试不得依赖 Rust、Electron、FFI、网络、SQLite 或真实 Unity。
