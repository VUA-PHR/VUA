# VUA 项目操作写面契约 v0.2

[English](project-ops-v0.2_EN.md) | [简体中文](project-ops-v0.2_ZH.md)

> 文档版本：0.2
> 状态：**已冻结（2026-09-12）**——v0.1 增量族升版：新增 `project.setNote`
> 备注写命令（D-6 桌面确认裁定 A「列表行内查看＋行内轻量编辑」后，核心
> 013 表态「有条件立项」的条件成立，随核心升版批冻结）。v0.1 冻结件原样
> 保留（已取代，import-copy 形状零变更）。
> 机器可读词表：`schemas/project-ops/v0.2/`（command / result 两 Schema＋
> 正例 8＋负例 5＋守卫拒绝例 1；消费测试
> `crates/provider-host/tests/project_ops_wire.rs` 13 项——向量驱动校验＋
> 真实帧环 wire 全链）
> 范围：M6 T-A 写面延伸——项目列表备注（用户裁决 12「只在列表显示」＋
> B4 亚洲字符补位动机；D-6「行内查看＋轻量编辑」呈现面归桌面接线批）。
> 所有权边界：标识原语＝`crates/project-manager`（`vua_identity`，环境
> 交付）；provider 路由归核心域；桌面列表行内编辑交互归桌面域。
> 更新：2026-09-12

## 操作面（v0.2 两词表行）

| 操作 | 语义 | 参数 |
| --- | --- | --- |
| `project.import-copy` | （v0.1 原样）把一个管理器登记的项目**复制**为新的 VUA 管理项目；原项目全程只读、不取锁、不被标记 | `phase`：`plan` / `apply` 等，见 v0.1 |
| `project.setNote` | 设置（或以 `null` 清除）一个 **VUA 原生**项目的用户备注 | `projectPath`、`note` |

`project.setNote` 语义细节：

- **`projectPath` 是本词表族唯一的项目标识形态**——与 013 读面
  （`inspectProject`/`lockStatus`）同形同源（注册路径）。核心 09-10 草案
  曾写 `projectId`，升版定形时修正为 `projectPath`（`projectId` 在本族
  无既存定义；同族标识必须同形，且守卫语义以注册路径为锚）。桌面接线批
  消费以本协议本为准。
- **`note` 单行纯文本**：非空、≤2000 字符、不含换行；`null`＝清除备注；
  空串不是备注（拒绝）——清除走 `null`，诚实二值。
- **备注依附 VUA 原生声明**（用户裁决 12）：备注存于 `.vua/project.json`
  标识文档内（该文档即唯一备注存储）；写入不改变 `markedAt`（设备注
  永不重新标记项目）。
- 任务化同 import-copy 先例（九态任务面受理）；备注写入是瞬时单文件
  重写，受理后即完成，无长操作取消面。

## 守卫闭集（服务端逐项核验，v0.2 冻结）

守卫在任务内核验；守卫拒绝是 Done 载荷里的 `rejected` 结果文档（任务诚实
完成，裁决即拒绝——同 import-copy 纪律），不是传输错误。v0.2 在 v0.1 七项
基础上新增三项目标守卫：

| guard | code | 语义 |
| --- | --- | --- |
| 项目未登记 | `vua.project.project_not_found` | 无管理器登记该路径——检测面登记表即可写世界（与 `inspectProject` 同一集合） |
| 非 VUA 原生 | `vua.project.not_vua_native` | 无标识文件：备注依附 VUA 原生声明，无声明即无依附 |
| 标识不可读 | `vua.project.identity_unreadable` | 标识文件存在但不可解析——不可读证据绝不盲写覆盖，先解决再编辑 |
| 执行失败 | `vua.project.execution_failed` | （v0.1 已有，复用）标识文件写入本身失败 |

result `kind=note` 投影与 project-inspection v0.2 `vuaIdentity` present 面
同构（`markedAt`/`note` 同名字段）——列表读面与写面看到同一备注事实。

## 任务与恢复语义

- 复用应用契约九态任务面；不隐式续传（v0.1 纪律全文适用）。
- 受理信封：`schemaVersion`="0.2"＋`operation`＋`taskId`＋`correlationId`。

## 与读面的分线（v0.1 纪律维持）

检测/写两族独立版本化；`project.*` 写面词表行的读请求与读面词表行的写
请求双向拒绝钉死在消费测试。

## 文档变更日志

- 0.2（2026-09-12）：增量冻结——新增 `project.setNote`（`projectPath`＋
  `note`/null；单行纯文本 ≤2000 字符）＋守卫闭集三项扩充
  （project_not_found/not_vua_native/identity_unreadable）＋`kind=note`
  完成面（与 vuaIdentity present 投影同构）；`projectId` 草案用词定形为
  `projectPath`（同族标识同形）。消费测试 13 项绿（向量驱动＋wire 全链）。
  D-6 桌面确认（裁定 A）见 proposal 013 内联「表态（桌面）」节。
- 0.1（2026-09-09）：初版冻结——`project.import-copy` plan/apply 两阶段＋
  七拒绝码闭集＋任务/恢复语义；实现批 226dd41 经集成验收合并。
