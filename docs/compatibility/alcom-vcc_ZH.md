# ALCOM/VCC 项目兼容矩阵

[English](alcom-vcc_EN.md) | [简体中文](alcom-vcc_ZH.md)

> 文档版本：1.2.0  
> 状态：已接受  
> 范围：ALCOM/VCC 管理项目的只读兼容检测与能力矩阵  
> 更新：2026-09-12  
> 权威：`docs/product-boundary_ZH.md` 1.2.0（用户裁决 U3，2026-09-08）

## 权威与硬边界

本矩阵是产品边界 1.2.0 的展开，不引入新语义。VUA 对 ALCOM/VCC 管理的原项目**只读**；
唯一写路径是用户显式选择的「导入为 VUA 管理的副本」（新项目路径＋新项目身份，明示磁盘
占用，不复制可再生目录与旧任务状态，导入后重新 Inspect，保留来源关系）。`1.0.x` 边界内
对原项目的写能力一律 false；未来开放仅经新用户裁决。

**允许**（本矩阵的检测项全部在此清单内）：

- 发现和识别 ALCOM/VCC 管理的项目；
- 读取版本、包、SDK、兼容性与环境状态；
- 生成诊断、计划和处理建议；
- 将写操作交接给对应管理器（呈现层引导，VUA 不代写）。

**禁止**：在原项目内安装/移除包；修改 manifest、项目配置、素材或 `.vua` 作业文件；写入
ALCOM/VCC 的注册表/数据库/设置/缓存；静默把原项目改标为 VUA 管理。

## 检测矩阵

| 检测项 | ALCOM | VCC | 方法（全部只读） | 结果呈现 |
| --- | --- | --- | --- | --- |
| 管理器在位 | 支持 | 支持 | 读已知设置路径（`%APPDATA%\alcom\setting.json`；`%LOCALAPPDATA%\VRChatCreatorCompanion\settings.json`，`%APPDATA%` 旧位置为后备） | found / not_found / read_failed，缺位是正常发现而非错误 |
| 项目发现 | `userProjects` | `userProjects`（新式）或 `localProjectFolders`（旧式） | 只读设置文件；绝不扫描用户目录 | 项目清单＝两管理器注册路径的并集 |
| 双管理器关联 | 支持 | 支持 | 同一路径被两管理器注册 → 一条发现携带两个关联 | 按管理器排序的去重关联列表 |
| Unity 版本与分类 | 支持 | 支持 | 读 `ProjectSettings/ProjectVersion.txt` | 完整版本字符串＋分类（生产目标 `2022.3.22f1` / 迁移源 `2019.4.31f1`、`2022.3.6f1` / 其他 / 团结），规则同 [Unity 编辑器兼容政策](unity-editor_ZH.md) |
| VPM 包（声明面） | 支持 | 支持 | 读 `Packages/vpm-manifest.json` 的 `dependencies` 与 `locked` 映射 | 按 packageId 排序的声明/锁定版本；解析失败＝诚实警告＋空列表，永不虚构条目 |
| VRChat SDK | 支持 | 支持 | 从上述映射中识别 `com.vrchat.*` 前缀包 | locked 优先于 dependencies；仅报告所见，不推断产品语义 |
| 未完成变更标记 | `.vua/pending-mutation.json` | 同 | 只读观察（读取即诚实呈现，绝不获取锁——获取锁是写） | none / leftover / unreadable |
| VUA 原生标识 | `.vua/project.json` | 同 | 只读观察（同上，绝不写入） | absent / present（标记时刻＋备注） / unreadable |
| 注册表死条目 | 支持 | 支持 | 注册路径不存在 | 条目保留并带警告（`path_present: false`），不静默丢弃 |

## 能力结论的诚实呈现

- 任一检测项失败只产生该项目的警告诊断，不影响其余发现；
- 设置文件存在但无法识别 schema（如缺 `userProjects`）＝在位但告警，不猜测字段；
- VUA 不声称与 ALCOM/VCC 拥有兼容的事务与恢复机制——双方理解 VPM 格式不等于可协调
  的写事务（1.2.0 rationale）；
- 写操作一律交接：界面呈现「去 ALCOM/VCC 操作」或「导入为 VUA 管理的副本」，VUA 不
  代写原项目。

## 来源判定原理与能力边界（1.2.0 新增）

本节是用户走查反馈 B5①（「说明当前如何判断项目和包的真实来源」）的正式回应：
如实说明 VUA 的来源判定依据，并钉死其能力边界——**VUA 不能断言项目或包的真实
出处**。该边界是检测面的固有属性，不是待补的缺陷。

### 项目来源（管理器归属）

- 判定依据只有一处：两个管理器各自设置文件中的注册表（ALCOM `setting.json` 的
  `userProjects`；VCC `settings.json` 的 `userProjects`／`localProjectFolders`）。
  VUA 报告「由 X 管理」的准确含义是「X 的设置文件当前注册了该路径」——这是注册
  事实，不是对管理事实的断言。
- 已知边界：注册表可能过时（路径已不存在的死条目以 `path_present: false` 保留并
  告警）；未在任何管理器注册的路径（如用户手工放置的项目）VUA 不会发现，也绝不
  扫描用户目录去猜测。

### 包来源（声明面）

- VPM 包信息来自 `Packages/vpm-manifest.json` 的 `dependencies`／`locked` 映射，
  即兼容矩阵与项目检视呈现的是「项目清单声明了什么」。
- 能力边界：**VPM 声明不携带获取渠道**——来自官方仓库、社区仓库、本地文件安装与
  手工复制在 manifest 中不可区分。因此 VUA 不能、也不声称能断言任何包的真实出处。
  用户观察「目前线索不能断言项目出处」与此一致：这是只读声明面检测的固有边界。

### 呈现纪律

- 来源相关的用户可见表述使用不确定性语义（「此项目看起来由其它软件管理」「接管
  它可能产生未知后果」），不使用断言语义。具体文案归桌面呈现域（BOARD B5②），
  其事实依据即本节；
- 检测面只报告所见；缺失、失败与不可解析均以类型化状态如实呈现，永不虚构断言。

## VUA 原生项目判定（1.1.0 新增）

用户裁决（2026-09-09 项 7/9/12）：迁移/导入副本的文件夹携带 VUA 独有标识文件
`.vua/project.json`，检测面据此报告 `vuaIdentity` 三态：

- `absent`——无标识文件：非 VUA 原生项目（仅有锁人工制品的 `.vua/` 不构成原生
  标记）；
- `present`——VUA 原生声明，携 `markedAt`（RFC 3339）＋`note`（用户备注；
  **只在项目列表显示**）；
- `unreadable`——文件存在但不可解析：本身即证据，绝不静默报为 absent。

备注依附 VUA 原生声明：无标识项目的备注写入被拒（`SetNoteError::NotVuaNative`）。
标识文件的写入面＝project-ops 写命令（`project.import-copy` apply 落成点首标记）
与未来迁移命令；检测面永不写入。

## 机器可读面

- 检测快照：`EnvironmentManagersSnapshotV01`
  （`schemas/environment-managers/v0.1/snapshot.schema.json`）；
- 项目检视：`ProjectInspectionSnapshotV02`
  （`schemas/project-inspection/v0.2/snapshot.schema.json`，本矩阵的包/SDK/锁行
  ＋VUA 原生标识行；协议本
  [project-inspection-v0.2](../protocols/project-inspection-v0.2_ZH.md)）；
- 命令面 wire 词表：project-inspection v0.2（四查询读面）＋project-ops v0.1
  （`project.import-copy`）均已冻结并接线
  （[project-ops-v0.1](../protocols/project-ops-v0.1_ZH.md)）。

## 文档变更日志

- 1.2.0（2026-09-12）：新增「来源判定原理与能力边界」节（BOARD B5① 正式回应：
  项目来源＝管理器注册表事实、包来源＝VPM 声明面；钉死「不能断言真实出处」的
  能力边界与不确定性呈现纪律；B5② 文案的事实依据）。
- 1.1.0（2026-09-10）：新增「VUA 原生项目判定」节（`.vua/project.json` 三态；
  用户裁决 7/9/12）＋检测矩阵 VUA 原生标识行；机器可读面刷新（project-inspection
  v0.2、013/014 已冻结接线、协议本链接）。
- 1.0.0（2026-09-09）：初版。
