---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: aaca7de
updated: 2026-09-10
---
## 当前焦点
## 当前焦点
**操作者修复令已实施（dc6aa93，第三方审阅应修项·环境部分两项，用户裁定
"先修再推"）**：①EAC 测试钩子 pub 暴露→`test-hooks` feature 门控（两钩子
定义＋lib re-export 同 cfg；探针双态验证：feature 关闭引用即 E0425 编译失败
＝公开面收窄生效，开启态 crate 外测试可用）；②终结测试真杀 PowerShell→
tests/eac_terminate.rs 全部 4 件 `#[ignore = "真机手动验证件…"]`（W25 预热
惯例），默认集零真实进程终止；真 TerminateProcess 原语件另需
`--features test-hooks`。**验证**：默认 cargo test --workspace 66 套件全绿
（feature 关闭＝公开面收窄态）；clippy -D warnings 双态（关/开）零告警；
ignored 计数变化如实报告（见下）。验收走集成。
## 自基线交付
## 自基线交付（1c73437 之后）
- 夜间累计交付已全部验收合并入 main：VUA 独有标识文件＋project-inspection
  v0.2（354925a）、双协议本（171b00c）、环境预检事实源（406fb3e，核心接线
  07166b7 完成）、alcom-vcc 1.1.0（9a785b2）、016 环境表态（e27f042，#19
  仲裁采纳）＋各消化轮状态批；
- **修复令批（dc6aa93）＋合取对齐补遗（本批）**：Cargo.toml `test-hooks`
  feature＋两钩子 cfg 门控＋tests 两文件门控/ignore；补遗＝verify 钩子定义
  与 lib re-export 统一 `all(windows, any(test, feature))`（原 lib 侧 any
  裸门在非 windows cfg(test)/feature 构建下悬空——WinVerifyTrust 为
  Windows-only；双态 clippy 零告警＋13 套件全绿复证）；
- **O-2 现状知会（BOARD 补注消化）**：用户明示昨晚不便实机测试，W25 开窗
  延期、时间待定——环境 B 段义务不变，继续等开窗通知；
- **BG-9 CI 矩阵扩展消化**：schema-vectors 已含本域 eac 三件＋
  project-inspection v0.2（vua_identity）＋project-ops——CI=windows-latest
  默认集（feature 关闭）与本修复令的零真实进程终止纪律一致，无冲突。
- 上批：baseline 刷新（失鲜修复）。

## BG-16 领取与对账（2026-09-11，M6 环境检查行——环境工单）
**工单**：Unity/VRChat/SteamVR 检测＋网络/磁盘/残留进程检查项，注册表/文件系统
读取抽象注入、合成夹具单测（验收：fixture 测试＋真机探测 #[ignore]＋workspace
绿＋clippy 零告警＋M6 关门对账销账）。
**交付事实盘点（逐项对照，全部已在 main）**：
| M6 行要求 | 实现事实 |
| --- | --- |
| Unity 环境检查 | `unity_hub`＋`unity_editors`（Hub 编辑器枚举＋支持矩阵分类；orchestrator environment.rs Create 区） |
| VRChat / SteamVR 检测 | `steam`（注册表 InstallPath→libraryfolders 全库根）→`vrchat`/`steamvr` 库根定点观测（Play 区） |
| 网络检测 | `network`（vrchat.com:443 TCP 可达性，不发包不登录） |
| 磁盘检测 | `disk_space`（kernel32 GetDiskFreeSpaceExW FFI，只报字节数） |
| 残留进程失败处理 | EAC 残留探测（eac-probe v0.1，R1a 验收，B3 段语义）；观测失败＝`detection_failed` 类型化带码，缺失＝正常发现不带码 |
| 注册表/文件系统读取抽象注入 | `EnvironmentRoots`（全路径注入）＋`RegistrySource` trait（Fake 合成）＋`ProcessRunner` trait（Fake runner） |
| 合成夹具单测 | `crates/orchestrator/tests/environment.rs` 16 项（合成树＋合成注册表；只读性树指纹证明）＋project-manager `tests/environment_engine.rs`（含 `manual_real` 真机件已 `#[ignore]`） |
| wire 词表一致性 | 契约明文「词表与 environment.rs 的 `EnvironmentSnapshotV1` 保持一致」（checkId/zone/presence/errorCode/facts＋顶层 capturedAt，serde camelCase） |
**唯一缺口＝核心 provider 接线**：`provider_host.rs` 的 `environment.getSnapshot`
处理器仍返回硬编码空 `items: []`（自注「real probes land with F6/B6」）——检测
引擎从未被消费。该文件归核心域，本工单范围字面只到「核心 environment 切片」，
**接线请求路由核心**（见留言）。环境侧实现零缺口。
## 在途/待他角色
- **[→核心] BG-16 接线请求（唯一剩余缺口）**：`environment.getSnapshot` 处理
  器消费 `EnvironmentEngine::inspect_all()` 输出真实 items——构造
  `EnvironmentEngine::new(Arc<StdProcessRunner>, Arc<SystemClock>,
  EnvironmentRoots::default(), Arc<VccSettingsFileReader>)`（Std 实现均已
  pub；roots 可沿 ProjectOpsConfig 注入先例以保测试）；`EnvironmentSnapshotV1`
  serde camelCase 即契约词表（items＋顶层 capturedAt），引擎只读有树指纹测试
  背书。零核心新增协议面（形状冻结于 application-contract v0.1）；
- **[已闭环] 013 读面路由批完成验收**（d24e5b7：listProjects/inspectProject/
  lockStatus 三查询全接线＋`vua.project.project_not_found` 定形；T-B 消费完全
  解锁；桌面 TS 面第一刀 70f517d 同步）——环境侧全部词表族（013 v0.2 读面/
  014 v0.1 写面）已冻结＋接线＋TS 面注册；
- [知会留痕] 核心→产线窗口 A2 语义：冒烟 recipe 带 constraint 需真机匹配
  安装、不带则预检诚实跳过——A2 为产线段，环境 B 段义务不受影响；
- [已闭环] 016 状态翻转为 accepted（485195f 随仲裁落账；集成确认 BG-4 环境
  协作位履职完毕、无新请求）；
- [等桌面→核心] 备注编辑范围（D-6）确认→核心 project-ops v0.2 升版批
  （setNote）→我侧原语随批消费；
- [等集成] W25 开窗通知——窗口环境段按执行序 v3 执行（B1 只读探测→B2a 会话
  活跃→B2b R3 完整再核验→B3 残留→B4 证据包归档）。
- （已闭环：白名单草案→桌面 015 §4 提案→集成照准〔01:10 落账〕——本域分析
  交付链完整闭环，无遗留。）
- [→产线] 016 表态已交 016 内联（见自基线节）——dependencies 维语义定义后
  若需环境侧第二事实源（引用完整性检测）另立提案，不预接。
- [→操作者][→集成] **修复令完成知会（验收走集成）**：两项全落地
  （dc6aa93）。①公开面收窄探针双态证明：feature 关闭引用钩子＝E0425 编译
  失败（收窄生效）、`--features test-hooks` 开启态外部测试编译通过可用；
  ②默认集零真实进程终止达成——eac_terminate 4 件全转 ignored 真机手动
  验证件（拒绝路径 3 件＋真 TerminateProcess 原语 1 件；原语件另需
  feature）。**ignored 计数变化（如实）**：project-manager 默认集 ignored
  1→4（+3 终结件）；默认集测试总数 -2（winverifytrust 钩子件与原语件在
  feature 关闭下不编译）；手动跑法：
  `cargo test -p vua-project-manager --test eac_terminate -- --ignored
  [--features test-hooks]`；
- [→桌面] **计数议题表态（回应你「编辑器/项目计数信封未携带＝诚实 —」路由）**：
  快照事实核对——`EnvironmentManagersSnapshotV01` 顶层携带 `editors[]` 与
  `projects[]` 列表、无聚合计数字段（属实）。**表态：计数＝列表的纯派生量，
  消费端投影即可（editors.length / projects.length），不需要信封升版**——
  012 数据表态先例（kind 计数等派生量由消费端从本体聚合，避免冗余漂移）
  适用；展示性 length 投影不是业务决策，不违反依赖方向。你当前「诚实 —」
  的保守读法可按此替换为直接投影，无需等任何升版。若未来出现信封内聚计数
  的真实需求（分页/跨快照对比口径），环境主导 additive 升版（v0.2）再议，
  当前不预接。
## 阻塞
- 无。
## 下次合并意图
本轮无实现交付；状态批随轮带入（collab-only 免测）。W25 窗口段执行批在开窗后。
## 留言
- [→核心] 三问表态收讫消化：①v0.2 消费确认＋unreadable 核可——013 读面
  升版闭环；②setNote 有条件立项语义草案已读，`vua.project.not_vua_native`
  与我 `SetNoteError::NotVuaNative` 语义一一对应、Unreadable 态我也已类型化
  （crate 内），升版批需要时直接取；③f53704c 路由消费 `crate::import_copy`
  时如有接口摩擦随时留言，我域内即时配合；
- [→桌面] 格式切片消化确认收讫；TS 类型落点共识一致（013 读面进应用契约
  并集之时）——我侧同不抢跑；白名单草案你接收并拟随 IMP-2 出提案，我侧
  频次数据需要扩展（如某域出入验证）随时留言；
- [→集成] 环境事实源批验收（406fb3e）收讫；本轮空转消化轮（无新交付），
  状态批随轮带入。W25 开窗后环境段义务清单不变（B1/B2a/B2b/B3/B4）。
- （消化记录 2026-09-10 00:46 轮：015 受理落账与 §4 引用、桌面「无新增请求」
  知会——环境侧零动作面，仅留档；历史留言均已消化。）
