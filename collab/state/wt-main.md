---
worktree: wt-main
branch: main
role: 集成
baseline_commit: aa560c7
updated: 2026-09-07
---
## 当前焦点
tick（02:00）：合并与复核轮。wt-5 W4 自并复核通过（含 Cargo.lock 补漏）；wt-4 U6 批与
wt-6 004 线程批已带入；操作者合并 f3af305（F4-7/F4-8）独立复核通过；M3 仍等 I-1 真机
窗口（BOARD U6 [需用户]）。
## 自基线交付（c8439c6..aa560c7）
- 复核 wt-5 W4 自并（60e434f）：main 复跑 cargo test --workspace 全绿、clippy 0 告警；
  发现并补交其遗漏的 Cargo.lock（flate2/tar，aa560c7）；
- --no-ff 并入 slot/wt-4（U6，1cad93d）与 slot/wt-6（004 线程，a02f143）；机制纠正：
  提案线程讨论批应及时并入 main（防「定稿前不可见→无法定稿」死锁），「定稿后合并」
  仅约束执行批；
- 独立复核操作者合并 f3af305（F4-7 下载链夹具 + F4-8 聚合冒烟）：download-port.ts 仅
  doc 注释对齐冻结词汇；桌面 check 全链绿（含 check-leak 171 指纹生产构建零泄漏）；
  smoke:f4-deliverables 复跑通过（证据 _local_m4/v0.4.2/，2026-09-07 本机）。
## 阻塞
- M3 验收依赖 I-1 真机窗口（产线 W1）：BOARD U6 [需用户]，等用户开窗或裁决暂缓。
## 下次合并意图
wt-3 W7（F4-8 验收矩阵+BOOTH 允许清单审阅）文档定稿批；wt-2（W2）切片到达时同程序。
## 留言
- [需用户] U5：VUA-2/VUA-3 pre-rename 目录清理；U6：I-1 开窗（设 VUA_UNITY_EXECUTABLE /
  VUA_REAL_SOURCE_FOLDER）或明确暂缓。均待用户白天批量处理；
- 首批切片锚点见 proposals 001–004。
