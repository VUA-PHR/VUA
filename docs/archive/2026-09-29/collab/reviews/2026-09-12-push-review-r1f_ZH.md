# 推送门独立审阅报告（回溯复审 r1f，第 1 轮 / 共 3 轮）

- 日期：2026-09-12（审阅窗口实际执行于同日晚间会话）
- 审阅者：独立 Reviewer（r1f 重启轮；前例因账户限额中断未产出，本轮独立完整执行）
- 对象：`origin/main` 范围 `388d0d3..246848c`（第 5/6/7 代推送门合并内容，含 #22 兑现批 d02bd09／B5② 文案批 9710c18／环境 v0.2 引用跟随批 c24355e／桌面 D-6 接线批 bc0ba49 及状态与簿记件）
- 方法：只读审阅＋本机真实复跑（cargo / pnpm / gh），全部结论以命令输出为据，不接受文字转述。

## Verdict

**有条件通过。** 三批实质内容与全部核查宣称经独立证据逐项核实成立（含本机复跑全绿与 CI 回读逐字核对）；发现 1 项中等严重度 CI 簿记缺口（schema-vectors 工作流权威清单未随新契约测试扩展）与 2 项低严重度文档卫生问题，均不触及已推送内容的正确性，由责任角色修复后复验即可。无安全问题、无付费资产或凭据泄漏迹象、无端到端虚报。

## 审查范围（真实数字）

- 提交：`git log --oneline 388d0d3..246848c` = **31 提交**（**19 非合并**），与簿记宣称的各世代构成一致（第 5 代 2 提交／第 6 代 9 提交／第 7 代 7 提交＋slot 侧件）。
- 文件：`git diff --stat` = **37 文件，+1907 / −240**。
- 实质批四件：d02bd09（#22 兑现，14 文件）、bc0ba49（D-6 接线，14 文件）、9710c18（B5② 文案，4 文件）、c24355e（v0.2 引用跟随，3 文件）；余为 collab 状态/簿记与合并件。
- 合并卫生：三个宣称 collab-only 免测的合并（fa87b8d / 9186785 / fa86bb0）经 `git diff <merge>^1 <merge>` 核验，各自只带入 1 个 `collab/state/wt-*.md` 文件，零夹带；三个实质合并（22ca5b9 / 33f9060 / 0866908）带入文件集合与各自宣称逐一相符。

## 逐项证据

### 1. D-6 接线批：project-ops v0.2 消费链一致性 —— 成立

- **十码守卫闭集对齐**：冻结件 `schemas/project-ops/v0.2/result.schema.json:68-80` guard enum 共 10 项（v0.1 七项＋`project_not_found`/`not_vua_native`/`identity_unreadable`）；TS 镜像 `packages/contracts/src/application-contract.ts` 中 `ProjectOpsGuardV02 = ImportCopyGuardV01（7 项，:971-978）＋ 3 新项`，逐字一致，无多无漏。
- **命令/结果面镜像**：`ProjectSetNoteCommandV02`（params 闭集 projectPath＋note: string|null）与冻结 `command.schema.json` setNote 分支（`schemas/project-ops/v0.2/command.schema.json:63-101`：note minLength 1 / maxLength 2000 / pattern `^[^\r\n]*$`）一致；`ProjectNoteStoredV02` 字段名与 `result.schema.json:212-235` noteStored（kind/projectPath/markedAt/note）一致。
- **信封守卫（桌面）**：`packages/contracts/src/desktop-gateway.ts:926-938`——exact-keys＋projectPath 标识符＋note 为 null 或非空单行。守卫注释宣称「长度上限由服务端任务内校验」经核为真：`crates/provider-host/src/provider_host.rs:4040-4051` 任务内校验非空、`chars().count() <= 2000`、无 `\n`/`\r`，与冻结 Schema 三约束逐项对应。
- **路由**：`apps/desktop/src/electron/gateway-router.ts:273-281` setNote 映射 kind=command、Kernel 生成 `note-` 前缀 commandId；`gateway-router.test.ts:657-703` 正例（受理回执透传）＋负例（null 清除合法／换行拒／空串拒／多余键拒）齐备。
- **端口与三态呈现**：`project-ops-port.ts` setNote 走 Gateway 唯一路径、`narrowTaskAccepted` 保守收窄（taskId/correlationId 齐才可信）；fixture `fixture-project-ops.ts` setNote 恒诚实 unavailable（注释：无演示目标，写面结果经 live 读面确认才有意义）。`project-detection-model.ts:106-119` `narrowVuaIdentity` 三态收窄＋不可解释即 null，配 11 断言测试；`ProjectCompatPage.tsx` present 行内查看+编辑、unreadable 只读说明、absent/不可解释不呈现入口，保存后任务中心有界等待 20s，成功判定＝读面 note 与提交值一致，拒绝按读面三态推导（不猜测 detail）——与诚实纪律 1/2 相符。

### 2. #22 兑现批 / proposal 020：schema 不变量与投影语义 —— 成立

- **if/then 不变量**：`schemas/application-contract/v0.1/task-snapshot.schema.json:59-90`——七非完成态（queued/preparing/running/waiting_for_input/paused/**failed**/**cancelled**）→ `not required ["result"]`（cancelled 恒无 result 成立）；state=failed → required error；`result` 声明为 `type: object`（:53-57），null 因类型不符被拒——「成功终态且非 null 才投影」在机器面钉死。`additionalProperties: false` 下 result 为已声明可选字段，向后兼容声明成立。
- **六向量真实约束**：3 正（failed-error-no-result / succeeded-no-result / succeeded-with-result）＋3 负（failed-with-result / nonterminal-with-result / null-result）；`task_snapshot_wire.rs:171-202` 真实读取 schema 目录全部向量按文件名约定驱动 jsonschema 校验，并断言向量恰为 6 件——不是摆设文件。
- **投影按态收窄**：`provider_host.rs:1235-1264`——仅 `Succeeded | SucceededWithWarnings` 且 result 非 null 才 insert（verbatim 克隆，同源同值）；failed 持久化回滚观察载荷不回流由负回归 `failed_snapshot_never_refluxes_a_storage_face_result`（`task_snapshot_wire.rs:301-403`，真实帧环＋存储层种入 failed-with-result 任务）钉死；task.get 与 task.list 双通道均断言。
- **demo 取消诚实写**：`provider_host.rs:1112-1121` `Complete{Cancelled, error: None, result: None}`——demo 任务流注释与状态机证实 demo 只在取消时终态（queued→preparing→running 后持稳等待取消），故该分支仅覆盖取消路径，`Some({"demo":true})` 死数据按提案在**写入层**修复而非投影层掩盖；`task_snapshot_wire.rs:268-299` 真实取消链路断言快照无 result 且过 schema。
- **TS 面与 Rust 面同源**：`application-contract.ts` `TaskDonePayloadV01` 索引签名（`readonly [key: string]: unknown`）＋`TaskSnapshotV01.result?` 可选；3 项类型级消费测试（verbatim 承载／失败面缺席／production 族无自描述键同样承载）。语义与 Rust 投影（state-scoped、null 缺席）一致。
- **协议与登记**：双语修订记录（`docs/protocols/application-contract-v0.1_ZH.md:159-165`、`_EN.md:186-193`）＋任务语义节增补（ZH :81-90）；版本策略符合协议本「版本与演进」条款（:22-26：冻结后破坏性变更须升版、新增保持增量登记＋修订记录＋向后兼容声明）——版本号不动成立。`docs/REGISTRY.md:38` 新增 `schemas/application-contract/v0.1` 行，命名与既有 schema 行同构。

### 3. B5② 文案批：四语不确定性语义 —— 成立

- zh-CN（`apps/desktop/src/renderer/i18n/strings.zh-CN.ts` vpmProject）：「此项目看起来由其它软件管理？接管它可能产生未知后果。」——与用户裁决原文逐字一致。
- en（appears / may have unknown consequences）、ja（可能性があります／かもしれません）、ko（것 같습니다／수 있습니다）——四语等义，均为不确定性表述。
- 旧强断言清除：全 i18n 目录 grep「接管它的包清单／不改动任何文件／adopt its package list／without touching／引き継げます／이어받을 수 있」及「VCC / vpm」归因字样＝**零残留**；`migration.note` 小字未动（diff 证实）。

### 4. 环境 v0.2 引用跟随批（c24355e）—— 成立

- `crates/project-manager/src/import_copy.rs:44-49` `IMPORT_OPS_SCHEMA_VERSION = "0.2"`；grep 全 crates 仅定义＋lib.rs 重导出两处，**无值路径消费**（与「库面声明、wire 信封版本归 provider 路由组装」宣称一致——provider_host.rs:1556 自有 `PROJECT_OPS_SCHEMA_VERSION = "0.2"`）。
- 测试引用全部指向 `schemas/project-ops/v0.2/`；apply-missing-digest 负例改为自 v0.2 apply 向量程序化移除 `confirmedPlanDigest` 构造（`tests/import_copy.rs` example_vectors 用例）——v0.2 examples 目录确认无该文件、构造后仍断言拒绝，**核非放宽**。

### 5. 诚实纪律与簿记 —— 成立

- **proposal 020 状态流转**：git 历史三点核验——d02bd09（核心批）status=讨论中 → 0866908（合并进 main）仍=讨论中 → **29b6f03（集成簿记）才翻转为「已接受（集成验收冻结）」并落验收节**。翻转由集成验收触发、附复跑证据，非核心自封。
- **状态文件自我更正**：29b6f03 宣称的「无待验收队列表述书写时为真、同 tick 新交付到达后如实更正」在 `collab/state/wt-main.md` 当前内容中有对应更正文本。
- **无端到端虚报**：各验收记录均显式「不宣称端到端」；CI 回读以 run 号＋时长留证。**CI 回读独立核对（gh run list）**：29b6f03 世代四绿 rust 34656656801（5m55s）／ts 34656656755（3m51s）／schema-vectors 34656656811（4m32s）／collab-registry 34656656853（20s），d8efbe3 世代三绿 34655323316 / 34655323314 / 34655323504——与 BOARD 推送记录节逐字一致（含 run 号与时长）。
- **registry**：`pnpm collab:brief --registry-only` → 「一致 50 项 / 异常 0 项（共 50 行）」EXIT=0，与预期 50/50（application-contract 行新增）相符。
- **状态文件结构**：五份（wt-main/wt-2/wt-3/wt-4/wt-6）front-matter 五字段齐；必备节均在（wt-3 以「待办队列」承载交付记录、wt-6 增「待命声明」节，为既有变体）。wt-5 未在本批改动，结构完好但 brief 标记失鲜（baseline 落后其分支尖 14 提交）——既有观察，非本批引入。

### 6. 本机真实复跑（审阅者独立执行，2026-09-12 晚间）

| 命令 | 结果 | 对比宣称 |
| --- | --- | --- |
| `cargo test --workspace`（pipefail） | **68 套件 ok / 505 通过 / 0 失败，EXIT=0** | 29b6f03「cargo 68/505/0」逐字一致 |
| `cargo clippy --workspace --all-targets -- -D warnings` | 零告警，EXIT=0 | 「clippy 零告警」一致 |
| `pnpm --filter @vua/contracts check` | 3 文件 / **38 测试全过，EXIT=0** | 「contracts 38/38」一致 |
| `pnpm --filter @vua/desktop typecheck` ＋ `vitest run src` | **61 文件 / 486 测试全过，EXIT=0** | 第 5 代门「桌面 61/486」一致（D-6 桌面改动在本范围内，故复跑） |
| `pnpm collab:brief --registry-only` | 50/50，EXIT=0 | 预期相符 |

（注：桌面 check 全链中的 build/check:leak 等重步骤本审未重复执行——非宣称复核项且 vitest＋typecheck 已覆盖 D-6 改动的测试与类型面；如需全链指纹级复跑留待后续轮。）

### 7. 安全/合规机械扫描 —— 干净

- 范围新增行 grep：`password|secret|token|cookie|bearer|api[_-]?key|AKIA|BEGIN RSA/OPENSSH|\.env` → **零命中**。
- ≥32 位 hex 串仅 1 个：`9f86d081…0f00a08`（succeeded-with-result 正例向量的 planDigest）＝ SHA-256("test")，公开测试值，合成数据。
- 新增色值 / CSS 变量：**零**。向量内路径（如 `C:/Vault/Outfits/SyntheticOutfitB`）均为合成示例。

## 问题清单（按严重度）

1. **[中] schema-vectors CI 权威清单未随新契约测试扩展**。`.github/workflows/schema-vectors.yml` 自身头部规则（第 6-8 行）要求「凡新增真实读取 `schemas/` 的契约测试必须扩展下方权威清单」，而 `crates/provider-host/tests/task_snapshot_wire.rs`（:23-33 读 schema、:174-201 遍历 examples）真实读取 `schemas/application-contract/v0.1`，vua-provider-host 清单行（:73）未加入 `--test task_snapshot_wire`。后果：29b6f03 世代 schema-vectors badge（34656656811）四绿为真但**未运行该新测试**（覆盖由 rust job 的 `cargo test --workspace` 兜底，CI 整体覆盖无缺口）；另同文件注释块 :53「import_copy (project-ops v0.1)」在 v0.2 跟随后已过时。修复责任：集成（CI 域）。
2. **[低] 协议本文档头「更新/Updated」日期未刷新**。`docs/protocols/application-contract-v0.1_ZH.md` 与 `_EN.md` 头部仍标 2026-09-04，而 2026-09-12 修订记录已入正文（修订记录本身完整，REGISTRY 校验不查此字段故 50/50 仍过）。修复责任：核心。
3. **[低] 状态文件超长漂移（既有，本批加重）**。`collab/README.md` 规定覆盖式、非追加、上限约 60 行；实测 wt-main **753 行**（批前 611）、wt-2 **508 行**（批前 486）、wt-4 223 行——大量「前情」历史驻留文件内，违反「历史不进文件」规则。非本批引入，但本批继续加长。修复责任：各树角色于下次状态批收敛。

**观察项（不计严重度，供责任角色参考）**：

- failed-requires-error 不变量仅有正向向量（valid failed 携 error），无 failed-missing-error 负例——提案 §4 向量计划即如此定义，交付与提案一致；后续如补第七向量更稳。
- `ProjectCompatPage.tsx` 等待效应依赖 `taskCenter.tasks` 快照，等待期内任务中心其它变动会重复触发 `refreshAfterNote`（幂等重复调用、终值相同，无诚实性影响）。
- 清除备注（`saveNote(null)`）在「本就无备注」项目上若任务失败，读面 `note===null===提交值` 会判 savedConfirmed——读面事实与请求终态一致，属可接受语义，记录备查。
- wt-5 失鲜（brief 已标记，非本批范围）。

**给用户的裁决请求**：无（本批无 [需用户] 事项；在途 U10/W25 等用户项与本审阅范围无关）。

## 结论

`388d0d3..246848c` 三世代的实质内容（D-6 消费链／B5② 文案／v0.2 引用跟随／#22 兑现）与全部可核查宣称经本审独立证据逐项吻合：冻结件不变量在机器面与实现面双侧钉死、向量真实驱动校验、状态翻转由验收方触发、复跑数字逐字一致、CI 回读可对账、扫描干净。发现的缺口集中在 CI 工作流簿记与文档头日期（M-1/L-1）及既有的状态文件长度漂移（L-2），不构成回滚或打回理由。**有条件通过**：M-1 修复后建议由下一轮独立 Reviewer（r2f）复验 schema-vectors 清单扩展；L-1/L-2 随责任角色下批收敛。
