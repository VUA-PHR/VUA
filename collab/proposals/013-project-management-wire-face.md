# 013 项目管理命令面 wire 词表提案（M6 T-A 前置）

> proposal: 013
> title: 项目管理命令面 wire 词表（project.* 查询面草案与归属路由）
> status: 词表已冻结（集成宣布 2026-09-09，随 014 验收；冻结件由环境补齐）
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

### 冻结落账（环境，2026-09-09）

集成随 014 验收宣布本词表冻结（接线批解锁，桌面已知会）。冻结件由环境补齐入树：

- `schemas/project-inspection/v0.1/command.schema.json`：四查询闭集
  （project.listProjects / project.inspectProject / project.environmentManagers /
  project.lockStatus）；inspectProject 与 lockStatus 收 `projectPath` 参数；
- `schemas/project-inspection/v0.1/result.schema.json`：结果信封（payload 按
  operation 分支，形状由 snapshot.schema.json 与 environment-managers
  snapshot.schema.json 钉死，信封只做引用强度约束——防两份 payload 约束漂移）；
- 正例向量 8 件（四查询 request/result 对）＋负例 2 件；消费测试
  `tests/project_queries.rs` 4 项（正例过冻结 Schema、负例拒绝、**读/写分线**——
  project.import-copy 被读面词表拒绝、读面请求被 project-ops 词表拒绝）；
- provider 侧路由实现归核心域（本词表只冻结形状）；错误码
  `vua.project.project_not_found` 等应用面码随路由批由核心定形。

### 登记补录（环境，2026-09-09）

应集成两次提示，docs/REGISTRY.md 补 schemas/project-inspection v0.1 与
schemas/project-ops v0.1 两行（维护方=环境）。

（词表已冻结；provider 路由归核心；桌面接线批已解锁。）

### v0.2 升版（环境，2026-09-09 深夜——用户裁决 7/12 派生切片）

用户 13 项裁决（BOARD #17/#18 销账）要求检测面增加「VUA 原生项目」判定与备注
元数据。本族所有权归环境（T-A），核心/桌面尚无 v0.1 消费者（provider 路由未
实现、TS 面未登记），升版零破坏面。变更＝**纯增量一个字段**：

- `schemas/project-inspection/v0.2/`：`projectInspection` 增加 `vuaIdentity`
  （tagged 三态：`absent`＝无 `.vua/project.json` 非 VUA 原生；`present`
  携 `markedAt`＋`note`＝VUA 原生＋备注〔裁决 12：只在列表显示〕；
  `unreadable`＝存在不可解析——证据永不假报缺席）；command/result 形状不变
  仅随族升版；向量/夹具同步；
- 实现：`crates/project-manager` 新模块 `vua_identity`（读三态＋mark＋set_note
  原语；**无标识项目拒设备注**——备注依附 VUA 原生声明，语义边界待路由批
  核心确认）；检测面 `vuaIdentity` 填充＋schema 校验测试；
- **待核心路由批表态**：① v0.2 消费确认（provider 路由直接钉 v0.2）；
  ② 备注写命令（project-ops 词表升版）是否立项与语义（NotVuaNative 拒绝码）；
- v0.1 冻结件原样保留（已被 v0.2 取代，无消费者）。

（桌面列表呈现消费点：T-B 读面接线时 `vuaIdentity.status`＋`note` 即列表
「VUA 原生」徽标与备注列的数据面。）
