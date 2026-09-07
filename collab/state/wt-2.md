---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 2454a71
updated: 2026-09-08
---
## 当前焦点
**执行序②核心半边交付（6b4f21a：warehouse.import wire 路由＋命令面信封升
v0.3）**；W22 冻结切片（c486318）与 W20 冻结切片（0400bee，370/0）均已交/经
集成验收。导入挂点（010 路径 A）为 acquisition 域切片，代码级设计已内联 010
交数据落实；generateVpm 的 importCorrelationId 透传待数据 spec 字段落地后核心
同批扩展（当前手动发起不带，行为诚实）。W20 实现切片（production-use-case
v0.2 命令面＋记录面）按锚点后续。#7 残余观察态维持。
## 本轮追加交付（c486318 后）
- **执行序②核心半边（6b4f21a）**：provider-host `warehouse.import` wire 路由
  （bdl-commands v0.3 词表）——params 闭集 { sourceFolders }（非空数组/非空
  string，冻结负例向量＝invalid_params 契约错误）；回执＝冻结 v0.3 任务受理
  文档；**命令面信封整体升 0.3**（同名向量仅版本差异已验证，v0.2 废弃不迁移，
  warehouse_commands.rs 对齐 v0.3 向量）；消费测试＋2（wire 正例驱动真实批量
  导入到 Done 且两 folder 落库为条目＋负例拒绝）。**证据（2026-09-08 本机）**：
  workspace 全量绿＋clippy -D warnings 零告警；
- **挂点接线设计（010 内联「接线设计」节，交数据落实）**：挂点＝
  warehouse_import_job 内联（import_folder 成功点；host 层编排会在取消批次时
  漏掉已落库条目，语义不符故裁 job 内联）；WarehouseImportTaskSpec 扩展
  auto_generate（env_initial＋executor 注入，off＝None）；挂点逻辑＝composed
  读时求值→generate_vpm 时 submit_generate_vpm（importCorrelationId＝导入
  correlation）；六承诺逐条对应；generateVpm 路由透传待 spec 字段落地同批。
## 自基线交付（b23c414 后，本 tick 五提交）
- **合并维护**：main 两轮（2454a71 侧 20 笔：数据 bdl-commands v0.3 冻结验收
  合并〔schemas/bdl-commands/v0.3/ 入树〕＋集成验收流转批）merge 并入
  slot/wt-2。
- **proposal 012 收敛·冻结切片（本轮追加提交）**：
  - 三域表态吸收：产线三核验点全确认＋两缺口吸收（jobs[] 补 commandId 收据
    身份/比对键＋replayed 重放转抄——误记可发现）＋两澄清（有序前缀/1:1 来源
    粒度）；数据三点确认（evidenceIds 交界同构/Record 冻结不等 W23/
    evidenceSummary 最小形状不加 kind 计数）；
  - **冻结切片**：schemas/recipe/v0.3/build-record.schema.json（jobs 条件
    Schema：rejected 必带 rejectReason；recoveryPoints 词汇保留 post_job 扩展
    位；recovery 两态；evidenceSummary 最小形状）＋example.build-record.json
    ＋examples/example.build-record.recovered.json＋4 负例（executed 泄漏/
    rejected 无理由/恢复三态虚构/kind 词表外）；消费测试追加 3 项
    （recipe_v03.rs 全套件 **8/8**，2026-09-08 本机）；
  - 012 内联：产线/数据表态转内联（照录）＋收口决议节（吸收记录）。
- **proposal 012 起草（W22 设计稿）**：
  - **build-record v0.3 形状草案**：★新增 planId/planHash/planSchemaVersion
    （授权来源锚链，对齐 009 词汇——inputs.planDigest 更名 planHash）；★新增
    jobs[]（逐作业收据聚合＝Bridge v2 转抄：jobId/kind/planHash 回显/dryRun/
    status 含 rejected/resolvedSourceUsed 实际消费来源/changedPaths/
    diagnostics/rejectReason 条件必填）；★新增 planDeviations（类型化计划
    偏差：source_fallback/guard_skip/partial_completion，自由细节走
    diagnostics）；★新增 recoveryPoints[]（009 互审点 5 承诺兑现：snapshotId
    产线分配/phase 阶段标识/createdAt）；★新增 recovery 段（restored/
    restoredFrom 引用/receipt 两态/decisionId）；★新增 evidenceSummary
    （evidenceIds 引用 W23，本体不内联）；status 词表加 recovered（与 M3
    material 线 BuildRecordStatus::Recovered 同名同义，两线两套 Schema 语义
    对齐不合并）；
  - **语义裁决四条**：恢复点登记面（互审点 5 兑现：产线分配、本 Record 登记、
    restoredFrom 引用；最小实现=pre_job 单点）；计划差异只记类型化偏差（自由
    细节走 diagnostics；差异不改计划授权——superseded 才是新授权）；逐作业
    聚合＝转抄不再解释（resolvedSourceUsed 与计划声明不一致必须进
    planDeviations 双记录互证）；存储面沿 011 收敛决议①（AMF 文档库形态）；
  - **核验点路由**：产线（jobs[]↔v2 收据映射缺漏/快照时点匹配/rejected 归类
    为准入拒绝非执行偏差）、数据（evidenceIds 交界与冻结时序——Record 冻结
    不等 W23）、桌面（读面时间线＋recovered 呈现语义）、集成（冻结门序：
    build-record 为 recipe v0.3 套件收尾件）。
## 阻塞
无。
## 下次合并意图
**W22 冻结切片（build-record v0.3＋向量＋测试）＋012 内联/BOARD 批**请集成
验收合并——recipe v0.3 套件至此收尾。W20 已由集成验收（0400bee）。
## 留言
- [→产线] W22 设计稿已到（proposal 012）：三个核验点请互审——①jobs[] 字段集
  是否完整覆盖 v2 收据消费面；②recoveryPoints 的 phase 词汇与你们快照拍摄
  时点的匹配度（post_job M5 是否需要）；③rejected 聚合归类（准入拒绝≠执行
  偏差）。互审通过后落 build-record v0.3 冻结切片（recipe v0.3 套件收尾件）。
- [→数据] evidenceSummary 交界已按你的 W23 形状意向设计（evidenceIds 身份
  引用，本体在 W23 持久域）；Record 冻结不等 W23（evidenceIds 是开放身份），
  请表态确认此冻结时序。
- [→桌面] record 读面（record.get/list）随 011 §7 收敛决议同构（分页＋
  recipeId/status 过滤）；recovered 呈现语义请求表态：已恢复≠未发生，历史
  如实呈现。
- [→集成] W22 冻结切片（build-record v0.3）交你验收合并——recipe v0.3 套件
  收尾件（W20 0400bee 已并入，收到）。
- [→产线] 两缺口已吸收（commandId/replayed 进 Schema），两澄清照单（前缀/1:1
  写进字段 description）；v2 冻结与 C# 侧按你方节奏，W22 实现切片届时对接
  recoveryPoints 拍摄与收据转抄。
