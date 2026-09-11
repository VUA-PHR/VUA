---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: 07c31c5
updated: 2026-09-12
---
## 当前焦点
**BG-11 全额核验完成（2026-09-12 凌晨，声明性核验＋复跑证据；无新代码）**：
BOARD 行标注「部分交付……其余收紧项随环境后续批」滞后于代码现实——四点
验收标准逐项对照当前 main 全部满足，主收紧 dc6aa93（操作者修复令批）早已
入 main（全分支包含）：
1. **钩子收 feature 门** ✅——`terminate_open_and_wait_for_test` 与
   `eac_verify_windows_signature_for_test` 的定义＋lib.rs re-export 均
   `#[cfg(all(windows, any(test, feature = "test-hooks")))]`（dc6aa93 收门；
   156640b 对齐 windows 合取）；`Cargo.toml [features] test-hooks = []` 登记；
2. **eac_terminate 用例标 #[ignore]** ✅——4/4 全 ignore（其一在
   test-hooks 门内，默认构建不编译；默认集 3 ignored）；
3. **默认构建不导出绕过原语** ✅——test-hooks 未开时引用钩子即编译失败
   （dc6aa93 提交信息双向探针：feature off → E0425；on → 编译通过）；
4. **默认 cargo test 不触真实进程** ✅——本轮复跑 project-manager 13 套件
   全绿 0 失败（2026-09-12 本机）：eac_terminate 0 跑/3 ignored；
   eac_probe 5 跑全合成 fixtures＋1 真机 ignored；eac_allowlist_verify
   5 跑全合成＋1 真机 ignored（WinVerifyTrust 用例在 test-hooks 门内且只读）。
**请集成核验后把 BOARD BG-11 行「部分交付」更新为全额交付销账**（锚点
dc6aa93＋156640b＋验收合并 93d8c6a）。环境侧无剩余收紧项。
**前情：E2 交付＋缺项补齐已验收合并（3489276——15fa959 disk_space 双辖区
呈现；含诚实修正声明）**。任务一 E1/E2/E3/E4 全链闭环（真机走查留 W25 窗口）。
## 自基线交付（1c73437 之后）
- 夜间累计交付已全部验收合并入 main：VUA 独有标识文件＋project-inspection
  v0.2（354925a）、双协议本（171b00c）、环境预检事实源＋接线（406fb3e/
  07166b7）、alcom-vcc 1.1.0（9a785b2）、016 表态（e27f042 仲裁采纳）、
  BG-11 修复令（dc6aa93/156640b）＋BG-16 接线验收（e51bdae 四点核验）、
  E2 disk_space 双辖区补齐（15fa959→3489276）＋各消化轮状态批；
- **BG-11 全额核验（本批，collab-only）**：见当前焦点——四点标准逐项对照
  ＋13 套件复跑证据；无代码变更。
## 在途/待他角色
- [已闭环] BG-16 接线验收通过（核心 0c72258/7a0a1ec，67/67＋clippy 干净；
  环境侧四点核验：词表一致／只读纪律／合成 wire 测试／expect 不变量注释）
  ——M6 环境检查行全链关闭；
- [已闭环] BG-11 修复令（操作者修复令两项＋windows 合取对齐补遗）——集成
  验收（**93d8c6a**；前档「93d3c6a」为笔误，本批更正）；全额核验见当前
  焦点，BOARD 行销账待集成；
- [等桌面→核心] 备注编辑范围（D-6）确认→核心 project-ops v0.2 升版批
  （setNote）→我侧原语随批消费；
- [等集成/用户] W25 开窗通知——用户明示延期，时间待定；环境 B 段义务
  （B1→B2a→B2b→B3→B4）清单不变。
## 阻塞
- 无。
## 下次合并意图
本状态批（仅 collab/，BG-11 核验声明＋笔误更正）随轮免测并入 main。
## 留言
- [→集成] **BG-11 全额核验销账请求**：BOARD 工单表 BG-11 行请从「部分交付
  ……其余收紧项随环境后续批」更新为全额交付——四点验收标准（钩子收门/
  ignore 化/默认构建不导出/默认测试不触真实进程）已逐项对照当前 main 满足，
  主收紧在 dc6aa93（09-10 修复令批，早已入 main），windows 合取补遗
  156640b（93d8c6a 验收）。本轮复跑证据：project-manager 13 套件全绿
  0 失败（2026-09-12 本机），默认集真实进程触碰为零。核验明细见本状态
  文件当前焦点节；
- [→集成] 备案：016 表态收讫、双协议本验收（171b00c）、标识文件批验收
  （354925a）三条知悉；**REGISTRY 行路径列不混入括号描述**的纪律要求知悉
  并遵守（描述进状态列或 commit message）；
- [→桌面] 卡片标题四语文案随批交付收讫（消费侧注册表＋未知 id 透传）——
  环境卡片标题链闭环；
- （历史留言消化：wt-2 E1 快照核对与 disk_space 归属差异——已由 E2 补齐批
  15fa959 处理并经 3489276 验收闭环；013/014 内联核心三问表态与 v0.2 消费
  路由——均已落账。）
