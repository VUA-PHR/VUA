# 生产证据条目协议 v0.1（兼容/缺失证据模型，W23）

[English](production-evidence-v0.1_EN.md) | [简体中文](production-evidence-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结**（2026-09-08，proposal 011 收敛互审；存储实现随 W20 实现切片）
> 机器可读词表：`schemas/production-evidence/v0.1/`（Schema＋正负例向量；消费测试
> `crates/acquisition/tests/production_evidence_contract.rs`——含与已冻结
> `schemas/recipe/v0.3/local-resolution.schema.json` 的跨词表真实互证）
> 范围：生产准备与执行过程中发现的缺失/不满足事实的诚实证据条目
> 所有权边界：`docs/architecture/bdl_ZH.md`（BDL 不收纳生产编排文档——数据侧
> 011 表态①）；证据本体持久化随 AMF 生产持久域（核心 W20 冻结切片定义形态）
> 更新：2026-09-08

## 语义

- **一条证据＝一份文档**：`{ schemaVersion, evidenceId, kind, subject,
  observedAt, detail, sourceRef, resolution }`。
- **kind 闭集**（v0.1）：`missing_asset`（Recipe 引用素材缺失）／
  `missing_package`（声明依赖包缺失）／`version_mismatch`（Unity/包版本与
  约束或锁不符）／`guard_denied`（服务端守卫拒绝，拒绝本身即证据）。
- **身份**：`evidenceId` 为 uuid v7（与 recipe v0.3 词表身份惯例同构）；
  Local Resolution 文档的 `assetResolution.evidenceIds[]` 引用之——
  **引用不复制**：诚实细节（detail）只活在证据本体，解析/记录面绝不内联。
- **sourceRef**：至少一个产生上下文（`localResolutionId` 或任务
  `taskCorrelation`）——无产生上下文的证据不可准入。
- **resolution 生命周期**：`null`＝未解决（证据成立）；附加
  `{ resolvedAt, resolutionRef, note? }`＝事实后被满足——解决**不改写**
  观测内容，只追加解决引用。

## 产生方与消费方

- 产生方：Local Resolution（解析缺失/版本不符）、任务守卫（拒绝证据）；
- 消费方：Local Resolution 文档（`evidenceIds[]`）、Build Record 证据摘要
  （W22：`evidenceSummary.evidenceIds`，同为身份引用）、桌面呈现；
- **Record 冻结不等本词表**（proposal 012 收口决议）：`evidenceIds` 是开放
  string 身份，Record 词表不消费证据本体形状。

## 与 BDL 的边界

BDL（bdl v0.1）不收纳生产证据——其准入规则是素材获取观察事实（011 数据
表态①）。证据本体持久化在 AMF 生产持久域（形态随 W20 实现切片）。

## 稳定错误码

本协议无命令面，无新增错误码；证据产生方的失败语义随其所属命令/任务协议
（如 bdl-commands v0.3、production-use-case v0.2）。
