---
worktree: wt-main
branch: main
role: 集成
baseline_commit: b1cad7cc
updated: 2026-09-22
---
## 当前焦点
**第 168/169 批（2026-09-22 06:0x–07:0x，节拍轮工作时段 date 05:57 实测）＝压缩派
发轮（仅集成）：三栈验收入库（wt-4 030 store v0.2 落库环＋wt-5 bdl-queries v0.5
FROZEN＝030 候派两环双闭环＋wt-3 #45 material 12 键四语补齐件）＋合并树定向复
跑六闸全绿＋wt-3 行数申报勘误落账**：

- **产线栈 wt-4 三笔 --no-ff 收编（合并 090e63b0）**＝追平壳 81659e57（纯吸收
  树全等 main ecf0adaa）＋实现批 2469b368（恰 8 文件 1240+/30-）＋状态批
  46f1acd2。验收重点逐项 diff 级成立：
  - **v0.1 数据 verbatim 存活钉**：迁移后 raw_quote/source_span/
    confirmed_by_human 三元断言＋重建表新旧词面两可写（P9 律）。
  - **法律权威单一化设计（利弊集成复核成立）**：store 不持重复 Rust 闭集
    （dep_kind/source_span/extraction_method 以 String 逐字入库），真实
    SQLite CHECK/NOT NULL/FK 约束是唯一拒绝者，违约以
    BdlStoreError::Database 如实浮出；利＝单一真相＋17 冻结向量文件直驱
    store 面、拒绝由真 CHECK 产生非 Rust 副本；弊＝编译期无收窄、运行时才
    拒、错误类型较粗——类型文档诚实声明且系派发批准形态。
  - **confirmed 唯一写入者**：写入面无 flag 字段（行落 DEFAULT 0＝线索）；
    confirm_dependency_resolution 一次显式留痕写同时钉已观察目标商品
    （否则 UnknownProduct）＋非空消解证据（空＝InvalidResolution）＋旗标
    （行须存在否则 UnknownDependencyObservation）；确认绝不自动发生。
  - 迁移注册升 0.2（fresh 库单事务全链 001＋002＝出生即 v0.2；既有 v0.1 库
    开盖即经 002 迁移；UnsupportedFormat 双拒绝面＝migration-N fence＋外来
    format_version）；schemas/ 零触碰；provider-host datasetRevision 钉诚实
    伴改（'0.1'→BDL_FORMAT_VERSION）；协议本 0.2.1 FROZEN and LANDED（冻结
    词面零变化）＋REGISTRY＋030 内联线程落库登记。
- **数据栈 wt-5 三笔 --no-ff 收编（合并 cd45dcdd）**＝追平壳 eb064128（纯吸
  收）＋实现批 cb40bf1d＋状态批 4d500437（恰一文件）。四验收重点逐项成立：
  - **与 BDL v0.2 冻结闭集机械对表**：消费测试从冻结 schema.sql 权威文本机械
    抽 CHECK 列表要求 enum 逐字相等（dep_kind 四值/source_span 五值两表/
    extraction_method 六值）；v0.2 先冻 v0.5 后随顺序依赖钉死。
  - **诚实空集律**：包形态输入无字面命中＝total 0 空集且空封套本身过 result
    schema 校验；名义→包名同一性绝不猜测；total 分页前计算。
  - **「线索非结论」两面对照机械钉**：lookup 匹配行不携带 extractedBy/
    observedAt/resolution（准入律）；观察行携带它们且无 advisory（建议是
    lookup 的职责）；错链 confirmed:false 列线索；lookup 对未确认消解不浮出
    resolvedProductId/advisory。
  - **installSource 不凭空宣称**：规则 v1 只从确认消解目标来源主机派生
    booth_page/external_page；vpm/unknown 留闭集永不发射（无 VPM-repo 事实
    宣称 vpm 即猜测）；引擎钉无消解→advisory null 宁缺勿错；双门＝刻意声明
    版面＋人工确认消解。
  - operation 闭集六→八 additive（lookup＋listByProduct，KEEP 四理由冻结）；
    匹配规则 v1 零模糊（ASCII 折叠范围诚实声明、零子串/模糊/等价）；9 向量
    ＝4 正＋5 负含 unity_or_sdk_version 拒绝钉＝v0.2 N1 判决面；8 例消费测试
    参考推导清晰标注非 store v0.2 行为；零 bdl-store 源码改动零 wire。
  - **030 同窗合并冲突双节全保解决**（产线落库回复节 vs 数据交付节文末拼接；
    分段实核：前缀至产线节与 HEAD 侧逐字全等＋数据节与 slot/wt-5 逐字全等）。
  - 文件数口径注记（集成登记）：状态批「恰 13 文件」系冻结三件口径（2 schema
    ＋9 向量＋2 协议本），提交实测 16 文件含三伴生件（消费测试＋REGISTRY＋
    030 回复）——拆分自洽。
- **桌面栈 wt-3 三笔 --no-ff 收编（合并 b1cad7cc）**＝追平壳 39e2a80a（纯吸
  收）＋实现批 01bf2a51（恰 5 文件 114+/22-）＋状态批 c7183d76。三验收重点逐
  项成立：**逐键发射语境锚定零发明**（合并树引擎侧 grep 实测 12 键发射面与钉
  面恰合：executionFailed x8/provisionFailed x3/sourceInvalid x2/
  riskDecisionStale x2/其余七键各 1；锚点＝核心 150 批分类分化＋
  material_intake 发射点＋provider-host worker 恢复面）；**并呈律零字节触碰**
  （diff 仅四语表＋测试文件零 tsx；词面＋code 原词双事实并呈原样）；**12 键
  双向闭集钉**（缺键红/多键红；每键经 standing lookup 非空本地化行）；四语
  补齐恰 10 新键＋已持有 2 键＝12。
- **wt-3 行数申报勘误落账（操作者本批指令办理）**：166 批状态批 25cf4159 申
  报「实现批 594+/11-」git 实测 **1886+/11-**——wt-3 状态文件经 c7183d76 轮
  转重写后已不载该数，166 批合并信息已载正确数，本批 BOARD 前录＋合并信息即
  正式账面订正、勘误闭环。
- **合并树定向复跑集成亲测全绿（06:1x–06:5x，df 预查 517G/73%）**：cargo
  test --workspace **940/0**（ignored 28 维持；108 suites；对 166 批基线 926
  净 +14＝恰 wt-4 六例＋wt-5 八例，自洽）＋clippy --workspace --all-targets
  **0 警告 0 错误**＋desktop typecheck 双 tsconfig **exit 0**＋vitest **96 文
  件 892/892**（890＋恰 wt-3 两钉）＋check:i18n **OK**＋check:leak **155 指
  纹零泄漏**（独立临时生产构建）。
- BOARD #46/030 行（**落库环＋v0.5 环双闭环；提取管线切片候下窗派产线座**）＋
  #45 行（**material 词表补齐件闭环；余候派＝(3) 端口面取消位**）更新＋前录轮
  转（插 168/169 段轮出最老段，10 段维持）。本批纪律：wt-7 暂停自动推送诉求
  ——操作者本批指令明确「状态批＋推送」，照指令推送；wt-7 诉求（簿记改走
  PR/PROTECTED_MAIN.md 加载/主树只快进）维持候操作者裁决、本批零代决；wt-8
  无新动作；[需用户] 条目零代决；VUA-7/VUA-8 全程零触碰；
  `?? _local_p27_devlog.txt` 照例不触碰。
- **诚实边界维持：零端到端宣称**——合并树复跑系代码面证据；store v0.2 系真
  实 SQLite 迁移/约束执行≠真机全链；v0.5 系冻结面＋参考推导非 store 行为非
  live wire；material 词表系词面补齐非引擎行为变化；真机全链归 W25（O-2）；
  U18 终裁前零端到端宣称维持；测试绿≠真机绿。

## 留言
- [→产线/wt-4]（验收回执）第 168 批两笔已收编（090e63b0）：迁移注册升版、
  verbatim 存活钉、单一法律权威利弊、confirmed 唯一写入者、UnsupportedFormat
  双拒绝面、schemas 零触碰逐项核可；030 同窗冲突与你席落库节双节全保。
  **提取管线切片（保守提取＋消费面）候操作者下窗派发你席。**
- [→数据/wt-5]（验收回执）第 168 批三笔已收编（cd45dcdd）：v0.5 冻结三件、
  四验收重点（机械对表/诚实空集/两面对照/installSource 两值）逐项核可；你席
  与产线席同窗文末冲突双节全保（分段字节级实核）。文件数口径注记已集成登记
  （13＝冻结三件口径；实测 16 含三伴生件，自洽非申报错误）。**接线后续＝信封
  常量/路由臂候核心接线批，你席无在途动作。**
- [→桌面/wt-3]（验收回执＋勘误落账知会）第 169 批三笔已收编（b1cad7cc）：12
  键四语补齐、逐键锚定零发明、并呈律零触碰、双向闭集钉逐项核可。**上批申报
  行数勘误（594+→git 实测 1886+）已随本批集成簿记正式落账**（BOARD 前录＋合
  并信息＋本文件），你席状态文件经轮转已不载该数，无需再办。
- （回执不回执：wt-2/wt-6/wt-7/wt-8 无新领先零动作；wt-7 暂停推送诉求候操作
  者裁决在案；在途事项以 BOARD 与本状态文件当前焦点为准。）
