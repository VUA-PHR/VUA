# collab/ — VUA 协作机制（git 即消息总线）

> Integration override (2026-09-22): read [protected-main policy](PROTECTED_MAIN.md) before any merge or push. All main changes, including bookkeeping, use an isolated branch and GitHub PR; canonical main only fetches and fast-forwards. This supersedes older direct-main instructions below.

所有工作树共享同一个 `.git` 对象库，`git show <branch>:<path>` 可在任意工作树里直接读取其它
分支**已提交**的文件——git 本身就是消息总线，跨树协调不再需要信件文档或人肉复制。

```text
collab/
  README.md            # 本文件：机制说明
  BOARD.md             # 全局看板：M 门状态、冻结契约表、跨树开放问题（集成树维护）
  state/wt-N.md        # 工作树状态文件（覆盖式，每棵活跃工作树一份）
  proposals/NNN-slug.md# 提案单文件线程
```

## 状态文件：按工作树登记

- 每棵工作树一份 `collab/state/wt-N.md`（编号与工作树目录一致：VUA→wt-main、VUA-2→wt-2、VUA-3→wt-3），
  覆盖式维护、**非追加**，上限约 60 行。历史不进文件——git 历史就是档案，文件永远只反映"现在"。
- 固定结构：front-matter（worktree / branch / role / baseline_commit / updated）+ 五节
  （当前焦点 / 自基线交付 / 阻塞 / 下次合并意图 / 留言）。
- 阻塞与留言用 `[→角色]` 路由（六角色：集成/桌面/核心/产线/数据/环境，定义与代码所有权见
  `docs/development-outline_ZH.md`；域 Schema 冻结责任归域角色，TS 面登记归桌面角色，
  集成本体路由 `[→集成]`）。
- 文件随分支走：在自己分支上更新并提交，合并即传播到集成树，不需要任何复制。

## 提案：单文件线程

- 契约变更与跨树需求走 `collab/proposals/`：一议题一文件，讨论线程内联在同一文件，
  状态字段按 `提出 → 讨论中 → 已接受/已拒绝/已撤回` 演进；关闭后不再修改。
- 写作规则见 `collab/proposals/README.md`。废止 b-*/f-* 成对信件模式。

## 看板 BOARD.md（集成树维护）

每个 M 门关闭或合并完成后更新：M 门状态、冻结契约表、跨树开放问题清单。

## 开工前必跑（强制）

```sh
pnpm collab:brief
```

四区输出：① 指向本树/本角色的阻塞与留言、失鲜工作树；② 各工作树状态文件全文；
③ 各分支相对 main 的分叉；④ 文档 REGISTRY 登记一致性。

## 固化点（强制，任一时点即更新本树状态文件并提交）

1. 每个工作会话结束（随最后一次提交）；
2. 遇到阻塞时立即；
3. 契约版本落地时；
4. 请求合并前。

## 常驻进程模型（六角色 × 六工作树）

- 当前指派：集成→VUA（main）、核心→VUA-2、桌面→VUA-3、产线→VUA-4、数据→VUA-5、
  环境→VUA-6。工作树本身不受角色限制，改派在 BOARD 登记。
- 每棵工作树一条常驻槽位分支 `slot/wt-N`：切片工作在其上提交（开工前先对齐 main），
  合并回 main 后继续使用；一次性会话可用 `slice/<slug>`。
- 切片由负责角色的进程单独执行；协作方经留言/proposal 参与，不共写分支。
- 合并 main：改动只含本角色所有权域且相关测试全绿时可自并；跨域合并留给集成角色。
- 入职提示词在 `collab/roles/<role>.md`；统一定时节拍命令在 `collab/TICK.md`；
  操作者启动清单在 `collab/LAUNCH.md`。
- harness 适配：支持自定义系统提示词的（如 ZCode 子智能体）——每角色建专用子智能体，
  系统提示词用 `collab/roles/system-prompts/<role>.md`（独立文件，与入职提示词分离，防误读）、
  注入 AGENTS.md 开启、角色文件全文作首条任务消息；不支持的——角色文件全文即首条消息
  （内置引导会读 AGENTS.md）。

## 合并节奏（v2：防空转反馈环）

- 分叉上限按**非 collab/ 实质提交**计：切片分支寿命 ≤3 天、落后集成分支 ≤15 个实质提交，
  先到先触发合并/变基（brief ③ 分别显示全部与实质分叉）。
- Schema 与契约只经 git 合并对齐，禁止手工拷贝。
- 含代码/Schema/脚本变化的合并回 main 后，合并者跑全量测试并更新 BOARD；
  **纯 collab/ 合并免测**（不触发测试链，只更新 BOARD/状态）。
- **空转不提交**：监视轮无实质变化时不提交、不同步、不更新状态文件——状态文件只在内容
  实质变化时更新（baseline 追平不算实质变化）。
- **切片完整性优先于所有权**：切片由负责角色在同一分支内完成全部层（schema/Rust/TS/测试/
  文档同批）；所有权域约束的是日常改动归属与合并审查，不再作为切片内的接力边界。
  跨域切片合并回 main 由集成角色验收。

## 升级规则（防"臭皮匠共识"）

六路并行不等于六份判断力叠加。解决不了的问题必须升级给人，而不是在进程间打转：

- **触发**：同一问题连续两轮 tick 无实质进展；需要猜测/假设才能继续；proposal 讨论两轮
  无收敛；涉及安全、法律、付费资产、产品边界的判断。
- **动作**：写入 `collab/BOARD.md`「待用户裁决」区并标 `[需用户]`，写清问题、已尝试路径、
  卡点、待裁决的具体选项；本角色在该项上的工作暂停。
- **禁止**：不得通过多进程互相引用制造共识假象；不得为了不停工而降低标准（跳测试、放宽
  校验、收窄范围而不声明）；不得替用户做产品裁决。
- 用户侧约定：白天批量处理 `[需用户]` 项；TICK 命令正文让进程自动跳过这些条目。
