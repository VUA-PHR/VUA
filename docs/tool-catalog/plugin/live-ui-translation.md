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

# Live UI Translation / 界面实时翻译

## 中文

翻译用户明确选择的 VUA/Overlay 文本表面。默认不读取凭据、私聊、Cookie、剪贴板或任意屏幕内容。
云翻译发送前说明提供方、字段、地区、保留策略与费用；本地模式声明模型和许可证。插件失败只撤下
译文，不阻断原界面。

## English

Translate user-selected VUA/overlay text surfaces. Do not read credentials, private messages,
cookies, clipboard, or arbitrary screen content by default. Cloud use discloses provider, fields,
region, retention, and cost; local mode declares model and license. Failure removes translation
without blocking the original UI.
