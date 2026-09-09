---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 2263577
updated: 2026-09-09
---
## 当前焦点
**IMP-3 契约先行切片已交付（2688105，slot/wt-5）**：bdl-commands v0.4 新命令
`warehouse.importDownloads`（下载落库）——Schema＋正负例向量＋acquisition
采纳任务＋向量驱动消费测试＋双语协议本＋REGISTRY，冻结硬前置域内部分全齐。
开工依据＝用户裁决 U7-③；分流照 C-1（域内命名/字段自决，wire 路由归核心，
TS 面归桌面，跨域分歧集成仲裁）；host 无关照 C-3（域清单是运行时策略，
绝不进契约）。**待集成验收合并**。
## 自基线交付（6c4d989 后，十九 tick）
- **v0.3 头部状态对齐小修（dcf1322）**：v0.3 协议本双语头部按 v0.2 先例改
  「已取代（→ v0.4）」横幅（冻结正文不动）——修复 2688105 REGISTRY 行改动
  引入的登记表校验异常；**登记表校验 38/38 全一致**。
- **v0.4 契约先行批（2688105）**：
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
**v0.4 契约先行批（2688105）＋v0.3 头部对齐小修（dcf1322）＋本状态批请集成
验收合并**（我域文件＋文档；wire 路由与 TS 面登记是核心/桌面后续批，非本批
内容）。合并后数据下一切片候补：①W23/生产证据存储实现（随 W20 实现切片）；
②采纳任务与核心 wire 路由对接批的配套（若核心路由批提出域内调整随动）。
## 待命声明（第 6 步，如实）
IMP-3 交付后数据侧无在手工作：候补①依赖核心 W20 后续刀排期、候补②依赖核心
wire 路由批；M6/M7/M8 分解表无数据角色新行；BOARD 无归数据之开放问题。等待
集成验收与核心/桌面接线批，退出待命。
## 留言
- [→集成] **v0.4 验收请求**（2688105）：冻结硬前置域内部分齐（Schema＋
  向量＋消费测试＋双语协议＋REGISTRY）；**TS 登记未齐**——冻结注记已按
  v0.3 先例诚实声明「renderer TS 面待桌面登记；wire 路由待核心执行；完成
  接线前不得声称端到端」。验收门槛照 F-2。
- [→核心] **wire 路由请求**：provider-host `warehouse.importDownloads`
  路由（照 `warehouse.import` 先例：任务化受理、信封 v0.3、词表外
  invalid_params）；C-1 分流生效——命名/字段我域已自决（`downloadIds`
  仅身份、无路径无产品断言），路由侧如需域内调整请走提案，分歧集成仲裁。
  挂点接线设计留言（010 五点）已消化——挂点批已落地并交六承诺符合性
  声明，无需后续动作。
- [→桌面] **TS 面登记请求**：bdl-commands v0.4（六命令闭集；新命令
  importDownloads 请求/受理形状见协议本 §命令语义 6）。登记完成前 v0.4
  冻结注记保持「未接线不得称端到端」。wt-3 留言（U8 ⑤呈现层屏蔽＝桌面
  切片、词表零变更）已消化——裁决 10 已落账，bdl-commands v0.4 升版与
  U8 问⑤无关（本版是下载落库新命令，W14 语义未动）。
- [→产线] 条目 2/3 域内事实复核：**确认无出入**——deleteOriginals 协议
  动作在 v0.4 闭集内保留（导入链路消费不变）；本地导入协议已备
  （warehouse.import v0.3→v0.4 语义未动）。
- [→环境] 白名单域分析留言（项 4）已消化——本地爬虫 html 只读参考、严禁
  入库已备案（裁决 4）；域清单产出归下载/呈现域契约，bdl-commands v0.4
  已按 C-3 保持 host 无关（域清单永不进本契约）。
- （历史留言已消化：跨域需求意向（009/010 吸收）、010 表态（已收口）、008
  全链、U3 边界知会、术语裁定承诺——均已闭环。）
