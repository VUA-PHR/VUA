---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: ecf0adaa
updated: 2026-09-22
---
## 当前焦点
**第 168 批（2026-09-22 05:2x–05:5x，节拍轮工作时段 date 05:22 实测；三笔：追平壳
eb064128＋v0.5 实现批 cb40bf1d＋本状态批恰本文件）＝操作者第 168 批派发兑现＝
dependencies.* v0.5 实现环（030 §5.7 案 A；「Schema＋正负例向量＋至少一端消费测
试」三件齐备＝bdl-queries v0.5 正式冻结）＋追平＋簿记轮**：

- **追平**：slot/wt-5 落后 main 9 领先 0，merge-tree 预检 exit 0 零冲突，--no-ff
  合并落地追平壳 eb064128 纯吸收 main ecf0adaa 世代（第 166/167 批集成验收：wt-3
  029 B 面环 4 桌面消费＝B 面四环闭环＋wt-4 030 冻结批＝BDL v0.2 正式冻结＋wt-5
  030 表态批收编＋操作者向量文件形态裁决登记＝维持冻结 JSON 形态、数据席第三案备
  查）；基线刷新 ecf0adaa。brief ①区指向本树留言恰一条＝wt-4 冻结批定稿知会（向
  量 JSON 形态维持、勘误批路径）——照办：本批例集循 bdl-queries 四版 examples/
  JSON 先例，无形态硬阻力、无勘误批触发，第三案继续备查。
- **v0.5 实现批 cb40bf1d（恰 13 文件：新 12＋改 2 中 REGISTRY/030 线程）**：
  1. **词面闭集**：`schemas/bdl-queries/v0.5/query.schema.json`＋
     `result.schema.json`——operation 六→八成员 additive（＋`dependencies.lookup`
     依赖反查建议面＋`dependencies.listByProduct` 单商品观察线索面）；两方法均只
     读，`confirmed_by_human` 翻 1 写面归产线建库切片、词表零写词；全部枚举骑
     BDL v0.2 冻结闭集（depKind 四值/sourceSpan 五值/extractionMethod 六值）。
  2. **listByProduct 去留裁决（操作者交本席定夺）＝保留**，理由四条随协议本冻结：
     ①线索非结论律需两面对照才成立（只落 lookup 则未确认线索无查询可读）；②消
     费方真实且已排期（030 执行序 2 提取管线切片的人工确认面读侧）；③成本有界
     （单参数骑 catalog.detail pattern、行键与 lookup 证据体同构、每键映射冻结
     列）；④admission 律满足不硬凑。
  3. **匹配规则 v1＋advisory 规则 v1 随双语协议本冻结**（读期版本化规则表，改规
     则须升协议版本）：匹配＝dep_name 大小写不敏感精确（ASCII casefold 范围如实
     声明）、零子串零模糊零等价、包名形态诚实空集（名义↔包名同一性绝不猜测）；
     advisory 双门＝刻意声明版面（explicit_heading/one_line/bullet）＋人工确认消
     解，installSource v1 只发 booth_page/external_page（vpm/unknown 留冻结枚举不
     发出——无 VPM 仓库事实凭空宣称即猜测），confidence strong/weak 两档骑版面
     维；空态诚实＝total:0＋matches:[] 是「无匹配名义」非「无此依赖」，协议明记；
     lookup 刻意缺席 extractedBy/observedAt（admission 律）、路径零出现；tombstone
     商品不过滤 lookup（证据力不随页面死亡消失）而 listByProduct 携 productStatus
     显式呈现；未知 productId 照 catalog.detail 既有缺席语义（应用面 not-found 不
     伪造空答）、tombstone 不拒答（确认工作流必须仍见死页声明——与 catalog.detail
     「tombstone 不作卡片」的有意分流，协议本说明）。
  4. **正负例向量**：`examples/` 四正（lookup/listByProduct 各 request＋result，
     词面引 030 §1 调查原型全合成）＋五负（空 name／词外 depKind 恰钉五值草案成
     员 `unity_or_sdk_version` 拒绝＝BDL v0.2 N1 同一裁决面／词外 `fuzzy` 键＝词
     表零模糊开关／listByProduct 词外过滤键／v0.4 版本重放）。
  5. **消费测试** `crates/bdl-store/tests/dependencies_queries_v05.rs` **8/8 绿**
     （2026-09-22 本树 cargo 实测）：向量文件驱动＋BDL v0.2 schema.sql CHECK 闭集
     逐字机械对表（排序依赖「v0.2 先于 v0.5」兑现且持续钉住、词面漂移即红）＋匹
     配规则 v1/advisory 规则 v1 参考推导骑冻结 001+002 迁移链实测（大小写折叠精
     确匹配／子串不匹配／包名形态诚实空集／total 先于分页／确定性序 productId↑
     后 observation_id↑／确认门与建议门／tombstone 照读／线索面 confirmed:false
     出线含 030 样例 3 错链词面）＋两面对照机械钉（lookup 行无 extractedBy/
     observedAt/resolution、observation 行有它们且无 advisory）＋无路径键扫描。
  6. **双语协议本** `docs/protocols/bdl-queries-v0.5_EN/ZH.md` 0.5 FROZEN＋
     REGISTRY 行＋030 内联线程第 168 批交付回执。
- **契约先行分工（v0.4 先例照办，零越界）**：本批零 bdl-store 代码改动、零 wire
  落地——信封常量 `BDL_QUERIES_SCHEMA_VERSION` 0.4→0.5 与 provider-host 路由臂
  随核心接线批；TS 面归桌面席；store v0.2 落库（迁移注册 user_version=2＋写入/
  读出面）归产线建库环；store 实现面落地后接替测试内参考推导，测试保留为词表锚。
- **门禁读数（如实捕获退出码）**：cargo test --workspace exit 0＝108 套件
  **934/0**（基线 926＋恰本批 8 例；ignored 28 维持——首次管道式跑法丢失 cargo
  退出码即重跑纠正，如实注记）＋cargo clippy --workspace --all-targets exit 0
  **0 警告 0 错误**。
- **红线与诚实边界（全程维持）**：零 BOOTH 访问（向量词面引 030 §1 既有调查原
  型与合成负例，零网络动作）；VUA-7/VUA-8 全程零触碰；零 %APPDATA% 写入；**零
  端到端宣称**——消费测试只证冻结 schema/向量文件自身行为与规则表参考推导（清
  晰标注为消费面参考实现，非 store 行为非 wire），store v0.2 落库、路由、TS 面、
  live 全链归各席位后续切片与 W25；测试绿≠真机绿。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 166 批（05:0x 前，三笔 eb064128 前已收编）＝030 冻结批数据域协同表态（向量文件
形态第三案 SQL 片段例集＋dependencies.* v0.5 候词表方向 lookup/listByProduct 两成
员＋匹配规则律方向），追平至 2bd60a4a。第 158 批＝030 内联技术表态（数据面评估/
出线面两案代价对照/倾向案 A）。第 155 批＝09-20/21 真机数据面只读一致性清点。更
早见 git 历史与 BOARD 前录。

## 本轮交付（ecf0adaa 基线世代）
- **追平壳 eb064128**（--no-ff 吸收 main＝第 166/167 批世代；落后 9、领先 0，
  merge-tree 预检 exit 0，纯吸收，基线刷新）。
- **v0.5 实现批 cb40bf1d**（恰 13 文件：schemas/bdl-queries/v0.5/ 全目录 11 文件
  ＋协议本双语 2 文件＋消费测试 1 文件＋REGISTRY 一行＋030 线程回执一节；见当前
  焦点逐项）。
- **本状态批（恰本文件一笔）**：切片记录＋门禁读数登记。

## 在途/待他角色
- **[等集成] 本拍两笔候随轮验收（--no-ff）**：实现批 cb40bf1d（schemas＋协议本双
  语＋消费测试＋REGISTRY＋030 回执；非纯 collab 面，全量测试已附读数）＋本状态
  批（恰本文件），写明「wt-5 第 168 批：dependencies.* v0.5 实现环＝bdl-queries
  v0.5 正式冻结（Schema＋向量＋消费测试三件齐备；基线 ecf0adaa）」。
- **[候操作者/核心] v0.5 接线环候派**：信封常量 0.4→0.5＋provider-host 路由臂
  （核心座）＋TS 面（桌面座）——契约先行分工已在协议本冻结范围声明。
- **[候操作者/产线] store v0.2 落库实现环**（产线座清单在 wt-4 状态批）：落库后
  本席消费测试的参考推导由 store 实现面接替，本测试保留为词表锚。
- [等操作者/用户] W25 真机走查推进（#43 复验候用户回访 O-2）；窗口内数据候办两
  项维持：批 D 剩余真机义务配合面、requestRun 对象选择面事实源输入。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝本拍两笔（--no-ff）：实现批 cb40bf1d（恰 13 文件，非纯 collab 面，
全量测试读数随批：cargo test --workspace exit 0＝108 套件 934/0＝基线 926＋恰
8、clippy --workspace --all-targets exit 0 零警告）＋本状态批恰本文件，写明
「wt-5 第 168 批：dependencies.* v0.5 实现环＝bdl-queries v0.5 正式冻结（基线
ecf0adaa）」。**请重点 diff 复核：①词面全部骑 BDL v0.2 冻结闭集且消费测试对
schema.sql 逐字机械对表；②只读边界（词表零写词、confirmed_by_human 写面未触碰）；
③v0.4 六方法词面零变化（additive 仅 schemaVersion 0.4→0.5＋两新成员）；④listByProduct
保留裁决理由在协议本专节；⑤匹配规则 v1/advisory 规则 v1 的诚实性（零等价猜测、
vpm 不发出、未确认消解不出建议面）；⑥collab 面重点复核 030 线程回执与协议本/
REGISTRY 一致。

## 待命声明（第 6 步，如实）
本轮（2026-09-22 05:2x–05:5x，节拍轮工作时段 date 05:22 实测；三笔：追平壳
eb064128＋实现批 cb40bf1d＋本状态批）：①date 05:22 实测正常时段，pnpm collab:brief
①区判读＝指向本树留言恰一条（wt-4 冻结批定稿知会，照办消化），失鲜工作树无；
②轮首追平＝落后 9 预检 exit 0，--no-ff 合并 eb064128 纯吸收 main ecf0adaa，基线
刷新；③操作者第 168 批任务兑现＝读 030 提案全文（含第 166 批本席表态节与裁决登
记节）＋BDL v0.2 冻结三件（schema.sql/002/协议本/17 向量）＋bdl-queries v0.1–v0.4
全部 Schema/例集/协议本/消费测试先例＋catalog.detail 缺席语义实读，随后实现：
query/result 双 Schema＋词表闭集＋listByProduct 保留裁决（四条理由随协议本冻结）
＋匹配规则 v1/advisory 规则 v1＋四正五负例集＋消费测试 8 例（8/8 绿）＋双语协议
本 0.5＋REGISTRY 行＋030 线程回执；④门禁＝bdl-store 全 crate 绿＋clippy 全
targets 零警告→cargo test --workspace 重跑如实捕获 exit 0（934/0，基线 926＋恰
8）＋clippy --workspace --all-targets exit 0 零警告；首次后台管道跑法 EXIT 读到
的是 grep 而非 cargo——发现即作废重跑，如实注记；⑤机械校验＝11 个新 JSON 文件
node 逐一语法校验通过；⑥环境事实＝零 BOOTH 访问、零网络动作、零 %APPDATA% 写
入、VUA-7/VUA-8 全程零触碰；⑦诚实边界维持：零端到端宣称——全部证据系冻结
schema/向量文件行为＋规则表参考推导（测试内参考实现，已如实标注非 store 行为非
wire），store 落库/路由/TS 面/live 全链归各席后续切片与 W25，测试绿≠真机绿。在
手无半途切片、除本状态批外无未提交改动。完成后推送并退出待命，候集成验收本拍两
笔、接线环候派、下轮 brief 或新指派。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍两笔（--no-ff），写明「wt-5 第 168 批：
  dependencies.* v0.5 实现环＝bdl-queries v0.5 正式冻结（Schema＋向量＋消费测试
  三件齐备；基线 ecf0adaa）」**——实现批 cb40bf1d 恰 13 文件（实现批含 crates/
  bdl-store 新测试文件＝非纯 collab 面，全量测试已跑并随批附读数：cargo test
  --workspace exit 0＝108 套件 934/0、clippy --workspace --all-targets exit 0 零
  警告）＋本状态批。重点复核面见「下次合并意图」①–⑥。
- **[→核心/wt-2]（接线候派知会）**：v0.5 词面已冻结——信封常量
  `BDL_QUERIES_SCHEMA_VERSION` 0.4→0.5 与 provider-host `dependencies.lookup`/
  `dependencies.listByProduct` 路由臂候你席接线批领取（协议本冻结范围已声明分工；
  未知 productId 缺席语义已对齐 catalog.detail 判例）。
- **[→桌面/wt-3]（知会）**：v0.5 TS 面归你席接线批（本席零代笔），词表
  `schemas/bdl-queries/v0.5/` 机读可见。
- **[→产线/wt-4]（知会）**：v0.5 词面骑你席 BDL v0.2 冻结闭集已落并机械钉死
  （schema.sql CHECK 逐字对表测试在库）；store v0.2 落库环落地后，本席消费测试
  内的规则表参考推导由 store 实现面接替、测试保留为词表锚——清单见你席状态批，
  候派。
- （回执不回执：wt-4 ①区冻结知会已照办消化即本拍例集形态；历史留言已消化归档，
  在途事项以 BOARD 与本状态文件当前焦点为准。）
