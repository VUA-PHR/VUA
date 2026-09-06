---
proposal: 005
title: 产物模式三命令的协议登记分工（W8 域内冻结已落地）
status: 提出
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
