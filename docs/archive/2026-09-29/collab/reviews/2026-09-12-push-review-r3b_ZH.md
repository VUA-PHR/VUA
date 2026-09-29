# 推送增量复审报告（第 3 轮 b / 增量第 3 轮，r3b）

- 日期：2026-09-12
- 审阅对象：`origin/main..main` 待推送树（main = `9e87f8e`，ahead 352）；本轮主项＝**构建与测试证据**
- 复审基线：r1–r3 已覆盖至 `88dd71d`（全量 cargo test 当时 496 通过）；增量 `88dd71d..main`
  （95 提交，55 文件，+2226/−283）由 r2b/r3b 复审
- 审阅者：独立 Reviewer（r3b，与生产进程非同一模型，只对结论负责）
- 性质：只读审阅＋运行测试；除本报告外未写任何仓库文件、未改代码、未 commit、未 push、未切分支；
  审阅期间工作树干净（`git status --porcelain` 空）。测试日志捕获于系统临时目录（`$TEMP`），不落仓库盘。

## Verdict：**通过（可推送）**

五项主项全部以真实运行证据收口：cargo test 两次完整复跑**完全一致**（67 套件 / 495 通过 / 0 失败 /
26 ignored），且 496→495 的数字变化已逐项闭合（见 §1.2，系增量内「真机件转 #[ignore]＋cfg 门控」的
诚实纪律变化，非覆盖丢失）；clippy 全 workspace 全 targets 零告警；桌面 `check` 全链在排除**运行中
用户会话占用 exe** 的环境干扰后 EXIT=0（首跑失败为环境条件，非代码缺陷，见 §3.1）；
`collab:brief --registry-only` exit 0 且脚本 exit 修复经源码核验真实传导；environment.rs disk_space
双辖区变更（15fa959）实现最小、断言真覆盖双区、无诚实缺口。无阻断项；4 项非阻断观察见 §5。

## 一、cargo test 全 workspace（两次稳定复跑）

### 1.1 真实命令与数字

命令（两次相同）：

```
cargo test --workspace
```

输出统计（对 `test result:` 行按默认字段切分求和，原始日志 `$TEMP/vua_r3b_cargo_run{1,2}.log`）：

| 复跑 | 套件数 | passed | failed | ignored |
|---|---|---|---|---|
| 第 1 次 | 67 | 495 | 0 | 26 |
| 第 2 次 | 67 | 495 | 0 | 26 |

两次**逐项完全一致**（本周曾发生首跑 44 套件、复跑 67 的事故；本轮无此现象，两次均 67）。
日志中无任何 `FAILED`/`error[` 行。上轮门（88dd71d）口径为 496 通过；本轮 495，差异已查明并闭合如下。

### 1.2 496 → 495 的账目闭合（增量 diff 逐项核对，`git diff 88dd71d..main -- '*.rs'`）

- **+4 个新测试**（全部默认参与运行）：
  1. `crates/bdl-store/tests/downloads_list_serving.rs` — `list_completed_sorts_by_completed_at_ascending_even_from_unordered_ingest`
  2. `crates/provider-host/tests/environment_snapshot_wire.rs`（新文件）— `environment_snapshot_consumes_the_real_detection_engine`
  3. 同上 — `environment_snapshot_without_wiring_is_the_honest_empty`
  4. `crates/orchestrator/src/overlay_surface.rs`（src 内嵌单元测试）— `task_cards_order_follows_the_enqueue_time_not_the_id`
- **−4 个既有测试转 `#[ignore]`**：`crates/project-manager/tests/eac_terminate.rs` 全部 4 个测试按
  操作者修复指令（2026-09-10）标注「真机手动验证件」（spawns and taskkills a real PowerShell
  process；默认测试集零真实进程终止；文件头附手动运行命令 `-- --ignored`，primitive 另需
  `--features test-hooks`）。
- **−1 个测试被 cfg 门控移出默认集**：`crates/project-manager/tests/eac_allowlist_verify.rs` 的
  `winverifytrust_refuses_an_unsigned_or_missing_file` 由 `#[cfg(windows)]` 收紧为
  `#[cfg(all(windows, feature = "test-hooks"))]`，默认集不再编译该测试。

账目：496 + 4 − 4 − 1 = **495** ✓；ignored 由 22 增至 26（+4，即 eac_terminate 四件）✓；套件数 67
与合并记录（3489276「67/67 workspace 全绿」）一致 ✓。该数字变化是**覆盖的显式重新归类**
（真机件/门控件，均带运行说明），不是静默丢失，符合诚实纪律。

## 二、cargo clippy 全 workspace 全 targets

真实命令与结果：

```
cargo clippy --workspace --all-targets
```

```
Finished `dev` profile [unoptimized + debuginfo] target(s) in 9.70s
```

对全量日志（`$TEMP/vua_r3b_clippy.log`）`grep -ci "warning"` 计数为 **0**（大小写不敏感，含
`warning:` 前缀行与任意位置提及），无 error 行。**零告警，通过。**

## 三、pnpm --filter @vua/desktop check 全链

脚本名核对：`apps/desktop/package.json` 中 `check` 存在，链路为
`pnpm typecheck && pnpm test && pnpm build && pnpm check:boundary && pnpm check:i18n && pnpm check:contrast && pnpm check:leak`，
与任务描述一致（build 含 `cargo build --release -p vua-provider-host --bin vua-orchestrator-provider`）。

### 3.1 首跑：build 步环境性失败（非代码缺陷）

```
pnpm --filter @vua/desktop check
```

typecheck ✓，vitest **57 文件 / 455 测试全过** ✓，随后 cargo release 步失败：

```
error: failed to remove file `C:\Users\AR\Documents\VUA\target\release\vua-orchestrator-provider.exe`
Caused by: 拒绝访问。 (os error 5)
```

诊断（`tasklist`）：用户环境有一个**正在运行的 VUA 桌面会话**（`electron.exe` ×3 ＋
`vua-orchestrator-provider.exe` PID 69156）占住了 release exe，cargo 无法替换。这是审阅环境的
并发使用条件，与代码无关；审阅者不终止用户进程，改用隔离 `CARGO_TARGET_DIR` 重跑。

### 3.2 重跑：隔离 target 目录，全链 EXIT=0

```
CARGO_TARGET_DIR="$TEMP/vua_r3b_target" pnpm --filter @vua/desktop check
```

EXIT=0，各环节真实输出（日志 `$TEMP/vua_r3b_desktop_check2.log`）：

| 环节 | 结果 |
|---|---|
| typecheck（tsc ×2 配置） | 通过（链路继续） |
| vitest | **Test Files 57 passed (57)；Tests 455 passed (455)**（与首跑一致） |
| build（含 cargo release） | `Finished \`release\` profile [optimized] target(s) in 58.46s`；`vite build` `✓ built in 213ms`（`dist/renderer/index.html` 产出） |
| check:boundary | `check-boundary: OK — Gateway 引用全部经 barrel` |
| check:i18n | `check-i18n: OK — 业务代码无中文字面量`；`check-i18n-tables: OK — 3 个交付语言表与源表对齐` |
| check:contrast | `check-contrast: 全部达标`（抽样最低 6.58:1 ≥ 4.5:1） |
| check:leak | `check-leak: 通过(159 条指纹,生产构建零泄漏)` |

已知老噪音在位且不构成失败：`[MODULE_TYPELESS_PACKAGE_JSON]` 警告（`type: module` 缺失），
按任务口径不计。vite 另有一条 >500 kB chunk 提示，为构建体积建议非错误。

## 四、pnpm collab:brief --registry-only（exit code 修复核验）

真实命令与结果：

```
pnpm collab:brief --registry-only
```

**EXIT=0**；输出末行：`登记表校验：一致 46 项 / 异常 0 项（共 46 行）。`

脚本源码核验（`scripts/collab-brief.mjs`，增量 diff）：

```diff
-  process.exitCode = registryBad > 0 ? 1 : 0;
-  process.exit(0);
+  process.exit(registryBad > 0 ? 1 : 0);
```

- 旧代码缺陷属实：`process.exit(0)` 显式传 0 退出，丢弃先前设置的 `process.exitCode`，非零结果
  永不传导。
- 新代码 `process.exit(registryBad > 0 ? 1 : 0)`（脚本 L331）：`registryCheck()` 返回异常条数
  （`return bad.length`），异常 >0 时以 1 退出，非零情形**真实传导**；仓库根定位失败路径
  （L26 `process.exit(1)`）不受影响。本机 46/46 一致对应 exit 0，与逻辑吻合。修复成立。

## 五、environment.rs disk_space 双辖区细读（15fa959）

### 5.1 实现侧（src，净 15 行，与合并宣称一致）

- `check_disk_space(&self)` → `check_disk_space(&self, zone: Zone)`：原硬编码 `Zone::Create`
  改为透传参数，**检测逻辑本身（free_disk_bytes、错误码、facts）零改动**。
- Play 辖区清单尾部新增 `self.check_disk_space(Zone::Play)`（play 尾），Create 侧保持
  `check_disk_space(Zone::Create)`（create 尾）；模块 doc 注释同步说明「同一次磁盘观测在两辖区
  各报告一条，同一稳定 id，逐区条目」。
- **无新增 expect/unwrap**，无隐藏行为变化；纯参数化＋清单增补。

### 5.2 测试侧（38 行，3 个既有测试增强，无空转）

1. `orc_env_disk_space_reads_real_free_bytes_via_kernel32`（真机 kernel32 读数）：在既有 Create
   断言（Detected、`freeBytes > 0`、`totalBytes >= freeBytes`）之上**新增 Play 区同断言**
   （`inspect_zone(Zone::Play)` → disk_space Detected）——双区真覆盖，非仅 id 出现。
2. `orc_env_disk_space_reports_unsupported_platform_honestly`：新增 Play 区同样断言
   `DetectionFailed`＋`UNSUPPORTED_PLATFORM`——失败态按失败呈现，双区一致。
3. `orc_ipc_002_full_snapshot_has_all_checks_with_stable_ids_and_zones`：ids 清单更新为 18 项，
   `disk_space` 出现两次（play 尾＋create 尾，次序钉死）；zone 配对由 id 白名单改为按索引
   （0..=12 play / 13..=17 create），其上有顺序钉死的 ids 断言护栏且注释自释——略脆但有护栏，可接受。
   测试内 `expect`/`unwrap` 属测试惯例，非滥用。

### 5.3 消费者与诚实纪律

- 同一 stable id 现在每快照出现两条（play+create）。全仓 grep：wire 消费测试用 `contains`（无
  id 唯一性假设）；桌面端不按 id 消费环境快照条目（`apps/desktop/src` 无 `disk_space` 引用；
  `insufficient_disk_space` 属 import 守卫的无关域）。**无 id 碰撞风险**。
- 新增 `crates/provider-host/tests/environment_snapshot_wire.rs`（BG-16 接线）诚实：合成根明确
  标注「nothing real is probed」；未接线时断言 `items == []`（诚实空态，引用 B6 冻结口径
  「空列表绝不是 ready 判定」）；无真机宣称、无越权断言。
- 合并记录宣称（15fa959：src 15 行＋测试 38 行）与 `git show 15fa959 --stat` 实际完全一致。

## 六、问题清单

### 阻断项

无。

### 非阻断项（不构成推送前置）

- **N-1（环境条件）**：首跑 `check` 的 cargo release 步因**运行中的用户桌面会话**占用
  `target/release/vua-orchestrator-provider.exe` 失败（os error 5）。经隔离 `CARGO_TARGET_DIR`
  重跑全链通过，非代码缺陷。建议：门类运行避开应用在线时段，或后续考虑 build 产物名/路径解耦。
- **N-2（覆盖重新归档，提醒 M 门）**：eac_terminate 4 件转 `#[ignore]` 真机手动件＋
  eac_allowlist_verify 1 件转 `test-hooks` 门控后，**默认 495 集不再含任何真实 EAC/进程终止
  交互**。该变化系操作者指令＋同源纪律（文件头附手动运行命令），非静默缩水；但后续 M 门/真机
  走查清单应把这 5 件保持在册。
- **N-3（脆弱度）**：ipc_002 的 zone 配对改按索引区间，依赖上方 ids 顺序断言护栏；后续增删
  检查项时需同步两处。可接受，提示维护者。
- **N-4（外观）**：`environment_snapshot_wire.rs` L151 `run_snapshot(&database, None, )` 尾随
  逗号＋空格，无害。

## 七、结论

构建与测试证据主项全部以两次可复现的真实运行收口：**cargo test 67/495/0×2 一致且账目闭合、
clippy 零告警、桌面全链 EXIT=0（环境干扰已隔离并如实归因）、registry-only exit 0 且修复核验成立、
disk_space 双辖区实现与断言诚实**。Verdict：**通过（可推送）**。本报告为唯一落盘文件。
