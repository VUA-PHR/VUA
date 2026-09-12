---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 877d4f1
role: 桌面
updated: 2026-09-13
---
## 当前焦点
**overlay 置顶窗先行切片交付＋U10 裁决知悉＋回执消化＋追平（2026-09-12
23:0x–09-13 0:0x 工作时段轮）**：
- **切片交付：overlay 置顶窗先行切片（017 §4 桌面表态「实现面备注」落地，
  M7 桌面行「桌面 Overlay 收尾」域内先行部分，提交 12b5592）**：
  - contracts TS 面（桌面登记域）：`DesktopWindowApiV1` 增 `toggleOverlay`
    壳动作＋`OverlayWindowVisibilityV1` 回执——窗口族动作，**非 wire 方法
    词表**（不进 DESKTOP_GATEWAY_METHOD_KINDS），017「wire 词表不预接」
    边界如实维持；
  - 主进程 `overlay-window.ts`：动作→窗口操作决策纯函数（create/show/
    hide 三分支）＋形态参数常量（460×640、screen-saver 级置顶、
    `?surface=overlay-desktop`——F7a spike 验证结论钉死防漂移）；决策面
    测试 5 项新增；
  - `main.ts` 接缝：BrowserWindow 创建（transparent＋frameless＋skipTaskbar
    ＋hasShadow:false，同 `localWindowWebPreferences` 安全面）；显隐用
    showInactive 不夺焦点（VRChat 全屏不打断）；窗口自身关闭只清引用
    （下次 toggle 重建），主窗口关闭销毁 overlay——「主窗口关闭＝应用退
    出」语义不变（window-all-closed 不被悬浮窗拖住）；IPC
    `vua:overlay:toggle` 带 assertLocalSender 本地来源守卫；
  - preload `window` 面同名窄方法（同一 VuaDesktopApiV1 面对主窗口与
    overlay 窗口共用，零新增连接语义——017 表态 1）；事件面零新增：广播
    路径对 `?surface=` 参数 URL 天然放行（isAllowedLocalSender 前缀/路径
    匹配），overlay 窗口天然在广播清单内；
  - 渲染层正式入口（DevScenario 之外）：主窗口顶栏主题切换旁 caption 按
    钮＋i18n 四语 `app.overlayToggle`；
  - **诚实边界**：overlay 读面 wire 词表不预接（候核心批 1 冻结批）——
    渲染面生产路径恒为诚实 inactive 空态（overlay-port 未接入占位），本
    切片零快照语义、零 mock 出 DEV（check-leak 159 指纹零泄漏复核）；
  - **测试证据**：desktop check 全链绿——typecheck 双 tsconfig＋vitest
    63 文件 505/505（含新增 5 项）＋build＋boundary＋i18n＋contrast＋
    check-leak。**真机窗口走查留 W25，本批不含端到端宣称**（第 5 条诚实
    纪律：Electron 主进程实际开窗行为未经真机走查，只宣称决策面与全链
    静态验证）。
  - 文档：desktop_ZH/EN 1.2.0 新增「Overlay 置顶窗」节（双语同步）＋
    REGISTRY 行同步 1.2.0/2026-09-12。
- **【① 注意】指向本角色留言消化**：wt-main **状态批验收合并回执
  （7cfb796，collab-only 免测）**收讫——即我上轮状态批 bc2dbec 的入库回
  执；纯回执型，无遗留动作；
- **U10 裁决知悉（698e738/11745df 随追平入树）**：ADR path-configuration
  双语接受（默认零配置＋补救手动选择＋三道闸验证）；本切片不涉设置/路径
  面，ADR 验收五条无交集；workshop F3 段所候「壳侧 Unity 编辑器配置面工
  单」**尚未见开出**（BOARD 与各树状态无工单登记），维持等待不猜测先行；
- **baseline 追平**：slot/wt-3 合并 main（89e53cf→877d4f1 世代，--no-ff
  追平合并 065792d，落后 7 清零，零冲突；inbound 全为 collab/ 簿记＋
  U10 裁决 ADR/REGISTRY（集成域），零桌面域文件）。
- **领任务链全查（本轮）**：①本树在途＝overlay 先行切片（本轮交付，见
  上）；②BOARD 桌面行＝#22 已关闭、U10 已裁决无桌面义务、#19 候产线切
  片；③outline M5 当前窗口桌面行＝W24 已交付，M6 表桌面行收口（IMP-2/
  IMP-5 真机半边候 W25）；④M7 分解表桌面行＝「Inspection/Release 与官
  方 SDK 交接」候产线 Bridge 五维落地、「桌面 Overlay 收尾」先行部分本
  轮交付、wire 消费半边候核心批 1。除在途消费接线外无可领新项。

**前情（08:4x 收尾轮，已随 7cfb796 入 main）**：两条回执型留言消化＋追平
89e53cf＋overlay 先行切片排期维持 23:00。细节见本文件 git 历史（bc2dbec
版本）。

## 待办队列
- **overlay wire 消费接线（批 1：任务卡＋生产状态卡投影的渲染消费）**：
  候核心批 1 冻结批（017 内联领取声明：OverlayReadModel 增补＋wire 暴露
  ＋TS 面＋消费测试；交付后我树接线 overlay-port live 实现，替换 inactive
  占位）；
- 批 D（019 视觉与交付）：未签发，不开工（#21 行明示）；
- W25 真机窗口：用户延期维持（O-2）；IMP-2 下载主机域真机验证程序、
  IMP-5 真机半边、#22 消费链 live 走查、**overlay 窗口真机走查**同候此
  窗口；
- workshop F3 段：等壳侧 Unity 编辑器配置面工单（U10 已裁决，但工单未
  见开出，维持等待）。
## 阻塞
- 无桌面阻塞。备忘（非阻塞，维持）：live-production-port 的
  isTaskSnapshot 守卫窄度（三键）与 project-ops-port（全必需键）不同型
  ——B 线既有形态，未被点名不擅动；如集成/核心认为需对齐，请留言指派。
## 下次合并意图
**两批请集成随轮验收合并（--no-ff）**：①overlay 先行切片实现批
（12b5592，13 文件——contracts TS 面＋主进程＋preload＋渲染层入口＋
i18n 四语＋desktop 双语文档＋REGISTRY；**实现批走全量测试证据**：desktop
check 全链＋vitest 505/505，见当前焦点）；②本状态批（仅
collab/state/wt-3.md，collab-only 免全量）。
## 待命声明（第 6 步，如实）
本轮（23:0x–0:0x，工作时段）：①overlay 置顶窗先行切片交付（排期兑现，
切片完整性：TS 面/Rust 无涉/渲染层/测试/文档同批，全链绿）；②wt-main
回执消化＋U10 裁决知悉（本切片无交集）；③追平 877d4f1（零冲突，零桌面
域 inbound）；④消费接线候核心批 1，无其它可领新项。退出待命，候集成
验收或核心批 1 到货。
## 留言
- [→集成] **overlay 先行切片实现批＋状态批请随轮验收**：实现批走全量
  测试证据（desktop check 全链绿，vitest 505/505 含新增决策面测试 5 项）；
  真机开窗走查留 W25 窗口如实声明，不含端到端宣称。域边界自核：contracts
  仅 TS 壳动作面增量（桌面登记域）、apps/desktop 域内、docs/architecture/
  desktop_*＋REGISTRY 行同步，零他角色所有权域触碰。
- [→核心] overlay 置顶窗先行切片已落（017 表态「实现面备注」兑现）：窗
  口层与正式入口在位，preload 面已含 toggleOverlay；wire 批 1 到货即可接
  线消费（overlay-port live 实现替换 inactive 占位）。词表以你冻结批为准，
  我方不预接。
- （历史留言已消化归档：wt-main 7cfb796 验收回执＋U10 知悉〔本批消化〕；
  wt-main 909b132 验收回执、wt-4 M7 知会、wt-2 017 领取明示、wt-6 B5②
  回执、#22 消费批与 020 冻结收讫、D-6/P2 验收回执等〔见 git 历史
  bc2dbec/5b14f51/9b39f6e/1aab54d/833f17e 版本〕——均无后续动作。在途
  事项以 BOARD 与本状态文件当前焦点为准。）
