---
worktree: wt-main
branch: main
role: 集成
baseline_commit: c93ac5e
updated: 2026-09-08
---
## 当前焦点
**W17 桌面协作面已交付验收（869519b 自并 c93ac5e，合并尖 394 测试全绿＋CI ts 绿
run 34150144613）；W17 剩数据写入侧**。CI 徽章维持全绿。M4 门验收按门序只剩
W15 用户走查。
## 自基线交付（fa100b6..c93ac5e，桌面 W17 消费面验收轮）
- **验收桌面 W17 消费面批**（869519b，桌面域内自并合规，全部 apps/desktop 本域）：
  ① errors.catalog.* 透传呈现——CatalogErrorKey 白名单（invalidParams/unavailable/
  storeFailed/fallback）按冻结稳定码收窄 messageKey，词表外码回落 fallback 不猜测
  原因；product_not_found 保持独立 not-found 事实形态（断连/未找到/错误三类语义
  不再混淆）；WarehousePage 渲染 error 形态+fallback 四语键；
  ② **顺手修复真实缺陷**：live-acquire-port entryDetail 仍匹配旧字面
  vua.warehouse.not_found（核心 eed039e 只修了 mock/router 侧）——live 面 miss
  会误报断连，已对齐冻结码 entry_not_found；
- 合并尖本机验证：pnpm check 全链绿（desktop 47 文件 **394 测试**、contracts 29、
  orchestrator-provider 23、check-leak 160 指纹零泄漏）；**CI ts 复跑绿**；
- 推送 230ed74..c93ac5e（桌面自并批未推送，集成代推）；
- BOARD：M4 进度（W17 桌面面交付验收）、最近更新行；
- 陈旧留言注记：wt-2（eed039e 已带入）、wt-4/wt-5（状态批已带入）均为已处理项。
## 阻塞
无。
## 下次合并意图
W17 数据写入侧切片；W15 走查反馈批（如有）；#7 残余样本（再现即带全量日志）。
## 留言
- [→桌面] 869519b 已验收（c93ac5e 已代推 origin，CI ts 绿）；live-acquire 旧码修复
  与白名单设计核实合格；
- [→数据] W17 剩你侧写入侧：桌面面已就绪——错误形态按冻结码白名单收窄
  （CatalogErrorKey，词表外回落 fallback），写入侧如新增应用面码，白名单在
  catalog-browser-port.ts 同步即可（桌面已留言知会）；开工先合并 main；
- [→核心] eed039e 已带入（fa100b6）；桌面报告 live-acquire 同款旧码残留已由桌面
  本批修复——你侧 mock/router 面无遗留则无需动作；
- [→操作者→用户] **W15 验收走查待批**：设置-实验性页第二张卡，DEV 下 fixture 条目
  可直接操作两级选项；
- [需用户·已阅暂缓] U1/U3 维持暂缓；U5 用户自行清理。
