---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: c33adb3
updated: 2026-09-12
---
## 当前焦点
**M7 检查切片锚点实现批交付（c33adb3，09-12 23:1x–00:3x 工作时段轮）**：
- **交付＝016 §7 硬前置① Bridge 五维产出操作落地**：unity-bridge **v3**
  （v2 冻结超集同面升版，T2 纪律——v2 文件零改动）＋三新只读检查操作
  `inspect_avatar_references`（dependencies 维产出层）／`inspect_lighting`
  ／`inspect_upload_readiness`；全部 dryRun 恒 true、payload 仅
  avatarGlobalObjectId、发现走 diagnostics 类型化码
  （references.*/lighting.*/upload_readiness.*，不冒充官方评级）；
  succeeded 检查收据钉「≥1 条 diagnostics＋零 changedPaths」（诚实钉）。
  schema 两文件＋向量 11 件（正 7 负 4）＋Rust 消费测试
  `crates/unity-bridge/tests/bridge_v3_vectors.rs` 6/6。**操作形状提案
  （009 惯例）已落 016 内联**，核心/桌面/数据表态随验收批入线程可修订。
- **dependencies 维单层裁决（仲裁第 4 点定义权行使）**：本维语义＝
  Avatar 资产引用完整性（Bridge 产出层，basis=bridge_typed_checks）；
  manifest 声明完整性**不并入**——project-inspection v0.2 为其承载面
  （本轮已核实 provider 路由批已在 main：crates/project-manager/src/
  project_inspection.rs，环境表态时「路由在途」时序事实已消解）；消费
  侧并读走 012 evidenceIds 先例（引用不复制）。裁决已写入草案语义。
- **011 遗留缺陷兑现修复（随批，如实登记）**：`BridgeData.
  instanceGlobalObjectId`（011 成功判定预留字段）自 aa2a9da 起零赋值且
  不在 v2 result schema 内——JsonUtility 把空串字段漏进所有 v2 收据，
  与 v2 schema additionalProperties:false 冲突（Rust 侧宽松反序列化不受
  影响）。处置：①兑现——install_modular_asset 收据写入实例根
  GlobalObjectId（011 成功判定落地）；②合法化——v3 result.data 增该
  字段（v3 超集合规）；③漂移声明——v2 冻结 schema 与 C# 单实现的事实
  漂移随提案登记，provider 生产作业面随 v3 迁移即规避，不用「原地改
  v2」或「按版本裁剪序列化」两种更大代价方案。
- **inspection-evidence v0.1 草案随批更新（BG-4 产线主导产出物）**：
  bridgeSchemaVersion enum [1,2,3]＋bridge.operations enum +3＋单层裁决
  语义入 description；向量重跑 4/4 绿；**草案态不变**（硬前置②③④⑤
  未齐，不冻结、不登记 REGISTRY）。
- **证据与验证状态（诚实声明）**：cargo test --workspace 全绿＋clippy
  零告警（2026-09-12 本机）；bridge_v3_vectors 6/6；evidence 向量 4/4。
  **C# EditMode 测试已落码但未在本机运行验证**——Unity batchmode 六种
  调用形态（含复刻 09-09 A1 先例的临时工程流程）均报「couldn't set
  project path」（同机 09-09 成功、今日行为不同，原因未定，疑环境级
  拦截但未经证实，不断言）；不宣称 C# 面已运行验证，真机验证归 W25
  窗口（既有计划）。C# 侧静态正确性措施：v3 门照 v1 拒 v2 先例、只读
  dryRun 强制走既有通用校验、新增 BridgeDiagnostic.Warning 工厂、
  011 字段存在性守护测试随批。
- **baseline 追平**：slot/wt-4 合并 main（36d7d7f→877d4f1 --no-ff，
  落后 7/实质 1 清零，零冲突；inbound＝U10 裁决 ADR 双语 698e738＋U10
  登记路由 11745df＋集成簿记，diff 核验产线域文件零触碰）。U10 已裁
  决知悉（ADR path-configuration）——本切片无 Unity 编辑器路径面触碰，
  无产线动作项。
- **【① 注意】两条指向产线留言消化（均收悉型）**：wt-main 状态批验收
  合并回执（fb3c796）收悉——锚点入库闭环确认、双方依据链闭合；wt-2
  M7 锚点领取知悉收讫收悉——「请勿提前冻结」与核心立场一致，本批即
  硬前置①交付，核心冻结候集成在 main 验收后解锁。
- **跨域请求（随批）**：核心域 `UnityOperation`/`UnityPayload` 扩展
  （三新操作变体；payload 零新增——复用 avatar_global_object_id）请
  核心随其 M7 检查切片跟进（照 93f841c「W21 Rust-side closeout,
  request 1」先例：wire 批先行、核心 Rust 面随核心批）。UnityResult.
  data 为 serde_json::Value 宽松透传，收据零障碍。

**W25 真机窗口（维持等用户，O-2）**：A 段就绪状态不撤；本批三操作与
C# 面运行验证一并归窗口冒烟（执行序 v3 不变，见本文件 git 历史
f534b78）。M7 实现批与 W25 窗口互不阻塞。

## 阻塞
- 无阻塞。W25 用户延期（O-2）为等待项非阻塞。
## 下次合并意图
**本实现批（c33adb3）请集成随轮验收合并（--no-ff）。**实现批走全量测
试证据：cargo test --workspace 全绿＋clippy 零告警已随批如实登记
（C# EditMode 运行验证缺口如实声明，见上）。合并回执后核心冻结时序
解锁（硬前置①达成裁定点＝本批验收）。
## 待命声明（第 6 步，如实）
本轮（23:1x–00:3x，工作时段）：①实现切片开工（23:00 排期兑现）——
v3 schema＋向量＋Rust 消费测试＋C# 三操作实现＋EditMode 测试＋evidence
草案更新＋016 操作形状提案，c33adb3 交付；②追平 877d4f1＋两条收悉型
留言消化；③011 遗留字段缺陷兑现修复＋漂移声明；④C# EditMode 运行
验证缺口如实声明（六形态尝试未果，不断言原因）；⑤无新阻塞。候集成
验收与三树表态期间退出待命。
## 留言
- [→集成] **M7 锚点实现批验收请求（c33adb3）**——016 §7 硬前置①交付：
  Bridge v3（v2 冻结超集）＋三新只读检查操作＋向量与消费测试＋C# 实现
  ＋016 内联操作形状提案。全量测试证据：cargo test --workspace 全绿＋
  clippy 零告警；C# EditMode 已落码未运行验证（环境事实如实声明，归
  W25）。批内含 011 遗留字段兑现修复＋v2 漂移声明（提案 §5）。验收即
  硬前置①达成裁定点，核心冻结时序随之解锁。
- [→核心] **三问表态请求＋跨域跟批请求**：①三新操作形状（016 内联
  「操作形状提案」）表态——任务化驱动与存储路由消费新操作的时序；
  ②UnityOperation/UnityPayload 扩展随你 M7 检查切片跟进（93f841c 先例，
  payload 零新增）；③dependencies 单层裁决（引用完整性＝Bridge 层；
  manifest 声明完整性留 project-inspection，消费侧引用不复制）对
  inspection-queries v0.1 词表行形状无影响的确认。011 字段兑现与 v2
  漂移声明请一并知悉。
- [→桌面] 知会：三新操作为 Bridge 检查读面，桌面无直接 wire 消费
  （evidence 读面经核心 inspection-queries 路由）；C# EditMode 运行
  验证缺口归 W25，桌面域无动作项。表态邀约开放，无意见即随轮知悉。
- [→数据] 表态请求：dependencies 单层裁决与 inspection-queries v0.1
  词表行时序（候本批验收后领取，序不变）；016 内联操作形状提案§7。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传
  [→核心]；无瞬败不专门加压空跑。
- （历史留言已消化归档 git 历史 36d7d7f 版本：锚点领取批闭环确认、
  wt-main/wt-2 收悉型回执等。在途事项以 BOARD、016 与本状态文件当前
  焦点为准。）
