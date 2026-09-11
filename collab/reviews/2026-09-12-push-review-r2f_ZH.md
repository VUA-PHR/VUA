# 推送门回溯复审报告（第 2 轮 f / 推送门共 3 轮，r2f——前例因账户限额中断，本文为重启后独立取证）

- 日期：2026-09-12
- 审阅对象：`388d0d3..246848c`（**31 提交、37 文件、+1907/−240**，`git diff --shortstat` 与 `git log --oneline | wc -l`
  独立核实；origin/main＝`246848c` 经 `git rev-parse` 核实，**三个世代已实际在 origin**；
  `git status --porcelain` 为空，工作树＝HEAD）；硬门扫描对象＝**当前树全部被跟踪文件 1106 个**
  （`git ls-files | wc -l`；r2e 时点为 1094，差额来自本批新增）
- 本轮主项：**forest 零泄漏硬门＋敏感信息扫描**（方法参考 r2e：阳性对照先行、模式与目标双向
  CR 防假阴性、复合管道 rc 不作判定依据——以输出内容为唯一判定依据）
- 审阅者：独立 Reviewer（r2f，与生产进程非同一模型，只对结论负责）
- 性质：只读审阅；除本报告外在仓库工作树未写入任何文件、未 commit、未 push、未切分支；
  指纹模式与中间产物置于系统临时区，审阅结束删除
- 红线遵守：本报告不逐字引用任何本机绝对路径与真实资产名，一律以仓库相对路径、file:line 或
  转述指代；草稿演示数据串仅作指纹例证引用（其性质为原型虚构数据，非用户真实资产）
- 边界声明：本轮未重跑 cargo/clippy/vitest（r3 域）；CI 四绿为 29b6f03 世代集成实例回读记录
  （见 246848c 提交信息），本轮不为其背书、仅不与其冲突

## Verdict：**通过（回溯确认，无需行动）**

审阅对象已在 origin，本轮为事后独立复核。forest 零泄漏硬门在十类内容指纹（CJK 类取
「极大串＋引号串」并集，宽于 r2e）独立重提＋全量扫描下：**独特指纹实现文件零命中**；全部
命中闭合为四类——历史审阅报告自引用、通用领域词汇、008/W15 用户走查文案族（方向已证实为
仓库/走查→草稿）、proposal 019 已授权词面。本轮在 r2e O-2 已闭合的文案族之外**新闭合 3 句
同族重合**（§1.5），族至此完整。敏感信息扫描无阻断项；`check:leak` 本轮真实运行通过
（159 指纹，生产构建零命中）；增量 `388d0d3..246848c` 纯文本、零冲突标记、零实现文件
仓库外引用，五个聚焦区内容全为契约词汇/裁决文案/技术文档，零草稿衍生。

## 一、forest 零泄漏硬门（主项）

### 1.1 草稿源独立定位与规模

- 源目录 `.codex/visualizations` 存在（80 文件，与 r2e 记录一致）。草稿源＝2026-09-07 会话下
  VUA-Figma-v2 草稿：`source/src` 15 个 ts/tsx/css 文件、**5641 行**（`find -exec cat | wc -l`
  独立复核，与 r2e 一致）；`VUA-v2-source/src` 经 `diff -rq` 证实**逐字节相同**（零输出），
  只扫 source 一份。
- **无 r2e 之后的新增草稿面**：全树仅 2 个 html 且均在该草稿内（source/ 与 VUA-v2-source/
  各一份 index.html）；3 个 zip 均在该草稿目录内；2026-09-10 会话目录为空目录（0 文件）。

### 1.2 指纹提取（本轮独立重提，机械提取，模式文件一律 `tr -d '\r'`）

| 类别 | 数量 | 提取口径与 r2e 对比 |
| --- | --- | --- |
| CSS 变量 | 32＋2 | 具名 32（`--c-sage`、`--c-primary-h`、`--c-fg-2/3/4`、`--t-feedback`、`--r-sm/lg/xl`、`--shadow-*` 等）＋裸用 `var(--r)`/`var(--shadow)`；与 r2e 的 32＋2 一致 |
| keyframes＋anim 类 | 7 | 4 keyframes＋3 `.anim-*`；与 r2e 一致 |
| 导出标识符 | 73 | `export function/const/type/interface` 全集；与 r2e 一致 |
| 图标名 | 51 | `Icon\w+` 全集（含泛词 Icon/Icons/IconProps，分类时单列）；r2e 为 50（差一项即泛词口径） |
| 中文数据串 | 82 | data.ts 汉字串「极大串＋引号串」并集；r2e 引号串口径 63，本轮为其超集 |
| 色值 | 80 | 六/三/八位十六进制、大小写归一；与 r2e 一致 |
| 字体名 | 5 | 字体栈拆名（PingFang SC／Hiragino Sans GB／Microsoft YaHei UI／Noto Sans SC／-apple-system）；r2e 为 4，本轮多扫 `-apple-system` |
| 中文整句 | 404 | 全 src 汉字串 ≥8 字，「极大串＋引号串」并集；r2e 引号口径 186，本轮为其超集 |
| 中文短语 | 625 | 同上 ≥4 字；r2e 525，本轮超集 |
| pkg 名 | 11 | 草稿 package.json 依赖真名 10（react/vite/typescript/@types/* 等）＋草稿自有包名 `figma-make-app`；已剔除 build/name/scripts 等 JSON 结构键噪声 |
| 附加：unitypackage 名 | 9 | data.ts 全集（含 lilToon 一项）；与 r2e 一致 |

「极大串＋引号串」并集说明：极大串更长更具体，引号串保短串灵敏度——两者并集保证本轮
灵敏度不低于 r2e 口径。

### 1.3 扫描器有效性（阳性对照，先于一切「零命中」结论）

对照集＝r2e §1.5 已证实双端共存的 5 句（`生成后删除原始素材文件`、`实验性功能可能产生非预期
行为。启用前请确保你理解其影响。`、`没有进行中的任务`、`生成完成后删除原始`、`本原型不会
真正删除任何文件。`）。先逐句 grep 草稿实文确认存在（2/1/1/1/1 处），再经与本轮各类扫描
完全相同的管道（`git grep -F -f`）扫仓库：**命中 38 行 / 16 文件**（i18n、BOARD、proposal 008、
历史审阅报告、release notes 等）——管道有效性证明在案，以下全部结果以此为前提。

rc 纪律（r2e O-1 教训执行）：本轮复合命令中多次出现 `grep -c` 零匹配导致 rc=1 中断复合命令的
情形，均以**输出内容为唯一判定依据**复核，无一以 rc 判定。

### 1.4 扫描结果（1106 个被跟踪文件）

| # | 类别 | 结果 |
| --- | --- | --- |
| a | CSS 变量 32 具名 | 实现文件**零命中**；7 处命中全在 4 份历史审阅报告（integration/r2b/r2d/r2e，逐条核对为指纹清单文本） |
| a' | 裸用 `var(--r)`/`var(--shadow)` | **零命中**（仅 r2e 报告自引用 1 处） |
| b | keyframes＋anim 7 项 | **零命中**（全树，含审阅报告） |
| c | 导出标识符 73 项 | 独特标识符（`AppSharedState`/`CharacterSVG`/`CharacterConfig`/`ENV_CHECKS`/`NotificationSidebar`/`OutfitThumb`/`SCHEMES`/`ProjectStage` 及 `OverviewPage` 等 6 个页名）**命中全部且仅位于历史审阅报告**；命中实现侧的仅通用领域词：Project(1247)/Page(394)/Asset(377)/Notification(20)/ASSETS(28)/PROJECTS(4) 与四个同名页（§1.6） |
| d | 图标名 51 项 | 独特图标名（`IconFlask`/`IconGitBranch`/`IconZap`/`IconHardDrive`/`IconRotateCcw`/`IconExternalLink` 等）**仅命中历史审阅报告**；实现侧仅泛词 `Icon`/`IconProps`/`Icons` 命中 VUA 自有图标组件 `packages/design-system/src/icons/Icon.tsx` 与设计标准文档（React/英文惯用名） |
| e | unitypackage 名 9 项 | **全树零命中**（含审阅报告——其引用形态不带后缀） |
| f | 色值 80 项（`-i`） | 实现文件仅命中通用白 `#ffffff`（tokens.css 7 处、toggle.css 1 处、设计标准双语文档 4 处——后者且为 `#FFFFFF` 大写形态）；**12 个草稿独特色板值（sage 绿系/肤色系）命中行逐条核对＝r2b 报告指纹清单文本**（本轮初判曾误读为命中实现，定位后排除——留档见 O-1） |
| g | 字体名 5 项 | `PingFang SC`/`Hiragino Sans GB`/`Noto Sans SC`/`-apple-system` **零命中**（前三者仅审阅报告自引用）；`Microsoft YaHei UI` 命中 `packages/design-system/src/tokens.css` 与设计标准双语文档——Windows 系统字体名，`git log -S` 独立证实引入于 `9598f1f`（2026-09-02，**388d0d3 祖先**，早于草稿 09-07/08）；仓库栈形（Segoe UI 系）与草稿栈形（-apple-system 系）不同构。非派生 |
| h | 中文数据串 82 项 | **41 项零命中**；命中 41 项中：≥5 字的 12 项具体串（`林间基础体`/`短发·亚麻棕`/`针织外套·苔绿`/`运动鞋·米白`/`草地材质包·秋`/`蝴蝶结发饰`/`自定义待机动画集`/`素材隔离警告`/`装配模拟需要您的确认`/`BOOTH 个人作品集` 及项目名 `森间日常`/`夜航舞台`）**全部仅命中历史审阅报告**；其余 ≤4 字命中全为通用词（今天/动态/动画/环境/衣装/开源/待机/日常/眼镜/短发/针织/运动/配件…）。两个单发命中与 r2e 一致：`基础体`＝`collab/proposals/019-multi-ui-shared-layer.md:112` 契约语言（Base Body 域概念）；`发饰`＝`apps/desktop/src/renderer/i18n/strings.fixtures.zh-CN.ts` DEV fixtures 示例串（check:leak 覆盖对象） |
| i | 中文整句 404 项 | 命中句仅 **9 句**（非审阅报告命中 64 行），全部闭合：008/W15 文案族 7 句（§1.5）＋通用词 `Unity 版本`（2026-09-01/03/04 多提交引入，早于草稿）＋通用空态句 |
| j | 中文短语 625 项 | 命中 54 项：≥7 字者＝上述 9 句全集（无新增）；4–6 字 45 项全为通用产品/操作词（保存配方/修复计划/导入素材/查看详情/骨骼绑定/重启恢复/游玩环境/减少动态效果/简体中文/界面语言…），与 r2e 分类一致 |
| k | pkg 名 11 项 | 草稿自有包名 `figma-make-app` **零命中**；`tailwindcss`/`@tailwindcss/vite`（草稿独有技术栈）**零命中**；其余命中全为 react/vite/typescript/@types/* 等两项目合法共用的生态包名 |

**独特指纹对增量新增行的直扫**（ belts-and-suspenders）：具名 CSS 变量/动效/unitypackage 名/
字体名/`figma-make-app`/7 个独特标识符/6 个独特图标名/11 个草稿数据串对 `388d0d3..246848c`
全部 +1907 新增行扫描——**全零**。

### 1.5 008/W15 文案族闭合（r2e F-1/O-2 之外，本轮新见 3 句）

整句扫描非自引用命中共 9 句，其中 3 句为 r2e 未记录的同族重合，一并闭合：

| 句子 | 仓库位置 | 性质证据 |
| --- | --- | --- |
| `生成后删除原始素材文件`／`实验性功能可能产生非预期行为。…`／`没有进行中的任务`／`生成完成后删除原始 .unitypackage 文件。`／`本原型不会真正删除任何文件。` | `strings.zh-CN.ts:1587-1594` 等、`experimental-commands.tsx:26` | r2e §1.5 已闭合（proposal 008 用户走查派生，`008:16` 有明文出处） |
| `对应的 .unitypackage 文件。`（dialogBodyB） | `strings.zh-CN.ts` | 本轮新见；`git log -S` 证实由 `4fb6411` 引入（W15 走查重做） |
| `生成 VPM 替代` | `App.tsx`/`WarehouseAcquire.tsx` 注释、BOARD 多处 | 本轮新见；同由 `4fb6411`（及 `18603ac` 09-07 W15）引入，W15 功能词 |
| `此操作不可逆。确保你已验证 VPM 生成结果后再启用。`（dialogWarning） | `strings.zh-CN.ts` | 本轮新见；同由 `4fb6411` 引入 |

时间线独立取证：`4fb6411`＝2026-09-08 03:35:21 +0800（`git show -s` 核实）；草稿全部源文件
mtime＝2026-09-08 11:34:38（晚 8 小时）；**`git merge-base --is-ancestor 4fb6411 388d0d3` 为真**
（该提交远早于本批三个世代，早就在 origin）。方向＝**用户走查/仓库 → 草稿**，非泄漏。
`Unity 版本` 为通用域词（2026-09-01/03/04 即在库）。文案族至此全部闭合；若后续 i18n 再扩句，
对草稿句集重跑交集即可。

### 1.6 同名页与既有单发命中复核

- **同名页**：仓库 `features/compose/ComposePage.tsx:34` 为无参 `export function ComposePage()`
  （`6dfa40e` 2026-09-10 创建），草稿为 `ComposePage({ shared }: Props)` 注入式（草稿
  Compose.tsx:46）——**签名不同构**；`GuidePage`/`ToolsPage` 创建于 `ab242fb`（2026-09-04，
  早于草稿）；`SettingsPage` 为最通用设置页名。判定：领域命名巧合＋内容指纹零命中（本批对该
  文件零改动）。注意 ComposePage 创建时间晚于草稿，其「巧合」判定依据是签名非同构＋019 批次
  治理链（该页为 019 batch B 已验收交付物）＋十类内容指纹零命中，而非时间线。
- **forest 字样分布**（21 文件，较 r2e 的 20 多 1——`collab/assignments/2026-09-11-night_ZH.md`
  治理文本）：实现侧＝`App.tsx`（ForestGreen 诚实禁用面）、i18n 四语言、`ui-registry*.ts`、
  `storage-keys.ts`——全部为 proposal 019 已授权词面；其余为 `.gitignore` 与 collab 治理文本。
  无任何 Figma 素材或草稿源码。

### 1.7 四项历史检查（独立复刻）

| # | 检查 | 结果 |
| --- | --- | --- |
| a | 跟踪表路径零命中 | `git ls-files \| grep -icE 'forest\|figma\|\.codex\|ui-variants'` → **0** |
| b | 草稿适配目录被忽略 | `git check-ignore -v apps/desktop/src/ui-variants/forest/` → 命中 `.gitignore:83`（79–82 行注释明示 019 红线与三轮审阅门） |
| c | 工作树无 `_local_` 证据条目 | porcelain 空；`git ls-files \| grep -i _local_` 唯一命中＝`crates/project-manager/examples/vpm_local_install.rs`（既有示例源，本批零改动） |
| d | 全历史从未跟踪此类路径 | `git log --all --diff-filter=A --oneline -- '*forest*' '*VUA-Figma*' '*.codex*' '*ui-variants*'` → **0 条** |

**硬门结论：通过。** 草稿内容零衍生进入被跟踪树；全部命中闭合为审阅报告自引用、通用词汇、
008/W15 文案族（方向仓库/走查→草稿，且相关提交均为 origin 既有祖先）、019 授权词面四类。

## 二、敏感信息扫描（全树＋增量聚焦）

| 检查项 | 结果 |
| --- | --- |
| 被跟踪 .env/.pem/.key/id_rsa/.p12/.pfx/.crt/credential | **零命中**（ls-files count=0，以输出为空确认）；`.gitignore:13-27` 覆盖 `.env`/`.env.*`/`*.pem`/`*.pfx`/`*.p12`/`*.key`/`*.cookie(s)` 等 |
| 凭据 token 模式（ghp_/github_pat_/sk-/AKIA/xox/hf_） | 12 处命中**全部**为 bdl-commands 示例合成 taskId（`task-01hexample…`，含 "example" 段；`ta`+`sk-` 子串误报，与 r2e 记录一致）＋历史报告引用；零真实凭据 |
| `PRIVATE KEY` | 仅 4 处历史审阅报告引用扫描模式文本（自引用）；零真实私钥 |
| 凭据关键词（api_key/client_secret/private_key/password/bearer）实现侧 | 唯一命中＝`crates/orchestrator/src/process.rs:99-102` `CREDENTIAL_ENV_REMOVALS`（AZURE_CLIENT_SECRET/OPENAI_API_KEY/ANTHROPIC_API_KEY 等）——子进程环境防泄漏剥离清单，非泄漏 |
| 本机绝对路径（正斜杠，实现侧） | 4 文件全为合成/防泄漏用途：`provider-bootstrap.test.ts:19-21`（`C:/Users/test/…`）、`diagnostics.test.ts:17,34`（**断言诊断包不含 `C:/Users` 的防泄漏测试**）、`fixture-release.ts:34,50`（`C:/Users/demo/…`）、`download-events.test.ts:59`（`C:/Users/x/Downloads/closet.unitypackage` 合成） |
| 本机绝对路径（反斜杠，实现侧） | 唯一命中＝`crates/project-manager/tests/import_copy.rs:350` 文档注释，账户段＝`RUNNER~1`（GitHub Actions CI 标准账户 8.3 短名形态，BG-18 根因记录；非本机用户） |
| 真实账户名路径 | 实现侧 `C:/Users/AR`／`C:\Users\AR` **零命中**（count=0×2） |
| 本机路径（治理文本） | 其余命中全部位于 collab/（BOARD/proposals/reviews/LAUNCH/roles/system-prompts）与 `.zcode/agents/`——工作树/角色登记文本（任务定义已知常态） |
| 订单数据 | 零命中（无订单内容；协议面仅 receipt 类型名） |
| 付费资产内容 | 全树**零被跟踪二进制媒体/压缩包/模型文件**（11 类扩展名扫描为空）；无内容级泄漏载体 |
| `.log` 跟踪状态 | `git ls-files` 零 `.log`；`collab/reviews/evidence-r3d-flaky-warehouse-import.log` 存在于工作树但被 `.gitignore:28` 正确忽略（check-ignore 核实）——与 BOARD 声明一致 |

**扫描结论：无阻断项。**

## 三、check:leak 真实运行（生产包 fixture 泄漏静态核查）

命令：`pnpm --filter @vua/desktop check:leak`（脚本名经 `apps/desktop/package.json:17` 核实：
`node --experimental-strip-types scripts/check-leak.mjs`；2026-09-12 本轮真实运行，关键输出
逐字——告警行中的本机路径按红线略去）：

```text
$ node --experimental-strip-types scripts/check-leak.mjs
check-leak: 执行生产构建(vite build,临时目录)…
check-leak: 通过(159 条指纹,生产构建零泄漏)
```

**通过：159 条指纹，生产构建零命中。**（附带 chunk 大小告警与 MODULE_TYPELESS 告警各一，
均与泄漏无关。）

## 四、增量 `388d0d3..246848c` 聚焦复核（31 提交 / 37 文件 / +1907−240）

- **形态**：9 个新增文件＝proposal 020、`task-snapshot.schema.json`、6 个 task-snapshot
  向量、`crates/provider-host/tests/task_snapshot_wire.rs`；其余 28 个为修改。**零二进制**
  （numstat 无 `-` 行）、**零冲突标记**（`<<<<<<<` 新增行零处）。
- **模式扫描**（阳性对照先行：`'project'` 关键词命中新增行 **128 行**，管道可信）：本机路径
  （正/反斜杠）/.codex/visualizations/VUA-Figma/figma/booth/cookie/token/unitypackage/.env/
  password/secret/api_key/PRIVATE KEY/ghp_/AKIA 对全部 +1907 新增行——**全零**；`forest`
  6 行命中经逐文件归属核实**全部在 `collab/BOARD.md`（2）与 `collab/state/wt-main.md`（4）**
  推送门记录治理文本。
- **聚焦区内容形态**（逐一目验）：
  1. **task-snapshot schema/向量**：schema 为规范 draft-07 JSON Schema（`$id`/`allOf` if/then
     冻结不变量：非终态与 failed/cancelled 不得携带 result、failed 必携 error、result 为对象
     且 null 视为字段缺席）；6 向量全部使用合成 ID（`job-20260912-*`/`task-bad-*`/`corr-*`）。
     纯契约词汇。
  2. **setNote/行内备注**：`gateway-router.ts` 新增 `project.setNote` 路由（commandId＝
     `note-${crypto.randomUUID()}`，任务化受理）；i18n 新增备注区文案（项目备注/单行备注,
     最多 2000 字符/三态呈现说明）。契约词汇＋产品文案。
  3. **B5② 四语文案**：i18n 四文件新增外部项目提示不确定性表述（en/ja/ko/zh 对齐，BOARD B5
     行销账记录在案）。裁决文案。
  4. **project-ops TS 镜像**：`packages/contracts/src` 三文件与 gateway 两文件改动均为 v0.2
     契约面（word-list 引用与守卫）。契约词汇。
  5. **alcom-vcc 1.2.0 文档节**：出现在 collab 治理文本（BOARD/state）与
     `import_copy.rs` 文档注释（ProjectSettings/VCC settings.json 技术说明）。技术文档。
- 以上全部为契约词汇/裁决文案/技术文档，**零草稿衍生**（独特指纹直扫新增行全零，§1.4 末条）。

## 五、问题清单

### 阻断项

无。

### 观察（不构成推送前置——本批已在 origin，均属留档）

- **O-1（方法学·留档）** r2e O-1 的 rc 归属教训本轮再现两次价值：一次为 `grep -c` 零匹配的
  rc=1 中断复合命令（照以输出内容判定排除）；一次为色值逐模式分类初读误判（12 个独特色板
  「各命中 1 行」初看像命中实现，逐行定位后证实全部是 r2b 报告指纹清单文本被 `-i` 命中）。
  教训固化：**凡命中必逐行定位文件归属后才可分类**，聚合计数会掩盖命中载体性质。
- **O-2（备忘·已闭合）** r2e F-1/O-2 文案族之外，本轮整句扫描新见 3 句同族重合（§1.5 表），
  均由 `4fb6411`（W15 走查重做）引入且该提交已是 origin 既有祖先；008/W15 文案族至此完整
  闭合。若 i18n 再扩句，对草稿句集重跑交集即可。
- **备忘** 草稿源侧自 r2e 后无变化（无新草稿面）；若 `.codex/visualizations` 出现新会话内容
  （新 html/源码），指纹提取范围需重新定位。另：brief 显示 wt-2 失鲜 14 提交——生产协调事项，
  与本审阅无关，仅代呈。

## 六、结论

**通过（回溯确认）。** 审阅区间 `388d0d3..246848c`（31 提交/37 文件/+1907−240，已在
origin/main＝246848c）在 forest 零泄漏硬门十类内容指纹（CJK 类宽于 r2e 的并集口径）独立重提
与全树 1106 文件扫描下：独特指纹（具名 CSS 变量/动效/7 个独特标识符/独特图标名/9 个
unitypackage 名/12＋66 项独特色板与数据串/草稿自有包名/独特字体名）实现文件零命中；全部命中
闭合为审阅报告自引用、通用领域词汇、008/W15 文案族（方向仓库/走查→草稿，相关提交均为
origin 既有祖先——本轮新闭合 3 句，族完整）、019 授权词面四类。四项历史检查全部通过。
敏感信息扫描零凭据/零敏感文件/零真实账户路径/零订单与付费资产载体；`check:leak` 本轮真实
运行通过（159 指纹零命中）。增量五个聚焦区全为契约词汇/裁决文案/技术文档，零草稿衍生、
零二进制、零冲突标记、零实现文件仓库外引用。O-1/O-2 为方法学与族闭合留档，不构成行动项。

- 本报告：`collab/reviews/2026-09-12-push-review-r2f_ZH.md`（本轮唯一仓库内写入文件）。
- 关键证据均以文中命令可复现；check:leak 输出为 2026-09-12 本轮真实运行。
- **终态注记（审阅结束核验）**：审阅期间 main 前移一格至 `4498851`（仅
  `.github/workflows/schema-vectors.yml` CI 配置 +4/−3，将 task_snapshot_wire 纳入权威清单），
  origin/main 仍＝`246848c`＝本轮审阅对象尖端，全部结论不受影响；工作树另有 r1f/r3f 两份
  未跟踪报告文件系并行审阅者所写，非本轮写入。
