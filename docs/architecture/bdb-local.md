# BDB Local 架构边界

> 状态：已接受的模块边界；内部模型待设计
> 范围：`crates/bdb-local`、`crates/acquisition` 与 Electron 浏览/下载适配器
> 更新：2026-09-01
> 规范效力：边界有；数据模型无

## 重建原则

BDB Local 从零设计。旧 `VUA_BDB` 的决策、Schema、爬虫、API、数据库、部署和测试均不迁移，
也不作为新实现的兼容目标。

## 模块职责

- 本地商品、子商品、作者、文件、协议、别名、兼容关系与来源记录；
- BOOTH 页面浏览和用户授权范围内的下载任务；
- 已下载文件、Warehouse 素材与来源商品之间的本地映射；
- 本地搜索、筛选、去重和人工修订；
- VN3 与普通服务条款的来源记录和筛选结果；
- BOOTH Library Manager、VRC Avatar Explorer 及未来工具的能力适配。

## 分层

```text
Electron acquisition adapter
  ├─ isolated browser/session
  ├─ navigation and permission policy
  └─ download events
          ↓ validated source observations
BDB Local application service
  ├─ normalization
  ├─ local identity and mapping
  ├─ search and filters
  └─ terms/compatibility evidence
          ↓
application-owned local database
```

远程 DOM、网页脚本、文件名和第三方工具记录都是来源观察，不直接等于规范实体。内部身份、去重和
兼容关系模型必须在真实页面与本地文件垂直切片之后确定。

## Session 与下载边界

- 用户登录、Cookie、订单和下载令牌只存在于 Electron 隔离 Session 和必要的本地安全存储；
- Orchestrator 与 React 不读取原始 Cookie；
- 下载必须由用户账号已经获得授权，不绕过购买、付费、年龄或访问验证；
- 下载任务记录来源、目标、状态、字节进度、可恢复条件和校验结果；
- 断点续传只有在来源服务器支持时声明可用；
- 下载文件先作为不可信 LocalArtifact 进入检查，不自动执行其中程序或脚本。

## 外部工具适配

VUA 原生浏览器和内容管理器是完整路径。BLM、VAE 等工具作为可选适配器并存：

- 优先使用公开、稳定、授权清晰的 API 或导入/导出格式；
- 不复制第三方登录会话或私有凭据；
- 不把第三方私有数据库结构变成 VUA 核心契约；
- 适配器不可用时，原生路径仍可完成核心流程；
- 每个适配器公开能力快照，而不是伪装成全功能兼容。

## 待固化事项

实体身份、SQLite Schema、页面观察格式、条款表示、兼容证据、下载持久化和插件读取面必须由新
BDB Local 垂直切片产生，不从旧 BDB 文档推导。
