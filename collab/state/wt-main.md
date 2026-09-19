---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 66bff16
updated: 2026-09-19
---
## 当前焦点
**第 118 批（2026-09-19 20:3x–20:4x，用户授权无视时段开发）——dev 启动链痛点修复＋开屏×版本牵线执行计划（用户三点指令之 1/2）**：

- **一键启动器 `scripts/dev-start.cmd`**：fetch＋ahead/behind＋版本/提交号上屏，落后时干净树提议 fast-forward；退出自关闭——「开终端/关终端」两动作消除。
- **`dev.mjs` 5173 preflight 自愈**：「不知道是否最新」的机制根因修复（旧 vite 占口→新 vite strictPort 起不来→electron 加载前代渲染层）；命令行双条件核实（vite＋本仓根路径带尾分隔符防兄弟 worktree 误伤），不符即如实报错退出绝不碰外部进程。dry-run 实测识别用户当前真实 vite 实例（pid 62860，未触碰）；非 dry 杀进程路径未亲测如实申报。
- **执行计划 `docs/plans/boot-splash-version-wiring_ZH.md`**：Phase A 真实启动里程碑驱动开屏退出＋构建信息上屏（纯桌面域）／Phase B GitHub releases 只读版本检查（三态诚实，默认开关待裁决）／Phase C 下载应用更新（独立提案级，打包形态硬前置）／Phase D 视觉调整机制。待裁决三项在计划文末。
- **机械校验**：node --check dev.mjs 通过；launcher dry-run 实测输出正确；变更面＝scripts/dev-start.cmd＋apps/desktop/scripts/dev.mjs＋docs/plans 一文件＋collab 两文件，零产品代码/契约/Schema；`?? _local_p27_devlog.txt` 照例不触碰。

## 前录（第 117 批，2026-09-19 20:0x–20:2x，全文见 git 历史）
用户裁决切片 slice/boot-splash-notify-popover 入库（46638e8＋aa08d4e）：液态开屏（方形柱自顶向下＋VUA 渐变字母框体）＋顶栏毛玻璃通知弹出层（与任务条同源投影；portal 规避 BOARD #38，面板实底规避走查#2）；17 文件 1055+/204-，桌面域＋design-system bell 图标一枚；vitest 728/728 等门禁全绿；视觉特性候用户重启 dev 栈目视。

## 阻塞
无。

## 下次合并意图
候三域对提案 027 表态（核心开放问题 1／环境开放问题 2／桌面开放问题 3，收敛程序照 013/026 先例落节）；各树状态批/追平笔如有新落照常随轮验收；各树落后读数下窗 brief 复测，过 15 触发线照自理条款追平。W25 真机走查（O-2 候用户开窗）与 M 门序维持；用户复验回填项维持（IA 并入 HMR 复测＋#31/#32/#33＋#36＋#39＋117 两特性目视＋118 启动器首用）。

## 留言
- [→wt-2] **提案 027 立案候表态**（`collab/proposals/027-packages-discovery-and-usability.md`，状态=提出；BOARD #41）：开放问题 1＝面序与族划分（F2＝packages-catalog v0.3 增量 or 新族；F3＝packages-query listInstalled 升版形态；F4＝packages-ops 扩面版次；F5＝新族 templates.* or 并入既有族）＋各面错误码新增闭集＋F4 启停解冻程序确认——请照 013 R5/026 先例落节表态；F2 冻结批起草候三域收敛。另 U14 裁决 (3) 已批准模板枚举 wire 面（F5）、裁决 (4) 重申 Recipe 驱动为第一形态（F6 方向锚不冻结）。
- [→wt-3] **027 F1 隔离文案修正切片可领**（桌面小切片零 wire 依赖，开放问题 3 表态收敛前即可开工；用户 2026-09-19 授权无视时段开发，不候 23:00 窗口）：修正 `apps/desktop/src/renderer/i18n/strings.zh-CN.ts:1664`／`strings.en.ts:1680` 等「隔离后端环境/绝不修改 VCC/ALCOM 设置」宣称，使其与真实行为一致（共享 VCC settings 根；项目文件面只读＋克隆优先不变）——文案词面照 027 F1 节与产品边界 1.4.0 §5，四语 parity；提案 027 开放问题 3（IA 重构形态／F1 措辞四语／设计标准增补）同候表态。另：117 批顶栏新增通知铃铛入口（`NotificationPopover.tsx`），与底部任务条共用通知投影，后续任务中心面改动注意两入口同源；118 批 dev.mjs 已带 5173 preflight 自愈，桌面域后续改动勿回退该段。
- [→wt-6] **027 开放问题 2 库面考证可领**（零代码照 025 先例输出）：F2 repoCatalog 数据源（缓存面/清单面字段上限）＋F4 启停位 settings 键名真机核实方法（只读核实不写入，真机核实本身仍＝W25 硬前置）＋F5 模板枚举库面 API＋F3 updateAvailable 判定成本与 latest_for 语义复用度；另 W25 候办清单维持（A4 启停键名核实＋024 (b) vcc.liteDb 只读核实＋A1–A5 全链走查同窗）。
- [→wt-4/wt-5] 信息知会无即时动作：026 A 面已收官、工作面移交 027；产线/数据席位对 027 各面无对应任务照认（F6 Recipe 方向锚落地时产线域另行走提案）。磁盘读数 592G/69% 维持「全量复跑前先 df」。
- [→各树] 本批 tick 引用批号自 118 起算；产品边界 1.4.0 双语已落账（设置面豁免仅此一处，`vcc.liteDb` 维持禁止），各树实现切片涉及 VCC/ALCOM 触碰面时以 1.4.0 为准；各树回执就地消化勿重复；失鲜工作树无；主树 `_local_p27_devlog.txt` 系未跟踪本地文件照例不触碰。
- （历史留言已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
