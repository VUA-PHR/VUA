---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 5372de2
updated: 2026-09-21
---
## 当前焦点
**第 141 批 W25 真机发现修复轮（2026-09-21 01:4x–02:4x，节拍轮工作时段 date 实
测；两笔：修复批 f68ee67 恰 15 文件 1132+/16-＋本状态批恰本文件）——用户指派
任务「素材链缺工程供给步骤」领取并交付；上拍接线批 7361213 经集成第 141 批收
编入库候验收身份闭环（is-ancestor 实测）； F4 链第二环关闭，素材链计划 v0.2
落地候集成验收**：

- **brief ①区消化（轮首实读）**：wt-3/wt-6 两条 F4 知会均系对上拍接线批的
  候领预告——本拍开工时接线批 7361213 已交付在途，预告对象即本树上拍产物，
  就地消化；集成第 141 批收编后双预告关账（下详）。失鲜工作树无。
- **上拍验收闭环（本地实证）**：`git merge-base --is-ancestor 7361213
  origin/main` 亲测通过——集成第 141 批（push 记录 3749253 载「wt-2 quartet」
  四笔收编）已入库本树接线批＋追平壳＋状态批＋订正批；wt-3 F4 形状核可双前
  置（冻结批＋接线批在库）现全成就候其首领即办。另集成订正批 b3581da 已代
  为订正上批接线批所致 brief ④区两条登记表异常（协议本头部状态行括注重排
  词干还原），本树无需重复办理，收讫关账。
- **任务领取与根因对表**：用户指派第 141 批修复 W25 真机新发现（取证链：
  2026-09-20 15:17Z 任务 prod-b345e8a09ff7 error_json=
  `vua.material.bridge_failed: Unity exited unsuccessfully (Some(1))`；
  Editor.log COMMAND LINE 段 `-projectPath …synthetic-avatar-project` →
  `Couldn't set project path`（target/release 前缀拼接畸变系 Unity 对无效
  工程路径的报错形态）→ return code 1；实测目标目录为空目录）。代码面核
  实＝素材链 `material_intake.rs::plan` 步骤集（VerifySource→CreateSnapshot
  →导入/应用臂→Validate→WriteBuildRecord）既无供给条件步骤也无工程有效性
  预检；配方链 `assembly.rs::derive_plan`（条件检查 ProjectVersion.txt＋插
  入 ProvisionProject＋补偿"删除半初始化项目目录后重新计划"）与执行臂
  `backend_create_project`（E-VPM-DUAL 后端端口）为既存先例。快照回滚成功
  （result_json rollback=restored）＝诚实纪律未被破坏，缺陷面纯在计划生成。
- **修复批 f68ee67（恰 15 文件 1132+/16-）**，七项修复要求逐条兑现：
  ①**计划条件化**＝`MaterialIntakeStepKind` 新增 `ProvisionProject`（serde
  snake_case `provision_project`）；`plan()` 增 `project_root: &Path` 参，
  目标无 `ProjectSettings/ProjectVersion.txt` 时在 CreateSnapshot 之后、首
  个工程变更之前插入供给步骤（mutatesTargetProject=true）；已供给工程计划
  与 v0.1 完全相同（零词面变化），条件有无本身即计划内容→哈希不同
  （assembly.rs:19 注释先例素材版钉死）；
  ②**执行路由**＝走既有 `VpmBackend::create_project` 端口（A5 冻结 REQUIRED
  方法，E-VPM-DUAL：vrc-get 库模板拷贝或 VCC `vpm new`；provision.rs Fix 4
  vrc-get CLI 无创建命令维持，零新增 CLI 依赖）；依赖方向核心端口干净——
  unity-bridge 执行器持有其既载的 orchestrator 核心 VpmBackend 端口（装机
  用同端口），project-manager 后端实现之，零适配器横向依赖、零新端口；
  ③**步骤序**＝供给在快照后、导入前；执行时幂等重检（assembly 执行臂同
  款）：审阅与执行之间工程已出现则跳过创建、计划时指纹链照旧；补偿＝供给
  前空态快照恢复（restore 将半初始化内容移入 `.vua/recovery/` 隔离区——
  assembly"删半初始化目录重新计划"语义经既有 verified-snapshot 回滚兑现）；
  **④指纹基线重取（执行臂关键 subtle 面）**＝新建工程状态≠计划时状态，供
  给成功后执行器以只读 Inspect 重读 Unity 侧基线指纹（暂存链 inspect-first
  同律），首个变更命令绑定该基线、绝不携带计划时工程树摘要——否则修复后
  立即撞 `bridge.stale_project`（Unity 侧比对场景指纹 v1:/no-scene，计划侧
  携 sha256: 文件树摘要，永不匹配）；此点请验收重点复核；
  ⑤**词面与 Schema**＝计划 Schema 升版 `schemas/amf-production/v0.2/
  material-plan.schema.json`（plan schemaVersion 0.1→0.2 经新常量
  MATERIAL_PLAN_SCHEMA_VERSION；检查面保持 MATERIAL_INTAKE_SCHEMA_VERSION
  0.1 不变→build-record source 嵌入仍 v0.1 合法，常量拆分最小爆炸半径）；
  步骤枚举闭集九成员；向量 2 正 1 负（未供给计划〔供给步在快照后导入前、
  mutates=true〕／已供给计划〔v0.1 集不变〕／发明步骤种类负例）置
  `vectors/material-plan/` 子目录（顶层 vectors 系 m3_t1 方法向量驱动专用
  形状，子目录零触碰其解析）；消费测试对冻结 Schema 正负校验；
  ⑥**错误面**＝新码 `vua.material.provision_failed`（vua.material 家族规
  则），后端原码（vua.vpm.template_missing 等）随消息 detail 携带不入 code
  键；失败照常发布 Build Record 绝不绕过收据；
  ⑦**文档**＝material-intake 协议本双语 v0.1→v0.2（新文件，v0.1 历史保
  留）：工程供给节七律＋工作流阶段映射表（provision_project→execute，五阶
  段闭集零新阶段）＋桌面呈现诚实注记（桌面消费另批）；REGISTRY 两行（v0.2
  目录行注记扩充＋material-intake-v0.2 行新增）。production-use-case v0.1/
  v0.2 冻结文档零触碰（映射表系 material 线文档辖域，v0.2 增补入新协议本）。
- **测试面**＝新 4 例〔未供给计划含供给步＋位置钉＋已供给孪生计划哈希分
  叉；Schema 向量消费 2 正 1 负；空工程执行序全链（create_project 恰一次
  ＋完成步序六步＋导入命令绑定供给后基线 fp 而非计划指纹）；供给失败诚实
  面（家族码＋后端码溯源＋rollback=Restored＋半初始化 ProjectSettings 从
  目标消失＋隔离区在场＋失败收据发布＋零 Unity 命令）〕；既有 make_world
  类夹具补写 ProjectVersion.txt（原形＝有 ProjectSettings 目录无版本文件，
  在新法则下系未供给——补写还原其本意的已供给语义，其断言零变化即「已供
  给路径完全不变」的存量回归锚）；既有 plan() 调用点 15 处适配新签名
  （provider_host 路由 1 处＋测试 14 处）。
- **定向证据全绿（轮内亲测在案）**：cargo test -p vua-unity-bridge
  **15 套 70/0**（新 4 例）＋vua-provider-host **43 套 288/0** 零涟漪
  （m3_t1 固定向量＋ph_* 十六例全经真实 requestPlan 路由实证零波及）＋
  vua-orchestrator **16 套 234/0** 零涟漪＋clippy 三 crate
  **--all-targets 0 警告**＋desktop typecheck 双 tsconfig exit 0（零 TS
  文件触碰＝TS 面零变更实证，桌面 stages 系 AMF 大阶段轨道不消费步骤
  kind）＋git diff --check 干净＋冲突标记 0。落笔后 merge-tree 预检对
  origin/main（第 141 批世代）exit 0 零冲突（REGISTRY.md 自动合并成功）。
- **诚实边界**：零端到端宣称维持——本批系代码面修复＋fake 端口证据；真机
  复测（选择→检查→计划→确认→执行全链在真引擎走通）归 W25 用户回访项
  （O-2），供给步骤在真机复测通过前不宣称已验证。桌面计划审阅面对供给步
  骤的呈现（阶段列表词面）归桌面消费切片，本批桌面零改动如实申报——当前
  桌面不逐条渲染步骤 kind，用户在真机复测中暂不会在审阅卡看到"创建项目"
  字样，此边界已载入 v0.2 协议本桌面注记节。
- **所有权申报**：unity-bridge 素材面 ride 本批用户指派（第 141 批任务明
  示 material_intake.rs 为修复面且授权按 crate 所有权裁量）；provider-host
  恰一行路由调用；schemas/REGISTRY/协议本系核心冻结义务面
  （production-use-case 契约族）。
- **读数（落笔后实测）**：领先 1（实质 1＝修复批 f68ee67）＋本状态批；落
  后 24（origin/main 第 141 批世代：集成收编 wt-2 四笔＋第 141 批 push 记
  录 3749253＋订正批 b3581da＋VUA-8 pair 0779db0/7d702f8 等簿记轮；实质落
  后 3＝b3581da 簿记脚本与协议本括注＋VUA-8 两笔，未过 15 线）——照同窗
  不追逐判例候验收合并自然吸收，merge-tree 预检 exit 0 实证零冲突。

## 前情（本域链，全文见本文件 git 历史）
上拍（09-21 00:5x–01:4x 三笔）＝F4 wire 接线切片轮〔追平壳 95b0918＋接线
批 7361213＋状态批〕经集成第 141 批收编入库（is-ancestor 在 origin/main）。
更早＝F4 仓库生命周期冻结批 47d4185（第 139 批合并 a3a9d86）。F5 链五环
全闭环。F3/F2 链见 git 历史。

## 本轮交付（5372de2 基线世代）
- **修复批 f68ee67**（恰 15 文件 1132+/16-＝unity-bridge 素材面 6 文件
  ＋provider-host 路由与夹具 2 文件＋Schema v0.2＋向量三件＋双语协议本两
  份＋REGISTRY；详情见当前焦点）。
- **本状态批（恰本文件）**。
- 零新阻塞、零新升级项、零 [需用户]。

## 在途/待他角色
- **[等集成] 候验收（--no-ff）**：实质对象＝**修复批 f68ee67**（恰 15 文
  件 1132+/16-，请 diff 复核或合并树定向复跑，写明「wt-2 W25 供给步骤修
  复批（基线 5372de2）」；重点复核 material_exec.rs 供给臂与指纹基线重
  取）；落后 24 笔簿记世代随验收合并自然吸收勿单独办理。
- **[等桌面] 供给步骤呈现消费切片**（另批）：桌面计划审阅面对
  provision_project 步骤的用户可见呈现（阶段列表/审阅卡词面）；桌面当前
  不渲染步骤 kind，真机复测前消费批落地则用户可感知"创建项目"语义。
- **[等环境/后续] F4 实现核对切片**照操作者注面序候其席位（接线批已入
  库，其双前置全成就）。
- **[等用户] W25 开窗（O-2）续**：素材链全链真机复测（本修复的对象场景：
  选择 Meiyun_v2.1.0→开始检查→生成执行计划→确认计划并执行，目标为空工
  程目录时应呈现含供给步骤的计划并成功创建工程后导入）；026/027 全链＋
  F2/F3/F5 served 行真机呈现随全链。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝修复批 f68ee67（实质，--no-ff，写明「wt-2 W25 供给步骤修复
批（基线 5372de2）」）＋本状态批恰本文件。**提交后读数（rev-list 实测）：
领先 2（实质 1＝修复批＋本状态批 collab 面），落后 24（origin/main 第 141
批世代，实质 3 未过线，候验收合并自然吸收）。

## 待命声明（第 6 步，如实）
本轮（2026-09-21 01:4x–02:4x，节拍轮工作时段 date 实测；两笔：修复批
f68ee67＋本状态批）：①date 实测工作时段，pnpm collab:brief ①区两条 F4
知会就地消化（均系上拍接线批候领预告，预告对象已交付在途）；②上拍验收
闭环＝7361213 is-ancestor 在 origin/main 亲测通过（集成第 141 批 wt-2
quartet 收编），候验收身份关闭；集成订正批 b3581da 代订上批④区两条异常
收讫关账勿重复；③用户指派第 141 批任务领取＝W25 真机发现（素材链缺工程
供给步骤），取证链与根因对照配方链先例核实，七项修复要求逐条兑现交付
修复批 f68ee67（条件化计划＋既有端口路由＋步骤序与补偿＋指纹基线重取＋
Schema v0.2 与向量＋诚实错误面＋双语协议本与 REGISTRY）；④定向证据亲测
全绿：unity-bridge 15 套 70/0（新 4）＋provider-host 43 套 288/0 零涟漪
＋orchestrator 16 套 234/0 零涟漪＋clippy 三 crate --all-targets 0 警告
＋typecheck 双 0＋diff-check 干净＋冲突标记 0＋merge-tree 预检 exit 0；
⑤诚实边界维持：零端到端宣称——代码面修复＋fake 端口证据，真机复测归
W25（O-2）；桌面呈现另批如实申报；[需用户] 条目照规则跳过未代决；在手
无半途切片、除本状态批外无未提交改动。退出待命，候集成验收修复批、桌面
消费切片、W25 用户开窗复测、下轮 brief 或新指派。

## 留言
- [→集成] 验收请求：**候验收实质对象＝修复批 f68ee67（恰 15 文件
  1132+/16-＝unity-bridge 素材面 material_intake/material_exec＋测试四文
  件、provider-host 路由一行与夹具、schemas/amf-production/v0.2 计划
  Schema＋向量子目录三件、material-intake-v0.2 双语协议本、REGISTRY 两
  行），请随轮验收（--no-ff），写明「wt-2 W25 供给步骤修复批（基线
  5372de2）」**；定向证据亲测全绿在案〔unity-bridge 70/0＋provider-host
  288/0 零涟漪＋orchestrator 234/0 零涟漪＋clippy 0＋typecheck 双 0〕。
  **重点复核一处**：material_exec.rs `run_provision` 的指纹基线重取（供
  给后以只读 Inspect 重读 Unity 侧场景指纹绑定后续变更命令——Unity 侧指
  纹系场景哈希 v1:/no-scene 而计划侧系文件树摘要 sha256:，若无此重取则
  修复后首条导入命令必撞 bridge.stale_project；暂存链 inspect-first 同
  律）。merge-tree 预检 exit 0 零冲突，落后 24 簿记世代随验收合并自然
  收编。零端到端宣称维持——真机复测归 W25。
- [→桌面]（知会）素材链计划 v0.2 的 provision_project 步骤已入词面，桌
  面计划审阅面的步骤呈现（阶段列表"创建项目"语义）候你席消费切片办理；
  当前桌面不逐条渲染步骤 kind 零强制影响（typecheck 双 0 实证）；v0.2 协
  议本桌面注记节已载明该边界。
- [→操作者] 第 141 批任务交付完毕：W25 真机发现（素材链缺工程供给步骤）
  代码面修复＋fake 端口证据在案；**真机复测（空工程目录走素材驱动全链）
  维持 W25 用户回访项（O-2）**，复测通过前不宣称端到端——请纳入 W25 窗
  口走查脚本（wt-4 A2 段脚本已按素材驱动链订正在案）。
- （回执不回执：brief ①区 wt-3/wt-6 两条 F4 知会收讫消化关账；历史留言
  已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
