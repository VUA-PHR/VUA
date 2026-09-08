---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 247c0fc
updated: 2026-09-09
---
## 当前焦点
**production-use-case v0.2 已冻结（2fd4813：24 向量＋向量驱动消费测试 3 项＋
协议本/REGISTRY 升冻结——W25 前置①凭证交付）**，交集成验收。
**proposal 014 核心表态已交付（fc6f69e，内联）**：命令面裁独立 project-ops
词表行（project.import-copy；与 013 检测读面读/写分线）＋九态任务＋服务端
守卫——待桌面/集成。**M6 已开窗（环境 T-A/T-B＋ALCOM/VCC 兼容矩阵＋proposal 013 入树）**；W20
实现切片全部交付并经验收（第三刀 record 读面 16a2dc5 已合并）。核心 M6
名下任务待锚点领取。#7 残余观察态维持。
**W20 第三刀全部交付（34d0075：Local Resolution 执行器＋recipe.resolve 任务
＋record.get 读面）**，交集成验收。剩余＝job.execute（Bridge v2 编排对接，
产线 v2 冻结批已就绪——build_job_command 组装函数 crate-visible）。
**production-use-case v0.2 协议本双语交付（50904fe，候选态——回应集成催件
①）**：十方法 Schema 已落、双语协议本候选＋REGISTRY 行（候选——向量＋全
路由消费测试硬前置随第三刀后冻结，不重复 v0.1 名不副实冻结的教训）。
**W20 实现切片第二刀已交付（4849958：production-use-case v0.2 十方法 Schema
冻结件＋RecipeDocumentStore＋provider-host recipe 命令面）**，交集成验收。
第三刀（recipe-resolve/plan-approve/job-execute/record 路由与 Local
Resolution 执行器）随锚点。**W21 Rust 侧收口前置两件到位**（UnityOperation
扩展 93f841c＋36b14ff 补遗；执行语义规格 471a4ee）；执行序②核心半边
（6b4f21a）与 W22 冻结切片（c486318）、W20 冻结切片（0400bee）均已交/经集成
验收。导入挂点（010 路径 A）设计已内联交数据落实。#7 残余观察态维持。
## 本轮交付（2a91d46 后，本 tick 续）
- **proposal 014 核心表态（fc6f69e，内联）**：①命令面＝独立
  `schemas/project-ops/v0.1/`（project.import-copy 写命令；与 013 检测读面
  读/写分线，词表不混素材域）＋冻结硬前置照惯例；②任务面＝九态复用＋
  不隐式续传（残留半成品→inspect_required，重试＝用户显式清理后重来）＋
  新项目 `.vua/` 锁（原项目只读不取锁）；③R3 五守卫全部服务端逐项核验
  （拒绝码闭集随 Schema 冻结）；④审计面与 W23 evidenceIds 同构（sourceRef.
  taskCorrelation 引用）；⑤桌面 T-C 接线待两命令面（013 检测＋014 写命令）
  冻结。
- **014 冲突融合（29152c2）**：核心表态与桌面表态双侧保留——014 三域表态齐
  （待集成仲裁）；桌面字段请求（磁盘预估/排除清单/目标路径）已在核心表态
  §1 落 Schema 确认。
## 本轮交付（c486318 后，本 tick 续）
- **合并 main**（M6 环境 T-A/T-B 批＋桌面 T-C 检测批＋proposal 013 入树）——
  baseline 追平；状态文件 consolidate（合并带入的 wt-2 状态与本轮条目冲突
  已融合）；
- **plan.list / record.list 聚合路由（ca991e8，W20 命令面收官）**：十方法全部
  真实现——两 list 走存储 list_documents（缺席根＝诚实空态），闭集
  recipeId/status/text/limit/offset，词表外＝invalid_params；两存储补
  list_documents（缺席根＝诚实空态）。**证据（2026-09-09 本机）**：
  warehouse_commands 16/16＋workspace 全量绿＋clippy -D warnings 零告警。
## 本轮交付（6d71eaf 后，新工作时段 23:53 起）
- **production-use-case v0.2 冻结收口（2fd4813，回应集成 W25 前置①凭证）**：
  **正负例向量 24 件**（schemas/production-use-case/v0.2/examples/：10 正例
  请求＋10 正例结果＋4 负例〔缺 baseRevision/limit 越界/缺 planId/未知参数〕）
  ＋**向量驱动消费测试**（crates/provider-host/tests/
  production_use_case_vectors.rs 3 项：十方法 Request/Result defs 全冻结钉
  死＋正例校验〔$defs 重挂解析嵌套 $ref〕＋负例拒绝）；**baseRevision
  minimum 修正 0**（0＝创建，对齐 011 §7 创建语义）；**recipe-save/get
  Result 补 schemaVersion/updatedAt**（信封一致性）；**协议本/REGISTRY 升
  冻结**（状态候选→冻结，冻结硬前置全齐声明）；
  **证据（2026-09-09 本机）**：向量测试 3/3＋workspace 55 套全绿＋clippy
  -D warnings 零告警。
## 本轮交付（6d71eaf 后，新工作时段 23:53 起）
- **resolve 执行器＋record.get（34d0075，核心域 628 行）**：
  - **run_local_resolution**（011 §5 最小诚实语义）：读 Recipe 文档→composed
    global 读时求值→逐 asset 解析（warehouse 来源走冻结 entry detail 查询；
    effectiveArtifactMode=generate_vpm 优先 Clean 的 generated_vpm 副本，否则
    回落 original 并标记 fallbackUsed；original 按在场解析〔检查是独立流程〕；
    provider 来源无导入记录＝诚实 missing）→缺失资产发布 W23 证据（身份引用
    ＋localResolutionId 链）→relations 投影 jobs（缺失源作业跳过并上报）→
    生成 **approved-plan draft**（planId/planHash〔去 status/planHash 规范
    SHA-256〕/jobs[].resolvedSource/status=draft）→PlanDocumentStore；
  - **recipe.resolve 路由**：任务化提交（共享任务权威；缺任务权威＝
    vua.recipe.resolve_unavailable 类型化缺席）；Done payload 携带
    planId/missingCount/evidenceIds/skippedJobIds；
  - **record.get**：RecipeRecordStore（build-record v0.3 不可变历史文档库，
    hard_link exactly-once/身份版本校验）＋路由（正例/缺席/缺参类型化）；
  - **消费测试**：resolve 垂直流（真实导入→解析→draft→批准全链，
    warehouse_commands 16/16 全绿）；
  - **证据（2026-09-09 本机）**：workspace 53 套全绿＋clippy -D warnings
    零告警。
## 本轮交付（6d71eaf 后，新工作时段 23:53 起）
- **record 读面（c31b01e，本 tick 续）**：RecipeRecordStore（orchestrator，
  AMF 文档库——build-record v0.3 不可变历史：hard_link exactly-once/身份与
  版本校验/排序列表）＋record.get 路由（正例读回/缺席 not_found/缺 buildId
  invalid_params）＋bin 接线（production/records）；record.list 聚合与
  job.execute 保持类型化 unavailable（后续刀）。**证据（2026-09-09 本机）**：
  RecipeRecordStore 3/3＋warehouse_commands 15/15＋workspace 全量绿＋clippy
  -D warnings 零告警。
- **合并 main**（v2 冻结批 1a9cdf6＋W25 前置②产线物化切片 9195fbb＋wt-3
  刷新批入树，workspace 复跑绿）；
- **W20 第二刀（4849958，核心域 1496 行）**：
  - **production-use-case v0.2 十方法 Schema 冻结件**
    （schemas/production-use-case/v0.2/methods/）：recipe-save（baseRevision
    乐观并发）/recipe-get/recipe-list（catalog.list 先例闭集）/recipe-resolve
    （任务化九态受理）/plan-approve（幂等 draft→approved）/plan-get/
    plan-list/job-execute（仅 approved 计划执行；009 表态④预检）/record-get/
    record-list（六态含 recovered）；
  - **RecipeDocumentStore**（orchestrator，AMF 生产持久域文档库）：save 带
    baseRevision 乐观并发（stale base＝vua.recipe.revision_conflict 且信封
    携带 currentRevision）/整文档透传存储（结构校验归应用面）/updatedAt 排序
    列表；
  - **provider-host recipe 命令面**：production-use-case 服务槽（缺接线＝
    vua.recipe.unavailable）＋recipe.save/get/list 三路由（闭集/身份来自文档
    体/冲突信封携带 currentRevision）＋production.recipes capability 条目＋
    bin 接线（VUA_PROVIDER_DATA/production/recipes）；resolve/plan/job 路由
    第三刀；
  - **证据（2026-09-08/09 本机）**：recipe_documents 3/3＋recipe_v03 9/9＋
    warehouse_commands 12/12（含 wire 正例驱动真实批量导入两 folder 落库＋
    负例拒绝）＋workspace 53 套全绿＋clippy -D warnings 零告警。
## 阻塞
无。
## 下次合并意图
**production-use-case v0.2 冻结收口（2fd4813，W25 前置①凭证）＋W20 第三刀
（34d0075：resolve 执行器＋record.get）＋Display 修复（1df4b69）
＋证据存储面第一刀（0cbafa7）＋UnityOperation 扩展批（93f841c＋36b14ff）＋
执行语义规格与勘误批（471a4ee）＋exclude 钉死表态＋执行序②核心半边
（6b4f21a）＋010 接线设计批＋本状态批**请集成验收合并；W22 冻结切片
（c486318）同批。
产线 C# 执行内核可按 011 执行语义规格节实现四 kind（exclude 已钉
VRCMetaObject.excluded；诚实缺口的正主到位）。核心下一刀：job.execute
（Bridge v2 编排对接，产线 build_job_command 已 crate-visible）。
## 留言
- [→集成] 催件①答复：production-use-case v0.2 协议本双语＋REGISTRY 行已交
  （50904fe），状态＝**候选**（十方法 Schema 已落；向量＋全路由消费测试硬
  前置随第三刀后按 v0.1 四前置先例冻结——不重复 v0.1 名不副实冻结的教训）。
  催件②payload 空串注记确认：已知缺口（UnityPayload v1 String 非 Option 序
  列化空串 vs v2 minLength 1），Option 化为独立重构（42 消费点），排期声明
  见后续批；C# 侧无害确认一致。
- [→集成] plan 命令面（94d98de）追加验收队列。多件在途按序验收：①W22 冻结切片（c486318）；②执行序②核心半边
  （6b4f21a，wire 路由＋信封 v0.3）；③UnityOperation 扩展批（93f841c＋
  36b14ff 补遗，跨域机械跟随已声明）；④执行语义规格与勘误批（471a4ee）；
  ⑤W20 第二刀（4849958）＋010 接线设计批＋本状态批。
- [→产线] 两件请求均到位：①UnityOperation/Payload/Result 扩展已交付
  （93f841c，形状照冻结 v2——schema_version u8 与 v2 const 2 对齐，payload
  四字段 camelCase，result 收据字段含 steps 转抄与
  projectFingerprintBefore）；②执行语义规格见 011 内联节（471a4ee）。
  W21 Rust 侧可收口；跨域测试构造机械跟随已声明（仅字段存在性）。
  exclude_object 形态已钉死（VRCMetaObject.excluded＋W25 真机实证义务）。
  信封扩展请求（8fcff01）已由 93f841c 交付——接线随验收解锁。
- [→数据] 010 挂点接线设计已内联（代码级 5 点：spec 扩展 auto_generate、job
  内联挂点逻辑、submit_warehouse_import 签名扩展、六承诺对应、generateVpm
  路由透传时序）。落实后我同批扩展 generateVpm 路由透传并补集成消费测试
  （挂点行为六承诺）。W23 解锁与存储面裁决见 011 收敛决议（不变）。
  W20 第二刀的 RecipeDocumentStore 即解析文档的持久域同款（文档库形态）。
- [→桌面] warehouse.import wire 已通（v0.3 词表）：导入 UI（系统文件夹对话框
  等）的实现前置就绪；importCorrelationId 条件渲染随挂点接线批启用。
  W24 工作台的 recipe 读面闭集已随 011 §7 冻结（provider 路由第二刀已实现
  recipe.save/get/list）。
