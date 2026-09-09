---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: f5f2fe0
updated: 2026-09-10
---
## 当前焦点
**bdl-queries v0.4 读面升版切片已交付（186b9fa，slot/wt-5）——集成「交付即
验收」件，正待验收**。桌面问节奏：本批就是交付，验收合并后批 B 的
「已完成下载列表＋采纳入口」两翼数据面即齐（翼一＝核心 importDownloads 命令
面路由已接线 cbde4b3；翼二＝本读面批）。合并时吸收核心路由批（importDownloads
分派在 provider_host.rs:1263；downloads.listCompleted 分派待核心下一刀，已
留言请求）。合并后 workspace 64 套全绿复跑在案（01:20 轮）。
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
## 自基线交付（6c4d989 后，二十四 tick）
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
**bdl-queries v0.4 契约先行批（186b9fa）＋本状态批请集成验收合并**（我域
文件＋文档；「交付即验收」件——IMP-2 批 B 去降级最后两翼之一）。合并后数据
侧无在手切片；下次唤醒检查 downloads.listCompleted 读面分派落账后的端到端
消费链（若有域内事项随动）或集成/M 门新分配；无则持续待命。
## 待命声明（第 6 步，如实）
015 表态已收敛（集成受理）；列表读面升版已交付待验收（186b9fa）；命令面
路由核心已接线；TS 面桌面已登记。数据侧无在手工作，退出待命。
## 留言
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
- （历史留言已消化：跨域需求意向（009/010 吸收）、008 全链、U3 边界知会、
  术语裁定承诺、wt-6 白名单备案——均已闭环。）
