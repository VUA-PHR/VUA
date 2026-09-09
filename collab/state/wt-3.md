---
worktree: wt-3
branch: slot/wt-3
baseline_commit: d4732f7
role: 桌面
updated: 2026-09-10
---
## 当前焦点
**批 B-3 对接设计稿已出（015 §12,1c8ca5b）**:页内确认层 IPC 面（Main→渲染层
确认请求事件＋渲染层 i18n 弹窗＋respond 回发;无超时=不答不执行）——待核心
表态（通道形状）＋集成验收口径,实现随表态后下一刀。**批 B 其余项均已交付**:
批 B-1 能力翻转（875c85a,已合并?待确认）＋批 B-2 列表与采纳（f5bb1f4）＋
列表 wire（核心 389912e 待验收）。
## 自基线交付(d4732f7 合并 main 后)
- main 合并维护(fast-forward 至 d4732f7;带入核心 downloads.listCompleted
  接线批等);
- **1c8ca5b:015 §12 对接设计稿(纯文档,批 B-3)**:
  - 通道=VuaDesktopApiV1 增 navigationConfirm 段(respond＋请求事件;
    NavConfirmReasonV1 二值;请求载荷携带完整 URL——A-1 要素);
  - Main 侧 confirmNavigation 重写为「广播＋pending 登记簿」:无超时
    (用户不答=不执行,阻断式确认的诚实形态;逐次确认无堆积),原生 dialog
    移除(单一事实源),respond 校验(渲染层不能伪造未发出的确认;双 respond
    只首次生效);
  - 渲染层 NavigationConfirmOverlay(App 全局挂载,队列逐条处理)＋四语文案;
  - 语义不变锚(验收对照):A-1 确认在前/A-2 逐次无记忆/A-4 清单恰四项/
    U9(2) 伪协议不经确认层/U9(4) 手势由确认承载/A-6 下载流不受影响;
  - 安全自评:confirmId 由 Main 生成(渲染层只能回应已发出的确认,不能伪造
    导航放行);全部策略逻辑留在 Main 策略面(security.ts 零变更,仅确认 UI
    载体替换);
  - 测试设计:PendingConfirmRegistry 纯类＋overlay 队列状态机纯函数。
- 消化:核心 downloads.listCompleted 接线（389912e 待集成验收——批 B 列表
  数据源正式就绪,批 B-2 的列表消费与此接线互为两翼）;数据 TS 镜像校对
  无出入＋冻结节奏告知。
## 阻塞
- 批 B-3 实现待核心表态（通道形状——其留言③明示「等对接设计出稿后表态,
  不猜测先行」,设计稿已出）。无其它桌面阻塞。
## 下次合并意图
1c8ca5b（collab-only 提案批）随轮带入免测。批 A/批 B-1/批 B-2 实质批
（61f1024/875c85a/f5bb1f4）随集成节奏验收——分叉表显示均已并入 main
（领先 0）,如未并入请集成核对。
## 留言
- [→核心] **批 B-3 对接设计稿已出（015 §12）**:navigationConfirm IPC 段
  ＋事件载荷形状见 §12.1,Main 侧 pending 登记簿语义见 §12.2——请表态
  （通道形状）;表态后桌面即实现（批 B-3）。
- [→集成] ①批 B-3 设计稿请一并核（§12.4 锚即验收口径）;②上批 f5bb1f4
  待验收（downloads.listCompleted TS 面＋列表/采纳 UI＋router 清理）。
- [→数据] TS 镜像校对无出入已知悉;列表消费已上线（f5bb1f4）,与贵方
  389912e 接线互为两翼（集成验收后端到端链路闭合——届时是否由集成安排
  一次真机确认会话,归集成/用户裁量,桌面不自行宣称端到端）。
- (历史留言消化:批 A 验收＋清单照准、wt-5 节奏告知——均已闭环。)
