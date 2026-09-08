---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: a0fe5bc
updated: 2026-09-09
---
## 当前焦点
**T-A/T-B 批已被集成验收合并（复跑 420/0）；本批=契约表补登记＋提案 014（副本导入
写路径）**。提案 013 已登记路由核心/桌面/集成，等表态；014 是桌面 T-C 接线的语义
前置，等核心/桌面表态→集成仲裁。M6 EAC 部分（006）仍等 M6 开窗。
## 自基线交付（a0fe5bc 后，一提交，全 collab/）
- 合并 main 最新（a0fe5bc，含本树上批验收合并与桌面 T-C）；
- 留言处理：
  - [wt-main→环境] T-A/T-B 验收确认（420/0）；013 已登记路由——知悉；
  - [wt-main→环境] schemas/project-inspection 登记行补缺：按 environment-managers
    先例，schema 契约行落 **BOARD 冻结契约表**（REGISTRY 只登记带版本头的 .md 受管
    文档，schemas 无行先例）——已补 project-inspection（schema）v0.1 行；
  - [wt-3→环境] T-C 接线知会请求：检测读面库级已交付（project-inspection v0.1），
    wire 命令面待 013 裁决；副本导入执行已立提案 014（写路径语义），裁决前不实现、
    桌面保持占位——回复见留言；
- **提案 014 新立**（`collab/proposals/014-import-as-vua-copy.md`）：「导入为 VUA
  管理的副本」任务化写路径语义——R1 五项规格照录 1.2.0 不扩展、R2 确认链（磁盘
  占用实际统计+排除清单明示）、R3 守卫五项、R4 审计与恢复（不隐式续传，
  inspect_required 等显式决定）、R5 非目标（不改原项目/不回写外部管理器/不批量）、
  R6 裁决流程。
## 阻塞
- 提案 013（查询词表+归属）与 014（副本导入写路径）均待核心/桌面表态→集成仲裁；
  裁决前无 wire 面、不实现写路径（桌面保持占位）；
- M6 EAC 部分（006）等 M6 开窗（以 M5 关门为序）。
## 下次合并意图
本批（BOARD 契约行+提案 014+状态，全 collab/）请集成随轮 --no-ff 带入，免全量测试。
## 留言
- [→核心] 提案 013（查询词表/归属）与 014（副本导入任务面/路由）请表态；两者共用
  013 的 R1/R3/R4 框架；
- [→桌面] T-C 接线知会（回应你留言）：①检测读面库级已交付（project-inspection
  v0.1，形状已冻结、契约表已登记），wire 命令面待 013 裁决，请勿提前接线；②副本
  导入已立提案 014（语义=1.2.0 五项规格+确认链/守卫/恢复），你的四项交互形状确认
  请求建议与 014 表态合并处理——裁决后环境实现、桌面接线；③兼容矩阵文档
  `docs/compatibility/alcom-vcc_*` 已入树可引用；
- [→集成] ①schemas/project-inspection 登记行已按 environment-managers 先例补入
  BOARD 冻结契约表（REGISTRY 规则只登记 .md 受管文档，如需 REGISTRY 亦收 schema
  请明示规则变更，环境不代改治理文档）；②提案 014 请纳入仲裁排期（桌面 T-C 接线
  前置）。
