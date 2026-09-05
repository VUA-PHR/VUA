# 文档导航

[English](README_EN.md) | [简体中文](README_ZH.md)

> 状态：已接受  
> 范围：VUA 公开仓库  
> 更新：2026-09-04
> 规范效力：定义公开文档入口与权威顺序

公开仓库保存最终产品边界、架构、版本化接口、发行政策和社区工具目录。每项任务从最小相关文档
集合开始阅读。

## 权威顺序

1. [产品边界](product-boundary_ZH.md)
2. 版本化协议、Schema 与固定测试向量
3. [`decisions/`](decisions/) 中已接受的架构决策记录
4. 模块架构
5. 发行与兼容政策
6. 工具目录对目录条目的规则

高层文档拥有产品语义，低层文档提供实现细节。

## 公开目录

| 位置 | 公开内容 | 权威范围 |
| --- | --- | --- |
| `product-boundary_EN.md` / `_ZH.md` | 产品目标、模块所有权、交付边界 | 产品范围 |
| `architecture/` | 模块结构、依赖方向、适配器与数据所有权 | 实现架构 |
| `compatibility/` | 已验证生产目标、迁移输入和暂不支持环境 | 兼容政策 |
| `protocols/` 与 `schemas/` | Gateway、Recipe、Unity Bridge、插件与持久化格式 | 版本化接口 |
| `decisions/` | 已接受的架构决策记录(ADR) | 已接受决策 |
| `release/` | 产品版本、兼容、Tag 与制品 | 发行工程 |
| `tool-catalog/` | `core / plugin / external` 条目与发布风险规则 | 目录分类与贡献 |

本地工作区保存决策过程记录、迁移证据、开发计划、研究、项目接手上下文和视觉设计过程材料;已
接受的架构决策记录发布在 `decisions/`,其结果统一固化到上述公开文档。

## 按任务阅读

| 任务 | 必读 | 按需追加 |
| --- | --- | --- |
| Electron / React | 产品边界、[桌面架构](architecture/desktop_ZH.md) | Gateway 契约与安全测试 |
| Orchestrator | 产品边界、[Orchestrator 架构](architecture/orchestrator_ZH.md) | 状态、恢复和适配器协议 |
| AMF 素材获取 / BDL | 产品边界、[AMF](architecture/amf-unity_ZH.md)、[BDL](architecture/bdl_ZH.md) | Session、下载与持久化契约 |
| AMF / Recipe / Unity | 产品边界、AMF 架构、[Unity Editor 兼容性](compatibility/unity-editor_ZH.md) | Recipe 与 [Unity Bridge](protocols/unity-bridge-v1_ZH.md) |
| Kernel / Provider 托管 | 产品边界、[系统架构](architecture/system_ZH.md) | Desktop 与 Orchestrator 架构 |
| Core 工具 | 产品边界、[集成架构](architecture/integrations-and-overlays_ZH.md)、[Core 目录](tool-catalog/core/README.md) | 安全证据与能力矩阵 |
| Plugin | 产品边界、集成架构、[Plugin 目录](tool-catalog/plugin/README.md) | 插件协议与兼容测试 |
| External | 产品边界、集成架构、[External 目录](tool-catalog/external/README.md) | 上游审计与能力矩阵 |
| 发行/版本变化 | [版本政策](release/versioning_ZH.md) | 所属协议或 Schema |

## 当前入口

- [系统架构](architecture/system_ZH.md)
- [Electron 桌面与表现层](architecture/desktop_ZH.md)
- [Orchestrator](architecture/orchestrator_ZH.md)
- [AMF 与 Unity Bridge](architecture/amf-unity_ZH.md)
- [Unity Editor 兼容性](compatibility/unity-editor_ZH.md)
- [BDL](architecture/bdl_ZH.md)
- [Core、Plugin、External 与 Overlay](architecture/integrations-and-overlays_ZH.md)
- [Unity Bridge v1](protocols/unity-bridge-v1_ZH.md)
- [应用契约 v0.1](protocols/application-contract-v0.1_ZH.md)
- [Orchestrator 任务存储格式 v0.1](protocols/task-store-v0.1_ZH.md)
- [受监督 Provider 进程协议 v0.1](protocols/provider-process-v0.1_ZH.md)
- [下载事件协议 v0.1](protocols/download-events-v0.1_ZH.md)
- [BDL 读取面协议 v0.2](protocols/bdl-queries-v0.2_ZH.md)
- [ADR：Orchestrator 受监督独立进程托管](decisions/orchestrator-supervised-provider_ZH.md)
- [版本政策](release/versioning_ZH.md)
- [v0.4.1 发行说明](release/v0.4.1_ZH.md)
- [面向社区维护的工具目录](tool-catalog/README.md)

## 文档规则

- 每项事实由一份规范文档拥有，摘要链接到该文档。
- 现行公开开发文档维护匹配的 `_EN.md` 与 `_ZH.md` 版本。
- `tool-catalog/` 每个类别和条目使用一份双语文件，使每次社区变更保持完整。
- Schema、Wire format、源码、生成文件和正式许可证正文保持单一来源。
- Wire、Schema、持久化与插件格式携带机器可判定版本。
- 新公开文档对应真实架构、接口或已实现模块需求。
