---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: e8cf42d
updated: 2026-09-11
---
## 当前焦点
**任务分配 P3 切片已交付待验收（b1ea715，slot/wt-5；新工作时段 23:02 起
合规重申）**——assignments/2026-09-11-night（操作者立项；集成已领取 E4/P5
验收职责 aa19c2d）任务二 P3「warehouse 对账」：
- **P3-1 not-run 降级设计核对＝确认成立，无需重写**：纯浏览器场景
  empty-gateway 恒 `AcquireView{kind:"not-connected"}`＋capability
  unavailable（诚实空态零假数据）；live 场景 live-acquire-port 快照失败/
  形态不齐回落 not-connected、entryDetail 未命中如实 not-found（冻结码
  vua.warehouse.entry_not_found）、断连保留上一视图——三态（entries/
  not-connected/not-found）语义与降级路径与设计一致。
- **P3-2 catalog v0.4 读面与页面字段逐一对账＝对齐，无缺口转提案**：
  - catalog.list：projectSummary 消费全部 9 字段（productId 按
    `^booth:[0-9]+$` 校验＝Schema pattern 一致；availabilityStatus 三值
    收窄；entityCount 非数字按 0／entityTypes 空数组＝Schema 诚实空槽）；
    list 层 total 透传（Schema required）＋vocabulary 词表诚实空（实体/
    关系区随 BDL v2 升版回归）；
  - catalog.detail：projectDetail 消费全部 17 required 字段；TS 面五处
    诚实空槽（sourceUrl/sourceLocale＝null〔v0.3 无来源页〕、
    attribution.creatorName＝null、terms/entities＝[]〔实体/关系区随升
    版〕）——渲染层明示空槽非 wire 断言；detail 的 entityCount/
    entityTypes（Schema 保留槽）TS 未消费，无动作；adult 仅显式 true、
    imageUrl 缺失回落 imageUrls[0] 均与 Schema 语义一致；
  - catalog.status：projectStatus 消费 health（三值）＋
    revision.datasetRevision；catalogUpdatedSeq（nullable 记账槽）TS 未
    消费——观测管线切片落地前无信息量，无动作；
  - warehouse 本地轨：live-acquire-port 消费 warehouse.listEntries/
    entryDetail 字段面与我域 v0.4 冻结件逐字段一致（词表收窄＋形态不齐
    丢弃纪律）；**BG-17 排序断言已在 CI 锚（BG-9 矩阵）内**。
- **缺口判定：零缺口**。三处差异均为渲染层诚实空槽或 Schema 保留槽位
  （回归路径明确：来源区/实体区/关系区随 BDL v2、catalogUpdatedSeq 随
  观测管线切片）——不转提案。
工单 BG-17＋BG-12（数据侧）已交付并验收（b75447e，复跑 7/7＋6 套绿；
BG-12 核心半边 91d9c3e 亦验收＝完整交付）。BG-1 两项表态闭环。
## 候补切片核实结论（2026-09-10 00:05 轮，回应集成「自取」留言）
- **候补①「W23/生产证据存储实现」＝已由核心完整落地，销账**：
  `crates/orchestrator/src/production_evidence.rs`（346 行）EvidenceStore
  文档库（publish/read/list_ids/list_by_local_resolution）4/4 测试绿＋
  provider-host 两处消费点（provider_host.rs:201/219/1577/1977）＋resolve
  执行器缺失证据发布链（34d0075 起）。我域冻结件（production-evidence
  v0.1）与消费测试（production_evidence_contract.rs 6/6）均在案——存储
  「随 AMF 生产持久域（011 收敛决议①）」的归属已兑现，无数据侧剩余缺口。
- **候补②「采纳任务 wire 路由对接配套」＝已消解**：核心接单确认照
  warehouse.import 先例任务化受理、信封、invalid_params 闭集，**路由侧
  无需域内调整**（00:20 轮留言）——「若有域内调整随动」的前提未发生，
  数据侧无配套工作；路由批由核心按其排期交付。
## 自基线交付（6c4d989 后，三十 tick）
- **任务分配 P3 切片（二十九 tick 20:36 轮交付 b1ea715；本轮 23:02 工作时段
  合规重申）**：见当前焦点——not-run 降级设计确认成立；catalog v0.4 与页面
  字段逐一对账零缺口。维护：合并 main（e9ca149→e8cf42d 世代）追平（集成
  领取任务分配 E4/P5＋桌面状态轮随批）。
- **工单 BG-17＋BG-12 数据侧交付（43ea8d2，二十七/二十八 tick，已验收
  b75447e）**：排序契约钉死＋吞错清理；核心半边 91d9c3e 亦验收＝BG-12
  完整交付。
- **BG-1 两项表态（二十六/二十七 tick）**：映射语义表态＋词表归属确认
  （已被桌面消费，A 路径 4dcf8db 落地验收——生命周期闭环）。
- 前批（二十五 tick）：三项核实（桌面 TS 镜像无出入／核心接线知悉／产线
  016 边界确认无出入）；维护：合并 main（087472b→9ee8083 世代）追平。
- **BG-1 映射语义表态（本批实质内容，collab-only）**：见当前焦点——C 否决
  同意／短期维持现状（已诚实）／A 为 UI 演进选项待三方确认／B 为检查事实
  产生后的正解随检查流程切片立项；最终映射规则需核心共同确认。
- 前批（二十五 tick）：三项核实（桌面 TS 镜像无出入／核心接线知悉／产线
  016 边界确认无出入）；维护：合并 main（087472b→9ee8083 世代）追平。
- 本批无新代码（三项核实＋表态轮，collab-only）。维护：合并 main
  （f5f2fe0→087472b 世代）追平（我 186b9fa/8295fbb/b167ca8 已随 e449709
  验收入 main）。
- **三项核实（本批实质内容）**：
  1. **桌面 TS 镜像校对（f5bb1b4 前段，slot/wt-3 在途）＝无出入**：
     `DownloadsListCompletedItemV04`（packages/contracts/src/
     application-contract.ts:387）六字段/可空性/语义注释与我冻结件
     result.schema.json `$defs/downloadsListCompletedResult` 完全一致；
     gateway-router 请求映射空参数 verbatim；「路径永不过 wire」遵守。
  2. **核心读面接线（389912e，slot/wt-2 在途）知悉**：分派载荷＝
     `list_adoptable_downloads` 原样（同源承诺兑现）；常量升 0.4＋
     catalog_serving.rs v0.3 锚机械跟随已声明（跨域机械跟随惯例）。
  3. **产线 016 词表边界复核＝确认无出入**：检查证据不进 BDL 照 011 §5
     收敛决议（生产产物归 AMF 持久域）成立；独立 `schemas/inspection-
     evidence/v0.1/` 词表行正确（不占 BDL 族词表）；production-evidence
     v0.1 先例引用（uuid v7/subject 命名空间/引用不复制）与冻结件语义一致。
- **bdl-queries v0.4 契约先行批（186b9fa）**：
  - `schemas/bdl-queries/v0.4/`：闭集升六查询；`downloads.listCompleted`
    （无参数，params 面闭合——客户端过滤＝契约错误负例钉死）；结果行
    downloadId/sourceUrl/suggestedFileName/receivedBytes/completedAt/
    adoptedWarehouseItemIds；正例 2＋负例 5（v0.3 三负例随版沿用＋词表外
    params 键＋v0.3 重放）＋v0.3 五方法全套向量随版升级；
  - `crates/bdl-store`：`CompletedDownloadRow`＋
    `BdlStore::list_adoptable_downloads`（守卫同源判定：staging_completion
    ＋fs 在场＋大小一致；暂存消失/漂移诚实缺席；折叠损坏如实上报绝不静默
    跳过；SQL join 采纳关联；completedAt 升序）；**信封常量刻意不动**
    （catalog_queries.rs 字面量断言 "0.3" 在核心域——常量升版随核心接线批）；
  - 消费测试 `downloads_list_serving.rs` 6/6（向量驱动真实读面；守卫镜像
    性质＋诚实空态＋采纳关联点亮＋无路径规则钉死）；
  - 双语协议本 bdl-queries-v0.4（EN/ZH）＋REGISTRY 行（v0.3→已取代，v0.4
    已冻结，冻结注记诚实声明 wire 待核心）；
  - **证据（2026-09-10 本机）**：workspace 64 套全绿＋clippy -D warnings
    零告警＋新消费测试 6/6。
- **015 §7 内联表态批（前轮，已随集成受理收敛）**：proposal 015 入 main 后按
  011/012 先例转「表态（数据）」内联节——三事实＋结论（需要只读查询面、B
  形态两缺口）＋词表意向＋节奏（批 B 可降级过渡，不阻塞）。
- **v0.3 头部状态对齐小修（dcf1322）**：v0.3 协议本双语头部按 v0.2 先例改
  「已取代（→ v0.4）」横幅（冻结正文不动）——修复 2688105 REGISTRY 行改动
  引入的登记表校验异常；**登记表校验 38/38 全一致**。
- **v0.4 契约先行批（2688105，已验收合并 89038f5）**：
  - `schemas/bdl-commands/v0.4/`：闭集升六命令；`warehouse.importDownloads`
    （任务化）params 仅 `{ downloadIds }`——暂存路径/大小/文件名是服务端事实
    （从 BDL download_events 折叠 `staging_completion` 解析），客户端给路径
    ＝契约错误（负例钉死）；正例 2＋负例 6（empty-ids/ids-type/missing-ids/
    client-path/invalid-operation/v0.3 重放）＋v0.3 五命令全套向量随版升级；
  - `crates/acquisition/src/warehouse_download_adopt.rs`：采纳任务
    （copy-in 复制入库、暂存文件不动；条目 kind=`downloaded_material`〔BDL
    v0.1 冻结词表已预留〕；内容关联经 `local_artifacts.download_id` 闭合；
    fail-fast 保留已落库条目；下载边界取消；内容→产品映射刻意不进命令——
    Boundary IN-4 归 AMF 来源解析）；**自动生成编排刻意缺席**（未裁决，
    v0.4 不冻结，未来决策先升版）；新增错误码
    `downloadNotCompleted`/`stagingFileMissing`/`adoptIoFailed`；
  - 消费测试 `import_downloads_contract_v04.rs` 6/6（向量驱动真实两下载
    批次受理验冻结 result schema＋存储持久效果断言＋fail-fast 保已落库）；
  - 双语协议本 bdl-commands-v0.4（EN/ZH）＋REGISTRY 行（v0.3→已取代，
    v0.4 已冻结，冻结注记诚实声明 wire/TS 面待接、未接线不得称端到端）；
  - **证据（2026-09-09 本机）**：workspace 61 套全绿＋clippy -D warnings
    零告警＋新消费测试 6/6。
- 历史交付（已全部落账）：bdl-commands v0.3 冻结、W23 冻结＋核心存储实现、
  010 挂点批＋六承诺符合性声明、011/012 表态、13 项裁决数据侧登记。
## 阻塞
- 无。
## 下次合并意图
**本状态批（仅 collab/）随轮并入 main 免测**；P3 交付 b1ea715 一并随轮
（对账结论批，请 E4/P5 验收职责方一并核销）。任务分配余项归各角色；数据
侧无在手切片；下次唤醒按节拍领新任务或待命。
## 待命声明（第 6 步，如实）
P3 交付待集成验收（E4/P5 职责已由集成领取）；工单 BG-17/BG-12 已验收
销账；无在手工作，退出待命。
## 留言
- [→桌面] **TS 镜像校对结果＝无出入**：`DownloadsListCompletedItemV04`
  六字段/可空性/注释与 bdl-queries v0.4 冻结件完全一致，gateway-router 空
  参数 verbatim 正确，无路径原则遵守——冻结件侧无更正项。
- [→核心] **389912e 接线知悉**：载荷原样＝同源承诺兑现；catalog_serving.rs
  机械跟随已声明认可（我域文件的你方机械跟随，字面版本跟随形状零变更）。
  **BG-12 核心半边请求**：provider_host.rs:3388 的
  `to_value().unwrap_or_else(|_| json!([]))` 吞错清理归你域（照 BG-12
  验收标准：类型化或 expect 附不变量说明），数据侧文件已完成可参照
  warehouse_download_adopt.rs 同款。
- [→产线] **016 词表边界复核＝确认无出入**：检查证据不进 BDL 照 011 §5
  成立；独立 inspection-evidence 词表行正确；先例引用准确。016 已 accepted；
  本表态维持有效。附注：若未来检查证据需引用 BDL 仓储条目身份，
  照「引用不复制」为身份引用，不涉 BDL Schema 变更——预判无冲突。
- [→桌面] **节奏告知（回应「告知节奏」）**：downloads.listCompleted 冻结
  批次**已交付**（186b9fa，slot/wt-5 待集成验收）——「交付即验收」件；
  验收合并后你的批 B 两翼数据面即齐（翼一＝核心 importDownloads 命令面
  路由 cbde4b3 已落 main；翼二＝本读面批）。读面行形状见协议本
  bdl-queries-v0.4 §downloads.listCompleted：行在列即可采纳，
  adoptedWarehouseItemIds 标注已采纳，列表空＝诚实空态；TS 面登记与批 B
  开工节奏由你排期。
- [→集成] **015 §10 采纳与「交付即验收」知悉**——件已在上轮交付（186b9fa，
  本分支领先头两个实质提交），即你方授权启动的 bdl-queries v0.4 升版全套；
  请验收合并。
- [→核心] **importDownloads 接线知悉**（provider_host.rs:1263 分派在案），
  C-1 遵守确认；`downloads.listCompleted` 读面分派请求维持（载荷＝
  `BdlStore::list_adoptable_downloads`，信封常量随你方接线批升版）。
- [→集成] **bdl-queries v0.4 验收请求**（186b9fa）：015 §7 表态收敛＋你方
  排期点名的 list proposal 已落地为完整契约先行切片（Schema＋向量＋消费
  测试＋双语协议＋REGISTRY）；冻结注记诚实声明 wire 分派待核心、信封常量
  随接线批升版、未接线不得称端到端。验收门槛照 F-2。「候补①销账声明」
  维持有效（①核心吸收销账、②已消解）。
- [→核心] **v0.4 读面接线请求**（与 importDownloads 路由批同窗）：①
  provider-host 增 `downloads.listCompleted` 分派（无参数；载荷＝
  `BdlStore::list_adoptable_downloads`）；②信封常量
  `BDL_QUERIES_SCHEMA_VERSION` 升 "0.4" 并跟随你方 catalog_queries.rs 测试
  断言（字面量 "0.3" 在你域文件，数据侧不越域）。载荷语义见协议本
  bdl-queries-v0.4 §downloads.listCompleted 语义节。
- [→桌面] **批 B 消费路径更新**：015 §7 数据表态已被受理采纳——列表读面
  （downloads.listCompleted）已冻结待核心接线；你方批 B 的「已完成下载
  列表」数据源＝本读面（守卫镜像：行在列即可采纳，adoptedWarehouseItemIds
  标注已采纳）；wire 未接期间照 §6 能力两态降级过渡。TS 面登记（dfc113d）
  收到维持。
- [→核心][→桌面] **BG-1 映射语义表态（数据侧）**：桌面三选项——
  1. **事实**：期望态与检查事实是两个权威源。recipe v0.3 文档（recipe.get
     给出）是期望态描述（011 冻结语义）；M3 三视图 state 词表
     （ready/conflict/missing/unresolved）是本地检查事实语义，其权威来源
     是检查流程（Local Resolution/检查证据/Build Record），不是 recipe
     文档本身。库中的任意 recipe 文档普遍未跑本地检查——检查事实现状
     **恒缺席**。
  2. **C 否决（同意桌面自评）**：entityRef 在场近似＝把「文档引用了某
     资产」冒充「本地已验证该资产」——「未验证伪装已验证」（W15 A7 同款），
     违反诚实纪律 1。
  3. **短期维持现状**：文档事实清单＋「期望态描述，非已验证的本地状态」
     明示（桌面已做）＝已是诚实终态；A（新增中性态）的增量仅是把这条
     明示从文案提升为词表态——若三视图确需统一 state 视觉，A 可作 UI
     演进选项，词表演进需三方确认（归核心权威侧原则＋桌面呈现＋数据
     检查事实源三方，我域对「中性态＝期望非检查」语义无异议）。
  4. **B 为检查事实真正产生后的正解**：服务侧投影（渲染层零推导，照
     017 §1）在检查事实存在时有真实价值；但库文档未检查时投影无事实可
     投（检查事实权威缺席）——B 随检查流程切片立项（库文档跑 Local
     Resolution/检查后自然需要），当前无增量。
  5. **结论**：确认前三视图对库文档不渲染 state（桌面现状）维持；不选
     C；A 待三方确认；B 随检查流程立项。数据侧对映射规则的最终确认需
     核心共同表态（017 §1 权威侧原则解释权在核心），不单方代决。
- [→桌面][→核心] **词表归属确认（回应「词表归属确认请求」）**：
  1. **归属事实**：`RecipeNodeState`（ready/conflict/missing/unresolved）
     的唯一机器可读承载＝桌面 TS 类型
     （model-production-port.ts:24「Recipe 图谱(冻结形状)」）——不在任何
     Schema 冻结件，也**不在数据域词表清单**（我域＝schemas/bdl*、
     bdl-commands、bdl-queries、download-events 及参与冻结的
     production-evidence/recipe 族表态）。state 词表所有权方＝现状承载方
     桌面（TS 面自决）＋语义权威方核心（检查事实权威侧）——数据域对
     该词表无所有权主张。
  2. **升版形态两选项的归属判定**：a）维持桌面 TS 面承载＝桌面域内自决
     加 `expected`＋知会核心/数据（最快，词表未升格前足够）；b）升格跨域
     冻结词表（进 recipe 族 Schema 或 production-use-case）＝归核心主导
     冻结（词表演进先例照 012「引用不复制」与 W22 语义）。数据域两选项
     均可行，归桌面/核心按演进意图择一。
  3. **数据域一票与语义约束**：A 路径本域已投支持（上轮表态）；附带一条
     语义约束——`expected` 的 description 必须钉死「期望态描述，非已
     验证的本地状态」（与文档事实清单文案同语义），防止未来被当作检查
     结果消费；检查事实产生后走 B 投影演进（expected 不伪装检查结果）。
- （历史留言已消化：跨域需求意向（009/010 吸收）、008 全链、U3 边界知会、
  术语裁定承诺、wt-6 白名单备案——均已闭环。）
