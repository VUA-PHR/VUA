# Orchestrator 任务存储格式 v0.1

[English](task-store-v0.1_EN.md) | [简体中文](task-store-v0.1_ZH.md)

> 文档版本：0.1
> 状态：已冻结（M2，2026-09-04）——SQLite 权威任务状态
> 所有者：Orchestrator 持久化适配器
> 更新：2026-09-02
> 格式版本：`0.1`

## 边界

SQLite 是任务、任务 revision、取消意图、终态结果、任务事件和命令幂等结果的权威来源。数据库行
不是 Gateway DTO；Provider 必须显式映射到[应用契约 v0.1](application-contract-v0.1_ZH.md)。

旧 JSONL journal 与 StateFile 是无实际用户的迁移期实现，不导入格式 `0.1`，也不形成兼容承诺。
可保留行为由测试重新表达；新数据库首次启动时创建空库。

## 机器格式与迁移

机器可执行初始迁移位于
`schemas/orchestrator-task-store/v0.1/001_initial.sql`。`vua_metadata.format_version` 固定为
字符串 `0.1`；SQLite `user_version = 1` 只是内部迁移序号，不是产品版本或协议版本。实现拒绝高于
自身支持范围的迁移序号和缺失、未知的格式版本，不猜测写入。

表的所有权如下：

| 表 | 权威内容 |
| --- | --- |
| `tasks` | 当前状态、revision、取消意图、错误、结果与时间 |
| `task_events` | 与状态提交同事务的可重放事件事实 |
| `command_idempotency` | `commandId`、请求指纹、稳定任务身份与既有响应 |
| `project_lease_generations` | 每个项目永不回退的 fencing generation |
| `project_mutation_leases` | 当前修改持有者、任务、心跳与恢复/Inspect 证据 |
| `vua_metadata` | 独立持久格式版本 |

## 事务与事件

- 任务受理必须在 `tasks` 和 `task_events` 同一事务提交后才返回成功；
- 状态、进度、取消和终态以预期 revision 作比较并写入下一 revision；
- 任务行更新和对应事件插入同成同败；订阅通知只能发生在提交成功之后；
- 同一任务事件的 `(task_id, revision)` 唯一，消费者发现跳号后重取权威快照；
- 同一 `commandId` 与相同请求指纹重放既有结果，与不同指纹组合时明确冲突；
- 终态和已经记录的取消意图优先，不因迟到或重复命令产生新副作用。

## 耐久与文件

生产数据库使用 `rusqlite 0.40.1` 的 `bundled` SQLite、`journal_mode=WAL`、
`synchronous=FULL`、外键检查和 5 秒 busy timeout。VUA 对外确认事务成功后，以其能承受进程崩溃和
断电为目标。WAL 模式下数据库文件及同目录 `-wal`、`-shm` 文件共同构成活动状态，不得在运行时只
复制主文件。正常关闭可以执行截断 checkpoint；备份、损坏恢复和降级演练由 B9 另行固化。

## 重启恢复

终态任务按原状态读取。重启遗留的非终态任务保留最后真实状态，并向应用契约映射
`recoveryDisposition: "inspect_required"`；运行时不得自动续跑、改成暂停或判定失败。后续恢复用例
必须先 Inspect 外部项目，再决定继续或回滚。

项目修改租约不会仅因心跳时间变旧而自动释放。Provider 中断后，租约标为需要恢复；只有携带明确
`inspection_id` 的恢复动作才能用更高 generation 接管。旧持有者的心跳和释放因 generation 不匹配
被拒绝。`project_identity` 是现存项目目录经操作系统规范化得到最终路径后计算的
`sha256:<64 位小写十六进制>` 摘要。数据库与租约值对象只保留摘要，不保存明文路径；同一路径的不同
相对写法因此得到相同身份。目录移动后会得到新身份，必须重新 Inspect，不猜测它与旧路径等价。

格式 `0.1` 已覆盖任务/事件原子性、非法跳转、revision 冲突、进度重启、持久取消、幂等重放、未知
任务、终态优先、WAL/FULL 配置、规范化路径摘要，以及 Inspect 后显式接管的 fencing 租约。
Provider 托管与关闭语义见[受监督 Provider 进程协议 v0.1](provider-process-v0.1_ZH.md)。
