# AMF 与 Unity Bridge 架构

> 状态：已接受
> 范围：AMF 应用服务、Recipe、Build Record、`unity/`
> 更新：2026-09-01
> 规范效力：有

## AMF 生产模型

AMF 以 Recipe 为期望状态来源：用户先选择合法取得的素材和目标组合，再由系统决定项目、依赖和
执行步骤。

```text
Warehouse → Recipe → Assembly → Production → Inspection → Release
```

- Warehouse 管理本地素材、预览、来源和导入记录；
- Recipe 表达项目无关的素材组合、参数和目标，不携带付费文件；
- Assembly 解析当前机器和素材，生成 ProjectSpec、依赖与可审查计划；
- Production 创建或复用项目，执行导入和装配并记录进度；
- Inspection 产出功能、性能、依赖、光照和上传准备度报告；
- Release 管理 Build Record、快照、恢复和官方 SDK 上传交接。

Recipe 是可移植意图，不是任意脚本或预制 Unity 命令流。导入 Recipe 后必须针对当前客户端重新
解析素材、版本和能力，再生成执行计划。

## Build Record

每次生产保存不可变 Build Record，至少关联：

- Recipe 版本与内容指纹；
- 已解析的本地素材和来源记录；
- Unity、VPM 包与工具版本；
- ProjectSpec、批准计划和项目初始/最终指纹；
- Unity Bridge 请求、结果、警告和检测摘要；
- 快照与恢复点。

Build Record 不包含 BOOTH Cookie、购买凭据、Blueprint ID 或未获许可传播的素材内容。

## Unity Bridge 边界

Unity Bridge 是 Unity 2022 Editor Package，通过版本化作业协议：

- 检查项目、Avatar 和已导入素材；
- 使用 GUID 与 `GlobalObjectId` 等稳定引用；
- 校验操作并在支持时提供 dry-run；
- 执行骨骼、菜单、参数、动画、材质和 Modular Avatar 组件操作；
- 使用公开 Modular Avatar/NDMF/VRCSDK API，不依赖反射访问内部实现；
- 返回结构化变更、诊断、项目指纹和可重试信息。

Bridge 不拥有用户旅程、Recipe、下载、凭据、批准流程或项目历史。最终登录与上传保留在 VRChat
官方 SDK Panel。

## 作业与安全

- 请求和结果使用版本化 Schema，写入项目内受控 `.vua` 作业目录；
- Orchestrator 原子写请求，Unity 原子写结果；
- 同一命令 ID 的重复执行遵循协议定义的幂等规则；
- 项目指纹不匹配时拒绝修改并要求重新 Inspect；
- 修改前必须存在适合该操作的快照或可验证补偿边界；
- 不通过模拟点击 Unity UI 代替可定义的 Bridge 操作；
- 测试只使用自制或明确可再分发素材。

## 迁移原则

旧 Unity Bridge 只有在源码、Schema、测试和本地 Unity 2022 验证一起迁移时才算保留。演示用付费
素材、绝对路径、临时 Scene 和仅人工成功记录都不能成为新仓依赖。
