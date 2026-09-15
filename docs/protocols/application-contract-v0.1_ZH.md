# VUA 应用契约 v0.1

[English](application-contract-v0.1_EN.md) | [简体中文](application-contract-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（M2，2026-09-04）——稳定 Gateway v1**
> 范围：Electron Kernel 与 Orchestrator Provider 之间的应用语义
> 更新：2026-09-04
> 规范效力：约束 Kernel、Provider 与 Renderer 实现；破坏性变更必须升版本号，
> 新增方法按"版本与演进"登记并记入修订记录

## 目的与边界

本契约定义与托管、FFI、进程和消息传输无关的应用值。Electron Main/Kernel 把允许的 Gateway
调用映射到本契约；Provider 把本契约显式映射到 Rust 应用用例。Renderer 只消费经 Kernel
映射后的 Gateway 面，不接触 Provider 生命周期、Rust 类型、SQLite 行、journal 载荷或子进程
消息。

版本值为字符串 `0.1`。任何请求、响应、事件、握手和生命周期结果都携带该值；收到未知版本
时明确拒绝。

## 版本与演进

方法面随纵向切片增长，本文档是唯一登记处：新增方法必须在此登记，并写明所属用例、端口与
能力门控。本契约已于 M2（2026-09-04）冻结为稳定 Gateway v1：此后破坏性变更必须升版本号；
新增方法保持增量登记，记入修订记录并在修订说明中声明向后兼容性。

## 方法面

| 种类 | 方法 | 语义 | 引入 |
| --- | --- | --- | --- |
| Query | `application.getSnapshot` | 返回应用 revision 与操作级能力快照 | B1 |
| Query | `task.list` | 返回当前可见任务的权威快照集合 | B1 |
| Query | `task.get` | 返回一个任务的权威快照 | B1 |
| Command | `task.requestCancellation` | 对稳定任务实例提交单调、幂等的取消意图 | B1 |
| Query | `environment.getSnapshot` | 返回双辖区的环境在场事实快照（只读） | F2 |
| Command | `task.startDemo` | 能力门控的演示命令：创建一个可观察、可取消的演示任务 | F2 |
| Command | `production.startInspection` | 启动首个生产用例的 Inspect（双素材入口；候选） | B3/F3 |
| Query | `production.getInspection` | 读取检查结果（兼容/缺失证据） | B3/F3 |
| Command | `production.requestPlan` | 基于检查结果生成执行计划 | B3/F3 |
| Query | `production.getPlan` | 读取计划供审阅 | B3/F3 |
| Command | `production.confirmPlan` | 确认计划，进入 snapshot → execute → validate 执行链 | B3/F3 |
| Command | `production.recover` | 对失败/过期结果执行恢复（continue / rollback） | B3/F3 |
| Query | `production.getBuildRecord` | 读取最小 Build Record | B3/F3 |
| Query | `overlay.getSnapshot` | 返回 overlay 一屏的只读读面快照：任务卡＋生产状态卡＋下载卡投影 | M7 |
| Command | `release.openForHandoff` | 官方 SDK 上传交接（tasked）：buildId → 任务九态 → 交接事实文档（无上传状态字段） | M7 |

`production.*` 七方法是[生产用例契约 v0.1](production-use-case-v0.1_ZH.md)（B3 候选草案）的
登记面：生命周期-任务映射、双素材入口、确认与恢复纪律、值语义种子以该文档为准；经 B3
实现冻结前不约束任何一侧的实现。

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

任务正常完成（`succeeded` / `succeeded_with_warnings`）时，快照携带可选 `result` 字段：
任务实际交回的 Done payload **原样**，与 `task.completed` 事件的 `payload` 同源同值（两者
投影同一份任务存储结果，快照与事件两个通道永不相互矛盾）。冻结不变量：`failed` /
`cancelled` / 非终态 / `inspect_required` 快照**恒不带** `result`（失败事实走 `error`
字段）；`result` 恒为对象，null 结果按字段缺席投影，绝不投影为 `null` 值。快照面对
`result` 内部形状零承诺——形状由产出该任务的操作词表定义并随其演进（`project-ops` 族
载荷自描述 `schemaVersion`/`operation`；production 族载荷形状归生产用例词表），因此本面
与各操作词表演进解耦。该字段为向后兼容增量（2026-09-12，BOARD #22 result 回流裁决、
提案 020）；机器可读面与正负例向量见
`schemas/application-contract/v0.1/`。

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

## Overlay 读面语义

`overlay.getSnapshot`（M7，提案 017 批 1–2）是桌面 overlay 的按需轮询查询：一次返回
overlay 一屏所需的只读投影——**任务卡**（任务存储投影，最旧优先：taskId/state/
correlationId）、**生产状态卡**（production-use-case v0.2 plan/record 读面字段裁剪：
当前 plan＝`createdAt` 最新文档、最近 Build Record＝`finishedAt` 最新文档，「当前/最近」
语义由核心服务权威侧定义，两半独立可空，权威面无事实即 `null`，绝不合成行）与
**下载卡**（017 批 2：任务存储中 `dl-` 前缀**非终态**尝试的字段裁剪投影
downloadId/state/updatedAt，入队顺序；呈现策略＝「有进行中项时呈现」，空集＝诚实空卡；
无字节进度——进度在任务事件通道，快照不发明，与主线 TaskSnapshot 同基准；完成交付
保留其权威消费面 `downloads.listCompleted`〔导入页〕，不进 overlay 一眼面）。投影
是纯函数：**不带查询时刻与聚合 revision**——两次无变更的查询观察同一载荷，轮询永不
改变它观察到的东西。卡片词表（任务九态、plan 生命周期、record 状态、下载尝试态）从
其属主冻结面原样透传，本面不重列。`downloadCard` 为向后兼容可选增量（批 1 世代快照
无此字段仍有效）。overlay 携带**零会话身份**：查询与主线不可区分；语义动作走
既有命令面（同一受理路径、同一九态纪律），不新增 overlay 专有写词表。生产读面未接线
时该方法回答类型化 `vua.overlay.unavailable`——诚实缺席，绝不以空快照伪装。机器可读
面与正负例向量见 `schemas/application-contract/v0.1/overlay-snapshot.schema.json`。

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
- 2026-09-04：**M2 冻结**。B1/F2 面经真实整合验收（受监督 Provider 进程、SQLite 权威
  状态、五项交付证据）后提升为稳定 Gateway v1；`production.*` 面仍为 B3/F3 候选草案。
- 2026-09-04：登记生产用例面（B3/F3 候选草案）。`production.*` 七方法，生命周期、双素材
  入口与值语义见[生产用例契约 v0.1](production-use-case-v0.1_ZH.md)。
- 2026-09-12：任务快照 `result` 回流增量（BOARD #22 归因裁决采纳方案①；提案 020）。
  任务快照新增**可选** `result` 字段：任务正常完成时在快照通道回流 Done payload 原样，
  与 `task.completed` 事件 payload 同源同值；失败/取消/非终态快照恒不带。向后兼容增量：
  冻结快照形状、不变量与正负例向量（`schemas/application-contract/v0.1/`，六向量）由
  核心随批冻结；`task.get`/`task.list` 投影消费测试与演示任务取消负例随批（provider-host
  `task_snapshot_wire`）。背景：import-copy 渲染层窄化期望结果文档而 live wire 只见受理
  回执——结果文档无通道到渲染层（跨批衔接缺口，F6 live 诚实降级）。
- 2026-09-12：登记 overlay 读面（M7，提案 017 批 1，桌面 §4 三项表态齐后核心领取）。
  新增 `overlay.getSnapshot` 查询：任务卡＋生产状态卡的按需轮询只读投影，纯函数面
  （无查询时刻/聚合 revision），零 overlay 会话身份，语义动作归既有命令面；生产读面
  未接线＝类型化 `vua.overlay.unavailable` 诚实缺席。向后兼容增量（新方法登记，既有
  面零变化）：机器可读面与六向量（`overlay-snapshot.schema.json`，3 正 3 负）由核心
  随批冻结；消费测试随批（provider-host `overlay_wire` 帧环＋`@vua/contracts` 守卫）。
- 2026-09-15：overlay 读面批 2（M7，提案 017 批 2；触发＝桌面消费批 1 已落地
  （DesktopOverlaySurface 消费 `overlay.getSnapshot`），017「维持等消费」条件清除）。
  `overlay.getSnapshot` 返回面新增**可选** `downloadCard` 字段：任务存储中 `dl-`
  前缀非终态尝试的字段裁剪投影（downloadId/state/updatedAt，入队顺序），呈现策略
  ＝「有进行中项时呈现」；无字节进度（进度在任务事件通道，快照不发明——负例向量
  钉死）；完成交付保留权威消费面 `downloads.listCompleted`（导入页），不进 overlay
  一眼面。向后兼容增量（既有面零变化，批 1 世代快照无此字段仍有效）：机器可读面与
  八向量（`overlay-snapshot.schema.json`，4 正 4 负）由核心随批冻结；消费测试随批
  （provider-host `overlay_wire` 帧环＋`@vua/contracts` 守卫）。检测卡照桌面表态
  不进 overlay 首屏（017 §5 引用不复制），本批不落。
- 2026-09-16：登记 `release.openForHandoff`（M7，提案 023 核心冻结批；硬前置①两半
  已齐——桌面表态 469ef5c 经第 52 波入库＋产线表态五点〔wt-4 批随其入库〕，②③④随
  本批，⑤轮空——Bridge 命令面以工程已打开为前提，交接属编辑器进程生命周期管理，
  实现域＝进程/窗口面，unity-bridge v3 零增操作）。官方 SDK 上传交接 tasked 命令：
  params 闭集单键 `{buildId}`（核心裁决修订 023 §3 草案——工程身份权威在 build-record
  面，params 重复携带＝双源对账零增益）；受理回执照 `inspection.requestRun` 形状；
  完成判定＝Bridge handshake 到达（001 链），聚焦不进契约事实，统一 task 九态单形态；
  succeeded 快照 result 携带交接事实文档（schemaVersion/buildId/projectId/editor/
  occurredAt 五键闭集，**无上传状态字段**——诚实纪律 1/2 由形状钉死，负例向量把守）；
  错误码闭集四码 `vua.release_handoff.*`（unavailable/invalid_params/build_unknown/
  editor_unresolved）。向后兼容增量（新方法登记，既有面零变化）：机器可读面与六向量
  （`schemas/release-handoff/v0.1/`，3 正 3 负）由核心随批冻结；消费测试随批
  （provider-host `release_handoff_wire` 帧环＋`@vua/contracts` 守卫＋mock 缺席分支）。
  路由未接线＝`vua.release_handoff.unavailable` 诚实缺席（实现域〔产线 port＋核心
  use case〕归后续切片），绝不伪造受理/交接事实。词表详见
  [release-handoff 协议 v0.1](release-handoff-v0.1_ZH.md)。
