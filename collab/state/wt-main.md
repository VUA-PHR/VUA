---
worktree: wt-main
branch: main
role: 集成
baseline_commit: ecabfc7
updated: 2026-09-09
---
## 当前焦点
**双冻结批验收合并＋014 实现验收**（集成复跑 **cargo 428 通过 0 失败**〔56 套
件〕＋clippy 零告警）：核心 **production-use-case v0.2 已冻结**（24 向量＋向量
驱动消费测试——**W25 前置①凭证落地**）＋环境 **proposal 014 实现验收合并**
（import-as-VUA-copy 写路径＋project-ops v0.1 词表＋七项拒绝码闭集仲裁确认＋
桌面字段落 Schema）。**W25 三前置：①凭证落地＋②已落地＋③W22 实现进行中
〔executors 已接线〕——三者齐后一次开窗全量验证**。M6 三包首批已验收。
## 自基线交付（ce34570..HEAD，本 tick）
- **验收合并核心 production-use-case v0.2 冻结批**（2fd4813 经相关合并，核心域）：
  24 向量＋向量驱动消费测试（production_use_case_vectors.rs 新套件）完成冻结硬
  前置；契约表行升「已冻结」；
- **验收合并环境 014 实现批**（226dd41，project-manager 域）：import_copy.rs
  607 行（plan_import_copy 守卫＋实测复制范围＋plan digest → apply_import_copy
  双摘要漂移拒绝→排除复制→新 Unity 身份）＋import_copy.rs 342 行契约测试＋
  schemas/project-ops/v0.1/ 词表冻结件（command/result＋正例 4＋负例 3）；
  **七项拒绝码闭集仲裁确认**（target_exists/target_inside_source/
  source_not_registered/source_invalid/insufficient_disk_space/plan_drift/
  execution_failed——五守卫＋两分型，采纳随冻结）＋桌面字段请求核验落字段；
- BOARD：契约表加 project-ops v0.1 行＋production-use-case 行升已冻结＋#16 更新
  （实现验收＋七项确认）＋最近更新行。
## 阻塞
无。
## 下次合并意图
W22 实现切片批（产线，前置③——recoveryPoints 拍摄＋收据转抄，两对接细节待
核心澄清）；W23 数据批；W18/W19/W24 桌面批；桌面 013＋014 接线批（两命令面已
冻结，桌面解锁）；M6 环境后续批；production-use-case 协议本 v0.2 REGISTRY 行
核对（数据批 REGISTRY 已有行，核实一致性）；#7 残余样本（再现即带全量日志）。
## 留言
- [→核心] **production-use-case v0.2 冻结验收合并（复跑 428/0）——W25 前置①
  凭证落地**；W25 三前置仅剩③W22 实现切片（产线，两对接细节已路由你方）；
- [→环境] **014 实现批验收合并（复跑 428/0）＋七项拒绝码闭集仲裁确认采纳**；
  project-inspection REGISTRY 行缺登记提示维持（随下批补）；T-A 后续切片按
  你方节奏；
- [→桌面] **013＋014 两命令面均已冻结——接线批解锁**（F6 入口接入确认链；
  importCorrelationId/estimatedBytes/excludedEntries/targetPath 字段依赖已定）；
- [→操作者→用户] **W25 三前置：①凭证落地＋②已落地＋③W22 实现进行中**——
  三者齐后一次开窗全量验证；M6 三包首批已验收；
- [需用户] U5 维持暂缓（VUA-2/VUA-3 目录清理）。
