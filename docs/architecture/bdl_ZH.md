# BDL 架构边界

[English](bdl_EN.md) | [简体中文](bdl_ZH.md)

> 文档版本：1.1.0
> 状态：已接受
> 权威语言：简体中文（EN 为镜像，同步至 1.1.0）
> 范围：AMF 所属 BDL 模块
> 更新：2026-09-08
> 最近符合性复核：2026-09-08
> 规范效力：有

## 所属关系

BDL（Booth Database Local）是 AMF 的内部本地数据模块，只对 AMF 应用服务负责。Renderer、
Orchestrator 的其他用例、环境部署、项目管理、Overlay 和插件统一通过 AMF 用例取得所需结果。

BDL 的内部模型从当前 AMF 用例和真实纵向切片出发设计。

## 模块职责

- 管理本地商品、子商品、作者、文件、协议、别名、兼容关系与来源记录；
- 维护已下载文件、Warehouse 素材与来源商品之间的本地映射；
- 为 AMF 提供本地搜索、筛选、去重和人工修订能力；
- 保存 VN3 与普通服务条款的来源记录和筛选结果；
- 接收 AMF 已验证的来源观察和下载结果元数据。

浏览器、Session、下载任务、下载传输、BLM/VAE 适配器和用户界面属于 AMF 的素材获取与内容管理
边界；BDL 保存 AMF 决定持久化的规范化元数据。

## 分层

```text
AMF acquisition / content-management service
  ├─ native browser and authorized downloads
  ├─ BLM / VAE adapters
  └─ source validation and mapping decisions
          ↓ validated observations and result metadata
BDL application service
  ├─ normalization
  ├─ local identity and mapping
  ├─ search and filters
  └─ terms/compatibility evidence
          ↓
BDL-owned local database boundary
```

远程 DOM、网页脚本、文件名和第三方工具记录作为来源观察进入 AMF。内部身份、去重和兼容关系
模型由真实页面与本地文件的纵向切片确定。

## 与素材获取模块的边界

- 用户登录、Cookie、订单和下载令牌由 Electron 隔离 Session 的桌面机制持有；AMF 接收完成
  素材获取用例所需的规范化事件、来源观察和下载结果元数据，BDL 接收获准持久化的元数据子集；
- 浏览与下载任务的来源、目标、进度、恢复和校验由 AMF 素材获取模块负责；
- 下载文件先作为不可信 LocalArtifact 进入 AMF 检查，通过检查后进入后续流程；
- 检查完成后，AMF 可以向 BDL 提交来源商品、文件身份、校验摘要和 Warehouse 映射；
- BDL 返回搜索、协议和兼容性结果；Electron 与 AMF 保持 Session 和下载控制权。

## 观察数据写入面（W17，2026-09-08）

观察管线（G13 写路径，未来切片）是把观察事实写入 BDL products 表的调用方；其存储侧
写入面（`crates/bdl-store` 的 `record_product_observation`）随 W17 先行落地，语义如下：

- **upsert 语义**：一次观察 = products 表一行最新事实（`INSERT … ON CONFLICT DO UPDATE`
  全列覆盖）；重复重放同一观察安全（同内容覆盖，不产生第二行）。API 不提供删除——
  行只能被更新观察改变；墓碑（`status: missing`，404/410 保留记录）是合法观察结果，
  永不被物理删除，且永不被目录面作为卡片服务。
- **簿记计数器**：每次成功写入在同一事务内递增 `bdl_meta.catalog_updated_seq`（首写
  初始化为 1）。`catalog.status` 的 health 据此从 `unknown` 转 `ok`，计数随
  `revision.catalogUpdatedSeq` 出线（bdl-queries v0.3 既有语义）。
- **写入侧闭集**（违反即拒绝，`InvalidObservation`）：身份 = `booth:<native 数字>`
  且两部分一致；`content_hash = sha256:<64 hex>`；`observed_at` 与
  `processor_version` 为必填证据；价格 amount/currency 成对准入（主商品与子商品同
  规则）；`adult` 仅显式 BOOTH Adult 徽标为真。
- **读面消费**：catalog 读组装自此消费观察列——`title`/`price`/`imageUrl`（恒等于
  `imageUrls[0]`）与 availability 双字段（`availabilityRaw` 原词出线、
  `availabilityStatus` 按 v0.2 版本化规则表读取期派生，永不存储）进卡片与详情；
  `catalog.list` 的 text 过滤 = title＋productId 子串（协议面不变）。观察数据落地前
  的诚实空态语义不变（空态即终态）。
- **范围声明**：本写入面只服务 products 表。`term_observations` 与
  `compatibility_observations` 无目录消费方，随其 BDL v2 词表切片另行落地；
  实体/关系存储（`entityCount`/`entityTypes` 诚实空槽）与新鲜度（`stale`）仍属
  BDL v2 与 G13 写路径，不在本面。

## 外部工具数据

AMF 原生浏览器和内容管理器是完整路径。BLM、VAE 等工具作为 AMF 的可选适配器并存：

- 优先使用公开、稳定、授权清晰的 API 或导入/导出格式；
- 第三方登录会话和私有凭据保留在原所有者边界内；
- 第三方私有数据库结构保留在适配器内部；
- 原生路径独立完成核心流程；
- 每个适配器公开真实能力快照；
- 适配器数据经 AMF 验证后进入 BDL。

## 落地状态（2026-09-08 复核）

首版持久格式与查询契约已由 B4 切片落地：`schemas/bdl/v0.1`（BDL SQLite 持久格式）与
`schemas/bdl-queries/`（查询契约，已升至 v0.3），实现位于 `crates/bdl-store`（crate
拆分后自 `crates/orchestrator` 迁出）；catalog 服务面（W12）、仓库命令面（W8/W14）与
provider 路由（W12 收口）已在 M4 闭环。观察数据写入面随 W17 落地（见上节）。访问面
仍仅向 AMF 应用服务开放；后续公开读取面需另行接受契约。实体身份、条款表示与兼容证据
的进一步演进随新的 AMF + BDL 垂直切片升版。

## 文档变更日志

- 1.1.0（2026-09-08）：新增「观察数据写入面」节（W17：upsert＋簿记计数器＋写入侧
  闭集＋读面消费观察列＋范围声明）；落地状态复核修正实现位置（`crates/bdl-store`）。
- 1.0.0（2026-09-06）：纳入版本管理；"待固化事项"改写为落地状态（`schemas/bdl/v0.1` 与
  bdl-queries 查询契约 v0.3 已由 B4 落地）；头部状态随实态更新为已接受。
