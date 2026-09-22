# AMF 与 Unity Bridge 架构

[English](amf-unity_EN.md) | [简体中文](amf-unity_ZH.md)

> 文档版本：1.2.0
> 状态：已接受
> 权威语言：简体中文（EN 为镜像，同步至 1.2.0）
> 范围：AMF 应用服务、Recipe、Build Record、`unity/`
> 更新：2026-09-22
> 最近符合性复核：2026-09-06
> 规范效力：有

## AMF 生产模型

AMF 以 Recipe 为可叠加修改的来源：Recipe 是可叠加的一组修改，表达素材组合与明确、受支持的
选项（叠加语义与冲突处理见[产品边界](../product-boundary_ZH.md)「制作范围与产品裁决」）。用户先
选择合法取得的素材和目标组合，再由系统决定项目、依赖和执行步骤。

```text
Warehouse → Recipe → Assembly → Release
```

- Warehouse 通过原生浏览器、内容管理器和可选外部适配器发现、下载、预览、识别和整理素材；
- Recipe 表达项目无关的素材身份、参数和目标；素材文件保留在用户本地 Warehouse；
- Assembly 解析当前机器和素材，生成 ProjectSpec、依赖与可审查计划，并通过 Orchestrator 执行
  项目创建、导入和 Unity Bridge 操作；执行中的询问、进度和恢复统一表示为任务状态；
- 检查能力归入制作记录与通知中心，不再要求独立 Inspection 页面：用户确认制作、车间开始投料时
  Release 建立该次运行的占位记录；制作问题同时通过通知中心和记录状态提示，两处都能打开对应
  的说明、日志及后续操作；运行中的占位记录不能冒充已完成的 Build Record（用户裁决，
  2026-09-22）；
- Release 管理 Build Record、快照、恢复和官方 SDK 上传交接。

Recipe 是可移植的声明式意图。导入 Recipe 后针对当前客户端重新解析素材、版本和能力，再生成
执行计划。应用语义为叠加：新 Recipe 叠加到当前 Avatar，未提及的已有素材和设置默认保留，删除
必须是明确操作，冲突按产品边界规定的四个选项处理；Recipe 不承担任意 Unity 工程、场景或全部
手工创作的完整复现。

## Warehouse、素材获取与 BDL

AMF 拥有素材浏览、授权下载、内容管理及其外部适配器。职责分为：

- **Electron 桌面适配器**：创建和隔离远程网页、Session 与下载传输，执行权限、导航、来源、目标
  路径和文件类型限制，并把规范化事件返回 AMF；Cookie、令牌和 Electron 私有对象保留在桌面
  适配器内部；
- **AMF 素材获取模块**：拥有浏览与下载用例、用户意图、来源关联、持久任务、重试/恢复策略和
  文件检查；桌面端口提供其完整的 Electron 访问面；
- **Warehouse**：组织用户可见的素材、来源、预览、导入状态和人工修订；
- **BDL**：保存 AMF 所需的商品、子商品、文件、协议、别名、兼容关系、来源和搜索元数据。

BDL 是 AMF 私有数据模块。VUA 的其他模块、插件和界面统一调用 AMF 用例取得 BDL 支持的信息，
由 AMF 完成权限、语义和结果裁剪。

## 项目与包管理兼容性

AMF 通过项目管理端口使用三条明确路径：

1. **VUA 包管理器**：基于 `vrc-get` 自建，负责 VUA 原生的项目创建、包解析与包操作。
2. **ALCOM 项目兼容**：通过公开项目边界识别 ALCOM 管理的项目，原项目只读；写操作仅作用于
   用户显式选择的「导入为 VUA 管理的副本」（用户裁决 U3，2026-09-08）。
3. **VCC 项目兼容**：通过公开项目格式识别 VCC 管理的项目，原项目只读；写操作仅作用于
   用户显式选择的「导入为 VUA 管理的副本」（用户裁决 U3，2026-09-08）。

三条路径共享项目能力模型并报告实际差异。项目格式、锁定状态或上游能力不足时，AMF 进入只读
检查、转换建议或人工交接。

## Build Record

每次生产保存不可变 Build Record，至少关联：

- Recipe 版本与内容指纹；
- 已解析的本地素材和来源记录；
- Unity、VPM 包与工具版本；
- ProjectSpec、批准计划和项目初始/最终指纹；
- Unity Bridge 请求、结果、警告和检测摘要；
- 快照与恢复点。

Build Record 仅保存复现所需元数据；Session 密钥、上传身份和受再分发限制的素材内容保留在各自
安全边界内。

## Unity Editor 兼容性

生产路径精确使用全球版 Unity `2022.3.22f1`。声明为 `2019.4.31f1` 或 `2022.3.6f1` 的项目先进入
备份与迁移路径，再执行 Bridge 作业。其他 Unity 版本统一报告与生产目标的精确差异并提供安装
引导，VUA 保持 `ProjectSettings/ProjectVersion.txt` 原状。团结引擎当前暂不支持。完整矩阵和版本
晋升规则由 [Unity Editor 兼容政策](../compatibility/unity-editor_ZH.md)拥有。

## Unity Bridge 边界

Unity Bridge 是 Unity `2022.3.22f1` Editor Package，通过版本化作业协议：

- 检查项目、Avatar 和已导入素材；
- 使用 GUID 与 `GlobalObjectId` 等引用；对象定位（同名骨骼、跨工程定位、重复应用）尚未经
  实机验证，当前方案不能默认视为可靠（未决，见[产品边界](../product-boundary_ZH.md)
  「制作范围与产品裁决」的待验证清单）；
- 校验操作并在支持时提供 dry-run；
- 执行骨骼、菜单、参数、动画、材质和 Modular Avatar 组件操作；
- 使用公开 Modular Avatar/NDMF/VRCSDK API；
- 返回结构化变更、诊断、项目指纹和可重试信息。

用户旅程、Recipe、下载、凭据、批准流程和项目历史由 AMF 与 Orchestrator 管理。最终登录与上传
保留在 VRChat 官方 SDK Panel。

## MA 与 SDK 职责边界（用户裁决，2026-09-22）

- 接受 Modular Avatar 已声明的能力边界，不再由 VUA 穷举测试 MA 的全部能力；
- VUA 验证自身接入、参数、对象选择、调用顺序和代表性实际流程；标准上游使用也能复现的
  问题再向上游反馈；
- 构建和目标平台技术限制优先复用官方 SDK 检查，不维护重复规则；
- 素材缺失、依赖安装、Bridge 执行与恢复仍是 VUA 的责任；
- 未执行的检查不能显示为通过；
- 最终上传由用户在官方 SDK 中完成；技术检查不能保证外观与行为符合玩家预期，需要明确
  说明。

## 交接进程面（Release Handoff）

官方 SDK 上传交接（`release.openForHandoff`，release-handoff 协议 v0.1）的执行域是
**编辑器进程生命周期管理**，不在 Bridge 命令面（proposal 023 产线表态：两路径均不是编辑器
内命令，unity-bridge v3 命令词表零增操作）：

- **握手信号**：桥包在工程加载完成时（`InitializeOnLoadMethod`）向
  `<project>/.vua/bridge/handshake.json` 原子写入握手事实（闭集四键：
  `schemaVersion`/`pid`/`editorVersion`/`occurredAt`，schema 见
  `schemas/unity-bridge/handshake/v1.0/`）。这是「工程加载完毕」的确定性信号——交接任务的
  完成判定＝该握手到达；「进程已启动」绝不作为完成事实，超时如实失败，不猜面板状态。
  载荷永不携带工程明文路径（文件位置即工程绑定）与上传状态（诚实纪律由形状钉死）；写入
  尽力而为，失败不打断编辑器，等待方如实超时。
- **打开/聚焦**：Rust 产线 port（`crates/unity-bridge` `handoff` 模块）提供机制原语——
  探测（握手踪迹＋pid 活性＝已打开事实；踪迹缺失/损坏/版本不认识/进程已死一律如实视作未
  打开）、分离式启动（`Unity.exe -projectPath`，凭据剥离基线与 batchmode 链同一来源）、
  握手等待（预算内轮询，超时类型化上报）、OS 窗口聚焦（尽力而为，不进完成判定不进回执
  事实——焦点非稳定事实）。
- **任务编排**（buildId→编辑器身份解析、打开/聚焦路径选择、任务九态映射）归核心 use
  case 切片；本 port 只提供机制事实与机制原语。

## 作业与安全

- 请求和结果使用版本化 Schema，写入项目内受控 `.vua` 作业目录；
- Orchestrator 原子写请求，Unity 原子写结果；
- 同一命令 ID 的重复执行遵循协议定义的幂等规则；
- 项目指纹不匹配时拒绝修改并要求重新 Inspect；
- 修改前必须存在适合该操作的快照或可验证补偿边界；
- 确定性操作使用已定义的 Bridge 命令；
- 仓库与云端 CI 使用结构等价且不含真实商品或用户内容的合成项目与素材；开发者可以在本地使用自己
  合法取得的素材完成 Unity 集成与冒烟验证，相关素材、项目、配置和输出保留在本地。

## 文档变更日志

- 1.2.0（2026-09-22）：用户裁决 2026-09-22 落地——Recipe 从「期望状态」改为可叠加的一组修改
  （叠加语义、默认保留、显式删除、四选项冲突处理、有限复现边界，指向产品边界 1.5.0「制作
  范围与产品裁决」）；生产模型去掉 Inspection 阶段，检查归入制作记录与通知中心，Release
  占位记录区别于不可变 Build Record；新增「MA 与 SDK 职责边界」节；「稳定引用」措辞改为
  对象定位待实机验证（未决）；ALCOM/VCC 兼容措辞纠正为原项目只读＋副本写路径（对齐已接受
  的 U3/U14 裁决，不改变既有边界）。EN 镜像同步。
- 1.1.0（2026-09-16）：新增「交接进程面（Release Handoff）」节——023 产线实现域切片
  （桥握手信号 `EditorHandshake`＋Rust 进程/窗口面 port `handoff` 模块＋
  `schemas/unity-bridge/handshake/v1.0/`）；Bridge 命令面零变化。
- 1.0.1（2026-09-08）：勘误轮——EN 镜像 "Unity/VPM/tool versions" 与权威中文
  「Unity、VPM 包与工具版本」不一致（EN 缺 package），按 BOARD #9 术语裁定
  （VPM 包 = VPM package）补齐；中文正文无变更。
- 1.0.0（2026-09-06）：纳入版本管理；头部规范化并补充符合性复核日期，内容对照实态复核无变更。
