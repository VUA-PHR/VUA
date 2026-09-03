# VUA Catalog Risk Gate v1 / VUA 目录风险门 v1

> Status / 状态: Accepted / 已接受  
> Rule ID / 规则 ID: `vua.risk-gate/v1`  
> Scope / 范围: `core / plugin / external` catalog entries / 目录条目  
> Normative effect / 规范效力: Derives release risk and blocks incomplete entries / 派生发布风险并阻断不完整条目

## Gate algorithm / 门禁算法

Before an entry becomes `supported` or is included in a release, the gate:

1. validates the v3 schema, category, capabilities, distribution, and bilingual behavior description;
2. compares declared capabilities with described data flow, permissions, side effects, and reviewed implementation;
3. blocks missing, unknown, ambiguous, or under-declared capabilities with `risk: pending`;
4. evaluates every matching rule and selects the highest level;
5. writes or verifies `risk` and `risk_rule`; a contributor-supplied mismatch fails the gate;
6. checks the warning, confirmation, refusal-test, rollback, and approval evidence required by that level.

条目进入 `supported` 或被纳入发行前，门禁按以下顺序执行：

1. 校验 v3 Schema、分类、能力、分发方式和双语行为说明；
2. 对照能力声明、正文数据流、权限、副作用和经过评审的实现，检查是否少报能力；
3. 缺失、未知、含糊或少报能力时标记 `risk: pending` 并阻断；
4. 计算全部命中规则并取最高等级；
5. 写入或核验 `risk` 与 `risk_rule`，作者填写结果不一致即失败；
6. 核验该等级要求的警告、确认、拒绝测试、恢复与批准证据。

## Derived rules / 派生规则

| Level / 等级 | Matching behavior / 命中行为 | Required release evidence / 发布证据 |
| --- | --- | --- |
| High / 高 | Process termination; elevation; security or anti-cheat interaction; credential/session/private-order access; arbitrary code execution; irreversible or broadly scoped system/project mutation / 终止进程；提权；接触安全或反作弊；凭据、会话或私有订单；任意代码执行；不可逆或宽范围系统/项目修改 | Dedicated warning, explicit confirmation per dangerous action, tested refusal and safe default, security-owner approval / 专门警告、每次危险动作明确确认、拒绝与安全默认测试、安全责任人批准 |
| Medium / 中 | Scoped reversible writes; official installer launch; device/audio/screen input; user data sent to a service; external runtime connection/control; non-trivial Unity/project transformation / 有范围且可恢复写入；启动官方安装器；设备、音频或屏幕输入；向服务发送用户数据；连接或控制外部运行时；非平凡 Unity/项目变换 | Permission disclosure, cancellation/degradation test, data and rollback review / 权限说明、取消与降级测试、数据与恢复评审 |
| Low / 低 | Read-only public metadata/status or presentation-only behavior with no private content, system mutation, external data transmission, or privileged capability / 只读公开元数据/状态，或不接触私有内容、不修改系统、不外传数据且无特权能力的纯表现行为 | Boundary test and ordinary review / 边界测试与普通评审 |

Boundary never lowers risk. External software can still be medium or high because the field describes
user and release risk, not only VUA authority. When evidence matches no known rule, the result is
`pending`, not `low`.

所属 `core / plugin / external` 边界不能降低风险。External 软件仍可能是中高风险，因为该字段描述
用户与发行风险，不只描述 VUA 权限。证据无法命中已知规则时，结果是 `pending`，而不是 `low`。

## Current derived examples / 当前派生示例

- EAC residual-process recovery is **high** because it can terminate a process and interacts with an
  anti-cheat recovery scenario.
- Environment deployment is **medium** because it may launch installers and perform confirmed scoped changes.
- Live translation and voice changing are **medium** because they may send selected text or access audio devices.
- VUA skins are **low** only while limited to validated presentation tokens/assets with no code execution.

- EAC 残留进程恢复因终止进程并接触反作弊恢复场景，被派生为 **高风险**；
- 环境部署因可能启动安装器并执行经确认的有限修改，被派生为 **中风险**；
- 实时翻译与变声器因可能发送选中文本或访问音频设备，被派生为 **中风险**；
- VUA 皮肤只有在限定为已验证表现 Token/素材且不能执行代码时，才派生为 **低风险**。
