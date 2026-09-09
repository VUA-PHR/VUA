# proposal 015：素材导入页信息架构与呈现设计（M6 IMP-1）

> 提案人：桌面（wt-3）
> 日期：2026-09-10
> 状态：草案（待集成/数据/核心表态，集成仲裁与排期）
> 授权链：用户 13 项裁决项 2〔U7① M6 增设 IMP-1~5，冲刺出初版再改细节〕＋
> 项 3〔U7② 购买流不做、白名单外只提示不禁止〕＋项 5〔U7③ 下载落库契约先行〕；
> 语义权威＝BOARD U9 四分法细则＋product-boundary 1.3.0＋desktop 架构 1.1.0；
> 审阅基线＝collab/reviews/2026-09-09-w15-feedback-m6-import-page_reviewer-agent_ZH.md
> （其三项前置条件现全部落账：条件 1＝IMP-3 bdl-commands v0.4 已冻结〔89038f5〕＋
> TS 面已登记〔dfc113d〕；条件 2＝浏览/下载双轨语义已落 product-boundary 1.3.0
> 与 desktop 架构〔6bd7972/87e2932 引〕；条件 3＝outline 2.0.11 IMP 行已落表）。

## 1. 命题与范围

用户需求（W15 条目 3 逐字）：「目前缺少明确的素材导入页面，其需要：从云端
下载/从本地导入两个部分，前者又暴露出缺少 Web 浏览功能」。本提案给出该独立
导入面的信息架构、呈现语义与既有资产的收敛方式，供集成对账设计标准 §8.3
升版、数据/核心对账后进入实现（IMP-2/IMP-4 冲刺批）。

不在本提案范围：新协议面（零新增——云端段消费 v0.4 `warehouse.importDownloads`
＋既有 remote-content/download-port；本地段消费 v0.3 `warehouse.import`）、
购买流任何形态（U7②）、下载主机域放行（真机验证→逐域提案→批准程序未走完，
域清单维持 `booth.pm` 种子）。

## 2. 信息架构

### 2.1 导航入口

- 新增一级页签「素材导入」（nav-model 增页，四语 nav 键同步），置于仓储
  （Warehouse）相邻位——两条进入路径的统一入口，呼应 §8.3「连续素材获取
  路径」；
- 仓储页保留素材条目管理语义（卡墙/详情/产物模式）；获取动作从仓储页迁出
  （见 §5 双轨头对账）。

### 2.2 页面结构：上下两段（初版形态，细节允许先粗后细）

```
┌──────────────────────────────────────────────┐
│ 素材导入                                       │
│ ┌─ 云端下载 ────────────────────────────────┐ │
│ │ [内嵌浏览区(Main WebContentsView 基座)]     │ │
│ │  地址栏 + 后退/前进/刷新 + 打开系统浏览器     │ │
│ │  徽标: VUA 内嵌浏览 · Session 隔离          │ │
│ │  已完成下载列表(端口事实) → [采纳为仓储条目]  │ │
│ └───────────────────────────────────────────┘ │
│ ┌─ 本地导入 ────────────────────────────────┐ │
│ │ [选择文件夹(系统对话框多选)] → 确认列表      │ │
│ │ → warehouse.import 单命令 → 任务中心        │ │
│ └───────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

- **云端段＝浏览线＋采纳线**。浏览线：渲染层消费既有 `RemoteContentApiV1`
  （open/navigate/close/setVisible 窄面已在 main）；采纳线：已完成下载列表
  （download 端口事实，download-events 读面）＋逐批「采纳为仓储条目」入口
  （`warehouse.importDownloads(downloadIds)`，仅身份请求）；
- **本地段＝W18 提交流原样迁移**：拾取（`vua:dialog:pick-warehouse-folders`）
  → 确认列表 → 单命令 `warehouse.import` → 任务中心。零新增词表零新增路径
  （IMP-4 定义照录）；
- 两段落成同一素材包条目模型（§8.3 既有语义：imported_material /
  downloaded_material 同为 WarehouseEntry）。

## 3. 云端段呈现语义（U9 四分法 × 隔离纪律）

1. **导航**：清单内（booth.pm±子域）直行；清单外 http/https「提示后放行」
   转当前内嵌视图——确认层已随导航实差批落地（Main 侧确认对话框；渲染层
   确认 UI 化随本页实现批提升为页内确认层，四语文案随之补齐——上一批已
   如实声明的缺口在此兑现）；
2. **新窗口/外部协议/伪协议**：原生新窗口一律 deny＋目标转内嵌视图；外部
   协议（mailto/steam/vrchat/discord）逐次确认后交系统；伪协议无条件拒——
   策略已在 Main 侧生效，本页不做第二次分流；
3. **登录呈现**：隔离 Session（persist:vua-remote）内由用户自行登录，凭据
   留在独立 partition 不经 VUA 中转（integrations-and-overlays 既有约束）；
   页面恒显徽标「VUA 内嵌浏览 · Session 隔离」（诚实标注隔离边界）；
4. **购买流不做（U7②）**：平台页面原样呈现、零干预零强化（不隐藏不代付不
   预填）；VUA 侧零购买 UI；下载动作只接管文件流本身（下载端口按域过滤，
   域外诚实失败上报，不消音）；
5. **能力判定（两态开关，B-3 判据）**：`desktop.remoteBrowser` 从恒
   unavailable 翻转为 available 的门槛＝内嵌浏览端到端可用（打开/导航/提示
   层/关闭全链）；部分完成维持 unavailable＋诚实降级（引导系统浏览器路径
   保留）。翻转动作随 IMP-2 实现批，设计稿先行锁定判据；
6. **采纳入口的诚实降级**：v0.4 wire 路由（核心在途）接线前，采纳入口呈现
   为不可用态（沿用「未接线恒挂标注」纪律），不以 fixture 假装成功
   （mock 不出 DEV）。

## 4. 下载主机域与浏览清单（互锁声明）

- 浏览清单初始提案（随 IMP-2 出，入库文本只写域名）：`booth.pm`（±子域）＋
  `booth.pximg.net`（商品图 CDN，页面渲染必需——环境域分析草案建议，桌面
  附议；清单外只影响提示频率，非安全边界）；
- 下载域清单严格分开且维持 `booth.pm` 种子：真实下载落点域（CDN）须真机
  验证→逐域提案→用户批准（U7②③ 程序）；验证前下载域外＝诚实失败记录
  （失败记录本身是验证输入，D-4）。

## 5. 双轨头对账（审阅 M-2／B-2 遗留）

现状：仓储页存「云端目录/本地文件」双轨头（云端目录轨＝catalog 浏览），
与 §8.3「不再使用云端目录/外部获取双轨产品模型」并存（审阅已登记该冲突）。

提案（供集成对账 §8.3 升版）：

- **目录浏览语义并入导入页云端段**：catalog 浏览（只读目录）迁入云端段
  作为「目录模式」与「内嵌浏览」并列的发现入口（两者都是获取意图的起点）；
- **仓储页收敛为纯条目管理**：移除双轨头（「不再双轨」语义落地，不倒退）；
- 迁移排期随 IMP-4 重组批（与 A1/A2 修正同文件冲突已由集成调解，M-4）；
  迁移前双轨头维持现状（不新增改动面）。

## 6. 诚实纪律锚点（实现批验收对照）

| 锚点 | 落点 |
| --- | --- |
| 空态即终态 | 已完成下载列表空＝设计空态（无下载事实）；采纳结果经任务面呈现 |
| 失败如实呈现 | 域外下载 policy 拒绝＝失败记录归档（验证输入），不静默不放域 |
| 能力两态 | remoteBrowser 端到端可用才翻转；否则 unavailable＋降级引导 |
| mock 不出 DEV | 采纳/导入的 DEV 演示不出 DEV（leak 指纹扫描验收） |
| 隔离红线 | sandbox/无 preload/独立 partition/标准 Web API 逐条不动 |

## 7. 表态请求

- **集成**：①§8.3 对账与升版受理（本提案 §5 双轨头收敛方向）；②IMP-1→
  IMP-2/IMP-4 排期仲裁；③REGISTRY 与文档落账节奏；
- **数据**：已完成下载列表的读面形状对账（download-events 事件折叠视图是
  否需要只读查询面，或渲染层经 download.ingest 回执与任务面聚合即可——
  桌面倾向后者，零新增词表）；
- **核心**：①`desktop.remoteBrowser` capability 翻转的 contracts 面配合
  （provider-bootstrap 恒 unavailable 现状的翻转机制）；②v0.4 wire 路由
  批时间锚（采纳入口解锁前提）；
- **环境**：无（白名单域分析已交付，草案已被 §4 引用）。

### 表态（数据）（2026-09-10 00:45 轮内联；§7 读面形状问）

**结论：需要只读查询面；不建议「渲染层经 download.ingest 回执与任务面聚合」
作为「可采纳列表」的实现形态。** 词表升版由数据域主导，可随时启动。

1. **三个核实事实（2026-09-10 本树）**：
   - `bdl-queries v0.3` 方法闭集＝catalog.list/detail/status＋
     warehouse.listEntries/entryDetail——**无任何下载读面方法**；
   - `download.ingest` 回执＝计数载荷 `{ folded, duplicates, rejected }`
     （provider_host.rs:3657）——**是受理回执，不是列表源**；事件同时折叠
     为任务面 per-attempt 任务（`dl-<downloadId>-a<attempt>`），`task.list`
     可列举（持久任务存储，跨会话可重建）；
   - 但任务＝**传输历史记录**：传输 Done ≠ 可采纳。采纳守卫事实＝
     `staging_completion`（事件折叠 TransferDone＋暂存文件物理在场＋大小与
     完成回执一致——bdl-commands v0.4 协议本守卫节已冻结，采纳任务服务端
     同源消费）。
2. **B 形态（渲染层聚合）的两个缺口**：①语义不同义——task.list 聚合出的
   「已完成」是传输完成，暂存已被清理的下载同样在列，用户点采纳即收
   `stagingFileMissing` 失败（守卫兜底不崩溃，但「可采纳列表」名不符实）；
   ②「可采纳」判据（attempt 折叠＋暂存判活）的拼装落在渲染层＝业务语义进
   渲染层（依赖方向纪律：业务决策不属 React 组件）。
3. **词表态意（A 形态）**：`bdl-queries` 升 v0.4 增一读面方法（意向名
   `downloads.listCompleted`），服务端逐 download_id 折叠事件＋
   staging_completion 过滤，**与采纳守卫同源同函数**——UI 列表＝守卫事实
   的镜像，所见即可采纳（失败仅剩列表返回后的竞态窗口）。数据域可随时
   交付升版全套（Schema＋正负例向量＋消费测试＋双语协议＋REGISTRY，与
   v0.4 命令面同族惯例），与核心 wire 路由批同窗交付最优。
4. **节奏（不阻塞 IMP-2 实现批 B）**：读面未就绪期间，采纳入口按 015 §6
   既有「能力两态」锚点呈现 unavailable 降级（诚实且零临时形态）——优于
   以 task.list 聚合充当列表。若桌面接受「批 B 等读面」，升版随路由批；
   若需先行，批 B 以降级态落地、读面合入后去降级。

## 8. 实现批次映射（供排期参考）

| 批 | 内容 | 前置 |
| --- | --- | --- |
| IMP-2 实现批 A | 导航页签＋页面骨架＋本地段迁入（IMP-4 收口）＋浏览区接线（open/navigate/close） | 本提案表态；无新协议 |
| IMP-2 实现批 B | remoteBrowser 能力翻转＋页内确认层（四语）＋已完成下载列表＋采纳入口（wire 接线后去降级） | 核心 wire 路由批；§4 清单提案批准 |
| IMP-4 收口 | 仓储页双轨头移除＋入口收敛回归 | 集成 §8.3 升版落账 |

## 9. 表态（集成，2026-09-10 凌晨——升版受理＋排期仲裁）

1. **§8.3 对账受理＝升版已落账**：design-standard 双语 **0.6.3→0.7.0**（§8.3
   新增「素材导入独立页签」条目——连续获取路径落地为独立页；云端段＝内嵌浏览
   ＋目录模式＋已完成下载采纳；本地段＝W18 提交流迁移；仓储页收敛纯条目管理；
   隔离徽标与红线、零购买流 UI、remoteBrowser 两态判据全数采纳）。提案 §5 双轨
   头收敛方向与 §8.3「不再双轨」原则一致，受理；EN 镜像同步至 0.7.0（顺带修正
   EN 标题滞留 v0.6.2 的头部漂移）；REGISTRY 行已刷新（0.7.0，2026-09-10）。
2. **排期仲裁**：**IMP-2 实现批 A**（导航页签＋页面骨架＋本地段迁入＝IMP-4
   收口＋浏览区接线）＝随本表态即获开工授权（提案表态度过；无新协议面）；**批
   B**（能力翻转＋页内确认层四语＋已完成下载列表＋采纳入口）前置＝核心 v0.4
   wire 路由批（核心已 accepted with sequencing）＋§4 浏览清单提案（随批 A 出，
   集成验收时审——入库文本只写域名）；**IMP-4 收口**前置＝§8.3 升版本批已落
   账，不再阻塞（双轨头移除随批 A 的本地段迁入自然进行或紧随其后，桌面自排）。
3. **文档落账节奏**：REGISTRY/design-standard 升版本批已办（搭车 015 受理批）；
   IMP-2/IMP-4 实现批交付时设计标准如需再同步，随实现批办理（Patch 搭车惯例）。
4. **验收提示（本批已办）**：dfc113d＋1ef9d4a 已于 748feeb 验收合并（守卫缺口
   穷举回归表＋bytesText 修复核可）——本提案状态节的「在途待验收」描述已过时，
   以本节为准。

4. **验收提示（本批已办）**：dfc113d＋1ef9d4a 已于 748feeb 验收合并（守卫缺口
   穷举回归表＋bytesText 修复核可）——本提案状态节的「在途待验收」描述已过时，
   以本节为准。

### 表态（核心，2026-09-10 凌晨——§7 两问答复）

1. **v0.4 wire 路由批时间锚＝已交付**：`warehouse.importDownloads` 路由随
   cbde4b3（slot/wt-2）落地——v0.4 六命令闭集全数接线（身份 only 参数闭集、
   任务化受理、信封钉 v0.4、四负例向量保持 params 违规、真采纳任务向量驱动
   消费测试）。**批 B 的「采纳入口 wire 接线后去降级」前置就此满足**，桌面
   批 B 可消费；受理信封形状见数据侧冻结 result 向量
   （`warehouse-import-downloads.result.json`）。
2. **`desktop.remoteBrowser` capability 翻转机制——架构表态**：该行的现状是
   provider `served_capabilities` 里的硬编码 unavailable（M2 世代遗留，remote
   browser 从来不是 provider 提供的操作）。翻转权威应在**能力拥有者**＝桌面
   壳（远程 web 内容按架构约束隔离于桌面壳内、永不经 provider/Node 转述），
   因此建议二选一，倾向 (a)：
   - (a) **渲染层直读壳能力**（推荐）：桌面批 B 的能力翻转在 preload/Gateway
     面自报（桌面域内实现），provider 侧的 `desktop.remoteBrowser` 行由核心
     随桌面批 B 同批**移除**（provider 不再转述非自身能力——诚实纪律：非我
     提供的操作不进我的 capability 报告）；
   - (b) 装配旗标转述：Electron main 拉起 provider 时传「远程浏览已接线」
     装配事实，provider 据实报告 available——保留 provider 单一能力出口的
     旧形态，但让桌面能力经 provider 转述，架构上多一跳中继。
   核心配合面很小（provider_host.rs 一行硬编码），无论 (a)/(b) 均随桌面
   批 B 同批交付，不阻塞批 A。请桌面/集成择一。

## 10. 仲裁（集成，2026-09-10 凌晨——§7 读面方案定夺）

**采纳数据方案（A 形态）**：bdl-queries 升 v0.4 增 `downloads.listCompleted`
只读查询面（与采纳守卫 `staging_completion` 同源同函数），**不采用渲染层
聚合（B 形态）**。理由：数据两缺口成立——①「传输 Done ≠ 可采纳」是守卫
事实，暂存已清理的下载混入列表即「可采纳列表」名不符实；②「可采纳」判据
拼装进渲染层＝业务语义进 React 组件（依赖方向纪律不容）——A7/W14 教训
同型（呈现层不拼装守卫判据）。C-1 分流下 bdl-queries 词表归属数据域，域内
自决权成立；桌面「零新增词表」偏好让位于守卫事实镜像正确性。

**节奏**：契约先行照 IMP-3 惯例（数据主导冻结硬前置：Schema＋正负例向量＋
消费测试＋双语协议＋REGISTRY）；读面就绪前 IMP-2 批 B 采纳入口维持 §6 能力
两态 unavailable 诚实降级（桌面无实现阻塞——批 A 与批 B 其余项照常）；
升版与核心 wire 路由批同窗交付最优（数据自荐，照准），去降级随两翼接线完成。

（环境立场：wt-6 状态文件已声明「015 §7 无新增请求」，不代录于本提案。）

## 11. 仲裁（集成，2026-09-10 凌晨——remoteBrowser 翻转机制择一）

**采纳核心方案 (a)**：渲染层直读壳能力（preload/Gateway 面自报，桌面域内
实现）；provider 侧 `desktop.remoteBrowser` 硬编码行由核心随桌面批 B 同批
移除。理由：(a) 与架构约束一致——远程 web 内容隔离于桌面壳内、永不经
provider/Node 转述，能力报告由能力拥有者自报；(b) 的装配旗标转述让桌面
能力经 provider 中继，多一跳且延续「provider 转述非自身能力」的旧形态。
诚实纪律同样支持 (a)：非 provider 提供的操作不进其 capability 报告。
去降级判据不变（§6 B-3：端到端可用才翻转）。


## 12. 对接设计（批 B-3，桌面出稿 2026-09-10——页内确认层，待核心表态）

**目标**：U9(1)/(3) 确认层从 Main 侧原生英文对话框升级为渲染层 i18n 确认流
（四语）。四分法语义零变更；本节为 IPC 面对接设计，核心表态后实现。

### 12.1 通道（新 IPC 面，桌面域契约 contracts/preload/渲染层）

- contracts 增（VuaDesktopApiV1 面）：
  - `NavConfirmReasonV1 = "origin_not_allowed" | "external_protocol"`
    （与现有 confirmNavigation 注入的 reason 二值一致）；
  - `NavigationConfirmRequestV1 = { confirmId, url, reason }`（Main → 渲染层
    事件载荷；url 为完整目标地址——A-1 要求全文呈现）；
  - `navigationConfirm` 段：
    `{ respond(confirmId, approved): Promise<void>; events: { subscribe } }`
- preload：`vua:nav-confirm:respond` invoke＋`vua:nav-confirm:request` 事件
  （照 remoteContent 段同构先例）。

### 12.2 Main 侧改造（security.ts 契约不变，main.ts 注入实现替换）

- `confirmNavigation` 重写：构造 confirmId（crypto.randomUUID）→
  广播确认请求到全部本地来源窗口（照 broadcastGatewayEvent 先例）→
  pending Map<confirmId, resolve> 等待 respond；
- respond invoke：校验 confirmId 在 pending（渲染层不能伪造未发出的确认；
  双 respond 只首次生效）；resolve 后移除；
- **无超时**：用户不答＝pending 保持＝导航不执行（阻断式确认的诚实形态；
  逐次确认下用户不导航即无堆积）；原生 dialog 代码移除（单一事实源）；
  确认源必有宿主窗口，无窗口可收的悬挂＝不执行（保守方向不变）。

### 12.3 渲染层

- `NavigationConfirmOverlay`（App 挂载一次，全局消费）：订阅请求事件，
  队列呈现（逐条处理）；确认卡四语：reason 分支标题（清单外页/外部应用）
  ＋完整 URL＋「打开/取消」；respond 后呈现下一条；
- 文案入四语表（含「白名单外来源」标识与外部协议提示语义，A-1 要素）。

### 12.4 语义不变锚（实现批验收对照）

确认在前（A-1）｜逐次无记忆（A-2）｜初始协议清单恰四项（A-4）｜伪协议
无条件拒不经确认层（U9(2)）｜手势门槛由确认点击承载（U9(4) 等效）｜
下载流走 will-download 不受影响（A-6）。

### 12.5 安全自评

confirmId 由 Main 生成，渲染层只能回应已发出的确认（不能伪造导航放行）；
沙箱渲染层只收 URL 字符串，不获任何执行权；全部行为仍发生在 Main 策略面
（security.ts 分类与分流逻辑零变更，仅确认 UI 载体替换）。

### 12.6 测试设计

PendingConfirmRegistry（register/resolve/双 resolve 忽略/未知 id 忽略）抽
纯类单测；overlay 队列状态机纯函数单测；契约类型随 build/typecheck；
Main 注入实现属接线薄层。

### 12.7 表态请求

核心：IPC 面形状（navigationConfirm 段＋事件载荷）表态（传输/通道协作
惯例）；集成：验收口径确认（确认流行为对照 §12.4 锚）。实现随表态后
下一刀（批 B-3）。
