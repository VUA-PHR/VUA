# 推送门独立审阅 r1d（第 1 轮 / 共 3 轮）

- 日期：2026-09-12（r1d 轮）
- 审阅对象：待推送增量 `bc59453..main`（尖端 34eddaf）
- 审阅者：独立审阅者（r1d）；本轮证据独立取证，结论独立给出
- Verdict：**通过**（0 阻断 / 5 非阻断；理由见下）

## Verdict

**通过。** 增量构成与宣称逐项一致（20 提交 / 30 文件 / +1466/−466，尖端 34eddaf，origin/main=bc59453）；BG-18 守卫修复经语义审读确认**只收紧不放宽**，014 冻结拒绝码闭集在代码与 schema 两侧均未触碰；桌面三交付批（生产链接线 / BG-20 确定性 / BG-15 检查页骨架）与 BOARD 及提交信息宣称一致；全部真实验证命令本机复跑通过。发现 5 项非阻断观察（呈现细节与注释/措辞漂移），无一构成诚实纪律违反或守卫语义变化，不构成推送阻断。

## 审查范围（真实数字）

- 增量：`git rev-list --count bc59453..main` = **20 提交**；`git diff --name-only` = **30 文件**；diff --stat 尾行 **+1466/−466**；工作树 porcelain 干净。
- 内容构成：非合并非 docs 提交恰 5 枚（5328099 / 80052d6 / 7a1af41 / b3b9833 / 38dc36c），与调用方口径的交付清单一一对应；其余为合并与 collab/ 状态批。
- schemas/ 与 docs/REGISTRY.md 在本增量中 **零改动**（契约面未动，无夹带冻结变更）。

## 逐项证据

### 1. 桌面三交付批（8c799a5 合并，内容与宣称一致性）

**链身份保留（AC-05 / AC-07 / AC-13）**

- AC-05 闸门纯派生：`apps/desktop/src/renderer/app/production-chain-store.ts:146-152` `productionChainGate(chain, draftDirty)` 为纯函数（no-recipe / stale-draft / ready 三态，不改状态）；测试锚定见 `production-chain-store.test.ts:37-40`（dirty⇒stale、对齐后恢复 ready）。组件侧推进按钮在 stale 时全部禁用（`ProductionChainSection.tsx:200,217,245,254`）。
- AC-07 零本地计时：`ProductionChainSection.tsx` 全文无 `setTimeout`/`setInterval`（grep 零命中）；任务行 `ChainTaskLine`（:42-54）从 `useTaskCenter()` 权威快照按 taskId 查找，缺失时呈现 missingNote，不本地推断；「已受理」态从不渲染为成功文案（UI-06）。
- AC-13 记录身份匹配：`production-chain-model.ts:10-15` `chainRecordsForPlan` 按 `entry.planId === planId` 过滤；测试 `production-chain-model.test.ts:16-23` 明确钉死「不跳固定历史示例」（异链记录被滤除、本链无记录=空数组不回落历史）。

**端口诚实装配（fixture 无生产链演示目标）**

- `gateway/production-chain-port.ts:214-226` `createUnavailableProductionChainPort()`：七方法全部返回 null、capability 报 unavailable——fixture 与 not-run 共用此实现。
- `gateway/fixture-gateway.ts`（增量 diff）：productionChain **无条件**接 unavailable 实现，无任何场景分支模拟生产链数据；`gateway/empty-gateway.ts`（not-run）同。
- `gateway/create.ts`（DEV 混装）：productionChain 恒 live 基线；`gateway/electron-gateway.ts` 接 `createLiveProductionChainPort(host)`。收窄失败（响应不可解释）返回 null 由调用方如实呈现（`narrowTaskAccepted` 等八组收窄函数，:55-209）。

**Inspection 页诚实空态（BG-15）**

- `features/inspection/InspectionPage.tsx` 全文 43 行：报告/证据/下一步三区全部为 EmptyState 或说明文字，**零数据渲染、零 Gateway 调用**——「无事实源不渲染检查数据」以最严格形态满足。
- official_sdk_rating 保留值纪律：桌面 src 无该标识符消费（grep 仅命中 schema 与 collab 记录）；i18n 空态文案明示「官方 SDK 结论为保留值，交接切片落地前不呈现」（`strings.zh-CN.ts` inspection.localVsOfficialNote），与 `schemas/inspection-evidence/v0.1` schema 中 basis 闭集的保留值定义一致。

**四语 i18n 齐**

- 四个 strings 文件增量各 **+54 行**完全对称；结构键由 `Strings` 类型编译期强制＋`scripts/check-i18n-tables.mjs` 插值校验（均在 `pnpm check` 内通过）。

### 2. BG-20 确定性三点（80052d6）

- 时钟参数化：`compose-draft-store.ts` `composeAddItem(state, item, now)` 增必填 `now` 参数，`composeAddItemAction` 在命令边界注入 `new Date().toISOString()`——纯函数体内无时钟读取。
- undo 回空草稿 dirty 语义：`composeUndo` 改为 `dirty: previous.length > 0 || state.saved !== null`（从未保存回空=false；已保存后回空=true）。
- addedAt 断言：`compose-draft-store.test.ts` 新增 `T0/T1` 固定时钟、`expect(s1.items[0]?.addedAt).toBe(T0)`、同输入恒同输出（toEqual）断言，及 undo-dirty 双分支专测（:66-79）。
- 编号说明：提交 80052d6 信息与代码注释仍写 BG-18；BOARD:144 已如实登记重编号 BG-18→BG-20（「重编号时无任何树引用过该号」）。见非阻断 #2。

### 3. BG-18 修复守卫语义（38dc36c，34eddaf 合并）

- **只收紧不放宽**：`import_copy.rs:195-214` 新 `normalize()`——存在路径走 canonicalize（行为同旧）；不存在路径改为「最深存在祖先 canonicalize＋回拼缺失尾部＋strip_verbatim＋盘符大写」。旧缺陷（不存在目标回退字面拼写，runner TEMP 8.3 短名 `RUNNER~1` 与 source 展开长名 starts_with 不命中→守卫漏拒）只可能被**多**拒不可能被**少**拒：source 在守卫时点必已存在（SourceInvalid 前置检查 manifest 文件），source 侧规后面不变；target 侧规后面由「字面拼写」变为「canonical 面」，前缀命中集单调扩大。无任何原拒绝码路径被移除或改宽。
- **014 冻结拒绝码闭集不变**：`RejectionGuard` 七值七码逐一比对未动（`import_copy.rs:58-79`）；`schemas/project-ops/v0.1/result.schema.json` 在本增量零改动。
- **回归测试覆盖**：`tests/import_copy.rs` 新增 `target_inside_source_guard_survives_runner_path_spellings`——控制组（明文拒绝，全平台）＋Windows 三形态：盘符小写、verbatim `\\?\` 前缀、8.3 短名（GetShortPathNameW 实取）。本机 C: 卷存在 8.3 短名（`%~sA` 展开为 `DOCUME~1` 形态），故本地 496 通过的运行**真实执行了短名分支**，非仅 CI 才覆盖。
- **能力检测非变相跳过**：`short_path` 返回 None 或与原路径相同时跳过的仅是**测试侧**该形态断言（该卷上不存在可区分的短名拼写），且盘符/verbatim 两形态在该卷仍执行；**生产侧 normalize() 对所有形态无条件处理**，不存在任何跳过关卡路径。工单红线（禁止以跳过/忽略测试过关）未触碰——测试本体无条件运行且全绿。
- windows-sys dev-dep 备案齐全（`Cargo.toml`：windows-only dev-dependencies，owner/purpose/移除路径注释在案）。

### 4. 诚实纪律抽查

- 无端到端宣称：wt-3.md:58 与 wt-main.md:70 明文「无端到端宣称（真机走查待 W25/用户实测）」；W25 状态为用户明示延期（wt-6.md:42、wt-main.md:13/38）；wt-4/wt-5 中「端到端」字样均为未来冒烟路径**定义**（工单表行），非已运行宣称。
- BG-19 零行为变化：`material_task.rs` 全增量恰一行——`unwrap_or_else(|_| serde_json::Value::Null)` → `unwrap_or(serde_json::Value::Null)`（无捕获常量闭包≡常量，语义恒等）；b3b9833 提交仅触该一文件一行。
- 状态文件结构：wt-2/3/4/5/6 各恰 2 个 `---` 分隔线（单一 front-matter）；collab 状态目录与 BOARD 无冲突标记（grep 零命中）。

### 5. 真实验证命令（本机复跑）

| 命令 | 结果 |
| --- | --- |
| `pnpm collab:brief --registry-only` | **exit 0**；登记表校验一致 46 项 / 异常 0 项（共 46 行） |
| `pnpm collab:brief`（全量） | **exit 0**；阻塞/留言/工作树状态正常输出，无失鲜告警 |
| `cargo test --workspace`（两轮） | 全绿；计数轮 **496 通过 / 0 失败**（与 34eddaf 宣称「496=495 基线+1 回归」逐位一致） |
| `cargo clippy --workspace --all-targets` | **exit 0**，零 warning 零 error |
| `pnpm --filter @vua/desktop check`（apps/desktop 内 `pnpm check`） | **exit 0**；vitest **60 文件 / 474 测试**全绿（与 BOARD 验收口径 474 一致）；contrast 全达标；**check-leak 159 指纹生产构建零泄漏** |

## 问题清单

### 阻断

（无）

### 非阻断（按严重度降序）

1. **查询失败时空态与失败注记并列渲染**（`ProductionChainSection.tsx:221-233` 计划区、:295-302 记录区）：`result===null` 时 `setPlans([])`/`setRecords([])` 且 failed=true，界面同时呈现 role=alert 失败注记**和**「暂无计划/暂无记录」EmptyState。失败已如实标注（诚实纪律第 2 条成立），但「结果未知」时同屏出现「暂无」断言，边际可读性/诚实瑕疵；且提交信息「failures never fold into empty lists」与字面 `setPlans([])` 行为有措辞落差。建议后续切片将 EmptyState 以 `!failed` 为前置。
2. **BG-20 编号残留**：`compose-draft-store.ts` 及其测试的注释仍写「BG-18」（时钟注入/undo dirty/确定性共 4 处），提交 80052d6 信息亦保留旧号；BOARD 已登记重编号经过。属文档一致性小瑕疵，建议随下次触碰该文件时顺手更正。
3. **live 端口 capability 占位不符**：`production-chain-port.ts:277` live 实现 `capability()` 恒返回 `unavailable/detectorsMissing`，与 live 实际接线不符；当前无消费方，属接线完成后须修正的占位。
4. **34eddaf 提交信息措辞漂移**：「short-name/**size**/case/verbatim forms」中 size 一词在回归测试中无对应形态（实际覆盖 control/case/verbatim/short 四种）。
5. **model 注释与收窄不符**：`production-chain-model.ts:17`「无批准时间的 draft 保持稳定次序」——端口收窄（`narrowPlanListEntry` 要求 approvedAt 非空字符串）下不存在无批准时间形态，排序恒为批准时间降序；注释描述了不可达分支。

## 给用户的裁决请求

（无——本轮未发现需用户裁决事项）

## 结论

增量内容与全部宣称一致，守卫修复方向性正确且经真实测试运行钉死，诚实纪律（无端到端宣称、失败如实、fixture 不模拟生产链、检查页零数据渲染）在本机可核验范围内全部成立。5 项非阻断观察建议路由桌面/环境角色后续消化，不阻碍本轮推送门。后续 r2d/r3d 轮可重点跟进：BG-18/BG-19 销账所依赖的推送后首个 rust CI run 事实（本审阅无法替代 CI 证据）。
