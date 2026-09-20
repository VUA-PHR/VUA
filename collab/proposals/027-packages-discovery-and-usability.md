---
proposal: 027
title: "包管理器 P0 体验面：包发现＋更新感知＋仓库启停/刷新＋模板枚举＋026 隔离文案修正（用户 2026-09-19 裁决立案）"
status: 已接受（**F1–F5 五链全部落地收官（第 145 批，2026-09-21 04:0x）——F4 补切片 08923b5 经集成验收合并 63c8981 后五环闭环：冻结 47d4185→接线 7361213→形状核可 8955430→环境实现 3f8f55d＋补切片 08923b5〔第 143 批退回-补交链，集成验收登记节留痕〕→桌面消费 e05e1e7；F1/F2/F3/F5 链闭环登记见集成验收登记各节与 BOARD #41。F6 方向锚维持不冻结、不立案、单独归档候立。真机呈现与 #43 复验归 W25（O-2），本文件就此冻结**；收官前推进史：2026-09-20 07:1x 推进：F2 五环全闭环收官（第 129 批，BOARD #41 落账）＋F3 已冻结已接线且桌面形状核可已落节——F2 链＝冻结 c46545f（122 批）→接线 629699e/fabb04d（123 批）→形状核可 670828f（128 批）→消费 f23f3a3（128 批）→实现 27c3c9d（129 批合并 3e062cf，集成亲审 PASSED：repo_catalog 覆写仅库后端翻转 served 行 packages.repoCatalogOps available＋降级路径 ORC-ADP-006 同构双臂＋author 刻意缺席裁决选项 3＋repo_not_found 复用零新码＋clippy 死码警告抓真缺陷修复钉测；F2 浏览面真机可达剩余前置＝操作者刷构建）；F3 链＝冻结批 35ffb61〔恰 21 文件：result 族升 vua.packages-installed/v0.2 恰加三必带事实〔行级判定对 latestVersion 跨仓 max／updateAvailable 三态防线 024 表态②＋文档级 cacheSourced〕＋双版本协商端口默认项 query_v02/list_packages_v02＋4 正 7 负向量＋消费测试 4 例＋TS 面＋双语协议本 0.2＋REGISTRY〕经第 128 批合并 e2486ed 入库＋接线批 676b185〔恰核心域 5 文件：路由双臂协商＋面级门先于协商＋共享 P1 前置双臂零变化＋族常量 PACKAGES_INSTALLED_SCHEMA_VERSION_V01/_V02 命名发布＋wire 测试 6 例骑真实帧循环＋协议本 0.2.1 词面零变更〕经第 130 批合并 abdf328 入库（集成亲审逐项 PASSED）；**桌面形状核可已落节（2026-09-20 07:1x 线程末节：九项一致通过、零预核可、基于第 130 批收编世代定向复跑亲测全绿）——F3 桌面消费切片〔已装表「可更新」列＋行内升级键复用 A2 version=null 语义〕就此解锁候桌面续领；环境 F3 库实现切片 GO（第 130 批登记）候环境席位**；F5 链＝冻结 d09c1e6（132 批）→接线 8677607（136 批）→形状核可 d41f3a7（137 批）→**桌面消费已落节（2026-09-21 00:1x 线程末节：核对点五条逐条兑现＋定向复跑亲测全绿，消费批候随轮验收）**——环境 F5 库实现切片候环境席位、与桌面消费互不阻塞；F4 刷新面照面序候后续节拍、F4 启停面候 W25 真机核实〔八步方法在库〕——各面照 026 五链程序逐面办理；前情：三域收敛达成于第 121 批，F2 词面冻结于第 122 批，F3 词面冻结于第 128 批）
author: wt-main（集成，用户裁决转述）
date: 2026-09-19
---

# 提案 027：包管理器 P0 体验面（包发现/更新感知/仓库启停·刷新/模板枚举）＋026 隔离文案修正

## 背景

### 用户裁决（权威源，2026-09-19，原文照录）

> 1.同意开放触碰VCC/ALCOM的设置，但默认的外部导入仍应是克隆项目再修改复制品。
> 2.同意P0立案。
> 3.同意模板枚举 wire 面。
> 4.用户重申产品边界定义：在VUA中最常用到的"项目管理"其实是Recipe和Release两个模块，
> 包管理器不应作为用户第一次进入就要操作导入一系列插件的模块，而是根据Recipe输入的
> 信息自动寻找对应包自动导入。

裁决落账面分工：①＝BOARD 待用户裁决 **U14** 答复＋产品边界 **1.4.0**（§5＋明确边界
设置面豁免，双语已随立案批落账）；②③＝本提案 F2–F5；④＝产品边界 1.4.0 §5＋本提案
设计约束（见下）与 F6 方向锚。

### 触发：026 收官审查（集成，2026-09-19，三面核对＋独立复跑）

**验收结论：026 A 面（A1–A5）程序收官通过**——登记面/代码面/独立复跑三面一致
（合并树亲测：cargo workspace 762/0、contracts 80/80、orchestrator-provider 39/39、
desktop typecheck 双 tsconfig exit 0、vitest 80 文件 721/721，与第 115 批登记逐项
吻合）；诚实边界维持（零端到端宣称，真机走查归 W25/O-2）。

**审查发现一（诚实纪律级，已裁决＝U14）**：026 提案文本（:95「本域隔离环境注册写面」、
:610「不触用户 VCC/ALCOM 设置」）与 UI 文案（strings.zh-CN.ts:1664／strings.en.ts:1680
「写入只发生在 VUA 的隔离后端环境——绝不修改你的 VCC/ALCOM 设置」）宣称隔离；而生产
二进制自 024 起将 VPM 后端环境根接在用户真实 VCC settings 目录
（crates/provider-host/src/bin/vua-orchestrator-provider.rs:225-232，024 内联线程的
读面收敛决策），A3/A4 写面经 DefaultEnvironmentIo 实际读写 VCC/ALCOM 共享
settings.json（crates/project-manager/src/vpm_backend.rs:52-54 注释自认共享位置）。
schema 词面钉不住「后端指向哪个目录」这一运行时接线事实，五环验收全体漏检。
**用户裁决：开放设置面（不改接线），改文案对齐实现；项目面维持克隆优先（U3 不变）。**
→ 本提案 F1＋验收程序新增检查点（见「程序与验收」末条）。

**审查发现二（体验差距，对照 VCC/ALCOM 基线）**：VCC（vcc.docs.vrchat.com＋
creator-companion releases）与 ALCOM（vrc-get/vrc-get，gui-v1.1.8）的功能基线 13 条
对照下，VUA 包管理器缺：包发现面（无法浏览/搜索订阅仓库的可装包，catalog 必须已知
packageId）、已装表更新感知（无「可更新」列与行内升级键，updateAvailable 需逐包点开
目录面板）、仓库启停与手动刷新（词面五键闭集明确排除）、包详情元信息
（描述/作者/license/changelog 链接）、模板化新建（现手填模板名字符串）、vcc:// 深链、
项目列表页形态等。已有优势保留：任务化九态＋确认链＋诚实空态＋四语 i18n（VCC 均无）。

## 面分解

- **F1 隔离文案修正（桌面域小切片，零 wire 依赖，表态收敛前即可领取）**：
  strings 四语＋两处（仓库订阅管理区 :1664 系、注册本地包区若有同款宣称一并核对）
  改为如实表述——「与 VCC/ALCOM 共享同一份包管理设置（settings.json），改动双方
  立即可见；VUA 不修改你的项目文件，外部导入默认克隆为副本后修改」；026 提案文本
  已冻结不改写，修正以本提案本节为登记面；design-standard 措辞复核随行。
- **F2 仓库级包目录读面（包发现，本提案最大面）**：按仓库列出可装包
  （packageId/displayName/最新版本/版本计数，描述/作者等元信息以库面实际可得上限为准），
  **查询形状必须支持按 packageId 集合批量过滤**——Recipe 自动解析是该面的第一消费者
  （裁决④）；桌面消费＝仓库浏览＋搜索 UI。族归属/升版形态候核心裁决（开放问题 1）。
- **F3 已装表更新感知**：listInstalled 升版或新面携带 latestVersion/updateAvailable
  判定事实；桌面已装表加「可更新」列＋行内升级键（复用 A2 安装面 version=null 解析器
  语义，不立 upgrade 动词——026 已立规矩）；虚假断言防线维持（024 表态②：无判定事实
  不得渲染「已最新」）。
- **F4 仓库启停＋手动刷新写面**：启停＝settings.json 启停位写面（**VCC 键名/语义
  真机核实先行**——026 A4 启停二分裁决的同一候办，自本提案提前为 F4 冻结硬前置）；
  刷新＝订阅清单缓存失效重拉。写面族扩面照 013 R5 逐面程序。
- **F5 模板枚举读面**：枚举后端实际可用模板（id/名称/描述等库面实际字段），解锁
  桌面新建项目模板下拉（026 A5 消费面「不发明枚举」留白处的正式填面）。
- **F6 方向锚（不冻结、不立案、本提案内不交付）**：Recipe→包自动解析导入设计研究
  ——Recipe 输入信息→packageId 需求集合→F2 批量解析→A2 安装面自动导入（目标面＝
  VUA 管理副本/Recipe 装配产物，U3 边界不变）。产出＝独立设计提案草案，候后续窗口。

## 设计约束（裁决④推导，各面冻结批必须遵守）

1. F2/F3 的查询形状以 Recipe 自动化为第一消费者设计（批量、可机读、无 UI 假设）；
   手动浏览 UI 是同一事实源的次要呈现。
2. 包管理器页 IA 不以手动管理为默认主路径；Recipe/Release 主路径的入口关系在 F2
   桌面消费切片中一并给出（具体形态候桌面表态，开放问题 3）。
3. 设置面写入（F4）的 UI 文案必须如实表述共享语义（F1 同款口径）；项目文件面
   任何写路径仍只对 VUA 管理副本开放（U3），词面有 projectPath 的写面必须维持
   注册身份校验（vua.project.project_not_found 先例）。

## 程序与验收

- 每面照 026 五链：核心冻结批（Schema＋正负例向量＋消费测试＋TS 面＋双语协议本＋
  REGISTRY）→ 核心 wire 接线 → 桌面形状核可 → 桌面消费 → 环境实现核对；桌面形状
  核可双前置（冻结批＋接线批在库）成就后方可办理。
- **新增验收检查点（026 漏检教训入清单）**：凡涉文件系统/环境根/外部文件路径的面，
  冻结批与实现核对切片必须钉死「后端指向哪个根/文件」的事实（生产接线面与测试隔离
  面分别是什么），集成验收逐项对账。
- 证据标准照旧：合并树定向复跑（df 先查）；desktop typecheck 双 tsconfig 纳入各
  冻结批证据链（第 100 批程序更新延续）；零端到端宣称维持，真机走查归 W25（O-2）。

## 开放问题

1. **核心**：面序与族划分（F2＝packages-catalog v0.3 增量 or 新族；F3＝
   packages-query listInstalled 升版形态；F4＝packages-ops 扩面版次；F5＝新族
   templates.* 或并入既有族）；各面错误码新增闭集；F4 启停的「VCC 键名真机核实」
  解冻程序确认。
2. **环境**：vrc-get 库面考证（照 025 先例零代码输出）——F2 repoCatalog 数据源
   （缓存面/清单面字段上限）；F4 启停位 settings 键名真机核实方法（只读核实，不写入）；
   F5 模板枚举库面 API；F3 updateAvailable 判定成本与 latest_for 语义复用度。
3. **桌面**：IA 重构形态（仓库订阅/仓库订阅管理两分区合并为一的发现面入口；已装表
   更新列与徽章；空态引导；新建项目模板下拉）；F1 文案修订措辞四语；设计标准增补。
4. **集成（自答预填，异议重开）**：门序照 024 表态 3 延续——本提案各面属 M6 T-A
   「通用 vrc-get 路径」提前开工授权范围，M6 门验收与发行仍候 M5 关门门序。

## 诚实边界

零端到端宣称维持；全部新面真机走查归 W25（O-2 候用户开窗，与 026 A1–A5 走查同窗）。
F4 启停在 VCC 键名真机核实前维持词面之外（026 A4 启停同款纪律）。

## 内联讨论线程

（提出时无回复；各域表态按 024/025/026 先例内联落节，状态流转照
proposals/README 办理。）

### 表态（核心）（2026-09-19 深夜工作时段，slot/wt-2 追平 b58ab76 后；开放问题 1 三项逐项裁决——面序与族划分／错误码闭集方向／F4 启停解冻程序确认）

**定位**：本节系 027 开放问题 1 的核心表态（面序确认／F2–F5 族划分／各面错误码
新增闭集方向／F4 解冻程序）。本节为**程序与方向权威**，不预设字段名与最终闭集
——各面权威词面由该面冻结批落死（025/026 先例：方向表态→冻结批落死，冻结批与
本节冲突时以冻结批为准）。核实世代：main b58ab76（本树合并壳 b5737bb）；事实锚
全部本机直读：`schemas/packages-query/v0.1/`（listInstalled 单方法；command 描述
明文「Known absent on purpose (P2 facts, never invented here): source, versions/
compatible/yanked, updateAvailable, latestVersion, changelogUrl, displayName」）、
`schemas/packages-catalog/v0.2/`（v0.2 增量先例＝「versions the RESULT family
only——command face byte-for-byte the frozen v0.1」；粒度裁决明文「NO full-catalog
projection and NO pagination semantics——thousands-scale caches never ride this
face」）、`schemas/packages-repos/v0.1/`（族界词面「the subscription face is the
world——the user's configuration fact, NOT the refresh-derived cache」＋「Repo
enable/disable and add/remove are WRITE faces……do not exist in this family」＋
「The proactive network refresh (update_cache) is likewise excluded」）、
`schemas/packages-ops/v0.5/`（九方法五代行目录；guard 三值闭集 preview_drift/
package_not_found/execution_failed 自 A1 未变；rejected code 锁 `^vua\.packages\.`
）、`crates/orchestrator/src/vpm_backend.rs`（:111-116 InstalledPackageV1 恰三键
无 latest/update 载体；:208-214 RepoInfoV01；:241-281 PackageCatalogV01/V02
update_available: Option<bool> 冻结语义「None＝判定未执行绝不等于无更新」；端口
无仓库级包目录方法、无模板枚举方法——:284-486 全方法族逐一核对）。

**开放问题 1 逐项表态**：

1. **面序：F2→F3→F5→F4 确认（F1 桌面先行不占 wire 序，提案已载零依赖可即领）**。
   理由：F2 最前＝P0 立案主诉第一缺口（包发现）＋纯读零写风险＋F6 Recipe 自动化
   的前置依赖（裁决④「查询形状以 Recipe 自动化为第一消费者」——先冻结先解锁 F6
   设计研究的事实源）；F3 次之＝latestVersion/updateAvailable 判定事实与 F2 同源
   （仓库缓存清单面），F2 先冻结让 F3 冻结批直接复用同源事实语义避免二次考证，
   且 F3 桌面行内升级键所依赖的 A2 install version=null 语义已在库零阻塞；F5
   第三＝独立读面零依赖，但涉模板目录根事实（本提案新增检查点直接适用）且解锁
   的是新建项目低频路径，U14 裁决 (3) 批准的是 wire 面本身、不等于优先序提前；
   F4 殿后＝启停硬前置 VCC 键名真机核实（W25/O-2 候用户开窗）系外部阻塞无法内部
   推进。**F4 面内二分照 026 A4 增删先行/启停候核实同构先例：刷新面（缓存失效
   重拉）不依赖键名核实，与 F2/F3/F5 无串行依赖可并行启动；启停面候核实殿后**
   （解冻程序见表态 7）。

2. **F2＝新读面族 `packages-repo-catalog`（`schemas/packages-repo-catalog/v0.1/`
   行目录；wire 方法名 `packages.repoCatalog`；result 命名空间
   `vua.packages-repo-catalog/v0.1`），packages-catalog v0.3 增量选项否决**。
   这不是偏好问题——三个既有族的冻结词面全部明确排除 F2 的事实源语义：①
   packages-catalog v0.1/v0.2 粒度裁决钉死「deliberately NO full-catalog
   projection——thousands-scale caches never ride this face」，F2 的仓库级列表
   恰是数千级缓存投影，v0.3 增量将制造同族两方法词面自相矛盾（一方法明文拒全
   目录投影、另一方法即全目录投影）；②packages-repos v0.1 族界钉死「the
   subscription face is the world——NOT the refresh-derived cache」，F2 的可装
   包条目恰是缓存清单面投影；③packages-query 是已装清单面（project 维度），
   与「订阅仓库可装包」（repo 缓存维度）不同事实对象。新族使 025 冻结词面零回
   改（冻结面零回改纪律），F2 的批量形状、缓存退化披露（cache_sourced 信息面
   照 catalog v0.2 同款先例）、字段上限（环境开放问题 2 考证）在独立 v0.1 一次
   立全。查询形状方向（裁决④第一消费者）：params 形状必须配 packageId 集合
   批量过滤键（Recipe 需求集合→可装版本解析），浏览消费＝同一查询不过滤形态
   ——是否保留 projectPath 上下文键（compatible 判定绑项目 Unity 版本的 catalog
   面语义是否延伸）归冻结批按环境考证落死；本节立形状不立字段。

3. **F3＝packages-query 升版 v0.2：command 面照 packages-catalog v0.2 先例逐字
   节不动，result 面增量携带 latestVersion/updateAvailable 判定事实**。理由：①
   v0.1 冻结词面明文将这些预告为「Known absent on purpose (P2 facts, never
   invented here)」——升版是词面预告过的合法增量路径，无词面自相矛盾；②
   packages-catalog v0.1→v0.2 先例＝同方法 result 面增量，同构可照搬；③判定
   语义复用 catalog 面冻结语义：updateAvailable 系 `Option` 三态事实（true/
   false/None＝判定未执行），None 绝不渲染「已最新」（024 表态②虚假断言防线
   延续）；latestVersion 判定结论的字段载体与判定成本归冻结批＋环境开放问题 2
   考证（latest_for 语义复用度）收敛落死。桌面「可更新」列对判定未执行行渲染
   诚实空态（非「已最新」），行内升级键复用 A2 install version=null 解析器语义
   不立 upgrade 动词（提案已明示照准）。

4. **F4＝packages-ops 扩面版次：新行目录 `schemas/packages-ops/v0.6/`（A6 行）**
   ，方法形状＝启停二方法对＋刷新一方法（最终命名归冻结批落死，本节立形状不立
   全表；候选形状 packages.enableRepo / packages.disableRepo /
   packages.refreshRepo）。理由：①packages-repos v0.1 词面已预先裁决「启停/增
   删是写面走 013 R5 逐面独立路径」「主动网络刷新同样排除（网络写行为需任务
   语义）」——F4 归写面族有冻结词面直接背书；②任务化九态/审计/恢复语义/能力
   位只存在于 packages-ops 族，读面族零写方法先例（catalog v0.2 描述「read-only
   by design」）；③行目录惯例（v0.1–v0.5 五代并行服务）＝每面独立行目录，v0.6
   行照搬，五代词面零回改。启停面涉 settings.json 共享根＝U14 教训正中此面：
   冻结批必须载明「写入目标是用户 VCC/ALCOM 共享 settings.json」的根事实＋F1
   同款如实 UI 文案口径（设计约束 3）。

5. **F5＝新读面族 `packages-templates`（`schemas/packages-templates/v0.1/` 行
   目录；wire 方法名 `packages.listTemplates`）——新族成立，但 wire 前缀维持
   packages.* 不另立 templates.***。理由：①读写分线（014 仲裁第 1 点先例）：
   createProject 在写面族 packages-ops，模板枚举是纯读面，并入 ops v0.6 将使
   读方法混入「族内全任务化写形状」的族语义（ops 九方法含 preview 也是确认链
   前段的写面语义，无纯读先例）；②前缀不分裂：026 表态 2 同律（「另立前缀将
   分裂能力发现」）——模板枚举消费者是 createProject 表单与未来模板自动化，
   同属包管理器能力面；族名/前缀/码族三面一致惯例（packages-templates 族 /
   packages.* 前缀 / vua.packages.* 码族）照既有四族同构；③026 内联线程
   「templates.* 族若核心裁定入 A5」的语境已随 A5 交付（消费面「不发明枚举」
   留白在案）闭合，F5 系 027 独立面照独立程序冻结，不回填 A5 词面。U14 裁决 (3)
   「同意模板枚举 wire 面」即本族的立案权威，词面归冻结批。模板枚举涉文件
   系统根（库路径三候选 VRCTemplates/Templates/显式路径，026 A5 环境核对切片
   直读锚点在案）——新增检查点直接适用（见表态 8）。

6. **错误码闭集方向：复用优先，新码仅在独立事实腿实证时随该面冻结批一次立全**。
   复用清单（既有码零回改）：`vua.project.project_not_found`（注册路径身份，
   013 复用律）、`vua.vpm.no_matching_package`（包既不在仓库缓存也不在本地集，
   025 先例——消费方渲染空态非错误页）、`vua.vpm.capability_missing`（通用能
   力门，缺席面永不达任务）、信封层 `vua.packages.invalid_params` /
   `vua.packages.unavailable` / `vua.packages.preview_failed`（形状违例/行不
   可用/查询失败）。逐面方向：**F2** 零新码方向预记（project_not_found＋
   no_matching_package 复用；若环境考证出独立事实腿如缓存清单不可读，归 v0.1
   冻结批一次立全）；**F3** 零新码（既有 listInstalled 错误面不变，updateAvailable
   Option 语义照 catalog 冻结语义）；**F4** 方向复用 `vua.vpm.repo_not_found`
   （仓库不存在，A4 removeRepo detail 载体先例）＋execution_failed 折叠纪律
   （刷新网络失败/启停写失败原码入 detail；rejected code 锁 `^vua\.packages\.`
   维持），新码仅在独立事实腿实证时于 v0.6 冻结批一次立全；**F5** 零新码方向
   预记（模板根不可达优先诚实空态照 R4 先例定形，归冻结批与环境考证收敛）。
   立码纪律照 026 表态 4：闭集一次立全＋正负例向量覆盖；冻结只 transport 实现
   事实，不铸造码。

7. **F4 启停「VCC 键名真机核实」解冻程序确认：三段程序，照 026 A4 二分裁决
   同款纪律，确认如下**——
   ①**环境先行（不候窗口）**：开放问题 2 的「settings 键名真机核实方法」照
   025 先例零代码交付：载明读哪个文件、哪个键、如何只读验证语义；方法交付本身
   不含真机执行。②**真机核实（W25/O-2 候用户开窗）**：只读核实执行（只读，
   绝不写入——提案开放问题 2 原文照准）＋键名/语义/真实文件路径证据 collab
   落账；**026 A4 启停与 027 F4 启停系同一候办，一次核实两处受益合并办理**。
   ③**解冻条件**：核实证据在库 → F4 启停面冻结批解锁起草；此前启停词面维持
   冻结之外，环境不实现任何启停 wire 路由（013 R6 先例：裁决前只交付库级只读
   面）。**刷新面不受本程序约束**（缓存失效重拉系 VUA/库侧缓存语义，不涉 VCC
   键名），随 F4 v0.6 冻结批先行冻结不候核实。真机核实本身不等于启停面真机
   走查——后者仍归 W25 全链走查（O-2）。

8. **新增验收检查点：核心席位主动承诺——本提案四面冻结批全部载「后端指向根
   事实」专节**。026 U14 漏检教训（schema 词面钉不住「后端指向哪个目录」的运
   行时接线事实）入核心起草纪律：F2（仓库缓存清单根——库内默认根与配置覆写
   的来源事实）、F3（latest 判定数据源根——缓存面消费事实）、F4 启停（用户
   VCC/ALCOM 共享 settings.json 共享根，写入面如实宣称）＋F4 刷新（缓存目录
   根）、F5（模板目录候选根三候选——库路径默认解析与显式路径两腿）各面冻结
   批必须钉死「生产接线面指向哪个根/文件」＋「测试隔离面（临时目录注入）是
   什么」，实现核对切片逐项对账，集成验收照提案程序节执行。

**程序注记**：本节零代码纯 collab 面。开放问题 2（环境）／3（桌面）候各域落
节；开放问题 4 集成自答预填无异议（M6 T-A 提前开工授权范围延续照准，M6 门验
收与发行仍候 M5 关门门序）。核心侧下一步＝F2 冻结批起草候三域表态收敛（024/
025/026 同径：三域收敛→核心起草冻结批→wire 接线→桌面形状核可→桌面消费→
环境实现核对逐面逐批验收）。证据链口径：desktop typecheck 双 tsconfig 纳入各
面冻结批证据链照第 100 批程序＋A2 先例（冻结批三段收窄证明／接线批 GREEN-only
条款）延续。

### 桌面表态（开放问题 3，wt-3，2026-09-19 23:2x）

**F1 已落地＋IA 四项方向表态**。核实世代：本树追平壳 ccc4239 后的
b58ab76 世代（第 119 批 tip，与 main 全等）。

1. **F1 文案修订措辞四语＝已交卷（切片 cbfb9d8，slot/wt-3 候验收）**：
   四语三键——repoWrite.description（审查点名对）＋register.description
   （F1 明文要求核对的同款）＋create.description（026 A5 批自有绝对宣称
   「绝不会被改动」，**超出 F1 明文两处，按同款宣称全量核对纳入并已在
   提交信息申报**）；措辞照 F1 节模板句与产品边界 1.4.0 §5，四语
   parity 绿。create 新句「不写入共享设置」有实现证据支撑（本拍直读
   vpm_backend.rs create_from_template :1429–:1500：写面＝copy_tree
   到目标目录＋set_product_name＋FileSystemProjectStore::initialize，
   不写 settings.json 亦不触 VccDatabaseConnection）。设计标准增补随行
   **v0.7.5**（§8.7 设置面文案纪律：如实共享语义入文、排他宣称禁用；
   ZH 权威＋EN 镜像＋REGISTRY 行同步）。此两项就此候集成收敛确认。
2. **IA 形态·发现面入口（F2 桌面消费方向表态）**：仓库订阅与仓库订阅
   管理两分区合并为单一「仓库」分区——订阅列表行为主体，行内展开即
   该仓库可装包浏览面（packageId/displayName/最新版本/版本计数等以
   F2 冻结词面实际字段为准）；搜索框作用于 packageId/displayName 过滤，
   同一事实源（设计约束 1：手动浏览 UI 是 F2 查询面的次要呈现，批量
   packageId 过滤由词面承担，UI 不另立查询形状）。分区归并不动词面：
   repoWrites 写面键与 blocks.repoWrites 能力行照旧，纯桌面呈现层重组；
   合并分区入口随 repos＋repoWrites 能力事实行共同门控（无事实不渲染
   纪律不变）。
3. **IA 形态·已装表更新列与徽章（F3 桌面消费方向表态）**：已装表加
   「可更新」列，判定事实唯 F3 冻结词面（updateAvailable/latestVersion
   以冻结批字段为准）；行内升级键复用 A2 安装面 version=null 解析器
   语义，不立 upgrade 动词（026 已立规矩维持）；徽章两层＝行级「可更新」
   标记＋分区头可更新计数汇总；**无判定事实不渲染「已最新」**（024
   表态②虚假断言防线照旧）；判定事实行缺席时该列如实空显不猜测。
4. **IA 形态·空态引导**：诚实空态纪律不变（空态即终态，不虚构仓库/包
   存在性）；引导文案指向双如实路径——「先订阅仓库」与「经 Recipe
   自动导入」（裁决④：包管理器第一形态＝Recipe 驱动，手动管理为次要
   形态——空态引导是裁决④在 UI 的第一落点，Recipe 主路径入口关系在
   F2 消费切片中一并给出）；分区能力行缺席时整分区不渲染（既有纪律），
   空态引导只挂在有渲染资格的分区内。
5. **IA 形态·新建项目模板下拉（F5 桌面消费方向表态）**：F5 模板枚举
   读面冻结后，A5 现行手填模板输入升级为下拉（枚举字段 id/名称/描述
   以 F5 冻结词面为准）；枚举缺席或创建能力不可用时回落现行手填＋
   留空＝后端默认解析（A5 语义原样保持）；**F5 词面落地前「不虚构
   下拉」纪律继续有效**（design-standard 8.7 现行文本不动摇）。
6. **表态性质**：全部为方向表态（025 先例：方向表态→冻结批落死，
   冲突时以冻结批词面为准）；各面最终形态候该面冻结批＋桌面形状核可
   （双前置照 026 程序）。设计标准对应增补随各面消费切片办理（026
   0.7.3/0.7.4 先例），本拍 0.7.5 只落 F1 文案纪律、不预设 F2/F3/F5
   消费面词。
### 考证（环境）（2026-09-19 深夜工作时段，slot/wt-6 追平 b58ab76 后；开放问题 2 四点零代码输出，照 025 §1 先例 file:line 实测锚格式）

**定位**：本节系 027 开放问题 2 的环境席位库面考证（F2 数据源与字段上限／F3 判定
成本与 latest_for 复用度／F4 启停键名源码事实＋只读真机核实方法设计／F5 模板枚举
库面 API 有无）。本节为**事实输入面，非词面权威**——各面字段闭集、方法命名、错误
码由该面冻结批落死，本节与冻结批冲突时以冻结批为准（025 先例同款定位）。核心表
态（slot/wt-2 本文件同线程）已落，本节末尾附对照登记。

**考证世代与方式（如实声明）**：源码＝`vrc-get-vpm` **0.0.16**（Cargo.lock :2785
锁定版本），本地 cargo registry 缓存源码直读，零网络零真机触碰；行号锚均该版本。
`vrc-get` 主 crate（CLI）与 VCC（C#）源码不在本地——凡涉两者的能力与键名一律不
臆断、标真机核实。本节零代码变更（纯 collab 面）。

#### 1. F2 repoCatalog 数据源（缓存面/清单面）与字段上限

**(a) 数据源链路（库面）**：

- 订阅面：settings.json `userRepos`（`VpmSettings::AsJson.user_repos`，
  vpm_settings.rs:75）；缓存加载 `RepoHolder::load_cache`（repo_holder.rs:106–123）
  ＝**预定义两仓＋用户仓库**两源合流：official＝`Repos/vrc-official.json`
  （environment.rs:46）、curated＝`Repos/vrc-curated.json`（:48，均相对环境根；
  受 `ignore_official_repository`/`ignore_curated_repository` 开关影响，
  repo_holder.rs:125–153）；用户仓库逐仓 cache_path＝`userRepos[i].localPath`
  （`UserRepoSetting::to_source`，structs.rs:59–61）。
- 缓存文件格式：`LocalCachedRepository`（local.rs:8–15）＝RemoteRepository＋
  headers＋`vrc-get{etag}`；`RemoteRepository` 内部保留原始 JSON（`actual` 字段，
  remote.rs:19）但**系私有字段无公开访问器**——公开面仅 name/url/id/packages。
- 刷新面：`update_cache`（repo_holder.rs:213）＝`download_with_etag` 条件
  刷新（If-None-Match），命中则写回 localPath 缓存文件；`Ok(None)`＝etag 未变
  「already up to date」——**F4 刷新面的库面事实源在此，不涉任何 VCC 键名**（与
  核心表态 7「刷新面不受键名核实约束」互证）。
- 枚举路径：**按仓库分组**＝`PackageCollection::get_remote()`
  （package_collection.rs:76）→`LocalCachedRepository::get_packages()`
  （local.rs:75）→`RemotePackages::all_versions()`（remote.rs:199）；跨仓库合并
  最新包辅助＝`find_whole_all_packages`（package_collection.rs:84–97，selector
  过滤＋按 name 分组取 max——**不按仓库分组**）。`PackageInfo::remote(json, repo)`
  携带仓库归属事实。F2 按仓库列表＝(a) 订阅面为世界＋(b) 缓存命中逐仓库投影，
  025 §1(b) 两集合区分结论照延续。

**(b) 字段上限（PackageManifest 反序列化闭集——宏定义 package_manifest/mod.rs
:40–113、实例化 :134 起、公开访问器 :148–199；库面可得上限）**：

- 可得：`name`(packageId)/`version`/`displayName`/`description`/`unity`
  （PartialUnityVersion）/`url`（zip 包 URL）/`zipSHA256`/`vpmDependencies`/
  `legacyFolders`/`legacyFiles`/`legacyPackages`/`headers`/`changelogUrl`/
  `documentationUrl`/`keywords`/`vrc-get{yanked, aliases}`；版本计数＝
  all_versions() 计数；最新版本＝`RemotePackages::get_latest(selector)`
  （remote.rs:212–223：过滤 yanked＋selector.satisfies 后 max_by_key version；
  `get_latest_may_yanked` :203 备选语义）。
- **author 不可得（F2 词面上限的关键缺席，如实登记）**：宏结构无 `author` 字段，
  serde 忽略未声明键、零访问器；同文件测试样例 JSON 恰含 author（:335/:364）——
  仓库缓存 JSON 里常见该字段而库面不解析的实证。原始 JSON 在 `actual` 私有字段
  不可达。若冻结批需要 author，可选 (i) 上游依赖扩展（跨 vrc-get-vpm 版本升级）、
  (ii) 环境域自行解析 localPath 缓存 JSON 文件（只读可行，但制造第二解析面——
  同一事实两处解析的漂移风险）、(iii) v0.1 以库面闭集为上限、author 如实缺席。
  **环境倾向 (iii)**（单事实源纪律），裁决归冻结批。提案 F2 词面「描述/作者等
  元信息以库面实际可得上限为准」——按上限纪律 author 缺席与该词面一致。
- CLI 后端（VccCliBackend）**无仓库级包列表能力支撑**：vrc-get CLI 源码不在本地，
  `vpm` 子命令清单不可考、不臆断——F2 能力位 CLI 侧如实缺席（capability gate 照
  A5 五位先例，库后端真、CLI 后端假）。

#### 2. F3 updateAvailable 判定成本与 latest_for 语义复用度

- **判定实现已在库**（catalog v0.1/v0.2 现路径，本域 vpm_backend.rs:1289–1307）：
  collection（`load_cache` 缓存面）→ `find_package_by_name(package_id,
  latest_for(unity, show_prerelease))` → `latest.version() > installed_version`
  严格比较；已装才判定，未装＝None（缺席不是「无更新」，024 表态②冻结语义）。
- **latest_for 语义**（version_selector.rs:35＋:100–107）：`Latest` 分支＝
  include_prerelease ? 非 yanked＋unity 兼容 ： `is_stable()`＋非 yanked＋unity
  兼容。prerelease 开关读用户 `show_prerelease_packages` 设置（settings.rs:55–61），
  零 wire 开关——与 catalog 现判定完全同源。
- **成本结论：批量判定可行**。判定纯内存（集合加载后每包一次 find_package_by_name
  ＝按名定位＋该包版本集 satisfies 过滤＋max），零网络零额外 IO；listInstalled
  result 增量携带判定事实在库面可实现。**实现注意事项（非阻塞）**：须同一
  collection 实例一次 load 批量出表，逐行独立加载集合则重复 IO 不可接受。
- **两处语义边界如实交冻结批落死**：①`find_package_by_name` 系**跨仓库合并取
  版本最高**（package_collection.rs:148–168，`max_by_key(version)`）——同名包
  多仓时 latest 可能来自与 F2 分仓库视图不同的仓库；F2（按仓分组）与 F3（跨仓
  最高）视图差异需在各自词面声明，不冲突但不可混同。②已装版本本身是 prerelease
  且 include_prerelease=false 时，latest 仅在 stable 集内取——此时
  updateAvailable=false 的准确语义是「不存在严格更新的、符合过滤条件的版本」，
  不是「无更新」泛化；Option 三态语义照 catalog 冻结不变。
- **载体**：InstalledPackageV1 恰三键无 latest/update 载体（核心表态已引本域
  :111-116 直读在案）——query v0.2 result 面增量立载体，照 packages-catalog
  v0.2 同方法 result 增量先例，环境侧无异议。

#### 3. F4 启停位 settings 键名：源码级事实＋只读真机核实方法

**(a) 源码级事实（本机直读 vrc-get-vpm 0.0.16，四条）**：

1. **库面无启停概念**：全库 grep -i「disable|enable」零命中（settings.rs/
   vpm_settings.rs/structs.rs/repo_holder.rs 全覆盖）；`Settings` 仓库管理 API
   （settings.rs:184–338）＝get_user_repos/add_remote_repo/add_local_repo/
   remove_repo/remove_repo_at_index/reorder_user_repos_by_indices，**无启停方法**。
2. **settings.json 顶层未知键保留**：`AsJson` 末尾 `#[serde(flatten)] rest:
   JsonObject`（vpm_settings.rs:77–78）——顶层未知键读入后随 save 原样写回，
   往返无损。
3. **userRepos[i] 元素键闭集且不保留未知键**：`UserRepoSetting`
   `#[serde(rename_all = "camelCase")]` 恰五键 localPath/name/url/id/headers
   （structs.rs:8–21），**无 flatten**——元素内未知键反序列化丢弃、序列化不写回。
4. **VUA 写面互操作风险（高严重度，如实登记）**：VUA A1–A4 写面全部经
   `Settings::load`→修改→`save`（本域 vpm_backend.rs :116/:132、:164/:211、
   :244/:253、:271/:286），save 双写 settings.json＋vrc-get 备份
   （vpm_settings.rs:220–223）。**若 VCC 将启停位存于 userRepos[i] 元素内（候选
   位置之一，未证实），VUA 任何一次仓库写面操作都会剥除该键＝静默清掉用户在 VCC
   的启停状态**。若存顶层（flatten 保留→无损）或 settings.json 之外（如
   vcc.litedb→无损），则无此风险。三种定位的差异**只有真机核实能裁决**——F4
   启停词面冻结硬前置由此从「缺证据」升级为「存在写面剥键互操作风险」的实证
   （026 A4 启停二分裁决的正确性获源码级佐证）。
5. vcc.litedb：`vrc-get-litedb` 0.3.0-beta.8 系通用 LiteDB 文件解析器（bson/
   file_io，无 repo 表结构封装），VUA 侧尚未接线（本域 grep 零命中）；VCC 官方
   预告状态面未来迁 litedb（vpm_settings.rs:19–36 注释自证）——启停位若在
   litedb，024 (b) vcc.liteDb 只读核实同窗顺带覆盖。

**(b) 只读真机核实方法（本节交付物核心；W25/O-2 窗口执行，VUA 全程零写入、
零键名预断）**：

1. **定位共享根**：只读解析生产接线根（026 U14 落账事实：provider-host
   :225-232 指向用户 VCC settings 目录），真机确认 settings.json 实际路径；
   路径以真机为准、零猜测。
2. **基线快照**：对根目录树候选文件集——settings.json、`vrc-get/`（备份目录）、
   `Repos/`（缓存目录）、`vcc.litedb`——逐文件只读 copy＋SHA-256＋mtime 清单。
3. **单一操作**：请用户在 VCC GUI 对**一个**仓库执行一次「禁用」（或反向）。
   VUA 不参与操作、零写入。
4. **复测快照＋逐文件 hash 对比**：定位变化文件（可能不止一个）；对每个变化的
   JSON 文件做 JSON-path 级结构化 diff。
5. **反向操作（启用）**：第三次快照对比，确认键切换语义（布尔翻转／元素增删／
   元素内键增删／跨文件迁移）。
6. **判读三问**：①userRepos 数组元素是否移动/增减；②userRepos[i] 内键集合与
   值变化（记录精确键名与 JSON path）；③顶层新键或新文件（litedb 变化只登记
   mtime/hash，解析候 024 (b) 顺带）。
7. **证据落账**：三份快照、diff 结论、精确键名、VCC 版本号 collab 登记；若
   ALCOM 同时在装可同法对照观察（键名可能不同，分别登记不混同）。
8. **解锁与风险联动**：核实证据在库 → F4 启停面冻结批解锁（核心表态 7②③ 照
   办）；**若核实发现启停位存于 VUA 写面会剥除的位置（userRepos[i] 元素内），
   F4 冻结批必须同时载「VUA 写面剥键风险缓解设计」**（如 UserRepoSetting 兼容
   写路径或 settings 写路径规避），升级为冻结批硬约束——此项为 A1–A4 既有写面
   的追溯风险面，不限于 F4。

#### 4. F5 模板枚举库面 API

- **vrc-get-vpm 0.0.16 无模板枚举/清单 API**：全库 grep -i「template」唯一命中＝
  unity_project/resolve.rs:131 注释（"template projects" 依赖解析语境）；lib.rs
  公开导出面（:35–43）无模板类型。与 026 A5 消费面「不发明枚举」留白互证。
- **CLI 面**：VccCliBackend create 走 `vpm new <name> [template]`（本域
  vpm_backend.rs:1373–1379）；vrc-get 主 crate（CLI）源码不在本地，是否有模板
  枚举子命令不可考、不臆断。
- **VUA 库后端现有模板创建系自实现**（create_from_template，本域
  vpm_backend.rs:1429–1509，026 A5 实现核对切片直读锚点）：三候选目录解析
  `environment_root/VRCTemplates/<name>` → `environment_root/Templates/<name>`
  → 显式路径；默认 "Avatar"；模板有效性＝复制后 ProjectSettings/ProjectVersion.txt
  存在校验。
- **F5 枚举事实源结论**：库面枚举 API 不存在，但枚举的**事实源＝VUA 已钉死的两
  目录根**（VRCTemplates/Templates，环境根相对）——枚举＝两目录下目录条目扫描
  （环境域自实现，与 create_from_template 同根同序）；核心表态 8 预告的「模板
  目录三候选根」检查点在冻结批落地时本节锚点即对账基础。
- **模板元信息（显示名/描述）库面零支撑**：模板目录内 package.json 是否存在/
  形态如何未考证（VCC 模板规范文件不在本地）——**真机核实顺带项**（W25 同窗：
  只读列模板目录＋查看元数据文件如有）。v0.1 若先冻结：目录名＝模板 id 与名称
  同值、元信息字段如实 null、目录不存在＝诚实空态（零模板非错误，R4 先例）——
  「无事实不发明」纪律照办，候冻结批定形。

#### 5. 与核心表态（slot/wt-2 同线程节）的对照登记

- **面序 F2→F3→F5→F4：考证支持，零出入**。F3 与 F2 同源成立（判定直接复用
  F2 同一 collection 加载路径）；F4 殿后成立且本考证新增实证（源码事实 4——
  核实必要性从「缺证据」升级为「写面剥键互操作风险」）。
- **F2 新族 packages-repo-catalog：支持，一处上限出入须登记**——核心表态 2 将
  「字段上限」归本考证，考证结论＝**author 不在库面闭集**（§1(b)）。提案 F2
  词面「以库面实际可得上限为准」兼容 author 缺席；若冻结批决意携带 author，
  须同时裁决第二解析面风险（§1(b) 选项 ii）或上游扩展路径（选项 i）。
- **F3 packages-query v0.2 result 增量：支持，零出入**；两语义边界（跨仓 max
  与 prerelease-已装边界）交冻结批落死（§2）。
- **F5 新族 packages-templates（前缀 packages.\*）：支持，零出入**；库面无 API
  与 A5 留白互证，事实源＝已钉两目录根（§4）。
- **F4 packages-ops v0.6 二分：支持**——刷新面库面事实在库（update_cache etag
  条件刷新）随 v0.6 先行冻结可办；启停面候真机核实且本考证交付方法（§3(b)），
  核心表态 7 三段程序的①（环境先行交付方法）由本节完成。

#### 6. F4 启停键名只读真机核实执行记录（2026-09-20 W25 窗，环境；结论四选一＝(c)）

**执行授权与方式**：W25 真机验收窗（用户 2026-09-19/20 指令开窗，O-2 例外照准）；
方法＝本节 §3(b) 八步之**静态取证子集**（步 1 定位根／步 2 家族清单＋SHA-256＋
mtime 原位读数／步 6 判读／步 7 落账）；步 3–5 动态双快照对照（需用户 GUI 操作）
本窗指令未列入执行面，登记为可选补充证据。**全程只读**（read/readdir/stat 口径）：
零写入、零移动、零重命名、零复制、零启动、零进程接触。用户路径与项目名一概脱敏
不入树。VCC 版本＝**2.4.5**（release/2.4.5，Logs/ 最新日志只读读出，最近运行
2026-09-19）。

**(a) 文件家族存在性（%LOCALAPPDATA%\VRChatCreatorCompanion\）**：settings.json
（2939B，mtime 2026-09-19）；vcc.liteDb（73728B，mtime 2026-09-02，合法 LiteDB v5
签名）；Repos/（vrc-official.json＋vrc-curated.json＋GUID 名缓存×6＋包名缓存若干＋
package-cache.json）；另有 Logs/、Project Backups/、Templates/、VRCTemplates/、
Updater/。**根下无 vrc-get/ 备份目录**（§3(b) 步 2 候选家族项缺席，如实登记）。

**(b) settings.json 键清单（照录；键名真值，值面脱敏）**：顶层恰 18 键（文件序）＝
pathToUnityExe、pathToUnityHub、userProjects(array[18])、unityEditors(array[0])、
preferredUnityEditors{2019,2022}、defaultProjectPath、lastUIState(number)、
skipUnityAutoFind(bool)、userPackageFolders(array[1])、windowSizeData{width,height,
x,y}、skipRequirements(bool)、lastNewsUpdate(string)、allowPii(bool)、
projectBackupPath(string)、showPrereleasePackages(bool)、trackCommunityRepos(bool)、
selectedProviders(number)、userRepos(array[4])。**userRepos 元素键集**＝恰
vrc-get-vpm `UserRepoSetting` 闭集：4 元素中 3 个五键 {localPath,url,name,id,headers}、
1 个四键（headers 缺席＝可选键实证），**零元素外键**。**启停语义键全文件递归扫描**
（enabl/disabl/activ/disabled 模式）：**零命中**——元素内无、顶层无、嵌套无；
全文件每键均可对账为已知 VCC/vrc-get 设置键，零未知键，顶层亦无任何按仓启停状态
映射键。

**(c) vcc.liteDb 表清单（024 表态 (b) 同窗顺带项）**：存在，恰 2 集合＝
`projects`＋`unityVersions`（读法＝二进制字符串扫描口径：签名＋集合名＋字段名
可读，未做完整 BSON 解析，方法如实声明）。字段面＝projects≈{Path,Type,
UnityVersion,Favorite,CreatedAt,LastModified}、unityVersions≈{Path,Version,
LoadedFromHub}；**无 repo 表、无任何启停语义字段**（用户项目路径与项目名一概
脱敏；unityVersions 含 2019.4.31f1／2022.3.6f1／2022.3.22f1 三版本条目，与产品
钉定全局版本吻合）。

**(d) ALCOM 侧同构对照＝不可执行（能力诚实登记）**：%APPDATA%\ALCOM 不存在；
候选根扫描（APPDATA/LOCALAPPDATA × ALCOM/alcom/com.anatawa12.alcom 共 6）＋
两侧 AppData 顶层目录名 /alcom/i 扫描零命中——本机未装 ALCOM（或从未运行），
无对照面。

**(e) 四选一结论＝(c) VCC 无启停位（VUA 自有键名可自定）**：(a) 元素内位**证伪**
（元素恰闭集）；(b) 顶层 flatten 保留区——保留区在（源码事实 2），但现机保留区
无启停键；(c) 正面证据＝三存储位（settings.json 全文／litedb 两集合／Repos 缓存
面 {repo,headers,vrc-get{etag}} LocalCachedRepository 形态）均无启停状态。源码
事实 4 的「写面剥键互操作风险」在现机形态下**无可剥对象**——026 A4 启停二分
裁决的追溯风险面就此以真机证据落定；**F4 启停面冻结硬前置成就**。**环境设计
提示（词面权威归核心 F4 冻结批）**：VUA 自有启停键**不可放 userRepos[i] 元素内**
——VUA 写面经 vrc-get `Settings::save`（五键闭集同构）会剥自有键（源码事实 3
同理适用于 VUA 自身）；自有语义宜置顶层 flatten 保留区或自有存储，往返无损。
刷新面（update_cache etag 条件刷新）不受本结论影响，照 v0.6 先行不变。

**(f) 残余诚实边界**：静态单时点观察（2026-09-20）；步 3–5 动态双快照对照未执行
（本窗指令范围外，候补可选）；F5 素材顺带观察＝VRCTemplates/ 恰 5 目录
（Avatar／Avatar 2019／Base／World／World 2019，目录名读数），元数据文件形态
未核（归 F5 顺带项本面）。零端到端宣称维持——本记录只登记只读取证事实。

### 桌面形状核可（F2 TS 面＋wire 接线面，wt-3，2026-09-20 05:1x）

**应操作者节拍指派**（「027 置顶继续——下一环＝F2 形状核可：双前置已成就且两度顺延，
本轮首项必办；照 A1–A4 形状核可先例九项逐项对照，基于收编世代，零预核可」）。核可
对象＝F2 冻结批 c46545f（26 文件 1316+，经第 122 批合并 a50241f 入库）＋wire 接线批
629699e（恰核心域 5 文件 839+/22-，经第 123 批合并 203cb9f 入库）＋随批修正 fabb04d
（协议本双语头部＋REGISTRY，第 124 批收编）的**收编世代**——本树追平壳 899902b
--no-ff 吸收 main b22939e（第 126 批世代＝收编本树上拍三笔的合并 f8d8358＋登记批；
merge-tree 预检 tree 514c3dbc 零冲突，落后 0，非 collab 面与 main 全等），本机直读＋
定向复跑亲测（05:1x：df 先查 C 盘 616G/67%；contracts dist 先重建照陈旧事故先例——
@vua/contracts check **81/81**；@vua/orchestrator-provider check **42/42**；desktop
typecheck **双 tsconfig exit 0**；desktop vitest 86 文件 **765/765**；cargo test
-p vua-provider-host 定向两件＝wire **8/8**＋consumer **4/4**；clippy 双 crate
--all-targets 零警告）。**结论：核可通过**：

- **逐项核可（九项一致）**：①请求接口单查询闭集——
  PackagesRepoCatalogQueryV01＝kind "query"（纯读零任务语义，非 command——本面
  无九态/确认链/commandId）＋method "packages.repoCatalog" 族内单方法＋params 恰
  双键 REQUIRED-nullable {repoId, packageIds}（026 A5 template 同款 idiom）：repoId
  null＝全部仓库逐仓分组、非空串＝只答该仓库行（词表外 id＝复用
  vua.vpm.repo_not_found，A4 removeRepo 同事实先例）；packageIds null＝不过滤浏览、
  非空＝Recipe 需求集合批量过滤（唯一非空 id 闭列——用户裁决④第一消费者形状；
  **空数组＝形状违反非空过滤**，不立第三态）；刻意无 projectPath（缓存维度非工程
  维度——latestVersion 判定无工程 Unity 约束，故 compatible 刻意不存在：常量
  null 非事实不给 wire 键，逐版本 compatible 仍是 packages-catalog 面的工程绑定
  冻结事实）；无 confirmedDigest（读面无确认指纹）；携第三键/缺键即形状违反
  （TS 窄化负例＋wire 十一例违规电池钉死）。②result 最小诚实形状——
  PackagesRepoCatalogResultV01 恰三键 {schemaVersion:
  "vua.packages-repo-catalog/v0.1", repos, cacheSourced}：信封常量 "0.1" 与族常量
  两独立版本（c914cf2 常规；路由在信封组装时加盖，绝不由后端盖——wire 实读
  provider_host.rs :5494–5499）；repos 空数组＝诚实零仓库缓存应答；**cacheSourced
  必带信息性降级披露出生即带**（catalog v0.2 先例于 v0.1 采纳——true＝缓存降级
  路径所得/false＝在线刷新所得，信息性非失败，消费端呈现「缓存数据」标注绝不渲染
  为失败）；仓库行四键 {repoId nullable, name nullable, **cached 必带**, packages}
  （cached false＝已订阅未刷新＝空 packages 数组如实呈现，不隐藏不伪造）；包行五键
  {packageId, displayName nullable（null 呈现＝packageId 兼任显示名，P1 裁决 3，
  不冒充字段事实）, description nullable（诚实缺席不补齐）, latestVersion nullable
  （本仓内非-yanked 且未被 prerelease 设置排除的最新版判定；null＝当前设置下无
  合资格版本——缺席不是「无包」）, versionCount（仓库缓存自身清单计数 yanked
  计入——缓存事实非可用性承诺）}；**author 刻意缺席**（环境考证 §1(b) 选项 (iii)
  单事实源裁决——库面 manifest 反序列化闭集无 author 字段、第二解析面否决；
  row-author-field 负例钉死发明即非法，license/changelogUrl/downloadCount 同律）；
  行序＝集合自身枚举顺序照实投影，不发明排序键；**逐仓分组绝不跨仓合并**（同名包
  在各仓各自出现；跨仓最高版判定仍是 packages-catalog 族声明事实——与 F3 视图
  分立不混同，环境考证 §2 边界 1 落死）。③错误面零新码——读面零 rejected 臂零
  guard：端口拒绝**逐字透传**（P2 读面零折叠——repo_not_found 携
  code+messageKey+category 原样上 wire；与 A4 写面四码折 execution_failed 的折叠
  纪律刻意不同构且 wire 处理函数 doc 注释如实自载该结构差异）；过滤器未命中＝诚实
  空应答（no_matching_package 在本面无主体——过滤是透镜非存在断言）；无
  projectPath 故 project_not_found 无主体；信封层形状违例＝既有
  vua.packages.invalid_params、能力缺席＝既有 vua.vpm.capability_missing、信封
  错误面维持既有集合零新码（核心表态 6 零新码方向照准落死）。④union 登记与窄化
  臂——请求侧 ApplicationRequestV01 增一行（:2184）；窄化臂（:2660–2671）顶键六键
  hasExactKeys＋params 精确双键＋repoId「null 或非空串」二值闭集＋packageIds
  「null 或非空唯一非空串数组」闭集（缺键/多键/空数组/重复/空 id/非字符串全拒）；
  result 侧不入 ApplicationSuccessValueV01 union＝**packages 读面族先例一致**
  （listInstalled/listRepos/packageCatalog v0.1/v0.2 同构缺席，经 packages-port
  独立映射面去 schemaVersion 消费——packages-port.ts :255/:277 先例实读），非本
  面缺口。⑤TS 测试对表——1 例 7 断言（正 3：双 null 浏览形态/repoId 范围形态/
  Recipe 批量过滤形态；负 4：缺 packageIds 键/携第三键 projectPath/空数组/重复
  id）与冻结批申报「1 test case 7 assertions」一一对应；schema 层另有 python
  jsonschema 正负例预检 14/14 申报在案。⑥mock 恒缺席臂——
  "packages.repoCatalog" 加入 P2 词表组恒答 vua.packages.unavailable（诚实缺席：
  模拟 Provider 无 VpmBackend 引擎面，绝不伪造仓库级包目录或空数组冒充——诚实空
  清单只属于真实后端的合法事实）＋测试 3 行（mock-provider.test.ts :660–662 三参
  形态）；provider check 42/42 行为级实证；桌面消费切片照缺席臂呈现，不预搬
  fixture 形状（mock/fixture 不出 DEV 纪律照旧）。⑦capturedAt 收窄有效性——F2
  四新 TS 成员（Query/Package/Repo/Result）零 capturedAt 顶层键（F2 段 677–735
  全文实读）；桌面 capturedAt 窄化点 electron-gateway.ts:135
  `"capturedAt" in result.value` 系 EnvironmentSnapshotV01 快照面专属，F2 result
  本不入 success union 故该点不可达 F2 形状，收窄不因 F2 而破裂（typecheck 双 0
  行为级亲测，A2–A5 先例同法）。⑧向量对表——6 正 8 负与登记一致（正＝浏览请求/
  范围请求/过滤请求/默认应答/空应答/缓存降级应答；负＝重复 packageIds/空
  packageIds/携第三键/缺 cacheSourced/仓库行缺 cached/包行携 author/发明
  compatible/包行缺 versionCount——examples 目录 14 文件实读）；向量正负例与
  schema additionalProperties:false 闭集（command 顶层三键＋params 双键；result
  三键＋repo 行四键＋package 行五键）逐一对表成立。⑨诚实边界如实——**词面已
  冻结且 wire 已接线**（与 A4 核可时点「已冻结未接线」不同，本核可双前置齐备后
  办理）：路由臂 packages.repoCatalog（provider_host.rs :5246/:5416–5547 实读）
  闭集双键校验在路由层、**能力门先于端口调用**（repo_catalog_capabilities 访问
  器位缺席答 capability_missing，后端方法永不被触达）、端口拒绝逐字透传、路由
  盖戳双常量；served 行 packages.repoCatalogOps 一行一方法（removeOps/installOps/
  registerOps/repoOps/createOps 先例），门＝新默认访问器（**default declared-none
  ——环境覆写置真前 served 行如实维持不可用**；CLI 后端无仓库级列表能力如实
  false）；端口面默认方法体 Err(unsupported)（已声明未实现后端在类型层可存在、
  两层同答 capability_missing 的诚实结构差异如实载明）；协议本双语 v0.1.1
  （接线批落地词面零变更＋信封常量 :124–128 载明＋**后端指向根事实专节** :131
  必载——生产接线＝用户真实 VCC settings 目录共享根、本面**只读**绝不写
  settings/caches/projects；测试隔离＝VrcGetLibBackend::with_environment_root
  临时根纯合成）；REGISTRY 两行经 fabb04d 修正后 79/79 一致。**零端到端宣称
  维持**——本核可系词表层核对＋定向复跑，served 行真机呈现与全链真机走查归
  W25（O-2）。
- **消费切片核对点登记（非缺口，不阻塞核可）**：①served 行 declared-none 期间，
  F2 桌面消费切片（仓库浏览＋搜索 UI）必须诚实缺席渲染——repoCatalogOps 能力行
  不可用/缺席时发现面入口整块不渲染（既有「无事实不渲染」纪律照旧），不预搬
  fixture 形状；②信封双常量已由接线批落地载明（协议本 0.1.1 :124–128）——消费
  窄化按落地常量对照，不猜测；③IA 形态照桌面表态 2（2026-09-19）：仓库订阅与订
  阅管理两分区合并为单一「仓库」分区、行内展开即该仓浏览面、搜索框作用于
  packageId/displayName 过滤且同一事实源不另立查询形状（设计约束 1：UI 是 F2 查
  询面的次要呈现，批量过滤由词面承担）；④cacheSourced=true 呈现「缓存数据」信息
  标注非失败；cached=false 行＝「已订阅未刷新」诚实空态＋latestVersion=null 行如
  实空显不渲染「已最新」类断言（024 表态②防线延续）；⑤新 i18n 键四语随消费切片
  申报，且须避让 wt-7（slice/desktop-i18n-player-language）已改四语词面语义——
  后续合并保留新语义（wt-7 [→桌面] 留言照办）；design-standard §8 增补随消费切
  片（0.7.3/0.7.4 先例）。
- **解锁状态**：F2「形状核可」桌面侧条件满足（本节）；双前置（冻结批 c46545f 经
  第 122 批＋接线批 629699e 经第 123 批入库）全成就——**F2 消费切片（仓库浏览＋
  搜索 UI）就此解锁**，照 026 A 消费切片先例候桌面续领；环境实现核对切片（环境席
  位）与本核可互不阻塞、照序并行。零端到端宣称维持。

### 桌面形状核可（F3 TS 面＋wire 接线面，wt-3，2026-09-20 07:1x）

**应操作者节拍指派**（「027 推进中——F3 接线批候集成验收中；若已入库，你的 F3 形
状核可双前置成就，照先例基于收编世代办理（九项对照）」）。核可执行时点事实＝本轮
brief 06:57 实测 676b185 尚未入库（slot/wt-2 领先 5 候验收），核查期间集成第 130 批
同窗落地——接线批经合并 abdf328 验收入库（集成亲审逐项 PASSED）、本树上拍两笔簿记
经合并 7d82dc5 收编关账；本树追平壳 be9637c --no-ff 吸收 main 7d82dc5（第 130 批世
代；merge-tree 双法预检 exit 0 tree a4c4b26 零冲突，落后 0，非 collab 面与 main 逐字
节全等），**核可基于该收编世代办理，零预核可**。核可对象＝F3 冻结批 35ffb61（恰
21 文件 1148+/4-，经第 128 批合并 e2486ed 入库）＋wire 接线批 676b185（恰核心域
5 文件 782+/61-，经第 130 批合并 abdf328 入库）的收编世代——本机直读＋定向复跑亲
测（07:1x：df 先查 C 盘 619G/67%；contracts dist 先重建照陈旧事故先例——
@vua/contracts check tsc 0＋vitest **82/82**；@vua/orchestrator-provider check **42/42**；
desktop typecheck **双 tsconfig exit 0**；desktop vitest 86 文件 **772/772**；cargo test
-p vua-provider-host 定向三件＝wire_v02 **6/6**＋consumer_v02 **4/4**＋consumer〔v0.1
零回归〕**4/4**；clippy 双 crate --all-targets 零警告）。**结论：核可通过**：

- **逐项核可（九项一致）**：①**请求接口单查询闭集**——command 面与冻结 v0.1 逐
  字节同形（本面零新请求类型：PackagesListInstalledQueryV01 原样，kind "query" 纯读
  零任务语义，请求联合零新增——v0.2 增量只升 result 族；command.schema.json 信封
  const "0.1"＋operation 单方法枚举＋params 恰单键 REQUIRED {projectPath
  minLength 1}〔013 注册身份复用，词表外键即 vua.packages.invalid_params 形状违反〕
  实读）；TS 窄化臂 application-contract.ts :2680–2684 单键闭集原样守卫，
  desktop-gateway.ts :1404–1409 消费守卫 minLength 1 与 Schema 同形；请求负例向量三
  件（空/缺/携额外 projectPath 键）钉死。②**result 最小诚实形状**——
  PackagesListInstalledResultV02 恰四键 {schemaVersion: "vua.packages-installed/v0.2",
  projectPath, packages〔packageId 升序冻结呈现事实，空数组＝诚实空清单〕, cacheSourced
  必带}；行 PackagesInstalledItemV02 恰五键＝v0.1 三键（packageId/version/
  dependencies）零变动＋判定对两键必带可空（latestVersion string|null＝**跨仓 max**
  判定版本事实〔集合全仓合并取最高，刻意非 F2 分仓视图，两视图分立不混同〕；
  updateAvailable boolean|null＝冻结判定结论）；信封常量 "0.1" 与族常量两独立版本
  （c914cf2 常规），路由在信封组装时盖戳双常量、projectPath 路由盖（P1 纪律——后
  端事实逐字，wire 实读 provider_host.rs :5373–5403）；**三态防线落死**（024 表态②
  用户裁定 2026-09-20）：null＝判定未执行〔无合资格最新版或工程 Unity 版本未知〕绝
  非「已最新」绝不默认 false；false 精确语义＝「当前过滤条件下不存在严格更新版本」
  非泛化无更新〔已装版自身 prerelease 且设置关时合资格最新取稳定集〕；选择器逐字复
  用 catalog 冻结语义 latest_for(工程 Unity 版本, show_prerelease) 零第二判定语义（协
  议本判定成本节：整表判定骑一次集合加载，逐行独立加载非合法实现形态）；cacheSourced
  出生即带必带信息性降级披露（catalog v0.2 先例）——true＝缓存降级路径所得（offline
  →load_cache 或在线失败降级，ORC-ADP-006 同构）/false＝在线刷新所得，信息性非失
  败；schema additionalProperties:false 全覆盖＝发明事实（changelogUrl/displayName/
  source/versions）即机器非法非仅不鼓励。③**错误面零新码**——共享 P1 前置双臂零
  变化：单键闭集参数 vua.packages.invalid_params、013 注册复用
  vua.project.project_not_found（同事实同码，wire :5340–5347 实读）、面级能力门
  vua.vpm.capability_missing、后端类型化拒绝逐字透传 code+messageKey+category 双臂
  同律（wire :5385–5392/:5404–5411 实读）；读面零折叠（与 A4 写面折叠纪律刻意不同
  构照旧）。④**union 登记与窄化臂**——请求侧零新增（command 面不动＝冻结批核心
  纪律，既有 listInstalled 窄化臂即守卫）；result 侧不入 ApplicationSuccessValueV01
  union＝**packages 读面族先例一致**（v0.1 listInstalled/listRepos/packageCatalog/F2
  repoCatalog 同构缺席）；族世代辨识＝路由盖戳族常量即机器可检测——v0.1 形状行对
  v0.2 Schema 非法（缺必带键，consumer_v02 第 4 例
  v01_rows_are_invalid_under_v02_making_the_version_machine_detectable 钉死）＋TS 面
  v0.2 独立接口非 union，消费端按 schemaVersion 字面量类型辨识永不猜测。⑤**TS 测
  试对表**——1 例 7 断言（application-contract.test.ts :311–344 实读：「pins the 027
  F3 packages-installed v0.2 result word face」——行五键闭集排序钉/判定未执行双 null
  不是 false 不是数字零/文档四键闭集排序钉/cacheSourced=true/判定真臂版本事实对）与
  冻结批申报一一对应；contracts vitest 82/82 本拍亲测。⑥**mock 恒缺席臂**——
  mock-provider.ts :427 packages.listInstalled 恒答 vua.packages.unavailable（诚实缺席：
  模拟 Provider 无 VpmBackend 引擎面，绝不伪造已装清单或空数组冒充——诚实空清单
  只属于真实后端的合法事实）；冻结批 21 文件足迹零 mock 改动＝mock 无 v0.2 伪造臂
  如实确认；provider check 42/42 行为级实证；桌面消费切片照缺席臂呈现，不预搬
  fixture 形状（mock/fixture 不出 DEV 纪律照旧）。⑦**capturedAt 收窄有效性**——F3
  两新 TS 成员（PackagesInstalledItemV02/PackagesListInstalledResultV02，
  application-contract.ts :592–614 全文实读）零 capturedAt 顶层键；F3 result 本不入
  success union 故 desktop capturedAt 窄化点（electron-gateway.ts :135 `"capturedAt"
  in result.value`，EnvironmentSnapshotV01 快照面专属）不可达 F3 形状，收窄不因 F3
  而破裂（typecheck 双 0 行为级亲测，A2–A5 先例同法）。⑧**向量对表**——4 正 7 负
  与冻结登记一致（examples 目录 11 文件实读；正＝请求/全量判定应答/诚实空应答/判
  定未执行应答；负＝空 projectPath/缺 projectPath/携额外 params 键/result 缺
  cacheSourced/行发明字段/行缺判定对键/updateAvailable 类型违例）；正负例与 schema
  additionalProperties:false 闭集逐一对表成立，consumer_v02 第 1 例
  （query_v02_schema_admits_positive_vectors_and_rejects_negative_ones）jsonschema 校
  验器双向钉死。⑨**诚实边界如实**——**词面已冻结且 wire 已接线**（本核可照 F2 核
  可时点纪律：双前置齐备后基于收编世代办理）：路由双臂协商 provider_host.rs
  :5330–5416 实读——面级能力门先于协商（无面即无词面与世代无关）、共享 P1 前置
  先于协商双臂共享零变化、族常量 :290/:304 命名发布自
  vua_provider_host::provider_host、信封维持共享常量 "0.1"（catalog v0.2 先例仅
  result 族升版）；wire 测试 6 例例名逐一与接线批申报对表（v02 族应答全判定臂钉/
  v0.1 零回归族钉/门先于协商钉/双臂拒绝逐字钉/共享前置钉/常量可检测性钉）；协议
  本双语 0.2.1 状态「已冻结且已接线」＋协商节「已接线 v0.2.1 接线批落地」＋诚实边
  界节 wired-not-consumed 实读；REGISTRY 两行（schema 0.2／协议本 0.2.1）一致。
  **零端到端宣称维持**——本核可系词表层核对＋定向复跑；路由已接线**未被消费**（本
  核可落地前无任何桌面面读取 v0.2 族）；真机呈现与全链走查归 W25（O-2）。
- **消费切片核对点登记（非缺口，不阻塞核可）**：①updateAvailable=null 该列如实空
  显绝不渲染「已最新」绝不默认 false；false 精确语义呈现不泛化为「无更新」断言（渲
  染词面候 design-standard 增补随切片）；②cacheSourced=true 呈现「缓存数据」信息标
  注非失败；**v0.1 族应答（无该字段）绝不虚构标注**——消费端按族常量辨世代；③双
  族常量接纳＝TS 面字面量类型已钉（冻结批），消费映射按常量对照不猜测；④IA 形态
  照桌面表态 3（2026-09-19）：已装表加「可更新」列、行内升级键复用 A2 安装面
  version=null 语义（零新升级动词——协议本「词面之外」节落死）；v0.1 族应答期间该
  列诚实空显＝既有 P1 呈现零回归；⑤新 i18n 键四语随消费切片申报且避让 wt-7 已改
  词面语义；design-standard §8 增补随消费切片（0.7.3/0.7.4 先例）。
- **解锁状态**：F3「形状核可」桌面侧条件满足（本节）；双前置（冻结批 35ffb61 经第
  128 批＋接线批 676b185 经第 130 批入库）全成就——**F3 消费切片（已装表「可更
  新」列＋行内升级键）就此解锁**，照 F2 双环轮先例候桌面续领；环境 F3 库实现切片
  （环境席位，第 130 批登记 GO）与本核可互不阻塞、照序并行——桌面消费对 v0.1 族
  应答诚实空显与 v0.2 族应答三态呈现双臂兼容，不候实现（F2 先例：消费先于实现入
  库，第 128/129 批次序）。零端到端宣称维持。

### 核心内联回复（F3 消费/实现序位框定差异闭合＋F3 环收官回执，wt-2，2026-09-20 08:1x）

**应 wt-main 第 131 批 [→wt-2] 留言邀约**（「如有异议请 027 提案内联提出，集成仲裁
备用待命」）**内联回复：核心无异议，执行读法确认**。本树早期在途登记读法「消费候
环境库实现入库＋形状核可双前置」自此不再主张，框定差异照桌面核可节读法闭合——
消费不候环境库实现（F2 先例第 128/129 批次序成立），双臂兼容即合法消费形态。核
心确认理由三点：

- **诚实纪律两读法下均无违例路径**：环境实现入库前，已接线路由只会诚实应答——
  v0.1 族应答无判定字段（桌面「可更新」列诚实空显，核可节核对点①钉死）或面级门
  capability_missing/后端类型化拒绝逐字透传（接线批词面纪律）；核对点①–⑤已把
  「绝不渲染已最新、绝不虚构标注、不预搬 fixture 形状」逐条落死，消费先于实现入
  库不产生任何虚构内容路径。
- **F2 先例结构同构成立**：消费（f23f3a3，第 128 批）先于实现（27c3c9d，第 129
  批）入库，集成亲审零诚实违例；F3 消费（92d201e）与实现（1b452ee）同批（第 132
  批）入库为同一结构的再次成立，无新增风险面。
- **核心域义务零牵涉**：核心 F3 链义务（冻结 35ffb61＋接线 676b185）已全入库关
  环；消费/实现序位属桌面与环境席位排程，两读法下核心行动一致，无仲裁需求成立。

**回执与收官消化**：①wt-3 知会「F3 桌面消费切片已落地：双族协商消费按你方接线批
盖戳族常量」——核心知悉，消费端按路由盖戳族常量辨世代正是接线批「常量可检测性」
设计的预期消费形态，零出入；②wt-3/wt-6 接线批收编致谢回执收讫；③第 132 批实测
（git log 亲读）＝F3 五环全闭环（冻结 35ffb61→接线 676b185→形状核可 ed6cfe1→
消费 92d201e→实现 1b452ee 全入库）＋F5 冻结批 d09c1e6 经合并 640b365 入库（候集
成登记批落账）。**请集成下批登记将本项从「仲裁备用」改记「已闭合（wt-2 内联无
异议，执行读法成立）」**。零端到端宣称维持（真机走查归 W25/O-2）。

### 桌面形状核可（F5 TS 面＋wire 接线面，wt-3，2026-09-20 23:3x–23:4x）

**应 wt-2 [→桌面] 知会邀约**（「F5 形状核可双前置随接线批入库即齐：冻结批 640b365
＋接线批 8677607——候你方照 F2/F3 程序办理」）。核可执行时点事实＝本轮 brief 23:25
实测 main 尖 bcda744（第 135 批世代）且 8677607 未入库（slot/wt-2 领先 3 候验收），
核查期间集成第 136 批同窗落地——接线批经合并 8377360 验收入库（集成亲审逐文件复核
PASSED 载明于合并消息）；本树追平壳 f9d1fa7 --no-ff 吸收 main 8377360（merge-tree
预检 exit 0 tree 1b9fa07 零冲突；落后 19 领先 0；HEAD tree＝main tree＝1b9fa07 逐
字节全等＝零自有内容纯吸收；入站含第 134/135/136 批＝本树上拍三笔经第 134 批收编
关账＋wt-7 i18n 全批＋本接线批），**核可基于该收编世代办理，零预核可**（F3 先例：
brief 时点未入库即登记竞速、落地后才在收编世代上核可）。核可对象＝F5 冻结批
d09c1e6（经第 132 批合并 640b365 入库）＋wire 接线批 8677607（恰核心域 5 文件
746+/39-，经第 136 批合并 8377360 入库）的收编世代——本机直读＋定向复跑亲测
（23:3x：df 先查 C 盘 605G/68%；contracts dist 先重建照陈旧事故先例——
@vua/contracts check tsc 0＋vitest **83/83**；@vua/orchestrator-provider check
**43/43**；desktop typecheck **双 tsconfig exit 0**；desktop vitest 89 文件
**799/799**〔与集成合并树定向复跑数字吻合〕；cargo test -p vua-provider-host 定向
两件＝wire_v01 **7/7**＋consumer_v01 **4/4**；clippy 双 crate --all-targets 零警
告）。**结论：核可通过**：

- **逐项核可（九项一致）**：①**请求接口单查询闭集**——PackagesListTemplatesQueryV01
  （application-contract.ts :788–792 全文实读）＝kind "query" 纯读零任务语义＋method
  单方法＋params `Record<string, never>` **空闭集**（packages.listRepos 零参数先例：
  模板面系环境级配置面非 per-project）；请求联合恰一笔新增（:2264）零其它成员变更；
  wire 路由臂空闭集形状验证**先于**能力门（provider_host.rs :5551–5557 实读——任何
  键/缺 params/非 object params 一律答 vua.packages.invalid_params 绝不默认放行）；
  负例向量 invalid-templates-params-extra-key＋invalid-templates-unknown-operation
  钉死。②**result 最小诚实形状**——PackagesListTemplatesResultV01 恰两键
  {schemaVersion: "vua.packages-templates/v0.1", templates}；行 PackagesTemplateItemV01
  恰 **id＋name 两键**（:802–805 实读）＝id 模板目录名（createProject template 参数
  机器标识）＋name **id 冻结同值显示投影**（无独立显示名事实源，消费端绝不虚构更友
  好标签；同值锁由核心消费测试钉，draft-07 无法跨键表达）；description/sourceRoot
  刻意缺席（前者无 v0.1 生产者——模板目录元数据文件形态未考证归 W25 真机顺带项，
  ORC-DEV-004 无实现不预留；后者无消费需求）——发明即 schema 非法，负例向量四件
  （row-empty-id/row-missing-name/row-invented-description/row-invented-sourceroot）
  钉死；**id 升序＝冻结呈现事实**（裸扫描序跨平台不稳定，F3 packageId 升序先例）；
  空数组＝诚实零模板应答（目录根缺失是事实非错误，R4 先例）；**零网络面无
  cacheSourced**（恒常量信息字段不是事实，repos v0.1 同律）。③**路由臂顺序纪律**——
  provider_host.rs :5543–5590 全文实读：形状验证先于门（上项）→门
  `template_capabilities().list_templates` **先于**端口调用（:5558–5566，默认
  declared-none 答通用 vua.vpm.capability_missing 绝不触达后端方法——F2 同款诚实
  结构差异：端口方法有默认体：706/726–727 实读，声明而未实现的 backend 类型层存在，
  两层同答、路由门先行）→端口类型化拒绝逐字透传（:5582–5588，code＋messageKey＋
  category 三件全透，读面无折叠）→Ok 投影＝TemplateEntryV01 行 serde 投影＋路由盖
  族常量（:5569–5578；`unwrap_or_else(json!([]))` 系本文件 standing 先例同形——
  packages_list_repos 同款，集成第 136 批合并消息 spot-check 载明）；**信封事实路由
  定、后端事实逐字**（P1 纪律：id 升序与 name===id 系冻结词面生产者契约，路由绝不
  改写，wire 测试骑真实帧循环钉死）。④**双常量命名发布**——
  `PACKAGES_TEMPLATES_ENVELOPE_SCHEMA_VERSION_V01 = "0.1"`（:352）＋
  `PACKAGES_TEMPLATES_SCHEMA_VERSION_V01 = "vua.packages-templates/v0.1"`（:344）
  均自 vua_provider_host::provider_host pub 发布（A3/A4/A5/F2/F3 先例：消费端钉核
  心域常量绝不私有字面量；c914cf2 常设法则：每行自带版本常量独立于信封常量）；字面
  字节与冻结 Schema 双常量（result.schema.json :14/:26 实读）逐字节同值；wire 测试
  第 7 例 envelope_consts_are_detectable（:468–486+ 实读）对冻结字面量**与**冻结
  Schema 常量双向钉死。⑤**冻结词面投影钉**——wire 测试 7 例例名逐一与接线批申报
  对表（wired_route_projects_the_frozen_word_face_over_the_real_frame_loop :292＝
  jsonschema 合法＋id 升序钉＋name===id 同值钉＋恰 id+name 两键无发明字段钉＋served
  行 available；缺席臂 typed honest absence :273；门先于端口 panic 钉 :347；逐字
  透传钉 :380；空枚举合法应答钉 :406；形状违例先于门钉 :431；双常量可检测性钉
  :468），全部骑真实帧循环（run_provider_host_full）；38 断言；consumer 测试 4 例
  例名与冻结批 REGISTRY 登记对表（向量接纳/拒绝＋trait 默认缺席臂＋fake backend
  端口→wire 投影含 name===id 同值钉＋无发明字段钉＋空态合法钉）；wire 7/7＋
  consumer 4/4 本拍亲测。⑥**mock 恒缺席臂与桌面零消费**——apps/desktop 全树实读
  零 listTemplates 引用（无伪造消费臂、无伪造模板清单 fixture 臂）；packages 族
  诚实缺席臂 vua.packages.unavailable 原样（gateway-router.ts :213–279 注释族＋
  packages-live.ts :23/:925 缺席臂映射实读）；冻结批足迹零 mock 改动如实确认；
  mock/fixture 不出 DEV 纪律照旧；**路由已接线、未被消费**（wired-not-consumed）
  ——本核可落地前无任何桌面面读取模板族词面。⑦**TS 面联合成员与收窄有效性**——
  查询联合成员 :2264 恰一笔；result 侧不入 ApplicationSuccessValueV01 联合（packages
  读面族先例，F3 核可⑦同法）故 desktop capturedAt 窄化点（EnvironmentSnapshotV01
  快照面专属）不可达 F5 形状，收窄不因 F5 而破裂（typecheck 双 0 行为级亲测）。
  ⑧**向量对表**——3 正 6 负与冻结批 REGISTRY 行申报一致（examples 目录 9 文件实
  读＋正负例抽查：正例 result＝Avatar/Base/World 三行 id 升序 name 同值；负例
  invented-description 行实读确证 additionalProperties 闭集拒绝）；consumer 第 1 例
  jsonschema 校验器双向钉死。⑨**诚实边界如实**——**词面已冻结且 wire 已接线**：
  协议本双语 0.1.1（状态行＋词表节 wire 常量 bullet〔提前闭合桌面核对点，本节即其
  兑现〕＋能力门控节「已命名与路由」＋诚实边界节 wired-not-consumed）实读；REGISTRY
  两行（schema 0.1／协议本 0.1.1）一致；served 行 packages.templatesOps（:1475–1478
  ＋可用性表达式 :1427–1430 实读）＝单行单法、availability 读
  template_capabilities().list_templates，默认 declared-none 如实 unavailable 候环
  境覆写置真（CLI 后端如实假）；**零端到端宣称维持**——本核可系词表层核对＋定向
  复跑；真机呈现与全链走查归 W25（O-2）。
- **消费切片核对点登记（非缺口，不阻塞核可）**：①**回落纪律**——枚举缺席（面级门
  capability_missing/served 行 unavailable）或创建能力不可用＝回落现行手填＋留空＝
  后端默认解析（026 A5 留白填面语义原样）；空数组＝诚实零模板应答（目录根缺失是
  事实非错误）同样回落手填，**绝不渲染成错误、缺席绝不虚构模板清单**；②**name 投
  影逐字**——下拉显示行逐字用 name（=id 同值投影），绝不虚构更友好标签；id 作
  packages.createProject template 参数机器标识原样传递；③**诚实错误态**——后端类
  型化拒绝逐字透传不折叠 unavailable（本日第四批 source_invalid 专用拒绝先例同形）；
  能力缺席与加载失败呈现区分，不折叠成空清单假象；④**i18n 与文档随批**——新 i18n
  键四语随消费切片申报且避让 wt-7 已改词面语义（新键自然措辞、既有键零误伤，特别
  保留未检查/无匹配更新/缓存空态区分——wt-7 留言纪律）；design-standard §8 增补随
  消费切片（0.7.3/0.7.4/0.7.10 先例同径）；⑤**零端到端宣称**——消费切片交付时同
  批登记定向证据，真机走查归 W25（O-2）。
- **解锁状态**：F5「形状核可」桌面侧条件满足（本节）；双前置（冻结批 d09c1e6 经第
  132 批＋接线批 8677607 经第 136 批入库）全成就——**F5 桌面消费切片（新建项目模板
  下拉，026 A5 留白填面）就此解锁**，候桌面续领；环境 F5 库实现切片（VrcGetLibBackend
  `list_templates` 两根目录扫描〔VRCTemplates 先／Templates 后、同名去重解析序投
  影、仅目录〕＋`template_capabilities` 覆写置真＋with_environment_root 临时根单元
  测试）候环境席位领取，与本核可及桌面消费互不阻塞（F2/F3 双环先例：消费对
  declared-none 后端诚实回落手填即合法消费形态——缺席臂兼容，消费不候实现入库）。
  零端到端宣称维持。

### 桌面消费落节（F5 模板下拉，wt-3，2026-09-21 00:1x）

**应本节解锁登记照 F2/F3 消费先例续领**（上拍核可批 d41f3a7 经第 137 批合并
e6ee4eb 收编入库，F5 桌面消费切片解锁正式落账 main；追平壳吸收 main 680907d
世代后动工，基点零预消费）。消费对象＝packages-templates v0.1 冻结词面
（冻结批 d09c1e6＋接线批 8677607 收编世代）——**核对点五条逐条兑现**：

1. **回落纪律（核对点①）**：blocks.templates（packages.templatesOps 能力行）
   false＝下拉不渲染、创建表单回落现行手填（渲染层不伪造）；挂载即查一次
   （环境级配置面，F2 页面局部承载先例，不进快照）；空数组＝诚实零模板应答
   （目录根缺失是事实非错误）回落手填＋信息性标注，**绝不渲染成错误、绝不虚
   构模板清单**；typed 失败/unavailable 同回落手填＋留空＝null＝后端默认解析
   （026 A5 留白填面语义原样——提交链零改动：trim 后空串只构造 null，UI 永不
   构造空串违例）；loading 期手填禁用＋提示（不制造「手填值遗留到下拉世界」
   的展示错位）。
2. **name 投影逐字（核对点②）**：下拉默认项＝「使用后端默认模板（留空）」；
   模板行显示名逐字用 name（=id 冻结同值投影），绝不虚构更友好标签；选中项
   value＝id 作 packages.createProject template 参数机器标识原样传递（提交链
   verbatim 非空腿复用，零新构造）。
3. **诚实错误态（核对点③）**：typed 失败携错误码原词呈现（live 层
   invokeTyped 原词上呈零折叠；vua.packages.unavailable 缺席臂折叠
   unavailable 照先例）；失败标注（错误码原词）与能力缺席标注四语文案严格分
   立，能力缺席与加载失败呈现区分，**失败不冒充空清单**（诚实纪律 2）。
4. **i18n 与文档随批（核对点④）**：新 i18n 键六枚四语随批（templateSelect
   Aria/templateDefaultOption/templatesLoading/templatesEmptyNote/templates
   FailedNote/templatesUnavailableNote——自然措辞、既有键零误伤、wt-7 未检
   查/无匹配更新/缓存空态词面零触碰，check-i18n 四语对齐 OK）；design-standard
   §8 增补随批＝0.7.11（§8.7 模板枚举呈现段＋项目创建段「不虚构模板下拉」
   表述随消费落地退役改写，EN 镜像同步 0.7.11）。
5. **零端到端宣称（核对点⑤）**：维持——本落节系词面消费＋定向复跑，真机走
   查归 W25（O-2）。

**实现面（桌面域 TS 全层切片同批）**：contracts desktop-gateway.ts＝Packages
ListTemplatesRequestV1 请求类型＋DESKTOP_GATEWAY_METHOD_KINDS 登记
"query"＋isDesktopGatewayRequestV1 空闭集 case＋请求联合成员；electron
gateway-router.ts＝packages.listTemplates 分发臂（空闭集 params verbatim
透传）；renderer packages-port.ts＝TemplatesFactsV01＋blocks.templates 纯增
量新键（p1/p2 双视图，逐面升级承诺照办）＋listTemplates() 方法；packages-
live.ts＝TEMPLATES_OPERATION_ID＋capabilityRows 十行＋isPackagesTemplates
Result 守卫（行两键闭集：id 非空机器标识＋name 非空投影；发明 description
即形状不符）＋listTemplatesRaw（族常量剥除、id 升序呈现事实不重排）；empty/
fixture gateway 恒缺席臂（mock 永不模拟模板枚举，不出 DEV 纪律照旧）；
PackagesPage CreateSection＝TemplatesFace 五形态状态机＋下拉/手填双臂渲染。

**定向证据（本拍亲测，680907d 基点世代）**：contracts dist 重建照陈旧事故
先例（method-kinds 表登记后 dist 未重建曾致 router 测试假红——如实登记此
轮内小教训）后 pnpm check 83/83；desktop pnpm check 全链 exit 0（typecheck
双 tsconfig 0＋vitest 89 文件 806/806〔含 live.test 新增 F5 用例组 6 枚：
能力行翻转/族常量剥除/id 升序不重排/空数组诚实应答/typed 原词与缺席臂/形
状违例两件；router.test 新增分发臂用例：translate verbatim＋空闭集词表外键
信封守卫拒〕＋build＋check:boundary OK＋check:i18n OK＋check:contrast 达
标＋check:leak 155 指纹零泄漏＋check:forest-leak 通过）。df 先查 616G/67%
（上拍 605G/68%，读数如实更新）。**零端到端宣称维持**——served 行环境覆写置真前模板
枚举如实 unavailable、创建区块如实回落手填（declared-none 世代下下拉不渲
染＝核对点①缺席臂合法呈现）；真机呈现归 W25（O-2）。

### 桌面形状核可（F4 TS 面＋wire 接线面，wt-3，2026-09-21 02:3x–03:1x）

**应 wt-main [→桌面] ①区知会办理**（「F4 形状核可双前置全成就解锁（冻结＋接线均在
库）：照 F2/F3/F5 九项对照同径，下轮首领即办」）。核可执行时点事实＝本拍追平壳
29edb9c --no-ff 吸收 main b3581da（第 141 批世代：F4 wire 接线批经合并 b6d7b29
验收入库＋VUA-8 用户裁决并线合并 0f9350f），merge-tree 预检 exit 0 零冲突，落后 22
领先 0，**核可基于该收编世代办理，零预核可**（接线批 b6d7b29 在收编后始可直读——
上拍 77c47b6 世代时其未入库，形状核可不领取判定与前拍一致且已随接线入库自然兑现）。
核可对象＝F4 冻结批 47d4185（恰 39 文件，经第 139 批合并 a3a9d86 入库）＋wire 接线
批 7361213（恰核心域 8 文件 1738+/133-，经第 141 批合并 b6d7b29 入库，集成逐文件亲
审 PASSED 载明于合并消息）。本机直读＋定向复跑随消费切片同批亲测（本节判读先落，
复跑数字见下方消费落节申报——同批双环照 F2/F3/F5 核可＋消费同径先例拆分申报）。
**结论：核可通过**：

- **逐项核可（九项一致）**：①**请求接口单键闭集**——三命令 TS 面
  PackagesEnableRepoCommandV06／DisableRepo／RefreshRepo（application-contract.ts
  :1344/:1355/:1366 全文实读）＝kind "command" 任务化＋params 恰 `{repoId}` 单键闭集
  （A4 removeRepo 同稳定行柄）＋commandId 必带；请求联合恰三笔新增（:2423–2425）零
  其它成员变更；wire 闭集形状验证 packages_ops_repo_lifecycle_params
  （provider_host.rs :7069–7079 实读：params.len()==1＋repoId 非空串，**携
  confirmedDigest 或 projectPath 即形状违反**——启停 diff 既有摘要、刷新即网络本体，
  无 preview 臂可漂移）**先于**按方法门，违例一律答 vua.packages.invalid_params；负
  例向量 invalid-enable-extra-param／invalid-enable-missing-repo-id／invalid-disable
  -carries-project-path／invalid-disable-empty-repo-id／invalid-refresh-carries
  -digest 钉死。②**result 最小诚实形状**——三收据 TS 面 :1413（PackagesRepoEnabledV06
  恰三键 {schemaVersion, kind:"enabled", repoId}）/:1417（disabled 同构）/:1421
  （refreshed 四键＋**cacheUpdated REQUIRED**）；rejected :1430（guard+code+detail
  三键，code 族锁 vua.packages.* 冻结 Schema pattern，原端口码 vua.vpm.* 三件零新立
  在 detail 原词溯源**永不入 code 键**）；enabled/disabled 回显即审计链（端口答
  Result<(),_> 无载荷，收据绝不重复状态——新状态经 repos v0.2 订阅面读回）；**
  cacheUpdated 两臂皆成功**（false＝etag 未变「已是最新」是结果非错误，库面
  update_cache 两臂事实）；发明字段（切换时间戳/前状态回显/字节计数/包清单）＝
  schema 非法，负例向量 invalid-result-enabled-invented-field／invalid-result
  -enabled-stale-family／invalid-result-refreshed-invented-payload／invalid-result
  -refreshed-missing-cacheupdated／invalid-result-rejected-code-outside-family 钉
  死；repos_v02 六键行 PackagesRepoInfoV02（:667–674 实读＝repoId/name/url/localPath
  /cached/enabled，REQUIRED enabled 位；id 缺席行 enabled 恒 true 律 :663 注释＋wire
  测试钉死）。③**路由臂顺序纪律**——provider_host.rs 三路由臂全文实读（enable
  :7081–7150／disable :7153–7215／refresh :7217–7282）：形状验证先于门→门读**自身
  位**（repo_lifecycle_capabilities() 每方法独立位——三独立位子集后端各路由独立门）
  **先于** submit（能力缺席 vua.vpm.capability_missing 在路由层答，绝不进任务）→
  端口类型化拒绝折 execution_failed 盖 v0.6 族常量携原码 detail
  （packages_ops_repo_port_rejection 参数化尾）→Ok 投影 serde 收据＋信封双常量盖戳
  （受理九态任务，refresh 网络段使取消语义实质）；listRepos v0.2 协商臂 :5536–5610
  实读＝catalog_capabilities 门先于协商、repos_v02() 声明才走 list_repos_v02、族常
  量路由盖戳、**command 面逐字节 v0.1 信封 0.1**（F3 query_v02 同律）；shared-tail
  参数化（finish_repo_write_acceptance＋packages_ops_repo_port_rejection 增
  envelope/family 参数）A4 路由传 V04 常量行为逐字节不变（v04 wire 套件仍绿＋跨行
  隔离钉 the_frozen_v04_row_keeps_serving_untouched_beside_the_v06_row）。④**双常
  量命名发布**——PACKAGES_OPS_ENVELOPE_SCHEMA_VERSION_V06 "0.6"（:433）＋
  PACKAGES_OPS_SCHEMA_VERSION_V06 "vua.packages-ops/v0.6"（:426）＋
  PACKAGES_REPOS_SCHEMA_VERSION_V02 "vua.packages-repos/v0.2"（:445）均 pub 自
  vua_provider_host::provider_host（A3/A4/A5/F2/F3 先例：消费端钉核心域常量绝不私
  有字面量；c914cf2 法则）；wire 测试 envelope_consts_are_detectable（:771）对冻结
  Schema 常量双向钉死＋活盖戳对常量断言。⑤**冻结词面投影钉**——wire 测试
  packages_ops_wire_v06.rs 11 例例名逐一与接线批申报对表（缺席接线 typed honest
  absence＋行 unavailable :341／wired enable 最小收据 :366／wired disable :410／
  refresh 两臂皆成功＋四键闭收据 :443／参数违例含携 digest 携 projectPath :495／
  declared-none 门先于 submit :537／子集后端 refresh-only 服务＋toggle 答
  capability_missing＋行 available :565／拒绝折 execution_failed 搠端口出处三码
  :604／declared-but-unimplemented 折 trait 默认 :695／双常量可检测 :771／v04 行照
  常服务 :793）；packages_repos_wire_v02.rs 3 例（v0.2 族协商：族常量＋六键行＋
  disabled 在列＋id 缺席恒 true＋schema 校验 :241／v0.1 照常服务 :310／空闭集参数律
  :339）；全部骑真实帧循环；consumer 测试 4+3 例与冻结批 REGISTRY 申报对表。⑥**mock
  恒缺席臂与桌面零消费**——apps/desktop 全树实读零 enableRepo/disableRepo/
  refreshRepo/repoLifecycle 引用（grep exit 1 零匹配，wired-not-consumed 成立）；
  冻结批足迹 mock 臂＝三方法加入 standing unavailable 组（orchestrator-provider
  mock-provider.ts＋mock-provider.test.ts 1 例 3 断言）；fixture-packages.ts 本地
  setRepoEnabled 仅本地演示视图翻转非 wire 冒充（F4 消费批随批替换为恒缺席臂）；
  mock/fixture 不出 DEV 纪律照旧。⑦**TS 面联合成员与收窄有效性**——请求联合恰三
  笔；result 侧不入 ApplicationSuccessValueV01 联合（packages 写面族先例，F5 核可⑦
  同法），desktop capturedAt 窄化点不可达 F4 形状；contracts 测试 :713 三方法闭集
  拒绝＋:748 v02Row 钉在库（本批随消费切片定向复跑亲测）。⑧**向量对表**——
  packages-ops/v0.6 examples 15 文件＝5 正 10 负、packages-repos/v0.2 examples 7 文
  件＝3 正 4 负，与冻结批 REGISTRY 申报一致（目录实读计数＋正负例名对表）。⑨**诚实
  边界如实**——协议本双语 packages-ops v0.6.1（状态行已冻结且已接线；能力门控节命
  名并路由；诚实边界节 wired-not-consumed-against-fake-backends）＋packages-repos
  v0.2.1（协商臂落地）实读；REGISTRY 两行一致；served 行 packages.repoLifecycleOps
  （:1531＋可用性表达式 :1478–1490 实读）＝单行服务三方法、availability 读三独立位
  ANY（部分覆写后端不被面级行隐藏），默认 declared-none 如实 unavailable 候环境覆写
  置真（CLI 后端如实假）；**零端到端宣称维持**——本核可系词表层核对；真机呈现归
  W25（O-2）。
- **消费切片核对点登记（非缺口，不阻塞核可）**：①**能力缺席降级**——served 行
  packages.repoLifecycleOps false＝启停/刷新控制不渲染（订阅行照常呈现，降级非错
  误； TemplatesFace 五态机 constant-absence 同构）；v0.1 族应答（无 enabled 位）＝
  启停开关不渲染（当前状态不可知不猜测——诚实纪律#1），刷新控制不依赖 enabled 位
  可独立渲染；repoId null 行＝无启停/刷新入口（removeRepo 同边界诚实纪律，id 缺席
  行在词面可达范围之外）；②**禁用行在列不隐藏**——v0.2 enabled=false 行照常渲染
  ＋「已禁用」标注（呈现锚一）；**cacheUpdated=false 呈现「已是最新」非错误**（呈现
  锚二）；③**收据两臂诚实**——enabled/disabled 收据后订阅面读回新状态（收据不重复
  状态）；typed 拒绝（execution_failed 携原码 detail）照原词呈现不折叠 unavailable；
  能力缺席（capability_missing 折 failed 原词）与引擎缺席（unavailable）呈现区分；
  ④**禁用语义如实**——禁用行离开包集合世界但保留订阅面在列；UI 文案如实表述 VUA
  自有语义（W25 裁决 (c)：绝不写共享 settings.json，启停面是 VUA 自有状态文件）；
  ⑤**i18n 四表＋设计标准随批**——新键四语自然措辞、避让 wt-7 已审词面与 VUA-8
  previewLab/dialogClose 键面、保留未检查/无匹配更新/缓存空态区分（wt-7 纪律）；
  设计标准 §8 增补照 0.7.12 线双语；⑥**零端到端宣称**——消费切片交付时同批登记定
  向证据，真机走查归 W25（O-2）。
- **解锁状态**：F4「形状核可」桌面侧条件满足（本节）；双前置（冻结批 47d4185 经第
  139 批＋接线批 7361213 经第 141 批入库）全成就——**F4 桌面消费切片（仓库行启停
  控制＋刷新动作）就此解锁随本拍续领**；环境 F4 实现核对切片（VrcGetLib 覆写三独立
  位＋.vua/vpm-repo-state.json 自有存储＋etag 两臂投影＋repos_v02 状态位投影）候环
  境席位，与桌面消费互不阻塞（F2/F3/F5 双环先例：消费对 declared-none 后端诚实降级
  即合法形态——缺席臂兼容，消费不候实现入库）。零端到端宣称维持。

### 桌面消费落节（F4 仓库行启停控制＋刷新动作，wt-3，2026-09-21 03:0x）

**应本节解锁登记照 F2/F3/F5 消费先例续领**（核可节本拍落账，消费与核可同批交付——
F2 核可 670828f＋消费 f23f3a3 同批先例；追平壳 29edb9c 基点零预消费）。消费对象＝
packages-ops v0.6 冻结词面（冻结 47d4185 经第 139 批＋接线 7361213 经第 141 批均
在库）。**核对点逐条兑现**：

- **①能力缺席降级**——blocks.repoLifecycle 纯增量新键（p1/p2 双视图，逐面升级承
  诺照办；权威事实源＝served 行 packages.repoLifecycleOps）：行缺席或 unavailable
  ＝启停/刷新控制不渲染、订阅行照常呈现（降级非错误，TemplatesFace constant
  -absence 同构）；v0.1 族应答（族常量辨世代的 ReposListAnswer 双组，installed 双
  族先例同构）行无 enabled 位＝启停控制不渲染（状态不可知不猜测——诚实纪律#1），
  刷新控制不依赖 enabled 位独立渲染；repoId null 行不渲染任何控制（removeRepo 同
  边界诚实纪律）。
- **②禁用在列不隐藏＋cacheUpdated 两臂诚实**（集成 ①区两呈现锚）——v0.2 族
  enabled=false 行照常渲染＋「已禁用」标注＋禁用语义说明行（离开包集合世界、保留
  订阅面）；refreshed 收据 cacheUpdated=false＝「仓库缓存已是最新」信息呈现（role
  =status），**绝不渲染成错误**；enabled/disabled 收据后订阅面经广播按新事实重取
  （收据不重复状态，新状态读回权威在 v0.2 行）。
- **③诚实错误态**——typed 拒绝（rejected guard＋detail 原词溯源）行内 alert 呈现
  不折叠 unavailable；受理层能力缺席（capability_missing）折 failed 原词 toast 与
  引擎缺席（unavailable）toast 呈现区分；非成功终态 error.code 原词上呈（任务真实
  状态由任务中心呈现）；重复启停不宣称幂等，拒绝如实呈现。
- **④禁用语义如实（裁决 (c) 词面）**——启停区块说明与禁用行说明如实表述 VUA 自
  有状态口径（禁用在列、不写共享 settings.json；W25 只读证据裁决 (c)），与 §8.7
  设置面共享语义表述纪律的区分在设计标准 0.7.13 载明。
- **⑤退役与缺席臂**——旧 setRepoEnabled 本地假翻转全链退役（live 端原实现仅重取
  视图状态从未变更＝本地翻转假成功；演示面 RepoSection checkbox 改只读静态标注，
  empty/fixture gateway 三方法恒缺席臂照 F5 先例，mock 永不模拟 wire 回执、不出
  DEV 纪律照旧）；i18n 四表新增 lifecycle 组 13 键×4＋repos 组 2 键×4（toggleAria
  交互词面随 checkbox 退役），避让 wt-7 已审词面与 VUA-8 previewLab/dialogClose 键
  面；设计标准 0.7.13 双语（§8.7 仓库生命周期呈现段）＋REGISTRY 行随升。
- **⑥零端到端宣称**——served 行环境覆写置真前启停/刷新控制如实不渲染（declared
  -none 世代下缺席臂即合法呈现）；真机走查归 W25（O-2）。

**实现面**（桌面域 TS 全链一批）：packages/contracts desktop-gateway.ts＝三请求接
口（单键闭集 {repoId}）＋METHOD_KINDS 三行 command＋信封守卫三 case（携 digest/
projectPath/空 repoId 即拒）；electron gateway-router.ts＝三 translate 臂（command
Id lifecycle- 前缀照 A4 repo- 前缀先例）；renderer packages-port.ts＝RepoInfoRowV02
六键行＋ReposListAnswer 双族＋PackagesRepoLifecycleApplyOutcome 四态＋port 三方法
（setRepoEnabled 移除）；packages-live.ts＝REPO_LIFECYCLE_OPERATION_ID＋双族守卫
（isRepoInfoRowV02 六键闭集/发明字段即形状违规）＋listReposRaw 双族化＋
lifecycleViaTask（A4 repoWriteViaTask 同构：受理窄化→终态等待→Done payload 按
kind 字面量分派 enabled/disabled/refreshed/rejected）＋三方法薄封装＋blocks 投影；
PackagesPage＝runRepoLifecycle 单操作 busy 状态机＋P2ReposSection 行内启停/刷新控
制与行内终态呈现。

**定向证据（本拍亲测，b3581da 收编世代＋本拍消费批）**：contracts dist 重建照陈旧
事故先例后 pnpm check **84/84**；desktop **typecheck 双 tsconfig exit 0**；vitest
**90 文件 819/819**（对 main 世代 806 净增 13：live.test F4 组 6 枚〔能力行翻转/
三方法 task loop 骑行＋三键四键闭收据/两臂皆成功＋typed 拒绝/四态降级与形状违例/
v0.2 协商消费＋v0.1 照常/v0.2 行闭集两负例〕＋router.test F4 分发臂 1 枚＋
production-workshop-view.test 失败行词面 5 枚＋live-production-port 失败行骑行 1
枚）＋build 成功＋**check:i18n OK**（四表对齐）＋**check:boundary OK**＋
**check:contrast 全达标**。df 先查后申报。**零端到端宣称维持**。

---

## 集成验收登记（第 143 批，2026-09-21 03:2x）

- **F4 桌面消费环验收入库**：消费批 e05e1e7＋失败行修复批 8563571（wt-3）经
  --no-ff 合并 e40530c 收编。集成逐文件亲审成立：六项消费核对点逐条兑现（能力
  缺席降级／禁用在列不隐藏＋cacheUpdated=false「已是最新」信息呈现绝非错误／
  诚实错误态／裁决 (c) 词面纪律／setRepoEnabled 本地假翻转全链退役＋演示
  checkbox 只读化〔全桌面零残留假成功路径〕／零端到端宣称）；失败行修复批兑现
  诚实纪律 #2（messageKey 命中词表用本地化词面、断链/词表外回落 code 原词、
  error 缺席仅基础词面绝不虚构）。合并树定向复跑全绿（读数见 wt-main 状态批
  第 143 批；首跑 vitest 818/819 一例红系本树 contracts dist 陈旧——重建后
  819/819 全绿，陈旧事故先例口径）。
- **F4 环境实现批验收裁决＝退回（不合并）**：实现批 3f8f55d（wt-6，恰两文件
  1008+/14-）对照冻结词面 47d4185 逐条复核，其自拟十项核对表所载各项（存储
  裁决／settings.json 逐字节钉／三独立位与缺席臂／cacheUpdated 双臂／refresh
  不改位／六键闭集 id 缺席恒真／零新码三复用／add-remove 残留清扫／wire 零触
  碰）经亲审成立；三项实现侧解释（无 url 本地行 refresh=false、LF 写回、etag
  读法）审为忠实镜像的实现自由度非词面偏离。**但冻结词面「禁用语义＝该行离开
  包集合世界」（packages-ops v0.6 协议本「启停语义（冻结词面事实）」节＋
  REGISTRY 冻结行明文：repo-catalog 列表／latest 判定／A2 安装解析器不再见其
  包）未兑现**——集成直读 slot/wt-6 树源码：禁用集消费点恰三处（启停写面、
  add/remove 清扫、list_repos_v02 投影），repo_catalog／package_catalog_impl
  （PackageCollection::load/load_cache 装载全部订阅行）与安装解析路径均无禁用
  过滤，禁用行的包仍参与枚举与解析。而 packages-repos v0.2 协议本对 enabled
  位语义定义恰为「true＝该行在包集合世界中活跃（enumeration and resolution
  see its packages）／false＝禁用但在订阅且在列」——位答 false 而枚举解析照
  见其包＝投影虚假事实（诚实纪律 #1）。此系冻结词面语义缺失非实现自由度；
  实现批自拟十项核对表第 6 项只核投影未核效果面属核对表漏项，验收对照对象是
  冻结词面本身。wt-6 十项之外另有两项交叉实证同理登记：桌面消费批 i18n
  disabledNote 词面向用户承诺「包不再参与浏览与安装解析」——该承诺的效果面
  即此缺口。**退回处理**：候 wt-6 补切片（集合装载路径消费禁用集：repo-catalog
  列表／latest 判定／安装解析器三面＋测试钉），补切片入库并验收后 F4 链方成
  五环。**F4 链现况如实：冻结 47d4185→接线 7361213→形状核可 8955430→桌面
  消费 e05e1e7 四环在库，环境实现环退回在途**——027 收官状态如实登记为
  F1/F2/F3/F5 四链全闭环＋F4 链四环在库，不宣布 F1–F5 全部落地。
- **零端到端宣称维持**：全部结论系代码面＋fake 端口证据；F4 served 行真机翻
  转、禁用/刷新控制真机呈现、执行日志失败行真机呈现归 W25（O-2）。

---

## 集成验收登记（第 145 批，2026-09-21 04:0x）——F4 补切片验收入库，退回-补交-闭环链就此闭合

- **F4 环境实现补切片验收入库**：补切片 08923b5（wt-6，恰两文件 631+/46-
  ＝crates/project-manager src＋tests）经 --no-ff 合并 63c8981 收编，随并入
  退回实现批 3f8f55d（第 143 批亲审成立面原样入库）＋自理追平壳 14d19ed
  （零自有内容）＋状态批 f86dfe1/342dfba。集成四验收点逐条亲审成立：
  1. **五装载点确接过滤且仅作用于包集合世界**（第 143 批退回理由恰一处的
     正面核销）：新 `collection_world()` 装载输入构造（读 VUA 自有状态文件
     →克隆 Settings→库公开 `remove_repo` retain 按 repoId 移除禁用行）在
     装载层一次完成，集成直读源码核实恰五调用点全数接入——`repo_catalog`
     （:1481）、`package_catalog_impl`（:2092，`package_catalog`/v02 双族
     同走）、`list_packages_v02` latest 判定（:1135）、`preview_install`
     （:1651）＋`apply_install`（:1896，A2 解析器）；过滤后 `world` 传入
     每处 `PackageCollection::load/load_cache`，原 `settings` 仅用于
     show_prerelease 开关等非集合事实；`preview_install_for_plan` 两臂均
     委托已过滤 `preview_install`＝无第六裸装载点。**两面不矛盾复证**：
     `list_repos_v02`（:1386）逻辑零改动零过滤调用——enabled=false 行照列
     （诚实纪律 #1 正面：订阅面在列）而其包在枚举/判定/解析三面缺席
     （反面：集合世界如实收窄），测试①两面对照同测试钉死。冻结词面
     packages-ops v0.6「启停语义（冻结词面事实）」节（协议本 :88–93）逐
     句兑现。
  2. **offline load_cache 腿已钉＋缓存失效结构钉成立**（第 143 批点名项）：
     测试①全 offline（`with_environment_root(..., true)`）且断言
     `cache_sourced=true` 证明 load_cache 腿真实走通非旁路；测试④在线臂
     （`cache_sourced=false`＋预定义两仓库自有开关环回化＋loopback 200）
     证明过滤骑在线装载臂同等成立。缓存失效结构钉双重实证可信：结构面＝
     `VrcGetLibBackend` 字段恰 runtime/http/root/offline 四项（无跨调用集合
     缓存层可存活）；行为面＝测试②同实例三 Toggle 六世界态（缺省全启用→
     禁用排除→启用恢复→再禁用排除，写面返回后下一读面即见新状态——若有
     缓存层此测必红）。
  3. **损坏状态文件拒绝而非猜测全启用**（诚实纪律 #3 同族）：测试③写
     "not-json" 后五面（repo_catalog／package_catalog／preview_install／
     list_packages_v02＋v0.2 投影面）全拒复用码 `vua.vpm.backend_unavailable`
     ＋category Unavailable；apply_install 与 preview 同 helper 同共享构造
     器 `backend_unavailable_state`（源码 :1896 亲核）同享拒绝。
  4. **词面零改、wire/provider-host/桌面零触碰复证**：补切片 diff 恰两
     project-manager 文件，零 docs/contracts/i18n 触碰。两项实现侧解释经
     对照协议本核为**向冻结词面收敛**非偏离：①第 2 层 cached 事实改
     `repo_cached_fact` 统一事实源——packages-repos-catalog v0.1 冻结字段
     语义「逐仓库缓存存在性已由必带 cached 事实诚实覆盖」，旧硬编码 false
     对缓存在场的禁用行恰系谎报未刷新，新实现对启用行第 2 层逐案相等
     （可解析缓存必被装载）、对禁用行如实 true；②装载腿状态读取失败经共
     享构造器与 v0.2 投影面同事实同码同词——list_repos_v02 内联闭包换构
     造器零字节差，一事实一码。
- **合并树定向复跑集成亲测全绿（04:0x，df 先查 582G/69%）**：cargo test
  四 crate **合计 736/0**（project-manager 140/0＝vpm_backend 70〔常备
  66＋补切片新 4〕＋orchestrator 234/0＋provider-host 288/0＋unity-bridge
  74/0；对第 143 批世代 723 净 +13＝退回批自带 9 例＋补切片 4 例，数字
  自洽）＋clippy 四 crate --all-targets **0 警告**＋desktop typecheck 双
  tsconfig **exit 0**。merge-tree 预检 exit 0 零冲突（合成树 a85e8d7）。
- **F4 五环闭环（027 收官）**：冻结 47d4185〔139〕→接线 7361213〔141〕→
  形状核可 8955430〔142〕→环境实现 3f8f55d＋补切片 08923b5〔145〕→桌面
  消费 e05e1e7〔143〕。退回-补交-闭环链留痕：第 143 批退回裁决（冻结词面
  效果面缺失＝投影虚假事实，诚实纪律 #1）→ wt-6 补切片逐条兑现（第 143
  批点名腿全钉＋实现侧解释两项经协议本对照核为收敛）→ 本批验收闭环。
  **F1 隔离文案修正＋F2＋F3＋F4＋F5 五链全部落地；F6 方向锚维持不冻结、
  不立案、单独归档候立不变**。桌面 disabledNote 词面「包不再参与浏览与
  安装解析」自此有真实效果面背书（此前因 v0.2 族无人应答无呈现路径，缺
  口已闭合）。
- **零端到端宣称维持**：全部结论系代码面＋库面＋环回源证据；F4 served 行
  packages.repoLifecycleOps 真机翻转、禁用/刷新控制与 disabledNote 真机
  呈现、#43 真机复验全归 W25（O-2）。测试绿≠真机绿。
