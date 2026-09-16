# packages-catalog 协议 v0.2（packages.packageCatalog 结果族：cacheSourced 披露增量）

[English](packages-catalog-v0.2_EN.md) | [简体中文](packages-catalog-v0.2_ZH.md)

> 文档版本：0.2
> 状态：**已冻结（packages-catalog 结果族 v0.2 增量）**
> （2026-09-17，提案 025 内联裁决：表态收敛面——环境形状提案 A
> 〔实现切片声明节〕、桌面表态第 5 条披露枝〔0031004〕、核心方向
> 裁决 6〔bf78368〕三域同向；核心表态节与冻结批同轮先后落节）
> 机器可读词表：`schemas/packages-catalog/v0.2/`（command 与 v0.1
> 逐字节同形；result ＝ v0.1 恰加一个必带键＋4 正 5 负向量；核心消
> 费测试 `crates/provider-host/tests/packages_p2_consumer.rs`；TS 面
> `packages/contracts/src/application-contract.ts`）
> 范围：仅 `packages.packageCatalog` 的 **result 族**升版至
> `vua.packages-catalog/v0.2`。command 面零变化；`packages.listRepos`
> 的 `vua.packages-repos/v0.1` 族零变化（刻意不加字段，见下）；冻结
> 的 v0.1 词面绝不原地修订
> 所有权边界：词表冻结、端口面、wire 路由＝核心域；`VpmBackend` 库
> 面实现（project-manager）＝环境域（增补批适配）；桌面消费＝桌面
> 域（消费更新批：双族常量接纳＋cacheSourced 标注）
> 更新：2026-09-17（v0.2 增量冻结批：Schema＋向量＋核心消费测试＋
> TS 面＋双语协议本＋REGISTRY 登记）

## 增量内容（恰一个新键）

v0.2 result ＝ 冻结的 v0.1 result **恰加一个必带键 `cacheSourced`**
（布尔），其余零变动：

- `true`＝本次结果经**缓存降级路径**（offline→`load_cache`，或在线
  `load` 失败降级——ORC-ADP-006 同构先例）；
- `false`＝在线刷新 load 所得。
- **信息性非失败**：缓存来源不是错误；消费端呈现「缓存数据」类标注，
  绝不渲染为失败。
- **零虚构防线**：v0.1 应答不带此字段——消费端对无此字段的应答绝不
  自行标注缓存来源（无事实不渲染；桌面表态第 5 条后半枝）。
- `updateAvailable` 系判定结论，其事实源可能受缓存陈旧影响——此披露
  即为此诚实缺口而设（结论字段照 v0.1 语义零变动）。

## 双版本协商（纯增量，零破坏）

- 端口面新增**默认特征项**（零编译波及）：
  `VpmBackend::catalog_v02() -> bool`（默认 false——恰在实现 v0.2 方
  法时覆写，ORC-DEV-004：无实现不预留）与
  `package_catalog_v02(...) -> Result<PackageCatalogV02, AppErrorV1>`
  （默认缺席臂 `capability_missing`）；`PackageCatalogV02` ＝
  `PackageCatalogV01` 全键＋`cache_sourced`。
- wire 路由**双臂协商**：声明 v0.2 的 backend 以
  `vua.packages-catalog/v0.2` 族应答；未声明的 backend 维持冻结的
  `vua.packages-catalog/v0.1` 族应答。族常量在信封组装时由路由盖戳
  （P1 纪律：信封事实路由定，后端事实逐字）——消费端读族常量辨词面
  世代，**永不猜测**。v0.1 形状 result 对 v0.2 Schema 非法（缺必带
  键）——版本增量机器可检测，此系「新族版而非原地修订」的理由本身。
- 信封常设形状不变（`schemaVersion` 信封常量 `"0.1"` ＋ `operation`
  ＋ `result`；c914cf2 规矩：族版本独立于信封版本）。

## repos 族刻意不加字段

`packages.listRepos`（`vua.packages-repos/v0.1` 维持不动）系**零网络
读面**（订阅面投影＋逐仓库缓存命中判定，全程本地事实）——
`cacheSourced` 在该族恒为 false 常量。恒常量信息字段不是事实、不值
得 wire 键（诚实纪律同 health/status 先例：无信息量的字段不发明）。

## compatible 语义澄清（随本批登记）

`compatible`（v0.1 冻结、v0.2 延续）的语义＝库自身完整
`unity_compatible`（vrc-get-vpm，行为权威）——**非**一般分支简化
（proposal 025 内联核心表态口径 2：同响应内 updateAvailable 走
`latest_for` 全语义链，compatible 字段必须同定义；Unity 6000 反例与
SDK 3.0–3.4／resolver ≤0.1.26 分歧例见表态节）。词面零变化（语义本
就按库全语义冻结）；实现面由环境增补批复刻四分支＋分歧例单测钉死。

## 机器可读词表

- `schemas/packages-catalog/v0.2/command.schema.json`（与 v0.1 逐字
  节同形）＋ `result.schema.json` ＋ `examples/`（4 正 5 负，含
  cacheSourced=true 诚实降级正例与错误类型负例）
- 消费测试：`crates/provider-host/tests/packages_p2_consumer.rs`
  （v0.2 Schema 向量＋V02 端口→wire 投影闭环＋声明/缺席默认臂＋
  「v0.1 形状对 v0.2 Schema 非法」版本可检测性钉死）
- TS 面：`packages/contracts/src/application-contract.ts`
  （`PackagesPackageCatalogResultV02`；command 守卫面不变）

## 诚实边界与开放项

- 环境增补批（project-manager）：复刻完整 `unity_compatible` 四分支
  ＋分歧例单测＋`catalog_v02`/`package_catalog_v02` 适配＋
  cacheSourced 事实源一行上贡。
- 桌面消费更新批：live 层双族常量接纳（现严格钉定 v0.1，
  packages-live.ts:149）＋cacheSourced=true「缓存数据」信息标注＋形
  状核可（照 P1 全链程序）。过渡期用户 dev 栈未重启（候用户窗口在
  案），无真机暴露窗口。
- 零端到端宣称维持：真机走查归 W25（候用户开窗 O-2）。
