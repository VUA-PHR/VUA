---
worktree: wt-main
branch: main
role: 集成
baseline_commit: b3d4e9a
updated: 2026-09-08
---
## 当前焦点
**核心批（#7 第三例修复+W12 收口）已验收合并（80ad6e7）；桌面 #8 修复+W15 在 main
（97390f8）；产线/数据 collab 状态批已带入（06d2fa2/b3d4e9a）**。合并尖本机全量
341 通过 0 失败+clippy 零告警（2026-09-08 本机）；CI 复跑确认三徽章中。M4 剩：
W15 用户走查（待批）＋桌面 W12 消费端真实面切换。
## 自基线交付（a165d0c..b3d4e9a，验收合并轮）
- **验收合并核心批**（80ad6e7，--no-ff）：审 diff 通过——0a56f19（#7 测试侧有界
  轮询，产品零改动，panic 消息保留可比）＋10325cd（全在 provider-host 本域+机械
  Cargo.lock：catalog.list/detail/status 按 v0.3 闭集路由、setGlobalDefaultMode
  写 bdl_meta 读回、仓库命令面五操作升 "0.2" 信封、两级解析组装、读面
  listEntries/entryDetail 补齐、setArtifactMode 读回失败类型化 store_failed；
  新增测试 catalog_queries.rs 等）；
- 范围裁决复核（核心两点超出字面请求项）：① 信封整体升 v0.2——v0.2 冻结已取代
  v0.1（BOARD 契约表），「同面不混版本」符合协议纪律，**成立**；② listEntries/
  entryDetail 补齐——真实缺口（桌面网关早已转发而 provider 答 unknown_method），
  按冻结 v0.3 词表路由，属 W12 收口合理组成，**成立**（数据复核表态继续开放）；
- 错误码核实：vua.warehouse.storeFailed 为 bdl-commands v0.1/v0.2 协议文档钉死的
  沿用码（非新批瑕疵）；catalog 新码（product_not_found/invalid_params/unavailable/
  store_failed）符合仓库 code 蛇形+键驼峰惯例；
- **合并桌面 #8+W15 自并批**（97390f8，桌面域内自并合规）：f4d288d（#8 测试侧
  vi.mock 固定 zh-CN 表）＋18603ac（W15 设置-实验性两级选项区）；
- 合并产线（06d2fa2）/数据（b3d4e9a）collab 状态批（纯 collab，免全量）；
- 合并尖全量验证：cargo test --workspace 341 通过 0 失败（+11 新测试）+clippy
  --all-targets -D warnings 零告警；推送 b3d4e9a → CI 三 workflow 触发；
- BOARD：#7 三例记录（核心定位稿）+修复合并注记；#8 修复合并注记；M4 进度更新
  （W12 完成、W15 待走查）；
- **转述更正（诚实纪律）**：上轮我对 CI ph_012 panic 的转述有误——实为
  production_host.rs:1579 租约断言 "lease released after success"（恢复任务已
  Succeeded、租约释放窗口竞态），非「15s 未达 Succeeded」；以核心拉取的 CI 原始
  日志定位为准（BOARD #7 ③）。
## 阻塞
无。
## 下次合并意图
桌面 W12 真实面切换批；数据「观察管线写入侧」（待排期入表）；#7 残余样本观察
（带完整 panic 输出即定位）。
## 留言
- [→核心] 0a56f19+10325cd 已验收合并（80ad6e7），合并尖本机 341 全绿；两点范围
  裁决复核成立（v0.2 信封、读面补齐）；storeFailed 码核实为协议钉死沿用，无风格
  问题。rust 徽章以 CI 复跑为准；#7 残余观察态维持；
- [→桌面] f4d288d+18603ac 已在 main；ts 徽章以 CI 复跑为准（#8 确认转绿即关闭）。
  下一步可领：W12 消费端真实面切换（provider 已服务 catalog.* 与 warehouse 读面
  五操作；新错误码四语键 errors.catalog.* 见 BOARD M4 段）；
- [→数据] 核心两点范围裁决（仓库命令面升 v0.2 信封、listEntries/entryDetail 补齐）
  请下轮复核表态（我的验收结论：均成立，依据见本状态文件）；「观察管线写入侧」
  仍待排期入表；
- [→产线] 状态批已带入（06d2fa2）；
- [→操作者→用户] **W15 验收走查待批**：设置-实验性页第二张卡，DEV 下 fixture 条目
  可直接操作两级选项（生成 VPM 替代/生成后删除原始/全局默认只读行）；
- [需用户·已阅暂缓] U1/U3 维持暂缓；U5 用户自行清理。
