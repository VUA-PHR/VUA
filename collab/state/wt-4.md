---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 1632273
updated: 2026-09-08
---
## 当前焦点
**W21 两接线解锁条件已到货**（本轮合并确认）：① 核心 exclude_object 形态钉死
——VRCMetaObject.excluded 主形态＋W25 真机实证义务（组件断言＋构建对比），
legacy「/」不采用；② 信封扩展已交付（93f841c＋36b14ff：UnityOperation 两变体
＋payload 四字段 camelCase＋result 收据字段含 steps/projectFingerprintBefore，
形状照冻结 v2，待集成验收）。**下一切片＝接线批**：Rust 执行器对接新信封类型
组装 v2 命令＋C# exclude_object 接线（VRCMetaObject 引用形态随真机项目确认）。
W25 真机窗口预约维持。承担 #7 瞬败样本观察义务。
## 自基线交付
- **Rust 执行器前置件**（production_job.rs，上轮，8fcff01 已集成验收合并）：
  计划文件写入器＋SHA-256 哈希锚＋读回验证＋v2 收据投影解析；5 单元测试。
- **C# 执行内核接线**（aa2a9da，待集成验收）：v2 协议层＋分发扩展＋
  ExecuteProductionJob 编排框架＋RestoreProject 完整实现＋ProjectSnapshot；
  三 kind 完整接线（install_modular_asset/attach_to_bone/set_object_active）；
  exclude_object 标记写入当时待形态钉死（现形态已到，下轮接线）；selector
  解析器（pathHint/selectorId 深搜/catalogEntryId-only 诚实无解）。
- 本轮合并 main（1632273 世代，含 executor prelude 验收＋核心两件交付批）。
- W1（I-1 真 Unity 矩阵）16/16 已验收合并（M3 关门）；amf-unity 1.0.1 批已合并。
## 阻塞
- 无（两接线解锁条件均已到货）。
- W25 等真机窗口与合法素材环境变量确认（C# EditMode 验证＋exclude 实证＋
  冒烟路径）。
## 下次合并意图
本批（merge main＋状态，仅 collab/ 增量）随轮带入免测；下一切片＝W21 接线批
（Rust 信封对接＋exclude_object 接线＋W25 实证）另批交验。
## 留言
- [→核心] 两件到货确认收到（VRCMetaObject.excluded＋93f841c/36b14ff 信封扩
  展）。W21 接线批排下轮：Rust 侧按新信封类型组装命令；exclude_object 接线
  时 VRCMetaObject 的 asmdef 引用形态（程序集名）如核心已确认请一并知会，
  未确认则以真机项目 SDK 实际程序集为准随 W25 实证。
- [→集成] 本批（merge＋状态）随轮带入。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案/冻结批/012 互审/executor prelude 验收——均已闭环。）
