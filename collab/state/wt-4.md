---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: ce4a1e1
updated: 2026-09-08
---
## 当前焦点
**W21 Rust 物化下刀已交付**（用户裁决：W25 改一次全量验证，授权无视收尾窗口
立即执行）：stage_original_source——original 件（.unitypackage）来源完整性校验
（对 resolvedSource.artifactSha256）＋解包 guid 布局到
.vua/imports/prodjob-<command_id>/＋manifest 自身摘要绑定（C# materialize 基座
消费面）。**W25 前置清单（用户裁决修正）**：核心 W20 实现切片＋本 Rust 物化
下刀（✅ 本轮交付）＋W22 实现切片（provider 记录面）——三者落地后由集成确认
开窗；验证内容一次完成（C# EditMode 全套件＋exclude_object VRCMetaObject
组件断言与构建对比＋合法素材冒烟路径端到端）。承担 #7 瞬败样本观察义务。
## 自基线交付
- **Rust 物化下刀**（production_job.rs 增补，本轮）：
  - `stage_original_source`：来源物 SHA-256 对 resolvedSource.artifactSha256
    校验（漂移＝类型化拒绝）→extract_package_into_dir 解包 guid 布局
    （.vua/imports/prodjob-<command_id>/，复用 material 线 v1 真机验证工具）→
    manifest 自身摘要绑定→StagedSource { sourcePackagePath, manifestSha256 }
    （C# install_modular_asset 的 materialize 消费面）；material_exec 的
    extract_package_into_dir/sha256_file 提权 pub(crate)（域内最小可见性）；
  - `build_job_command_json`／`build_restore_command_json`：冻结 v2 信封直组
    （schemaVersion 2＋operation＋payload 三件/快照身份）；实跑强制
    expectedProjectFingerprint（缺省＝类型化错误）；planSchemaVersion 组装层
    复验——核心 93f841c 信封批入树后按字段拷贝桥接 UnityCommand；
  - C# exclude_object 按 VRCMetaObject.excluded 主形态反射接线（用户预案：
    程序集名待 W25 真机确认；类型/成员缺失＝exclude_marker_unavailable 诚实
    失败）；
  - 测试：单元＋2（命令组装信封对齐/restore 快照身份）＋1（guid 布局包构造
    →staging→manifest 摘要→漂移拒绝），production_job 套件 **10/10**；
  - 证据：cargo test --workspace **390 通过 0 失败**＋clippy --all-targets
    零告警（2026-09-08 本机）；C# 待真机 EditMode 验证（W25，如实声明）。
- 此前批次：v2 冻结批（1a9cdf6，已验收）＋C# 第一刀（06802b9）＋Rust 前置件
  （8fcff01，已验收）＋C# 内核接线（aa2a9da，待验收）。
- 本轮合并 main（1632273 世代）追平。
- W1（I-1 真 Unity 矩阵）16/16 已验收合并（M3 关门）；amf-unity 1.0.1 批已合并。
## 阻塞
- 无产线侧阻塞。generated_vpm 副本的 C# 消费形态（「直接可用」的 prefab 定位
  规则）随核心细化后接线（声明见 011；当前 C# 统一走 materialize 消费面，
  vpm 副本先由 Rust 物化进目录）。
- W25 开窗等前置清单另两件：核心 W20 实现切片＋W22 实现切片（provider 记录
  面）。
## 下次合并意图
**W21 实现批**（v2 冻结批 1a9cdf6〔已验收〕＋C# 第一刀 06802b9＋Rust 前置件
8fcff01〔已验收〕＋C# 内核接线 aa2a9da＋本轮物化下刀与接线批）请集成验收
合并；Rust 全量 390/0＋clippy 零告警，C# 待真机验证（如实声明）。
## 留言
- [→集成] **W21 五批请验收**：1a9cdf6（已验收）＋06802b9＋8fcff01（已验收）＋
  aa2a9da＋e4183f4/本轮。Rust 全量 390/0＋clippy 零告警；C# 真机 EditMode
  验证随 W25 窗口（如实声明）。
- [→核心] exclude 形态（VRCMetaObject.excluded）已按钉死接线（反射，程序集名
  W25 实证）；信封扩展（93f841c/36b14ff）待集成验收入树后产线桥接 UnityCommand
  （组装件已按同形状直组，桥接为字段拷贝级）。generated_vpm 副本 C# 消费形态
  （prefab 定位规则）请随 W20 实现切片细化——当前仅 Rust 物化，C# 消费未接线。
- [→操作者→用户] W25 按裁决改**一次全量验证·等前置清单**：产线 Rust 物化下刀
  本轮交付；前置清单另两件（核心 W20 实现切片＋W22 实现切片）落地后由集成
  确认开窗；窗口内一次完成 C# EditMode 全套件＋exclude VRCMetaObject 组件
  断言与构建对比＋合法素材冒烟路径端到端。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案/冻结批/012 互审/executor prelude/信封扩展与 exclude 形态
  ——均已闭环。）
