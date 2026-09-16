# packages-repos / packages-catalog 协议 v0.1（packages P2 读面词表行：packages.listRepos ＋ packages.packageCatalog）

[English](packages-repos-catalog-v0.1_EN.md) | [简体中文](packages-repos-catalog-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（包管理 P2 只读词表行）**
> （2026-09-17，提案 025 P2 核心冻结批：表态程序收敛——环境提案
> 64bfe58、集成表态 7a50ce9、桌面表态 0031004、核心方向裁决
> bf78368；本批落死权威词面）
> 机器可读词表：`schemas/packages-repos/v0.1/` ＋
> `schemas/packages-catalog/v0.1/`（逐方法 Schema＋3 正 3 负与 4 正
> 4 负向量；核心消费测试 `crates/provider-host/tests/
> packages_p2_consumer.rs`；TS 消费测试
> `packages/contracts/src/application-contract.test.ts`）
> 范围：`packages.listRepos`（仓库订阅清单，订阅面为世界）与
> `packages.packageCatalog`（单包目录事实，注册工程上下文，按需粒度）
> 所有权边界：词表冻结、端口面（`VpmBackend` catalog 访问器与方法）、
> wire 路由＝核心域；`VpmBackend` 库面实现（project-manager）＝环境
> 域（实现切片随后续批落地）；桌面消费＝桌面域（表态 0031004：P2 消
> 费切片硬前置＝词面冻结＋TS 面登记＋形状核可，照 P1 全链程序）
> 更新：2026-09-17（v0.1 冻结批：双 Schema＋向量＋核心消费测试＋TS
> 面＋双语协议本＋REGISTRY 登记）

## P2 读面语义（分期与 P2 刻意不为之事）

提案 024/025 分期：P1 读面（已冻结，`packages.listInstalled`）、P2
仓库/目录面（本批）、P3 变更面（照提案 013 R5 逐面独立提案）。收敛
的开放问题 4 裁决在此维持同一纪律：**仓库启停、增删与主动网络刷新
（`update_cache`）系写面——不存在于本词表族**，照 013 R5 逐面独立提
案路径办理（任务九态、确认链、审计、恢复语义逐项配套）。P2 按设计
只读。

健康面系 **P2 非目标**：库面无健康事实载体（`VrcGetMeta` 仅 etag——
无时间戳、无错误状态、无可达性），故无 health/status/lastRefreshed
词面，携带此类字段的结果在 Schema 即非法，非「不鼓励」而已。逐仓库
缓存存在性已由必带 `cached` 事实诚实覆盖。

## 核心裁决（开放问题 1，随冻结批落死）

1. **仓库清单世界＝订阅面**（用户配置事实，settings `userRepos` 逐字
   投影、数组顺序保持）。刷新派生的缓存面只以逐行 `cached` 事实出
   现。「已订阅未刷新」是诚实的清单行（`cached=false`），不隐藏、不
   渲染成空目录。
2. **目录粒度＝按需查询。** 无全量目录投影、无分页语义——数千包级
   缓存永不过此面；更多包＝更多次查询。
3. **updateAvailable 判定（P1 桌面头注遗留正式承接）。** 只出结论：
   本工程已装版本 vs 最新兼容版本（`find_package_by_name` ＋
   `VersionSelector::latest_for`）；比较在实现域内完成；prerelease
   是否纳入读用户 `show_prerelease_packages` 设置——wire 无开关。
   `null`＝判定未执行（本工程未安装，或工程 Unity 版本未知）——
   **缺席不是「无更新」**；消费端维持 P1 防线（null 时不渲染更新
   UI，绝不以默认 false 填充）。
4. **能力声明＝独立的默认访问器**（`VpmBackend::catalog_capabilities()
   -> CatalogCapabilities`，默认 declared-none）。`VpmCapabilities`
   五位闭集保持稳定；后端恰在实现 P2 方法时覆写默认（ORC-DEV-004：
   无实现不预留）。wire `served_capabilities` 行
   （`packages.listRepos` / `packages.packageCatalog`）随装配与该声
   明翻转。
5. **错误码：全复用。** 不新立一码；P2 闭集复用
   `vua.project.project_not_found`（未注册路径，与 013 同事实同码）、
   `vua.vpm.no_matching_package`（仓库缓存与本地集合均无此包——消费
   端呈现为独立空态非错误页）、`vua.vpm.project_load_failed`、
   `vua.vpm.capability_missing`、`vua.vpm.backend_unavailable`，以及
   传输面 `vua.packages.invalid_params` / `vua.packages.unavailable`。
6. **stale 披露采纳（实现切片面）。** 离线降级路径（ORC-ADP-006 先
   例）可为其缓存来源结果加注；该标注是否以及如何过 wire 随环境实
   现切片落死——页面永不自行标注自己没有的新鲜度（桌面表态：无事
   实不渲染）。

## 方法面

- `packages.listRepos`——`kind: "query"`，params 空闭集（订阅面系全
  局配置）。result 族常量 `vua.packages-repos/v0.1`；行携带四个可空
  标识/定位事实（null＝库面 Option 逐字投影；本地目录仓库
  `url=null`）＋必带 `cached` 布尔。行序＝订阅面自身顺序（冻结呈现
  事实；消费端不重排）。空 `repos` 数组是合法诚实答案（零订阅）。
- `packages.packageCatalog`——`kind: "query"`，params 双键闭集
  `{ projectPath, packageId }`（projectPath＝013 注册身份，即
  compatible 判定上下文——绝不做跨工程断言）。result 族常量
  `vua.packages-catalog/v0.1`；本体：`displayName`（可空；null 时以
  packageId 兼任显示名，P1 裁决 3）、`source`（`"repo" | "local"`
  二态来源）、`installed`（工程事实；桌面三态呈现＝source ×
  installed 组合——词面绝不合并来源与安装两事实）、
  `updateAvailable`（裁决 3 的结论或 null）、`versions`（仓库缓存版
  本 semver 升序；local 来源＝空数组——诚实空，非错误；每行
  `version` 逐字＋`yanked` 缓存携带事实＋`compatible` 布尔或
  null——按选中工程 Unity 版本判定，null＝版本未知，null 不是不兼
  容）。

## 信封、版本与依赖方向

wire 信封系常设形状（`schemaVersion` 信封常量 `"0.1"` ＋ `operation`
＋ `result`）；每个 result 文档携带自己的族常量
（`vua.packages-repos/v0.1`、`vua.packages-catalog/v0.1`）——两版本
独立（c914cf2 常设规矩）。依赖方向不变：renderer → 类型化 Gateway →
Electron main（逐字透传）→ 版本化应用契约 → provider wire 面 →
`VpmBackend` 端口 → project-manager 适配器。框架与厂商类型留在适配
器；词表只传输事实。

## 机器可读词表

- `schemas/packages-repos/v0.1/command.schema.json` ＋
  `result.schema.json` ＋ `examples/`（3 正 3 负）
- `schemas/packages-catalog/v0.1/command.schema.json` ＋
  `result.schema.json` ＋ `examples/`（4 正 4 负）
- 消费测试：`crates/provider-host/tests/packages_p2_consumer.rs`
  （Schema 向量＋端口→wire 投影闭环＋trait 默认缺席臂）；
  `packages/contracts/src/application-contract.test.ts`（TS 守卫闭集）

## 诚实边界与开放项

- 真实后端消费（`VrcGetLibBackend` 实现两方法）系环境实现切片，随本
  冻结批之后落地并自带测试；在此之前 `VccCliBackend` 与一切未实现后
  端答 `capability_missing`（诚实缺席，declared-none 能力）。
- stale/缓存来源 wire 标注随环境实现切片落死（裁决 6）——上述词面
  不为其预留字段。
- 桌面 P2 消费照 P1 全链程序（词面→TS 面→形状核可→消费切片）；消
  费批落地且用户重启 dev 栈之前，包管理器页维持 P1 中间诚实态。零
  端到端宣称：真机走查仍归 W25（候用户开窗 O-2）。
