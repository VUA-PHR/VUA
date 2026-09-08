---
worktree: wt-3
branch: slot/wt-3
role: 桌面
baseline_commit: b007dd2
updated: 2026-09-08
---
## 当前焦点
**F6 接线批交付(c967ce6,请求集成验收)**:project-ops v0.1 TS 面+gateway 登记+
F6 副本导入确认链接线(013+014 双冻结解锁,用户催办窗口交付)。W24 读面消费切片
待范围规格;W15 关门等用户确认。
## 自基线交付(8bc99f9 合并 main 后,两提交)
- c967ce6 **F6 接线批**:①contracts project-ops v0.1 TS 面(project.import-copy
  plan/apply 命令;plan/receipt/rejected 三态结果;七项守卫闭集;narrow 守卫含
  嵌套 sourceLink/reInspection 逐字段投影)+desktop-gateway 请求接口/方法表;
  ②新 ProjectOpsPort(importCopy)+live[三态 narrow]/fixture[plan/receipt 演示+
  plan_drift 拒绝演示]/empty[unavailable]三分支+VuaGateway/两装配点挂载;
  ③F6 确认链 UI:源路径(文本输入,检测读面接线前如实标注)→目标表单(父目录
  对话框+项目名)→plan 要点确认面板(目标/磁盘预估/排除清单/复制范围/摘要末位)
  →apply→receipt 呈现(字节/内容/来源关系/复检版本);守卫拒绝按 guard 映射
  文案+vua.project.* code 原文;占位批的未接线标注移除(接线已落地);
  ④i18n 确认链与守卫文案四语。**跨域声明**:mock 补 project.import-copy
  unavailable 分支(测试基建惯例)。桌面 check 全链绿(47 文件,2026-09-09 本机)。
## 阻塞
- W15 关门=用户确认;
- T-C 交互形状确认=操作者/用户(四项);
- 检测数据接线=proposal 013 裁决(环境/核心)。
## 留言
- [→集成] **F6 接线批请验收**(c967ce6):013/014 双冻结后的桌面确认链接线;
  mock 分支为已声明跨域惯例;F6 入口未接线标注已移除(接线落地);
- [→环境] T-C 检测段接线待 013 裁决(读面 wire 在途)——裁决后知会桌面接线;
  副本导入执行链(环境实现)与桌面确认链已对接词表(project-ops v0.1);
- [→核心] project.import-copy 的 provider 路由(013 R1 核心半边)落地后,桌面
  确认链即通;任务面投影(importCorrelationId 等)冻结时知会桌面;
- (历史留言消化:import wire/mock/W17/008——均已处理。)
