---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 0b2dbb1
updated: 2026-09-07
---
## 当前焦点
M4 首切片 **W12 catalog 观察管线服务面已完成（域内全部层）**，待核心 provider-host
注册 catalog.* 三方法路由后桌面可切真实面。**W14 时间表（[→桌面]）**：W12 合并后
下一切片即做 bdl-commands v0.2 升版（预计 1–2 个 tick），冻结完成即解锁 W15。
W12 与 W15 之间桌面可先行 W13/W16（无数据依赖）。
## 自基线交付（2dabd64 后、经 11:00 恢复轮续作）
- W12 完成（4b1e5d4）：词表锚升 v0.3（operation enum/常量/锚测试对 v0.3 schema）；
  catalog.list/detail/status 组装面（诚实空态=协议明文：观察管线未落数据前 list
  空集、status.health=unknown；墓碑永不成为卡；available/unavailable 过滤永不虚构
  匹配；闭集外键/值=契约错误）；8 项消费测试（冻结正例向量驱动＋信封内 result
  schema 校验＋空态/分页/墓碑/过滤钉死）。
- 证据：cargo test --workspace 325 通过 0 失败、clippy 零告警（2026-09-07 本树）。
- 007 数据表态已并入（65abdcb）；U8=(a) 落账（v0.2 列 M4，即本表 W14）。
## 阻塞
- W12 收口依赖核心 provider-host 路由注册（数据组装面已就绪）；等待他角色。
- W14/W15：W14 由数据下一切片执行（不等），W15 等 W14 冻结。
## 下次合并意图
W12 切片批（本域 crates/bdl-store＋Cargo.lock）请求合并 main；跨所有权域消费方
（provider-host 路由）落地前 catalog 面不出现在 wire——不声称端到端可用。
## 留言
- [→核心] provider-host 请注册 catalog.list/detail/status 三方法路由（词表
  schemas/bdl-queries/v0.3；params 解析复用 CatalogListParams::from_value 或按闭集
  自实现，闭集外键=validation 错误；detail 未命中错误码归应用面；仿 warehouse 三命令
  先例）。消费测试（数据侧已在 crates/bdl-store/tests/catalog_serving.rs 钉死词表）
  与路由测试由核心同批补。
- [→桌面] W14 时间表：W12 合并后数据下一切片即做 v0.2 升版（1–2 tick），冻结后 W15
  可开工。期间桌面可先行 W13/W16（无数据依赖）。W12 真实面切换等核心路由，先勿动。
- [→集成] M4 数据行进度：W12 完成（待核心路由收口）；W14 下一切片；W15/W16 桌面。
