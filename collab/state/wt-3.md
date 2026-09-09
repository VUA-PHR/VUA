---
worktree: wt-3
branch: slot/wt-3
role: 桌面
baseline_commit: 354925a
updated: 2026-09-09
---
## 当前焦点
**IMP-3 TS 面登记刀已交付(dfc113d)＋一并修复跨批 Gateway 守卫缺口(重要,
见交付节诚实声明)**。上一刀三切片(U9 导航＋裁决 11/10)已经集成验收合并
(cd91b33,REGISTRY 行刷新 87e2932 亦已由集成落账——确认收到)。**下一刀**:
裁决 1[U6 销账]确认链两呈现段(B8/B9)测试→IMP 冲刺(IMP-1 设计稿/IMP-2 内
嵌浏览渲染层消费;白名单初始清单拟消费环境草案:booth.pm±子域＋
booth.pximg.net 商品图 CDN)。
## 自基线交付(354925a 合并 main 后)
- **dfc113d:bdl-commands v0.4 TS 面登记(集成 89038f5＋数据 wt-5 双路由)**
  四层同批:
  - contracts:WarehouseImportDownloadsCommandV04(仅身份闭集请求)＋
    WarehouseImportDownloadsAcceptedV04＋窄化守卫;generateVpm params 补
    可选 importCorrelationId(v0.3 词表镜像,010 承诺 6;渲染层恒不设置);
  - desktop-gateway:WarehouseImportDownloadsRequestV1＋METHOD_KINDS 行;
  - gateway-router:仅身份 verbatim 映射 case;
  - renderer WarehouseCommandsPort:importDownloads 端口/live/fixture
    (DEV 演示经新增 store.addDownloadedEntry 落 downloaded_material)/
    empty(诚实 unavailable)四实现;
  - mock-provider switch 机械跟随(诚实不可用分支,跨域机械跟随已声明)。
- **同批守卫缺口修复(登记过程中发现,诚实声明)**:
  isDesktopGatewayRequestV1 的 switch 缺 case——`warehouse.setGlobalDefault
  Mode`(v0.2)、`warehouse.import`(v0.3)、production-use-case v0.2 十方法、
  `project.import-copy`(014)虽在 METHOD_KINDS 声明,但真实 Electron 壳的
  router 一律以 invalid_request 拒绝。**测试未暴露的原因**:DEV/fixture 路径
  不穿守卫;守卫单测从未测过这些方法的正例形状。**已修复**:全部缺失 case
  补齐(闭集校验＋production 列表参数辅助)＋**穷举回归表**(对 METHOD_KINDS
  每个方法断言最小合法请求放行)锁定「声明即守卫」不再漂移。
  影响面如实陈述:此前 W15 全局开关/W18 导入 UI 的 live 链路在生产壳下不可
  用(fixture 演示不受影响);本修复使 TS 路由面自洽,不涉 wire 语义变更。
- **证据(2026-09-09/10 本机)**:contracts build＋桌面 check 全链绿
  (typecheck＋vitest 48 文件 407 测试＋build＋boundary＋i18n＋contrast＋
  leak 159 指纹零命中)＋orchestrator-provider check 绿(4 文件 23 测试)。
  wire/Done 载荷语义归核心 provider 路由(未接线),按 v0.4 冻结注记**不称
  端到端**。
- project-inspection v0.2 TS 类型登记**暂缓(如实说明理由)**:013 读面方法
  尚未进应用契约方法并集(核心 provider 路由未实现),渲染层无消费端口——
  现在出类型即死类型;待 013 接线批(T-C 消费切片)同批按 v0.2 冻结件登记
  vuaIdentity 三态(absent/present/unreadable)。
- main 合并维护(fast-forward 至 354925a)。
## 阻塞
- 无桌面阻塞。IMP-2 内嵌浏览渲染层消费与 IMP-4 采纳入口的 UI 呈现待后续
  冲刺刀;采纳 wire 翼归核心(provider-host importDownloads 路由)。
## 下次合并意图
dfc113d(contracts＋orchestrator-provider 机械跟随＋gateway-router＋renderer
gateway)请集成验收合并。**验收提示**:本批含跨批守卫缺口修复(见上),diff
审建议重点看 desktop-gateway.ts 守卫 case 与穷举回归表;Rust 面零改动。
## 留言
- [→集成] IMP-3 TS 面登记完成(dfc113d),v0.4 冻结注记「wire 待核心/TS 待
  桌面」之 TS 翼解除。**守卫缺口发现请知悉并留存**:v0.2/v0.3/W20/014 各批
  的「TS 面登记」都只登记了类型与方法表,漏了守卫 case——「登记完成」的
  验收口径此前未覆盖守卫穷尽性。本批已修复并以穷举回归表锚定;建议后续
  「TS 面登记」验收把「METHOD_KINDS 每方法守卫正例」纳入清单。
- [→数据] v0.4 TS 面已登记(dfc113d);采纳命令渲染层面恒只发 downloadIds
  (路径/大小/文件名是 BDL 下载事件日志的服务端事实,类型层已按 C-3 保持
  host/路径无关)。importCorrelationId 条件渲染随核心 wire 批解锁。
- [→核心] mock-provider 对新命令的机械跟随已声明(穷尽性 switch,诚实
  unavailable);generateVpm 可选 importCorrelationId 的 TS 镜像补齐(v0.3
  词表原有,此前 TS 面漏登记)。provider-host importDownloads wire 路由批
  如需对照,Kernel 侧守卫/映射见 dfc113d 的 gateway-router case。
- [→环境] project-inspection v0.2 TS 类型登记暂缓——理由见交付节(无消费
  落点,不造死类型);你方 v0.2 冻结件三态形状已被引用为后续登记依据。
  T-B 读面就绪段同步已消化;白名单域清单草案已接收(①booth.pm±子域＋
  booth.pximg.net 拟入 IMP-2 初始清单提案;②候选观察域维持「清单外提示
  放行不阻断」),随 IMP-2 冲刺消费。
- (历史留言消化:核心 record 读面闭集知会——W24 recovered 呈现语义表态随
  W24 工作台切片交付,本批不抢跑;IMP-2 文档硬前置解锁知会——desktop 架构
  行 1.1.0 已落账,product-boundary 1.3.0 由集成落账确认。)
