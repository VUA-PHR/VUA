---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 5c39ed5
updated: 2026-09-08
---
## 当前焦点
**proposal 012（W22 Record 设计稿）产线互审已交付：三核验点全部确认＋两缺口
建议＋两澄清**（表态全文见本文件「012 互审表态」节，核心入 main 后转 012 内联）。
009 互审点状态：1/2/3 关闭、4 关闭（012 §4.3 已按产线语义收口）、**5 关闭**
（012 §3.1 恢复点登记面兑现）。v2 冻结剩最后一件：核心对 planRef job 目录
文件形态建议的确认——确认即冻结 v2 并开工 C# 侧。W25 真机窗口预约维持。
承担 #7 瞬败样本观察义务（无瞬败不空跑）。
## 自基线交付
- **012 互审表态**（2026-09-08，详见下方专节；核心从 slot/wt-2 分支交付的
  设计稿，产线直接对分支 ref 互审，不等待集成带入）：
  - 核验点 1（jobs[] 映射）：**基本覆盖＋两缺口建议**——①jobs[] 补
    `commandId`（聚合源收据身份：审计链回溯锚＋双记录互证的比对键）；②补
    `replayed` 转抄（v2 幂等重放标记——万一聚合把重放收据记成首跑，审计
    可发现）；两澄清：jobs[] 只含实际产生收据的有序前缀（fail-fast 中断时
    计划作业数>Record jobs 数，中断事实由 status 承载）；job↔来源 1:1 假设
    声明（v2 steps[] 逐步骤 resolvedSource 已可承载未来多来源，Record 聚合
    粒度届时升版）。
  - 核验点 2（phase 词汇）：**匹配**——pre_job＝v2 实跑收据 snapshotId 时点
    一致；post_job:<jobId> **M5 不需要**（恢复粒度＝整作业序列回退，部分回退
    无消费方且快照成本高），确认 012「需要才拍不强制」立场，词汇保留供 M6+
    扩展；v0.2 inputs.snapshotId 移入 recoveryPoints[] 是合理演进。
  - 核验点 3（rejected 归类）：**确认**——准入拒绝≠执行偏差（与互审点 4
    同源语义）；建议补一句 rejectReason 来源映射（转抄收据 diagnostics 的
    error code 保持机器可比，message 人类读）。
  - **互审点 5 关闭**：012 §3.1（产线分配/Record 登记/restoredFrom 引用/
    pre_job 单点最小实现）与 v2 快照机制完全一致。
- 本轮合并 main（5c39ed5，bdl-commands v0.3 冻结验收批＋数据 W23 批）追平；
  合并后 cargo test --workspace **362 通过 0 失败**＋clippy --all-targets
  零告警（2026-09-08 本机）。
- v2 草案批已集成验收合并（复跑确认）；011 §4 表态批已入 main。
- W1（I-1 真 Unity 矩阵）16/16 已验收合并（M3 关门）；amf-unity 1.0.1 批已合并。
## 阻塞
- v2 冻结剩一件：核心对 planRef job 目录文件形态建议的确认（互审点 1/2/3/4/5
  均已关闭）；确认即冻结 v2（BOARD 契约表升版）并开工 C# 侧实现。
- W25 等真机窗口与合法素材环境变量确认（预约已转操作者）。
## 下次合并意图
本批（012 互审表态＋状态，仅 collab/）请集成随轮带入，免全量测试。
## 012 互审表态（产线，2026-09-08——核心转 012 内联时照录）

**三核验点全部确认；两缺口建议＋两澄清**（对照 `schemas/unity-bridge/v2/`
草案〔已验收合并〕逐字段审查）。

**核验点 1——jobs[] 字段映射：基本覆盖，两缺口建议。**
覆盖确认：planHash 回显/dryRun/status/resolvedSourceUsed/changedPaths/
diagnostics/rejectReason 均有 v2 收据对应物，转抄关系成立。缺口：
1. **jobs[] 补 `commandId`**（聚合源收据身份）——审计链「计划→命令→收据→
   Record」的回溯锚；「转抄而非再解释」的双记录互证需要它能与收据原件比对；
   rejected 收据同样有 commandId，建议必填。
2. **jobs[] 补 `replayed` 转抄**——v2 收据的幂等重放标记。Record 聚合时如实
   携带：万一聚合逻辑把重放收据记成首跑，审计可发现（诚实纪律的廉价保险）。

两澄清（建议 012 正文写明）：
- **jobs[] 只含实际产生收据的作业（有序前缀）**——作业序列 fail-fast 中断时，
  计划作业数>Record jobs 数，中断事实由 status=failed/recovered 承载，不为
  未执行作业造假条目。
- **job↔素材来源 1:1 假设**——`resolvedSourceUsed` 是作业级单值，隐含一个
  作业至多消费一个素材来源（M5 计划语义如此）；v2 steps[] 的逐步骤
  resolvedSource 已可承载未来单作业多来源场景，Record 聚合粒度届时升版。

**核验点 2——recoveryPoints phase 词汇：与产线快照时点匹配。**
- `pre_job`＝v2 实跑收据的 `snapshotId`（第一作业变更前拍摄）——时点一致，
  同一快照在收据与 Record 的登记面各司其职（收据＝本次命令证据，Record＝
  历史登记）。
- `post_job:<jobId>`：**M5 不需要**。恢复的用户语义是「撤销这次生产」（整作业
  序列回退）；逐作业后部分回退无消费方（桌面 W24 无此 UI，批准是整计划粒度），
  且项目快照成本高。确认 012「需要才拍，不强制」立场；词汇保留枚举形态供
  M6+ 按需扩展，不预埋拍摄。
- 顺带确认：v0.2 `inputs.snapshotId?` 移入 `recoveryPoints[]` 是合理演进
  （快照身份集中到登记面，inputs 保持输入锚链纯度）。

**核验点 3——rejected 归类：确认。**
rejected 作业不进 planDeviations，正确——准入拒绝发生在授权闸，不是「计划
声明 vs 实际执行」的偏差（「执行」从未发生；与 009 互审点 4 同源语义：rejected
无快照无指纹移动）。一条补充建议：`rejectReason` 的来源映射请写明——转抄
收据 diagnostics 中 severity=error 的 **code**（机器可比）＋message（人类读），
不自由成文。

**互审点 5 就此关闭**：012 §3.1 恢复点登记面（snapshotId 产线机制分配、Record
顶层 recoveryPoints[] 登记、恢复按 restoredFrom 引用、最小实现 pre_job 单点）
与 v2 快照机制完全一致，无修改意见。

**009 互审点 4 关闭**：012 §4.3 已按产线语义（rejected 收据无快照无指纹移动）
收口引用，产线确认无分歧。

**v2 冻结条件盘点**：互审点 1/2/3（011 §4 表态关闭）、4（本轮确认关闭）、
5（本轮关闭）——**唯余核心对 planRef 形态建议的确认**（计划文件 provider 写
job 目录＋Bridge 本地哈希校验）。确认即冻结 v2（BOARD 契约表升版登记）并开工
C# 侧（BridgeCommandProcessor 分发扩展＋execute_production_job/restore_project
Editor 实现）。
## 留言
- [→核心] **012 产线互审已交付**（表态全文见本树状态文件「012 互审表态」节，
  入 main 后转 012 内联）：三核验点全部确认；jobs[] 请补 commandId＋replayed
  两字段（转抄＋审计锚）与两澄清（有序前缀/1:1 假设）；rejectReason 来源映射
  建议写明。**v2 冻结剩你确认 planRef 形态建议一件**（job 目录文件＋本地哈希
  校验）——确认即冻结 v2 开工 C# 侧。
- [→集成] 本批（012 互审表态＋状态，仅 collab/）随轮带入。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009 登记与 W25
  预约转操作者、011 §4 表态与 v2 草案验收合并——均已闭环。）
