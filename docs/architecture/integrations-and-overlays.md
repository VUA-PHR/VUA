# 第三方集成、插件与 Overlay 架构

> 状态：已接受
> 范围：项目管理、运行时工具、插件宿主、桌面/VR Overlay
> 更新：2026-09-01
> 规范效力：有

## 统一适配器模型

第三方工具是可替换适配器，不是 VUA 领域依赖。每个集成必须登记：

```text
上游与许可证
→ 用户问题与能力
→ 发现方式
→ 可选托管 / 外部连接模式
→ 支持版本与数据边界
→ 安装、更新、启动和卸载所有者
→ 权限、凭据与日志
→ 失败降级和人工路径
```

优先使用官方 API、CLI、OSC、配置或导入/导出格式。禁止依赖未授权私有数据库、复制登录会话、
反射内部实现或以 UI 自动化伪装稳定接口。

## 双模式集成

- **可选托管**：许可证允许时，由 VUA 下载或调用官方分发、校验、安装、更新、启动和监控；
- **外部连接**：发现用户独立安装的工具，通过公开边界连接，不接管其账号和内部状态。

每个模式独立报告能力；托管模式不可用不应阻止外部连接，第三方工具全部缺失也不能阻断 Recipe、
本地项目和恢复流程。

当前接受的集成方向包括：

- 项目管理：`vrc-get`/ALCOM 与 VCC；
- Avatar 构建：Modular Avatar、NDMF，候选 Avatar Optimizer；
- 运行时：SlimeVR Server、VRCFaceTracking、OpenVR Space Calibrator；
- 辅助工具：VRCX 的明确导入/导出与启动边界；
- Overlay：Valve OpenVR `IVROverlay` 的独立 SteamVR Dashboard helper。

## 插件宿主

插件通过版本化协议访问稳定服务：

- Manifest 声明身份、版本、入口、兼容范围和能力；
- 宿主负责启停、超时、取消、资源预算、日志与权限；
- 插件不能直接访问主 SQLite、Electron Session、Cookie、Rust 内部类型或 Unity Editor 对象；
- 敏感能力逐项授权，默认拒绝；
- 协议未知或能力不足时拒绝加载，不猜测兼容；
- 初始阶段不提供托管插件市场，也不自动运行未知来源插件。

插件执行模型尚未裁决。进程外、Wasm 或受信任原生插件必须通过单独安全 ADR 决定。

## Overlay 边界

桌面与 VR Overlay 共享同一教程/运行时展示状态，通过窄化 Surface Port 获取版本化快照并返回
语义动作。Overlay 不拥有任务和业务状态。

首个 VR 路径使用独立 SteamVR Dashboard helper 和公开 `IVROverlay`：

- 独立构建、独立进程、用户显式启动；
- 只接收显示快照，返回 `next`、`back`、`dismiss`、`open_on_desktop` 等语义动作；
- 不接收素材、Unity 项目、账号凭据或通用文件能力；
- IPC 具有帧长上限、版本握手、当前用户限制和进程监督；
- 未验证或不支持的运行时自动退回桌面 Overlay。

任何 Overlay 都不得注入 VRChat、挂钩 DirectX/Vulkan/OpenXR、安装影响 VRChat 的 API layer、读取
VRChat 进程内存/模块、修改 EAC 或自动确认账号、安全和上传界面。公开 OSC 输入属于不可信数据，
不能授权本地修改。

旧 SteamVR helper 的测试和故障经验可以作为迁移证据，但旧 Tauri 窗口、command 和 capability
实现不迁移到 Electron。
