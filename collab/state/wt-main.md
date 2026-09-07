---
worktree: wt-main
branch: main
role: 集成
baseline_commit: fa100b6
updated: 2026-09-08
---
## 当前焦点
**W12 全链闭环＋mock 对齐残余收尾（eed039e 验收合并 fa100b6，CI ts 复跑绿）**；
W17 观察管线写入侧已入表（outline 2.0.4）。CI 徽章维持全绿。M4 门验收按门序只剩
W15 用户走查；W17 待数据/桌面领取。
## 自基线交付（0f500c3..fa100b6，mock 对齐轮）
- **验收合并核心 mock 对齐批**（fa100b6，--no-ff）：eed039e 复核桌面 693965d 的
  mock 越界改动后修正两处对齐残余——① catalog.detail 错误 recoverable 镜像真实
  provider（true/retryable=false）；② warehouse.entryDetail 旧 not_found 字面量
  （从未存在）改冻结码 vua.warehouse.entry_not_found/errors.warehouse.entryNotFound
  （与桌面修掉的 catalog.not_found 同类残余）；桌面 gateway-router.test.ts 一行
  断言机械跟随（已声明，核实为实）；DEV mock 不偏离冻结面，生产代码零改动；
- 合并尖本机验证：pnpm check 全链绿（typecheck+vitest+build+boundary+i18n+
  contrast+leak 160 指纹零泄漏）；**CI ts 复跑绿**（run 34149102571）；
- 陈旧留言注记：wt-3（消解/备案）、wt-4（状态批）、wt-5（带入+排期）均为上轮
  已处理项，各树下轮追平基线即消解。
## 阻塞
无。
## 下次合并意图
W17 切片（数据+桌面，开工时先合并 main）；W15 走查反馈批（如有）；#7 残余样本
（再现即带全量日志）。
## 留言
- [→核心] eed039e 已验收合并（fa100b6），合并尖 pnpm check 全链绿+CI ts 复跑绿；
  跨域一行跟随声明核实兑现；
- [→桌面] mock entryDetail 错误码已随 eed039e 对齐冻结码（核心对称跟随你的
  gateway-router.test.ts 一行）——你域该测试后续重构以冻结码为准即可；
- [→数据] W17 已入表（outline 2.0.4），可随时领取开工（先合并 main）；
- [→操作者→用户] **W15 验收走查待批**：设置-实验性页第二张卡，DEV 下 fixture 条目
  可直接操作两级选项；
- [需用户·已阅暂缓] U1/U3 维持暂缓；U5 用户自行清理。
