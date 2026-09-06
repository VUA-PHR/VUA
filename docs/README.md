# 文档导航

> 状态：已接受
> 范围：VUA 新仓库
> 更新：2026-09-04
> 规范效力：本文只定义文档分层、阅读路径和权威顺序

本仓库采用渐进式披露。先判断任务属于哪个模块，再读取完成任务所需的最小规范集合；历史仓库、
迁移记录和参考材料不能直接指导实现。

## 权威顺序

发生冲突时按以下顺序处理：

1. 用户当前明确裁决；
2. [产品边界](product-boundary.md)；
3. 版本化协议、Schema 与固定测试向量；
4. 已接受且未被取代的 ADR；
5. 模块架构规范；
6. 当前开发计划；
7. 迁移台账和参考材料。

低层文档不能静默改变高层事实。发现冲突时先修复权威链，再继续实现。

## 目录职责

| 位置 | 内容 | 能否直接指导实现 |
| --- | --- | --- |
| `product-boundary.md` | 产品目标、模块所有权、明确边界 | 可以 |
| `protocols/` | IPC、Recipe、Unity Bridge、插件与持久化格式 | 可以，必须版本化 |
| `decisions/` | 已审议的技术与跨模块决策 | 仅“已接受”状态可以 |
| `architecture/` | 模块内部结构、依赖方向和适配器边界 | 可以，但不能扩展产品范围 |
| `plans/` | 已接受工作的顺序、里程碑和验收 | 可以安排工作，不能创造需求 |
| `migration/` | 旧资产去留、来源和验证状态 | 不可以 |
| `research/` | 有时限的 Spike、上游调研和脱敏可行性证据 | 不可以，须由计划或协议接收 |
| `reference/` | 调研、美术、UI/UX 和旧实现参考 | 不可以 |

## 按任务阅读

| 任务 | 必读 | 按需追加 |
| --- | --- | --- |
| Electron / React | 产品边界、对应桌面架构 | IPC、UI 参考、相关 ADR |
| Rust Orchestrator | 产品边界、Orchestrator 架构 | IPC、状态、恢复和适配器协议 |
| BDL / 浏览下载 | 产品边界、BDL 架构 | 数据格式、Session 与下载协议 |
| AMF / Recipe / Unity | 产品边界、对应模块架构 | Recipe、Unity Bridge、固定实例 |
| 项目与运行时工具 | 产品边界、适配器协议 | 对应上游审计与能力矩阵 |
| 插件 | 产品边界、插件协议、安全 ADR | 示例与兼容性测试 |
| 旧资产迁移 | [迁移台账](migration/asset-ledger.md) | 仅被台账点名的旧文件和提交 |

## 当前架构入口

- [系统架构](architecture/system.md)
- [Electron 桌面与表现层](architecture/desktop.md)
- [Rust Orchestrator](architecture/orchestrator.md)
- [BDL](architecture/bdl_ZH.md)
- [AMF 与 Unity Bridge](architecture/amf-unity.md)
- [第三方集成、插件与 Overlay](architecture/integrations-and-overlays.md)

## 当前协议入口

- [Unity Bridge v1](protocols/unity-bridge-v1.md)
- [AMF 素材入口协议 v0.1](protocols/material-intake-v0.1_ZH.md)
- [AMF material-intake protocol v0.1](protocols/material-intake-v0.1_EN.md)
- [下载事件协议 v0.1（草案）](protocols/download-events-v0.1_ZH.md)
- [Download events protocol v0.1 (draft)](protocols/download-events-v0.1_EN.md)

## 当前研究证据

- [VPM 素材包 Spike 封口记录](research/vpm-package-spike_ZH.md)
- [VPM asset-package Spike closure record](research/vpm-package-spike_EN.md)

## 文档规则

- 一个事实只有一个规范归属；摘要通过链接引用，不复制完整定义。
- 普通 README 由 Git 历史管理，不维护人工文档版本号。
- Wire format、Schema、持久化格式和插件协议必须有机器可判定的版本。
- 未审议草案、迁移记录和参考文件必须明确写明“无规范效力”。
- 模块形成真实实现前不创建大批占位说明书；新增文档必须解决当前路由、契约或决策问题。
