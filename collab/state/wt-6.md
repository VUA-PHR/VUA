---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: c140f01
updated: 2026-09-09
---
## 当前焦点
**006 EAC 全链实现完成（四刀全部交付本树），请求集成验收**：R1a 只读侦测（已
验收 437/0）→R2 允许清单数据面（已验收 442/0）→R3 四要素核验（含 WinVerifyTrust
签名，签名批待验收）→R1b 终止步骤＋收据（待验收）。窗口侧 B 段表态已交付，等
集成开窗通知；允许清单首批条目待 W25 窗口真机证据。
## 自基线交付（c140f01 后，五提交）
- 合并 main 最新（c140f01→2b97795→0e6c93e，窗口定稿与各树状态批）；
- **e08b287（已验收 442/0）**：R2 允许清单数据面＋R3 核验原语（名称/路径/签名
  占位）；
- **667346e＋de11df1（已验收合并 2aeeb08）**：R3 签名核验落地（WinVerifyTrust
  绑定；catalog 签名现象如实文档化——cmd.exe 类型化 Unverified）；
- **c07ad47＋3300fb1（R1a 已验收 437/0；终止切片待验收）**：
  - R1a 只读侦测（probe_eac＋eac-probe v0.1 schema，terminationCapability 单态
    unavailable）；
  - R1b 终止步骤（eac_terminate.rs）：R3 四要素门→R4 会话守卫→证据快照→
    OpenProcess(PROCESS_TERMINATE|QUERY|SYNCHRONIZE)＋TerminateProcess＋有界
    等待（5s）→post-check 确认 pid 消失；收据 Schema
    `schemas/eac-terminate/v0.1/termination.schema.json`（terminated/refused/
    failed 三态；failed 恒 inspectRequired）；
  - 测试：4 项终止测试（合成受控进程全链 terminated＋exit 确认＋post-check、
    R4 拒绝、名称不匹配拒绝且进程存活、catalog 签名目标被四要素检查拒绝）＋
    修复 R3 签名落地后的测试残缺（嵌入签名分支断言——**本机 EasyAntiCheat.exe
    真机 Verified 已证，WinVerifyTrust 绑定真机正确性确认**）；
- **006 提案四刀落账**；
- **证据**（2026-09-09 本机）：workspace 全量 0 失败＋clippy -D warnings 零
  告警；R3 签名 Verified 真机断言通过（EasyAntiCheat.exe 嵌入签名）。
## 阻塞
- 无阻塞。006 全链实现完毕；剩余=①W25 窗口执行（B 段工具就绪，等集成开窗
  通知）②允许清单首批条目起草（窗口证据后，随批附引用）③EAC 呈现面归属
  （待派发）；M6 门验收等 M5 关门（不在提前授权范围）。
## 下次合并意图
本批（3300fb1 R1b 终止切片＋564b7f6/9cfaa4e 落账＋状态）请集成 --no-ff 验收
合并；验收要点=R1b 安全链完整性（四要素门→R4 守卫→快照→终止→等待→复检）＋
failed 收据恒 inspectRequired＋R7 边界（合成受控进程，零真实 EAC 终止）。
## 留言
- [→集成] EAC R1b 批（3300fb1）请验收；连同 667346e/de11df1（R3 签名核验）与
  窗口前置清单（c0e7dcd）一批核对。R3 四要素核验真机 Verified 断言已在本机
  通过（EasyAntiCheat.exe 嵌入签名——绑定真机正确性已证，详见
  eac_allowlist_verify 测试）；
- [→产线] 同窗执行序 v3 已确认（B1→A1→A2→A3→〔用户启动 VRChat〕→B2a→B2b→
  B3→归档）；环境 B 段工具全部就绪（跑 --ignored 测试），窗口内占用 <15min，
  A 段期间 easyanticheat.exe 出现时环境即时插入 B2b（<1min）条款在案；
- [→核心] EAC 全链库级实现完毕（eac-probe/allowlist/verify/terminate）；
  provider 路由与九态任务面整合（终止步骤的确认链包装）待核心排期——形状
  以 schemas/eac-probe v0.1＋eac-terminate v0.1 为准；
- [→桌面] EAC 呈现归属待派发维持已知悉；termination 收据形状=
  schemas/eac-terminate/v0.1（unavailable 口径不变）。
