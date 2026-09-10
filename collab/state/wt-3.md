---
worktree: wt-3
branch: slot/wt-3
baseline_commit: d127edd
role: 桌面
updated: 2026-09-11
---
## 当前焦点
**用户观察调查:全 live 连接可用性审计已交付(代码级,本批留言)**——逐页
核对 all-live 数据源与呈现分支;(a) 诚实空态与(b) 真断线/异常分开列;
数据链缺口清单按用户操作顺序产出。**批 B 保存链接线已交付(f0bc0ee)**:
nameHint 用户命名提示(零词表扩展)＋recipe.save 接线＋保存状态三态。
**019 批 C 桌面切片(生产链消费端口)下一工作时段开工**。
## 自基线交付(d127edd 合并 main 后)
- main 合并维护(fast-forward 至 d127edd);
- **f0bc0ee:019 批 B 保存链接线(6dfa40e 草稿页/store 的保存链补全)**:
  - ComposeDraftItem 增 nameHint(recipe v0.3 entrypointSelector anyOf:
    用户命名提示——用户输入,非系统虚构事实;catalogEntryId/nameHint
    二选一,零词表扩展,recipe.save 原样承载——core 路由裁定照录);
  - composeDraftToSaveDocument 映射纯函数(草稿→recipe v0.3 保存文档:
    assets/instances/entrypoint=nameHint 或 title 回退;空草稿=null);
  - ComposePage 保存接线:recipe.save invoke(preload gateway 窄面——
    DesktopGatewayRequestV1 守卫 case recipe.save 已在)→成功 setSaved
    ＋composeSavedAction(脏清除)→失败如实呈现保留内容可重试(UI-03/06);
  - i18n:savingCta/saveFailedNote/savedNote 四语;
  - 测试:保存映射真值表 2 项(文件累计 6 项);
- **证据(2026-09-10 本机)**:桌面 check 全链绿(typecheck＋vitest 56 文件
  449 测试＋build＋boundary＋i18n tables aligned＋contrast＋leak 159 指纹
  零命中)。保存链为代码级交付——真实保存回执未行使(需 live 链路与
  recipe 文档库事实),不宣称端到端。
- **用户观察调查(本批留言,代码级审计)**:全 live 连接可用性——逐页核对
  数据源/空态/断线分支;结论:(a) 类诚实空态设计正确,(b) 类无代码级
  异常;数据链缺口=内容生产顺序(先导入/先保存),非缺陷。详见留言。
## 阻塞
- 无桌面阻塞。批 B 余项(entrypoint 事实源切片)待核心/数据路由素材
  实例化事实的来源(catalog 条目/详情面);019 批次工单细化随集成。
## 下次合并意图
f0bc0e(批 B 保存链接线)请集成验收合并(desktop 域;gateway barrel 增
createSignal 导出＋草稿容器层＋compose 页＋nav/四语＋保存接线;零协议
变更——DesktopGatewayRequestV1 守卫 case recipe.save 已在)。用户观察
调查报告随本状态批留言归档。
## 留言
- [→操作者][→集成] **用户观察调查报告:全 live 连接可用性审计(代码级)**
  ——用户反馈「切换到全部真实连接后基本上所有功能都不能用,比如仓储和
  装配,原本都在哪里接入?」逐页核对结论:

  **(a) 诚实空态(设计正确,数据按以下顺序产生)**:
  1. 仓储页(warehouse.listEntries):BDL 存储为空→provider 返回
     `{entries: []}`→诚实空态「暂无条目」(WarehouseAcquire EmptyState);
     **数据从哪来**:素材导入页「选择文件夹→导入」(warehouse.import)
     或森林绿搭配采纳(downloads.listCompleted→warehouse.importDownloads);
  2. 搭配草稿页素材来源(同 acquire 读面):空→诚实空态「暂无仓库条目
     ——请先导入素材」;**先导入才有素材可选**;
  3. RecipePage 文档库(recipe.list):RecipeDocumentStore 为空→诚实空态
     「还没有配方文档」;**数据从哪来**:搭配草稿保存(recipe.save,
     nameHint 用户命名提示入口已接——f0bc0ee);
  4. workshop 装配页(production.* M3 纵向):需先 pickMaterial→
     startInspection→requestPlan→confirmPlan→getBuildRecord 全链手动
     驱动;每步空态/失败态齐备(EmptyState/role=alert);
  5. 检测段(project.environmentManagers):环境侧收集器事实,恒有快照。

  **(b) 真断线/异常(代码级核对结论:无发现)**:
  - provider 未启动:桌面启动时拉起受监督 provider(可执行文件缺失=
    启动失败非 UI 崩溃);运行中崩溃→invoke 失败→各页诚实断线态
    (not-connected/role=alert),不崩溃;
  - router 未接 case:DesktopGatewayRequestV1 全方法→router 映射全在
    (穷举回归表核过,019 前批);未知方法=invalid_request 诚实拒绝;
  - all-live 空 BDL 下「功能不能用」的体感=**(a) 类内容空态叠加前置
    依赖链**(解析/计划/执行需先有检查与素材)——非缺陷,但「空态引导」
    可改进:各页空态文案已写数据来源(如「请先导入素材」),引导动线
    (空态页直达导入页的 CTA)可作为 UX 改进项登记。

  **数据链缺口清单(用户操作顺序→环节入口)**:
  1. 素材导入(ImportPage「选择文件夹→导入」)→✅ 入口已有;
  2. 仓储条目(自动落库)→✅ 自动;
  3. 搭配草稿(ComposePage 素材来源「加入草稿」)→✅ 入口已有;
  4. 保存配方(草稿「保存配方」→recipe.save)→✅ 入口已有(nameHint
     必填校验);
  5. 解析(recipe.resolve)→❌ **UI 入口缺**(读面/路由已接,无按钮);
  6. 计划审阅/批准(plan.approve)→❌ **UI 入口缺**;
  7. 执行(job.execute)→❌ **UI 入口缺**;
  8. 检测/记录查看(record.get/list)→❌ **UI 入口缺**;
  9. 下载采纳(importDownloads)→✅ 端口已接(1ec7b10 前后),页面列表
     待接。
  → 缺口集中在**解析→计划→执行→记录的生产链 UI 入口**(批 C 桌面
  切片主体,下一工作时段开工)——与 019 批 C 工单范围一致。
- [→集成] 审计报告供验收参考;批 B 保存链(f0bc0e)与审计结论交叉一致
  (保存链已接,生产链 UI 入口缺=批 C 桌面切片主体)。
- (历史留言消化:核心 017/018/UI-03 收讫——均已闭环。)
