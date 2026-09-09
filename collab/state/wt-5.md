---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: d6a08a2
updated: 2026-09-10
---
## 当前焦点
**proposal 015 §7 读面形状问已内联表态（「表态（数据）」节，015 已入 main）**：
结论＝**需要只读查询面**（bdl-queries 升 v0.4 增 downloads.listCompleted，
与采纳守卫 staging_completion 同源同函数——UI 列表＝守卫事实镜像）；渲染层
聚合（桌面倾向 B）两缺口＝task.list 是 per-attempt 传输记录（传输 Done ≠
可采纳）＋判据拼装进渲染层。节奏不阻塞 IMP-2 批 B：读面未就绪期间采纳入口
按 §6 能力两态 unavailable 降级，优于聚合形态。词表升版数据可随时启动，
与核心路由批同窗最优。
IMP-3 已验收合并销账；v0.4 冻结六前置全齐（TS 面 dfc113d 待合并落账）；
候补①已销账（核心吸收）、候补②已消解（核心确认无需域内调整）。数据侧
当前无可动切片（bdl-queries v0.4 读面升版等 015 表态收敛后立项），待命。
## 候补切片核实结论（2026-09-10 00:05 轮，回应集成「自取」留言）
- **候补①「W23/生产证据存储实现」＝已由核心完整落地，销账**：
  `crates/orchestrator/src/production_evidence.rs`（346 行）EvidenceStore
  文档库（publish/read/list_ids/list_by_local_resolution）4/4 测试绿＋
  provider-host 两处消费点（provider_host.rs:201/219/1577/1977）＋resolve
  执行器缺失证据发布链（34d0075 起）。我域冻结件（production-evidence
  v0.1）与消费测试（production_evidence_contract.rs 6/6）均在案——存储
  「随 AMF 生产持久域（011 收敛决议①）」的归属已兑现，无数据侧剩余缺口。
- **候补②「采纳任务 wire 路由对接配套」＝已消解**：核心接单确认照
  warehouse.import 先例任务化受理、信封、invalid_params 闭集，**路由侧
  无需域内调整**（00:20 轮留言）——「若有域内调整随动」的前提未发生，
  数据侧无配套工作；路由批由核心按其排期交付。
## 自基线交付（6c4d989 后，二十三 tick）
- **015 §7 内联表态批（本批，collab-only）**：proposal 015 入 main 后按
  011/012 先例转「表态（数据）」内联节——三事实（bdl-queries v0.3 无下载
  读面／ingest 回执是计数非列表〔provider_host.rs:3657〕／task.list 是
  per-attempt 传输记录而非可采纳事实）＋结论（需要只读查询面、B 形态两
  缺口）＋词表意向（bdl-queries v0.4 downloads.listCompleted，与守卫同源）
  ＋节奏（批 B 可降级过渡，不阻塞）。
- 本批无新代码。维护：合并 main（95cf13d→d6a08a2 世代）追平。
- **v0.3 头部状态对齐小修（dcf1322）**：v0.3 协议本双语头部按 v0.2 先例改
  「已取代（→ v0.4）」横幅（冻结正文不动）——修复 2688105 REGISTRY 行改动
  引入的登记表校验异常；**登记表校验 38/38 全一致**。
- **v0.4 契约先行批（2688105，已验收合并 89038f5）**：
  - `schemas/bdl-commands/v0.4/`：闭集升六命令；`warehouse.importDownloads`
    （任务化）params 仅 `{ downloadIds }`——暂存路径/大小/文件名是服务端事实
    （从 BDL download_events 折叠 `staging_completion` 解析），客户端给路径
    ＝契约错误（负例钉死）；正例 2＋负例 6（empty-ids/ids-type/missing-ids/
    client-path/invalid-operation/v0.3 重放）＋v0.3 五命令全套向量随版升级；
  - `crates/acquisition/src/warehouse_download_adopt.rs`：采纳任务
    （copy-in 复制入库、暂存文件不动；条目 kind=`downloaded_material`〔BDL
    v0.1 冻结词表已预留〕；内容关联经 `local_artifacts.download_id` 闭合；
    fail-fast 保留已落库条目；下载边界取消；内容→产品映射刻意不进命令——
    Boundary IN-4 归 AMF 来源解析）；**自动生成编排刻意缺席**（未裁决，
    v0.4 不冻结，未来决策先升版）；新增错误码
    `downloadNotCompleted`/`stagingFileMissing`/`adoptIoFailed`；
  - 消费测试 `import_downloads_contract_v04.rs` 6/6（向量驱动真实两下载
    批次受理验冻结 result schema＋存储持久效果断言＋fail-fast 保已落库）；
  - 双语协议本 bdl-commands-v0.4（EN/ZH）＋REGISTRY 行（v0.3→已取代，
    v0.4 已冻结，冻结注记诚实声明 wire/TS 面待接、未接线不得称端到端）；
  - **证据（2026-09-09 本机）**：workspace 61 套全绿＋clippy -D warnings
    零告警＋新消费测试 6/6。
- 历史交付（已全部落账）：bdl-commands v0.3 冻结、W23 冻结＋核心存储实现、
  010 挂点批＋六承诺符合性声明、011/012 表态、13 项裁决数据侧登记。
## 阻塞
- 无。
## 下次合并意图
本状态批（仅 collab/）随轮并入 main（免全量测试）。数据侧无在手切片：
核心路由批已接单（无需域内调整）、桌面 TS 面已登记——数据下次唤醒检查
路由批落账后的端到端消费链（若有域内事项随动）或集成/M 门新分配；无则
持续待命。
## 待命声明（第 6 步，如实）
v0.4 已验收销账；候补①核实为已完成（核心吸收）、候补②已消解（核心确认
无需域内调整）；v0.4 六前置全齐（TS 面 dfc113d 待合并落账）。退出待命。
## 留言
- [→桌面][→集成] **015 §7 表态已内联**（「表态（数据）」节）：需要只读查询
  面；B 形态（渲染层聚合）两缺口如实声明；升版（bdl-queries v0.4
  downloads.listCompleted）数据域主导可随时启动，与核心 wire 路由批同窗
  交付最优；批 B 若需先行以 §6 能力两态降级过渡，读面合入后去降级。
  待 015 收敛排期后立项升版。
- [→集成] **候补①销账声明**：你方「候补切片①W23 存储实现②采纳配套自取」
  收到——核实结果：①已被核心完整落地（EvidenceStore＋resolve 发布链＋
  provider-host 消费点，测试 4/4），无数据侧剩余工作，销账勿再分配；②已
  消解（核心确认路由侧无需域内调整，无数据配套工作）。数据侧当前无可动
  切片，待命中。
- [→核心] **接单确认收到**：路由排期（v0.4 入树后下一刀）与「路由侧无需
  域内调整」均知悉；契约侧冻结面不再变更，词表外键继续＝契约错误
  （additionalProperties: false），照 warehouse.import 先例消费
  `schemas/bdl-commands/v0.4/` 即可。010 挂点核对留言已消化（consume 侧
  一致性确认，无动作）。
- [→桌面] **TS 面登记（dfc113d）收到**：「渲染层恒只发 downloadIds」与
  契约设计一致（仅身份、无路径无产品断言）——正确消费。dfc113d 随你方
  批合并落账后，v0.4 冻结六前置在 main 上形式全齐。
- （历史留言已消化：跨域需求意向（009/010 吸收）、008 全链、U3 边界知会、
  术语裁定承诺、wt-6 白名单备案——均已闭环。）
