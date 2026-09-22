---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 9b87b69f
updated: 2026-09-23
---
## 当前焦点
**第 176 批（2026-09-23 01:4x 起，节拍轮正常工作时段 date 实测 01:44；两笔：
追平壳〔吸收 main f044c821〕＋本批＝030 提取管线 1.5.0 重新规格化注记＋
MA/SDK 职责对账＋Bridge v4 冻结面冲突核对＋恰本状态批）**——操作者第 176
批派单兑现（原「提取管线切片」派单因产品边界 1.5.0 作废重_spec：TICK v1.7
领单前核对义务＋MA 职责对账＋冻结面对表；零代码零 schema 零测试触发）：

- **追平兑现（开工前置）**：轮首实测 origin/main...slot/wt-4＝落后 10／
  领先 0（main 推进至 **f044c821**＝集成第 175 批簿记〔第 174 批三笔收编
  合并 323aa1f5，经 integration/batch-174 分支 PR #4 落地——前批候验收状
  态就此闭环〕＋产品边界 1.5.0 裁决波 PR #6/#7/#8：正文批 430069e6 合并
  608eea7c、勘误批 cd697381 合并 a79f5e05、doc-debt 清偿 6f4d4d0a 合并
  f044c821）。merge-tree 预检 exit 0 零冲突，--no-ff 合并 main f044c821
  ＝追平壳 **9b87b69f**（零自有内容纯吸收）。基线世代刷新 9b87b69f。
  brief ①区判读＝零本树阻塞；wt-main/wt-8 [→产线] 留言均系裁决影响知会
  （Inspection 收进制作记录；R1–R3 已落），追平即吸收，零额外动作。
- **任务一＝030 重新规格化注记（030 内联线程新回复节，恰 +39 行）**：按
  `docs/product-boundary_ZH.md` 1.5.0 BDL 节（「自动兼容性证据收集为实验
  功能，默认关闭；开启后尝试从用户实际的 BOOTH 浏览和 Unity 使用过程中收
  集证据，不恢复全站云端采集方向」）把「提取管线切片」原验收口径重_spec：
  ①定位＝实验功能、旗标默认关，关闭不影响 BDL 基础存储/普通导入/Recipe
  来源补充；②输入源＝用户实际 BOOTH 浏览与 Unity 使用过程，原 §1 自动化
  产品页抓取面**降级为候选来源之一、设计留白**，§1 调查的版面惯例结论仍系
  保守提取与冻结词面证据原型（调查不作废、抓取管线方向候重议）；③保守提
  取原则维持（结构化版面模式/宁缺勿猜/一切行默认未确认线索）——与 BDL
  v0.2「线索非结论」律、v0.5 匹配规则 v1＋advisory 双门零冲突，1.5.0「没
  有证据代表未知」与 v0.5 空态诚实律互为印证；④已落冻结面（BDL v0.2
  schema＋17 向量＋协议本 0.2/0.2.1＋bdl-queries v0.5 FROZEN＋store v0.2
  落库＋真实执行器环五环闭环）**不受影响**——1.5.0 明记冻结协议与数据格
  式不自动改变，重_spec 只及未实现切片的验收口径；⑤抓取面与旗标 UI 候新
  提案（跨桌面/Unity/数据域），**不随 030 建库环实施**；§5.5/§5.6 未决项
  维持开放。
- **任务二＝MA/SDK 职责对账（零代码）**：按 1.5.0「MA 与 SDK 职责」节盘点
  本域在途/候办有无 MA 穷举测试类计划——**盘点结论＝零此类计划**。MA 邻
  接面清点：`install_modular_asset` 作业步词面（冻结于 recipe v0.3
  approved-plan/build-record 词表；执行面＝unity/Packages/com.ph-r.vua
  `BridgeCommandProcessor.ExecuteInstallModularAsset`；回执实例
  GlobalObjectId v3 合法化、v4 承袭）＋`install_outfit`/`create_toggle`
  经公开 MA API（ModularAvatarMergeArmature/MenuInstaller/MenuItem/
  ObjectToggle）＋`staging_scaffold.rs` MA 编译桩（编译满足桩，非 MA 行为
  测试）＋测试两面（`material_exec_real.rs` 开发者提供真实 MA/NDMF 栈时验
  证 VUA 自身 install 面、缺栈回落诚实桩；`BridgeMutationTests.cs` VUA 自
  身变更效应）＋在途 W25（O-2）A3 段 Unity 侧核证义务——全部系「VUA 自身
  接入/参数/对象选择/调用顺序/代表性实际流程」验证性质，与 1.5.0 无冲突。
  **职责边界注记落档两处**：(a) W25 走查脚本 A3 段职责边界注记
  （`docs/plans/w25-smoke-path-walkthrough_ZH.md` 本地 gitignored 件，零
  tracked diff——执行窗口按此范围核证）；(b) 本状态文件在途节。权威正文
  ＝amf-unity 1.2.0「MA 与 SDK 职责边界」节（裁决波已落 main，本批零触碰
  零重复）；上游可复现问题反馈上游、SDK 检查复用优先、未执行的检查不显示
  为通过。
- **任务三＝Bridge v4 冻结面 vs 1.5.0 冲突核对＝零冲突（预期兑现）**：核
  对面＝`schemas/unity-bridge/v4/command.schema.json` 操作闭集 16 成员
  （读 7：inspect_project/identify_assets/validate_avatar/
  analyze_performance/inspect_avatar_references/inspect_lighting/
  inspect_upload_readiness；写 6：import_unity_package/
  materialize_extracted_package/create_local_vpm_package/install_outfit/
  create_toggle/build_preview；任务 2：execute_production_job/
  restore_project）× 1.5.0 全部裁决点：①Inspection 收进制作记录——v4 检
  查读面系 1.5.0 明文保留的「检测服务、恢复准入、证据记录能力」，页面收敛
  不及协议面；②SDK 检查复用优先——系桥上方调用策略（编排层决定调用哪些检
  查），不涉冻结面本体，未来检查面调整走 v5 additive 冻结、不回改 v4；
  ③MA/SDK 职责——「Bridge 执行与恢复仍是 VUA 的责任」恰系对 VUA 自身作业
  面的确认非否定；④Recipe 可叠加修改＋冲突四选项——v4 无对应操作，未来需
  要走 v5 additive；⑤SDK 上传边界——v1–v4 既有「最终登录与上传保留在官方
  SDK Panel」与 1.5.0 同向；⑥1.5.0 明记冻结协议不自动改变。**零候裁决项**。
- **红线与诚实边界（全程维持）**：零端到端宣称（本批纯文档/协作面，零运
  行零触发）；零 BOOTH 访问；付费资产零接触；VUA-7 全程零触碰（本批无需
  读取）；[需用户] 条目零代决；已冻结词面（unity-bridge v4、BDL v0.2、
  bdl-queries v0.5、amf-production v0.2）零字节触碰。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 174 批（09-22 07:2x–08:4x）＝dependencies.* v0.5 真实执行器环
（BdlDependencyQueries 读 bdl 库执行 DependenciesQueriesPort＋两只 store
只读面＋provider bin 装配翻真＋测试 12 例），已随集成第 174/175 批验收入
库（合并 323aa1f5→PR #4→main 098f57a5）。第 168 批＝030 store v0.2 落库
实现环；第 166 批＝030 冻结批；第 164 批＝冻结前置设计环；第 154 批＝#46
立项起草 proposal 030。更早见 BOARD 前录与 git 历史。

## 本轮交付（9b87b69f 基线世代）
- **追平壳 9b87b69f**（--no-ff 吸收 main f044c821，预检 exit 0 零冲突，
  零自有内容纯吸收，基线刷新）。
- **本批（collab 面）**：collab/proposals/030-bdl-product-dependency-
  catalog.md 内联线程追加「产线/wt-4，2026-09-23 第 176 批——提取管线
  1.5.0 重新规格化注记」节（+39 行，恰一文件）＋恰本状态批。本地件
  docs/plans/w25-smoke-path-walkthrough_ZH.md A3 段职责边界注记（git
  ignored，零 tracked diff，如实申报）。
- 零代码、零 schema、零 docs/ 触碰、零测试触发——collab-only 免全量测
  试照章。

## 在途/候办
- **[候操作者派发] 030 剩余**：提取管线切片——**验收口径已按 1.5.0 重新
  规格化**（实验功能默认关；输入源＝用户实际 BOOTH 浏览与 Unity 使用过
  程；抓取面与旗标 UI 候新提案、不随建库环），领单按 030 线程第 176 批
  注记办理；确认工作流消费面（U18 段）候其后。
- **[等操作者/用户] W25 正式执行**（A3 段 Unity 侧核证义务在肩——核证范
  围按 1.5.0 MA/SDK 职责边界执行：VUA 自身接入的代表性实际流程，非 MA 穷
  举测试；脚本 A3 段注记已落）；缺口 (b) 交接准入终态门槛候裁决；配方↔素
  材链接达归属候指派（均见第 148 批登记与 BOARD）。
- **[知会消化]** wt-main [→产线]「Inspection 收进制作记录」（裁决影响——
  本席 Release/记录面后续切片按 1.5.0 核对，本批零代码无涉）；wt-8
  [→产线] R1–R3 已落（追平即吸收，零动作）。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
**候验收对象＝本批两笔（追平壳 9b87b69f 零自有内容纯吸收 main f044c821，
预检 exit 0 零冲突；＋本批＝collab 面恰两文件〔030 内联线程重新规格化注
记 +39 行＋本状态批〕，零代码零 schema 零 docs/ 零 schemas/ 触碰，
collab-only 免全量测试照章），请集成随轮验收（--no-ff），写明「wt-4 第
176 批（030 提取管线 1.5.0 重新规格化注记＋MA 职责对账；基点 9b87b69f）」。**

## 待命声明（第 6 步，如实）
本轮（2026-09-23 01:4x 起，正常工作时段 date 01:44 实测；两笔：追平壳＋
collab 批）：①date 01:44 实测正常时段；pnpm collab:brief ①区判读＝零本
树阻塞；②轮首追平壳吸收 main f044c821（落后 10→0，预检 exit 0 零冲突），
基线刷新 9b87b69f，前批（第 174 批）候验收状态经 main 098f57a5/323aa1f5
确认闭环；③通读操作者第 176 批派单＋product-boundary 1.5.0（BDL 节/MA
与 SDK 节/待验证五项）＋030 提案全文与内联线程＋amf-unity 1.2.1（MA 与
SDK 职责边界节实读）＋unity-bridge v4 协议本与 command.schema.json 操作
闭集实读＋recipe v0.3 install_modular_asset 词面落点实读＋本域 MA 相关
源码面 grep 实读（BridgeCommandProcessor/staging_scaffold/
material_exec_real.rs/BridgeMutationTests）；④交付＝030 内联线程重新规
格化注记（五点：实验功能默认关/输入源重定抓取面降级候选设计留白/保守提
取零冲突/冻结面不受影响/抓取面与旗标 UI 候新提案）＋MA 职责对账登记（盘
点结论零 MA 穷举测试类计划＋W25 A3 段边界注记两处落档）＋Bridge v4 vs
1.5.0 零冲突核对（16 操作闭集×裁决点逐项，零候裁决项）；⑤本批零代码零
schema 零测试触发，collab-only 免全量测试照章；⑥诚实边界维持＝零端到端
宣称、已冻结词面零触碰、零 BOOTH 访问、VUA-7 零触碰、[需用户] 条目零代
决。在手无半途切片、除本批提交外无未提交改动。退出待命，候集成验收本
批、提取管线切片按新口径开窗、W25 窗口推进。

## 留言
- [→集成] 验收请求：**候验收对象＝本批两笔（追平壳纯吸收 main f044c821
  ＋collab 批＝030 内联线程重新规格化注记＋本状态文件），请随轮验收
  （--no-ff），写明「wt-4 第 176 批（030 提取管线 1.5.0 重新规格化注记
  ＋MA 职责对账；基点 9b87b69f）」。**随请 BOARD #46/030 行注记一句（集
  成维护）：提取管线切片验收口径已按 1.5.0 重新规格化（实验功能默认关/
  输入源＝用户实际浏览与使用/抓取面与旗标 UI 候新提案），详见 030 内联
  线程 2026-09-23 产线节。零端到端宣称维持。
- [→数据]（030 内联线程同窗知会，回执不另发）：重_spec 只及未实现的提取
  管线切片验收口径；BDL v0.2 冻结面与 dependencies.* v0.5 读执行器零影
  响——「没有证据代表未知」与 v0.5 空态诚实律同向，线索/建议两面照旧。
- （回执不回执：wt-main [→产线] Inspection 收进制作记录系裁决影响知会，
  本席后续切片按 1.5.0 核对；wt-8 [→产线] R1–R3 知会系其树工作已落 main、
  追平即吸收零动作。历史留言已消化归档，在途事项以 BOARD 与本状态文件
  当前焦点为准。）
