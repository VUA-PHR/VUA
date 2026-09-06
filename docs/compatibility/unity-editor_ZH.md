# Unity 编辑器兼容性

[English](unity-editor_EN.md) | [简体中文](unity-editor_ZH.md)

> 文档版本：1.0.0  
> 状态：已接受  
> 范围：Unity 侦测、项目接入、AMF 生产与 Unity Bridge 执行  
> 更新：2026-09-02  
> 规范效力：定义 VUA 的编辑器支持矩阵

## 支持矩阵

VUA 比较完整的 Unity Editor 版本字符串，包括发行和分发后缀。该版本在本政策中是能力标识，
不按 SemVer 范围解释。

| 类别 | Editor 版本 | VUA 行为 |
| --- | --- | --- |
| 生产目标 | 精确的全球版 Unity `2022.3.22f1` | 唯一可进入完整 AMF 与 Unity Bridge 检查、修改、验证和 Build Record 支持的 Editor |
| 迁移来源 | `2019.4.31f1`、`2022.3.6f1` | 识别项目元数据，要求备份或副本，并引导迁移到生产目标 |
| 其他 Unity 版本或构建 | 除生产目标和迁移来源外的完整版本字符串 | 报告当前版本与生产目标的精确差异，并引导安装全球版 `2022.3.22f1` |
| 暂不支持的编辑器系列 | 团结引擎 | 报告当前支持状态并引导使用生产目标 |

[VRChat 当前版本页面](https://creators.vrchat.com/sdk/upgrade/current-unity-version/)指定
`2022.3.22f1`，并提示更高版本 Editor 可能产出无法在 VRChat 加载的内容。因此，新的生产目标需
同时满足 VRChat 已采用该版本，以及对应 VUA 发行通过 Bridge、SDK、Package、合成项目和本地冒烟
矩阵。上游推荐状态与 VUA 验证状态分别记录。

## 迁移来源

`2019.4.31f1` 和 `2022.3.6f1` 仅作为项目迁移输入。VUA 可以检查其
`ProjectSettings/ProjectVersion.txt`，判断迁移路径，并创建或要求备份。项目副本到达生产目标后
才开始 Bridge v1 操作。`2019.4.31f1` 的升级以 VRChat 官方
[2019→2022 指南](https://creators.vrchat.com/sdk/upgrade/unity-2022/)为权威来源。

## 其他 Unity 版本

除生产目标和迁移来源外，任何完整版本字符串都按普通的不支持版本处理，不为特定发行后缀建立
独立产品分类。VUA 报告检测到的实际版本、所需的生产目标和可用的安装引导，并保持
`ProjectSettings/ProjectVersion.txt` 原状。账号凭据、登录会话和许可证激活继续由 Unity Hub 与
Editor 持有；VUA 只接收能力与就绪结果。

## 团结引擎

团结引擎当前暂不支持。VUA 可以识别其安装以提供诊断，随后停止 Unity 生产路径并引导用户使用
全球版 Unity `2022.3.22f1`。项目格式相似性不构成 Bridge 执行、VRChat SDK 验证、构建或上传准备
的授权依据。

## M0 强制验收要求

- M0 迁移封口以 Unity Bridge 本机验证为准；当前 Orchestrator 参考实现及其测试不构成否决门；
- 正式 Orchestrator 实现必须只选择精确命中生产目标的 Editor 执行 Bridge 作业；
- Unity Bridge 必须在检查或修改前校验自身运行时 `Application.unityVersion`；
- 版本不匹配时保持项目文件原状，并返回类型化处理路径；
- 迁移始终在备份或显式副本上进行，并记录来源和目标版本；
- Build Record 保存每次成功生产使用的完整 Editor 版本。
