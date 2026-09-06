# BOARD — VUA 全局看板

维护方：集成树（wt-main）。更新时机：每个 M 门关闭或合并完成后（见 collab/README.md）。
本文件只反映"现在"；历史在 git。

最近更新：2026-09-07 02:4x（W3 桌面镜像落地 f496924 复核通过（contracts 25 测全过）；
#7 达立项条件（ph_010 多次复现）请核心立项；两支状态批并入）

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
| 3 | bdl-queries v0.3 TS 镜像 ageRestriction 缺口 | 数据＋桌面 | proposal 002；桌面镜像已按数据规格落地并回执（f496924，contracts 25 测全过），待数据核对后关闭 |
| 5 | F4-9 三命令协议未排期 | 核心＋桌面 | 已解冻：词表在 bdl-commands v0.1 冻结，接线分工见 proposal 005 |
| 6 | environment_managers 因深耦合未随 project-manager 拆出 | 环境 | proposal 004 已收敛：环境＋核心一致选项 3（含切片边界），环境切片待执行（架构级，U2 留用户确认） |
| 7 | 未定名瞬败观察升级：provider_host ph_010_mutation_gate 已多次复现（原始 1 例 + wt-4 tick4 再现 14passed/1failed，单跑与全量复跑均绿）；另有核心 workspace 一次 4passed/1failed、数据 import-task 一次——疑似时序敏感 | 核心 | **达「复现即立项」条件，请核心立项排查**（不阻塞合并，立项后按缺陷流程跟踪） |

## 待用户裁决

进程侧解决不了的问题升级到这里（规则见 `collab/README.md` 升级规则）；标 `[需用户]` 的条目，
各角色在 tick 中自动跳过。用户白天批量处理。

| # | 事项 | 提出方 | 需要用户决定 |
| --- | --- | --- | --- |
| U1 | EAC 实验性恢复的边界裁决稿 | 环境 | 批准边界条款后才有实现（M6 前置） |
| U2 | environment_managers 拆分三选项（proposal 004） | 环境 | ~~选 1/2/3~~ 环境＋核心已技术收敛于选项 3（004 线程，含切片边界）；因属架构级拆分，留用户确认或默许后由环境执行切片 |
| U3 | F6：VUA 是否写外部工具（ALCOM/VCC）管理的项目 | 桌面 | 产品语义裁决（M6 前置） |
| U4 | remote 建立时点（现行裁决：M3 验收当日） | 集成 | 是否提前建 private 仓库让 CI 先行 |
| U5 | VUA-2/VUA-3 内 node_modules.pre-rename 与 target.pre-rename 目录清理 | 集成 | 确认后删除（auto 模式进程禁 rm -rf；2026-09-07 核实四目录仍在） |
| U6 | I-1 真机窗口开启（M3 唯一剩余门项 W1，已三轮等待：入职/tick1/tick2 均 unset） | 产线 | (a) 设置 `VUA_UNITY_EXECUTABLE`（全球版 2022.3.22f1 `Unity.exe` 路径）与 `VUA_REAL_SOURCE_FOLDER`（合法素材目录：开发者合法取得、仅本地保存、不入仓库）后通知产线开跑；(b) 或明确暂缓 I-1 / 调整 M3 验收范围（需用户裁决，产线不代决）。产线侧准备已就绪：16 格执行计划与逐格触发手法已核实（本地 `docs/plans/m3-i1-real-matrix-plan_ZH.md`），窗口一开即逐格写跑校准 |
