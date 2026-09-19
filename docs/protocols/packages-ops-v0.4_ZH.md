# packages-ops 协议 v0.4（packages P3 写面，第四冻结切片 A4＝仓库订阅增删：packages.addRemoteRepo / packages.addLocalRepo / packages.removeRepo）

[English](packages-ops-v0.4_EN.md) | [简体中文](packages-ops-v0.4_ZH.md)

> 文档版本：0.4.1
> 状态：**已冻结（packages-ops 词表行 v0.4，A4 仓库增删词面；v0.1 A1
> 移除行、v0.2 A2 安装/升级行与 v0.3 A3 注册行保持冻结原样服务——
> v0.4 照 packages-catalog v0.2 增量先例为独立行目录；词面已接线：
> wire 路由与 served 行已在库——桌面消费候逐面升级，落地前本方法无
> 桌面写入口）**
> （2026-09-19，proposal 026 面序 A1→A2→A3→A4；第 98 批词面二分裁
> 决：增删先行冻结，启停词面候 W25 VCC 键名真机核实）
> 机器可读词表：`schemas/packages-ops/v0.4/`（行级双 Schema＋6 正 /
> 11 负向量；核心消费测试
> `crates/provider-host/tests/packages_ops_consumer_v04.rs`；wire 路
> 由测试 `crates/provider-host/tests/packages_ops_wire_v04.rs`；TS 守
> 卫测试 `packages/contracts/src/application-contract.test.ts`）
> 范围：`packages.addRemoteRepo` / `packages.addLocalRepo` /
> `packages.removeRepo`（后端隔离环境内仓库订阅列表的九态任务化写
> 命令）
> 所有权边界：词表冻结、端口面（新增 default accessor
> `VpmBackend::repo_write_capabilities` -> `RepoWriteCapabilities`
> 三独立位，default declared-none，以及新增端口方法
> `add_remote_repo` / `add_local_repo` / `remove_repo`）＝核心域；
> wire 路由（accessor 门控的 `packages.repoOps` served 行、路由臂、
> 信封组装）＝核心域，**随本批落地**；
> `VrcGetLibBackend::repo_write_capabilities` 覆写与基于库面
> Settings 增删的三实现＝环境域（实现核对切片，024/025 同程序——
> 覆写翻转前 served 行如实 unavailable）；桌面消费＝桌面域（逐面升
> 级，`blocks` 演进照桌面表态）
> 更新：2026-09-19（v0.4.1 接线批：路由臂
> `packages.addRemoteRepo` / `packages.addLocalRepo` /
> `packages.removeRepo`＋served 行 `packages.repoOps` 门控读
> accessor 三独立位＋信封组装＋闭集投影＋wire 测试＋本文载明 wire
> 信封常量——词面零变更）；2026-09-19（v0.4 冻结批：双 Schema＋向
> 量＋核心消费测试＋TS 面＋mock 恒缺席臂＋双语协议本＋REGISTRY）

## A4 词面语义（订阅写面刻意不是 preview/apply 对偶）

- **三方法、无 preview 臂——A3 同律。** 端口恰为
  `add_remote_repo(&self, url: &str, name: &str)`、
  `add_local_repo(&self, path: &Path, name: &str)` 与
  `remove_repo(&self, repo_id: &str)`，各答 `Result<(), AppErrorV1>`；
  无 preview 方法，也不发明。远端仓库订阅天然含清单拉取网络段：预
  览无法在不做同样网络工作的前提下验证可达性——preview 臂只会是
  一次伪装成更安全首跳的第二跳网络往返，不予冻结。本面无任何方法
  存在可绑定的既有状态摘要：订阅列表在两次读取之间可漂移，诚实的
  失败模式是执行时端口答 `vua.vpm.repo_not_found`，绝非摘要仪式
  （ORC-WF-003/004 在此无购买）。增删一行订阅不删除任何包文件与任
  何项目内容，ADR-0006 破坏性警示路径无可警示，本面不发明破坏性事
  实。
- **用户显式提交即确认**（A3/A5 同向）。携 `confirmedDigest` 的请
  求＝形状违反（负例钉死）。
- **添加面不宣称幂等。** 与 A3 注册不同（库面 `AlreadyAdded` 将首
  次与重复折叠为一个成功事实），库面添加守卫对重复 url/name 答
  拒绝：wire 面将该拒绝如实答为 `vua.vpm.repo_invalid` 折 rejected
  文档——后端拒绝之处不发明幂等成功。
- **九态任务化写命令（写命令族一致形状）。** applyRemove、
  applyInstall、registerLocalPackage 与 project.setNote 均骑任务
  面；A4 三方法同构：`commandId` 幂等、可取消（远端面网络段可能悬
  挂——可取消性在此是实质）、事件＋修订，恢复将非终态残留映射为
  `inspect_required`、绝不隐式续传（诚实纪律 3）。

## 方法面

- **packages.addRemoteRepo**：`{url, name}`——双键闭集。`url` 为远
  端仓库 URL（非空；不冻结更紧 pattern：词表传输事实，不重审上游
  URL 语法）。`name` 为必填的用户 supplied 显示名（订阅列表呈现
  它；读面 `RepoInfoV01.name` Option 系既有行 verbatim 投影，不意
  味新行可无名）。首个冻结切片【不收】HTTP 头与任何凭据传输——
  未来收凭据的面需另立安全裁决。
- **packages.addLocalRepo**：`{path, name}`——双键闭集，无网络段。
- **packages.removeRepo**：`{repoId}`——单键闭集。仓库 id 是稳定行
  柄；【不冻结】索引寻址（索引在并发写下漂移）。未知 `repoId` 在
  执行时答 `vua.vpm.repo_not_found`。id 缺席的行在本词面移除可达范
  围之外（诚实边界；未来词面可寻址它们，此处不发明）。
- **三方法均不收 `projectPath`。** 订阅面只写后端隔离环境（A3 冻
  结的同一事实）——绝不触用户 VCC/ALCOM 设置、绝不触项目。注册项
  目门（013 `project_not_found` 复用）对本面不适用。
- **结果（Done payload），kind=repoReceipt（添加臂）**：最小诚实审
  计形状，按 `repoType` 分两互斥变体——remote：
  `{schemaVersion: "vua.packages-ops/v0.4", kind: "repoReceipt",
  repoType: "remote", url, name}`；local：
  `{..., repoType: "local", path, name}`。端口答 `Result<(), _>`：
  无实际结果载荷，各变体只携请求回显（`additionalProperties:false`
  禁止发明更多——订阅时间戳、行位、拉取到的清单内容均属 Schema 非
  法）。
- **结果，kind=removed（移除臂）**：
  `{schemaVersion: "vua.packages-ops/v0.4", kind: "removed", repoId}`——
  被删行 id 回显，本面唯一事实（回显即审计链；不发明被删行快照：
  行可携本面从不过手的 id 缺席事实）。repoReceipt/removed 键集彼此
  互斥，且与一切前代收据臂（removeReceipt/installReceipt/
  registerReceipt）互斥。
- **结果，kind=rejected**：guard 闭集维持 A1/A2 三值——A4 零新增
  guard。一切端口拒绝折 `execution_failed` 携原码 detail 如实溯
  源：`vua.vpm.repo_invalid`（重复 url/name、官方/curated 守卫、形
  状违规）、`vua.vpm.repo_not_found`（未知 repoId）、
  `vua.vpm.repo_fetch_failed`（远端清单拉取失败——仅 add-remote 网
  络段）、`vua.vpm.repo_write_failed`（隔离环境 settings 写回）。
  复用 `vua.vpm.*` 码永不入 `code` 键（013 复用码法；pattern 锁
  `^vua\.packages\.`，负例钉死）。
- **信封错误面（零新码）**：无对应能力位的后端答通用
  `vua.vpm.capability_missing`（trait default 的 `unsupported` 事
  实；wire 门在 submit 前作答——能力缺席绝不进任务）；参数违反答
  `vua.packages.invalid_params`；未接线引擎答诚实缺席臂
  `vua.packages.unavailable`。
- **服务门（已接线，落地）**：新增 default accessor
  `VpmBackend::repo_write_capabilities() -> RepoWriteCapabilities`
  三独立位（`add_remote_repo` / `add_local_repo` / `remove_repo`——
  后端可只服务面的子集；门按方法、绝不按面；default declared-none；
  025 `catalog_capabilities` 同律，ORC-DEV-004）。served 行
  `packages.repoOps` 一行服务三方法（removeOps/installOps/
  registerOps 一行先例）：行可用性＝后端声明【任一】独立位即
  available（部分覆写的后端，其已服务方法绝不被面级行隐藏）；每个
  路由在 submit 前各自独立读【本方法】的位，缺席答通用
  `capability_missing`——能力缺席绝不进任务。VrcGetLib 覆写随环境
  实现核对切片落地——此前该行如实 unavailable。
- **端口码映射随本批申报**（逐码完整对齐申报随环境实现核对切片，
  A1/A2/A3 同径）：`repo_invalid` / `repo_not_found` /
  `repo_fetch_failed` / `repo_write_failed` → rejected
  `execution_failed` 携原码 detail；能力缺席 → 通用
  `capability_missing`（信封错误，submit 前）。

## 明确在本词面之外

- **启停（enable/disable）**：库面 `UserRepoSetting` 无 enabled 字
  段、settings 模型无禁用列表建模——VCC 禁用列表键名与语义须经真
  机核实（W25 窗口事项，024 表态 (b) `vcc.liteDb` 核实可同窗顺带）
  后方可冻结任何启停词面。此前启停不在任何已冻结词面内，wire 无
  对应方法。
- **重排**：库面完备，但第 98 批二分裁决冻结「增删先行」；重排不在
  本词面，后续切片候消费需求落地再冻。
- **add-remote 的 HTTP 头/凭据传输**：本词面不收（见上）。

## 信封、版本与依赖方向

wire 信封是常设形状（`schemaVersion` 信封常量 `"0.4"`＋
`operation`＋`result`）；结果文档自带族常量
（`vua.packages-ops/v0.4`）——两个版本相互独立（c914cf2 常设规则：
每条 wire 行自带版本常量）。三方法的任务受理应答与 Done payload
均盖 `"0.4"` 信封常量。v0.1 移除方法继续在 v0.1 词面应答、v0.2 安
装方法在 v0.2 词面应答、v0.3 注册在 v0.3 词面应答；v0.4 请求仅为
A4 三方法（v0.2/v0.3/v0.4 `changePlan` 形状共享同一键集——消费者
按 `schemaVersion` 字面量窄化，不按键集）。依赖方向不变：
renderer → 类型化 Gateway → Electron main（verbatim 透传）→ 版本
化应用契约 → provider wire 面 → `VpmBackend` 端口 →
project-manager 适配器。框架与厂商类型留在适配器；词表运输事实。

## 诚实边界

- **词面已接线、未消费。** wire 路由（三臂）、`packages.repoOps`
  served 行与信封组装随 v0.4.1 接线批落地——三方法自本批起在
  wire 面存在。桌面尚无任何写入口（消费候逐面升级）；环境
  `VrcGetLibBackend::repo_write_capabilities` 覆写与三实现未落
  （落地前 served 行如实 unavailable）；真实后端消费归环境实现核
  对切片。wire 测试骑真帧环与假后端；端到端走查归 W25（候用户开
  窗 O-2）。本文档不宣称任何真机行为。
