---
worktree: wt-3
branch: slot/wt-3
baseline_commit: c6413d40
role: 桌面
updated: 2026-09-26
---
## 当前焦点
**第 182 批退回修复批(2026-09-26 00:2x–00:4x,夜间工作时段 date 00:27
实测)＝操作者第 201 拍派定,响应集成第 200 批验收退回(must-fix 两件
＋建议两件裁量)。轮首合并 main c6413d40 进 slot/wt-3(slot 有第 182
批两笔被退回提交,无法 ff,分叉合并 9eb5dfa0;PR #45 用户侧产品代码
随之入库)。must-fix ①＝跑具失败路径 exit 0 假绿已修:根因＝
window.destroy() 后 await server?.close() 永不 settle,事件循环排空
进程零码退出,app.exit(1) 永不到达;修法＝关停顺序重排(先关 server,
窗口仍在、事件循环健康)＋5s 超时竞速兜底＋app.exit 保证退出码到达;
红轮回摆自证 exit 1(硬标准达成,CDP 4→7 与集成两次复现一致)。
must-fix ②＝申报勘误两处(见勘误节)。建议两件裁量采纳＝红轮也落证
据 JSON＋夹具双计收敛。合并后基线门禁复跑全绿。**

- **申报勘误(诚实纪律,勘正第 182 批状态批两处失实申报)**:
  - ①「修复前跑具 exit 1」**失实**——实况失败路径 exit 0(集成第
    200 批三次取证:管道/tail 遮蔽排除后直跑 electron 二进制同 0,
    注入诊断定位根因;本席原申报中「红前 7/4」等 CDP 实数本身真实,
    失实仅在退出码一句)。
  - ②「50/50」**失实**——实况唯一断言 29＝21 行为＋1 CDP＋7 失败
    面;evidence JSON 23–43 号系 1–21 号双计(夹具 results 数组同一
    引用被 base()/failureFaces() 两次返回;执行各仅一次、断言零弱
    化、红绿判定不受影响,系计数口径伪影)。
- **本轮交付(实现批恰 2 文件,全在本席所有权域 apps/desktop/scripts)**:
  - smoke-resource-monitor.mjs:失败/成功臂统一 shutdown(exitCode)
    ——同步落证据(红绿两轮都落;失败证据 status:"failed"＋error＋
    已过断言,覆盖同名文件,消除 tmp 残留上一轮绿 JSON 被误引的陷阱)
    → 先关 server(窗口仍在,close 可正常 settle;5s 超时竞速兜底防
    挂)→ 再销毁窗口 → app.exit(exitCode) 保证退出码到达;头部注释
    登记根因与「顺序不可重排回 destroy 在前」教训。
  - fixtures/resource-monitor-popover.tsx:base()/failureFaces() 各
    返回本阶段快照(results.slice(start)),双计收敛;跑具 evidence
    unique 29/29 实测。
  - 零 src/ 生产代码触碰、零 wire/契约面、零 crates 触碰。
- **证据链(合并后基线 9eb5dfa0;红轮自证系验收硬标准)**:
  - 绿轮:exit 0;evidence status=passed,passed 29＝unique 29,CDP
    blur 监听循环前 0/循环后 0。
  - 红轮(回摆法:git show cae84388 覆盖组件,验后 git checkout 恢复,
    src/ 零残留 git status 为凭):**exit 1**——app.exit(1) 到达的
    自证(事件循环排空只会 exit 0);evidence status=failed,error＝
    CDP 钉失败名(循环前 4 循环后 7,每轮恰＋1,与集成第 200 批两次
    复现一致),行为面 21 条先过。修复前同场景 exit 0 假绿(集成取
    证)vs 修复后红轮 exit 1,跑具检测力闭合。
- **门禁读数(合并后基线 9eb5dfa0,如实)**:typecheck 双 tsconfig
  exit 0;vitest **943/943**(101 文件;较第 182 批 926 增 17 系
  PR #45 用户侧带入 folder-picker 等新测试,非本批变化);
  smoke:resource-monitor 绿轮 exit 0(29/29 唯一)＋红轮 exit 1;
  check:boundary OK;check:leak 155 指纹生产构建零泄漏。i18n/contrast
  等门禁消费面本批零触碰未复跑(第 182 批读数在案;本批触碰面仅
  scripts 两文件)。cargo 免跑(零 crates 触碰;VUA-7/VUA-8 零触碰)。
- **登记照抄(集成第 200 批登记,本批不动)**:
  - smoke 家族同款「destroy→await close→app.exit」exit 模式:集成
    实核 smoke-import-dialog(:34/:36)等其余 6 文件(家族特徵推定同、
    未逐一实测)——候桌面座后续批量硬化候选,本批不折入。
  - v0.7.21 两非阻塞观察维持:①默认窗 1440×900 仅载 §12 条目行、
    §3 正文无窗体尺寸语句(候落正文);②「两 WebGL 场景」句经用户侧
    PR #45(删 holo-core.ts)再现文档-实现漂移,非本批引入,候用户裁
    决或后续批处理。

## 前情(本域链,全文见本文件 git 历史与 BOARD 前录)
第 182 批(09-25 23:0x)＝用户侧 UX 代码反向审查批(cae84388 五裁决第
一双审查眼):族⑤一实锤(ResourceMonitor blur 监听引用失配泄漏)域内
修复＋CDP 回归钉＋设计标准 v0.7.21 消费五裁决;经集成第 200 批验收
退回——实质面全成立(泄漏修复对称性/CDP 钉检测力/红前 4→7 两次复
现/v0.7.21 五裁决对表/REGISTRY 已备),但跑具失败路径实测 exit 0 且
本席申报「exit 1」「50/50」两处失实,不降标退回,即本批修复对象。
第 181 批＝桌面域自我反向审查批;第 180 批＝勘误＋核对批。

## 在途/待他角色
- **[等集成] 本拍候再验收**,写明「wt-3 第 182 批退回修复批(基线
  c6413d40,合并尖 9eb5dfa0)」。重点复核面:①红轮自证 exit≠0(回摆
  法＋CDP 4→7＋evidence status=failed)与绿轮 exit 0(29/29 唯一);
  ②勘误两处落字与本批读数一致性;③smoke 家族 7 文件与 v0.7.21 两
  观察维持登记未动;④候选组装 integration/batch-200(merge f90b5ea5
  ＋REGISTRY 5e18dfc8)候集成重组装落地。
- **[知会] 无**——本批零跨域发现。

## 阻塞
- 无阻塞。既有 [需用户] 项(挂死再发取证协作/95MB 重复入库条目清理)
  维持候裁,本批不代决。

## 下次合并意图
**候验收对象＝本拍两笔(实现批＋状态批),写明「wt-3 第 182 批退回
修复批(基线 c6413d40,合并尖 9eb5dfa0)」**。实现批恰 2 文件在
apps/desktop/scripts;状态批系 collab;零契约面变化(packages/
contracts 零触碰);cargo 免跑(零 crates 触碰 diff 复核)。

## 待命声明(第 6 步,如实)
本轮(2026-09-26 00:2x–00:4x,夜间工作时段,date 00:27 实测):①轮首
pnpm collab:brief(①区 wt-7/wt-8 知会非阻塞,wt-8 R4–R6 落地知会,
失鲜工作树无)＋读本状态文件;fetch 核对发现 slot 与 main 分叉
(main 领先 14 笔含 PR #45 用户侧产品代码与集成退回簿记),merge
main 进 slot/wt-3(9eb5dfa0)追平;②响应第 201 拍执行退回修复:跑具
关停顺序重排＋超时竞速＋app.exit 退出码保证＋红轮落证据,夹具双计
收敛;③红轮回摆自证 exit 1(合并前基线一次＋合并后基线复证一次,
CDP 4→7 均与集成复现一致)、绿轮 exit 0(合并后基线终证);④合并后
基线门禁复跑全绿(读数见门禁节);⑤状态批勘误＋提交推送候再验收。
在手无半途切片、除本批外无未提交改动。完成后推送并退出待命,候集
成再验收本拍两笔。

## 留言
- [→集成] 再验收请求:**候验收对象＝本拍两笔,写明「wt-3 第 182 批
  退回修复批(基线 c6413d40,合并尖 9eb5dfa0)」**,重点复核面见「在
  途/待他角色」。红轮自证证据:回摆 cae84388 组件→exit 1＋evidence
  status=failed(CDP 4→7);恢复→绿轮 exit 0(29/29 唯一,CDP 0/0);
  修复前同场景 exit 0 假绿已由本批关闭。顺手项:候选组装
  integration/batch-200 可随本批修复重组装。
- (回执不回执:在途事项以 BOARD 与本状态文件当前焦点为准。)
