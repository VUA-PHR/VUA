---
proposal: 028
title: "面向用户/操作者的受管文档审计（M5 关门程序 W26 步骤 a 前置盘点——用户 2026-09-19/20 指令「找之前的对用户需求和操作文档，看有没有需要更新的内容」）"
status: 办理中（2026-09-20 第 124 批登记；第 127 批：#1/#2/#5 集成席位办理完毕、#4 候用户裁决维持登记、#3/#7 挂账、#6 零强制行动、#8/#9 已办、#10 候 W26-a；剩余待办见内联线程集成回复）
author: wt-main（集成，用户指令转述）
date: 2026-09-20
---

# 提案 028：面向用户/操作者的受管文档审计（W26 步骤 a 前置盘点）

## 背景

- **权威源**：用户指令（2026-09-19/20，W25 真机窗口批内）：「找之前的对用户需求和操作文档，
  看有没有需要更新的内容」——先出清单再更新。本审计即 outline 当前窗口 **W26 步骤 a
  （文档审查）** 的前置盘点；outline 双语 2.0.13 已随批登记 W25 开窗事实与本盘点（集成域内
  直接修订，AGENTS 1.1.4 例外 (a)）。
- **对照现实**：026 写面五链（A1–A5）全量落地并接线＋B 面项目兼容并入包管理器（IA 并入）；
  027 进行中（F1 文案修正已落、F2 词面冻结＋wire 接线已落、环境实现核对切片与桌面形状核可
  解锁、F3/F5/F4 候面序）；TICK v1.6（2026-09-19）；boot-splash 开屏＋通知中心毛玻璃面板
  两特性已入库（第 117 批）；U14 已落产品边界 1.4.0。
- **审计范围（用户指定七组）**：根 README（四语言）、`docs/README_ZH/EN`（文档导航）、
  `docs/product-boundary_ZH/EN`（1.4.0）、`docs/project-context_ZH/EN`、`docs/tool-catalog/`
  （双语单文件豁免件）、`docs/development-outline_ZH/EN`（2.0.12→2.0.13 本批已办）、
  `docs/design/design-standard`（0.7.5）。
- **纪律**：本批不直接改写他域文档；清单按「文档｜差距｜建议修订要点｜归属域」给出路由，
  归属域角色或其席位按清单逐项办理；涉及产品边界判断的候核对项如有缺口升 [需用户]。

## 审计清单

| # | 文档 | 差距（证据锚） | 建议修订要点 | 归属域 / 路由 |
| --- | --- | --- | --- | --- |
| 1 | 根 `README_ZH.md` / `README.md`（含 JA/KO 同位行） | ①`:13`「当前产品版本为 v0.5.0（pre-alpha）」——现行已发布 **v0.6.0**（M4 关门 2026-09-08，`docs/release/v0.6.0_ZH/EN.md` 在库），当前窗口 v0.7.0（M5）；②`:38`「桌面与 VR Overlay：基于稳定应用服务提供状态与引导」——product-boundary 1.0.0 已把 **VR Overlay 移出 `1.0.0` 组成**（v1.1 方向锚）；③两文与 JA/KO 均未提及包管理设置与 VCC/ALCOM 共享（U14）——高层文档可只在「环境与项目管理」条补一句并链接边界，避免复制边界细节 | ①版本声明改 v0.6.0（或改述为「以发行页为准」并链接 `docs/release/`）；②VR Overlay 加「（`1.0.0` 后方向锚）」限定；③可选：包管理器条补「包管理设置与 VCC/ALCOM 共享同一份设置文件」一句＋链接 product-boundary §5。四语言同步 | 集成（根 README 未登记受管、无版本头；W26-a 候治理判断是否纳管。列 [→集成] 下批办理） |
| 2 | `docs/README_ZH.md` / `README_EN.md`（文档导航，未登记受管，更新 2026-09-04） | ①「当前入口」清单停留 09-04 世代：`bdl-queries-v0.3`（现行 v0.4，另有 bdl-commands v0.4）、发行说明止于 v0.4.1（v0.5.0/v0.6.0 在库）、缺 packages 协议族（packages-query/packages-catalog/packages-ops v0.1–v0.5/packages-repo-catalog v0.1）、release-handoff v0.1、inspection-queries v0.1、editor-verify v0.1；②缺 development-outline、design-standard、project-context、REGISTRY 入口链接；③「按任务阅读」表 AMF/Recipe/Unity 行仍引 unity-bridge-v1（现行 v3）；④导航未提 `collab/` 协作机制入口（AGENTS.md 要求先读本导航） | ①「当前入口」按现行协议族刷新（补 packages 族＋bdl v0.4＋release-handoff＋inspection 族；unity-bridge 链接标注现行 v3）；②入口区补 development-outline／design-standard／project-context／REGISTRY 链接；③发行说明补 v0.5.0/v0.6.0；④头部「更新」日期随刷新改。注意导航自称「规范效力：定义公开文档入口与权威顺序」却未登记受管——W26-a 候治理判断纳管或改述 | 集成（列 [→集成] 下批办理；刷新后按治理决定是否入 REGISTRY） |
| 3 | `docs/product-boundary_ZH/EN.md`（1.4.0，2026-09-19，REGISTRY 行同步） | **核对结论：026/027 未引入已生效的边界修订需求**——U14（设置面豁免＋Recipe 驱动第一形态）已落 1.4.0；026 B 面 IA 并入属 UI 组织不属边界语义；027 F2 读面按协议本「后端指向根事实」专节＝生产根只读，不新增边界行为。两个**候核对项**（随 027 F4 冻结批起草对表）：①027 F4「手动刷新」写面＝刷新共享 Repos 缓存目录（027 内联 §6 只读取证已观察该家族在案：`Repos/` 含官方/精选清单＋GUID/包名缓存）——是否落在 U14 豁免（settings.json 仓库订阅＋本地包注册表面）之内需在 F4 冻结批定性，如判定豁免字面不覆盖升 [需用户]；②启停键位：**wt-6 已于 W25 窗执行只读静态取证（027 内联 §6，四选一结论＝(c) VCC 无启停位、元素内位证伪、vcc.liteDb 无 repo 表——F4 启停面冻结硬前置成就）**，F4 冻结批起草时按 (c) 结论＋环境设计提示（VUA 自有启停键不可放 userRepos[i] 元素内——`Settings::save` 五键闭集会剥自有键；宜置顶层 flatten 保留区或自有存储）对表定词面，边界语义无冲突无需改边界文档 | 无需现在改文档；两个候核对项挂账随 F4 冻结批起草对表（证据＝027 内联 §6 真机只读取证，2026-09-20），集成在验收时复核边界一致性 | 登记＝集成；候核对项 [→核心]（F4 冻结批起草输入）＋集成验收复核 |
| 4 | `docs/project-context_ZH.md` / `_EN.md`（Agent 交接摘要，未登记受管，更新 2026-09-01） | ①`:53`「VUA v0.4.0 是…」——现行 v0.6.0/M5 v0.7.0 窗口；②`:46-48`「进程内原生与受监督独立进程托管仍是候选」——托管决议已定（ADR `decisions/orchestrator-supervised-provider` 已接受并落地；进程内为可替换实现而非待决候选）；③「仍未裁决或尚未完成」清单（`:133-141`）大半过期：Orchestrator 托管决议（已定）、正式 CI（三 workflow 在跑）、BDL Schema（bdl v0.1／bdl-queries v0.4／bdl-commands v0.4 冻结）、包管理三路径能力矩阵（024–027 链落地）、Electron 首切片/安装包（v0.4–v0.6 已发行）；仍开放＝签名与更新机制、插件隔离执行、真机冒烟（W25）；④**EN 镜像 101 行 vs ZH 154 行——内容缺约三分之一，违反双语配对纪律**；⑤缺六 crate workspace 现实与六角色协作机制一段 | 两条路线候用户/集成裁量：**路线 A（推荐）＝随 W26 步骤 a 一并刷新**（更新版本现实、清理已完成项、补六 crate＋collab 六角色一段、EN 补齐镜像）；**路线 B＝声明为历史交接快照封存**（头部加「快照截至 2026-09-01，不再更新，现状以 outline/BOARD 为准」），零维护成本但保留误导风险 | 集成（该文属交接摘要；列 [→集成]，路线候用户在 W25 窗口内裁决或默认路线 A 下批办理） |
| 5 | `docs/tool-catalog/external/alcom-vcc.md`（双语单文件豁免件） | 正文 ZH `:21-23`／EN `:31-36`「VUA 不写入其注册表、数据库、设置或缓存／never writes their registries, databases, settings, or caches」与 **U14 直接矛盾**（VPM 包管理设置 settings.json 的仓库订阅与本地包注册表面＝VCC/ALCOM/vrc-get 共享、VUA 经裁决读写）；front-matter `status: planned`、`delivery: v0.8.0` 滞后——读面已落地（024/025 链）、设置面写面已落地（026 A3/A4＋U14） | ①正文补 U14 豁免句（对齐 product-boundary 1.4.0 措辞：豁免只及 settings.json 包管理设置面；`vcc.liteDb` 等其余存储面与项目文件面维持只读/禁止）；②status 建议改 `experimental`（或按目录语义评估）、delivery 注记「读面与设置面已随 024–027 落地」；③双语同步改。连带：`docs/compatibility/alcom-vcc_ZH/EN.md` 禁止清单同步补 U14 豁免注记（对齐边界 1.4.0 明确边界节） | tool-catalog 豁免件＋compatibility 矩阵——列 [→集成] 下批办理（边界 1.4.0 权威文本在集成域；桌面/环境如对措辞有立场可在 028 内联回复） |
| 6 | `docs/tool-catalog/`（是否需要新条目） | 核对结论：core（eac-process-recovery、environment-detection-and-deployment）与 external（alcom-vcc、avatar-optimizer、face-tracking、motion-tracking）条目用途级陈述与引擎扩展（检测项 18→23、VR 品牌组）不冲突；**候选新条目＝VUA 包管理器（vrc-get 库）**——倾向**不新增**：vrc-get 是内嵌库依赖（许可/再分发归 Cargo 依赖审计与 NOTICE），共享设置关系已由 alcom-vcc 条目（更新后）承载；如需给包管理器立 core 条目（社区可见的行为条目），候 028 内联讨论，不阻塞 | 无强制行动；alcom-vcc 条目更新见 #5 | 集成协调；条目立场候内联讨论 |
| 7 | `docs/design/design-standard_ZH/EN.md`（0.7.5） | **版本链核对一致，零行动**：头部 0.7.5＝REGISTRY 行（0.7.5，桌面，2026-09-19）＝changelog 0.7.5（F1 设置面文案纪律随行落账）；0.7.2→0.7.5 链连续（0.7.1 漏登记已在此前修正）。候表态项：boot-splash 开屏＋通知中心毛玻璃面板两特性（第 117 批入库）尚无 §8 呈现规则增补（Escape 跳过、reduced-motion 摊平、backdrop portal、capability 非 ready 整条不出现等实现内纪律是否成文归设计标准）——是否增补由桌面裁量，不构成本审计缺陷 | 零强制行动；§8.7/§8.x 增补候桌面表态（可在 028 内联回复） | 桌面 |
| 8 | `docs/development-outline_ZH/EN.md`（2.0.12→**2.0.13 本批已办**） | 当前窗口节无 W25 开窗事实、W25/W26 行无窗口状态注记 | 已随批修订：窗口状态段（W25 已由用户指令开启 2026-09-19/20＋W26-a 前置盘点落 028）＋W25/W26 行注记＋变更日志 2.0.13 双语；REGISTRY 行按 patch 升版免登记惯例不动 | 集成（✅ 本批已办） |
| 9 | `collab/BOARD.md` M 门状态表 | 门表有 M0–M4、M6、M7 行，**无 M5 行**（当前门状态散落前录文本）也无 M8 行 | 本批补 M5 行（开窗中 2026-09-08；关门候 W25 真机走查；W26 程序按 M4 先例：文档审查→门项核实→版本/发行/推送）；M8 行候 M8 临近或 W26-a 再补（避免预写未开窗门的表述） | 集成（✅ M5 行本批已办；M8 行留 W26-a） |
| 10 | 治理观察（汇总，不设行动项） | 根 README、docs/README、project-context 均未登记 REGISTRY、无版本头；docs/README 自称有规范效力——「受管」与「用户首读面」之间存在治理空隙 | 候 W26 步骤 a（正式文档审查）统一裁决：纳管（补版本头＋REGISTRY 行）或明示豁免理由 | 集成（W26-a 输入） |

## 执行序建议（候各归属域领取）

1. 本批已办：outline 2.0.13（#8）、BOARD M5 行（#9）、本提案登记（#42 行）。
2. 下批（集成席位，W25 窗内）：#1 根 README 版本/Overlay 句四语言、#2 文档导航刷新、
   #5 alcom-vcc 条目＋compatibility 矩阵 U14 句；#4 路线候用户裁决（默认 A）。
3. 挂账：#3 两个候核对项随 027 F4 冻结批起草对表；#7 候桌面表态。
4. 全部清单项办理完毕＝W26 步骤 a 的输入就绪；W26 程序仍按门序候 M5 关门条件。

## 内联讨论线程

（暂无回复。各归属域席位请按 `### 回复（<角色或 wt>，YYYY-MM-DD）` 追加；涉及边界措辞的
分歧升级集成仲裁，涉及产品判断的升 [需用户]。）

### 回复（桌面 wt-3，2026-09-20）

**#7 表态＝采纳成文，§8 增补候 W25 窗后桌面例行轮以 0.7.6 落地**：

- 范围：boot-splash（Escape 跳过、reduced-motion 摊平、列填充动效降级）＋通知中心
  （backdrop portal 定位纪律、capability 非 ready 整条不出现、终态通知默认不呈现与
  「显示已完成」开关、「清除是通知不是事实」、失败图形与关闭 ✕ 语义区分）。
- **W25 走查 D1/D2 两缺陷修复批（本日在 wt-3 落地）新增两条 §8 候文**：①通知行任务标题
  诚实投影——wire 无描述负载时以渲染层发起侧身份登记为标题、未登记任务如实给类型词
  「后台任务」，裸 taskId 不充当描述；②任务行打开语义——行主区点击＝回来源页，活动/
  终态两态一致，不静默无响应（任务详情面建成前的诚实形态）。增补随实现现实一并成文，
  故候窗后办理（标准应记载修复后形态，避免先成文再返工）。
- 时机理由：W25 真机窗口进行中，桌面席位优先走查发现项修复；design-standard 系受管文档
  （版本头＋REGISTRY＋双语镜像同步），候例行轮一次办理，不占本批。

### 回复（集成 wt-main，2026-09-20 第 127 批）

**#1/#2/#5 办理完毕，#4 维持候用户，另登记一处治理观察**：

- **#1 根 README 四语言已办**：四语言版本声明 v0.5.0→v0.6.0 并补 `docs/release/` 发行页
  链接（两选项并取，降低下次发行再腐化概率）；「桌面与 VR Overlay」行补「VR Overlay 为
  `1.0.0` 后方向锚」限定（对齐 product-boundary 1.4.0）；「环境与项目管理」条补 U14 设置
  面共享一句并链接产品边界（ZH/EN 链 `_ZH/_EN`；JA/KO 无边界镜像，按该文既有惯例链 EN）。
- **#2 docs/README 双语导航已办**：「当前入口」按现行协议族刷新（unity-bridge 标注现行 v3
  且注记生产路径 v2 继续生效、bdl-queries/bdl-commands v0.4、packages 族五行〔query v0.1／
  catalog v0.2／ops v0.5／repos-catalog v0.1／repo-catalog v0.1〕、project-inspection v0.2、
  project-ops v0.2、inspection-queries v0.1、editor-verify v0.1、production-use-case v0.2、
  release-handoff v0.1）；入口区头部补 development-outline／design-standard／
  project-context／REGISTRY 四链接；发行说明补 v0.5.0/v0.6.0；按任务阅读表 AMF/Recipe/Unity
  行 unity-bridge-v1→v3；补 `collab/README.md` 协作机制入口一句；头部更新日期 2026-09-20。
  **是否纳管 REGISTRY 留 W26-a 治理判断**（本批不擅自登记，导航自称的规范效力与未登记受管
  的空隙照 #10 维持登记）。
- **#5 alcom-vcc 已办**：条目 front-matter `status: planned→experimental`（先例
  eac-process-recovery）、`delivery: v0.8.0→v0.7.0`（024–027 链归 M5/v0.7.0 窗口）；双语
  正文补 U14 设置面例外句（对齐 product-boundary 1.4.0「明确边界」节措辞：豁免只及
  settings.json 仓库订阅＋本地包注册表面；vcc.liteDb 等其余存储面与项目文件面维持禁止）
  ＋落地注记（读面与设置面已随 024–027 落地，发行面候 v0.7.0）。连带
  `docs/compatibility/alcom-vcc_ZH/EN.md` 升 **1.3.0**：权威与硬边界节补「设置面例外」段＋
  禁止清单补豁免注记＋权威行刷至 1.4.0＋变更日志条目；REGISTRY 行同步（域归属保持环境，
  集成代笔修订在行注记与本回复声明）。capabilities/risk 未动（risk 由发布门派生，本批零
  capability 变更）。
- **#4 project-context**：路线 A/B 候用户裁决维持登记不代决（操作者 2026-09-20 注：候用户
  裁决项维持登记）。默认 A 不构成裁决。
- **治理观察（新增，并入 #10）**：`docs/README.md`（无语言后缀）系 b4 世代旧残留（头
  「范围：VUA 新仓库」、权威顺序含「用户当前明确裁决」等旧词、链接 product-boundary.md），
  与现行 `README_ZH.md` 大面积分叉——候 W26-a 与纳管判断一并处置（更新/重定向/移除）。
  本批不动它（028 清单未点名，避免超范围改写）。
- 授权链：用户 2026-09-19/20 指令「找之前的对用户需求和操作文档，看有没有需要更新的内容」
  （先清单后更新）＋操作者 2026-09-20 注「本拍可办」＋本提案执行序建议第 2 条；本批全部
  变更面在集成所有权域（docs/＋collab/），照 outline 2.0.13 判例随集成登记批落 main。

### 回复（桌面 wt-3，2026-09-20 F2 消费批随批）

**#7 成文提前落地＝design-standard 0.7.8（§8.9 全局件：启动开屏＋通知中心）**：

- 操作者 2026-09-20 节拍指派「028 [→桌面] 项如有余力一并办理」＋D1/D2 修复形态已在库稳定
  （标题诚实投影与行打开语义均已随实现落库并有钉例），原「候 W25 窗后」的时机理由消解，
  本批成文。
- 版本号顺延说明：0.7.6 系 wt-7 在途批（slice/desktop-i18n-player-language，用户批准的规则
  调整）、0.7.7 系本日 F2 消费切片（仓库发现呈现）——本批取 **0.7.8**，三批词面互不覆盖。
- 成文范围＝原表态全部四项＋D1/D2 两条候文＋portal 定位纪律（backdrop-filter 囚禁 fixed
  后代的 BOARD #38 教训、模糊只在全屏 backdrop）＋更新角标「只报有更新可用」＋面板关闭
  ✕／清除通知／失败呈现语义三分。ZH 权威＋EN 镜像＋REGISTRY 行同步，§12 变更记录载明。

### 回复（集成 wt-main，2026-09-20 第 128 批）

**#7 关闭＝0.7.8 成文经第 128 批 --no-ff 验收入库（合并 9eb77b6）；F2 消费切片随并入库，
操作者注请核的「诚实缺席即交付形态」口径裁决如下**：

- **#7 验收**：design-standard 0.7.7（§8.7 仓库发现呈现）＋0.7.8（§8.9 全局件）双语成文、
  §12 变更记录、REGISTRY 行 0.7.7→0.7.8 同步均核实；版本跳号三批（wt-7 在途 0.7.6／
  F2 消费 0.7.7／本批 0.7.8）词面互斥无实质冲突的登记成立。桌面席位 #7 就此关闭。
- **口径裁决（集成仲裁，操作者 2026-09-20 注点名核对）**：served 行
  `packages.repoCatalogOps` 处于 declared-none 期间，仓库分区「浏览可装包」入口**整块
  不渲染**（非禁用、非占位、非骨架）＝**诚实缺席，系合规交付形态，予以确认**。依据＝
  诚实纪律第 1 条（空态即终态：UI 只渲染 Gateway 实际返回的事实，缺席即设计空态）＋
  设计规范 2.6 无事实不渲染既定纪律＋A4 移除先例同款形态；门控链核实＝入口随
  `blocks.repoCatalog` 能力事实行门控（`repos/repoWrites/repoCatalog` 三行共管分区、
  浏览展开单独随 `repoCatalog` 行），declared-none 时该事实不存在，渲染层无事实可伪造。
  边界如实声明：此系静态代码口径确认——真机呈现仍候环境覆写置真＋操作者刷构建双前置，
  零端到端宣称维持。
- **验收随记（非阻塞登记偏差）**：消费切片申报「i18n 17 新键」经集成逐语实测＝**16 新键
  ×四语 parity 16/16/16/16**；第 17 键系复用既有 `catalogCachedData`（「缓存数据」目录
  词面，与切片自述「复用目录面板词面」一致），非新键。功能零影响，check:i18n 双检通过，
  登记口径以本条为准。
- 附带收编登记：同批 670828f（027 F2 形状核可九项落节）与 24965f3/4303609 一并入库；
  028 内联线程第 127/128 批与桌面两回复的时序排列维持 4303609 既有解决形态。
