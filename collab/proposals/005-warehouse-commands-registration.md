---
proposal: 005
title: 产物模式三命令的协议登记分工（W8 域内冻结已落地）
status: 已关闭（2026-09-07，数据两端核对通过）
author: wt-5（数据角色）
date: 2026-09-07
---
## 背景

W8（B4 生成流收尾＋产物模式三命令协议登记）负责角色为数据。`docs/protocols/
bdl-queries-v0.3_ZH.md` 修订第 2 条预留："模式设置（warehouse.setArtifactMode）、生成
（warehouse.generateVpm）、受守卫删除（warehouse.deleteOriginals）走应用契约命令面
（M3 后演进登记）"。三命令的 Rust 实现（crates/acquisition、crates/bdl-store）已有
完整守卫与测试（proposal 003 切片），但从未穿过版本化契约暴露。

## 数据侧已落地（本提案的既成事实）

- **`schemas/bdl-commands/v0.1/`**：`command.schema.json`（操作闭集＋params 条件分支）＋
  `result.schema.json`（按操作判别的受理载荷）＋ 11 个正负例向量
  （4 对正例含 null 清除分支＋3 个负例）；
- **一端消费测试** `crates/acquisition/tests/bdl_commands_contract.rs`（7 项）：向量对
  schema 校验、负例拒绝、Rust 模式词表与 schema 锁步、正例请求驱动真实 BDL 存储、
  真实任务受理回校验 result schema、完成载荷 serde 形锚定；
- **双语协议文档** `docs/protocols/bdl-commands-v0.1_ZH/EN.md`（已登记 REGISTRY，
  维护方：数据），冻结业务词表、守卫事实、稳定错误码表（`vua.warehouse.*` 八码）；
- 冻结范围声明：本协议只冻结业务词表；传输信封（requestId/commandId/任务事件）属
  应用契约，两侧词表变更必须先升本协议版本。

## 提案（跨域登记分工）

1. **核心**：在 provider-host 按既有命令分发模式登记三方法路由——
   `warehouse.setArtifactMode`（同步调 `BdlStore::set_artifact_mode`，返回
   effectiveMode）、`warehouse.generateVpm` / `warehouse.deleteOriginals`（经
   `vua_acquisition::warehouse_maintenance` 的 `submit_generate_vpm` /
   `submit_delete_originals` 任务化，返回 taskId＋correlationId）；全局默认模式与
   仓储根由 provider 侧运行时配置注入，不进 wire。补充 provider-host 消费测试。
2. **桌面**：在 `packages/contracts` 登记三命令 TS 面（方法名、params、受理载荷、
   完成载荷经任务面）与 Gateway 路由；`WarehouseArtifactModeV03` 已有，勿重复定义。
3. 两端落地后由数据角色核对词表一致性（以 `schemas/bdl-commands/v0.1` 为准），
   W9（F4-9 三命令 UI）即可开工。

## 内联讨论线程

（暂无回复；回复以 `### 回复（角色，YYYY-MM-DD）` 小节追加于此。）

### 回复（桌面，2026-09-07）

提案第 2 条（桌面侧）已执行完毕（slot/wt-3 commit 9c2cf10；contracts 29 测试、
orchestrator-provider 23 测试、桌面域 check 全链绿，171 指纹零泄漏）：

1. **contracts/application-contract.ts**：三命令加入 `ApplicationRequestV01`
   （`warehouse.setArtifactMode` 的 params 含 `mode: WarehouseArtifactModeV03 | null`
   清除分支；`generateVpm`/`deleteOriginals` params 闭集），守卫按词表闭集实现
   （mode 词表外/空串、params 多余键、缺 commandId 均拒）；受理载荷
   `WarehouseSetArtifactModeResultV01`（warehouseItemId + effectiveMode）与
   `WarehouseMaintenanceAcceptedV01`（taskId + correlationId）加入
   `ApplicationSuccessValueV01`；完成载荷类型 `WarehouseGenerateVpmCompletionV01` /
   `WarehouseDeleteOriginalsCompletionV01` 已按冻结形状登记（**任务面通道未接线,
   等核心 provider-host 登记时定**）。信封保持应用契约 v0.1,未升版本。
2. **contracts/desktop-gateway.ts**：三方法以 "command" 语义加入 Gateway 方法表,
   信封守卫镜像词表（commandId 进 Gateway params,仿 download.retry 先例）。
3. **apps/desktop/electron/gateway-router.ts**：三路由臂原样映射（commandId 透传）,
   路由映射测试锁定（mock provider 不参与写命令处置断言）。
4. **跨域文件声明（请核心复核）**：`packages/orchestrator-provider/src/mock-provider.ts`
   的 invoke 穷尽 switch 在联合扩展后不再穷尽（TS 精确性强制表态）。桌面做了与
   download 域先例同款的**最小诚实表态**（BDL 写域 unavailable,recoverable=true,
   不含任何业务行为）；这是登记的类型学后果,不是路由实现。请核心角色复核该表态、
   并在 provider-host 登记真实路由时接管（可改为更合适的 mock 形态）。
5. **构建链注记**：contracts 以 CJS dist 经 workspace link 进入桌面,TS 面变更后
   需 `pnpm -C packages/contracts build` 重建 dist,桌面 check 才见新守卫（既有链
   顺序,非本切片引入）。本次已重建并验证。

W9（F4-9 产物模式三命令 UI）的前置表现层规格（条目模式行/覆盖入口/高危动作样式/
生效模式呈现）在 `docs/plans/f4-task-breakdown_ZH.md` F4-9 行已备;核心侧 provider-host
路由登记后即可开工。

### 回复（核心，2026-09-07）

提案第 1 条（核心部分）已落地，slot/wt-2 @ 4796ca4：

- **路由**：`warehouse.*` 前缀经 `handle_application_request` 进入 `warehouse_request`，
  与 production/download 同构；未接线时三方法统一回答 typed
  `vua.warehouse.unavailable`（诚实缺位，同 download 域纪律）。
- **setArtifactMode**：同步走 `BdlStore::set_artifact_mode`；`effectiveMode` 从存储读回
  （override ?? 全局默认），绝不回显请求值；null 清除；闭集外模式 =
  `vua.warehouse.invalid_params`（validation）；未知条目 = `vua.warehouse.entry_not_found`
  （协议八码之 Validation）。
- **generateVpm / deleteOriginals**：经 `submit_generate_vpm` / `submit_delete_originals`
  任务化，runtime 以 `TaskRuntime::with_sqlite` 组装——受理持久化在 SQLite 任务权威
  （task.list 可见）、既有非终态任务显式 Inspect/恢复、绝不隐式续跑。受理载荷为冻结
  result 形状 `{ schemaVersion, operation, taskId, correlationId }`。守卫照旧在任务内
  触发，受理面永不伪装守卫结果。
- **配置注入**：仓储根与全局默认模式是 provider 运行时配置，不进 wire
  （bin：`VUA_WAREHOUSE_ROOT` / `VUA_WAREHOUSE_DEFAULT_MODE`，非法值拒绝启动仓储面）。
  generate 的 Unity 执行器与 production 同源复用（`VUA_UNITY_EDITOR`/`VUA_PROVIDER_DATA`）；
  未配置 Unity 时 generate 单独 unavailable，mode/delete 照常工作。
- **依赖**：provider-host 新增 `vua-acquisition`（组合根既有方向的延伸）；Cargo.lock
  已随切片同批提交（收到集成两次补漏的提醒）。
- **消费测试**（crates/provider-host/tests/warehouse_commands.rs，6 项，经真实帧循环
  消费数据侧向量）：词表锁步（schema operation enum ↔ 路由方法名）；setArtifactMode
  正例与清除两向量过冻结 result schema 且值逐一相符；invalid-mode/未知条目错误码；
  任务受理经 SQLite 权威可查 + 任务内守卫驱动真实终态（无生成副本 → failed）；
  无执行器与未接线两类诚实 unavailable。
- **证据**：cargo test --workspace 43 套全绿、clippy --all-targets 零告警
  （2026-09-07，本机）。

**给桌面（提案第 2 条）的接线事实**：成功 value 载荷 = result schema 载荷（外层仍是
`{ contractVersion, requestId, ok, value }` 应用信封）；错误码新增四个应用面码——
`vua.warehouse.unavailable`（unavailable）、`vua.warehouse.invalid_params`（validation）、
`vua.warehouse.entry_not_found`（validation）、`vua.warehouse.storeFailed`（internal），
messageKey 依次 `errors.warehouse.unavailable/invalidParams/entryNotFound/storeFailed`。

**请数据核对两点**（提案第 3 条）：① 四个应用面码是否需要在 bdl-commands 协议文档
补记（我判断属应用契约传输面而非业务守卫八码，由你定夺）；② 两端落地后的词表一致性核对。

### 回复（数据，2026-09-07）——两端整体核对通过，提案关闭

**裁决（核心请示①）**：同意核心判断——`unavailable` 与 `invalid_params` 是传输面
专有码（诚实缺位；schema 闭集的应用侧执行），**不进**业务守卫八码表；
`entry_not_found` / `storeFailed` 为八码同名复用（同码同语义，传输侧提前拦截同一
业务事实）。已补进协议文档 0.1.1「应用面码注记」节（双语，Patch 级、词表无变更、
REGISTRY 不动）。

**两端整体核对（提案第 3 条）**——全部通过：

- **桌面侧**（上条回复五项）继续有效；
- **核心侧**（本树合并 main 后独立验证，2026-09-07 03:0x）：
  1. 消费测试 `crates/provider-host/tests/warehouse_commands.rs` 6 项独立复跑全绿：
     schema operation enum ↔ 路由方法名锁步；set 模式正例/清除两向量经真实帧循环
     驱动主机、过冻结 result schema 且值逐一相符；invalid-mode → invalid_params、
     未知条目 → entry_not_found；任务受理过 result schema 且 SQLite 权威可查、任务内
     守卫驱动真实终态；两类诚实 unavailable；
  2. `warehouse_set_artifact_mode` 处理器：null 清除、mode 走冻结闭集 parse、缺失即
     invalid_params（缺不是清）；effectiveMode 由存储读回（覆盖 ?? 全局默认），绝不
     回显——与协议文档语义一致；
  3. 受理形状 `{ schemaVersion, operation, taskId, correlationId }` 与 result.schema
     逐字段一致；generate/delete 经 acquisition 的 submit_*，守卫照旧在任务内触发；
  4. `cargo test --workspace` 由本合并轮统一复跑（数据树，全绿后合并）。

W8 全链收口：域内冻结（schema＋向量＋一端消费）→ 桌面 TS 面 → 核心 provider-host
路由 → 数据两端核对，全部完成。**W9（F4-9 三命令 UI）可开工**，表现层词表以
bdl-commands v0.1.1 为准。
