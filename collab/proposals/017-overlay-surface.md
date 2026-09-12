---
proposal: "017"
title: 桌面 Overlay Surface 设计稿（报告/快照/只读服务——M7 可前置，BG-2）
status: 提出
author: wt-2（核心）
date: 2026-09-10
---

## 背景与范围锚

- outline M7 分解表行：「报告、快照与只读服务（桌面 Overlay Surface）｜核心｜
  桌面」；BOARD 工单 **BG-2**（M7 可前置）。**方向性设计稿——仅方向不冻结**
  （工单验收标准原文）；跨域接口留提案待桌面表态。
- 边界锚（本节为设计公理，出处均为已接受权威）：
  1. 「Desktop and VR overlays consume stable application services and never
     become business-logic hosts」（AGENTS 架构约束）——overlay 只消费稳定
     应用服务；任何业务判定留在服务权威侧；
  2. 「桌面 Overlay 收尾（只消费稳定快照与语义动作）」（M7 分解表桌面行）——
     消费形态两分：**稳定快照**（只读投影）＋**语义动作**（经既有命令面）；
  3. 「桌面 Overlay 故障不阻断桌面主线」（M7 门交付定义）——服务面无状态、
     只读，overlay 会话故障不可能持有服务端状态或写者；
  4. VR Dashboard/VR Overlay 不进入 M7 与 `1.0.0`（用户裁决 2026-09-06）——
     本设计不假设 VR 传输；v1.1 方向锚点另行。

## 设计方向（草案）

### 1. 事实面零新增：Overlay 消费既有冻结读面

Overlay Surface **不新增事实源、不新增协议词表**。overlay 一屏所需的全部
事实已由既有冻结读面服务：production-use-case v0.2（plan/record 读面）、
bdl-queries v0.4（catalog/warehouse/downloads 读面）、project-inspection
v0.1（project 读面）、application 契约（task 面）。设计原则＝**投影而非
聚合发明**：overlay 读模型对权威载荷做字段裁剪与排序（呈现投影），不做
跨源推导——跨源推导属业务逻辑，归服务权威侧（若未来确需，走正式提案）。

### 2. 骨架（本批落地，crates/orchestrator/src/overlay_surface.rs）

- `OverlayReadModel` trait：只读投影端口（`Send + Sync`、无 `mut` 方法——
  只读边界由类型系统承载）；
- `StoreOverlayReadModel`：首个具体实现——durable 任务存储的
  **任务卡投影**（taskId/state/correlationId，排序 oldest first；
  `TaskSnapshot` 的诚实子集：revision/cancel 簿记不进 overlay 面——那些
  属于主线 surface）；
- 空态即终态：无任务＝空集（不是错误）；纯函数纪律：两次查询无变更则
  观察相同（overlay 轮询永不改变它观察到的东西）；
- 测试 2 项（空态＋只读纪律）。**不接 wire 面**——overlay 传输/连接/
  订阅机制属跨域接口，见 §4。

### 3. 语义动作原则（方向声明，不在本批实现）

overlay 允许的「语义动作」＝**经既有命令面的受控动作**（例：任务取消走
`task.requestCancellation`）——不新增 overlay 专有写词表。动作权限、守卫、
审计全部留在既有服务权威侧；overlay 提交的动作与桌面主线同一受理路径、
同一九态纪律。任何「overlay 专属动作」需求出现即触发提案重议。

### 4. 跨域接口（留待桌面表态，本稿不定义）

- **传输/连接面**：overlay 与 Gateway 的连接形态（独立连接实例即可满足
  故障隔离——Gateway 无状态先例；是否需要订阅/推送语义＝桌面域决定）；
- **overlay 会话身份**：是否需要 overlay 会话在应用契约面的身份表达；
- **呈现投影清单**：overlay 一屏究竟渲染哪些卡（任务/生产/检测的取舍与
  排布）＝桌面域信息架构（与 BG-3 Inspection/Release 页面对账不越界）。
  核心在投影类型上随桌面清单演进（字段裁剪，非新事实）。

### 5. 与既有证据族的关系

Overlay Surface 是**消费侧投影**，不是第四证据族：不产文档、不进 AMF
持久域、不进 BDL、无 Schema 词表（投影类型随冻结读面载荷演进）。016
inspection-evidence 冻结后，其读面（inspection-queries v0.1，已仲裁词表
行）自然成为 overlay 检查报告卡的又一投影来源——引用不复制。

## 表态/协作请求

- **桌面**：§4 三项（传输面/会话身份/投影清单）——本提案范围内表态或
  另出信息架构稿均可；表态前核心不接 wire 面（骨架停留在服务侧投影）；
- **集成**：BG-2 验收口径确认（设计稿方向性＋骨架 workspace 绿已满足；
  本批不申请冻结、不登记 REGISTRY）。

## 冻结硬前置清单

本提案**不冻结任何面**。Overlay Surface 的冻结（若未来需要）硬前置＝
§4 三项桌面表态齐＋跨域接口提案（传输面词表/连接语义）受理＋消费测试＋
双语协议本。当前全部未发生。

## 表态（桌面，2026-09-10——§4 三项）

### 1. 传输/连接面：同进程 preload 窄面复用，零新增连接语义

- **连接形态**：桌面 overlay = 同一 Electron 进程内的独立 BrowserWindow
  （游戏时置顶），与主窗口共用同一 VuaDesktopApiV1 preload 契约面——
  **不需要独立 Gateway 连接实例**：Gateway/Provider 本就是独立受监督进程
  （故障隔离双保险的第一层），overlay 窗口渲染进程崩溃由 Electron 进程
  模型天然隔离（第二层），不波及主线窗口与服务面；
- **事件获取**：application events 的广播路径（broadcastGatewayEvent）
  按 isAllowedLocalSender 投递**全部本地来源窗口**——overlay 窗口天然
  在列，任务/生产事件零新增即达；**快照查询按需轮询**（overlay 显影时
  拉取读面，不常驻订阅）——纯函数纪律（017 §2）与轮询天然契合；
- **不引入订阅/推送新语义**：既有广播＋按需轮询已覆盖 overlay 一屏
  所需；新增推送词表违反「事实面零新增」。VR 传输不假设（2026-09-06
  用户裁决），v1.1 另议。

### 2. overlay 会话身份：不引入

- 同进程窗口模型下，身份即「本地来源窗口」（isAllowedLocalSender 已把守
  事件与 IPC 两面）；overlay 提交的动作走既有命令面（同一受理路径/同一
  九态纪律/同一审计 correlationId），服务端**无需区分**动作来自主线窗口
  还是 overlay 窗口——同一用户同一意图；
- 新增 overlay 会话身份＝新增契约面表达，违反事实面零新增；**若未来
  VR/跨进程 overlay 出现（v1.1+），身份表达随该提案重议**——本表态
  不预设其形态。

### 3. 呈现投影清单（信息架构，桌面域；核心随清单演进字段裁剪）

| 卡 | 内容（投影来源） | 呈现策略 |
| --- | --- | --- |
| 任务卡（常驻主卡） | 运行中/近期任务：taskId/state/correlationId（OverlayReadModel 任务卡投影，017 §2 已落） | 恒显；空任务＝诚实空态（017 §2 空态即终态） |
| 生产状态卡 | 当前 plan 摘要/最近 Build Record 状态（production-use-case v0.2 plan/record 读面投影） | 生产会话相关时呈现 |
| 下载/导入进度卡 | 下载事件/warehouse 任务投影（bdl-queries v0.4 downloads.listCompleted＋任务面） | 有进行中项时呈现 |
| 检测/来源卡 | project-inspection 投影 | **不进 overlay 首屏**（低频信息，BG-3 Inspection/Release 页面承载——017 §5 引用不复制） |

- 排布：单列纵向卡堆，最新活动优先；投影=字段裁剪与排序，不跨源推导
  （017 §1 原则照录）；
- 初版收窄：批一仅任务卡（OverlayReadModel 已落骨架）＋生产状态卡；
  下载/检测卡随消费批演进（核心字段裁剪随清单，非新事实）。

### 实现面备注（桌面域内，随 M7 排期）

overlay 窗口创建/置顶/显隐（Electron BrowserWindow＋alwaysOnTop）与
overlay 入口（DevScenario 之外的正式入口形态）＝桌面域实现切片；VR
Dashboard/VR Overlay 不进 M7 与 1.0.0（用户裁决维持）。

——以上三项为桌面域表态；核心可在本表态基础上接 wire 面（§4 前置已清）。

## 表态（核心，2026-09-12——wire 面领取声明）

- **领取**：overlay wire 面批 1＝核心下一刀（本工作时段仅余数分钟不开实现，
  下一工作时段开工，避免半途切片）。范围＝①`OverlayReadModel` 增补生产
  状态卡投影（plan 摘要/最近 Build Record 状态，字段裁剪自
  production-use-case v0.2 读面，「当前/最近」语义在核心服务权威侧定义，
  不跨源推导）；②overlay 读面 wire 暴露（provider-host 投影为轮询查询
  方法，对齐桌面表态 1「按需轮询」与表态 2「零会话身份」）；③TS 面
  （packages/contracts 增量）＋消费测试；④契约增量走 application-contract
  「版本与演进」条款（#22/020 先例：增量登记＋修订记录＋向后兼容声明），
  Schema＋正负例向量＋至少一端消费测试齐备方冻结。
- **勘误**：wt-2 上轮「overlay 投影批 2 等桌面消费」表述收窄——批 2
  （下载/检测卡）维持等消费不变；批 1（任务卡＋生产状态卡＋wire 暴露）
  由核心自领，桌面无需再等（017 §4 前置已清为领取依据，wt-3 状态两处
  点名等核心 wire 面是本领取的直接触发）。
- **对桌面**：批 1 交付前你方可先行桌面域内工作（窗口创建/置顶/显隐，
  017 表态「实现面备注」节）；wire 方法词表以核心冻结批为准，不预接。

## 批 1 交付（核心，2026-09-12——冻结声明）

**overlay wire 面批 1 已随本批交付并冻结**（应用契约「版本与演进」条款
内的向后兼容增量，#22/020 先例：协议本双语修订记录＋方法面登记，既有面
零变化；`overlay.getSnapshot` 版本随契约 0.1）。逐项兑现领取声明四范围：

1. **生产状态卡投影**（`crates/orchestrator/src/overlay_surface.rs`）：
   `OverlayReadModel` 新增 `production_card()`；`OverlayProductionCard`
   ＝当前 plan 摘要（planId/planStatus/createdAt/recipeId）＋最近 Build
   Record 摘要（buildId/planId/status/finishedAt，与 `record.list` 冻结
   条目同形）。**「当前/最近」语义在核心服务权威侧定义**：createdAt／
   finishedAt 字典序最大（RFC 3339 UTC 同形时间戳字典序＝时间序，与任务
   存储 created_at 排序同一依据）；两半独立可空＝诚实空态，绝不合成行；
   读失败类型化传播，绝不折叠为空。纯函数纪律兑现：投影不带查询时刻与
   聚合 revision（发明即跨源新事实，且破坏「两次查询无变更观察相同」）。
2. **wire 暴露**（`crates/provider-host`）：`overlay.getSnapshot` 轮询
   查询，params 闭集为空；对齐桌面表态 1「按需轮询」（快照查询，无订阅/
   推送新语义）与表态 2「零会话身份」（查询面与主线不可区分）。生产读
   面未接线＝类型化 `vua.overlay.unavailable` 诚实缺席（production.*／
   record.* 同一纪律）；capability 表登记 `overlay.snapshot` 行（可用性
   同 production.recipes 源）。
3. **TS 面＋消费测试**（`packages/contracts`）：`OverlaySnapshotResultV01`
   等六类型＋`isApplicationRequestV01` 守卫分支＋4 消费测试
   （`application-contract.test.ts`）。
4. **契约增量**（`schemas/application-contract/v0.1/overlay-snapshot.schema.json`
   ＋六向量 3 正 3 负；协议本双语「Overlay 读面语义」节＋方法面行＋修订
   记录；REGISTRY 行更新）。**Schema＋正负例向量＋至少一端消费测试齐备
   ——冻结条件满足**。

消费测试链：provider-host `overlay_wire` 帧环 5 测试（向量驱动 schema 校
验＋诚实空态＋ populated 投影与纯函数两次查询一致＋unavailable＋闭集拒
绝）＋orchestrator `overlay_surface` 单元 6 测试（投影语义＋空态＋两半独
立＋只读纪律）。批 2（下载/检测卡）维持等消费不变。
