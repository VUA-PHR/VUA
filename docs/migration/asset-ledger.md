# 旧仓库资产迁移台账

> 状态：工作记录
> 范围：`VRC_Ultra_assistant`、`VUA_BDB` 到新 VUA 仓库
> 更新：2026-09-02
> 规范效力：无；只记录迁移裁决与验证状态

迁移采用“按资产提取”，禁止合并旧仓库历史或整条旧分支。每项资产进入新仓库前必须确认目标
所有者、保留价值、拒绝携带的旧假设、验证证据和第三方许可证。

## 分类规则

| 结论 | 含义 |
| --- | --- |
| 迁移 | 以新目录和新契约重建，可保留来源记录 |
| 提取 | 只取代码、测试、Schema 或固定向量中的明确部分 |
| 参考 | 放入低权威参考区或本地参考目录，不进入实现依赖 |
| 归档 | 仅保留在旧仓库 Git 历史，不复制到新仓库 |

## 当前裁决

| 来源 | 初步结论 | 应保留 | 明确不带入 | 验证门槛 | 状态 |
| --- | --- | --- | --- | --- | --- |
| `VUA_BDB` | 全部归档 | 无 | 全部决策、Schema、示例、API、爬虫、部署、运维、计划与数据库实现 | AMF 所属 BDL 在新边界下从零设计和实现 | 已裁决 |
| VUA 调研文档 | 归档 | 只有新决策明确引用的事实另行重查 | 竞品结论、旧产品建议、阶段性研究摘要 | 无 | 不迁移；仅留旧仓历史 |
| VUA 架构与 ADR | 按模块重写 | 仍成立的约束、失败经验和验收条件 | 旧仓拓扑、Tauri、云端 BDB 和已失效产品边界 | 新模块所有者审议 | 已整合 |
| `GLM/orchestrator` | 重点提取 | 应用核心、状态机、恢复/幂等逻辑、适配器端口、测试与固定向量 | Tauri 绑定、旧目录、旧通信层、未经验证的文档结论 | 138 项自动测试通过；Clippy 通过；Gateway 集成与 CI 待后续切片 | 已提取 |
| `kimi/docs-art-v04-dual-track` | 按资产提取并在 Electron 重建 | React 交互、i18n 结构、Design Token、基础组件、固定导航与状态表现 | Tauri 壳、Tauri IPC/CSP/权限、旧 BDB/Catalog、生产 fixture 和机器绝对路径 | 新 Electron Main/Preload/Renderer 联合启动；边界、契约、导航和语言测试；生产构建 | 首个表现层切片完成 |
| 美术风格与 UI/UX | 迁移参考 | 旧客户端已经实现的视觉语言、双辖区、键盘与可访问性经验 | 未经真实页面验证的产品结论 | 用户裁定迁移阶段不以 `design-standard-v0.6.0` 视觉和交互条款阻断旧资产重建；设计标准后续另行修订 | 迁移期非阻断 |
| Unity Bridge | 迁移 | C# Package、版本化命令、Schema、EditMode/集成测试和已验证操作 | 付费素材、用户项目、临时场景、机器绝对路径、Library、原始运行日志和嵌入式第三方 Package | Unity 2022.3.22f1 编译；12 项 VUA EditMode 测试通过；真实 Batchmode `inspect_project` 成功；人工截图已核验 | 迁移封口完成 |

## Unity Bridge 迁移记录

```text
资产：Unity Bridge v1
旧来源：VRC_Ultra_assistant / GLM/orchestrator / efb2f7f / unity/Packages 与 schemas/v1
新所有模块：unity/Packages/com.ph-r.vua、schemas/unity-bridge/v1；Orchestrator Bridge adapter 仅为初步参考实现
迁移结论：迁移封口完成
保留价值：公开 MA API 装配、只读检查、项目指纹、dry-run、结构化诊断
拒绝携带的旧假设：个人包名、.vrcua 目录、旧命名空间、未实现的 build_preview、真实付费夹具
许可证与 NOTICE：仓库采用 Apache-2.0；依赖通过 VPM 声明，未复制上游源码；发行前仍需生成并
审查该次构建的完整第三方声明
本地验证：2026-09-02 使用 Unity 2022.3.22f1 (887be4894c44)；12 项 VUA EditMode 测试全部通过，
包含固定 inspect Wire 名称、普通不支持版本统一拒绝、路径/dry-run/指纹边界，以及合成衣装与开关的
幂等重放；Batchmode m0-unity-smoke-inspect 成功；请求示例与实际结果均通过 v1 JSON Schema；
cargo test --locked -p vua-orchestrator --lib 仅作参考，26 项通过
验证依赖：VRChat Avatars 3.10.4；Modular Avatar 1.18.0-beta.1；NDMF 1.14.1；lilToon 2.3.4
验收证据：_migration/unity-bridge-smoke/m0-closure-test-results.xml、
_migration/unity-bridge-smoke/.vua/bridge/m0-inspect.result.json；原始日志含本机与许可信息，不迁入仓库
人工截图：docs/migration/evidence/unity-bridge-m0-2026-09-02.png；标题栏显示 Unity 2022.3.22f1，
Test Runner 显示 19 项全部通过、0 失败，展开的 VUA Bridge 分支包含本次 12 个测试实例
截图 SHA-256：c00c823b8e5b87e0a324434e2698b366596e73b8dee71a48defb5cff45f4e706
CI 状态：按当前裁决不建立 Unity CI
迁移提交：主体迁移 a8e3c87；版本封口 a703b76
```

## Unity Bridge M0 人工验收截图

![Unity 2022.3.22f1 Test Runner 验收结果](evidence/unity-bridge-m0-2026-09-02.png)

## Electron 表现层迁移记录

```text
资产：Electron 表现层首个迁移切片
旧来源：kimi/docs-art-v04-dual-track / 5870d0c / _references/kimi-desktop-5870d0c/apps/desktop
新所有模块：apps/desktop、packages/contracts、packages/design-system、根 pnpm workspace
迁移结论：按资产提取并在 Electron 重新实现
保留价值：React 固定导航壳、顶栏/侧栏/任务栏表现、深浅主题、VUA 紫/AMF 橙双辖区、
基础组件、像素装配工、最小 i18n 结构、Gateway 窄口思想和纯模型测试
拒绝携带的旧假设：Tauri Host、command/event、WebviewWindow、Tauri CSP/权限、vuaimg 自定义协议、
旧 BDB/Catalog 身份与 API、旧生产 fixture、@vrcua/contracts 手写类型和本机绝对开发路径
Electron 边界：Renderer 不导入 Electron/Node；Preload 只注入冻结的显式 Gateway 和三个窗口动作；
Main 校验 sender origin、契约版本、requestId 和 64 KiB 请求上限；窗口启用 contextIsolation、sandbox、
webSecurity，关闭 nodeIntegration，并默认拒绝权限请求、远程导航和新窗口
当前契约：packages/contracts 中的 Desktop Gateway v1 只含 app.snapshot；这是 M1 最小宿主契约，
不预先替代 M2 的完整 Command/Query/Event/Task/Capability 应用 Gateway
许可证与 NOTICE：新增 Electron 44.1.1、React 19.2.8、Vite 8.2.2、TypeScript 7.0.2、Vitest 4.1.11
及其构建依赖，版本由 pnpm-lock.yaml 固定；本切片未复制第三方源码，正式分发前仍需完成依赖许可、
二进制再分发、NOTICE、签名、更新来源和移除路径审计
本地验证：pnpm build 通过；pnpm check 通过；contracts 2 项、desktop 4 项，共 6 项测试通过；
Windows Electron Main/Preload/Renderer 联合启动成功，VUA 窗口正常响应；冒烟退出后无残留 Electron 进程
迁移内记录：apps/desktop/MIGRATION_ASSETS.md 与 MIGRATION_ASSETS.md
CI 状态：尚未建立
迁移提交：本次 Electron 表现层迁移提交
```

## Electron 表现层第二切片迁移记录（旧表现层全量资产）

```text
资产：KIMI 表现层其余资产 + 质量门脚本（功能页面、应用模型、4 语言 i18n、WebGL 三场景、原语补齐、5 个检查脚本）
旧来源：kimi/docs-art-v04-dual-track / 5870d0c / _references/kimi-desktop-5870d0c/apps/desktop
新所有模块：apps/desktop/src/renderer（app/components/features/gateway/i18n/dev）、packages/design-system（tokens/base/Icon）、
apps/desktop/scripts、根 schemas/recipe/v1/fixtures
迁移结论：按资产提取并在 Electron 重建（诚实降级项逐条记录于 apps/desktop/MIGRATION_ASSETS_*.md）
保留价值：16 个功能页面表现层与布局模型、纯模型测试（252 项）、四语言 i18n 与术语纪律、完整 Design Token（含
高对比双通道与 aurora 氛围层）、Context/Media/Skeleton 等原语、质量门（边界/对比度/i18n 完整性/多表一致/fixture 泄漏）
拒绝携带的旧假设：Tauri command/event/WebviewWindow/vuaimg 自定义协议、真实 BDB vendored 快照（309 商品）与
catalog-browser-dev 装配、真实商品图 URL（booth.pximg.net，改合成 SVG data URI）、机器绝对开发路径（vite fs.allow）、
旧 schemas/tutorial 双端 JSON 机制、旧 app-meta 版本与身份
教程与目录降级：教程端口恒 inactive、openTutorialWindow 显式失败（M5 重建）；应用内浏览与 vuaimg 缓存降级为
系统浏览器直开（F4 以 WebContentsView + 隔离 Session + 素材 intake 协议重建）；VR overlay DEV 入口显式失败（G7/M5）
Electron 边界：沿用切片一（contextIsolation/sandbox/来源校验/请求上限）；renderer 禁止 electron/node:/@vrcua 遗留，
外部链接统一 window.open → Main setWindowOpenHandler（仅 http/https）
许可证与 NOTICE：新增 three 0.185.1 / @types/three 0.185.4（MIT）；正式分发前仍需完成完整第三方声明审计
本地验证：pnpm check 全绿（desktop 252 项测试；renderer/electron 双严格类型检查；vite 构建含 three 懒加载分包）；
5 个质量门通过（含 120 条 fixture 指纹生产零泄漏、5 上下文 WCAG AA 对比度）；Windows Electron 冒烟启动与退出无残留
迁移内记录：apps/desktop/MIGRATION_ASSETS.md 与 MIGRATION_ASSETS.md（切片二章节）
CI 状态：尚未建立
```

## 单项迁移记录模板

```text
资产：
旧来源（仓库/分支/提交/路径）：
新所有模块：
迁移结论：迁移 / 提取 / 参考 / 归档
保留价值：
拒绝携带的旧假设：
许可证与 NOTICE：
本地验证：
CI 状态：
迁移提交：
```

## 完成条件

- 所有“迁移/提取”项都有明确的新模块所有者和验证结果；
- 新仓库不依赖旧工作树、绝对路径或旧 Git remote；
- 付费素材、凭据、生产数据库和用户 Unity 项目未进入 Git；
- 旧仓库增加归档说明并切换为只读后，才配置新仓库 GitHub remote。
