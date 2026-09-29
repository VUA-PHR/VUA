# 审阅报告：W15 确认回传条目 3——素材导入页与 M6 增设阶段

> 审阅者：独立审阅子智能体（Reviewer，不归属六角色生产体系）
> 日期：2026-09-09
> 审阅对象：用户 W15 关门确认回传条目 3（逐字：「3.接2：目前缺少明确的素材导入页面，其需要：从云端下载/从本地导入两个部分，前者又暴露出缺少Web浏览功能，请调用审阅子智能体，根据需求在M6增设阶段。」）；对应 `collab/BOARD.md`「W15 确认后问题清单」A3 行（BOARD.md:207）
> 方法：只读复核（文档、Schema、协议、代码、collab 线程逐一比对）＋本报告落盘；不实现、不合并、不冻结、不改任何契约。所有宣称均以仓库实文与 main 分支代码为准，不以状态文件、提交信息或 BOARD 记载为凭。
> 语境条目：同批 A2（产物模式三层联动，BOARD.md:206）、A4/A1（生成取消后自动取消，BOARD.md:205）——条目 3 与 A2 同动仓储/条目呈现，排期需协调（见问题清单 M-4）。

---

## verdict

**建议增设（有条件）。** 「素材导入页」（云端下载＋本地导入）在已接受的产品边界与设计方向之内，不是越界新需求——product-boundary 1.2.1 已含 AMF「原生素材浏览、授权下载」，design-standard v0.6.3 §8.3 已把「原生远程浏览器、授权下载和本地 Warehouse」定为**一条连续素材获取路径**并明确「批量导入与授权下载两条进入路径都落成同一素材包条目模型」。用户所见缺口经代码核实属实：**「从本地导入」半边协议与实现已全链落地**（缺的是独立导入页呈现），**「从云端下载」半边的应用内 Web 浏览从未接线**（诚实降级为系统浏览器），且**下载素材→仓储条目的生产路径与协议面不存在**。

条件（裁决前不动工的部分）：

1. **Web 浏览的安全边界与范围必须先经用户裁决**（浏览来源允许清单、隔离 Session 内的登录/购买语义、下载主机域扩展程序）——属产品边界判断，按升级规则不在进程间制造共识；
2. **下载→仓储条目落库路径需先经数据角色契约裁决**（复用/扩展 bdl-commands 族），否则会平行造出第三条素材进入路径，违反契约先行；
3. M6 增设属**素材域工作入「项目管理与环境部署」门的窗口**，比照 M6 提前开工先例（用户裁决 2026-09-08 晚）由用户确认范围与门序；门验收与发行仍按门序，不因入窗而提前形成产品发行。

---

## 证据

### 1. 需求登记语境

- `collab/BOARD.md:207`（A3 行）：集成已登记「素材导入页面为新增产品面；云端下载依赖 Web 浏览功能（现状 F4 远程浏览的缺口确认）；待审阅子智能体报告后再入计划，先登记为待定项」。本报告即该行所指产出。
- `collab/BOARD.md:201`：9 条问题清单登记纪律为「先确认用户意图，不动手改文件」——本审阅遵循同一纪律。

### 2. 产品边界：需求在边界内，但边界未钉死浏览范围

- `docs/product-boundary_ZH.md:26-33`（已接受的产品组成 3，v1.2.1）：AMF 拥有「**原生素材浏览、授权下载、内容管理**」与素材入口语义（默认直接使用原始 `.unitypackage`；「生成 VPM 包替代」触发时机＝素材导入时，随 M5 接线）——「素材导入页」的两种进入路径均在此组成内。
- `docs/product-boundary_ZH.md:78-80`（明确边界）：「Electron Main 拥有远程网页、Session、Cookie、权限与下载传输的桌面机制和安全强制；AMF 拥有素材获取用例、任务、来源验证、文件检查与 Warehouse 映射」；「BOOTH 会话、订单、已购文件与凭据保留在用户设备，平台购买、付费、身份、年龄与访问控制保持权威」。
- `docs/product-boundary_ZH.md:73`（稳定产品原则·最小权限）：「远程网页、插件和第三方组件只获得完成任务所需的能力」。
- **边界缺口**：受管文档只给了隔离机制与 BOOTH 语境，**没有钉死「Web 浏览功能的来源范围」**（仅 BOOTH 还是更多来源、允许清单的裁决程序）——这是裁决请求 2 的依据。

### 3. 计划大纲：M6 现范围不含素材导入页；相关底座在 M4/M5

- `docs/development-outline_ZH.md:223-243`（M6 分解表，2.0.9）：M6（v0.8.0）＝项目管理与环境部署，任务包＝T-A（通用 vrc-get 路径）/T-B（ALCOM/VCC 兼容矩阵）/T-C（F6 页面）/EAC/环境检查/门验收——**无素材导入页任务行**。增设即跨域入窗。
- `docs/development-outline_ZH.md:17-19`：门序规则——「不依赖未决契约的工作可以提前在切片中推进，但不能绕过对应 M 门形成产品发行」；M6 提前开工先例（行 231-234，用户裁决 2026-09-08 晚，越门序但门验收等 M5 关门）证明「跨域任务包入 M6 窗口＋门序不动」有既定模式可循。
- `docs/development-outline_ZH.md:186-200`（M4 分解表）：「远程内容/Session/下载端口与隔离浏览界面｜桌面｜✅ 已交付（F4-2/3/4/6），走查闭环（W6/W7）」——该行与渲染层实态存在表述差（见问题清单 M-1）。
- `docs/development-outline_ZH.md:79-80、209-221`（M5 首批 W18/W19）：008 路径 a 接线＋导入时自动生成挂点与编排语义（010）——本地导入底座归属 M5 首批，已在 main。
- `docs/development-outline_ZH.md:39-46`（六角色所有权）：桌面＝Electron Main/Preload/Renderer/**远程网页**；数据＝`crates/acquisition`、`schemas/bdl*`、`schemas/download-events`；核心＝provider-host 路由与应用契约——素材导入页的三方归属由此表派生。

### 4. 设计标准：连续素材获取路径已是接受方向，但与现行页面形态并存

- `docs/design/design-standard_ZH.md:283-284`（§8.3，v0.6.3）：「**原生远程浏览器、授权下载和本地 Warehouse 是一条连续素材获取路径，不再使用云端目录/外部获取双轨产品模型**」。
- `docs/design/design-standard_ZH.md:291`：「**批量导入与授权下载两条进入路径都落成同一素材包条目模型**」——用户需求的「素材导入页＝云端下载/本地导入两部分」与该句结构完全对应。
- `apps/desktop/src/renderer/features/warehouse/WarehousePage.tsx:494-528`：现行仓储页仍渲染「云端目录/本地文件」双轨选择头（S-IX-3）——与 §8.3「不再双轨」的表述并存（见问题清单 M-2）。

### 5. 架构与安全硬边界：Web 浏览入桌面的落法已有接受机制

- `AGENTS.md`（架构约束）：「Remote web content is isolated from local privileges and never receives Node.js, preload, filesystem, credential, Orchestrator, or plugin-host access.」「BOOTH access uses the user's own local session and authorization. Do not bypass purchase, payment, age, authentication, or access controls.」
- `docs/architecture/desktop_ZH.md:59-71`（远程内容隔离）：`nodeIntegration:false`＋`contextIsolation:true`＋sandbox、独立 partition Session、按来源授权、允许清单导航/新窗口/下载/外部协议、能力面只含标准 Web API、解析结果经 AMF 素材获取边界验证后才成 BDL 来源观察。**Web 浏览若入桌面 UI，落法＝Main 管理的 `WebContentsView`，这些条款已构成完整约束，无需新发明机制。**
- `docs/architecture/desktop_ZH.md:55-57`：Main 通过窄化浏览与下载端口向 AMF 提供桌面能力；AMF 负责素材获取意图与 Warehouse 决策——职责分界清晰。
- `docs/architecture/integrations-and-overlays_ZH.md:43-44`：禁止「复制登录会话」——隔离 Session 内由用户自行登录（凭据留在该独立 partition，不经 VUA 中转）符合既有约束。

### 6. 代码实态（2026-09-09，main 分支逐一核实）

**6a.「从本地导入」半边：协议与实现全链已落地，缺的只是页面级呈现。**

- 协议冻结：`docs/protocols/bdl-commands-v0.3_ZH.md:14-16、24-28、59-63`——`warehouse.import`（任务化，folder 批，`params:{sourceFolders}`）已冻结（2026-09-08）；
- provider 路由：`crates/provider-host/src/provider_host.rs:1199、3044-3051`（`warehouse.import` 路由与 `warehouse_import_submit`）；
- 导入管线与自动生成挂点：`crates/acquisition/src/warehouse_import.rs:165`（条目落库）；`crates/acquisition/src/warehouse_maintenance.rs:607`（`submit_warehouse_import_auto`/`AutoGenerateSpec`——010 路径 A 挂点已落）；
- 桌面 UI：`apps/desktop/src/renderer/features/warehouse/WarehouseAcquire.tsx:396-410`（拾取→确认列表→`gateway.warehouseCommands.importFolders` 单命令提交）；系统文件夹对话框 `apps/desktop/src/electron/main.ts:158`＋`preload.ts:33`；TS 面 `warehouse-commands-port.ts:82`、`warehouse-commands-live.ts:144-149`；
- 合并证据：W18 导入 UI 批 `df32c8c`（「M5 presentation batch — W18 import UI + W19 008 path-a wiring」）经核实为 main 祖先。
- 010 桌面表态第 1 条（`collab/proposals/010-import-time-generation.md:166-177`）原设计入口＝仓储页「获取」区顶部操作位；用户新需求（独立导入页面）是对该呈现设计的演进，不推翻协议与提交流。

**6b.「从云端下载」半边：下载链与隔离基座在位，应用内 Web 浏览从未接线。**

- 未接线证据：`apps/desktop/src/renderer/app/browse-window.ts:12-26`——`browseWindowSupported()` **恒返回 false**，注释明言「独立浏览窗口要求 Main 管理的 WebContentsView＋隔离 Session（开发大纲 F4），未随本切片迁移。当前恒返回 false——调用方降级为『系统浏览器打开』，诚实呈现」（M4 迁移时的已知递延，非隐藏缺陷）；
- 能力面：`apps/desktop/src/electron/provider-bootstrap.ts:16-27`——`desktop.remoteBrowser` **恒 unavailable**（`vua.desktop.remote_browser_unavailable`）；渲染层生产代码**无任何** `remoteContent` 消费者（全渲染层 grep 仅测试文件引用该能力字段）；
- 在位基座（可直接复用，无需新建机制）：`apps/desktop/src/electron/remote-content.ts:76-86`（WebContentsView：sandbox/contextIsolation/无 preload/独立 partition）、`main.ts:186-205`（open/navigate/close/setVisible IPC）、`main.ts:285-298`（RemoteContentManager 装配）、`preload.ts:53-67`（remoteContent 窄面）、`packages/contracts/src/desktop-gateway.ts:499-543`（`RemoteContentApiV1`/事件类型已入 contracts）；
- 允许清单：`main.ts:285、293`＝`["https://booth.pm"]`；`security.ts:81-90` 判定含点后缀子域语义（`*.booth.pm` 覆盖商店页）。**BOOTH 文件下载的实际主机域未经真机验证**，下载端口按 `isAllowedRemoteOrigin` 拒绝清单外来源（`download-port.ts` policy 失败闭集）——不许预猜扩域（见裁决请求 2③）；
- 下载链（已接线部分）：`apps/desktop/src/electron/download-port.ts:22-40`（F4-3：will-download 接管、download-events v0.1 词表规范化、事件不带 Cookie/令牌）＋`main.ts:225-296`（事件汇批量投递 `download.ingest`、意图回腿）。

**6c. 关键缺口：下载素材→仓储条目无生产路径、无协议面。**

- `crates/bdl-store/src/bdl_store.rs:1093`（`create_warehouse_item` 唯一 INSERT）的生产调用方＝导入管线 `warehouse_import.rs:165`（maintenance 中其余调用经抽查位于测试模块，如 655-675 的 fixture）；
- proposal 010 前置事实②（`collab/proposals/010-import-time-generation.md:29-31`，核心代码审计）：「`download.ingest` 折叠写 download_events（下载账本）与 local_artifacts/artifact_mappings，**不建仓储条目**」；
- 条目模型已预留位：`apps/desktop/src/renderer/gateway/acquire-port.ts:26`——`WarehouseEntryKind = "imported_material" | "downloaded_material"`，即「同一素材包条目模型」有模型位、无落库路径；
- 结论：**「从云端下载」若即日开工，会在无契约状态下先造呈现**——必须先走数据域契约裁决（见裁决请求 3）。

### 7. 与在途契约的关系：复用面清晰，第三条路有明令禁止

- **本地导入**：复用 `warehouse.import`（bdl-commands v0.3，已冻结＋全链在 main）——不新增任何词表；
- **云端下载**：复用 download-events v0.1（冻结）＋`download.ingest` 链＋`RemoteContentApiV1`（contracts 已登记）；缺口的「下载→条目」落库面若需新命令/字段，**只能走 bdl-commands 升版**（数据角色词表主导权，010 数据表态 3 与收口裁决 1 的既定程序），不得另立词表；
- **proposal 013/014 不是复用载体**：013 R5（`collab/proposals/013-project-management-wire-face.md:48-50`）写命令各自独立提案；014 仲裁第 1 条（`collab/proposals/014-import-as-vua-copy.md:124-127`）明裁「**素材域词表（bdl-commands）不混项目域命令**」——`project.import-copy` 是 Unity 项目复制写路径，与素材包导入是两个域，严禁互借；
- **production-use-case v0.2 不相干**：十方法为生产域（recipe/plan/job/record），素材导入页与其唯一交点是导入后的条目成为 Recipe `sourceRef: warehouse` 来源（recipe v0.3 已冻结支持），无需任何新契约；
- **catalog 侧**：`docs/protocols/bdl-queries-v0.3_ZH.md:65-67`——catalog 数据源＝本地 BDL 离线读取，「G13 写路径（激活/在线回退/增量同步）不进本协议」。浏览页面的商品呈现来自用户实时访问的远程页（走 AMF 素材获取边界成观察），不依赖 catalog 在线化，两者不冲突。

### 8. 产线域交叉核实

- wt-4 状态批（`201f85b`，条目 3 处置）：「素材导入**不走 Unity Bridge**——产线在此页面无新工作、无协议新增」，与 6a/6b 代码实态一致；其处置草案建议「任务行锚 product-boundary 1.2.x 素材入口语义，负责桌面、协作数据」，与本报告归属结论一致。
- 小误差（问题清单 L-1）：该批把「从本地导入＝warehouse.import 的 UI 接线」列为待办桌面切片，而 W18 导入 UI（`df32c8c`）已在 main——知会更正即可，不影响结论。

### 9. 审阅边界声明（诚实纪律）

- 本审阅未复核 W6/W7 走查证据存档（`_local_m4/` 等本地目录），对 M4 表「走查闭环」行只做文档-代码一致性比对，不判定当时验收真伪；
- BOOTH 下载主机域、隔离 Session 内登录/购买流的真机行为，仓库内无证据——本报告不作断言，列入实现切片的真机验证义务（裁决请求 2③）。

---

## 问题清单（按严重度）

| 级别 | # | 问题 | 依据 | 处置建议 |
| --- | --- | --- | --- | --- |
| 高 | H-1 | Web 浏览的来源范围与允许清单程序未在受管文档钉死：product-boundary 只写 BOOTH 语境与平台权威，desktop 架构只写隔离机制；允许清单现仅 `booth.pm`（±子域）。范围扩大属产品边界判断，不能由进程裁决 | product-boundary_ZH.md:78-80；desktop_ZH.md:59-71；main.ts:285,293 | 裁决请求 2；裁决落 product-boundary/架构文档后再开工 IMP-2 |
| 高 | H-2 | 下载素材→仓储条目无生产路径、无协议面：`download.ingest` 不建条目（010 前置事实②＋代码核实），`downloaded_material` 条目种类只有模型位。先造呈现必违反契约先行 | bdl_store.rs:1093；warehouse_import.rs:165；acquire-port.ts:26；010 提案:29-31 | 裁决请求 3；数据角色裁决复用/扩展面并走冻结硬前置（Schema＋向量＋消费测试＋TS 登记＋双语协议＋REGISTRY）后才开工 IMP-3 |
| 中 | M-1 | outline M4 行「远程内容/Session/下载端口与隔离浏览界面 ✅ 已交付」与渲染层实态不一致：应用内浏览窗口未迁移、`desktop.remoteBrowser` 恒不可用、诚实降级为系统浏览器（代码注释自证为已知递延）。行文未注记递延，与诚实纪律的「宣称须可核对」有出入 | development-outline_ZH.md:188；browse-window.ts:12-26；provider-bootstrap.ts:16-27 | 集成域文档修正：行内补注「应用内浏览窗口呈现未迁移（诚实降级系统浏览器），接线归素材导入页阶段」；不改验收结论本身 |
| 中 | M-2 | design-standard §8.3「不再使用云端目录/外部获取双轨产品模型」与现行仓储页双轨选择头（S-IX-3）并存：素材导入页立项若不对账，会把漂移固化进新页面 | design-standard_ZH.md:283-284；WarehousePage.tsx:494-528 | IMP-1 设计批内一并裁决：双轨头去留、云端目录轨与浏览/下载路径的合并方式，随设计标准升版落账 |
| 中 | M-3 | `desktop.remoteBrowser` 恒 unavailable 为装配期硬编码：接线切片必须把「能力判定驱动呈现」作为验收项（旧 provider/未接线时入口不渲染或挂标注），否则违反两态开关模型与能力判定先例 | provider-bootstrap.ts:16-27；010 桌面表态 3（标注移除双条件先例）；design-standard §6.5 | 写入 IMP-2 任务行验收项 |
| 中 | M-4 | 与同批 A2（三层联动）/A1（自动取消）同动仓储/条目呈现：素材导入页若并行开工，两批会在 WarehousePage/WarehouseAcquire 冲突 | BOARD.md:205-207 | 排期归集成：建议 A1/A2 修正批先行或同批合并；IMP 呈现批避开同一切片窗口 |
| 低 | L-1 | wt-4 条目 3 处置把本地导入 UI 接线列为待办，与已合并的 W18 导入 UI（df32c8c）不符 | 201f85b；df32c8c（main 祖先） | 知会产线更正；不影响归属结论（产线无新工作的判断仍成立） |
| 低 | L-2 | 隔离 Session 内的登录/购买呈现（用户自登录、平台权威）无 UI 设计记录：浏览页设计时需按 desktop 架构 §远程内容隔离与 product-boundary BOOTH 条款补设计，不得由 VUA 代理登录或中转凭据 | desktop_ZH.md:59-71；product-boundary_ZH.md:80；integrations-and-overlays_ZH.md:43-44 | 并入 IMP-1/IMP-2 设计批；属未排期设计项，非缺陷 |

---

## 给用户的裁决请求

1. **【M6 增设确认】** 是否按本报告附表在 M6 增设「素材导入页（IMP）」任务包：范围＝云端下载（含 Web 浏览）＋本地导入呈现收口；门序安排＝切片可比照 M6 提前开工先例在窗口内推进，**门验收与发行仍按门序**（不形成越门发行）；阶段命名与锚点建议＝「AMF 素材获取」（权威＝product-boundary 1.2.1 素材入口语义＋design-standard §8.3），**不改动 M6「项目管理与环境部署」的门定义文本**。备选（若不愿整体增设）：仅裁「本地导入呈现收口并入现行批」，Web 浏览另议——但不裁决不动工。
2. **【Web 浏览安全边界与范围——必须逐项裁决】**
   ① 浏览来源范围：仅 BOOTH（维持 `booth.pm`±子域允许清单）还是更多来源？若扩大，是否接受「逐域裁决、逐域入清单」的程序（不允许一次性开放任意导航）；
   ② 登录与平台控制语义：隔离 Session 内由用户自行登录，购买/付费/年龄/访问控制全由平台承载，VUA 不代理、不中转、不绕过（现行机制已符合，请确认产品语义无异议）；
   ③ 下载主机域：BOOTH 文件下载实际落点域未经真机验证——授权 IMP-2 实现切片**先真机验证、后按验证结果逐域提案扩清单**，禁止预猜放行。
3. **【下载素材落库语义】** 确认「授权下载的素材与本地导入落成**同一素材包条目模型**」（design-standard §8.3 既有语义）；具体协议面（复用 `warehouse.import` 消费下载暂存产物 vs 数据角色在 bdl-commands 族内升版新增/扩展）**归数据角色按词表主导权裁决后走冻结硬前置**，本报告不预选——请确认该分权即可。

### 附：M6 增设阶段任务行草案（IMP 任务包，供裁决 1 参照）

| 任务包 | 任务 | 负责角色 | 协作 | 依赖与风险 |
| --- | --- | --- | --- | --- |
| IMP-1 | 素材导入页信息架构与呈现设计：独立导入面（云端下载＋本地导入两部分）；与 §8.3「连续素材获取路径」对账（双轨头去留、云端目录轨合并方式一并定）；隔离 Session 登录/购买呈现设计（L-2） | 桌面 | 集成（设计标准对账） | 依赖裁决 1/2；风险＝与 A2/A1 修正批同动仓储页（M-4），排期归集成协调 |
| IMP-2 | 应用内 Web 浏览接线（BOOTH）：渲染层消费既有 `RemoteContentApiV1`＋Main 基座；`desktop.remoteBrowser` 能力判定翻转与旧 provider 兜底标注（M-3）；导航/权限/下载/外部打开交互与隔离声明呈现；**下载主机域真机验证→逐域清单提案** | 桌面 | 核心（contracts/capability 面）、集成（安全验收） | 依赖裁决 2①②③；硬边界＝desktop 架构「远程内容隔离」节逐条适用；未验证域一律拒绝（诚实失败） |
| IMP-3 | 云端下载→仓储条目落库路径（`downloaded_material`）：契约先行——数据角色裁决复用/扩展面，冻结硬前置（Schema＋正负例向量＋消费测试＋桌面 TS 登记＋双语协议＋REGISTRY）后再实现 | 数据 | 核心、桌面 | 依赖 IMP-2 可用＋裁决 3；风险＝平行第三条路（禁止：只准走 bdl-commands 族或其升版，014 仲裁第 1 条同精神） |
| IMP-4 | 本地导入呈现收口并整合进导入页：复用 `warehouse.import` v0.3 与既有 W18 提交流（拾取→确认列表→单命令→任务中心），不新增路径 | 桌面 | 数据 | 协议与实现已在 main（v0.3 冻结＋df32c8c）；可与 IMP-1 同批，协议零新增 |
| IMP-5 | 验收与文档同步：隔离冒烟（Session 隔离/权限拒绝/允许清单拒绝路径/下载接管/外部协议）、诚实空态与能力判定核验；product-boundary／outline M6 分解表／design-standard／desktop 架构行更新 | 桌面（文档）＋集成（验收） | 数据、核心 | 证据纪律：无真机证据不宣称端到端；M-1 文档修正随本包落账 |

排期注记：W25 真机窗口与 M5 门验收（W26）在即——建议 IMP 批在 M5 关门后全量启动，IMP-1 设计草稿可先行；是否提前由用户/操作者排期裁量。IMP-3 的契约裁决（数据）与 IMP-1 设计可与 M5 收尾并行，不占门序。

---

## 审阅者结语

本需求不是新边界，而是把已接受的产品组成（原生素材浏览、授权下载）与已接受的设计方向（连续素材获取路径、两条进入路径同一模型）补齐为用户可见的页面。真正的新决定只有两个半边：Web 浏览的范围（安全/产品边界，须用户裁）与下载落库的契约面（数据域裁）。其余均为接线与呈现工作，且底座（隔离基座、下载链、warehouse.import）全部在位并经验收——这正是「建议增设（有条件）」的依据。裁决前，任何角色不得以「用户提了」为由先行实现（BOARD A3 行「先登记为待定项」纪律与本审阅一致）。
