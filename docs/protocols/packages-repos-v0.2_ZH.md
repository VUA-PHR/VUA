# packages-repos 协议本 v0.2（packages.listRepos 读面增量：订阅行启停状态位）

[English](packages-repos-v0.2_EN.md) | [简体中文](packages-repos-v0.2_ZH.md)

> 文档版本：0.2.1
> 状态：**已冻结（packages-repos 词表行 v0.2＝订阅行状态增量；
> v0.1 行保持冻结原样服务——backend 未采纳 v0.2 前继续应答 v0.1 族；
> v0.2 照 packages-catalog v0.2 / packages-query v0.2 增量先例为独立行
> 目录。）且已接线（v0.2 协商路由臂已随 F4 接线批 2026-09-21 落地：声明 `repos_v02`
> 的 backend 经 `packages.listRepos` 应答 v0.2 族，其余照旧答 v0.1 族。
> 未消费：桌面启停开关呈现候形状核可）**
> （2026-09-20，proposal 027 F4 冻结批同批产物——无读回位则启停写面不
> 可诚实消费；解冻权威与存储裁决见 packages-ops v0.6 协议本）
> 机器可读词表：`schemas/packages-repos/v0.2/`（行级双 Schema＋3 正 /
> 4 负向量；核心消费测试
> `crates/provider-host/tests/packages_repos_consumer_v02.rs` 3 例；wire
> 测试 `crates/provider-host/tests/packages_repos_wire_v02.rs` 3 例）
> 范围：`packages.listRepos` 结果面恰加一个必带行级事实 `enabled`
> 所有权边界：词表冻结＋端口面（`RepoInfoV02`＋default accessor
> `repos_v02`＋`list_repos_v02`，default declared-false/缺席）＝核心域；
> 协商路由臂＝核心域，F4 接线批已落地（2026-09-21，族常量
> `PACKAGES_REPOS_SCHEMA_VERSION_V02` 由路由盖章）；双实现（VrcGetLib 从
> VUA 自有存储投影状态位）＝环境域实现核对切片；桌面消费＝桌面域（订阅
> 行启停开关呈现，候形状核可）
> 更新：2026-09-21（v0.2.1 接线批：packages.listRepos 协商路由臂落地
> ——词面零变更，本文档版本只登记路由落地事实。前次：2026-09-20 v0.2
> 冻结批：双 Schema＋向量＋核心消费测试＋TS 面＋双语协议本＋REGISTRY；
> command 面与 v0.1 逐字节同形零变更）

## 增量语义（v0.1 词面绝不原地修订）

- **v0.2＝冻结 v0.1 result 恰加一个必带行级事实，其余零变动**：行闭集
  ＝v0.1 五键（repoId / name / url / localPath 可空串＋cached 必带布
  尔）＋`enabled` 必带布尔。行序＝订阅面自身顺序（settings userRepos
  配置事实 verbatim）不变；空数组诚实应答不变；健康面非目标不变。
- **command 面与 v0.1 逐字节同形**（F3 增量先例）：信封 const 保持
  "0.1"、params 空闭集不变、零参数不变；`PackagesListReposQueryV01`
  TS 类型零变化、请求 union 零新增成员。
- **双版本协商（additive，catalog_v02 / query_v02 先例）**：default
  accessor `repos_v02() -> bool`（default false——ORC-DEV-004 无实现不
  预留）＋`list_repos_v02() -> Result<Vec<RepoInfoV02>, AppErrorV1>`
  （default 缺席臂答 `capability_missing`）。backend 恰在实现
  `list_repos_v02` 时覆写 accessor；路由恰在声明时服务 v0.2，其余
  backend 继续应答冻结 v0.1 族——**盖戳族常量告知消费端应答的是哪个词
  面，永不猜测**；v0.1 形状行在 v0.2 Schema 下非法（缺 REQUIRED 键）
  ＝版本增量机器可检测（负例钉死）。

## enabled 位语义（冻结裁决）

- **`enabled`＝VUA 自有启停状态位**（packages-ops v0.6
  `enableRepo`/`disableRepo` 写面读回）：true＝该行在包集合世界中活跃
  （枚举与解析面可见其包）；false＝已禁用——**仍在订阅且在列**（订阅
  面是配置事实，禁用对配置视图零隐藏），但其包被枚举与解析排除。
- **VUA 自有语义、无可共享 counterpart**：W25 只读取证记录裁决 (c)
  （027 提案 s6）——VCC 2.4.5 三存储位均无启停状态。该位投影 VUA 自有
  存储（环境根下 `.vua/` 惯例状态文件），**绝不是 settings.json 键**、
  绝不是 userRepos[i] 元素键（存储裁决全文见 packages-ops v0.6 协议本）。
- **id 缺席行法则**：repoId 为 null 的行 `enabled` **恒为 true**——id
  缺席行在启停面可达范围之外（A4 removeRepo 同边界：id 即行柄），
  true 是其诚实的恒久事实。
- **虚假断言防线**：health / status / lastRefreshed / disabledAt 等无
  端口载体事实在 schema 即非法（additionalProperties:false，负例钉死）
  ——P2 冻结词面同款纪律。

## 错误码（零新码）

- 读面错误面与 v0.1 完全一致零变更：信封层形状违例
  `vua.packages.invalid_params`、能力缺席 `vua.vpm.capability_missing`
  、未接线 `vua.packages.unavailable`——v0.2 增量不动错误面。

## 后端指向根事实专节（027 检查点——必载）

- **状态位事实源**：与 packages-ops v0.6 启停写面同一存储——
  `<environment_root>/.vua/vpm-repo-state.json`（VUA 自有存储，禁用集
  以 repoId 为键，文件缺席＝全部启用即全部 true）。
- **生产接线面**：environment_root＝用户真实 VCC 共享根
  （026 U14 接线事实）；**本面只读**——绝不写 settings.json、绝不写
  共享缓存、绝不写状态文件（写路径仅启停写面）。
- **测试隔离面**：`with_environment_root` 临时根注入，合成数据；实现
  核对切片以临时根单元测试对账（状态文件投影、缺席文件默认态、
  id 缺席行恒 true）。

## 诚实边界

零端到端宣称维持——本增量已冻结并**已接线、未消费**（v0.2 协商路由臂
已随 2026-09-21 F4 接线批落地——wire 测试内对 FAKE backend 作答；
VrcGetLib 状态投影候环境实现核对切片——此前真实 backend 如实继续应答
v0.1 族；桌面启停开关呈现候形状核可）；真机走查归 W25（O-2）。与
packages-ops v0.6 同批冻结：写面与读回位一体交付，无读回位则切换面不
可诚实消费。
