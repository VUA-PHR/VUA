# BDL 读取面协议 v0.3（catalog 与 warehouse 查询）

[English](bdl-queries-v0.3_EN.md) | [简体中文](bdl-queries-v0.3_ZH.md)

> 状态：**已冻结**（2026-09-06）——取代 v0.2（唯一变更见"v0.3 修订"）；
> 机器可读词表见 `schemas/bdl-queries/v0.3/`
> 范围：AMF 从本地 BDL 出的五个只读查询方法——云端目录三方法（catalog.*）与
> 本地轨两方法（warehouse.*）——及 LocalArtifact 检查结论的三态呈现映射
> 所有权边界：`docs/architecture/bdl_ZH.md`（BDL 是 AMF 私有本地模块，只存 AMF
> 批准持久化的数据，只经 AMF 应用服务出窄口）；`docs/architecture/desktop_ZH.md`
> （渲染层不持任何 Electron/BDL 对象）
> 更新：2026-09-06

## v0.3 修订

产物模式设置六问裁决（`docs/plans/b4-artifact-mode-requirements-to-f` 与 B 回执）
的读取面落点：

1. **artifact-mode 双读取字段**：条目卡与条目详情新增
   `artifactMode`（`use_original_unitypackage` / `generate_vpm` / null——每条目
   覆盖，null = 跟随全局）与 `effectiveArtifactMode`（动态解析结果：覆盖 ??
   全局默认，全局默认由服务层在查询时注入——shell 设置不进 BDL，解析是查询期
   事实，不是导入时刻快照）。
2. **模式是消费偏好**：偏好 VPM 不代表 VPM 已生成；未生成时条目如实呈现
   "偏好 VPM（尚未生成）"，可消费的仍只有原始工件，不存在"静默落回"。
   模式设置（`warehouse.setArtifactMode`）、生成（`warehouse.generateVpm`）、
   受守卫删除（`warehouse.deleteOriginals`）走应用契约命令面（M3 后演进登记），
   **不进本读取面协议**。
3. **副本角色位**：工件引用与事实新增 `role`（`original` / `generated_vpm`）——
   生成的 VPM 包与原始素材在条目内平级（裁决 5）；delete-originals 流只移除
   `original` 角色的副本（行与物理文件）并保留 `generated_vpm`。
4. **kind 词表收敛**：条目 `kind` 收敛为 `imported_material` |
   `downloaded_material`（下载条目是 download-events 协议既有的 warehouse 映射
   去处）；其他取值是契约错误。

其余词表、字段与方法面与 v0.2 完全一致；v0.2 文档保留为历史
（`schemas/bdl-queries/v0.2/` 勿改）。

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
- `entityType` / `relationKind` **不在闭集内**：v0.3 无实体/关系存储，收到即
  契约错误，绝不静默空答；
- 墓碑商品（`status: missing`，404/410 保留记录）**不是目录卡**：list 不返回，
  detail 不服务——墓碑属观测侧数据。

`catalog.list` 条目字段（`CatalogProductSummary`）：
`productId`（`booth:<id>` 命名空间）、`title`、`price`（`{amount, currency}` 或
null——仅单价商品；变体价在 detail 的 `subproducts`；缺价/多币种如实 null，不
猜测不折算）、`imageUrl`（恒等于 `imageUrls[0]` 或 null）、`imageUrls`（观测源
URL 原样，经 vuaimg 缓存协议承载——**AMF 出 URL，不返回内嵌句柄或本地路径**）、
`availabilityRaw` / `availabilityStatus`（v0.2 双字段：原词证据 + 处理器按
版本化规则表派生的稳定枚举）、`entityCount`（恒 `0`）、`entityTypes`
（恒 `[]`——诚实空槽，实体存储属 BDL v2）。

`catalog.detail` 增量字段：`description`、`shopName` / `shopUrl`、
`ageRestriction`、`adult`（仅显式 BOOTH Adult 徽标为真）、`videoUrls`、
`sourceCategory`（BOOTH 展示分类，无推断）、`subproducts`（`variationId` / 
`name` / `price` / `availabilityRaw` / `availabilityStatus`）。实体区/关系区
**不进 v0.3**；三关系词（`compatible_with/addon_for/requires`）的词表冻结随
V2-3 关系边词表成文。`compatibility_observations.raw_quote` **不进目录面**。

`catalog.status`：`health`（三态 `unknown` / `ok` / `incompatible`——最后者即
BDL 版本防线拒绝存储；`corrupted` 与 `stale` 为渲染层预留态，永不发送）+
`revision`（`catalogUpdatedSeq`: number | null——观察管线簿记计数器落地前恒
null；`datasetRevision`: string，= BDL format_version）。

## warehouse 条目面

`warehouse.listEntries` 条目卡：`warehouseItemId`（VUA 生成身份）+ `folderName`
（仓库根下文件夹名，即本地身份）+ `displayName` + `kind`（闭集：
`imported_material` | `downloaded_material`）+ `artifactMode`（覆盖，可空）+
`effectiveArtifactMode`（动态解析）+ `createdAt` + `artifacts`（逐件：
`relativePath` + `artifactSha256` + 三态 `state` + `sizeBytes` + `role`）。

`warehouse.entryDetail` 逐工件检查事实：上述字段 + `suggestedFileName`、
`inspectedAt`（机械判定时刻；pending 时 null）、`rejectionReason`（诚实判定
文本；仅 quarantined 非空）、`sourceCorrelated`（`artifact_mappings` 存在
布尔）、`mappedProductIds`（已映射商品身份列表）+ `role`。

- **`storedPath` 不进渲染面**——路径语义止于 AMF/BDL，用户不翻磁盘（裁决 3）；
- 工件按 `role` 如实呈现在场事实（原始在场/已删、VPM 在场/未生成），删除事实
  在任务回执审计里，不另造墓碑态；
- **产物模式命令面（`setArtifactMode` / `generateVpm` / `deleteOriginals`）
  走应用契约**，随 M3 后契约演进登记，不进本读取面协议。

## LocalArtifact 三态映射

| 线上三态 | BDL 存储四态 |
| --- | --- |
| `pending` | `untrusted`（传输完成未检查）或 `inspected`（机械检查过、待 AMF 准入决定） |
| `clean` | `admitted` |
| `quarantined` | `rejected`（必带诚实拒绝原因） |

`executables`（检出可执行内容清单）**恒空数组**——检查钩子在下载事件协议中是
接口占位，随检查钩子切片升版填充。下载状态呈现**不走本协议**：下载 = 可恢复
任务，走全局任务契约九态；"重试"以任务级动作呈现、由 AMF 裁决，无新增
download.* 面。

## 机器可读词表

`schemas/bdl-queries/v0.3/`：`query.schema.json` + `result.schema.json` +
`examples/`（5 请求 + 5 响应 + 3 负例：实体过滤参数、自由词 availability 筛选、
非法 kind 枚举值必须被拒）。双端 fixture：Rust 侧 `contracts.rs` +
`bdl_queries.rs` + `bdl_store.rs`（读取面聚合即 wire 形状）；F 侧随冻结登记。
词表或字段变更须升版，不得原地改写。

## 开放项

- 实体区/关系区与实体类型词表：随 BDL v2（V2-3/V2-4，待产品所有者裁决）；
- `executables` 清单：随检查钩子切片；
- `catalogUpdatedSeq` 簿记：随观察管线切片；
- 产物模式命令面：随 M3 后契约演进（六问裁决已放行，见 B 回执）；
- 任务级 retry 命令形状：应用契约演进项，B 侧定义；
- 新鲜度（`stale`）：随 G13 写路径。
