# VUA 开发计划大纲

[English](development-outline_EN.md) | [简体中文](development-outline_ZH.md)

> 文档版本：1.0.0
> 状态：已接受
> 权威语言：简体中文（EN 为镜像，同步至 1.0.0）
> 范围：v0.4 重建基线至正式版 `1.0.0`
> 规范效力：只安排已接受工作，不扩展产品边界

## 目标与基线

自 2026-09-06 起，工作按**单一集成分支 + 垂直切片**组织（结构性裁决见治理改良方案 §8；
协调机制见 `collab/README.md`）。本计划保留 M/F/B 三组编号作为门序列与角色责任划分：

- **M（Main 门）** 是产品门序列，负责双语文档、迁移封口、前后端整合、跨组件验收、发行说明
  与产品版本更新。M 门 = 集成分支上的 tag + 验收清单：门清单全绿后打 tag、发布发行说明，
  不再是多条物理分支的合并事件；
- **F（Frontend 角色）** 负责 Electron Main/Preload、React Renderer、设计系统、远程网页与
  桌面 Overlay 表现；
- **B（Backend 角色）** 负责 Orchestrator、持久化、应用契约、BDL、项目/环境适配器与 Unity
  Bridge。

F 与 B 是角色，不再是物理车道：F 线/B 线长期分支已于 2026-09-06 废止。同一垂直切片分支内
包含 Schema（如涉及）、Rust、TypeScript、测试与文档，由同一会话分饰 F/B 两角；B 角色保有
Schema 冻结责任，F 角色保有登记责任。M 不重复实现 F/B 的内部任务，只在对应门槛验收切片
产出并更新唯一产品版本。

```text
F0 ─┐    F1 ─┐    F2 ─┐                      F10 ─┐
    ├→ M0    ├→ M1    ├→ M2 → ...                ├→ M10
B0 ─┘    B1 ─┘    B2 ─┘                      B10 ─┘
 v0.4.0   v0.4.1   v0.4.2                    v1.0.0
```

图中 F/B 汇入 M 表示角色产出在门处验收，不表示物理分支合并。M 门按顺序关闭。前一 M 门确认
的契约和迁移结果是下一阶段的共同基线；不依赖未决契约的工作可以提前在切片中推进，但不能
绕过对应 M 门形成产品发行。

以下为计划接受时（2026-09-04，v0.4 重建基线）的起始状态快照；各门最新验收状态见对应
章节：

- `_references/kimi-desktop-5870d0c` 只作为 React 表现层资产提取来源；
- `unity/Packages/com.ph-r.vua`、`schemas/unity-bridge/v1` 与 Orchestrator Bridge adapter 已完成第一轮
  迁移和本地验证；
- `crates/orchestrator` 是可测试的 Rust 应用核心，JSONL journal 与 StateFile 仍是过渡实现；
- Electron 壳、版本化 Gateway、SQLite 权威任务状态与真实纵向切片仍需按本计划完成；
- 后端工作树已经完成 `.unitypackage` 转本地 VPM 包的可行性 Spike：隔离 Unity 转换、独立项目发现
  包和加载指定资源已有证据；通过 VUA `vrc-get` 包管理器完成安装仍是 B3 前的关闭项；
- 运行时工具集成、社区插件执行与插件市场在正式版 `1.0.0` 前不实施。

## 共同执行纪律

1. 跨前后端行为先确定版本化应用契约，再由 F/B 角色在同一切片内实现和测试。
2. F/B 角色的测试可以使用模拟对端；M 门必须使用该阶段的真实两端制品完成整合验证。
3. 修改型切片覆盖适用的 Inspect、Plan、Confirm、Snapshot、Execute、Validate、Recover，并验证
   取消、重试、漂移和重启恢复。
4. 每个 M 门同步维护匹配的 `_EN.md` / `_ZH.md` 文档、迁移证据、协议或 Schema 版本、发行说明和
   唯一产品版本来源。
5. 仓库与云端 CI 测试只使用结构具有代表性、但不含真实商品或用户内容的合成网页、项目与文件；
   本地只读兼容性测试可以访问公开 BOOTH 页面；本地 Unity 集成与冒烟测试可以使用开发者合法取得的
   素材。真实会话、订单、付费素材、用户项目、网页捕获、测试配置和输出不进入仓库或云端制品。
6. F/B 编号表示角色责任划分，不是产品版本；只有 M 门更新产品 SemVer 和 Git 发行状态。
7. 协调结论只以 `collab/` 为准（机制见 `collab/README.md`）；`docs/plans/` 的成对信件协调模式
   已废止，plans/ 仅作本地草稿区，不产生协调效力。

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

- **文档**：记录首个端到端用例、错误/恢复语义、最小 Build Record、Bridge 操作覆盖，以及直接
  导入与本地 VPM 制作/安装的两条素材入口契约；
- **迁移**：只提取该切片所需的旧页面行为和 Unity 语义，完成对应迁移台账；
- **整合**：合并 F3 与 B3，以合成 Avatar、一件合成衣装和全球版 Unity `2022.3.22f1`，分别通过
  `.unitypackage` 直接导入和本地 VPM 制作后由 VUA 包管理器安装两条路径跑通 Inspect 至 Recover；
- **交付**：两条路径均通过成功、取消、漂移、超时、Bridge 拒绝、回滚成功/失败和幂等重放；VPM
  结果明确区分 `unityValidated` 与实验性离线输出，更新版本与发行说明到 `0.5.0`。

> 进度注记（2026-09-06）：T1（M3 修订路径）、T2（production 面 v0.2 登记）与 I-3（分支整合，
> 三条车道已统一合并入集成分支 main）已完成；本门剩余 I-1 真 Unity 矩阵。

### M4（v0.6.0）：Warehouse、素材获取与 BDL

- **文档**：固化远程内容、Session、下载端口、LocalArtifact 和最小 BDL 持久格式；
- **迁移**：关闭素材浏览、下载、Warehouse 页面与来源数据的迁移项；
- **整合**：连接 F4 的隔离浏览/下载界面与 B4 的 AMF 素材获取、检查和 BDL 映射；
- **交付**：用户授权下载经可恢复任务和本地检查进入 Warehouse，更新版本与发行说明到 `0.6.0`。

### M5（v0.7.0）：Recipe 与 AMF 生产主线

- **文档**：固化 Recipe、Local Resolution、Build Record 与新增 Unity Bridge 操作；
- **迁移**：完成 Recipe/Warehouse 表现模型和合法本地素材测试路径的迁移；
- **整合**：连接 F5 工作台与 B5 解析、计划、Unity 作业、验证和恢复；
- **交付**：一个 Avatar 加一件衣装的合法自有本地冒烟路径可复现，更新版本与发行说明到 `0.7.0`。

### M6（v0.8.0）：项目管理与环境部署

- **文档**：固化 `vrc-get`、ALCOM/VCC 项目兼容矩阵、环境诊断和实验性 EAC 恢复边界；
- **迁移**：关闭旧环境检查、项目识别和部署引导的可保留行为；
- **整合**：连接 F6 的引导/计划/确认页面与 B6 的项目、环境、网络、磁盘和进程适配器；
- **交付**：三条项目路径诚实报告能力，新用户可完成最小生产环境准备，更新版本与发行说明到
  `0.8.0`。

### M7（v0.9.0）：Inspection、Release 与桌面 Overlay

- **文档**：固化检查证据、Release/Build Record 浏览、官方 SDK 交接和桌面 Overlay 快照边界；
- **迁移**：关闭报告、成品展示和桌面浮层的相关迁移项；
- **整合**：连接 F7 的 Inspection/Release/桌面 Overlay 表面与 B7 的报告、快照和只读服务；
- **交付**：生产结果可复查、可恢复并交接官方上传，桌面 Overlay 故障不阻断桌面主线，更新版本到
  `0.9.0`。

VR Dashboard/VR Overlay 不进入本门与 `1.0.0`（用户裁决，2026-09-06）；方向锚点见
「`1.0.0` 之后」节 v1.1。

### M8（v0.10.0）：Beta 1 功能与契约冻结

- **文档**：冻结 `1.0.0` 功能集合、公开契约、兼容范围和目录风险门；
- **迁移**：完成所有进入 `1.0.0` 的 Schema、数据库与配置迁移路径；
- **整合**：合并 F8/B8 的功能收口、性能基线和 Provider 生命周期压测；
- **交付**：完整产品路径可启动、降级、关闭和恢复，目录风险门无 `pending`，更新版本到 `0.10.0`。

### M9（v0.11.0）：Beta 2 恢复、安全与发行验证

- **文档**：完成安装、更新、回滚、诊断脱敏、安全、兼容与支持范围说明；
- **迁移**：演练升级、降级、备份、卸载保留和损坏恢复；
- **整合**：合并 F9/B9 的可访问性、性能、安全、恢复与合法自有冒烟矩阵；
- **交付**：只剩发行候选缺陷；需要时发布 `1.0.0-rc.1`，产品版本更新到 `0.11.0`。

### M10（v1.0.0）：稳定版发布

- **文档**：完成四语 README、双语开发文档、Release Notes、Apache-2.0/NOTICE、贡献与支持入口；
- **迁移**：验证所有受支持旧版本到 `1.0.0` 的数据、配置和项目迁移；
- **整合**：锁定 F10/B10 制品、安装包、Provider、Unity Package、协议与诊断版本；
- **交付**：Windows CI、签名、安装、更新、回滚、许可证和完整冒烟门通过，发布 `v1.0.0`。

## F 序列：Frontend / Electron

F 序列是 Frontend 角色的责任划分，按垂直切片执行，不再对应物理分支。

### F0：表现层资产分级

提取 React 页面模型、i18n、可访问性、Token 和基础组件；登记应用壳、远程网页、图片、教程和任务
交互的迁移目标，拒绝 Tauri 窗口、IPC、权限与旧数据契约。

### F1：Electron 桌面基线

建立 Electron Main、Preload、React Renderer、Vite、设计系统和最小导航壳；锁定运行时版本；
Preload 只暴露显式 Gateway；远程测试页面无法获得 Node.js 或本地 Gateway。

### F2：Gateway 客户端与任务体验

实现类型化 Gateway client、环境只读快照、任务中心、提交/观察/取消、重载恢复、多窗口同步和明确
断连状态；使用模拟 Provider 完成前端独立测试。

### F3：首个生产纵向页面

实现检查结果、计划审阅、确认、实时进度、结构化诊断、恢复结果和最小 Build Record 展示；覆盖
成功、取消、漂移、超时与回滚表现。

### F4：远程素材与 Warehouse

实现 Main 管理的 `WebContentsView`、隔离 Session、权限/导航/下载交互、Warehouse 列表、筛选、
详情和 LocalArtifact 检查状态；Renderer 不持有 Cookie、令牌或 Electron 私有对象。

### F5：Recipe 与 Assembly 工作台

实现素材选择、兼容证据、缺失素材、版本锁、人工修订、计划差异、Assembly 任务和恢复入口；三种
Recipe 视图共享同一选择和领域语义。

### F6：项目与环境页面

实现 VUA/ALCOM/VCC 三条项目能力表现、环境诊断、部署计划、确认、人工路径和 EAC 实验性高风险
动作的逐次警告与确认。

### F7：Inspection、Release 与桌面 Overlay

实现检查报告、官方/本地结论区分、版本/快照/Build Record、SDK 交接与桌面 Overlay 表现；Overlay
只消费稳定快照和语义动作。VR Dashboard/VR Overlay 不进入 `1.0.0`，见「`1.0.0` 之后」节。

### F8：Beta 1 前端冻结

关闭完整页面路径、错误/空态、国际化和性能缺口；冻结面向 `1.0.0` 的 Gateway 使用面与设计系统
公共表面。

### F9：Beta 2 前端验证

完成键盘、屏幕阅读器、缩放、高对比、DPI、最小窗口、远程内容安全和安装/更新 UI 验证。

### F10：稳定版前端制品

冻结 Electron/Chromium/Node/Vite/打包依赖，生成签名安装包与更新制品，验证生产构建无 Fixture、
调试入口、凭据或私有日志泄漏。

## B 序列：Backend / Orchestrator / Unity

B 序列是 Backend 角色的责任划分，按垂直切片执行，不再对应物理分支。

### B0：Unity Bridge 与 Orchestrator 迁移封口

以 Bridge v1 Schema、C# Package、合成固定实例、本机 EditMode、幂等装配和 Batchmode
`inspect_project` 建立新基线；盘点 Rust 核心中可保留行为和过渡持久化负债。

### B1：后端应用契约基线

整理 Command、Query、Event、Task、Capability、错误、revision、取消和应用用例边界；建立可替换
Provider 接口和模拟适配器，不将 FFI、传输或 Rust 私有类型暴露给 Gateway。

### B2：持久任务与 Orchestrator 托管决议

建立 SQLite 权威任务状态、取消、幂等、事务后事件和重启恢复。用同一 Gateway/恢复测试比较进程内
原生 Provider 与受监督独立进程 Provider，验证打包、签名、崩溃隔离、握手/回调、关闭、进程树、
延迟、调试和移除路径，形成单独已接受的托管 ADR。该 Spike 是后端实现工作，不占用独立产品版本。

### B3：首个 Orchestrator—Unity 用例与双素材入口

以合成 Recipe、Avatar/衣装和 Unity 项目实现指纹、计划、快照、版本化 Bridge 作业、验证、恢复和
最小 Build Record；保留 `.unitypackage` 直接导入，并实现来源包不变、隔离 Unity 暂存、
`local-reusable` VPM 包制作、最小 `vrc-get` 安装和独立项目验证的并行路径。包制作、安装与发布分别
建模；离线转换保持实验性风险结果；覆盖取消、漂移、超时、拒绝、回滚与幂等重放。

### B4：素材获取与 BDL

实现 AMF 素材获取用例、下载事件规范化、来源关联、重试恢复、LocalArtifact 检查、Warehouse 映射
和最小 BDL SQLite Schema。仓库与云端 CI 使用结构等价的合成网页与文件；本地只读兼容性测试通过
正常公开入口访问 BOOTH 公开页面，不固化页面响应、截图或商品元数据。

### B5：Recipe 与生产扩展

实现 Recipe v0.3、Local Resolution、兼容/缺失证据、版本锁、计划和完整 Build Record；Recipe
v0.2 仅保留到 v0.3 定型并在此后整体废弃，不建设迁移器；逐项扩展 Unity Bridge Schema、dry-run、
幂等、恢复及 C#/应用侧测试。云端矩阵使用合成项目；本地集成与冒烟矩阵可以使用开发者合法取得的
Avatar、衣装及相关 Unity 素材，素材、项目、配置和输出均保留在本地。

### B6：项目与环境适配器

在 B3 最小本地 VPM 安装切片上完成通用 `vrc-get` 项目与包管理路径，实现 ALCOM/VCC 能力检测、
Unity/VRChat/SteamVR 环境检查、网络/磁盘/残留进程失败处理和边界受限的 EAC 实验性恢复适配器。

### B7：Inspection、Release 与桌面 Overlay 服务

实现功能、性能、依赖、光照与上传准备度证据，提供项目版本、快照、Build Record、SDK 交接和只读
桌面 Overlay Surface 服务；Overlay 不拥有任务或敏感数据。

### B8：Beta 1 后端冻结

冻结 `1.0.0` 应用契约、Schema 与数据库迁移，完成 Provider 生命周期、任务恢复、并发、性能和磁盘
压力测试，并对发行目录条目执行 `vua.risk-gate/v1`。

### B9：Beta 2 后端验证

完成升级/降级/损坏恢复、Provider 启动/握手失败、诊断脱敏、兼容矩阵、安全审计和合法自有素材
冒烟验证。

### B10：稳定版后端制品

锁定 Rust、Provider、SQLite、Unity Package 和第三方依赖；生成或校验版本元数据、许可证清单、
签名/更新制品与卸载保留策略。

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

- 1.0.0（2026-09-06）：移入版本控制。协作机制切换为 collab/（plans/ 信件模式废止）；M 门改为
  集成分支 tag + 验收清单；F/B 由物理车道改为角色责任划分；M7/F7/B7 收窄，VR Dashboard/VR
  Overlay 移出 `1.0.0`；"`1.0.0` 之后"改写为 v1.1–v1.5 非承诺展望；M3 追加进度注记；起始基线
  标注为 2026-09-04 快照。
