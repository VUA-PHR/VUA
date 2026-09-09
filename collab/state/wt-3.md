---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 3fd243e
role: 桌面
updated: 2026-09-10
---
## 当前焦点
**多套 UI 批 A 已交付(0227640,用户开工令;需求 §3/§4/§6)**:UI 根注册表
（共享容器生命周期高于 UI 根——切换不重建 Gateway/不累积监听）＋切换骨架
（设置-实验性页入口,森林绿=诚实不可用态）＋现有 UI 作为第一套接入（零行为
变更）。**018 批 2 第一部分(1ec7b10)亦在途待验收**。**下一刀候选**:BG-1
主切片三视图渲染待词表归属确认(数据/产线);018 批 2 余项自排。
## 自基线交付(3fd243e 合并 main 后)
- main 合并维护(fast-forward 至 3fd243e);
- **4dcf8db:BG-1 主切片第三部分(A 路径落地)**:state 词表加 expected
  (归属判定:桌面 TS 面自决〔数据域判定无所有权主张〕;语义约束钉死
  「期望态描述,非已验证的本地状态」)＋recipeDocumentToGraphView 映射
  (assets→nodes;relations 结构映射未接入=edges 诚实空集)＋三视图
  expected 渲染＋期望态标注(四语);
- **0227640:多套 UI 批 A**(需求 §3/§4/§6):
  - ui-registry.ts:UI 根注册表(current|forest-green)＋会话级选择
    (storage 键入 storage-keys.ts——键唯一来源纪律)＋词表外回落 current;
  - App.tsx:uiRoot state 置于共享容器层(GatewayProvider 之外)——**切换
    UI 根不重建 Gateway/不重新订阅/不重启 Provider**(结构保证);语义导航
    上下文(page)为容器 state,切换自然保留(UI-02);
  - ForestGreenUnavailableRoot:森林绿诚实不可用页(批 D 前置)＋返回入口;
    确认弹窗不跨 UI 继承(批 B 前草稿连续性归批 B);
  - 设置-实验性页切换入口(首批对照验证,四语);
  - 现有 UI 作为第一套接入:AppShell 在切换点之下零改动(行为零变更);
  - 测试:注册表解析/可用性 2 项。
- **证据(2026-09-10 本机)**:桌面 check 全链绿(typecheck＋vitest 55 文件
  443 测试＋build＋boundary＋i18n tables aligned＋contrast＋leak 159 指纹
  零命中)。AC-02 部分达成:切换不重建 Gateway(结构保证:GatewayProvider
  在切换点之外)＋监听数量恒平(切换不挂新全局监听);20 次交互压测随批 D
  第二套 UI 落地后执行。
## 阻塞
- 无桌面阻塞。013 消费回归、018 批 1/2、多套 UI 批 A 均待集成验收;
  BG-1 三视图 expected 渲染已落地(A 路径),检查事实态归 B 投影(M7 后)。
## 下次合并意图
0227640(多套 UI 批 A)＋4dcf8db(BG-1 A 路径)请集成验收合并(desktop 域;
多套 UI 为用户开工令——proposal 019 登记后对表)。1ec7b10(018 批 2 第一
部分)同批。
## 留言
- [→集成] 三批在途请验收:4dcf8db(BG-1 A 路径)、0227640(多套 UI 批 A,
  用户开工令;需求文档路径 C:\Users\AR\.codex\visualizations\2026\09\07\
  01a07a2e-68a7-7be3-980f-938b50526e0b\VUA-multi-ui-requirements_ZH.md
  ——注意目录为 01a07a2e 开头)、1ec7b10(018 批 2 档位选择)。proposal
  019 登记后桌面按批次工单对表。
- [→核心] 多套 UI 批 A 已落地(纯渲染层容器/切换面,应用契约与 provider
  零触碰——与 018 §6 表态同域判断);BG-1 A 路径落地(4dcf8db)。
- [→数据] state 词表归属判定已消费(桌面 TS 面自决,expected 语义约束
  钉死);BG-1 A 路径落地(4dcf8db),B 投影演进锚(M7 检查切片)在案。
- (历史留言消化:核心 017/018 收讫——均已闭环。)
