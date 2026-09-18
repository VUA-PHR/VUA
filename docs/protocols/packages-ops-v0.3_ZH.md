# packages-ops 协议 v0.3（包管理 P3 写面，第三冻结切片 A3＝register_local_package：packages.registerLocalPackage）

[English](packages-ops-v0.3_EN.md) | [简体中文](packages-ops-v0.3_ZH.md)

> 文档版本：0.3
> 状态：**已冻结（packages-ops 词表行 v0.3，A3 本地包注册词面；v0.1
> A1 移除行与 v0.2 A2 安装/升级行维持冻结照常服务，零触碰——v0.3
> 系独立行目录，照 packages-catalog v0.2 增量先例；词面尚未接线：
> wire 路由候下一个核心接线切片，接线前本方法在 wire 面不存在）**
> （2026-09-19，提案 026 面序 A1→A2→A3）
> 机器可读词表：`schemas/packages-ops/v0.3/`（行级双 Schema＋2 正
> 7 负向量；核心消费测试
> `crates/provider-host/tests/packages_ops_consumer_v03.rs`；TS 守卫
> 测试 `packages/contracts/src/application-contract.test.ts`）
> 范围：`packages.registerLocalPackage`（九态任务化：把一个生成的
> 本地包注册进后端隔离环境）
> 所有权边界：词表冻结、端口面（新 default accessor
> `VpmBackend::register_capabilities` -> `RegisterCapabilities`，
> default declared-none；`register_local_package` 端口方法与
> VrcGetLib 实现已在库）＝核心域；wire 路由（`packages.registerOps`
> served 行门控读 accessor、路由臂、信封组装）＝核心域，下一个核心
> 切片；`VrcGetLibBackend::register_capabilities` 覆写＝环境域
> （实现核对切片照 024/025 程序——覆写翻转前 served 行如实
> unavailable）；桌面消费＝桌面域（逐面升级，`blocks.changes` 演进
> 照桌面表态）
> 更新：2026-09-19（v0.3 冻结批：双 Schema＋向量＋核心消费测试＋
> TS 面＋双语协议本＋REGISTRY）

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

## 诚实边界

- **词面尚未接线（v0.3 冻结批）。** wire 路由、`packages.registerOps`
  served 行与信封组装属下一个核心切片；该批落地前本方法在 wire 面
  不存在、桌面不渲染任何写入口，此处不宣称任何运行时行为。consumer
  测试骑 Schema 向量与 fake 后端——真实后端消费归环境实现核对切片，
  端到端走查归 W25（候用户开窗 O-2）。
