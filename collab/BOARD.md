# BOARD — VUA 全局看板

维护方：集成树（wt-main）。更新时机：每个 M 门关闭或合并完成后（见 collab/README.md）。
本文件只反映"现在"；历史在 git。

最近更新：2026-09-06（过渡执行完成：统一合并 + 治理落地 + collab 机制 + 工作树更名 + crate 拆分）

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
| 2 | 帧协议 v0.1 handshake 无机器可读 Schema | B 角色 | proposal 001 |
| 3 | bdl-queries v0.3 TS 镜像 ageRestriction 缺口 | B/F 角色 | proposal 002 |
| 4 | generate-VPM / delete-originals / set_artifact_mode 零测试 | B 角色 | proposal 003 |
| 5 | F4-9 三命令协议未排期 | F/B 角色 | 未排期 |
| 6 | environment_managers 因深耦合未随 project-manager 拆出 | B 角色 | proposal 004 |
