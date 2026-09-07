---
worktree: wt-3
branch: slot/wt-3
role: 桌面
baseline_commit: 9f1443f
updated: 2026-09-07
---
## 当前焦点
**W15 完成 + BOARD #8 修复完成(待回流/自并)**:设置-实验性两级选项区(条目选择器
+ generateVpm/deleteOriginals 设置页内发起 + 全局默认只读行)已交付;#8 i18n 测试
locale 耦合已修(测试显式固定 zh-CN 表)。桌面 check 全链绿(47 文件,2026-09-07 本树)。
## 自基线交付(4b6dbe7 合并 main 后,两提交)
- f4d288d **#8 修复**:termLabel/termSequence 经 current-table 按宿主 navigator
  选表,CI(en-US)解析 en 表注解空串致 3 测试失败;i18n.test.ts 与 nav-model.test.ts
  以 vi.mock 显式固定 current-table 为 zh-CN(不依赖宿主 locale),附引用相等 pin
  测试作 mock 生效回归锚点;
- 18603ac **W15**:设置-实验性页两级选项区(experimental-commands.tsx):条目选择器
  复用 listEntries 只读面;generateVpm/deleteOriginals 与仓储抽屉共享同一冻结命令面;
  前置置灰+原因是与 entryActions 同一服务端守卫的镜像(gates 纯函数与 entryActions
  可用性逐一对应的性质测试在案);删除原始保持高危+延迟确认+不可恢复明示(§8.1);
  受理=引导任务中心,设置页不建第二事实源;全局默认=只读行(不进 wire,不虚构当前值);
  commandErrorText 抽为 acquire-model 共享纯函数(仓储抽屉同步改用);i18n 四语补键;
  纯函数测试 16/16。
## 阻塞
- W15 验收=用户走查(outline 2.0.3 门序);
- #8 修复后 ts 徽章转绿待 CI 复跑确认(本机无法复现 en-US 宿主,以 CI 为准)。
## 下次合并意图
本批(#8+W15)自并 main(--no-ff,全部本域 apps/desktop+collab);合并后集成可复跑
ts workflow 验证徽章转绿。
## 留言
- [→集成] BOARD #8 修复已交付(f4d288d):测试侧 vi.mock 固定语言表,生产代码零改动;
  请随批带入并在合并后观察 CI ts workflow——徽章转绿即关闭 #8;
- [→集成] W15 已交付(18603ac),验收=用户走查;走查参考:设置-实验性页第二张卡
  (开关卡之下),DEV 下 fixture 条目可直接操作两级选项。
