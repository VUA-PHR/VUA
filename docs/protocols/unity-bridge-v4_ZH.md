# Unity Bridge 协议 v4

[English](unity-bridge-v4_EN.md) | [简体中文](unity-bridge-v4_ZH.md)

> 文档版本:v4
> 状态:**已冻结**(2026-09-20,用户裁决 slice/production-nav-bake-preview)
> 协议版本:4
> 更新:2026-09-20
> 规范效力:有;JSON 结构以 `schemas/unity-bridge/v4/` 为机器可判定来源
> 来源决议:用户裁决 2026-09-20(slice/production-nav-bake-preview 移植切片;
> 无提案编号,裁决即立案权威)

## 用途与边界

Unity Bridge v4 连接 Orchestrator 与全球版 Unity `2022.3.22f1` Editor
Package。v4 是 v3 的**冻结超集**(同面升版,v1→v2→v3 先例复刻):v3 的
全部操作、字段与收据语义保留不变;v4 恰增一个操作 `build_preview`
(Release 烘焙转盘,移植自参考实现 BridgePreviewBake)。

既有消费面维持其版本标签不变(material 线 v1、生产作业面与检查读面
v2/v3);`build_preview` 是 v4 的唯一新增消费面,旧版本标签不得携带该
操作(v3 标签携带即拒绝)。

## Editor 前置条件

沿用 v1/v2/v3:只在 Editor 与项目精确匹配 `2022.3.22f1` 后接受 Bridge
用于生产执行;版本不匹配以 `bridge.editor_version_unsupported` 拒绝,
保持项目原状。

## 传输

沿用 v1/v2/v3 job-directory 纪律(`.vua/bridge/` 原子写入＋
`BridgeEntryPoint.Run`);v4 零传输面变更。本切片不移植参考实现的
LiveBridgeWatcher 队列轮询,也不新增桌面触发链——触发链维持既有
每命令一次 batchmode 进程形态。

## 命令信封

请求必须符合
[`command.schema.json`](../../schemas/unity-bridge/v4/command.schema.json)
(`schemaVersion` const 4)。v4 操作全集＝v3 全集(见
[v3 协议](unity-bridge-v3_ZH.md))＋★一个变更操作:

| operation | 模式 | 用途 |
| --- | --- | --- |
| ★ `build_preview` | 变更(产物写入工程目录;`dryRun=true` 只读统计) | Release 烘焙转盘:在隔离 preview scene 实例化 Avatar 副本,相机环绕烘焙 60 帧 1024×1024 透明底 PNG ＋ cover.png ＋ manifest.json,产物写入 `.vua/bridge/preview/<commandId>/` |

`build_preview` 的 v4 增量纪律(用户裁决 2026-09-20):

- **mutating 定性**:产物写入工程目录即副作用,落既有信封纪律,不发明
  第三分类——real-run(`dryRun` 缺省/false)必须携带
  `expectedProjectFingerprint`;`dryRun=true` 只做目标识别与结构统计,
  **不生成任何图片**。
- **payload 零新增**:复用可选 `avatarGlobalObjectId`;为空时 Bridge 在
  活动场景按参考 ResolveAvatar 语义自动识别最佳 Avatar 根
  (VRC_AvatarDescriptor/Animator/网格量打分)。帧数与尺寸刻意不参数化
  (落地常量 60 帧 1024×1024)。
- **统计口径**与 `analyze_performance` 一致(本地结构估算,非 VRChat
  官方性能等级):统计入 `data.triangles/materialSlots/
  skinnedMeshRenderers/bones`,`data.basis` 恒 `local_estimate`,
  `data.avatarName` 为解析出的 Avatar 名。
- **诊断类型化码**:`preview.no_avatar`(找不到可预览 Avatar,拒绝)、
  `preview.dry_run`(检查通过未产图)、`preview.baked`(已烘焙,附产物
  相对目录)、`preview.bake_failed`(异常,附截断堆栈)。
- **用户场景零改动**:烘焙全程在 `NewPreviewScene` 隔离内进行,用户场景
  从未被弄脏;mutating 收尾管线为 `build_preview` **跳过场景保存**
  (即使用户场景自带未保存改动,预览操作也绝不替用户保存);回执照写
  `.vua/bridge/completed/<commandId>.json`,幂等重放经
  commandFingerprint 绑定(既有纪律)。
- **收据版本回显**命令协议版本(execute_production_job 先例):v4 命令
  的 build_preview 收据标 4。
- **收据零新增数据字段**:产物目录记入 `changedPaths`(相对路径
  `.vua/bridge/preview/<commandId>/`),统计记既有 data 面。

## 产物目录约定

real-run 产物落在项目根下:

```text
.vua/bridge/preview/<commandId>/
  frames/frame_00.png … frame_59.png   (60 帧,1024×1024,透明底)
  cover.png                            (frame_00 副本)
  manifest.json                        (manifest 自身 schemaVersion 1)
```

**manifest 形状**(manifest v1,桌面 TurntablePlayer 的消费契约):
`schemaVersion` 1、`commandId`、`avatarName`、`bakedAt`(ISO 8601)、
`basis`("vua-unity-editor-bake")、`frames`/`width`/`height`、
`framePattern`("frames/frame_{0:D2}.png")、`cover`("cover.png")、
`triangles`/`materialSlots`/`skinnedMeshRenderers`/`bones`(与收据统计
同口径)。manifest 是 preview 目录的私有格式,其 schemaVersion 与
unity-bridge 协议版本无关。

## 收据

结果必须符合
[`result.schema.json`](../../schemas/unity-bridge/v4/result.schema.json)
(`schemaVersion` const 4)。v4 收据＝v3 收据面,仅操作枚举增收
`build_preview`;成功的 build_preview 收据至少携带一条诊断(检查通过
或烘焙完成必有一个结论)。

## 版本规则

v1/v2/v3 冻结文件一字节不动;全部 v3 形状在 v4 标签下(schemaVersion
升至 4)继续有效(v4 只增不改,Rust 消费测试钉死)。桌面消费半套的
寻址约定为 `<projectRoot>/.vua/bridge/preview/<commandId>/`(VUA 桥
目录约定,替换参考实现的 `.vrcua/bridge/preview`)。

## 文档变更记录

- v4(2026-09-20):Release 烘焙转盘协议——恰增 `build_preview`
  (用户裁决 slice/production-nav-bake-preview:mutating 定性、dryRun
  只出统计、preview scene 隔离、用户场景零改动、产物目录与 manifest
  形状)。Schema＋5 向量(dry-run 请求/real-run 请求/dry-run 收据/
  版本负例/操作负例)＋Rust 消费测试(bridge_v4_vectors 4 例)＋核心
  `UnityOperation::BuildPreview`(is_mutating 收录)＋C# 实现
  (BridgePreviewBake＋处理器接线)＋C# EditMode 合同测试落地。
  C# EditMode 测试未真机运行,零端到端宣称。
