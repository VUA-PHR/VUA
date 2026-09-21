---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 2bd60a4a
role: 桌面
updated: 2026-09-22
---
## 当前焦点
**第 166 批提案 029 B 面环 4「桌面消费」（2026-09-22 04:2x–05:2x，节拍轮工作时段
date 04:25 实测；本拍两笔：轮首追平壳 53209fd9 吸收 main 2bd60a4a＝第 164 批三栈
收编世代，＋实现批恰 26 文件 594+/11-，＋本状态批）——任务＝操作者第 166 批指派
（B 面环 3 冻结 847de263→接线→实现 4f911abc 已入库、served 行 available 后的桌面
消费环）。**至此提案 029 B 面（环 1 冻结→环 2 接线→环 3 实现→环 4 消费）四环全线
落库，029 桌面侧无在途残留**：

- **追平（TICK 开工纪律）**：轮首 fetch 实测 slot/wt-3 落后 main 8／领先 0，
  merge-tree 预检 exit 0 零冲突，--no-ff 合并追平壳 **53209fd9**（零自有内容纯
  吸收；入手 wt-2 B 面环 3 执行器＋wt-4 030 草案＋wt-main 簿记）。VUA-7/VUA-8
  全程零触碰。
- **契约 TS 面登记（packages/contracts，桌面域）**：`recipe.exportProjectDraft`
  同步只读 Query 三处闭集登记——application-contract（Query 类型＋结果类型照冻结
  Schema `schemas/recipe-export/v0.1` 镜像六事实键闭集：draftId/exportedAt/origin
  三键〔projectPath 回显＋projectName 可空＋vuaIdentity 三态〕／environment.
  unityVersionConstraint verbatim 可空／dependencies〔packageId 升序＋
  versionConstraint verbatim＋lockedVersion 可缺〕／missing 十值闭集＋请求联合＋
  成功值联合＋isApplicationRequestV01 单键 {projectPath} 守卫）＋desktop-gateway
  （请求接口＋方法种类表 query＋信封守卫）＋desktop-gateway.test 显式负例钉
  （缺键/空串/投机键/错型拒绝；入口限定已注册工程集不开放任意路径）。
- **Kernel 路由（gateway-router）**：query verbatim 透传——实现域未接线＝
  `vua.recipe_export.unavailable` 诚实缺席、未注册路径＝复用
  `vua.project.project_not_found`（024 判例）原样透传，缺席语义不折叠。
- **渲染层窄端口（recipe-export-port）**：信封族常量 `vua.recipe-export/v0.1`
  精确命中＋六事实键形状收窄（必需键收不齐/词表外形状＝不可解释→unavailable，
  不渲染半可信草稿——诚实律 1）；应用错误按码归类（project_not_found→
  request_rejected，其余→unavailable）；**empty/fixture/create 三装配臂＝恒
  unavailable 诚实缺席**（不伪造草稿；create.ts 恒 live 基线——草稿是观察事实
  不模拟，开发切档不产生演示草稿）。
- **纯模型（recipe-export-draft-model，9 vitest 钉）**：确认会话三补全件——
  ①标题＝用户显式给（草稿无 title；projectName 预填时注明来源标注且可自由修改，
  冻结 Schema description 明示预填系桌面呈现决策）②环境约束＝盘上观察 verbatim
  只呈现，**null（不可读）时用户补全输入、系统绝不代填**（对应缺失清单
  environmentUnityVersion 维度；可读时补全输入无操作）③素材＝与 A2 同一 D3
  派生规则、身份幂等；可保存性守卫＝标题 1..120＋不可读时版本必填＋至少一条
  素材（recipe v0.3 assets/instances minItems 1——诚实的空骨架不能作为配方存在，
  冻结裁决二代码事实）＋挂载名同律（composeSaveBlocked 同一函数）；转正文档＝
  **composeDraftToSaveDocument 同一构造器同形状**（formatVersion 0.3＋同一
  recipeId 铸造约定＋同一 asset/instance 映射＋relations 空＋首存 baseRevision 0）
  之上 verbatim 转入草稿两维可靠事实（environment＋dependencies 声明集）——
  **lockedVersion 只作呈现绝不入文档、无 locked 块**（配方 locked 块由保存/解析
  链权威铸造，草稿绝不伪造）；守卫未过＝null（空保存拒绝同语义）。
- **容器层保存链（recipe-export-save-chain）**：与两条既有保存链（compose 草稿链
  ＋A2 文档编辑链）**同一线形状、同一守卫集**——忙碌守卫＋D5 查重（比对键＝
  composeDraftCompareKey 同一比对面，命中弹同一确认框持握至用户裁决）＋回执分类
  复用 classifyComposeSaveResult；成功对齐三件＝savedReceipt 回执入档（「已保存」
  仅回执后呈现）＋productionChainRecipeSavedAction（链身份随回执前移）＋
  recipePersisted（库失效重取）；失败如实、确认会话内容保留、重试显式。
- **呈现段（RecipeProjectDraftExport 弹窗＋RecipePage 入口）**：hero 动作位
  「从工程导出草稿」（词面纪律：入口系「导出草稿」、转正系「保存为配方」，不与
  创建/添加素材/组装混用）；拾取段限定 VUA 已注册工程集（projectOps.listProjects
  013 聚合读面投影）——陈旧登记（pathPresent false）如实标注＋禁用，服务未连接/
  无登记诚实空态，**不开放任意路径输入**；确认段草稿六事实键照单呈现：来源段
  （路径/名称可空＝诚实缺席/身份三态——适用边界事实非门，非 VUA 差异提示候
  未决项 2 裁决，零发明提示）＋环境段（verbatim/不可读注记＋补全输入）＋依赖段
  （行 verbatim＋锁定徽标；空数组＝诚实空态）＋缺失段（十值清单照单渲染＋诚实
  注记「导出不宣称还原设计意图」）＋补全段（标题＋同一仓储读面投影选择器——
  A3 同一面零导入词面＋待保存列表可移除）＋保存段（忙碌期「保存中…」＋失败注
  ＋D5 同一确认框）。
- **mock-provider 穷尽臂**：TS 方法闭集登记的穷尽性最小表态（既有先例文自注记）
  ——专属诚实缺席臂镜像真实 provider-host 冻结三元 `vua.recipe_export.unavailable`
  （不折入 warehouse/recipe 族缺席码），绝不伪造草稿。
- **词面**：四表同步＋43 键（en 源表＋zh-CN/ja/ko：export* 族＋missingDims 十键）
  ＋复用词面单一来源（compose.savedNote/compose.removeCta/D5 确认框四键/
  editSectionTitle/editDirtyNote/editFailedNote/savingEditCta/warehouse.selector
  全组）；check:i18n 双检查 OK。
- **设计标准 0.7.18 双语**：§8.4 增补「从工程导出草稿」段（拾取段工程集限定＋
  确认段六事实键＋转正确认三件＋同一保存链形状同一守卫集＋草稿绝不静默转正）
  ＋§12 变更记录＋REGISTRY 行 0.7.17→0.7.18。
- **测试（全绿后才提交）**：vitest 新文件 2 件恰 14 钉——模型 9（预填与诚实空名/
  守卫三件组合/title 词面边界/可读时补全输入无操作/幂等与 D3/转正文档同形状
  ＋verbatim 两维＋无 locked 块负例/不可读补全 verbatim/空保存拒绝/判等键同一
  比对面）＋端口 5（冻结信封接纳〔空依赖合法〕/异族常量拒绝/键形负例束/live
  端口码归类四臂/缺席臂恒 unavailable）＋contracts 显式钉 1＋冒烟 **+26 真
  Chromium DOM 钉＝97/97**（基线 71＋恰 26）：缺席臂诚实空态→工程集事实列表
  →陈旧登记禁用→草稿徽标→依赖 verbatim＋锁定徽标→缺失清单＋诚实注记→版本
  不可读注记→标题预填＋来源标注→保存三重守卫→选择器零导入词→补全后解禁→
  recipe.save 骑链（baseRevision 0＋用户标题＋verbatim 约束＋依赖转移＋无锁定
  钉入文）→忙碌守卫→失败如实→回执后才显已保存（修订 1）→D5 同一确认框持握
  →确认后落账＋库刷新→关闭用户发起。**冒烟修钉两处如实注记**：①React 受控
  输入须经原型原生 value setter 触发合成事件（直接赋值不触发 onChange）；②D5
  确认后再存铸造新 recipeId（首存惯例修订回 1），修订数断言改为回执后库刷新钉。
- **验证读数（2026-09-22 04:4x–05:1x 本树亲测，df 先查 551G/71%）**：contracts
  tsc 0＋vitest **89/89**（88＋恰 1 新钉）；desktop typecheck 双 tsconfig exit 0
  ＋vitest **96 文件 890/890**（第 164 批基线 876＋恰本批 14 新钉，数字自洽）
  ＋build exit 0＋check:boundary OK（一处 gateway 子模块直引越界当场修复）＋
  check:i18n 双检查 OK＋check:contrast 全部达标＋check:leak **155 指纹零泄漏**
  （独立临时生产构建）＋check:forest-leak 通过＋smoke **97/97**（Chromium 152
  合成网关，证据 %TEMP%/vua-production-review-dom.json）。diff 零 crates/ 零
  schemas/ 路径。
- **本拍纪律**：实现批恰 26 文件（新 6＋改 20）＋追平壳＋本状态批；零新增依赖
  （提案边界照准）；[需用户] 条目零代决；诚实边界维持**零端到端宣称**——本拍
  全部系代码面＋真 Chromium DOM 合成网关证据，导出全链真机行使（真实 Gateway
  读真实工程盘上事实→真实保存→库→链）归 W25（O-2），测试绿≠真机绿。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 164 批（09-22 03:3x–04:1x，经集成第 164 批收编 bf030796）＝提案 029 A 面实现
切片三「添加素材＋创建升格」（A1＋A2 平行文档编辑链＋A3 选择器），A 面消费闭环
申报。第 162/160 批更早＝A 面切片二/一，见 git 历史与 BOARD 前录。

## 本轮交付（2bd60a4a 基线世代）
- **追平壳 53209fd9**（吸收 main 2bd60a4a＝第 164 批三栈收编世代，预检 exit 0，
  零自有内容）。
- **实现批（恰 26 文件 594+/11-，新 6 改 20，见当前焦点逐项）**：B 面环 4 消费
  面（契约 TS 面＋路由＋端口＋模型＋保存链＋弹窗＋入口）＋四表＋设计标准
  0.7.18 双语＋REGISTRY。
- **本状态批（恰本文件）**：含 029 B 面四环闭环申报。

## 残余风险清单（如实登记，非阻塞）
- **组件层渲染行为测试基建缺席**（BOARD #37 同源沿登）：本拍弹窗组件挂载路径的
  覆盖来自冒烟脚本（真 Chromium＋合成网关），vitest 内仍无组件挂载基建，归 W25
  走查。
- **确认会话语义系实现时点定性**：导出确认会话是弹窗局部 state（关闭即失，重开
  重导出＝新 draftId 新会话）；「导出→关窗→重开」不恢复草稿属有意形状（草稿
  不落盘＝冻结词面明确不立草稿持久化），候 W25 真机走查观感确认。
- **smoke 97/97 系合成网关证据**：真机（Kernel live）导出全链未行使，零端到端
  宣称；真实 served 行 available 下的路由/能力门/盘上扫描全链归 W25。
- **转正文档携带 environment/dependencies 字段系桌面文档作者决策**：保存路径以
  Value 原样落盘（recipe_documents.rs 实读），下游 resolve 消费该两维——compose
  构造器历来不带 target/revision 的既有文档形状未在本拍改动（零夹带），其跨链
  一致性候核心座对表（本拍转正文档在 compose 形状之上只增冻结词表两维 verbatim）。
- **保存链并发面如实注记（沿登）**：导出转正是第三条并行保存入口（同一线形状、
  各自忙碌守卫），同时各发 recipe.save 由服务端 baseRevision 权威仲裁（首存恒
  baseRevision 0 各自成档；后至冲突如实被拒呈现）——候真机走查观感确认。

## 在途/待他角色
- **[等集成] 本拍两笔候验收**（追平壳 53209fd9＋实现批 26 文件＋本状态批）。
- **[对表知会→核心/wt-2]** B 面环 4 已落：消费面零词表扩展零 crates 触碰；转正
  文档＝compose 保存形状＋environment/dependencies 两维 verbatim（无 locked 块、
  无 target/revision 发明）——resolve 侧对该两维的消费语义候你席对表确认。
- **[候操作者] 029 后续**：桌面侧 A 面（A1–A6）与 B 面环 4 均已闭环，029 桌面
  无在途；云端素材选择段维持未决项 3＝#46 诚实缺席（候 030 冻结/U18 联动）。
- **[等用户] W25 真机复验维持**：既有链＋本拍新增（导出全链真机行使、确认弹窗
  观感、转正后链身份/库刷新观感、第三保存入口并发观感）——归 W25（O-2）候用户
  返回驱动。

## 阻塞
- 无阻塞。

## 下次合并意图
**候验收对象＝本拍两笔（--no-ff）：实现批（恰 26 文件）＋本状态批恰本文件，写明
「wt-3 第 166 批提案 029 B 面环 4 桌面消费（导出入口＋草稿六事实键确认流＋转正
保存链，基线 2bd60a4a）」**。desktop 面（实现批请定向复跑 desktop check 链＋
smoke:production-review 97/97）；collab 面请重点复核：①契约 TS 面三处闭集与冻
结 Schema 一致（application-contract 类型镜像＋desktop-gateway 守卫＋负例钉；
diff 零 schemas/ 触碰）；②同一保存链形状同一守卫集（recipe.save v1＋首存
baseRevision 0＋忙碌守卫＋D5 复用同一比对面＋回执分类复用——diff 零第二保存链
语义）；③草稿诚实呈现（六事实键照单、缺失清单不宣称还原设计意图、身份三态非
门零发明提示、名称可空诚实缺席、锁定钉定只作呈现不入文档）；④转正显式性
（草稿无 recipeId/title/关系面，用户补全三件后经既有保存链转正，绝不静默）；
⑤入口限定已注册工程集（选择器零任意路径输入、陈旧登记禁用）；⑥词面纪律
（导出草稿/保存为配方与创建/添加素材/组装不混用，四表同步）；⑦0.7.18 双语与
REGISTRY 一致。

## 待命声明（第 6 步，如实）
本轮（2026-09-22 04:2x–05:2x，节拍轮工作时段 date 04:25 实测；追平壳＋实现批＋
状态批）：①date 04:25 实测正常时段，pnpm collab:brief ①区判读＝wt-7/wt-8 两则
[→桌面] 知会（R4–R6 已在 main，与本拍零交叉，消费面实读确认 RecipePage 相关
修复无语义冲突）、失鲜工作树无；②轮首追平壳 53209fd9（落后 8 预检 exit 0 零
冲突）；③通读操作者第 166 批指派＋提案 029 全文（B 面冻结/接线/实现三节＋裁决
一二三）＋schemas/recipe-export/v0.1 双 Schema＋provider_host 路由与错误三元实
读；④现状代码逐文件实读（compose-save-chain/compose-draft-store/compose-save-
dedup/recipe-document-edit-store＋模型/RecipePage/WarehouseEntrySelector/
project-ops-port/gateway-router/desktop-gateway/application-contract/recipe
v0.3 Schema/recipe_documents.rs 存储面）并核对存储 Value 透传事实；⑤转正文档
落形决策（compose 构造器复用＋两维 verbatim 转入＋lockedVersion 只呈现——候选
另立构造器与发明 target/revision 均弃，如实申报理由）；⑥实现＝契约面三处＋路
由＋端口三臂＋纯模型＋保存链 hook＋弹窗＋入口接线；⑦四表 43 新键＋设计标准
0.7.18 双语＋REGISTRY；⑧测试 vitest 14 新钉＋contracts 1 钉＋冒烟 26 新钉（含
两处修钉如实注记：React 受控输入原生 setter、D5 再存新身份修订回 1）＋全量验
证（contracts tsc 0＋89/89；desktop typecheck 双 0＋vitest 96 文件 890/890＝
876＋14＋build 0＋boundary〔一处越界当场修复〕/i18n/contrast/leak 155 指纹/
forest-leak 全过＋smoke 97/97，df 先查 551G/71%）；⑨本状态批（含 B 面四环闭环
申报）；⑩诚实边界维持：零端到端宣称——全部证据系代码面＋真 Chromium DOM 合成
网关，真机全链归 W25（O-2）；[需用户] 条目照规则跳过未代决；VUA-7/VUA-8 全程
零触碰。在手无半途切片、除本状态批外无未提交改动。完成后推送并退出待命，候
集成验收本拍两笔。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍两笔，写明「wt-3 第 166 批提案 029 B 面
  环 4 桌面消费（导出入口＋草稿六事实键确认流＋转正保存链，基线 2bd60a4a）」**
  ——实现批恰 26 文件（desktop 面请定向复跑 desktop check 链＋
  smoke:production-review 97/97；contracts 面请复跑 contracts check 89/89）＋本
  状态批。重点 diff 复核面见「下次合并意图」①–⑦。
- [→核心/wt-2]（对表知会）：B 面环 4 消费面已落——零词表扩展、零 crates 触碰；
  转正文档＝compose 保存形状之上 verbatim 转入 environment.unityVersionConstraint
  与 dependencies 声明集（无 locked 块、无 target/revision 发明），resolve 侧对
  该两维的消费语义候你席对表；exportProjectDraft 路由缺席臂桌面侧已按冻结三元
  原样透传。
- [→操作者] 第 166 批办理完毕：**029 B 面环 4 桌面消费交付，B 面四环（冻结→接线
  →实现→消费）闭环，029 桌面侧无在途**——A 面六卡＋B 面消费面全线有面；云端
  素材选择段维持未决项 3＝#46 诚实缺席（候 030 冻结/U18 联动裁决）；真机全链归
  W25（O-2）。
- （回执不回执：wt-7/wt-8 知会消化（R4–R6 已在 main，与本拍零交叉）；在途事项
  以 BOARD 与本状态文件当前焦点为准。）
