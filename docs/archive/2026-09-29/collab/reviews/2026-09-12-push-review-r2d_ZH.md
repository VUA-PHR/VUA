# 推送增量复审报告（第 2 轮 d / 推送门共 3 轮，r2d）

- 日期：2026-09-12
- 审阅对象：`bc59453..main` 待推送树（origin/main = `bc59453`、main = `34eddaf` 均经 `git rev-parse` 独立核实；**20 提交、30 文件、+1466/−466**）；硬门扫描对象＝**当前工作树全部被跟踪文件 1069 个**（`git status --porcelain` 为空，工作树＝HEAD）
- 本轮主项：**forest 零泄漏硬门＋敏感信息扫描**（方法参考 r2b，证据独立取证）
- 审阅者：独立 Reviewer（r2d，与生产进程非同一模型，只对结论负责）
- 性质：只读审阅；除本报告外在仓库工作树未写入任何文件、未 commit、未 push、未切分支；模式串经管道传递，系统临时区中转文件已删除
- 红线遵守：本报告不逐字引用任何本机绝对路径与真实资产名，一律以 file:line 或转述指代

## Verdict：**通过（可推送）**

forest 零泄漏硬门在内容指纹级（本轮加深至**全部中文整句/短语全量交集**）复核下，独特指纹零命中；
敏感信息扫描无阻断项；`check:leak` 真实运行通过（159 指纹，生产构建零命中）；增量 `bc59453..main`
纯文本、无冲突标记、无仓库外目录引用进入实现文件、windows-sys dev-dep 备案四项有据。
本轮另发现并修复了一个**审阅工具假阴性陷阱**（见 O-1，方法学留档，非仓库缺陷）与一组
**草稿/仓库双端共存的中文整句**（F-1，证据链闭合为非泄漏，历轮未覆盖、本轮补齐）。

## 一、forest 零泄漏硬门（主项）

### 方法与扫描规模

- 草稿源独立定位：`.codex/visualizations` 下 2026-09-07 会话中的 VUA-Figma-v2 草稿（`source/src/`
  为主、`VUA-v2-source/` 为其副本；完整定位见 r2b 报告 §一，本文按红线不逐字引用路径）。
  `source/src` 下 TS/TSX/CSS 合计 **5641 行**，逐类机械提取指纹。
- 指纹清单（提取自草稿实文，本轮独立重提，与 r2b 清单交叉一致）：
  - CSS 变量 **32 项**（`--c-sage`、`--c-sage-light`、`--c-primary-subtle`、`--c-primary-h`、
    `--c-fg-2/3/4`、`--c-surface-2`、`--c-border-2`、`--c-*-bg` 系列＋动效 token
    `--t-feedback/--t-panel/--t-outfit/--t-flow`＋`--r-sm/lg/xl`、`--shadow*`）
  - keyframes **4 项**（`checkPop`/`fadeInUp`/`slideInRight`/`spin`）＋ `.anim-*` 类名 **3 项**
  - 组件/类型导出标识符 **60+ 项**（`AppSharedState`、`ProjectStage`、`CharacterSVG`、
    `CharacterConfig`、`OutfitThumb`、`NotificationSidebar`、`SCHEMES`、`ENV_CHECKS` 及
    各 `*Page` 等）
  - 图标名 **50 项**（`IconFlask`、`IconGitBranch`、`IconZap`、`IconHardDrive` 等全集）
  - unitypackage 文件名 **8 项**（`mori_base_v2.1.0`、`short_hair_linen_v1.3.1`、
    `knit_jacket_moss_v1.0.2`、`sneakers_cream_v1.1.0`、`wire_glasses_v1.0.0`、
    `bow_hair_v1.2.0`、`grass_tex_autumn_v1.0.0`、`custom_idle_unknown`）
  - 色值 **79 项**（大小写不敏感；含核心浅/深色板与角色肤色/发色板）
  - 字体栈 4 个字体名（`PingFang SC`、`Hiragino Sans GB`、`Microsoft YaHei UI`、`Noto Sans SC`）
  - 中文数据串（`data.ts`）**43 项**＋页面级中文整句（≥8 字）**157 项**＋中文短语全集（≥4 字）
    **456 项**
- 扫描对象：**1069 个被跟踪文件**（`git grep` 于工作树＝HEAD）。

### 方法学事件（如实留档，影响结论可信度）

首轮 456 项短语固定串循环扫描返回"零交集"，与已证实的共存句矛盾。排查发现：本机 Git Bash 的
`grep -o` 向管道输出时行尾补 CR（草稿文件本身亦为 CRLF），污染模式数组导致 `git grep -F`
静默假阴性。以**阳性对照**（已知共存句 → 命中）揭穿失效，改用 `git grep -f -`（其对模式行尾
CR 有剥离）＋ `tr -d '\r'` 双保险重跑全部批次，并保留阳性对照作为扫描器有效性证明。
**本报告全部结果以修复后扫描器为准。**

### 扫描结果（1069 个被跟踪文件）

| # | 检查 | 结果 |
| --- | --- | --- |
| a | CSS 变量 32 项（含全部通用名） | 实现文件**零命中**；仅 3 行命中＝`collab/reviews/` 历史审阅报告引用指纹清单本身（自引用，逐条核对为检查命令文本，豁免） |
| b | keyframes＋anim 类 7 项 | 同上，仅审阅报告自引用（4 行） |
| c | 组件/类型标识符 | 独特标识符（`AppSharedState`/`CharacterSVG`/`OutfitThumb`/`NotificationSidebar`/`SCHEMES` 等）**零命中**；`GuidePage`/`ComposePage`/`ToolsPage` 命中＝VUA 自有 feature 页（`apps/desktop/src/renderer/features/*`），见下"同名页核对" |
| d | 图标名 50 项（全集） | 仅审阅报告自引用（3 行） |
| e | unitypackage 文件名 8 项 | 仅审阅报告自引用（4 行） |
| f | 色值 79 项（`-i`） | 仅审阅报告自引用（2 行），实现零命中 |
| g | 字体栈 | `PingFang SC`/`Hiragino Sans GB`/`Noto Sans SC` 零命中；`Microsoft YaHei UI` 命中 `packages/design-system/src/tokens.css:87-90` 与设计标准双语文档——**Windows 系统字体名**，仓库栈形（`--vua-font-family`＝Segoe UI 系）与草稿栈形（`-apple-system` 系）不同构，且引入于 2026-09-02（`9598f1f`，早于草稿、已是 bc59453 祖先在 origin）。非派生 |
| h | 中文数据串（data.ts 43 项独特资产串） | **零命中**（`森间日常`/`夜航舞台`/`林间基础体`/`草地材质包·秋`/`短发·亚麻棕` 等） |
| i | 中文整句（≥8 字 157 项） | 仅 F-1 三组共存（见下），其余零命中 |
| j | 中文短语全集（≥4 字 456 项） | 交集全部为通用产品词汇（`游玩环境`/`查看详情`/`重启恢复`/`恢复快照`/`减少动态效果`/`修复计划`/`骨骼绑定`/`界面语言` 等约 200 文件分布），属同一用户需求域的正常词汇重合，无独特创意串 |

**同名页核对**：`GuidePage.tsx`/`ToolsPage.tsx` 创建于 2026-09-04（`ab242fb`，早于草稿）；
`ComposePage.tsx` 创建于 2026-09-10（`6dfa40e`，晚于草稿），但签名为无参
`export function ComposePage()`，与草稿 `shared`（AppSharedState 注入）形不同构，且该文件及
全树零指纹命中——"compose"系 VUA 自有产品域（019 批 C 工单、production-use-case 契约），
页组件命名重合属领域词汇巧合，非派生。`6dfa40e` 亦为 bc59453 祖先（不属本批增量）。

### F-1（发现·已闭合·非阻断）：三组中文整句草稿/仓库双端共存

本轮页面级整句扫描（历轮 r1–r3/integration/r1b–r3b/r1c–r3c 均未覆盖此粒度）发现三组句子
同时存在于草稿页面与仓库文案，逐组以时间线与来源标注核实性质：

| 句子（功能/spec 词汇） | 仓库引入 | 性质证据 |
| --- | --- | --- |
| `生成后删除原始素材文件` | `4fb6411`（09-08 03:35） | 仓库侧来源＝用户走查示意图 A 第二行＋proposal 008（`delete-originals-flag.ts:2`、`storage-keys.ts:32` 注明）；草稿文件 mtime 09-08 11:34 **晚于**仓库引入 8 小时 |
| `实验性功能可能产生非预期行为。…` | `4fb6411`（09-08 03:35） | 同上；且为通用警告句式 |
| `没有进行中的任务` | `61116fe`（09-05） | 早于草稿 3 天；通用空态句式 |

结论：方向为**仓库/用户规范 → 草稿**（原型据用户需求与既有 spec 生成），非草稿 → 仓库；
三个引入提交均为 bc59453 祖先（**已在 origin，不属本批增量**）。判定：非泄漏。

### 四项历史检查（复刻 r2b）

| # | 检查 | 命令 | 结果 |
| --- | --- | --- | --- |
| a | 跟踪表路径零命中 | `git ls-files \| grep -iE 'forest\|figma\|\.codex\|ui-variants'` | **零命中**（rc=1；1069 文件） |
| b | 草稿适配目录被忽略 | `git check-ignore -v apps/desktop/src/ui-variants/forest/` | 命中 `.gitignore:83`（79–82 行注释明示 proposal 019 用户红线与三轮审阅门） |
| c | 工作树无 `_local_*` 证据条目 | `git status --porcelain`＋`git ls-files \| grep _local_` | porcelain 空；唯一含子串者为既有示例源 `crates/project-manager/examples/vpm_local_install.rs`（非证据目录，本批零改动） |
| d | 全历史从未跟踪此类路径 | `git log --all --diff-filter=A --oneline -- '*forest*' '*VUA-Figma*' '*.codex*' '*ui-variants*'` | **0 条**（全历史无一次添加） |

「forest」字样全树 91 处分布逐文件核对：`forest-green` 词表 ID 与诚实禁用面
（`App.tsx:195-263,1260-1261` 的 `ForestGreenUnavailableRoot`/`isUiRootAvailable("forest-green")`、
`ui-registry*.ts`、`storage-keys.ts:42`、i18n 四语言）＝019 已授权词表；`.gitignore` 规则 2 处；
其余为 collab 治理文本与历轮审阅报告。无任何 Figma 素材或源码。

**硬门结论：通过。草稿内容零衍生进入被跟踪树；F-1 三组共存句证据链闭合为共同上游（用户
spec）且全部已在 origin。**

## 二、敏感信息扫描（全树）

| 检查项 | 结果 |
| --- | --- |
| 被跟踪 .env/.pem/.key/id_rsa/.p12/.pfx/.crt/credentials | **零命中**（rc=1）；`.gitignore:13-15` 覆盖 `.env`/`.env.*`（例外 `!.env.example` 本体不在跟踪表） |
| 凭据 token 模式（`ghp_`/`github_pat_`/`sk-`/`AKIA`/`xox`/`hf_`/`BEGIN …PRIVATE`） | 唯一命中＝schema 示例合成 ULID `task-01hexample…`（含 "example" 段）与审阅报告引文；零真实凭据 |
| 凭据关键词（api_key/client_secret/private_key/password/bearer） | 实现代码内唯一命中＝`crates/orchestrator/src/process.rs:88-104` `CREDENTIAL_ENV_REMOVALS` 防御性剥离清单（R2-2 基线，防泄漏机制而非泄漏），符合任务定义的已知常态 |
| 本批新增 desktop 6 文件（production-chain-store/model/Section/InspectionPage 及测试）逐模式扫描（本机路径/.codex/forest/figma/booth/cookie/token/unitypackage/.env） | 干净；唯一命中＝测试合成 ID `task-r`（系 `sk-` 子串误报） |
| `import_copy.rs` 修复与其测试 | 干净；`crates/project-manager/tests/import_copy.rs:336-343` 注释含 GitHub Actions 通用 runner 账户的 8.3 短名 TEMP 形态示例——CI 标准账户名，非本机用户路径，属 BG-18 根因技术记录 |
| 本机绝对路径（反斜杠 26 处） | 全部在 `collab/LAUNCH.md`、`collab/roles/*.md`、`.zcode/agents/*.md` 与 r1b/r2b/r3b 报告——工作树/角色登记治理文本（任务定义已知常态） |
| 本机绝对路径（正斜杠 4 处） | 全部在审阅报告文本；**实现文件零命中**——r2b O-1 的 `fixture-release.ts` 已消毒为合成 demo 路径（`12a6a45`，2026-09-12，系 bc59453 祖先，不属本批） |
| 订单数据 | 关键词扫描仅命中协议 receipt 类型名（`DownloadIngestReceiptV03`/`ImportCopyReceiptV01`）；零订单内容 |
| 付费资产内容 | 实现内 `unitypackage` 命中全为合成测试名（`closet.unitypackage`）与模式枚举值；真实资产名仅字符串级见于 `docs/research/` 公开页面观测锚点、schema 示例标签与 `#[ignore]` 手工真机测试（r2b O-3 在案不具名，许可范围维持）；**全树零被跟踪二进制媒体/压缩包/模型文件**，内容级泄漏无载体 |

**扫描结论：无阻断项。**

## 三、check:leak 真实运行（生产包 fixture 泄漏静态核查）

命令：`pnpm --filter @vua/desktop check:leak`（脚本名经 `apps/desktop/package.json:17` 核实；
2026-09-12 本轮真实运行）。关键输出（逐字引用）：

```text
$ node --experimental-strip-types scripts/check-leak.mjs
check-leak: 执行生产构建(vite build,临时目录)…
…chunk 大小告警（与泄漏无关）…
check-leak: 通过(159 条指纹,生产构建零泄漏)
```

**通过：159 条指纹，生产构建零命中。**（附带 chunk 大小与模块类型警告均与泄漏无关。）

## 四、增量 `bc59453..main` 快速过目（20 提交 / 30 文件 / +1466−466）

- 二进制残留：`git diff --numstat bc59453..main` 无 `-	-` 行，**纯文本**。
- 冲突标记 `<<<<<<<`：新增行 **0 处**。
- 仓库外目录引用（新增行）：`.codex`/`visualizations`/`VUA-Figma`/本机盘符路径 **零命中**；
  仅 BG-18 注释中的 CI runner 通用账户 8.3 短名形态（§二已核对性质）。
- windows-sys dev-dep 备案四项：
  - **owner/purpose/license/removal 全文**：`collab/state/wt-6.md:59-62`（owner＝vua-project-manager、
    purpose＝BG-18 回归测试 GetShortPathNameW 取 8.3 短名、license＝MIT/Apache 双许可、
    removal＝随拼写回归测试移除）；
  - 合并提交 `34eddaf` 信息含备案摘要；`crates/project-manager/Cargo.toml:41-47` 注释载明
    purpose 与 removal（dev-only、`cfg(windows)` 限定、库面零新增）；
  - 「既有锁定版本」宣称独立核实：`Cargo.lock:3255-3267` 中 windows-sys 0.52.0 与 0.61.2
    均先在（lock 本批零改动）。

## 五、问题清单

### 阻断项

无。

### 观察（不构成推送前置）

- **O-1（方法学·留档给后续轮次）** 本轮揭穿并修复审阅工具假阴性陷阱：Git Bash `grep -o`
  管道输出行尾补 CR＋草稿文件 CRLF，固定串模式数组被污染后 `git grep -F` 静默零命中。本轮以
  阳性对照＋`git grep -f -`（CR 剥离）修复。**建议：后续任何轮次的指纹扫描必须附已知共存
  模式的阳性对照**，否则"零命中"不可信。此为审阅方法风险，非仓库缺陷。
- **F-1（备忘·已闭合）** 三组中文整句双端共存（§一表），证据链（草稿 mtime 晚于仓库引入、
  仓库侧标注用户走查来源、均已在 origin）支持非泄漏判定。历轮未做页面级整句扫描，本轮补齐；
  后续轮无需重复，但若 i18n 再扩句建议对草稿句子集重跑交集。
- **备忘** r2b O-1（fixture 本机工程路径）已由生产进程消毒为合成路径（`12a6a45`），本轮
  复核实现文件正斜杠路径零命中——O-1 可销账。

## 六、结论

**通过。** forest 零泄漏硬门在内容指纹级＋中文整句/短语全量交集深度下复核零独特命中（F-1
三组共存句证据链闭合为共同上游且不属本批）；敏感信息扫描无凭据/.env/订单数据/付费资产内容
泄漏；`check:leak` 159 指纹零命中（真实运行证据在案）；增量 20 提交纯文本、无冲突标记、无
实现文件仓库外引用、windows-sys 备案四项有据。O-1 为审阅方法学留档、F-1 已闭合，均不构成
推送前置。

- 本报告：`collab/reviews/2026-09-12-push-review-r2d_ZH.md`（本轮唯一仓库内写入文件）。
- 关键证据均以文中命令可复现；check:leak 输出为 2026-09-12 本轮真实运行。
