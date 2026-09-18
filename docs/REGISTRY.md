# VUA 受管文档登记表（REGISTRY）

> 文档版本：事件驱动
> 状态：已接受

机器可读登记表；路径指 ZH 版，EN 镜像随行不单独登记。更新规范见
[docs/meta/documentation-governance_ZH.md](meta/documentation-governance_ZH.md) §3
（事件驱动：Minor/Major 版本变化、状态变化、新增受管文档、M 门复核刷新；Patch 不动本表）。

| 路径 | 文档版本 | 状态 | 维护方 | 最近复核 |
| --- | --- | --- | --- | --- |
| AGENTS.md | 1.1.0 | 已接受 | 集成 | 2026-09-06 |
| docs/product-boundary_ZH.md | 1.3.0 | 已接受 | 集成 | 2026-09-09 |
| docs/compatibility/unity-editor_ZH.md | 1.0.0 | 已接受 | 集成 | 2026-09-06 |
| docs/compatibility/alcom-vcc_ZH.md | 1.2.0 | 已接受 | 环境 | 2026-09-12 |
| schemas/project-inspection/v0.1 | 0.1 | 已取代（→ v0.2） | 环境 | 2026-09-09 |
| docs/protocols/project-inspection-v0.2_ZH.md | 0.2 | 已冻结 | 环境 | 2026-09-09 |
| docs/protocols/project-ops-v0.1_ZH.md | 0.1 | 已取代（→ v0.2） | 环境 | 2026-09-09 |
| schemas/project-ops/v0.1 | 0.1 | 已取代（→ v0.2） | 环境 | 2026-09-12 |
| schemas/project-ops/v0.2 | 0.2 | 已冻结（v0.1 增量族升版：新增 `project.setNote` 备注写命令＋守卫闭集三项扩充；D-6 桌面确认裁定 A 后核心升版批冻结 2026-09-12；import-copy 形状零变更） | 核心 | 2026-09-12 |
| docs/protocols/project-ops-v0.2_ZH.md | 0.2 | 已冻结 | 核心 | 2026-09-12 |
| schemas/recipe/v0.3 | 0.3 | 已冻结（M5 产物链四件：recipe/local-resolution/approved-plan/build-record；W20＋W22，集成验收 0400bee/c486318 复跑 367/370/0） | 核心 | 2026-09-10 |
| schemas/eac-probe/v0.1 | 0.1 | 已冻结（006 R1a，集成验收复跑 437/0） | 环境 | 2026-09-10 |
| schemas/eac-allowlist/v0.1 | 0.1 | 已冻结（006 R2/R3，集成验收复跑 442-443/0） | 环境 | 2026-09-10 |
| schemas/eac-terminate/v0.1 | 0.1 | 已冻结（006 R1b 全链收官，集成验收复跑 447/0） | 环境 | 2026-09-10 |
| schemas/amf-production/v0.2 | 0.2 | 已冻结（M3 验收，2026-09-07；v0.1 历史保留） | 核心 | 2026-09-10 |
| schemas/environment-managers/v0.1 | 0.1 | 已冻结 | 环境 | 2026-09-10 |
| docs/architecture/system_ZH.md | 1.0.1 | 已接受 | 桌面 | 2026-09-07 |
| docs/architecture/orchestrator_ZH.md | 1.0.0 | 已接受 | 桌面 | 2026-09-06 |
| docs/architecture/desktop_ZH.md | 1.2.0 | 已接受 | 桌面 | 2026-09-12 |
| docs/architecture/bdl_ZH.md | 1.1.0 | 已接受 | 数据 | 2026-09-08 |
| docs/architecture/amf-unity_ZH.md | 1.1.0 | 已接受（1.1.0，2026-09-16：新增「交接进程面（Release Handoff）」节——023 产线实现域切片〔桥握手信号 EditorHandshake＋Rust 进程/窗口面 port handoff 模块＋schemas/unity-bridge/handshake/v1.0/〕；Bridge 命令面零变化） | 产线 | 2026-09-16 |
| docs/architecture/integrations-and-overlays_ZH.md | 1.0.0 | 已接受 | 桌面 | 2026-09-06 |
| docs/decisions/orchestrator-supervised-provider_ZH.md | ADR | 已接受 | 集成 | 2026-09-06 |
| docs/decisions/vua-instance-identity_ZH.md | ADR | 已接受 | 集成 | 2026-09-06 |
| docs/decisions/warehouse-layout_ZH.md | ADR | 已接受 | 集成 | 2026-09-06 |
| docs/decisions/path-configuration_ZH.md | ADR | 已接受 | 集成 | 2026-09-12 |
| docs/protocols/application-contract-v0.1_ZH.md | 0.1 | 已冻结 | 核心 | 2026-09-06 |
| schemas/application-contract/v0.1 | 0.1 | 已冻结（任务快照形状机器面＋六向量：BOARD #22 result 回流增量——可选 `result` 字段携带 Done payload 原样、两通道同源同值、失败/取消/非终态恒缺席；提案 020，向后兼容增量，协议本同日修订记录。＋overlay 快照机器面＋六向量：`overlay.getSnapshot` 任务卡＋生产状态卡轮询读面——纯函数投影、零会话身份、诚实缺席语义；提案 017 批 1，向后兼容增量，协议本同日修订记录。＋overlay 批 2 八向量：快照面新增可选 `downloadCard`——`dl-` 非终态尝试字段裁剪投影、无发明进度负例钉死、完成交付保留导入页权威消费面；提案 017 批 2，向后兼容增量，协议本同日修订记录） | 核心 | 2026-09-15 |
| docs/protocols/bdl-queries-v0.1_ZH.md | 0.1 | 已取代（→ v0.3） | 数据 | 2026-09-06 |
| docs/protocols/bdl-queries-v0.2_ZH.md | 0.2 | 已取代（→ v0.3） | 数据 | 2026-09-06 |
| docs/protocols/bdl-queries-v0.3_ZH.md | 0.3 | 已取代（→ v0.4） | 数据 | 2026-09-06 |
| docs/protocols/bdl-queries-v0.4_ZH.md | 0.4 | 已冻结（downloads.listCompleted 采纳源读面，2026-09-10：Schema＋向量＋消费测试）；wire 已落（2026-09-10 核心 389912e：路由臂＋信封版本常量 0.3→0.4＋消费测试；TS 面在位。2026-09-15 注记刷新，wt-5 c749d22 登记请求，集成独立核实） | 数据 | 2026-09-15 |
| docs/protocols/bdl-commands-v0.1_ZH.md | 0.1 | 已取代（→ v0.2） | 数据 | 2026-09-07 |
| docs/protocols/bdl-commands-v0.2_ZH.md | 0.2 | 已取代（→ v0.3） | 数据 | 2026-09-08 |
| docs/protocols/bdl-commands-v0.3_ZH.md | 0.3 | 已取代（→ v0.4） | 数据 | 2026-09-08 |
| docs/protocols/bdl-commands-v0.4_ZH.md | 0.4 | 已冻结（IMP-3 契约先行，2026-09-09：Schema＋正负例向量＋消费测试） | 数据 | 2026-09-09 |
| docs/protocols/production-evidence-v0.1_ZH.md | 0.1 | 已冻结 | 数据 | 2026-09-08 |
| docs/protocols/inspection-evidence-v0.1_ZH.md | 0.1 | 已冻结（M7，2026-09-13：proposal 016 §7 硬前置①②③经集成验收收口〔7d63abe／7a262b8〕，④协议本双语＋⑤本行随冻结批办理；向量 7＋校验测试＋核心存储/读路由/任务化驱动） | 产线 | 2026-09-13 |
| docs/protocols/download-events-v0.1_ZH.md | 0.1 | 已冻结 | 数据 | 2026-09-06 |
| docs/protocols/material-intake-v0.1_ZH.md | 0.1 | B3 实现基线 | 产线 | 2026-09-06 |
| docs/protocols/production-use-case-v0.1_ZH.md | 0.1 | 已冻结（M3 验收） | 核心 | 2026-09-07 |
| docs/protocols/production-use-case-v0.2_ZH.md | 0.2 | 已冻结（W20，2026-09-09：Schema＋向量 24＋消费测试全链） | 核心 | 2026-09-09 |
| docs/protocols/provider-process-v0.1_ZH.md | 0.2 | B2 实现基线（握手帧面 Schema 已冻结） | 核心 | 2026-09-07 |
| docs/protocols/task-store-v0.1_ZH.md | 0.1 | 已冻结 | 核心 | 2026-09-06 |
| docs/protocols/unity-bridge-v1_ZH.md | v1 | 已接受 | 产线 | 2026-09-06 |
| docs/protocols/unity-bridge-v2_ZH.md | v2 | 已冻结 | 产线 | 2026-09-08 |
| docs/protocols/unity-bridge-v3_ZH.md | v3 | 已冻结（M7，2026-09-13：proposal 016 三树表态收口〔核心 0:0x／数据 0:2x／桌面 1:4x，零修订意见〕；v2 同面超集＋三只读检查操作＋instanceGlobalObjectId 合法化；落库面随 7d63abe 先行，本批为契约面冻结；生产作业面迁移归后续切片，v2 生产路径继续生效） | 产线 | 2026-09-13 |
| schemas/unity-bridge/handshake/v1.0 | 1.0 | 已冻结（编辑器握手文件面，2026-09-16：proposal 023 产线实现域切片①——桥包工程加载完成时写 `.vua/bridge/handshake.json`〔闭集四键 schemaVersion/pid/editorVersion/occurredAt，additionalProperties false＝无上传状态无工程明文路径，诚实纪律形状钉死〕；「Bridge handshake 到达」完成判定信号的承载落地，命令面 v3 零增操作；Schema＋正例 1＋负例 3＋双端消费测试〔Rust handoff jsonschema 向量校验＋C# EditorHandshakeTests 真机 EditMode 32/32〕；023 内联「落地（产线切片①）」节在案） | 产线 | 2026-09-16 |
| schemas/inspection-queries/v0.1 | 0.1 | 已冻结（检查读面词表行 get/list/requestRun 三方法一次冻结，2026-09-13：Schema＋正例 3 对＋负例 3＋双载体消费测试；016 §7 硬前置①②③已验收入库〔7d63abe＋7a262b8＋修订批 c914cf2 族常量统一，数据追认〕；get/list 桌面消费已落地入 main〔33988a6〕，requestRun 悬空面维持——avatarGlobalObjectId 无桌面事实源，登记而不消费；真实数据走查归 W25） | 数据 | 2026-09-13 |
| docs/protocols/inspection-queries-v0.1_ZH.md | 0.1 | 已冻结（检查读面词表行，2026-09-13：三方法一次冻结，硬前置④⑤随冻结批） | 数据 | 2026-09-13 |
| schemas/editor-verify/v0.1 | 0.1 | 已冻结（U10 手选编辑器路径验证词表行 environment.verifyEditor，2026-09-13：proposal 021 七点裁决定形；Schema＋正例 3 对＋负例 3＋双载体消费测试〔环境域锚 editor_verify_wire 8/8＋provider-host 帧环 8/8〕；核心路由批 deafe11＋373470c 经 a6585c2 验收入 main；桌面 TS 面与设置面候 U10 切片随批，真机走查归 W25） | 环境 | 2026-09-13 |
| docs/protocols/editor-verify-v0.1_ZH.md | 0.1 | 已冻结（手选编辑器路径验证词表行，2026-09-13：单方法一次冻结，硬前置⑤协议本双语＋本行＋SCHEMA_EXEMPT 豁免行移除请求随本冻结批，豁免行候集成验收移除） | 环境 | 2026-09-13 |
| schemas/release-handoff/v0.1 | 0.1 | 已冻结（官方 SDK 上传交接词表行 release.openForHandoff，2026-09-16：proposal 023 核心冻结批——硬前置①两半已齐〔桌面表态 469ef5c 经第 52 波入库＋产线表态五点 wt-4 随其批次入库〕②③随本批〔Schema＋3 正 3 负向量＋provider-host 帧环 5/5＋@vua/contracts 守卫＋mock 缺席分支〕④随本批〔协议本双语〕⑤轮空〔产线钉死实现域＝进程/窗口面，unity-bridge v3 零增操作〕；params 闭集修订为单键 buildId〔工程身份权威在 build-record 面〕；路由未接线＝诚实缺席，实现域〔产线 port＋核心 use case〕与桌面消费候后续切片，端到端候 W25） | 核心 | 2026-09-16 |
| docs/protocols/release-handoff-v0.1_ZH.md | 0.1 | 已冻结（官方 SDK 上传交接词表行，2026-09-16：单方法一次冻结，硬前置④双语协议本＋应用契约方法面行＋修订记录条目随本冻结批） | 核心 | 2026-09-16 |
| schemas/packages-query/v0.1 | 0.1 | 已冻结（包管理 P1 只读词表行 packages.listInstalled，2026-09-17：proposal 024 P1 核心冻结批——三域表态收敛〔桌面 ab02215 分期读法/降级投影/错误码复用＋环境 62b4989 P2 可行/注册库非同一存储/清单复用 013 聚合＋集成第 70 批门序 T-A 授权/死锚不补建〕；Schema＋3 正 3 负向量＋核心域消费测试 4 例 packages_query_consumer＋@vua/contracts 守卫＋TS 面；核心裁决＝projectPath 未注册复用 vua.project.project_not_found 同事实同码＋P1 词面零 P2 事实字段〔含 displayName 不预留无生产者字段〕＋诚实空清单；vcc.liteDb-only 不可见风险如实登记候 W25；wire 路由＋能力行＋bin 装配候实现切片紧随，桌面消费批候其后） | 核心 | 2026-09-17 |
| docs/protocols/packages-query-v0.1_ZH.md | 0.1 | 已冻结（包管理 P1 只读词表行，2026-09-17：单方法一次冻结，双语协议本＋REGISTRY 登记随本冻结批） | 核心 | 2026-09-17 |
| schemas/packages-repos/v0.1 | 0.1 | 已冻结（包管理 P2 只读词表行 packages.listRepos，2026-09-17：proposal 025 P2 核心冻结批——表态程序收敛〔环境提案 64bfe58 库面实测锚＋集成 7a50ce9 门序同径与 R5 票＋桌面 0031004 呈现语义与 R5 交叉表态＋核心裁决 bf78368 八项〕；订阅面为世界＋逐仓库缓存命中事实 cached 必带＋健康面非目标〔发明 health 字段在 schema 即非法〕＋空订阅清单诚实；Schema＋3 正 3 负向量＋核心消费测试 packages_p2_consumer＋@vua/contracts 守卫＋TS 面；写面〔启停/增删/主动刷新〕照收敛裁决归 013 R5 逐面独立提案不在本族；环境实现切片候随批） | 核心 | 2026-09-17 |
| schemas/packages-catalog/v0.1 | 0.1 | 已冻结（包管理 P2 只读词表行 packages.packageCatalog，2026-09-17：proposal 025 P2 核心冻结批同上收敛面；按需查询粒度〔无全量投影无分页〕＋双键闭集 projectPath〔013 身份，compatible 判定上下文〕＋packageId＋updateAvailable 冻结判定结论〔null＝判定未执行，缺席不是无更新〕＋source 二态与 installed 分立〔桌面三态＝组合，词面不合并〕＋displayName 可空〔null 以 packageId 兼任，P1 裁决 3〕＋versions 升序含 yanked 缓存携带事实与 compatible 可空〔null 不是不兼容〕＋词表外包答复用 vua.vpm.no_matching_package 呈现独立空态；Schema＋4 正 4 负向量＋核心消费测试＋TS 面；能力声明＝独立默认访问器 catalog_capabilities 零波及〔ORC-DEV-004〕；stale 披露随环境实现切片落死） | 核心 | 2026-09-17 |
| docs/protocols/packages-repos-catalog-v0.1_ZH.md | 0.1 | 已冻结（包管理 P2 只读词表行，2026-09-17：双方法一次冻结，双语协议本＋REGISTRY 登记随本冻结批） | 核心 | 2026-09-17 |
| schemas/packages-catalog/v0.2 | 0.2 | 已冻结（packages.packageCatalog 结果族 v0.2 增量——cacheSourced 披露，2026-09-17：proposal 025 内联裁决——收敛面＝环境形状提案 A〔实现切片声明节〕＋桌面表态第 5 条披露枝〔0031004〕＋核心方向裁决 6〔bf78368〕三域同向；v0.2＝冻结 v0.1 result 恰加必带 cacheSourced 布尔〔true＝缓存降级路径，false＝在线刷新；信息性非失败；v0.1 应答无此字段消费端不虚构标注〕；command 面与 v0.1 逐字节同形；repos 族 v0.1 刻意不加字段〔零网络面恒常量非事实〕；纯增量双版本协商＝端口默认项 catalog_v02/package_catalog_v02〔ORC-DEV-004 零编译波及〕＋路由双臂按声明盖族戳〔冻结 v0.1 绝不原地修订；v0.1 形状对 v0.2 Schema 非法＝版本机器可检测〕；Schema＋4 正 5 负向量＋核心消费测试〔含版本可检测性钉死〕＋TS 面 PackagesPackageCatalogResultV02；compatible 语义随批澄清＝库完整 unity_compatible 全语义〔025 内联核心表态口径 2〕，实现面环境增补批照改；桌面消费更新批候随其后） | 核心 | 2026-09-17 |
| docs/protocols/packages-catalog-v0.2_ZH.md | 0.2 | 已冻结（packages.packageCatalog 结果族 v0.2 增量，2026-09-17：恰一键披露增量一次冻结，双语协议本＋REGISTRY 登记随本冻结批） | 核心 | 2026-09-17 |
| schemas/packages-ops/v0.1 | 0.1 | 已冻结（包管理 P3 写面首冻结切片 A1＝移除，2026-09-19：proposal 026 A1 核心冻结批——三域表态收敛〔核心裁决 82a39c4 五点：面序 A1 先行立程序样板／wire 同族 packages.*＋preview/apply 二段动词＋独立 packages-ops 词表行／apply 九态任务＋preview 同步 query〔014 import-copy 同构〕／错误码族 vua.packages.* 首面闭集一次立全／create_project 不入 P3 留 A5＋环境库面考证 4a0f02f 实现零缺口＋桌面表态 93752d5〕；双方法 previewRemove〔同步只读 query，无 digest 位〕＋applyRemove〔九态任务化，必携 confirmedDigest，服务端复算漂移即拒 ORC-WF-003/004〕；审计收据 receipt＝确认指纹回显＋请求清单＋实际移除行〔014 导入收据先例〕；新立三码 preview_drift/package_not_found/execution_failed〔guard 值＝code 后缀〕＋复用零新立三码申报；恢复＝复检 inspect_required 绝不隐式续传；Schema＋4 正 8 负向量＋核心消费测试 packages_ops_consumer〔含漂移 recoverable 词面钉死〕＋@vua/contracts 守卫＋mock 恒缺席臂＋双语协议本；wire 路由＋能力行候核心接线切片，环境实现核对切片随其后，桌面逐面升级消费候其后，零端到端宣称） | 核心 | 2026-09-19 |
| docs/protocols/packages-ops-v0.1_ZH.md | 0.1.1 | 已冻结（包管理 P3 写面 A1 移除词表行，2026-09-19：双方法一次冻结，双语协议本＋REGISTRY 登记随本冻结批；同日 v0.1.1 接线批：wire 路由两臂＋served 能力行 packages.removeOps〔门控 remove_packages〕＋端口错误投影落地——词面零变更，路由测试 packages_ops_wire 10 例，诚实边界节如实更新） | 核心 | 2026-09-19 |
| schemas/packages-ops/v0.2 | 0.2 | 已冻结（包管理 P3 写面第二冻结切片 A2＝安装/升级，2026-09-19：proposal 026 面序 A1→A2，核心裁决 82a39c4 第 1 点预记照办——升级＝安装同族，版本选择语义随本批落死；v0.2 独立行目录照 packages-catalog v0.2 增量先例，v0.1 A1 移除行维持冻结照常服务零触碰；双方法 packages.previewInstall〔同步只读 query，依赖解析可达仓库，在线刷新失败降级缓存 ORC-ADP-006 同构；词面零披露字段——端口无载体，披露候选 025 cacheSourced 增量先例〕＋packages.applyInstall〔九态任务化，必携 confirmedDigest，服务端复算漂移即拒 ORC-WF-003/004，后端第二道比对 Fix R2-7 留纵深防御；apply 段仓库加载不降级如实失败〕；版本选择语义＝请求行 {packageId, version 必填可空}：null＝解析器最新稳定版、string＝钉死精确版本〔升级/降级同语法，不立 upgrade 动词——端口 ChangeKindV1 闭集 install|remove，v0.1 changeItem 已全闭集〕、同 packageId 重复＝词面违例；plan 可含 install 与 remove 行〔冲突触发移除是端口事实 ORC-WF-002〕；审计收据 installReceipt 变体＝confirmedDigest＋requestedPackages 携版本语义 verbatim＋appliedItems＝端口 {applied: items} verbatim，与 removeReceipt 键集互斥；guard 三值闭集维持零新增——信封错误面恰一新码 vua.packages.preview_failed，任务内非 drift 非 not_found 统一折 execution_failed 携原码；端口映射申报 preview_failed→preview_failed／apply_failed→execution_failed／no_matching_package→package_not_found／preview_drift→preview_drift／能力缺席→capability_missing；served 行 packages.installOps 门控 preview_install 位申报随接线切片；Schema＋4 正 8 负向量＋核心消费测试 packages_ops_consumer_v02 4 例＋@vua/contracts 窄化＋mock 恒缺席臂＋双语协议本；wire 路由候核心接线切片，环境实现核对切片随其后，桌面逐面升级消费候其后，零端到端宣称） | 核心 | 2026-09-19 |
| docs/protocols/packages-ops-v0.2_ZH.md | 0.2.1 | 已冻结（包管理 P3 写面 A2 安装/升级词表行，2026-09-19：双方法一次冻结，双语协议本＋REGISTRY 登记随本冻结批；同日 v0.2.1 接线批：wire 路由两臂＋served 能力行 packages.installOps〔门控 preview_install〕＋端口错误投影落地——词面零变更，路由测试 packages_ops_wire_v02 11 例，诚实边界节如实更新） | 核心 | 2026-09-19 |
| docs/release/versioning_ZH.md | 1.0.0 | 已接受 | 集成 | 2026-09-06 |
| docs/design/design-standard_ZH.md | 0.7.3 | 已接受 | 桌面 | 2026-09-18 |
| docs/development-outline_ZH.md | 2.0.2 | 已接受 | 集成 | 2026-09-07 |
| docs/meta/documentation-governance_ZH.md | 1.0.0 | 已接受 | 集成 | 2026-09-06 |
| CONTRIBUTING_ZH.md | 1.0.0 | 已接受 | 集成 | 2026-09-06 |
| docs/REGISTRY.md | 事件驱动 | 已接受 | 集成 | 2026-09-06 |

## 排除规则

以下路径不纳入受管文档，不登记、不要求头部版本行：

- `docs/tool-catalog/**`：社区维护条目（双语单文件，体系外例外）；
- `docs/research/**`：研究材料，不成为实现权威；
- `docs/reference/**`：参考材料（继续 gitignore）；
- `docs/migration/**`：迁移输入材料（继续 gitignore）；
- `docs/plans/**`：本地草稿区（继续 gitignore）；协调结论须落进 collab/ 才算数。

无语言后缀的同目录文件（如 `docs/architecture/system.md`、`docs/design/design-standard.md`）
是双语导航页，非规范文档，不登记。
