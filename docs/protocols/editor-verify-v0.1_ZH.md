# editor-verify 协议 v0.1（手选编辑器路径验证词表行：environment.verifyEditor）

[English](editor-verify-v0.1_EN.md) | [简体中文](editor-verify-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结（U10 手选编辑器路径验证词表行）**（2026-09-13，proposal
> 021 核心裁决七点定形；冻结收口逐项见下）
> 机器可读词表：`schemas/editor-verify/v0.1/`（单方法 Schema＋正例 3 对＋
> 负例 3 向量；环境域锚测试 `crates/project-manager/tests/
> editor_verify_wire.rs`；帧环 wire 测试 `crates/provider-host/tests/
> editor_verify_wire.rs`）
> 范围：`environment.verifyEditor`（带参只读验证动作：用户手选路径三形态
> →身份／版本／分类或闭集拒绝码）
> 所有权边界：检测域事实原语归 `crates/project-manager`（环境域）；
> environment-managers v0.1 检测快照（Hub 枚举）不动——本词表行是手选
> 补救路径的验证面，绝不改写快照、绝不预测选择结果；分类权威＝核心
> `editor_targets` 分类器（单一分类权威，复用不复制）
> 更新：2026-09-13（v0.1 冻结批：协议本双语＋REGISTRY 登记＋豁免行移除
> 请求）

## 名称映射（行名 vs 族名，防歧义）

行名 `environment.verifyEditor` 面向消费语义——与 `environment.getSnapshot`
同 `environment.*` 检测域事实族（裁决①：实现细节不升入协议面）。目录／
协议本族名 `editor-verify` 锚定实现原语（`crates/project-manager/src/
editor_verify.rs`）与拒绝码族 `vua.editor_verify.*`。两个名字各司其职；
拒绝码族保持原语可追溯性，不靠行名。

## 冻结收口（proposal 021 裁决时序逐项）

- **①检测域原语**：editor_verify v0.1（3eef4e4）——可执行文件自身 PE 版
  本资源确立身份（门①：绝不信任路径名）＋核心分类器定分类与引导码
  （门②：非生产目标绝不静默使用）＋输入三形态归一化＋拒绝码闭集 5 码；
- **②词表行裁决**：核心七点裁决（021 内联线程，2026-09-13）定形行名／
  分型／params／result／缺席码／向量／时序，词表行形状就此冻结；
- **③草案件**：方法 Schema＋向量正 3 负 3＋环境域锚消费测试 8/8
  （38af48c，经 71c65d4 验收入 main；SCHEMA_EXEMPT 草案豁免行同批追认）；
- **④核心路由批**：provider-host 路由接线＋`EDITOR_VERIFY_SCHEMA_VERSION`
  核心域自有常量＋三条实现级钉子映射＋帧环消费测试（deafe11＋收编
  bbb6206＋加固 373470c，经 a6585c2 验收入 main；capabilities 登记
  `environment.verifyEditor = available`）；
- **⑤双语协议本＋REGISTRY 登记＋豁免行移除请求**：随本冻结批落地
  （`scripts/collab-brief.mjs` SCHEMA_EXEMPT `'editor-verify'` 行请集成
  在本批验收时移除，dffb1e3 先例；移除后反向盲区检查由本表登记行兜住）。

## 冻结范围与分工

本协议冻结**方法词汇、参数闭集、字段面与结果形状**。错误通道、请求关联
与传输信封属于版本化应用契约。桌面 TS 面登记（`@vua/contracts` 词表行＋
联合＋守卫＋正反例测试）与设置面实现（「浏览」入口＋验证结果就地形呈现＋
门③信任呈现＋首次确认＋选择留痕）归桌面 U10 设置面切片——核心路由批
已验收，桌面开工条件就绪（021 时序：候路由批后随批），完成前不得声称
端到端；真机走查归 W25 真机窗口，证据要求不放宽。门③「首次实际使用前
一次确认」＝执行放行层，与本验证面解耦（集成仲裁：自动选择管解析呈现、
门③确认管放行执行、确认按选择计一次）。

## 方法面

| 方法 | 语义 | 消费方 |
| --- | --- | --- |
| `environment.verifyEditor` | 验证一个用户手选的 Unity 编辑器路径：读取可执行文件自身版本资源确立身份（门①），解析版本交核心分类器产出分类与兼容政策引导码（门②）；result 两态 tagged union（`verdict` 判别），信封 `schemaVersion`＝本词表行版本 `"0.1"` | 设置面「环境与路径」节手选入口 |

诚实缺席纪律：路由未接线／原语不可达＝`vua.environment.verify_unavailable`
类型化缺席（预留语义——本路由为无状态直调、恒接线，今日无缺席路径，
消费测试钉死其绝不出现为验证拒绝）；验证拒绝＝result 内 `refused` 正常
发现态（拒绝码闭集 `vua.editor_verify.*` 五码），绝不上浮应用错误信封——
拒绝是发现，不是失败。

## params 与语义

- params 闭集单键：`path`（`minLength 1`；**明示不设 maxLength**——用户
  提供的文件系统路径 verbatim 承载，写侧不发明独有上限）；
- 输入三形态（exe 文件本身／版本化 Hub 根／Editor 目录）由原语归一化，
  wire 与桌面层零加工、零归一化猜测；
- `additionalProperties: false`——词表外参数＝`vua.environment.invalid_params`
  validation 错误信封（形状违反绝不冒充验证拒绝——拒绝需原语已实际
  运行；六违反负面断言由核心帧环消费测试钉死）；
- 三条实现级钉子：①`refused` 绝不上浮应用错误信封（ok 信封内正常
  result 态）；②`detail` 承载原语资源原文、逐字透传不解释；③信封
  `schemaVersion` const `"0.1"`＝核心域自有常量 `EDITOR_VERIFY_SCHEMA_VERSION`
  （绝不借外族版本）；
- `classification` 四值闭集与 `guidanceCode` pattern（`^vua\.env_managers\.`）
  与 environment-managers v0.1 冻结面逐字同构（零新发明，冻结批 diff
  核验点）。

## 依赖方向

```text
React View（设置面「环境与路径」节）
  → 类型化 feature/Gateway
  → Electron preload 与主进程适配器
  → 版本化应用契约（environment.verifyEditor 词表行）
  → provider-host 路由（核心域，已 live）
  → editor_verify 原语（crates/project-manager，环境域）
  → 核心分类器 editor_targets（单一分类权威，复用不复制）
```

## 机器可读词表

`schemas/editor-verify/v0.1/`：`methods/`（单方法 Schema）＋`examples/`
（正例 3 对——exe 直选 2022.3.22f1→production_target／版本化根
2022.3.22f1c1→other_unity_version＋chinaDistribution true／Editor 目录
2019.4.31f1→migration_source，normalize 三分支各钉一件；负例 3——
`target_missing`／`not_an_editor`〔门①反例：目录名声称 2022.3.22f1 但
身份 7.7.7x9 不符〕／`exe_missing`，均为 refused 合法 result 态向量，
绝非 schema 违反）。消费测试双载体：`crates/project-manager/tests/
editor_verify_wire.rs`（环境域锚：向量分类逐件由核心分类器重导出对照
零漂移＋三分支 normalize 形状＋闭集/pattern/缺席码防过载）＋
`crates/provider-host/tests/editor_verify_wire.rs`（帧环真接线：verified
映射逐字段对照本词表 Schema jsonschema 校验＋钉子一经真实系统接线钉死＋
detail 逐字＋请求路径 verbatim 透传＋params 六违反＋缺席码防复用＋常量
锚定＋capabilities 行）。词表或字段变更必须升版本，绝不原地改写。

## 开放项

- 桌面 U10 设置面切片（TS 面登记＋设置 UI＋门③呈现留痕）：核心路由批
  已验收，候桌面随批开工（021 时序）；
- 真机走查（手选→验证→激活全链）：归 W25 真机窗口；
- 来源字段（`probed`/`user_selected`/`follows_manager`）：候选搁置，维持
  v0.1（021 裁定二：待第二真实来源真实出现再随真实需求起草）。
