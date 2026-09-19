# packages-ops 协议 v0.5（packages P3 写面，第五冻结切片 A5＝项目创建：packages.createProject）

[English](packages-ops-v0.5_EN.md) | [简体中文](packages-ops-v0.5_ZH.md)

> 文档版本：0.5.1
> 状态：**已冻结（packages-ops 词表行 v0.5，A5 项目创建词面；v0.1 A1
> 移除行、v0.2 A2 安装/升级行、v0.3 A3 注册行与 v0.4 A4 仓库增删行
> 保持冻结原样服务——v0.5 照 packages-catalog v0.2 增量先例为独立行
> 目录；词面已接线：wire 路由与 served 行已在库——桌面消费候逐面
> 升级，落地前本方法无桌面入口）**
> （2026-09-19，proposal 026 面序 A1→A2→A3→A4→A5；A5 启动裁定＝核心
> 2026-09-19 01:3x〔启动成立／时机殿后／词面方向六点／载体声明，
> 落 wt-2 状态文件 8afde3f 世代〕；桌面入口需求五点＝026 内联桌面表
> 态节 a4c74a7）
> 机器可读词表：`schemas/packages-ops/v0.5/`（行级双 Schema＋3 正 /
> 10 负向量；核心消费测试
> `crates/provider-host/tests/packages_ops_consumer_v05.rs`；wire 路
> 由测试
> `crates/provider-host/tests/packages_ops_wire_v05.rs`；TS 守卫
> 测试 `packages/contracts/src/application-contract.test.ts`）
> 范围：`packages.createProject`（新项目创建的九态任务化写命令）
> 所有权边界：词表冻结＋端口面文档注释（本批零新端口码、零新能力
> accessor——create 能力位＝既有五位居 `VpmCapabilities.create_
> project`，位先于本批存在且双在库后端已诚实声明）＝核心域；wire
> 路由（`packages.createOps` served 行、路由臂、信封组装）＝核心域，
> **已随本 v0.5.1 接线批落地**；双实现（库路径 `create_from_template`／
> CLI 路径 `vpm new`）已在库＝环境域（实现核对切片照 024/025 程序）；
> 桌面消费＝桌面域（逐面升级，create 能力呈现须新立、不可复用
> `blocks`——语义＝变更预览可用性，与「可新建项目」不同构）
> 更新：2026-09-19（v0.5.1 接线批：路由臂 `packages.createProject`＋
> served 行 `packages.createOps`〔门控读既有
> `capabilities().create_project` 位〕＋信封组装＋闭集投影＋wire 测
> 试＋本文载明 wire 信封常量——词面零变更）；2026-09-19（v0.5 冻结
> 批：双 Schema＋向量＋核心消费测试＋TS 面＋mock 恒缺席臂＋双语协
> 议本＋REGISTRY）

## A5 词面语义（创建面刻意不是 preview/apply 对偶——无对偶第二员）

- **单方法、无 preview 臂——端口事实如实立面。** 端口恰为
  `create_project(&self, parent: &Path, name: &str, template:
  Option<&str>) -> Result<ProjectRef, AppErrorV1>`，无 create-preview
  对应方法，也不发明：预览臂会在 wire 面立端口后不存在的方法。全新
  项目目录无既有状态可 diff——无变更集可预览、无摘要可绑定（026 A5
  核心表态与桌面入口需求表态同向），ORC-WF-003/004 在此无购买。
- **用户显式表单提交即确认**（桌面 A5 第 2 点：表单提交本身即显式
  确认，不进双摘要确认链）。携 `confirmedDigest` 的请求＝形状违反
  （负例钉死）。创建新目录不触任何在册项目、任何包文件、任何其他
  项目的内容——ADR-0006 破坏性警示路径无可警示，本面不发明破坏性
  事实。
- **不收 `projectPath`。** 创建不寻址任何在册项目（013
  `project_not_found` 复用不适用）；`parent` 是路径事实、非项目身份
  （携 `projectPath`＝形状违反，负例钉死）。
- **九态任务化写命令（写命令族一致形状）。** applyRemove、
  applyInstall、registerLocalPackage 与 A4 三方法均骑任务面；A5 同
  构：`commandId` 幂等、可取消、事件＋修订。模板目录复制可长时且
  `copy_tree` 段无进度回调——可观察性骑任务状态面（九态）、可恢复
  性骑恢复纪律：恢复将非终态残留映射为 `inspect_required`、绝不隐
  式续传（诚实纪律 3）。
- **模板参数 REQUIRED-nullable（照 A2 版本选择同构）。** `null`＝
  后端默认模板解析——端口 `Option None` 事实：库路径默认 Avatar 模
  板、按 `VRCTemplates/<t>` → `Templates/<t>` → 显式路径序解析（冻
  结词面事实，非选择器）；非空串＝该模板名/路径 verbatim 透传。
  **首面零新读面**：`templates.*` 枚举族不入 A5（后续需要另走立面
  程序）；桌面如实呈现所用模板、不虚构下拉选择器（诚实纪律 1）。
- **创建即在册（冻结端口事实，如实载明）。** 双后端成功路径尾调
  `FileSystemProjectStore::initialize`：创建成功即登记 VUA 在册项目
  存储——**创建成功＝在册成功**，在册项目列表刷新即见。词面绝不虚
  构「仅建目录不登记」形状。目标路径已存在时后端守卫在执行时拒绝
  （库路径 `projectExists` 键），不宣称幂等。

## 方法面

- **packages.createProject**：`{parent, name, template}`——三键闭集。
  `parent` 为新项目目录的父目录（端口 `parent` verbatim camelCase；
  路径事实，非在册项目身份）。`name` 为新项目名（端口 `name`
  verbatim；后端名称校验为执行时权威——空白/首尾空白/`./..`/`-` 前
  缀/九文件系统禁止字符在库路径拒绝；wire 面不重审上游名称语法，
  表单前置校验镜像后端规则仅作 UI 引导、权威以冻结词面为准）。
  `template` 见上（REQUIRED-nullable）。
- **结果（Done payload），kind=created（创建臂）**：
  `{schemaVersion: "vua.packages-ops/v0.5", kind: "created",
  projectId, projectPath}`。**packages-ops 族唯一有实际结果载荷的收
  据**（不同于答 unit 的 A3/A4 面）：端口答 `Result<ProjectRef, _>`，
  收据即该投影——`projectId`＝端口 `ProjectRef.id` 回显（后端铸造的
  创建事实，信息性标识；**非 013 项目身份键**，项目身份仍是路径）；
  `projectPath`＝端口 `ProjectRef.root` 回显（新项目根目录＝注册路
  径身份；创建即在册副作用见上——回执与「在册列表刷新即见」对齐）。
  `additionalProperties:false` 禁止发明创建时间戳/复制统计/包清单。
  created 键集与一切前代收据臂（removeReceipt/installReceipt/
  registerReceipt/repoReceipt/removed）互斥。
- **结果，kind=rejected**：guard 闭集维持 A1/A2 三值——A5 零新增
  guard。一切端口拒绝折 `execution_failed` 携原码 detail 如实溯源。
  **A5 端口码闭集＝三个既有码，零新立**（端口方法与双实现均先于本
  批在库——冻结传输其诚实面，不铸造新码）：
  - `vua.vpm.template_missing`——库路径全部四个 i18n 消息键的共享
    载体：`errors.vpm.projectExists`（目标已存在，Validation）/
    `errors.vpm.projectNameInvalid`（名称非法，Validation）/
    `errors.vpm.templateMissing`（模板缺失，Dependency）/
    `errors.vpm.templateCopyFailed`（复制失败/非 Unity 工程/登记失
    败，ExternalFailure）。**i18n 消息键与端口错误码系两层**，本面
    如实同时载明：桌面四语文案随消费切片按消息键补齐（四键桌面四
    语表现零在册——桌面 A5 第 5 点①）。
  - `vua.vpm.apply_failed`——CLI 路径：`vpm new` 超时或非零退出（携
    `exitCode`）与登记腿。
  - `vua.vpm.backend_unavailable`——CLI 路径 runner 故障（库路径不
    会答此码）。
  复用 `vua.vpm.*` 码永不入 `code` 键（013 复用码法；pattern 锁
  `^vua\.packages\.`，负例钉死）。
- **双后端拒绝形状不同构（如实声明，不虚构统一形状）。** 库路径四
  键语义在端口码面共享一码、按类别分档（Validation/Dependency/
  ExternalFailure）；CLI 路径错误形状为 apply_failed＋exitCode／
  backend_unavailable 两码。桌面消费按 detail 原码呈现、不合并词。
- **信封错误面（零新码）**：create 能力位假的后端答通用
  `vua.vpm.capability_missing`（wire 门 submit 前读既有
  `VpmCapabilities.create_project` 位作答——能力缺席绝不进任务；A5
  零新 accessor，与 A3/A4 不同：位先于本批存在且双在库后端已诚实
  声明）；参数违反答 `vua.packages.invalid_params`；未接线引擎答诚
  实缺席臂 `vua.packages.unavailable`。
- **服务门（已接线落地）**：served 行 `packages.createOps` 一行服
  务一方法（registerOps/removeOps/repoOps 一行先例）；行可用性＝后
  端 `capabilities().create_project` 位（既有五位居——本面无新
  accessor 可读，与 A4 行不同、不存在候环境覆写的 declared-none 缺
  省态：位真的已接线后端自本接线批起答 available）；wire 路由
  submit 前读同一位，假位答通用 `capability_missing` 且绝不进任务。
  端口方法系必需方法无缺省体，门即缺席臂——类型层面不存在「声明但
  未实现」的后端。信封常量已随本 0.5.1 接线批载明（A3/A4 先例闭
  合）。

## 明确在本词面之外

- **模板枚举读面（templates.* 族）**：首面零新读面——端口无模板枚
  举方法，本面不立选择器词面；后续需要另走立面程序。
- **项目身份键（projectId 作参数）**：013 裁决「本词表族无独立项目
  id」不因 A5 改变——created 收据的 `projectId` 是端口铸造事实的回
  显，非身份参数；项目身份仍是路径。
- **父目录浏览/文件系统读面**：`parent` 的选取 UI 属桌面消费切片
  （design-standard §8.7 增补随切片），词面不立文件系统读面。

## 信封、版本与依赖方向

wire 信封是常设形状（`schemaVersion` 信封常量 `"0.5"`＋
`operation`＋`result`）；结果文档自带族常量
（`vua.packages-ops/v0.5`）——两个版本相互独立（c914cf2 常设规则：
每条 wire 行自带版本常量）。本方法全部 wire 结局在任务受理应答与
Done payload 双处盖信封常量 `"0.5"`，收据盖族常量
`vua.packages-ops/v0.5`——常量已随本 v0.5.1 接线批载明并钉死（A3/
A4 先例：冻结批文档登记行，接线批以 0.5.x 修订载明常量——消费者对
齐落地面、绝不猜测）。v0.1 移除方法继续在 v0.1 词面应答、
v0.2 安装方法在 v0.2 词面应答、v0.3 注册在 v0.3 词面应答、v0.4 订
阅三方法在 v0.4 词面应答；v0.5 请求仅为 A5 方法（各代 plan/receipt
形状共享同一键集——消费者按 `schemaVersion` 字面量窄化，不按键
集）。依赖方向不变：renderer → 类型化 Gateway → Electron main
（verbatim 透传）→ 版本化应用契约 → provider wire 面 →
`VpmBackend` 端口 → project-manager 适配器。框架与厂商类型留在适
配器；词表运输事实。

## 诚实边界

- **词面已接线、未消费。** wire 路由（`packages.createOps` served
  行与路由臂）与信封组装已随本 v0.5.1 接线批落地——本方法自本批起
  在 wire 面存在。桌面尚无任何创建入口（消费候形状核可后逐面升级）；
  双实现在库（库路径/CLI 路径），环境实现核对切片照 024/025 程序随
  后办理。wire 测试骑真帧环与假后端已随接线批落地
  （`packages_ops_wire_v05.rs`）；端到端走查归 W25（候用户开窗
  O-2）。本文档不宣称任何真机行为。
