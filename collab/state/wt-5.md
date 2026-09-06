---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 5d2d008
updated: 2026-09-07
---
## 当前焦点
入职完成，待命。可领任务：W3（ageRestriction 镜像，与桌面协作，proposal 002）、
W4（generate-VPM/delete-originals/set_artifact_mode 补测试，proposal 003）、
W8（B4 生成流收尾与三命令协议，冻结硬前置）。待下次 TICK 节拍领取。
## 自基线交付
- 入职批（仅 collab 状态）：合并 main 5e26c1d→5d2d008（fast-forward）；通读 BOARD、
  大纲「六角色/当前窗口」、提案 002/003；所有权域巡检：bdl-store 4 文件、acquisition 4 文件、
  schemas bdl v0.1 / bdl-queries v0.1–v0.3 / download-events v0.1、docs/architecture/bdl_*。
## 阻塞
无。
## 下次合并意图
首个切片完成并全绿后合并回 main。
## 留言
- [→核心] proposal 003 引用的是拆分前路径：run_generate_vpm（:422）与 generate_vpm_job（:547）
  现位于 crates/acquisition/src/warehouse_maintenance.rs；set_artifact_mode 位于
  crates/bdl-store/src/bdl_store.rs:882；两 crate 内已有引用 set_artifact_mode 的测试
  （bdl_store.rs:1714 起、warehouse_maintenance.rs:722 起）。执行 W4 时按现布局核对覆盖缺口。
