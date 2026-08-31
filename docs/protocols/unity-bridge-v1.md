# Unity Bridge 协议 v1

> 状态：已接受
> 协议版本：1
> 更新：2026-09-01
> 规范效力：有；JSON 结构以 `schemas/unity-bridge/v1/` 为机器可判定来源

## 用途与边界

Unity Bridge v1 连接 Rust Orchestrator 与 Unity 2022 Editor Package。Orchestrator 负责用户意图、
计划、批准、快照和恢复；Bridge 只校验并执行已允许的 Unity 操作。Bridge 不接收任意脚本，也不
负责账号登录、素材下载或 VRChat 上传。

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
| `identify_assets` | 必须 `dryRun: true` | 解析 Avatar 与衣装的 `GlobalObjectId` |
| `install_outfit` | 可检查或修改 | 建立层级并配置 MA Merge Armature |
| `create_toggle` | 可检查或修改 | 创建或更新 MA 菜单项和对象开关 |
| `validate_avatar` | 必须 `dryRun: true` | 验证衣装层级和 MA 组件 |
| `analyze_performance` | 必须 `dryRun: true` | 返回本地结构估算，不冒充官方等级 |

修改模式是 `dryRun: false`。修改命令必须携带最近一次成功结果中的
`data.projectFingerprint` 作为 `expectedProjectFingerprint`；不匹配时 Bridge 拒绝执行。

`commandId` 用于请求与结果关联。当前修改操作在目标结构上保持幂等：重复装配不会叠加 Merge
Armature，重复创建同名开关会更新既有对象。未来增加操作时必须先定义重复执行语义。

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
- Rust 模型、JSON Schema、C# DTO 和固定测试必须在同一变更中更新。
- 包版本与协议版本独立；包可以修复实现而继续支持 Bridge v1。
