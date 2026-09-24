---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: 95690969
updated: 2026-09-25
---
## 当前焦点
**第 160 批（2026-09-25 02:1x–03:3x，节拍轮夜间工作时段 date 实测 02:10 正常时段）
＝窗口规程 v1.8 规则 2 空队列自我反向审查批（先例＝第 148/191 批；操作者第 194
拍派定四审查面）＋半写面域内修复（轮首 ff-only 7177ca23→95690969 追平集成 193
批世代，落后 41 纯吸收；两笔＝实现批恰两文件全在本域 crates/project-manager＋
本状态批）**：

- **审查面①（resolve_project 失败集确定性——第 190 批集成登记核实，结论＝
  实锤且比登记更重；非严格诚实性违例而是失败证据不稳定；最小修建议候裁决，
  本批不实现）**：库源实核（锁定依赖 =0.0.16 逐行读）：`ResolvePackageErr::
  DependenciesNotFound` 的 dependencies 载体＝`MissingDependencies.dependencies`
  ＝`std::collections::HashMap<Box<str>, VersionRange>`（package_resolution.rs
  :403–431），`into_vec()` 即 `into_iter().collect()`——Rust HashMap RandomState
  **每进程加盐**，同一工程＋同一环境两次运行顺序都不同，比 190 批登记的「库内
  map 顺序不确定」更强。vpm_backend.rs DependenciesNotFound 臂（:2126–2138）
  failed 逐依赖入列未排序（对照：resolved 显式 `sort_by id` :2176 先例在案）。
  下游全量 grep 唯一顺序消费者＝素材链 material_exec.rs:670 `receipt.failed
  .first()`——失败消息点名的 id 随运行漂移；reason_code 系全条目同一常量
  （no_matching_package），结局零漂移（非空 failed 集恒定令供给失败照常回滚）。
  **诚实性归类（候裁核心事实）**：失败被如实呈报、无虚构成分，不构成诚实纪律
  第 2 条违例；构成的是**失败证据可复现性缺陷**（同一成因两次取证的点名 id 不
  同）。**最小修建议（一行＋一钉，零 wire 形状/零冻结面）**：DependenciesNotFound
  臂 failed 收集后 `sort_by(|l, r| l.id.cmp(&r.id))`（与 resolved 同律同位）＋
  多依赖不可解测试钉断言 id 序；素材链 first() 随之确定，unity-bridge 零触碰。
  按派定措辞「给最小修建议候裁决」本批只登记不实现，候操作者裁决。
- **审查面②（collection_world 过滤第六装载点逃逸狩猎——零发现）**：全文件
  六个 `collection_world(` 调用点逐一归属：`list_packages_v02`(:1141)／
  `repo_catalog`(:1487)／`preview_install`(:1657)／`apply_install`(:1902)／
  `resolve_project`(:2052)／`package_catalog_impl`(:2286)；全仓 17 处
  `PackageCollection::load/load_cache` 全部吃 `&world`（过滤克隆），零绕过；
  preview_install_for_plan 两臂委托复核在位（既有工程→preview_install；新鲜
  工程→模板隔离副本后同面）；repo_catalog 第 2 层禁用行强制按「未装载」呈行
  （:1572–1593 disabled_row 判定，配置视图零隐藏）复核正确。**顺手校准一处域
  内注释漂移**：collection_world 文档自称「全部装载点」但枚举漏列
  resolve_project（第 146 批接入者），就地补枚举＋标注批次（零行为零词面，
  批 192 注释校准先例）。
- **审查面③（启停状态文件损坏/半写行为——读侧既有钉已诚实，写侧偏离家法
  →本批修复）**：读侧 `load_disabled_set`(:720–735) 三分正确：缺席＝全启用的
  诚实空态；存在但不可读/schema 版本不符＝拒绝（绝不猜「全启用」），既有双钉
  在位（f4_collection_world_corrupt_state_file_refuses_every_loader_never_
  guesses :3485、f6_resolve_corrupt_state_file_refuses_like_every_collection_
  consumer :4369）。写侧 `write_disabled_set` 原为裸 `fs::write` 原位截断写——
  断电窗口把文件截成半份 JSON，此后**全部集合装载面**（catalog/preview/apply/
  resolve/list_packages_v02）以 backend_unavailable 拒绝服务直至用户手工删档，
  与工作区家法相悖（orchestrator/state_file.rs:162 ORC-STO-003 原子替换＋
  plan_documents/recipe_documents/assembly 同律五先例）。**修复**：同目录
  `.tmp` 伴兄弟写入＋`sync_all`＋`fs::rename` 原位替换（std 在 Windows 走
  MOVEFILE_REPLACE_EXISTING 同卷确定性）；**刻意不取** material_identity 的先
  remove 后 rename 变体——两步间崩溃制造「文件缺席」，而词面「缺席＝全部启用」
  会把禁用集静默丢失，恰是本面最不可接受的猜测面；直接 rename 下崩溃只落旧完
  整档或新完整档，永不缺席永不半份。**测试钉**（零既有断言放松）：
  `f4_state_write_leaves_no_temp_residue_and_replaces_in_place`——死进程残留
  `.tmp` 不碍切换且被消费、二次写原位替换内容精确、成功后 `.vua` 恰一份状态档
  零残渣。诚实边界：断电原子性本身单元测试不可安排，钉的是写方可观测契约。
- **审查面④（C# dormant 守卫句在协议本的在场与准确性——零发现零动作）**：
  material-intake v0.2.1 注记**双语在场**（EN :55–77／ZH :36–55），守卫句＝
  第 (2) 条「约束性移除顺序」。事实逐项实核全部准确：C# 面字母
  （BridgeCommandProcessor.cs `MaterializeExtractedPackage` 条目跳过条件
  `Assets/` 与 `Packages/` 双前缀接受 :266–271，从来非 Assets/-only）；闸门一
  （检查面预检 material_intake.rs:514–527 落盘前 `Packages/` 拒绝）在位；闸门
  二（执行面解包臂第一遍整体拒绝 material_exec.rs:1366）在位且恰三物化消费点
  共用（:751/:910/:1185）；仓内被检验事实＝两枚测试钉在位
  （packages_prefixed_archive_is_refused_before_anything_lands／
  mixed_assets_and_packages_archive_is_refused_whole_never_partially）；第 158
  批两处注释校准原样在场（:1359/:1685–1687）。零漂移。
- **collab:brief ①区甄别结论（按派定带一句）**：本拍轮首 brief ①区无指向本
  座/本角色的阻塞与留言；190 批 [知会环境/wt-6] 失败集观察即本批审查面①，已
  实核升级（HashMap 每进程加盐）并按派定候裁登记如上。
- **闸口读数（本拍亲测，方法如实）**：cargo test --workspace 首跑 1 失败（未
  及捕获用例名），**两连复跑全绿 993/0（28 ignored；grep 计 106 条 Running 测
  验行——与既往批「113 目标」计数法差异系统计口径，测试数 993＝集成 193 批根
  992＋恰本批 1 新例自洽）**；首跑一例与 189/190/193 批已登记测试侧时序敏感族
  同形（#7 判例归因：本批 diff 恰两文件全在本域 vpm_backend 面、与
  bdl/provider-host SQLite 面零代码关系＋复跑零代码改动全绿），如实登记不饰。
  cargo clippy --workspace --all-targets **0 警告 0 错误**（0 计数复核）。
  VUA-7/VUA-8 零触碰，用户素材目录零触碰，冻结词面零字节触碰（无协议本/无
  schema/无 C# 改动；unity-bridge 两注释仅核读未改）。

## 前情
- 第 159 批（2026-09-24 06:5x）＝空队列自我反向审查＋BG-12 族四成员修复
  （F1 import_copy set_product_name 吞错→ExecutionFailed 类型化拒绝；F2
  manifest_map 文档承诺警告兑现；F3 inspect_one ProjectVersion 读失败出
  PROJECT_MARKERS_INCOMPLETE；F4 string_array 混合数组保字符串＋计数警告；
  四钉＋残余 import-copy 收据 productName 暴露面候词面升版），两笔
  ae0df1b4＋7177ca23 候集成（本拍轮首 ff-only 已随 95690969 吸收，
  rev-list 核实）。第 158 批＝#45「C# dormant 收窄」B 案先行注记切片；
  第 154 批＝#45 两案权衡稿；第 146 批＝resolve_project 环境实现核对切片。
  更早见本文件 git 历史。

## 本轮交付（95690969 基线世代）
- **实现批**（恰两文件全在本域 crates/project-manager：src/vpm_backend.rs
  ——write_disabled_set 原子替换＋collection_world 枚举注释校准；
  tests/vpm_backend.rs——f4 原子写钉一例）。
- **本状态批**（恰本文件一笔）：四审查面结论＋半写面修复记录＋①号候裁登记
  ＋闸口读数登记。
- 零新依赖、零新契约面、零 wire 形状变化、零 C# 触碰、零文档版本变化。

## 在途/待他角色
- **[候集成] 第 160 批两笔验收**（实现批＋本状态批；实现批含 crates/ 源码
  改动＝**非纯 collab 面，须全量测试**，本拍已附 workspace 993/0 两连跑＋
  clippy 0/0 读数候复核；--no-ff，写明「wt-6 第 160 批环境域自我反向审查＋
  半写面原子写修复批（基线 95690969）」）。
- **[候操作者裁决·非阻塞] resolve_project 失败集排序硬化**（审查面①：最小
  修一行＋一钉已给出；按派定「候裁决」本批未实现；190 批登记不确定性已实核
  关闭——HashMap 每进程加盐、素材链唯一顺序消费者 material_exec.rs:670）。
- **[候办·登记不代决] import-copy 收据 productName 暴露面**（第 159 批残余
  登记；候 project-ops 词面升版提案，维持登记态）。
- **[等用户] W25 窗环境候办**（EAC 真机四件套＋B 段＋E2 运行中探测＋允许
  清单首批；F4/F5 全链真机呈现确认；供给链「解析落地」真机走查随 W25 O-2；
  A 案 C# 拒收垂直切片在 W25 序列，BOARD #45 行 (8) 项）。
- **[等操作者] 上世代指派分歧两处非阻塞裁决**（Err 字母 vs 落地面诚实不完
  整收据；reason_code 家族码 no_matching_package vs repo_not_found）——维持
  登记。

## 阻塞
- 无。等待项均非阻塞。

## 下次合并意图
本拍两笔候集成随轮收编：实现批（两文件，测试已绿附读数）＋状态批（恰本文
件）。写明「wt-6 第 160 批环境域自我反向审查＋半写面原子写修复批（基线
95690969，实现批＋状态批各一）」。提交后读数（rev-list 对 origin/main 实
测）：**领先 2、落后 4——集成第 194 批（wt-5 第 193 批验收，PR #34）在本拍
提交窗口内落库，四笔恰 bdl-store 测试＋wt-5 状态批，与本批两笔零文件交集
实核**；本拍收尾以合并吸收该四笔（纯吸收），**候验收读数＝领先 3、落后 0**
（实现批＋状态批＋吸收合并笔）。

## 待命声明（第 6 步，如实）
本轮（2026-09-25 02:1x–03:3x）：①date 实测 02:10＝正常模式；②读
collab/PROTECTED_MAIN.md 后跑 `pnpm collab:brief`（①区无指向本座阻塞/留言）
＋读本座状态文件＋按操作者第 194 拍派定领取＝环境域自我反向审查四审查面；
③ff-only 7177ca23→95690969 追平（纯吸收 41 commit）；④四审查面逐项过：
库源逐行实核（vrc-get-vpm 0.0.16 package_resolution.rs/resolve.rs）＋vpm_
backend 全装载点归属 grep＋C#/Rust 两闸门与协议本双语逐条对读（证据见当前
焦点）；⑤恰一修复（原子写＋测试钉）＋一注释校准＋一候裁登记，恰两文件全在
本域，零域外触碰；⑥闸口亲测 workspace 993/0 两连跑（首跑一例未复现按 #7
判例如实归因登记）＋clippy --workspace --all-targets 0/0；⑦诚实边界：零端
到端宣称——原子写系代码面＋合成 fixture 测试事实，断电原子性本身不可单元
安排如实标注，真机行为归 W25 候办，测试绿≠真机绿；①号缺陷如实归类为证据
不稳定而非诚实违例、不代决；⑧磁盘未复测（本拍无构建产物增长面）；VUA-7/
VUA-8 零触碰。在手无半途切片、除本两笔外无未提交改动。完成后推送并待命。
