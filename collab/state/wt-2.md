---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 36bab970
updated: 2026-09-21
---
## 当前焦点
**第 155 批（2026-09-21 23:0x–23:5x，节拍轮工作时段 date 实测）＝U19 交棒准
入闸后端切片（用户裁决 2026-09-21 下午，BOARD U19 行裁决全文照录为规范源，
今晚窗口置顶首项）一笔实现批 36bab970；轮首合并 main fa2290ab（本树原领先
两笔已被集成第 154 批收编为合并 9125f8f1，零分叉追平后叠加）；五 crate＋
docs＋mock 面 6 改 9 增；cargo test --workspace 890/0＋clippy --workspace
--all-targets 0 警告；VUA-7/VUA-8 全程零触碰**：

- **交棒状态闸（后端权威，provider_host 准入序，不在 UI）**：核心分类函数
  `classify_handoff_record_state`（crates/orchestrator/src/release_handoff.rs）
  按构建记录 v0.3 status 枚举对表落位——规范表：`succeeded`／
  `succeeded_with_warnings` 放行（警告呈现保留归桌面面，后端零改写）；
  `failed`／`cancelled`／`rolled_back`／`recovered` 拦截＝新码
  `vua.release_handoff.record_state_blocked`（category=**permission**＝政
  策拒绝类，裁决修正 a「状态是事实、哪些状态可交接是政策」；`params.state`
  携记录状态原值逐字）；status 缺失/非字符串/枚举外拒绝＝新码
  `vua.release_handoff.record_state_unknown`（category=validation，记录无
  法确认）。闸位＝记录存在之后、身份解析之前（wire 钉准入序）；被拦记录
  **不受理任务**（任务库零写入、port 永不触达）。messageKey 恰两键
  `errors.releaseHandoff.stateBlocked`／`errors.releaseHandoff.stateUnknown`
  （四语词面归桌面座并行批，本座只管发射面）。recovered 与其余终态同待遇
  （裁决修正 b：检视完成不改失败历史为成功，两套状态不混用）；成功记录不
  保证工程仍是当时结果（修正 c，零宣称）。
- **独立检视入口（裁决①「不得禁止打开工程排错」）**：新路由
  `release.openForInspection`＝交棒受理序**去掉状态闸**的剩余全集
  （params 闭集／接线面／build_unknown／editor_unresolved 照验，wire 钉）；
  完成事实＝`build_inspection_fact` 六键闭集（交接事实五键＋显式
  `operation` 键 const 检视词面）——词面由形状钉死**绝不宣称交接完成**
  （负例向量：携交接操作词面的检视事实非法；无上传字段形状钉）。port/
  trait 形状零变化（两入口复用 `ReleaseHandoffPort` 机制，操作语义归路
  由面），unity-bridge 零增操作。
- **词表升版 release-handoff v0.2**：版本常量 0.1→0.2 单源（provider-host
  改再导出核心常量，双源字面量删除）；错误信封新增 params 面（ORC-ERR-001
  形状，**仅非空出现**——既有码线面形状逐字节不变）；冻结集＝
  `schemas/release-handoff/v0.2/` 双方法 Schema＋正例 5＋负例 6 向量＋双
  语协议本 `docs/protocols/release-handoff-v0.2_ZH.md`/`_EN.md`＋REGISTRY
  两行；**v0.1 族文档一字节不动**（历史冻结面，编译钉保留）。
- **测试（裁决④⑤：绕过 UI 直接调用＋全部状态覆盖）**：wire 帧环 20/20
  ——六枚举态＋缺失＋非字符串＋枚举外＋空串逐一过真环；拦截三断言
  （码＋category＋params.state 逐字）；被拦不受理任务且 port 未达；准入
  序钉；检视入口对被拦/缺失/枚举外全不闸＋词面钉＋三验照旧；orchestrator
  release_handoff 单测 14（全枚举分类守卫＋检视事实构造）。全绿：
  cargo test --workspace **890/0**＋clippy --workspace --all-targets **0
  警告**；mock 包 tsc＋vitest 46/46 复绿。
- **跨座接续点（候桌面座 wt-3 随环流水线下一环，非阻塞登记）**：①TS 契
  约 face（packages/contracts，桌面所有权）词表行升 0.2＋
  `release.openForInspection` 方法面——其前桌面编译期类型停留 0.1（运行时
  无版本闸，桌面本地面无隐性回归，已核 release-handoff-model/port 零版本
  字面量钉）；②四语词表两新键＋Release 页独立打开入口确认；③mock provider
  检视入口缺席 fall-through 分支候 TS method 闭集入新方法后随批补入（本批
  仅更新缺席分支注释如实登记——method 闭集在 @vua/contracts，本座不越域；
  其前模拟面对检视方法如实答 unknown_method，不属伪造）。
- **诚实边界维持：零端到端宣称**——全部证据系 fake port／临时库帧环（裁
  决 15 本地先行）；真机（真实记录→真启动→handshake→事实回流、被拦态桌
  面呈现全链）归 W25（O-2），证据要求不放宽。`?? _local_p27_devlog.txt`
  照例未触碰。

## 前情（本域链，全文见本文件 git 历史与 BOARD 前录）
第 152 批（cd8c0000＋d2063abe，2026-09-21）＝纯文档起草批：proposal 029
（车间入口模型重构〔配方驱动为主〕＋从已有 Unity 项目导出 Recipe）两笔，
经集成第 154 批收编（合并 9125f8f1）验收成立；用户下午在场资源纪律遵守
（零构建零测试）。第 150 批（7bc18e90＋464541c3）＝素材链修复批（失败
messageKey 类别分流＋Packages/ 通道边界两层兜底），经集成第 151 批收编
（合并 3e5573a6）。第 148 批（83e267d9＋98767e61）＝素材链反向审查批
（tar 解包组件级路径守卫＋mutating 命令 id attempt 盐＋物化指纹硬要求），
经集成第 149 批收编（da6a3bfb）。更早段落见本文件 git 历史与 BOARD 前录。
