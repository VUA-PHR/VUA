# BDL 仓储写命令协议 v0.3（产物模式三命令＋全局默认写＋批量导入）

[English](bdl-commands-v0.3_EN.md) | [简体中文](bdl-commands-v0.3_ZH.md)

> 文档版本：0.3
> 状态：**已冻结（域内业务词表）**（2026-09-08）——provider-host `warehouse.import`
> 路由与 `importCorrelationId` 编排接线待核心执行（proposal 010 仲裁：v0.3 冻结
> 先行于 wire/挂点实现，M5 首批）；完成接线前导入命令不得声称端到端可用
> 机器可读词表：`schemas/bdl-commands/v0.3/`（Schema＋正负例向量；消费测试
> `crates/acquisition/tests/import_contract_v03.rs`；v0.1/v0.2 目录保留勿改）
> 范围：v0.2 五命令中的四命令（`warehouse.setArtifactMode` /
> `warehouse.generateVpm` / `warehouse.deleteOriginals` /
> `warehouse.setGlobalDefaultMode`）＋ M5 新增的批量导入
> （`warehouse.import`，proposal 010 仲裁路径 A）
> 所有权边界：`docs/architecture/bdl_ZH.md`（BDL 是 AMF 私有本地模块）；写命令的服务端
> 事实（守卫、任务化、审计）实现在 `crates/acquisition`（维护流与导入流）与
> `crates/bdl-store`（存储面）
> 更新：2026-09-08（v0.3：新增批量导入；生成命令审计链字段；术语裁定落实）

## v0.3 修订（相对 v0.2）

proposal 010 仲裁（路径 A：导入落库点 provider 编排；W18/W19 同批门序）的协议面：

1. **新增 `warehouse.import`**（任务化）：批量导入素材包文件夹。`params:
   { sourceFolders }`——Kernel 已解析的绝对路径数组（minItems 1），一个 folder＝
   一个素材包；一条命令＝一个批量导入任务（逐 folder 进度、folder 边界取消、
   失败快停保留已导入条目）。受理载荷与任务面命令同构：
   `{ taskId, correlationId }`。仓储根（warehouse root）是 provider 环境配置，
   **绝不是请求字段**；条目身份与显示名规则归导入器（与离线导入管线一致）。
   完成载荷（逐 folder 报告＋创建的条目身份）走应用契约任务面。
2. **`warehouse.generateVpm` 新增可选参数 `importCorrelationId`**（proposal 010
   承诺 6 的 wire 承载）：仅当生成任务由批量导入编排发起时携带——审计链回到
   来源导入任务；用户手动发起的生成绝不携带。受理回执可选回显该字段。词表外
   键仍是契约错误（additionalProperties: false）。
3. **术语裁定落实**（W15 走查硬裁定，BOARD #9）：本协议「VPM 副本」语形自此
   修正为「**VPM 包副本**」（VPM = VRChat Package Manager 管理器；VPM 包 =
   VPM package 被管理的包）。v0.2 冻结文本不追溯。
4. **既有命令语义不变**：条目级三命令与全局默认写的 params/受理/完成载荷、
   守卫、审计与 v0.2 完全一致（schemaVersion 随词表升为 "0.3"）。

## 冻结范围与分工

本协议冻结命令的**业务词表**：操作闭集、params、受理载荷、任务完成载荷形状与稳定
错误码。传输信封（requestId / commandId / 任务事件）属版本化应用契约，由核心角色在
provider-host 登记方法路由；渲染层 TS 面由桌面角色登记。任何一侧词表变更必须先升
本协议版本。

## 命令语义

1. **`warehouse.setArtifactMode`**（同步）：条目级覆盖设置/清除。
   `params: { warehouseItemId, mode }`，null = 清除（回落 `覆盖 ?? 全局默认`）。
   受理载荷即结果：`{ warehouseItemId, effectiveMode }`——查询期事实。
2. **`warehouse.setGlobalDefaultMode`**（同步）：两级选项的全局层持久化
   （bdl_meta）；条目覆盖优先于它。
3. **`warehouse.generateVpm`**（任务化，v0.3 参数扩展）：`params:
   { warehouseItemId, importCorrelationId? }`。守卫、审计、完成载荷（任务面
   投递）与 v0.2 一致；`importCorrelationId` 仅由导入编排填充（见修订 2）。
4. **`warehouse.deleteOriginals`**（任务化）：与 v0.2 一致。
5. **`warehouse.import`**（任务化，v0.3 新增）：`params: { sourceFolders }`。
   导入器逐 folder 复制素材包进仓库语义树（原始件不触碰——副本导入语义），
   逐 folder 进度事件；folder 边界取消（Cancelled 出口，持久部分状态经
   `warehouse.listEntries` 可查）；失败快停保留已导入条目。完成载荷＝
   逐 folder 报告（创建的条目身份、跳过的源文件）。导入守卫见下节。

## 服务端守卫（服务端事实，永不是客户端断言）

- 生成仅在有效模式为 `generate_vpm`、持有原始素材、且尚无生成 VPM 包副本时
  可运行（生成副本永不静默替换——删除其 VPM 包副本才能重生成）；
- 删除仅在 `generate_vpm` 生效模式且生成 VPM 包副本物理存在并通过内容身份校验
  时可运行；逐副本先删文件后删行，中断可重试；
- 取消在副本边界观察；全局默认写入不影响任何在途任务；
- **导入守卫（v0.3 新增）**：源 folder 必须有名（非根/非盘符——`invalidSource`）、
  不得位于仓库根之内（`invalidSource`）；复制按文件逐份校验大小
  （`copySizeMismatch`）；源 folder 命名冲突由导入器生成稳定条目身份解决，
  绝不派生自显示名。

## 稳定错误码

与 v0.2 相同的八码表（`invalid_state` / `generated_artifact_missing` /
`no_original_material` / `already_generated` / `entry_not_found` / `generation_failed` /
`storeFailed` / `maintenanceIoFailed`），语义不变。应用面码注记
（`unavailable` / `invalid_params` 传输面专有；`entry_not_found` / `storeFailed`
复用）沿用 v0.1.1 的划分；v0.3 新增导入错误码：`vua.warehouse.importIoFailed`
（ExternalFailure）、`vua.warehouse.invalidSource`（Validation）、
`vua.warehouse.copySizeMismatch`（ExternalFailure）——均携带 folder 与 reason
参数，`recoverable=true`。

## 依赖方向

```text
React View（仓储获取区「导入素材包」/ 设置-实验性 / 条目抽屉）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约（方法路由：核心登记）
  → AMF 应用服务（本协议的提供方；crates/acquisition / crates/bdl-store）
  → BDL 本地数据库（bdl_meta 持久化全局默认；warehouse_items 等条目事实）
```
