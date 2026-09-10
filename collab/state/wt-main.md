---
worktree: wt-main
branch: main
role: 集成
baseline_commit: d689b68
updated: 2026-09-11
---
## 当前焦点
**操作者指令：019 批 C 工单签发**（BOARD #21 行）——批 C 生产链（两套 UI
共用解析/计划/任务/记录，对齐 M5 W20/W22/W24 接口）开工授权：前置已齐
（核心侧接口均已交付验收），路由桌面牵头，验收标准＝两套 UI 共用生产链
且不用模拟替代未完成接口（诚实降级照 UI-08），完成条件对照 AC-05/07/13。
桌面已留言知会可开工。019 批 A/B 均已交付验收。**W25 用户延期维持**
（O-2：开窗时间待定）。批量面板未触发；[需代裁] 零新增。
---
worktree: wt-main
branch: main
role: 集成
baseline_commit: fcbc441
updated: 2026-09-11
---
## 当前焦点
**019 批 B 增量验收**（cbe8fa6 已验）：saved 身份（recipeId＋revision）提升
入容器层 compose 草稿状态（UI-02 对象身份——跨 UI 根保留最近保存身份）；
composeSaved 签名扩展；57 文件 455 测试全链绿。019 批 C 工单已签发
（桌面切片推进中）。**W25 用户延期维持**（O-2：开窗时间待定）。批量面板
未触发；[需代裁] 零新增。
## 自基线交付（89038f5 之后）
- **批 B 增量验收（09-11 07:00–07:20）**：
  - **fcbc441**：slot/wt-3 **019 批 B 增量验收合并**——cbe8fa6（saved 身份
    ［recipeId＋revision］提升入容器层 compose 草稿状态＝UI-02 对象身份
    跨 UI 根保留强化；composeSaved 签名扩展 recipeId；测试更新）。**验收
    记录**：确认 cbe8fa6 含 b243a1d（非重复交付，有效增量）；桌面 check
    全链复跑绿（**57 文件 455 测试**＋leak 159 零命中）。
- **状态文件结构自纠（09-11 03:20 轮发现，03:30 修正）**：多轮整段替换
  编辑在文件中部残留了第二套 front-matter＋旧当前焦点嵌入块——外科删除
  （15-28 行区域），全局标题扫描确认单一套结构；教训＝整段替换后必须
  复查全文节结构（grep '^## ' 与 front-matter 计数）。
- **第二十一/二波验收（09-11 04:00–04:20）**：
  - **7a0a1ec**：slot/wt-2 **BG-16 接线刀验收合并**——0c72258（environment.
    getSnapshot 消费真实检测引擎＝M6 环境检查行缺口工单兑现；诚实空态当
    未接线；provider_host 79 行＋新增 environment_snapshot_wire 套件）。
    **验收记录**：复跑 **67/67 workspace 全绿**（新增套件）＋clippy 零
    告警。**登记备注**：首跑曾计 44 套＝合并文件写入与 cargo 启动的读取
    竞态，稳定重跑两次 67 确认（已在提交信息声明）；
  - **aa3e747**：slot/wt-3 **W24 recovered 呈现语义验收合并**——1c27f0d
    （构建记录卡 recovered 徽标与注释，消费 v0.2 evidenceSummary 投影
    六态词表；BuildRecordCard 11 行＋四语 i18n）。**验收记录**：桌面
    check 全链复跑绿（56 文件 449 测试＋leak 159 零命中）。
- **019 批 B 完成刀验收（09-11 02:50–03:10）**：
  - **68f3617**：slot/wt-3 **019 批 B 完成刀验收合并**——b243a1d（save
    chain＋nameHint 用户输入：compose-draft-store 12 行＋ComposePage 16 行＋
    四语 i18n；核心裁定零词表增长、recipe.save 原样承载；G1 删除接口候选
    维持批 B 前置确认裁定——需求未明示删除未立项）。**验收记录**：桌面
    check 全链复跑绿（56 文件 449 测试＋leak 159 零命中）；批 B 完成条件
    对照逐项满足（身份/修订/切换不丢/回执门控显示/失败可重试）。
- **新夜周期第一波（09-11 01:40–02:00，五树修复批验收）**：
  - **87ae6a9**：slot/wt-2 **BG-10 修复验收合并**——30da5b6（overlay 入队
    顺序恢复与 oldest-first 声明一致＋存储故障穿透为故障态不折叠空态＋
    乱序回归测试钉死＋unwrap_or 审计清零）。复跑 66/66＋clippy 零告警；
  - **b75447e**：slot/wt-5 **BG-17＋BG-12 数据侧验收合并**——43ea8d2
    （downloads_list_serving ISO 排序断言 51 行钉死格式漂移＝BG-17 核销；
    warehouse_download_adopt 吞错修正＝BG-12 数据侧，核心半边路由）；
    downloads_list_serving 7/7＋acquisition 6 套绿。瞬败按 #7 精神声明
    知悉；
  - **93d8c6a**：slot/wt-6 **BG-11 部分验收合并**——156640b（verify-hook
    门对齐 windows conjunction；EAC 收紧工单余项随环境后续批）。project-
    manager 13 套绿；
  - **28d0c59**：slot/wt-3 **BG-14 验收合并**——53a1bc2（check-leak 过量
    声明修正，comment-only）。桌面 check 全链绿（56 文件 449 测试）；
  - wt-4 状态批随轮合并——五分支清零，46/46 一致；
  - **BOARD 对账标注完成**（操作者对账指令）：BG-10/11（部分）/12（数据
    侧）/14/17 标已交付引用哈希；BG-12 核心半边与 BG-11 余项随后续批；
    BG-17 撞车已按实际核销（在途批未含该断言）。
- **操作者修复令批（08:20–08:35，用户裁定「先修再推」）**：
  - **0b8bebb＝BG-7＋BG-8**：①CI 假绿修复（--registry-only 无条件
    process.exit(0) 覆盖 exitCode——改一行语义；**双向验证**：正向 40/40
    exit 0／临时破坏一行〔product-boundary 版本 9.9.9〕exit 1 并正确报出
    异常行／复原 exit 0 干净）；⑤REGISTRY 补登 6 族（recipe v0.3 四件套/
    eac-probe/allowlist/terminate v0.1/amf-production v0.2/environment-
    managers v0.1——**反向检测发现 amf-production 与 environment-managers
    为真漏登记**）＋**反向盲区检测**（扫描 schemas/ 族对照 REGISTRY 提及；
    豁免 spike 三目录＋inspection-evidence 草案态＋orchestrator 两非标准
    形态；**人造漏登记演示**：删 eac-terminate 行→检出并打印＋exit 1→
    复原 exit 0）；
  - **eeb42c6＝BG-9**：schema-vectors 清单扩展至全部现行契约锚点（16 个
    测试目标逐一核对存在；**inspection_evidence_vectors 纳入＝仅草案漂移
    保护，注明不暗示冻结**——按「草案不冻结不徽章」原则的边界判断）；
  - **949ee30＝BG-13＋路径脱敏＋审阅归档＋对账**：009/011/012/015 头部
    状态对齐（原注记保留）；collab/ 九处本机用户名路径脱敏（BOARD U7 行/
    019 头部/审阅报告 r1×2 r2×2 r3×3；docs/plans 为 gitignore 本地
    scratch 不处理）；**r1/r2/r3 推送审阅报告归档入库**（脱敏后）；
    BOARD 对账（BG-7/8/9/13 标已交付引用哈希；BG-17/18 撞车待核销注；
    **O-2 补注 W25 用户延期、时间待定**）；
  - 同批验收：核心 save-chain 契约路由（6f7fec2）＋桌面 019 批 B 切片
    （e611cf0，56/447 绿）。
- **第二十一波验收（08:00–08:15）**：
  - **6f7fec2**：slot/wt-2 save-chain 契约路由批合并（c4cc749——无事实源
    ＝冻结 schema 设计〔编辑器输入＋anyOf catalogEntryId/nameHint〕；批 B
    最小路径零词表增长；系统性事实源路由 M7 inspection 锚）（collab/docs）；
  - **e611cf0**：slot/wt-3 **019 批 B 桌面切片验收合并**——6dfa40e。**验收
    记录**：桌面 check 全链复跑绿（**56 文件 447 测试**＋boundary＋i18n＋
    contrast＋leak 159 零命中）；save chain 禁用＝诚实降级（AC-04 语义
    前置核可）。
- **批 B 授权批（07:40–07:50）**：slot/wt-2（UI-03 评估交付回复 305e814）
  ＋slot/wt-3（019 登记与批 A 验收确认＋批 B 工单请求 7d1dfa9）两状态批
  合并——**019 批 B 开工授权**（前置已齐：核心 UI-03 评估 dcf8b04 世代
  合并＋批 A 骨架 1360af1；G1 删除候选裁定随批 B 确认批）。
- **第二十波验收（07:20–07:30）**：
  - **a616c5a**：slot/wt-3 **018 批 2 part 2 验收合并**——13764fa（常用
    组合预设 all-live/all-demo-fixture 入开发模式区：dev-port-selection
    9 行＋dev-mode-section 22 行＋四语 i18n）。**验收记录**：桌面 check
    全链复跑绿（55 文件 443 测试＋leak 159 零命中）。018 批 2 收口
    （part 1 档位＋part 2 预设）。
- **第十九波验收（07:00–07:10）**：
  - **1360af1**：slot/wt-3 **019 批 A 验收合并**——0227640（共享容器保留＋
    UI 根切换骨架：ui-registry 45 行〔两套可信随产品构建 UI；current 第一套
    接入；forest-green 不可用态如实呈现〕＋App.tsx 113 行＋测试 23 行＋
    四语）。**验收记录**：批 A 完成条件（切换不重建 Gateway）结构性满足
    ——Gateway 生命周期在容器层、UI 根切换仅换 root 组件不触端口订阅；
    会话级选择词表外回落 current（UI-05/08）；森林绿不可用态如实（UI-08，
    批 D 前不宣称可用）；复跑桌面 check 全链绿（**55 文件 443 测试**＋
    boundary＋i18n＋contrast＋leak 159 零命中）。
- **第十八波验收（06:40–06:50）**：
  - **e1611fb**：slot/wt-3 **BG-1 主切片 part 3 验收合并**——4dcf8db
    （A 路线落地：三视图期望态呈现按核心/数据裁决实现；RecipePage 47 行＋
    recipe-model 36 行＋library 测试 30 行＋四语 i18n＋model-production-port
    12 行）；状态批声明**多 UI 批 A 工单接受**（#21 路由兑现）。**验收
    记录**：桌面 check 全链复跑绿（54 文件 441 测试＋leak 159 零命中）。
    **BG-1 映射语义全链闭环**（升级→三表态→仲裁→实现）；
  - wt-2/wt-4/wt-6 collab 收尾批（多 UI 评估路由/016 翻转/环境状态）确认
    无待合并内容（各树自行同步 main）——五分支清零，40/40 一致。
- **019 登记＋工单路由批（06:25，操作者 directed）**：
  - **collab/proposals/019-multi-ui-shared-layer.md**：需求全文照录（源
    0.1.0 草案一字未改；UI-01~UI-10＋§5 接口分组＋§6 批 A-D＋§7
    AC-01~AC-13）；status=已接受（用户指令实施）；头部含授权链/排期锚
    （M6 伴随项）/森林绿红线；文末登记注（职责路由＋红线执行＋文档地位
    ＝T5 登记件，正式契约按治理另升版）；
  - **.gitignore**：显式登记 `apps/desktop/src/ui-variants/forest/`（用户
    红线：森林绿 UI 本地源码永不入库；推送前 3 轮 Reviewer 含零泄漏
    核查）；
  - **BOARD #21**：工作项行登记（批次路由＋红线＋UI-03 契约缺口评估归
    核心首个动作）；
  - 排期守门：019 各批不改变 W25/W26 与其他角色既有窗口（操作者指令
    原文）。
- **第十七波验收＋仲裁（06:00–06:20）**：
  - **c322861**：slot/wt-3 **BG-1 主切片 part 2 验收合并**——2e4dc2d
    （期望态结构清单消费核心裁决：RecipePage 25 行＋recipe-model 65 行＋
    library 测试 28 行；词表所有权确认路由数据/产线）。**验收记录**：桌面
    check 全链复跑绿（54 文件 439 测试＋leak 159 零命中）；
  - slot/wt-2/wt-5 表态批合并（0bddf98/0ff1455）——**015 §14 仲裁落节**：
    A 路线采纳两段式（短期现状＝诚实终态；A 词表化已启动，part 2 第一
    落地；词表所有权＝中性态定义权桌面、核心复核、产线知会路由中）＋
    B＝M7 锚点后正解＋C 永久否决（三方一致）；
  - 五分支清零，40/40 一致。
- **第十五波验收（05:40–05:50）**：
  - **9ee8083**：slot/wt-3 **BG-1 主切片 part 1 验收合并**——29aa537
    （recipe.get 消费＋narrowRecipeDocumentFacts 结构事实收窄：title/
    revision/updatedAt/计数/locked 三态含 null；呈现文案明示「期望态
    描述，非已验证的本地状态」；测试 2 项含 locked 三态）。**验收记录**：
    桌面 check 全链复跑绿（54 文件 437 测试＋leak 159 零命中）；**升级
    处理核可**——期望态→检查态映射语义升级路由核心/数据（三选项 A/B/C，
    C 自评不推荐＝未验证伪装已验证风险），确认前不做 state 渲染＝诚实
    纪律边界正确行使（不猜测不发明语义）。**集成初判**：B 方向（服务侧
    投影，照 017 §1 服务权威侧）与架构一致，A 涉 M3 词表演进需谨慎——
    待核心/数据表态后仲裁；
  - 五分支清零，40/40 一致。
- **第十四波验收（05:20–05:30）**：
  - **f227de3**：slot/wt-3 **BG-1 工单交付验收合并**——eba88a7（W24 读面
    预备：recipe 文档库节 RecipePage 113 行＋共享选择骨架 recipe-model
    46 行＋library 测试 41 行＋四语 i18n；消费 v0.2 recipe.list）。**验收
    记录**：桌面 check 全链复跑绿（**54 文件 435 测试**＋boundary＋i18n＋
    contrast＋leak 159 零命中）；工单验收标准满足（数据全部来自 v0.2 十
    方法读面、空态即终态、不宣称端到端）。**BG 工单 5/6 交付**，余 BG-3。
- **第十三波验收（04:40–04:50）**：
  - **6256410**：slot/wt-3 **018 批 1 实现验收合并**——200012d（dev-mode
    per-port 连接目标：dev-port-selection 82 行〔十端口会话级、严格解析
    回落 {}〕＋create.ts 混合装配＋设置页 DEV-only 区＋DevScenarioBar 套装
    退役〔C1 兑现〕＋测试 3 项）。**验收记录**：装配入口 DEV 门控抽查核验
    （`!import.meta.env.DEV` 首行短路＝生产构建静态剔除 readDevPortSelection，
    撤回声明的「不读不写」成立）；leak devOnlyMarkers 撤回核可（常量性
    误报修正、脚本内留备注、159 指纹主防线保留）；复跑桌面 check 全链绿
    （**53 文件 432 测试**＋boundary＋i18n＋contrast＋leak 159 零命中）。
- **第十二波合并＋自纠（04:20–04:30）**：
  - slot/wt-2：018 §6 核心表态（纯渲染层装配面确认：contracts/preload/Main
    零变更＋应用契约零变更＋provider 零耦合；诚实纪律核对通过；会话级
    per-port 选择不进持久域）——**018 两方表态齐**（桌面稿＋核心确认），
    备稿性质维持（裁决 13 授权，实现排期桌面自决）；
  - slot/wt-3：**proposal 018 开发模式基建草案**（裁决 13 备稿：DEV-only
    per-port 连接目标——取消 DEV 场景条、实验性页开发模式开关、渲染层
    per-port 切换真实/fixture Gateway）＋桌面 13 项裁决全部关闭声明；
  - slot/wt-6：counts-derived-quantity 表态（照 012 先例无信封升版）；
  - **流程自纠（如实）**：wt-3 合并时 shell 链失误（分号连接）致未解决
    冲突即提交——main 短暂带入含冲突标记的 018（07f1f8a），后续提交修正
    （保留核心表态节）；全局扫描零残留。教训记录：多命令链一律 `&&` 连接，
    合并提交前必检 `grep -c "<<<<<<<"`。
- **第十一波验收两批（04:00–04:10）**：
  - **7db13f3**：slot/wt-2 **#20 修复小刀验收合并**——2517dc8（demo 任务面
    纳入重启扫除：provider_host 105 行重组＋lifecycle_recovery 测试 189 行，
    钉死 `demo_task_walks_lifecycle_and_is_swept_on_restart_per_board_20`＋
    「硬杀后重启永不读 running」）。**验收记录**：复跑 **66/66 workspace
    全绿**（新增 lifecycle_recovery 套件）＋clippy 零告警；修复断言与裁决
    语义一致；
  - **10b0af7**：slot/wt-3 **013 消费 UI 验收合并**——c443a89（F6 检测节
    live 接线＋B6 identify 流：ProjectCompatPage 222 行＋
    project-detection-model 测试 60 行；措辞变更诚实声明）。**验收记录**：
    桌面 check 全链复跑绿（**52 文件 429 测试**＋boundary＋i18n＋contrast＋
    leak 159 零命中）——013 消费链（核心读面＋TS 面＋UI）全通；
  - 五分支清零，40/40 一致。
- **第十波验收＋#20 裁决（03:40–03:50）**：
  - **396520c**：slot/wt-2 **BG-6 Spike 交付验收合并**——22cdc1e
    （scripts/spikes/provider-lifecycle/ 265 行：双场景可复跑脚本＋README
    笔记；**SPIKE 非交付物**标注）。**验收记录**：工单验收标准逐条满足
    （脚本可复跑——验收时实跑：握手 ok 68ms＋getSnapshot p50 0.26/p95
    0.90ms debug 构建实测捕获；笔记记录边界发现）；**边界发现如实升级**
    ＝demo 任务重启残留候选缺陷 → BOARD **#20**；
  - **#20 集成裁决（BOARD 行）**：候选缺陷成立（DEV-only 不豁免诚实呈现）；
    归因＝demo 面未被重启扫除覆盖（产品任务 W22 恢复语义完好）；排期＝核心
    修复小刀随下一工作窗口，不阻塞任何门与 W25；
  - slot/wt-3 017 桌面表态批合并（3b509f0：传输面＝同进程窗口＋既有广播＋
    按需轮询；会话身份＝不引入；投影清单＝批一任务卡＋生产状态卡——批一
    零核心新增；OverlayReadModel 端口保留为投影演进锚）——**017 三项跨域
    表态齐，核心 wire 面解锁**；
  - 五分支清零，40/40 一致。
- **第九波验收三批（03:15–03:25）**：
  - **f268813**：slot/wt-2 **BG-2 工单交付验收合并**——ac3dba5（overlay
    surface 骨架 122 行＋proposal 017 方向性设计稿：零新增事实源/协议词表、
    消费形态两分〔稳定快照＋语义动作〕、跨域接口留桌面表态、仅方向不冻结）。
    **验收记录**：工单验收标准逐条满足；复跑 65/65 workspace 全绿＋clippy
    零告警。BG 工单累计交付 3/6（BG-2/BG-4/BG-5）；
  - **790fdf2**：slot/wt-3 013 其余读查询 TS 面**验收合并**——12ca99f
    （listProjects/inspectProject/lockStatus 登记＋projectNotFound
    messageKeys 四语）。**验收记录**：桌面 check 全链复跑绿（51 文件 424
    测试＋leak 159 零命中）——**013 消费面 TS 侧全齐**（桌面 B6 接线就绪）；
  - **9a785b2**：slot/wt-6 alcom-vcc **1.1.0 验收合并**——ebb7875（VUA 原生
    项目发现节＋兼容矩阵行＋机器可读面刷新到接线态；REGISTRY 行同步）。**验收
    记录**：文档头部一致核验＋登记表 40/40（collab/docs 批免全量测试）。
- **第八波验收（03:00–03:05）**：
  - **d24e5b7**：slot/wt-2 013 读面完成**验收合并**——5b65550（三项目读
    查询全接线：provider_host 147 行＋project_ops_wire 128 行）。**验收
    记录**：复跑 **65/65 workspace 全绿**＋clippy 零告警；
  - **70f517d**：slot/wt-3 013 读面第一刀 TS 面**验收合并**——d4f781a
    （environmentManagers 信封强度登记＋gateway-router 穷举正例表扩展）。
    **验收记录**：桌面 check 全链复跑绿（51 文件 424 测试＋leak 159 零
    命中）；
  - wt-6 两状态批随轮合并——五分支清零，40/40 一致。
- **第七波验收（02:40–02:45）**：
  - **846b534**：slot/wt-2 013 读面路由第一刀**验收合并**——e720544
    （project.environmentManagers live：provider_host 65 行＋project_ops_wire
    103 行；三未接线项类型化 unavailable；下一刀分线声明）。**验收记录**：
    复跑 **65/65 workspace 全绿**＋clippy 零告警；
  - **057a549**：slot/wt-3 **IMP-5 非真机部分验收合并**——f0779b5（015 §13：
    A 代码级核验记录〔诚实空态/能力两态真值表/零 fixture/隔离红线静态核对/
    导航策略盘点 19＋3 项〕＋B 真机冒烟清单草案六项〔W25 窗口用〕）＋
    64d22a7（messageKey 两枚四语登记——核心环境预检机械跟随，语义照
    provider_host.rs）。**验收记录**：桌面 check 全链复跑绿（51 文件 423
    测试＋leak 159 零命中）；真机项归 W25 窗口的边界标注核可。**桌面
    IMP-1~5 全部可交付面收口**；
  - wt-4/wt-6 状态批随轮合并——五分支清零，40/40 一致。
- **第六波验收三批（02:20–02:25）**：
  - **07166b7**：slot/wt-2 环境预检接线**验收合并**——2112f6c（job.execute
    受理预检 009 表态④②后半段 live：provider_host 86 行＋bin 接线 9 行；
    f8fe114 事实源消费）。**验收记录**：复跑 **65/65 workspace 全绿**＋clippy
    零告警。**预检链三段完整**（版本锁 8c7b6a4＋环境 f8fe114/2112f6c＋指纹）。
    **流程自纠**：本批 commit 先于 cargo 复跑执行（顺序违规，结果全绿支撑
    正确性但程序不当）——已恢复先验后提，后续批照此执行；
  - **6cbcb26**：slot/wt-3 **批 B-3 实现验收合并**——81b8510（页内导航确认层
    照 015 §12：navigationConfirm IPC 段＋pending 登记簿无超时阻断确认＋
    四语 overlay；security.ts 策略面零变更）。**验收记录**：桌面 check 全链
    复跑绿（**51 文件 423 测试**＋boundary＋i18n＋contrast＋leak 159 零命中）；
    §12.4 锚逐项对照成立。**IMP-2 交付面完成**；
  - wt-4 016 状态翻转批（f81aec5，collab-only）随轮合并；wt-5/wt-6 已同步
    （领先 0）——五分支清零，40/40 一致。
- **第五批（02:01–02:15）**：
  - 四树 collab 批合并：wt-2（016 核心表态＋015 §12 IPC 表态——BG-4 协作位
    履职）、wt-4（维护轮）、wt-6（016 环境表态）、wt-3（015 §12 批 B-3 IPC
    设计稿）——016/015 内联冲突各一处融合（三方/两侧表态并列保留）；
  - **016 #19 仲裁（016 内联「仲裁（集成）」节）**：三方表态齐无分歧照单
    采纳（存储面第五文档库锚 EvidenceStore／独立 inspection-queries 词表行/
    聚合与保留值纪律核可）＋dependencies 维分层注记（定义权在产线，引用
    不复制照 012 先例）＋冻结锚＝Bridge 五维产出操作落地；
  - **015 §12.8 B-3 设计稿核验受理**：§12.4 锚＝实现验收口径＋批 B-3 实现开工
    授权（核心表态桌面域内零耦合、无配合项）；
  - **BG-5 交付（工单闭环）**：scripts/collab-brief.mjs `--registry-only`
    模式（仅跑登记表校验、exit code＝异常数；默认完整简报行为不变——本地
    验证 40/40 exit 0）＋`.github/workflows/collab-registry.yml`（paths 触发
    ＋fetch-depth 0＋**报告性 continue-on-error**）。**诚实声明**：CI run 号
    待下次 origin 推送后补录（本环境无推送，不虚报绿证据）。
- **第四波验收三批（01:45–01:58）**：
  - **e1e5520**：slot/wt-2 读面消费侧**验收合并**——389912e（provider_host
    78 行＋catalog_queries 137 行；数据 186b9fa 的消费/wire 侧）。**验收
    记录**：复跑 **64/64 workspace 全绿**＋clippy 零告警。ph_010 瞬败样本
    记录知悉（#7 协议：与本批无交集、三次顺序复跑全绿、样本未保留完整输出
    如实声明——观察态维持，再现即取全量日志）；
  - **abab341**：slot/wt-4 **BG-4 工单交付验收合并**——ad46501
    （inspection-evidence v0.1 草案：五维闭集＋unavailable if/then basis=none
    钉死＋basis 诚实纪律〔bridge_local_estimate 非官方；official_sdk_rating
    保留〕；向量 7 件＋校验测试 4 项）。**验收记录**：工单验收标准逐条满足
    （向量过校验、草案态 REGISTRY 未动未标冻结、入 proposal 待仲裁）；复跑
    **65/65 workspace 全绿**（新增 inspection_evidence_vectors 套件）＋clippy
    零告警；BOARD #19 开放（核心/环境/数据表态→集成仲裁；数据 BDL 边界
    确认已随 wt-5 状态批回）；
  - **85a9c73**：slot/wt-3 批 B-2**验收合并**——f5bb1f4（已完成下载列表＋
    采纳入口 UI；bdl-queries v0.4 TS 面登记；remoteBrowser router 行清理
    §11 (a)；gateway-router 穷举正例表扩展）。**验收记录**：桌面 check 全链
    复跑绿（50 文件 420 测试＋boundary＋i18n＋contrast＋leak 159 零命中）；
  - wt-5 状态批（6f2c7b7：三复核——TS 镜像与冻结面一致无修正/核心接线
    知悉/016 BDL 边界无出入）随轮合并——五分支清零，40/40 一致。
  - IMP-2 批 B 去降级两翼现状：读面（数据 186b9fa＋核心 389912e）✓＋TS 面
    （桌面 f5bb1f4）✓——**采纳入口去降级条件满足**，桌面自排翻转批。
- **空转触发登记＋工单转正批（01:30，操作者 directed）**：BOARD 机制节触发
  记录一行＋备稿 7 项整理为 **BG-1～BG-6 工单**（剔除：双协议本已完成
  a9657ea；W25 相关不属后方工单。逐项拟 roles/产出形态/验收标准；领取纪律
  ＝仅当无更优先在途工作，经 collab:brief 自领）。路由：BG-1/BG-3→桌面；
  BG-2/BG-6→核心；BG-4→产线（协作核心、环境）；BG-5→集成自领（下节拍
  在途）；环境无专属项（其域分析已交付，可领 BG-4 协作位）；
- **验收队列清空（01:16–01:20）**：
  - **f5f2fe0**：slot/wt-2 核心两批**验收合并**——be58a67（desktop.remoteBrowser
    capability 行移除，015 §11 (a) 核心半边：provider 不再转述非自身能力）
    ＋7b310bb 状态。**验收记录**：diff 审＝served_capabilities 删除行与裁定
    一致；复跑 **63/63 workspace 全绿**＋clippy 零告警；
  - **1d7f520**：slot/wt-5 数据批**验收合并**——186b9fa（bdl-queries **v0.4**
    `downloads.listCompleted`：闭集升六查询；成员判定与采纳守卫 staging_
    completion **同源同函数**＝守卫事实镜像；路径永不出现；消费测试 6/6
    guard-mirror 性质；信封版本随核心接线批升〔契约先行分流〕）。**验收
    记录**：复跑 **64/64 workspace 全绿**＋clippy 零告警；REGISTRY v0.4 行
    核验＋**v0.3 头部取代对齐随批修复**（与上轮 bdl-commands 同型回归，本次
    验收时直接折入合并批，40/40 一致）；
  - （桌面 875c85a 已于上轮合并并补验——见前批记录。）
- **收尾批（01:30 后）**：数据 v0.3 头部横幅批（b167ca8）与我在 1d7f520 折入
  的修复**同内容撞车**——冲突取数据侧措辞融合（e449709，域文件由词表主导方
  措辞）；wt-6 浏览清单批准登记批（8754294）随轮合并（e56cd4c 后续）——
  五分支清零，40/40 一致。
- **第三波验收＋仲裁收敛（01:00–01:20）**：
  - **015 §7 仲裁（§10）**：采纳数据 A 形态（downloads.listCompleted 与守卫
    同源；否决渲染层聚合 B 形态——两缺口成立，A7/W14 教训同型）；节奏＝数据
    契约先行照 IMP-3 惯例，批 B 采纳入口降级不阻塞；
  - **b4c78aa**：slot/wt-2 importDownloads wire 路由批**验收合并**——cbde4b3
    （v0.4 六命令闭集全接线：仅身份参数闭集、任务化受理、信封钉 v0.4、四负例
    向量、真采纳任务向量驱动消费测试；provider_host.rs 72 行＋测试 144 行）。
    **验收记录**：015 冲突融合（核心 §7 答复节归 §7 下＋我方 §10/§11 仲裁节）；
    复跑 63/63 全绿＋clippy 零告警。IMP-3 wire 翼完成＝批 B 去降级前置满足；
  - **§11 仲裁**：remoteBrowser 翻转机制采纳核心方案 (a)——渲染层直读壳能力
    （preload/Gateway 自报，桌面域内），provider 硬编码行随桌面批 B 移除
    （诚实纪律：非 provider 提供的操作不进其 capability 报告）；
  - **823bd1c**：slot/wt-3 **IMP-2 批 A 验收合并**——61f1024（素材导入页：
    nav 页签＋页面骨架＋本地段迁移＝IMP-4 收口＋浏览区接线 capability 门控）。
    **验收记录**：桌面 check 全链复跑绿（50 文件 419 测试＋boundary＋i18n＋
    contrast＋leak 159 零命中）；「不宣称端到端」声明核可（内嵌浏览保持降级
    态，无真实浏览会话；本地导入为已验收协议的呈现迁移）。**浏览清单提案
    照准**（booth.pm 含全部子域＋booth.pximg.net 商品图 CDN；仅域名入库；
    与下载主机域清单严格分离——下载域真机验证程序不变）；
  - **57482ef**：design-standard **0.7.1 措辞修正**（桌面批 A 状态指出的漂移
    ＝准确纠正：U9 四分法后无「交系统浏览器」降级替代路径）——「诚实降级引导
    系统浏览器」改为「纯不可用说明，无替代动作」；双语；Patch 级不动 REGISTRY；
  - wt-3 main 同步批（973a921）随轮合并——五分支清零，39/39 一致；
  - **桌面批 B 第 1 项随轮带入并补验（01:25）**：875c85a（(a) 方案实现：
    contracts DesktopCapabilitiesV1 壳自报＋preload capabilities.remoteBrowser
    ＋ImportPage 呈现门控；诚实声明＝无真实浏览会话不宣称端到端）。**验收
    记录**：桌面 check 全链复跑绿（50 文件 419 测试＋leak 159 零命中）。
    **登记偏差自纠**：该批合并时的 merge message 误写「collab only」——实际
    含 feat 实质提交，以本验收记录为准（message 已不可改，此处如实声明）。
- **015 §7 仲裁批（01:05）**：slot/wt-5 两批合并（数据 015 表态内联 80c40c1
  ＋状态）＋slot/wt-6 消化轮批（f657985）→ **015 §10 仲裁节落笔**：§7 读面
  方案＝采纳数据 A 形态（downloads.listCompleted 与守卫同源；否决渲染层聚合
  B 形态——两缺口成立，A7/W14 教训同型）；节奏＝数据契约先行照 IMP-3 惯例
  （冻结硬前置不豁免），批 B 采纳入口降级不阻塞，升版与核心 wire 批同窗最优。
- **proposal 015 受理批（00:45）**：slot/wt-3 两批先行合并（db62a00 提案 015
  ＋315f313 状态；slot/wt-6 空转消化批 737af91）→ **design-standard 双语升版
  0.7.0**（§8.3 素材导入独立页签语义＝015 §2/§3/§5 全数受理：云端段三入口、
  本地段 W18 迁移、仓储页纯条目管理收敛〔双轨头移除随 IMP-4〕、隔离徽标红线、
  零购买流 UI、remoteBrowser 两态判据；EN 镜像同步＋EN 标题 v0.6.2 滞留修正）
  ＋REGISTRY 行刷新（0.7.0/2026-09-10）＋015 内联「表态（集成）」节（§8.3
  升版受理＋**排期仲裁**：批 A 即刻开工授权；批 B＝核心 v0.4 wire 批＋清单
  提案两前置；IMP-4 解锁）。登记表 39/39 一致。
- **第二波验收（00:20–00:35）**：
  - **406fb3e**：slot/wt-6 环境半边批**验收合并**——f8fe114（installed-editor
    事实源，job.execute 受理预检环境半边，009 表态④；environment.rs 176 行
    ＋测试 63 行）。**验收记录**：复跑 62/62 workspace 全绿＋clippy 零告警；
    核心声明的「环境半边待接线」诚实缺口就此关闭；
  - **8bfa5b6**：slot/wt-2 核心 M6 路由批**验收合并**——f53704c（014
    project.import-copy wire 面：provider_host.rs 242 行＋project_ops_wire
    测试 379 行）。**验收记录**：013 冲突手工融合（环境双语注记节＋核心表态
    节并列保留——解冲突时一度引入重复标记块，已清理并复核全文无残留标记）；
    复跑 **63/63 workspace 全绿**（核心新增 project_ops_wire 套件）＋clippy
    零告警。桌面 T-C 写面接线（014 路由）与 T-B 读面钉 v0.2（核心表态①）
    均解锁；setNote 有条件立项草案＝等桌面 D-6 编辑范围确认（不猜测先行）；
  - **748feeb**：slot/wt-3 桌面两批**验收合并**——dfc113d（v0.4 TS 面：仅
    身份闭集＋generateVpm importCorrelationId 镜像；**同批守卫缺口修复**：
    isDesktopGatewayRequestV1 缺 case——setGlobalDefaultMode(v0.2)/import
    (v0.3)/production-use-case v0.2 十方法/project.import-copy(014) 声明于
    METHOD_KINDS 但被 router 一律 invalid_request 拒绝＝生产壳 live 链路
    不可用且 fixture-only 不可见；修复＝补齐全部 case＋**穷举回归表**（每
    方法断言最小合法请求放行））＋1ef9d4a（裁决 1 U6 销账：B8 呈现五项投影
    ＋B9 unavailable 两传输态；bytesText 进位/下标错位一档缺陷修复＋边界
    测试锁死）。**验收记录**：diff 审确认修复为补齐守卫 case 非放宽（各
    方法参数闭集校验保持）＋桌面 check 全链复跑绿（49 文件 415 测试＋
    boundary＋i18n＋contrast＋leak 159 零命中）；
  - wt-3/wt-5 状态收尾批合并（337046a main 同步＋34342ab 数据状态）——
    五分支清零，39/39 一致。
- **验收惯例改进（采纳桌面建议，自本批起生效）**：TS 面/词表登记类批次验收
  清单新增一项——「METHOD_KINDS 每方法守卫正例」（桌面穷举回归表已锚定，
  新方法漏 case 直接红）；本夜 dfc113d 缺口（声明与守卫漂移、测试无正例
  永不暴露）为直接教训。
- **2c0ba04**：slot/wt-4 产线维护批合并（ded2709，collab-only；三留言消化＋
  W25 窗口前就绪声明）；
- **171b00c**：slot/wt-6 环境双协议本批**验收合并**——a9657ea
  （project-inspection v0.2＋project-ops v0.1 协议本双语＋REGISTRY 登记主体
  改锚协议本行〔schema 目录由协议本头部引用——production-use-case 双件套
  惯例，BOARD 备选清单第 6 项兑现〕＋013/014 内联注记＋状态批）。**验收
  记录**：两协议本头部核验（0.2/0.1 已冻结＋零消费声明如实＋机器可读词表
  路径指向）＋REGISTRY 复验 **39/39 一致**（collab/docs 批免全量测试）；
- **W25 前置③实质核验（00:00）**：核心两对接细节答复内容闭环——①计划文档
  JSON 序列化归属核心 provider 侧（整文档序列化→UTF-8 透传 write_plan_file），
  Vec<u8> 二次序列化 bug 如实声明（此前该路径实际不可用，本刀修复＋消费测试
  钉死）；②收据转抄面（jobs[] 回显＋recoveryPoints＋steps 转抄＋
  source_fallback 双记录）＋job.execute 版本锁第一顺位落地（**环境半边待
  环境事实源接线＝如实缺口，窗口真机实证时如实表现**）；
- **核心误报观察销账**：brief 校验「文件缺失」观察基于旧基线（括号描述路径
  列问题），d4e156c 已修复并经 37/37→38/38→39/39 连续验证——无需新动作；
- **2c432e2**（上轮收尾）：slot/wt-5 v0.3 头部取代对齐批（数据 dcf1322）；
- **cd91b33**：slot/wt-3 桌面三切片**验收合并**——f282ecc（U9 导航实差三处：
  will-navigate 提示后放行转内嵌/setWindowOpenHandler 转内嵌/外部协议确认层
  四项＋伪协议拒；含 desktop 架构文档双语 1.1.0）＋9cafca3（裁决 11 自动取消
  联动）＋f8ddc5d（裁决 10 呈现层屏蔽，W14 零变更＋死代码清理）。**验收
  记录**：桌面 check 全链复跑绿（typecheck＋vitest＋build＋boundary＋i18n＋
  contrast＋leak 159 指纹零命中）；桌面三处诚实声明核可（手势门槛以逐次确认
  层等效承载＝比字面更严；Main 对话框英文四语化归 IMP-2；单测级不宣称
  端到端）。**REGISTRY desktop 行刷新 1.0.0→1.1.0**（桌面留言路由办理）；
- **产线批**：slot/wt-4 W25 预热 A1 缺口补齐**验收合并**——f7ff690 test-only
  （BridgeProductionJobTests.cs 255 行：exclude_object 环境条件断言，有 SDK
  ＝钉死 VRCMetaObject.excluded=true 全链；无 SDK＝exclude_marker_unavailable
  类型化诚实缺口；不注册替身类型）。**验收记录**：diff 审断言与声明一致＋
  归档核实（VUA-4/_local_w25/ 真机 EditMode 23/23 日志＋XML 在档，gitignore
  生效；证据性质＝预热非窗口证据——产线已如实标注）＋cargo -p vua-unity-bridge
  复跑绿；
- **354925a**：slot/wt-6 环境标识文件批**验收合并**——e885ecc（.vua/
  project.json 三态读〔unreadable＝证据〕＋import-copy apply 标记副本
  VUA-native〔裁决 9〕＋project-inspection **v0.2** 增量族升版，v0.1 已取代，
  零消费声明如实）。**验收记录**：复跑 62/62 workspace 全绿＋clippy 零告警；
  REGISTRY 冲突手工融合（环境侧 v0.2 行路径列再次混入括号描述——融合时剥除，
  已留言路由）。BOARD 契约表 project-inspection 行升 v0.2 现行；
- **b303678**：slot/wt-2 核心 W22 record-face 收口**验收合并**——8c7b6a4
  （job.execute 完整 Build Record v0.3 转抄：版本锁预检/digest 锚链真实化/
  planDeviations 类型化/recoveryPoints 快照/evidenceSummary 反查；**顺手修两
  真 bug**：uuid_v7 版本位 4→7〔生成 id 违反冻结 pattern〕＋计划文件二次
  序列化〔write_plan_file 恒拒，此前无消费测试〕）。**验收记录**：复跑
  62/62 全绿＋clippy 零告警；bug 修复如实声明核可。
## 阻塞
无。
## W25 前置最终确认（2026-09-09 23:55）
三前置**全部齐备**：①v0.2 冻结收口（16c59b3 合并＋核心 23:45 **正式确认**
）✅；②产线 Rust 物化（9195fbb）✅；③W22 实现切片写入面（c486318 冻结件＋
c31b01e 读面＋16a2dc5 编排＋**8c7b6a4 record-face 收口**＋两对接细节已答复）
✅。**开窗通知（晨起，O-2）**：操作者发出通知并请用户确认开窗；执行序 v3；
窗口＝证据生产环节，无真机证据不宣称端到端。
## 下次合并意图
本状态批（BOARD 契约表 v0.2 行＋状态，全 collab/）随轮免测；IMP 冲刺批验收
（F-2 门槛）；核心 M6 批（014 import-copy provider 实现）与环境词表路由批
（013/014 内联待核心三问）；W25 开窗通知晨起（O-2）；W26 门验收（3 轮
Reviewer 前置）。
## 留言
- [→桌面] **操作者指令：019 批 C 工单签发，可开工**（BOARD #21 行）——批 C
  生产链（两套 UI 共用解析/计划/任务/记录，对齐 M5 W20/W22/W24 接口）；
  前置已齐（核心侧接口均已交付验收：production-use-case v0.2 十方法＋
  对应读面全在 main）；**验收标准＝两套 UI 共用生产链且不用模拟替代未
  完成接口（诚实降级照 UI-08）**，完成条件对照 AC-05/AC-07/AC-13；交付
  后交集成验收；
- [→核心][→数据] **BG-1 映射语义表态请求**（015 §7 升级路由，桌面三选项
  A/B/C 见其状态文件）：recipe v0.3 期望态文档呈现进 M3 三视图的 state
  映射规则——集成初判 B 方向（服务侧投影照 017 §1）与架构一致，A 涉词表
  演进、C 有诚实风险（桌面自评不推荐）；两域表态后我仲裁。确认前三视图
  对库文档不做 state 渲染（桌面诚实现状）；
- [→桌面] **批 B-3 验收合并（6cbcb26）——IMP-2 交付面完成确认**。**IMP-5
  排期表态**：批 B 交付面已完成，IMP-5（验收与文档同步批：隔离冒烟清单/
  诚实空态核验/文档落账）可启动；其中**真机项**（BOOTH 下载域真机验证/
  内嵌浏览真实会话）留 W25 窗口后统筹（晨起 O-2 开窗时一并安排），非真机
  部分随时可做；
- [→产线] **#19 仲裁已落（016 内联「仲裁（集成）」节）**：三方表态齐照单
  采纳（存储面第五文档库锚 EvidenceStore／独立 inspection-queries v0.1 词表
  行／聚合与保留值纪律）；dependencies 维分层注记＝定义权在你（实现检查
  切片时显式选择声明完整性 vs 引用完整性消费层，写入冻结件）；冻结锚＝
  Bridge 五维产出操作落地（你的开工锚不变）；
- [→核心] **环境预检接线批验收合并（07166b7）——预检链三段完整确认**；
  W25 A2 约束语义路由已读（知悉——窗口 A2 按你方约束语义执行，产线主导）。
  013 读面路由排期维持你方声明；
- [→桌面] 批 A/B 翼验收史维持（823bd1c/6cbcb26 等）。BG-5 CI 化已交付
  （--registry-only 模式）——你领的工单若涉及 CI 观察无需动作；
  （无你的在途项）；013 读面路由（environment.getSnapshot 桩）排期维持你方
  声明；
- [→环境] 016 环境表态收讫并入仲裁（dependencies 事实源与语义边界＋两维
  无源确认）；BG-4 协作位履职完毕；无新请求；
- [→全体进程] **01:30 全员空转触发已登记，[需代裁] 累计 0，面板未召开（依据
  用户规则）**——按用户指令转入「提前做后方模块/Spike」：可领工单 **BG-1～
  BG-6** 见 BOARD 机制节（BG-4 已交付验收；BG-5 已交付；余 BG-1/BG-2/
  BG-3/BG-6 可领）；仅当本进程无更优先在途工作时经 collab:brief 自领，
  领取后在状态文件声明工单号，产出按验收标准交集成验收；
- [→桌面] 批 A 验收合并（823bd1c）＋浏览清单提案照准（booth.pm±子域＋
  booth.pximg.net，仅域名入库；与下载域分离维持）。批 B 前置更新：①v0.4 wire
  已交付并验收（cbde4b3/b4c78aa）——采纳入口去降级两翼剩数据读面（§10 仲裁
  已裁 bdl-queries v0.4，未就绪前维持 §6 降级）；②remoteBrowser 翻转＝(a)
  方案裁定（015 §11）——渲染层直读壳能力（preload/Gateway 自报），provider
  硬编码行由核心随你们批 B 移除，届时与核心对接；③0.7.1 措辞修正已落
  （57482ef——你指出的漂移准确）。setNote D-6 确认仍欠（013 内联）；
- [→核心] importDownloads wire 批验收合并（b4c78aa，63/63 绿）——(a) 方案
  裁定确认（015 §11）：`desktop.remoteBrowser` 硬编码行随桌面批 B 同批移除；
  015 §7 两问答复收讫（时间锚已兑现）；
- [→数据] §7 表态采纳（015 §10 仲裁）——bdl-queries v0.4 升版全套照 IMP-3
  惯例启动（Schema＋向量＋消费测试＋双语协议＋REGISTRY；核心命令面已接线
  cbde4b3，读面是批 B 去降级最后两翼之一），交付即验收；
- [→操作者→用户] **W25 开窗通知（晨起执行）**：三前置全部齐备＋窗口前增强
  落地（版本锁两半齐：核心半边 8c7b6a4＋环境事实源 f8fe114）——请确认开窗；
  窗口内执行序 v3，A3/B2a 交接点需用户启动 VRChat 客户端；
- [→桌面] 两批验收合并（748feeb）——守卫缺口发现与穷举回归表采纳为集成
  验收惯例（TS 面登记类批次必查「METHOD_KINDS 每方法守卫正例」）；bytesText
  缺陷修复知悉（量级降回正确档，无协议影响）。setNote 立项时序在你：D-6
  编辑范围确认后回复核心（013 内联草案等你的结论，不猜测先行）；13 项裁决
  桌面实现项全部落地确认（13 开发模式备稿随 IMP 冲刺批）；
- [→核心] 误报观察销账确认：你观察的「文件缺失」基于旧基线（REGISTRY 路径
  列括号描述问题），d4e156c 修复后连续三轮校验全一致，无需动作。两对接细节
  答复收讫并实质核验（前置③闭环）——版本锁环境半边缺口标注核可（窗口实证
  时如实表现即可，不阻塞开窗凭证）；013/014 内联环境三问表态请求维持；
- [→环境] 双协议本批验收合并（171b00c，39/39 一致）——BOARD 备选清单第 6 项
  兑现销账；REGISTRY 登记主体改锚协议本的形态正确（schema 目录行保留 v0.1
  已取代行＋协议本行并行符合治理触发器②）；
- [→桌面] 三切片验收合并（cd91b33）；REGISTRY desktop 行已刷 1.1.0（你方
  留言路由办理完毕）。IMP 冲刺继续（IMP-3 TS 面登记解锁维持——bdl-commands
  v0.4 已入库；Main 确认对话框四语化随 IMP-2 渲染层切片）；
- [→环境] 标识文件批验收合并（354925a，62/62＋clippy 零告警）——**REGISTRY
  行路径列请停止混入括号描述**（校验器把路径列整串当路径读；本次融合已再次
  剥除，括号描述放状态列或 commit message）；v0.2 消费路由三问在 013/014
  内联，已路由核心；
- [→核心] W22 record-face 收口验收合并（b303678；uuid_v7 与计划文件两修复
  如实声明核可）——W25 核心侧凭证确认收讫；M6 名下 014 provider 实现批随时
  交付随时验收；013/014 内联环境三问（v0.2 消费/备注写命令/拒绝码）请表态；
- [→产线] A1 补齐批验收合并；W25 窗口前状态＝三前置齐备，等晨起用户确认
  开窗——预热证据与窗口正式证据的边界标注核可（如实）；
- [→数据] v0.4 已入库（前轮）——候补切片①W23 存储实现②采纳配套自取。
