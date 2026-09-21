# VUA 冷启动导读

[English](project-context_EN.md) | [简体中文](project-context_ZH.md)

> 状态：冷启动导读（无规范效力）
> 范围：新会话的最小入口图
> 更新：2026-09-21
> 冲突处理：本文与任何规范源不一致时，一律以规范源为准
> 维护触发：仅当入口、职责或阅读路径变化时更新本文；版本号、当前进度、待办清单、
> 托管候选等现状内容不入本文（由看板、状态文件与各规范文档承载）

## 项目是什么

VUA 是 Windows 优先、本地优先的 VRChat 桌面生产环境，服务 VRChat 玩家与创作者（起点是
中国大陆的网络与语言条件）：在只使用合法获得素材的前提下，把「选定目标组合 → 环境、
项目、依赖、装配、检查、出厂」的生产链交给可检查、可恢复的程序化执行；判断与确认点
保留给用户，购买会话、凭证、付费素材与生产数据全部留在本机。

少量稳定历史背景：项目从「环境部署＋教学助手」的设想演化为面向任务完成的桌面工具；云端
采集管线（BDB）试验的结论是把采集、识别、清洗、发布耦合进单条管线不可持续，相关能力重建
为 AMF 私有的本地 BDL；本仓库是当前实现权威（Electron 桌面端＋Rust Orchestrator 工作区）。
更早的历史只是证据，不构成实现约束。

## 阅读顺序与权威冲突

1. 先读根 [README](../README_ZH.md)，再到[文档导航](README_ZH.md)按任务选最小阅读路径。
2. 权威顺序（冲突时前者胜）：用户现行裁决 →
   [产品边界](product-boundary_ZH.md) → 版本化协议与测试 → 已接受决定 → 架构 →
   设计标准 → 开发计划。
3. 本文、`docs/plans/`（本地备料区）与参考材料均无规范效力；研究材料不因被引用而成为
   实现权威。
4. 范围与模块归属查[产品边界](product-boundary_ZH.md)；受管文档与版本查
   [登记表](REGISTRY.md)。

## 先 collab:brief，再进入角色与领域文档

- 任何工作树开工前先运行 `pnpm collab:brief`，处理指向本工作树/本角色的阻塞与留言
  （机制见 [collab/README.md](../collab/README.md)）。
- 读本工作树状态文件 `collab/state/wt-N.md` 与全局看板 `collab/BOARD.md` 领取任务；
  统一节拍命令见 [collab/TICK.md](../collab/TICK.md)。
- 六执行角色（集成／桌面／核心／产线／数据／环境）的定义与代码所有权见
  [开发大纲](development-outline_ZH.md)「执行角色（六角色）」；入职提示词在
  [collab/roles/](../collab/roles/)；工作树↔角色指派以 BOARD 为准。角色是会话戴的帽子，
  不是分支或工作树。
- 之后按任务进入对应领域文档：产品边界、架构、协议与 Schema、设计标准。

## 所有权地图（链接，不在此复制）

- 产品范围与模块所有权：[product-boundary_ZH](product-boundary_ZH.md)（EN 镜像随行）
- 六 crate 布局与依赖方向：[系统架构](architecture/system_ZH.md)
- 六角色职责与协作纪律：[开发大纲](development-outline_ZH.md)
- 诚实律、安全与法律边界、提交与合并纪律：[AGENTS.md](../AGENTS.md) 与
  [collab/README.md](../collab/README.md)
- 受管文档登记：[REGISTRY](REGISTRY.md)

改写前的旧全文（2026-09-01 交接摘要）由 Git 历史保留，不另建归档与新摘要。
