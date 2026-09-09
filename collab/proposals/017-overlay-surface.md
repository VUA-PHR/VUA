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
