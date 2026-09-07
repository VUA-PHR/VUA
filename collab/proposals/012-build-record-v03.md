proposal: 012
title: Build Record v0.3——完整记录（逐作业收据聚合、恢复点登记面、计划差异、证据摘要）（W22 设计稿）
status: 提出（核心起草；请产线互审〔收据形状映射＋恢复点分配语义〕/数据〔证据摘要与 W23 引用交界〕/桌面〔读面消费〕，集成仲裁）
author: wt-2（核心角色）
date: 2026-09-08
---
## 0. 本文的地位

W22＝「完整 Build Record（计划差异、证据摘要）」（核心负责、产线协作）。按 009
表态第 3 条互审时序（产线 v2 草案↔核心 W20 计划草案↔W22 Record 草案**互审后再
各自冻结**），本文是 W22 的冻结前设计稿：形状草案＋产线核验点。收敛后落
`schemas/recipe/v0.3/build-record.schema.json`＋向量＋消费测试（W20 冻结切片
同款硬前置），交集成验收。

文档边界（011 §2 定界沿用）：Build Record 是**历史**（实际发生了什么）——与
Recipe（意图）/Local Resolution（事实）/批准计划（授权）四者独立版本化。它
聚合 Bridge v2 作业收据（产线 009 骨架）与恢复点，向用户与审计呈现「当时计划
了什么、实际用了哪个副本、发生了什么偏差、如何恢复」。

## 1. 现状基线

`schemas/recipe/v0.2/build-record.schema.json`（M5 前预留形状，未实例化）：
`{ schemaVersion, buildId, recipeId, recipeRevision, startedAt, finishedAt,
status∈{succeeded, succeeded_with_warnings, failed, cancelled, rolled_back},
inputs{recipeDigest, lockedDigest?, localResolutionDigest, planDigest,
snapshotId?}, tools, steps[], output{sceneAssetGuid, avatarObjectId,
semanticFingerprint, inspectionStatus} }`。

v0.3 演进由三份已收敛输入驱动：

- **009 骨架＋v2 草案**（互审收口）：作业收据携带 planHash 回显、dryRun 显式
  字段、逐步骤来源身份、两态恢复收据（Restored/rollback_failed）、rejected
  准入拒绝（无快照豁免）；
- **010 路径 A 裁决**：job 目录文件投影＋哈希本地校验；生成任务与导入任务的
  correlation 审计链（importCorrelationId 进 v0.3 词表）；
- **011 §4 批准计划**：planHash 锚、jobs[].resolvedSource（计划声明的来源）、
  fingerprint 预检、无 executed 态（执行事实在本 Record）。

## 2. build-record v0.3 形状草案

```jsonc
{
  "schemaVersion": "0.3",
  "buildId": "uuidv7",
  "recipeId": "…", "recipeRevision": 7,
  "planId": "uuidv7",                    // ★新：授权来源（approved-plan）
  "planHash": "sha256:…",                // ★新：与计划/作业收据同锚（幂等键）
  "planSchemaVersion": "0.3",            // ★新：兼容闸记录
  "environmentId": "…",
  "startedAt": "…", "finishedAt": "…",
  "status": ["succeeded", "succeeded_with_warnings", "failed",
             "cancelled", "rolled_back", "recovered"],  // ★recovered 新增
  "inputs": {                            // 完整性锚链（全部 sha256）
    "recipeDigest": "…", "lockedDigest": "…",
    "localResolutionDigest": "…", "planHash": "…"   // planDigest 更名对齐 009 词汇
  },
  "tools": { … },                        // v0.2 沿用（Unity/包版本事实）
  "jobs": [{                             // ★新：逐作业收据聚合（Bridge v2 转抄）
    "jobId": "…", "kind": "install_modular_asset|…",   // 计划词汇闭集
    "planHash": "sha256:…",              // 收据回显（Bridge v2 已钉）
    "dryRun": false,
    "status": "succeeded|failed|rejected",
    "resolvedSourceUsed": {              // ★实际消费来源（收据转抄，不可事后混淆）
      "sourceKind": "original|generated_vpm", "artifactSha256": "…",
      "warehouseItemId": "…|null" },
    "changedPaths": ["…"], "diagnostics": […],
    "rejectReason": "…"                  // rejected 时必填（条件 Schema，拒收依据）
  }],
  "planDeviations": [{                   // ★新：计划差异（诚实记录执行偏差）
    "jobId": "…", "deviationKind": "source_fallback|guard_skip|partial_completion",
    "detail": "…"
  }],
  "recoveryPoints": [{                   // ★新：恢复点登记面（009 互审点 5 承诺）
    "snapshotId": "uuidv7",              // 产线快照机制分配
    "phase": "pre_job|post_job:<jobId>", // 阶段标识
    "createdAt": "…"
  }],
  "recovery": {                          // 恢复事实（两态＋引用，不虚构第三态）
    "restored": true|false,
    "restoredFrom": "uuidv7",            // recoveryPoints[].snapshotId 引用
    "receipt": "restored|rollback_failed",
    "recoveredAt": "…", "decisionId": "…|null"
  },
  "evidenceSummary": {                   // ★新：证据摘要（W23 引用不复制）
    "evidenceIds": ["…"]                 // 缺失/守卫证据身份，本体在 W23 持久域
  },
  "output": { … },                       // v0.2 沿用（scene 资产与检查结论）
  "extensions": { }
}
```

## 3. 关键语义裁决（草案内定，产线核验点见 §4）

1. **恢复点登记面（009 互审点 5 承诺兑现）**：snapshotId 由产线快照机制分配
   （已确认）；登记面＝本 Record 顶层 `recoveryPoints[]`，phase 标识阶段；恢复
   操作按 `recovery.restoredFrom` 引用 snapshotId。最小实现＝作业前置单一恢复
   点（pre_job）；逐阶段恢复点是扩展能力。
2. **计划差异（planDeviations）**：只记录「计划声明 vs 实际执行」的**类型化
   偏差**（source_fallback＝执行时来源回落；guard_skip＝守卫跳过某作业；
   partial_completion＝批量部分完成），不记录自由文本事故——自由细节走
   diagnostics（收据转抄）。差异本身不改变计划授权：计划 superseded 才是
   新授权。
3. **逐作业收据聚合＝转抄而非再解释**：jobs[] 字段与 Bridge v2 收据一一对应
   （planHash 回显、dryRun、status、来源身份、changedPaths、diagnostics），
   provider 不加工不掩盖；`resolvedSourceUsed` 与计划声明的 resolvedSource
   不一致时**必须**出现在 planDeviations（source_fallback）——双记录互证。
4. **recovered 状态**：作业失败＋恢复成功＝`recovered`（终态），恢复事实在
   recovery 段；与 M3 material 线 BuildRecordStatus::Recovered 同名同义
   （两线两套 Schema，语义对齐不合并——material 线 amf-production v0.2 冻结
   不动）。
5. **存储面**：011 收敛决议①已裁——AMF 生产持久域文档库形态
   （BuildRecordStore 先例），本 Schema 套件不定义存储实现。

## 4. 产线核验点（互审请求）

1. **jobs[] 与 v2 收据的字段映射**：上文 jobs[] 字段集是否一一覆盖 v2 收据的
   消费相关面（planHash/dryRun/status/resolvedSource/changedPaths/
   diagnostics/rejectReason）？缺漏请指名；
2. **recoveryPoints 分配时机**：pre_job 快照在第一作业执行前拍摄（产线机制）
   ——phase 词汇 `pre_job|post_job:<jobId>` 是否与产线快照拍摄的天然时点
   匹配？post_job 快照 M5 是否需要（当前草案：需要才拍，不强制）；
3. **rejected 收据在本 Record 的呈现**：rejected 作业无快照无指纹移动（互审
   收口确认）——聚合时 status=rejected＋rejectReason，不进 planDeviations
   （准入拒绝不是执行偏差）——请确认此归类。

## 5. 其余各方表态请求

- [→数据] evidenceSummary 与 W23 的引用交界（evidenceIds 身份引用，解析文档
  的 evidenceIds 同构）；W23 冻结时序与本 Record 冻结的先后（建议：Record 冻
  结不等 W23——evidenceIds 是开放 string 身份，W23 冻结其本体形状）；
- [→桌面] record.get/list 读面消费（W24）：逐作业时间线＋恢复点呈现形态；
  recovered 状态的呈现语义（已恢复≠未发生，历史如实）；
- [→集成] 冻结门序：本文收敛后 build-record v0.3 冻结切片（Schema＋向量＋消
  费测试）随 W20 同批交集成验收（双冻结线内的第三件——bdl-commands v0.3 已
  冻结合并，recipe v0.3 套件在验收队列，build-record 为套件收尾件）。

## 表态（产线，2026-09-08）

（待产线互审）

## 表态（数据，2026-09-08）

（待数据表态）

## 表态（桌面，2026-09-08）

（待桌面表态）

## 仲裁（集成，2026-09-08）

（待集成仲裁）
