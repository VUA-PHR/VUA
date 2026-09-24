---
worktree: wt-main（本批簿记组装于 VUA-9 集成树，分支 integration/batch-195）
branch: integration/batch-195（本批载体；正典 main 维持 origin/main 只快进）
role: 集成
baseline_commit: 847b3a17
updated: 2026-09-25
---
## 当前焦点
**集成第 195 批（2026-09-25 02:4x–03:2x，节拍轮夜间工作时段 date 02:46 实测
起；基线 origin/main 068d503f＝第 194 批簿记续 PR #35 合并尖）＝单栈验收
入库：wt-6 第 160 批（环境域自我反向审查＋半写面原子写修复批，先例第
148/191 批审查法）：①启停状态文件写侧原子化＝write_disabled_set 裸
fs::write 截断写→同目录 `.tmp`＋sync_all＋fs::rename 原位替换（ORC-STO-003
state_file.rs 家法；刻意不取 material_identity 先 remove 后 rename 变体——
两步间崩溃制造「文件缺席」而本文件词面「缺席＝全部启用」会静默丢禁用集）
＋新钉 f4_state_write_leaves_no_temp_residue_and_replaces_in_place＋
collection_world 文档枚举校准（补列 resolve_project，零行为）；②
resolve_project 失败集 HashMap 随进程盐序发现登记（候裁决未实现——操作者
裁决随本批落账采纳，已路由环境座下批实现）。恰 2+1 文件全在环境所有权域
crates/project-manager＋collab/state/wt-6.md。集成突变验证＝临时还原裸
fs::write→新钉恰红 :2881 残留断言、恢复即绿。**新增登记事实**：main push
779359ed 的 rust workflow run 36041776560 一例具名瞬败（ph_004，
production_host.rs:163:48，与第 193 批 ph_010 同位同 helper）——本批主动
扫 main push run 链发现补登记，同内容两轮 PR 检查均绿，[→核心/wt-2] 族读
数随批加重。验收 PR #36 先行落地 847b3a17，簿记随同分支续 PR 入库。CI 三
workflow attempt 1 全绿零瞬败。**

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 194 批（09-25 02:1x–02:4x）＝wt-5 第 193 批（数据域自我反向审查批）单
批验收入库，经 integration/batch-194 PR #34（验收）＋PR #35（簿记续）入
库，正典 main 至 068d503f。更早段落见本文件 git 历史与 BOARD 前录。

## 本轮交付（068d503f 基线，integration/batch-195）
- **验收合并＝wt-6 第 160 批两笔**（实现批 1dc5a055＋状态批 a5fcd562；
  合并取 slot/wt-6 本地尖 c8d155d8——该尖含两笔纯吸收合并 06af700a〔吸收
  PR #34 落 main 四笔〕＋c8d155d8〔吸收 PR #35 簿记续两笔〕，提交信息自载
  零文件交集、纯吸收；轮首 brief 分叉表读 06af700a 后 wt-6 座又落
  c8d155d8，合并时实测该尖全含 origin/main 068d503f＝落后 0；两吸收壳内
  容系 main 已有提交的合并线，非新实质内容）；merge-tree --write-tree 预
  检 exit 0 零冲突；合并 e8682d85 合并信息全载。
  ①**改动面逐笔核对**——实现批恰 2 文件 92+/3- 全在环境所有权域
  crates/project-manager（src/vpm_backend.rs 26+/3-＝write_disabled_set
  原子替换＋函数头注释块＋collection_world 文档枚举校准；tests/
  vpm_backend.rs 66+/0- 纯新增一钉，既有断言零放松）＋状态批恰
  collab/state/wt-6.md 122+/114-；docs/ schemas/ packages/ apps/ .github/
  对基线零 diff 实核＝冻结面零字节触碰、零词面/契约/wire 变化。
  ②**原子替换变体取舍论证核实成立（派单重点①）**——读侧
  load_disabled_set :721-724 实读：NotFound→Ok(空集)＝「缺席＝全部启用」
  词面实锤、其余读败/解析败/schema 版本不符＝Err 拒绝不猜测；家法
  state_file.rs:148-163 save 同目录 .tmp＋rename 直替换（:218 残留不存断
  言在案）；material_identity.rs:124-129 sync_all＋先 remove_file 后
  rename 变体在案＝新写侧取「直接 rename＋sync_all」精确混合形态，函数头
  注释自述「state_file.rs save 同律；material_identity.rs 同加 sync_all」
  与两处实况逐字相符；remove+rename 排斥论证成立（两步间崩溃→NotFound→
  禁用集被「全启用」词面静默吞掉；直接 rename 下崩溃只落旧完整档或新完
  整档）；with_extension("tmp") 同目录同卷＝Windows
  MOVEFILE_REPLACE_EXISTING 确定性替换前提在案。
  ③**新钉「写方可观测契约」性质采信（派单重点②）**——
  f4_state_write_leaves_no_temp_residue_and_replaces_in_place 三断言面
  （死进程残留 .tmp 不碍切换且被消费＋二次 toggle 走 rename-replace 原位
  内容精确＋成功后 .vua 目录恰一份状态档零残渣，read_dir 全列排序断言）；
  断电原子性本身单元测试不可安排、钉的是写方可观测契约＝诚实边界如实标
  注（测试 doc 与提交信息两处在案），采信不折算为「断电已验」。
  ④**钉咬合突变验证成立（集成合并树亲测，派单重点加强实证）**——临时还
  原 write_disabled_set 为裸 fs::write（旧截断写形态）定向跑＝恰红于
  tests/vpm_backend.rs:2881「the atomic write consumes its .tmp sibling —
  no residue」；git checkout 恢复后定向复绿、工作树 status 实核净（突变
  系验收注入非生产漂移实录，零提交零外推）。
  ⑤**失败集发现加重关系实锤（派单重点③）**——锁定库源实读：Cargo.lock
  vrc-get-vpm **0.0.16**；~/.cargo/registry 源 package_resolution.rs
  :403-405 `MissingDependencies.dependencies: HashMap<Box<str>,
  VersionRange>`＋:428-430 `into_vec()`＝`into_iter().collect()`＝std
  HashMap 每进程 RandomState 盐——第 190 批登记「库内 map 顺序不确定」实
  核升级为「同工程＋同环境两次运行点名 id 即漂移」（wt-6 判断逐字证实）；
  vpm_backend.rs:2159-2170 失败臂 into_iter 逐依赖入列未排序 vs :2199
  resolved 显式 sort_by id 同律先例在案；全库 grep 唯一顺序消费者＝
  material_exec.rs:670 `receipt.failed.first()`；reason_code 全条目同一常
  量 no_matching_package、非空 failed 集恒定令供给失败照常回滚＝结局零漂
  移。wt-6 审查面①全部采信（含「失败证据可复现性缺陷而非诚实纪律第 2 条
  违例」的归类）。
  ⑥**操作者裁决随批落账**——resolve_project DependenciesNotFound 臂
  failed 收集后按 id 排序＋多依赖测试钉**采纳**（失败证据可复现属诚实纪
  律；receipt 内容不变仅序确定；素材链 first() 随之确定；unity-bridge 零
  触碰）；已路由环境座下批域内实现（[→环境/wt-6] 随本簿记留言节）。
  ⑦**审查面②④抽查符**——collection_world 六装载点六归属实核
  （:1164/:1510/:1680/:1925/:2075/:2309；状态批自载行号系 95690969 世
  代、与本合并树差恰本批自身 +23 行偏移，如实注记）＋PackageCollection::
  load/load_cache 全仓 17 处全吃过滤克隆；material_intake.rs:512-521
  Packages/ 检查面预检闸在场（第 150 批通道边界预检），两物化消费点闸门
  归 W25 真机面不动。
  ⑧**main push run 链扫描新事实（本批主动发现，如实补登记）**——第 194
  批验收合并尖 779359ed 的 main push rust run **36041776560 attempt 1 失
  败**＝ph_004_cancel_request_reaches_the_running_worker_token panicked
  于 crates/provider-host/tests/production_host.rs:163:48（parse_frames
  helper 的 serde_json::from_str unwrap 行，与第 193 批登记 ph_010 同位同
  helper）；同内容两轮 PR 检查均绿（PR #34 check 36040790702 ✓ 5m48s＋
  PR #35 check 36042475571 ✓ 5m52s）＋本合并树 993/0 两轮绿＋零代码改动；
  归因既有测试侧时序/环境敏感族（#7 判例路径），族登记新增具名成员
  ph_004，[→核心/wt-2] helper 收敛硬化候选读数随批加重；该 run 系
  main push 触发非 PR 检查、未阻塞任何合并程序，第 194 批簿记只核 PR 检
  查页未及此处——本批起集成簿记将 main push run 链纳入扫描面。
  ⑨**BOARD 各行判定**——#43/#46/030 相关行本批无涉零改动（原子写系域内
  修复非新家族成员）；W25 节本批无涉零改动（测试批零真机宣称）；前录插
  195 段轮出实际最老段＝第 185 批段（10 段维持）＋推送记录节 195 条（顺
  手项＝上批簿记续 PR #35 三 run 号补齐）＋本状态批。
- **origin 推送记录节登记**：验收 PR #36 与三 CI run 号随本簿记批入库
  （attempt 1 全绿零瞬败）；PR #35 run 号本批顺手补记，自此无欠账。

## 门禁读数（如实）
合并树集成亲测全绿（2026-09-25 03:0x–03:1x，VUA-9 顺序跑未并行）：
cargo test -p vua-project-manager 全 crate 绿（vpm_backend 套件 **81/0**
含新钉 0.03s）；cargo test --workspace **993/0**（112 套件行；main 基线
992＋恰本批 1 新例自洽；两轮全量零瞬败）；clippy --workspace --all-targets
**0 警告 0 错误**；TS 侧零触碰免跑（apps/ packages/ 对基线零 diff 为
凭）。突变验证见本轮交付④（恰红 :2881→恢复即绿）。远端 CI 判定随 PR #36
检查页（check 36045328022 ✓ 3m6s／test-and-clippy 36045327940 ✓ 5m24s／
vectors 36045328063 ✓ 3m17s，attempt 1 全绿零瞬败）；main push 779359ed
一例 ph_004 具名瞬败见本轮交付⑧（如实登记，同内容两轮 PR 检查绿）；
847b3a17 main push run 终态核对＝rust **36046012132** attempt 1 ✓＋
schema-vectors **36046012254** attempt 1 ✓（全绿）。

## 在途/待他角色
- **[已路由环境/wt-6] resolve_project 失败集排序最小修**（操作者裁决采
  纳）：failed 收集后 sort_by id（与 resolved :2199 同律同位）＋多依赖不
  可解测试钉；receipt 词面/形状零变化、素材链 material_exec 零触碰；候
  wt-6 下批域内实现随轮验收。
- **[候用户] W25 真机走查推进（O-2，进行中）**——M5 唯一候项；既有
  [需用户] 三件维持＝挂死再发取证协作（保持现场＋CDP 51993 取栈）、误伤
  事故 95MB 重复入库条目清理候裁、④多层目录扫描候裁决与派发。等用户项无
  绕行机制。本批原子写系代码面＋合成 fixture 测试事实，真机行为归 W25 候
  办（vpm-repo-state.json 供给链真机走查随 W25 O-2）。
- **[维持登记·已路由核心/wt-2] 测试侧时序/环境敏感族**——既有登记维持并
  随本批加重：新具名成员 **ph_004**（production_host.rs:163:48，与第 193
  批 ph_010 同 helper 同位）＋既有（:195 helper DatabaseBusy 两晚同位＋
  production_host 数例＋process.rs 两例＋ph_011/ph_010）；main push 证
  据链见本轮交付⑧；helper 收敛硬化候选候核心席评估。
- **[知会核心/wt-2] 注释指涉测试名词面勘误候办（维持）**——第 180 批新注
  释指涉测试名与实际新钉名不符（第 191 批⑤在案），1 行词面订正候 wt-2
  下批状态批顺手，语义零影响不改写代码。
- **[维持登记] import-copy 收据不载 productName 候词面升版提案**——维持
  登记态不折入本批、不扩行为半径。
- **[维持登记] installSource「booth.pm 主机」措辞未展开子域包含**（wt-5
  登记，协议本 ZH/EN 同）——维持登记态，协议升版本构成勘误事由。
- VUA-7：零触碰维持，阅读解禁；VUA-8 零触碰维持。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
簿记批随 integration/batch-195 → main 续 PR 落地（PROTECTED_MAIN §4
collab-only 照章）；合并后正典 main fetch＋快进核对，集成分支不删。

## 待命声明（第 6 步，如实）
本轮（2026-09-25 02:46 夜间正常工作时段 date 实测起）：①读
collab/PROTECTED_MAIN.md 后跑 pnpm collab:brief，①区判读＝wt-6 验收请求
在操作者第 195 批派单范围内（wt-2/wt-3/wt-4/wt-5 请求经分叉表复证均已闭
环零待办、wt-7/wt-8 留言系知会非阻塞），失鲜工作树无；slot/wt-6 本地尖
c8d155d8 系轮首 brief 后新落的纯吸收合并（提交信息自载），VUA-6 工作树
零触碰只读提交引用；②origin/main 068d503f 与本地一致零分叉；③VUA-9 自
origin/main 建 integration/batch-195，merge-tree 预检 exit 0 干净后
--no-ff 合并（e8682d85）；④diff 逐笔逐行实读（实现批恰 2 文件 numstat
实核＋load_disabled_set/state_file.rs/material_identity.rs 三点变体论证
实读＋新钉三断言面读读＋失败臂与 resolved 排序先例对照＋锁定库源
package_resolution.rs:403-405/:428-430 实锤＋material_exec.rs:670 唯一
消费者全库 grep＋六装载点行号抽查全中）；⑤集成突变验证（裸 fs::write
还原→新钉恰红 :2881→恢复即绿→工作树净）；⑥门禁合并树亲测：project-
manager 全 crate 绿＋workspace 两轮 993/0＋clippy 0/0，TS 零触碰免跑；
⑦main push run 链主动扫描＝779359ed rust run 36041776560 ph_004 具名瞬
败发现并归因登记（同内容 PR 检查两轮绿＋合并树两轮绿＋零代码改动），
847b3a17 main push run 推送前终态核对；⑧推送首试即成、PR #36 三
workflow attempt 1 全绿零瞬败、合并 847b3a17、正典 main ff-only 快进核
对在案（068d503f→847b3a17；主树两既有未跟踪件未阻碍）；⑨零自有产品代
码（本批集成自有内容＝合并信息＋collab 簿记；突变扰动系临时工作树注入、
立即恢复、零提交）；产品版本不动、不代跑 W25、历史记录零删除；正典
main 零直改；用户交付栈未触、未杀 node/electron；VUA-7 零触碰（阅读解
禁）、VUA-8 零触碰；主树 `?? _local_p27_devlog.txt`＋
`?? collab/.window-lock` 照例不触碰；[需用户] 条目零代决（W25 三件维持
候用户；失败集裁决系操作者权限随批落账，本席只路由不代裁）。在手无半途
切片、除本状态批与 BOARD 簿记外无未提交改动。

## 留言
- [→环境/wt-6]（验收回执＋裁决路由）：第 160 批两笔（1dc5a055 实现批＋
  a5fcd562 状态批）已随集成第 195 批验收入库（合并 e8682d85，PR #36，
  main 尖 847b3a17）。验收重点逐项成立——①原子替换变体取舍论证核实成立
  （缺席＝全启用词面 :723 实锤＋state_file.rs:148 家法＋
  material_identity.rs:124-129 变体在案，新写侧「直接 rename＋sync_all」
  注释自述与实况逐字相符）；②新钉写方可观测契约性质采信＋集成突变验证
  加强（裸 fs::write 还原→恰红 :2881 残留断言→恢复即绿——断电原子性不
  可单测的诚实边界如实维持）；③失败集加重关系实锤（锁定库源
  package_resolution.rs:403-405 HashMap＋:428-430 into_vec 每进程盐、唯
  一顺序消费者 material_exec.rs:670、resolved :2199 同律先例——你席对
  190 批登记的升级判断逐字证实）；④993/0 自洽（992＋恰 1）＋clippy 0/0
  （合并树亲测两轮零瞬败）。**操作者裁决路由（随批落账）**：
  DependenciesNotFound 臂 failed 收集后按 id 排序＋多依赖不可解测试钉采
  纳，候你席下批域内实现——sort_by id 与 resolved 同律同位、receipt 词
  面/形状零变化、素材链 material_exec 零触碰、失败证据可复现属诚实纪律。
  诚实边界维持：原子写系代码面＋合成 fixture 测试事实，真机随 W25（O-2）。
- [→核心/wt-2]（知会·族读数随批加重）：main push 779359ed rust run
  36041776560 attempt 1 具名瞬败＝ph_004_cancel_request_reaches_the_
  running_worker_token（production_host.rs:163:48 parse_frames helper，
  与第 193 批 ph_010 同位同 helper）；同内容 PR #34/#35 检查两轮绿＋集成
  合并树 993/0 两轮绿＋零代码改动，#7 判例归因既有族；族登记新增 ph_004，
  helper 收敛硬化候选读数 +1，候你席顺手硬化评估。
- （回执不回执：wt-2/wt-3/wt-4/wt-5 验收请求经分叉表复证均已闭环零待办；
  wt-7/wt-8 留言系知会；在途事项以 BOARD 与本状态文件当前焦点为准。）
