proposal: 011
title: Recipe v0.3、Local Resolution 与批准计划、版本锁——W20 设计稿（009 互审上游）
status: 收敛（2026-09-08：三域表态齐〔桌面吸收进正文／数据转内联无异议／产线互审 §4 通过·互审点 1/2/3 关闭〕；集成门序与验收归属已裁；planRef 文件形态建议由核心随 W20 冻结切片确认落实；冻结切片交集成验收）
author: wt-2（核心角色）
date: 2026-09-08
---
## 0. 本文的地位与纪律

W20＝「Recipe v0.3、Local Resolution、版本锁」（核心负责、数据协作；outline
2.0.8）。本文是 009 表态承诺的**互审上游**：产线 Bridge v2 草案（009）消费的
「批准计划」形状在此给出草案；数据（W23 兼容/缺失证据、bdl 存储交界）、桌面
（W24 工作台消费）的接口点在此显式化。**本文是设计稿不是冻结**——收敛后按冻
结硬前置落 `schemas/recipe/v0.3/`（Schema＋正负例向量＋至少一端消费测试）。
演进纪律沿用 outline 既有裁决：Recipe v0.3 定型后 v0.2 整体废弃，不建迁移器。

## 1. 现状基线（v0.2，M3 冻结面）

`schemas/recipe/v0.2/` 三件套：

- **recipe**：`{ formatVersion, recipeId, revision, title, description,
  createdAt, updatedAt, environment(unityVersionConstraint+capabilities),
  target(platforms+avatarInstanceId+performanceTarget), assets[](role/label/
  entityRef/sourceRef/selection/requiresAssetIds/required), instances[],
  relations[], wardrobeGroups[], dependencies[], locked(lockVersion/
  recipeRevision/generatedAt/status/unity/packages/assets), extensions }`；
- **local-resolution**：`{ schemaVersion, recipeId, recipeRevision,
  environmentId, resolvedAt, assets[] }`——解析产物已任务化存在，但**没有
  「批准」语义**，也不是 Bridge 的输入形状；
- **build-record**：`{ buildId, recipeId, recipeRevision, status, inputs,
  tools, steps, output }`——M3 material 线消费中（W22 升 v0.3 另批）。

M5 生产主线缺口：**「Recipe→解析→批准→执行→记录」的中间产物「批准计划」
不存在**——009 骨架的 `execute_production_job` 输入（计划文档引用＋计划哈希
＋期望前置指纹）没有权威形状。本提案补这个洞。

## 2. 产物链与文档边界（M5 生产主线）

```text
Recipe v0.3（用户草拟/编辑，AMF 持久域）
  → Local Resolution v0.3（provider 运行解析：本机素材/包/版本事实 × Recipe）
  → 批准计划 approved-plan v0.3（解析结果＋操作序列＋用户批准固化）★新产物
  → Bridge v2 作业（execute_production_job，产线 009）
  → Build Record v0.3（W22，逐作业收据聚合＋恢复点）
```

文档边界：**Recipe 是意图**（做什么）；**Local Resolution 是事实**（本机
有什么、每个素材解析到哪个来源）；**批准计划是授权**（用户看过解析与操作
序列后批准的执行授权，含计划哈希与前置指纹）；**Build Record 是历史**（实际
发生了什么）。四者独立版本化、独立审计，互不内联（009 表态第 1 条的
引用不复制原则贯穿）。

## 3. Recipe v0.3 演进点（相对 v0.2）

1. **`locked` 段升格为版本锁的一等语义**（见 §6）：锁的生成/校验时机与受理
   预检序列（009 表态④）绑定；`lockedPackageSource` 扩展 VPM 副本作为锁对象
   形态（同 `warehouseItemId` 关联）。
2. **素材引用支持仓储条目来源**：`asset.sourceRef` 扩展 `warehouse:` 来源
   形态（warehouseItemId＋角色 original/generated_vpm 可解析引用）——导入面
   接线（010 已裁路径 A）后，导入产生的条目是素材的合法来源；解析语义见 §5。
3. **`environment.unityVersionConstraint` 与版本锁的关系显式化**：constraint
   是作者意图（兼容范围），locked.unity 是解析结论（本机锁定值）——v0.3 在
   文档内注明两者不得混写。
4. 其余段（assets/instances/relations/wardrobeGroups）形状沿用 v0.2，M5 冒烟
   路径（一个 Avatar＋一件衣装）所需的操作词汇已在 v0.2 relations 覆盖
   （installModularAsset/attachToBone/excludeObject/setObjectActive）。

## 4. 批准计划 approved-plan v0.3（Schema 草案——009 互审核心件）

```jsonc
{
  "schemaVersion": "0.3",
  "planId": "uuidv7",
  "recipeId": "…", "recipeRevision": 7,
  "localResolutionId": "…",           // 来源解析文档身份（事实链）
  "environmentId": "…",
  "createdAt": "…", "approvedAt": "…",
  "planHash": "sha256:…",             // 完整性与幂等锚（009 表态①）
  "fingerprint": { "expectedProjectFingerprint": "…" },  // 批准时点项目状态
  "target": {                          // 解析后的目标（引用 Recipe 并补解析结论）
    "avatarInstanceId": "…",
    "resolvedSource": { "sourceKind": "original|generated_vpm",
                        "artifactSha256": "…", "warehouseItemId": "…|null" }
  },
  "jobs": [{                           // 有序 Unity 作业序列（Bridge v2 逐作业）
    "jobId": "…", "kind": "install_modular_asset|attach_to_bone|…", // v0.2 操作词汇
    "inputs": { … },                   // 作业输入（词汇随 kind，引用解析结论）
    "resolvedSource": { … }            // 逐作业素材来源解析结果（产线范围注记：
                                       //   dry-run 清单与收据携带它，Bridge 照实转抄）
  }],
  "status": "draft|approved|superseded",
  "extensions": { }
}
```

设计要点：

- **planHash＝对计划文档规范序列化的 SHA-256**（009 表态①的锚；幂等重放键=
  planHash＋项目＋计划版本，产线骨架已对齐）；
- **status 生命周期**：draft（解析后未批准）→approved（用户批准，固化为执行
  授权）→superseded（新计划/新解析取代，旧计划不作废已产出的收据）；不存在
  executed 态——执行事实在 Build Record，计划只管授权（诚实分工）；
- **批准语义**：approve 是用户对「解析结果＋操作序列＋dry-run 结果（如有）」
  的显式确认（高危确认纪律的 M5 形态；删除类动作仍走 008/007 裁定的延迟确认）；
- **jobs 词汇来源**：v0.2 relations/操作词汇的作业化投影；Bridge v2 消费时
  按 kind 分发到 v2 操作——词汇闭集在 recipe v0.3 Schema 枚举，词表外＝契约
  错误。

## 5. Local Resolution v0.3 语义

- **输入**：Recipe v0.3 ＋ 本机事实（warehouse 条目与工件身份——
  `warehouse_entry_cards`/`entryDetail` 查询面已冻结；Unity 版本与包安装
  事实——environment 域查询面）；
- **解析规则（每 asset）**：候选来源枚举（warehouse 条目 original 件/
  generated_vpm 副本/文件系统路径），按 `effectiveArtifactMode`
  （override ?? composed global，W14 冻结查询面）选择来源——**选择语义的
  守卫（何时可用副本）在此落实**：generated_vpm 仅当条目存在 role=
  generated_vpm 的已验证副本（三态检查结论 clean）时可被选中，否则如实回落
  original 并在解析文档记录 `fallbackUsed: true`（不猜测、不虚构）；
- **输出**：local-resolution v0.3 文档（解析结论＋缺失/不满足项的诚实标记
  ——**缺失证据本体归 W23 数据模型**，解析文档引用之，不内联）；
- **解析是 provider 只读操作**（不落 BDL 变更、不触 Unity 变更）；产物持久化
  归 AMF（存储面请数据表态）。

## 6. 版本锁语义（v0.2 locked → v0.3）

- **锁的生成**：Local Resolution 时按解析结论生成/更新 `locked` 段
  （unity 锁定值、packages 锁、assets 锁）；`lockVersion` 随每次重新解析递增；
- **锁的消费**：进入 009 表态④的受理预检序列第①步（版本锁校验＝Recipe 锁定
  值 vs 全局政策 2022.3.22f1＋环境实际值，纯数据/环境事实，不触 Unity）；
- **锁的失效**：环境变化（Unity 升级/包卸载）使锁失效→解析过期标记→重新解析
  →重新批准（批准计划的 fingerprint 预检会拦住过期计划，009 表态④第③步）；
  失效不静默：任务面类型化错误＋桌面呈现（呈现形态归桌面 W24）。

## 7. 命令面（production-use-case v0.2 词表草案——010 已裁升版）

草案词表（全部走 production-use-case v0.2；任务生命周期复用九态，010 已裁）：

| 方法 | 语义 | 任务化 |
| --- | --- | --- |
| `recipe.save` | Recipe 草拟/更新（AMF 持久域写入） | 同步 |
| `recipe.get` / `recipe.list` | 读面（工作台消费） | 同步 |
| `recipe.resolve` | 运行 Local Resolution（只读解析） | 任务（解析可能较重） |
| `plan.approve` | 批准计划固化（draft→approved） | 同步（幂等） |
| `plan.get` / `plan.list` | 读面 | 同步 |
| `job.execute` | 提交批准计划给 Bridge v2 执行（009 骨架） | 任务（九态＋取消＋恢复） |
| `record.get` / `record.list` | Build Record 读面（W22 升版后） | 同步 |

开放点（请数据/桌面表态）：Recipe 草拟的编辑发生在桌面本地还是 AMF 侧
（`recipe.save` 的粒度：整文档提交 vs 段落级操作）；读面分页/过滤闭集。

### §7 收敛决议（2026-09-08，桌面表态吸收＋数据 010 决议联动）

- **save 粒度＝整文档提交**（桌面表态采纳）：编辑状态在桌面本地（草稿），保存
  ＝整文档提交 AMF，每次保存递增 `recipeRevision`（审计天然成立）；段落级
  patch 语义 v0.3 不引入（无消费方驱动，不做无消费方的设计）。
- **读面闭集＝同构 catalog.list 先例**（桌面表态采纳）：get 直取；list 分页
  （limit/offset）＋过滤（text 标题子串；plan/record 另按 recipeId、status）；
  词表外参数＝`invalid_params` 契约错误。最终形状随 W20 冻结切片钉入 Schema
  并知会桌面（回应桌面「冻结时确认」请求）。
- **resolve 任务化**（桌面消费形态确认）：解析发起后引导任务中心，解析文档经
  plan.get 链读取——任务权威在任务中心，与 W15/010 惯例一致。
- **importCorrelationId**：已由数据钉进 bdl-commands v0.3 词表（010 收口决议），
  wire 面归属 v0.3；recipe/plan/record 读面闭集按上条随 W20 冻结——两项合成
  桌面条件渲染的最终形状（010 承诺 6 兑现路径）。

## §6 补充：失效呈现（桌面表态吸收）

两层形态，桌面不自行判定失效事实（环境变化是 provider 的事实，桌面只消费失效
标记——诚实分工）：a) 工作台内联——计划/Recipe 卡失效徽标＋「重新解析」引导，
失效状态从 plan.get（status/fingerprint 预检结论）读取，发起执行前即可见，不弹
打断式对话框（失效是状态不是危险动作）；b) 任务面——执行受理预检拒绝（009
表态④第③步）走类型化错误＋通知中心（与 010 生成守卫拒绝同构）。

## §4 补充：批准交互流（桌面表态吸收）

resolve 任务 Done → 工作台呈现解析摘要（目标、逐素材来源解析结论、fallbackUsed
标记、缺失项诚实空位）→「查看计划并批准」→ 要点确认面板（目标 Avatar、作业
序列按 kind 分组计数、素材来源徽标 original/generated_vpm、planHash 末位标识）
→ 确认（plan.approve 同步调用）；dry-run 结果（如有）在批准面板内折叠区呈现，
不另开对话框。approve 非破坏性动作，采用要点确认面板而非高危延迟确认——与
§4 批准语义一致（删除类高危动作仍走 008/007 裁定形态）。

## 8. 各方表态请求

- [→产线] **互审核心件**：§4 批准计划形状 vs 009 骨架的 `execute_production_job`
  输入——jobs 词汇投影、planHash 锚、fingerprint 预检的消费方式；互审通过后
  两边再各自冻结（009 表态第 3 条时序）；
- [→数据] §5 解析产物的存储面归属（AMF 持久域的哪块；bdl 是否参与）；§7
  `recipe.save` 粒度意见；W23 缺失证据模型与 §5 的引用交界；
- [→桌面] §7 读面消费（W24 工作台）；§6 失效呈现形态；§4 批准交互（approve
  的 UI 语义与 dry-run 结果呈现）；
- [→集成] 门序：本文收敛后 W20 冻结切片（Schema＋向量＋消费测试）的验收归属
  与 W18/W19 接线批的关系（建议：W20 冻结先行——010 已裁 v0.3 冻结先行于
  wire/挂点实现，同为 M5 首批内的冻结硬前置）。

## 收敛决议（核心，2026-09-08——三域表态到齐后的吸收记录与剩余裁决）

1. **四产物存储面（数据 §5 交核心的定义权，就此定义）**：Recipe/Local
   Resolution/批准计划/Build Record 归 **AMF 生产持久域，采用文档库形态**
   （BuildRecordStore 先例：整读整写、版本化、按身份取回）；SQLite 表族不扩。
   理由：四产物是文档型产物（无复杂查询压力——读面经命令面内存索引；引用
   不复制使跨文档只有身份引用），与既有 BuildRecordStore 同构，实现与心智
   成本最低。落地在后续实现切片（本冻结切片只管 Schema 套件）。
2. **baseRevision 乐观并发（数据建议，采纳）**：`recipe.save` 携带
   `baseRevision`，不匹配＝类型化冲突错误（防覆盖丢失）——形状归
   production-use-case v0.2 命令面（010 已裁升版，随 W20 实现切片定义）；
   save 时结构校验（本 Schema＋引用完整性）与 recipeRevision 递增语义由
   recipe v0.3 Schema 承载。
3. **读面闭集定稿**（§7 收敛决议＋数据最小起步意见合并）：text/limit/offset
   ＋plan/record 按 recipeId、status 过滤，updatedAt 排序；更多过滤随需求
   升版——桌面与数据意见一致，无分歧。
4. **W23 解锁**（数据）：011 收敛即 W23 领取条件达成——§5 语义定稿，缺失
   证据条目模型的形状意向（evidenceId/kind 闭集/subject/…/evidenceIds 引用
   不复制）已由数据给出，W23 冻结时定 Schema＋向量＋消费测试。

## 表态（产线，2026-09-08）

**§4 互审：通过**（对照 `schemas/unity-bridge/v2/` 草案〔009 载体，随本表态同批
更新〕逐点审查；澄清：产线互审侧已是完整 Schema 草案＋16 向量＋6 消费测试，非
仅骨架——此前「骨架」表述是时序竞争下的保守措辞）。

**对齐确认（§4 草案 ↔ v2 草案，互审点 1/2/3 就此关闭）**：

1. **planHash 锚**：§4「规范序列化 SHA-256」与 v2 `payload.planHash`
   （`^sha256:[0-9a-f]{64}$`）对齐；重放键三元组＝planHash＋项目＋
   planSchemaVersion（兼容检查通过为前提；哈希本身已唯一标识内容，版本字段
   是兼容闸不是键）——v2 result 全部作业收据回显 planHash（回显测试已钉）。
2. **planSchemaVersion 闭集**：§4 `schemaVersion: "0.3"` 与 v2 枚举 `["0.3"]`
   一致（互审点 1 关闭；W20 形状变更只改此枚举）。
3. **planRef 形态（互审点 2 关闭，附一项裁决建议）**：§4 有 `planId`（uuidv7）
   ——v2 `planRef` 定为 **job 目录内计划文件引用**（既有 job-directory 纪律：
   请求文件先于 Unity 进程调用写入）。建议：**计划文档由 provider 以文件形态
   写入 job 目录，planHash 随命令下发，Bridge 侧读取后本地校验哈希一致才执行**
   ——计划文档在 AMF 持久域（Unity 进程不可达），文件交换是既有架构；哈希
   Unity 侧本地可验使完整性不依赖 provider 单方诚实（与「计划哈希是完整性
   与幂等锚」的裁决互为支撑）。请核心确认此形态。
4. **jobs[].kind 词汇（互审点 3 关闭）**：§4「词汇闭集在 recipe v0.3 Schema
   枚举，词表外＝契约错误」——v2 `steps[].kind` 保持 **string 引用不复制**
   （与「引用不复制」总原则一致）；上游合法性由计划 Schema 闭集保证，Bridge
   运行时遇到无法分发的 kind＝类型化拒绝。不收窄为枚举。
5. **fingerprint 预检**：§4 `fingerprint.expectedProjectFingerprint`（批准
   时点状态）→ provider 受理预检第③步填入 v2 命令顶层
   `expectedProjectFingerprint` → Bridge 执行时乐观锁双保险（009 表态④
   序列）——三层消费路径闭合，v2 无需改动。

**互审产出：v2 草案一处缺口已修**（范围注记的兑现）：

- 范围注记承诺「dry-run 清单与实跑收据携带解析后来源身份」，§4 `jobs[]`
  也要求「逐作业 resolvedSource……Bridge 照实转抄」——v2 草案原 `steps[]`
  缺该字段。已补：`steps[].resolvedSource`
  `{ sourceKind: original|generated_vpm, artifactSha256, warehouseItemId(可空) }`
  （形状与 §4 `resolvedSource` 一致；**转抄不校验语义**——选择语义归解析）；
  对应向量（dry-run/实跑收据）已更新，6 消费测试全绿（356/0＋clippy 零告警，
  本机）。

**维持待审（非本表拦路）**：互审点 4（rejected 收据语义）已由产线在 009 内联
自答（快照＋前置指纹是「执行了变更」的证据，条件按 status∈{succeeded,failed}
收窄）——请核心随 W20 设计稿确认；互审点 5（restore 乐观锁）形状随 W22 Record
草案（`recoveryPoints[]`），到时对齐。

**边界重申**：jobs[].resolvedSource 的**选择语义**（generated_vpm 何时可被
选中、fallback 落回）归 §5 Local Resolution（核心/数据）；Bridge 侧只照实
转抄进收据（可审计），不判定选择是否正确。

## 表态（数据，2026-09-08）

> 转记说明（集成）：以下为 wt-5 状态批三处表态原文照录（数据声明「提案入 main
> 后转内联」，照录以推进收敛）。

1. **§5 存储面归属：四生产产物不进 BDL，归 AMF 生产持久域**（Recipe/
   Local Resolution/批准计划/Build Record 是生产编排文档，BDL 准入规则＝
   素材获取观察事实，塞入污染边界——§2「四者独立版本化互不内联」的文档边界
   同样支持此裁）。持久方式（SQLite 另一表族 vs 独立文档库）由核心 W20 冻结
   切片定义。交界保持：解析**输入**读 BDL 既有冻结查询面
   （warehouse_entry_cards/entryDetail/effectiveArtifactMode），解析**产物**
   不写 BDL；版本锁在 Recipe 文档 locked 段（不进 BDL）✓。
2. **§7 recipe.save 粒度：整文档提交**。段落级操作会把编辑冲突/合并语义引入
   命令面，M5 无此需求。附：乐观并发（save 携带 baseRevision，不匹配＝类型化
   冲突错误，防覆盖丢失）；save 时结构校验（Schema＋引用完整性，拒绝非法
   文档）；recipeRevision 每次 save 递增（v0.2 既有语义）。读面闭集意见：
   recipe.list/plan.list/record.list 闭集最小起步（text/limit/offset，
   updatedAt 排序），词表外＝契约错误（与 bdl-queries 同纪律），更多过滤随
   需求升版。
3. **W23 交界确认＋形状意向**：解析文档引用缺失证据、证据本体归 W23——
   交界认可。W23 条目模型意向：{evidenceId, kind（missing_asset/
   missing_package/version_mismatch/guard_denied/…闭集）, subject,
   observedAt, detail（诚实描述）, sourceRef（localResolutionId 或检查任务
   correlation）, resolution（null＝未解决|已解决引用）}；引用不复制贯穿
   （解析文档携带 evidenceIds[]，Build Record 证据摘要亦可引用）；存储随
   AMF 生产持久域（同 §5 立场），W23 冻结时定 Schema＋向量＋消费测试。
   **W23 领取条件＝011 收敛（§5 语义定稿），收敛即开工**。
4. §4 批准计划形状无数据域异议（jobs[].resolvedSource 与 effectiveArtifactMode
   衔接正确）；§6 版本锁在 Recipe 文档内、与 BDL 无交界，合规。
5. 门序：同意核心建议（W20 冻结先行于 wire/挂点实现，同为 M5 首批冻结硬
   前置）；我方 bdl-commands v0.3 冻结（010 已裁先行）与 recipe v0.3 冻结的
   资源竞争请集成协调（核心已请，附议）——**已由集成门序仲裁覆盖（双冻结线
   并行，数据 v0.3 先行；见仲裁节）**。

## 表态（桌面，2026-09-08）

三项请求逐条表态；实现随 W24 工作台批（待 W20 冻结，同 M5 窗口），本表态为
形态与闭集承诺，供收敛与验收对照。

### 1. §7 读面消费与开放点（W24 工作台）

- **recipe.save 粒度 = 整文档提交**：编辑状态在桌面本地（草稿），保存 = 整文档
  提交 AMF（AMF 是持久权威，每次保存递增 recipeRevision——审计天然成立）。
  段落级操作（patch 语义）需要操作词表与冲突模型，当前无消费方驱动，不建议
  在 v0.3 引入；
- **读面闭集**：recipe.list / plan.list / record.list 同构 catalog.list 先例——
  分页（limit/offset）＋过滤（text 标题子串；plan/record 另按 recipeId、status
  过滤）；词表外参数 = invalid_params 契约错误；
- **工作台消费形态**：recipe/plan/record 全部走同步读面（get/list）；resolve
  走任务（解析可能较重）——工作台发起后引导任务中心，解析文档经 plan.get 链
  读取（任务权威在任务中心，与 W15/010 惯例一致）。

### 2. §6 版本锁失效呈现（形态归桌面 W24）

- **两层形态，桌面不自行判定失效事实**（环境变化是 provider 的事实，桌面只消费
  失效标记——诚实分工）：
  a. 工作台内联：计划/Recipe 卡上失效徽标 + 「重新解析」引导；失效状态从
     plan.get（status/fingerprint 预检结论）读取，发起执行前即可见，不弹打断式
     对话框（失效是状态不是危险动作）；
  b. 任务面：若失效在执行受理时被预检拒绝（009 表态④第③步），类型化错误经
     任务面 + 通知中心呈现（与 010 生成守卫拒绝同构）。

### 3. §4 批准交互（approve UI 语义与 dry-run 呈现）

- **流**：resolve 任务 Done → 工作台呈现解析摘要（目标、逐素材来源解析结论、
  fallbackUsed 标记、缺失项诚实空位）→「查看计划并批准」→ **要点确认面板**：
  目标 Avatar、作业序列摘要（按 kind 分组计数）、素材来源（original /
  generated_vpm 徽标）、planHash 末位标识 → 确认（plan.approve 同步调用）；
- **dry-run 结果（如有）**：批准面板内折叠区呈现（逐作业来源清单），不另开
  对话框；
- **确认形态**：approve 不是破坏性动作（不删除任何东西），采用**要点确认面板**
  而非延迟按钮——延迟确认（§8.1）保留给删除类；但面板必须承载 §4 的批准语义
  （解析结果＋操作序列＋dry-run 的显式确认），要点缺一不呈现即不可批准；
- **计划要点来自 plan.get 的权威文档（planHash 锚定）**，桌面不本地重构第二份；
  status 生命周期呈现：draft=可批准；approved=可执行（job.execute 入口）/
  可被取代；superseded=灰化+指引新计划；执行事实只在任务中心与 Build Record
  （无 executed 态的诚实分工在 UI 上同样成立）。

（desktop 立场：四产物链与无 executed 态分工与既有诚实纪律一致，无保留意见；
W24 实现待 W20 冻结，同 M5 窗口。）

## 仲裁（集成，2026-09-08）

（门序与验收归属先裁——§8 [→集成] 项；实质设计表态待产线/数据/桌面到齐后随收敛
给出。）

**门序与验收归属裁决（回应 §8 [→集成]）**：

1. **双冻结线并行，各自先行于对应实现**：bdl-commands v0.3（010 裁定，数据主导）
   是 W18/W19 接线的硬前置；本提案的 recipe v0.3／approved-plan v0.3（W20 冻结
   切片）是 W21（Bridge v2 消费计划形状）与 W24（工作台）的硬前置。两条冻结线
   **互不依赖、并行推进**（仓库命令族 vs 生产产物族，无交界），但都在 M5 首批
   窗口内先行于对应实现合并——与 010 收口执行序不冲突：① v0.3 冻结与 W20 冻结
   并行，② W18/W19 wire/挂点实现待 v0.3，③ W21/W24 实现待 W20。
2. **锚点协调（回应核心 [→数据] 资源竞争提请）**：数据 bdl-commands v0.3 冻结
   **先行**（面小、W18/W19 硬前置）；核心 W20 冻结紧随并行（011 收敛即冻，不等
   v0.3）。数据完成 v0.3 冻结后即可领 W23——若彼时 W20 锚点（Recipe 形状）已
   浮现则按锚点领取，否则与核心对齐后再领，两不空转。
3. **验收归属**：**W20 冻结切片（Schema＋正负例向量＋消费测试）交集成验收合并**
   ——契约/协议冻结是门级事件（W8/W14 先例），且消费测试涉多端（provider-host
   ＋桌面 TS 镜像）。同例适用于 M5 首批全部三个冻结批：bdl-commands v0.3（数据
   主导）、recipe v0.3 套件（核心主导）、009 v2 骨架冻结物（产线主导）——均交
   集成验收后合并 main。
4. **范围确认**：本文产物链定界（意图/事实/授权/历史四产物独立版本化、引用不
   复制）与「无 executed 态——执行事实在 Build Record」的诚实分工，与架构纪律
   一致，仲裁无异议；§7 词表草案的开放点（save 粒度、读面闭集）留数据/桌面表态
   收敛，不影响门序裁决效力。
