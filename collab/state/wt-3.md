---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 2543622b
role: 桌面
updated: 2026-09-25
---
## 当前焦点
**第 182 批用户侧 UX 代码反向审查批(2026-09-25 23:0x,夜间工作时段
date 23:02 实测;基线 2543622b 轮首 ff-only 追平,含用户授权开发
cae84388「五项顶栏/侧栏 UX 裁决」经 PR #43 入 main 与文档归并
PR #42,落后 0)＝操作者第 199 拍派定:六座审查流水线未覆盖的用户授
权 UX 代码,本席任第一双审查眼,按五缺陷族审查。审查结论＝族⑤一实
锤缺陷(ResourceMonitor blur 监听 add/remove 引用失配泄漏)域内修复
＋CDP 回归钉(红前必红实证)＋设计标准 v0.7.21 消费五裁决(本席域内
欠账补齐),族①②③④其余审查面如实零发现;全量 TS 门禁亲测全绿;
零 wire/契约面变化;VRAM 采集链真机端到端未宣称。**

- **五族结论(逐面如实登记)**:
  - **族① 诚实律**——ResourceMonitor 三处诚实面核验成立:无宿主
    (window.vua?.system 缺席)整条指示器缺席不渲染占位;VRAM 采集
    null 如实呈现「不可用」词面并退化仅 RAM 读数,绝不猜值;单拍失
    败保留上一帧且 footer 采样时刻随帧冻结(陈旧性由时间戳如实透出)。
    Main 侧 SystemUsageCollector 诚实语义核验:typeperf 退出/错误即
    置 vramUsedBytes=null 再 30s 重生(不拿陈旧读数冒充当前);非
    Windows 不启动采集恒 null;快照 sampledAt 系 RAM 实时读/VRAM 系
    2s 缓存口径与契约注释一致。nav 定点收敛论证核验成立(品牌区恒定
    后 available 不随折叠动作变化,快照纳入 available 不构成自反馈
    环,settle 循环两级梯子 ≤2 步收敛)。NebulaCanvas 删除零悬挂引
    用,useSceneMode 消费方(出厂转盘/指挥台立体核心)在位与「资源
    节约模式管辖重负载展示」词面相符。零假状态。
  - **族② 词面四语**——resourceMonitor 七新键四表齐(en/ja/ko/
    zh-CN diff 实核),saverDescription 四语同步改写;check:i18n＋
    check:i18n-tables 双绿。零缺键。
  - **族③ 回归安全**——cae84388 触碰面 stat 实核为零波及 029-A 配
    方中枢/导入弹窗分流/U19 交棒面(22 文件全在 shell/chrome/词表/
    契约面);契约增员 SystemResourceUsageV1＋readResourceUsage 系
    DesktopSystemApiV1 纯加法,唯一实现方 preload.ts 同提交更新,
    typecheck 双绿为凭。
  - **族④ 边界 1.5.0 对表(TICK v1.7 领取前核对)**——五项 UX 裁决
    (导航两级梯/副标题退役/背景光效退役＋节约模式管辖面/侧栏重塑/
    占用查看器＋1440×900)对八项产品裁决逐条过:裁决面互不相交(八
    裁决在引导/Recipe/分享/来源/BDL/检测/SDK/延期 UI),占用查看器
    诚实框架与第 7 裁决「未执行的检查不显示为通过」同向。零冲突面。
    **但发现相邻欠账:设计标准 v0.7.20 未消费 2026-09-25 五裁决**——
    §10.10 仍载「三级响应梯」、§11 仍载「三 WebGL 场景」、§0 Replace
    仍载「hover 字号回流」全量替换,与已入 main 的实现直接矛盾(验收
    权威与实现打架)。docs/design/ 系本席所有权域,按 0.7.19 用户裁
    决消费先例同批补齐(见发现二)。
  - **族⑤ 焦点/键盘/aria**——指示器 aria-expanded＋具名、弹层
    role=region、双 role=meter 带 valuemin/max/now、Esc/外击/失焦
    关闭、×按钮具名、侧栏 :focus-within 激活(键盘用户获得展开态)
    核验成立。**发现一(实锤,生命周期)＝ResourceMonitor blur 监听
    add/remove 引用失配泄漏,已修**——开态 effect 内
    `addEventListener("blur", () => setOpen(false))` 注册匿名箭头,
    cleanup `removeEventListener("blur", () => setOpen(false))` 传
    另一新箭头:按引用匹配永不生效,每次开合循环泄漏一个常驻 window
    blur 监听(长会话无界累积;行为被掩盖因所有泄漏监听执行同一
    setOpen(false) 无观感差)。与其注释自称对齐的通知弹层先例偏离
    (NotificationPopover 用具名 close 对称移除)。修法＝具名
    onWindowBlur 对称 add/remove,其余路径逐字节保持;零词面、零契
    约面。同族登记不虚构:弹层 window-capture Esc stopPropagation
    会挡住 document-capture 的 modal-layer Esc(弹层开着时 Esc 先关
    弹层)——NotificationPopover 先例同款且第 181 批盘点在案,系弹层
    类既有语义非本提交新引入,维持登记不翻案。
- **发现二(族④相邻,本席域内欠账)＝设计标准 v0.7.21 消费五裁决**——
  §3 梯子改两级(紧凑标签级随副标题一并退役)、默认窗 1440×900、
  §3 增占用查看器段(取高读数/右上详情小窗/VRAM 不可用诚实退化/
  无宿主整条缺席)、§3 侧栏段改渐变玻璃＋idle 小字＋hover/focus-
  within 激活(字号长大型激活,对 §0 Replace「hover 字号回流」替换
  规则作侧栏外壳 scoped 超越注记)、§1/§7 基线辉光退役＋星云场景退
  役(三场景句改两场景＋aurora none＋网格保留＋节约模式管辖重负载
  含全局 backdrop-filter 剥除)、§10.10 验收栏随两级梯、§11 受纳范
  围场景集注记、§12 修订记录 0.7.21 条目。零 wire/契约面;REGISTRY
  行更新系集成簿记(注册表维护方＝集成树),见在途留言。
- **回归钉(真机 DOM smoke,新 smoke:resource-monitor)**——监听泄
  漏真值页面内不可观测(add/remove 调用计数两版本对称,首版钉子经实
  测证伪后弃用),跑具经 CDP DOMDebugger.getEventListeners 读窗口
  blur 监听真实注册数断言开合循环前后零残留:**修复前用 cae84388 原
  组件实测红**(closePaths 泄漏 4＋循环 3＝7,每轮恰＋1,与机制论证
  吻合,跑具 exit 1);**修复后 0/0 绿**。夹具另钉六面:无宿主诚实缺
  席/全词面＋双 meter＋aria/四关闭路径/VRAM 不可用诚实词面/单拍失败
  保留上一帧/首拍即败诚实缺席——**50/50**;证据 JSON 落临时目录。

## 前情(本域链,全文见本文件 git 历史与 BOARD 前录)
第 181 批(09-25 00:0x)＝桌面域自我反向审查批(对象 A–D 五族逐面审
查;一实锤＝CompletedDownloadsPanel 无宿主 loading 永真已修＋smoke
钉 36/36),经集成验收入库(合并尖 2543622b 世代前)。第 180 批＝勘
误＋核对批;第 179 批＝自我反向审查批(三发现)。

## 本轮交付(2543622b 基线世代)
- **实现批＝恰 5 文件全在本席所有权域(apps/desktop＋docs/design)**:
  ResourceMonitor.tsx(具名 blur 处理器对称移除,一处)＋
  scripts/fixtures/resource-monitor-popover.tsx(新)＋
  scripts/smoke-resource-monitor.mjs(新)＋package.json(script 一
  行)＋docs/design/design-standard.md(v0.7.21)。零 crates/
  schemas/ packages/ 触碰(diff 复核空)。
- **门禁读数(如实,全量 TS 门禁亲测)**:typecheck 双 tsconfig exit
  0;vitest **926/926**(99 文件,与 cae84388 基线持平——回归钉在
  smoke 层);smoke:resource-monitor **50/50** 真机 Chromium DOM
  (CDP blur 监听 0/0);smoke:import-dialog **36/36**(基线场景零放
  松);check:boundary OK;check:leak **155 指纹生产构建零泄漏**;
  check:i18n＋check:i18n-tables OK;check:contrast OK;
  check:forest-leak OK;build 非 cargo 段成功。cargo 段照轻负载拍
  纪律免跑(零 crates 触碰 diff 复核为凭;VUA-7/VUA-8 零触碰)。

## 在途/待他角色
- **[等集成] 本拍候验收**,写明「wt-3 第 182 批用户侧 UX 代码反向
  审查批(基线 2543622b)」。重点复核面:①发现一证据链(CDP 实数红
  前 7/绿后 0/0;页面内调用计数钉盲区已如实登记);②发现二设计标准
  消费的裁决忠实性(0.7.21 条目与 cae84388 语义逐条对表)与 REGISTRY
  行更新(注册表现仍载 0.7.19,已落后两版,候集成簿记);③族①②③
  ④零发现登记的采信。
- **[知会 wt-2/核心] 无**——本批零跨域发现;cae84388 契约增员纯加
  法核验通过,无核心域波及。

## 阻塞
- 无阻塞。既有 [需用户] 项(挂死再发取证协作/95MB 重复入库条目清理)
  维持候裁,本批不代决。

## 下次合并意图
**候验收对象＝本拍两笔(实现批＋本状态批),写明「wt-3 第 182 批用户
侧 UX 代码反向审查批(基线 2543622b)」**。实现批恰 5 文件在本席域内
(apps/desktop＋docs/design);状态批系 collab;零契约面变化
(packages/contracts 零触碰);cargo 免跑(轻负载纪律＋域外零触碰
diff 复核)。

## 待命声明(第 6 步,如实)
本轮(2026-09-25 23:0x,夜间工作时段,date 23:02 实测):①轮首
ff-only 追平 main 2543622b(落后 0);跑 pnpm collab:brief,①区
wt-7/wt-8 两条均系知会非阻塞,失鲜工作树无;②按操作者第 199 拍派定
对 cae84388 五项 UX 裁决执行用户侧反向审查:五族逐面实读(证据链见
当前焦点),一实锤生命周期缺陷域内修复＋CDP 回归钉(红前必红实证),
一域内欠账(设计标准未消费五裁决)按 0.7.19 先例同批补齐,其余如实
零发现;③全量 TS 门禁亲测全绿(读数见门禁节),cargo 免跑如实申报,
VRAM 采集链真机端到端未宣称(夹具仅合成宿主验证渲染器面);④状态
批＋提交＋验收请求留言。在手无半途切片、除本批外无未提交改动。完成
后推送并退出待命,候集成验收本拍两笔。

## 留言
- [→集成] 验收请求:**候验收对象＝本拍两笔,写明「wt-3 第 182 批用户
  侧 UX 代码反向审查批(基线 2543622b)」**,重点复核面见「在途/待他
  角色」。顺手项:docs/REGISTRY.md 的 design-standard 行现仍载 0.7.19
  (文档实头 0.7.21),候簿记更新两版。
- (回执不回执:在途事项以 BOARD 与本状态文件当前焦点为准。)
