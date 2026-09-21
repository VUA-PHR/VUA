---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 14806f85
updated: 2026-09-22
---
## 当前焦点
**第 162 批（2026-09-22 02:4x–03:1x，节拍轮工作时段 date 02:41 实测）＝
提案 029 B 面环 2 接线批（操作者第 162 批指派；领批前置已验＝本座环 1
冻结批 847de263 经集成合并 2b491e3d 入库 main，is-ancestor 核可后领
取）。轮首 fast-forward 追平 main 14806f85（落后 7/领先 0 归零，吸收
集成第 161 批双栈验收批）。接线产物四件＋文档两件（提交 00364604，
恰 12 文件 1339+/32-；零新码零新依赖；冻结词面零字节触碰——
application-contract/task-store/provider-process/production-use-case/
unity-bridge/recipe v0.3/recipe-export v0.1 Schema 全未触；VUA-7/
VUA-8 全程零触碰）**：

- **port face（核心域冻结跨域合同）**：orchestrator 新模块
  recipe_export.rs——`ProjectDraftExportPort` trait 同步只读签名
  `export_project_draft(project_path)` 直接返回草稿文档（裁决 3：本
  地只读扫描零 Bridge 零网络零突变，不设九态任务，preview 先例）；
  新默认访问器 `export_capabilities`（默认 declared-none＝
  `ProjectDraftExportCapabilities::NONE`——025 catalog_capabilities/
  F5 template_capabilities 访问器律，ORC-DEV-004 无实现不预留，环 3
  实现切片覆写翻转）；`export_project_draft` 默认体答本族缺席码
  `vua.recipe_export.unavailable`（F5 结构律：已声明未实现端口在类
  型层可存在，路由门先行）；typed 草稿文档
  `ProjectDraftDocumentV01` 恰六事实键
  draftId/exportedAt/origin/environment/dependencies/missing，
  deny_unknown_fields 使 Recipe 面（recipeId/title/assets/instances/
  relations/wardrobeGroups/locked）类型级不可表示（裁决 2：草稿自
  成一类）；lockedVersion None 时跳过序列化＝缺席非 null 的诚实无
  钉形；错误码零新立（三码闭集：unavailable/invalid_params＋复用
  project_not_found）。
- **路由臂**（provider-host，packages.packageCatalog 同构五段序）：
  recipe.* 分支内**先于文档面折叠分流**（本面自有族缺席码，绝不冒
  充 vua.recipe.unavailable）→①端口接线缺席答诚实缺席→②params
  闭集单键 {projectPath 非空} 形状判定先于门→③注册判定骑
  project.inspectProject 同一 013 聚合（同事实同码
  vua.project.project_not_found，024 复用判例；聚合外路径绝不抵达
  端口；project-ops 装配缺席＝校准面不存在＝全面诚实缺席）→④能力
  门读 declared-none 默认访问器先于端口调用→⑤端口 typed 拒绝
  verbatim 直传（读面零折叠），OK 投影＝六事实键经 serde＋路由盖族
  常量（P1 纪律：常量路由盖章、端口事实 verbatim；packageId 升序与
  missing 闭集系生产者契约由 wire 测试钉死）；诚实空依赖＋constraint
  null 携 environmentUnityVersion 标记以成功事实过线（观察失败不设
  码，诚实律 1/2）。
- **served 能力行** `recipe.exportProjectDraft`（一行一方法先例族）：
  availability＝use-case 装配＋端口 `export_project_draft` 位——默
  认 declared-none 使行如实 unavailable 直至环 3 覆写翻转。
- **信封双常量**（A3/A4/A5/F2/F3/F5 先例，自
  vua_provider_host::provider_host 发布）：
  `RECIPE_EXPORT_ENVELOPE_SCHEMA_VERSION_V01`="0.1"＋族常量
  `RECIPE_EXPORT_SCHEMA_VERSION_V01`="vua.recipe-export/v0.1"（两版
  本独立，c914cf2 常设规则）。
- **接线槽位**：draft_exporter 骑既有 use_cases 入口（handoff
  Option 端口字段先例，run_provider_host_full 签名零变化）；8 处全
  字面 ProductionUseCaseConfig 构造点机械补 `draft_exporter: None`
  （bin 壳＋inspection_queries＋overlay_wire＋release_handoff_wire＋
  warehouse_commands×4），struct-update 四处自动继承。
- **wire 测试**：recipe_export_wire_v01.rs 9 例骑真实帧循环（缺席装
  配诚实缺席＋行 unavailable／冻结词面应答真 Schema 实校验＋七键闭
  集按集合钉＋packageId 升序＋lockedVersion 缺席非 null＋九恒在维／
  trait 默认 declared-none 先于端口〔假端口体若达即 panic〕／聚合外
  路径复用 not_found 先于端口／校准面缺席诚实缺席／端口拒绝
  verbatim／诚实空依赖＋版本不可读成功事实携 iff 标记由真校验器强
  制／params 违反先于门／双常量对冻结 Schema 钉死）。消费测试
  recipe_export.rs 6 例未触照绿。
- **文档**：双语协议本 0.1→0.1.1（状态落 FROZEN AND WIRED；能力行
  与 wire 路由节实named 落地；开放项一划线已落、执行器项注明覆写
  翻转；词面零变化）＋REGISTRY 协议本行同步 0.1.1（词干保持已冻结
  按登记校验器词干律，接线事实入括注）。
- **证据**：cargo test --workspace 104 套件 911/0（基线 902/0 恰加
  本批 9 钉，零涟漪）＋cargo clippy --workspace --all-targets 0 警
  告。
- **环 3 派发如实记录**：操作者注记原文「实现批（后端真实导出逻辑：
  读 vpm-manifest＋工程身份＋组装 draft 文档）候环境座环 3」；协议
  本开放项与所有权边界节记「导出执行器实现（核心域，读 013 检查聚
  合；029 B 面环 3）」。两处座位词面不一致，本批不改写任何一处、不
  猜测裁决——环 3 派发座位以操作者届时指派为准（本批仅接线＋fake
  端口测试，符合指派原文「你本批只做接线＋fake 端口测试，实现落点
  在 state 批写明候派」）。
- **诚实边界**：零端到端宣称——路由已存在于 wire 面但未消费（桌面
  消费环 4 候形状核可，零 TS 面）；本批全绿数字系代码面/fake 端口
  证据，绝不宣称真机；served 行在环 3 覆写翻转前如实 unavailable；
  真机全链（真实工程导出→确认→组装→车间状态）归 W25（O-2）。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 160 批（847de263＋19d4ba5a，2026-09-22）＝029 B 面环 1 冻结批：
recipe-export v0.1 词表行（command＋result 两 Schema＋5 正 8 负向
量）＋核心消费测试 recipe_export.rs 6 例＋双语协议本＋REGISTRY 两行
＋029 内联线程核心裁决节；三裁决＝未决项 4 关闭案 B（零桥接骨架＋
用户点选补全，案 A 只登记不实施）＋载体＝导出独立面（草稿无
recipeId/title/关系面，转正唯一通道 recipe.save）＋用例面＝单方法
recipe.exportProjectDraft 同步只读 Query 不设九态任务；经集成第 161
批收编（合并 2b491e3d）。第 158 批（caddb291＋0193aced）＝BOARD #45
两候派件处置（loadedAssetPaths 证据面收口＋`.vua/imports` 残留清理
三触发）。第 156 批（0a7ebbd7＋029a78ad）＝数据座第 155 批清点两观
察点处置（recipe 存储钟改单源 rfc3339＋失败运行无
production_domain_records 行系设计非缺口裁决）。第 155 批（36bab970
＋95cb58ba）＝U19 交棒准入闸后端切片（经集成第 155 批收编）。
第 152 批＝proposal 029 起草批。第 150 批＝素材链修复批。更早段落
见本文件 git 历史与 BOARD 前录。
