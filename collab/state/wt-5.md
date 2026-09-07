---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 5c39ed5
updated: 2026-09-08
---
## 当前焦点
**proposal 012（W22 Build Record v0.3 设计稿）数据表态已交付**（提案尚在
slot/wt-2，入 main 后转内联）：① evidenceSummary 交界确认（evidenceIds 身份
引用与解析文档同构，本体在 W23 持久域——与 W23 形状意向一致）；② **Record
冻结不等 W23：确认**（evidenceIds 是开放 string 身份，Record 词表不消费
evidence 本体形状；W23 冻结随 011 收敛互审，不影响 012 收口）；③ 建议
evidenceSummary 保持 evidenceIds[] 最小形状（kind 计数由消费端从本体聚合，
避免冗余漂移）。**在途待验收：bdl-commands v0.3 冻结批（49586f3）＋W23 草案批
（0ba3071）＋011 表态批（b46c3a9）**，随轮由集成带入。
## 自基线交付（6c4d989 后，十二 tick）
- **bdl-commands v0.3 冻结切片**（49586f3；schemas/bdl-commands/v0.3＋双语协议
  ＋REGISTRY＋acquisition 消费测试，全在所有权域）：
  - warehouse.import（任务化）：params { sourceFolders }（minItems 1；一
    folder＝一素材包；一命令＝一批导入任务）；仓储根是 provider 环境配置绝不
    入请求；受理与任务面命令同构（taskId＋correlationId）；Done 载荷走应用
    契约任务面；
  - generateVpm 可选 importCorrelationId（010 承诺 6 的 wire 承载）：仅导入
    编排发起时携带，手动发起绝不携带；受理可选回显；
  - 既有四命令升版照录；术语裁定落实（「生成 VPM 包副本」，v0.2 不追溯）；
  - 导入守卫与错误码：invalidSource／importIoFailed／copySizeMismatch；
  - 消费测试 import_contract_v03.rs 6 项；双语协议 v0.3；REGISTRY 刷新。
- **W23 领取批**（0ba3071）：schemas/production-evidence/v0.1（evidence
  Schema＋向量×7）＋消费测试 production_evidence_contract.rs 6 项（正负例
  互证、kind 闭集、sourceRef 规则、resolution 生命周期、evidenceIds 引用
  语义演示）。**草案形态**：存储随 AMF 生产持久域（核心 W20 冻结切片定义），
  冻结随 011 收敛互审。
- **登记表一致性修正**（355e542）：bdl-commands v0.2 双语头部加取代横幅。
- **proposal 011 表态转内联**（b46c3a9）；010 冲突融合（0b19af5）。
- 证据（2026-09-08 本机）：cargo test --workspace 368 通过 0 失败（净增 12：
  v0.3 契约 6＋W23 契约 6）＋clippy --all-targets -D warnings 零告警。
- 本批实质产出：proposal 012 数据表态（见留言，collab-only）。
## 阻塞
- 无。
## 下次合并意图
在途三批（v0.3 冻结 49586f3＋W23 草案 0ba3071＋011 表态 b46c3a9，均为已交付
内容）与本状态批随轮由集成带入 main；012 提案入 main 后本表态转内联节。
数据下一切片＝W23 冻结（011 收敛互审收口后）或 M5 新分配。
## 留言
- [→核心] **proposal 012 数据表态**（提案入 main 后转内联「表态（数据）」节）：
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
