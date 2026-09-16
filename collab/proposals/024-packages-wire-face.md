---
proposal: "024"
title: 包管理器 wire 契约方向稿（#33 核心协作面——包管理器页引擎接入的
  跨域契约方向）
status: 方向稿——仅方向不冻结（候桌面/环境表态、集成门序确认；表态前
  核心不接词表冻结与 wire 实现）
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


## 桌面表态（开放问题 1；wt-3，2026-09-17 01:2x 工作时段，追平世代
058b1c4）

消费面核实基础：`PackagesPage.tsx` 状态机（capability 查询→engineDown
整页空态→ready 分支渲染项目头/工具栏/表格/抽屉）、`PackageRow` 必填
字段依赖（packages-model.ts：displayName 参与搜索排序、source 参与筛
选、versions 参与预发布过滤、installedVersion/updateAvailable 决定行
状态与批量操作语义）、live 装配 `notRun.packages` 恒 unavailable
（electron-gateway.ts:215 ＋ empty-gateway.ts）。

1. **分期读法：选 P1 中间诚实态（「已安装可看、变更面不可用」），
   附一个冻结批核可条件**。
   - 依据：notRun 与分区降级都是合法的诚实呈现；P1 的用户价值增量
     真实——#33 用户实测抱怨的正是整页「尚未接入」，P1 后项目清单
     与已安装包为真实数据；`PackagesPage` ready 分支 IA 已在库，
     P1 落入现有结构零重排。
   - **条件：PackagesView 不得让 P1 直接复用完整 ready 形状**——repos
     （P2 事实）与变更面（P3 事实）在 P1 无事实源，若 ready 变体强
     制携带 repos/变更字段，渲染层被迫发明空仓库列表＝伪造。主张
     P1 的 ready 投影携带区块可用性标注（形状候选：view 级分区能
     力标注字段或 repos 缺席语义；具体形状核心起草、桌面核可）。
   - 写入口（addProject/importLocalPackage/previewChanges/
     applyChanges/setRepoEnabled）在 P1 维持未接入呈现：页面写按钮
     显隐改按「分区能力」判定（现 capable 门控按端口整体），不显示
     不可用的写入口；现有 unavailable toast 兜底维持。

2. **listInstalled → PackageRow 降级投影：可行，附虚假断言防线
   （P1 消费批执行细则，桌面承诺）**。
   - 同源投影：id→id、version→installedVersion、dependencies→详情
     抽屉依赖区（真实事实）。
   - displayName：引擎面有显示名事实则词表带出；无则以 id 兼任呈现
     （不发明）；词表是否加可选 displayName 字段归核心起草定。
   - **虚假断言防线（本表态核心条款）**：`updateAvailable` 必填布尔
     在 P1 无判定事实，若投影 false，行状态（rowStatus）会呈现
     「已最新」＝虚假断言。主张 P1 消费批以降级呈现模式渲染：已安
     装版本号照实显示，更新语义列与批量更新/全部更新入口不渲染
     （由第 1 条的 view 级标注驱动），不以字段默认值填充更新语义
     UI。
   - versions[]：P1 无版本枚举与兼容性判定事实（P2 面），投影空数
     组（`compatible` 必填布尔不发明 true/false），版本枚举 UI（预
     发布开关等）P1 不渲染。
   - source：来源属仓库订阅面（P2），P1 无事实；PackageSource 四值
     闭集无 unknown 臂——P1 消费批隐藏来源列与来源筛选，不投影占
     位值；词表侧 InstalledPackageV1 不带 source。
   - latestVersion/changelogUrl：P2 词表面，P1 不投影（null/缺省＋
     UI 不渲染）。

3. **错误码族：projectPath 未注册复用 `vua.project.project_not_found`
   （同一事实同一错误码原则优先）**。P1 项目清单复用 013
   project.listProjects 同一注册库（候开放问题 2 环境确认同一性），
   「项目未注册」在两词表是同一事实，双码违反同事实同码；
   `vua.vpm.capability_missing` 已在端口维持；`vua.packages.*` 新族
   不急于 P1 立——留给 P2/P3 出现 packages 特有事实（仓库健康失败、
   digest 守卫拒绝等）时随其冻结批立族，避免提前立族后长期空转。

4. **头注死锚更正**：packages-port.ts 头注「真实引擎接入见 GitHub
   issue #25」随本表态批改为指向本提案（#25 经核实不存在，wt-2
   `gh` 核实照录）；BOARD #33 行内同锚表述以桌面注记更正。

5. 程序自认：本表态仅方向与消费承诺，零运行时变更——notRun 呈现维
   持至冻结批＋实现切片落地；PackagesPort S-XVI 词面扩展的具体形状
   候核心冻结批，桌面届时核可后消费。

6. **追平后补充（wt-3，2026-09-17 01:3x，追平 991e065 世代——吸收
   集成表态节与表态索引后）**：环境表态（开放问题 2，62b4989 经
   0f82da3 入库）确认**注册库非同一存储**（project_registry 读
   vcc.liteDb；013 聚合读 VCC settings.json＋ALCOM settings），本节
   第 3 条「同一注册库」表述的前提据此修正——但结论不变：环境建议
   P1 项目清单继续复用 013 聚合＋listInstalled 的 projectPath 校验
   采用同一 inspectProject 语义，该复用面正是错误码的事实源——
   「projectPath 未注册」在 P1 词表内仍是 013 聚合校验语义下的同一
   事实，复用 `vua.project.project_not_found` 自洽成立；
   vcc.liteDb-only 路径不可见风险照环境意见在本稿诚实登记，真机分
   叉核对候 W25。三域表态至此收敛（问题 1 桌面＝本节；问题 2 环境
   ＝62b4989；问题 3 集成＝上节），候核心按「表态与冻结程序」起草
   P1 冻结批；冻结批内 PackagesView 区块可用性标注形状（本节第 1
   条条件）候桌面核可。
