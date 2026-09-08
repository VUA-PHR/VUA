---
worktree: wt-main
branch: main
role: 集成
baseline_commit: a6a838c
updated: 2026-09-09
---
## 当前焦点
**三批验收合并**（集成复跑 **cargo 432 通过 0 失败**〔57 套件〕＋clippy 零告警
＋桌面 **397 测试**＋leak 零泄漏）：桌面 **F6 确认链接线批**（c967ce6 自并：
project-ops v0.1 桌面面——013＋014 双命令面接线完成）＋核心 **plan.list/
record.list 身份列表**（ca991e8：W20 命令面完成）＋环境 **013 读面词表冻结件**
（d253b8d：command/result Schema＋project_queries 测试＋REGISTRY rows）。
**W25 三前置：①凭证落地＋②已落地＋③W22 实现进行中〔executors 已接线〕**。
## 自基线交付（ecabfc7..HEAD，本 tick）
- **桌面 F6 确认链接线批自并确认**（c967ce6 经 db69789，桌面域）：ProjectCompatPage
  确认链（＋242 行）＋project-ops-port.ts（235 行）＋四网关接线＋fixture-project-ops
  ＋四语——013＋014 双命令面接线完成；
- **验收合并核心 plan.list/record.list 批**（ca991e8，核心/provider-host 域）：
  plan_documents/recipe_records 各＋16 行身份列表＋provider_host 173 行路由＋
  warehouse_commands 测试——**W20 命令面完成**；
- **验收合并环境 013 读面词表冻结件批**（d253b8d，project-manager 域）：
  project-inspection command/result Schema＋project-lock-status 例＋
  project_queries.rs 100 行测试＋REGISTRY rows＋013 内联（＋25 行）；
- 验收证据（2026-09-09 本机）：**cargo workspace 432 通过 0 失败**（57 套件）＋
  clippy -D warnings 零告警＋桌面 check 全链（47 文件 397 测试＋leak 零泄漏）。
## 阻塞
无。
## 下次合并意图
核心 production-use-case v0.2 冻结收口声明批（**W25 前置①凭证已落地**——冻结
批已验收，声明为形式收口）；W22 实现切片批（前置③——两对接细节待核心澄清）；
W23 数据批；W24 工作台批（双端读面就绪）；#7 残余样本（再现即带全量日志）。
## 留言
- [→核心] **W20 命令面完成验收（plan.list/record.list）**——production-use-case
  v0.2 冻结批已验收（前置①凭证落地）；两对接细节（计划 JSON 序列化传入方/
  ProductionJobReceipt→BuildRecord 关联面）与冻结收口声明待你方；
- [→环境] 013 读面词表冻结件验收合并（复跑 432/0，project_queries 100 行入树）；
  013＋014 双命令面接线完成——T-A 后续切片按你方节奏；
- [→桌面] F6 确认链接线批验收合并（复跑 397 测试＋leak 零泄漏）；W24 工作台
  双端读面就绪；
- [→操作者→用户] W25 三前置：①凭证落地＋②已落地＋③W22 实现进行中——三者齐
  后一次开窗全量验证；
- [需用户] U5 维持暂缓（VUA-2/VUA-3 目录清理）。
