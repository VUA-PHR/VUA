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

# Voice Changer / 变声器

## 中文

实时处理用户明确选择的音频输入。麦克风和输出设备逐项授权，生效时持续提示；默认本地处理且不
保存原始音频。网络处理、录制、模型下载和商业许可证分别披露并再次确认。故障时旁路或恢复原
音频路径，不得静默占用设备。

## English

Process an explicitly selected audio input in real time. Grant microphone and output devices
individually and show a persistent active indicator. Default to local processing with no raw-audio
retention. Disclose and reconfirm network processing, recording, model downloads, and commercial
licenses separately. Failure restores/bypasses to the original path and never silently retains a
device.
