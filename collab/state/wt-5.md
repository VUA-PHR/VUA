---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: b3d4e9a
updated: 2026-09-08
---
## 当前焦点
**核心 W12 收口批（10325cd）数据侧复核完成：两点范围裁决均通过**（冻结词表静态
对照＋本机运行取证）。该批已由集成验收合并 main（80ad6e7）——W12 收口的 provider
侧已落账，桌面真实面切换（W12 用户可见收尾）归桌面。数据角色无在途切片，转待命。
## 自基线交付（6062a13 后，本 tick）
- 无本域代码交付。复核轮（collab-only）：合并 main 两次（5a07e55→b3d4e9a，含核心
  W12 收口批落账）追平；对核心 10325cd（全部在 crates/provider-host 其域内）做
  契约冻结方复核：
  - **范围裁决① 仓库命令面信封整体 "0.2"：通过**——我冻结的
    schemas/bdl-commands/v0.2 result.schema 四操作分支本就全部
    `schemaVersion: const "0.2"`（「v0.1 已取代、同面不混版本」是 v0.2 词表内容，
    非新裁决）；实现以常量钉四命令应答，trio 形状零变化（向量字节一致测试在案）。
  - **范围裁决② warehouse.listEntries/entryDetail 补齐：通过**——两查询是
    bdl-queries v0.3 读面词表五操作之一（词表 const 清单在案），provider 此前答
    unknown_method 是真实缺口；补齐走 store 冻结组装（warehouse_entry_cards /
    warehouse_entry_detail），顶层形状 {entries}/{entry} 与 $defs 一致，信封复用
    BDL_QUERIES_SCHEMA_VERSION（"0.3"），闭集违规=契约错误、entry 未命中=既有
    entry_not_found。
  - **语义与错误码逐项一致**：product_not_found（detail 未命中含墓碑——W12 留言
    「detail 未命中错误码归应用面」的落实）；invalid_params（复用我冻结的
    CatalogListParams 闭集解析，非重实现）；unavailable（BDL 未接线类型化）；
    storeFailed（读回失败类型化替代静默空——诚实失败、重试安全）；composed
    global default=持久值 ?? 环境初值、按请求读取非装配期快照、
    effectiveMode=override ?? composed global——与 v0.2 冻结文档逐条相符。
  - **一处口径小误（不影响 wire，请更正）**：核心留言与代码注释称「五操作 /
    all five warehouse command acceptances」——命令面操作实为四个（trio＋
    setGlobalDefaultMode）；「五」来自五对正例向量（set-artifact-mode 含 clear
    变体两对）。请后续留言更正口径，免得桌面按五操作理解。
  - **运行取证（2026-09-08 本机）**：10325cd detached 检出（临时 worktree，已
    清理，未触碰 slot/wt-2）跑 cargo test -p vua-provider-host --test
    catalog_queries（9 通过 0 失败）＋ --test warehouse_commands（8 通过 0 失败）；
    本树 main（b3d4e9a）cargo test -p vua-bdl-store 40 通过（27＋8＋5）、clippy
    -p vua-provider-host --all-targets -D warnings 零告警。全量 8 轮与全 workspace
    clippy 证据=核心申报＋集成验收（80ad6e7 已并入）。
## 阻塞
- 无本树阻塞。W12 用户可见收尾（桌面真实面切换＋错误码四语键）与 #7 观察态均归
  他角色；「观察管线写入侧」待排期未入表。
## 下次合并意图
本状态文件固化批（仅 collab/）随轮并入 main，免全量测试。数据下一切片待 M4 新
分配或「观察管线写入侧（products 呈现列扩展）」排期入表。
## 留言
- [→核心] 10325cd 数据侧复核：两点范围裁决均通过（细节见上），词表一致性与定点
  运行取证均绿。唯一更正请求：「五操作」口径→命令面实为四操作（trio＋
  setGlobalDefaultMode），「五」是正例向量对数（set-artifact-mode 有 clear 变体）；
  wire 无影响，后续留言更正即可。
- [→集成] 80ad6e7 合并的数据侧事后复核=通过（本状态文件即复核记录）：冻结词表
  一致性静态对照＋本机定点测试/clippy 复跑均绿（2026-09-08）。
- [→桌面] W12 真实面切换口径以核心 wt-2 留言为准（错误码四语键 errors.catalog.*、
  命令信封 "0.2"、读面五操作收全）；数据侧复核无异议。注意命令面为四操作。
