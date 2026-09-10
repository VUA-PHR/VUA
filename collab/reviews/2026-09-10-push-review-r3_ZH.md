# 推送前审阅报告（第 3 轮 / 共 3 轮）

- 日期：2026-09-10
- 审阅对象：`origin/main..main` 全部待推送提交
- 审阅者：独立 Reviewer（第 3 轮；证据独立取证，写报告前未读第 1/2 轮报告正文结论）
- 性质：只读审阅；除本报告外未写任何文件、未 commit、未 push
- 本轮主项：Rust 域定向套件（provider-host / project-manager / bdl-store）＋ registry 校验

## Verdict：**通过（可推送，0 阻断项）**

forest 零泄漏硬门四项全部通过；本轮定向 Rust 套件 206/0 全绿＋registry 40/40 exit 0；
一致性抽查 5 项与诚实纪律抽查 3 项全部与实文相符。问题清单 4 项均为非阻断备忘。

## 一、审查范围

- `git fetch origin` 后：`origin/main = 7da1b5f`（2026-09-09 22:54），`main = 88dd71d`
  （2026-09-10 08:23）。
- `git merge-base --is-ancestor origin/main main` → 是（origin/main 为 main 祖先），
  ahead/behind = **257 / 0**，推送为快进。
- 提交数：**257**（其中合并提交 **90**）；全量 diff：**201 文件，+16691 / −1237**。
- 提交时间跨度：2026-09-09 08:03 ～ 2026-09-10 08:23（昨夜 22:54 上次推送后累积的全部
  slot 分支批）。范围横跨：第十三～二十一波验收、BG-1 主切片三段、BG-2/4/5/6 工单、
  #20 缺陷发现→裁决→修复→钉死全链、015 §7/§11/§12/§14、016/017/018/019 四提案、
  bdl-commands v0.4 与 bdl-queries v0.4、project-inspection v0.2、013/014 wire 与
  消费链、W25 前置三件。

## 二、全量 diff 扫描

| 检查项 | 方法 | 结果 |
| --- | --- | --- |
| 冲突标记 | `git diff origin/main..main` 内 `^\+.*(<<<<<<<\|>>>>>>>\|=======$)` 扫描 | 2 处命中均为误报：wt-main.md 教训记录引用的检查命令「合并提交前必检 \`grep -c "<<<<<<<"\`」＋ provider_host.rs 注释横幅 `// ==== Task layer ====`。零真实冲突标记 |
| 凭据/token/.env | api_key/secret/password/Bearer/ghp_/sk-/PRIVATE KEY 模式扫描新增行 | 唯一命中 `"taskId": "task-01hexample0000000000000d/g"`——bdl-commands v0.4 示例中的合成 ULID（含 "example" 段），非凭据 |
| .env/付费资产/二进制 | 变更路径扩展名扫描（.env/.unitypackage/.fbx/.png/.zip/.exe/.dll 等）＋ `--numstat` 二进制行 | 零命中；无任何媒体/二进制文件 |
| 大文件 | 变更文件按字节排序 | 最大为源码：provider_host.rs 248KB（crate 单文件既有形态的增量增长）；次为 bdl_store.rs 101KB、i18n 四语表 80–98KB。无异常 |
| wip:/fixup/squash | 提交主题扫描 | 零命中 |
| 提交信息 vs 内容 | 系统化核对：90 个合并中消息含「collab only（免测）」者逐一用第一父提交 diff 复核（`git diff-tree $c^1 $c`） | **90 个中恰 1 个夹带实质改动＝9cdf7ba**（带入 feat 875c85a：remoteBrowser 能力翻转 preload/ImportPage/contracts 三文件）——该偏差已由 wt-main.md「登记偏差自纠」如实声明（message 不可改，验收记录为准）。**无未声明的免测夹带** |
| 本地绝对路径（新增行） | `C:\Users`/`C:/Users`/`D:\` 模式扫描 | 3 类：①BOARD.md 13 项裁决表 U7-② 行（用户裁决原文忠实转写，内含本地爬虫参考路径，裁决文本自身明示该物料「严禁提交入库」——提交的是裁决文字而非物料）；②proposal 019 头部源文档指针 `C:/Users/<本地用户>/.codex/visualizations/...`（登记件溯源注记，源文档本体未入库）；③schema 示例合成路径（`C:\Users\demo\...`、`D:\VUA Projects`——演示数据）。前两项见问题清单 L-1 |

## 三、forest 零泄漏核查（硬门，逐条证据）

| # | 检查 | 命令与证据 | 结论 |
| --- | --- | --- | --- |
| a | `git ls-files` 全表 | `git ls-files \| grep -iE 'forest\|figma\|\.codex\|ui-variants'` → **零命中**（rc=1） | **通过** |
| b | forest 目录忽略规则 | `git check-ignore -v apps/desktop/src/ui-variants/forest/` → **命中 `.gitignore:83:apps/desktop/src/ui-variants/forest/`**（rc=0） | **通过** |
| c | `git status --porcelain` | 全量输出仅 `?? .zcode/`（本地工具目录，未跟踪）；**无任何 `_local_*` 条目** | **通过** |
| d | 今夜新增/增量 Rust 文件抽查 | `crates/project-manager/src/vua_identity.rs`、`crates/orchestrator/src/overlay_surface.rs`、`crates/acquisition/src/warehouse_download_adopt.rs`、`crates/orchestrator/src/environment.rs`、provider_host.rs 本轮新增段：扫描 `C:\Users`/`C:/Users`/`D:\`/`/Users/`/`figma`/`crawl`/`booth.pm`/`pximg`/`_local_` | **通过**——唯一命中为 environment.rs 的 `C:\Program Files...` 系列（Windows 通用默认安装路径回退值，非用户本机路径）；provider_host.rs 增量段仅 `local_resolution_id` 变量名 |

## 四、一致性抽查（宣称 vs 实文）

1. **proposal 006 台账 vs schemas/eac-\* 三族**：006 状态=已接受（用户整体批准 R1–R9，
   2026-09-08）；实现落账四段（R1a 侦测 c07ad47/R2+R3 数据面与核验原语 e08b287/R3 签名
   WinVerifyTrust/R1b 终止原语）与实文逐一对应——`schemas/eac-probe/v0.1/probe.schema.json`
   ＋fixtures 2 件、`schemas/eac-allowlist/v0.1/allowlist.schema.json`＋fixtures 2 件
   （空表设计初态）、`schemas/eac-terminate/v0.1/termination.schema.json`＋fixtures 2 件
   全部在树。006 尾部诚实边界（「R1b 待验收；允许清单首批条目待 W25 窗口真机证据」）与
   REGISTRY 未登记的现状一致。注：三族不在本次推送范围（无范围内提交触碰，属先前已推
   内容）。
2. **016 inspection-evidence v0.1（草案态未冻结）**：`schemas/inspection-evidence/v0.1/`
   ＋examples 7 件（正 2 负 5）＋校验测试 `crates/unity-bridge/tests/inspection_evidence_vectors.rs`
   在树（提交 ad46501）；proposal 016 status=已接受但正文钉死草案态——「REGISTRY 未登记、
   未标冻结」「冻结硬前置 ①②④⑤ 均未发生」；`docs/REGISTRY.md` 复核确认**无**
   inspection-evidence 行。宣称与实文一致。
3. **017 overlay_surface.rs 骨架**：`crates/orchestrator/src/overlay_surface.rs` 122 行
   （提交 ac3dba5），头部 doc 明示「proposal 017 DRAFT — direction only, nothing here is
   frozen」；内容为只读投影 trait（OverlayReadModel/StoreOverlayReadModel）＋OverlayTaskCard
   最小读模型，零传输面/零命令词表/零新增事实源——与「骨架、仅方向不冻结」宣称一致。
4. **BOARD #19/#20/#21**：#19（016 已接受·存储第五文档库锚 EvidenceStore·dependencies 维
   定义权在产线·冻结锚=Bridge 五维落地）——与 016 内联仲裁节及 wt-4 交付相符；#20（BG-6
   Spike 边界发现→候选缺陷成立→核心小刀修复排期）——修复已落（2517dc8）并有钉死测试
   （见第五节）；#21（019 已接受·批 A-D 路由·森林绿红线·推送前 3 轮 Reviewer 含零泄漏
   核查）——批 A（1360af1）、批 B（6dfa40e）均已在范围内验收合并，红线即本次硬门依据。
   三条状态均与实物证据相符。
5. **今夜 21+ 波验收基线哈希链（抽 3 处）**：
   - 第 21 波同步提交 88dd71d 宣称 baseline `e611cf0` → 实测 `88dd71d` 父提交＝`e611cf0` ✅；
   - 第 20 波 `06dbf87` 宣称 baseline `a616c5a` → 父提交＝`a616c5a` ✅；
   - 第 19 波 `5160433` 宣称 baseline `1360af1` → 父提交＝`1360af1` ✅。
   `collab/state/wt-main.md` front-matter `baseline_commit: e611cf0` 与当前 main 拓扑一致。
   **哈希链 3/3 通过。**

## 五、验证运行（本轮主项）

| 套件 | 结果 |
| --- | --- |
| `cargo test -p vua-provider-host`（注：包名带 `vua-` 前缀，裸 `provider-host` 不匹配） | **83 passed / 0 failed**。覆盖确认：`tests/lifecycle_recovery.rs`（#20 钉死）、`tests/project_ops_wire.rs`（014/013 wire 消费）、`tests/catalog_queries.rs`（**listCompleted 消费测试在档**）、`tests/warehouse_commands.rs`、`tests/imports.rs`（importDownloads 向量） |
| `cargo test -p vua-project-manager` | **68 passed / 0 failed**（2 ignored＝#[ignore] 真机手动测试，与 006/R8 纪律一致） |
| `cargo test -p vua-bdl-store` | **55 passed / 0 failed** |
| `node scripts/collab-brief.mjs --registry-only` | **登记表校验：一致 40 项 / 异常 0 项（共 40 行），exit 0** |

（按任务约定未跑全量 workspace——第 1 轮已覆盖全量 496/0。）

## 六、诚实纪律抽查（3 项）

1. **#20 修复的 lifecycle_recovery 钉死测试**：属实且双层。源内单测
   `crates/provider-host/src/provider_host.rs:6293`
   `demo_task_walks_lifecycle_and_is_swept_on_restart_per_board_20`（验收记录所引名称准确）；
   集成测试 `crates/provider-host/tests/lifecycle_recovery.rs:121`
   `a_hard_killed_demo_task_never_keeps_reading_running_after_a_restart`——断言重启后状态
   永不等于 `running`，断言消息内嵌 `(BOARD #20)`。本轮实测该套件绿。**相符。**
2. **019 批 B「保存链诚实禁用待 entrypoint 事实」**：`apps/desktop/src/renderer/features/
   compose/ComposePage.tsx` 保存按钮实文 `disabled aria-disabled`（恒禁用）＋
   `saveDisabledNote` 说明文案＋文件头注释「保存入口诚实禁用：recipe.save 需要 entrypoint
   选择器等素材实例化」；提交 6dfa40e 信息与证据注记如实声明「intentionally honest-disabled
   until the entrypoint fact source slice lands」；契约缺口已路由（6f7fec2/c4cc749：无事实源
   ＝冻结 schema 设计，非缺陷）。**相符——禁用是诚实降级而非隐藏缺陷。**
3. **016 草案态未冻结未登记**：REGISTRY 无该行＋提案明文「REGISTRY 未登记、未标冻结」＋
   冻结硬前置清单未满足的声明在案。**相符。**

## 七、问题清单（全部非阻断）

| # | 级别 | 问题 | 建议 |
| --- | --- | --- | --- |
| L-1 | 低（推送前知会用户） | 两处 collab 文档以文字引用本机路径：BOARD.md 13 项裁决表（`C:/Users/<本地用户>/Documents/VRChat便捷avatar操作/_local_bdb_crawl/...`——用户裁决原文忠实转写）与 proposal 019 头部源文档指针（`C:/Users/<本地用户>/.codex/...`）。**所指物料与源文档本体均未入库**，不违反任何硬门条款；但推送 origin 后将公开用户名与本机目录命名，且暴露 .codex 工具链使用痕迹 | 不构成推送前置。建议操作者向用户知会一句：若在意可随下一 collab 批将两处指针改为脱敏表述（如「本地参考目录，见本地档案」）；裁决原文是否可改由用户定 |
| L-2 | 低 | 合并 9cdf7ba 消息「collab only（免测）」实际带入 feat 875c85a 实质改动——**已由 wt-main.md 自纠声明**，且该批有补验记录（桌面 check 419 测试绿），程序偏差已如实披露 | 无动作（message 不可改）；现有「验收惯例改进」记录已覆盖此类风险 |
| L-3 | 备忘 | `schemas/eac-*` 三族无协议文档、无 REGISTRY 行（eac 工件不在本次推送范围）。当前与 006「R1b 待验收」的暂态自洽，但若长期停在此态将形成登记盲区 | 随 EAC 后续切片（W25 B2b 真机件）一并补协议本与登记，避免永久游离 |
| L-4 | 备忘 | `git status` 有未跟踪 `?? .zcode/`（本地代理工具目录） | 保持未跟踪即可；若多次出现可考虑加入 .gitignore（本审阅不改文件） |

## 八、结论

- 硬门（forest 零泄漏）4/4 通过，证据见第三节；
- 本轮主项 Rust 定向套件 206/0 全绿＋registry 40/40 exit 0；
- 一致性抽查 5/5、诚实纪律抽查 3/3 与实文相符；
- 提交面无冲突标记、无凭据、无付费资产、无 wip/fixup、无未声明的免测夹带；
- 4 项问题均非阻断，其中 L-1 建议推送前向用户知会（不强制）。

**Verdict：通过。本轮（第 3 轮）同意推送；按 ≥2/3 门径，三轮全部通过即满足推送条件。**

（证据生成环境：本机 Windows，2026-09-10；cargo/node 输出见本文各表所引命令，未留存
日志文件——各结论均可由所引命令在本仓库复现。）
