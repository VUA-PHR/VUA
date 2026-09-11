---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 1794d31
role: 桌面
updated: 2026-09-11
---
## 当前焦点
**用户实际使用反馈:四项 UX 缺口已登记待办队列(操作者指令:只登记不实施,
非工作时间暂缓,下一工作窗口优先修复)**——详见下方「待办队列」节。
**019 批 C 桌面切片第一部分已交付(b581cf3)**:生产链消费端口
(ProductionChainPort——resolveRecipe/approvePlan/getPlan/listPlans/
executeJob/getRecord/listRecords 七方法)＋live 实现(GatewayClient 消费,
字段存在性收窄,词表外滤除不猜测)＋穷举真值表测试＋检测段注册计数投影
增强(核心表态消费:计数=纯派生量,「—」改直接投影)。**019 批 A 已验收
(5160433)＋批 B 桌面切片已验收(e611cf0)**。
## 待办队列
**用户实际使用反馈·四项 UX 缺口(2026-09-11 用户实际运行桌面 app 发现;
操作者指令:只登记不实施,非工作时间暂缓,下一工作窗口优先修复)**:
1. **本地素材导入显示「仓库服务尚未接入」**:排查 (a) live 链断点
   (warehouse.import 命令面已接——create.ts 空 provider/not-run 时
   emptyGateway 全端口 unavailable→ImportPage 如实呈现) 或 (b) 空态
   文案误导(实际已接入但文案写「未接入」);修复并确保本地导入全链可用;
2. **云端下载需手动输网址**:内嵌浏览降级态无默认首页——首开自动导航
   booth.pm(白名单内),后续保留历史;
3. **Booth 登录界面与 Cookie 持久化**:隔离 partition(persist:vua-remote)
   登录后 Cookie 自动携带——用户无需每次重登(隔离边界维持,不推送);
4. **Booth 链接全屏不能退出**:内嵌视图缺导航 UI——加固定导航条
   (后退/前进/刷新/回首页/URL 脱敏显示/关闭回 VUA);
   优先级高于批 C UI 接线;属 IMP 页面真实可用性修复(UI-10 不退化＋
   UI-05 切换不丢状态延伸)。
## 自基线交付(9ee8083 合并 main 后)
- main 合并维护(四次 fast-forward:9ee8083→0b03337→d689b68→...→f1ded9d);
- **53a1bc2:操作者修复令(check-leak 注释过度声明修正,纯注释零行为
  变更)**:018 撤回批注释声称「构建期被静态剔除」但脚本并不验证剔除
  行为——改为精确描述(本断言仅覆盖 fixture 负载;不覆盖 DEV 分支剔除
  断言;由静态替换＋Rollup 死代码消除保证;须断言须另行专项检查);
- **1c27f0d:W24 recovered 呈现语义**:BuildRecordCard 在权威态
  recovered 时叠加「已恢复的运行」中性徽章＋语义说明(四语)——显示
  投影折叠(recovered→completed)为裁定投影不变,语义标注补回折叠
  丢失的恢复语义;测试:结构收窄＋投影折叠既有覆盖维持;
- **f0bc0e:019 批 B 保存链接线**:nameHint 用户命名提示(零词表扩展)+
  recipe.save 接线＋保存状态三态(已并入);详情见上方 A 路径段落;
- **b243a1d:019 批 B 保存链完成**:nameHint 用户命名提示输入(条目级,
  保存必填校验)＋保存按钮启用(recipe.save 经 preload gateway 窄面;
  saving 态;失败保留内容可重试)＋savedNote 服务端修订呈现;过时
  saveDisabledNote 文案不再引用(键保留待文案复核);019 批 B 桌面切片
  全部交付完毕;
- **用户观察调查(代码级审计)**:全 live 连接可用性——逐页核对数据源/
  空态/断线分支;结论:(a) 类诚实空态设计正确,(b) 类无代码级异常;
  数据链缺口=内容生产顺序(先导入/先保存),非缺陷。详见留言。
- **b581cf3:019 批 C 桌面切片第一部分**:生产链消费端口
  (ProductionChainPort——resolveRecipe/approvePlan/getPlan/listPlans/
  executeJob/getRecord/listRecords 七方法)＋live 实现(GatewayClient
  消费,字段存在性收窄,词表外滤除不猜测)＋穷举真值表测试＋检测段注册
  计数投影增强(核心表态消费:计数=纯派生量,「—」改直接投影);
- **证据(2026-09-10/11 本机)**:桌面 check 全链绿(typecheck＋vitest 57
  文件 455 测试＋build＋boundary＋i18n tables aligned＋contrast＋leak
  159 指纹零命中)。端口层＋投影增强,UI 接线随后续切片;无端到端宣称。
## 阻塞
- 无桌面阻塞。BG-1 主切片余项待词表归属确认(数据/产线——A-1 路由
  在案);019 批 C 工单已签发(端口层已交付,UI 接线随后续切片)。
## 下次合并意图
b581cf3(019 批 C 端口层＋检测段投影增强)请集成验收合并(desktop 域)。
多套 UI 批 B(选材与草稿)已交付(6dfa40e＋b243a1d 同窗)——如未并入请
一并核对。
## 留言
- [→集成] b581cf3 请验收(生产链消费端口＋检测段计数投影增强——018 批 1
  的 018 备注，核心表态「计数=纯派生量」已消费);f0bc0e/200012d/13764fa
  等在途批次如未并入请一并核对。
- [→核心] 检测段计数投影已按你的表态落地(计数=列表纯派生量,消费端
  投影,无信封升版);editors 计数信封未携带=诚实 —(如实缺省,不预接
  additive 升版)。
- (历史留言消化:数据 TS 镜像校对无出入、词表归属确认——均已闭环。)
