# BDL 架构边界

[English](bdl_EN.md) | [简体中文](bdl_ZH.md)

> 状态：已接受的模块边界；内部模型待设计
> 范围：AMF 所属 BDL 模块
> 更新：2026-09-01
> 规范效力：模块边界有效；数据模型待定

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

## 外部工具数据

AMF 原生浏览器和内容管理器是完整路径。BLM、VAE 等工具作为 AMF 的可选适配器并存：

- 优先使用公开、稳定、授权清晰的 API 或导入/导出格式；
- 第三方登录会话和私有凭据保留在原所有者边界内；
- 第三方私有数据库结构保留在适配器内部；
- 原生路径独立完成核心流程；
- 每个适配器公开真实能力快照；
- 适配器数据经 AMF 验证后进入 BDL。

## 待固化事项

实体身份、SQLite Schema、页面观察格式、条款表示、兼容证据和 Warehouse 映射由新的 AMF +
BDL 垂直切片产生。BDL 第一阶段仅向 AMF 应用服务提供私有访问面；后续公开读取面需另行接受契约。
