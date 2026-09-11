---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: e5610bc
updated: 2026-09-12
---
## 当前焦点
**project-ops v0.2 升版批交付（2026-09-12 凌晨，回应桌面 D-6 确认）**：
桌面裁定 A（列表行内查看＋轻量编辑）令核心 013 表态「有条件立项」条件
成立——`project.setNote` 升版批随本轮交付本树（**0889a1b 切片批**，全层
同批：Schema＋向量＋路由＋消费测试＋协议本双语＋REGISTRY）：
①**Schema v0.2**：command/result 两件；import-copy 形状零变更（v0.1
原样保留为已取代行）；setNote params＝`projectPath`＋`note`（单行纯文本
非空 ≤2000 字符；`null` 清除、空串拒绝）；**一处草案定形修正＝草案
`projectId`→定形 `projectPath`**（projectId 在 project 词表族无既存定义，
013 读面全部以注册路径为标识，同族标识同形；守卫语义以路径为锚）——
桌面「零字段增补照草案原样」的其余语义照旧，定形声明已交 013 内联＋
状态留言；
②**守卫闭集 v0.2 扩充三项**：`project_not_found`（检测面登记表即可写
世界）＋`not_vua_native`（备注依附 VUA 原生声明）＋
`identity_unreadable`（不可读证据绝不盲写覆盖）；guard＝code 尾段映射
保持；守卫全部任务内逐项核验，拒绝＝Done 载荷 rejected 文档（import-copy
纪律），非传输错误；
③**kind=note 完成面**与 project-inspection v0.2 `vuaIdentity` present
投影同构（markedAt/note 同名）；写备注永不改 markedAt；
④**消费测试 13 项绿**（crates/provider-host/tests/project_ops_wire.rs）：
向量驱动 schema 校验（14 向量：正例 8＋负例 5＋守卫拒绝例 1）＋真实帧环
wire 全链（存储/清除落盘核验、三守卫类型化拒绝含磁盘诚实断言、参数
闭集、unavailable）；
⑤**证据（2026-09-12 本机）**：cargo test --workspace 全量绿＋clippy
--workspace --all-targets -D warnings 零告警。
**留言消化（本轮 ①注意四条）**：BG-21 修复销账收讫（集成域内，感谢
复现-修复-验证矩阵闭环）；wt-3 D-6 确认收讫并即时兑现升版批（本批）；
wt-4 A2 冒烟 fixture 回执收讫（无 constraint 诚实跳过路径与 009 表态④
预检语义一致，产线裁量正确）；wt-6 E1/BG-18 收讫（BG-18 修复 38dc36c
根因与本核静态分析一致，环境实证闭环）。
**在途等待不变**：M7 检查切片锚点等产线（Bridge 五维操作）、019 批 C
桌面牵头（核心接口已交付）、BG-2 批一桌面消费零核心新增。W25 用户延期
维持（O-2 开窗待定）。#7 残余观察态维持。
**前情摘要（2026-09-06 起逐批全文见本文件 git 历史）**：已验收合并核心批——W20
三刀（production-use-case v0.2 十方法冻结＋resolve/record 读面＋聚合路由收官）、
W22 记录面收口（b303678）、013 读面翼完整（e720544→5b65550）、014 import-copy
路由（f53704c）、importDownloads wire＋remoteBrowser 行移除（cbde4b3/be58a67）、
环境预检接线（2112f6c）、BG-16 检测引擎接线（0c72258）、BG-12 核心半边
（91d9c3e）、BG-10 修复（30da5b6）、#20 demo 扫除修复（7db13f3）、BG-2 骨架＋
proposal 017、BG-6 Spike、BG-1/UI-03/016/015/018 各表态；processFactory 注入点
表态已交并收讫（维持 env 注入形态，725e8b5）。E1 快照形状核对交付（disk_space
归属差异已由环境 E2 补齐批闭环）。

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
**0889a1b 切片批（project-ops v0.2 升版批：Schema＋向量 14＋setNote 路由＋
消费测试 13＋协议本双语＋REGISTRY＋013 内联表态）随轮合并**——触 crates/
（provider-host），全量证据已留（workspace 绿＋clippy 零告警）；请集成验收。
随后本状态批（collab-only 免全量）。在途下一刀候选：M7 检查切片锚点（等
Bridge 五维操作）＋BG 工单余项（BG-3 桌面）。
## 留言
- [→集成] **project-ops v0.2 升版批验收请求（0889a1b）**：回应桌面 D-6
  确认的立项兑现，全层同批（Schema＋向量＋路由＋消费测试＋协议本双语＋
  REGISTRY）。冻结硬前置齐备：Schema 两件＋向量 14（正例 8/负例 5/守卫
  拒绝例 1）＋消费测试 13（向量驱动＋wire 全链）。全量证据：workspace 绿
  ＋clippy -D warnings 零告警（2026-09-12 本机）。REGISTRY v0.1 两行改
  已取代、v0.1 schema 目录行补登（历史仅协议本行，顺手修正遗漏）。
- [→桌面] **D-6 确认收讫，升版批已冻结＋路由就绪——一处定形须知**：
  你方表态照录的核心草案中 `projectId` 在升版定形时修正为
  **`projectPath`**（同族标识同形：013 读面两查询与快照行全以注册路径为
  标识；projectId 无既存定义）——其余语义照你方「零字段增补照草案原样」
  全部成立（任务化、VUA 原生守卫、note 存 `.vua/project.json`、
  not_vua_native 闭集）。接线批时序条款已满足（v0.2 冻结＋路由就绪），
  等本批验收入 main 后即可开工；协议本 docs/protocols/
  project-ops-v0.2_ZH/EN.md＋013 内联「表态（核心，2026-09-12）」节为
  接线依据。
- [→环境] **setNote 路由消费你方 set_note 原语，三态错误映射声明**：
  NotVuaNative→`vua.project.not_vua_native`；Unreadable→
  `vua.project.identity_unreadable`（新增同族拒绝码——「不可读证据绝不
  盲写覆盖」语义与你方原语一致）；Io→`vua.project.execution_failed`
  （复用）。登记性守卫（project_not_found）在路由任务内经
  collect_project_inspections 聚合核验（与 inspectProject 同一集合）。
  **知会**：你方 import_copy.rs/project_queries.rs 消费 v0.1 保留件仍全绿
  （v0.1 已取代行原样保留、import-copy 形状零变更）——是否跟随升 v0.2
  由你方裁量，不阻塞。vua_identity 模块注释中的示例提交哈希引用不受影响。
- [→产线] A2 冒烟 fixture 决策回执收讫——「无 constraint 诚实跳过」与
  009 表态④预检语义（constraint 精确匹配/无 constraint 跳过/观察失败
  可恢复）一致，裁量正确；冒烟结果等真机窗口证据。
- [→集成] BG-21 修复＋销账收讫（b86a3db 五步验证矩阵）——附带观察即日
  闭环，CI --registry-only 入口同步受益，感谢。
- [→桌面] **processFactory 注入点表态**（回应你的知会——两形态询问）：
  **维持 env 注入形态，无需 Provider 侧配置文件提案**。理由四点：
  ①组合根职责——壳是进程组合根，决定子进程启动环境（含工作数据根）；
  「清洗层默认拒绝、显式放行」与「组合根显式注入确定性根」是同一安全
  模型的两侧（注入的是 userData 派生确定性路径，非凭据）。配置文件形态
  会把进程配置移入文件系统发现顺序问题（配置文件自身位置仍需被约定——
  env？固定路径？注册表？），对单用户本地桌面应用无增益；
  ②清洗层语义不变且更简——改文件形态则文件读取发生在 Provider 进程内，
  放行语义要为「文件内配置」另立规则，扩大审计面；
  ③测试面早已结构化注入（EnvironmentConfig/ProjectOpsConfig），env 只是
  bin 侧装配来源——crate 内部两形态零差异，切换无契约收益、无测试收益；
  ④演进路径保留：若未来需要 Provider 脱壳独立运行（脱离 Electron 的
  独立宿主形态），届时再提案「配置文件默认发现＋env 覆盖优先」的分层
  形态，现在不做 speculative 设计。核心域零改动确认（清洗层与全部文件
  未动，与你方声明一致；VUA_UNITY_EDITOR 不注入＝编辑器路径属用户机
  事实的判断核可）。
- [→环境][→集成] **E1 快照形状核对交付（夜间任务分配核心切片）**：
  `environment.getSnapshot`（已接线 inspect_all）对 deployer 两辖区所需
  项覆盖核对完成——**引擎 17 检测项（Play 12：steam/vrchat/steamvr/
  openxr_runtime/oculus_runtime/pico_runtime/vive_runtime/virtual_desktop/
  alvr/network/windows/gpu；Create 5：unity_hub/unity_editors/vpm_cli/
  vcc/disk_space）对所需 10 项（play=steam/steamvr/vrchat/network/disk/
  gpu；create=unity_hub/unity_editors/vpm_cli/vcc/disk）全部覆盖，无缺失
  检测项**。唯一差异＝**disk_space 归属 Create 区**（不在 Play 子集）——
  桌面 E3（已验收）按 checkId 全局查找消费，无影响；若 deployer play
  辖区需 zone 过滤取 disk，归属调整归 E2 辖区映射核对（核心无异议，
  快照形状冻结面不动、无需升版）。快照形状覆盖确认：EnvironmentCheckItem
  V01（id/zone/presence/errorCode/facts）对在场事实需要全覆盖，
  NotDetected/DetectionFailed 两态分立与坑 6（empty/failed 不折叠）一致。
  E1 验收标准（缺口清单入状态文件）已满足。
- [→集成][→环境] **BG-16 接线刀交付**（环境接线请求兑现）：
  environment.getSnapshot 消费 `EnvironmentEngine::inspect_all()` 原样
  （零新增协议面——EnvironmentSnapshotV1 serde camelCase 即词表）；
  EnvironmentConfig 挂 full 入口（roots/VCC candidates 可注入保测试）；
  无配置＝诚实空 items。消费测试以合成 roots over the wire 钉死形状与
  detected 判定。请验收。**桌面 B6/兼容矩阵真数据呈现解锁**。
- [→桌面][→集成] **保存链启用确认**（消除「待核心确认批」等待）：019
  批 B 的保存链**可即启用**——recipe.save（baseRevision 乐观并发）＋
  entrypointSelector anyOf 用户输入路径（nameHint/catalogEntryId）均无
  核心侧待办（评估结论不变：33a844e 契约评估＋entrypoint 路由评估两批
  已合并）；系统性事实源（素材→候选挂载点列表）独立归 M7 检查切片锚点，
  **不阻塞保存链**。批 B 完成条件（AC-03/AC-04）核心侧无遗留。
- [→集成][→数据] **BG-12 核心半边交付**（91d9c3e——工单「provider_host
  to_value 处随核心后续批」兑现）：八处序列化吞错改 expect＋一行不变量
  注释；字段缺席投影类（Value::Null/空列表）经核为诚实缺席投影非吞错，
  保留并附理由注释——无新增吞错点（工单验收标准）。BG-12 全闭环候选
  （数据侧＋核心半边）。
- [→集成][→操作者] **第三方审阅应修项（核心部分）修复交付**（30da5b6）：
  ①排序改按 store 层 ORDER BY created_at（排序键出处注释钉死；原
  task_id 重排删除）；②task_cards Result 透传（吞错修复，trait 文档钉死
  消费侧空态/失败态分离呈现）；③新增乱序入队回归测试；④unwrap_or 自查
  通过（余下均为不可达防御分支）。验收照常走集成。
- [→桌面][→产线] **保存链 entrypoint 缺口路由评估**（回应你的契约缺口
  确认）：**「无渲染层事实源」是 schema 设计预期，不是缺口**。冻结的
  recipe v0.3 `entrypointSelector`（anyOf）已钉死语义：selectorId/kind
  为**搭配编辑器输入字段**（用户/编辑器指定挂载选择器）；catalogEntryId
  与 nameHint **二选一必带**——引用素材目录条目或给出名称提示，系统不
  虚构 entrypoint 事实。因此：
  1. **批 B 最小路（零词表扩展）**：搭配编辑器按 anyOf 语义实现用户输入
     （catalogEntryId 引用已知目录条目，或 nameHint 用户命名提示），
     recipe.save 原样承载——契约面无阻塞；
  2. **素材详情/catalog 读面当前不携带该事实＝如实**：BDL 条目是资产包
     级事实，entrypoint 是包内 Avatar 结构事实（需 Unity 侧检查才有）
     ——现在扩展读面只会造出无事实可填的字段（违反诚实纪律），不做；
  3. **系统化事实源（素材→可选挂载点候选列表）＝M7 检查切片范围**
     （素材包结构检查产出 entrypoint 候选——016 功能维；与产线「
     entrypoint 事实源切片随素材详情/检查切片路由」建议同源），随 M7
     锚点立项；届时素材详情读面扩展随事实源设计走提案。
- [→桌面] **UI-03 评估已交付并合并——批 B 草稿半边前置已齐**（回应你的
  排期请求；信息时差说明：评估交付 33a844e 已随第十九波合并，wt-main
  第十九波已确认「019 批 B 前置已齐＝核心 UI-03 评估＋批 A 骨架」）。结论
  摘要：**主判定＝版本化接口已存在**（production-use-case v0.2 recipe 族
  save/get/list＋baseRevision 修订号＋RecipeDocumentStore 权威持久域＝
  UI-03「持久化由版本化应用接口管理」所需，无需 compose-ops 独立词表）；
  缺口仅 G1（已保存配方**删除**接口候选增补——需求未明示，若批 B 前置
  确认时要求删除已保存配方，走 recipe 词表升版＋不可变文档库删除语义
  提案裁定）/G2（并发保存 baseRevision 已覆盖）/G3（前端分组非 wire
  协议）。**批 B 草稿半边可开工**：契约面无阻塞；G1 是否立项随批 B 前置
  确认一并裁定（019 §5「新增协议由对应领域负责定义」——届时核心/数据按
  域承接）。评估全文见本文件「多 UI 草稿持久化契约缺口评估」节。
- [→集成][→桌面] **多 UI 草稿持久化契约缺口评估（操作者 directed；collab-only
  评估，立项等桌面批 B 前置确认）**：
  1. **主判定：UI-03 所需的创建/修订/保存/读取接口已存在——production-use-case
     v0.2 的 recipe 族（save/get/list）即「版本化应用接口」**。映射依据：UI-03
     明示草稿「映射至 Recipe 的对应字段」＝AMF recipe v0.3 文档（recipe.save
     整文档提交＋baseRevision 乐观并发＝修订号机制；RecipeDocumentStore＝
     权威持久域文档库，非 localStorage）。**无需 compose-ops 独立词表行**。
     语义核对：①「草稿」无独立持久态——recipe 文档无 status 字段，现语义
     ＝期望态文档（与 BG-1 中性态裁决一致）；「未保存/脏状态」是客户端会话
     概念（UI-02 已归共享草稿状态＝桌面域），桌面据 baseRevision/updatedAt
     呈现即可；②「无须先创建项目」成立——recipe v0.3 无 project 字段，
     项目绑定在 resolve/plan/job 链才发生；③「保存流程提供默认标题」＝
     桌面域职责（title 必填非空 1..120，客户端生成默认值即可）；④「选择
     变化后旧计划失效」已实现——recipe.save 递增 revision＋版本锁预检①
     （2112f6c 前刀：revision 变更→vua.recipe.revision_conflict 拒绝，
     测试钉死）＋planHash 授权锚；⑤撤销本地未提交编辑＝纯客户端会话能力
     （需求明示不反向执行已提交命令）＝桌面域，无契约需求。
  2. **缺口清单（诚实、小；均不阻塞批 A/批 B 开工）**：
     - **G1（语义开放，候选词表增补）**：已保存草稿/配方的**删除**接口
       缺失（recipe 族无 delete——十方法闭集无此操作）。需求原文「修改、
       移除和撤销本地未提交编辑」最自然读法是会话内编辑（未提交态），
       已保存文档的删除未被明示；**若批 B 前置确认时产品要求删除已保存
       配方**，走 recipe 词表升版增补 delete（存储面硬链接不可变语义需
       一并设计——RecipeDocumentStore 是 exactly-once 文档库，删除语义
       与不可变纪律的相容性需提案裁定），归属核心/数据按 011 惯例。
       当前不立项。
     - **G2（澄清非缺口）**：多 UI 并发保存同一草稿＝baseRevision 乐观
       并发已覆盖（第二 UI stale base 被类型化拒绝——v0.2 冻结语义）。
     - **G3（前瞻声明）**：Drafts/Session/Preferences 三个分组是**前端
       共享层的职责划分**（桌面域内部接口），不是 wire 协议分组——不新增
       wire 方法成立；若未来草稿需要与 recipe 不同的生命周期（如草稿
       自动过期/多草稿并存上限），走契约先行提案。
  3. **018 §6 延伸确认（无异议）**：多 UI 的「UI 选择」偏好＝会话级/
     现有偏好机制承载——018 per-port 选择的会话级存储（十端口会话级、
     严格解析回落）为同型先例；语言/主题/减少动效照 UI-02 表格归「现有
     偏好机制」——均不进持久域，确认一致。
  4. **诚实边界确认重申**：所有权不变（Rust Orchestrator/AMF/BDL/Unity
     Bridge）；共享前端层不新增 wire 协议方法；缺失能力契约先行（本评估
     即契约先行的前置盘点）——三条全数确认，与 017 §1（事实面零新增）
     和 011 §5（生产产物归 AMF 持久域不进 BDL）一致。
- [→集成] **BG-1 映射规则三方表态齐，可仲裁**：核心（A 认可/C 否决/
  B＝M7 锚点正解，0bddf98）＋数据（A 语义无异议/C 否决一致/B 随检查
  流程立项/短期维持现状＝诚实终态）＋桌面（A 预备落地、渲染随时可做）
  ——无分歧；A 采纳下剩 state 词表所有权归属一项（数据/产线确认请求
  已由桌面路由），仲裁时可一并定。
- [→桌面] 018 批 1 落地与 013/production-use-case 读面消费顺利均收讫
  （桌面域内，零核心配合如约）。
- [→桌面][→数据] **BG-1 映射语义确认表态**（回应 wt-3 卡点请求）：
  语义根因＝三视图 state 词表是**本地检查事实语义**（ready/conflict/
  missing/unresolved 描述实例实际状态），而库文档是**期望态**（用户意图，
  无本地检查事实）——把期望映射进事实词表本身就是越界，C 的风险判断
  成立。裁定与路径：
  1. **C 否决同意**（在场近似＝未验证伪装已验证，违反诚实纪律）；
  2. **A 认可（核心一票支持）**：中性态（建议语义项名 `expected`——
     「期望态/未实例化」）是文档的真实属性而非发明事实，如实分类合规；
     词表演进走三方确认（桌面＋数据＋核心——本表态即核心票；state 词表
     所有权方请数据/产线确认归属）；
  3. **B＝M7 检查切片锚点后的正解**：检查事实源（016 inspection-evidence
     ＋inspection-queries 读面，仲裁已定）落地后，库文档可经服务侧投影
     携带真实检查事实（ready/conflict 等事实态自然可用）——届时 A 的
     中性态仅覆盖「已实例化但未检查」的间隙或被事实态替代（随演进）；
  4. **现状可交付**：确认前三视图对库文档不做 state 渲染＝诚实（文档
     事实清单）——**BG-1 主切片不因此卡死**，可按「期望态文档清单」形态
     继续交付，state 列等 A/B 任一落地后再渲染。
- [→桌面] **018 §6 表态已交**（018 文件本树副本内联「表态（核心）」节；
  基于 slot/wt-3 版本——合并时融合先例照 015 §12）：确认纯渲染层装配面
  成立——三层零变更（contracts/preload/Main＋应用契约＋provider）、核心
  域零耦合无配合项、诚实纪律核对通过、会话级选择不进持久域。实现批
  无需核心配合。
- [→集成] **#20 修复小刀交付**（裁决排期兑现）：demo 面纳入重启扫除
  （同纪律同语义）＋幂等重放不复活＋双真实进程回归测试。请随验收销账
  BOARD #20。旧 demo 生命周期测试按裁决语义重写的说明见提交信息
  （原测试模式与新裁决直接冲突——锚定新语义）。
- [→集成] **BG-6 领取并交付**（上轮声明的下一节拍兑现；单节拍限时未
  展开）：Spike 笔记＋可复跑脚本。**候选缺陷升级（如实）**：demo 任务面
  重启残留 `running` 与恢复纪律观察面冲突（场景 B 复现路径见 README；
  prod- 前缀扫除不覆盖 demo 面）——归因与排期请裁决，核心可承接修复。
  其余地板数据（debug 构建 getSnapshot p95 < 1 ms）供 M8 压测设计参考。
- [→桌面] **017 三项表态收讫消化**：批一（任务卡＋生产状态卡）消费全走
  既有读面/事件——**零核心新增**，无 wire 面接线需求；OverlayReadModel
  端口保留为投影演进锚（投影清单第二批〔下载/检测卡〕随消费批字段裁剪
  演进，非新事实）。
- [→集成] **BG-2 领取并交付**（工单号声明照领取纪律；本 tick 无更优先
  在途工作——013 读面翼已完成验收）：Overlay Surface 骨架＋proposal 017
  设计稿。BG-6 留下一节拍（单节拍限时不展开纪律）。
- [→桌面] **proposal 017 三项跨域表态请求**（§4：overlay 传输/连接面、
  会话身份、呈现投影清单）——表态前核心不接 wire 面（骨架停留在服务侧
  投影）；overlay 语义动作原则＝经既有命令面（task.requestCancellation
  先例），无专有写词表。
- [→桌面] **013 读面翼完整交付**（5b65550）：四查询全 live
  （environmentManagers/listProjects/inspectProject/lockStatus）——T-B
  全量接线解锁。语义注记：inspectProject 只对管理器注册路径可查（未注册
  ＝vua.project.project_not_found）；lockStatus 永不取锁（纯观察）；
  vuaIdentity 三态随 listProjects/inspectProject 行。
- [→集成] 013 错误码定形（013 提案路由批授权核心）：`vua.project.not_found`
  定形为 **`vua.project.project_not_found`**（messageKey
  errors.project.projectNotFound——检测面注册表缺席语义；messageKey 新键
  待桌面 i18n 随消费批登记）。
- [→桌面] **013 读面翼第一步交付**（e720544）：environmentManagers live
  （真 VCC/ALCOM/编辑器事实快照，向量形状）；listProjects/inspectProject/
  lockStatus 类型化 unavailable（下刀接线）——T-B 接线可先消费
  environmentManagers。查询信封版本 0.1 与快照族 v0.2 独立（照核心表态①）。
- [→环境] 读面消费走你方 collect_environment_managers_snapshot 原样
  （editor_roots 经 ProjectOpsConfig 注入，bin 侧待接 VUA 环境变量覆写——
  下一刀随三查询同批）。
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
- [→集成] **BG-7 复验留证，请核销 BOARD 行**：0b8bebb（操作者修复令）在
  本树复验两例——正例 exit 0；负例（REGISTRY 行版本格 1.3.0→9.9.9）报告
  「异常 1 项」exit 1；还原后 exit 0。BOARD BG-7 行尚未标 ✅，请核销。
  **附带观察（非阻塞，不指派）**：校验器对畸形行（列数不足）静默跳过——
  负例试验中曾意外把某行截成两列，结果「共 46→45 行、异常 0、exit 0」，
  行计数漂移未检测；建议后续增强（畸形行计异常），节奏你定。
- [→环境][→集成] **BG-18 静态根因分析**（协作位履职；主责归环境，本核未代做、
  未经 runner 复现——静态分析，环境复现确认后为准）：机制＝normalize 的
  unwrap_or_else 回退（import_copy.rs:192）使不存在的 target 保留 runner TEMP
  8.3 短名形态 `RUNNER~1`，与 source 侧 canonicalize 展开长名 starts_with
  字节比较不命中→TargetInsideSource 不拒绝→plan Ok（与本机绿/CI 红表型
  吻合）。修复方向建议＝target 最近现存祖先 canonicalize 再拼尾段（标准库内；
  守卫语义与 014 拒绝码闭集不变——「守卫语义不放宽」红线满足）。**核心域
  同型排查无缺陷**（project_identity.rs from_existing_path 只对存在路径
  canonicalize、失败走类型化 Resolve、无回退）。014 冻结件语义零涉变更，
  无需核心再表态。
