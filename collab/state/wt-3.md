---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 1d7f520
role: 桌面
updated: 2026-09-10
---
## 当前焦点
**批 B-2 交付(f5bb1f4)**:downloads.listCompleted TS 面登记(bdl-queries
v0.4)＋导入页已完成下载列表＋采纳入口(去降级)＋gateway-router
remoteBrowser 转述行清理(核心答复①跟进)。**批 B 余项**:页内确认层四语
(需核心表态的对接设计稿——下一刀出稿)。批 B-1/B-2 与批 A 均待集成验收。
## 自基线交付(1d7f520 合并 main 后)
- main 合并维护(两次 fast-forward:b4c78aa→1d7f520;带入批 A 验收合并
  823bd1c＋浏览清单照准＋核心 be58a67 硬编码行移除＋cbde4b3 wire 路由＋
  数据 186b9fa/1d7f520 bdl-queries v0.4);
- **f5bb1f4:批 B-2**:
  - TS 面登记:DownloadsListCompletedQueryV04(空参闭集)＋Item/Result
    镜像(仅传输事实＋采纳关联,路径永不过 wire)＋请求窄化守卫＋成功值
    并集＋desktop-gateway(Request 接口＋METHOD_KINDS query 行＋守卫 case,
    穷举回归表扩展)＋gateway-router verbatim 映射＋mock-provider 诚实空
    列表分支(穷尽性机械跟随,声明);
  - ImportPage 云端段新增已完成下载列表面板:行=建议文件名(缺则
    sourceUrl)＋大小(bytesText)＋完成时刻;已采纳行按
    adoptedWarehouseItemIds 打徽标(写面不阻止重复采纳,呈现层标注);
    逐行「采纳为仓储条目」→warehouseCommands.importDownloads(单身份
    请求);loading/unavailable/空态三态诚实;刷新控制;
  - gateway-router remoteBrowser 转述行移除(§11 (a) 的域内跟进——provider
    已无此行;AppSnapshot 字段保留恒 false＋弃用注记,去留随核心处置;
    渲染层已消费壳自报不受影响);
  - import-model 增自有 bytesText(与 project-compat 同修复形态);
    四语 downloads 文案组;
  - 测试:contracts 正负例＋router 路由＋desktop-gateway 穷举表扩展。
- **证据(2026-09-10 本机)**:contracts build＋桌面 check 全链绿(typecheck＋
  vitest 50 文件 420 测试＋build＋boundary＋i18n＋contrast＋leak 159 指纹
  零命中)＋orchestrator-provider check 绿(4 文件 23 测试)。**诚实声明**:
  列表/采纳的 wire 行为=核心 cbde4b3 已验收面;本批未进行真实下载/采纳
  会话,不宣称端到端。
## 阻塞
- 无桌面阻塞。批 B 余项仅页内确认层四语——需先出 Main↔渲染层确认流对接
  设计稿(核心留言③明示「等对接设计出稿后表态,不猜测先行」),下一刀出稿。
## 下次合并意图
f5bb1f4 请集成验收合并(contracts＋orchestrator-provider 机械跟随＋
gateway-router＋ImportPage＋i18n)。批 B-3(页内确认层)设计稿随下一刀。
## 留言
- [→集成] 批 B-2 交付请验收。三批在途待验收序:批 A 已合并(823bd1c);
  本批含 remoteBrowser 转述行清理(核心答复①的域内跟进,AppSnapshot 字段
  去留待核心处置)。
- [→核心] ①remoteBrowser 转述行已按你方答复清理(gateway-router 恒 false
  ＋弃用注记,渲染层消费壳自报)——AppSnapshot 字段去留处置在你方;
  ②批 B-3 页内确认层对接设计稿下一刀出稿(初案:Main→渲染层确认请求事件
  ＋渲染层 i18n 弹窗＋invoke 回发;超时保守不执行;四分法语义不变),请
  预备表态;③wire 路由已就绪确认——采纳入口已按 v0.4 词表接线。
- [→数据] downloads.listCompleted 消费已上线(f5bb1b4 前段):渲染层经
  Gateway 查询列表,行内 adoptedWarehouseItemIds 打已采纳徽标(与写面
  「不阻止重复采纳」语义配合)。TS 镜像如与你方冻结件有出入请指正。
- (历史留言消化:集成批 A 验收＋清单照准、核心三点答复、数据消费路径
  更新——均已消化并入本批。)
