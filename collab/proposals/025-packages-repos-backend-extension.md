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

## 桌面表态（开放问题 2，附问题 4 交叉表态；wt-3，2026-09-17 03:0x
工作时段，追平世代 f4a3872——025 已入库〔a6d22de〕后内联落节）

消费面核实基础：P1 消费切片 1049366 已验收（d55d62f，集成亲审 21 非
collab 文件）——`PackagesPage.tsx` ready-p1 分支（P1 说明条＋013 驱动
项目选择器＋只读已装包简表）、`packages-port.ts:125–129` ready-p1
blocks（repos/changes 类型级 `readonly false`，渲染层不可能伪造
true）、`packages-live.ts` 以 served_capabilities `packages.query`
能力行为区块标注权威事实源、`loadError` 携 typed 码原词（失败绝不冒
充空态）、`project-ops-port.ts` 013 聚合窄投影（unreadable 如实计
数）。

1. **repos 区块解锁条件（本表态核心条款）**：解锁唯一条件＝P2 冻结
   批词面提供仓库清单事实源＋对应能力位，照 P1 先例以能力行文为区块
   标注权威事实源。形状走向＝ready-p1 的 `repos: false` 类型级恒假
   升级为 RepoInfo 行承载变体（如 ready-p2），桌面届时按 024 程序
   （形状核可→消费切片）办理；**无事实源的区块维持不渲染，渲染层不
   伪造**（ready-p1 既有防线延续，P2 词面落地前包管理器页维持 P1 中
   间诚实态不变）。

2. **仓库清单呈现语义**：
   - **世界选择＝支持环境倾向：以订阅面为世界**（用户配置事实）。
     每仓库行呈现 id/name/url，本地目录仓库 url 缺席如实空值呈现；
     **逐仓库缓存命中事实必须呈现**——「已订阅·缓存未建立」是独立
     诚实态，绝不把无缓存呈现为空目录或空仓库（订阅未成功刷新与订
     阅清单为空是两件事）。
   - **健康面（对 §1(d) 诚实边界的桌面侧结论）**：库面无健康事实载
     体＝页面不得渲染「健康/异常」拟态词。若冻结批将健康定义为「缓
     存存在且非空」派生事实，呈现词用「已缓存/未缓存」级事实词；若
     列为非目标，健康语义列整体不渲染。无事实不发明（024 P1
     updateAvailable 同纪律）。
   - **写入口不渲染维持（开放问题 4 交叉表态）**：仓库启停/增删＝
     写面，**桌面支持环境倾向：照 013 R5 逐面独立提案，不搭 P2 冻结
     批的车**——写面需任务九态＋确认链＋审计＋恢复语义逐项配套，
     P2 只读面下仓库清单零写入口渲染。若三域表态裁决写面纳入 P2，
     桌面按 024 表态程序另行表态任务化 IA，不在本表态预支。

3. **PackageRow P2 升级投影（P1 隐藏字段逐项解锁条件）**：
   - **updateAvailable**：解锁＝冻结批采纳判定事实源（环境建议口径
     ＝已装版本 vs `latest_for(工程 Unity 版本)` 严格更新存在，wire
     只出结论布尔——桌面可消费）。UI 呈现结论不呈现推导，不发明版
     本比较 UI；判定事实缺席时维持 P1 防线——更新语义 UI 不渲染，
     不以默认值填充防「已最新」假断言（024 表态②延续）。
   - **versions＋yanked**：解锁＝词面给出版本枚举事实后如实枚举，
     yanked 标注照实携带。yanked 事实仅仓库缓存清单携带（§1(c)）：
     本地包/无缓存包行**不得渲染 yanked 断言**——「无仓库缓存事实」
     与「未 yanked」严格区分（缺席≠否定，诚实纪律 1）。
   - **compatible**：解锁＝`latest_for` 按工程判定＋include_prerelease
     读用户 `show_prerelease_packages` 设置（支持环境建议，不另立开
     关）；**compatible 断言必须绑定当前选中工程**——无工程上下文时
     目录面不渲染兼容性断言，防跨工程误导。
   - **displayName**：正式入场（`PackageManifest::display_name`
     Option，P1 裁决③承接口径）；`Some` 才以 displayName 呈现，
     `None` 以 packageId 兼任显示名（兼任呈现不冒充字段事实，P1 裁
     决 3 延续）。
   - **source**：三态（仓库包/本地用户包〔`repo()=None`〕/已装）有
     事实源后解锁呈现与筛选；三态可区分即如实区分，不合并二态、不
     猜测补全（P1 隐藏 source 列与筛选的条件就此解除）。

4. **粒度（对 §2 末段的桌面侧倾向）**：支持按需查询优先——数千包级
   全量投影不做页面全量渲染；页面查询由选中工程/本地搜索驱动。分页
   语义候冻结批词面定义：词面定义分页则页面如实呈现分页与「未加载
   后续页」事实，不静默全量拉取伪造「一页即全量」。

5. **stale 披露（对 §4）**：支持冻结批采纳披露——offline 降级
   load_cache 的数据页面呈现「缓存数据」类标注，不冒充新鲜；若冻结
   批未采纳披露字段，页面不得自行标注缓存来源（无事实不渲染，同第
   2 条健康面纪律）。

6. **空态/失败语义（P1 纪律全量延续）**：订阅清单为空≠缓存未建立
   ≠typed 失败，三态严格区分；目录查询无此包＝独立空态非错误页；
   P2 新错误码闭集候冻结批立（环境 §3 口径一致），页面照码原词呈现
   （`loadError` 携 typed 码原词语义延续），失败绝不冒充空态。

7. **程序自认**：本表态仅消费面语义与解锁条件，零代码零运行时变更
   ——桌面 P2 消费切片硬前置＝P2 词面冻结＋TS 面登记＋形状核可
   （照 P1 全链程序）；表态与冻结批词面冲突处以冻结批为准（P1
   versions「投影空数组→词面零字段」收敛差先例，届时收敛差如实记
   录再核可）。包管理器页维持 P1 中间诚实态至 P2 消费批落地＋用户
   dev 栈重启复验，零端到端宣称维持。

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

> 集成收编补注（2026-09-17 03:1x 集成第 73 批续波）：本节「三票已收敛，
> 桌面表态候落」「开放问题 2 候桌面落节」系落节时读数滞后——桌面表态
> 节（0031004，开放问题 2 全文＋开放问题 4 与 R5 同向交叉表态）已于
> 273efaf 先行入库且在本节之前。**就此开放问题 4 四票全部同向收敛
> （环境倾向＋集成票＋桌面交叉表态＋核心票）即闭；开放问题 2 桌面已
> 落。025 表态程序收敛达成，核心 P2 冻结批起草解锁。**

### 冻结批（核心）（2026-09-17 03:1x–03:3x，slot/wt-2；P2 词面权威落死）

**定位**：表态程序收敛（环境提案 64bfe58＋集成表态 7a50ce9＋桌面表
态 0031004＋核心裁决 bf78368，开放问题 1–4 全闭）后，照 024 同径落
死 P2 权威词面。本批零运行时行为变化（wire 路由/bin 装配归核心实现
切片，库面实现归环境实现切片，均随后续批）。

**词面权威形状（与方向裁决的差异逐项如实声明）**：

- **双方法两族一次冻结**：`packages.listRepos`（仓库订阅清单读面，
  result 族 `vua.packages-repos/v0.1`）＋`packages.packageCatalog`
  （单包目录事实按需查询，result 族 `vua.packages-catalog/v0.1`）。
  信封照常设形状（envelope const "0.1"＋operation＋result），两族版
  本独立（c914cf2 常设规矩）。
- **裁决 1 落死**：订阅面为世界；行闭集五键＝四标识/定位事实（可空
  字符串，null＝库面 Option 逐字投影）＋**cached 必带布尔**（桌面表
  态要求的逐仓库缓存命中事实；false＝已订阅未刷新，诚实清单行）。
  行序＝订阅面自身顺序（settings userRepos 数组顺序＝用户配置事实
  ——较裁决节新定：不发明排序键，配置顺序即事实顺序）。空 repos
  数组＝诚实零订阅。健康面非目标落死：发明 health/status 字段在
  schema 即非法（虚假断言防线）。
- **裁决 2 落死**：catalog 双键闭集 { projectPath, packageId }；无全
  量投影、无分页语义；词表外包（仓库缓存与本地集合均无此包）答复用
  `vua.vpm.no_matching_package`（复用，桌面表态的独立空态呈现落此
  码）。
- **裁决 3 落死**：updateAvailable 结论布尔或 null（null＝判定未执
  行：本工程未安装或工程 Unity 版本未知；缺席不是「无更新」）；
  compatible 逐版本布尔或 null（工程版本未知＝null，null 不是不兼
  容）；yanked 布尔（仓库缓存携带事实；local 来源包 versions 空数
  组故无 yanked 语义产生——桌面「缺席≠未 yanked」纪律由空数组承
  载）；prerelease 读用户设置零 wire 字段。
- **新增落实（桌面表态 3 承接，方向裁决节的自然延伸）**：source 二
  态（"repo"|"local"）＋installed 布尔分立必带——桌面三态呈现由两
  事实组合，词面不合并来源与安装（024 P1「不发明合并事实」同律）；
  displayName 可空（null 以 packageId 兼任，P1 裁决 3 延续）。
- **裁决 4 落死（形状微调如实声明）**：能力声明落为**独立默认访问
  器** `VpmBackend::catalog_capabilities() -> CatalogCapabilities`
  （默认 declared-none）而非 `VpmCapabilities` 加位——五位闭集保持
  稳定且未实现后端零编译波及（ORC-DEV-004 同律：恰在实现时覆写；
  与既有 trait 默认 unsupported 先例同族）。wire
  served_capabilities 增 `packages.listRepos`/`packages.packageCatalog`
  两行，随装配与该声明翻转。
- **裁决 5 落死（零新码）**：错误码全复用——
  vua.project.project_not_found（未注册路径）、
  vua.vpm.no_matching_package（无此包）、vua.vpm.project_load_failed、
  vua.vpm.capability_missing、vua.vpm.backend_unavailable、
  vua.packages.invalid_params、vua.packages.unavailable。
- **裁决 6 落死**：stale/缓存来源 wire 标注随环境实现切片落死，本词
  面不预留字段。
- **裁决 7/8 维持**：健康面非目标；update_cache 不纳入。

**交付面（本批文件）**：schemas/packages-repos/v0.1/（command＋
result＋3 正 3 负向量）＋schemas/packages-catalog/v0.1/（command＋
result＋4 正 4 负向量）＋端口面（crates/orchestrator/src/
vpm_backend.rs：CatalogCapabilities/RepoInfoV01/PackageSourceV01/
CatalogVersionV01/PackageCatalogV01＋trait 三方法默认实现＋lib.rs 导
出）＋核心消费测试（crates/provider-host/tests/
packages_p2_consumer.rs 4 例：Schema 向量验证＋端口→wire 投影闭环＋
trait 默认缺席臂）＋TS 面（packages/contracts/src/
application-contract.ts 六接口＋union＋守卫两 case＋test 三例）＋
mock 恒缺席臂（packages/orchestrator-provider 两方法同 P1 纪律＋测
试）＋双语协议本（docs/protocols/packages-repos-catalog-v0.1_EN/ZH）
＋REGISTRY 三行。

**后续批次（照 024 链）**：环境实现切片（VrcGetLibBackend 实现两方
法＋catalog_capabilities 覆写＋离线降级分支＋stale 标注落死＋本域
单测）→ 核心 wire 接线切片（provider-host 路由两方法＋
served_capabilities 两行＋bin 装配）→ 桌面形状核可＋P2 消费切片。
**零端到端宣称维持**：页面呈现候桌面消费批＋用户 dev 栈重启；真机
走查归 W25（O-2）。

### 形状核可（桌面）（2026-09-17 03:4x，wt-3 工作时段；P2 冻结批消费面核可）

**核可对象与方式**：P2 冻结批词面＝slot/wt-2 9ab1b11（＋状态批
b50242f）世代，**候集成验收尚未入 main——本核可以冻结批经集成验收
入库为生效前提**。核可方式＝只读词面逐项核对（本树工作副本追平
e7f1e31 后，对 slot/wt-2 分支词面直读：两族 schema 全文＋7 负例向量＋
TS 面六接口/守卫/测试＋mock 缺席臂＋Rust 端口面五类型/trait 三方法），
零代码零运行时变更。

**逐项核可（对照桌面表态节〔0031004〕条款，零偏差）**：

1. **repos 区块解锁条件**：`packages.listRepos` 词面＋能力位就位——
   能力声明经 `VpmBackend::catalog_capabilities()`；消费端区块标注
   权威事实源仍是 wire served_capabilities 能力行（两行随装配翻转），
   P1 机制不变；ready-p1 `repos:false` 类型级恒假升级 RepoInfo 行承
   载变体的形状走向与 `PackagesRepoInfoV01` 吻合。
2. **仓库清单呈现**：订阅面为世界（裁决 1）；四标识/定位可空字符串
   （repoId/name/url/localPath，null＝库面 Option 逐字投影；
   localPath 承载本地目录仓库定位，与「url 缺席如实空值呈现」吻合）；
   **cached 必带**（false＝已订阅未刷新诚实清单行，绝不呈现为空目录
   ——schema description 与负例 invalid-repo-row-missing-cached 双
   面钉死）；行序＝订阅面自身顺序。**健康面非目标**：负例
   invalid-repo-row-health-field 钉死 health/status 字段 schema 即
   非法——页面零健康拟态词（本表态第 2 条「列非目标则健康语义列整
   体不渲染」承接）。
3. **PackageRow P2 升级投影逐项**：updateAvailable 结论布尔或 null
   （null＝判定未执行，缺席不是「无更新」；schema 与 TS 注释双面钉
   死「null 时更新 UI 不渲染、不以默认值填充」＝P1 防线延续）；
   yanked 仓库缓存携带（local 来源 versions 空数组承载「缺席≠未
   yanked」，schema 明写消费者绝不把无缓存事实渲染为未 yanked）；
   compatible 逐版本布尔或 null（params.projectPath 必带＝判定绑定
   选中工程，无工程上下文不发起查询；null＝版本未知不是不兼容；
   prerelease 读用户设置零 wire 字段——负例 invalid-catalog-extra-
   param 钉死 includePrerelease 非法）；displayName 可空（null 以
   packageId 兼任，P1 裁决 3）；source 二态＋installed 分立必带（三
   态＝组合呈现；负例 invalid-catalog-source-word-outside 钉死
   source:"installed" 词表外——「不合并来源与安装」落死）。
4. **粒度**：按需查询双键闭集 {projectPath, packageId}；无全量投影
   无分页（页面零分页拟态，符合表态第 4 条「不静默全量拉取」）；词
   表外无此包＝`vua.vpm.no_matching_package` 复用码独立空态（非错误
   页，本表态第 6 条落此码）。
5. **stale 披露时序（如实登记，非偏差）**：裁决 6＝披露字段随环境实
   现切片落死，本词面不预留——照表态第 5 条条件分支，P2 消费批时
   wire 若尚无披露字段则页面不自行标注缓存来源，候实现切片入库后再
   核可呈现。
6. **空态/失败**：零新码全复用（七码闭集）；零订阅＝空 repos 诚实；
   mock 缺席臂两方法恒答 `vua.packages.unavailable` 绝不伪造清单或
   以空数组冒充事实（P1 纪律同型，mock-provider 测试在案）。

**TS 面专项核可（桌面所有权域登记确认）**：六接口
（PackagesListReposQueryV01/PackagesRepoInfoV01/
PackagesListReposResultV01/PackagesPackageCatalogQueryV01/
PackagesCatalogVersionV01/PackagesPackageCatalogResultV01）与 Rust
端口面（RepoInfoV01/PackageSourceV01/CatalogVersionV01/
PackageCatalogV01）serde camelCase/snake_case 投影逐键同形零偏差；
守卫两 case 与 schema 闭集同形（listRepos 空闭集 ↔
additionalProperties:false＋properties:{}；catalog 双键＋isIdentifier
↔ minLength 1）；族常量两族独立（vua.packages-repos/v0.1、
vua.packages-catalog/v0.1，c914cf2 规矩）；union 两臂＋contracts 守
卫测试（正例＋多余键拒＋缺键拒）在案。**程序事实如实登记**：TS 面
系核心冻结批批内自落（024 P1 先例系桌面消费切片落 TS 面 2 文件）
——本节即桌面域 TS 面登记确认，同形零偏差，消费切片直接承接不再重
复登记。

**收敛差清单（冻结批 vs 方向裁决/桌面表态，全部零冲突如实记录）**：
①能力位形状微调——方向裁决 4「VpmCapabilities 加位」落为独立默认
访问器 `catalog_capabilities()`（五位闭集稳定＋未实现后端零编译波
及，核心如实声明理由）；消费面影响零——wire 能力行机制不变。②错
误码零新码——方向裁决 5 预留「新码闭集候冻结批立」落死为全复用（超
预期收敛），复用码与 P1 词表同族、照码原词呈现机制不变。③行序新定
——订阅面自身顺序（配置事实即顺序，不发明排序键），桌面表态未预设
排序零冲突。④四键超集——repoId/name/url 之外增 localPath（本地目
录仓库定位承载），与表态「本地目录仓库 url 缺席如实空值呈现」吻合。

**程序结论**：P2 冻结批形状核可**通过**。桌面 P2 消费切片硬前置三
项中「词面冻结＋TS 面登记＋形状核可」就位；**开工候最后前置＝核心
wire 接线切片落地（provider-host 路由两方法＋served_capabilities 两
行＋bin 装配，ready-p2 才有真实事实源）**，届时照 024 P1 全链程序自
领；包管理器页维持 P1 中间诚实态不变，零端到端宣称维持。

> 竞态补正（wt-3，2026-09-17 03:5x 追平轮）：形状核可节落节时「候集
> 成验收尚未入 main」系落节当时事实——冻结批已于本轮工作期间经集成
> 987b3cc 验收入库（9ab1b11＋b50242f is-ancestor 双实证，集成 diff
> 亲审 28 非 collab 文件与冻结词面逐项吻合）。**核可生效前提已兑现，
> 本核可即时生效**。追平合并（73e3f0e）时 025 文件同位追加冲突照
> 991e065 先例两侧保留逐字不改写：冻结批节在前、形状核可节随后，
> 程序时间序排列。

### 实现切片声明（环境）（2026-09-17 04:4x 工作时段，wt-6；两方法落地＋裁决 6 环境侧落法＋stale wire 形状提案）

**定位**：本节系环境 P2 实现切片（VrcGetLibBackend 两方法＋
`catalog_capabilities` 覆写＋离线降级＋本域单测）的交付声明与三项实现
口径如实登记；另按裁决 6「该标注是否以及如何过 wire 随环境实现切片落
死」给出环境侧落法与 stale wire 形状提案，候核心/桌面表态。

**实现口径（三项，逐项如实）**：

1. **cached 事实源**：订阅行的 `localPath` 即库内缓存路径
   （repo_source.rs：`to_source()` 以 local_path 为 cache_path），
   cached＝该文件存在且可解析为 JSON 对象——与库 RepoHolder
   `load_repo_from_cache` 的 Loaded/NotDownloaded/UnableToLoad 三态判
   定逐条对应（本域单测钉死 false＝已订阅未刷新诚实行）。
2. **compatible 判定**：包 `unity` 字段系 VPM 规范最低 Unity 约束，
   兼容＝工程版本 ≥ 该 major.minor（库 `unity_compatible`
   lib.rs:208 系私有 fn，本域照其**一般分支**语义实现）。库内
   VRCSDK-for-2019 特例保护（`is_vrcsdk_for_2019` 强制 major==2019）
   系安装选择附加逻辑、非本词面兼容性事实，**不复制**——对现行
   VRCSDK（3.5+，非 2019 专用版本段）判定结果与库行为一致；如核心
   认为须逐字复刻特例，请表态（届时本域照改）。
3. **source 并存优先级**：同一 packageId 同时存在于仓库缓存与本地集
   合时 source=repo（词面「resolved from a repository cache」逐字：
   仓库缓存可解析即 repo 态，versions 随之给全）；仅本地时 local。
   桌面三态呈现由 source×installed 组合，不受影响。

**裁决 6 环境侧落法（如实）**：本切片实现内，离线降级事实真实存在
（offline→load_cache、在线 load 失败降级，preview_install 同构先例）；
但 v0.1 词面两族 result 均 `additionalProperties:false` 闭集、端口类型
（核心域）与 schema 词面不允许环境单方新增 wire 字段——**v0.1 内环境
不越域发明 stale 字段**。裁决 6 由此在环境侧落死为两枝，候表态：

- **提案 A（兑现披露）**：两族 result 顶层增 `cacheSourced`（布尔，
  信息性标注非失败态；true＝本次结果来自缓存降级路径）。落地需端口类
  型＋schema＋TS 面＋协议本连锁（核心域词面升版，v0.1 修订或 v0.2，
  归核心裁量）；环境事实源已就绪，端口面变更落地后本域一行覆写即可
  真实上贡。
- **提案 B（维持 v0.1 无字段）**：桌面照形状核可节第 5 条条件分支维
  持「wire 无披露字段则页面不自行标注」——现状即诚实（消费端不虚构
  自己没有的事实），零词面动作。

环境无偏好预设，两枝均诚实；**候核心/桌面内联表态收敛后办理，实现
切片自身不等待**（两枝下本切片交付均完整有效）。

**交付面**：crates/project-manager/src/vpm_backend.rs（catalog_capabilities
覆写＋list_repos＋package_catalog＋map_environment_io/repo_info_row/
catalog_compatible 三辅助）＋crates/project-manager/tests/vpm_backend.rs
（P2 五测：订阅面投影＋cached 两态＋null 投影＋空订阅诚实＋
VccCliBackend declared-none 缺席臂；catalog repo 来源全事实＋升序＋
yanked＋compatible true/false；updateAvailable true/false 双臂＋判定
未执行 null；local 来源诚实空 versions＋no_matching_package 复用码）。
全链机械校验绿（2026-09-17 04:5x 在案）：cargo test --workspace 0
failed（含本域 vpm_backend 16/16）＋cargo clippy --workspace
--all-targets -D warnings 0。

### 增补批声明（环境）（2026-09-17 05:5x 工作时段，wt-6；口径②照改执行——compatible 复刻全库语义落地）

**定位**：本节系对上节核心表态（slot/wt-2 e8513d3，候验收）的收货与
执行声明：三项口径表态收货——①③采纳知悉、**②照改即办**；裁决 6
落死（提案 A 收窄 catalog 单族、新族版 v0.2）收货，v0.2 协议口径以核
心冻结批（8393204，slot/wt-2 候验收）词面为准。本节与增补批第一部分
同批落地（wt-6 本分支）。

- **增补批第一部分（本批落地）：compatible 复刻完整库语义**。按表
  态落法照改 `catalog_compatible`（crates/project-manager/src/
  vpm_backend.rs）：复刻 vrc-get-vpm 0.0.16 `unity_compatible`（
  lib.rs:208）全部四臂——`is_vrcsdk_for_2019`（avatars/worlds/base
  major 3 minor ≤4 → 仅 Unity 2019）＋`is_resolver_for_2019`（
  resolver 0.1.≤26 → 仅 Unity 2019）＋VRCSDK 精确 major.minor 匹配
  臂（防 VRCSDK-for-2022 误入 Unity 6000 系）＋一般最低约束臂（原
  有）。**分歧例单测钉死**（tests/vpm_backend.rs 新例
  p2_package_catalog_compatible_recreates_the_full_library_special_
  cases，全部合成数据；com.vrchat.* 仅系特例臂键控的公开 VPM 标识
  符）：SDK 3.4＋2022 工程＝false；resolver 0.1.26＋2022 工程＝
  false；SDK 3.5＋Unity 6000（6000.0.23f1）工程＝false（一般分支会
  误判 true 的反例）；边界正例——resolver 0.1.27 逃出特例臂走一般
  臂＝true；2019.4 工程特例臂正向＝true×2；精确匹配臂 2019 工程
  拒绝 2022 约束 SDK＝false。**变异验证在案（05:4x）**：临时还原一
  般分支旧实现，新例即 FAILED——钉死力实证；还原复刻实现后 17/17
  绿。**词面零变化**（无 schema/TS/协议本动作，v0.1 应答形状不
  变）。全链机械校验绿（2026-09-17 05:5x 在案）：cargo test
  --workspace 81 套件 0 failed（含本域 vpm_backend 17/17）＋cargo
  clippy --workspace --all-targets -D warnings 0。原「特例不复制」
  声明就此撤回，以本节为准。
- **增补批第二部分（候依赖入库，如实声明依赖不空转）**：v0.2 适配
  ——`catalog_v02()` 声明覆写（恰在实现时 true，ORC-DEV-004 同
  律）＋`package_catalog_v02` 实现＋`cacheSourced` 事实源一行上贡
  （offline→load_cache 或在线 load 失败降级＝true，ORC-ADP-006 同
  构）＋compatible 复刻在新族结果面沿用——**依赖核心冻结批
  8393204 的端口面（catalog_v02/package_catalog_v02/
  PackageCatalogV02）入 main**（slot/wt-2 候集成验收）。该批入库后
  本树追平即跟进适配，无等待声明必要——依赖事实如实登记于此。
