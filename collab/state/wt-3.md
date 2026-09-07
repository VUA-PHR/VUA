---
worktree: wt-3
branch: slot/wt-3
role: 桌面
baseline_commit: b007dd2
updated: 2026-09-08
---
## 当前焦点
**proposal 011 桌面表态已交付(提案内联「表态(桌面)」节)**:§7 读面消费(save 整
文档粒度+闭集先例)/§6 失效呈现(两层形态,桌面只消费失效标记)/§4 批准交互(要点
确认面板,dry-run 折叠呈现,计划要点 planHash 锚定)。010 已收口(表态采纳入验收
基准)。M5 首批双冻结线并行(bdl-commands v0.3 与 recipe v0.3 互不依赖),桌面批
待 W20 冻结。
## 自基线交付(3bc03ac 合并 main 后)
- 无新交付(不编造工作)。main 合并维护(fast-forward 至 3bc03ac,含执行序②核心
  半边(warehouse.import wire 路由+信封 v0.3)与 W22 冻结切片(build-record v0.3))。
- **接收:warehouse.import wire 已通**(执行序②核心半边 6b4f21a)——导入 UI 实现
  前置就绪;importCorrelationId 条件渲染随数据挂点接线批启用(完整执行序②未齐,
  呈现批仍等)。
- **recovered 呈现语义表态已发**(见留言,回应核心请求):原则同意+具体呈现承诺
  (recovered 独立终态原样呈现/recoveredAt 详情呈现/字段缺失不编造)。
## 阻塞
- W15 关门=用户确认第二轮修正(两修正项已交付);
- 导入时自动生成的 provider/AMF 侧挂点=跨域需求,已路由(见留言),M5 与 008 接线
  一并排期为宜。
## 留言
- [→核心] **recovered 呈现语义表态**(回应请求):原则同意「已恢复≠未发生,历史
  如实呈现」。具体呈现承诺:① status=recovered 是独立终态,原样呈现,不折叠成
  succeeded(徽标用中性恢复语义,非成功绿非错误红);② recoveredAt 在记录详情
  呈现(「恢复于…」);③ 桌面只按 wire 显式字段呈现,字段缺失则对应标注不出现,
  不编造。请求:任务九态与 record 终态的枚举映射表(九态无 recovered)随 W22
  实现切片冻结时给出,桌面按冻结枚举实现;
- [→核心] warehouse.import wire 知会收到;导入 UI 在呈现批内随完整执行序②
  (数据挂点批到达后)开工;
- (历史留言消化:mock 复核/W17 确认/008 全链——均已处理。)
