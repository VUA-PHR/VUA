# packages-ops 协议 v0.3（包管理 P3 写面，第三冻结切片 A3＝register_local_package：packages.registerLocalPackage）

[English](packages-ops-v0.3_EN.md) | [简体中文](packages-ops-v0.3_ZH.md)

> 文档版本：0.3.1
> 状态：**已冻结（packages-ops 词表行 v0.3，A3 本地包注册词面；v0.1
> A1 移除行与 v0.2 A2 安装/升级行维持冻结照常服务，零触碰——v0.3
> 系独立行目录，照 packages-catalog v0.2 增量先例；词面已接线：wire
> 路由与 served 行已在库——桌面消费候逐面升级，落地前本方法无桌面
> 写入口）**
> （2026-09-19，提案 026 面序 A1→A2→A3）
> 机器可读词表：`schemas/packages-ops/v0.3/`（行级双 Schema＋2 正
> 7 负向量；核心消费测试
> `crates/provider-host/tests/packages_ops_consumer_v03.rs`；wire 路
> 由测试 `crates/provider-host/tests/packages_ops_wire_v03.rs`；TS 守
> 卫测试 `packages/contracts/src/application-contract.test.ts`）
> 范围：`packages.registerLocalPackage`（九态任务化：把一个生成的
> 本地包注册进后端隔离环境）
> 所有权边界：词表冻结、端口面（新 default accessor
> `VpmBackend::register_capabilities` -> `RegisterCapabilities`，
> default declared-none；`register_local_package` 端口方法与
> VrcGetLib 实现已在库）＝核心域；wire 路由（`packages.registerOps`
> served 行门控读 accessor、路由臂、信封组装）＝核心域，**随本批落
> 地**；`VrcGetLibBackend::register_capabilities` 覆写＝环境域
> （实现核对切片照 024/025 程序——覆写翻转前 served 行如实
> unavailable）；桌面消费＝桌面域（逐面升级，`blocks.changes` 演进
> 照桌面表态）
> 更新：2026-09-19（v0.3.1 接线批：路由臂
> `packages.registerLocalPackage`＋served 行 `packages.registerOps`
> 门控读 accessor＋信封组装＋闭集投影＋wire 测试＋本文载明 wire 信
> 封常量——词面零变更）；2026-09-19（v0.3 冻结批：双 Schema＋向量
> ＋核心消费测试＋TS 面＋双语协议本＋REGISTRY）

## A3 词面语义（注册刻意不是 preview/apply 对）

- **单方法、无 preview 臂——族中唯一。** 端口恰有
  `register_local_package(&self, package_root: &Path) ->
  Result<(), AppErrorV1>`；不存在 preview 方法，也不发明。实现注释
  明示事实：「注册与 preview/apply 刻意分离：常规摘要绑定安装路径
  独占一切项目变更。」注册向后端**隔离环境**添加一行用户包条目，
  不删不改任何内容（非破坏性），因此 ADR-0006 破坏性警示路径无事
  可警示，本面不发明破坏性事实。
- **幂等是成功事实，不是变体。** 库面 `AddUserPackageResult::
  AlreadyAdded` 与 `Success` 同答成功。首次注册与重复注册在 wire
  面是一个成功事实：收据不携 `added` 布尔、不做首次/重复区分
  （负例向量钉死发明此类事实即违规）。
- **无 digest、无确认链。** 无既有状态可漂移、无解析器可失手：
  双摘要守卫（ORC-WF-003/004）在此无处着力。用户显式提交即确认
  （与 A5 create_project 表态同向：表单提交本身即显式确认）。请求
  携 `confirmedDigest`＝形状违反（负例钉死）。
- **九态任务化写命令（写命令族一致形状）。** applyRemove、
  applyInstall 与 project.setNote 全部骑任务面；注册同构：
  `commandId` 幂等、可取消、事件＋revision，恢复面把非终态残留标
  `inspect_required`、绝不隐式续传（诚实纪律 3）。任务关联住任务面
  （taskId/revision）；结果文档是回流载荷。

## 方法面

- **请求**：`{packageRoot}`——单键闭集。`packageRoot`＝本地包根
  目录（含包 `package.json`），端口 `package_root` verbatim camelCase
  投影，非空。**不收 `projectPath`**：注册不触任何项目、不改用户
  VCC/ALCOM 设置（端口签名无 project 参数）。
- **结果（Done payload），kind=registered**：最小诚实审计形状——
  `{schemaVersion: "vua.packages-ops/v0.3", kind: "registered",
  packageRoot}`。端口答 `Result<(), _>`：无实际结果载荷可投影，
  文档只携请求回显、别无他物（`additionalProperties:false` 禁止
  发明——注册时间戳、package.json 内容、环境文件路径一律 Schema
  违规）。
- **结果，kind=rejected**：guard 闭集维持 A1/A2 三值——A3 零新增
  guard。注册无 preview 可漂移、无解析器可失手，全部端口拒绝折
  `execution_failed` 携原码 detail 如实溯源（`vua.vpm.local_package_
  invalid`＝路径/包形状拒绝——路径不存在、缺 package.json、非绝对
  路径、包畸形；`vua.vpm.local_package_register_failed`＝隔离设置
  load/save IO）。复用码 `vua.vpm.*` 永不入 `code` 键（013 复用码
  纪律；pattern 锁 `^vua\.packages\.`，负例钉死）。
- **信封错误面（零新码）**：能力缺席答通用 `vua.vpm.capability_
  missing`（trait default 的 `unsupported` 事实；wire 门控在 submit
  前应答——能力缺席绝不进任务）；参数违例答
  `vua.packages.invalid_params`；未接线引擎答诚实缺席臂
  `vua.packages.unavailable`。
- **服务门控**：新 default accessor `VpmBackend::register_capabilities()
  -> RegisterCapabilities`（default declared-none；025
  `catalog_capabilities` 同律——独立 accessor 而非 `VpmCapabilities`
  加字段，五位闭集稳定、无实现后端零编译涟漪，ORC-DEV-004）。
  served 行 `packages.registerOps` 一行服务本方法（removeOps/
  installOps 一行先例）。VrcGetLib 覆写随环境实现核对切片落地——
  覆写前行如实 unavailable。
- **端口码映射随本批申报**（逐码完整对齐申报随环境实现核对切片，
  A1/A2 同径）：`local_package_invalid` → rejected
  `execution_failed` 携原码 detail；`local_package_register_failed`
  → rejected `execution_failed` 携原码 detail；能力缺席 → 通用
  `capability_missing`（信封错误，submit 前）。
- **served 能力行（已接线，落地）**：served 行
  `packages.registerOps` 一行服务本方法；可用性门控读新 default
  accessor `register_capabilities().register_local_package`（v0.3
  冻结命令 Schema 的服务门——removeOps/installOps 一行先例）。引擎
  在库但后端未申报注册能力时该行如实 unavailable；未接线引擎答
  `vua.packages.unavailable`。本路由**无注册项目检查**（不收
  `projectPath`——注册不触项目），013 `project_not_found` 复用对
  本面不适用。wire 投影照 A1/A2 纪律收窄到本面：任务面把**全部**
  端口拒绝（`local_package_invalid`、
  `local_package_register_failed`、trait default 的
  `capability_missing`、以及一切词外码）折 `execution_failed` 携
  原码入 `detail` 如实溯源——零发明第四 guard；能力门控在路由层
  submit 前答通用 `capability_missing`——能力缺席绝不进任务。

## 信封、版本与依赖方向

wire 信封是常设形状（`schemaVersion` 信封常量 `"0.3"`＋
`operation`＋`result`）；结果文档自带族常量
（`vua.packages-ops/v0.3`）——两个版本相互独立（c914cf2 常设规则：
每条 wire 行自带版本常量）。任务受理应答与 Done payload 均盖
`"0.3"` 信封常量。v0.1 移除方法继续在 v0.1 词面应答、v0.2 安装
方法在 v0.2 词面应答；v0.3 请求只有
`packages.registerLocalPackage` 一个方法（v0.2 与 v0.3 的
`changePlan` 形状共享同一键集——消费者按 `schemaVersion` 字面量
窄化，不按键集）。依赖方向不变：renderer → 类型化 Gateway →
Electron main（verbatim 透传）→ 版本化应用契约 → provider wire
面 → `VpmBackend` 端口 → project-manager 适配器。框架与厂商类型
留在适配器；词表运输事实。

## 诚实边界

- **词面已接线（v0.3.1 接线批），消费未接。** wire 路由、
  `packages.registerOps` served 行、信封组装与 wire 测试已在库——
  自本批起本方法在 wire 面存在。桌面仍不渲染任何写入口（消费候逐
  面升级，A1/A2 同程序），环境 `VrcGetLibBackend::register_
  capabilities` 覆写未落地（落地前 served 行如实 unavailable），
  真实后端消费归环境实现核对切片。consumer 与 wire 测试骑 Schema
  向量与 fake 后端；端到端走查归 W25（候用户开窗 O-2）。此处不宣
  称超出本批 wire 落地面的任何运行时行为。
