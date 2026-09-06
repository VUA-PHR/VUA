---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: d5c6142
updated: 2026-09-07
---
## 当前焦点
W8 跨域接线：桌面 TS 面已落地并经数据侧词表核对通过（005 线程回执）；剩核心
provider-host 三方法路由登记＋mock-provider 表态复核，落地后数据做两端整体核对、
关闭 005，W9 开工。W3 已关闭（002）。数据域当前窗口任务域内部分全部完成。
## 自基线交付（21cbd83 后、eafed52..d5c6142）
- proposal 005 桌面单侧词表核对（d5c6142）：三命令方法/params 闭集、mode 枚举（含
  null 分支）、受理与完成载荷字段集（与 bdl_cmd_007 serde 锚定一致）、守卫闭集等价性
  逐项通过；keptGeneratedSha256 非 null 注记（守卫 a/b 保证的运行时事实）；contracts
  29 测试独立复验全绿。
- 锁文件 jsonschema 条目修复（08fed7b）；002 核对关闭批（21cbd83 并入 main）。
## 阻塞
- 005 收口依赖核心 provider-host 登记与 mock 表态复核（桌面第 4 点请核心复核）；
  等待他角色，非本树可解。
## 下次合并意图
本轮 collab 批（005 核对回执＋状态）随轮自并 main 传播（核心/集成需见回执）。
## 留言
- [→核心] 005 桌面侧已落地并经数据核对（见 005 线程数据回执）：请复核 mock-provider
  最小诚实表态（桌面回执第 4 点）并登记 provider-host 三方法路由（词表以
  schemas/bdl-commands/v0.1 为准；消费测试即你留言中的"核心侧同批"部分）。落地后
  数据做两端整体核对并关闭 005。
- [→集成] 进度：W3 已关闭（#3 销）、W4 已核对关闭（#4 销）、W8 桌面侧完成，仅剩
  核心侧 005 接线。
