# VUA 系统架构

[English](system_EN.md) | [简体中文](system_ZH.md)

> 状态：已接受
> 范围：VUA 全系统
> 更新：2026-09-02
> 规范效力：有

## 架构形态

VUA 是一个本地优先的桌面应用，采用单一 monorepo。小型 Node.js Kernel 负责 Electron 启动、
安全强制、Gateway 与 Orchestrator Provider 生命周期；本地 React UI 是受控表现层。可信产品行为
直接编译并连接到所属应用层，不引入通用模块注册、依赖图或运行时组合框架。社区扩展通过未来的
Plugin 能力边界工作，External 集成使用经审查的公开接口。

## 组件边界

```text
Electron Renderer（本地 React UI）
        ↓ 受限 contextBridge
Electron Main / Preload
        └─ Kernel（启动、安全、Gateway、Provider 托管、诊断）
        ↓ 版本化应用 Gateway
Rust Orchestrator Provider（托管方式可替换；应用用例、持久任务与端口）
        ├─ AMF 应用服务
        │      ├─ BDL
        │      ├─ 素材获取端口
        │      └─ Unity Bridge 作业
        ├─ 内置项目/环境/未来运行时适配器
        ├─ 能力强制的社区插件宿主
        └─ Overlay 服务
```

Kernel 拥有启动、Gateway、Provider 生命周期和桌面安全强制，不拥有通用业务模块系统。产品业务
规则位于应用层与领域层。Orchestrator 是可恢复业务流程的状态权威；AMF 拥有 Avatar 生产用例并
独占 BDL；Unity Bridge 执行已批准的 Unity 操作。

## 依赖方向

```text
View
  → Presentation model
  → typed Gateway
  → application use case
  → domain rule / outbound port
  ← adapter implementation
```

| 层 | 拥有 | 委托途径 |
| --- | --- | --- |
| View | 组件、布局、可访问性、输入绑定 | Presentation model 与类型化 Gateway |
| Presentation | 页面状态、导航、展示校验、意图映射 | Gateway 命令、查询与任务 |
| Kernel/Gateway | 启动、Provider 生命周期、安全强制、类型化命令、查询、事件与能力快照 | 应用用例 |
| Application | 用例、工作流、批准、恢复和协调 | 领域规则与端口 |
| Domain | Recipe、计划、状态转换和不变量 | 抽象端口 |
| Ports | 应用所需能力 | Adapter 实现 |
| Adapters | Electron、SQLite、文件、进程、Unity 和第三方接口 | 所属应用与领域契约 |

框架和供应商类型停留在适配器中。跨模块传输使用版本化 DTO；View 接收表现安全的值，数据库行、
Electron 对象、Orchestrator 私有类型和 Unity 内部对象由各自所有者持有。

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

检查和计划阶段只读；特权修改具有稳定 ID、幂等边界、过期输入检查和可恢复记录。Command 承载
意图，Event 通过类型化通道报告已提交事实。

## 数据所有权

- Orchestrator 持久层保存任务、Recipe、Build Record、项目和适配器执行状态；
- BDL 保存 AMF 所属的商品、协议、兼容关系、来源、搜索和 Warehouse 映射状态；物理上可以与
  其他本地数据共用 SQLite，但表与写入权限仍由 BDL 独占；
- 文件系统保存用户合法取得的素材、Unity 项目、快照和不可变作业文件；
- 远程网页 Session、Cookie、订单和下载凭据由 Electron 的隔离 Session 管理，只留在本机；
- Unity 项目内 `.vua` 作业目录保存版本化请求、结果和必要进度证据；
- Core 目录条目是直接随 VUA 构建的可信产品行为，并使用所属 Orchestrator 用例和端口；
- 社区插件完全通过隔离插件宿主中获批的版本化能力工作。

具体表结构、Wire format 与保留策略必须在对应版本化协议中定义。

## 失败与降级

- 离线模式保留本地素材、Recipe、项目恢复与 Unity 工作流；
- 第三方工具缺失或版本不兼容时，适配器返回能力缺失并保留手动路径；
- Orchestrator 已接受的任务在浏览器、Overlay 或 UI 重载后继续运行；
- 未知协议版本进入只读检查或人工模式；
- 诊断导出默认隐藏账户、主目录、令牌、Cookie 和付费素材文件名。
