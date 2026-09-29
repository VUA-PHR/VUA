---
worktree: wt-8
branch: slice/production-review-repairs
role: 产线
baseline_commit: e768dde
updated: 2026-09-21
---
## 当前焦点
用户直接授权 2026-09-21：执行 7562f03 计划六项修复并交集成验收。六项已完成。
VUA-8 单树兼桌面/产线；VUA-7 只协调，不共写，不直接合 main。
## 自基线交付
A：R1 camera.scene 绑定 preview scene、还原 RenderTexture.active；
R2 preview（含 dry-run）跳过全局 SaveAssets/SaveScene，保留自身产物/回执。
Unity 2022.3.22f1 Windows 本机合成工程 EditMode 7/7 通过（2026-09-21 02:56 HKT）：
预览既有四例＋脏资源/60 帧像素隔离两例＋旧 mutating 保存/幂等一例。
证据：C:/Users/AR/AppData/Local/Temp/vua-review-editmode-20260921/results-a2.xml；
同目录 editor-a2.log 与 .vua/bridge/preview/ 产物，仅本地保留。
首次运行旧固定 commandId 测试相撞，已改唯一 ID，复跑全绿。
本测试验证合成渲染，不宣称真实 Avatar shader 或桌面端到端通过。
B：R3 合法 v4 公共出口统一版本/operation，处理入口/幂等读取异常；
旧协议原始标签、序列化与异常归属保留。v4 独立 wire 投影省略不存在的
可选哈希/身份；生产启动前失败不捏造 snapshot，省略不存在的 data。
补齐 staging 引用的 BridgePreviewBake/BridgeResultJson（含 meta），
回归断言所有 Bridge 源文件和 GUID 都被逐字节打包。
Unity 全套 53/53（results-final.xml，含干净场景与非空 RT 恢复），
旧异常边界追加后 v4 定向 22/22（results-final2.xml），同上证据目录。
28 份 C# 真机实际 JSON（含成功/重放/各公共拒绝与异常）通过 v4 Schema；
命令：VUA_BRIDGE_V4_RECEIPTS=<该工程>/.vua/bridge/v4-test-receipts，
cargo test -p vua-unity-bridge --test bridge_v4_vectors --test material_staging -- --include-ignored，6/6。
Rust 两 crate 全量通过（既有手动真机用例仍忽略），Bridge clippy 全 targets 通过。
C：R4 两种弹窗共享栈，Esc/遮罩仅关闭顶层；R5 初始焦点、循环、恢复、
StrictMode/卸载/动态按钮与 inert/aria-hidden 背景隔离；ImportPage body
portal 按模态 owner 保留可操作，内层确认期间随父层隔离。
R6 成功持久化回执触发宿主重读列表＋选中详情，弹窗卸载不丢通知；
失败/关闭不刷新，旧读请求不覆盖新读，保存期间编辑保留 dirty。
复核订正：宿主原选择函数把 ID 当文档传入且从未更新 selectedId；一并修通。
DOM：pnpm --filter @vua/desktop smoke:production-review，Chromium 152.0.7977.65
实际 DOM 33/33（含原生 Esc 输入、实际 ImportPage portal、合成 Gateway）。
证据：C:/Users/AR/AppData/Local/Temp/vua-production-review-dom.json（2026-09-21 05:28 HKT）。
桌面 typecheck 双通过；vitest 89 文件 807/807；boundary/i18n/contrast 通过；
check:leak 独立临时生产构建 155 指纹零泄漏。未触发桌面 dist 清理/完整发布构建。
真机未验：真实付费 Avatar/自定义 shader、真实远程网页视图与正式 Gateway 全链。
范围外维持：正式预览触发、Gateway bake 定位、正式资产读取协议、解除 DEV 门。
无完整端到端宣称。冻结 v1–v4 Schema 未修改；所有测试素材均合成，产物仅本地。
## 阻塞
无。此前自动审批要求本任务直接授权，用户已补充授权，已恢复执行。
## 下次合并意图
已验收合并：用户明确授权，2026-09-21 合并 06ec6390 收编三笔 a7bc1b42、a09b3b68、63a39f4f。
合并树 Rust workspace、desktop 825/825、DOM 33/33、typecheck/i18n/boundary/生产泄漏检查通过。
## 留言
- [→集成] 三笔已随用户授权合并 06ec6390 验收，不重复派发；真实 Unity/DOM 与未验范围如上。
- [→桌面] R4–R6 已落本树；同一持久化通知与模态所有权供现有页面消费。
- [→产线] R1–R3 已落本树；补齐 staging helper 防止打包后缺类。
