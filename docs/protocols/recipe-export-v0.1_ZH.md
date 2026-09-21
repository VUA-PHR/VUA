# recipe-export 协议 v0.1（Recipe 导出词表行：recipe.exportProjectDraft）

[English](recipe-export-v0.1_EN.md) | [简体中文](recipe-export-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（Recipe 导出词表行）**（2026-09-22，proposal 029 B 面
> 环 1 核心冻结批：桌面侧前置成就〔第 159 批收编 029 内联 wt-3 形状判决
> 书〕后领取，三裁决见「核心裁决」）
> 机器可读词表：`schemas/recipe-export/v0.1/`（单方法 Schema＋正例 5＋
> 负例 8 向量；核心消费测试 `crates/orchestrator/tests/recipe_export.rs`）
> 范围：`recipe.exportProjectDraft`（从一个已注册 Unity 工程导出
> **Recipe 草稿**——项目→配方的反向只读派生）；配方链执行面归
> production-use-case v0.2（零触碰）
> 所有权边界：词表冻结与 wire 路由＝核心域；导出执行器实现＝核心域
> （读 013 检查聚合，project-manager 侧零新读面）；桌面消费（配方页
> 「从项目导入」＋草稿确认补全流）＝桌面域（形状判决书 029 内联
> wt-3 节为消费形状输入）
> 更新：2026-09-22（v0.1 冻结批：双语协议本＋REGISTRY 登记）

## B 面定位语义（029 环流水线第一环）

用户裁决 U16（2026-09-21）配套功能：**从已有 Unity 项目导出
Recipe（草稿）**。诚实纪律先行：**导出不宣称还原设计意图**——工程
落盘的事实只有依赖清单、编辑器版本与工程身份注记；素材为何入选
（role/label 语义）、来源（source_ref）、装配关系（relations/
wardrobe_groups）、标题语义均不在盘面，导出物是**待用户确认补全的
草稿**，不是成品 Recipe。草稿经配方页确认补全流（桌面判决书形状：
库选择态＝预览主体、添加素材＝仓储读面投影选择器、**唯一保存链
recipe.save**——D5 查重＋忙碌守卫＋baseRevision 版本链）由用户显式
确认补全并保存后才成正式 Recipe；**草稿绝不静默转正**。本面零端到
端宣称；真机全链（真实工程导出→确认→组装→车间状态）归 W25（O-2）。

## 冻结收口（029 B 面环 1 硬前置逐项）

- **桌面侧前置**：029 内联 wt-3 形状判决书（第 159 批收编，合并
  7aa3bbe5）①②③节＝消费形状输入——A4 选择事实源动作（链身份键值
  {recipeId, revision} 只取 recipe.get 回执文档身份）、A3 选择器＝读
  面投影不立第三导入入口、A2/A1 唯一保存链同守卫集。A5 订正采信（见
  核心裁决 4）；
- **Schema＋正负例向量**：`schemas/recipe-export/v0.1/`（本批，5 正
  8 负）；
- **至少一端消费测试**：`crates/orchestrator/tests/recipe_export.rs`
  （6 例：向量接纳/拒绝＋词表身份与闭集自省钉＋typed serde 双载体负
  例拒绝〔deny_unknown_fields〕＋packageId 升序确定性钉＋诚实标记
  iff 钉）；wire 帧环测试随接线批；
- **双语协议本＋REGISTRY**：本文件＋EN 镜像＋REGISTRY 两行（本批）。

## 核心裁决（029 未决项收敛定形）

1. **关系面双案裁决（029 未决项 4 关闭）＝案 B：零桥接骨架＋用户点
   选补全**。五点理由：
   ①**诚实律**——即便新只读桥扫描，产出的也只是「结构候选」，不带
   语义角色/来源/设计意图；用户确认在两案中都必不可少，案 B 不创造
   「已还原结构」的假象，missing 清单把「不可自动导出」作为类型级事
   实；
   ②**冻结面纪律**——Bridge v4 已冻结，新只读扫描操作＝协议升版决
   策（v4 加法或 v5），涉生产域 C# 面与独立冻结环（向量＋双端合同测
   试＋真机）；把用户已裁决的导出功能耦合到它并不要求的跨域协议升版
   上，属自造阻塞；
   ③**消费形状已成就**——桌面判决书的草稿确认补全流（A 面中枢）就
   是点选补全的既有主路径，补全不是降级；
   ④**边际价值不对称**——扫描案只买得到 Avatar/衣装结构候选枚举，
   买不到两个真正缺失的维度（设计意图 role/label、来源 source_ref）；
   ⑤**可升级**——missing 闭集清单为案 A 留有类型面：若日后升版接入
   扫描，v0.2 收缩清单即机器可检测的诚实增量。
   **案 A 只登记不实施**（候选＝unity-bridge 只读场景结构发现操作，
   涉生产域 C# 面；独立冻结环候 W25 真机走查后裁定；本批零协议升版
   动作）。
2. **载体裁决＝导出独立面（新族 recipe-export/v0.1）**。代码事实：
   recipe v0.3 文档面 `assets`/`instances` minItems 1＋asset 行
   anyOf(entityRef|sourceRef)（`schemas/recipe/v0.3/recipe.schema.json`
   实读）——**诚实的空骨架作为 Recipe 文档不可能存在**：不发明
   entityRef/sourceRef 就过不了 Schema，发明即违反诚实三律。recipe.save
   扩展（收草稿态）＝改冻结保存链语义并制造「静默转正」通道（诚实律
   禁止）；文档内 provenance 块方案被同一 minItems 事实否决。独立面使
   「草稿/正式」边界成为**类型级事实**：草稿类型没有通往 resolve/
   assembly 的路径，唯一转正通道＝用户经既有保存链显式确认。
3. **用例面裁决＝新词表行族＋单方法＋同步只读 Query**。不入
   production-use-case：该族是配方链执行族（recipe-list/get/save/
   resolve、plan/job/record），导出是 project→recipe 反向只读派生，
   语义不同构；扩族＝v0.3 升版动冻结面，无必要。同步 Query 照
   packages-ops preview 先例：本地文件只读扫描（零 Bridge、零网络、
   零突变），**不设九态任务**——不发明可取消性/恢复面，纯读无物可
   恢复。params 闭集单键 `projectPath`（013 注册身份）；未注册路径复
   用 `vua.project.project_not_found`（024 packages-query 判例：同一
   事实同一错误码）。
4. **词面对照采信勘误**：携风险决策的 confirm-plan 系 amf-production
   **v0.2** 方法面四键 {planId, observedRevision, riskChoice,
   rememberForSession}（riskChoice 系 v0.2 登记面新增，无 v0.1
   confirm-plan 方法 schema，build-record v0.1 仅持久化 riskChoice
   值）。**本面无风险决策、无 plan 面**：草稿确认转正走 recipe.save
   版本链，与计划批准/风险决策零交集；配方链计划批准若需风险决策，
   属 production-use-case v0.2→v0.3 升版事项（候独立冻结环），不在
   本词表预留任何字段。
5. **非 VUA 工程（029 未决项 2 保持开放）**：本面把 VUA 原生身份三
   态（absent/present/unreadable）作为 origin 事实如实携带（013 检查
   聚合 v0.2 增量投影），**absent 不是本面的门**；已注册手工
   VCC/ALCOM 工程导出时是否提示差异＝呈现裁定，候用户裁决（029 未决
   项 2 维持开放，本面为其提供事实源）。零产品边界变化：导出＝已注册
   工程只读检查事实的派生投影，与 013 检查面同世界。

## 方法面

| 方法 | 分型 | 语义 | 消费方 |
| --- | --- | --- | --- |
| `recipe.exportProjectDraft` | Query（只读同步） | 从一个已注册工程导出 Recipe 项目草稿：经 013 检查聚合读取 VPM manifest 声明依赖＋locked 钉定、观察到的编辑器版本、VUA 原生身份三态，投影为草稿文档 | 配方页「从项目导入」＋草稿确认补全流（桌面消费批候接线/实现批） |

params 闭集单键：`projectPath`（`minLength 1`；013 注册身份，与
`project.inspectProject` 同一族）；`additionalProperties: false`——
词表外参数＝`vua.recipe_export.invalid_params` validation 错误信封
（形状违反绝不冒充缺席）。

## 结果文档（Recipe 项目草稿 v0.1 闭集）

- 信封照既有命令面先例：`schemaVersion`（const `"0.1"`＝词表行族版
  本常量）＋`operation`＋`result`；`result` 本体携带自有族常量
  `vua.recipe-export/v0.1`——两版本相互独立（c914cf2 常设规则）；
- **草稿文档闭集七键**：`schemaVersion`（族 const）、`draftId`
  （uuidv7，每次导出铸造的**草稿实例身份**——**不是 recipeId**，
  Recipe 身份只在用户显式确认保存时由保存链铸造）、`exportedAt`
  （RFC 3339）、`origin`、`environment`、`dependencies`、`missing`；
- `origin` 闭集三键：`projectPath`（013 身份回显）、`projectName`
  （检查面观察到的工程名 verbatim，可空）、`vuaIdentityStatus`
  （absent/present/unreadable 三态）。工程名只是来源事实——草稿**无
  title 字段**，确认流是否以其预填标题输入＝桌面呈现决策；
- `environment` 单键：`unityVersionConstraint`——观察到的编辑器版本
  verbatim（照 029 边界 2 不做版本迁移），**null＝磁盘上不可读的诚实
  缺席**；无 capabilities 键（v0.1 无生产者事实，ORC-DEV-004）；
- `dependencies` 行闭集三键：`packageId`（manifest 键 verbatim）、
  `versionConstraint`（声明 verbatim，如 `3.7.x`）、`lockedVersion`
  （locked 同 id 精确版本，缺席＝无钉定）。**映射确定性冻结**：行集
  ＝manifest `dependencies` 声明集；`packageId` 升序（冻结的确定性呈
  现事实，消费方可依赖——packages-query 先例）；locked-only 条目（在
  locked 未在声明）不产生行（传递解析事实非用户声明意图，见「词面之
  外」）；**空数组＝合法诚实应答**（manifest 缺席或零声明依赖）；
- **`missing` 缺失维度清单＝草稿的诚实核心**：枚举闭集十值
  {assets, instances, relations, wardrobeGroups, targetAvatar,
  assetRoles, assetLabels, sourceRefs, titleSemantics,
  environmentUnityVersion}；前九值**恒在**（关系面五维＝案 B 零扫描
  裁决；语义四维＝设计意图/来源/标题语义永不由导出断言），逐值
  contains 钉死；`environmentUnityVersion` 与
  `unityVersionConstraint: null` **双向 iff**（两条 if/then 钉死）。
  确认流必须照单呈现「项目导出草稿＋缺失维度清单」（029 B 面定性）。

## 草稿定性（诚实三律的形状钉）

1. **不宣称还原设计意图**（诚实律 1）：role/label/标题语义/来源恒列
   missing；发明字段的草稿按 Schema 即非法（additionalProperties:
   false 虚假断言防线），绝非「不鼓励」；
2. **草稿不静默转正**（诚实律 3 同构）：无 recipeId＝无链身份；转正
   唯一通道＝用户显式确认后的 recipe.save 版本链；导出动作本身不落
   配方库任何状态；
3. **来源缺席不伪装**（诚实律 2）：本面根本不携带 source_ref——非
   VUA 渠道素材的来源回溯不在本面词表（文件指纹比对属素材身份域能
   力，不入导出面）。

## 错误码闭集与缺席语义

| 码 | category | 语义 |
| --- | --- | --- |
| `vua.recipe_export.unavailable` | unavailable | 路由/导出执行器未接线＝**诚实缺席**——绝不折叠成伪造草稿 |
| `vua.recipe_export.invalid_params` | validation | params 闭集违反（形状违反绝不冒充缺席） |
| `vua.project.project_not_found` | validation | projectPath 不在 013 聚合注册面（**复用 013 码**：同一事实同一错误码，判定与 `project.inspectProject` 同口径） |

观察失败不设错误码：manifest 缺席＝诚实空 `dependencies` 数组；编辑
器版本不可读＝`unityVersionConstraint: null`＋missing 携
`environmentUnityVersion`——诚实呈现，绝不以编造事实冒充读取成功，
也绝不把「可如实呈现的空态」虚报为失败（诚实纪律 1/2）。

能力行与 wire 路由（provider-host 臂＋族常量
`vua.recipe-export/v0.1`＋信封常量命名）随核心接线批落地——照
A3/A4/A5/F2/F3 先例族常量接线批发布。

## 依赖方向

```text
React View（配方页「从项目导入」＋草稿确认补全流，桌面消费批）
  → 类型化 feature/Gateway（recipe-export 词表行投影）
  → Electron preload 与主进程适配器
  → 版本化应用契约（recipe.exportProjectDraft 词表行）
  → provider-host 路由（核心域，接线批）
  → 导出执行器（核心域 use case，读 013 检查聚合——零新 project-manager 读面）
  → 确认补全后的转正＝既有 recipe.save 版本链（零第二保存链）
```

## 机器可读词表

`schemas/recipe-export/v0.1/`：`command.schema.json`＋
`result.schema.json`＋`examples/`（正例 5——request 闭集单键／全量
草稿〔VUA 原生＋两声明依赖其一 locked 钉定＋版本可读〕／非 VUA 工
程〔identity absent＋projectName null〕／版本不可读〔constraint
null＋missing 十值〕／诚实空依赖；负例 8——params 词表外键／空
projectPath／依赖行发明 `optional` 字段〔虚假断言防线钉死〕／missing
缺恒在维／missing 词表外维／null 无标记〔iff 臂一〕／标记无 null
〔iff 臂二〕／草稿携带关系面＋recipeId＋title〔类型边界钉死〕）。
消费测试：`crates/orchestrator/tests/recipe_export.rs`（6 例）。词表
或字段变更必须升版本，绝不原地改写。

## 明确词面之外

- **locked-only 依赖**不产生行（传递解析事实；如需呈现归检查面读
  途，不入本词表）；
- **桥接只读扫描（案 A）**未立项未排期——候选登记＝unity-bridge 只
  读场景结构发现操作，涉生产域 C# 面与协议升版决策，独立冻结环候
  W25 真机走查后裁定；本批零协议升版动作；
- **非 VUA 工程差异提示**（029 未决项 2）＝呈现裁定，候用户裁决；本
  面只携带三态事实；
- **capabilities / 性能目标 / 素材清单 / 实例 / 关系 / 衣装分组 /
  title / recipeId / locked 块 / extensions** 均无生产者事实或刻意不
  立面（ORC-DEV-004：无实现不预留字段）；
- **多工程批量导出、导出历史、草稿落盘持久化**（确认前的草稿驻留属
  桌面确认流状态，归其实现决策）均不立。

## 开放项

- wire 路由＋能力行＋port face（核心域接线切片）：紧随冻结批
  （029 B 面环 2）；
- 导出执行器实现（核心域，读 013 检查聚合；029 B 面环 3）；
- 桌面消费批（配方页「从项目导入」入口＋草稿确认补全流，消费 A 面
  中枢形状；029 B 面环 4）候形状核可；
- 非 VUA 工程适用边界呈现（029 未决项 2）：候用户裁决；
- 案 A（只读桥扫描）候选登记：独立冻结环候 W25 真机走查后裁定；
- 真机全链（真实工程导出→确认→组装→车间状态呈现）归 W25（O-2）。
  端到端宣称维持为零——本批零运行时行为变化承诺到实现切片验收为止。
