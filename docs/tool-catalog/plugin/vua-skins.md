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

# VUA Skins


Customize appearance through bounded theme tokens and static assets. Skins carry no scripts, remote
HTML, Node capability, arbitrary CSS injection, network access, or business-state mutation. The host
validates format, asset size, contrast, focus, zoom, and safe fallback; incompatibility or removal
restores a core-provided theme.
