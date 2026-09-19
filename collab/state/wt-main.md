---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 9b221ba
updated: 2026-09-20
---
## 当前焦点
**第 125 批（2026-09-20 03:4x–04:3x，W25 真机窗口批延续，非节拍，时段例外照用户 2026-09-19/20 指令）——紧急操作者批验收轮：两支实质修复批 --no-ff 收编（wt-2 环境检测探针修复批＋wt-3 W25 走查修复两批）＋wt-4 簿记笔核实已收编＋合并树定向复跑全绿**：

- **wt-2 环境检测探针修复批（W25 实测 E-1/E-2，基点 be16708）经 merge --no-ff 收编（合并 3381592b）**——三笔＝追平壳 42c3978（零自有内容，吸收 main be16708）＋修复批 1602ed4（恰 11 文件 406+/93-）＋状态批 a5d13cc。集成逐文件亲审通过：**E-1**＝unity_hub 探针候选列表化（`unity_hub_exe_candidates: Vec<PathBuf>` 用户级在前、机器级 `C:\Program Files` 在后）＋Uninstall 注册表 DisplayIcon 兜底（既有 win_registry 注入缝，HKCU/HKLM/WOW6432Node 三候选，子键 `Unity Technologies - Hub` 系用户机器只读取证真键名；解析剥引号与 `,<图标索引>` 后缀；任一命中即 Detected 带 `{exe, via: path|registry, registryKey}`；未命中如实记录探测清单——空态即终态）；**E-2**＝vpm_cli→vpm 改名＋VPM 能力语义（内嵌 vrc-get-vpm 0.0.16 恒在＝Detected 恒真，`EMBEDDED_VRC_GET_VPM_VERSION` 常量经 Cargo.lock 解析回归测试钉死不漂移；独立 CLI 降信息性 facts `{state, exe, version?, exitCode?}` 永不降条目）。**残留申报核实成立**＝PROBE_FAILED 仅存稳定错误码命名空间定义、零发射方（grep 实证）。**跨域同步面 6 桌面文件（任务明文授权）核对完整**＝CHECK_TITLE_KEYS `vpm: "vpm"`＋投影测试 engineIds/keyOf＋四语 i18n checks 键 vpmCli→vpm（能力题名四语齐）；全树零 vpm_cli/vpmCli 残留（1602ed4 世代 grep 实证）；checkId 系开集 string 无契约版本升降＝线面无损成立。新增 4 测试亲阅覆盖申报全部行为（Hub 双候选命中/未命中＋注册表三形状＋DisplayIcon 指向不存在文件诚实落空＋钉版锁步＋vpm 恒真跨四种 CLI 结局）。
- **wt-3 W25 走查修复两批（基点 920c01b，追平至 be16708）经 merge --no-ff 收编（合并 9b221ba4）**——五笔＝追平壳 fef3b59（零自有内容）＋修复批 ad6de34（桌面 17 文件 252+/16-）＋状态批 4436860（含 028 内联回复）＋修复批 05393b6（桌面 11 文件 265+/41-）＋状态批 add65c3。集成逐文件亲审通过，申报回归钉全数在位：**D-A 生产门组成修正**（用户裁决 2026-09-20「没有 ALCOM 或者没有 VCC 不应作为阻塞」＋库优先架构）＝`CREATE_GATE_IDS=["unity_editors"]` 唯一硬前置闭集＋`isCreateGateItem`＋`zoneSummaryItems` 计数口径（「还差 N 项」只数门内项，游玩辖区全量）＋`creatorEnvReady` 重写（results＋门内项在位且全 ok；门内证据缺席不开门＝无证据不判就绪）＋诚实文案四语两键组＋fixture 演示档 id unity→unity_editors 对齐；**D-B DEV 演示切换双根因修复**（DEV-gated 面生产路径零触碰）＝`devTargetButtonDisabled` 纯函数（按钮只在目标态已达成时禁用，旧表达式 live 基线双双锁死）＋`devPortStorageOp` 纯函数（档位-only 变更落盘；空 targets＋默认档仍移除键保全 live 复位）＋`DEFAULT_FIXTURE_TIER` 收敛；**D1**＝任务身份登记投影（task-identity.ts 渲染层会话登记，wire 零发明；未登记回落诚实类型词「后台任务」——裸 taskId 不再充当标题；新键 adoptDownload/unlabeledTask 四语齐；`"accepted" in outcome` 收窄对三形联合类型正当）＋warehouse 命令受理即登记三处；**D2**＝完成行点击回来源页（行主区实按钮＋aria-label＋九态单函数无状态分支无静默无响应）。一处注释措辞宽泛登记不阻塞＝deployer-model 注释提 alcom 系 packages 域管理器能力词非环境检测 id，行为面由 CREATE_GATE_IDS 精确驱动、与用户裁决原话一致。
- **wt-4 簿记笔 395c7d1（W25 冒烟备料状态批）核实＝已随第 124 批被动收编**（merge-base --is-ancestor 实证在库，第 124 批 incoming 清单已照 88d20ba/203cb9f 先例补全登记）——候验收状态消除，勿重复验收。
- **W25 真机语境专项推导核验（合并代码上静态推导）**：用户机器事实（wt-4 只读前置核实＋wt-2 取证在案）＝Unity Hub 机器级在位、编辑器 2022.3.22f1 双证在位、独立 vrc-get/VCC/ALCOM 缺。修复后链＝引擎 Create 区 unity_hub→Detected（候选 2 命中，注册表兜底同键名在位）、unity_editors→Detected（production_target）、vpm→Detected 恒真、vcc→NotDetected（信息性）；投影 detected→ok（PRESENCE_SEVERITY 闭集实证）；新门内恰 `[unity_editors: ok]`→`creatorEnvReady=true`→车间页开门、「还差 N 项」＝0、VCC 卡 warning 如实展示不挡门；旧组成下 vcc warning 即挡门——修复直接对症用户实测阻断。**静态推导不构成端到端宣称**——真机复验候操作者刷新核证（核证点见 wt-3 [→操作者] 留言）。
- **合并树定向复跑全绿（04:0x 本机亲测，main＝9b221ba4 合并将成树）**：desktop typecheck 双 tsconfig exit 0；@vua/contracts check 81/81；desktop vitest 全量 84 文件 753/753；orchestrator environment 套件 22/22；provider-host environment_snapshot_wire 2/2；project-manager environment_engine 1/1（1 ignored 照旧）；clippy 三 crate（orchestrator/provider-host/project-manager）--all-targets exit 0 零警告；check:i18n 三表对齐。**build/leak 未跑照 W25 文件锁先例如实申报**（用户 dev 栈运行中持 exe/dist 锁，零用户进程触碰；操作者刷新即得两批修复）。
- **BOARD 维护随批**：第 125 批前录入账＋前录轮换实际执行（保留 116–124＋125 恰 10 条，106 及更早条目靠 git 历史——第 124 批申报的轮换政策本批补办到位）；origin 推送记录随批补登。本批变更面＝两合并（实质 39 文件随两批入库＋两状态文件）＋collab 面（BOARD＋本状态文件）；零代码零 Schema 直改；簿记面免全量如实声明（合并树定向复跑即本批新鲜证据，读数见上）。
- **推送债处置（结局）**：接续第 124 批债（origin/main＝730259a 第 120 批世代），本批推送尝试 3 次（04:0x–04:1x 间隔重试）均失败＝同因 schannel SSL/TLS handshake failed（github.com 网络层不可达，非凭据问题）；按操作者指令三次上限用尽不空转；尝试时实测债 57 提交，本登记批落库后共 58 提交，下窗/brief 网络恢复后重试清债（结果已登记 BOARD origin 推送记录）。`?? _local_p27_devlog.txt` 照例不触碰。
- **诚实边界**：零端到端宣称维持——门开推导系合并代码静态推导，D-A/D-B/D1/D2 与探针修复的真机效果全部候操作者窗内刷新核证回填；W25 真机走查义务不变（产线冒烟路径候操作者按 O-2 执行序驱动）。

## 前录（第 124 批，2026-09-20 02:2x–03:2x，全文见 git 历史与 BOARD 前录）
面向用户/操作者受管文档审计清单落地（提案 028 登记，#42 行）＋三支 collab-only 候验收批收编＋wt-6 第二批（F4 启停键名只读真机核实，四选一 (c) VCC 无启停位＝F4 硬前置成就）收编＋outline 2.0.13 W25 开窗登记；推送债首记（schannel 网络层失败 4 次）。

## 阻塞
无。（github.com 网络层不可达维持＝推送债延续，非本地工作阻塞。）

## 下次合并意图
候各树状态批/切片批照常随轮验收（--no-ff）：wt-3 F2 形状核可候申请（双前置成就，026 程序九项逐项对照）；wt-6 F2 实现核对切片候交付；wt-2 F3 冻结批候领取（条件成就）；集成席位下批自领 028 清单三件（根 README 四语言＋docs/README 刷新＋alcom-vcc 条目与 compatibility 矩阵 U14 句）；project-context 路线候用户裁决（默认 A）。各树落后读数下窗 brief 复测，过 15 实质线照自理条款追平；推送债下窗/brief 恢复后重试清债。

## 留言
- [→wt-2] **环境检测探针修复批验收回执**：三笔（追平壳 42c3978＋1602ed4＋状态批 a5d13cc）已经第 125 批 --no-ff 收编（合并 3381592b）——E-1/E-2 本体＋冻结词面同步面亲审通过，残留申报（PROBE_FAILED 零发射方）核实成立，跨域 6 桌面文件同步完整性核对无缺；合并树定向复跑 environment 22/22＋clippy 0＋contracts 81/81 全绿。F3 冻结批候你方下批领取（条件成就）；F4 冻结批起草时两候核对项照前批留言对表。
- [→wt-3] **W25 走查修复两批验收回执**：五笔（fef3b59＋ad6de34＋4436860＋05393b6＋状态批 add65c3）已经第 125 批 --no-ff 收编（合并 9b221ba4）——D-A/D-B/D1/D2 亲审通过、申报回归钉全数在位；合并树定向复跑 vitest 84/753＋typecheck 双 0＋i18n 对齐全绿（build/leak 照第 117 批先例未跑，操作者刷新即得）。W25 真机核证点候操作者回填；F2 形状核可下一轮首项维持（零预核可）。
- [→操作者] **两批修复已入 main（3381592b＋9b221ba4），运行中 dev 栈（主检出）未触碰**——择机刷新构建后窗内核证：①Unity 在位、VCC/ALCOM 缺的机器装配页（车间）应可进入，环境部署-生产环境页「还差 N 项准备」只数 Unity，VCC/ALCOM 卡如实展示各自检测事实；②设置-实验性开发模式区「切到演示 fixture」在真实连接态可点、fixture 档位选择跨重载保持（会话级边界照旧＝整应用重启清零，设计如此）；③通知中心任务行呈人类可读标题（未登记任务呈「后台任务」类型词）、完成行点击回来源页；④环境检测 Unity Hub 行应呈已检测（机器级安装位命中）。发现项如实回填；产线冒烟路径（wt-4 备料）随窗推进。
- [→wt-4] 你方备料批 395c7d1 系第 124 批被动收编（is-ancestor 实证），候验收状态消除勿重复；W25 冒烟路径候操作者按你方脚本执行序驱动，A3 段 Unity 侧核证义务在肩。
- [→wt-5] 无新请求；F6 方向锚留意项维持，涉数据面立案时按席位办理。
- [→wt-6] 无新请求；F2 实现核对切片候即领（解锁维持）；开工前合并 main 最新（本批两合并入 main，探针修复不触你方切片面）。
- （历史留言已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
