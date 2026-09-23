---
worktree: wt-main（本批簿记组装于 VUA-9 集成树，分支 integration/batch-184）
branch: integration/batch-184（本批载体；正典 main 维持 origin/main 只快进）
role: 集成
baseline_commit: d5369061
updated: 2026-09-23
---
## 当前焦点
**集成第 184 批（2026-09-23 23:0x 起，节拍轮正常工作时段 date 23:01 实测；基线
origin/main d5369061＝第 183 批 PR #15 合并尖）＝用户 W25 走查第一步五发现修复
栈双批验收：wt-3 第 177 批（W25 走查第一缺陷修复批：顶栏 fonts.ready＋导入入口
本地/云端分流＋BOOTH 登录态线索面 signInHint＋dev.mjs VUA_ELECTRON_ARGS 取证
透传＋登录页路径勘误）＋第 178 批（受理态自动关闭批：受理态 1.5s 自动关＋失败
态驻留醒目可关＋Esc/背板/× 三路径 smoke 25/25）＋W25 走查进行中 BOARD 登记
（新节「W25 用户走查发现与处置」；挂死项维持开放候再现）＋合并树定向复跑四闸
全绿**。全部走 PROTECTED_MAIN 政策通道（本分支 PR 落地、正典 main 只快进）。
轻负载拍纪律兑现：用户开发栈在跑，四闸顺序跑未并行、未触 cargo。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 183 批（09-23 04:1x–05:1x）＝wt-4 第 182 批验收（#45(3) S2 取消观察位实现
切片，端口词面零变更，(3) 全项清零）＋合并树定向复跑三闸全绿，经
integration/batch-183 PR #15 入库 d5369061。更早段落见本文件 git 历史与 BOARD
前录。

## 本轮交付（d5369061 基线，integration/batch-184）
- **验收合并＝wt-3 第 177＋178 批六笔**（追平壳 105341b2＋实现批 2b9f83d2＋
  状态批 77cc8626＋勘误批 e37a28e0＋实现批 d55bf7b2＋状态批 adf9a670；
  merge-base 恰 d5369061＝落后 0／领先 6（实质 3）；新式 merge-tree
  --write-tree 预检干净；合并 dc3778ef 合并信息十三点全载，集成直读实核）：
  ①**追平壳纯吸收**——`git diff d5369061 105341b2` 逐字节为空。
  ②**改动面逐笔核对**——实现批 2b9f83d2 恰 14 文件（apps/desktop 13＋
  packages/contracts TS face 1）；状态批 77cc8626/adf9a670 各恰 1 文件；勘误
  批 e37a28e0 恰 3 文件（登录页路径源码修正＋测试＋状态批同步）；实现批
  d55bf7b2 恰 13 文件全在 apps/desktop。全范围 crates/ docs/ schemas/ 零触碰。
  ③**Cookie 隐私面成立**——signInHint 三层（remote-content/main/preload）只
  返 stored/none/unknown 三态存在性线索，Cookie 值零读取零传输；异常如实
  unknown 不猜测；IPC 有 assertLocalSender 护栏；契约注释同文自证「Cookie 值
  永不过本面」；会话 Cookie 键名无公开文档不作键名猜测。
  ④**登录导航证据在案**——勘误批以真机实测为准（/sign_in 404、/users/sign_in
  200＝HTTP HEAD -L）；initialBrowseUrl 纯函数 none→登录页、stored/unknown→
  主页（unknown 不冒充已检测）；allowedOrigins 扩 accounts.booth.pm 仅内嵌浏
  览清单，下载域/本地窗口弹窗清单不动。
  ⑤**fonts.ready 修法与 #28 抖动快照机制共存成立**——首判与 ResizeObserver
  挂载同移 document.fonts.ready 之后（就绪时零等待），#28 输入快照机制本体
  （App.tsx:774–784）零触碰；不可用环境诚实降级原时序。
  ⑥**dev.mjs VUA_ELECTRON_ARGS** 显式取证透传不默认开启（CDP 取证护栏）。
  ⑦**本地/云端入口分流**（用户裁决 2026-09-23）——弹窗先选来源再进段，云端段
  只在显式选择后激活，重开回选择态（诚实起点）。
  ⑧**受理态 1.5s 自动关闭**——import-model 纯件
  IMPORT_ACCEPTED_AUTO_CLOSE_MS=1500＋createAutoCloseTimer（schedule 单次触
  发自清/cancel 幂等/重入先清旧柄）；本地段与云端采纳段计数器驱动接线（acceptedTick
  重受理重新计时；失败反馈在场即取消在飞计时＝失败驻留不静默关走；卸载清理防
  陈旧定时器误关；onRequestClose 经 ref 读取宿主重渲染不重排定时器；缺省宿主
  诚实降级无自动关闭）。
  ⑨**失败态醒目可关**——三型反馈建模（accepted/failure/notice），失败
  role=alert 驻留＋failureDetailText 按 failureLogText 律保留协议稳定码＋
  primary 主按钮「关闭」主动线，× 仅辅助；模态层（modal-layer/ContentDialog）
  机制零触碰，onRequestClose 仅宿主关闭请求线。
  ⑩**smoke 双套证据在案**（wt-3 本树亲测）——import-dialog 新 smoke 真机
  Chromium DOM 25/25（Esc/背板/× 三路径各恰一次关闭请求＋受理自动关＋失败驻
  留＋重开不被陈旧定时器误关；证据
  C:/Users/AR/AppData/Local/Temp/vua-import-dialog-dom.json 2026-09-23 10:10
  Chromium 152.0.7977.65）；production-review 夹具适配第 177 批来源分流（先选
  云端再钉原断言＋signInHint 桩）97/97，断言语义零放松（集成 diff 实读确认）。
  ⑪**i18n 四语键齐**——集成逐语 grep en/ja/ko/zh-CN 各 1（acceptedAutoClose
  ＋选择面五键）。
  ⑫**零契约面变化申报成立**——第 178 批 packages/contracts 零触碰（wire 零新
  增载荷）；第 177 批契约面仅 TS face 登记 signInHint（桌面所有权内）。
  ⑬**勘误与诚实边界**——adf9a670 两处勘误兑现（v4 逐名清单漏
  validate_asset_paths＝读面实为 8＋写 6＋任务 2＝16 与闭集一致；amf-unity 版
  本词两表＝现行文档头部 1.2.1 为准，REGISTRY 行 1.2.0 系 patch 漂移容忍）系
  留痕订正历史文件不改写（同第 183 批⑦先例）；零端到端宣称维持（smoke 系真
  实 Chromium DOM＋合成 Gateway 非真机 Gateway 全链，真机走查归用户 W25 行
  使）；[需用户] 条目零代决。
- **W25 走查进行中 BOARD 登记**——新节「W25 用户走查发现与处置」（五发现
  ①顶栏②入口分流③b 登录引导已修随本批入库；③挂死滞留根因已修而挂死项维持
  开放候再现〔交付栈 CDP 51993 常驻〕；④多层目录扫描/压缩包提取/PSD 记录用
  户明令只登记候裁决；[需用户] 两件随节登记＝挂死再发取证协作＋误伤事故 95MB
  重复入库条目清理候裁）。
- **BOARD 前录轮转**（插 184 段轮出 164 段，10 段维持）＋本状态批。

## 门禁读数（如实）
合并树定向复跑四闸集成亲测全绿（照派单；contracts dist 按陈旧事故先例先重建）：
typecheck 双 tsconfig **exit 0**＋vitest **97 文件 911/911**（908 基线＋恰 3
新例＝createAutoCloseTimer 生命周期，申报自洽）＋check:i18n **交付语言表对齐
OK**＋check:leak **155 指纹零泄漏**（独立临时生产构建；chunk 尺寸警告系既有
非错误提示）。cargo 免跑（crates/ 零触碰全范围复核）。磁盘 74%（df 实测，与
派单登载 ~73% 口径一致）。环境事实：用户开发栈在跑，四闸顺序跑未并行。

## 在途/待他角色
- **[候用户] W25 真机走查推进（O-2，进行中）**——M5 唯一候项；五发现登记见
  BOARD 新节；[需用户] 三件＝挂死再发取证协作（保持现场＋CDP 51993 取栈）、
  误伤事故 95MB 重复入库条目清理候裁、④多层目录扫描候裁决与派发。等用户项无
  绕行机制。
- **[知会] 各席验收请求世代核对（本批复核）**——brief ①区 wt-2/wt-4/wt-5
  残言经分叉表复证领先 0 系世代滞后（slot/wt-2 领先 0、slot/wt-4 领先 0、
  slot/wt-5 领先 0），零重复验收；wt-7 残言系既录裁决知会（文档切片无实现派
  单）、wt-8 已验收销账；slot/wt-3 经本批验收后领先 0。
- **[知会 wt-8] production-review 夹具适配**（先选云端再钉原断言＋signInHint
  桩，97/97 断言零放松）已随本批入库。
- VUA-7：零触碰维持，阅读解禁；VUA-8 零触碰维持。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
本批随 integration/batch-184 → main 的 PR 落地（PROTECTED_MAIN 政策）；合并
后正典 main fetch＋快进，集成分支不删。

## 待命声明（第 6 步，如实）
本轮（2026-09-23 23:01 正常时段实测）：①读 collab/PROTECTED_MAIN.md 后跑
pnpm collab:brief，①区判读＝wt-3 验收请求（第 177/178 批两栈六笔）在操作者
第 178 批派发范围内，wt-2/wt-4/wt-5 残言经分叉表复证领先 0 系世代滞后，失鲜
工作树无；②origin/main d5369061 与本地一致零分叉；slot/wt-3 六笔构成实核
（追平壳 diff 空＋两实现批恰 14/13 文件＋两状态批各恰 1 文件＋勘误批恰 3 文
件）＋源码 diff 全文实读（remote-content/main/preload 隐私三层、App.tsx
fonts.ready 与 #28 共存、ImportPage 三型反馈与计时接线、WarehousePage 关闭
请求线、production-review 夹具适配零放松）＋i18n 四语逐语 grep；③VUA-9 自
origin/main d5369061 建 integration/batch-184，merge-tree 预检干净后 --no-ff
合并 adf9a670（dc3778ef，合并信息十三点全载）；④合并树定向复跑四闸（typecheck
＋vitest 911/911＋check:i18n＋check:leak 155 零）全绿；cargo 免跑如实申报
（crates/ 零触碰）；⑤BOARD 新节「W25 用户走查发现与处置」＋前录轮转（插 184
轮出 164，10 段维持）＋本状态批；⑥零自有产品代码（本批集成自有内容＝合并信
息＋collab 两文件）；产品版本不动、不代跑 W25、历史记录零删除（164 段轮转依
既有轮转纪律，全文在 git 历史）；⑦VUA-7 零触碰（未动树、阅读解禁）、VUA-8
零触碰；`?? _local_p27_devlog.txt`（主树）照例不触碰；轻负载拍纪律兑现＝四闸
顺序跑未并行未触 cargo、未触用户开发栈进程；⑧[需用户] 条目零代决（挂死再发
取证、95MB 条目清理、④多层目录候裁决均维持候用户）。在手无半途切片、除本状
态批外无未提交改动。

## 留言
- [→桌面/wt-3]（验收回执）：第 177＋178 批六笔（105341b2＋2b9f83d2＋77cc8626
  ＋e37a28e0＋d55bf7b2＋adf9a670）已随集成第 184 批验收入库，重点复核面五项
  逐项成立——①受理自动关闭 1500ms 与失败驻留取消计时语义面（纯件生命周期三
  性质＋计数器驱动＋失败在场取消在飞计时实读吻合）；②onRequestClose 关闭请
  求线不动 ContentDialog/模态层机制本体（零触碰复核维持）；③失败详情词面
  failureLogText 律（failureDetailText 稳定码随词面）；④production-review
  夹具适配零断言放松（先选云端再钉原断言＋signInHint 桩，diff 实读）；⑤i18n
  四语键齐（逐语 grep 实测）。另：Cookie 隐私面（零 Cookie 值过 IPC）与
  fonts.ready/#28 共存成立；两处勘误兑现随批留痕认许（历史文件不改写先例）。
  门禁读数：合并树 typecheck 0 错＋vitest 911/911＋i18n OK＋leak 155 零（与
  申报一致）。第 177 批 [需用户] 挂死再发取证协作与 95MB 重复条目清理候裁已
  折入 BOARD 新节随批登记。
- （回执不回执：本批为验收批，各席照纪律执行即可，无需逐一回执。）
