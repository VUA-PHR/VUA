---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 867ccda
role: 桌面
updated: 2026-09-12
---
## 当前焦点
**#22 桌面消费批已交付（867ccda）——020 集成冻结（0866908 进 main）
解锁后本批按提案「对各方的后续·桌面」节开工，importCopy 消费改任务化
＋终态 result 窄化＋fixture 自决对齐，待集成验收合并**。
- **实现形状（proposal 020 桌面消费）**：
  - project-ops-port：live importCopy 消费任务化受理回执
    （narrowTaskAccepted，setNote 先例）→ task.get 终态等待——受理后
    立即首取权威快照（覆盖快任务内联完成，v0.2 先例），未终态则订阅
    事件通道、task.completed（本任务）后重取权威快照（契约「revision
    与事件」：事件是事实通知，快照才是权威；020：两通道同源同值）；
  - narrowPlan/narrowReceipt/narrowRejected 三函数原样复用，数据源换为
    Done payload（project-ops 词表自描述 schemaVersion/operation）内的
    result 文档——kind 分派与旧同步形状一致；
  - 诚实映射钉死：failed/cancelled/超时/断连/受理或快照形态不齐/result
    缺席或字段收不齐＝一律 unavailable，不猜测、不伪造结果文档；任务
    真实状态由任务中心呈现；等待上界 120s 仅防御事件丢失/断连挂起
    （正常终态事件驱动毫秒级到达），测试可经 options.taskWaitMs 注入；
  - 调用方面（ProjectCompatPage/project-compat-model）签名与 outcome
    形状零改动——组件仅注释对齐；等待期间既有 busy 禁用覆盖。
- **fixture 自决（020 授权，setNote「恒诚实不可用」先例）**：importCopy
  fixture 改恒诚实不可用。理由：旧 014 同步结果文档形状与 live 任务化
  消费不同构，正是 #22 暴露的 live/fixture 形状分歧温床；任务化下
  fixture 续演要么伪造任务引擎（受理 taskId 而任务中心无任务）要么
  伪造复制结果——均违诚实纪律；DEV 走查仍覆盖 B9 不可用反馈路径。
- **测试**：新增 project-ops-port.test.ts 13 例（fake GatewayClient）：
  plan/receipt/rejected 终态 result 窄化、事件驱动重取、failed/cancelled
  诚实 unavailable、受理回执不可信（零 task.get 佐证）、result 缺席/
  字段不齐、等待上界到时、应用拒绝、首取断连、setNote 受理面不变。
- **验证证据（本机真实退出码）**：桌面 check 全链 EXIT=0（typecheck
  ＋vitest **62 文件/499 测试**＝486 基线＋13 新增＋build＋boundary
  ＋i18n＋contrast＋check:leak 159 指纹生产构建零命中）；contracts
  check 复跑 **38/38**（冻结面零改动）。#22 裁决「契约消费类批次加查
  live/fixture value 形状一致性」的兑现：本批消除 fixture/live 双形状
  （fixture 恒不可用），live 消费键面与 provider_host.rs wire 面逐键
  对齐（受理回执 taskId/correlationId、Done payload 三键、快照必需键）。
  不宣称端到端——真机走查归 W25 窗口（用户延期维持）。
- 基线追平：合并 main（29b6f03，fast-forward 自 3ee727c）清零后交付。

## 待办队列
- **#22 桌面消费批验收（待集成）**：867ccda 请验收合并；合并后 #22 链
  全环闭合（核心填充 0866908＋桌面消费本批）；
- 批 D（019 视觉与交付）：未签发，不开工（#21 行明示）；
- W25 真机窗口：用户延期维持（O-2）；IMP-2 下载主机域真机验证程序与
  IMP-5 真机半边同候此窗口；#22 消费链 live 走查亦候此窗口；
- workshop F3 段：等壳侧 Unity 编辑器配置面工单（U10 待用户裁决，
  跳过）。
## 阻塞
- 无桌面阻塞。备忘维持：generateVpm 执行器诚实 unavailable（依赖同一
  Unity 环境配置面）。
## 下次合并意图
867ccda＝#22 桌面消费批（apps/desktop 四文件：端口任务化＋fixture
自决＋新测试 13 例＋注释对齐；实质批请全量复验：桌面 check 链＋
contracts check）＋本状态批（collab-only）。请集成验收合并（--no-ff）。
## 留言
- [→集成] **#22 桌面消费批交付**（867ccda）：020 冻结（0866908）解锁
  后按提案桌面节兑现。消费形状＝端口内任务等待＋终态快照 result 窄化
  （对调用方保持 ProjectOpsOutcome 形状，UI 零改动）；fixture 自决＝
  恒诚实不可用（理由见当前焦点节）。候选「契约消费类批次」新验清单项
  的首批适用：live/fixture 形状一致性已在本批闭合（双形状归一）。
- [→核心] 收讫 020 验收冻结与实现期发现两则（demo 取消诚实写 None＋
  job.execute 恢复观察投影按态过滤）——消费面与本批 narrow 语义一致
  （成功终态才取 result；失败走 error 由任务中心呈现）；result 内部
  形状零承诺与桌面按操作词表窄化的分工照提案执行无偏差。
- 留言消化：wt-main「#22 冻结达成——消费批解锁」＝本批开工依据；
  B5②/D-6/P2 三条验收合并回执与 wt-2「result 回流批已交付（消费开工
  锚＝本批验收入）」等各条＝归档/回执型，无新动作项；wt-6 B5② 回执
  知悉＝纯归档。无新指向桌面的阻塞。
