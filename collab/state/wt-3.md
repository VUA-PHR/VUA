---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 7f4c05e
role: 桌面
updated: 2026-09-19
---
## 当前焦点
**[→桌面] 026 A1 移除写面消费切片（2026-09-19 01:5x–02:2x,工作时段;
切片批 faed1bd＋追平壳＋本状态批）——previewRemove 确认链消费＋
applyRemove 任务面接入＋blocks.changes 翻转＋错误码四语文案,C 面
易用性自决随批申报**：

- **领取依据**：brief 01:57 ①区 wt-2「A1 接线已落＋A5 启动裁定已落
  （双知会）」——本树上拍形状核可（692f83e,「接线＋形状核可」桌面
  侧条件）＋核心接线批 41503a4 落地（wt-2 分支,拍时未合 main）＝两
  解锁条件成就;本树在途「[等桌面=本席下拍候选] A1 消费切片」最高
  优先领取;第 100 批（7f4c05e）拍内入库正式解锁（接线批 9082d81
  验收＋BOARD #40「next = desktop A1 consumption slice (unlocked)」
  ）——与领取判断互证;[需用户] 区零桌面条目不代决;失鲜工作树无。
- **切片批 faed1bd（恰桌面域 14 文件＋contracts TS 面 2 文件,1465+
  /44-,全链定向证据亲测绿在案）**：
  ①**contracts TS 面（桌面登记职责）**：desktop-gateway.ts 登记两
  方法——PackagesPreviewRemoveRequestV1（query 双键闭集）＋
  PackagesApplyRemoveRequestV1（command 三键闭集必携
  confirmedDigest;commandId 由 Kernel 生成照 import-copy 先例,无
  params 位）＋union＋METHOD_KINDS 两行＋isDesktopGatewayRequestV1
  守卫两 case（packageIds 非空唯一闭列＝冻结 Schema minItems 1＋
  uniqueItems 口径;**preview 携 digest 位＝形状违反**——冻结词面
  「digest 是 preview 的产物,携即违反」;apply 缺 digest/投机
  commandId 位拒绝）——词面零变更,Schema/向量/A1 段零触碰。
  ②**路由**：gateway-router.ts 两臂 verbatim（preview query 透传;
  apply command ＋ rmv- 前缀 Kernel 生成 commandId）。
  ③**端口**：packages-port.ts re-export 冻结 A1 类型（@vua/contracts
  词面权威）＋PackagesPort 增 previewRemove/applyRemove（apply 结果
  四态：receipt/rejected/failed typed 码/unavailable）＋**blocks.
  changes 类型级 false→boolean**,权威事实源＝served_capabilities 的
  packages.removeOps 能力行（false＝行缺席或不可用,写入口不渲染,
  渲染层不伪造）;026 核可节指出的「P3 词面落地前」过时措辞随批更新。
  ④**live**：packages-live.ts 读 removeOps 行（readCapabilityRows 四
  行）＋plan 九键/receipt 六键/rejected 五键闭集窄化校验（族常量
  vua.packages-ops/v0.1 盖戳;kind=plan 锁;rejected code 锁
  vua.packages. 族——013 复用码永不入 rejected 文档;version/reason
  可空＝端口 Option 逐字投影）＋applyRemove 任务化消费照 014/020 先
  例（受理窄化→waitForTerminalTask〔自 project-ops-port 导出单一实
  现防两端口任务语义漂移〕→Done payload 窄化;守卫拒绝系 Done 载荷
  非错误;非成功终态 error.code 原词上呈;超时/断连＝诚实 unavailable
  绝不伪造收据）;empty-gateway/fixture-gateway/fixture-packages 恒
  缺席臂补齐（模拟面永不模拟 wire 写回执）。
  ⑤**UI**：RemoveConfirmDialog 新组件（A1 词面专用,与 fixture 泛型
  ChangesDialog 分立互不污染——items kind 分组/version/reason 可空
  投影/conflicts 自由文本警示条/legacy 文件目录清单/destructive 走
  DelayedButton 1s〔ADR-0006,权威判定在服务端〕/receipt 终态内联呈
  现审计三半面〔digest 回显＋requestedPackageIds＋removedItems〕/
  rejected 终态 guard 文案＋服务端 detail 原词＋preview_drift 重预
  览引导〔recoverable 冲突绝不静默覆盖〕）;PackagesPage P1/P2 分支
  blocks.changes 门控行内移除入口;P1/P2 notice 增 changesOpen 变体
  （能力面不撒谎——「变更与写入口仍未开放」文案随 removeOps 行翻转）。
  ⑥**i18n 四语**：packages.remove 段（guards 三码＋unknown 回落/
  envelopeErrors 申报复用码 projectNotFound/packageNotFound/
  capabilityMissing/invalidParams＋unknown/toasts）＋p1/p2
  noticeChangesOpen——「vua.packages.* 三码与复用码四语文案」交付。
- **C 面自决申报（026「易用性清单桌面自决随消费切片落地申报」条款
  ）**：①首面移除入口＝行内单包移除（P1InstalledTable 简表无多选基
  建,批量多选不入本切片,词面 packageIds 数组为 A2/A5 批量面预留）;
  ②审计呈现＝确认对话框内 receipt 终态（三半面最小诚实形状）;
  ③rejected 呈现对话框内联（preview_drift 可恢复冲突引导就地可见）;
  ④空 plan（items 空）＝toast 如实不弹空对话框;⑤任务九态过程呈现
  归任务中心（014 先例——端口只消费终态）,applying 期对话框 busy
  态＋任务中心指引文案。
- **开工时序如实申报**：开工时 main＝c5edb76 落后 0;切片开发期间集
  成第 100 批（7f4c05e）抢先入库（恰 collab 面＋wt-2 接线批＋三树收
  编,与本切片桌面域 14＋contracts 2 文件零交集）;切片批先提交
  （faed1bd 基于自身开发基线,消息如实载明）,后合并 main 7f4c05e（
  双法预检零冲突,inbound＝核心接线批 5 文件＋collab 登记面纯吸收）
  ——接线批与消费批在合并树会合,词面/路由/消费三层全链同树成立。
- **合并树定向复跑（02:2x 本机亲测）**：contracts check 70/70;
  packages-live＋gateway-router 定向 54/54;desktop typecheck 双 0。

## 前情（7f4c05e 世代,全文见本文件 git 历史）
09-19 01:0x–01:4x ④′ 能力面对齐切片＋A1 TS 面形状核可四笔经第 100
批验收（95da3cd/9082d81/7f4c05e）;09-19 00:1x–00:3x 026 A5 入口需
求落节三笔经第 99 批收编;09-18 23:0x–23:2x 026 B 面切片四笔经第 97
批 2151409 验收入库。更早见 git 历史。

## 本轮交付（7f4c05e 基线世代）
- **切片批 faed1bd**（恰桌面域 14 文件＋contracts TS 面 2 文件;
  1465+/44-;全链定向证据亲测绿在案）。
- **追平壳**（开工前合并纪律;切片开发期间 main 前移,切片批提交后
  合并第 100 批,零冲突纯吸收）。
- **本状态批**（恰本文件）。

## 在途/待他角色
- **[等集成] 本拍候随轮验收（--no-ff）**：实质对象＝A1 消费切片批
  （桌面域 14＋contracts 注记登记 2）;全链证据亲测（01:5x–02:2x df
  C 盘余 631G/67% 先查;@vua/contracts check 70/70〔68→70〕;desktop
  check 全链绿 exit 0：typecheck 双 0＋vitest 80 文件 687/687〔＋14
  A1 钉死：live 8＋router 3＋model 3〕＋build＋boundary＋i18n
  parity＋contrast＋check:leak 155 指纹零泄漏＋forest-leak）;追平壳
  与本状态批 collab-only/纯吸收。
- **[等核心→等集成] 026 A2 形状核可候办**：核心已落 A2 冻结批
  （wt-2 [→桌面] 知会：previewInstall/applyInstall v0.2 词面,版本
  选择语义 null＝解析器最新稳定版/string＝钉死精确版本,无 upgrade
  动词;installReceipt 与 removeReceipt 键集互斥）候你方形状核可
  ——**时序照 A1 先例＝候 A2 冻结批经集成验收入 main 后,基于收编
  世代办理**（核可权威基础＝收编世代的冻结件;不在候验收分支世代
  上预核可）;capturedAt 实证回执消化（核心已证 A2 三成员无
  capturedAt,本席收窄无需追加改动）;v0.1/v0.2 plan 同键集,消费窄
  化按 schemaVersion 字面量——A2 消费切片候形状核可＋A2 接线批。
- **[等核心] 026 后续**：A5 裁定已落（8afde3f,启动成立时机殿后）
  ——A5 冻结批候面序到位,桌面消费殿后。
- **[等环境] A1 实现核对切片**（024/025 程序;接线批已解锁）——完
  整端口码投影映射申报后,桌面 envelopeErrors 词外码回落面随之对齐
  （unknown 原词插值呈现在案,不猜测不阻塞）。
- **[→用户] IA 并入复测**（维持）：包管理器页尾「项目兼容」分区可
  见可用/侧栏「项目兼容」页消失/导入源选择器在册项目可走;本拍后
  dev 栈复测可顺带目视：包管理器页已装包表在 removeOps 能力行可用
  时出现「操作」列与行内「移除」入口（引擎后端未声明 remove_packages
  能力时入口不出现＝诚实缺席,非缺陷）;移除确认链真机全链走查归
  W25（O-2 候用户开窗）。
- **[等用户] 既有项维持**：#39 HMR 三复测点、#36 操作者 CDP 复验、
  ready-p2 解锁＋v0.2「缓存数据」标注复验、#25/#27/#28/#29 回填、
  W25（O-2）。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝A1 消费切片批 faed1bd（实质 diff 恰桌面域 14 文件＋
contracts TS 面 2 文件,全链亲测绿在案＋合并树定向复跑绿）＋追平壳
＋本状态批,请集成随轮验收（--no-ff）,写明「026 A1 消费切片」;**提
交后读数：领先 3（切片 1＋追平壳 1＋本状态批 1;实质 1）;落后读数下
轮 brief 复测,过 15 线照则自理追平。

## 待命声明（第 6 步,如实）
本轮（2026-09-19 01:5x–02:2x,工作时段,三笔：切片批 faed1bd＋追平壳
＋本状态批）：①date 01:57 确认工作时段;brief ①区 wt-2 双知会消化
（接线＋形状核可两解锁条件成就＝A1 消费切片解锁;A5 裁定已落桌面消
费殿后）,失鲜工作树无;②任务领取＝本树在途「A1 消费切片」最高优先
（第 100 批 7f4c05e 拍内入库正式解锁,与领取判断互证）;[需用户] 区
零桌面条目不代决;③执行＝contracts TS 面登记（守卫负例钉死含
preview 无 digest 位）→路由两臂→端口 A1 类型＋blocks.changes 翻转
→live 窄化＋任务化消费（waitForTerminalTask 导出复用）→恒缺席臂
三处补齐→RemoveConfirmDialog＋PackagesPage 门控接线→i18n 四语→测
试 14 例钉死→全链亲测→切片批提交→合并 main 7f4c05e（拍内前移,零
冲突）→合并树定向复跑绿;④所有权核验＝自有编辑恰桌面域 14 文件＋
contracts TS 面 2 文件（桌面登记职责）＋collab 1 文件（本文件）,
零跨域触碰（wire 面/协议本 0.1.1/REGISTRY 仅读取 inbound）;⑤证据＝
df 631G/67% 先查;contracts 70/70;desktop check 全链 exit 0（typecheck
双 0＋vitest 80/687〔＋14〕＋build＋boundary＋i18n＋contrast＋leak
155 零＋forest-leak）;合并树定向复跑（contracts＋54/54＋typecheck）
02:2x 亲测;⑥诚实边界＝首面单包移除如实申报（无批量）;零端到端宣
称维持——live 链路在 provider 进程内由核心 wire 测试 10/10 覆盖,桌
面测试骑 fake wire 帧,真机走查归 W25;blocks.changes 翻转后入口可
见性随引擎 remove_packages 能力声明（未声明即不出现＝诚实缺席）;
退出待命,候集成验收、核心 A2 冻结批、环境实现核对、用户复测回填、
下轮 brief 或新指派;在手无半途切片、无未提交改动。

## 留言
- [→集成] **验收请求**：候验收对象＝026 A1 消费切片批 faed1bd
  （恰桌面域 14 文件＋contracts TS 面 2 文件——desktop-gateway 登
  记两方法＋守卫负例/路由两臂 rmv- commandId/packages-port A1 类型
  ＋blocks.changes→removeOps 行事实源/packages-live 闭集窄化＋任务
  化消费/RemoveConfirmDialog＋PackagesPage 门控接线/i18n 四语错误
  文案;全链亲测绿 01:5x–02:2x：df 631G 先查＋contracts 70/70＋
  desktop check 全链 exit 0 含 vitest 687/687〔＋14 例〕＋合并树定
  向复跑绿）＋追平壳（切片期间 main 前移第 100 批,切片批提交后合
  并,零冲突纯吸收）＋本状态批。C 面自决申报见本文件当前焦点节。
- [→核心] **A1 消费切片已落（候验收）,两项知会**：①消费侧照冻结
  词面逐项落地（preview 无 digest 位在信封守卫即拒＝词面「携即形
  状违反」钉死;commandId Kernel 生成照 import-copy 先例无 params
  位——你方接线 rmv- 受理面已对齐）;②blocks.changes 已按第 3 条逐
  面升级翻转（事实源＝removeOps 行）,桌面写入口随引擎 remove_packages
  能力声明呈现——「接线＋形状核可＋消费切片」三件齐,026 A1 面（词
  面→接线→消费）桌面侧闭环;A2 冻结批 TS 面定向证据建议（desktop
  typecheck 纳入）维持 026 核可节申报,随批配合。
- [→环境] **实现核对切片互动点**：你方完整端口码投影映射申报后,桌
  面 envelopeErrors 词外码回落面（unknown 原词插值,不猜测）随映射
  对齐——已知映射（package_not_installed→vua.packages.package_
  not_found〔信封面〕/preview_drift〔rejected〕/execution_failed
  折叠携原码 detail）桌面文案已在册四语。
- （回执不回执：wt-2「A1 接线已落＋A5 启动裁定已落双知会」——本拍
  消费切片即回应;A5 裁定四点消化,桌面消费殿后照办;wt-2 拍后新留言
  「A2 冻结批已落＋capturedAt 实证回执」——02:2x 消化,形状核可候
  A2 冻结批入库照 A1 先例办理（见在途段）,capturedAt 无需追加改动
  收讫;wt-main 第 99/100 批留言消化——A5 入口需求收编知会、④′ 验
  收与 typecheck 建议采纳知会、C 面逐面解锁条款本拍首面执行;历史留
  言已消化归档,在途事项以 BOARD 与本状态文件当前焦点为准。）
