# BDL 持久格式 v0.2（商品依赖观察面）协议

[English](bdl-dependency-observations-v0.2_EN.md) | [简体中文](bdl-dependency-observations-v0.2_ZH.md)

> 文档版本：0.2.2
> 状态：**已冻结（FROZEN）**（2026-09-22，wt-4 产线第 166 批＝冻结批）**且已落库
> （LANDED）**（store v0.2 运行时，wt-4 产线第 168 批＝落库实现环，本 0.2.1 注记
> 登记；**保守提取器能力面**，wt-4 产线第 178 批＝030 提取管线实现环，本 0.2.2
> 注记登记——两笔注记均零冻结词面变化）。
> 「Schema＋正负例向量＋至少一端消费测试」三件齐备落地：
> - schema：`schemas/bdl/v0.2/schema.sql`（全量可读权威，可独立执行）＋
>   `schemas/bdl/v0.2/002_dependency_observations.sql`（v0.1→v0.2 增量迁移，
>   STRICT＋bdl_meta.format_version＋user_version 纪律）；
> - 正负例向量：`schemas/bdl/v0.2/vectors/`——恰九正（P1–P9）八负（N1–N8），
>   一向量一 JSON 文件（形态本批冻结，见向量节）；
> - 消费测试：`crates/bdl-store/tests/dependency_observations_schema_v02.rs`
>   ——本批 4 例绿，驱动全部向量文件。
> 零端到端宣称——本稿不宣称任何提取、消费或真机能力的实现与验证。bdl-store
> 在冻结批时仍运行 format v0.1（冻结批零 store 代码改动）；store v0.2 落库已
> 于第 168 批兑现（见下方「落库实况」节），且仅系代码面证据。
> 本批冻结裁决登记（收窄方向经操作者预授权，产线席定稿）：dep_kind 四值、
> 不设 `unity_or_sdk_version`；向量文件形态（030 内联线程登记、@数据席
> 已知会——冻结后若至形态异议走勘误批，绝不就地改写冻结词面）。
> 所有权：030 §5.1 定座（2026-09-21 操作者裁决，集成第 163 批落账）＝产线座
> 建库（实现所有权）；数据座持消费/查询面（下游，dependencies.* 查询族，
> 030 §5.7 案 A）。起草（第 164 批）与冻结（第 166 批）均＝产线（wt-4）。
> 上游依据：proposal 030 §1 调查（2026-09-21 只读公开页 9 次访问取样）＋
> 数据席 030 内联表态（2026-09-22）

## 范围

本协议冻结 **BDL 持久格式 v0.2**：

1. `compatibility_observations.source_span` 闭集扩维（`title`、
   `description_link` 两新成员）——持久格式迁移义务（SQLite 改 CHECK 须
   重建表）；
2. 新表 `dependency_observations`——商品依赖声明观察面（一条声明一行）。

不冻结、也不在本稿范围内：bdl-queries `dependencies.*` 查询族词表（数据座
下游消费面，其席自行办理）；依赖提取管线实现；U18 检测段；任何读期置信度
规则表的本体（本稿只冻结「规则表存在且版本化」这一纪律面）。

## v0.2 变更（相对 v0.1）

### 1. source_span 闭集扩维（compatibility_observations 重建）

- v0.1 闭集 `('body','subproduct_name','image')` 扩为
  `('body','subproduct_name','image','title','description_link')`。
- 调查实证（030 §1）：商品标题携压缩兼容声明（样例 2「17アバター対応」）、
  描述内外链自成一类线索面（样例 3）。
- **SQLite 不能就地修改 CHECK**：扩集＝重建表（建新表→逐行复制→删旧表→
  改名），这是**持久格式下一版迁移义务**，不是加列即得；`002_dependency_
  observations.sql` 承载该迁移，v0.1 行逐字保真，迁移中任何数据丢失即失败。
- 旧三值词面不回摆：v0.1 数据在新表中原样存活；词外词面（合成负例
  `heading`/`summary`/`prose`）照常拒绝（向量 P9/N2）。

### 2. dependency_observations（新表）

一条**声明的依赖**一行，观察范式与 `term_observations`／
`compatibility_observations` 同律：**逐字证据、零语义改写、零派生断言**。
调查现实（030 §1）：依赖信息只存在于作者自由文本（小节标题、版本钉行、
单行声明、列点、散文），商城级结构化字段为零——因此一切提取只能作为
「带证据的观察」入库，绝不作为事实断言入库。

**列律（已冻结）**：

| 列 | 律 | 依据 |
| --- | --- | --- |
| `dep_kind` | NOT NULL，冻结闭集 `('shader','tool_package','avatar_base','other')` | 见下「dep_kind 粒度」 |
| `dep_name` | NOT NULL，依赖名义**按原文**（`lilToon`），不归一化、不猜等价 | 反查段检索列；名义→包名同一性是难点本体，库不自造 |
| `raw_quote` | **NOT NULL**，逐字引用，零语义改写 | compatibility_observations `raw_quote TEXT NOT NULL` 先例（001_initial.sql:69；spike schema.sql:64 注释原文 verbatim） |
| `source_span` | NOT NULL，闭集与 compat 表 v0.2 同集（五值） | 同源观察范式 |
| `version_hint` | 可空，版本串**按原文**（`2.3.2~`），不归一化；承载**全部**版本约束（引擎/SDK 钉行在内） | 030 §2；下 dep_kind 裁决 |
| `resolved_ref_product_id` | 可空，FK→products | 030 §2 |
| `resolution_evidence` | 可空；**硬律：resolved 非空时必须非空**（CHECK） | 样例 3 错链实证——消解必附证据 |
| `confirmed_by_human` | NOT NULL DEFAULT 0，CHECK (0,1) | 默认待人工确认；BDL 人工修订先例 |
| `extraction_method` | NOT NULL，闭集 `('explicit_heading','bullet','one_line','prose','title','link')` | 置信度维 1：版面形态 |
| `extracted_by` | NOT NULL，开放词面（`human` 先例） | 置信度维 2：提取者身份；不闭集 |
| `observed_at`／`processor_version`／`content_hash` | 证据列，对齐 products 写入侧闭集；`content_hash` 可空（跨观察引用时如实可缺） | 030 §2 |

**置信度两维两列，勿混装**：`extraction_method`（从哪类版面提取）与
`extracted_by`（谁提取的）是两个正交维度、两列分明。数据席 030 内联提醒
照单采纳：不复用 `term_observations.extracted_by` 词面装版面形态，防维度
混装（向量 P8 钉两维同行分立；N7 钉身份词 `manual` 非版面形态）。

**dep_kind 粒度——已冻结（四值）**：草案待定项裁定如下。`dep_kind` ＝
**依赖物类型**单选，四值 `'shader' | 'tool_package' | 'avatar_base' |
'other'`；不设 `unity_or_sdk_version` 成员；**一切**版本约束由
`version_hint` 承载；引擎/SDK 版本钉行（`- Unity 2022.3.22f1`，样例 3）落
`dep_kind='other'`＋`version_hint='2022.3.22f1'`（正例向量 P7；其拒绝面由
N1 钉死）。

**信息不丢失论证（随裁决一并冻结）**：五值草案把两个正交维度装进一个
单选字段——**依赖的是什么**（依赖物类型）与**附带什么约束**（版本）。
单选集本就强迫样例 1 行（「liltoon＋2.3.2~」：shader 钉行携版本）只能选
`shader`、版本照样走 `version_hint`。反之，裸引擎钉行在四值下保全调查所得
的每一个字节：依赖物类型在 `dep_kind='other'`（被依赖物即运行时/工具本
身）、名义按原文在 `dep_name='Unity'`、逐字行在 `raw_quote`、版本串按原文
在 `version_hint`。可查询的信息零丢失：类型查 `dep_kind`、约束查
`version_hint`、证据查 `raw_quote`/`source_span`/`extraction_method`。
不再可表达的只有冗余的存储标签「本行约束是版本约束」——读期由
`version_hint IS NOT NULL` 派生即得（`availabilityRaw→availabilityStatus`
先例的读期派生律），绝不作为存储事实。收窄同时保住闭集单粒度：混粒度字
段会把未来每个新成员（新依赖物类型 vs 新约束种类）推入错误维度。

**消解与证据（resolution_evidence 形状，已冻结）**：形状为 JSON 数组，
元素闭集：

```json
[{"linkText": "<string>", "linkUrl": "<string>", "span": "<source_span 成员>",
  "note": "<string|null>"}]
```

- 库层硬律仅一条：`resolved_ref_product_id` 非空 ⇒ `resolution_evidence`
  非空（证据必随行；CHECK 承载；向量 N4）。
- `confirmed_by_human=0`（默认）的消解是**线索不是结论**：读期派生律——
  未确认消解绝不进建议输出；规则表版本化（`availabilityRaw→
  availabilityStatus` 先例），规则表本体归消费面（数据座）。
- 样例 3 错链实证下，身份消解（标题/店铺对账）默认待人工确认；确认是
  显式、留痕的写动作（`confirmed_by_human` 翻 1；向量 P4），不自动翻。

## 观察范式红线（继承）

- 不存语义改写后的依赖图谱断言；不存推断出的包名等价关系为事实；解释一律
  读期派生＋版本化规则表。
- 低置信度观察只入库不出建议；反查输出一律「带证据的建议」非事实断言
  （030 §3 诚实边界）。
- 空态即终态：无观察不造占位；拒访、转非公开如实落库（tombstone 语义，
  v0.1 products 先例）。
- 公开面覆盖缺口如实维持：付费包内文件（README/manifest）不在公开建库
  来源之内（030 §4/§5.5）；「自有文件观察」需另立决定，本稿不启动。

## 正负例向量（已冻结：`schemas/bdl/v0.2/vectors/`）

**冻结形态**：一向量一 JSON 文件，共十七文件（九接受＋八拒绝）。文件名
即向量名——`<face>.<valid|invalid>.<id>.<slug>.json`——字段：
`vector`（P1–P9／N1–N8）、`name`（＝文件名词干）、`basis`（所引律条或
030 §1 调查样例）、`expect`（`accept`｜`reject`）、`reject_law`（仅拒绝
向量）、`cases`（`{table, values}` 数组；每 case 一条 INSERT，`values`
只含字符串/整数/null）。形态循产线席 amf-production v0.2 `vectors/` 先例
（同一冻结三件纪律、同一所有权席）；数据席已于本批在 030 内联线程被知会
——下游 `dependencies.*` 工作可直接机读本目录取闭集词面——冻结后若至形态
异议走勘误批。

正例（接受；词面引 030 §1 调查原型）：

| # | 文件 | 钉面 |
| --- | --- | --- |
| P1 | `dependency-observations.valid.p01.explicit-heading-version-pin.json` | 显式小节＋版本钉行（样例 1）；`extraction_method='explicit_heading'` |
| P2 | `dependency-observations.valid.p02.one-line-declaration.json` | 单行声明 `Shader: Liltoon`（样例 2）；`one_line` |
| P3 | `dependency-observations.valid.p03.title-carried.json` | 标题携带（样例 5）；`source_span='title'`、`extraction_method='title'` |
| P4 | `dependency-observations.valid.p04.confirmed-resolution-with-evidence.json` | 消解非空＋证据数组非空＋`confirmed_by_human=1` |
| P5 | `dependency-observations.valid.p05.prose-declaration.json` | 散文（样例 5）；`prose` |
| P6 | `dependency-observations.valid.p06.bullet-line.json` | 列点（样例 6）；`bullet`；原文无版本串 ⇒ `version_hint` NULL（诚实缺席） |
| P7 | `dependency-observations.valid.p07.engine-pin-as-other.json` | 引擎钉行（样例 3）落 `dep_kind='other'`＋`version_hint` |
| P8 | `dependency-observations.valid.p08.confidence-two-dimensions.json` | `extraction_method` 与 `extracted_by` 同行分立 |
| P9 | `compatibility-observations.valid.p09.new-spans-no-swing.json` | compat 表：`title`/`description_link` 接受**且**旧三值照常接受 |

负例（拒绝）：

| # | 文件 | 律 |
| --- | --- | --- |
| N1 | `dependency-observations.invalid.n01.dep-kind-foreign.json` | `dep_kind` 词外：`unity_or_sdk_version`（五值草案成员——其拒绝恰钉冻结裁决）、`engine`、空串 |
| N2 | `dependency-observations.invalid.n02.source-span-foreign-both-tables.json` | `source_span` 词外 `heading`（两表同拒） |
| N3 | `dependency-observations.invalid.n03.raw-quote-null.json` | `raw_quote` NOT NULL |
| N4 | `dependency-observations.invalid.n04.resolution-without-evidence.json` | 消解无证据（CHECK 硬律） |
| N5 | `dependency-observations.invalid.n05.dangling-resolved-reference.json` | 消解引用悬挂／属主商品悬挂（FK） |
| N6 | `dependency-observations.invalid.n06.confirmed-flag-strict-zero-one.json` | `confirmed_by_human` 严格 0/1 |
| N7 | `dependency-observations.invalid.n07.extraction-method-foreign.json` | `extraction_method` 词外（`manual`——身份词非版面形态） |
| N8 | `dependency-observations.invalid.n08.not-null-laws.json` | `dep_name`／`extraction_method`／`extracted_by` NOT NULL |

## 迁移与版本纪律

- `bdl_meta.format_version`：`'0.1'`→`'0.2'`（迁移文件内 UPDATE）；
  `user_version` 1→2 由宿主迁移器在批次提交后设置（照 v0.1 宿主先例）。
- v0.1 行保真是迁移成功前提；任何丢失即迁移失败。
- 下一切片落库时，`bdl-store` 迁移注册升版＋旧库打开路径按既有
  `UnsupportedFormat` 纪律拒绝超前的 `user_version`——本冻结批零触碰
  store 代码。**已落库（第 168 批）**：store 执行完整迁移链（001＋002；新
  库单事务全链执行＝出生即 v0.2；既有 v0.1 库开盖即经 002 迁移、逐字保真），
  宿主 `user_version = 2`，并对超前 fence（`migration-N`）与外来
  `format_version` 维持 `UnsupportedFormat` 拒绝纪律。

## 落库实况（v0.2.1——第 168 批事实；代码面）

- `bdl-store` 运行 format v0.2：`BDL_FORMAT_VERSION = "0.2"`、迁移注册
  001＋002、宿主 fence `user_version = 2`（v0.1 宿主先例）。
- 写入面 `record_dependency_observation`：行**追加**为证据（无 upsert——
  schema 未定义去重身份）；闭集成员逐字入库，真实 SQLite CHECK/NOT NULL/FK
  约束是唯一法律权威（store 不持重复的 Rust 闭集——违约以
  `BdlStoreError::Database` 如实浮出）。`confirmed_by_human` 不是写入面
  字段：行以未确认落库（DEFAULT 0＝线索）。
- 读取面 `dependency_observations(product_id)`：按观察序返回诚实行集；
  存量证据 JSON 必须能解析回冻结元素形状（`deny_unknown_fields`），否则按
  损坏值如实浮出。
- 确认写动作 `confirm_dependency_resolution`——`confirmed_by_human = 1`
  的**唯一**写入者：一次显式、留痕的写同时钉住消解目标商品（必须是已观察
  商品，否则 `UnknownProduct`）、非空消解证据（空「证据」＝无证据——
  `InvalidResolution`）与确认旗标，且行必须存在（否则
  `UnknownDependencyObservation`）。确认绝不自动发生。
- 存储层行为测试 `crates/bdl-store/tests/dependency_observations_store_
  v02.rs`（6 例绿，第 168 批）：17 个冻结向量文件驱动 store 自有面与 store
  自有迁移执行——全部接受例经 store 面落库读回逐字保真（P4 骑确认动作；
  P9 走 store 自身迁移库——compat 表按其 v0.1 表面现实无 store 写入面），
  全部拒绝例被真实约束拒绝（类型面可表达的例以
  `BdlStoreError::Database` 骑 ConstraintViolation 浮出；类型面无法诚实
  表达的无律值——NOT NULL 列携 SQL NULL、confirmed = 2——对 store 自身迁
  移库驱动并同被拒绝），迁移纪律（出生 v0.2／v0.1 开盖即迁逐字保真／超前
  fence 与外来 format 拒绝），以及确认动作各律。第 168 批合计：bdl-store
  全 crate 66 例绿、clippy 全 targets 零警告。

## 保守提取器实况（v0.2.2——第 178 批事实；能力面与旗标语义）

**定位（先行）**：本批交付的是**解析与落库能力**，不是启用任何功能。按产品边界
1.5.0（「自动兼容性证据收集为实验功能，默认关闭」）与 030 内联线程产线
2026-09-23 重新规格化注记：**能力存在≠默认启用**——产品内零自动触发，本提取器
在产品代码中零调用方（仅测试调用）；把它接线到任何真实输入源（用户实际的 BOOTH
浏览与 Unity 使用过程观察通道）、实验旗标（默认关）本体与旗标 UI，一律候新提案
立项后另行办理。「关闭自动收集不得影响 BDL 基础存储、普通导入与 Recipe 来源补
充」的既有律不受本批影响。

- **纯解析器**（`crates/bdl-store/src/dependency_extract.rs`）：输入＝调用方提供
  的商品页内容文本；零抓取、零网络、零文件访问——抓取面维持 1.5.0 重新规格化的
  设计留白（候选来源之一，候重议）。只提取 030 §1 版面原型中的高置信结构模式三
  族：`explicit_heading`（作者自拟前提環境类小节标题下的行）、`bullet`（列点行
  与版本钉行）、`one_line`（整行恰为 `com.*` 反向域包名〔可携版本钉〕）；**散文、
  标题压缩声明、带键单行声明（「Shader: X」形）、描述内外链如实不提**——宁缺勿
  猜。`extraction_method` 六值闭集中 `prose`/`title`/`link` 本提取器**永不产出**。
- **词面与律**：`dep_kind` 骑冻结四值闭集，分类用窄词表（liltoon/poiyomi→
  `shader`；modular avatar/avatar optimizer→`tool_package`；unity/vrchat/sdk 按
  冻结裁决强制 `other`；其余一律 `other` 不猜）；`avatar_base` **永不产出**（衣
  装→素体识别是语义判断，版面结构无法诚实承载）。`raw_quote`（原行仅去首尾空白）、
  `dep_name`、`version_hint` 全部逐字律；`source_span` 恒 `body`；**消解绝不自动
  填**——`resolved_ref_product_id` 恒 None、`resolution_evidence` 恒空（030 §1
  样例 3 错链实证下身份消解完全留在人工确认路径）。
- **落库走既有写面**：线索经 `lead_to_new_observation`（盖 `extracted_by =
  'conservative-layout-extractor-v1'`，置信度两维两列律不混装）转
  `NewDependencyObservation` 后走 `record_dependency_observation`；行以
  **未确认**落库（`confirmed_by_human` 非写入面字段，恒 0＝线索），翻 1 的唯一
  写入者仍是 `confirm_dependency_resolution`。
- **测试实况（2026-09-23 本树亲测）**：`crates/bdl-store/tests/
  dependency_extract_conservative.rs` **8 例绿**——夹具全合成（照 030 §1 版面
  原型构造，零真实页内容、零网络、零文件访问），钉：三结构族提取与闭集词面／
  散文与非结构行零提取＋`avatar_base` 零产出／既有写面落库逐字往返且恒未确认
  （未知商品被 FK 如实拒绝）／确定性＋单文档去重／诚实空态。本批合计：bdl-store
  全 crate 套件绿（84 例）、`cargo test --workspace` **971/0**、clippy
  `--workspace --all-targets` **零警告**。
- **诚实边界**：零端到端宣称——本批全部系代码面证据（真实 SQLite 落库往返≠真
  机全链）；提取器对真实页面形态的召回率未经验证（合成夹具只证行为律，不证覆盖
  率）；零 BOOTH 访问；冻结词面（schema.sql/002/17 向量）零字节变化。

## 消费测试（冻结批实况）

`crates/bdl-store/tests/dependency_observations_schema_v02.rs` 4 例全绿
（2026-09-22，本树 cargo 实测）：迁移保真／向量集方向（17 文件＝9 正＋8
负；文件名约定钉死；N1 钉 `unity_or_sdk_version` 拒绝）／全部向量 case
驱动（接受例试插、拒绝例试拒；省略 `confirmed_by_human` 缺省 0；P4 证据
数组携冻结元素键）／权威与迁移链形状全等。同批 bdl-store 全 crate 60 例
绿、clippy 全 targets 零警告。**该测试消费的是冻结 schema 与向量文件而非
store 行为；store v0.2 行为验收属下一切片。零端到端宣称。**

## 未决项（如实）

1. **公开面覆盖缺口**（030 §5.5）与 **U18 终裁联动**（030 §5.6）维持
   开放，不在本稿范围。
2. 消费面（bdl-queries `dependencies.*`）由数据座自行领取；本稿零代笔。
3. ~~store 落库（迁移注册 v0.1→v0.2、写入/读出面）属下一切片，另办验收。~~
   **已关闭——第 168 批落库**（见上方「落库实况」节）；验收随该批办理。
