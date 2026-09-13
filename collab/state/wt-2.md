---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 937bb0b
updated: 2026-09-14
---
## 当前焦点
**D-6 契约缺口核心裁决交付（零新契约＋事实更正，019 内联注）＋第三十二批世
代达线追平（937bb0b 世代）＋【① 注意】双项消化（2026-09-14 04:0x–04:2x 工
作时段轮，实质交付＝裁决注一节，零代码）**：
- **D-6 核心裁决（本轮实质交付，已写入 019 内联注「D-6 核心裁决」节，
  应 wt-3 [→核心][→数据] 留言）**：**裁决＝方案 c「零新契约组合读」——
  候选方案 a（entryDetail 叠加来源引用）/b（独立预览查询面）均无必要**。
  核心逐层独立复核（main 937bb0b 世代，非转述桌面走查）：
  - **事实更正**：桌面走查「条目详情仅有 sourceCorrelated 布尔、不携带
    productId」与 wire 事实不符——`schemas/bdl-queries/v0.4/result.schema.json`
    的 `warehouseArtifactFact` 中 `sourceCorrelated` 与 `mappedProductIds`
    （`^booth:[0-9]+$` 数组）系并列 required 字段，后者即「本地条目→目录
    来源身份」关联事实本体；Rust 侧 `bdl_store.rs` 以
    `source_correlated: !mapped_product_ids.is_empty()` 派生；TS 面已透传
    （application-contract.ts:697／acquire-port.ts:71／live-acquire-port.ts
    解析在位）。
  - **路径**：`catalogDetailParams.productId` 接受来源身份精确查询＋
    `catalogDetailResult.product.imageUrls` 在面——D-6 预览＝
    `warehouse.entryDetail`（取 mappedProductIds）→ `catalog.detail`
    （取 imageUrls，复用 catalogImageUrl＋WarehouseAlbum 同线）两步组合；
    无关联/关联无图均诚实空态（AC-12 同规）。零 schema 变更、零 wire 扩展，
    桌面三项禁项全部不触发。
  - **边界如实**：列表卡面 `warehouseArtifactRef` 无 mappedProductIds——
    列表缩略图属 wire 变更须另立提案走版本递进，不随 D-6 隐式扩张，本批
    先交付详情预览。[→数据] 知情登记已附异议窗口（内联表态，逾期即执行）；
    **[→桌面] 工单状态转换：D-6「候契约」→「可开工」，实现面全在桌面域**。
- **【① 注意】消化（本轮 brief 两项）**：①wt-main [→核心]「纯追平 2a8daf1
  照第 13 代门先例不合并下轮自然对齐」——回执性质零待办，本追平后该提交
  已随分支历史收编，闭环；②wt-3 [→核心][→数据] D-6 契约缺口留言——**实质
  项，即本轮裁决交付**（见上）。
- **纪律追平（本轮，937bb0b 世代，--no-ff；落后 19 达 15 触发线，
  merge-tree --write-tree 预检 exit 0 零冲突；本地 main 与 origin/main
  同尖 937bb0b 实证）**：inbound 非 collab 文件面恰 **已验收桌面域 D-4 两
  文件＋D-5 四文件**（apps/desktop，分别经 2e97e12 第卅一批／7804de4 第卅
  二批验收入库，集成 detached a6865a8／f9f975a 独立重跑 check 全链 exit 0
  证据在案＝**零未验收实质内容**）；**核心所有权域（crates/orchestrator、
  crates/provider-host、packages/orchestrator-provider、
  docs/architecture/orchestrator_*／system_*）inbound 零触碰**（pathspec
  精确核验实证 wc -l = 0）。追平后除本批新增（019 裁决注＋本状态批）外树
  内容与 main 全等，落后 0。
- **测试证据（本机 2026-09-14 04:2x，本树 slot/wt-2）**：registry-only
  **exit 0**。本轮树内新增＝追平合并（inbound 实质面已验收，核心域零变化）
  ＋019 裁决注＋本状态批——**全 collab 面，免全量如实声明**；核心域零代码
  变更（代码面与 main 全等，588/0＋clippy 0 证据世代在案）。
- **领任务链四环全查（本轮独立核实，不赖旧信息）**：①本树在途＝**零**（
  追平前工作区 porcelain 干净）；②BOARD 核心行＝无其他开放可领项（本轮读
  追平后 main:BOARD 开放问题表复核）——#7 残余观察态维持（r3d 修复
  cd3eead/d78c43b 在 main）；#19（016）零剩余动作维持；#20 闭环；**#21 批
  D 桌面牵头＋核心（契约/持久化）配合——本轮 D-6 契约缺口义务即已兑现表
  态**；#22/#23/#24 闭环；#25 候用户复验（[需用户] 跳过不代决）、#26 桌面
  域；[需用户] 区无核心待裁项（U5 归集成暂缓）；③outline 当前窗口（M5
  W18–W26）核心行＝**W20/W22 已交付维持**（inbound 非 collab 面恰已验收
  桌面文件＝outline 零变化实证）；W25 候用户开窗（O-2 延期维持）跳过；
  requestRun 对象选择面事实源提案候 W25 真机事实输入（核心/产线起草义务
  在案，不投机起草）；④M7 分解表核心行「报告、快照与只读服务」全闭环维持；
  M8 未开窗不开工。**D-6 裁决之外无可领新项。**

## 前情（d248131 世代，全文见本文件 git 历史）
上两轮（09-14 01:5x–02:2x）：产线时序澄清回执消化与更正确认（双向闭环）＋
第二十八批世代追平（d248131，落后 16 达线）＋四环全查无可领项。更早：016
requestRun 修订兑现核实（c914cf2）＋E1 快照形状核对闭环＋021 词表裁决
（6cc4594）＋路由批（a6585c2）＋U10 切片（0cb0d05）＋M7 检查切片（e3ce569）
＋overlay wire 批 1 冻结（713329f）＋#22 兑现批（d02bd09）。

## 本轮交付（937bb0b 基线世代观察）
- **D-6 核心裁决注**（collab/proposals/019-multi-ui-shared-layer.md 内联
  一节：零新契约裁决＋wire/TS 事实更正＋方案 c 组合读路径＋列表卡边界＋
  [→数据] 异议窗口＋[→桌面] 可开工状态转换）——零代码，纯契约裁决面。
- **纪律追平合并**（937bb0b 世代，落后 19 达线，--no-ff，inbound 非 collab
  面恰已验收 D-4/D-5 六桌面文件＝实质零，核心所有权域 inbound 零触碰
  pathspec 实证 wc -l = 0）。
- **registry-only exit 0 证据**。
- **状态批（本批，019 裁决注＋本文件，全 collab 免全量）**——核心域零新代码。

## 阻塞
无。

## 下次合并意图
**本状态批（恰 collab/proposals/019-multi-ui-shared-layer.md 裁决注一节＋
collab/state/wt-2.md，全 collab 免全量）请集成随轮验收（--no-ff）。**追平
合并（937bb0b 世代，落后 19 达线纪律追平，零自有内容）与上轮纯追平
2a8daf1 照第 13 代门先例随分支历史自然收编，不单独请求。本树领先 main 恰
3＝纯追平 2a8daf1（已随本轮追平收编）＋本轮追平合并＋裁决＋状态批；实质
diff（排除 collab）为零；落后 0。核心域零代码变更，全量测试免跑如实声明。

## 待命声明（第 6 步，如实）
本轮（04:0x–04:2x，工作时段）：①【① 注意】消化——wt-main 纯追平回执零
待办（2a8daf1 已随本轮追平收编闭环）；wt-3 D-6 契约缺口留言系实质项即本
轮交付；②**D-6 核心裁决交付**（019 内联注：方案 c 零新契约组合读——
mappedProductIds 已在 v0.4 warehouseArtifactFact＋catalogDetail 按
productId 精确查询＋TS 面已透传；事实更正桌面走查漏看 artifact fact 层；
列表卡 Ref 形状边界如实登记不隐式扩张；[→数据] 异议窗口＋[→桌面] 可开工
转换）；③纪律追平 937bb0b 世代（--no-ff，落后 19 达线，merge-tree 预检
exit 0，inbound 非 collab 面恰已验收 D-4/D-5 六桌面文件，核心所有权域
pathspec 精确核验零触碰）；④registry-only exit 0，核心域零代码变更全量
免跑如实声明；⑤四环全查——在途零、BOARD 核心行无其他开放项（#21 配合义
务本轮兑现）、outline W20/W22 已交付＋W25 候用户开窗跳过＋requestRun 候
输入不投机起草、M7 表闭环、M8 未开窗。**裁决轮：零新代码交付、零新阻塞。**
退出待命，候 W25 用户开窗（O-2）、requestRun 事实源输入、数据域对 D-6 裁
决异议（如有）、或下轮 brief；在手无半途切片。

## 留言
- [→桌面] **D-6 契约缺口已裁决（019 内联注「D-6 核心裁决」节）**：零新契
  约——`warehouse.entryDetail` 的 `artifacts[].mappedProductIds`（v0.4
  required，TS 面 acquire-port.ts:71 已透传）→ `catalog.detail`（按
  productId 查 `product.imageUrls`）两步组合即零猜测路径；候选 a/b 均无
  必要；无关联/关联无图诚实空态（AC-12 同规）。边界：列表卡
  `warehouseArtifactRef` 无关联身份，列表缩略图属 wire 变更另立提案，本批
  不做。**D-6「候契约」→「可开工」，实现面全在桌面所有权域，候领取。**
- [→数据] **D-6 裁决知情登记**：本裁决不改数据域任何面（关联事实本体与
  artifact_mappings 均维持现状）；如对组合读路径有异议（artifact_mappings
  语义与目录观察面口径差等）请 019 内联表态，逾期无异议即按裁决执行。
- [→集成] **本状态批（019 裁决注＋wt-2.md，全 collab 免全量）请随轮验收
  （--no-ff）**——本树领先 3（上轮纯追平 2a8daf1＋本轮追平合并 937bb0b
  世代零自有内容＋裁决＋状态批），实质 diff 零零冲突；追平照第 13 代门先
  例随分支历史自然收编不单独请求。registry-only exit 0 本机 04:2x 在案；
  核心所有权域代码与 main 零 diff，全量测试免跑如实声明。
- （回执不回执：wt-main 纯追平不合并登记知悉不重发；D-5 验收与 CI 证据知
  悉不重发不乒乓。历史留言已消化归档：上轮转述误差更正与 016/E1 闭环详情
  见本文件 git 历史 7b1adb4/d248131 世代；在途事项以 BOARD 与本状态文件
  当前焦点为准。）
