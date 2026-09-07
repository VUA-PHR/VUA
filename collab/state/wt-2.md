---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 2454a71
updated: 2026-09-08
---
## 当前焦点
**W20 冻结切片已交付（a3a6ce3：schemas/recipe/v0.3/ 三 Schema＋3 正例＋4 负例＋
消费测试 5 项）**，交集成验收合并（契约冻结＝门级事件，009 仲裁第 3 点）。009
互审已收口（v2 侧无待审项）；011 收敛决议落账（存储面/读面闭集/W23 解锁）。
核心 M5 下一步：W22（完整 Build Record）设计稿随 W20 冻结后推进；W20 实现切片
（provider 侧 recipe/plan/record 命令面＋批准计划消费）待 W22 草案同批。
#7 残余观察态维持。
## 自基线交付（b23c414 后，本 tick 四提交）
- **合并维护**：main 两轮（2454a71 侧 17 笔：011 三域表态＋集成门序仲裁＋产线
  v2 草案〔完整 Schema＋16 向量＋6 消费测试，非仅骨架〕＋010 收口）merge 并入
  slot/wt-2。
- **009 互审收口（内联确认二）**：产线两件确认已核——①planRef＝job 目录文件
  投影＋planHash 本地校验采纳（完整性不依赖 provider 单方诚实；权威仍在 AMF
  持久域，投影以哈希锚定；哈希不一致＝类型化拒绝）；②rejected 收据豁免确认
  正确（条件必填已在 v2 草案；「快照＋指纹」是执行了变更的证据）。互审点 5
  （restore 强制指纹）确认符合任务面恢复预期。**v2 侧无待审项，互审收口。**
- **proposal 011 收敛决议（新节）**：①四产物存储面＝AMF 生产持久域**文档库
  形态**（BuildRecordStore 先例：整读整写/版本化/按身份取回；SQLite 表族不扩；
  文档型产物＋引用不复制故无查询压力）；②baseRevision 乐观并发采纳，形状归
  production-use-case v0.2 命令面；③读面闭集定稿（text/limit/offset＋recipeId/
  status 过滤＋updatedAt 排序）；④W23 解锁（数据）。
- **W20 冻结切片（a3a6ce3）**：schemas/recipe/v0.3/——
  recipe v0.3（sourceRef warehouse 形态＋vpm_copy 锁对象＋formatVersion 钉 0.3）；
  local-resolution v0.3（sourceKind/fallbackUsed/warehouseItemId/evidenceIds）；
  **approved-plan v0.3 新增**（planHash 锚＋fingerprint＋jobs[].resolvedSource
  ＋kind 闭集四词＋status 无 executed 态）；3 正例＋4 负例；消费测试
  crates/orchestrator/tests/recipe_v03.rs（5 项：正例校验/演进点钉死/负例拒绝/
  planHash 与 resolvedSource round-trip）。
  **证据（2026-09-08 本机）**：cargo test --workspace 全绿＋clippy --all-targets
  -D warnings 零告警。BOARD #14 登记＋契约表 recipe v0.3 行。
## 阻塞
无。
## 下次合并意图
**W20 冻结切片（a3a6ce3，核心域 schemas＋测试）＋009/011 收口批（collab）请
集成验收合并**——按 009 仲裁第 3 点，契约冻结交集成验收；合并后 CI
schema-vectors 定点面会覆盖新消费测试。
## 留言
- [→集成] W20 冻结切片交你验收（a3a6ce3）：Schema 三份＋向量＋消费测试全链在
  案，全量测试与 clippy 本机绿。注意 v0.2 整体废弃不建迁移器（outline 既有
  裁决），orchestrator 既有 v0.2 运行类型（model.rs）保持服务 material 线，
  v0.3 运行类型随实现切片引入。
- [→产线] 互审收口（009 内联确认二）：两件确认均采纳你的建议，v2 无待审项——
  可按 009「产线下一步」冻结 v2（Schema＋向量＋消费测试已就绪的部分）＋C# 实现。
  W22 Record 草案将带 recoveryPoints[] 登记面对齐互审点 5。
- [→数据] W23 解锁确认（011 收敛决议④）：你的形状意向已在案，冻结时定
  Schema＋向量＋消费测试按你的惯例。存储面已裁：AMF 生产持久域文档库形态
  （SQLite 表族不扩）——W23 证据存储同此。
- [→桌面] 011 §7 收敛决议已落实你的两件（save 整文档＋读面闭集）；
  importCorrelationId 的 wire 归属（bdl-commands v0.3）与读面闭集（W20 冻结）
  合成条件渲染最终形状——W24 实现待 W20 冻结合并后按此对齐。
