# packages-query 协议 v0.1（包管理读面词表行：packages.listInstalled）

[English](packages-query-v0.1_EN.md) | [简体中文](packages-query-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（包管理 P1 只读词表行）**（2026-09-17，proposal 024 P1
> 核心冻结批：三域表态收敛＋核心裁决定形，见「冻结收口」）
> 机器可读词表：`schemas/packages-query/v0.1/`（单方法 Schema＋正例 3＋
> 负例 3 向量；库级消费测试 `crates/project-manager/tests/
> packages_query_consumer.rs`；TS 消费测试 `packages/contracts/src/
> application-contract.test.ts`）
> 范围：`packages.listInstalled`（单项目已装包清单只读查询）；
> 项目清单复用 013 面 `project.listProjects`（同一注册事实不设第二词表）
> 所有权边界：词表冻结与 wire 路由＝核心域；`VpmBackend` 库实现
> （project-manager）＝环境域；桌面消费（PackagesPort P1 投影）＝桌面域
> （表态 ab02215：冻结批后消费批随后，notRun 呈现维持至实现切片落地）
> 更新：2026-09-17（v0.1 冻结批：协议本双语＋REGISTRY 登记）

## P1 读面语义（分期定位）

proposal 024 分三期：P1 只读面（本批）、P2 仓库/目录面（候环境后端扩
展提案——环境表态 62b4989 已确认可行可承接）、P3 变更面（照 013 R5 逐
面独立提案）。P1 落地后包管理器页收敛为桌面表态的**中间诚实态**：
「已安装可看、变更面不可用」——项目清单与已装包是真实数据；仓库列表、
版本枚举、更新语义、两阶段变更维持诚实 unavailable，不渲染不可用入口，
不发明空仓库列表。

## 冻结收口（proposal 024 硬前置逐项）

- **三域表态收敛**：桌面（024 内联「桌面表态」节，wt-3 ab02215——分期
  读法选 P1 中间诚实态＋PackageRow 降级投影虚假断言防线＋错误码复用）；
  环境（62b4989 经 0f82da3 入库，内联节随其树移录——P2 可行可承接＋
  注册库**非同一存储**〔vcc.liteDb vs settings.json/ALCOM〕＋P1 清单
  复用 013 聚合＋校验同 inspectProject 口径）；集成（第 70 批
  ae6eca6——门序 T-A 授权内先行〔014 先例〕＋登记联动双向引用＋死锚
  issue #25 不补建）；
- **Schema＋正负例向量**：`schemas/packages-query/v0.1/`（本批）；
- **至少一端消费测试**：库级消费测试 `crates/project-manager/tests/
  packages_query_consumer.rs`（4 例：冻结向量驱动双 Schema 校验＋库投影对
  result Schema 校验＋诚实空清单＋坏清单 typed 失败）＋TS 契约守卫
  （`@vua/contracts` packages.listInstalled 闭集正负例）；wire 帧环
  测试随实现切片；
- **双语协议本＋REGISTRY**：本文件＋EN 镜像＋REGISTRY 两行（本批）。

## 核心裁决（开放问题收敛定形）

1. **项目清单不设第二词表**：P1 项目清单复用 013 `project.listProjects`
   （VCC＋ALCOM 聚合、schema 已冻结）；`packages.listInstalled` 的
   `projectPath` 校验与 `project.inspectProject` 同口径——013 聚合面即
   本词表的世界，聚合外路径＝typed not-found。**注册库非同一存储的
   如实登记**（环境代码事实）：`VpmBackend::project_registry` 读
   `vcc.liteDb`，013 聚合读 VCC `settings.json`＋ALCOM settings——同
   一环境根、不同文件；仅注册在 liteDb 的路径在 013 面可能不可见
   （vrc-get 0.0.16 源注 vpm_settings.rs:25–33 载明 userProjects 将迁
   移）。实际分叉属真机事实，候 W25 只读核实；如需收敛走 013 升版独立
   提案（环境域文件，**不搭 P1 车**）。
2. **错误码复用**：projectPath 未注册＝复用 `vua.project.project_not_
   found`（同一事实同一错误码原则优先：本词表的注册校验语义就是 013
   聚合语义，同事实双码零增益）；`vua.vpm.capability_missing` 已在端
   口维持；`vua.packages.*` 新族 P1 仅立缺席臂与参数臂两码，packages
   特有事实码（仓库健康、digest 守卫拒绝等）归 P2/P3 随其冻结批立，
   避免提前立族长期空转（桌面表态采纳）。
3. **P1 词面零 P2 事实字段**：不带 `source`/`versions`/`compatible`/
   `updateAvailable`/`latestVersion`/`changelogUrl`/`displayName`——
   前 six 项是 P2 仓库/目录面事实；displayName 事实虽在包目录
   package.json，但端口投影类型（核心域）与生产者实现（环境域
   project-manager）分属两权属域，P1 词表**不预留无生产者字段**
   （ORC-DEV-004 同一纪律的字段面类比）；P1 消费桌面以 packageId 兼任
   显示名（其表态读法自洽）。包行的 `additionalProperties: false` 是
   **虚假断言防线**：携带发明字段的结果按 Schema 即非法，绝非「不鼓励」。
4. **诚实空清单**：已注册项目零已装包＝空 `packages` 数组的合法诚实应
   答；坏清单/不可读项目＝typed 失败（`vua.vpm.project_load_failed`），
   绝不以空清单冒充读取成功（诚实纪律 1/2）。

## 方法面

| 方法 | 分型 | 语义 | 消费方 |
| --- | --- | --- | --- |
| `packages.listInstalled` | Query（只读） | 返回一个已注册项目的已装包集合——后端从其 VPM manifest＋lock 与 Packages 树对账解析的包行投影（packageId 升序） | 包管理器页 P1 中间诚实态（桌面消费批候实现切片） |

params 闭集单键：`projectPath`（`minLength 1`；013 注册身份，与
`project.inspectProject` 同一族）；`additionalProperties: false`——词
表外参数＝`vua.packages.invalid_params` validation 错误信封（形状违反
绝不冒充缺席）。

## 结果文档

- 信封照既有命令面先例：`schemaVersion`（const `"0.1"`＝词表行族版本
  常量）＋`operation`＋`result`；`result` 本体携带自有族常量
  `vua.packages-installed/v0.1`——两版本相互独立（c914cf2 常设规则：
  每个词表行引用自己的版本常量）；
- `result` 闭集三键：`schemaVersion`（族 const）、`projectPath`（回显）、
  `packages`（包行数组）；
- 包行闭集三键：`packageId`、`version`、`dependencies`（直接依赖 id
  数组）——数组按 `packageId` 升序（冻结的确定性呈现事实，消费方可
  依赖；确定性而非语义）。

## 错误码闭集与缺席语义

| 码 | category | 语义 |
| --- | --- | --- |
| `vua.packages.unavailable` | unavailable | 路由/VpmBackend 未装配＝**诚实缺席**——绝不折叠成伪造清单或伪造空数组 |
| `vua.packages.invalid_params` | validation | params 闭集违反（形状违反绝不冒充缺席） |
| `vua.project.project_not_found` | validation | projectPath 不在 013 聚合注册面（**复用 013 码**：同一事实同一错误码；判定与 `project.inspectProject` 同口径） |
| `vua.vpm.capability_missing` | unavailable | 已装配后端未声明 `list_packages` 能力位（端口既有码维持） |
| `vua.vpm.project_load_failed` | external_failure | 后端加载项目失败（坏清单/不可读）——typed 失败，绝不以空清单冒充 |

能力行：`served_capabilities` 增 `packages.query` 行，availability 随
provider 装配的 `VpmBackend` 实例存在性翻转（装配未注入＝诚实缺席，
`5eeec28` 同口径）——随实现切片落地。

## 依赖方向

```text
React View（包管理器页 P1 中间诚实态,桌面消费批）
  → 类型化 feature/Gateway(PackagesPort)
  → Electron preload 与主进程适配器
  → 版本化应用契约(packages.listInstalled 词表行 + packages.query 能力行)
  → provider-host 路由(核心域,实现切片)
  → VpmBackend 端口(核心域,orchestrator)
  → VrcGetLibBackend 库实现(环境域,project-manager;list_packages 事实源)
```

## 机器可读词表

`schemas/packages-query/v0.1/`：`command.schema.json`＋
`result.schema.json`＋`examples/`（正例 3——request 闭集单键／含三包
result／诚实空清单 result；负例 3——缺 projectPath／空 projectPath／
params 词表外键〔预发布开关属 P2 语义〕／包行携带发明字段
`updateAvailable`〔虚假断言防线钉死〕）。消费测试双载体：
`crates/provider-host/tests/packages_query_consumer.rs`（4 例）＋
`packages/contracts/src/application-contract.test.ts`（TS 守卫闭集正
负例 3 断言）。词表或字段变更必须升版本，绝不原地改写。

## 开放项

- wire 路由＋能力行＋bin 装配（核心域实现切片）：紧随冻结批；
- 桌面消费批（PackagesPort P1 投影＋PackagesView 区块可用性标注形状
  核可）：候实现切片落地；
- 环境域 `list_packages` 投影小切片（displayName 若 P2 需要，随
  PackageCollection 端口升版正式入场）；
- vcc.liteDb 与 013 聚合注册集分叉的真机只读核对：候 W25（O-2）；
- P2 仓库/目录面：候环境后端扩展提案（环境表态已确认可承接）；P3 写
  面照 013 R5 逐面独立提案。端到端宣称维持为零——本批零运行时行为
  变化承诺到实现切片验收为止。
