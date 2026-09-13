# proposal 019：多套 UI 共用应用能力（M6 伴随项）

> 提案人：操作者（用户指令登记，2026-09-10 凌晨）
> 日期：2026-09-10
> 状态：**已接受（用户指令「把之前说过的这个需求做一下」＝方向批准并下令
> 实施；细节按需求文档批次推进）**
> 源文档：C:/Users/<本地用户>/.codex/visualizations/2026/09/07/01a07a2e-68a7-7be3-980f-938b50526e0b/
> VUA-multi-ui-requirements_ZH.md（0.1.0 草案；本提案为全文登记，内容一字
> 未改，仅本头部与文末登记注为新增）
> 授权链：用户直接指令（多套 UI 共用应用能力；森林绿 UI 为草稿不上传
> GitHub）
> 排期锚：M6 伴随项——**不改变 W25/W26 排期与其他角色既有窗口**；批次
> A-D 见 §6，工单路由见 BOARD #21
> **红线（用户明确）**：森林绿 UI Figma 生成源码位于仓库外
> （同目录 VUA-Figma-v2-2026-09-08/）。任何适配实现不得将该目录内容复制
> 入 git 跟踪范围；如需在桌面工程内置新 UI 代码，置于 gitignore 覆盖的
> 本地路径（.gitignore 已显式登记 `apps/desktop/src/ui-variants/forest/`）
> 并在推送 origin 前核查零泄漏（3 轮 Reviewer 审阅含此项）。

> 文档版本：0.1.0  
> 状态：草案，待评审  
> 日期：2026-09-08  
> 范围：Electron 本地 Renderer、前端共享应用层、UI 适配层与现有 Gateway 的衔接  
> 文档性质：本地需求交付件，未进入仓库受管文档与协作裁决流程；不替代已接受的产品边界、协议和架构。

## 1. 背景与目标

VUA 正在重设计前端。现有前端已具备素材获取、任务、环境、恢复、国际化和部分生产能力接线；Figma Make 第二版提供了森林绿视觉方向及以素材搭配为中心的工作台，但仍包含固定数据、模拟执行和未贯通的状态。

本需求旨在让现有界面与新版界面复用同一套应用能力，避免每次重做 UI 都重新编写数据访问、任务关联和恢复逻辑。多套 UI 可以采用不同布局、导航和交互方式，但必须对同一业务对象呈现一致的事实，并通过相同应用接口提交操作。

必须保留的产品核心是：**用户先选择素材、确定视觉终点，由系统生成配方解析与装配计划，再派生或修改 Unity 项目。项目不是创作的默认起点。**

目标结果：

- 现有 UI 与新版搭配 UI 可以在同一桌面会话内切换。
- 切换不丢失共享草稿，不重启 Provider，不重复发起业务命令，不改变运行任务。
- 外观迭代与应用能力开发可以独立推进；缺失能力如实显示，不能用模拟补齐正式功能。
- 新 UI 优先复用已经验证的功能与安全边界。

## 2. 范围与非目标

### 2.1 本期范围

本期支持同一个 Electron 本地窗口中的两套可信、随产品构建的 UI：现有 UI 和新版搭配 UI。同一时间只激活一套 UI；两套 UI 使用同一会话中的共享应用状态。

覆盖能力：素材查询与选择、搭配草稿、配方及计划的应用接口衔接、任务订阅与操作、环境与能力状态、通知及生产记录关联、语言与显示偏好。

首批切换入口放在开发设置中，用于对照验证。是否作为普通用户可见的长期选项，在正式交付前单独确定；本需求不承诺永久维护两套完整界面。

### 2.2 非目标

- 不新增网络代理、中间件服务器或新的 Provider 进程。
- 不改变 Rust Orchestrator、AMF、BDL、Unity Bridge 的业务所有权。
- 不建立社区 UI 插件市场、动态下载页面或任意第三方 UI 执行机制。
- 不开放远程网页的本地权限，不允许 React 直接访问 Node.js、数据库或 Unity。
- 不在本期解决多窗口并发编辑、跨设备同步或多个 UI 同时操作同一草稿。
- 不把 Figma SVG 搭配示意当作真实素材预览或 Unity 渲染结果。

## 3. 分层与职责

```text
现有 UI                    新版搭配 UI
   ↓                           ↓
现有 UI 视图适配器          新版 UI 视图适配器
   └─────────────┬─────────────┘
           前端共享应用层
                 ↓
           typed Gateway
                 ↓
        Electron preload / main
                 ↓
      版本化应用契约 → 现有 Provider
```

| 层 | 负责 | 不负责 |
| --- | --- | --- |
| Provider / 应用服务 | 业务规则、解析、批准计划、执行、取消、恢复、权威持久化 | UI 布局与动效 |
| Gateway | 类型化请求、响应、订阅、错误与能力映射 | 根据界面猜测业务成功 |
| 前端共享应用层 | 会话状态、查询订阅、草稿编辑意图、命令提交状态、对象关联、缓存刷新 | 重新实现依赖求解、版本锁、风险裁决和任务状态机 |
| UI 视图适配器 | 将共享数据组织为各套 UI 需要的展示模型、可访问标签与交互入口 | 私自修改权威事实、拼装执行计划或发起隐式副作用 |
| UI 组件 | 页面布局、选中和展开状态、镜头、动效、输入交互 | 直接调用 preload、操作系统或 Provider 传输 |

采用最小、显式的 VUA 自有组合方式。不得为支持两套界面引入通用插件注册框架。共享前端接口不依赖 React 组件、某个路由器或某套视觉组件库；React hooks 可作为消费封装。

## 4. 功能需求

### UI-01 共享实例与生命周期

每个 Renderer 会话建立一个共享应用容器，复用现有 Gateway 实例及已具备的端口和状态投影。容器的生命周期高于可替换的 UI 根组件。

查询订阅应复用、按需启停并正确清理；不得因切换 UI 累积监听器、计时器或重复后台刷新。页面卸载不能取消 Provider 中的任务。Renderer 重载后的重新关联能力须单独实现和验收，不得把同会话 UI 切换与进程重启视为同一场景。

### UI-02 统一对象身份与状态来源

素材、文件副本、草稿、Recipe、计划、项目、任务与构建记录均通过明确身份关联，不允许通过名称、数组位置或某个固定项目推断身份。

| 数据 | 权威来源 | 切换 UI 时 |
| --- | --- | --- |
| 任务状态、检查、计划、记录 | Provider 返回的版本化应用事实 | 保持身份与订阅，按需重新查询 |
| 未提交搭配草稿 | 共享草稿状态；持久化由版本化应用接口管理 | 保持内容、修订号及脏状态 |
| UI 导航上下文 | 共享的语义目标，如某草稿或任务 | 映射到目标 UI 的对应页面 |
| 面板展开、列表密度、预览镜头 | 各套 UI 的局部状态 | 可分别记忆，不写进业务对象 |
| 语言、主题、减少动效偏好 | 现有偏好机制及其应用状态 | 语义一致，视觉呈现可不同 |

缓存只是已取得事实的副本。并发返回的旧响应不得覆盖较新修订；对象版本与快照订阅规则以现有契约为准。

### UI-03 项目无关的创作草稿

用户可从素材库直接把素材加入当前搭配，无须先创建或选择 Unity 项目。草稿至少表达素材身份、实例与组合关系、目标平台和用户明确调整的参数，并映射至 Recipe 的对应字段。

未命名草稿可使用默认展示名；Recipe 如要求非空标题，由保存流程提供默认值，不强迫用户先命名项目。UI 不得强制每种搭配都另选衣服、头发等固定槽位；基础体自带内容和可用角色类别由素材事实与契约决定。

共享草稿应支持修改、移除和撤销本地未提交编辑。撤销不反向执行已经提交的生产命令，也不撤销批准计划或运行任务。

“已保存”只能在持久化成功确认后显示。只更新内存时显示会话内草稿状态；失败时保留内容、标记未保存并提供明确重试。正式草稿持久化接口缺失时，应先补契约，不能用散落的 localStorage 作为生产文档库。原始文件与凭据不进入草稿。

### UI-04 保持以视觉终点为起点的主流程

标准路径为：

**选择素材 → 编辑并确认视觉目标 → 保存配方 → 请求本地解析与装配计划 → 审阅并明确确认 → 自动装配 → 检测 → 官方 SDK 交接。**

五阶段仍为素材、配方、装配、检测、发布，但不要求用户手工配置每一步。依赖、项目准备和执行顺序由应用服务决定。兼容性未知必须显示未知；有阻断时展示原因、关联对象及返回编辑入口。

选择变化后，旧计划不得继续获得授权；应依据草稿修订和服务端计划身份判断是否需要重新解析。名称相同不代表计划相同。

### UI-05 UI 切换

切换时必须保留当前草稿、对象身份、未保存状态、活动任务关联和必要导航上下文；不得重新初始化 Gateway 或 Provider。

目标 UI 不支持当前编辑器时，切换前将仍在输入控件中的内容同步至共享草稿；以只读摘要或已有公共详情页呈现对象并提供返回入口。不能静默丢字段、清空草稿或跳到其他项目。

涉及批准、危险操作确认的弹窗不跨 UI 自动继承为“已确认”。若尚未提交，应关闭并在目标 UI 重新审阅；若命令已提交或结果未知，保留请求关联并查询结果，禁止重发。

### UI-06 命令与错误处理

用户操作统一通过共享层调用 Gateway。共享层可维护待提交、提交中、已受理、被拒绝和结果未知等请求状态，但不得把“已受理”显示为“执行成功”。

重复点击和 UI 切换不得重复提交同一意图；使用现有契约提供的请求身份与幂等机制。超时不等于失败，禁止自动重试非幂等命令。计划过期、能力不可用、对象不存在和版本冲突应保留类型化语义，交由各 UI 显示一致解释。

### UI-07 任务、取消与恢复

任务状态以 Gateway 返回的权威快照为准。进度动效只能反映快照或已标注的开发模拟，不得由倒计时产生成功结果。

切换 UI 不暂停、不取消、不重新执行任务。取消请求被受理后显示取消中或契约对应状态；最终状态仍由 Provider 确认。恢复始终遵守 inspect_required 和明确用户决定，不得因重新挂载组件或恢复订阅自动继续。

### UI-08 能力感知与诚实状态

共享层提供一致的能力状态及加载、空结果、读取失败、断线、过期信息。目标 UI 根据这些信息给出解释与下一步操作。

不得把失败当作空列表，不得把上次缓存当成当前检查结论。保留旧数据显示时须标明失鲜或离线。开发夹具与模拟操作必须受 DEV 开关隔离，正式构建不能包含原型数据与演示执行路径。

### UI-09 视觉与动效独立

新版采用已选定的森林绿方向，旧 UI 可以保持原视觉用于迁移比对。共享应用层不持有 CSS 颜色、组件尺寸、动画时长或角色插画。

两套 UI 都须遵守减少动态效果、高对比度、键盘操作和资源节约要求。切换主题、UI 或页面不能撤销用户的减少动效偏好。动画不阻断取消和主要操作，不通过改变字体大小造成点击目标位移。

### UI-10 现有功能与安全不退化

保留现有素材导入、独立任务、来源浏览隔离、实验性偏好与确认、四语文案和错误映射。

ALCOM/VCC 原项目只读；写入只能走用户显式选择的 VUA 管理副本路径。新版页面不因外观变化获得额外权限。Figma 导出工程的托管脚本、固定数据及独立应用状态不直接替换 Electron 工程基础。

## 5. 建议接口分组

以下为职责划分，不是已冻结的方法名或新增 wire 协议：

| 分组 | 主要职责 |
| --- | --- |
| Session | UI 选择、语义导航、会话生命周期 |
| Assets | 浏览、仓储条目与副本、详情、导入及能力状态 |
| Drafts | 当前草稿、修订、编辑、撤销、保存反馈 |
| Production | 配方保存、解析、计划审阅与提交、运行关联 |
| Tasks | 快照订阅、取消、恢复意图、结果未知时的查询 |
| Records | 检测、构建记录、项目来源及历史 |
| Preferences | 语言、主题、减少动效及既有偏好 |

优先提取已有实现。新增协议由对应领域负责定义，Desktop 登记 TypeScript 面；不允许 UI 适配器自行扩展冻结字段或绕开错误收窄逻辑。

## 6. 实施顺序与依赖

| 批次 | 交付范围 | 前置与完成条件 |
| --- | --- | --- |
| A：共享基础 | 应用容器、订阅与切换骨架；现有 UI 接入 | 不改变现有功能行为，证明切换不重建 Gateway |
| B：选材与草稿 | 两套 UI 共用素材查询和项目无关草稿，新版搭配入口 | 草稿身份、修订及持久化边界明确；同会话切换不丢内容 |
| C：生产链 | 两套 UI 共用解析、计划、任务与记录 | 对齐 M5 W20/W22/W24 对应接口；不能用模拟替代未完成接口 |
| D：视觉与交付 | 预览能力接入、动效、窄窗、错误与恢复验收 | 通过下表，并保留可切回现有 UI 的迁移退路 |

桌面负责共享前端层与两套 UI 适配；核心负责应用契约和权威持久化；数据与产线分别负责素材证据及 Unity 执行能力。批次不自行改变当前开发窗口或其他角色排期。

## 7. 验收标准

| 编号 | 场景 | 必须观察到的结果 |
| --- | --- | --- |
| AC-01 | 在两套 UI 查询同一条目/任务 | 身份、修订和业务状态一致；布局允许不同 |
| AC-02 | 修改搭配后连续切换 UI 20 次 | 草稿内容与未保存状态不丢；Gateway 不重建；监听数量不累积 |
| AC-03 | 素材库选择素材开始创作 | 无须创建 Unity 项目；能进入同一草稿和视觉目标确认 |
| AC-04 | 保存失败、切换 UI、重试 | 内容保留，不显示已保存；成功回执后才更新保存状态 |
| AC-05 | 草稿修改后确认旧计划 | 旧授权无法执行，提示重新解析/审阅 |
| AC-06 | 提交瞬间切换、双击或请求超时 | 无重复生产命令；结果未知时查询而非盲目重发 |
| AC-07 | 运行期间切换并取消 | 任务身份不变；取消通过 Gateway；无本地计时成功跳转 |
| AC-08 | Provider 断开、重连或应用重启 | 如实显示断线/未知；按支持的接口重新关联，非终态恢复需检查，绝不自动续跑 |
| AC-09 | 目标 UI 不支持当前编辑字段 | 保留字段并提供只读摘要/返回入口，不静默覆盖 |
| AC-10 | 两套 UI 切换主题与减少动效 | 偏好持续有效；主要流程可完全用键盘操作 |
| AC-11 | 960×600 与 1440×900 新版界面 | 主要操作可达、角色区不过度挤压，详情抽屉可关闭，无关键内容裁切 |
| AC-12 | 正式构建、服务无数据或不可用 | 呈现诚实空态/失败态；无 Figma 固定作品或模拟执行泄漏 |
| AC-13 | 同一搭配完成装配后查看检测与记录 | 使用本次配方、计划、项目与任务身份，不跳到固定历史示例 |

验证分三层：共享层契约与状态测试、双 UI 交互测试、Electron 真机生产链验证。复用现有边界、国际化、对比度和夹具泄漏检查。端到端结论必须附日期、环境和实际证据位置；仅完成模拟时明确标注模拟。

## 8. 已知限制与交付说明

当前真实生产端口具有可复用基础，但 Recipe 图谱与部分读面仍存在未接入退路；完整搭配写入和记录链以对应接口落地为准。当前会话运行关联不能被描述为已经具备跨重启完整恢复关联。

Figma 第二版尚存在内存草稿伪保存提示、完成后回到固定作品列表、旧新建入口残留及减少动效问题。它是视觉和交互参考，不是本需求的实现证明。

验收前需补齐的工程交付物：共享层接口说明、对象身份映射、能力支持矩阵、两套 UI 适配清单、失败与切换测试、真机证据，以及切回现有 UI 的操作说明。正式入库时按文档治理要求形成双语文档、登记并通过协作流程评审。

## 9. 参考基线

- VUA 产品边界：docs/product-boundary_ZH.md。
- Electron 桌面架构：docs/architecture/desktop_ZH.md。
- AMF 生产模型：docs/architecture/amf-unity_ZH.md。
- 进度基线：2026-09-08 读取的 main c8e034e、collab/BOARD.md 与 collab/state/wt-main.md。
- 前端实现：apps/desktop/src/renderer/gateway/、features/warehouse/、features/workshop/。
- 原型参考：Figma Make zPVSDWiBj55sJizlfaj9rt，Version 2，本地快照 VUA-Figma-v2-2026-09-08。
- 本轮用户要求：复用现有 Provider，通过共享与适配支持多套 UI；创作始终以选材和视觉终点为起点。

## 文档变更日志

- 0.1.0（2026-09-08）：形成多 UI 共享应用能力需求草案，定义职责、切换、草稿、生产边界与验收标准。



## 登记注（集成，2026-09-10 凌晨）

- 本提案为**登记件**：用户需求全文照录（§1～§9 与变更日志一字未改）；
  登记即视为用户方向批准（「做一下」＝下令实施），实施细节按 §6 批次推进。
- **职责路由**（BOARD #21 工单）：桌面＝共享前端层与两套 UI 适配（批 A
  牵头）；核心＝应用契约与权威持久化缺口评估（UI-03 正式草稿持久化接口
  如缺失先补契约，禁止 localStorage 充当生产文档库）；数据/产线＝素材证据
  与 Unity 执行能力（§6 原文）；集成＝验收与排期守门（不改变 W25/W26）。
- **红线执行**：.gitignore 已显式登记 `apps/desktop/src/ui-variants/forest/`
  （本地路径，预留）；森林绿 UI 相关工作开工前，推送批的 3 轮 Reviewer
  审阅必须包含「forest 目录零泄漏」核查项。
- 文档地位：本提案内容为需求登记（T5 计划/协作层），不自动成为受管文档；
  实施过程中形成的正式契约/文档按文档治理另行升版、双语与登记。
## 进展注（桌面，2026-09-14 01:1x 工作时段，批 D 工单签发后首切片）

- **批 D 共享层验收面已交付（slot/wt-3 dadd2fe，候集成随轮验收）**：
  ①AC-09 只读摘要模型（`ui-switch-summary.ts` 纯投影：身份/呈现名/
  nameHint 编辑字段逐字保留、dirty/saved 透传、空草稿＝诚实空态、派生
  不回写共享状态＝「不静默覆盖」模型钉子）＋不可用根接线（字段保留＋
  只读摘要＋返回现有 UI 入口＝迁移退路；数据全部来自共享容器草稿
  store）＋四语词表；②AC-12 前置机械门：`check:forest-leak` 常驻检查
  把红线机械部分固化（ui-variants/ 下零已跟踪文件＋gitignore 登记有效，
  干净检出恒绿）；内容级零泄漏审阅仍属推送门 r2 人工程序，本门不替代。
  证据：桌面 check 全链 exit 0（vitest 70 文件 546 测试〔+5〕＋boundary
  ＋i18n＋contrast＋leak 155 指纹零泄漏＋forest-leak 新门绿）。
- **§9 参考基线事实源定位（在案事实更新）**：原型快照在用户侧桌面
  `VUA — 创作工作室 · 全新交互原型.zip`（2026-09-08，含 .figma/make
  元数据，与本节 VUA-Figma-v2-2026-09-08 引用吻合）；已解压至仓库外
  `C:/Users/AR/Documents/VUA-Figma-v2-2026-09-08/`（永不入库；git 层面
  由 check:forest-leak 门守卫）。`src/data.ts` 固定演示数据在案确认——
  §8 所列「托管脚本、固定数据及独立应用状态不直接替换 Electron 工程
  基础」适配约束成立，D-2 起剥除固定数据、全部走 Gateway 诚实空态。
- **批 D 剩余切片登记（D-2 起，同分支续作）**：D-2＝forest 变体骨架
  （gitignored 本地目录）＋动态发现接线（干净检出构建安全）＋诚实空态
  ＋迁移退路；D-3＝搭配流适配（共享草稿/保存链/生产链 store 复用，零
  模拟替代）；D-4＝动效/减少动效/窄窗（AC-10/AC-11，960×600 与
  1440×900 走查）；D-5＝AC 全表（AC-01～13）回归收口。AC-10 主题/高
  对比/特效偏好跨 UI 根切换持续有效已在共享层结构性成立（localStorage
  持久化＋document dataset 存活 AppShell 重挂载），双 UI 键盘可达核查
  随 D-2 起实际走查。零端到端宣称维持（真机义务归 W25）。

## 进展注（桌面，2026-09-14 01:5x 工作时段，D-2 切片）

- **D-2 切片已交付（slot/wt-3 37cf157，候集成随轮验收）**：
  ①**动态发现接线**：`ui-variant-discovery.ts` 以 Vite `import.meta.glob`
  在构建期发现 `src/ui-variants/forest/root.tsx`——干净检出（目录缺席）
  glob 解析空表，构建/typecheck/测试恒安全（已做物理模拟验证：临时移除
  目录后 typecheck 绿＋discovery/registry 测试 9/9 绿＋vite build 绿，
  骨架恢复后 check 全链复绿）；`resolveForestVariant` 纯函数三态语义：
  absent／目录半写（有杂文件无 root.tsx）仍 absent（不挑选替身入口）／
  present（load 透传，加载错误永不吞）；`ForestUiRootProps` 为入库契约，
  gitignored 骨架实现之。②**接线组件**：`ForestVariantRoot.tsx`——
  absent 分支＝D-1 不可用根原样搬迁（字段保留＋只读摘要＋返回现有界面
  迁移退路）；present 分支＝懒加载状态机（loading/failed/ready），失败
  如实呈现（UI-06/UI-08；细节仅进控制台诊断，不静默回退不可用、不猜测
  重试）；共享容器在一切分支外存活，仅 UI 树替换（UI-01）。③**可用性
  事实化**：`isUiRootAvailable(root, forestVariantPresent)`——可用性来自
  构建期发现事实，不再是硬编码开关；current 恒可用。④**词表 ×4**：
  `uiSwitchDesc` 改为如实描述动态可用性；`uiForestUnavailableDesc` 改述
  「本构建不含其源码」（非「待交付」语义）；新增 uiForestLoading／
  uiForestLoadFailed／uiForestLoadFailedDesc／uiForestSkeletonDesc 四键
  四语。⑤**骨架本体**：`src/ui-variants/forest/root.tsx`（gitignored，
  永不入库，check:forest-leak 门守卫）——诚实空态骨架：仅证明「发现→
  加载→渲染」链路成立，业务能力面随 D-3 起接入，零模拟数据零演示执行；
  tsconfig include 扩展使本机 typecheck 覆盖骨架（干净检出零匹配安全）。
- **证据（本机 2026-09-14 01:4x，slot/wt-3）**：pnpm check 全链 exit 0
  ——typecheck（含骨架）＋vitest 71 文件 553 测试〔较 D-1 世代 +1 文件
  +7 测试〕＋build＋boundary＋i18n＋contrast＋leak 155 指纹零泄漏＋
  forest-leak 绿；干净检出模拟验证三件套如上。零端到端宣称维持（真机
  义务归 W25）；AC-10 双 UI 键盘可达走查随 D-4。
- **批 D 剩余切片更新**：D-3＝搭配流适配；D-4＝动效/减少动效/窄窗
  （AC-10/AC-11 走查）；D-5＝AC 全表回归收口。

## 进展注（桌面，2026-09-14 02:3x 工作时段，D-3 切片）

- **D-3 切片已交付（slot/wt-3 491ffe6，候集成随轮验收）**：
  ①**保存链共享化**：自现有 UI 搭配页原样提取保存链至容器层
  `app/compose-save-chain.ts`——`useComposeSave()` 同线形状（recipe.save
  v1）、同忙碌守卫（防重复提交，UI-06/AC-06）、同回执对齐
  （composeSavedAction＋productionChainRecipeSavedAction）；纯函数面受测：
  `composeSaveBlocked`（nameHint 空白规则两 UI 共用）＋
  `classifyComposeSaveResult`（诚实回执边界——不可解释载荷如实 failed，
  不猜测）。**行为差一处如实声明**：传输异常（promise 拒绝）现落诚实
  failed 态，不再以未处理拒绝悬挂「保存中」（UI-06/08；原实现该路径
  未处理）。
  ②**选材投影纯函数**：`compose-source-model.ts`
  `composeSourceLines(view, draftItems)`——warehouse 条目读面 × 共享草稿
  身份投影；非 entries 视图投影空列表，语义不折叠（呈现层按视图种类
  如实决定空态/断线）。
  ③**ComposePage 改接共享链**：行为保持（同词表、同禁用规则、同调用
  形状）；现有 UI 与森林 UI 消费同一保存链实例逻辑（AC-01/AC-04 一致
  事实面）。
  ④**骨架搭配流（gitignored 本地，永不入库，check:forest-leak 守卫）**：
  选材卡（加入草稿；not-connected/空仓库按 Gateway 视图事实分别如实
  呈现）＋草稿卡（nameHint 编辑/移除/撤销/保存走共享链）＋生产链段
  原样复用 `ProductionChainSection`（同一 store 同一 Gateway 端口；无
  保存事实不渲染）。**零模拟替代**：数据只来自 Gateway 读面与共享
  store，空态即真实状态（UI-08/AC-12）；`ForestUiRootProps` 契约不变
  （骨架直用容器层 hooks，入库边界零漂移）。
- **证据（本机 2026-09-14 02:2x–02:3x，slot/wt-3）**：pnpm check 全链
  **exit 0**——typecheck 双 tsconfig（含本机骨架）＋vitest 73 文件 567
  测试〔较 D-2 世代 +2 文件 +14 测试＝save-chain 11＋source-model 3〕
  ＋build＋boundary＋i18n＋contrast＋leak 155 指纹零泄漏＋forest-leak
  绿。零端到端宣称维持（真机义务归 W25）；AC-10 双 UI 键盘可达走查
  随 D-4。
- **批 D 剩余切片更新**：D-4＝动效/减少动效/窄窗（AC-10/AC-11 走查，
  960×600 与 1440×900）；D-5＝AC 全表（AC-01～13）回归收口。

## 进展注（桌面，2026-09-14 03:0x 工作时段，D-4 切片）

- **D-4 切片已交付（slot/wt-3 d3e23c4，候集成随轮验收）**：动效/减少
  动效/窄窗走查（AC-10/AC-11，960×600 与 1440×900）——走查驱动的共享
  面修复，入库 diff 恰 2 文件全桌面所有权域：
  ①**走查发现一（AC-11 窄窗）：`vua-project-compat__row` 死类名**。
  现有搭配页与森林绿骨架共用的主操作行（撤销/保存）类名在任何 CSS 中
  均无定义（019 批 D 静态走查发现），按钮仅靠 inline 流排列。修复＝
  `project-compat.css` 补定义：flex＋wrap＋Token 间距——最小窗口
  （960×600，即 Electron `minWidth`/`minHeight` 事实）下主操作不溢出、
  不裁切。
  ②**走查发现二（AC-10 键盘可达）：内联 `all:unset` 压掉焦点环**。
  两套 UI 的选材行触发器（ComposePage 与骨架同构）均以内联 style 写
  `all:unset`——内联声明级联优先级高于任何选择器（含 base.css 全局
  `:focus-visible` 轮廓规则），键盘 Tab 聚焦时**无可见焦点指示**。
  修复＝新增共享类 `vua-select-row__trigger`（`all:unset` 语义保留，
  类内 `:focus-visible` 显式恢复与全局同形状的焦点环；选中态 cursor
  经 `[aria-pressed="true"]` 表达）＋ComposePage 与骨架（gitignored
  本地，不在 diff 面）改接该类并加 `aria-pressed`——行为保持（cursor
  语义同前），新增焦点环与按压语义即 AC-10 修复本体。
  ③**走查结论面（结构性成立项，如实登记）**：主题/语言/高对比/特效
  偏好持续有效（AC-10 前半）＝结构性成立——偏好全部持久化于共享容器
  层 localStorage（storage-keys 契约），UI 根切换仅替换 UI 子树
  （UI-01 已验收），切换写入面恰 `writeUiRootSelection` 单键；减少动效
  ＝base.css 全局压平双通道（`prefers-reduced-motion`＋
  `[data-effects="off"]`，通配选择器）自动覆盖两套 UI，骨架零自定义
  动画；窄窗＝壳层侧栏固定 232px＋主区弹性、页面单列滚动、详情抽屉
  自适应高＋Escape/autoFocus 可关闭（现有组件已备）、specs 网格行自然
  换行、Mascot 角色区无固定尺寸——静态数值走查无挤压/裁切风险项。
  **诚实边界**：本轮静态走查＋机械守卫复用；**实机交互窗口走查未执行**
  （AC-10/AC-11 的真机确认项不宣称完成，随 D-5 AC 全表回归收口与
  W25 真机义务兑现）。
- **证据（本机 2026-09-14 02:5x–03:0x，slot/wt-3）**：pnpm check 全链
  **exit 0**——typecheck 双 tsconfig（含本机骨架）＋vitest 73 文件 567
  测试（与 D-3 世代持平：CSS＋组件小改，无新纯函数面＝无新测试文件，
  如实声明）＋build＋boundary＋i18n＋contrast＋leak 155 指纹零泄漏＋
  forest-leak 绿。零端到端宣称维持（真机义务归 W25）。
- **批 D 剩余切片更新**：D-5＝AC 全表（AC-01～13）回归收口（含实机
  走查确认项与迁移退路复核）。

## 进展注（桌面，2026-09-14 03:3x–03:4x 工作时段，D-5 切片）

- **D-5 切片已交付（slot/wt-3，候集成随轮验收）**：AC 全表（AC-01～
  13）回归收口——逐条证据盘点＋走查驱动的命名诚实性修正＋AC-02 根
  基测试补齐＋迁移退路复核。入库 diff 恰 4 文件全桌面所有权域
  （apps/desktop/src/renderer/gateway/）：
  ①**走查发现（命名诚实性）：生产容器层依赖 "fixture-" 命名文件**。
  production-chain-store 与 compose-draft-store（随生产构建发布的共享
  容器层 store）经 gateway/index.ts 引用 fixture-signal.ts——该文件头
  自称「仅 DEV 可达」，与生产使用事实漂移。修正＝实现逐字原样提取至
  `gateway/signal.ts`（纯订阅机制：无数据、无演示载荷——诚实纪律 4
  的泄漏门扫描载荷指纹，对无载荷基础设施不适用）＋fixture-signal.ts
  转为 DEV 夹具面（fixture-gateway/fixture-acquire/fixture-production）
  专用 re-export（恢复名副其实）＋index.ts 导出源换 signal.ts。零行为
  变化（实现同线）。
  ②**AC-02 根基测试补齐**：`signal.test.ts` 四用例锚定共享信号退订
  语义（退订移除监听／同引用重复订阅不叠加监听／重复退订安全／全体
  在订者恰一次通知）——AC-02「监听数量不累积」的共享层机制根基首次
  有测试锚定；组件层 useEffect 清理语义建立在之上。
  ③**AC 全表逐条回归盘点（证据三态汇总，如实）**：
  - **共享层测试锚定 9 条**——AC-01（两 UI 同一容器层 store 实例＋同
    一保存链，身份透传不派生）、AC-02（草稿容器层保留＋本轮 signal
   根基锚定；Gateway 不重建＝容器在 UI 树外〔UI-01 批 A 验收结构〕）、
    AC-03（composeDraftToSaveDocument 无项目依赖）、AC-04（诚实回执
    分类＋failed 不清内容＋「已保存」仅回执后）、AC-05
    （productionChainGate stale-draft 闸门＋服务端版本锁独立拒绝）、
    AC-06（忙碌守卫＋传输异常不悬挂「保存中」；**重试安全具契约依
    据**：baseRevision 乐观并发、stale 为 typed conflict
    〔application-contract.ts:903〕，误重试不产生重复配方）、AC-07
    （解析受理任务身份跨转换保留）、AC-09（ui-switch-summary 五用例
    ＋不可用根接线）、AC-13（saved→execute.accepted.planId→buildId
    身份链匹配幂等）。
  - **静态结构＋机械守卫 2 条**——AC-10（偏好共享容器 localStorage
    持续＋base.css 减少动效双通道＋D-4 焦点环共享类修复）、AC-11
    （D-4 死类名补布局＋静态数值走查；960×600＝Electron
    minWidth/minHeight 事实）。
  - **机械门常态 1 条**——AC-12（leak 155 指纹＋forest-leak 门＋DEV
    门控；内容级零泄漏审阅仍属推送门 r2 人工程序，照登记注原样）。
  - AC-08 断线呈现＝UI-08 结构性成立（按 Gateway 视图事实呈现，失败
    不折叠为空态）＋恢复 inspect_required＝核心域已验收机制。
  - **迁移退路复核（本轮确认面完整）**：AC-09 面——
    ForestUiRootProps 恰 migration-fallback 单回调契约（测试锚定）＋
    absent 分支返回现有 UI 入口（D-1 交付）＋current UI 恒可用
    （ui-registry 测试）；019 §6 批 D 行「保留可切回现有 UI 的迁移
    退路」完成条件成立。
  ④**诚实边界（不变申报）**：全部真机确认项（AC-02 切换 20 次实机
  计数、AC-06 实机双击/断网、AC-07 实机取消、AC-08 实机断连重连、
  AC-10 键盘全流程、AC-11 双分辨率实机、AC-13 实机全链观察）**未执
  行**——统一归 W25 真机义务（O-2 用户延期中），零端到端宣称维持。
  AC 全表回归收口的交付物＝共享层/机械面证据盘点与根基补齐；**不宣
  称 AC 表整体验收通过**（§7 三层验证的第三层〔Electron 真机生产链
  验证〕未执行）。
- **证据（本机 2026-09-14 03:3x–03:4x，slot/wt-3）**：pnpm check 全链
  **exit 0**——typecheck 双 tsconfig（含本机骨架）＋vitest 74 文件
  571 测试〔较 D-4 世代 +1 文件 +4 测试＝signal 4〕＋build＋boundary
  ＋i18n＋contrast＋leak 155 指纹零泄漏＋forest-leak 绿。
- **批 D 剩余面（如实登记，不虚报收口）**：§6 批 D 行交付范围四项
  中「预览能力接入」**未见专切片交付**（D-1～D-5 计划切片不含；骨架
  root.tsx 走查零 img/preview 面实证）——登记为 **D-6 候切片**。
- **D-6 事实源核查与契约缺口登记（同轮，03:5x）**：D-6 开工前事实源
  走查结论＝**桌面侧暂无零猜测实现路径，登记契约缺口候核心/数据评
  估**。走查事实（gateway 读面逐一核实）：
  - 选材行/草稿卡数据源＝AcquireView/WarehouseEntry（**本地仓库条目
    读面**）：无任何图片或来源引用字段；条目详情
    WarehouseEntryDetail（含 artifacts 的 WarehouseArtifactFact）仅有
    `sourceCorrelated` 布尔——**不携带 productId 或媒体 URL**;
  - 图片事实在目录观察面：CatalogProductSummary/CatalogProductDetail
    具 imageUrls（catalogImageUrl 直连机制在位，WarehouseAlbum 同线
    渲染可复用）；**但「本地条目→目录来源」的关联解析读面不存在**
    ——UI 无法为本地条目查出可查图的 productId;
  - RecipeSourceRef（provider＋productId）是配方内来源引用，不含媒
    体且属配方图谱面，非本地条目枚举读面。
  - **缺口本质**：跨域关联事实（BDL 本地库条目 ↔ 目录来源观察）无
    渲染层可消费的读面。桌面侧零猜测红线下的禁止项＝从 productId 拼
    接猜测图片 URL（编造）、复用 Figma 原型固定图（§2.2 红线）、自
    行扩展冻结 wire 面（越权）。
  - **候选方案（供核心/数据裁决，桌面不代决）**：a. warehouse.entry
    Detail 读面叠加目录来源引用（productId＋provider）；b. 独立「条
    目预览」查询面（本地条目身份 → 目录媒体或「无关联」诚实空态）。
    方案落定后桌面即接：渲染面复用 catalogImageUrl＋WarehouseAlbum
    同线，无关联/无图条目呈现诚实空态（AC-12 同规）。
  - **本轮处置**：按 TICK「需要他角色输入时写清后继续，不等待」——
    桌面侧 D-6 无可交付实现面（零猜测前提下），登记即本轮推进；批 D
    工单内桌面可独立推进的面至 D-5 全部交付完毕。
- **D-6 核心裁决（核心，2026-09-14 04:1x，slot/wt-2）：零新契约——
  候选方案 a/b 均无必要，详情预览零猜测路径已在冻结 v0.4 面上**。
  核心逐层复核 wire 面与 TS 面（证据均为 main 937bb0b 世代独立核
  实，非转述）：
  - **事实更正（走查漏看 artifact fact 层）**：上节「条目详情仅有
    sourceCorrelated 布尔、不携带 productId」与 wire 事实不符——
    `schemas/bdl-queries/v0.4/result.schema.json` 的
    `warehouseArtifactFact` 中 `sourceCorrelated` 与
    `mappedProductIds`（`^booth:[0-9]+$` 数组）为并列 required 字
    段，后者即「本地条目→目录来源身份」的关联事实本体；Rust 侧
    `crates/bdl-store/src/bdl_store.rs` 以
    `source_correlated: !mapped_product_ids.is_empty()` 派生布尔，
    关联身份由 `artifact_mappings` 行提供。TS 面已完整透传：
    `packages/contracts/src/application-contract.ts:697`、桌面
    `apps/desktop/src/renderer/gateway/acquire-port.ts:71` 与
    `live-acquire-port.ts` 解析在位——渲染端现在即可拿到。
  - **目录媒体查询面已在**：`catalogDetailParams.productId`（同
    文件 query.schema，`^booth:[0-9]+$`）接受来源身份精确查询，
    `catalogDetailResult.product` 含 `imageUrl`/`imageUrls`——
    桌面上节对目录面的走查结论维持成立。
  - **裁决＝方案 c「零新契约组合读」**：D-6 预览接入用现有 v0.4
    冻结面两步组合——`warehouse.entryDetail`（取
    `artifacts[].mappedProductIds`）→ `catalog.detail`（按
    productId 取 `imageUrls`，复用 catalogImageUrl＋
    WarehouseAlbum 同线）；无关联（mappedProductIds 空）→ 诚实
    空态；关联但无图（imageUrls 空/目录 miss）→ 同规诚实空态
    （AC-12）。零 schema 变更、零 wire 面扩展、零跨域契约面新增
    ——上节三项禁项（拼 URL 猜测/固定图顶替/越权扩 wire 面）全
    部不触发。
  - **边界如实登记（不做过度扩张）**：列表卡面
    `warehouseListEntriesResult.entries[].artifacts` 为
    `warehouseArtifactRef` 形状（无 mappedProductIds）——列表缩
    略图如未来成为需求，属 wire 面变更，须另立提案走 schema 版本
    递进与冻结程序，不随 D-6 隐式扩张；本批先交付详情预览。
  - **数据域知情登记**：关联事实本体与 artifact_mappings 均在数
    据域（crates/acquisition、crates/bdl-store、schemas/bdl-queries），
    本裁决不改数据域任何面；[→数据] 如对组合读路径有异议（例如
    artifact_mappings 语义与目录观察面存在口径差）请在本 proposal
    内联表态，逾期无异议即按本裁决执行。
  - **[→桌面] 工单状态**：D-6 由「候契约裁决」转为「可开工」——
    实现面全在桌面所有权域（gateway 组合查询＋渲染面），零猜测
    前提已满足，候桌面领取。

## 知情表态（数据，2026-09-14 04:2x 工作时段，D-6 核心裁决异议窗口）

**表态＝无异议，D-6 按方案 c「零新契约组合读」执行**（对应上节
[→数据] 异议窗口；数据域所有者逐项独立复核，非转述）：

- **wire 事实逐项复核通过**（本树 slot/wt-5 追平 937bb0b 世代）：
  `warehouseArtifactFact` 中 `sourceCorrelated` 与 `mappedProductIds`
  并列 required、后者 `^booth:[0-9]+$` 数组（result.schema.json）；
  Rust 侧 `bdl_store.rs` `source_correlated: !mapped_product_ids
  .is_empty()` 派生（:1551）；`catalogDetailParams.productId`
  required 且 `^booth:[0-9]+$`（query.schema.json）；catalogDetail
  结果 `productDetail` 含 `imageUrl`/`imageUrls`——裁决所述与冻结
  v0.4 面一致。
- **口径差异议点专项核实＝无口径差**：`artifact_mappings` 写入路径
  强制 `product_known` 校验（product_id 不在目录 corpus 即
  `UnknownProduct` 报错），`mapped_product_ids()` 即该表 product_id
  的有序投影——故 `mappedProductIds` 的身份空间与
  `catalogDetailParams.productId` 严格同一（booth 命名空间 corpus
  身份），`warehouse.entryDetail → catalog.detail` 组合读是身份精确
  传递，不是模糊关联。
- **边界登记认可**：列表卡 `warehouseArtifactRef` 无关联身份与
  schema 事实相符（required 仅 relativePath/artifactSha256/state/
  sizeBytes/role）——列表缩略图如成需求属 wire 变更，须另立提案走
  版本递进与冻结程序，数据域同意不随 D-6 隐式扩张。
- **TS 面抽查**（非数据域，纯事实核验）：application-contract.ts
  artifact fact 类型含 `mappedProductIds: readonly string[]`、
  acquire-port.ts:71 与 live-acquire-port.ts 解析在位——裁决引用
  无误。
- **数据域改动面＝零**：本裁决不改关联事实本体、不改
  artifact_mappings 语义、不改任何 schema 文件；组合读完全走在冻
  结 v0.4 面上。异议窗口可提前关闭，桌面可开工。

- **D-6 交付（桌面，2026-09-14 04:4x–05:0x 工作时段，slot/wt-3 切片
  提交）：预览能力接入按核心裁决方案 c 落地——零新契约组合读，8 文
  件全桌面所有权域**。
  - **gateway 组合读（新增 entry-preview.ts＋barrel 导出）**：
    `entryPreviewProductIds`（条目事实 → 去重关联身份，首现顺序，纯函
    数）；`readEntryPreview`（永不 reject 的组合读：mappedProductIds →
    `catalog.detail` 按 productId 定向查询，单品失败按该品无图吸收，
    与目录读面 error/not-connected 视图形态同规）。相册负载只携带
    Gateway 真实返回的图：媒体数组 → 主图单张回落线与云端详情抽屉一
    致；无题观测标题回落 productId 同纪律。零 schema 变更、零 wire 扩
    展，裁决三项禁项全部不触发。
  - **诚实语义（AC-12 同规，照裁决落型）**：无关联（mappedProductIds
    全空）→ `no-association`（关联事实本身）；有关联但无一可显示（媒
    体空/目录 miss/not-found/not-connected/单品传输失败）→
    `no-images`（陈述本面现状，不猜测原因）。两态独立词表键，四语齐。
  - **渲染面（WarehouseAcquire 条目详情抽屉）**：预览区＝取数中骨架 →
    DetailAlbum 相册（catalogImageUrl 同线，纯浏览器/electron 直连语
    义不变）；多来源相册纵排并以 Gateway 返回标题标注归属；空态呈现
    上述两键。取数挂条目事实（loadedEntry 换引用即重查，随 reloadKey
    重载）。**卡片墙媒体区不动**（列表卡 warehouseArtifactRef 无关联
    身份，裁决边界如实维持，`previewEmpty` 键保留于卡片面）。
  - **测试（entry-preview.test.ts，13 用例）**：纯函数去重/顺序 2＋
    组合读诚实语义 11（无关联零查询实证 calledIds 空/媒体回落/标题回
    落/无图空态/not-found miss/混合只留有图来源/共享身份只查一次/多
    来源首现顺序纵排/传输失败吸收/not-connected 同规空态）。
  - **证据（本机 2026-09-14 04:4x，slot/wt-3）**：check 全链 exit 0
    ——typecheck 双 tsconfig＋vitest **75 文件 584 测试**（D-5 世代
    74/571，+1 文件 +13 测试恰新测试文件）＋build＋boundary＋i18n＋
    contrast＋leak 155 指纹零泄漏＋forest-leak 绿；registry-only
    exit 0（57 项一致＋1204 文件 0 标记）。
  - **诚实边界（不变）**：真机确认项未执行（归 W25，O-2 用户延期
    中）；Electron 真机生产链未跑，不宣称端到端。**批 D 工单内桌面
    可独立推进的面（D-1..D-6）全部交付完毕**；剩余＝W25 真机义务。
