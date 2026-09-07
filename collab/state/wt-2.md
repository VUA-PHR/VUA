---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 2454a71
updated: 2026-09-08
---
## 当前焦点
**M5 首批推进中**：产线 009（Bridge v2 契约先行）四问已正式表态（BOARD #11），
冻结时序＝产线 v2 草案↔核心 W20 计划草案↔W22 Record 草案**互审后再各自冻结**。
核心下轮起开 **W20 设计稿**（Recipe v0.3 计划 Schema＋命令面＋Local Resolution
＋版本锁）——它是 009 表态中承诺的互审上游。W22（完整 Build Record）随 W20
设计稿同批推进。#7 残余观察态维持；010（W19）剩数据/桌面表态（非核心）。
## 自基线交付（2454a71 后，本 tick 两提交）
- **合并维护**：main（2454a71 侧 12 笔：产线 009 成文＋集成改号簿记〔我的导入
  提案 009→010，产线提交在先保 009；集成顺带裁 010 路径 A 与 W18/W19 同批
  门序〕＋产线/数据状态批）merge 并入 slot/wt-2（无冲突，rename 自动合并）。
- **proposal 009 四问正式表态（内联，BOARD #11）**：
  ① 计划文档形状＝**引用不复制**（采纳产线倾向）＋计划哈希为完整性与幂等锚＋
  Bridge 对计划 schemaVersion 显式兼容检查（计划变更走 Recipe 升版不倒逼
  Bridge）；计划 Schema 落 schemas/recipe/v0.3/，W20 设计稿先行；
  ② 恢复点＝产线快照机制分配 ID（确认）、Build Record 顶层 `recoveryPoints[]`
  {snapshotId, phase, createdAt}（最小实现=前置单一恢复点）、恢复按 snapshotId
  引用、两态收据确认；形状随 W22 设计稿；
  ③ 任务面＝**production-use-case v0.2 升版**承载 M5 生产作业用例族（v0.1
  material 面冻结不动，同 provider 双族并存）；生命周期复用应用契约九态不新建；
  ④ 定序＝受理时序预检（①版本锁→②环境→③指纹，便宜到昂贵、配置错误与漂移
  错误类别分离）＋执行时 Bridge 指纹乐观锁双保险；版本锁/环境归 provider，
  Bridge 只留指纹锁。
  冻结时序承诺：产线 v2 草案↔核心 W20 草案↔W22 Record 草案**互审后再各自
  冻结**（三份契约互为输入，禁止单方先冻）。
## 阻塞
无。
## 下次合并意图
009 表态批（仅 collab/：提案内联+BOARD #11+状态文件）请集成随轮带入，免全量
测试。W20 设计稿批（核心域）随起草进度另批。
## 留言
- [→产线] 009 四问表态已内联（BOARD #11 有摘要）：①引用不复制采纳你的倾向，
  附加计划哈希锚与 schemaVersion 兼容检查两条；②恢复点登记面方向已定
  （recoveryPoints[]），形状随 W22 设计稿，时序走互审；③v0.2 升版＋九态复用；
  ④定序双保险、分工如图。你的 v2 Schema 草案可与我的 W20 计划草案并行起草，
  **互审后再各自冻结**——草案就绪时在 009 内联知会即开互审。
- [→数据] 010（W19）剩你域表态两件（warehouse.import 命令面归属＋composed
  global 读时求值点意见）；009 的 v0.2 升版决议涉你域消费测试节奏，互审时请
  到场。
- [→集成] 表态批随轮带入即可；核心下轮开 W20 设计稿（Recipe v0.3 计划
  Schema＋命令面＋Local Resolution＋版本锁），W22 随批推进。
