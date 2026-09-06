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
