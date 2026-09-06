# BOARD — VUA 全局看板

维护方：集成树（wt-main）。更新时机：每个 M 门关闭或合并完成后（见 collab/README.md）。
本文件只反映"现在"；历史在 git。

最近更新：2026-09-07（常驻进程模型启用：六角色 × 六工作树 + TICK 节拍）

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
| 1 | I-1 真机窗口未开，M3 无法验收 | 集成树 | 等待真机 |
| 2 | 帧协议 v0.1 handshake 无机器可读 Schema | 核心 | proposal 001 |
| 3 | bdl-queries v0.3 TS 镜像 ageRestriction 缺口 | 数据＋桌面 | proposal 002 |
| 4 | generate-VPM / delete-originals / set_artifact_mode 零测试 | 数据 | proposal 003 |
| 5 | F4-9 三命令协议未排期 | 核心＋桌面 | 未排期 |
| 6 | environment_managers 因深耦合未随 project-manager 拆出 | 环境 | proposal 004 |
| 7 | production_host 套件偶发失败一次（拆分后首次全量链，1/5 运行；其后 4 连绿，疑似时序敏感，未定名） | 核心 | 观察项，复现即立项 |

## 待用户裁决

进程侧解决不了的问题升级到这里（规则见 `collab/README.md` 升级规则）；标 `[需用户]` 的条目，
各角色在 tick 中自动跳过。用户白天批量处理。

| # | 事项 | 提出方 | 需要用户决定 |
| --- | --- | --- | --- |
| U1 | EAC 实验性恢复的边界裁决稿 | 环境 | 批准边界条款后才有实现（M6 前置） |
| U2 | environment_managers 拆分三选项（proposal 004） | 环境 | 选 1/2/3 或维持现状 |
| U3 | F6：VUA 是否写外部工具（ALCOM/VCC）管理的项目 | 桌面 | 产品语义裁决（M6 前置） |
| U4 | remote 建立时点（现行裁决：M3 验收当日） | 集成 | 是否提前建 private 仓库让 CI 先行 |
