---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: d0da0abe
updated: 2026-09-24
---
## 当前焦点
**第 180 批（2026-09-24 06:1x–06:4x，节拍轮正常工作时段 date 06:11 实测；三笔：
实现批 5533298b＋追平壳 8e668e4f（纯吸收集成第 186 批 PR #18＝wt-2 第 178 批
入库）＋本状态批恰本文件）＝数据所有权域自我反向审查批（先例＝第 148 批；
collab 队列全空，窗口规程 v1.8 规则 2 空队列不空转）。五面审查、五发现即修
（#43 族路径逃逸一＋诚实纪律捏造时间戳一＋下载事件闸洞 panic 类一＋BG-12 族
store 读面两成员＋BG-12 律对齐 Done 载荷三处），全部域内小修＋测试钉死；其余
审查面闭合无发现，如实登记。零 [需用户] 新增，零跨域触碰，零 schema/词面变化
（per-kind 律系既有冻结 schema 的执行，零格式变化）。**

- **追平**：轮首 ff-only 87db64f1→7a05be5d（落后 52/领先 0 归零，纯吸收集成
  第 185 批）；轮中 origin/main 前进至 d0da0abe（第 186 批 PR #18），实现批提
  交后 merge-tree 预检 exit 0、--no-ff 追平壳 8e668e4f 纯吸收（与本批五文件零
  交集；core 座 warehouse_entry_detail 消费面吞错修与本批 store 面类型化修复
  互补——本批新增 CorruptValue 错误路径恰由其新落任务级码面诚实传播）。
- **brief ①区甄别（如实一句）**：本轮 brief ①区＝无指向本树/本角色的阻塞与
  留言（操作者派单所载历史验收请求残言经核系世代滞后，对应批次已随集成第
  181/183/184/185 批收编，第 176 批两笔在 main 在案，零待办）；失鲜工作树无。
- **发现一（修复，#43 路径形态族数据域新成员）＝adoption 目标文件名未守卫**：
  `DownloadAdopter::adopt_download` 将端口事件携带的 `suggested_file_name`
  （＝Electron `DownloadItem.getFilename()`＝服务端可控的 Content-Disposition
  内容）**原样** join 进 `warehouse_root/<whi-id>/` 再 `fs::copy`——绝对路径
  形态在 Windows 上 join 整体替换、`..` 段逃逸条目文件夹，宿敌服务端可命使
  采纳副本落仓库外任意可写路径。同文件 inspected 侧（artifact_inspection）
  有 canonical 包含网而 adopt 侧零守卫，反差即缺口。修法与端口自身纪律同律
  （TS `#reserveStagingPath` 早已只取末段）：`adoptable_file_component` 取
  `/`/`\` 归一后的**末段分量**为落盘名（空/`.`/`..` 不可用则回退暂存文件名分
  量），verbatim 建议名仍原样留事件面作展示元数据。测试钉死
  `a_path_like_suggested_name_never_escapes_the_entry_folder`（`..\..\evil.zip`
  落条目内为 evil.zip、逃逸目标不存在、relative_path 携守卫后分量）。
- **发现二（修复，诚实纪律违例）＝generate-VPM 落库时间戳系捏造常量**：
  `warehouse_maintenance.rs` 生产区 `now_rfc3339()` 写死
  `"2026-09-06T00:00:00.000Z"`，generate_vpm 落库的
  `local_artifacts.first_seen_at` 与 `artifact_copies.created_at` 全为假观察
  时间（provider_host `warehouse.generateVpm` 生产可达；clock 从未注入系占位
  残留）。修法＝删除常量助手，两写点改 `SystemClock.now_rfc3339()` 真实读数
  （零签名变化零跨域触碰）。happy-path 测试增断言：非退场常量、created_at ≥
  跑前读数（定宽 UTC 字典序＝时序）、first_seen_at 为真实读数。
- **发现三（修复，下载事件闸洞→panic 类）＝completed 事件 per-kind 律未入
  闸**：冻结 schema（download-events v0.1）对 `download.completed` **要求**
  `storedPath`＋`receivedBytes`（then 块 required），但 Rust 镜像两字段系普
  通 Option、check_sequence/store 均未执行该律；TS 生产者自身可发
  `storedPath: null`（`item.getSavePath() || … || null`），事件合法序列入库
  后 `staging_completion` 两个「schema requires」`expect` 使**其后每次**
  completion-manifest 读取（downloads.listCompleted／adopt／inspect）panic。
  修法＝三层：①`check_sequence` 入闸（违律 completion 永不及事实日志，沿
  「Invalid sequences never reach the fact log」既有律；拒绝码走既有
  IllegalSequence 族，reason 如实指认 schema 律）；②`fold_lifecycle` 同律
  （在库历史行折叠为类型化错误＝存量腐败诚实呈现）；③`staging_completion`
  两个 expect 改防御性 `CorruptValue` 映射——panic 类结构性消灭。测试钉死三
  例：入闸拒绝且零追加／raw 追加腐败行折叠 IllegalSequence／list 面答
  CorruptValue 不 panic 不静默空表。
- **发现四（修复，BG-12 族 store 读面两成员）＝bdl_store 腐败值静默降级与数
  据依赖 panic**：member A＝`effective_mode` 对腐败存储 `artifact_mode`
  `unwrap_or(global_default)`——解析 Err 静默降为「无覆盖」，对条目解析决策
  作假陈述；member B＝`warehouse_card`/`warehouse_entry_detail` 两个
  `.expect("stored mode is enum-validated")` 数据依赖 panic——「枚举已验证」
  主张实系列级 CHECK 约束（schema 001 第 119 行），跨 SQL 的存储漂移即炸裂
  读面。修法＝两 surf 均传播类型化 `CorruptValue`（CHECK 仍是存储层主律，读
  面系防御层；与同文件 kind/failure/state 既有 `?` 模式对齐）。测试钉死：
  `PRAGMA ignore_check_constraints` 诚实模拟非 SQL 存储漂移，cards/detail 双
  面断言 Err(CorruptValue) 不降级不 panic。**附带 member C＝`catalog_status`
  `.parse().ok()` 把非整数 `catalog_updated_seq` 吞成 health=unknown，而同
  文件写面对同一解析失败映射 CorruptValue（孪生臂不一致）——改传播
  CorruptValue，测试钉死。**
- **发现五（修复，BG-12 律对齐）＝任务 Done 载荷 `unwrap_or(Value::Null)`
  三处**：warehouse_import 与 warehouse_maintenance（delete-originals／
  generate_vpm）Done 载荷序列化失败会呈现为「成功＋null 载荷」（诚实纪律第
  2 条违例）；本 crate adopt 文件既有 BG-12 不变量注释＋expect 律，三处对齐
  （纯数据形状 serde 不可失败，expect 系不变量守卫非数据依赖）。
- **审查闭合面（无发现，如实）**：①#43 族数据域其余点位＝干净——whi-/cpy-
  标识符全部内部生成、folder_name 恒 VUA 生成 id 永不派生展示名（warehouse-
  layout ruling 2）、SHA 身份写入侧 `is_sha256_identity` 闭集校验、import
  relative path 系真实文件遍历产物（strip_prefix）＋SourceInsideWarehouse
  canonical 兜底、generate publish root 系内部 id 插值（#7 加固serial在
  位）、staging_token 系 AMF 内部一致性绑定从不作路径；②排序/分页确定性
  （BG-17 回归狩猎）＝干净——catalog_list ORDER BY product_id（booth:<数
  字>）＋limit/offset 先滤后切、adoptable 列表 sort_by completed_at 稳定排
  序且生产者唯一（TS `toISOString()`）格式定宽一致、事件折叠序 (attempt,
  event_id) 确定+offset 偏序；③诚实纪律＝lookup total:0 诚实空集（030 注记
  承诺面）维持、listCompleted 缺席文件诚实缺席不列、墓碑（missing）永不物
  理删除且永不入卡、拒绝必携 reason（rejection without a reason 不是诚实判
  定）、确认唯一写路径 confirm_dependency_resolution；④下载事件面＝六事件
  闭集双向（name/parse 往返）＋at-least-once 去重键＋attempt ≤3 冻结界
  （retry_decision GiveUp）＋terminal 后零事件（adjudicated retry 例外）全
  部在位；⑤dependency_extract＝纯解析器确定性零文件系统零网络维持。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 176 批（09-23）＝030/1.5.0 数据域对账注记（内联线程三点：五环完全存活/
来源补充落点只登记/依赖降级路径一句落点），已随集成收编入库（bf0cd769/
5dcb5588 均在 main）。第 168 批＝dependencies.* v0.5 正式冻结（bdl-queries
v0.5＋匹配/advisory 规则 v1＋向量＋消费测试）。第 166/158/155 批更早见
BOARD 前录。

## 本轮交付（7a05be5d 基线起步，轮中吸收 d0da0abe）
- **实现批 5533298b＝5 文件 357+/34-，全在本席所有权域**：crates/bdl-store/
  src/bdl_store.rs（effective_mode/warehouse_card/entry_detail 类型化＋
  catalog_status 传播＋三新例）；crates/bdl-store/src/download_events.rs
  （per-kind 律双闸＋staging_completion 防御映射＋两新例）；crates/
  acquisition/src/warehouse_download_adopt.rs（adoptable_file_component 分
  量守卫＋一新例）；crates/acquisition/src/warehouse_import.rs（Done 载荷
  律）；crates/acquisition/src/warehouse_maintenance.rs（真实时钟＋Done 载
  荷律×2）。docs/ schemas/ packages/ 零触碰；冻结词面零字节触碰（download-
  events v0.1 schema 零改动——本批系把冻结律从 wire 面执行到闸）。
- **门禁读数（如实）**：实现批树 cargo test --workspace **982/0**（第 185
  批基线 976＋恰本批 6 新例，112 套件）＋clippy --workspace --all-targets
  **0/0**；追平壳后合并树复跑 cargo test --workspace **985/0**（＋恰 wt-2
  第 178 批 3 新例＝ph_007a＋两 resolve 钉，自洽）＋clippy **0/0**。轻负载
  拍纪律兑现：cargo 全程在本树 VUA-5 内顺序跑，用户交付栈（vite 5173＋
  electron CDP 51993）与 VUA 主树零触碰。测试全部临时目录夹具。
- **环境事实**：零 BOOTH 访问、零网络动作、零 %APPDATA% 读写、用户素材目录
  （basic/fuku）零触碰、deleteOriginals 仅测试夹具内行使、VUA-7 零触碰
  （阅读解禁）、VUA-8 零触碰。

## 在途/待他角色
- **[等集成] 本拍候验收**，写明「wt-5 第 180 批：数据域自我反向审查批（基线
  7a05be5d，轮中吸收 d0da0abe）」。重点复核面：①发现一守卫落点（分量守卫
  与端口自身 #reserveStagingPath 同律；verbatim 名留展示面）；②发现三信任
  链（schema then-required ↔ Rust Option ↔ TS `|| null` 生产者 ↔
  staging_completion 旧 expect）与三层修法；③发现四 CHECK 主律/防御层双层
  故事与 PRAGMA 测试手法；④发现二零签名变化（SystemClock 直用非注入）的裁
  量；⑤新旧错误路径与 core 座第 178 批消费面修复的互补性（本批
  CorruptValue 恰被其 vua.warehouse.store_failed 面诚实传播）。
- **[候硬化登记] interrupted/failed per-kind 律同样未入 Rust 闸**（schema：
  interrupted 要求 storedPath、failed 要求 failureKind）——本批未修：二者
  现状无 panic 无不诚实消费（failed 缺 failureKind 落「unknown」诚实默认；
  interrupted 无路径无消费者），修之将扩大 ingest 行为变化超出本拍缺陷半
  径，如实登记候后续顺带，不单开。
- **[候操作者/产线] 来源补充/确认工作流实施面**与 **[等操作者/用户] W25 真
  机走查推进**维持（第 176 批登记不变）。

## 阻塞
- 无阻塞。既有 [需用户] 项（95MB 重复条目清理等）维持候裁，本批零代决零触
  碰 %APPDATA%。

## 下次合并意图
**候验收对象＝本拍三笔（实现批 5533298b＋追平壳 8e668e4f＋本状态批恰本文
件），写明「wt-5 第 180 批：数据域自我反向审查批（基线 7a05be5d，轮中吸收
d0da0abe）」**。代码批全量门禁已亲测全绿（实现批树 982/0＋合并树 985/0＋
clippy 两次 0/0）。走 PROTECTED_MAIN 政策通道（集成树 PR 落地，正典 main
只快进）。

## 待命声明（第 6 步，如实）
本轮（2026-09-24 06:1x–06:4x，正常工作时段 date 06:11 实测；三笔：实现批
＋追平壳＋本状态批）：①date 06:11 实测正常时段；读 collab/PROTECTED_MAIN.
md 后跑 pnpm collab:brief，①区判读＝无指向本树/角色阻塞与留言，失鲜工作
树无；②轮首 ff-only 追平 7a05be5d（落后 52/领先 0 归零）；③队列全空，领
取窗口规程规则 2 数据域自我反向审查（操作者派定，先例第 148 批），五面审
查全域源码实读（bdl-store 四文件＋acquisition 四文件＋schema CHECK 面＋
TS download-port 生产者＋provider_host 消费链定位）；④五发现即修（#43 族
adoption 路径逃逸＋捏造时间戳＋completed 律闸洞 panic 类＋BG-12 读面两成
员＋Done 载荷律三处），全部域内小修＋测试钉死（恰 6 新例）；闭合面五件如
实登记（#43 其余点位/排序确定性/诚实空态与墓碑/六事件闭集与 attempt 界/
extract 纯解析器）；⑤一处候硬化登记（interrupted/failed per-kind 律）不
阻塞；⑥门禁实现批树 982/0＋合并树 985/0＋clippy 两次 0/0 亲测全绿，轻负
载纪律顺序跑、主树与交付栈两进程零触碰；⑦轮中 main 前进（第 186 批）预检
后 --no-ff 纯吸收、与本批零交集、互补性已核；⑧诚实边界维持＝代码面测试非
真机、零端到端宣称、[需用户] 零代决、%APPDATA% 零触碰、VUA-7 零触碰（阅
读解禁）、VUA-8 零触碰、用户素材目录零触碰。在手无半途切片、除本状态批外
无未提交改动。完成后推送并退出待命，候集成验收本拍三笔。

## 留言
- [→集成] 验收请求：**候验收对象＝本拍三笔（实现批 5533298b＋追平壳
  8e668e4f＋本状态批），写明「wt-5 第 180 批：数据域自我反向审查批（基线
  7a05be5d，轮中吸收 d0da0abe）」**。重点复核面见「在途/待他角色」①–⑤。
  门禁：实现批树 cargo test --workspace 982/0（976 基线＋恰 6 新例）＋clippy
  0/0；合并树 985/0（恰＋第 186 批 3 新例）＋clippy 0/0。
- [→核心/wt-2]（互补性知会）：你席第 178 批 run_local_resolution 两 member
  修复与本批 store 面修复互补成立——本批新增的 bdl_store CorruptValue 路径
  （腐败 artifact_mode/catalog seq/completed 事件）现均经你席新落
  vua.warehouse.store_failed 任务级码面诚实传播，两批合并树 985/0 全绿在
  案；你席候硬化登记（3220 schemaVersion 标签）与本批候硬化登记
  （interrupted/failed per-kind 律）性质同类，均候后续顺带。
- [→桌面/wt-3]（知会）：downloads.listCompleted 面新增一条诚实失败路径——
  违律 completed 事件（storedPath/receivedBytes 缺失）现于 ingest 闸被拒
  （响应 rejected 数组 per-event 携 code=vua.download.illegal_sequence），
  不再入库不再使后续列表读取崩溃；正常事件行为逐字节不变（全量 976→982 恰
  ＋6 自洽）。
- （回执不回执：在途事项以 BOARD 与本状态文件当前焦点为准。）
