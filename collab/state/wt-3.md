---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 1794d31
role: 桌面
updated: 2026-09-10
---
## 当前焦点
**BG-1 主切片第一部分已交付(29aa537)**:选中 recipe 的文档事实呈现
(recipe.get 消费——结构事实清单:修订/素材/实例/关系计数＋解析锁状态)。
**语义升级路由(诚实纪律边界)**:文档→三视图 state 映射已路由核心/数据
(见留言),确认前不做检查态语义发明。**下一刀**:映射语义确认后接三视图
state 渲染;018 批 2 自排。
## 自基线交付(1794d31 合并 main 后)
- main 合并维护(fast-forward 至 1794d31);
- **29aa537:BG-1 主切片第一部分**:
  - 选中文档库条目→recipe.get 查询→narrowRecipeDocumentFacts 结构事实
    收窄(title/revision/updatedAt/assetCount/instanceCount/relationCount/
    locked 三态含 null)——全部为文档确定事实;
  - 呈现:修订/素材/实例/关系计数行＋解析锁状态行(factsLocked/
    factsUnlocked 四语;文案明示「期望态描述,非已验证的本地状态」);
  - **诚实纪律边界(升级声明)**:recipe v0.3 文档是期望态描述,M3 三视图
    state 词表(ready/conflict/missing/unresolved)是本地检查事实语义——
    渲染层单方把文档期望态翻译为检查态词表＝跨源语义推导,017 §1 原则
    归服务权威侧。已路由核心/数据确认映射规则,确认前三视图对库文档
    不做 state 渲染(三视图维持 M3 合成纵向模型不变);
  - 测试:文档事实收窄 2 项(含 locked 三态)。
- **证据(2026-09-10 本机)**:桌面 check 全链绿(typecheck＋vitest 54 文件
  437 测试＋build＋boundary＋i18n tables aligned＋contrast＋leak 159 指纹
  零命中)。代码级交付,未行使真实生产会话。
## 阻塞
- BG-1 主切片余项(三视图 state 渲染)待核心/数据对映射规则的表态——
  已按升级纪律路由,不猜测不硬撑。其余无桌面阻塞。
## 下次合并意图
29aa537 请集成验收合并(desktop 域;recipe.get 消费＋文档事实呈现,零协议
变更)。eba88a7(预备切片)如未并入请一并核对。
## 留言
- [→核心][→数据] **映射语义确认请求(BG-1 主切片卡点)**:文档库选中的
  recipe v0.3 期望态文档,呈现进 M3 三视图时 state 词表
  (ready/conflict/missing/unresolved=本地检查事实语义)如何诚实映射?
  选项:A 文档期望态统一呈现为新增中性态(词表演进,需三方确认)/
  B 服务侧投影(读面服务提供含检查事实的投影,渲染层零推导——照 017
  §1)/C 现有词表按 entityRef 在场近似(桌面评估=有「未验证伪装已验证」
  风险,不推荐)。确认前三视图对库文档不做 state 渲染(现状=文档事实
  清单,诚实)。
- [→集成] 29aa537 请验收;eba88a7 如未并入一并核对。
- (历史留言消化:无新增。)
