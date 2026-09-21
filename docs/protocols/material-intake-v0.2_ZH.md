# AMF 素材入口协议 v0.2

[English](material-intake-v0.2_EN.md) | [简体中文](material-intake-v0.2_ZH.md)

> 文档版本：0.2.1
> 状态：已冻结（B3 基线 v0.2 供给步骤增补，2026-09-21 第 141 批；W25 真机发现修复；0.2.1 供给依赖解析注记，2026-09-21 第 146 批；0.2.1 失败词面分流＋Packages/ 通道边界注记，2026-09-21 第 150 批；0.2.1 C# 休眠面地位注记，2026-09-22 第 158 批）
> 范围：`.unitypackage` 直接导入与 `local-reusable` VPM 制作/安装
> 更新：2026-09-22
> 前版：[v0.1](material-intake-v0.1_ZH.md)（2026-09-05，历史保留）

v0.2 相对 v0.1 的唯一词面变化：计划步骤种类闭集新增 `provision_project`
（计划 Schema 升版 `schemas/amf-production/v0.2/material-plan.schema.json`，
`plan.schemaVersion = "0.2"`）。检查（source）词面保持 v0.1 不变；Build Record
中的 source 嵌入因此不受影响。

v0.2.1（第 146 批，用户裁决"先做好 SDK 的导入再真机验收"）：仅补注记——供给步骤的
执行语义扩为"创建＋解析并下载工程声明的 SDK 依赖（网络操作）"；计划 Schema 步骤枚举
闭集不变（仍是 `provision_project` 一个 kind），wire/provider-host 面零变化，
`resolve_project` 是供给内部步骤、不经桌面网关暴露。

v0.2.1（第 150 批，桌面座 148 批实证＋操作者对 `Packages/` 盲点的裁定）：两笔仅注记，
信封与字段闭集零触碰——
(1) **失败词面按类别分流**：任务层失败事件的 `messageKey` 不再恒为
`errors.material.executionFailed`——供给段失败（`run_provision` 的 create/resolve 臂及其
包装臂，码一律以 `vua.material.provision_failed` 为前缀）改发桌面词表预留的
`errors.material.provisionFailed`；其余（桥接/快照/回滚/收据/检查）维持
`executionFailed`。差异化事实仍由 `code` 携带（桌面按 148 批并呈律同显词面与原码）。
(2) **`Packages/` 通道边界（操作者裁定：素材直导通道不得静默写入 `Packages/`）**：
`Packages/` 是 vpm-manifest 追踪的 VPM 通道领地，绕过其追踪的写入违背单通道写模型。
含 `Packages/` 条目的归档在两道既有闸口被整体拒绝、零新码：检查面
（inspect）即按 `vua.material.archive_invalid` 如实阻断（计划与确认因此不会形成）；
执行面解包臂（三处物化消费点共用）在落盘前的第一遍即整体拒绝（零残留、零部分物化），
同族上浮。计划后混入此类包的来源在执行前重检时同样按 `archive_invalid` 诚实拒绝
（先于快照与首笔变更）。计划时只含 `Assets/` 条目的归档行为零变化。

v0.2.1（第 158 批，操作者对 #45「C# dormant 收窄」的裁决，采纳环境座第 154 批
权衡稿）：仅注记；零行为变化、零 C# 触碰。(1) **C# 物化面的 `Packages/` 接受
子句系链上不可达休眠面**：C# 操作（`BridgeCommandProcessor.MaterializeExtractedPackage`
的条目跳过条件对 `Assets/` 与 `Packages/` 双前缀都接受）在 Bridge v4 单增冻结
纪律下刻意不动——其代码面从来不是 Assets/-only，该子句也不是素材直导通道写
`Packages/` 的许可。第 150 批注记的两道既有 Rust 闸口在场时（检查面预检令
计划与确认根本不形成＋执行面解包臂三物化消费点共用的落盘前第一遍整体拒绝），
任何链路都无法把 `Packages/` 条目送达 C# 操作；暂存目录的生产者恰为解包臂
自身，无旁路馈给 C# 面。(2) **守卫句——约束性移除顺序**：在 C# 面自身收窄
到位之前，不得移除或削弱任一闸口；先移闸口会静默重开绕过 vpm-manifest 的
写路径，且钉住解包臂的仓内测试正是「休眠为真」的被检验事实——不收窄 C# 面
而先删该钉或任一闸口属被禁止的顺序。(3) **勘误**：第 150 批时代 Rust 注记
词面「C# 物化面的 `Assets/`-only 校验期望」随本批就地校准——第 150 批终结
的是分歧**经链物化**，不是 C# 面字母收窄。C# 拒收垂直切片（A 案：C# 拒收＋
UTF 测试＋本注记，一切片）仍排 W25 真机窗口序列（BOARD #45），届时仓内
EditMode 套件可真跑；本注记正是该切片无论如何需要的底座。

## 批次与名称

用户选择一个素材文件夹。该文件夹的名称成为用户可见包名；同名依次显示为 `名称 (2)`、
`名称 (3)`。合法 VPM 机器 ID 由 VUA 按本地来源身份生成并持久化，用户无需理解或填写。

文件夹下所有 `.unitypackage`（包括子目录）自动进入同一批次，按规范化相对路径排序。Inspect 保存
每个来源包的相对路径、大小、SHA-256 和归档内素材路径，并对整体来源与可执行风险清单分别计算摘要。
执行前重算；新增、删除、替换任一包或风险清单变化都返回 `vua.material.source_drift`。

## 风险决议

扫描 C#、托管程序集、原生插件、`Editor` 内容和可能的构建入口。整个批次只提示一次：创建完整项目
保护点并继续、无视风险继续（可仅在当前会话记住）或取消。第二项跳过额外完整保护点，但 B3 修改
任务仍强制保存 `Assets`、`Packages`、`ProjectSettings` 和 VPM 清单的最小恢复快照；第一项另纳入
`UserSettings`。决议绑定来源摘要和风险摘要；会话记忆不写入持久配置。VUA 不声称项目快照能阻止
代码执行或撤销项目外副作用。

## 依赖声明

来源文件夹可携带一个可选的 `vua-dependencies.json`——JSON 对象，键为包机器 ID，值为版本区间，
如 `{ "com.vrchat.avatars": "3.10.x" }`。声明由用户/Recipe 整理写入，**从不自动探测**：Inspect
读入后随来源指纹一起摘要（计划后编辑声明文件按 `vua.material.source_drift` 拒绝）；`local-reusable`
制作本地包时声明逐字进入 `package.json` 的 `dependencies`，再由 `vrc-get` 在目标项目解析安装。
文件缺失即"无声明"；文件存在但不可解析按 `vua.material.deps_invalid` 报错，绝不静默置空。

## 双入口

- `direct_unity_package`：验证目标项目快照后，按计划顺序由版本化 Bridge 导入全部来源包；
- `local_reusable_vpm`：在带一次性令牌的隔离暂存项目导入全部来源包，生成 Editor/Runtime 布局和
  显式依赖清单，再由 VUA `vrc-get` 适配器预览、安装到目标项目并独立验证。

## 工程供给（v0.2 增补）

目标工程不存在 `ProjectSettings/ProjectVersion.txt` 时，计划插入 `provision_project` 步骤——
与配方链（assembly 计划）同一条件化与诚实模型：

- **条件化**：已供给工程的计划与 v0.1 完全相同（零词面变化）；条件的有无本身是计划内容，
  因此计划哈希不同（assembly 计划条件化先例）。
- **确认后执行**：供给步骤经计划审阅由用户确认后才执行，绝不静默创建工程。
- **步骤序**：供给位于恢复快照之后、首个工程变更（导入/安装）之前。快照先于一切变更。
- **执行路由**：工程创建走既有 VPM 后端端口 `VpmBackend::create_project`（E-VPM-DUAL：
  vrc-get 库模板拷贝，或 VCC `vpm new`）。vrc-get CLI 没有创建命令（provision.rs Fix 4），
  不新增 CLI 依赖。执行器在执行时重查条件（assembly 执行臂同款幂等防护）：计划审阅与执行
  之间工程若已出现，创建跳过，计划时指纹链照旧。
- **依赖解析（v0.2.1 增补，第 146 批）**：创建模板只在 `Packages/vpm-manifest.json` **声明**
  SDK 依赖（`com.vrchat.base` / `com.vrchat.avatars`），纯模板拷贝不携带包体。创建成功后、
  基线指纹重取之前，执行器经后端端口 `VpmBackend::resolve_project` 解析工程声明的依赖——
  从**启用**仓库解析（禁用集语义与 F4 collection-world 一致）并落包进 `Packages/`、回写
  locked 段。这是**网络操作**，声明词面如实含"解析并下载工程声明的 SDK 依赖"；仅新建路径
  调用（已供给工程跳过创建与解析，维持幂等重检现状）；幂等（locked 已满足→`already_satisfied`）。
  后端无此能力面时（VCC CLI 如实 declared-none）缺席臂按 `capability_missing` 家族如实拒绝，
  绝不假装解析成功。解析收据（`vua.vpm-resolve-receipt/v0.1`：resolved／already_satisfied／
  failed）是供给内部步骤的事实面，不经桌面网关暴露。操作者裁决两笔随验收落账（第 147 批）：
  (a) 依赖不可满足时收据如实逐条呈现——Ok 携非空 `failed` 集，**非整次 Err**（素材执行器已把
  非空 `failed` 聚合为 `provision_failed`，用户结局两案相同而收据信息更丰富）；
  (b) `failed` 条目的 `reason_code` 复用 `no_matching_package`（源在而版本不合）——零新码。
- **指纹基线重取**：新建工程的状态不是计划时状态。供给成功后执行器以只读 Inspect 重读
  Unity 侧基线指纹（与暂存链的 inspect-first 同一纪律），后续变更命令绑定该基线——绝不把
  计划时的工程树摘要带进新工程的指纹链。重取固定在依赖解析**之后**：基线覆盖落包后的
  最终态，绝不含解析前的中间态。
- **补偿**：供给失败时回滚供给前快照。对未供给目标，快照即空态：恢复把半初始化创建的内容
  移入恢复隔离区（`.vua/recovery/`），等效于 assembly 的"删除半初始化项目后重新计划"语义。
- **错误面**：供给失败按 `vua.material.provision_failed` 上报（`vua.material.*` 家族规则），
  后端原码与原因随消息携带（依赖解析失败同臂：收据 `failed` 集非空时携首个依赖的原码与
  id，复用码零新立）；失败照常发布 Build Record，绝不绕过收据。任务层失败事件的词面键
  按第 150 批注记分流：供给段命中 `errors.material.provisionFailed`，其余维持
  `executionFailed`。

## 工作流阶段映射

| B 步骤种类（`MaterialIntakeStepKind`） | 工作流阶段 |
| --- | --- |
| `verify_source` | `inspect` |
| `create_snapshot` | `snapshot` |
| `provision_project` | `execute` |
| `import_unity_packages` | `execute` |
| `create_local_vpm_package` | `execute` |
| `preview_vpm_install` | `execute` |
| `apply_vpm_install` | `execute` |
| `validate_minimum_structure` | `validate` |
| `write_build_record` | `completed` |

桌面消费说明：桌面当前按 AMF 大阶段轨道（仓库/Recipe/装配/检查/发布）呈现，不逐条渲染
计划步骤种类；供给步骤在桌面计划审阅面的呈现属桌面消费切片，不在本词面批内。

## 暂存项目契约

隔离暂存项目由 VUA 捆绑模板构建——两个文本文件、一个空的 `Assets/` 文件夹，加内嵌的
**Bridge 脚手架**（`com.ph-r.vua` 包与 `nadena.dev.modular-avatar.core` 编译 stub，均为
VUA 自有代码，随客户端编译期内嵌；无 Bridge 的暂存项目无法执行任何 Bridge 命令）：

- `ProjectSettings/ProjectVersion.txt`：写入基线锁定的 Unity 版本（`2022.3.22f1`）；
- `Packages/manifest.json`：固定的 VPM 依赖锁（如 `com.vrchat.avatars` / `com.vrchat.base`
  `3.10.11`、`com.unity.textmeshpro` `3.0.6`）加 `VRChat` scoped registry
  （`https://packages.vrchat.com`）。

模板版本号在 orchestrator 内定义为常量；VRChat SDK 强制废弃旧版时，随小版本客户端更新这两个
文本文件即可。运行时客户端把模板解压到暂存目录，调用 `vrc-get` lib 后端解析并安装 manifest
依赖（首次解析需要联网；后续运行由 vrc-get 包缓存服务）。暂存项目随即拥有与 VCC 官方一致的
SDK 基底，用户机器无需预装任何东西。

运行规则：

- 暂存目录位于 `%TEMP%\VUA_Staging_{session_id}`——绝不放在 Downloads、Desktop 等用户可见
  目录，实时杀软扫描会在那里产生文件锁；
- 暂存项目只服务于"制作本地 VPM 包"这一项原子任务：打包完成后，生成的 `.vpm` 文件立即移入
  用户指定的 local-reusable 目录，随即销毁暂存项目（`remove_dir_all`）——成功、失败、panic
  路径一律执行；残留的暂存项目会通过路径冲突和文件锁毒化后续任务。

两条路径都只以 `validate_asset_paths` 证明 `minimum_structure`。素材能由 AssetDatabase 加载不代表
Avatar、衣装、材质、动画或 Modular Avatar 语义正确。

计划遵循 `schemas/amf-production/v0.2/material-plan.schema.json`；不可变结果遵循
`schemas/amf-production/v0.1/build-record.schema.json`。Bridge 修改完成回执绑定 `commandId` 与
命令摘要；回执前中断必须先 Inspect，不得自动重放未知副作用。

## 正负例向量

`schemas/amf-production/v0.2/vectors/material-plan/`：未供给目标计划（含 `provision_project`
且位于快照之后、导入之前）、已供给目标计划（v0.1 步骤集不变）两正例，外加未知步骤种类一负例
（闭集拒绝）。消费测试在 `crates/unity-bridge/tests/material_intake.rs`。
