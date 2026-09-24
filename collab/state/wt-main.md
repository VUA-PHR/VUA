---
worktree: wt-main（本批簿记组装于 VUA-9 集成树，分支 integration/batch-194）
branch: integration/batch-194（本批载体；正典 main 维持 origin/main 只快进）
role: 集成
baseline_commit: 779359ed
updated: 2026-09-25
---
## 当前焦点
**集成第 194 批（2026-09-25 02:1x–02:4x，节拍轮夜间工作时段 date 02:10 实测
起；基线 origin/main 95690969＝第 193 批簿记续 PR #33 合并尖）＝单批验收
入库：wt-5 第 193 批（数据域自我反向审查批，先例第 148/180/191 批；一实锤
发现域内测试覆盖缺口即修＝词表锚测试 word_faces_equal_the_frozen_bdl_
v02_authority 原只对表可读权威 schema.sql、未钉可执行迁移链——products.
status 的 CHECK 只在 001_initial.sql 而 v0.2 restatement 注释化〔第 191 批
核心座实证同面〕、002 表重建改约束有先例，两权威任一漂移时锚仍绿而运行法
已动；修复＝三词面改从 MIGRATION_002 机械提取逐字对表＋productStatus 对
MIGRATION_001 status CHECK 逐字对表＝核心座第 191 批 optional pointer 裁
量项以测试强钉兑现；恰 1 文件 56+/3- 全在数据所有权域 crates/bdl-store/
tests，零 schema/词面变化）＋bdl-store 测试面变更→cargo 定向＋workspace
照章＋集成钉咬合突变验证＝扰动 002 dep_kind CHECK 恰红于 executable-chain
四值断言、扰动 001 status CHECK 恰红于 productStatus/001 断言、恢复即绿；
验收 PR #34 先行落地 779359ed，簿记随同分支续 PR 入库。CI 三 workflow
attempt 1 全绿零瞬败。**

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 193 批（09-25 01:2x–01:5x）＝wt-4 第 192 批（产线域自我反向审查批）单批
验收入库，经 integration/batch-193 PR #32（验收）＋PR #33（簿记续）入库，
正典 main 至 95690969。更早段落见本文件 git 历史与 BOARD 前录。

## 本轮交付（95690969 基线，integration/batch-194）
- **验收合并＝wt-5 第 193 批两笔**（实现批 29c84497＋状态批 5a115529；
  merge-base 72b4c6a6＝wt-5 自记基线，落后 7＝第 193 批两 PR 落 main 笔数
  与分叉表吻合〔wt-5 轮首 ff-only 76e295c7→72b4c6a6 纯快进无追平壳〕；
  merge-tree --write-tree 预检 exit 0 零冲突；合并 c3d5538c 合并信息全载）：
  ①**改动面逐笔核对**——非 collab 面恰 1 文件 56+/3- 全在数据所有权域
  crates/bdl-store/tests/dependencies_queries_v05.rs（word_faces 测试体双
  权威对表扩展＋文件头审查范围声明更新；既有测试体扩展非新增用例，numstat
  实核；docs/ schemas/ packages/ apps/ .github/ 对基线零 diff 实核＝冻结
  面零字节触碰、零 schema/词面变化）；状态批恰 collab/state/wt-5.md。
  ②**双权威钉真实性成立（派单重点①）**——测试常量 MIGRATION_001/002 与
  生产 bdl_store.rs:48-49 include_str 同两文件、open 路径 execute_batch 恰
  执行之（fresh 库 001→002 单事务 :954-955＋v0.1 升级臂 002 :967 实读）＝
  「对可执行链非仅注释文件」实证；sql_check_lists 机械扫 CHECK IN 列表非
  注释行；wt-5 修复前三 SQL 权威逐字一致复验在案＝覆盖硬化非行为修复。
  ③**钉咬合突变验证成立（集成合并树亲测，派单重点加强实证）**——扰动 002
  dep_kind CHECK（'shader'→'shaderX'）定向跑恰红于 641 行「dep_kind enum
  must equal the executable chain's four-value set」（另两测试同红＝DB 打
  开即执行 002、CHECK 本体拒种子行，002 系运行库真实执行面反证加强）；扰
  动 001 status CHECK（'complete'→'completX'）恰红于「productStatus enum
  must equal the executable status CHECK (001 chain)」；两突变均 checkout
  恢复即定向复绿 8/8、工作树 status 净（突变系验收注入非生产漂移实录，冻
  结面零提交零外推）。
  ④**四族审查结论抽查采信（派单重点②）**——族①五负例向量文件在案
  （fuzzy 词外键/空 name/词外 depKind/includeUnconfirmed/v0.4 重放）＋
  executor installSource 精确相等断言三形态注释齐（:489/:528-530）；族②
  030 §1 样例 3 错链 confirmed:false 线索面三点同构抽查符，措辞宽松
  （booth.pm 主机未展开子域包含）维持 wt-5 登记态不折入；族④排序依赖
  git log 实锤 88e6a772（04:44:31）先于 cb40bf1d（05:53:20）恰 69 分钟＋
  executor 空库诚实空集钉在案（030 第 176 批表态兑现抽查符）。
  ⑤**992/0 读数自洽（派单重点③）**——cargo test --workspace **992/0**
  （112 套件行，28 ignored）＝main 基线 992（990＋第 193 批 2）＋恰零新例
  （既有测试体扩展）自洽；clippy --workspace --all-targets **0/0**；TS 侧
  零触碰免跑照纪律（apps/ packages/ 对 main 零 diff 为凭）。
  ⑥**BOARD 各行判定**——#43/#46/030 相关行本批无涉零改动（词表锚硬化系
  既有钉权威面扩展非新家族登记非行为修复）；W25 节本批无涉零改动（测试批
  零真机宣称）；前录插 194 段轮出实际最老段＝第 184 批段（10 段维持）＋推
  送记录节 194 条＋本状态批。
- **origin 推送记录节登记**：验收 PR #34 与三 CI run 号随本簿记批入库
  （attempt 1 全绿零瞬败）；上批（第 193 批）簿记续 PR #33 run 号已在该批
  簿记补笔在案，本批无顺手欠账。

## 门禁读数（如实）
合并树集成亲测全绿（2026-09-25 02:2x–02:3x，VUA-9 顺序跑未并行）：
cargo test -p vua-bdl-store --test dependencies_queries_v05 定向 **8/8**
（0.03s）；cargo test --workspace **992/0**（112 套件行、28 ignored；全量
三轮零瞬败）；clippy --workspace --all-targets **0 警告 0 错误**；TS 侧零
触碰免跑（apps/ packages/ 对 main 零 diff 为凭）。突变验证两轮均恰对位红
（见本轮交付③）、恢复即绿。远端 CI 判定随 PR #34 检查页（check 36040790533
✓ 3m6s／test-and-clippy 36040790702 ✓ 5m48s attempt 1 全绿零瞬败／vectors
36040790968 ✓ 3m57s）。

## 在途/待他角色
- **[候用户] W25 真机走查推进（O-2，进行中）**——M5 唯一候项；既有 [需用户]
  三件维持＝挂死再发取证协作（保持现场＋CDP 51993 取栈）、误伤事故 95MB 重复
  入库条目清理候裁、④多层目录扫描候裁决与派发。等用户项无绕行机制。本批零
  行为面变化（测试覆盖硬化），交付栈未动，真机走查可继续。
- **[维持登记] import-copy 收据不载 productName 候词面升版提案**——wt-6 状
  态批自录残余，维持登记态不折入本批、不扩行为半径。
- **[维持登记·已路由核心/wt-2] 测试侧时序/环境敏感族**——既有登记维持
  （:195 helper DatabaseBusy 两晚同位＋production_host 数例＋process.rs 两
  例＋ph_011/ph_010），第 193 批已以 [→核心/wt-2] 留言显式路由核心席候顺手
  硬化评估；本批全量三轮零瞬败，族读数无新增。
- **[知会核心/wt-2] 注释指涉测试名词面勘误候办（维持）**——第 180 批新注释
  指涉测试名与实际新钉名不符（第 191 批⑤在案），1 行词面订正候 wt-2 下批
  状态批顺手，语义零影响不改写代码。
- **[维持登记] installSource「booth.pm 主机」措辞未展开子域包含**（wt-5 登
  记，协议本 ZH/EN 同）——executor/测试钉了包含子域的精确解释，无行为分歧
  ；若未来协议升版顺带补一句，本批不折入（协议升版本构成勘误事由）。
- VUA-7：零触碰维持，阅读解禁；VUA-8 零触碰维持。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
簿记批随 integration/batch-194 → main 续 PR 落地（PROTECTED_MAIN §4
collab-only 照章）；合并后正典 main fetch＋快进核对，集成分支不删。

## 待命声明（第 6 步，如实）
本轮（2026-09-25 02:10 夜间正常工作时段 date 实测起）：①读
collab/PROTECTED_MAIN.md 后跑 pnpm collab:brief，①区判读＝wt-5 验收请求在
操作者第 194 批派单范围内（wt-2/wt-3 请求已随第 191/192 批闭环、wt-4 请求
已随第 193 批闭环），wt-7/wt-8 留言系知会非阻塞，失鲜工作树无；②origin/
main 95690969 与本地一致零分叉；slot/wt-5 merge-base 实测 72b4c6a6（落后 7
领先 2，与分叉表吻合）；③VUA-9 自 origin/main 建 integration/batch-194，
merge-tree 预检 exit 0 干净后 --no-ff 合并（c3d5538c）；④diff 逐行实读（实
现批恰 1 文件 56+/3- numstat 实核＋双权威常量与生产 include_str 同源实读＋
open 路径 execute_batch 实锤＋sql_check_lists 提取函数实读＋状态批 brief 全
文实读）；⑤四族结论抽查（五负例文件/executor installSource 三形态/排序时
序 git log 实测 69 分钟/空库诚实空集钉）＋⑥钉咬合突变验证（002 dep_kind 扰
动恰红 executable-chain 断言＋001 status 扰动恰红 productStatus 断言＋恢复
即绿 8/8＋工作树净）；⑦门禁合并树亲测：定向 8/8＋cargo test --workspace
992/0（三轮零瞬败）＋clippy 0/0，TS 零触碰免跑；⑧推送首试即成、PR #34 三
workflow attempt 1 全绿零瞬败、合并 779359ed、正典 main ff-only 快进核对在
案（95690969→779359ed；主树两既有未跟踪件未阻碍）；⑨零自有产品代码（本批
集成自有内容＝合并信息＋collab 簿记；突变扰动系临时工作树注入、立即恢复、
零提交）；产品版本不动、不代跑 W25、历史记录零删除；正典 main 零直改；用户
交付栈未触、未杀 node/electron；VUA-7 零触碰（阅读解禁）、VUA-8 零触碰；主
树 `?? _local_p27_devlog.txt`＋`?? collab/.window-lock` 照例不触碰；[需用户]
条目零代决（W25 三件维持候用户）。在手无半途切片、除本状态批与 BOARD 簿记
外无未提交改动。

## 留言
- [→数据/wt-5]（验收回执）：第 193 批两笔（29c84497 实现批＋5a115529 状态
  批）已随集成第 194 批验收入库（合并 c3d5538c，PR #34，main 尖 779359ed）
  。验收重点逐项成立——①双权威钉真实性（MIGRATION_001/002 与生产
  include_str 同源＋open 路径 execute_batch 实锤＋sql_check_lists 机械提
  取；集成合并树突变验证加强＝扰动 002 dep_kind CHECK 恰红 executable-
  chain 四值断言、扰动 001 status CHECK 恰红 productStatus/001 断言，恢复
  即绿 8/8——两钉均实证咬合可执行链非注释文件）；②productStatus/001 对
  表系核心座裁量项兑现非越权（测试文件系你席第 168 批落地、域内成立）；
  ③零 schema/词面变化（唯一 diff 系测试文件，docs/ schemas/ packages/
  apps/ .github/ 对基线零 diff 实核）；④四族结论抽查采信（五负例/
  installSource 三形态/排序 69 分钟时序实锤/空库诚实空集钉）；⑤992/0 自
  洽（main 基线 992＋恰零新例）＋clippy 0/0（合并树亲测，三轮零瞬败）。
  installSource 措辞宽松维持你席登记态；[→核心/wt-2] 裁量项兑现回执你席
  留言已随本批在 main 在案。诚实边界维持：测试批零端到端宣称，真机随 W25。
- （回执不回执：wt-2/wt-3/wt-4 验收请求经分叉表复证均已闭环零待办；wt-7/
  wt-8 留言系知会；在途事项以 BOARD 与本状态文件当前焦点为准。）
