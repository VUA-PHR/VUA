---
worktree: wt-3
branch: slot/wt-3
baseline_commit: c97cbe47
role: 桌面
updated: 2026-09-22
---
## 当前焦点
**第 160 批提案 029 A 面实现切片一「配方中枢接线」（2026-09-22 01:5x–02:2x，节拍轮
工作时段 date 01:52 实测；本拍三笔：实现批＝A4+A5 代码/测试/词面/设计标准 0.7.15＋
勘误批＝提案 029 内联线程一行勘误＋本状态批；轮首追平壳 46a1c43d）——任务＝操作者
第 160 批指派（判决书④切片一）：A4 selectRecipe 选择事实源动作＋A5 配方→生产链组装
发起；配方页选择态成工作主态、选配方→预览→组装发起接线真实生产链端口；车间页本切片
不动（切片二）**：

- **追平（TICK 开工纪律）**：轮首 fetch 实测落后 main 12（c97cbe47 世代＝第 159 批
  簿记＋四栈收编），merge-tree 预检 exit 0 零冲突，--no-ff 合并追平壳 **46a1c43d**
  （入站全为已收编内容纯吸收）。VUA-7/VUA-8 全程零触碰。
- **A4（选择事实源动作）**：`production-chain-store` 新增
  `productionChainRecipeSelectedAction`＋纯函数 `productionChainRecipeSelected`——
  链身份键值只取 recipe.get 读面回执的身份（UI-02「链身份即对象身份」延伸到选择事实
  源，不取列表标签不取本地猜测）；选中文档身份与链上不同＝新链（旧链解析/执行受理与
  记录身份让位，AC-13 同链前提不破），完全相同＝幂等不打断在途链；与既有
  `productionChainRecipeSavedAction`（保存回执对齐）并存双事实源。gate 派生修订照
  判决：签名改 `productionChainGate(chain, {present, dirty})`，**stale-draft 仅搭配
  草稿在场（有条目）且 dirty 时成立**；草稿不在场（如已保存后撤销回空，无「待保存
  内容」）即 ready——AC-05 语义不破（服务端版本锁守卫仍独立拒绝）。
- **回执窄化＋两处 live wire 真缺陷修复（同族，本切片内发现即修）**：冻结 wire 面
  recipe-get.result v0.2＝required 闭集 {recipeId, revision, recipeDocument,
  updatedAt, schemaVersion}，文档本体系透明 object（桌面保存链提交的文档体内不含
  revision，修订系存储层元数据）；新 `narrowRecipeDocumentReceipt`（recipe-model.ts）
  按冻结形状收窄。**实读发现渲染层两处消费点读 `.recipe` 键——冻结 wire 上不存在
  （文档本体在 `recipeDocument` 键），live 链上配方文档事实与 D5 保存查重静默降级
  （BG-1 家族缺陷，非本切片引入）**：①RecipeLibrarySection 文档事实/结构/三视图
  装载改经回执窄化；②compose-save-dedup D5 查重候选改经回执窄化（原读法在 live
  上恒 undefined→compareKey 恒 null→查重永不命中）。DEV fixture 脚本
  scripts/fixtures/production-review.tsx 的 recipe.get 桩同步对齐冻结 wire 形状
  （原桩也回 `{recipe}`）。
- **A5（选中态组装发起）**：ProductionChainSection 在配方页 documentMode 双挂载
  （与搭配草稿弹窗内挂载并存），消费同一容器层 store 与 Gateway 端口（019 批 C 两
  UI 同 store 先例）；链身份经选择动作就绪后链段即呈现（no-recipe 自行不渲染纪律
  照旧），推进 解析→计划→批准→执行；**计划批准维持 production-use-case v0.2
  plan.approve 幂等词面（请求面 additionalProperties:false 单键 {planId}，schema
  实读），风险决策不在本面**（判决书 A5 订正照准）；车间页本拍零触碰。
- **词面迁移（#44×U16 首次落地成文）**：zh 表链卡 executeCta「执行装配」→「执行
  组装」、executePendingNote→「批准计划后可发起组装。」、subtitle→「选择或保存配方
  后依次推进:…」（选择入径诚实）、staleWarning→「搭配草稿已修改…」（与 gate 在场
  语义对齐）；**「装配」保留 AMF 阶段语义**：executeTitle「装配」、recordPendingNote
  「装配受理后…」、recordEmptyDesc「装配完成后…」及 subtitle 流水线阶段图不迁移；
  en/ja/ko 无组装/装配歧义，仅 subtitle 选择诚实同步（占位符零变化）。
- **测试（全绿后才提交）**：store 测试 6→10（＋gate 四象限矩阵＋选择新链让位＋同
  身份幂等＋无草稿在场 ready）；recipe-model.library 测试 9→12（＋回执窄化三钉：
  冻结形状/桌面保存链文档体内无 revision 照常收窄/缺身份或缺本体＝null）；
  compose-save-dedup 测试桩对齐冻结 wire 形状；vitest **92 文件 864/864**（第 157
  批基线 857＋恰本批 7 新钉，数字自洽）。
- **设计标准 0.7.15（双语＋REGISTRY 随行）**：§8.4 增补配方页制作中枢（库选择即预览
  主体＋选择事实源动作＋选中态组装发起双挂载＋plan.approve v0.2 单键词面＋
  stale-draft 在场语义）＋**词面纪律（#44×U16）首次成文**（用户动作「组装」；衣装
  挂接与 AMF 阶段「装配」）；§8.5 未动（车间降级归切片二 0.7.16 候）。
- **验证读数（2026-09-22 02:0x–02:2x 本树亲测）**：typecheck 双 tsconfig exit 0；
  vitest 92 文件 864/864；build exit 0（cargo release 段含）；check:boundary OK；
  check:i18n 双检查 OK；check:contrast 全部达标；check:leak **155 指纹零泄漏**
  （独立临时生产构建）；check:forest-leak 通过；smoke:production-review **33/33**
  （Electron 合成网关，零真机服务——fixture 对齐后的回归证词）。
- **brief ①区判读**：wt-4 [→wt-3] 回执（回执不回执）；wt-7/wt-8 [→桌面] R4–R6 避让
  知会——本拍涉面（store/recipe 页/链段/i18n 链卡键）与其持久化通知/模态所有权改动
  零交叉，两工作树及其分支全程零触碰。
- **本拍纪律**：实现批恰 16 文件（store 2＋recipe-model 2＋RecipePage 1＋链段 1＋
  dedup 2＋i18n 四表 4＋fixture 脚本 1＋设计标准双语 2＋REGISTRY 1）＋勘误批恰提案
  029 一文件＋本状态批；零新增 wire 契约零新增依赖（提案边界 4 照准）；mock/fixture
  不出 DEV（fixture 桩仅 DEV 脚本，check:leak 155 指纹零泄漏复核）；诚实边界维持
  **零端到端宣称**——本拍全部系代码面＋合成网关证据，live recipe.get 文档事实/查重/
  选择驱动链/双挂载链段的真机呈现归 W25（O-2），测试绿≠真机绿。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 158 批（09-22 01:0x–01:3x 两笔）＝提案 029 A 面形状核可批（判决书落内联线程，
A1–A6 全核可＋A5 词面订正＋三片建议），已经第 159 批收编（合并 7aa3bbe5；集成登记
A5 从句版本词一处不精确候勘误——本拍勘误批兑现）。第 156 批（09-22 00:0x 三笔）＝
release-handoff TS 契约对齐切片，已经第 157 批收编（f3d0c1f0）。第 154 批（09-21
23:0x 两笔）＝U19 交棒准入闸桌面消费切片（0.7.14），已经第 155 批收编（18d6d15f）。
更早见 git 历史。

## 本轮交付（c97cbe47 基线世代）
- **追平壳 46a1c43d**（吸收 main c97cbe47＝第 159 批，预检 exit 0，零自有内容）。
- **实现批**（恰 16 文件，见当前焦点逐项）：A4 选择事实源动作＋gate 修订＋回执窄化
  ＋两处 live wire 真缺陷修复＋A5 双挂载＋词面四表迁移＋测试 7 新钉＋设计标准
  0.7.15 双语＋REGISTRY。
- **勘误批**（恰 collab/proposals/029 一文件）：A5 从句就地上标订正＋内联线程勘误节
  （核心冻结批对照引用以 amf-production v0.2 confirm-plan schema 为准）。
- **本状态批（恰本文件）**。

## 残余风险清单（如实登记，非阻塞）
- **组件层渲染行为测试基建缺席**（BOARD #37 同源沿登）：配方页选择态＋双挂载链段的
  React 挂载路径仅 smoke 合成网关覆盖，归 W25 走查。
- **live wire 真缺陷系本拍修复后首检**：文档事实/查重在 live 链的行为此前从未真实
  呈现过（读法错键），修复后真机复核归 W25（O-2）。
- **smoke 33/33 系合成网关证据**：真机（Kernel live）配方链全链未行使，零端到端
  宣称。

## 在途/待他角色
- **[等集成] 本拍三笔候验收**（追平壳 46a1c43d＋实现批＋勘误批＋本状态批）。
- **[等核心/wt-2]（知会非阻塞）**：029 勘误已落（本拍勘误批）——B 面冻结批对照引用
  以 amf-production v0.2 confirm-plan schema 为准。
- **[等用户] W25 真机复验维持**：既有交棒/检视链＋本拍新增（文档事实/查重/选择驱动
  链/双挂载链段真机呈现）——归 W25（O-2）候用户返回驱动。

## 阻塞
- 无阻塞。

## 下次合并意图
**候验收对象＝本拍三笔（--no-ff）：实现批（恰 16 文件）＋勘误批（恰提案 029 一
文件）＋本状态批恰本文件，写明「wt-3 第 160 批提案 029 A 面实现切片一配方中枢接线
（A4+A5，基线 c97cbe47）」**。desktop 面（实现批请定向复跑 desktop check 链＋
smoke:production-review）；collab 面请重点复核：A4 选择事实源身份纪律（回执必填身份
字段来源）、gate 在场语义修订与 AC-05 不破声明、`.recipe`→冻结 wire 修复的两处引证
（provider_host.rs recipe_get 装配＋recipe-get.schema.json required 闭集）、A5
plan.approve v0.2 单键词面零夹带、词面迁移清单（zh 用户动作「组装」化＋阶段「装配」
保留明细）。

## 待命声明（第 6 步，如实）
本轮（2026-09-22 01:5x–02:2x，节拍轮工作时段 date 01:52 实测；追平壳＋实现批＋勘误
批＋状态批）：①date 01:52 实测正常时段，pnpm collab:brief ①区判读＝wt-4 回执＋
wt-7/wt-8 避让知会零交叉，失鲜工作树无；②轮首追平壳 46a1c43d（落后 12 预检 exit 0
零冲突）；③通读判决书④切片一指派＋提案 029 全文＋相关 wire 面（plan-approve/
recipe-get schema、provider_host recipe_get/save 装配、contracts TS 面）；④现状
代码逐文件实读（store/port/RecipePage/ProductionChainSection/compose-save-chain/
compose-draft-store/recipe-model/dedup/四表/fixture 脚本）并实读出 `.recipe` 键
与冻结 wire 不符；⑤A4 实现（选择动作＋gate 修订＋回执窄化＋两处消费点修复＋fixture
对齐）；⑥A5 实现（链段双挂载，车间零触碰）；⑦词面四表迁移（「组装」用户动作/
「装配」阶段保留明细如上）；⑧测试 7 新钉＋全量验证（typecheck 双 0＋vitest 92 文件
864/864 恰基线 857＋7＋build 0＋boundary/i18n/contrast/leak 155 指纹/forest-leak
全过＋smoke 33/33，df 先查 588G/69%）；⑨设计标准 0.7.15 双语＋REGISTRY；⑩勘误批
（就地上标＋线程节，不改裁决主体）；⑪本状态批；⑫诚实边界维持：零端到端宣称——全
部证据系代码面＋合成网关，live 链真机归 W25（O-2）；[需用户] 条目照规则跳过未代决。
在手无半途切片、除本状态批外无未提交改动。完成后推送并退出待命，候集成验收本拍三笔。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍三笔，写明「wt-3 第 160 批提案 029 A 面实现
  切片一配方中枢接线（A4+A5，基线 c97cbe47）」**——实现批恰 16 文件（desktop 面，
  请定向复跑 desktop check 链＋smoke:production-review）＋勘误批恰提案 029 一文件
  ＋本状态批。重点 diff 复核面见「下次合并意图」。
- [→核心/wt-2]（对表知会）：029 A5 版本词勘误已落内联线程（就地上标＋勘误节）——
  B 面冻结批对照引用请以 **amf-production v0.2 confirm-plan schema**（v0.2 方法面
  四键 {planId, observedRevision, riskChoice, rememberForSession}）为准；
  production-use-case v0.2 plan-approve 单键 {planId} 词面经本拍实现复核不变。
- [→操作者] 第 160 批办理完毕：**切片一（A4+A5 配方中枢接线）交付**——A4 选择事实
  源动作＋gate 在场语义修订＋A5 选中态组装发起双挂载＋词面「组装」化四表迁移＋设计
  标准 0.7.15。**顺手收口两处 live wire 真缺陷**（`.recipe` 键读法，BG-1 家族：
  配方文档事实装载＋D5 保存查重在 live 链静默降级；本拍修冻结 wire 并同步 DEV
  fixture 桩，真机复核归 W25）。切片二（A6 车间降级状态面）候下拍派发。
- （回执不回执：wt-4 九缺口闭合回执、wt-7/wt-8 R4–R6 避让知会已消化零动作；在途
  事项以 BOARD 与本状态文件当前焦点为准。）
