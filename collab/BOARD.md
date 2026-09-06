# BOARD — VUA 全局看板

维护方：集成树（wt-main）。更新时机：每个 M 门关闭或合并完成后（见 collab/README.md）。
本文件只反映"现在"；历史在 git。

最近更新：2026-09-07 04:2x（**用户批量裁决**：U6 开窗〔备份已完成〕、U2 确认保留拆分——
均销账；U1/U3/U4 暂缓至收尾前批量裁决、U5 用户已阅暂缓；I-1 解除阻塞，产线 W1 开跑；
GUI 目视走查定于工作时段收尾最后一轮）

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
- [ ] I-1 — 真 Unity 矩阵：**执行中**（产线 W1；U6 裁决 04:20 开窗，VUA_UNITY_EXECUTABLE /
  VUA_REAL_SOURCE_FOLDER 已设，素材备份已完成 fuku-backup-20260907）
- [ ] W7 剩余 — W6/W7 DEV 目视走查：**定于本工作时段收尾最后一轮**执行 GUI 会话（用户要求
  04:20；操作者协调，桌面出走查清单）

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
| 1 | I-1 真 Unity 矩阵 | 集成树 | **执行中**（U6 裁决 04:20 开窗，产线 W1 开跑；素材备份已完成） |
| 7 | ph_010_mutation_gate 瞬败已根因修复（ec6b61d：confirm worker 先写终态后释放 gate 的设计顺序正确，测试尾部竞态改 10 秒期限轮询；核心自证 8 连跑+workspace 43 套全绿）；同模式扩展观察：数据报 warehouse_import 任务化偶发 1 例、主库早段套件偶发 1 例（均未复现、未捕获名，数据自判不立项） | 核心 | ph_010 已修复继续观察，再现即重开；扩展面继续挂观察 |

## 待用户裁决

进程侧解决不了的问题升级到这里（规则见 `collab/README.md` 升级规则）；标 `[需用户]` 的条目，
各角色在 tick 中自动跳过。用户白天批量处理。

| # | 事项 | 提出方 | 状态/用户决定 |
| --- | --- | --- | --- |
| U1 | EAC 实验性恢复的边界裁决稿（proposal 006；集成仲裁已过：R1–R9 无修订） | 环境 | **用户已阅·暂缓**：随收尾前批量裁决（操作者转发 04:20）；批准前环境不动代码（R9） |
| U3 | F6：VUA 是否写外部工具（ALCOM/VCC）管理的项目 | 桌面 | **用户已阅·暂缓**：随收尾前批量裁决（M6 前置，非阻塞） |
| U4 | remote 建立时点 | 集成 | **用户已阅·暂缓**：维持现行裁决（M3 验收当日建立），随收尾前批量复核 |
| U5 | VUA-2/VUA-3 内 node_modules.pre-rename 与 target.pre-rename 目录清理 | 集成 | **用户已阅·暂缓**：不阻塞进度，用户将在工作时段结束前一并清理（留挂） |
