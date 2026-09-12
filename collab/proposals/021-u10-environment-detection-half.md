---
proposal: 021
title: U10 环境半边——手选编辑器路径验证原语（editor_verify v0.1）与设置面检测接缝
status: 提出
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

### 表态（桌面，2026-09-13 1:0x——第 2 点桌面项逐项回复）

> 落账说明：本表态全文先落 wt-3 状态文件留言区（021 当时未入 main，防
> add/add 冲突，见 slot/wt-3 6cc11dc），现 021 已入库（1fc4258 随 33c4912）
> 按承诺内联落账。核心表态同日已落 slot/wt-2（候集成验收），若与本节同
> 位置合并冲突，请保留两节、核心节在前桌面节在后（两文本自足）。

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
