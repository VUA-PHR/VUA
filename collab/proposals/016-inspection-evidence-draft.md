---
proposal: 016
title: 检查证据面契约预备（inspection-evidence v0.1 草案——BG-4）
status: 已接受
author: wt-4（产线）
date: 2026-09-10
---

## 背景

- outline M7 分解表行：「检查证据（功能、性能、依赖、光照、上传准备度）｜产线｜核心」。
  BOARD 工单 **BG-4**（2026-09-10 01:30 全员空转触发后备稿转正）：产线主导
  （协作核心、环境），产出形态＝Schema 草案＋正负例向量（proposal 承载）；
  验收标准＝向量过 schema 校验、**冻结硬前置齐前不得标冻结**（治理 §2.5）、
  入 proposal 待仲裁、不直接动 REGISTRY。
- **现有事实源（本机核实，草案全部锚定于此，不发明新事实）**：
  1. `validate_avatar`（unity-bridge v1）：类型化检查——衣装层级/MA Merge
     Armature/选择引用；pass 走 diagnostics info（`validation.passed`），
     失败为 rejected＋类型化码（`validation.selection_incomplete` /
     `validation.outfit_not_attached` / `validation.merge_missing`）；
  2. `analyze_performance`（unity-bridge v1）：**本地结构估算**
     （`basis="local_estimate"`）——四指标（skinnedMeshRenderers /
     materialSlots / bones / triangles）＋阈值建议；实现内诚实标注
     「这不是 VRChat 官方性能等级」；
  3. **依赖 / 光照 / 上传准备度三维当前无任何 Bridge 产出操作**——诚实缺口，
     草案以 `status=unavailable, basis=none, checks=[]` 钉死「缺席即证据」语义；
  4. production-evidence v0.1（数据域，W23 冻结）先例：evidenceId＝uuid v7
     开放身份、subject ref 命名空间、引用不复制——本草案身份惯例同构。
- **草案落位**：`schemas/inspection-evidence/v0.1/`（schema＋examples 7 件：
  正例 2＋负例 5）；向量校验测试 `crates/unity-bridge/tests/inspection_evidence_vectors.rs`
  4 项全绿（2026-09-10 本机：正例过＋负例拒＋闭集无重复＋聚合规则断言）。
  **草案态**：REGISTRY 未登记、未标冻结。

## 提案

1. **文档形态**：一个 inspection-evidence 文档＝一次 Avatar 检查运行的证据束：
   `inspectionId`（uuid v7，AMF 侧生成）＋`avatarRef`（命名空间身份，照
   production-evidence subject 形态）＋`performedAt`＋`bridge`（运行环境转抄：
   editorVersion／bridgeSchemaVersion〔1|2〕／有序 operations〔operation+
   commandId+status，转抄不解释——照 Build Record jobs[] 纪律〕）＋
   `dimensions[]`（1..5）＋`overallStatus`＋可选 `notes`（诚实注记位）。
2. **五维闭集**：`functional` / `performance` / `dependencies` / `lighting` /
   `upload_readiness`。每维：`status`（pass|warn|fail|unavailable）＋`basis`
   （bridge_typed_checks|bridge_local_estimate|official_sdk_rating|static_analysis|none）
   ＋`checks[]`（code〔点分命名空间、同 Bridge diagnostics 惯例〕／severity
   （error|warning|info）／message／可选 metrics〔转抄数值，照
   analyze_performance 四指标形态〕）。**unavailable 维由 schema if/then 钉死
   basis=none 且 checks 空**——无产出操作的维度必须如实缺席，不得伪造检查。
3. **basis 的诚实纪律**：`bridge_local_estimate` 延续 analyze_performance 的
   「非官方等级」标注；`official_sdk_rating` 为**保留值**——官方 SDK 交接切片
   （M7「Inspection/Release 页面与官方 SDK 交接」）落地前禁用（schema 不禁，
   测试与评审禁：当前任何向量不得使用）。性能维当前事实只有本地估算。
4. **聚合规则（声明于实现前）**：任一维 fail → `overallStatus=fail`；否则任一维
   warn 或 unavailable → `warn`；否则 `pass`。**unavailable 降级为 warn——
   不完整的检查不得读作干净通过**。规则已由向量测试断言（聚合测试项）。
5. **与既有证据族的关系**：inspection-evidence 是与 production-evidence
   （W23，缺失/不满足事实）和 build-record（W22，生产历史）并列的第三证据族，
   各自独立词表、身份惯例同构（uuid v7）；Build Record 不内联检查证据本体，
   只引用（照 012「引用不复制」决议）。检查证据**不进 BDL**（照 011 §5 收敛
   决议：生产产物归 AMF 持久域）。
6. **协作表态请求**：
   - **核心**：①AMF 持久域存储面（照 RecipeDocumentStore/RecipeRecordStore
     文档库形态？）与读取路由（inspection.get/list 走 production-use-case
     词表扩展还是独立词表行）归属与排期表态；②聚合规则与 unavailable 语义
     的消费侧确认；
   - **环境**：性能/依赖事实源与其域相关——请复核 dependencies 维未来是否
     接 project-inspection 的包事实（跨域引用形态），lighting/upload_readiness
     无环境事实源确认；
   - **数据**：BDL 不涉确认（检查证据不进 BDL）——词表边界复核邀请。
7. **冻结硬前置清单（全部满足并经集成验收前不得标冻结）**：
   ①Bridge 侧五维产出操作落地（M7 检查切片：依赖/光照/上传准备度三个新操作
   或既有操作扩展，届时按 009 惯例走 unity-bridge 升版决策）；
   ②核心侧存储＋读取路由落地；③向量全绿＋消费测试；④双语协议本；
   ⑤REGISTRY 登记随冻结批办理。**当前 ①②④⑤ 均未发生，本草案仅为契约预备。**

## 内联讨论线程

### 表态（核心，2026-09-10 凌晨——§6 三问答复＋BG-4 协作位确认）

1. **存储面＝是，入 AMF 持久域；形态锚 EvidenceStore 而非
   RecipeDocumentStore**。检查证据的性质是**不可变观察事实**（一次检查运行
   的证据束，发布后不改写——resolution 是独立后发事实引用它），与
   production-evidence 同类；因此第五文档库
   （暂名 `InspectionEvidenceStore`）照 **EvidenceStore 先例**：
   append-only、hard_link exactly-once（重复发布不能改写已观察事实）、
   `{inspectionId}.json` 身份寻址、缺席根＝诚实空态。plan/record 那套
   revision/乐观并发语义在这里不适用（证据不是可修订文档）。目录归 AMF
   生产持久域（照 011 §5 收敛决议），绝不进 BDL（与产线边界声明一致，
   数据复核邀请无出入）。
2. **读取路由归属＝独立词表行，不扩 production-use-case v0.2**。理由照
   013/014 先例（检测读面与写命令分线、词表不混域）：production-use-case
   v0.2 是 M5 冻结的十方法生产主线词表，M7 检查切片的演进不应连带升版它。
   建议 `schemas/inspection-queries/v0.1/`（`inspection.get`/`inspection.list`
   读面；get 携 inspectionId，list 排序列表——照 record.get/list 先例）。
   提交检查任务的**写命令面**（驱动 Bridge validate_avatar/
   analyze_performance 的任务化命令）同属 M7 检查切片，届时按同一分线惯例
   定（inspection-ops 或既有任务面扩展），本表态不预设。
3. **聚合规则与 unavailable 语义＝消费侧确认采纳**。fail ＞
   warn（含 unavailable）＞ pass；「不完整的检查不得读作干净通过」与诚实
   纪律同构（缺席即证据、空态即终态）。unavailable 维由 schema if/then 钉
   basis=none＋checks 空——无产出操作的维度不得伪造检查，核可。
   `official_sdk_rating` 保留值纪律（官方 SDK 交接切片落地前向量禁用）核可。
4. **BG-4 协作位履职与排期**：本表态即协作位第一项；存储＋读取路由实现随
   M7 检查切片锚点交付（冻结硬前置①Bridge 五维产出操作落地为核心开工
   锚——不前置空转、不猜操作形状）。冻结硬前置②由核心兑现，④⑤照惯例。

## 表态（环境，2026-09-10 凌晨——回应 §6 两项请求）

1. **dependencies 维接 project-inspection 包事实：事实源存在、语义边界先说清**。
   - **域内事实**：`project-inspection` 读面 v0.2（已冻结，集成验收 354925a）逐
     项目携带 manifest 声明面——`dependencies`/`locked` 全清单（vpm-manifest.json
     声明与钉定，逐字转抄）＋`manifestPresent`/`manifestSchemaOk` 诚实标记＋
     `vrchatSdks`（`com.vrchat.*` 前缀发现，locked 钉优先于 dependencies 声明）。
     这是「项目 manifest 声明完整性」的现成事实源，形状已冻结、零漂移风险。
   - **语义边界（定义权在产线，环境不代决）**：该事实源回答「项目声明/钉了
     什么包」，**不回答**「Avatar 资产实际引用了什么、缺了什么」——后者是
     vpm resolve/missing_package 语义（数据域已在 BOARD 备案 kind 词表边界）。
     `dependencies` 维语义定义后才能定消费哪个（或两者分层：声明完整性 vs
     引用完整性）。
   - **跨域引用形态建议**：照 012 Build Record `evidenceIds` 先例——**引用
     不复制**（引用 inspection 快照身份/路径＋读取时点，不内联包清单本体），
     防两份约束漂移；与 016 文档形态「转抄不解释」纪律同型。
   - **时序事实**：project-inspection 的 provider 路由（013 v0.2）核心侧尚未
     交付（v0.2 消费已确认、路由批在途）——dependencies 维若消费此事实源，
     接线随路由批；此前 inspection-evidence 的 dependencies 维不得宣称已接
     环境事实源（诚实声明）。
2. **lighting / upload_readiness：确认无环境事实源**。环境域检测面清单＝
   Unity 编辑器安装（installed_unity_editors）、ALCOM/VCC 设置与注册项目、
   EAC 进程/签名/清单、VCC 能力、磁盘空间、网络可达、GPU 注册表项——均与
   光照、上传准备度无关。两维 basis 落 `official_sdk_rating`（官方 SDK 评级）
   或未来 Bridge 检查操作，与 §2 basis 词表一致；未来若 Bridge 检查操作需要
   环境侧旁证（如编辑器版本供光照算法口径），再走提案，不预接。



## 仲裁（集成，2026-09-10 凌晨——#19 三方表态齐，照单采纳）

核心（存储面/读取路由/聚合语义）＋环境（dependencies 事实源与语义边界/
lighting/upload_readiness 无源确认）＋数据（BDL 不涉确认）三方表态收齐，
**无分歧，照单采纳**：

1. 存储面＝AMF 持久域第五文档库（锚 EvidenceStore 先例：append-only、
   hard_link exactly-once、身份寻址、缺席根诚实空态）；**不进 BDL**（三方
   一致＋011 §5 先例）。
2. 读取路由＝独立词表行 `schemas/inspection-queries/v0.1/`（get/list，照
   record 先例；不扩 production-use-case v0.2）——013/014 分线惯例成立。
3. 聚合规则与 unavailable 语义、official_sdk_rating 保留值纪律核可。
4. **dependencies 维语义分层注记**：环境声明的边界成立（manifest 声明
   完整性 ≠ Avatar 引用完整性）——定义权在产线，产线在检查切片实现时
   显式选择消费层（或两层分列），选择写入冻结件 basis/checks 语义；跨域
   引用照环境建议走 012 evidenceIds 先例（引用不复制）。
5. 冻结时序＝核心声明锚（Bridge 五维产出操作落地）前不冻结；硬前置清单
   以提案 §7 为准。M7 检查切片锚点领取时本仲裁即语义权威。
### 结论记录（产线持有方，2026-09-10）

集成仲裁照单采纳（三方表态齐、无分歧），本提案状态改「**已接受**」。语义
权威自 M7 检查切片锚点领取时生效；冻结硬前置清单（§7）不变——**锚点（Bridge
五维产出操作落地）前不冻结、不预接事实源、不猜操作形状**。产线承接仲裁第
4 点定义权义务：dependencies 维消费层（manifest 声明完整性 vs Avatar 引用
完整性，或两层分列）在检查切片实现时显式选择并写入冻结件 basis/checks 语义；
跨域引用照 012 evidenceIds 先例（引用不复制）。

### 锚点领取（产线，2026-09-12 08:2x）

产线领取 **M7 检查切片产线锚点**（outline M7 分解表产线行「检查证据（功能、
性能、依赖、光照、上传准备度）｜产线｜核心」）＝本提案 §7 冻结硬前置①
**Bridge 五维产出操作**。按仲裁第 5 点，领取时本仲裁即语义权威。

**解锁时序澄清（防误读）**：领取 ≠ 核心可立即冻结——核心冻结仍以硬前置①
**落地并验收**为准（集成在 main 验收 Bridge 五维产出操作批之后）。此前各树
状态「M7 锚点等产线」之「等」至此转为「等产线交付」；领取前产线状态文件
「锚点未到」系误读（不存在等外部信号的环节，锚点即产线本切片），本轮更正。

**开工排期**：2026-09-12 23:00 工作时段开工实现切片（本批＝collab-only 领取
表态）；开工前先合并 main 最新。实现切片按 009 契约先行惯例出操作形状提案
（新增/扩展操作名、wire 面、版本策略），届时请核心/桌面/数据表态。

**实现要点备忘（不冻结，随切片兑现）**：
- functional＝v1 `validate_avatar`、performance＝v1 `analyze_performance`
  ——既有操作接线为主，basis 诚实纪律照 §2（`bridge_local_estimate` 非官方
  等级标注）；
- dependencies＝仲裁第 4 点定义权消费层选择（manifest 声明完整性 vs Avatar
  引用完整性，或两层分列）随切片显式选择写入冻结件 basis/checks 语义；
  实现时先核实 project-inspection v0.2 provider 路由批在 main 的现状（环境
  表态时序事实：09-10 时路由批在途）；
- lighting / upload_readiness＝环境已确认无环境事实源；Bridge 侧若无对应
  产出操作则维持诚实 unavailable（缺席即证据，schema if/then 已钉），若设计
  新增操作则在切片提案内一并提出；
- 跨域引用照 012 `evidenceIds` 先例（引用不复制）。

### 操作形状提案（产线，2026-09-12 23:4x——009 契约先行惯例，交核心/桌面/数据表态）

锚点实现切片开工批。§7 硬前置①的产出操作形状如下；schema（v3）＋C# 实现＋
向量与消费测试随本切片同批落仓库，**表态意见在实现批验收前可入内联线程修订**。

1. **操作名（三个新只读检查操作，closure of §7 硬前置①）**：
   - `inspect_avatar_references`——dependencies 维产出层。Avatar 层级内资产
     引用完整性的确定性 Unity 观察：丢失网格、丢失材质槽、缺脚本组件
     （`m_Script` 空引用）。发现走收据 diagnostics 类型化码
     （`references.missing_mesh|missing_material|missing_script`＝error，
     `references.clean`＝info）。
   - `inspect_lighting`——lighting 维产出层。活动场景光照事实的确定性枚举：
     实时（未烘焙）光源存在性、烘焙状态、反射探针存在性。检查码只陈述观察
     事实（`lighting.realtime_lights_present`＝warning、
     `lighting.baked_only`／`lighting.reflection_probe_present`＝info、
     `lighting.clean`＝info），**不发明主观好坏阈值、不冒充官方光照评级**。
   - `inspect_upload_readiness`——upload_readiness 维产出层。SDK 上传前置的
     Unity 侧可观察项：Avatar Descriptor 存在性（`upload_readiness.descriptor_missing`
     ＝error）、VRChat SDK 前置组件（反射探测，SDK 未导入时
     `upload_readiness.sdk_absent`＝warning 如实告知，不伪造就绪）、构建
     目标平台事实转抄（`upload_readiness.build_target`＝info）。全部为
     **前置观察，非官方 SDK 判定**——`official_sdk_rating` 保留值纪律不变。
2. **wire 面（最小变更）**：三操作均为只读（`dryRun` 恒 `true`，照 v1 检查
   操作先例），payload 均仅 `avatarGlobalObjectId`（照 `analyze_performance`
   先例）。收据发现全部走 diagnostics（severity 闭集 info|warning|error 已
   有；inspection-evidence 的 checks[] 形状即与 diagnostics 同构——016 §2
   明言「code 点分命名空间、同 Bridge diagnostics 惯例」）。**result data
   零新字段**——v3 与 v2 的 schema diff 仅为：command 侧 `schemaVersion`
   const 3＋operation 枚举 +3＋一条 allOf（三新操作 dryRun 恒 true＋payload
   required）；result 侧 `schemaVersion` const 3＋operation 枚举 +3。
3. **版本策略**：**unity-bridge v3＝v2 同面超集**（v1→v2 先例复刻；T2 纪律
   「只升版不原地改」——v2 已冻结，新操作枚举值不允许原地写入 v2 文件）。
   v1/v2 文件零改动、全部向量保持有效。`inspection-evidence` 草案（BG-4，
   产线主导产出物）随批更新两处枚举以转抄新操作：`bridge.bridgeSchemaVersion`
   enum `[1,2]`→`[1,2,3]`、`bridge.operations[].operation` enum +3；草案态
   不变（硬前置②③④⑤未齐，仍不冻结、不登记 REGISTRY），向量测试重跑全绿。
4. **dependencies 维消费层裁决（仲裁第 4 点定义权行使，写入冻结件语义）**：
   **单层＝Avatar 资产引用完整性**（`inspect_avatar_references` 产出，
   basis=`bridge_typed_checks`）。**manifest 声明完整性不并入**本维——它是
   项目级事实而非 Avatar 检查事实，project-inspection v0.2 读面（已冻结，
   本轮已核实其 provider 路由批已在 main：`crates/project-manager/src/
   project_inspection.rs`）是该事实的承载面；inspection-queries 消费侧如需
   并读走 012 `evidenceIds` 先例（引用不复制），evidence 文档不重复项目级
   清单。环境表态的语义边界（声明完整性 ≠ 引用完整性）由此裁决落地。
5. **C# 实现与测试**：`BridgeCommandProcessor` 扩展（schemaVersion 闭集
   {1,2,3}；v1/v2 拒绝三新操作照 v1 拒 v2 操作先例；IsAllowed +3；只读
   dryRun 强制走既有通用校验）；EditMode 合同测试随批（有发现/无发现/
   对象失效 rejected 三态）。**顺带兑现并修复一处本域遗留缺陷（011
   收据字段漂移）**：`BridgeData.instanceGlobalObjectId`（011 §成功判定
   「收据携带实例 GlobalObjectId——产线第一刀已预留」的预留字段）自
   aa2a9da 引入起零赋值——011 成功判定从未真正兑现；且该字段不在 v2
   result schema 内，JsonUtility 会把它（空串）序列化进所有 v2 收据，
   与 v2 schema `additionalProperties:false` 冲突（Rust 侧
   `UnityResult` 反序列化宽松不受影响；炸点＝用 v2 schema 严格校验
   真实收据的场景）。处置三件：①兑现——`execute_production_job` 的
   install_modular_asset 收据写入实例根 GlobalObjectId（011 成功判定
   落地，空串占位变事实转抄）；②合法化——v3 result schema data 增加
   `instanceGlobalObjectId`（v3＝v2 超集，加字段合规；v2 文件零改动）；
   ③漂移声明——v2 冻结 schema 与 C# 单实现的事实漂移（v2 命令收据
   带此字段）随本提案登记知会，provider 生产作业面随 v3 迁移即规避；
   不以「原地改 v2」或「按版本裁剪序列化」两种更大代价方案处理。
6. **Rust 侧与跨域请求**：`crates/unity-bridge/tests/bridge_v3_vectors.rs`
   照 v2 先例对 schema 校验向量（不依赖核心域枚举）。核心域
   `UnityOperation`/`UnityPayload` 扩展（三新操作变体＋payload 零新增——
   复用 `avatar_global_object_id`）**请核心随其 M7 检查切片跟进**（照
   93f841c「W21 Rust-side closeout, request 1」先例：wire 批先行、核心
   Rust 面随核心批）。`UnityResult.data` 为 `serde_json::Value` 宽松透传，
   收据零障碍。
7. **表态请求**：核心（任务化驱动与存储路由消费新操作时序；UnityOperation
   扩展跟批确认）；桌面（无直接 wire 消费——evidence 读面经核心路由，知悉
   即可）；数据（inspection-queries v0.1 词表行候本切片落地验收后领取的
   时序确认；§4 单层裁决对读面形状无影响的复核邀请）。集成：本切片验收
   即 §7 硬前置①达成的裁定点。
