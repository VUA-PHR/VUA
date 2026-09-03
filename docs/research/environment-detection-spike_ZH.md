# 环境检测 Spike

[English](environment-detection-spike_EN.md) | [简体中文](environment-detection-spike_ZH.md)

> 状态:证据已收集;结论作为 B6 规划输入
> 范围:Unity 编辑器分类、VCC/ALCOM 能力检测、项目管理器路径识别
> 更新:2026-09-04
> 规范效力:无。研究材料;支持矩阵以 `docs/compatibility/unity-editor_ZH.md` 为准。

## 目的

在 B6(项目与环境适配器)开工前、不等 B3 地关闭检测侧未知项:VUA 能否把已安装编辑器对着
支持矩阵分类?能否看到用户现有项目管理器所看到的同一批项目——只读、免管理员权限、并且
不臆造配置格式?

## 交付物

- `crates/orchestrator/src/editor_targets.rs`——版本串解析(发布类型、中国版 `c<n>` 后缀)
  与支持矩阵分类,携带稳定引导码。
- `crates/orchestrator/src/environment_managers.rs`——对已配置 VCC/ALCOM 设置根的只读探测、
  已注册项目发现(显式 `userProjects` 路径;遗留文件夹扫描兜底),以及版本化
  `EnvironmentSpikeSnapshotV01` 载荷。
- `schemas/environment-spike/v0.1/snapshot.schema.json` + 固定夹具,由契约测试钉住
  (`tests/environment_spike.rs`,9 项合成测试)。
- `examples/environment_probe.rs`——本地取证入口;其输出留在本地,并通过被忽略的手动测试
  做 Schema 校验。

## 证据(真实 Windows 机器,2026-09-04)

1. **VCC 把数据解析在 `%LOCALAPPDATA%\VRChatCreatorCompanion`**——VCC 系统级安装且正在
   运行时,文档常见的 `%APPDATA%`(Roaming)位置并不存在。观察到的 `settings.json` 键:
   `userProjects`(绝对项目路径字符串数组)、`pathToUnityExe`、`pathToUnityHub`、
   `unityEditors`、`userPackageFolders`、`userRepos`,以及 `vcc.liteDb` 存储。
2. **VUA 的包后端 `vrc-get-vpm` 0.0.16 读取同一个 LOCALAPPDATA 位置,理解 `userProjects`,
   并自行完成 LiteDB 迁移协作。** 因此 VUA 的 vrc-get 路径与 VCC 看到同一批项目,无需额外
   记账。
3. **取证机器上的探测结果**:编辑器根恰为 `2022.3.22f1`(分类 `production_target`)加两个
   迁移源 `2019.4.31f1` / `2022.3.6f1`(分类 `migration_source`);VCC 发现,注册项目 18 个,
   18 个全部带有效 `m_EditorVersion` 标记、零诊断;ALCOM 确定性 `not_found`。真实快照通过
   版本化 Schema 契约。
4. 取证机器上没有 Tuanjie 安装;`t` 发布字母映射仍是已记录的假设,且未验证任何 Tuanjie Hub
   根路径。

## Spike 收口回答

1. *精确编辑器检测能否免管理员可靠工作?* 对 Unity Hub 托管根:可以。带 `Editor` 子目录检查
   的定点枚举在取证机器上零诊断通过。根保持可注入;自定义安装位置在配置之前不可见。
2. *管理器检测可以依赖什么标识?* VCC:`settings.json` 的 `userProjects`(显式绝对路径;
   遗留 `localProjectFolders` 保留为兜底格式)。经典 Roaming 路径降级为兜底而非默认。
   ALCOM:仅存在性——其格式仍是开放问题。
3. *哪些可自动修复、哪些留在用户引导?* 观察到的所有项都不需要写操作;整个探针只读(测试中
   用指纹证明)。部署自动化(安装 Hub、编辑器、vrc-get)在 B6 设计中继续留在用户引导侧,
   不在本 Spike 范围。
4. *快照是否覆盖环境页面所需?* 在 Spike 精度上:覆盖。编辑器版本 + 分类 + 引导码、管理器
   存在性/格式/数量、逐项目路径 + 关联 + Unity 分类、诊断。面向渲染器的标题与本地化描述
   留在前端(F2),与既有 `EnvironmentCheckItemV1` 的分工一致。

## 开放问题

- `vcc.liteDb` 为单一事实源(`userProjects` 缺失)的 VCC 环境:Spike 以 unexpected-schema
  警告报告 `found`。VUA 是直接读 LiteDB,还是跟随 `vrc-get-vpm` 的视图(它已在做迁移),
  待决议。
- ALCOM 设置格式与项目注册模型;需要一台运行 ALCOM 的机器。
- Tuanjie Hub 根路径与 `t` 发布字母假设;需要真实 Tuanjie 安装。
- 取证机器上 VCC 的 `unityEditors` 数组为空;它能否用作编辑器检测的交叉校验,未验证。
- 项目发现深度:`userProjects` 是显式的,今天无需扫描;遗留文件夹扫描只读直接子目录。

## 通向 B6 的下一步

把快照形状升级为正式协议文档,把探针接入 `EnvironmentEngine` 的 create 辖区(新的稳定检查
ID),决议 LiteDB 策略,并在装有 ALCOM / Tuanjie 的机器上重跑对应探测。
