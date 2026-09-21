---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 1d21157a
updated: 2026-09-22
---
## 当前焦点
**第 171 批（2026-09-22 06:1x–07:0x，节拍轮工作时段 date 06:14 实测）＝
bdl-queries v0.5 接线批（操作者第 171 批指派；v0.5 FROZEN cb40bf1d 已随
集成第 168 批入库 cd45dcdd）。轮首 --no-ff 追平 main 1d21157a（落后 38/
实质 17/领先 0 归零，merge-tree 预检零冲突，吸收集成第 164–170 批世代
＝wt-4 030 store v0.2 落库环＋wt-5 v0.5 冻结批＋wt-3 169 批词表补齐＋
wt-7 仓库基建 PR 世代）。实现产物（提交 4d99a67e，恰 18 文件
1381+/83-；零新依赖 Cargo.toml 零 diff；冻结词面零字节触碰——
schemas/bdl-queries/v0.5 全目录未触；VUA-7/VUA-8 全程零触碰）**：

- **信封常量**：bdl_queries.rs `BDL_QUERIES_SCHEMA_VERSION` 0.4→0.5
  （协议本明确派给核心接线批的一行升版；additive 六→八操作升版，六
  个 v0.4 方法词面零变化，唯信封 schemaVersion 随词表升）。**「信封
  双常量」如实注记**：recipe-export/RepoLifecycle 先例的双常量＝信封
  常量＋结果族常量成对（结果文档自带版本），而 bdl-queries 冻结面只
  携一个版本串（query 侧与 result 侧两个 schema 文件锁定同一 "0.5"，
  结果文档无自带版本字段）——双常量律在本族收敛为单常量、于单一信封
  装配点（bdl_query_success）盖章；不发明冻结面不存在的第二版本值，
  此读法如实记录候集成/操作者复核。过时的 v0.3 模块头注如实校准。
- **port 面（trait）**：orchestrator 新模块 dependencies_queries.rs
  `DependenciesQueriesPort`（照 ProjectDraftExportPort/VpmBackend 安置
  律：port trait＋类型化事实住核心，实现侧 adapter 落上游 crate——
  真实查询执行器读 bdl 库归数据/产线域后续环）：①缺省 declared-none
  能力访问器 `dependencies_capabilities`（NONE 默认，025
  catalog_capabilities 律＋ORC-DEV-004「无实现不预留」；**单比特服务
  两方法**——冻结 v0.5 面是一个设计单元，「线索非结论」律需两面对照
  才成立，repoOps 一行服务多方法先例）；②`dependencies_lookup` 建议
  面＋闭集参数解析（与 CatalogListParams 同构：name 必填非空、depKind
  骑冻结 BDL v0.2 四值闭集、limit 1–200 默认 50、offset≥0；词外键与
  词外值＝契约错误绝不静默过滤——fuzzy 键负向量同此钉）；③
  `dependencies_list_by_product` 线索面（Ok(None)＝未知 productId，路
  由映射到 catalog.detail 缺席语义，绝不伪造空答）；④类型化事实逐键
  镜像冻结 v0.5 词面（deny_unknown_fields camelCase：match 十二键含
  resolvedProductId＋advisory、observation 九键含 extractedBy/
  observedAt/resolution、resolution＋四键证据 BDL v0.2 verbatim、
  advisory、total 分页前计算、productStatus 墓碑诚实）＋冻结枚举
  depKind 四值/sourceSpan 五值/extractionMethod 六值/installSource
  （vpm＋unknown 留闭集、规则 v1 绝不发射）/confidence 两档；
  availabilityStatus 复用 vua_bdl_store::AvailabilityStatus（稳定枚举
  零重复）；⑤port 体零匹配逻辑（匹配规则 v1/advisory 规则 v1 系实现
  执行器的读期规则表——本面只是类型化载具，与派单「实现批候后续环」
  一致）；⑥缺省体答家族诚实缺席码（F5 结构律：路由门先行，缺省体是
  第二诚实层）。
- **路由臂**：provider_host.rs `dependencies.` 前缀分发臂＋
  `dependencies_query_request`（catalog.request 同构五段序）：仓库/BDL
  接线缺席→家族类型化诚实缺席→port 槽缺席→同一→闭集解析→
  `vua.catalog.invalid_params` 先于能力门→能力门（declared-none）先
  于 port 调用→port 类型化拒绝 verbatim 骑行（读面直通纪律）→OK 投
  影走 serde 在单一装配点盖章共享常量。**路由用码零新立**：三臂全部
  复用 bdl-queries 家族既有注册码 vua.catalog.unavailable /
  vua.catalog.invalid_params / vua.catalog.product_not_found（协议本
  自文明示 listByProduct 缺席语义对齐 catalog.detail 判例）。
- **能力行**：application.getSnapshot 能力表新增 `dependencies.queries`
  一行（repoOps 一行服务多方法先例），骑仓库接线 AND port 缺省访问器
  ——declared-none 缺省使行诚实 unavailable，直至实现批用实现侧覆写
  翻转（recipe-export 环 3 翻转先例）。
- **槽位**：WarehouseConfig/WarehouseServices 新增
  `dependencies_queries: Option<Arc<dyn DependenciesQueriesPort>>`；生
  产 bin 壳维持 None（诚实缺席）候数据/产线实现环；9 处测试夹具构造
  点随字段机械补 None（它们钉其它面的接线形状，不在本批指派内）。
- **wire 测试**：dependencies_queries_wire_v05.rs **11 例绿**骑真实帧
  环（fake 端口带调用记录器）：冻结正例 request 向量驱动路由＋冻结正
  例 result 向量经类型化 port 重放（同时证明类型化事实恰从冻结词面反
  序列化），wire 应答与冻结向量逐字全等＋过冻结 result schema 实校验
  ；冻结负向量四件（空 name／词外 depKind 钉 unity_or_sdk_version 五
  值拒绝面／fuzzy 键／listByProduct 过滤键）＝路由层契约错误且 port
  零调用；分页越界契约错误；诚实缺席三梯（无仓库接线／无槽位／
  declared-none）皆先于 port 作答；未知 productId→not_found；类型化拒
  绝 verbatim；前缀下未知方法→unknown_method；能力行双态钉
  （declared-none 与翻转）。
- **随版件（机械常量随行，如实申报）**：①catalog_queries.rs＋
  catalog_serving.rs＋downloads_list_serving.rs 随冻结面走——schema
  校验对 v0.5 现行代；六个 v0.4 方法的例向量留在其 v0.4 冻结代目录
  （v0.5 冻结只新增 dependencies 向量、未复制全套），以现行常量盖章副
  本驱动并证明参数面跨升版同一；操作闭集钉六→八逐字升；②
  mock-provider.ts（核心所有权域的 DEV 仿真）＋mock-provider.test.ts
  ＋packages/contracts application-contract.ts 六处信封类型字面随
  0.4→0.5（信封常量的 TS 面——协议本将该常量升版派给核心接线批；
  dependencies.* 两新成员的 TS 面仍归桌面批）；③apps/desktop
  import-model.ts 窄化运行时常量＋import-model.test.ts 正例 fixture
  ＋gateway-router.test.ts fixture 机械随行——窄化函数以字面量键控
  live 信封，不随行则 main 上每个真实信封应答被判不可解释（切片完整
  性优先；已向桌面席留言知会，桌面批可复核或按其口径重整）。
- **门禁读数（2026-09-22 06:3x–07:0x 本树亲测，df 先查 516G/73%）**：
  cargo test --workspace **109 套件 951/0**（集成 168/169 基线 108 套
  件 940＋恰本批 11 例 wire 钉，零涟漪）＋cargo clippy --workspace
  --all-targets **0 警告 0 错误**＋desktop typecheck 双 tsconfig
  exit 0＋desktop vitest **96 文件 892/892**（随版件只改既有测试，数
  字与基线持平自洽）＋contracts check **89/89**＋orchestrator-provider
  check **47/47**＋check:i18n OK＋check:boundary OK＋check:contrast
  达标＋check:leak **155 指纹零泄漏**（独立临时生产构建）。
- **诚实边界**：零端到端宣称——本批交付的是 wire 路由＋port 面＋
  fake 端口证据；真实查询执行器（读 bdl 库）归数据/产线域实现环，其
  落地前行与路由都诚实 unavailable；匹配规则 v1/advisory 规则 v1 在
  本批零代码（实现执行器的读期规则表，词表载其版本化事实）；wire 证
  据系真实帧环上的代码面证据，非 live wire 非真机——真机全链归 W25
  （O-2）；测试绿≠真机绿；桌面窄化常量随行已使 live 面与桌面消费面
  保持一致，但该一致性系代码面事实非真机行使证据。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 164 批（09-22 03:3x–04:1x，4f911abc 恰 8 文件）＝029 B 面环 3 执行
器实现批：OnDiskProjectDraftExporter（013 聚合读纪律核心侧镜像）＋能
力覆写翻转＋生产 bin 接线＋执行器矩阵 9 例＋wire 串联 2＋协议本
0.1.2＋REGISTRY 同步；经集成收编入库（随集成第 168 批世代）。第 162
批（00364604＋0428d9c4）＝环 2 接线批：port face `ProjectDraftExportPort`
（declared-none 默认访问器＋同步只读签名零九态任务＋typed 拒绝
verbatim）＋typed `ProjectDraftDocumentV01` 六事实键 deny_unknown_
fields＋路由臂五段序（packages.packageCatalog 同构，先于文档面折叠分
流）＋信封双常量＋served 行＋wire 测试 9 例骑真实帧循环＋双语协议本
0.1.1＋REGISTRY 行同步；三码闭集零新立，零新依赖；经集成第 163 批收
编（合并 bf7073d1）。第 160 批＝环 1 冻结批（recipe-export v0.1 词表
＋5 正 8 负向量＋消费测试 6 例＋双语协议本＋REGISTRY 两行＋三裁决）；
经集成第 161 批收编（2b491e3d）。第 158 批＝BOARD #45 两候派件处置。
第 156 批＝数据座第 155 批清点两观察点处置。第 155 批＝U19 交棒准入
闸后端切片。第 152 批＝proposal 029 起草批。第 150 批＝素材链修复批。
更早段落见本文件 git 历史与 BOARD 前录。

## 本轮交付（1d21157a 基线世代）
- **追平合并 00d2ee6a**（--no-ff 吸收 main 1d21157a＝集成第 164–170 批
  世代，merge-tree 预检零冲突，纯吸收零自有内容，基线刷新）。
- **实现批 4d99a67e（恰 18 文件 1381+/83-）**：orchestrator 新模块
  dependencies_queries.rs（port trait＋类型化事实＋闭集解析）＋lib.rs
  导出＋provider-host 路由臂/槽位/能力行＋bin 壳＋9 测试夹具随字段＋
  bdl-store 信封常量升版＋三个 bdl-queries 消费/wire 测试随版件＋
  mock/contracts/桌面信封字面随行＋新 wire 测试 11 例（见当前焦点逐
  项）。
- **本状态批（恰本文件一笔）**：切片记录＋门禁读数登记。

## 在途/待他角色
- **[等集成] 本拍两笔候随轮验收（--no-ff）**：实现批 4d99a67e（恰 18
  文件，非纯 collab 面，全量门禁读数已随批附：cargo 109 套件 951/0＋
  clippy 0/0＋TS 四门禁）＋本状态批（恰本文件），写明「wt-2 第 171
  批：bdl-queries v0.5 接线（信封常量＋路由臂＋能力行＋port trait＋
  wire 11 例；基线 1d21157a）」。重点 diff 复核面：①路由用码零新立
  （三臂恰复用家族三注册码，可对照 provider_host.rs 错误码字面量）；
  ②能力行 declared-none 缺省与槽位 None 的诚实缺席梯（bin 壳 None→
  真实 provider 恒 honest unavailable，直至实现环翻转）；③port 面类
  型化事实与冻结 v0.5 schema 逐键对表（wire 测试的反序列化重放即机械
  对表）；④「信封双常量」读法注记（单常量收敛）候复核；⑤随版件恰
  限常量/fixture 机械随行，无语义改动（桌面 import-model.ts 窄化常量
  一处＋fixture 字面，桌面批可复核）。
- **[候操作者/数据/产线] v0.5 实现环候派**：真实查询执行器读 bdl 库
  （store v0.2 落库面已由 wt-4 第 168 批备齐；本批 port 槽位与能力覆
  写翻转点已留妥——实现侧覆写 `dependencies_capabilities` 并填充 bin
  壳槽位即翻转，recipe-export 环 3 同构）；此后 wt-5 消费测试的参考推
  导由 store 实现面接替（wt-5 已预留该交接词）。
- **[候桌面] TS 面接线批**：dependencies.* 两成员的 TS 契约类型＋桌面
  消费面＋mock 模拟面候桌面席领取（本批已随版桌面窄化常量与 fixture
  字面，语义零改动；桌面批可一并复核）。
- [等操作者/用户] W25 真机走查推进（U18 终裁前零端到端宣称维持）。

## 阻塞
- 无阻塞。

## 下次合并意图
**候验收对象＝本拍两笔（--no-ff）：追平合并 00d2ee6a（纯吸收 main
1d21157a，预检零冲突）＋实现批 4d99a67e（恰 18 文件 1381+/83-，测试
全绿后提交），＋本状态批恰本文件，写明「wt-2 第 171 批：bdl-queries
v0.5 接线（信封常量＋路由臂＋能力行＋port trait＋wire 11 例；基线
1d21157a）」。**定向复跑面＝cargo test --workspace（951/0 自洽钉）＋
clippy 全 targets；desktop 面如需可定向复跑 typecheck/vitest（892/892
钉）。重点复核面见「在途/待他角色」①–⑤。

## 待命声明（第 6 步，如实）
本轮（2026-09-22 06:1x–07:0x，节拍轮工作时段 date 06:14 实测；三笔：
追平合并＋实现批＋状态批）：①date 06:14 实测正常时段；pnpm
collab:brief ①区判读＝指向本树留言恰 wt-7 暂停推送诉求（照办：本批
只推 slot/wt-2 零触 main）＋失鲜工作树无；②轮首追平＝落后 38 merge-
tree 预检零冲突，--no-ff 合并 00d2ee6a 纯吸收 main 1d21157a，基线刷
新；③领取操作者第 171 批指派，实读 v0.5 双协议本＋双冻结 schema＋九
例向量＋provider-host queries 族路由面（catalog/downloads/recipe-export
三先例）＋VpmBackend 跨 crate trait 实现先例（project-manager 依赖
orchestrator 落 adapter）后定型设计；④实现＝信封常量升版（双常量读
法如实注记）＋orchestrator port 面（trait＋类型＋闭集解析，零匹配逻
辑）＋路由双臂（零新码三臂复用）＋能力行（declared-none 缺省）＋槽位
（bin 壳 None）＋wire 测试 11 例（真帧环＋fake 端口＋调用记录器）；⑤
随版件＝三个 bdl-queries 消费/wire 测试对 v0.5 现行代（v0.4 例向量留
冻结代目录＋现行盖章副本驱动证明参数面同一＋闭集钉六升八）＋
mock/contracts/桌面信封字面机械随行（桌面窄化常量不随行将拒真信
封——切片完整性优先，桌面已留言知会）；⑥门禁亲测＝cargo 109 套件
951/0（940 基线＋恰 11，自洽）＋clippy 0/0＋typecheck 双 0＋vitest
892/892＋contracts 89/89＋orchestrator-provider 47/47＋i18n/boundary/
contrast OK＋leak 155 指纹零泄漏（df 先查 516G/73%）；⑦诚实边界维持
：零端到端宣称——本批系路由＋port 面＋fake 端口证据，真实执行器归
数据/产线实现环、真机归 W25（O-2），测试绿≠真机绿；[需用户] 条目照
规则零代决；VUA-7/VUA-8 全程零触碰；schemas/ 冻结词面零字节触碰。在
手无半途切片、除本状态批外无未提交改动。完成后推送并退出待命，候集
成验收本拍两笔、v0.5 实现环开窗。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍两笔（--no-ff），写明「wt-2 第
  171 批：bdl-queries v0.5 接线（信封常量＋路由臂＋能力行＋port
  trait＋wire 11 例；基线 1d21157a）」**——实现批恰 18 文件（定向复
  跑面＝cargo test --workspace 951/0 钉＋clippy 全 targets；TS 四门禁
  读数随批）＋本状态批。重点复核面见「下次合并意图」；一处读法候裁：
  派单「信封双常量」在本族系单常量收敛（冻结面只携一个版本串），未
  发明第二版本值，如实注记在案。
- **[→数据/wt-5]（接线兑现知会）**：你席第 168 批冻结的 v0.5 已按协
  议本分工完成核心接线——信封常量 0.4→0.5、`dependencies.lookup`/
  `dependencies.listByProduct` 路由臂、`dependencies.queries` 能力行、
  port 面 `DependenciesQueriesPort`（核心域，照 ProjectDraftExportPort
  安置律）；wire 测试骑你席九例向量正负两面全绿。真实查询执行器（读
  bdl 库）候实现环：槽位与能力覆写翻转点已留妥，落地即翻转。
- [→桌面/wt-3]（随版知会＋复核邀请）：信封常量升版牵动三处桌面字面
  ——import-model.ts 窄化运行时常量 0.4→0.5＋import-model.test.ts 正
  例 fixture＋gateway-router.test.ts fixture 机械随行（不随行则 live
  信封全被窄化判不可解释）；语义零改动、vitest 892/892 持平绿。桌面
  批接线 dependencies.* TS 面时可一并复核或按你席口径重整；两新成员
  的 TS 契约类型＋mock 模拟面候你席领取。
- [→产线/wt-4]（知会）：store v0.2 落库面已由你席备齐，本批 port 槽
  位与翻转点留妥；实现环（真实执行器读 bdl 库）候操作者派你席/数据
  席，届时 confirmed 翻 1 唯一写路径与你席读出面即接上查询面。
- （回执不回执：wt-7 暂停推送诉求已照办——本批零触 main；wt-8 无新
  知会；在途事项以 BOARD 与本状态文件当前焦点为准。）
