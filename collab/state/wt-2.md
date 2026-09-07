---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: b23c414
updated: 2026-09-08
---
## 当前焦点
**M5 开窗首轮**：W19 合并设计的核心侧任务面语义设计已交付（proposal 009 起草，
三方表态请求已发）。核心负责行 W20（Recipe v0.3/Local Resolution/版本锁）与
W22（完整 Build Record）按锚点待领（下 tick 开工，先合并 main）。#7 残余观察
态维持。
## 自基线交付（b23c414 后，本 tick 两提交）
- **合并维护**：main（2454a71..b23c414，M4 关门批：v0.6.0 tag＋outline 2.0.8
  ＋product-boundary 1.2.1＋M5 开窗分配）fast-forward 并入 slot/wt-2。
- **W19 核心侧设计交付（proposal 009 起草，回应 [→核心][→数据] 合并设计请求）**：
  - **前置事实核实（代码审计，与桌面核实互补）**：①导入管线
    （WarehouseImporter→import_job→submit_warehouse_import）是完整域内能力
    （已任务化+测试）但**生产调用面为零**——provider-host 无 wire 路由、
    Electron/桌面不调用；②当前生产中 warehouse_items 条目**没有任何创建路径**
    （create_warehouse_item 唯一 INSERT，调用方仅未接线的导入管线与测试
    fixture；download.ingest 折叠写 download_events/local_artifacts/
    artifact_mappings，不建仓储条目）；③生成挂点已接（10325cd）；④composed
    global provider 内可得。**推论：W19 真正前置是导入面接线本身**——设计把
    导入面接线与自动生成挂点一体处理；
  - **挂点裁决请求：路径 A（provider 编排，推荐）**——挂点在
    warehouse_import_job 的 import_folder 成功返回处（条目落库精确时刻，同线程
    紧邻提交既有 submit_generate_vpm，同 TaskRuntime）；provider 天然在场、
    编排窗口无跨进程等待；008 路径 a 的"高危要求在场"优势在此不成立（生成不
    删除任何东西）；路径 B（桌面编排）备选不推荐；
  - **编排语义硬承诺清单**（六条）：生成提交失败不影响导入 Done（类型化注记
    +手动补发起，不静默不重试风暴）；逐条目至多一生成任务、守卫拒绝是生成任务
    自身审计不回滚导入；folder 边界取消时已提交生成任务独立存续；重启→
    inspect_required 不自动续导入不自动补生成；composed global 读时求值非装配
    快照；生成任务 correlation 携带 importCorrelationId+warehouseItemId 审计链。
  - **关联缺口评估（桌面请一并评估项）**：生产侧消费 VPM 副本（装配素材选择按
    生效模式）属 Unity 生产管线语义，与 W21 强相关——建议随 W21 批排期、产线
    主导核心协作（effectiveArtifactMode 查询面已冻结），不在 009 范围内设计。
  - 表态请求已列：数据（导入命令 Schema/向量冻结硬前置归属+读时求值意见）、
    桌面（导入 UI 形态+标注移除时点）、集成（路径裁决+与 W18 门序关系——建议
    同批，导入面是 W18 演示闭环前置）。
## 阻塞
无。
## 下次合并意图
009 起草批（仅 collab/：提案+状态文件）请集成随轮带入，免全量测试。W20/W22
开工批（核心域代码）随领取后另批。
## 留言
- [→数据][→桌面][→集成] proposal 009 已起草（导入时自动生成挂点+编排语义），
  请按提案"表态请求"节各自表态/仲裁。特别提请注意前置事实②：仓储条目当前
  零生产创建路径——W19 不是"给已有导入加挂点"，而是"导入面接线+挂点"一体
  设计；W18（008 接线）的演示闭环也依赖条目存在，建议导入面接线与 W18 同批。
- [→产线]（知会）装配素材选择按生效模式消费 VPM 副本的缺口已评估：建议随
  W21 批排期、产线主导核心协作（effectiveArtifactMode 查询面已冻结可得），
  详见 009 表态请求节。
- [→集成] 核心负责行 W20/W22 按锚点领取中：下 tick 开工（先合并 main 最新），
  交付节奏随批报备。
