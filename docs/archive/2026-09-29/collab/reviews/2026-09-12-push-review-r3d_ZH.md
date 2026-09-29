# 推送门第三轮补充复审（r3d：构建与测试证据）

- 日期：2026-09-12（推送门系列内编号；审阅会话当日执行）
- 审阅者：r3d 独立审阅者（只读＋运行验证，不改代码、不提交、不推送）
- 审阅对象：待推送增量 `bc59453..main`（20 提交，30 文件，+1466/−466），尖端 `34eddaf`，origin/main 在 `bc59453`——仓库状态核对一致
- 本轮主项：构建与测试证据独立复验＋BG-18 修复定向细读
- 环境：Windows；cargo 1.97.1 / rustc 1.97.1 / node v24.12.0 / pnpm 11.19.0。审阅期间用户桌面应用在运行
  （electron 进程在场，可能锁定共享 target 内 release exe）——**全部 cargo/pnpm 命令均通过仓库外隔离
  `CARGO_TARGET_DIR` 执行**，审阅结束后已删除该目录；主工作树全程保持 clean（`git status --porcelain` 空）。

## Verdict

**通过**（附非阻塞问题清单，见下）。

理由：任务指定的全部验证以真实运行复现——`cargo test --workspace` 两轮**完整**轮次逐位一致
（67 套件 / 496 通过 / 0 失败 / 26 ignored，exit 0）；clippy `-D warnings` 零告警；桌面 `check` 全链
exit 0（typecheck 双 tsconfig → vitest 60 文件/474 测试 → release 构建＋vite build → boundary/i18n/
contrast/leak 全过）；`collab:brief --registry-only` exit 0、46/46 一致；BG-18 修复四点全部核实成立。
唯一异常是第 1 轮全量跑撞上 **acquisition 存量瞬败**（BOARD #7 残余观察再现，本批范围外文件，
重跑不再现，两轮完整复跑不受影响）——已按「宁可误报不得漏报」置顶登记，但不构成本批阻塞。

## 一、命令与两轮数字（全部为真实执行）

说明：命令中的环境前缀均为 `CARGO_TARGET_DIR=<仓库外隔离目录>`（防止与运行中桌面应用共享
target 锁冲突）；日志留存于本机临时目录（文件名 `vua-r3d-*.log`），关键输出已摘录如下。

### 1. cargo test --workspace（实际共跑 3 轮＋定向复跑）

| 轮次 | 结果 |
|---|---|
| 第 1 轮 | **不完整**：fail-fast 在 `vua-acquisition --lib` 中断（该套件 30 通过/1 失败，cargo exit=101），失败详情见问题清单第 1 条 |
| 第 2 轮 | **完整**：67 套件 / 496 通过 / 0 失败 / 26 ignored，exit 0 |
| 第 3 轮 | **完整**：67 套件 / 496 通过 / 0 失败 / 26 ignored，exit 0 |

- 第 2、3 轮**逐位一致**，与集成验收宣称（67/496/0/26）逐位一致。
- 「496＝495 基线＋BG-18 回归 1」核实：`crates/project-manager/tests/import_copy.rs` 测试函数
  5→6（`git show bc59453:… | grep -c '#[test]'`＝5，现树＝6）；范围内其余 Rust 文件零测试增删
  （增量非 collab 文件仅 project-manager 三件＋unity-bridge 一行修复＋桌面 TS），加法恰为 1。
- 瞬败测试定向复跑 3 次：`cargo test -p vua-acquisition --lib warehouse_import::tests::import_copies_a_folder_into_an_entry_without_touching_originals`
  → 每次 `1 passed; 0 failed`，不再现。
- BG-18 回归测试 `target_inside_source_guard_survives_runner_path_spellings` 在第 2/3 轮全量中实跑通过。

### 2. cargo clippy --workspace --all-targets -- -D warnings

- exit 0；日志中 `warning` 字样计数 **0**；`Finished \`dev\` profile … target(s) in 39.74s`。零告警属实。

### 3. pnpm --filter @vua/desktop check（隔离 CARGO_TARGET_DIR）

- exit 0。脚本链与 `apps/desktop/package.json` 核对一致：
  `typecheck → test → build → check:boundary → check:i18n → check:contrast → check:leak`。
- typecheck：`tsc -p tsconfig.json --noEmit && tsc -p tsconfig.electron.json --noEmit`，零错误（链继续执行）。
- test：provider 包构建后 vitest——**Test Files 60 passed (60)，Tests 474 passed (474)**，与预期逐位一致。
- build：`cargo build --release -p vua-provider-host --bin vua-orchestrator-provider`（隔离 target 内）＋
  `tsc -p tsconfig.electron.json` ＋ `vite build`（`✓ built in 216ms`）全部成功。
- check-boundary：`OK — Gateway 引用全部经 barrel`。
- check-i18n：`OK — 业务代码无中文字面量`；check-i18n-tables：`OK — 3 个交付语言表与源表对齐`。
- check-contrast：`全部达标`。
- check-leak：`通过(159 条指纹,生产构建零泄漏)`（生产构建 vite build 临时目录内重跑后扫描）。
- 噪音核对：`MODULE_TYPELESS_PACKAGE_JSON`（"type": "module"）警告出现 2 次——确为调用方预告的已知噪音，
  不影响 exit 0。

### 4. pnpm collab:brief --registry-only

- exit 0；输出：`登记表校验：一致 46 项 / 异常 0 项（共 46 行）`——46/46 属实。

## 二、BG-18 修复定向细读（四点结论）

审阅对象：提交 `38dc36c`（足迹恰 3 文件：`crates/project-manager/Cargo.toml` +10、
`src/import_copy.rs` +60/−6、`tests/import_copy.rs` +116，合计 +180/−6——无夹带）。

### (a) 守卫语义只收紧不放宽——成立

- **014 拒绝码闭集不变**：`git diff bc59453..main -- crates/project-manager/src/import_copy.rs`
  对 `RejectionGuard` 枚举与 `code()` 零触碰；`schemas/` 目录在增量范围内零改动，
  `schemas/project-ops/v0.1/result.schema.json` 的 guard 枚举（7 码）与 Rust 枚举一一对应，冻结面未动。
- **收紧方向的机制证据**：旧 `normalize()` 对不存在路径回退「原样拼写」，目标（典型不存在态）与
  canonical 化的源做前缀比较会因拼写差异（8.3 短名/盘符大小写/verbatim）漏配→守卫绕过。新逻辑：
  存在路径走 canonicalize（与旧行为逐位相同）；不存在路径改为「最深存在祖先 canonicalize＋缺失尾部
  重挂＋verbatim 剥离＋盘符大写」。逐类拼写推演：旧命中拒绝的（普通拼写、verbatim 双侧命中、
  组件级前缀成立者）新逻辑全部保持拒绝；旧漏配的（短名、盘符大小写、单侧 verbatim）新逻辑收敛为
  拒绝。**不存在「旧拒新放」路径**——拒绝集单调扩大。
- **短名拼写下确实拒绝**：回归测试在本机实跑通过；本机系统卷 8.3 启用（`dir /x` 可见既有短名目录，
  注册表 NtfsDisable8dot3NameCreation=0x2 按卷默认），且 fixture 目录名长度 >8 字符保证
  GetShortPathNameW 返回形态确与原名不同——短名断言分支在本机真实执行并拒绝，非空转。
- 附带观察（非缺陷，见问题清单第 2 条）：`normalize()` 同时用于 `registered_associations` 的注册
  匹配，跨拼写等价现在成立；仍要求同一 canonical 位置存在真实注册，方向与守卫意图一致，非旁路。

### (b) GetShortPathNameW 能力检测非变相跳过——诚实

- 测试助手 `short_path()`：调用失败返回 `None`；卷不跟踪 8.3 时 GetShortPathNameW 原样返回输入，
  此时 `short == inside` → **仅短名子断言**跳过，且测试注释明文披露这是「能力检测，不是跳过守卫」。
- 跳过是物理诚实的：无 8.3 的卷上无法构造真实短名形态，任何硬编码断言要么假失败要么空转。
  关键在于守卫本身未被跳过——控制断言（普通拼写）与盘符大小写、verbatim 两个子断言在 Windows 上
  无条件执行；本机（8.3 启用）短名分支实际执行。CI Windows runner 的 TEMP 即 8.3 形态，恰是
  被回归的场景，CI 上该分支同样非空转。

### (c) windows-sys dev-dep 仅 windows+dev、Cargo.lock 零变化——属实

- `Cargo.toml`：新增项位于 `[target.'cfg(windows)'.dev-dependencies]`，版本 `=0.61.2` 与既有
  `[target.'cfg(windows)'.dependencies]` 同源同版本；features 仅 `Win32_Foundation`＋
  `Win32_Storage_FileSystem`（测试所需最小面）；注释含 owner/用途/移除路径（合于工作纪律 6）。
- `git diff bc59453..main --stat -- Cargo.lock` 为空——**零变化**；lock 中 `windows-sys 0.61.2`
  为既有登记（另有 0.52.0 供其他 crate），dev-dep 不产生新 lock 条目。
- src 面零新引用：`src/import_copy.rs` 对 `windows_sys` 的使用仅存量 `check_disk_free`（GetDiskFreeSpaceExW），
  新 API 引用只在测试文件。

### (d) material_task.rs:94 一行修复零行为变化——属实

- diff 恰一行（1+/1−）：`unwrap_or_else(|_| serde_json::Value::Null)` → `unwrap_or(serde_json::Value::Null)`。
- 闭包本就丢弃错误参数返回常量 `Value::Null`（无分配的单元变体构造）——惰性求值无收益，eager 求值
  语义逐位等价。属 clippy（unnecessary_lazy_evaluations 一类）合规修复，零行为变化。

## 三、问题清单

1. **[中｜非阻塞｜范围外｜建议重开 BOARD #7 残余观察]** acquisition 存量瞬败再现，且**身份首次捕获**：
   第 1 轮全量并行跑中 `warehouse_import::tests::import_copies_a_folder_into_an_entry_without_touching_originals`
   失败一次，panic 于 `crates/acquisition/src/warehouse_import.rs:546`
   （`assertion failed: entry_folder.join("material-pack.unitypackage").is_file()`，套件 0.36s），
   cargo exit=101；定向复跑 3 次全绿，第 2/3 轮全量全绿。`crates/acquisition/` 在 `bc59453..main`
   零改动——**非本批引入**。与 BOARD #7 残余观察（2026-09-08 八轮一次 14/1 瞬败、身份未捕获）同型；
   与已记录的 ph_010 样本（mutation_gate 测试）是**不同测试**。完整日志已留存本机临时目录
   （`vua-r3d-test1.log`），可供按 #7 协议重开时取用。疑似根因（供参考，未做猜测性修复）：acquisition
   测试的 `unique_dir` 以纳秒时间戳＋共享标签（"wh"/"parent"/"src"）生成临时目录，并行下同纳秒碰撞
   即两测试共享目录，先结束方的 `remove_dir_all` 清理会删除对方已复制文件——与失败形态
   （import 报告成功而文件不在场）吻合。**建议 [→数据]** 按 #7 协议带本次全量日志重开；不阻塞本推送门。
2. **[低｜观察]** BG-18 `normalize()` 的等价面扩大同及 `registered_associations`：此前因拼写差异被
   SourceNotRegistered 误拒的注册源现在可匹配。方向与守卫意图一致（仍要求同一 canonical 位置有真实
   注册），非旁路；登记备查，无需动作。
3. **[低｜观察｜与第 1 条同源]** 测试基建：`unique_dir` 纳秒碰撞面（同标签多测试共享目录＋清理竞态）
   可作为 #7 重开时的修复方向（如以进程内原子计数器或 UUID 后缀加固）。

无 [需用户] 事项；未发现安全问题、付费资产或凭据泄漏迹象。

## 四、结论

r3d 主项（构建与测试证据）全部以真实运行复核通过：cargo 两轮完整逐位一致 67/496/0/26、clippy 零告警、
桌面 check 全链 60/474＋四项检查全过、registry 46/46；BG-18 修复四点（守卫只收紧、能力检测诚实、
dev-dep 隔离与 lock 零变化、一行修复零行为差）逐项成立，提交足迹干净无夹带。唯一异常为范围外
acquisition 存量瞬败（身份已捕获、留证、建议重开 #7），不影响本批推送结论。本轮对推送门投**通过**。
