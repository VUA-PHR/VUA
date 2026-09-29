---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 507defa2
updated: 2026-09-25
---
## 当前焦点
**第 181 批（2026-09-25 04:1x–05:3x 夜窗拍，操作者第 197 批派单；基线 507defa2
轮首 --ff-only 追平集成第 196 批 PR #39 簿记尖，纯吸收零自有内容）＝时序敏
感测试族硬化批（集成座三晚登记候办，两度路由核心座）。两点硬化＋一顺手勘
误：①production_host.rs parse_frames 完整行语义（ph_004/ph_010 EOF 族根因
＝并发轮询读到帧内半片）；②dependencies_queries_wire_v05.rs temp 命名进程
内 serial（:195 DatabaseBusy 根因＝warehouse bdl 命名空间无 label 无
serial 的同 tick 碰撞）；③第 191 批⑤注释测试名词面勘误。恰 3 文件全在核
心所有权域，零新增测试零断言放松。**

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 180 批（09-24 23:0x）＝核心域自我反向审查批（一候选缺陷被篡改测试证伪
→CHECK 在库律回归钉＋注释精确化），已随集成第 191 批 PR #28 入库。更早＝
179/178/177/176/171/170/165/164/163/162/161/160/158/157/155/152/151/150
批，见 git 历史与 BOARD 前录。

## 本轮交付（507defa2 基线世代）
- **硬化一（EOF 族）＝production_host.rs parse_frames 完整行语义（+18 行
  含注释）**。根因链（代码面实锤）：src 侧 write_frame
  （provider_host.rs:10566）把一帧经 serde_json::to_writer 分多次小片段
  write 再补 `\n`——流式 Write 协议本允许任意分片（真实 stdout 消费者按
  行读天然只见完整帧，产品侧行为正确）；而测试 helper parse_frames 把
  「尾部无换行的半帧」当一行解析，wait_for_response（10 ms 轮询 clone 共
  享 buffer）恰逢 host 线程帧内两写之间即 panic——CI 错误原文
  「EOF while parsing a string, line: 1, column: 967」（main push run
  36050468010 ph_004／PR #33 attempt 1 ph_010 同位 :163:48）列号正落在长
  帧字符串中部，与本机制吻合。修复＝parse_frames 只解析最后换行前的完整
  行，尾半帧留待轮询下轮自然补全。**不弱化断言论证**：帧写完必有换行
  （write_frame 恒写 \n）→ 完整帧照常解析命中；永不完成的帧仍经
  wait_for_response 15 s deadline 或 post-join 缺帧断言失败（假绿通道不
  存在——SharedWriter 的 write 不失败，post-join buffer 冻结后残余段只
  可能来自 host 异常退出，缺帧断言照样红且位点更准确）；host 返回后冻结
  buffer 的同步调用点（本文件绝大多数）行为逐字节不变。
- **硬化二（DatabaseBusy 族）＝dependencies_queries_wire_v05.rs temp 命名
  进程内 AtomicU64 serial（+26 行含注释）**。根因链（集成座 CI 证据＋本
  席读码互证）：warehouse_with 的 bdl 临时目录命名 `bdl-{pid}-{nanos}` 无
  label 无进程内 serial——同二进制 12 个并行测试共享一个命名空间，
  Windows 时钟粗粒度下同 tick 取同值即同路径；两连接同开一库时第二个连
  接在迁移/WAL 切换锁窗口与首个连接竞争（BdlStore::open
  configure_and_migrate：busy_timeout 5 s＋journal_mode=WAL 独占切换＋
  BEGIN IMMEDIATE 迁移），CI 负载放大等待后超时——「BDL opens: Database
  Busy database is locked」@:195:63（CI run 35931927077／PR #31 attempt
  1/2 两例换名同位／第 187 批前录⑨与第 192 批前录⑨登记）。修复＝
  TEMP_SERIAL fetch_add 进 serial 项，pid 项留跨二进制隔离、nanos 项留
  崩溃轮复用区分，碰撞类整体消除（acquisition unique_dir 同律，BOARD #7
  判例先例）。**诚实登记：CI 负载下 5 s busy_timeout 仍超限的精确放大机
  制（Defender 扫描/慢盘假说）系合理推断非本席实证**——修复有效性验证
  靠碰撞类消除的代码面论证＋CI 观察一批。temp_database 同函数顺手同硬
  化（label 全表唯一系隐式约定，防御性收敛零风险）。
- **顺手勘误＝第 191 批⑤路由项兑现**：bdl_dependency_queries.rs 注释指涉
  测试名 `…_refuses_foreign_drift` → 实名
  `…_the_closed_set_is_database_enforced`（+8/-4 纯注释词面，跨行重排因
  行宽）。恰集成登记范围，语义零影响。
- **半径裁量如实登记**：派单点名两文件硬化；provider-host 其余测试文件
  的同款 nanos 命名（20+ 处）与 src 内嵌测试 database_path 系同族候选但
  label 唯一或同步单调用、风险面不同，**维持登记态不折入本批**（最小半
  径，候集成座后续登记读数加重再议）。download_host/m3_vectors 的
  parse_frames 拷贝系同步单次解析（host 返回后 buffer 冻结）无并发窗口
  ——零风险面不动。orchestrator process.rs std runner 子进程 timed_out
  两例（第 189 批前录⑥）系另一族（进程时序非帧解析），不在本派单两点
  内，维持登记态。
- **门禁读数（如实）**：定向套件**连续四轮全绿**（dependencies_
  queries_wire_v05 12/12＋production_host 16/16 × 4 轮，首跑含编译）；
  cargo test --workspace **113 套 994/0**（与集成第 196 批基线读数一致＝
  本批零新增测试零账目漂移）；cargo clippy --workspace --all-targets
  **0 警告 0 错误 exit 0**（勘误后增量复验）。本地证据边界：CI 负载下的
  竞争窗口本机不可稳定复现，本批验证＝根因机制代码面论证＋定向多轮绿＋
  全量绿；**「瞬败消灭」的最终判定候 CI 观察一批（如实候验，不预先宣
  称）**。

## 在途/待他角色
- **[等集成] 本拍候验收**，写明「wt-2 第 181 批：时序敏感测试族硬化批
  （基线 507defa2）」。恰 3 文件全在本席所有权域（production_host.rs 测
  试侧＋dependencies_queries_wire_v05.rs 测试侧＋bdl_dependency_queries.rs
  纯注释）。重点复核面＝parse_frames 完整行语义不弱化断言论证、serial
  项命名收敛与本席对 5 s 超限机制「推断非实证」的登记边界。
- **[知会集成] CI 观察候验**：本批两硬化针对的正是贵座登记的瞬败族
  （ph_004/ph_010 EOF＋:195 DatabaseBusy）；后续 main push/PR 的 test-and
  -clippy run 若再现同位失败，请按批照录并回路由本席（届时族登记不销）。
- **[维持登记] process.rs 子进程 timed_out 族／其余同款 temp 命名候选面
  ／3220 plan schemaVersion 标签缺省硬化候选**——均不变，见上。
- **[候操作者] S3（核心冻结环，W25 真机证据条件触发）未立项不排期；W25
  真机走查沿登。**

## 阻塞
- 无阻塞。零猜测项。既有 [需用户] 项维持候裁，本批零新增零代决。

## 下次合并意图
**候验收对象＝本拍单笔（两点硬化＋勘误＋本状态批同批），写明「wt-2 第
181 批：时序敏感测试族硬化批（基线 507defa2）」**。恰 3 文件全在本席所有
权域，零新增测试零断言放松，全量门禁亲测全绿（定向四轮＋113 套 994/0＋
clippy 0/0）。走 PROTECTED_MAIN 政策通道（集成树 PR 落地，正典 main 只快
进）。

## 待命声明（第 6 步，如实）
本轮（2026-09-25 04:10 date 实测正常时段起）：①读 collab/PROTECTED_MAIN.md
后跑 pnpm collab:brief，①区判读＝无指向本树/角色阻塞与留言，[→核心/wt-2]
两登记（时序族读数加重＝本拍主任务；注释测试名勘误＝本拍顺手兑现）；②轮
首 --ff-only 追平 507defa2（吸收集成第 195/196 批验收与簿记，纯吸收）；③
根因调查＝CI run 36050468010 失败日志原文拉取＋BOARD 第 187/192/193 批前
录证据链实读＋write_frame/SharedWriter/wait_for_response/BdlStore::open
configure_and_migrate 代码面逐点实读（证据见本轮交付段）；④两点硬化按上
述方案落地，断言语义零放松论证随注释自载；⑤半径裁量如实（同族候选面维
持登记不扩批）；⑥门禁取舍如实：定向四轮＋全量亲测（113 套 994/0）＋
clippy 0/0（勘误后增量复验），本地竞争窗口不可稳定复现的验证边界如实登
载；⑦诚实边界维持：零端到端宣称、「瞬败消灭」候 CI 观察不预称、5 s 超
限机制推断非实证已登记、[需用户] 零代决、VUA-7 零触碰（阅读解禁）、
VUA-8 零触碰、用户素材目录零触碰、交付栈零触碰、他角色所有权域零改码；
⑧在手无半途切片，除本状态批外无未提交改动。完成后推送并退出待命，候集
成验收本批。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍单笔（两点硬化＋勘误＋状态批同
  批），写明「wt-2 第 181 批：时序敏感测试族硬化批（基线 507defa2）」**。
  恰 3 文件全在核心所有权域：production_host.rs parse_frames 完整行语义
  （EOF 族根因修复，不弱化断言）＋dependencies_queries_wire_v05.rs temp
  命名 serial（DatabaseBusy 根因修复，unique_dir 同律）＋bdl_dependency_
  queries.rs 注释测试名勘误（第 191 批⑤兑现）。全量门禁亲测：定向四轮
  绿＋cargo test --workspace 113 套 994/0＋clippy 0/0。CI 观察候验照登
  记（[知会集成] 条）。
- （回执不回执：在途事项以 BOARD 与本状态文件当前焦点为准。）
