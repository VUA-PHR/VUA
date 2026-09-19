# packages-query 协议 v0.2（packages.listInstalled 结果族：已装表更新感知增量）

[English](packages-query-v0.2_EN.md) | [简体中文](packages-query-v0.2_ZH.md)

> 文档版本：0.2
> 状态：**已冻结（packages-query 结果族 v0.2 增量）**
> （2026-09-20，提案 027 F3 冻结批：核心表态 3 与环境考证 s2、桌面
> IA 表态 3 同向收敛，面序 F2→F3 三域收敛第 121/122 批登记；F2 冻
> 结＋接线均已入库＝领取条件成就〔第 124/126 批核实〕）
> 机器可读词表：`schemas/packages-query/v0.2/`（command 与 v0.1 逐字
> 节同形；result ＝ v0.1 恰加三事实＋4 正 7 负向量；核心消费测试
> `crates/provider-host/tests/packages_query_consumer_v02.rs`；TS 面
> `packages/contracts/src/application-contract.ts`）
> 范围：仅 `packages.listInstalled` 的 **result 族**升版至
> `vua.packages-installed/v0.2`。command 面零变化；冻结的 v0.1 词面
> 绝不原地修订
> 所有权边界：词表冻结、端口面、wire 路由＝核心域；`VpmBackend` 库
> 面实现（project-manager）＝环境域（实现核对切片：`list_packages_v02`
> ＋`query_v02` 覆写）；桌面消费＝桌面域（形状核可＋消费批：双族常
> 量接纳＋「可更新」列诚实呈现）
> 更新：2026-09-20（v0.2 增量冻结批：Schema＋向量＋核心消费测试＋
> TS 面＋双语协议本＋REGISTRY 登记）

## 增量内容（恰三个新事实）

v0.2 result ＝ 冻结的 v0.1 result **恰加三个必带事实**，其余零变动
（packageId 升序、诚实空清单、错误面全部照 v0.1 冻结词面延续）：

- 行级判定对（每个已装包行必带、可空）：
  - `latestVersion`（string | null）＝冻结选择器判定的最新版本事实。
    **跨仓 max**：判定跨集合**全仓库集**合并取最高合资格版本（库面
    `find_package_by_name` 语义）——刻意**非** F2 分仓视图（逐仓分组
    是 packages-repo-catalog 族的声明事实）；两视图是不同事实、各面
    各自声明、**永不混同**。null＝当前设置下无合资格最新版（本地包
    无缓存位、或全部候选被 yanked/用户设置排除）——**缺席不是
    「无更新」**。
  - `updateAvailable`（boolean | null）＝冻结判定**结论**（存在严格
    更新的、符合当前过滤条件的版本）。null＝判定未执行（无合资格最
    新版，或工程 Unity 版本未知）——**null 绝不渲染「已最新」**（024
    表态②虚假断言防线，用户裁定 2026-09-20 重申），绝不以默认
    false 填充。
- 文档级披露：`cacheSourced`（boolean，必带）＝catalog v0.2 先例
  （ORC-ADP-006 同构）：true＝本次清单判定经**缓存降级路径**（offline
  →`load_cache`，或在线 load 失败降级）；false＝在线刷新 load 所得。
  信息性非失败；消费端呈现「缓存数据」标注，绝不为无此字段的 v0.1
  应答虚构标注。

## 判定语义（两语义边界落死）

选择器**逐字复用** packages-catalog 族冻结语义：
`latest_for(工程 Unity 版本, show_prerelease 用户设置)`，零 wire 开
关（设置系服务端用户配置，不发明偏好字段）。两处语义边界照环境考
证（027 考证节 §2）落死：

1. **跨仓 max 与分仓视图差异**：本面判定＝跨仓库合并取版本最高；同
   名包多仓时 latest 可能来自与 F2 分仓视图不同的仓库。F2 词面已声
   明「逐仓分组、绝不跨仓合并」，本词面对称声明「跨仓合并取最高」
   ——两视图分立、不冲突、不混同。
2. **已装 prerelease＋开关关的 false 语义**：已装版本自身是
   prerelease 且 `show_prerelease_packages=false` 时，合资格最新仅在
   稳定集内取。此时 `updateAvailable:false` 的精确语义＝「**不存在
   严格更新的、符合当前过滤条件的版本**」，**不是**泛化的「无更新」
   ——消费端不得把 false 证据化为「该包已停更」或「已是最新」以外
   的任何断言；latestVersion 与 updateAvailable 成对携带，判定边界
   始终可读。

## 判定成本与 latest_for 复用度（随本批落死）

判定纯内存、**批量可行**（027 考证节 §2 成本结论）：整表判定骑
**一次**集合加载（与 F2/catalog 判定同一缓存面同一事实源）；**逐行
独立加载集合不构成本面的合法实现形态**。latest_for 选择器语义复用
度＝**全量复用**（选择器、prerelease 设置读取、Unity 版本绑定与
catalog 判定逐字同源），不立第二判定语义。

## 双版本协商（纯增量，零破坏）

- 端口面新增**默认特征项**（零编译波及）：
  `VpmBackend::query_v02() -> bool`（默认 false——恰在实现 v0.2 方
  法时覆写，ORC-DEV-004：无实现不预留）与
  `list_packages_v02(...) -> Result<InstalledListingV02, AppErrorV1>`
  （默认缺席臂 `capability_missing`）；`InstalledPackageV02` ＝
  `InstalledPackageV1` 全键＋`latest_version`＋`update_available`；
  `InstalledListingV02` ＝ 行集＋`cache_sourced`。
- wire 路由**双臂协商**（接线切片落地）：声明 v0.2 的 backend 以
  `vua.packages-installed/v0.2` 族应答；未声明的 backend 维持冻结的
  `vua.packages-installed/v0.1` 族应答。族常量与 projectPath 在信封
  组装时由路由盖戳（P1 纪律：信封事实路由定，后端事实逐字）——消
  费端读族常量辨词面世代，**永不猜测**。v0.1 形状行对 v0.2 Schema
  非法（缺必带键）——版本增量机器可检测（消费测试钉死）。
- 信封常设形状不变（`schemaVersion` 信封常量 `"0.1"` ＋ `operation`
  ＋ `result`；c914cf2 规矩：族版本独立于信封版本）。
- **错误面零新码**：注册校验复用 `vua.project.project_not_found`、
  形状违反 `vua.packages.invalid_params`、能力缺席
  `vua.vpm.capability_missing`、后端类型化失败逐字透传——全部照
  v0.1 冻结面，协商不新增任何错误码。

## 后端指向根事实（027 检查点 8）

- **已装集事实源根**：目标工程的 `Packages/vpm-manifest.json`＋lock
  （P1 冻结事实源，零变动）。
- **latest 判定数据源根**：**单一环境根**下的仓库缓存集合面——
  settings.json `userRepos`＋`Repos/vrc-official.json`＋
  `Repos/vrc-curated.json`（受各自 ignore 开关影响）＋各
  `userRepos[i].localPath` 缓存；prerelease 开关读同一 settings.json
  的 `show_prerelease_packages`。
- **生产接线面**＝用户真实 VCC 共享家目录（024/026-U14 落账事实），
  本面**只读**（绝不写 settings/缓存/项目；在线刷新＝etag 条件拉取，
  与 VCC/vrc-get 自身行为同源）。
- **测试隔离面**＝`VrcGetLibBackend::with_environment_root` 临时目录
  注入、纯合成数据（实现核对切片验收锚照 F2 先例：从接线代码可重
  推导）。

## 词面之外（explicitly outside）

- **不立 upgrade 动词**（026 已立规矩维持）：更新路径＝A2 安装面
  version=null 解析器语义；本面只携带判定事实，不携带执行动词。
- **无自动更新/无后台刷新**：本面是只读查询，不触发任何写行为；刷
  新写面归 packages-ops（F4）。
- **零 wire 开关**：prerelease 包含与否读用户设置，不在词面发明偏好
  键（catalog 冻结语义延续）。
- **字段上限维持**：source / versions / compatible / changelogUrl /
  displayName 仍不在本面（逐包版本枚举＝packages-catalog 面的按需
  事实——每行常量重复全版本表将击穿该粒度裁决；displayName 缺席＝
  P1 裁决，ORC-DEV-004）。已装行携带它们＝Schema 非法（虚假断言防
  线，负例向量钉死）。

## 机器可读词表

- `schemas/packages-query/v0.2/command.schema.json`（与 v0.1 逐字节
  同形）＋ `result.schema.json` ＋ `examples/`（4 正 7 负，含判定真/
  假/未执行三臂正例与缓存降级披露正例；负例含发明字段、缺必带键、
  缺披露、类型违例）
- 消费测试：`crates/provider-host/tests/packages_query_consumer_v02.rs`
  （向量准入/拒绝＋trait 默认缺席臂＋fake 端口→wire 投影 exact-key
  钉死〔全判定臂＋升序钉＋无发明字段钉〕＋「v0.1 行对 v0.2 Schema
  非法」版本可检测性钉死）
- TS 面：`packages/contracts/src/application-contract.ts`
  （`PackagesInstalledItemV02`＋`PackagesListInstalledResultV02`；
  command 守卫面不变）

## 诚实边界与开放项

- **核心接线切片（下一环）**：`packages.listInstalled` 路由双臂协商
  ＋信封常量命名＋wire 测试（照 A3/A4/A5/F2 接线先例）。
- **环境实现核对切片**：`VrcGetLibBackend` `list_packages_v02`＋
  `query_v02` 覆写＋一次集合加载批量判定＋离线降级 cacheSourced 臂
  ＋单元测试；验收锚＝本协议本「后端指向根事实」节逐项对账。
- **桌面形状核可＋消费批**：已装表「可更新」列——判定事实唯本词面；
  **无判定事实（null）不渲染「已最新」，该列如实空显**；cacheSourced
  呈现「缓存数据」信息标注；行内升级键复用 A2 安装面 version=null
  语义（桌面 IA 表态 3 照准）。
- 零端到端宣称维持：真机走查归 W25（候用户窗 O-2）。
