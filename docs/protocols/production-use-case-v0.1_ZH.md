# VUA 生产用例契约 v0.1（B3/F3 候选草案）

[English](production-use-case-v0.1_EN.md) | [简体中文](production-use-case-v0.1_ZH.md)

> 状态：**B3 候选草案**——经 B 侧对齐并随首个用例实现冻结前，不约束任何一侧的实现
> 范围：第一个生产纵向用例（合成 Avatar + 一件衣装；`.unitypackage` 直接导入与本地 VPM
> 制作/安装双素材入口）的前后端命令与查询面
> 更新：2026-09-04
> 规范效力：F3 表现层与 B3 应用实现的对齐基线；方法名在 application-contract v0.1 方法表
> 登记（引入 = B3/F3），值语义以本文档为准

## 生命周期与任务机制

工作流阶段沿用既有词表：`inspect → plan → await_confirmation → snapshot → execute →
validate → completed`，异常落 `recover` / `failed` / `failed_recoverable` / `expired`。
每个生产命令创建一个标准任务（九态、commandId 幂等、事件 + revision、可取消），任务中心
与车间轨道无需任何特判。阶段词汇与 Renderer `strings.workflowStage`、Unity Bridge v1 保持
一致；漂移与超时是运行期事实，映射为 `failed_recoverable` / `expired` 运行态，不新造状态。

## 双素材入口

`source.intake` 二值，对齐 [素材 intake 协议 v0.1](material-intake-v0.1_ZH.md)：

- `unitypackage_direct`：来源 `.unitypackage` 原样直接导入目标项目；
- `local_vpm`：隔离 Unity 暂存项目制作的 `local-reusable` VPM 包，经 VUA `vrc-get`
  包管理器安装。

素材文件选择经 Kernel 的显式文件对话框动作完成（新 preload 面，随 F3 切片设计）；Renderer
不持有文件系统句柄，`source` 引用由 Kernel 侧解析后传给 Provider。

## 方法面（全部按 commandId 幂等；除查询外均创建任务）

| 种类 | 方法 | 语义 |
| --- | --- | --- |
| Command | `production.startInspection` | 对素材 + 目标组合启动 Inspect，产出兼容/缺失证据 |
| Query | `production.getInspection` | 读取一份检查结果（证据、可计划性结论） |
| Command | `production.requestPlan` | 基于检查结果生成执行计划（阶段、风险、预估） |
| Query | `production.getPlan` | 读取一份计划供审阅 |
| Command | `production.confirmPlan` | 用户确认计划；进入 snapshot → execute → validate 执行链 |
| Command | `production.recover` | 对 `failed_recoverable` / `expired` 结果执行恢复（continue / rollback，携带用户决定 ID） |
| Query | `production.getBuildRecord` | 读取最小 Build Record（结果、阶段、证据） |

## 值语义（种子 = Rust 既有类型）

- **Build Record**：镜像 `crates/orchestrator/src/build_record.rs` 的 `BuildRecordV01`——
  `recordId`、`status`（`BuildRecordStatus`）、四类证据（快照 / Bridge 作业 / 本地 VPM /
  验证）以不透明 `facts` 载荷传递，字段名与 Rust 结构的 camelCase 序列化一致；
- **检查结果**：兼容声明、缺失素材、依赖冲突等发现（对齐 material-intake 词表），携带
  `recoverable` / `retryable` 标注；
- **计划**：分阶段动作列表，每阶段引用工作流阶段词表；用户可见差异（计划 vs 检查结论）
  以结构化字段表达，不由前端推断。

## 确认与恢复纪律

- `confirmPlan` 前的计划审阅是独立用户阶段：确认绑定计划 revision，计划变化后确认失效
  （对应 `expired` 运行态），前端如实呈现"确认已过期"，不自动重新确认；
- `recover` 的 `continue` / `rollback` 都必须携带 Kernel 生成的用户决定 ID（与 Provider
  关闭协议同一纪律）；恢复是任务，不是瞬间动作；
- 取消语义与全局任务契约一致：请求取消 ≠ 已取消，安全边界结束才呈现取消完成。

## Capability 与验证门槛

- 全部方法以 `production.*` 操作级 capability 逐项门控；不可用入口不出现；
- 模拟 Provider 必须能脚本化演示五种生命周期表现：成功、取消、漂移
  （`failed_recoverable`）、超时（`expired`）、回滚（recover → 回滚成功/失败）；
- F3 验收 = 表现层在模拟 Provider 下覆盖全部五种表现 + 真实两端在 M3 整合门复验；
- 本文档经 B3 实现冻结前，字段级调整不要求升版本号（修订记录登记即可）。

## 修订记录

- 2026-09-04：B3/F3 候选草案。七方法面、生命周期-任务映射、双素材入口、确认与恢复纪律、
  值语义种子（BuildRecordV01 / material-intake / workflow 阶段词表）。
