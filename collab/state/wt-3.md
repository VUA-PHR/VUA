---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 29e972e
role: 桌面
updated: 2026-09-20
---
## 当前焦点
**W25 真机发现第三批·素材来源登记易失缺陷修复切片轮（2026-09-20 13:5x–14:2x，时段
例外延续操作者批；三笔：追平壳〔吸收 main 29e972e〕＋修复切片批 ff71c60 恰 11 文件
＋本状态批恰本文件）——用户 W25 实测缺陷（选文件→点开始检查误报「生产能力当前未
连接，操作未发出」）根因修复，桌面所有权域内交付，全链证据亲测在案**：

- **轮首开工纪律（TICK）**：pnpm collab:brief 13:57 ①区一条指向本树/桌面＝wt-7 留言
  （英韩追加完成、后续合并保留新键与自然措辞）就地消化——本拍四语文案新增键照其
  纪律执行（见下），合并冲突面（若有）候合并时按其留言保留语义；失鲜工作树无。
  操作者指令三事项（登记持久化／误导文案修正／回归测试＋check 全链）全数办理。
- **追平（操作者指令「先合并 main 最新」）**：main 竞速前移至 29e972e（夜窗收官登
  记＋推送记录，全 collab 面），rev-list 实测本树落后 13、领先 0；merge-tree 预检
  exit 0 零冲突标记，--no-ff 追平壳落地（零自有内容纯吸收），合并后与 main diff
  0 行实证，基线刷新 **29e972e**。
- **缺陷根因（用户实测＋代码亲读实证）**：`apps/desktop/src/electron/main.ts` 的
  `materialSources` 仅存主进程内存 Map——应用重启登记即失；渲染层残留的
  materialRefId 成死引用→`resolveProductionContext` 返回 undefined→
  `UnknownMaterialSourceError`→Kernel 回 `vua.material.source_unknown`；渲染层
  `live-production-port.ts` 的 `rejectReasonFor` 无该码映射→如实折叠进
  "unavailable"→`ProductionFlowSection` 落「生产能力当前未连接，操作未发出」误报
  文案。纯本机登记失效被误呈现为能力未连接——两处皆修。
- **修复①登记持久化（新模块 material-source-store.ts）**：落盘 userData 下
  `material-sources.json`（信封 `{schemaVersion:1, savedAt, sources}`），照
  crates/orchestrator/src/state_file.rs 的 write_atomic 惯例（ORC-STO-003..005）：
  同目录 .tmp 先写后 rename 原子写（写后 .tmp 零残留）＋三态读（loaded／absent＝
  空登记／recovered＝JSON 坏·版本不认识·形状非法——原文件改名归档
  `*.corrupt-<毫秒>` 保留原始字节供人工取证，跨版本不猜不修复）；条目形状守卫恰
  path+displayName 两键非空文本。main.ts 接线：进程 ready 后 IPC 注册前载入落盘
  事实（recovered 经 stderr 诊断通道留痕不静默）；拾取注册即写盘，写失败向上抛＝
  本次拾取如实失败（不留「成功但不持久」静默缺口）。**红线照办**：该文件含用户本
  机路径、位于 userData 内不入 git，零脱敏设计（操作者指令明示）。
- **修复②专用拒绝原因（不再误报未连接）**：`ProductionRejectReason` 联合＋全集
  数组新增 `unknown_material_source`（奇偶测试约束保持）；`rejectReasonFor` 映射
  `vua.material.source_unknown → unknown_material_source`（不再折叠 unavailable）；
  四语表 `productionFlow.rejected` 新增键——zh「素材选择已失效,请重新选择。」（操
  作者指令文案，标点照库内半角惯例）＋en/ja/ko 自然措辞（wt-7 合并纪律照其留言保
  留新键）；`ProductionFlowSection` 渲染分流以注释钉死（unknown_material_source ≠
  unavailable，绝不落入「未连接」误报支路）。
- **回归测试（缺陷路径全链钉死）**：`material-source-store.test.ts` 7 例——**重启
  模拟＝写盘与载入经两次独立调用（无共享内存，仅以文件为界），同一 refId 载入后
  仍解析命中**；序号水位自落盘 refId 最高值回收；原子写零 .tmp 残留＋信封合法；
  损坏/未知版本/词表外形状归档不修复。`live-production-port.test.ts` 新增 1 例骑
  真实 Kernel 路由（空登记＝重启态）：残留 refId 的 startInspection 返回
  `{kind:"rejected", reason:"unknown_material_source", run:not-connected}`——恰
  W25 实测失败路径的 TS 面全链复现。
- **定向证据（本拍亲测）**：desktop typecheck 双 0；vitest **788/788**（上世代
  780＋新增 8：store 7＋stale-refId 拒绝 1）；**build 全链绿含 cargo release 段**
  （本窗文件锁未触发——W25 文件锁先例**无需援引**，如实记录非豁免申报）；
  boundary OK／i18n 3 表对齐 OK／contrast 全达标／leak 155 指纹零泄漏／
  forest-leak 通过。切片批恰 11 文件全在本席所有权域（apps/desktop）。
- **诚实边界**：零端到端宣称维持——本修复系 TS 面＋壳面代码事实＋单元/回归测试
  证据；**真机复验（选文件→开始检查→重启→再检查）归用户 W25 走查（O-2）**，本拍
  不宣称真机已验。持久化文件属用户本机运行时数据，不入库不留痕。
- **四环全查（29e972e 观测世代）**：①本树在途＝本拍三笔，无半途切片；②BOARD
  「待用户裁决」区零桌面可办条目（U15 照规则跳过）；③outline 当前窗桌面行＝W25
  在办（本批即响应）；④M 门：M5 开窗中关门候 W25 真机走查；M6/M7/M8 桌面无新解锁
  面（F5 消费仍候冻结外双环，不预接线）。

## 前情（全文见本文件 git 历史）
09-20 08:0x–08:4x F3 消费切片收编关账＋纪律追平轮（7a77785＋d74ff8f，经第 132 批
6558130/cd1b405 收编）；更早：F3 消费切片 92d201e、F3 形状核可 ed6cfe1、W25 真机
窗口 D1–D5 修复批、019 批 D，见 git 历史。

## 本轮交付（29e972e 基线世代）
- **追平壳**（--no-ff 吸收 main 29e972e，落后 13 过线操作者指令追平，预检 exit 0，
  合并后 diff vs main 0 行实证）。
- **修复切片批 ff71c60**（恰 11 文件 350+/6-，全在本席域）：material-source-store.ts
  ＋测试（新增）、main.ts 载入/写盘接线、model-production-port 联合扩员、
  live-production-port 映射＋回归测试、ProductionFlowSection 分流注释、四语表各
  1 键。证据见当前焦点「定向证据」节。
- **本状态批（恰本文件）**。
- 零新阻塞、零新升级项、零 [需用户]。

## 在途/待他角色
- **[等集成] 本拍三笔候随轮验收（--no-ff）**：追平壳（零自有内容）＋修复切片批
  ff71c60（恰 11 文件全 apps/desktop 域，请亲审 diff；定向证据 typecheck 双 0＋
  vitest 788/788＋build 全链含 cargo release＋boundary/i18n/contrast/leak/
  forest-leak 全 OK 在案）＋本状态批恰本文件，写明「wt-3 W25 真机发现第三批：素材
  登记持久化＋unknown_material_source 专用拒绝修复切片轮（基线 29e972e）」。
- **[等用户] 真机复验**：修复面真机走查（选素材→开始检查→重启应用→再次开始检查
  应正常解析不再误报未连接；如见新文案「素材选择已失效，请重新选择」即专用拒绝
  路径如实呈现）——归 W25（O-2）窗内，候用户返回驱动。
- **[等核心/环境] F5 接线→库实现→桌面形状核可**（既有面序不变，本拍零预动）。
- [等桌面·后续例行] wt-7 合并后四语语义保留照其留言办理（候其追加批合并）。

## 阻塞
- 无阻塞。

## 下次合并意图
**候验收对象＝本拍三笔（--no-ff）：追平壳（零自有内容纯吸收）＋修复切片批 ff71c60
（恰 11 文件，实质非 collab 面 11 文件全 apps/desktop，请 diff 复核）＋本状态批恰
本文件，写明「wt-3 W25 真机发现第三批：素材登记持久化＋unknown_material_source
专用拒绝修复切片轮（基线 29e972e）」。**提交后读数（rev-list 实测）：领先 3、落后 0。

## 待命声明（第 6 步，如实）
本轮（2026-09-20 13:5x–14:2x，时段例外延续操作者批；三笔）：①date 13:57 实测时段，
pnpm collab:brief ①区 wt-7 留言就地消化（四语新键照其合并纪律登记）；②追平壳吸收
main 29e972e（落后 13 操作者指令追平，预检 exit 0、合并后 diff 0 行、基线刷新）；
③操作者指令三事项全办：登记持久化（material-source-store.ts 新模块照 state_file
write_atomic 惯例：信封＋原子写＋三态读归档取证；main.ts 启动载入＋注册即写盘＋
写失败如实失败；红线零脱敏照办）＋误导文案修正（unknown_material_source 专用拒绝
原因＋四语文案＋渲染分流钉死）＋回归测试（重启模拟载入命中 7 例组＋miss 专用拒绝
骑真实路由 1 例）；④定向证据本拍亲测：typecheck 双 0、vitest 788/788（＋8）、
build 全链含 cargo release 绿（文件锁本窗未触发，先例无需援引，照实记录）、
boundary/i18n/contrast/leak 155 指纹/forest-leak 全 OK；⑤诚实边界：零端到端宣称
——修复系代码＋测试面事实，真机复验归 W25（O-2）候用户；⑥四环全查零其它桌面可领
任务（F5 消费不预接线，BOARD 零桌面可办条目，[需用户] 照规则跳过）。在手无半途切
片、除本状态批外无未提交改动。退出待命，候集成验收本拍三笔、用户真机复验、下轮
brief 或新指派。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍三笔（--no-ff）：追平壳（零自有内容）＋修复
  切片批 ff71c60（恰 11 文件全 apps/desktop 桌面域：新增 material-source-store.ts
  ＋其测试，main.ts 载入/写盘接线，渲染层专用拒绝原因＋映射＋四语 1 键＋分流注
  释，live-production-port 回归测试）＋本状态批恰本文件，写明「wt-3 W25 真机发现
  第三批：素材登记持久化＋unknown_material_source 专用拒绝修复切片轮（基线
  29e972e）」**。定向证据本拍亲测：typecheck 双 0＋vitest 788/788（＋8）＋build
  全链含 cargo release 段绿（本窗文件锁未触发，无需援引 W25 文件锁先例）＋
  boundary/i18n/contrast/leak/forest-leak 全 OK。零端到端宣称维持——真机复验归
  用户 W25 走查。无新请求。
- [→wt-7]（知会）本拍四语表新增 `productionFlow.rejected.unknown_material_source`
  一键（zh/en/ja/ko 四表同步）；后续你树合并时如遇该键邻接冲突，照你方留言纪律
  保留新键与自然措辞办理。
- （回执不回执：brief ①区 wt-7 留言已消化＝本拍新键照其纪律执行；历史留言已消化
  归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
