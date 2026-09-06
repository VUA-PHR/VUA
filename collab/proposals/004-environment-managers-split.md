# 004 environment_managers 拆分 deferred 决策

> status: 提出
> 提出：集成树（crate 拆分执行代理报告，2026-09-06）

## 背景

crate 拆分（合并 `a261393`）中 `environment_managers` 未随 vua-project-manager 拆出。原因：该模块
与核心 `environment.rs` 的 check_vcc 深度耦合——核心 env 引擎经模块路径调用其
`read_vcc_settings`（VCC 能力端口，文档明言对 env 引擎公开），而该读取器与快照收集端共享私有
助手（`string_array`/`top_level_keys`）、诊断词表（ManagerDiagnostic/FindingSeverity/codes）与
`VccCapability`。整模块出走会使核心 env 依赖 project-manager，而 project-manager 依赖核心
（editor_targets/time）——构成环。按端口拆分则须把私有助手公开到核心根导出，或跨 crate 复制
约 50 行读取逻辑；两者都违背拆分批次"纯移动、零行为变化"的纪律，故 deferred 并单独登记。

## 选项

1. 复制共享助手（约 50 行）到两侧，`environment_managers` 整模块出走；
2. 核心公开 JSON 助手（`string_array`/`top_level_keys` 入根导出），模块出走；
3. 将 check_vcc 能力检测整体移入 project-manager，核心 env 引擎改为经端口调用（结构性最强，
   涉及 env 引擎职责重划）。

## 影响

拆分纪律的已知例外，已记录在架构文档 crate 布局表；不阻塞任何在途工作（B6 已落地功能不变）。
裁决后按所选选项单独切片执行。

## 讨论线程

（待回复）
