# Orchestrator 迁移资产记录

> 状态：B0 迁移盘点完成；后续切片尚未形成正式实现
> 旧来源：`GLM/orchestrator` 及其早期纵向切片
> 当前所有者：`crates/orchestrator`
> 更新：2026-09-02
> 规范效力：迁移工作记录；产品语义仍以产品边界、已接受架构和版本化协议为准

本记录区分“测试通过的既有行为”和“已经定型的产品实现”。当前 Rust Crate 是可执行、可测试的
迁移基线，但不是正式 Gateway、Provider、SQLite 持久层或完整生产纵向切片。测试通过只证明旧行为
已被稳定捕获，不自动授予其产品契约、模块所有权或发行兼容性。

## 本轮裁定

- `schemas/orchestrator/envelope-v1`、对应 Rust 类型和固定实例作为 **B1 候选契约**保留。B1 可以在
  明确记录变化的前提下修订线格式，并必须解除 Gateway、Rust 私有类型与过渡 journal 之间的耦合；
- Recipe v0.2 已在单个项目上完成可复现生产验证，因此其行为可作研究证据；但目前没有实际用户，
  样本也存在把项目偶然结构固化为通用模型的过拟合风险。Recipe v0.2 停止扩展，B5 使用更复杂的
  合成项目形成 Recipe v0.3；
- Recipe v0.3 定型时整体废弃 v0.2 文件、读取器和分享码，不建设 v0.2 到 v0.3 迁移器。版本字段使用
  字符串 `formatVersion: "0.2"` / `"0.3"`；测试期分享码前缀为 `vuar0.2.`，旧 `vuar2.` 明确拒绝；
- JSONL journal 与 StateFile 是过渡持久化实现。它们的恢复语义可以迁移，文件格式本身不成为正式
  SQLite Schema 或 Gateway 契约；
- Orchestrator Bridge adapter 只作为首轮迁移参考实现。Unity Bridge 的 B0 封口不以该 adapter 或
  Orchestrator 原型是否通过作为否定标准。

## 资产分级

| 资产组 | 当前证据 | 应保留的行为 | 明确不带入正式实现 | 后续所有切片 |
| --- | --- | --- | --- | --- |
| `contracts.rs`、`schemas/orchestrator/envelope-v1` | Rust/Schema 固定实例测试 | 稳定错误码、本地化键与参数、`recoverable`/`retryable` 区分、关联 ID、任务 revision、未知枚举拒绝 | “现有字段已经冻结”的假设；同一序列化结构同时充当 Gateway DTO、Rust 应用类型和持久化记录 | B1 |
| `runtime.rs` | 状态转换、取消、超时、事件和恢复测试 | 接受成功前先持久化、终态不可覆盖、取消请求与取消结果分离、安全边界取消、单任务 revision 单调、持久化失败不发布成功 | 每任务一个 OS 线程、进程内订阅者、内存 HashMap、全局 JSONL 序号和现有锁粒度作为产品不变量 | B2 |
| `journal.rs` | 完整/中断/损坏/未知版本重放测试 | 不跨未知版本猜测、保留损坏证据、区分终态与需要检查的中断任务、恢复后继续使用稳定任务身份 | JSONL 作为权威状态、逐行 fsync 布局、journal payload 作为外部事件格式 | B2 SQLite 迁移测试 |
| `state_file.rs` | 原子替换、损坏归档、未知版本拒绝测试 | 小型非权威文件的原子替换和保留损坏原件原则 | 用 StateFile 保存任务、Recipe、Build Record、项目或适配器权威状态；由 Orchestrator 保存窗口/教程等前端状态 | B2；非权威设置由所属模块另定 |
| `capability.rs` | 就绪/不可用聚合测试 | 能力必须来自真实适配器、缺失原因结构化、输出稳定排序、不可用入口不伪装成可执行 | 当前字符串名称和二态模型直接升级为 Gateway v1；由 Renderer 从错误文本猜能力 | B1/B6 |
| `process.rs`、`time.rs` | 无 shell 参数、超时、输出上限、凭据环境剥离和确定性测试 | 参数数组、允许清单、超时、有限输出、结构化退出、可替换时钟和 ID、测试不依赖墙钟 | 只终止父进程即视为 Windows 生命周期完成；当前环境变量列表视为完整安全策略 | B2/B6 |
| `bridge.rs`、`model.rs` 中 Bridge 类型 | Bridge v1 固定实例、作业目录和进程调用测试 | Schema 驱动命令/结果、受控 `.vua` 作业路径、原子请求、固定参数、超时、缺失/无效结果区分 | Rust 类型成为独立线格式；Adapter 判断产品支持范围；字符串对象提示代替 GUID/`GlobalObjectId` | B3，并服从 Unity Bridge v1 |
| `filesystem.rs` | 路径穿越、清单校验、篡改检测和回滚测试 | 修改前验证快照、限制作用域、清单与摘要、恢复前复核、缺失作用域可恢复 | 无清单的整目录复制原型；快照存在即等同可恢复；未定义的保留和清理策略 | B2/B3 |
| `workflow.rs` | 早期工作流 characterization | Inspect/Plan/Confirm/Snapshot/Execute/Validate/Recover 顺序、阶段门、命令结果关联和拒绝后恢复 | 该内存状态机与 `assembly.rs` 并存成为两套正式用例；人类标签成为稳定协议值 | B3 提取行为后移除重复实现 |
| `assembly.rs` | 合成 Avatar/衣装、漂移、回滚、幂等和任务事件测试 | 计划内容绑定确认、执行前重算指纹、修改前快照、Bridge 结果验证、失败恢复、恢复失败独立报告、幂等重放 | `.done.json` marker 冒充 Build Record；`label`/`nameHint` 作为精确 Unity 绑定；当前单项目步骤集成为完整 AMF | B3/B5 |
| `recipe/`、`schemas/recipe/v0.2` | 单项目复现、Schema、固定实例、验证与分享码测试 | 身份/引用/循环/能力/锁定校验、Recipe 与 Local Resolution 分离、确定性摘要等研究行为 | 继续扩展或兼容 v0.2 文件；把单项目字段当成通用生产模型；将机器本地解析写入可分享 Recipe | B5：复杂夹具驱动 v0.3；定型后整体删除 v0.2 格式实现 |
| `vpm.rs` | 只读计划、确认绑定、漂移、快照、验证、回滚和幂等测试 | 联合依赖计划、确认绑定、执行前漂移检查、成功后重读验证、离线能力诚实报告 | CLI 输出或供应商结构进入领域/Gateway；进程返回成功即视为安装成功 | B3/B6 |
| `vpm_backend.rs`、`provision.rs` | `vrc-get` 库与 VCC CLI 合成测试 | 统一项目能力端口、`vrc-get` 解析/应用经验、参数校验、凭据剥离和可替换测试后端 | VCC CLI 项目创建成为 VUA 默认路径；把 VCC/ALCOM 兼容误写成由其工具拥有 VUA 用例 | B6：VUA `vrc-get` 主路径与 ALCOM/VCC 能力适配 |
| `environment.rs` | 合成目录、网络/磁盘/版本检测和只读性测试 | 定点能力检测、缺失与探测失败区分、检查不写入目标、注入探测根、稳定检查 ID | 后端提供最终玩家文案；当前阈值和目录假设未经 B6 契约即成为产品承诺；扫描用户磁盘 | B6 |
| `tools.rs` | 合成工具发现测试 | 允许清单、定点检测、缺失不是异常、供应方与入口证据 | 在 `1.0.0` 前启用面捕、动捕、优化器等运行时集成；旧工具表成为插件或执行授权 | `1.0.0` 后独立计划 |
| `lib.rs` 的扁平导出 | 全 Crate 编译与测试 | 可替换端口和纯规则可继续提取 | 扁平 Rust API 被 Gateway 直接消费；当前文件布局被视为架构分层 | B1 起按 domain/application/ports/adapters/bootstrap 整理 |

## 过渡持久化负债

以下项目必须在 B2 关闭，不能继续作为新功能的基础扩展：

1. JSONL journal 同时承担命令接受、状态、取消、终态结果和恢复来源，没有 SQLite 事务边界；
2. 任务权威状态仍分散在内存记录和重放结果中，缺少数据库 revision/CAS、租约和跨进程所有权；
3. 事件发布依赖“journal 先写”的局部顺序，尚未由同一 SQLite 事务及事务后 outbox/发布边界证明；
4. 中断任务只能归类为 `needs_inspect`，没有持久化执行意图、外部副作用结果、恢复点和适配器状态；
5. StateFile 对损坏或未知版本采用归档后默认值，该策略不适用于权威生产数据；SQLite 损坏、迁移失败、
   备份和人工恢复必须有独立语义；
6. 当前任务并发采用进程内锁和工作线程，尚无同一 Unity 项目修改互斥、Windows 进程树监督和 Provider
   重启后的任务接管证明；
7. `.vua/assembly/*.done.json` 只是幂等 marker，不包含正式 Build Record、事务关联或保留策略；
8. journal、任务事件和 Gateway 候选信封共享类型，妨碍数据库 Schema、领域状态和外部 DTO 独立演进。

## 后续提取顺序

1. **B1**：以现有测试语义为输入定义独立应用契约、Provider 接口和模拟适配器；不直接发布 Rust 类型；
2. **B2**：先为上述恢复语义建立存储无关特征测试，再实现 SQLite 权威状态并删除 JSONL 权威路径；
3. **B3**：从 `assembly.rs`、`workflow.rs`、快照和 Bridge adapter 提取首个正式
   Orchestrator—Unity 用例；
4. **B5**：以多项目、多素材和复杂关系合成夹具验证模型并定义 Recipe v0.3；定型后整体废弃 v0.2，
   不保留兼容读取或迁移器；
5. **B6 及以后**：重建项目/环境适配器；运行时工具实现继续等待 `1.0.0` 后计划。

## B0 验证

- `cargo test --locked -p vua-orchestrator`：通过；138 项通过，3 项人工测试按设计忽略；
- `cargo fmt --all -- --check` 与
  `cargo clippy --locked -p vua-orchestrator --all-targets -- -D warnings`：通过；
- 忽略项分别依赖真实机器环境、真实工具安装以及本地 `vrc-get`/网络，只用于手动验收；
- 测试输出只有 MSVC 链接器本地化信息被 Rust 作为 warning 转述，没有编译或测试失败；
- Unity Bridge 的 Unity 2022.3.22f1 EditMode、幂等装配和 Batchmode `inspect_project` 证据记录在
  `docs/migration/asset-ledger.md`，并独立于本 Orchestrator 原型的通过状态。

## B0 完成定义

本记录完成后，B0 后端盘点视为关闭，但不表示 B1—B6 已实现。进入 B1 时不得把本表中“明确不带入”
的实现细节写入 Gateway 或 Provider 契约；如真实生产场景暴露新的产品语义分歧，应先列出各方案后果，
再按产品定义提出建议并取得裁定。
