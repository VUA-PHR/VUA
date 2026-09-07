# Unity Bridge 协议 v2

[English](unity-bridge-v2_EN.md) | [简体中文](unity-bridge-v2_ZH.md)

> 文档版本：v2
> 状态：已冻结
> 协议版本：2
> 更新：2026-09-08
> 规范效力：有；JSON 结构以 `schemas/unity-bridge/v2/` 为机器可判定来源
> 来源决议：proposal 009（互审收口：互审点 1–5 全关＋核心确认 planRef 形态）

## 用途与边界

Unity Bridge v2 连接 Orchestrator 与全球版 Unity `2022.3.22f1` Editor Package，服务
M5 生产作业线（Recipe→Local Resolution→批准计划→作业执行→Build Record）。Orchestrator
负责用户意图、解析、批准、版本锁校验、快照与恢复编排；Bridge 只校验并执行已批准计划
中的 Unity 操作。Bridge 不接收任意脚本，不负责账号登录、素材下载、来源选择或 VRChat
上传。

v2 是 v1 的**冻结超集**（同面升版）：v1 的全部操作与字段保留，material 线
（production-use-case v0.1）继续使用 v1 协议，两族并存、语义对齐不合并。

## Editor 前置条件

沿用 v1：只在 Editor 与项目精确匹配 `2022.3.22f1` 后接受 Bridge 用于生产执行；
版本不匹配以 `bridge.editor_version_unsupported` 拒绝，保持项目原状。支持矩阵以
[Unity Editor 兼容政策](../compatibility/unity-editor_ZH.md)为权威。

## 传输

沿用 v1 job-directory 纪律：Orchestrator 在目标 Unity 项目的 `.vua/bridge/` 下原子
写入请求文件，再启动 Unity（`-executeMethod Vua.Editor.Bridge.BridgeEntryPoint.Run`
＋ `-vuaRequest`/`-vuaResult`）；结果经同目录临时文件原子切换。

**v2 增补（批准计划的文件形态，009 裁决）**：`execute_production_job` 的计划文档由
provider 以文件形态写入 job 目录，`payload.planRef` 引用该文件；`payload.planHash`
随命令下发。**Bridge 读取计划文件后必须本地校验 SHA-256 与 planHash 一致，不一致即
类型化拒绝（`plan_hash_mismatch`），不入执行、无部分状态**——计划完整性不依赖
provider 单方诚实。

## 命令信封

请求必须符合 [`command.schema.json`](../../schemas/unity-bridge/v2/command.schema.json)。
v2 操作全集（v1 十操作语义不变，见 [v1 协议](unity-bridge-v1_ZH.md)；★为 v2 新增）：

| operation | 模式 | 用途 |
| --- | --- | --- |
| ★ `execute_production_job` | 可检查或修改 | 执行批准计划中的有序作业序列；输入＝计划引用三件（`planHash`／`planSchemaVersion`（支持闭集枚举，词表外拒绝）／`planRef`），不内联计划字段 |
| ★ `restore_project` | 可检查或修改 | 按 `payload.snapshotId` 将项目回退到登记恢复点；实跑强制乐观锁 |

v1 十操作（`inspect_project` / `import_unity_package` / `materialize_extracted_package`
/ `create_local_vpm_package` / `validate_asset_paths` / `identify_assets` /
`install_outfit` / `create_toggle` / `validate_avatar` / `analyze_performance`）的
模式、必填 payload 与指纹约束在 v2 中逐条保留。

**修改模式与乐观锁**：`dryRun: false` 的变更操作（含 v2 两新操作）必须携带
`expectedProjectFingerprint`；不匹配即拒绝。受理侧的版本锁与环境预检归 provider
（从便宜到昂贵：版本锁→环境→指纹），Bridge 指纹锁是执行时最终防线（防受理到
执行之间的 TOCTOU）。

**计划哈希与幂等**：作业的幂等重放键＝`planHash`＋项目＋`planSchemaVersion`。相同
键的 `succeeded` 收据重放为 `replayed: true` 的既有收据，不重复执行；计划哈希不同
即新作业。`commandId` 关联沿用 v1（回执落盘、进程中断后必须重新 Inspect，不能自动
重放）。

可执行固定示例位于 `schemas/unity-bridge/v2/examples/`。示例只包含合成标识符和指纹。

## 作业收据

结果必须符合 [`result.schema.json`](../../schemas/unity-bridge/v2/result.schema.json)。
在 v1 结果面（`status`／`changedPaths`／`diagnostics`／`data.projectFingerprint` 等）
之上，`execute_production_job` 收据增加：

- `operation` 回显与 `data.dryRun`——**dry-run 收据与实跑收据同 Schema，以显式
  `dryRun` 字段区分；dry-run 收据永不冒充实跑**；
- `data.steps[]`——逐操作清单：dry-run 时为将执行清单（`pending`），实跑为已执行
  清单（`executed`/`failed`/`skipped`）；`kind` 词表归批准计划 Schema（recipe v0.3，
  词表外＝契约错误），Bridge 照实转抄；
- `data.steps[].resolvedSource`——逐操作实际消费来源（`sourceKind: original |
  generated_vpm`、`artifactSha256`、`warehouseItemId` 可空），**转抄自计划声明、
  不校验选择语义**（选择归 Local Resolution），供 Build Record 审计「当时用了哪个
  副本」；
- `data.replayed`——幂等重放标记；
- `data.snapshotId` 与 `data.projectFingerprintBefore`——实跑前置快照与前置指纹
  （**rejected 收据不携带：二者是「执行了变更」的证据，不是「dryRun=false」的
  证据**）。

`restore_project` 收据：`status: succeeded`（恢复完成）或 `failed`（附
`code=restore_failed`）两态，`data.restoredFrom` 引用回退目标快照；不虚构第三态。

## 恢复点登记

快照身份由 Bridge 侧快照机制分配；登记面归 Build Record 的 `recoveryPoints[]`
（proposal 012：`{ snapshotId, phase, createdAt }`，最小实现＝`pre_job` 单点；
`post_job:<jobId>` 词汇保留、M5 不拍摄）。恢复操作的授权与决策记录归 Orchestrator。

## 版本规则

- v2 Schema 只允许已实现的操作；计划中的操作不能提前加入枚举。
- 增加可选字段且旧消费者可忽略时可保持协议版本；改变字段语义、必填性或执行保证时
  发布新版本。
- Orchestrator 模型、JSON Schema、C# DTO 和固定测试必须在同一变更中更新。
- 包版本与协议版本独立。
- v1 与 v2 并存：material 线继续消费 v1，生产作业线消费 v2；两族的 Schema 各自
  冻结、语义对齐不合并。

## 文档变更日志

- v2（2026-09-08）：生产作业线协议——`execute_production_job`／`restore_project`
  新操作、批准计划 job 目录文件形态与 Bridge 本地哈希校验、作业收据（dry-run 显式
  区分＋逐步骤来源转抄＋幂等回显＋快照身份）、恢复点登记面；proposal 009 互审收口
  （互审点 1–5 全关）后冻结。
