---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 6f35bbb
updated: 2026-09-07
---
## 当前焦点
**W11 收尾完成（CI 三 workflow + tags 回填 + Release + glm/* 清理）；W12/W13/W14/W16
已合并落账，M4 剩 W15（桌面，已解锁）与 W12 收口（等核心路由）**。CI 首跑结果：
schema-vectors ✅ 绿；rust ❌（#7 同族抖动再现，BOARD 重开归核心）；ts ❌（i18n 术语
注解测试 locale 耦合，BOARD #8 归桌面）——两红均为 CI 抓到的真实缺陷，非 workflow
问题；徽章转绿等两域修复。
## 自基线交付（a2f0243..19e74ae，W11 收尾轮）
- 各树自并批确认落 main（分叉实质归零）：W12+W14（数据，6062a13/01ebb73）、
  W13+W16（桌面，88b4551）、第三轮走查修复（b5bf926）；
- **CI 三 workflow**（6f35bbb）：rust（cargo test --workspace+clippy -D warnings）、
  ts（root pnpm check 全链含 check:leak）、schema-vectors（6 crate 13 个消费
  schemas/ 的 --test 定点面）；组合命令本地全绿后才落（Rust 全量 330 通过 0 失败
  +clippy 零告警+向量逐 crate 验证；2026-09-07 本机）；
- README 四语：版本行 v0.4.1→v0.5.0（M3 文档审查漏网修正）+三徽章；
- **推送**：origin main 927de51..19e74ae；回填 tags v0.4.0=9598f1f（M0）、
  v0.4.1=003bf0c（M1）、v0.4.2=c0e8393（M2）（版本号变更提交核实）；
- **GitHub Release v0.5.0**：github.com/VUA-PHR/VUA/releases/tag/v0.5.0（双语发行
  说明链接+中文全文）；
- glm/frontend、glm/implementation、glm/orchestrator 评估删除：三分支均 --merged
  main 实质领先 0，pre-transition/* 备份 tag 在，已删（W11 原计划项）；
- **CI 首跑（2026-09-07 23:14Z 触发）**：schema-vectors 12m57s ✅；rust 8m6s ❌
  （ph_012 未达 Succeeded，production_host.rs:1579；本地复跑 0.07s 过——抖动再现，
  #7 重开）；ts 1m24s ❌（3 测试期望中文注解实际 en 表裸形——locale 耦合，#8 新立）；
- BOARD：bdl-commands v0.2 冻结落表；M4 进度段；#7 重开+新证据；#8 新立。
## 阻塞
无（两处 CI 红已按归属路由，进程内可解，不升级用户）。
## 下次合并意图
W15（桌面切片）；W12 收口批（核心 catalog 路由，跨域合并由集成验收）；#7/#8 修复批
（核心/桌面）。
## 留言
- [→核心] **#7 重开**：CI 首跑再现 ph_012（production_host.rs:1579，恢复任务 15s
  未达 Succeeded，14/1 形态与你此前上报一致；windows-latest 2 核 cargo test
  --workspace 并行环境放大）。请评估低核环境下的时序窗口（#7 两例修复之外的残余）。
  rust 徽章红待此修复；
- [→桌面] **#8 新立**：i18n 术语注解测试 locale 耦合（current-table 按 navigator
  选表，CI=en 表注解空→3 测试失败；本地绿是隐性依赖 zh-CN 系统语言）。修复方向
  BOARD #8 已写。ts 徽章红待此修复。可并入 W15 切片或独立小修；
- [→产线] W1 验收参考事实已阅并采纳（staging 种子 SDK、C# 指纹场景层级注释）——
  W1 验收与 M3 关门时已消化，感谢留痕；
- [→数据] W12+W14 批已确认落 main；bdl-commands v0.2 已入 BOARD 冻结契约表；
  W12 收口等核心路由；观察管线写入侧待排期；
- [→桌面] W15 已解锁（W14 v0.2 冻结+main 已含），按 outline 2.0.2 领取；W15 验收
  =用户走查；
- [→核心] 两项路由登记请求见 wt-5 留言（catalog.* 三查询、warehouse.
  setGlobalDefaultMode），W12 收口与 v0.2 路由配合归核心；
- [需用户·已阅暂缓] U1/U3 维持暂缓；U5 用户自行清理。
