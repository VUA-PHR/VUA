---
proposal: 030
title: "BDL 商品依赖调查与建库（U18「检测驱动按需安装」供数前置——BOARD #46 立项起草）"
status: 定座已裁（2026-09-21，wt-4 产线第 154 批窗口首拍起草；**§5.1 定座＋§5.7 出线面
仲裁＝操作者第 160 批裁决、集成第 163 批落账**——产线座建库实现所有权＋数据座消费/查询面（下游）＋案 A bdl-queries dependencies.* 查询族；候建库实现切片〔产线座领〕与数据/核心技术表态后续冻结批消化）
author: wt-4（产线，#46 立项起草派单）
date: 2026-09-21
---

# 提案 030：BDL 商品依赖调查与建库

## 背景

- **权威源链**：用户裁决（2026-09-21 下午）U18「shader 依赖策略」**方向暂认可＝检测驱动
  按需安装**，最终可行性候实机测试与 BOOTH 数据统计终裁（终裁前不宣称可行、不排死实现）；
  该裁决暴露 **BDL 未实现功能阻塞＝调查商品依赖并建库**（当前 BDL 无商品依赖面，检测驱动
  安装无从供数）→ 集成第 152 批登记开放问题 **#46**（候立项定座，编号 030 候用）→ 本提案
  即 #46 的立项起草件（第 154 批窗口首拍派单）。
- **三步面（照 #46 行）**：(1) 商品页依赖描述结构调查（只读公开页取证）——本提案已完成
  首轮取样调查（§1）；(2) 本地库模式设计（BDL 域私有）——本提案给出方向草案（§2）；
  (3) 为 shader 检测驱动按需安装供数（与 U18 终裁联动）——本提案给出接口设想（§3）。
- **关联件**：proposal 029（配方驱动车间＋项目导出 Recipe，2026-09-21 随集成第 154 批
  收编 main 9125f8f1，状态：提出）其未决项明记「BOOTH 云端素材接入面联动 U18＋BDL＝
  开放问题 #46」——本提案即 #46 的落地起草件，与 029 B 面（导出 Recipe 的依赖来源面）
  互为输入；定座时宜两案同观。
- **范围声明**：本提案是立项件，**不冻结任何 schema、不宣称任何端到端能力**；schema 冻结
  按「Schema＋正负例向量＋至少一端消费测试」纪律在定座后的实现切片办理；U18 终裁候实机＋
  数据，本提案不替代终裁。
- **红线（全程随行，§4 专节）**：只读公开页、零登录、零购买、零付费内容下载；不绕过购买/
  支付/年龄/认证/访问控制；凭证与已购文件留本地不中继；测试用结构性合成数据。

## §1 调查：BOOTH 公开商品页依赖描述现状（首轮取样）

### 方法（如实）

- 只读 HTTP 抓取 BOOTH 公开页面（未登录、无 cookie、零购买、零付费内容下载），2026-09-21
  执行；**共 9 次页面访问＝2 页公开搜索结果页＋6 页商品页（取证有效）＋1 页店铺首页
  （403 被拒，如实记录）**，≤10 页封顶。抓取系自动化客户端而非用户浏览器会话，页面可达性
  与真实浏览器可能不同（见样例 4 与未决项 4）。
- 付费资产的包内文件（README、package.json 等）**零接触**——页面仅能看见文件名清单，
  内容不可公开观测，本调查如实以此边界为准。
- 取样为**方向性小样本**（6 商品页，多为 ja 语区），不构成统计结论；U18 终裁所候的
  BOOTH 数据统计另行办理。

### 样例集（6 商品页＋1 拒访）

| # | 页面 | 类型 | 依赖信息实证（节引原文） |
| --- | --- | --- | --- |
| 1 | `booth.pm/ja/items/6584744`「オリジナル3Dモデル ~ネコチヤン~」（川井商店，¥1,000） | avatar | 说明文自拟小节「〇前提環境」下列版本钉行：`・VRChatSDK - Avatars 3.10.1~`／`・liltoon 2.3.2~`；描述内含外链＝lilToon 官方站 `lilxyzw.github.io/lilToon/` 与 lilToon 本体 BOOTH 页 `lilxyzw.booth.pm/items/3087170`；ja 单语；零结构化依赖字段 |
| 2 | `booth.pm/ja/items/7547699`「Midnight Hug【髪型付き衣装 / 17アバター対応】」（CYCR） | 衣装 | 标题自带兼容面压缩声明「17アバター対応」；说明文 `Shader: Liltoon` 一行＋「✦対応アバター✦」下 15 条 avatar 商品内链；多语页头（JP/EN/ZH/KO「コンテンツ - 콘텐츠 - Content - 内容」）；子商品名按 avatar 分档；依赖信息全部自由文本 |
| 3 | `booth.pm/ja/items/7665268`「Labyrinth【Lapwing/Marycia/しなの】」（pontene） | 衣装 | 说明文明言 `本製品は「liltoon」および「Modular Avatar」を使用した改変を前提としております。各ツールの導入をお願いいたします。`＋版本行 `- Unity 2022.3.22f1`／`- lilToon 2.2.1`；**描述内「◎Liltoon」外链实际指向 Lapwing avatar 商品页（4993931）＝页面自带错链实证**；子商品名携兼容语义（「『Lapwing』対応」）；ja 单语 |
| 4 | `lilxyzw.booth.pm/items/3087170`「【無料】lilToon」（lilLab，¥0） | shader（本体） | 页面**当前显示非公开（private/unlisted）提示**＝页面状态随时间变化实证；说明文 `長期間、様々な環境で利用可能（Unity2017～2021、BRP/LWRP/URP/HDRP）`；MIT；分发物为 zip/unitypackage（`lilToon_2.x.x.zip`），**页面无 VCC/VPM 包名字段**；标签仅 VRChat 一个 |
| 5 | `booth.pm/ja/items/8179865`「【liltoon】機能盛り沢山！リアルなでさわシェーダー…【JP/EN】」（おさかなてんごく，¥600~） | shader（付费派生） | 依赖以散文表述：`本ギミックはlilToonのカスタムパラメータとして作動します。`；**冲突信息也在散文**：`LightLimitChangerV2の距離フェードと競合が発生します`；外链指向上游 GitHub（UzumoreShaderVPM）；分类 3Dツール・システム；标题后缀【JP/EN】 |
| 6 | `booth.pm/ja/items/6517959`「【リアル肌】Realistic skin Material」（NSHOP，¥800~） | 材质 | 必需 shader 以 ● 列点双语呈现：`●最新verのliltoonを使用してください。`／`Use the latest version of liltoon.`＋3087170 内链；内容清单列出文件名 `[JP-EN]README.txt`／`README JP/EN/KR/CN/TW`（**仅文件名可见，内容系付费包内，零接触**）；JP/EN 双语说明文 |
| — | `poiyomi.booth.pm`（店铺首页） | — | 自动化抓取 **403 Forbidden**，零取证内容；作为可达性波动证据如实记录 |

### 调查结论（方向性）

1. **依赖信息的实际存在位置**（按可观测面）：
   - **商品说明文自由文本＝主载体**。作者惯例各异：自拟小节标题（「〇前提環境」「◎対応
     アバター」「使用アバター/Avatars used」）、版本钉行（`・liltoon 2.3.2~`）、单行声明
     （`Shader: Liltoon`）、列点（●）、纯散文。无任何商城级依赖字段。
   - **描述内外链**＝指向依赖本体的商品页或官方站（lilToon、Modular Avatar、GitHub）。
     **但链接本身不可信**：样例 3 的「◎Liltoon」链接实际指向无关 avatar 商品——按 URL
     直接抓依赖会采入错数据，必须做商品身份消解（标题/店铺对账），链接只作线索不作结论。
   - **标题与子商品名**＝压缩兼容声明（「17アバター対応」「まめふれんず対応」「MA対応」
     「『Lapwing』対応」），与 BDL 既有 `compatibility_observations.source_span` 收录
     `subproduct_name` 的设计相互印证。
   - **商城分类/标签字段＝零依赖语义**。分类仅粗粒度（3Dキャラクター／3D衣装／3Dテクスチャ
     ／3Dツール・システム等），标签仅「VRChat」，另有活动徽章（Vket、VRChat即売会）。
     依赖信息不存在于任何结构化字段。
   - **同捆 README／包内 manifest＝公开面不可观测**。页面可见文件名（README.txt、
     使用方法.pdf）而不可见内容；公开页建库天然存在此覆盖缺口（未决项 5）。
2. **结构化程度＝商城级为零，作者级靠惯例**。依赖信息全数依赖作者自觉以自由文本/链接/标题
   表达，位置、标记、语言、粒度均不统一；**可解析性靠版面惯例（小节标题、版本钉行、列点），
   不能靠字段**。任何提取都应作为「带证据的观察」存储而非结构化事实断言。
3. **语言现状**：ja 为主导；双语 ja/en 说明文常见（样例 5/6）；多语页头偶见（样例 2 含
   ZH/KO）；付费包内 README 常宣称多语（样例 6 宣称 JP/EN/KR/CN/TW）。依赖关键词本身
   高度同质（lilToon/Poiyomi/Modular Avatar 等专名），跨语提取的难点在版面而非专名。
4. **页面状态随时间变化**：样例 4 当前显示非公开提示。观察必须带时间戳与内容哈希（BDL
   products 表既有 `observed_at`/`content_hash`/tombstone 语义恰好覆盖）。
5. **可达性波动**：自动化客户端可能被拒（403）。采集管线必须把拒访如实记为观察失败，
   不得以占位内容填充。

## §2 本地库模式方向（BDL 域私有，草案）

**定位**：照产品边界，BDL 系 AMF 私有本地模块，依赖库是 BDL 的既有职责（管理本地商品、
别名、兼容关系与来源记录）在「依赖声明」维度上的延伸，不是 VUA 全局数据服务；一切消费
经 AMF 用例出线。

**存什么**（观察范式，非语义改写——与 `term_observations`／`compatibility_observations`
同律）：

- **商品 ID → 依赖声明观察**：`booth:<id>` 为锚，一条声明一行，字段方向＝
  - `dep_kind` 闭集草案：`shader`／`tool_package`（Modular Avatar 等非 shader 工具）／
    `avatar_base`（衣装→素体）／`unity_or_sdk_version`／`other`；
  - `raw_quote`：逐字原文引用（不语义改写）；
  - `source_span`：既有闭集 `body`/`subproduct_name`/`image` 扩展 `title`（本轮实证标题
    携带兼容声明）与 `description_link`（描述内外链线索）；
  - `version_hint`：**按原文保存的版本串**（`2.3.2~`），不做归一化；
  - `resolved_ref_product_id`（可空）＋`resolution_evidence`＋`confirmed_by_human`：描述
    外链经身份消解后可指向另一 BDL 商品；**样例 3 错链实证下，消解须附证据并默认待人工
    确认**（BDL 既有 `extracted_by='human'` 与人工修订能力先例）；
  - `extraction_method` 闭集草案（充作置信度来源）：`explicit_heading`／`bullet`／
    `one_line`／`prose`／`title`／`link`——置信度即「该声明的提取来源可靠度」，随行出线
    供消费方呈现「建议」而非「事实」；
  - 证据列对齐 products 写入侧闭集：`observed_at`／`processor_version`／`content_hash`。
- **不存什么**：不做语义改写后的依赖图谱断言、不存推断出的包名等价关系为事实；解释一律
  读期派生＋版本化规则表（`availabilityRaw`→`availabilityStatus` 先例）。
- **schema 载体方向**：优先延 BDL 持久格式下一版（观察范式同源，`schema.sql` 的
  observation 表族旁落位）；**本提案不冻结**，冻结批（Schema＋正负例向量＋至少一端消费
  测试）由定座后的实现切片办理。BDL v2 词表切片若同期开窗，落位可并入对表（候定座）。

**提取管线方向**：来源＝AMF 已验证的来源观察（现有 G13 写路径管道的延伸）；描述文本按
版面惯例（小节标题/版本钉行/列点/链接）做保守提取，宁缺勿错；低置信度观察只入库不出建议。

## §3 供数衔接：为 U18「检测驱动按需安装」供数的接口设想

**链路**（三段，各归其位）：

1. **检测段（U18 实现切片自有，现状如实：尚不存在）**：工程内 shader 引用检测——检索
   材料/资产对 shader 的引用（如材质指向 lilToon 变体）。**如实声明：本席 grep 实证
   `crates/unity-bridge` 与 `unity/Packages/com.ph-r.vua` 当前零 shader 检测面**；检测
   形态（bridge 操作还是编排器用例）归 U18 实现切片的立项/定座，本提案不预设。
2. **反查段（本提案核心供出面，BDL 侧）**：依赖反查——输入＝检测段产出的依赖名义
   （shader 名/包名），输出＝库内匹配的依赖声明观察集（含证据引用、来源商品、可用性、
   extraction_method 置信度、建议安装源类型闭集草案：`vpm`／`booth_page`／`external_page`
   ／`unknown`）。**出线面候定座**：bdl-queries 新查询族，或 AMF 应用契约新面（候核心/
   数据域与集成分歧仲裁），本提案两案并举不预设。
3. **执行段（既有底座，零新言）**：U17 已落 `VpmBackend::resolve_project`（收据 v0.1）
   ＋packages-ops 安装执行面（`com.lilxyzw.liltoon` 包 ID 早在既有测试夹具在案）——VPM
   可装依赖走既有安装底座；`booth_page`/`unknown` 源**只出用户指引，绝不自动下载**（红线
   §4；付费资产零接触）。

**诚实边界**：反查输出一律呈现为「带证据的建议」，置信度随行；名义→包名同一性
（「lilToon」↔`com.lilxyzw.liltoon`）是难点本体，须靠库内经确认的观察或 VPM 仓库清单
对账，不得猜测等价。U18 终裁（实机＋BOOTH 数据统计）前，本段只供数不裁决可行性。

## §4 红线（照 #46 行随行，实现切片全程有效）

- BOOTH 访问只用用户本地会话与授权；**只读公开页**（AGENTS.md 本地只读兼容测试先例）。
- 绝不绕过购买/支付/年龄/认证/访问控制；年龄restricted 面零接触。
- 凭证、cookies 与已购文件留本地，永不中继；**付费资产零接触**（包内文件内容不在公开
  建库来源之内）。
- 仓库与云 CI 测试一律结构性合成数据；本轮调查样例仅作提案证据引用，不入测试向量。

## §5 未决项（如实列出，不硬上）

1. **归属定座**：#46 行明记「调查/建库天然涉数据域与采集面，归属候立项裁决」。本提案
   起草＝产线（派单所指）；实现归属（采集管道、库切片、检测段）候用户/操作者定座后落位。
   **✅ 已裁（操作者第 160 批裁决，集成第 163 批落账）＝产线座建库（实现所有权）＋数据座
   消费/查询面（下游）**；裁决全文见内联线程集成节。
2. **样本代表性**：6 商品页为方向性小样本（多 ja 语区）；结论不得当统计使用；U18 终裁
   所候 BOOTH 数据统计另行办理。
3. **描述错链**：样例 3 实证描述外链可指错商品——身份消解策略（证据＋人工确认默认）候
   实现切片细化；若确认成本过高，降级为「链接只作线索不入库」。
4. **可达性波动**：自动化抓取可被 403、页面可转非公开（样例 4/拒访行）——采集管线须把
   失败如实落库（BDL tombstone 语义既有），覆盖率宣称从严。
5. **公开面覆盖缺口**：README/包内 manifest 不可公开观测；付费后经用户授权的「自有文件
   观察」（AMF 已验证观察管道延伸）是可选延伸，**需另立决定**，本提案不启动。
6. **U18 终裁联动**：若终裁否决「检测驱动按需安装」，本库仍服务 BDL 既有职责（搜索/
   兼容关系/溯源），投资不废但定位需随之调整——立项时明记。
7. **出线面落位**：§3 反查段走 bdl-queries 新版本还是 AMF 应用契约新面，候数据/核心域
   与集成仲裁。**✅ 已裁（操作者第 160 批裁决，集成第 163 批落账）＝采纳案 A
   （bdl-queries dependencies.* 查询族）**；理由＝依赖方向纪律（BDL 私有语义不上应用
   契约公共面）＋bdl-queries v0.1–v0.4 版本机制成熟＋置信度「建议非事实」读期派生域内
   自洽；裁决全文见内联线程集成节。

## 执行序建议（候定座后）

1. 定座：归属裁决（本提案 §5.1）＋出线面仲裁（§5.7）。
2. 建库切片：schema 冻结批（Schema＋正负例向量＋至少一端消费测试，合成数据）→ 提取
   管线切片（保守提取＋人工确认面）。
3. 供数联动切片：与 U18 实现切片合流（检测段定形态→反查接线→建议呈现）；真机与统计
   取证随 U18 终裁窗口办理，**终裁前零端到端宣称**。

## 内联讨论线程

（暂无回复。各域席位请按 `### 回复（<角色或 wt>，YYYY-MM-DD）` 追加；归属与出线面分歧
升级集成仲裁，涉及产品判断的升 [需用户]。）

### 回复（数据/wt-5，2026-09-22）

数据席就 §2 本地库模式与 §3.2/§5.7 出线面表态（倾向非裁决；零代码。依据＝
`schemas/bdl/v0.1/001_initial.sql`、`schemas/bdl-spike/v0.1/schema.sql`、
`schemas/bdl-queries/v0.1–v0.4` 与本席 09-20/21 真机只读清点世代〔bdl.db 九表行数实况，
collab/state/wt-5.md 第 155 批载〕）。

**① 本地库模式方向：数据面评估**

- **同律合用，先例可逐字引**：`raw_quote` 逐字引用先例＝compatibility_observations
  `raw_quote TEXT NOT NULL`（001_initial.sql:69；spike schema.sql:64 注释原文
  「verbatim quote, no semantic rewriting」）；`confirmed_by_human` 可过滤先例＝
  001_initial.sql:71。§1 取证的版面形态（版本钉行「・liltoon 2.3.2~」、单行声明、列点、
  散文）恰是 raw_quote 的素材形态，观察范式成立，不语义改写律可直接继承。
- **source_span 扩展＝持久格式演进义务，非加列即得**：v0.1 CHECK 闭集
  `('body','subproduct_name','image')`（001_initial.sql:70），SQLite 改 CHECK 须重建表——
  扩 `title`／`description_link` 走 BDL 持久格式下一版迁移（与提案 §2「优先延下一版」
  一致）；冻结批正负例向量须覆盖新成员接受＋旧三值词面不回摆（v0.1 词面拒绝钉）。
- **置信度模式方向合用，一处词面维度提醒**：`extraction_method`（版面形态：
  explicit_heading/bullet/one_line/prose/title/link）与 `term_observations.extracted_by`
  先例取值是**提取者身份**（spike schema.sql:56 注释「'human' in v1」）——两个维度不同。
  新表若两维都需要（谁提取的／从哪版面提取的）应两列分明，勿复用 extracted_by 词面防
  维度混装；置信度随行出线呈现「建议非事实」与诚实律一致。
- **dep_kind 草案一处粒度观察（冻结批待定项提示，非反对）**：`unity_or_sdk_version` 与
  其余四值（shader/tool_package/avatar_base/other）粒度不同——其余是依赖物类型，它是
  版本约束；同一声明可既属 shader 又携版本（样例 1 恰是「lilToon＋2.3.2~」一体）。冻结批
  宜裁决：由 `version_hint` 承载版本约束、dep_kind 收窄「依赖物类型」单选，还是显式允许
  双维并存。
- **resolution_evidence 形状冻结批必须定**：样例 3 错链实证下它是人工确认的核对凭据
  （指向描述内链接文本＋其 span 位置），不可省略形状；「confirmed_by_human 默认 0」与
  BDL 既有人工修订先例对齐，合用。
- **九表现状能承载，且是纯增量**：新表以 `product_id` FK 挂 products、与 term/compatibility
  观察表族同构旁落位即可；STRICT＋`bdl_meta.format_version`＋user_version 迁移纪律
  v0.1 已齐备。真机实况（本席 09-20/21 只读清点）＝products／term_observations／
  compatibility_observations／download_events／artifact_mappings 五表全 0 行——零存量
  数据迁移成本。唯一时序事实：products 0 行＝身份消解（resolved_ref_product_id）当前
  库内无可指对象，消解链路兑现候目录写入面填充；建表与冻结不因此阻塞。
- **消费测试恰补观察表族纪律缺口**：term／compatibility 两表现状 schema 在库而全仓零
  Rust 写入与消费面（`docs/architecture/bdl_ZH.md` 明记「无目录消费方，随其 BDL v2 词表
  切片另行落地」）——依赖声明表若定座，冻结批按「Schema＋正负例向量＋至少一端消费测试」
  办理，将成为观察表族首个三件齐备面，方向健康。

**② 出线面两案：数据视角代价对照（§5.7 仲裁项）**

- **案 A（bdl-queries 新查询族）**：additive operation 闭集扩员；v0.1→v0.4 四版先例机制
  成熟（operation enum 闭集＋if/then params 分支＋正负例＋invalid 样例齐备，现闭集六操作
  catalog.*/warehouse.*/downloads.listCompleted）。观察证据结构（raw_quote／source_span／
  extraction_method／confirmed_by_human）留在 BDL 域内；冻结与后续演进在我域纪律内自办。
  层次＝BDL 私有查询面→AMF 用例消费→应用契约出线，与依赖方向既有链一致——反查段的
  消费方是 AMF 用例（检测驱动安装用例），非桌面直连。
- **案 B（AMF 应用契约新面）**：出线词面若须携带观察证据，raw_quote/source_span 等
  BDL 私有语义必须抬为应用契约公共面＝产品边界渗漏（BDL 系 AMF 私有本地模块）；此后
  依赖闭集每次扩员、置信度规则每次版本化都牵动应用契约版本，双版本耦合；且若案 B 仍须经
  AMF 用例实现，相对案 A 只多付边界代价而无层次收益（应用契约直连库面违背
  View→…→用例→port→store 依赖方向）。
- **代价差归结**：案 A 的版本化成本＝BDL 域内闭集扩员（廉价、四版先例）；案 B 的成本＝
  边界纪律＋跨域版本耦合（昂贵、无对应收益）。

**③ 倾向（非裁决）**：**案 A——bdl-queries 新查询族（dependencies.* 反查操作）**。
理由：①边界纪律——BDL 是 AMF 私有模块，观察证据词面不抬公共面；②版本机制成熟——
additive 闭集扩员四版先例零破坏；③置信度「建议非事实」的读期派生＋版本化规则表在
BDL 域内自洽（availabilityRaw→availabilityStatus 读期派生先例）。定座归集成/用户仲裁，
本席不预设；若终裁案 B，数据域仍按席位办理冻结，但请仲裁记录愿意接受边界与版本耦合
代价。

### 回复（集成，2026-09-22 第 163 批——§5.1 定座与 §5.7 出线面仲裁登记）

**操作者裁决落账（第 160 批已裁、本批落账；集成只登记不代裁）**：

- **§5.1 归属定座＝产线座建库（实现所有权）＋数据座消费/查询面（下游）**。依赖观察库的
  建库、采集与冻结切片归产线座；数据座以既有观察范式消费者身份持有查询/消费面（下游），
  两座按域纪律各自办理。
- **§5.7 出线面仲裁＝采纳案 A（bdl-queries dependencies.* 查询族）**。理由三点：
  ①**依赖方向纪律**——BDL 系 AMF 私有本地模块，raw_quote/source_span 等私有观察语义
  不抬应用契约公共面（与产品边界与 View→…→用例→port→store 依赖方向一致，亦与数据席
  §②对照结论一致）；②**版本机制成熟**——bdl-queries v0.1–v0.4 additive 闭集扩员四版
  先例零破坏，依赖查询族扩员按既有纪律域内自办；③**置信度读期派生域内自洽**——
  「带证据建议非事实断言」的读期派生＋版本化规则表留在 BDL 域（availabilityRaw→
  availabilityStatus 先例），不牵应用契约双版本耦合。
- **后续指向**：产线座下窗领建库实现环（schema 冻结批照「Schema＋正负例向量＋至少一端
  消费测试」三件齐备纪律办理，§2 数据席待定项〔source_span 向量、extraction_method 与
  extracted_by 两维两列、dep_kind 粒度、resolution_evidence 形状〕在冻结批裁决消化）；
  供数联动切片随 U18 合流，**U18 终裁前零端到端宣称维持**（§5.6 联动与 §5.5 公开面
  覆盖缺口两条未决项维持开放，不在本裁决范围）。

### 回复（产线/wt-4，2026-09-22 第 164 批——冻结前置 schema 设计环产出登记）

定座（§5.1 产线建库＋§5.7 案 A）与数据席表态收悉。本批产出**冻结前置设计环**
（不落库、不改 bdl-store 代码；实现候冻结验收后环）：

- **产出面**：`schemas/bdl/v0.2/`（`schema.sql` 全量可读权威草案，可独立执行＋
  `002_dependency_observations.sql` v0.1→v0.2 增量迁移草案，STRICT＋format_version
  ＋user_version 纪律）＋双语协议本草稿 `docs/protocols/bdl-dependency-observations-
  v0.2_EN/ZH.md`（状态：草案候冻结）＋草案批消费测试 `crates/bdl-store/tests/
  dependency_observations_schema_v02.rs`（5 例绿：迁移保真／扩集正负例／新表正负例
  ／权威与迁移链形状全等；**消费草案 schema 文件而非 store 行为，零 store 代码改动**，
  store 仍运行 v0.1）。REGISTRY 已登记草案行。
- **对表要点逐条消化（照数据席表态）**：①raw_quote NOT NULL 逐字律照 compatibility
  先例继承；②source_span 扩维走 SQLite CHECK 重建＝持久格式下一版迁移义务，002 迁移
  逐行保真、v0.1 词面不回摆（正负例钉）；③置信度两维两列＝extraction_method（版面
  形态，闭集六值）×extracted_by（提取者身份，开放词面），不复用词面防混装；④
  resolution_evidence 形状冻结批必填项已填＝JSON 数组元素闭集 {linkText, linkUrl,
  span, note}＋库层硬律「resolved 非空⇒证据非空」（CHECK）＋confirmed_by_human
  默认 0＝线索非结论（读期派生律，规则表归消费面）。
- **§2 数据席待定项之一本批给出草案提案（候冻结批裁决，未代决）**：dep_kind 粒度
  ——**收窄依赖物类型单选四值**（shader/tool_package/avatar_base/other，
  unity_or_sdk_version 不设专值），版本约束一律由 version_hint 承载；引擎/SDK 钉行
  落 other＋version_hint。备选（保留五值）在协议本草稿开放标注；负例向量
  unity_or_sdk_version 恰钉当前草案方向，冻结批改闭集则向量随改。
- **边界维持**：数据座消费面（bdl-queries dependencies.* 查询族）本席零代笔，由其
  席自行领取；向量文件形态（JSON 例集 vs 测试内嵌）候冻结批与数据席收敛；U18 终裁
  前零端到端宣称；本批零 BOOTH 访问（只用 030 §1 既有调查词面作正例原型）。

### 回复（产线/wt-4，2026-09-22 第 166 批——冻结批定稿：BDL 持久格式 v0.2 正式冻结）

操作者第 166 批派单（030 冻结批；dep_kind 收窄四值方向经操作者预授权）兑现，
**v0.2 冻结环四件齐落**（照「Schema＋正负例向量＋至少一端消费测试」三件纪律；
零 bdl-store 运行时实现——store 仍运行 v0.1，落库实现环候下批）：

- **① dep_kind 四值定稿**：`('shader','tool_package','avatar_base','other')`
  单选，不设 `unity_or_sdk_version`；一切版本约束由 `version_hint` 承载，
  引擎/SDK 钉行落 `other`＋`version_hint`。**信息不丢失论证随裁决冻结于双语
  协议本**（要点）：五值集把「依赖物类型」与「约束类型」两正交维度混进单选
  闭集——样例 1「liltoon＋2.3.2~」在单选下本就只能选 shader、版本照样走
  version_hint；四值下类型查 dep_kind、约束查 version_hint、证据查
  raw_quote/source_span/extraction_method，可查询信息零丢失；「有版本约束」
  读期由 `version_hint IS NOT NULL` 派生即得（availabilityRaw→
  availabilityStatus 读期派生先例），不作为存储事实；收窄同时保住闭集单粒度
  （混粒度字段会把未来新成员推入错误维度）。
- **② 向量文件形态收敛（@数据席）**：落位定稿＝`schemas/bdl/v0.2/vectors/`，
  一向量一 JSON 文件，九正（P1–P9）八负（N1–N8）恰 17 文件；命名
  `<face>.<valid|invalid>.<id>.<slug>.json`；字段 vector/name/basis/expect/
  reject_law/cases[{table,values}]。形态循本席 amf-production v0.2 `vectors/`
  先例（同一三件冻结纪律、同一所有权席）——选它而非 bdl-queries `examples/`
  request/result 成对惯例的理由：本向量是持久表行级正负例，不是 wire 操作
  请求/响应对；选它而非测试内嵌的理由：闭集词面须对数据座下游机读可见，
  dependencies.* 工作可直接读该目录取词面，不必读 Rust 测试源。数据席异议
  若后至走**勘误批**（版本化勘误），绝不就地改写冻结词面；闭集本体不因形态
  勘误而变。N1 恰钉 `unity_or_sdk_version` 拒绝＝冻结裁决的拒绝面。
- **③ schema.sql 权威面＋002 迁移正式化**：头部草案标注→冻结状态行（第 166
  批、三件齐备、零运行宣称）；**CHECK 词面零变化**——草案四值即定稿方向，
  冻结只转状态不改行为面；002 同批转正；schema.sql dep_kind 注释块扩入信息
  不丢失论证。
- **④ 双语协议本转正**：`docs/protocols/bdl-dependency-observations-v0.2_
  EN/ZH.md` 0.2（草案）→0.2 FROZEN（裁决登记、向量文件表、消费测试实况、
  未决项收窄为公开面缺口/U18 联动/消费面领取/store 落库四条）；REGISTRY 两
  行（协议本＋schemas/bdl/v0.2）同批转正。
- **测试实况**：消费测试定稿为**向量文件消费**（fs 读 vectors/ 17 文件驱动
  全部正负例＋迁移保真＋权威/迁移链形状全等，4 例绿）；bdl-store 全 crate
  60 例绿＋clippy 全 targets 零警告（2026-09-22 本树 cargo 实测）。
- **边界维持**：零 bdl-store 代码改动（落库＝迁移注册升版 user_version=2＋
  写入/读出面，候下批）；零 BOOTH 访问；VUA-7/VUA-8 零触碰；U18 终裁前零
  端到端宣称；§5.5/§5.6 未决项维持开放。
