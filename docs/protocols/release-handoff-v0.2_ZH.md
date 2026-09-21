# release-handoff 协议 v0.2（官方 SDK 交接＋独立检视入口：U19 准入闸批）

[English](release-handoff-v0.2_EN.md) | [简体中文](release-handoff-v0.2_ZH.md)

> 文档版本：0.2
> 状态：**已冻结（U19 交棒准入闸＋独立检视入口）**（2026-09-21，核心域
> 升版批：用户裁决 U19 为规范源，BOARD U19 行载裁决全文照录）
> 机器可读词表：`schemas/release-handoff/v0.2/`（双方法 Schema＋正例 5＋
> 负例 6 向量；帧环 wire 测试 `crates/provider-host/tests/
> release_handoff_wire.rs` 20 例——含全部状态枚举逐一过真环）
> 范围：`release.openForHandoff`（v0.1 词表行升版：准入序新增记录状态
> 闸）＋ `release.openForHandoff` 家族新增 `release.openForInspection`
> （独立「在 Unity 中打开以检查/修复」入口）
> 所有权边界：与 v0.1 相同——交接/检视实现域＝进程/窗口面（产线域
> port）＋核心 use case（核心域）；本批零 port/trait 形状变化（两入口
> 复用同一 `ReleaseHandoffPort` 机制，操作语义归路由面），unity-bridge
> 零增操作
> 更新：2026-09-21（v0.2 升版批：U19 状态白名单闸＋类型化拒绝原因两码
> ＋独立检视入口＋错误信封 params 面；v0.1 词表/向量一字节不动依 git
> 历史）

## 规范源（U19 用户裁决，2026-09-21）

用户裁决**采纳方案③但限定为「生产结果交接准入」**，全文照录见 BOARD
U19 行；要点与本协议的落位：

1. **不得禁止打开工程排错**——保留明确独立的「在 Unity 中打开以检查/
   修复」路径（打开编辑器既不是恢复执行也不是上传许可）→ 新方法
   `release.openForInspection`，不按记录状态闸（见「检视入口」节）；
2. **状态白名单（规范表，词面＝build-record v0.3 status 枚举原词）**：
   - `succeeded`、`succeeded_with_warnings` → **放行**，保留警告呈现
     （呈现归桌面面；后端不改写记录、不抹警告）；
   - `failed`、`cancelled`、`rolled_back` → **拦截**，供诊断、恢复或
     重新生产入口（`record_state_blocked`，携 `state` 参数＝记录状态
     原值）；
   - `recovered` → **拦截**，先完成检视及后续生产流程（同码同参）；
   - 缺失、未知状态 → **拒绝**，说明记录无法确认
     （`record_state_unknown`）；
3. **三条修正论据随行入档**：(a) 这是产品政策选择，不只是客观事实校验
   ——状态是事实，「哪些状态允许交接」是政策（故拦截类 category＝
   permission，非 validation）；(b) `recovered` 不等于任务的
   `inspect_required`——构建记录 Schema 已含 `recovered`，两套状态不得
   混用，检视完成也不把失败历史记录改成成功（本协议与实现零状态改写
   面）；(c) 成功记录不保证当前工程仍是当时结果——此闸防明显错误交接，
   **不宣称解决「上传错误 Avatar」全部风险**（本协议零此类宣称）；
4. **实现要求（同批交付）**：后端权威判断（闸在 provider_host 准入序，
   不在 UI）＋类型化拒绝原因（两新码）＋四语说明（messageKey 两键
   `errors.releaseHandoff.stateBlocked`／`errors.releaseHandoff.
   stateUnknown`，词表四语归桌面座并行批）＋直接调用绕过 UI 的测试
   （wire 全状态覆盖）＋全部状态覆盖（以 build-record v0.3 Schema 枚举
   对表落位，含缺失态）。

## 方法面

| 方法 | 分型 | 语义 | 状态闸 |
| --- | --- | --- | --- |
| `release.openForHandoff` | Command（任务化） | 官方 SDK 上传交接：按已验证编辑器身份打开/聚焦目标工程，使官方 SDK 上传面板就绪；完成判定＝Bridge handshake 到达（v0.1 裁决③不变） | **有**（本批新增，见下节） |
| `release.openForInspection` | Command（任务化） | 独立「在 Unity 中打开以检查/修复」：同机制（打开/聚焦＋handshake 等待），完成事实携带显式 `operation` 词面，**绝不宣称交接完成** | **无**（不按记录状态闸） |

两方法 params 闭集同为单键 `buildId`（`minLength 1`；关联 build-record
v0.3 冻结面，与 `record.get` 同一身份族）；`additionalProperties:
false`——词表外参数＝`vua.release_handoff.invalid_params` validation
错误信封。

## 交棒准入序（v0.2，后端权威）

`release.openForHandoff` 受理序（校验次序保持，闸插在记录存在之后、
身份解析之前）：

```text
params 闭集 → invalid_params（validation）
未接线面（use case / 任务运行时 / 产线 port）→ unavailable（诚实缺席）
记录读取失败 → unavailable（存在性无法确定，可重试，绝不冒充 unknown）
buildId 无记录 → build_unknown（validation）
★ 记录状态闸（本批新增，产品政策，后端裁决）：
    succeeded / succeeded_with_warnings → 放行
    failed / cancelled / rolled_back / recovered
        → record_state_blocked（permission，params.state＝原值逐字）
    status 缺失 / 非字符串 / 枚举外 → record_state_unknown（validation）
工程身份缺失 / 编辑器解析失败 → editor_unresolved（dependency）
全部通过 → 任务受理（九态只承载长时部分：启动＋handshake 等待）
```

闸的裁决面在核心 use-case 分类函数
（`classify_handoff_record_state`，全枚举单测覆盖）＋provider_host 准入
序执行——**UI 不参与放行/拦截判断**；桌面只消费类型化拒绝原因措词
（`state` 参数携带记录状态原值，诊断/恢复/重新生产入口词面由桌面四语
词表措）。被拦记录不受理任务（任务库零写入、port 永不触达，wire 测试
逐一钉死）。

## 检视入口（`release.openForInspection`）

- **不按记录状态闸**：任何记录状态（含被拦态、缺失态、枚举外词面）都
  可打开检查——打开编辑器既不是恢复执行也不是上传许可（U19 ①）；
- 受理验三样：params 闭集、记录存在（`build_unknown` 照答）、编辑器
  解析（`editor_unresolved` 照答）——即交棒受理序**去掉状态闸**的剩余
  全集；
- **完成事实词面**：检视事实文档六键闭集＝交接事实五键＋显式
  `operation` 键（const `"release.openForInspection"`）——词面由形状钉
  死，任何消费方不得把检视完成呈现为「交接完成」（负例向量把守：携带
  交接操作词面的事实对检视 def 非法）；
- 与交棒同一任务化形态（受理回执→taskId 轮询→succeeded 快照 result
  携带检视事实）；机制 port 复用 `ReleaseHandoffPort`（零 trait 形状
  变化，操作语义归路由面——port 只懂「打开编辑器＋等 handshake」，
  不懂交棒与检视之分）。

## 错误码闭集与缺席语义

闭集六码（`vua.release_handoff.*` 族，v0.2；交棒路由可答全部六码，
检视路由只答四码——两状态码对检视路由刻意缺席）：

| 码 | category | 语义 |
| --- | --- | --- |
| `vua.release_handoff.unavailable` | unavailable | 路由/产线 port 未接线＝诚实缺席（v0.1 语义不变） |
| `vua.release_handoff.invalid_params` | validation | params 闭集违反 |
| `vua.release_handoff.build_unknown` | validation | buildId 无对应构建记录（受理期校验） |
| `vua.release_handoff.record_state_blocked` | **permission** | 记录状态在交棒白名单外（failed/cancelled/rolled_back/recovered）——**政策拦截**，`params.state` 携带记录状态原值逐字；messageKey＝`errors.releaseHandoff.stateBlocked` |
| `vua.release_handoff.record_state_unknown` | validation | status 缺失/非字符串/枚举外——记录无法确认；messageKey＝`errors.releaseHandoff.stateUnknown` |
| `vua.release_handoff.editor_unresolved` | dependency | 编辑器身份解析失败（v0.1 裁决⑤语义不变） |

错误信封 params 面（ORC-ERR-001 形状）：`params` 对象**仅在有参时**
出现（既有码的线面形状逐字节不变）；`record_state_blocked` 是首个受理
期携参发射者。任务运行期失败（handshake 超时等）仍走任务面九态，不进
本闭集。

## 事实文档（succeeded 快照 result）

- **交接事实**（`release.openForHandoff`）：闭集五键不变
  （schemaVersion 升 `"0.2"`／buildId／projectId／editor{exePath,
  version}／occurredAt），`additionalProperties: false` 无上传状态字段
  ——v0.1 诚实纪律形状全部维持；
- **检视事实**（`release.openForInspection`）：闭集六键＝五键＋
  `operation`（const 检视操作词面）——检视完成绝不误读为交接完成；
  同样无上传状态字段。

## 机器可读词表与消费测试

`schemas/release-handoff/v0.2/`：`methods/release-open-for-handoff.
schema.json` ＋ `methods/release-open-for-inspection.schema.json` ＋
`examples/`（正例 5——两方法 request／两方法 accepted／检视 fact；另
blocked params 正例 1；负例 6——params 闭集外键／交接事实携上传状态／
错误码闭集外／blocked params 缺 state／检视事实携上传状态／检视事实
携交接操作词面）。消费测试＝`crates/provider-host/tests/
release_handoff_wire.rs` 20 例（帧环真接线、绕过 UI 直接调用）：全状态
枚举逐一过真环（六态＋缺失＋非字符串＋枚举外＋空串）、拦截三断言
（码＋category＋params.state 逐字）、被拦不受理任务且 port 未达、准入
序钉（存在→状态闸→身份解析）、检视入口全状态不闸＋词面钉＋三验照
旧。v0.1 族文档一字节不动（历史冻结面），编译钉保留。

## 验证边界（诚实纪律）

本批零端到端宣称：全部证据系 fake port／临时库帧环证据（裁决 15
本地先行）；真机（真实记录→真启动→handshake→事实回流、被拦态桌面
呈现全链）归 W25 真机窗口（O-2），证据要求不放宽。

## 依赖方向

与 v0.1 相同（React View → Gateway → Electron 适配 → 应用契约 →
provider-host 路由 → 核心 use case → `ReleaseHandoffPort` →
`EditorHandoffAdapter` → 产线机制原语），闸与检视分叉全部收在
provider-host 路由准入序内，依赖方向零变化。桌面 TS 契约面（词表行
升 0.2＋`release.openForInspection` 方法面＋四语词表两键＋独立打开
路径确认）归桌面座并行批（随环流水线下一环）。

## 开放项

- 桌面消费批（TS 面＋四语词表＋Release 页独立打开入口确认）：桌面座
  wt-3 随环流水线办理；
- 端到端真机走查（含两入口真机分流与被拦态呈现链）：归 W25（O-2），
  零端到端宣称。
