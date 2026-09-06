# BDL 仓储写命令协议 v0.1（产物模式三命令）

[English](bdl-commands-v0.1_EN.md) | [简体中文](bdl-commands-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（域内业务词表）**（2026-09-07）——应用契约方法登记与两端接线在途
> （`collab/proposals/005-warehouse-commands-registration.md`）；完成前不得声称端到端可用
> 机器可读词表：`schemas/bdl-commands/v0.1/`（Schema＋正负例向量；一端消费测试
> `crates/acquisition/tests/bdl_commands_contract.rs`）
> 范围：`docs/protocols/bdl-queries-v0.3_ZH.md` 修订第 2 条预留的三个仓储写命令——
> `warehouse.setArtifactMode`、`warehouse.generateVpm`、`warehouse.deleteOriginals`
> 所有权边界：`docs/architecture/bdl_ZH.md`（BDL 是 AMF 私有本地模块）；写命令的服务端
> 事实（守卫、任务化、审计）实现在 `crates/acquisition`（维护流）与 `crates/bdl-store`
> （存储面）
> 更新：2026-09-07

## 冻结范围与分工

本协议冻结三命令的**业务词表**：操作闭集、params、受理载荷、任务完成载荷形状与稳定错误码。
传输信封（requestId / commandId / 任务事件）属版本化应用契约（`docs/protocols/
application-contract-v0.1_ZH.md`），由核心角色在 provider-host 登记方法路由；渲染层 TS 面
由桌面角色登记。两侧任何一侧的词表变更必须先升本协议版本。

## 三命令语义

1. **`warehouse.setArtifactMode`**（同步）：设置或清除条目级产物模式覆盖。
   `params: { warehouseItemId, mode }`，`mode ∈ { use_original_unitypackage, generate_vpm, null }`
   （null = 清除覆盖，动态解析回落 `覆盖 ?? 全局默认`；全局默认由服务层注入，不进 BDL）。
   受理载荷即结果：`{ warehouseItemId, effectiveMode }`——effectiveMode 是查询期事实。
2. **`warehouse.generateVpm`**（任务化）：为条目从 `original` 角色副本生成本地 VPM 包。
   `params: { warehouseItemId }`。受理载荷：`{ taskId, correlationId }`。
   完成载荷（任务面）：`{ correlationId, warehouseItemId, packageId, archiveRelativePath,
   archiveSha256 }`——archiveSha256 是发布档案的内容身份（`sha256:…`）。
3. **`warehouse.deleteOriginals`**（任务化）：受守卫删除条目的原始素材（审计性破坏操作，
   warehouse-layout 裁决 5）。`params: { warehouseItemId }`。受理载荷同上。
   完成载荷（任务面）：`{ correlationId, warehouseItemId, deletedCount, deletedRelativePaths,
   keptGeneratedSha256 }`。

## 服务端守卫（服务端事实，永不是客户端断言）

- 生成仅在有 `generate_vpm` 生效模式、持有原始素材、且尚无生成副本时可运行
  （生成副本永不静默替换——删其 VPM 副本才能重生成）；
- 删除仅在 `generate_vpm` 生效模式且生成副本物理存在并通过内容身份校验时可运行；
  逐副本先删文件后删行，中断可重试；
- 取消在副本边界观察；已完成副本保持一致，重试只处理剩余原始素材。

## 稳定错误码

| 码 | 类别 | 场景 |
| --- | --- | --- |
| `vua.warehouse.invalid_state` | Conflict | 生效模式不是 `generate_vpm` |
| `vua.warehouse.generated_artifact_missing` | Conflict | 生成副本缺失、不可读或内容身份不符 |
| `vua.warehouse.no_original_material` | Conflict | 条目无原始素材可生成 |
| `vua.warehouse.already_generated` | Conflict | 已有生成副本，拒绝再次生成 |
| `vua.warehouse.entry_not_found` | Validation | 未知条目 |
| `vua.warehouse.generation_failed` | ExternalFailure | 暂存链失败（携带底层码与原因） |
| `vua.warehouse.storeFailed` | Internal | BDL 存储故障 |
| `vua.warehouse.maintenanceIoFailed` | ExternalFailure | 维护流文件系统故障 |

所有维护失败均为可恢复错误（`recoverable: true`）；任务行进入失败态等待用户重试，
恢复不隐式续跑。

## 依赖方向

```text
React View（WarehousePage 产物模式操作）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约（方法路由：核心登记）
  → AMF 应用服务（本协议的提供方；crates/acquisition）
  → BDL 本地数据库（crates/bdl-store）
```
