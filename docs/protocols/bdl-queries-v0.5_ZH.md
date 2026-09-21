# BDL 读面协议 v0.5（catalog＋warehouse＋已完成下载＋依赖反查与观察列面）

[English](bdl-queries-v0.5_EN.md) | [简体中文](bdl-queries-v0.5_ZH.md)

> 文档版本：0.5
> 状态：**已冻结（域内业务词表）**（2026-09-22，wt-5 数据第 168 批＝冻结批，
> 操作者第 168 批派发的 dependencies.* v0.5 实现环；030 §5.7 案 A 定座）。
> 「Schema＋正负例向量＋至少一端消费测试」三件齐备落地：
> - Schema：`schemas/bdl-queries/v0.5/query.schema.json`＋
>   `result.schema.json`（operation 闭集八成员、params/结果形状、词面枚举）；
> - 正负例向量：`schemas/bdl-queries/v0.5/examples/`——四正例
>   （lookup/listByProduct 各 request/result）＋五负例；
> - 消费测试：`crates/bdl-store/tests/dependencies_queries_v05.rs`
>   （8 例绿，2026-09-22 本树 cargo 实测；驱动全部向量文件＋冻结 BDL v0.2
>   闭集逐字对表＋匹配规则 v1／advisory 规则 v1 参考推导）。
> **契约先行分工（v0.4 先例照办）**：数据席先冻结域内词表；provider-host
> 路由臂与信封版本常量（`BDL_QUERIES_SCHEMA_VERSION` 0.4→0.5）随核心接线
> 批升版；渲染层 TS 面归桌面席；bdl-store v0.2 落库（迁移注册升版
> user_version=2＋写入/读出面）归产线建库实现环。**本批零 bdl-store 代码
> 改动、零 wire 落地——零端到端宣称。**
> 排序依赖（如实登记）：dependencies.* 词面骑 **BDL v0.2 冻结闭集**
> （`schemas/bdl/v0.2`，2026-09-22 wt-4 产线第 166 批冻结，先于本词表）；
> 本词表与 v0.2 闭集的逐字对表由消费测试机械钉死（词面漂移即测试红）。
> 上游依据：proposal 030 §3.2 反查段接口设想＋数据席 030 内联候选词表方向
> （第 166 批节，已按其方向冻结）＋操作者向量文件形态裁决（维持冻结 JSON
> 形态，本族例集循 bdl-queries 四版 `examples/` 先例）

## v0.5 修订（相对 v0.4）

additive operation 闭集扩员（六→八成员），v0.4 六方法的 params/字段/结果
与 v0.4 完全一致（schemaVersion 随词表升为 "0.5"）：

1. **新增 `dependencies.lookup`**（依赖反查，U18 供数链反查段直接所需）；
2. **新增 `dependencies.listByProduct`**（单商品依赖观察全列，未过滤观察
   面）。

两方法均**只读**。`confirmed_by_human` 翻 1 的人工确认写动作属建库切片
（产线座）的库写面，本族零写操作，词表刻意不含任何写词。

## 冻结范围与分工

本协议冻结 **operation 词汇、查询闭集、字段面、结果形状，以及两张读期
规则表的 v1 本体**（匹配规则、advisory 规则——规则表随本协议版本化，改
规则必须先升本协议版本，绝不原地改写）。错误通道、请求关联与传输信封属
版本化应用契约；信封版本常量与 provider-host 方法路由随核心接线批升版。
渲染层 TS 面由桌面角色登记。

## 方法面（八个只读方法）

| 方法 | 语义 | 消费方 |
| --- | --- | --- |
| `catalog.list` | 按查询的商品卡列表（分页） | 云端轨卡片墙 |
| `catalog.detail` | 单商品详情 | 详情抽屉 |
| `catalog.status` | 目录健康与修订快照 | 状态行／降级呈现 |
| `warehouse.listEntries` | 全部素材包条目卡 | 本地轨条目列表 |
| `warehouse.entryDetail` | 单条目逐工件检查事实 | 条目详情 |
| `downloads.listCompleted` | 可采纳的已完成交付，带采纳关联 | 导入页已完成下载列表＋采纳入口 |
| `dependencies.lookup`（v0.5 新增） | 依赖名义反查（建议面） | U18 供数链反查段（AMF 用例） |
| `dependencies.listByProduct`（v0.5 新增） | 单商品依赖观察全列（线索面） | 消解人工确认工作流读面＋详情未来扩员 |

观察管线落数据前 `dependencies.lookup` 返回空集、
`dependencies.listByProduct` 返回空观察列——空态即终态。

## dependencies.lookup 语义（建议面）

**params 闭集**：`name`（必填，minLength 1，检测段产出的依赖名义按原
文）、`depKind`（可选，枚举骑 BDL v0.2 冻结 `dep_kind` 四值闭集
`shader|tool_package|avatar_base|other`，null/缺席＝不过滤）、`limit`
（1–200，缺省 50）／`offset`（缺省 0）照 catalog.list 既有分页律。params
面闭合（`additionalProperties: false`）——词外键＝契约错误，绝不静默空
答（负例向量钉死，含 `fuzzy` 键：本词表刻意不携带任何模糊/等价开关）。

**匹配规则 v1（读期版本化规则表，本协议冻结其 v1 本体）**：

- `dep_name` **大小写不敏感精确匹配**（执行引擎的 ASCII case fold 范围；
  非 ASCII 名义本无大小写，等效逐字相等）。存储名义保持**逐字不归一
  化**——匹配规则不是归一化，存储不被匹配改写。
- **零子串、零模糊、零等价**（宁缺勿错）：包名形态输入
  （`com.lilxyzw.liltoon`）若不逐字出现于任何 dep_name，**诚实返回空
  集**。名义↔包名同一性绝不猜测（030 §3 诚实边界）；等价匹配只能候库内
  经确认观察积攒后以规则表升版进入（v2+），词表本体不含等价逻辑。

**结果形状**：顶层 `{ total, matches[] }`——total 先于分页计算（catalog.list
律）；行序＝productId 升序后 observation 身份升序（身份派生，确定性分
页）。每 match 键闭集：

- `productId`（booth: 身份）＋`productTitle`（可空＝诚实缺席）；
- `availabilityRaw`＋`availabilityStatus`——**双字段律整对复用**（声明商
  品行；raw 逐字证据、status 稳定枚举读期派生，渲染层只消费 status）；
- `depKind`／`depName`／`versionHint`（可空）——逐字证据面，零归一化；
  `versionHint` 承载全部版本约束（引擎/SDK 钉行在 BDL v0.2 中存为
  `dep_kind='other'`＋版本串，本面原样透出）；
- `rawQuote`（必填逐字）＋`sourceSpan`＋`extractionMethod`（两闭集骑 BDL
  v0.2 五值/六值）——「带证据的建议」的证据体；
- `resolvedProductId`（可空）——**仅人工确认消解（confirmed_by_human=1）
  出线**；未确认消解绝不进建议面（读期派生律落为词表面律）；null＝无消
  解或消解未确认（不区分、不泄露）；
- `advisory`（对象｜null）——见下。

**advisory 规则 v1（读期版本化规则表，本协议冻结其 v1 本体）**：一条观
察出建议（advisory 非 null）当且仅当——

1. 版面形态为**刻意声明**：`extraction_method ∈ {explicit_heading,
   one_line, bullet}`（散文/标题/链接形态属顺带提及，低于建议线）；
2. 安装源可证：该行携**人工确认**的消解（无 VPM 仓库事实在库，规则 v1
   不凭名义猜测安装源；未确认消解是线索，绝不翻成建议）。

非 null 时：`installSource` 按**消解目标**的 source 主机派生——booth.pm
主机＝`booth_page`，其余主机＝`external_page`；`vpm`／`unknown` 留在冻结
枚举内但 **v1 绝不发出**（vpm 派生候 VPM 仓库对账事实落地后的规则升版，
凭空宣称 vpm 即猜测）。`confidence` 两档只骑版面维度——`strong`＝
explicit_heading/one_line（作者以专段/单行刻意声明），`weak`＝bullet
（列点行，真实但压缩）。输出一律是**带证据的建议**，绝不是事实断言。

**刻意缺席（admission 律）**：`extractedBy` 不上 lookup 线面（用户面证据
＝rawQuote＋sourceSpan＋来源商品已足）；`observedAt` 不上 lookup（建议
面不判新鲜度）；路径零出现（house 律）；**declaring 商品的 tombstone 状
态不过滤 lookup**——声明的证据力不随页面死亡消失（listByProduct 携
`productStatus` 显式呈现该状态）。

**空态诚实**：`total:0＋matches:[]`＝「无匹配名义」（按当前规则表），不
是「无此依赖」——低于建议门的观察留在库内且不失格，listByProduct 是未
过滤观察面。两者语义区别由本协议明记，消费方不得把空集渲染成「不存在该
依赖」。

## dependencies.listByProduct 语义（线索面）

**params 闭集**：`productId`（必填，`^booth:[0-9]+$`，同 catalog.detail）。
无 name/过滤键——客户端给过滤＝契约错误（负例向量钉死）。

**缺席与 tombstone 语义**：productId 未知＝应用面 not-found（照
catalog.detail 既有缺席语义对齐：store 层 None→应用契约 not-found 码，
绝不伪造空答）；**tombstone 商品（`status='missing'`，404/410 留存不删）
不拒答**——以 `productStatus:'missing'` 如实出线且观察列照常可读：确认
工作流必须仍能看到死页的声明与线索（这正是它与 catalog.detail「tombstone
不作卡片」分流的原因——本面是观察读面，不是目录卡片面）。

**结果形状**：`{ productId, productStatus, observations[] }`；
`productStatus ∈ {complete, missing}`（tombstone 诚实面）；观察行按
observation 身份升序（插入序，确定性）。每 observation 键闭集＝lookup 证
据键全携（`depKind`/`depName`/`versionHint`/`rawQuote`/`sourceSpan`/
`extractionMethod`）＋`extractedBy`（提取者身份——确认工作流需要知谁提
取，admission 消费者明确）＋`observedAt`（确认者判新鲜度）＋`resolution`
（null｜`{productId, confirmed, evidence[]}`）。**无 advisory**——建议推
导是 lookup 的职责，本面如实列观察（含低置信行）不作建议过滤；
`evidence[]` 元素照 BDL v0.2 冻结四键形状
（`{linkText, linkUrl, span, note}`）逐字复用；`confirmed:false` 的消解在
此**如实出线为带标注的线索**（030 §1 样例 3 错链实证的落点）。

**两面对照＝「线索非结论」律的落点**：lookup 只出已确认（resolvedProductId
门＋advisory 门），listByProduct 如实列线索并标注确认状态。两面同库同源，
对照呈现即诚实。

## listByProduct 保留裁决（第 168 批，数据席定夺）

操作者第 168 批把「候裁减的 listByProduct 去留」交本席定夺。**裁决：保
留**，理由四条：

1. **「线索非结论」律需要两面对照才成立**——若只落 lookup，库内未确认线
   索将无任何查询可读（对任何查询面都不可见的库行近乎死数据），该律的诚
   实性失效；两成员是同一设计单元，砍一即残。
2. **消费方真实且已排期**——030 执行序 2 的提取管线切片含「人工确认面」，
   确认工作流的写面（confirmed_by_human 翻 1）归产线建库切片，其读面必
   须先落或同批落；本面即该读面。
3. **成本有界**——单参数（骑 catalog.detail 既有 pattern），行键与 lookup
   证据体同构（差集＝＋extractedBy/observedAt/resolution、−分页/建议推导
   键），每键一一映射 BDL v0.2 冻结列，零投机字段。
4. **不硬凑**——admission 律满足：每键可答「哪列、哪个消费者需要它」；
   无一键因「以后可能有用」而入表。

## 依赖方向

```text
AMF 用例（U18 供数链反查段／消解确认工作流）
  → 本协议的 provider（AMF 应用服务，只读）
  → BDL 本地数据库（只读；v0.2 落库归产线建库切片）
（应用契约出线与桌面呈现归核心/桌面接线批，本协议不预设其形状）
```

BDL 是 AMF 私有本地模块：rawQuote/sourceSpan/extractionMethod 等私有观察
语义止步于 AMF 用例，不抬应用契约公共面（030 §5.7 案 A 理由①）。

## 机器可读词表

`schemas/bdl-queries/v0.5/`：`query.schema.json` + `result.schema.json` +
`examples/`（4 正例：lookup/listByProduct 各 request＋result；5 负例：空
name、词外 depKind〔恰钉五值草案成员 `unity_or_sdk_version` 拒绝＝BDL
v0.2 N1 同一裁决面〕、词外 `fuzzy` 键、listByProduct 词外过滤键、v0.4 版
本重放；均须被拒）。消费测试：
`crates/bdl-store/tests/dependencies_queries_v05.rs`（向量驱动＋冻结 BDL
v0.2 schema.sql CHECK 闭集逐字对表＋匹配规则 v1／advisory 规则 v1 参考
推导骑冻结迁移链 001+002 实测＋两面对照机械钉＋无路径键扫描）。词表或规
则变更必须升版本，绝不原地改写。

## 开放项

- bdl-store v0.2 落库（迁移注册 user_version=2＋写入/读出面＋本族可执行
  读面）：产线建库实现环候派；届时本测试的参考推导由 store 实现面接替
  （本测试保留为词表锚）。
- 信封版本常量升 0.4→0.5＋provider-host 路由臂＋TS 面：核心/桌面接线批。
- 匹配等价规则（v2+）：候库内经确认观察积攒＋VPM 仓库对账事实，随本协议
  升版进入；词表本体零等价逻辑。
- `vpm` installSource 派生：候 VPM 仓库对账事实落地（规则升版，绝不凭名
  义猜测）。
- U18 终裁（实机＋BOOTH 数据统计）联动：终裁前本族只供数不裁决可行性，
  零端到端宣称维持。
