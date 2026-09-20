---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 8e90a42
updated: 2026-09-21
---
## 当前焦点
**第 146 批供给依赖解析批（2026-09-21 04:4x–05:5x，节拍轮工作时段 date 实测；
两笔：实现批 70f7476 恰 40 文件 987+/36-＋本状态批恰本文件）——操作者派单
「供给步骤补 SDK 依赖解析（端口面＋素材链接线）」领取并交付；上拍修复批
f68ee67 经集成第 142 批收编入库（is-ancestor 实测，轮首追平壳 e8104a8 吸收
第 142–145 批世代）**：

- **brief ①区消化（轮首实读）**：无指向本树/本角色的阻塞与留言；wt-main
  状态批第 145 批收官（027 F1–F5 全落地冻结）。本树落后 24 追平为 0（追平
  壳 e8104a8，纯吸收零自有内容），修复批 f68ee67 收编身份经 is-ancestor
  亲测闭环。失鲜工作树无。
- **任务背景对表**：用户裁决（2026-09-21）"先做好 SDK 的导入再真机验收"。
  昨夜入库事实＝素材链供给步骤（material_intake v0.2 ProvisionProject＋
  material_exec run_provision）从 VCC Avatar 模板拷贝创建工程，模板
  `Packages/vpm-manifest.json` 声明 `com.vrchat.base ~3.10.x`＋
  `com.vrchat.avatars ~3.10.x`，但创建是纯 `copy_tree`——依赖只声明不落地
  ，SDK 包体不在 Packages 里。派单四项（端口面钉底＋素材链接线＋计划词面
  诚实＋mock/测试）逐条兑现如下。
- **①端口面（派单钉底版本；环境座按此并行实现，验收时集成核对两树对齐）
  **＝`VpmBackend` trait 新增 `fn resolve_project(&self, project_root:
  &Path) -> Result<ResolveReceiptV01, AppErrorV1>`；`ResolveReceiptV01`
  家族常量 `RESOLVE_RECEIPT_SCHEMA_VERSION = "vua.vpm-resolve-receipt/v0.1"
  `，字段恰最小闭集三件：`resolved: Vec<{id, version, source_repo}>`（
  source_repo 取订阅行 id、缺席回落 name、本地来源记录 "local"）／
  `already_satisfied: Vec<String>`／`failed: Vec<{id, reason_code}>`。能力
  位＝`VpmCapabilities` 新增独立 `resolve_project: bool`——恰系结构注释里
  既有预留点（"resolve 在后端补上对应方法时才加入此结构——ORC-DEV-004
  禁止预留无实现的能力位"），本批随方法落地一并关闭预留；trait-default
  缺席臂返回 capability_missing 家族（既有 unsupported() 臂同形）。
  **语义**＝读工程声明依赖→从**启用仓库**解析（禁用集语义与 F4
  collection_world 完全一致）→落包进 Packages、locked 段回写（库
  apply_pending_changes 内含 save）；幂等（locked 已满足→already_satisfied
  ，零写动作）；**零新错误码**（backend_unavailable 环境腿经共享构造器
  backend_unavailable_state／no_matching_package 映射进 failed 逐依赖条目
  ／apply_failed 安装腿／project_load_failed 工程腿；库 non_exhaustive
  未知变体按 backend_unavailable 如实拒绝绝不猜测）。
- **②实现面（VrcGetLibBackend 覆写 true；VccCli 不覆写）**＝骑既有
  preview/apply 同款装载骨架（collection_world 过滤→在线 load 失败降级
  load_cache〔ORC-ADP-006 同律〕→UnityProject::load→should_resolve／
  resolve_request／apply_pending_changes）；VccCli 无 resolve 命令如实
  declared-none，缺席臂拒绝。全库 `VpmCapabilities` 字面量机械补位（2 后
  端＋48 处 fake/夹具，跨 orchestrator/project-manager/unity-bridge/
  provider-host/acquisition——契约位新增的纯编译涟漪零行为变更；
  **acquisition 一处系本席域外机械补位，如实申报请集成核对**）。
- **③素材链接线**＝`run_provision` 在 create_project 成功后、基线指纹重
  取之前调用 resolve_project——**接线序：create→resolve→指纹重取**，指
  纹覆盖落包后的最终态；**仅新建路径调用**（幂等重检在函数头部先行返回
  ，已供给工程零 resolve 调用——最小爆炸半径，该路径行为与第 146 批之前
  逐字节相同；此决定与理由已写入提交说明）；resolve 失败走既有
  `vua.material.provision_failed` 包装臂如实上浮携原码（后端 Err 臂携
  error.code，capability_missing 同臂——CLI 后端下新建供给如实失败绝不假
  装成功；收据 failed 集非空臂携首个依赖的 reason_code＋id）；两臂失败
  均照常空态快照补偿（半供给内容移入 `.vua/recovery` 隔离区）＋失败收据
  照常发布。resolve 收据系供给内部步骤事实面，**gateway 方法零新增、
  wire 形状零变化、provider_host.rs 路由零触碰**（派单明示不经桌面网关
  暴露）。
- **④计划词面诚实**＝计划 Schema **零触碰**（provision_project 仍是一个
  kind，闭集九成员不变——描述是数据）；material-intake 协议本双语
  **0.2→0.2.1 仅注记**（文档版本升 0.2.1，状态词干「已冻结/FROZEN」保持
  ＋第 146 批括注；工程供给节新增「依赖解析（v0.2.1 增补，第 146 批）」
  要点——"解析并下载工程声明的 SDK 依赖（网络操作）"词面如实、
  vua.vpm-resolve-receipt/v0.1 收据不经桌面网关暴露；指纹基线重取要点补
  钉「重取固定在依赖解析之后」；错误面要点补 failed 集非空臂）；REGISTRY
  行同步（版本 0.2.1＋括注扩充）；未供给向量 description 照实更新（数据
  面，instance 不变仍过校验）；material_intake.rs／run_provision doc 注
  释同步语义。
- **⑤测试面＋6 例**＝project-manager 库面 3 例实证**真实现**三臂（声明
  本地包解析安装：Packages/ 落地＋locked 回写＋收据含 id/version/
  source_repo="local"；二次 resolve 回答 already_satisfied＝幂等；不可解
  析依赖回答诚实 failed 收据 reason_code=no_matching_package 且零安装；
  CLI 能力位 false＋调用回 capability_missing）；unity-bridge 执行面 3
  回归（新建路径 resolve 恰一次＋**序证明**＝CreatingVpm resolve 臂投放
  哨兵文件 `.vua/batch146-resolve-marker`、FakeBridge 逐命令记录哨兵在
  场事实、断言首条 Bridge 命令〔基线重取〕记录时哨兵已在场＝resolve 先
  于指纹重取；resolve 不完整诚实面＝provision_failed 携
  no_matching_package＋依赖 id＋rollback=Restored＋隔离区在场＋失败收据
  ＋零 Unity 命令；能力缺席臂＝provision_failed 携 capability_missing）；
  既有空目标测试加强断言 resolves==1；FakeBridgeState 扩
  resolve_marker_seen 字段（index 与 commands 配对，既有测试零影响）。
- **定向证据全绿（轮内亲测在案）**：cargo test 四 crate **742/0**
  （orchestrator 234/0 零涟漪＋project-manager **143**/0＝存量 140＋新 3
  ＋unity-bridge **77**/0＝存量 74＋新 3＋provider-host **288**/0 零涟漪
  ＝wire/词面零变化实证）＋clippy 五 crate（含 acquisition 机械位）
  **--all-targets 0 警告**＋desktop typecheck 双 tsconfig exit 0（零 TS
  文件触碰）＋git diff --check 干净＋冲突标记 0＋merge-tree 预检对
  origin/main exit 0 零冲突。读数（落笔前实测）：落后 0，领先 2（实质 1
  ＝实现批＋本状态批）。
- **诚实边界**：零端到端宣称维持——本批系端口面＋实现＋接线＋fake 端口
  与库面证据；"带 SDK 解析的供给"真机走查（模板声明依赖经活仓库解析落地
  ）照用户裁决自己的排序归 **W25（O-2）**，真机复测通过前不宣称已验证。
  环境座按派单并行实现中——**本批 resolve_project 系端口面钉底版本**，
  两树对齐核对归集成验收。
- **所有权申报**：orchestrator vpm_backend＋lib 再导出＋project-manager
  ＋unity-bridge 素材面＝核心域；provider-host 24 个测试文件字面量＝纯编
  译涟漪（provider_host.rs 零触碰）；**acquisition 一处字面量＝域外机械
  补位如实申报**；schemas 零触碰；REGISTRY＋协议本＝核心冻结义务面。
- **潜在对齐风险点（给环境座与集成验收）**：①source_repo 语义＝订阅行
  id 优先、name 回落、本地来源固定 "local" 字面量；②failed 数组生产者＝
  库 DependenciesNotFound（唯一变体）逐依赖映射 no_matching_package，
  **resolve 返回 Ok 而非 Err**——失败聚合在消费方（run_provision 检查
  failed 非空转 provision_failed）；若环境座实现为 Err 臂，集成验收需裁
  定两树收敛方向；③offline 臂＝load_cache 降级（缓存可满足则离线可解）
  ，与 preview 同律；④能力位在 VpmCapabilities 结构内（非独立 accessor
  族），与结构注释预留点一致。

## 前情（本域链，全文见本文件 git 历史）
上上拍（09-21 01:4x–02:4x 两笔）＝W25 供给步骤修复批 f68ee67＋状态批，
经集成第 142 批收编入库（a788b04，is-ancestor 实测）。更早＝F4 wire 接线
批 7361213（第 141 批收编）、F4 仓库生命周期冻结批 47d4185（第 139 批合
并）。F5/F3/F2 链见 git 历史。

## 本轮交付（8e90a42 基线世代）
- **实现批 70f7476**（恰 40 文件 987+/36-＝orchestrator 端口面 2 文件＋
  project-manager 实现与测试 2 文件＋unity-bridge 源与测试 5 文件＋
  provider-host 测试字面量 24 文件＋acquisition 1 文件＋协议本双语 2 文
  件＋REGISTRY＋向量 description 1 文件；详情见当前焦点）。
- **本状态批（恰本文件）**。
- 零新阻塞、零新升级项、零 [需用户]。

## 在途/待他角色
- **[等集成] 候验收（--no-ff）**：实质对象＝**实现批 70f7476**（恰 40 文
  件 987+/36-，写明「wt-2 供给依赖解析批（基线 8e90a42）」；重点复核
  resolve_project 实现与 run_provision 接线序 create→resolve→指纹重取
  ；acquisition 一处域外机械补位请一并核对）；**[等环境/wt-6] 按本批端
  口面钉底版本并行实现，验收时集成核对两树对齐**（风险点清单见当前焦点
  末节）。
- **[等用户] W25 开窗（O-2）续**：素材链全链真机复测（本批后链路＝空工
  程目录→计划含供给步骤→确认执行→创建＋解析下载 SDK 依赖→导入；依赖解
  析经活仓库段首次真机验证）；026/027 全链＋F2/F3/F5/F4 served 行真机呈
  现随全链。

## 阻塞
- 无阻塞。等待项均非阻塞。

## 下次合并意图
**候验收对象＝实现批 70f7476（实质，--no-ff，写明「wt-2 供给依赖解析批
（基线 8e90a42）」）＋本状态批恰本文件。**提交后读数（rev-list 实测）：
领先 2（实质 1＝实现批＋本状态批 collab 面），落后 0。

## 待命声明（第 6 步，如实）
本轮（2026-09-21 04:4x–05:5x，节拍轮工作时段 date 实测；两笔：实现批
70f7476＋本状态批）：①date 实测工作时段，pnpm collab:brief ①区无指向本
树/角色条目；②轮首追平壳 e8104a8 吸收 origin/main 第 142–145 批世代（落
后 24→0，纯吸收零自有内容），f68ee67 收编身份 is-ancestor 亲测闭环；③操
作者派单第 146 批任务领取＝供给步骤补 SDK 依赖解析，四项逐条兑现交付实
现批 70f7476（端口面钉底＝trait 方法＋ResolveReceiptV01 最小闭集＋
VpmCapabilities 独立位关闭既有预留点＋trait-default 缺席臂；VrcGetLib
真实现三臂＋VccCli 如实缺位；素材链接线 create→resolve→指纹重取＋仅新
建路径＋provision_failed 包装臂两失败面；协议本 0.2.1 注记＋REGISTRY＋向
量 description＋doc 注释；库面 3 例＋执行面 3 回归＋既有测试加强）；④定
向证据亲测全绿：四 crate 742/0（provider-host 288 零涟漪＝wire 零变化实
证）＋clippy 五 crate 0＋typecheck 双 0＋diff-check 干净＋冲突标记 0＋
merge-tree 预检 exit 0；⑤诚实边界维持：零端到端宣称——带解析供给的真机
走查归 W25（O-2）；环境座并行实现中，两树对齐归集成验收；[需用户] 条目
照规则跳过未代决；在手无半途切片、除本状态批外无未提交改动。退出待命，
候集成验收、环境座对齐、W25 用户开窗复测、下轮 brief 或新指派。

## 留言
- [→集成] 验收请求：**候验收实质对象＝实现批 70f7476（恰 40 文件 987+
  /36-），请随轮验收（--no-ff），写明「wt-2 供给依赖解析批（基线
  8e90a42）」**；定向证据亲测全绿在案〔orchestrator 234/0＋project-manager
  143/0＋unity-bridge 77/0＋provider-host 288/0 零涟漪＋clippy 五 crate 0
  ＋typecheck 双 0〕。**重点复核两处**：①run_provision 接线序（create→
  resolve→指纹基线重取，哨兵测试钉死次序）；②acquisition 一处域外机械
  补位（warehouse_maintenance.rs 970 区 VpmCapabilities 字面量补
  resolve_project: false，契约位新增编译涟漪零行为变更）。merge-tree 预
  检 exit 0 零冲突。零端到端宣称维持——带解析供给真机走查归 W25。
- [→环境/wt-6]（对齐知会）**resolve_project 端口面已按派单钉底入库（
  70f7476），你席并行实现时以此为准**：trait 方法签名／ResolveReceiptV01
  三字段闭集／VpmCapabilities.resolve_project 独立位／trait-default 缺席
  臂 shape。四项潜在对齐风险点已在状态批登记（source_repo 取值链、
  failed 数组 Ok-不-Err 设计、offline load_cache 降级臂、能力位在结构内
  而非独立族）——你席实现若与此分叉，集成验收时裁定收敛方向。库面参考实
  现与三臂测试在 project-manager（70f7476）可对照。
- [→桌面/wt-3]（知会）resolve 系供给内部步骤，**不经桌面网关暴露、零新
  gateway 方法**（本批 provider_host.rs 零触碰实证）；供给步骤呈现消费切
  片（上拍已登记）候你席，词面可依 material-intake 协议本 v0.2.1 依赖解
  析要点（"创建＋解析并下载工程声明的 SDK 依赖（网络操作）"）。
- [→操作者] 第 146 批办理完毕：端口面钉底＋素材链接线＋词面诚实＋测试六
  例交付在案；**带 SDK 解析的供给真机走查维持 W25 用户回访项（O-2）**——
  该段（模板声明依赖经活仓库解析）此前从未真机验证，复测通过前不宣称端
  到端；请纳入 W25 走查脚本（wt-4 A2 段脚本供给段可按本批接线序补一句）。
- （回执不回执：brief ①区无指向条目；历史留言已消化归档，在途事项以
  BOARD 与本状态文件当前焦点为准。）
