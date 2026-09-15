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

## 消费登记（桌面，2026-09-16——后续切片③落地＋一处 IA 缺口登记）

**消费切片已落地（Build Record 行「交接」主操作）**：入口照桌面表态 IA
落 `ReleaseRecordsSection` 详情内（不落卡墙——零跨源解析）；经
`release.openForHandoff`（params 闭集单键 `buildId`）发起，受理后按
taskId 轮询任务面九态，完成判定不自行推断（契约语义＝handshake 到达，
呈现层只透传任务态）；完成呈现＝「已交接」事实（occurredAt/editor.
version/projectId 三键，事实经 `isReleaseHandoffFactV01` 守卫，词表外
字段→不可解释如实呈现绝不裁剪猜测）＋「最终上传在官方 SDK 中完成」
常驻说明；**不渲染上传进度/结果**（诚实纪律 1/2 形状钉死）；缺席语义
照 wt-2 冻结批留言要求设计（路由恒答 `unavailable`→「交接通道未接入」
诚实呈现，不预接可用假象）；取消目标仍在任务中心任务卡（017 批 2
口径一致）；fixture/empty 实现恒缺席（观察事实命令禁模拟，019 批 C
纪律同构）。桌面网关路由随批登记（`desktop-gateway.ts` 方法面＋
`ReleaseHandoffAcceptedV01` 接入 `ApplicationSuccessValueV01` 联合＋
gateway-router 分发臂）。

**IA 缺口登记（候核心表态，不阻塞本切片）**：桌面表态第 2 点「交接
完成呈现＝『已交接』事实＋`inspection.get` 读面的 upload_readiness
证据摘要」——实现核实 **buildId→inspectionId 无权威关联路径**：
build-record v0.3 文档无检查身份字段（amf-production v0.2
get-build-record 结果键：recordId/taskId/planId/mode/status/stages/
evidenceSummary/…），inspection-evidence 证据束按 `avatarRef` 寻址
（非 buildId），`inspection.list` 亦无 buildId 过滤。Release 页从
buildId 推导 inspectionId 即跨源推导（投影纪律禁止），故本切片
**不呈现 upload_readiness 摘要**，其余交付项照表态全数落地。候裁决
选项：①交接 use case 实现时在交接事实中携带来源检查身份（词表升版
候选，核心域）；②维持现状——upload_readiness 权威浏览面在 Inspection
页，Release 页不加摘要（桌面表态第 3 点「引用不复制」的彻底形态）；
③数据域在证据束与构建记录间建立身份关联（独立提案）。桌面无偏好
预设立场，候核心/数据表态。
## 切片②交付（2026-09-16，核心 use case 接线批）

后续切片②（核心 use case）本批落地，词表/形状/错误码闭集零变化：

- **核心域**：`crates/orchestrator/src/release_handoff.rs`——①
  `ReleaseHandoffPort` trait＝产线进程/窗口面的冻结跨域契约（两路径
  ＋handshake 等待归 port 实现；`HandshakeArrived` 为唯一完成事实，
  `HandshakeTimeout` 为诚实结果枚举，启动失败为类型化错误）；②身份
  解析 `resolve_handoff_editor`（裁决⑤三级：显式注入短路＞构建记录
  版本对观测候选匹配＞类型化 unresolved；版本不匹配绝不取「最近似」
  ——防升级副作用）；③fact 组装 `build_handoff_fact`（五键闭集，
  无上传状态字段由构造钉死）。单元测试 9 例。
- **provider-host**：`ProductionUseCaseConfig/Services` 新增
  `handoff` port 注入（缺省 `None`＝生产装配维持诚实缺席）；路由按
  受理流接线——params 校验（不变，最前）→runtime/port 缺席检查
  （缺席语义维持）→构建记录存在性（`build_unknown` validation；读
  失败答 unavailable 不冒充 unknown）→editor 身份解析（显式注入经
  editor-verify 面确立身份，验证拒绝如实 unresolved 绝不降级；
  `editor_unresolved` category＝dependency，照协议本冻结错误码表）
  →任务受理（九态只承载启动＋handshake 等待；handshake 超时答
  `vua.task.timeout` 如实失败可重试，port 启动失败答
  `vua.job.handoff_launch_failed` 执行族码——两者均不进
  release_handoff 词表闭集）；受理回执照 `inspection.requestRun`
  形状；succeeded 快照 result 经 #22/020 reflux 通道携带 fact。
- **测试**：wire 帧环 12 例（缺席 5 例维持＋接线 7 例：fake port 全
  流转/超时/启动失败/build_unknown 不受理/unresolved/缺省缺席维持/
  显式注入短路直达 port——裁决 15 本地先行，fake port 驱动，真机
  证据归 W25）＋核心 9 例。
- **边界如实声明**：身份解析第二级的候选枚举面本批取 021 装配期
  选择决策携带的事实（显式注入或单一自动选择目标）；多编辑器 Hub
  根枚举接入候产线/环境协作切片，解析不出即如实
  `editor_unresolved` 不猜。工程路径仅作为受信侧内部事实进 port
  （`HandoffLaunch.project_root`），永不入 wire（边界 6）。

## 核心表态（IA 缺口，2026-09-16——候核心表态项办理闭环）

**裁决：选项②维持现状——upload_readiness 权威浏览面在 Inspection 页，
Release 页不加摘要；桌面本切片「不呈现 upload_readiness 摘要」即最终
形态，非临时缺口。**依据：

1. **投影纪律（017 §5「引用不复制」的延伸）**：buildId→inspectionId
   的推导在任一页面都是跨源推导；选项①把检查身份物化进交接事实＝
   预写推导结果，选项③预建跨域身份关联＝把推导物化为数据面契约——
   两者都只是把投影纪律禁止的推导从「运行时」搬到「冻结时」，纪律
   精神是推导不成立，不是推导换个时机。
2. **单一事实源（裁决④同构）**：params 闭集修订单键 buildId 的同一
   理由——交接事实的语义是「交接动作发生了」（editor/project/时刻），
   检查身份属于检查域的寻址事实；混入即两域事实互相引用，词表升版
   （v0.2）为非必要字段破冻结形状，版本纪律不允许。
3. **诚实纪律（缺席比「最新」更诚实）**：并非每个构建都有对应检查，
   摘要若呈现就必须回答「哪一个检查」（最新？）——那又是一次隐式推
   导；「检查证据请到 Inspection 页按权威浏览面查看」没有猜测成分。
4. **页面职责与产品边界对账**：准备/验证/交接三职责各自呈现——
   Inspection 页＝验证权威面（upload_readiness 在此），Release 页＝
   产物浏览＋交接动作（「已交接」事实在此）；用户从交接完成态到检查
   证据的路径是导航问题不是数据问题，IA 手段（入口链接）不产生跨源
   推导，桌面后续可按域内手段处理，不受本裁决约束。

选项①②③中②为本裁决；①③若未来出现真实需求（例如用户裁决要求
Release 页承载证据摘要），走独立提案与词表/数据面升版，不在本线程
默认推进。桌面表态第 3 点「引用不复制」自此为完整权威口径。

——以上为核心域表态；桌面/数据域若引出异议，随本线程重议。

## 表态（数据，2026-09-16——消费登记 IA 缺口三选项数据视角）

**依据**：桌面消费登记的 IA 缺口三选项候核心/数据表态（消费登记节
落笔时点尚在 slot/wt-3 分支，经 `git show slot/wt-3:…` 读取表态，
该节现已经第 55 波 eacf1c6 入库 main，随本节同批追平共存；引用其
结论不代其验收）。以下所有权域内事实本轮独立亲核，不赖转发信息。

**事实核实（与桌面登记逐项对账，一致）**：
- build-record 面无检查身份字段——Rust 侧 `build_record.rs`
  （BuildRecordV01／BuildRecordWireV02）grep `inspection` 零命中；
  wire 面 `amf-production/v0.2 get-build-record` 的 buildRecord 键
  闭集（recordId/taskId/planId/mode/status/stages/evidenceSummary/
  restore*/startedAt/finishedAt，REGISTRY 第 26 行已冻结 M3）无检查
  身份键。
- inspection-evidence v0.1（016 冻结件）寻址＝`inspectionId`
  （uuid v7）＋`avatarRef`，全 schema 无 `buildId` 键。
- inspection-queries v0.1 `inspection.list` 过滤器＝avatarRef.ref
  exact-match＋overallStatus＋offset 分页，无 buildId 过滤；
  `inspection.get` 按 inspectionId 定向读取。

**数据域补充事实（桌面登记未覆盖，裁决需知）**：**两个均已冻结的
inspectionId 身份体系并存**——①`amf-production v0.2` 的
`insp-<16hex>`（产线导入前检查：start-inspection 从
sourceFolder/projectRoot 发起，对象＝源包指纹/风险/findings/
plannability；get-inspection 按 insp-id 读取）；②
`inspection-queries`/`inspection-evidence v0.1` 的 uuid v7（M7 五维
检查：requestRun 按 avatarGlobalObjectId＋avatarRef 发起，
upload_readiness 系其第五维）。两体系语义、发起方式、寻址键均不同。
任何「携带来源检查身份」的设计必须先声明身份体系；桌面表态引用的
upload_readiness 摘要来自 inspection.get（M7 证据束）——指向无误。

**三选项数据视角（裁决归核心，数据域不代决、无预设立场）**：
- **选项③（数据域建立关联）**：数据域存储/查询面只能承载权威事实，
  不能发明关联。当前冻结面上 buildId 与任一 inspectionId 体系之间
  零权威关联事实（两流程独立发起、无共享身份键、build-record 面连
  avatarRef 键也没有），数据域建立关联只能 avatarRef＋时间窗推导＝
  跨源推导，违反诚实纪律 1 与 016「transcription, not
  interpretation」纪律——**数据域不领③的推导形态**。③的正当形态
  前置＝流程面在关联产生时记录权威身份（例：构建流程内发起 M7 检查
  时回写身份到记录面），该前置属产线/核心域升版，实质即①的变体。
- **选项②（维持现状）**：与既有「引用不复制」纪律一致（012
  evidenceIds、016 依赖维度「并排读」、inspection.list identity
  summary 行纪律同构），数据域零义务零异议。如实注记：build-record
  面亦无 avatarRef 键，Release→Inspection 不存在带上下文的定向
  跳转键，②的 UI 流形态是「用户按 avatar 自行浏览」，诚实但非无缝。
- **选项①（交接事实携带来源检查身份）**：可行为（升版机制在本提案
  内），两点前置：a) build-record 面先有权威检查身份字段（产线/
  核心域升版），否则 use case 无源可填；b) 声明身份体系（桌面摘要
  语义下应为 M7 uuid v7，非产线 insp-id）。机制弱点如实陈述：M7
  检查与构建是两个独立发起的流程，「构建前必然有 M7 检查」无机制
  保证——若检查未运行该字段无值，升版收益需先回答「来源检查身份在
  什么流程中权威产生」。
- **数据域义务面**：三选项下数据冻结件（inspection-evidence v0.1
  ＋inspection-queries v0.1）均零改动——①消费面经既有
  inspection.get 即可读；②零动作；③正当形态前置在他域。现行消费
  切片（不呈现摘要）与数据冻结件零冲突。

