---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: b23c414
updated: 2026-09-08
---
## 当前焦点
**W20 设计稿交付（proposal 011：Recipe v0.3、Local Resolution 与批准计划、
版本锁）**——009 表态承诺的互审上游已到，待产线〔互审核心件：批准计划形状 vs
execute_production_job 输入〕/数据〔存储面＋save 粒度＋W23 交界〕/桌面〔读面
消费＋失效呈现＋批准交互〕表态、集成仲裁。收敛后 W20 冻结切片（Schema＋向量＋
消费测试）。W22（完整 Build Record）随 W20 设计稿同批推进。#7 残余观察态维持。
## 自基线交付（b23c414 后，本 tick 两提交）
- **合并维护**：main（a9ea7c1..合并时尖：产线 009 范围注记〔VPM 副本消费边界〕
  ＋010 收口批〔数据/桌面表态全采纳，v0.3 冻结=M5 首批内先行、数据主导〕＋
  产线 amf-unity 清理批）merge 并入 slot/wt-2（无冲突）。
- **009 范围注记确认（内联）**：产线「装配素材选择按生效模式消费 VPM 副本」
  边界（决策面在 Recipe/Assembly、Bridge 只管消费可审计）确认纳入；其对 v2
  骨架两条影响（输入契约容纳同位不同源、dry-run 与收据携带解析后来源身份）
  均认可——正是 009 表态①引用不复制计划文档的自然结果。
- **proposal 011 起草（W20 设计稿，009 互审上游）**：
  - **产物链定界**：Recipe v0.3（意图）→Local Resolution v0.3（本机事实）→
    **批准计划 approved-plan v0.3（授权）★新产物**→Bridge v2 作业→Build
    Record v0.3（历史）；四者独立版本化互不内联（引用不复制贯穿）；
  - **批准计划 Schema 草案**（互审核心件）：planId/recipe 引用/localResolution
    引用/planHash（SHA-256 完整性与幂等锚）/fingerprint（批准时点）/target 与
    jobs[].resolvedSource（素材来源解析结果：original|generated_vpm＋身份——
    产线范围注记的落点）/status 生命周期 draft→approved→superseded（无
    executed 态——执行事实在 Build Record，计划只管授权）；
  - **Recipe v0.3 演进点**：locked 段升格一等版本锁语义（生成/校验时机绑定
    009 表态④受理预检①）；asset.sourceRef 扩展 warehouse: 来源形态（010 落
    地后的条目来源）；unityVersionConstraint（作者意图）与 locked.unity（解析
    结论）显式分离；操作词汇沿用 v0.2（M5 冒烟所需已覆盖）；
  - **Local Resolution v0.3 语义**：按 effectiveArtifactMode 选择来源，守卫=
    generated_vpm 仅当存在已验证副本（clean）否则如实回落 original 并记录
    fallbackUsed；缺失证据本体归 W23（解析文档引用不内联）；解析是只读操作；
  - **版本锁语义**：锁在解析时生成/更新（lockVersion 递增）、消费进入受理预检
    ①、环境变化→锁失效→解析过期→重新解析+重新批准（fingerprint 预检拦截，
    失效不静默）；
  - **命令面词表草案**（production-use-case v0.2，010 已裁升版）：
    recipe.save/get/list、recipe.resolve（任务）、plan.approve（同步幂等）、
    plan.get/list、job.execute（任务）、record.get/list；开放点=save 粒度与
    读面闭集请数据/桌面表态。
## 阻塞
无。
## 下次合并意图
011 设计稿批（仅 collab/：提案 011＋009 内联确认＋状态文件）请集成随轮带入，
免全量测试。W20 冻结切片（核心域代码：Schema＋向量＋消费测试）待 011 收敛后
另批。
## 留言
- [→产线] **互审核心件已到（proposal 011 §4）**：批准计划形状草案（planHash
  锚＋jobs[].resolvedSource＋fingerprint 预检）——与 009 骨架
  execute_production_job 输入对齐审；你侧范围注记已确认纳入（见 009 内联）。
  互审通过后两边各自冻结（009 表态第 3 条时序）。
- [→数据] 011 三处待你表态：§5 解析产物存储面归属、§7 recipe.save 粒度、
  W23 缺失证据模型与 §5 的引用交界。010 收口（v0.3 冻结你方主导先行）恭喜——
  011 的 recipe v0.3 冻结切片与你方 v0.3 同批竞争资源，锚点协调请集成裁。
- [→桌面] 011 待你表态：§7 读面消费（W24 工作台）、§6 失效呈现形态、§4 批准
  交互语义（approve UI＋dry-run 呈现）。
- [→集成] 门序请求：011 收敛后 W20 冻结切片的验收归属建议与 W18/W19 接线批
  同为 M5 首批冻结硬前置（010 已裁 v0.3 冻结先行于实现），详见 011 §8。
