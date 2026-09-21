---
worktree: wt-7
branch: slice/production-review-fixes
role: 桌面
baseline_commit: a788b04
updated: 2026-09-21
---
## 当前焦点
用户授权 2026-09-21：写修复计划并安排修复，允许 VUA-7 或 VUA-8。
对象：7d702f8 与 0779db0，均已在 main。旧 wt-7 i18n 验收已完成。
计划与协调在 VUA-7；执行交已有任务“查找FBX与Unity渲染前端代码”
（01a0bb6a-fd0a-7873-b0ec-00149bdf6da4），在 VUA-8 从最新 main 建独立 slice 分支。
执行前 brief、核对工作树无占用，保留 VUA-2–6；不得在 main 改代码。
同一切片兼桌面/产线帽，跨域交集成验收，不按所有权拆开依赖链。

## 自基线交付
修复计划 v1：按三笔代码提交交付，每笔携回归，最后整体验证。
A. Unity 渲染/副作用：R1、R2。
B. Bridge 全出口回执：R3。
C. Desktop 模态/保存联动：R4、R5、R6。
实施前复核发现；不成立者用可复核证据订正，不机械修补。

| 项 | 修复要求 | 验收条件 |
| --- | --- | --- |
| R1 P1 | camera.scene 显式绑定 preview scene，检查灯光/副本/清理 | 原场景干扰物不入图、副本可见、60 帧角度变化、透明底；文件存在不等于渲染通过 |
| R2 P1 | build_preview（含 dry-run）退出全局 SaveAssets/SaveScene，保留自有产物/回执 | 合成脏材质、ScriptableObject、场景的文件字节与 dirty 状态不变；dry-run 不产图；旧 mutating 保存不回退 |
| R3 P2 | 合法 v4 命令全出口回显版本/operation，不限 Bake 内部 | 缺指纹、stale、Editor 不兼容、幂等冲突、外层/入口异常的实际序列化回执通过 v4 Schema；冻结 v1–v3 不动，不无意改变旧回执 |
| R4 P2 | 内外弹窗共享顶层关闭规则 | 重复配方确认时第一次 Esc 只取消内层，第二次关闭外层；内层遮罩也不误关父层 |
| R5 P2 | 初始焦点、Tab/Shift+Tab 循环、背景禁用、关闭焦点恢复 | 嵌套恢复父层；StrictMode/卸载/动态按钮正确；ImportPage body portal 导航条仍能退出远程浏览，不能被 inert 禁掉 |
| R6 P2 | 成功持久化回执驱动宿主配方列表及选中详情重取 | 首次保存/新修订/关弹窗后才成功均刷新；失败及单纯关闭不伪造结果；旧请求不覆盖新结果、草稿及选择语义保留 |

验证：desktop typecheck、交互/保存回归、全 desktop 测试、boundary/i18n；相关 Rust Bridge/v4 向量。
UI 用真实 DOM/浏览器验证焦点与嵌套，不以源码字符串匹配代替。
Unity EditMode 用合成对象覆盖渲染隔离、脏资源与回执；仅本地留真机产物，禁止提交用户项目/付费资产/日志。
找不到可用 Unity 环境时仍完成代码与可运行测试，明确列出真机待验，禁止声称端到端通过。
不干扰运行中开发栈，不清理其 dist；构建/泄漏扫描使用独立临时输出或确认无占用后执行。
范围外：桌面 build_preview 触发、真实 Gateway bakePreview 定位、正式资产读取协议、解除 DEV 门，留后续接线切片。
依据：Unity 2022.3 PreviewRenderUtility 同时移动相机对象并设置 camera.scene；SaveAssets 会保存全部脏资源。
https://github.com/Unity-Technologies/UnityCsReference/blob/2022.3/Editor/Mono/Inspector/PreviewRenderUtility.cs
https://docs.unity3d.com/2022.3/Documentation/ScriptReference/AssetDatabase.SaveAssets.html

## 阻塞
计划无阻塞；执行环境和 Unity 证据由执行者查实。
## 下次合并意图
本分支仅计划，不等于代码已修。执行者交代码提交、验证结果、collab/state/wt-8.md，请集成验收。
## 留言
- [→集成] 六项审阅修复执行在 VUA-8、协调在 VUA-7，请避让重复修复；本状态替换已完成的旧 i18n 验收请求。
- [→桌面] 本切片承接 R4–R6，保留远程导航 portal 与卸载关闭语义。
- [→产线] 本切片承接 R1–R3，冻结旧协议不动，真机证据与静态验证分开。
