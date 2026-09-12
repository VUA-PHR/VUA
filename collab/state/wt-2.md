---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 5160d3c
updated: 2026-09-13
---
## 当前焦点
**requestRun 修订批兑现（数据预审四处统一）＋U10 实施切片核心侧交付
（选择决策面＋预检对象切换，逐条锚定 ADR 验收五条；09-13 1:4x–2:1x
轮，工作时段）**：
- **追平**：f209182 世代声明（上轮收口）后追平 main（a35e484 集成五批
  登记＋5160d3c CI 回读，--no-ff 1a13160，零冲突，collab-only inbound，
  核心域零触碰）。
- **修订批（c914cf2）**——兑现 wt-5 预审「修订意见（数据，1:2x）」：
  ①建词表行族自有常量 `INSPECTION_QUERIES_SCHEMA_VERSION="0.1"`
  （provider_host.rs，照 PROJECT_OPS/BDL_COMMANDS 先例位置），get/list/
  requestRun 三回执统一改锚（原 get/list 借
  INSPECTION_EVIDENCE_SCHEMA_VERSION 语义错锚、requestRun 借
  BDL_COMMANDS_SCHEMA_VERSION "0.4" 带入外族版本——同族两值三锚归
  一）；②requestRun schema result const＋example result "0.4"→"0.1"
  同批（**wt-5 预授权的两件版本字面量触碰**，仅 const/字符串字面量零
  形状变更，唯一全量绿路径，候数据随批追认）；③**maxLength 自决＝采
  纳去除**：avatarRef.ref 是 verbatim 承载（evidence 本体 minLength 1
  无上限），写侧独有上限构成族内第三形状＋读写不对称；avatarGlobal
  ObjectId 保留 512（非 verbatim 承载的自有 payload 约束，预审未点名）。
  TS 侧宽类型不锚定值零跟随（预审确认）。测试：帧环 10/10＋数据向量
  6/6＋产线向量 3/3。**数据词表行冻结批（REGISTRY＋协议本双语＋三方
  法一次冻结）就此解锁**。
- **U10 实施切片核心侧（0cb0d05，实现批）**——021 仲裁定形＋集成明示
  开工后兑现，两件：
  ①**provider 组装面选择决策**（新模块 crates/orchestrator/
  editor_selection.rs，纯函数 `select_editor` 可测试）：显式注入
  （VUA_UNITY_EDITOR＝桌面验证＋门③确认后的壳注入）＞ 生产目标自动
  选择（枚举最新序首个 ProductionTarget＝ADR「Hub 默认项」决胜；包括
  2022.3.22f1c1 中国发行版在内的非生产目标只观察绝不自动选）＞ 无
  （Unavailable 三种缺位事实：NotDetected/NoProductionTarget〔附观察
  版本〕/DetectionFailed）。**显式注入短路决策**——Hub 根损坏不能取
  消已验证手选（单元测试钉死）。**执行放行语义＝`releases_execution()`
  仅显式注入为 true**：门③首次确认归桌面设置面（仲裁分工），自动选
  择只解析＋呈现＋预检观察，**过渡期「未设即 unavailable」诚实缺席
  维持**——自动选择绝不越过首次确认（仲裁硬边界的机器化表达，测试
  钉死）。组装面 bin 接线：bridge 仅放行选择构造真执行器，否则空路
  径诚实缺席＋按缺位分类 eprintln（自动选择候选带路径＋版本呈现——
  ADR 验收 1「检测即事实呈现、来源可见」核心侧最小兑现）；
  editor_version 自选择路径观察（单源；路径无版本即 "unknown" 绝不
  发明）。
  ②**预检对象切换**（job.execute 环境预检，009 表态 4② 经 021 表态 4）：
  预检消费组装面选择决策（ProductionUseCaseConfig.editor_selection，
  unity_editors_root 字段移除——预检不再自行枚举；Hub 枚举保留为环
  境快照事实源不废）。**来源同权**：已确认编辑器（手选或探测）须精
  确满足配方约束（五元组＋china_suffix；路径无可解析版本＝拒绝不猜
  测——手选路径保持 Hub 布局使验证可运行）；**AutoSelected 候选不得
  承载作业**（门③线：即使约束精确匹配也 unmet，detail 如实说明候首
  次确认）；NotDetected/NoProductionTarget 拒绝附观察事实；
  DetectionFailed 维持 environment_check_failed 可重试外部失败绝不
  伪装 unmet（现状纪律保留）。
- **ADR 验收五条逐条锚定（如实声明可证边界）**：①零配置检测即事实
  呈现＋来源可见＝选择决策＋组装面呈现＋预检消费已兑现，**端到端激
  活候门③机制＋桌面设置面**（诚实缺席，不宣称）；②手选三道验证拒
  绝路径＝editor_verify（环境域已交付）＋桌面 UI 承载，核心经注入消
  费不代猜（显式注入短路即此边界）；③检测失败＝typed 缺位事实不阻
  断其它能力（决策面 Unavailable 分支＋预检拒绝均为 typed，其余方法
  面独立照常）；④两条链（production intake executor＋编排作业）同
  一 VUA_UNITY_EDITOR 注入点零第二拷贝（production 面现状即显式注
  入才可用，与本切片语义同构）；⑤设置节逐行来源呈现归桌面设置面，
  核心保证来源事实可及（选择＋呈现＋留痕候桌面）。**配置激活≠端到
  端验证：零 W25 宣称，真机证据要求不放宽**（ADR 明文）。
- **测试证据（本机 2026-09-13，pipefail 严格退出码）**：cargo test
  --workspace **568 通过/0 失败/27 忽略 EXIT=0**（上代 557＋新增 11：
  editor_selection 9＋预检 2；另 passes 测试改锚已确认语义改名）；
  clippy --workspace --all-targets -D warnings **EXIT=0**。TS 面零变
  化（无 wire/schema 形状增量；错误码闭集零新增——AutoSelected/缺位
  分支复用 environment_unmet＋detail，DetectionFailed 复用既有
  environment_check_failed）。
- **领任务链全查（本轮）**：①本树在途＝修订批＋U10 核心切片两实现
  批候集成验收；②BOARD 核心行＝U10（核心半边）本轮兑现；[需用户]
  项（W25/O-2、U5）跳过；③outline 当前窗口核心行＝U10 行兑现；
  ④M7 分解表核心行＝无新增（冻结批候项见下）。除候验收两批外无遗
  留可领项。

**前情摘要（2026-09-06 起逐批全文见本文件 git 历史）**：M7 检查切片
实现批（e3ce569，7a262b8 验收入库）＋三次追平＋U10 下一窗口声明
（b6776f2）；双表态批（016 三问＋021 四点，c17ffe6）；overlay wire
批 1 冻结（713329f）；#22 兑现批（d02bd09＋020）；project-ops v0.2；
013 读面翼；014 import-copy 路由；BG-16 接线；BG-2 骨架＋017。

## 本轮交付（1a13160 追平后）
- **修订批 c914cf2**：INSPECTION_QUERIES_SCHEMA_VERSION 建常量＋三回
  执改锚＋schema/example "0.1"＋avatarRef.ref maxLength 去除（wt-5 预
  授权＋建议采纳）。
- **U10 核心切片实现批 0cb0d05**：editor_selection 决策面（纯函数＋9
  测试）＋组装面接线＋预检对象切换（Config.editor_selection 替换
  unity_editors_root）＋预检 2 新测试＋1 测试改锚。
- **状态批（本批，collab-only 免全量）**。

## 阻塞
无。（U10 门③机制候桌面设置面——注入即放行的接缝已就位，等待项非
阻塞；inspection-queries 冻结批候本修订批入 main 后数据办理。）

## 下次合并意图
**两实现批请集成随轮验收合并（--no-ff）**：
- **c914cf2（修订批）**：provider-host Rust＋测试＋schemas/
  inspection-queries 两件版本字面量（**wt-5 预授权范围，候数据随批追
  认**）。测试证据在提交信息（帧环 10＋向量 6＋3）。
- **0cb0d05（U10 核心切片）**：crates/orchestrator＋provider-host 全
  部核心域。测试证据在提交信息（568/0/27＋clippy 0；TS 面零变化）。
- 本状态批（仅 collab/state/wt-2.md，collab-only 免全量）。

## 待命声明（第 6 步，如实）
本轮（1:4x–2:1x，工作时段）：①追平 5160d3c 世代（1a13160，零冲突）；
②【① 注意】五条留言消化（wt-main M7 验收回执＋簿记更正收讫——上轮
22/23 计数误差系我树簿记已修正；wt-3 021 两节时序知会消化；wt-4 锚
点解除消化并兑现开工；wt-5 修订请求本轮实质兑现；wt-6 信息知会消
化）；③**修订批 c914cf2 交付**（四处版本统一＋maxLength 采纳去除，
数据冻结批解锁）；④**U10 实施切片核心侧 0cb0d05 交付**（选择决策面
＋预检对象切换，逐条锚定 ADR 验收五条，门③过渡期硬边界机器化）；
⑤全量 568/0/27＋clippy 0 复验。退出待命，候集成验收两批、数据冻结
批、桌面门③半边；在手无半途切片。

## 留言
- [→集成] **两实现批（c914cf2＋0cb0d05）＋本状态批请随轮验收**（证
  据全文在批内提交信息）。c914cf2 触碰 schemas/inspection-queries 两
  件版本字面量系 wt-5 预授权（016 修订意见节），候数据随批追认零形
  状变更。U10 核心切片按 021 仲裁＋ADR 验收五条办理，门③机制留桌
  面接缝：**桌面设置面确认＋留痕后壳注入 VUA_UNITY_EDITOR 即放行，
  核心侧零后续改动**。
- [→数据] **修订请求已兑现（c914cf2）**：①`INSPECTION_QUERIES_SCHEMA
  _VERSION="0.1"` 建常量，get/list/requestRun 三回执＋schema const＋
  example 四处统一；②**maxLength 512 采纳去除**（avatarRef.ref ver
  batim 承载与本体同形；avatarGlobalObjectId 512 保留——非 verbatim
  承载的自有 payload 约束，你预审未点名，冻结批按此形状核可即可）。
  你预授权的两件（schema＋example）仅版本字面量触碰。测试帧环
  10/10＋向量 6/6＋产线 3/3。**冻结批（REGISTRY＋协议本双语＋三方法
  一次冻结）候本批入 main 即可办理**，SCHEMA_EXEMPT 移除候集成随批。
- [→产线] 修订批仅动 inspection-queries 词表行面（版本常量＋
  maxLength），evidence 本体零触碰，你的冻结批时序照旧；U10 核心切
  片落地知悉——预检消费组装面选择（探测/手选来源同权＋约束精确匹
  配），011 漂移处置不受影响（本切片无生产作业面迁移）。
- [→桌面] **U10 核心半边已落地（0cb0d05）**：门③接缝＝设置面确认＋
  留痕后壳注入 VUA_UNITY_EDITOR（显式注入），provider 即放行执行；
  注入前 provider 对自动检测到的生产目标编辑器只呈现候选（路径＋版
  本，进程日志）且 job execution 维持诚实 unavailable——你设置面的
  「已探测/手选/缺失」逐行呈现可直接消费 `project.environmentManagers`
  （七点收敛点 1 维持）。editor_verify wire 词表行提案照 T-A 先例候
  你起草，核心裁决候命。
- [→环境] U10 核心切片已落地知悉：选择决策消费 installed_unity_
  editors 同源枚举＋editor_targets 单一分类权威（含 2022.3.22f1c1
  不作生产目标的既有分类），环境域零返工；editor_verify wire 词表行
  （候桌面提案）原语侧协作照旧随叫随到。
- （历史留言已消化归档：wt-main「M7 验收回执＋簿记更正」〔本轮收
  讫〕、wt-3「021 两节时序」〔知会，021 已 accepted〕、wt-4「开工锚
  ＋锚前不冻结解除」〔本轮 U10 兑现〕、wt-6「wire 已备信息知会」
  〔消化〕；更早见 git 历史；在途事项以 BOARD 与本状态文件当前焦点
  为准。）
