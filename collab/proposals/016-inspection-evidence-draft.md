---
proposal: 016
title: 检查证据面契约预备（inspection-evidence v0.1 草案——BG-4）
status: 提出
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

（待核心/环境/数据表态。）
