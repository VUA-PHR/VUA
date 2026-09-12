# inspection-queries 协议 v0.1（检查读面词表行：get＋list＋requestRun）

[English](inspection-queries-v0.1_EN.md) | [简体中文](inspection-queries-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（检查读面词表行）**（2026-09-13，proposal 016 仲裁第 2 点
> 独立词表行；冻结硬前置逐项收口见下）
> 机器可读词表：`schemas/inspection-queries/v0.1/`（三方法 Schema＋正负例
> 向量；契约锚 `crates/acquisition/tests/inspection_queries_contract.rs`；
> 帧环 wire 测试 `crates/provider-host/tests/inspection_queries.rs`）
> 范围：`inspection.get`（身份寻址读单份证据文档）、`inspection.list`
> （身份列表，最新在前）、`inspection.requestRun`（任务化驱动写命令，
> 照 job.execute 形态 taskId 轮询）
> 所有权边界：证据文档本体归 `schemas/inspection-evidence/v0.1`（产线域，
> AMF 生产持久域第五文档库，绝不进 BDL——proposal 016 §5、011 §5）；本词
> 表行只承载读/写方法面，读面透传证据文档本体，绝不内联、绝不再推导
> 更新：2026-09-13（v0.1 冻结批：三方法一次冻结）

## 冻结收口（proposal 016 §7 硬前置逐项）

- **①产出操作**：Bridge 五维产出操作已落地验收（v1 `validate_avatar` 类型
  化检查＋`analyze_performance` 本地结构估算，v3 三只读检查操作
  `inspect_avatar_references` / `inspect_lighting` /
  `inspect_upload_readiness`；合并 7d63abe，锚点切片 c33adb3）；
- **②存储＋路由**：核心 `InspectionEvidenceStore`（append-only、hard_link
  exactly-once、`{inspectionId}.json` 身份寻址、缺席根＝诚实空态）＋
  `inspection.get` / `inspection.list` 读路由（照本词表行逐字实现）＋任务
  化 `inspection.requestRun` 已落地验收（合并 7a262b8）；随后数据预审修订
  批（c914cf2）统一族自有版本常量——本词表行回执一律引用
  `INSPECTION_QUERIES_SCHEMA_VERSION = "0.1"`，不借 evidence 本体版本、
  不借 bdl-commands 族版本（数据追认在案）；
- **③向量＋消费测试**：正例 3 对（get/list/requestRun 各请求＋结果）＋
  负例 3（get 与 requestRun 词表外参数＋list limit 越界 201）全绿；契约
  锚（acquisition，向量驱动）＋帧环（provider-host，真实路由含零收据不
  发布、未接线诚实缺席）双载体在库；
- **④双语协议本＋⑤REGISTRY 登记**：随本冻结批落地。

## 冻结范围与分工

本协议冻结 **方法词汇、参数闭集、字段面与结果形状**。错误通道、请求关联
与传输信封属于版本化应用契约；渲染层 TS 面已由核心随实现批在
`@vua/contracts` 登记（类型＋守卫＋消费测试），桌面页面消费（M7
「Inspection/Release 页面与官方 SDK 交接」桌面半边）候接线——接线完成前
不得声称端到端。证据文档本体的形状与语义归 inspection-evidence v0.1
（产线域冻结批），本词表行与其解耦：本体升版不自动带动本词表行。

## 方法面（两读一写）

| 方法 | 语义 | 消费方 |
| --- | --- | --- |
| `inspection.get` | 按 `inspectionId` 身份寻址返回证据文档本体原样（本体由 inspection-evidence v0.1 全量校验；result `schemaVersion`＝本词表行版本 `"0.1"`） | 检查详情视图 |
| `inspection.list` | 身份摘要行列表，`performedAt` 降序最新在前；可选过滤＝`avatarRef` 精确匹配＋`overallStatus` 闭集 `pass\|warn\|fail`；`limit(1..200)`/`offset` 有界分页；摘要行绝不内联 dimensions/checks（引用不复制，012 evidenceIds 纪律） | 检查历史列表 |
| `inspection.requestRun` | 任务化驱动五产出操作→转抄→聚合→发布 exactly-once 一份证据文档（新 uuid-v7 `inspectionId`）；受理回执 `{schemaVersion, operation, taskId, correlationId}` 照 job.execute 形态，调用方按 `taskId` 轮询应用任务面 | 检查发起入口 |

诚实缺席纪律：读面未接线＝`vua.inspection.unavailable` 类型化缺席；空库
`list` 返回空集——空态即终态；`requestRun` 零收据（零操作证据束）＝类型
化失败且不发布——绝不伪造文档。

## requestRun 参数与语义

- params 闭集两键：`avatarGlobalObjectId`（Unity 场景目标身份，
  `minLength 1, maxLength 512`——命令载荷形状约束）＋`avatarRef`
  （被检头像逐字身份：`ref` 必填 `minLength 1` 无上限、`label` 可空——
  与证据本体 verbatim 承载同形，读写对称；修订批 c914cf2 去写侧独有
  maxLength，数据追认在案）；
- `additionalProperties: false`——词表外参数＝契约错误（负例向量钉死）；
- 路径是 provider 绑定配置，绝不上 wire（M3/T1 裁定）；
- 驱动的五产出操作全部 `dry_run: true`（只读观察，零项目变更）；
- `overallStatus` 聚合＝`fail`（含 unavailable 维）＞`warn`＞`pass`
  （proposal 016 §4 规则，机械映射不解释）。

## 依赖方向

```text
React View（检查详情/历史/发起入口）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约（inspection.* 词表行）
  → AMF 应用服务（provider-host 路由，已 live）
  → InspectionEvidenceStore（AMF 生产持久域第五文档库，绝不进 BDL）
```

## 机器可读词表

`schemas/inspection-queries/v0.1/`：`methods/`（三方法 Schema）＋
`examples/`（3 请求＋3 结果＋3 负例：get 与 requestRun 词表外参数、
list limit 越界 201——均须被拒）。消费测试双载体：
`crates/acquisition/tests/inspection_queries_contract.rs`（向量契约锚）＋
`crates/provider-host/tests/inspection_queries.rs`（帧环 wire 测试：get
身份寻址与诚实 not_found、list 排序过滤分页、requestRun 全链发布一次、
零收据不发布、未接线不可用、闭集参数拒绝）。词表或字段变更必须升版本，
绝不原地改写。

## 开放项

- 桌面页面消费（M7 分解表桌面行）：BG-15 骨架在库候接线；
- 真机走查（Unity 生产环境实际运行检查）：归 W25 真机窗口；
- `official_sdk_rating` 保留值：SDK 交接切片落地前禁用（016 仲裁，
  产线域义务，本词表行透传不解释）。
