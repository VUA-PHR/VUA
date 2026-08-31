# Electron 桌面与表现层架构

> 状态：已接受
> 范围：`apps/desktop`、`packages/design-system`、前端 Gateway
> 更新：2026-09-01
> 规范效力：有

## 技术决策

桌面外壳使用 Electron；表现层继续使用 React、TypeScript 与 Vite。Electron 取代旧 Tauri 外壳，
不改变 Rust Orchestrator、AMF 和 Unity Bridge 的所有权。

选择 Electron 的主要原因是 BDB Local 已把完整浏览体验、独立 Session、多网页视图和下载管理
纳入核心产品。统一 Chromium 行为与成熟的 Session/Download API 优先于最小安装体积。

## 进程职责

### Renderer

- 渲染本地 VUA 界面；
- 维护页面和临时输入状态；
- 通过注入的类型化 Gateway 提交命令、查询和任务操作；
- 不导入 Node.js、Electron Main API 或 Rust IPC 实现；
- 不保存权威任务、Recipe 或项目恢复状态。

### Preload

- 使用 `contextBridge` 暴露最小、显式、版本化的 Gateway；
- 校验 channel 名称、请求大小和调用来源；
- 不暴露通用 `ipcRenderer`、文件系统、Shell 或任意 invoke；
- 不向远程网页注入任何 VUA API。

### Main

- 管理窗口、生命周期、深链和更新；
- 创建本地 UI 与远程网页完全隔离的 `WebContentsView`；
- 管理按用途分区的 Session、Cookie、权限、导航和下载；
- 启动、监督并关闭 Rust Orchestrator sidecar；
- 把允许的 Gateway 调用映射到版本化本地 IPC；
- 不实现 AMF、Recipe、恢复或兼容性业务规则。

## 远程内容隔离

BOOTH 和其他远程页面必须满足：

- `nodeIntegration: false`、`contextIsolation: true`、sandbox 开启；
- 独立 Session partition，不与本地 UI 共用存储；
- 默认拒绝权限请求，只对明确来源和能力放行；
- 限制导航、新窗口、下载目标和外部协议；
- 不能访问 Preload Gateway、Orchestrator、插件、任意本地文件或凭据；
- 页面解析结果视为不可信输入，进入 BDB Local 前经过大小、类型和来源验证。

不使用 `<webview>` 作为核心架构；远程内容优先使用 Main 管理的 `WebContentsView`。

## React 边界

React 负责复杂工作台、引导页、素材卡片、Recipe 编辑、任务反馈和可访问性。状态管理、路由、
拖放与数据请求库在首个真实垂直切片中按需求选择，不提前建立第二套领域模型。

必须保持：

- View 不直接调用文件、数据库、进程、安装器、网络或 Unity；
- 领域错误通过类型化错误码进入用户文案，不在组件中解析任意字符串；
- 长任务由 Orchestrator 持有，页面卸载后仍可查询和恢复；
- 拖放不是唯一操作入口；关键流程可用键盘完成；
- Design Token 和组件状态由真实页面验证后晋升，旧美术文档仅作参考。

## 构建与发布

Electron、Chromium、Node.js、Forge/Vite 及所有原生依赖必须锁定版本。发布前执行依赖审计、
Electron 安全检查、远程内容权限测试、安装包签名和更新回滚验证。第三方二进制不因放入资源目录
就自动获得分发许可。
