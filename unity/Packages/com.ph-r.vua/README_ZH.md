# VUA Unity Bridge

该全球版 Unity `2022.3.22f1` Editor Package 是 VUA Orchestrator 与 Unity 项目之间的确定性
执行边界。当前实现项目检查、素材识别、Modular Avatar 衣装装配、菜单开关、装配验证和本地
性能估算。

精确生产目标以及迁移/暂不支持 Editor 类别由
[Unity Editor 兼容政策](../../../docs/compatibility/unity-editor_ZH.md)定义。除精确的全球版
`2022.3.22f1` 外，其他 Unity 版本与团结引擎均在本 Package 执行支持范围外。

机器契约由仓库的 `schemas/unity-bridge/v1/` 定义，说明见[中文协议](../../../docs/protocols/unity-bridge-v1_ZH.md)。
包内测试只使用运行时创建的合成对象，不包含付费 Avatar 或衣装素材。

本 Package 采用 Apache-2.0；声明的 Unity Package 依赖继续受各自许可证约束，不因 VUA 而重新许可。
