# Kimi 桌面客户端参考索引

> 状态：参考
> 来源：旧 VUA 分支 `kimi/docs-art-v04-dual-track`，提交 `5870d0c`
> 更新：2026-09-01
> 规范效力：无

该分支的 React 客户端和视觉材料只用于新 Electron 客户端的交互与实现参考，不作为代码依赖、
产品边界或迁移基线。精选副本保存在本机被 Git 忽略的
`_references/kimi-desktop-5870d0c/`，新仓库在没有该目录时必须仍能完整构建和测试。

## 值得重新验证的内容

- 语义 Design Token、主题和密度组织方式；
- 键盘导航、焦点恢复、禁用原因可见性与非拖放入口；
- View → Gateway 的依赖方向；
- Task、保存、媒体加载和降级状态的显式建模；
- Warehouse、Recipe、环境部署、工具与教程页面的交互拆分；
- 纯模型测试、组件测试、i18n 完整性和边界检查脚本；
- SteamVR helper 的阻塞 IPC、窗口生命周期和真实运行时验证经验。

这些内容必须在新的 Electron vertical slice 中重新实现和测试，不能直接复制后宣称通过。

## 明确不继承

- `src-tauri`、Tauri command、capability、CSP、窗口与打包配置；
- 云端 BDB、旧 Catalog、搁置原生浏览/下载和 BLM 的产品假设；
- 旧导航、模块状态、版本号、产品文案和开发计划；
- `emptyGateway`、fixture-only 生产路径和手写双份 IPC 类型；
- 未经真实页面验证的 3D 背景、重动画与高资源占用视觉规则；
- 旧 App 图标和平台生成资源。

## 使用方式

开发新桌面切片时，一次只选择一个问题作为参考，例如焦点模型、任务状态或素材卡片；先写当前
验收，再对照旧实现，最后用 Electron 边界重新实现。不得把整个旧 `src/` 复制到
`apps/desktop`。
