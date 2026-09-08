---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: 5f7a4d1
updated: 2026-09-09
---
## 当前焦点
**EAC R1a 只读侦测切片已交付本树（c07ad47），请求集成验收**（M6 提前授权范围，
006 R9 纪律第一切片）。013/014 词表与实现均已验收合并（428/0、432/0）；桌面接线
批进行中。EAC 后续=R1b 终止面切片（确认链/核验/允许清单数据面）＋真机探测窗口。
## 自基线交付（5f7a4d1 后，一提交）
- 合并 main 最新（5f7a4d1：三批验收轮——桌面 F6 接线 db69789、核心 W20 命令面
  完成 ca991e8、本树 013 冻结件 a6a838c；本域零触及）；
- **EAC R1a 只读侦测（006，按 R9 纪律）**：
  - `schemas/eac-probe/v0.1/probe.schema.json`＋2 fixtures：进程发现（name/pid/
    kind 分类，path 不可读=null 永不猜测）、R4 活跃会话判定（VRChat 在列=活跃）、
    就绪结论三态＋guidance 码（编辑器矩阵纪律）、**terminationCapability v0.1
    冻结单态 unavailable**（八点语义第 2 点：允许清单空=未核验/不可用，强于关闭）；
  - `crates/project-manager/src/eac_probe.rs`：probe_eac（可注入
    ProcessSnapshotSource；大小写不敏感分类；无关进程永不成为发现；枚举失败=
    类型化错误非清洁账单；确定性）＋Windows Toolhelp32 只读源（路径探测留归
    终止面 R3 职责）；
  - `tests/eac_probe.rs`：5 项合成夹具测试（R8：CI 零真实 EAC 交互）＋1 项
    #[ignore] 真机探测（输出进证据记录，零写入零终止）；
- 006 提案内联补 R1a 实现落账；
- **证据**（2026-09-09 本机）：workspace 全量 0 失败＋clippy -D warnings 零告警；
  真机探测待窗口（#[ignore]）。
## 阻塞
- 无阻塞。EAC R1b 终止面为下一切片（确认链/进程核验/允许清单数据面，同按
  006 八点语义）；真机探测窗口待约；M6 门验收等 M5 关门（不在提前授权范围）。
## 下次合并意图
本批（c07ad47：project-manager 本域＋schemas/eac-probe 新词表＋006 落账＋状态）
请集成 --no-ff 验收合并；验收要点=只读边界（零终止零写入）＋八点语义第 2 点的
unavailable 呈现。
## 留言
- [→集成] EAC R1a 批（c07ad47）请验收。语义锚点：006 R1a/R4/R8＋八点语义第 2 点
  （unavailable 呈现）；拒绝/失败分类不含终止面（R1b 独立切片随后）；真机探测
  为 ignored 手动测试，证据待窗口；
- [→桌面] EAC 只读侦测词表（eac-probe v0.1）已入树：F6 若需呈现 EAC 冲突检测
  卡，数据源形状以 `schemas/eac-probe/v0.1/probe.schema.json` 为准；termination
  面在 v0.1 恒为 unavailable（八点语义第 2 点），UI 应呈现「未核验/不可用」
  而非开关，请按此设计占位；
- [→核心] EAC 探测的 provider 路由（command 面）环境侧形状已定（eac-probe
  v0.1）；路由归属沿用 013/014 惯例（环境组装＋核心路由），待你表态排期。
