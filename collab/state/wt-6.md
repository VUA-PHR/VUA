---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: c140f01
updated: 2026-09-09
---
## 当前焦点
**EAC R3 签名核验已落地（667346e/de11df1），R3 四要素全部可核验，请求集成验收**
（两批：e08b287 R2/R3＋667346e R3 签名，后者待验收）。EAC 剩余=R1b 终止原语＋
九态任务面整合（四要素核验原语已齐，终止调用为最后一块）；真机窗口待约（探测/
再核验/签名通过路径/首批清单证据）。
## 自基线交付（c140f01 后，三提交）
- 合并 main 最新两轮（5f7a4d1→bac7553→c140f01：EAC R1a/R2/R3 验收合并）；
- **e08b287（已验收 442/0）**：R2 允许清单数据面（起始空、四要素＋出处、通配符
  拒绝、半有效=加载错误）＋R3 核验原语（名称/路径/签名三检查＋pid 存活）；
- **667346e＋de11df1（R3 签名核验补齐，待验收）**：
  - `eac_verify.rs` 接入真实 WinVerifyTrust（GENERIC_VERIFY_V2、WTD_UI_NONE、
    无吊销、STATEACTION VERIFY＋CLOSE 释放）：status 0=Verified，无签名/提供者
    拒绝/其他=类型化 Unverified（状态码进 detail）；**R3 四要素（名称/路径/签名/
    pid 存活）全部可核验，任一不通过即拒绝；对已签名在册二进制 Verified 可达**；
  - 上一切片「恒定 Refused」暂态被真实判定取代；测试更新（不存在文件→Unverified
    带状态码、测试二进制自身→Unverified）＋Windows 测试钩子；
  - Cargo.toml 加 Win32_Security_WinTrust/Cryptography features（vendored
    windows-sys 自带 WINTRUST_DATA/WINTRUST_FILE_INFO 绑定）；
- 006 提案内联第三刀落账；
- **证据**（2026-09-09 本机）：workspace 全量 0 失败＋clippy -D warnings 零告警；
  签名通过路径真机验证待窗口（#[ignore]）。
## 阻塞
- 无阻塞。EAC 最后一块=R1b 终止原语＋九态任务面整合（provider/核心协作点）；
  真机窗口待约（产线，延续 W1 惯例）；M6 门验收等 M5 关门。
## 下次合并意图
两批请集成随轮 --no-ff 验收合并：①e08b287（R2/R3，若未带入）②667346e＋de11df1
（R3 签名核验）。验收要点=R3 四要素完整性与 Verified 可达性。
## 留言
- [→集成] EAC 两批请验收（e08b287 已复跑 442/0 确认；667346e/de11df1 待验收）。
  R3 现为完整四要素核验；终止原语（TerminateProcess）与九态任务面整合为最后
  一块，整合点（provider 路由/任务包装）归核心协作，环境实现后交验收；
- [→产线] 真机窗口请求更新：窗口内执行四件——①eac-probe 真机探测 ②R3 再核验
  （对真实 EAC 进程，验证 WinVerifyTrust 对已签名 EasyAntiCheat.exe 判 Verified）
  ③首批允许清单条目证据采集 ④（可选）签名通过路径的 Verified 断言记录。照 W1
  惯例归档；
- [→桌面] EAC 呈现归属待派发已知悉（F6 不呈现检测卡）；若后续派发呈现面，形状
  =schemas/eac-probe/v0.1（v0.1 termination 恒 unavailable 口径不变）。
