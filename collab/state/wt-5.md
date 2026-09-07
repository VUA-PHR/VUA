---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: eadbfb1
updated: 2026-09-08
---
## 当前焦点
**bdl-commands v0.3 冻结切片已交付（49586f3，W19 硬前置，数据主导）**——010 收口
裁定的 M5 首批先行冻结落地：warehouse.import 批量导入命令＋generateVpm 可选
importCorrelationId 审计链字段＋既有四命令升版照录＋术语裁定落实。请求集成验收；
验收后核心接 wire/挂点实现（010 执行序②），桌面呈现（③）。**proposal 011 表态
已转提案内联**（三处：§5 存储面不进 BDL／§7 粒度与桌面收敛决议一致／W23 形状
意向）。等 011 收敛（产线互审＋仲裁）后领 W23。
## 自基线交付（6c4d989 后，十 tick）
- **bdl-commands v0.3 冻结切片**（49586f3；schemas/bdl-commands/v0.3＋双语协议
  ＋REGISTRY＋acquisition 消费测试，全在所有权域）：
  - warehouse.import（任务化）：params { sourceFolders }（Kernel 已解析绝对
    路径，minItems 1；一 folder＝一素材包；一命令＝一批导入任务）；仓储根是
    provider 环境配置绝不入请求；受理与任务面命令同构（taskId＋correlationId）；
    Done 载荷（逐 folder 报告＋条目身份）走应用契约任务面；
  - generateVpm 可选 importCorrelationId（010 承诺 6 的 wire 承载）：仅导入
    编排发起时携带，手动发起绝不携带；受理可选回显；
  - 既有四命令升版照录（v0.2 向量除版本外字节一致，v0.1→v0.2 先例延续）；
    术语裁定落实（「VPM 副本」→「生成 VPM 包副本」，v0.2 冻结文本不追溯）；
  - 导入守卫与错误码：invalidSource／importIoFailed／copySizeMismatch
    （recoverable=true，携 folder＋reason）；
  - 消费测试 import_contract_v03.rs 6 项（向量/Schema 互证、负例拒绝、五操作
    闭集钉死、importCorrelationId 可选冻结、import 向量驱动真实批导入＋受理
    反校验＋store 条目效果断言）；
  - 文档：双语协议 v0.3；REGISTRY（v0.2 转已取代、v0.3 冻结）。
  - 证据（2026-09-08 本机）：cargo test --workspace 362 通过 0 失败（净增 6）＋
    clippy --all-targets -D warnings 零告警。
- **proposal 011 表态转内联**（b46c3a9）：§5 存储面（四产物不进 BDL）／§7 粒度
  与读面闭集（与桌面收敛决议一致）／W23 交界＋条目模型意向。
- 010 冲突融合（0b19af5）：集成照录版＋correlation 钉死增量补注。
- 本批实质产出：proposal 011 三处表态＋W23 形状意向（见留言，collab-only）。
## 阻塞
- 无。
## 下次合并意图
本状态批（仅 collab/）随轮并入 main（免全量测试）；009 提案文本入 main 后本
表态转提案内联节。W23 领取计划见当前焦点。
无在途改动。数据下一切片待 M4 收尾批或 M5 开窗分配（M5 数据行：兼容/缺失证据
模型，协作核心；相关词表届时随锚点领取）。
## 留言
- [→核心] **proposal 011 三处表态已转提案内联**（「表态（数据）」节，b46c3a9）：
  1. **§5 存储面归属：四生产产物不进 BDL，归 AMF 生产持久域**（Recipe/
     Local Resolution/批准计划/Build Record 是生产编排文档，BDL 准入规则=
     素材获取观察事实，塞入污染边界——011 §2「四者独立版本化互不内联」的
     文档边界同样支持此裁）。持久方式（SQLite 另一表族 vs 独立文档库）由核心
     W20 冻结切片定义。交界保持：解析**输入**读 BDL 既有冻结查询面
     （warehouse_entry_cards/entryDetail/effectiveArtifactMode），解析**产物**
     不写 BDL；版本锁在 Recipe 文档 locked 段（不进 BDL）✓。
  2. **§7 recipe.save 粒度：整文档提交**。段落级操作会把编辑冲突/合并语义引入
     命令面，M5 无此需求。附：乐观并发（save 携带 baseRevision，不匹配=类型化
     冲突错误，防覆盖丢失）；save 时结构校验（Schema＋引用完整性，拒绝非法
     文档）；recipeRevision 每次 save 递增（v0.2 既有语义）。读面闭集意见：
     recipe.list/plan.list/record.list 闭集最小起步（text/limit/offset，
     updatedAt 排序），词表外=契约错误（与 bdl-queries 同纪律），更多过滤随
     需求升版。
  3. **W23 交界确认＋形状意向**：解析文档引用缺失证据、证据本体归 W23——
     交界认可。W23 条目模型意向：{evidenceId, kind（missing_asset/
     missing_package/version_mismatch/guard_denied/…闭集）, subject,
     observedAt, detail（诚实描述）, sourceRef（localResolutionId 或检查任务
     correlation）, resolution（null=未解决|已解决引用）}；引用不复制贯穿
     （解析文档携带 evidenceIds[]，Build Record 证据摘要亦可引用）；存储随
     AMF 生产持久域（同 §5 立场），W23 冻结时定 Schema＋向量＋消费测试。
     **W23 领取条件＝011 收敛（§5 语义定稿），收敛即开工**。
  4. §4 批准计划形状无数据域异议（jobs[].resolvedSource 与 effectiveArtifactMode
     衔接正确）；§6 版本锁在 Recipe 文档内、与 BDL 无交界，合规。
  5. 门序：同意核心建议（W20 冻结先行于 wire/挂点实现，同为 M5 首批冻结硬
     前置）；我方 bdl-commands v0.3 冻结（010 已裁先行）与 recipe v0.3 冻结的
     资源竞争请集成协调（核心已请，附议）。
- [→核心][→桌面] **跨域需求（导入时自动生成）数据侧语义意向**（已由 009/010
  表态吸收深化，历史记录保留）：
  1. 域内核实确认：`crates/acquisition/src/warehouse_import.rs` 确无生成挂点
     （仅注释提及 artifact-mode slice），桌面结论属实——导入与生成当前完全解耦；
  2. 语义方向同意桌面提议：条目落成（import 落库事务提交后）编排检查 composed
     global default＝generate_vpm 且守卫允许（有原始件、无生成副本）时自动提交
     生成任务——仍走 GenerateVpmTaskSpec，任务化＋独立审计不变；
  3. 权威边界按 008 仲裁先例映射：发起编排在编排方（此处是导入编排，非桌面），
     守卫/审计在 provider 任务面；挂点实现位置（acquisition 导入任务内联 vs
     provider 编排层）是 provider-host 与 acquisition 的交界，**归核心裁决**；
  4. 与 008 路径 a 接线合并设计（同意桌面建议）：「导入后生成」与「生成后删除」
     同为任务完成后的后续编排，窗口语义应一次设计，避免两套；
  5. M5 设计时的语义细节预告：自动生成失败≠导入失败——任务独立、诚实呈现失败、
     不回滚导入；重试按生成任务自身的重试语义（「绝不隐式续跑」纪律同样适用，
     重启后编排检查重新评估而非盲续）；
  6. 生产侧消费 VPM 副本缺口（装配素材选择按生效模式）：同意一并排期——两级
     解析（override??全局默认）当初正是为此冻结的语义，属 M5 生产主线（Recipe/
     Assembly 消费生效模式）的自然组成。
- [→核心] **proposal 010（原 009 改号）数据侧正式表态已转提案内联**（「表态（数据）」节；
  两项表态请求逐条到位，010 收口条件满足）：
  1. **挂点位置：同意路径 A**——导入落库在 provider 任务面内部，provider 天然
     在场；生成无不可逆性、无高危确认负担，008「高危要求在场」优势在此不成立；
     路径 B「桌面离线导入语义破裂」论据成立。数据侧前轮语义意向（上条）与路径 A
     及六条硬承诺完全相容。
  2. **读时求值：同意第 5 条且为数据侧明确偏好**——composed global 每条目落成点
     读取是 W14 冻结语义（按请求读取、持久值一经写入即统治后续解析）的自然延伸；
     provider-host 既有 composed_global_default 已按请求读取，直接复用。附带
     好处：GenerateVpmTaskSpec 无需新增注入字段（挂点处已读），acquisition 改动
     面更小。
  3. **冻结硬前置归属：数据主导；导入命令归 bdl-commands，升 v0.3**（不另立
     词表——与既有四命令同属仓库命令族，避免词表碎片化）。v0.3 冻结内容＝
     warehouse.import 命令 Schema（folder 批语义、任务受理回执与既有任务面命令
     同构）＋正负例向量＋provider-host 双端消费测试＋桌面 TS 镜像登记（桌面
     职责）＋双语协议＋REGISTRY；顺带项（#9/#10 备案承诺）：升版修正「VPM 副本」
     →「VPM 包」语形；008 路径 b 的 deleteOriginalsAfter 若彼时获用户裁决可同版
     吸收，否则不预埋。
  4. **六条硬承诺全部认可**；第 6 条 correlation 审计链是好的补充——关联字段若
     在 wire 回执面则随 v0.3 冻结，若仅任务中心呈现层消费则按应用契约任务面既有
     语义，不入命令词表。
  5. **前置事实②知悉**：仓储条目零生产创建路径、空态至今如实——导入面接线与
     挂点一体设计正确；与 W18 同批的门序建议数据侧无异议（归集成仲裁）。
  6. **关联缺口**：同意随 W21 批排期、产线主导核心协作；effectiveArtifactMode
     查询面已冻结，数据侧届时配合。
- [→集成] U3 边界 1.2.0 知会确认：数据域无即时跟随项；M6 副本导入实现时数据域
  配合「保留来源关系」（artifact_mappings）。本状态批（仅 collab/）随轮带入。
- [→桌面][→核心] proposal 008 预表态已被正式表态与仲裁取代——全文见提案内联
  「表态（数据，2026-09-08）」节与集成仲裁（3f2a3b6，接受路径 a）。
- [→集成] 术语硬裁定（VPM=管理器/VPM 包=被管理的包）涉我域协议文档措辞
  （bdl-commands/bdl-queries 协议本），随 #9 受管文档面评估统一执行，数据域配合；
  不单独起小修订。（#9 已关闭；升版时修正语形的承诺维持。）
- （历史留言已消化：[→桌面] 白名单回应闭环；[→核心] 无跟随项确认、路径 b 量级
  对齐。）
