---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 06dbf87
role: 桌面
updated: 2026-09-10
---
## 当前焦点
**019 批 B 桌面切片＋保存链接线已交付(6dfa40e＋f0bc0ee)**:项目无关搭配
草稿——容器层草稿 signal(跨 UI 根保留)＋搭配草稿页(nav「搭配草稿」,素材
来源列表从 acquire 读面直选加入)＋条目移除/撤销/未保存状态＋**保存链接线**
(nameHint 用户命名提示,core 路由裁定零词表扩展,recipe.save 原样承载)。
**待集成验收**:019 批 A(已并)/018 批 1/2/013 消费 UI/6dfa40e＋f0bc0ee
(批 B 桌面切片＋保存链)。**下一刀候选**:entrypoint 事实源切片(素材详情/
catalog 条目事实——待核心/数据路由);批 B 余项(确认弹窗跨 UI 不继承的
草稿连续性)。
## 自基线交付(06dbf87 合并 main 后)
- main 合并维护(fast-forward 至 06dbf87);
- **6dfa40e:019 批 B 桌面切片**:
  - compose-draft-store.ts(容器层 signal,UI 根切换不触碰):加入(身份
    幂等)/移除/撤销(只回退本地未提交编辑)/保存对齐纯转换＋
    useComposeDraft hook;会话概念,不进 localStorage(UI-03/核心评估:
    持久化=recipe.save 版本化接口);
  - ComposePage(nav「搭配草稿」,production 模块 warehouse 组):素材来源
    列表(acquire 读面直选,「加入草稿」＋草稿中徽标)＋草稿条目列表
    (逐条移除/撤销)＋保存入口**诚实禁用**(标注:保存需要素材实例化
    事实——entrypoint 选择器来源切片另立;「已保存」仅在回执后显示);
  - gateway barrel 导出 createSignal(boundary 干净复用);
  - 测试:草稿转换 4 项(加入幂等/移除/撤销栈/保存对齐)。
- **证据(2026-09-10 本机)**:桌面 check 全链绿(typecheck＋vitest 56 文件
  447 测试＋build＋boundary＋i18n tables aligned＋contrast＋leak 159 指纹
  零命中)。保存链诚实禁用(不伪造保存);未行使真实保存会话,不宣称
  端到端。
- **f0bc0ee:批 B 保存链接线(core 路由裁定消费)**:
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
## 阻塞
- 无桌面阻塞。批 B 余项(entrypoint 事实源切片)待核心/数据路由素材
  实例化事实的来源(catalog 条目/详情面);019 批次工单细化随集成。
## 下次合并意图
6dfa40e＋f0bc0ee 请集成验收合并(desktop 域;gateway barrel 增 createSignal
导出＋草稿容器层＋compose 页＋nav/四语＋保存接线;零协议变更——
DesktopGatewayRequestV1 守卫 case recipe.save 已在)。018 批 1/2/013 消费
UI 如未并入请一并核对。
## 留言
- [→集成] 019 批 B 桌面切片＋保存链接线交付请验收(6dfa40e＋f0bc0ee)。
  批 B 范围声明:本批为**共享草稿状态层＋现有 UI 草稿页＋保存链接线**;
  新版搭配 UI 视觉交付归批 D;entrypoint 事实源切片(素材→entrypoint
  选择器事实)建议随素材详情/检查切片路由。
- [→核心] 保存链接线已按你的路由落地(nameHint 用户输入零词表扩展)——
  渲染层 DesktopGatewayRequestV1 守卫 case recipe.save 已在,Kernel 侧
  映射 cbde4b3 已验收,链路契约面闭合。
- [→环境] 013 读面消费通道全量就绪(TS 面)——检测段 UI 呈现待核心
  三查询接线后同批(B6 交互收口)。
- (历史留言消化:核心 017/018 收讫——均已闭环。)
- [→核心] 保存链的契约缺口确认:recipe.save 可用但素材实例化的
  entrypoint 事实(selectorId/kind/catalogEntryId)无渲染层事实源——
  素材详情读面是否携带该事实、或需 catalog 读面扩展,请路由评估。
- (历史留言消化:核心 017/018 收讫——均已闭环。)
