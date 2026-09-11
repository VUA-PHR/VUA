---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: ff2f2c4
updated: 2026-09-12
---
## 当前焦点
**BG-18 修复交付（38dc36c，slot/wt-6，待集成验收）**——工单兑现：CI
rust 34630656044／schema-vectors 34630656005 双红同根
（`the_five_guards_refuse_typecally`，import_copy.rs:305
TargetInsideSource 在 GitHub Windows runner 未拒绝）已定位并修复：
- **根因（CI 日志＋本机红跑双证）**：runner 的 `temp_dir()` 为 8.3 短名
  形态（`C:\Users\RUNNER~1\...`）。`normalize()` 对存在的源路径
  canonicalize 成长名，对尚不存在的目标路径回退调用方字面拼写——
  `starts_with` 拿 `RUNNER~1` 对比 `runneradmin`，前缀落空，守卫漏过。
  本机同根复现红：`VU0EB0~3`／`GUARDE~1` 短名拼写同样击穿守卫（修复前
  红跑已录于会话）。
- **修复面**：`normalize()` 在路径不存在时改为对最深存在祖先
  canonicalize 后回拼缺失尾部，Windows 盘符统一大写对齐 canonical 形态。
  守卫语义只收紧不放宽：凡解析后落入源树的目标在任何拼写下都被拒绝。
- **回归测试**：`target_inside_source_guard_survives_runner_path_spellings`
  钉死控制组＋盘符大小写＋verbatim `\\?\` 前缀＋8.3 短名四形态（短名经
  GetShortPathNameW 能力检测，卷不支持时该拼写不适用而非跳过守卫；
  大小写/verbatim 钉子仍然必跑）。windows-sys 以 windows-only
  dev-dependency 引入（仅测试用、既有锁定版本、可随测试移除）。
- **证据**：修复前红跑（本机）→修复后 `cargo test --workspace`
  **496 通过 / 0 失败**（495 基线＋新增回归 1）＋clippy
  `--workspace --all-targets` 零告警（2026-09-12 本机）。runner 等效
  复核待合并后首个 rust CI run（届时 BG-19 的 clippy 观察一并取事实）。
**前情**：BG-11 全额销账已办（集成 0dc00cb 实文核验）；E2/E1 全链闭环。
## 自基线交付（ff2f2c4 之后）
- **BG-18 修复（38dc36c）**：见当前焦点。改动仅 crates/project-manager
  三文件（src/import_copy.rs 修复＋tests/import_copy.rs 回归＋Cargo.toml
  windows dev-dep），Cargo.lock 零变化，未越所有权域。
## 在途/待他角色
- [待集成] BG-18 验收合并：slot/wt-6 38dc36c（Rust＋测试同批）——请
  验收后合并并核合并后首个 rust CI run 转绿（推送门 BG-18 红态销账）；
- [已闭环] BG-11 全额销账（BOARD 行已更新，集成 0dc00cb＋实文四条核验）；
- [等桌面→核心] 备注编辑范围（D-6）确认→核心 project-ops v0.2 升版批
  （setNote）→我侧原语随批消费；
- [等集成/用户] W25 开窗通知——用户明示延期，时间待定；环境 B 段义务
  （B1→B2a→B2b→B3→B4）清单不变。
## 阻塞
- 无。
## 下次合并意图
slot/wt-6 两笔：03d75d3（main 基线追平合并）＋38dc36c（BG-18 修复），
另本状态批——均由集成验收后合并（遵守「交付后由集成合并」惯例，不在
本树并发执行 main 合并批）；触 crates/ 批，验收需全量测试＋clippy 门。
## 留言
- [→集成] **BG-18 修复交付请验收**：38dc36c。要点①根因＝runner TEMP
  8.3 短名使 normalize 回退字面与 canonical 形态不一致，守卫
  `starts_with` 落空；②修复＝不存在路径走最深存在祖先 canonicalize＋
  尾部回拼＋盘符大写统一，语义只收紧（任何拼写落入源树均拒绝）；
  ③回归四形态钉死、短名系能力检测非忽略过关（合规工单红线）；
  ④本机证据 496/0＋clippy 零告警，修复前本机红跑与 CI 双红同根
  （VU0EB0~3/GUARDE~1 对 RUNNER~1）；⑤合并后请核首个 rust CI run
  转绿再销 BG-18，BG-19 的 clippy 事实随该 run 一并取回；
- [→集成] windows-sys dev-dep 备案：owner＝vua-project-manager、
  purpose＝BG-18 回归测试 GetShortPathNameW 取 8.3 短名、license＝
  MIT/Apache 双许可（微软官方 crate、既有锁定 =0.61.2）、removal path＝
  随拼写回归测试移除；仅测试构建图，库面与普通构建零新增；
- [→wt-2] 读面消费走 collect_environment_managers_snapshot 原样的留言
  收讫——读面接口本轮零变化，BG-18 修复不触快照形状（E1 交付不受影响）；
- （历史留言消化：BG-11 销账回执、016/双协议本/标识文件三批验收知悉——
  均已落账，REGISTRY 纪律遵守中。）
