---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 0c1f76c
updated: 2026-09-08
---
## 当前焦点
**bdl-commands v0.3 已冻结·集成验收合并**（数据主导 49586f3，复跑 362/0＋clippy
-D warnings 零告警；REGISTRY/双语协议已刷）——010 执行序①完成，②核心
warehouse.import wire/挂点实现、③桌面呈现解锁。**011 已收敛**（三域表态齐，
W20 冻结切片解锁待核心交付）；009 v2 草案已验收合并（互审点 4/5 等核心）。
## 自基线交付（a5121de..ef9854b，本 tick）
- **验收合并数据 bdl-commands v0.3 冻结切片**（49586f3 经 ef9854b，冲突融合：
  011 数据表态以其正式内联版为准，我方照录版撤下并注记）：warehouse.import
  批量导入（任务化，folder 批，010/W19 硬前置）＋generateVpm 可选
  importCorrelationId（010 承诺 6 wire 承载：仅导入编排携带，手动发起绝不）＋
  既有四命令照录（向量字节一致）＋术语裁定落实（「生成 VPM 包副本」）＋导入
  守卫与错误码闭集（invalidSource/importIoFailed/copySizeMismatch）＋6 项消费
  测试＋双语协议 v0.3＋REGISTRY（v0.2 转已取代）；
  验收证据（2026-09-08 本机）：抽查（importCorrelationId 可选冻结/词表五命令
  闭集/REGISTRY 行/术语）＋**cargo workspace 362 通过 0 失败**（净增 6）＋
  clippy --all-targets -D warnings 零告警；
- 011 数据表态转内联由数据本批自行完成（与我上轮照录冲突，融合采用数据正式
  版——同源无实质分歧）。
## 阻塞
无。
## 下次合并意图
核心 W20 冻结切片批（交集成验收）＋009 互审点 4/5 意见批；W23 数据批（011 收敛
即开工）；W18/W19 桌面呈现批；产线 v2 冻结批（互审收敛后）；#7 残余样本（再现
即带全量日志）。
## 留言
- [→核心] **v0.3 已冻结验收合并——执行序②解锁**：warehouse.import wire/任务面
  ＋挂点实现按 010 设计与六条硬承诺开工；v0.3 词表五命令闭集与 importCorrelationId
  可选语义以 schemas/bdl-commands/v0.3/ 为准；W20 冻结切片（011 已收敛）并行
  推进，交集成验收；
- [→数据] **v0.3 冻结验收合并（复跑确认你方声明）**；W23 开工条件达成（011 收敛
  ＋§5 定稿），按你方形状意向领取；
- [→桌面] v0.3 冻结含 generateVpm 的 importCorrelationId 词表字段——你的条件
  渲染依赖已定；呈现批（③）待核心执行序②落地后随批；
- [→产线] 互审点 4/5 待核心意见（rejected 收据语义你已自答；恢复乐观锁随 W22
  草案）；v2 冻结批届时交集成验收；
- [→操作者→用户] W25 真机窗口预约维持（等 W21 契约/实现就绪前确认即可）；
- [需用户] U5 维持暂缓（VUA-2/VUA-3 目录清理）。
