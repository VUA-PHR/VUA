---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: be16708
updated: 2026-09-20
---
## 当前焦点
**操作者批（W25 真机窗口 live 发现，时段例外延续）——环境检测两探针缺陷修复
轮（2026-09-20 03:2x–04:0x；三笔：追平壳吸收 main be16708＋修复批
1602ed4＋本状态批恰本文件）。E-1＝unity_hub 候选路径列表化＋注册表
DisplayIcon 兜底；E-2＝vpm_cli 行语义重构为「VPM 能力」且 id 改名
vpm_cli→vpm（裁决与理由见下）；冻结词面同步面全数同批落地；定向证据全
绿亲测；上拍候验收三笔（629699e＋fabb04d＋状态批）经第 124 批登记收编
入库、身份关闭**：

- **追平壳（TICK 第 4 步开工纪律）**：--no-ff 吸收 main be16708（第 124
  批登记＋W25 窗口各树簿记＋outline 2.0.13），inbound 10 文件全 collab
  ＋outline 文档面、零代码，基线刷新 **be16708**。**上拍验收回执就地关
  账**：is-ancestor 实测接线批 629699e 已入 main（随第 124 批「四个
  collab-only 候验收批收编」），候验收对象三笔身份关闭，勿重复验收；
  状态批书写的「F3 条件未成就」判定在验收时点已翻转照实补记——
  **629699e 在库＝F3 领取条件成就（本拍 04:0x 复核）**，F3 照既定程序
  下拍领取（本拍全力在操作者批，未抢领）。
- **缺陷 E-1（unity_hub 漏检）修复**：缺陷本体＝探针只查
  `%LOCALAPPDATA%\Programs\Unity Hub\Unity Hub.exe`，用户机器级安装
  漏检（本机只读复核 2026-09-20：`C:\Program Files\Unity Hub\Unity
  Hub.exe` 在位 210MB、per-user 位缺席＝与用户截图实证一致）。修复＝
  `EnvironmentRoots.unity_hub_exe: PathBuf` →
  `unity_hub_exe_candidates: Vec<PathBuf>`（用户级位在前、机器级
  `C:\Program Files\Unity Hub` 在后）＋新增
  `unity_hub_registry_display_icon_keys: Vec<(RegistryHive, String)>`
  走既有 win_registry 注入口点查 Uninstall 键 `DisplayIcon`
  （HKCU／HKLM／WOW6432Node 三候选，子键名 `Unity Technologies - Hub`
  系本机只读实测所得真键名）；DisplayIcon 解析剥引号与 `,<图标索引>`
  后缀（本机实测值形 `C:\...\Unity Hub.exe,0` 即此形）；任一命中即
  Detected，facts 记录 `{exe: 命中路径, via: path|registry,
  registryKey?}`；未命中如实记录探测过的
  `{candidates, registryKeys}` 列表（空态即终态）。
- **缺陷 E-2（vpm_cli 行语义错位）修复＋id 裁决**：缺陷本体＝
  `check_vpm_cli` 跑 `vrc-get --version` 要求独立 CLI——但 VUA 架构＝
  内嵌 vrc-get-vpm 0.0.16 库（Cargo.lock 钉版），独立 CLI 从非前置
  （用户裁决 2026-09-20：「没有 ALCOM 或者没有 VCC 不应作为阻塞」＋
  库优先架构事实）。修复＝行语义重构为「VPM 能力」：内嵌库恒在＝
  Detected 恒真，version 照钉版如实呈现（新增 pub 常量
  `EMBEDDED_VRC_GET_VPM_VERSION = "0.0.16"`，**Cargo.lock 解析回归测试
  钉死两者不漂移**）；独立 CLI 若在仅作附加信息 facts
  `{standaloneCli: {state: detected|not_detected|detection_failed,
  exe, version?, exitCode?}}`，任何 CLI 结果不降条目、不带条目级
  错误码。**id 裁决＝改名 `vpm_cli` → `vpm`**，理由：①词面诚实——
  保留 vpm_cli 会让冻结词面继续指称一个已非前置、非被测物的 CLI；
  ②同域先例——姊妹项 `vcc` 即以能力命名（非以访问器命名），`vpm`
  与之对齐；③线面无损——application-contract 的 `checkId` 为开集
  string（TS 面实读），id 闭集无机器可读 schema，两侧测试钉闭集即可，
  旧快照含 vpm_cli 仍类型通过、桌面投影对未知 id 设计性透传＝无
  wire 形状变更、无契约版本升降；**同步面清单（全在本批）**＝
  orchestrator inspect_zone＋zone 闭集测试表（orchestrator tests）、
  桌面 CHECK_TITLE_KEYS（contract-projection.ts `vpm: "vpm"`）＋
  投影测试 engineIds/keyOf、四语 i18n checks 键 vpmCli→vpm＋能力
  题名（EN/ZH/JA/KO 四文件）、模块 doc 中文逐项说明；跨域触碰申报＝
  desktop 6 文件（任务明文授权的 CHECK_TITLE_KEYS/向量/词面同步面）
  ＋project-manager 测试夹具 1 文件（roots 字段变更的机械后果）。
- **诚实边界与残留**：`error_codes::PROBE_FAILED` 现为定义但无发射方
  （vpm 超时改为 facts 内信息态、不再产生条目级 detection_failed），
  常量保留于稳定错误码命名空间未删除；真机复检＝用户 W25 窗自身动作
  （本轮只读 reg query／dir 清单仅为缺陷实证与键名取证，不构成端到端
  宣称），**零端到端宣称维持**。
- **定向证据（本拍亲测全绿）**：orchestrator environment 套件
  **22/22**（新增 4 测试＝Hub 双候选命中/未命中＋注册表 DisplayIcon
  三形状命中＋不存在路径落空＋Cargo.lock 钉版锁步＋vpm 内嵌库恒真跨
  四种 CLI 结局）；vua-orchestrator 全 crate 16 套件 0 失败；
  provider-host environment_snapshot_wire 2/2；project-manager
  environment_engine 1/1；clippy 三 crate --all-targets exit 0 零
  警告；desktop typecheck 双 0（两 tsconfig exit 0）；
  contract-projection vitest 17/17；check:i18n 表对齐 OK。

## 前情（本域链，全文见本文件 git 历史）
上拍（09-20 01:4x–01:5x 三笔）＝027 F2 接线批修正＋登记表一致性轮：
追平壳 61f20ba＋修正批 fabb04d＋状态批——三笔已随第 124 批收编入库
（is-ancestor 实测），本拍追平壳吸收后身份全部关闭。更早：接线批
629699e、冻结批 c46545f（第 122 批 item 1 验收）见 git 历史。

## 本轮交付（be16708 基线世代）
- **追平壳**（--no-ff 吸收 main be16708＝第 124 批登记世代，inbound
  10 文件全 collab/outline 面零代码，预检零冲突，基线刷新 be16708；
  上拍候验收三笔随吸收关闭）。
- **修复批 1602ed4**（恰 11 文件 406+/93-：核心域 environment.rs＋
  lib.rs 导出＋orchestrator 测试＋provider-host/project-manager 测试
  夹具＋desktop 投影面 2 文件＋i18n 四语；E-1/E-2 本体＋冻结词面同步
  ＋新增测试 4 项，详见当前焦点）。
- **本状态批（恰本文件）**。
- 零新阻塞、零新升级项。

## 在途/待他角色
- **[等环境] F2 实现核对切片**：解锁条件已全成就（冻结批＋接线批＋
  第 124 批解锁复核），候环境角色按 025/026 程序领取；本批 vpm 恒真
  行为与其 VrcGetLibBackend 实现核对无冲突（served 行不可用事实照旧，
  027 文档面未被本批触碰）。
- **[等桌面] F2 形状核可＋消费切片**：程序照旧；本批 CHECK_TITLE_KEYS
  与 i18n 键改名属桌面同步面、已随本批落地，投影测试 17/17 亲测绿，
  桌面后续形状核可读到的是改名后的 `vpm` 键面。
- **核心下拍可领项**：**F3（packages-query v0.2 已装表更新感知冻结批）
  条件已成就**（629699e 在库，本拍 is-ancestor 复核）——下拍领取；
  F4 刷新写面（ops v0.6）启停面硬前置已由 wt-6 W25 只读核实成就
  （判 (c)：VCC 无启停位＋自有键不入 userRepos[i] 元素设计提示），
  候面序排后。
- [等用户] W25 开窗（O-2）续：026/027 全链真机走查与本批探针修复的
  真机复检同窗办理。
- F5 冻结批照面序候后续节拍。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝三笔（--no-ff）：追平壳＋修复批 1602ed4＋本状态批，请
集成随轮验收，写明「wt-2 环境检测探针修复批（W25 实测 E-1/E-2，基点
be16708）」。**提交后读数（rev-list 实测）：领先 2（修复批 1602ed4＝
实质 1＋本状态批；追平壳零自有）、落后 0（be16708 世代）；本拍合并
执行时 main 无新前进。实质非 collab 面＝恰 11 文件（核心域 5＋
desktop 6——其中 project-manager 夹具 1 系机械同步），请 diff 复核
或合并树定向复跑酌定（证据读数见当前焦点）。

## 待命声明（第 6 步，如实）
本轮（2026-09-20 03:2x–04:0x，操作者批／W25 真机窗口时段例外；三笔：
追平壳＋1602ed4＋本状态批）：①brief 03:26 实读，①区两条指向本树/
本角色留言（wt-main F2 冻结批验收回执、wt-6 F4 启停面解锁回执）就地
消化——前者系上拍已消化事实的登记世代（验收回执随第 124 批入库），
后者记入在途（F4 硬前置成就，判 (c) 键名事实采信入档）；失鲜工作树
无；②领任务＝操作者批明派 E-1/E-2 探针修复（crates/orchestrator
核心所有权域），四环全查无竞速冲突；③追平壳先行使基线刷新 be16708
（TICK 第 4 步），上拍候验收三笔 is-ancestor 实测在库、身份关闭；
④修复批 1602ed4＝E-1 候选列表＋注册表 DisplayIcon 兜底（键名经本机
只读取证）＋E-2 VPM 能力重构＋id 改名 vpm（裁决与同步面清单见当前
焦点）＋新增测试 4 项；⑤定向证据亲测全绿（清单见当前焦点），全链
为本拍亲自执行非继承；⑥F3 未抢领如实申报（操作者批全力办理，条件
成就状态已登记、下拍领取）；⑦诚实边界＝本机 reg query/dir 只读
取证不冒充端到端、零端到端宣称维持、PROBE_FAILED 无发射方如实
登记。在手无半途切片、除本状态批外无未提交改动。退出待命，候集成
验收三笔、下拍领 F3、下轮 brief 或新指派。

## 留言
- [→集成] 验收请求：**候验收对象＝追平壳＋修复批 1602ed4（恰 11 文件
  406+/93-，实质＝核心域 environment.rs 探针修复＋冻结词面同步面）＋
  本状态批，请随轮验收（--no-ff），写明「wt-2 环境检测探针修复批
  （W25 实测 E-1/E-2，基点 be16708）」。**本批依据＝操作者批明派＋
  用户 W25 实测（2026-09-20 03:03 检测报告＋截图）＋用户裁决
  2026-09-20（无 ALCOM/VCC 不阻塞）；id 改名 vpm_cli→vpm 系核心对
  冻结词面的演进裁决（理由与同步面清单见状态文件当前焦点），线面
  无形状变更无契约版本升降；定向证据全绿亲测（environment 22/22
  含新增 4 测试＋全 crate 16 套件 0 失败＋clippy 三 crate 0 警告＋
  typecheck 双 0＋投影 vitest 17/17＋i18n 对齐），真机复检留 W25
  用户窗，零端到端宣称。上拍三笔已入库勿重复验收。无新请求。
- [→桌面]（知会）本批在你方域落地 6 文件机械同步：CHECK_TITLE_KEYS
  `vpm_cli: "vpmCli"` → `vpm: "vpm"`、投影测试 engineIds/keyOf 同步、
  四语 checks 键 vpmCli→vpm（题名改为「VPM 能力（内嵌 vrc-get-vpm）」
  族）；投影 vitest 17/17＋typecheck 双 0＋check:i18n 亲测绿。后续
  形状核可与消费切片读到 `vpm` 键面；`unity_hub` facts 形状升级
  （candidates/registryKeys/via）如需展示细化照 core 域 facts 开集
  消费即可，无阻塞。
- [→环境]（知会）F2 实现核对切片解锁条件全成就，可领取；另：本批
  vpm 检查（原 vpm_cli）语义已改为「内嵌库恒在＝Detected 恒真＋独立
  CLI 信息性 facts」，与你方 VrcGetLibBackend 实现核对切片的能力门控
  事实对表时以此为准（027 文档面 served 行不可用事实未被本批触碰）。
- （回执不回执：第 124 批登记、wt-3/wt-4/wt-6 簿记随追平壳吸收；
  历史留言已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
