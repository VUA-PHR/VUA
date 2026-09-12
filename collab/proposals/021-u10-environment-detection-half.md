---
proposal: 021
title: U10 环境半边——手选编辑器路径验证原语（editor_verify v0.1）与设置面检测接缝
status: 已接受（2026-09-13 集成仲裁定形，见内联线程末节）
author: wt-6（环境）
date: 2026-09-12
---

## 背景

- **U10 已裁决**：用户 ADR `docs/decisions/path-configuration` 双语（698e738，
  登记 11745df）接受「默认零配置＋补救式手选＋三道验证（身份/版本/信任呈现）」
  组合形态并扩展为路径类配置通用规则；BOARD U10 行明示分工＝桌面（设置 UI＋壳
  注入）＋核心（Provider 消费）＋**环境（检测预填协作半边）**，实现切片自
  2026-09-12 23:00 工作窗口开工。本提案＝环境半边的操作形状（照 009 契约先行
  惯例：产出方先出形状、受影响方表态、集成仲裁）。
- **现有事实源（本机核实，锚定现状不发明）**：
  1. 核心 env 引擎 `unity_editors` 检查项＋`installed_unity_editors`
     （crates/orchestrator/src/environment.rs）：Hub 根目录枚举，产出
     `InstalledUnityEditor { parsed, path }`——job.execute 准入预检事实源
     （proposal 009 表态 4 ①②）；
  2. environment-managers v0.1 快照 `editors[]`（本域，
     schemas/environment-managers/v0.1）：同根枚举＋支持矩阵四分类
     （production_target / migration_source / other_unity_version /
     tuanjie_family）＋china 标记＋引导码，经 `project.environmentManagers`
     读面（013 第一翼）到桌面。
  3. **两条面的共同缺口（ADR 规范性要求 vs 现状）**：
     - **无来源呈现**——ADR 验收标准第 5 条要求「环境与路径」节逐行含来源
       （已探测 / 手选 / 跟随外部管理器），两条检测面均无来源字段；
     - **无手选验证能力**——两侧均按 Hub 目录名解析版本；而 ADR 门① 明文
       「读取版本串确认确为 Unity 编辑器，**不信任路径名**」，手选补救路径
       当前无任何机器事实可依。
- **本批已交付（草案态，pre-arbitration）**：`crates/project-manager/src/
  editor_verify.rs`（editor_verify v0.1，2026-09-12，commit 3eef4e4）——
  ADR 门①②的检测域事实原语：
  - **门① 身份**：从编辑器可执行文件自身 PE 版本资源（version.dll：
    GetFileVersionInfo*/VerQueryValue，遍历资源自带 Translation 表＋中性
    040904b0 回退）读取 FileVersion/ProductVersion——绝不读目录名；目录名
    仅作信息性 root 记录；
  - **门② 版本**：解析后交核心 `editor_targets` 分类器（单一分类权威，
    复用不复制），产出分类＋兼容政策引导码（`vua.env_managers.editor_*`），
    消费方只渲染不晋升——非生产目标绝不静默使用；
  - **输入三形态**：exe 文件本身／版本化根目录（`<root>/Editor/Unity.exe`）／
    Editor 目录（`<root>/Editor`），归一化到 (root, exe)；
  - **拒绝码闭集 5 码**（`vua.editor_verify.*`）：target_missing /
    exe_missing / identity_unreadable / not_an_editor / unsupported_platform；
    拒绝＝正常发现（ADR：失败即空态加引导），不隐藏不伪造；
  - **测试**：合成 9 项（三布局／生产目标／迁移源／china 诊断／tuanjie／
    构建元数据后缀回退／**「目录名声称 2022.3.22f1 但身份不符必须拒绝」**
    反例／资源不可读／目标缺失）全绿；真机探针 `#[ignore]` 门控（照 eac
    先例，默认 cargo test 不触真实安装）；**真机证据 2026-09-12 本机：默认
    Hub 根下 3 个真实编辑器全部 Verified，版本资源身份与目录名逐一一致**
    （探针同时交叉断言两者，分叉即响亮失败——此断言是门①「不信任路径名」
    的机器化表达）；
  - **依赖声明**（工作纪律 6）：windows-sys 在既有 `=0.61.2` 固定依赖上增
    `Win32_Storage_FileSystem` feature（所有者 Microsoft，MIT/Apache-2.0，
    移除路径＝若身份源变更则随模块一并撤除；版本资源 API 位于该 feature）。
- **边界声明**：ADR 门③（信任呈现＋首次实际使用前一次确认＋选择留痕）＝
  设置面呈现＋持久化，环境不建模；「一个配置面喂两条链」的后端激活与
  `VUA_UNITY_EDITOR` 壳注入＝核心消费侧；设置 UI＝桌面。环境只主张：检测
  事实＋验证原语。

## 提案

1. **editor_verify v0.1 作为手选补救路径的检测域事实原语入库**（语义权威
   ＝ADR 已裁决，本提案仅申报实现与闭集拒绝码）。无 wire 面——传输接缝
   见第 2 点，接缝未决前原语不接路由、不称端到端。
2. **接缝表态请求（不猜测先行）**：
   - **→ 桌面**：「环境与路径」节 unity_editors 项预填候选消费哪条检测面——
     `project.environmentManagers`（含分类＋引导码）与/或
     `environment.getSnapshot`？预填除 {path, version, classification,
     guidance_code, chinaDistribution} 外还需何字段？手选入口三形态（exe／
     根目录／Editor 目录）与 ADR「不出现在任务中途」的空态＋一键跳设置的
     呈现形状？
   - **→ 核心**：验证原语的路由面（新查询词表 vs 设置面专用 face——照 T-A
     先例 wire 词表为新协议面走桌面提案→核心裁决流程，环境服从裁决）；
     `VUA_UNITY_EDITOR` 注入的消费语义与零配置直用策略（唯一生产目标即
     激活，多候选生产目标优先其次 Hub 默认——选择过程对用户不可见）；ADR
     通用规则第 5 条「按机器存储」的用户手选编辑器持久化归属（核心机器
     设置 vs 环境域）？
   - **→ 数据**：无义务知会（检测事实不进 BDL，照 011 §5 收敛决议同构）。
3. **来源字段增量候决而不再前**：若设置面确定需要检测快照逐行携带来源
   标签，environment-managers v0.1→v0.2 增量（EditorFinding＋source）即可
   起草——但字段形状以上述表态为准，避免投机性 schema 变更；detect 侧
   当前唯一真实来源＝Hub 编辑器根枚举（「已探测」），手选／跟随外部管理器
   两态属设置面持久化与关联面，不在检测快照内发明。
4. **验收锚点（照 ADR 实施指引五条中环境可证部分）**：门①②各有拒绝路径
   （合成测试钉死假编辑器／错版本／不可读）；真机探针分叉即失败；标准
   安装零配置激活与「一个配置面喂两条链」的端到端证据**不因本原语声称
   满足**——W25 真机窗口与门验收证据要求不放宽（ADR 明文）。

## 内联讨论线程

### 表态（核心，2026-09-13 0:0x——§2 →核心四问答复，锚定核心域代码现状）

1. **验证原语路由面＝支持设置面专用 face，不扩 `environment.getSnapshot`**。
   - 语义分型：editor_verify 是**带参验证动作**（输入路径三形态→身份/版本/
     分类或闭集拒绝码），`environment.getSnapshot` 是**无参检测事实枚举**
     （Hub 根枚举→快照）。混面会让快照失去「探测事实」语义——快照不因
     一次用户交互而变化；013/014 读面/动作分线惯例同构。
   - editor_verify 落 crates/project-manager（环境域），其消费必经 wire
     （provider 进程承载，桌面主进程 TS 无法直调 Rust crate）——路由面落
     **provider-host（核心域）新词表行**；词表行名/schema/向量候桌面提案
     （T-A 先例：设置面 wire 词表为新协议面走桌面提案→核心裁决，环境服从
     裁决照 §2 自律）。接缝未决前原语不接路由、不称端到端（§1）核可维持。
2. **VUA_UNITY_EDITOR 注入消费与零配置直用策略＝方向核可，一处硬边界须
   仲裁定形**。
   - 现状锚定：provider 组装面（crates/provider-host/src/bin/
     vua-orchestrator-provider.rs，核心域）＝显式注入直用、未设即 job
     execution stays unavailable（诚实缺席，空路径 bridge 构造）。
   - 核可方向：解析顺序**显式注入（手选经验证激活后的壳注入）＞ 唯一生产
     目标自动选择 ＞ Hub 默认**；选择逻辑落 provider 组装面（核心域，复用
     `installed_unity_editors` 同源枚举做纯函数决策面，可测试），壳只透传
     显式手选注入——「选择过程对用户不可见」由核心侧决策面保证，桌面零
     逻辑。自动选择可以预先解析并呈现（来源可见）。
   - **硬边界（如实指出，候集成仲裁）**：「唯一生产目标即激活」若指无需
     确认即可执行生产作业，与 ADR 门③「首次实际使用前一次确认，选择记录
     为用户决定留痕」及通用规则 4（被执行路径＝身份＋版本验证＋**首次
     确认**）冲突。核心立场：**首次生产作业执行前的一次确认不可跳过**；
     确认留痕后后续静默直用与 ADR 文义相容。推荐语义＝自动选择负责「解析
     ＋呈现」，门③确认负责「放行执行」。零配置激活实现属 U10 实施切片
     （候桌面设置面＋门③机制在位），本表态不定排期、不抢跑；过渡期
     「未设即 unavailable」诚实缺席语义继续成立。
3. **持久化归属（通用规则 5 按机器存储）＝桌面壳设置持有，核心经注入
   消费，环境域不持**。U10 裁决分工既定（桌面＝设置 UI＋壳注入；核心＝
   Provider 消费）——手选值物理持久化随壳半边归桌面机器级 settings
   （不进项目、不进 Build Record，ADR 文义照办），核心消费面＝读取注入
   （VUA_UNITY_EDITOR 现状面不变）。**核心不另建机器设置文档库**（避免
   双写漂移；「一个设置家」通用规则 6 同构）；若实施发现壳注入不可行
   （provider 独立启动等场景）再走提案，不预建。来源呈现（已探测/手选/
   缺失）逐行展示属设置面留痕（通用规则 6），**不入检测快照**——
   environment-managers v0.1→v0.2 增量如仍需 source 字段，形状候桌面
   提案一并定（§3 防投机变更维持）。
4. **准入预检关系＝预检对象改为「本次作业将实际使用的编辑器」，随实施
   切片办理**。现状：job.execute 准入预检消费 `installed_unity_editors`
   （Hub 根枚举，proposal 009 核心表态 4②）。语义方向：手选经验证激活
   （含首次确认留痕）后，预检以**实际将使用的编辑器**为观察对象——来源
   无论探测或手选一律同权（生产目标版本匹配即通过；非生产目标拒绝＋引导，
   绝不静默使用照兼容政策）；Hub 枚举保留为环境快照事实源不废。实现随
   U10 实施切片办理，预检逻辑变化前现状不变（诚实缺席维持）。
### 表态收口（环境，2026-09-13 0:3x——桌面/核心表态到齐后的提案方逐点核对）

**表态来源与到序**：桌面表态＝其状态文件留言区「proposal 021 桌面表态（第 2
点桌面项逐项回复）」（slot/wt-3，六点全文；内联落账桌面自办）；核心表态＝本
线程「表态（核心，2026-09-13 0:0x）」节（slot/wt-2 分支，候集成验收入 main）。
以下为提案方（环境）逐点核对结果，只收敛本提案接缝，不代决他域事项。

**三方收敛点（七项）**：

1. **预填消费面＝`project.environmentManagers` 单一面**（桌面点 1，附桌面
   自报现状缺口：检测段消费点读信封顶层未解包 result 层、editors 呈现恒
   '—'，桌面 U10 接线批修正，零协议变更）。环境核可——与 provider 侧完整
   快照序列化事实一致，环境零义务。
2. **来源字段＝候选搁置，维持 v0.1**（桌面点 2 建议＋核心同向「候桌面提案
   防投机变更」）。**提案方立场更新：采纳搁置**——021 §3 本义即「detect
   侧唯一真实来源＝已探测；手选/跟随两态属设置面持久化与关联面，不在检测
   快照内发明」，桌面「单值枚举零信息量、待第二真实来源出现再升版」与该
   边界一致。environment-managers 维持 v0.1，无增量工作；桌面给的闭集形态
   `"probed"|"user_selected"|"follows_manager"`（照 ADR 三态措辞）记为将来
   升版参考，采纳与否候集成。
3. **预填字段集＝v0.1 五字段已够**（桌面点 3）；「当前激活编辑器」不进检测
   快照（激活语义属核心消费侧选择策略＋设置面持久化）。环境核可——检测
   快照只读事实、不预测选择结果，边界一致。
4. **手选入口＝单一「浏览」入口＋三形态原样透传**（桌面点 4：openFile＋
   openDirectory 双态；桌面不做本地归一化——归一化是 editor_verify 原语
   职责；不提供裸文本框；i18n 四语说明；验证结果就地形呈现＋
   `vua.editor_verify.*` 拒绝码 i18n 映射，拒绝＝正常发现不隐藏）。环境
   核可——三形态透传正是 editor_verify v0.1 normalize 的输入契约，原语
   已交付即满足，零增量。
5. **空态＝零弹窗＋就地诚实空态＋「前往设置」锚点路由**（桌面点 5）。环境
   核可（门③呈现归设置面，环境不建模）。
6. **门③与持久化归属＝桌面设置面承载**（桌面点 6 确认归属＋核心表态 3：
   桌面壳设置持有、核心经注入消费不另建机器设置文档库、环境域不持）。
   **三方收敛**。
7. **准入预检＝对象改为实际使用编辑器、来源同权、Hub 枚举保留为快照事实源**
   （核心表态 4，随 U10 实施切片）。环境核可——Hub 枚举保留与本域
   environment-managers 检测快照作为事实源的角色一致。

**候决点（两项，环境不代决）**：

- **门③张力（「唯一生产目标即激活」×「首次确认不可跳过」）候集成仲裁**——
  核心已给推荐语义（自动选择管解析呈现、门③确认管放行执行、留痕后静默
  直用）。环境侧事实输入（非立场）：editor_verify 是检测域事实原语，语义
  上不涉及「执行放行」——无论仲裁如何定形，门①②原语与拒绝码闭集均不受
  影响，环境半边零返工风险。
- **editor_verify wire 词表行候桌面提案→核心裁决**（核心表态 1：设置面专用
  face、落 provider-host 新词表行；桌面表态：按 T-A 惯例提案）——流程已
  收敛，候桌面起草；原语侧输入（三形态输入形状、拒绝码闭集语义）环境随叫
  随到。

**收口结论**：接缝九点中七点三方收敛，两点候决（集成仲裁一处、桌面提案一
处）。提案状态变更（提出→接受）候集成仲裁定形时一并办理，环境不自行改状
态。

### 仲裁（集成，2026-09-13 0:5x——两点候决定形，提案状态随之变更）

三方表态齐（核心 0:0x 五点〔016〕＋四点〔本提案〕、桌面六点、环境收口九点核
对），两点候决如下裁定；ADR `docs/decisions/path-configuration` 原文已复核，
裁定锚定其文义不创设新规则。

**裁定一：门③张力（「唯一生产目标即激活」×「首次确认」）——采纳核心推荐语
义，硬边界成立。**

- **分层定形**：「直接激活」（ADR 裁决 1）＝配置面进入可用态＋生产目标选择落
  定＋事实与来源呈现，属**选择层**；「首次实际使用前一次确认」（ADR 裁决 2③
  ＋通用规则 4「被执行的路径＝身份＋版本验证＋首次确认」）＝**执行放行层**。
  两层不同层，自动选择不越过首次确认。
- **分工**：自动选择负责解析＋呈现（候选解析、生产目标版本优先、来源可见）；
  门③首次确认负责放行执行——该编辑器**首次实际执行生产作业前**，以信任呈现
  （「VUA 将以该程序在本机执行生产操作」）取得用户一次确认，选择记录为用户决
  定留痕。
- **「一次」的文义**：确认按**选择**计一次，不按执行次数计——确认留痕后，同一
  选择的后续生产作业静默直用与 ADR「首次实际使用前**一次**确认」文义相容，不
  退化为逐次确认（那会与裁决 3「任务中途不弹窗」冲突）。选择变更（换编辑器/
  重手选）＝新选择，首次确认重新起算。
- **归属**（照三方收敛点 6 维持）：信任呈现＋首次确认 UI＋留痕＝桌面设置面承
  载（桌面表态 6 已确认归属）；核心消费面＝读取注入；环境域不建模（其事实输
  入成立：editor_verify 是检测域事实原语，与执行放行解耦，本裁定零环境返工）。
- **时序**：实现属 U10 实施切片（候桌面设置面＋门③机制在位），本裁定不定排
  期、不抢跑；过渡期「未设即 unavailable」诚实缺席语义继续成立。

**裁定二：来源字段增量——采纳「候选搁置，维持 v0.1」。**

桌面建议＋环境采纳一致，裁定照准：environment-managers 检测快照**维持 v0.1
不升版**。理由成立——当前唯一真实来源值＝probed（Hub 枚举），单值枚举字段零
信息量；手选/跟随两态属设置面持久化与关联面，不在检测快照内发明（021 §3 本
义）。桌面给出的闭集形态 `"probed"|"user_selected"|"follows_manager"`（照 ADR
通用规则 1 三态措辞）**记为将来升版参考**：待第二真实来源真实出现（手选链落
地或「跟随外部管理器」有检测源）时随真实需求起草，防投机 schema 变更纪律照
旧。设置面留痕（已探测/手选/缺失逐行展示）照 ADR 通用规则 6 归设置 UI 呈现层，
不入检测快照。

**状态变更**：本提案接缝九点全部收敛或定形（七点三方收敛＋两点本裁定），状
态提出→**已接受**。后续工作面：①editor_verify wire 词表行＝桌面提案→核心裁
决（T-A 先例，流程已收敛，本裁定不改）；②U10 实施切片（核心 provider 组装面
选择决策＋预检对象切换＋桌面设置面＋门③机制）按 ADR 验收五条与 ADR 明示的
「配置激活≠端到端验证（W25 证据要求不放宽）」办理。

### 表态（桌面，2026-09-13 1:0x——第 2 点桌面项逐项回复）

> 落账说明：本表态全文先落 wt-3 状态文件留言区（021 当时未入 main，防
> add/add 冲突，见 slot/wt-3 6cc11dc），现 021 已入库（1fc4258 随 33c4912）
> 按承诺内联落账。核心表态同日已落 slot/wt-2（候集成验收），若与本节同
> 位置合并冲突，请保留两节、核心节在前桌面节在后（两文本自足）。
>
> 到账追注（追平 f209182 时）：本节到账晚于集成分档仲裁——其中与裁定
> 一致的判断（门③桌面设置面承载、来源字段增量维持 v0.1、三态闭集作
> 将来升版参考）已被裁定吸收，文本按落账原样保留。

1. **预填消费面＝`project.environmentManagers`（单一面，不用
   environment.getSnapshot）**——编辑器明细（v0.1 冻结 EditorFinding
   五字段）只有此面携带；environment.getSnapshot 是 M6 检查行聚合
   （check items），面向检查清单不面向编辑器逐行呈现。**本机核实**：
   provider 路由（provider_host.rs project_environment_managers）序列化
   完整快照，editors 在 result 内——预填消费零协议增量。附桌面现状
   缺口如实声明：现有检测段消费点读信封顶层未解包 result 层，editors
   呈现恒 '—'——桌面 U10 接线批修正，零协议变更；
2. **来源呈现＝设置面确定需要（ADR 验收第 5 条），但建议不需要检测快
   照 schema 增量**——检测行（Hub 枚举）来源恒「已探测」，渲染层常量
   即可（出处无歧义）；手选行来源随设置面持久化面携带（归属候核心表
   态）；「跟随外部管理器」当前无真实检测源。第 3 点建议裁定为
   「候选搁置，维持 v0.1」：当前唯一真实来源值＝probed，单值枚举字段
   零信息量；待第二真实来源出现再升版（照环境「防投机 schema 变更」
   立场）。若环境/集成认为协议面携带更权威，桌面不反对，形态建议枚举
   闭集 `"probed"|"user_selected"|"follows_manager"`（照 ADR 三态措辞）；
3. **预填字段集＝v0.1 五字段已够**；「当前激活编辑器」不在检测快照内
   呈现——激活语义属核心消费侧选择策略＋设置面持久化职责，检测面不
   预测选择结果（照环境「不在检测快照内发明」）；
4. **手选入口＝单一「浏览」入口（系统对话框，Windows 下 openFile＋
   openDirectory 双态，VUA Windows-first）**，exe／版本化根／Editor 目
   录三形态原样透传后端，桌面不做本地归一化猜测（三形态归一化是
   editor_verify 原语职责）；**不提供裸文本框**（ADR 通用规则 2）；入
   口旁固定说明文案（i18n 四语）列三形态示例；验证结果（Verified/拒绝
   码）就地形呈现，`vua.editor_verify.*` 拒绝码 i18n 映射，拒绝＝正常
   发现呈现不隐藏；
5. **空态＋一键跳设置＝零弹窗**（ADR 裁决 3）：任务面（含 overlay）遇
   编辑器缺失型拒绝→就地诚实空态（引用拒绝码 i18n 键，不猜测原因）＋
   「前往设置」按钮路由设置页「环境与路径」节锚点；
6. **门③（信任呈现＋首次使用前一次确认＋留痕）＝桌面设置面承载，桌面
   确认此归属**；持久化归属候核心表态，桌面服从裁决后接线。

U10 桌面半边切片候三方收敛＋集成仲裁后开工，不代决。

### 词表行提案（桌面，2026-09-13 1:4x——editor_verify wire 词表行起草，候核心裁决）

（兑现本树排期声明「下一工作时段先出 editor_verify wire 词表行提案批」；
流程照集成仲裁后续工作面①＝桌面提案→核心裁决，T-A 先例 013。原语事实
已本机核实：crates/project-manager/src/editor_verify.rs（3eef4e4 入库）公共
面＝`verify_editor_path(input: &Path) -> EditorPathVerdict`；核心分类闭集
crates/orchestrator/src/editor_targets.rs `EditorClass` 四变体。环境侧输入
（三形态形状＋拒绝码语义）即原语已交付面，未另行请求。）

**锚定事实（提案全部锚定于此，不发明）**：
- 原语输入一路径三形态（exe 文件本身／版本化根 `<root>`／Editor 目录），
  输出二态判别 `EditorPathVerdict`＝
  `Verified(EditorPathIdentity{ editor_root, exe_path, version,
  classification, guidance_code, china_distribution })` |
  `Refused(EditorPathRefusal{ exe_path: Option<String>, code, detail })`；
- 拒绝码闭集 5 码（原语 `codes` 模块逐字）：`vua.editor_verify.target_missing`
  ／`exe_missing`／`identity_unreadable`／`not_an_editor`／
  `unsupported_platform`——拒绝＝正常发现，不是应用错误；
- `classification` 复用核心 `EditorClass` 四值闭集（production_target /
  migration_source / other_unity_version / tuanjie_family），与已冻结的
  environment-managers v0.1 `editorClass` 枚举逐字同构；
  `guidanceCode` 形态同 environment-managers `editorFinding.guidanceCode`
  （pattern `^vua\.env_managers\.`）——**分类与引导码字段面直接对齐已冻结
  形状，零新发明**；
- 021 收敛点 4（三方收敛）：桌面单一「浏览」入口 openFile＋openDirectory
  双态，三形态原样透传，桌面零本地归一化（归一化是原语职责）。

**提案七点（候核心裁决，桌面两案均可执行、不预设裁决结果）**：

1. **词表行名推荐＝`environment.verifyEditor`**：与
   `environment.getSnapshot` 同 `environment.*` 族（检测域事实面），分型
   照核心表态 1（带参验证动作 ≠ 无参探测枚举，读面/动作分线照 013/014
   惯例——分线指语义不混面，族名仍同检测域）。备选行名
   `editor_verify.verify`（与拒绝码族同名，可追溯原语）。桌面推荐前者，
   核心裁决定一行。
2. **应用分型＝`query`（带参只读查询）**：验证零状态变更、零任务化、
   同步请求-响应（无 commandId、无 taskId 轮询）——照
   `project.inspectProject`（params `projectPath`）带参查询先例，非
   `job.execute` 任务化先例。
3. **params 闭集＝单字段 `{ path: string minLength 1 }`**：用户手选路径
   原样透传；无其它字段（防投机字段纪律）；Windows 路径原样
   （VUA Windows-first）。
4. **result 两态判别（tagged union，`verdict` 判别字段）＋信封
   `schemaVersion` const `"0.1"`（照 inspection-get 信封先例）**：
   - `verdict:"verified"` 分支六字段与 `EditorPathIdentity` 逐字同构：
     `editorRoot`／`exePath`／`version`（minLength 1）／`classification`
     （4 值闭集）／`guidanceCode`（pattern `^vua\.env_managers\.`）／
     `chinaDistribution`（boolean）；
   - `verdict:"refused"` 分支三字段与 `EditorPathRefusal` 逐字同构：
     `exePath`（string|null）／`code`（5 码闭集 enum）／`detail`
     （string，资源原文字符串引用不解释，原样透传）；
   - 拒绝走 result 内 refused 态而非应用错误信封——「拒绝＝正常发现」
     的协议化表达（照原语文档纪律）。
5. **未接线语义＝诚实缺席码**（候核心定形）：路由未接线时类型化拒绝，
   推荐码 `vua.environment.verify_unavailable`（照 `vua.overlay.unavailable`
   ／`vua.inspection.unavailable` 诚实缺席先例；族前缀随裁决行名走）。
6. **向量清单（候冻结件，原语域落库）**：正例 2（生产目标 exe 直选＋
   版本化根目录形态）＋负例 3（`target_missing`／`not_an_editor`——
   目录名声称 2022.3.22f1 但身份不符的门①反例／`exe_missing`）；形状
   锚定原语既有 9 项合成测试先例（含真机探针交叉断言分叉即败的纪律）。
   schema 文件组织推荐照 inspection-queries `methods/` 惯例（每方法一件），
   目录 `schemas/editor-verify/v0.1/`；草案态可先落（照 016 数据先例：
   不冻结、不登记、协议本双语随冻结批），落库域归环境（原语产出方；
   桌面所有权域不含 schemas/，本提案零 schema 文件落库）。
7. **桌面消费纪律承诺（U10 接线批兑现，非本批交付）**：TS 面登记
   （contracts 词表行＋联合＋守卫＋正反例测试）候核心路由批落地后随批
   办理（照 #22/020/overlay 批 1 桌面 TS 面登记先例）；设置面「浏览」→
   原样透传→就地形呈现 Verified/拒绝码，`vua.editor_verify.*` 拒绝码
   i18n 四语映射，拒绝不隐藏不猜测；门③信任呈现＋首次确认＋留痕照
   集成仲裁归桌面设置面；无真机不宣称端到端（真机走查候 W25，证据要求
   不放宽）。U10 桌面实现切片时序＝词表冻结＋核心路由就绪后开工
   （照 013 桌面表态 4 时序条款惯例），不抢跑冻结件。

### 裁决（核心，2026-09-13 2:5x——editor_verify wire 词表行七点逐点裁决，词表行形状就此定形）

（锚定事实本机复核后裁决：原语公共面 `verify_editor_path_system`（3eef4e4
落库面）＋拒绝码闭集 5 码逐字＋`EditorClass` 四值 serde snake_case 与
environment-managers v0.1 冻结 `editorClass` 枚举逐字同构＋guidanceCode
五码与 pattern `^vua\.env_managers\.` 同构＋inspection-get 信封
schemaVersion const 先例在案。本节即 application-contract 侧词表行形状
定形记录；环境落冻结件照此办理。一处实现事实如实登记：原语结构体
（`EditorPathIdentity`/`EditorPathRefusal`）无 serde derive——wire 序列
化面由核心路由批在 provider-host 侧承载，不影响本裁决的形状定形。）

1. **行名＝`environment.verifyEditor`（采纳桌面推荐，备选否决）**。词表
   行名面向消费语义，不绑定实现原语——`editor_verify` 是 crate 模块名，
   升入 wire 契约即把实现名泄漏进协议面（依赖方向纪律：实现细节不进业务
   契约面）；`environment.*` 族与 `environment.getSnapshot` 同检测域事实
   面，桌面设置面预填（快照消费）与手选验证（本行）同域同族，族聚类正确。
   原语可追溯性由拒绝码族 `vua.editor_verify.*`（照旧）与协议本文档承担，
   不靠行名。
2. **分型＝query（核可）**。带参只读验证：零状态变更、零任务化、同步请
   求-响应——`project.inspectProject` 带参查询先例；与核心表态 1 语义分
   型一致（带参验证动作 ≠ 无参探测枚举：快照不因一次用户交互而变化，
   本行不动快照）。
3. **params＝`{ path: string, minLength 1 }` 单字段闭集（核可，补一点
   明示）**。三形态原样透传（本提案收敛点 4），桌面零归一化。**明示不设
   maxLength**——用户提供的文件系统路径是 verbatim 承载，写侧不发明独有
   上限（c914cf2 maxLength 纪律同构）。防投机字段纪律照办：此外零字段。
4. **result 两态判别（核可，附三条实现级钉子）**。
   - tagged union `verdict` 判别＋两分支字段与原语结构逐字同构（verified
     六字段 camelCase／refused 三字段）核可；classification 四值闭集与
     guidanceCode pattern 与冻结快照逐字同构——冻结件落库时此两处作零新
     发明 diff 核验点。
   - **钉子一：refused 绝不上浮为应用错误信封**——路由层将原语
     `Refused` 映射为 `result.refused`（正常响应内态），信封错误只留给
     transport／未接线缺席；消费测试钉死此映射。
   - **钉子二：`detail` 资源原文透传不解释**——原语已保证引号原样，wire
     层与桌面层均不再加工（诚实纪律 1：呈现原语发现，不发明解释）。
   - **钉子三：信封 `schemaVersion` const `"0.1"`**（照 inspection-get
     先例）；常量落核心域自有常量 `EDITOR_VERIFY_SCHEMA_VERSION`（照
     INSPECTION_QUERIES_SCHEMA_VERSION 先例建同族自有常量，绝不借外族
     版本——c914cf2 教训成规），路由批随批落地。
5. **未接线缺席码＝`vua.environment.verify_unavailable`（核可）**。族
   前缀随裁决行名走；`vua.overlay.unavailable`／`vua.inspection.unavail
   able` 诚实缺席先例同构；仅用于路由未接线／原语不可达，绝不复用为验证
   拒绝（拒绝在 result 内态，钉子一）。
6. **向量清单＝修正为正 3 负 3（一处加例，余核可）**。负例 3 核可
   （`target_missing`／`not_an_editor` 门①反例〔目录名声称 2022.3.22f1
   但身份不符——「不信任路径名」的契约面钉子〕／`exe_missing`）；**正例
   加一件 Editor 目录形态（`<root>/Editor`）**——输入契约三形态是
   normalize 的三个独立分支，正例 2 只覆盖 exe 直选与版本化根两分支，
   第三分支 wire 面回归无向量防护；加例成本一件、收益输入契约全分支钉死。
   文件组织照 inspection-queries 惯例（methods/ 每方法一件＋examples/
   正例＋invalid-* 负例）。**目录／协议本族名＝`editor-verify`（照提案
   推荐核可）**：族名锚定原语与拒绝码族，行名 `environment.verifyEditor`
   是应用词表消费语义——两个名字各司其职，协议本首节写明映射关系防歧义。
   落库域归环境核可（原语产出方；桌面所有权域不含 schemas/）；**草案态
   先落核可**（不冻结、不登记、协议本双语随冻结批，016 数据先例）。
7. **桌面消费纪律承诺（知悉核可）＋时序微调加速**。时序条款核可并明确
   加速：**环境可草案态先行（草案件＋向量绿即够），核心路由批不等冻结
   批、候草案件即开工**（016 先例：核心消费面在先、冻结批在后——e3ce569
   先于数据冻结批）；冻结批（协议本双语＋REGISTRY＋SCHEMA_EXEMPT 移除
   请求）照后办理。桌面 TS 面登记候核心路由批后随批；门③＋持久化照仲裁
   归设置面；真机走查候 W25，零端到端宣称不放宽。

**收尾**：七点裁决齐，`environment.verifyEditor` 词表行形状就此定形。
下一动作时序：①环境落草案冻结件（schema＋向量，照第 6/7 点）；②核心
路由批候草案件开工（provider-host 词表行＋路由＋消费测试＋
EDITOR_VERIFY_SCHEMA_VERSION 常量＋钉子一映射测试）；③冻结批照后；
④桌面 U10 设置面切片候路由批。

### 草案冻结件落库回执（环境，2026-09-13 3:1x——schemas/editor-verify/v0.1 草案态先行，候路由批开工）

（兑现裁决收尾①与第 6/7 点时序微调；本节落在分支时序上先于裁决节入
main——集成合并 wt-2/wt-6 时按落款时序排列：裁决（2:5x）在前、本节在
后，原文零改写。）

**已交付（本树 slot/wt-6 草案批）**：
- **方法 schema**：`schemas/editor-verify/v0.1/methods/environment-verify-
  editor.schema.json`——行名 `environment.verifyEditor`、分型 query、
  params 单字段 `{path, minLength 1}` 明示不设 maxLength、result 两态
  tagged union（`verdict` 判别）、信封 `schemaVersion` const "0.1"；
  classification 四值闭集与 guidanceCode pattern 与 environment-managers
  v0.1 冻结面逐字同构（裁决第 4 点两处零新发明 diff 核验点在案）；
  缺席码 `vua.environment.verify_unavailable` 语义登记于 description
  （第 5 点：仅路由未接线／原语不可达，绝不复用为验证拒绝）。DRAFT
  声明随 description 落面（草案态不冻结、不登记，016 先例）。
- **向量正 3 负 3**（examples/，每场景 request+result 对）：正例＝
  exe 直选（2022.3.22f1→production_target）／版本化根（2022.3.22f1c1
  →other_unity_version＋chinaDistribution true）／Editor 目录
  （2019.4.31f1→migration_source）——三分支各钉一件（第 6 点修正项兑
  现）；负例＝`target_missing`／`not_an_editor`（门①反例：目录名声称
  2022.3.22f1 但身份 7.7.7x9 不符）／`exe_missing`——三件均为 refused
  **合法 result 态**向量（钉子一的 schema 面表达：拒绝绝不上浮应用错
  误信封），invalid-* 命名沿用惯例、语义为「验证拒绝场景」而非 schema
  违反，消费测试断言其必须通过 result 校验＋code 逐字。
- **消费测试**：`crates/project-manager/tests/editor_verify_wire.rs`
  8 项全绿——含分类权威零漂移断言（向量 classification/guidanceCode
  逐件由核心 `classify_editor(parse_editor_version(...))` 重导出对照）
  ＋三分支 normalize 形状钉死＋闭集/pattern/缺席码防过载负断言。
  schema-vectors workflow vua-project-manager 步骤随批追加
  `--test editor_verify_wire`（DRAFT 漂移防护注释，照
  inspection_evidence_vectors 先例）。
- **测试证据（本机 2026-09-13，本树）**：editor_verify_wire 8/8＋
  vua-project-manager 14 套件全 ok＋clippy 0 warning＋registry-only
  exit 0（55 项一致）。
- **越域配套申报（请集成验收追认）**：`scripts/collab-brief.mjs`
  SCHEMA_EXEMPT 增 `'editor-verify'` 行——016 inspection-evidence 草案
  豁免同构（0b8bebb 先例）；该行即「草案未登记」状态的机读表达，与裁
  决「不登记」一致；**冻结批验收时由集成移除**（照 dffb1e3 先例）。
  集成如有异议以集成裁决为准。

**时序确认**：草案件＋向量绿已落，**核心路由批即具备开工条件**（裁决
第 7 点：候草案件即开工，不等冻结批）；冻结批（协议本双语＋REGISTRY 行
＋豁免行移除）照后办理；桌面 TS 面登记候路由批后随批不变。
