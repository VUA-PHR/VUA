---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 7017cd6
role: 桌面
updated: 2026-09-18
---
## 当前焦点
**[→桌面] #38 修复批落地（2026-09-18 06:3x–06:5x,工作时段;追平壳
＋修复批 a31e62f＋本状态批）——消化 BOARD #38（7017cd6 操作者
登记）「内嵌浏览导航条不可见不可点＝视图内无退出」,单拍单一
任务**:

- **背景与根因（照 BOARD #38 登记全文消化,操作者已 CDP 实证到
  元素）**：#37 修复后经面板正常路径自动打开视图存活、导航条在
  DOM 中渲染且按钮齐全,但 rect.top＝194.67px 而非视口 0——祖先
  链 `.vua-card`（云端面板所在卡片）带 `backdrop-filter:blur(10px)`,
  按 CSS 规范 backdrop-filter 使元素成为 fixed 后代的包含块,把
  position:fixed;top:0 的导航条钉进卡片内部,落入原生
  WebContentsView 覆盖区（视图占 y≥44 全窗）＝被视图压住看不见
  点不着＝视图内无退出。代码核对与登记逐行一致（card.css:8-9
  backdrop-filter＋-webkit-backdrop-filter;import-page.css:44-58
  fixed top:0 height:44px）,桌面认账。
- **修法（登记三方向桌面自决,择①portal 挂 document.body）**：
  导航条 JSX 包进 `createPortal(..., document.body)` 脱离
  vua-card 包含块,top:0 恢复视口语义,与 Main 侧 44px 让位条带
  重新对齐。方向②（移除/替换卡片 backdrop-filter）不取:毛玻璃
  是全应用「玻璃卡片 2.0」视觉语言（card.css 系 primitives 公共
  件,变更面＝全应用所有卡片,属设计标准面,超出缺陷修复必要
  范围）;方向③（上移壳层常驻面）不取:结构面改动大,portal 已
  解决包含块问题无需上移。仓库先例:ContextMenu 同类 fixed 包含
  块问题（transform 祖先）经 portal 解决。
- **语义保持（照操作者注记勿破坏两线）**：REMOTE_VIEW_NAV_STRIP_PX=44
  两处对齐零触碰（css height:44px＋Main 常量,同批改动纪律不变,
  本修复不动高度）;#37 实例代次生命周期模型与 #25 卸载即关均不
  回退——条件渲染（viewId !== null）与卸载语义不变,portal 内容
  随面板卸载同步移除。
- **测试面与诚实申报**：CSS 包含块行为属浏览器布局面,组件级
  不可测（仓库无 jsdom/testing-library 基础设施,#37 拍已申报并
  经集成核可的同一边界）;本修复无新增自动化测试点,验收归操作
  者 CDP 实测「视图打开时 barRect.top===0 且可点击」。现有纯
  逻辑测试面不受影响（无测试渲染 ImportPage,grep 实证零引用）。
- **证据（本机本树 VUA-3,06:4x–06:5x）**：df C 盘余 12G 先查
  （与操作者注记一致,近满注记维持）;桌面 check 全链绿——
  typecheck 双 tsconfig 0 错误＋vitest 78 文件 650/650＋build＋
  boundary OK＋i18n OK＋contrast 全达标＋check:leak 155 指纹零
  泄漏＋forest-leak。变更面恰桌面所有权域 2 文件（106+/84-:
  ImportPage.tsx portal 包裹＋注释、import-page.css 注释申报
  挂载点）。
- **环境事实（照操作者注记）**：dev 栈由操作者管理运行中（vite
  5173＋electron CDP 51995）,本树全程未触碰;修复入库后操作者
  重编重验——#37+#38 可一并全链复验:「打开→导航条视口 top=0
  可见可点→关闭」（含自动打开路径目视）,用户终局目视确认随
  其后;本拍不代记 #37/#38 闭环。

## 前情（机械跟随批世代,全文见本文件 git 历史）
09-18 06:1x–06:2x #37 修复批三笔（9b38d6e＋59ee6e8＋335d60d）
经第 93 批 860d756 收编入库,#37 行改记「修复入库·候操作者 CDP
全链复验」（faf9bf3）——本拍 #38 系其直接延续:复验暴露的下一
层缺陷（视图能开了,但导航条被卡片包含块钉进视图覆盖区）。
更早批次见 git 历史。

## 本轮交付（7017cd6 基线世代）
- **追平合并壳**（零自有内容,吸收 main 7017cd6:#37 收编合并
  860d756＋93 批 closure faf9bf3＋#38 登记 7017cd6）。
- **修复批 a31e62f**（恰桌面域 2 文件:ImportPage.tsx 导航条
  createPortal 挂 body＋import-page.css 注释申报,全链证据在案）。
- **本状态批**（恰本文件,collab-only）。

## 在途/待他角色
- **[等集成] 追平壳＋a31e62f＋本状态批候随轮验收（--no-ff）**：
  实质对象＝修复批 a31e62f（恰桌面 2 文件,自树全链证据在案,
  全量复跑候你方合并门照惯例）＋本状态批（collab-only 免全量）;
  追平壳零自有内容照先例自然收编。
- **[→操作者] #37+#38 合并全链复验**：修复入库两笔（59ee6e8 代
  次模型＋a31e62f portal）一并重编后 CDP 实测——「打开→导航条
  getBoundingClientRect().top===0 且可点击→关闭」全链（含自动
  打开路径目视）通过后两行闭环回填,用户终局目视确认随其后;
  本拍不代记。
- **[等桌面/下一拍] ④′能力面对齐切片专项**（BOARD 0716644 处置
  ②,维持）：三面分叉对齐＋live 形状测试,候下一拍,不与本批混做;
  gateway-router.ts:414＋provider 陈旧行维持现状如实申报。
- **[等用户] 既有项维持**：ready-p2 解锁＋v0.2「缓存数据」标注
  呈现复验（与 #33 同窗）、#25/#27/#28/#29 回填、W25（O-2）。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝修复批 a31e62f（代码恰 2 文件）＋本状态批（恰本
文件）,请集成随轮验收（--no-ff）,写明「#38 修复批」;追平壳零
自有内容随验收自然收编。**提交后读数:领先 3（合并壳 1＋修复 1
＋本状态批 1;实质 1＝修复批）、落后 0（7017cd6 世代）。若下轮
brief 读数落后过 15 线照则自理追平。

## 待命声明（第 6 步,如实）
本轮（2026-09-18 06:3x–06:5x,工作时段,三笔:追平壳＋a31e62f＋
本状态批）：①date 06:38 确认工作时段;brief ①区指向本树留言＝
#37 修复批验收请求（已由第 93 批 860d756 收编,本拍消化归档）,
失鲜工作树无;②领任务＝操作者注记最高优先领 BOARD #38（7017cd6
先读全文）,照办;③执行＝追平（merge-base＝335d60d 领先 0 落后
3 纯追平,零冲突,inbound 恰 collab 2 文件无夹带）→修复 a31e62f
（三方向自决择①portal 挂 body,方向②③不取理由已申报;44px 两
处对齐零触碰;#37 代次模型/#25 卸载即关不回退）→check 全链绿
（df 12G 先查;typecheck 双 0＋vitest 78 文件 650/650＋build＋
boundary＋i18n＋contrast＋leak 155 零泄漏＋forest-leak）;
④所有权核验＝恰桌面域 2 文件,其它域零触碰;⑤测试覆盖面如实
申报＝CSS 包含块行为组件级不可测（无 jsdom/testing-library
基础设施）,本批无新增自动化测试点,验收归操作者 CDP 实测
barRect.top===0 且可点;⑥环境事实＝操作者 dev 栈（vite 5173＋
electron CDP 51995）全程未触碰;⑦零端到端宣称维持。退出待命,
候集成验收本批、操作者重编 CDP 复验回填、下一拍④′专项或新
指派;在手无半途切片、无未提交改动。

## 留言
- [→集成] **#38 修复批验收请求**：候验收对象＝修复批 a31e62f
  （恰 apps/desktop/src/renderer/features/import/ 两文件 106+/84-
  ——ImportPage.tsx 导航条 JSX 包进 createPortal(..., document.body)
  脱离 .vua-card 毛玻璃 backdrop-filter 构成的 fixed 包含块
  （BOARD #38 登记 7017cd6 根因）,top:0 恢复视口语义与 Main 侧
  REMOTE_VIEW_NAV_STRIP_PX=44 让位条带重新对齐;import-page.css
  注释申报挂载点;修法择登记三方向之①portal,②移除卡片毛玻璃
  （全应用玻璃卡片 2.0 设计面）与③上移壳层（结构面大）不取,
  理由已在提交信息申报;REMOTE_VIEW_NAV_STRIP_PX=44 两处对齐零
  触碰,#37 代次模型与 #25 卸载即关不回退）＋本状态批（恰本
  文件,collab-only 免全量）;追平壳（merge-base＝335d60d 领先 0
  落后 3 纯追平,零冲突,inbound 恰 collab 2 文件）零自有内容随
  验收自然收编。自树全链证据在案（06:4x–06:5x:typecheck 双 0＋
  vitest 78 文件 650/650＋build＋boundary＋i18n＋contrast＋
  leak 155 零泄漏＋forest-leak）,全量复跑候你方合并门照惯例。
  覆盖面诚实申报：CSS 包含块行为组件级不可测（仓库无组件测试
  基础设施）,本批无新增自动化测试点,#38 闭环候操作者重编 CDP
  实测 barRect.top===0 且可点回填（#37+#38 可一并全链复验）,
  本批不代记。
- （#37 修复批验收请求已经你方第 93 批收编入库（860d756）,
  上拍留言就地消化归档。）
