---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 9d7e6c17
updated: 2026-09-22
---
## 当前焦点
**第 164 批（2026-09-22 03:3x–04:1x，节拍轮工作时段 date 03:32 实测）＝
提案 029 B 面环 3 执行器实现批（操作者第 164 批指派；座位＝集成第 163
批登记的操作者裁决「环 3 座位归核心域，照协议本原文」——第 162 批
如实双录的两处不一致词面就此收敛，无猜测代决）。轮首 fast-forward
追平 main 9d7e6c17（落后 6/领先 0 归零，吸收集成第 163 批双栈验收
批）。实现产物（提交 4f911abc，恰 8 文件 1004+/87-；零新依赖
Cargo.toml 零 diff；冻结词面零字节触碰——schemas/recipe-export/v0.1
全目录未触；VUA-7/VUA-8 全程零触碰）**：

- **真实执行器**：orchestrator recipe_export.rs 新增
  `OnDiskProjectDraftExporter` 实现 `ProjectDraftExportPort`——013 检
  查聚合读纪律**核心侧镜像**（依赖方向禁止核心调用 project-manager，
  零新 project-manager 读面）：①`Packages/vpm-manifest.json` 文档读
  （仅文件计数＝聚合 manifest_present 门；仅字符串值条目＝聚合
  manifest_map 规则，非串版本值跳过绝不猜测；行集＝声明集联同 id
  locked 钉定，locked-only 传递解析事实不入行；BTreeMap 迭代天然产
  packageId 升序冻结呈现事实）；②manifest 缺席/不可读/损坏
  JSON/非对象＝诚实空行集（聚合对同类发现的自身投影——聚合侧系诚实
  告警发现绝不发明包列表；草稿七键闭集无诊断通道、错误码闭集不为落
  盘发现留码，故观察失败以事实过线照冻结词面「观察失败不设错误
  码」，绝不编造行也绝不发明错误——诚实律 1/2）；③
  `ProjectSettings/ProjectVersion.txt` 照聚合完备性门
  （`m_EditorVersion:` 行须携可分类完整版本，classify_version_string），
  缺席/不可读/残缺版本行＝null 约束＋environmentUnityVersion 条件标
  记（冻结双向 iff）；④`.vua/project.json` 三态照聚合判定边界
  （NotFound＝absent；其余读错/解析失败/未知版本＝unreadable 证据；
  marked_at 参与解析使 present/unreadable 边界与聚合身份发现一致），
  absent 非门（029 未决项 2 维持开放）；⑤路径末段为工程名来源事实，
  无末段路径＝诚实 null（Schema 词面「无名字事实可读＝null」治理草
  稿；聚合全路径回显系列表可见性显示关注不入草稿）；⑥逐调用
  uuid-v7 形草稿身份（unix-ts-ms＋进程内计数器、版本位 7、变体位
  10xx——provider-host 铸造同形律，依赖方向下核心侧镜像）＋注入时
  钟 exportedAt（ORC-TST-001：new()＝SystemClock，with_clock＝
  FixedClock 测试缝）；**全函数**——落盘观察失败一律降级为冻结词面
  预留的诚实事实，Err 臂仅为端口合同保留（其它适配器的 typed 拒
  绝，wire 已证直传纪律），本执行器永不产生。
- **能力覆写翻转**：`export_capabilities` 覆写 declared-none 默认为
  declared——环 3 翻转使 served 行与路由门转 available（F5
  template_capabilities 律 verbatim；覆写前环 2 默认使一切应答停诚
  实缺席臂）。
- **生产接线**：bin 壳（vua-orchestrator-provider.rs）draft_exporter
  槽位携带真实执行器；四处测试夹具构造点刻意维持 None（它们钉其它
  面的接线形状，不在本批指派内）。
- **测试**：executor 矩阵 9 例（合成 temp-dir 工程，逐文档对真实冻
  结 result Schema 实校验——路由盖章族常量注入信封形）：能力翻转／
  正常全投影（manifest 键序故意乱序证升序呈现事实、仅 locked 处带
  钉、locked-only 不入行、身份 present、九恒在维、固时钟
  exportedAt、uuidv7 形钉）／缺席 manifest＋零声明＋locked-only 三
  路均诚实空行集成功事实／损坏 JSON＋非对象＝诚实空行集且其余事实
  照常骑／非串版本条目跳过／版本行残缺＋版本文件缺席＝null 约束＋
  第十标记／身份三态边界四例（absent＋垃圾＋未知版本＋缺 marked_at）
  且 absent 非门／无末段路径＝null 名字事实／确定性钉（同事实＋固
  时钟＝除逐调用草稿身份外全文档全等、身份互异、序稳定）。
  **wire 串联＋2**（recipe_export_wire_v01.rs 共 11 例）：真实执行器
  骑真实路由帧循环（富注册工程种子＝校准同读的 VCC settings 注册世
  界）——Schema 实校验全冻结词面＋packageId 升序＋lockedVersion 缺
  席非 null＋身份 present＋served 行 available；损坏 manifest 工程
  以诚实空行集成功事实过线。
- **文档**：双语协议本 0.1.1→0.1.2（状态落 FROZEN AND WIRED AND
  IMPLEMENTED；能力行节命名执行器面与翻转事实；开放项划线落地；
  词面零变化）＋REGISTRY 协议本行同步 0.1.2（词干保持，执行器事实
  追加，环 2 九例枚举逐字保留）。
- **证据**：cargo test --workspace 105 套件 922/0（基线 104 套件
  911/0＝恰加本批执行器 9＋wire 链 2，零涟漪；既有 28 ignore 未触）
  ＋cargo clippy --workspace --all-targets 0 警告。
- **诚实边界**：零端到端宣称——桌面消费面尚不存在（环 4 候形状核
  可，本批零 TS 面）；全绿数字系合成工程上的代码面证据，绝不宣称
  真机；损坏 manifest 诚实空投影系冻结词面自有法则（观察失败不设码
  ＋聚合同类发现同投影），已在执行器文档与协议括注如实登记，非缺
  席与损坏的静默混同；真机导出全链归 W25（O-2）。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 162 批（00364604＋0428d9c4，2026-09-22）＝029 B 面环 2 接线批：
port face `ProjectDraftExportPort`（declared-none 默认访问器＋同步只
读签名零九态任务＋typed 拒绝 verbatim）＋typed
`ProjectDraftDocumentV01` 六事实键 deny_unknown_fields＋路由臂五段序
（packages.packageCatalog 同构，先于文档面折叠分流）＋信封双常量＋
served 行＋wire 测试 9 例骑真实帧循环＋双语协议本 0.1.1＋REGISTRY 行
同步；三码闭集零新立，零新依赖；经集成第 163 批收编（合并 bf7073d1）。
第 160 批（847de263＋19d4ba5a）＝环 1 冻结批：recipe-export v0.1 词表
行＋5 正 8 负向量＋消费测试 6 例＋双语协议本＋REGISTRY 两行＋三裁决
（未决项 4 关闭案 B＋载体独立面＋单方法同步 Query）；经集成第 161 批
收编（合并 2b491e3d）。第 158 批＝BOARD #45 两候派件处置。第 156 批
＝数据座第 155 批清点两观察点处置。第 155 批＝U19 交棒准入闸后端切片。
第 152 批＝proposal 029 起草批。第 150 批＝素材链修复批。更早段落见
本文件 git 历史与 BOARD 前录。
