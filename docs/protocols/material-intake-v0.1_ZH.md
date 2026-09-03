# AMF 素材入口协议 v0.1

[English](material-intake-v0.1_EN.md) | [简体中文](material-intake-v0.1_ZH.md)

> 状态：B3 实现基线
> 范围：`.unitypackage` 直接导入与 `local-reusable` VPM 制作/安装
> 更新：2026-09-03

## 批次与名称

用户选择一个素材文件夹。该文件夹的名称成为用户可见包名；同名依次显示为 `名称 (2)`、
`名称 (3)`。合法 VPM 机器 ID 由 VUA 按本地来源身份生成并持久化，用户无需理解或填写。

文件夹下所有 `.unitypackage`（包括子目录）自动进入同一批次，按规范化相对路径排序。Inspect 保存
每个来源包的相对路径、大小、SHA-256 和归档内素材路径，并对整体来源与可执行风险清单分别计算摘要。
执行前重算；新增、删除、替换任一包或风险清单变化都返回 `vua.material.source_drift`。

## 风险决议

扫描 C#、托管程序集、原生插件、`Editor` 内容和可能的构建入口。整个批次只提示一次：创建完整项目
保护点并继续、无视风险继续（可仅在当前会话记住）或取消。第二项跳过额外完整保护点，但 B3 修改
任务仍强制保存 `Assets`、`Packages`、`ProjectSettings` 和 VPM 清单的最小恢复快照；第一项另纳入
`UserSettings`。决议绑定来源摘要和风险摘要；会话记忆不写入持久配置。VUA 不声称项目快照能阻止
代码执行或撤销项目外副作用。

## 双入口

- `direct_unity_package`：验证目标项目快照后，按计划顺序由版本化 Bridge 导入全部来源包；
- `local_reusable_vpm`：在带一次性令牌的隔离暂存项目导入全部来源包，生成 Editor/Runtime 布局和
  显式依赖清单，再由 VUA `vrc-get` 适配器预览、安装到目标项目并独立验证。

两条路径都只以 `validate_asset_paths` 证明 `minimum_structure`。素材能由 AssetDatabase 加载不代表
Avatar、衣装、材质、动画或 Modular Avatar 语义正确。

计划遵循 `schemas/amf-production/v0.1/material-plan.schema.json`；不可变结果遵循同目录的
`build-record.schema.json`。Bridge 修改完成回执绑定 `commandId` 与命令摘要；回执前中断必须先
Inspect，不得自动重放未知副作用。
