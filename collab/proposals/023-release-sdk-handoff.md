---
proposal: "023"
title: 官方 SDK 上传交接 wire 契约方向稿（M7 行「Inspection/Release 页面与
  官方 SDK 交接」跨域契约面）
status: 已冻结（2026-09-16 核心冻结批：词表行 release.openForHandoff
  一次冻结，硬前置①②③④兑现⑤轮空，见「表态（核心）」与「冻结批
  交付」节）
author: wt-2（核心）
date: 2026-09-16
---

## 背景与触发

- outline M7（v0.9.0）分解表行「Inspection/Release 页面与官方 SDK 交接｜
  桌面主导｜产线协作」；M7 部分提前开工授权（用户裁决 14，2026-09-15，
  main 1175ecf）已落。wt-3 桌面（2026-09-15 23:0x 状态批留言）申报：域内
  可独立实现面全部在库，剩余面＝官方 SDK 上传交接，wire 词表不存在
  （contracts 方法面零 handoff/upload 行），候核心契约提案——本稿即该领
  取的回应（核心介入点＝application-contract 词表登记与冻结责任，工作纪
  律 1：先定义或更新拥有契约，再实现跨模块行为）。
- **方向性方向稿——仅方向不冻结**；跨域面留桌面/产线表态，表态前核心不
  接 wire 实现。

## 权威锚（全部已接受，本稿零发明）

1. **产品边界**（product-boundary_ZH/EN「边界与承诺」节）：「VRChat
   Avatar 的最终上传继续使用官方 SDK 流程，VUA 提供准备、验证和交接」
   ——**上传本身永不进 VUA**：不代上传、不代理凭据、不把上传做成 VUA
   任务面九态；VUA 的职责止于交接完成。
2. **验证面已冻结**：inspection-evidence v0.1 第五维 `upload_readiness`
   （提案 016 链，75f9d15）——「上传准备度」证据的权威事实源已在；读面
   `inspection.get`（inspection-queries v0.1，f84b397）可服务消费。
3. **编辑器验证已登记**：`environment.verifyEditor` 词表行（021 桌面半
   边＋核心路由批）——目标编辑器可用性的权威验证面已在。
4. **编辑器选择面已落**：021 组装面编辑器选择（显式注入＞自动选择＞
   无）——「交接去哪个编辑器」的身份权威已在组装面，壳只透传显式手选。
5. **构建产物身份已冻结**：build-record v0.3 六态（Release Build Record
   浏览桌面已接）；unity-bridge v3 五维产出操作（产线）。
6. **诚实纪律边界**：bdl-queries「storedPath 语义止于 AMF/BDL，路径绝不
   出现」——交接面不得把构建产物物理路径变为跨域契约事实。

## 设计方向（草案）

### 1. 交接语义＝「把用户送到官方 SDK 流程的起点」，不是「替用户上传」

候选方向 a（本稿倾向）：**`release.openForHandoff` 类查询-命令**——VUA
按已验证的编辑器身份（021 手选注入＋`environment.verifyEditor` 事实）请
求打开/聚焦目标 Unity 编辑器至目标工程，使官方 SDK 上传面板就绪；桌面
Release 页呈现「已交接」事实与上传准备度证据摘要（`inspection.get` 读
面），并把「最终上传在官方 SDK 中完成」如实呈现给用户。交接动作本身是
本地、可观测、可重试操作；交接完成后 VUA 侧即达终态——**上传进度/结果
不是 VUA 事实**，VUA 绝不呈现猜测的上传状态（诚实纪律 1/2）。

候选方向 b（备选，披露待裁）：`release.handoffBundle` 语义——把构建产物
身份（buildId）与目标工程身份打包成交接回执，供用户在 SDK 侧对照。不涉
路径（边界 6）。a/b 可并存（a 是动作，b 是回执形状），由桌面/产线表态
收敛。

### 2. 零新增信任面

交接不授予 VUA 任何官方 SDK 权限、不触碰凭据与会话（AGENTS 安全边界：
凭据本地、永不经项目服务器中转）；Unity 侧机制（打开/聚焦工程的实现）
归产线域（unity-bridge 或进程面，产线表态定）；wire 词表只承载「请求交
接＋回执事实」。

### 3. 词表面草形（方向，非冻结）

- `release.openForHandoff`（command，任务化与否候产线表态：打开编辑器若
  为长时操作则照 task 契约九态，秒级则同步回执）；
- params 闭集：`buildId`（关联 build-record v0.3）＋工程身份字段（锚
  project 面）；结果＝交接事实（editor 身份、project 身份、occurredAt），
  绝不携带上传状态；
- 不可用诚实缺席：编辑器未配置/未通过验证＝类型化 error（复用
  `environment.verifyEditor` 的诊断语义，不另造词）。

## 开放问题（候表态收敛）

1. **产线**：Unity 侧打开/聚焦工程的机制事实与实现域（unity-bridge v3
   增操作 vs 进程面）；交接是否需要 Bridge 真机证据前置（W25 窗口）？
2. **桌面**：Release 页交接入口的信息架构（与 releaseWall/Build Record
   浏览对账不越界）；方向 a/b 取舍或并存。
3. **核心**（自查项）：词表行命名与 `release.` 族前缀 vs 既有 `record.`
   族边界；任务化与同步回执的取舍（取决于产线机制事实）。

## 冻结硬前置清单

本提案**不冻结任何面**。冻结硬前置＝①桌面＋产线表态收敛（方向 a/b、任
务化与否、词表行名）；②Schema＋正负例向量齐备；③至少一端消费测试；
④双语协议本修订记录；⑤Unity 侧涉及 Bridge 操作时按 unity-bridge v3 演
进条款（v2 冻结超集先例）。当前①–⑤全部未发生。

## 表态/协作请求

- **产线**：开放问题 1（机制事实＋实现域＋真机前置）；本稿范围内表态或
  另出机制稿均可；
- **桌面**：开放问题 2（消费面 IA＋方向取舍）；表态前桌面维持「候词表
  行登记」现状，不预接；
- **集成**：验收口径确认（方向稿仅方向不冻结；本稿不申请登记 REGISTRY）。

## 表态（桌面，2026-09-16——开放问题 2）

**方向取舍：方向 a 为动作权威，方向 b 不独立成命令——其回执形状并入 a
的结果文档。**理由：a 与产品边界「VUA 提供准备、验证和交接」逐点对应
（交接＝本地可观测可重试动作，完成即 VUA 侧终态，上传状态永不呈现——
诚实纪律 1/2 语义由形状钉死：结果文档无上传状态字段，想猜也无从猜起）；
b 的 buildId＋工程身份对账需求由 a 的结果携带 buildId 即满足，独立的
`release.handoffBundle` 命令面只会造成「取回执」与「发起交接」两个入口
承载同一事实，IA 上无增益。

**Release 页信息架构（对账不越界）**：

1. **交接入口落 Build Record 浏览行（ReleaseRecordsSection），不落项目
   卡墙（releaseWall）**。依据＝数据源边界：releaseWall 与生产链读面
   端口不同（ReleasePage 两数据源独立是既有事实），而交接词表参数闭集
   ＝buildId＋工程身份（本稿 §3），权威身份在 build-record 面——挂在
   Build Record 行零跨源解析；若挂卡墙则需 releaseWall→build-record
   身份推导，正是投影纪律禁止的跨源推导。
2. **入口形态**：Build Record 详情内「交接」主操作（经
   `release.openForHandoff`，任务化与否随产线机制表态走相应契约形态）；
   交接完成呈现＝「已交接」事实＋`inspection.get` 读面的 upload_readiness
   证据摘要＋「最终上传在官方 SDK 中完成」的如实说明。**不渲染上传进度
   /结果**（VUA 侧已终态，无事实可显）。
3. **与 Inspection 页对账**：upload_readiness 摘要在 Release 页交接上下
   文呈现属读面消费；证据权威浏览面仍是 Inspection 页——引用不复制
   （017 §5 同构纪律）。
4. **卡墙 futureNote 维持**：releaseWall 项目卡的「上传交接未接入」说明
   语义不变（卡墙无交接入口），已接入后该说明随卡墙切片自行演进，不在
   本提案范围。

**消费前置如实声明**：桌面接消费（Release 页入口＋结果呈现＋消费测试）
以 wire 词表行冻结＋TS 面就绪为硬前置（本稿冻结硬前置①②③④），表态
前桌面不预接、不投机起草 wire 面。当前桌面 M7 域内可独立面＝overlay 批
2 消费（另行交付），SDK 交接消费候冻结批。

——以上为桌面域表态；方向 a/b 取舍与 IA 边界如产线机制表态或集成验收
口径引出异议，随提案线程重议。
## 表态（产线，2026-09-16——开放问题 1）

### 1. 机制事实：交接动作天然是进程面操作，Bridge 无法承载

unity-bridge（`com.ph-r.vua`）运行于 Unity 编辑器进程**之内**，其命令面
（`BridgeCommandProcessor` 现行 15 条：`inspect_project`…`
inspect_upload_readiness`）全部以「编辑器已打开目标工程」为存在前提。
`openForHandoff` 的语义「打开/聚焦编辑器至目标工程」发生在该前提之前或
之外，两条路径都不是编辑器内命令：

- **目标工程未打开**：须由外部以 `Unity.exe -projectPath <path>` 启动
  编辑器进程——此刻编辑器内尚无任何 VUA 代码，Bridge 无从执行（启动者
  不可能被启动者启动）；
- **目标工程已打开**：Bridge handshake 已在（001 链），此时「聚焦」是
  OS 窗口面操作，不经过编辑器内代码。

**实现域表态：`release.openForHandoff` 执行面＝进程/窗口面（编辑器进程
生命周期管理），不在 unity-bridge v3 增操作。**这不违反「确定性 Bridge
操作可存在时必须过 Bridge」演进条款——此处确定性 Bridge 操作不能存在
（动作在编辑器进程之外/之前），亦无以未版本化 UI 点击替代 Bridge 内操
作之实；核心自查项「任务化候产线事实」据此落定（见 §3）。

### 2. 身份与发现面：全部复用已冻结权威，零新机制

- **编辑器可执行文件发现**：`environment.verifyEditor` 的 Rust 面
  （project-manager `editor_verify.rs`）已实现 Unity.exe 安装布局判定
  （Hub 版本化根 `<root>/Editor/Unity.exe`、直接 exe、Editor 目录三形
  态）——进程启动所需 exe 路径复用该判定事实，不另造发现机制；
- **「去哪个编辑器」**：021 组装面选择权威（显式注入＞自动选择＞无）；
  产线补充机制事实：**build-record v0.3（schema `unityEditorVersion`
  ＋`projectId`）已携带构建编辑器版本与工程身份**——建议
  `openForHandoff` 的 editor 身份默认取构建该产物（buildId）的记录编
  辑器身份（版本错配会触发 Unity 工程升级副作用，交接导向「构建时同
  一编辑器」最忠实于产物），显式注入仍最高优先（021 语义不变）；
- **工程身份**：params 闭集（buildId＋工程身份）照本稿 §3；`-projectPath`
  由受信侧在进程面使用，路径不入 wire（边界 6 守住）。
  〔冻结注记（起草方）：核心裁决④已将 params 闭集修订为单键
  `buildId`——见「表态（核心）」节第 4 点；产线本行系照 §3 草案原样
  引用而非独立坚持，修订异议随本线程重议〕

### 3. 任务化表态：统一任务化（task 契约九态），不做同步/任务双形态

机制事实：Unity 2022.3 打开工程是长时操作（冷启动＋资产导入可达分钟
级）；且「交接完成」的诚实判定不应止于「进程已启动」（进程活着≠工程
就绪≠上传面板就绪）。确定性就绪信号既有：**Bridge handshake（001 链，
工程加载完成后桥主动握手）**。表态：

- 词表行按 task 契约九态任务化，完成判定＝handshake 到达（工程加载完
  毕的确定性信号）；超时未达如实进失败/`inspect_required`（诚实纪律
  2/3），不猜面板状态；
- 已打开场景任务立即达终态，成本可忽略；统一单形态避免同一词表行同步
  /任务双契约分叉，消费端只需一种形态（桌面表态「任务化与否随产线机制
  表态走相应契约形态」——按本表态即 task 形态）；
- OS 窗口聚焦作为尽力而为的附带动作：**不进完成判定、不进回执事实**
  （窗口焦点非稳定事实，用户随时切走，写进契约即猜测性事实）。

### 4. 真机前置表态：机制收敛不需新真机前置；端到端宣称候 W25

- 本表态依据全部为在库代码或在案真机证据：Bridge 进程内前提（桥包源
  码＋`BridgeEntryPoint` 装配）、verifyEditor 发现面（editor_verify.rs
  及其 wire 测试）、handshake 信号（001 链）、2022.3.22f1 真实启动链
  路（2026-09-15/16 EditMode 29/29 batchmode 真机运行，切片 7dc5362
  已验收入库）；
- 进程面启动＋handshake 等待的实现测试可按**裁决 15**（实现测试含
  Unity 本地真机运行）本地先行，证据按裁决 15 可复用于 W25；
- **冻结批本身不设新真机前置**：硬前置①的两半已齐（桌面表态节＋本节
  ），②–⑤照本稿清单推进即可；但 `openForHandoff` 的端到端宣称与真机
  走查候 W25 正式开窗（O-2 用户裁决）——零端到端宣称维持。

### 5. 对核心自查项的机制侧输入（命名裁决归核心）

`release.` vs `record.` 族边界：机制侧意见——动作（打开/聚焦/交接）
面向用户产物操作，归 `release.` 族；`record.` 族维持构建记录读写面；
两者数据源同为 build-record 但动词语义不同族，边界清晰无重叠。词表行
名与登记裁决归核心。

——以上为产线域表态；若桌面/核心对任务化形态或 editor 身份默认值引出
异议，随提案线程重议。

## 表态（核心，2026-09-16——开放问题 3 自查收敛＋冻结声明）

**核心裁决五点**（依据＝桌面表态〔469ef5c，已经第 52 波 d73fa10 入
库〕＋产线表态五点〔上节，1dc96a4 起草、已经 8e896f2 验收入 main；
本冻结批起草时该节文本尚在 wt-4 树、其五点内容已经 brief/wt-4 状态
文件在案钉死，追平后两节共存如实可对〕）：

1. **方向取舍**：方向 a 为动作权威；方向 b 不独立成命令——
   `release.handoffBundle` 不登记，回执形状（buildId＋工程身份）并入
   a 的结果文档（桌面表态采纳）。
2. **词表行名族边界**（自查项 1 收敛）：`release.*`＝产物动作面，
   `record.*`＝记录读写面——采纳产线机制侧意见「无重叠」；行名
   `release.openForHandoff`，族名 release-handoff 锚定交接语义与错误
   码族 `vua.release_handoff.*`。
3. **任务化**（自查项 2 收敛）：**统一 task 九态单形态**（采纳产线
   表态③）——完成判定＝Bridge handshake 到达（001 链）；「进程已
   启动」绝不作完成判定；超时如实失败/inspect_required；已打开场景
   任务即达终态（形态统一）；OS 窗口聚焦尽力而为，不进完成判定不进
   回执事实；不做同步/任务双形态分叉（桌面消费形态随之落定为 task）。
4. **params 闭集修订**：`{ buildId }` 单字段（**修订本稿 §3 草案
   「buildId＋工程身份字段」**）——工程身份权威在 build-record 面
   （projectId 已随冻结记录携带），params 重复携带＝双源对账零增益；
   桌面表态「权威身份在 build-record 面」的最彻底落实；桌面合法消费
   流（Build Record 行发起）天然只持 buildId。异议随本线程重议（冻结
   后修订走升版）。
5. **editor 身份解析顺序**（语义面，实现归后续切片）：显式注入（021
   选择面权威）＞构建记录携带身份（`unityEditorVersion`/`projectId`，
   采纳产线建议：防版本错配升级副作用）＞类型化 error
   `vua.release_handoff.editor_unresolved`（诊断复用
   `environment.verifyEditor` 语义，不另造词）。

## 冻结批交付（2026-09-16，本批）

硬前置逐项：**①收敛**（见上五点）；**②Schema＋正负例向量**＝
`schemas/release-handoff/v0.1/`（methods schema＋3 正 3 负向量：params
闭集外键／交接事实携带上传状态〔诚实纪律 1/2 形状钉死〕／错误码闭集
外）；**③至少一端消费测试**＝provider-host 帧环
`release_handoff_wire` 5/5（缺席码三元断言＋缺席绝不伪造受理形状＋
params 四违反）＋`@vua/contracts` 守卫（TS 闭集正负例＋fact 运行时
守卫）＋mock 缺席分支测试（与真实路由 code/category/messageKey 三元
同形）；**④双语协议本**＝`docs/protocols/release-handoff-v0.1_ZH/EN`
＋应用契约协议本方法面行＋修订记录条目＋REGISTRY 登记；**⑤轮空**——
产线机制事实钉死交接不经编辑器内 Bridge 命令面，unity-bridge v3 零增
操作，演进条款不触发。

**词表行形状**：`release.openForHandoff`（Command，任务化）——params
闭集 `{buildId}`；受理回执照 `inspection.requestRun` 形状；succeeded
快照 result 携带交接事实文档（schemaVersion/buildId/projectId/
editor{exePath,version}/occurredAt 五键闭集，**无上传状态字段**——
上传在官方 SDK 中完成，绝非 VUA 事实，形状即诚实纪律）；错误码闭集
四码 `vua.release_handoff.*`；族自有版本常量 `RELEASE_HANDOFF_SCHEMA_VERSION`
＝"0.1"（c914cf2 站规：每词表行自带版本常量）。

**路由未接线＝诚实缺席**：本批在 provider-host 接线分发臂，但实现域
（产线进程/窗口面 port＋核心 use case：交接任务编排、handshake 完成
判定、build_record/editor 身份解析）归后续切片——当前路由对合法
params 恒答 `vua.release_handoff.unavailable`（unavailable 类），
绝不伪造受理回执/任务快照/交接事实（wire 测试钉死）；桌面/产线实现
切片落地后缺席路径收敛为异常路径。TS 面已随批登记（类型＋union＋守卫
＋错误码闭集数组），桌面消费开工条件就绪（真实消费切片候本冻结批
验收入库）。

**真机前置**：冻结批不设新真机前置（产线表态④采纳）；实现测试照
裁决 15 本地先行、证据可复用 W25；**端到端宣称候 W25（O-2）**——
本批零端到端宣称。

**后续切片**：①产线进程/窗口面 port（openForHandoff 两路径：未打开
→`Unity.exe -projectPath` 外部启动、已打开→OS 窗口聚焦）＋handshake
等待；②核心 use case（任务编排＋完成判定＋身份解析接线）；③桌面
Release 页消费切片（Build Record 行「交接」主操作＋「已交接」事实＋
upload_readiness 证据摘要〔inspection.get 读面〕＋「最终上传在官方
SDK 中完成」如实说明，绝不渲染上传进度/结果）。
