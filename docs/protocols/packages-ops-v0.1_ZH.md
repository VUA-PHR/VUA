# packages-ops 协议 v0.1（包管理 P3 写面首冻结切片 A1＝移除：packages.previewRemove ＋ packages.applyRemove）

[English](packages-ops-v0.1_EN.md) | [简体中文](packages-ops-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（包管理 P3 写面 A1 移除词表行）**
> （2026-09-19，提案 026 A1 核心冻结批：表态程序收敛——核心裁决
> 82a39c4 五点、环境库面考证 4a0f02f 实现零缺口、桌面表态 93752d5
> 三项；本批落死权威词面）
> 机器可读词表：`schemas/packages-ops/v0.1/`（逐行双 Schema＋4 正
> 8 负向量；核心消费测试 `crates/provider-host/tests/
> packages_ops_consumer.rs`；TS 守卫测试
> `packages/contracts/src/application-contract.test.ts`）
> 范围：`packages.previewRemove`（同步只读变更预览）与
> `packages.applyRemove`（九态任务化移除写命令，双摘要守卫）
> 所有权边界：词表冻结、端口面（`VpmBackend` 写方法族已在库）、
> wire 路由＝核心域（接线切片紧随本批）；`VpmBackend` 库面实现
> （project-manager，`preview_remove`/`apply_remove` 已在库）＝环境
> 域（实现核对切片照 024/025 程序随后落地）；桌面消费＝桌面域
> （逐面升级，`blocks.changes` 演进照桌面表态 93752d5 第 3 条）
> 更新：2026-09-19（v0.1 冻结批：双 Schema＋向量＋核心消费测试＋
> TS 面＋双语协议本＋REGISTRY 登记）

## A1 写面语义（二段动词与九态任务）

面序权威（核心裁决 82a39c4 第 1 点）：A1 移除→A2 安装/升级→A3
register_local_package→A4 仓库订阅写面殿后。A1 系写面族中风险最小
面（无网络、无依赖解析、双摘要守卫已在库），立程序样板：任务化九
态、确认链、审计收据、恢复语义、错误码族的逐面落实形状以本批为底
本（014 import-copy 先例同构）。

- **preview＝同步只读 query。** `packages.previewRemove` 计算移除将
  造成的全部变更（`items` 覆盖传递依赖移除——ORC-WF-002：计划必须
  覆盖后端将做的一切变更），产出摘要指纹 `digest`（规范条目列表的
  FNV-1a）。preview 永不变更任何状态；其失败走 wire 信封错误（非
  result 臂）。
- **apply＝九态任务化写命令。** `packages.applyRemove` 必携
  `confirmedDigest`（用户确认的 preview 摘要指纹）；服务端在执行前
  复算 preview，任一漂移即拒（ORC-WF-003/004 双摘要纪律；桌面只做
  UX 提示，权威判定在服务端——014 仲裁第 2 点先例）。九态任务语义
  （`commandId` 幂等、可取消、事件＋revision、`waiting_for_input`
  挂「预览完成待确认」）走应用契约任务面，不在本词表。
- **恢复＝复检，绝不隐式续传（诚实纪律 3）。** apply 任务中断/失败
  的非终态残留由复检标 `inspect_required`；重试语义＝用户显式重预
  览重确认（014 先例的「清理后重来」在移除面＝重走确认链），绝不
  静默续跑。指纹漂移拒绝系 recoverable 冲突（端口实现
  `PREVIEW_DRIFT` `.with_recoverable(true)` 在案）。
- **参数闭集。** `projectPath`＝013 注册身份（未注册路径答复用类型
  化码 `vua.project.project_not_found`——同事实同码，024 P1 先例）；
  `packageIds`＝显式非空闭列（`minItems 1`＋`uniqueItems`）——无通
  配、无「移除全部」速记；preview 参数无 digest 位（digest 是
  preview 的产物，携即形状违反）。

## 审计收据（核心裁决第 3 点随批定形）

`kind=receipt` 照 014 导入收据先例＝变更清单＋实际结果：
`confirmedDigest`（用户确认的指纹回显——确认面与执行结果的审计关
联）＋`requestedPackageIds`（请求清单照实回显）＋`removedItems`
（后端实际移除的变更行，端口 `apply_remove` `{removed: items}` 逐
字投影）。任务关联走任务面（`taskId`/`revision`），收据是回流载荷
非持久链接。无端口载体的发明事实（移除后复检、字节数、时间戳）在
Schema 即非法——虚假断言防线，非「不鼓励」。

## 错误码族 vua.packages.*（A1 首面闭集一次立全）

新立三码（guard 值＝code 后缀，冻结 Schema pattern
`^vua\.packages\.`；闭集随本批一次立全，A2+ 面增码走各自冻结批）：

| guard | code | 事实 |
| --- | --- | --- |
| `preview_drift` | `vua.packages.preview_drift` | 双摘要守卫拒绝（确认指纹与服务端复算不一致；recoverable 冲突） |
| `package_not_found` | `vua.packages.package_not_found` | 请求移除的包不在工程已装集合 |
| `execution_failed` | `vua.packages.execution_failed` | apply 阶段执行失败（ExternalFailure 类） |

复用零新立（申报）：`vua.project.project_not_found`（projectPath
未注册）、`vua.packages.invalid_params`（请求形状违规）、
`vua.packages.unavailable`（引擎未接线诚实缺席）——三者均在库
（013/024 已立）。端口层既有码族 `vua.vpm.*`（`PREVIEW_DRIFT`/
`APPLY_FAILED`/`PACKAGE_NOT_INSTALLED` 等）系实现层事实，继续存在；
wire 词表投影到本闭集的映射随环境实现核对切片申报。既有冻结码
`vua.vpm.no_matching_package`（catalog 面消费中）维持不动不回改
（核心裁决 82a39c4 第 4 点）。

## 方法面

- `packages.previewRemove`——`kind: "query"`，params 双键闭集
  `{ projectPath, packageIds }`。result 族常量
  `vua.packages-ops/v0.1`；`kind=plan` 恰一臂：`items`（变更行闭集
  `kind`/`packageId`/`version`/`reason`——`version`/`reason` 可空，
  null＝端口 Option 逐字投影）、`conflicts`（依赖破坏自由文本警示
  ——确认 UI 必须警示）、`removeLegacyFiles`/`removeLegacyFolders`
  （移除将顺带清理的遗留文件/目录）、`destructive`（conflicts 或
  legacy 清理非空即 true，ADR-0006）、`digest`。
- `packages.applyRemove`——`kind: "command"`（`commandId` 幂等），
  params 三键闭集（加 `confirmedDigest`）。result 族常量同上；
  任务终态回流恰两臂：`kind=receipt`（审计收据，见上节）或
  `kind=rejected`（类型化守卫拒绝：`guard` 三值闭集＋`code`＋
  `detail`）。operation/kind 锁：previewRemove 恒答 plan，
  applyRemove 恒答 receipt/rejected（Schema 层机器可检）。

## 信封、版本与依赖方向

wire 信封系常设形状（`schemaVersion` 信封常量 `"0.1"` ＋ `operation`
＋ `result`）；result 文档携带自己的族常量
（`vua.packages-ops/v0.1`）——两版本独立（c914cf2 常设规矩）。依赖
方向不变：renderer → 类型化 Gateway → Electron main（逐字透传）→
版本化应用契约 → provider wire 面 → `VpmBackend` 端口 →
project-manager 适配器。框架与厂商类型留在适配器；词表只传输事实。

## 机器可读词表

- `schemas/packages-ops/v0.1/command.schema.json` ＋
  `result.schema.json` ＋ `examples/`（4 正 8 负）
- 消费测试：`crates/provider-host/tests/packages_ops_consumer.rs`
  （Schema 向量＋端口→wire 投影闭环＋trait 默认缺席臂＋漂移
  recoverable 词面钉死）；`packages/contracts/src/
  application-contract.test.ts`（TS 守卫闭集）；
  `packages/orchestrator-provider` mock 恒缺席臂（模拟面永不模拟
  wire 写回执）

## 诚实边界与开放项

- **wire 路由未接线。** 本批系词表层：`packages.previewRemove`/
  `packages.applyRemove` 的路由、`served_capabilities` 行与信封组装
  归核心接线切片（紧随本批）；接线前这两方法在 wire 面不存在，桌
  面 `blocks.changes` 写入口维持类型级不可见（不预搬 fixture 形状
  进 live——#22/#36 教训两次在案）。
- 环境实现核对切片（`VrcGetLibBackend` `preview_remove`/`apply_remove`
  已在库，照 024/025 程序做实现＋定向测试＋wire 对齐证据）随接线
  批落地。
- 桌面消费照逐面升级程序（表态 93752d5 第 3 条：A1 冻结批解锁对应
  写入口，冻结批＝该面 live 形状唯一权威）；零端到端宣称：真机走
  查仍归 W25（候用户开窗 O-2）。
- `create_project` 不在 P3 面序（核心裁决 82a39c4 第 5 点：留 A5，
  启动条件＝桌面提出入口需求）；A4 仓库订阅写面候增删/启停二分表
  态收敛（环境倾向增删先行，启停候 VCC 键名真机核实）。
