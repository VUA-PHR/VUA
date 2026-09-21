---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 7bc18e90
updated: 2026-09-21
---
## 当前焦点
**第 150 批（2026-09-21，两笔：修复批 7bc18e90 恰 10 文件 533+/11-＋本状态批恰
本文件）——桌面座 148 批实证的 messageKey 粒度细化＋操作者裁定的 `Packages/`
盲点收口；轮首追平 main cc5a4d7c（fast-forward，落后 4→0，纯吸收集成第 149
批世代）；用户休息中授权自主续拍，VUA-7/VUA-8 全程未触碰**：

- **任务一：失败 messageKey 按失败类别分流（BOARD #45 桌面知会件）**。
  桌面 148 批实证：`material_task.rs` 与 provider-host 工作面对一切 Failed
  恒发 `errors.material.executionFailed`，桌面预留的 `provisionFailed` 词面
  永不命中、供给失败与桥接失败同句笼统。修复：`material_exec` 新增
  `failure_message_key` 分类助手（单一来源），供给段失败（`run_provision`
  的 create/resolve 臂及其包装臂——码一律以 `vua.material.provision_failed`
  为前缀）改发 `errors.material.provisionFailed`，其余维持
  `executionFailed`；两个发射面（unity-bridge 任务运行时 job＋provider-host
  `Run::Execute` 工作面）共用同一助手。**载荷数据细化非 wire 形状变更**：
  AppErrorV1 信封与字段闭集零触碰、Schema 零触碰、零新码；差异事实仍由
  `code` 携带（桌面 148 批并呈律同显词面与原码，原供给原因无论键面如何都
  到达行内）。`inspect_project` 的两处直发 AppErrorV1 维持
  executionFailed——检查面无供给段（如实在案）。协议本 v0.2 0.2.1 注记
  （双语）＋REGISTRY 括注照章。
- **任务二：`Packages/` 盲点收口（BOARD #45 跨面决策项；操作者裁定：素材
  直导通道不得静默写入 `Packages/`——那是 vpm-manifest 追踪的 VPM 通道
  领地，绕过追踪的写入违背单通道写模型）**。机制按合同纪律裁量，两层
  兜底、零新码：
  1. **intake 预检面（发现/阻断）**：`scan_unitypackage` 在检查面即拒收
     `Packages/` 前缀 pathname（既有 `vua.material.archive_invalid` 族）——
     计划与确认根本不形成。软「发现」形态被否：仅记证据会让已确认计划
     静默丢包（＝静默部分导入，恰是要封的死法）。
  2. **执行臂兜底（拒绝）**：`extract_package_into_dir` 第一遍整体拒收
     （先于第二遍任何落盘——零残留、零部分物化；Ordinal 前缀与 C# 面判
     定逐字节同形），三处物化消费点（直导/暂存导入/generate_vpm_only）
     共用；计划后混入的此类包在执行前重检如实拒绝（先于快照与首笔变更）。
     暂存腿旧的静默有损形态（Packages/ 条目物化进一次性暂存工程、落在生
     成包之外）同批变为诚实拒绝。
  - **C# 面刻意不动，决策与理由**：Bridge v4 协议已冻结，其诊断码集合里
    无一个能诚实承载「通道边界拒绝」的既有码——说谎复用
    （source_type_invalid/manifest_drift/operation_not_allowed 语义皆不符）
    或新立诊断码（操作者零新码约束所不容）两案皆被否。两层 Rust 闸口就位
    后，链上已无任何路径能把 Packages/ 内容送达 C# op，其 Assets/-或-
    Packages/ 接受臂成为链上不可达的**休眠面**——收窄它（一行）候码决策
    或协议注记后再做，已在候派登记，不夹带。`ValidateAssetPaths` 继续接受
    Packages/ 期望——那是 VPM 通道（本地包生成＋vpm install）的合法面，
    非本裁定所及。
  - **148 批钉不回摆**：恶意归档三形态 raw-ustar 测试套内实测保持绿——
    其合法布局用 Assets/ pathname，条目名组件守卫与 pathname 内容检查
    正交。
- **素材链 messageKey 家族核对（BOARD #45 顺带件；桌面词表补齐候选清单，
  跨域不动桌面）**：引擎侧在用 `errors.material.*` 键全量 12 个——
  `executionFailed`（任务层＋工作面＋inspect_project ×2＋工作面回滚臂）、
  `provisionFailed`（本批新增分类）、`sourceInvalid`（intake ×2）、
  `sourceEmpty`、`sourceUnreadable`、`sourceDrift`、`planHashMismatch`、
  `riskDecisionStale`（×2）、`riskDecisionRequired`、`cancelled`、
  `internal`（digest_json）、`recordFailed`（工作面回执发布失败臂）。
  桌面词表 material 段现有 2 键（executionFailed＋provisionFailed，四语
  同步）——**补齐候选 10 键**：sourceInvalid、sourceEmpty、sourceUnreadable、
  sourceDrift、planHashMismatch、riskDecisionStale、riskDecisionRequired、
  cancelled、internal、recordFailed（现由 code 原词兜底呈词，未命中不虚构，
  与诚实三律兼容——补齐属呈现增强非缺陷修复）。桌面裁量，本域不动。
- **测试清单（＋6，五 crate 821/0，对表 148 批 815 自洽）**：
  1. 源内 batch150 通道边界模块：Packages/-only 归档拒收且
     extracted_root 从未创建（零落盘）；Assets/＋Packages/ 混装归档整体
     拒收（无静默部分导入）。
  2. tests/material_exec.rs：intake 阻断含 Packages/ 包＝发现面
     （archive_invalid）；计划后混入归档执行臂诚实拒绝（VerifySource 失败、
     rollback NotNeeded、零 Bridge 命令、无收据）。
  3. tests/material_task.rs：任务层供给失败 Completed 事件呈现
     provisionFailed＋provision_failed 族码＋空态诚实收据；任务层桥接拒绝
     维持 executionFailed＋bridge_rejected。
  4. provider-host production_host.rs：既有 bridge_timeout 工作面钉扩展
     executionFailed messageKey 断言。
- **证据（personally green，date 实测）**：cargo test 五 crate **821/0**
  ＋clippy 六 crate（含 bdl-store）--all-targets **0 警告 0 错误**＋
  desktop typecheck 双 tsconfig **exit 0**（零 TS 文件触碰，为证据形状
  齐整复跑）＋git diff --check clean。修复批恰 10 文件 533+/11-＝
  unity-bridge src 3＋tests 2、provider-host src 1＋tests 1、协议本双语
  2＋REGISTRY 1。VUA-7/VUA-8 及其分支全程未触碰。
- **候派登记（本批不动）**：
  1. C# 物化面 `Packages/` 接受臂收窄（休眠面；需新诊断码裁决或协议注记，
     一行改动候派）。
  2. `loadedAssetPaths` 证据面 `unwrap_or_default`（148 批登记沿用，跨
     crate fake 涟漪）。
  3. 端口面取消位（VpmBackend/Bridge；快照/provision 网络段/preview/
     apply 腿不可中断）。
  4. 失败/取消后 `.vua/imports` 解包残留清理策略（需回滚分支小重构）。
- **诚实边界维持：零端到端宣称**——本批全部结论系代码面＋fake/手工归档
  证据；真实 W25 素材是否携带 `Packages/` 条目、供给失败词面在桌面真机上
  的实际命中，均归 W25（O-2）如实候验；测试绿≠真机绿。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 148 批（83e267d9＋98767e61，2026-09-21）＝素材链反向审查批：tar 解包
组件级路径守卫＋mutating 命令 id attempt 盐＋物化指纹硬要求三修复三钉，
经集成第 149 批收编（da6a3bfb）。第 146 批（70f7476）＝供给依赖解析端口面
钉底＋run_provision 接线（resolve 骑新建路径、指纹重取哨兵、失败两臂诚实），
操作者裁决两笔落账（第 147 批）。更早段落见本文件 git 历史与 BOARD 前录
（10 段轮转）。
