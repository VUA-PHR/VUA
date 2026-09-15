# release-handoff 协议 v0.1（官方 SDK 上传交接词表行：release.openForHandoff）

[English](release-handoff-v0.1_EN.md) | [简体中文](release-handoff-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（官方 SDK 上传交接词表行）**（2026-09-16，proposal 023
> 核心冻结批：桌面/产线表态收敛＋核心裁决五点定形，见「冻结收口」）
> 机器可读词表：`schemas/release-handoff/v0.1/`（单方法 Schema＋正例 3＋
> 负例 3 向量；帧环 wire 测试 `crates/provider-host/tests/
> release_handoff_wire.rs`；TS 消费测试 `packages/contracts/src/
> application-contract.test.ts`）
> 范围：`release.openForHandoff`（tasked 交接命令：buildId → 任务九态 →
> 交接事实文档）
> 所有权边界：交接实现域＝进程/窗口面（产线域 port）＋核心 use case
> （核心域）——核心 use case 已接线（023 后续切片②，2026-09-16：任务
> 编排＋handshake 完成判定＋editor 身份解析＋port 契约
> `ReleaseHandoffPort`）；产线进程/窗口面适配器为产线域切片，缺省装配
> 下路由维持诚实缺席。本批冻结的是**词表行契约面**——方法词汇、params
> 闭集、受理回执与交接事实形状、错误码闭集、诚实缺席语义
> 更新：2026-09-16（v0.1 冻结批：协议本双语＋REGISTRY 登记）；2026-09-16
> （核心 use case 接线批：实现域状态刷新——wire 面按 port 注入接线，
> 缺省装配缺席语义不变，词表/形状/错误码闭集零变化）

## 交接语义（产品边界重申）

交接＝**把用户送到官方 SDK 上传流程的起点**，不是「替用户上传」。产品
边界（product-boundary「边界与承诺」）：VRChat Avatar 的最终上传继续
使用官方 SDK 流程，VUA 提供准备、验证和交接——上传本身永不进 VUA：
不代上传、不代理凭据、不把上传做成 VUA 事实。交接完成即 VUA 侧终态；
**上传进度/结果绝不是 VUA 事实**——本词表行的交接事实文档**没有上传
状态字段**（`additionalProperties: false` 由形状钉死，负例向量把守），
想猜也无从猜起（诚实纪律 1/2）。

## 冻结收口（proposal 023 硬前置逐项）

- **①桌面＋产线表态收敛**：桌面表态（023 内联「表态（桌面）」节，
  469ef5c 经第 52 波 d73fa10 入库）——方向 a 动作权威、方向 b 回执形状
  并入 a 的结果文档、Release 页入口落 Build Record 浏览行；产线表态
  （023 内联「表态（产线）」节，wt-4 树五点，随其批次入库）——机制
  事实钉死：Bridge 命令面（com.ph-r.vua）以「工程已打开」为存在前提，
  openForHandoff 属编辑器进程生命周期管理，**实现域＝进程/窗口面，
  unity-bridge v3 零增操作**（确定性 Bridge 操作不存在故演进条款不
  触发，硬前置⑤轮空）；
- **②Schema＋正负例向量**：`schemas/release-handoff/v0.1/`（本批）；
- **③至少一端消费测试**：帧环 wire 测试（provider-host
  `release_handoff_wire` 5/5）＋TS 契约消费测试（`@vua/contracts`
  release-handoff 节 3 例＋mock 缺席分支测试）——桌面 Release 页真实
  消费切片随后（桌面表态：候冻结批＋TS 面就绪，不预接）；
- **④双语协议本修订记录**：本文件＋EN 镜像＋应用契约协议本方法面行
  ＋修订记录条目（本批）；
- **⑤unity-bridge 演进条款**：**轮空**——产线机制事实钉死交接不经
  编辑器内 Bridge 命令面，v3 零增操作。

## 核心裁决五点（开放问题 3 收敛＋①登记）

1. **方向取舍**：方向 a（`release.openForHandoff`）为动作权威；方向 b
   不独立成命令——`release.handoffBundle` **不登记**，其回执形状
   （buildId＋工程身份）并入 a 的结果文档（桌面表态采纳：两个入口承载
   同一事实＝IA 零增益）。
2. **词表行名族边界**：`release.*`＝产物动作面（对构建产物执行的动作
   语义）；`record.*`＝记录读写面（`record.get`/`record.list` 与
   `production.getBuildRecord`）——两族边界清晰无重叠（产线机制侧意见
   采纳）；目录/协议本族名 `release-handoff` 锚定交接语义与错误码族
   `vua.release_handoff.*`。
3. **任务化**：**统一 task 九态单形态**（产线表态③采纳）——Unity
   2022.3 开工程为分钟级长时操作；受理回执照 tasked 命令先例
   （`inspection.requestRun` 形状），按 taskId 轮询应用任务面；**完成
   判定＝Bridge handshake 到达**（001 链，工程加载完毕的确定性信号），
   「进程已启动」绝不作为完成判定；超时如实失败（timeout 类）/
   inspect_required，绝不猜面板状态（诚实纪律 3）；已打开场景任务即达
   终态（形态统一，成本可忽略）；OS 窗口聚焦尽力而为，**不进完成判定
   不进回执事实**（焦点非稳定事实）。不做同步/任务双形态分叉。
4. **params 闭集修订**：`{ buildId }` 单字段（修订 023 §3 草案
   「buildId＋工程身份字段」）——工程身份权威在 build-record 面
   （projectId 已随冻结记录携带），params 重复携带＝双源对账零增益；
   桌面表态「权威身份在 build-record 面」的最彻底落实；Release 页
   Build Record 行发起的合法消费流天然只持 buildId。异议随 023 线程
   重议（协议本登记不影响词表行冻结效力，修订走升版）。
5. **editor 身份解析顺序**（语义面；实现已随 023 后续切片②接线，
   2026-09-16）：显式注入（021 组装面选择权威，`VUA_UNITY_EDITOR` 手选
   通道，经 editor-verify 面确立身份；验证拒绝即如实 unresolved，绝不
   静默降级到下级）＞构建记录携带身份（`unityEditorVersion`/
   `projectId`——产线建议采纳：默认取构建时编辑器身份，防版本错配
   升级副作用）＞类型化 error
   `vua.release_handoff.editor_unresolved`（诊断复用
   `environment.verifyEditor` 语义，不另造词）。

## 方法面

| 方法 | 分型 | 语义 | 消费方 |
| --- | --- | --- | --- |
| `release.openForHandoff` | Command（任务化） | 按已验证编辑器身份请求打开/聚焦目标 Unity 编辑器至目标工程，使官方 SDK 上传面板就绪；受理后按 taskId 轮询任务面，succeeded 快照 result 携带交接事实文档 | Release 页 Build Record 行「交接」主操作（桌面切片候本冻结批） |

params 闭集单键：`buildId`（`minLength 1`；关联 build-record v0.3 冻结
面，与 `record.get` 同一身份族）；`additionalProperties: false`——词表
外参数＝`vua.release_handoff.invalid_params` validation 错误信封（形状
违反绝不冒充缺席）。

## 交接事实文档（succeeded 快照 result）

- 闭集五键：`schemaVersion`（const `"0.1"`＝族自有常量
  `RELEASE_HANDOFF_SCHEMA_VERSION`，绝不借外族版本）、`buildId`（b 回执
  形状并入：SDK 侧对照锚）、`projectId`（工程身份，自构建记录解析——
  绝不是文件系统路径）、`editor`（`exePath`/`version` 编辑器身份事实，
  editor-verify v0.1 冻结事实族——身份而非存储路径）、`occurredAt`
  （RFC 3339，VUA 侧终态时刻）；
- `additionalProperties: false`——**无上传状态字段**：上传在官方 SDK
  中完成，绝非 VUA 可猜事实（负例向量
  `invalid-release-open-for-handoff-upload-state.fact.json` 把守）；
- storedPath 纪律（权威锚 6）：产物物理路径永不进入交接事实。

## 错误码闭集与缺席语义

闭集四码（`vua.release_handoff.*` 族）：

| 码 | category | 语义 |
| --- | --- | --- |
| `vua.release_handoff.unavailable` | unavailable | 路由/产线进程窗口 port 未接线＝**诚实缺席**——绝不折叠成伪造受理、伪造任务快照或伪造交接事实 |
| `vua.release_handoff.invalid_params` | validation | params 闭集违反（形状违反绝不冒充缺席） |
| `vua.release_handoff.build_unknown` | validation | buildId 无对应构建记录（受理期校验） |
| `vua.release_handoff.editor_unresolved` | dependency | 编辑器身份解析失败（诊断复用 environment.verifyEditor 语义） |

任务运行期失败（handshake 超时等）走任务面九态通用语义，不进本闭集。
实现域时点（2026-09-16 接线批）：**核心 use case 已接线**——port 注入
后路由按受理流（params 校验→构建记录存在性→editor 身份解析）受理任务，
任务九态承载启动＋handshake 等待；**产线进程/窗口面适配器未落，缺省
装配（无 port）维持 `unavailable` 诚实缺席**（wire 测试钉死「缺席绝不
携带 task/受理形状」与「有 port 无记录答 build_unknown 而不受理」两
面）；产线适配器切片落地后缺席路径收敛为异常路径。

## 真机前置与验证边界

冻结批**不设新真机前置**（产线表态④）：表态依据全部为在库代码或在案
真机证据；进程面启动＋handshake 等待的实现测试照裁决 15 本地先行、
证据可复用 W25；端到端宣称候 W25 真机窗口（O-2）——本批零端到端宣称。

## 依赖方向

```text
React View（Release 页 Build Record 行「交接」操作，桌面切片候冻结批）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约（release.openForHandoff 词表行）
  → provider-host 路由（核心域，已接线：port 缺省＝诚实缺席）
  → 核心 use case（核心域，023 后续切片②已落：受理校验＋任务编排＋
    handshake 完成判定＋editor 身份解析）
  → ReleaseHandoffPort（核心域冻结的进程/窗口面 trait 契约）
  → 产线进程/窗口面适配器（产线域切片：Unity.exe 启动／OS 聚焦＋
    handshake 等待）
```

## 机器可读词表

`schemas/release-handoff/v0.1/`：`methods/release-open-for-handoff.schema.json`
＋`examples/`（正例 3——request 闭集单键／accepted 受理回执／fact 交接
事实；负例 3——params 闭集外键〔工程身份字段不进 params〕／交接事实
携带上传状态〔诚实纪律 1/2 形状钉死〕／错误码闭集外〔上传类错误码永不
进入本词表〕）。消费测试双载体：`crates/provider-host/tests/
release_handoff_wire.rs`（帧环真接线 12 例：缺席码三元断言＋缺席绝不
伪造受理形状＋params 四违反＋**接线面**——fake port 全流转〔受理回执
→succeeded 快照 result 携带 fact 五键→port 收到已解析身份〕、handshake
超时如实失败无 result、port 启动失败走执行族码、build_unknown 不受理、
editor_unresolved 依赖类、port 缺省缺席维持、显式注入短路直达 port）＋
`packages/contracts/src/application-contract.test.ts`（TS 守卫闭集正负
例＋fact 运行时守卫＋错误码闭集对表）＋
`packages/orchestrator-provider/src/mock-provider.test.ts`
（模拟面缺席分支与真实缺省装配同形）。词表或字段变更必须升版本，绝不
原地改写。

## 开放项

- 产线进程/窗口面适配器（`ReleaseHandoffPort` 的真实实现：Unity.exe
  `-projectPath` 启动／已打开 OS 聚焦＋handshake 等待）：产线域切片，
  裁决 15 本地先行，协作面随时候领；
- 桌面 Release 页消费切片（Build Record 行「交接」主操作＋「已交接」
  事实＋upload_readiness 证据摘要＋「最终上传在官方 SDK 中完成」如实
  说明）：候本冻结批验收入库＋TS 面就绪（已随批）；
- 端到端真机走查：归 W25 真机窗口（O-2 候用户开窗），证据要求不放宽。
