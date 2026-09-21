---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 0363e465
updated: 2026-09-22
---
## 当前焦点
**第 174 批（2026-09-22 07:2x–08:4x，节拍轮正常工作时段 date 实测 07:25；三笔：
追平壳〔吸收 main 13aeb56a〕＋本批＝dependencies.* v0.5 真实执行器环〔
BdlDependencyQueries 读 bdl 库执行 DependenciesQueriesPort＋两只 store 只读
面＋provider bin 装配翻真〕＋恰本状态批）**——操作者第 174 批派单兑现（接
线 4d99a67e 已在 main；core port 面落 orchestrator，执行器实现归本席——
bdl 库系 AMF 私有域）：

- **追平兑现（开工前置）**：轮首实测 main...slot/wt-4＝落后 24／领先 0
  （main 推进至 **13aeb56a**＝集成第 170/171/172 批三栈验收入库簿记，含
  wt-2 接线环 4d99a67e 与 wt-3 TS 面环 d5e24bf9）。merge-tree 预检 exit 0
  零冲突，--no-ff 合并 main 13aeb56a＝追平壳 **0363e465**（零自有内容纯
  吸收）。基线世代刷新 **0363e465**。brief ①区判读＝零本树阻塞；wt-8
  [→产线] 知会系其树工作已落 main，追平即吸收，零额外动作。
- **执行器落位（照 OnDiskProjectDraftExporter 先例）**：
  `crates/orchestrator/src/bdl_dependency_queries.rs` 新模块
  `BdlDependencyQueries`——实现核心 `DependenciesQueriesPort`，只读、零网
  络、零写面、零 tasked 面；经 bdl-store v0.2 表面（dependency_observations
  ＋products）读 AMF 私有 BDL 库；能力访问器翻真（dependencies_queries:
  true——recipe-export loop-3 翻转先例；此前 declared-none 缺席梯子照旧
  服务于未装配环境）。
- **匹配规则 v1（冻结协议本逐条）**：dep_name ASCII casefold 精确匹配
  （to_ascii_lowercase 不触非 ASCII＝逐字相等）；零子串、零模糊、零等
  价——包名形输入（com.lilxyzw.liltoon）非逐字在场即**诚实空集**
  （total:0＋matches:[]＝成功事实，非错误、非猜测）；存储永不重写（匹配
  非规范化，行内 dep_name 原样出线）；排序 productId 升序＋观察身份升
  序，total 先于分页（catalog.list 律）；depKind 过滤以枚举 serde 词对
  存储逐字列匹配（零重复闭集）；未知 productId＝Ok(None)→路由映
  catalog.detail not-found，永不伪造空答案。
- **advisory 规则 v1（双门）**：advisory 当且仅当 ①版面系刻意声明
  （extraction_method ∈ {explicit_heading, one_line, bullet}——prose/
  title/link 系顺带提及，纵已确认亦不及建议线）且 ②解析系人工确认
  （confirmed_by_human=1；未确认解析系线索永不转建议）；installSource 由
  **解析目标商品**的 source host 派生——booth.pm host（含子域）＝
  booth_page，其余 host（含无 host）＝external_page；vpm/unknown 留在冻
  结闭集但 v1 永不发出；confidence 只骑版面维——strong＝
  explicit_heading/one_line，weak＝bullet。
- **「线索非结论」两面对照**：lookup 只对 confirmed 解析出线
  resolvedProductId（null＝无解析或未确认——不透露区分）；listByProduct
  插入序全量出线、confirmed 逐行如实贴标（未确认线索原样、绝不翻
  面）＋extractedBy/observedAt 携带全量＋evidence 四键逐字；墓碑 declaring
  商品两面对照均不滤（lookup 不按墓碑态过滤——声明的证据力不随页面死亡；
  listByProduct 答 productStatus:missing 且观察行照读）。
- **两只 store 只读面（bdl_store.rs，v0.2 观察面旁的最小增量）**：
  `dependency_observations_all`（全库观察身份序扫描——反查执行器的扫描
  面；复用既有诚实行映射器）＋`dependency_product_row`
  （declaring/解析目标商品行事实：status 逐字 complete|missing＋title/
  availability/source_url 逐字；**任意状态皆服务**、墓碑含——观察读面
  的事实源而非 catalog 卡面；未知 id＝None）＋DependencyProductRow 类型
  ＋lib.rs 导出。
- **失败映射（零新错误码）**：库读不可服务＝家族注册诚实缺席码
  vua.catalog.unavailable（家族无 internal 通道）；外来闭集词（v0.2
  CHECK 单一权威下不可达的 store 面漂移）同路浮出，永不猜成员。
- **装配翻真（provider bin）**：vua-orchestrator-provider.rs 的
  WarehouseConfig dependencies_queries 槽位由 None 换为
  `Some(BdlDependencyQueries::new(store))`——与 warehouse/downloads 面同
  一 BDL 库（一库一事实源）；诚实 None 占位撤除，生产能力翻转随本批落
  地。
- **测试（全合成库矩阵，代码面证据）**：orchestrator
  `tests/dependencies_queries_executor.rs` **9 例**（能力翻转；空库＝诚
  实空集；匹配 v1 casefold 精确＋零子串＋包名形诚实空＋dep_name 原样不
  重写＋双字段律＋确定性分页窗；depKind 过滤；confirmed-only 门——未确
  认与无解析两行俱出 null 不透露区分；advisory 版面门六种 extraction 全
  矩阵含 bullet-weak 与 prose/title/link-无；installSource 由解析目标
  host 派生三例 booth.pm/子域/外部＋v1 永不发 vpm/unknown；listByProduct
  无滤线索面插入序＋None/Some(false)/Some(true) 确认标＋evidence 逐字＋
  extractedBy/observedAt；墓碑商品两面对照照读）＋bdl-store
  `tests/dependency_query_reads.rs` **2 例**（全库扫描跨商品插入序＋空库
  诚实空集；product_row 任意状态/未知 None）＋provider-host 线测增真执行
  器一例（合成种子库过真实 frame loop，应答过冻结 v0.5 result schema 校
  验；resolvedProductId/advisory booth_page strong/availabilityStatus
  available；未知 productId 经 Ok(None) 骑 product_not_found）＝线测
  11→12。
- **验证读数（2026-09-22 本树亲测）**：cargo test --workspace **111 套
  件全 ok、0 失败**（追平后基线 109 套件＋恰本批执行器矩阵与 store 读面
  两新套件）＋cargo clippy --workspace --all-targets **0 警告 0 错误**；
  schemas/ 零 diff（冻结 v0.5 与 BDL v0.2 面零字节触碰）；冻结向量/
  协议本/REGISTRY 零触碰（本批零协议词面变化——纯实现环）。
- **红线与诚实边界（全程维持）**：**零端到端宣称**——本环全部系合成种
  子库上的代码面证据（测试绿≠真机绿）；真实提取管线切片与 W25（O-2）
  真机证据候后续窗口；零 BOOTH 访问、付费资产零接触、VUA-7/VUA-8 全程
  零触碰；[需用户] 条目零代决。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 168 批（2026-09-22 05:2x–06:2x）＝030 store v0.2 落库实现环（迁移注册
升版＋写入/读出面＋confirmed_by_human 确认写动作面＋存储层行为测试 6 例
＋协议本 0.2.1 双语），候随轮验收。第 166 批＝030 冻结批（dep_kind 四值
定稿＋向量 17 文件落位＋schema/002/协议本/REGISTRY 转正），已随集成第
166/167 批收编 8c123983。更早 164/154/148/147/146/145/143/142/141/139/
138 批见 BOARD 前录与 git 历史。

## 本轮交付（0363e465 基线世代）
- **追平壳 0363e465**（--no-ff 吸收 main 13aeb56a，预检 exit 0 零冲突，
  零自有内容纯吸收，基线刷新）。
- **本批（dependencies.* v0.5 真实执行器环）**：crates/orchestrator 新模
  块 bdl_dependency_queries.rs（BdlDependencyQueries 实现
  DependenciesQueriesPort：匹配 v1＋advisory v1 双门＋两面对照＋能力翻
  转＋lib.rs 注册）＋crates/bdl-store 两只读面（observations_all＋
  product_row＋类型＋导出）＋crates/provider-host bin 装配翻真（None→
  Some(执行器)）＋三处测试（orchestrator 9 例＋bdl-store 2 例＋线测增真
  执行器 1 例 11→12）。
- **collab 面**：恰本状态批。

## 在途/待他角色
- **[等集成] 本批候随轮验收（--no-ff）**，写明「wt-4 第 174 批
  （dependencies.* v0.5 真实执行器环；基点 0363e465）」；定向复跑面＝
  cargo test --workspace（111 套件 0 失败自洽钉）＋clippy 全 targets；
  collab 面请重点复核：①匹配 v1 诚实空集与零等价（包名形输入返回成功
  空集而非错误/猜测）；②advisory 双门（未确认解析永不转建议＋prose/
  title/link 纵确认亦无 advisory）；③两面对照（lookup confirmed-only
  与 listByProduct 原样贴标的分叉恰系诚实）；④store 只读面「任意状态
  皆服务」与 catalog 卡面「墓碑永不卡片」的分工不冲突；⑤bin 装配翻真
  与 loop-3 翻转先例对表；⑥schemas/ 零 diff。
- **[候下窗] 030 剩余**：提取管线切片（保守提取落线索行）候操作者派
  发；确认工作流消费面（U18 段）候其后。
- **[等操作者/用户] 沿革在途**：W25 正式执行（A3 段 Unity 侧核证义务在
  肩）；缺口 (b) 交接准入终态门槛候裁决；配方↔素材链接达归属候指派
  （均见第 148 批登记与 BOARD）。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
**候验收对象＝本批两笔（追平壳零自有内容纯吸收 main 13aeb56a，预检
exit 0 零冲突；＋实现批＝crates/orchestrator BdlDependencyQueries 执行器
＋crates/bdl-store 两只读面＋provider bin 装配翻真＋测试 12 例新增
〔orchestrator 9＋store 2＋线测 1〕，测试全绿才提交〔workspace 111 套
件 0 失败＋clippy 0/0〕，＋collab 批＝本状态批），请集成随轮验收
（--no-ff），写明「wt-4 第 174 批（dependencies.* v0.5 真实执行器环；
基点 0363e465）」。**

## 待命声明（第 6 步，如实）
本轮（2026-09-22 07:2x–08:4x，正常工作时段 date 07:25 实测；三笔：追平
壳＋v0.5 真实执行器环＋collab 批）：①date 07:25 实测正常时段；pnpm
collab:brief ①区判读＝零本树阻塞；②轮首追平壳吸收 main 13aeb56a（落后
24→0，预检 exit 0 零冲突），基线刷新 0363e465；③通读操作者第 174 批派
单＋接线批 4d99a67e 全文＋冻结 v0.5 协议本（匹配 v1/advisory v1/两面对
照/keep 裁决节）＋port 面 dependencies_queries.rs 全文＋bdl-store v0.2
依赖观察面与 products 面实读＋draft_exporter 装配先例实读；④实现＝
BdlDependencyQueries 执行器（匹配 v1 casefold 精确零等价诚实空集＋
advisory 双门版面×确认＋installSource 解析目标 host 派生 booth.pm 判
定＋两面对照 confirmed-only vs 原样贴标＋墓碑两不滤＋能力翻转＋家族零
新码失败映射）＋store 两只读面＋bin 装配翻真；⑤测试＝合成库矩阵 9 例
＋store 读面 2 例＋线测真执行器 1 例（真实 frame loop＋冻结 schema 校
验），全数亲跑绿；⑥验证亲测＝cargo test --workspace 111 套件 0 失败＋
clippy 全 targets 0/0；⑦诚实边界维持＝零端到端宣称（合成种子库代码面
证据、测试绿≠真机绿）、schemas/ 零 diff、冻结协议本/向量/REGISTRY 零
触碰、零 BOOTH 访问、VUA-7/VUA-8 全程零触碰；[需用户] 条目零代决。在手
无半途切片、除本批提交外无未提交改动。退出待命，候集成验收本批、提取管
线切片开窗、W25 窗口推进。

## 留言
- [→集成] 验收请求：**候验收对象＝本批两笔（追平壳纯吸收 main 13aeb56a
  ＋实现批＝BdlDependencyQueries 执行器＋bdl-store 两只读面＋bin 装配翻
  真＋测试 12 例新增，测试全绿后提交〔workspace 111 套件 0 失败＋clippy
  0/0〕，＋collab 批＝本文件），请随轮验收（--no-ff），写明「wt-4 第
  174 批（dependencies.* v0.5 真实执行器环；基点 0363e465）」。**随请
  BOARD #46 行更新（集成维护）：dependencies.* v0.5 真实执行器环已落＝
  读 bdl 库执行器＋装配翻真，routes 在装配环境下不再诚实缺席；
  030 剩余＝提取管线切片＋确认工作流消费面。零端到端宣称维持。
- [→数据]（030 内联线程知会）dependencies.* v0.5 读执行器已落：你们冻
  结词面的读期派生律全部按协议本兑现——lookup confirmed-only（null 不
  透露无解析/未确认之分）、listByProduct 原样贴标、installSource 只发
  booth_page/external_page（booth.pm host 含子域判定；vpm 等规则修订候
  VPM-repo 调和事实）；提取管线落线索行后本执行器即读即得，无需再改。
- [→核心]（知会）bin 装配已翻真：warehouse 槽位
  dependencies_queries = Some(BdlDependencyQueries)（同库同源）；未装配
  环境（无 VUA_WAREHOUSE_ROOT）仍走诚实缺席梯子，F5 结构律双层保持。
- （回执不回执：wt-8 [→产线] 知会系其树工作已落 main、追平即吸收零动
  作；历史留言已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
