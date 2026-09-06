# BDL 读取面协议 v0.2（catalog 与 warehouse 查询）

[English](bdl-queries-v0.2_EN.md) | [简体中文](bdl-queries-v0.2_ZH.md)

> **⚠️ 已被 v0.3 取代（2026-09-06）**：artifact-mode 双读取字段、副本角色位、
> kind 词表收敛。现行规范见 [bdl-queries-v0.3_ZH.md](bdl-queries-v0.3_ZH.md)；
> 本文仅作历史保留，对应 `schemas/bdl-queries/v0.2/`（勿改）。
>
> 文档版本：0.2
> 状态：已冻结（2026-09-06）——取代 v0.1（唯一变更见"v0.2 修订"）；
> 机器可读词表见 `schemas/bdl-queries/v0.2/`
> 范围：AMF 从本地 BDL 出的五个只读查询方法——云端目录三方法（catalog.*）与
> 本地轨两方法（warehouse.*）——及 LocalArtifact 检查结论的三态呈现映射
> 所有权边界：`docs/architecture/bdl_ZH.md`（BDL 是 AMF 私有本地模块，只存 AMF
> 批准持久化的数据，只经 AMF 应用服务出窄口）；`docs/architecture/desktop_ZH.md`
> （渲染层不持任何 Electron/BDL 对象）
> 更新：2026-09-06（已废弃，见顶部横幅）

## v0.2 修订

availability 从单字段（观测原词透传 + 原词精确匹配筛选）修订为**双字段**：

- `availabilityRaw: string | null`——页面观察原词，证据与详情展示用，永不归一化；
- `availabilityStatus: available | unavailable | unknown`——由 AMF/BDL 处理器按
  **版本化规则表**派生；UI 徽标与筛选**只消费稳定枚举**；渲染层不猜测、不派生。

动机：纯原词透传下，`InStock`、完整 schema.org URL、大小写变体会碎片化成不同
筛选项，国际化界面还会直接暴露平台内部词。派生方是数据所有者（AMF/BDL），
不是渲染层——与"渲染层不猜测"纪律一致。

**派生规则表（v0.2，随协议版本化；变更须升版）**：对原词取末段并小写比较
（`https://schema.org/InStock` 与 `InStock` 同判）：

| 原词（末段，小写） | availabilityStatus |
| --- | --- |
| `instock`、`limitedavailability`、`instoreonly` | `available` |
| `outofstock`、`soldout`、`discontinued` | `unavailable` |
| 其余一切原词、null | `unknown`（raw 原样保留） |

其余词表、字段与方法面与 v0.1 完全一致；v0.1 文档保留为历史
（`schemas/bdl-queries/v0.1/` 勿改）。

## 依赖方向

```text
React View（WarehousePage 双轨 / G8 图册组件）
  → 只读窄端口（catalog-browser-port / acquire-port）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约
  → AMF 应用服务（本协议的提供方）
  → BDL 本地数据库（只读）
```

渲染层永不直接触达 BDL；错误通道、请求关联与传输信封归应用契约所有，本协议
只冻结**操作词表、查询闭集、字段面与结果形状**。

## 方法面（五个只读方法）

| 方法 | 语义 | 消费面 |
| --- | --- | --- |
| `catalog.list` | 按查询条件返回商品卡列表（含分页） | 云端目录卡片墙 |
| `catalog.detail` | 返回单商品详情 | 详情抽屉 |
| `catalog.status` | 目录健康与修订快照 | 状态行/降级呈现 |
| `warehouse.listEntries` | 返回全部素材包条目卡 | 本地图册条目列表 |
| `warehouse.entryDetail` | 返回单条目逐工件检查事实 | 条目详情 |

catalog 数据源 = **本地 BDL 离线读取**；观察管线未落数据前 `catalog.list` 返回
空集、`catalog.status.health = unknown`——空态即终态。G13 写路径（激活/在线
回退/增量同步）不进本协议。

## catalog 查询条件与字段面

`catalog.list` 查询闭集 = `{ text, availabilityStatus, limit, offset }`（全部可选）：

- `text`：标题与 productId 的不区分大小写子串匹配；缺省不过滤；
- `availabilityStatus`：对**派生稳定枚举**精确匹配；缺省不过滤；
- `limit`（1–200，默认 50）/ `offset`（默认 0）：卡片墙分页；
- 条目顺序 = `productId` 升序（身份派生、分页确定性）；
- `entityType` / `relationKind` **不在闭集内**：v0.2 无实体/关系存储，收到即
  契约错误，绝不静默空答；
- 墓碑商品（`status: missing`，404/410 保留记录）**不是目录卡**：list 不返回，
  detail 不服务——墓碑属观测侧数据。

`catalog.list` 条目字段（`CatalogProductSummary`）：
`productId`（`booth:<id>` 命名空间）、`title`、`price`（`{amount, currency}` 或
null——仅单价商品；变体价在 detail 的 `subproducts`；缺价/多币种如实 null，不
猜测不折算）、`imageUrl`（恒等于 `imageUrls[0]` 或 null）、`imageUrls`（观测源
URL 原样，经 vuaimg 缓存协议承载——**AMF 出 URL，不返回内嵌句柄或本地路径**）、
`availabilityRaw` / `availabilityStatus`（双字段，见"v0.2 修订"）、
`entityCount`（恒 `0`）、`entityTypes`（恒 `[]`——诚实空槽，实体存储属 BDL v2）。

`catalog.detail` 增量字段：`description`、`shopName` / `shopUrl`、
`ageRestriction`、`adult`（仅显式 BOOTH Adult 徽标为真）、`videoUrls`、
`sourceCategory`（BOOTH 展示分类，无推断）、`subproducts`（`variationId` / 
`name` / `price` / `availabilityRaw` / `availabilityStatus`）。实体区/关系区
**不进 v0.2**；渲染层保持 not-connected 同级空态；三关系词
（`compatible_with/addon_for/requires`）的词表冻结随 V2-3 关系边词表成文。
"库外实体规范名 null 回落"接受为 v2 形状规则。
`compatibility_observations.raw_quote` **不进目录面**——未经人工确认的语义不进
浏览 UI（IN-3 面的数据归 IN-3）。

`catalog.status`：`health`（三态 `unknown` / `ok` / `incompatible`——最后者即
BDL 版本防线拒绝存储；`corrupted` 与 `stale` 为渲染层预留态，v0.2 永不发送）+
`revision`（`catalogUpdatedSeq`: number | null——观察管线簿记计数器落地前恒
null；`datasetRevision`: string，= BDL format_version）。`sourceUpdatedSeq`
已永久删除：它源自 G13 时代的新鲜度问题，该问题只有在存在刷新路径时才成立；
G13 落地时由自己的同步簿记回答，不复活死列名。

## warehouse 条目面

`warehouse.listEntries` 条目卡：`warehouseItemId`（VUA 生成身份）+ `folderName`
（仓库根下文件夹名，即本地身份）+ `displayName` + `kind`（条目工件族）+
`createdAt` + `artifacts`（逐件：`relativePath` + `artifactSha256` + 三态
`state` + `sizeBytes`）。

`warehouse.entryDetail` 逐工件检查事实：上述字段 + `suggestedFileName`、
`inspectedAt`（机械判定时刻；pending 时 null）、`rejectionReason`（诚实判定
文本；仅 quarantined 非空）、`sourceCorrelated`（`artifact_mappings` 存在
布尔）、`mappedProductIds`（已映射商品身份列表）。

- **`storedPath` 不进渲染面**——路径语义止于 AMF/BDL，用户不翻磁盘（裁决 3）；
- 副本清单**不标注角色**（原始包 vs 生成包）：角色位随 B4-7 升版；
- **产物模式设置（写路径）不属本协议**——它是带审计的破坏性设置（生成后删
  原始），归后续切片，届时另行冻结。

## LocalArtifact 三态映射

| 线上三态 | BDL 存储四态 |
| --- | --- |
| `pending` | `untrusted`（传输完成未检查）或 `inspected`（机械检查过、待 AMF 准入决定） |
| `clean` | `admitted` |
| `quarantined` | `rejected`（必带诚实拒绝原因） |

`executables`（检出可执行内容清单）**恒空数组**——检查钩子（归档内容扫描）
在下载事件协议中是接口占位，随检查钩子切片升版填充。大小 null 只出现在传输
未完成阶段；预览图未提取为空数组。下载状态呈现**不走本协议**：下载 = 可恢复
任务，走全局任务契约九态；"重试"以任务级动作呈现、由 AMF 裁决（应用契约层的
retry 类命令由 B 侧定义，幂等指纹仿 production.*），无新增 download.* 面。

## 与种子允许清单的对齐

隔离会话基座（`https://booth.pm`）复核：v0.2 catalog 字段携带的 URL 全部为
BOOTH 页面及其嵌入媒体的原样观测 URL；图床等嵌入媒体主机名以真实观测为准，
由 F 侧 security 层在 F4-5 live 前枚举复核，本协议不固化主机名清单。

## 机器可读词表

`schemas/bdl-queries/v0.2/`：`query.schema.json`（操作词表 + 查询闭集）、
`result.schema.json`（五方法结果形状）、`examples/`（5 请求 + 5 响应 + 2 负例：
实体过滤参数与非法 availabilityStatus 枚举值必须被拒）。双端 fixture：Rust 侧
`contracts.rs` + `bdl_queries.rs`（操作枚举、三态映射与 **availability 派生
函数**锚点——派生规则表的可执行形态）；F 侧随冻结登记 contracts 类型 +
Kernel 路由臂（仿 production.* 两步）。词表或字段变更须升版，不得原地改写。

## 开放项

- 实体区/关系区与实体类型词表：随 BDL v2（V2-3/V2-4，待产品所有者裁决）；
- `executables` 清单：随检查钩子切片；
- `catalogUpdatedSeq` 簿记：随观察管线切片；
- 副本角色位（原始包 vs 生成包）：随 B4-7；
- 新鲜度（`stale`）：随 G13 写路径，由其同步簿记回答；
- 任务级 retry 命令形状：应用契约演进项，B 侧定义。
