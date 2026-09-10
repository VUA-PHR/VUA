# 推送前审阅（第 2 轮 / 共 3 轮）——2026-09-10 origin 推送门

> 审阅人：独立 Reviewer（round 2/3，子智能体）
> 日期：2026-09-10
> 审阅范围：`origin/main..main` 全部提交（origin 基点＝7da1b5f，2026-09-09）
> 审阅性质：只读复核＋本报告落盘；无实现、无合并、无提交、无推送
> 授权链：collab/README.md 升级规则＋proposal 019 红线「推送 origin 前 3 轮 Reviewer 审阅必须含 forest 零泄漏核查」

## Verdict

**通过（PASS）——无阻断项。** 建议在 ≥2/3 审阅通过后按现行机制推送；下方 5 项非阻断观察项供集成角色酌情落账。

---

## 1. 范围

- `git fetch origin` 干净（exit 0）。
- `origin/main..main`：**257 个提交**（90 merge ＋ 167 非 merge），日期跨 2026-09-09（47 个）至 2026-09-10（210 个）。
- 变更规模：201 文件，+16691 / −1237。
- 构成：桌面 renderer 批量切片（import/compose/recipe/packages/warehouse/settings、多 UI 批 A、018 批 1/2）、schema 升版（bdl-commands v0.4、bdl-queries v0.4、project-inspection v0.2、inspection-evidence v0.1、import-downloads 契约）、Rust 侧测试与切片、collab 状态/提案/仲裁大批量、CI（collab-registry.yml）。

## 2. 全量 diff 扫描

| 检查 | 方法 | 结果 |
| --- | --- | --- |
| 冲突标记（新增行） | `git diff origin/main..main \| grep -cE '^\+(<{7}\|>{7}\|\|{7})'` | **0 命中** |
| 凭据/token/私钥模式 | api_key/secret/password/Bearer/AKIA/ghp_/BEGIN PRIVATE KEY 等正则（剔除 tokenize 等误报词） | **0 命中** |
| .env / 凭据文件 | 文件名扫描 | **0 命中** |
| 付费资产/二进制 | 扩展名（png/jpg/zip/unitypackage/dll/exe/fbx/asset…）＋二进制探测 | **0 命中** |
| 大文件 | `git ls-tree -r -l` 排序：最大 248 KB（provider_host.rs 源码），均为文本源码 | 无异常 |
| wip:/fixup 提交 | 主题正则扫描 | 无真实 wip/fixup（命中均为正文词汇，如 "draft schema"、"word-list"） |
| 提交信息 vs 内容抽查 | 6dfa40e「compose-draft-store 122 lines」实测 `wc -l`=122 ✓；1360af1「App.tsx 113 lines」与 diff stat ✓；测试计数演进（53/432→54/435→54/439→54/441→55/443→56/447）与提交序列一致 ✓ | 抽查相符 |

**事故复核**：wt-main 第十二波「流程自纠（如实）」记录的 07f1f8a 冲突标记事故（shell 链失误，main 短暂带入含标记的 018，后续提交修正）——本审阅对整个范围 diff 的精确扫描为 **0 残留**，与自述一致，且事故已被诚实记录。非阻断。

## 3. forest 零泄漏核查（硬门，逐项证据）

| # | 检查 | 命令/方法 | 证据 | 结论 |
| --- | --- | --- | --- | --- |
| a | 全表无 forest/VUA-Figma/.codex/ui-variants 路径 | `git ls-files \| grep -iE 'forest\|figma\|\.codex\|ui-variants'` | 零命中 | **PASS** |
| b | check-ignore 命中规则 | `git check-ignore -v apps/desktop/src/ui-variants/forest/` | `.gitignore:83:apps/desktop/src/ui-variants/forest/` | **PASS** |
| c | `_local_*` 未跟踪 | `git status --porcelain` ＋ `git ls-files \| grep _local_` | status 仅 `?? .zcode/`（审阅工具自身目录，未跟踪）；ls-files 仅命中 `crates/project-manager/examples/vpm_local_install.rs`——正常源文件命名，非 `_local_*` 前缀约定物 | **PASS** |
| d | 今夜新增桌面文件无 Figma 数据/爬虫/本地绝对路径 | 扫描 import/、compose/、recipe/、ui-registry 等新文件 | 绝对路径命中均为测试合成数据（`C:/source/proj`、`C:/vua/copy`；且 diagnostics.test.ts 显式断言 `json.includes("C:/Users") === false`）；爬虫模式（puppeteer/cheerio/axios 抓取等）零命中；booth URL/硬编码条目数据零命中 | **PASS** |

**深查补充**：
- 范围 diff 中 `forest`/`VUA-Figma` 字样 40 处，逐类核对全部为**治理性引用**：.gitignore 规则登记、019/BOARD 红线原文照录（含「同目录 VUA-Figma-v2-2026-09-08/」的源位置说明）——无一为 Figma 生成代码或作品数据。
- 全历史核查 `git log --all --diff-filter=A -- '*forest*' '*VUA-Figma*' '*.codex*'`：**从未有任何此类路径被跟踪**。
- 受管文件中含 `.codex` / `C:/Users/<本地用户>` 字样的仅 2 个：`.gitignore`（忽略规则）与 `collab/proposals/019-multi-ui-shared-layer.md`（源文档位置登记）。见观察项 O1。

## 4. 一致性抽查（宣称 vs 实文）

| # | 宣称 | 实文证据 | 结论 |
| --- | --- | --- | --- |
| 1 | proposals 015/017/018/019 存在且状态正确 | 四文件均在；019=已接受（用户指令登记；文中第二行「草案，待评审」系源需求文档 0.1.0 头部**原文照录**——提案头明确「全文登记，一字未改」，自洽）；017=提出；018=草案（裁决 13 备稿，实现排期桌面自决，两方表态齐） | 一致 |
| 2 | 013/014 内联仲裁节 | 013 含「冻结落账／v0.2 升版／表态（核心，2026-09-10）」等内联线程；014 含「仲裁（集成，2026-09-09）」「实现验收（集成，2026-09-09）」节 | 一致 |
| 3 | design-standard 与 product-boundary 版本头 | design-standard ZH/EN 均 0.7.1 已接受（双语互指）；product-boundary ZH/EN 均 1.3.0（ZH 权威、EN 镜像声明） | 一致 |
| 4 | REGISTRY 40/40 | `node scripts/collab-brief.mjs --registry-only` → 「一致 40 项 / 异常 0 项（共 40 行）」，**exit 0** | 一致 |
| 5 | 015 多轮仲裁落账 | §9/§10/§11（集成表态与仲裁）、§12.8（B-3 受理）、§13（IMP-5 核验＋冒烟清单）、§14（BG-1 映射 A 路线两段式＋C 永久否决）均实存 | 一致（状态行滞后见 O2） |

## 5. 验证运行（本轮主项＝桌面前端链）

环境：本树 main @ 88dd71d，Windows，与其他审阅者并发无冲突。

| 步骤 | 命令 | 结果 |
| --- | --- | --- |
| typecheck | `pnpm typecheck`（check 链首步，`&&` 串联） | 通过（全链 exit 0） |
| vitest | `pnpm test` | **56 文件 / 447 测试全过**，2.63s——与最新提交宣称「56/447」一致（高于任务预期 55/443，因批 B 追加 compose-draft-store.test） |
| build | `pnpm build`（含 cargo release provider 构建＋tsc＋vite） | 通过（全链 exit 0） |
| boundary | `node scripts/check-boundary.mjs` | 「OK — Gateway 引用全部经 barrel」，exit 0 |
| i18n | check-i18n ＋ check-i18n-tables | 「业务代码无中文字面量」＋「3 个交付语言表与源表对齐」，均 exit 0 |
| contrast | check-contrast | 「全部达标」（深/浅/高对比度 × 紫/橙辖区全对通过） |
| leak | check-leak | 「通过（**159 条指纹，生产构建零泄漏**）」 |
| 登记表 | `node scripts/collab-brief.mjs --registry-only` | 「一致 40 项 / 异常 0 项」，**exit 0** |

## 6. 诚实纪律抽查（3 项）

1. **019 批 A「切换不重建 Gateway＝结构性满足；forest-green 诚实不可用」**——与实态相符：`App.tsx` 注释与结构一致（「共享容器(GatewayProvider/事件/状态)在此根下继续存在——仅 UI 树替换」；「多套 UI 根(019 批 A)：共享容器持有，切换不重建 Gateway」）；`ui-registry.ts` 中 `isUiRootAvailable("forest-green")` 恒 false（「未接入＝不可用，如实呈现」）、词表外回落 current、sessionStorage 会话级＋保守回落。宣称用词「结构性满足」未越界为真机结论。**通过**。
2. **019 批 B「save chain honestly disabled」**——与实态相符：`ComposePage.tsx` 保存按钮 `disabled aria-disabled` ＋ saveDisabledNote 文案；头注明确「不伪造保存；『已保存』仅在持久化成功后显示；当前有草稿内容即未保存」；`compose-draft-store.ts` 明确「**不进 localStorage**（核心 UI-03 评估……禁止散落 localStorage 充当生产文档库）」，仅会话持久化＋修订/脏标跟踪（有 58 行测试）。**通过**。
3. **015 §13 W25 冒烟清单与 018 批 1 leak 撤回**——§13.1 明确「非真机，已完成」仅指代码级核验，§13.2 六项真机冒烟标注「草案（W25 窗口项，用户参与点）」「执行归 W25 窗口统筹」，未宣称已执行；wt-main 中 018 批 1 验收记录如实写明 leak devOnlyMarkers 撤回理由＝「常量性误报修正、脚本内留备注、**159 指纹主防线保留**」（本轮实测复现 159 零命中）。**通过**。

## 7. 问题清单

**阻断项：无。**

非阻断观察项（供集成酌情落账，不构成推送门）：

- **O1（轻微·隐私卫生）**：`collab/proposals/019-multi-ui-shared-layer.md` 头部以绝对路径登记源文档（`C:/Users/<本地用户>/.codex/visualizations/...`），将操作者本机用户名带入受管文档。系用户红线条款的源位置登记、仅此一处（另为 .gitignore 规则），风险低；后续可用相对/脱敏描述。019 关闭后不改文，可在 BOARD 留一句话备忘。
- **O2（轻微·状态机滞后）**：015 头部状态仍为「草案（待集成/数据/核心表态，集成仲裁与排期）」，但 §9-§14 已载多轮表态与仲裁（三方表态齐、§14 已裁决）。proposals/README 状态集为 提出→讨论中→已接受/已拒绝/已撤回；建议演进状态行以反映「核心仲裁已毕、余排期项」，避免后续读者误判表态缺口。
- **O3（极轻微·存根陈旧）**：`docs/design/design-standard.md`（无语言后缀双语入口存根）标题停留 v0.6.1，与 ZH/EN 0.7.1 不同步。REGISTRY 未登记该存根符合治理说明；建议存根去版本号或随下次 Minor 同步。
- **O4（记录性）**：`git status` 有未跟踪 `?? .zcode/`（本审阅工具目录）。非 `_local_*` 约定物、不入推送；是否纳入 .gitignore 由集成定。
- **O5（记录性）**：vitest/leak 运行有 `MODULE_TYPELESS_PACKAGE_JSON` 警告（strings.fixtures.zh-CN.ts 等，Node 解析开销提示），不影响结果；如需消除可在 package.json 声明 `"type": "module"`（属工具链小修，另行排期）。

## 8. 结论

forest 零泄漏硬门四项全数通过且历史干净；257 提交无冲突标记/凭据/付费资产/大文件；桌面前端链本轮实测 **56 文件 447 测试全绿＋boundary/i18n/contrast 通过＋leak 159 指纹零命中**，`collab-brief --registry-only` exit 0（40/40）；三项诚实纪律抽查宣称与实态一致，019 批 B 保存链禁用与 018 批 1 leak 撤回理由均可复核。**本审阅轮 verdict＝通过**；待第 3 轮审阅达成 ≥2/3 后推送。

---
*审阅证据均产生于本树 main @ 88dd71d（2026-09-10）；验证命令与输出摘录见 §5，可复跑。*
