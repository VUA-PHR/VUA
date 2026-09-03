---
catalog_schema: "vua.tool-entry/v3"
id: "plugin.vua-skins"
boundary: "plugin"
status: "proposed"
risk: "low"
risk_rule: "vua.risk-gate/v1"
delivery: "unscheduled"
maintainer: "community"
distribution: "plugin-package"
platforms: ["windows"]
capabilities: ["theme.tokens", "theme.assets"]
---

# VUA Skins / VUA 皮肤

## 中文

通过受限主题 Token 与静态资源定制外观。皮肤不得携带脚本、远程 HTML、Node 能力、任意 CSS
注入、网络访问或业务状态修改。宿主校验格式、资源大小、对比度、焦点、缩放和安全回退；不兼容或
卸载时恢复内置主题。

## English

Customize appearance through bounded theme tokens and static assets. Skins carry no scripts, remote
HTML, Node capability, arbitrary CSS injection, network access, or business-state mutation. The host
validates format, asset size, contrast, focus, zoom, and safe fallback; incompatibility or removal
restores a core-provided theme.
