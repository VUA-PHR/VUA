# BDL 持久格式 v0.2（商品依赖观察面）协议本草稿

[English](bdl-dependency-observations-v0.2_EN.md) | [简体中文](bdl-dependency-observations-v0.2_ZH.md)

> 文档版本：0.2（草案）
> 状态：**草案候冻结**（2026-09-22，wt-4 产线第 164 批起草）——本稿是
> collab/proposals/030（BOARD #46）定座后、冻结切片前的 schema 设计环产物。
> **未冻结**：冻结切片须以「Schema＋正负例向量＋至少一端消费测试」三件齐备
> 办理冻结验收；本稿与其机器可读面在冻结前均可修订。零端到端宣称——本稿
> 无任何运行、提取或消费能力的实现与验证宣称。
> 机器可读面（草案）：`schemas/bdl/v0.2/schema.sql`（全量可读权威，可独立
> 执行）＋ `schemas/bdl/v0.2/002_dependency_observations.sql`（v0.1→v0.2
> 增量迁移，STRICT＋bdl_meta.format_version＋user_version 纪律）
> 消费测试（草案批）：`crates/bdl-store/tests/dependency_observations_schema_v02.rs`
> （5 例，向量消费，零 bdl-store 代码改动；store 本体仍运行 format v0.1，
> v0.2 落库属冻结切片）
> 所有权：030 §5.1 定座（2026-09-21 操作者裁决，集成第 163 批落账）＝产线座
> 建库（实现所有权）；数据座持消费/查询面（下游，dependencies.* 查询族，
> 030 §5.7 案 A）。本稿起草＝产线（wt-4）。
> 上游依据：proposal 030 §1 调查（2026-09-21 只读公开页 9 次访问取样）＋
> 数据席 030 内联表态（2026-09-22）

## 范围

本协议（候冻结时）冻结 **BDL 持久格式 v0.2**：

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
  `heading`/`summary`/`prose`）照常拒绝。

### 2. dependency_observations（新表）

一条**声明的依赖**一行，观察范式与 `term_observations`／
`compatibility_observations` 同律：**逐字证据、零语义改写、零派生断言**。
调查现实（030 §1）：依赖信息只存在于作者自由文本（小节标题、版本钉行、
单行声明、列点、散文），商城级结构化字段为零——因此一切提取只能作为
「带证据的观察」入库，绝不作为事实断言入库。

**列律（草案，冻结批确认或修订）**：

| 列 | 律 | 依据 |
| --- | --- | --- |
| `dep_kind` | NOT NULL，闭集草案 `('shader','tool_package','avatar_base','other')` | 见下「dep_kind 粒度」 |
| `dep_name` | NOT NULL，依赖名义**按原文**（`lilToon`），不归一化、不猜等价 | 反查段检索列；名义→包名同一性是难点本体，库不自造 |
| `raw_quote` | **NOT NULL**，逐字引用，零语义改写 | compatibility_observations `raw_quote TEXT NOT NULL` 先例（001_initial.sql:69；spike schema.sql:64 注释原文 verbatim） |
| `source_span` | NOT NULL，闭集与 compat 表 v0.2 同集（五值） | 同源观察范式 |
| `version_hint` | 可空，版本串**按原文**（`2.3.2~`），不归一化 | 030 §2 |
| `resolved_ref_product_id` | 可空，FK→products | 030 §2 |
| `resolution_evidence` | 可空；**硬律：resolved 非空时必须非空**（CHECK） | 样例 3 错链实证——消解必附证据 |
| `confirmed_by_human` | NOT NULL DEFAULT 0，CHECK (0,1) | 默认待人工确认；BDL 人工修订先例 |
| `extraction_method` | NOT NULL，闭集 `('explicit_heading','bullet','one_line','prose','title','link')` | 置信度维 1：版面形态 |
| `extracted_by` | NOT NULL，开放词面（`human` 先例） | 置信度维 2：提取者身份；不闭集 |
| `observed_at`／`processor_version`／`content_hash` | 证据列，对齐 products 写入侧闭集；`content_hash` 可空（跨观察引用时如实可缺） | 030 §2 |

**置信度两维两列，勿混装**：`extraction_method`（从哪类版面提取）与
`extracted_by`（谁提取的）是两个正交维度、两列分明。数据席 030 内联提醒
照单采纳：不复用 `term_observations.extracted_by` 词面装版面形态，防维度
混装。

**dep_kind 粒度（冻结批待确认项 A）**：数据席 030 内联指出 030 §2 草案
五值中 `unity_or_sdk_version` 与其余值粒度不同（它是版本约束，其余是依赖
物类型），而同一声明可两者一体（样例 1「liltoon＋2.3.2~」）。**本草案
提案**：dep_kind 收窄为依赖物类型单选（四值，无 `unity_or_sdk_version`），
版本约束一律由 `version_hint` 承载；引擎/SDK 版本钉行（`- Unity
2022.3.22f1`）落 `dep_kind='other'`＋`version_hint`。**备选**（保留五值）
开放候冻结批裁决；若冻结批修订闭集，本稿与向量随改。负例向量
`unity_or_sdk_version` 恰钉当前草案方向（草案期即争议标注，冻结批必裁）。

**消解与证据（resolution_evidence 形状，冻结批必填项已填）**：形状为
JSON 数组，元素闭集：

```json
[{"linkText": "<string>", "linkUrl": "<string>", "span": "<source_span 成员>",
  "note": "<string|null>"}]
```

- 库层硬律仅一条：`resolved_ref_product_id` 非空 ⇒ `resolution_evidence`
  非空（证据必随行；CHECK 承载）。
- `confirmed_by_human=0`（默认）的消解是**线索不是结论**：读期派生律——
  未确认消解绝不进建议输出；规则表版本化（`availabilityRaw→
  availabilityStatus` 先例），规则表本体归消费面（数据座）。
- 样例 3 错链实证下，身份消解（标题/店铺对账）默认待人工确认；确认是
  显式、留痕的写动作（`confirmed_by_human` 翻 1），不自动翻。

## 观察范式红线（继承）

- 不存语义改写后的依赖图谱断言；不存推断出的包名等价关系为事实；解释一律
  读期派生＋版本化规则表。
- 低置信度观察只入库不出建议；反查输出一律「带证据的建议」非事实断言
  （030 §3 诚实边界）。
- 空态即终态：无观察不造占位；拒访、转非公开如实落库（tombstone 语义，
  v0.1 products 先例）。
- 公开面覆盖缺口如实维持：付费包内文件（README/manifest）不在公开建库
  来源之内（030 §4/§5.5）；「自有文件观察」需另立决定，本稿不启动。

## 正负例向量方向（冻结批按此落向量文件）

正例（接受；词面引 030 §1 调查原型，测试已内嵌同型向量）：

- P1 显式小节＋版本钉行：`dep_kind='shader'`、`dep_name='liltoon'`、
  `raw_quote='・liltoon 2.3.2~'`、`version_hint='2.3.2~'`、
  `extraction_method='explicit_heading'`（样例 1「〇前提環境」）。
- P2 单行声明：`raw_quote='Shader: Liltoon'`、`extraction_method=
  'one_line'`（样例 2）。
- P3 标题携带：`source_span='title'`、`extraction_method='title'`（样例 5
  标题后缀【liltoon】）。
- P4 已确认消解：`resolved_ref_product_id` 非空＋`resolution_evidence`
  数组非空＋`confirmed_by_human=1`。
- P5 散文：`extraction_method='prose'`（样例 5）。
- P6 列点：`extraction_method='bullet'`（样例 6「●最新verのliltoonを
  使用してください。」）。
- P7 引擎钉行落 other：`dep_kind='other'`＋`version_hint='2022.3.22f1'`。
- P8 两维分立：`extraction_method='prose'` 与 `extracted_by=
  'pipeline:dep-0.1'` 同行并存。
- P9 compat 表新 span：`source_span='title'`／`'description_link'` 行照常
  接受；旧三值不回摆。

负例（拒绝）：

- N1 `dep_kind` 词外：`'unity_or_sdk_version'`（钉当前草案方向）、
  `'engine'`、空串。
- N2 `source_span` 词外：`'heading'`（两表同拒）。
- N3 `raw_quote` NULL（NOT NULL 律）。
- N4 `resolved_ref_product_id` 非空而 `resolution_evidence` NULL（证据
  硬律）。
- N5 `resolved_ref_product_id` 悬挂（FK，无此商品）。
- N6 `confirmed_by_human=2`（严格 0/1）。
- N7 `extraction_method` 词外：`'manual'`。
- N8 `dep_name`／`extraction_method`／`extracted_by` NULL（NOT NULL 律）。

向量文件形态（JSON 例集照 bdl-queries examples/ 惯例或测试内嵌，落位归
冻结切片定）候冻结批与数据席对形态表态收敛。

## 迁移与版本纪律

- `bdl_meta.format_version`：`'0.1'`→`'0.2'`（迁移文件内 UPDATE）；
  `user_version` 1→2 由宿主迁移器在批次提交后设置（照 v0.1 宿主先例）。
- v0.1 行保真是迁移成功前提；任何丢失即迁移失败。
- 冻结切片落库时，`bdl-store` 迁移注册升版＋旧库打开路径按既有
  `UnsupportedFormat` 纪律拒绝超前的 `user_version`——本草案批未触碰
  store 代码（零落库）。

## 消费测试（草案批实况）

`crates/bdl-store/tests/dependency_observations_schema_v02.rs` 5 例全绿
（2026-09-22，本树 cargo 实测；迁移保真／扩集正负例／新表正负例／权威与
迁移链形状全等）。同批 bdl-store 全 crate 61 例绿、clippy 全 targets 零
警告。**该测试消费的是草案 schema 文件而非 store 行为；store v0.2 行为
验收属冻结切片。零端到端宣称。**

## 未决项（如实）

1. **dep_kind 粒度**（上文待确认项 A）：收窄四值 vs 保留五值——冻结批
   必裁。
2. **向量文件形态**：JSON 例集 vs 测试内嵌——冻结批与数据席收敛。
3. **公开面覆盖缺口**（030 §5.5）与 **U18 终裁联动**（030 §5.6）维持
   开放，不在本稿范围。
4. 消费面（bdl-queries `dependencies.*`）由数据座自行领取；本稿零代笔。
