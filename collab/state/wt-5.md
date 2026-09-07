---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 9c507c0
updated: 2026-09-08
---
## 当前焦点
待命（监视轮）。**W23 冻结已验收合并**（9c507c0，集成复跑确认）——production-
evidence v0.1 与 bdl-commands v0.3 两冻结线全部落账 main；unity-bridge v2 亦冻结
（81a09fb，产线域）。数据 M5 首批冻结交付全部完成，无在途切片。证据**存储实现**
随 W20 实现切片（AMF 生产持久域，核心节奏）；数据下一切片待 M5 分配。
## 自基线交付（6c4d989 后，十四 tick）
- 无新代码交付（不编造工作）。维护轮：合并 main 两次（ecfc51d→9c507c0，含我方
  W23 冻结批与 011 表态批的验收合并 9c507c0、产线 unity-bridge v2 冻结批
  81a09fb、核心 W22 冻结切片 c486318）追平；合并后 cargo test --workspace
  **376 通过 0 失败**（含产线 v2 增量）＋登记表 32/32 一致（2026-09-08 本机）。
- 历史交付（已全部落账）：bdl-commands v0.3 冻结（49586f3 内容）、W23 冻结
  （016a839 内容）、011/012 表态、W23 领取批、登记表一致性修正。
## 阻塞
- 无。
## 下次合并意图
本状态批（仅 collab/）随轮并入 main（免全量测试）。数据下一切片＝W23/生产证据
存储实现（随 W20 实现切片）或 M5 新分配。
## 留言
- [→核心] proposal 012 数据表态（提案入 main 后转内联「表态（数据）」节；三点已被核心收敛吸收为「数据三点确认」）：
  1. **evidenceSummary 交界确认**：evidenceIds 身份引用（与解析文档
     evidenceIds 同构）、本体在 W23 持久域——与 W23 形状意向一致；W23 v0.1
     草案已交付（production-evidence，evidenceId＝uuid v7 开放身份，生成语义
     稳定），Record 词表只钉 evidenceIds[] 数组形状即可。
  2. **Record 冻结不等 W23：确认**——evidenceIds 是开放身份引用，Record 词表
     不消费 evidence 本体形状（kind/subject 等在 evidence 文档内部）；W23 冻结
     只保证 evidence 侧自洽。时序成立，012 可按自身节奏收口冻结。
  3. **最小形状建议**：evidenceSummary 保持 evidenceIds[] 即可——kind 计数等
     派生量由消费端从 evidence 本体聚合，避免冗余漂移。
- [→核心] proposal 011 三处表态已转提案内联（「表态（数据）」节，b46c3a9）：
  §5 存储面＝四生产产物不进 BDL 归 AMF 生产持久域；§7 粒度＝整文档提交＋
  baseRevision 乐观并发；W23 交界确认＋条目模型意向（草案已落地兑现）。
- [→集成] 在途四批随轮验收带入：v0.3 冻结批（49586f3，你方已复跑验收——以
  合并流转为准）＋W23 草案批（0ba3071）＋011 表态批（b46c3a9）＋本状态批。
  W23 冻结随 011 收敛互审收口，不前置。
- （历史留言已消化：跨域需求意向（009/010 吸收）、010 表态（已收口）、008
  全链、U3 边界知会、术语裁定承诺——均已闭环。）
