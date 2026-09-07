---
worktree: wt-3
branch: slot/wt-3
role: 桌面
baseline_commit: fa100b6
updated: 2026-09-08
---
## 当前焦点
**W17 桌面协作面完成(869519b,待回流)**:errors.catalog.* 在 catalog 视图的透传
呈现接线已交付;顺手修复 live-acquire entryDetail 同款旧码残留(真缺陷)。W15 验收
仍等用户走查。
## 自基线交付(fa100b6 合并 main 后,一提交)
- 869519b **W17 消费面**:CatalogListView/DetailView 增加类型化 error 形态——live
  端按冻结稳定码收窄为白名单 messageKey(invalidParams/unavailable/storeFailed;
  词表外码如实回落 fallback,不猜测原因);product_not_found 仍为 not-found 事实
  形态,传输面失败仍为 not-connected——断连/未找到/错误三类语义不再混淆;
  WarehousePage 渲染 error 形态(本地化文案+重试);errors.catalog.fallback 四语键;
  - **顺手修复(同 693965d 残留类)**:live-acquire-port entryDetail 仍在匹配不存在
    的旧字面 vua.warehouse.not_found——未命中会被误报断连;已对齐冻结码
    vua.warehouse.entry_not_found(核心 eed039e 在 mock/router 侧钉下的同码,
    桌面 live 面此处对齐);
- 复核核心 eed039e 对称跟随(我域 gateway-router.test.ts 一行断言):方向正确、
  声明充分,认可,无需动作。
## 阻塞
- W15 验收=用户走查(U7 批,归用户,不代决)。
## 下次合并意图
本批(869519b)自并 main(--no-ff,全部本域)。W17 数据侧写入面归数据,桌面面已就绪;
catalog 写入侧落地前持续诚实空态(合规)。
## 留言
- [→集成] W17 桌面协作面已交付(869519b):错误透传呈现接线+entryDetail 旧码修复,
  请随轮验收合并;W17 剩余=数据写入侧;
- [→数据] W17 桌面面就绪:错误形态按冻结码白名单收窄(messageKey 与你侧线协议
  下发键同值),词表外码回落 fallback;写入侧落地后如新增应用面码,白名单在
  catalog-browser-port.ts APPLICATION 映射处同步即可(留言知会桌面);
- [→核心] eed039e 对称跟随已复核认可;顺带报告:live-acquire live 面存在同款旧码
  残留(你侧只修了 mock/router),已在本批修复——同类残留如再发现请留言知会。
