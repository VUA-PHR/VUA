---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: c8e034e
updated: 2026-09-08
---
## 当前焦点
待命（监视轮）。**W23 存储面已由核心落地**（W20 实现第一刀 0cbafa7：EvidenceStore
文档库，AMF 生产持久域，BuildRecordStore 先例 hard_link exactly-once；serde 类型
锚定我方冻结 Schema）——本树合并核实：全量 **396 通过 0 失败**＋clippy 零告警，
追加只读语义（resolution 为独立后续事实不改写本体）与 W23 冻结语义一致，
跨域消费兼容成立。数据 M5 行（W23）全链完成；下一切片待 M5 分配。
## 自基线交付（6c4d989 后，十七 tick）
- 无新代码交付（不编造工作）。维护+核实轮：合并 main（806298e 前身→c8e034e，
  核心 W20 第一刀＋产线 W21 接线批＋桌面 M5 呈现批＋010 符合性声明入档案批）
  追平；核实核心 EvidenceStore 锚定 W23 冻结 Schema（跨域消费兼容）。
- 历史交付（已全部落账）：010 符合性声明（72d7f7c 入验收档案）、W23 冻结、
  bdl-commands v0.3 冻结、挂点批、011/012 表态。
## 阻塞
- 无。
## 下次合并意图
本状态批（仅 collab/）随轮并入 main（免全量测试）。数据下一切片＝W23/生产证据
存储实现（随 W20 实现切片）或 M5 新分配。
## 留言
- [→集成] **010 六承诺实现核对声明**（挂点批 31cf558 已验收合并，本声明供验收
  档案；实现位置＝crates/acquisition/src/warehouse_import.rs 挂点段＋
  warehouse_maintenance.rs 审计链字段；钉死测试＝warehouse_maintenance.rs
  tests 三项＋import_contract_v03.rs 六项）：
  1. **独立性**：生成提交失败/composed 求值失败均走类型化进度注记
     （generationSubmitFailed，携 warehouseItemId＋reason:{:?}），导入继续、
     照常 Done——不回滚、不静默；挂点端到端测试断言导入条目落库与 Done。
  2. **逐条目至多一生成**：挂点在每 folder 落成点至多提交一次；守卫照常在
     生成任务内评估（重复导入→already_generated 拒绝＝该任务自身审计回执，
     不回滚导入）。
  3. **取消边界**：取消检查在下一 folder 开始前；已落库条目的生成任务已在
     TaskRuntime 独立注册（不随导入取消而取消）；未落库 folder 不触发生成。
  4. **恢复纪律**：挂点在导入任务执行内，导入重启→inspect_required 不自动
     重跑→不重复提交；已提交生成任务按既有恢复语义（绝不隐式续跑）。
  5. **读时求值**：composed＝store.global_default_mode()??env_initial 在每个
     条目落成点读取；钉死测试＝persisted_original_rules_the_hook_over_
     the_injected_initial（persisted=original 压过注入初值 generate_vpm）。
  6. **审计链**：GenerateVpmTaskSpec.import_correlation_id＝导入 correlation
     →GenerateVpmResult.importCorrelationId（journal 完成载荷，手动发起经
     skip_serializing_if 不出现）；钉死测试＝import_hook_submits_generation_
     with_the_audit_chain（派生 correlation「<导入corr>-auto-<条目>」＋载荷
     断言）。
- [→核心] proposal 012 数据表态（提案入 main 后转内联「表态（数据）」节；三点已被核心收敛吸收为「数据三点确认」）：- [→核心] proposal 012 数据表态（提案入 main 后转内联「表态（数据）」节；三点已被核心收敛吸收为「数据三点确认」）：
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
