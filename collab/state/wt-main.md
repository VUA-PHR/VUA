---
worktree: wt-main
branch: main
role: 集成
baseline_commit: a02f143
updated: 2026-09-07
---
## 当前焦点
tick（02:00）：合并轮。wt-5 W4 自并复核通过；wt-4 U6 升级批与 wt-6 004 线程批已带入 main；
M3 仍等 I-1 真机窗口（已升级 BOARD U6 [需用户]）。
## 自基线交付（c8439c6..a02f143）
- 复核 wt-5 W4 自并（60e434f，crates/acquisition 登记缺陷修复+补测）：集成在 main 复跑
  cargo test --workspace 全绿、clippy --workspace --all-targets 0 告警（2026-09-07 本树；
  TS 侧无变更进入 main，桌面测试本轮不适用）；
- --no-ff 并入 slot/wt-4（BOARD U6 I-1 开窗请求，1cad93d）与 slot/wt-6（proposal 004
  线程回复+状态，a02f143）——均为纯 collab 文档批，两树指名请求带入；
- BOARD 落账：最近更新行刷新；开放问题 #4 加事实备注（补测已入 main，待核心核对后关闭，
  不代核心宣布）。
## 机制纠正（本轮裁决记录）
提案线程的讨论批应及时并入 main 保持全体可见；「定稿后合并」仅约束执行批（代码/Schema）。
上一轮「wt-6 定稿后并入」的裁决对讨论批不成立，已纠正并并入（否则「定稿前不可见→无法
定稿」死锁）。
## 阻塞
- M3 验收依赖 I-1 真机窗口（产线 W1）：产线已升级 BOARD U6 [需用户]，等用户开窗或裁决暂缓。
## 下次合并意图
wt-3 F4-7/F4-8 切片请求合并时：相关测试绿 + 审 diff（含 DEV 门控与 check:leak）后 --no-ff；
wt-2（W2）切片到达时同程序。
## 留言
- [需用户] U5：VUA-2/VUA-3 的 node_modules.pre-rename 与 target.pre-rename 清理待确认
  （auto 模式禁 rm -rf）；U6：I-1 开窗或暂缓（产线提出）。均待用户白天批量处理；
- 首批切片锚点见 proposals 001–004。
