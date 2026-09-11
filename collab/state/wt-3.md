---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 9e87f8e
role: 桌面
updated: 2026-09-12
---
## 当前焦点
**用户实测四项 UX 缺口修复批已交付(ce91403)+ 随批环境卡片标题四语文案**——
操作者启动令(本窗口优先修复)已执行,详情见「自基线交付」;019 批 C 第二
部分(UI 接线)按工单降位,待本批验收后接续。
## 自基线交付(9e87f8e 之后)
**ce91403:用户实测 UX 缺口批(四缺口 + 随批一项)**:
1. **本地素材导入「仓库服务尚未接入」= 假说 (a) live 链断点,已修**:
   - **诊断**:renderer→GatewayClient→gateway-router→provider-host 分派
     (warehouse_import_submit)全链在位;断点在壳→Provider 进程环境交接——
     基座清洗(providerEnvironment,核心域)只放行系统变量是正确安全默认,
     但 Provider bin 按约定从环境读运行时配置(proposal 005「仓储根不进
     wire」),VUA_PROVIDER_DATA/VUA_WAREHOUSE_ROOT 从未抵达子进程→仓储/
     下载/生产用例服务面恒未装配→每条 warehouse 命令如实回答
     vua.warehouse.unavailable(文案诚实,装配断)。用户实际运行即此态。
   - **修复**:壳作为组合根,经 SupervisedProcessProviderV01 公开注入点
     (processFactory 第二参)显式补齐三个确定性根:VUA_PROVIDER_DATA=
     userData、VUA_WAREHOUSE_ROOT=userData/warehouse、VUA_PROJECT_ROOT=
     生产合成项目根(与 resolveProductionContext 四元组同源);除此之外
     不透传任何宿主变量,凭据形变量仍被清洗层剥离(测试钉死环境键集)。
     核心域文件零改动;VUA_UNITY_EDITOR 不注入(编辑器路径属用户机事实,
     配置面未立项——generateVpm 执行器诚实 unavailable,其余仓储面全可用)。
2. **云端下载手动输网址 = 已修**:内嵌面板首开自动导航 booth.pm(浏览允许
   清单内,BOOTH_HOME_URL 常量);用户关闭视图后不强行重开,后续导航历史
   照常保留;地址栏手动导航保留。
3. **Booth 登录 Cookie 持久化 = 已修**:persist:vua-remote 分区本就落盘
   持久 Cookie;断点语义是 Chromium 会话 Cookie(无到期)只存内存,应用一退
   即失。新增 installCookiePersistencePolicy:允许清单来源的会话 Cookie
   写入时补有界持久到期(180 天),值/域/旗标原样保留;重写事件自然终止
   不循环;Cookie 只落本机分区,不进渲染层、不经 IPC、永不提交(隔离红线
   维持;真机登录持久性验证留窗口,不宣称端到端)。
4. **Booth 全屏不能退出 = 已修**:WebContentsView 上缘让位 44px 条带
   (REMOTE_VIEW_NAV_STRIP_PX 导出常量);渲染层固定导航条:后退/前进/刷新/
   回首页/URL 脱敏显示(origin+路径,弃查询串与片段)/关闭回 VUA+窗口控制
   三钮;条内空白可拖拽窗口。窄面 additive 扩展 remoteContent.goBack/
   goForward/reload(contracts TS 面登记 + preload + IPC + 管理器方法);
   U9 四分法策略零改动,历史成员产生时已过导航策略,历史动作不二次裁决。
5. **随批(环境侧 wt-6 留言)**:环境检测卡片标题消费侧文案注册表——覆盖
   引擎 id 闭集 steam/vrchat/steamvr/openxr_runtime/network/windows/
   disk_space(双区同 id)/unity_hub/unity_editors/vpm_cli/vcc,四语齐;
   引擎未来新增 id 如实透传 checkId,不猜测。
**证据(2026-09-12 本机)**:桌面 check 全链绿——typecheck 两配置零错;
vitest **58 文件 463 测试**全绿(新增:provider-bootstrap 环境注入、Cookie
持久化策略、displayUrl+历史可走性、检查标题投影);build 绿;boundary 绿;
i18n tables aligned(3 交付语言表与源表对齐);contrast 全达标;check:leak
159 指纹零命中。**无端到端宣称**:W25 未开窗,本窗口未做真机走查;缺口
修复的实际体验验证待用户/走查窗口。
## 待办队列
四项 UX 缺口已全部交付(见上),本节队列清零;真机走查回执待窗口。
019 批 C 第二部分(UI 接线)待接续——工单优先级已让位于本缺口批。
## 阻塞
- 无桌面阻塞。备忘记录(非阻塞):Unity 编辑器路径的壳侧配置面未立项,
  generateVpm 执行器维持诚实 unavailable;若用户需要生成链可用,建议后续
  工单(环境检测已能观测编辑器存在,配置面归属需裁决)。
## 下次合并意图
ce91403(用户实测 UX 缺口批 + 环境卡片标题四语)请集成验收合并——涉及
desktop 域主体 + contracts TS 面 additive(remoteContent 三方法)+
design-system 两图标(refresh/home),全在本域所有权内。
## 留言
- [→集成] ce91403 请验收(诊断结论与测试数字见「自基线交付」;contracts
  变更为 additive TS 面登记,无 wire 破坏;design-system 仅图标枚举扩充)。
- [→环境] 随批交付:disk_space 及全部现有 checkId 的卡片标题四语文案已
  落(消费侧注册表,未知 id 透传);下次快照拉取起卡片标题不再是裸 id。
- [→核心] 知会:壳侧经 processFactory 公开注入点补 Provider 运行时环境
  (VUA_PROVIDER_DATA/VUA_WAREHOUSE_ROOT/VUA_PROJECT_ROOT 三路径,非凭据),
  你域清洗层与全部文件零改动;若核心认为运行时根应由 Provider 侧配置文件
  承载(env 注入之外的形态),请提案,桌面对两种形态无预设立场。
- (历史留言消化:wt-6 卡片标题请求、wt-2/wt-5 各数据面留言——均已闭环。)
