---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 984f6d4
updated: 2026-09-08
---
## 当前焦点
**执行序②收口：数据挂点落地＋产线 executor prelude 验收合并**（集成复跑 **387
通过 0 失败**＋clippy 零告警）。010 路径 A 全链就位：核心 wire 路由（6b4f21a）＋
数据 job 内联挂点（31cf558）＋产线计划文件写入器/收据投影（8fcff01）。**信封扩展
（UnityOperation/UnityPayload）请求核心**（产线提出，核心所有类型——待表态）。
剩：production-use-case v0.2 冻结＋C# executors 接线＋③桌面呈现。
## 自基线交付（8cc8567..984f6d4，本 tick）
- **验收合并产线 W21 Rust executor prelude**（8fcff01，产线/unity-bridge 域）：
  production_job.rs 320 行（计划文件写入器：哈希锚＋读回校验〔010/产线建议
  兑现〕）＋v2 作业收据类型化投影；信封扩展请求核心（UnityOperation/UnityPayload
  ——bridge 信封类型在核心域，产线不越界，正确路由）；
- **验收合并数据挂点批**（31cf558，数据/acquisition 域）：import 编排自动生成
  挂点入 acquisition（010 路径 A 数据半边：job 内联＋auto_generate spec＋
  import_correlation_id，按核心精确设计）；import_contract_v03 测试同步；
- 验收证据（2026-09-08 本机）：两批合并尖 **cargo workspace 387 通过 0 失败**
  （净增 8）＋clippy -D warnings 零告警；BOARD 最近更新行刷新（8cc8567）。
## 阻塞
无。
## 下次合并意图
核心信封扩展表态批（UnityOperation/UnityPayload）；核心 production-use-case
v0.2 冻结批＋W20 实现切片；W22 实现切片（产线 executors 接线——前置四语义已
冻结）；W18/W19 桌面呈现批（执行序③）；#7 残余样本（再现即带全量日志）。
## 留言
- [→核心] **信封扩展请求路由**（产线 8fcff01 提出）：UnityOperation/UnityPayload
  为核心所有类型，W21 executor prelude 需要扩展承载生产作业信封——请表态
  （扩展形状与 production-use-case v0.2 词表的对齐关系一并考虑）；
- [→数据] **挂点落地验收合并（执行序②数据半边完成）**——与核心 wire 路由合并
  复跑 387/0；010 六承诺的实现核对建议随批声明（供验收档案）；
- [→产线] executor prelude 验收合并；信封扩展已路由核心（表态后接线解锁）；
  per-kind executors 接线的前置（四语义＋信封）就绪中；
- [→桌面] 执行序②已收口——呈现批（③）解锁，等 production-use-case v0.2 词表
  （核心 W20 实现切片）后随批；
- [→操作者→用户] W25 真机窗口预约维持（等 W21 契约/实现就绪前确认即可）；
- [需用户] U5 维持暂缓（VUA-2/VUA-3 目录清理）。
