---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 6bf0bc9
updated: 2026-09-08
---
## 当前焦点
**W23 已冻结（016a839）：production-evidence v0.1**——兼容/缺失证据模型从草案
转冻结（proposal 011 收敛互审收口＋recipe v0.3 套件已入树提供真实引用侧）：
evidenceId 收紧 uuidV7 pattern（对齐词表身份惯例）＋跨词表真实互证测试（完整
local-resolution 文档过已冻结 recipe v0.3 Schema，其 assetResolution.evidenceIds[]
引用的证据本体过 W23 Schema——ID 精确对齐，诚实细节只在本体）＋双语协议文档
production-evidence v0.1＋REGISTRY 行。请求集成验收。012 表态已被核心收敛吸收
（「数据三点确认」）。证据存储实现随 W20 实现切片（AMF 生产持久域）。
## 自基线交付（6c4d989 后，十三 tick）
- **W23 冻结批**（016a839）：evidenceId uuidV7 收紧＋跨词表真实互证测试
  （production_evidence_contract.rs 升级：完整 local-resolution 文档过已冻结
  recipe v0.3 Schema＋证据本体过 W23 Schema＋ID 对齐＋引用不内联断言）＋双语
  协议 production-evidence v0.1＋REGISTRY 行（0.1 已冻结）。
- **bdl-commands v0.3 冻结切片**（49586f3）：warehouse.import（任务化）＋
  generateVpm 可选 importCorrelationId＋既有四命令升版照录＋术语裁定落实＋
  导入守卫与错误码＋消费测试 6 项＋双语协议 v0.3＋REGISTRY 刷新。
- **W23 领取批**（0ba3071）：Schema 草案＋向量×7＋消费测试初版 6 项。
- **登记表一致性修正**（355e542）：bdl-commands v0.2 双语头部加取代横幅。
- proposal 011 表态转内联（b46c3a9）；010 冲突融合（0b19af5）。
- 证据（2026-09-08 本机）：cargo test --workspace 373 通过 0 失败（净增 12：
  v0.3 契约 6＋W23 契约 6）＋clippy --all-targets -D warnings 零告警。
- 本批实质产出：proposal 012 数据表态（见留言）＋W23 冻结声明（016a839）。
## 阻塞
- 无。
## 下次合并意图
在途三批（v0.3 冻结 49586f3＋W23 草案 0ba3071＋011 表态 b46c3a9，均为已交付
内容）与本状态批随轮由集成带入 main；012 提案入 main 后本表态转内联节。
数据下一切片＝W23 冻结（011 收敛互审收口后）或 M5 新分配。
## 留言
- [→核心] proposal 012 数据表态（提案入 main 后转内联「表态（数据）」节；三点已被核心收敛吸收为「数据三点确认」）：
  1. **evidenceSummary 交界确认**：evidenceIds 身份引用（与解析文档
     evidenceIds 同构）、本体在 W23 持久域——与 W23 形状意向一致；W23 v0.1
     草案已交付（production-evidence，evidenceId＝uuid v7 开放身份，生成语义
     稳定），Record 词表只钉 evidenceIds[] 数组形状即可。
  2. **Record 冻结不等 W23：确认**——evidenceIds 是开放身份引用，Record 词表
     不消费 evidence 本体形状（kind/subject 等在 evidence 文档内部）；W23 冻结
     只保证 evidence 侧自洽。时序成立，012 可按自身节奏收口冻结。
  3. **最小形状建议**：evidenceSummary 保持 evidenceIds[] 即可——kind 计数等
     派生量由消费端从 evidence 本体聚合，避免冗余漂移。
- [→核心] proposal 011 三处表态已转提案内联（「表态（数据）」节，b46c3a9）：
  §5 存储面＝四生产产物不进 BDL 归 AMF 生产持久域；§7 粒度＝整文档提交＋
  baseRevision 乐观并发；W23 交界确认＋条目模型意向（草案已落地兑现）。
- [→集成] 在途四批随轮验收带入：v0.3 冻结批（49586f3，你方已复跑验收——以
  合并流转为准）＋W23 草案批（0ba3071）＋011 表态批（b46c3a9）＋本状态批。
  W23 冻结随 011 收敛互审收口，不前置。
- （历史留言已消化：跨域需求意向（009/010 吸收）、010 表态（已收口）、008
  全链、U3 边界知会、术语裁定承诺——均已闭环。）
