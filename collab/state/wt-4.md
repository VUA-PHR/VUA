---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 2d5f741
updated: 2026-09-09
---
## 当前焦点
**W21 执行链全链连通**：核心 job.execute 收口刀（16a2dc5，W20 实现切片 closing
cut）已验收合并——provider 侧编排消费产线执行器 API（write_plan_file/
build_job_command 等 5 处引用），批准计划经 Bridge v2 执行（生命周期闸＋完整性
哈希校验＋九态任务）。产线侧 W21 代码全部交付且被消费；剩余＝W25 实证义务
（等前置③W22 实现切片〔provider 记录面〕与核心 v0.2 冻结收口声明）＋真机
窗口。承担 #7 瞬败样本观察义务。
## 自基线交付
- **Rust 物化下刀**（production_job.rs 增补，9195fbb 已集成验收合并——W25
  前置②备案）：stage_original_source（来源完整性校验＋guid 布局解包＋
  manifest 摘要绑定）＋v2 命令组装件＋C# exclude 反射接线（VRCMetaObject.
  excluded，程序集名 W25 实证）。
- **Rust 信封桥接**（1438305，已集成验收合并复跑 402/0）：build_job_command/
  build_restore_command 投影核心 UnityCommand（逐 v2 字段互证）；跨域形状
  注记（核心 payload v1 字段空串序列化 vs v2 Schema minLength）已留言核心
  （C# 无害，wire 严格性归核心）。
- **执行链连通确认**（本轮合并核实）：核心 job.execute 编排（16a2dc5）消费
  产线 API 5 处——write_plan_file（计划文件 job 目录投影）＋build_job_command
  （信封组装）等；合并尖 cargo test --workspace **420 通过 0 失败**＋clippy
  零告警（跨域编译/测试一致性已证）。
- 此前批次：v2 冻结批（1a9cdf6）＋C# 第一刀（06802b9）＋C# 内核接线
  （aa2a9da）。
- W1（I-1 真 Unity 矩阵）16/16 已验收合并（M3 关门）；amf-unity 1.0.1 批已合并。
## 阻塞
- 无产线侧阻塞。
- W25 等前置③收尾（W22 实现切片 provider 记录面——record.get 读面已交付，
  job 执行后 BuildRecord 落盘写入面状态待核心声明）＋核心 v0.2 冻结收口声明；
  W25 真机窗口由集成在前置齐后确认（一次全量验证）。
## 下次合并意图
本批（merge main＋状态，仅 collab/ 增量）随轮带入免测。
## 留言
- [→环境] **EAC 真机窗口请求收到，产线同意协同**：真机窗口预约在产线名下
  （W1 惯例延续）。建议**同窗多验证**方案——一次开窗内完成：产线 M5 全量
  验证（C# EditMode 全套件＋exclude_object VRCMetaObject 组件断言与构建对比
  ＋合法素材冒烟路径端到端）＋环境 EAC 探测/核验（eac-probe 真机探测＋R2/R3
  #[ignore] 真机再核验），减少开窗成本；排期与开窗确认归集成（多树共享窗口
  的批准权在操作者）。环境侧如需窗口内特定前置（EAC 环境状态、被测进程准备）
  请列清单随提案/状态文件走，产线在窗口内配合执行顺序。
- [→操作者→用户] **真机窗口请求（两树共享·一次开窗）**：环境 EAC 探测/核验
  ＋产线 M5 全量验证建议同窗执行（见上）；前置仍等 W25 清单（①v0.2 冻结已
  完成、③W22 实现切片推进中）——环境 EAC 探测若不依赖 M5 前置也可先行
  独立开窗，请操作者按成本裁量。
- [→核心] 两件协作请求维持（UnityPayload 形状注记＋W22 对接细节两问）。
- [→集成] 本批（merge＋状态，仅 collab/ 增量）随轮带入免测。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案/冻结批/012 互审/executor prelude/信封扩展/exclude 形态/
  物化切片验收——均已闭环。）
