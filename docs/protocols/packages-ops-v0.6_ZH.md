# packages-ops 协议 v0.6（packages P3 写面，第六冻结切片 F4＝仓库生命周期：packages.enableRepo / packages.disableRepo / packages.refreshRepo）

[English](packages-ops-v0.6_EN.md) | [简体中文](packages-ops-v0.6_ZH.md)

> 文档版本：0.6
> 状态：**已冻结（packages-ops 词表行 v0.6，F4 仓库生命周期词面＝启停二
> 方法＋刷新一方法；v0.1 A1 移除行、v0.2 A2 安装/升级行、v0.3 A3 注册
> 行、v0.4 A4 仓库增删行与 v0.5 A5 项目创建行保持冻结原样服务——v0.6
> 照 packages-catalog v0.2 增量先例为独立行目录。词面未接线：wire 路由
> 与 served 行候核心下一切片）**
> （2026-09-20，proposal 027 面序 F2→F3→F5→F4；解冻权威＝W25 只读取证
> 记录裁决 (c)〔027 提案 s6，2026-09-20 环境席：VCC 2.4.5 全文／
> vcc.liteDb 两集合／Repos 缓存形态均无任何启停状态〕＋核心表态 4/6/7/8；
> 操作者注本拍明派「F4 仓库面冻结批」）
> 机器可读词表：`schemas/packages-ops/v0.6/`（行级双 Schema＋5 正 /
> 10 负向量；核心消费测试
> `crates/provider-host/tests/packages_ops_consumer_v06.rs` 4 例；TS 守
> 卫测试 `packages/contracts/src/application-contract.test.ts`）
> 范围：`packages.enableRepo` / `packages.disableRepo` /
> `packages.refreshRepo`（订阅行启停与缓存刷新的九态任务化写命令）
> 所有权边界：词表冻结＋端口面（`RepoLifecycleCapabilities` 三独立位＋
> `enable_repo` / `disable_repo` / `refresh_repo`＋`RepoRefreshOutcomeV01`
> ＋default accessor，全部 default declared-none）＝核心域；wire 路由
> （`packages.repoLifecycleOps` served 行、路由臂、信封组装）＝核心域候
> 下一切片；双实现（库路径 VUA 自有存储启停＋库面 etag 条件刷新）＝环境
> 域（实现核对切片照 024/025 程序，落地前 served 行如实 unavailable）；
> 桌面消费＝桌面域（订阅行启停开关＋刷新键，候形状核可后逐面升级）
> 更新：2026-09-20（v0.6 冻结批：双 Schema＋向量＋核心消费测试＋TS 面＋
> mock 恒缺席臂＋双语协议本＋REGISTRY＋同批冻结 packages-repos v0.2 读
> 回增量）

## A4 词面之外预告的兑现（裁决 (c) 解冻记录）

- v0.4 冻结批「明确在本词面之外」节预告：启停词面候 W25 VCC 禁用列表
  键名真机核实。该核实已按 027 核心表态 7 三段程序完成——环境席于
  W25 窗执行 §3(b) 八步方法的**静态取证子集**（全程只读：定位根／家族
  清单＋SHA-256＋mtime／判读／落账），证据记录落 027 提案 s6 节。
- **四选一结论＝(c) VCC 无启停位**：settings.json 顶层恰 18 键全可对账、
  userRepos 四元素恰 vrc-get 五键闭集零元素外键、全文件递归扫描
  enabl/disabl/activ/disabled 模式零命中、vcc.liteDb 恰 projects＋
  unityVersions 两集合无 repo 表、Repos 缓存面 LocalCachedRepository 形态
  无启停状态——三存储位正面证据均无启停语义。
- **后果**：仓库启停系 **VUA 自有语义，无可共享 counterpart**。源码事实
  4 的「写面剥键互操作风险」（若 VCC 将启停位存于 userRepos[i] 元素内，
  VUA 写面 save 会剥除）在现机形态下**无可剥对象**——026 A4 启停二分
  裁决的追溯风险面就此以真机证据落定；**F4 启停面冻结硬前置成就**。
  ALCOM 侧同构对照不可执行（本机未装，能力诚实登记）。

## 存储裁决（词面权威随本批落死——操作者注「环境设计提示」的采纳与取舍）

- **VUA 禁用集存于 VUA 自有存储**：环境根下 `.vua/` 惯例目录的
  VUA 专用状态文件（`<environment_root>/.vua/vpm-repo-state.json`），
  以 repoId 为键的禁用集合；**文件缺席＝全部启用**（诚实空态，非错误）。
- **绝不入 userRepos[i] 元素内**：vrc-get `UserRepoSetting` 恰五键闭集
  且无 flatten——元素内未知键反序列化丢弃、序列化不写回（源码事实 3）。
  VUA 自身全部写面经 `Settings::load`→修改→`save`（源码事实 4），存于
  元素内的 VUA 自有键会被 VUA 自己的任何一次仓库写面剥除。
- **绝不立 settings.json 顶层新键**：vrc-get `AsJson` 的 `#[serde(flatten)]
  rest` 顶层未知键往返无损（源码事实 2）——但 **VCC/ALCOM 写方对未知顶
  层键的容忍未经真机核实**（现机 18 键全已知＝从未观测过未知键存活）。
  把 VUA-only 状态写进他工具拥有并改写的共享文件，等于把它暴露给同一类
  「静默剥键」风险。共享文件只载共享事实（F1 如实口径方向）；启停既无
  共享语义，就住 VUA 自己的房子。
- **诚实 UI 文案口径（F1 同款纪律）**：启停面**不写共享 settings.json**
  ——「仓库启用/禁用是 VUA 自己的设置，存放在 VUA 自己的存储中，不会
  修改你的 VCC/ALCOM 设置」；刷新面如实宣称写共享缓存文件（见根事实
  专节）。

## F4 词面语义

- **三方法、无 preview 臂——A3/A4 同律如实立面。** 启停为单行原子状态
  翻转：无既有状态摘要可 diff、无摘要可绑定，ADR-0006 破坏性警示路径
  无可警示（翻转不触任何包文件、项目内容、订阅行本体）；刷新即网络行
 为本体（预览无法不做同样网络工作而验证可达性——A4 远端订阅同律）。
  用户显式提交即确认；携 `confirmedDigest` ＝形状违反（负例钉死）。
- **不收 `projectPath`。** 生命周期面只寻址订阅行（013
  `project_not_found` 复用不适用；携 `projectPath`＝形状违反，负例钉死）。
- **单键闭集 `{repoId}`。** 仓库 id＝稳定行柄（A4 removeRepo 同柄；索引
  寻址不冻结——并发写下漂移）。未知 repoId＝执行时端口答复用码
  `vua.vpm.repo_not_found`（A4 removeRepo 同事实）；id 缺席行（读面
  repoId=null）在本词面可达范围之外（协议本载明的诚实边界）。
- **启停语义（冻结词面事实）。** 禁用＝该行**离开包集合世界**：枚举与
  解析面（packages-repo-catalog 仓库级列表、packages-query latest 判定、
  A2 安装解析器）不再见其包；**订阅面继续列出行**——packages-repos v0.2
  （同批冻结）`enabled` 位读回真实状态，禁用对配置视图零隐藏。新添加订
  阅行恒为 enabled（添加面重置同 id 残留状态——新订阅从新开始）；移除
  行不留状态残留（实现核对切片职责，协议本申报）。
- **刷新语义（冻结词面事实）。** 该行**自身缓存文件**
  （settings `userRepos[i].localPath`）的 etag 条件刷新——vrc-get 自身刷
  新同源同写（If-None-Match，写回 localPath）；official/curated 预定义
  缓存在订阅世界无 repoId，本面不可达（诚实边界载明）。refreshed 收据
  **必携 `cacheUpdated`**＝库面 `update_cache` 两臂结果：true＝抓取写入
  新缓存；false＝etag 未变「已是最新」。**两臂皆成功**——「无新数据」
  是刷新结果，绝非错误；收据绝不携带字节计数或包清单（发明即非法）。
- **九态任务化写命令（写命令族一致形状）。** `commandId` 幂等、可取消
  （刷新网络段使可取消性成为实质）、事件＋修订；恢复将非终态残留映射
  为 `inspect_required`、绝不隐式续传（诚实纪律 3）。

## 错误码（零新码——027 表态第 6 条 F4 方向照准落死）

- **F4 端口码闭集＝三个既有码（全系 A4 批所立，本批零新立）**：
  `vua.vpm.repo_not_found`（未知 repoId）、`vua.vpm.repo_write_failed`
  （启停状态文件写回失败／刷新缓存写回失败）、`vua.vpm.repo_fetch_failed`
  （刷新网络段失败）。
- **折叠纪律（A1/A2 以后各批同款）**：全部端口拒绝折 rejected
  `execution_failed` 携原码 detail 溯源；复用码 `vua.vpm.*` 永不入
  rejected `code` 键（pattern 锁 `^vua\.packages\.`，负例钉死）；guard
  三值闭集 preview_drift / package_not_found / execution_failed 维持零
  新增。
- **信封错误面（零新码）**：无对应能力位的后端答通用
  `vua.vpm.capability_missing`（wire 门 submit 前作答——能力缺席绝不进
  任务）；参数违反答 `vua.packages.invalid_params`；未接线引擎答诚实缺
  席臂 `vua.packages.unavailable`。

## 能力门控（已命名，未路由——候接线批落地）

- 新 default accessor `VpmBackend::repo_lifecycle_capabilities() ->
  RepoLifecycleCapabilities` **三独立位**（`enable_repo` / `disable_repo`
  / `refresh_repo`——后端可只服务面的子集；门按方法、绝不按面；
  default declared-none，025 `catalog_capabilities` 同律，ORC-DEV-004）。
  本批三方法端口方法带 default 体（declared-none 答
  `capability_missing`）——trait default 即缺席臂，与 wire 门同码双臂
  两层诚实（A3/A4 同构）。
- served 行 **`packages.repoLifecycleOps`** 一行服务三方法（repoOps/
  createOps 一行先例）：行可用性＝后端声明【任一】独立位即 available；
  每个路由 submit 前各自独立读【本方法】的位，缺席答通用
  `capability_missing`。wire 路由与双常量（信封 `"0.6"`＋族
  `vua.packages-ops/v0.6`）候核心接线切片载明。VrcGetLib 覆写随环境实
  现核对切片落地——此前该行如实 unavailable；CLI 后端无生命周期面如
  实假。

## 后端指向根事实专节（027 检查点——必载）

- **启停状态根**：`<environment_root>/.vua/vpm-repo-state.json`——VUA
  自有存储（本批存储裁决），以 repoId 为键的禁用集合；文件缺席＝全部
  启用。
- **生产接线面**：environment_root＝用户真实 VCC 共享根
  `%LOCALAPPDATA%\VRChatCreatorCompanion\`（026 U14 落账接线事实）。本
  面**绝不读写共享 settings.json**（启停状态在 VUA 自有文件；刷新写订
  阅行自身缓存）。`.vua/` 状态文件系 VUA 专用新文件——真机家族清单
  （027 s6(a)）证实现根无 `.vua` 条目（缺席即默认态），与 Logs/、
  Updater/ 等工具自有目录同存的共存模式。
- **刷新写根**：订阅行自身缓存文件（settings `userRepos[i].localPath`，
  共享根内）——**与 vrc-get 自身刷新同源同写**（etag 条件），非新文件
  类；official/curated 预定义缓存（`Repos/vrc-official.json` /
  `vrc-curated.json`）不可达。
- **测试隔离面**：`with_environment_root` 临时根注入（既有惯例），全
  部合成数据；实现核对切片以临时根单元测试对账（启停状态文件读写、
  刷新两臂、禁用过滤）。

## 明确在本词面之外

- **重排**：不在本面（026 A4 起持续维持——候后续消费需求落地再冻）。
- **add-remote 的 HTTP 头/凭据传输**：不收（026 A4 裁决维持；未来收凭
  据的面需另立安全裁决）。
- **official/curated 启停与刷新**：预定义缓存在订阅世界无 repoId——本
  面不可达（诚实边界；如需启用/忽略开关，候后续独立面提案）。
- **批量/全部行启停**：不立（单行单命令；批量属后续消费需求）。
- **后台/自动刷新**：不立（刷新仅用户显式发起；主动后台网络行为需另立
  任务与边界裁决）。
- **与 VCC/ALCOM 共享启停状态**：不可能（裁决 (c)——它们没有该概念；
  亦不将 VUA 键位写入共享 settings.json——存储裁决如上）。

## 诚实边界

零端到端宣称维持——本词面已冻结**未接线、未消费**（wire 路由候核心接
线切片；桌面订阅行启停开关与刷新键候形状核可后消费；VrcGetLib 覆写候
环境实现核对切片——此前 served 行如实 unavailable）；真机走查归 W25
（O-2 候用户开窗）。本批与 packages-repos v0.2 读回增量同批冻结（无读
回位则切换面不可诚实消费——F3 增量先例同径）。
