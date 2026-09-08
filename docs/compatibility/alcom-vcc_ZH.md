# ALCOM/VCC 项目兼容矩阵

[English](alcom-vcc_EN.md) | [简体中文](alcom-vcc_ZH.md)

> 文档版本：1.0.0  
> 状态：已接受  
> 范围：ALCOM/VCC 管理项目的只读兼容检测与能力矩阵  
> 更新：2026-09-09  
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
| 注册表死条目 | 支持 | 支持 | 注册路径不存在 | 条目保留并带警告（`path_present: false`），不静默丢弃 |

## 能力结论的诚实呈现

- 任一检测项失败只产生该项目的警告诊断，不影响其余发现；
- 设置文件存在但无法识别 schema（如缺 `userProjects`）＝在位但告警，不猜测字段；
- VUA 不声称与 ALCOM/VCC 拥有兼容的事务与恢复机制——双方理解 VPM 格式不等于可协调
  的写事务（1.2.0 rationale）；
- 写操作一律交接：界面呈现「去 ALCOM/VCC 操作」或「导入为 VUA 管理的副本」，VUA 不
  代写原项目。

## 机器可读面

- 检测快照：`EnvironmentManagersSnapshotV01`
  （`schemas/environment-managers/v0.1/snapshot.schema.json`）；
- 项目检视：`ProjectInspectionSnapshotV01`
  （`schemas/project-inspection/v0.1/snapshot.schema.json`，本矩阵的包/SDK/锁行）；
- 命令面 wire 词表：见 `collab/proposals/013`（待核心裁决，裁决前不冻结不接线）。
