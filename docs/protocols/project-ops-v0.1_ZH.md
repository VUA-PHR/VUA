# VUA 项目操作写面契约 v0.1

[English](project-ops-v0.1_EN.md) | [简体中文](project-ops-v0.1_ZH.md)

> **⚠️ 已被 v0.2 取代（2026-09-12）**：`project.setNote` 备注写命令
> （D-6 桌面确认裁定 A，proposal 013 内联线程）随核心升版批冻结。现行
> 规范见 [project-ops-v0.2_ZH.md](project-ops-v0.2_ZH.md)；本文仅作历史
> 保留，对应 `schemas/project-ops/v0.1/`（勿改；import-copy 形状在
> v0.2 中零变更）。
> 文档版本：0.1
> 状态：**已取代（→ v0.2）**（2026-09-12；原状态：已冻结 2026-09-09——
> 词表行＝独立 project-ops 族（`project.`
> 前缀；与 013 检测读面平行、读/写分线）；实现批经集成验收合并（226dd41，
> 复跑 428/0）＋七项拒绝码闭集仲裁确认）
> 机器可读词表：`schemas/project-ops/v0.1/`（command / result 两 Schema＋
> 正例 2＋负例 2；实现测试 `crates/project-manager/tests/import_copy.rs`）
> 范围：M6 T-A 延伸——「导入为 VUA 管理的副本」任务化写路径（用户裁决 2026-
> 09-09 项 9：工程上＝复制导入、体验上＝迁移到了 VUA；与项 6 迁移语义并存，
> BOARD U8 问④销账）。
> 所有权边界：crate 实现＝`crates/project-manager`（`import_copy`）；provider
> 路由归核心域；桌面 T-C 确认链交互归桌面域。
> 更新：2026-09-09

## 操作面（单词表行、两阶段）

| 操作 | 语义 | 额外参数 |
| --- | --- | --- |
| `project.import-copy` | 把一个管理器登记的项目**复制**为新的 VUA 管理项目；原项目全程只读、不取锁、不被标记 | `phase`：`plan` / `apply` |

公共参数：`sourcePath`（登记路径；未登记＝拒绝）、`targetParentDirectory`、
`targetProjectName`。`phase=apply` 追加 `confirmedPlanDigest`——把用户确认
绑定到确切计划状态。

- **plan**：测量复制范围（磁盘占用实际统计 `estimatedBytes`＋排除清单
  `excludedEntries`＋目标路径 `targetPath`）＋生成 `planDigest`。五守卫逐项
  预检（目标已存在/目标在源内/源未登记/源无效/磁盘不足）。
- **apply**：复算计划、**digest 漂移即拒**（`plan_drift`——源在确认后变化时
  拒绝执行陈旧确认，要求重新走确认链）；在新项目的互斥锁下复制（排除
  `Library/Temp/Logs/obj/Builds/.vua` 六项）；新项目取得自己的 Unity 身份
  （productName 重写）；写 `.vua/source.json` 来源链（sourcePath/
  associations/importedAt/taskCorrelation）；**写 VUA 原生标识文件
  `.vua/project.json`**（用户裁决 7/9/12：副本首标记 VUA 原生，备注留空——
  标记不虚构备注；原始项目永不标记）；复检副本生成收据（确认与快照不继承）。

## 任务与恢复语义

- 复用应用契约九态任务面；**不隐式续传**：半成品（复制中断）＝
  `inspect_required`，清理/放弃/重试均由用户显式触发——provider 永不自动
  删除残留（残留即证据）。
- 收据 `ImportReceiptV01`：实际复制清单、`bytesCopied`、source link、副本
  复检（Unity 版本/manifest 状态）。原始项目的确认与快照永不继承。

## 拒绝码闭集（七项）

| guard | code |
| --- | --- |
| 目标已存在 | `vua.project.target_exists` |
| 目标在源内 | `vua.project.target_inside_source` |
| 源未登记 | `vua.project.source_not_registered` |
| 源无效 | `vua.project.source_invalid` |
| 磁盘空间不足 | `vua.project.insufficient_disk_space` |
| 计划漂移 | `vua.project.plan_drift` |
| 执行失败 | `vua.project.execution_failed` |

闭集仲裁确认在案（集成验收批）；词表外拒绝码不出现。

## 与读面的分线

`project.import-copy` 被读面词表（project-inspection）拒绝、读面请求被本族
词表拒绝——双向断言钉死在 `tests/project_queries.rs`。检测/写两族独立版本化。

## 文档变更日志

- 0.1（2026-09-09）：初版冻结——`project.import-copy` plan/apply 两阶段＋
  七拒绝码闭集＋任务/恢复语义；实现批 226dd41 经集成验收合并。执行面增强
  （apply 写 VUA 原生标识，词表零变更）见 proposal 014 内联注记
  （2026-09-09 深夜批）。
