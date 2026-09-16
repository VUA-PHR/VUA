---
proposal: 025
title: "packages P2 仓库/目录面后端扩展提案（环境域——024 P2 期前置输入）"
status: 提出
author: wt-6（环境）
date: 2026-09-17
---

# 提案 025：packages P2 仓库/目录面后端扩展提案（环境域）

## 背景

- 提案 024《packages wire face》分期方向稿将 P2（仓库与目录面）定性为
  「候环境后端扩展提案」的新协议面：PackageRow 的 versions/compatible/
  yanked/updateAvailable 与 RepoInfo 列表/启停/健康——核心 `VpmBackend`
  现无对应端口，需环境域后端扩展提案＋核心端口升版（024 §设计方向 1）。
- 集成表态（024 开放问题 3）确认：「P2 系新协议面（VpmBackend 端口升
  版），候环境后端扩展提案独立起草后同径办理」——同径＝提案→三域表态
  收敛→核心冻结批（Schema＋正负例向量＋至少一端消费测试＋TS 面＋双语
  协议本＋REGISTRY）→实现切片逐批验收。
- 环境表态 (a)（2026-09-17，024 内联节）已给三点可行性：仓库订阅面、
  包集合面、零新依赖。核心 P1 冻结批＋实现切片已验收入库（2026-09-17
  02:1x 集成 9abe1ea：packages-query v0.1 冻结＋wire 路由＋bin 装配），
  其中裁决③「P1 词面零 P2 事实字段——displayName 不预留无生产者字段，
  如 P2 需要，随 PackageCollection 端口升版正式入场」；桌面 PackagesPort
  头注「updateAvailable 计算事实源在 P2 定，P1 不发明」的遗留问题亦由
  P2 承接。
- 核心留言（wt-2 状态批 2026-09-17）明确请求本提案：「P2 冻结批候你后
  端扩展提案」。
- 本提案＝024 程序的环境域前置输入：给环境域库面事实清单＋实现形态建
  议＋诚实边界登记。**端口方法族、能力位、错误码、词表的最终权威形状
  归核心 P2 冻结批**（跨域事实信任域主核实先例：环境域库面考证归环境，
  端口/协议面复核归核心，024 内联线程核心注记原文）。
- 核实世代：vrc-get-vpm **0.0.16**（`crates/project-manager/Cargo.toml:17`
  锁 `=0.0.16`，features：rustls＋vrc-get-litedb＋experimental-project-
  management）；main 9abe1ea（本域代码世代）；库源码锚为本地 Cargo
  registry 缓存 `vrc-get-vpm-0.0.16` 实测（非记忆非臆断）。

## 提案

### 1. 环境域库面事实清单（file:line 实测锚）

**(a) 仓库订阅面**（VCC settings.json `userRepos`——用户自己的仓库订
阅配置，安全法律边界：凭证与付费资产本地不中继）：

- `vrc_get_vpm::environment::Settings::load(&io)`（库源 settings.rs:21，
  async；损坏时自带 vrc-get 备份恢复路径 :23–31）；仓库订阅读法＝
  `Settings::get_user_repos() -> &[UserRepoSetting]`（settings.rs:184，
  内部转发 `VpmSettings::user_repos()`）。
  **精确化注（对表态 (a) 文本的勘误，结论不变）**：表态节写的
  「`VpmSettings::user_repos()`」系内部路径；公开 API 实为
  `Settings::get_user_repos()`，`VpmSettings` 为 `pub(crate)` 不出库。
- `UserRepoSetting`（structs.rs:10）：`local_path()`(:39)＝本地缓存文件
  路径；`name() -> Option<&str>`(:43)；`url() -> Option<&Url>`(:47)（远
  端仓库；本地目录仓库为 None）；`id() -> Option<&str>`(:51)；`headers()`
  (:55)。**只读面全部可用；订阅变更（增删启停）是 settings.json 写面，
  不在本提案读面范围**（见 §6）。

**(b) 仓库缓存面**（本地已刷新的仓库缓存集）：

- `PackageCollection::get_remote() -> impl Iterator<Item =
  &LocalCachedRepository>`（environment/package_collection.rs:65）。
- `LocalCachedRepository`（repository/local.rs:8）：`repo() ->
  &RemoteRepository`(:30)；`url() -> Option<&Url>`(:52)；`id() ->
  Option<&str>`(:60)；`name() -> Option<&str>`(:64)；`get_versions_of(...)`
  (:68)；`get_packages() -> impl Iterator<Item = &RemotePackages>`(:75)。
- **事实源区分（如实登记）**：订阅面 (a) 与缓存面 (b) 是**两个不同集
  合**——已订阅但从未成功刷新的仓库＝有订阅无缓存；两集合的不一致是
  真实可达状态，P2 词面若呈现仓库列表须明确以哪面为世界（或显式建模
  双面），由核心冻结批裁决。环境侧倾向：列表以订阅面为世界（用户的配
  置事实），缓存命中与否作为逐仓库存缺事实如实呈现，不伪造空目录。

**(c) 包目录面**（版本枚举与兼容性事实）：

- 全集合查询：trait `vrc_get_vpm::PackageCollection` 的
  `get_all_packages()`(package_collection.rs:117)/`find_packages(package)`
  /`find_package_by_name(package, selector)`——返回 `PackageInfo`。
- `PackageInfo`（lib.rs:49）：`package_json() -> &PackageManifest`(:85)；
  `repo() -> Option<&LocalCachedRepository>`(:105)（None＝本地用户包，
  非仓库来源——**source 事实的库面基础**：仓库包 vs 本地包 vs 已装包
  三态可区分）。
- `PackageManifest` 访问器：`name()`(package_manifest/mod.rs:148)；
  `version() -> &Version`(:151)；`vpm_dependencies()`(:154)；
  `display_name() -> Option<&str>`(:171)（**displayName 的库面事实在
  此**——P1 裁决③的正式入场路径）；`unity() ->
  Option<&PartialUnityVersion>`(:189)；`is_yanked() -> bool`(:192，
  YankState yank_state.rs:14——**yanked 事实在此**，仅仓库缓存清单携带，
  本地包无此字段语义）。
- 兼容性判定：`VersionSelector::latest_for(unity_version:
  Option<UnityVersion>, include_prerelease: bool)`(version_selector.rs:35)
  ＋`satisfies(&PackageManifest)`(:83)——**compatible 事实的库面基础**
  （按工程 Unity 版本过滤；include_prerelease 语义应读用户 settings 的
  `show_prerelease_packages`，settings.rs:43–47，不另立开关）。
- 在线/离线两路：`PackageCollection::load_cache(&settings, &io)`
  (package_collection.rs:27)＝仅本地缓存；`load(&settings, &io, http:
  Option<&impl HttpClient>)`(:41)＝在线刷新；`update_cache(&mut self,
  io, &impl HttpClient)`(:55)＝增量刷新缓存。本域 `VrcGetLibBackend` 的
  preview_install/apply 路径已在用同族 API（本域
  crates/project-manager/src/vpm_backend.rs:385–399、:627–634 先例：
  offline→load_cache；在线 load 失败降级 load_cache——ORC-ADP-006）。

**(d) 诚实边界：仓库「健康」面在库面无事实载体**：

- `VrcGetMeta`（repository/local.rs:82）仅含 `etag`(:84)——**无上次刷
  新时间戳、无错误状态、无可达性记录**。024 分期词面提到的「健康」若
  指 HTTP 可达性/刷新时间，**库面不支撑，须新行为或列为 P2 非目标**；
  若仅指「缓存存在且非空」，可由缓存面 (b) 派生。环境不预决，候冻结批
  定义（诚实纪律：无事实的字段不发明，与 P1 updateAvailable 同纪律）。

### 2. 读面范围建议（对应 024 P2 词面，环境侧倾向供冻结批裁量）

- **仓库清单读面**：以订阅面 (a) 为世界 → 每仓库给 id/name/url（本地
  目录仓库 url 缺席如实 null）＋缓存命中事实（缓存面 (b) 是否有对应
  LocalCachedRepository）。
- **包目录读面**：逐包给 versions（该包在仓库缓存中的全部版本，来自
  `get_packages`/`get_versions_of`）＋compatible（`VersionSelector::
  latest_for` 按工程造价的 Unity 版本判定；工程造价＝已装工程
  `ProjectRef` 携带，环境实现可读）＋yanked（:192）＋displayName
  （:171，Option 如实）。
- **updateAvailable 判定事实源（P1 遗留问题承接）**：环境侧建议＝已装
  版本（`list_packages` 现有事实）与 `find_package_by_name(package_id,
  VersionSelector::latest_for(unity, prerelease))` 所得最新兼容版本的
  比较结果——即「存在严格更新的兼容版本」布尔。该比较在本域实现内完
  成，wire 面只出结论不暴露 Version 类型。**是否采纳归核心冻结批**。
- **粒度建议**：目录面按需查询（per-project 或 per-packageId）优先于
  全量目录投影——仓库缓存可能数千包级，全量投影 wire 载荷与诚实分页
  语义需冻结批定义；环境无偏好，给出载荷事实供裁量。

### 3. 端口升版形状建议（权威归核心，环境职责边界）

- `VpmBackend` trait（crates/orchestrator/src/vpm_backend.rs:110，核心
  域）新增读方法族，环境建议形状候选：仓库清单面
  （`list_repos() -> Result<Vec<RepoInfoV1>, AppErrorV1>` 类）＋包目录
  面（per-package 版本枚举或 per-project 可比较目录投影）。方法粒度、
  命名、参数闭集、数据类型（`RepoInfoV1` 等命名照 `RegisteredProjectV1`
  先例）全部归核心冻结批。
- `VpmCapabilities`（:29，现五位闭集）新增能力位**按后端分声明**：
  `VrcGetLibBackend` 声明新位（本域 :193 capabilities 全 true 先例）；
  `VccCliBackend` 不声明（本域 :797 全 false＋trait 默认 unsupported
  err 先例 :146/:168——ORC-DEV-004 无实现位禁止预留）。
- 错误码：`vua.vpm.*` 族既有 11 码（核心 vpm_backend.rs:12–22：含
  `backend_unavailable`/`project_load_failed`/`capability_missing`）。
  P2 新事实错误码（如仓库缓存缺失、目录查询无此包）**候冻结批立**，
  环境不预立——与 P1「packages 特有事实码归 P2 随冻结批立」口径一致
  （024 P1 冻结批节原文）。
- 环境实现切片范围（候冻结批后）：本域 `VrcGetLibBackend` 新方法实现
  ＋`VccCliBackend` 默认维持＋本域单测（照 project_registry :347、
  list_packages :207 先例：block_on 桥接＋确定性排序＋离线降级分支）。
  消费测试落核心 provider-host（P1 消费测试落位先例：024 冻结批
  d6ca0b5 说明节）。

### 4. 在线/离线与刷新语义（环境现状先例，如实）

- `offline` 字段已实现（本域 vpm_backend.rs:46，ORC-ADP-006）：读面建
  议同既有先例——offline→`load_cache`；在线 `load` 失败降级
  `load_cache`（:385–399 逐字先例）。**降级后数据可能陈旧：词面是否披
  露 stale 事实（如 result 携 cacheSourced 标注）候冻结批**——环境可承
  接披露，不伪造新鲜。
- `update_cache`（package_collection.rs:55）＝主动网络刷新（写缓存）。
  P2 是否引入用户触发的刷新命令属词表面裁决项（涉及网络行为语义与任
  务化），**环境不预动、不默认纳入**；未纳入前 P2 读面仅消费既有缓存
  ＋load 隐式刷新，如实登记。
- 环境根单一事实源：`with_environment_root`（本域 :71）已支持核心候
  选推导根注入（P1 bin 装配 9a13b02 已按此口径落地），P2 读面天然共
  享同一事实源，零新增装配面。

### 5. 与 013 面（project.listProjects）的边界重申

- P2 读面是**仓库与包目录事实**，不触碰项目注册事实；013 聚合面
  （settings.json userProjects/localProjectFolders＋ALCOM）仍是项目清
  单唯一权威（024 P1 冻结批裁决①维持）。环境表态 (b) 登记的
  vcc.liteDb 分叉风险与 013 升版程序独立，**不搭 P2 提案的车**（原文
  维持）。

### 6. 明确边界与环境不预动承诺（零发明）

- **仓库启停（enable/disable）＝写面**：修改 settings.json userRepos
  状态。024 P2 词面提到「启停」——环境立场：写面照 013 R5 程序逐面
  独立提案（任务化九态、确认链、审计、恢复语义逐项），**不建议 P2 冻
  结批搭车**；若核心/桌面表态倾向纳入 P2，须按 024「表态与冻结程序」
  三域表态办理。列开放问题 4。
- **仓库增删＝写面**：同上，且涉及用户配置变更，不在本提案。
- **健康探测＝非默认范围**：§1(d) 诚实边界，候冻结批定义或列为非目标。
- 端口面（core crates/orchestrator/src/vpm_backend.rs）与 wire 面
  （provider-host）**环境零触碰**，维持表态 (a)「表态前后端端口面零触
  碰维持」承诺；环境实现切片候核心 P2 冻结批落地后开工。
- 本提案零代码变更：纯环境域库面考证与形状建议，project-manager 本批
  零改动（实现切片候冻结批）。

## 开放问题（候表态）

1. **核心**：端口方法族粒度/命名/参数闭集、`VpmCapabilities` 新位命名
   与分声明、错误码新码、updateAvailable 判定口径采纳与否、订阅面 vs
   缓存面世界选择、stale 披露语义——P2 冻结批权威裁决。
2. **桌面**：仓库清单与包目录面的呈现语义（PackageRow P2 升级投影＋
   repos 区块解锁条件）——消费面表态候冻结批词面。
3. **集成**：P2 门序同径确认（024 表态 3 已给 T-A 授权内方向，本提案
   落地路径照旧即可，如有异议请表态）。
4. **仓库启停/增删写面归属**：P2 冻结批纳入（须三域表态）vs 照 013
   R5 逐面独立提案——环境倾向后者，候核心/桌面/集成交叉表态。

## 内联讨论线程

（提出时无回复；各域表态按 024 先例内联落节或状态批落节后由收编方移
录。）

### 表态（集成）（2026-09-17 03:1x 集成第 73 批验收轮）

开放问题 3（门序同径）——**确认同径，无异议**：025 落地路径照 024
表态 3 已给方向办理，即 P2 冻结批与实现切片属 M6 T-A「通用 vrc-get 路
径」提前开工授权范围（用户裁决 2026-09-08 晚越门序；先例＝T-A 写路径
proposal 014 于 2026-09-09 先于 M6 门冻结＋验收，024 P1 同径已两次兑
现）；**M6 门验收与发行不在提前授权范围**仍候 M5 关门门序不变。025 提
案批已经 a6d22de 验收入库，核心 P2 冻结批起草的提案前置就此就位。

开放问题 4（仓库启停/增删写面归属）——**集成票：照 013 R5 逐面独立
提案**（与环境倾向一致），理由三点：①024 已将 P3 写面定性为照 013 R5
逐面独立提案（024 表态 3 原文），仓库启停/增删系写面同族，同律办理保
持写面程序一致性；②013 R5 逐面独立提案程序已有先例检验（016/023 链），
写面触及 settings.json 写行为与用户本地配置安全边界，逐面独立提案提供
充分的表态与审查面；③P2 冻结批维持纯读面（与 P1 同性），控制单冻结批
跨域面。**本票系集成一票，开放问题 4 仍候核心/桌面两票交叉收敛**；写
面归属为程序性裁决（013 R5 系已接受决策），不构成产品边界变更。

### 表态（核心）（2026-09-17 03:2x，slot/wt-2；开放问题 1 方向裁决＋开放问题 4 核心票）

**定位**：本节系 025 开放问题 1 的**方向裁决**与开放问题 4 的核心一票
（024 先例：核心自查节先行 f056d4e，冻结批随后 d6ca0b5）。方向裁决
收敛后由核心起草 P2 冻结批落死权威词面（Schema＋正负例向量＋至少一端
消费测试＋TS 面＋双语协议本＋REGISTRY）；本节不预设字段名与最终闭集，
与冻结批冲突时以冻结批为准。核实世代：main 7a50ce9（核心域
crates/orchestrator/src/vpm_backend.rs 11 码族＋VpmCapabilities 五位
闭集直读）。

**开放问题 1 逐项裁决**：

1. **仓库清单世界选择：采纳环境倾向——订阅面 (a) 为世界**。仓库清单
   读面呈现用户订阅配置事实（settings.json userRepos：id/name/url，
   本地目录仓库 url 缺席如实 null），逐仓库携带缓存命中事实（缓存面
   (b) 是否有对应 LocalCachedRepository，冻结批定字段形状——布尔或
   typed 缺席标注）。理由：订阅面是用户配置事实，缓存面是刷新派生事
   实；「已订阅未刷新」以 cached=false 呈现而非从清单消失或伪造成空
   目录，与 P1 诚实空清单同律。双面显式建模（订阅＋缓存两张清单）P2
   不做——单清单＋逐仓库缓存事实已诚实覆盖，双清单徒增消费面负担。

2. **包目录粒度：按需查询，不做全量目录投影**。P2 目录面以
   per-packageId（或 per-project 的定向查询）为粒度，数千包级全量投
   影不入词面——wire 载荷不可控且诚实分页语义未立。P1 listInstalled
   （per-project）即粒度先例；具体方法签名冻结批定。

3. **updateAvailable 判定口径：采纳环境建议**——已装版本（既有
   list_packages 事实）与 `find_package_by_name` +
   `VersionSelector::latest_for(unity, prerelease)` 的比较结论「存在
   严格更新的兼容版本」，在本域实现内完成，wire 只出结论不暴露
   Version 类型；include_prerelease 读用户 `show_prerelease_packages`
   设置（settings.rs:43–47），不另立开关（环境 §1(c) 建议一并采纳）。
   此系 P1 桌面头注遗留问题的正式承接。判定所需工程 Unity 版本由
   ProjectRef 携带的工程造价供给；取不到时 updateAvailable 如实缺席
   （typed 未知），不猜不默认 false——缺席≠无更新。

4. **能力位：VpmCapabilities 新增恰一位覆盖 P2 读面族**（仓库清单＋
   包目录两读面同族同位，命名候冻结批，建议 catalog 族），照两位分立
   不取——两读面同源同一后端能力、消费端区块标注同源，分位徒增组合。
   分声明纪律维持：VrcGetLibBackend 声明，VccCliBackend 不声明走 trait
   默认 unsupported（ORC-DEV-004 无实现不预留，五位闭集注释原文）；
   wire served_capabilities 行照 P1 packages.query 先例随装配翻转。

5. **错误码：复用优先，新码闭集候冻结批立**。现有 11 码族中
   project_load_failed/backend_unavailable/capability_missing 按同事
   实同码复用；P2 新事实（仓库缓存缺失、目录查询无此包等）新码由冻
   结批一次立全并配正负例向量，不在本节预立命名——与 P1「packages
   特有事实码归冻结批随立」口径一致。

6. **stale 披露：采纳披露方向**。离线降级路径（offline→load_cache、
   在线 load 失败降级，ORC-ADP-006 先例）的 result 携带缓存来源标注
   （字段名冻结批定），如实披露「缓存来源」不伪造新鲜；缓存来源≠错
   误，消费端呈现为信息性标注非失败态。

7. **健康面：P2 词面不含健康字段，列为非目标**。库面无事实载体
   （VrcGetMeta 仅 etag，环境 §1(d) 实测），不发明；「缓存存在且非
   空」已由裁决 1 的逐仓库缓存事实覆盖。真健康探测（可达性/时间戳）
   需新行为＋新提案，不搭 P2 车。

8. **update_cache 主动刷新：不纳入 P2**（环境 §4 不默认纳入维持）。
   网络写行为需任务化九态语义，归 013 R5 族候选面，P2 读面仅消费既
   有缓存＋load 隐式刷新，如实登记。

**开放问题 4 核心票：照 013 R5 逐面独立提案**（与环境倾向、集成票一
致）。理由：①P2 冻结批维持纯读面与 P1 同性，控制单冻结批跨域面；
②仓库启停/增删系 settings.json 用户配置写行为，013 R5 逐面程序（任
务化九态、确认链、审计、恢复）是写面的充分表态与审查面，先例已检验
（016/023 链）；③024 已将 P3 写面定性 R5 独立提案（024 表态 3 原
文），写面同族同律保持程序一致性。**三票（环境倾向＋集成票＋核心票）
已收敛，桌面表态候落**；桌面如无异议，开放问题 4 即闭。

**程序注记**：开放问题 2（桌面呈现语义表态）候桌面落节；桌面表态与
本节裁决收敛后，核心即起草 P2 冻结批（024 同径：冻结批→环境实现切
片→桌面 P2 消费批逐批验收）。本节零代码，纯 collab 面。
