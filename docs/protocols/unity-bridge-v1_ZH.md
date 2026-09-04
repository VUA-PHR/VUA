# Unity Bridge 协议 v1

[English](unity-bridge-v1_EN.md) | [简体中文](unity-bridge-v1_ZH.md)

> 状态：已接受
> 协议版本：1
> 更新：2026-09-02
> 规范效力：有；JSON 结构以 `schemas/unity-bridge/v1/` 为机器可判定来源

## 用途与边界

Unity Bridge v1 连接 Orchestrator 与全球版 Unity `2022.3.22f1` Editor Package。Orchestrator
负责用户意图、计划、批准、快照和恢复；Bridge 只校验并执行已允许的 Unity 操作。Bridge 不接收
任意脚本，也不负责账号登录、素材下载或 VRChat 上传。

## Editor 前置条件

M0 门只在所选 Editor 和迁移完成后的项目都以完整字符串精确匹配 `2022.3.22f1` 后，才接受
Bridge v1 用于生产执行。Orchestrator 必须在启动前检查已安装 Editor 和
`ProjectSettings/ProjectVersion.txt`；Bridge 必须在检查或修改前独立校验自身运行时
`Application.unityVersion`。

`2019.4.31f1` 与 `2022.3.6f1` 是迁移来源，仅在项目副本完成备份和升级后进入 Bridge。Unity
其他版本、团结引擎和其他变体均在 v1 执行范围外，不为特定 Unity 发行后缀建立独立执行分支。
Bridge 在任何项目读取或修改前以 `bridge.editor_version_unsupported` 拒绝运行时版本不匹配，
保持项目原状，并
通过应用边界返回处理路径。`ProjectVersion.txt` 的修改由用户明确控制。支持矩阵以
[Unity Editor 兼容政策](../compatibility/unity-editor_ZH.md)为权威来源。

## 传输

Orchestrator 在目标 Unity 项目的 `.vua/bridge/` 下原子写入请求文件，然后启动 Unity：

```text
-batchmode -quit -projectPath <project>
-executeMethod Vua.Editor.Bridge.BridgeEntryPoint.Run
-vuaRequest <absolute-request-path>
-vuaResult <absolute-result-path>
```

两个文件路径都必须解析到当前 Unity 项目的 `.vua/bridge/` 子目录。Unity 通过同目录临时文件写入
完整结果，再切换到约定的结果路径。命令行输出只用于诊断，不作为机器接口。

## 命令信封

请求必须符合 [`command.schema.json`](../../schemas/unity-bridge/v1/command.schema.json)。当前允许：

| operation | 模式 | 用途 |
| --- | --- | --- |
| `inspect_project` | 必须 `dryRun: true` | 检查当前 Scene 是否可读并返回指纹 |
| `import_unity_package` | 可检查或修改 | 校验来源摘要并导入批次中的一个 `.unitypackage` |
| `materialize_extracted_package` | 可检查或修改 | 物化调用方解包的 guid 布局（逐条目对 `manifest.sha256` 校验，摘要在解包时计算）。batchmode 事实（2026-09-04）：Unity 的 `ImportPackage` 在 `-batchmode` 下静默空操作，batchmode 执行必须使用本操作；`import_unity_package` 保留文件+摘要语义 |
| `create_local_vpm_package` | 可检查或修改 | 仅在带令牌的 VUA 暂存项目中整理 Editor/Runtime 并生成本地包 |
| `validate_asset_paths` | 必须 `dryRun: true` | 确认计划素材路径可由 AssetDatabase 加载，仅证明最小结构 |
| `identify_assets` | 必须 `dryRun: true` | 解析 Avatar 与衣装的 `GlobalObjectId` |
| `install_outfit` | 可检查或修改 | 建立层级并配置 MA Merge Armature |
| `create_toggle` | 可检查或修改 | 创建或更新 MA 菜单项和对象开关 |
| `validate_avatar` | 必须 `dryRun: true` | 验证衣装层级和 MA 组件 |
| `analyze_performance` | 必须 `dryRun: true` | 返回本地结构估算，不冒充官方等级 |

两个素材操作属于 B3 双入口的版本化执行面：文件夹批次内所有来源包按规范化相对路径排序后逐个
执行；`create_local_vpm_package` 必须验证 `.vua/staging.json` 中的一次性暂存令牌，不能对普通用户
项目运行。包依赖由 Orchestrator 显式提供，Bridge 不猜测也不删除声明。

修改模式是 `dryRun: false`。修改命令必须携带最近一次成功结果中的
`data.projectFingerprint` 作为 `expectedProjectFingerprint`；不匹配时 Bridge 拒绝执行。

`commandId` 用于请求、结果和完成回执关联。完成的修改命令在项目 `.vua/bridge/completed/` 保存回执；
相同 `commandId` 重放只返回既有结果，不重复导入或移动素材。进程在回执落盘前中断属于未知结果，
必须重新 Inspect，不能自动重放。装配操作另外保持目标结构幂等：重复装配不会叠加 Merge Armature，
重复创建同名开关会更新既有对象。未来增加操作时必须先定义重复执行语义。

可执行固定示例位于 `schemas/unity-bridge/v1/examples/`。示例只包含合成标识符和指纹。

## 结果

结果必须符合 [`result.schema.json`](../../schemas/unity-bridge/v1/result.schema.json)：

- `succeeded`：操作完成，修改操作已保存；
- `rejected`：请求、选择、前置条件或项目指纹不满足，未开始有效修改；
- `failed`：执行或保存过程中发生故障，调用方必须按 Build Record 和快照判断恢复方式。

每个成功结果都返回操作后的 `data.projectFingerprint`。`changedPaths` 是受影响的 Unity 层级路径，
`diagnostics` 使用稳定 `code`、严重性和面向用户的消息。Orchestrator 只依赖稳定字段和代码，不能
解析本地化消息来决定流程。

## 版本规则

- v1 Schema 只允许已实现的操作；计划中的操作不能提前加入枚举。
- 增加可选字段且旧消费者可忽略时可保持协议版本；改变字段语义、必填性或执行保证时发布新版本。
- Orchestrator 模型、JSON Schema、C# DTO 和固定测试必须在同一变更中更新。
- 包版本与协议版本独立；包可以修复实现而继续支持 Bridge v1。
- Editor 生产目标变化需先完成兼容政策晋升，并发布通过测试的新 VUA/Bridge Package；Bridge v1
  不会静默扩大版本范围。
