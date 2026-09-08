# 013 项目管理命令面 wire 词表提案（M6 T-A 前置）

> proposal: 013
> title: 项目管理命令面 wire 词表（project.* 查询面草案与归属路由）
> status: 提出
> author: 环境/wt-6
> date: 2026-09-09

## 背景

- 用户裁决（2026-09-09，操作者派发）：M6 项目管理部分越过门序提前开工，T-A「通用
  `vrc-get` 项目与包管理路径」（环境负责、核心协作）授权执行；任务包明确「项目管理
  命令的 wire 词表是新协议面——先起草提案（路由核心裁决命令面归属与词表），提案前
  只做只读能力检测与 Rust 侧实现，不猜测 wire 形状」。
- 既有事实（本切片盘点，均在 main）：
  - `crates/project-manager` 的 `VrcGetLibBackend` 已实现核心 `VpmBackend` 端口的
    操作面（包清单/预览/应用/注册表/模板创建，双后端）；
  - `EnvironmentManagersSnapshotV01`（`schemas/environment-managers/v0.1`）已覆盖
    ALCOM/VCC 只读能力检测快照；
  - 本切片新增 `ProjectInspectionSnapshotV01`
    （`schemas/project-inspection/v0.1`）：对管理器注册路径的只读深检视（关联、
    Unity 版本分类、manifest dependencies/locked、VRChat SDK 检测、pending-mutation
    标记状态）；形状已钉死并有消费测试。
- 归属事实：`crates/project-manager` 为环境所有权域；provider-host 的命令路由为核心
  所有权域（catalog/warehouse 先例：域内组装、核心路由、跨域合并由集成验收）。

## 提案（裁决项，逐项待表态）

- **R1 命令面归属**：项目管理查询面的组装落在环境域（`project-manager` 或其薄适配），
  provider-host 路由与注册落在核心域——沿用 catalog 先例（数据组装、核心路由）。
  本提案只路由**查询面**；任何写命令（安装/移除/创建/副本导入）不入本提案。
- **R2 只读查询词表（草案 v0.1）**：
  - `project.listProjects` → `ProjectInspectionSnapshotV01` 的投影（或直接以快照为
    result 文档）：管理器注册项目的发现/识别清单；
  - `project.inspectProject`（params：`projectPath`）→ 单项目
    `ProjectInspectionV01` 投影：深检视（包清单声明面、SDK、锁标记状态）；
  - `project.environmentManagers` → `EnvironmentManagersSnapshotV01` 的 wire 化
    （已有 v0.1 schema，仅信封化）；
  - `project.lockStatus`（params：`projectPath`）→ pending-mutation 标记三态。
  词表遵循仓库惯例：命令蛇形、字段 camelCase、错误码 `vua.project.*` 蛇形 +
  i18n 键驼峰（与 catalog/warehouse 先例一致）。
- **R3 信封与版本**：result 文档带 `schemaVersion` 常量（如
  `vua.project-inspection/v0.1`），信封形状与既有 v0.2/v0.3 命令面先例一致；升版
  只加不改，同面不混版本。
- **R4 诚实空态与缺位**：无管理器注册=空数组（设计空态，协议明文）；`inspectProject`
  对未注册路径=类型化 `vua.project.project_not_found`；manifest 不可解析=空列表 +
  诊断（已在检视面钉死），永不虚构包条目。
- **R5 写命令面显式非目标**：安装/移除/创建/「导入为 VUA 管理的副本」（U3，1.2.0
  唯一写路径）各自需要独立提案（确认链、守卫、审计、恢复语义），本提案不含，也不以
  「实验」名义开放。
- **R6 裁决流程**：核心对 R1 归属与 R2 词表逐项表态 → 集成仲裁 → 词表以 schema+向量
  冻结（冻结前置=桌面接线）；裁决前本提案保持「提出」，环境不实现任何 wire 路由，
  只交付库级只读面（已交付）与本文档。

## 环境侧已交付（本切片，无 wire 面）

- `crates/project-manager/src/project_inspection.rs`：只读检视汇聚
  （`collect_project_inspections`），形状由
  `schemas/project-inspection/v0.1/snapshot.schema.json` 钉死，12 项消费测试
  （含 schema 校验、确定性、诚实缺位）全绿；
- ALCOM/VCC 只读检测沿用 `EnvironmentManagersSnapshotV01`（proposal 004 产物），
  兼容矩阵文档与目录条目见本切片 `docs/compatibility/alcom-vcc_*` 与
  `docs/tool-catalog/external/alcom-vcc.md`。

## 内联讨论线程

（待核心表态：R1 归属确认 + R2 词表逐项；待集成仲裁。裁决前词表不冻结、不接线。）
