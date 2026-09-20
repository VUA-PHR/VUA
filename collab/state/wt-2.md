---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 83e267d9
updated: 2026-09-21
---
## 当前焦点
**第 148 批反向审查批（2026-09-21，两笔：修复批 83e267d9 恰两文件 369+/9-＋本
状态批恰本文件）——操作者派单「W25 真机复测前，以新鲜视角审查素材链真实机器
风险，猎取已知缺陷族的新成员」领取并交付；轮首追平 main a95fa014（fast-forward，
落后 6→0，纯吸收集成第 147 批世代）**：

- **逐族审查结论（查了什么／发现什么／没查什么）**：
  1. **live/fixture 形状不一致族**：执行面↔Bridge C# 面字段逐一对表——
     `data.projectFingerprint`（C# 第 135 行对一切结果恒回填，Rust
     `fingerprint_of` 消费点一致）、`data.loadedAssetPaths`（C# 校验面回填、
     Rust 消费点一致）、`changedPaths`／`importedAssetPaths`／`diagnostics
     severity`／`FileSha256` 格式（双侧 sha256:小写 hex，OrdinalIgnoreCase
     比对）全部双向一致，**无第二处 #36 式字段错位**。发现形状漂移的**纸面
     掩盖**一处（族内新形态）：成功物化命令缺指纹时旧码
     `unwrap_or_else(保持旧值)` 静默骑旧链——末包场景把**假** final 指纹写进
     回执（＝说谎的回执），已修（见修复③）。**没查**：progress 事件消费面
     （素材链无逐包进度事件，任务层事件与本族正交，如实登记未深挖）。
  2. **两链能力不对称族**：并发二次执行——真提交面（provider_host）有
     MutationGate（SQLite 租约→跨档案项目锁→待完成标记，全程持有，崩溃留
     标记走 inspect-first），**防护成立**；发现**重试撞号新缺陷**（见修复②，
     Bridge 幽灵回放×plan_id 内容派生→重试永久卡死）。取消路径逐点盘点：
     令牌在各步边界与逐包循环真实生效、取消照走回滚＋收据 Cancelled（诚实）；
     **不可中断段**如实登记：快照创建、provision（网络 resolve）、单包解包、
     preview/apply 安装腿（端口面无取消位＝跨域，候派）。恢复面：失败回执不
     被重放为成功（attempt 链）、superseded 隔离区先归档后恢复、恢复回执
     Recovered 状态绑定 decision——核验成立。
  3. **非 ASCII/路径边界族**：发现**真缺陷**（见修复①）：tar 解包第二遍的
     守卫只查 `..` 子串与前导 `/`，而 `Path::join` 对绝对路径是**替换**语义
     ——名为 `C:/.../x` 的条目原样写出 extracted_root 之外；intake 面只扫
     pathname 记录不查文件条目，摘要校验对恶意字节照实绑定，威胁模型正是
     不可信 BOOTH 包。已修＋测试钉。其余核验：C# 侧 UTF-8（改変类名双向
     UTF-8 读取一致）、manifest key 斜杠归一（Rust 写 `/`、C# 读回替换
     `\`→`/`，Ordinal 匹配）、intake 面拒绝 symlink/`:`/`..`/空段。**没查
     （候真机）**：>260 字符长路径在用户环境（LongPathsEnabled 注册表未知）
     的实际表现——std::fs 与 C# File API 均依赖环境开关，代码面无法单方
     证明。
  4. **ValidateMinimumStructure 诚实性**：Bridge 端是**真校验**——逐路径
     `AssetDatabase.LoadMainAssetAtPath`，任一缺失→Error 诊断＋拒绝（拒绝
     面在，非假通过）；空期望直接拒绝（executor 侧 unwrap_or_default 的空
     列表不可能掩盖假通过）；诊断「不代表 Avatar 语义正确」措辞诚实。发现
     **盲点一处（登记候派，非谎报）**：C# 物化面接受 `Packages/` 前缀逻辑
     路径（第 259–260 行）而 Rust 校验期望只收 `Assets/`（pass 1 过滤）——
     Packages/ 落盘物不在最小结构校验覆盖内（changedPaths 收据仍如实记录，
     非静默）；修复需跨面决策（C# 拒绝 vs 校验覆盖 vs 接受并文档化），不动。
  5. **快照/回滚完备性**：空态语义正确——`create_verified` 对不存在工程
     根创建全链、范围缺失照记录（回滚时删除失败操作新建的范围＝「删除半
     初始化工程」律的字面实现）；`restore_verified` 仅隔离已存在范围、
     manifest 三向校验（身份/快照 id/逐条目大小）、伪造条目拒收。崩溃中断
     （无回执）→ 指纹链使重放必拒（stale_project 诚实拒绝）→ inspect_required
     语义保全。**残留登记（候派）**：失败/取消后 `.vua/imports/<command_id>`
     解包残留不清（快照作用域外；94MB 包解包后可观，磁盘残留非正确性缺陷，
     清理需把解包清单穿线到回滚分支，涉回滚路径重构，不盲动）。
- **修复清单（83e267d9，恰两文件 crates/unity-bridge/ src＋tests
  material_exec.rs，369+/9-，零 wire/词面/端口面变更，零新错误码）**：
  1. **路径逃逸守卫**：解包第二遍增加组件级守卫（Prefix/RootDir/ParentDir
     一律跳过），与既有「skip, not followed」语义一致；被跳条目亦不进
     manifest，Bridge 端 VerifyAgainstManifest 天然拒其参与物化。测试钉：
     源内单测**手工拼 ustar 字节流**构造恶意归档（tar-rs 构造 API 强制相对
     路径，守卫必须对真实恶意归档形态可测）——环封 canary（真 temp 目录
     绝对路径）＋`..`＋根锚三形态，断言合法 guid 布局照常落地、三敌意条目
     既不写盘也不进清单。
  2. **重试撞号盐**：attempt>1 时 mutating 命令 id 注入 `-r{attempt}`
     （首 attempt id 逐字节保持既有形态＝快乐路径零变化）；schema 对
     commandId 仅约束非空、C# 语法 `^[A-Za-z0-9_-]{1,128}$` 容纳；staging
     路径命令结构性免疫（一次性暂存目录逐出口销毁，完成收据不存活）不加
     盐、只登记。测试钉：attempt 1 于第 2 包失败→同 confirmation 重试→
     断言重试包 id 带 `-r2`、与首 attempt 零重合、validate 保持素 id、
     回执落 `material-{plan}-attempt2`。
  3. **指纹硬要求诚实化**：三个物化消费点（直导/暂存导入/generate_vpm_only）
     成功结果必须携带非空 `projectFingerprint`，缺失＝形状漂移，按既有
     `vua.material.bridge_failed` 族诚实失败——回滚照跑、回执照发、final
     指纹保持空（绝不落假值）。测试钉：空 data 脚本→失败＋Restored＋
     Failed 回执＋final 指纹为 None。
- **候派登记（跨域/需决策，本批不动）**：
  1. `Packages/` 前缀逻辑路径物化盲点（族 4；需 C#×Rust×词面三面决策）。
  2. `loadedAssetPaths` 证据面 `unwrap_or_default`（族 1 亲缘：形状漂移时
     证据列表空而运行成功；Bridge 端真校验在故非假通过，唯证据面欠诚实；
     修复需跨 crate fake 涟漪，候派）。
  3. 取消粒度：VpmBackend/Bridge 端口面取消位（快照/provision 网络段/
     preview/apply 腿不可中断——「长操作必须可取消」的端口面缺口，跨域）。
  4. 失败/取消后 `.vua/imports` 解包残留清理策略（需回滚分支小重构）。
- **证据（ personally green，date 实测）**：cargo test 五 crate **815/0**
  （unity-bridge 80＝既有 77＋新钉 3〔集成 2＋源内 1〕；orchestrator 234＋
  provider-host 288＋project-manager 150＋acquisition 63 全零回归——
  provider-host/acquisition fake 全带指纹，硬要求零涟漪）＋clippy 五 crate
  --all-targets **0 警告 0 错误**＋desktop typecheck 双 tsconfig **exit 0**
  ＋git diff --check clean。未触碰 VUA-7/VUA-8 及其分支（全程未 git fetch
  之外的跨树操作）。
- **诚实边界维持：零端到端宣称**——本批全部结论系代码面＋fake/手工归档
  证据；三缺陷是否被用户真机素材（中文 prefab 名「改変」、带空格目录
  「2P Color」、94MB 大包）实际触达属真机问题，归 W25（O-2）如实候验；
  测试绿≠真机绿。候真机清单：长路径 >260 实测、恶意归档守卫的真机复验
  （守卫测试已是环封证据，真机素材为良性包，预期零差异）。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 146 批（044cb10，2026-09-21）＝供给依赖解析批：端口面钉底（resolve_project
＋ResolveReceiptV01 三闭集＋能力位关闭 ORC-DEV-004 预留）＋VrcGetLib 三臂＋
run_provision 接线序 create→resolve→指纹重取（哨兵钉）＋失败两臂诚实；经集
成第 147 批收编（f3dc7a4f），环境座并行实现核验切片（51b38e0）fast-forward
对齐零偏差（edeaa086），操作者裁决两笔落账（Ok 携 failed 收据形态＋
no_matching_package）。第 142–145 批世代经追平壳吸收；更早段落见本文件 git
历史与 BOARD 前录（10 段轮转）。
