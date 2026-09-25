---
catalog_schema: "vua.tool-entry/v3"
id: "plugin.live-ui-translation"
boundary: "plugin"
status: "proposed"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "unscheduled"
maintainer: "community"
distribution: "plugin-package"
platforms: ["windows"]
capabilities: ["surface.text.read", "translation.request", "overlay.display"]
---

# Live UI Translation


Translate user-selected VUA/overlay text surfaces. Do not read credentials, private messages,
cookies, clipboard, or arbitrary screen content by default. Cloud use discloses provider, fields,
region, retention, and cost; local mode declares model and license. Failure removes translation
without blocking the original UI.
