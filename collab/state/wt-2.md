---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: b217593
updated: 2026-09-16
---
## 当前焦点
**#27 核心协作批——Main↔Provider 帧协议握手／served_capabilities 能力
面两怀疑面核实排除＋断点收敛供给桌面（2026-09-16 00:0x–00:2x 工作时
段轮，协作定位批：BOARD #27 行注记＋状态批，核心域零代码变更）**：
- **【① 注意】消化（本轮 brief 00:03）**：指向本树/本角色的阻塞与
  留言为空（brief ① 节原文），零消化项；零失鲜工作树。
- **开工前对齐追平（b242521，--no-ff）**：落后 1（b217593＝第卌八波
  集成验收本树上轮状态批 303133a，collab-only 零新实质内容）；
  merge-tree 预检 exit 0 零冲突；inbound 非 collab 文件面恰零文件
  ＝零未验收实质内容；核心所有权域 inbound 零触碰。合并后落后 0。
- **领取依据（领任务链第 2 环，b217593 世代 BOARD 逐行重读）**：
  #27 行归属列明载「桌面（主导定位与修复；**核心协作＝Main↔Provider
  帧协议/能力面属核心域配合定位**；登记方＝集成）」，处置列「涉核心
  域面随核心协作批走相应验证」——非 [需用户] 项，系指向核心的协作
  义务（上轮 23:1x 时该归属行尚未登记，本轮为首次可领窗口）。
- **核实一：帧协议握手面（怀疑面一，核心域）排除**——Rust 侧
  provider_host.rs:784-789 握手响应五字段
  （contractVersion/supportedContractVersions/providerBuildId/
  providerInstanceId/downloadIngest）与 TS 侧
  supervised-process-provider.ts `isHandshake` 校验逐字段对齐，
  FRAME_VERSION 0.1 双侧一致；用户机进程证据互证＝provider PID
  54764 存活且父进程＝electron main（受监督拉起链）＋应用窗口正常
  呈现——握手若失败 TS 侧 start() 会 kill 子进程并抛错、
  app.whenReady 链断裂无窗口，**窗口在＝握手成功 provider ready**；
  本机真实二进制 e2e 绿佐证（vitest 25/25 含「walks handshake,
  capabilities, the demo task lifecycle and a safe shutdown」，
  09-12 构建 exe 与当前 TS 代码握手成功＝0.1 线跨世代健康）。
- **核实二：served_capabilities 能力面传递（怀疑面二，核心域）排
  除**——capabilities 随 application.getSnapshot 响应返回
  （provider_host.rs:994）；可用性装配（bin
  vua-orchestrator-provider.rs 环境变量驱动
  production/downloads/warehouse/use_cases）与桌面注入面
  （provider-bootstrap.ts desktopProviderProcessFactory 显式补齐
  VUA_PROVIDER_DATA/VUA_WAREHOUSE_ROOT/VUA_PROJECT_ROOT/
  VUA_UNITY_EDITOR）接缝对齐，与用户机 `bdl/`、`orchestrator/`
  开库证据吻合；**澄清＝`desktop.remoteBrowser` 不可用系
  DESKTOP_CAPABILITIES 显式恒 unavailable（F4 前设计呈现，
  provider-bootstrap.ts:21-33），非断链信号，已建议从 #27 怀疑证
  据面剔除**。
- **断点收敛供给桌面**——第三怀疑面（渲染层 gateway 订阅链，桌面
  域）成为唯一残余；补充证据：GatewayProvider 首帧 Promise.all 任
  一拒绝会呈现全局 boot 失败态（bootFailed 分支），用户见各页正常
  渲染而非全局失败＝snapshot invoke 走通有返回、视图被 live 端口
  映射为 not-connected；且环境检测页消费的 environment.getSnapshot
  在 Rust 侧恒 available（无需任何环境变量），其 not-connected 呈
  现进一步指向渲染层吸收面（live 端口错误映射/preload `window.vua`
  暴露面）。下一手证据同意桌面已列（主进程控制台输出）＋建议补渲
  染层 DevTools console。**核心域零代码变更**（面经核实无缺陷，不
  投机修改——协作定位批边界）。
- **测试证据（本机 2026-09-16 00:1x，本树 slot/wt-2）**：
  @vua/orchestrator-provider check 全绿（tsc 零错＋vitest 25/25
  含真实二进制 e2e）＋cargo test -p vua-provider-host 全组零失败；
  registry-only **exit 0**（57 项一致＋1206 文件 0 处冲突标记，提
  交前重跑）。本轮树内新增＝BOARD #27 行注记＋本状态批，**collab-
  only 免全量如实声明**；核心所有权域零代码变更（核心域文件与
  main diff 0 文件，588/0＋clippy 0 证据世代在案）。
- **四环其余各环（b217593 世代复核，上轮结论维持）**：①本树在途
  ＝本批外零；②BOARD 其余核心行无开放可领项（#7 观察／#10 闭环／
  #20/#22 关闭／#25 [需用户] 跳过／#26/#28 桌面域）；③outline 当
  前窗口（M5）核心行 W20/W22 已交付维持，W25 候用户开窗（O-2），
  requestRun 事实源提案候输入不投机起草；④M6 剩余行候 M5 关门门
  序，M7 前四行授权核心零新开工（批 2 等桌面消费条件未清除），
  M8 未开窗不开工。

## 前情（b217593 世代，全文见本文件 git 历史）
上轮（09-15 23:1x）：M7 部分提前开工授权（1175ecf）落地核实——核
心域行零新开工项＋四环全查无可领项＋状态批 303133a（已经 b217593
第卌八波验收入库）。其前：第卌一波追平 4ff04a1＋D-6 契约缺口裁决
（019 方案 c）＋016 requestRun 修订（c914cf2）＋021 词表裁决
（6cc4594）＋路由批（a6585c2）＋U10 消费切片（0cb0d05）＋M7 检查
切片（e3ce569）＋overlay wire 批 1（713329f）＋#22 兑现批
（d02bd09）。

## 本轮交付（b217593 基线世代）
- **#27 核心协作批注记（BOARD #27 行内联，2026-09-16 00:1x）**：
  帧协议握手面＋served_capabilities 能力面两怀疑面核实排除＋
  remoteBrowser 设计性 unavailable 澄清＋断点收敛第三面（渲染层
  gateway 订阅链）供给桌面＋下一手证据建议。
- **本机测试证据**：orchestrator-provider tsc＋vitest 25/25（含
  e2e）＋provider-host Rust 全组零失败＋registry-only exit 0
  （57 项＋1206 文件 0 标记）。
- **状态批（本批，仅本文件，collab-only 免全量）**——核心域零新
  代码。

## 阻塞
无。

## 下次合并意图
**BOARD #27 行注记批＋本状态批两笔（恰 collab/BOARD.md＋
collab/state/wt-2.md 两文件，collab-only 免全量）请集成随轮验收合
并（--no-ff）。**开工对齐追平 b242521（落后 1，零自有内容）随验收
分支历史自然收编，不单独请求。本树提交后领先 main **3 提交**＝追
平＋BOARD 批＋状态批（实质 diff 恰 BOARD #27 行一段）。核心域零代
码变更，全量测试免跑如实声明（协作面测试证据本轮已在案）。

## 待命声明（第 6 步，如实）
本轮（00:0x–00:2x，工作时段）：①【① 注意】消化——指向本角色项
为零，零动作；②开工前对齐追平 b217593 世代（落后 1，b242521
--no-ff，merge-tree 预检 exit 0，inbound 非 collab 面恰零文件）；
③**#27 核心协作批**（领任务链第 2 环，BOARD 归属列核心协作义务首
次可领窗口）——帧协议握手面与 served_capabilities 能力面两核心域
怀疑面核实排除（代码两侧字段级对齐＋用户机进程证据互证＋本机真实
二进制 e2e 绿），remoteBrowser 显式 unavailable 设计澄清，断点收
敛供给桌面＝渲染层 gateway 订阅链唯一残余（boot 失败态反证＋
environment.getSnapshot 恒 available 面）；④本机测试证据在案
（25/25 含 e2e＋Rust 全组零失败＋registry-only exit 0），核心域零
代码变更（面无缺陷不投机修改），collab-only 免全量如实声明；⑤四
环其余各环无可领新项（[需用户] 全跳过）。**协作定位批：零新代码
交付、零新阻塞。**退出待命，候桌面第三怀疑面定位/修复批（涉核心
域面随叫随到）、M7 第 4 行桌面消费批 1（批 2 触发）、W25 用户开窗
（O-2）、requestRun 事实源输入、下轮 brief 或新指派；在手无半途
切片。

## 留言
- [→桌面] **#27 定位供给（核心协作批，BOARD #27 行注记同文）**：
  你列三怀疑面中前两面（Main↔Provider 帧协议握手／served_
  capabilities 能力面传递，核心域）经本轮核实**排除**——握手响应
  五字段与 isHandshake 逐字段对齐＋用户机进程证据互证（provider
  存活＋父进程=electron main＋窗口在＝start() 成功，握手失败会
  kill 子进程且无窗口）＋capabilities 传递接缝（bin 环境变量装配
  ↔desktopProviderProcessFactory 注入）与数据面开库证据吻合；
  **remoteBrowser 不可用系 DESKTOP_CAPABILITIES 显式恒 unavailable
  （F4 前设计），非断链信号，建议从证据面剔除**。断点收敛＝渲染
  层 gateway 订阅链（你的域）唯一残余：GatewayProvider 首帧
  Promise.all 失败会呈现全局 boot 失败态，用户见各页 not-connected
  而非全局失败＝invoke 走通但视图被 live 端口映射 not-connected；
  environment.getSnapshot 在 provider 侧恒 available，其
  not-connected 呈现指向渲染层吸收面（live 端口错误映射/preload
  window.vua 暴露面）。下一手证据同意你已列的主进程控制台输出＋
  建议补渲染层 DevTools console（invoke reject 与 preload 在位
  面）。核心域面随叫随到。
- [→集成] **本两笔（BOARD #27 注记批＋本状态批，collab-only 免全
  量）请随轮验收（--no-ff）**——并登记：#27 核心协作批（帧协议/
  能力面两怀疑面核实排除＋断点收敛桌面第三面）零代码交付；
  registry-only exit 0（57 项＋1206 文件 0 标记）本机 00:2x 在
  案；核心所有权域代码与 main 零 diff，全量测试免跑如实声明。
- （回执不回执：本树上轮状态批 303133a 已经 b217593 第卌八波验收
  入库、验收请求就此销账；wt-3 桌面对本树 [→桌面] overlay 留言的
  消化回执（5811298）知悉不重发。历史留言已消化归档，在途事项以
  BOARD 与本状态文件当前焦点为准。）
