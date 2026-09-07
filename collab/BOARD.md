# BOARD — VUA 全局看板

维护方：集成树（wt-main）。更新时机：每个 M 门关闭或合并完成后（见 collab/README.md）。
本文件只反映"现在"；历史在 git。

最近更新：2026-09-08 06:4x（**W20 冻结切片验收合并·互审收口**：schemas/recipe/
v0.3/ 三 Schema＋向量＋消费测试入树〔集成复跑 367/0＋clippy 零告警，0400bee〕；
009 互审点 1–5 全关＋核心确认 planRef 形态——**产线可冻结 v2 并开工 C# 侧**；
**proposal 012 登记**（W22 Record 设计稿，产线互审三核验点确认＋两缺口建议
jobs[] 补 commandId/replayed）；v0.3（bdl-commands）已冻结〔执行序①完成〕——
执行序②核心 wire/挂点解锁）

## 工作树指派

| 工作树 | 分支 | 角色 |
| --- | --- | --- |
| VUA（wt-main） | main | 集成 |
| VUA-2（wt-2） | slot/wt-2 | 核心 |
| VUA-3（wt-3） | slot/wt-3 | 桌面 |
| VUA-4（wt-4） | slot/wt-4 | 产线 |
| VUA-5（wt-5） | slot/wt-5 | 数据 |
| VUA-6（wt-6） | slot/wt-6 | 环境 |

入职提示词：`collab/roles/<role>.md`；节拍命令：`collab/TICK.md`。

## M 门状态

| 门 | 状态 | 备注 |
| --- | --- | --- |
| M0 / M1 / M2 | 已通过 | 2026-09-04 |
| M3 | **已通过** | 2026-09-07——门项全完成（I-1 16/16 真机；三轮走查终验通过）；v0.5.0 已切，关门后推送 GitHub |
| M4 | **已通过** | 2026-09-08——W12–W17 全链交付；W15 两轮走查收敛（复验通过＋两修正项回流 2fa260d＋用户确认）；v0.6.0 已切并推送 GitHub；M5（v0.7.0）随即开窗 |
| M6 | 未开窗·**已获产品语义授权** | 2026-09-08——U1 批准 proposal 006（EAC 恢复边界，R1–R9 无修订＋严化验收项）＋U3 裁决 F6 只读兼容语义（product-boundary 1.2.0）；开窗仍以 M5 关门为序 |

M3 进度：

- [x] T1 — amf-production v0.2 schema + 8 向量（94ee161 吸收，字节一致）
- [x] T2 — F 侧登记批（d8593df）
- [x] I-3 — 三车道统一合并（2026-09-06；b211f7a 后端车道并入、6837271 F 侧回灌）
- [x] I-1 — 真 Unity 矩阵：**✅ 已交付（2026-09-07）**——16/16 格真 Unity 通过；证据
  wt-4 `_local_w1/` 25 项（16 格全覆盖、多轮校准留痕、终态全 ok）；集成独立复验 1 格
  真机 ok（75.43s）+ workspace/clippy 全绿；合并 5ccace6
- [x] W7 剩余 — **✅ 三轮走查闭环，终验通过（用户 07:05：R1–R5 全过）**。初验部分通过
  → 复验（B3/B4 ✓ 场景条 ✓；i18n 动态载荷、仓储残留文本未过）→ 第三轮修复后终验通过。
  结果落档 `_local_m4/v0.4.2/`（w7-walkthrough-closure.json 等）。语义/UX 裁决与积累项
  随 M4 实施（见下）

M3 关门程序（用户裁决 04:50；I-1 完成、GUI 走查通过后由集成依次执行）：

- a. **全文档审查**：outline 当前窗口、架构文档、协议本状态段、REGISTRY 等更新至实际进度；
- b. **确认 M3 整体无冲突**：冻结契约表与实际一致、门验收清单逐项核实、全量测试绿；
- c. **升产品版本 v0.5.0 并推送 GitHub 远端**（U4 就此落定：关门后推送、不提前建仓；
  remote 建立与 CI 三 workflow 按 W11 原计划一并执行）；写双语发行说明。

M4 分配规则（用户裁决 04:50；v0.5.0 推送完成后执行）：从 outline 分配 M4（v0.6.0）任务；
**实际开发前必须对照 M4 任务分解表逐项核实已交付/部分交付/未动工**——已交付例：三命令
协议（bdl-commands v0.1.1）、下载事件闭环（download-events v0.1＋消费测试）、素材检查
流水线（artifact_inspection）、BDL 持久格式（bdl v0.1）；**W12（catalog 观察管线）为
已排期未动工**（M4 开窗后数据第一切片执行：勿标已交付、勿重复分配；数据事实纠正 05:00）。
据此先更新 outline 的 M4 分解与窗口表，再向各角色分配，避免重复开工。

已接受语义/UX 裁决（用户走查批 2026-09-07；记录待 M4 实施）：

1. 素材入口：默认原始 `.unitypackage`；「生成 VPM 替代」「生成后删除原始素材」移入
   设置-实验性（新标签页）——产品语义已同步 product-boundary 1.1.0（双语，集成）；
   完整交互重构与可能的协议升版（005 线程备案）入 M4；
2. 任务中心语义改**通知中心**，每条通知带清除按钮（设计标准同步 [→桌面]）；
3. 仓储布局：右侧专门详情区＋素材列数随窗口宽度自适应；
4. DEV 场景切换条可收起（DEV 工具缺陷——随 M3 缺陷批先行修复）。

M4 已积累裁决项（U7/U8 落定 2026-09-07，随 M4 分配一并实施）：仓储布局重构（自适应
列数+右侧详情区，U7→W13）；实验性设置完整形态（两级选项：生成 VPM 替代+生成后删除
原始；含持久化位置决策与 bdl-commands v0.2 升版硬前置，U8/005 备案→W14/W15）。

**M4 分配（2026-09-07，outline 2.0.2）**：W12 catalog 观察管线（数据首切片）；W13 仓储
布局重构（桌面）；W14 bdl-commands v0.2 升版（数据）；W15 设置-实验性完整形态（桌面，
依赖 W14）；W16 设计标准同步（桌面）。M4 分解表六项历史交付已核实（outline 2.0.2）。

**M4 进度（2026-09-08 03:1x）**：W12 ✅ **全链闭环**（服务面 6062a13＋provider 路由
80ad6e7＋消费端对齐 693965d/5fd8c6b：应用码映射修复〔detail miss 曾会误报
not-connected 的不诚实呈现〕＋errors.catalog.* 四语键；桌面核实「真实面切换」本无
切换改动——消费面就绪，provider 服务后自愈）；W13 ✅＋W16 ✅（88b4551）；W14 ✅
（bdl-commands v0.2 冻结＋provider 路由）；W15 **重做批已交付并验收合并**（2026-09-08：4fb6411 桌面自并 4954349，集成验收）——
示意图 A 全局开关形态＋危险开关（未接线如实标注，DEV 注明不删文件）＋VPM 术语
四语修正＋「开」按钮宽度随形态消除＋contracts TS 面登记（setGlobalDefaultMode，
词表与 v0.2 冻结一致）；mock 1 行越界声明充分（005 既有「诚实不可用」立场）准予
维持。验收证据（2026-09-08 本机）：桌面 check 全链绿（typecheck＋47 文件 395 测试
＋build＋boundary＋i18n＋contrast＋leak 160 条指纹零泄露）＋contracts 29＋
orchestrator-provider 23＋cargo workspace 350 通过 0 失败。
**M4 门验收清单（2026-09-08 关门核实，逐项）**：
- [x] W12 全链闭环（6062a13/80ad6e7/693965d/5fd8c6b＋73cae1b/c93ac5e W17 写入侧）；
- [x] W13 布局重构（88b4551）＋W16 设计标准（v0.6.2＋0.6.3）；
- [x] W14 bdl-commands v0.2 冻结＋provider 路由（10325cd）；
- [x] W15 两轮走查收敛（重做 4fb6411→复验通过→修正 2fa260d→用户确认关门）；
- [x] W17 观察管线写入侧（73cae1b：350/0＋9 项消费测试）；
- [x] 全量测试绿（2026-09-08 本机关门核实：cargo workspace 350 通过 0 失败；桌面 check
  全链 47 文件 395 测试＋leak 160 条指纹零命中；contracts 29＋orchestrator-provider 23）；
- [x] CI：ts **run 34160725827 ✅**（关门批推送触发，2026-09-08）；rust/schema-vectors
  因 paths 过滤未触发（关门批无 crates/schema 改动）——最近全绿证据 rust
  34151441179／schema-vectors 34151441213（2026-09-08，W17 批）；
- [x] #7 观察态如实引用（本机 8 轮 1 次 14/1 未捕获瞬败＋7 轮全绿，发行说明如实声明）；
- [x] proposal 008 仲裁路径 a 已落（提案已接受；接线切片 M5 首批＝W18）；
- [x] 触发时机语义落受管文档（product-boundary 1.2.1）；U1/U3 用户裁决销账（1.2.0/2.0.7）。

**M5 开窗（v0.7.0，2026-09-08）**：分解表核对历史进度（无预交付）后落 outline 当前窗口
**W18–W26**——桌面 M5 首批 W18（008 路径 a 接线）＋W19（导入时自动生成挂点与编排
语义，与核心/数据合并设计）；核心 W20（Recipe v0.3/Local Resolution/版本锁）＋W22
（完整 Build Record）；产线 W21（Bridge 操作扩展）＋W25（合法素材冒烟路径）；数据
W23（兼容/缺失证据模型）；桌面 W24（Recipe/Assembly 工作台）；集成 W26（门验收与
发行）。各角色按锚点领取，开工前先合并 main 最新。**W17 已入表**（outline 2.0.4）且 **✅ 全链交付**：桌面协作面（869519b 自并 c93ac5e：
错误透传呈现白名单＋live-acquire entryDetail 旧码修复——live 面 miss 曾会误报断连；
394 测试全绿＋CI ts 绿）＋数据写入面（eb899f1 验收合并 73cae1b：products 全列 upsert
〔重放安全、无删除 API、墓碑保留〕＋bdl_meta.catalog_updated_seq 簿记〔v0.3 既有
语义开放项落地〕＋catalog 读组装消费观察列＋写入侧闭集 InvalidObservation 拒绝＋
9 项消费测试；350 通过 0 失败＋clippy 零告警；wire 零变化，架构双语 1.1.0）。

W15 首轮走查裁决（用户 2026-09-08，操作者落账；**判定：不通过**——交互形态重做，
非缺陷批；**用户示意图为规格权威**，桌面执行中）：

1. 形态重做：设置-实验性页用**全局开关**形态——「生成 VPM 替代」开关＋「生成后删除
   原始素材文件」红色开关（带危险徽标；主开关先开才可用；开启时弹危险确认对话框）；
   **无条目选择器**（取代 U8 记录的两级选项形态）；
2. 样式缺陷：实验性入口「开」按钮宽度过大；
3. 术语硬裁定：**VPM = VRChat Package Manager（管理器），VPM 包 = VPM package
   （被管理的包）**——全仓 i18n/注释/文档按此修正（应用面随 W15 重做切片由桌面
   执行；受管文档面评估归集成，见开放问题 #9）；
4. 语义影响：全局「生成 VPM 替代」可接线 W14 冻结的 `warehouse.setGlobalDefaultMode`
   （无协议障碍）；全局「生成后删除原始素材文件」超出冻结的条目级 deleteOriginals——
   桌面起草 proposal 008 请数据/核心表态（可能涉 bdl-commands 升 v0.3；未接受前
   v0.2 维持冻结）；M4 内桌面先交付呈现层＋如实标注未接线。

## 冻结契约表

契约登记的权威清单在 docs/REGISTRY.md（C-a 侧建立）；下表是门视角摘要。

| 契约/制品 | 版本 | 状态 |
| --- | --- | --- |
| application-contract | v0.1 | 冻结（M2 冻结） |
| provider-process（协议本/握手帧面） | v0.2 | 握手帧面 Schema 冻结（provider-frame-v0.1 + 双端 11 向量；proposal 001 关闭） |
| bdl-commands | **v0.3** | **已冻结（M5 首批先行，2026-09-08，数据主导，集成验收 ef9854b：复跑 362/0＋clippy -D warnings 零告警）**——五命令闭集：v0.2 四命令照录（向量除版本外字节一致）＋**warehouse.import 批量导入**（任务化，folder 批，010/W19 硬前置）＋generateVpm 可选 `importCorrelationId` 审计链字段（仅导入编排发起携带；010 承诺 6 wire 承载）；术语裁定落实（「生成 VPM 包副本」）；v0.2/v0.1 已取代。历史：v0.2（W14）全局默认模式＋008 路径 a 零扩展裁决见 git；协议双语＋REGISTRY 已刷新 |
| bdl-queries | v0.3 | 现行（v0.1 / v0.2 已取代） |
| download-events | v0.1 | 冻结 |
| unity-bridge | **v2** | **已冻结（W21，2026-09-08，产线，互审收口：互审点 1–5 全关＋核心确认 planRef job 目录文件形态；冻结批交集成验收）**——v1 超集（同面升版）＋execute_production_job/restore_project＋批准计划 job 目录文件形态与 Bridge 本地哈希校验＋作业收据（dry-run 显式区分/steps 逐操作与来源转抄/replayed/snapshotId）＋恢复两态收据；16 向量＋6 消费测试（集成复跑 356/0，v2 修订 367/0）；协议双语 v2＋REGISTRY 已刷。v1 保持已接受：material 线（production-use-case v0.1）继续消费，双族并存语义对齐不合并 |
| recipe / local-resolution / approved-plan（schemas/recipe/v0.3） | v0.3 | **已冻结（W20，2026-09-08，核心，集成验收 0400bee：复跑 367/0＋clippy 零告警）**——M5 生产主线产物链前三件（意图/事实/授权；引用不复制）；build-record v0.3（W22，proposal 012 互审中）为套件收尾件 |
| material-intake | v0.1 | 冻结 |
| bdl（schema） | v0.1 | 冻结 |
| environment-managers（schema） | v0.1 | 冻结 |
| amf-production（schema / 向量） | v0.2 | **已冻结（M3 验收，2026-09-07）**；协议本 production-use-case v0.1 同日冻结 |
| recipe 套件（recipe / local-resolution / **approved-plan**） | **v0.3** | **已冻结（W20，2026-09-08，待集成验收合并）**——批准计划新产物（Bridge v2 输入，proposal 011/010 互审收敛）；v0.2 整体废弃不建迁移器 |
| production-use-case | v0.1 | **已冻结（M3 验收，2026-09-07）**——四项前置交付核实（T1 Schema/向量、双端契约测试、I-1 真机 16/16） |

## 开放问题（跨树）

| # | 问题 | 归属 | 载体 |
| --- | --- | --- | --- |
| 1 | I-1 真 Unity 矩阵 | 集成树 | **✅ 已交付关闭**（16/16 真机通过，合并 5ccace6；验收=证据清单核实+抽查终态+集成独立复验 1 格） |
| 7 | 三例均已命名并根因修复：① ph_010_mutation_gate（ec6b61d，测试尾部竞态改轮询）；② 运行时 Completed 发布竞态（49d1dac：publish 移入 tasks 锁内，真实时序窗口修复）；③ **CI ph_012（0a56f19，2026-09-08 定位）**：拉取 CI 日志（run 34137292736）核实 panic 实为 1579 行 "lease released after success"（非 15s deadline）——worker 按 safe_to_stop 设计先落终态再释放 mutation gate（marker/lock 文件 I/O 先于 SQLite 删除），测试看到终态后立即断言租约已清，2 核负载下输掉竞态；产品顺序正确，测试改为有界轮询等释放（保留原 panic 消息供证据可比）。残余观察（如实）：2026-09-08 本机 8 轮全量中 1 次 14/1 瞬败（套件约 0.19s，身份未捕获——输出未留存），随后 7 轮全绿；不做猜测性修复，再现即按程序取全量日志定位 | 核心 | ③ 修复已随批合并（80ad6e7）且 **CI 复跑绿**（rust run 34146584951，2026-09-08；同批 ts 34146584926 ✅、schema-vectors 34146584940 ✅）——本例关闭；残余观察态维持，再现即按程序带全量日志重开 |
| 8 | CI ts 徽章红：i18n 术语注解测试环境耦合——`current-table.ts` 按 `navigator.languages` fallback 选表，CI runner 为 en-US → en 表注解空串，3 个期望中文注解的测试失败；本地绿系隐性依赖开发机 zh-CN 系统语言。修复=f4d288d（测试 vi.mock 显式固定 zh-CN 表，生产代码零改动） | 桌面 | **✅ 关闭（2026-09-08）**：随 97390f8 入 main，CI ts workflow 复跑绿（run 34146584926） |
| 9 | 术语修正（**VPM = VRChat Package Manager／VPM 包 = VPM package**，W15 走查硬裁定）需评估受管文档面：product-boundary 双语、协议文档措辞核查；**v0.5.0 已发布文本不追溯**；M4 交付文档须用对术语；应用内 i18n/注释随 W15 重做切片由桌面按裁定修正 | 集成 | **✅ 彻底闭环（2026-09-08）**：集成域活文档修正 8011af4（product-boundary 1.1.1＋outline 2.0.6 双语）；应用面四语 i18n＋注释随桌面重做批 4fb6411；产线域 amf-unity **1.0.1** 镜像修正随批合并（7a8e72f）；design-standard 条目级旧形态随 W15 重做改版（桌面，重做批已移除条目选择器）。不追溯面：v0.5.0 发行文本、冻结协议文档（升版时修正，含 008 → v0.3 若立案）、warehouse-layout ADR |
| 10 | proposal 008：全局「生成后删除原始素材文件」开关的协议面（三路径；数据**正式表态路径 a**＝桌面偏好＋桌面编排零协议影响，反对 c；衍生变更〔007 偏好开关取代〕数据认可；**核心表态待**）→ 集成仲裁＋门序归属（路径 a 接线切片随 M4 收尾批或 M5 首批） | 核心 → 集成 | **✅ 已接受·路径 a（集成仲裁 2026-09-08，f37f752 后落提案）**：两域表态一致；接线＝桌面 Done 回执后逐条 deleteOriginals（权威边界照核心裁决）；路径 b 备而不用（用户裁决＋编排窗口语义设计物双前置）；路径 c 拒绝；007 取代确认；**接线切片归 M5 首批（桌面）**，M4 门验收不以此为前置；v0.2 维持冻结，零 wire/Schema 变化 |
| 11 | proposal **009**（产线，W21 契约先行）：Unity Bridge v2 升版骨架——现状审计＋五点骨架＋核心四问表态；**v2 契约草案已就绪并验收合并**（v1 超集＋execute_production_job/restore_project＋16 向量＋6 消费测试，集成复跑 356/0，后随 v2 修订 367/0）；互审点 1–5 **全部关闭**（1/2/3 产线互审关；4 rejected 收据语义＝012 §4.3 按产线语义收口；5 恢复点登记面＝012 §3.1 兑现） | 产线 ↔ 核心 | **互审收口（2026-09-08）**：核心已确认 planRef job 目录文件形态建议（#14 ①）＋rejected 豁免——**v2 侧无待审项，产线可冻结 v2 并开工 C# 侧**；冻结批交集成验收（契约表升版随冻结批） |
| 12 | proposal **010**（核心，W19 合并设计）：素材导入时自动生成挂点与编排语义——核心代码审计**导入面零生产调用、仓储条目零生产创建路径**（W19 真正前置＝导入面接线本身）；**集成已裁：路径 A**（挂点在导入任务条目落成点，同 TaskRuntime）＋**W18/W19 同批门序**（导入面是 W18 演示闭环前置）；六条编排语义硬承诺照单采纳；warehouse.import 新命令面冻结硬前置归数据（词表归属数据裁决） | 数据/桌面 → 集成 | **✅ 已接受·收口（2026-09-08）**：数据六点（**bdl-commands 升 v0.3** 承载 import、读时求值为数据明确偏好、六承诺认可、correlation 面归属意见）＋桌面三项（导入 UI 系统文件夹对话框优先/任务中心九态复用＋关联标注条件渲染/标注移除双条件）全部一致无保留；收口裁决＝**v0.3 冻结 M5 首批内先行**＋importCorrelationId 归属随 v0.3 冻结定＋执行序①v0.3 冻结→②核心 wire/挂点→③桌面呈现；改号簿记见提案注记（与产线 009 撞号，产线在先保 009）。**补记**：数据转正钉死 `importCorrelationId` 进 v0.3 词表（词表主导权行使），集成确认采纳 |
| 13 | proposal **011**（核心，W20 设计稿＝009 互审上游）：Recipe v0.3（locked 升格版本锁＋warehouse: 来源＋constraint/locked 分离）＋Local Resolution v0.3（effectiveArtifactMode 选择＋clean 守卫＋fallbackUsed 如实记录）＋**批准计划 approved-plan v0.3 ★新产物**（planHash 锚＋jobs[].resolvedSource＋fingerprint 预检＋无 executed 态）＋production-use-case v0.2 词表（§7 收敛决议：save 整文档＋读面闭集同构 catalog 先例） | 产线/数据/桌面 → 集成 | **✅ 收敛＋W20 冻结切片已验收合并（2026-09-08，0400bee：集成复跑 367/0＋clippy 零告警）**：三域表态齐；schemas/recipe/v0.3/ 三 Schema＋3 正例＋4 负例＋5 项消费测试入树；planRef 形态确认随冻结切片办理（#14 ①）——**W21/W24 实现的硬前置就绪** |
| 14 | proposal **011** 收敛补记＋W20 冻结切片交付（核心，2026-09-08）：①互审收口——产线两件确认已核（planRef＝job 目录文件投影＋planHash 本地校验采纳；rejected 豁免确认，v2 侧无待审项）；②收敛决议——四产物存储面＝AMF 生产持久域文档库形态（BuildRecordStore 先例，SQLite 表族不扩）、baseRevision 乐观并发归 production-use-case v0.2 命令面、读面闭集定稿、W23 解锁（数据）；③**W20 冻结切片交付**：schemas/recipe/v0.3/（recipe〔sourceRef warehouse 形态＋vpm_copy 锁对象〕＋local-resolution〔sourceKind/fallbackUsed/evidenceIds〕＋**approved-plan 新增**〔planHash 锚＋jobs[].resolvedSource＋无 executed 态＋kind 闭集〕）＋3 正例＋4 负例＋消费测试 5 项（crates/orchestrator/tests/recipe_v03.rs） | 核心 → 集成 | **✅ 已验收合并（2026-09-08，0400bee：集成复跑 367/0＋clippy 零告警）**——W21/W24 硬前置就绪 |
| 15 | proposal **012**（核心，W22 设计稿）：Build Record v0.3——★planId/planHash/planSchemaVersion 授权锚链＋★jobs[] 逐作业收据聚合（Bridge v2 转抄）＋★planDeviations 类型化计划偏差＋★recoveryPoints[]（互审点 5 兑现）＋recovery 段＋evidenceSummary（evidenceIds 引 W23）＋status 词表加 recovered；语义裁决四条（恢复点登记面/类型化偏差/转抄不解释/存储面沿 011 决议①） | 产线/数据/桌面 → 集成 | **讨论中（2026-09-08）**：产线互审已确认三核验点＋**两缺口建议**（jobs[] 补 `commandId` 聚合源身份＋`replayed` 转抄——诚实纪律保险）；待核心吸收两缺口＋数据〔evidenceIds 交界；Record 冻结不等 W23 的时序确认〕/桌面〔recovered 呈现语义〕表态；冻结门序＝build-record 为 recipe v0.3 套件收尾件，随套件交集成验收 |

## 待用户裁决

进程侧解决不了的问题升级到这里（规则见 `collab/README.md` 升级规则）；标 `[需用户]` 的条目，
各角色在 tick 中自动跳过。用户白天批量处理。

| # | 事项 | 提出方 | 状态/用户决定 |
| --- | --- | --- | --- |
| U1 | EAC 实验性恢复的边界裁决稿（proposal 006；集成仲裁已过：R1–R9 无修订） | 环境 | **✅ 用户已批准（2026-09-08 批量裁决，第三方仲裁复核后）**：006 R1–R9 无修订整体批准；附更严验收标准——「终止能力在允许清单为空时显示未核验/不可用」（R8 实现措辞按用户批准语义第 2 点收紧；八点批准全文见 006 内联线程，环境已落档 6006bf4）；**M6 相关实现获授权**，开窗后环境按 R9 执行 |
| U3 | F6：VUA 是否写外部工具（ALCOM/VCC）管理的项目 | 桌面 | **✅ 用户已裁决（2026-09-08 批量裁决）**：**(a) 只读兼容＋「导入为 VUA 管理的副本」**——语义规格已落 product-boundary **1.2.0**（集成双语：允许/禁止清单＋副本五项规格＋跨工具锁不可行 rationale＋`1.0.x` 写能力一律 false 收紧条款）＋outline 2.0.7 F6 锚点；桌面 M5/M6 实现按 1.2.0 执行 |
| U5 | VUA-2/VUA-3 内 node_modules.pre-rename 与 target.pre-rename 目录清理 | 集成 | **维持暂缓**（2026-09-08 批量裁决未提及；不阻塞进度，留挂） |
