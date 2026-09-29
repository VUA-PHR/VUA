> **Archived and retired — user ruling, 2026-09-28.** This collaboration mechanism is no longer
> maintained or available for reactivation. Preserve its historical decisions and evidence; a future
> collaboration workflow must be designed and accepted anew. Ordinary development follows
> CONTRIBUTING.md. The repository-wide PR policy at `docs/meta/protected-main.md` continues
> in force through the permanent `collab/PROTECTED_MAIN.md` entry. Older freeze/reactivation
> wording below is historical and superseded.

# collab/reviews/ — 独立审阅报告

> **Frozen (user ruling, 2026-09-28):** the collab mechanism is suspended from the 2026-09-28
> adoption of the N development sequence. This file is retained unmaintained, as history and
> reactivation reference only — do not follow it as a live process. Ordinary development
> (`CONTRIBUTING.md`) is the only active entry; `collab/PROTECTED_MAIN.md` remains in force as
> the repository-wide PR policy. Reactivation requires an explicit user ruling.

审阅者（Reviewer，独立大模型子代理，系统提示词见 `collab/roles/system-prompts/reviewer.md`）
的产出目录。每个审阅任务一份文件：`<日期>-<对象>.md`（如 `2026-09-08-w12-merge.md`）。

固定结构：verdict（通过 / 有条件通过 / 打回）→ 证据（命令与结果摘要）→ 问题清单
（按严重度）→ 给用户的裁决请求（如有）。

触发方式：用户直接调用，或集成角色在合并验收/门关闭前请求审阅。审阅报告是 M 门验收的
参考证据之一；打回项由责任角色修复后复验。
