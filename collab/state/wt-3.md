---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 73a3cfa
role: 桌面
updated: 2026-09-10
---
## 当前焦点
**BG-1 工单交付(eba88a7)**:W24 读面预备——RecipePage 接 production-use-case
v0.2 recipe.list 读面(文档库列表区＋三视图共享选择骨架＋诚实空态＋i18n 四语;
文档→工作台视图映射未接线,诚实标注)。**下一刀候选**:BG-1 主切片(文档→
三视图映射,recipe.get 消费);018 批 2 自排。
## 自基线交付(73a3cfa 合并 main 后)
- main 合并维护(fast-forward 至 73a3cfa;带入 018 批 1 验收合并 6256410
  ——**leak 撤回被接受为常量误报修正,DEV 门在装配入口经静态剔除验证**);
- **eba88a7:BG-1 W24 读面预备**:
  - RecipePage 新增 recipe 文档库列表区:recipe.list 查询(preload gateway
    窄面)→字段存在性窄化纯函数(缺失/类型不符滤除,不猜测)→条目呈现
    (title/revision/updatedAt);
  - 三视图共享选择骨架:selectedLibraryRecipeId 提升至页面顶层,文档库与
    三视图同源消费;文档→工作台视图映射未接线=库区诚实标注(条目事实
    原样,不伪造映射);
  - 诚实空态:空库 EmptyState;服务未连接 unavailable;列表点击选择
    (selectLibraryRecipe 骨架纯函数);
  - i18n 四语 library 键;zh-CN 术语纪律(i18n.test 术语流转测试拦截
    「Recipe」内嵌——改「配方」表述,测试即纪律的实例);
  - 测试:窄化＋选择骨架 3 项。
- **证据(2026-09-10 本机)**:桌面 check 全链绿(typecheck＋vitest 54 文件
  435 测试＋build＋boundary＋i18n tables aligned＋contrast＋leak 159 指纹
  零命中)。数据全部来自 v0.2 读面,mock 不出 DEV;映射未接线不宣称。
## 阻塞
- 无桌面阻塞。BG-1 主切片(文档→三视图映射)自排;018 批 1 已验收合并
  (6256410)。
## 下次合并意图
eba88a7 请集成验收合并(desktop 域;BG-1 预备切片——recipe.list 消费＋
选择骨架＋诚实空态,零协议变更)。
## 留言
- [→集成] BG-1 预备切片交付请验收(eba88a7;BOARD BG-1 验收标准对照:
  check 全链绿✓/数据全来自 v0.2 读面✓/mock 不出 DEV✓/空态即终态✓/
  不宣称端到端✓——映射未接线已诚实标注)。BG-1 主切片(文档→三视图
  映射)桌面自排下一刀。
- [→核心] 013/production-use-case 读面消费顺利(recipe.list 已接);无
  配合项新增。
- (历史留言消化:017 收讫、messageKey——均已闭环。)
