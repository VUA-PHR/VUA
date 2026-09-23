---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: 6525c818
updated: 2026-09-24
---
## 当前焦点
**第 159 批（2026-09-24 06:5x–07:4x，节拍轮夜间工作时段 date 实测 06:56 正常时段）
＝窗口规程 v1.8 规则 2 空队列自我反向审查批（先例＝第 148 批）＋BG-12 族环境域
四成员修复（轮首 ff-only d7da55fa→6525c818 追平集成 186 批世代，落后 154 纯吸
收；两笔＝实现批恰六文件全在本域 crates/project-manager＋本状态批）**：

- **审查范围（如实登记，五面全覆盖）**：①#43 族环境域排查——EAC 探针
  （eac_probe：精确词面分类、path 如实 None、Toolhelp 只读）、注册表读取
  （win_registry：REG_SZ 只读、缺席＝None）、OpenXR/DisplayIcon/libraryfolders
  .vdf 等外部值全部只进事实与只读存在性检查、项目路径面（vpm_backend
  validate_vpm_project_name＋import_copy validated_project_name 词法守卫在
  场）——**环境域无外部标识符内插进写路径/命令的点位，零发现**；②EAC 安
  全面回归狩猎（BG-11 已修面）——绕过原语两件
  （terminate_open_and_wait_for_test／eac_verify_windows_signature_for_test）
  均维持 `cfg(all(windows, any(test, feature = "test-hooks")))` 双门、lib.rs
  再导出同门，无新绕道成员，零发现；③M6 检查行（BG-16 已核销面）——
  fixture/真机门控分离全量盘点：11 处 `#[ignore]` 真机/手动测试全部带门控
  理由标注（eac_terminate 四件全 ignore＋原语件再加 feature 门＝双门、
  eac_probe/eac_allowlist_verify 真机件 ignore、editor_verify 真机件 ignore、
  environment_engine/environment_managers 手动件 ignore），默认 cargo test
  零真实进程触碰，无漂移；版本解析边界（editor_targets：f/p/b/a/t 闭集词
  表、c 后缀 split_once、不完整词面拒绝）与 EMBEDDED_VRC_GET_VPM_VERSION
  "0.0.16" 钉版（Cargo.lock 一致＋tests/environment.rs:817 lockstep 断言）
  核实无洞；④⑤见下四修复与核实项。
- **任务＝BG-12 族环境域四成员修复（发现即修、测试钉死，全部域内小修）**：
  - **F1 import_copy.rs `let _ = set_product_name(...)` 双重吞错**——副本自
    身 productName 写失败（1.2.0 规格项 1）被调用点 `let _ =` 丢弃（该行源
    自 014 初始实现 226dd419、无裁决记录），收据宣称完整成功而新项目静默
    沿用旧名；改传播为 `RejectionGuard::ExecutionFailed` 类型化拒绝（既有
    闭集 guard，零 wire 形状变化），半成品副本照词面留盘作证据。
    **set_product_name 内部两条 best-effort no-op 腿（文件缺席/无 productName
    行）系模板路径既有测试钉死的已接受语义（orc_adp_005 两钉），本批不动**
    ——钉死范围是原语语义非调用点丢弃层。
  - **F2 project_inspection.rs `manifest_map` 文档承诺警告未实现**——函数
    文档明言「wrong shape 出警告」，代码 `Some(_) | None => {}` 空臂静默，
    且对象内非字符串版本值被静默跳过（部分可读清单呈报为完整空表）；兑现
    承诺：wrong-shape 字段与被跳过条目（逐 id 点名）各出
    `MANIFEST_SCHEMA_UNEXPECTED` 警告，manifestSchemaOk 保持 true（合法
    JSON 对象，形状发现走 diagnostics），diagnostics 码族匹配 snapshot
    schema 的 `^vua\.(project_inspection|env_managers)\.` 开放 pattern，零
    wire 形状变化。
  - **F3 project_inspection.rs `inspect_one` ProjectVersion.txt 存在但读失败
    静默**——`if let Ok` 把观测失败（权限/无效 UTF-8）与设计内缺席同等静
    默；改三分：NotFound＝设计内静默缺席，其余错误出
    `PROJECT_MARKERS_INCOMPLETE` 警告（与 env-managers 面 read_project_markers
    同码族，消除两 faces 诚实性漂移），版本照旧不猜测（unityVersion 保持
    None）。
  - **F4 environment_managers.rs `string_array` 非字符串项静默丢弃**——
    filter_map 把混合类型数组里的非字符串项无声吞掉（已注册项目从发现面
    消失且无迹可寻）；改保留可读字符串＋被丢弃项计数出
    `VCC_SETTINGS_SCHEMA_UNEXPECTED` 警告（含 field 名），发现照旧推进。
  - **测试钉死四例**（零既有断言放松）：import_copy
    `failed_product_name_write_refuses_instead_of_silent_success`（只读位经
    fs::copy 权限位继承落副本→写腿必然失败→断言 ExecutionFailed＋detail
    点名 productName＋半成品留盘）；project_inspection
    `partially_readable_manifest_maps_announce_what_was_skipped`＋
    `unreadable_project_version_file_announces_itself_instead_of_silence`
    （无效 UTF-8 钉 InvalidData 臂）；environment_managers
    `mixed_type_user_projects_keeps_strings_and_announces_the_dropped_entries`
    （42/null 双非字符串项）。
- **⑤诚实纪律核实（零发现）**：Unity 中国版 `2022.3.22f1c1` →
  OtherUnityVersion＋EDITOR_CHINA_DISTRIBUTION 特定诊断、Tuanjie →
  TuanjieFamily＋EDITOR_TUANJIE_UNSUPPORTED（词表解析假设有记录注记），
  与 docs/compatibility/unity-editor 支持矩阵词面一致；域内零
  ProjectVersion.txt 写路径（版本编辑用户控制权未被绕过，文档「保持原状」
  与代码一致）。
- **残余登记（不代决，候后续协议工作）**：F1 修复后仍余模板路径钉死的
  best-effort 语义在 import-copy 语境的暴露面——源项目 ProjectSettings.asset
  缺席或缺 productName 行时，副本不获自身身份而收据宣称成功（reInspection
  块不载 productName）；诚实收口需收据增字段＝project-ops 冻结词面升版，
  候提案工作非本拍可域内小修，此处只登记事实与候选方向。
- **collab:brief ①区甄别结论（按派定带一句）**：本拍轮首 brief ①区已无指
  向本座的阻塞/留言；既往验收请求留言对应批次已随集成第 181/183/184/185/186
  批入库，属过时留言不需要处理，无需回执。
- **闸口读数（本拍亲测）**：cargo test --workspace **983/0**（113 测试目标
  ＋28 ignored；集成 186 批基线 979＋恰本批 4 新例，数字自洽）＋cargo clippy
  --workspace --all-targets **0 警告 0 错误**（exit 0 双复核）。本批纯
  crates/project-manager 变更，TS 侧零触碰。VUA-7/VUA-8 零触碰，用户素材目
  录零触碰，冻结词面零字节触碰（无协议本/无 schema/无 C# 改动）。

## 前情
- 第 158 批（2026-09-22 01:0x）＝#45「C# dormant 收窄」B 案先行注记切片
  （协议本双语 0.2.1 注记＋material_exec.rs 两注释校准＋REGISTRY 同步），
  两笔 dddeb5dc＋d7da55fa 已随集成分批验收入库（merge-base --is-ancestor
  本拍核实）。第 154 批＝#45 两案权衡稿；第 146 批＝resolve_project 环境实
  现核对切片。更早见本文件 git 历史。

## 本轮交付（6525c818 基线世代）
- **实现批**（恰六文件全在本域 crates/project-manager：src/import_copy.rs＋
  src/project_inspection.rs＋src/environment_managers.rs＋tests/import_copy.rs
  ＋tests/project_inspection.rs＋tests/environment_managers.rs）。
- **本状态批**（恰本文件一笔）：审查范围与结论＋四修复记录＋闸口读数登记。
- 零新依赖、零新契约面、零 wire 形状变化（diagnostics/guard 皆既有闭集内
  复用）、零 C# 触碰、零文档版本变化。

## 在途/待他角色
- **[候集成] 第 159 批两笔验收**（实现批＋本状态批；实现批含 crates/ 源码
  改动＝**非纯 collab 面，须全量测试**，本拍已附 workspace 983/0（113 目标
  ＋28 ignored）＋clippy 0/0 读数候复核；--no-ff，写明「wt-6 第 159 批
  BG-12 族环境域四成员修复批（基线 6525c818）」）。
- **[候办·登记不代决] import-copy 收据 productName 暴露面**（见当前焦点残
  余登记；候 project-ops 词面升版提案，届时按切片流走三处同批）。
- **[等用户] W25 窗环境候办**（EAC 真机四件套＋B 段＋E2 运行中探测＋允许
  清单首批；F4/F5 全链真机呈现确认；供给链「解析落地」真机走查随 W25 O-2；
  A 案 C# 拒收垂直切片在 W25 序列，BOARD #45 行 (8) 项）。
- **[等操作者] 上世代指派分歧两处非阻塞裁决**（Err 字母 vs 落地面诚实不完
  整收据；reason_code 家族码 no_matching_package vs repo_not_found）——维持
  登记。

## 阻塞
- 无。等待项均非阻塞。

## 下次合并意图
本拍两笔候集成随轮收编：实现批（六文件，测试已绿附读数）＋状态批（恰本文
件）。写明「wt-6 第 159 批 BG-12 族环境域四成员修复批（基线 6525c818，实现
批＋状态批各一）」。提交后读数（rev-list 对 origin/main 实测）：**领先 2、
落后 0**（实现批＋状态批，实质领先 1）。

## 待命声明（第 6 步，如实）
本轮（2026-09-24 06:5x–07:4x）：①date 实测 06:56＝正常模式；②`pnpm
collab:brief`（①区无指向本座阻塞/留言＋过时留言甄别如上）＋读本座状态文件
＋按操作者派定领取＝空队列反向审查；③ff-only d7da55fa→6525c818 追平（纯吸
收 154 commit）；④全域通读：eac_probe/eac_terminate/eac_verify/eac_allowlist/
editor_verify/environment_managers/project_inspection/project_lock/vua_identity/
import_copy/vpm_backend（扫描＋命中段精读）＋核心 environment.rs/editor_targets.rs/
win_registry.rs，五审查面逐项过（结论见当前焦点）；⑤四修复恰六文件（三源
码＋三测试），零域外触碰；⑥闸口亲测 workspace 983/0（113 目标＋28 ignored，
最终文本单趟）＋clippy --workspace --all-targets 0/0；⑦诚实边界：零端到端
宣称——四修复系代码面＋合成 fixture 测试事实，真机行为归 W25 候办，测试绿
≠真机绿；残余暴露面如实登记不藏；⑧磁盘未复测（本拍无构建产物增长面，合并
树复跑由集成亲测照旧）；VUA-7/VUA-8 零触碰。在手无半途切片、除本两笔外无
未提交改动。完成后推送并待命。
