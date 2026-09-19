---
proposal: 026
title: "包管理 P3 写面＋项目兼容并入包管理器（用户 2026-09-18 裁决转述）"
status: 已接受（2026-09-19 00:2x 推进：开放问题四项全闭合——核心／环境／桌面三域表态落节经第 97 批收编＋集成开放问题 4 门序自答无异议；B 面切片已验收入库〔第 97 批 2151409〕；内联线程无未决讨论点。A1–A4 逐面冻结批按已受程序启动〔A1 候核心起草〕；A4 词面＝增删先行冻结、启停候 VCC 键名真机核实；A5（create_project）候选面候桌面提出入口需求。落地进展登记归 BOARD #40 行与各树状态文件，本文件就此冻结）
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

### 表态（核心）（2026-09-18 晚，slot/wt-2 追平 79c9f72 后；开放问题 1 四项逐项裁决）

**定位**：本节系 026 开放问题 1 的核心表态（面序确认／写面方法族命名与
任务化形状／错误码新族立码／create_project 取舍）。本节为**程序与方向
权威**，不预设字段名与最终闭集——各面权威词面由该面冻结批落死
（025 先例：方向表态→冻结批落死，冻结批与本节冲突时以冻结批为准）。
核实世代：main 79c9f72（本树追平 6c2f77e）；事实锚全部本机直读：
crates/orchestrator/src/vpm_backend.rs:214-332（端口写方法族）、
crates/project-manager/src/vpm_backend.rs:302-303/:351/:390/:528/:757/
:898（VrcGetLibBackend 写能力位全 true 与五写方法实现在库；VccCliBackend
:1105-1118 仅 create_project）、packages/contracts/src/application-contract.ts
:33-55（TaskStateV01 九态闭集＋TaskRecoveryDispositionV01）、:583-584
（读面族冻结注释「写面归 013 R5」）、:1359（requestRun 任务化驱动惯例
注释）、schemas/ 目录（project-inspection 读＋project-ops 写分线先例，
packages-query/packages-repos/packages-catalog 三读面行在库）。

**开放问题 1 逐项表态**：

1. **面序：A1 移除→A2 安装/升级→A3 register_local_package→A4 仓库
   订阅写面，照建议序确认**。理由逐面核于端口与实现事实：A1
   preview_remove/apply_remove 双双在库（端口 :254-270 默认 unsupported
   ＋VrcGetLibBackend :351/:390 真实实现），无网络、无依赖解析，写面族
   风险最小，宜立程序样板（九态任务／确认链／审计收据／恢复语义／错误
   码族的逐面落实形状，014 import-copy 先例为底本）；A2
   preview_install/apply_install 系端口必需方法＋ORC-WF-003/004 双摘要
   守卫在库（:238-243）＋VrcGetLibBackend :528/:757 实现在库，升级＝
   安装同族（版本选择语义随 A2 冻结批定，提案预记维持）；A3
   register_local_package 端口在库（:244-248）＋能力位 true（:302 区）
   ——本域隔离环境注册，面窄随 A2 后顺承；A4 殿后＝端口连方法都未立
   （list_repos 只读注释 :282-286 明示启停/增删归 013 R5 写面不在此
   处），需先立端口方法＋settings.json 写路径库面考证（环境开放问题 2
   照 025 §1 同径），且 025 核心表态裁决 8 已把主动刷新类网络写行为列
   R5 族候选面——A4 与 A1–A3 无串行依赖维持（提案并行关系节）。
   A1–A3 每面冻结批六件（Schema＋正负例向量＋至少一端消费测试＋TS 面
   ＋双语协议本＋REGISTRY）照提案 A 节确认，逐面独立验收。

2. **方法族命名：wire 词表与读面同族 `packages.*` 前缀，preview/apply
   二段动词照端口一一映射**（A1 面即 packages.previewRemove /
   packages.applyRemove 形状；最终拼写随 A1 冻结批落死，本节立形状不
   立全表）。理由：读面三方法 packages.listInstalled/listRepos/
   packageCatalog 已在同族（024/025 链），写面另立前缀将分裂能力发现；
   preview/apply 二段动词保留双摘要守卫的确认链结构——preview 系同步
   只读 query（返回变更预览摘要＋摘要指纹），apply 系任务化写命令（携
   用户确认的指纹，服务端复算 preview 校验指纹一致才执行——ORC-WF-003/
   004 同纪律，桌面只做 UX 提示、权威判定在服务端，014 仲裁第 2 点先
   例）。Schema 词表行归属：立独立写面行 `schemas/packages-ops/v0.1/`
   ——直接先例＝项目域 project-inspection（读）＋project-ops（写）
   分线（014 仲裁第 1 点「读/写分线」）；包域三读面行已分立，写面照搬
   同构，不在既有读面行内扩写臂。

3. **任务化形状：apply 面＝九态任务，preview 面＝同步 query**。九态
   闭集即 TaskStateV01 在库九臂（queued/preparing/running/
   waiting_for_input/paused/succeeded/succeeded_with_warnings/failed/
   cancelled），恢复面 TaskRecoveryDispositionV01（none|inspect_required
   ）——014 import-copy 同构（requestRun 任务化驱动、taskId 轮询，
   application-contract.ts:1359 惯例注释在案；commandId 幂等/可取消/
   事件＋revision 全部继承既有任务权威与任务中心）。恢复纪律逐面落实
   诚实纪律 3：apply 任务中断/失败的非终态残留由复检标
   `inspect_required`，绝不隐式续传；重试语义（014 先例＝清理后重来，
   清理动作用户显式触发）随 A1 冻结批按移除面事实定形。审计收据（变更
   清单＋实际结果）照 014 导入收据先例随 A1 命令 Schema 冻结定形。

4. **错误码新族：立族名 `vua.packages.*`，立码时机＝A1 首面冻结批**。
   024 桌面表态③预告名（「vua.packages.* 新族留给 P2/P3 有 packages
   特有事实时随冻结批立」）照准——P3 首面（A1）冻结批即立码面：族与
   wire 词表 packages.*、schemaVersion 命名空间 vua.packages-* 三面一
   致，不再开 vua.vpm.* 新写码族；P2 在库既有码
   vua.vpm.no_matching_package（catalog 面消费中）维持不动不回改。A1
   冻结批立码纪律：闭集一次立全＋正负例向量覆盖（025 核心表态裁决 5
   同律）；成员方向预记（最终闭集随冻结批）：预览-确认指纹漂移（双摘
   要守卫拒绝）、包不存在、项目不在册、写能力缺席（通用
   capability_missing 复用优先）。本节不预立具体码串。

5. **create_project：不纳入 P3 面序（A1–A4 不含），留作后续候选面
   （A5），启动条件＝桌面 B 面合并后提出入口需求**。理由：①性质不同
   ——包写面修改在册项目（ChangePreviewV1 变更预览＋双摘要守卫形状适
   配既有状态），create_project 新建目录无既有状态可 diff，预览/确认
   链形状不共享（preview_install_for_plan :224-234 系「对计划基线预览
   」的实现耦合，非面形状耦合）；②用户裁决边界——裁决原文「包管理器
   要做写面」＋项目兼容并入，未提项目创建，U12 答复边界＝包写入口，
   不预支；③样板纯度——A1 立写面程序样板应最小化，create_project 引
   入模板选择/父目录/命名冲突等新预览维度会稀释样板。不预先关闭：端
   口方法与 VccCliBackend/VrcGetLibBackend 双实现在库（:898/:326-331），
   A5 照 013 R5 同程序独立启动即可，无实现前置缺口。

**程序注记**：本节零代码纯 collab 面。开放问题 2（环境）／3（桌面）
候各域落节；开放问题 4 集成自答预填无异议。核心侧下一步＝A1 冻结批起
草（本表态＋环境表态收敛后，024/025 同径：冻结批→wire 接线→环境实现
核对→桌面消费切片逐批验收）。B 面（项目兼容并入包管理器）零词表依赖
，桌面径行领取不受本节影响。
### 表态（环境）（2026-09-18 23:2x，slot/wt-6 工作时段；开放问题 2 答复——写方法缺口核对零缺口＋A4 settings.json 库面考证）

**本表态系纯库面考证与实现核对，零代码变更；A4 实现候冻结批词面，环境
不预动。**考证方法照 025 §1 同径：file:line 实测锚全部本机直读（库源＝
本地 cargo registry `vrc-get-vpm-0.0.16`，版本钉死自本域
crates/project-manager/Cargo.toml:17 `version = "=0.0.16"`）。下文库源
行号均相对该 registry 解包目录。

#### 1. A1–A3 写方法缺口核对（结论：实现零缺口，候冻结批即可进入实现核对）

VrcGetLibBackend 六写方法全在库（本域 crates/project-manager/src/
vpm_backend.rs，下称「实现」）：

- **A1 移除**：preview_remove（实现 :351 起，`remove_request`→
  summarize→digest）；apply_remove（实现 :390 起，预览重算第一道比对＋
  执行前第二道比对→`apply_pending_changes`）。端口侧 trait 方法与
  digest 纪律注释在 crates/orchestrator/src/vpm_backend.rs:253-270。
- **A2 安装/升级**：preview_install（实现 :528 起）；apply_install
  （实现 :757 起，两道摘要核对（Fix R2-7：legacy folders 计入摘要）→
  `PackageInstaller::new`＋`apply_pending_changes`，成功返回
  `{"applied": items}`）；preview_install_for_plan（trait default 转发
  preview_install，模板感知后端可覆写——:221-229）。
- **A3 register_local_package**：实现 :89-135（canonicalize＋
  package.json 校验→`add_user_package`→`Settings::save`；
  `AlreadyAdded` 幂等分支；`NonAbsolute`/`BadPackage` 定向错误码）。
- **能力位如实**：VrcGetLibBackend 五位 VpmCapabilities 全 true（实现
  :300-308）；VccCliBackend 仅 create_project:true（实现 :1102-1110，
  preview_install/apply_install 返回 unsupported——「无预览能力的后端
  不承担计划确认过的安装」ADR-0006 注释在案）。

#### 2. 端口签名足够性评审（结论：A1–A3 足够；两点观察归冻结批，不构成环境侧阻塞）

- 九态任务化宿主在 orchestrator 用例层（TaskState 九态，
  crates/orchestrator/src/contracts.rs:163-172，ORC §7.2「内部工作流
  阶段映射到九态」）；端口方法是被任务运行时调用的原子步骤。两段式
  preview/apply 签名与九态天然映射：preview 段＝Running 前段；
  WaitingForInput 挂「预览完成待确认」；确认后 apply 段；digest 漂移＝
  Failed＋`recoverable: true`（实现内 PREVIEW_DRIFT
  `.with_recoverable(true)` 在案）。**签名足够**。
- 观察①：apply_* 返回 `serde_json::Value` 非类型化（apply_install
  `{"applied": items}`／apply_remove `{"removed": items}`）。若冻结批
  为 packages 写族立类型化结果（照 024/025 信封教训与 026 开放问题 1
  的立码面），环境实现照冻结批类型化即可，调用形状不变。
- 观察②：**A4 在端口层零方法**——`list_repos` 只读，025 冻结批注释
  明示「enable/disable and add/remove are write faces under the 013
  R5 per-face path, not here」（vpm_backend.rs list_repos 文档注释）。
  A4 需新端口方法族＋wire 词表＋错误码，命名/形状/立码全归核心冻结批。

#### 3. A4 settings.json 写路径库面考证（vrc-get-vpm 0.0.16；结论：增删/重排库面 API 完备且本域先例在库——可行；启停＝库面零支撑，若纳入 A4 需本域自写＋真机核实先行）

**(a) 增**：

- `Settings::can_add_remote_repo(&self, url, remote_repo) -> bool`
  （settings.rs:188-220）：重复 URL／重复 id／官方与 curated 库守卫。
- `Settings::add_remote_repo(&mut self, url, name, headers,
  remote_repo, path_buf) -> bool`（settings.rs:222-247）：**需先经 HTTP
  拉取远端清单（RemoteRepository）并写入本地缓存文件（path_buf）**——
  含网络段，与 refresh 同族路径；headers 透传（:244）。
- `Settings::add_local_repo(&mut self, path, name) -> bool`
  （settings.rs:249-263）：本地目录仓库，路径 normalize＋重复守卫。

**(b) 删／重排**：

- `Settings::remove_repo(condition: impl Fn(&UserRepoSetting) -> bool)
  -> Vec<UserRepoSetting>`（settings.rs:265-273，返回被删行）；`remove_repo_at_index(index) -> Option<UserRepoSetting>`（:275-278 附近）。
- `reorder_user_repos_by_indices(&[usize])`（:280-283 附近）——重排
  写面库面亦可用（A4 词面是否含重排归冻结批）。

**(c) 写回与恢复语义**：

- `Settings::save`（settings.rs:46-49）→ `VpmSettings::save`
  （vpm_settings.rs:220-224）：**双写** settings.json 与
  `vrc-get/vcc-settings-backup.json`——每次 save 主文件与备份同步
  更新，库面自带备份维护。
- `save_json`（utils/mod.rs:358-365）→ `write_atomic`
  （io/tokio.rs:194-207）：临时文件（`.temp.N` 后缀）＋write_all＋
  flush＋`sync_data`＋`rename` 原子替换；pretty JSON＋OS 行尾。
- 恢复：`Settings::load`（settings.rs:25-43）主文件缺失/损坏时经
  `load_alt`（vpm_settings.rs:93-104）从备份恢复（带 gui_toast 级
  warn 日志），两处皆无才落 `VpmSettings::default()`。
- **本域在库先例**：register_local_package 已走完整
  load→add_user_package→save 环（实现 :115-135）——A4 增删组合零
  库面未知量，照同径即可。

**(d) 启停（enable/disable）：库面零支撑（本考证核心缺口，如实登记）**：

- `UserRepoSetting` 五字段闭集（structs.rs:10-24：local_path／name／
  url／id／headers）——**无 enabled 字段**。
- `VpmSettings::AsJson`（vpm_settings.rs:13-80）仅 `user_repos`
  单列表（:75）——**无禁用列表建模**；库 API 面零 enable/disable
  方法。
- 未知键以 `#[serde(flatten)] rest: JsonObject`（:78-79）透传保留：
  库 load 保留 VCC 侧未知键、save 原样写回——**启停数据不会被库写
  破坏，但库不提供操作它的 API**。
- 因此：若 A4 词面含启停，须立项为**本域自写 JSON 面**（绕库 API 直
  操作该未知键），且 VCC 禁用列表的确切键名／语义／行为需真机只读
  核实（用户 settings.json 实样）或 VCC 上游源码核实后再冻结——环境
  不凭记忆断言键名（诚实纪律；W25 真机窗口可顺带核实，与 024 表态
  (b) vcc.liteDb 核实项同窗）。

**(e) 并发窗口（如实登记）**：load→变更→save 是读-改-写全量覆盖
（last-writer-wins；原子替换保证文件不半写，但与 VCC 同机并写存在互
相覆盖窗口＝load 与 save 之间）。环境实现每次调用新 load、无长持句
柄，窗口天然最小；是否需冻结批载明「写前重读」纪律归核心裁量。

#### 4. 环境侧倾向（供冻结批裁量，不预决）

- A4 词面建议**增删/启停二分**：增删（含重排）库面完备可先行冻结；
  启停候真机键名核实后再冻结（或列为 A4 后续独立面）——避免冻结一
  个库面不支撑、需自写且键名未核实的词面。
- A1–A3 逐面冻结批落定后，环境照 024/025 实现切片程序做实现核对切片
  （每面：实现＋定向测试＋wire 对齐证据）。
### 桌面表态（wt-3，2026-09-18 23:1x）

**开放问题 3 三项表态＋B 面领取**：

1. **合并后 IA 形状＝选项卡内分区（采纳提案 B 建议形态）**：包管理器页
   尾部恒渲染「项目兼容」分区（Card 包裹，检测段／备注／锁状态／环境
   状态段／副本导入确认链五读面原样随迁，013/014/020/021 词表零触碰）；
   分区不挂 packages 引擎 capability 门控——项目兼容读面走 projectOps
   独立消费面，包引擎未接入时分区照常可用（IA 并入＝选项卡级合并，非
   引擎能力级绑定）。原「项目兼容」二级侧栏页移除（nav-model＋路由同批）。
2. **易用性收口清单**：B 面本批自带＝副本导入源改在册项目选择器（复用
   P1 同款 project.listProjects 消费面，零新词表）＋非在册路径手输回退
   （ALCOM/VCC 原项目 U3 边界面，导入守卫 source_not_registered 兜底
   如实呈现）＋死文案四语言清理（缺口③四键，另 detectionSource 经
   grep 实证同为零引用死键一并清理，申报可查）。其余（空态引导、错误
   码文案等）随 C 各面解锁桌面自决。写操作交接卡：无外部拉起词表与
   能力事实，交互形态不虚构，维持引导性呈现（诚实纪律 1，无法定形面
   如实维持预告文案——提案 B 预留路径照走）。
3. **ready-p2 blocks.changes 恒假演进＝逐面升级**：A 每面冻结批解锁对
   应写入口（冻结批＝该面 live 形状唯一权威，#22/#36 live/fixture 形状
   分裂教训不复发），不做一次性大翻转；逐面升级与「不预搬 fixture 形状
   进 live」同纪律，逐面消费切片逐面申报。
4. **B 面领取**：今晚工作时段（2026-09-18 23 时段）本树开工，切片＝
   nav 移除＋分区迁移＋选择器＋死文案清理＋design-standard 双语 0.7.3
   ＋REGISTRY 行同步，全链绿后提交候验收。

### 桌面表态（A5 入口需求，wt-3，2026-09-19 00:1x）

**应 wt-main 第 97 批与核心表态⑤之约**（「A5（create_project）启动条件
＝桌面 B 面合并后提出入口需求」——B 面切片 cde8ed0 已第 97 批 2151409
验收入库，条件成就，本节即入口需求落节）。事实锚全部本机直读
（7e2cf9f 世代，与 main 收编后代码面全等——追平壳 diff 空实证）：

- 端口：`create_project(&self, parent: &Path, name: &str,
  template: Option<&str>) -> Result<ProjectRef, AppErrorV1>` 单方法
  （crates/orchestrator/src/vpm_backend.rs:321-327），注释明示「Creates
  a project from a template; backends without the capability return a
  `capability_missing` error」——与 A1–A4 的 preview/apply 二段动词族
  **不同构**：端口无 preview 方法，核心表态⑤「预览形状不共享」的端口
  事实根即此。
- 双实现在库：VrcGetLibBackend 能力位 true
  （crates/project-manager/src/vpm_backend.rs:302）委托
  `create_from_template`（:898-908）；VccCliBackend 能力位 true
  （:1105）走 `vpm new <name> [template] -p <parent>`（:1132-1160）。
- 库路径语义（:1192-1265）：`template.unwrap_or("Avatar")` 默认模板
  （:1209）；解析序 `VRCTemplates/<t>` → `Templates/<t>` → 显式路径
  （:1210-1214）；目标已存在 → `errors.vpm.projectExists`
  （Validation，:1201-1207）；模板缺失 → `errors.vpm.templateMissing`
  （Dependency，:1216-1223）；复制失败/非 Unity 工程 →
  `errors.vpm.templateCopyFailed`（ExternalFailure，:1225-1256）；
  productName 改写＋Unity 工程校验随成（:1236-1256）。名称校验
  `validate_vpm_project_name`（:1274-1296）→
  `errors.vpm.projectNameInvalid`（Validation）。

**入口需求五点**（词面权威仍归 A5 冻结批，本节只声明需求事实，不预支
规格）：

1. **需要该入口**：用户场景＝在册项目为零或需要第二项目时，VUA 现状
   只有在册项目读面（project.listProjects，包管理器页 P1 消费面
   PackagesPage.tsx:240/:637 在用）与副本导入（014 importCopy），
   **无任何新建项目路径**——自建项目起点缺失；B 面合并后包管理器页
   是项目面唯一 IA 载体，入口自然落在该页。
2. **IA 形态需求**：表单式（父目录选择＋项目名输入＋显式提交），
   具体落点（包管理器页内位置、与「项目兼容」分区的编排）随 A5 消费
   切片在 design-standard §8.7 增补定形；新建目录不触碰任何在册项目，
   表单提交本身即显式确认，**不进双摘要确认链流程**（与核心表态⑤
   同向）。
3. **任务化形状需求**：端口单方法无 preview → A5 词面若照 A1–A4
   preview/apply 同构立码会出现端口无对应方法的面；桌面需求＝单段
   任务化 apply（TaskStateV01 九态可观察，成功回执携新 ProjectRef、
   在册列表刷新即见）——模板目录复制可能长时（copy_tree 无进度回调
   锚在案），可观察/可恢复照工作纪律 4；恢复非终态照诚实纪律 3
   inspect_required 绝不隐式续传。
4. **模板词面缺口声明（首面最小化建议）**：`template` 参数库面语义
   ＝「None → 默认 Avatar＋三级解析序」（:1209-1214），端口无模板
   枚举读面。桌面需求：**A5 首面不承诺模板选择器**——零枚举读面时
   UI 固定默认模板并如实呈现所用模板（不虚构下拉选项，诚实纪律 1）；
   模板枚举读面（templates.* 族）若核心裁定入 A5，随冻结批立词面、
   桌面消费面后置。如此 A5 首面＝一写方法＋零新读面，面最小。
5. **错误词面与能力位缺口声明**：①四个错误键
   （projectExists/projectNameInvalid/templateMissing/
   templateCopyFailed）桌面四语表零在册（grep 实证；
   `errors.vpm.applyFailed` 已在册四语）——A5 冻结批六件中错误码
   闭集与 TS 面须含此族，桌面消费切片随批补四语文案；表单前置校验
   可镜像 :1275-1285 规则，权威以冻结批词面为准。②create 能力在
   wire capability 面的呈现形状须 A5 冻结批定义——**不可复用
   blocks.changes**（语义＝变更预览可用性，与「可新建项目」不同构；
   packages-port.ts:209-210/:238 类型级恒假面是 C 面逐面升级标的）。

启动与否及 A5 在面序中的位置归核心裁定（面序权威已裁 A1→A4，A5 候
补）；本节＝启动条件所指「入口需求」的落节回应，桌面侧候冻结批后
照逐面程序（形状核可＋消费切片）办理。
### 结论（集成，2026-09-19 00:2x）——status 讨论中→已接受

开放问题四项全闭合、内联线程无未决讨论点，议题转入按切片落地
（proposals/README 状态机「已接受」语义）。四项闭合落账：

- **开放问题 1（核心）**：2026-09-18 晚落节（「表态（核心）」节，第 97 批
  0ffa364 收编）——面序 A1 移除→A2 安装/升级→A3 register_local_package
  →A4 仓库订阅殿后照建议序确认；词表＝wire `packages.*` 写族＋
  preview/apply 二段动词＋独立 `schemas/packages-ops/v0.1` 行；apply＝
  九态任务、preview＝同步只读 query（014 import-copy 同构，恢复
  inspect_required 绝不隐式续传）；`vua.packages.*` 错误码族 A1 首面
  冻结批闭集一次立全；create_project 不入 P3 面序、留 A5 候选面。
- **开放问题 2（环境）**：2026-09-18 晚落节（「表态（环境）」节，第 97 批
  533429f 收编）——A1–A3 实现零缺口（六写方法全在库 file:line）＋端口
  签名足够；A4 settings.json 库面考证＝增删/重排可行、启停零支撑（若
  A4 含启停须本域自写 JSON 面＋VCC 键名真机核实先行）。
- **开放问题 3（桌面）**：2026-09-18 晚落节（「桌面表态」节，第 97 批
  2151409 收编）——IA＝选项卡内分区恒渲染（不挂 packages 引擎
  capability 门控）；易用性清单随 B 落地＋C 随 A 各面解锁；blocks.changes
  逐面升级。B 面切片 cde8ed0 已实质验收入库（第 97 批 2151409）。
- **开放问题 4（集成，自答预填）**：无异议——门序＝024 表态 3 延续适用，
  P3 各面属 M6 T-A 授权范围；M6 门验收与发行仍候 M5 关门门序不变。
- **A4 词面二分收敛落账**：增删/启停二分——增删先行冻结（库面 API 完备
  零未知量），启停词面候 VCC 禁用列表键名真机核实（W25 窗口候办，环境
  域，与 024 表态 (b) vcc.liteDb 核实可同窗）；环境倾向＋核心 A4 殿后无
  异议，两域表态实质一致，构成收敛。
- **后续落地（本文件就此冻结，进展登记归 BOARD #40 行与各树状态文件）**：
  A1 移除面冻结批候核心起草（启动条件全部满足：面序已确认＋环境表态
  收敛已落账）；A2/A3 依次；A4 增删先行、启停候真机核实；A5（create_
  project）候选面候桌面提出入口需求（B 面已合并，条件已满足）；C 面
  随 A 各面冻结逐面解锁。各面实现仍走 013 R5 逐面程序：冻结批→实现
  切片→集成验收。

### 桌面形状核可（A1 TS 面，wt-3，2026-09-19 01:3x）

**应 wt-2 A1 冻结批知会之约**（「接线＋你方形状核可后消费切片逐面
解锁」——形状核可为桌面侧解锁条件）。核可对象＝A1 冻结批 d7f6a57
六件中 TS 面（`packages/contracts/src/application-contract.ts` 026 A1
段），已经第 99 批 eb7d85a/0f93620 实质验收入 main；本核可基于 main
收编世代（c5edb76 合并后 slot/wt-3 树尖 9295743）本机直读＋全链定向
复跑。**结论：核可通过**，附一项连带破裂修复申报：

- **逐项核可**：①两请求接口与收敛词面逐点一致——previewRemove 双键
  闭集（projectPath＋packageIds 显式非空闭列）query 无 commandId
  （014 同构）；applyRemove 三键闭集必携 confirmedDigest＋commandId
  （漂移拒＝recoverable，重预览重确认，诚实纪律 3）。②三臂结果齐：
  plan 携 items/conflicts/removeLegacyFiles/removeLegacyFolders/
  destructive/digest——destructive=true 警示锚（ADR-0006）桌面确认 UI
  可直接消费，权威判定在服务端（014 仲裁第 2 点）；receipt 审计三半
  面（confirmedDigest 回显/requestedPackageIds/removedItems）齐，014
  导入收据先例同构；rejected guard 三值闭集
  preview_drift/package_not_found/execution_failed 与 vua.packages.*
  码族投影关系（guard 值＝code 后缀）明确。③union 登记与守卫在库
  （ApplicationSuccessValueV01 含 PackagesRemoveResultV01；
  isApplicationRequestV01 两段窄化 :2230/:2240）。④
  PackagesChangeItemV01 version/reason 可空＝端口事实如实投影非省略。
  ⑤mock 恒缺席臂两方法维持 P1/P2 纪律（模拟面永不模拟 wire 写回执
  ）——桌面消费切片照缺席臂呈现 unavailable，不预搬 fixture 形状。
- **连带破裂修复申报（核可中发现，桌面域已闭合）**：plan 顶层
  `items` 键与 EnvironmentSnapshotV01 顶层 `items` 在
  ApplicationSuccessValueV01 union 的 `in` 守卫碰撞——renderer
  electron-gateway.ts:133 `"items" in result.value` 收窄不再唯一，
  apps/desktop typecheck 红（PackagesRemovePlanV01 缺 capturedAt 等
  三键）。已修：改用 `capturedAt`（grep 实证全 union 唯一顶层键）收
  窄＋注释锚，desktop 全链复跑绿（typecheck 双 0＋vitest 80 文件
  673/673）。**事实申报：冻结批定向证据链未含 apps/desktop typecheck
  **（contracts 68/68＋provider 32/32＋cargo 面全绿在案，均真；消费
  面检查在桌面域）——本轮桌面侧已补跑闭合，无剩余破裂；程序建议：
  后续冻结批（A2–A5）TS 面定向证据链纳入 `pnpm -C apps/desktop
  typecheck`（跨包 union 扩展有同族碰撞风险，本例即证），桌面侧随批
  配合。
- **blocks.changes 恒假面维持确认**：ready-p1/ready-p2 两态
  changes:false 类型级不变（A1 冻结批未触碰）；packages-port.ts 注释
  「P3 词面落地前类型级恒 false」的「落地前」措辞已过时（A1 词面已
  落地，false 现在的依据＝wire 接线未做），语义与行为正确——措辞随
  A1 消费切片翻转 blocks.changes 时一并更新，不为措辞单独开批。
- **解锁状态**：「接线＋形状核可」两条件中桌面侧条件（形状核可）
  已满足；消费切片解锁余候核心 wire 接线切片（路由/served_
  capabilities 行/词表映射申报）。届时桌面逐面消费切片自报范围＝
  previewRemove 确认链消费＋applyRemove 任务面接入＋blocks.changes
  翻转＋vua.packages.* 三码与复用码四语文案（C 面「错误码文案桌面
  自决随消费切片落地申报」条款）。

### 桌面形状核可（A2 TS 面，wt-3，2026-09-19 04:4x）

**应第 101 批集成 [→桌面] 留言之约**（「A2 形状核可候办：A2 冻结批
8552d2c 已入库，照 A1 先例基于收编世代办理」）。核可对象＝A2 冻结批
8552d2c 22 件中 TS 面（`packages/contracts/src/application-contract.ts`
026 A2 段＋测试 2 例）＋mock 恒缺席臂两方法（orchestrator-provider），
已经第 101 批 80af709 实质验收入 main；本核可基于 main 收编世代
（fba9b87 合并后本树追平壳）本机直读＋定向复跑亲测（04:4x：df C 盘
630G/67% 先查；@vua/contracts check 72/72；apps/desktop typecheck 双
tsconfig exit 0；desktop vitest 80 文件 687/687）。**结论：形状主结构
核可通过**（A2 消费切片桌面侧解锁条件满足，候核心接线批），**附一项
钉法缺口申报候核心闭合**（见末条，不阻塞消费切片首面）：

- **逐项核可（九项一致）**：①两请求接口与冻结词面逐点一致——
  previewInstall＝query 双键闭集（projectPath＋packages，无 commandId
  位，014 同构）；applyInstall＝command 三键闭集（projectPath＋
  packages＋confirmedDigest）＋commandId Kernel 生成位（import-copy/
  A1 先例）。②版本选择语义类型面落死——PackagesPackageRequestV02
  `{packageId, version: string | null}` 必填可空，守卫臂逐行校验
  （version 缺键拒绝＝null 是显式语义非缺省；数字型拒绝＝
  string|null 闭集；空闭列拒绝）。③plan/receipt/rejected 三臂齐——
  PackagesInstallPlanV02 与 v0.1 removePlan 同键集
  （schemaVersion 字面量 `vua.packages-ops/v0.2` 互异可辨析，消费窄
  化按 schemaVersion 字面量在类型面成立——集成留言预判证实）；
  installReceipt（confirmedDigest/requestedPackages/appliedItems）与
  removeReceipt（requestedPackageIds/removedItems）键集互斥类型级
  成立。④guard 三值闭集零新增——`PackagesGuardV02 =
  PackagesRemoveGuardV01` 复用别名，A2 纪律「零新 guard」落死；新信
  封错误码 vua.packages.preview_failed 走信封面不入 rejected 文档，
  类型面无抵触。⑤零 upgrade 动词——变更行复用 PackagesChangeItemV01
  （kind 闭集 install|remove 全集），安装 plan 携冲突触发 remove 行
  无需新形状（ORC-WF-002 类型面零扩）。⑥union 双登记＋两窄化臂——
  ApplicationRequestV01 增两行＋ApplicationSuccessValueV01 增
  PackagesInstallResultV02＋isApplicationRequestV01 两臂（负例：
  preview 携 digest 位拒＝「携即违反」、apply 缺 confirmedDigest 拒、
  请求行词表外键拒）。⑦capturedAt 收窄对 A2 三成员有效性本机证实
  ——全文件 `readonly capturedAt` 唯一（:1946），A2 plan/receipt/
  rejected 三臂均无 capturedAt 顶层键，desktop
  `"capturedAt" in result.value` 收窄不因 A2 成员扩张而破裂（typecheck
  双 0 亲测，与第 101 批合并树终证一致）。⑧mock 恒缺席臂两方法归同
  批缺席纪律（P1/P2/A1——模拟面永不模拟 wire 写回执），消费切片照
  缺席臂呈现 unavailable，不预搬 fixture 形状。⑨TS 测试 2 例与申报
  一一对应（preview 6 断言＋apply 3 断言），词面零变更。
- **钉法缺口申报（核心域归属，桌面不代改）**：协议本双语均宣称
  「同行重复 packageId＝词面违例，即使版本不同（Schema uniqueItems
  钉死精确重复；负例向量与 TS 窄化钉死同 id 唯一规则）」——本席逐
  层核对实况：①Schema `uniqueItems: true` 仅钉整行深度相等（协议本
  自我限定「精确重复」，诚实）；②负例向量 8 例中**无** repeated-
  package-id 负例；③TS 窄化守卫两臂（previewInstall/applyInstall）
  **无** packageId 查重，application-contract.test.ts 2 例亦无同 id
  断言——即宣称三层钉法中「负例向量＋TS 窄化」两层未落地，「同 id
  唯一（异版本）」请求当前无任何机器层拦截（Schema 放行＋TS 放行＋
  wire 候接线批沿用同 Schema 亦放行）。修复建议（核心域三点）：TS
  两臂各补行间 id 唯一校验＋负例向量补 repeated-package-id 一例＋
  consumer 预检计数随之（12→13）＋协议本措辞候补钉后复核。**影响评
  估与解锁边界**：A2 消费切片首面＝行内单包安装（C 面自决先例同
  A1「首面单包」），单行请求不可能重复 id，首面不受缺口影响、照常
  候接线批；**批量多选面在缺口闭合前不得解锁**（诚实边界——UI 不得
  在词面宣称违例的请求形状上放行批量提交）。
- **解锁状态**：A2「形状核可」桌面侧条件满足；A2 消费切片候核心
  wire 接线批（路由两臂 packages.previewInstall/applyInstall＋
  packages.installOps served 行——接线前两方法在 wire 面不存在，
  desktop blocks.changes 安装写入口类型级不可见维持）。缺口闭合随
  核心节拍（接线批前宜闭合，批量面前必须闭合）。

### 桌面形状核可（A3 TS 面，wt-3，2026-09-19 06:0x）

**应第 105 批集成收尾留言之约**（「desktop A3 shape approval due」
——A3 冻结批 0282a66 经 c8239d9 已入库，照 A1/A2 先例基于收编世代
办理）。核可对象＝A3 冻结批 21 件中 TS 面（
`packages/contracts/src/application-contract.ts` 026 A3 段＋测试
1 例 5 断言）＋mock 恒缺席臂（orchestrator-provider），本机直读＋
收编世代（ffd143d 合并后本树追平壳 24bc327）定向复跑亲测（06:0x：
@vua/contracts check 75/75＝72＋本树 A2 消费切片 2＋A3 冻结 1；
apps/desktop typecheck 双 tsconfig exit 0；desktop vitest 80 文件
699/699）。**结论：核可通过**：

- **逐项核可（九项一致）**：①请求接口单键闭集——
  PackagesRegisterCommandV03＝command（commandId Kernel 生成位，
  import-copy/A1/A2 先例）＋params 恰 {packageRoot} 非空串；无
  projectPath（注册只动后端隔离环境，不触项目、不触用户 VCC/ALCOM
  设置）；无 confirmedDigest——携即形状违反（本面无 preview 可漂
  移，用户显式提交即确认，负例 invalid-register-carries-digest 钉
  死）。②registered 收据最小诚实审计形状——三键 {schemaVersion:
  "vua.packages-ops/v0.3", kind: "registered", packageRoot 回显}：
  端口答 Result<(),_> 无载荷，收据只携请求回显别无他物，
  additionalProperties:false 禁止发明（负例
  invalid-register-invented-field 钉死——注册时间戳/package.json
  内容/环境文件路径一律违规）；AlreadyAdded 幂等折叠＝无 added 布
  尔无首次/重复事实（诚实纪律：一个成功事实）。③rejected 臂
  guard 复用 PackagesGuardV02 三值闭集零新增；code 锁
  ^vua\.packages\.（复用码 vua.vpm.local_package_invalid/
  local_package_register_failed 在 detail 原词溯源，永不入 code
  键；负例 invalid-register-rejected-code-outside-family 钉死）。
  ④union 双登记（ApplicationRequestV01/ApplicationSuccessValueV01
  各一行）＋isApplicationRequestV01 窄化臂逐键闭集（缺 packageRoot
  拒/空串拒/发明 projectPath 拒/携 digest 拒）。⑤TS 测试 1 例
  5 断言与冻结批申报一一对应（正例＋缺键＋空串＋发明键＋携
  digest）。⑥mock 恒缺席臂 packages.registerLocalPackage 归 P1
  纪律同款（模拟面永不模拟 wire 写回执）＋mock 测试 1 例。⑦
  capturedAt 收窄对 A3 有效性本机证实——全文件 readonly capturedAt
  唯一（:2002 环境快照），A3 registered/rejected 两成员均无
  capturedAt 顶层键，desktop electron-gateway.ts:135
  `"capturedAt" in result.value` 收窄不因 A3 union 扩张而破裂
  （typecheck 双 0 亲测，A2 先例同法）。⑧向量 2 正 7 负与第 105 批
  登记一致（正＝请求＋registered 收据；负＝answer-plan kind 锁/
  carries-digest/missing-root/empty-root/extra-param projectPath/
  invented-field/code-outside-family）；kind=registered 字面量在
  result union 内唯一，按 kind 消费无碰撞。⑨诚实边界如实：协议本
  明示「词面尚未接线——wire 路由、packages.registerOps served 行
  与信封组装属下一个核心切片」；served 行门控＝新 default accessor
  register_capabilities（default declared-none，VrcGetLib 覆写随
  环境核对切片——覆写前行如实 unavailable）。
- **消费切片核对点登记（非缺口，不阻塞核可）**：v0.3 行 wire 信封
  常量协议本未载明（A2 协议本曾载信封 "0.2"）——信封组装归下一核
  心接线切片，桌面消费切片窄化器按接线批实际落地面核对，不猜测；
  A3 消费切片桌面侧解锁条件＝「接线批＋本形状核可」，候核心接线批
  后照逐面程序领取（blocks 演进纯增量键照 A2 同法，消费切片时申
  报）。
- **解锁状态**：A3「形状核可」桌面侧条件满足；桌面无其他在途——
  A2 消费切片已交付候验收（wt-3 树尖），A3 消费切片候核心接线批。

### 桌面形状核可（A4 TS 面，wt-3，2026-09-19 08:1x）

**应第 108 批集成 [→桌面] 留言之约**（「A4 形状核可解锁条件成就
——A4 冻结批 28c63fa 本批入库，照 A1/A2/A3 形状核可先例基于收编
世代办理」）。核可对象＝A4 冻结批 29 件中 TS 面（
`packages/contracts/src/application-contract.ts` 026 A4 段＋测试
1 例 10 断言）＋mock 恒缺席臂（orchestrator-provider 三方法归 P1
unavailable 臂＋3 测试行），本机直读＋收编世代（本树追平壳
1fd76a1 吸收 f2586d4 后）定向复跑亲测（08:1x：@vua/contracts
check 77/77；apps/desktop typecheck 双 tsconfig exit 0；desktop
vitest 80 文件 707/707）。**结论：核可通过**：

- **逐项核可（九项一致）**：①请求接口三命令闭集——
  PackagesAddRemoteRepoCommandV04＝command（commandId Kernel 生成
  位，import-copy/A1/A2/A3 先例）＋params 恰 {url, name} 双键非
  空；PackagesAddLocalRepoCommandV04＋params 恰 {path, name} 双键
  非空（无网络段）；PackagesRemoveRepoCommandV04＋params 恰
  {repoId} 单键非空（稳定行柄，索引寻址不冻结）；三方法均无
  projectPath（订阅面只写后端隔离环境，013 project_not_found 复
  用对本面不适用）；均无 confirmedDigest——携即形状违反（本面照
  A3 同律破 preview/apply 对偶：远端订阅天然含清单拉取网络段，
  preview 只会是伪装成更安全首跳的第二跳网络往返；无既有状态摘
  要可绑定，诚实失败＝执行时端口答 repo_not_found；负例
  invalid-add-remote-carries-digest/carries-project-path 钉死）；
  首期词面不收 HTTP 头/凭据传输（未来收凭据需另立安全裁决）。
  ②收据最小诚实审计形状——repoReceipt 双互斥变体：remote 五键
  {schemaVersion: "vua.packages-ops/v0.4", kind: "repoReceipt",
  repoType: "remote", url 回显, name 回显}／local 五键 {同前,
  repoType: "local", path 回显, name 回显}；removed 三键
  {schemaVersion, kind, repoId 回显}：端口答 Result<(),_> 无载荷，
  收据只携请求回显别无他物，additionalProperties:false 禁止发明
  （负例 invalid-result-invented-field 钉死——添加时间戳/行位/
  清单内容/被删行快照一律违规；removed 回显即审计链，不发明行快
  照）；键集与一切前代收据臂互斥。③rejected 臂 guard 复用
  PackagesGuardV02 三值闭集零新增（A4 不加 guard）；四端口码
  vua.vpm.repo_invalid/repo_not_found/repo_fetch_failed/
  repo_write_failed 全折 execution_failed 携原码 detail 溯源；
  code 锁 ^vua\.packages\.（负例 result-rejected-code-outside-
  family 钉死）；桌面回落面三值投影 A1 removeGuardKey 钉例同款
  可直接复用；**添加面不宣称幂等**——与 A3 AlreadyAdded 折叠刻
  意不同（库面守卫拒绝重复如实 repo_invalid 折 rejected），桌面
  未来消费面将如实呈现拒绝，不发明幂等成功。④union 双登记（三
  命令入 ApplicationRequestV01、三结果 union 入
  ApplicationSuccessValueV01）＋isApplicationRequestV01 三窄化臂
  逐键闭集（顶键七键 hasExactKeys＋params 精确键集＋非空串；缺
  键/空串/携 digest/携 projectPath/走私 commandId 拒）。⑤TS 测
  试 1 例 10 断言与冻结批申报一一对应。⑥mock 恒缺席臂三方法归
  P1 unavailable 臂（模拟面永不模拟 wire 写回执）＋3 测试行。⑦
  capturedAt 收窄对 A4 有效性本机证实——application-contract.ts
  全文件 readonly capturedAt 唯一（:2121 downloads 面），A4 六个
  新成员（三命令＋remote/local/removed/rejected 四收据）均无
  capturedAt 顶层键；桌面 capturedAt 窄化点在
  project-detection-model.ts（project.detect 快照面）与
  gateway-router.test.ts 夹具，与 packages-ops union 零交集，窄
  化不因 A4 union 扩张而破裂（typecheck 双 0 亲测，A2/A3 先例同
  法）。⑧向量 6 正 11 负与第 108 批登记一致（正＝三请求＋
  remote/local 添加收据＋removed 收据；负＝两 carries 类/缺
  url/缺 name/空 path/extra-param/缺 repoId/空 repoId/answer-plan
  kind 锁/invented-field/code-outside-family）；kind=repoReceipt/
  removed 字面量在 result union 内唯一按 kind 消费无碰撞；
  schemaVersion 窄化规则词面载明（plan/receipt 形状四世代同键集
  ——按 schemaVersion 字面量窄化不按键集，result.schema.json
  digest 注记原文）。⑨诚实边界如实：词面已冻结未接线——wire 路
  由、packages.repoOps served 行与信封组装属下一核心接线切片
  （wt-2 已交付候验收 3d4b667）；served 行门控＝新 default
  accessor repo_write_capabilities 三独立位（default
  declared-none，VrcGetLib 覆写随环境核对切片——覆写前行如实
  unavailable，桌面消费区块诚实缺席不渲染）；门按方法绝不按面
  （后端可只服务子集）；启停（enable/disable）不在任何已冻结词
  面内（候 W25 VCC 禁用列表键名真机核实）——桌面不发明启停入
  口；重排不在本面。
- **消费切片核对点登记（非缺口，不阻塞核可）**：v0.4 wire 信封
  常量协议本 0.4 未载明（协议本明文「wire 信封常量在接线批载明
  （A3 先例……0.4.x 修订载明常量——消费面按落地面对照，绝不猜
  测）」）——A4 消费切片窄化器按接线批实际落地面核对，不猜测；
  A4 消费切片桌面侧解锁条件＝「本形状核可＋核心接线批入库」（双
  前置，A3 同构）。
- **解锁状态**：A4「形状核可」桌面侧条件满足（本节）；桌面无其
  他在途——A3 消费切片已验收入库（第 108 批 item 2），A4 消费切
  片候核心接线批入库。
