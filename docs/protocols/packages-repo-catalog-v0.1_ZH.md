# packages-repo-catalog 协议本 v0.1（packages.repoCatalog 读面：仓库级可装包清单）

> 文档版本：0.1.1
> 状态：**已冻结（提案 027 F2 核心冻结批，2026-09-20）且已接线（v0.1.1 核心接线
> 批，2026-09-20）：wire 路由与 served 行已在树——桌面消费候形状核可后逐面升级；
> 库实现归环境实现核对切片；该切片落地前，已接线的后端让 served 行如实维持不可
> 用。**
> 权威对：本文件与 `packages-repo-catalog-v0.1_EN.md`（单一语义，双语镜像）。
> 词面权威：`schemas/packages-repo-catalog/v0.1/`（command＋result Schema 与正负例
> 向量）。本文负责解释；Schema 具约束力。
> wire 路由测试：`crates/provider-host/tests/packages_repo_catalog_wire_v01.rs`
> （骑真帧环）；核心消费测试：
> `crates/provider-host/tests/packages_repo_catalog_consumer_v01.rs`。

## 本面是什么

`packages.repoCatalog` 回答一个问题：**后端集合所服务的每个仓库，各自有哪些可装
包？** 每仓库一行（身份、缓存命中事实、该仓库自己的包行）；单方法，零分页，零投
影开关。

族划分系提案 027 开放问题 1 裁决（核心表态 58d1a0c）：

- 已冻结的 `packages-catalog` 族词面刻意排除仓库级投影（「NO full-catalog
  projection——thousands-scale caches never ride this face」）。本族正是该裁决预留
  的投影：仓库级清单归此面，既有 catalog 冻结词面零回改。
- 已冻结的 `packages-repos` 族是订阅配置面（「the subscription face is the
  world——NOT the refresh-derived cache」）。本族是缓存清单投影；两视图命名不同事
  实，绝不混同。
- 本面的世界＝后端集合的仓库集合：预定义 official/curated 两仓（经各自开关忽略除
  外）＋全部已订阅用户仓库。同一包出现在多仓时，逐仓各自成行——本面绝不跨仓合并。
  跨仓最新版判定仍是 packages-catalog 族的申报事实；此处逐仓视图与彼处跨仓视图都
  是诚实事实，永不混同（环境考证 3bd4f12 §2 边界①）。

## 词表（机器可读）

- 方法：`packages.repoCatalog`（kind `query`）。
- 信封：`schemaVersion` 常量 `"0.1"`；结果族常量
  `vua.packages-repo-catalog/v0.1`（两版本独立——c914cf2 既有规则）。
- params（双键必带可空闭集，026 A5 惯用法）：

| 键 | 类型 | 语义 |
| --- | --- | --- |
| `repoId` | `string \| null` | `null`＝集合世界全部仓库；非空 id＝只答该仓库行。词表外 id 答**复用**的 `vua.vpm.repo_not_found`（A4 removeRepo 同事实先例）——绝不虚构空形状成功。 |
| `packageIds` | `string[] \| null` | `null`＝全量浏览；非空数组＝批量需求集合过滤键（Recipe 自动化形状，用户裁决④）。唯一非空 id；**空数组是形状违反**，不是空过滤（`null` 之外不存在第三态）。 |

- result（族 `vua.packages-repo-catalog/v0.1`）：
  - `repos[]`——按集合自身枚举顺序逐仓成行（不发明排序键；消费端自行施加呈现排
    序、按 `packageId` 机读）。每行：`repoId`（可空）、`name`（可空）、`cached`
    （必带布尔）、`packages[]`。
  - `packages[]` 行：`packageId`、`displayName`（可空）、`description`（可空）、
    `latestVersion`（可空）、`versionCount`（整数 >= 0）。
  - `cacheSourced`——必带信息性披露（本 v0.1 降生即带，降生时即采纳
    packages-catalog v0.2 先例，照 027 核心裁决）。
- 空 `repos` 数组是合法的诚实应答（零仓库缓存）。`cached: false` 行的空
  `packages` 数组是已订阅未刷新的诚实状态；缓存命中行在过滤下的空 `packages` 数
  组是「此处无匹配」的诚实应答——过滤器是透镜，绝不是存在性断言，因此
  `vua.vpm.no_matching_package` 在本面**无适用范围**（单包存在性断言归
  packages-catalog 面）。

## 字段语义（冻结判定）

- `latestVersion`——冻结的逐仓判定：本仓内既非 yanked、亦未被用户
  `show_prerelease_packages` 服务端设置排除的最新版本（零 wire 开关行为，与
  catalog 面同款），且**无工程 Unity 约束**（库选择器在无约束时 unity 过滤全通）。
  `null`＝当前设置下无合资格版本；缺席不是「无包」，绝不渲染为错误。
- `versionCount`——仓库缓存自身对该包版本条目的清单计数（yanked 计入）：按缓存
  事实计数，不是可用性承诺。
- `displayName` / `description`——库面 Option 的可空诚实投影；null displayName 以
  packageId 兼任显示名（P1 裁决 3），不冒充字段事实。
- `cached`——必带逐仓库缓存命中事实（025 repos 面法则承袭）：`false`＝已订阅未
  刷新，以空 `packages` 数组呈现——其自身诚实状态，不隐藏、非错误。
- `cacheSourced`——`true`＝本次结果经缓存降级路径（offline→load_cache，或在线
  load 失败降级——ORC-ADP-006 同构先例）；`false`＝在线刷新 load 所得。信息性非
  失败；消费端呈现「缓存数据」标注，绝不渲染为失败。

## 字段上限裁决（随本冻结批落账）

提案 F2 词面为「元信息以库面实际可得上限为准」。环境考证（3bd4f12 §1(b)）已实
证：库面 `PackageManifest` 反序列化闭集**无 `author` 字段**——未声明键被 serde 丢
弃、零访问器，且库面自带测试 JSON 恰含 author＝缓存文件常见该字段而库面不解析的
实证。当时在桌面的三个选项：

1. 上游依赖扩展（跨版本风险）；
2. 对原始缓存 JSON 立第二解析面（同一事实两处解析——漂移风险）；
3. v0.1 词面如实缺席。

**本冻结批裁决选项 3**（环境明示倾向，单事实源纪律）：author 在本面不存在；行内
携带 `author`（或 `license`、`changelogUrl`、`downloadCount` 或任何其它发明事实）
即 schema 非法——虚假断言防线，不是约定。未来需要 author 事实的面必须先在自己的
冻结批内解决解析面问题。

同理，出于「恒常量不是事实」，本面**刻意不存在 `compatible` 事实**：无工程上下文
则兼容性判定不可执行，恒 null 占据 wire 键是非事实。逐包逐版本 `compatible` 仍是
packages-catalog 面的工程绑定冻结事实。未来工程绑定的 repo-catalog 增量是 v0.2 行
目录问题，绝不是对本冻结 v0.1 的原地修订。

## 错误码（零新码——027 表态第 6 条方向维持）

- 未知 `repoId` 参数：**复用** `vua.vpm.repo_not_found`（A4 removeRepo 同事实）。
  核心表态预记的 F2 复用候选为 `project_not_found`＋`no_matching_package`；冻结批
  就实际适用范围落死：本面无 projectPath，`project_not_found` 在此无主体；批量过
  滤是透镜（诚实空、非错误），`no_matching_package` 亦无主体。本面实际需要的唯一
  复用是 `repo_not_found`。
- 信封面（既有闭集不变）：能力缺席在 submit 前答通用 `vua.vpm.capability_missing`
  ；参数形状违例答 `vua.packages.invalid_params`；未接线答
  `vua.packages.unavailable`。
- 只读设计：仓库启停与手动刷新是 packages-ops（提案 027 F4）写面，不属于本族。

## 能力门控（已接线，随 v0.1.1 接线批落地）

新默认访问器 `VpmBackend::repo_catalog_capabilities() -> RepoCatalogCapabilities`
（单一位 `repo_catalog`），025 访问器法则（ORC-DEV-004：默认 declared-none；后端
恰在实现 `repo_catalog` 时覆写）。库后端具备仓库级列表能力，随其实现核对切片如实
置真；CLI 后端无仓库级包列表能力（环境考证 3bd4f12 §1），如实维持假。

- **服务门（已接线，已落地）**：served 行 `packages.repoCatalogOps` 服务该唯一方法
  （removeOps/installOps/registerOps/repoOps/createOps 单行先例）；行可用性＝后端
  `repo_catalog_capabilities().repo_catalog` 位——默认 declared-none 让该行在环境
  实现核对切片以 VrcGetLib 覆写置真前如实维持不可用。wire 路由在调用端口方法**之
  前**读同一位；假位答通用 `vua.vpm.capability_missing`，绝不触达后端方法。
- **与 A5 面的诚实结构差异**：`repo_catalog` 端口方法**有**默认体（不同于无默认体
  的必带方法 `create_project`），因此「已声明未实现」的后端在类型层可以存在——且
  两层都答 `capability_missing`（路由门先行，trait 默认体携带 `capability` 参数）。
  门是诚实防线，不是类型层不可能。
- **wire 信封常量（本接线批命名，A3/A4/A5 先例）**：信封常量
  `PACKAGES_REPO_CATALOG_ENVELOPE_SCHEMA_VERSION_V01 = "0.1"` 与结果族常量
  `PACKAGES_REPO_CATALOG_SCHEMA_VERSION_V01 = "vua.packages-repo-catalog/v0.1"`
  自 `vua_provider_host::provider_host` 发布——消费端以核心自有常量为键，绝不用私
  有字面量；路由在信封组装时加盖两常量（族常量盖结果文档、信封常量盖响应），
  绝不由后端加盖。

## 后端指向根事实专节（027 检查点——必载）

027 验收检查点（026 U14 教训：schema 词面钉不住「后端指向哪个根」）要求凡涉文件
系统的面钉死其根。本面：

- **本面读什么。** 后端 VPM 环境的仓库缓存清单：共享 `settings.json`（`userRepos`
  订阅条目——订阅事实）、预定义缓存文件 `Repos/vrc-official.json` 与
  `Repos/vrc-curated.json`（相对环境根，受 `ignore_official_repository` /
  `ignore_curated_repository` 开关影响）、以及各用户仓库位于 `userRepos[i].
  localPath` 的自有缓存文件（`LocalCachedRepository` 清单：携带 etag 的远端仓库缓
  存）。全部路径在同一个环境根下解析。
- **生产接线面。** 自提案 024 起，provider 的 VPM 环境根接在用户真实 VCC 设置目
  录（`%LOCALAPPDATA%\VRChatCreatorCompanion`——VCC/ALCOM 共享家目录；provider-host
  bin 接线，026 U14 落账事实）。F2 面对该共享根**只读**：绝不写 settings.json、
  绝不写缓存文件、绝不触碰项目。在线刷新路径对已订阅远端仓库执行条件（etag）网
  络拉取并更新共享缓存文件——与 VCC、vrc-get 自身刷新行为相同；`cacheSourced` 披
  露告知消费端本次结果由哪条路径所服务。
- **测试隔离面。** 全部测试（本批消费测试、环境实现核对切片、及未来任何 fixture）
  一律运行在经 `VrcGetLibBackend::with_environment_root(temp_dir, offline)` 注入的
  **临时环境根**上——纯合成数据，绝不指向用户真实 VCC/ALCOM 家目录、绝不指向开
  发者真实缓存。生产根在文档与示例中仅以占位字面量出现。
- **本节钉死的诚实边界。** Schema 钉 wire 形状，钉不住根。上述根事实即验收锚：
  环境实现核对切片与集成验收从接线代码重新推导该事实，并与本节逐项对账。

## 明确在本词面之外

- 写面：启停、增删（已冻结于 packages-ops v0.4）、手动刷新（提案 027 F4——刷新
  面不依赖 W25 键名核实，可随 ops v0.6 并行冻结）。
- 逐包版本清单与逐版本 `compatible`/`yanked` 事实：packages-catalog 族（按需粒
  度）。本面只携带 `latestVersion`＋`versionCount`。
- `author`、`license`、`changelogUrl`、`downloadCount`、健康度、lastRefreshed 及
  一切无库面生产者的事实：schema 即非法（ORC-DEV-004：无实现，无预留字段）。
- 分页、排序偏好、一切工程绑定查询键：不在我 v0.1。

## 诚实边界

零端到端宣称：冻结批是词表层；v0.1.1 接线批已把 wire 路由、`packages.repoCatalogOps`
served 行与信封组装落入树中——桌面消费仍候形状核可后逐面升级程序，库实现归环境实
现核对切片（该覆写落地前，已接线的后端让 served 行如实维持不可用），全链真机走查
归 W25 窗口（O-2，候用户开窗）。空态即终态：空 repos 数组、空 packages 数组、null
的 latest/display/description 事实一律按设计的空态呈现，绝不以猜测内容填充。
