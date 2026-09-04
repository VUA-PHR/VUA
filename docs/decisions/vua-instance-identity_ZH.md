# ADR:VUA 实例身份与多实例边界

[English](vua-instance-identity_EN.md) | [简体中文](vua-instance-identity_ZH.md)

> 状态:已接受
> 日期:2026-09-05(产品所有者裁决;取代 2026-09-04 的 Proposed 文本)
> 范围:桌面壳 bootstrap/路径解析、环境检测、安装器与更新器(M9/M10)、B 线执行器

## 背景

pre-alpha 的 VUA 没有安装器,便携副本与并行开发构建使多实例成为常态。缺乏管理时会发生
四类冲突:同一项目的并发操作、更新时目标 exe 正在运行、不同版本写同一本地数据目录、
自定义协议/文件关联被错误实例应答。

**修正后的前提(2026-09-05 裁决):**按 `ProjectIdentity` 租约做项目级突变围栏,只在
**同一个任务数据库内**成立——`project_mutation_leases` 与 fencing generation 位于各自
数据 Profile 的 SQLite 文件中,`stable.db` 与 `beta.db` 可以同时对项目 X 持有租约,而且
互相不可见。生态证据:VCC 以 stable/beta 双实例并存且数据目录分开(真机观察到
`VRChatCreatorCompanion` 与 `VRChatCreatorCompanion-Beta`)。

## 决定

1. **渠道:`stable` / `beta` / `dev`。**三者解决更新来源、数据命名空间与风险隔离——
   不是 SemVer 阶段名(`0.10.0 Beta 1` 是产品阶段;`beta` 是安装渠道;二者概念独立,
   与版本政策不冲突)。渠道编译进制品,并进入签名/发行元数据。
2. **实例身份 = (渠道, 安装形态, Profile)。**安装形态:`installed` / `portable`。
3. **数据布局:安装形态感知的 Profile 模型。**

   | 形态 | 数据根 |
   | --- | --- |
   | installed stable | `%LOCALAPPDATA%\VUA\stable\default` |
   | installed beta | `%LOCALAPPDATA%\VUA\beta\default` |
   | dev | `%LOCALAPPDATA%\VUA\dev\<profile-id>` |
   | portable | `<portable-root>\Data` |

   理由:installed 更新需要跨版本保留数据,同一渠道共享 Profile;`stable` 与 `beta`
   必须物理隔离;portable 写全局 AppData 就不是真正的 portable;dev 不应让不同工作树
   和实验分支轮流迁移同一个 dev 数据库;用户明确选择独立 Profile 时,状态分裂是预期
   行为而非事故。stable 首次试 beta 可提供"一次性从 stable 复制兼容数据"的明确操作;
   两渠道绝不实时共用同一个 SQLite,beta 数据也绝不自动合并回 stable。
4. **数据目录自带标记:**`productId`、`channel`、`profileId`、`formatVersion`、
   `migrationSequence`、`lastWriterProductVersion`。安装根标记文件只用于发现与校验——
   它不是唯一信任边界(渠道同时编译进制品并进入签名/发行元数据;改标记无法获得其他
   渠道的数据访问)。
5. **版本门:严格拒绝挂载。**不支持某数据格式的实例拒绝挂载该格式;桌面壳正常启动:
   不接通该库对应的 Provider,说明数据由哪个版本/格式写入,并提供补救入口(安装兼容
   版本、选择其他 Profile、从备份恢复、导出诊断)。绝不尽力读取,绝不降级写入。版本门
   以持久化的 `formatVersion` 与 `migrationSequence` 判断——不能仅因为"较新产品版本
   写过"就拒绝:两个产品版本可能支持完全相同的数据库格式。
6. **应用锁:按规范化数据根的哈希**(`AppLock = hash(canonicalDataRoot)`),而非纯渠道
   锁。指向同一数据目录的两个实例:第二个聚焦已有窗口并退出;`stable` 与 `beta`、两个
   dev Profile、portable 与 installed 均可并行。Provider 既有的数据库旁文件锁继续保留
   作为纵深防御。
7. **跨 Profile 项目突变锁(新前置门)。**租约不跨数据目录,因此启用多渠道并行前需要
   按 `ProjectIdentity` 的运行时排他——Windows 命名互斥体或项目内排他锁文件——外加
   项目 `.vua` 中版本化的未完成修改标记;任一渠道发现遗留标记后先 Inspect 再变更。
   SQLite 租约继续负责本 Profile 内的任务、generation 与恢复记录。**此门是启用多渠道
   并行的前置条件,不得拖到安装器完成之后;它不阻塞当前单 Profile 的 B3/M3 工作。**
8. **`vua_instances` 检测(不变):**读本契约与安装器落地后的安装根标记及锁存在性。
9. **bootstrap/路径解析器:**统一的 bootstrap/路径解析器拥有布局常量。代码事实:
   `LocalPackageIdentityStore` 已通过构造函数接收路径(跟随所选 Data Profile);
   Electron Main 当前以 `app.getPath("userData")` 装配 Provider 数据库路径——该装配是
   迁入解析器的迁移点。

## 后果

- installed 升级保留渠道内数据;`stable` 与 `beta` 物理隔离;portable 真正可携带;
  dev 工作树不会互相迁移数据库。
- 降级触发版本门,由桌面壳解释——数据不被触碰,也不被静默重读。
- 多渠道并行以跨 Profile 项目锁落地为前置(B 线工作,先于安装器需要它)。
- bootstrap/路径解析器成为布局常量的唯一拥有者;身份库跟随所选 Data Profile。
- 接受时本机证据:18 个本地 VCC 项目全部带 SDK;VCC stable/beta 双实例并存已在真机
  观察。

## 被否决的替代方案

- 纯渠道锁:否决——对 portable 构建与 dev Profile,渠道身份与实际状态所有权不一致。
- 跨安装、跨版本共享单一数据目录:否决——版本偏差写入正是本 ADR 要防的损坏模式。
- 在安装器存在前扫描常见路径以发现其它安装:否决——没有契约的检测只是在检测假设。
- 仅靠项目级租约(Proposed 时点的现状):否决——租约只在共享同一任务数据库时有效;
  它围栏项目突变,但应用级互斥、更新与协议交接仍无定义。
