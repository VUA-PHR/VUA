---
worktree: wt-3
branch: slot/wt-3
baseline_commit: cc5a4d7c
role: 桌面
updated: 2026-09-21
---
## 当前焦点
**第 150 批装配词面适配轮（2026-09-21 06:4x–07:0x，节拍轮工作时段 date 实测；本拍
三笔：追平壳 553ff5d6＋修复批 441627c2＋本状态批）——任务＝BOARD #44 用户裁决
（素材直导链在 UI 词面中不得称「装配」，「装配」保留给配方链）落桌面 workshop
命名空间（wt-4 九缺口 i 项）＋附带缺口 (a) 车间构建记录卡出厂跳转；逐键甄别四
表＋组件词面，改动 5 键、保留 13 处、登记 2 处，防过正守卫与产线座同律**：

- **追平（TICK 开工纪律）**：轮首 fetch 实测落后 8（cc5a4d7c 世代＝第 149 批集成
  登记）领先 0，merge-tree 预检 exit 0 零冲突，--no-ff 合并落地追平壳
  **553ff5d6**（入站＝wt-2 素材链安全修复 83e267d9＋wt-3 上拍三笔收编＋wt-4 状
  态批＋U19/[需用户] 与 #45 候派登记；零自有内容纯吸收）。VUA-7/VUA-8 全程未触。
- **甄别方法与关键发现**： BOARD #44 行＋wt-4 本地件缺口清单（VUA-4
  docs/plans/w25-handoff-segment-map_ZH.md §5，只读不作改动）逐键对表。**关键
  事实＝en 源表 workshop 词面本就是 setup/build 系**（subtitle "Set up, build and
  check…"、runningSubtitle "The setup plan is confirmed"、blocked "to set up and
  build avatars"、role.warehouse 无装配字样），**ja 表同位键全为セットアップ系、
  ko 表全为 설정 系——唯 zh-CN 翻译表把这批键译成「装配」**，偏离源表语义选择；
  而 productionFlow（素材直导链）命名空间本身词面干净（导入/检查/计划/执行系零
  装配）。修复定性＝翻译表向源表语义对齐＋裁决口径落地，en/ja/ko 零触碰。
- **改动键清单（恰 5 键，全在 zh-CN 表 workshop 命名空间）**：
  1. `workshop.subtitle`「装配、生产与检测任务…」→「导入、生产与检测任务…」
     （素材直导链执行段标题宣称，裁决直指；en 源 "Set up, build and check"）。
  2. `workshop.runningSubtitle`「装配计划已确认…」→「执行计划已确认…」（素材链
     计划被称装配计划；与 plan.confirm「确认计划并执行」词面呼应）。
  3. `workshop.idleDescription`「{recipe}与装配流程接入后,这里会显示装配轨道…」
     →「{recipe}与执行流程接入后,这里会显示轨道阶段…」（流程宣称改执行系；
     「装配轨道」改「轨道阶段」保 §7.1 轨道语义去装配宣称，en 源无 track 字样）。
  4. `workshop.blocked.description`「…即可开始装配。」→「…即可开始导入与构建。」
     （阻断态引导文案；en 源 "set up and build"；与素材链首尾动作呼应）。
  5. `workshop.station.role.warehouse`「…在此排队,等待进入装配。」→「…等待进入
     轨道。」（甄别：素材上轨第一站是配方位，「进入装配」既跳段又歧义；改轨道
     叙事保物流语义零宣称）。
- **保留清单（逐处理由，防过正守卫）**：
  - `terms.assembly`「装配」＋nav 侧栏 workshop 页标签「装配 → 生产 → 检测」
    （labelTerms 拼装）：§7.1 工厂轨道阶段命名，任务点名保留类。
  - `home.cardDesc.production`「素材进仓、配方装配到发布」＋
    `onboarding.goals.production.description`「整理素材、创建 {recipe}、装配、检
    测并准备发布」：轨道段列举（§7.1 序列），非素材链动作宣称。
  - `workshop.station.role.recipe`「配方位:装配的期望状态来源」：轨道段语义（装
    配段＝组装工位的期望状态来源），工位职责上下文歧义低。
  - `workshop.trackAria/trackHint/conclusion/stageState/station.role.assembly`
    （组装工位行本用「组装」）：轨道阶段词面。
  - `packages.subtitle`「从{recipe}装配仍是主路径」＋packages 两处空态「用{recipe}
    装配项目/从{recipe}装配项目」：配方链语义（裁决把装配保留给配方链）。
  - compose 配方链卡全组：`subtitle`「保存配方后依次推进:解析→计划→批准→装配→
    记录」＋`executeCta`「执行装配」＋`executeTitle`「装配」＋`executePendingNote`
    ＋`recordPendingNote`＋`recordEmptyDesc`——裁决明文保留。
  - `inspection.subtitle`「装配之后的检查报告…」＋`emptyDesc`「检查随装配流程产
    生…」：**语义归属甄别结论＝保留**——检测对象是配方链装配产物（检查随配方
    链装配流程产生），非素材直导链宣称。
  - `taskTitles.assembly`「装配 {name}:骨骼绑定与菜单生成」：引擎 assembly 任务
    kind 的标题模板（en 源同位 "Set up {name}: rigging and menus"），任务身份词
    属核心域（任务点名保留类）；骨骼绑定与菜单生成＝配方链组装语义。
  - 代码注释「装配」（Gateway 装配/端口装配点/查重装配等约 15 处）：composition
    组装语义非产品词面；`track-model.ts`「装配轨道覆盖的阶段」系轨道模型内部注
    释。design-system/contracts TS 面零命中。
- **登记不改清单（2 处）**：
  - **[知会核心] fixtures 回放带 headline**（strings.fixtures.zh-CN.ts
    workshop.tapes success/warning「一次完整的装配流程」/「装配在检查点等待确
    认」）：DEV-only 演示负载（生产构建剔除），且演示内容中心是引擎 assembly 任
    务（骨骼绑定与菜单生成）——「装配」作主语与任务身份一致，核心域词面桌面不
    代改；若核心日后细化任务身份词面，fixture 演示自然跟随。
  - **[知会核心] `taskTitles.assembly` 措辞与 en 源差**（zh「装配 {name}」vs en
    "Set up {name}"）：与上条同一任务身份，桌面四表翻译不代改引擎 kind 语义归属，
    候核心斟酌（现状按配方链组装语义保留，非阻塞）。
- **附带缺口 (a)（甄别为小改，已做）**：车间构建记录卡完成态新增「去出厂」链
  钮——复用 S-IX-1 流水线行同一导航原语 `onNavigate(PageId)`（纯页面跳转，不跨
  页携带记录身份，守 023 跨源推导投影纪律）。实现：production-flow-model.ts 新
  纯谓词 `buildRecordGoReleaseAvailable(displayStatus)`（仅显示投影 completed 放
  行；aborted/rolled_back 无出厂对象可看、rollback_failed 阻断；recovered 权威态
  经投影折叠 completed 后与卡头徽标同口径在场——不另设判定）；prop 钻孔
  WorkshopPage→ProductionFlowSection→BuildRecordCard（onNavigate 可缺席，缺席时
  链钮不渲染）；i18n 四表新键 `productionFlow.record.goRelease`（en "Go to
  release"/zh「去出厂」/ja「リリースへ」/ko「릴리스로 이동」）；回归钉＝
  `buildRecordDisplayStatuses` 四态闭集遍历×显式期望表（新增态缺键即编译错＋测
  试败，防回摆）。无导航模型/任务身份语义牵扯，不属「登记候派」分支。
- **修复批 441627c2（恰 9 文件 68+/7-，桌面域内零 wire/合同面触碰）**：strings
  四表（zh 5 键改＋goRelease 四表新键）＋production-flow-model（谓词＋注释）＋
  production-flow-model.test（谓词例）＋BuildRecordCard/ProductionFlowSection/
  WorkshopPage（链钮＋prop 钻孔）。
- **定向证据（本拍亲测）**：desktop **typecheck 双 tsconfig exit 0**；vitest
  **90 文件 824/824**（对第 148 批世代 823 净 +1＝谓词例）；**check:i18n OK**
  （三交付语言表与源表键集对齐，goRelease 四表同步验入）＋**check:boundary OK**
  ＋**check:contrast 全达标**＋**build exit 0**（chunk 尺寸警告系既有状况非本批
  引入）。诚实未跑项：cargo 全链（本拍零 Rust 文件触碰）；check:leak 照分工集
  成侧候补跑。contracts dist 本拍未触（零 packages 改动）。
- **design-standard 牵连甄别**：design-standard_ZH/EN 全文「装配」仅两处＝主流
  程名「装配 → 检测 → SDK 交接」（§ 导航重构阶段命名，轨道语义），与本批 5 键
  零牵连；「去出厂」链钮系复用既有导航原语的呈现小改，无实质交互变更——**照
  任务纪律不升 0.7.x 版号，本批只在此登记，标准文件零触碰**。
- **读数（收尾 fetch 实测）**：领先 2（＝修复批＋追平壳，实质 1）、落后 0，无竞
  速。

## 前情（本域链，全文见本文件 git 历史）
上拍（09-21 05:5x–06:1x 三笔）＝第 148 批反向审查轮（追平壳 05d546b9＋修复批
0e6208ea＋状态批）——行族分派律＋并呈律两缺陷同拍自修，已经第 149 批收编验收。
更早 F4 桌面双环＋W25 呈现缺口修复见 git 历史。

## 本轮交付（cc5a4d7c 基线世代）
- **追平壳 553ff5d6**（吸收 main cc5a4d7c＝第 149 批，预检 exit 0，零自有内容）。
- **修复批 441627c2**（恰 9 文件：四表＋flow 模型＋flow 测试＋三组件）。
- **本状态批（恰本文件）**。
- 零新阻塞、零新升级项、零 [需用户]。

## 残余风险清单（如实登记，非阻塞）
- **词面适配的覆盖边界**：本批甄别面＝i18n 四表＋渲染器组件词面＋代码注释；引
  擎（Rust 侧）任务身份/阶段词面未逐键过表（ crates/ 非桌面所有权，只读实证限
  定）——引擎 wire 面若存在面向用户的「装配」宣称词面，候核心自查，桌面不代审。
- **fixtures headline 与 taskTitles.assembly 登记项**（见上，[知会核心] 两处，
  DEV-only/身份词性质，非生产词面缺陷）。
- **组件层渲染行为测试基建缺席**（BOARD #37 同源，沿上拍登记）：「去出厂」链钮
  以纯谓词＋闭集期望表钉死，按钮接线本身无 jsdom 断言——谓词与消费点单点连接，
  回摆风险低非零。
- **i18n 键值语义漂移类缺陷的制度性防线**：本批根因＝翻译表措辞偏离源表语义选
  择而 typecheck/check:i18n 均不校验措辞（键集与插值参数对齐≠语义对齐）——四表
  语义对表目前靠人工甄别，无自动化守卫；是否值得加「同源语义敏感键清单」类检
  查属独立决策，登记不抢跑。

## 在途/待他角色
- **[等集成] 本拍三笔候验收**（追平壳 553ff5d6＋修复批 441627c2＋本状态批）。
- **[等核心] fixtures headline/taskTitles.assembly 两处知会**（上列登记项，非阻
  塞非缺陷，候斟酌）。
- **[等用户] W25 真机复验维持**：装配词面适配后的车间页真机词面＋「去出厂」链
  钮真机呈现＋素材链全链走查——归 W25（O-2）候用户返回驱动。

## 阻塞
- 无阻塞。

## 下次合并意图
**候验收对象＝本拍三笔（--no-ff）：追平壳 553ff5d6＋修复批 441627c2（恰 9 文件）
＋本状态批恰本文件，写明「wt-3 第 150 批装配词面适配轮（基线 cc5a4d7c）」**。桌
面域 TS＋collab 面两处；请重点 diff 复核：zh 表 5 键新词面（改/留清单是否守裁
决口径防过正）、buildRecordGoReleaseAvailable 谓词与三组件 prop 钻孔接线、
goRelease 四表键同步。

## 待命声明（第 6 步，如实）
本轮（2026-09-21 06:4x–07:0x，节拍轮工作时段；三笔）：①date 实测工作时段，
pnpm collab:brief ①区判读（wt-7/wt-8 留言两件系 R4–R6 落地知会，与本拍域零交
叉；两工作树按指派全程未触）；②追平壳 553ff5d6（落后 8 过线自理，预检 exit 0
零冲突）；③BOARD #44＋wt-4 缺口清单只读对表，四表＋组件逐键甄别（en 源表已
setup 系的源语言事实＝本批关键证据）；④zh 表 5 键订正＋13 处保留逐处记由＋2 处
登记；⑤附带缺口 (a) 小改分支落地（谓词＋链钮＋四表键＋防回摆测试）；⑥定向证
据亲测全绿（typecheck 双 0＋vitest 824/824＋i18n/boundary/contrast/build）；
cargo 零触碰如实未跑、leak 集成侧；⑦诚实边界维持：测试绿≠真机绿、零端到端宣
称——车间词面与链钮真机呈现归 W25（O-2）；[需用户] 条目照规则跳过未代决。在手
无半途切片、除本状态批外无未提交改动。退出待命，候集成验收本拍三笔、用户 W25
返回、下轮 brief 或新指派。

## 留言
- [→集成] 验收请求：**候验收对象＝追平壳 553ff5d6＋修复批 441627c2（恰 9 文件：
  装配词面 5 键订正＋缺口 (a) 出厂链钮＋goRelease 四表键＋谓词回归钉）＋本状态
  批，写明「wt-3 第 150 批装配词面适配轮（基线 cc5a4d7c）」**。桌面 typecheck
  双 0＋vitest 824/824＋build＋i18n/boundary/contrast 本拍亲测在案，check:leak
  候你侧照分工补跑。
- [→wt-4]（回执）九缺口 (i) 项已领——甄别结论：产线座点名候选 5 处中 4 处
  （subtitle/runningSubtitle/idleDescription/blocked）按裁决改；role.warehouse
  「等待进入装配」改「等待进入轨道」（轨道叙事保留、跳段歧义消除）；role.recipe
  与 inspection.subtitle 语义归属甄别为保留（轨道段语义/配方链装配产物检测对
  象），compose 卡全组未动守裁决。缺口 (a) 已做（记录卡完成态「去出厂」，纯导
  航原语，谓词钉死）。贵席清单本桌侧两项至此闭合。
- [→核心/wt-2]（知会）两处登记不改：fixtures 回放带 headline「装配流程」系演
  示引用引擎 assembly 任务身份（DEV-only）；taskTitles.assembly zh/en 措辞差同
  源。任务身份词面属核心所有权，候你席斟酌，桌面不代改。
- [→wt-7]（知会）本批 i18n 新增键恰 1（productionFlow.record.goRelease，四表同
  步）；zh 表另 5 键为措辞订正零键集变化；check:i18n 验过。
- （回执不回执：brief ①区两件知会随本拍消化；在途事项以 BOARD 与本状态文件当
  前焦点为准。）
