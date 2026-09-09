# BDL 仓储写命令协议 v0.4（v0.3 ＋下载落库）

[English](bdl-commands-v0.4_EN.md) | [简体中文](bdl-commands-v0.4_ZH.md)

> 文档版本：0.4
> 状态：**已冻结（域内业务词表）**（2026-09-09）——provider-host
> `warehouse.importDownloads` 路由待核心执行（C-1 分流：数据角色冻结域内词表、
> 核心角色拥有 wire 路由、集成角色仲裁跨角色分歧）；渲染层 TS 面由桌面角色登记。
> 完成接线前采纳命令不得声称端到端可用
> 机器可读词表：`schemas/bdl-commands/v0.4/`（Schema＋正负例向量；消费测试
> `crates/acquisition/tests/import_downloads_contract_v04.rs`；v0.1–v0.3 目录
> 保留勿改）
> 范围：v0.3 全部五命令（`warehouse.setArtifactMode` /
> `warehouse.generateVpm` / `warehouse.deleteOriginals` /
> `warehouse.setGlobalDefaultMode` / `warehouse.import`）＋ M6 下载落库
> （`warehouse.importDownloads`，用户裁决 U7-③／IMP-3 契约先行）
> 所有权边界：`docs/architecture/bdl_ZH.md`（BDL 是 AMF 私有本地模块）；写命令的服务端
> 事实（守卫、任务化、审计）实现在 `crates/acquisition`（采纳流、维护流与导入流）与
> `crates/bdl-store`（存储面）
> 更新：2026-09-09（v0.4：新增下载落库）

## v0.4 修订（相对 v0.3）

M6 增设阶段裁决（用户裁决 U7-③：下载落库归数据域 bdl-commands 新契约；
IMP-3 契约先行，冻结硬前置不豁免）的协议面：

1. **新增 `warehouse.importDownloads`**（任务化）：把已完成的下载批量采纳进
   仓储。`params: { downloadIds }`——port 分配的下载身份（minItems 1），一个
   id＝一个已完成下载＝一个 `downloaded_material` 条目；一条命令＝一个采纳
   任务（逐下载进度、下载边界取消、失败快停保留已采纳条目）。受理载荷与任务
   面命令同构：`{ taskId, correlationId }`。**仅身份**：请求绝不携带路径、
   大小、文件名或任何关于下载的客户端断言——每个交付事实（暂存路径、上报
   大小、建议文件名）都在服务端从 BDL 自有下载事件日志解析
   （`DownloadEventConsumer::staging_completion`）。仓储根（warehouse root）
   是 provider 环境配置，**绝不是请求字段**。完成载荷（逐下载报告＋创建的
   条目身份）走应用契约任务面。
2. **采纳语义（copy-in 复制入库）**：暂存文件被复制进条目后原样保留——暂存
   清理**不是**本命令的语义，不在本版冻结范围内。内容身份由 AMF 计算（对
   副本做 SHA-256，与批量导入同一管线）；传输关联经
   `local_artifacts.download_id` 闭合。内容→来源产品的映射
   （`artifact_mappings`，边界 IN-4）仍归 AMF 来源解析职责，刻意不进本命令：
   请求若断言产品，即是对 AMF 事实的客户端断言。
3. **条目 kind**：采纳下载落为 `downloaded_material`——冻结的 BDL v0.1 词表
   （`warehouse_items.kind`）已预留该值。显示名取交付的建议文件名词干
   （依次回退：暂存文件名词干、下载 id）；条目身份恒为 VUA 生成，绝不从
   显示名派生。
4. **刻意不含自动生成编排**：下载采纳是否触发与导入时生成挂点（proposal 010
   路径 A）同款的编排，尚未裁决，v0.4 **不冻结**该语义；v0.4 采纳面仅为手动
   面。未来编排决策必须先升本协议版本。
5. **主机域清单是运行时策略，绝非契约**：本 Schema 保持 host 无关（C-3
   裁定）——下载域准入是运行时策略，循「真机验证→逐域提案→用户批准」程序
   （用户裁决 U7-②），绝不是本契约的字段。
6. **既有命令语义不变**：v0.3 五命令的 params/受理/完成载荷、守卫、审计与
   v0.3 完全一致（schemaVersion 随词表升为 "0.4"）。

## 冻结范围与分工

本协议冻结命令的**业务词表**：operation 闭集、params、受理载荷、任务完成
载荷形状与稳定错误码。传输信封（requestId / commandId / 任务事件）属于版本化
应用契约，由核心角色在 provider-host 登记为方法路由；渲染层 TS 面由桌面角色
登记。任一侧词表变更必须先升本协议版本。

## 命令语义

1. **`warehouse.setArtifactMode`**（同步）：条目级覆盖写/清。`params:
   { warehouseItemId, mode }`，null＝清除（回落 `override ?? 全局默认`）。
   受理载荷即结果：`{ warehouseItemId, effectiveMode }`——查询时事实。
2. **`warehouse.setGlobalDefaultMode`**（同步）：持久化两级选项的全局档
   （bdl_meta）；条目覆盖优先。
3. **`warehouse.generateVpm`**（任务化）：`params: { warehouseItemId,
   importCorrelationId? }`。守卫、审计与完成载荷与 v0.3 一致；
   `importCorrelationId` 仅由导入编排填入。
4. **`warehouse.deleteOriginals`**（任务化）：与 v0.3 一致。
5. **`warehouse.import`**（任务化）：与 v0.3 一致（素材包文件夹批量导入，
   copy-in，逐 folder 进度）。
6. **`warehouse.importDownloads`**（任务化，v0.4 新增）：`params:
   { downloadIds }`。任务逐下载对 BDL 事件日志解析交付事实，把暂存文件复制
   进新建的 `downloaded_material` 条目，对副本哈希，并随下载关联
   （`local_artifacts.download_id`）登记内容行。逐下载进度事件；下载边界
   取消（Cancelled 退出；持久部分状态可经 `warehouse.listEntries` 查询）；
   失败快停保留已采纳条目。完成载荷＝逐下载报告（创建的条目身份、文件名、
   内容身份）。守卫见下。

## 服务端守卫（服务端事实，绝非客户端断言）

- v0.3 守卫原样继续有效（生成/删除的生效模式守卫；导入的源名与仓储内守卫；
  复制大小校验）。
- **采纳守卫（v0.4 新增）**：
  - 下载 id 必须在 BDL 有事件历史（`vua.warehouse.downloadNotCompleted`
    同时覆盖「从未见过」与「折叠态非已完成交付」，附诚实原因串）；
  - 事件折叠必须处于已完成交付（started＋completed）——进行中、中断、已
    取消、已失败的下载一律拒绝；
  - 暂存文件必须物理在场（`vua.warehouse.stagingFileMissing`）且其大小必须
    等于完成交付自身上报的大小（`vua.warehouse.copySizeMismatch`）；副本对
    暂存文件做大小校验（同一错误码）；
  - 采纳绝不修改、绝不删除暂存文件；
  - 请求无法夹带路径或交付事实：params 面闭合
    （`additionalProperties: false`），负例向量
    `invalid-import-downloads-client-path.json` 钉死「客户端给路径＝契约
    错误」。

## 稳定错误码

v0.3 错误码表原样继续有效（`invalid_state` / `generated_artifact_missing` /
`no_original_material` / `already_generated` / `entry_not_found` /
`generation_failed` / `storeFailed` / `maintenanceIoFailed` /
`importIoFailed` / `invalidSource` / `copySizeMismatch`）。应用面错误码注记
（`unavailable` / `invalid_params` 仅传输面）循 v0.1.1 分拆。v0.4 新增采纳
错误码：

- `vua.warehouse.downloadNotCompleted`（Validation）——下载 id 无历史或折叠
  态非已完成交付；携带 `downloadId` 与 `reason`；
- `vua.warehouse.stagingFileMissing`（ExternalFailure）——已完成交付的暂存
  文件物理缺席；携带 `downloadId` 与 `reason`；
- `vua.warehouse.adoptIoFailed`（ExternalFailure）——采纳复制中的 I/O 失败；
  携带 `downloadId` 与 `reason`。

每个新码均携带 `recoverable=true`；`copySizeMismatch` 与 `storeFailed` 按其
v0.3 语义复用（从采纳任务抛出时参数以下载而非文件夹命名）。

## 依赖方向

```text
React View（仓储获取区「从云端下载」落库队列）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约（方法路由：核心登记）
  → AMF 应用服务（本协议的 provider；crates/acquisition / crates/bdl-store）
  → BDL 本地数据库（download_events 事实、warehouse_items 与条目事实）
```
