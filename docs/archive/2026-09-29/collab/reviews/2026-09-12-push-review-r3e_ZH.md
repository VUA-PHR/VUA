# 推送门审阅报告 r3e（第 3 轮 / 共 3 轮）——构建与测试证据

- 日期：2026-09-12
- 审阅对象：main（尖端 `a8e0c5d`）相对 origin/main（`2de1755`）的待推送增量（29 提交、51 文件、+2532/−602，经 `git diff --stat` 复核一致）
- 审阅者：独立审阅者（r3e，构建与测试证据主项）
- 方法：只读审阅＋隔离 `CARGO_TARGET_DIR`（`.target-r3e`，用后删除）真机复跑；所有结论引用实际命令与输出，不采信任何文字转述

## Verdict

**通过**。四项命令全部真机复验达标、两轮测试逐位一致；定向细读三点结论均为实。附两项低严重度记账/完备性备注（见问题清单），不构成推送阻塞。

## 一、命令复验（真实命令行与两轮数字）

### 1. `cargo test --workspace` 两轮完整复跑

命令（两轮相同，隔离 target 目录）：

```
CARGO_TARGET_DIR=.target-r3e cargo test --workspace
```

- 第 1 轮：`test result: ok` 67 行、passed 合计 **501**、failed **0**，EXIT=0
- 第 2 轮：`test result: ok` 67 行、passed 合计 **501**、failed **0**，EXIT=0
- **逐位比对**：提取两轮全部 67 条 `test result: ok` 行的 passed 数逐行 `diff`，**完全一致**（PER-SUITE IDENTICAL）；两轮均无 FAILED/error/panic
- 套件构成：61 个编译运行目标（单元＋集成）＋6 个 Doc-tests（Doc-tests 全部 0 通过）；忽略计数与基线无差异（增量 diff 中无 `#[ignore]` 变更）

**差异构成（实测解释）**：对 `origin/main..main` 全量 `*.rs` 做逐文件 `#[test]` 计数对比，净增恰为 **+5、零删除**：

| 文件 | 基线 → 现在 | 内容 |
| --- | --- | --- |
| `crates/provider-host/tests/project_ops_wire.rs` | 9 → 13（+4） | setNote 四测：向量驱动 Schema 校验／wire 存储与清除／三守卫类型化拒绝／闭参集＋unavailable |
| `crates/acquisition/src/test_support.rs` | 0 → 1（+1，新文件） | #7 回归钉：并行压力下临时目录两两不同 |

两处均有运行佐证：acquisition lib 单元套件实测 **32 通过**（=基线 31＋1），project_ops_wire 套件实测 **13 通过**（=9＋4）。增量中动 Rust 的提交仅 `0889a1b`（project-ops v0.2）与 `cd3eead`（#7 修复），与上表一一对应。

因此 **501 = 真实基线 496 ＋ 5**。调用方给的分解「501=497 基线＋净增 4＋#7 回归 1」内部自相矛盾（497+4+1=502）：现值 501 两轮实测无误，±1 记账误差出在「基线 497」这一宣称（应为 496）。本轮未另建基线工作树复跑基线（守只读纪律），但「+5、零删除、无 ignore 变更、doc-test 全 0」的 git 证据已足以封闭该算术。

### 2. `cargo clippy --workspace --all-targets -- -D warnings`

```
CARGO_TARGET_DIR=.target-r3e cargo clippy --workspace --all-targets -- -D warnings
```

EXIT=0；日志中 `^warning|^error` 计数 **0**；241 个 Checking/Compiling 单元，正常收尾（dev profile）。零告警属实。

### 3. `pnpm --filter @vua/desktop check`

EXIT=0。链为 `typecheck → test → build → check:boundary → check:i18n → check:contrast → check:leak`（&& 串联，走到末环即全过）：

- 测试：**Test Files 61 passed (61)、Tests 483 passed (483)** —— 与宣称 61 文件/483 测试一致
- typecheck：tsc 双配置 --noEmit 通过；build：contracts/orchestrator-provider 构建＋vite 构建通过
- check-boundary / check-i18n / check-i18n-tables：OK
- check-contrast：全部达标；check-leak：**通过（159 条指纹，生产构建零泄漏）**
- `type: module`（MODULE_TYPELESS_PACKAGE_JSON）警告出现，确为已知噪音，不影响退出码

（诚实备注：该链内部含 `cargo build --release -p vua-provider-host`，走的是默认 target 目录而非本轮隔离目录；本轮无文件锁冲突、退出 0、未留下 tracked 改动。）

### 4. `pnpm collab:brief --registry-only`

EXIT=0，输出「登记表校验：一致 **49 项** / 异常 **0** 项（共 **49** 行）」——与预期 49/49 一致（本批 REGISTRY 有 project-ops v0.2 等升版行）。

## 二、定向细读三点结论

### (a) provider-host setNote 路由＋project_ops_wire.rs —— **属实**

`crates/provider-host/src/provider_host.rs` 的 `project_set_note`：

- **三新守卫码类型化拒绝真实触发**（路由 Guard 1 注册表比对→`project_not_found`；`SetNoteError::NotVuaNative`→`not_vua_native`；`SetNoteError::Unreadable`→`identity_unreadable`；另有 `Io`→`execution_failed`）。守卫在任务内评估、以冻结 `rejected` 结果文档随 Done 载荷返回——`wait_done` 对守卫拒绝断言任务终态 `succeeded`（诚实完成、判即拒绝），且 wire 测试对三码逐一断言 `kind/guard/code`，各配磁盘诚实断言：not_vua_native 后无身份文件被发明、identity_unreadable 后垃圾证据逐字节未动
- **写备注不改 markedAt 有断言**：测试 `set_note_stores_and_clears_over_the_wire` 断言 `markedAt == 首标记时间戳`（"setting a note never re-marks the project"）；底层 `set_note`（project-manager `vua_identity.rs`）以 `marked_at: identity.marked_at` 原样保留，实现与断言互证。清除腿（note=null）断言 kind/note=null/文件中 note 真消失
- **unavailable 分支诚实**：无 project-ops 接线时 setNote 与 import-copy 均实测断言 `vua.project.unavailable`
- 参数闭集（projectPath/note、非空、≤2000 字符、单行、null 清除）与 v0.2 command.schema.json 的 allOf setNote 分支（additionalProperties:false、minLength 1、maxLength 2000、`^[^\r\n]*$`）逐项一致；result.schema.json 守卫枚举为十码闭集，含三新码

### (b) acquisition test_support.rs —— **属实**

- **cfg(test) 门控**：`crates/acquisition/src/lib.rs` 中声明为 `#[cfg(test)] mod test_support;`——生产构建零带入；佐证：clippy `--all-targets` -D warnings 零告警（若未门控，非测试构建中无人使用的 `pub(crate)` 函数会以 dead_code 告警）
- **#7 回归真实**：`unique_dir_paths_are_pairwise_distinct_under_parallel_stress`（8 线程×64 次屏障同步压力＋HashSet 判重）随 lib 单元测试执行（套件 31→32 实测）
- **generate_vpm publish_root 加固点**：`warehouse_maintenance.rs` 生产路径 publish_root 命名加入 pid＋进程内原子串行，理由注释在位（"Board #7 hardening: same-tick timestamp reuse … could alias two concurrent generate_vpm jobs onto one publish root; the pid + process-unique serial makes the name collision-free"）——与 test_support 的 unique_dir 同一缺陷类一次修复

### (c) collab-brief.mjs BG-21 修复 —— **属实，五步矩阵逐项复验**

`b86a3db` 修复（畸形行/空必填格不再被静默 continue）。因不得改动真 REGISTRY，本轮在系统临时目录另建隔离 git 仓库＋脚本副本，构造正/负例独立复验五类场景：

1. 正例（良构两行）：「一致 2 项 / 异常 0 项」exit 0 ✓
2. 截断行负例（列数 2、缺状态列）：「✗ REGISTRY 畸形行（列数 2，需 ≥3）」计入总数（共 2 行）exit 1 ✓（与提交信息宣称的检出文案/行为一致）
3. 空必填格负例（版本格空）：「✗ REGISTRY 畸形行（必填格空 1 处）」exit 1 ✓
4. 坏版本负例（9.9.9 vs 头部 1.0.0）：版本不一致检出 exit 1（未回归）✓
5. 表间正文行：不计入、不报异常 exit 0 ✓

真仓库 registry-only 49/49 exit 0 为该修复后的正例全景。

## 三、schemas/project-ops/v0.2 核验

- 目录实况：`command.schema.json`＋`result.schema.json` 两 Schema＋examples 14 件（实测 `ls`），与宣称一致
- **向量驱动真实消费**：`set_note_vectors_validate_against_the_frozen_schemas` 直接读取并断言 **12/14** 件——正例 request 2（set-note/set-note-clear）、正例 result 4（import-copy plan/apply＋set-note/clear）、负例 request 5（invalid-operation/invalid-phase/缺 projectPath/空 note/多行 note，逐一断言必须被 Schema 拒绝）、守卫拒绝 result 1（not_vua_native）；此外其余 wire 测试把真实帧环流量再过一遍两 Schema。非摆设
- **v0.1 目录未动**：`git diff origin/main..main -- schemas/project-ops/v0.1/` 为空；该目录最后变更提交在增量之前

## 四、问题清单

| # | 严重度 | 问题 | 建议 |
| --- | --- | --- | --- |
| 1 | 低（记账） | 「合并前基线 67/497/0」与增量构成不符：git 证据（+5/−0、无 ignore 变更）证明真实基线 passed 应为 496；宣称分解 497+4+1=502 自相矛盾。**现值 501 两轮实测无误**，误差仅在基线宣称 | 后续验收记录以逐套件日志归档基线数；本轮不阻塞 |
| 2 | 低（完备性） | v0.2 的 2 件 import-copy request 向量无任何 v0.2 路径直接消费者（全仓 grep 证实；等价物仅 v0.1 路径被 project-manager 测试消费，wire 测试以构造命令验证同一 v0.2 command Schema 面）。「14 向量直接驱动校验」的表述实际为 12/14 | 或在向量测试补两行消费循环，或在文件头注明 carried 副本的消费路径 |
| 3 | 观察 | BG-21 检出范围限于必填列（路径/版本/状态）以内的截断与空格；截断发生在末尾可选列（如丢「最近复核」）不触发畸形行——必填三列仍全、版本/状态校验照常执行，与修复宣称范围一致，非缺陷 | 无需动作；如欲收紧可按表头列数校验 |
| 4 | 观察 | 桌面 check 链内部 `cargo build --release` 走默认 target 目录（隔离变量未传导）；本轮无锁冲突、退出 0、无残留 | 后续审阅如需严格隔离，可对该链显式导出隔离变量 |

无安全问题、无付费资产/凭据泄漏迹象，无 `[需用户]` 事项。

## 五、结论

构建与测试证据主项全数通过：两轮 67 套件/501 通过/0 失败逐位一致（501=496 基线＋5，宣称基线有 ±1 记账误差）、clippy -D warnings 零告警、桌面全链 61 文件/483 测试＋零泄漏 exit 0、registry-only 49/49 exit 0；setNote 三守卫/markedAt/unavailable、cfg(test) 门控、BG-21 五步矩阵、v0.2 向量消费（12/14 直接）均以真实输出核实。两项低严重度备注不阻塞推送，建议随后续批次收口。
