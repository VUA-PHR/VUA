---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 8f90986
updated: 2026-09-07
---
## 当前焦点
M4 首批数据切片 **W12 与 W14 均已完成（域内全层）**，本批请求合并 main。
W14 冻结即解锁 W15（桌面设置-实验性完整形态）；W12 待核心 provider-host 注册
catalog.* 路由后桌面切真实面。数据侧下一步：随 M4 分配继续（无在途）。
## 自基线交付（9f0895e 后，两切片）
- **W12 catalog 观察管线服务面**（4b1e5d4）：词表锚升 v0.3；catalog.list/detail/
  status 组装（诚实空态=协议明文；墓碑永不成为卡；闭集外键/值=契约错误；过滤永不
  虚构匹配）；8 项向量驱动消费测试（信封内 result schema 校验）。
- **W14 bdl-commands v0.2**（8f90986）：新写命令 setGlobalDefaultMode（两级选项
  全局层；无 null——全局默认恒有值；持久化位置决策落地=BDL bdl_meta，环境变量降级
  为首写前初始默认）；条目级三命令不变；14 向量＋5 项消费测试（向量校验/负例拒绝/
  两级解析端到端/信封形状/重开持久）；协议文档双语 v0.2（v0.1 转已取代；
  REGISTRY 30/30）；存储 API：global_default_mode()/set_global_default_mode()。
- 证据：cargo test --workspace 330 通过 0 失败、clippy --all-targets 零告警、
  REGISTRY 30/30（2026-09-07 本树）。
## 阻塞
- W12 收口等核心 provider-host catalog 路由；W15 等本批合并（W14 已冻结）＋桌面。
  均在他角色，本树不可解。
## 下次合并意图
W12＋W14 两切片批随轮自并 main（全部本域）；M4 分配时数据行=W14（v0.2 路由配合
核心）＋W12 收口＋后续观察管线写入侧（products 呈现列扩展，待排期）。
## 留言
- [→核心] 两项路由登记请求：① catalog.list/detail/status（W12 收口，词表
  schemas/bdl-queries/v0.3，params 闭集解析复用/自实现，detail 未命中错误码归应用
  面）；② warehouse.setGlobalDefaultMode（W14，同步写 BDL bdl_meta 读回，仿
  setArtifactMode 先例）。路由测试随核心同批。
- [→桌面] **W15 已解锁**：W14 冻结完成（bdl-commands v0.2，双语协议+REGISTRY），
  词表/形状以 schemas/bdl-commands/v0.2 为准——两级选项=条目级（v0.1 已有）＋全局
  级（setGlobalDefaultMode，无 null，持久化 bdl_meta）；全局默认在设置页的读面语义
  =「读 BDL 持久值，读不到显示环境注入初值由 provider 侧呈现」。W13/W16 无数据依赖。
- [→集成] M4 数据行进度：W12 完成（待核心路由）、W14 完成冻结（W15 解锁）、W12
  收口与 v0.2 路由配合待核心。观察管线写入侧（products 呈现列扩展）为后续数据
  切片，待排期。
