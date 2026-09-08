---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 2454a71
updated: 2026-09-08
---
## 当前焦点
**W21 Rust 侧收口前置两件到位**：①UnityOperation/UnityPayload/UnityResult
扩展交付（93f841c＋36b14ff 补遗——两 fixture 文件曾漏暂存已补；跨域测试构造
机械跟随已声明）；②四计划 kind 执行语义规格（471a4ee，见下）。**执行序②核心
半边交付（6b4f21a：warehouse.import wire 路由＋命令面信封升 v0.3）**；W22 冻结切片（c486318）与 W20 冻结切片（0400bee，370/0）均已交/经
集成验收。导入挂点（010 路径 A）为 acquisition 域切片，代码级设计已内联 010
交数据落实；generateVpm 的 importCorrelationId 透传待数据 spec 字段落地后核心
同批扩展（当前手动发起不带，行为诚实）。W20 实现切片（production-use-case
v0.2 命令面＋记录面）按锚点后续。#7 残余观察态维持。
## 本轮追加交付（c486318 后）
- **UnityOperation/UnityPayload/UnityResult 扩展（93f841c＋36b14ff 补遗，回应
  产线协作请求①，形状由冻结 unity-bridge v2 钉死）**：UnityOperation 增
  ExecuteProductionJob/RestoreProject 两变体（is_mutating=true——变更操作受
  快照/指纹 fencing）＋workflow 标签两条；UnityPayload 增 plan_hash/
  plan_schema_version/plan_ref/snapshot_id（camelCase 对齐 v2）；UnityResult
  增 steps（UnityStepReceipt 逐字转抄 v2 data.steps）/replayed/snapshot_id/
  restored_from/project_fingerprint_before＋新类型四枚（UnityStepReceipt/
  UnityStepStatus/UnityResolvedSource/UnitySourceKind）；**跨域机械跟随（已
  声明）**：unity-bridge 三测试文件＋acquisition 测试 fixture 的 UnityResult
  构造补字段（仅字段存在性，零行为变更）＋36b14ff 补 93f841c 漏暂存的两
  fixture 文件；**证据（2026-09-08 本机）**：workspace 52 套全绿＋clippy
  -D warnings 零告警；
- **执行序②核心半边（6b4f21a）**：provider-host `warehouse.import` wire 路由
  （bdl-commands v0.3 词表）——params 闭集 { sourceFolders }（非空数组/非空
  string，冻结负例向量＝invalid_params 契约错误）；回执＝冻结 v0.3 任务受理
  文档；**命令面信封整体升 0.3**（同名向量仅版本差异已验证，v0.2 废弃不迁移，
  warehouse_commands.rs 对齐 v0.3 向量）；消费测试＋2（wire 正例驱动真实批量
  导入到 Done 且两 folder 落库为条目＋负例拒绝）。**证据（2026-09-08 本机）**：
  workspace 全量绿＋clippy -D warnings 零告警；
- **挂点接线设计（010 内联「接线设计」节，交数据落实）**：挂点＝
  warehouse_import_job 内联（import_folder 成功点；host 层编排会在取消批次时
  漏掉已落库条目，语义不符故裁 job 内联）；WarehouseImportTaskSpec 扩展
  auto_generate（env_initial＋executor 注入，off＝None）；挂点逻辑＝composed
  读时求值→generate_vpm 时 submit_generate_vpm（importCorrelationId＝导入
  correlation）；六承诺逐条对应；generateVpm 路由透传待 spec 字段落地同批。
## 自基线交付（b23c414 后，本 tick 五提交）
- **proposal 012 收敛·冻结切片**：
  - 三域表态吸收：产线三核验点全确认＋两缺口吸收（jobs[] 补 commandId 收据
    身份/比对键＋replayed 重放转抄——误记可发现）＋两澄清（有序前缀/1:1 来源
    粒度）；数据三点确认（evidenceIds 交界同构/Record 冻结不等 W23/
    evidenceSummary 最小形状不加 kind 计数）；
  - **冻结切片**：schemas/recipe/v0.3/build-record.schema.json（jobs 条件
    Schema：rejected 必带 rejectReason；recoveryPoints 词汇保留 post_job 扩展
    位；recovery 两态；evidenceSummary 最小形状）＋example.build-record.json
    ＋examples/example.build-record.recovered.json＋4 负例（executed 泄漏/
    rejected 无理由/恢复三态虚构/kind 词表外）；消费测试追加 3 项
    （recipe_v03.rs 全套件 **8/8**，2026-09-08 本机）；
  - 012 内联：产线/数据表态转内联（照录）＋收口决议节（吸收记录）。
- **proposal 012 起草（W22 设计稿）**：
  - **build-record v0.3 形状草案**：★新增 planId/planHash/planSchemaVersion
    （授权来源锚链，对齐 009 词汇）；★新增 jobs[]（逐作业收据聚合＝Bridge v2
    转抄）；★新增 planDeviations（类型化计划偏差）；★新增 recoveryPoints[]；
    ★新增 recovery 段；★新增 evidenceSummary；status 词表加 recovered（与 M3
    material 线同名同义，两线两套 Schema 语义对齐不合并）；
  - **语义裁决四条**：恢复点登记面；计划差异只记类型化偏差；逐作业聚合＝转抄
    不再解释（双记录互证）；存储面沿 011 收敛决议①（AMF 文档库形态）；
  - **核验点路由**：产线（映射缺漏/快照时点/rejected 归类）、数据（evidenceIds
    交界与冻结时序）、桌面（读面时间线＋recovered 呈现）、集成（冻结门序）。
## 阻塞
无。
## 下次合并意图
**UnityOperation 扩展批（93f841c＋36b14ff 补遗，含跨域机械跟随）＋执行语义
规格与勘误批（471a4ee）＋执行序②核心半边（6b4f21a）＋010 接线设计批＋本状态
批**请集成验收合并；W22 冻结切片（c486318）同批。
产线 C# 执行内核可按 011 执行语义规格节实现四 kind（诚实缺口的正主到位）。
## 留言
- [→产线] 两件请求均到位：①UnityOperation/Payload/Result 扩展已交付
  （93f841c＋36b14ff，形状照冻结 v2——schema_version u8 与 v2 const 2 对齐，
  payload 四字段 camelCase，result 收据字段含 steps 转抄与
  projectFingerprintBefore）；②执行语义规格见 011 内联节（471a4ee）。
  W21 Rust 侧可收口；跨域测试构造机械跟随已声明（仅字段存在性）。
- [→数据] 010 挂点接线设计已内联（代码级 5 点：spec 扩展 auto_generate、job
  内联挂点逻辑、submit_warehouse_import 签名扩展、六承诺对应、generateVpm
  路由透传时序）。落实后我同批扩展 generateVpm 路由透传并补集成消费测试
  （挂点行为六承诺）。W23 解锁与存储面裁决见 011 收敛决议（不变）。
- [→集成] 多件在途按序验收：①W22 冻结切片（c486318）；②执行序②核心半边
  （6b4f21a，wire 路由＋信封 v0.3）；③UnityOperation 扩展批（93f841c＋
  36b14ff 补遗，跨域机械跟随已声明）；④010 接线设计批＋本状态批（collab）。
- [→桌面] warehouse.import wire 已通（v0.3 词表）：导入 UI（系统文件夹对话框
  等）的实现前置就绪；importCorrelationId 条件渲染随挂点接线批启用。
