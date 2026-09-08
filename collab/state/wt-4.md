---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 247c0fc
updated: 2026-09-08
---
## 当前焦点
**W21 Rust 信封桥接已交付**（核心 W20 第二刀验收合并入树，UnityOperation/
UnityPayload 扩展可用）：build_job_command/build_restore_command——组装件到
核心 UnityCommand 的字段拷贝桥接（复用形状自证组装为校验器），桥接与 JSON
组装逐 v2 字段互证测试钉死。**跨域形状注记（已留言核心）**：核心 UnityPayload
的 v1 String 字段序列化为空串（无 skip）而冻结 v2 Schema 给它们 minLength 1
——对 C# 消费者无害（DTO 字段空串缺省），wire-schema 严格性缺口唯核心可闭。
W25 等前置①（核心 W20 第三刀：resolve/plan/job/record 路由）③（W22 实现切片）。
承担 #7 瞬败样本观察义务。
## 自基线交付
- **Rust 信封桥接**（production_job.rs 增补，本轮）：build_job_command/
  build_restore_command——产出核心 UnityCommand（ExecuteProductionJob/
  RestoreProject 变体＋payload v2 四字段），组装函数作为形状校验器前置复用；
  互证测试逐 v2 字段断言（含跨域形状注记的如实断言）。production_job 套件
  **11/11**；全量 **402 通过 0 失败**＋clippy 零告警（2026-09-09 本机）。
- **W21 全部批次已验收合并**（集成复跑确认）：v2 冻结批（1a9cdf6）＋C# 第一刀
  （06802b9）＋Rust 前置件（8fcff01）＋C# 内核接线（aa2a9da）＋Rust 物化切片
  （9195fbb，前置②备案）。
- 本轮合并 main（核心 W20 第二刀验收批 401/0＋产线备案批带入）追平。
- W1（I-1 真 Unity 矩阵）16/16 已验收合并（M3 关门）；amf-unity 1.0.1 批已合并。
## 阻塞
- 跨域形状注记待核心表态（UnityPayload v1 String 字段空串序列化 vs v2 Schema
  minLength——C# 无害，wire 严格性缺口归核心）。
- W25 等前置①（核心 W20 第三刀路由）③（W22 实现切片）。
## 下次合并意图
**W21 信封桥接批**（production_job.rs 增补＋测试，产线域）＋状态请集成验收
合并；Rust 全量 402/0＋clippy 零告警。
## 留言
- [→核心] **跨域形状注记（诚实反馈，非阻塞）**：UnityPayload 的 v1 String
  字段（avatarGlobalObjectId 等五字段）serde 序列化为空串，冻结 v2 Schema 给
  它们 minLength 1——同文档互证测试暴露。C# 消费者按 DTO 空串缺省处理无害；
  wire-schema 严格性（provider 发出的命令应过 v2 Schema）唯核心可闭（字段
  Option 化或 skip_serializing_if）。不阻塞产线接线（桥接已按核心形状交付）。
- [→集成] 本批（信封桥接＋状态，产线域）请验收合并；Rust 全量 402/0＋clippy
  零告警。
- [→操作者→用户] W25 一次全量验证等前置①③（核心）；产线侧全部就绪。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案/冻结批/012 互审/executor prelude/信封扩展/exclude 形态/
  物化切片验收——均已闭环。）
