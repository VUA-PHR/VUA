# 下载事件协议 v0.1

[English](download-events-v0.1_EN.md) | [简体中文](download-events-v0.1_ZH.md)

> 状态：**已冻结**（2026-09-06）——F 线四项确认与三处修订（`resumable` 措辞统一、
> `failureKind` 可空/`unknown`、可选 `urlChain`）并入本版；机器可读词表见
> `schemas/download-events/v0.1/`
> 范围：AMF 素材获取的下载事件规范化、重试/恢复语义、来源关联、LocalArtifact 检查与
> Warehouse 映射（B4：素材获取与 BDL）
> 所有权边界：`docs/architecture/desktop_ZH.md`（Electron 持有 Session/DownloadItem）、
> `docs/architecture/bdl_ZH.md`（BDL 只存 AMF 批准持久化的元数据子集）
> 更新：2026-09-06

## 事件流与所有权

```text
Electron Main（隔离 Session / DownloadItem）
  ↓ 窄化下载端口：规范化事件（传输事实）
AMF 素材获取（意图、任务、来源关联）
  ↓ LocalArtifact 检查（大小/类型/来源验证 + 内容摘要）
AMF 检查决定
  ↓ 批准持久化的元数据子集
BDL 本地数据库（download_events / local_artifacts / warehouse）
```

端口只报告**传输事实**；内容身份（SHA-256）、检查结论、来源关联与 Warehouse 决定全部由
AMF 作出。事件中永不携带 Cookie、下载令牌或凭据。

## 事件词表（闭合集合）

| 事件 | 语义 |
| --- | --- |
| `download.started` | 一次尝试开始传输 |
| `download.progress` | 周期性字节计数（节流由端口决定，AMF 不依赖其频率） |
| `download.interrupted` | 网络中断且未达终态；**可恢复**候选 |
| `download.completed` | 字节传输完成（尚不可信——待 AMF 验证） |
| `download.cancelled` | 用户或任务取消，终态 |
| `download.failed` | 不可恢复失败，终态 |

规范化字段（每事件携带）：`downloadId`（端口分配，跨重试稳定）、`attempt`（1 起）、
`sourceUrl`、`initiatedFromPageUrl`（`will-download` 时刻捕获的页面上下文）、
`urlChain`（可选，`will-download` 时刻捕获的重定向链——来源核对输入，B 侧已采纳）、
`suggestedFileName`、`storedPath`（VUA 管控的下载暂存路径，绝不直接落用户目录；策略
拒绝发生在 `will-download` 阶段、文件未创建时可空）、`expectedBytes`（可空；
Content-Length，未知大小报 `null`，不得以 0 注水）、`receivedBytes`、`resumable`
（**端口的可续传判定**，即 Electron `canResume()`；端口不再自观察范围头字段作为第二
信号，避免双信号漂移）、`failureKind`（仅失败事件：`policy` 为端口自证的下载目标
允许清单拒绝；其余失败端口**不可如实区分**网络/磁盘/服务器归因，一律如实标
`unknown`——"不猜测、不注水"纪律）、`occurredAt`。

## 状态机

```text
queued → downloading → transferDone → verifying → inspected → admitted
              ↓ interrupted（回 downloading，同一 attempt 计数）
              ↓ cancelled / failed（终态）
```

`completed` ≠ `admitted`：传输完成只是 AMF 检查的输入。检查 = 大小上限、扩展名/类型
允许清单、来源与页面上下文核对、SHA-256 计算。通过后文件才成为可信 LocalArtifact 进入
来源关联与 Warehouse 决定。

## 重试与恢复语义

- **重试单位**：`downloadId` 跨尝试稳定，`attempt` 递增。同一 `downloadId` 的重试不是新
  下载。
- **断点续传**：仅当 `resumable` 为真——从服务器确认的字节偏移追加；SHA-256 无法跨中断
  续算，因此部分哈希状态一律丢弃，完整文件从头计算。任何偏移疑义（服务器不回 206、
  长度不一致）→ 丢弃部分文件、从零重启。
- **有界尝试**：每 `downloadId` 最多 3 次尝试，指数退避；任务级取消在尝试边界生效
  （与全局任务契约一致：请求取消 ≠ 已取消）。
- **崩溃恢复**：重启后无终态事件的下载为 `orphaned`——部分文件只检查不静默续传：能确证
  完整（大小一致且 SHA-256 与既有记录匹配）则走检查，否则丢弃部分文件并记录为失败下载，
  由用户决定是否重试。回执未知时先 Inspect 的全局纪律在这里的具体化。
- **BDL 幂等**：检查事实按内容（`artifact_sha256`）幂等；物理副本按条目各自存在——重复
  下载同一素材会建立新的物理副本与素材包条目，但不重复检查、不重复来源关联
  （warehouse-layout 裁决 2）。

## 来源关联

关联三元组在检查通过时由 AMF 提交给 BDL：

1. **来源商品**——点击下载时的页面上下文；若该页面已被观察管线规范化，则携带
   `booth:<native_product_id>` 命名空间身份；
2. **工件身份**——AMF 计算的 `artifact_sha256`；
3. **子商品**——可空；下单/变体上下文可用时携带。

关联是**多对多事实**（同一文件可被多个商品页引用）：BDL 的 `artifact_mappings` 以
`(artifact_sha256, product_id)` 为主键，重复提交幂等。

## Warehouse 映射

布局由 `docs/decisions/warehouse-layout_ZH.md` 裁决（已接受，2026-09-06）：**语义目录树、
不做去重、拷入导入**。检查通过后，AMF 决定是否建立素材包条目：

- 仓库以素材包为单位组织：一个条目一个文件夹，文件夹名是 VUA 生成的本地身份（稳定、
  不向显示名倾斜），`storedPath` 随根目录设置更新；
- **不做去重**：同一内容的素材可存在多份——检查事实按内容幂等，物理副本（`copies`）按
  条目各自存在，来源关联（`artifact_mappings`）不受副本数量影响；
- **导入 = 拷入 + 批量**：批量选择文件夹，每个文件夹成为一个素材包条目，原始目录不动；
- **产物模式设置**：条目内生成的 VPM 包与素材文件夹平级；设置界面开放"使用 VPM 包
  （可选：生成后删除原始文件）/ 使用原始 .unitypackage（默认）"，映射素材入口 v0.1 双通道；
  删除原始文件仅在生成与验证成功后执行，并进入审计；
- 用户不翻磁盘：仓库由 VUA 自建内容管理器呈现。

## 与 F 线端口的对齐结论（已确认，2026-09-06）

F 线四项全部接受（`docs/plans/f-reply-to-b4-download-port-alignment_ZH.md`），冻结时
并入以下结论：

- 能力位：`desktop.remoteBrowser` 已在 Provider 能力表中（当前 unavailable）；下载端口
  属同一桌面能力族；事件载荷即本文词表，传输通道（Gateway 通知 vs 端口帧）由 F4 实现
  选型；
- **失败派生**：状态到达 `interrupted` 时调 `canResume()`——真报
  `download.interrupted`，假报 `download.failed`；这是 Electron `DownloadItem` 上唯一
  的原生判别信号；
- **字段映射**：逐行确认。`initiatedFromPageUrl` 与 `urlChain` 必须在 `will-download`
  时刻捕获（事件发出后再取就晚了）；`expectedBytes` 未知时报 `null` 不得以 0 注水；
- **重试职责切分**：策略归 AMF（是否重试、3 次上限、退避、放弃），机制归端口
  （`resume()`、部分文件管理、attempt 计数）；AMF 意图命令在同一 `downloadId` 上由
  端口**串行化**解释（按命令到达序 + revision 裁决，`resume` 与取消不得并发解释）；
  端口不自行发起 AMF 未授权的重试；
- **暂存目录注入**：`storedPath` 从 shell/AMF 注入的 VUA 管控暂存目录派生，端口不持有
  自己的路径策略；注入目录内的同名消歧（如短 `downloadId` 码缀）归端口实现，最终名
  verbatim 上报，AMF 不解析其构成；
- `policy` 类失败由端口在 `will-download` 阶段直接 `event.cancel()` 并报
  `failed/policy`，与本地内容导航策略同一做法。

## 开放项

- 检查钩子（归档内容扫描等）定义为接口占位，B4 只实现大小/类型/摘要最小集；
- 事件载荷的机器可读 JSON Schema 已随冻结落地 `schemas/download-events/v0.1/`
  （`event.schema.json` + `examples/`）；词表或字段变更须升版，不得原地改写。

Warehouse 物理布局已裁决（`docs/decisions/warehouse-layout_ZH.md`）：语义目录树、不去重、
拷入 + 批量导入、产物模式设置。
