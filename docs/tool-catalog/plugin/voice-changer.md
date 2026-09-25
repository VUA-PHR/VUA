---
catalog_schema: "vua.tool-entry/v3"
id: "plugin.voice-changer"
boundary: "plugin"
status: "proposed"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "unscheduled"
maintainer: "community"
distribution: "plugin-package"
platforms: ["windows"]
capabilities: ["audio.input.request", "audio.output.request", "plugin.settings"]
---

# Voice Changer


Process an explicitly selected audio input in real time. Grant microphone and output devices
individually and show a persistent active indicator. Default to local processing with no raw-audio
retention. Disclose and reconfirm network processing, recording, model downloads, and commercial
licenses separately. Failure restores/bypasses to the original path and never silently retains a
device.
