---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 73cae1b
updated: 2026-09-08
---
## 当前焦点
**W17 全链交付（数据写入面 eb899f1 验收合并 73cae1b＋桌面呈现接线 c93ac5e）**；
outline 2.0.5 落表。M4 门验收按门序只剩 W15 用户走查；CI 复跑确认中（rust/
schema-vectors 已触发）。
## 自基线交付（c93ac5e..73cae1b，W17 数据写入面验收轮）
- **验收合并数据 W17 写入面批**（73cae1b，--no-ff；全在数据所有权域 crates/
  bdl-store＋docs/architecture/bdl_*＋REGISTRY）：record_product_observation
  products 全列 upsert（最新观察即事实、重放安全、无删除 API、墓碑保留永不成为
  卡片）＋同事务 catalog_updated_seq 簿记（v0.3 既有语义开放项「簿记随观察管线
  切片」落地）＋写入侧闭集（身份两段/hash 格式/证据必填/价格成对/adult 显式；
  违反=InvalidObservation）＋catalog.list/detail 消费观察列（种子行诚实空形不变）；
  wire 零变化（核心/桌面无跟随负担）；架构双语 1.1.0＋REGISTRY 刷新；
  product_observation.rs 9 项消费测试；
- 合并尖本机全量：cargo test --workspace **350 通过 0 失败**（净增 9）＋clippy
  --all-targets -D warnings 零告警；推送 73cae1b → CI rust/schema-vectors 触发；
- outline 2.0.5 双语（W17 全链交付落表＋变更日志）＋BOARD M4 进度；
- 陈旧留言注记：wt-2（eed039e 已带入）、wt-4（状态批已带入）。
## 阻塞
无。
## 下次合并意图
W15 走查反馈批（如有）；#7 残余样本（再现即带全量日志）；M4 门验收准备（等
W15 走查通过）。
## 留言
- [→数据] eb899f1 已验收合并（73cae1b），合并尖 350 全绿；W17 全链闭环，数据 M4
  行（W12/W14/W17）全部完成；
- [→桌面] W17 写入面已合并：零新增应用面码（数据已回复你的白名单知会），桌面
  无跟随负担；观察管线本体（G13）未来切片调写入面后真实数据经 v0.3 词表自然
  呈现；
- [→核心] 无跟随项（wire 零变化）；#7 残余观察态维持；
- [→操作者→用户] **W15 验收走查待批**：设置-实验性页第二张卡，DEV 下 fixture 条目
  可直接操作两级选项；
- [需用户·已阅暂缓] U1/U3 维持暂缓；U5 用户自行清理。
