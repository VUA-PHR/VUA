# 端口取消位设计登记（#45 余项 (3)）

> 日期：2026-09-23
> 作者席：核心（wt-2）
> 来源：操作者 2026-09-23 派单（09-22 夜被取消派单的重发，内容不变）
> 状态：**登记候冻结裁决**——设计环零代码；本文不改变任何端口词面；
> 冻结面变更一律走冻结环另批。#45 行内指针折入候集成验收时落账。
> 素材基础：第 148 批反向审查登记（快照/供给网络腿/单包解包/preview/apply
> 现不可中断段）＋#45 行各次进度更新＋下引代码事实（本日实读）。

任务背景：工作纪律第 4 条要求长操作可取消、可观察、可恢复、可安全重试。
素材链的取消机制已落地（任务级＋步边界＋逐包环），但第 148 批反向审查
登记了五个现不可中断段。本登记回答四问：哪些端口面需要取消位、取消语义
取什么形态、每处取消的补偿语义、实现切片怎么切。

---

## 0. 基线事实（代码锚点，本日实读）

**任务运行时取消机制（既有，本设计的唯一延展对象）**

- `TaskRuntime::cancel()`＝锁内验证 → journal 记 CancelRequested → 原子
  标志 → 广播事件；幂等；对 poisoned（冻结）任务返回类型化错误
  （`crates/orchestrator/src/runtime.rs` 模块文档与 `cancel()` 实现）。
- 取消是**协作式**：请求（cancel_requested）与完成（TaskExit::Cancelled）
  是两回事（ORC-CON-006）；job 在**安全边界**观察 `check_cancel()` 并自决
  退出——「只有 job 知道哪里是安全边界：装包装到一半不能停，装完一个包
  才是边界」。
- 超时看门狗复用同一标志，到点后 job 在下一安全边界退出、按 failed＋
  `vua.task.timeout` 终结。
- 重启恢复：非终态一律映射 inspect_required（诚实纪律第 3 条；恢复绝不
  隐式续跑）——取消设计与恢复设计共用这套九态，零新机制。

**素材链桥接（现实现的精确形状）**

- 提交层每执行创建一个 `MaterialCancelToken`（`AtomicBool` 包装；不重置、
  不复用；所有权在任务规格不在执行器——`crates/unity-bridge/src/
  material_exec.rs` `MaterialCancelToken`）。
- 任务层观察线程以 25ms 周期把 `ctx.check_cancel()` 桥接到令牌
  （`crates/unity-bridge/src/material_task.rs` `material_intake_job`）。
- 执行器在**步边界与逐包环头**观察令牌：verify 前、快照前、变更主体后、
  direct 导入逐包环头、staging 导入逐包环头、generate-only 逐包环头
  （`MaterialExecutor::execute` / `run_direct_imports` / `run_local_reusable`
  / `generate_vpm_only`）。
- 取消/失败出口接线解包残留回收（`cleanup_import_extractions`，#45(4)
  清理策略交付）。
- 回执律：成功、取消、失败**一律**发布 BuildRecord；重放守卫只认同身份
  SUCCEEDED 收据，取消/失败收据「不说谎」——重试走全新 attempt
  （`MaterialExecutor::execute` 收据读取臂）。
- 中断律（协议本 material-intake 0.2.1）：回执前中断必须先 Inspect，
  不得自动重放未知副作用。

**provider-host 路由与下载面**

- `handle_cancellation`：先权威库受理（幂等＋revision 校验），受理成立才
  取消 worker 令牌——被拒请求绝不产生副作用
  （`crates/provider-host/src/provider_host.rs`）。
- 下载任务（`dl-` 前缀）取消折叠为 abandon 意图经 intent 通道发 Main。
- download-events v0.1（冻结）：取消在 **attempt 边界**生效；六事件闭集；
  cancelled 终态、interrupted 为可续传候选（`crates/bdl-store/src/
  download_events.rs` 模块文档与枚举）。

**端口词面现状（冻结面，本批零触碰）**

- `VpmBackend` trait 全系方法**无任何取消参数**
  （`crates/orchestrator/src/vpm_backend.rs`：preview_install /
  apply_install〔digest 纪律〕/ create_project / resolve_project 逐签名
  实读）。
- `resolve_project`：网络段系词面固有（无 preview 臂，A4 加远端律）；
  declared-none 缺省；已满足短路先于集合装载（零网络快路有环回计数＋
  工程树双钉）。
- 实现事实（环境域，只读核对）：lib 后端 `resolve_project`＝in-process
  `block_on` 异步调用（`crates/project-manager/src/vpm_backend.rs`
  `VrcGetLibBackend::resolve_project`）——`vrc_get_vpm` 库**无取消 API**；
  CLI 后端如实 declared-none（无 resolve 面）；`ProcessSpec` 的 1200s
  超时属 CLI 进程面（create/preview/apply 的 CLI 路径），与 resolve 无关。

---

## ① 哪些端口面需要取消位（逐面判定）

| 面 | 判定 | 依据 |
| --- | --- | --- |
| `VpmBackend::resolve_project` 网络腿 | **需要**（唯一真正无上界的用户可感长操作） | 网络段词面固有；冷缓存解析可达分钟级。**但见②关键事实：token 传参对 lib 后端物理无效**，取消位只能落在段边界，界由传输超时承担 |
| Bridge 长命令 | **部分需要——维持段边界，不加命令级取消** | 单命令有超时界（TimedOut→`bridge_timeout` 诚实失败）；批时长来自逐包环而**环头已有取消位**；命令中段中断必落指纹链未知态→协议中断律本就强制 Inspect，命令级取消收益≈零 |
| 快照创建 | **不设取消位——保护段**（论证见③） | 快照是其后一切取消的安全性来源 |
| BDL 提取面（booth 归档页提取＋保守依赖提取器） | **永不需要** | 纯 CPU 有界、零网络零文件访问（保守提取器验收实读钉死）、亚秒级；取消无意义。前瞻条款：未来该域端口若长出网络腿，**冻结时必须随行自带取消设计** |
| 未来下载面（BOOTH 下载等） | **零新设计** | download-events v0.1 已携带完整取消语义（attempt 边界＋abandon 意图＋终态闭集）；未来下载骑此面（数据域），不进 VpmBackend |
| preview/apply 尾段 | **段边界候选**（见④ S2） | apply 受 preview digest 约束（同绑定纪律）；现状尾段无令牌观察，取消只在主体后检查位生效 |

## ② 取消语义形态（三案对照与裁决建议）

- **(a) token 传递入端口面**——否决为通用形态。三重成本：
  1. port trait 全系无 token 参数＝冻结面变更，走冻结环另批（本批禁改）；
  2. **对 lib 后端物理无效**：`resolve_project` 是 in-process `block_on`
     调用外部库异步 future，库无取消 API——token 纵然传入也只能在调用
     前后各看一眼，中段照跑到底；
  3. 对 CLI 后端语义发散：token 到 CLI 只能翻译成进程杀，与 lib 的协作式
     语义不同律，一个端口词面承载两种补偿语义违背单一真相。
- **(b) 任务级取消＋(c) 步边界检查（现机制的延展）**——采纳为现行形态。
  延展成本＝执行器内补边界观察（小改动、单 crate）＋取消注入测试；
  零端口词面变化；诚实（段跑完→下一边界退出→快照回滚→Cancelled 收据）。
- **结论：取消粒度三层谱系，不发明第四层**——
  任务级（运行时 cancel）→ 段边界（执行器令牌）→ 传输超时（端口调用
  内部：lib HTTP 超时、CLI 1200s、Bridge 命令超时）。每层各有其职：
  运行时管「请求」，执行器管「何时安全停」，超时管「停不了时的界」。
  若 W25 真机证据表明 resolve 腿时长造成用户痛点，正确形态是**超时预算/
  进度事件可见性**（让用户看见腿在动），仍不是 token。

## ③ 每处取消的补偿语义（逐点登记）

| 取消点 | 现状 | 补偿语义 | 论证/裁决点 |
| --- | --- | --- | --- |
| 首次变更前（verify 前/快照前） | 已有观察位 | 干净退出，rollback=not_needed；Cancelled 收照常发布 | 现状即正确，零工作 |
| **快照中段** | 无观察位 | **不可取消保护段** | 快照是其后一切取消与失败的安全网；中断它严格更糟（留下无恢复点的半态）；有界本地 I/O（按风险决议作用域拷贝）；完成后下一边界退出。第 148 批登记维持，本登记补足论证 |
| 供给网络腿中段（create→resolve→re-baseline） | `run_provision` 无令牌观察 | 取消在下一包边界/步边界生效→既有快照回滚（未供给目标＝空态隔离区语义，协议本已有）；网络中断/依赖不可满足→诚实失败已覆盖（`provision_failed` 臂＋收据非空 failed 集＝诚实不完全面） | 用户感知问题只剩「取消后腿还在跑」——补偿正确、呈现可改进（S2 在 create 与 resolve 之间加观察位属候选，不改补偿臂） |
| 单包解包＋Bridge 命令在飞 | 无观察位（段内） | 不可中断段维持（第 148 批）；取消在下一包环头生效；解包残留由取消出口回收（#45(4) 接线）；已完成包的部分效果由快照回滚补偿；`bridge_timeout` 走诚实失败 | 指纹链使包间边界成为唯一安全停点；回执前中断必须先 Inspect 的协议律兜住进程死亡等无从观察者 |
| preview/apply 尾段（local-reusable） | 无观察位 | 取消在主体后检查位生效→Cancelled＋回滚恢复目标（已 apply 的安装被回滚覆盖＝净效果一致） | **登记一处诚实事实与裁决点**：发布的包 artifact 在项目外（输出根），快照回滚管不到——已发布文件保留、收据如实 Cancelled。裁决点＝「保留＋如实呈现」vs「apply 前加检查位跳过安装」，候 S2 切片随冻结裁量，两案补偿均诚实 |
| 恢复面 | 既有 | 取消不产生半终态：Cancelled 收据发布、重放守卫只认 SUCCEEDED、非终态重启→inspect_required | 诚实纪律第 3 条全成立，零新机制 |

## ④ 实现切片切分建议与优先级

- **S1（P0，本批已交付）**：设计登记本体（本文）。
- **S2（P1，产线域 unity-bridge，零端口词面变化）**：边界观察补全——
  `run_provision` 内（create 后 resolve 前）＋ local-reusable 尾段
  （register/preview 前、apply 前）两处令牌观察＋取消注入测试；尾段
  artifact 发布补偿两案随切片冻结裁量。触发：候操作者派发，或随产线下
  一个素材链切片搭车。
- **S3（P2，核心冻结环，条件触发）**：仅当 W25 真机证据表明 resolve 腿
  实际时长构成用户痛点——形态＝端口面超时预算/进度事件可见性（非
  token，理由见②）；走冻结环另批。
- **S4（P3，产线＋核心，明确缓议）**：Bridge 词汇面取消操作（版本化
  Bridge 升版＋C#）——指纹链使命令中段中断必然落 Inspect，收益小；
  候 W25 证据要求才升窗。
- **下载面/BDL 提取面：零切片**（①判定；前瞻条款见①表）。

## 诚实边界

- 本文系设计文档面登记，零实现、零真机运行；「快照有界/提取亚秒」等
  时长论断系代码面论证非实测；W25 前零端到端宣称维持。
- 引用一律锚定符号/方法名与受管文档版本，不用裸行号（行号随世代漂移）。
- [候冻结裁决] 标记的裁量点（尾段补偿两案、S3 触发条件）零代决——
  冻结环另批或 W25 证据返回前，现状行为不动。
