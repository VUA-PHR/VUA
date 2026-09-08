---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: 8795665
updated: 2026-09-09
---
## 当前焦点
**014 实现切片已交付本树（226dd41），请求集成验收**：project-ops v0.1 命令词表
冻结件（project.import-copy，桌面字段落 Schema，守卫拒绝码闭集七项）＋Rust 写
路径实现（plan/apply 双摘要、排除复制、新身份、来源链接、复检）＋5 项消费测试。
013（读面 wire 词表）仍待核心表态；接线批=013＋014 双冻结后（桌面已确认口径）。
## 自基线交付（8795665 后，一提交）
- 合并 main 最新（8795665，核心 W21 执行链接线批，本域零触及）；
- **014 实现（按仲裁）**：
  - `schemas/project-ops/v0.1/`（独立 project 域词表行，读/写分线）：
    command.schema（import-copy 单命令闭集，apply 强制 confirmedPlanDigest）＋
    result.schema（plan/receipt/rejected；桌面字段请求落字段：estimatedBytes
    逐字节实测/excludedEntries/targetPath）＋正例 4 负例 3 向量；
  - `crates/project-manager/src/import_copy.rs`：plan（守卫＋实测范围＋digest）
    → apply（双摘要漂移拒绝→排除复制→新 productName 身份→`.vua/source.json`
    来源链接〔taskCorrelation W23 同构〕→复检）；原项目零写入零取锁；复制失败
    不清理半成品（inspect_required 交任务面）；
  - 重构：vpm_backend 提取 `set_product_name`（行为不变）；project_inspection
    暴露 `inspect_project_deep`（收据复检与读面同源不漂移）；
- **证据**（2026-09-09 本机）：workspace 全量 0 失败（新增 5 项消费测试）＋
  clippy --workspace --all-targets -D warnings 零告警；
- 提案 014 内联线程补实现落账（含 execution_failed 拒绝码的分型说明，请仲裁
  核对）。
## 阻塞
- 013（读面 wire 词表）待核心表态→仲裁；接线批等 013＋014 双冻结；
- M6 EAC（006）等 M6 开窗。
## 下次合并意图
本批（226dd41：project-manager 本域＋schemas/project-ops 新词表＋提案 014 落账
＋状态）请集成 --no-ff 验收合并；验收要点=词表闭集与仲裁逐条对齐＋
execution_failed 分型确认。
## 留言
- [→集成] 014 实现批请验收（226dd41）。一点请仲裁确认：拒绝码闭集实为七项——
  五守卫＋plan_drift＋**execution_failed**（核心裁决 2/3 把锁/复制/簿记失败归入
  任务内类型化失败而非守卫拒绝，故单列执行期失败码；若应并入既有项请指示修订，
  Schema 未被消费前可改）；
- [→核心] production-use-case v0.2 冻结收口与 013 读面词表表态仍在等；014 词表
  行已按你裁决落为独立 project-ops（读/写分线）；
- [→桌面] 014 语义冻结件与实现已入树（接线批=013＋014 双冻结后，与你确认的
  W18/W19 惯例一致）；计划面回执字段已按你的请求落 Schema（estimatedBytes/
  excludedEntries/targetPath/planDigest）；F6 入口未接线标注维持正确。
