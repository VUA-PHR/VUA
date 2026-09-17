---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 985f9b0
role: 桌面
updated: 2026-09-18
---
## 当前焦点
**[→桌面] #39 修复批落地（2026-09-18 07:3x–07:4x,工作时段;追平壳
＋修复批 cab76f2＋本状态批）——消化 BOARD #39（985f9b0 操作者
登记,先读全文）「内嵌浏览地址输入无 scheme 时被源站清单拒绝且
错误文案误导」,单拍单一任务**:

- **背景与根因（照 BOARD #39 登记全文消化,用户真机实测撞上）**：
  用户在云端面板输入 booth.pm（无 https:// 前缀）点「打开」——
  openAddress 原样透传,Main 侧 isAllowedRemoteOrigin 对无 scheme
  输入 URL 解析失败→按 origin_not_allowed 拒绝（electron 主进程
  控制台 Error in handler vua:remote-content:open 在案）,渲染层
  catch 复用 acquireCopy.commandErrors.vua_warehouse_unavailable
  呈现「仓库服务尚未接入。」——文案与本错误完全无关,用户据此
  外观判断 #37 未修复;真实情况＝#37 已修（用户同会话的策略拦截
  recaptcha 事件即自动打开视图曾存活的留痕）,失败系输入缺 scheme。
  桌面认账:误导文案系 #36② 修复批引入收窄纪律时顺手复用的仓库
  文案,属呈现缺陷,如实登记消化。
- **修法（登记自决申报两方向照办）**：①输入归一化＝import-model
  纯函数 normalizeBrowseAddress:无 scheme 的裸域名（判据照登记——
  不含 scheme、不以 "/" 开头、含 "."）自动补 https:// 前缀,再经
  URL 解析验证;不可解析输入返回 invalid 不上 Main 本地失败态呈现,
  不猜测。已带 scheme 的输入原样验证不加工（协议裁决归 Main,渲染
  层不越权二次分流）;**Main 侧清单裁决语义不变,归一化只做「用户
  可读地址→可解析 URL」翻译,不放宽任何 Main 判定,Main 零改动**。
  ②失败文案按拒绝原因准确呈现＝EmbeddedBrowseOpenFailure 三分
  （invalid-address 本地解析失败/origin-not-allowed Main 清单外
  拒绝/open-failed 其它失败如实通用）+classifyRemoteOpenError 按
  Main 错误串识别（vua:remote-content:open 对清单外唯一抛
  Error("origin_not_allowed"),Electron invoke reject 的 message
  保留该错误串——可查证的实现事实）;i18n 四语三键
  openInvalidAddress/openOriginNotAllowed/openFailed 照 cycle,
  vua_warehouse_unavailable 误用就此消除。
- **语义保持（照操作者注记勿回退两线）**：#37 代次生命周期模型
  不回退——openAddress 的 capture/isStale 接线逐行不变,invalid
  分支在 capture 前即返回（不捕获代次不发起 open）,自动打开路径
  （BOOTH_HOME_URL 恒带 scheme）经归一化零变化;#38 portal 不回退
  ——导航条 createPortal(document.body) 零触碰,REMOTE_VIEW_NAV_
  STRIP_PX=44 两处对齐零触碰。
- **测试面**：归一化与拒绝分类均为纯函数,import-model.test.ts
  补 4 例 17/17——裸域名补前缀（含用户实测形态 booth.pm 与
  trim/子域路径）、scheme 输入原样透传（含自动打开首页 URL 与
  file: 透传 Main 裁决）、不可解析输入 invalid（localhost/相对
  路径/含空格域名/空 host/空输入,其中 "https://.." 实测可解析
  系 URL 规范行为已从 invalid 例修正为按透传语义理解）、拒绝
  分类（Electron 包装 origin_not_allowed/unknown_remote_view/
  非 Error 值兜底）。组件渲染面无组件测试基础设施（既有边界,
  #37/#38 拍同一边界如实申报）。
- **证据（本机本树 VUA-3,07:3x–07:4x）**：df C 盘余 209G 先查
  （较操作者注记 12G 大幅回升,环境事实照录,定性归环境域）;桌面
  check 全链绿——typecheck 双 tsconfig 0 错误＋vitest 78 文件
  654/654（import-model 17/17）＋build＋boundary OK＋i18n OK
  （四表 parity 含新三键）＋contrast 全达标＋check:leak 155 指纹
  零泄漏＋forest-leak。变更面恰桌面所有权域 7 文件（188+/10-:
  import-model.ts 归一化＋分类纯函数、ImportPage.tsx 接线＋文案
  替换＋JSDoc、import-model.test.ts +4 例、i18n 四表各 +3 键）。
- **环境事实（照操作者注记）**：dev 栈由用户自起运行中（vite
  5173＋electron,无 CDP）,本树全程未触碰;修复入库后用户会话
  vite HMR 直接热应用,用户即时复测——「输入 booth.pm 点打开应
  直接打开;清单外地址（如 google.com）呈现『该来源不在内嵌浏览
  允许清单内』而非『仓库服务尚未接入』」。本拍不代记 #39 闭环,
  闭环候用户复测回填（登记＝操作者）。

## 前情（机械跟随批世代,全文见本文件 git 历史）
09-18 06:3x–06:5x #38 修复批三笔（追平壳 7a0c660＋a31e62f＋
3aac7f7）经第 94 批 1c55153 收编,#37/#38 经操作者 CDP 复验回填
闭环（d0d8c3c）——本拍 #39 系用户真机复测暴露的下一层缺陷
（视图能开、退出可达,但裸域名输入被清单拒绝且文案误导）。
更早批次见 git 历史。

## 本轮交付（985f9b0 基线世代）
- **追平合并壳**（零自有内容,吸收 main 985f9b0:1c55153 #38
  收编＋9e8c8b4 94 批 closure＋d0d8c3c #37/#38 复验回填＋
  985f9b0 #39 登记;inbound 恰 collab 2 文件零代码,零冲突）。
- **修复批 cab76f2**（恰桌面域 7 文件 188+/10-,全链证据在案）。
- **本状态批**（恰本文件,collab-only）。

## 在途/待他角色
- **[等集成] 追平壳＋cab76f2＋本状态批候随轮验收（--no-ff）**：
  实质对象＝修复批 cab76f2（恰桌面 7 文件,自树全链证据在案,
  全量复跑候你方合并门照惯例）＋本状态批（collab-only 免全量）;
  追平壳零自有内容照先例自然收编。
- **[→用户/操作者] #39 HMR 复测回填**：用户会话 vite HMR 热应用
  后即时复测（裸域名直接打开＋清单外拒绝文案准确）,回填后 #39
  闭环;本拍不代记。
- **[→桌面/下一拍] ④′能力面对齐切片专项**（BOARD 0716644 处置
  ②,维持）：三面分叉对齐＋live 形状测试,候下一拍,不与本批混做;
  gateway-router.ts:414＋provider 陈旧行维持现状如实申报。
- **[等用户] 既有项维持**：ready-p2 解锁＋v0.2「缓存数据」标注
  呈现复验（与 #33 同窗）、#25/#27/#28/#29 回填、W25（O-2）。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝修复批 cab76f2（代码恰 7 文件）＋本状态批（恰本
文件）,请集成随轮验收（--no-ff）,写明「#39 修复批」;追平壳零
自有内容随验收自然收编。**提交后读数:领先 3（合并壳 1＋修复 1
＋本状态批 1;实质 1＝修复批）、落后 0（985f9b0 世代）。若下轮
brief 读数落后过 15 线照则自理追平。

## 待命声明（第 6 步,如实）
本轮（2026-09-18 07:3x–07:4x,工作时段,三笔:追平壳＋cab76f2＋
本状态批）：①date 07:30 确认工作时段;brief ①区指向本树留言＝
wt-2 [→桌面] 去桥办结回执（就地消化零动作——去桥条件满足的
收货回执,无桌面待办）,失鲜工作树无;②领任务＝操作者注记最高
优先领 BOARD #39（985f9b0 先读全文）,照办;③执行＝追平
（落后 4 全 collab 簿记纯追平,零冲突,inbound 恰 collab 2 文件
无夹带）→修复 cab76f2（归一化纯函数＋失败三分呈现＋i18n 四语,
登记自决申报两方向照办;Main 零改动;#37 代次模型/#38 portal/
44px 两处对齐均零触碰）→check 全链绿（df 209G 先查;typecheck
双 0＋vitest 78 文件 654/654＋build＋boundary＋i18n＋contrast
＋leak 155 零泄漏＋forest-leak）;④所有权核验＝恰桌面域 7 文件,
其它域零触碰;⑤测试覆盖面如实申报＝纯函数面 4 例新增锁定,
组件渲染面无组件测试基础设施（#37/#38 拍同一边界）,#39 闭环
候用户 HMR 复测回填,本拍不代记;⑥环境事实＝用户自起 dev 栈
（vite 5173＋electron 无 CDP）全程未触碰,修复经 HMR 热应用;
⑦零端到端宣称维持。退出待命,候集成验收本批、用户复测回填、
下一拍④′专项或新指派;在手无半途切片、无未提交改动。

## 留言
- [→集成] **#39 修复批验收请求**：候验收对象＝修复批 cab76f2
  （恰 apps/desktop 桌面所有权域 7 文件 188+/10-——import-model.ts
  新增 normalizeBrowseAddress 纯函数（BOARD #39 登记修法①:无
  scheme 裸域名判据「不含 scheme/不以 / 开头/含 .」补 https://
  后 URL 解析验证,invalid 不上 Main;Main 清单裁决语义不变零
  改动）＋EmbeddedBrowseOpenFailure 三分类型＋classifyRemoteOpenError
  （修法②:按 Main 唯一抛的 origin_not_allowed 错误串识别清单外
  拒绝,其余如实通用）＋ImportPage.tsx openAddress 接线与
  vua_warehouse_unavailable 误用消除（i18n 四语三键照 cycle,
  openInvalidAddress/openOriginNotAllowed/openFailed）＋
  import-model.test.ts +4 例 17/17;#37 代次模型/#38 portal/
  REMOTE_VIEW_NAV_STRIP_PX=44 两处对齐零触碰核验在案）＋本状态批
  （恰本文件,collab-only 免全量）;追平壳 e23440e（merge-base＝
  3aac7f7 领先 0 落后 4 纯追平,零冲突,inbound 恰 collab 2 文件）
  零自有内容随验收自然收编。自树全链证据在案（07:3x–07:4x:
  df 209G 先查;typecheck 双 0＋vitest 78 文件 654/654＋build＋
  boundary＋i18n 四表 parity＋contrast＋leak 155 零泄漏＋
  forest-leak）,全量复跑候你方合并门照惯例。#39 闭环不代记——
  候用户 vite 会话 HMR 即时复测回填（操作者注记载明该路径）。
- （回执不回执：brief ①区 wt-2 [→桌面] 去桥办结回执就地消化
  ——去桥条件满足的收货回执,核心侧对桌面再无动作请求,与 94 批
  wt-main 登记一致;历史留言已消化归档,在途事项以 BOARD 与本
  状态文件当前焦点为准。）
