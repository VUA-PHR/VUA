---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: e9ca149
updated: 2026-09-11
---
## 当前焦点
**W25 用户延期（O-2 补注消化）**：BOARD O-2 补注〔2026-09-10〕——用户明示
不便实机测试，W25 开窗**延期、时间待定，当晚窗口无真机任务**。产线就绪状态
**保持不撤**：A 段（A1 EditMode 全套件→A2 冒烟端到端→A3 构建排除对比）
随时可执行；A2 fixture 草稿（无 constraint 诚实跳过路径，recipe v0.3
schema-valid）与 A1 断言（f7ff690，本机真机 23/23）均在位；窗口重排后按
执行序 v3 进入。**今夜产线无实现项**：BG 工单全部闭环（BG-7/8/9/13 由操作
者修复令交付——其中 BG-8 补登含产线域 amf-production v0.2、BG-9 将
inspection_evidence_vectors 纳入 schema-vectors 清单〔草案漂移保护，不暗示
冻结〕，均知会消化）；BG-3 桌面主导；016 已接受（定义权义务在 M7 锚点兑现）。
#7 瞬败样本观察义务维持。
## 前情：proposal 016 全链闭环（2026-09-10 凌晨）
BG-4 → 三方表态齐（核心＝存储第五文档库锚 EvidenceStore＋独立词表行
inspection-queries/v0.1；环境＝dependencies 事实源边界声明＋无源确认；数据
＝BDL 不涉）→ 集成仲裁照单采纳 → 提案状态「已接受」。产线承接仲裁第 4 点
定义权义务：dependencies 维消费层选择（声明完整性 vs 引用完整性，或两层
分列）在 M7 检查切片实现时显式选择并写入冻结件——锚点前不冻结、不预接
事实源、不猜操作形状。
## 自基线交付（6f2c7b7 后）
- 本轮维护批无新交付：合并 main 追平（ad46501 已随 abab341 入 main）＋
  BG-4 闭环消化＋数据复核收讫＋本状态文件（collab-only）。
- **BG-4 交付（inspection-evidence v0.1 草案批，ad46501——已随 abab341 验收
  合并入 main，工单闭环）**：
  1. **Schema 草案** `schemas/inspection-evidence/v0.1/inspection-evidence.schema.json`
     （**草案态：未冻结、REGISTRY 未动**）——五维闭集
     functional/performance/dependencies/lighting/upload_readiness；每维
     status（pass|warn|fail|unavailable）＋basis 五值＋checks[]；
     **unavailable 维 schema if/then 钉死 basis=none＋空 checks＝「缺席即
     证据」**；basis 诚实纪律：bridge_local_estimate 延续 analyze_performance
     「非官方等级」标注，official_sdk_rating 为保留值（SDK 交接切片落地前
     禁用）；bridge 段转抄纪律照 Build Record jobs[]（operation/commandId/
     status，不解释）；evidenceId 惯例同构 W23（inspectionId＝uuid v7）；
  2. **向量 7 件**（examples/：正例 2＝五维全量/含 unavailable 最小形态；
     负例 5＝未知维度 kind/未知 severity/unavailable 带 basis 矛盾/缺
     inspectionId/未知 overallStatus）；
  3. **向量校验测试** `crates/unity-bridge/tests/inspection_evidence_vectors.rs`
     4 项全绿（2026-09-10 本机：正例过＋负例拒＋维度闭集无重复＋聚合规则
     断言〔fail＞warn 含 unavailable＞pass〕）；
  4. **proposal 016**（collab/proposals/016-inspection-evidence-draft.md）：
     设计表态全文＋协作表态请求（核心＝存储面/读取路由/消费语义；环境＝
     dependencies 跨域引用形态复核；数据＝BDL 不涉确认）＋冻结硬前置清单
     （§7：Bridge 产出操作、核心路由、向量＋消费测试、双语协议本、REGISTRY
     随冻结批——**当前 ①②④⑤ 均未发生**）；
  5. **BOARD 登记**：开放问题 #19＋工单表 BG-4 交付标记＋最近更新行。
- 本轮合并 main（d6a08a2→6180cc7→9cdf7ba 多轮追平）。
- 历史交付（已验收在 main）：W25 预热 A1 补齐（f7ff690，EditMode 23/23 本机
  真机，证据 `_local_w25/`）；W21 全链（v2 冻结 1a9cdf6＋C# 06802b9/aa2a9da
  ＋Rust 前置 8fcff01＋物化 9195fbb＋信封桥接 1438305）；W1 16/16（M3 关门）；
  amf-unity 1.0.1 批。
## 用户裁决登记（2026-09-09 收尾时段；产线相关三项）
- **项 10（条目 2 裁定）**：呈现层屏蔽＝deleteOriginals 协议动作保留、导入链
  编排不变、**W14 词表零变更**——产线条目 2 歧义按分支 (a)（呈现层）裁定，
  与产线推测一致。实现归桌面下个工作时段；**产线无实现项**（provider 语义
  层与 wire 词表均不动）。
- **项 2（M6 增设批准 IMP-1~5；IMP-4＝本地导入收口）**：登记。IMP-4 涉及
  warehouse.import——产线域内事实维持：导入不走 Unity Bridge，产线无实现
  工作。
- **项 3（购买流暂不做，非永久——取决于与 BOOTH 官方联系）**：登记。影响
  条目 3「从云端下载」的范围边界；产线无涉。
- BOARD 对照：条目 2 歧义无 BOARD 行（操作者直接路由用户），无需销账。
## 阻塞
- 无阻塞。W25 用户延期、时间待定（O-2 补注）；产线无动作项，窗口重排通知
  到达即进入 A 段。
## 下次合并意图
本状态批（仅 collab/ 增量）随轮带入免测。无在途实现交付（BG-4 批 ad46501
已在 main）。
## W25 窗口执行顺序草案（v3 定稿——用户裁量确认 E2 在窗，环境已确认）

**执行序：B1→A1→A2→A3→〔用户启动 VRChat〕→B2a→B2b→B3→归档**（E2 运行中
探测确认在窗执行，不再顺延）：

| 序 | 阶段 | 主导 | 内容 | 证据 |
| --- | --- | --- | --- | --- |
| B1＝E1 | 环境·只读探测（先行，无前置，<1min） | 环境 | eac-probe 真机探测（当前机器状态如实快照，不假设有无 EAC 残留） | probe 输出归档 |
| A1 | 产线·EditMode | 产线 | C# EditMode 全套件（含 exclude_object VRCMetaObject 组件断言） | 测试输出归档 |
| A2 | 产线·冒烟路径 | 产线 | 合法素材冒烟端到端：素材备份→导入→Local Resolution→plan.approve→job.execute（Bridge v2）→Build Record→record 读面复核 | 冒烟 log＋Build Record 文档归档 |
| A3 | 产线·构建对比 | 产线 | VRCMetaObject.excluded 构建排除效果对比 | 构建产物差异记录归档 |
| — | **用户衔接点** | 操作者 | 启动 VRChat 客户端（账号交互由用户操作）；产线/环境确认会话活跃后进入 B2a | — |
| B2a | 环境·运行中探测（<2min） | 环境 | 会话活跃探测（对真实 easyanticheat.exe） | 会话探测记录归档 |
| B2b | 环境·R3 完整再核验（<3min） | 环境 | WinVerifyTrust=Verified 断言＋四要素取证（签名者/证书主题/完整路径/哈希） | 核验报告＋四要素取证归档 |
| B3＝E3 | 环境·残留探测（VRChat 退出后，<1min） | 环境 | 残留状态探测（若 EAC 进程残留则再核验） | 残留探测记录归档 |
| B4＝E4 | 环境·证据包归档（收尾，<5min） | 环境 | 证据包归档 `_local_eac/`（gitignore 照 W1 惯例） | 证据包清单归档 |

**窗口义务交叉确认**：窗口内零 TerminateProcess、零清单生效写入——产线 A 段
不触碰任何 EAC 面，无冲突；证据包措辞纪律与条目起草归环境；两树失败均不阻断
对方阶段。

## 用户回传登记与条目 2/3 意图确认（产线，2026-09-09；禁改实现）

### 条目 2：仓储条目的产物模式门控与「删除原始素材」位置

**用户意图复述（产线理解）**：
1. 「生成 VPM 包替代」全局开关＝条目侧产物模式 UI 与动作的**总闸**：关——
   本地素材条目上**无产物模式切换 UI、无条目动作**；开——来源为原始
   UnityPackage 的素材条目才出现「生成 VPM 包替代」按钮；
2. 「删除原始素材」按钮**任何情况下不出现在本地仓库（仓储条目 UI）**——删除
   动作只在导入时按「生成后删除原始素材文件」开关触发工作规则（导入编排链）。

**域内现状事实（本机核实）**：
- 仓储条目动作（generateVpm/deleteOriginals 按钮）由 `entryActions(entry)`
  守卫驱动（服务端读取面，与 009 受理预检镜像）——**不随实验性全局开关门控**
  （开关只写 composed global 默认值＝生效模式解析，不影响动作可用性）——与
  用户观察一致；
- 产物模式组（跟随全局/使用原始 UnityPackage 切换＋覆盖写入）同样无全局开关
  门控；
- 「删除原始素材」手动入口现状在仓储条目 UI（007/008 路径 a 交付）；导入时
  自动链路（010 路径 A＋011 挂点：导入→composed global=generate_vpm→自动
  生成→Done 后 deleteOriginals）已全链落地（执行序②收口）。

**处置草案（桌面域切片；协议零变更）**：
1. 仓储条目 UI 门控：产物模式组与条目动作按「生成 VPM 包替代」开关门控
   （开关状态已在桌面本地，呈现层实现）；条目动作可用性继续走 entryActions
   守卫（服务端语义不变）；
2. 「删除原始素材」手动入口从仓储 UI 移除；协议动作 deleteOriginals **保留**
   （导入链路自动消费；wire 词表 v0.3 不动）；
3. design-standard/008 记录随批修订（条目动作门控语义）。

**待用户确认的歧义（产线无法代决）**：
- 「无产物模式」是仅呈现层（UI 不显示）还是语义层（provider 拒绝 override
  写入）？呈现层＝纯桌面切片零协议变更；语义层＝W14 冻结的 composed/override
  解析需守卫变更（跨域，动冻结面）。产线推测为呈现层（与「无条目动作」并列
  的呈现语境），请确认。

### 条目 3：素材导入页面（云端下载/本地导入）

**用户意图复述（产线理解）**：新增明确的「素材导入页面」，两部分——从云端
下载（暴露 Web 浏览缺口，已交审阅子智能体）、从本地导入；作为 M6 增设阶段
立项。

**域内事实（产线域＝unity-bridge）**：素材导入**不走 Unity Bridge**——本地
导入协议与实现已冻结落地（warehouse.import，bdl-commands v0.3；执行序②全链
收口），**产线在此页面无新工作、无协议新增**——如实声明。

**处置草案（桌面/数据域；产线无涉）**：
1. 「从本地导入」＝warehouse.import 的 UI 接线（协议已备，桌面切片）。
   **L-1 更正备案（集成，2026-09-09）**：导入 UI 已随 W18 呈现批验收合并——
   「接线待办」表述不符，条目 3 的「从本地导入」实为既有导入 UI 的入口收敛/
   重组（是否重组随用户确认后的新页面设计走，桌面域）；产线侧意图确认结论
   不变（导入不走 Unity Bridge，产线无涉）；
2. 「从云端下载」＝F4 下载能力已有；Web 浏览缺口按用户指示归审阅子智能体；
3. M6 增设阶段立项建议：任务行锚 product-boundary 1.2.x 素材入口语义，
   负责桌面、协作数据（词表已备）；排期归集成/操作者。

## 留言
- [→核心] **A2 冒烟 fixture 决策回执**：按你方知会选「无 constraint 诚实
  跳过」路径——冒烟 recipe 整体省略 dependencies（条目内 versionConstraint
  必填，故无 constraint＝省略数组）＋省略 locked；草稿已按 recipe v0.3
  schema 校验通过（`_local_w25/a2-smoke-recipe-draft.json`，本地不入库），
  含 exclude_object 关系供 job.execute 真实作业与 A3 铺垫。窗口内替换
  warehouseItemId 与层级名两处运行时值。
- [→操作者] W25 开窗通知（晨起 O-2）发出后请同步本树；BG-4 交付不阻塞窗口
  义务（A 段就绪不受影响）。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案/冻结批/012 互审/executor prelude/信封扩展/exclude 形态/
  物化切片验收、核心两件请求到位、项 10 裁定送达、条目 2/3 域内事实复核、
  桌面 f8ddc5d 域边界复核、集成 A1 验收——均已闭环。）
