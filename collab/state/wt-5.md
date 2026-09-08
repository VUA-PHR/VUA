---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 8668b39
updated: 2026-09-08
---
## 当前焦点
**010 挂点接线实现批已交付（31cf558，acquisition 域，数据侧）**——按核心接线
设计（010 内联「接线设计」节，代码级 5 点）落实：AutoGenerateSpec 注入＋
WarehouseImportTaskSpec.auto_generate＋warehouse_import_job 内联挂点（条目落成
点 composed 读时求值→generate_vpm 时提交独立生成任务，审计链
importCorrelationId 回链）＋GenerateVpmTaskSpec/Result 审计链字段＋六承诺实现。
请求集成验收；**验收后核心同批扩展 generateVpm 路由透传**（spec 字段已就绪），
组成完整执行序②。
## 自基线交付（6c4d989 后，十五 tick）
- **010 挂点接线实现批**（31cf558；crates/acquisition＋provider-host 机械跟随）：
  - AutoGenerateSpec { env_initial, executor }＋WarehouseImportTaskSpec.
    auto_generate（None＝手动导入面，只导入）；
  - 挂点内联：每 folder 落库后 composed 读时求值（persisted ?? env_initial，
    绝不快照）→generate_vpm 时以既有 submit_generate_vpm 提交独立生成任务；
    生成 correlation 派生自导入 correlation＋条目身份（审计链可回溯、重放不
    碰撞）；import_correlation_id 回链导入任务（010 承诺 6）；
  - 六承诺：提交失败→类型化进度注记（generationSubmitFailed）不影响导入
    Done；逐条目至多一生成（守卫在生成任务内）；取消边界已落库照常；重启
    不重跑导入即不重复提交；读时求值；审计链；
  - 机械跟随（声明内，provider-host 两处）：wire 构造点 auto_generate: None
    （注入逻辑随核心编排批）＋GenerateVpmTaskSpec 构造点
    import_correlation_id: None（手动 wire 发起不带审计链）——TaskRuntime
    Clone 已在（无需改 orchestrator）；
  - 测试：挂点端到端（导入→编排生成→fixture bridge 成功→VPM 包副本落在
    导入条目＋journal 完成载荷携 importCorrelationId）＋手动面永不编排＋
    persisted 优先于注入初值（读时求值裁决）。
  - 证据（2026-09-08 本机）：cargo test --workspace **382 通过 0 失败**（净增
    9：挂点 3＋v0.3 契约与 W23 既有面回归）＋clippy --all-targets -D warnings
    零告警。
- **proposal 012 数据表态**（核心收敛已吸收为「数据三点确认」）＋W23 冻结
  落账确认（9c507c0）。
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
