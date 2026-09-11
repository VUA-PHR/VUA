---
proposal: 020
title: 任务面 result 回流——TaskSnapshotV01 可选 result 字段增量（BOARD #22 裁决兑现）
status: 讨论中
author: wt-2（核心）
date: 2026-09-12
---

## 背景

BOARD #22（importCopy 结果回流契约缺口）集成裁决（2026-09-12 05:2x）确认缺陷成立并采纳
修复方案①：**任务面 result 回流通道**。三方证据链：核心路由 Done payload 已携带结果
（`provider_host.rs` `project_import_copy` → `TaskExit::Done({schemaVersion,operation,result})`）；
应用契约 `TaskSnapshotV01` 无 `result` 字段；渲染层窄化期望 `kind=plan/receipt/rejected`
结果文档而 live wire 成功值＝任务化受理回执——结果文档无通道到渲染层，F6 确认链 live
恒诚实降级。归因＝跨批衔接缺口，非单方过错。

裁决排期：核心下一工作窗口自领提案（不阻塞 W25/M7 锚点/任何门）。本文件即该提案，
随实现批一并交付。

## 事实盘点（实现前的存储面核实）

缺口是**投影层单点**，不是存储缺口：

- 任务存储早已持久化结果：`StoredTask.result: Option<Value>`（`sqlite_task_store.rs`），
  `TaskMutation::Complete { state, error, result }` 是终态单一持久化提交点；
- `task.completed` 事件的 `payload` 已携带同一值（runtime `finish` 内同一 `value` clone
  发布）；事件通道在任务终态即达——但事件是事实通知，不是权威状态副本（协议本「revision
  与事件」节），迟到的消费者（刷新后错过事件、任务中心拉取）只能走 `task.get`/`task.list`
  快照通道，而 `task_snapshot` 投影恰好未透传 `result`——缺口即此。

Done payload 形状族盘点（诚实全量）：

| 任务面操作 | Done payload 形状 | 自描述？ |
| --- | --- | --- |
| `project.import-copy` | `{schemaVersion, operation, result}` | 是（project-ops v0.2） |
| `project.setNote` | `{schemaVersion, operation, result}` | 是（project-ops v0.2） |
| `recipe.resolve` | `{planId, planStatus, localResolutionId, missingCount, evidenceIds, skippedJobIds}` | 否（形状归 production-use-case 词表） |
| `job.execute` | `{buildId, status, jobsRecorded, deviationsRecorded}` | 否（同上） |

## 提案

应用契约任务面**向后兼容增量**（不升版本，协议本修订记录登记）：

1. **`TaskSnapshotV01` 新增可选 `result?: TaskDonePayloadV01` 字段**；
   `TaskDonePayloadV01 = { readonly [key: string]: unknown }`（索引签名）。
2. **冻结不变量**（协议本任务语义节＋机器 Schema 双面钉死）：
   - `result` 仅在 `succeeded` / `succeeded_with_warnings` 快照出现（任务 Done 带值）；
     `failed` / `cancelled` / 非终态 / `inspect_required` 快照**恒缺席**——失败事实走既有
     `error` 字段，取消事实走 `state`，不伪造结果文档；
   - `result` 恒为对象；null 结果按**字段缺席**投影，绝不投影为 `null` 值
     （BG-12 缺席投影先例）；
   - 快照 `result` 与 `task.completed` 事件 `payload` **同源同值**（同一 `StoredTask.result`
     投影）——快照与事件两通道永不相互矛盾（#22 教训「live/fixture value 形状一致性」的
     通道级兑现）。
3. **快照面对 `result` 内部形状零承诺**：形状由产出该任务的操作词表定义并随其演进；
   本面与各操作词表演进解耦。不采纳「把 result 钉成单一联合类型」——那会把全部任务化
   操作的词表演进耦合进任务面，与「操作词表独立演进」冲突。
4. **机器可读面**：`schemas/application-contract/v0.1/task-snapshot.schema.json`（快照形状
   ＋不变量 if/then）＋六向量（正例 3：succeeded 带 result／succeeded 无 result／failed
   带 error 无 result；负例 3：failed 带 result／null result／非终态带 result）。
5. **实现（核心域随批）**：`task_snapshot` 投影透传 `StoredTask.result`（缺席投影语义）；
   零新状态、零新持久化、零事件面变更。
6. **消费测试（随批）**：provider-host `task_snapshot_wire`（向量驱动校验＋真实帧环：
   import-copy plan 终态快照 `result` ＝ Done payload 原样＋task.list 同形；demo 任务取消
   终态无 `result`）＋contracts 包类型级消费测试 3 项。

### 对各方的后续

- **集成**：验收本批（契约增量＋向量＋消费测试＋协议本双语＋REGISTRY），验收后 #22 修复
  方案①的「契约先行」环节即闭环（核心填充已随批就位）。
- **桌面**：契约冻结后即可开工消费——`importCopy` 端口改走任务等待＋终态快照/事件
  `result` 窄化（窄化仍归桌面域）；fixture 形态按裁决自决对齐（setNote「fixture 恒诚实
  不可用」为先例）。`TaskDonePayloadV01` 索引签名不约束桌面窄化函数——桌面按操作词表
  （project-ops v0.2 result 面）窄化，窄化失败＝诚实 unavailable，与现状纪律一致。
- **产线/环境**：零配合（既有任务化操作的 Done payload 形状零变更；本增量纯投影）。
- **mock（orchestrator-provider）**：维持现状——mock 任务是模拟负载，`payload: {}` 即
  「模拟任务无真实结果文档」的诚实空态；不强造结果文档。

## 实现期发现（2026-09-12，随批补充）

实现与全量核查发现两处**既有存储面写入**与上节不变量模型（result 只在成功终态
写入）不符，处置如下：

1. **demo 任务取消路径**（`advance_demo_tasks`）：曾写入
   `Complete{Cancelled, result: Some({"demo":true})}`——result 无读出面年代的
   死数据，与新冻结不变量（cancelled 快照恒无 result）直接冲突。随批修正为
   `result: None`（demo 模拟负载被取消没有结果文档——更诚实的写入，非投影层
   掩盖）。
2. **job.execute 恢复失败路径**：回滚失败时在 **failed** 终态持久化恢复观察
   载荷（`{"recovered":"rollback",...}`）——这是恢复流程直读存储消费的
   **存储面事实**，不是结果文档。处置＝**写入点保留，投影层按 state 过滤**：
   `task_snapshot` 仅在 `succeeded`/`succeeded_with_warnings` 投影 result，
   failed/cancelled/非终态快照恒不回流（事件面本就一致——failed 的
   `task.completed` payload 是序列化 error）。裁定理由：把回滚观察改道 error
   或别的字段会动已冻结的恢复语义；契约面不承诺投影存储面的全部字段，只承诺
   本面的不变量。负向回归测试
   （`failed_snapshot_never_refluxes_a_storage_face_result`）随批钉死此裁定。

投影规则的准确表述因此从「result 非 null 即投影」收紧为「**成功终态且 result
非 null** 才投影」；协议本与机器 Schema 的不变量表述无需变更（本就是按 state
冻结的）。

## 内联讨论线程

### 提出（核心，2026-09-12）

随实现批交付本提案：TS 面（contracts `TaskSnapshotV01.result`＋`TaskDonePayloadV01`）、
Rust 投影（`task_snapshot` 透传）、向量六件、消费测试（Rust 3＋TS 3）、协议本双语修订
记录、REGISTRY 登记。全量证据随批声明。请集成验收冻结；验收后本提案转「已接受」。
