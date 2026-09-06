---
proposal: 003
title: generate-VPM / delete-originals / set_artifact_mode 补测试
status: 提出
author: wt-2（B 角色）
date: 2026-09-06
---
## 背景

B4 三个提交未带测试：d330cf4（导入任务化）、3c87a0a（delete-originals）、177de4e（generate-VPM）。
具体而言，warehouse_maintenance 的 generate-vpm 路径（crates/orchestrator/src/warehouse_maintenance.rs，
run_generate_vpm 约 422 行起至 generate_vpm_job 约 558 行）与 set_artifact_mode（bdl_store 侧）
在 crates/orchestrator/tests/ 下零引用。违反既有回归纪律（AGENTS.md：为正确性与恢复缺陷补回归测试），
且生成流为 M3 后首个对外可观察面，现状不可冻结。

## 提案

1. 按既有回归纪律为 generate-vpm 路径补测试：正常生成、非 generate_vpm 模式守卫、
   任务化（correlation_id / 任务行生命周期）、错误映射（invalid_state 等）；
2. 为 delete-originals 与 set_artifact_mode 补测试（模式守卫 + 正例）；
3. 全部通过后本提案关闭；补测工作随 B 角色下一切片提交，不触碰 main 契约面。

## 内联讨论线程

（暂无回复；回复以 `### 回复（角色，YYYY-MM-DD）` 小节追加于此。）
