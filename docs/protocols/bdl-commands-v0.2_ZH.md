# BDL 仓储写命令协议 v0.2（产物模式三命令＋全局默认写）

[English](bdl-commands-v0.2_EN.md) | [简体中文](bdl-commands-v0.2_ZH.md)

> 文档版本：0.2
> 状态：**已冻结（域内业务词表）**（2026-09-07）——provider-host 路由登记待核心
> 执行（U8 裁决 (a)：当前开关门控形态 M3 先行；本 v0.2 词表随 M4 完整形态实施）；
> 完成前不得声称端到端可用
> 机器可读词表：`schemas/bdl-commands/v0.2/`（Schema＋正负例向量；消费测试
> `crates/bdl-store/tests/global_default_v02.rs`；v0.1 目录保留勿改）
> 范围：v0.1 三命令（`warehouse.setArtifactMode` / `warehouse.generateVpm` /
> `warehouse.deleteOriginals`）＋ U8 裁决新增的全局默认写
> （`warehouse.setGlobalDefaultMode`，两级选项语义的全局层）
> 所有权边界：`docs/architecture/bdl_ZH.md`（BDL 是 AMF 私有本地模块）；写命令的服务端
> 事实（守卫、任务化、审计）实现在 `crates/acquisition`（维护流）与 `crates/bdl-store`
> （存储面）
> 更新：2026-09-07（v0.2：新增全局默认写；两级选项＋持久化位置决策落地）

## v0.2 修订（相对 v0.1）

U8 用户裁决（实验设置完整形态随 M4 实施）的两级选项语义：

1. **新增 `warehouse.setGlobalDefaultMode`**（同步）：持久化两级选项的全局层。
   `params: { mode }`，`mode ∈ { use_original_unitypackage, generate_vpm }`——
   **无 null**：全局默认恒有值（首次写入前由 provider 环境注入的初始默认规则）。
   受理载荷即结果：`{ globalDefaultMode }`——从 BDL 读回的持久事实，绝不回显请求值。
2. **持久化位置决策（007 备案收口）**：全局默认持久化在 **BDL `bdl_meta`**
   （key `warehouse_global_default_mode`）——模式是 AMF 仓储域业务事实，BDL 是
   AMF 私有持久层；provider 环境变量降级为「首次写入前的初始默认」。重开存储后
   持久值保持；解析恒为 `条目覆盖 ?? 全局默认`，读取时动态，绝不快照。
3. **条目级三命令不变**：params/受理/完成载荷与 v0.1 完全一致（含 null 清除语义）。

## 冻结范围与分工

本协议冻结命令的**业务词表**：操作闭集、params、受理载荷、任务完成载荷形状与稳定
错误码。传输信封（requestId / commandId / 任务事件）属版本化应用契约，由核心角色在
provider-host 登记方法路由；渲染层 TS 面由桌面角色登记。任何一侧词表变更必须先升
本协议版本。

## 命令语义

1. **`warehouse.setArtifactMode`**（同步）：条目级覆盖设置/清除。
   `params: { warehouseItemId, mode }`，null = 清除（回落 `覆盖 ?? 全局默认`）。
   受理载荷即结果：`{ warehouseItemId, effectiveMode }`——查询期事实。
2. **`warehouse.setGlobalDefaultMode`**（同步，v0.2 新增）：见修订 1。两级选项的
   全局层持久化；条目覆盖优先于它。
3. **`warehouse.generateVpm`**（任务化）/ **`warehouse.deleteOriginals`**（任务化）：
   与 v0.1 完全一致——守卫、审计、完成载荷（任务面投递）均不变。

## 服务端守卫（服务端事实，永不是客户端断言）

- 生成仅在有 `generate_vpm` 生效模式、持有原始素材、且尚无生成副本时可运行
  （生成副本永不静默替换——删其 VPM 副本才能重生成）；
- 删除仅在 `generate_vpm` 生效模式且生成副本物理存在并通过内容身份校验时可运行；
  逐副本先删文件后删行，中断可重试；
- 取消在副本边界观察；全局默认写入不影响任何在途任务。

## 稳定错误码

与 v0.1 相同的八码表（`invalid_state` / `generated_artifact_missing` /
`no_original_material` / `already_generated` / `entry_not_found` / `generation_failed` /
`storeFailed` / `maintenanceIoFailed`），语义不变。应用面码注记
（`unavailable` / `invalid_params` 传输面专有；`entry_not_found` / `storeFailed`
复用）沿用 v0.1.1 的划分，`setGlobalDefaultMode` 的词表外模式同样归
`invalid_params`（传输面）。

## 依赖方向

```text
React View（设置-实验性完整形态 / 条目抽屉）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约（方法路由：核心登记）
  → AMF 应用服务（本协议的提供方；crates/acquisition / crates/bdl-store）
  → BDL 本地数据库（bdl_meta 持久化全局默认）
```
