---
proposal: 027
title: "包管理器 P0 体验面：包发现＋更新感知＋仓库启停/刷新＋模板枚举＋026 隔离文案修正（用户 2026-09-19 裁决立案）"
status: 讨论中（2026-09-19 深夜推进：开放问题 1 核心表态〔58d1a0c〕＋开放问题 3 桌面表态〔75f0dac〕落节经第 120 批收编，F1 文案修正切片 cbfb9d8 已验收入库；候环境开放问题 2 库面考证落节后三域收敛→核心起草 F2 冻结批——各面照 026 五链程序逐面办理）
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
