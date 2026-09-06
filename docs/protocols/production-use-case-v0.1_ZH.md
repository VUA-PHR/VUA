# VUA 生产用例契约 v0.1

[English](production-use-case-v0.1_EN.md) | [简体中文](production-use-case-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（2026-09-07，M3 验收）**。冻结前置四项已交付并核实：
> ① 七方法精确请求/响应 Schema（`schemas/amf-production/v0.2/methods/`，T1）；
> ② TS/Rust 共用固定 JSON 向量（`schemas/amf-production/v0.2/vectors/`，5 正 3 负）；
> ③ Provider 与 Gateway 双向契约测试（`crates/provider-host/tests/m3_vectors.rs` 与
> `apps/desktop/src/electron/m3-vectors.test.ts` 消费同一向量目录）；
> ④ 真实 Electron → Rust → Unity 冒烟（I-1 真机矩阵 16/16 格通过，证据
> `_local_w1/`；合并 5ccace6）。
> 历史：2026-09-06 曾撤回 2026-09-05 的冻结声明（评审核实真实 TS/Rust 参数面 6/7
> 不一致，请求/响应 Schema 与跨语言固定向量缺失——"冻结"名不副实，恢复候选是诚实
> 纪律的必然结论）。2026-09-05 达成的词表、生命周期-任务映射、确认/恢复纪律保留为
> 候选基线并经本轮核实后随冻结生效。域引用形状（`planId`/`inspectionId`/
> `buildRecordId` 优先于路径重复提交）与 BuildRecord 版本化证据摘要已随 T1 切片修订。
> 范围：第一个生产纵向用例（合成 Avatar + 一件衣装；`.unitypackage` 直接导入与本地 VPM
> 制作/安装双素材入口）的前后端命令与查询面
> 更新：2026-09-07
> 规范效力：F3 表现层与 B3 应用实现的对齐基线；方法名在 application-contract v0.1 方法表
> 登记（引入 = B3/F3），值语义以本文档为准

## 生命周期与任务机制

工作流阶段沿用既有词表：`inspect → plan → await_confirmation → snapshot → execute →
validate → completed`，异常落 `recover` / `failed` / `failed_recoverable` / `expired`。
每个生产命令创建标准任务（九态、commandId 幂等、事件 + revision、可取消）——任务中心与
车间轨道无需特判。阶段词表与渲染层 `strings.workflowStage` 及 Unity Bridge v1 保持
一致;漂移与超时是运行期事实,映射到 `failed_recoverable` / `expired` 运行态,不新增状态。

## 双素材入口

`source.intake` 两个取值,对齐
[素材入口协议 v0.1](material-intake-v0.1_ZH.md) schema 的 `mode` 枚举：

- `direct_unity_package`：来源 `.unitypackage` 原样导入目标项目；
- `local_reusable_vpm`：在隔离 Unity 暂存项目中制作的 `local-reusable` VPM 包，经 VUA
  `vrc-get` 包管理器安装。

（草案临时词 `unitypackage_direct` / `local_vpm` 退役；GLM/frontend `b3318e0` 已对齐
端口、fixture、入口默认值与四语言表。）

素材文件选择经 Kernel 显式文件对话框动作（`vua:dialog:pick-material-source` preload
面）；Renderer 不持有文件系统句柄，Kernel 在转交 Provider 前解析 `source` 引用。

## 词表冻结

### Build Record：权威与显示是两套词表

- **权威（契约事实）**——`BuildRecordAuthorityStatus`，`BuildRecordV01`
  （`build_record.rs` v0.1）的五态：`succeeded` / `succeeded_with_warnings` / `failed` /
  `cancelled` / `recovered`。记录同时携带结构化字段 `restoreAttempted: boolean` 与
  `restoreSucceeded: boolean | null`（仅在尝试过恢复时存在）。
- **显示（投影）**——`BuildRecordDisplayStatus` 四态：
  `completed` / `aborted` / `rolled_back` / `rollback_failed`，按以下冻结映射派生：

| 权威状态 | 快照证据（restoreAttempted / restoreSucceeded） | 显示 |
| --- | --- | --- |
| `succeeded` | — | `completed` |
| `succeeded_with_warnings` | — | `completed`（警告经 facts/diagnostics 呈现） |
| `failed` 或 `cancelled` | false / —（**未突变即中止**） | `aborted` |
| `failed` | true / true | `rolled_back` |
| `failed` | true / false | `rollback_failed` |
| `cancelled` | true / true | `rolled_back`（取消事实经 `run.cancelled` 呈现） |
| `recovered` | — | `completed`（经恢复完成） |

`aborted`（冻结时新增，GLM/frontend `b3318e0`）诚实覆盖"已检查但未执行——未产生任何
变更"；`completed` 与 `rolled_back` 对此都不成立。

### 发现、可计划性与计划差异

B 侧采纳渲染层词表:`InspectionFindingKind`（`compat` / `missing` / `conflict`）、
`Plannability`（`plannable` / `needs_attention` / `not_plannable`）、`PlanDiffKind`
（`added` / `changed` / `resolved`）。素材入口检查产出的可执行风险证据以携带
`recoverable` / `retryable` 标注的发现形式上报。

### 阶段映射（B 步骤种类 → 工作流阶段）

| B 步骤种类（`MaterialIntakeStepKind`） | 工作流阶段 |
| --- | --- |
| `verify_source` | `inspect` |
| `create_snapshot` | `snapshot` |
| `import_unity_packages` | `execute` |
| `create_local_vpm_package` | `execute` |
| `preview_vpm_install` | `execute` |
| `apply_vpm_install` | `execute` |
| `validate_minimum_structure` | `validate` |
| `write_build_record` | `completed` |

### Facts 不透明

`BuildRecordFacts`（snapshot / bridgeJob / localVpm / validation）以对应 Rust 证据节的
JSON 序列化形式传输；`bridgeJob` 序列化**全部** Bridge 作业，而非最后一个。渲染层原样
展示。

## 方法面（commandId 幂等；查询以外全部创建任务）

| 类别 | 方法 | 语义 |
| --- | --- | --- |
| 命令 | `production.startInspection` | 对素材 + 目标组合启动 Inspect,产出兼容/缺失证据 |
| 查询 | `production.getInspection` | 读取一份检查结果（证据、可计划性结论） |
| 命令 | `production.requestPlan` | 从检查结果推导执行计划（阶段、风险、预估） |
| 查询 | `production.getPlan` | 读取一份计划供审阅 |
| 命令 | `production.confirmPlan` | 用户确认计划;进入 snapshot → execute → validate 链 |
| 命令 | `production.recover` | 恢复 `failed_recoverable` / `expired` 结果（continue / rollback,携带用户决定 ID） |
| 查询 | `production.getBuildRecord` | 读取最小 Build Record（结果、阶段、证据） |

## 确认与恢复纪律

- `confirmPlan` 前的计划审阅是独立的用户阶段:确认绑定计划 revision,计划变化即失效
  （`expired` 运行态）——前端诚实呈现"确认已过期",绝不自动重确认;
- `recover` 的 `continue` 与 `rollback` 都必须携带 Kernel 生成的用户决定 ID（与 Provider
  关闭协议同一纪律）;恢复是任务,不是瞬时动作;
- 取消语义遵循全局任务契约:请求取消不等于已取消——任务在安全边界结束后,界面才呈现
  取消完成;
- 回执仅在 SUCCEEDED 且 plan 哈希、项目、来源身份一致时重放;失败与取消的运行以
  attempt 后缀的新记录 ID 全新重试,并配尝试唯一的恢复快照（B3 执行器契约,
  material-intake v0.1）。

## 能力与验证门

- 每个方法按 `production.*` 能力逐操作门控;不可用条目不渲染;
- 模拟 Provider 必须能脚本化全部五种生命周期呈现:成功、取消、漂移
  （`failed_recoverable`）、超时（`expired`）、回滚（recover → 回滚成功/失败）;
- F3 验收 = 表现层对模拟 Provider 覆盖全部五种呈现,真实两端在 M3 集成门复验;
- 冻结时真机状态:direct 路径与陈旧指纹拒绝已对真实 Unity 2022.3.22f1 通过;
  local_reusable 切片已端到端通过（暂存模板 + Bridge 物化 + 确定性发布 + 真实
  vrc-get 安装 + 目标验证）。

## 修订记录

- 2026-09-07:**冻结（M3 验收）。** 四项冻结前置全部交付核实（七方法 Schema、共用
  固定向量、双端契约测试、I-1 真机矩阵 16/16 格）；状态改「已冻结」。撤回历史保留
  于状态段（诚实纪律），不删除。
- 2026-09-06:**M3 修订（T1 落地）。** 七方法参数面改订为域引用形状:
  `startInspection` 四元组（路径一次性绑定）、`requestPlan = {inspectionId, mode}`、
  `confirmPlan = {planId, observedRevision, riskChoice, rememberForSession?}`、
  `recover = {taskId, decision, decisionId}`、查询面 `getInspection/getPlan/
  getBuildRecord` 按领域身份直取;`getBuildRecord` 响应改 v0.2 投影
  （evidenceSummary 取代 facts 不透明 JSON）;`inspectionId`/`planId` 领域身份
  登记表与 `riskChoice` 枚举（snapshot_and_continue/continue/cancel/not_required）
  随 `schemas/amf-production/v0.2/` 固定向量钉死。此修订为会签主稿
  （`m3-production-revision-b-draft` + F 会签）的实现落地;状态仍为 M3 候选,
  M3 验收时冻结。
- 2026-09-05:**冻结。** B 线回复与 F 线确认（`b3318e0`）的词表裁定:Build Record
  权威/显示双词表（含 `aborted` 显示态与快照证据映射表）;`SourceIntake` 对齐素材入口
  schema 枚举（`direct_unity_package` / `local_reusable_vpm`）;新增阶段映射表;facts
  定义为不透明 JSON 且 `bridgeJob` 携带全部作业;batchmode `ImportPackage` 空操作已
  记录——batchmode 执行改用 `materialize_extracted_package` Bridge 操作
  （unity-bridge v1）。
- 2026-09-04:B3/F3 候选草案。七方法面、生命周期-任务映射、双素材入口、确认与恢复
  纪律、值语义种子（BuildRecordV01 / material-intake / 工作流阶段词表）。
