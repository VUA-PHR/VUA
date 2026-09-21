---
proposal: 029
title: "车间入口模型重构（配方驱动为主）＋从已有 Unity 项目导出 Recipe（用户裁决 2026-09-21 立项，U16 答复；核心座起草）"
status: 提出（2026-09-21 第 152 批起草；起草依据＝用户裁决 U16 答复〔BOARD 用户裁决表〕；本批为纯文档批，零构建零测试零代码）
author: wt-2（核心，用户裁决转述起草）
date: 2026-09-21
---

# 提案 029：车间入口模型重构（配方驱动为主）＋从已有 Unity 项目导出 Recipe

## 背景

### 用户裁决（权威源，2026-09-21，U16 答复）

用户裁决车间入口模型**配方驱动为主**，期望流转为：

> Recipe 列表创建 Recipe → 点选添加素材 → 打开本地素材仓库（可添加本地/云端素材）
> → Recipe 列表选择 → 预览内容 → 点击组装 → 车间只作状态显示。

并裁决新增配套功能：**从已有 Unity 项目导出 Recipe**（反向方向：项目 → 配方）。

裁决落账面：①本提案 A 面（车间入口模型重构）；②本提案 B 面（项目导出 Recipe）。
U16 行（BOARD 用户裁决表）由集成随本提案验收改记「已裁决／已立项」。

### 上位权威一致性

- **产品边界**：`docs/product-boundary_ZH.md` §Recipe-first（:73「先选择素材与素材目标，
  再创建或修改 Unity 项目」）——本裁决是 Recipe-first 原则在车间入口模型上的**操作化**，
  不改边界语义，无需边界升版（候集成验收复核）。
- **设计标准 §2.2 Recipe-first**（0.7.13）：已接受原则与本裁决同向；§8.4/§8.5 的呈现
  规则升级见 A 面预告节。
- **BOARD #44 装配词面纪律**（用户裁决 2026-09-21）：「装配」保留给配方链（衣装挂接）
  语义，素材直导链不得称「装配」。本提案用户动作词面从裁决原文用**「组装」**；
  涉及衣装挂接语义处用「装配」。A 面落词随桌面 i18n 纪律办理。
- **U14／027 裁决④**（2026-09-19）：包管理器以 Recipe 自动化为第一消费者——本提案 B 面
  导出的 `dependencies` 维度与该方向同源（Recipe 输入 → 包需求集合），落地时消费 024–027
  已冻结的 packages 读面，不另立包查询面。

### 现状盘点（代码事实，slot/wt-2 于 main e394831f 世代只读实测，2026-09-21）

**（1）车间页＝素材驱动链唯一接线。** `WorkshopPage.tsx` 的执行主体是
`ProductionFlowSection`（F3 生产纵向流程段，production-use-case **v0.1** 素材直产链）：
`pickMaterial → startInspection → requestPlan → confirmPlan → recover` 全链在车间页内
发起（`WorkshopPage.tsx:536-635`）；车间页对配方的接触仅限流水线条（S-IX-1）的显示面——
读 `recipeGraph(CURRENT_RECIPE_ID)` 与 `releaseWall` 取 recipeId 与最新出厂做链卡跳转
（`WorkshopPage.tsx:500-525`），不发起任何配方链动作。

**（2）配方链后端已完整。** `crates/orchestrator/src/assembly.rs`：`AssemblyEngine`
提供 `derive_plan / confirm / execute` 三段（:259/:441/:470），八操作闭集
`AssemblyOperation`（ProvisionProject/InstallPackages/BridgeInspect/BridgeIdentifyAssets/
BridgeInstallModularAsset/BridgeCreateToggle/BridgeValidateAvatar/BridgeAnalyzePerformance，
:130-141），`AssemblyPlanV1` 计划含包变更全量预览 `package_preview`（:168-196）；
`crates/orchestrator/tests/assembly.rs` 套内在库。wire 面为 production-use-case **v0.2**
（`schemas/production-use-case/v0.2/`：recipe-list/get/save/resolve、plan-approve/get/list、
job-execute、record-get/list），provider 侧服务路径在 `provider_host.rs`（recipe.resolve
→任务化 Local Resolution 执行器 :2602/:4119、plan.approve 文档面 :3982、job.execute 任务化
编排 :3267）。**注记（如实）**：`AssemblyEngine` 自 `orchestrator/src/lib.rs:42` 导出但
provider 服务路径当前消费的是 Local Resolution 执行器与任务化编排臂；引擎与 v0.2 服务
路径的归一（或分工定性）属 B/A 面冻结批的核对输入，本提案不预决。

**（3）桌面「配方 → 执行」入口未接入主流程。** `gateway.productionChain` 端口
（`production-chain-port.ts:28-43`，v0.2 全方法）**已被消费**——消费点是配方链卡
`ProductionChainSection`（resolveRecipe/approvePlan/executeJob/listRecords），挂载在
`ComposePage.tsx:196`；而搭配草稿页自 2026-09-20 导航重构起是配方页 hero 内的内容型
弹窗（`RecipePage.tsx:1165-1172`，`nav-model.ts` 头注）。链状态机
（`production-chain-store.ts`）的配方身份**唯一外部写入方**是
`productionChainRecipeSavedAction`，唯一调用方是容器层保存链 `compose-save-chain.ts`
——即：**执行入口只在「保存搭配草稿」这一动作之后可达**；在配方库中选择一个已有
Recipe 并不填充链，配方页主体（列表/图谱/爆炸三视图）无「组装」发起面，车间页亦无。
裁决期望的「Recipe 列表选择 → 点击组装」在现状代码中不存在接线。

**（4）VUA-8 导航重构已并入。** 合并 0f9350f（第 141 批，用户授权并线）：
production-nav 重构＋unity-bridge v4 `build_preview`；2026-09-20 导航重构将素材导入与
搭配草稿收敛为仓储页/配方页 hero 内弹窗（`nav-model.ts`；设计标准 0.7.12/0.7.13 §8.3/
§8.4/§8.6）。A 面重构在该 IA 基础上进行，不再动导航骨架。

## 面清单

### A 面：车间入口模型重构（桌面消费为主）

**目标：把「制作中枢」从车间页移到配方页，车间页降级为执行状态面。**
A 面主要是既有 wire 面（production-use-case v0.2、recipe 读面、素材读面）的桌面重接线，
零预期新增 wire 契约；若切片中发现事实缺口，按环流水线补冻结，不夹带。

现状 → 目标逐卡对照（卡名即裁决流转步骤）：

| # | 裁决流转 | 现状 | 目标形状（候桌面形状核可） |
| --- | --- | --- | --- |
| A1 | **Recipe 列表创建 Recipe** | 配方页有库（recipe.list 读面＋库选择）；创建走搭配草稿弹窗保存链 | 配方页主路径提供「创建」入口（现有草稿弹窗保留为创建起点之一）；创建产物进入配方库并可被选择 |
| A2 | **点选添加素材** | 草稿弹窗内从素材读面把素材加入搭配（warehouse 读面）；配方库选中态与素材添加无关联 | 配方详情/选中态内提供「添加素材」动作，写入当前所选 Recipe 的素材集（复用 recipe.save 守卫与版本链） |
| A3 | **打开本地素材仓库（本地/云端素材）** | 仓储页是素材库主面；云端/BOOTH 接入面在素材导入域（内嵌浏览/acquisition 链），与配方页无直连 | 「添加素材」步打开素材仓库选择面：本地素材来自仓储读面；云端素材接入面列未决项 3（不臆断形状） |
| A4 | **Recipe 列表选择 → 预览内容** | 三视图（图谱/列表/爆炸）已是成熟预览面；库选择不驱动任何链 | 库选择即为预览主体（三视图复用）；选择态喂给组装发起（补链状态机 `selectRecipe` 动作，或等价形状候冻结核对） |
| A5 | **点击组装** | 仅「保存草稿后」在弹窗链卡内可达（resolveRecipe→approvePlan→executeJob） | 配方页选中态提供「组装」发起，消费既有 productionChain 端口同方法；计划确认（plan.approve＋风险决策）与执行进展呈现沿用既有确认链纪律（011 计划锁定、九态任务） |
| A6 | **车间只作状态显示** | 车间页＝素材直产链发起面＋流水线显示条 | 车间页改为执行状态面：消费组装任务进展/收据/恢复决策（任务中心同源事实），不再承担配方驱动链的发起；素材直产链在车间的去留列未决项 1 |

**词面与设计标准升级预告**：§8.4（Recipe 页成为制作中枢的呈现规则）、§8.5（Assembly/
车间＝执行状态面的演出语义——车间演出方向保留，演出密度仍以「流程逻辑冻结后」为准）、
§8.3（仓储页动作形态候未决项 1 裁定后一并）升版候桌面按纪律办理（0.7.14+，双语同步，
REGISTRY 随行）。本提案只登记预告，不代桌面落文。

**A 面纪律**：渲染面只呈现 Gateway 实际返回（诚实律 1）；未就绪/失败/空态照既有阻断
与重试形状；023 投影纪律（纯导航零记录身份跨页）在链卡跳转迁移时继续适用。

### B 面：从已有 Unity 项目导出 Recipe（核心域为主）

**目标：从已有 Unity 工程可靠导出「Recipe 草稿」（draft）——项目 → 配方的反向方向。**
诚实纪律先行：**导出不宣称还原设计意图**；导出物是待用户确认补全的草稿，不是成品
Recipe。

**能力盘点（可导出，代码事实锚）**：

1. **VPM 包依赖（可靠）**：`inspect_project_deep`
   （`crates/project-manager/src/project_inspection.rs:238`）只读返回
   `manifest_present / dependencies / locked / vrchat_sdk s / unity_version / mutation_status /
   vua_identity / diagnostics`（`ProjectInspectionV01`）。`vpm-manifest.json` 的
   dependencies＋locked → `RecipeV02.dependencies`
   （`recipe/model.rs:334` `DependencyV02{package_id, version_constraint, …}`）是确定性映射。
   供给安装侧已有 U17 落地的 `VpmBackend::resolve_project`（第 147 批）承接重放。
2. **Unity 版本约束（可靠）**：检查面 `unity_version`＋分类 →
   `EnvironmentSpec.unity_version_constraint`（`recipe/model.rs:55`）。
3. **工程身份（可靠）**：`VuaIdentityFinding`（Absent/Present/Unreadable，:71-80）判定
   工程是否 VUA 原生——用于适用边界注记（未决项 2），不进入配方正文。

**能力盘点（需新桥接只读扫描，能力边界如实列）**：

4. **Avatar/衣装结构 → 关系面**：`RecipeV02` 的 assets/instances/relations/wardrobe_groups
   需要场景层级事实。现状只读 Bridge 操作
   （`crates/orchestrator/src/model.rs:38-66` 非突变集：InspectProject/IdentifyAssets/
   ValidateAvatar/AnalyzePerformance/InspectAvatarReferences/InspectLighting/
   InspectUploadReadiness）中，**没有任何一个做「场景内 Avatar/衣装层级发现」**——
   `IdentifyAssets`（`BridgeCommandProcessor.cs:504`）是「确认给定选择」
   （要求调用方已给 avatar/outfit 的 globalObjectId），不是发现；InspectAvatarReferences
   以给定 Avatar 为前提做引用完整性。→ 关系面导出**需要新的只读扫描操作**（枚举场景
   Avatar 候选、衣装/挂接结构候选），而 Bridge v4 已冻结——新操作＝协议升版决策
   （v4 加法或 v5），按 009/冻结纪律走冻结环，本提案不预决形状。备选路径（零桥接改动）
   ：关系面全部留给用户在配方页点选补全，导出只产 packages＋环境＋空关系骨架。
   两案候冻结批裁量（未决项 4）。

**不可导出（诚实边界，导出面必须如实标注缺失）**：

1. **设计意图**：素材为何入选、语义角色（如「夏季校服」的衣装分组语义）、标签意图
   未落盘于工程——导出物不得虚构 role/label；`AssetRole` 缺省走 Other 并标记
   「待补全」。
2. **素材来源指纹**：`SourceRef{provider, product_id, url}`（`recipe/model.rs:154`）只有
   VUA 导入记录（`.vua/imports/<command_id>` 等）可回溯；非 VUA 渠道进工程的素材**只有
   文件指纹可提供身份比对**（material_identity 指纹能力），不提供来源——导出物中
   source_ref 缺席即缺席，不以文件路径伪装来源。
3. **非 MA 挂接结构**：衣装挂接若非 Modular Avatar Merge Armature 等 VUA 装配链可识别
   结构，或 toggles 由第三方工具（如 VRCFury）创建——relations/wardrobe_groups 不可自动
   推导，如实留空待补。

**导出物定性（草案，冻结环定稿）**：导出产物是 **Recipe 草稿（draft）**——进入配方页
草稿/确认流，用户确认补全（roles、source_refs、relations、标题语义）并显式保存后才成
正式 Recipe（recipe.save 版本链）；草稿态在 UI 与读面中如实标注「项目导出草稿＋缺失
维度清单」，绝不静默转正。载体形状（recipe.save 扩展 vs 导出独立面 vs 文档内
provenance/缺失块）候冻结环，本提案不预决。

**B 面环流水线**（照 024–028 五环先例的收敛形；权限按 AGENTS 六角色）：

1. **冻结**（核心域）：Recipe 导出面 Schema＋正负例向量＋至少一端消费测试——
   导出触发面（production-use-case 扩展 or 新族）、导出文档形状（含草稿定性＋缺失
   维度标注）、关系面扫描的双案裁量（新只读桥操作＋协议升版 vs 零桥接骨架）。
   冻结前置＝A 面切片确认消费形状（两面耦合，见下节）。
2. **接线**（核心域）：provider-host 路由臂＋能力行协商（照 027 F3 双版本协商先例，
   零破坏加法）。
3. **实现**（核心＋环境/项目域协作）：导出执行器（工程只读扫描 → 草稿文档落盘）；
   如裁定走新桥操作，含 C# 只读扫描实现（生产域）。
4. **消费**（桌面域）：配方页「从项目导入」入口＋草稿确认补全流（与 A 面同页呈现）。

### 两面耦合与排序

- **A 依赖 B 的程度**：A 面重构可在「手工创建的 Recipe」上先行（现有配方链后端已完整，
  A1/A2/A4/A6 不依赖导出物）；**B 面的草稿确认补全流消费 A 面产出的配方页中枢形状**
  （导入草稿要有页面可落）。
- **建议环序**：
  1. A 面先行切片：A1/A2/A4/A5（配方页中枢＋组装发起接线）＋A6（车间降级）——
     纯既有 wire 面桌面消费，候桌面领取；
  2. B 面冻结（以 A 面落形为消费形状输入）→ 接线 → 实现 → 消费（导入入口落配方页）；
  3. 设计标准升版（0.7.14+）随 A 面消费批落地；未决项 1（素材直导去留）裁定前，
     车间页素材直产链**现状维持不拆**（诚实且可回退——降级是加「状态面」职责，
     不是先删除既有可用链）。
- **验收门**：A 面消费批＝desktop typecheck＋vitest＋check:i18n/boundary/leak 全绿＋
  空态/失败态诚实呈现钉；B 面各环按 027 先例（冻结批 Schema＋正负例＋消费测试齐备，
  接线批 wire 测试骑真帧，实现批集成亲审，消费批定向复跑）；真机（真实工程导出→
  组装→车间状态呈现）归 W25（O-2）如实候验，**零端到端宣称**。

## 边界（明确非目标）

1. 本提案不改产品边界语义（Recipe-first 已在边界 §原则，本裁决是操作化不是扩权）；
   BOOTH 购买/支付/访问控制红线不变（安全与法律边界照 AGENTS）。
2. 本提案不改 Unity 全局版本纪律（2022.3.22f1）；导出面照实记录工程版本，不做
   版本迁移。
3. 本提案不立项社区插件/市场面；导出物是本地文档，不涉分发。
4. A 面不新增 wire 契约为默认立场；发现缺口走冻结环，不夹带。
5. Bridge v4 冻结面不做未升版的动作面改动；新只读扫描操作必须过协议版本决策。
6. 导出不宣称还原设计意图；草稿不静默转正；来源缺席不伪装（诚实三律 1/2/3 直接适用）。
7. 素材直产链（production-use-case v0.1）在未决项 1 裁定前不做删除性改动。

## 未决项清单（如实列，不臆断）

1. **素材直导链在配方驱动模型中的去留**（候桌面形状核可，涉 §8.3/§8.5）：仓储页动作
   vs 车间备选入口 vs 仅保留只读状态面。裁定前车间现状维持（见排序节 3）。
2. **导出对非 VUA 创建工程的适用边界**（用户手工 VCC/ALCOM 工程是否可导出、
   `VuaIdentityFinding=Absent` 时是否提示差异）：候选用户裁决项；冻结批起草对表时如
   判定涉产品边界语义升 [需用户]。
3. **BOOTH/云端素材在「添加素材」步的接入面**：与 U18（shader 依赖策略，候用户裁决）
   及 BDL 面联动（候集成随本提案验收登记开放问题行——派单称 #46，以集成登记为准）；
   云端素材选择面是否复用素材导入域内嵌浏览/acquisition 链，候素材/采集域表态。
4. **关系面扫描双案裁量**（冻结批输入）：新只读桥操作（需协议升版决策）vs 零桥接
   骨架＋用户点选补全；涉 C# 面与生产域协作。
5. **`AssemblyEngine` 与 v0.2 服务路径（Local Resolution 执行器＋任务化编排臂）的
   归一/分工定性**：现状两套后端形状并存（引擎已测未接服务路径）；A5 接线前需核对
   「组装」实际触达的执行链并在冻结批如实定性，本提案不预决。

## 内联讨论线程

### 回复（集成，2026-09-21 第 154 批）

**文档批验收登记（基线 e394831f，cd8c0000＋d2063abe，--no-ff 合并 9125f8f1）**：
提案结构照 024–028 先例核对成立，上位权威一致性复核通过（产品边界 Recipe-first 系
操作化非扩权；设计标准 §2.2 同向；#44 装配词面纪律——用户动作词面从裁决原文用
「组装」）；A 面四条现状盘点与 B 面三档能力盘点的代码事实锚抽核吻合。本登记系
**文档入库验收，不是提案采纳**：status 维持「提出」，环流水线未启动。后续领取面：
A 面形状核可候桌面（含未决项 1 素材直导链去留表态），B 面冻结候核心领取（冻结前置＝
A 面落形，未决项 4 关系面双案与未决项 5 引擎/服务路径归一为冻结批核对输入）；未决项 3
＝开放问题 **#46**（集成第 152 批已登记，编号 030 候用，以登记为准）；未决项 2 涉边界
语义时按提案自订升 [需用户]。设计标准 §8.3/§8.4/§8.5 升版预告（0.7.14+）已录 BOARD
#41 关联面，归桌面域办理，本提案不代落。零端到端宣称维持。

（待续。各席位按 `### 回复（<角色或 wt>，YYYY-MM-DD）` 追加：A 面形状候桌面表态，
B 面冻结候核心领取，跨域契约分歧升集成仲裁，产品判断升 [需用户]。）
