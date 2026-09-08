# VUA 生产用例契约 v0.2

[English](production-use-case-v0.2_EN.md) | [简体中文](production-use-case-v0.2_ZH.md)

> 文档版本：0.2
> 状态：**候选（2026-09-09）**——十方法 Schema 已落 `methods/`；正负例向量与全路由消费测试随第三刀补齐后按硬前置冻结（v0.1 历史教训：不重复名不副实的冻结）
> 机器可读词表：`schemas/production-use-case/v0.2/methods/`（十方法 Schema）
> 与 `schemas/recipe/v0.3/`（recipe / local-resolution / approved-plan /
> build-record 四文档）
> 范围：M5 生产主线命令面——Recipe 草拟与存储、Local Resolution、计划批准、
> 作业执行与 Build Record 读面。M3 material 线命令（`production.*` v0.1）冻结
> 不动照常服务：双用例族在同一 provider 上并存（proposal 009 表态③仲裁）。
> 所有权边界：`docs/architecture/orchestrator_ZH.md`（Orchestrator 持有应用
> 用例）；证据本体在 AMF 生产持久域（W23，`schemas/production-evidence/v0.1/`）
> ——永不进 BDL（proposal 011 收敛决议①）。
> 更新：2026-09-08

## v0.2 修订（相对 v0.1）

v0.1 覆盖 M3 material 进料线（inspect/plan/confirm/recover）。v0.2 以**新增
用例族**方式承载 M5 生产主线；v0.1 族冻结照常服务（proposal 009 表态③：双族
并存）。任务生命周期不另起炉灶：全部任务化方法复用应用契约九态任务面——新
方法只是命令词表新条目，不是新状态机。

## 方法面（十方法；词表闭集）

| 方法 | 语义 | 任务化 | 消费面 |
| --- | --- | --- | --- |
| `recipe.save` | 整文档提交＋乐观并发（`baseRevision`；不匹配＝`vua.recipe.revision_conflict` 且携带 `currentRevision`） | 同步（按 base 幂等） | W24 工作台 |
| `recipe.get` | 单 Recipe 文档（最新 revision） | 同步 | W24 |
| `recipe.list` | 身份列表（`text`/`limit`/`offset`；`updatedAt` 降序） | 同步 | W24 |
| `recipe.resolve` | 对 Recipe 运行 Local Resolution（任务化，可能较重） | 任务（九态） | W24 |
| `plan.approve` | 用户授权固化：`draft` -> `approved`，幂等；`superseded` 计划拒绝（`vua.plan.not_approvable`） | 同步（幂等） | W24 |
| `plan.get` | 单批准计划文档＋`planStatus` | 同步 | W24 |
| `plan.list` | 批准计划身份列表 | —（后续刀） | W24 |
| `job.execute` | 提交**已批准**计划执行（Bridge v2 `execute_production_job` 于九态任务内） | 任务（九态） | W24 |
| `record.get` | 单 Build Record v0.3 文档 | —（后续刀） | W24 |
| `record.list` | Build Record 身份列表 | —（后续刀） | W24 |

词表外方法名＝`unknown_method` 契约错误；词表内尚未接线的方法＝类型化
`unavailable`——冻结词表永不静默桩替。

## 文档链（proposal 011 §2）

```text
Recipe v0.3（意图；用户草拟，AMF 持久域）
  -> Local Resolution v0.3（事实；provider 侧解析）
  -> approved-plan v0.3（授权；用户批准的执行计划）
  -> Bridge v2 作业（execute_production_job）
  -> Build Record v0.3（历史；逐作业收据、恢复点、偏差）
```

四产物独立版本化、互不内联（引用不复制）。计划只承载授权——计划没有
`executed` 态；执行事实在 Build Record。

## 文档存储

四产物全部存于 AMF 生产持久域文档库（BuildRecordStore 先例：整读整写、版本
化、按身份寻址；011 收敛决议①）。BDL 永不作为其存储。证据文档（W23，
`production-evidence` v0.1）以身份引用（`evidenceIds`）——本体在 W23 存储域。

## 乐观并发与批准

- `recipe.save` 必带 `baseRevision`；不匹配＝`vua.recipe.revision_conflict`
  且携带 `currentRevision`。每次被接受的保存递增 `revision`。
- `plan.approve` 固化用户授权（`draft` -> `approved`）且幂等。
  `superseded` 计划拒绝批准。
- 指纹与版本锁预检（009 表态④）在 `job.execute` 受理时再次运行：版本锁 ->
  环境 -> 指纹预检，随后 Bridge 侧乐观锁为最后防线。

## 错误词表（应用面）

`vua.recipe.invalid_params` / `vua.recipe.revision_conflict` /
`vua.recipe.not_found` / `vua.recipe.store_failed` /
`vua.recipe.unavailable` / `vua.recipe.resolve_unavailable` /
`vua.plan.invalid_params` / `vua.plan.not_approvable` / `vua.plan.not_found`
/ `vua.plan.store_failed` / `vua.plan.unavailable` / `vua.job.unavailable` /
`vua.record.unavailable`——code 蛇形＋键驼峰（`errors.recipe.*`、
`errors.plan.*`、`errors.job.*`、`errors.record.*`）。词表内未接线方法＝类型
化 `unavailable`，永不静默桩替。

## 术语注记（用户裁定 2026-09-08）

VPM = VRChat Package Manager；"VPM 包" = VPM package（被管理的包）。本文档
全文使用裁定后语形。
