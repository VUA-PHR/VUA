# 推送前增量复审报告（第 1b 轮 / 共 3 轮）

- 日期：2026-09-12
- 审阅对象：增量 `88dd71d..main`（main 尖端 `9e87f8e`）
- 审阅者：独立 Reviewer（r1b，独立取证、独立结论；未参考同日平行的 r2b 报告）
- 性质：只读审阅；除本报告外未写任何仓库文件、未 commit、未 push、未切分支。
  唯一的环境动作：终止了一个阻塞验证的本机陈旧进程（见 §5 备忘，不触碰仓库树）。

## Verdict：**通过（可推送）**

三轮验证矩阵（cargo 67 套件全绿 / clippy 零警告 / desktop 全链双跑 exit 0）全部
本机独立复现且两次稳定一致；增量内全部实现批与提交宣称逐项相符；诚实纪律抽查
（草案标注、保留值、空态、失败如实）零违规。1 项低严重度问题（`.zcode/` 本地路径
暴露）与 1 项范围外观察（既有 fixture 本地路径）不构成推送前置。

## 一、审查范围

- `git log --oneline 88dd71d..main | wc -l` → **95 提交**；`git diff --stat
  88dd71d..main` → **55 文件，+2226 / −283**。与任务简报数字一致。
- 主要构成（log 全量枚举后归类）：E2 disk_space 双辖区（15fa959＋3489276）、
  019 批 B 保存链（f0bc0ee/cbe8fa6/b243a1d）、019 批 C 生产链端口层
  （65c57d4/b581cf3）、W24 recovered 呈现（1c27f0d）、BG 修复批（87ae6a9/
  43ea8d2/93d8c6a/156640b/53a1bc2/91d9c3e/0c72258/dc6aa93）、BG-7/8 collab-brief
  修复（0b8bebb）、BG-9 CI 矩阵扩展（eeb42c6）、BG-13 提案头卫生＋路径消毒＋
  r1/r2/r3 报告归档（949ee30）、E3/E4 链（4da7e43/f7cb3ab）、四项 UX 缺口登记
  （00f59c6）、夜间任务分配（7f99628）及各状态批；`.zcode/agents/` 七件新文件
  随 7a0a1ec 合并进入。
- 推送上下文：`origin/main` 仍指 `7da1b5f`（09-10 三轮通过后尚未推送），本次
  推送实际范围 `7da1b5f..9e87f8e`；本报告仅对增量 `88dd71d..9e87f8e` 负责，
  `7da1b5f..88dd71d` 由 r1/r2/r3 负责。

## 二、验证运行（全部本机独立执行；关键数字两次稳定复跑一致）

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 全局状态 | `pnpm collab:brief` | **exit 0**；登记表校验 46/46 一致 |
| 登记表 | `pnpm collab:brief --registry-only` ×2 | **exit 0 / exit 0**；两次均「一致 46 项 / 异常 0 项（共 46 行）」 |
| Rust 全量 | `cargo test --workspace` ×3 | 三次一致：**67 个 `test result:` 行全部 ok，495 通过 / 0 失败，exit 0**。与合并批宣称「67/67 workspace green」相符 |
| Clippy | `cargo clippy --workspace --all-targets -- -D warnings` ×2 | **exit 0 / exit 0**；两份日志 0 warning 0 error |
| 桌面全链 | `pnpm --filter @vua/desktop check`（即 `typecheck && test && build && check:boundary && check:i18n && check:contrast && check:leak`）×2（串行） | **EXIT=0 / EXIT=0**；两轮均：Test Files **57 passed (57)**、Tests **455 passed (455)**、`check-boundary: OK`、`check-i18n: OK`＋`check-i18n-tables: OK — 3 个交付语言表与源表对齐`、`check-contrast: 全部达标`、`check-leak: 通过(159 条指纹,生产构建零泄漏)`。与合并批宣称「57 files 455 tests + boundary + i18n + contrast + leak 159 zero」逐项相符 |

BG-7 修复的独立负例验证（临时 git 副本，仓库外，不触碰主树）：复制
`scripts/collab-brief.mjs`＋`docs/REGISTRY.md`＋`schemas/` 至临时目录，将其中
一行版本改坏后运行 `node scripts/collab-brief.mjs --registry-only` →
**exit 1**，且输出定位了被改坏的行（「版本 REGISTRY=0.0.1 vs 头部=…」）。
修复后代码 `process.exit(registryBad > 0 ? 1 : 0)` 替代原先被 `process.exit(0)`
无条件覆盖的 `exitCode` 赋值——假绿缺陷确已修复，负路径真实生效。

## 三、逐项内容审阅（宣称 vs 实文）

| 批次 / 提交 | 宣称 | 实文核查 | 结论 |
| --- | --- | --- | --- |
| E2 disk_space（15fa959） | environment.rs 15 行＋测试 38 行；同一稳定 id 逐区报告（play 尾＋create 尾） | diff 实测 `environment.rs` 15 行改动（`check_disk_space(zone)` 参数化，两辖区各报告一条）、`tests/environment.rs` 38 行（play 区断言×2＋orc_ipc_002 序列 18 项＋索引配对断言重写）——与宣称精确一致；wc 中模块头辖区注释同步 | 一致 |
| 019 批 B（f0bc0ee/cbe8fa6/b243a1d） | nameHint 用户输入（零词表扩展）；composeSaved 扩 recipeId；saved 身份入容器层跨 UI 根保留；失败保留内容可重试 | `compose-draft-store.ts`＋121（nameHint 字段、`composeSetNameHintAction`、`composeDraftToSaveDocument` recipe v0.3 映射、`composeSaved(state, recipeId, revision)`）；`ComposePage.tsx`＋92（saving/failed 状态机、`role="alert"` 失败呈现、`role="status"` 已保存仅回执后显示）；b243a1d 单提交 ComposePage 恰 16 行；四语 i18n 键齐（savingCta/saveFailedNote/savedNote/nameHint×2） | 一致 |
| 019 批 C（65c57d4/b581cf3） | live 消费七方法、字段存在性收窄、259＋139 行 | `production-chain-port.ts` 新文件 259 行：七方法（recipe.resolve/plan.approve/plan.get/plan.list/job.execute/record.get/record.list）全经 `GatewayClient.invoke`，无直触 Electron/Node；收窄失败如实返回 null；测试 139 行真值表（含词表外条目滤除、total 非整数 null） | 一致 |
| W24（1c27f0d） | BuildRecordCard 11 行＋四语 | diff 实测 11 行（recovered 徽章＋note，不改六态投影）；四语 recovered_badge/recovered_note 齐 | 一致 |
| BG-14（53a1bc2） | check-leak 注释过度声明修正，纯注释 | diff 仅注释行（+5/−3）：由「不纳入指纹集避免常量性误报」修正为「本断言仅覆盖 fixture 负载字符串；不覆盖 DEV 分支构建期剔除」——与 check-leak.mjs 实际行为相符，过度声明已收回 | 一致 |
| BG-16（0c72258） | getSnapshot 消费真实检测引擎；未接线＝诚实空 | `provider_host.rs`：`EnvironmentConfig` 注入 `EnvironmentEngine::inspect_all()`；`None` 分支返回空 items（注释明示「空列表不是 ready 判定」）；新测试套件 `environment_snapshot_wire.rs`（155 行）合成根＋未接线双态断言 | 一致 |
| BG-12 核心（91d9c3e） | 八处序列化吞错改 expect＋不变量注释；消灭伪造 rejected 文档 | `provider_host.rs` 内 `unwrap_or_else(|_| json!({"kind":"rejected",…}))` 伪回执全部替换为 `expect("… serialization cannot fail")`＋不变量注释；`acquisition/warehouse_download_adopt.rs` 同类两处（含 `unwrap_or(Value::Null)` 静默 null Done 负载） | 一致 |
| BG-17＋BG-12 数据（43ea8d2） | ISO 序序断言 51 行钉住格式漂移；adopt 吞错修复 | `downloads_list_serving.rs`＋51：乱序 ingest→completedAt 升序断言＋混合格式漂移已知限如实声明；adopt 侧见上行 | 一致 |
| BG-10（30da5b6） | 排序对齐最旧先声明；存储失败如实传递不折叠为空 | `overlay_surface.rs`：`task_cards()` 返回 `Result`，删除 `unwrap_or_default()` 与 id 字母序重排（注释证成 store 原生 ORDER BY created_at 即入队序）；乱序回归测试钉住（mike/alpha/zulu 断言）；「读失败折叠为空＝把失败装扮成空态」纪律注释入档 | 一致 |
| EAC 门控（dc6aa93/156640b） | test-hooks 特性门控＋真机终止测试改 ignored 手工件；windows 合取对齐 | `Cargo.toml` 新 feature `test-hooks`；两个钩子 `#[cfg(all(windows, any(test, feature = "test-hooks")))]` 定义与再导出两侧一致（156640b 修复了悬挂的 re-export cfg）；eac_terminate 四个真机测试 `#[ignore = "真机手动验证件…"]`＋手动运行说明 | 一致 |
| E3（4da7e43） | live runCheck＝重取快照，C-ENV 状态机语义保留 | `electron-gateway.ts` 注释与实现：`runCheck: () => fetchView().catch(…)`——重取快照、失败降级为快照形态，不复制 fixture 的模拟迁移 | 一致 |
| BG-9（eeb42c6） | CI 矩阵扩至当前全部契约锚 | workflow 逐 crate 列出全部测试目标，与 crates/tests 实存套件名一一对应；**inspection_evidence_vectors 行内明注「v0.1 DRAFT — drift protection only; draft state does not imply freeze」** | 一致且草案态标注到位 |
| BG-13（949ee30） | 提案头对齐 BOARD；路径消毒 9 处；r1/r2/r3 归档 | 009/011/012/015 头部改为「已接受·…」并保留原注记，与 BOARD #10/#11/#13/#14/#15 记录相符；019 源文档指针 `C:/Users/AR/…`→`C:/Users/<本地用户>/…`；三份旧报告已入 `collab/reviews/` | 一致 |
| 四项 UX 缺口（00f59c6） | 只登记不实施 | wt-3.md「待办队列」节四项全登记，无实施夹带 | 一致 |

## 四、诚实纪律与文档治理抽查

1. **proposal 016 草案态**：schema 未入 REGISTRY（`--registry-only` 46/46 通过、
   collab-brief 反向盲区检查豁免清单内注释「016 草案态，冻结时登记」）；CI 消费
   处标注 DRAFT drift-protection-only（见上表 BG-9 行）；BOARD #19 明文「草案态：
   REGISTRY 未动、未标冻结」。**三处一致，无把草案当冻结消费的表述。**
2. **official_sdk_rating 保留值**：全树 grep 仅 `inspection-evidence.schema.json`
   枚举定义处出现（描述内明示 reserved, do not use）；examples 目录 7 件向量零
   使用；crates/ 零引用。**保留值纪律成立。**
3. **空态与失败呈现**：BG-16 未接线空快照＝诚实空（有测试钉住）；ComposePage
   保存失败 `role="alert"`＋内容保留＋可重试，「已保存」仅回执后显示；overlay
   读失败不再折叠为空态（BG-10）；runCheck 失败降级如实。
4. **E2 诚实更正链**：wt-6.md 记载「上轮『零缺项』结论中的 play disk 部分据此
   **修正**」→ 补齐批 15fa959 → 集成复验 67/67。错误结论被如实收回并修复，
   **正向诚实证据**。E4 侧「live walkthrough deferred」（9e87f8e）如实推迟，
   未作端到端宣称。
5. **文档治理**：双语头全部对齐——product-boundary ZH/EN 均 1.3.0 已接受、
   development-outline 均 2.0.11、design-standard 均 0.7.1；REGISTRY 增量 +6 行
   为 BG-8 回填（recipe v0.3、eac-probe/allowlist/terminate v0.1、amf-production
   v0.2、environment-managers v0.1）——**r1 报告 L-1①（eac-terminate 缺登记）与
   L-1②（design-standard 0.7.0 落后）均被本增量闭合**。
6. **collab 状态文件结构**：7 个 `collab/state/*.md` 全部严格 UTF-8 解码通过、
   单一 front-matter（各恰 2 个 `---` 行）、零冲突标记（`<<<<<<<`/`=======`/
   `>>>>>>>`）、无截断（尾部均为完整内容行）。e71957d（wt-main 重建，损坏如实
   记录）与 faace68（二重 front-matter 自纠）两笔结构性自修的终态验证通过。
7. **提交卫生**：增量内零 wip/fixup/squash；`--numstat` 无二进制文件；凭据模式
   扫描新增行仅命中旧报告方法学表格与合成示例 ID（`task-01hexample…`），非真实
   凭据；无 .env/付费资产/媒体文件。
8. **依赖方向**：renderer 新增面（production-chain-port/ComposePage/BuildRecordCard/
   ProjectCompatPage）全部经 `gateway/` barrel 与类型化 Gateway API，`check-boundary`
   通过；provider-host 对 `EnvironmentEngine`（orchestrator core）与
   `VccSettingsFileReader`（project-manager，core 拥有端口）的消费属适配层合法
   依赖；core 未新增适配代码。

## 五、问题清单（按严重度）

### 阻断项

无。

### 低严重度

- **L-1 `.zcode/agents/` 七件新文件携带本机绝对路径且并入合并时未在提交信息中
  提及**。`git grep "Users/AR"` → `core.md`/`data.md`/`desktop.md`/`environment.md`/
  `integration.md`/`production.md`/`reviewer.md` 各含 `C:\Users\AR\Documents\VUA(-N)`
  形态的路径（暴露操作者用户名与 VUA-2..VUA-6 工作树布局）。两个问题：(a) 与
  BG-13 刚完成的 collab/ 路径消毒（`C:/Users/<本地用户>` 占位符）同类暴露
  重新入库，方向相悖；(b) 七件文件随 7a0a1ec（BG-16 接线批）进入，合并信息只
  描述 provider-host 接线＋core state，**未提及 .zcode 内容**——合并信息与内容
  不符（夹带）。文件本身为良性角色提示词（无凭据、无付费内容），不阻断推送；
  建议随后续文档批照 BG-13 方式消毒（或评估 `.zcode/` 是否应入跟踪），并在后续
  合并信息中如实列出非宣称文件。

### 范围外观察（非本增量引入，提请推送决策知悉）

- **O-1（范围外）`apps/desktop/src/renderer/gateway/fixture-release.ts:34,50` 含
  本机真实 Unity 工程路径**（两个本机工程路径字面值已于推送前按
  AGENTS「付费资产/用户工程不出本地」红线消毒为合成名，见 BOARD 推送记录）。该文件最后改动于 ab242fb，是 88dd71d 的祖先——属
  r1/r2/r3（2026-09-10）审阅范围，本增量零触碰（`git diff 88dd71d..main` 无此
  文件）。但 origin/main 尚在 7da1b5f、推送未发生，本次推送将使这两行首次到达
  origin。文件头注已如实声明「本机绝对路径，仅 DEV 经 vite /@fs/ 读取，正式
  实现由资产协议替换寻址」，且 check-leak 159 指纹零泄漏（生产构建不含）。
  不构成本轮阻断；是否在推送前一并消毒（或明示接受），提请操作者裁量。

### 备忘（非问题）

- **本机验证环境**：desktop 全链首轮双跑因 9/11 15:19 残留的
  `vua-orchestrator-provider.exe`（PID 69156，自 target/release 启动）锁定
  `target\release\vua-orchestrator-provider.exe` 导致 cargo build `os error 5`
  两轮 EXIT=101（测试段已过 57/455，败于 build 段）。审阅中终止该陈旧进程
  （taskkill，不触碰仓库树）后串行双跑 EXIT=0×2 全绿。此为本地环境条件而非
  仓库缺陷；另有 2 个 electron.exe 残留进程未处理，建议操作者择机清理。
- `collab/reviews/2026-09-12-push-review-r2b_ZH.md` 已存在于工作树（未跟踪，
  `??`，不入推送范围）。为保持本轮独立性未读取其结论。
- ComposePage 保存按钮要求每项 nameHint 非空，而 `composeDraftToSaveDocument`
  留有 `?? item.title` 回退——该回退在 UI 路径不可达（仅程序化调用可达）。
  无害，仅记录。
- 7a0a1ec 提到「first-run 44-suite count was a merge/cargo startup race, stable
  recount 67」——本机三次实跑均为 67，与稳定复跑结论一致。

## 六、结论

增量 `88dd71d..9e87f8e`（95 提交，55 文件，+2226/−283）通过 r1b 增量复审：
验证矩阵全绿且两次稳定一致、实现与宣称逐项相符、诚实纪律零违规、文档治理
（含 r1 两项遗留的闭合）到位。唯一低严重度问题（L-1：.zcode 本地路径＋合并
信息未提及）与范围外观察（O-1：既有 fixture 路径将随推送首次出库）建议随后续
文档批处理，不构成推送前置。**建议放行推送**，L-1/O-1 的处置可并行征求操作者
意见。

- 本报告：`collab/reviews/2026-09-12-push-review-r1b_ZH.md`（本轮唯一写入文件）
- 关键证据均以文中命令可复现；cargo/clippy/desktop 日志为临时捕获未落盘。
