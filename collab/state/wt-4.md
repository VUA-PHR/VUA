---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 2bd60a4a
updated: 2026-09-22
---
## 当前焦点
**第 166 批（2026-09-22 04:2x–05:0x，节拍轮正常工作时段 date 实测 04:25；两笔：
追平壳〔吸收 main 2bd60a4a〕＋本批＝030 冻结批〔dep_kind 四值定稿＋向量文件形态
收敛落位＋schema.sql/002 正式化＋双语协议本转正＋向量消费测试定稿〕＋030 内联
冻结登记＋REGISTRY 转正＋恰本状态批；零 bdl-store 运行时实现）**：

- **追平兑现（开工前置）**：轮首实测 main...slot/wt-4＝落后 9／领先 0（main 推进至
  **2bd60a4a**＝集成第 164 批三栈验收入库簿记，本树上批 v0.2 草案 bb4de40d 已在
  main）。merge-tree 预检 exit 0（tree 5d1da956）零冲突，--no-ff 合并 main
  2bd60a4a＝追平壳（合并树与预检树逐字节全等，`git diff HEAD main` 空＝零自有
  内容纯吸收）。基线世代刷新 **2bd60a4a**。
- **brief ①区消化**：零指向本树的阻塞；wt-7/wt-8 两条留言均系 R1–R3 分工知会、
  指向其树自身工作（R1–R3 已在 main，本席零动作）。**用户指令红线兑现**：本轮零
  触碰 VUA-7/VUA-8 两工作树及其分支；零 BOOTH 访问（只用 030 §1 既有调查词面作
  向量原型，零网络动作）。
- **任务兑现（操作者第 166 批派单：030 冻结批；四件齐落，照「Schema＋正负例向量
  ＋至少一端消费测试」三件纪律收口）**：
  1. **dep_kind 四值定稿**：`('shader','tool_package','avatar_base','other')`
     单选、不设 `unity_or_sdk_version`，一切版本约束由 `version_hint` 承载，
     引擎/SDK 钉行落 `other`＋`version_hint`（收窄方向经操作者预授权，本批
     定稿）。**信息不丢失论证随裁决冻结于双语协议本**：五值集把依赖物类型与
     约束类型两正交维度混进单选闭集（样例 1 单选下本就只能选 shader、版本照样
     走 version_hint）；四值下类型/约束/证据各有其列，可查询信息零丢失；「有
     版本约束」读期由 `version_hint IS NOT NULL` 派生（availabilityRaw→
     availabilityStatus 先例），不作存储事实；收窄保住闭集单粒度。
  2. **向量文件形态收敛（030 内联 @数据席）**：落位定稿 `schemas/bdl/v0.2/
     vectors/`＝一向量一 JSON 文件、九正（P1–P9）八负（N1–N8）恰 17 文件；
     命名 `<face>.<valid|invalid>.<id>.<slug>.json`；字段 vector/name/basis/
     expect/reject_law/cases[{table,values}]。形态循本席 amf-production v0.2
     `vectors/` 先例（同纪律同所有权席；持久表行级正负例非 wire 请求/响应对，
     且闭集词面对数据座下游机读可见、dependencies.* 可直读目录取词面）。
     数据席异议若后至走勘误批，绝不就地改写冻结词面、闭集本体不因形态勘误而
     变。N1 恰钉 `unity_or_sdk_version` 拒绝＝冻结裁决拒绝面。
  3. **schema.sql 权威面＋002 迁移正式化**：两文件头部草案标注→冻结状态行；
     **CHECK 词面零变化**（草案四值即定稿方向，冻结只转状态不改行为面）；
     schema.sql dep_kind 注释块扩入信息不丢失论证；v0.1 目录冻结面零触碰。
  4. **双语协议本转正＋REGISTRY 转正**：`bdl-dependency-observations-v0.2_
     EN/ZH.md` 0.2（草案）→0.2 FROZEN（裁决登记＋向量文件表＋消费测试实况＋
     未决项收窄为公开面缺口/U18 联动/消费面领取/store 落库四条）；REGISTRY 两
     行（协议本＋schemas/bdl/v0.2）草案候冻结→已冻结。
  5. **向量消费测试定稿** `crates/bdl-store/tests/dependency_observations_
     schema_v02.rs`（**零 store 代码改动**）：改写为**向量文件消费**——fs 读
     vectors/ 17 文件驱动全部正负例（方向测试：恰 9 accept＋8 reject＋文件名
     与冻结向量名一致约定＋N1 含 unity_or_sdk_version；驱动测试：accept 全插
     ／reject 全 ConstraintViolation＋confirmed 缺省 0＋P4 证据数组冻结元素键）
     ＋迁移保真＋权威/迁移链形状全等，**4 例绿**；bdl-store 全 crate **60 例绿
     ＋clippy 全 targets 零警告**（2026-09-22 本树 cargo 实测）。
- **红线与诚实边界（全程维持）**：**零端到端宣称**——消费测试只证冻结 schema
  与向量文件自身行为，不证 store v0.2 行为与任何提取/消费能力；store v0.2 落库
  属下一切片；零 BOOTH 访问、付费资产零接触、VUA-7/VUA-8 零触碰；全部测试素材
  合成/引公开页词面原型。
- **机械校验**：本批＝追平壳（零自有内容纯吸收，树全等实证）＋实质批（vectors/
  17 新文件＋schema.sql/002 状态行＋协议本双语＋测试＋030 回复＋REGISTRY＋状态
  批）；**collab 外实质变更已跑测试**：消费测试 4/4＋bdl-store 全测 60 例＋
  clippy 零警告；零 Unity Editor 触发、零网络动作。

## 前情（第 164 批＝030 定座后冻结前置 schema 设计环〔v0.2 草案面＋双语协议本草稿
＋草案批消费测试 5 例〕，2026-09-22 03:3x–04:5x，已随集成第 164 批验收入库
bb4de40d；更早 154/148/147/146/145/143/142/141/139/138 批见 BOARD 前录与 git
历史）

## 本轮交付（2bd60a4a 基线世代）
- **追平壳**（--no-ff 吸收 main 2bd60a4a，预检 exit 0 tree 5d1da956、合并树
  逐字节全等，基线刷新）。
- **本批（030 冻结批）**：schemas/bdl/v0.2/vectors/ 17 个向量文件＋schema.sql/
  002 正式化（状态行）＋双语协议本转正＋REGISTRY 两行转正＋消费测试定稿（向量
  文件消费，4 例）＋030 内联冻结登记（@数据席 向量形态收敛）＋本状态批。零落库、
  零 bdl-store 代码改动、零 bdl-queries 词表改动（数据座面零代笔）。

## 在途/待他角色
- **[等集成] 本批候随轮验收（--no-ff）**，写明「wt-4 第 166 批（030 冻结批：
  dep_kind 四值定稿＋向量 17 文件落位＋schema/002/协议本/REGISTRY 转正＋向量
  消费测试定稿；基点 2bd60a4a）」。
- **[等数据] 向量形态知会回执与消费面领取**：030 内联 @数据席（形态定稿＋勘误
  批路径）；bdl-queries dependencies.* 查询族由其席自行办理（030 §5.7 案 A），
  resolution 线索非结论读期派生律的规则表本体归该面。
- **[候下批] store v0.2 落库实现环**：迁移注册升版（user_version=2 照 v0.1 宿主
  先例）＋写入/读出面＋UnsupportedFormat 纪律接线；提取管线切片（保守提取＋
  人工确认面）再下窗候派。
- **[等操作者/用户] 沿革在途**：W25 正式执行（A3 段 Unity 侧核证义务在肩）；缺口
  (b) 交接准入终态门槛候裁决；配方↔素材链接达归属候指派（均见第 148 批登记与
  BOARD）。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
**候验收对象＝本批两笔（追平壳零自有内容纯吸收 main 2bd60a4a，预检 exit 0
tree 5d1da956 零冲突、合并树逐字节全等；＋本批提交＝vectors/ 17 文件＋schema/
002/协议本/REGISTRY 转正＋消费测试定稿＋030 内联冻结登记＋本状态批，测试全绿
才提交〔4/4＋60 例＋clippy 绿〕），请集成随轮验收（--no-ff），写明「wt-4 第
166 批（030 冻结批；基点 2bd60a4a）」。**

## 待命声明（第 6 步，如实）
本轮（2026-09-22 04:2x–05:0x，正常工作时段；两笔：追平壳＋030 冻结批）：
①pnpm collab:brief ①区判读＝零本树阻塞，wt-7/wt-8 留言系其树分工知会；②轮首
追平壳吸收 main 2bd60a4a（落后 9→0，预检 exit 0 tree 5d1da956、合并树与预检树
逐字节全等、diff HEAD main 空＝零自有内容）；③操作者第 166 批派单兑现＝030 冻
结批四件齐落（dep_kind 四值定稿＋信息不丢失论证落协议本＋向量文件形态收敛落位
vectors/ 17 文件＋schema.sql/002 正式化＋双语协议本转正＋REGISTRY 转正＋向量
消费测试定稿 4 例绿＋bdl-store 全测 60 例绿＋clippy 绿）；④诚实边界维持＝零端
到端宣称（测试只证 schema/向量文件不证 store 行为）、零落库零 store 代码改动、
数据座消费面零代笔、零 BOOTH 访问、VUA-7/VUA-8 零触碰；⑤机械校验＝实质变更面
测试全绿后才提交；在手无半途切片、除本批提交外无未提交改动。退出待命，候集成
验收本批、store 落库实现环开窗、W25 窗口推进。

## 留言
- [→集成] 验收请求：**候验收对象＝本批两笔（追平壳纯吸收 main 2bd60a4a＋030
  冻结批＝vectors/ 17 文件＋schema.sql/002 正式化＋双语协议本转正＋REGISTRY 两
  行转正＋消费测试定稿＋030 内联冻结登记＋本文件，测试全绿后提交），请随轮验收
  （--no-ff），写明「wt-4 第 166 批（030 冻结批；基点 2bd60a4a）」。**随请
  BOARD #46 行更新（集成维护）：030 冻结批已落＝BDL 持久格式 v0.2 正式冻结
  （dep_kind 四值定稿＋向量落位＋三件齐备），候 store v0.2 落库实现环。零端到
  端宣称维持。
- [→数据]（030 内联线程 @数据席，向量形态收敛登记）v0.2 冻结批已定稿：向量
  落位 `schemas/bdl/v0.2/vectors/`（九正八负 17 文件、命名与字段见协议本向量
  节），形态循 amf-production v0.2 vectors/ 先例、由本席按 030 §5.1 所有权
  定稿；贵席 dependencies.* 消费面可直接机读该目录取闭集词面；**贵席若在冻结
  后有形态异议，走勘误批办理（版本化勘误），闭集本体不因形态勘误而变**。
  dep_kind 四值定稿（unity_or_sdk_version 不设专值、版本约束归 version_hint）
  已随协议本冻结，负例 N1 恰钉该裁决；v0.2 草案面按贵席表态逐条消化不变。
- [→产线下窗] store v0.2 落库实现环清单：迁移注册升版（v0.1→v0.2，
  user_version=2 宿主先例）→写入/读出面＋UnsupportedFormat 纪律接线→提取
  管线切片（保守提取＋人工确认面）候派；bdl-queries dependencies.*（数据座
  合流）。U18 终裁前零端到端宣称。
- （回执不回执：wt-7/wt-8 R1–R3 分工知会系其树自身工作、已按用户指令零触碰其
  工作树与分支；历史留言已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
