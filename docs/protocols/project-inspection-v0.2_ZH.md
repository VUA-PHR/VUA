# VUA 项目检测读面契约 v0.2

[English](project-inspection-v0.2_EN.md) | [简体中文](project-inspection-v0.2_ZH.md)

> 文档版本：0.2
> 状态：**已冻结（2026-09-09）**——v0.1 冻结（集成随 014 验收宣布）＋ v0.2 增量
> 族升版（additive 一个字段；冻结时零消费者：provider 路由未实现、桌面 TS 面
> 未登记，声明在案 proposal 013 内联注记）。
> 机器可读词表：`schemas/project-inspection/v0.2/`（command / result /
> snapshot 三 Schema＋正例 8＋负例 2＋夹具 2）
> 范围：M6 T-A/T-B 读面——管理器登记路径的只读检测聚合（通用 `vrc-get`
> 项目路径＋ALCOM/VCC 能力检测兼容矩阵）。写路径在 project-ops 族
> （`project.import-copy`），读/写分线不混（proposal 013/014 仲裁）。
> 所有权边界：检测聚合实现＝`crates/project-manager`
> （`project_inspection` / `environment_managers` / `vua_identity`）；provider
> 路由归核心域；桌面 TS 面登记归桌面域。
> 更新：2026-09-09

## 方法面（四查询闭集）

| 方法 | 语义 | 参数 |
| --- | --- | --- |
| `project.listProjects` | 完整 `ProjectInspectionSnapshotV02`（发现＋逐项目检测聚合） | 无 |
| `project.inspectProject` | 单个登记路径的 `ProjectInspectionV02` | `projectPath` |
| `project.environmentManagers` | `EnvironmentManagersSnapshotV01`（ALCOM/VCC 管理器能力面，proposal 004 产物） | 无 |
| `project.lockStatus` | 单路径的 pending-mutation 标记三态（`none`/`leftover`/`unreadable`） | `projectPath` |

词表外方法名＝契约错误；全部查询只读——检测面永不写入、永不取锁、永不扫描
登记路径之外的文件系统。

## 快照语义（诚实规则）

- **只检测管理器登记的路径**（VCC `userProjects`/`localProjectFolders`、ALCOM
  `userProjects`）；多管理器登记同一路径时 associations 并集（可并列
  `vcc_registered`/`alcom_registered`）。
- **缺席是诚实的**：登记路径不存在时条目保留可见（`pathPresent: false`＋警告
  诊断），绝不静默丢弃；manifest 解析失败是警告发现，绝不虚构包清单。
- **确定性**：同一目录树快照逐字节确定（map 排序、按路径排序）；只有观察失败
  才产生诊断。
- Unity 版本分类与编辑器矩阵同策略（`production_target`＝2022.3.22f1）；
  VRChat SDK 按 `com.vrchat.*` 前缀报告为"见到"，`locked` 钉优先于
  `dependencies` 声明，不虚构产品语义。

## v0.2 增量：`vuaIdentity` 三态判定

每项目新增 `vuaIdentity`（tagged；用户裁决 2026-09-09 项 7/9/12 派生）：

| status | 语义 |
| --- | --- |
| `absent` | 无 `.vua/project.json`——非 VUA 原生项目 |
| `present` | VUA 原生声明；携 `markedAt`（RFC 3339 标记时刻）＋`note`（用户备注；裁决 12：**只在项目列表显示**） |
| `unreadable` | 文件存在但不可解析（或版本未知）——本身即证据，绝不静默报为 absent |

标识文件位于项目 `.vua/project.json`（与 `project.lock`、
`pending-mutation.json`、`source.json` 并列）。备注依附 VUA 原生声明：
无标识项目的备注写入被拒（`SetNoteError::NotVuaNative`）——语义边界随核心
路由批最终确认。`unreadable` 语义同样适用于检测面：损坏的标识文件是发现，
不是"非原生"。

## 信封

`result.schema.json` 只做信封强度约束：payload 按 operation 分支、由
`snapshot.schema.json`（v0.2）与 `schemas/environment-managers/v0.1/`（未随本族
升版）各自钉死——两份约束源永不漂移。

## 文档变更日志

- 0.2（2026-09-09）：`projectInspection` 增量字段 `vuaIdentity`（三态 tagged）；
  command/result 形状不变仅随族升版；向量夹具同步（用户裁决 7/9/12 派生，
  proposal 013 内联注记在案）。
- 0.1（2026-09-09）：初版冻结——四查询闭集＋8 正例＋2 负例＋消费测试
  （`crates/project-manager/tests/project_queries.rs`：正例过冻结 Schema、
  负例拒绝、读/写分线双向断言）。
