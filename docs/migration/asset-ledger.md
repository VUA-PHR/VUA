# 旧仓库资产迁移台账

> 状态：工作记录
> 范围：`VRC_Ultra_assistant`、`VUA_BDB` 到新 VUA 仓库
> 更新：2026-09-01
> 规范效力：无；只记录迁移裁决与验证状态

迁移采用“按资产提取”，禁止合并旧仓库历史或整条旧分支。每项资产进入新仓库前必须确认目标
所有者、保留价值、拒绝携带的旧假设、验证证据和第三方许可证。

## 分类规则

| 结论 | 含义 |
| --- | --- |
| 迁移 | 以新目录和新契约重建，可保留来源记录 |
| 提取 | 只取代码、测试、Schema 或固定向量中的明确部分 |
| 参考 | 放入低权威参考区或本地参考目录，不进入实现依赖 |
| 归档 | 仅保留在旧仓库 Git 历史，不复制到新仓库 |

## 当前裁决

| 来源 | 初步结论 | 应保留 | 明确不带入 | 验证门槛 | 状态 |
| --- | --- | --- | --- | --- | --- |
| `VUA_BDB` | 全部归档 | 无 | 全部决策、Schema、示例、API、爬虫、部署、运维、计划与数据库实现 | BDB Local 在新边界下从零设计和实现 | 已裁决 |
| VUA 调研文档 | 归档 | 只有新决策明确引用的事实另行重查 | 竞品结论、旧产品建议、阶段性研究摘要 | 无 | 不迁移；仅留旧仓历史 |
| VUA 架构与 ADR | 按模块重写 | 仍成立的约束、失败经验和验收条件 | 旧仓拓扑、Tauri、云端 BDB 和已失效产品边界 | 新模块所有者审议 | 已整合 |
| `GLM/orchestrator` | 重点提取 | Rust 核心、状态机、恢复/幂等逻辑、适配器端口、测试与固定向量 | Tauri 绑定、旧目录、旧 IPC、未经验证的文档结论 | 138 项自动测试通过；Clippy 通过；Electron IPC 与 CI 待后续切片 | 已提取 |
| `kimi/docs-art-v04-dual-track` | 参考 | React 交互、可访问性测试、Design Token、组件与状态模式 | Tauri 壳、Tauri IPC/CSP/权限、旧路由与产品文案 | 在 Electron 垂直切片中重新实现并测试 | 已参考化 |
| 美术风格与 UI/UX | 参考 | 可复用视觉语言、Token 候选、键盘与可访问性原则 | 未经产品页面验证的强制规则 | 新 Electron 原型验证 | 已参考化 |
| Unity Bridge | 迁移 | C# Package、版本化命令、Schema、EditMode/集成测试和已验证操作 | 付费素材、用户项目、临时场景、机器绝对路径 | Unity 2022.3.22f1 编译；6 项 VUA EditMode 测试通过；真实 Batchmode `inspect_project` 成功；CI 待后续切片 | 已迁移 |

## Unity Bridge 迁移记录

```text
资产：Unity Bridge v1
旧来源：VRC_Ultra_assistant / GLM/orchestrator / efb2f7f / unity/Packages 与 schemas/v1
新所有模块：unity/Packages/com.ph-r.vua、schemas/unity-bridge/v1、Rust Bridge adapter
迁移结论：迁移
保留价值：公开 MA API 装配、只读检查、项目指纹、dry-run、结构化诊断
拒绝携带的旧假设：个人包名、.vrcua 目录、旧命名空间、未实现的 build_preview、真实付费夹具
许可证与 NOTICE：仓库许可证尚待首次公开发行前确定；依赖通过 VPM 声明，未复制上游源码
本地验证：Unity 2022.3.22f1；6 项 VUA EditMode 测试（含合成装配与幂等重放）；Batchmode inspect 成功；Rust 全套测试和 Clippy 通过
CI 状态：尚未建立
迁移提交：本分支 Unity Bridge 迁移提交
```

## 单项迁移记录模板

```text
资产：
旧来源（仓库/分支/提交/路径）：
新所有模块：
迁移结论：迁移 / 提取 / 参考 / 归档
保留价值：
拒绝携带的旧假设：
许可证与 NOTICE：
本地验证：
CI 状态：
迁移提交：
```

## 完成条件

- 所有“迁移/提取”项都有明确的新模块所有者和验证结果；
- 新仓库不依赖旧工作树、绝对路径或旧 Git remote；
- 付费素材、凭据、生产数据库和用户 Unity 项目未进入 Git；
- 旧仓库增加归档说明并切换为只读后，才配置新仓库 GitHub remote。
