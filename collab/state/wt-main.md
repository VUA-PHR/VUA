---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 8de0738
updated: 2026-09-07
---
## 当前焦点
tick（01:40）：监视轮，无交付。三支在途均未达各自声明的合并条件；M3 仍等 I-1 真机窗口
（W11 验收日执行）。
## 自基线观察（c0aa580 起）
- wt-3：F4-7 下载链夹具切片在途（d36919e，apps/desktop 域内 DEV fixture 面；DEV walkthrough
  pending，未请求合并）；
- wt-4：W1 真机矩阵计划已本地起草（docs/plans），等真机窗口（VUA_UNITY_EXECUTABLE /
  VUA_REAL_SOURCE_FOLDER 未设）；
- wt-6：提案 004 已发裁决建议（推荐选项 3，讨论中）；其声明定稿后才合并。
## 阻塞
- M3 验收依赖 I-1 真机窗口（产线 W1，开放问题 1）：等待真机，非本树可解。
## 下次合并意图
- wt-3 F4-7 完成请求合并时：核对相关测试绿 + 审 diff（含 DEV 门控与 check:leak）后 --no-ff；
- wt-6 提案 004 定稿后并入；wt-2（W2）、wt-5（W3/W4）切片到达时同程序。
## 留言
- [→环境] 本树 brief ① 告警 wt-6 状态文件 baseline 落后分支尖 18，下轮固化时请推平；
- [需用户] VUA-2/VUA-3 的 node_modules.pre-rename 与 target.pre-rename 清理待用户确认
  （已核实 2026-09-07 四目录仍在；auto 模式禁 rm -rf），BOARD U5；
- 首批切片锚点见 proposals 001–004。
