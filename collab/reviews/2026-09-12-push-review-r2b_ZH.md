# 推送增量复审报告（第 2 轮 b / 增量第 2 轮，r2b）

- 日期：2026-09-12
- 审阅对象：`origin/main..main` 待推送树（origin/main = `7da1b5f`，main = `9e87f8e`，共 **352 提交**，
  与任务描述一致）；本轮主项＝**forest 零泄漏硬门＋敏感信息泄漏扫描**
- 复审基线：r1–r3 已覆盖至 `88dd71d`（报告 `collab/reviews/2026-09-10-push-review-r{1,2,3}_ZH.md`），
  本轮复刻其方法并按主项加深
- 审阅者：独立 Reviewer（r2b，与生产进程非同一模型，只对结论负责）
- 性质：只读审阅；除本报告外未写任何文件、未 commit、未 push、未切分支；工作树干净（`git status --porcelain` 空）

## Verdict：**通过（可推送）**

forest 零泄漏硬门全部证据项零命中（方法复刻 r1 并加深为内容指纹级扫描）；敏感信息扫描无阻断项；
`check:leak` 真实运行通过（159 指纹，生产构建零命中）；增量 `88dd71d..main`（95 提交）无二进制残留、
无真实冲突标记、无仓库外目录引用进入实现文件。3 项观察（O-1～O-3）不构成推送前置。

## 一、forest 零泄漏硬门（主项，逐条证据）

### 方法

草稿源定位：`C:\Users\AR\.codex\visualizations\2026\09\07\01a07a2e-68a7-7be3-980f-938b50526e0b\
VUA-Figma-v2-2026-09-08\`（`source/src/` 为主、`VUA-v2-source/src/` 为其副本；TS/CSS 合计约
4461 行，另有 `VUA-multi-ui-requirements_ZH.md` 需求稿）。逐文件读取 `index.css`、`App.tsx`、
`data.ts` 并对全部 tsx/ts 机械提取导出标识符与色值，构建指纹清单后对**当前树全部被跟踪文件**
（1057 个，`git grep` 于 HEAD）扫描。

### 指纹清单（提取自草稿实文）

- CSS 变量 22 项：`--c-sage`、`--c-sage-light`、`--c-primary-subtle`、`--c-primary-h`、`--c-fg-2/3/4`、
  `--c-surface-2`、`--c-border-2`、`--c-success-bg` 等＋动效 token `--t-feedback/--t-panel/--t-outfit/--t-flow`
- 动画/类名：`checkPop`、`fadeInUp`、`slideInRight`、`anim-fadein`、`anim-slidein`、`anim-check`
- 组件/类型标识符 15 项：`AppSharedState`、`ProjectStage`、`CharacterSVG`、`CharacterConfig`、
  `OutfitThumb`、`NotificationSidebar`、`ProjectsPage`、`WorkspacePage`、`OverviewPage`、
  `EnvironmentPage`、`AssetsPage`、`SCHEMES` 等
- 图标名 48 项（`IconFlask`、`IconGitBranch`、`IconZap`、`IconHardDrive` 等，抽查 6 个独特项）
- 中文数据串 24 项：`森间日常`、`夜航舞台`、`林间基础体`、`短发·亚麻棕`、`针织外套·苔绿`、
  `运动鞋·米白`、`细框眼镜`、`蝴蝶结发饰`、`草地材质包·秋`、`自定义待机动画集`、
  `装配模拟需要您的确认`、`素材隔离警告`、`创作工作室`、`交互原型`、`BOOTH 个人作品集` 等
- unitypackage 文件名 8 项：`mori_base_v2.1.0`、`short_hair_linen_v1.3.1`、`knit_jacket_moss_v1.0.2`、
  `sneakers_cream_v1.1.0`、`wire_glasses_v1.0.0`、`bow_hair_v1.2.0`、`grass_tex_autumn_v1.0.0`、
  `custom_idle_unknown`
- 色值 60+ 项：核心浅色板（`#F6F5F1`/`#153E35`/`#1A5045`/`#7A9E8E`/`#E4E2DA`…）、深色板
  （`#161614`/`#2A6B58`/`#1A2D28`…）、角色肤色/发色板（`#8B6B55`/`#F5D4BC`/`#C87260`/`#DCA48A`…），
  大小写不敏感
- 其他：字体栈 `PingFang SC`、`sidebarCollapsed`、`AppSharedState` 模式

### 扫描结果（1057 个被跟踪文件）

| # | 检查 | 命令（可复现） | 结果 |
| --- | --- | --- | --- |
| a | 路径级：跟踪表无 forest/figma/.codex/ui-variants | `git ls-files \| grep -iE 'forest\|figma\|\.codex\|ui-variants'` | **零命中**（rc=1；跟踪文件 1057 个） |
| b | 草稿适配目录被忽略 | `git check-ignore -v apps/desktop/src/ui-variants/forest/` | 命中 `.gitignore:83`（第 79–82 行注释明示 proposal 019 用户红线） |
| c | 工作树无 `_local_*` 证据条目 | `git status --porcelain` ＋ `git ls-files \| grep _local_` | status 空；唯一含该子串的跟踪文件为既有示例源 `vpm_local_install.rs`（非证据目录） |
| d | 全历史从未跟踪此类路径 | `git log --all --diff-filter=A --oneline -- '*forest*' '*VUA-Figma*' '*.codex*' '*ui-variants*'` | **零输出**（全历史无一次添加） |
| e | CSS 变量＋动效 token | `git grep -nE -- '--c-(sage\|primary-subtle\|primary-h\|fg-4\|surface-2\|border-2\|fg-3\|success-bg\|warning-bg\|error-bg\|info-bg)'` 等 | **零命中**（rc=1） |
| f | 动画 token | `git grep -nE 'checkPop\|fadeInUp\|slideInRight\|anim-fadein\|anim-slidein\|anim-check'` | **零命中**（rc=1） |
| g | 组件/类型标识符 | `git grep -nE 'AppSharedState\|ProjectStage\|CharacterSVG\|CharacterConfig\|OutfitThumb\|NotificationSidebar\|…Page'` | 独特标识符**零命中**；仅 `GuidePage/ComposePage/ToolsPage` 命中——为 VUA 自有 feature 页组件（`apps/desktop/src/renderer/features/*`，签名 `page: GuidePageId` 参数化，与草稿 `shared` 注入不同构），属通用页名巧合，非派生 |
| h | 草稿图标名 | `git grep -nE 'IconFlask\|IconGitBranch\|IconZap\|IconHardDrive\|IconRotateCcw\|IconExternalLink' -- '*.tsx' '*.ts'` | **零命中**（rc=1；仓库图标命名体系不同） |
| i | 中文数据串 | `git grep -nE '森间日常\|夜航舞台\|林间基础体\|…'`（24 项） | **零命中**（rc=1） |
| j | unitypackage 文件名 | `git grep -niE 'mori_base\|short_hair_linen\|knit_jacket_moss\|sneakers_cream\|wire_glasses\|bow_hair\|grass_tex_autumn\|custom_idle_unknown'` | **零命中**（rc=1） |
| k | 全部色值（60+，大小写不敏感） | `git grep -niE '#(F6F5F1\|153E35\|…\|102030)'` ＋肤色板正则 | **零命中**（两正则均 rc=1） |
| l | 字体栈/侧栏状态 | `git grep -n 'PingFang SC'`、`git grep -n 'sidebarCollapsed'` | 均零命中（rc=1） |

「forest」字样的全部出现处逐条核对：`.gitignore` 规则（2 处）、`App.tsx`/`ui-registry.ts`/
`storage-keys.ts`/i18n 四语言文案中的 **`forest-green` 词表 ID 与诚实不可用实现**
（`isUiRootAvailable("forest-green") === false` 钉住测试、`ForestGreenUnavailableRoot`、
`uiForestUnavailable` Badge）——均属 019 已授权的词表与诚实禁用面，无任何 Figma 素材或源码。
「VUA-Figma」字样仅存于 proposal 019 红线/溯源指针与历轮审阅报告文本。

**硬门结论：通过。草稿内容零衍生进入被跟踪树。**

## 二、敏感信息扫描（全推送范围树）

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 被跟踪 .env/密钥文件 | `git ls-files \| grep -iE '(^\|/)\.env\|\.env$\|\.pem$\|\.p12$\|id_rsa\|\.key$'` | **零命中**（rc=1） |
| .gitignore 覆盖 | 查看 `.gitignore` | 第 13–15 行：`.env`、`.env.*`、`!.env.example`（例外文件本体不存在于跟踪表） |
| 凭据模式 | `git grep -niE '(api[_-]?key\|client[_-]?secret\|private[_-]?key\|password\|bearer \|ghp_\|github_pat_\|sk-\|AKIA\|xox\|BEGIN)'`（排除 lock/文档与显式占位） | 唯一命中 `crates/orchestrator/src/process.rs:87-104` `CREDENTIAL_ENV_REMOVALS` 常量表——系**剥离**子进程环境的第三方令牌的防御清单（注释：R2-2 凭据剥离基线），是防泄漏机制而非泄漏 |
| 本机绝对路径（反斜杠） | `git grep -nI 'C:\\Users\\AR'` | 26 处：`collab/LAUNCH.md`、`collab/roles/*.md`、`collab/roles/system-prompts/*.md`、`.zcode/agents/*.md`、审阅报告——均为角色/工作树登记与治理文本，**属任务定义的已知常态，报告不阻断** |
| 本机绝对路径（正斜杠） | `git grep -nI 'C:/Users/AR'` | 2 处：`apps/desktop/src/renderer/gateway/fixture-release.ts:34,50`（见 O-1） |
| BOOTH 爬虫物料标记 | `git grep -niE 'booth\.pm\|pximg\|scraped_html\|crawl_\|sessionid\|csrf' -- ':!collab' ':!docs/research'` | 实现代码内均为来源白名单 `https://booth.pm`（`main.ts` 3 处）与合成测试 URL（`booth.pm/items/1`、`items/1001`）；`MIGRATION_ASSETS_{EN,ZH}.md` 记录真实 pximg URL 已替换为合成 SVG data URI。真实商品 ID（4431242）仅出现在 `docs/research/`（公开页面观测锚点，见 O-3） |
| 付费资产内容 | 付费资产**内容**（图片/包体/模型）零出现；资产名仅两处字符串级出现（见 O-2 注、O-3） | 无内容泄漏 |
| 订单数据 / cookie | 全库凭据与订单字段模式扫描 | 零命中 |

**扫描结论：无阻断项。**

## 三、check:leak 真实输出（生产包 fixture 泄漏静态核查）

命令：`pnpm --filter @vua/desktop check:leak`（2026-09-12 本轮真实运行）。
关键输出（逐字引用）：

```text
$ node --experimental-strip-types scripts/check-leak.mjs
check-leak: 执行生产构建(vite build,临时目录)…
…chunk 大小告警（与泄漏无关）…
check-leak: 通过(159 条指纹,生产构建零泄漏)
```

退出通过：**159 条指纹，生产构建零命中**。（附带警告为模块类型解析性能提示，与泄漏无关。）

## 四、增量 `88dd71d..main` 快速过目

- 规模：**95 提交**、55 文件、**+2226 / −283**；新文件 14 个——`.zcode/agents/*.md`×7（角色常驻
  提示）、`apps/desktop/src/renderer/gateway/production-chain-port.{ts,test.ts}`、
  `crates/provider-host/tests/environment_snapshot_wire.rs`、`collab/assignments/2026-09-11-night_ZH.md`、
  前三轮审阅报告×3。
- 仓库外目录引用（新增行）：仅 `.zcode/agents`（工作树路径登记）与审阅报告引用检查命令文本；
  **实现文件零命中**；两个新实现文件（production-chain-port.ts 259 行、environment_snapshot_wire.rs
  155 行）逐模式 grep（路径/forest/figma/凭据类）零命中。
- 二进制残留：`git diff --numstat 88dd71d..main` 无 `-	-` 行，全增量纯文本。
- 冲突标记 `<<<<<<<`：新增行 3 处命中均在审阅报告正文引用的检查命令字符串（误报），
  无真实冲突标记。
- 提交卫生：范围内 wip/fixup/squash 零命中。
- 推送范围复核：`git rev-parse origin/main` = `7da1b5f`，`git log --oneline origin/main..main | wc -l`
  = **352**，与任务描述一致。

## 五、问题清单

### 阻断项

无。

### 观察（不构成推送前置，供责任角色后续处理）

- **O-1（低·隐私卫生）** `apps/desktop/src/renderer/gateway/fixture-release.ts:34,50`：
  DEV-only fixture 硬编码本机真实形态 Unity 工程路径（字面值已于推送前
  消毒为合成名）。头注已如实声明（仅 DEV 经 vite `/@fs/` 读取、
  正式实现由资产协议替换），且 `check:leak` 证实其指纹不进生产包——与 collab 文档本机路径同类
  （已知常态，不阻断）；但它在实现代码内且带真实工程名，建议随下一桌面批改为合成路径
  （如 `C:/Users/demo/…`）。
- **O-2（备忘）** `.zcode/agents/`×7 本轮入库（r1 时为未跟踪 `?? .zcode/`）。内容为角色常驻提示，
  与已跟踪的 `collab/roles/system-prompts/` 同类，含工作树本机路径（已知常态）。r1 备忘曾建议
  评估加 ignore，生产进程选择了入库留痕——如系有意决策即无问题，如实记录。
- **O-3（备忘）** `docs/research/` 与 schema 示例以「Meiyun」（含公开 BOOTH 商品 ID 4431242）作
  公开页面观测锚点与结构化示例标签；`crates/unity-bridge/tests/material_exec_real.rs`（默认
  `#[ignore]` 手工真机测试）引用本地已购资产**文件名** `Cineon_Meiyun_v1.00.unitypackage`。
  均为字符串级引用、无资产内容，属 AGENTS.md 本地合法取得资产测试与公开页面观测的许可范围。

## 六、结论

**通过。** forest 零泄漏硬门在内容指纹级（而非仅路径级）复核下零命中；敏感信息扫描无凭据/
.env/订单数据/付费资产内容泄漏；`check:leak` 159 指纹零命中（真实运行证据在案）；增量 95 提交
纯文本、无冲突标记、无实现文件夹带。3 项观察留待后续批处理，不构成推送前置。

- 本报告：`collab/reviews/2026-09-12-push-review-r2b_ZH.md`（本轮唯一写入文件）。
- 关键证据均以文中命令可复现；check:leak 输出为 2026-09-12 本轮真实运行。
