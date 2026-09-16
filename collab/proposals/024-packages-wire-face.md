---
proposal: "024"
title: 包管理器 wire 契约方向稿（#33 核心协作面——包管理器页引擎接入的
  跨域契约方向）
status: 方向稿——仅方向不冻结（环境/集成表态已落，见内联线程表态
  收编节；桌面表态候落；三域收敛前核心不接词表冻结与 wire 实现）
author: wt-2（核心）
date: 2026-09-17
---

## 背景与触发

- #33 桌面自查收口（wt-3 c1544d4，经 9d43587 入库；集成第 68 批核可）：
  包管理器页「包管理引擎尚未接入」＝**契约面事实，非 gate 缺陷**；修复
  归属＝核心/引擎域（wire 词表 packages.* 族＋能力行＋引擎实现）；
  [→核心] 留言候核心领取或排期。本稿＝核心领取的回应——契约阶段先行
  （工作纪律 1：先定义或更新拥有契约，再实现跨模块行为）。
- 核心侧独立核实（2026-09-17 00:4x，main 7f545e2 世代，三点与桌面自查
  一致）：
  1. wire 词表（`packages/contracts/src/application-contract.ts`）零
     `packages.*` 方法族；
  2. `crates/provider-host/src/provider_host.rs` `served_capabilities`
     闭集（task.list／environment.*／demo.task／overlay.snapshot／
     inspection.*／production.*／project.import-copy／project.setNote）
     零包管理行；
  3. **既有排期锚死锚照录**：桌面 packages-port.ts 头注与 BOARD #33 行
     所指「真实引擎接入路由＝GitHub issue #25」经 `gh` 核实本库 issues
     为空、#25 不存在——引擎面登记锚自本稿起转提案 024＋BOARD #33 行，
     GitHub issue 是否补建归集成/用户裁量（协调权威在 collab/ 机制）。
- **方向性方向稿——仅方向不冻结**；跨域面留桌面/环境表态，表态前核心
  不接词表冻结与 wire 实现（023 同纪律）。

## 权威锚（全部已接受，本稿零发明）

1. **产品边界**：项目管理三路径——VUA 的 `vrc-get` 包管理器、ALCOM 兼容、
   VCC 兼容；包管理器页是 VUA 自有路径的前端面。
2. **桌面前端边界契约已定型**：`PackagesPort`（S-XVI，
   `apps/desktop/src/renderer/gateway/packages-port.ts`）——项目库浏览、
   包行（来源／版本枚举 compatible/yanked／updateAvailable）、仓库订阅
   启停与健康（RepoHealth）、两阶段变更（previewChanges→applyChanges）、
   本地包导入、addProject 登记；头注自述诚实纪律「能力未接入一律
   unavailable/not-connected，不编造包清单」。**本稿以该 IA 为消费锚**；
   词表最终权威形状归桌面表态。
3. **核心端口面已在库**：`VpmBackend`
   （`crates/orchestrator/src/vpm_backend.rs`，E-VPM-DUAL／ADR-0006）
   B6 方法——`list_packages`／`preview_remove`／`apply_remove`／
   `project_registry`＋`preview_install`／`apply_install`（digest 守卫）＋
   `register_local_package`＋`create_project`；`VpmCapabilities` 五能力位
   诚实门控（ORC-DEV-004 无实现位禁止预留）。
4. **引擎实现在库**：`crates/project-manager` `VrcGetLibBackend` 五能力
   全实现（vrc-get 库后端）；`VccCliBackend` 仅 `create_project`。
5. **T-A 提前开工授权**（用户裁决 2026-09-08，越门序）：通用 vrc-get
   项目与包管理路径在授权范围；wire 词表为新协议面（M6 表治理注记）。
   013 R5：**写命令面各自独立提案**（确认链/守卫/审计/恢复语义），不以
   「实验」名义开放。
6. **诚实纪律**：现状 notRun 呈现即诚实纪律 1 的执行；引擎未实现前桌面
   维持现状，本稿不改变任何运行时呈现。

## 设计方向（草案，逐项候表态）

### 1. 分期（候选，候桌面/环境表态收敛）

- **P1 读面（packages.query v0.1 候选）**：仅列核心端口已支撑的事实——
  - `packages.listInstalled`（params：projectPath）→
    `InstalledPackageV1` 投影（id/version/dependencies）；
  - 项目清单**复用 `project.listProjects`**（013 面）——同一注册事实
    不设第二词表（`VpmBackend::project_registry` 与 013 读面的注册库
    同一性候环境确认，见开放问题 2）；
  - capability 行 `packages.query` 随核心装配翻转；P1 交付后页面至多
    呈现「已安装清单」，仓库/可安装/变更面维持诚实 unavailable。
- **P2 仓库与目录面（候环境后端扩展提案）**：PackageRow 的
  versions/compatible/yanked/updateAvailable 与 RepoInfo 列表/启停/健康
  ——核心 `VpmBackend` 现无对应端口（vrc-get 库有仓库/settings 面，
  端口未暴露）；需环境域后端扩展提案＋核心端口升版，属新协议面。
- **P3 变更面（照 013 R5 逐面独立提案）**：install/remove
  （preview/apply，digest 守卫已在端口）与本地包导入
  （register_local_package 在端口）；任务化九态、确认链、审计、恢复
  语义逐面提案，不在 P1 搭车。
- **分期与页面 IA 的关系（候桌面表态）**：P1 后页面收敛为「已安装可看、
  变更面不可用」的中间诚实态，还是维持整页 notRun 直至 P2/P3 齐——
  IA 裁量归桌面。

### 2. 词表形状（P1 候选草案；冻结前置＝Schema＋正负例向量＋至少一端
消费测试齐备）

- 命令蛇形／字段 camelCase／错误码族＋i18n 键（013 先例）；
- result 文档带 `schemaVersion` 常量（`vua.packages-installed/v0.1`
  候选），信封与既有命令面先例一致，升版只加不改；
- 类型化错误：projectPath 未注册＝复用 `vua.project.project_not_found`
  还是新族 `vua.packages.*`（同一事实同一错误码原则 vs 错误码族边界，
  候表态）；backend 能力缺失＝`vua.vpm.capability_missing` 已在端口；
  装配未注入引擎＝诚实缺席语义照 021/023 缺席臂先例（缺席不伪装、
  不伪造空清单）。

### 3. 能力行与装配（核心侧实现方向）

- `served_capabilities` 增 `packages.query` 行：availability 随 provider
  装配的 `VpmBackend` 实例存在性翻转（bin `run_provider_host_full`
  装配点；`VUA_PROVIDER_DATA` 等门控不注入即诚实 unavailable，不伪造
  装配——5eeec28 同口径）；
- `ProjectOpsServices`（vcc_settings_candidates/manager_roots）同构
  先例可循；`VrcGetLibBackend` 需 environment root，来源与 project_ops
  面共读单一事实源（proposal 004 决议序）；
- contracts TS 面随冻结批同步登记（跨域契约冻结责任在核心，TS 面随
  冻结批，桌面消费批随后）。

### 4. 明确非目标（本稿零发明零承诺）

- 不设中央仓库、不运营任何包源；仓库订阅永远是用户自己的配置
  （安全法律边界：凭证与付费资产本地，不中继）；
- P1 不含任何写路径；写面照 013 R5 逐面独立提案；
- P1 不呈现 updateAvailable/版本词法比较结果（桌面 PackagesPort 头注：
  该计算事实源在 P2 定，P1 不发明）。

## 开放问题（表态项）

1. **桌面**：分期读法（P1 中间诚实态 vs 整页 notRun 维持至 P2/P3）；
   `packages.listInstalled` 形状对 PackagesPort 的映射（PackageRow 在
   P1 的降级呈现）；错误码族归属（复用 vua.project.* vs 新族
   vua.packages.*）。
2. **环境**：P2 仓库/目录面的后端扩展可行性与排期（vrc-get 库面→
   VpmBackend 端口升版）；`project_registry` 与 013
   `project.listProjects` 注册库同一性确认（同一 VCC-compatible
   settings 源则 P1 零新增项目事实）。
3. **集成**：M6 early-open 授权下本面切片的门序归属确认（T-A 包管理
   半边的验收路径）；本提案与 BOARD #33 行的关联登记方式。
4. **核心（自查已列）**：装配点与 ProjectOpsServices 的复用边界；
   错误码族命名裁决候 1 收敛。

## 表态与冻结程序（023 先例）

- 三域表态在各自状态批或本文件内联线程落节；表态收敛后核心起草冻结批
  （Schema＋正负例向量＋至少一端消费测试＋contracts TS 面＋双语协议本
  ＋REGISTRY，齐备方冻结）；实现切片（路由＋能力行＋装配）随冻结批或
  紧随切片；
- 表态前：桌面 PackagesPort 维持现状 notRun（诚实呈现不变）；核心不接
  词表冻结与 wire 实现；环境不动后端端口面。

## 表态（集成）（2026-09-17 01:1x，第 70 批验收轮——开放问题 3 全项办理）

1. **门序归属确认**：本提案各期切片属 M6 T-A「通用 vrc-get 路径」提前
   开工授权范围（用户裁决 2026-09-08 晚，越门序；BOARD M6 行权威记录
   ：「wire 词表为新协议面——桌面提案→核心裁决流程不变」）——P1 契约
   冻结批与实现切片（路由＋能力行＋装配）可在 M6 门开窗前按 T-A 授权
   开工与入库，先例＝T-A 写路径 proposal 014（语义冻结＋实现验收合并
   2026-09-09，先于 M6 门）。**M6 门验收与发行不在提前授权范围**，仍候
   M5 关门后按门序办理（M5 关门候 W25 真机走查，候用户开窗 O-2）。
   验收路径：P1 冻结批按本稿「表态与冻结程序」前置齐备（桌面/环境表态
   收敛＋Schema＋正负例向量＋至少一端消费测试＋contracts TS 面＋双语
   协议本＋REGISTRY）后由集成验收；实现切片随冻结批或紧随切片，逐批
   集成验收（相关测试全绿＋diff 审核为合并前置）；页面呈现复验候用户
   dev 栈重启，零端到端宣称维持。P2 系新协议面（VpmBackend 端口升版
   ），候环境后端扩展提案独立起草后同径办理；P3 照 013 R5 逐面独立
   提案、逐面验收，不搭车。
2. **关联登记方式**：BOARD #33 行＝用户缺陷跟踪与引擎面排期行（候
   用户复验＋核心协作跟踪）；本提案＝契约方向权威锚。双向引用已随
   本批自然形成（#33 行核心注记引 070e771，本稿背景节引 #33），不设
   第三登记面；024 方向稿阶段不申请 REGISTRY 登记（023 先例：方向稿
   仅方向不冻结，登记入 BOARD 行即其登记面动作；冻结批按程序登记）。
3. **死锚裁量（集成裁决，用户可否决）**：GitHub issue #25 **不补建**
   ——本协作机制协调权威在 collab/（state/proposals/BOARD，AGENTS.md
   协作纪律），本库 issues 系统未在协作中使用（库内 issues 为空）；
   补建将制造 collab/ 之外的第二登记权威面。引擎面权威锚＝本提案＋
   BOARD #33 行。桌面 packages-port.ts 头注锚点修改（issue #25 →
   提案 024＋BOARD #33 行）归桌面域内小改，候桌面自领，不阻塞表态。

## 表态索引（集成登记，2026-09-17 01:2x 第 70 批补记）

- **环境表态已落（开放问题 2，wt-6 62b4989，经 0f82da3 入库；全文在
  collab/state/wt-6.md 本状态批——环境选择状态批落节，符合本稿程序）**
  ：①P2 仓库/目录面后端扩展＝**可行且环境可领取**（vrc-get-vpm
  0.0.16 已暴露 Settings.user_repos/UserRepoSetting＋
  PackageCollection::load/load_cache 在线/离线双路径；VrcGetLibBackend
  preview_install 同族 API 零新依赖；形状照 project_registry 先例，
  VpmCapabilities 新位按后端声明 ORC-DEV-004；排期候核心 P2 冻结批）；
  ②**注册库同一性＝非同一存储**——project_registry 读 vcc.liteDb，
  013 聚合读 VCC settings.json userProjects/localProjectFolders＋
  ALCOM settings（同一 environment root、不同文件，集合可分叉；
  vrc-get 源码注释 vpm_settings.rs:25-33 载明 userProjects 将迁移、
  vcc.liteDb 成为主存储），「零新增项目事实」乐观假设不成立。P1 建议
  ＝项目清单继续复用 013 聚合（VCC＋ALCOM 更广并集、schema 已冻结），
  packages.listInstalled 的 projectPath 校验采用同一 inspectProject
  语义，vcc.liteDb-only 路径不可见风险在本稿诚实登记，真机分叉核对候
  W25，必要时经独立环境提案扩展 013 聚合（013 升版程序，不搭 P1 车）。
- **表态进度**：开放问题 1（桌面）候表态；问题 2（环境）已落（上节）
  ；问题 3（集成）已落（上上节）；核心自查项随 1 收敛。**表态收敛剩
  桌面一票**；收敛后核心起草 P1 冻结批（本稿「表态与冻结程序」前置）。


## 内联线程

### [核心自查] 装配点与 ProjectOpsServices 复用边界——开放问题 4 第 1 项收敛（2026-09-17 01:1x，slot/wt-2 树＝main 7f545e2 世代全等；零代码变更，纯代码事实注记）

1. **装配门控同口径**：provider bin（`crates/provider-host/src/bin/
   vua-orchestrator-provider.rs:190`）`runtime_face_wired =
   VUA_PROVIDER_DATA.is_ok()`；`project_ops`（`ProjectOpsConfig`）与
   `environment`（`EnvironmentConfig`）共用该门控与同一
   `EnvironmentRoots::default()` 实例（`vcc_settings_candidates`
   克隆共享，:205）。**packages 装配行循同口径**：门控不注入→诚实
   缺席（typed unavailable），不伪造装配——与 024 第 3 节方向一致，
   且与 5eeec28 门控口径、021/023 缺席臂同构。
2. **注入口已在端口**：`VrcGetLibBackend::with_environment_root(root,
   offline)`（`crates/project-manager/src/vpm_backend.rs:77`）支持
   显式环境根注入；默认根 `default_environment_root()`（:175）＝
   `%LOCALAPPDATA%\VRChatCreatorCompanion`（镜像 vrc-get 库
   `DefaultEnvironmentIo::new_default` 的 VCC-compatible 配置 home）。
3. **单一事实源核对**：核心 `EnvironmentRoots::default()`.
   `vcc_settings_candidates[0]`（`crates/orchestrator/src/
   environment.rs:363`）＝`%LOCALAPPDATA%\VRChatCreatorCompanion\
   settings.json`（Roaming 为第二候选）与引擎默认根**同指同一
   VCC-compatible 配置根**。**回退语义差异照录**：核心候选双路径
   （Local 先、Roaming 回退），引擎默认单目录（Local 推导、无
   Roaming 回退）。**冻结批取向（核心自查结论）**：装配显式注入由
   核心候选推导的根（candidates[0] 去文件名取目录），使 packages 面
   与 project_ops/013 面严格同一事实源；引擎默认根留测试/独立环境
   用途。此为装配细节非词表面，随冻结批落。
4. **现状闭合**：bin 装配点零 `VpmBackend` 注入（本世代检索实证）
   ＝packages 引擎缺席现状（诚实缺席），与背景核实三点互证——
   `served_capabilities` 增行后未注入引擎同样必须诚实缺席。

### [核心自查] 开放问题 2 代码事实补充——「注册库同一性」精确化（仅供环境表态参考，表态权在环境，核心不代决）

- 013 `project.listProjects` 读源（`crates/provider-host/src/
  provider_host.rs:4575` → `collect_project_inspections`，
  `crates/project-manager/src/project_inspection.rs:160`）＝**核心
  直读 settings.json**：VCC `userProjects`/`localProjectFolders` ＋
  ALCOM `userProjects`，按路径并集、association 逐 manager 标注。
- `VpmBackend::project_registry`（`VrcGetLibBackend`，
  `crates/project-manager/src/vpm_backend.rs:347`）＝**vrc-get 库
  `VccDatabaseConnection::get_projects()`**——与环境根同根
  （`%LOCALAPPDATA%\VRChatCreatorCompanion`）但**读取机制不同**
  （settings.json 直读 vs vrc-get 数据库连接视图）。
- 因此开放问题 2 的「同一性确认」精确化为：**配置根同一、读取机制
  两套**。正常机器上集合预期同源一致，但边缘差异可能存在（数据库
  视图滞后或直读新鲜度差异）；P1 词表面真正需要裁决的是
  **`project_not_found` 判定与 `packages.listInstalled` 的注册事实
  权威源取哪一面**（013 直读面 vs `VpmBackend` 库面）——候选读法：
  P1 清单复用 013 面不设第二词表（方向稿原方向）＋ listInstalled
  对清单外路径按同一面判定 not_found，或清单与判定都取库面。此裁决
  候环境表态（开放问题 2）＋桌面表态（开放问题 1 映射面）收敛，
  核心不代决；表态前核心不接词表冻结。

### [表态收编] 环境＋集成表态落节记录（2026-09-17 01:1x 核心收编自
### main；两表态原文分别落 wt-6 状态批 62b4989 与集成第 70 批登记
### ae6eca6，均已入 main；按环境落点说明「024 由核心在自己分支上
### 改，无冲突面」由核心收编进本内联线程）

**环境表态（wt-6 62b4989，开放问题 2）**：

- (a) **P2 仓库/目录面后端扩展：可行，环境域可承接实现**。库面证据
  （vrc-get-vpm 0.0.16，Cargo.toml 锁 `=0.0.16`）：①仓库订阅面＝
  `Settings::load` → `VpmSettings::user_repos() -> &[UserRepoSetting]`
  （`url()/id()/name()/get_versions_of()/get_packages()`，RepoInfo
  与每仓库版本枚举的库面基础已暴露）；②包集合面＝
  `PackageCollection::load`（在线）/`load_cache`（仅本地缓存＝离线
  路）两路齐备；③`VrcGetLibBackend` preview_install 已在用同族
  API——P2 属既有依赖 API 面展开，**零新依赖**。形态建议：端口升
  版核心主导（新协议面，与 P2 定性一致），project-manager 实现照
  `project_registry` 先例（trait 默认 unsupported err 保持
  VccCliBackend 编译兼容）；`VpmCapabilities` 新能力位**按后端分
  声明**（VccCliBackend 不声明仓库能力，ORC-DEV-004）；离线退化走
  既有 `offline` 字段（ORC-ADP-006）。排期候核心 P2 冻结批；表态
  前后端端口面零触碰维持。
- (b) **注册库同一性：不是同一存储源**——「同一 settings 源则 P1
  零新增项目事实」的乐观假设不成立。代码事实：`project_registry`
  读 **`vcc.liteDb`**（VccDatabaseConnection，litedb feature）；
  013 `collect_project_inspections` 读 **VCC settings.json**
  （`userProjects`/`localProjectFolders`）＋**ALCOM settings**——
  同一环境根下**不同文件**，注册集可能不一致；vrc-get 0.0.16 源注
  （vpm_settings.rs:25–33）明示新版下 settings.json `userProjects`
  键将消失、vcc.liteDb 成主要项目存储。哪些机器实际分叉属真机
  事实，候 W25 只读核实，不臆断本机状态。
- **环境 P1 读法建议**：项目清单仍复用 013 面（VCC＋ALCOM 并集覆
  盖更广、带 associations、schema 已冻结）；
  `packages.listInstalled` 的 projectPath 校验与
  `project.inspectProject` 同口径（013 聚合面为世界，未注册＝
  typed not-found）。**已知边界如实登记**：仅注册在 vcc.liteDb 的
  路径在 013 面可能不可见。如真机证实分叉需收敛：环境域独立小提
  案把 vcc.liteDb 读补进 013 聚合面（013 读面升版程序，**不搭
  P1 的车**）。环境根对齐：`with_environment_root` 注入已支持，
  §3「与 project_ops 面共读单一事实源」方向环境侧确认可行
  （proposal 004 决议序），装配对齐归核心装配切片。

**集成表态（第 70 批登记 ae6eca6，开放问题 3＋死锚裁决）**：

- **门序确认**：本提案切片在 M6 T-A vrc-get 路径 early-open 授权
  范围内（用户裁决 2026-09-08；014 先例——冻结＋验收先于 M6 门）；
  M6 门验收/发行**不在** early-open 范围，仍候 M5 关门门序。P1 验
  收路径＝冻结程序前置齐（Schema＋正负例向量＋至少一端消费测试＋
  contracts TS 面＋双语协议本＋REGISTRY）→ 集成验收；P2 候环境
  后端扩展提案；P3 照 013 R5 逐面。
- **登记联动**：BOARD #33 行＋本提案双向引用即为登记面（无第三
  面；方向稿阶段无 REGISTRY 登记，023 先例）。
- **死锚裁决**：GitHub issue #25 **不补建**（用户可推翻）：协调权
  威在 collab/ 机制，本库 issues 系统未在协作中使用，补建将制造
  collab/ 之外的第二登记权威面。引擎面权威锚＝本提案＋BOARD #33
  行。桌面 packages-port.ts 头注锚点修改归桌面域内小改，候桌面自
  领，不阻塞表态。

**核心注记（收编时点）**：

- 环境 P1 读法建议与本内联线程「权威源裁决两案」的**候选读法 1**
  （清单复用 013 面）一致——两案并读下环境已选案 1；`project_
  not_found` 判定口径环境亦已给向（inspectProject 同口径）。剩余
  收敛项归桌面表态（开放问题 1：分期读法、listInstalled 对
  PackagesPort 的映射、错误码族归属）；映射面若采纳环境建议口径，
  桌面表态焦点实际收窄至分期读法＋错误码族＋PackageRow P1 降级呈
  现。
- `vcc.liteDb`-only 路径不可见风险列入**冻结批诚实登记项**（随
  Schema 边界节落，照环境建议原文）。
- P2 环境侧可行性证据与形态建议由核心在 P2 冻结批起草时按端口面
  职责复核（跨域事实信任域主核实，冻结批核心侧只做端口/协议面复
  核，不重复环境域库面考证）。
- **桌面表态：未落**（wt-3 追平笔 04e85de 注明 next＝本提案开放问
  题 1 表态＋头注修复）。三域二落一候；表态程序＝三域收敛后核心
  起草冻结批——核心不冻结、不接 wire 实现，notRun 诚实呈现维持
  不变。

## 表态（环境，2026-09-17——开放问题 2）

表态人：wt-6（环境）；核实世代＝main 0f82da3（本域代码）＋vrc-get-vpm
0.0.16 库源码（Cargo.toml 锁 `=0.0.16`）；先落本树状态批（62b4989，
已随 0f82da3 验收入库），024 入 main 后按集成指引与 023 先例移录至
本内联节——两处内容一致，以本节为表态权威面。

### (a) P2 仓库/目录面后端扩展可行性：可行，环境域可承接实现

库面证据（vrc-get-vpm 0.0.16 已暴露、部分已被本域使用）：

1. **仓库订阅面**：`environment::Settings::load` →
   `VpmSettings::user_repos() -> &[UserRepoSetting]`（VCC
   settings.json 的 userRepos）；`UserRepoSetting` 提供
   `url()/id()/name()/get_versions_of()/get_packages()`——RepoInfo
   列表与每仓库版本枚举（PackageRow 的 versions/compatible/yanked
   与 updateAvailable 的库面事实基础）已可用。
2. **包集合面**：`PackageCollection::load(&settings, &io, Some(&http))`
   （在线刷新）与 `PackageCollection::load_cache(&settings, &io)`
   （仅本地缓存＝离线路径）两路齐备。
3. **零新依赖**：本域 `VrcGetLibBackend`（crates/project-manager/
   src/vpm_backend.rs）的 preview_install 路径已在用
   Settings/PackageCollection/PackageInstaller 同族 API——P2 实现
   属既有依赖 API 面展开，不引入新依赖、不动锁文件。

实现形态建议（与 P2「端口升版＝新协议面」定性一致）：

- `VpmBackend`（crates/orchestrator/src/vpm_backend.rs）新增读方法
  族由核心主导升版；project-manager 实现照 `project_registry` 先例
  （trait 默认 unsupported err，保持 `VccCliBackend` 编译兼容）；
- `VpmCapabilities` 新能力位**按后端分声明**：`VccCliBackend` 不声
  明仓库能力（ORC-DEV-004 无实现位禁止预留）；
- 离线退化走既有 `offline` 字段（ORC-ADP-006，对应 load_cache 路）；
- 环境根单一事实源方向确认可行：`with_environment_root` 注入已支持
  （024 §3 与 project_ops 面共读，proposal 004 决议序），装配对齐
  归核心装配切片。

排期：候核心 P2 冻结批（Schema＋正负例向量＋至少一端消费测试）起草
收敛后，环境域随后承接实现切片；表态前后端端口面零触碰维持。

### (b) 注册库同一性：**不是同一存储源**——「同一 settings 源则 P1
零新增项目事实」的乐观假设不成立

代码事实：

1. `VrcGetLibBackend::project_registry`（vpm_backend.rs:347）走
   `VccDatabaseConnection::connect`，读 **`vcc.liteDb`**（LiteDB 文
   件，vrc-get-litedb feature）＝VCC 新版项目数据库。
2. 013 `project.listProjects`（`collect_project_inspections`，
   crates/project-manager/src/project_inspection.rs:164）读 **VCC
   settings.json**（`userProjects` 列表或 `localProjectFolders`
   目录枚举）＋ **ALCOM settings** `userProjects`，按路径并集带
   associations——两路读的是**同一环境根下的不同文件**。
3. vrc-get 0.0.16 源码注释（vpm_settings.rs:25–33）明示：新版下
   settings.json 的 `userProjects` 键会消失、vcc.liteDb 成为主要项
   目存储（vrc-get 自带迁移逻辑）——两存储的注册集**可能不一致**。
   哪些机器实际分叉属真机事实，候 W25 窗口只读核实，不臆断本机状态。

对 P1 的读法建议：

- 项目清单仍复用 013 面（覆盖 VCC＋ALCOM 并集、带 associations、
  schema 已冻结，比 vcc.liteDb 单源覆盖更广）；
- `packages.listInstalled` 的 projectPath 校验与
  `project.inspectProject` 同口径（013 聚合面为世界，未注册＝
  typed not-found）；
- **已知边界如实登记进本提案**：仅注册在 vcc.liteDb 的路径在 013
  面可能不可见；
- 如真机证实分叉需收敛：环境域可独立小提案把 project_registry
  （vcc.liteDb 读）补进 013 聚合面（该文件在本域），但属 013 读面
  升版程序，**不搭 024 P1 的车**。

——以上为环境域表态；P2 端口方法族与能力位的最终权威形状归核心冻
结批，P1 词表形状归桌面表态（开放问题 1），门序归属归集成（开放问
题 3）。表态前后端端口面零触碰。
