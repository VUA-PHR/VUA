---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 9d7e6c17
updated: 2026-09-22
---
## 当前焦点
**第 164 批（2026-09-22 03:3x–04:5x，节拍轮正常工作时段 date 实测 03:32；两笔：
追平壳〔吸收 main 9d7e6c17〕＋本批＝030 定座后冻结前置 schema 设计环〔v0.2 草案面
＋双语协议本草稿＋草案批消费测试〕＋030 内联回复＋REGISTRY 草案行＋恰本状态批）**：

- **追平兑现（开工前置）**：轮首实测 main...slot/wt-4＝落后 66／领先 0（main 推进至
  **9d7e6c17**＝含 030 定座集成落账〔第 163 批内联节〕、029 收编、R1–R6 收编、
  recipe-export/release-handoff v0.2 冻结面等）。新式 merge-tree 预检 exit 0
  （tree 3bfcb4c6）零冲突，--no-ff 合并 main 9d7e6c17＝追平壳 **7f1ecde7**，合并树
  与预检树逐字节全等（`git diff HEAD main` 空＝零自有内容纯吸收）。基线世代刷新
  **9d7e6c17**。
- **brief ①区消化**：零指向本树的阻塞；wt-8 留言系 R1–R3 分工知会指向其树自身
  （其合并已验收 06ec6390，本席零动作）；失鲜工作树系各树内事务非本树阻塞。
  **用户指令红线兑现**：本轮零触碰 VUA-7/VUA-8 两工作树及其分支；零 BOOTH 访问
  （本批只用 030 §1 既有调查词面作正例原型）。
- **任务兑现（操作者第 164 批派单：030 建库环启动——冻结前置 schema 设计环）**：
  定座已落（030 §5.1＝产线座建库＋§5.7＝案 A bdl-queries dependencies.*），
  本批做**草案候冻结**三件（照「Schema＋正负例向量＋至少一端消费测试」纪律备料；
  **不落库、不改 bdl-store 代码**——store 仍运行 format v0.1，实现候冻结验收后环）：
  1. **机器可读面 `schemas/bdl/v0.2/`**：`schema.sql`（全量可读权威草案，可独立
     执行）＋`002_dependency_observations.sql`（v0.1→v0.2 增量迁移草案，STRICT＋
     bdl_meta.format_version＋user_version 纪律，user_version=2 由宿主迁移器设置
     照 v0.1 先例）。双变更：①compatibility_observations.source_span 闭集扩维
     （＋title/description_link）——**SQLite CHECK 重建＝持久格式下一版迁移义务**，
     002 逐行保真、迁移中任何数据丢失即失败；②**dependency_observations 新表**
     （观察范式同源，一条声明一行）。
  2. **对表要点逐条消化（照数据席 030 内联表态）**：raw_quote NOT NULL 逐字律
     照 compat 先例（001_initial.sql:69）；置信度**两维两列**＝extraction_method
     （版面形态闭集六值 explicit_heading/bullet/one_line/prose/title/link）×
     extracted_by（提取者身份开放词面），勿混装；**resolution_evidence 形状冻结批
     必填项已填**＝JSON 数组元素闭集 {linkText, linkUrl, span, note}＋库层硬律
     「resolved 非空⇒证据非空」（CHECK）＋confirmed_by_human 默认 0＝线索非结论
     （读期派生律，规则表本体归数据座消费面）；**dep_kind 粒度待定项本批给出草案
     提案未代决**＝收窄依赖物类型单选四值（无 unity_or_sdk_version，版本约束一律
     version_hint 承载，引擎/SDK 钉行落 other＋version_hint），备选保留五值在协议
     本草稿开放标注候冻结批裁决，负例向量 unity_or_sdk_version 恰钉当前草案方向。
  3. **双语协议本草稿** `docs/protocols/bdl-dependency-observations-v0.2_EN.md`＋
     `_ZH.md`（状态：草案候冻结；范围声明——bdl-queries dependencies.* 查询族词表
     归数据座下游，本稿零代笔；U18 检测段/提取管线不在范围）＋**正负例向量方向**
     九正八负（P1–P9 词面引 030 §1 调查原型、N1–N8 合成负例；向量文件形态候冻结
     批与数据席收敛）＋REGISTRY 两草案行（协议本＋schemas/bdl/v0.2；v0.1 目录冻结
     面零触碰）。
  4. **草案批消费测试** `crates/bdl-store/tests/dependency_observations_schema_v02.rs`
     （新文件，**零 store 代码改动**）：5 例绿——迁移保真（v0.1 行逐字存活＋
     format_version 0.2）／compat 扩集新两值接受＋旧三值不回摆＋词外拒／dep 表
     正例（钉行/单行/散文/列点/标题/other 引擎钉/已确认消解/两维分立/缺省 0）／
     负例（dep_kind 词外含 unity_or_sdk_version、span 词外、method 词外、NOT NULL
     四律、confirmed=2、消解无证据、悬挂 FK×2）／权威 schema.sql 与 001+002 迁移链
     形状全等（pk 列 notnull 位 STRICT 语义归一化，注释说明）。**bdl-store 全
     crate 61 例绿＋clippy 全 targets 零警告**（2026-09-22 本树 cargo 实测）。
- **红线与诚实边界（全程维持）**：**零端到端宣称**——草案消费测试只证 schema 文件
  自身行为，不证 store v0.2 行为与任何提取/消费能力；store v0.2 落库验收属冻结切片；
  零 BOOTH 访问、付费资产零接触、VUA-7/VUA-8 零触碰；全部测试素材合成/引公开页
  词面原型。
- **机械校验**：本批＝追平壳（零自有内容纯吸收，树全等实证）＋实质批（schemas/
  bdl/v0.2 两文件＋协议本双语＋测试＋030 回复＋REGISTRY＋状态批）；**collab 外
  实质变更已跑测试**：草案消费测试 5/5＋bdl-store 全测 61 例＋clippy 零警告；
  零 Unity Editor 触发、零网络动作。

## 前情（第 154 批＝追平＋#46 立项起草 proposal 030〔调查＋库模式方向＋供数接口
设想〕，2026-09-21 23:0x–23:4x；更早 148/147/146/145/143/142/141/139/138 批见
BOARD 前录与 git 历史）

## 本轮交付（9d7e6c17 基线世代）
- **追平壳 7f1ecde7**（--no-ff 吸收 main 9d7e6c17，预检 exit 0 tree 3bfcb4c6、
  合并树逐字节全等，基线刷新）。
- **本批（schema 设计环批）**：schemas/bdl/v0.2 草案面（schema.sql＋002 迁移）＋
  双语协议本草稿（草案候冻结）＋草案批消费测试（5 例）＋030 内联产线回复（设计环
  产出登记＋dep_kind 草案提案候裁决）＋REGISTRY 草案两行＋本状态批。零落库、零
  bdl-store 代码改动、零 bdl-queries 词表改动（数据座面零代笔）。

## 在途/待他角色
- **[等集成] 本批候随轮验收（--no-ff）**，写明「wt-4 第 164 批（030 冻结前置
  schema 设计环：v0.2 草案面＋双语协议本草稿＋消费测试；基点 9d7e6c17）」。
- **[等冻结切片] v0.2 冻结批**：dep_kind 粒度裁决（收窄四值 vs 保留五值）＋向量
  文件形态与数据席收敛＋store v0.2 落库（迁移注册升版＋写入/读出面）＋bdl-queries
  dependencies.* 词表（数据座自领）。
- **[等数据] 消费面领取确认**：bdl-queries dependencies.* 查询族由其席自行办理
  （030 §5.7 案 A）；本批 resolution 线索非结论读期派生律的规则表本体归该面。
- **[等操作者/用户] 沿革在途**：W25 正式执行（A3 段 Unity 侧核证义务在肩）；缺口
  (b) 交接准入终态门槛候裁决；配方↔素材链接达归属候指派（均见第 148 批登记与
  BOARD）。

## 阻塞
- 无阻塞。冻结批候本批验收后开窗；零猜测项。

## 下次合并意图
**候验收对象＝本批两笔（追平壳 7f1ecde7 零自有内容纯吸收 main 9d7e6c17，预检
exit 0 tree 3bfcb4c6 零冲突、合并树逐字节全等；＋本批提交＝schemas/bdl/v0.2 草案
面＋双语协议本草稿＋消费测试＋030 回复＋REGISTRY＋本状态批，测试全绿才提交
〔5/5＋61 例＋clippy 绿〕），请集成随轮验收（--no-ff），写明「wt-4 第 164 批
（030 冻结前置 schema 设计环；基点 9d7e6c17）」。**

## 待命声明（第 6 步，如实）
本轮（2026-09-22 03:3x–04:5x，正常工作时段；两笔：追平壳＋schema 设计环批）：
①pnpm collab:brief ①区判读＝零本树阻塞，wt-8 留言系其树分工知会；②轮首追平壳
7f1ecde7 吸收 main 9d7e6c17（落后 66→0，预检 exit 0 tree 3bfcb4c6、合并树与预检树
逐字节全等、diff HEAD main 空＝零自有内容）；③操作者第 164 批派单兑现＝030 定座后
冻结前置 schema 设计环（v0.2 草案面双变更〔source_span CHECK 重建迁移义务＋
dependency_observations 新表〕＋对表五要点逐条消化〔两维两列/证据硬律/dep_kind
草案提案候裁决〕＋双语协议本草稿＋九正八负向量方向＋草案批消费测试 5 例绿＋
bdl-store 全测 61 例绿＋clippy 绿）；④诚实边界维持＝零端到端宣称（草案测试只证
schema 文件不证 store 行为）、零落库零 store 代码改动、数据座消费面零代笔、零
BOOTH 访问、VUA-7/VUA-8 零触碰；⑤机械校验＝实质变更面测试全绿后才提交；在手无
半途切片、除本批提交外无未提交改动。退出待命，候集成验收本批、冻结切片开窗、
W25 窗口推进。

## 留言
- [→集成] 验收请求：**候验收对象＝本批两笔（追平壳 7f1ecde7 纯吸收 main 9d7e6c17
  ＋schema 设计环批＝schemas/bdl/v0.2 草案面＋双语协议本草稿＋消费测试＋030 回复
  ＋REGISTRY＋本文件，测试全绿后提交），请随轮验收（--no-ff），写明「wt-4 第 164
  批（030 冻结前置 schema 设计环；基点 9d7e6c17）」。**随请 BOARD #46 行更新
  （集成维护）：候建库实现环→冻结前置设计环已落（v0.2 草案候冻结，候冻结切片）。
  零端到端宣称维持。
- [→数据]（消费面领取邀约确认，030 内联线程）bdl-queries dependencies.* 查询族
  词表（§5.7 案 A）由贵席自行领取，本席零代笔；v0.2 草案面已按贵席表态逐条消化
  （两维两列、raw_quote 律、source_span 迁移义务、resolution_evidence 形状）；
  唯 dep_kind 粒度本批给出收窄四值草案提案（备选保留五值开放标注），候冻结批
  裁决——请贵席在 030 内联或冻结批表态。向量文件形态（JSON 例集 vs 测试内嵌）
  候与贵席收敛。
- [→产线下窗] 冻结切片清单：dep_kind 裁决消化→向量文件落位→store v0.2 落库
  （迁移注册升版 user_version=2＋写入/读出面）→bdl-queries dependencies.*（数据
  座合流）→提取管线切片（保守提取＋人工确认面）。U18 终裁前零端到端宣称。
- （回执不回执：wt-8 R1–R3 分工知会系其树自身工作、已按用户指令零触碰其工作树与
  分支；历史留言已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
