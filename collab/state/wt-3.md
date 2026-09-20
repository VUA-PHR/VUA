---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 444ff30
role: 桌面
updated: 2026-09-20
---
## 当前焦点
**W25 真机发现第四批·素材入口文件/文件夹语义错位＋通知中心滚动即关闭修复切片轮
（2026-09-20 14:4x–15:1x，时段例外延续操作者批；三笔：追平壳 3fb5f78〔吸收 main
444ff30〕＋修复切片批 2a25a50 恰 15 文件 188+/49-＋本状态批恰本文件）——用户 W25
实测两缺陷桌面域内修复：F-A 选 Meiyun.unitypackage 文件→开始检查→provider 拒
`vua.material.source_invalid`（用户被此缺陷挡在 A2 段）；F-B 滚动通知中心面板即
关闭整个通知中心（截图在案）。全链证据本拍亲测在案**：

- **轮首开工纪律（TICK）**：pnpm collab:brief 14:41 ①区两条指向本树/桌面全数就地
  消化——wt-main 回执（上拍三笔 --no-ff 收编 93be2fa＋合并树定向复跑 788/788，照
  is-ancestor 领先 0 就地消化勿重复）＋wt-7 留言（英韩追加完成；后续合并保留新键
  与自然措辞）＝本拍 en/ja/ko 文案改动照其纪律办理（新键给自然措辞、既有键零误伤）。
- **追平（操作者指令「先合并 main 最新」）**：main 竞速前移至 444ff30（第 133 批登
  记＋推送记录，全 collab 面），rev-list 实测本树落后 6、领先 0；merge-tree 预检
  exit 0（tree 58447ae）零冲突标记，--no-ff 追平壳 3fb5f78 落地（入站与在途脏切片
  文件零重叠预验证后带脏合并），基线刷新 **444ff30**。
- **F-A 缺陷根因（代码亲读实证）**：provider 端
  `crates/unity-bridge/src/material_intake.rs:110-113` `inspect_folder` 对
  sourceFolder 做 canonicalize＋`is_dir` 校验，非目录一律 `vua.material.source_invalid`
  拒绝；而桌面 `main.ts` 拾取对话框给 direct_unity_package 的是 openFile＋
  .unitypackage 过滤器——用户实测选文件必被 provider 拒，且该码当年无映射、折叠进
  unavailable 落「生产能力当前未连接，操作未发出」误报词面。
- **F-A 修复①入口语义对照改（文件夹选择器）**：`main.ts` 拾取处理器两个 intake 均
  改 `openDirectory`（title 素材文件夹 / Local VPM package；目录选择下扩展名过滤器
  无意义故删）。注册四元组不变：refId→{path, displayName} 照旧，sourceFolder＝所选
  文件夹原样透传 provider；displayName＝path.basename＝文件夹名，已选展示行天然显示
  文件夹名。`MaterialEntryBar` 注释同步 intake 语义（两入口均拾取内含 .unitypackage
  的文件夹）。**红线**：桌面侧零目录性预拦——文件路径登记（旧版落盘残留形态）原样
  发出，provider 仍是唯一校验权威。
- **F-A 修复②provider 拒绝如实上呈（source_invalid 专用拒绝原因，第三批先例同形）**：
  `ProductionRejectReason` 联合＋全集数组新增 `source_invalid`（奇偶钉保持）；
  `rejectReasonFor` 映射 `vua.material.source_invalid → source_invalid`——该场景命令
  已发出且被 provider 拒，折叠 unavailable 会渲染「未连接/操作未发出」虚假词面（与
  第三批 unknown_material_source 同一误报论证）；四语表 `productionFlow.rejected`
  新增键（zh「素材来源无效:请选择内含 .unitypackage 的素材文件夹。」＋en/ja/ko 自然
  措辞）；四语 `material.pick/pickFirst` 改文件夹词面（zh「选择素材文件夹…」照操作
  者指令）、`startHint` 补「选择内含 .unitypackage 的素材文件夹」前缀（四语同步）。
- **F-B 缺陷根因＋修复**：`NotificationPopover` 在 window 捕获阶段注册 scroll 关闭
  监听——面板内通知列表滚动被一并算作关闭手势。修复＝滚动关闭判定提取为纯模型函数
  `notification-model.scrollClosesPanel(targetInsidePanel)`（node 测试环境可钉；DOM
  instanceof/contains 判定留在组件薄监听器，照 028 §8.9 portal 纪律薄壳原则）：
  面板内滚动（滚轮/滚动条/键盘）保持打开，面板外滚动照 §8.9 原纪律关闭。
  design-standard **0.7.10** zh+en（§8.9 滚动关闭语义澄清：面板外滚动才关闭）＋双语
  变更记录＋REGISTRY 行（EN 标题/镜像注 0.7.8/0.7.9 漂移顺手修复至 0.7.10，如实记
  录）。
- **回归测试（＋3，缺陷路径钉死）**：`live-production-port.test.ts` 两例骑真实
  Kernel 路由——①文件夹 intake 登记→startInspection 通过形状（自带对话框 mock，
  displayName＝文件夹名，provider 请求 sourceFolder＝所选文件夹原样透传）；②文件
  路径登记（旧版残留形态）→不预拦：invokeSpy 证命令真实发出且 sourceFolder＝文件
  路径，provider 以 `vua.material.source_invalid` 拒绝（注入恰 real provider
  simple_error 形状的 AppErrorV01）→渲染层如实上呈
  `{kind:"rejected", reason:"source_invalid", run:not-connected}`，绝非 unavailable。
  `notification-model.test.ts` 一例＝scrollClosesPanel 双臂（面板内 true→不关，
  面板外 false→关）。共享 harness 对话框 displayName `closet.unitypackage`→`closet`
  （文件夹拾取形状，三处字面量随改）。
- **定向证据（本拍亲测，444ff30 基线世代）**：desktop typecheck 双 0；vitest
  **791/791**（上世代 788＋新增 3）；**build 全链绿含 cargo release 段**（本窗文件
  锁未触发——W25 文件锁先例**无需援引**，如实记录非豁免申报）；boundary OK／
  i18n 3 交付表对齐 OK／contrast 全达标／leak 155 指纹零泄漏（临时生产构建）／
  forest-leak 通过；git diff --check 干净。切片批恰 15 文件＝12 apps/desktop＋
  docs/design 双语对＋REGISTRY 登记行（先例 92d201e/24965f3 桌面席位随批登记）。
- **诚实边界**：零端到端宣称维持——本修复系 TS 面＋壳面＋文档面代码事实＋单元/
  回归测试证据；**真机复验（选素材文件夹→开始检查；滚动通知面板保持打开）归用户
  W25 走查（O-2）**，本拍不宣称真机已验。
- **四环全查（444ff30 观测世代）**：①本树在途＝本拍三笔，无半途切片；②BOARD
  「待用户裁决」区零桌面可办条目（U15 照规则跳过）；③outline 当前窗桌面行＝W25
  在办（本批即响应操作者第四批指派）；④M 门：M5 开窗中关门候 W25 真机走查；M6/M7/
  M8 桌面无新解锁面（F5 消费仍候冻结外双环，不预接线）。**顺手观察（不动手）**：
  NavOverflowMenu/ContextMenu 共享同款 window 捕获 scroll-close 模式，但其菜单内容
  不可滚动、缺陷无从显形，仅登记知会，不扩并本拍。

## 前情（全文见本文件 git 历史）
09-20 13:5x–14:2x W25 第三批素材登记持久化＋unknown_material_source 专用拒绝修复
切片轮（3fb5f78 追平壳吸收前的三笔，经第 133 批 93be2fa 收编）；更早：F3 消费切片
收编关账、D1–D5 修复批，见 git 历史。

## 本轮交付（444ff30 基线世代）
- **追平壳 3fb5f78**（--no-ff 吸收 main 444ff30，落后 6 操作者指令追平，预检 exit 0
  tree 58447ae，入站全 collab 面零代码触碰）。
- **修复切片批 2a25a50**（恰 15 文件 188+/49-，全在本席域＋docs/design＋REGISTRY
  登记行）：main.ts 对话框改文件夹选择器、MaterialEntryBar 注释、
  model-production-port 联合扩员、live-production-port 映射＋回归测试两例、
  notification-model 纯函数＋测试、NotificationPopover 接线、四语表 material 三键
  改词面＋rejected 新键、design-standard 0.7.10 双语、REGISTRY 行。证据见当前焦点
  「定向证据」节。
- **本状态批（恰本文件）**。
- 零新阻塞、零新升级项、零 [需用户]。

## 在途/待他角色
- **[等集成] 本拍三笔候随轮验收（--no-ff），用户被 F-A 缺陷挡在 A2 段，请优先验收**：
  追平壳 3fb5f78（零自有内容纯吸收）＋修复切片批 2a25a50（恰 15 文件：12
  apps/desktop＋docs/design 双语对＋REGISTRY 登记行，请亲审 diff；定向证据
  typecheck 双 0＋vitest 791/791＋build 全链含 cargo release＋boundary/i18n/
  contrast/leak/forest-leak 全 OK 在案）＋本状态批恰本文件，写明「wt-3 W25 真机发
  现第四批：素材入口文件/文件夹语义修复＋通知中心面板内滚动修复切片轮（基线
  444ff30）」。
- **[等用户] 真机复验**：修复面真机走查（选内含 .unitypackage 的素材文件夹→开始
  检查应正常进入检查；通知面板内滚动列表不再关闭整个通知中心；如见「素材来源无效」
  即 source_invalid 专用拒绝路径如实呈现）——归 W25（O-2）窗内，候用户返回驱动。
- **[等核心/环境] F5 接线→库实现→桌面形状核可**（既有面序不变，本拍零预动）。
- [等桌面·后续例行] wt-7 合并后四语语义保留照其留言办理（候其追加批合并）。

## 阻塞
- 无阻塞。

## 下次合并意图
**候验收对象＝本拍三笔（--no-ff）：追平壳 3fb5f78（零自有内容纯吸收）＋修复切片批
2a25a50（恰 15 文件，实质非 collab 面＝12 apps/desktop＋docs/design 双语对＋
REGISTRY 登记行，请 diff 复核）＋本状态批恰本文件，写明「wt-3 W25 真机发现第四批：
素材入口文件/文件夹语义修复＋通知中心面板内滚动修复切片轮（基线 444ff30）」。
提交后读数（rev-list 实测）：领先 3、落后 0。**

## 待命声明（第 6 步，如实）
本轮（2026-09-20 14:4x–15:1x，时段例外延续操作者批；三笔）：①date 14:41 实测时段，
pnpm collab:brief ①区两条就地消化（wt-main 回执 is-ancestor 消化；wt-7 四语合并纪
律照办）；②追平壳 3fb5f78 吸收 main 444ff30（落后 6 操作者指令追平，预检 exit 0、
基线刷新、带脏合并前零重叠预验证）；③操作者指令两任务全办：F-A＝文件夹选择器
（openDirectory 双 intake＋注册四元组不变＋已选显示文件夹名天然成立＋零预拦红线）
＋source_invalid 专用拒绝（联合＋映射＋四语键＋material 三键词面改＋hint 前缀）；
F-B＝scrollClosesPanel 纯模型判定（面板内滚动保持打开）＋design-standard 0.7.10 双
语澄清＋REGISTRY；④回归测试＋3（文件夹透传形状／文件路径不预拦如实上呈／滚动判定
双臂）；⑤定向证据本拍亲测：typecheck 双 0、vitest 791/791（＋3）、build 全链含
cargo release 绿（文件锁本窗未触发，先例无需援引，照实记录）、boundary/i18n/
contrast/leak 155 指纹/forest-leak/git diff --check 全干净；⑥诚实边界：零端到端宣
称——修复系代码＋测试＋文档面事实，真机复验归 W25（O-2）候用户；⑦四环全查零其它
桌面可领任务（F5 消费不预接线，BOARD 零桌面可办条目，[需用户] 照规则跳过；菜单组
件同款模式仅登记不扩并）。在手无半途切片、除本状态批外无未提交改动。退出待命，候
集成验收本拍三笔（用户被挡在 A2 段，请优先）、用户真机复验、下轮 brief 或新指派。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍三笔（--no-ff）：追平壳 3fb5f78（零自有内
  容）＋修复切片批 2a25a50（恰 15 文件＝12 apps/desktop 桌面域＋docs/design 双语对
  ＋REGISTRY 登记行：main.ts 素材对话框改文件夹选择器〔openDirectory 双 intake〕、
  model-production-port source_invalid 扩员、live-production-port 映射＋回归两例、
  MaterialEntryBar 注释、四语表 material 三键改词面＋rejected 新键、
  notification-model.scrollClosesPanel＋测试＋NotificationPopover 接线、
  design-standard 0.7.10 双语＋REGISTRY 行）＋本状态批恰本文件，写明「wt-3 W25 真
  机发现第四批：素材入口文件/文件夹语义修复＋通知中心面板内滚动修复切片轮（基线
  444ff30）」。W25 live 第四批，用户被此缺陷挡在 A2 段，请优先验收。**定向证据本
  拍亲测：typecheck 双 0＋vitest 791/791（＋3）＋build 全链含 cargo release 段绿
  （本窗文件锁未触发，无需援引 W25 文件锁先例）＋boundary/i18n/contrast/leak/
  forest-leak 全 OK。零端到端宣称维持——真机复验归用户 W25 走查。无新请求。
- [→wt-7]（知会）本拍四语表改动两组：①`productionFlow.material` 三键改词面
  （pick/pickFirst 文件夹措辞＋startHint 前缀补「内含 .unitypackage 的素材文件夹」，
  zh/en/ja/ko 四表同步）；②`productionFlow.rejected` 新增 `source_invalid` 一键
  （四表同步）。后续你树合并时如遇邻接冲突，照你方留言纪律保留新键与自然措辞办理。
- （回执不回执：brief ①区 wt-main 回执照 is-ancestor＋领先 0 就地消化、wt-7 留言
  已消化＝本拍四语改动照其纪律执行；历史留言已消化归档，在途事项以 BOARD 与本状态
  文件当前焦点为准。）
