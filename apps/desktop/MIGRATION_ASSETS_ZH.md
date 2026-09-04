# Electron 表现层资产迁移记录

> 状态：进行中
> 旧来源：`_references/kimi-desktop-5870d0c/apps/desktop`（分支 `kimi/docs-art-v04-dual-track` / 提交 `5870d0c`）
> 当前裁定：迁移阶段在 Electron 上恢复旧表现层资产，并以已接受的 `design-standard-v0.6.1` 验收视觉与交互

本记录不恢复 Tauri 宿主、IPC、权限或产品数据契约。Electron 进程隔离、窄 Gateway、远程内容隔离和现行模块所有权继续有效。

## 切片一（M1 基线，已完成）

最小 Electron 宿主 + 表现层壳，见 `docs/migration/asset-ledger.md` 的"Electron 表现层迁移记录"。

## 切片一收口补录（M1 验收，2026-09-04）

- **Provider 路由**：Electron Main 经 `provider-bootstrap.ts` 启动受控 Mock
  Provider（`OrchestratorProviderV01` 表面），`vua:gateway:invoke` 校验信封后由
  `gateway-router.ts` 路由到 Provider；`capabilities` 从 Provider 能力报告派生，
  不再由 Main 硬编码；非法信封与未信任来源在路由前拒绝；
- **真实远程权限冒烟**：`scripts/smoke-remote-permissions.mjs` 以 `http://127.0.0.1`
  合成页面实测——notifications/geolocation/media 由隔离 Session 拒绝；远程页面无
  `window.vua`、无 Gateway；远程导航被阻止；HTTP(S) `window.open` 交给 Shell 边界，
  未创建 Electron 窗口；证据写至 `_local_m1/v0.4.1/`（.gitignore 排除，原始日志留本地）；
- **验证**：`pnpm check` 通过；M 线 24 项 TypeScript 测试通过；产品版本升至 `0.4.1`，
  发行说明见 `docs/release/v0.4.1_ZH.md` / `_EN.md`；M1 在开发计划（中英文）标记为已通过。

## 切片二：旧表现层全量资产恢复（本轮）

KIMI 表现层其余资产（功能页面、应用模型、4 语言 i18n、WebGL 场景、原语补齐）与 5 个质量门脚本迁入 Electron 壳。开发排期见 `docs/plans/development-outline`（F2–F7 各门的应用契约接入仍按计划推进；本轮只恢复表现层与纯模型，不伪造生产数据）。

| 资产组 | 目标所有者 | 本轮保留 | 拒绝携带 | 验证 |
| --- | --- | --- | --- | --- |
| 全量 i18n（zh-CN/en/ja/ko + terms/format/locale 注册表） | `apps/desktop/src/renderer/i18n` | 四语言表、术语原形、插值与语言自名纪律 | 旧产品结论性文案（以 v0.6.1 为准复核） | `check-i18n`、`check-i18n-tables`、`i18n.test`、`locales.test` |
| 应用模型与纯函数（nav/onboarding/busy-timing/shortcuts/storage-keys/resource-saver/perf-probe/task-status/resolve-scenario/scene-mode 等） | `src/renderer/app`、`components/three` | 全部纯模型与测试 | Tauri API 依赖 | vitest 全量通过 |
| 功能页面表现层（home/deployer/guide/onboarding/warehouse/recipe/workshop/release/packages/tools/settings/task-center/tutorial/command-palette 等） | `src/renderer/features` | 页面组件、布局模型、交互拆分 | 旧 BDB/Catalog 身份与 API、生产数据伪造 | 类型检查、生产构建、DEV fixture 走查 |
| WebGL 三场景（Nebula/HoloCore/Pedestal + 程序化纹理） | `src/renderer/components/three`（新增依赖 `three` 0.185.1，MIT） | 场景实现、降级闸口（reduced-motion/HC/effects-off） | 未经真实页面验证的高资源占用规则由资源节约模式压制 | 构建分包（懒加载，不进主 chunk） |
| 基础原语补齐（ContextMenu/DelayedButton/MediaSlot/Skeleton + media-state 模型） | `src/renderer/components/primitives` | 组件与共存 CSS | 无 | `media-state.test` |
| 质量门脚本 ×5 | `apps/desktop/scripts` | check-boundary / check-contrast / check-i18n / check-i18n-tables / check-leak，接入 `pnpm check` | Tauri 边界规则 | 改写为 Electron 规则（renderer 禁止 `electron`/`node:`/`@tauri-apps`；Gateway 仅经 barrel） |
| Token 与基础样式全量版 | `packages/design-system` | 完整 tokens（aurora/辉光/高对比双通道）、base.css、Icon | — | `check-contrast`（5 上下文 AA） |
| Recipe fixture JSON 源 | 根 `schemas/recipe/v1/fixtures`（4 个合成样本） | 与内嵌副本互为奇偶校验 | — | `fixture-recipes.test` |
| 教程内容包最小 v1 索引（20 个步骤 id，按 strings 键重建） | `src/renderer/app/tutorial-content-pack.ts` | 教程/步骤结构与校验规则（与旧 `parse_content_pack` 拒绝条件对齐） | 旧 `schemas/tutorial/v1` JSON 与 Rust `include_str!` 双端机制（M5 以版本化 JSON 重建） | `tutorial-content-pack.test`、`tutorial-port.test` 守卫 |

### 本轮明确降级（诚实空态/显式失败，不伪造）

| 旧能力 | 处置 | 恢复切片 |
| --- | --- | --- |
| Tauri `open_external_url` | `window.open` → Main `setWindowOpenHandler` 转交系统浏览器（仅 http/https） | 已可用 |
| 应用内浏览窗口（WebviewWindow） | `browseWindowSupported()` 恒 false，页面降级"系统浏览器打开" | F4（Main 管理的 WebContentsView + 隔离 Session） |
| `vuaimg` 缩略图协议 | 直连原 URL，HTTP 缓存兜底 | F4（域名白名单 + 磁盘缓存以 Electron 机制重建） |
| 教程会话/桌面教程窗口/置顶（Rust 应用层） | 教程端口恒 inactive；`openTutorialWindow` 显式失败；置顶按钮不渲染 | M5（教程会话进应用契约 + preload 窗口动作） |
| VR overlay helper（`tutorial_overlay_start` 等） | DEV 入口显式失败 stub；纯载荷构建器保留 | G7/M5 |
| 真实 BDB vendored 快照（309 商品）与 `catalog-browser-dev` | 按裁决不带入；目录端口恒 not-connected | F4（对准 AMF 素材 intake 协议） |
| 真实商品图 URL（`booth.pximg.net` 5 处） | 替换为合成 SVG data URI（仓库测试只用合成数据） | 不恢复 |

### 本轮验证

- `pnpm check` 全绿：contracts 5 项 + orchestrator-provider 全部 + desktop **252 项测试**（35 文件）；renderer 与 electron 双 tsconfig 严格类型检查（含 `exactOptionalPropertyTypes`/`noUncheckedIndexedAccess`）；`vite build` 通过，three.js 场景懒加载分包不进主 chunk；
- 质量门：`check-boundary`（barrel + Electron 宿主边界）、`check-i18n`（无中文字面量）、`check-i18n-tables`（3 交付语言表对齐）、`check-contrast`（5 上下文 WCAG AA + forced-colors 结构守卫）、`check-leak`（120 条 fixture 指纹生产构建零泄漏）；
- Windows Electron 冒烟：`dist` 产物启动，窗口标题 `VUA` 正常渲染，进程树正常，退出后无残留进程；
- 新增依赖：`three` 0.185.1、`@types/three` 0.185.4（MIT；正式分发前完成依赖许可与 NOTICE 审计）；
- fixture 树-shaking 依赖 `sideEffects: ["**/*.css"]` 声明（不得移除，`check-leak` 把守）。

## 切片三：F2 Gateway 客户端与任务体验（2026-09-04）

| 资产组 | 目标所有者 | 本轮交付 | 验证 |
| --- | --- | --- | --- |
| 契约 | `packages/contracts`、`docs/protocols/application-contract-v0.1` | 契约修订（增长模型 + `environment.getSnapshot` + `task.startDemo`）；Gateway v1 六方法表与按方法守卫；应用错误透传（`code=application`） | 契约测试 10 项（未知版本/方法/混合形状拒绝） |
| Kernel | `apps/desktop/src/electron` | 全方法路由到 Provider；类型化事件广播（仅本地来源窗口）；操作级能力表注册 | router 测试 8 项（透传/错误/门控/快照） |
| Provider | `packages/orchestrator-provider` | mock 实现 environment.getSnapshot（注入或诚实空态）与 task.startDemo（`demo.task` 门控、commandId 幂等、确定性状态驱动） | provider 测试 14 项 |
| Renderer | `src/renderer/gateway` | 类型化 client（unavailable/request_rejected/application 三类失败显式）；契约投影（`satisfies` 穷尽性锁死，在场严重度为消费侧缺省裁决）；任务中心与环境快照 live 端口；生产装配 live Gateway（无宿主回落 not-run） | desktop 测试 273 项（投影穷尽/取消区分未知任务与断连/事件驱动刷新/退订） |

断连语义：首帧取数失败向上抛出，由 GatewayProvider 呈现诚实失败卡与重试；订阅期间取数失败保留
上一视图；取消按未知任务 / 不可取消 / 不可达三分类拒绝。检测执行命令与环境事件属 F6/B6，
`runCheck` 当前返回当前快照，入口由 capability 显隐。

边界不变：Renderer 仍不接触 Provider 生命周期、Rust 类型或 IPC 细节；DEV fixture 防线不变
（`check-leak` 120 条指纹零泄漏）；远程权限冒烟复跑通过（远程页面无 `window.vua`，events 面
同样不可见）；Windows 启动冒烟通过（窗口 `VUA`、无应用错误、退出无残留）。

## 切片四：F3 生产纵向体验 UI/UX 先行（2026-09-05，工作树 kimi/frontend）

在 B3 交互逻辑（`production.*` 应用契约 + Rust 执行器 + Kernel 文件对话框）冻结之前，把
F3 生产纵向用例的表现层完整落地在 renderer 自有端口 + DEV fixture 上：素材入口 → 检查结果 →
计划审阅/确认（绑定 revision）→ 执行进度 → 恢复（continue/rollback）→ 最小 Build Record，
覆盖成功/取消/漂移（failed_recoverable）/超时（expired）/回滚（含回滚成功与失败）五种生命周期。
交互语义依据 `docs/protocols/production-use-case-v0.1_ZH.md`（B3/F3 候选草案）；视觉与交互验收依据
设计规范 v0.6.1（`docs/design/design-standard-v0.6.1_ZH.md`，该目录按裁决永不入库，仅本地参考）。
体验寄宿车间页（§2.2/§8.5：执行/等待/恢复是 Assembly 内的任务进展，不另设 Production 用户阶段），
一级/二级导航与 PageId 结构未动。

| 资产组 | 目标所有者 | 本轮交付 | 验证 |
| --- | --- | --- | --- |
| F3 端口扩展（七方法 + 素材选择占位 + 复合能力报告 + 判别联合值类型，全部 `schemaVersion: 1` + not-connected 退路） | `src/renderer/gateway/model-production-port.ts`、`empty-gateway.ts`、`index.ts` | `startInspection/getInspection/requestPlan/getPlan/confirmPlan(planId, revision)/recover(taskId, decision)/getBuildRecord`；`pickMaterial` 为 Kernel 文件对话框未实现前的显式占位（not-run 恒 null）；`ModelProductionView` 增 `productionRun` 字段 | `model-production-port.contract.test.ts`（16 项，empty/fixture 双实现） |
| 流程纯模型（端口数据 → 视图 props；五生命周期展示映射；色彩纪律 橙=进行/完成、琥珀=待确认、红=仅阻断；确认过期显式态；禁用原因键） | `src/renderer/features/workshop/production-flow-model.ts` | `productionFlowModel()` + `phaseOfRun/toneForPhase`（switch 穷尽）；`primaryAction`（每屏至多一个主操作） | `production-flow-model.test.ts`（15 项：五态 × 加载/失败/not-connected/空态 + 枚举奇偶） |
| 车间页 F3 流程段（素材入口条/检查卡/计划审阅卡/恢复卡/构建记录卡，页内卡 + DelayedButton，不新造 Dialog 原语） | `src/renderer/features/workshop/`（MaterialEntryBar/InspectionCard/PlanReviewCard/RecoverCard/BuildRecordCard/ProductionFlowSection + WorkshopPage 接入 + workshop.css） | 诚实四态：加载 Skeleton / 失败 EmptyState+重试 / not-connected 空态 / 能力未就绪整段隐藏；既有 idle/running/replay 行为与四盘回放带未动 | vitest 全量（含既有 274 项）；边界/对比度门禁 |
| 五生命周期 fixture + 八个开发场景 + 任务中心联动 | `src/renderer/gateway/fixture-production.ts`、`fixture-signal.ts`、`fixture-gateway.ts`、`app/resolve-scenario.ts`、`app/DevScenarioBar.tsx` | 脚本化时间线驱动 run 视图；每个生产命令创建标准任务（await_confirmation→waitingInput，originPage=workshop 带来源页回跳）；任务取消联动运行取消；场景：`production-inspect/plan/running/success/cancelled/drifted/expired/rollback` | 契约测试覆盖八场景与取消/恢复/过期重确认路径 |
| i18n 四表（en 为结构源）新增 `strings.productionFlow` 段 + `strings.dev` 八标签 | `src/renderer/i18n/strings.{en,zh-CN,ja,ko}.ts`、`strings.fixtures.zh-CN.ts` | 枚举键与 TS 联合类型一一对应（奇偶测试约束）；术语走 termLabel；fixture 文案只在 fixtures 表 | `check-i18n`、`check-i18n-tables`、`i18n.test` |

### 显式声明（本切片不做）

- **contracts 未登记**：`production.*` 未进入 `packages/contracts` 方法表（B3 对齐动作，另行切片）；
- **live 未接线**：`electron-gateway.ts` 仍复用 not-run 的 modelProduction，生产构建呈现诚实空态；
- **Kernel 文件对话框未实现**：素材选择由 `pickMaterial` 端口占位，fixture 返回合成 MaterialRef；
- `strings.wizard` 遗留孤儿键（zh-CN 表 1260-1271 行附近：wrongStep/onlyReview/noProject/required/
  labels.{outfit,outfitArmature,toggleName,workflowId}）经评估为旧"步骤向导表单校验"语义，
  与计划审阅（阶段/风险/差异/修订确认）不贴合——**不接管、保持原样**，归属问题留待向导切片处理。

任务中心衔接：fixture 生产任务经既有 TaskPort 流入 Taskbar；`waitingInput` 行的"回到来源页"
入口（TaskRow 既有行为）+ `originPage: "workshop"` 即完成跳回车间，Taskbar 未做结构性修改。
`runState` 直接消费已冻结的 `WorkflowRunState` 11 态词表与 `taskStatusForWorkflow` 投影，未自造枚举；
取消是任务事实而非工作流状态，运行视图以 `cancelled` 标记表达（草案取消纪律）。
