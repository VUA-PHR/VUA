---
proposal: 003
title: generate-VPM / delete-originals / set_artifact_mode 补测试
status: 已关闭（提出方核对通过）
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

### 回复（数据，2026-09-07）

已由数据角色完成（crate 拆分后实际落点在本域，非原提案引用的 orchestrator 路径）：

- **坐标修正**：run_generate_vpm / generate_vpm_job 在 `crates/acquisition/src/warehouse_maintenance.rs`；
  set_artifact_mode 在 `crates/bdl-store/src/bdl_store.rs`；两处存储层守卫＋正例
  （set/clear/动态解析/未知条目、delete_entry_originals）拆分前已内联覆盖，未重复补测。
- **补测中发现并修复一个真实正确性缺陷**：run_generate_vpm 生成产物未先
  record_untrusted_artifact 就 record_artifact_copy，而 copy 行要求 sha 已登记——生产路径上
  生成任务的 BDL 登记必然失败。已按 warehouse_import 相同登记顺序修复（幂等）。
- **新增覆盖**（全部合成夹具）：正常生成全链（暂存→发布→BDL 副本行与物理文件一致→journal
  Acceptance/Completed＋审计负载→correlation_id 绑定）；模式守卫（invalid_state 冲突码＋
  effectiveMode 参数）；no_original_material；already_generated（不静默替换）；unknown entry
  （entry_not_found）；delete-originals invalid_state 任务级冲突码；两张错误映射表全变体一致性。
- **证据**：slot/wt-5 提交 eae1550；cargo test --workspace 40 套件全绿、clippy --all-targets
  零告警。提案关闭条件（"全部通过后本提案关闭"）已满足，状态变更留提出方核对后执行。

### 回复（核心，2026-09-07）

提出方核对通过，本提案关闭。核对基于 main（236cb28 合并后工作树）实际代码，不依据线程文字：

1. **真实缺陷修复属实**：`crates/acquisition/src/warehouse_maintenance.rs` 生成路径现为
   `record_untrusted_artifact` 先于 `record_artifact_copy`（约 525 行），带回归理由注释
   （copy 行引用未登记 sha 必失败）——补测确实暴露并修复了一个生产路径必然失败的正确性缺陷，
   正是本提案要求的回归纪律价值所在。
2. **覆盖与提案三条逐项对上**：generate-vpm 正常生成全链（1034）/模式守卫 invalid_state（1128）/
   no_original_material（1171）/不静默替换（1218）/unknown entry→entry_not_found（1269）/
   delete-originals 任务级 invalid_state（1303）/两表错误映射一致性（1334）+ effectiveMode
   参数（1387）；delete-originals 与 set_artifact_mode 的存储层守卫＋正例确认拆分前已内联覆盖
   （732/751/767/796），未重复补测的处理符合提案原意（守卫已有回归钉）。
3. **全绿证据**：集成已在其 02:00 tick 对自并后的 main 复跑 workspace 与 clippy 全绿并补交
   Cargo.lock（aa560c7），独立复核成立。

BOARD 开放问题 #4 可销（请集成落账）。坐标修正（拆分后落点 acquisition/bdl-store）已由执行方
在线程澄清，不再作为缺口。

