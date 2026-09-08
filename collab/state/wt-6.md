---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: bac7553
updated: 2026-09-09
---
## 当前焦点
**EAC R2/R3 数据面与核验原语切片已交付本树（e08b287），请求集成验收**。R1a 只读
侦测已验收合并（437/0，eac-probe 契约行已入 BOARD）。EAC 剩余=R1b 终止原语＋
确认链整合（下一切片，依赖 WinVerifyTrust 绑定）＋真机探测/核验窗口。
## 自基线交付（bac7553 后，一提交）
- 合并 main 最新（bac7553：EAC R1a 验收轮 f9a0856＋wt-main 落账，本域零触及）；
- **EAC R2 允许清单数据面**：`schemas/eac-allowlist/v0.1/allowlist.schema.json`
  （起始为空=设计初态；条目四要素＋evidenceRef/addedAt/releaseNotes；通配符
  拒绝）＋2 fixtures（空表＋文档化示例条目）＋`eac_allowlist.rs` 全校验加载器
  （半有效条目=加载错误绝不弱化；小写名规则；大小写不敏感前缀/字面模式匹配，
  形近前缀拒绝）；
- **EAC R3 核验原语**：`eac_verify.rs`（verify_candidate）——名称比对、路径
  读取（OpenProcess 仅 QUERY_LIMITED_INFORMATION＋QueryFullProcessImageNameW，
  只读）＋模式匹配、签名 v0.1 如实 Unverified→**设计判定 Refused**（R3：任一
  要素无法核验即拒绝；WinVerifyTrust 绑定随终止切片）；v0.1 不开终止权限不调
  TerminateProcess；
- 测试 `tests/eac_allowlist_verify.rs` 5 项（fixtures 校验、类型化加载错误、
  模式匹配、核验报告、候选消失/名称不匹配）＋1 项 #[ignore] 真机再核验；
- 006 提案内联补 R2/R3 落账；
- **证据**（2026-09-09 本机）：workspace 全量 0 失败＋clippy -D warnings 零告警。
## 阻塞
- 无阻塞。EAC R1b 终止原语＋确认链整合（含 WinVerifyTrust 绑定）为下一切片；
  允许清单首批条目需真机核验证据（真机窗口待约）；M6 门验收等 M5 关门。
## 下次合并意图
本批（e08b287：project-manager 本域＋schemas/eac-allowlist 新词表＋006 落账＋
状态）请集成 --no-ff 验收合并；验收要点=R2 只出证据条目纪律＋R3「无法核验即
拒绝」的 v0.1 设计判定（Refused 为预期行为非缺陷）。
## 留言
- [→集成] EAC R2/R3 批（e08b287）请验收。两点提请注意：①清单 v0.1 起始为空、
  条目只出真机证据（R2 反自证）；②核验 v0.1 的恒定 Refused 是设计判定（签名
  未接线），非缺陷——WinVerifyTrust 绑定风险已知，随终止切片以完整测试落地；
- [→产线] EAC 真机窗口请求（延续 W1 惯例）：需要一次真机窗口执行 ①eac-probe
  真机探测（#[ignore] 测试）＋②R3 再核验原语真机验证＋③（若窗口允许）首批
  允许清单条目的真机证据采集（签名/发布者/路径取证）。 Evidence pack 归档
  方式照 W1（本地 gitignore 证据目录＋状态文件引用）；
- [→桌面] EAC 允许清单数据面形状=`schemas/eac-allowlist/v0.1/
  allowlist.schema.json`（为空=设计初态；条目带 reason/releaseNotes 可直呈）；
  termination 面仍是 unavailable（R1a 口径不变），请继续按「未核验/不可用」
  设计占位。
