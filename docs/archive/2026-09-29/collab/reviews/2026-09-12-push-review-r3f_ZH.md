# 推送门审阅报告 r3f（回溯复审第 3 轮 / 共 3 轮，重启）——构建与测试证据独立复验

- 日期：2026-09-12（推送门回溯复审语境，文件名按调用方指定）
- 审阅对象：main 尖端 `4498851`（领先 origin/main 1 个提交，即 r1f M-1 的 schema-vectors 清单修复；已推送三世代为 `388d0d3..246848c`）
- 审阅者：独立审阅者（r3f；前例因账户限额中断，本轮零起点重做，不继承前例结论，不采信任何文字转述）
- 方法：只读审阅＋真机复跑；cargo 全程使用仓库外系统临时目录下的独立 `CARGO_TARGET_DIR`（与桌面应用可能占用的共享 target 目录零接触，本轮自建目录用后已删除）。全部结论引用实际命令与实际输出。
- 工具链：cargo/rustc 1.97.1、node 24.12.0、pnpm 11.19.0——rustc 版本与 schema-vectors 工作流锁定的 `dtolnay/rust-toolchain@1.97.1` 一致。
- 程序性说明：工作树中发现前例中断会话已写就的一份完整 r3f 草稿（其自述对象为 `246848c`，早于 CI 修复提交）。协调方未收到该草稿，其结论在本轮一律不采信；本报告以 `4498851` 为对象零起点重做并覆盖该文件。系统临时目录另存有前例遗留的 cargo 隔离目录约 9.5 GB（时间戳 2026-09-12 05:36），非本轮创建、未动，建议用户择机清理。

## Verdict

**通过**。五项命令全部真机复验达标：`cargo test --workspace` 两轮完整复跑逐位一致（68 套件 / 505 通过 / 0 失败 / 26 忽略，两轮 exit 0）；clippy `-D warnings` 零告警零错误；桌面全链 exit 0（61 文件 / 486 测试，泄漏扫描 159 指纹零命中）；contracts 38/38（真实脚本名为 `check`，包内无 `test` 脚本）；registry 50/50。505 构成经本轮独立 git 证据闭合：推送范围内净增恰为 +1 套件 +4 测试（proposal 020 的 wire 测试），范围外增量（+4/+1）经历代门记录的实测检查点算术衔接。定向细读四点全部为实：(a) `4498851` 对 r1f M-1 的修复准确且未误动其余条目；(b) proposal 020 三方（schema / Rust 实现 / TS 面）语义逐点同源，负回归真实断言；(c) slot/wt-3 桌面消费批与 020 冻结语义一致（待验收预读意见，非合并判定）。问题清单仅信息级三项，无阻塞项，无安全或凭据泄漏迹象。

## 一、命令复验（真实命令行与两轮数字）

### 1. `cargo test --workspace` 两轮完整复跑

命令（两轮相同；隔离目录为本轮自建的仓库外独立路径）：

```
CARGO_TARGET_DIR=<仓库外临时隔离目录> cargo test --workspace
```

| 轮次 | 套件数 | passed | failed | ignored | exit |
| --- | --- | --- | --- | --- | --- |
| 第 1 轮 | 68 | 505 | 0 | 26 | 0 |
| 第 2 轮 | 68 | 505 | 0 | 26 | 0 |

- **逐位比对**：提取两轮全部 68 条 `test result:` 行（ok/FAILED＋passed/failed/ignored）逐行并排 `diff`——零差异（PER-SUITE IDENTICAL）；两轮均无 FAILED、无 panic、无 error。
- **套件构成**：7 个单元测试（unittests src）＋ 55 个集成测试（tests/ 二进制）＋ 6 个 Doc-tests ＝ 68。
- **ignored=26**：两轮计数一致；本门未将忽略项逐条复述理由（非本批验收项），未发现任何被忽略项宣称为端到端结果。
- **505 构成核对（本轮独立证据）**：
  - 缩进容忍口径逐文件计数 `#[test]`/`#[tokio::test]`：`388d0d3`＝530，`4498851`＝534，**净增 +4、零删除**；逐文件直方图差异唯一条目为新增文件 `crates/provider-host/tests/task_snapshot_wire.rs`（4 测）——即 proposal 020 的 4 个 wire 测试。
  - 推送范围（含尖端）`crates/` 改动面恰 5 文件：新 wire 测试文件（+403 行）＋ provider-host 源（投影与取消分支）＋ import_copy 源/测试与 project_queries 测试的 v0.2 引用跟随（后三者零净增测试，对单元测试同样成立——缩进容忍口径已覆盖源内单元测试）。
  - 范围外增量（真实基线 496 → 501）未做历史树复跑（只读纪律，不回检历史提交），以历代实测检查点交叉衔接：#7 批后验证记录 67 套件/497/0（+1），v0.2 冻结批后 388d0d3 门记录 r3e 两轮 67/501（+4），与本轮起点算术吻合；388d0d3 门记录自含基线算术修正（501 = 496+5）。**本推送范围的净增量（+4）已由本轮独立闭合。**
  - 本轮运行输出中 `task_snapshot_wire` 套件 4 通过、`project_ops_wire` 套件在场，均可直接对账。

### 2. `cargo clippy --workspace --all-targets -- -D warnings`

```
CARGO_TARGET_DIR=<仓库外临时隔离目录> cargo clippy --workspace --all-targets -- -D warnings
```

exit 0，Finished in 38.78s；日志中 `warning` 计数 0、`error` 计数 0。**零告警达标。**

### 3. `pnpm --filter @vua/desktop check` 全链

```
pnpm --filter @vua/desktop check
```

实际链为 `typecheck && test && build && check:boundary && check:i18n && check:contrast && check:leak`，整体 exit 0：

- vitest：**Test Files 61 passed (61)，Tests 486 passed (486)**——与预期逐字一致。
- check:leak：执行生产构建后指纹扫描，**159 条指纹，生产构建零泄漏**。
- `type: module` 警告在场（node 对桌面包 package.json 的已知噪音，非本次引入）。

### 4. contracts 包测试（真实脚本名核对）

`packages/contracts/package.json` 核对结果：**不存在 `test` 脚本**（仅 `build` / `check`）；`pnpm --filter @vua/contracts test` 按字面执行不可用。真实命令为：

```
pnpm --filter @vua/contracts check    # = tsc -p tsconfig.json --noEmit && vitest run src
```

exit 0：**3 个测试文件、38/38 通过**（download-events 4 / application-contract 21 / desktop-gateway 13），tsc --noEmit 先行通过。

### 5. `pnpm collab:brief --registry-only`

```
pnpm collab:brief --registry-only
```

exit 0：「登记表校验：一致 50 项 / 异常 0 项（共 50 行）」——**50/50 达标**。

## 二、定向细读结论

### (a) `4498851` 对 r1f M-1 的修复核验（schema-vectors 权威清单）

- diff 单文件 4+/3-，范围仅 `.github/workflows/schema-vectors.yml`：run 命令行追加 `--test task_snapshot_wire`，注释块同步新增 `task_snapshot_wire (application-contract v0.1 / proposal 020)` 行；顺带将两处过期注释修正为实际版本（import_copy、project_ops_wire 的 `v0.1` → `v0.1/v0.2`，与 REGISTRY 冻结行一致）。**其余条目未动**（diff 内逐行确认），清单注释与 run 命令两侧自洽。
- **完整性独立扫描**（本轮超出 M-1 的新增检查）：全仓 `crates/*/tests/*.rs` 中真实读取 `schemas/` 的文件共 30 个，逐一对照清单发现两个**范围外既有缺口**与一处口径备注（见问题清单 L-1/L-2）。M-1 所指缺口（proposal 020 冻结后未扩展）已闭合，且为本批唯一相关缺口。

### (b) proposal 020 三方一致性

- **schema 机器面**（`schemas/application-contract/v0.1/task-snapshot.schema.json`）：`result` 为可选 object；if/then 不变量一——state ∈ {queued, preparing, running, waiting_for_input, paused, **failed, cancelled**} 七态时 result **不得在场**（`not: required: [result]`，即恒无 result，cancelled 明确在内）；不变量二——failed 必带 error。`result.type = object` 使 null 非法，即 null 只能以字段缺席表达。
- **向量**：`examples/` 下恰 6 文件（3 valid / 3 invalid，命名与不变量一一对应：failed-error-no-result、failed-with-result、nonterminal-with-result、null-result、succeeded-no-result、succeeded-with-result）。
- **wire 测试**（`task_snapshot_wire.rs`，4 测）：向量测试真实读取 schema 编译 jsonschema 校验器并强制「恰 6 文件」；result 回流测试走真实宿主帧回路（受理回执→存储终态→task.get/task.list 双面 result 与存储 Done payload 逐字相等并过校验）；取消测试经真实 requestCancellation 帧后断言快照 `get("result").is_none()`；**failed 负回归为真**——预置一个存储面带 result（回滚观察载荷）的 FAILED 任务，断言快照面 result 缺席且 error.code 在场（task.get 与 task.list 双面），证明投影是按态收窄而非仅按 null 收窄。
- **Rust 实现面**（provider_host）：投影仅在 `Succeeded | SucceededWithWarnings` 且 result 非 None 非 null 时注入字段；demo 取消终态诚实写入 `result: None`（注释如实记录此前 `Some({"demo":true})` 死数据为回流前时代遗留）。
- **TS 面**：`TaskDonePayloadV01` 开放形状（索引签名）＋`TaskSnapshotV01.result?` 可选字段，注释语义（仅成功终态、失败走 error、与 completed 事件同源同值）与机器面逐点一致；3 个类型测试含失败面 `hasOwnProperty("result") === false` 的显式断言。
- **结论：三方同源成立，冻结语义在 schema、实现、类型面、向量、wire 测试五处互相钉死。**

### (c) slot/wt-3 桌面 #22 消费批只读预审（867ccda，未合并——待验收预读意见，非合并判定）

`git diff main..slot/wt-3 -- apps/desktop`（4 文件，+477/−78）逐段细读：

- **受理窄化**：live wire 成功值先经 `narrowTaskAccepted` 收窄为任务受理回执（taskId/correlationId），收不齐即诚实 unavailable——与 020「受理即回执、结果随快照回流」一致，直接期待结果文档的旧形状被移除。
- **task.get 终态等待**：初始即取权威快照（覆盖快任务在受理返回前已内联完成的情形，v0.2 先例）；未终态则订阅事件通道，收到本任务 `task.completed` 后**重取权威快照**（事件为通知、快照为权威，与 020 两通道同源同值一致）；首取失败（断连/形态不齐）立即返回不可确认；等待中重取失败保留等待由后续事件或超时兜底；120 秒等待上界仅防御事件丢失后的无限挂起，超时即「无法确认结果」。
- **五类诚实 unavailable** 均在且各有专测（新增测试文件 12+ 个用例）：受理形态不可信、超时/断连/快照形态不齐、failed/cancelled 终态（仅 `succeeded | succeeded_with_warnings` 消费 result）、快照无 result 或 result 文档缺必需字段、词表窄化失败；词表窄化复用既有 narrow 函数，无第二套形状逻辑。
- **fixture 侧**：importCopy 转恒诚实不可用，注释写明裁定理由（伪造任务引擎或保留与 live 不同构的同步形状都是 #22 型缺口的温床），与 setNote 先例同构。
- **预读意见**：与 020 冻结语义一致，未见越权实现或隐式续跑。给验收方两点提示：① fixture 演示路径移除后，014 确认链的 DEV 走查覆盖面收窄为不可用反馈路径（分支提交信息已如实声明，验收时确认 B9 反馈呈现即可）；② 分支自报 desktop 62/499＋contracts 38/38 本轮未复跑（本轮对象为 main；62/499 = main 61/486 ＋ 1 文件 13 测，算术自洽）。

## 三、问题清单（按严重度）

- **L-1（信息级·新发现·既有，非本批引入）** schema-vectors 权威清单完整性扫描发现两个范围外缺口：`crates/acquisition/tests/import_contract_v03.rs` 真实读取 `schemas/bdl-commands/v0.3`（REGISTRY：已取代→v0.4）、`crates/unity-bridge/tests/bridge_v2_vectors.rs` 真实读取 `schemas/unity-bridge/v2`（REGISTRY：已冻结）——二者均不在清单。溯源：前者在 eeb42c6 大扩清单时即未收录（非被删除），后者落地（06802b9）时未按清单规则扩展；两提交均早于本推送范围。不影响本次门（本批唯一相关缺口 M-1 已修复），建议 Integration 以簿记批补录。
- **L-2（备注）** `vua_identity.rs` 在清单内但经查不读取 `schemas/`（无 schema 路径/include 引用；eeb42c6 有意作为 project-inspection v0.2 锚点收录）——多跑无害，仅与 workflow 文件头「tests that read schemas/ for real」的口径表述不完全一致，随 L-1 一并厘清即可。
- **L-3（程序性备注）** 前例 r3f 会话遗留：一份对象为 `246848c` 的完整草稿报告（已被本报告覆盖）与系统临时目录约 9.5 GB cargo 隔离目录（本轮未动）。建议用户择机清理临时目录遗留物；本轮自建隔离目录与中间文件已删除，四份命令输出日志暂存系统临时目录备查。

无阻塞项；未发现安全问题、付费资产或凭据泄漏迹象；无需用户裁决事项。

## 四、结论

三轮回溯复审的构建与测试证据主项经本轮零起点独立复验全部成立：五项命令真机达标、两轮逐位一致、构成经 git 证据闭合、M-1 修复准确、proposal 020 冻结五处同源、wt-3 消费批预读语义一致。结合 r1f（有条件通过，条件已修复）与 r2f（并行范围），`388d0d3..246848c` 三世代及尖端 `4498851` 通过本轮审阅；`4498851` 可推送。剩余动作：L-1/L-2 由 Integration 簿记批收敛；wt-3 消费批按其自身流程验收（本报告 (c) 节为预读输入）。
