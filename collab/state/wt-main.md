---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 833b949
updated: 2026-09-08
---
## 当前焦点
**M5 首批冻结面收口**：unity-bridge **v2 已冻结**（产线，互审收口后 Schema 终版
＋双语协议 v2＋REGISTRY；v1 双族并存）＋**production-evidence v0.1 已冻结**（数据
W23 兼容/缺失证据模型，跨词表引用消费 recipe v0.3 套件）——集成复跑 **376 通过
0 失败**＋clippy 零告警。冻结面：bdl-commands v0.3＋recipe v0.3 四件＋unity-bridge
v2＋production-evidence v0.1。剩：执行序②核心 wire/挂点、W22 实现切片、③桌面
呈现、production-use-case v0.2 冻结（011 词表落地时）。
## 自基线交付（c465f43..833b949，本 tick）
- **验收合并产线 unity-bridge v2 冻结批**（1a9cdf6）：Schema 终版（DRAFT 横幅
  移除；互审收口语义入描述——planRef job 目录文件形态＋planHash Bridge 本地
  校验＋rejected 收据无快照）＋双语协议 v2＋REGISTRY（v2 已冻结，v1 保持已接受
  双族并存）＋BOARD 契约表行（产线自更）；
- **验收合并数据 W23 冻结批**（016a839 经 faa43c0）：production-evidence v0.1
  Schema＋5 例＋契约测试更新＋双语协议＋REGISTRY；bdl-commands v0.2 头部
  superseded 横幅（登记合规）；
  验收证据（2026-09-08 本机）：**cargo workspace 376 通过 0 失败**（净增 6）＋
  clippy -D warnings 零告警；REGISTRY 校验 30/30 一致；
- BOARD：契约表加 production-evidence 行＋最近更新行刷新（015 收口批 c465f43
  已并入）。
## 阻塞
无。
## 下次合并意图
核心执行序②批（warehouse.import wire/挂点实现，交集成验收）；W22 实现切片
（provider 侧记录面）；production-use-case v0.2 冻结批（011 词表落地时）；W18/
W19 桌面呈现批（执行序③）；W25 真机窗口（产线预约维持）；#7 残余样本（再现即
带全量日志）。
## 留言
- [→产线] **v2 冻结验收合并（复跑 376/0 确认）**——契约表 unity-bridge 行你方
  自更已核对采纳；C# 侧（BridgeCommandProcessor 分发扩展）开工解锁；W22 实现
  切片对接（recoveryPoints 拍摄＋收据转抄）与核心对齐；W25 窗口就绪前知会；
- [→数据] **production-evidence v0.1 冻结验收合并（复跑 376/0 确认）**——W23
  落地；执行序②（010）落地后解析文档 evidenceIds 引用即有真实来源；
- [→核心] 冻结面收口（v0.3＋recipe v0.3＋v2＋evidence v0.1）——执行序②
  （warehouse.import wire/挂点）按 010 设计推进；production-use-case v0.2 冻结
  （011 §7 词表）随 W20 实现切片；
- [→桌面] ③呈现批等执行序②；两依赖（v0.3 词表＋W20 读面闭集）已冻结就绪；
- [→操作者→用户] W25 真机窗口预约维持（等 W21 契约/实现就绪前确认即可）；
- [需用户] U5 维持暂缓（VUA-2/VUA-3 目录清理）。
