---
worktree: wt-main
branch: main
role: 集成
baseline_commit: b22939e
updated: 2026-09-20
---
## 当前焦点
**第 127 批（2026-09-20 05:0x–06:0x，W25 真机窗口批延续，非节拍，时段例外照用户 2026-09-19/20 指令）——028 文档审计集成席位三件办理（操作者 2026-09-20 注「本拍可办」明派：根 README 四语言＋docs/README 双语导航＋alcom-vcc 条目与 U14 矛盾修正；project-context 候用户裁决项维持登记）＋五树回执核实＋U15 立行**：

- **brief ①区消化（is-ancestor 实证）**：wt-2/wt-3/wt-4/wt-5/wt-6 五条验收请求核实全系已收编批次回执——五树尖 a5d13cc/de4c59c/395c7d1/f056deb/a260397 及 wt-2 修复批 1602ed4 均 `merge-base --is-ancestor` 在 main、分叉读数领先 0（wt-2 三笔经第 125 批合并 3381592b 收编，本批补登记闭环），就地消化勿重复；失鲜工作树无。**wt-7 维持观察不合并**：其 [→集成] 验收请求与同批状态文件「下次合并意图＝追加批进行中请暂缓合并」并存，照状态批权威办理——VUA-7 追加英文/韩文修复批进行中（实现 2b20a48 之后仍有提交，树尖 5c58622 未入库），候其完整提交后切片批＋状态批一并验收，照操作者注维持观察。
- **028 #1 根 README 四语言已办**：①版本声明 v0.5.0→**v0.6.0**（现行已发布版，M4 关门 2026-09-08）并补 `docs/release/` 发行页链接——028 给出的两选项（改版本号／改述以发行页为准）并取，断言准确且降低下次发行再腐化概率；②「桌面与 VR Overlay」行补「VR Overlay 为 `1.0.0` 后方向锚」限定（对齐 product-boundary 1.4.0 把 VR Overlay 移出 `1.0.0` 组成的事实）；③「环境与项目管理」条补 U14 设置面共享句（VPM 包管理设置＝settings.json 仓库订阅＋本地包注册表面与 VCC/ALCOM 共享同一文件）并链接产品边界——ZH/EN 链各自语言镜像；JA/KO 无边界镜像（docs/ 下仅 _ZH/_EN），按该两文既有惯例（文档链接指 EN 版）链 `product-boundary_EN.md` 并在链接词面标注（英語）。
- **028 #2 docs/README 双语导航已办**：①「当前入口」按现行协议族刷新——unity-bridge 链接改 **v3** 并标注「现行冻结；生产路径 v2 继续生效」（REGISTRY 58 行事实）、bdl-queries v0.3→v0.4＋补 bdl-commands v0.4、补 packages 族五行（query v0.1／catalog v0.2／ops v0.5／repos-catalog v0.1〔025 P2 词表行〕／repo-catalog v0.1〔027 F2〕）、补 project-inspection v0.2＋project-ops v0.2（ALCOM/VCC 矩阵机器可读面对应）＋inspection-queries v0.1＋editor-verify v0.1＋production-use-case v0.2＋release-handoff v0.1；②入口区头部补 **development-outline／design-standard／project-context／REGISTRY** 四链接（project-context 链接不等于处置——U15 候裁决维持）；③发行说明补 v0.5.0/v0.6.0（v0.4.1 保留）；④「按任务阅读」表 AMF/Recipe/Unity 行 unity-bridge-v1→v3；⑤补 `collab/README.md` 协作机制入口句（028 差距④）；⑥头部更新日期 2026-09-20。所有新链接逐文件 ls/diff 实存核对（含 packages-repos-catalog 与 packages-repo-catalog 两相似文件并存核实）。**是否纳管 REGISTRY 留 W26-a 治理判断**（本批不擅自登记；导航自称规范效力与未登记受管的空隙照 #10 维持）。**新增治理观察并入 #10**：`docs/README.md`（无语言后缀）系 b4 世代旧残留（头「范围：VUA 新仓库」、旧权威顺序含「用户当前明确裁决」、链接 product-boundary.md），与现行 README_ZH 大面积分叉——候 W26-a 与纳管判断一并处置，本批不动（028 清单未点名，不超范围）。
- **028 #5 alcom-vcc 条目＋compatibility 矩阵已办**：①条目 front-matter `status: planned→experimental`（先例 eac-process-recovery；值域「proposed|planned|experimental|supported|deprecated」核实）＋`delivery: v0.8.0→v0.7.0`（024–027 链归 M5/v0.7.0 窗口）；②双语正文补 **U14 设置面例外句**（对齐 product-boundary 1.4.0「明确边界」节措辞：豁免只及 settings.json 仓库订阅＋本地包注册表面、双方改动立即可见；`vcc.liteDb` 等其余存储面与项目文件面维持禁止/只读）＋落地注记（读面与设置面已随 024–027 落地、发行面候 v0.7.0）；③`docs/compatibility/alcom-vcc_ZH/EN.md` 升 **1.3.0**：头部（版本/日期/权威行刷至 1.4.0＋U14 注记）＋「权威与硬边界」节补「设置面例外」段＋禁止清单补 settings.json 包管理设置面豁免注记＋变更日志条目；④REGISTRY 行同步（1.2.0→1.3.0，域归属保持**环境**、集成代笔修订在行注记与本批声明）；⑤capabilities/risk 未动——risk 系发布门派生（vua.risk-gate/v1），本批零 capability 变更、零自派风险。
- **028 #4 project-context 处置路线升正式裁决行 U15**：原系 #42 行内「候用户裁决默认 A」表述，照操作者注「候用户裁决项维持登记」升 [需用户] 正式行防丢失——路线 A（随 W26-a 刷新，集成推荐）vs 路线 B（声明历史快照封存），候用户批量裁决，各角色照规则跳过不代决，**默认 A 不构成裁决**。028 其余挂账维持：#3 两候核对项随核心 F4 冻结批起草对表（启停词面按 wt-6 真机结论 (c)）、#7 候桌面表态（028 内联桌面已回 §8 增补候 W25 窗后例行轮 0.7.6）、#6 零强制行动、#8/#9 已办、#10 候 W26-a。028 提案 status→**办理中**＋内联线程集成回复登记办理细节与授权链。
- **授权链与落地方式**：用户 2026-09-19/20 指令「找之前的对用户需求和操作文档，看有没有需要更新的内容」（先清单后更新）＋操作者 2026-09-20 注「本拍可办」＋028 执行序建议第 2 条（集成席位 W25 窗内办理 #1/#2/#5）。全部变更面在集成所有权域（docs/＋collab/），零代码零 Schema，照 outline 2.0.13 判例（028 提案内明载「集成域内直接修订」）随集成登记批落 main，本提交信息与 028 内联回复均载明授权来源。
- **机械校验**：docs 新链接全数实存核对；REGISTRY/头部版本一致性候随批 brief 复跑登记；本批变更面＝docs/ 10 文件（根 README 四语言＋docs/README 双语＋tool-catalog 条目＋compatibility 双语＋REGISTRY 一行）＋collab/ 三文件（BOARD＋028＋本状态文件）；簿记+文档面免全量如实声明——本批零代码变更，最近全量/定向证据＝第 126 批合并树定向复跑（04:5x，全绿）在案；推送照网络实况（上批一次推净，失败则照惯例登记勿超三次）。
- **诚实边界**：零端到端宣称维持——本批系文档审计文本办理，非运行验证；W25 真机走查段（A2→VRChat 目视→B3）候用户稍晚返回，非 GUI 队列照常推进；docs/README 与根 README 未入 REGISTRY 的治理空隙如实留 W26-a。

## 前录（第 126 批，2026-09-20 04:4x–05:0x，全文见 git 历史与 BOARD 前录）
紧急操作者批验收轮：F2 wire 两笔在库核验闭环＋wt-3 W25 live 第二批 D3/D4/D5 --no-ff 收编（合并 f8d8358）＋合并树定向复跑全绿＋推送债清偿（59 提交一次推净）。

## 阻塞
无。（无本地工作阻塞。）

## 下次合并意图
候各树状态批/切片批照常随轮验收（--no-ff）：wt-7 i18n 切片候其完整提交（追加批进行中，切片批＋状态批一并验收，届时收编开工状态笔 a6df397）；wt-2 F3 冻结批候领取（条件成就维持）；wt-6 F2 实现核对切片候即领；wt-3 F2 形状核可下轮首项（桌面席位申报）；集成席位 028 剩余全为挂账（#3 候 F4 冻结批、#7 候桌面表态、#4 候 U15 用户裁决、#10 候 W26-a）无自领实现项；project-context 路线候用户裁决（U15，默认 A 不构成裁决）。推送照网络实况。

## 留言
- [→操作者] **028 集成席位三件已办（第 127 批入库）**：根 README 四语言（v0.6.0＋发行页链接＋Overlay 限定＋U14 句）、docs/README 双语导航（当前入口刷新至现行协议族＋四入口补齐＋collab 入口）、alcom-vcc 条目与 compatibility 矩阵 1.3.0（U14 设置面例外对齐边界 1.4.0）。**project-context 处置路线已立 U15 候你裁决**（A 刷新／B 封存，默认 A 不构成裁决）；docs/README 是否纳管 REGISTRY 留 W26-a。W25 真机走查段照你指令候你稍晚返回；发现项回填通道照旧。
- [→wt-7] 暂缓遵照：你方状态批「追加批进行中请暂缓合并」为权威，本批未合并 slice/desktop-i18n-player-language（树尖 5c58622 不在 main 系预期状态）；候完整提交后的验收请求（届时切片批＋状态批＋开工登记笔一并办理）。两处留言并存以状态批为准的判读如实登记。
- [→核心]（知会）028 #3 两候核对项（F4 手动刷新写面 U14 豁免定性＋启停词面按 wt-6 结论 (c) 对表）系你方 F4 冻结批起草输入，维持挂账；compatibility/alcom-vcc 1.3.0 的 U14 句以边界 1.4.0 为权威，F2 面（repo_catalog 后端指向根事实）未被触碰。
- [→桌面]（知会）028 #7 design-standard §8 增补候你方 W25 窗后例行轮（0.7.6）——028 内联你方表态已登记；根 README/导航刷新不触你方域文件；wt-2 探针修复批在你方域的 6 文件机械同步经第 125 批收编在案。
- （历史留言已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
