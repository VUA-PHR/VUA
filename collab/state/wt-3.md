---
worktree: wt-3
branch: slot/wt-3
baseline_commit: 0716644
role: 桌面
updated: 2026-09-18
---
## 当前焦点
**[→桌面] 4748970 回退批落地（BOARD #36④ 更正,2026-09-18 05:4x–
05:5x,工作时段;追平合并壳 e35aba7＋revert 批 912f72f＋本状态批）
——消化 BOARD 0716644 更正批处置①「桌面回退 4748970 即刻恢复
功能」,恢复 Booth 内嵌浏览,单拍单一任务**:

- **背景与定性（照 BOARD 0716644 更正批全文消化,桌面全盘认账）**：
  用户目视复验质询「Booth 内嵌浏览明明已实现」——经代码＋历史实证
  **用户正确**:内嵌浏览基座随壳交付（main.ts:528 RemoteContentManager
  allowedOrigins booth.pm 全接线＋preload vua:remote-content 七动作
  窄面＋ImportPage 浏览面板）,**preload 自报 remoteBrowser:true 系
  交付物本身**（875c85a IMP-2 batch B item 1,仲裁 015 §11 方案 a）;
  remote-content.ts「#26 用户实测退出崩溃修复」与「导航条用户实测
  缺口修复」两处留痕＝功能被真实使用过。原④定性错误根源＝把两处
  未随 F4 落地翻转的陈旧常量（gateway-router.ts:414 旧三布尔信封
  硬编码 false——恰缺陷①被替换信封的残余面＋provider-bootstrap
  DESKTOP_CAPABILITIES「F4 前」陈旧行）误读为「功能不存在」,而真实
  功能走 vua.remoteContent IPC 专面不经 gateway;4748970（09-18
  03:0x）据此把正确的 true 翻 false＝**回归**。操作者 05:2x 复验
  回执沿同一错误口径记④「实达」,已经 0716644 一并撤回更正。
- **本拍执行三步**：①追平壳 e35aba7＝--no-ff 合并 main 0716644
  （merge-base＝本树尖 86c05de,领先 0 纯追平;双法预检零冲突——
  老式 0 标记＋ort --write-tree exit 0 tree a29f527b;inbound 非
  collab 面恰核心 2 文件〔mock-provider.ts＋.test.ts,第 91 批
  08fa61e 已收编内容〕＋collab 6 文件,与各批登记并集一致无夹带,
  桌面域 inbound 零触碰）;②revert 批 912f72f＝`git revert 4748970`
  零冲突（4748970..HEAD 间 preload.ts 零后续改动）,恰 preload.ts
  一文件 4+/8-＝4748970 的精确逆;remoteBrowser:true 恢复＋原注释
  「内嵌浏览基座(remote-content + U9 导航策略)随本壳交付」原语机械
  恢复;**diff vs 4748970^ 零行＝与 875c85a 交付世代逐字节一致**;
  ③桌面 check 全链绿（见证据）。
- **证据（本机本树 VUA-3,05:4x–05:5x）**：df C 盘余 12G 先查（较
  上拍 16G 再降,近满注记维持;本批零 Rust 面变更,cargo fresh 跳过
  未触用户 provider 文件锁）;桌面 check 全链绿——typecheck 双
  tsconfig＋vitest 78 文件 647/647（含 gateway-router 25/25＋
  **import-model 10/10 两态测试双向在案全过**,与 4748970 前世代
  读数一致）＋build＋boundary＋i18n＋contrast＋check:leak 155 指纹
  零泄漏＋forest-leak;contracts 零变更免复跑（revert 恰桌面 1
  文件,f8ad6cb 世代 66/66 在案有效）。变更面恰桌面所有权域 1 文件
  （4+/8-）。
- **④′能力面对齐切片本拍不做（BOARD 0716644 处置②,候下一拍
  专项）**：能力面三处分叉（gateway 信封硬编码 false＋provider ops
  desktop.remoteBrowser unavailable 陈旧行 vs 壳自报/已交付事实）
  的对齐——信封随壳自报实值＋provider 行改注/路由决策＋三面 live
  形状测试——本拍零触碰;gateway-router.ts:414 与 provider-bootstrap
  陈旧行维持现状如实申报,不因本批回退而改读。
- **环境事实（照操作者注记）**：dev 栈由操作者管理运行中（vite
  5173＋electron CDP 51995＋provider 随 electron 树）,本树全程未
  触碰;回退合并入库后操作者刷构建复验——回退后 CDP 复验内嵌浏览
  面板恢复,随后 BOARD #36 行④改记「回归已修复」（BOARD 处置③,
  本拍不代记,候复验回填）。
- **诚实边界**：零端到端宣称维持——本批只证明代码面恢复＋测试全
  绿;内嵌浏览真机可用性本拍未新增真机证据（历史真实使用留痕在案,
  回退后复验归操作者刷构建 CDP）。

## 前情（机械跟随批世代,全文见本文件 git 历史）
09-18 03:3x–03:4x 机械跟随批 f8ad6cb（contracts bdl 六类型信封
对齐＋gateway-router 测试跟随）＋耦合合并壳 53a043f/83b87bd,已经
第 90 批 1a21f94／第 91 批 e5502d7 收编入库;更早:缺陷③消费面
3c37d19 经 5334f0d、#36 修复批八笔经 c89d17f。更早见 git 历史。

## 本轮交付（0716644 基线世代）
- **追平合并壳 e35aba7**（零自有内容,吸收 main 0716644）。
- **revert 批 912f72f**（恰 apps/desktop/src/electron/preload.ts
  一文件,4748970 精确逆,全链证据在案）。
- **本状态批**（恰本文件,collab-only）。

## 在途/待他角色
- **[等集成] e35aba7＋912f72f＋本状态批候随轮验收（--no-ff）**：
  实质对象＝revert 批 912f72f（恰桌面 1 文件,自树全链证据在案,
  全量复跑候你方合并门照惯例）＋本状态批（collab-only 免全量）;
  追平壳零自有内容照先例自然收编。
- **[→操作者] 回退后刷构建＋CDP 复验**：内嵌浏览面板恢复呈现
  （badge＋地址栏＋自动打开回到可用态）;复验回填后 BOARD #36 行④
  改记「回归已修复」;#31 条目名称复验点等既有项随同窗不变。
- **[等桌面/下一拍] ④′能力面对齐切片专项**（BOARD 处置②）：三面
  分叉对齐＋live 形状测试,候下一拍,不与本批混做。
- **[等用户] 既有项维持**：ready-p2 解锁＋v0.2「缓存数据」标注
  呈现复验（与 #33 同窗,05:2x 重启后已解锁候目视确认）、
  #25/#27/#28/#29 回填、W25（O-2）。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝revert 批 912f72f（代码恰 1 文件）＋本状态批（恰本
文件）,请集成随轮验收（--no-ff）,写明「4748970 回退批（BOARD
#36④ 更正）」;追平壳 e35aba7 零自有内容随验收自然收编。**提交后
读数:领先 3（合并壳 1＋revert 1＋本状态批 1;实质 1＝revert 批）、
落后 0（0716644 世代）。若下轮 brief 读数落后过 15 线照则自理
追平。

## 待命声明（第 6 步,如实）
本轮（2026-09-18 05:4x–05:5x,工作时段,三笔:e35aba7＋912f72f＋
本状态批）：①date 05:43 确认工作时段;brief ①区指向本树唯一
留言＝wt-2 去桥办结回执（收货消化零动作,见留言）,失鲜工作树无;
②领任务＝操作者注记单拍单一任务「回退 4748970 恢复 Booth 内嵌
浏览」（BOARD 0716644 更正批处置①指派桌面）,照办;③执行＝追平
e35aba7（双法预检零冲突,inbound 与登记一致无夹带）→revert 912f72f
（零冲突,恰 1 文件 4+/8-,diff vs 4748970^ 零行,原注释原语恢复）
→check 全链绿（df 12G 先查;vitest 647/647 含 import-model 10/10
两态双向全过;leak 155 零泄漏＋forest-leak;cargo fresh 跳过未触
用户 provider 文件锁）;④所有权核验＝恰桌面域 preload.ts 一文件,
其它域零触碰;⑤④′能力面对齐切片本拍不做照注记留候下一拍,
gateway-router.ts:414＋provider 陈旧行维持现状如实申报;⑥环境
事实＝操作者 dev 栈（vite 5173＋electron CDP 51995）全程未触碰,
回退入库后操作者刷构建复验;⑦零端到端宣称维持——本批零真机新
证据,复验归操作者 CDP,BOARD 行④改记候复验回填。退出待命,候
集成验收本批、操作者刷构建 CDP 复验回填、下一拍④′专项或新
指派;在手无半途切片、无未提交改动。

## 留言
- [→集成] **4748970 回退批（BOARD #36④ 更正）验收请求**：候验收
  对象＝revert 批 912f72f（恰 apps/desktop/src/electron/preload.ts
  一文件 4+/8-＝4748970 精确逆;依据 BOARD 0716644 更正批处置①——
  preload 自报 true 系 875c85a 交付物,4748970 系回归,回退恢复
  875c85a 交付世代,diff vs 4748970^ 零行实证）＋本状态批（恰本
  文件,collab-only 免全量）;追平壳 e35aba7（merge-base＝86c05de
  领先 0 纯追平,双法预检零冲突,inbound 非 collab 恰核心 2 文件
  与 91 批登记一致）零自有内容随验收自然收编。自树全链证据在案
  （05:4x–05:5x:typecheck 0＋vitest 647/647〔gateway-router
  25/25＋import-model 10/10 两态双向〕＋build＋boundary＋i18n＋
  contrast＋leak 155 零泄漏＋forest-leak）,全量复跑候你方合并门
  照惯例。④′能力面对齐切片另拍,BOARD 行④「回归已修复」改记候
  操作者回退后 CDP 复验回填,本批不代记。
- （wt-2 [→桌面] 去桥办结回执收货消化：08fa61e 已经 91 批入库,
  去桥条件闭环,核心侧无动作请求——brief ①区该留言就地消化,
  勿重复;历史留言已消化归档,在途以 BOARD #36 与本状态文件为准。）
