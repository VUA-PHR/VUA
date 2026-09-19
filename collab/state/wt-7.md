---
worktree: wt-7
branch: slice/desktop-i18n-player-language
role: 桌面
baseline_commit: 76e02fa
updated: 2026-09-20
---
## 当前焦点
用户 2026-09-20 追加要求检查并修复英文、韩文；当前继续同一隔离切片，前批完成，本追加批在做。原六树均有常驻席位，本次新增 VUA-7 隔离执行；不接管 wt-3、不触碰运行中的开发栈。
## 自基线交付
- 开工登记 a6df397；实现提交 **2b20a48**（36 文件，517+/259-）。
- 日文纠正素材/材质、制作/生産、追加/採用、删除/墓碑等概念，清理恢复、检查、制作页面的内部开发用语；功能导航使用本地化名称，品牌及内部 ID 不变。用户批准的规则调整同步设计规范双语 0.7.6＋REGISTRY。
- 四语修复状态颜色、Steam 平台账号可升级/关联、加速器并非通用前置条件；清除云端目录与仅外部下载的过时说法及 BLM 官方归属误称。版本页从构建事实读取版本，不再在语言表写死 v0.3.0。
- 已知检查诊断按稳定代码提供四语说明（保留非官方估算/前置观察边界），原始消息可展开；未知码不猜测。任务恢复提示及环境失败增加本地化说明，原码保留，无任务执行或恢复行为变更。
- 原生拾取器经既有 private IPC 附带调用窗口 html lang，Main 闭集选择四语文案，未知输入回落 en；公开 VuaDesktopApi 契约无变化，远程来源校验保留。
- 日期使用应用语言并保留本机时区，异常时间原样保留；覆盖设置、部署、导入、Recipe、Release、制作链、记录与 Overlay。辅助窗口响应同源 localStorage 语言事件重载，忽略其他设置及 sessionStorage。
- 新增 8 项回归测试：四语原生对话框覆盖/异常 IPC 语言参数、日期与异常时间、已知及未知诊断、恢复说明、跨窗口语言监听和清理；同步受新术语呈现规则影响的旧断言。
## 验证与边界
- 2026-09-20 本机 VUA-7：desktop 双 tsconfig typecheck 通过；vitest **86 文件 / 761 测试通过**（最终 04:52）；check:i18n 四表键/占位符对齐；check:boundary 通过。
- Electron tsc 编译通过；Vite 生产构建通过；check:leak 最终生产重建 **155 指纹零泄漏**；check:forest-leak 通过；git diff --check 通过；REGISTRY **79/79** 一致。
- 未运行完整 Rust release 打包/Unity 实机流程，未进行 Electron 原生对话框和日文逐屏真机验收；不宣称端到端已验证。新诊断用例为合成单测，未使用真实素材。
- 翻译检查脚本仅汉字硬编码和表结构检查，其输出已明确不能代替语义/显示链路验收。第三方自由文本与未知诊断保留原文，不做猜测翻译；韩文未做母语质量验收。
- 事实核对来源：https://wiki.vrchat.com/wiki/Social 、https://help.vrchat.com/hc/en-us/articles/360062659053-I-want-to-turn-my-platform-account-through-Steam-Meta-Pico-or-Viveport-into-a-VRChat-account 、https://modular-avatar.nadena.dev/ja/docs/intro 。
## 阻塞
无。此前一次自动审批因额度无法完成，写入未执行；用户「继续」后正常重试完成。
## 下次合并意图
**追加批进行中：请暂缓合并本分支，待英文/韩文修复验收请求更新。**
候验收：slice/desktop-i18n-player-language（开工登记＋2b20a48＋本状态提交）。对 main 76e02fa 的 merge-tree 预检通过，tree 3d647b7。本树不直接合并 main；集成请在最新 main 上复核并合并，留意 wt-3 后续四语/导航同文件变更。
## 留言
- [→集成] **验收暂缓：用户追加英文/韩文修复，正在同树执行**，实现 2b20a48，86 文件 761 测试通过，构建/语言/泄漏/文档校验通过；请 --no-ff 合并整个 slice/desktop-i18n-player-language 分支并登记 BOARD。新工作树已由 brief 按状态 front-matter 正确识别；无待用户裁决项。
- [→桌面] 本次修复已候验收；保留 W25 已落库的任务身份登记、制作门和 027 设置边界。四语表、terms、少量显示调用有改动，后续合并请保留新语义，不恢复强制英文前缀或旧教程错误。
