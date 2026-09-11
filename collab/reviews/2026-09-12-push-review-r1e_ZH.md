# 推送门独立审阅报告 r1e（第 1 轮 / 共 3 轮）

- 日期：2026-09-12
- 审阅者：独立审阅者（r1e，独立取证，不复用历轮结论）
- 对象：`origin/main..main` 待推送增量（尖端 a8e0c5d，origin 在 2de1755）
- 仓库树：主树（只读审阅＋本报告落盘；未做任何实现提交）

## Verdict

**通过**（无阻断项）。

理由：增量实质内容与各提交／合并宣称逐项一致，无夹带；四把实质刀
（BG-21 校验器、#7 瞬败、project-ops v0.2、桌面 P2）的契约与诚实纪律
宣称全部在代码、Schema 与向量层面核实成立；全部真实验证命令在本机复跑
通过（Rust 67 套件／501 通过／0 失败、clippy -D warnings 零告警、桌面
check 全链 exit 0、registry-only 49/49 exit 0）；BG-21 五步验证矩阵与
#7 回归钉均独立复现。发现 2 项非阻断观察（见问题清单）。

## 审查范围（真实数字）

- 提交：`git log --oneline origin/main..main` 实测 **29 提交**（与调用
  方宣称一致）。
- 体量：`git diff --stat origin/main..main` 实测 **51 文件，+2532/−602**
  （与宣称一致）。文件清单逐一过目：acquisition 8、provider-host 2、
  桌面 9、schemas/project-ops/v0.2 16、协议本 4（v0.2 双语新增＋v0.1
  双语头部对齐）、compatibility 2、REGISTRY、scripts/collab-brief.mjs、
  collab 8——无清单外文件。
- 四把合并刀的 `^1..^2` 逐一切片核对：d78c43b（仅 cd3eead＋wt-5 状态＋
  基线追赶）、10c0d68（仅 0889a1b＋wt-2 状态＋基线追赶）、30e4f1a
  （仅 2ff721c＋b0e390b 状态＋两次基线追赶）、2a057f5（368c277＋wt-6
  状态，见观察 O-1）；1605d2d／704387b 实测 collab 状态单文件，collab-only
  属实。

## 逐项证据

### 1. project-ops v0.2（0889a1b，经 10c0d68 合并）

- **守卫闭集只增不改**：脚本比对 `schemas/project-ops/v0.1/result.schema.json`
  与 v0.2 的 `$defs.guard.enum`——v0.1 七码
  （target_exists…execution_failed）为 v0.2 十码的**逐字前缀**，新增仅
  project_not_found／not_vua_native／identity_unreadable 三码，零改动、
  零重排。code 后缀映射 `^vua\.project\.` 保持（result.schema.json
  `$defs.opsRejected.code.pattern`）。
- **setNote 不改 markedAt**：三层落实——Schema
  （`schemas/project-ops/v0.2/result.schema.json` `$defs.noteStored.markedAt`
  description「Unchanged: setting a note never re-marks」）；实现
  （`crates/project-manager/src/vua_identity.rs:171`——`marked_at:
  identity.marked_at` 原值回写，set_note 不接收新时间戳，结构上不可能
  重标记）；wire 测试（`crates/provider-host/tests/project_ops_wire.rs:714-718`
  断言 markedAt 保持标记时刻，:723-744 null 清除后 markedAt 仍保持）。
- **projectId→projectPath 三处一致**：Schema（v0.2 两 Schema 全文无
  `projectId`，setNote params 必填 `projectPath`）；协议本
  （`docs/protocols/project-ops-v0.2_ZH.md`「`projectPath` 是本词表族
  唯一的项目标识形态」节，明示草案修正原委）；实现
  （provider_host.rs `project_set_note` 闭参数集 `["projectPath","note"]`，
  `NoteStoredV01` serde camelCase 出 `projectPath`）。013 内联表态同步
  声明该修正（collab/proposals/013-…-wire-face.md 新增节）。
- **v0.1 原样保留为已取代**：`git diff origin/main..main --
  schemas/project-ops/v0.1/` **零输出**（目录逐字节未动）；REGISTRY 中
  v0.1 协议本行改「已取代（→ v0.2）」、v0.1 Schema 目录行**补登**为已
  取代、v0.2 两行新增为已冻结；v0.1 双语协议本头部在 a8e0c5d 对齐为
  「已取代（→ v0.2）」＋置顶警示块（历史状态保留在括注中，未抹除）。
- **消费测试与向量**：project_ops_wire.rs `#[test]` 计数实测 13（origin
  侧 9 → 13，新增 4）；向量目录实测 14 件（正例 8＋负例 5＋守卫拒绝例
  1），与协议本头部宣称一致。三守卫各有真实帧环拒绝断言＋磁盘诚实断言
  （:778 拒绝不发明标识文件；:801-805 不可读证据原样保留）；闭参数集
  五负例＋未接线 typed unavailable（:809-849）。
- **provider 路由**：served_capabilities 含 project.setNote 行；
  `PROJECT_OPS_SCHEMA_VERSION` 0.1→0.2；路由分派与守卫全部在任务内
  评估，拒绝走 Done-payload rejected 文档（import-copy 同款纪律）。

### 2. 桌面 P2（2ff721c，经 30e4f1a 合并）

- **收窄纪律逐项对冻结件核对**（对照 `schemas/recipe/v0.3/build-record.schema.json`）：
  - 顶层六态闭集 succeeded／succeeded_with_warnings／failed／cancelled／
    rolled_back／recovered——与模型 `RECORD_STATUSES` 逐字一致；
  - jobs 条目 status 三闭集 succeeded／failed／rejected——与模型计数
    分计逐字一致；
  - `planDeviations` 在 properties 而**不在**顶层 required（可选）——
    模型缺席＝0（release-records-model.ts:118）成立；
  - `evidenceSummary` 在顶层 required（必填）——模型缺席＝null 计数
    （:121-125），UI 明示「证据摘要缺席（缺席即证据）」
    （strings.zh-CN.ts records.evidenceAbsent）成立。
  - 必需身份字段缺失／类型不符／词表外＝整条 null（:87-101、:109），
    section 以 unexplainable 态如实呈现，不猜测。
- **三诚实态不折叠**：release-records-section.tsx ListState＝loading／
  failed／ok 三分；`result === null` → failed（:59-61，注释「不折叠为
  空列表」）；空列表才走 EmptyState（:119-120）；详情另有
  failed／unexplainable 与 loading 分离（:147-156）。
- **recovered 徽章与 016 草案注记**：recovered 双呈现（徽章＋语义注，
  :174-182）；证据引用仅计数，i18n evidenceLine 内嵌「检查证据面为
  草案，此处不渲染官方结论」注记（四语言表均含 records 节，check-i18n
  全链通过佐证对齐）。
- **9 项模型测试**实测在 release-records-model.test.ts（narrow 六态/
  计数/缺席/拒绝/词表/排序纯度/列表行词表外原样透传）；ReleasePage
  独立挂载（ReleasePage.tsx:361-363，注释钉死与展柜数据源分离）；
  fixtures 表零改动（增量内该文件 0 diff 行）。
- **无端到端宣称**：增量全 diff grep「端到端/end-to-end」命中的全部是
  **否定句**（「不宣称端到端」「接线前不得称端到端」），section 文件
  头注释同样声明真机数据流归 W25。

### 3. BG-21 校验器修复（b86a3db）

- 逻辑核对（scripts/collab-brief.mjs:224-243）：分隔行判定收紧为
  `c.length > 0 && 全 dash`；非「|」开头行显式跳过；列数不足（`c.length
  <= need`）与必填格空（路径/版本/状态）均计异常并 `total += 1`——行
  计数不再静默缩水，坏行不再绕过版本/状态校验。
- **五步矩阵独立复现**（临时 git 仓库＋最小 REGISTRY，跑真实脚本）：
  1. 正例：真实仓库 `pnpm collab:brief --registry-only` →「一致 49 项 /
     异常 0 项（共 49 行）」exit 0；
  2. 截断行负例（两格＋尾竖线）→「✗ REGISTRY 畸形行（列数 2，需 ≥3）」
     总行数不缩水，exit 1——**与提交信息宣称的输出逐字一致**；
  3. 路径格空负例 →「必填格空 1 处」exit 1；
  4. 既有负例（坏版本 9.9.9）→ 版本不一致报错 exit 1，不回归；
  5. 还原 → 干净 exit 0（即第 1 步）。另测空行＋含竖线正文行夹在表格
     行间：跳过、不崩溃、exit 0。临时目录已清理。
- 真实 REGISTRY.md 无代码块围栏、无缩进表格行，现网无误伤面。

### 4. #7 瞬败修复（cd3eead，经 d78c43b 合并）

- **test_support 生产零泄漏**：`crates/acquisition/src/lib.rs:14`
  `#[cfg(test)] mod test_support;`——非测试构建不编译该模块；helper 为
  模块内 `pub(crate)`，不外泄。两个集成测试（独立编译单元，看不到
  cfg(test) 模块）就地加固，处理正确。
- **generate_vpm publish_root 生产加固**：warehouse_maintenance.rs
  `run_generate_vpm` 内 static AtomicU64 serial＋pid＋纳秒命名，**附
  理由注释**（「Board #7 hardening: same-tick timestamp reuse … could
  alias two concurrent generate_vpm jobs」）；属生产命名加固，非测试
  专用逻辑。其余改动全部在 `#[cfg(test)] mod tests` 内。
- **回归钉**：`unique_dir_paths_are_pairwise_distinct_under_parallel_stress`
  （8 线程×64 次 barrier 起跑 pairwise-distinct）本机定向复跑通过。
- 切片边界：d78c43b 第二父链仅 cd3eead＋状态文档＋基线追赶；diff 全部
  落在 crates/acquisition 与 collab——零契约/守卫/词表改动的宣称属实。
  根因分析（纳秒同 tick＋共享 tag→create_dir_all 幂等→先收尾方删走对方
  文件）与 r3d 表型吻合，机械上成立；红证据 5/20 为提交方本机宣称，
  本轮不复现旧命名（不回退验证），以绿侧 20/20 与回归钉结构覆盖。

### 5. B5① 文档（368c277）

alcom-vcc 双语 1.2.0 新增节逐段读过：项目来源钉死为「管理器注册表
事实≠管理事实断言」；包来源钉死「VPM 声明不携带获取渠道，VUA 不能、
也不声称能断言任何包的真实出处」；呈现纪律钉死不确定性语义、B5② 文案
归桌面。**无虚构断言、无越界能力宣称**，doc-only（REGISTRY 1.1.0→
1.2.0）。诚实纪律成立。

### 6. 真实验证命令（本机，2026-09-12）

- `cargo test --workspace`（隔离 CARGO_TARGET_DIR）：**67 个 ok 套件 /
  全量 501 通过 / 0 失败**——与 10c0d68 验收宣称「67/501/0」一致
  （497→501 的 +4 恰为 project_ops_wire 新增四测试）。
- `cargo clippy --workspace --all-targets -- -D warnings`：Finished，零
  告警，exit 0。
- `pnpm --filter @vua/desktop check` 全链（typecheck×2＋vitest＋build＋
  boundary＋i18n＋contrast＋leak）：exit 0；vitest 单独复跑 **61 文件/
  483 测试全过**（与宣称 61/483 一致）；check:leak「159 条指纹，生产
  构建零泄漏」。
- packages/contracts、design-system、orchestrator-provider `pnpm check`：
  各自 exit 0。
- `pnpm collab:brief --registry-only`：**「一致 49 项 / 异常 0 项（共
  49 行）」exit 0**（真实输出）。
- collab 状态文件结构：`pnpm collab:brief` 完整模式正常产出（①注意／②
  工作树状态各节齐全，front-matter 解析无误）。

## 问题清单

### 阻断

（无）

### 非阻断

- **O-1（簿记偏差，已在 BOARD 如实声明）**：合并刀 2a057f5 的 message
  写「collab-only, tests waived」，但 `^1..^2` 实际携带 368c277（alcom-vcc
  1.2.0 文档交付，3 文件 +88）。wt-main 状态与 BOARD 均已声明该
  「合并信息误写」偏差（message 不可改），交付本身经独立验收核可。
  本轮复核：内容确为 doc-only＋REGISTRY 一行，registry 49/49 通过，无
  实质风险。留档观察，不需要动作。
- **O-2（BG-21 外观细节）**：`cells()` 假定表格行以「|」结尾；截断行
  若**同时**缺尾竖线，split+slice(1,-1) 会把最后一个格也丢掉，报出的
  「列数 N」比实际少 1（本轮实测：`| a | b` 报「列数 1」而非 2）。检出、
  exit 1、行计数不缩水三项核心保证均不受影响，仅计数文案在特定畸形
  形态下少报一格。可留待下次触改 scripts/collab-brief.mjs 时顺手对齐，
  不构成推送障碍。

### 诚实纪律专项核对

- 空态即终态：release 页空列表走设计空态（emptyTitle/emptyDescription），
  无猜测内容；模型层缺席字段不造默认呈现。成立。
- 失败如实：failed≠empty 三处（列表/详情/不可解释）；BG-21 修复动机
  本身即「畸形行静默跳过」的反面。成立。
- 恢复不隐式续跑：本增量不触恢复路径（#7 为测试基建）。N/A。
- mock 不出 DEV：check:leak 159 指纹零命中（生产构建实测）；fixtures
  表零改动。成立。
- 端到端宣称：增量内全部为否定式声明；#7 验收引用的 r3d 证据日志
  「从未入库」已在 ec2e017/BOARD 作诚实更正（在树证据＝r3d 报告内联
  分析，本轮核实该文件在 collab/reviews/ 存在且内容为分析型报告）。
  成立。
- 安全/凭据：增量 51 文件过目，无付费资产、凭据、私有日志、真实资产
  名；测试内容均为合成 fixture 字符串。无异状。

## 结论

增量与宣称一致、验证全绿、诚实纪律成立。**建议放行推送**（r1e 通过；
后续轮次 r2e/r3e 按程序独立复核）。O-1/O-2 为观察项，无需用户裁决。
