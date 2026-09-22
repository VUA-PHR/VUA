---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 194f295d
updated: 2026-09-23
---
## 当前焦点
**第 178 批（2026-09-23 02:3x–03:1x，节拍轮正常工作时段 date 实测 02:31；
三笔：追平壳〔吸收 main d7c0199a，解一处同位追加冲突〕＋本批＝030 提取管
线实现环〔保守提取器纯解析器＋既有写面落库＋实验旗标语义协议注记＋合成夹
具测试〕＋恰本状态批）**——操作者第 178 批派单兑现，验收口径按本席第 176
批 030 内联线程重新规格化注记办理：

- **诚实核对（开工前，如实申报）**：操作者派单注记「de25daf5 已在 main」
  与 git 事实**不符**——`git merge-base --is-ancestor` 实测 de25daf5（第
  176 批）**不在 origin/main**（轮首实测落后 14／领先 2，与第 176 批状态
  「候随下一集成批验收」一致；第 177 批派单明言 wt-4 不抢跑不代验）。注记
  内容在本树可读、不阻塞本环；本环按「候验收」叠加办理，合并请求覆盖全部
  在途笔。
- **追平兑现（开工前置）**：merge origin/main d7c0199a（＝第 177 批 PR #11
  合并尖：wt-2/wt-3 第 176 批验收＋提案 031 拍 2 outline 2.1.0）。**预检工
  具教训（如实）**：轮首旧式 `git merge-tree`（三参数）exit 0 但实际有冲突
  ——旧式退出码不表达冲突；合并时 `collab/proposals/030-*.md` 同位追加冲
  突一处（本席产线重_spec节 vs main 侧数据/核心两节），按惯例三节零删改依
  次保留（产线→数据→核心），追平壳 **194f295d**；此后预检一律用新式
  `git merge-tree --write-tree`。
- **任务①＝纯解析器（`crates/bdl-store/src/dependency_extract.rs` 新模
  块）**：输入＝调用方提供的商品页内容文本；**零抓取零网络零文件访问**
  （抓取面维持 1.5.0 重_spec 的设计留白）。只提取 030 §1 版面原型高置信结
  构模式三族：`explicit_heading`（作者自拟前提環境类小节，标题词闭集＋短
  行＋非句读守卫）／`bullet`（列点行＋版本钉行，版本形 token 手写扫描、
  尾部白名单拒句读尾巴）／`one_line`（整行恰为 `com.*` 反向域包名，可携
  版本钉）；**散文、标题压缩声明、带键单行声明（「Shader: X」形）、描述
  内外链如实不提——宁缺勿猜**；`extraction_method` 六值闭集中
  `prose`/`title`/`link` 永不产出。产出线索字段齐备：`dep_kind`（骑冻结
  四值；窄词表分类：liltoon/poiyomi→shader、modular avatar/avatar
  optimizer→tool_package、unity/vrchat/sdk 按冻结裁决强制 other、其余一律
  other 不猜；**avatar_base 永不产出**）＋`dep_name`（按原文）＋
  `version_hint`（按原文）＋`raw_quote`（逐字，仅去首尾空白）＋
  `source_span`（恒 body）＋`extraction_method`＋`resolution_evidence`
  （恒空）；确定性＋单文档去重。**消解绝不自动填**（resolved_ref 恒 None
  ——样例 3 错链实证下身份消解完全留在人工确认路径）。
- **任务②＝落库走既有写面**：`lead_to_new_observation` 盖
  `extracted_by='conservative-layout-extractor-v1'`（置信度两维两列律不混
  装）转 `NewDependencyObservation`，经 `record_dependency_observation`
  落库；行恒未确认（`confirmed_by_human` 非写入面字段＝0＝线索），翻 1 唯
  一写入者仍是 `confirm_dependency_resolution`；未知商品经 FK 如实拒绝。
- **任务③＝实验旗标语义（协议注记已落双语）**：本批交付**能力，非启用**
  ——产品代码零调用方（仅测试）；接线任何真实输入源（用户实际 BOOTH 浏
  览/Unity 使用观察通道）＋实验旗标本体（默认关）＋旗标 UI 全部候新提案；
  「能力存在≠默认启用」钉入 `docs/protocols/bdl-dependency-observations-
  v0.2_EN/ZH.md` **0.2.2 注记**（新「保守提取器实况」节）；关闭自动收集
  不影响基础存储的既有律不受影响。**REGISTRY 行不动**（0.2.1→0.2.2 系
  Patch 级注记，照治理 §3「Patch 不动本行」＋brief 按 major.minor 容忍比
  较；生命周期状态未变化）。
- **任务④＝测试全合成**：`crates/bdl-store/tests/
  dependency_extract_conservative.rs` 8 例绿——夹具版面形状照 §1 原型构
  造，**版本串全造、未知依赖用 dummy 名**（classifier 词表专名保留以测分
  类；冻结向量/schema 注释既有词形仅作文档面引用），零真实页内容零网络。
- **红线与诚实边界（全程维持）**：零端到端宣称（真实 SQLite 落库往返≠真
  机全链；提取器对真实页面形态的召回率未验证——合成夹具只证行为律不证覆
  盖率）；零 BOOTH 访问；付费资产零接触；VUA-7 阅读解禁零触碰、VUA-8 零
  触碰；[需用户] 条目零代决；已冻结词面（BDL v0.2 schema.sql/002/17 向
  量、bdl-queries v0.5、unity-bridge v4、amf-production v0.2）零字节触碰。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 176 批（09-23 01:4x）＝030 提取管线 1.5.0 重新规格化注记＋MA/SDK 职责
对账＋Bridge v4 冻结面零冲突核对（de25daf5，候集成验收）；第 174 批＝
dependencies.* v0.5 真实执行器环；第 168 批＝030 store v0.2 落库实现环；
第 166 批＝冻结批；第 164 批＝冻结前置设计环；第 154 批＝#46 立项起草
proposal 030。更早见 BOARD 前录与 git 历史。

## 本轮交付（194f295d 基线世代）
- **追平壳 194f295d**（--no-ff 吸收 main d7c0199a；030 提案同位追加冲突解
  决＝三节零删改；基线刷新）。
- **本批（代码＋docs 面）**：`crates/bdl-store/src/dependency_extract.rs`
  新模块＋`lib.rs` 注册导出＋`crates/bdl-store/tests/
  dependency_extract_conservative.rs` 8 例＋协议本 0.2.2 注记双语（恰两
  文件）＋030 内联线程第 178 批交付登记节＋恰本状态批。
- **验证读数（2026-09-23 本树亲测）**：bdl-store 全 crate 套件绿（84 例，
  含本批 8 例）；`cargo test --workspace` **971/0**；clippy
  `--workspace --all-targets` **零警告**。零 Unity Editor 触发、零网络动
  作、零 BOOTH 访问。环境事实：磁盘 73%（df 实测，与派单登载一致）。

## 在途/候办
- **[候集成·验收] 本树全部在途笔**（详见下次合并意图）。
- **[候操作者派发] 030 剩余**：人工确认面（候选→确认工作流实施面，读侧
  可骑 dependencies.listByProduct 线索面）；输入源接线/旗标/旗标 UI＝候新
  提案（跨桌面/Unity/数据域，不随 030 办理）。
- **[等操作者/用户] W25 正式执行**（A3 段 Unity 侧核证义务在肩，范围按
  1.5.0 MA/SDK 职责边界）；缺口 (b) 交接准入终态门槛候裁决；配方↔素材链
  接达归属候指派（均见第 148 批登记与 BOARD）。
- **[知会消化]** wt-8 [→产线] R1–R3 已落（追平即吸收，零动作）；wt-main
  [→产线] Inspection 收进制作记录（裁决影响知会，本席 Release/记录面后续
  切片按 1.5.0 核对）。

## 阻塞
- 无阻塞。零猜测项。（派单注记「de25daf5 已在 main」与 git 事实不符一事
  已如实登记于当前焦点，不构成本环阻塞。）

## 下次合并意图
**候验收对象＝本树四笔**（第 176 批两笔 de25daf5＋追平壳 194f295d＋本批
状态批，含本批实现笔）＝**产线域代码批**：恰六 tracked 文件（bdl-store 新
模块＋lib.rs＋提取器测试＋协议本双语 0.2.2）＋collab 两文件（030 线程登
记＋本状态批）。验证读数：workspace 971/0＋clippy 零警告（2026-09-23 本
树实测）。请集成随轮验收（--no-ff），写明「wt-4 第 178 批（030 提取管线
实现环：保守提取器＋落库＋旗标语义协议注记；基点 194f295d；含第 176 批
de25daf5 一并验收）」。

## 待命声明（第 6 步，如实）
本轮（2026-09-23 02:3x 起，正常工作时段 date 02:31 实测；三笔：追平壳＋
实现批＋状态批）：①date 02:31 实测正常时段；pnpm collab:brief ①区判读
＝wt-8 [→产线] 留言系追平即吸收零动作，零本树阻塞；②诚实核对＝派单「
de25daf5 已在 main」不实（is-ancestor 实测不在 origin/main），按候验收叠
加办理；追平壳吸收 main d7c0199a 并解决 030 同位追加冲突（三节零删改），
旧式 merge-tree 预检教训在案（此后用 --write-tree）；③通读派单＋030 提案
全文与内联线程（含本席第 176 批重_spec注记）＋product-boundary 1.5.0 相关
律＋BDL v0.2 schema.sql 词面实读（dep_kind 四值/source_span 五值/
extraction_method 六值/resolution_evidence 形状/CHECK 硬律）＋store 写面
（NewDependencyObservation/record_dependency_observation/
confirm_dependency_resolution/seed_product）＋bdl-queries v0.5 匹配规则与
advisory 双门＋协议本 0.2/0.2.1 结构与治理 §3 REGISTRY 规则；④交付＝纯解
析器（三结构族，散文/标题/带键单行/链接不提，avatar_base 零产出，消解不
自动填）＋既有写面落库（恒未确认线索）＋旗标语义协议注记双语（能力存在≠
默认启用，零自动触发）＋合成夹具测试 8 例；⑤测试全绿才提交：bdl-store
84 例绿＋workspace 971/0＋clippy 零警告；⑥诚实边界维持＝零端到端宣称、
召回率未验证如实申报、冻结词面零触碰、零 BOOTH 访问、VUA-7 零触碰、[需
用户] 条目零代决。在手无半途切片、除本批提交外无未提交改动。退出待命，候
集成验收、确认面/输入源接线候派、W25 窗口推进。

## 留言
- [→集成] 验收请求：**候验收对象＝本树四笔（第 176 批 de25daf5＋追平壳
  194f295d＋第 178 批实现笔＋状态批）**，写明「wt-4 第 178 批（030 提取
  管线实现环：保守提取器＋落库＋旗标语义协议注记；基点 194f295d；含第
  176 批一并验收）」。随请 BOARD #46/030 行注记一句（集成维护）：提取管
  线实现环已交付（解析＋落库能力面，零自动触发；旗标/输入源候新提案），
  详见 030 内联线程 2026-09-23 第 178 批产线节。另请知悉：操作者派单注记
  「de25daf5 已在 main」与 git 事实不符（该笔仍在途），已按候验收叠加办
  理，本合并请求覆盖之。
- [→数据]（030 内联线程同窗知会，回执不另发）：提取器落库行
  `extracted_by` 新增管线身份词 `'conservative-layout-extractor-v1'`（开
  放词面，零 schema 变化）——listByProduct 线索面 `extractedBy` 键将来会
  出线该值；v0.5 冻结词面零影响；全部行恒 confirmed_by_human=0，确认门/
  建议门照旧。
- （回执不回执：wt-8/wt-main 留言系知会类，追平即吸收；在途事项以 BOARD
  与本状态文件当前焦点为准。）
