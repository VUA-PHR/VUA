---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 97390f8
updated: 2026-09-08
---
## 当前焦点
**W12 收口批 + W14 路由批交付（10325cd），#7 第三例定位修复（0a56f19）**。bdl-queries
v0.3 读面五操作在 provider 侧全词表路由；仓库命令面整体升 v0.2 信封；两级解析组装落地。
#7 CI 样本核实为测试侧竞态（产品顺序正确），修复后转观察态。
## 自基线交付（本 tick，两提交）
- **合并维护**：main（927de51..97390f8，W11 收尾 CI 三 workflow + v0.5.0 + M4 各批）
  merge 并入 slot/wt-2（a2c52d8，无冲突）。
- **#7 第三例（0a56f19）**：拉取 CI 日志（run 34137292736）核实 ph_012 panic 实为
  production_host.rs:1579 "lease released after success"，**非** 集成转述的"15s 未达
  Succeeded"——恢复任务已 Succeeded、命令数已过，租约未清。根因：worker 按 safe_to_stop
  设计**先落终态再释放 mutation gate**（provider_host.rs 注释即此序），释放含 marker/lock
  文件 I/O 先于 SQLite 删除；测试见终态立即断言租约为 none，2 核负载下输掉竞态。产品顺序
  正确不改；测试改有界轮询等释放（保留原 panic 消息供证据可比；真泄漏仍会 15s 后响亮失败）。
  残余观察（如实记录）：本机 8 轮全量中 1 次 14/1 瞬败（约 0.19s 套件、身份未捕获——
  输出未留存），随后 7 轮全绿；不猜测性修复，等带完整 panic 输出的样本。
- **W12 收口 + W14 配合 + 读面收全（10325cd，全在 crates/provider-host 本域）**：
  - catalog.list/detail/status 路由：复用数据侧冻结闭集解析（CatalogListParams）；
    应答 = 冻结 { schemaVersion:"0.3", operation, result } 文档，wire 与 store 组装逐
    字节相等（面不加不减）；空态过 wire 钉死；墓碑永不成为卡；detail 未命中（含墓碑）
    = 新应用面码 vua.catalog.product_not_found；闭集外键/值 = vua.catalog.invalid_params
    契约错误；BDL 未接线 = vua.catalog.unavailable。
  - warehouse.setGlobalDefaultMode（仿 setArtifactMode 先例）：同步写 bdl_meta，回执
    报从 BDL 读回的持久事实（非回显）；无 null 闭集（缺/null/词表外 = invalid_params）。
  - **仓库命令面整体升 v0.2 信封**：v0.2 已取代 v0.1 且对五操作钉死 "0.2"（trio 向量
    除版本号外字节一致），同面不混版本；warehouse_commands.rs 消费面向 v0.2 向量。
  - **两级解析组装（W14 裁决落 provider）**：composed global = bdl_meta 持久值 ??
    环境注入初值，按请求读取非装配期快照；统一用于 setArtifactMode 回读、任务规格、
    以及新旧读面查询——持久值一经写入即统治后续解析。
  - **warehouse.listEntries/entryDetail 读面补全**：桌面网关早已转发这两查询但
    provider 此前答 unknown_method（真实缺口）；本批按 v0.3 向量路由，读面五操作收全。
  - setArtifactMode 读回失败从"静默空 effectiveMode"改为 vua.warehouse.storeFailed
    类型化失败（诚实失败，重试安全）。
  - 测试：catalog_queries.rs 新建（冻结向量过真实帧环 ×9：正例 schema 校验、
    wire=assembly 相等、诚实空态、闭集负例、未接线类型化、warehouse 读面两向量）；
    warehouse_commands.rs 升 v0.2 + setGlobalDefaultMode 正/负例（+2）；rusqlite 入
    dev-dependencies（同钉版 0.40.1，墓碑辅助行与 bdl-store 消费测试同法）。
  - 证据（2026-09-08 本机）：cargo test --workspace 8 轮（末 7 轮全绿）+ clippy
    --all-targets -D warnings 零告警 + schema-vectors 定点面（bdl-store 2 套、
    acquisition 1、provider-host 3）全绿。
## 阻塞
无。#7 修复与本批合并由集成验收（rust 徽章转绿待 CI 复跑）。
## 下次合并意图
本批（0a56f19 + 10325cd + collab）请集成 --no-ff 随轮带入；W12 收口批含跨域消费面
（桌面 W12 真实面切换时对齐）。
## 留言
- [→集成] ① #7 第三例修复（0a56f19）与本批（10325cd）请随轮验收合并；合并后 rust
  徽章待 CI 复跑确认。② 纠正一处转述：CI ph_012 的 panic 是 1579 行租约断言
  （"lease released after success"），非"恢复任务 15s 未达 Succeeded"——已按 CI 原始
  日志定位，详情见 BOARD #7。③ 残余观察一条（8 轮全量 1 次未捕获身份瞬败）已如实
  记录 BOARD，继续观察态。
- [→数据] W12 收口与 W14 路由已交付（10325cd）：catalog 三查询 + setGlobalDefaultMode
  + warehouse 读面两查询全按 v0.3/v0.2 词表路由，wire=assembly 相等性有测试钉死。
  两点超出字面请求的范围裁决请复核：① 仓库命令面五操作信封整体升 "0.2"（v0.1 已取代，
  同面不混版本；trio 形状零变化）；② 顺手补齐 listEntries/entryDetail（桌面网关早已
  转发而 provider 未服务）。新增应用面错误码：vua.catalog.product_not_found /
  invalid_params / unavailable / store_failed。
- [→桌面] ① W12 真实面切换可开工：provider 已服务 catalog.* 与 warehouse
  listEntries/entryDetail（此前两查询在真实面会答 unknown_method，DEV fixture 不受影响）。
  ② 新错误码需要四语键：errors.catalog.productNotFound / invalidParams / unavailable /
  storeFailed（键先行，线协议按 key 传递）。③ 仓库命令应答信封现为 v0.2（schemaVersion
  "0.2"），仓储抽屉/实验性页对验收形状有本地断言的话请对齐。
