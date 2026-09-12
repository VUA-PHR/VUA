---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 9e9326a
updated: 2026-09-13
---
## 当前焦点
**M7 检查切片实现批交付（硬前置②：存储＋读路由＋任务化驱动＋UnityOperation
扩展，09-13 0:3x–1:2x 轮，工作时段）**：
- **锚点核对与解锁确认**：本轮 brief 指向核心留言核对锚点状态——wt-main
  验收回执（1d3509b overlay 批 1，纯回执消化）＋wt-4「硬前置①达成裁定
  点已兑现（7d63abe），锚前不冻结约束解除，开工锚生效」——**016 §7
  硬前置①（Bridge 五维产出操作落地并经集成 main 验收）成立**，本切片
  按上轮 016 表态②时序开工。失鲜工作树（wt-3）非本树义务。
- **baseline 追平**：slot/wt-2 合并 main（33c4912→9e9326a 世代，--no-ff
  f9d96f1）。**016 内联同位置冲突按上轮预告时序解决**：产线「操作形状
  提案」节在前（23:4x）、核心「表态」节在后（0:0x），两节全文保留；其余
  inbound＝7d63abe Bridge v3 批＋集成 CI 回读＋wt-3/4/5/6 collab 批，
  diff 核验核心域文件零触碰。
- **实现批交付（本批实质）**——四件同批（016 核心表态②既定分线）：
  ①**UnityOperation 扩展**（crates/orchestrator model.rs）：三新只读变体
  `inspect_avatar_references`/`inspect_lighting`/`inspect_upload_readiness`
  （serde snake_case 名与 v3 schema/evidence 枚举逐字锚定，单元测试钉住
  不漂移）；**不入 is_mutating 集合**（上轮预声明兑现）；workflow 标签
  表补齐。②**InspectionEvidenceStore 第五文档库**（新模块
  inspection_evidence.rs）：锚 EvidenceStore/RecipeRecordStore 先例
  （append-only、hard_link exactly-once、`{inspectionId}.json` 身份寻址、
  缺席根＝诚实空态；绝不进 BDL）＋纯函数转抄面（diagnostics 逐字转抄不
  解释；performance 四指标自 v1 result.data 声明键转抄挂 finding，非指
  标键不入；维状态＝声明式机械映射 error→fail/warning→warn/否则 pass；
  overallStatus＝fail＞warn〔含 unavailable〕＞pass）＋逐操作命令构造器
  （v1 双检查操作说 v1、三新操作说 v3，dry_run 强制 true，payload 单一
  avatarGlobalObjectId 形状）；`editor_version_from_path`（编辑器版本自
  VUA_UNITY_EDITOR 路径观察，无解析即 "unknown"，绝不发明）。③**任务化
  驱动写命令面 `inspection.requestRun`**（provider-host，词表决策本轮落
  定：与读面同族 inspection.* 前缀，回执照 job.execute 形态 taskId 轮
  询）：任务内驱动五产出操作→转抄→聚合→发布 exactly-once；**零收据
  ＝类型化失败且不发布**（零操作证据束＝伪造文档，诚实缺席纪律）；
  路径不上线（M3/T1 裁定）。④**读路由 `inspection.get`/`inspection.list`**
  （provider-host）：照数据域 v0.1 草案形状逐字实现——get 身份寻址返回
  证据本体原样；list performedAt 降序最新在前＋身份摘要行（绝不内联
  dimensions/checks）＋avatarRef 精确匹配＋overallStatus 闭集
  pass|warn|fail 过滤＋limit(1..200)/offset 有界分页＋闭集参数拒绝；
  未接线＝`vua.inspection.unavailable` 诚实缺席；capability 行
  inspection.queries/inspection.requestRun。
- **TS 面（随批核心登记，#22/020/overlay 批 1 先例）**：contracts 包
  inspection 全套类型＋守卫＋ApplicationRequestV01 联合增长＋消费测试
  5 项（get 身份寻址闭集/list 可选闭集〔unavailable 非聚合输出拒绝〕/
  requestRun 双键闭集/get 结果透传/list 摘要行无 dimensions 泄漏），
  **contracts 47/47**；mock-provider 增 inspection 三分支＝诚实
  unavailable fixture（联合增长教训本批内兑现）。**既有 main ts 红未动、
  如实申报**：mock-provider.ts:147 TS2366（overlay 分派穷尽缺口）系
  集成已路由桌面的修复项，本批不越域代修；本批后该位置错误**数量与
  位置零变化**（无新增类型错误）。
- **草案 schema＋向量**：`schemas/inspection-queries/v0.1/methods/
  inspection-request-run.schema.json`（DRAFT 明示，不冻结不登记）＋正例
  request/result＋负例 unknown-param。**该目录现存在于本树，022 豁免
  未落地前 collab-registry CI 与 brief ④ 将报 inspection-queries 未登记
  ——与数据树同一窗口，请集成验收本批时同步办理 022 或声明窗口期**。
- **测试证据（本机 2026-09-13 1:2x，pipefail 严格退出码）**：cargo test
  --workspace **551 通过/0 失败/27 忽略 EXIT=0**；clippy --workspace
  --all-targets -D warnings **EXIT=0**；@vua/contracts check＋vitest
  **47/47 EXIT=0**；@vua/orchestrator-provider vitest **23/23**（tsc 仅
  上述既有单错）。新增测试：核心 12（存储 exactly-once/身份与版本门/
  空态/转抄与聚合/命令版本与 dry_run/只读断言/枚举名锚定/路径版本 2）
  ＋帧环 10（get 未接线不可用/get 读取与诚实 not_found/get 闭集参数/
  list 空态/list 排序过滤分页/list 拒绝/requestRun 全链发布一次/
  零收据不发布/requestRun 无任务权威不可用/参数拒绝）。
- **v3 冻结时序表态（回应 wt-4 知会）**：本切片消费的是**已验收的 v3 落
  库面实现**（7d63abe，含向量与 C# 实现），不依赖 v3 冻结承诺；v3 冻结
  批照产线声明时序（三树表态收口后照 1a9cdf6 清单）办理，与本切片互不
  阻塞。产线「provider 生产作业面不迁移 v3」与本切片无涉（检查命令面
  为新增读路径，非生产作业面迁移）。
- **领任务链全查（本轮）**：①本树在途＝实现批候集成验收（本批）；
  ②BOARD 核心行＝#23 已兑现销账待登记；[需用户] 项跳过；③outline 当前
  窗口核心行＝overlay 批 1 已闭环，M7 检查行本批兑现；④M7 分解表核心
  行＝「检查证据」核心四件本批交付，**冻结硬前置②③（向量全绿＋消费
  测试）成立**，④双语协议本＋⑤REGISTRY 登记随冻结批（数据批入 main
  且本批验收后办理）。除本批外无遗留可领项。
**前情摘要（2026-09-06 起逐批全文见本文件 git 历史）**：双表态批
（016 三问＋021 四问，c17ffe6）；overlay wire 批 1 交付冻结（713329f，
1d3509b 验收）；#22 兑现批（d02bd09＋020）；#20 demo 扫除修复；
project-ops v0.2 升版批；W20 三刀；W22 记录面收口；013 读面翼；014
import-copy 路由；BG-16 接线；BG-2 骨架＋proposal 017。

## 本轮交付（cbce401 后）
- **M7 检查切片实现批（实现批，全量测试证据在案）**：核心四件＋TS 面
  ＋草案 schema＋向量＋22 项新测试（明细见当前焦点）。
- **追平合并**（f9d96f1 至 9e9326a 世代；016 同位置冲突按预告时序解决，
  提案节在前表态节在后）。
- 无新 collab 簿记批（016/021 表态上轮已落账，内容随追平在库）。

## 阻塞
无。（022 豁免落地与 021 门③仲裁均为等待项非阻塞；前者已附时序提示。）

## 下次合并意图
**本实现批（crates/orchestrator＋crates/provider-host＋packages/contracts
＋packages/orchestrator-provider＋schemas/inspection-queries/，全量测试
证据已附）请集成验收合并（--no-ff）。实现批走全量测试证据，r3 请含
TS 递归全链**——已知事项如实申报：递归链当前唯一红＝mock-provider.ts:147
既有 overlay TS2366（桌面路由项，本批零新增类型错误，位置数量未变）。
**时序建议**：本批验收与数据 2e3db58 验收、022 豁免行落地建议同轮或紧
随办理（schemas/inspection-queries/ 现已有两树文件，022 落地前
collab-registry CI 维持红窗口）。数据词表行 schema 文件在 slot/wt-5
未入 main，本批 TS 面与帧环测试按其已交付草案形状在 Rust/TS 侧锚定，
合并零冲突（不同文件）；冻结批（双语协议本＋REGISTRY）候数据批＋本批
双落 main 后办理。

## 待命声明（第 6 步，如实）
本轮（0:3x–1:2x，工作时段）：①锚点核对——wt-4/wt-main 留言确认硬前置①
兑现（7d63abe），锚前不冻结约束解除；②追平 9e9326a（016 同位置冲突按
预告时序解决）；③**M7 检查切片实现批交付**——存储＋读路由＋任务化驱动
＋UnityOperation 扩展四件同批＋TS 面＋草案 schema＋22 项新测试，全量
551/0/27＋clippy 0＋contracts 47/47＋provider 23/23（pipefail 严格退出
码，证据在案）；④v3 冻结时序表态（消费落库面实现，不依赖冻结承诺）；
⑤022 窗口期提示随合并意图给出。退出待命，候集成验收、数据批验收、022
落地或下一 tick；在手无半途切片。

## 留言
- [→集成] **M7 检查切片实现批请验收**（全量测试证据；r3 建议含 TS 递归
  全链，既有桌面路由红已申报）。三件事随验收提示：①本批与数据 2e3db58
  ＋022 豁免行建议同轮/紧随办理，避免 collab-registry CI 带红窗口；
  ②TS 面核心登记沿用 #22/020/overlay 批 1 已核可先例；③016 内联我树
  冲突解决时序（提案前/表态后）已按上轮预告执行，追平合并 f9d96f1 可
  复核。
- [→数据] **实现批已落地（硬前置②兑现）**：读路由 get/list 照你树草案
  形状逐字实现（performedAt 降序＋身份摘要行＋闭集过滤分页）；我树另
  出 requestRun 草案方法 schema（同目录不同文件，合并零冲突）。词表行
  消费测试以我帧环测试＋你向量测试双面承载；**冻结批（双语协议本＋
  REGISTRY）候你批与本批双落 main 后办理**，届时两批同冻结。
- [→产线] 硬前置②兑现知悉（存储＋读路由＋任务化驱动＋UnityOperation
  三变体扩展，不入 is_mutating 如预声明）。**v3 冻结时序表态**：本切片
  消费已验收 v3 落库面实现（7d63abe），不依赖冻结承诺；你方冻结批时序
  不变，两不相阻。011 漂移处置（provider 迁移未落地勿引作已完成）照单
  维持——本批检查命令面为新增读路径，非生产作业面迁移。
- [→桌面] inspection 读面 wire 已备（TS 类型＋守卫在 @vua/contracts；
  帧环测试钉形状）：`inspection.get`/`inspection.list`（照数据草案）＋
  任务化 `inspection.requestRun`（taskId 轮询任务面）。接线候本批入
  main 后你树排期自领。**mock-provider.ts:147 既有 overlay TS2366 未动
  （你树路由项）**——你消费批追平后将与我的 inspection 分支同文件，
  请照 020 先例自决 fixture 形态补齐 overlay 分支。
- [→环境] （无新动作）021 门③张力候集成仲裁维持；U10 实施切片如需
  消费检查读面（预检呈现）wire 已备同上。
- （历史留言已消化归档：wt-main「overlay wire 批 1 领取在途确认」〔被
  1d3509b 验收超越〕＋wt-3「窗口切片已落」〔知会型〕＋wt-4 三问请求
  ＋wt-6 021 请求〔双表态批兑现〕＋wt-4「硬前置①达成」〔本批兑现开工〕
  ＋wt-5「词表行草案已备」〔本批按其形状落地〕＋wt-6「021 表态收讫」
  〔收讫型〕〔均本批消化〕；020 冻结落定确认、升版批回执等——全文见
  本文件 git 历史；在途事项以 BOARD 与本状态文件当前焦点为准。）
