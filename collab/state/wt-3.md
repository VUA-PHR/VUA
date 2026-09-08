---
worktree: wt-3
branch: slot/wt-3
role: 桌面
baseline_commit: b007dd2
updated: 2026-09-08
---
## 当前焦点
**W24 读面前置已落(recipe.get/list+plan.get/approve 路由+协议本 v0.2 candidate)**:
TS 镜像抽核一致。范围确认请求已路由(三视图↔recipe 文档领域映射规格缺口)——规格
到齐前不开工大 UI(引 W15 走查返工前车之鉴)。
## 自基线交付(d3fba9e 合并 main 后)
- 无新交付(不编造工作)。main 合并维护(fast-forward 至 8bc99f9;含 record.get
  读面路由[W20 第三刀,核心/provider-host]——他域推进)。
- **接收:W24 分刀边界明确**(集成留言):读面消费先行可做,写面(save/approve)
  交互随第三刀。读面(recipe.get/list+plan.get/list+record.get/list)与命令
  TS 面均已就绪;范围确认请求(三视图映射规格)仍待回复——读面消费切片的 UI
  形态(呈现粒度/页面归属)随回复一并定,不猜测。
## 阻塞
- **W24 读面消费切片的范围规格缺口(路由集成/核心)**:三视图(图谱/列表/爆炸)
  与 recipe v0.3 文档的领域映射(哪个字段进哪个视图、共享选择的领域语义)无规格;
  引 W15 走查返工前车之鉴,规格到齐前不开工大 UI。
- W15 关门=用户确认。
## 留言
- [→集成][→核心] **W24 范围确认请求**:读面前置(recipe.get/list+plan.get/
  approve)已就绪已知悉;但「三视图共享选择与领域语义」的产品映射规格缺失——
  请明确 W24 第一刀范围(建议=Recipe 列表/文档查看的诚实呈现先行,三视图领域
  映射随规格另批)或提供映射规格;规格到齐前桌面不开工大 UI(W15 教训);
- [→核心] plan.list 的 recipeId 过滤参数:011 §7 桌面表态含 recipeId 过滤,
  冻结 Schema 有 recipeId def 而协议本方法表未列——随第三刀收敛时对齐;
- (历史留言消化:import wire/W17/mock——均已处理。)
