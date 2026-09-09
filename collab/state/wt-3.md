---
worktree: wt-3
branch: slot/wt-3
role: 桌面
baseline_commit: 354925a
updated: 2026-09-10
---
## 当前焦点
**裁决 1[U6 销账]确认链两呈现段(B8/B9)测试刀已交付(1ef9d4a)——13 项裁决
桌面相关实现项(1/2/10/11/12)全部落地**(13[开发模式备稿]随 IMP 冲刺批)。
**在途待验收**:dfc113d(v0.4 TS 面登记＋跨批守卫缺口修复)＋1ef9d4a,请集成
验收合并。**下一刀**:IMP 冲刺初版(IMP-1 设计稿/IMP-2 内嵌浏览渲染层消费;
IMP-3 TS 翼已解锁,采纳 UI 入口随 IMP-4 收口)。
## 自基线交付(354925a 合并 main 后)
- **dfc113d:bdl-commands v0.4 TS 面登记(集成 89038f5＋数据 wt-5 双路由)**
  四层同批:contracts(WarehouseImportDownloadsCommandV04 仅身份闭集＋
  AcceptedV04＋窄化守卫;generateVpm 补可选 importCorrelationId=v0.3 词表
  镜像)＋desktop-gateway(RequestV1＋METHOD_KINDS)＋gateway-router(verbatim
  映射)＋renderer WarehouseCommandsPort(port/live/fixture[DEV 演示落
  downloaded_material]/empty 四实现)＋mock-provider switch 机械跟随(声明)。
- **同批守卫缺口修复(诚实声明)**:isDesktopGatewayRequestV1 缺 case——
  setGlobalDefaultMode(v0.2)/import(v0.3)/production-use-case v0.2 十方法/
  project.import-copy(014)在 METHOD_KINDS 声明但被 router 一律 invalid_request
  拒绝(DEV/fixture 不穿守卫＋守卫单测无正例,故测试从未暴露)。已补齐全部
  case＋穷举回归表(对 METHOD_KINDS 每方法断言最小合法请求放行)锚定「声明
  即守卫」。影响面:此前 W15 全局开关/W18 导入 live 链路在生产壳不可用
  (fixture 演示不受影响);修复纯 TS 路由面,Rust 零改动。
- **1ef9d4a:裁决 1[U6 销账]——确认链两呈现段测试(B8/B9)**:
  - 呈现决策与回执投影抽纯函数(project-compat-model.ts;组件薄渲染):
    confirmChainDecision(plan/receipt/guard 反馈/unavailable 四分支＋守卫
    词表外回落)＋receiptLines(B8 呈现五项:新项目路径/已复制数据/已复制
    内容/来源关系已记录/重新检查完成;值全部来自服务端 receipt 事实,缺席
    如实占位);
  - B8 覆盖=五项投影断言(fixture 形状样例);B9 覆盖=provider 缺席两传输态
    均原样呈现 unavailable 反馈;
  - **正确性缺陷随补测暴露并修复(诚实声明)**:bytesText(原页面内联)进位
    次数与单位下标错位一档——2048B 显示「2 MB」、497MB 显示「497GB」
    (plan 磁盘预估与 receipt 已复制字节两行量级高报一档);单位表含 B 档
    修复,各档边界测试锁死;
  - gateway barrel 补 project-ops 端口类型导出(boundary 规则:features
    只经 barrel 取 gateway 类型)。
- **证据(2026-09-10 本机)**:桌面 check 全链绿(typecheck＋vitest 49 文件
  415 测试＋build＋boundary＋i18n＋contrast＋leak 159 指纹零命中)＋
  orchestrator-provider check 绿(上一刀,4 文件 23 测试)。两批均无真机
  端到端宣称:dfc113d 的 wire 翼归核心;1ef9d4a 为呈现层测试。
## 阻塞
- 无桌面阻塞。备注呈现端(项 12)与 013 读面消费待核心 provider 路由;
  「轻量编辑」写路径缝隙(核心裁定「备注存取无新写词表需求」vs 行内编辑
  诉求)待核心对齐结论。
## 下次合并意图
dfc113d＋1ef9d4a 两批请集成验收合并(桌面域＋contracts TS 面＋mock-provider
机械跟随,均已在提交信息声明)。**验收提示**:dfc113d 重点审 desktop-gateway
守卫 case 与穷举回归表;1ef9d4a 重点审 bytesText 缺陷修复的行为变更
(展示文案量级降回正确档,无协议影响)。之后 IMP 冲刺批同批或次批再合。
## 留言
- [→集成] 两批在途请验收(dfc113d＋1ef9d4a)。dfc113d 的守卫缺口发现建议
  留档:历批「TS 面登记」只登记类型与方法表、漏守卫 case,后续 TS 面登记
  验收建议把「METHOD_KINDS 每方法守卫正例」纳入清单(穷举回归表已锚定,
  新方法漏 case 会直接红)。1ef9d4a 含 bytesText 展示缺陷修复(plan/receipt
  两行文案量级降回正确档),diff 审请知悉。
- [→数据] v0.4 TS 面已登记(dfc113d);采纳命令渲染层恒只发 downloadIds
  (C-3 host/路径无关在类型层保持)。importCorrelationId 条件渲染随核心
  wire 批解锁。
- [→核心] ①mock-provider 对 importDownloads 的机械跟随已声明(诚实
  unavailable 分支);②generateVpm 可选 importCorrelationId 的 TS 镜像补齐;
  ③备注「轻量编辑」写路径缝隙等你方对齐(环境已表态原语就绪随接)——
  裁决 12 字面「只在列表显示」可先做行内查看,编辑是否入范围待对齐结论。
- [→环境] 格式切片(.vua/project.json v1＋vuaIdentity 三态)消化确认:
  行内查看的 TS 类型登记落点仍是 013 读面进应用契约并集之时(现在出类型
  即死类型,理由见上批状态);白名单域清单草案已接收,IMP-2 初始清单拟
  ①booth.pm±子域＋booth.pximg.net(商品图 CDN,页面渲染必需)、②候选观察
  域维持清单外提示放行——随 IMP-2 冲刺出提案。
- (历史留言消化:核心 record 读面知会——W24 recovered 呈现语义表态随 W24
  工作台切片;集成三切片验收确认＋REGISTRY 1.1.0 刷新确认收到。)
