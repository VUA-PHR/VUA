---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: e8e32a9
updated: 2026-09-09
---
## 当前焦点
**用户回传 W15 确认完成＋9 条新发现问题（只确认意图，不动实现）**。数据职责两项
已交付意图确认与数据面事实（见留言「W15 九条——数据侧」）：条目 5（真实来源判定
现状与缺口）＋条目 6（迁移语义与 1.2.0/014 的三处冲突）。关键歧义已写入 BOARD
「待用户裁决」U6（五问），请用户裁决。其余条目归属：1/2/9＝桌面＋核心（2 涉
W14 冻结语义——数据面事实已供）；3＝桌面＋审阅子代理＋集成（M6 增设）；4＝
项目域 feature（环境/桌面）；7＝环境/桌面（B6 交互）；8＝B7–B9 测试归属域。
## 自基线交付（6c4d989 后，十九 tick）
- 无新代码交付（用户指令：不动手改文件）。**W15 九条登记与意图确认批**（本批，
  collab-only）：九条清单登记（归属标注）＋条目 5/6 意图复述、歧义与数据面事实
  ＋处置草案＋BOARD U6 裁决请求。
- 维护：合并 main（e8e32a9 世代，M6 三包＋核心 W20 第三刀已入）。
- 历史交付（已全部落账）：bdl-commands v0.3 冻结、W23 冻结＋核心存储实现、
  010 挂点批＋六承诺符合性声明、011/012 表态。
## 阻塞
- 无。
## 下次合并意图
本状态批（仅 collab/）随轮并入 main（免全量测试）。数据下一切片＝W23/生产证据
存储实现（随 W20 实现切片）或 M5 新分配。
## 留言
- [→全部][→集成] **W15 九条用户问题登记与意图确认**（用户指令：只确认意图不动
  实现；本节为登记簿＋数据侧两项详析；BOARD U6 已提关键歧义裁决请求）：

  **A组（设置-实验性交互）**
  1. A4 联动取消（主开关取消→「生成后删除原始素材文件」自动取消；现状仅置灰）——
     归桌面＋核心（联动语义），数据面无涉及（两开关均不写 BDL 数据，仅
     setGlobalDefaultMode 词表交互）。
  2. A7 本地素材产物模式呈现与用户期望冲突——**涉 W14 冻结语义，数据面事实**：
     W14 冻结语义＝「全局默认恒有值」（use_original_unitypackage 也是一个值），
     任何条目恒有 effectiveMode（override ?? 全局默认），因此「本地素材无产物
     模式」这一状态在现语义下**不存在**；条目 2 的期望（未开开关＝无产物模式／
     无条目动作）需要 either (a) 呈现层处理（守卫语义不变，UI 不呈现切换入口
     ——桌面＋核心裁决）或 (b) W14 语义变更（全局默认 nullable 化——词表升版
     ＋数据面迁移，重裁决）。**需用户澄清期望层级后核心/桌面表态**（已并入
     BOARD U6 问⑤）。
  3. 素材导入页面＋云端 Web 浏览缺口——归桌面＋审阅子代理＋集成（M6/M7 增设
     阶段提案）；数据面相关：导入走 warehouse.import（v0.3 已冻结）、云端下载
     走 download 管线（均已就绪，呈现层聚合是缺口）。
  
  **B组（项目兼容/迁移）——数据侧两项详析**
  4. Unity 项目名亚洲字符限制→项目备注 feature——归项目域（环境 T-A 检查面
     可加 displayName 备注；Unity 工程名本身不可改是 Unity 约束）。feature
     提案需产品裁决，数据面无涉及。
  5. **「项目/包真实来源」现状判定——数据侧事实与缺口**（用户问「存了什么、
     缺什么」）：
     - **项目来源判定（环境域 T-A，project-inspection v0.1）**：现状线索仅有
       「管理器注册表登记」——VCC＝读 settings.json 的 userProjects（显式
       路径清单）或 legacy localProjectFolders（注册文件夹下**扫描全部子
       目录**）；ALCOM＝读其 settings 的 userProjects（vrc-get 兼容）。每个
       命中路径登记 associations（vcc_registered/alcom_registered，可并列）。
       **缺口**：① 判定依据是「工具声称管理它」，**零项目固有可能证据**
       （未检测 .vcc 目录、vpm-manifest 结构特征等任何项目内指纹）；②
       localProjectFolders 扫描会把注册文件夹下的手建项目/其他工具项目一律
       标为 VCC 管理（误标源）；③ 两管理器都未注册的项目（associations 空）
       被 Schema minItems=1 排除在快照外——「来源未知」类项目不可见；④
       associations 可并列但桌面文案只有单句「VCC / vpm 管理」（多管理器、
       ALCOM 实际项目都被同一句笼统覆盖）。→ 用户的「线索不能断言出处」
       成立；处置草案见下 5-a。
     - **素材包来源判定（数据面 BDL）**：下载素材有完整来源链
       （download_events.source_url＋artifact_mappings 的 content→booth:product
       映射）；**本地导入素材无来源记录**（import 语义本来如此——用户手持
       folder，来源只有「用户提供的路径」）；条目的原始件/生成 VPM 包副本
       区分是明确的（CopyRole::Original/GeneratedVpm）。→ 「包的真实来源」
       若指**项目内 VPM 包**（manifest 依赖），现状只有 manifest 声明
       （声明≠来源——任何工具/人都能写 manifest）；若指**仓储素材包**，
       下载链有、导入链无。**歧义（BOARD U6 问①）：用户所指层级？**
  6. **迁移语义（用户推翻只读定义）——意图复述、三处冲突与数据面评估**：
     - 意图复述：迁移＝完全复制包清单→原项目**变为 VUA 原生项目可正常写**；
       不迁移/迁移未完成＝只读。这推翻 product-boundary 1.2.0 的只读语义
       （ALCOM/VCC 只读兼容＋`1.0.x` 写能力一律 false）。
     - **冲突一（与 1.2.0 禁止清单）**：迁移接管后，原项目仍在 VCC/ALCOM
       注册表内——用户再用原工具升级包会与 VUA 双写冲突。1.2.0 禁止清单
       明确「写 ALCOM·VCC 注册表数据库设置缓存」（不可替用户解除注册）→
       接管语义下只能**披露＋用户手动在原工具解除注册**；若要 VUA 代解除
       注册，需推翻 1.2.0 禁止清单一项（用户裁决）。
     - **冲突二（与 014 冻结语义的关系）**：014 import-copy＝复制内容到
       **新 VUA 项目**（新路径新身份，原项目只读锁）；条目 6 migrate＝原项目
       **就地接管转原生可写**。两者语义不同可并存（B6 草案「迁移/仅查看」
       恰好对应两操作——「仅查看」=013 只读，「迁移」=6 接管；014 的副本
       导入是否保留需用户/产品裁决——BOARD U6 问④）。
     - **冲突三（原子性）**：「迁移未完成＝只读」要求迁移状态机：两阶段原子
       （①完整复制包清单到 VUA 结构＋校验→②切换 native 可写标记），中断
       保持在 read_only——设计可行，归环境/核心实现裁决。
     - **数据面评估**：项目包清单是 Unity 项目文件（Packages/manifest.json
       ＋packages-lock.json），**不在 BDL**；迁移不涉 BDL 变更。词表归属
       按 014 先例＝project-ops 独立词表行新增 project.migrate 命令（归
       环境/核心裁决）。若用户进一步要「迁移后项目内包在 VUA 仓库可见/
       可管」＝新语义需求（项目包→BDL 仓储导入），需另立裁决（BOARD U6
       问④附注）。
  
  **C组**
  9. C1 状态来源可信度＋DEV 场景条取消＋开发模式单独切换——归桌面＋核心
     （fixture/live 呈现与 provider 状态面）。数据面无涉及。

  **处置草案（提案，待用户/各域裁决后立项，本轮未动任何实现）**
  - 5-a 措辞层（桌面，立即可改）：按用户草案文案修正（「此项目看起来由其它
    软件管理？接管它可能产生未知后果」＋迁移说明详细化）。
  - 5-b 判定增强层（环境域 T-A 后续切片提案）：① 项目固有可能证据探测
    （.vcc 目录、vpm-manifest 特征等）作为第二维度；② localProjectFolders
    扫描命中降级为 weak association（「未确认」）；③ associations 空的项目
    入快照＋「来源未知」诚实标记（需 Schema 升版）。
  - 6-a 语义模型提案（需用户裁决后立项）：项目生命周期三态 unknown→
    read_only→native（迁移完成才可写）；迁移两阶段原子；原注册表披露＋
    用户手动解除（不写注册表）；project-ops 新增 project.migrate 命令
    （环境/核心裁决归属）。
  - 6-b 014/6 并存关系与 A7 W14 语义层级——并入 BOARD U6 请用户/核心/桌面
    裁决。
- [→集成] **010 六承诺实现核对声明**（挂点批 31cf558 已验收合并，本声明供验收
  档案；实现位置＝crates/acquisition/src/warehouse_import.rs 挂点段＋
  warehouse_maintenance.rs 审计链字段；钉死测试＝warehouse_maintenance.rs
  tests 三项＋import_contract_v03.rs 六项）：
  1. **独立性**：生成提交失败/composed 求值失败均走类型化进度注记
     （generationSubmitFailed，携 warehouseItemId＋reason:{:?}），导入继续、
     照常 Done——不回滚、不静默；挂点端到端测试断言导入条目落库与 Done。
  2. **逐条目至多一生成**：挂点在每 folder 落成点至多提交一次；守卫照常在
     生成任务内评估（重复导入→already_generated 拒绝＝该任务自身审计回执，
     不回滚导入）。
  3. **取消边界**：取消检查在下一 folder 开始前；已落库条目的生成任务已在
     TaskRuntime 独立注册（不随导入取消而取消）；未落库 folder 不触发生成。
  4. **恢复纪律**：挂点在导入任务执行内，导入重启→inspect_required 不自动
     重跑→不重复提交；已提交生成任务按既有恢复语义（绝不隐式续跑）。
  5. **读时求值**：composed＝store.global_default_mode()??env_initial 在每个
     条目落成点读取；钉死测试＝persisted_original_rules_the_hook_over_
     the_injected_initial（persisted=original 压过注入初值 generate_vpm）。
  6. **审计链**：GenerateVpmTaskSpec.import_correlation_id＝导入 correlation
     →GenerateVpmResult.importCorrelationId（journal 完成载荷，手动发起经
     skip_serializing_if 不出现）；钉死测试＝import_hook_submits_generation_
     with_the_audit_chain（派生 correlation「<导入corr>-auto-<条目>」＋载荷
     断言）。
- [→核心] proposal 012 数据表态（提案入 main 后转内联「表态（数据）」节；三点已被核心收敛吸收为「数据三点确认」）：- [→核心] proposal 012 数据表态（提案入 main 后转内联「表态（数据）」节；三点已被核心收敛吸收为「数据三点确认」）：
  1. **evidenceSummary 交界确认**：evidenceIds 身份引用（与解析文档
     evidenceIds 同构）、本体在 W23 持久域——与 W23 形状意向一致；W23 v0.1
     草案已交付（production-evidence，evidenceId＝uuid v7 开放身份，生成语义
     稳定），Record 词表只钉 evidenceIds[] 数组形状即可。
  2. **Record 冻结不等 W23：确认**——evidenceIds 是开放身份引用，Record 词表
     不消费 evidence 本体形状（kind/subject 等在 evidence 文档内部）；W23 冻结
     只保证 evidence 侧自洽。时序成立，012 可按自身节奏收口冻结。
  3. **最小形状建议**：evidenceSummary 保持 evidenceIds[] 即可——kind 计数等
     派生量由消费端从 evidence 本体聚合，避免冗余漂移。
- [→核心] proposal 011 三处表态已转提案内联（「表态（数据）」节，b46c3a9）：
  §5 存储面＝四生产产物不进 BDL 归 AMF 生产持久域；§7 粒度＝整文档提交＋
  baseRevision 乐观并发；W23 交界确认＋条目模型意向（草案已落地兑现）。
- [→集成] 在途四批随轮验收带入：v0.3 冻结批（49586f3，你方已复跑验收——以
  合并流转为准）＋W23 草案批（0ba3071）＋011 表态批（b46c3a9）＋本状态批。
  W23 冻结随 011 收敛互审收口，不前置。
- （历史留言已消化：跨域需求意向（009/010 吸收）、010 表态（已收口）、008
  全链、U3 边界知会、术语裁定承诺——均已闭环。）
