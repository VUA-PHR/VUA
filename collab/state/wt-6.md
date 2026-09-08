---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: ba86cd2
updated: 2026-09-09
---
## 当前焦点
**M6 项目管理部分提前开工（用户裁决 T-A/T-B 派发）：切片已交付本树（306c9e1），
请求集成验收合并**。提案 013（项目管理命令面 wire 词表）已立，等核心表态；词表
裁决前无 wire 面、不接线。U1/006 已接受（M6 EAC 部分已获授权，仍等 M6 开窗）。
## 自基线交付（ba86cd2 后，一提交）
- 合并 main 最新（ba86cd2，M5 冻结面与执行序各批，本域零触及）；
- **T-A**（vrc-get 项目与包管理路径，环境+核心协作）：
  - `crates/project-manager/src/project_inspection.rs`：只读项目检视汇聚
    `collect_project_inspections`——管理器注册路径的发现/识别（VCC/ALCOM 关联并集）、
    Unity 版本分类、`vpm-manifest.json` 声明 dependencies/locked、`com.vrchat.*` SDK
    检测（locked 优先）、pending-mutation 标记三态（只读观察，绝不取锁）；死注册
    保留可见+警告；形状钉死 `schemas/project-inspection/v0.1/snapshot.schema.json`
    ＋2 fixtures；诚实纪律：manifest 解析失败=空列表+警告，永不虚构包条目；
  - **提案 013**（`collab/proposals/013-project-management-wire-face.md`）：项目管理
    查询面 wire 词表草案（project.listProjects/inspectProject/environmentManagers/
    lockStatus；R1 归属=环境组装+核心路由仿 catalog 先例；R5 写命令显式非目标），
    按派发要求「提案先于 wire 实现」，路由核心裁决；
- **T-B**（ALCOM/VCC 能力检测与兼容矩阵，环境+桌面协作）：
  - 检测严格按 1.2.0 允许清单（只读发现/版本/包/SDK/兼容性/环境状态+诊断；检视面
    即包/SDK/锁行的实现），零写入其注册表/数据库/设置/缓存；
  - `docs/compatibility/alcom-vcc_ZH.md`+`_EN.md` 1.0.0（REGISTRY 已登记；权威=
    product-boundary 1.2.0；检测矩阵+诚实呈现+机器可读面三节）；
  - `docs/tool-catalog/external/alcom-vcc.md` 新条目（外部边界）+ core
    environment-detection 条目更新（双语）。
- 证据（2026-09-09 本机）：workspace 全量 0 失败（含新增 12 项检视消费测试：
  schema 校验/确定性/诚实缺位/标记三态/SDK 优先级）、clippy --workspace
  --all-targets -D warnings 零告警。
## 阻塞
- 提案 013 的 R1 归属与 R2 词表待核心表态→集成仲裁（词表裁决前不冻结、不接线、
  桌面不依赖）；
- M6 EAC 部分（proposal 006）已获授权但仍等 M6 开窗（以 M5 关门为序）。
## 下次合并意图
本批（306c9e1：project-manager 本域+schemas/project-inspection 新 schema+兼容矩阵
文档+提案 013+状态）请集成 --no-ff 验收合并；合并前请复核提案 013 的「无 wire 面」
边界与本状态文件。
## 留言
- [→核心] 提案 013 请表态：R1 命令面归属（环境组装+provider-host 路由）与 R2 词表
  逐项（project.listProjects/inspectProject/environmentManagers/lockStatus）。检视
  面库级函数已交付并有 schema 钉形，裁决前不接 provider 路由；
- [→桌面] M6 呈现对接口径：读面词表/形状以
  `schemas/project-inspection/v0.1/snapshot.schema.json` 为准（camelCase、错误码
  `vua.project_inspection.*`/`vua.env_managers.*`）；wire 命令面未裁决（提案 013
  在途），请勿提前接线；检测结果的 UI 呈现按你排期，兼容矩阵文档
  `docs/compatibility/alcom-vcc_*` 可先行引用；
- [→集成] 请求验收合并本批（306c9e1）。注意两点：① schemas/project-inspection 为
  环境域新 schema（v0.1 库级 payload 面，非 wire 词表——wire 面在提案 013 待裁）；
  ② REGISTRY 新增 alcom-vcc 行（维护方=环境）。
