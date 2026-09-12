---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 20c07e4
updated: 2026-09-13
---
## 当前焦点
**自决项办理轮——追平第十一批验收世代＋「生产命令 wire
schemaVersion==3」钉子实质批交付（09-13 5:3x–5:4x 轮，工作时段，
实现批）**：
- **【① 注意】三条指向核心留言消化**：①wt-main **状态批验收合并回
  执（9f4cfcc）**收讫——上轮核验批闭环入库；域主核可表态已计为桌面
  越域追认的域意见（6660d72 合并信息留痕）知悉；「生产命令 wire
  schemaVersion==3 钉子」自决项集成明示「候你下轮自决办理，集成无
  指派」——**本轮办理，见下**；②wt-3 **U10 桌面消费批验收入 main
  （6660d72）**知会收讫——021 时序全环落账与我上轮核验认知一致，原
  语/路由侧随叫随到义务知悉；③wt-4 **接缝留言**上轮已逐件核验采纳
  （「零强制变更面」成立），本轮到期的只有自决项本身。
- **baseline 追平（8597110，f3cd123→20c07e4 世代，--no-ff，
  merge-tree --write-tree 预检 exit 0 零冲突；落后 18＝第十一批验收
  世代）**：inbound 33 文件＝产线 v3 迁移切片 916c5e0（4 代码文件全
  产线域）＋桌面 U10 切片 6660d72（desktop 15＋contracts 4）＋越域
  追认 orchestrator-provider 2 文件（**核心所有权域**——追认程序闭
  环：本树上轮 ab2a816 域主核可表态＋集成合并信息留痕，正当在案）
  ＋collab 簿记。**crates/provider-host＋crates/orchestrator 两世代
  零 diff 实证**（diff f3cd123..HEAD 于追平前复核为空）——追平即满
  足上轮裁定的钉子前置：「build_job_command 在本树世代已发 v3」。
- **【重点】自决项办理＝provider-host 测试面钉子实质批（0167285，
  本树 slot/wt-2）**，兑现上轮裁定原文「候 68d72ad 入 main 后下一
  轮追平时自决补钉」：
  - **ScriptedBridge 加线命令捕获**（`commands:
    Mutex<Vec<UnityCommand>>`，execute 内 push clone）；既有
    record-face 构造点同步补字段，行为零变化。
  - **新钉子测试
    `job_execute_pins_the_production_command_wire_schema_version_v3`
    **：走完整 job.execute 链（save_and_resolve→approve_and_execute
    →wait_terminal，经 run_approved_plan_job→build_job_command→
    bridge.execute 真实组装路径），断言捕获的 ExecuteProductionJob
    命令 `schema_version == 3`。**刻意用字面量 3 而非引用
    `PRODUCTION_FACE_SCHEMA_VERSION` 常量**：钉子语义＝跨域锁定
    wire 数值——若引常量，产线改常量时本测试仍绿，钉不住；未来任
    一域动版本必须自觉更新这个消费侧测试，属设计意图非疏漏。
  - **两处生产面注释 v2→3 更正**（provider_host.rs 组装调用点
    ＋job_execute doc）——产线迁移后本域文件内的事实性漂移，纯文
    字零行为；ScriptedBridge doc「v2 receipt」字样保留（该测试
    bridge 确实回 schema_version: 2 收据，过渡窗口内如实描述）。
- **测试证据（本机 2026-09-13，本树 slot/wt-2）**：cargo test
  --workspace **588/0/27 EXIT=0**（＝587＋本批 1 新增，与集成验收
  复跑 587/0/27 计数自洽）＋cargo clippy --workspace --all-targets
  -D warnings **EXIT=0**＋registry-only **exit 0**（57 项一致＋
  1192 文件 0 冲突标记）。变更面 **2 文件全核心域**
  （crates/provider-host 的 src/provider_host.rs＋
  tests/warehouse_commands.rs）；零 schema/TS/其它 crate 触碰。
- **领任务链四环全查（本轮，追平后世代）**：①本树在途＝钉子实质批
  0167285＋本状态批，均候验收；②BOARD 核心行＝无新开放义务（#7 残
  余观察态维持；BG-6 限时 Spike 候 M8 开窗；[需用户] 项 W25/O-2、
  U5、B8/B9 跳过）；③outline 当前窗口（M5 W18–W26）核心行＝W20
  Recipe v0.3/Local Resolution/版本锁＋W22 完整 Build Record 均已交
  付验收在案，无新可领项；④M7 分解表核心行＝M7 检查链四件契约面全
  冻结＋检查切片经 7a262b8 验收闭环，无剩余核心行；M8 未开窗不预
  改。**无新可领项。**

**前情摘要（2026-09-06 起逐批全文见本文件 git 历史，a0a7e2e 版本）**
：上轮（5:0x–5:1x）：wt-4 接缝面结论域主核验（三件证据逐件独立复验
成立＋等价性前提 diff 实证＋build_restore_command 零调用点补充事实
）＋钉子自决裁定（候入 main 后办理）＋状态批（999b3d0 经 9f4cfcc
验收）。更早：五条【① 注意】消化＋追平 f3cd123（cbe9292/ab2a816
）；核心路由批（deafe11＋bbb6206＋373470c，a6585c2 验收）；v3 排期
留言交付（ef82763）；021 词表行七点裁决批（ad829a3）；requestRun
修订批（c914cf2）；U10 核心切片实现批（0cb0d05）；M7 检查切片实现
批（e3ce569 经 7a262b8）；overlay wire 批 1 冻结（713329f）；#22
兑现批（d02bd09＋020）。

## 本轮交付（20c07e4 基线）
- **追平合并 8597110**（落后 18 纪律追平，零冲突；核心 crate 零
  diff 实证，追认项程序闭环核验）。
- **钉子实质批 0167285**（2 文件全核心域：ScriptedBridge 线命令捕
  获＋wire schemaVersion==3 字面量钉子测试＋两处 v2→3 注释更正）
  ——自决项兑现，见当前焦点。
- **测试证据**：588/0/27 EXIT=0＋clippy 0＋registry-only exit 0
  （57 项＋1192 文件 0 标记）。
- **状态批（本批，仅本文件，collab-only 免全量）**。

## 阻塞
无。

## 下次合并意图
**钉子实质批 0167285（2 文件非 collab）＋本状态批（collab-only 免
全量）请集成随轮验收合并（--no-ff）。**集成复跑建议：cargo test
--workspace（本机 588/0/27 EXIT=0 在案，比验收复跑恰多 1＝本批新增
钉子测试）＋cargo clippy --workspace --all-targets -D warnings
（EXIT=0 在案）＋registry-only（exit 0 在案）；TS 域零涉免跑如实声
明。

## 待命声明（第 6 步，如实）
本轮（5:3x–5:4x，工作时段）：①三条【① 注意】留言消化（集成回执
＋自决项办理指令；桌面 U10 闭环知会；产线接缝结论维持采纳）；②追
平 20c07e4 世代（8597110，零冲突，核心 crate 零 diff 实证）；③自
决项兑现＝钉子实质批 0167285（wire schemaVersion==3 字面量钉子＋
ScriptedBridge 捕获＋注释更正）；④全量证据 588/0/27＋clippy 0＋
registry-only exit 0；⑤领任务链四环全查无新可领项。退出待命，候集
成验收、W25 用户开窗（O-2）或下轮 brief；在手无半途切片。

## 留言
- [→集成] **钉子实质批 0167285＋本状态批请随轮验收（--no-ff）**。
  实质批 2 文件全核心域（crates/provider-host）；复跑建议与证据见
  「下次合并意图」（588/0/27＝你方复跑 587＋本批 1 新增，计数自洽
  ）。该批系 wt-main 留言明示「候你下轮自决办理」项的兑现，前置（
  916c5e0 入 main）已满足。
- [→产线] **钉子兑现回执**：「生产命令 wire schemaVersion==3」测
  试钉已落地（job_execute 链真实组装路径断言，warehouse_commands.rs
  ）。一点设计说明：钉子用字面量 3 而非你的 `PRODUCTION_FACE_
  SCHEMA_VERSION` 常量——跨域锁定 wire 数值，你域未来动版本时本测
  试会红并强制核心侧自觉跟进，属预期行为非缺陷；你域 699 行常量自
  断言＋本钉子＝双面锁定。接缝「零强制变更面」结论维持采纳，核心生
  产面行为代码零变更（本批仅测试面＋注释文字）。
- （历史留言已消化归档：上轮接缝核验全文与五条消化见 git 历史
  999b3d0 版本——在途事项以 BOARD 与本状态文件当前焦点为准。）
