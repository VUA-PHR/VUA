---
worktree: wt-main（本批簿记组装于 VUA-9 集成树，分支 integration/batch-200b）
branch: integration/batch-200b（本批簿记载体；正典 main 维持 origin/main 只快进）
role: 集成
baseline_commit: eec3473d
updated: 2026-09-26
---
## 当前焦点
**集成第 200 批（2026-09-25 23:5x 起跨零点，date 00:13 实测；响应操作者第 200
拍「wt-3 桌面域反向审查批单栈验收」）＝验收执行后【退回】轮：wt-3 第 182 批
用户侧 UX 代码反向审查批（实现批 9a100cf8＋状态批 c656fbe6，基线 2543622b，
slot/wt-3 领先 2 与分叉表吻合）经派单四项验收重点逐项亲测——泄漏修复引用对
称性成立、CDP 钉「修复前必红」实证成立（集成合并树回摆 cae84388 原组件两次
复现红：循环前 4→循环后 7，与申报数字一致）、v0.7.21 五裁决对表成立、
REGISTRY 行簿记已备——但新跑具 smoke:resource-monitor **失败路径实测 exit 0**
（三次取证：管道/tail 遮蔽排除后直跑 electron 二进制同 0＋注入诊断定位根因）
且申报「跑具 exit 1」失实、证据「50/50」系 results 数组复用把 base 21 条断言
双计（唯一断言 29＝21 行为＋1 CDP＋7 失败面）——**验收不通过退回 wt-3 修复
后再验收**（不降标：不把已证伪的证据声明合入 main）；候选组装保留于
integration/batch-200（merge f90b5ea5＋REGISTRY 5e18dfc8，已推送、未开 PR），
修复批到齐后重组装落地。**

## 本轮交付（eec3473d 基线＝PR #47 合并尖；候选分支＋本簿记恰 collab/ 两文件）
- **①泄漏修复引用对称性成立（派单重点①）**：具名 onWindowBlur 定义于
  effect 内、addEventListener/removeEventListener 同引用对称（diff 实读恰
  +4/-2：注释三行＋const 一行，add/remove 两行改写）；onPointerDown/
  onKeyDown 既有具名面零触碰＝「其余路径逐字节保持」属实；NotificationPopover
  先例（:88/:93 blur close 具名对称）实读吻合其自称对齐；effect 依赖 [open]
  与开态守卫未变。
- **②CDP 钉「修复前必红」实证成立＋跑具失败路径缺陷实锤（派单重点②）**：
  跑具经 webContents.debugger DOMDebugger.getEventListeners 取窗口 blur 真实
  注册数、断言开合循环前后相等、头部注释如实登记「调用计数对引用失配失明」
  教训＝钉本体真实；绿轮亲测 CDP 0/0 exit 0（真机 Electron Chromium
  152.0.7977.65，独立随机端口未触用户交付栈）；回摆 cae84388 组件红轮恰红
  **两次复现（4→7，每轮恰＋1，与申报一致）**＝「红前必红」实证在案。**但**
  失败臂 `console.error → window?.destroy() → await server?.close() →
  app.exit(1)` 实测永不到达 app.exit(1)——注入诊断（临时 Edit 验后恢复零残
  留）显示 `await server?.close()` 在 window.destroy 后既不 resolve 也不
  reject，事件循环排空进程零码退出；直跑 electron 二进制三次 exit 全 0。
  **后果＝回归钉失败时不以非零码退出（pnpm/electron 包装下判绿）**，作为
  自动化守卫失效（CI 现不跑 smoke 家族＝本地门禁面，但集成/各座门禁读数以
  exit 码为准即踩陷阱）；红轮不写证据 JSON＝临时目录残留上一轮绿 JSON 引用
  陷阱一并登记。wt-3 申报「跑具 exit 1」系失实申报（其红前数字本身真实）。
- **③证据计数「50/50」双计实锤（派单重点②附带）**：夹具 results 数组被
  base() 与 failureFaces() 两次返回（同一引用），evidence JSON checks 23–43
  号系 1–21 号的重复计入；执行各仅一次、断言零弱化、红绿判定不受影响，但
  「50」系计数口径伪影，唯一断言＝29。提交信息与状态批均已载「50/50」＝
  随退回一并勘误。
- **④v0.7.21 五裁决逐项对表成立（派单重点③）**：梯子两级（紧凑标签级随
  品牌副题退役，§3＋§10.10＋§12）／占用查看器段（Settings 左读数 RAM/VRAM
  取高＋右上详情小窗＋VRAM 不可用诚实退化＋无宿主整条缺席，§3）／侧栏渐变
  玻璃＋idle 小字＋hover/focus-within 激活且 §0 Replace「hover 字号回流」
  加侧栏外壳 scoped 超越注记（§0/§3）／基线辉光退役＋星云场景退役＋aurora
  none＋网格保留＋省电模式管辖重负载含全局 backdrop-filter 剥除（§0 Retain/
  §1/§7/§11）／品牌副题退役（§12 具名）——与 cae84388 语义逐项相符；文档
  单语化合规（docs/design 仅 design-standard.md）。两非阻塞观察见在途节。
- **⑤REGISTRY 行簿记已备（派单重点④顺手项）**：design-standard 行
  0.7.19→0.7.21（0.7.21 摘要前置＋0.7.19 降历史＋日期 2026-09-25），提交
  5e18dfc8 于 integration/batch-200 随候选分支待落地（未开 PR）。
- **⑥①区消化**：wt-3 验收请求＝本批执行后退回（见上）；wt-2/wt-4/wt-5 验
  收请求经分叉表复证 slot 领先全 0（9/54/47 落后纯系簿记尖）＝代际残留零待
  办；wt-6 无请求领先 0；wt-7（1.5.0 迁移知会）与 wt-8（06ec6390 验收知会）
  系知会非阻塞；失鲜工作树无。
- **⑦环境事实**：主树 fetch＋rev-parse 核对 origin/main＝本地 main＝
  eec3473d 零分叉；VUA-7 零触碰（阅读解禁）、VUA-8 零触碰（分叉表读数）；
  用户交付栈（vite 5173＋electron CDP 51993）未触、未杀 node/electron
  （smoke 用自起 Electron 实例随机端口）；主树两既有未跟踪件照例不触碰。

## 门禁读数（如实，合并树 VUA-9 亲测 00:0x–00:1x 顺序跑未并行）
typecheck 双 tsconfig exit 0；vitest **101 文件 943/943**（main 侧 PR #45 后
基线：926→943/99→101 文件系 folder-picker/import-model/contract-projection
新例，wt-3 零新增纯件自洽零回归）；smoke:resource-monitor 绿轮 **CDP blur
0/0** exit 0；突变红轮恰红 4→7 两次；cargo 免跑照轻负载纪律（crates/
schemas/ packages/ .github/ 对 origin/main 零 diff 实核）。注入诊断两处均
checkout 恢复、工作树实核净＝零突变残留。

## 在途/待他角色
- **[等桌面/wt-3] 第 182 批修复再验收（退回，must-fix 两项）**：①跑具失败
  路径非零退出——app.exit(1) 提前于/独立于 server.close（如 catch 首行
  app.exit(1)，或 finally 按 check 结果收口），修后红轮自证 exit≠0 并随批
  登记；②下一状态批勘误「exit 1」与「50/50」两申报（实况＝唯一断言 29、
  失败路径 exit 0）。建议同批顺手（裁量非强制）＝红轮也落证据 JSON
  （passed:0＋失败名，消除绿 JSON 残留引用陷阱）＋ results 数组双计收敛。
- **[登记不扩批·桌面座酌情] smoke 家族 exit 模式**：同款
  「destroy→await close→app.exit」模式实核见 smoke-import-dialog（:34/:36）
  等其余 6 个 smoke 文件（家族特徵推定同、未逐一实测）——候桌面座后续批量
  硬化候选，不折入第 182 批修复面。
- **[登记不代改·候桌面座或用户裁决] v0.7.21 两非阻塞观察**：①默认窗
  1440×900 仅载 §12 条目行、§3 正文无窗体尺寸语句（0.7.20 正文本无窗体尺
  寸语句实核；治理 2.2 裁剪最近 10 条后该事实会随历史轮出——候落正文）；
  ②「两 WebGL 场景」句已再现文档-实现漂移——main 侧 PR #45 已删 holo-core
  .ts 且 HoloCoreCanvas 零消费方实核（scenes/ 仅存 pedestal.ts），非本批引
  入（v0.7.21 系对 2543622b 世代五裁决的忠实消费），系用户侧 PR #45 范围扩
  展（删指挥台）带来的新世代面。
- 维持：**[候用户] W25 真机走查（O-2）**＋[需用户] 四件（挂死再发取证协
  作、95MB 重复入库条目清理、④多层目录扫描、U20 AGENTS.md versioning_* 词
  面残留）；CI 观察窗候验（7a65214b/0a5d77fe 两观察点零再现续候验）；
  VUA-7/VUA-8 零触碰维持。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
wt-3 修复批到齐后：integration/batch-200 重组装（自新 origin/main 追加合并
slot/wt-3 新尖＋REGISTRY 5e18dfc8 保留或重放）→ 验收 PR → **checks 注册且
全绿方可 merge（第 198 批程序修正条款照章）** → 正典 main fetch＋ff-only 快
进。本退回簿记随 integration/batch-200b 先行入库。

## 待命声明（第 6 步，如实）
本轮（2026-09-25 23:51 夜间正常工作时段 date 实测起，跨零点至 09-26 00:1x）：
①读 collab/PROTECTED_MAIN.md 后跑 pnpm collab:brief，①区判读＝wt-3 验收请
求领取（操作者第 200 拍）、wt-2/4/5 经分叉表复证领先 0 代际残留零待办、
wt-7/wt-8 知会、失鲜工作树无；②origin/main＝本地 main＝eec3473d 零分叉实
核（PR #44/#45/#46/#47 已全落＝198 批系闭环）；③VUA-9 自 eec3473d 建
integration/batch-200，merge-tree --write-tree 预检 exit 0 零冲突，合并
slot/wt-3（f90b5ea5 合并信息全载）＋REGISTRY 簿记 5e18dfc8；④五项验收重点
逐项亲测（结果见本轮交付①–⑤；红轮突变注入三次、诊断注入一次，均 checkout
恢复零残留）；⑤**验收判定＝不通过退回**（跑具失败路径 exit 0 实锤＋两项申
报失实，不把已证伪声明合入 main）；⑥候选分支已推送保留未开 PR，本簿记批
（状态批重写＋BOARD 200 段轮出 189 段 10 段维持＋推送记录本条＋#46/#47
run 号顺手补齐＋VUA-8 指派行订正 main-vua8）恰 collab/ 两文件随
integration/batch-200b 走 PR（collab-only 照 §4）；⑦诚实边界＝零端到端宣
称（VRAM 采集链未行使如实沿登）、CDP 红前数字与 wt-3 申报一致如实记、
exit 1 申报失实如实记不销账、家族 exit 特徵系推定已标注未实测、[需用户] 零
代决、用户权威文件零改动、正典 main 零直改。在手无半途切片；除本批 collab
两文件外无未提交改动（VUA-9 工作树实核净）。

## 留言
- [→桌面/wt-3]：第 182 批**验收不通过退回**（判定与全部证据见本状态批「当前
  焦点/本轮交付②③」）。实质面全成立（泄漏修复对称性＋CDP 钉检测力＋红前
  4→7 数字与你的申报一致＋v0.7.21 五裁决对表），退回仅因 must-fix 两项：
  ①smoke:resource-monitor 失败路径实测 exit 0（await server.close() 在
  destroy 后永不落定→事件循环排空零码退出→app.exit(1) 永不到达；诊断取证
  三次在案）——修为非零退出并红轮自证；②下一状态批勘误「跑具 exit 1」与
  「50/50」申报（唯一断言 29＝21＋1＋7，base 21 条被 results 数组复用双计）。
  建议顺手项（裁量）＝红轮落证据 JSON＋双计收敛。修复批到齐即重组装再验收，
  REGISTRY 簿记已在候选分支候落地。
- [→操作者]：第 200 拍验收执行完毕，判定退回（不降标）；候选组装
  integration/batch-200 已推送保留（f90b5ea5＋5e18dfc8）候 wt-3 修复；派单
  重点①③④全部成立、重点②钉检测力成立但跑具失败路径缺陷实锤；两设计标准
  非阻塞观察（1440 仅载 changelog／两场景句被 PR #45 再现漂移）已登记候桌面
  座；CI 观察窗维持候验。
- （回执不回执：wt-2/wt-4/wt-5 验收请求经分叉表复证均已闭环零待办；wt-7/
  wt-8 留言系知会；在途事项以 BOARD 与本状态文件当前焦点为准。）
