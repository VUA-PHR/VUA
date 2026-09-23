---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 6e706e7d
updated: 2026-09-24
---
## 当前焦点
**第 183 批（2026-09-24 04:5x–05:5x，节拍轮正常工作时段 date 实测 04:56；
两笔：实现批＝#43 路径形态族产线域新成员域内修复＋恰本状态批；无追平壳
——轮首 `git merge --ff-only main` 纯快进至 6e706e7d 零新提交）**——collab
队列全空（BG 工单全销账、#45(3) 闭环、029/030/031 均裁决收口、其余全
[需用户] 跳过），按窗口规程规则 2（空队列不空转）执行**产线所有权域自我
反向审查**（先例＝第 148 批），五面审查、一发现即修：

- **审查①（S2 取消观察位边界条件，material_exec.rs 实读）＝无缺陷**：
  token 单次执行不重置不跨任务泄漏（:135–155）；create→resolve 间观察位
  骑既有失败臂（快照回滚→Cancelled 收据，零补偿臂变化）；尾段两观察位
  落 publish 后 register/preview 前＋preview/apply 间（发布 artifact 在
  项目外的诚实事实测试钉死维持）；`local_vpm` 证据仅在 apply 成功后置位
  （:1049）——全部取消路径 None＝诚实缺席；执行体末道取消检查（:452）
  使任何时点到达的取消都落 Cancelled 收据＋回滚；restore 失败诚实覆盖
  Cancelled→Failed（rollback_failed 码，最坏结果不吞）；Cancelled 收据
  永不重放为成功（:270 仅 Succeeded＋同身份）；已决定取消后的最坏在飞
  工作面＝一次只读 inspect／staging 一次性变异／已登记的 artifact 保留
  面，均与设计登记口径一致。resolve 腿中段不可中断＝端口面冻结＋lib
  后端 block_on 物理无效，三层谱系维持。
- **审查②（#43 路径形态族产线域全部处理点）＝发现一新成员，已修**：
  **staging 目录名直接内插未校验的 session_id（＝客户端可控的确认
  correlationId）**。信任链实证：application 帧层 `correlationId`（
  provider_host.rs:1249 帧读取，无词面校验，缺失兜底字面 "invalid"）→
  `production.confirmPlan`/`production.recover` → `MaterialIntakeConfirm
  ationV01.correlation_id`（provider_host.rs:9582 原样透传）→
  `run_local_reusable`/prodjob staging 腿 → `StagingProject::create(
  session_id)` → `temp_root.join(format!("VUA_Staging_{session_id}"))`——
  含 `/`、`\`、`..`、盘符/`\\?\` verbatim 前缀、空白或超长的 id 可逃逸
  temp root 或物化路径敌意目录。与 synthetic-avatar-project 事故族同构
  （路径形态在处理点未守卫）。**修复（域内小修）**＝`staging_root` 命名
  点词面守卫：闭集 `^[A-Za-z0-9_-]{1,128}$`（与 Bridge C# commandId 语法
  同族；uuid-v7/`task-*`/`material-<hex>` 全部满足），签名改
  `io::Result<PathBuf>`，`create`/`create_from_template` 以 `?` 传播——
  宿敌 id 在**任何目录创建之前**被拒，骑既有失败臂（STAGING_FAILED→
  快照回滚→Failed 收据）诚实失败；错误只携带长度不回显宿敌值（不回流
  收据/日志）。**新钉两例**（tests/material_staging.rs）：宿敌九形态全拒
  ＋create 不触文件系统＋错误不回显；合法六形态（现网全部身份形态）全放
  行。测试调用点适配四处（material_exec.rs 一处＋material_exec_real.rs
  三处，全部 `#[ignore]` 真机件，词面均合法只补 expect）。
  其余处理点逐一排查＝干净：material_identity 键面（canonicalize＋小写
  化摘要，verbatim 前缀不出函数域、8.3/盘符大小写归一）；intake 扫描
  `normalized_relative`（strip_prefix＋Normal 组件过滤）；command_id/
  snapshot_id/record_id（plan_id 十六进制派生）；publish_local_vpm_
  artifact（package_id 机器生成 ASCII＋版本字面量）；handoff 握手文件
  （固定组件拼接）。
- **审查③（#45 族产线域收口面完好性）＝零削弱**：Packages/ 通道边界双
  闸在位——intake 预检（material_intake.rs:512–521）＋执行臂解包第一遍
  整体拒绝（material_exec.rs:1366）；loadedAssetPaths 严格解析
  （loaded_asset_paths_evidence :1506–1513，缺字段/非数组/非字符串一律
  None→诚实失败）；C# 面守卫句顺序纪律维持——BridgeCommandProcessor.cs
  :269–270/:383 双前缀接受休眠面原样（B 案注记口径，A 案归 W25），本批
  C# 零触碰。
- **审查④（030 保守提取器与 material-intake 面路径安全）＝干净**：
  dependency_extract 系纯文本解析器（零文件系统触碰、零网络，与第 179
  批「纯解析器」验收一致，zip-slip 面不适用）；素材 .unitypackage tar
  解包第 148 批组件级守卫在位（:1402–1414 Prefix/RootDir/ParentDir 全
  拒、反斜杠归一先于判定、跳过条目不入 manifest）。
- **审查⑤（诚实纪律自查）＝一致**：快照回滚/补偿臂语义与实现逐点吻合
  （①详列）；失败如实呈现（restore 失败覆盖收据状态；错误携带后端原
  码）；**零端到端宣称**——本批修复系代码面＋仓内测试钉死，staging 守
  卫的真机行为未行使（真机取消链路与真机 staging 全链归 W25），测试绿
  ≠真机绿。
- **红线（全程维持）**：docs/ schemas/ 零触碰；已冻结词面（unity-bridge
  v4、amf-production v0.2、material-intake 0.2.x）零字节触碰；端口词面
  零变更（VpmBackend 零 diff）；deleteOriginals 零触发；用户素材目录只
  读零写入；VUA-7 阅读解禁零触碰、VUA-8 零触碰；[需用户] 条目零代决；
  BOARD 不直改（#43 行注记一句折入请集成随验收办理）。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 182 批（09-23 04:0x–05:0x）＝#45(3) S2 取消观察位实现切片
（0673ab10＋追平壳 6a2f0973，端口词面零变更，已随集成第 183 批 PR #15
入库）；第 178 批＝030 提取管线实现环（817a5fa6＋3f176e7d，已随集成
第 179 批入库）；第 176 批＝030 重新规格化注记（已随集成第 178 批 PR
#12 入库）；第 174 批＝dependencies.* v0.5 真实执行器环；第 168 批＝
030 store v0.2 落库实现环；第 154 批＝#46 立项起草。更早见 BOARD 前录
与 git 历史。

## 本轮交付（6e706e7d 基线世代）
- **追平**：`git merge --ff-only main` 4b92e6e1→6e706e7d 纯快进（落后
  12/领先 0 归零，无追平壳提交）。
- **本批（实现批）**：`crates/unity-bridge/src/material_staging.rs`（
  staging_root 词面守卫＋io::Result 签名＋validate_session_id）＋
  `crates/unity-bridge/tests/material_staging.rs`（新钉两例）＋
  `crates/unity-bridge/tests/material_exec.rs`（一处调用点适配）＋
  `crates/unity-bridge/tests/material_exec_real.rs`（三处调用点适配，
  全部 #[ignore] 真机件）＝恰四 tracked 文件，全在本席所有权域。
- **验证读数（2026-09-24 本树亲测）**：material_staging 3/3（含本批
  2 例）；unity-bridge 全 crate 绿（material_exec 25/25 维持＝既有测试
  零行为变化）；`cargo test --workspace` **976/0**（第 182 批基线 974
  ＋恰本批 2 例，112 套件）；clippy `--workspace --all-targets` **零警
  告**（exit 0 复核）。零 Unity Editor 触发、零网络动作、零 BOOTH 访问。
- **brief ①区甄别结论（过时留言，零待办）**：指向本席两条——wt-3
  [→wt-4] 两处勘误知会（第 176 批状态批 v4 逐名＋amf-unity 版本词）系
  wt-3 第 178 批已办结事项的留痕知会，随本批追平已吸收；wt-8 [→产线]
  R1–R3 知会系 2026-09-21 用户授权合并 06ec6390 世代事项，早已入库。
  派定所指 wt-2/3/4/5 四条验收请求残言经集成第 184 批分叉表复证领先 0
  系世代滞后，零重复验收、零待办。

## 在途/候办
- **[候集成·验收] 本拍两笔**（实现批＋本状态批），写明「wt-4 第 183 批
  （#43 族 staging 路径守卫域内修复＋空队列反向审查五面结论；基线
  6e706e7d）」。代码批全量门禁已附（976/0＋clippy 零警告）。
- **[知会集成] BOARD #43 行注记一句折入**（你席维护，本树不直改）：
  第 183 批产线反向审查发现并修复同族新成员＝staging session_id（客户
  端可控 correlationId 直入目录名）词面守卫，域内修复＋测试钉死，真机
  行使随 W25，复验口径不变。
- **[候操作者派发] 030 剩余**：人工确认面（候选→确认工作流实施面）；
  输入源接线/旗标/旗标 UI＝候新提案（U18 终裁后）。
- **[等操作者/用户] W25 正式执行**（A3 段 Unity 侧核证义务在肩；真机取
  消链路＋本批守卫真机行使随 W25）。

## 阻塞
- 无阻塞。零猜测项。

## 下次合并意图
**候验收对象＝本拍两笔（实现批＋本状态批）**＝产线域代码批：实现批恰
四 tracked 文件（material_staging.rs＋三个测试文件），全在本席所有权
域；本批无追平壳（轮首 ff-only 纯快进零新提交）。验证读数：workspace
976/0＋clippy 零警告（2026-09-24 本树实测）。请集成随轮验收（--no-ff
经 PR），写明「wt-4 第 183 批（#43 族 staging 路径守卫域内修复＋空队
列反向审查；基线 6e706e7d）」。

## 待命声明（第 6 步，如实）
本轮（2026-09-24 04:5x 起，正常工作时段 date 04:56 实测；两笔：实现批
＋状态批）：①date 04:56 实测正常时段；读 collab/PROTECTED_MAIN.md 后
跑 pnpm collab:brief，①区判读＝指向本席两条留言经甄别均为已消化过时
留言（详见本轮交付段），失鲜工作树无；②轮首追平＝ff-only 纯快进
4b92e6e1→6e706e7d，无追平壳；③领取＝窗口规程规则 2 空队列自我反向审
查（先例第 148 批），五面审查素材实读（material_exec.rs S2 全段＋
material_identity/material_intake/material_staging/local_vpm_artifact/
handoff＋bdl-store dependency_extract＋BridgeCommandProcessor.cs 守卫
句＋provider_host.rs correlationId 信任链四点定位）；④一发现即修＝
staging_root 词面守卫（域内小修，宿敌 id 任何目录创建前拒绝、骑既有
失败臂诚实失败、错误不回显宿敌值）＋新钉两例＋测试调用点四处适配；
⑤测试全绿才提交：material_staging 3/3＋unity-bridge 全 crate 绿＋
workspace 976/0（112 套件）＋clippy --workspace --all-targets 零警告
（exit 0 复核）；⑥诚实边界维持＝零端到端宣称（真机取消链路与守卫真
机行使随 W25）、端口词面零变更、冻结词面零触碰、docs/schemas 零触碰、
VUA-7 阅读解禁零触碰、VUA-8 零触碰、[需用户] 条目零代决、BOARD 不直
改。在手无半途切片、除本状态批外无未提交改动。退出待命，候集成验收
本批、030 确认面候派、W25 窗口推进。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍两笔（实现批＋本状态批），写明
  「wt-4 第 183 批（#43 族 staging 路径守卫域内修复＋空队列反向审查五
  面结论；基线 6e706e7d）」**。重点复核面：①staging 守卫信任链四点
  （provider_host.rs:1249/9582→MaterialIntakeConfirmationV01→
  StagingProject::create→staging_root）；②闭集 `^[A-Za-z0-9_-]{1,128}$`
  与 C# commandId 同族、现网全部身份形态放行；③宿敌 id 拒绝先于任何
  文件系统写入＋STAGING_FAILED 既有失败臂零补偿臂变化；④既有测试零行
  为变化（material_exec 25/25 维持，workspace 974→976 恰＋2 自洽）。
  另请随验收将 #43 行注记一句折入 BOARD（见在途段）。
- （回执不回执：①区 wt-3/wt-8 两条指向本席留言经甄别系已消化过时留
  言，零待办；在途事项以 BOARD 与本状态文件当前焦点为准。）
