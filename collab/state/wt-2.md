---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 0a7ebbd7
updated: 2026-09-22
---
## 当前焦点
**第 156 批（2026-09-22 00:0x–00:3x，节拍轮工作时段 date 实测）＝数据座第
155 批只读清点两观察点处置批（操作者指派）一笔实现批 0a7ebbd7；轮首合并
main 18d19c5f（追平壳 d954e6ea，本树 95cb58ba 恰为其祖先零分叉，入站＝集成
第 155 批收编本座两笔为合并 09a4423f＋桌面 wt-3 三笔为 18d6d15f＋簿记）；
四文件 4 改 0 增（orchestrator 单 crate）；cargo test --workspace 893/0（第
155 批基线 890＋恰本批三枚新钉）＋clippy --workspace --all-targets 0 警告；
零新码零新依赖，VUA-7/VUA-8 全程零触碰**：

- **观察点 A（真缺陷，已修）＝recipe 存储钟近似历**：
  `RecipeDocumentStore::new_with_system_clock`
  （crates/orchestrator/src/recipe_documents.rs）原以
  `1970 + 秒/31_536_000`（365 天年）＋30 天月/30 天日整除近似做历法换
  算——数据座实测证据：内层 2026-09-19T20:16:59.769Z 的保存，外层
  updatedAt 打成 2026-07-16T20:16:59.770Z（倒退两个月），且该式对短月
  也能开出 30 日等不存在日期。**先读契约再修（不臆断）**：内层
  createdAt/updatedAt 是 Recipe v0.3 文档体自身必填 date-time 戳
  （schemas/recipe/v0.3/recipe.schema.json，应用面管理）；外层
  StoredRecipeDocument/RecipeListEntry updatedAt 由存储自身契约定义为
  「存储钟在保存时刻的戳」（RFC 3339 UTC），经 recipe.save/recipe.list
  wire 面逐字直出并作降序排序键（协议本 production-use-case v0.2 仅钉
  「updatedAt 降序」）——两面无相等约束，外层只须诚实等于真实时刻。
  **修法**：闭包改为一行复用已登记手写换算器 `crate::time::rfc3339`
  （Howard Hinnant civil_from_days，ORC-DEV-005 零依赖，历法数学单源
  化），闭包内零日期数学。**邻接排查**：全仓两轮 grep 证实近似历常量仅
  此一处（其余 duration_since+format! 均为临时目录纳秒命名；
  plan_documents 无存储钟；其余全部走 Clock::now_rfc3339）。**钉**：
  time.rs 新测试向量——平年闰日 2024-02-29、世纪非闰边界 2100-02-28 次日
  即 2100-03-01（36_524 修正项）、年界 2025-12-31T23:59:59.999Z→
  2026-01-01T00:00:00.000Z、数据座实测回归钉 1_789_849_019_770ms→
  2026-09-19T20:16:59.770Z（旧式对该输入可证产出 2026-07-16，钉在旧码
  上必红）；recipe_documents.rs 存储级回归钉——系统钟戳同形 RFC 3339
  （24 字符结构检查）且按同形串序严格晚于实测内层时刻
  2026-09-19T20:16:59.769Z（同形串序＝时序，即列表面排序契约；旧戳排
  在其前），落盘文档携同一戳。
- **观察点 B（契约语义，裁决＝设计，非缺口）＝失败运行 build record 落
  盘 records/*.json 但 provider.db production_domain_records 无对应
  行**：读两面写入路径后裁决——**注册表 kind 闭集冻结于
  CHECK(kind IN ('inspection','plan'))**（schema
  orchestrator-task-store v0.1 002），其唯一用途是下游引用解析链
  （requestPlan 解析 inspectionId、confirmPlan 解析 planId＋revision、
  build 回执经引擎 plan-id 别名回溯）；全仓仅三处 put_domain_record
  （provider_host start_inspection ×1、request_plan ×2 含别名）且都在
  引擎成功后发射，失败内联阶段走 persist_task_error 终态——无文档、
  无域身份、下游无可引用，**不发行为诚实记账而非遗漏**；build 记录
  任何终态（含 failed/cancelled/rolled_back/recovered）从来不是注册表
  kind——其全部消费面（record.get、U19 交棒闸、证据列举）按 id 直读
  BuildRecordStore，注册行只会是死重且 CHECK 约束本就禁止；实测恰 3
  行＝一条成功链（1 检查＋2 计划别名）；「失败记录在 records/*.json
  在场」恰是诚实纪律（失败如实呈现并喂给 U19 闸以类型化拒绝）。
  **防后人当缺陷修**：BuildRecordStore 结构体 doc＋put_domain_record
  doc 两处落全文裁决（选代码注记而非协议本，因 production-use-case
  v0.2 与 task-store v0.1 均冻结面，不为此动冻结文档），另加存储级测
  试钉：CHECK 约束拒 'build' kind 而 inspection/plan 照收、查无
  build-1 行。
- **诚实边界**：零端到端宣称——本批系代码面缺陷修复＋契约裁决，全部
  证据为本地 cargo 测试（893/0）；无真机运行宣称。`??
  _local_p27_devlog.txt` 照例未触碰。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 155 批（36bab970＋95cb58ba，2026-09-21）＝U19 交棒准入闸后端切片：
classify_handoff_record_state 六态闭集＋独立检视入口
release.openForInspection＋v0.2 冻结面（双 Schema＋11 向量＋双语协议本），
wire 帧环 20/20，经集成第 155 批收编（合并 09a4423f）。第 152 批
（cd8c0000＋d2063abe）＝proposal 029 起草批（车间入口模型重构〔配方驱动
为主〕＋从已有 Unity 项目导出 Recipe），经集成第 154 批收编
（9125f8f1）。第 150 批（7bc18e90＋464541c3）＝素材链修复批，经集成第
151 批收编（3e5573a6）。第 148 批（83e267d9＋98767e61）＝素材链反向审
查批，经集成第 149 批收编（da6a3bfb）。更早段落见本文件 git 历史与
BOARD 前录。
