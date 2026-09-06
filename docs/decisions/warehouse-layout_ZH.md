# Warehouse 布局与素材导入裁决

[English](warehouse-layout_EN.md) | [简体中文](warehouse-layout_ZH.md)

> 状态：已接受——产品所有者裁决（2026-09-06）
> 范围：B4 Warehouse 物理布局、导入语义与产物模式设置
> 规范效力：约束 BDL Warehouse 表的物理语义、素材导入功能面与设置项；映射层定义见
> `schemas/bdl/v0.1/schema.sql`
> 裁决背景：下载事件协议 v0.1 草案（`docs/protocols/download-events-v0.1_ZH.md`）的开放项

## 裁决

1. **根位置：默认跟随数据目录，对用户可更改。** Warehouse 根目录默认由统一路径解析器
   给出（跟随 Data Profile：installed 走 `%LOCALAPPDATA%\VUA\<渠道>\<profile>\warehouse`，
   portable 走 `<portable-root>\Data\warehouse`），并在设置中作为**可更改字段**开放给
   用户。设置更改后既有条目的搬移/重扫描行为是实现细节（见开放注记），不阻塞 B4。

2. **语义目录树，不做素材去重。** 仓库以素材包为单位组织：每个素材包一个文件夹。
   同一内容的素材出现多份是合法状态——用户想下载两份哪怕一百份同样的素材自有其道理，
   VUA 不去重、不合并。相应地，BDL schema 拆分两层：**检查事实按内容**（`sha256` 键的
   `local_artifacts`，检查状态/大小等对同内容幂等）与**物理副本按条目**（`artifact_copies`：
   副本 ID、所属素材包、条目内相对路径、绝对路径）。同内容的来源关联事实
   （`artifact_mappings`）保持按内容幂等，不随副本数量变化。

3. **可浏览性：用户不翻磁盘。** 仓库由 VUA 自建的内容管理器浏览（既有裁定的重申）。
   旧 BDB 无真实用户，无兼容包袱——不需要为资源管理器直接浏览保留任何目录约定。

4. **导入 = 拷入，必须支持批量。** 导入把素材从原始位置**拷入**仓库（原始目录不动）。
   必须提供**批量导入**：批量选择文件夹，每个文件夹成为一个素材包条目。

5. **产物模式设置（生成 VPM vs 原始包）。** 生成的 VPM 包与素材文件夹在条目内平级。
   素材导入/下载设置界面开放选择：
   - **使用 VPM 包**（可选：生成包后删除原始文件）——映射素材入口 v0.1 的
     `local_reusable_vpm` 通道；
   - **使用原始 .unitypackage**（**默认**）——映射 `direct_unity_package` 通道。

   "生成包后删除原始文件"是破坏性选项：仅在 VPM 生成与验证**成功之后**执行，删除事实
   必须进入任务结果与回执审计，不可静默。

## 后果

- `schemas/bdl/v0.1/schema.sql` 修订（随本裁决同批提交）：引入 `artifact_copies` 表；
  `local_artifacts` 移除单一 `stored_path`；`warehouse_items` 增加条目内
  `folder_name` 唯一键；原 `warehouse_artifacts` 表取消（副本行自带所属条目）。
- 内容哈希（`sha256`）仍是检查与来源关联的幂等键；副本数量不影响来源事实。
- 下载**暂存**目录（下载事件协议的 `storedPath`）与 Warehouse 根是两个目录：前者默认
  跟随数据目录、非用户设置项；后者是用户设置项。

## 开放注记

- 根设置更改后的既有条目搬移/重扫描行为（实现期决定，不阻塞 B4 主线）；
- 批量导入的文件夹→素材包判定规则（是否依赖抽取规范的页面观察，还是纯文件系统判定）。
