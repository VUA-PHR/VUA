---
worktree: wt-main
branch: main
role: 集成
baseline_commit: bb4de40d
updated: 2026-09-22
---
## 当前焦点
**第 164 批（2026-09-22 04:0x–05:0x，节拍轮工作时段 date 04:09 实测）＝压缩派
发轮（仅集成）：第 164 批三栈验收入库（wt-3 029 A 面切片三「添加素材＋创建
升格」＝A 面消费闭环＋wt-2 B 面环 3 导出执行器落地＝B 面三环闭环＋wt-4 030
冻结前置 schema 设计环 v0.2 草案）＋合并树定向复跑全绿＋BOARD 两行更新**：

- **桌面栈 wt-3 三笔 --no-ff 收编（合并 bf030796，预检 exit 0）**＝追平壳
  4a74c1f8（零自有纯吸收 main 9d7e6c17）＋实现批 e36f8119（恰 16 文件
  1239+/21-：新 5＝recipe-document-edit-store＋RecipeDocumentEditSection
  ＋edit 模型＋模型测试＋WarehouseEntrySelector；改 11＝RecipePage＋
  acquire-model 双件＋冒烟脚本＋四表＋REGISTRY＋设计标准 0.7.17 双语）＋
  状态批 6cf7c42b。验收重点逐项 diff 级成立：
  - **A2 编辑链不覆写会话草稿**：recipeDocumentEditSelected 身份相同只刷
    底稿 document、保留待保存新增 additions（文档库失效重取不得静默丢弃
    用户未保存编辑）；身份/修订变更即新编辑会话（session-survival 语义
    系实现时点定性，状态批如实登记候 W25 走查，集成不升格为裁决）。
  - **「已保存」仅回执后呈现（诚实律）**：lastSavedRevision null＝本会
    话无保存回执、回执才前移；DOM 钉 no-saved-note-before-a-receipt；失
    败如实 failed、待保存新增保留、重试显式。
  - **同一保存链形状同一守卫集**：recipe.save v1＋baseRevision＋busyRef
    忙碌守卫双层面＋空保存拒绝（ToSaveDocument null）＋D5 查重骑
    compose-save-dedup 同一比对面（比对键＝将要保存的合并文档；命中弹
    compose 同词面确认框持有提交至用户裁决；确认时以当下编辑态重建诚实
    取当下）；透明合并（底稿全字段透传只追加 assets/instances 刷新
    updatedAt，DOM 钉 title 保留不静默改写）。
  - **A3 零第三导入入口**：WarehouseEntrySelector 只消费 useAcquireView
    读面投影；DOM 钉断言 picker 不含 importTitle/importPick 词面；云端
    #46 诚实缺席 localOnlyNote；added 徽标禁用重复＋编辑模型双层幂等。
  - **A1 创建入口升格**：hero 主路径「创建」（U16 原文词面）打开同一搭
    配草稿弹窗，两 UI 一保存链不破；设计标准 0.7.17 双语＋REGISTRY；
    词面四表各 +14 键同步；smoke 71/71＝41＋恰 30 新 DOM 钉（合成网关）。
  - **A 面消费闭环申报与三切片事实对表成立**：切片一 A4/A5＋切片二 A6
    ＋本切片 A1–A3＝判决书④流程桌面面全落库。
- **核心栈 wt-2 两笔 --no-ff 收编（合并 40a71ea4，预检 exit 0）**＝实现批
  4f911abc（恰 8 文件 1004+/87-）＋状态批 45c57f98。验收重点逐项成立：
  - **依赖方向零违规**：OnDiskProjectDraftExporter 系 013 聚合读纪律核心
    侧镜像（聚合 import core 永不反向）；orchestrator 源码 grep
    project-manager 仅注释级提及零代码引用；Cargo.toml 零 diff。
  - **诚实空投影与缺席/损坏区分**：manifest 非文件/不可读/损坏/非对象四
    类发现→诚实空行集＝013 聚合同投影；区分登记在聚合 diagnostics 通道
    （草稿七键闭集无 diagnostics 成员、错误码闭集不为盘上观察设码＝观察
    失败不设码诚实律 1/2）；从不虚构行从不发明错误。
  - **双向 iff 门**：m_EditorVersion 行缺席/残缺过 classify 完整性门→
    null 约束＋EnvironmentUnityVersion 标记 iff 绑定；行集＝声明集联
    locked 同 id 钉定（locked-only 不产行；BTreeMap 迭代＝packageId 升
    序冻结呈现事实）；身份三态边界镜像（NotFound=Absent；垃圾/未知版本
    /缺 marked_at=Unreadable 证据）；末组件名诚实 null；逐调用 uuid-v7
    ＋注入时钟（ORC-TST-001）；TOTAL 函数（Err 臂为端口契约保留）。
  - **能力覆写翻转**：export_capabilities declared→F5 律，served 行与
    路由门转 available；生产 bin 接线翻转＋四测试夹具文件 7 处
    deliberate None（grep 实证）；协议本 0.1.1→0.1.2 词面零变化
    （schemas/ 零字节）；执行器矩阵 9 例＋wire 串联 11 例（接线 9＋真实
    执行器链 2）。
- **产线栈 wt-4 两笔 --no-ff 收编（合并 bb4de40d，预检 exit 0）**＝追平壳
  7f1ecde7（零自有纯吸收）＋c6704a85（恰 8 文件 1290+/118-，实现批与状
  态批合一提交）。验收重点逐项成立：
  - **迁移保真（v0.1 数据零损失）**：002 迁移＝compatibility_observations
    重建扩维——v02 表建后 INSERT...SELECT 逐列 verbatim 搬运全部 v0.1 行
    （v0.1 行只含旧三值 spans 均为 v0.2 闭集成员，良构数据上 INSERT 不
    可能失败，任何失败必须中止迁移）→DROP→RENAME→索引重建；v0.1 六列
    与 v02 六列同序同型零列差实读核可；format_version 迁移内置、
    user_version 留宿主。
  - **CHECK 硬律**：source_span 五值扩维闭集＋resolution_evidence CHECK
    （resolved 非空⇒证据非空）＋dep_kind 四值＋extraction_method 六值＋
    confirmed_by_human 0/1；置信度两维两列（extraction_method 版面闭集
    × extracted_by 身份开放，绝不合并）。
  - **草案状态标注（候冻结非冻结）核可**：schema.sql 头部 DRAFT/NOT
    frozen＋冻结片须三件齐备＋协议本草稿「草案候冻结」＋030 内联「冻结
    前置设计环（不落库、不改 bdl-store 代码）」——store 仍运行 v0.1。
  - **dep_kind 四值收窄自洽复核成立**（操作者预授权方向认可，集成复核自
    洽不代冻结裁决）：版本维度由 version_hint 承载（引擎/SDK 钉行落
    other＋version_hint）信息不丢失；五值备选在协议本草稿开放标注；负
    例向量恰钉当前草案方向且冻结批改闭集则向量随改；「候冻结批裁决未代
    决」如实标注。5/5 向量消费测试骑草案 schema 文件（非 store 行为）；
    本批零 BOOTH 访问。
- **合并树定向复跑集成亲测全绿（04:3x–05:0x，df 先查 552G/71%）**：cargo
  test --workspace **106 套件 927/0**（ignored 28 维持；对 163 批基线
  104 套件 911 净 +16＝恰 wt-2 十一钉〔执行器 9＋wire 2〕＋恰 wt-4 五钉，
  数字自洽）＋clippy --workspace --all-targets **0 警告 0 错误**＋desktop
  typecheck 双 tsconfig **exit 0**＋vitest **94 文件 876/876**（867＋恰
  wt-3 九新钉，与申报逐字一致）＋check:i18n **OK**＋check:leak **155 指
  纹零泄漏**（独立临时生产构建）。
- BOARD U16 行（A 面消费闭环＋B 面三环闭环候桌面环 4）＋#46 行（030 草案
  入库候冻结）更新＋前录轮转（插 164 段轮出 149 段，10 段维持）。本批纪
  律：wt-5/wt-6/wt-7/wt-8 无新领先零动作（留言系上批世代残余或避让知会
  照消化）；VUA-7/VUA-8 全程零触碰；`?? _local_p27_devlog.txt` 照例不触
  碰。
- **诚实边界维持：零端到端宣称**——合并树复跑系代码面证据（fake 端口/
  合成工程/合成网关/临时生产构建/草案 schema 测试）；添加素材→保存→呈
  现 live 全链、导出真机全链（真实工程导出→确认→组装→车间状态）、链身
  份跨会话语义、v0.2 草案零实现零运行宣称全归 W25（O-2）/冻结批，测试
  绿≠真机绿。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 163 批（03:1x–04:0x）＝第 162 批双栈验收入库（wt-3 切片二 A6＋wt-2 B
面环 2 接线）＋两笔操作者裁决登记（030 定座＋§5.7 案 A；029 环 3 归核心
域）＋复跑 911/0。第 161 批（02:2x–02:5x）＝第 160 批双栈验收（wt-3 切片
一＋wt-2 环 1 冻结）＋029 双节冲突集成亲裁。第 159 批＝第 158 批四栈验收
（wt-3 判决书＋wt-2 #45 两件＋wt-5 030 表态＋wt-6 B 案注记）。第 155 批
＝U19 双栈验收入库。第 154 批＝029 文档批验收＋U15 落地。更早见 BOARD 前
录与 git 历史。

## 阻塞
无。（proposal 029＝**A 面消费闭环**（A1–A6 三切片全入库）＋**B 面环 1 冻
结＋环 2 接线＋环 3 执行器三环闭环**；环 4 桌面消费候形状核可候操作者派
发；未决项 2 候用户。proposal 030＝v0.2 草案入库，**候冻结批＝产线座按三
件齐备纪律定稿**（向量文件形态与数据席收敛在冻结批）；§5.5/§5.6 维持开
放。#45 余候派＝端口面取消位＋errors.* 词表候选，A 案归 W25。#43 真机复
验候 W25 用户回访。U18 终裁候实机＋数据。）

## 下次合并意图
候验收队列：slot/wt-2／slot/wt-3／slot/wt-4 领先 0（本批终态）；slot/wt-5
／slot/wt-6 落后且领先 0；无在途切片候验。候办：029 环 4 桌面消费（候操
作者派发/桌面形状核可）；030 冻结批候产线座领取；#45 余候派两件；#43 真
机复验候 W25（O-2）；U18 终裁候实机＋数据。收尾时段 08:40 起禁开新切片。

## 待命声明（第 6 步，如实）
本轮（2026-09-22 04:0x–05:0x，节拍轮工作时段 date 04:09 实测；三栈合并＋
亲审＋复跑＋簿记）：①date 04:09 实测正常时段，pnpm collab:brief ①区判读
＝wt-3/wt-4 两验收请求与操作者第 164 批派发一致，wt-2 尖 45c57f98 含实现
批 4f911abc 与派发一致；wt-5 留言系上批世代残余、wt-7/wt-8 避让知会，失
鲜工作树无；②桌面栈 wt-3 亲审＝四验收重点（不覆写会话草稿＋已保存仅回执
＋守卫集同源＋零第三导入入口 DOM 钉）逐项核实＋A 面闭环三切片对表成立，
收编 bf030796；③核心栈 wt-2 亲审＝依赖方向 grep 实证＋诚实空投影四类发
现逐条＋iff 门＋三态边界＋构造点清点＋wire 11 例逐项成立，收编 40a71ea4；
④产线栈 wt-4 亲审＝迁移 verbatim 保真零列差实读＋CHECK 硬律＋草案标注＋
dep_kind 四值自洽复核逐项成立（未代冻结裁决），收编 bb4de40d；⑤合并树定
向复跑亲测全绿＝cargo 106 套件 **927/0**＋clippy **0/0**＋typecheck 双
**0**＋vitest **94 文件 876/876**＋check:i18n **OK**＋check:leak **155 指
纹零泄漏**（df 先查 552G/71%）；⑥BOARD U16 行＋#46 行＋前录轮转（插 164
轮出 149，10 段维持）＋wt-main 状态批（本文件）；⑦[需用户] 条目照规则跳
过未代决；⑧诚实边界维持：零端到端宣称——复跑系代码面证据，live 全链与
导出真机全链归 W25（O-2），v0.2 草案零实现零运行宣称候冻结批，测试绿≠真
机绿。在手无半途切片、除本状态批外无未提交改动。完成后推送并退出待命。

## 留言
- [→操作者] 第 164 批办理完毕：**三栈验收入库**——wt-3 切片三（A1 创建升
  格＋A2 平行文档编辑链＋A3 仓储读面投影选择器）收编（bf030796），029 A
  面消费闭环成立；wt-2 环 3 导出执行器收编（40a71ea4），029 B 面三环闭
  环候桌面环 4；wt-4 030 冻结前置设计环草案收编（bb4de40d）候冻结批定
  稿。合并树定向复跑全绿（cargo 106 套件 927/0＋clippy 0＋typecheck 双 0
  ＋vitest 94 文件 876/876＋i18n＋leak 155 指纹）。**候裁断/派发**：029
  环 4 桌面消费（形状核可）候派；030 冻结批候产线座领取（数据席向量形
  态收敛在冻结批）。
- [→桌面/wt-3]（验收回执）第 164 批三笔已收编（bf030796）：不覆写会话草
  稿、已保存仅回执、守卫集同源、零第三导入入口、A 面闭环对表逐项核可；
  0.7.17 双语在库。环 4 桌面消费（recipe.exportProjectDraft 读面已
  served）候操作者派发/你席形状核可。
- [→核心/wt-2]（验收回执）第 164 批两笔已收编（40a71ea4）：依赖方向零违
  规、诚实空投影、iff 门、能力翻转、wire 11 例逐项核可；合并树复跑 927/0
  （106 套件）恰含你席十一钉。029 B 面环 1–3 闭环；环 4 桌面消费候派。
- [→产线/wt-4]（验收回执）第 164 批两笔已收编（bb4de40d）：迁移保真、
  CHECK 硬律、草案标注核可；dep_kind 四值收窄自洽复核成立（操作者预授权
  方向认可、集成不代冻结裁决）。**冻结批候你席领取**（三件齐备纪律；向
  量文件形态与数据席收敛在冻结批办理）。
- （回执不回执：wt-5/wt-6/wt-7/wt-8 无新领先零动作；历史留言已消化归档，
  在途事项以 BOARD 与本状态文件当前焦点为准。）
