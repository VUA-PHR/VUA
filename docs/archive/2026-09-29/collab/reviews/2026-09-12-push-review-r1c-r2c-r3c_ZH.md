# 推送增量复审报告（第 1–3 轮 c，r1c/r2c/r3c 合并归档）

- 日期：2026-09-12
- 审阅对象：`12a6a45..725e8b5` 待推送世代（origin/main = `12a6a45`，main = `725e8b5`，共 **8 提交**）；
  实质变更仅 **5809d37**（slot/wt-3 桌面 UX 四缺口批 ce91403：19 文件 +822/−34），其余为
  collab-only 状态/簿记批（5236af0、07c31c5、decbe08/24027fd、0dc00cb/ff2f2c4、f864337/725e8b5）
- 方法：复刻 r1b/r2b/r3b（`collab/reviews/2026-09-12-push-review-r{1,2,3}b_ZH.md`），按本轮增量收窄
- 性质：集成门复审；除本报告与 BOARD/状态簿记外未写任何文件、未 push

## Verdict：**通过（三轮全过，可推送）**

## r1c——内容与纪律审

- **实质增量逐项对照 ce91403 宣称（五项全一致）**：
  1. Provider 运行时三根注入：`provider-bootstrap.ts` 新增 `desktopProviderProcessFactory`——
     经 `SupervisedProcessProviderV01` 公开注入点（第二参）在 `providerEnvironment` 清洗
     基础上补 `VUA_PROVIDER_DATA/VUA_WAREHOUSE_ROOT/VUA_PROJECT_ROOT` 三确定性路径；
     不透传其他宿主变量、凭据形变量仍由清洗层剥离（`provider-bootstrap.test.ts` 钉环境键集）；
     `main.ts` `resolveProviderEndpoint` 扩展三根＋`mkdirSync recursive` 幂等建目录。
  2. 内嵌浏览首开自动导航：`import-model.ts` `BOOTH_HOME_URL = "https://booth.pm/"`（浏览允许
     清单内，与下载域清单分轨）；`ImportPage.tsx` 可用态挂载一次性导航（依赖
     `availability.kind`，用户关闭视图不改 availability＝不强行重开）；「回首页」按钮同址。
  3. Cookie 有界持久化：`security.ts` `installCookiePersistencePolicy`——仅允许清单来源的
     **会话** Cookie 在 changed 时补 `expirationDate`（180 天，`COOKIE_PERSIST_DAYS`），
     值/域/路径/secure/httpOnly/sameSite 原样保留；清单外/缺域/非会话返回 null 不动；
     Cookie 只落本机 persist 分区，不进渲染层、不经 IPC（`security.test.ts` 85 行钉死）。
  4. 44px 导航条＋additive 历史三方法：`remote-content.ts` `REMOTE_VIEW_NAV_STRIP_PX = 44`
     上缘让位（窗口过矮 `Math.max(...,0)` 不产生负高度）；`goBack/goForward/reload` 仅做身份
     与可走性守卫、不二次来源裁决（历史成员产生时已过导航策略——与 U9 语义一致）；
     `desktop-gateway.ts` TS 面纯 additive；三条新 IPC 均带 `assertLocalSender` 守卫。
  5. 环境卡片标题注册表：`contract-projection.ts` `CHECK_TITLE_KEYS` 11 项闭集（与引擎
     environment.rs id 闭集一致），未知 id 如实透传 checkId 不猜测（`contract-projection.test.ts`）。
- **新增测试 4 文件 264 行**，与宣称的四个新增测试面对应（provider 环境注入/Cookie 持久化/
  displayUrl＋历史可走性/检查标题投影）。
- **诚实纪律**：无端到端宣称文案；无 fixture 泄漏；UI 数据全部来自 Gateway 快照与壳能力自报。
- **registry 负例验证（真实运行）**：`collab-brief --registry-only` 正例 **46/46 一致 exit 0**；
  人为改坏 `docs/product-boundary_ZH.md` 头部版本 1.3.0→9.9.9 → **exit 1** 且定位到行
  （「版本 REGISTRY=1.3.0 vs 头部=9.9.9」）；复原后 `git diff` 干净。

## r2c——forest 零泄漏硬门＋敏感信息（增量复扫；全树基线见 r2b）

| # | 检查 | 结果 |
| --- | --- | --- |
| a | 增量新增文件路径级（forest/figma/.codex/ui-variants） | **零命中** |
| b | 草稿指纹（CSS 变量/动效 token/组件类型/图标名/中文数据串/unitypackage 名/色值/字体栈）对增量 diff | 首扫 15 处命中**全部位于 r2b 报告本体入库行**（报告记录指纹清单本身，自引用）；**排除 `collab/` 后复扫零命中** |
| c | 凭据模式（api_key/secret/password/bearer/ghp_/AKIA/冲突标记）对增量（非 collab） | **零命中** |
| d | 二进制残留（`--numstat` `-` 行） | **零**（全增量纯文本） |
| e | 本机路径增量（`Users/AR` 两形态，非 collab） | **零命中**；全树正斜杠计数自上轮 28 处降至 **3 文件**（均为 `collab/` 治理文本已知常态；r2b O-1 的 `fixture-release.ts` 两处已随 O-1 消毒批 12a6a45 清除，**O-1 关闭**） |

「forest」字样出现处维持 r2b 结论：仅 .gitignore 规则与 019 授权的 forest-green 词表 ID＋
诚实不可用实现。**硬门结论：通过。**

## r3c——全量复跑（2026-09-12 本轮真实运行，隔离 CARGO_TARGET_DIR 避让运行中应用）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| cargo test 第 1 轮 | `cargo test --workspace`（隔离 `target-pushreview`） | **exit 0** |
| cargo test 第 2 轮 | 同上复跑 | **exit 0；67 套件 / 495 通过 / 0 失败 / 26 ignored**——与 5809d37 验收及 r3b 世代**逐位一致** |
| clippy | `cargo clippy --workspace --all-targets -- -D warnings`（rustc 1.97.1） | **exit 0 零告警**；BG-19 点位（`material_task.rs:94` unnecessary_lazy_evaluations）本机**未复现**——工具链分歧观察维持，BG-19 留产线按 CI 事实判定 |
| 桌面 check 全链 | `pnpm check`（隔离 `target-pushreview-desktop`） | **exit 0**（typecheck 两配置＋build＋boundary＋i18n＋contrast＋**check-leak 159 指纹零命中**）；vitest 复跑确认 **58 文件 / 463 测试全绿** |

## 结论

**通过（3/3）。** 本世代实质变更仅桌面 UX 批，与提交宣称逐项一致、纪律核对无阻断；
forest 零泄漏硬门增量复扫零命中；全量测试两轮逐位一致。可推送 `725e8b5`。

- 本报告：`collab/reviews/2026-09-12-push-review-r1c-r2c-r3c_ZH.md`。
- 附带簿记观察：BOARD 工单表存在两行 BG-18 重号（CI 环境敏感失败行与 compose-draft-store
  确定性行）——本轮已将后者重编号为 **BG-20**（无既有引用，重编号零风险）。
