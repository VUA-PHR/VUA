---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 20aa960c
updated: 2026-09-24
---
## 当前焦点
**第 180 批（2026-09-24 23:0x 夜窗拍，操作者第 190 批派单；基线 5d7ba00c 轮首
--ff-only 追平集成第 190 批 PR #26 合并尖 20aa960c——顺带收编本席第 179 批
勘误批入库回执＋集成第 189/190 批簿记，纯吸收零自有内容）＝核心域自我反向
审查批（v1.8 空队列条款，先例第 148/178 批）。审查对象＝第 148 批后新落地
核心域三处（树内核实）：①批 174 bdl_dependency_queries.rs（BDL 查询执行
器，wt-4 落地）；②批 162/164 recipe_export.rs（端口面＋OnDiskProjectDraft
Exporter，本席落地）；③批 146＋批 182 run_provision 的 SDK resolve 接线与
S2 取消位落地（wt-4 生产域落地，只读审查）。按五缺陷族猎新。产出＝一候选
缺陷被证据证伪（本批最重要诚实事件，如实全文登记）→ 转化为 CHECK 在库律
回归钉＋注释精确指向约束权威；两项跨域登记（数据席/环境席）；其余审查面闭
合无发现。src 侧恰纯注释＋10 行零语义，测试侧恰 1 例新钉。**

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 179 批（09-24 08:1x）＝核心注释批号勘误批（恰 2 文件 4 行词面），已随
集成第 190 批 PR #26 入库（merge-base 实核 a7f53d47 是 origin/main 祖先；
全仓「batch 181」笔误 grep 残量＝0，集成第 189 批簿记知会项就此闭环）。
更早＝178/177/176/171/170/165/164/163/162/161/160/158/157/155/152/151/150
批，见 git 历史与 BOARD 前录。

## 本轮交付（20aa960c 基线世代）
- **审查面逐族结论（五族全查，证据自述）**：
  ①**诚实族——候选被证伪（核心事件）**：候选＝bdl_dependency_queries.rs
  dependencies_list_by_product 的 productStatus 残余臂（非 missing 即
  Complete）以「CHECK 闭集 complete|missing」为由折向 complete，而本席初读
  schemas/bdl/v0.2/schema.sql products DDL 第 74 行确系 `status TEXT NOT
  NULL` 仅注释无 CHECK——若实况如此，外来状态词将被伪造成「页面完好」（虚
  假世界断言，BG-12 同形）。**篡改测试证伪了候选**：第二 rusqlite 连接
  UPDATE status='archived' 被 SQLite 拒绝——`CHECK constraint failed:
  status IN ('complete','missing')`。真约束权威＝**可执行迁移链**
  （schemas/bdl/v0.1/001_initial.sql 第 27 行 products DDL 携带该 CHECK；
  运行库由 MIGRATION_001+002 出生，bdl_store.rs 48-49 include_str 实锤）；
  v0.2/schema.sql 头部自述「this file + the executable migration chain」
  共同构成冻结 schema——原代码正确、残余臂在运行时不可达外来词，本席初读
  只见重述文档未见可执行链，候选前提错误。**执行器改动全部回摆**（避免新
  增数据库不可能态死臂——本席第 178 批自审曾把死臂登记为 no-action 面，
  不能双标），仅保留注释精确化（＋10 行纯注释：指明约束权威在可执行链、
  v0.2 重述文档该列仅注释、并指向新测试钉）。
  ②**诚实族新钉（本批唯一测试交付）**：
  product_status_maps_both_legal_words_and_the_closed_set_is_database_
  enforced——文件库 BdlStore::open＋枚举写面播种 complete/missing 两商品，
  断言两合法词逐字映射（Complete 映射此前无钉，本批补齐）；再以第二连接
  尝试外来词篡改，断言被拒且拒绝信息系 status CHECK 本体——钉死「残余臂
  前提（闭集由库强制）」不被未来重建表静默丢失（002 对
  compatibility_observations 的 CHECK 重建即先例：重建可能掉约束）。
  ③**路径/注入族闭合**：recipe-export 路由臂实读（provider_host.rs
  2808-2883）——参数闭集单键 projectPath 非空→注册校准（013 聚合 collect_
  project_inspections 逐项比对 project.path）在端口调用前拒绝越册路径→能
  力门先行→端口直通；执行器只读注册根下三个固定相对路径
  （Packages/vpm-manifest.json、ProjectSettings/ProjectVersion.txt、
  .vua/project.json），零用户可控路径成分拼入。dependencies 路由臂实读
  （5420-5499）——限流 limit∈[1,200]、offset≥0 路由层校验，执行器内
  usize::try_from 兜底为不可达死臂（登记性质，与既有按语一致）；bdl-store
  三读面 SQL 全参数化（?1＋[]），零字符串拼接。
  ④**确定性族闭合**：lookup 排序 productId 升序→observation_id 升序、
  total 先于分页（catalog.list 律）；listByProduct 库面 ORDER BY
  observation_id 两读面同序；exporter BTreeMap 迭代即 packageId 升序呈现；
  draft_identity_v7 与 provider-host uuid_v7_identity 逐位同形（含直读
  SystemTime 系身份律非确定性面——exportedAt 才是确定性面且已走注入时钟，
  既有测试钉 ids distinct 即其法定形状）；run_provision 失败消息取
  receipt.failed.first()——**发现一跨域登记**（见在途）。
  ⑤**两链不对称族闭合**：执行器三读纪律与 013 聚合逐点比对（project_
  inspection.rs 296-420＋vua_identity.rs read_identity）——manifest 仅文件
  计＋对象校验＋非字符串值跳过、版本行 m_EditorVersion: 前缀＋trim＋
  classify 完整性门、identity 三态边界（NotFound=absent/其余读败与解析败
  与未知版本=unreadable/marked_at 参与解析＋identity_version==1）逐点一
  致；聚合计数库面 catalog_list `WHERE status='complete'` 只出卡片系目录
  面既律，与新面 tombstone 可读系协议明记的两面对照非漂移。
  ⑥**取消位族闭合**：S2 落地（material_exec.rs）与本席第 177 批设计登记
  逐点核对——run_provision create 后 resolve 前观察位（656）＋
  local-reusable 尾 register/preview 前（1025）与 preview/apply 间（1042）
  两观察位＋「发布物在快照外」诚实事实注记＋skip-install 抉择——与登记文
  本零漂移，三例取消注入测试在库（批 182 交付）；BDL 查询面纯有界 CPU 只
  读无取消位需求（登记正判）。
- **门禁读数（如实）**：cargo test --workspace **113 套 990/0**（批 188
  基线 989＋恰本批 1 例新钉，账目自洽）＋cargo clippy --workspace
  --all-targets **0 警告 0 错误**。**中途瞬败如实登记**：中间一轮全量读数
  1 failed，当即全量重跑归零（990/0 零代码改动），与本席 crates/ 零触碰
  段（吸收代际 crates/ diff 实核 0 行）合并判读系既有测试侧时序/环境敏感
  族（集成第 189 批簿记登记族，#7 判例复跑归因路径），非本批改动面。
  追平后定向复验 10/0 绿。src 侧 `git diff` 非 注释行数实核＝0。

## 在途/待他角色
- **[等集成] 本拍候验收**，写明「wt-2 第 180 批：核心域自我反向审查批
  （基线 20aa960c）」。恰 2 文件（bdl_dependency_queries.rs 纯注释＋10／
  dependencies_queries_executor.rs＋76 一例新钉）全在本席所有权域；重点
  复核面＝注释内约束权威指涉（schemas/bdl/v0.1/001_initial.sql 第 27 行）
  与新测试钉的注释自述是否与实况相符。
- **[知会数据/wt-5] schema.sql 与可执行链分工注记（非缺陷零行为面）**：
  v0.2/schema.sql 的 products.status 闭集仅注释、真 CHECK 在可执行链
  001_initial.sql（本批篡改测试实证约束在库）。冻结 schema 系「文档＋可执
  行链」整体自洽；唯重述文档单读会低估硬律（本席初读即踩此坑）。本批注释
  与测试钉已自文档化；数据席如认为宜在 schema.sql 该列补一行「CHECK 见
  001_initial」指涉，候酌情，不催办。
- **[知会环境/wt-6] resolve_project 失败集未排序观察（登记性质）**：
  vpm_backend.rs DependenciesNotFound 臂 failed 逐依赖入列未排序
  （resolved 显式 sort_by id），素材链 run_provision 取 first() 命名失败
  依赖——多依赖同时不可解时消息命名哪个 id 取决于第三方库错误 map 内部顺
  序（**库内实现本席未验证，如实登记不确定性**）；仅影响失败消息细节非结
  局（reason_code 同族、provision 照常失败回滚）。候选硬化＝failed 按 id
  排序使命名确定，属环境席裁量，不催办。
- **[知会集成] 测试侧时序敏感族新例**：本轮门禁中途瞬败一例（重跑归零零
  代码改动），与贵方第 189 批登记族同形，已并案读数（见门禁段）。
- **[维持登记] 3220 plan schemaVersion 标签缺省硬化候选**——不变。
- **[候操作者] S3（核心冻结环，W25 真机证据条件触发）未立项不排期；W25
  真机走查沿登。**

## 阻塞
- 无阻塞。零猜测项。既有 [需用户] 项维持候裁，本批零新增零代决。

## 下次合并意图
**候验收对象＝本拍单笔（审查交付＋本状态批同批），写明「wt-2 第 180 批：
核心域自我反向审查批（基线 20aa960c）」**。src 侧纯注释零语义＋测试侧一例
新钉，全量门禁亲测全绿（113 套 990/0＋clippy 0/0）。走 PROTECTED_MAIN 政
策通道（集成树 PR 落地，正典 main 只快进）。

## 待命声明（第 6 步，如实）
本轮（2026-09-24 23:03 date 实测正常时段起，23:39 状态批落笔）：①读
collab/roles/core.md 与 collab/PROTECTED_MAIN.md 后跑 pnpm collab:brief，
①区判读＝无指向本树/角色阻塞与留言，两条 [知会核心/wt-2]（时序族登记新
读数吸收；批号勘误经核已随集成第 190 批闭环）；②轮首 --ff-only 追平
20aa960c（吸收集成第 189/190 批簿记＋本席第 179 批入库回执，纯吸收；吸收
代际 crates/ diff 实核 0 行）；③审查对象树内核实（批 162/164/174/146/182
五提交 git log 实读）后五族逐面审查（各面证据见本轮交付段）；④一候选缺陷
（productStatus 残余臂）经篡改测试证伪——执行器改动全回摆只留注释精确化，
证伪过程全文如实登记不为结论文饰；⑤两跨域登记（数据席 schema 分工注记／
环境席失败集排序观察）如实写入并标注未验证处；⑥门禁取舍如实：全量亲测
（113 套 990/0＋clippy 0/0），中途瞬败如实登记并归因既有族，追平后定向
复验 10/0；⑦诚实边界维持：零端到端宣称（本批全部结论系代码面＋测试面证
据）、[需用户] 零代决、VUA-7 零触碰（阅读解禁）、VUA-8 零触碰、用户素材
目录零触碰、交付栈两进程零触碰、他角色所有权域零改码（bdl-store/
unity-bridge/project-manager 均只读）；⑧在手无半途切片，除本状态批外无
未提交改动。完成后推送并退出待命，候集成验收本批。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍单笔（审查交付＋状态批同批），写明
  「wt-2 第 180 批：核心域自我反向审查批（基线 20aa960c）」**。恰 2 文件
  全在核心所有权域：bdl_dependency_queries.rs ＋10 行纯注释（零语义，
  git diff 非 注释行数＝0 实核）＋dependencies_queries_executor.rs ＋76
  行一例新钉（CHECK 在库律＋两合法词映射）。全量门禁亲测：cargo test
  --workspace 113 套 990/0（基线 989＋恰 1）＋clippy --workspace
  --all-targets 0/0；中途一轮瞬败已如实登记归因既有时序族（重跑归零零代
  码改动）。本批核心事件系一候选缺陷被证据证伪（详见状态批，证伪链完整
  可复核），src 侧最终为零语义注释批。收尾时段（08:40）前推送完毕。
- （回执不回执：在途事项以 BOARD 与本状态文件当前焦点为准。）
