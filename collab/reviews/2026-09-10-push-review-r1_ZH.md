# 推送前审阅报告（第 1 轮 / 共 3 轮）

- 日期：2026-09-10
- 审阅对象：`origin/main..main` 全部待推送提交
- 审阅者：独立 Reviewer（第 1 轮，独立给出结论，未参考另两位审阅者）
- 性质：只读审阅；除本报告外未写任何文件、未 commit、未 push

## Verdict：**通过（可推送）**

硬门（forest 零泄漏）四项证据全部通过；全量 cargo test 496/0；registry 校验 40/40 exit 0。
无阻断项；2 项低严重度问题与 2 项备忘见问题清单，建议随后续文档批处理，不构成推送前置。

## 一、审查范围

- `git fetch origin` 后：`origin/main = 7da1b5f`，`main = 88dd71d`。
- 提交数：**257**（`git log --oneline origin/main..main | wc -l`）。
- 全量 diff：**201 文件，+16691 / −1237**（`git diff --stat origin/main..main`）。
- 范围内主要实现批：multi-UI 019 批 A/B、018 批 2、BG-1 主切片 1–3、#20 修复、W22
  记录面收尾、bdl-commands v0.4（IMP-3）、bdl-queries v0.4 读面、project-manager
  身份文件（e885ecc）、U9 导航三修＋裁决 10/11、project-inspection v0.2、W25 A1
  warmup 测试（f7ff690，环境条件性）、inspection-evidence v0.1 草案。

## 二、全量 diff 扫描

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 冲突标记 | `git diff origin/main..main \| grep -nE '^\+.*(<<<\|\|\|\|\|\|\|>>>>>>>)'`（排除纯分隔线） | 唯一命中为文档正文引用的检查命令「合并提交前必检 `grep -c "<<<<<<<"`」，非真实冲突标记 |
| 凭据/token/.env | 凭据模式 grep（api_key/secret/PRIVATE KEY/Bearer/ghp_/sk- 等） | 唯一命中 `task-01hexample0000000000000d`（结构化合成示例 ID，含 "example"），非真实凭据 |
| .env/付费资产/二进制文件名 | `git diff --name-only \| grep -iE '\.env\|.pem\|.unitypackage\|.fbx\|.png\|.zip\|.dll\|.exe...'` | 零命中（rc=1） |
| 大文件二进制 | `git diff --numstat` 排序 | 全部为文本；最大单文件 +1002 行（provider_host.rs）；无二进制 |
| wip:/fixup 提交 | `git log --oneline origin/main..main \| grep -iE 'wip\|fixup\|squash'` | 零命中 |
| 提交信息 vs 内容 | 抽查 019 批 A（0227640/1360af1）、019 批 B（6dfa40e/e611cf0）、#20（2517dc8/7db13f3）、018 批 2（13764fa/a616c5a）、IMP-3（2688105/89038f5） | 文件清单、行数、测试数与合并信息一致；未发现明显不符 |
| 本地绝对路径（diff 新增行） | `git diff -S 'C:/Users/<本地用户>' --name-only` | 仅 2 处，均在 collab 文档：`collab/BOARD.md`（13 项裁决 U7-②原文转写，裁决文本本身明示所指本地爬虫物料「严禁提交入库」）与 `collab/proposals/019-multi-ui-shared-layer.md` 头部源文档指针。属裁决原文引用，非实现文件泄漏（见问题清单 L-2） |
| "VUA-Figma" 字串（diff 新增行） | grep | 仅 2 处，均为 proposal 019 红线/溯源文本对「仓库外快照目录名」的指针声明，无任何 Figma 内容 |

## 三、forest 零泄漏核查（硬门，逐条证据）

1. **a. `git ls-files` 全表（1043 个跟踪文件）**
   `git ls-files | grep -iE 'forest|figma|\.codex'` → **零命中**（rc=1）。
   `git ls-files | grep -i 'ui-variants'` → **零命中**（rc=1）。
2. **b. `git check-ignore -v apps/desktop/src/ui-variants/forest/`**
   → 命中 `.gitignore:83`：`apps/desktop/src/ui-variants/forest/`（第 79 行注释明示
   "proposal 019 (user red line)"）；另 `/_local_*/` 规则在第 4 行。
3. **c. `git status --porcelain`（主树）**
   → 仅 1 项 `?? .zcode/`（未跟踪）。**无任何 `_local_*` 条目**；`git ls-files`
   无 `_local_` 前缀跟踪文件（唯一含该子串的 `crates/project-manager/examples/vpm_local_install.rs`
   为既有示例源文件名，非证据目录）。今夜各角色证据目录（如 `_local_w25/`）不在主树，
   与状态文件记载一致。
4. **d. 今夜新增实现文件抽查 3 件（全文阅读/grep）**
   - `apps/desktop/src/renderer/app/compose-draft-store.ts`（019 批 B，122 行）：无
     Figma 数据、无爬虫 html、无本地路径；注释明示「保存入口……事实源切片接入前保存
     不可用（诚实禁用，不伪造保存）」「不进 localStorage」。
   - `apps/desktop/src/renderer/app/ui-registry.ts`（019 批 A，45 行）：仅含词表 ID
     `"forest-green"` 字符串（属需求词表，非 Figma 素材/源码）；无路径、无爬虫内容。
   - `crates/project-manager/src/vua_identity.rs`（e885ecc，176 行）及其测试
     `tests/vua_identity.rs`：对 `C:\Users` / `C:/Users` / figma / booth.pm / pximg /
     `<html` 模式 grep 零命中（`ComposePage.tsx` 的 `<div className` 为 VUA 自有 JSX，误报排除）。

**硬门结论：通过。**

## 四、一致性抽查（BOARD/状态宣称 vs 树内实文）

| 宣称 | 实文核查 | 结论 |
| --- | --- | --- |
| proposal 019 存在且全文 | `collab/proposals/019-multi-ui-shared-layer.md` 248 行；状态=已接受（用户指令）；UI-01…UI-10 十节全文、§6 批次 A–D、AC-01…AC-13、红线条款与 3 轮审阅门登记在案 | 一致 |
| `schemas/eac-terminate/v0.1` | `termination.schema.json`（$id 含版本，schemaVersion const 钉死）＋`fixtures/` 两件；BOARD 冻结契约表第 275 行宣称「已冻结（M6 EAC R1b，集成验收复跑 447/0）」 | Schema 实文一致；**但 REGISTRY/docs/protocols 均无 eac-terminate 登记**（见问题清单 L-1） |
| `schemas/bdl-queries/v0.4` | query.schema.json＋result.schema.json（824 行）＋examples 在树；REGISTRY 第 32 行=已冻结，含诚实注「wire 待核心」 | 一致 |
| `schemas/inspection-evidence/v0.1` 草案态、未进 REGISTRY 冻结 | 三文件在树（schema＋examples）；`grep inspection-evidence docs/REGISTRY.md` 零命中；BOARD #19 明文「草案态：REGISTRY 未动、未标冻结」 | 一致（符合预期） |
| design-standard 0.7.x | `docs/design/design-standard_ZH.md` 版本头 **0.7.1 已接受**，EN 镜像同步 0.7.1；REGISTRY 第 47 行登记 0.7.0 | 基本一致（REGISTRY 行落后实文一个小版本，见问题清单 L-1 同类） |
| product-boundary 1.3.0 | `_ZH.md` 版本头 1.3.0 已接受、EN 镜像同步声明在；REGISTRY 第 13 行 1.3.0 | 一致 |
| 机械校验 | `node scripts/collab-brief.mjs --registry-only` → **exit 0**，「登记表校验：一致 40 项 / 异常 0 项（共 40 行）」 | 通过 |

## 五、验证运行

1. **`node scripts/collab-brief.mjs --registry-only`** → exit 0（40/40 一致）。
2. **`cargo test --workspace` 全量**（本轮为三轮中唯一执行全量的一轮）：
   - 首轮 exit 0；为取得统计复跑 `cargo test --workspace --no-fail-fast` 亦全绿。
   - **60 个测试套件（Running 二进制），496 通过 / 0 失败**（含 provider-host
     lifecycle_recovery、bdl-store downloads_list_serving、acquisition
     import_downloads_contract_v04、project-manager vua_identity 等今夜新增套件；
     Doc-tests 7 项 0 用例）。
   - 14 ignored（环境条件性测试，如真机 Unity 相关，符合设计）。
   - 无构建锁等待，两轮结果一致。

## 六、诚实纪律抽查（3 项）

1. **BOARD #20 修复（BG-6 demo 任务重启残留 `running`）**
   宣称：核心小刀修复「demo 任务面纳入重启扫除，DEV-only 不豁免」，随下一工作窗口交付。
   实文：`2517dc8 fix(provider-host): BOARD #20`；钉住测试
   `crates/provider-host/tests/lifecycle_recovery.rs:121`
   `a_hard_killed_demo_task_never_keeps_reading_running_after_a_restart`（文件 189 行，
   与宣称一致）；该套件在全量 496/0 中通过。升级→裁决→修复→钉住→验收链路在 BOARD #20
   行完整留痕。**核验通过**。
2. **018 leak 断言撤回**
   宣称：devOnlyMarkers 存储键常量断言因「恒定性误报」撤回，撤回经审阅接受，159 指纹主线保留。
   实文：`apps/desktop/scripts/check-leak.mjs:75-78` 以代码注释声明豁免理由（键常量随主包
   合法存在、生产构建不读不写、`readDevPortSelection` 仅在 `import.meta.env.DEV` 分支被调用
   而被静态剔除）；指纹主线未动（`payloads.length` 运行时打印，各合并信息记录 159/零命中）。
   撤回有声明、有理由、有审阅记录（6256410/b1f4581）。**核验通过**。
3. **019 批 A 不宣称端到端**
   宣称：合并信息明写「switch does not rebuild Gateway **met structurally**」「forest-green
   honestly unavailable until batch D」，未作端到端宣称。实文：
   `ui-registry.test.ts` 钉住 `isUiRootAvailable("forest-green") === false`；
   `App.tsx:222/256-263` 切换按钮 disabled＋`uiForestUnavailable` Badge 如实渲染不可用态；
   无伪造的森林绿界面。**核验通过**。

## 七、问题清单（按严重度）

### 阻断项

无。

### 低严重度

- **L-1 文档登记滞后（两处同性质）**：① BOARD 冻结契约表宣称 `eac-terminate v0.1`
  已冻结，但 `docs/REGISTRY.md` 全文零 "eac" 命中、`docs/protocols/` 无对应协议文档对——
  同族冻结件（bdl-queries v0.1–v0.4、project-ops v0.1、project-inspection v0.1/v0.2）均有
  REGISTRY 行。机械校验通过是因为校验器只查已登记行，不查"应登未登"。建议：环境/集成角色
  在下一文档批为 eac-terminate 补登记（协议文档对或 schemas/ 路径行，择一）。②
  REGISTRY 第 47 行 design-standard 仍为 0.7.0，实文已 0.7.1（87e2932 已路由集成刷新，
  属已知在途项，随该路由闭合即可）。
- **L-2 本地绝对路径进入待推送 collab 文档**：`collab/BOARD.md`（U7-② 裁决原文）与
  `collab/proposals/019` 头部共 2 处含 `C:/Users/<本地用户>/...` 指针。裁决原文引用有其留痕价值，
  且裁决文本本身明示所指物料严禁入库；但推送到 origin 后即暴露操作者本机用户名与目录结构。
  不阻断本次推送；建议后续将此类指针改写为相对指称（如「本地爬虫参考物料（不入库）」），
  溯源依赖 git 提交信息即可。

### 备忘（非问题）

- 主树出现未跟踪 `?? .zcode/` 且未被 .gitignore 覆盖；与本次推送无关，建议评估是否加入
  ignore 清单，防后续误 add。
- 今夜 `_local_*` 证据目录均在各角色工作树，主树零条目，与状态文件记载吻合。
- W25 A1 warmup（f7ff690）提交信息与实文核查一致：环境条件性测试（有真 SDK 断钉形态、
  无 SDK 类型化 `exclude_marker_unavailable`），宣称即 EditMode 23/23 本机证据、未宣称
  窗口证据——措辞合规。

## 八、证据文件位置

- 本报告：`collab/reviews/2026-09-10-push-review-r1_ZH.md`（本轮唯一写入文件）。
- cargo test 全量输出：临时捕获，未落盘入库（60 套件 496/0，exit 0，两轮一致）。
- 关键证据均以文中命令可复现。
