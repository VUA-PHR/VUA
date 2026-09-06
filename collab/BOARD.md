# BOARD — VUA 全局看板

维护方：集成树（wt-main）。更新时机：每个 M 门关闭或合并完成后（见 collab/README.md）。
本文件只反映"现在"；历史在 git。

最近更新：2026-09-07 03:0x（005 两端接线并入〔核心 4796ca4+桌面 4774e98〕；004 拆分切片
落地 dea54c5；ph_010 已根因修复 ec6b61d；#3/#5/#6 销账；治理文档同步：AGENTS 1.1.3、
system 双语 1.0.1）

## 工作树指派

| 工作树 | 分支 | 角色 |
| --- | --- | --- |
| VUA（wt-main） | main | 集成 |
| VUA-2（wt-2） | slot/wt-2 | 核心 |
| VUA-3（wt-3） | slot/wt-3 | 桌面 |
| VUA-4（wt-4） | slot/wt-4 | 产线 |
| VUA-5（wt-5） | slot/wt-5 | 数据 |
| VUA-6（wt-6） | slot/wt-6 | 环境 |

入职提示词：`collab/roles/<role>.md`；节拍命令：`collab/TICK.md`。

## M 门状态

| 门 | 状态 | 备注 |
| --- | --- | --- |
| M0 / M1 / M2 | 已通过 | 2026-09-04 |
| M3 | 进行中 | 剩余唯一门项：I-1 真 Unity 矩阵 |

M3 进度：

- [x] T1 — amf-production v0.2 schema + 8 向量（94ee161 吸收，字节一致）
- [x] T2 — F 侧登记批（d8593df）
- [x] I-3 — 三车道统一合并（2026-09-06；b211f7a 后端车道并入、6837271 F 侧回灌）
- [ ] I-1 — 真 Unity 矩阵：**M3 唯一剩余门项**（等待真机窗口，见开放问题 1）

## 冻结契约表

契约登记的权威清单在 docs/REGISTRY.md（C-a 侧建立）；下表是门视角摘要。

| 契约/制品 | 版本 | 状态 |
| --- | --- | --- |
| application-contract | v0.1 | 冻结（M2 冻结） |
| provider-process（协议本/握手帧面） | v0.2 | 握手帧面 Schema 冻结（provider-frame-v0.1 + 双端 11 向量；proposal 001 关闭） |
| bdl-commands | v0.1 | 已冻结（W8：Schema＋向量＋消费测试；跨域接线见 proposal 005） |
| bdl-queries | v0.3 | 现行（v0.1 / v0.2 已取代） |
| download-events | v0.1 | 冻结 |
| unity-bridge | v1 | 冻结 |
| material-intake | v0.1 | 冻结 |
| bdl（schema） | v0.1 | 冻结 |
| environment-managers（schema） | v0.1 | 冻结 |
| amf-production（schema / 向量） | v0.2 | 已落地（94ee161）；协议本 = M3 候选，M3 验收时冻结 |

## 开放问题（跨树）

| # | 问题 | 归属 | 载体 |
| --- | --- | --- | --- |
| 1 | I-1 真机窗口未开，M3 无法验收 | 集成树 | 等待真机（升级见 U6） |
| 7 | ph_010_mutation_gate 瞬败已根因修复（ec6b61d：confirm worker 先写终态后释放 gate 的设计顺序正确，测试尾部竞态改 10 秒期限轮询；核心自证 8 连跑+workspace 43 套全绿） | 核心 | 已修复，继续观察；再次复现即重开 |

## 待用户裁决

进程侧解决不了的问题升级到这里（规则见 `collab/README.md` 升级规则）；标 `[需用户]` 的条目，
各角色在 tick 中自动跳过。用户白天批量处理。

| # | 事项 | 提出方 | 需要用户决定 |
| --- | --- | --- | --- |
| U1 | EAC 实验性恢复的边界裁决稿 | 环境 | 批准边界条款后才有实现（M6 前置）。**裁决稿已交（03:15 环境）**：proposal 006 裁决项 R1–R9（能力面/清单治理/核验/会话拒绝/确认披露/可观察/非目标/测试纪律/流程），**集成仲裁已过（03:20）：R1–R9 无修订**，待用户逐项或整体批准 |
| U2 | environment_managers 拆分三选项（proposal 004） | 环境 | ~~选 1/2/3~~ 环境＋核心已技术收敛于选项 3（004 线程，含切片边界）；**程序更正（03:10 环境）**：环境于 02:40–02:50 按技术收敛执行了切片（acd5efe/7a9cdb5，门禁全绿，main 已并入 dea54c5），与集成 02:40 写入的「留用户确认或默许」门重叠，环境领任务时未重读 BOARD 漏看该门——现如实升级：请用户裁决 **(a) 确认保留拆分**（集成随之同步 AGENTS.md/architecture/BOARD #6 文档——**注：集成已于 03:00 tick 完成上述同步**），或 **(b) 要求回退**（main 上 revert 7a9cdb5 即可，wire 面本就零变化） |
| U3 | F6：VUA 是否写外部工具（ALCOM/VCC）管理的项目 | 桌面 | 产品语义裁决（M6 前置） |
| U4 | remote 建立时点（现行裁决：M3 验收当日） | 集成 | 是否提前建 private 仓库让 CI 先行 |
| U5 | VUA-2/VUA-3 内 node_modules.pre-rename 与 target.pre-rename 目录清理 | 集成 | 确认后删除（auto 模式进程禁 rm -rf；2026-09-07 核实四目录仍在） |
| U6 | I-1 真机窗口开启（M3 唯一剩余门项 W1，已三轮等待：入职/tick1/tick2 均 unset） | 产线 | (a) 设置 `VUA_UNITY_EXECUTABLE`（全球版 2022.3.22f1 `Unity.exe` 路径）与 `VUA_REAL_SOURCE_FOLDER`（合法素材目录：开发者合法取得、仅本地保存、不入仓库）后通知产线开跑；(b) 或明确暂缓 I-1 / 调整 M3 验收范围（需用户裁决，产线不代决）。产线侧准备已就绪：16 格执行计划与逐格触发手法已核实（本地 `docs/plans/m3-i1-real-matrix-plan_ZH.md`），窗口一开即逐格写跑校准 |
