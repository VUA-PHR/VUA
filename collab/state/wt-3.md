---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 2e97e12
role: 桌面
updated: 2026-09-14
---
## 当前焦点
**批 D D-5 切片交付——AC 全表（AC-01～13）回归收口：命名诚实性修正
＋AC-02 根基测试＋全表证据盘点＋D-6 事实源缺口登记（2026-09-14
03:3x–04:0x 工作时段轮，批 D 第五切片）**：

- **D-4 验收入库确认（本轮 brief 世代读自 main 提交说明，独立核实）**：
  D-4 切片 d3e23c4＋状态批 04ada9a＋修订批 a6865a8 已经 **2e97e12**
  （第 31 批）验收入 main——集成独立核实三点 diff＋detached a6865a8
  独立复跑 check 全链 exit 0（vitest 73/567＋leak 155＋forest-leak），
  CI ts 34778117114 success on b65144c（D-4 独立 CI 环境证据）随
  29ea7b4 推送门 r3 回填在案。上轮状态批与本轮【① 注意】wt-main 留
  言「D-4 续作工单维持」均系旧世代重显，已入库事实为准，回执不回执
  不重发。
- **D-5 切片交付（f9f975a，4 文件全桌面所有权域，apps/desktop/src/
  renderer/gateway/）**：AC 全表回归收口＝走查驱动的共享面修正＋测
  试补齐＋证据盘点。
  ①**走查发现（命名诚实性）**：生产共享容器层 store
  （production-chain-store、compose-draft-store）经 gateway/index.ts
  引用 fixture-signal.ts——该文件头自称「仅 DEV 可达」，与生产使用
  事实漂移。修正＝实现逐字提取至 `signal.ts`（纯订阅机制，无数据无
  演示载荷；泄漏门扫载荷指纹，对无载荷基础设施不适用）＋
  fixture-signal.ts 转为 DEV 夹具面专用 re-export（恢复名副其实）＋
  index.ts 导出源换 signal.ts；零行为变化。
  ②**AC-02 根基测试**：`signal.test.ts` 四用例锚定退订语义（退订移
  除监听／同引用重复订阅不叠加／重复退订安全／在订者恰一次通知）
  ——「监听数量不累积」共享层机制根基首次有测试锚定。
  ③**AC 全表证据盘点（如实三态，全文见 019 进展注）**：共享层测试
  锚定 9 条（AC-01/02/03/04/05/06/07/09/13；AC-06 重试安全具契约依
  据＝baseRevision 乐观并发 stale typed conflict）；静态结构＋机械
  守卫 2 条（AC-10/AC-11，D-4 交付面）；机械门常态 1 条（AC-12）；
  AC-08＝UI-08 结构性成立＋恢复 inspect_required 核心域已验收机制。
  **迁移退路复核完整**（migration-fallback 单回调契约＋absent 返回
  入口＋current 恒可用）。**诚实边界**：全部真机确认项未执行（归
  W25，O-2 延期中）；§7 第三层验证（Electron 真机生产链）未执行，
  **不宣称 AC 表整体验收通过**。
- **D-6 事实源缺口登记（同轮，预览能力接入）**：§6 批 D 行「预览能
  力接入」未见专切片交付——D-6 开工前事实源走查结论＝**桌面侧暂无
  零猜测实现路径**。走查事实：选材行数据源 AcquireView/WarehouseEntry
  （本地条目读面）无图片/来源引用字段，条目详情仅 `sourceCorrelated`
  布尔（不携带 productId/媒体 URL）；图片事实在目录观察面
  （CatalogProductDetail.media.imageUrls＋catalogImageUrl 直连机制在
  位）但**「本地条目→目录来源」关联解析读面不存在**。缺口候选方案
  （entryDetail 叠加来源引用／独立预览查询面）已写入 019 进展注，候
  核心/数据裁决，桌面不代决；禁项（猜测拼 URL／Figma 固定图顶替／
  越权扩 wire 面）如实登记。**批 D 工单内桌面可独立推进的面至 D-5
  全部交付完毕。**
- **测试证据（本机 2026-09-14 03:3x–03:4x，本树 slot/wt-3）**：桌面
  check 全链 **exit 0**（typecheck 双 tsconfig 含骨架＋vitest 74 文
  件 571 测试〔较 D-4 世代 +1 文件 +4 测试＝signal 4〕＋build＋
  boundary＋i18n＋contrast＋leak 155 指纹零泄漏＋forest-leak 绿）；
  registry-only exit 0（57 项一致＋1204 文件 0 标记，+2＝D-5 新增
  signal.ts/signal.test.ts 受管文件）。
- **分叉（状态批提交前实测）**：落后 13＝第 31 批验收合并（2e97e12
  本树 D-4＋1215f2b wt-6）＋簿记（b65144c BOARD/wt-main＋29ea7b4 推
  送门 r3 回填）＋30 批世代簿记与分支历史收编——**全 collab，三点
  diff 非 collab 文件面为空 diff 实证**（2e97e12 所含非 collab 内容
  即本树 D-4 回流＝零未验收实质内容，实质落后 0）；未达 15 触发线
  登记不追平。领先见下次合并意图。

## 自基线交付（2e97e12 基线世代）
- **D-5 切片 f9f975a**（signal 提取＋signal.test 四用例＋fixture
  re-export 化＋index 导出源切换；4 文件全桌面所有权域）。
- 本批：**状态批（019 进展注 D-5/D-6 两节＋本文件，全 collab 免全
  量）**。

## 阻塞
- 无桌面阻塞。D-6 预览接入候核心/数据对「本地条目→目录来源」读面
  的方案裁决（缺口已登记 019 进展注，候选方案在案）——等待项非阻塞；
  真机义务归 W25（O-2 用户延期中）。

## 下次合并意图
**本状态批（恰 019 进展注＋wt-3.md，全 collab 免全量）＋D-5 切片
f9f975a 请集成随轮验收合并（--no-ff）。**本树领先 main 2 提交＝
f9f975a（D-5 实质切片）＋本状态批；实质 diff＝恰 gateway/ 下 4 文件
（signal.ts＋signal.test.ts 新增、fixture-signal.ts＋index.ts 修改）
全桌面所有权域零冲突。check 全链绿证据本机在案；registry-only exit 0
在案。零端到端宣称维持，真机义务归 W25。

## 待命声明（第 6 步，如实）
本轮（03:3x–04:0x，工作时段）：①【① 注意】消化——wt-main 留言系
旧世代重显（D-4 已经 2e97e12 验收入库，本轮读 main 提交说明独立核
实），零待办不重发；②D-5 切片交付（命名诚实性修正＋AC-02 根基测
试＋AC 全表证据盘点＋迁移退路复核；真机确认项未执行如实申报，不宣
称 AC 表整体验收通过；check 全链 exit 0：vitest 74/571＋leak 155＋
forest-leak 绿）；③D-6 事实源缺口登记（本地条目→目录来源关联读面
不存在，候选方案候核心/数据裁决，桌面零猜测禁项如实登记）；④四环
全查——在途＝批 D D-6（候契约，桌面侧无可独立推进面），BOARD 桌面
行 #21 批 D 执行中（D-5 交付候验收）＋#25 [需用户] 跳过，outline
W18/W19/W24 已交付维持，M5 表 W24 行闭环，M6 批 D 伴随项主体本轮收
口（D-6 候契约），M7/M8 未开窗不开工。退出待命，候下轮 brief、D-6
契约方案到达、或集成验收反馈；在手 D-5 完整交付无半成品。

## 留言
- [→集成] **本状态批（恰 019 进展注＋wt-3.md，collab-only 免全量）
  ＋D-5 切片 f9f975a 请随轮验收（--no-ff）**——本树领先 2（D-5 实
  质切片＋状态批）；实质 diff＝恰 4 文件（apps/desktop/src/renderer/
  gateway/ 下 signal.ts＋signal.test.ts 新增、fixture-signal.ts＋
  index.ts 修改）全桌面所有权域；check 全链 exit 0（vitest 74 文件
  571 测试＋leak 155 指纹零泄漏＋forest-leak 绿）本机 2026-09-14
  03:3x–03:4x 在案；registry-only exit 0（57 项＋1204 文件 0 标记）
  在案。
- [→核心][→数据] **D-6 契约缺口（019 §6 批 D「预览能力接入」）**：
  本地仓库条目读面（WarehouseEntry/WarehouseEntryDetail）无目录来源
  引用字段（仅 sourceCorrelated 布尔），目录媒体读面在
  （CatalogProductDetail.media.imageUrls）但本地条目→来源关联解析读
  面不存在——预览接入缺事实源。候选方案两则（entryDetail 叠加来源
  引用／独立预览查询面）已登记 019 进展注「D-6 事实源核查与契约缺
  口登记」节，候两域评估裁决；桌面候方案落定即接渲染面（复用
  catalogImageUrl＋WarehouseAlbum 同线，无关联条目诚实空态），不猜
  测、不代决、不用固定图顶替。
- （回执不回执：D-4 验收与 CI 证据知悉，不重发不乒乓。历史留言已消
  化归档：D-3/D-4 批次留言见本文件 git 历史 a6865a8 世代；在途事项
  以 BOARD 与本状态文件当前焦点为准。）
