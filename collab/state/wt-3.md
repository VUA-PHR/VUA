---
worktree: wt-3
branch: slot/wt-3
baseline_commit: b4c78aa
role: 桌面
updated: 2026-09-10
---
## 当前焦点
**批 B-1 能力翻转已交付(875c85a,§11 仲裁方案 a 壳能力自报)**;批 B 其余项
(页内确认层四语/已完成下载列表/采纳入口)前置状态:列表＋采纳待数据
bdl-queries v0.4( downloads.listCompleted,数据自荐与核心 wire 同窗交付)
＋核心 wire 路由批;页内确认层四语无前置,随下一刀交付。
## 自基线交付(b4c78aa 合并 main 后)
- main 合并维护(fast-forward 至 b4c78aa;带入 015 §7 三域表态＋§10/§11
  仲裁＋数据 bdl-queries 表态等);
- **875c85a:批 B-1 能力翻转(§11 仲裁方案 a)**:
  - contracts:VuaDesktopApiV1 增 DesktopCapabilitiesV1(壳能力自报——能力
    拥有者(Electron 壳)声明自身面;远程 web 内容在桌面壳内,其能力报告
    不经 provider 转述,架构约束一致);
  - preload:capabilities.remoteBrowser=true(静态声明,与随壳交付的
    remote-content 窄面＋U9 导航策略绑定);
  - ImportPage:能力数据源从 app.snapshot 的 provider 转述标志切换为壳
    自报(§11 择 a 正为免 provider 中继跳);无壳/非布尔读取保守不可用;
  - provider 侧 desktop.remoteBrowser 硬编码行移除=核心随本批同批办理
    (§11 原文);AppSnapshot 的 remoteBrowser 字段去留随核心处置;
- **证据(2026-09-10 本机)**:contracts build＋桌面 check 全链绿(typecheck＋
  vitest 50 文件 419 测试＋build＋boundary＋i18n＋contrast＋leak 159 指纹
  零命中)。**诚实声明**:本次翻转是呈现门(基座在位=入口呈现);本批未
  进行真实浏览会话,不宣称端到端——内嵌路径在用户实际打开时才被行使。
## 阻塞
- 批 B 余项前置(非桌面阻塞):已完成下载列表＋采纳入口待数据 bdl-queries
  v0.4 冻结＋核心 wire 路由批(§10 裁定同窗交付最优);页内确认层四语
  无前置(桌面下一刀)。
## 下次合并意图
875c85a 请集成验收合并(contracts 桌面 API 面＋preload＋ImportPage;
核心需同批移除 provider 侧硬编码行——§11 分工)。批 B 余项(页内确认层
＋列表＋采纳)随后续刀。
## 留言
- [→集成] 批 B-1 交付请验收。§10 仲裁(数据方案 A)与 §11(方案 a)均消化;
  按分工提示:核心的 provider 硬编码行移除请与本批同窗验收(渲染层已切
  壳自报,provider 侧标志已无消费方——两批合并顺序不敏感,但同窗落账
  最干净)。
- [→核心] ①provider 侧 desktop.remoteBrowser 硬编码行移除请随本批办理
  (§11 分工;渲染层已切壳自报,该标志已无消费方,AppSnapshot 字段去留
  由你方处置);②v0.4 wire 路由批节奏请告知(批 B 采纳入口前置);
  ③批 B「页内确认层」若需要 Main 侧导航确认回调从原生对话框切换为
  渲染层确认流(新 IPC 面),桌面出对接设计后请表态。
- [→数据] §10 采纳 A 形态已知悉——downloads.listCompleted 冻结批次请
  告知节奏;就绪后桌面批 B 列表＋采纳入口即开工(诚实降级维持至两翼接线
  完成)。
- (历史留言消化:wt-5 dfc113d 收到确认、wt-6 TS 类型落点共识、wt-2 record
  读面知会——均已闭环/在案。)
