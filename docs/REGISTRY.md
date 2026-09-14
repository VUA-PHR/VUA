# VUA 受管文档登记表（REGISTRY）

> 文档版本：事件驱动
> 状态：已接受

机器可读登记表；路径指 ZH 版，EN 镜像随行不单独登记。更新规范见
[docs/meta/documentation-governance_ZH.md](meta/documentation-governance_ZH.md) §3
（事件驱动：Minor/Major 版本变化、状态变化、新增受管文档、M 门复核刷新；Patch 不动本表）。

| 路径 | 文档版本 | 状态 | 维护方 | 最近复核 |
| --- | --- | --- | --- | --- |
| AGENTS.md | 1.1.0 | 已接受 | 集成 | 2026-09-06 |
| docs/product-boundary_ZH.md | 1.3.0 | 已接受 | 集成 | 2026-09-09 |
| docs/compatibility/unity-editor_ZH.md | 1.0.0 | 已接受 | 集成 | 2026-09-06 |
| docs/compatibility/alcom-vcc_ZH.md | 1.2.0 | 已接受 | 环境 | 2026-09-12 |
| schemas/project-inspection/v0.1 | 0.1 | 已取代（→ v0.2） | 环境 | 2026-09-09 |
| docs/protocols/project-inspection-v0.2_ZH.md | 0.2 | 已冻结 | 环境 | 2026-09-09 |
| docs/protocols/project-ops-v0.1_ZH.md | 0.1 | 已取代（→ v0.2） | 环境 | 2026-09-09 |
| schemas/project-ops/v0.1 | 0.1 | 已取代（→ v0.2） | 环境 | 2026-09-12 |
| schemas/project-ops/v0.2 | 0.2 | 已冻结（v0.1 增量族升版：新增 `project.setNote` 备注写命令＋守卫闭集三项扩充；D-6 桌面确认裁定 A 后核心升版批冻结 2026-09-12；import-copy 形状零变更） | 核心 | 2026-09-12 |
| docs/protocols/project-ops-v0.2_ZH.md | 0.2 | 已冻结 | 核心 | 2026-09-12 |
| schemas/recipe/v0.3 | 0.3 | 已冻结（M5 产物链四件：recipe/local-resolution/approved-plan/build-record；W20＋W22，集成验收 0400bee/c486318 复跑 367/370/0） | 核心 | 2026-09-10 |
| schemas/eac-probe/v0.1 | 0.1 | 已冻结（006 R1a，集成验收复跑 437/0） | 环境 | 2026-09-10 |
| schemas/eac-allowlist/v0.1 | 0.1 | 已冻结（006 R2/R3，集成验收复跑 442-443/0） | 环境 | 2026-09-10 |
| schemas/eac-terminate/v0.1 | 0.1 | 已冻结（006 R1b 全链收官，集成验收复跑 447/0） | 环境 | 2026-09-10 |
| schemas/amf-production/v0.2 | 0.2 | 已冻结（M3 验收，2026-09-07；v0.1 历史保留） | 核心 | 2026-09-10 |
| schemas/environment-managers/v0.1 | 0.1 | 已冻结 | 环境 | 2026-09-10 |
| docs/architecture/system_ZH.md | 1.0.1 | 已接受 | 桌面 | 2026-09-07 |
| docs/architecture/orchestrator_ZH.md | 1.0.0 | 已接受 | 桌面 | 2026-09-06 |
| docs/architecture/desktop_ZH.md | 1.2.0 | 已接受 | 桌面 | 2026-09-12 |
| docs/architecture/bdl_ZH.md | 1.1.0 | 已接受 | 数据 | 2026-09-08 |
| docs/architecture/amf-unity_ZH.md | 1.0.0 | 已接受 | 产线 | 2026-09-06 |
| docs/architecture/integrations-and-overlays_ZH.md | 1.0.0 | 已接受 | 桌面 | 2026-09-06 |
| docs/decisions/orchestrator-supervised-provider_ZH.md | ADR | 已接受 | 集成 | 2026-09-06 |
| docs/decisions/vua-instance-identity_ZH.md | ADR | 已接受 | 集成 | 2026-09-06 |
| docs/decisions/warehouse-layout_ZH.md | ADR | 已接受 | 集成 | 2026-09-06 |
| docs/decisions/path-configuration_ZH.md | ADR | 已接受 | 集成 | 2026-09-12 |
| docs/protocols/application-contract-v0.1_ZH.md | 0.1 | 已冻结 | 核心 | 2026-09-06 |
| schemas/application-contract/v0.1 | 0.1 | 已冻结（任务快照形状机器面＋六向量：BOARD #22 result 回流增量——可选 `result` 字段携带 Done payload 原样、两通道同源同值、失败/取消/非终态恒缺席；提案 020，向后兼容增量，协议本同日修订记录。＋overlay 快照机器面＋六向量：`overlay.getSnapshot` 任务卡＋生产状态卡轮询读面——纯函数投影、零会话身份、诚实缺席语义；提案 017 批 1，向后兼容增量，协议本同日修订记录） | 核心 | 2026-09-12 |
| docs/protocols/bdl-queries-v0.1_ZH.md | 0.1 | 已取代（→ v0.3） | 数据 | 2026-09-06 |
| docs/protocols/bdl-queries-v0.2_ZH.md | 0.2 | 已取代（→ v0.3） | 数据 | 2026-09-06 |
| docs/protocols/bdl-queries-v0.3_ZH.md | 0.3 | 已取代（→ v0.4） | 数据 | 2026-09-06 |
| docs/protocols/bdl-queries-v0.4_ZH.md | 0.4 | 已冻结（downloads.listCompleted 采纳源读面，2026-09-10：Schema＋向量＋消费测试）；wire 已落（2026-09-10 核心 389912e：路由臂＋信封版本常量 0.3→0.4＋消费测试；TS 面在位。2026-09-15 注记刷新，wt-5 c749d22 登记请求，集成独立核实） | 数据 | 2026-09-15 |
| docs/protocols/bdl-commands-v0.1_ZH.md | 0.1 | 已取代（→ v0.2） | 数据 | 2026-09-07 |
| docs/protocols/bdl-commands-v0.2_ZH.md | 0.2 | 已取代（→ v0.3） | 数据 | 2026-09-08 |
| docs/protocols/bdl-commands-v0.3_ZH.md | 0.3 | 已取代（→ v0.4） | 数据 | 2026-09-08 |
| docs/protocols/bdl-commands-v0.4_ZH.md | 0.4 | 已冻结（IMP-3 契约先行，2026-09-09：Schema＋正负例向量＋消费测试） | 数据 | 2026-09-09 |
| docs/protocols/production-evidence-v0.1_ZH.md | 0.1 | 已冻结 | 数据 | 2026-09-08 |
| docs/protocols/inspection-evidence-v0.1_ZH.md | 0.1 | 已冻结（M7，2026-09-13：proposal 016 §7 硬前置①②③经集成验收收口〔7d63abe／7a262b8〕，④协议本双语＋⑤本行随冻结批办理；向量 7＋校验测试＋核心存储/读路由/任务化驱动） | 产线 | 2026-09-13 |
| docs/protocols/download-events-v0.1_ZH.md | 0.1 | 已冻结 | 数据 | 2026-09-06 |
| docs/protocols/material-intake-v0.1_ZH.md | 0.1 | B3 实现基线 | 产线 | 2026-09-06 |
| docs/protocols/production-use-case-v0.1_ZH.md | 0.1 | 已冻结（M3 验收） | 核心 | 2026-09-07 |
| docs/protocols/production-use-case-v0.2_ZH.md | 0.2 | 已冻结（W20，2026-09-09：Schema＋向量 24＋消费测试全链） | 核心 | 2026-09-09 |
| docs/protocols/provider-process-v0.1_ZH.md | 0.2 | B2 实现基线（握手帧面 Schema 已冻结） | 核心 | 2026-09-07 |
| docs/protocols/task-store-v0.1_ZH.md | 0.1 | 已冻结 | 核心 | 2026-09-06 |
| docs/protocols/unity-bridge-v1_ZH.md | v1 | 已接受 | 产线 | 2026-09-06 |
| docs/protocols/unity-bridge-v2_ZH.md | v2 | 已冻结 | 产线 | 2026-09-08 |
| docs/protocols/unity-bridge-v3_ZH.md | v3 | 已冻结（M7，2026-09-13：proposal 016 三树表态收口〔核心 0:0x／数据 0:2x／桌面 1:4x，零修订意见〕；v2 同面超集＋三只读检查操作＋instanceGlobalObjectId 合法化；落库面随 7d63abe 先行，本批为契约面冻结；生产作业面迁移归后续切片，v2 生产路径继续生效） | 产线 | 2026-09-13 |
| schemas/inspection-queries/v0.1 | 0.1 | 已冻结（检查读面词表行 get/list/requestRun 三方法一次冻结，2026-09-13：Schema＋正例 3 对＋负例 3＋双载体消费测试；016 §7 硬前置①②③已验收入库〔7d63abe＋7a262b8＋修订批 c914cf2 族常量统一，数据追认〕；get/list 桌面消费已落地入 main〔33988a6〕，requestRun 悬空面维持——avatarGlobalObjectId 无桌面事实源，登记而不消费；真实数据走查归 W25） | 数据 | 2026-09-13 |
| docs/protocols/inspection-queries-v0.1_ZH.md | 0.1 | 已冻结（检查读面词表行，2026-09-13：三方法一次冻结，硬前置④⑤随冻结批） | 数据 | 2026-09-13 |
| schemas/editor-verify/v0.1 | 0.1 | 已冻结（U10 手选编辑器路径验证词表行 environment.verifyEditor，2026-09-13：proposal 021 七点裁决定形；Schema＋正例 3 对＋负例 3＋双载体消费测试〔环境域锚 editor_verify_wire 8/8＋provider-host 帧环 8/8〕；核心路由批 deafe11＋373470c 经 a6585c2 验收入 main；桌面 TS 面与设置面候 U10 切片随批，真机走查归 W25） | 环境 | 2026-09-13 |
| docs/protocols/editor-verify-v0.1_ZH.md | 0.1 | 已冻结（手选编辑器路径验证词表行，2026-09-13：单方法一次冻结，硬前置⑤协议本双语＋本行＋SCHEMA_EXEMPT 豁免行移除请求随本冻结批，豁免行候集成验收移除） | 环境 | 2026-09-13 |
| docs/release/versioning_ZH.md | 1.0.0 | 已接受 | 集成 | 2026-09-06 |
| docs/design/design-standard_ZH.md | 0.7.0 | 已接受 | 桌面 | 2026-09-10 |
| docs/development-outline_ZH.md | 2.0.2 | 已接受 | 集成 | 2026-09-07 |
| docs/meta/documentation-governance_ZH.md | 1.0.0 | 已接受 | 集成 | 2026-09-06 |
| CONTRIBUTING_ZH.md | 1.0.0 | 已接受 | 集成 | 2026-09-06 |
| docs/REGISTRY.md | 事件驱动 | 已接受 | 集成 | 2026-09-06 |

## 排除规则

以下路径不纳入受管文档，不登记、不要求头部版本行：

- `docs/tool-catalog/**`：社区维护条目（双语单文件，体系外例外）；
- `docs/research/**`：研究材料，不成为实现权威；
- `docs/reference/**`：参考材料（继续 gitignore）；
- `docs/migration/**`：迁移输入材料（继续 gitignore）；
- `docs/plans/**`：本地草稿区（继续 gitignore）；协调结论须落进 collab/ 才算数。

无语言后缀的同目录文件（如 `docs/architecture/system.md`、`docs/design/design-standard.md`）
是双语导航页，非规范文档，不登记。
