# 审阅报告（复核）：W15 条目 3——素材导入页与 M6 增设阶段（reviewer-agent 复核轮）

> 审阅者：独立审阅子智能体（Reviewer，不归属六角色生产体系；本机模型，非生产进程同源）
> 日期：2026-09-09
> 审阅对象：用户 W15 走查确认回传条目 3（逐字）：「3.接2：目前缺少明确的素材导入页面，其需要：从云端下载/从本地导入两个部分，前者又暴露出缺少Web浏览功能，请调用审阅子智能体，根据需求在M6增设阶段。」（登记于 `collab/BOARD.md:206` A3 行）
> 方法：只读复核（产品边界／计划大纲／架构与设计文档／提案 010/013/014／Schema 目录与 REGISTRY／main 分支代码实文／git 提交谱系逐一比对）＋本报告落盘。不实现、不合并、不冻结、不改任何契约。**本审阅对象为需求与计划文档，不含代码合并批，未跑 cargo/pnpm 全量**；全部引用以 main HEAD `4c6a1c0` 实文为准（`pnpm collab:brief` 2026-09-09 09:33 快照＋`git merge-base --is-ancestor` 核验）。
> 与前轮报告的关系：本任务所指需求此前已有一轮审阅（`collab/reviews/2026-09-09-w15-feedback-m6-import-page_ZH.md`，归档提交 `12d24b7`，经 git 核验为 HEAD 祖先），且**用户已于 2026-09-09 13 项批量裁决中对其中三项裁决请求全部裁定（BOARD U7 行，`collab/BOARD.md:281`）**。本轮为独立复核：不以前轮报告与 BOARD 记载为凭，全部结论以本机重新取证为准；重点是核对前轮结论是否成立、裁决后的遗留缺口是什么。

---

## verdict

**建议增设（有条件）——且「增设」本身已由用户裁决批准（U7①），当前不再是「是否增设」的问题，而是增设的三个前置条件中有两个尚未落账。**

独立复核结论与前轮一致且经代码/文档实文验证：素材导入页（云端下载＋本地导入）在已接受的产品边界与设计方向之内，不是越界新需求；「从本地导入」半边协议与实现已全链落地（缺的只是页面级呈现收敛），「从云端下载」半边的应用内 Web 浏览从未接线（诚实降级为系统浏览器）、且下载素材→仓储条目无生产路径无协议面。

条件（裁决已到、条件未齐，按现状列示）：

1. **IMP-3 契约先行（未启动）**：下载→仓储条目落库必须走数据域主导的 bdl-commands 族升版＋冻结硬前置（用户 U7③ 已批准该分权）——裁决已到，契约未动工，呈现不得先于契约；
2. **浏览「白名单外提示不禁止」语义尚未落任何受管文档**（U7② 已裁，product-boundary 停在 1.2.1/2026-09-08、desktop 架构文档措辞未区分浏览与下载）——IMP-2 开工前必须先落文档，且现行代码导航策略是**拦截**不是提示，实现与裁决语义存在实差；
3. **outline 尚无 IMP 任务行**：用户已批准 IMP-1~5 且实现定于 2026-09-09 23:00 开工（各工作树状态文件登记），但 `docs/development-outline_ZH.md` 2.0.10 的 M6 分解表（223–243 行）没有任何 IMP 行，而 M4 表 188 行已前向引用「M6 IMP-2」——权威计划文档落后于裁决，集成须在下批落 2.0.11（双语）。

---

## 证据

### 1. 需求登记与裁决现状（ BOARD/collab 实文）

- `collab/BOARD.md:206`：A3 行逐字登记用户需求，归属「桌面＋产品排期（M6 增设裁决）」；
- `collab/BOARD.md:262`：A3 处置列记载前轮审阅报告已归档（`12d24b7`；git 核验为 HEAD 祖先，报告文件 144 行在 main）；「归档与用户裁决前任何人不得据报告开工」；
- `collab/BOARD.md:281`（U7 行，实文）：**用户已裁决（2026-09-09 13 项全裁）**——①同意 M6 增设（IMP-1~5），细节允许先粗后细、冲刺初版再改；②购买流目前不做（非永久，取决于与 BOOTH 官方联系）；白名单策略＝先做白名单、**白名单外只做提示不禁止浏览**；下载主机域＝真机验证后逐域提案批准；③下载落库归数据域 bdl-commands 新契约——批准（协议面数据主导冻结硬前置）。→ 转已裁决待办：IMP-1~5 于今夜 23:00 开工；
- 裁决登记提交谱系：`4acc4ea`（wt-3 登记，桌面牵头 IMP 设计与页面）→ `f901051`（BOARD 13 项登记）→ `d1c5807`（并发融合）→ HEAD `4c6a1c0`（wt-main consolidated state）。wt-4（产线）登记「IMP-4 本地导入收口归桌面/数据（warehouse.import 已落地，产线无涉）」；wt-5（数据）登记「U7 裁决 3 后 IMP-3 契约先行（数据主导，冻结硬前置）」（`git show main:collab/state/wt-5.md`）。

### 2. 产品边界核对：需求在边界内（第 1 项核对）

- `docs/product-boundary_ZH.md:26-27`（v1.2.1，已接受）：AMF 组成第 3 条拥有「**原生素材浏览、授权下载、内容管理**」以及 Warehouse 用户阶段——「素材导入页」的两种进入路径均在此组成内；
- `docs/product-boundary_ZH.md:78-80`（明确边界）：「Electron Main 拥有远程网页、Session、Cookie、权限与下载传输的桌面机制和安全强制；AMF 拥有素材获取用例、任务、来源验证、文件检查与 Warehouse 映射」；「BOOTH 会话、订单、已购文件与凭据保留在用户设备，平台购买、付费、身份、年龄与访问控制保持权威」——BOOTH 安全边界条款完好，素材导入页不触及；
- `docs/design/design-standard_ZH.md:283-284`（§8.3，v0.6.3）：「原生远程浏览器、授权下载和本地 Warehouse 是一条连续素材获取路径，**不再使用云端目录/外部获取双轨产品模型**」；`:291`「批量导入与授权下载两条进入路径都落成**同一素材包条目模型**」——用户需求「导入页＝云端下载/本地导入两部分」与该句结构一一对应；
- **边界内但范围未钉死**：受管文档只写了 BOOTH 语境、隔离机制与平台权威，没有写「浏览来源范围与允许清单程序」——该缺口现由 U7② 裁决补上，但**裁决文本尚未落入任何受管文档**（见问题清单 H-1）。

### 3. 计划大纲核对：M6 现范围不含素材导入页；增设＝素材域跨域入窗（第 1 项核对续）

- `docs/development-outline_ZH.md:223-243`（M6 分解表，2.0.10）：M6（v0.8.0）＝项目管理与环境部署；任务包＝T-A（vrc-get 路径）/T-B（ALCOM/VCC 兼容矩阵）/T-C（F6 页面）/EAC/环境检查/门验收——**无素材导入页任务行，与现有 M6 任务行零重叠**（T-A/T-B/T-C/EAC 全为项目域/环境域，IMP 全为素材域）；
- `docs/development-outline_ZH.md:17-19`：门序规则——「不依赖未决契约的工作可以提前在切片中推进，但不能绕过对应 M 门形成产品发行」；`:231-234` M6 提前开工先例（用户裁决 2026-09-08 晚）：跨域任务包入窗＋门验收等 M5 关门按门序——IMP 增设有既定模式可循，U7① 即循此例；
- `docs/development-outline_ZH.md:188`（M4 表，2.0.10 补注）：「应用内浏览窗口呈现未迁移（当前诚实降级为系统浏览器），接线归素材导入页阶段（**M6 IMP-2**，待用户裁决 2 落地）」——前向引用的 IMP-2 行在 M6 表中**不存在**（落账缺口，见问题清单 M-1）；「待用户裁决 2 落地」的挂起条件现已由 U7② 解除，该括号注记需随 2.0.11 一并更新；
- `docs/development-outline_ZH.md:79-80`：本地导入底座（008 路径 a 接线 W18＋导入时挂点 W19）归 M5 首批，已在 main。

### 4. 架构与安全硬边界核对：Web 浏览入桌面的落法已有接受机制（第 2 项核对）

- `docs/architecture/desktop_ZH.md:55-57`：Main 通过窄化的浏览与下载端口向 AMF 提供桌面能力（导航/下载事件规范化），自行持有 Session/Cookie/下载令牌；AMF 负责获取意图、来源关联与 Warehouse 决策——职责分界清晰；
- `docs/architecture/desktop_ZH.md:59-71`（远程内容隔离）：`nodeIntegration:false`＋`contextIsolation:true`＋sandbox、独立 partition Session、按来源授权、**按允许清单处理导航、新窗口、下载目标和外部协议**、能力面只含标准 Web API、统一用 Main 管理的 `WebContentsView`——约束集完整，代码实态一致（`apps/desktop/src/electron/remote-content.ts:76-86`：sandbox/contextIsolation/无 preload/独立 partition，逐条对应）；
- `docs/architecture/integrations-and-overlays_ZH.md:43-44`：禁止「复制登录会话」——隔离 Session 内由用户自行登录（凭据留在独立 partition，不经 VUA 中转）符合既有约束；U7②「购买流不做」与 product-boundary:80「平台购买……保持权威」一致，无冲突；
- **硬约束未被需求触及**：远程 Web 内容不得获得 Node/preload/文件系统/凭据/Orchestrator/插件宿主访问——Web 浏览若按上述机制入桌面 UI（Main 管理 WebContentsView，Renderer 只经窄面），全部条款适用且代码基座已在位。**唯一实差**：U7② 裁定「白名单外只提示不禁止**浏览**」，而现行实现是拦截（`remote-content.ts` 导航策略违规即 `blocked` 广播；`main.ts:285,293` 允许清单仅 `["https://booth.pm"]`；`security.ts:81-90` 清单外拒绝）——浏览放行（提示）/下载从严（逐域提案）的双轨语义须先写进文档再实现（见问题清单 H-1）。

### 5. 所有权与依赖方向核对（第 3 项核对）

- `docs/development-outline_ZH.md:39-46`（六角色所有权表）：桌面＝Electron Main/Preload/Renderer/**远程网页**＋contracts TS 面；数据＝`crates/bdl-store`、`crates/acquisition`、`schemas/bdl*`、`schemas/download-events`；核心＝`crates/orchestrator`、`crates/provider-host`＋应用契约；环境＝`crates/project-manager`；产线＝`crates/unity-bridge`＋`schemas/unity-bridge`/`amf-production`；
- 派生归属（与各工作树登记一致，经代码交叉核实）：**IMP-1/2/4 归桌面**（页面、远程网页接线、Main 侧基座与 TS 面）；**IMP-3 归数据**（bdl-commands 升版、下载→条目落库、Warehouse 映射）；核心协作（新命令 wire 路由登记、capability 面）；集成（文档落账、门验收、排期仲裁）；**产线/环境无工作**——素材导入不走 Unity Bridge（代码事实：导入管线在 `crates/acquisition/src/warehouse_import.rs`，与 `crates/unity-bridge` 无涉；wt-4 状态文件同口径声明）；
- **契约先行要求下需要先冻结什么**：IMP-3 的下载→仓储条目命令面（bdl-commands 升版：Schema＋正负例向量＋至少一端消费测试＋TS 登记＋双语协议本＋REGISTRY，域角色数据主导——U7③ 批准原文即含「协议面数据主导冻结硬前置」）。IMP-1/2/4 无新协议面：复用已冻结契约（见第 6 节）。

### 6. 与在途契约的关系核对（第 4 项核对）

- **本地导入＝复用 `warehouse.import`（bdl-commands v0.3）**：`docs/protocols/bdl-commands-v0.3_ZH.md:6`（已冻结 2026-09-08）＋`:24、59`（warehouse.import 任务化、`params:{sourceFolders}`）；`docs/REGISTRY.md:33`（v0.3 已冻结，v0.2/v0.1 已取代）；实现全链在 main：`crates/provider-host/src/provider_host.rs`（warehouse.import 路由）→ `crates/acquisition/src/warehouse_import.rs:165`（条目落库，`IMPORT_ENTRY_KIND="imported_material"`，`:31`）→ 桌面提交流 `apps/desktop/src/renderer/features/warehouse/WarehouseAcquire.tsx:396-410`（拾取→确认列表→`gateway.warehouseCommands.importFolders` 单命令提交）；W18 导入 UI 批 `df32c8c` 经 git 核验为 HEAD 祖先——**不新增任何词表**；
- **云端下载＝复用 download-events v0.1（冻结，REGISTRY:161 侧 BOARD 摘要）＋下载端口＋`RemoteContentApiV1`**：`apps/desktop/src/electron/download-port.ts:1-40`（will-download 接管、事件不带 Cookie/令牌、`failureKind` 闭集 `policy|unknown`）；`packages/contracts/src/desktop-gateway.ts:529`（RemoteContentApiV1 已入 contracts）；
- **缺口实态（IMP-3 的依据）**：`crates/bdl-store/src/bdl_store.rs:1093`（`create_warehouse_item` 唯一生产 INSERT）的生产调用方**只有**导入管线 `warehouse_import.rs:165`（`warehouse_maintenance.rs` 的 664/868/1196 三处调用经核验均在 `#[cfg(test)] mod tests`〔`:603` 起〕内；`bdl_store.rs:2308` 为 fixture）；`collab/proposals/010-import-time-generation.md:29-31`（核心代码审计事实②）：「`download.ingest` 折叠写 download_events 与 local_artifacts/artifact_mappings，**不建仓储条目**」；条目模型有位无路：`apps/desktop/src/renderer/gateway/acquire-port.ts:26`（`WarehouseEntryKind = "imported_material" | "downloaded_material"`）——`downloaded_material` 只有模型位，无落库路径。**结论：下载→条目面若需新命令/字段，只能走 bdl-commands 升版，不得另立词表**；
- **proposal 013/014 不是复用载体**：013 R5（`collab/proposals/013-project-management-wire-face.md:48-50`）写命令各自独立提案；014 仲裁第 1 条（`collab/proposals/014-import-as-vua-copy.md:124-127`）明裁「素材域与项目域**不混词表**」——`project.import-copy` 是 Unity 项目复制写路径（project-ops v0.1，REGISTRY:17，已冻结），与素材包导入是两个域，严禁互借；同理 project-inspection v0.1（REGISTRY:16，已冻结）是项目域读面，与素材导入页无关；
- **production-use-case v0.2 不相干**：REGISTRY:38（已冻结 2026-09-09，24 向量＋消费测试）十方法为生产域（recipe/plan/job/record）；素材导入页与其唯一交点＝导入后的条目成为 Recipe `sourceRef: warehouse` 来源（recipe v0.3 已冻结支持），无需新契约；
- 独立复核结论：**不存在「平行新增第三条路」的必要**——两条进入路径各自挂靠既有冻结面，唯一新增面＝IMP-3 的 bdl-commands 升版（用户已批）。

### 7. 代码实态：两个半边的真实状态（第 5 项核对的底座事实）

- **「从云端下载」的应用内浏览从未接线（诚实递延，非隐藏缺陷）**：`apps/desktop/src/renderer/app/browse-window.ts:6-15`——`browseWindowSupported()` 恒返回 false，注释自证「独立浏览窗口要求 Main 管理的 WebContentsView＋隔离 Session（开发大纲 F4），未随本切片迁移。当前恒返回 false——调用方降级为『系统浏览器打开』，诚实呈现」；`apps/desktop/src/electron/provider-bootstrap.ts:16-27`——`desktop.remoteBrowser` 恒 unavailable（`vua.desktop.remote_browser_unavailable`）；
- **在位基座（可直接复用，无需新发明机制）**：`remote-content.ts:70-100`（WebContentsView 管理＋导航策略＋violation 广播）；`main.ts:186-205`（open/navigate/close/setVisible IPC）＋`:285-298`（RemoteContentManager 装配，允许清单 `["https://booth.pm"]`）；`preload.ts` remoteContent 窄面；contracts `RemoteContentApiV1`；
- **现行仓储页仍是双轨形态**：`apps/desktop/src/renderer/features/warehouse/WarehousePage.tsx:494-528`（S-IX-3「云端目录/本地文件」双轨选择头）——与 §8.3「不再双轨」并存（见问题清单 M-2）。

### 8. 审阅边界声明（诚实纪律）

- 本轮未复核 W6/W7 走查与 M4 关门证据存档（`_local_m4/` 等本地目录不入库），对 M4 表「走查闭环」行只做文档-代码一致性比对；
- BOOTH 文件下载主机域、隔离 Session 内登录行为的真机表现，仓库内无证据——本报告不作断言，维持 U7②「真机验证后逐域提案」义务；
- U7 裁决文本以 BOARD 转述为准（13 项裁决经操作者转达登记）；本审阅无法核验转述与用户原始表述的逐字一致性——按协调机制 BOARD 登记即为协作面权威，如实注记此局限。

---

## 问题清单（按严重度）

| 级别 | # | 问题 | 依据 | 处置建议 |
| --- | --- | --- | --- | --- |
| 高 | H-1 | **U7② 浏览语义与现行实现/受管文档三方不一致**：裁决＝「白名单外只做提示、不禁止**浏览**」；现行代码＝导航策略违规即拦截（`blocked`）；product-boundary 停在 1.2.1（2026-09-08，裁决前版本）、desktop_ZH.md:59-71 只写「按允许清单处理导航、新窗口、下载目标和外部协议」（未区分浏览与下载的宽严）。且「浏览放行/下载从严」的双轨中，**新窗口/外部协议/下载目标三处是否随浏览放行**裁决未明文。安全边界判断，不得由实现进程自行类推 | BOARD.md:281（U7②）；remote-content.ts:70-100（blocked）；main.ts:285,293；security.ts:81-90；product-boundary_ZH.md 版本头（1.2.1/2026-09-08）；desktop_ZH.md:59-71 | IMP-2 开工前：①集成落 product-boundary 升版＋desktop 架构行，明文「浏览导航＝清单内直行、清单外提示放行；下载目标＝清单外拒绝（真机验证后逐域提案）」；②新窗口/外部协议的适用面走裁决请求 1（本报告）；③实现按文档翻转（导航策略从拦截改提示），隔离红线（sandbox/无 preload/partition/标准 Web API）一条不动 |
| 高 | H-2 | **IMP-3 契约先行未启动，冲刺压力下最易被违反**：下载→仓储条目无生产路径（`create_warehouse_item` 生产调用方仅导入管线；download.ingest 不建条目）、`downloaded_material` 只有模型位。用户 U7① 允许「先粗后细、冲刺初版」与 U7③「协议面数据主导冻结硬前置」并存——若桌面冲刺先行造下载落库呈现，即违反契约先行并造出第三条路径 | warehouse_import.rs:31,165；bdl_store.rs:1093；warehouse_maintenance.rs:603（其余调用全在测试模块）；acquire-port.ts:26；010 提案:29-31；BOARD.md:281（U7①③） | 排期纪律：IMP-3 的 bdl-commands 升版（Schema＋正负例向量＋消费测试＋TS 登记＋双语协议＋REGISTRY）先于任何下载落库呈现合入 main；数据域已认领（wt-5 状态），集成验收时核对冻结硬前置齐备 |
| 中 | M-1 | **outline 落后于裁决**：M6 分解表无 IMP-1~5 行，而 M4 表 188 行已前向引用「M6 IMP-2（待用户裁决 2 落地）」——前向引用指向不存在的行，且挂起条件已解除未更新；用户已批准、实现 23:00 开工，权威计划文档（「只安排已接受工作」）未反映已接受工作 | development-outline_ZH.md:223-243（无 IMP 行）、:188（前向引用）；BOARD.md:281（已裁决） | 集成域文档修正（docs/ 所有权归集成）：outline 2.0.11（双语）把 IMP-1~5 行入 M6 表（治理注记＝用户裁决 U7① 2026-09-09，比照提前开工先例格式）＋解除 M4 行「待用户裁决 2」括号＋M6 门状态行（BOARD:35）同步 |
| 中 | M-2 | **双轨头与 §8.3 并存**：WarehousePage 仍渲染 S-IX-3「云端目录/本地文件」双轨选择头，设计标准已宣告「不再使用云端目录/外部获取双轨产品模型」——导入页立项若不对账，漂移被固化进新页面 | design-standard_ZH.md:283-284；WarehousePage.tsx:494-528 | IMP-1 设计批内裁决双轨头去留与云端目录轨合并方式，随设计标准升版落账 |
| 中 | M-3 | **能力判定驱动呈现是硬验收项**：`desktop.remoteBrowser` 恒 unavailable 为装配期硬编码、`browseWindowSupported()` 恒 false——接线切片必须翻转能力判定并保留旧 provider/未接线时的诚实降级（入口不渲染或挂标注），否则违反两态开关模型与既有先例 | provider-bootstrap.ts:16-27；browse-window.ts:6-15；010 桌面表态 3（标注移除双条件先例） | 写入 IMP-2 任务行验收项 |
| 中 | M-4 | **桌面排期拥挤**：wt-3 登记今晚开工序＝A1 联动＋A2 呈现屏蔽＋U6 测试范围→IMP 冲刺；A1/A2 与 IMP-1 同动 WarehousePage/WarehouseAcquire/设置页，且 W25 真机窗口与 M5 门验收（W26）在即 | wt-3 状态文件（阻塞节）；BOARD.md:253（O-2 W25 前置③进行中）；WarehousePage/WarehouseAcquire 同文件域 | 排期归集成：A1/A2 修正批先行或与 IMP-1 同批合并；IMP 批避开 W25 窗口；切片寿命 ≤3 天纪律照常 |
| 低 | L-1 | **初始白名单内容与用户本地参考物**：U7② 提及用户本地参考物含 booth.pm/pximg.net/vrchat.com 等案例（本地路径严禁入库——BOARD 已注记）。浏览初始清单内容（至少 booth.pm±子域）与后续逐域扩充程序应在 IMP-2 设计批明文，不得把用户本地文件路径写入任何入库文档 | BOARD.md:281（U7② 注记）；main.ts:285,293（现清单仅 booth.pm） | IMP-2 设计批列初始清单提案（入库文本只写域名，不写路径）；下载主机域维持「真机验证→逐域提案→批准」程序 |
| 低 | L-2 | **隔离 Session 内登录/购买呈现无设计记录**：用户自登录、平台权威、VUA 不代理不中转——机制约束齐（desktop_ZH:59-71＋integrations:43-44＋product-boundary:80），但无 UI 设计记录 | 同左 | 并入 IMP-1 设计批（U7② 购买流不做的语义一并呈现：浏览页内购买动作即平台原生页面行为，VUA 不建购买流 UI） |

前轮报告问题清单对账：M-1（outline M4 行诚实降级补注）**已解决**（outline 2.0.10 落账，188 行）；L-1（wt-4 把 W18 导入 UI 误列待办）**已解决**（`b553889` L-1 更正备案：「导入 UI 已随 W18 呈现批验收合并——『接线待办』表述不符，条目 3 的『从本地导入』实为既有导入 UI 的入口收敛/重组」）；H-1/H-2/M-2/M-3/M-4/L-2 在本轮以新证据（U7 裁决后语境）重新表述如上。

---

## 给用户的裁决请求

U7 三项裁决请求已全部裁定，本轮**不重复提请**。新增裁决请求仅一项（窄），另有一项低优先确认：

1. **【浏览放行面的精确边界——H-1 衍生，[需用户]**】您已裁定「白名单外只做提示、不禁止**浏览**；下载主机域真机验证后逐域提案」。桌面架构文档把「导航、新窗口、下载目标、外部协议」四类都归在允许清单管辖下，其中导航（浏览）与下载目标已由您的裁决明确（一宽一严），但**新窗口打开与外部协议跳转**（如从商品页唤起其它应用）未明文：这两类随浏览放行（提示后允许），还是维持清单内限制（清单外拦截）？
   - 选项 A（宽）：随浏览——清单外提示后放行，与「不禁止浏览」一致；风险＝外部应用唤起面扩大，提示文案需承担告知义务；
   - 选项 B（严，审阅者倾向）：仅导航浏览放行；新窗口与外部协议维持清单内限制——最小权限原则（product-boundary:73）下先窄后宽，后续按使用体感再逐项放开；
   - 不裁决的影响：IMP-2 无法定导航策略的完整语义，实现会自行类推（违反安全边界判断归用户的升级规则）。
2. **【低优先确认，可随 IMP 落账批一并答复】** IMP-1~5 入 M6 后，其**门验收**是否并入 M6（v0.8.0）门验收清单（即 IMP 完成度进入 v0.8.0 发行条件）？审阅者默认读法＝并入（IMP 即 M6 增设任务包，比照 T-A/T-C 先例：切片先行、门验收按门序），若您无意让 IMP 阻塞 v0.8.0 发行，请明示「IMP 验收独立于 M6 门」。

---

## 附：M6 增设阶段任务行草案（IMP 任务包——按 U7 裁决后语境修订，供 outline 2.0.11 落表参照）

| 任务包 | 任务 | 负责角色 | 协作 | 依赖与风险 |
| --- | --- | --- | --- | --- |
| IMP-1 | 素材导入页信息架构与呈现设计：独立导入面（云端下载＋本地导入两部分）；与 §8.3「连续素材获取路径」对账（双轨头去留、云端目录轨合并——M-2）；隔离 Session 登录呈现设计与「购买流不做」语义呈现（L-2） | 桌面 | 集成（设计标准对账与升版） | 依赖裁决请求 1（浏览放行面）；风险＝与 A1/A2 修正批同动仓储/设置页（M-4），排期归集成 |
| IMP-2 | 应用内 Web 浏览接线：渲染层消费既有 `RemoteContentApiV1`＋Main 基座（remote-content/download-port 均在位）；`desktop.remoteBrowser` 能力判定翻转＋旧 provider 兜底诚实标注（M-3）；导航策略按「清单内直行/清单外提示放行」翻转＋下载目标维持清单外拒绝；初始浏览清单提案（L-1）；**下载主机域真机验证→逐域提案→批准**（U7② 程序） | 桌面 | 核心（contracts/capability 面）、集成（安全验收＋product-boundary/desktop 架构文档落账） | 硬前置＝裁决请求 1 落定＋H-1 文档落账；隔离红线（sandbox/无 preload/partition/标准 Web API）逐条不动；未验证下载域一律拒绝（诚实失败） |
| IMP-3 | 云端下载→仓储条目落库路径（`downloaded_material`）：契约先行——数据域主导 bdl-commands 升版（新命令/扩展面），冻结硬前置（Schema＋正负例向量＋消费测试＋桌面 TS 登记＋双语协议＋REGISTRY）后实现 | 数据 | 核心（wire 路由）、桌面（TS 面与呈现） | 硬前置＝U7③ 程序（H-2）；风险＝平行第三条路（禁止：只准 bdl-commands 族或其升版）；可与 IMP-1 并行启动契约设计，不占门序 |
| IMP-4 | 本地导入呈现收口并入导入页：复用 `warehouse.import` v0.3 与既有 W18 提交流（拾取→确认列表→单命令→任务中心），不新增路径不新增词表；按 L-1 更正口径＝既有导入 UI 的入口收敛/重组 | 桌面 | 数据 | 协议与实现已在 main（v0.3 冻结＋df32c8c）；可与 IMP-1 同批，协议零新增 |
| IMP-5 | 验收与文档同步：隔离冒烟（Session 隔离/权限拒绝/清单外浏览提示/清单外下载拒绝/下载接管/外部协议行为＝按裁决请求 1 结果）、诚实空态与能力判定核验；product-boundary（浏览白名单策略落版）/outline M6 表/design-standard/desktop 架构行更新 | 桌面（文档协作）＋集成（验收与文档） | 数据、核心 | 证据纪律：无真机证据不宣称端到端（BOOTH 下载域真机验证记录为 IMP-2 交付物）；outline 2.0.11 落表（M-1）不必等本包，随集成下批先行 |

排期注记：实现已按用户指令于 2026-09-09 23:00 开工（桌面牵头）。W25 真机窗口与 M5 门验收（W26）在即——IMP 呈现批避开 W25 窗口；IMP-3 契约设计与 IMP-1 设计草稿可与 M5 收尾并行（不占门序、不动 M5 冻结面）。M6 门验收与发行仍按门序（等 M5 关门），IMP 若并入 M6 门验收（裁决请求 2 默认读法）则其完成度进入 v0.8.0 发行条件。

---

## 审阅者结语

独立复核维持前轮「建议增设（有条件）」的结论，且该结论已由用户裁决（U7）背书——本轮的增量价值在三处：其一，确认「增设」的三个前置中两个仍未落账（IMP-3 契约未动工；U7② 浏览语义未入受管文档且与现行拦截式实现存在实差——H-1/H-2）；其二，发现权威计划文档落后于裁决的前向引用断链（outline M6 表无 IMP 行而 M4 行已引用 IMP-2——M-1）；其三，把裁决文本的未明文处（新窗口/外部协议是否随浏览放行）收窄为一项 [需用户] 裁决请求，避免实现进程自行类推安全边界。「冲刺初版」的用户授权不豁免契约先行与安全边界落文档两项纪律——速度的弹性在细节，不在底线。
