---
proposal: 026
title: "包管理 P3 写面＋项目兼容并入包管理器（用户 2026-09-18 裁决转述）"
status: 提出
author: wt-main（集成，用户裁决转述）
date: 2026-09-18
---

# 提案 026：包管理 P3 写面＋项目兼容并入包管理器

## 背景

### 用户裁决（权威源，2026-09-18 晚，原文照录）

> 包管理器要做写面，现有的项目兼容选项卡没有必要再单独存在，并入包管理器
> 选项卡，UI做易用性调整。写一份报告给协作机制让它们今晚做。

本提案＝该裁决的协作机制登记面，同时是 BOARD「待用户裁决」**U12（包管理
器写入口优先级）** 的用户答复落账：用户选择把写入口提为优先指令，U12 随
本提案登记关闭。「让它们今晚做」＝各域表态与可开工面今晚工作时段领取。

### 事实基线（提出前集成核实，file:line 锚全部本机直读）

**读面已闭环在库（024/025 链，零剩余）**：

- P1：`packages.listInstalled`（024 链，2026-09-17 02:1x 集成验收
  9abe1ea）。
- P2：`packages.listRepos`＋`packages.packageCatalog`（025 链五环
  2026-09-17 03:4x–05:1x 第 74–76 批；v0.2 增量 `cacheSourced` 第
  77–79 批）。
- 真机证据（诚实纪律 5 在案）：2026-09-17 12:0x 操作者 CDP 取证
  `packages.listInstalled` 对用户真实项目 Chiffon 返回 6 个真实包；
  2026-09-18 05:2x CDP 复验 ready-p2 解锁、四真实仓库
  （bd_／lilxyzw／RED_SIM／vrcd@VPM）「已缓存」在列（BOARD #36 行）。

**写面缺口＝纯 wire/契约面缺席，引擎实现已在库**：

- wire 词表零 packages 写方法；冻结注释明示「写面（启停/增删/刷新）归
  013 R5 逐面独立提案不在此族」（packages/contracts/src/
  application-contract.ts:583-584）。
- 端口写方法族全部在库（crates/orchestrator/src/vpm_backend.rs:214-332，
  核心域）：`preview_install`/`apply_install`（双摘要守卫
  ORC-WF-003/004，:235-243）＋`preview_remove`/`apply_remove`
  （:253-270）＋`register_local_package`（:244-248）＋`create_project`
  （:324-331）。
- 环境域实现已在库：VrcGetLibBackend 写面能力位全 true
  （crates/project-manager/src/vpm_backend.rs:300-308）＋真实实现
  （preview_remove :351 起、apply_remove :390 起、preview_install :528
  起）；VccCliBackend 仅 create_project。
- 桌面 live 端口仅 ready-p1/ready-p2 两变体，`changes` 类型级恒 false
  「一切写入口不渲染」（apps/desktop/src/renderer/gateway/
  packages-port.ts:209-210/:238）；完整 IA（变更预览/确认链）仅 DEV
  fixture 可达，生产面不可达。

**项目兼容页缺口（024/025 不含的独立事实面）**：

- 读面五命令已通（environmentManagers／inspectProject／lockStatus／
  setNote／importCopy，013/014/020/021 链）。
- 缺口①：写操作交接静态卡自认「交接的具体交互形态（外部拉起等）待规格
  确认，本批不实现」（apps/desktop/src/renderer/features/packages/
  ProjectCompatPage.tsx:44-45）。
- 缺口②：副本导入源路径手输文本，文案自认「项目检测读面接线后，将从在
  册项目列表选择；当前请粘贴项目文件夹路径」（i18n strings.zh-CN.ts
  :1429）——而 `project.listProjects` 在包管理器页 P1 消费面已在用，
  同页复用零新词表。
- 缺口③：死文案 detectionNotWired（:1383）／detectionItemsTitle
  （:1400）／detectionItems（:1401）／importNotWired（:1456）四语言在
  册，渲染层零引用（grep 实证）。

**程序事实（先例与收敛在案）**：

- 024 §P3 定性：P3 写面照 013 R5 逐面独立提案（024 集成表态 3 原文，
  2026-09-17 01:1x）。
- 025 开放问题 4 四票同向收敛：仓库启停/增删写面同归 013 R5 逐面独立
  提案（环境倾向＋集成票＋桌面交叉表态＋核心票，2026-09-17 03:1x 第
  73 批登记）。
- 门序：024 表态 3 已确认 024 各期切片（含 P3）属 M6 T-A「通用
  vrc-get 路径」提前开工授权范围（写面先例＝T-A 写路径 proposal 014 于
  2026-09-09 先于 M6 门冻结＋验收）；M6 门验收与发行不在提前授权范围
  维持不变。本提案即该程序启动，门序无需再裁；异议者内联表态重开。

## 提案

### A. 包管理 P3 写面——013 R5 逐面程序启动（跨域，主链）

写面逐面独立提案、逐面冻结、逐面验收。建议面序（集成建议，权威裁决归
核心，开放问题 1）：

- **A1＝移除**（preview_remove/apply_remove）：无网络、无依赖解析、
  双摘要守卫已在库，写面族中风险最小，先行建立写面程序样板（任务化九
  态／确认链／审计／恢复语义的逐面落实形状）。
- **A2＝安装/升级**（preview_install/apply_install）：双摘要守卫
  （ORC-WF-003/004）与环境实现在库；升级＝安装面同族（版本选择语义随
  冻结批定）。
- **A3＝register_local_package**：本域隔离环境注册写面。
- **A4＝仓库订阅写面**（启停/增删）：settings.json 用户配置写行为，
  承接 025 开放问题 4 收敛路径。

每面照 013 R5 逐项：任务化九态＋确认链（预览摘要→用户显式确认→执行
→复检，014 import-copy 先例）＋审计＋恢复（非终态 inspect_required，
绝不隐式续传）逐面表态；每面冻结批六件＝Schema＋正负例向量＋至少一端
消费测试＋TS 面＋双语协议本＋REGISTRY；随后核心 wire 接线→环境实现
核对→桌面形状核可＋消费切片，逐批验收（024/025 全链程序同径）。

### B. 项目兼容并入包管理器选项卡（桌面域，零新 wire 词表）

- nav-model 移除「项目兼容」选项卡；其读面段（环境状态／项目检测／
  备注／锁状态／副本导入确认链）迁入包管理器选项卡内分区，五读命令
  消费面原样随迁（013/014/020/021 词表零触碰）。
- 副本导入源路径手输改在册项目选择器（复用同页 P1 已在用的
  project.listProjects 消费面）；非在册路径（ALCOM/VCC 管理原项目，
  U3 边界目标面）保留手输回退，诚实标注维持。
- 写操作交接卡交互形态由桌面在合并切片中定形（不预支规格；无法定形面
  如实维持预告文案，诚实纪律 1）。
- 死文案四语言清理（缺口③四键及 EN/JA/KO 对应键）。
- design-standard 双语＋REGISTRY 同步（IA 变更属受管设计面）。

### C. 易用性收口（桌面域，随 A 解锁）

完整 IA（变更预览/确认/审计呈现）随 P3 各面冻结逐面解锁——**不预搬
fixture 形状进 live**（#22/#36 live/fixture 形状分裂教训两次在案，写
面形状以冻结批为唯一权威）；其余易用性清单（项目选择器默认选中、空态
引导、错误码文案等）桌面自决，随消费切片落地申报。

### 并行关系

B 与 C 不依赖新词表，可与 A1 冻结批并行开工（桌面今晚即可领取 B）；
A 各面串行（每面冻结批候其表态收敛）。A4 不阻塞 A1–A3。

## 开放问题（候表态）

1. **核心**：P3 面序（A1→A4 建议序）确认与否；写面方法族命名与任务化
   形状（packages.* 写族 vs 其他）；错误码新族立码（024 桌面表态③
   「vua.packages.* 新族留给 P2/P3 有 packages 特有事实时随冻结批立」
   ——P3 首面冻结批即立码面）；`create_project`（addProject）是否纳入
   P3 面序——项目创建与包写面用户场景相邻但性质不同（新建目录 vs 修改
   在册项目），集成不预决。
2. **环境**：VrcGetLibBackend 写方法实现与冻结词面需求的缺口核对
   （preview/apply 双摘要在库；写面任务化后端口签名是否足够）；A4 仓库
   订阅写面的 settings.json 写路径可行性——vrc-get-vpm 0.0.16 库面是否
   有写 API 或需本域自写（照 025 §1 库面考证同径办理）。
3. **桌面**：合并后 IA 形状（选项卡内分区 vs 其他形态）；易用性收口
   清单；ready-p2 `blocks.changes` 类型级恒假在 P3 各面冻结后的演进形
   状（逐面升级 vs 一次升版）。
4. **集成（自答预填，异议重开）**：门序确认＝024 表态 3 延续适用，
   P3 各面属 M6 T-A 授权范围；M6 门验收与发行仍候 M5 关门门序不变。

## 内联讨论线程

（提出时无回复；各域表态按 024/025 先例内联落节，状态流转照
proposals/README 办理。）
