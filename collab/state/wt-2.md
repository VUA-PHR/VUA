---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: caddb291
updated: 2026-09-22
---
## 当前焦点
**第 158 批（2026-09-22 01:0x–01:4x，节拍轮工作时段 date 01:00 实测）＝
BOARD #45 行核心域两候派件处置批（操作者第 158 批指派，源＝本座第 148 批
反向审查登记）一笔实现批 caddb291；轮首 fast-forward 追平 main a29f9ce0
（零分叉，落后 9/实质 3 全为集成第 157 批已收编内容）；恰 4 文件
（unity-bridge 单 crate＋两测试文件＋provider-host 测试 fake）396+/59-；
cargo test --workspace 896/0 跨 102 二进制（第 156 批基线 893＋恰本批三
枚新钉）＋clippy --workspace --all-targets 0 警告；零新码零新依赖，冻结
面零字节触碰，VUA-7/VUA-8 全程零触碰**：

- **件一（#45(2)，真缺陷已修）＝loadedAssetPaths 证据面 unwrap_or_default
  收口**：C# 面（BridgeCommandProcessor::ValidateAssetPaths）在每个
  Succeeded 回执上恒带 `data.loadedAssetPaths`（Ordinal 排序期望清单），
  拒绝路径无该字段但早已被错误诊断臂拦下；Rust 消费面
  （material_exec.rs run_minimum_structure_validation）原以
  `.get().and_then(as_array).map(...).unwrap_or_default()` 读之——无字
  段或含非字符串条目的成功回执被静默记成「已验证、零素材加载」，即
  Bridge 从未报告过的证据值，违反诚实纪律第 1 条（证据面只携带实际返回
  的数据）。**修法**：新 `loaded_asset_paths_evidence` 助手严格解析（字
  符串数组或不可用），不可用即按既有 `vua.material.bridge_failed` 族类
  型化诚实失败（零新码），走正常失败路径（快照回滚＋Failed 回执照发），
  record.validation 保持 None＝从未宣称。C# 面本就正确，本批是把 Rust
  消费面收口到它——Schema／协议本／C# 三者零字节触碰。
- **件二（#45(4)，磁盘非正确性，设计＋实现）＝`.vua/imports` 残留清理策
  略**：机制在码面证实——快照作用域恰为
  Assets/Packages/ProjectSettings/vpm-manifest.json（＋风险裁量
  UserSettings），`.vua` 在一切作用域之外，回滚永不触及
  `.vua/imports/<command_id>/`；成功臂逐包即删（原有 best-effort），但
  失败运行（派发错／指纹漂移／取消／解包与 manifest IO 错）与进程死亡
  均留残留（数据座清点定性：磁盘问题非正确性问题）。**策略三触发**：
  ①链开始前清扫——首笔解包前清走 `.vua/imports` 直接子项（唯一无在跑
  代码能清理的崩溃残留；安全性结构性成立＝MutationGate〔SQLite 租约→
  跨 profile 项目锁→pending 标记〕全程持有序列化同项目根变更链，有界
  于直接子项）；②失败/取消臂接线（登记原文所指）——本运行解包根逐根
  追踪，错误/取消出口 best-effort 回收；③既有逐包成功即删维持，其吞掉
  的删除失败由下一链的①兜底。**删除即诚实（照快照隔离区先例分析后择
  删非择隔离）**：解包层是执行器私有临时输入，可由计划内 sha256 钉定的
  源归档逐字节重导出；无任何 build record 与快照清单引用它；变更产物
  本身（Assets/Packages 内容）才是快照与 `.vua/recovery` 隔离区保护的
  对象——隔离只是搬移残留，时间窗保留策略给本地桌面应用引入无谓非确定
  性，两者均否决并落设计注记。**范围注记**：staging 腿
  （local_reusable／generate_vpm_only）解包于 StagingProject 根内随守卫
  整体销毁无残留面；production_job::stage_original_source 写
  prodjob-* 但今日无活链调用方（仅自身单测）——不静默扩展，只注记。
- **跨 crate fake 涟漪（登记原预见）**：五处测试 fake 对 validate 命令
  回无证据字段的 Succeeded——unity-bridge material_exec FakeBridge＋
  material_task FakeBridge＋provider-host production_host FakeBridge 与
  两处 BlockingBridge（ph_004/ph_010）——全部改为照真实 C# 形状回 Ordinal
  排序期望清单；FailingBridge／NoBridge／RejectingBridge 从不应答成功
  validate 故不触及；acquisition GeneratingBridge 走 generate-only 无
  validate 腿不触及。**平面夹具怪癖如实注记于测试内**：普通
  unitypackage 测试归档无 guid/pathname 条目，期望清单诚实为空（真实
  C# 会拒空期望而 fake 不镜像该拒绝——既有夹具简化，本批不改）。
- **钉（恰三枚，893→896）**：①两臂诚实失败钉（缺字段／非字符串条目→
  bridge_failed 族＋回滚 Restored＋Failed 回执＋validation None）；
  ②残留三合一钉（链前清扫崩溃残留＋失败出口清本运行解包根＋
  `.vua/snapshots` 哨兵存活证清扫有界）；③正例钉（guid 布局归档——平
  面夹具永不产生非空期望——Ordinal 排序证据逐字入 record.validation）。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 156 批（0a7ebbd7＋029a78ad，2026-09-22）＝数据座第 155 批清点两观察
点处置批：观察点 A＝recipe 存储钟近似历改单源 `crate::time::rfc3339`
（Hinnant civil_from_days）＋四向量钉＋存储级排序契约钉；观察点 B＝裁决
「失败运行无 production_domain_records 行」系设计非缺口（CHECK 闭集冻
结＋三调用面全在引擎成功后＋build 消费面按 id 直读），BuildRecordStore
与 put_domain_record doc 落裁决防后人误修，经集成第 157 批收编（合并
e49fcba7）。第 155 批（36bab970＋95cb58ba，2026-09-21）＝U19 交棒准入闸
后端切片（六态闭集＋release.openForInspection＋v0.2 冻结面），经集成第
155 批收编（09a4423f）。第 152 批（cd8c0000＋d2063abe）＝proposal 029
起草批（9125f8f1 收编）。第 150 批（7bc18e90＋464541c3）＝素材链修复批
（3e5573a6 收编）。第 148 批（83e267d9＋98767e61）＝素材链反向审查批
（da6a3bfb 收编，#45 行四候派件之源）。更早段落见本文件 git 历史与
BOARD 前录。
