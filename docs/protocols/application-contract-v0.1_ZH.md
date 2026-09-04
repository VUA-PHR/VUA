# VUA 应用契约 v0.1

[English](application-contract-v0.1_EN.md) | [简体中文](application-contract-v0.1_ZH.md)

> 状态：B1/F2 候选开发契约
> 范围：Electron Kernel 与 Orchestrator Provider 之间的应用语义
> 更新：2026-09-04
> 规范效力：约束 B1/F2 实现与测试；M2 真实整合前不构成稳定 Gateway v1

## 目的与边界

本契约定义与托管、FFI、进程和消息传输无关的应用值。Electron Main/Kernel 把允许的 Gateway
调用映射到本契约；Provider 把本契约显式映射到 Rust 应用用例。Renderer 只消费经 Kernel
映射后的 Gateway 面，不接触 Provider 生命周期、Rust 类型、SQLite 行、journal 载荷或子进程
消息。

版本值为字符串 `0.1`。任何请求、响应、事件、握手和生命周期结果都携带该值；收到未知版本
时明确拒绝。

## 版本与演进

方法面随纵向切片增长，本文档是唯一登记处：新增方法必须在此登记，并写明所属用例、端口与
能力门控。同一候选版本内允许增量登记（两侧实现在同一仓库内同步演进）；进入 M2 冻结时
整体提升为稳定 Gateway v1，此后破坏性变更才要求升版本号。

## 方法面

| 种类 | 方法 | 语义 | 引入 |
| --- | --- | --- | --- |
| Query | `application.getSnapshot` | 返回应用 revision 与操作级能力快照 | B1 |
| Query | `task.list` | 返回当前可见任务的权威快照集合 | B1 |
| Query | `task.get` | 返回一个任务的权威快照 | B1 |
| Command | `task.requestCancellation` | 对稳定任务实例提交单调、幂等的取消意图 | B1 |
| Query | `environment.getSnapshot` | 返回双辖区的环境在场事实快照（只读） | F2 |
| Command | `task.startDemo` | 能力门控的演示命令：创建一个可观察、可取消的演示任务 | F2 |

`task.startDemo` 是任务体验的端到端演示通道（提交 → 观察 → 取消），由操作级 capability
（如 `demo.task`）门控，生产构建可以声明不可用；首个真实用例命令（F3 检查页面）落地后，
它降级为测试夹具并从生产能力表移除。

## 标识符

- `requestId` 标识一次调用；`correlationId` 关联一次用户意图及其后续任务和诊断；
- 修改命令携带稳定 `commandId`：Provider 对重复 ID 返回既有结果或明确冲突，不重复副作用。

## 错误

`AppErrorV01` 使用稳定错误码、本地化键与参数，并标注 `recoverable` 与 `retryable`。错误
负载是接口数据，不是诊断转储：凭据、SQL、堆栈、Cookie、令牌、完整用户路径与付费素材
文件名不进入错误负载。

## revision 与事件

- 查询返回权威快照 revision；单个任务的事件 revision 在任务内单调递增。事件出现重复或
  跳号时，消费者按 `task.get` 或 `task.list` 重取快照；
- 事件是事实通知，不是权威状态副本；权威状态只来自查询。

## 任务语义

对外任务状态为九态：`queued`、`preparing`、`running`、`waiting_for_input`、`paused`、
`succeeded`、`succeeded_with_warnings`、`failed`、`cancelled`；后四项是终态，终态不被
取消、超时或迟到结果覆盖。

任务快照携带 `recoveryDisposition`：正常任务为 `none`；进程重启后遗留的非终态任务保留
最后真实状态并标为 `inspect_required`——它不表示仍在执行，必须先重新 Inspect 外部项目，
再由恢复用例决定继续或回滚。

`task.requestCancellation` 绑定 `taskId` 与 `commandId`，可携带用户点击时看到的
`observedRevision`（仅用于诊断；正常进度造成的 revision 变化不拒绝取消）。响应区分
`requested` / `already_requested` / `already_terminal`。请求取消不等于已经取消：只有任务
在安全边界结束并提交 `cancelled` 终态后，界面才显示取消完成。

`task.startDemo` 创建的任务与真实任务走完全相同的九态、事件与取消语义；区别仅在它是
演示负载，不携带用户数据。

## 环境快照语义

`environment.getSnapshot` 返回双辖区（`play` / `create`）的**在场事实**，不做严重度裁决：
每项检查携带稳定 `checkId`、`zone`、`presence`（`detected` / `not_detected` /
`detection_failed`）、`capturedAt` 与工程事实 `facts`（路径、版本、字节数等原始观测）。
`errorCode` 仅在观测本身失败时设置；组件缺失是正常发现，不是错误。缺失是否构成问题、
以何种严重度呈现，由消费侧（表现层、修复计划）决定。词表与 B6 环境检测 spike
（`crates/orchestrator/src/environment.rs` 的 `EnvironmentSnapshotV1`）保持一致。

## 操作级 Capability

Capability 以稳定 `operationId` 逐项报告 `available` / `unavailable`，不可用项携带结构化
原因。模块级"就绪 / 降级 / 不可用"只允许作为表现层从操作项派生，不反向覆盖具体操作结论。
例如错误 Unity 版本可以保留环境诊断操作，同时拒绝项目修改；离线包管理可以允许读取缓存
并拒绝刷新。

## Provider 接口

Provider 是 Kernel 内部可信接口，提供：

1. `start()`：返回支持的应用契约版本、Provider 构建身份和实例身份；
2. `invoke()`：只接受显式应用请求联合，不提供通用 channel 或任意方法名；
3. `subscribe()`：订阅类型化应用事件；取消订阅只影响观察者，不影响任务生命周期；
4. `prepareShutdown()`：先关闭新调用入口，再等待进行中的修改任务到达安全边界，等待
   时间有明确上限；
5. `continueShutdown()`：超时后只接受 `wait` 或带用户决定 ID 的 `force`；Provider 不自行
   把超时等同强制退出。

正常关闭返回 `safe_to_stop`；超过时限返回 `needs_user_choice` 与仍阻塞的任务摘要。
Provider 的具体托管形态、握手封帧、崩溃监督与进程树策略由
[受监督 Provider 进程协议 v0.1](provider-process-v0.1_ZH.md) 定型。

## 与表现层的衔接

表现层可以为显示目的投射契约词汇（状态名、分组、文案键），但投射必须穷尽：契约新增
状态而投射未覆盖时应在测试中失败，而不是静默落入默认分支。投射不改变契约事实——缓存、
显示与诊断一律引用契约原值。

## 验证门槛

- TypeScript 类型与运行时检查拒绝未知版本、未知方法和混合 Command/Query 形状；
- 模拟 Provider 验证 Query 只读、命令幂等、终态优先、操作级 Capability、事件 gap 后
  重取快照；
- 模拟 Provider 验证演示任务走完整九态链路并可被取消；
- 停止接收新调用、安全关闭、超时后选择以及强制退出必须有用户决定 ID；
- 契约与表现层投射的映射测试保持穷尽；
- 测试不依赖 Rust、Electron、FFI、网络、SQLite 或真实 Unity。

## 修订记录

- 2026-09-02：B1 候选契约。四方法最小面：`application.getSnapshot`、`task.list`、
  `task.get`、`task.requestCancellation`。
- 2026-09-04：F2 扩展。新增 `environment.getSnapshot`（对齐 B6 环境检测 spike 的在场
  事实词表）与 `task.startDemo`（能力门控的演示任务命令）；原"B1 不加入……"限制段落
  改为"版本与演进"增长模型；新增"与表现层的衔接"与对应验证门槛。
