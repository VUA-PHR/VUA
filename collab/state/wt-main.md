---
worktree: wt-main
branch: main
role: 集成
baseline_commit: d1c5807
updated: 2026-09-09
---
## 当前焦点
**今夜代裁机制生效中**：BOARD 专节已立（用户预授权，仅 2026-09-09 23:00–次日
08:30 有效）；**panel-prebatch 预产清单已落盘归档**（28 项今夜裁决项预备清单＋
三层分流门禁＋红线清单＋B-1 元判据）——夜间面板使用前先读其 §0 规程；结论仍以
面板 2:1＋晨起追认为准。IMP-1~5 今夜 23:00 开工；M5 剩 W25 真机窗口＋W26 门验收。
**常驻进程注记（如实）**：常驻实例已随 harness 重启失效，今夜节拍由兜底机制重建；
本批仍由操作者临时创建的集成实例执行。
## 自基线交付（d1c5807 之后）
- b9f9933：Reviewer 复核报告归档＋BOARD U9「裁决 4」四分法＋outline 2.0.11 落表
  IMP-1~5＋M4 行引用闭环＋实差必做项路由；
- a592fb0：BOARD「今夜代裁机制」专节＋wt-main 同步登记；
- **本批（纯 collab/）**：panel-prebatch 预产清单归档入树＋§3 附带观察路由——
  ① REGISTRY product-boundary 行滞后（REGISTRY.md:13 记 1.2.0，实文 1.2.1）与
  ② U9 四分法落版 product-boundary/desktop 架构时机（现锚 outline 2.0.11 治理
  注记＝A-7 临时态；IMP-5 或更早落版）＝集成随今夜开工批；③ 导航实差三处实现
  参照＝桌面（见留言）；④ 编号对照注记已并入 BOARD 机制节。
## 阻塞
无。
## 下次合并意图
集成今夜开工批：U7②/U9 落版 product-boundary（双语升版）＋desktop 架构行落账＋
REGISTRY product-boundary 行刷新（随升版批一并，勿再积压）；今夜代裁裁决项随
面板产出落档/落 BOARD；IMP 冲刺批验收；W25 前置验收＋开窗通知草案（开窗本身
留晨起，O-2）。
## 留言
- [→桌面] **导航实差三处实现参照**（panel-prebatch §3-3，随今夜必做改造）：①
  will-navigate 清单外由拦截改「提示后放行」转当前内嵌视图（确认在前，A-1 判据）；
  ② setWindowOpenHandler 对 http/https 弹窗由「交系统浏览器」改为清单内直行/
  清单外提示后转当前内嵌视图（U9(1)，原生新窗口仍一律 deny）；③ 新增外部协议
  确认层（初始清单恰为 mailto/steam/vrchat/discord 四项，A-4 保守项）＋伪协议
  窗口无条件拒（U9(2)）＋手势判定仅限协议启动（U9(4)/A-5）。实差定位＝
  main.ts:285,293＋security.ts:97-115＋download-port.ts（详见归档清单 §1）；
- [→核心] W22 两对接细节待澄清（W25 前置③输入）；production-use-case v0.2 冻结
  收口声明待正式确认；
- [→数据] IMP-3 契约先行照 B-1/C-1 分流：域内命名自决、跨域集成仲裁、冻结硬
  前置不豁免；
- [→操作者] 本临时实例无遗留；roster 重建后由 rebuilt 实例接管节拍。
