# VUA 系统架构

[English](system_EN.md) | [简体中文](system_ZH.md)

> 文档版本：1.0.1
> 状态：已接受
> 权威语言：简体中文（EN 为镜像，同步至 1.0.1）
> 范围：VUA 全系统
> 最近符合性复核：2026-09-06
> 规范效力：有

## 架构形态

VUA 是一个本地优先的桌面应用，采用单一 monorepo。小型 Node.js Kernel 负责 Electron 启动、
安全强制、Gateway 与 Orchestrator Provider 生命周期；本地 React UI 是受控表现层。可信产品行为
直接编译并连接到所属应用层，不引入通用模块注册、依赖图或运行时组合框架。社区扩展通过未来的
Plugin 能力边界工作，External 集成使用经审查的公开接口。

## 组件边界

```text
Electron Renderer（本地 React UI）
        ↓ 受限 contextBridge
Electron Main / Preload
        └─ Kernel（启动、安全、Gateway、Provider 托管、诊断）
        ↓ 版本化应用 Gateway
Rust Orchestrator Provider（托管方式可替换；应用用例、持久任务与端口）
        ├─ AMF 应用服务
        │      ├─ BDL
        │      ├─ 素材获取端口
        │      └─ Unity Bridge 作业
        ├─ 内置项目/环境/未来运行时适配器
        ├─ 能力强制的社区插件宿主
        └─ Overlay 服务
```

Kernel 拥有启动、Gateway、Provider 生命周期和桌面安全强制，不拥有通用业务模块系统。产品业务
规则位于应用层与领域层。Orchestrator 是可恢复业务流程的状态权威；AMF 拥有 Avatar 生产用例并
独占 BDL；Unity Bridge 执行已批准的 Unity 操作。

## 代码结构实态（2026-09-06 复核）

Cargo workspace 当前只有一个成员：`crates/orchestrator`（约 26.8k 行 Rust）。全部 Orchestrator
模块以 `mod` 形式挂在 `src/lib.rs` 下；此前的六个空占位 crate 目录已删除（2026-09-06），
结构不再虚构多 crate 形态。模块按域分组如下：

- **应用核心与运行时**：`runtime`、`workflow`、`model`、`contracts`（应用契约类型与错误）、
  `capability`、`time`；
- **持久与恢复**：`sqlite_task_store`（权威任务状态）、`journal`、`state_file`（过渡格式）、
  `filesystem`（项目/快照存储）；
- **Provider 进程边界**：`provider_host`、`process`、`provider_job`（Windows Job Object），
  以及受监督 Provider 二进制 `src/bin/vua-orchestrator-provider.rs`；
- **AMF 生产**：`recipe/`（model/read_model/share/validate）、`assembly`、`build_record`、
  `production_documents`、`editor_targets`、`project_identity`、`project_lock`、`provision`、
  `staging_scaffold`；
- **素材与 Unity Bridge**：`bridge`、`material_intake`、`material_exec`、`material_staging`、
  `material_identity`、`material_task`、`local_vpm_artifact`、`artifact_inspection`；
- **素材获取与 BDL**：`download_events`、`booth_extraction`、`warehouse_import`、
  `warehouse_maintenance`、`bdl_store`、`bdl_queries`；
- **项目与环境**：`vpm`、`vpm_backend`、`environment`、`win_registry`、
  `tools`。（`environment_managers` 自 2026-09-07 起迁至 `project-manager`，见下。）

"BDL 是 AMF 私有模块"自 2026-09-06 拆分落地起由 `bdl-store` crate 提供结构强制（此前由调用
纪律维持）。

## Provider 进程边界

已接受的托管决议是**受监督独立进程 Provider**（ADR 见
[Orchestrator 受监督独立进程托管](../decisions/orchestrator-supervised-provider_ZH.md)）：

- Provider 以独立二进制 `vua-orchestrator-provider` 运行，由 Electron Main 内的 Kernel 启动、
  监督与关闭；
- 进程间通信使用版本化帧协议（[受监督 Provider 进程协议 v0.1](../protocols/provider-process-v0.1_ZH.md)），
  含握手、版本协商、单实例锁与显式关闭语义；
- Windows 子进程树纳入 Job Object 遏制（`provider_job`），Provider 崩溃不带走桌面进程；
- 任务权威状态在 SQLite（[任务存储格式 v0.1](../protocols/task-store-v0.1_ZH.md)），Provider
  重启后从持久状态恢复，非终态任务以 `inspect_required` 等待人工处置；
- Provider 替换只能发生在空闲关闭边界；进程内原生 Provider 与受监督进程 Provider 实现同一
  版本化应用契约，托管方式可替换不是产品不变量。

## crate 布局（2026-09-06 拆分落地）

拆分已按用户裁决执行完成（slice/crate-split，合并 `a261393`；每 crate 一次纯机械移动提交，
源文件与测试同搬、行为不变，全量测试与 Clippy 绿）：

| crate | 内容 | 说明 |
| --- | --- | --- |
| `orchestrator`（核心） | 任务运行时、取消/恢复、用例、域端口、应用契约类型、`material_types` 叶类型、`vpm_backend` 端口 trait | 单一应用核心 |
| `bdl-store` | `bdl_store`、`bdl_queries`、`download_events`、BDL SQLite schema/迁移消费 | "AMF 私有"自此有结构强制 |
| `unity-bridge` | `bridge`、`material_intake`/`material_exec`/`material_staging`/`material_task`、`staging_scaffold`、`local_vpm_artifact`、`production_documents` | 与 C# 包、Bridge schema 同生命周期 |
| `provider-host` | `provider_host`、`process`、`provider_job` + `vua-orchestrator-provider` 二进制；warehouse 三命令服务登记（`WarehouseConfig`/`run_provider_host_with_services`，proposal 005） | 独立进程边界；组合根 |
| `acquisition` | `warehouse_import`、`warehouse_maintenance`、`artifact_inspection` | 下载/仓储域 |
| `project-manager` | `vpm_backend` 实现、`project_lock`、`environment_managers`（经核心 `VccSettingsReader` 端口消费，proposal 004 选项 3，2026-09-07 落地） | 外部工具适配；环境管理器 |

依赖方向：域类型与端口留在核心，适配器 crate 依赖核心，provider-host 作为组合根依赖全部；
crate 间无环由 cargo 强制。`environment_managers` 曾因与核心 environment 引擎深耦合暂留核心
（proposal 004），2026-09-07 按选项 3 迁入 `project-manager`：端口契约类型（`VccSettingsReader`/
`VccCapability`/`ManagerDiagnostic`/`FindingSeverity`/诊断码）留在核心作为冻结 schema 的 Rust
面，端口签名带 candidates 参数、引擎保留注入点；VCC settings 解析顺序不变式单处归于核心
`EnvironmentRoots::default()`，wire 面零变化。新模块直接落进所属 crate，不得喂大核心。

## 协作与工作树

协作基材在版本控制内、位于仓库根 `collab/`（机制见 `collab/README.md`）：

- `collab/BOARD.md`：全局看板（M 门状态、冻结契约表、跨树开放问题），由集成树在门/合并后
  更新；
- `collab/state/wt-N.md`：每棵活跃工作树一份覆盖式状态文件；
- `collab/proposals/`：契约变更与跨树需求的单文件提案（讨论线程内联）。

工作树数字化编号、不受角色内容限制：`VUA` 主库常驻集成分支 `main`（含 `.git` 主库，不可
移动）；链接工作树命名 `VUA-2`、`VUA-3`、…，按需增减。工作按垂直切片在 `slice/<slug>` 分支
进行（寿命 ≤3 天、落后 main ≤15 提交）；Schema 与契约只经 git 合并对齐，禁止手工拷贝。
开工前运行 `pnpm collab:brief` 读取指向本树/本角色的阻塞与留言。协调结论只认 `collab/`，
`docs/plans/` 是本地草稿区。

## 依赖方向

```text
View
  → Presentation model
  → typed Gateway
  → application use case
  → domain rule / outbound port
  ← adapter implementation
```

| 层 | 拥有 | 委托途径 |
| --- | --- | --- |
| View | 组件、布局、可访问性、输入绑定 | Presentation model 与类型化 Gateway |
| Presentation | 页面状态、导航、展示校验、意图映射 | Gateway 命令、查询与任务 |
| Kernel/Gateway | 启动、Provider 生命周期、安全强制、类型化命令、查询、事件与能力快照 | 应用用例 |
| Application | 用例、工作流、批准、恢复和协调 | 领域规则与端口 |
| Domain | Recipe、计划、状态转换和不变量 | 抽象端口 |
| Ports | 应用所需能力 | Adapter 实现 |
| Adapters | Electron、SQLite、文件、进程、Unity 和第三方接口 | 所属应用与领域契约 |

框架和供应商类型停留在适配器中。跨模块传输使用版本化 DTO；View 接收表现安全的值，数据库行、
Electron 对象、Orchestrator 私有类型和 Unity 内部对象由各自所有者持有。

## 交互模型

- **Command** 表达可能改变状态的意图；
- **Query** 返回带 revision 的只读快照；
- **Event** 报告事务提交后已经发生的事实；
- **Task/Channel** 承载可取消的长任务进度，不把组件生命周期当作任务生命周期；
- **Capability** 说明当前机器、上游版本和授权条件下真实可用的能力。

默认修改流程为：

```text
Inspect → Plan → Confirm → Snapshot → Execute → Validate
                                      ↘ Recover / Manual handoff
```

检查和计划阶段只读；特权修改具有稳定 ID、幂等边界、过期输入检查和可恢复记录。Command 承载
意图，Event 通过类型化通道报告已提交事实。

## 数据所有权

- Orchestrator 持久层保存任务、Recipe、Build Record、项目和适配器执行状态；
- BDL 保存 AMF 所属的商品、协议、兼容关系、来源、搜索和 Warehouse 映射状态；物理上可以与
  其他本地数据共用 SQLite，但表与写入权限仍由 BDL 独占；
- 文件系统保存用户合法取得的素材、Unity 项目、快照和不可变作业文件；
- 远程网页 Session、Cookie、订单和下载凭据由 Electron 的隔离 Session 管理，只留在本机；
- Unity 项目内 `.vua` 作业目录保存版本化请求、结果和必要进度证据；
- Core 目录条目是直接随 VUA 构建的可信产品行为，并使用所属 Orchestrator 用例和端口；
- 社区插件完全通过隔离插件宿主中获批的版本化能力工作。

具体表结构、Wire format 与保留策略必须在对应版本化协议中定义。

## 失败与降级

- 离线模式保留本地素材、Recipe、项目恢复与 Unity 工作流；
- 第三方工具缺失或版本不兼容时，适配器返回能力缺失并保留手动路径；
- Orchestrator 已接受的任务在浏览器、Overlay 或 UI 重载后继续运行；
- 未知协议版本进入只读检查或人工模式；
- 诊断导出默认隐藏账户、主目录、令牌、Cookie 和付费素材文件名。

## 文档变更日志

- 1.0.0（2026-09-06）：纳入版本管理并按实态重写。新增代码结构实态（单 crate 模块清单）、
  Provider 进程边界、目标 crate 布局（已接受拆分决策）、协作与工作树编号四节；空占位 crate
  目录删除后的结构虚构表述移除；既有组件边界、依赖方向、交互模型、数据所有权与失败降级节
  保留。
