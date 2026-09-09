# BDL 读面协议 v0.4（catalog＋warehouse＋已完成下载查询）

[English](bdl-queries-v0.4_EN.md) | [简体中文](bdl-queries-v0.4_ZH.md)

> 文档版本：0.4
> 状态：**已冻结（域内业务词表）**（2026-09-10）——provider-host
> `downloads.listCompleted` 路由待核心执行（与 bdl-commands v0.4 相同的
> 契约先行分工：数据角色先于 wire 批冻结域内词表；信封版本常量随核心接线
> 批升版）。完成接线前本方法不得声称端到端可用
> 机器可读词表：`schemas/bdl-queries/v0.4/`（Schema＋正负例向量；消费测试
> `crates/bdl-store/tests/downloads_list_serving.rs`；v0.1–v0.3 目录保留
> 勿改）
> 范围：v0.3 五方法（`catalog.list` / `catalog.detail` / `catalog.status` /
> `warehouse.listEntries` / `warehouse.entryDetail`）＋ M6 已完成下载采纳源
> 读面（`downloads.listCompleted`，proposal 015 §7 数据表态，已接受）
> 所有权边界：`docs/architecture/bdl_ZH.md`（BDL 是 AMF 私有本地模块；只存
> AMF 认可的数据，仅经 AMF 窄应用服务面暴露）；`docs/architecture/desktop_ZH.md`
> （渲染层不持有 Electron 或 BDL 对象）
> 更新：2026-09-10（v0.4：新增已完成下载采纳源查询）

## v0.4 修订（相对 v0.3）

proposal 015 §7 裁定的读面落地（已完成下载列表＝IMP-2 批 B 采纳源；数据
表态——读查询面而非渲染层聚合——随 015 对账被接受）：

1. **新增 `downloads.listCompleted`**（无参数）。列出**可采纳的已完成
   交付**：一个下载仅在以下两条同时成立时入列——
   - 其 BDL 下载事件折叠处于已完成交付
     （`DownloadEventConsumer::staging_completion`），且
   - 暂存文件物理在场且大小与完成交付自身上报一致。
   成员判定与 `warehouse.importDownloads` 采纳守卫消费的是**同一服务端
   事实**——列表即守卫的镜像：UI 所见即可采纳。暂存文件已消失或大小漂移
   的交付诚实缺席，绝不入列。
2. **行形状**（`downloadsListCompletedResult`）：`downloadId`（port 分配
   身份；采纳请求字段）、`sourceUrl`（完成交付的传输事实）、
   `suggestedFileName`（可空）、`receivedBytes`、`completedAt`、
   `adoptedWarehouseItemIds`——内容行携带该下载关联
   （`local_artifacts.download_id`）的仓储条目；空＝尚未采纳。写面不阻止
   重复采纳；UI 以该字段标注已采纳下载。**路径绝不出现**——storedPath 语义
   止于 AMF/BDL。
3. **不是下载状态呈现**：v0.3 原则继续成立——下载是可恢复任务，其状态呈现
   走全局任务契约九态。`downloads.listCompleted` 不呈现下载状态；它列出
   采纳入口的可采纳事实。v0.3「不新增 download.* 面」的声明自本版起限定于
   状态呈现语义；本读面是采纳入口数据源，随本版闭集承载。
4. **既有方法语义不变**：v0.3 五方法的 params/字段/结果与 v0.3 完全一致
   （schemaVersion 随词表升为 "0.4"）。

## 冻结范围与分工

本协议冻结 **operation 词汇、查询闭集、字段面与结果形状**。错误通道、请求
关联与传输信封属于版本化应用契约；信封版本常量
（`BDL_QUERIES_SCHEMA_VERSION`）与 provider-host 方法路由随核心接线批升版。
渲染层 TS 面由桌面角色登记。任一侧词表变更必须先升本协议版本。

## 方法面（六个只读方法）

| 方法 | 语义 | 消费方 |
| --- | --- | --- |
| `catalog.list` | 按查询的商品卡列表（分页） | 云端轨卡片墙 |
| `catalog.detail` | 单商品详情 | 详情抽屉 |
| `catalog.status` | 目录健康与修订快照 | 状态行／降级呈现 |
| `warehouse.listEntries` | 全部素材包条目卡 | 本地轨条目列表 |
| `warehouse.entryDetail` | 单条目逐工件检查事实 | 条目详情 |
| `downloads.listCompleted`（v0.4 新增） | 可采纳的已完成交付，带采纳关联 | 导入页：已完成下载列表＋采纳入口（IMP-2 批 B） |

观察管线落数据前 `catalog.list` 返回空集、`catalog.status.health =
unknown`；下载完成前 `downloads.listCompleted` 返回空集——空态即终态。

## downloads.listCompleted 语义

- 无参数；params 面闭合（`additionalProperties: false`）——客户端给过滤
  ＝契约错误，绝非静默空答（负例向量钉死）；
- 行按 `completedAt` 升序（确定性排序）；
- 守卫镜像性质：行在列 ⇒ `warehouse.importDownloads` 接受该 `downloadId`
  （仅列表返回后的竞态窗口除外）；行缺席 ⇒ 采纳任务会拒绝它
  （`downloadNotCompleted` / `stagingFileMissing`）——UI 无需自行拼装
  「可采纳」判据；
- 重复采纳在写面仍可能（copy-in、无去重——与批量导入语义一致）；
  `adoptedWarehouseItemIds` 字段是 UI 使用的诚实标记。

## 依赖方向

```text
React View（导入页：已完成下载列表＋采纳入口）
  → 只读窄端口（acquire-port）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约
  → AMF 应用服务（本协议的 provider）
  → BDL 本地数据库（只读）
```

## 机器可读词表

`schemas/bdl-queries/v0.4/`：`query.schema.json` + `result.schema.json` +
`examples/`（6 请求＋6 结果＋5 负例：v0.3 三负例随版沿用——实体过滤参数、
自由格式可用性过滤值、非法 kind 枚举值——外加词表外 params 键与 v0.3 版本
重放；均须被拒）。消费测试：
`crates/bdl-store/tests/downloads_list_serving.rs`（向量驱动真实读面；守卫
镜像性质、诚实空态、采纳关联与无路径规则全部钉死）。词表或字段变更必须升
版本，绝不原地改写。

## 开放项

- 实体/关系区与实体类型词表：随 BDL v2（V2-3/V2-4，待产品所有者裁定）；
- `executables` 列表：随检查挂钩切片；
- `catalogUpdatedSeq` 记账：随观察管线切片；
- 任务级重试命令形状：应用契约演进项；
- 新鲜度（`stale`）：随 G13 写路径。
