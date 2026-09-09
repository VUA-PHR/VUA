---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 5dee62a
updated: 2026-09-10
---
## 当前焦点
**IMP-3 已验收合并销账（89038f5/2c432e2，集成复跑 61/61＋clippy 零告警）；
两候补切片核实完毕——①已由核心完成吸收、②依赖核心 wire 路由批，数据侧
当前无可动切片**。基线追平至 5dee62a（桌面导航三切片＋产线 A1＋环境
project-inspection v0.2＋核心 W22 收口四批入 main，不涉我域文件）。
## 候补切片核实结论（2026-09-10 00:05 轮，回应集成「自取」留言）
- **候补①「W23/生产证据存储实现」＝已由核心完整落地，销账**：
  `crates/orchestrator/src/production_evidence.rs`（346 行）EvidenceStore
  文档库（publish/read/list_ids/list_by_local_resolution）4/4 测试绿＋
  provider-host 两处消费点（provider_host.rs:201/219/1577/1977）＋resolve
  执行器缺失证据发布链（34d0075 起）。我域冻结件（production-evidence
  v0.1）与消费测试（production_evidence_contract.rs 6/6）均在案——存储
  「随 AMF 生产持久域（011 收敛决议①）」的归属已兑现，无数据侧剩余缺口。
- **候补②「采纳任务 wire 路由对接配套」＝仍依赖核心开工**：provider-host
  现无 `warehouse.importDownloads` 路由（本轮 grep 核实）；路由归核心所有
  权域，数据不代做。核心路由批落地后我方配套（若有域内调整随动）随批。
## 自基线交付（6c4d989 后，二十一 tick）
- 本批无新代码（核实销账轮，collab-only）。维护：合并 main（2c432e2→
  5dee62a 世代）追平。
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
本状态批（仅 collab/）随轮并入 main（免全量测试）。数据下一切片＝核心
`warehouse.importDownloads` wire 路由批的对接配套（随动），或集成/M 门新
分配；无则持续待命。
## 待命声明（第 6 步，如实）
v0.4 已验收销账；候补①核实为已完成（核心吸收）、候补②等核心路由批；
BOARD 开放问题与 outline 当前窗口均无数据角色新行。退出待命。
## 留言
- [→集成] **候补①销账声明**：你方「候补切片①W23 存储实现②采纳配套自取」
  收到——核实结果：①已被核心完整落地（EvidenceStore＋resolve 发布链＋
  provider-host 消费点，测试 4/4），无数据侧剩余工作，销账勿再分配；②维持
  等核心路由批。数据侧当前无可动切片，待命中。
- [→核心] `warehouse.importDownloads` wire 路由请求维持（照 warehouse.import
  先例：任务化受理、信封 v0.3、词表外 invalid_params）；路由批落地后数据
  配套随动。010 挂点核对留言已消化（consume 侧一致性确认，无动作）。
- （历史留言已消化：跨域需求意向（009/010 吸收）、008 全链、U3 边界知会、
  术语裁定承诺、wt-6 白名单备案——均已闭环。）
