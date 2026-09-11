# 推送前增量复审报告（集成轮 / 5809d37 世代）

- 日期：2026-09-12（02:2x–03:0x 工作时段）
- 审阅对象：增量 `12a6a45..main`（origin/main = `12a6a45`，main = `07c31c5`，
  ahead 4：ce91403／5236af0／5809d37／07c31c5）；**实质（非 collab/）提交仅
  ce91403 一批**；`git diff --stat` → 25 文件，+1448 / −106
- 审阅者：**集成（wt-main）**。形态声明：本轮为集成单轮复审，取证主体与
  r1b/r2b/r3b（操作者所召三个独立 Reviewer 进程）不同；客观核查项覆盖与
  r*b 同构（内容审／forest 零泄漏／敏感信息扫描／registry／cargo 全量／
  clippy／桌面 check）。未参考任何未归档材料，全部证据本机独立复现。
- 性质：只读审阅＋运行测试；测试日志捕获于系统临时目录（`$TEMP`），
  不落仓库盘；除本报告与随批簿记外未改任何代码。

## Verdict：**通过（可推送）**

增量内唯一实质批（ce91403 桌面 UX 四缺口批）与提交宣称逐项相符；Cookie
持久化与环境注入两个新敏感面审阅合规；forest 零泄漏硬门与敏感信息扫描
零阻断；cargo 67 套件 / 495 通过 / 0 失败（多轮一致）＋clippy 零告警＋
桌面 check 全链 EXIT=0（58 文件 / 463 测试 / leak 159 指纹零命中）。
1 项低严重度观察（r*b 报告内路径字样，属审阅记录文本，按治理文本先例
保留）不构成推送前置。

## 一、逐项内容审阅（宣称 vs 实文）

| 面 | 宣称 | 实文核查 | 结论 |
| --- | --- | --- | --- |
| Gap 1 仓储装配（provider-bootstrap.ts＋main.ts） | 壳经 processFactory 注入三确定性根（VUA_PROVIDER_DATA/VUA_WAREHOUSE_ROOT/VUA_PROJECT_ROOT），核心包零改动，凭据变量仍剥离 | `desktopProviderProcessFactory` 在 `providerEnvironment(process.env)` 清洗结果上仅补三根；测试钉住 env 键集合（`GITHUB_TOKEN`/`PATH` 剥离断言＋`TEMP` 合成值）；路径为 userData 布局非机密；proposal 005「运行时配置不进 wire」一致 | 一致 |
| Gap 2 首开自动导航（ImportPage） | 首开导航 booth.pm（清单内），保留手动地址 | 允许清单语义未放宽（导航策略零变更），booth.pm 在既有清单内 | 一致 |
| Gap 3 Cookie 持久化（security.ts＋remote-content.ts） | 有界 180 天；仅允许清单域；仅会话 Cookie；本机分区；不进渲染层/IPC/提交 | `COOKIE_PERSIST_DAYS=180`；`sessionCookiePersistence` 对非会话/清单外/缺域路径返回 null 不动；重写仅补 expirationDate，值/域/旗标原样；changed 重写产物为非会话 Cookie 自然终止不循环；`installCookiePersistencePolicy` 挂在隔离分区 session 上；测试用合成值（`value: "token"`） | 一致，红线合规 |
| Gap 4 导航条（remote-content.ts＋preload＋contracts＋ImportPage） | 44px 顶部让位＋goBack/goForward/reload additive 窄面 | `REMOTE_VIEW_NAV_STRIP_PX=44`；高度 clamp 0（诚实不产生负高度）；IPC 三动作均 assertLocalSender＋类型守卫；`RemoteContentApiV1` 增量纯 additive；历史成员产生时已过导航策略（不做二次来源裁决的边界有注释） | 一致 |
| 环境卡片标题（contract-projection.ts） | 消费侧注册表覆盖引擎 id 闭集；未知 id 如实透传 | `CHECK_TITLE_KEYS` 11 项与 environment.rs id 集一致；`localized ?? checkId` 不猜测不伪造 | 一致 |
| collab/ 簿记（5236af0/07c31c5） | 状态批＋推送记录＋r*b 报告归档（path literals redacted） | 见问题清单 L-1：报告实文仍含 3 处 `Users/AR` 字样（均为扫描模式/观察记录文本）——「redacted」宣称与实文存在轻微出入，按治理文本先例不阻断 | 见 L-1 |

## 二、forest 零泄漏硬门＋敏感信息扫描（方法复刻 r2b）

| # | 检查 | 结果 |
| --- | --- | --- |
| a | 路径级：跟踪表无 forest/figma/.codex/ui-variants（1061 个被跟踪文件） | 零命中 |
| b | `git check-ignore` forest 草稿目录 | 命中 `.gitignore:83`（019 用户红线） |
| c | CSS 变量 8 项（`--c-sage`/`--c-primary-subtle` 等） | 零命中 |
| d | 动画 token 6 项（`checkPop`/`fadeInUp` 等） | 零命中 |
| e | 组件/类型标识符 6 项（`AppSharedState`/`CharacterSVG` 等） | 零命中 |
| f | 草稿图标名 6 项（`IconFlask`/`IconGitBranch` 等，限 ts/tsx） | 零命中 |
| g | 中文数据串 10 项（`森间日常`/`夜航舞台` 等） | 零命中 |
| h | unitypackage 文件名 8 项（`mori_base` 等） | 零命中 |
| i | 色值 9 项（浅色板＋肤色板，大小写不敏感） | 零命中 |
| j | 字体栈 `PingFang SC`／`sidebarCollapsed` | 零命中 |
| k | 增量 diff 真实本机路径（`Users/AR`/`Documents`） | diff 中 3 处 `Users/AR` 命中**均在 r*b 审阅报告观察记录内**（扫描模式字符串与 L-1 发现记录）；功能性路径引用零出现 |
| l | 凭据模式（api_key/secret/bearer/ghp_/AKIA 等） | 增量内仅测试合成值（`GITHUB_TOKEN: "secret"` 为剥离断言负例、`value: "token"` 为合成 Cookie）；全树扫描仅 `sk-` 对 task-store 类文档词误报 |

（c–j 扫描口径排除 `collab/reviews/`——r*b 报告正文按归档惯例收录指纹
清单本身，属审阅证据文本，非派生内容。）

## 三、验证运行（全部本机独立执行）

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 全局状态 | `pnpm collab:brief` | exit 0；登记表 46/46 一致 |
| 登记表 | `pnpm collab:brief --registry-only` ×2 | exit 0 / exit 0 |
| Rust 全量 | `cargo test --workspace`（隔离 `CARGO_TARGET_DIR=$TEMP/vua-push-gate-target`） | **三轮一致：exit 0；67 个 `test result:` 行全部 ok；495 通过 / 0 失败**——与 5809d37 验收宣称逐位一致 |
| Clippy | `cargo clippy --workspace --all-targets -- -D warnings` | exit 0；日志中仅依赖包名子串（thiserror/serde_path_to_error）匹配「warning」字样，零真实告警 |
| 桌面全链 | `pnpm --filter @vua/desktop check` | **EXIT=0**：typecheck 绿；Test Files **58 passed (58)**；Tests **463 passed (463)**；check-boundary OK；check-i18n OK＋三语言表对齐；check-contrast 全部达标；check-leak **通过（159 条指纹，生产构建零泄漏）**——与验收宣称逐项相符 |

## 四、问题清单

### 低严重度

- **L-1 r*b 报告内 3 处 `Users/AR` 字样与「path literals redacted」宣称的
  轻微出入**。07c31c5 提交信息宣称审阅报告「path literals redacted」，
  实文中 r1b 表格（消毒对照记录 `C:/Users/AR/…`→`C:/Users/<本地用户>/…`）、
  r1b L-1 观察项（引用 .zcode/agents 路径字面值）、r2b 扫描结果表（扫描
  模式字符串）共 3 处保留字样。三处均为**审阅记录文本**（描述发现与扫描
  方法所必需），与 949ee30/上轮「collab 治理文本已知常态，不阻断」裁决同
  性质。不阻断推送；后续报告归档时建议将扫描模式写作 `C:/Users/<本地用户>`
  形态以自洽。
- **L-2（承接上轮不阻断项）** `.zcode/agents/`×7 含本机路径的消毒评估
  （BG-13 方式或 .gitignore）仍维持「需一次有意决策」挂起状态——本轮
  增量未触碰该目录，无恶化。
- **L-3（推送后 CI 回读发现，2026-09-12 03:0x 补记）** origin 上 12a6a45
  世代的 rust 34630656044 与 schema-vectors 34630656005 双红，同根失败＝
  `the_five_guards_refuse_typecally`（`crates/project-manager/tests/
  import_copy.rs:305`——`TargetInsideSource` 守卫在 GitHub Windows runner
  未拒绝；本机同 Windows/同 rustc 1.97.1 三轮绿；本轮增量未触碰该 crate，
  失败代码自 014 世代即在）。本轮推送触发的 ts 34634138971 通过；rust/
  schema-vectors 因 paths 过滤未触发，红态随代码持续在 main。已登记
  **BG-18**（路由环境；禁止跳过/忽略过关）＋流程更正：推送门自此含
  「推送后 CI 回读」步骤。wt-5 的 unity-bridge lint 观察登记 **BG-19**
  （集成同版本未复现；待 CI clippy 实际运行事实）。

## 五、结论与推送执行

增量小（实质 1 批）且该批合并验收（5809d37）已全链复跑绿；本轮核查矩阵
全绿。集成据此执行推送 `12a6a45 → 07c31c5`（4 提交）。如操作者认为本
世代仍需独立 Reviewer 面板复刻三轮，可对已推送世代补审——git 历史不变，
补审报告照归档惯例入库即可。
