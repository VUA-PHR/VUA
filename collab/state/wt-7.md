---
worktree: wt-7
branch: slice/desktop-i18n-player-language
role: 桌面
baseline_commit: 29e972e
updated: 2026-09-20
---
## 当前焦点
用户 2026-09-20 授权的 desktop i18n 修复及追加英文/韩文审阅全部完成，解除验收暂缓，候集成。独立 VUA-7 工作树，未接管六个常驻槽位、未触碰运行中的开发栈。
## 自基线交付
- 首批实现 **2b20a48**：日文玩家术语、四语教程事实、已知诊断说明/原文保留、原生对话框语言、应用语言日期与辅助窗口同步；取消功能名强制英文前缀，品牌及内部 ID 不变；版本页使用真实构建版本。前批完整记录见 5a67531。
- 追加英韩实现 **b1fb942**（四个语言文件 502+/502-）：以具体键审阅导航/引导/素材/制作/Recipe/Release/检查/包管理/设置。英文 asset 与 Unity material 分离，清理 synthetic-vertical、recovery mutation、read face、idempotent 等内部术语；韩文统一 에셋、아바타 제작、레시피、알림 센터，修正 채택/톰브스톤/인도 等直译、夹杂中文入口、받침助词与同一概念混用。上传交接明确为准备上传，不宣称上传完成；恢复/未知/未检查语义保留；计数文案避免英文单复数错误。
- 同批四语 projectCompat.readOnlyDesc 更正已存在矛盾：原项目文件只读/克隆优先，settings.json 的订阅和本地包注册按 U14 共享可写，其余管理存储只读；不扩大原有权限或改变代码行为。
- **6a21a3c** 合并最新 main **29e972e**：吸收 027 F2/F3/F4 等协作进展；英韩两处 noticeChangesOpen 冲突保留本批自然表达及 main 新增 16 键；设计规范/REGISTRY 采用最新 **0.7.9**，保留 main 0.7.7–0.7.9 与本树预留 0.7.6 的全部规则和变更记录；修正 main 英文镜像标题/同步版本仍为 0.7.8 的漂移。契约仅经本次 git 合并对齐，零手工复制。
- **4f53811**：补审协作新到的仓库浏览/更新感知英韩六键，保留 null＝未检查、false＝当前过滤条件下无严格更新版本、缓存为空不代表线上无包等区别。
- 本追加批不改应用协议/Schema、业务逻辑或权限；商品名、路径、技术代码、第三方原始消息不猜测翻译。零付费素材或用户数据进入仓库。
## 验证与边界
- 2026-09-20 **12:59 本机 VUA-7 最终合并树**：desktop 双 tsconfig typecheck 通过；vitest **88 文件 / 788 测试全通过**；check:i18n 四语键及占位符一致；check:leak 临时 Vite 生产构建通过，**155 指纹零泄漏**。
- 最终 diff --check 通过；collab:brief 登记表 **83/83** 一致、1473 受管文本文件 **零冲突标记**。对 main 29e972e merge-tree 预检通过（tree 9dd24c6）。
- 首批 Electron 编译、boundary、forest-leak 验证沿用 5a67531 记录；本追加批未重复全 Rust release 打包、Unity 实机流程、Electron 逐屏验收，也未取得独立韩文母语审校；不宣称端到端或母语验收已通过。没有为简单文案改动添加镜像测试；复用表结构/占位符及完整 desktop 回归。
- 术语对照：https://docs.unity3d.com/kr/2022.3/Manual/Materials.html （머티리얼/셰이더）、https://docs.unity3d.com/kr/2022.3/Manual/ImportingAssets.html （에셋）、https://modular-avatar.nadena.dev/docs/intro （avatar/outfit/setup）。首批教程事实来源保留于 5a67531。
## 阻塞
无；英文/韩文追加批已收尾。
## 下次合并意图
请集成 --no-ff 合并整个 slice/desktop-i18n-player-language 分支（包含首批＋英韩追加＋两次 main 同步及本状态）。所有代码已提交，工作树干净。当前主干更新频繁，实际合并前请对最新 main 复核冲突和测试。
## 留言
- [→集成] **验收请求恢复：wt-7 i18n 全批完成**。核心实现 2b20a48＋b1fb942＋4f53811；最新 main 29e972e 已经 6a21a3c 合入并解完冲突，88/788 测试和类型/语言/生产构建/泄漏/文档检查通过。请验收整个分支并登记 BOARD；设计规范保持最新 0.7.9，预留的本批 0.7.6 变更记录已并回，无新增产品裁决。
- [→桌面] 英韩追加已完成并吸收 F2/F3 新文案；后续合并保留新键与自然措辞，特别保留未检查/无匹配更新/缓存空态区分。共享设置说明四语已与 U14 对齐；nameHint 只改显示为“レシピ/recipe 中的名字”对应英韩表达，不动 D3 自动命名及 D5 去重逻辑。
