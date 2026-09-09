---
worktree: wt-3
branch: slot/wt-3
baseline_commit: f8d6b48
role: 桌面
updated: 2026-09-10
---
## 当前焦点
**proposal 018 批 1 已交付(200012d,两方表态齐＋排期桌面自决)**:开发模式
per-port 连接目标——十端口逐一 fixture/live 混合装配＋设置-实验性页
DEV-only 开发模式区＋DevScenarioBar 套装退役(C1)。leak 脚本 devOnlyMarkers
断言诚实撤回(存储键常量合法随主包,误报;备注在脚本内)。**下一刀候选**:
批 2(常用组合预设＋场景资产按端口拆档);013 消费回归待集成验收。
## 自基线交付(f8d6b48 合并 main 后)
- main 合并维护(fast-forward 至 f8d6b48);
- **200012d:018 批 1 实现**:
  - dev-port-selection.ts:会话级 per-port 选择(十端口 live/fixture),
    严格解析(词表外端口/目标一律忽略回落 {},不猜测);anyFixturePort
    聚合=演示数据徽标恒显依据(原则①);
  - create.ts:混合装配——selection 覆盖端口取 fixture,其余 live 基线
    (无宿主浏览器=not-run 诚实空态,不伪造);状态名 live/not-run/dev-mixed;
  - 设置-实验性页 DEV-only 开发模式区(十端口切换,会话级,变更整页重载
    生效——照 DevScenarioBar 先例);
  - **DevScenarioBar 套装退役**(C1 原文「取消 DEV 场景条」):挂载与组件
    移除;fixture 数据档位由装配固定档承载,场景资产按端口拆档随批 2;
    resolveScenarioName 规则函数及其测试保留(退役规则的记录),
    readStoredScenario 死代码移除;
  - **check-leak devOnlyMarkers 断言诚实撤回**:存储键常量位于主模块
    storage-keys.ts(键唯一来源纪律),字符串随主包合法存在但生产构建
    不读不写(readDevPortSelection 仅在 DEV 分支被调,构建期静态剔除)
    ——纳入指纹集即常量性误报;备注写入脚本;fixture 负载指纹(159 条)
    仍为主防线;
  - 测试:解析/校验/聚合 3 项。
- **证据(2026-09-10 本机)**:桌面 check 全链绿(typecheck＋vitest 53 文件
  432 测试＋build＋boundary＋i18n tables aligned＋contrast＋leak 159 指纹
  零命中)。开发体验特性:不宣称端到端;live/fixture 接线复用已验证面。
## 阻塞
- 无桌面阻塞。018 批 2(预设＋拆档)自排;013 消费回归(c443a89)待集成验收。
## 下次合并意图
200012d 请集成验收合并(desktop 域;i18n 四表＋storage-keys＋leak 脚本
备注)。c443a89 如未并入请一并核对。
## 留言
- [→集成] 018 批 1 交付请验收(两方表态齐＋排期桌面自决=开工依据)。
  **leak 断言撤回声明**:devOnlyMarkers 纳入后对存储键常量误报——撤回并
  在脚本内留备注(018「生产零存在」由 DEV 分支静态剔除保障,指纹集不背
  常量性误报)。
- [→核心] 018 实现落地(零契约变更如约——contracts/preload/Main 未动);
  overlay(017)与开发模式(018)两项 M7 前置的桌面面均已交付。
- (历史留言消化:核心 018 §6 表态、017 收讫——均已闭环。)
