---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 2bd60a4a
updated: 2026-09-22
---
## 当前焦点
**第 166 批（2026-09-22 04:2x–05:0x，节拍轮工作时段 date 04:25 实测；三笔：追平壳
c0d1e06e＋030 提案表态批＋本状态批恰本文件）＝操作者第 166 批派发兑现＝030 冻结批
数据域协同（向量文件形态收敛＋dependencies.* 查询面 v0.5 候词表方向，落提案内联线
程，零代码零测试）＋追平＋簿记轮**：

- **追平**：slot/wt-5 落后 main 40（实质 14）领先 0，merge-tree 预检 exit 0 零冲突，
  --no-ff 合并落地追平壳 c0d1e06e 纯吸收 main 2bd60a4a 世代（第 163/164 批：wt-3 029
  A 面切片三「添加素材＋创建升格」A 面消费闭环＋wt-2 B 面环 3 导出执行器 B 面三环闭
  环＋wt-4 030 冻结前置 schema 设计环 v0.2 草案〔schemas/bdl/v0.2＋协议本草稿＋5 例
  消费测试〕＋163 批两笔操作者裁决落账〔030 定座＋§5.7 案 A〕）；inbound 79 文件全为
  集成已验收内容；基线刷新 2bd60a4a。brief ①区指向本树留言恰一条＝wt-4「〔→数据〕
  （消费面领取邀约确认，030 内联线程）bdl-queries dependencies.* 查询族」——即本拍
  任务领取凭证，照办。
- **030 内联表态（表态批恰一文件 collab/proposals/030-… 追加
  `### 回复（数据/wt-5，2026-09-22 第 166 批——向量文件形态收敛＋dependencies.*
  查询面 v0.5 候词表方向）`节；协作面正当共写，零代码）**：
  - **①向量文件形态收敛（协议本草稿未决项 2，候冻结批与数据席收敛点的本席答案）**
    ＝**原则：向量实例形态跟随权威语言**——bdl-queries/recipe-export 权威是 JSON
    Schema 故例集是 JSON；BDL 持久格式权威是 SQL，行向量实例形态取 SQL 语句。两案
    （JSON 例集／测试内嵌）之外提第三案：**SQL 片段例集文件**
    `schemas/bdl/v0.2/examples/`（冻结批创建），接受例一向量一文件恰一条 INSERT、
    命名 `<subject>.sql`（恰映协议 P1–P9），拒绝例 `invalid-<被违反律>.sql`（恰映
    N1–N8，照 bdl-queries invalid-* 惯例）；文件契约＝零 PRAGMA/事务/DDL/种子，连接
    /迁移/种子/foreign_keys 全归消费测试架设，接受必须可执行、拒绝必须失败且按可分
    辨处断言约束族（CHECK/NOT NULL/FK）；resolution_evidence JSON 形状**不另立 JSON
    夹具**（防双源漂移）——形状机器可读钉＝confirmed 接受向量内嵌字面量＋消费测试
    回读断言四键闭集；消费测试改骑文件（现草案测试已 include_str! 三个 SQL 权威，
    同机制延伸，例数判定不变机械提升），三件纪律中「向量」由此成独立数据件，store
    v0.2 落库测试与后续消费者复用；bdl-queries v0.5 夹具引同一批合成词面原型跨面对表。
  - **②dependencies.* 查询面 v0.5 候词表方向（§5.7 案 A 已裁，本席按定座领取；
    只落线程方向，schemas/bdl-queries/v0.5/ 文件零创建，实现环候下批）**：
    - 边界先行：bdl-queries 维持只读；confirmed_by_human 翻 1 的写动作属建库切片
      （产线座）库写面，本族零写操作；版本机制＝additive operation 闭集扩员（六→
      七/八），v0.1–v0.4 保留勿改；**排序依赖如实标注：词面骑 BDL v0.2 闭集，冻结
      顺序宜 v0.2 先落、v0.5 随后（或同批协同），v0.5 不应先于 v0.2 冻结**。
    - 操作闭集方向两成员：**`dependencies.lookup`**（反查段核心，U18 供数链直接所
      需；params＝name 必填＋depKind 可选枚举骑四值草案闭集随冻结改＋limit 1–200 缺
      省 50／offset 照 catalog.list 分页律；确定性序 productId↑ 后 observation_id↑）
      ＋**`dependencies.listByProduct`**（第二成员，消费者＝消解人工确认工作流读面
      ＋详情未来扩员；冻结批可按 admission 律裁减延后 v0.6，不硬凑）。
    - **匹配规则律（冻结批必裁项，本席方向）**：读期版本化规则 v1＝dep_name 大小写
      不敏感**精确**匹配（存储逐字，匹配非归一化）；零子串零模糊（宁缺勿错）；包名
      形态输入不逐字出现即诚实空集——名义↔包名同一性绝不猜测（030 §3 诚实边界），
      等价匹配只能候库内经确认观察积攒后规则表升版进入，词表本体零等价逻辑。
    - lookup 回执键闭集方向：顶层 `{total, matches[]}`；每 match＝productId＋
      productTitle（可空）＋availabilityRaw/availabilityStatus **双字段律整对复用**
      ＋depKind/depName/versionHint 逐字＋rawQuote（必填）/sourceSpan/extractionMethod
      证据体＋resolvedProductId（**仅 confirmed_by_human=1 出线**，未确认消解绝不进
      建议面）＋advisory（对象|null；非 null 携 installSource 枚举
      `vpm|booth_page|external_page|unknown` 照 030 §3.2＋confidence 两档，映射表体
      ＝版本化规则表材料不冻本体，与 v0.2 同律）；刻意缺席＝extractedBy/observedAt
      不上 lookup 线面（admission 律），路径零出现（house 律）；空态诚实＝total:0
      ＋matches:[] 是「无匹配名义」非「无此依赖」，协议须明记（低置信观察不出建议
      但库内不失格，listByProduct 是未过滤观察面）。
    - listByProduct 回执键闭集方向：`{productId, productStatus, observations[]}`
      （productStatus complete|missing＝tombstone 诚实面）；observation＝lookup 证据
      键全携＋extractedBy＋observedAt＋resolution（null|{productId, confirmed,
      evidence[]}，未确认线索以 confirmed:false 如实出线）——**两面对照即「线索非
      结论」律落点：lookup 只出已确认，listByProduct 列线索并标注**；productId 未知
      语义照 catalog.detail 既有缺席语义对齐（冻结批对表项，不臆测）。
    - 向量桥：v0.5 examples 照四版惯例落正负例＋invalid-schema-version 刷新，夹具全
      合成；本批零落盘零代码零测试触发，U18 终裁前零端到端宣称维持。
- **机械校验**：本拍三笔＝追平壳 c0d1e06e（零自有内容纯吸收，inbound 79 文件全系
  集成第 163/164 批已验收内容，含 wt-4 v0.2 草案环——其定向证据由该批自带：cargo
  106 套件 927/0＋clippy 0／0＋vitest 94 文件 876/876，本拍不重跑）＋表态批恰一
  collab 提案文件＋本状态批恰本文件——**collab-only 免全量如实声明**：零自有代码
  变更、零编译触发、零 %APPDATA% 写入；环境事实＝零用户进程接触、VUA-7/VUA-8 全程
  零触碰；收尾时段 08:40 禁开新切片约束本拍不适用（04:25 工作时段）且本拍零新切片
  零新代码。
- **结论**：操作者第 166 批两项兑现——①数据域冻结表态（向量文件形态/命名收敛意见
  ＋dependencies.* 查询面接口草案方向 bdl-queries v0.5 候）落 030 内联线程；②消费
  面 schema 词表草案（查询方法名/参数/回执键闭集方向）落提案线程，实现环候下批、产
  线域零代笔。零代码、测试不涉、零端到端宣称维持（表态系树内 schema/协议/既有例集
  只读引用，非任何运行验证）。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 158 批（09-22 01:0x–01:2x，追平壳 262518b8＋表态批 e7144165＋状态批）＝030 内联
技术表态（①本地库模式数据面评估：同律合用/source_span 扩维迁移义务/置信度两维两列
/dep_kind 粒度/resolution_evidence 形状/九表纯增量/消费测试补观察表族缺口；②出线
面两案代价对照；③倾向案 A 非裁决）——该表态经 wt-4 第 164 批逐条消化入 v0.2 草案
（两维两列照采纳、dep_kind 收窄四值草案提案、resolution_evidence 形状已填、向量负例
钉草案方向），§5.1 定座与 §5.7 案 A 经操作者第 160 批裁决、集成第 163 批落账。第
155 批＝09-20/21 真机数据面只读一致性清点（互证八组＋观察点四项只报告不修；A 配方时
钟失真/B 失败运行域记录口径差均经 wt-2 第 156 批闭环，C 补录入 BOARD #43，D 留档）
＋自理追平。更早见 git 历史。

## 本轮交付（2bd60a4a 基线世代）
- **追平壳 c0d1e06e**（--no-ff 吸收 main＝第 163/164 批世代；strictly-behind 40/
  实质 14、领先 0，merge-tree 预检 exit 0，合并树 inbound 79 文件全集成已验收内容；
  基线刷新）。
- **030 内联表态批**（恰一文件 collab/proposals/030-… 线程格式合规追加一节；两部
  分＝①向量文件形态收敛〔跟随权威语言原则＋SQL 片段例集第三案＋P/N 映射＋文件契约
  ＋证据形状钉法＋测试骑文件〕②dependencies.* v0.5 候词表方向〔只读边界＋排序依赖
  ＋两操作闭集＋匹配规则律＋lookup/listByProduct 回执键闭集方向＋两面对照＋向量桥〕）。
- 零新代码交付、零 %APPDATA% 写入、零新阻塞、不开新切片。

## 在途/待他角色
- **[等集成] 本拍两笔候随轮验收（--no-ff）**：表态批（恰一 collab 提案文件，
  collab-only 免全量）＋本状态批（恰本文件），写明「wt-5 第 166 批：030 冻结批数据
  域协同表态（向量形态收敛＋dependencies.* v0.5 候词表方向）＋追平至 2bd60a4a」。
  实质非 collab 面为零，免 diff 复核声明。
- **[知会产线 wt-4] 两项收敛点已落线程**：①向量形态第三案（SQL 片段例集）候冻结批
  采纳或再议；②v0.5 词表方向两操作闭集＋匹配规则律＝冻结批必裁项已标。冻结切片排期
  事实：BDL v0.2 冻结（产线座）宜先于/同步 bdl-queries v0.5 冻结（本席），词面耦合
  已在线程明记。
- [等操作者/用户] W25 真机走查推进（#43 修复线已在库、复验候用户回访 O-2，复验通过
  前 #43 不记 resolved 口径维持）；窗口内数据候办两项维持：批 D 剩余真机义务配合面
  （候走查驱动）、requestRun 对象选择面事实源输入（到则数据形状表态）。
- [等用户] 磁盘读数维持观察（上拍 592G/69%，本拍零 %APPDATA% 写入不刷新读数），随
  用户处置。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝本拍两笔（030 表态批恰一 collab 提案文件＋状态批恰本文件，均
collab-only 免全量），请集成随轮验收（--no-ff），写明「wt-5 第 166 批：030 冻结批
数据域协同表态（向量形态收敛＋dependencies.* v0.5 候词表方向）＋追平至 2bd60a4a」。**

## 待命声明（第 6 步，如实）
本轮（2026-09-22 04:2x–05:0x，节拍轮工作时段 04:25 date 实测；三笔：追平壳 c0d1e06e
＋030 表态批＋本状态批）：①date 04:25 实测工作时段；pnpm collab:brief ①区指向本树
留言恰一条＝wt-4 消费面领取邀约确认（030 内联线程 bdl-queries dependencies.* 查询
族），失鲜工作树无；②操作者第 166 批任务兑现：读 main 上 030 提案全文（含 163 批
裁决落账与 wt-4 第 164 批设计环登记）＋schemas/bdl/v0.2 草案（schema.sql/
002 迁移/协议本草稿/消费测试现状）＋schemas/bdl-queries v0.1–v0.4 全部版本 schema
与例集，两部分表态落 030 内联线程（向量文件形态收敛＋dependencies.* v0.5 候词表方
向：操作闭集/params/回执键闭集方向），零代码、零 v0.5 文件落盘、测试不涉；③追平＝
落后 40（实质 14）merge-tree 预检 exit 0，--no-ff 合并 c0d1e06e 纯吸收 main
2bd60a4a，inbound 79 文件全集成已验收内容，基线刷新；④机械校验＝三笔 collab/吸收
面免全量如实声明（零自有代码变更、零编译触发；wt-4 草案环证据随该批自带，本拍不重
跑）；⑤环境事实＝零用户进程接触、VUA-7/VUA-8 全程零触碰；收尾时段约束不适用（工作
时段）且本拍零新切片。零端到端宣称维持——表态系树内只读引用与既有例集惯例引用，非
任何运行验证。退出待命，候集成验收本拍两笔、产线座对两收敛点回应、BDL v0.2 冻结批
开窗（本席 v0.5 随后协同）、W25 走查数据配合面驱动、下轮 brief 或新指派；在手无半
途切片、除本状态批外无未提交改动。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍两笔（030 表态批恰一 collab 提案文件＋本状
  态批恰本文件，collab-only 免全量）**，请随轮验收（--no-ff），写明「wt-5 第 166 批：
  030 冻结批数据域协同表态（向量形态收敛＋dependencies.* v0.5 候词表方向）＋追平至
  2bd60a4a」。追平＝落后 40 纯吸收你方第 163/164 批世代（inbound 全已验收内容），
  免重跑证据＝本拍零代码变更。
- **[→产线 wt-4] 两项待收敛点已落 030 线程（第 166 批节）**：①向量文件形态本席提
  第三案＝SQL 片段例集文件（原则：向量实例形态跟随权威语言；P1–P9/N1–N8 已给一一
  映射命名；证据形状钉在向量字面量＋测试回读，不另立 JSON 夹具）——候冻结批采纳或
  再议；②dependencies.* v0.5 候词表方向已领取落线程：两操作闭集（lookup＋
  listByProduct）＋匹配规则律（精确匹配、零等价猜测）＋lookup/listByProduct 回执键
  闭集方向（确认面/线索面两面对照）。**排序事实请排期纳入：BDL v0.2 冻结宜先于/同
  批协同 bdl-queries v0.5 冻结（词面耦合）**；v0.5 实现环候下批，本席冻结批按三件
  纪律办理。
- （回执不回执：brief ①区 wt-4 领取邀约已照办即本拍主体；第 163/164 批实质批无新
  数据指向——wt-4 消化本席 158 表态诸项已在协议本草稿与提案线程互证照录；在途事项
  以 BOARD 与本状态文件当前焦点为准。）
