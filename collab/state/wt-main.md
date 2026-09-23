---
worktree: wt-main（本批簿记组装于 VUA-9 集成树，分支 integration/batch-187）
branch: integration/batch-187（本批载体；正典 main 维持 origin/main 只快进）
role: 集成
baseline_commit: 6525c818
updated: 2026-09-24
---
## 当前焦点
**集成第 187 批（2026-09-24 06:5x 起，节拍轮正常工作时段 date 06:56 实测；基线
origin/main 6525c818＝第 186 批续 PR #19 合并尖）＝单批验收入库：wt-5 第 180 批
（数据域自我反向审查批，先例第 148 批：五发现域内小修＋测试钉死＝#43 族路径
逃逸一＋诚实纪律捏造时间戳一＋下载事件闸洞 panic 类一＋BG-12 族 store 读面两
成员＋BG-12 律对齐 Done 载荷三处；恰 5+1 文件全在数据所有权域 crates/bdl-store
＋crates/acquisition＋collab/state/wt-5.md）＋合并树 Rust 侧全闸集成亲测全绿
（本批纯 crates/ 变更；TS 侧零触碰按第 186 批读数引记不重复全量，取舍如实
登记）**。全部走 PROTECTED_MAIN 政策通道（验收 PR #20 先行落地 ec84ec34、正典
main 只快进；簿记随同分支续 PR 入库）。CI test-and-clippy 首跑一红
（SQLITE_BUSY 测试侧瞬败）attempt 2 复跑绿按 #7 判例零代码改动照章登记。轻负载
拍纪律兑现：用户交付栈（vite 5173＋electron CDP 51993）全程未触，门禁在 VUA-9
树内顺序跑未并行。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 186 批（09-24 06:1x–06:4x）＝wt-2 第 178 批（核心域自我反向审查批）单批验收
入库＋BOARD #43 行注记评估＋三件留痕勘误登记，经 integration/batch-186 PR #18
（验收）＋PR #19（簿记续）入库，正典 main 至 6525c818。更早段落见本文件 git
历史与 BOARD 前录。

## 本轮交付（6525c818 基线，integration/batch-187）
- **验收合并＝wt-5 第 180 批三笔**（实现批 5533298b＋追平壳 8e668e4f＋状态批
  76e295c7；merge-base 实况 d0da0abe＝轮首追平 7a05be5d＋轮中吸收第 186 批，
  落后 0／领先 3（实质 2）；merge-tree --write-tree 预检 exit 0 零冲突；合并
  5bf29ad6 合并信息九点全载，集成直读实核；**追平壳纯吸收集成实核**——其树
  8bfc7bbe 与两亲自动合并结果逐字节一致（diff 空）＝零手工裁决内容，对 main
  侧 diff 恰为分支自有 5 代码文件）：
  ①**改动面逐笔核对**——实现批恰 5 文件全在数据所有权域（numstat 分支自有面
  523+/137-：bdl_store.rs 147+／download_events.rs 117+／
  warehouse_download_adopt.rs 68+／warehouse_maintenance.rs 52+／
  warehouse_import.rs 7+）；状态批恰 1 文件；docs/ schemas/ packages/ apps/
  .github/ 零 diff（实核为空）；下载事件冻结 schema 零字节触碰。
  ②**发现一（#43 族数据域新成员）成立**——`adoptable_file_component` 末段分
  量守卫（`\`/`/` 归一、空/`.`/`..` 不可用回退暂存名分量、verbatim 建议名留
  事件面作展示元数据，与 TS 端口暂存命名纪律同律）；生产区 join 点全查唯一
  且 file_name 已守卫；合法名行为逐字符等价＝守卫只收紧不放宽；测试钉
  `..\..\evil.zip` 落条目内＋逃逸目标不存在＋relative_path 携守卫后分量。
  ③**发现二（诚实纪律违例）成立**——`now_rfc3339()` 常量助手删除（写死
  "2026-09-06T00:00:00.000Z"）、generate_vpm 两写点单一 SystemClock 真实读数
  双写；零签名变化；测试断言「非退场常量×2＋created_at≥跑前读数」语义合理
  （定宽 UTC 字典序＝时序）。
  ④**发现三（per-kind 律入闸＋panic 类消灭）成立**——completed 冻结律
  （storedPath＋receivedBytes required）入 check_sequence（违律永不及事实日志）
  ＋fold_lifecycle（存量腐败折叠类型化错误）双闸＋staging_completion 两 expect
  改防御性 CorruptValue；拒绝码走既有 IllegalSequence 族、reason 如实指认
  schema 律＝只执行既有冻结律零新造词面；trim 空串视同缺席系 required 词面
  诚实执行；三测试钉含合法 completion 照常落库＝成功路径钉死。
  ⑤**发现四（BG-12 族 store 读面两成员＋member C）成立**——`effective_mode`
  改 Result 传播 CorruptValue（CHECK 仍存储层主律、读面防御层）＋两处
  enum-validated expect 消灭＋catalog_status `.parse().ok()` 改 map_err
  CorruptValue（与同文件写面同律）；公开面签名零变化；测试 PRAGMA
  ignore_check_constraints 诚实模拟非 SQL 存储漂移做注入。
  ⑥**发现五（BG-12 律对齐 Done 载荷）成立**——三处 `unwrap_or(Value::Null)`
  改 adopt 文件既有律（不变量注释＋expect）；成功路径逐键核对零变化。
  ⑦**测试钉死核实（恰 6 新测试函数；既有断言零放松）**全数点名在案（BOARD
  前录 187 段⑦）。
- **CI 瞬败一例如实登记（不阻塞验收，#7 判例）**——test-and-clippy run
  35931927077 attempt 1 红＝dependencies_queries_wire_v05.rs:195
  `absent_port_answers_the_family_honest_absence` panic SQLITE_BUSY database
  is locked；归因＝测试 helper temp 目录命名仅 pid＋纳秒无进程内 serial（#7
  已修复 acquisition unique_dir 同族候选；provider-host 本批零触碰、该钉系上批
  在案）；本机合并树 985/0 两轮全绿；attempt 2 复跑全绿（6m03s）零代码改动零
  猜测性修复。[知会核心/wt-2] provider-host 测试 helper 命名收敛候硬化登记
  （登记性质不扩行为半径）。
- **BOARD 维护**——前录轮转（插 187 段轮出实际最老段＝第 170/171/172 批段，
  10 段维持）＋推送记录节 187 条登记＋本状态批。**顺手项两项兑现**：①上批
  （第 186 批）簿记续 PR #19 三 run 号补齐推送记录节（check 35929479959／
  test-and-clippy 35929479875／vectors 35929479857 全绿，合并 2026-09-23T22:48Z
  在案）；②wt-5 状态批 [候硬化登记] interrupted/failed per-kind 律经核系登记
  性质（wt-5 明载本批不修——修之扩大 ingest 行为半径超出缺陷半径），集成确认
  维持登记态不折入本批、不扩行为变化半径。
- **origin 推送记录节登记**：验收 PR #20 与三 CI run 号（含瞬败复跑留痕）随
  本簿记批入库；簿记续 PR 号与 run 号候下批顺手补齐留痕。

## 门禁读数（如实）
合并树 Rust 侧全闸集成亲测全绿（07:0x–07:1x 顺序跑未并行；本批纯 crates/ 变
更）：cargo test --workspace **985/0**（main 基线 979＝第 186 批后读数＋恰
wt-5 六新例，数字自洽；ignored 28 维持；112 套件 fail-fast 跑穿 doc-tests）＋
cargo clippy --workspace --all-targets **0 警告 0 错误**（exit 0 复核）。
**TS 侧零触碰**（apps/ packages/ 对 origin/main diff 0 行实核）按派单引记第
186 批合并树读数（typecheck 双 tsconfig exit 0＋vitest 97 文件 913/913＋
check:i18n OK＋check:leak 155 指纹零泄漏＋build exit 0），不重复全量 TS——
取舍如实登记。远端 CI 判定随 PR 检查页（PR #20：check 35931927075 ✓ 4m03s／
test-and-clippy 35931927077 ✗→✓ attempt 2 6m03s／vectors 35931927076 ✓ 4m02s）。

## 在途/待他角色
- **[候用户] W25 真机走查推进（O-2，进行中）**——M5 唯一候项；既有 [需用户]
  三件维持＝挂死再发取证协作（保持现场＋CDP 51993 取栈）、误伤事故 95MB 重复
  入库条目清理候裁、④多层目录扫描候裁决与派发。等用户项无绕行机制。本批
  wt-5 五发现系代码审查所得非用户走查新发现；交付栈未动，真机走查可继续。
- **[知会核心/wt-2] provider-host 测试 helper 命名收敛候硬化登记**——
  dependencies_queries_wire_v05 等测试 temp 目录命名仅 pid＋纳秒无进程内
  serial，同 tick 同进程碰撞候选（本拍 CI 瞬败形态＝SQLITE_BUSY；#7 acquisition
  unique_dir 修复同族）。登记性质候核心域下批顺手，非本批改动面、不扩行为
  半径。
- **[候硬化登记·维持] wt-5 interrupted/failed per-kind 律**——schema 要求
  interrupted 携 storedPath、failed 携 failureKind 未入 Rust 闸；wt-5 状态批
  自录候硬化（明载修之扩 ingest 行为半径超出缺陷半径候后续顺带）；集成确认
  维持登记态。
- **[知会 wt-2] 注释批号勘误候订正（上批遗留，维持）**——代码注释三处
  「batch 181」应系「batch 178」，候下批状态批顺手订正，不阻塞任何面。
- **[知会 wt-3] 词面查表键形一处既有观察（上批遗留，维持）**——
  acquire-model.ts:138 查表键形与词表键形不命中落 fallback，系 main 既有词面
  状态非回归，候例行核对（BOARD 前录 186 段⑧）。
- **[候 CI] 簿记续 PR 判定**——collab-only 改动，workflow 触发随 paths 过滤
  如实登记；合并以远端必需检查绿为前置。
- VUA-7：零触碰维持，阅读解禁；VUA-8 零触碰维持。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
簿记批随 integration/batch-187 → main 续 PR 落地（PROTECTED_MAIN §4
collab-only 照章）；合并后正典 main fetch＋快进核对，集成分支不删。

## 待命声明（第 6 步，如实）
本轮（2026-09-24 06:56 正常时段实测）：①读 collab/PROTECTED_MAIN.md 与
collab/roles/integration.md 后跑 pnpm collab:brief，①区判读＝无指向本树/本
角色的阻塞与留言，wt-5 验收请求在操作者第 187 批派单范围内，失鲜工作树无；
②origin/main 6525c818 与本地一致零分叉；slot/wt-5 merge-base 实测 d0da0abe
（轮首追平 7a05be5d＋轮中吸收第 186 批，落后 0／领先 3，与派单口径吻合）；
③VUA-9 自 origin/main 建 integration/batch-187，merge-tree 预检 exit 0 干净
后 --no-ff 合并（5bf29ad6）；追平壳 8e668e4f 纯吸收实核（树＝两亲自动合并
结果逐字节一致）；④六文件 diff 全文实读（恰 5+1 文件、全在数据域、守卫只
收紧、时间戳断言语义合理、per-kind 闸零新词面、CorruptValue 不吞不炸、Done
载荷律与 adopt 既有律一致、冻结 schema 零字节触碰、成功路径零变化逐键核对、
测试零放松）；⑤合并树 cargo 985/0（979＋恰 6 新例自洽，ignored 28 维持，
112 套件）＋clippy 0/0 亲测；⑥推送首试即成、PR #20 三 workflow 全绿（rust
首跑瞬败 attempt 2 复跑绿按 #7 判例零代码改动、归因留痕）、合并 ec84ec34、
正典 main ff-only 快进核对在案（6525c818→ec84ec34；主树仅两既有未跟踪件未
阻碍）；⑦零自有产品代码（本批集成自有内容＝合并信息＋collab 簿记）；产品
版本不动、不代跑 W25、历史记录零删除；⑧正典 main 零直改；用户交付栈两进程
未触、未杀 node/electron；VUA-7 零触碰（阅读解禁）、VUA-8 零触碰；主树
`?? _local_p27_devlog.txt`＋`?? collab/.window-lock` 照例不触碰；[需用户]
条目零代决（W25 三件维持候用户）。在手无半途切片、除本状态批与 BOARD 簿记
外无未提交改动。

## 留言
- [→数据/wt-5]（验收回执）：第 180 批三笔（5533298b＋8e668e4f＋76e295c7）已
  随集成第 187 批验收入库（合并 5bf29ad6，PR #20，main 尖 ec84ec34），五发现
  重点复核面逐项成立——①adoptable_file_component 守卫落点与生产区 join 点
  全查（合法名逐字符等价＝只收紧）＋逃逸钉三断言；②时间戳真实读数断言语义
  （定宽 UTC 字典序＝时序）采信；③per-kind 双闸零新词面（IllegalSequence 族
  ＋schema 律 reason）＋staging_completion 防御映射＝panic 类结构性消灭、合法
  completion 成功路径有钉；④PRAGMA 注入手法与读面防御层定位采信、公开面签名
  零变化；⑤Done 载荷律与 adopt 既有律一致、成功路径零变化。合并树 cargo
  985/0（979＋恰 6 新例）＋clippy 0/0 集成亲测复核。你席 [候硬化登记]
  interrupted/failed per-kind 律维持登记态确认（不折入本批，候后续顺带）。
  CI 首跑 provider-host 一红系测试侧 SQLITE_BUSY 瞬败（#7 同族候选，attempt 2
  复跑绿零代码改动），[知会核心/wt-2] 候硬化登记已随批落 BOARD。
- （回执不回执：本批为验收批，各席照纪律执行即可，无需逐一回执。）
