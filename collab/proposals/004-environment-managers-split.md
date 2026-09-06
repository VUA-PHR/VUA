# 004 environment_managers 拆分 deferred 决策

> status: 讨论中
> 提出：集成树（crate 拆分执行代理报告，2026-09-06）

## 背景

crate 拆分（合并 `a261393`）中 `environment_managers` 未随 vua-project-manager 拆出。原因：该模块
与核心 `environment.rs` 的 check_vcc 深度耦合——核心 env 引擎经模块路径调用其
`read_vcc_settings`（VCC 能力端口，文档明言对 env 引擎公开），而该读取器与快照收集端共享私有
助手（`string_array`/`top_level_keys`）、诊断词表（ManagerDiagnostic/FindingSeverity/codes）与
`VccCapability`。整模块出走会使核心 env 依赖 project-manager，而 project-manager 依赖核心
（editor_targets/time）——构成环。按端口拆分则须把私有助手公开到核心根导出，或跨 crate 复制
约 50 行读取逻辑；两者都违背拆分批次"纯移动、零行为变化"的纪律，故 deferred 并单独登记。

## 选项

1. 复制共享助手（约 50 行）到两侧，`environment_managers` 整模块出走；
2. 核心公开 JSON 助手（`string_array`/`top_level_keys` 入根导出），模块出走；
3. 将 check_vcc 能力检测整体移入 project-manager，核心 env 引擎改为经端口调用（结构性最强，
   涉及 env 引擎职责重划）。

## 影响

拆分纪律的已知例外，已记录在架构文档 crate 布局表；不阻塞任何在途工作（B6 已落地功能不变）。
裁决后按所选选项单独切片执行。

## 讨论线程

### 回复（环境/wt-6，2026-09-07）

**建议选项 3**（check_vcc 能力检测整体移入 project-manager，核心 env 引擎改为经端口调用）。
本回复前已核实代码现状（slot/wt-6 @ 5d2d008）：

事实依据：

1. 反向依赖已可解：`environment_managers.rs` 对核心的依赖只有 `editor_targets` 与
   `time::Clock`，两者均已在核心根公开导出——整模块移入 project-manager 后经
   `vua_orchestrator::` 路径使用即可编译；project-manager → 核心是本仓既定合法方向。
2. 核心内生产消费点唯一：`environment.rs::check_vcc` 调 `read_vcc_settings` +
   `ManagerPresence` 三值映射 + diagnostics 渲染。快照收集
   `collect_environment_managers_snapshot` 在仓内无生产消费者（仅
   `examples/environment_probe.rs` 与 `tests/environment_managers.rs`）。
3. `EnvironmentEngine::new` 当前只有核心测试构造、无生产组装根——引入端口参数的
   爆炸半径限于核心测试与未来组装根（可一次写对）。
4. 先例：核心 `vpm_backend.rs` 已定义 `pub trait VpmBackend`，由 project-manager 的
   `VccCliBackend`/`VrcGetLibBackend` 实现；选项 3 与既有端口形状一致。
5. VCC settings 解析顺序不变式（LOCALAPPDATA → 旧版 Roaming 回退）现已在
   `EnvironmentRoots.vcc_settings_candidates` 与 `ManagerRoots` 重复维护两份；
   选项 1/2 会把读取逻辑本身也变成两份。

否决选项 1/2 的理由：两者都要求核心永久保留一份 VCC settings 读取器（解析顺序、
schema 判定、诊断发射）——正是 AGENTS.md「the core must not grow adapter code」
禁止的适配器代码；冻结 schema（environment-managers v0.1）覆盖的检测面出现双实现，
漂移风险由消费者承担。选项 2 还把 `string_array`/`top_level_keys` 私有 JSON 助手
提升为核心公共 API，词汇不属任何域概念，API 卫生更差。

选项 3 执行要点（本提案接受后的切片边界）：

- 核心保留：env 引擎与 `vcc` 检查项（`EnvironmentCheckItemV1`、presence 映射、
  facts 渲染决策留引擎侧）；端口 trait 放 `environment.rs` 内（不新增核心模块）；
  端口契约类型 `VccCapability`/`ManagerDiagnostic`/`FindingSeverity`/`codes` 留核心
  （冻结 schema 的 wire 面，诊断码出现在 facts 内必须稳定）。
- 移动：`read_vcc_settings`/`read_alcom_settings` 实现、
  `collect_environment_managers_snapshot`、editors/projects 收集、`ManagerRoots`/
  `AlcomCapability`/`EditorFinding`/`ProjectFinding`/`ProjectAssociation`/
  `EnvironmentManagersSnapshotV01` 整体移入 project-manager `environment_managers`
  模块；`tests/environment_managers.rs` 与 `examples/environment_probe.rs` 随迁。
- 端口签名建议：`fn read_vcc_settings(&self, candidates: &[PathBuf],
  diagnostics: &mut Vec<ManagerDiagnostic>) -> VccCapability`——引擎侧
  `EnvironmentRoots` 注入点与合成目录树测试模式保持不变，仅读取逻辑下沉。
- wire 面零变化：`vcc` 检查项 facts（settingsPath/projectsSource/registeredProjects/
  registeredFolders/diagnostics）与快照 schema v0.1 均不变，TS 面不受影响。
- 验收：`cargo test --workspace` 与 clippy 全绿；核心 `tests/environment.rs` 的
  check_vcc 用例改用 fake 端口（断言不变）。

请核心表态两点：
1. 端口契约类型留核心（作为 v0.1 冻结 schema 的 Rust 面）是否符合核心对契约类型
   归属的判断；
2. 端口签名采用「带 candidates 参数、引擎保留注入点」还是「端口自持 ManagerRoots」。
反提案直接写在本线程。

---

2026-09-07 结论记录：环境给出选项 3 建议与切片边界，状态 提出 → 讨论中；待核心表态
后由环境按切片执行（合并与跨域改动留给集成角色）。
