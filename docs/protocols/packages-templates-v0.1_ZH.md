# packages-templates 协议本 v0.1（packages.listTemplates 读面：模板条目清单）

> 文档版本：0.1.1
> 状态：**已冻结（提案 027 F5 核心冻结批，2026-09-20）且已接线（v0.1.1 核心接
> 线批，2026-09-20）：`packages.listTemplates` 路由、信封双常量与 served 行
> `packages.templatesOps` 已落树——库面实现归环境实现核对切片；桌面消费候形
> 状核可后照面序程序办理；在其落地前一切已接线 backend 均停在诚实缺席臂
> （trait 默认 `template_capabilities -> NONE`，served 行如实 unavailable）。**
> （冻结出处：提案 027 F5 冻结批——U14 裁决 (3) 立案权威、027 核心表态 5 三
> 域收敛、面序 F2→F3→F5 第 121–130 批登记。）
> 权威对：本文件与 `packages-templates-v0.1_EN.md`（单一语义，双语镜像）。
> 词面权威：`schemas/packages-templates/v0.1/`（command＋result Schema 与正负例
> 向量）。本文负责解释；Schema 具约束力。
> 核心消费测试：`crates/provider-host/tests/packages_templates_consumer_v01.rs`；
> wire 路由测试 `crates/provider-host/tests/packages_templates_wire_v01.rs`
> 〔真实帧循环〕。
> 更新：2026-09-20（v0.1.1 接线批：`packages.listTemplates` 路由臂＋信封双常
> 量 `PACKAGES_TEMPLATES_ENVELOPE_SCHEMA_VERSION_V01`/`PACKAGES_TEMPLATES_
> SCHEMA_VERSION_V01`＋served 行 `packages.templatesOps`＋wire 测试 7 例骑真
> 实帧循环；词面零变化）

## 本面是什么

`packages.listTemplates` 回答一个问题：**项目创建可用的模板有哪些？** 每模板一行
（机读标识＋显示投影）；单方法，零参数，零分页，零过滤。

立案权威与族划分：

- U14 裁决 (3)「同意模板枚举 wire 面」＋027 核心表态 5（三域收敛：环境考证支持
  零出入、桌面 IA 表态以 F5 冻结词面为准）＝本族立案依据。新读面族
  `packages-templates`（schema 行目录 `schemas/packages-templates/v0.1/`），wire
  前缀维持 `packages.*` 不另立 `templates.*`（026 表态 2 同律：另立前缀将分裂能力
  发现）；族名/前缀/码族三面一致（packages-templates 族 / `packages.*` 前缀 /
  `vua.packages.*` 码族）照既有族同构。
- 读写分线（014 仲裁第 1 点先例）：`createProject` 在写面族 packages-ops（026
  A5）；模板枚举是纯读面，不并入 ops（族内全任务化写形状无纯读先例）。创建能力
  声明仍是 `capabilities().create_project`（026 A5 五位闭集成员）；本族能力声明
  独立（见能力门控节）。

## 枚举形态裁决（随本冻结批落账——操作者注申报项）

环境考证（027 提案 §4）已实证：**vrc-get-vpm 0.0.16 无模板枚举/清单 API**（全库
grep 唯一命中是 resolve.rs 注释；lib.rs 公开导出面无模板类型）。当时在桌面的两条
路径：

1. **目录扫描枚举**（本冻结批裁决）：枚举＝两已钉目录根下的目录条目扫描——
   `<environment_root>/VRCTemplates` 先、`<environment_root>/Templates` 后，与
   `create_from_template` 的解析序同根同序（026 A5 实现核对切片直读锚点：
   project-manager `create_from_template`，显式路径 → VRCTemplates → Templates）。
2. 列非目标（本面不冻结，留待库面上游出现枚举 API）。

**裁决路径 1，理由五点**：①立案权威在案——U14 裁决 (3) 与 027 核心表态 5 的三域
收敛不因库面无 API 失效；②事实源已钉死——两目录根是 `create_from_template` 既有
冻结实现事实，VUA 自实现模板创建已落地，枚举面与创建面同根即同事实源；③词面对称
——「能创建不能枚举」让 026 A5 消费面「不发明枚举」留白空转，桌面新建项目模板下
拉（026 A5 表态的正式填面）需要枚举面；④零发明纪律可守——目录名即 id（事实），
无元信息生产者即无元信息字段（见字段上限裁决），目录不存在即诚实空态（非错误，
R4 先例）；⑤路径 2 违背三域已收敛面序（F3→F5→F4，集成第 121/130 批登记）且保留
留白空转，构成对已收敛裁决的降标。

**边界三则（随裁决钉死）**：其一，create 三候选解析的**显式路径腿**是逐次 create
调用参数形态（`template` 参数可为路径），非目录根事实，不入枚举世界——枚举世界＝
库路径默认解析腿两目录根。其二，**同名去重**：同一目录名在两根下都存在时枚举恰一
次，落在创建解析序会选的根（VRCTemplates 优先）——枚举绝不偏离 create 实际复制之
物（枚举出的每个 id 传给 `createProject` 必然命中枚举所见模板）；不去重将出现「枚
举两个同名 id、create 只解析其一」的词面漂移。其三，**零网络面**：目录扫描无缓存
降级语义，本面**无 `cacheSourced` 字段**——恒常量信息字段不是事实（packages-repos
v0.1 同律先例）。

## 词表（机器可读）

- 方法：`packages.listTemplates`（kind `query`）。
- 信封：`schemaVersion` 常量 `"0.1"`；结果族常量 `vua.packages-templates/v0.1`
  （两版本独立——c914cf2 既有规则）。
- **wire 常量（v0.1.1 接线批命名，A3/A4/A5/F2/F3 先例——提前闭合桌面核对点）**：
  信封常量 `PACKAGES_TEMPLATES_ENVELOPE_SCHEMA_VERSION_V01 = "0.1"` 与结果族常
  量 `PACKAGES_TEMPLATES_SCHEMA_VERSION_V01 = "vua.packages-templates/v0.1"`
  自 `vua_provider_host::provider_host` 发布——消费端钉核心域常量，绝不私有
  字面量；路由在信封组装时把两常量盖在应答上（信封 `schemaVersion` ＋
  result 文档 `schemaVersion`），绝不后端、绝不字面量。词表字节零变化——
  常量锁定的正是本冻结 Schema 的同一字符串（c914cf2 规矩：每行自带版本常
  量，信封版本独立于族版本）。
- params：**空闭集**（`packages.listRepos` 零参数先例）——模板面是环境级配置事
  实，非 per-project；任何键是 `vua.packages.invalid_params` 形状违反，绝不默认。
- result（族 `vua.packages-templates/v0.1`）：
  - `templates[]`——**id 升序**（冻结呈现事实；裸目录扫描序跨平台不稳定，呈现事
    实保桌面下拉确定性消费——F3 packageId 升序先例）。每行：`id`、`name`。
- 空 `templates` 数组是合法的诚实应答：目录根缺失或两根皆空是事实，绝不是错误
  （R4 先例）。

## 字段语义（冻结裁决）

- `id`——模板目录名：传给 `packages.createProject` 的 `template` 参数的机器标识。
- `name`——`id` 的冻结**同值显示投影**：v0.1 无独立显示名事实源，投影逐字声明同
  一事实，使显示语义入词面、消费端绝不虚构更友好的标签。同值锁是生产者契约，由
  核心消费测试钉死（JSON Schema draft-07 无法跨键表达）；生产端实现绝不携带
  `name ≠ id` 的行。
- **刻意缺席 `description` 及一切元信息字段**——见下节裁决。
- **刻意缺席 `sourceRoot`**——哪根服务某 id 是 create 的冻结解析序（非逐行事实）；
  消费端无需根知识即可机读调用创建面。

## 字段上限裁决（随本冻结批落账）

环境考证（027 提案 §4 末节）已实证：模板元信息（显示名/描述）**库面零支撑**——模
板目录内 `package.json` 是否存在/形态如何未考证（VCC 模板规范文件不在本地；W25
真机顺带项只读核实）。当时在桌面的两条形态：

1. 行携带 `description: string | null`（required nullable，「元信息如实 null」
   字面形态）；
2. 元信息字段**整体缺席**（v0.1 行＝恰 `id`＋`name` 两键）。

**本冻结批裁决形态 2**（P1 displayName 判例＋F2 author 判例同律）：v0.1 无任何
description 生产者（模板元数据文件形态未考证），required-null 字段是恒 null 占据
wire 键——恒常量不是事实（F2 compatible 同律）；ORC-DEV-004 无实现不预留。行内携
带 `description`（或 `author`、`license`、`sourceRoot`、`version`、任何发明事实）
即 schema 非法——负例向量钉死，是虚假断言防线不是约定。W25 真机考证出模板元数据
事实后，元信息字段走 v0.2 行目录增量——绝不是对本冻结 v0.1 的原地修订。

`name` 同值投影保留的裁决理由（区别于 description 缺席）：目录名本身是事实，
`name` 键将该事实的显示面定形入词面——它使「显示名＝目录名」成为词面声明的冻结
事实而非消费端自行兼任逻辑（P1 裁决 3 的 packageId 兼任是消费端约定，本面在环境
考证 §4 预记「目录名＝模板 id 与名称同值」方向上把该语义定形进词面，未来真显示
名事实出现时 `name` 键位稳定升版、消费端词面零迁移）。

## 错误码（零新码——027 表态第 6 条 F5 方向维持）

- 模板目录不可达/两根缺失：**诚实空态**（空 `templates` 数组），非错误、非异常
  ——027 表态 6 预记方向照办落死（R4 先例）；零新错误码。
- 信封面（既有闭集不变）：能力缺席在调用前答通用 `vua.vpm.capability_missing`；
  参数形状违例答 `vua.packages.invalid_params`；未接线答
  `vua.packages.unavailable`；后端类型化拒绝逐字透传（code＋messageKey＋category）。
- 只读设计：项目创建是 packages-ops `createProject`（026 A5）写面，不属于本族；
  本面绝不提供创建/预览/写方法。

## 能力门控（已命名与路由，v0.1.1 接线批落地）

新默认访问器 `VpmBackend::template_capabilities() -> TemplateCapabilities`（单一
位 `list_templates`），025 访问器法则（ORC-DEV-004：默认 declared-none；后端恰在
实现 `list_templates` 时覆写）。环境 VrcGetLib 覆写随其实现核对切片如实置真（两
目录根扫描自实现，与 `create_from_template` 同根同序）；CLI 后端无目录根扫描面，
如实维持假。

接线事实（本批落地）：

- **served 行 `packages.templatesOps`**（A3/A4/A5/F2 先例单行单法——族名
  packages-templates 照 F2 repo-catalog 同构投影为 served 行名）：仅当已接线
  backend 的 `template_capabilities().list_templates` 为真时 available；默认
  declared-none 保持行如实 unavailable 直至环境覆写置真。
- **路由臂顺序（照 F2/F3 同构）**：params 空闭集形状验证**先于**能力门——任何
  键或非 object params 答 `vua.packages.invalid_params`（纯形状裁决，先于门）；
  门（`template_capabilities().list_templates`）**先于**端口调用——缺席答通用
  `vua.vpm.capability_missing`，绝不触达后端方法（端口方法有默认体，声明而未
  实现的 backend 在类型层存在——两层同答 capability_missing，路由门先行）；
  端口类型化拒绝逐字透传（code＋messageKey＋category，读面无折叠）；信封组装
  时路由盖双常量（信封＋族），后端事实逐字——id 升序与 name===id 同值投影是
  冻结词面的生产者契约（核心消费测试钉死），路由绝不改写。
- **wire 路由测试**：`packages_templates_wire_v01.rs` 7 例骑真实帧循环（冻结
  词面全钉＋缺席臂＋门先于端口＋逐字透传＋空枚举合法应答＋形状违例先于门＋
  双常量对冻结 Schema 常量的可检测性钉）。

## 后端指向根事实专节（027 检查点——必载）

027 验收检查点（026 U14 教训：schema 词面钉不住「后端指向哪个根」）要求凡涉文件
系统的面钉死其根。本面：

- **本面读什么。** 环境根下的两模板目录根：`<environment_root>/VRCTemplates`（先）
  与 `<environment_root>/Templates`（后）——`create_from_template` 库路径默认解
  析腿的同一对根（026 A5 实现核对切片直读锚点）。枚举＝两根下目录条目扫描（仅目
  录，文件不计）；扫描在 VRCTemplates 先全量、Templates 补差集（同名去重规则见
  枚举形态裁决节）。零网络、零写入。
- **生产接线面。** 环境根＝用户真实 VCC 设置目录（`%LOCALAPPDATA%\VRChatCreatorCompanion`
  ——VCC/ALCOM 共享家目录；024/026 U14 落账的 provider-host bin 接线事实）。F5 面
  对该共享根**只读**：绝不写两根、绝不移动/重命名/删除任何模板条目、绝不触碰项目。
  真机顺带观察在案（W25 只读取证记录 027 提案 §6(f)）：真实 `VRCTemplates/` 恰 5
  目录（Avatar／Avatar 2019／Base／World／World 2019，目录名读数），元数据文件形
  态未核（归 W25 顺带项）。
- **测试隔离面。** 全部测试（本批消费测试、环境实现核对切片、及未来任何 fixture）
  一律运行在经 `VrcGetLibBackend::with_environment_root(temp_dir, offline)` 注入的
  **临时环境根**上——纯合成数据，绝不指向用户真实 VCC/ALCOM 家目录。生产根在文
  档与示例中仅以占位字面量出现。
- **本节钉死的诚实边界。** Schema 钉 wire 形状，钉不住根。上述根事实即验收锚：
  环境实现核对切片与集成验收从接线代码重新推导该事实，并与本节逐项对账。

## 明确在本词面之外

- 项目创建：packages-ops `createProject`（026 A5）写面；本面零创建/预览/写方法。
- 模板元信息（description/author/license/版本等）：无 v0.1 生产者，schema 即非法
  （ORC-DEV-004：无实现，无预留字段）；W25 真机考证出事实后走 v0.2 行目录。
- `sourceRoot` 逐行根披露：无消费需求，create 解析序已是冻结事实；发明即非法。
- `cacheSourced`：零网络面无缓存降级语义，恒常量不是事实（packages-repos v0.1 同
  律）。
- 分页、排序偏好、过滤键、per-project 查询键：不在我 v0.1（模板面是环境级全局事
  实）。

## 诚实边界

核心接线切片**已完成（本 v0.1.1 批）**：`packages.listTemplates` 路由臂已落树、
骑命名信封双常量；wire 测试 7 例骑真实帧循环。路由已接线、**未被消费**——桌面
消费（新建项目模板下拉：枚举缺席或创建能力不可用回落现行手填＋留空＝后端默认
解析语义原样保持）候形状核可后逐面程序；库实现（两根目录扫描自实现＋能力覆写
置真）归环境实现核对切片，在其落地前一切已接线 backend 停在诚实缺席臂（served
行如实 unavailable）；全链真机走查归 W25 窗口（O-2，候用户开窗）。空态即终态：
空 templates 数组按设计的空态呈现，绝不以猜测内容填充；元信息不可得即无元信息
键，绝不虚构。
