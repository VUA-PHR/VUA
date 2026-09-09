---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 6f2c7b7
updated: 2026-09-10
---
## 当前焦点
**job.execute 环境预检半边已接线（2112f6c，2026-09-10 凌晨）——009 表态④
受理预检序「版本锁→环境→指纹」自此全链**：recipe 声明
`environment.unityVersionConstraint` 且可解析为 Unity 版本字符串时，配置的
Unity Hub 编辑器根下必须存在精确匹配安装（major/minor/patch/release
kind/number；China 后缀永不匹配纯版本——对齐不支持环境政策）；**诚实跳过
语义**：无 constraint 或自由文本不可解析→预检跳过不猜判定；观察失败≠配置
判定——DetectionFailed 走 `vua.job.environment_check_failed`
（ExternalFailure＋recoverable），未检出/无匹配走 `vua.job.environment_unmet`
（Validation，信封携 requiredVersion）。装配＝`unity_editors_root` 进
ProductionUseCaseConfig（bin 读 `VUA_UNITY_EDITORS_ROOT`，默认标准 Hub
位置）。**消费测试 +3**：unmet 阻断零记录/匹配安装放行/观察失败诚实可恢复
（默认种子无 constraint→诚实跳过，既有测试不动）。**证据（2026-09-10
本机）**：warehouse_commands 25/25＋workspace 65 套件全绿＋clippy 零告警。
**路由留言**：产线（窗口 A2 冒烟 recipe 的 constraint 语义）＋桌面（新
messageKey errors.job.environmentUnmet/environmentCheckFailed 四语表登记）。
交集成验收。**在途下一刀候选**：013 检测读面路由＋BG-2/BG-6 评估。
#7 残余观察态维持。
**前情：两份表态已交付（2026-09-10 凌晨，collab-only；016 已仲裁落节、
015 §12.8 已核验受理）**：①**proposal 016 核心三
问答复**（016 内联「表态（核心）」节）：存储面＝是（第五文档库，形态锚
EvidenceStore——检查证据是不可变观察事实，plan/record 的 revision 语义不
适用）；读取路由＝独立词表行 `inspection-queries/v0.1`（照 013/014 分线
先例，不连带升版 production-use-case v0.2；写命令面 M7 锚点时按同惯例定）；
聚合规则与 unavailable 语义消费侧确认采纳（不完整的检查不得读作干净通过）；
BG-4 协作位履职＝本表态，存储＋路由实现随 M7 检查切片锚点（冻结硬前置①
Bridge 五维操作落地为核心开工锚）。②**015 §12 IPC 面形状表态**（015 内联
「表态（核心）」节）：形状核可（remoteContent 同构＋confirmId pending 校验
安全闭合＋无超时＝阻断式诚实）；架构边界确认＝全程桌面域内、核心域零耦合
面无配合项；§12.4 语义锚核可作为验收锚。#7 残余观察态维持。
**downloads.listCompleted 读面接线已验收合并（e1e5520）**。
**前情：downloads.listCompleted 读面接线已交付（389912e）——
bdl-queries v0.4 消费翼（回应 wt-5 读面接线请求）**：`downloads.*` 分派＋
单一词表项 listCompleted（无参数闭集/unknown_method/类型化
vua.downloads.unavailable）＋载荷＝`list_adoptable_downloads` 原样（守卫
镜像：行在列即可采纳；路径不出行）＋`BDL_QUERIES_SCHEMA_VERSION` 0.3→0.4
（信封常量随核心接线批升——数据侧路由授权）。**机械跨域跟随（已声明）**：
bdl-store catalog_serving.rs 的 validator 锚与常量断言随冻结词表字面升
v0.4（仅版本跟随，形状零变更）。**消费测试 +2**：守卫镜像性质 over the
wire（双交付在列/已采纳行携 entry link/未采纳行空/无 storedPath 泄漏）＋
参数与未知方法契约错误。**证据（2026-09-10 本机）**：catalog_queries 11/11
＋workspace 64 套件全绿＋clippy 零告警。交集成验收。**BG 工单状态**：本
tick 领取的即在途读面接线（优先于 BG），BG-2/BG-6 未领（下轮按领取纪律
评估）。**remoteBrowser 行移除已验收合并（f5f2fe0）**。在途下一刀候选
维持：013 检测读面路由＋job.execute 环境半边接线。#7 残余观察态维持。
**前情：remoteBrowser capability 行已移除（be58a67，015 §11 裁决 (a)
核心半边，桌面同窗验收件）**：provider 不再转述非自身能力（诚实纪律——capability
报告只携带 provider 自己服务的操作）；桌面批 B-1 已切壳自报、该标志无消费
方。**桌面三问答复见留言**（①移除交付＋过渡态声明；②v0.4 wire 批已验收
合并 b4c78aa——批 B 前置满足；③页内确认层 IPC 面等桌面对接设计后表态）。
**importDownloads 路由批已验收合并（b4c78aa）**。在途下一刀候选（排期
维持）：013 检测读面路由（environment.getSnapshot 真实现）＋job.execute
环境半边接线（f8fe114 事实源消费）。#7 残余观察态维持。
**前情：importDownloads wire 路由已交付（cbde4b3，015 §7 批 B 前置的
v0.4 wire 批）**：第六命令 `warehouse.importDownloads` 任务化
路由（身份 only 闭集/信封钉 v0.4/四负例保持 invalid_params/向量驱动真采纳
消费测试）＋`BDL_COMMANDS_SCHEMA_VERSION` 0.3→0.4（词表面整体随数据侧冻结
升版，五命令形状不动）。**证据（2026-09-10 本机）**：warehouse_commands
22/22＋workspace 63 套件全绿＋clippy 零告警（一次无关套件 ph_010 时序瞬败
未在三次复验再现，如实记录）。**015 §7 两问已表态（015 内联）**：①时间锚
＝本批交付；②remoteBrowser 翻转机制架构表态（能力拥有者直读 (a) 推荐/
装配旗标转述 (b)，核心配合面一行，随桌面批 B 同批）。交集成验收。
**M6 核心路由批（f53704c，project.import-copy）已验收合并（8bfa5b6）**。
在途排期：013 检测读面路由（environment.getSnapshot 真实现）＋job.execute
环境半边接线（环境事实源 f8fe114 已在库）——下一刀候选。#7 残余观察态维持。
**前情：M6 核心路由批交付记录（f53704c，014 `project.import-copy`
wire 路由）**——`project.*` 分派＋任务化两阶段（plan 确认面/apply 执行面，
九态共享任务权威）＋闭集参数执法（invalid_params：未知键/未知
phase/apply 缺 digest/plan 带 digest）＋守卫拒绝＝Done payload 内冻结
`rejected` 结果文档（非传输错误，照 warehouse 生成守卫先例）＋缺装配＝
类型化 `vua.project.unavailable`＋capabilities 行＋`run_provider_host_full`
新入口（旧签名零破坏委托）。**消费测试 project_ops_wire 4 项**：真 VCC
注册源项目两阶段全链（schema 校验 plan/receipt 信封＋排除清单＋source
link＋Library 不复制）/plan_drift 拒绝零复制/未注册源拒绝/闭集与缺席面。
**证据（2026-09-10 本机）**：project_ops_wire 4/4＋workspace 63 套件全绿
＋clippy -D warnings 零告警。交集成验收（M6 批）。
**环境三问已表态（013 内联）**：①v0.2 消费确认（路由钉 v0.2）；②备注写
命令有条件立项（等桌面 D-6 编辑范围；语义草案 setNote＋not_vua_native
拒绝码已备）；③014 路由占位声明。**wt-5 importDownloads 路由请求已接单**
（待 2688105 v0.4 验收入树后随批实现——契约文件须在树才能消费引用）。
#7 残余观察态维持。
**前情：W22 记录面收口刀已验收合并（b303678；W25 三前置齐备，开窗通知
晨起 O-2——核心侧凭证义务已清）**。job.execute 完整
Build Record v0.3 转抄——版本锁预检（009 表态④①，协议本承诺落地；锁值＝
存储乐观并发 revision）＋digest 锚链真实化（recipeDigest＝整文档 hash＋
localResolutionDigest＝解析面投影 hash，规范代码内声明）＋**planDeviations
类型化偏差**（source_fallback 照 012 MUST/guard_skip/partial_completion，
替换硬编码空数组）＋recoveryPoints 收据快照登记（pre_job；rejected 无快照
不虚构）＋evidenceSummary 走 localResolutionId 反查
（EvidenceStore.list_by_local_resolution 新增；缺席根＝诚实空态）。**顺手
修两真 bug**：①uuid_v7_identity 版本位 4→7（生成 id 此前全面违反冻结
uuidV7 pattern——recipe v0.3 套件与 production-use-case v0.2 词表）；②
job.execute 收口刀计划文件内容误将 Vec<u8> 二次序列化为 JSON 数字数组
（write_plan_file 恒拒「缺 schemaVersion」——此前无 job.execute 消费测试
故未暴露）。**证据（2026-09-09 本机）**：warehouse_commands 20/20（含
4 个新测试：全链 record 形状/类型化偏差＋快照/版本锁拒绝零记录/解析证据
链）＋workspace 60 套件全绿＋clippy -D warnings 零告警。
**W25 前置状态（核心侧声明）**：①production-use-case v0.2 冻结收口
**正式确认生效**（Schema 十方法＋向量 24＋向量驱动消费测试 3＋协议本双语
＋REGISTRY 冻结行——集成已验收落账）；③W22 实现切片**记录面已收口**
（executors 接线＋记录写入面＋两对接细节澄清齐）——核心侧前置凭证齐，
请集成确认后走开窗通知。**W22 冻结语义既定，两对接细节澄清答复见留言**。
核心下一步：M6 名下任务领取（014 import-copy provider 实现，project-ops
v0.1 词表环境已冻结入树）；wt-6 标识文件词表路由表态已交（见留言）。
#7 残余观察态维持。
**前情（13 项裁决已登记，8457e04 对照表；核心相关 6/7/9/10/12/13 吸收
注记齐）**。W20 实现切片全部交付并经验收。production-use-case v0.2 已冻结
（2fd4813）。proposal 014 核心表态已交付（fc6f69e/29152c2，三域表态齐待
集成仲裁）。M6 已开窗。
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
## 本轮交付（c486318 后，本 tick 续）
- **W15 走查 9 条登记（c2570e0，BOARD 新区块）**：逐字登记＋归属初判＋核心
  意图确认（条目 6 迁移形态歧义、条目 9 开发模式边界歧义→[需用户]）＋处置
  草案（禁改实现）；
- **proposal 014 冲突融合收尾追认**（29152c2/d19ed2c 前轮已交）。
## 本轮交付（c2570e0 后，收尾时段 collab-only 登记）
- **用户 13 项裁决登记 BOARD（8457e04 对照表）**：忠实转述逐项登记＋核心吸收
  注记（6 来源语义＝项目内 VPM 包/7 迁移＝复制新目录＋独有标识文件
  〔project-ops Schema 字段输入〕/9 014 沿用/10 W14 词表零变更呈现层归桌面/
  13 开发模式 DEV-only＋真实连接目标＋徽标恒显——capabilities 演进核心配合
  排期）。实现工作今夜 23:00 开工（用户指令）。
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
**环境预检批（2112f6c：预检序②接线＋constraint 精确匹配/诚实跳过/观察
失败三态语义＋unity_editors_root 装配＋消费测试 +3）＋本状态批**请集成
验收合并。**W25 相关**：预检②接线后窗口 A2 冒烟 recipe 若带 constraint
需真机匹配安装（或无 constraint 诚实跳过）——语义已路由产线；新 messageKey
两枚待桌面 i18n 登记。在途下一刀候选：013 检测读面路由＋BG-2/BG-6 评估。
## 留言
- [→产线] **环境预检②已接线**（2112f6c，消费你方 f8fe114 事实源）——009
  表态④预检序全链：constraint 精确匹配（China 后缀永不匹配纯版本）＋无
  constraint/自由文本诚实跳过＋观察失败可恢复不冒充 unmet。**窗口 A2 语义
  知会**：冒烟 recipe 带 constraint 需真机匹配安装；不带则预检跳过——请按
  此准备冒烟 fixture。
- [→桌面] 新任务面 messageKey 两枚随环境预检批产生：
  `errors.job.environmentUnmet`／`errors.job.environmentCheckFailed`——
  四语表登记随你方消费批（i18n 机械跟随）。
- [→集成] 上轮「环境半边待接线」诚实缺口就此关闭（f8fe114 事实源消费
  落地）；在途候选维持 013 检测读面路由＋BG-2/BG-6 评估。
- [→产线] **016 三问表态已交 016 内联**（「表态（核心）」节）：①存储面＝
  是，第五文档库锚 EvidenceStore 形态（不可变观察事实，非 revision 文档）；
  ②读取路由＝独立词表行 inspection-queries/v0.1（不连带升 v0.2；写命令面
  M7 锚点时按分线惯例定）；③聚合规则＋unavailable 语义消费侧确认采纳；
  official_sdk_rating 保留值纪律核可。BG-4 协作位履职＝本表态；实现随
  M7 锚点（硬前置①为核心开工锚）。
- [→桌面] **015 §12 表态已交 015 内联**（「表态（核心）」节）：IPC 面形状
  核可（同构先例＋安全闭合＋无超时诚实）；架构边界＝桌面域内、核心零耦合
  面无配合项；§12.4 锚核可作为验收锚。批 B-3 随表态推进。
- [→集成] BG-4 协作位（核心）履职登记：表态已交 016 内联；实现协作随
  M7 锚点。BG-2/BG-6 维持未领（在途候选优先级评估中，下轮定）。
- [→数据] **读面接线交付**（389912e，回应你的 v0.4 读面接线请求①②）：
  `downloads.listCompleted` 分派就位（载荷＝`list_adoptable_downloads`
  原样，无参数闭集）；`BDL_QUERIES_SCHEMA_VERSION` 已升 "0.4"；bdl-store
  catalog_serving.rs 的 v0.3 锚（validator 目录＋常量断言）机械跟随升
  v0.4——字面版本跟随，形状零变更，特此声明。**TS 面登记提醒**：桌面
  批 B 的 downloads.listCompleted TS 登记随其消费批（dfc113d 先例）。
- [→桌面] downloads.listCompleted 已接线（389912e 待验收）——批 B「已完成
  下载列表」数据源就绪（守卫镜像：行在列即可采纳，adoptedWarehouseItemIds
  标注已采纳）；TS 面登记随你方消费批办理。
- [→集成] BG 工单状态声明：本 tick 在途读面接线优先（领取纪律＝仅当无更
  优先在途工作），BG-2/BG-6 未领，下轮按纪律评估领取。
- [→桌面] 三点答复（回应你批 B-1 留言）：①**provider 硬编码行已移除**
  （be58a67，015 §11 (a) 核心半边）——同窗验收就绪；过渡态如实声明：你们
  gateway-router 的 remoteBrowser 映射行（app.snapshot → 渲染层 snapshot）
  在你方清理前会对缺席 capability 恒报 false（安全降级方向），以你们域内
  节奏清理；②**v0.4 wire 路由批节奏＝已交付并验收合并**（cbde4b3→b4c78aa）
  ——批 B 采纳入口前置满足，信封形状见数据侧冻结 result 向量；③页内确认层
  （Main 原生对话框→渲染层确认流新 IPC 面）：等你们对接设计出稿后核心
  表态，不猜测先行。
- [→集成][→桌面] **importDownloads 路由交付**（cbde4b3）——015 批 B 的
  「wire 接线后去降级」前置满足；消费测试与形状声明见提交与状态焦点。
- [→桌面] 015 §7 两问表态已交 015 内联（「表态（核心）」节）：时间锚＝
  已交付；remoteBrowser 翻转二案（(a) 渲染层直读壳能力【推荐】/(b) 装配
  旗标转述）——请择一，核心配合面一行随批 B 同批。
- [→数据] importDownloads 路由已按你方 v0.4 冻结形状接线（C-1 遵守、路由
  侧无域内调整）；受理信封 schemaVersion 随词表面整体升 0.4。
- [→集成] ph_010 瞬败样本记录（#7 协议）：全量并行跑中
  ph_010_mutation_gate_holds_lock_and_marker_during_the_run 瞬败一次
  （material 线锁测试，与本批 importDownloads 改动无交集），顺序复跑三次
  全绿未再现——时序抖动判断，样本未保留完整 panic 输出（首跑仅 grep 捕获
  FAILED 行），如实声明；持续观察。
- [→集成] **M6 核心路由批交付**（f53704c，project.import-copy——你方点名
  「随时交付随时验收」件）：细节见当前焦点与下次合并意图。桌面 T-C 接线
  的两命令面，写面（014 路由）已通、读面（013 environment.getSnapshot）
  仍为桩——013 读面路由是我的下一刀排期项。
- [→环境] 三问表态已交 013 内联（「表态（核心，2026-09-10 凌晨）」节）：
  ①v0.2 消费确认＋unreadable 三态核可；②备注写命令有条件立项（等桌面
  D-6 编辑范围确认；setNote＋`vua.project.not_vua_native` 语义草案已备，
  升版批可直接取用）；③`project.*` 写面已被 014 路由占位。
- [→数据] **importDownloads wire 路由接单确认**（回应你的路由请求）：
  照 warehouse.import 先例任务化受理、信封、invalid_params 闭集——实现排
  在 2688105（v0.4 契约批）验收入树之后的下一刀（Schema/向量文件必须在树
  才能消费引用；不猜未合并契约细节）。C-1 分流遵守：路由侧无需域内调整。
- [→集成][→产线] **两对接细节澄清答复**（回应 wt-main 留言与产线 98a26ff
  路由；均已随 8c7b6a4 落地）：
  ①**计划文档 JSON 序列化归属＝核心 provider 侧**：PlanDocumentStore 读出
  批准计划→核心 serde_json pretty 序列化整文档→UTF-8 文本透传产线
  write_plan_file（产线函数只负责 job 目录落盘与校验，不持有序列化决策）；
  Bridge 读文件本地校验 hash 与 payload.planHash。**顺带如实声明**：收口刀
  曾把 Vec<u8> 二次序列化成 JSON 数字数组（write_plan_file 恒拒），本刀修复
  并首次由 job.execute 消费测试钉死——此前「executors 已接线」的该路径实际
  不可用，无真机证据前不宣称已通。
  ②**ProductionJobReceipt 消费＝核心转抄进 BuildRecord 关联面**：jobs[]
  （commandId/planHash/dryRun/replayed 收据回显＋resolvedSourceUsed 以收据
  为权威）＋recoveryPoints（收据 snapshot_id→pre_job 登记；v2 收据无执行中
  逐阶段恢复点字段——如需 post_job 逐阶段恢复点属 v2 收据扩展，另行立项）
  ＋steps 转抄（executed→succeeded/failed→failed，skipped→guard_skip 偏差
  不进 jobs[]，fail-fast 截断→partial_completion 偏差）＋收据来源与计划
  声明不一致→source_fallback 偏差（012 §3-3 MUST 双记录互证）。
  另：job.execute 受理预检已补**版本锁第一顺位**（协议本「版本锁→环境→
  指纹预检」的版本锁半边落地；环境半边待环境事实源接线，如实缺口）。
- [→集成] **W25 前置①正式确认**：production-use-case v0.2 冻结收口声明
  正式生效（Schema 十方法＋正负例向量 24＋向量驱动消费测试 3＋协议本双语
  ＋REGISTRY 冻结行，集成已验收落账）；**前置③记录面已收口**（8c7b6a4）。
  核心侧前置凭证齐——是否开窗请集成确认并按流程通知用户。
- [→环境] 标识文件词表/路由表态（回应你「待你排期」）：①「VUA 原生项目」
  判定是**读语义**——归 013 project-inspection 读面扩展（快照追加可选判定
  字段，向后兼容；或 013 升 v0.2 按破坏面定），不进 project-ops 写面；
  ②标识文件写入/备注存取是 provider 本地行为＋既有 project-ops v0.1
  import-copy 沿用（裁决 7/9），**无新写词表需求**；③等你标识文件格式切片
  落地后我随批冻结 013 增补 Schema＋正负例（冻结硬前置照惯例），不猜测
  格式先行。
- [→集成] brief 登记表校验误报观察：`schemas/project-inspection/v0.1` 与
  `schemas/project-ops/v0.1` 报「文件缺失」，但两目录文件实际在
  （command/result/snapshot schema＋examples）——疑校验器按主 schema 文件名
  形态匹配（d4e156c 刚改过该检查），请顺手核。
- [→集成] （历史队列维持）多件在途按序验收：①W22 冻结切片（c486318）；
  ②执行序②核心半边（6b4f21a）；③UnityOperation 扩展批（93f841c＋36b14ff）；
  ④执行语义规格与勘误批（471a4ee）；⑤W20 第二刀（4849958）＋010 接线
  设计批——以上此前批次；新增本批 W22 记录面收口刀（8c7b6a4）。
- [→数据] 010 挂点六承诺核对声明已读，与我域 consume 侧一致；generateVpm
  路由透传扩展随时可随批。
- [→桌面] record 读面闭集已全（record.get/list），W24 recovered 呈现语义
  表态请求维持；recipe 读面 recipe.save/get/list 通。
