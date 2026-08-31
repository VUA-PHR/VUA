# VUA 系统架构

> 状态：已接受
> 范围：VUA 全系统
> 更新：2026-09-01
> 规范效力：有

## 架构形态

VUA 是一个本地优先的模块化单体，采用单一 monorepo。Electron 桌面应用、Rust Orchestrator、
本地 BDB、AMF、Unity Bridge、Overlay 与第三方适配器分别拥有清晰边界，但共同交付一个桌面
产品。旧 `VRC_Ultra_assistant` 与 `VUA_BDB` 仓库不属于新系统运行时或依赖图。

## 进程边界

```text
Electron Renderer（本地 React UI）
        ↓ 受限 contextBridge
Electron Main / Preload（窗口、远程网页、Session、下载、桌面适配器）
        ↓ 版本化本地 IPC
Rust Orchestrator（应用用例、持久任务、端口与适配器协调）
        ├─ SQLite 与应用文件
        ├─ BDB Local
        ├─ 项目/环境/运行时适配器
        ├─ 插件宿主
        ├─ Unity Bridge 作业
        └─ 独立 Overlay helper
```

Renderer、远程网页、插件和 Unity Editor 均不是业务状态的权威来源。Electron Main 负责桌面与
浏览器能力适配；Rust Orchestrator 负责可恢复业务流程；Unity Bridge 只执行已经批准的 Unity
操作。

## 依赖方向

```text
View
  → Presentation model
  → typed Gateway
  → application use case
  → domain rule / outbound port
  ← adapter implementation
```

| 层 | 拥有 | 禁止拥有 |
| --- | --- | --- |
| View | 组件、布局、可访问性、输入绑定 | Recipe 规则、权限判断、任务恢复 |
| Presentation | 页面状态、导航、展示校验、意图映射 | 文件、进程、数据库和 Unity 操作 |
| Gateway | 类型化命令、查询、事件和能力快照 | 业务决策与供应商细节 |
| Application | 用例、工作流、批准、恢复和协调 | Electron/React/Unity 具体类型 |
| Domain | Recipe、计划、状态转换和不变量 | Windows、网络、数据库和第三方库 |
| Ports | 应用所需能力 | 具体实现 |
| Adapters | Electron、SQLite、文件、进程、Unity 和第三方接口 | 跨模块产品规则 |

框架和供应商类型停留在适配器中。跨模块传输使用版本化 DTO；不把数据库行、Electron 对象、
Unity 内部对象或任意命令字符串暴露给 View。

## 交互模型

- **Command** 表达可能改变状态的意图；
- **Query** 返回带 revision 的只读快照；
- **Event** 报告事务提交后已经发生的事实；
- **Task/Channel** 承载可取消的长任务进度，不把组件生命周期当作任务生命周期；
- **Capability** 说明当前机器、上游版本和授权条件下真实可用的能力。

默认修改流程为：

```text
Inspect → Plan → Confirm → Snapshot → Execute → Validate
                                      ↘ Recover / Manual handoff
```

检查和计划阶段只读；特权修改必须具有稳定 ID、幂等边界、过期输入检查和可恢复记录。事件不能
替代命令，也不能形成无类型的全局消息总线。

## 数据所有权

- SQLite 保存本地产品状态、任务、Recipe、Build Record、项目、素材索引和适配器记录；
- 文件系统保存用户合法取得的素材、Unity 项目、快照和不可变作业文件；
- 远程网页 Session、Cookie、订单和下载凭据由 Electron 的隔离 Session 管理，只留在本机；
- Unity 项目内 `.vua` 作业目录保存版本化请求、结果和必要进度证据；
- 插件只能通过获批服务访问数据，不能直接打开主数据库。

具体表结构、Wire format 与保留策略必须在对应版本化协议中定义。

## 失败与降级

- 网络不可用不能阻断本地素材、Recipe、项目恢复与 Unity 工作流；
- 第三方工具缺失或版本不兼容时，适配器返回能力缺失并保留手动路径；
- 浏览器、Overlay 或 UI 重载不能取消已由 Orchestrator 接受的任务；
- 未知协议版本进入只读检查或人工模式，不能猜测执行；
- 诊断导出默认隐藏账户、主目录、令牌、Cookie 和付费素材文件名。
