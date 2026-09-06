# Electron 桌面与表现层架构

[English](desktop_EN.md) | [简体中文](desktop_ZH.md)

> 文档版本：1.0.0
> 状态：已接受
> 权威语言：简体中文（EN 为镜像，同步至 1.0.0）
> 范围：`apps/desktop`、`packages/design-system`、前端 Gateway
> 更新：2026-09-06
> 最近符合性复核：2026-09-06
> 规范效力：有

## 技术决策

桌面外壳使用 Electron；表现层使用 React、TypeScript 与 Vite。Electron Main 承载小型 Node.js
Kernel。Kernel 提供启动、桌面安全、Gateway 与 Orchestrator Provider 生命周期；React UI 提供
受控表现层，Orchestrator、AMF、BDL 和 Unity Bridge 保持各自所有权。内置产品行为直接连接到所属
应用用例，不经过通用模块注册或运行时组合框架。

选择 Electron 的主要原因是 AMF 已把完整浏览体验、独立 Session、多网页视图和下载管理纳入
核心产品。统一 Chromium 行为与成熟的 Session/Download API 优先于最小安装体积。

## 进程职责

### Renderer

- 渲染本地 VUA 界面；
- 维护页面和临时输入状态；
- 通过注入的类型化 Gateway 提交命令、查询和任务操作；
- 导入表现层包和注入的 Gateway 契约；
- 从 Orchestrator 快照读取权威任务、Recipe 与项目恢复状态。

### Preload

- 使用 `contextBridge` 暴露最小、显式、版本化的 Gateway；
- 校验 channel 名称、请求大小和调用来源；
- 只暴露允许清单中的应用调用及类型化请求/响应；
- 为远程网页提供空的 VUA 能力表面。

### Main

- 管理窗口、生命周期、深链和更新；
- 创建本地 UI 与远程网页完全隔离的 `WebContentsView`；
- 提供按用途分区的 Session、Cookie、权限、导航和下载传输机制，并执行来源、权限、目标路径、
  文件类型与协议处理的桌面安全限制；
- 拥有 Kernel 启动、安全策略、Provider 托管/监督、诊断和未来社区插件宿主边界；
- 托管或监督选定的 Rust Orchestrator Provider，把允许的调用映射到版本化应用契约，并向 Renderer
  隐藏具体传输；
- 把允许的 Gateway 调用映射到版本化应用契约；
- 将 AMF、Recipe、恢复与兼容性行为委托给应用用例。

Core 目录条目对应直接构建进 VUA 的可信产品行为；它们不通过运行时注册获得能力。未来社区插件
宿主提供独立能力上下文。

Electron Main 通过窄化的浏览与下载端口向 AMF 提供桌面能力。它可以报告规范化的导航、下载进度、
完成、取消和失败事件，并自行持有 `Session`、`WebContents`、`DownloadItem`、Cookie 与下载令牌。
AMF 负责素材获取意图、任务和来源关联、文件检查以及 Warehouse/BDL 记录决策。

## 远程内容隔离

BOOTH 和其他远程页面必须满足：

- `nodeIntegration: false`、`contextIsolation: true`、sandbox 开启；
- 独立 Session partition，保存独立远程存储；
- 按明确来源和能力授予权限；
- 按允许清单处理导航、新窗口、下载目标和外部协议；
- 能力表面只包含标准 Web API；
- 页面解析结果经 AMF 素材获取边界完成大小、类型和来源验证后，才可形成 BDL
  来源观察。

远程内容统一使用 Main 管理的 `WebContentsView`。

## React 边界

React 负责复杂工作台、引导页、素材卡片、Recipe 编辑、任务反馈和可访问性。状态管理、路由、
拖放与数据请求库在首个真实垂直切片中按需求选择，领域模型由应用核心统一拥有。

必须保持：

- View 通过 Gateway 请求文件、数据库、进程、安装器、网络与 Unity 能力；
- 领域错误通过类型化错误码进入用户文案；
- 长任务由 Orchestrator 持有，页面卸载后仍可查询和恢复；
- 关键流程同时提供拖放、按钮和键盘入口；
- Design Token 和组件状态由真实页面验证后晋升，旧美术文档仅作参考。

## 构建与发布

Electron、Chromium、Node.js、Forge/Vite、受监督 Orchestrator Provider 及所有原生依赖必须锁定
版本。独立 Provider 可执行文件按已接受托管决议打包，并在受支持 Windows 架构上验证。发布前执行依赖
审计、Electron 安全检查、远程内容权限测试、安装包签名和更新回滚验证。每个第三方二进制由
再分发审查授予随包分发资格。

## 文档变更日志

- 1.0.0（2026-09-06）：纳入版本管理；头部规范化并补充符合性复核日期，内容对照实态复核无变更。
