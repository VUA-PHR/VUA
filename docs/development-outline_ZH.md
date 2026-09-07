# VUA 开发计划大纲

[English](development-outline_EN.md) | [简体中文](development-outline_ZH.md)

> 文档版本：2.0.4
> 状态：已接受
> 权威语言：简体中文（EN 为镜像，同步至 2.0.4）
> 范围：v0.4 重建基线至正式版 `1.0.0`
> 规范效力：只安排已接受工作，不扩展产品边界

## 目标与基线

自 2026-09-06 起，工作按**单一集成分支 + 垂直切片**组织（结构性裁决见治理改良方案 §8；
协调机制见 `collab/README.md`）。M 是产品门序列；执行侧自 2.0.0 起划分为**六个角色**
（见下节），取代原 M/F/B 三车道与过渡期的 F/B 双角色。

M 门 = 集成分支上的 tag + 验收清单：门清单全绿后打 tag、发布发行说明。M 门按顺序关闭；
前一 M 门确认的契约和迁移结果是下一阶段的共同基线；不依赖未决契约的工作可以提前在切片
中推进，但不能绕过对应 M 门形成产品发行。

以下为计划接受时（2026-09-04，v0.4 重建基线）的起始状态快照；各门最新验收状态见对应
章节与 `collab/BOARD.md`：

- `_references/kimi-desktop-5870d0c` 只作为 React 表现层资产提取来源；
- `unity/Packages/com.ph-r.vua`、`schemas/unity-bridge/v1` 与 Orchestrator Bridge adapter 已完成第一轮
  迁移和本地验证；
- `crates/orchestrator` 是可测试的 Rust 应用核心，JSONL journal 与 StateFile 仍是过渡实现；
- Electron 壳、版本化 Gateway、SQLite 权威任务状态与真实纵向切片仍需按本计划完成；
- 后端工作树已经完成 `.unitypackage` 转本地 VPM 包的可行性 Spike：隔离 Unity 转换、独立项目发现
  包和加载指定资源已有证据；通过 VUA `vrc-get` 包管理器完成安装仍是 B3 前的关闭项；
- 运行时工具集成、社区插件执行与插件市场在正式版 `1.0.0` 前不实施。

## 执行角色（六角色）

角色是**责任与所有权的划分**，不是分支、不是工作树、不是固定的人或会话。同一代理会话在
一个切片内可以分饰多个角色；跨角色边界的行为仍走版本化契约。角色与代码所有权的映射
（crate 布局见 `docs/architecture/system_ZH.md`）：

| 角色 | 职责域 | 代码/文档所有权 |
| --- | --- | --- |
| **集成**（Integration） | M 门验收、发行与版本、治理文档、合并与冲突裁决、REGISTRY/BOARD 维护、CI | `main` 分支、`docs/`、`collab/`、（remote 后）`.github/` |
| **桌面**（Desktop） | Electron Main/Preload、React Renderer、设计系统、远程网页、桌面 Overlay | `apps/desktop`、`packages/design-system`、`packages/contracts`（TS 面） |
| **核心**（Core） | 任务运行时、取消/恢复、应用用例、域端口、应用契约类型、Provider 组合根 | `crates/orchestrator`、`crates/provider-host`、`packages/orchestrator-provider`；application-contract、task-store、provider-process 协议 |
| **产线**（Production） | Unity Bridge、素材入口执行、装配、Build Record 产出、Unity 侧 C# 包 | `crates/unity-bridge`、`unity/Packages`、`schemas/unity-bridge`、`schemas/amf-production` |
| **数据**（Data） | BDL、下载事件、仓储导入/维护、素材检查 | `crates/bdl-store`、`crates/acquisition`、`schemas/bdl*`、`schemas/bdl-queries`、`schemas/download-events` |
| **环境**（Environment） | 项目/环境适配器、`vrc-get`、ALCOM/VCC 兼容、环境检测 | `crates/project-manager`、核心内 `environment*`（暂，见 `collab/proposals/004`） |

责任规则：

1. **Schema 冻结责任归域角色**：数据域 schema 由数据角色冻结，产线域由产线角色冻结，跨域
   应用契约由核心角色冻结；争议由集成角色仲裁或升级用户裁决。
2. **桌面角色负责 TS 面登记**：契约落地后由桌面角色登记 contracts 类型面与 Gateway 路由。
3. 每个任务在文档中**恰好一个负责角色**（协作方另列）；负责角色对验收证据负责。
4. 历史文档中的 F/B 编号保留备查：F≈桌面，B 按域分入核心/产线/数据/环境。

## 共同执行纪律

1. 跨前后端行为先确定版本化应用契约，再由相关角色在同一切片内实现和测试。
2. 各角色的测试可以使用模拟对端；M 门必须使用该阶段的真实两端制品完成整合验证。
3. 修改型切片覆盖适用的 Inspect、Plan、Confirm、Snapshot、Execute、Validate、Recover，并验证
   取消、重试、漂移和重启恢复。
4. 每个 M 门同步维护匹配的 `_EN.md` / `_ZH.md` 文档、迁移证据、协议或 Schema 版本、发行说明和
   唯一产品版本来源。
5. 仓库与云端 CI 测试只使用结构具有代表性、但不含真实商品或用户内容的合成网页、项目与文件；
   本地只读兼容性测试可以访问公开 BOOTH 页面；本地 Unity 集成与冒烟测试可以使用开发者合法取得的
   素材。真实会话、订单、付费素材、用户项目、网页捕获、测试配置和输出不进入仓库或云端制品。
6. F/B 历史编号与任务分解不更新产品版本；只有 M 门更新产品 SemVer 和 Git 发行状态。
7. 协调结论只以 `collab/` 为准（机制见 `collab/README.md`）；`docs/plans/` 的成对信件协调模式
   已废止，plans/ 仅作本地草稿区，不产生协调效力。

## 当前窗口（M3 收尾与 M4 在途任务）

> 快照日期：2026-09-08（2.0.4 更新：W12 全链闭环〔服务面+provider 路由+消费端对齐〕；
> W17 观察管线写入侧入表〔数据三次排期请求，集成裁决〕；#7 本例关闭/#8 关闭，CI 三
> 徽章全绿）。
> 本窗口的全部任务已分解到角色；完成后由集成角色验收并推进 M3/M4 门。

| # | 任务 | 负责角色 | 协作 | 锚点/验收 |
| --- | --- | --- | --- | --- |
| W1 | I-1 真 Unity 矩阵（16 格：双路径 × 八生命周期） | 产线 | 核心 | `docs/plans/m3-i1-real-matrix-plan_ZH.md`；**M3 唯一剩余门项**，需真机窗口与合法素材环境变量 |
| W2 | 帧协议 v0.1 handshake 补 Schema + 双端向量 | 核心 | 桌面 | `collab/proposals/001-handshake-schema.md` |
| W3 | bdl-queries v0.3 TS 镜像补 `ageRestriction` + 回归测试 | 数据 | 桌面 | `collab/proposals/002-age-restriction-mirror.md` |
| W4 | generate-VPM / delete-originals / set_artifact_mode 补测试 | 数据 | — | `collab/proposals/003-generate-vpm-tests.md` |
| W5 | environment_managers 拆分裁决与执行 | 环境 | 核心 | `collab/proposals/004-environment-managers-split.md` |
| W6 | F4-7 Warehouse/获取走查闭环 | 桌面 | 数据 | F4 切片现场 |
| W7 | F4-8 验收矩阵 + BOOTH 登录/购买允许清单审阅 | 桌面 | 数据、集成 | 门验收清单 |
| W8 | B4 生成流收尾 + 产物模式三命令协议登记 | 数据 | 核心 | 协议冻结硬前置（Schema+向量+消费测试） |
| W9 | F4-9 产物模式三命令 UI | 桌面 | 核心 | 依赖 W8 协议冻结 |
| W10 | production-use-case v0.1 冻结（M3 验收时） | 核心 | 产线、桌面 | M3 候选 → 冻结；按冻结硬前置 |
| W11 | M3 关闭：v0.5.0 tag、remote 建立、CI 三 workflow、Release | 集成 | 全部 | **✅ 已执行完成（2026-09-07）**：v0.5.0 tag+remote+回填 v0.4.0–v0.4.2 tags+GitHub Release+glm/* 清理；CI 三 workflow 落地（schema-vectors 绿；rust/ts 首跑暴露 #7/#8 域内缺陷，BOARD 跟踪） |
| W12 | catalog 观察管线服务面（`catalog.list/detail/status` 的 Rust 组装，词表已随 bdl-queries v0.3 冻结） | 数据 | 桌面 | **✅ 全链闭环**：服务面 6062a13＋provider 路由 80ad6e7＋消费端对齐 5fd8c6b（应用码+四语键） |
| W13 | 仓储布局重构（自适应列数+右侧详情区） | 桌面 | — | **✅ 已合并（88b4551）**；U7 验收走查待用户批 |
| W14 | bdl-commands v0.2 升版（两级选项语义+持久化位置决策） | 数据 | 桌面 | **✅ 已交付冻结（bdl-commands v0.2，6062a13）**；路由登记待核心 |
| W15 | 设置-实验性完整形态（两级选项入口） | 桌面 | 数据 | **已解锁**（W14 冻结+依赖入 main）；验收=用户走查 |
| W16 | 设计标准同步（通知中心/仓储布局/实验性语义） | 桌面 | — | **✅ 已交付（设计标准 v0.6.2，88b4551）** |
| W17 | 观察管线写入侧（观察数据写入 BDL products 表；伴随 errors.catalog.* 在 catalog 视图的透传呈现接线） | 数据 | 桌面 | 锚点=M4 收尾批或 M5 开窗首批；写入侧落地前 catalog 持续诚实空态（数据三次排期请求，集成裁决 2026-09-08 入表） |

## M 序列：Main 整合与交付

### M0（v0.4.0）：重建基线封口

> 验收状态：**已通过（2026-09-04）**。Unity `2022.3.22f1` EditMode 14/14、幂等装配、Batchmode
> `inspect_project`、Rust workspace 187 项、Clippy、TypeScript 检查/测试/生产构建及 78 份 Markdown
> 的相对链接检查均通过；产品版本保持 `0.4.0`。

- **文档**：固化产品边界、非模块化宿主结构、Electron/Orchestrator/Unity 所有权、Unity
  `2022.3.22f1` 兼容政策和迁移权威顺序；
- **迁移**：完成 Unity Bridge v1 与表现层资产分级台账，明确保留行为、拒绝假设、许可和验证；
- **整合**：确认当前 C# Package、Schema、Rust adapter 和 Electron 资产均不依赖旧工作树或机器
  绝对路径；
- **交付**：以本地 Unity EditMode、幂等装配、Batchmode `inspect_project` 与文档链接检查关闭基线，
  统一产品版本为 `0.4.0`。

### M1（v0.4.1）：Electron 与后端迁移基线

> 验收状态：**已通过（2026-09-04）**。Electron Main 通过 Gateway 启动并调用受控 Mock Provider，
> capability 值来自 Provider 报告；24 项 TypeScript 测试、生产构建、Electron 进程启停与真实远程
> 权限冒烟通过；产品版本和双语发行说明已更新到 `0.4.1`。

- **文档**：接受 Electron 安全基线、设计规范 v0.6.1、Gateway 最小边界和后端迁移清单；
- **迁移**：合并 F1 的最小应用壳与 B1 的 Orchestrator/Unity 基线整理，不携带 Tauri 私有机制；
- **整合**：启动 Electron Main、Preload、Renderer，并以受控测试 Provider 验证 Gateway 边界；
- **交付**：类型、单元、生产构建、Electron 启停和远程页面权限冒烟通过，更新版本与发行说明到
  `0.4.1`。

### M2（v0.4.2）：应用契约与持久任务闭环

> 验收状态：**已通过（2026-09-04）**。Electron 经 Gateway 调用受监督真实 Provider 进程（帧协议 v0.1、单实例锁、Windows 进程树遏制、SQLite 权威任务状态）；重载、多窗口、暂时断连、进程关闭与重启恢复五项交付以 `smoke:m2-deliverables` 11 项检查全绿验收（证据本地保留）；应用契约 v0.1 冻结为稳定 Gateway v1；TypeScript 302 项、Rust 48 项测试（6 项真实素材人工测试按设计忽略）与 Clippy、全部质量门通过；产品版本 0.4.2 与双语发行说明已就位。

- **文档**：固化 Gateway v1、Provider 生命周期、SQLite 权威状态和所选 Orchestrator 托管 ADR；
- **迁移**：将 JSONL/StateFile 行为转为 SQLite 特征与迁移测试，不把过渡格式继续扩展成契约；
- **整合**：连接 F2 的任务交互与 B2 的真实 Provider、任务、取消和恢复能力；
- **交付**：Renderer 重载、多窗口、暂时断连、进程关闭和重启恢复通过，更新版本与发行说明到
  `0.4.2`。

独立 `v0.4.3` 架构 Spike 取消。Core 组合框架不再进入产品；Orchestrator 托管比较由 B2 完成，
其结果由 M2 接受并由 M3 使用。

### B3 前置 Spike（无产品版本）：VPM 素材包制作与安装路径

该 Spike 为现有“将 `.unitypackage` 直接导入 VUA 控制的 Unity 项目”保留并行路径：保持来源包
不变，在隔离的 Unity `2022.3.22f1` 暂存项目中制作本地 VPM 包，再通过 VUA 的 `vrc-get` 包管理器
安装到目标项目。包制作、包安装与公开发布是三个独立用例；M3 只接收 `local-reusable` 制作与安装，
`publishable` 校验和仓库发布另行安排。

对后端工作树 `_local_b3/vpm-spike/SPIKE_FINDINGS.md` 的审阅接受以下可行性证据：

- Unity 完成来源包导入后，在新进程中转换，可以形成明确的阶段边界；
- 生成包包含根级 `package.json`，独立验证项目能够发现该包并加载指定资源；
- 离线解析可以生成候选包，但缺少 Unity 导入、编译、序列化引用与语义验证，因此保持实验性降级结果；
- 隔离项目保护用户项目状态，但其中的 Editor 脚本仍以开发者的 Windows 权限运行。

Spike 在进入 B3 生产实现前关闭以下缺口：

1. 使用最小 VUA `vrc-get` 适配器把生成包实际安装到全新验证项目；直接复制到 `Packages/` 只作为
   制作可行性证据；
2. 在两个全新运行目录重复转换并比较规范化包清单与归档摘要，同时比较来源文件执行前后摘要；
3. 为每个 Unity 进程定义超时、取消、退出码、残留进程清理、磁盘中断恢复、版本化结果 Schema 和
   稳定结果码；
4. 决议含 Editor 脚本输入的扫描、警告、逐次确认和拒绝策略；
5. 明确包 ID 所有权、依赖声明、Editor/Runtime 布局、硬编码 `Assets/` 路径和许可证证据；指定资源
   加载成功只证明最小结构有效，不代表整个 Avatar 或衣装语义正确。

### M3（v0.5.0）：首个 Electron—Orchestrator—Unity 纵向交付

> 进度注记（2026-09-06）：T1（M3 修订路径）、T2（production 面 v0.2 登记）、I-3（三车道统一
> 合并入 main）均已完成；本门剩余 I-1 真 Unity 矩阵（当前窗口 W1），完成后按 W11 关闭本门。

- **文档**：记录首个端到端用例、错误/恢复语义、最小 Build Record、Bridge 操作覆盖，以及直接
  导入与本地 VPM 制作/安装的两条素材入口契约；
- **迁移**：只提取该切片所需的旧页面行为和 Unity 语义，完成对应迁移台账；
- **整合**：合并 F3 与 B3，以合成 Avatar、一件合成衣装和全球版 Unity `2022.3.22f1`，分别通过
  `.unitypackage` 直接导入和本地 VPM 制作后由 VUA 包管理器安装两条路径跑通 Inspect 至 Recover；
- **交付**：两条路径均通过成功、取消、漂移、超时、Bridge 拒绝、回滚成功/失败和幂等重放；VPM
  结果明确区分 `unityValidated` 与实验性离线输出，更新版本与发行说明到 `0.5.0`。

任务分解（全部完成，历史见 `collab/BOARD.md` 与提交历史）：

| 任务 | 负责角色 | 状态 |
| --- | --- | --- |
| T1 七方法 Schema + 固定向量（amf-production v0.2） | 产线 | ✅ 已交付 |
| T2 production 面 v0.2 TS 登记批 | 桌面 | ✅ 已交付 |
| I-3 分支整合 | 集成 | ✅ 2026-09-06 完成 |
| I-1 真 Unity 矩阵 | 产线 | ✅ 2026-09-07 完成（16/16 格真机通过，合并 5ccace6；证据 `_local_w1/`） |

### M4（v0.6.0）：Warehouse、素材获取与 BDL

- **文档**：固化远程内容、Session、下载端口、LocalArtifact 和最小 BDL 持久格式；
- **迁移**：关闭素材浏览、下载、Warehouse 页面与来源数据的迁移项；
- **整合**：连接 F4 的隔离浏览/下载界面与 B4 的 AMF 素材获取、检查和 BDL 映射；
- **交付**：用户授权下载经可恢复任务和本地检查进入 Warehouse，更新版本与发行说明到 `0.6.0`。

任务分解（2026-09-07 M4 分配核对：历史进度逐项核实后更新）：

| 任务 | 负责角色 | 协作 | 状态 |
| --- | --- | --- | --- |
| 远程内容/Session/下载端口与隔离浏览界面 | 桌面 | — | ✅ 已交付（F4-2/3/4/6），走查闭环（W6/W7） |
| Warehouse 列表/筛选/详情/检查状态呈现 | 桌面 | 数据 | ✅ 已交付（F4-5/6），走查闭环；布局重构见 W13 |
| BDL 最小持久格式与 Warehouse 映射 | 数据 | 核心 | ✅ 已交付（bdl v0.1、bdl-queries v0.3） |
| 下载事件消费、重试恢复与任务闭环 | 数据 | 核心 | ✅ 已交付（含 W4 补测） |
| 素材获取用例与 LocalArtifact 检查流水线 | 数据 | 核心 | ✅ 已交付（artifact_inspection） |
| 生成流（generate-VPM 等）与三命令协议 | 数据 | 核心 | ✅ 已交付（W8/W9：bdl-commands v0.1.1 全链） |
| catalog 观察管线服务面 | 数据 | 桌面 | ✅ 全链闭环（W12：服务面 6062a13＋路由 80ad6e7＋消费端 5fd8c6b） |
| 观察管线写入侧（products 表写入）＋呈现接线 | 数据 | 桌面 | W17（M4 收尾批或 M5 开窗首批；2026-09-08 集成裁决入表） |
| 仓储布局重构（自适应列数+右侧详情区） | 桌面 | — | ✅ 已合并（W13，88b4551）；验收走查待用户批 |
| bdl-commands v0.2 升版（两级选项语义+持久化位置决策） | 数据 | 桌面 | ✅ 已交付冻结（W14，bdl-commands v0.2） |
| 设置-实验性完整形态（两级选项入口） | 桌面 | 数据 | W15 已解锁（依赖 W14 ✅）；验收=用户走查 |
| 设计标准同步（通知中心/仓储布局/实验性语义） | 桌面 | — | ✅ 已交付（W16，设计标准 v0.6.2） |
| 门验收与发行 | 集成 | 全部 | M3 已关闭（v0.5.0）；M4 验收按门序，剩 W15 与 W12 收口 |

### M5（v0.7.0）：Recipe 与 AMF 生产主线

- **文档**：固化 Recipe、Local Resolution、Build Record 与新增 Unity Bridge 操作；
- **迁移**：完成 Recipe/Warehouse 表现模型和合法本地素材测试路径的迁移；
- **整合**：连接 F5 工作台与 B5 解析、计划、Unity 作业、验证和恢复；
- **交付**：一个 Avatar 加一件衣装的合法自有本地冒烟路径可复现，更新版本与发行说明到 `0.7.0`。

任务分解：

| 任务 | 负责角色 | 协作 |
| --- | --- | --- |
| Recipe v0.3、Local Resolution、版本锁 | 核心 | 数据 |
| Unity Bridge 操作扩展（dry-run、幂等、恢复）与 C# 侧实现 | 产线 | 核心 |
| 完整 Build Record（计划差异、证据摘要） | 核心 | 产线 |
| 兼容/缺失证据模型 | 数据 | 核心 |
| Recipe/Assembly 工作台（三视图共享选择与领域语义） | 桌面 | 核心 |
| 合法自有素材冒烟路径与复现 | 产线 | 集成 |
| 门验收与发行 | 集成 | 全部 |

### M6（v0.8.0）：项目管理与环境部署

- **文档**：固化 `vrc-get`、ALCOM/VCC 项目兼容矩阵、环境诊断和实验性 EAC 恢复边界；
- **迁移**：关闭旧环境检查、项目识别和部署引导的可保留行为；
- **整合**：连接 F6 的引导/计划/确认页面与 B6 的项目、环境、网络、磁盘和进程适配器；
- **交付**：三条项目路径诚实报告能力，新用户可完成最小生产环境准备，更新版本与发行说明到
  `0.8.0`。

任务分解：

| 任务 | 负责角色 | 协作 |
| --- | --- | --- |
| 通用 `vrc-get` 项目与包管理路径 | 环境 | 核心 |
| ALCOM/VCC 能力检测与兼容矩阵 | 环境 | 桌面 |
| Unity/VRChat/SteamVR 环境检查、网络/磁盘/残留进程失败处理 | 环境 | 核心 |
| EAC 实验性恢复适配器（先出边界裁决稿） | 环境 | 集成（裁决） |
| F6 引导/计划/确认页面与逐次警告确认 | 桌面 | 环境 |
| 门验收与发行 | 集成 | 全部 |

### M7（v0.9.0）：Inspection、Release 与桌面 Overlay

- **文档**：固化检查证据、Release/Build Record 浏览、官方 SDK 交接和桌面 Overlay 快照边界；
- **迁移**：关闭报告、成品展示和桌面浮层的相关迁移项；
- **整合**：连接 F7 的 Inspection/Release/桌面 Overlay 表面与 B7 的报告、快照和只读服务；
- **交付**：生产结果可复查、可恢复并交接官方上传，桌面 Overlay 故障不阻断桌面主线，更新版本到
  `0.9.0`。

VR Dashboard/VR Overlay 不进入本门与 `1.0.0`（用户裁决，2026-09-06）；方向锚点见
「`1.0.0` 之后」节 v1.1。

任务分解：

| 任务 | 负责角色 | 协作 |
| --- | --- | --- |
| 检查证据（功能、性能、依赖、光照、上传准备度） | 产线 | 核心 |
| 报告、快照与只读服务（桌面 Overlay Surface） | 核心 | 桌面 |
| Inspection/Release 页面与官方 SDK 交接 | 桌面 | 产线 |
| 桌面 Overlay 收尾（只消费稳定快照与语义动作） | 桌面 | 核心 |
| 门验收与发行 | 集成 | 全部 |

### M8（v0.10.0）：Beta 1 功能与契约冻结

- **文档**：冻结 `1.0.0` 功能集合、公开契约、兼容范围和目录风险门；
- **迁移**：完成所有进入 `1.0.0` 的 Schema、数据库与配置迁移路径；
- **整合**：合并 F8/B8 的功能收口、性能基线和 Provider 生命周期压测；
- **交付**：完整产品路径可启动、降级、关闭和恢复，目录风险门无 `pending`，更新版本到 `0.10.0`。

任务分解：

| 任务 | 负责角色 | 协作 |
| --- | --- | --- |
| 各域 Schema/数据库/配置迁移路径冻结 | 数据、产线、环境（各域） | 核心 |
| `1.0.0` 应用契约冻结 | 核心 | 桌面 |
| 页面路径、错误/空态、国际化与性能缺口收口 | 桌面 | — |
| Provider 生命周期压测与性能基线 | 核心 | 产线 |
| 目录风险门 `vua.risk-gate/v1` 执行 | 集成 | 全部 |
| 门验收与发行 | 集成 | 全部 |

### M9（v0.11.0）：Beta 2 恢复、安全与发行验证

- **文档**：完成安装、更新、回滚、诊断脱敏、安全、兼容与支持范围说明；
- **迁移**：演练升级、降级、备份、卸载保留和损坏恢复；
- **整合**：合并 F9/B9 的可访问性、性能、安全、恢复与合法自有冒烟矩阵；
- **交付**：只剩发行候选缺陷；需要时发布 `1.0.0-rc.1`，产品版本更新到 `0.11.0`。

任务分解：

| 任务 | 负责角色 | 协作 |
| --- | --- | --- |
| 升级/降级/备份/损坏恢复演练 | 核心 | 环境 |
| 可访问性、键盘、屏幕阅读器、缩放、DPI 验证 | 桌面 | 集成 |
| 诊断脱敏与安全审计 | 核心 | 集成 |
| 合法自有素材冒烟矩阵 | 产线 | 集成 |
| 安装/更新/回滚与卸载保留 | 集成 | 环境 |
| 门验收与发行 | 集成 | 全部 |

### M10（v1.0.0）：稳定版发布

- **文档**：完成四语 README、双语开发文档、Release Notes、Apache-2.0/NOTICE、贡献与支持入口；
- **迁移**：验证所有受支持旧版本到 `1.0.0` 的数据、配置和项目迁移；
- **整合**：锁定 F10/B10 制品、安装包、Provider、Unity Package、协议与诊断版本；
- **交付**：Windows CI、签名、安装、更新、回滚、许可证和完整冒烟门通过，发布 `v1.0.0`。

任务分解：

| 任务 | 负责角色 | 协作 |
| --- | --- | --- |
| 依赖与制品锁定（Electron/Rust/Unity Package/第三方） | 集成 | 全部 |
| 签名安装包与更新制品、CI 冒烟门 | 集成 | 核心 |
| 四语 README 与 Release Notes | 集成 | — |
| 受支持旧版本迁移验证 | 核心 | 数据 |
| 发布 `v1.0.0` | 集成 | 全部 |

## 历史切片记录（F/B 序列）

F/B 序列是六角色制之前的责任划分记录，物理车道已于 2026-09-06 废止。F0–F4 与 B0–B4 已交付
（对应 M0–M2 门与 M3/M4 在途工作）；F5–F10 与 B5–B10 的内容已并入上文 M5–M10 的任务分解表，
以下原文保留备查。角色映射：F≈桌面；B 按域分入核心/产线/数据/环境。

### F 序列（F≈桌面角色）

- **F0 表现层资产分级**（已交付）：提取 React 页面模型、i18n、可访问性、Token 和基础组件；
  登记迁移目标，拒绝 Tauri 窗口、IPC、权限与旧数据契约。
- **F1 Electron 桌面基线**（已交付）：Electron Main、Preload、React Renderer、Vite、设计系统和
  最小导航壳；Preload 只暴露显式 Gateway；远程测试页面无法获得 Node.js 或本地 Gateway。
- **F2 Gateway 客户端与任务体验**（已交付）：类型化 Gateway client、环境只读快照、任务中心、
  提交/观察/取消、重载恢复、多窗口同步和明确断连状态。
- **F3 首个生产纵向页面**（已交付）：检查结果、计划审阅、确认、实时进度、结构化诊断、恢复
  结果和最小 Build Record 展示。
- **F4 远程素材与 Warehouse**（大部分已交付，收尾见当前窗口 W6–W9）：Main 管理的
  `WebContentsView`、隔离 Session、权限/导航/下载交互、Warehouse 列表与 LocalArtifact 检查状态；
  Renderer 不持有 Cookie、令牌或 Electron 私有对象。
- **F5 Recipe 与 Assembly 工作台**：见 M5 任务分解表。
- **F6 项目与环境页面**：见 M6 任务分解表。
- **F7 Inspection、Release 与桌面 Overlay**：见 M7 任务分解表。
- **F8 Beta 1 前端冻结**：见 M8 任务分解表。
- **F9 Beta 2 前端验证**：见 M9 任务分解表。
- **F10 稳定版前端制品**：见 M10 任务分解表。

### B 序列（按域分入核心/产线/数据/环境）

- **B0 Unity Bridge 与 Orchestrator 迁移封口**（已交付）：Bridge v1 Schema、C# Package、合成
  固定实例、本机 EditMode、幂等装配和 Batchmode `inspect_project`。
- **B1 后端应用契约基线**（已交付）：Command/Query/Event/Task/Capability/错误/revision/取消
  边界；可替换 Provider 接口和模拟适配器。
- **B2 持久任务与托管决议**（已交付）：SQLite 权威任务状态、取消、幂等、事务后事件和重启
  恢复；受监督进程托管 ADR。
- **B3 首个 Orchestrator—Unity 用例与双素材入口**（已交付，验证收尾见 W1）：指纹、计划、
  快照、版本化 Bridge 作业、验证、恢复和最小 Build Record；双素材入口。
- **B4 素材获取与 BDL**（大部分已交付，收尾见 W4/W8）：AMF 素材获取用例、下载事件规范化、
  来源关联、重试恢复、LocalArtifact 检查、Warehouse 映射和最小 BDL SQLite Schema。
- **B5 Recipe 与生产扩展**：见 M5 任务分解表（Recipe v0.3 定型后 v0.2 整体废弃，不建迁移器）。
- **B6 项目与环境适配器**：见 M6 任务分解表。
- **B7 Inspection、Release 与桌面 Overlay 服务**：见 M7 任务分解表。
- **B8 Beta 1 后端冻结**：见 M8 任务分解表。
- **B9 Beta 2 后端验证**：见 M9 任务分解表。
- **B10 稳定版后端制品**：见 M10 任务分解表。

## `1.0.0` 之后（非承诺展望）

以下方向仅为锚点，**均非承诺**。每个方向启动前必须按现行纪律逐项建立独立的 M/切片计划与
接受决策；本表不产生产品需求。

| 版本锚点 | 方向 |
| --- | --- |
| v1.1 | 覆盖层（VR Overlay 及覆盖层体系） |
| v1.2 | 原生集成（面捕、动捕等集成运行时） |
| v1.3 | 插件系统（执行、目录/市场治理） |
| v1.4 | Avatar VN3 清洗建库 |
| v1.5 | Avatar 兼容性清洗建库 |

运行时工具集成、社区插件执行与插件市场在正式版 `1.0.0` 前不实施（产品边界既定）。

## 文档变更日志

- 2.0.4（2026-09-08）：W12 全链闭环落表（服务面＋provider 路由＋消费端对齐 5fd8c6b，
  消费端发现并修复 miss 误报 not-connected 的不诚实映射）；增补 W17 观察管线写入侧
  （含 errors.catalog.* 呈现接线，数据桌面协作）——数据三次排期请求，集成裁决入表
  （M4 收尾批或 M5 开窗首批）；双语同步。
- 2.0.3（2026-09-07）：M4 首批进展落表——W11 执行完成（CI 三 workflow、tags 回填、
  Release、历史分支清理；rust/ts 徽章红=BOARD #7/#8 域内缺陷跟踪中）、W12/W14
  已交付（6062a13）、W13/W16 已合并（88b4551）、W15 解锁；当前窗口与 M4 分解表
  同步（数据请求，集成核实合并与测试证据后落表）。
- 2.0.2（2026-09-07）：M3 收口更新——I-1 完成（16/16 真机格）、当前窗口进展注记、
  W10/production-use-case v0.1 与 amf-production v0.2 随 M3 验收冻结；M4 分配核对与
  分配（W12–W16：已交付六项核实、catalog 观察管线、仓储布局重构、bdl-commands v0.2、
  设置-实验性完整形态、设计标准同步）。
- 2.0.1（2026-09-07）：当前窗口增补 W12（catalog 观察管线服务面，数据负责，M4 开窗执行）——
  把桌面 W6/W7 走查对数据侧观察管线的隐性等待显式化为 M4 前置排期（数据请求，集成裁决）。
- 2.0.0（2026-09-06）：六角色制取代三车道/双角色（集成/桌面/核心/产线/数据/环境，含代码
  所有权映射）；新增「当前窗口」任务分解表（W1–W11）；M4–M10 各门新增角色任务分解表；
  F/B 序列降为历史记录并逐条映射到门任务表；M3 进度注记更新。
- 1.0.0（2026-09-06）：移入版本控制。协作机制切换为 collab/（plans/ 信件模式废止）；M 门改为
  集成分支 tag + 验收清单；F/B 由物理车道改为角色责任划分；M7/F7/B7 收窄，VR Dashboard/VR
  Overlay 移出 `1.0.0`；"`1.0.0` 之后"改写为 v1.1–v1.5 非承诺展望；M3 追加进度注记；起始基线
  标注为 2026-09-04 快照。
