# Provider 生命周期压测 Spike 笔记（BG-6）

> **SPIKE，非交付物**——M8「性能基线和 Provider 生命周期压测」的前置探索。
> 本目录（脚本＋本笔记）是探索记录：不进产品代码、无契约权威、不作为
> 任何端到端宣称的证据。限时纪律：单节拍内完成，不展开。

- 工单：BG-6（2026-09-10 01:30 空转触发备稿转正；核心协作产线）
- 领取/执行：wt-2（核心），2026-09-10 03:31–04:00
- 环境：本机 Windows（Git Bash／Node 24）＋ workspace 构建的
  `vua-orchestrator-provider` debug 二进制

## 脚本

`spike.mjs`（可复跑）：

```text
cargo build -p vua-provider-host --bin vua-orchestrator-provider   # 前置
node scripts/spikes/provider-lifecycle/spike.mjs [--rounds 20]
```

场景 A「基线会话」：spawn 真实 provider（临时 SQLite）→ handshake →
N 轮 `application.getSnapshot` 时延统计（p50/p95/max）。

场景 B「中断重启」：受理长跑 demo 任务（`task.startDemo`，幂等
commandId 在帧顶层）→ 等待进入运行 → **SIGKILL 硬杀**（进程未预期的
死亡）→ 同库重新 spawn → `task.list` 观察中断任务的状态呈现。

## 本机结果（2026-09-10 03:50，debug 构建）

- **场景 A**：handshake ≈ 51 ms（进程冷启动＋握手往返）；
  `application.getSnapshot` ×20：**p50 ≈ 0.26 ms / p95 ≈ 0.53 ms**。
  读路径时延地板远低于任何一屏呈现的需要——「overlay 按需轮询」
  （proposal 017 §4 桌面表态）在服务侧无时延障碍。
- **场景 B（边界发现）**：demo 任务受理进入 running 后硬杀 provider，
  同库重启后 `task.list` 对该任务读出 **`running`**（残留在 SQLite 的
  状态原样呈现）。

## 边界发现与升级

1. **候选缺口（与恢复纪律的观察面冲突）**：恢复纪律要求「非终态任务在
   重启后必须呈现为需显式处置、绝不隐式续跑」。当前重启扫除
   （`mark_other_owners_interrupted`＋`prod-` 前缀中断批）覆盖生产任务；
   **demo 任务面的非终态残留未被扫除**——重启后快照把一个已死进程的
   任务继续呈现为 `running`，与纪律的观察面相悖（该任务实际不可能仍在
   运行——进程已死）。
   - 影响面：demo 是任务体验贯通用例，非生产数据；但纪律的呈现诚实性
     对所有任务面一致才成立。
   - 升级去向：候选缺陷登记，修复方向（demo 任务纳入重启扫除或按纪律
     映射为需显式处置态）归核心/集成裁决与排期——本 Spike 如实记录，
     不代决、不顺手修（Spike 纪律：不进产品代码）。
2. **M8 性能基线的地板数据**：debug 构建下读路径 p95 < 1 ms——真机
   性能基线（release 构建＋冒烟负载）差距巨大，M8 压测设计应区分
   debug/release 与冷热路径。
3. **帧协议观察**：事件帧（task.accepted）与响应帧共存于同一输出流；
   demo 幂等 commandId 在帧顶层（非 params）——压测脚本已按实际形状
   固化，M8 正式压测应以正式契约文档为准而非本脚本。
