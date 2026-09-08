---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: ce4a1e1
updated: 2026-09-08
---
## 当前焦点
**W21 接线批已交付**（用户催办开工，授权无视收尾窗口）：① Rust 执行器前置件
增补 v2 命令组装件（execute_production_job/restore_project 冻结 v2 信封直组，
核心 93f841c 批入树后机械桥接 UnityCommand）；② C# exclude_object 按
VRCMetaObject.excluded 主形态接线（反射——VRCSDK 程序集名待 W25 真机实证，
缺失/成员差异均类型化诚实失败）。执行内核四 kind 全部接线完成。C# 待真机
EditMode 验证。承担 #7 瞬败样本观察义务。
## 自基线交付
- **Rust v2 命令组装件**（production_job.rs 增补）：build_job_command_json／
  build_restore_command_json——按冻结 v2 信封（schemaVersion 2＋operation＋
  payload 三件/快照身份）直组命令文档；实跑强制 expectedProjectFingerprint
  （缺省＝类型化错误）；planSchemaVersion 闸在组装层复验。单元测试＋2（信封
  对齐/dry-run 无指纹/实跑缺指纹/版本闸），production_job 套件 9/9。
- **C# exclude_object 接线**（用户预案：程序集名待 W25 真机确认前用反射）：
  VRCMetaObject 类型反射解析（三候选程序集名）＋GetComponent/AddComponent＋
  excluded 属性/字段双形态写入；类型/成员缺失＝exclude_marker_unavailable
  类型化失败（对象已定位未被修改，诚实不冒充）。
- 证据：cargo test --workspace **389 通过 0 失败**＋clippy --all-targets 零
  告警（2026-09-08 本机）；C# 待真机 EditMode 验证（W25 窗口，如实声明）。
- 此前批次：v2 冻结批（1a9cdf6，已验收）＋C# 第一刀（06802b9）＋Rust 前置件
  （8fcff01，已验收）＋C# 执行内核接线（aa2a9da，待验收）。
## 阻塞
- 无（两接线解锁条件均已到货并消费）。
- W25 等真机窗口与合法素材环境变量确认（C# EditMode 验证＋exclude 组件断言
  与构建对比实证＋冒烟路径）。
## 下次合并意图
**W21 全部四批**（v2 冻结批 1a9cdf6〔已验收〕＋C# 第一刀 06802b9＋Rust 前置件
8fcff01〔已验收〕＋C# 内核接线 aa2a9da＋本轮接线批）请集成验收合并；Rust 全量
389/0＋clippy 零告警，C# 待真机验证（如实声明）。
## 留言
- [→核心] 信封扩展（93f841c/36b14ff）与 exclude 形态钉死（VRCMetaObject.
  excluded）均到货消费完毕——产线接线批完成，W21 产线侧无剩余待办（除 W25
  实证义务）。install_modular_asset 的来源物物理准备（original 件解包/
  generated_vpm 副本复制进 job 目录）属 Rust 执行器下一刀，将与 W20/W22 实现
  批的 provider 记录面对接（本批 C# 侧已按 source_not_staged 前置拒绝诚实
  占位）。
- [→集成] **W21 四批请验收**：C# 第一刀（06802b9）＋C# 内核接线（aa2a9da）＋
  Rust 前置件（8fcff01，已验收）＋本轮（命令组装件＋exclude 反射接线）。Rust
  全量 389/0＋clippy 零告警；C# 真机 EditMode 验证随 W25 窗口（如实声明）。
- [→操作者→用户] W25 真机窗口预约**升级为就绪请求**：W21 代码侧全部交付，
  窗口内将执行——C# EditMode 全套件验证＋exclude_object 组件断言与构建对比
  （VRCMetaObject 实证义务）＋合法素材冒烟路径。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案/冻结批/012 互审/executor prelude/信封扩展与 exclude 形态
  ——均已闭环。）
