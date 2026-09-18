# packages-ops 协议 v0.2（包管理 P3 写面，第二冻结切片 A2＝安装/升级：packages.previewInstall + packages.applyInstall）

[English](packages-ops-v0.2_EN.md) | [简体中文](packages-ops-v0.2_ZH.md)

> 文档版本：0.2.1
> 状态：**已冻结（packages-ops 词表行 v0.2，A2 安装/升级词面；v0.1 A1
> 移除行维持冻结照常服务，零触碰）——词面已接线（wire 路由在库，
> 本版本如实更新接线状态；词面零变更）**
> （2026-09-19，提案 026 面序，核心裁决 82a39c4 第 1 点：升级＝安装
> 同族，版本选择语义随本冻结批落死——提案预记照办）
> 机器可读词表：`schemas/packages-ops/v0.2/`（行级双 Schema＋4 正
> 8 负向量；核心消费测试
> `crates/provider-host/tests/packages_ops_consumer_v02.rs`；wire
> 路由测试
> `crates/provider-host/tests/packages_ops_wire_v02.rs`；TS 守卫
> 测试 `packages/contracts/src/application-contract.test.ts`）
> 范围：`packages.previewInstall`（同步只读安装/升级变更预览，做依赖
> 解析、可能触网）与 `packages.applyInstall`（双摘要守卫下的九态
> 任务化安装写命令）
> 所有权边界：词表冻结、端口面（`VpmBackend`
> `preview_install`/`apply_install` 已在库）、wire 路由＝核心域
> （已接线，路由两臂＋`packages.installOps` served 行在库）；
> `VpmBackend` 库实现（project-manager，
> `preview_install` :528／`apply_install` :757 已在库）＝环境域
> （实现核对切片照 024/025 程序）；桌面消费＝桌面域（逐面升级，
> `blocks.changes` 演进照桌面表态 93752d5 第 3 条）
> 更新：2026-09-19（v0.2 冻结批：双 Schema＋向量＋核心消费测试＋
> TS 面＋双语协议本＋REGISTRY）；2026-09-19（v0.2.1 接线批：
> wire 路由两臂＋served 行落地，诚实边界节如实更新，词面零变更）

## A2 词面语义（安装/升级＝同族一对，不立 upgrade 动词）

- **一对 preview/apply 方法同时服务安装与升级。** 端口恰有
  `preview_install`/`apply_install` 两方法；wire 面不发明第二动词。
  升级＝对已安装包安装（通常更新的）版本；降级共用同一钉版语法。
  不发明 `upgrade` 变更种类：端口 `ChangeKindV1` 闭集＝
  `install|remove`，v0.1 `changeItem` 行已投影两值（A1 负例
  `kind=upgrade` 当时词外；安装面启用 `install` 行，不加词）。
- **版本选择语义（本批落死）。** 每请求行＝`{packageId, version}`
  ，`version` 必填可空：`null`＝安装解析器选择的版本（端口
  `VersionSelector::latest_for`——最新稳定版；预发布版绝不被自动
  选中）；字符串＝钉死精确版本。无法满足的钉版答
  `package_not_found`。同行重复 `packageId`＝词面违例，即使版本
  不同（Schema `uniqueItems` 钉死精确重复；负例向量与 TS 窄化钉死
  同 id 唯一规则）。
- **preview＝同步只读 query，做依赖解析。** 与 A1（无网络、无依赖
  解析）不同，A2 预览对已注册仓库做依赖解析、可能触网。在线仓库
  刷新失败时降级到包缓存（ORC-ADP-006 同构先例）。预览不携带缓存
  来源披露字段：端口 `ChangePreviewV1` 无载体，加装即破坏已冻结的
  A1 plan 形状（`additionalProperties:false`）；将来若出现需要披露
  的用户伤害事实，照 025 `cacheSourced` v0.2 增量先例作为独立词面
  增量办理。plan 的 `items` 可同时含 install 行与 remove 行（冲突
  触发的移除是端口事实——ORC-WF-002：计划必须覆盖后端将做的每一个
  变更）；冲突或遗留清理非空时 `destructive=true`（确认 UI 必须
  警示，ADR-0006）。
- **apply＝九态任务化写命令。** `packages.applyInstall` 必携
  `confirmedDigest`（用户确认的预览摘要）；服务端在执行时重算预览，
  漂移即拒（ORC-WF-003/004；权威判定在服务端——提案 014 仲裁第 2
  点；后端自身第二道比对——Fix R2-7，legacy folders 计入摘要——
  留作纵深防御）。apply 段的仓库加载不降级：在线加载失败即任务
  如实失败（ExternalFailure），绝不静默按可能过期的缓存执行。
  九态任务语义（`commandId` 幂等、可取消、事件＋revision）走应用
  契约任务面，不在本词表。
- **恢复＝复检，绝不隐式续传（诚实纪律 3）。** 中断/失败 apply 任务
  的非终态残留复检为 `inspect_required`；重试语义＝用户显式重预览
  重确认（014「清理后重来」先例），绝不静默续传。摘要漂移拒绝是
  可恢复冲突（端口实现 `PREVIEW_DRIFT` `.with_recoverable(true)`
  在案）。
- **闭集参数。** `projectPath`＝提案 013 在册身份（未注册路径答
  类型化码 `vua.project.project_not_found`——同事实同码，024 P1
  先例）；`packages`＝显式非空闭列；preview 参数无 digest 位
  （携带即形状违例）。

## 审计收据（A2 installReceipt 变体）

安装面 `kind=receipt`＝提案 014 导入收据先例（变更清单＋实际结果）
的 A2 变体：`confirmedDigest`（回显——审计关联）＋
`requestedPackages`（请求行 verbatim，含版本选择语义：解析器选的
请求如实传输其 `null`）＋`appliedItems`（端口 `apply_install`
`{applied: items}` verbatim 投影；不发明下限——诚实空数组按空数组
传输）。两变体收据键集互斥（`requestedPackageIds`/`removedItems`
对 `requestedPackages`/`appliedItems`）；任务关联走任务面
（`taskId`/`revision`），本文档是回流载荷，非持久链接。无端口载体
的发明事实（安装后复检、下载字节数、时间戳、解析树）按 Schema
即非法——虚假断言防线。

## vua.packages.* 错误码族（v0.2 增量）

**信封错误面恰一新码，守卫零新增：**

| 面 | 码 | 事实 |
| --- | --- | --- |
| 信封错误 | `vua.packages.preview_failed` | 预览/查询段失败（仓库解析、IO、外部失败类） |

rejected 臂守卫闭集维持 A1 三值——`preview_drift` /
`package_not_found` / `execution_failed`（guard 值＝code 后缀，
冻结 Schema pattern `^vua\.packages\.`）。A2 不发明第四守卫：
apply 任务内漂移答 `preview_drift`，包无法解析答
`package_not_found`，其余一切端口拒绝折入 `execution_failed`
且原端口码进 `detail` 如实溯源。

复用零新立（申报）：`vua.project.project_not_found`（未注册
projectPath）、`vua.packages.invalid_params`（请求形状违例）、
`vua.packages.unavailable`（未接线引擎诚实缺席）。端口级映射
（本冻结批申报；逐码完整申报随环境实现核对切片）：
`vua.vpm.preview_failed` → `vua.packages.preview_failed`；
`vua.vpm.apply_failed` → `vua.packages.execution_failed`；
`vua.vpm.no_matching_package` → `vua.packages.package_not_found`
（同事实：请求的包/版本不可得）；`vua.vpm.preview_drift` →
`vua.packages.preview_drift`；能力缺席 → 通用
`capability_missing`。端口级 `vua.vpm.*` 码族维持为实现层事实；
已冻结的 `vua.vpm.no_matching_package`（catalog 面消费）不动
（核心裁决 82a39c4 第 4 点）。

## 方法面

- `packages.previewInstall`——`kind: "query"`，双键闭集参数
  `{ projectPath, packages }`。结果族常量
  `vua.packages-ops/v0.2`；恰答 `kind=plan` 臂（`changePlan`
  形状：`items` 含 install 与 remove 行、`conflicts`、
  `removeLegacyFiles`/`removeLegacyFolders`、`destructive`、
  `digest`）。失败走 wire 信封错误，绝不走 result 臂。
- `packages.applyInstall`——`kind: "command"`（`commandId`
  幂等），三键闭集参数（加 `confirmedDigest`）。任务终态回流恰答
  两臂之一：`kind=receipt`（installReceipt 变体，如上）或
  `kind=rejected`（类型化守卫拒绝）。operation/kind 锁：
  previewInstall 恒答 plan，applyInstall 恒答 receipt/rejected
  （Schema 层机器可检）。
- **served 能力行（已接线落地）**：一行
  `packages.installOps` 服务双方法；可用性门控＝端口
  `VpmCapabilities.preview_install` 位（冻结 command Schema 的
  serving gate——一位服务 A2 双方法，`packages.removeOps` A1
  先例）。已接线但未声明安装能力的引擎保持该行诚实不可用；未接线
  引擎答 `vua.packages.unavailable`。`vua.project.project_not_found`
  复用在路由层以信封错误答出（rejected 臂 code Schema 锁
  `^vua\.packages\.`——复用的 013 码永不入 rejected 文档）。
  wire 路由投影规则照 A1 同径：信封错误面已知映射
  （`package_not_found`／`preview_failed`）投影、词外端口码照 P1
  透传；任务面已知守卫（`preview_drift`／`package_not_found`）
  投影、`apply_failed` 与词外端口码折入 `execution_failed` 携原码
  进 `detail` 如实溯源（不发明第四 guard）；双摘要守卫在 wire 层
  强制（服务端执行前复算 preview，权威判定在服务端——014 仲裁点
  2；后端第二道比对留作纵深防御）。

## 信封、版本与依赖方向

wire 信封是常设形状（`schemaVersion` 信封常量 `"0.2"`＋
`operation`＋`result`）；result 文档自带族常量
（`vua.packages-ops/v0.2`）——两版本相互独立（c914cf2 常设规矩）。
v0.1 移除方法继续按 v0.1 词面应答；v0.2 请求恰为两个安装方法
（v0.1 与 v0.2 plan 形状同键集——消费端按 `schemaVersion` 字面量
窄化，不按键集）。依赖方向不变：renderer → 类型化 Gateway →
Electron main（原样透传）→ 版本化应用契约 → provider wire 面 →
`VpmBackend` 端口 → project-manager 适配器。框架与厂商类型留在
适配器；词表传输事实。

## 机器可读词表

- `schemas/packages-ops/v0.2/command.schema.json`＋
  `result.schema.json`＋`examples/`（4 正／8 负）
- 消费测试：
  `crates/provider-host/tests/packages_ops_consumer_v02.rs`
  （Schema 向量＋端口→wire 投影环〔含冲突触发 remove 行〕＋能力
  缺席词面＋漂移可恢复词面钉死）；
  `crates/provider-host/tests/packages_ops_wire_v02.rs`（wire 路由
  11 例骑真实帧环：诚实缺席／plan 信封投影／013 复用码／参数违例
  闭集／能力缺席／两码信封投影／receipt Done payload／漂移拒绝／
  execution_failed 溯源／路由层拒绝）；
  `packages/contracts/src/application-contract.test.ts`（闭集请求行
  TS 窄化）；`packages/orchestrator-provider` mock 恒缺席臂
  （模拟面永不模拟 wire 写回执）

## 诚实边界与开放项

- **词面已接线（v0.2.1 如实更新）。** wire 路由两臂＋
  `packages.installOps` served 行已在库：
  `packages.previewInstall`/`packages.applyInstall` 在 wire 面存在，
  路由行为由 `packages_ops_wire_v02.rs` 11 例骑真实帧环钉死。接线
  前的诚实缺席规则仍服务未声明 `preview_install` 能力的引擎（served
  行诚实不可用、方法答 `vua.packages.unavailable`／
  `capability_missing`——能力面不撒谎）。桌面 `blocks.changes` 写
  入口随 A2 消费切片逐面升级（fixture 形状绝不搬进 live——#22/#36
  教训两次在案）；接线不等于端到端：真机走查归 W25（候用户开窗
  O-2）。
- **缓存降级是文档载明的行为，不是本面传输的事实。** 在线刷新失败
  后预览可能按包缓存计算；摘要绑定与服务端重算保证执行安全
  （漂移即拒）。apply 段不降级。将来若需传输披露，照 025
  `cacheSourced` 增量先例办理。
- 环境实现核对切片（`VrcGetLibBackend` `preview_install`/
  `apply_install` 已在库，照 024/025 程序：实现＋定向测试＋wire
  对齐证据）随接线批之后落地；端口码→闭集的完整投影映射申报随该
  切片。
- 桌面消费照逐面升级程序（表态 93752d5 第 3 条）；冻结面序下一面
  ＝A3 `register_local_package`（A1 → A2 → A3 → A4 增删先行 →
  A5 殿后，照 A5 启动裁定 8afde3f）。
