# VUA 六进程启动清单（操作者/主进程用）

> 用途：启动或重启六角色常驻进程时照此执行。规则本体在 `collab/README.md`，本清单不复述规则，
> 只给操作步骤。

## 1. 环境验证（先验证，不要重建）

六棵工作树与依赖已就绪。验证：

```sh
git worktree list   # 应有 VUA(main) + VUA-2..VUA-6(slot/wt-2..6)
```

仅当缺失时补建：`git worktree add <路径> -b slot/wt-N main`，然后在该目录 `pnpm install`
（首次 Rust 构建在该树首次测试时自动发生）。VUA 主库含 `.git`，永驻 `main`，不可移动。
规则、看板、提示词全部在 git 内随分支走——**不需要任何人工同步动作**；slot 分支落后 main
由 TICK 步骤 4 自行对齐。

## 2. 首轮：六个进程入职

ZCode 子智能体**已创建，勿重复创建**（系统提示词的改动先改
`collab/roles/system-prompts/<role>.md` 文件，再同步进子智能体配置）：

| 进程 | 子智能体（描述） | 模型/工具 | 工作目录 | 首条消息（入职提示词全文，只发一次） | 槽位分支 |
| --- | --- | --- | --- | --- | --- |
| 集成 | Integration（VUA集成子代理） | GLM-5.3-Flash / 全部工具 | `C:\Users\AR\Documents\VUA` | `collab/roles/integration.md` | main |
| 核心 | Core（VUA核心子代理） | 同上 | `C:\Users\AR\Documents\VUA-2` | `collab/roles/core.md` | slot/wt-2 |
| 桌面 | Desktop（VUA桌面子代理） | 同上 | `C:\Users\AR\Documents\VUA-3` | `collab/roles/desktop.md` | slot/wt-3 |
| 产线 | Production（VUA产线子代理） | 同上 | `C:\Users\AR\Documents\VUA-4` | `collab/roles/production.md` | slot/wt-4 |
| 数据 | Data（VUA数据子代理） | 同上 | `C:\Users\AR\Documents\VUA-5` | `collab/roles/data.md` | slot/wt-5 |
| 环境 | Environment（VUA环境子代理） | 同上 | `C:\Users\AR\Documents\VUA-6` | `collab/roles/environment.md` | slot/wt-6 |

各子智能体的「系统提示词」字段内容来自 `collab/roles/system-prompts/<role>.md`，
「注入 AGENTS.md」保持开启。

入职完成标志：各进程输出其读到的 BOARD 摘要与本角色当前任务。

## 3. 第二轮起：定时节拍

- **工作时段（本地 23:00–次日 08:30）内每 20 分钟**，把 `collab/TICK.md`「命令正文」代码块
  **原样**发给全部六个进程（六份文本完全相同）；错峰建议见 TICK 文件头；
- 非工作时段不发；进程自查 `date`，09:30 后强制截断（wip 提交，下夜继续）；
- 时间纪律写在命令正文里，发送方不用自己判断。

## 4. 每日例行（人）

- 白天批量处理 `collab/BOARD.md`「待用户裁决」区的 `[需用户]` 项（夜里进程会正确停在
  这些项上，不清理会积压）；
- 任一工作树跑 `pnpm collab:brief`，扫一眼失鲜与分叉区；
- 各工作树目录里遗留的 `*.pre-rename` 旧缓存目录确认后可删。

## 修订记录

- v1.1（2026-09-07）：登记已创建的六个 ZCode 子智能体（勿重复创建）；系统提示词独立为
  `collab/roles/system-prompts/<role>.md`。
- v1（2026-09-07）：初版。
