---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: ecfc51d
updated: 2026-09-08
---
## 当前焦点
**W21 C# 执行内核已接线**（核心执行语义规格 011 内联到货，集成确认「可接线」）：
四个计划 kind 全部实现——install_modular_asset（v1 materialize 基座复用＋prefab
实例化＋assetId 命名）、attach_to_bone（humanoid 骨骼映射＋localTransform）、
set_object_active（SetActive＋activeSelf 事实校验）完整实现；exclude_object 的
标记写入待核心钉死组件形态（VRCSDK 未被本包引用，规格「/」两可——对象已定位、
类型化 exclude_marker_unavailable 失败、不改对象）。selector 解析器（pathHint
名字链＋selectorId 场景深搜；catalogEntryId-only 诚实无解——目录数据在 provider
BDL）。C# 待真机 EditMode 验证（W25 窗口）。承担 #7 瞬败样本观察义务。
## 自基线交付
- **Rust 执行器前置件**（production_job.rs，上轮）：计划文件写入器＋SHA-256
  哈希锚＋读回验证＋v2 收据投影解析；5 单元测试。**边界如实**：命令信封组装
  等核心 UnityOperation/UnityPayload 扩展后接线（已留言请求）。
- **C# 执行内核接线**（本轮，产线域）：
  - 协议层：BridgeObjectSelector/BridgeLocalTransform/BridgePlanTarget 计划
    映射（pathHint/selector/catalogEntryId/localTransform/avatarInstanceId）＋
    BridgePlanJob inputs 定型字段＋BridgeData.instanceGlobalObjectId；
  - 执行循环真实分发（kind switch→四执行器，词表外 job_kind_unknown）：
    - install_modular_asset：来源物须由 provider 物化进 job 目录
      （source_not_staged 前置拒绝——物理准备属 Rust 执行器下一刀）→复用
      materialize 基座（v1 真机验证）→prefab 实例化＋assetId 命名；
    - attach_to_bone：selectorId 场景定位→plan.target.avatarInstanceId/首个
      humanoid Animator→HumanBodyBones 枚举（词表外/无映射＝
      bone_not_in_humanoid_mapping）→SetParent(false)＋localTransform 应用；
    - set_object_active：selector 定位→SetActive→activeSelf 事实校验；
    - exclude_object：selector 定位完成；标记写入类型化失败
      exclude_marker_unavailable（组件形态规格「/」两可未钉死＋VRCSDK 未引用
      ——对象已定位未被修改，待核心钉死形态后接线）；
  - selector 解析器：pathHint 逐级名字链（含 inactive 深搜）；selectorId 场景
    名字深搜；catalogEntryId-only＝selector_unresolved（目录在 provider BDL，
    Bridge 无目录数据源）；
- 证据：cargo test --workspace **384 通过 0 失败**（Rust 全量；向量/消费测试
  全绿）＋括号/括注平衡自审；C# 待真机 EditMode 验证（W25 窗口，如实声明）。
- 本轮合并 main（W22 冻结切片收口＋011 执行语义规格＋inputs 勘误批）。
- W1（I-1 真 Unity 矩阵）16/16 已验收合并（M3 关门）；amf-unity 1.0.1 批已合并。
## 阻塞
- exclude_object 标记形态待核心钉死（VRCSDK 组件类型名或包引用裁决）——规格
  「VRCMetaObject / offence-excluded 形态」两可，产线不猜测 SDK 类型。
- v2 命令信封组装等核心 UnityOperation/UnityPayload 扩展（上轮请求）。
- W25 等真机窗口与合法素材环境变量确认。
## 下次合并意图
**W21 实现批**（C# 执行内核接线＋Rust 前置件＋v2 冻结批 1a9cdf6＋C# 第一刀
06802b9）请集成验收合并；Rust 全量 384/0＋clippy 零告警，C# 待真机验证
（如实声明）。
## 留言
- [→核心] **exclude_object 标记形态请钉死**：规格「VRCMetaObject / offence-
  excluded 形态」两可且 VRCSDK 未被 com.ph-r.vua 引用——请二选一：① 给出
  确切组件类型与所在程序集（asmdef 增引用随批）；② 改用不依赖 VRCSDK 的
  排除等价物。产线不猜测 SDK 类型。selector 其余三 kind 已全部接线。
- [→核心] Rust 前置件两件协作请求维持（UnityOperation/UnityPayload 扩展＋
  W20 实现切片执行语义规格已到货确认收到）。
- [→集成] W21 实现批（本轮）请验收；C# 无本机编译环境，真机 EditMode 验证
  在 W25 窗口（如实声明）。
- [→操作者→用户] W25 真机窗口预约维持（执行内核接线完成，EditMode 验证与
  冒烟路径就绪待窗口）。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案/冻结批/012 互审验收——均已闭环。）
