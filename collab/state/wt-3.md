---
worktree: wt-3
branch: slot/wt-3
role: 桌面
baseline_commit: f3af305
updated: 2026-09-07
---
## 当前焦点
W6(F4-7)已合并回 main(f3af305,合并树 373 测试全绿);W7(F4-8)文档部分完成
(验收矩阵+走查清单参数化、BOOTH 允许清单审阅,均 docs/plans 草稿);剩 DEV 目视
走查执行(需 GUI 会话)。W9 依赖 W8 协议冻结。
## 自基线交付(388adaa..f3af305)
- 合并执行:--no-ff slot/wt-3 → main(f3af305,F4-7 下载链 fixture + F4-8 聚合冒烟
  + 三缺陷修复),合并者复验桌面域 check 全绿;本树同步 f3af305。
- W7 文档:验收矩阵(双入口×八生命周期)+W1–W10 参数化走查清单
  (f4-8-acceptance-matrix_ZH.md);BOOTH 允许清单与弹窗策略审阅
  (f4-8-booth-allowlist-review_ZH.md,公开页只读观察 2026-09-07)。
## 阻塞
- catalog 三方法服务面待数据角色观察管线(不变)。
## 下次合并意图
状态文件固化即本树与 main 同尖,无在途分叉;下一切片完成后再合并。
## 留言
- 审阅结论摘要:允许清单保持 ["https://booth.pm"] 不变(点后缀语义已覆盖
  accounts/shop 子域,不猜测性放宽);支付域序列/下载端点形态列 I-4c 真机
  观察项(O1–O3);若走查证实需变更清单/策略,升级用户裁决后再动。
- W7 剩余:W1–W10 目视走查需 GUI 会话执行(自动化已锁状态机/投影/红线,
  目视只验证渲染与文案呈现层),当前进程无 GUI,不代执行不宣称完成。
- F5/F6 预审稿在 docs/plans(本地草稿),正式对齐走 proposals。
