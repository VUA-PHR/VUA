# Electron 表现层资产迁移记录

> 状态：进行中
> 旧来源：`_references/kimi-desktop-5870d0c/apps/desktop`
> 当前裁定：迁移阶段在 Electron 上恢复旧表现层资产，并以已接受的 `design-standard-v0.6.1` 验收视觉与交互

本记录不恢复 Tauri 宿主、IPC、权限或产品数据契约。Electron 进程隔离、窄 Gateway、远程内容隔离和现行模块所有权继续有效。

| 资产组 | 目标所有者 | 本轮保留 | 拒绝携带 | 验证 |
| --- | --- | --- | --- | --- |
| Token 与基础样式 | `packages/design-system` | 深色优先、紫/橙辖区、浅色和高对比映射 | Tauri/WebView 私有选择器 | TypeScript 检查、Renderer 生产构建 |
| 基础组件 | `packages/design-system` | Button、Card、Badge、EmptyState、StatusLight、像素装配工 | 领域规则、任务权威状态 | TypeScript 检查、真实页面使用 |
| 应用壳与导航 | `apps/desktop/src/renderer` | 旧固定区域、顶栏、侧栏、任务栏和车间轨道表现 | Tauri window API、直接 Node/Electron import | 导航纯模型测试、Electron 启动冒烟 |
| Desktop Gateway v1 最小面 | `packages/contracts`、Main、Preload | 显式版本、请求 ID、大小限制、来源限制、应用快照 | 手写 Rust 私有类型、通用 IPC、Shell/文件系统能力 | 契约测试、来源拒绝测试 |
| Tauri 浏览/外链/图片/教程端口 | 暂未迁移 | 仅保留行为需求 | 全部 Tauri command、event、WebviewWindow 和自定义协议实现 | 后续 Electron 专项切片 |
| BDB、Catalog 和旧 fixture | 不进入本轮实现 | 无 | 旧 BDB 身份、API、快照与演示生产数据 | 生产包当前不包含这些模块 |

## 本轮验证

- `pnpm check`：通过；6 项测试通过；
- `pnpm build`：通过；
- Windows Electron Main、Preload、Renderer 联合启动：通过；窗口标题为 `VUA`，进程正常响应；
- 冒烟结束后 Electron 子进程已全部退出。
