# BOARD — VUA 全局看板

维护方：集成树（wt-main）。更新时机：每个 M 门关闭或合并完成后（见 collab/README.md）。
本文件只反映"现在"；历史在 git。

最近更新：2026-09-13 5:0x–5:2x（工作时段）集成 **第十一批验收——v3 生产作业面迁移切片＋桌面 U10 设置面切片两实质批＋三树状态批（collab-only）**：**产线 slot/wt-4 = 68d72ad＋bfb5fd0**（实质批，5 文件全产线域：crates/unity-bridge/src/production_job.rs＋com.ph-r.vua 三件——Rust 发射面 v2→3 经 `PRODUCTION_FACE_SCHEMA_VERSION` 常量〔信封＋JSON 组装双面〕、收据 `parse` 接受集 {2,3} 集合外类型化拒绝并指名接受集、`data.instanceGlobalObjectId` 入类型投影〔011 成功判据 provider 读取面补齐，冻结 v3 向量 consumption 测试钉死〕、组装文档对冻结 v3 command.schema.json jsonschema 校验测试、C# 收据 `schemaVersion = command.schemaVersion` 回显三处硬编码 2 消除＋BridgeProtocol 注记迁移态；EditMode 版本回显测试落地未运行验证如实申报〔本环境无 Unity Editor〕，真机归 W25；契约面/schemas/TS 零触碰；**unity-bridge v3 生产作业面迁移就此完成，016 漂移声明消解为 v2 过渡窗口**）；**桌面 slot/wt-3 = d974429＋88740a4**（实质批：environment.verifyEditor 词表行 TS 面七点裁决逐字〔params 单字段闭集 verbatim 无 maxLength／两态 tagged union／五码闭集＋运行时数组／ENVIRONMENT_VERIFY_UNAVAILABLE 缺席码常量〕＋收敛点 1 信封形态修正〔{schemaVersion "0.1", operation, result}——editors 恒 '—' 缺陷消除，零协议变更〕＋壳链路〔router verbatim 透传＋双态浏览＋editor-settings.json 门③机器留痕形状守卫＋VUA_UNITY_EDITOR 仅确认留痕在位才注入〕＋「环境与路径」页四语〔拒绝码 i18n 映射＋词表外码原词呈现＋诚实空态＋重启生效如实标注〕＋mock DEV verifyEditor 分支〔缺席绝不冒充拒绝〕）；**越域配套集成追认**：packages/orchestrator-provider 恰 2 文件（mock-provider.ts/.test.ts，wt-3 状态文件「三文件」系计数偏差已如实指出）——wt-2 核心域主核可表态（ab2a816）计为域意见，范围与 wt-2 既有指派「DEV 模拟面 verifyEditor 分支归桌面 U10 设置面切片随批办理」一致，生产面零触碰、DEV 门 leak 扫描把守；**三 collab-only 状态批**：wt-2 ab2a816（核心消化＋域主核可表态）＋wt-5 142db42（bdl-commands v0.4 候办独立核实三件证据后归档撤回，对账闭合）＋wt-6 fbf0c4a（环境消化，021 收尾互认）。**集成复跑证据（本机，合并后 pipefail 严格退出码）**：cargo test --workspace **587/0/27 EXIT=0**（584＋3 新增，与产线声称逐字一致）＋clippy --workspace --all-targets -D warnings **EXIT=0**＋contracts **56/56**＋desktop **541/541**＋orchestrator-provider **25/25**＋desktop check 全链 **EXIT=0**（typecheck＋build＋boundary＋i18n＋contrast＋**check:leak 155 指纹零泄漏**）＋registry-only **exit 0**（57 项一致＋1192 文件 0 冲突标记）。**零端到端宣称维持**：provider→真机 Unity v3 生产链路未实跑、C# EditMode 未运行验证、U10 设置面真机走查归 W25。
前录 2026-09-13 4:2x–4:5x（工作时段）集成 **第十批验收——021 冻结批收官＋四树状态批（collab 为主）**：**7dd25a3**＝slot/wt-6 环境 **editor-verify v0.1 冻结批**（c7cf9f4：协议本双语〔首节＝裁决⑥行名/族名映射防歧义；冻结收口五项逐节；桌面 TS 面＋设置面候 U10 切片、完成前不称端到端、真机走查归 W25〕＋REGISTRY 两行〔55→57〕＋方法 schema description DRAFT→FROZEN 改写〔机器面零变化，diff 仅 description 一行〕＋021 内联回执节）＋状态批 0248497；**集成域跟随：SCHEMA_EXEMPT 移除 'editor-verify' 行**（dffb1e3 先例，注释同步留痕；移除后 registry-only exit 0 实证＝REGISTRY 登记行 mentioned 命中兜住反向盲区，零红窗）——**021 时序就此收尾**（裁决→草案→路由批→冻结批四环全闭环）。**7f90c6c**＝slot/wt-5 数据状态批 08972c7（＋c8bb3f7 合并瞬间追加追平状态批随尖带入）；**ef82763 批**＝slot/wt-2 核心 **v3 生产作业面迁移排期留言交付（产线开工锚生效）**＋bdl-commands v0.4 候办对账登记；**99c7149 批**＝slot/wt-4 产线状态批；wt-3 尖 9608534 纯追平零自有内容不合并（第 13 代门先例）。**bdl-commands v0.4 契约表注记对账更正（集成办理）**：核心申报「wire 路由待核心」注记系登记滞后——集成独立核实成立：路由臂 provider_host.rs `warehouse.importDownloads` 在位＋验收 b4c78aa（09-10）原文「v0.4 six-command closed set fully wired」＋contracts TS 面（desktop-gateway 词表行/映射/守卫/测试）在位，注记已按实更正（接线翼完成；零端到端宣称维持，真机走查归 W25）。集成侧复跑证据：**cargo workspace 584/0/27 EXIT=0（零 .rs 变更，与路由批世代逐字一致）＋clippy --workspace --all-targets -D warnings EXIT=0＋双载体 editor_verify_wire 8/8＋8/8＋registry-only exit 0（57 项一致＋1186 文件 0 标记）**。**时序推进**：桌面 U10 设置面切片开工条件三齐（裁决＋草案件＋路由批＋冻结批均入 main）；产线 v3 开工锚已到（候产线下轮 tick 领取）；核心 v3 接缝预告在案（provider-host job.execute 面，产线动工时写明变更面）。
前录 2026-09-13 4:1x–4:3x（工作时段）集成 **第九批验收——核心 editor_verify 路由批＋并发会话互补增量（021 收尾②兑现）**：**a6585c2**＝slot/wt-2 八提交 --no-ff 入库——**deafe11 路由批**（environment.verifyEditor 落 provider-host 兜底 match＋EDITOR_VERIFY_SCHEMA_VERSION="0.1" 自有常量＋钉子一拒绝走 ok:true 内态经真实系统接线钉死＋钉子二 detail 逐字＋params 单键闭集无 maxLength 六违反全 validation 信封＋ENVIRONMENT_VERIFY_UNAVAILABLE 保留缺席码如实登记「今日无缺席路径」＋capability 行 available＋EditorPathVerifier 注入点）＋**bbb6206 收编**（并发核心会话 pub 化改动，双登记零静默吸收，派发竞态闭合＝互补非重复已核验）＋**373470c 加固**（平台如实拒绝断言＋常量锚定＋能力行测试，editor_verify_wire 终态 8/8）＋三状态批＋两追平；**workflow 越域配套集成追认**：schema-vectors vua-provider-host 步追加 --test editor_verify_wire＋DRAFT 漂移防护注释（工作流自身权威清单规则，016/38af48c 先例；main 侧 project-manager 步已载环境侧同名测试，零重叠）。r1 diff 全文核（零越域：crates/provider-host 6 文件＋workflow 1 文件，零 TS/桌面/数据/产线/环境域文件；is_mutating 零触碰；路由零自有验证逻辑）；r3 合并后本机独立复跑 **cargo workspace 584/0/27 EXIT=0（与核心声称逐字一致）＋clippy --workspace --all-targets -D warnings EXIT=0＋editor_verify_wire 8/8＋registry-only exit 0（55 项＋1184 文件 0 标记）**（TS 域零涉免跑如实声明；簿记 b3302d5 世代 BOARD/wt-main 保留 main 侧零回退，rev-list 归零）。**021 时序推进**：路由批验收→环境冻结批（wt-6 开工条件达成）→桌面 U10 设置面切片（wt-3 开工条件达成）→产线 v3 排期锚（核心排期留言即开工锚）。零端到端宣称维持（真机走查候 W25）。
前录 2026-09-13 3:5x（工作时段）集成 **第八批验收——三树消化状态批（collab-only）**：**dcee479/cc10c6e/a84aad6**＝slot/wt-3 桌面 553a78a／slot/wt-4 产线 3786d64／slot/wt-5 数据 2d8f4b5 三状态批（各＋追平）--no-ff 入库——桌面 U10 等待项收敛为核心路由批（裁决＋草案件双入 main，开工条件就绪，不抢跑）、产线 v3 迁移排期锚定消化（候核心路由批验收后的核心排期留言，v2 路径继续生效）、数据在途清零闭环；**wt-2 尖 644e0bf 纯追平无自有内容不合并**（第 13 代门先例，下轮追平自然对齐）。三树 diff 均仅各自状态单文件，registry-only exit 0（55 项＋1183 文件 0 标记），rev-list 归零。
前录 2026-09-13 3:2x–3:4x（工作时段）集成 **第七批验收——021 词表行裁决＋环境 editor-verify v0.1 草案冻结件**：**6cc4594**＝slot/wt-2 核心 **021 词表行七点裁决**（行名 environment.verifyEditor／query／params 闭集无 maxLength／两态＋三实现钉子／缺席码仅路由未接线／向量正 3 负 3／时序加速＝环境草案先行＋核心路由批候草案件即开工）＋**71c65d4**＝slot/wt-6 环境 **草案冻结件**（schemas/editor-verify/v0.1 DRAFT＋向量正 3 负 3＋editor_verify_wire 消费测试 8 项＋workflow 行；SCHEMA_EXEMPT 'editor-verify' 行集成追认〔0b8bebb 先例〕，冻结批验收时由集成移除；021 同文件冲突按落款时序解决，RULING/RECEIPT-IDENTICAL 机器核验在案）＋三树状态批 e2de00e/44d214f/66cf467；集成侧四件证据（registry-only＋editor_verify_wire 8/8＋project-manager 14 套件＋clippy 0）全绿对表；第 21 代门 CI 三绿（collab-registry 34714207493＋schema-vectors 34714207469〔editor_verify_wire 步骤首跑〕＋rust 34714207492，be068e9 回填）。
前录 2026-09-13 2:5x–3:1x（工作时段）集成 **第六批验收——各树消化批二代＋冲突标记守卫落地**：wt-5 数据（687ef53＋b7bd237 二代消化）／wt-4 产线（a9484d5）／wt-3 桌面（e6bccb2）／wt-2 核心（cc96018）／wt-6 环境（86e39c5）五支状态批验收合并；**e837628 集成域守卫**＝collab-brief 新增【⑤ 冲突标记】全树扫描（7918790 世代 REGISTRY 残留标记缺陷如实通报后防再发）；REGISTRY 残留标记随 687ef53 清除；第 20 代门 CI 回读随 ff80fdd 入库。
前录 2026-09-13 2:4x（工作时段）集成 **第五批验收——inspection-queries v0.1 冻结：M7 检查链契约面全闭环**：**7918790**＝slot/wt-5 数据 **f84b397 冻结批（get/list/requestRun 三方法一次冻结）**——schema description DRAFT→FROZEN 声明变更形状零变更逐行核＋追认落 016 内联（61bd798 诚实注记正式闭合）＋协议本双语＋REGISTRY 两行＋acquisition 测试头对齐；016/REGISTRY 两处同位置冲突按落账时序解决（产线冻结收口 2:0x／数据追认收口 2:2x 两节保留；unity-bridge-v3 行与 inspection-queries 两行并存）。**集成域跟随：SCHEMA_EXEMPT 移除 'inspection-queries' 行（022 同构反操作收官），registry-only exit 0 零报警实证**。**r3：cargo 568/0/27 EXIT=0（零测试数变化＝形状零变更实证）＋clippy 0**（TS 域零涉免跑如实声明）。**M7 检查链契约面全部冻结**：inspection-evidence v0.1＋inspection-queries v0.1＋unity-bridge v3＋recipe 套件 v0.3；桌面检查页已接 live 读面（生产构建诚实空态候数据供给）；requestRun wire 已 live；真机走查归 W25 零端到端宣称。
前录 2026-09-13 2:3x（工作时段）集成 **第四批验收——M7 冻结里程碑＋U10 核心切片＋桌面检查页消费**：①**a5d062d**＝slot/wt-4 产线 **双冻结批（75f9d15 inspection-evidence v0.1＋4bc0257 unity-bridge v3）**——016 §7 五件收口＋三树表态收口登记：schema 声明变更**形状零变更逐行核实**；协议本双语×2＋REGISTRY 两行（_ZH 承载惯例）＋契约表升版；生产作业面不迁移 v3、v2 生产路径继续生效；**集成域跟随：SCHEMA_EXEMPT 移除 'inspection-evidence' 行（'inspection-queries' 保留候数据冻结批），registry-only exit 0 实证**＋②**f3d8195**＝slot/wt-2 核心 **0cb0d05 U10 实施切片**（组装面编辑器选择照 021 仲裁分层：显式注入＞自动选择＞无；自动选择仅呈现＋预检，过渡期执行诚实 unavailable 不抢跑门③；cargo 568/0/27＝557＋11 新逐字一致）＋③**33988a6**＝slot/wt-3 桌面 **5a87574 inspection 读面消费切片**（get/list 词表行登记；**requestRun 悬空面不登记**＝016 核心表态③同构；表现模型 official_sdk_rating 保留值纪律；InspectionPage 三区诚实状态；contracts 50/50＋desktop 529/529＋leak 155 零泄漏逐字一致）＋④⑤wt-5/wt-6 状态批。**r3**：cargo 568/0/27＋clippy 0＋contracts 50＋provider 23＋desktop 全链 529/529＋registry-only 0。**M7 检查链契约面全部冻结**（inspection-evidence v0.1＋unity-bridge v3＋recipe 套件 v0.3），桌面检查页接 live 读面（生产构建诚实空态候数据供给）；数据冻结批解锁条件全齐（候追认）。
前录 2026-09-13 2:1x（工作时段）集成 **同轮三批验收——016 三树收口完成＋v3 冻结批解锁＋requestRun 修订闭环**：**第一批五笔（实质）**（7a262b8 核心 M7 检查切片＋af87747 桌面 overlay 接线＋三状态批；r3 全量 557/0/27＋clippy 0＋contracts 48＋provider 23＋desktop 513＋leak 155 零泄漏；第 15 代门 CI 四绿）＋**第二批五支（collab-only 免全量）**（wt-2 收尾批＋**wt-3 收口批＝016 §7 桌面知悉落账〔三树表态收口完成，cb066e1〕＋021 editor_verify wire 词表行提案起草〔environment.verifyEditor，候核心裁决〕**＋wt-4 状态批＋**wt-5 预审批＝数据对核心 requestRun 修订请求**＋wt-6 状态批）＋**第三批＝核心修订批 c914cf2 验收合并（61bd798，实质）**——数据 016 内联修订请求一处不差兑现：词表行自有常量 INSPECTION_QUERIES_SCHEMA_VERSION="0.1" 统一三处回执＋schema/example 同批 0.4→0.1＋avatarRef.ref 去 maxLength 512（诚实注记：超出字面预授权但在数据同节明确建议范围，追认候数据下轮批）；r1 恰四处零越界＋r3 cargo 557/0/27＋clippy 0＋registry-only 0。**M7 链推进**：①产线 v3 冻结批解锁（1a9cdf6 四件）；②数据词表行冻结批解锁（候追认＋冻结批：REGISTRY＋协议本＋SCHEMA_EXEMPT 移除）。016 冲突按落款时序解决（数据 1:2x 前、桌面 1:4x 后两节保留）。全树 rev-list 归零。
前录 2026-09-13 1:4x（工作时段）集成 **五笔验收合并——核心 M7 检查切片落地＋桌面 overlay 接线兑现**：
①**7a262b8**＝slot/wt-2 核心 **e3ce569 M7 检查切片实现批（016 硬前置②）＋61485d3 状态批**——四件同批：UnityOperation
三新只读变体（不入 is_mutating 预声明兑现，闭式列举 diff 零触碰核实）＋InspectionEvidenceStore 第五文档库（append-only
/exactly-once/身份寻址/诚实空态/不进 BDL＋转抄不解释＋dry_run 强制＋路径不上线）＋任务化 inspection.requestRun（零收据
＝类型化失败不发布；未接线 vua.inspection.unavailable 诚实缺席）＋读路由 get/list 照数据草案逐字；TS 面核心登记
（contracts 联合增长＋5 消费测试＋mock inspection 诚实分支）；requestRun 草案 schema 与数据 get/list 同目录零冲突（DRAFT
不冻结不登记，022 豁免已先行零带红窗口）＋②**af87747**＝slot/wt-3 桌面 **b46ae12 overlay wire 消费接线批＋两状态批**
——017 表态兑现切片完整：两态判别不伪装空快照＋按需轮询不常驻＋取消走既有 task.requestCancellation 同九态纪律＋
open_on_desktop 诚实 rejected＋i18n 死键清除＋③④⑤**8398289/50689f8/c659646**＝wt-4/5/6 三状态批（collab-only 免全
量）。**零冲突五支（merge-tree 预检全 0），合并后五树 rev-list 归零**。**验收证据**：r1 两实现批 diff 全文核（域纪律：
wt-2 核心域＋contracts TS 面核心登记先例＋数据草案目录新文件零跨域；wt-3 桌面域＋desktop-gateway 登记域；is_mutating
闭式零触碰；诚实缺席/DRAFT 纪律逐项在位）；r2 wt-3 增量机械核验（零新色值/零新 CSS 变量/新增中文全在注释与 i18n 值）；
r3 合并后本机独立复跑（pipefail 真实退出码）**cargo workspace 557/0/27 EXIT=0（534 基线＋23：核心侧 13＋帧环 10——簿
记更正：核心声称 22 系把 13 计 12，覆盖面一致无缺失）＋clippy -D warnings 0＋contracts 48/48（42＋5＋1 与两树声称吻合）
＋orchestrator-provider 23/23（tsc 零错）＋desktop check 全链 EXIT=0（513/513＋leak 155 零泄漏）＋registry-only exit 0**。
**M7 链更新**：**硬前置②落地并验收——016 §7 冻结硬前置②③成立，数据词表行冻结批解锁（照 BG-4 办理）**；桌面 M7
Inspection 页面消费候件到齐；**016 桌面知悉落账缺口维持**（核实 wt-3 四提交零触及 016 文件），落账后产线走 v3 冻结批。
前录 2026-09-13 1:1x（工作时段）集成 **六笔验收合并＋021 仲裁定形＋022 豁免落地＋CI ts 红修复入库**：
①**8d31e67**＝slot/wt-2 核心 **cbce401 双表态批**（016 三问表态：三新操作形状核可＋is_mutating 预声明＋
时序四件随核心 M7 切片锚＝产线批验收〔已达成〕＋UnityOperation/UnityPayload 跟批确认；021 四问表态：专用
face＋注入方向核可＋门③硬边界候裁＋持久化归桌面壳设置）＋②**122d037**＝slot/wt-4 产线 **dcadf16/ee364d8
v3 冻结边界声明批**（选「声明边界」而非补登记：v3＝提案候审未宣告冻结，登记面维持 v2 无漂移，冻结批候
三树表态收口照 1a9cdf6 清单，候冻结期 provider 生产面不迁移 v3）＋③**a467a5f**＝slot/wt-6 环境 **03acaff
021 收口批**（七点三方收敛＋两点候决＋BOARD #23 同步）＋④**7b84700**＝slot/wt-3 桌面 **6cc11dc 状态批
（021 桌面六点表态）＋73f8e7a CI ts 红修复批（实质）**——mock-provider 补 overlay.getSnapshot 分支＝诚实
vua.overlay.unavailable（020 先例 fixture 诚实形态）＋electron-gateway task.list 收据双键分派（revision
＋tasks，类型收窄不放宽；provider_host.rs:918 键面集成核实）＋⑤**f209182**＝slot/wt-5 数据 **2e3db58
inspection-queries v0.1 词表行草案实现批＋d438ca2/23fadb9 proposal 022＋BOARD #24**（get/list 照 record
先例；身份 pattern 与 evidence 本体逐字同构测试钉死；get 双验证；list 闭面身份行不内联；6 向量＋消费测试
6/6＋程序化负例；草案态不冻结不登记照 BG-4）。**两处同位置冲突按两树合并提示解决（两节/三节全文保留按
落账时序）**：016＝产线提案节→核心表态节（0:0x）→产线边界声明节（0:2x）→数据表态节（0:2x）；021＝核心
表态节（0:0x）→环境收口节（0:3x）。**集成落地两项**：**021 仲裁定形（内联节＋状态=已接受＋BOARD #23 更新）**
——门③张力采纳核心推荐语义分层定形：「直接激活」＝选择层（解析＋呈现＋落定），「首次实际使用前一次确认」
＝执行放行层，自动选择不越过首次确认；确认按选择计一次不按执行次数计，留痕后静默直用与 ADR 文义相容，
选择变更重新起算；信任呈现＋确认 UI＋留痕归桌面设置面；来源字段增量照准「候选搁置维持 v0.1」（桌面闭集
三态记将来升版参考）。**022 照准落地（SCHEMA_EXEMPT 增 'inspection-queries' 一行＋同构注释，集成域
BG-8 0b8bebb 先例；状态=已接受＋内联回执＋BOARD #24 关闭）**——随实现批同轮推送零 collab-registry 带红
窗口。**验收证据**：r1＝两实质批（73f8e7a 两桌面域文件／2e3db58 数据域 schema 9 件＋acquisition 测试
242 行）diff 全文核（零跨域、闭集纪律、双验证钉死、不内联断言）；r3＝合并后本机独立复跑 **cargo
workspace 534 通过/0 失败/27 忽略（＝528 基线＋inspection_queries_contract 6，pipefail 真实退出码
EXIT=0）＋clippy --workspace --all-targets -D warnings EXIT=0＋pnpm 递归全链（验收清单增补项首次适用）：
@vua/orchestrator-provider check 23/23 EXIT=0＋@vua/desktop check 全链 EXIT=0（check-leak 159 零泄漏）**
——上轮 CI ts 红（34704078791）根因修复本机全链实证恢复，CI 回读候推送后回填；registry-only **51/51
exit 0**（022 豁免生效，brief ④ 反向检测零报警）。**六树领先全部归零**。
前录 2026-09-13 0:5x（工作时段）集成 **五笔验收合并——overlay wire 批 1 冻结入库＋U10 环境半边原语＋M7 锚点 Bridge v3 落地**：
①**1d3509b**＝slot/wt-2 核心 **713329f overlay wire 面批 1 验收合并并冻结**（017 批 1：`overlay.getSnapshot`
按需轮询＋production_card 纯函数投影＋诚实 unavailable＋schema 六向量＋TS 面 42/42＋协议双语＋REGISTRY）；
②**33c4912**＝slot/wt-6 环境 **3eef4e4 editor_verify v0.1＋proposal 021＋BOARD #23**（U10 环境半边，门①②
事实原语，无 wire 面）；③**7d63abe**＝slot/wt-4 产线 **c33adb3 M7 锚点实现切片 Bridge v3**（v2 冻结超集
同面升版：三只读检查操作 dryRun 强制＋类型化诊断不冒充官方评级＋011 漂移合法化声明＋dependencies 单层
裁决行使＋inspection-evidence 草案态维持；**C# EditMode 已落地未运行验证如实申报，真机归 W25，零端到端
宣称**）；④**c6284f4**/⑤**3881cfa**＝wt-5/wt-6 collab-only 状态批（免测）。**无合并动作两项（如实）**：
slot/wt-2（c17ffe6）／slot/wt-3（cb31dfe）纯追平零自有内容。**验收证据**：r1 三实现批 diff 全文核（域
纪律/冻结件零触碰/诚实边界逐项）；r2 全增量机械核验（零色值/零 CSS；代码区新增中文仅 Bridge C# 诊断消息
照 v1/v2 既有惯例）；r3 合并后本机独立复跑两轮 pipefail 严格退出码：**cargo workspace 522/0/27（＋环境 9）
→528/0/27（＋bridge_v3_vectors 6）＋clippy -D warnings 0＋contracts 42/42**，与各树声称逐字一致。
**M7 链状态**：**硬前置①（Bridge 五维产出操作）落地并验收**——核心冻结解除候办（016 仲裁第 5 点）；数据
inspection-queries v0.1 到序可领；桌面消费接线候追平（其追平尖 cb31dfe 不含 1d3509b，接线前须再追平）。
**登记尾随项 [→产线]**：REGISTRY unity-bridge 行仍为 v2、协议本无 v3 节——v3 冻结登记请随下批补齐或声明
冻结边界。前录 2026-09-13 0:1x（工作时段）集成 **overlay 置顶窗先行切片验收合并＋数据状态批合并**：
①**d706beb**＝slot/wt-3 桌面 **12b5592 overlay 置顶窗先行切片验收合并**（017 §4 桌面表态落地，
M7 桌面行「桌面 Overlay 收尾」域内先行部分）——窗口创建/置顶/显隐（决策面纯函数＋5 新测试，
F7a spike 形态参数钉死）＋正式入口（i18n 四语）＋contracts TS 面 additive（窗口族动作**非 wire
方法词表**，017「wire 词表不预接」维持）＋desktop 架构双语 1.2.0＋REGISTRY 同步；**合并瞬间追
加状态批 d2b063e 随合并尖带入无遗漏**（rev-list 归零核实，4d346f8 先例同构）。验收证据：r1 diff
全文核（零 Rust/零 schemas，assertLocalSender 在位，主窗口关闭＝退出语义不变）＋r3 合并后独立
复跑 **desktop check 全链 EXIT=0＋vitest 63 文件/505 测试（500 基线＋5 新增）＋contracts 38/38
＋registry 51/51** 与桌面声称逐字一致；Rust 零涉免跑；真机走查留 W25 无端到端宣称。②
**8aabf6d**＝slot/wt-5 数据状态批（collab-only 免测）。**无合并动作三项（如实）**：wt-2/wt-4/
wt-6 领先各 1 均纯追平、树内容零差异。推送门 r1/r2/r3 增量聚焦法完成（r2：零色值/零 CSS/零
forest/中文全在注释与 i18n 值内）。**在途**：核心 overlay wire 批 1（桌面消费半边候件）／产线
M7 锚点实现切片／数据候 Bridge 五维／环境候 ADR 指派。前录 2026-09-12 23:0x（工作时段开轮）
集成 **两状态批验收合并＋U10 裁决入库知悉**：
①**7cfb796**＝slot/wt-3 状态批（bc2dbec，仅状态文件）——两条回执消化＋追平 89e53cf＋
overlay 桌面域内先行切片排期维持 23:00 开工；②**fb3c796**＝slot/wt-4 状态批（36d7d7f，
仅状态文件）——**锚点领取批入库闭环确认**（2389127/4d346f8 经 b01246e＋16592e8 已核实
为 origin/main 祖先）＋两条留言消化。两批 --no-ff 零冲突，全 collab-only 免全量（合并前
diff --name-only 逐支核实＋merge-tree 预检零冲突）。**无合并动作三项（如实）**：slot/wt-2
领先 0（08e17d0 已随并发会话 e8e091e 入 main）、slot/wt-5 领先 0（44cf3fa 已随 07782a5）、
slot/wt-6 领先 0（03e9176 已随 3126132）——三树留言均为已完成批回执请求。**U10 裁决
入库知悉（操作者批，非集成动作）**：698e738（ADR path-configuration 双语落账）＋11745df
（裁决登记＋通知路由环境/桌面/核心＋实现切片 23:00 开工）已在 main；**[需用户] 收敛＝
仅 W25/O-2 与 U5 暂缓**。推送 `11745df..fb3c796`（collab-only），CI 回读零触发（最新 run
仍为操作者批 collab-registry 34678057937 绿）。**在途**：三树 23:00 实现切片互不阻塞
（核心 overlay wire 批 1／桌面 overlay 域内先行切片／产线 M7 锚点实现切片）＋数据候产线
Bridge 五维落地＋环境待命。前录 2026-09-12 操作者批（**ADR 落账：Unity 编辑器与路径类配置形态**
〔`docs/decisions/path-configuration_ZH.md` 双语〕——默认零配置＋补救式手选＋三道验证
（身份/版本/信任呈现）＋「环境与路径」统一设置节＋路径类六条通用规则；实施切片验收
标准五条在文档内）。前录 2026-09-12 08:3x（收尾时段）集成 **三状态批验收合并＋M7 检查链
产线锚点激活**：①**909b132**＝slot/wt-3 状态批（overlay 桌面域内先行
切片领取——窗口创建/置顶/显隐＋正式入口形态，wire 词表不预接，23:00
开工）；②**b01246e**＝slot/wt-4 **016 内联产线锚点领取表态＋状态批**
——产线领取 M7 检查切片锚点（016 §7 硬前置① Bridge 五维产出操作；领取
即语义权威〔016 仲裁第 5 点〕，**核心冻结仍以 Bridge 五维落地并验收为
准，领取≠冻结**）；合并瞬间 wt-4 追加提交 4d346f8 已随合并尖带入无遗漏
（如实登记）；③**3126132**＝slot/wt-6 状态批（追平＋#22 闭环确认＋B4
落地核实）。三批 --no-ff 零冲突，全 collab-only 免全量。**无合并动作
（如实）**：slot/wt-2 f1ca4cd 树内容与 main 零差异（017 表态已随
d1b29c7 入 main）；slot/wt-5 领先 0（a1a40ac 上轮已合并）。〔并发更正〕
该两项系 08:31 检查时点裁定；其后 wt-2 新批 08e17d0／wt-5 新批 44cf3fa
已由**并发集成会话**随 e8e091e／07782a5 合并入 main（均 collab-only 单
状态文件，零覆盖冲突已核实，对方已推 origin）——两树最终以该两合并为准。
**M7 现状**：
产线锚点／核心 overlay wire 批 1／桌面域内先行切片三树今晚 23:00 各自
开工互不阻塞；M7 读面（inspection-queries）候产线 Bridge 五维落地。
前录 2026-09-12 集成 **三批验收合并（#22 遗留 L 级观察关闭＋M7 overlay
wire 批 1 激活）**：①**d97ae9f**＝slot/wt-3 桌面 **9e2082f L 级观察随手批
验收合并**——project-ops-port isTaskSnapshot 补 `contractVersion ===
APPLICATION_CONTRACT_VERSION` 必需键（缺失/异版＝不可信快照→既有诚实
unavailable 形态不齐路径）；回归 1 例 2 断言（undefined＋"9.9" 均拒）；
**验收证据**：合并前 diff 审（与 #22 验收 L 级观察逐字对应；范围纪律＝仅
桌面域 2 文件、零 contracts/Rust；live-production-port 未点名不擅动核可）
＋合并后独立复跑 **vitest 62 文件/500 测试（499 基线＋1 新增）EXIT=0＋
typecheck EXIT=0** 与桌面声称逐字一致；build/boundary/i18n/contrast/leak
零涉如实声明。**#22 验收遗留 L 级观察就此关闭。**②**d1b29c7**＝slot/wt-2
状态批＋**proposal 017 核心表态**（collab-only 免测）——核心**领取 M7
overlay wire 面批 1**（下一工作时段开工；勘误上轮「批 2 等桌面消费」表述
——批 2 维持等消费不变、批 1 自领，桌面不再等，互等僵局解除）；**登记偏差
如实声明**：该批合并意图称「仅状态文件」实含 017 内联表态（均 collab/ 内，
实质 0 成立）。③**a1a40ac**＝slot/wt-5 状态批（collab-only 免测）。
前录 2026-09-12 集成 **#22 链闭合批（两验收合并）**：
①**b4dbba0**＝slot/wt-3 桌面 **#22 消费批 867ccda 验收合并**——importCopy
消费改任务化（受理回执 narrowTaskAccepted→终态快照等待〔首取覆盖内联完成
＋task.completed 事件驱动重取，事件是通知快照是权威〕→Done payload result
按操作词表窄化，ProjectOpsOutcome 形状零改动，UI 零改动）；fixture
importCopy 恒诚实不可用（020 授权桌面自决，setNote 先例——live/fixture
双形状温床消除，#22 教训验清单项「live/fixture value 形状一致性」首批
适用并闭合）；13 例新测试。**验收证据**：合并前 diff 审（live 键面与
provider_host.rs Done payload {schemaVersion,operation,result}＋
TaskSnapshotV01 冻结面逐键对齐；诚实 unavailable 映射完备：超时/断连/
形态不齐/非成功终态/result 缺席）；合并后本机独立复跑**桌面 check 全链
EXIT=0（typecheck＋build＋boundary＋i18n＋contrast＋leak 159 零命中）＋
vitest 单独 pipefail 复跑 62 文件/499 测试（486 基线＋13 新增）EXIT=0＋
contracts check EXIT=0**，与桌面声称逐字一致；Rust 域零涉（增量无
crates/schemas 文件）免跑如实声明。**L 级观察（不阻断）**：端口内
isTaskSnapshot 收窄未检 contractVersion 必需键（上层信封守卫已验
schemaVersion，诚实性无虞）——桌面随手批可补齐。**#22 链全环闭合**
（裁决→核心提案冻结 0866908→核心填充→桌面消费本批），#22 行关闭；
不宣称端到端（live 走查归 W25 用户延期窗口）。②（前置合并）slot/wt-2
状态批＋追平批（collab-only 免测，失鲜清偿）。
前录 2026-09-12 集成 **project-ops v0.2 升版批＋桌面 P2 批验收（四合并）**：
①**10c0d68**＝slot/wt-2 核心 **project-ops v0.2 增量冻结**验收合并——
`project.setNote` 写命令（D-6 桌面确认裁定 A 兑现，013 内联线程）＋
`projectId→projectPath` 定形修正（同族标识同形）＋守卫闭集三码扩充
（project_not_found／not_vua_native／identity_unreadable，十码闭集冻结）＋
kind=note 投影与 vuaIdentity present 同构＋协议本双语＋REGISTRY 升版；
**验收证据**：合并前基线 67/497/0＋合并后 **67 套件/501 通过/0 失败＋
clippy -D warnings 零告警**（隔离 CARGO_TARGET_DIR，多轮一致）。②
**alcom-vcc 1.2.0**（环境 B5(1) 来源判定原理正式答复，368c277）随 wt-6
状态批**并发带入**——合并信息误写「collab-only」**登记偏差如实声明**
（message 已不可改；交付本身验收核可：环境域内文档切片、双语镜像、
REGISTRY 1.1.0→1.2.0、B5(2) 文案正确留桌面、诚实边界声明「VUA 不能断言
真实出处」核可）。③slot/wt-3 桌面 **P2 批**验收合并——release 页消费
build-record v0.3 读面（2ff721c：收窄纪律＝必需字段/词表外整条拒绝、
planDeviations 缺席＝0、evidenceSummary 缺席＝null 计数明示；三诚实态
failed≠empty；recovered 徽标 W24 先例；证据引用仅计数＋016 草案注记；
**验收证据：桌面 check 全链 EXIT=0，vitest 61 文件/483 测试全绿**，与桌面
声称逐字一致）＋P0/P1/P4 对账核可（**P5 集成逐切片验收就此办理**：夜间
任务二桌面四行全闭环）。④三状态批（wt-4/wt-5/wt-6，collab-only 免测）。
**随批簿记**：project-ops v0.1 协议本双语头部状态对齐（已取代（→ v0.2），
升版批簿记缺口由集成补齐，registry 49/49 exit 0）；**N-3/N-4 路由更正**
（桌面请求核实成立：两处均在核心域 crates/——ipc_002 测试在
crates/orchestrator/tests/、尾随逗号在 crates/provider-host/tests/
environment_snapshot_wire.rs；原「归桌面顺手批」路由错误，更正→核心）。
**桌面接线批解锁**（project-ops v0.2 冻结＋路由就绪，D-6 时序条款满足）。
前录 2026-09-12 集成 **#7 瞬败修复验收批**（数据 cd3eead 交付、集成验收
合并 d78c43b——根因实证＋红绿证据闭环＋回归压力测试钉死；开放问题 #7 本例
关闭；附带簿记更正：r3d「日志归档」实为 *.log gitignore 排除未入库）。前录
2026-09-12 集成 BG-21 批（**登记表校验器畸形行静默跳过修复交付**
b86a3db——表格行结构校验（列数/必填格）＋验证矩阵五步留证；BG-21 销账；CI
`--registry-only` 入口同步受益）。前录 2026-09-12 凌晨（CI 三绿：rust
34638793810 ＋schema-vectors 34638793850＋ts 全绿，BG-18/BG-19 销账；桌面批
c973048 验收合并；U10 Unity 编辑器路径配置面立项升级待用户裁决；BG-16 核销）。
前录 2026-09-11 操作者批（**今夜任务分配文档落盘**：
`collab/assignments/2026-09-11-night_ZH.md`——环境部署检测接入〔deployer 页接真实检测快照〕
＋生产模块接入〔除车间外：recipe/release/warehouse 残余/inspection〕，含角色分工、步骤拆解
E1–E4/P0–P5、易踩坑点；**优先于 BG 填充工单**）。前录 2026-09-10 操作者批（**审阅立项工单 BG-7～BG-18 入工单节**——主会话三日
审阅发现，全部无真机/无裁决前置，可直接领取；含 CI 假绿修复、REGISTRY 漏登记、
overlay 排序吞错、EAC 安全面、M6 环境检查缺口等）。前录 2026-09-10 01:55 第五批（**产线领取 BG-4 并交付**——proposal 016
检查证据面契约预备：inspection-evidence v0.1 草案＋向量 7 件＋校验测试 4/4
绿；**草案态 REGISTRY 未动未标冻结**；开放问题 #19 登记待核心/环境/数据表态；
工单表 BG-4 标记交付待验收）。前录 01:30 第四批（**全员空转触发登记＋备稿转正为可领工单
BG-1～BG-6**——[需代裁] 累计 0，面板未召开〔依据用户规则：无裁决项则面板
无需召开〕；剔除已完成项〔双协议本 a9657ea〕，逐项拟 roles/产出形态/验收
标准，各进程经 collab:brief 自领，领取纪律见工单节头）。同批验收：核心
remoteBrowser 行移除（be58a67，015 §11 (a) 核心半边，63/63 绿）＋数据
bdl-queries v0.4 downloads.listCompleted（186b9fa——§10 仲裁读面当日交付，
64/64 绿；v0.3 头部取代对齐随批修复，40/40）。前录 2026-09-09 深夜第三批
（集成开工批落地——**观察①②闭环**：U7②＋U9 落版 product-boundary **1.3.0**
双语＝IMP-2 文档硬前置解锁；REGISTRY product-boundary 行刷新＋两行路径列
修正＋brief 校验器适配 schemas 目录版本形态；**备稿清单**入下方机制节〔当时
面板未触发〕；四树 collab 登记批验收合并；W25 三前置核验）。前录深夜第二批——
**代裁机制修正案登记：面板每晚至多一次〔批量一次性〕＋面板用尽后转后方
模块/Spike**（红线不变；关门/推送 3 轮审阅为用户单独要求，不受一次面板约束）。
前录深夜第一批——panel-prebatch 预产清单归档入树＋§3 附带观察路由：
`collab/reviews/2026-09-09-panel-prebatch_ZH.md`——28 项今夜裁决项预备清单＋0.1 三层
分流门禁＋0.2 红线清单＋0.4 底线恒定项＋B-1 元判据＝夜间面板判据底稿（观察①②
已闭环；观察③ 导航实差三处实现参照→**桌面**〔已验收 748feeb〕；
观察④ 编号对照注记已并入下方机制节）。前录 2026-09-09
深夜前：**登记「今夜代裁机制（用户预授权，2026-09-09）」**——专节见下；纯 collab/
临时规则登记，零实现文件；**仅今夜有效**，晨起用户追认/否决后失效。同晚前批
b9f9933：Reviewer 复核报告归档＋**U9「裁决 4」**新窗口/外部协议四分法（Reviewer
窄裁决关闭）＋outline 2.0.11 双语落表 IMP-1~5＋M4 行引用闭环＋导航实差必做项路由
桌面今夜 23:00 冲刺。承前：M5 关门最后一项达成（W15 用户确认）；W25 执行序
B1→A1→A2→A3→B2a→B2b→B3→归档（E2 并入）；006 全链收官（复跑 447/0）；
production-use-case v0.2 冻结＋W22 实现进行中＋013/014 接线完成。

## 今夜代裁机制（用户预授权，2026-09-09）——仅 2026-09-09 23:00–次日 08:30 有效

> 操作者 directed 登记（用户白天指示，2026-09-09）；**修正案登记（2026-09-09 深夜，
> 用户追加约束）：面板每晚至多一次（批量一次性）＋面板用尽后转向后方模块/Spike**。
> 本节为**临时规则**：晨起用户对全部代裁结论行使追认/否决权；与 AGENTS.md 升级
> 红线冲突处，**红线优先**。
>
> **触发记录：2026-09-10 01:30 全员空转触发，[需代裁] 累计 0，面板未召开**
> （依据用户规则：无裁决项则面板无需召开——今夜全部争议已经协作机制闭环，
> 015 §7/§10/§11 三域表态与两项集成仲裁均已落账）。按用户指令转入
> 「提前做后方模块/Spike」：可领工单见下方 **BG-1～BG-6**。

- **累计登记，不单独触发（修正案）**：今夜出现的本应 [需用户] 的裁决点，各进程
  照常写入 BOARD 标 **[需代裁]**——**只累计登记，不单独触发面板**；触发时刻到来
  前各进程继续可动工作；
- **面板每晚至多一次（修正案）**：触发时机＝**当夜第一次出现六进程全员空转/阻塞**，
  由操作者汇总当夜累计的全部 [需代裁] 项，**一次性批量裁决**；
- **面板机制**：操作者召 **3 个全新独立 Reviewer 实例**（GLM-5.3，互不共享上下文，
  每轮结束即弃），**各判全部累计条目**、逐条独立给 verdict＋理由；**逐条 2:1 多数
  采纳**；三方各异无多数→取保守项或留晨起；
- **面板用尽→转后方模块/Spike（修正案）**：面板用尽后再遇全员阻塞，**不再召开
  面板**——按用户指令转为「提前做后方模块/Spike」：批量面板结束时由集成同步产出
  「**后方模块/Spike 备选清单**」（来源：outline 积压的后方模块、W24 读面预备、
  M7 可前置项、文档/工具类欠账、限时探索性 Spike；逐项标注拟 roles 与产出形态）；
  进程遇全员阻塞按清单领取，不再空转也不再等面板；
- **留档**：每项裁决落 `collab/reviews/2026-09-09-panel-<slug>_ZH.md`（题目、三方
  verdict 与理由全文、结论、少数意见、实施边界）；结论以「**用户预授权代裁
  （2026-09-09，晨起待追认）**」标记进入 BOARD；
- **红线不代裁**：安全、法律、付费资产、产品边界、契约冻结语义类问题仍留晨起
  等用户（**不因批量面板放宽**；AGENTS 升级红线优先于本预授权）；
- **序列关门与 GitHub 推送前置**：M5 关门程序与每次向 origin 推送实质变更前，操作
  者召 Reviewer 对关门包/推送批单独审阅 **3 轮（每轮全新实例）**，**≥2 轮通过方可
  执行**；任何一轮给出带证据的否决即暂停，按意见修复后重审。**此审阅为用户单独
  要求，不受「一次面板」限制约束**；调度上尽量与批量面板相邻执行以省额度；
- **晨起追认**：用户对全部代裁结论享有追认/否决权；追认前实施范围不扩大（按结论
  开工的切片照常，但结论被否决则相关后续切片停）；
- **预产清单**：「今夜可能裁决项清单与判据」**已落盘并归档入树**（2026-09-09 深夜
  批；`collab/reviews/2026-09-09-panel-prebatch_ZH.md`：28 项今夜裁决项预备清单＋
  0.1 三层分流门禁＋0.2 红线清单＋0.4 底线恒定项＋B-1 元判据）——夜间面板使用前
  先读其 §0 规程；本清单为预备性产出，不含任何 verdict 式放行；**本清单即批量
  面板的判据底稿**——面板须优先按清单既有判据速裁，清单外新项按其 §0.1 分流
  门禁现场定级；
- **编号锚定（prebatch §0.3 警示落地）**：现存两套「裁决 N」编号并存（13 项用户
  裁决的项号 vs U9 标题「裁决 4」）——今夜引用裁决一律锚定 BOARD 行号（U7/U8/U9）
  或受管文档版本（outline 2.0.11），**不得只写「裁决 N」**。
- **后方模块/Spike 备选清单（备稿，2026-09-09 深夜第三批；面板未触发——各树今夜
  均有实现工作）**：修正案要求的清单提前备稿如下；批量面板触发并裁决完毕后由
  集成按当夜实际修订启用，进程遇全员阻塞按启用版领取，不再空转：
  1. **W24 读面预备**——Recipe/Assembly 工作台视图骨架/空态/i18n（拟 roles：桌面；
     产出形态：可运行切片。读面已齐：production-use-case v0.2 十方法全在 main）；
  2. **M7 可前置**——报告、快照与只读服务（桌面 Overlay Surface）设计稿与接口
     骨架（拟 roles：核心〔协作桌面〕；产出形态：设计稿＋crate 骨架＋测试）；
  3. **M7 可前置**——Inspection/Release 页面与官方 SDK 交接信息架构
     （拟 roles：桌面；产出形态：页面骨架＋诚实空态）；
  4. **M7 可前置**——检查证据面（功能/性能/依赖/光照/上传准备度）契约预备
     （拟 roles：产线〔协作核心〕；产出形态：Schema 草案＋向量；冻结硬前置齐前
     **不得标冻结**）；
  5. **文档/工具欠账**——collab:brief 校验 CI 化（治理规范 §3 预留方向；拟
     roles：集成；产出形态：CI workflow＋绿证据）；
  6. **文档/工具欠账**——project-inspection/project-ops 协议本双语补齐
     （production-use-case 双件套惯例；拟 roles：环境〔协作核心〕；产出形态：
     docs/protocols 双语＋REGISTRY 行改指协议本）；
  7. **限时 Spike**——Provider 生命周期压测脚本预备（M8 性能基线前置探索，限时
     不展开；拟 roles：核心〔协作产线〕；产出形态：Spike 笔记＋可复跑脚本，
     **不进产品代码**）。
  纪律：后方模块仍是 accepted work（outline 既有行），**不新增产品需求**；跨域
  切片照常走冻结硬前置；Spike 产出标注「Spike，非交付物」。

- **今夜可领工单（BG-1～BG-6；2026-09-10 01:30 空转触发后由集成备稿转正）**：
  备稿 7 项整理为工单——**剔除**：原第 6 项（双协议本）已完成（a9657ea/171b00c
  验收合并）；W25 相关项不在备稿内（窗口义务不属后方工单）。**领取纪律**：仅当
  本进程无更优先在途工作（IMP 冲刺/批 B 翼/014 setNote 等待确认项）时经
  collab:brief 自领；领取后在状态文件声明工单号；产出按各工单验收标准交集成
  验收。

  | 工单 | 内容 | 拟 roles | 产出形态 | 验收标准 |
  | --- | --- | --- | --- | --- |
  | BG-1 | **W24 读面预备**：Recipe/Assembly 工作台——三视图共享选择骨架、诚实空态、i18n 四语键（读面已齐：production-use-case v0.2 十方法全在 main） | 桌面（协作核心） | 可运行切片（apps/desktop） | 桌面 check 全链绿；数据全部来自 v0.2 十方法读面（mock 不出 DEV）；空态即终态；不宣称端到端 |
  | BG-2 | **M7 可前置**：报告/快照/只读服务（桌面 Overlay Surface）设计稿＋接口骨架 | 核心（协作桌面） | 设计稿（proposal）＋crate 骨架＋测试 | cargo workspace 绿＋clippy 零告警；设计稿仅方向不冻结；跨域接口留提案待桌面表态 |
  | BG-3 | **M7 可前置**：Inspection/Release 页面与官方 SDK 交接——信息架构＋诚实空态骨架 | 桌面（协作产线） | 页面骨架切片 | 桌面 check 全链绿；空态即终态；与 design-standard §8 对账不越界 |
  | BG-4 | **M7 可前置**：检查证据面（功能/性能/依赖/光照/上传准备度）契约预备 **【✅ 已闭环（集成 2026-09-12 措辞刷新）——已交付（产线，2026-09-10 01:55）：proposal 016＋schemas/inspection-evidence/v0.1 草案＋向量 7 件＋校验测试 4/4 绿；三方表态齐，2026-09-10 仲裁照单采纳、提案状态已接受（开放问题 #19 行）；语义权威自 M7 检查切片锚点领取时生效，冻结硬前置照 016 §7】** | 产线主导（协作核心、环境——性能/依赖事实源与其域相关） | Schema 草案＋正负例向量（proposal 承载） | 向量过 schema 校验；**冻结硬前置齐前不得标冻结**（治理 §2.5）；入 proposal 待仲裁，不直接动 REGISTRY |
  | BG-5 | **文档/工具欠账**：collab:brief 校验 CI 化（治理 §3 预留方向） | 集成（自领） | CI workflow（registry 校验＋分叉统计，先报告性不设门禁） | CI 绿证据（run 号留档）；不改变本地 collab:brief 行为 |
  | BG-6 | **限时 Spike**：Provider 生命周期压测脚本预备（M8 性能基线前置探索） | 核心（协作产线） | Spike 笔记＋可复跑脚本，**不进产品代码** | 脚本可复跑＋笔记记录边界发现；标注「Spike，非交付物」；单节拍内限时不展开 |

- **可领工单（BG-7～BG-18；2026-09-10 操作者审阅立项批——主会话三日审阅发现，全部
  无真机前置、无用户裁决前置；W25 窗口义务与 [需用户] 项优先权不受影响）**：领取纪律
  同 BG-1～BG-6（无更优先在途工作时经 collab:brief 自领，状态文件声明工单号，产出交
  集成验收）。

  | 工单 | 内容 | 拟 roles | 产出形态 | 验收标准 |
  | --- | --- | --- | --- | --- |
  | BG-7 | **CI 假绿修复**：`collab-brief --registry-only` 先设 exitCode 再 `process.exit(0)`，任何不一致都"通过"——改 `process.exit(registryBad > 0 ? 1 : 0)` | 核心 | `scripts/collab-brief.mjs` 修复 | 正例（当前 40/40）退出 0；人造不一致退出 1（实测两例留证后还原）——**✅ 销账（操作者修复令 0b8bebb 交付；核心复验 608f35a：正例 exit 0／负例版本格改 9.9.9 报异常 1 项 exit 1 且定位行／还原 exit 0；集成复验 2026-09-12 registry-only 46/46 exit 0）** |
  | BG-8 | **REGISTRY 漏登记补齐＋漏检结构性修复**：(a) `schemas/recipe/v0.3` 四件套与 `schemas/eac-probe/eac-allowlist/eac-terminate` v0.1 按实际冻结状态入册；(b) brief ④ 新增"漏登记检测"——扫描 `schemas/*/`、`docs/protocols/*.md` 中未登记项并列出 | 数据 | `docs/REGISTRY.md` ＋ `scripts/collab-brief.mjs` | ④ 显示漏登记 0 项；能演示检出一个人造漏登记（还原后） ——**✅ 已由操作者修复令交付（集成，0b8bebb）：6 族补登（recipe v0.3/eac 三族/amf-production v0.2/environment-managers v0.1）＋反向漏登记检测（spike/草案豁免），46/46 一致；人造漏登记检出演示（exit 1 并打印缺失行）** |
  | BG-9 | **schema-vectors CI 清单扩展**：workflow 清单停在 v0.3 时代，本窗口全部新契约锚点未入 | 集成（自领） | `.github/workflows/schema-vectors.yml` | 清单覆盖全部现行契约测试文件（inspection_evidence_vectors、downloads_list_serving、import_*_contract_v0*、recipe_v03、project_inspection、eac_*、project_ops_wire、catalog_queries 等）；推送后徽章语义恢复 ——**✅ 已由操作者修复令交付（集成，eeb42c6）：清单扩展至全部现行契约锚点（含 inspection_evidence_vectors 草案漂移保护，注明不暗示冻结）；目标名逐一核对存在** |
  | BG-10 | **overlay_surface 排序与吞错修复**："oldest first" 声明与实现不符（按 task_id 哈希字典序，demo-* 恒排 prod-* 前）；`tasks().unwrap_or_default()` 把存储故障折叠为空态 | 核心 | `crates/orchestrator/src/overlay_surface.rs` 修复＋测试 | 排序按真实时序（或改声明并给出理由）；存储故障呈故障态而非空态；新测试钉住两者；proposal 017 表述对齐——**✅ 已由操作者修复令交付（核心，30da5b6/87ae6a9：入队顺序恢复与声明一致＋存储故障穿透为故障态＋乱序回归测试钉死＋unwrap_or 审计清零；66/66 绿）** |
  | BG-11 | **EAC 安全面收紧**：`terminate_open_and_wait_for_test` 等测试钩子以 `pub` 暴露在 crate 根（绕过 R3 安全闸）；`eac_terminate.rs` 默认 cargo test 真杀进程 | 环境 | `crates/project-manager` 修复 | 钩子收 feature 门或 `#[cfg(test)]`；eac_terminate 用例标 `#[ignore]`（与探针/白名单同策略）；默认构建不导出绕过原语；默认 cargo test 不触真实进程——**✅ 全额交付销账（环境 156640b/b75447e＋dc6aa93/93d8c6a；集成实文核验 2026-09-12：lib.rs:28/39 cfg(all(windows, any(test, feature="test-hooks"))) 双门＋eac_terminate 真机件 #[ignore]＋默认构建不导出＋wt-6 全范围验证四条全过〔project-manager 13 套件复跑绿，含集成 67/495 三轮〕；环境侧声明无剩余收紧项）** |
  | BG-18 | **CI 环境敏感失败修复**：`the_five_guards_refuse_typecally`（`crates/project-manager/tests/import_copy.rs:305`）在 GitHub Windows runner 的 `cargo test` 失败——`TargetInsideSource` 守卫对 runner 路径形态未拒绝（`plan_import_copy` 返回 Ok）；**本机同 Windows、同 rustc 1.97.1 三轮全绿**，代码自 014 世代未变。上轮推送（12a6a45 世代）rust 34630656044＋schema-vectors 34630656005 双红同根 | 环境（project-manager 所有权；协作核心如守卫语义涉 014 冻结件） | 复现 runner 路径形态（`runneradmin` TEMP/8.3 短名/盘符大小写/`\\?\` canonicalize 前缀逐一排查）→ 守卫路径规范化修复＋回归测试钉死 | CI rust 与 schema-vectors run 全绿；本机保持绿；**禁止以跳过/忽略该测试方式过关**（诚实纪律）；守卫语义不放宽（014 冻结拒绝码闭集不变）——**✅ 修复交付并 CI 实证销账（2026-09-12）**：核心独立根因分析（608f35a）与环境实证一致——normalize() 对不存在目标回退调用方字面拼写，保留 runner TEMP 8.3 短名（RUNNER~1），与 source 侧展开长名 starts_with 不命中；环境 TDD 红绿链修复（38dc36c：最深存在祖先 canonicalize 回拼尾部＋盘符统一大写＋116 行回归测试钉死短名/大小写/verbatim 形态＋windows-sys dev-dep 四项备案），集成验收合并 34eddaf（本机 67/496×2＋clippy 0）；推送 8ccd5a9 后 **CI rust 34638793810 ✅（15m57s）＋schema-vectors 34638793850 ✅（14m21s）＋ts ✅——双红全消，runner 语义修复实证成立**；r1d 复核确认守卫只收紧不放宽、能力检测不构成变相跳过 |
  | BG-19 | **unity-bridge clippy lint 观察核实**（wt-5 登记，未复现）：wt-5 本机 rustc 1.97.1 对 `crates/unity-bridge/src/material_task.rs:94` 报 `unnecessary_lazy_evaluations`（`unwrap_or_else` 闭包返回常量 `Value::Null`，建议 `unwrap_or`；该行自 843e2fb 即在）；集成同版本全量＋单包 clippy `-D warnings` 均 EXIT=0 未复现；CI clippy step 因 test 失败（BG-18）未执行到 | 产线（unity-bridge 所有权） | 在可复现环境确认后一行改写（不改语义）或证伪并记录分歧来源 | CI clippy 实际运行事实（随 BG-18 修复后的首个 rust run 判定）；证伪则记录工具链分歧结论后销账——**✅ 销账（2026-09-12）**：产线一行改写 b3b9833（unwrap_or_else→unwrap_or，零行为变化）集成验收合并；BG-18 修复后首个 rust run **34638793810 ✅**（含 clippy step）＝CI 事实到位；数据消费侧复核（64c62a6：-p vua-acquisition clippy -D warnings 干净）在树 |
  | BG-12 | **序列化吞错惯例清理**：`provider_host.rs:3388` `to_value().unwrap_or_else(|_| json!([]))`、`warehouse_download_adopt.rs:392` 等 `unwrap_or(Value::Null)`；`adopt` 任务 `.expect` panic 路径 | 数据（协作核心） | 逐处改类型化错误或 `expect` 附不变量说明 | 相关测试绿；无新增吞错点；每处修改附一行不变量/理由注释——**✅ 全额交付（数据侧 43ea8d2/b75447e＋核心半边 91d9c3e/bc93d98：provider_host 八处序列化吞错改 expect 附不变量注释，虚假 rejected 文档伪造消除；66/66 绿）** |
  | BG-13 | **提案状态字段卫生**：009（已收口仍"讨论中"）、015（已仲裁已驱动 0.7.0 仍"草案待表决"）、011/012（已按冻结件验收仍"收敛"）头部状态与实际对齐 | 集成（自领） | `collab/proposals/` 头部修正 | 四份提案状态字段与 BOARD 记录一致 ——**✅ 已交付（集成，随脱敏批提交）：009/011/012/015 头部状态对齐（原注记保留）** |
  | BG-14 | **check-leak 注释对齐**：`App.tsx`/`dev-mode-section.tsx` 声称"指纹覆盖 per-port 选择键"，而 `check-leak.mjs:75-78` 实际排除该键 | 桌面 | 注释或装置二选一（自决并记录理由） | 注释与装置一致；check 全链绿——**✅ 已由操作者修复令交付（桌面，53a1bc2/28d0c59：过量声明修正为与 check-leak.mjs 排除一致，理由记录；56/449 绿）** |
  | BG-15 | **Inspection/Release 页面骨架**（原 BG-3 未交付项）：信息架构＋诚实空态；无事实源不渲染检查数据 | 桌面（协作产线） | 页面骨架切片 | 桌面 check 全链绿；空态即终态；不宣称可用；与 design-standard §8 对账不越界——**✅ 交付验收（桌面 7a1af41 合并 8c799a5：报告/证据/下一步三区 IA＋诚实空态〔检查事实源随 M7〕＋nav 注册 recipe↔release 之间＋SDK 结论保留值纪律文案；Release 半边以既有 ReleasePage 核销；合并后 check 474 绿）** |
  | BG-16 | **M6 环境检查行**（审阅发现的交付缺口）：Unity/VRChat/SteamVR 检测＋网络/磁盘/残留进程检查项，注册表/文件系统读取抽象注入、合成夹具单测 | 环境 | `crates/project-manager`＋核心 environment 切片 | 检查项带 fixture 测试；真机探测标 `#[ignore]`；cargo workspace 绿＋clippy 零告警；M6 关门对账可凭此行销账——**✅ 交付核销（环境声明 2026-09-12：四条验收标准全满足——fixture 全套＋真机件 #[ignore] 门控＋workspace 67/496×2＋clippy 0〔34eddaf 世代〕＋E1/E2/接线刀链全验收在树；集成核对声明与在树证据一致）** |
  | BG-17 | **downloads.listCompleted 排序断言**：`completed_at` 按字符串排序，格式漂移即退化 | 数据 | `bdl-store` 测试补断言 | ISO 排序断言钉死；格式漂移即测试失败——**✅ 已交付并核销（数据，43ea8d2/b75447e：ISO 排序断言 51 行钉死，撞车已按实际核销——在途批未含该断言，无重复）** |
  | BG-20 | **compose-draft-store 确定性修复**：`composeAddItem` 纯函数内 `new Date().toISOString()` 非确定；`composeUndo` 回空草稿仍 `dirty:true`；`addedAt` 无覆盖 | 桌面 | `apps/desktop` 修复＋测试 | 时钟参数化/注入；`addedAt` 与 undo-dirty 断言补齐；桌面 check 绿——**✅ 交付验收（桌面 80052d6 合并 8c799a5：时钟注入命令边界＋undo 回空草稿 dirty 语义修正〔从未保存=false/已保存=true〕＋addedAt 确定性断言；合并后 check 474 绿）**。〔编号注 2026-09-12 集成：原误标 BG-18，与 CI 环境敏感失败工单重号；重编号为 BG-20——重编号时无任何树引用过该号〕 |
  | BG-21 | **collab-brief 登记表校验器健壮性**（核心观察 608f35a）：REGISTRY 畸形行（列数不足）被校验器**静默跳过**——行计数 46→45 无检测、仍 exit 0 | 集成（collab-brief.mjs 所有权） | 校验器补结构校验（列数/必填格）＋测试 | 人造畸形行检出并 exit 1（留证后还原）；既有负例（坏版本格）不回归——**✅ 已交付（集成，b86a3db，2026-09-12）：表格行（以「\|」开头）结构校验——列数不足或必填格（路径/版本/状态）为空均报异常并计入总行数（行计数不再静默缩水）；正文/空行照旧跳过。验证矩阵五步留证：正例 46/46 exit 0／截断畸形行检出〔列数 2，需 ≥3，共 46 行不漂移〕exit 1／路径格空检出 exit 1／既有负例 9.9.9 不回归 exit 1／还原干净 exit 0；完整简报模式回归通过。缺陷复现先于修复（旧逻辑对人造负例实报 45/45 exit 0，与核心观察一致）** |

## 工作树指派

| 工作树 | 分支 | 角色 |
| --- | --- | --- |
| VUA（wt-main） | main | 集成 |
| VUA-2（wt-2） | slot/wt-2 | 核心 |
| VUA-3（wt-3） | slot/wt-3 | 桌面 |
| VUA-4（wt-4） | slot/wt-4 | 产线 |
| VUA-5（wt-5） | slot/wt-5 | 数据 |
| VUA-6（wt-6） | slot/wt-6 | 环境 |

入职提示词：`collab/roles/<role>.md`；节拍命令：`collab/TICK.md`。

## M 门状态

| 门 | 状态 | 备注 |
| --- | --- | --- |
| M0 / M1 / M2 | 已通过 | 2026-09-04 |
| M3 | **已通过** | 2026-09-07——门项全完成（I-1 16/16 真机；三轮走查终验通过）；v0.5.0 已切，关门后推送 GitHub |
| M4 | **已通过** | 2026-09-08——W12–W17 全链交付；W15 两轮走查收敛（复验通过＋两修正项回流 2fa260d＋用户确认）；v0.6.0 已切并推送 GitHub；M5（v0.7.0）随即开窗 |
| M6 | **项目管理部分提前开工**（用户裁决 2026-09-08 晚，操作者转达；环境/桌面已同步派发）| 授权与范围：**越过门序**的任务包＝T-A 通用 vrc-get 路径（环境，核心协作；**wire 词表为新协议面——桌面提案→核心裁决流程不变**）＋T-B ALCOM/VCC 能力检测与兼容矩阵（环境，桌面协作）＋T-C F6 页面（桌面，环境协作；U3 只读兼容呈现＋「导入为 VUA 管理的副本」入口，权威＝product-boundary 1.2.0）＋EAC 适配器（环境，R1–R9 已批准按 R9 执行）＋Unity/VRChat/SteamVR 环境检查行；**门验收与发行不在提前授权范围**（等 M5 关门后按门序）；任务包拆行细化见 outline 2.0.9 M6 分解表；early-open 授权记录＝用户裁决 2026-09-08 晚（操作者转达）。**进度（2026-09-09）**：T-A/T-B 只读检查＋兼容矩阵＋T-C F6 页面＋EAC R1a 只读探针（eac-probe v0.1）均已验收合并；T-A 写路径（proposal 014）语义已冻结、实现已验收（project-ops v0.1）；**IMP-1~5 素材导入页任务包增设落表**（2026-09-09 晚，outline 2.0.11 双语：U7① 批准增设＋U9「裁决 4」四分法细则为 IMP-2 导航/新窗口/外部协议语义权威；IMP 门验收**并入** M6〔v0.8.0〕门清单〔默认读法〕；导航实差必做项已路由桌面今夜 23:00 冲刺） |

M3 进度：

- [x] T1 — amf-production v0.2 schema + 8 向量（94ee161 吸收，字节一致）
- [x] T2 — F 侧登记批（d8593df）
- [x] I-3 — 三车道统一合并（2026-09-06；b211f7a 后端车道并入、6837271 F 侧回灌）
- [x] I-1 — 真 Unity 矩阵：**✅ 已交付（2026-09-07）**——16/16 格真 Unity 通过；证据
  wt-4 `_local_w1/` 25 项（16 格全覆盖、多轮校准留痕、终态全 ok）；集成独立复验 1 格
  真机 ok（75.43s）+ workspace/clippy 全绿；合并 5ccace6
- [x] W7 剩余 — **✅ 三轮走查闭环，终验通过（用户 07:05：R1–R5 全过）**。初验部分通过
  → 复验（B3/B4 ✓ 场景条 ✓；i18n 动态载荷、仓储残留文本未过）→ 第三轮修复后终验通过。
  结果落档 `_local_m4/v0.4.2/`（w7-walkthrough-closure.json 等）。语义/UX 裁决与积累项
  随 M4 实施（见下）

M3 关门程序（用户裁决 04:50；I-1 完成、GUI 走查通过后由集成依次执行）：

- a. **全文档审查**：outline 当前窗口、架构文档、协议本状态段、REGISTRY 等更新至实际进度；
- b. **确认 M3 整体无冲突**：冻结契约表与实际一致、门验收清单逐项核实、全量测试绿；
- c. **升产品版本 v0.5.0 并推送 GitHub 远端**（U4 就此落定：关门后推送、不提前建仓；
  remote 建立与 CI 三 workflow 按 W11 原计划一并执行）；写双语发行说明。

M4 分配规则（用户裁决 04:50；v0.5.0 推送完成后执行）：从 outline 分配 M4（v0.6.0）任务；
**实际开发前必须对照 M4 任务分解表逐项核实已交付/部分交付/未动工**——已交付例：三命令
协议（bdl-commands v0.1.1）、下载事件闭环（download-events v0.1＋消费测试）、素材检查
流水线（artifact_inspection）、BDL 持久格式（bdl v0.1）；**W12（catalog 观察管线）为
已排期未动工**（M4 开窗后数据第一切片执行：勿标已交付、勿重复分配；数据事实纠正 05:00）。
据此先更新 outline 的 M4 分解与窗口表，再向各角色分配，避免重复开工。

已接受语义/UX 裁决（用户走查批 2026-09-07；记录待 M4 实施）：

1. 素材入口：默认原始 `.unitypackage`；「生成 VPM 替代」「生成后删除原始素材」移入
   设置-实验性（新标签页）——产品语义已同步 product-boundary 1.1.0（双语，集成）；
   完整交互重构与可能的协议升版（005 线程备案）入 M4；
2. 任务中心语义改**通知中心**，每条通知带清除按钮（设计标准同步 [→桌面]）；
3. 仓储布局：右侧专门详情区＋素材列数随窗口宽度自适应；
4. DEV 场景切换条可收起（DEV 工具缺陷——随 M3 缺陷批先行修复）。

M4 已积累裁决项（U7/U8 落定 2026-09-07，随 M4 分配一并实施）：仓储布局重构（自适应
列数+右侧详情区，U7→W13）；实验性设置完整形态（两级选项：生成 VPM 替代+生成后删除
原始；含持久化位置决策与 bdl-commands v0.2 升版硬前置，U8/005 备案→W14/W15）。

**M4 分配（2026-09-07，outline 2.0.2）**：W12 catalog 观察管线（数据首切片）；W13 仓储
布局重构（桌面）；W14 bdl-commands v0.2 升版（数据）；W15 设置-实验性完整形态（桌面，
依赖 W14）；W16 设计标准同步（桌面）。M4 分解表六项历史交付已核实（outline 2.0.2）。

**M4 进度（2026-09-08 03:1x）**：W12 ✅ **全链闭环**（服务面 6062a13＋provider 路由
80ad6e7＋消费端对齐 693965d/5fd8c6b：应用码映射修复〔detail miss 曾会误报
not-connected 的不诚实呈现〕＋errors.catalog.* 四语键；桌面核实「真实面切换」本无
切换改动——消费面就绪，provider 服务后自愈）；W13 ✅＋W16 ✅（88b4551）；W14 ✅
（bdl-commands v0.2 冻结＋provider 路由）；W15 **重做批已交付并验收合并**（2026-09-08：4fb6411 桌面自并 4954349，集成验收）——
示意图 A 全局开关形态＋危险开关（未接线如实标注，DEV 注明不删文件）＋VPM 术语
四语修正＋「开」按钮宽度随形态消除＋contracts TS 面登记（setGlobalDefaultMode，
词表与 v0.2 冻结一致）；mock 1 行越界声明充分（005 既有「诚实不可用」立场）准予
维持。验收证据（2026-09-08 本机）：桌面 check 全链绿（typecheck＋47 文件 395 测试
＋build＋boundary＋i18n＋contrast＋leak 160 条指纹零泄露）＋contracts 29＋
orchestrator-provider 23＋cargo workspace 350 通过 0 失败。
**M4 门验收清单（2026-09-08 关门核实，逐项）**：
- [x] W12 全链闭环（6062a13/80ad6e7/693965d/5fd8c6b＋73cae1b/c93ac5e W17 写入侧）；
- [x] W13 布局重构（88b4551）＋W16 设计标准（v0.6.2＋0.6.3）；
- [x] W14 bdl-commands v0.2 冻结＋provider 路由（10325cd）；
- [x] W15 两轮走查收敛（重做 4fb6411→复验通过→修正 2fa260d→用户确认关门）；
- [x] W17 观察管线写入侧（73cae1b：350/0＋9 项消费测试）；
- [x] 全量测试绿（2026-09-08 本机关门核实：cargo workspace 350 通过 0 失败；桌面 check
  全链 47 文件 395 测试＋leak 160 条指纹零命中；contracts 29＋orchestrator-provider 23）；
- [x] CI：ts **run 34160725827 ✅**（关门批推送触发，2026-09-08）；rust/schema-vectors
  因 paths 过滤未触发（关门批无 crates/schema 改动）——最近全绿证据 rust
  34151441179／schema-vectors 34151441213（2026-09-08，W17 批）；
- [x] #7 观察态如实引用（本机 8 轮 1 次 14/1 未捕获瞬败＋7 轮全绿，发行说明如实声明）；
- [x] proposal 008 仲裁路径 a 已落（提案已接受；接线切片 M5 首批＝W18）；
- [x] 触发时机语义落受管文档（product-boundary 1.2.1）；U1/U3 用户裁决销账（1.2.0/2.0.7）。

**M5 开窗（v0.7.0，2026-09-08）**：分解表核对历史进度（无预交付）后落 outline 当前窗口
**W18–W26**——桌面 M5 首批 W18（008 路径 a 接线）＋W19（导入时自动生成挂点与编排
语义，与核心/数据合并设计）；核心 W20（Recipe v0.3/Local Resolution/版本锁）＋W22
（完整 Build Record）；产线 W21（Bridge 操作扩展）＋W25（合法素材冒烟路径）；数据
W23（兼容/缺失证据模型）；桌面 W24（Recipe/Assembly 工作台）；集成 W26（门验收与
发行）。各角色按锚点领取，开工前先合并 main 最新。

**W25 窗口语义修正（用户裁决，2026-09-08 操作者路由）**：W25 真机窗口改为**一次
全量验证**（不拆分）——开窗前置＝①核心 W20 实现切片（production-use-case v0.2
命令面）＋②产线 Rust 物化下刀＋③W22 实现切片**三者全部落地**；此前产线「就绪
请求」措辞**作废**（窗口不再按「契约/实现就绪前确认」节奏单独开）。
**前置进度（2026-09-08 23:4x）**：②已落地（9195fbb 验收合并）；①核心第二刀
执行中（M5 关键路径）；③待核心 W20 实现切片落地后开工。
**合并窗口执行序定稿（用户裁量，2026-09-09 操作者转达；环境对齐已确认）**：
**B1→A1→A2→A3→B2a→B2b→B3→归档**——**E2（运行中探测，用户将在窗口内启动
VRChat 客户端）并入本窗口**，不再顺延环境后续窗口；开窗通知时同步环境与用户。
（B1＝只读探针；A1–A3＝产线段；B2a/B2b/B3＝验证尾；详见产线执行序草案。）

**M5 关键路径（用户裁决，2026-09-08）**：核心 **W20 实现切片**（production-use-case
v0.2 冻结切片＋命令面）与 W25 开窗直接关联，为 **M5 关键路径**——用户已直接催办
核心第二刀立即开工（正在执行）；**各批验收时集成优先处理核心批**。W20 第一刀
（production-evidence v0.1 store，AMF 生产持久域证据文档库＋147 行测试）已验收
合并（7e74fa0）。**W17 已入表**（outline 2.0.4）且 **✅ 全链交付**：桌面协作面（869519b 自并 c93ac5e：
错误透传呈现白名单＋live-acquire entryDetail 旧码修复——live 面 miss 曾会误报断连；
394 测试全绿＋CI ts 绿）＋数据写入面（eb899f1 验收合并 73cae1b：products 全列 upsert
〔重放安全、无删除 API、墓碑保留〕＋bdl_meta.catalog_updated_seq 簿记〔v0.3 既有
语义开放项落地〕＋catalog 读组装消费观察列＋写入侧闭集 InvalidObservation 拒绝＋
9 项消费测试；350 通过 0 失败＋clippy 零告警；wire 零变化，架构双语 1.1.0）。

W15 首轮走查裁决（用户 2026-09-08，操作者落账；**判定：不通过**——交互形态重做，
非缺陷批；**用户示意图为规格权威**，桌面执行中）：

1. 形态重做：设置-实验性页用**全局开关**形态——「生成 VPM 替代」开关＋「生成后删除
   原始素材文件」红色开关（带危险徽标；主开关先开才可用；开启时弹危险确认对话框）；
   **无条目选择器**（取代 U8 记录的两级选项形态）；
2. 样式缺陷：实验性入口「开」按钮宽度过大；
3. 术语硬裁定：**VPM = VRChat Package Manager（管理器），VPM 包 = VPM package
   （被管理的包）**——全仓 i18n/注释/文档按此修正（应用面随 W15 重做切片由桌面
   执行；受管文档面评估归集成，见开放问题 #9）；
4. 语义影响：全局「生成 VPM 替代」可接线 W14 冻结的 `warehouse.setGlobalDefaultMode`
   （无协议障碍）；全局「生成后删除原始素材文件」超出冻结的条目级 deleteOriginals——
   桌面起草 proposal 008 请数据/核心表态（可能涉 bdl-commands 升 v0.3；未接受前
   v0.2 维持冻结）；M4 内桌面先交付呈现层＋如实标注未接线。

## 冻结契约表

契约登记的权威清单在 docs/REGISTRY.md（C-a 侧建立）；下表是门视角摘要。

| 契约/制品 | 版本 | 状态 |
| --- | --- | --- |
| application-contract | v0.1 | 冻结（M2 冻结） |
| provider-process（协议本/握手帧面） | v0.2 | 握手帧面 Schema 冻结（provider-frame-v0.1 + 双端 11 向量；proposal 001 关闭） |
| bdl-commands | **v0.4** | **已冻结（IMP-3 契约先行，2026-09-09，数据，集成验收 89038f5：复跑 61/61 workspace 全绿＋clippy -D warnings 零告警）**——v0.3 五命令闭集照录（向量随版升级）＋**warehouse.importDownloads 下载落库**（任务化；params 仅 `{ downloadIds }`——路径/大小/文件名是服务端事实，从 BDL download_events 折叠 `staging_completion` 解析，客户端断言＝契约错误〔负例钉死〕；copy-in 复制入库暂存不动；kind=`downloaded_material`〔BDL v0.1 冻结词表预留值〕；内容关联经 `local_artifacts.download_id`；fail-fast 保留已落库；下载边界取消；内容→产品映射归 AMF 来源解析〔IN-4〕刻意不进命令）；正例 2＋负例 6；采纳实现 warehouse_download_adopt.rs 521 行＋消费测试 6/6；双语协议本＋REGISTRY 已刷新。**冻结注记（2026-09-13 集成对账更正——核心申报登记滞后，集成独立核实成立）**：wire 路由已交付验收（cbde4b3 经 b4c78aa，2026-09-10，验收结论原文「v0.4 six-command closed set fully wired, IMP-3 wire wing complete」；provider_host.rs `warehouse.importDownloads` 路由臂在位）；TS 面已登记（contracts desktop-gateway：method 词表行＋command 映射＋守卫分支＋测试面在位）——IMP-3 接线翼完成；零端到端宣称维持（真机走查归 W25）。历史：v0.3（2026-09-08 首批先行，集成验收 ef9854b：362/0）已取代（→ v0.4）；v0.2（W14）/v0.1 更早 |
| bdl-queries | v0.3 | 现行（v0.1 / v0.2 已取代） |
| download-events | v0.1 | 冻结 |
| unity-bridge | **v3** | **已冻结·v3（M7，2026-09-13，产线，proposal 016 三树表态收口〔核心 0:0x 五点／数据 0:2x 四点／桌面 1:4x 三点，零修订意见〕；冻结批交集成验收，实现批级）**——v2 同面超集（v1→v2 先例复刻；v1/v2 文件零改动、全部向量保持有效）＋三只读检查操作 `inspect_avatar_references`/`inspect_lighting`/`inspect_upload_readiness`（五维产出层，dryRun 恒 true、payload 单一 avatarGlobalObjectId、发现走 diagnostics 类型化码、official_sdk_rating 保留值）＋`data.instanceGlobalObjectId` 合法化（011 遗留缺陷兑现＋v2 漂移声明）；落库面先行（schema＋向量 11＋Rust 消费测试 6/6＋C# 实现随锚点批 7d63abe 验收），本批补齐契约面（协议本双语 v3＋REGISTRY＋本表升版）；**生产作业面已迁移 v3——2026-09-13 5:0x 第十一批验收，产线迁移切片 68d72ad：发射面 `PRODUCTION_FACE_SCHEMA_VERSION=3`、收据接受集 {2,3}〔v2 收据仅现于迁移前 provider 发 v2 命令的过渡窗口，016 漂移声明就此消解〕、011 `instanceGlobalObjectId` 合法化消费面补齐、C# 收据版本回显命令版本；C# EditMode 落地未运行验证〔真机归 W25〕，零端到端宣称**。历史：v2（W21，2026-09-08，互审收口：互审点 1–5 全关＋核心确认 planRef job 目录文件形态；集成复跑 356/0，v2 修订 367/0）保持已冻结——生产作业线继续消费；v1 保持已接受——material 线（production-use-case v0.1）继续消费，三族并存语义对齐不合并 |
| recipe / local-resolution / approved-plan / build-record（schemas/recipe/v0.3） | v0.3 | **已冻结（W20+W22，2026-09-08，核心，集成验收 0400bee/c486318：复跑 367/0、370/0＋clippy 零告警）**——M5 生产主线产物链四件（意图/事实/授权/历史）全冻结；产线互审两缺口吸收（jobs[] 补 commandId/replayed）；W22 实现切片（provider 侧记录面）随执行序推进 |
| material-intake | v0.1 | 冻结 |
| bdl（schema） | v0.1 | 冻结 |
| environment-managers（schema） | v0.1 | 冻结 |
| project-inspection（schema） | **v0.2** | **已冻结（v0.1 增量族升版，2026-09-09，环境，集成验收 354925a：复跑 62/62＋clippy 零告警）**——新增逐项目 vuaIdentity 三态判定（absent/present〔markedAt,note〕/unreadable；不可读＝证据绝不静默缺席）；零消费声明如实（provider 路由未实现、TS 面未登记——接线前不得称端到端）；v0.1 已取代（→ v0.2），其内容（M6 T-A/T-B 检视聚合：关联/Unity 分类/VPM 声明面/VRChat SDK/未完成变更标记三态；库级 payload 面；013 读面 wire 词表）完整并入。配套：VUA 独有标识文件 `.vua/project.json`（vua_identity.rs 176 行＋5 测试；备注存取 VUA-native-only）；import-copy apply 落成点标记副本 VUA-native（裁决 9「迁移到了 VUA」；wire v0.1 词表零变更）；消费路由问题已留 013/014 内联待核心 |
| amf-production（schema / 向量） | v0.2 | **已冻结（M3 验收，2026-09-07）**；协议本 production-use-case v0.1 同日冻结 |
| eac-probe（schema） | v0.1 | **已冻结（M6 EAC R1a 实现，2026-09-09，环境，集成验收复跑 437/0）**——EAC 只读冲突探针（R1a：允许清单会话/残留快照两态 fixtures；006 八点语义锚定）；实现 eac_probe.rs 309 行＋252 行测试 |
| eac-allowlist（schema） | v0.1 | **已冻结（M6 EAC R2/R3 实现，2026-09-09，环境，集成验收复跑 442/0）**——允许清单数据面（起始为空＝八点语义第 2 点：清单空期间终止能力显示未核验/不可用）＋候选再核验原语；实现 eac_allowlist.rs 164 行＋eac_verify.rs 217 行＋296 行测试。**R3 签名核验追加验收（同日，复跑 443/0）**——WinVerifyTrust 完成 006 R3 四件套核对（R1b groundwork） |
| eac-terminate（schema） | v0.1 | **已冻结（M6 EAC R1b 实现，2026-09-09，环境，集成验收复跑 447/0）**——EAC 终止步骤（R1b：006 全链 R1a/R2/R3/R1b 交付收官）；termination.schema.json（101 行）＋fixtures 两件（terminated/refused）＋实现 eac_terminate.rs 346 行＋296 行测试＋测试残留修复 |
| production-evidence（schema） | v0.1 | **已冻结（W23，2026-09-08，数据，集成验收复跑 376/0）**——兼容/缺失证据条目模型（evidenceId/kind 闭集/subject/observedAt/detail/sourceRef/resolution）；跨词表引用消费 recipe v0.3 套件（解析文档 evidenceIds 引用不复制）；存储随 AMF 生产持久域（011 收敛决议①） |
| inspection-evidence（schema） | v0.1 | **已冻结（M7，2026-09-13，产线，proposal 016 §7 硬前置收口：①Bridge 五维产出操作 7d63abe＋②核心存储/读路由/任务化驱动 7a262b8 均经集成验收＋③向量全绿＋消费测试在库；④双语协议本＋⑤REGISTRY 随本冻结批）**——五维闭集检查证据束（functional/performance/dependencies/lighting/upload_readiness；unavailable 维 schema if/then 钉死 basis=none＋空 checks＝缺席即证据；聚合 fail＞warn〔含 unavailable〕＞pass；official_sdk_rating 保留值；dependencies 单层裁决＝Avatar 资产引用完整性，manifest 声明完整性留 project-inspection v0.2，引用不复制）；**不进 BDL**（016 §5/011 §5）；存储＝核心 InspectionEvidenceStore 第五文档库；读面走 inspection-queries v0.1（数据族，独立冻结批候核心修订批）；真机运行验证归 W25（C# EditMode 已落地未运行验证如实声明，零端到端宣称） |
| project-ops（schema / 词表） | **v0.2** | **已冻结（v0.1 增量族升版，2026-09-12，核心，集成验收合并 10c0d68：合并后复跑 67/501/0＋clippy 零告警）**——新增 `project.setNote` 备注写命令（D-6 桌面确认裁定 A「列表行内查看＋行内轻量编辑」，proposal 013 内联线程；`projectPath` 为本词表族唯一标识形态〔`projectId` 草案定形修正〕；note 单行非空 ≤2000 字符、null 清除；守卫闭集三码扩充：project_not_found／not_vua_native／identity_unreadable，与 v0.1 七码合成十码冻结闭集；kind=note 完成面与 project-inspection v0.2 vuaIdentity present 投影同构，写备注不改 markedAt）；import-copy 形状零变更；协议本双语 v0.2＋REGISTRY 已刷；v0.1 已取代（→ v0.2，头部已对齐）。**接线注记**：provider 路由已 live（served_capabilities 含 project.setNote）；TS 面与列表行内编辑归桌面接线批（已解锁）；接线前不得称端到端。历史：v0.1（014 实现，2026-09-09，集成验收复跑 428/0，import_copy.rs 607 行＋342 行测试）已取代 |
| recipe 套件（recipe / local-resolution / **approved-plan** / **build-record**） | **v0.3** | **已冻结·全四件（2026-09-08）**：W20 前三件（集成验收 0400bee，复跑 367/0）＋W22 收尾件 build-record（proposal 012 收敛：产线互审三核验点确认＋两缺口〔commandId/replayed〕吸收，集成验收复跑 **370/0**＋clippy 零告警）——M5 生产主线产物链（意图/事实/授权/历史，引用不复制）；v0.2 整体废弃不建迁移器 |
| production-use-case | v0.1 | **已冻结（M3 验收，2026-09-07）**——四项前置交付核实（T1 Schema/向量、双端契约测试、I-1 真机 16/16）。**v0.2 已冻结（2026-09-09，核心，集成验收复跑 428/0）**——24 向量＋向量驱动消费测试完成冻结硬前置（**W25 前置①凭证落地**）：十方法 Schema＋桌面 TS 面＋双语协议本＋全路由（recipe save/get/list＋resolve＋plan.approve/get/list＋**job.execute approved-plan 编排〔closing cut〕**＋record.get） |
| inspection-queries（schema / 词表） | v0.1 | **已冻结（检查读面词表行三方法一次冻结，2026-09-13，数据，候集成验收）**——`inspection.get`/`inspection.list`（016 仲裁第 2 点独立词表行，照 record.get/list 先例）＋任务化 `inspection.requestRun`（job.execute 形态 taskId 轮询）；016 §7 硬前置①②③已验收入库（7d63abe＋7a262b8＋修订批 c914cf2：族自有常量 `INSPECTION_QUERIES_SCHEMA_VERSION="0.1"` 统一三回执＋schema const＋example，avatarRef.ref 去 maxLength 与证据本体 verbatim 承载同形——数据追认在案）；正例 3 对＋负例 3＋双载体消费测试（acquisition 契约锚＋provider-host 帧环）；协议本双语＋REGISTRY 已登记；TS 面核心随实现批已登记。**接线注记（2026-09-13 2:4x 数据刷新）**：provider 路由已 live；**get/list 桌面消费已落地入 main**（33988a6：contracts 词表行＋路由＋端口＋页面三区）；requestRun 维持悬空面——avatarGlobalObjectId 无桌面事实源，登记而不消费，其桌面消费候对象选择面事实源提案；真实数据走查归 W25，走查前不得称端到端。与 evidence 本体（产线域，v0.1 已冻结随 a5d062d 验收入 main）解耦：本体升版不自动带动本词表行 |

## origin 推送记录

- **2026-09-13（5:1x–5:2x，第 25 代推送门，实质批）**：`f3cd123 →
  e928e08`（7 提交：第十一批验收五支合并 916c5e0/6660d72/9f4cfcc/
  cf22a6e/cc6b6dd＋簿记 e928e08——两实质批＝产线迁移 4 代码文件＋
  桌面 U10 21 代码文件〔含越域追认 2〕，其余 collab/）。
  - **门证据**：r1＝两实质批 diff 全文核/抽查（产线 4 文件全产线域
    ＋契约面零触碰；桌面词表行形状逐字＋壳链路纪律；越域追认计核心
    域意见 ab2a816）；r3＝合并后本机独立复跑（pipefail 严格退出码）
    **cargo workspace 587/0/27 EXIT=0＋clippy --workspace
    --all-targets -D warnings EXIT=0＋contracts 56/56＋desktop
    541/541＋orchestrator-provider 25/25＋desktop check 全链 EXIT=0
    （check:leak 155 零泄漏）＋registry-only exit 0（57 项＋1192
    文件 0 标记）**，与两树声称逐字一致。
  - **CI 回读（e928e08 世代，已回填，两绿）**：rust **34719353867
    ✅**（7m51s，v3 迁移切片 CI 实证，与本地 587/0/27＋clippy 0 一
    致）＋**ts 34719353850 ✅**（4m42s，U10 切片 CI 实证）；
    **collab-registry/schema-vectors 未触发**＝本批零 REGISTRY/
    docs/AGENTS/scripts/schemas 变更，paths 过滤正常。**簿记预期更
    正（诚实）**：wt-main 状态批留言曾预期 collab-registry 触发
    （误以 BOARD 为触发面）——核实其 workflow paths 不含 collab/，
    不触发为正确行为（第 10 代门先例同构）。

- **2026-09-13（2:4x，第 19 代推送门，实质批）**：`c691f5c → <簿记尖>`
  （3 提交：数据冻结批验收合并 7918790〔f84b397：schemas 三方法声明＋
  REGISTRY 两行＋协议本双语＋acquisition 测试头〕＋集成 SCHEMA_EXEMPT
  移除＋本簿记）。
  - **门证据**：r1＝冻结批 diff 全文核（声明变更形状零变更逐行核；两处
    同位置冲突按落账时序解决）；r3＝合并后本机独立复跑 **cargo workspace
    568/0/27 EXIT=0（零测试数变化＝形状零变更实证）＋clippy -D warnings
    EXIT=0＋registry-only exit 0（豁免移除后零报警）**（TS 域零涉免跑
    如实声明）。
  - **CI 回读（a2cc12e 世代，已回填）**：rust **34711263110 ✅**（7m14s
    ＝冻结批 CI 实证）＋schema-vectors **34711263125 ✅**（6m24s，冻结面
    向量 CI 校验通过）＋collab-registry **34711263111 ✅**（16s，豁免移除
    后零报警 CI 实证）；**ts 未触发**＝本批零 TS 文件变更 paths 过滤正
    常（上代 ts 34710631805 ✅ 绿为有效基线）。

- **2026-09-13（2:3x，第 18 代推送门，实质批）**：`025e92b → <簿记尖>`
  （8 提交：第四批五支验收合并 a5d062d/f3d8195/33988a6/675977d/c290f42
  ＋本簿记——三实质批＝产线双冻结 7 文件＋核心 U10 7 文件＋桌面消费
  22 文件＋集成 SCHEMA_EXEMPT 一行，其余 collab/）。
  - **门证据（r1/r3）**：r1＝三实现批 diff 全文核（冻结批形状零变更逐
    行核＋SCHEMA_EXEMPT 域纪律〔产线请求、集成办理〕；U10 分层语义不
    抢跑门③；requestRun 悬空面不登记；保留值呈现纪律）；r3＝合并后本
    机独立复跑（pipefail 严格退出码）**cargo workspace 568/0/27
    EXIT=0＋clippy --workspace --all-targets -D warnings EXIT=0＋
    contracts 50/50＋orchestrator-provider 23/23＋desktop check 全链
    EXIT=0（66 文件/529 测试＋leak 155 零泄漏）＋registry-only exit 0**
    与两树声称逐字一致。
  - **CI 回读（dffb1e3 世代，已回填，四绿）**：rust **34710631818 ✅**
    （8m48s，冻结＋U10＋消费三批 CI 实证，与本地 568/0/27 一致）＋
    schema-vectors **34710631845 ✅**（4m26s，冻结向量＋消费批 CI 校验
    通过）＋**ts 34710631805 ✅**（4m26s，desktop-gateway 词表行 CI 实
    证）＋collab-registry **34710631804 ✅**（18s，SCHEMA_EXEMPT 移除后
    零报警 CI 实证）。

- **2026-09-13（2:1x，第 17 代推送门，实质批）**：`2ae285d → <簿记尖>`
  （3 提交：核心修订批验收合并 61bd798〔c914cf2：provider_host.rs 常量
  ＋三回执＋帧环断言＋schemas 两件版本字面量/maxLength〕＋本簿记）。
  - **门证据**：r1＝diff 全文核（恰数据修订请求四点一处不差：自有常量
    统一三回执＋schema const＋example＋maxLength 去除；残留常量使用处
    逐行核实均属各族自身回执零越界；3288 行 evidence 本体版本锚定正确
    保留）；r3＝合并前分支复跑 **cargo workspace 557/0/27 EXIT=0＋
    clippy -D warnings EXIT=0＋registry-only exit 0**（TS 域零涉免跑
    如实声明）。**诚实注记**：maxLength 512 变更超出数据字面预授权
    （版本字面量）但在其同节明确建议范围（「建议随同一修订批去
    maxLength 随本体同形」），数据追认候其下轮批。
  - **CI 回读（004e797 世代，已回填，四绿）**：rust **34709718624 ✅**
    （8m13s，修订批 CI 实证）＋schema-vectors **34709718634 ✅**（4m35s，
    修订后 request-run 向量 CI 校验通过）＋**ts 34709718623 ✅**（4m35s）
    ＋collab-registry **34709718636 ✅**（20s）。

- **2026-09-13（1:5x，第 16 代推送门，轻量 collab-only）**：`5160d3c →
  <簿记尖>`（12 提交：第二批五支 collab-only 验收合并 33e066c/cb066e1/
  8fbd977/c6588b0/301c98d＋本簿记——零实质文件变更，全部 collab/ 内）。
  - **门证据**：五支非 collab 文件 diff --name-only 逐支核实为零，免全量
    测试成立（既有先例）；merge-tree 预检零冲突（wt-5 合并时 016 文件同
    位置冲突按落款时序解决：数据 1:2x 节在前、桌面 1:4x 节在后，两节全
    文保留）；301c98d＝wt-6 合并提交 amend 附 016 一空行格式修正（零内容
    影响，如实登记）；合并后五树 rev-list 归零。
  - **CI 回读**：推送后**零新 run 触发**＝本批零 crates/schemas/REGISTRY/
    docs/AGENTS/scripts 变更，paths 过滤正常；最新基线仍为第 15 代门
    a35e484 世代四绿（rust 34708670394＋schema-vectors 34708670417＋ts
    34708670350＋collab-registry 34708670356）。

- **2026-09-13（1:4x，第 15 代推送门，实质批）**：`e3b109a → <簿记尖>`
  （7 提交：五笔验收合并 7a262b8/af87747/8398289/50689f8/c659646＋本簿
  记——两实质批＝核心 M7 检查切片 e3ce569〔Rust 9 文件＋contracts＋
  mock＋schemas 草案 4 件〕＋桌面 overlay 接线 b46ae12〔desktop 19 文件
  ＋contracts 2 件〕，其余 collab/ 簿记）。
  - **门证据（r1/r2/r3 增量聚焦法）**：r1＝两实现批 diff 全文核（域纪律
    零跨域；is_mutating 闭式零触碰；vua.inspection.unavailable/零收据不
    发布/DRAFT 不冻结＝诚实边界逐项在位；overlay 两态判别不伪装空快照、
    取消走既有命令面零专有词表）；r2＝wt-3 增量机械核验（零新 hex 色
    值、零新 CSS 变量、代码区新增中文全在注释内）；r3＝合并后本机独立
    复跑（pipefail 真实退出码，隔离 CARGO_TARGET_DIR）**cargo workspace
    557 通过/0 失败/27 忽略 EXIT=0（534 基线＋23，逐文件属性计数核实）
    ＋clippy --workspace --all-targets -D warnings EXIT=0＋contracts
    48/48＋orchestrator-provider check 23/23（tsc 零错）＋desktop check
    全链 EXIT=0（typecheck＋vitest 64/513＋build＋boundary＋i18n＋
    contrast＋leak 155 零泄漏）＋registry-only exit 0**。
  - **簿记更正（诚实）**：核心声称新增 22 测试（核心 12＋帧环 10）——
    逐文件 `#[test]`/`#[tokio::test]` 增量计数实测核心侧 13
    （inspection_evidence 11＋editor_targets 2）＋帧环 10＝23，557 与
    534＋23 吻合；覆盖面与核心列举一致、无缺失，计数误差系核心树簿记
    （已留言回执）。对比基点更正：第 14 代推送基点 9e9326a 不含数据批
    （f209182 在其后），本轮正确基线＝e3b109a 世代 534。
  - **CI 回读（a35e484 世代，已回填，四绿）**：rust **34708670394 ✅**
    （6m19s，核心 M7 检查切片 CI 实证，与本地 557/0/27 一致）＋
    schema-vectors **34708670417 ✅**（5m35s，inspection-queries 草案
    request-run 三向量 CI 校验通过）＋**ts 34708670350 ✅**（4m34s，
    contracts 联合增长＋mock 双分支 CI 实证）＋collab-registry
    **34708670356 ✅**（14s）。

- **2026-09-13（1:1x，第 14 代推送门，实质批）**：`9e9326a → <簿记尖>`
  （约 12 提交：六笔验收合并 8d31e67/122d037/a467a5f/7b84700/f209182＋
  集成落地簿记——两实质批＝桌面 ts 修复 73f8e7a〔2 文件〕＋数据
  inspection-queries 实现批 2e3db58〔schemas 9 件＋消费测试〕，其余为
  collab/ 簿记＋scripts/collab-brief.mjs 022 豁免一行）。
  - **门证据**：r1＝两实质批 diff 全文核（域纪律零跨域；闭集纪律；双验证
    钉死；类型收窄不放宽）；r3＝合并后本机独立复跑（pipefail 真实退出码）
    **cargo workspace 534/0/27 EXIT=0＋clippy -D warnings EXIT=0＋递归全链
    orchestrator-provider 23/23＋desktop check 全链（check-leak 159 零泄漏）
    EXIT=0**——上轮 ts 红（34704078791）根因修复本机全链实证恢复；
    registry-only 51/51 exit 0（022 豁免生效）。
  - **CI 回读（e68a1fe 世代，已回填，四绿）**：rust **34706984350 ✅**
    （8m49s）＋schema-vectors **34706984300 ✅**（4m23s，inspection-queries
    六向量 CI 校验通过）＋**ts 34706984286 ✅**（4m36s，上轮
    34704078791 红就此恢复——mock-provider 分支＋双键分派 CI 实证）＋
    collab-registry **34706984346 ✅**（15s，022 豁免落地零带红窗口达成——
    同轮合并实现批＋豁免行的时序设计按预期兑现）。

- **2026-09-13（0:5x，第 13 代推送门，实质批）**：`d6646c5 → <簿记尖>`
  （约 20 提交：五笔验收合并 1d3509b/33c4912/7d63abe/c6284f4/3881cfa＋本簿
  记——三实现批 wt-2 overlay wire／wt-6 editor_verify／wt-4 Bridge v3＋两
  collab 状态批）。
  - **门证据（r1/r2/r3 增量聚焦法）**：r1＝三实现批 diff 全文核（域纪律：
    零跨域文件；v2 冻结件零触碰；诚实边界——vua.overlay.unavailable／
    拒绝码闭集／C# EditMode 未运行验证申报——逐项在位）；r2＝全增量机械
    核验（零 hex 色值、零 CSS 文件；代码区新增中文仅 Bridge C# 诊断消息，
    照该文件 v1/v2 既有惯例且自带「不是官方评级/判定」诚实措辞）；r3＝合
    并后本机独立复跑两轮（pipefail 真实退出码）**cargo workspace 522/0/27
    →528/0/27＋clippy --workspace --all-targets -D warnings EXIT=0＋
    @vua/contracts check 42/42 EXIT=0**，与三树声称逐字一致；registry
    51/51 exit 0。
  - **方法学更正（如实）**：本轮首次后台复跑的退出码经管道被 tail 吞掉
    （CARGO_TEST_EXIT 实为 tail 退出码）——发现后即以 `set -o pipefail`
    严格重跑全部三项取代之；上表证据均取自严格重跑，首次弱证据不作数。
  - **CI 回读（198154b 世代，已回填）**：rust **34704078750 ✅**（9m0s，合
    并后 Rust 全量 CI 实证，与本地 528/0/27 一致）＋schema-vectors
    **34704078754 ✅**（6m24s，overlay-snapshot 六向量＋unity-bridge v3 十一
    向量 CI 校验通过）＋collab-registry **34704078771 ✅**（15s）；**ts
    34704078791 ✗ 红——如实登记**：`packages/orchestrator-provider/src/
    mock-provider.ts(147,49)` TS2366（函数缺结束 return）——overlay.getSnapshot
    加入 @vua/contracts 请求联合后 mock-provider 方法分派不再穷尽。**归因＝
    跨批衔接缺口（#22「live/fixture value 形状一致性」教训同族）**：核心批
    增联合成员、mock-provider（DEV fixture provider，近期全为桌面作者）未随
    批增分支；**集成验收证据面缺口如实申报**：r3 只复跑了 @vua/contracts 包
    （42/42），未跑 pnpm 递归全链（orchestrator-provider 包检查在其内）。
    **路由 [→桌面]**：消费接线批（在途）追平 main 即会撞同一错误——批内补
    `overlay.getSnapshot` 分支（fixture 诚实形态桌面自决，020 先例）或先出
    独立小修复批，恢复 ts 绿前 main 视为带红运行。**验收清单增补（集成自
    检）**：contracts TS 面联合增长类批次，验收 r3 须含 pnpm 递归全链（至
    少 orchestrator-provider＋desktop check），与 #22 教训并档。

- **2026-09-13（0:1x，第 12 代推送门，实质批）**：`877d4f1 → <簿记尖>`
  （3 提交：wt-5 状态批验收合并 8aabf6d＋**wt-3 overlay 切片验收合并
  d706beb**＋本簿记）。
  - **门证据（r1/r2/r3 增量聚焦法）**：r1＝12b5592 全文核（范围纪律＝
    桌面域＋contracts TS 面桌面登记域＋REGISTRY/架构文档随行，零 Rust/
    零 schemas；决策面纯函数＋接缝分离；assertLocalSender；窗口关闭/
    退出语义；wire 零预接）＋wt-5 状态批 collab-only 核实；r2＝15 文件
    +401/−113 增量机械核验（零 hex 色值、零 CSS 文件、零 forest 引用、
    新增中文全在注释/i18n 值内）；r3＝合并后本机独立复跑 **desktop
    check 全链 EXIT=0＋vitest 63/505（500 基线＋5 新增）EXIT=0＋
    contracts 38/38＋registry 51/51 exit 0**，与桌面声称逐字一致；Rust
    域零涉免跑如实声明。
  - **合并瞬间追加批（如实登记）**：d2b063e（wt-3 状态批，23:22:49 提
    交）在合并执行时已上分支，随合并尖带入；合并后 rev-list
    main..slot/wt-3＝0 无遗漏（4d346f8 先例同构）。
  - **CI 回读**：ts **34702364089 ✅**（check 4m8s，桌面/contracts 变更
    触发）＋collab-registry **34702364112 ✅**（17s，REGISTRY 变更触发）；
    rust/schema-vectors 未触发＝本批零 crates/schemas 变更，paths 过滤
    正常（既往基线 rust 34638793810＋schema-vectors 34638793850 绿不变）。

- **2026-09-12（23:0x，第 11 代推送门，轻量 collab-only）**：`11745df →
  fb3c796`（2 提交：slot/wt-3 状态批验收合并 7cfb796＋slot/wt-4 状态批
  验收合并 fb3c796；两支合并前 diff --name-only 逐支核实均仅各自状态
  文件，merge-tree 预检零冲突，免全量测试成立）。
  - **CI 回读**：推送后**零新 run 触发**＝本批零 crates/schemas/REGISTRY/
    docs/AGENTS/scripts 变更，paths 过滤正常；最新 run 仍为操作者批
    11745df 世代 **collab-registry 34678057937 ✅**（ADR＋裁决登记触发，
    2026-09-12 14:24 本地，非本轮）——ts 34661454060 绿等既往基线不变。
  - **附带事实**：操作者批（698e738 ADR＋11745df U10 裁决登记）随其推送
    已触发 collab-registry 绿（同上 run），登记表校验 51/51。
  - 本簿记批（BOARD＋wt-main 状态）随下批上行。

- **2026-09-12（08:2x，第 10 代推送门）**：`23bab08 → 169ecbe`（7 提交：
  wt-2 追平合并＋状态批 ccd2c69、三验收合并 d1b29c7/a1a40ac/d97ae9f、
  簿记 169ecbe）。
  - **门证据（增量聚焦法）**：r1＝实质批 9e2082f diff 全文核（isTaskSnapshot
    contractVersion 必需键与 #22 验收 L 级观察逐字对应；缺失/异版→诚实
    unavailable 形态不齐路径；回归 1 例 2 断言；范围纪律 2 桌面域文件、零
    contracts/Rust）＋wt-2/wt-5 collab 批 diff --name-only 核实（wt-2 含
    017 内联表态——合并意图「仅状态文件」登记偏差如实声明，均 collab/
    实质 0）；r2＝增量机械核验（非 collab 变更仅 9e2082f 两文件 +23/−2：
    零色值/CSS 变量新增、零 CSS 文件、代码区非注释零中文串新增——新增
    中文均在测试注释内）；r3＝合并后本机独立复跑 **vitest 62 文件/500
    测试（499 基线＋1 新增）EXIT=0＋typecheck EXIT=0**，与桌面声称逐字
    一致；build/boundary/i18n/contrast/leak 零涉（diff 无 UI/i18n/CSS/
    指纹面变更）如实声明；Rust 域零涉免跑。
  - **CI 回读（169ecbe 世代）**：ts **34661454060 ✅（4m38s）**；rust/
    schema-vectors/collab-registry 均未触发＝本批零 crates/schemas/
    REGISTRY/docs/AGENTS/scripts 变更，paths 过滤正常。**簿记预期更正
    （诚实）**：推送前簿记曾预期 collab-registry 触发（误以 017 proposal
    为触发面）——核实 workflow paths（REGISTRY/docs/AGENTS/schemas/
    brief 脚本）不含 collab/proposals/，不触发为正确行为。
  - **附带事实**：第 9 代门记录 23bab08 随本批上行 origin。
  - **M7 overlay wire 面批 1 激活**：核心领取声明随 d1b29c7 落 017 内联
    线程（下一工作时段开工）；wt-3/wt-2 互等僵局解除。

- **2026-09-12（08:0x–08:1x，第 9 代推送门）**：`db47ad9 → 59d371c`（5 提交：
  第 8 代簿记 db47ad9 上轮落库未推送随本批上行＋三状态批验收合并
  b4f5759/c951e6c/ddf104c＋本簿记 59d371c）。
  - **内容**：slot/wt-2（领先 2＝追平合并 b6e9972＋状态批 40684cd）、
    slot/wt-3（1aab54d）、slot/wt-5（d31e708）三状态批 --no-ff 验收合并，
    零冲突；合并前核对三分支领先内容均仅各自状态文件
    （diff --name-only），实质 0，collab-only 免全量测试成立。
  - **CI 回读（59d371c 世代）**：**四工作流均未触发**（gh run list 复查
    两次，最新 run 仍为 51af259 世代 ts 34659753558 绿）＝本批零 crates/
    package 代码/REGISTRY/docs 变更，paths 过滤正常；51af259 世代 ts 绿
    ＋0ca1882 世代 schema-vectors 34659100916 绿为未变更面有效基线。

- **2026-09-12（07:5x–08:0x，第 8 代推送门）**：`0ca1882 → 51af259`（3 提交：
  wt-2 状态批＋追平合并、**b4dbba0＝#22 桌面消费批 867ccda 验收合并**、
  簿记 51af259）。
  - **门证据（3/3，增量聚焦法）**：r1＝867ccda 全文核（端口任务化消费
    逐键对齐 provider_host.rs Done payload {schemaVersion,operation,result}
    ＋TaskSnapshotV01 冻结面；诚实 unavailable 映射完备；fixture 恒诚实
    不可用＝020 授权）＋wt-2 collab 批（仅状态文件）＋簿记批；r2＝增量
    机械核验（6 文件 +591/−617：零色值/CSS 变量新增、零 CSS 文件、代码
    区非注释零中文串新增；check:leak 159 生产构建零命中随全链）；r3＝
    **桌面 check 全链 EXIT=0**（typecheck＋vitest＋build＋boundary＋i18n
    ＋contrast＋leak）＋**vitest 单独 pipefail 复跑 62 文件/499 测试
    （486 基线＋13 新增）EXIT=0**＋contracts check EXIT=0；Rust 域零涉
    （增量无 crates/schemas 文件）免跑如实声明。L 级观察（不阻断）：
    isTaskSnapshot 未检 contractVersion（信封守卫已验）——登记入验收
    记录，桌面随手批可补。
  - **CI 回读（51af259 世代）**：ts **34659753558 ✅**（check 作业绿）；
    rust/schema-vectors/collab-registry 未触发＝本批零 crates/schemas/
    REGISTRY/docs 变更，paths 过滤正常（29b6f03 世代四绿＋0ca1882 世代
    schema-vectors 34659100916 绿为未变更面有效基线）。
  - **#22 链全环闭合**（裁决→核心提案冻结 0866908→核心填充→桌面消费
    b4dbba0），开放问题 #22 行关闭。不宣称端到端（live 走查归 W25
    用户延期窗口）。

- **2026-09-12（07:5x，第 7 代推送门）**：`27418e9 → 29b6f03`（7 提交：
  wt-2 #22 兑现批 d02bd09＋三合并 0866908/fa87b8d/9186785＋簿记 29b6f03
  及 slot collab 件）。
  - **门证据（3/3）**：r1＝d02bd09 全文核（schema 冻结件 if/then 不变量
    ／六向量 3 正 3 负／provider_host 35 行／TS 面／协议双语修订／
    REGISTRY 行／proposal 020）＋两 collab 状态批；r2＝18 文件 +999/−132
    增量机械核验（零色值/CSS 变量；CJK 新增均文档类）；r3＝cargo
    **68 套件/505 通过/0 失败**（隔离 CARGO_TARGET_DIR、pipefail 真实
    退出码）＋clippy -D warnings 零告警＋@vua/contracts **38/38**＋
    registry **50/50**（application-contract 新行核验）；桌面零变更免跑
    如实声明。
  - **CI 回读（29b6f03 世代四绿）**：rust 34656656801（5m55s）＋ts
    34656656755（3m51s）＋schema-vectors 34656656811（4m32s）＋
    collab-registry 34656656853（20s，REGISTRY/proposal 变更触发）。
  - **#22 链**：冻结达成＋核心填充落地，余桌面消费批（保持开放至消费
    批验收）。

- **2026-09-12（06:5x–07:1x，第 6 代推送门）**：`92dea7f → d8efbe3`（9 提交
  ／10 文件：wt-3 B5② 文案批 9710c18、wt-6 v0.2 引用跟随 c24355e、wt-4
  状态批 f534b78、三验收合并 219f3e3/33f9060/fa86bb0＋簿记 d8efbe3）。
  - **门证据（3/3，增量聚焦法）**：r1＝两实质批 diff 全文核＋collab 三件
    （B5② 四语文案与用户裁决逐字对齐；v0.2 引用跟随核非放宽）；r2＝增量
    机械核验（10 文件 +172/−153：零色值/CSS 变量新增；CJK 新增仅 ja/zh
    两行＝B5② 裁决文案出处有据；check:leak 159 生产构建零命中——
    **forest 全量指纹重提本轮不可执行**，草稿源不在本机任一 worktree，
    方法边界如实声明）；r3＝桌面 check 全链 EXIT=0＋vitest 61 文件/486
    ＋cargo 67 套件/501 通过/0 失败（隔离 CARGO_TARGET_DIR、pipefail
    真实退出码）＋clippy -D warnings 零告警＋registry 49/49。
  - **CI 回读（d8efbe3 世代三绿）**：rust 34655323316（6m18s）＋ts
    34655323314（4m25s）＋schema-vectors 34655323504（4m21s）全绿；
    collab-registry 未触发＝本批零 REGISTRY/docs 变更，paths 过滤正常。

- **2026-09-12（05:3x–05:4x，第 5 代推送门；本节当轮漏登，随第 6 代补记）**：
  `388d0d3 → bb49bc2`（2 提交：22ca5b9 D-6 验收合并＋bb49bc2 簿记）。门
  证据（r1 17 文件逐文件审／r2 forest 增量扫描 364 指纹新增行零命中／r3
  桌面 61/486＋contracts 35＋orchestrator-provider 23＋registry 49/49，
  Rust 域零涉）与 CI 回读（ts 34648962676 绿；rust/schema-vectors/
  collab-registry 未触发＝paths 过滤正常）全文见 `collab/state/wt-main.md`
  92dea7f 世代记录。

- **2026-09-12（04:5x–05:0x，第 4 代推送门）**：`origin/main=2de1755 →
  a8e0c5d 世代`（**29 提交／51 文件／+2532−602**：BG-21 校验器修复 b86a3db、
  #7 瞬败修复 d78c43b、project-ops v0.2 升版 10c0d68、桌面 P2 30e4f1a、
  B5① 文档 368c277、状态批×3、簿记）。
  - **门证据（3/3 全过）**：`collab/reviews/2026-09-12-push-review-r1e/r2e/r3e_ZH.md`
    ——r1e：四把合并刀逐切片无夹带、project-ops 守卫闭集逐字前缀只增不改、
    setNote 不改 markedAt 三层落实、P2 收窄纪律逐项吻合、BG-21 五步矩阵
    独立复现；r2e：**forest 零泄漏硬门通过**（1094 被跟踪文件、十类独立
    指纹、阳性对照先行；新见两句同族重合闭合为仓库→草稿方向且已在 origin）
    ＋敏感扫描无阻断；r3e：cargo 67/501×2 逐位一致＋clippy -D warnings 零
    告警＋桌面 check 61 文件/483 绿＋registry 49/49。
  - **记账更正（r3e 指出）**：501＝真实基线 496＋5（此前「497 基线」宣称
    ±1 误差）；r1e O-2（BG-21 行尾竖线截断亚型报列数少 1）留档随下次触改。
  - 本簿记批随推；推送后 CI 回读（rust/schema-vectors/ts）。

- **2026-09-12（02:5x 工作时段）**：`12a6a45 → ff2f2c4`——**9 提交**上 origin
  （实质仅 ce91403 桌面 UX 四缺口批〔5809d37 验收合并〕；其余 8 提交为
  collab/ 簿记，含 wt-5/wt-6 状态批随推——wt-6 合并批由该树在本主库并发
  执行〔collab-only 免测惯例〕，推送时随本门一并上行）。
  - **门证据（集成单轮增量复审）**：`collab/reviews/2026-09-12-push-review-
    integration_ZH.md`——**形态声明：本轮为集成单轮核查，非 r1b/r2b/r3b
    式三独立 Reviewer 面板**；客观项覆盖同构：增量 diff 逐块审（Cookie
    持久化有界 180 天/清单内/本机分区/不循环；环境注入清洗后补三根、凭据
    仍剥离；IPC 守卫齐；契约 additive）＋forest 零泄漏硬门（指纹全项对
    1061 被跟踪文件零命中）＋敏感信息扫描零阻断＋registry 46/46 两轮
    exit 0＋cargo 67/495/0 三轮一致＋clippy -D warnings 零告警＋桌面 check
    EXIT=0（58/463＋leak 159 零命中）。L 级观察 2 项不阻断（r*b 报告内
    路径字样属审阅记录文本；.zcode/agents 消毒评估维持挂起）。
  - **CI 事实（诚实补记）**：本轮推送触发 ts **34634138971 ✅**（4m41s）；
    rust/schema-vectors 因 paths 过滤未触发——但其 **12a6a45 世代 run 双红
    未消**：rust 34630656044 ✗＋schema-vectors 34630656005 ✗，同根失败＝
    `the_five_guards_refuse_typecally`（import_copy.rs:305 `TargetInsideSource`
    守卫在 CI runner 未拒绝；本机三轮绿；本轮增量未触碰该 crate）→
    **BG-18**。**流程更正（如实）**：上轮推送记录的「门证据 3/3＋本机全绿」
    未含 CI 结果回读维度（run 在推送后才出）；自本批起推送门包含「推送后
    CI 回读＋红态登记」步骤。
  - **BG-11 全额销账**（wt-6 全范围验证 0dc00cb＋集成实文核验，见工单表）；
    wt-5 lint 观察登记为 **BG-19**（未复现，随 BG-18 修复后的首个 rust run
    取 CI clippy 事实）。
  - 同窗备注：ff2f2c4 合并提交信息宣称「collab only, tests waived」经本门
    核验属实（07c31c5..ff2f2c4 零非 collab 文件）。
  - **同窗三轮补充复审（集成并发轮，03:2x）**：`collab/reviews/2026-09-12-
    push-review-r1c-r2c-r3c_ZH.md`——另一集成会话同窗独立执行 r1b/r2b/r3b
    式三轮（对象同世代），与本单轮门互为补强：r1c **registry 负例验证**
    （改坏 product-boundary 版本行→exit 1 定位行→复原干净；单轮门仅两轮
    正例 46/46）＋UX 批五项宣称逐项 diff 对照；r2c 增量指纹复扫（命中全为
    r2b 报告自引用，排除 collab/ 后零命中）＋O-1 关闭确认（fixture-release
    本机路径已随 12a6a45 消毒清零）；r3c cargo 两轮**逐位一致 67/495/0/26**
    ＋clippy 零告警（**BG-19 点位本机 rustc 1.97.1 未复现**，观察态维持）＋
    桌面 check EXIT=0（vitest 58/463＋leak 159）。同批簿记：工单表第二行
    BG-18（compose-draft-store）重编号 **BG-20**（消除与 CI 工单重号）。
- **2026-09-12（01:20–01:35 工作时段）**：`7da1b5f → 12a6a45`——**353 提交**
  上 origin（自 09-09 起积压清零；推送后 ahead 0/behind 0）。
  - **门证据（3/3 全过）**：增量复审 `collab/reviews/2026-09-12-push-review-r1b/r2b/r3b_ZH.md`
    ——r1b：内容逐项与提交宣称一致、诚实纪律（016 草案标注、official_sdk_rating
    零消费）、registry 负例独立验证（改坏一行→exit 1 定位到行）；r2b：
    **forest 零泄漏硬门通过**（草稿 22 CSS 变量＋15 组件类型＋48 图标名＋
    24 数据串等指纹集，对全部 **1057 个被跟踪文件**零命中）＋敏感信息扫描
    无阻断；r3b：cargo workspace **67 套件/495 通过/0 失败两轮逐位一致**
    ＋clippy 零告警＋桌面 check EXIT=0（隔离 CARGO_TARGET_DIR 避让运行中
    的桌面应用——N-1 经验）。
  - **O-1 消毒批（12a6a45，推送前最后提交）**：`fixture-release.ts` 两处
    projectRoot＋`nmss-demo-01`＋三处 DEV 注释的真实工程名（Meiyun/NMSS）
    →合成占位（`C:/Users/demo/.../SyntheticAvatarA|SyntheticOutfitB`、
    `demo-outfit-01`）——按 AGENTS「付费资产/用户工程内容不出本地」红线，
    r1b/r2b 共同建议、操作者裁量执行；`docs/research/` 公开 BOOTH 商品锚点
    属许可类保留（r2b O-3 备忘维持）。两份复审报告中的路径引用字面值已
    同步脱敏（集成注记）。
  - **遗留观察（不阻断，后续批处理）**：r1b L-1/r2b O-2——`.zcode/agents/`×7
    已入库且含本机路径，集成评估按 BG-13 方式消毒或改 .gitignore（需一次
    有意决策）；r3b N-2 默认测试集已零真实 EAC 交互（M 门真机清单在册）；
    N-3 ipc_002 顺序护栏、N-4 尾随逗号外观项归桌面顺手批。
    **【路由更正（2026-09-12 集成，桌面请求核实成立）】**：N-3/N-4 两处
    实为**核心所有权域**——`orc_ipc_002_*` 测试在
    `crates/orchestrator/tests/`（environment.rs/runtime.rs）、尾随逗号在
    `crates/provider-host/tests/environment_snapshot_wire.rs`；原「归桌面
    顺手批」路由错误，更正→核心（随手批节奏自决；r3b 原报告维持
    「非阻断/可接受/无害」定性）。桌面不代做、不越权。
  - **同窗验收（推送后合并，未含于本次推送）**：桌面 UX 四缺口批
    ce91403 验收合并 **5809d37**（证据：cargo 67/495 两轮一致＋clippy 0＋
    桌面 check 463/leak159 绿）——**下一推送门对象**。

## 开放问题（跨树）

| # | 问题 | 归属 | 载体 |
| --- | --- | --- | --- |
| 1 | I-1 真 Unity 矩阵 | 集成树 | **✅ 已交付关闭**（16/16 真机通过，合并 5ccace6；验收=证据清单核实+抽查终态+集成独立复验 1 格） |
| 7 | 三例均已命名并根因修复：① ph_010_mutation_gate（ec6b61d，测试尾部竞态改轮询）；② 运行时 Completed 发布竞态（49d1dac：publish 移入 tasks 锁内，真实时序窗口修复）；③ **CI ph_012（0a56f19，2026-09-08 定位）**：拉取 CI 日志（run 34137292736）核实 panic 实为 1579 行 "lease released after success"（非 15s deadline）——worker 按 safe_to_stop 设计先落终态再释放 mutation gate（marker/lock 文件 I/O 先于 SQLite 删除），测试看到终态后立即断言租约已清，2 核负载下输掉竞态；产品顺序正确，测试改为有界轮询等释放（保留原 panic 消息供证据可比）。残余观察（如实）：2026-09-08 本机 8 轮全量中 1 次 14/1 瞬败（套件约 0.19s，身份未捕获——输出未留存），随后 7 轮全绿；不做猜测性修复，再现即按程序取全量日志定位 | 核心 | ③ 修复已随批合并（80ad6e7）且 **CI 复跑绿**（rust run 34146584951，2026-09-08；同批 ts 34146584926 ✅、schema-vectors 34146584940 ✅）——本例关闭；残余观察态维持，再现即按程序带全量日志重开——**再现＋身份首次捕获（2026-09-12 r3d 推送门）：`crates/acquisition/warehouse_import.rs:546` import_copies_a_folder_into_an_entry_without_touching_originals 全量并行跑瞬败一次（cargo exit 101），定向复跑×3＋后续两轮全量全绿；acquisition 本世代零改动；疑似 unique_dir 纳秒碰撞→共享目录清理竞态（r3d 报告附分析）；完整日志留档 `collab/reviews/evidence-r3d-flaky-warehouse-import.log` → [数据] 按 #7 协议带日志定位修复——**✅ 本例修复交付验收关闭（2026-09-12，数据 cd3eead、集成验收合并 d78c43b）**：根因实证＝测试 helper unique_dir 纳秒时间戳＋跨测试共享 tag——同 tick 两测试共享同一目录（create_dir_all 对已存在路径成功），先收尾方的 remove_dir_all 删走对方复制文件，与「导入报成功、文件缺席」表型吻合；**红证据**＝旧命名 20 跑 5 败复现碰撞，**绿证据**＝加固后 20/20。修复＝acquisition 全部 temp-dir 测试点收敛到共享 `test_support::unique_dir`（pid＋进程内 AtomicU64 serial＋纳秒，cfg(test) 门控）＋回归压力测试钉死（8 线程×64 次 barrier 起跑 pairwise-distinct）；**顺手生产加固**＝generate_vpm publish_root 命名同款 pid＋serial（消除同 tick 并发作业别名风险，注释钉死理由）。集成验收：diff 审零契约/守卫/词表变化（全在数据域 crates/acquisition）＋合并后本机复跑 **67 套件/497 通过/0 失败＋clippy -D warnings 零告警**（隔离 CARGO_TARGET_DIR）。**簿记更正（诚实，数据发现、集成核实）**：上轮「完整日志留档」表述不准确——该 log 被 .gitignore `*.log` 规则（第 28 行）排除、从未入任何分支（仅本机工作目录存在）；在树证据实为 r3d 报告内联分析（`collab/reviews/2026-09-12-push-review-r3d_ZH.md`）；日志维持不入库（私有日志红线保守读法）。残余观察态照旧：再现即按程序带全量日志重开** |
| 8 | CI ts 徽章红：i18n 术语注解测试环境耦合——`current-table.ts` 按 `navigator.languages` fallback 选表，CI runner 为 en-US → en 表注解空串，3 个期望中文注解的测试失败；本地绿系隐性依赖开发机 zh-CN 系统语言。修复=f4d288d（测试 vi.mock 显式固定 zh-CN 表，生产代码零改动） | 桌面 | **✅ 关闭（2026-09-08）**：随 97390f8 入 main，CI ts workflow 复跑绿（run 34146584926） |
| 9 | 术语修正（**VPM = VRChat Package Manager／VPM 包 = VPM package**，W15 走查硬裁定）需评估受管文档面：product-boundary 双语、协议文档措辞核查；**v0.5.0 已发布文本不追溯**；M4 交付文档须用对术语；应用内 i18n/注释随 W15 重做切片由桌面按裁定修正 | 集成 | **✅ 彻底闭环（2026-09-08）**：集成域活文档修正 8011af4（product-boundary 1.1.1＋outline 2.0.6 双语）；应用面四语 i18n＋注释随桌面重做批 4fb6411；产线域 amf-unity **1.0.1** 镜像修正随批合并（7a8e72f）；design-standard 条目级旧形态随 W15 重做改版（桌面，重做批已移除条目选择器）。不追溯面：v0.5.0 发行文本、冻结协议文档（升版时修正，含 008 → v0.3 若立案）、warehouse-layout ADR |
| 10 | proposal 008：全局「生成后删除原始素材文件」开关的协议面（三路径；数据**正式表态路径 a**＝桌面偏好＋桌面编排零协议影响，反对 c；衍生变更〔007 偏好开关取代〕数据认可；**核心表态待**）→ 集成仲裁＋门序归属（路径 a 接线切片随 M4 收尾批或 M5 首批） | 核心 → 集成 | **✅ 已接受·路径 a（集成仲裁 2026-09-08，f37f752 后落提案）**：两域表态一致；接线＝桌面 Done 回执后逐条 deleteOriginals（权威边界照核心裁决）；路径 b 备而不用（用户裁决＋编排窗口语义设计物双前置）；路径 c 拒绝；007 取代确认；**接线切片归 M5 首批（桌面）**，M4 门验收不以此为前置；v0.2 维持冻结，零 wire/Schema 变化 |
| 11 | proposal **009**（产线，W21 契约先行）：Unity Bridge v2 升版骨架——现状审计＋五点骨架＋核心四问表态；**v2 契约草案已就绪并验收合并**（v1 超集＋execute_production_job/restore_project＋16 向量＋6 消费测试，集成复跑 356/0，后随 v2 修订 367/0）；互审点 1–5 **全部关闭**（1/2/3 产线互审关；4 rejected 收据语义＝012 §4.3 按产线语义收口；5 恢复点登记面＝012 §3.1 兑现） | 产线 ↔ 核心 | **互审收口（2026-09-08）**：核心已确认 planRef job 目录文件形态建议（#14 ①）＋rejected 豁免——**v2 侧无待审项，产线可冻结 v2 并开工 C# 侧**；冻结批交集成验收（契约表升版随冻结批） |
| 12 | proposal **010**（核心，W19 合并设计）：素材导入时自动生成挂点与编排语义——核心代码审计**导入面零生产调用、仓储条目零生产创建路径**（W19 真正前置＝导入面接线本身）；**集成已裁：路径 A**（挂点在导入任务条目落成点，同 TaskRuntime）＋**W18/W19 同批门序**（导入面是 W18 演示闭环前置）；六条编排语义硬承诺照单采纳；warehouse.import 新命令面冻结硬前置归数据（词表归属数据裁决） | 数据/桌面 → 集成 | **✅ 已接受·收口（2026-09-08）**：数据六点（**bdl-commands 升 v0.3** 承载 import、读时求值为数据明确偏好、六承诺认可、correlation 面归属意见）＋桌面三项（导入 UI 系统文件夹对话框优先/任务中心九态复用＋关联标注条件渲染/标注移除双条件）全部一致无保留；收口裁决＝**v0.3 冻结 M5 首批内先行**＋importCorrelationId 归属随 v0.3 冻结定＋执行序①v0.3 冻结→②核心 wire/挂点→③桌面呈现；改号簿记见提案注记（与产线 009 撞号，产线在先保 009）。**补记**：数据转正钉死 `importCorrelationId` 进 v0.3 词表（词表主导权行使），集成确认采纳 |
| 13 | proposal **011**（核心，W20 设计稿＝009 互审上游）：Recipe v0.3（locked 升格版本锁＋warehouse: 来源＋constraint/locked 分离）＋Local Resolution v0.3（effectiveArtifactMode 选择＋clean 守卫＋fallbackUsed 如实记录）＋**批准计划 approved-plan v0.3 ★新产物**（planHash 锚＋jobs[].resolvedSource＋fingerprint 预检＋无 executed 态）＋production-use-case v0.2 词表（§7 收敛决议：save 整文档＋读面闭集同构 catalog 先例） | 产线/数据/桌面 → 集成 | **✅ 收敛＋W20 冻结切片已验收合并（2026-09-08，0400bee：集成复跑 367/0＋clippy 零告警）**：三域表态齐；schemas/recipe/v0.3/ 三 Schema＋3 正例＋4 负例＋5 项消费测试入树；planRef 形态确认随冻结切片办理（#14 ①）——**W21/W24 实现的硬前置就绪** |
| 14 | proposal **011** 收敛补记＋W20 冻结切片交付（核心，2026-09-08）：①互审收口——产线两件确认已核（planRef＝job 目录文件投影＋planHash 本地校验采纳；rejected 豁免确认，v2 侧无待审项）；②收敛决议——四产物存储面＝AMF 生产持久域文档库形态（BuildRecordStore 先例，SQLite 表族不扩）、baseRevision 乐观并发归 production-use-case v0.2 命令面、读面闭集定稿、W23 解锁（数据）；③**W20 冻结切片交付**：schemas/recipe/v0.3/（recipe〔sourceRef warehouse 形态＋vpm_copy 锁对象〕＋local-resolution〔sourceKind/fallbackUsed/evidenceIds〕＋**approved-plan 新增**〔planHash 锚＋jobs[].resolvedSource＋无 executed 态＋kind 闭集〕）＋3 正例＋4 负例＋消费测试 5 项（crates/orchestrator/tests/recipe_v03.rs） | 核心 → 集成 | **✅ 已验收合并（2026-09-08，0400bee：集成复跑 367/0＋clippy 零告警）**——W21/W24 硬前置就绪 |
| 15 | proposal **012**（核心，W22 设计稿）：Build Record v0.3——★planId/planHash/planSchemaVersion 授权锚链＋★jobs[] 逐作业收据聚合（Bridge v2 转抄）＋★planDeviations 类型化计划偏差＋★recoveryPoints[]（互审点 5 兑现）＋recovery 段＋evidenceSummary（evidenceIds 引 W23，本体不内联）＋status 词表加 recovered；语义裁决四条（恢复点登记面/类型化偏差/转抄不解释/存储面沿 011 决议①） | 产线/数据/桌面 → 集成 | **✅ 已接受·W22 冻结切片验收合并（2026-09-08）**：产线三核验点全确认（两澄清照单：有序前缀/1:1 来源粒度）＋两缺口全部吸收——jobs[] 补 `commandId`（收据身份/比对键）＋`replayed`（重放误记可发现）；数据三点确认（evidenceIds 交界/Record 冻结不等 W23/evidenceSummary 最小形状）；集成验收复跑 **370/0**＋clippy 零告警——**recipe v0.3 套件收尾件落地，套件四件全冻结**；W22 实现切片（provider 侧记录面）按锚点后续；桌面 record 读面随 W24（recovered 呈现语义 W24 表态） |
| 16 | proposal **014**（环境，M6 T-A 延伸）：**「导入为 VUA 管理的副本」写路径**任务化语义——R1 语义＝1.2.0 五项规格照录不扩展（新项目目录＋排除可再生目录与 `.vua/`＋完整 Inspect＋来源关系记录）；R2 确认链（计划含磁盘占用实际统计→用户显式确认→执行→复检）；R6 裁决流程＝核心（任务面/路由/词表）与桌面（交互形态——与 T-C 四项交互形状确认合并处理）表态 → 集成仲裁 → 语义冻结 → 环境实现 | 核心/桌面 → 集成 | **✅ 已接受·语义冻结＋实现验收合并（2026-09-09）**：词表行＝独立 `schemas/project-ops/v0.1/`（project. 前缀，写命令 `project.import-copy`；与 013 读面平行读写分线）；九态任务＋**不隐式续传**（半成品 inspect_required，清理/放弃均用户显式触发）＋新项目 `.vua/` 锁（原项目全程只读）＋守卫 provider 侧任务内；确认链＝要点确认面板（桌面形态采纳）＋桌面字段请求已落字段（estimatedBytes/excludedEntries/targetPath）；审计收据与 W23 证据引用同构；**实现批验收合并（226dd41：import_copy.rs 607 行＋342 行测试＋词表冻结件＋向量 7 件；集成复跑 428/0）＋七项拒绝码闭集仲裁确认**——桌面接线批解锁（013＋014 两命令面均冻结） |
| 17 | U3 语义修订（环境登记，M6 提前开工批衍生的 [需用户] 项——B5 来源判定说明/B6 迁移两态与原项目只读边界） | 环境 | **✅ 用户已裁决（2026-09-09 13 项全裁，U8 ①②③覆盖）**：来源＝项目内 VPM 包（素材包转 VPM 也可含）；迁移＝复制到新目录（原地接管不适用）；迁移后副本为 VUA 原生项目可写、未迁移/迁移中＝只读；注册表披露＋用户手动解除的边界随 U8 ③方案自然消解。→ 已销账，语义随 014 实现与 M6 T-B 落地 |
| 18 | Unity 项目备注功能（环境登记 [需用户]——B4：Unity ≥2022 项目名不支持亚洲字符的补位设计） | 环境 | **✅ 用户已裁决（2026-09-09 13 项全裁，裁决 12）**：批准项目备注功能——VUA 元数据存于独有标识文件（见 U8 ②方案），**范围只在列表显示**。→ 转已裁决待办：随 M6 环境实现切片落地 |
| 19 | proposal **016**（产线，BG-4 工单交付，2026-09-10）：**检查证据面契约预备**——inspection-evidence v0.1 **草案**（schemas/inspection-evidence/v0.1/：五维闭集 functional/performance/dependencies/lighting/upload_readiness；unavailable 维 schema if/then 钉死 basis=none＋空 checks＝「缺席即证据」；basis 诚实纪律〔bridge_local_estimate 非官方等级；official_sdk_rating 为保留值，SDK 交接切片落地前禁用〕；聚合规则 fail＞warn〔含 unavailable〕＞pass）；向量 7 件（正 2＋负 5）＋校验测试 4 项全绿（2026-09-10 本机）；**草案态：REGISTRY 未动、未标冻结**（冻结硬前置清单见提案 §7）；锚定现有事实源（v1 validate_avatar 类型化检查＋analyze_performance 本地估算；依赖/光照/上传准备度无产出操作＝诚实缺口） | 产线 → 核心/环境/数据（表态）→ 集成（仲裁） | **✅ 已接受（2026-09-10 凌晨仲裁照单采纳，三方表态齐无分歧；提案状态改已接受，结论记录见 016 末尾）**：存储＝AMF 持久域第五文档库（锚 EvidenceStore：append-only/hard_link exactly-once/身份寻址/缺席根空态，不进 BDL）；读取路由＝独立词表行 `schemas/inspection-queries/v0.1/`（get/list 照 record 先例，不扩 production-use-case v0.2）；聚合/unavailable/official_sdk_rating 保留值纪律核可；**dependencies 维定义权在产线**（manifest 声明完整性 vs 引用完整性消费层选择，检查切片实现时写入冻结件；跨域引用照 012 evidenceIds 先例）。**语义权威自 M7 检查切片锚点领取时生效**；冻结硬前置照 §7（核心声明锚前不冻结）。→ **进度（2026-09-13 0:5x 集成）：硬前置①落地并验收（7d63abe，Bridge v3 三只读检查操作：references/lighting/upload_readiness）**——「锚前不冻结」解除（016 仲裁第 5 点）；dependencies 单层裁决行使（仲裁第 4 点授权：Avatar 资产引用完整性＝Bridge 产出层，manifest 声明完整性维持 project-inspection v0.2 承载面，消费侧并读引用不复制）；inspection-evidence 草案随批更新（enum [1,2,3]＋操作 +3）**仍不冻结**（硬前置②③④⑤未齐）；C# EditMode 落地未运行验证（真机归 W25）。保留本行供 M7 引用。**表态收口进度（2026-09-13 1:1x 集成）**：核心五点表态（0:0x）与数据四点表态（0:2x）均已随本轮合并入 main；桌面 016 §7「知悉即可」落账为三树表态收口唯一缺口——落账后产线可走 v3 冻结批（照 1a9cdf6 清单；v3 冻结边界声明已落 016 内联）。**硬前置②落地（2026-09-13 1:4x 集成）**：核心 M7 检查切片实现批验收合并（7a262b8，r3 cargo 557/0/27）——016 §7 冻结硬前置②③成立（向量全绿＋消费测试在库），**数据 inspection-queries 词表行冻结批解锁**（草案→冻结照 BG-4：REGISTRY 登记＋协议本双语随批）；桌面 M7 Inspection 页面消费候件到齐（wire 已备＋BG-15 骨架在库）；桌面 §7 知悉落账缺口维持（v3 冻结批触发不变）。**✅ 三树表态收口完成（2026-09-13 1:5x 集成，cb066e1）**：桌面 §7「知悉即可」落账（本机核实桌面词表零 inspect_* 直调、无修订意见、同意收口）——**产线 v3 冻结批解锁**（1a9cdf6 清单四件，实现批级验收）；数据 016 内联另附 requestRun 修订请求（核心修订批先验收，随后数据词表行冻结批）。**evidence 本体冻结批交付（2026-09-13 2:0x 产线，候集成验收）**：硬前置①②③已收口（wt-5 时序知会触发、时序自决先行）——④协议本双语（docs/protocols/inspection-evidence-v0.1_EN/ZH.md）＋⑤REGISTRY 行随批落地；schema 声明 DRAFT→冻结（形状零变更，向量与消费测试零影响）；016 内联冻结收口记录落档；**inspection-queries 词表行（数据族）独立冻结批照数据排期（候核心修订批），两批互不阻塞**；SCHEMA_EXEMPT 'inspection-evidence' 行移除请集成随批办理（022 同构反操作）。**v3 冻结批交付（2026-09-13 2:3x 产线，候集成验收）**：三树表态收口（1:5x 集成确认）触发——协议本双语 v3（docs/protocols/unity-bridge-v3_EN/ZH.md）＋REGISTRY v3 行＋契约表升 v3＋016 内联 v3 表态收口记录随批；落库面（schema/向量/C#）零改动（锚点批 7d63abe 已验收的实现面即冻结面）；生产作业面不迁移 v3 维持；unity-bridge 三族并存（v1 material 线／v2 生产作业线／v3 检查读面） |
| 20 | **BG-6 Spike 边界发现：demo 任务重启残留 `running`（候选缺陷，核心如实升级 2026-09-10 03:38）**——BG-6 Provider 生命周期 Spike（22cdc1e，scripts/spikes/provider-lifecycle/，SPIKE 非交付物）硬杀场景观察：demo 任务 running 中硬杀 provider，同库重启后 task.list 仍读 `running`——demo 任务面非终态残留未被重启扫除覆盖，与恢复纪律的观察面冲突（诚实纪律 3：非终态残留应 surface 为 inspect_required 等待显式决策，绝不静默） | 核心（Spike 升级）→ 集成（归因与排期裁决） | **✅ 集成裁决（2026-09-10 凌晨）**：**候选缺陷成立**——demo 任务虽属 DEV-only 演示面，重启后呈现 `running` 即呈现非事实状态，与「失败/残留如实呈现」同构，不因 DEV-only 豁免。**归因**＝demo 任务面未被纳入重启扫除覆盖（产品任务扫除已按 W22 恢复语义实现，本例是演示面的覆盖缺口，非恢复语义本身缺陷）。**排期裁决**：核心修复小刀（demo 任务纳入重启扫除——映射 inspect_required 或按演示语义终止标记，实现细节核心自决），随下一工作窗口交付，不阻塞任何当前门与 W25 窗口（demo 面不出 DEV，生产构建无此面）；修复前 Spike README 已如实记录该行为。**#7 残余观察态不受影响** |
| 21 | **proposal 019：多套 UI 共用应用能力**（用户直接指令，2026-09-10 凌晨登记——「把之前说过的这个需求做一下」＝方向批准并下令实施；**M6 伴随项，不改变 W25/W26 排期**）：同一 Electron 会话两套可信随产品构建 UI（现有 UI＋森林绿新版搭配 UI）复用同一共享应用层与 Gateway——切换不重建 Gateway/Provider、不丢草稿、不重复命令（AC-01～AC-13 十三项验收）。**批次路由**：批 A 共享基础（应用容器/订阅与切换骨架/现有 UI 接入；完成条件＝切换不重建 Gateway）→桌面牵头；批 B 选材与草稿（UI-03 项目无关草稿；**UI-03 正式持久化接口如缺失，核心先补契约，禁止 localStorage 充当生产文档库**）→桌面＋核心（契约缺口评估）；批 C 生产链（对齐 M5 W20/W22/W24 接口，不得模拟替代）→桌面＋核心；批 D 视觉与交付（预览/动效/窄窗/验收）→桌面。数据/产线＝素材证据与 Unity 执行能力（§6 原文）。**红线**：森林绿 Figma 源码在仓库外，任何适配不得复制入 git；树内新 UI 代码仅限 gitignore 已登记的 `apps/desktop/src/ui-variants/forest/`；**推送 origin 前 3 轮 Reviewer 审阅必须含 forest 零泄漏核查**。BG 工单余项（BG-3）与 M7 锚点顺位不变 | 操作者/用户 → 桌面（牵头）＋核心（契约/持久化）＋集成（验收/排期守门） | **📋 已接受·登记完成（019 全文照录，状态=已接受）**；**进度：批 A 共享基础已交付验收（1360af1）＋批 B 选材与草稿已交付验收（68f3617，UI-03 评估核心已交）＋批 C 生产链工单已签发（见后）**；数据/产线无即时动作；**【2026-09-11 凌晨工单签发：批 C 生产链开工授权】**——前置已齐（核心侧解析/计划/任务/记录接口均已交付验收：production-use-case v0.2 十方法＋W20/W22/W24 对应读面全在 main）；路由＝桌面牵头，消费核心已交付接口；**验收标准＝两套 UI 共用解析/计划/任务/记录且不用模拟替代未完成接口（诚实降级照 UI-08）**；完成条件对照 AC-05/AC-07/AC-13；**批 C 桌面切片全部交付验收（2026-09-12：part 2＝5328099 UI 接线合并 8c799a5——共享链身份 store〔AC-05 闸门纯派生/AC-07 任务中心权威/AC-13 记录身份匹配〕＋诚实端口装配〔fixture 无生产链演示目标，不用模拟替代〕＋搭配页链段＋四语 i18n；独立桌面实例复跑 473 绿＋集成合并后 474 绿；批 D 未签发不开工）** |
| 22 | **importCopy 结果回流契约缺口（候选缺陷，桌面如实升级 2026-09-12 04:5x，照 #20 先例）**：渲染层 importCopy 窄化期望 plan/receipt/rejected 结果文档形态（contracts `ProjectImportCopyResultV01` 已在 ApplicationSuccessValueV01 联合），但 provider（project_import_copy）实际返回任务化受理回执 `{schemaVersion,operation,taskId,correlationId}`——结果文档在任务 Done payload，而**应用契约任务面（TaskSnapshotV01/task.completed）无 result 字段**：结果文档无通道回流渲染层。后果＝F6 确认链 live 链路 plan/apply 恒「不可用」诚实降级（不伪造不崩溃）；fixture 直接返回结果文档→live/fixture value 形状不一致，DEV 走查无法暴露（核心消费测试经 wait_done 直读任务存储，未覆盖渲染层可见面——「real frame-loop wire」声明属实，缺口在渲染层可见面） | 桌面（升级）→ 集成（归因与排期裁决）＋核心（配合） | **✅ 集成裁决（2026-09-12 05:2x）——缺陷成立，集成独立复核三方证据链逐环一致**：核心路由 Done payload 已携带 `result` 字段（provider_host.rs `project_import_copy`：`TaskExit::Done({schemaVersion,operation,result})`），应用契约 `TaskSnapshotV01` 无 result 字段（application-contract.ts），渲染层窄化期望 kind=plan/receipt/rejected 而 live wire 成功值＝受理回执——结果文档无通道到渲染层。**修复裁决：①采纳＝任务面 result 回流通道**（核心 Done payload 已带 result，增量最小＝应用契约任务面演进：TaskSnapshotV01 增量可选 result 字段或任务终态投影携带 Done payload；可选字段向后兼容，结果文档自描述 schemaVersion/operation）。**契约先行**：核心出 TaskSnapshot 增量提案（正负例向量＋消费测试随批）→ 集成验收冻结 → 核心填充 → 桌面消费。**②否决**——路由同步化动 014 冻结任务化语义；长时文件操作任务化（可受理/可观察/可恢复）是正确架构，同步化是倒退。③确认不可行（planDigest 不在任何读面）。**归因＝跨批衔接缺口，非单方过错**：014 核心路由批与桌面 T-C 接线各自按己方冻结面交付（核心消费测试 wait_done 直读任务存储——覆盖 Done payload、未覆盖渲染层可见通道；桌面 fixture 直接返回结果文档——未与 live wire 形状对齐）。**教训入验收清单**：TS 面/契约消费类批次验收加查「live/fixture value 形状一致性」。**排期**：核心 TaskSnapshot 增量提案＝下一工作窗口自领（不阻塞 W25/M7 锚点/任何门）；F6 live 维持诚实降级（现状，不伪造）；桌面 fixture 形态随核心提案冻结后自决对齐（消除 DEV 走查盲区；setNote「fixture 恒诚实不可用」即先例）。setNote 不受此缺口影响（读面确认模式 bc0ba49 核可）。**→ 进度（2026-09-12 07:4x 集成）：①冻结达成**——核心兑现批 d02bd09 验收合并（0866908）：TaskSnapshotV01 可选 result 冻结（schema＋六向量＋协议双语修订＋REGISTRY application-contract v0.1 行＋proposal 020 状态翻转已接受），复跑 cargo 68/505/0＋clippy 0＋contracts 38/38＋registry 50/50 全绿；**核心填充已随批落地**（投影按态收窄＋demo 取消死数据诚实修复，两通道同源同值）；**②消费批验收合并（2026-09-12 07:5x，b4dbba0）——#22 链全环闭合，行关闭**：桌面 867ccda 任务化消费（受理→终态快照等待〔首取＋事件驱动重取〕→Done payload result 窄化，ProjectOpsOutcome 形状零改动）＋fixture 恒诚实不可用（020 自决，双形状温床消除——验清单项「live/fixture value 形状一致性」首批适用并闭合）＋13 例测试；集成复跑桌面 check 全链 EXIT=0＋vitest 62 文件/499 测试＋contracts EXIT=0；live 键面与 provider_host.rs Done payload/TaskSnapshotV01 冻结面逐键对齐。L 级观察（不阻断）：isTaskSnapshot 未检 contractVersion（信封守卫已验，桌面随手批可补）。不宣称端到端（live 走查归 W25） |

| 23 | **proposal 021（环境，2026-09-12 23:xx，U10 裁决后环境半边·契约先行）**：①**editor_verify v0.1 原语入库申报**——ADR 门①②检测域事实原语（手选路径三形态归一化；身份读 PE 版本资源**不信任路径名**；分类复用核心 editor_targets 单一权威＋引导码只渲染不晋升；拒绝码闭集 5 码 `vua.editor_verify.*`；合成 9 测试绿＋真机探针 `#[ignore]` 门控〔2026-09-12 本机 3 真实编辑器 Verified，资源身份与目录名逐一一致〕；windows-sys 既有 `=0.61.2` 依赖增 `Win32_Storage_FileSystem` feature 已声明）；无 wire 面，传输接缝未决前不接路由不称端到端。②**接缝表态请求**：桌面＝设置面预填消费哪条检测面＋所需字段＋三形态入口呈现；核心＝验证路由面＋VUA_UNITY_EDITOR 注入消费与零配置直用策略＋「按机器存储」用户手选持久化归属；数据＝无义务知会。③**来源字段增量候决**——environment-managers v0.1→v0.2（EditorFinding＋source）候桌面/核心字段决策后起草，防投机 schema 变更。边界：门③信任呈现＋留痕＝桌面/持久化归属方，环境不建模 | 环境 → 桌面/核心（表态✅到齐）→ 集成（仲裁） | proposal 021（`collab/proposals/021-u10-environment-detection-half.md`，状态=提出）；**三方表态齐（2026-09-13）**：桌面六点（slot/wt-3 状态文件留言区，内联落账桌面自办）＋核心四点（021 内联节，slot/wt-2 候验收入 main）＋**环境收口意见已内联落账（2026-09-13 0:3x 节）**——**七点三方收敛**（预填消费面＝project.environmentManagers 单一面／来源字段采纳搁置维持 v0.1／五字段够用＋激活语义不进检测快照／浏览入口＋三形态透传＋拒绝码 i18n／零弹窗空态＋锚点路由／门③+持久化归桌面设置面／预检对象改实际使用编辑器＋Hub 枚举保留），**两点候决**：①门③张力（唯一生产目标即激活×首次确认）候集成仲裁（核心推荐语义在案：自动选择管解析呈现、门③确认管放行、留痕后静默直用；环境事实输入＝原语与放行解耦、仲裁定形零环境返工）；②editor_verify wire 词表行候桌面提案→核心裁决（T-A 先例）；状态变更（提出→接受）候仲裁一并办理；**✅ 已接受（2026-09-13 0:5x 集成仲裁，021 内联「仲裁（集成）」节）**：七点三方收敛照单核可；两点候决定形——①**门③张力**：采纳核心推荐语义，硬边界成立——分层定形＝「直接激活」属选择层（解析＋呈现＋选择落定），门③「首次实际使用前一次确认」属执行放行层，自动选择不越过首次确认；确认按选择计一次不按执行次数计，留痕后同一选择静默直用与 ADR 文义相容，选择变更重新起算；信任呈现＋首次确认 UI＋留痕归桌面设置面（三方收敛点 6），核心经注入消费，环境零返工；过渡期「未设即 unavailable」维持，实现属 U10 实施切片不抢跑；②**来源字段**：采纳「候选搁置维持 v0.1」，桌面闭集三态记为将来升版参考，待第二真实来源出现随真实需求起草。后续工作面：editor_verify wire 词表行＝桌面提案→核心裁决（T-A 先例）；U10 实施切片按 ADR 验收五条办理，配置激活≠端到端验证（W25 证据要求不放宽）。**✅ 词表行裁决＋草案冻结件已入 main（2026-09-13 3:4x 集成第七批验收）**：核心七点裁决（6cc4594，行名 environment.verifyEditor／query／params 闭集无 maxLength／两态＋三钉子／缺席码／向量正 3 负 3／时序加速＝环境草案态先行＋核心路由批候草案件即开工）＋环境草案件（71c65d4：schemas/editor-verify/v0.1 DRAFT＋向量正 3 负 3＋editor_verify_wire 8 测试＋workflow 行；SCHEMA_EXEMPT 'editor-verify' 行集成追认〔0b8bebb 先例〕，冻结批验收时由集成移除）；集成侧证据：registry-only exit 0（55 项＋1183 文件 0 标记）＋editor_verify_wire 8/8＋project-manager 14 套件＋clippy 0。下一时序：核心路由批（开工条件已就绪）→环境冻结批→桌面 U10 设置面切片；零端到端宣称维持（真机走查候 W25）。**✅ 核心路由批验收入 main（2026-09-13 4:1x–4:3x 集成第九批，a6585c2）**：deafe11 路由（三钉子＋params 单键闭集＋capability 行＋EditorPathVerifier 注入点）＋bbb6206 并发会话 pub 化收编（派发竞态闭合＝互补非重复）＋373470c 加固（editor_verify_wire 终态 8/8）；schema-vectors workflow vua-provider-host 步追加 --test editor_verify_wire 越域配套**集成追认**（016/38af48c 先例）；r3 合并后 cargo workspace 584/0/27＋clippy 0＋registry-only exit 0。**021 时序推进一格——下一环：环境冻结批（wt-6：协议本双语＋REGISTRY 行＋SCHEMA_EXEMPT 'editor-verify' 行移除请求，集成移除）→桌面 U10 设置面切片（wt-3：TS 面登记＋mock-provider verifyEditor 分支随批，常量 EDITOR_VERIFY_SCHEMA_VERSION/ENVIRONMENT_VERIFY_UNAVAILABLE 已 pub 可消费）→产线 v3 排期锚（核心排期留言即开工锚）**。**✅ 冻结批验收入 main（2026-09-13 4:5x 集成第十批，7dd25a3）——021 时序就此收尾**：协议本双语＋REGISTRY 两行（55→57）＋schema description DRAFT→FROZEN（机器面零变化）＋021 内联回执节；SCHEMA_EXEMPT 'editor-verify' 行集成随验收移除（移除后 registry-only exit 0＝登记行 mentioned 命中兜住反向盲区，零红窗）；集成复跑 cargo 584/0/27＋clippy 0＋双载体 editor_verify_wire 8/8＋8/8。**后续工作面（021 全部落账）**：桌面 U10 设置面切片开工条件三齐（裁决＋草案件＋路由批＋冻结批均入 main），TS 面登记＋设置面＋门③呈现留痕照 021 时序随批开工；真机走查归 W25 零端到端宣称维持

| 24 | **proposal 022（数据，2026-09-13 00:2x）：inspection-queries 词表行草案期 REGISTRY 反向检测豁免**——数据上轮交付 `schemas/inspection-queries/v0.1` 词表行草案（2e3db58 候集成验收；016 仲裁第 2 点独立词表行，照 BG-4 先例草案态不动 REGISTRY、协议本随冻结批），与 inspection-evidence 同构草案处置；但 BG-8 (b) 反向漏登记检测的 `SCHEMA_EXEMPT` 豁免清单（`scripts/collab-brief.mjs:309`）起草于该目录存在之前，只豁免了 inspection-evidence——本树 brief ④ 已报「schemas/inspection-queries/ 漏登记」，且 **CI 影响**＝`collab-registry` workflow 跑 `--registry-only`（反向扫描计入退出码），实现批 2e3db58 合入 main 后该 job 必红。提案＝`SCHEMA_EXEMPT` 增 `'inspection-queries'` 一行（豁免理由与 inspection-evidence 同构：016 草案态冻结时随冻结批登记），**随 2e3db58 验收批一并办理**避免 main 带红窗口；备选（REGISTRY 草案行登记）不推荐，理由见提案 §4 | 数据（提出）→ 集成（落地裁决；`scripts/` 非数据所有权域，数据不越域动手） | **✅ 已照准落地关闭（2026-09-13 0:5x 集成，随实现批 2e3db58 验收批同轮）**：SCHEMA_EXEMPT 增 'inspection-queries' 一行＋同构注释（集成域改动，BG-8 0b8bebb 先例）；备选方案照提案 §4 三理由否决；022 状态=已接受（内联回执）；同轮推送零 collab-registry 带红窗口

## W15 用户走查问题清单（2026-09-09 用户回传 9 条；指令＝先确认意图，禁改实现）

> 用户原文逐字登记（A/B/C 三组 9 条）。处置流程：①登记（本节）②逐条意图确认
> （各归属角色复述理解＋指出歧义；无法确定者升「待用户裁决」标 [需用户]）
> ③处置草案（提案/建议，**禁改任何实现文件**）。核心（任务面/契约）就条目 6/9
> 表态见「核心意图确认」子节。

| # | 组 | 用户原文（逐字） | 归属（核心初判） |
| --- | --- | --- | --- |
| 1 | A | A4“生成后删除原始素材文件” 选项 应在 “生成 VPM 包替代” 选项被取消后自动取消（目前可正确置灰不可点击但不会自动取消） | 桌面（W15/010 交互联动） |
| 2 | A | A7测试中发现问题：无论实验性-生成 VPM 包替代/生成后删除原始素材文件 是何状态，本地素材均可在产物模式下切换 跟随全局  使用原始 UnityPackage  生成 VPM 包。正确逻辑应为：未打开生成 VPM 包替代时，本地素材无产物模式 无条目动作 ，打开生成 VPM 包替代 时 使用原始 UnityPackage 的素材会出现 “生成 VPM 包替代” 按钮。 “删除原始素材”按钮在任何情况下均不在本地仓库出现，而是只在导入时根据是否选择了“生成后删除原始素材文件”触发工作规则。 | 桌面（条目动作门控）＋核心（effectiveArtifactMode 语义确认） |
| 3 | A | 接2：目前缺少明确的素材导入页面，其需要：从云端下载/从本地导入两个部分，前者又暴露出缺少Web浏览功能，请调用审阅子智能体，根据需求在M6增设阶段。 | 桌面＋产品排期（M6 增设裁决） |
| 4 | B | B组测试中发现产品盲点：Unity至少在2022版本中项目名无法兼容亚洲字符，考虑设计Unity项目备注功能会是一个不错的Feature。 | 产品 Feature（非缺陷；排期裁决） |
| 5 | B | 首先原理需要你说明：当前如何判断项目和包的真实来源？我认为目前的线索可能不能断言项目出处。外部项目提示：“这个项目看起来由 VCC / vpm 管理。VUA 可以接管它的包清单,不改动任何文件。” 应为：“此项目看起来由其它软件管理？接管它可能产生未知后果” 下方小字“迁移将在包管理引擎接入后执行;在此之前不会自动改动任何内容。”在后续变为详细的迁移说明。 | 核心＋桌面（来源判定原理说明与文案修正） |
| 6 | B | B6这种填写表单是最糟糕的交互，违背了项目为新手设计的原则。正确应为按钮“选择目录”点击后打开资源管理器“选择文件夹”后出现在VUA项目中并出现按钮“迁移”/“仅查看” | 核心＋环境＋桌面（B6/迁移交互形态——014 已裁语义，交互形态待裁） |
| 7 | B | B7~B9没有测试 | 全域（B7–B9 未走查确认） |
| 8 | B | B6这种填写表单是最糟糕的交互，违背了项目为新手设计的原则。正确应为按钮“选择目录”点击后打开资源管理器“选择文件夹”后出现在VUA项目中并出现按钮“迁移”/“仅查看” | （与 6 同条重复登记，保留原文） |
| 9 | C | C1用户无法确认状态是否来自服务端。讨论设想：取消DEV场景条，设置-实验性功能选项卡内增加 “开发模式” 打开后可选择单独切换前端各Provider状态（而不是现在的按套装改状态） | 桌面（呈现）＋核心（capabilities 契约） |

### 核心意图确认（条目 6/9；2026-09-09 核心）

**条目 6（迁移后可写/未迁移只读）——核心复述**：用户对「B6 不修改原项目」的
静态裁决（U3/1.2.0）提出语义演进——(a) VCC/ALCOM 项目**迁移**到 VUA 后完全
复制其包清单，项目变为 VUA 原生、可正常写操作；(b) 不迁移或迁移未完成时才
维持只读。**与既有裁决的关系**：(a) 的「完全复制包清单→VUA 原生可写」与
proposal 014 已冻结语义（导入为 VUA 管理的副本＝复制 Unity 工程内容（排除
可再生目录与 `.vua/`）→ 新项目可写）**方向一致**——014 是副本导入（新路径），
用户条目 6 是否等同 014、还是在副本之外新增「原地接管迁移」形态（原路径就地
转为 VUA 管理），**歧义待用户澄清**。[需用户] 条目 6-a：迁移＝014 的副本导入
（新路径），还是原地接管（原路径就地转 VUA 管理）？两者对包清单迁移、身份、
回退语义影响不同。

**条目 9（开发模式逐 Provider 切换）——核心复述与契约现状**：现状＝DEV 场景
条（套装粒度）＋provider 能力面（served_capabilities 逐能力 availability，
provider 自报）。用户设想＝逐 Provider 粒度切换前端各 Provider 状态。**歧义
待用户澄清**：[需用户] 条目 9-a：「开发模式」开关是否仅 DEV 构建生效（生产
构建永不存在、不可切换）？[需用户] 条目 9-b：切换粒度是「前端 Provider 状态」
（fixture 呈现）还是「真实 Provider 连接」（capabilities 契约演进）？前者纯
桌面可决，后者涉及 application-contract capabilities 形状演进（核心配合）。

**处置草案（核心侧，均不动实现）**：
- 条目 2：条目动作门控依赖 effectiveArtifactMode 语义——核心确认现状：产物
  模式四态切换的存在条件、全局/条目两级解析（W14 冻结语义）在 provider 侧
  已如实实现；呈现层门控归桌面。草案＝桌面按 011 §7/012 收敛语义核对门控
  呈现条件后回流；
- 条目 5：来源判定原理＝仓库内既有事实（013 检测面读 project-inspection v0.1；
  VCC/vpm 管理的识别线索＝`packages/vpm-manifest.json` 存在性与 vpm 注册表），
  文案「看起来由…管理（?)」的**不确定性如实呈现**恰是诚实纪律——「接管可能
  产生未知后果」的强断言反而需证据支撑。草案＝桌面文案改为不确定语气＋原理
  说明进 013 检测面文档（核心配合）；
- 条目 8（Unity 项目名亚洲字符）：Unity 2022 项目名限制为产品事实——备注
  Feature 归产品排期裁决（M6/M7 增设阶段），核心无异议。

## 待用户操作（2026-09-09 操作者指令设立：需要用户动手/确认的事项）

| # | 事项 | 情况说明 | 操作步骤 | 成功/失败标准 |
| --- | --- | --- | --- | --- |
| O-1 | **W15 关门确认文档审阅**（**✅ 用户确认完成（2026-09-09 回传）；文档=`VUA-3 工作树 docs/plans/w15-close-user-confirmation_ZH.md`**） | W15 两修正项已回流验收（触发时机＝素材导入时语义＋「生成 VPM 包替代」术语）；**用户确认走查完成——M5 关门按门序的最后一项达成**；同时回传 9 条新发现问题（见下方「W15 确认后问题清单」块，已登记路由，不阻塞关门） | 走查已完成 | 成功（已达成）；9 条问题按组登记路由处置 |
| O-2 | **W25 真机窗口确认**（开跑等前置齐备＋用户确认） | W25＝一次全量验证（不拆分）；三前置：①production-use-case v0.2 已冻结（凭证落地）✓＋②产线 Rust 物化切片已落地 ✓＋③W22 实现切片进行中（executors 已接线，两对接细节待核心澄清）——**③落地后即请用户确认开窗**；执行序定稿＝B1→A1→A2→A3→B2a→**用户启动 VRChat**→B2b→B3→归档；E2 运行中探测并入本窗口（环境对齐已确认） | 三前置齐备后操作者发出开窗通知（同步环境与用户）→ 用户确认开窗——**【2026-09-10 凌晨补注：用户明示今晚不便实机测试，W25 开窗延期，时间待定；今晚窗口无真机任务】** → 窗口内按执行序推进，**A3/B2a 交接点用户启动 VRChat 客户端**配合 E2 段 | 成功＝窗口内全量验证通过（M5 各序列产出在真机一致表现＋E2 运行中探测按预期）；失败＝任一段失败即如实记录（不隐式重试），按程序处理后另行安排 |
| O-3 | U5 目录清理（维持暂缓） | VUA-2/VUA-3 内 `node_modules.pre-rename` 与 `target.pre-rename` 为旧时代遗留目录 | 用户方便时手动删除两目录 | 成功＝目录移除且两工作树后续构建正常；不处理也不阻塞进度 |

**W15 确认后问题清单（2026-09-09 用户回传，9 条——登记与路由仲裁：集成；「先确认用户意图，不动手改文件」纪律执行中）**

| # | 组/路由 | 用户原文摘要 | 集成意图确认（复述与歧义） | 处置草案 |
| --- | --- | --- | --- | --- |
| A1 | 桌面 | A4「生成后删除原始素材文件」选项应在「生成 VPM 包替代」选项被取消后**自动取消**（目前可正确置灰不可点击但不会自动取消） | 主从联动——从开关随主开关取消而自动复位（当前仅置灰，残留开启状态） | 桌面 W15 收尾批或后续批修正（从开关联动复位逻辑） |
| A2 | 桌面＋核心 | A7：无论实验性两开关何状态，本地素材均可切产物模式（跟随全局/使用原始 UnityPackage/生成 VPM 包）。**正确逻辑**：未开「生成 VPM 包替代」＝本地素材无产物模式、无条目动作；开启时「使用原始 UnityPackage」的素材才出现「生成 VPM 包替代」按钮；「删除原始素材」按钮任何情况下不出现在本地仓库（只在导入时按「生成后删除原始素材文件」触发工作规则） | 三层联动语义：①实验性全局开关关闭＝条目级产物模式 UI 整体不呈现（无条目动作）；②开关开启＋素材为原始 UnityPackage＝呈现「生成 VPM 包替代」条目动作；③「删除原始素材」动作从本地仓库条目移除（仅导入时按导入选项触发后台工作规则）。歧义：②中「跟随全局」选项在开关开启后是否保留（保留则三选项，不保留则二态）——**待核心/桌面按 W14 词表与 010 语义对齐后确认** | 桌面（条目 UI 联动呈现）＋核心（provider 侧守卫与 effectiveArtifactMode 语义对齐）；随 M5 收尾批或 W20 实现切片 |
| A3 | 桌面（审阅子智能体）→ M6 增设阶段 | 条目 3（接 A2）：目前缺少明确的**素材导入页面**——需从云端下载/从本地导入两部分；前者暴露缺少 Web 浏览功能。请调用审阅子智能体按需求在 M6 增设阶段 | 素材导入页面为新增产品面（云端下载入口＋本地导入入口）；云端下载依赖 Web 浏览功能（现状 F4 远程浏览的缺口确认）。**待审阅子智能体报告后再入计划，先登记为待定项**（[需用户]-adjacent：审阅报告后需用户确认增设范围） | **✅ 审阅报告已产出并归档（2026-09-09，`collab/reviews/2026-09-09-w15-feedback-m6-import-page_ZH.md`，12d24b7）**——verdict＝**建议增设（有条件）**（素材导入页在 product-boundary 1.2.1 与 design-standard §8.3 既有方向内；M6 现行分解表无此行，属素材域跨域入窗需用户确认）。**IMP-1~5 任务行草案**（IMP-1 设计/IMP-2 Web 浏览接线/IMP-3 云端下载落库契约先行〔数据〕/IMP-4 本地导入收口/IMP-5 验收文档）＋问题清单 **H-1/H-2（高）/M-1~M-4（中）/L-1/L-2（低）**＋**三项裁决请求均 [需用户]**（①M6 增设确认〔备选＝仅本地导入收口〕；②Web 浏览安全边界逐项〔来源范围/登录平台语义/下载主机域真机验证后逐域提案〕；③下载落库＝同一素材包条目模型确认＋协议面归数据裁决）。**归档与用户裁决前任何人不得据报告开工**；M-1（outline M4 行诚实降级补注）＝集成域文档修正随下批；M-4（与 A1/A2 同动冲突）排期归集成。**复核轮处置（2026-09-09 晚）**：reviewer-agent 同题复核报告已归档入树；窄裁决（新窗口/外部协议）已由 U9 关闭（从严四分法）；IMP-1~5 已落表（outline 2.0.11）；H-1 导航实差列桌面今夜冲刺必做项 |
| B4 | 环境/桌面 | Unity 至少 2022 版本项目名无法兼容亚洲字符——考虑设计 **Unity 项目备注功能**（Feature） | 产品盲点（Unity 侧约束）的补位设计提议：项目备注（VUA 侧元数据）弥补项目名不可用亚洲字符 | Feature 提议登记——需产品裁决（是否入 M6/M7 范围）；待环境/桌面技术可行性意见后入计划 |
| B5 | 环境＋桌面 | ①要求**说明当前如何判断项目和包的真实来源**（用户认为目前线索不能断言项目出处）；②外部项目提示文案修改：主文案→「此项目看起来由其它软件管理？接管它可能产生未知后果」，小字→「迁移将在包管理引擎接入后执行；在此之前不会自动改动任何内容」，后续变为详细迁移说明 | ①要求环境/核心给出**来源判定原理说明**（T-B 检测的判定依据——如实说明能力边界，不虚构断言）；②提示文案改为**不确定性表述**（「可能」「未知后果」——比现文案更诚实地承认判断的或然性） | 环境/核心出具来源判定原理说明（B 组实现切片前置）；桌面按新文案修正（随 T-C/M6 批）；详细迁移说明随 014 实现演进。→ **✅ 已销账（2026-09-12 集成）**：①环境 alcom-vcc 1.2.0 来源判定原理（368c277）已入 main；②桌面 B5② 文案批 9710c18 验收合并（219f3e3）——四语不确定性语义、zh-CN 与裁决原文逐字一致、`migration.note` 未动、源内旧文案零残留、桌面 check 全链绿（集成复跑 vitest 61/486 EXIT=0）；「详细迁移说明」为后续演进非本行销账条件 |
| B6 | 环境/桌面 | B6「不修改原项目」定义推翻重设——实际逻辑应为两种：①选择 VCC/ALCOM 项目**迁移到 VUA** 后完全复制其包清单，变为 VUA 原生项目**能正常写操作**；②选择但不迁移/迁移未完成＝**只读** | **意图确认：与 1.2.0/014 一致而非推翻**——1.2.0 禁止写的是 ALCOM/VCC 管理的**原项目**；「迁移到 VUA 的副本」＝VUA 原生项目（可写）正是 1.2.0 允许路径＋014 已冻结语义；用户本条＝**把「迁移完成可写／未迁移只读」的两态边界显式化**（并确认迁移未完成的中间态也是只读）。无语义冲突，为细化确认 | 014 语义已覆盖（R1 排除清单＋新 Unity 身份）；「迁移未完成＝只读」中间态补入 014 实现语义（环境随实现切片确认）；桌面呈现两态（迁移完成徽标/只读徽标） |
| B7 | 桌面 | B6 填写表单是最糟糕交互，违背新手设计原则——正确应为按钮「选择目录」点击后打开资源管理器「选择文件夹」，出现在 VUA 项目中并出现「迁移」/「仅查看」按钮 | 交互重构：表单输入→按钮驱动（选择目录→系统资源管理器→迁移/仅查看双按钮）——与桌面 W18 文件夹对话框壳能力及 014 确认链同构 | 桌面（M6 T-C 批或 014 接线批一并落地）；交互形态与桌面 014 表态 A 节（文件夹对话框）一致 |
| B8 | 桌面 | B7~B9 没有测试 | **歧义：用户原文 B 组仅列至 B7，「B8/B9」未在原文定义**——指向 B 组后续条目缺测试，但条目本体不明 | **[需用户]**：请用户澄清 B8/B9 指代（或确认笔误）；澄清前桌面不预估测试范围 |
| C1 | 桌面＋核心 | C1 用户无法确认状态是否来自服务端。讨论设想：取消 DEV 场景条，设置-实验性功能选项卡内增加「开发模式」打开后可**单独切换前端各 Provider 状态**（而非按套装改状态） | 状态来源可见性（诚实纪律：用户无法区分真实/fixture 状态）＋DEV 工具重构设想（场景条取消→开发模式单独切 Provider）。**歧义/纪律交界**：「单独切换前端各 Provider 状态」若指切换**前端呈现的假状态**则与诚实纪律冲突（前端不得呈现非服务端事实的状态）——若指切换**连接目标**（真实 provider vs fixture 网关的选择粒度）则合规。**待桌面/核心讨论澄清语义后**，若仍无法确定→[需用户] | 桌面＋核心讨论（C1 语义澄清：连接目标选择 vs 状态伪造的边界）；讨论结论入 DEV 面设计；M4 场景条裁决（DEV 场景条可收起）与此设想的合并处理待讨论后定 |

### 用户裁决回传（2026-09-09，13 项全裁——登记对照）

| 裁决项 | 对照走查条目 | 裁决内容（忠实转述） | 核心吸收注记 |
| --- | --- | --- | --- |
| 1 | U6 销账（B8/B9 指代） | B8/B9 指代＝VUA-3/docs/plans/w15-close-user-confirmation_ZH.md line80：B8「确认并开始导入（DEV fixture）完成呈现：新项目路径/已复制数据/已复制内容/来源关系已记录/重新检查完成」；B9「（真实 provider 场景）同一提交呈现『项目操作服务尚未接入或暂不可用』——合格态：provider 路由随 013 后落地，属接线前诚实反馈」 | B9 合格态与 record 读面诚实缺席纪律一致（provider 路由已随 013 落地） |
| 2 | U7-①（M6 增设） | 同意 M6 增设（IMP-1~5）；细节写的不够清楚，但允许先不那么清楚，冲刺出初版，再改具体逻辑 | 实现下一工作时段（今夜 23:00）开工；细节迭代按冲刺节奏 |
| 3 | U7-②（购买流） | 购买流目前不做，但不是永久不做，取决于未来和 BOOTH 官方取得的联系 | 非永久排除——排期记录保留 |
| 4 | U7-②（Web 允许清单） | 允许清单要包含的很多。本地参考物（严禁提交入库）：C:/Users/<本地用户>/Documents/VRChat便捷avatar操作/_local_bdb_crawl/data/html（有限案例已含 booth.pm、pximg.net、vrchat.com、vn3.org、google.com、discord.gg、x.com 等）。建议：先做白名单，白名单外只做提示，不禁止浏览 | 白名单优先＋提示不禁止——桌面/数据域实现输入 |
| 5 | U7-③（下载落库） | 下载落库归数据域 bdl-commands 新契约——批准 | 数据域新契约切片授权 |
| 6 | U8-①（来源语义） | 「包的真实来源」指项目内 VPM 包；但素材包也可变为 VPM 包被管理，理论上也可能被包含 | 来源判定语义输入：013 检测面与 U8 文案按此更新 |
| 7 | U8-②（迁移语义） | 迁移＝复制到新目录；迁移后写操作含 Unity 工程文件（当作 VUA 原生项目看待，文件夹里加独有标识文件） | project-ops 词表语义输入（014 冻结件补充）：独有标识文件＝project-ops Schema 冻结时的字段输入 |
| 8 | U8-③ | 略（随 7 选复制方案，原地接管冲突不适用） | 原地接管形态排除确认 |
| 9 | U8-④（import-copy 命名） | import-copy 工程上是「复制导入」、用户体验上就是「迁移到了 VUA」——不冲突，沿用即可 | 014 沿用确认 |
| 10 | 条目 2（呈现屏蔽） | 条目 2 先在呈现层屏蔽，以防未来会用到（＝数据分支 (a)：W14 词表零变更） | W14 词表零变更确认；呈现层归桌面 |
| 11 | 条目 1 两假设 | 清除持久偏好＋不溯已删——确认 | 桌面域确认 |
| 12 | 条目 4 备注 | 在独有标识文件（见 7）存 VUA 元数据，范围只在列表显示 | project-ops Schema 字段输入（列表显示范围） |
| 13 | 条目 9 开发模式方向 | 开发模式方向（DEV-only＋切换真实连接目标＋演示徽标恒显）——认可 | 9-a/9-b 已裁：DEV-only＋真实连接目标＋徽标恒显；capabilities 契约演进核心配合排期 |

## 待用户裁决

进程侧解决不了的问题升级到这里（规则见 `collab/README.md` 升级规则）；标 `[需用户]` 的条目，
各角色在 tick 中自动跳过。用户白天批量处理。
**今夜例外（2026-09-09 23:00–次日 08:30）**：本应升级至此的裁决点可标 **[需代裁]**
（不阻塞至晨起，由操作者召 Reviewer 三局两胜面板裁决——机制见顶部专节；红线类
仍标 [需用户] 留晨起）。

| # | 事项 | 提出方 | 状态/用户决定 |
| --- | --- | --- | --- |
| U1 | EAC 实验性恢复的边界裁决稿（proposal 006；集成仲裁已过：R1–R9 无修订） | 环境 | **✅ 用户已批准（2026-09-08 批量裁决，第三方仲裁复核后）**：006 R1–R9 无修订整体批准；附更严验收标准——「终止能力在允许清单为空时显示未核验/不可用」（R8 实现措辞按用户批准语义第 2 点收紧；八点批准全文见 006 内联线程，环境已落档 6006bf4）；**M6 相关实现获授权**，开窗后环境按 R9 执行 |
| U3 | F6：VUA 是否写外部工具（ALCOM/VCC）管理的项目 | 桌面 | **✅ 用户已裁决（2026-09-08 批量裁决）**：**(a) 只读兼容＋「导入为 VUA 管理的副本」**——语义规格已落 product-boundary **1.2.0**（集成双语：允许/禁止清单＋副本五项规格＋跨工具锁不可行 rationale＋`1.0.x` 写能力一律 false 收紧条款）＋outline 2.0.7 F6 锚点；桌面 M5/M6 实现按 1.2.0 执行 |
| U5 | VUA-2/VUA-3 内 node_modules.pre-rename 与 target.pre-rename 目录清理 | 集成 | **维持暂缓**（2026-09-08 批量裁决未提及；不阻塞进度，留挂） |
| U6 | W15 确认后问题清单 B8/B9 指代澄清 | 集成 | **✅ 用户已裁决（2026-09-09 13 项全裁）**：B8/B9 指代＝W15 关门确认文档 line80——B8「确认并开始导入（DEV fixture）完成呈现：新项目路径/已复制数据/已复制内容/来源关系已记录/重新检查完成」；B9「（真实 provider 场景）同一提交呈现『项目操作服务尚未接入或暂不可用』——合格态：provider 路由随 013 后落地，属接线前诚实反馈」。桌面测试范围据此明确 |
| U7 | A3 审阅报告三项裁决请求（M6 增设「素材导入页 IMP」任务包） | 集成 | **✅ 用户已裁决（2026-09-09 13 项全裁）**：①**同意 M6 增设（IMP-1~5）**——细节允许先不那么清楚，冲刺初版再改具体逻辑；②Web 安全边界——**购买流目前不做（非永久，取决于未来与 BOOTH 官方联系）**；**白名单策略＝先做白名单，白名单外只做提示、不禁止浏览**（用户本地参考物含 booth.pm/pximg.net/vrchat.com 等案例——本地路径严禁提交入库）；**下载主机域＝真机验证后逐域提案批准**；③**下载落库归数据域 bdl-commands 新契约——批准**（协议面数据主导冻结硬前置）。→ 转已裁决待办：IMP-1~5 于今夜 23:00 工作时段开工 |
| U8 | W15 九条之条目 5/6 裁决请求（数据侧登记） | 数据 | **✅ 用户已裁决（2026-09-09 13 项全裁）**：①「包的真实来源」＝**项目内 VPM 包**（素材包也可变为 VPM 包被管理，理论上也可能被包含）；②迁移＝**复制到新目录**；迁移后写操作含 Unity 工程文件（当作 VUA 原生项目，**文件夹加独有标识文件**）；③略（随②复制方案，原地接管冲突不适用）；④import-copy 工程上是「复制导入」、用户体验上就是「迁移到了 VUA」——**不冲突，沿用**；⑤条目 2 **先在呈现层屏蔽**（＝数据分支 (a)：W14 词表零变更）。→ 转已裁决待办：各条随对应实现切片落地 |
| U9 | **「裁决 4」实施细则：新窗口/外部协议四分法**（Reviewer 复核报告窄裁决请求〔H-1 衍生「浏览放行面精确边界」〕的用户裁决；由操作者 directed 批转达登记） | 集成 | **✅ 用户已裁决（2026-09-09，用户原文「同意按此方案执行」）**——全文：「新窗口/外部协议」按四分法执行：(1) **网页类新窗口**（http/https）永不创建独立窗口——白名单内转入当前内嵌视图打开；白名单外走「提示后放行」提示、确认后同样转当前视图（内容可达性不受影响）；(2) **伪协议窗口**（javascript:/data:/blob:/file:）无条件拒绝，无放行路径；(3) **外部协议独立确认层**：http/https 白名单外先提示再交系统浏览器；mailto:/steam:/vrchat:/discord: 等显式协议清单逐次弹确认框显示完整目标、不提供永久免确认；未知协议默认拒绝；(4) **手势要求**：协议启动必须由用户点击触发，页面自动触发（脚本/meta refresh）一律不执行；`setWindowOpenHandler` 对原生新窗口创建一律 deny。→ **Reviewer 窄裁决问题就此关闭（从严四分法方案已采纳）**；「IMP 并入 M6 v0.8.0 门验收」按默认读法（**并入**）登记，用户未表异议；**实差必做项**：现行导航实现（`apps/desktop` main.ts:285,293 允许清单仅 booth.pm 且导航违规即拦截）与细则存在实差——列入桌面今夜 23:00 IMP 冲刺必做（导航放行改造按本细则实现） |
| U10 | **Unity 编辑器路径配置面立项**（激活 M3 素材直产链的壳侧缺口；桌面 workshop F3 迁移评估收口 2026-09-12 升级） | 桌面（设置 UI＋壳注入）＋核心（Provider 消费）＋环境（检测预填协作半边） | **✅ 用户已裁决（2026-09-12，ADR 冻结 `docs/decisions/path-configuration` 双语，698e738）**：三选项评审后**不取单选，采纳组合形态**——「默认零配置＋补救式手选＋三道验证（身份/版本/信任呈现）」并**扩展为路径类配置通用规则**（检测优先且事实与来源同显／手选必带验证／失败即空态加引导／执行类路径安全分级／按机器存储／一个设置家「环境与路径」节）。要点：检测到唯一生产目标编辑器（2022.3.22f1）即零配置直用；手选仅补救时出现且三道验证各有拒绝路径；「生成 VPM 替代」开关后端随本配置激活，不做第二处配置；任务中途不做弹窗选择。**实施指引与验收五条见 ADR；配置激活≠端到端验证（W25 证据要求不放宽）**。→ **通知已路由（2026-09-12 操作者转达）：环境/桌面/核心按 ADR 各归其位；按非工作时间纪律，实现切片自 23:00 工作窗口开工，裁决前各行维持现状** |
