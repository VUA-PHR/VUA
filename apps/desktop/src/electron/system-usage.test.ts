import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  isTypeperfHeaderLine,
  parseRegistryQwMemorySize,
  parseTypeperfSampleLine,
  SystemUsageCollector,
} from "./system-usage.js";

/**
 * 系统资源占用采集的纯逻辑测试:
 * - typeperf CSV 行解析(多适配器取主导值、表头/空行/坏行如实 null);
 * - reg query qwMemorySize 输出解析(多子键取最大、十六进制、无值 null);
 * - 采集器降级路径(非 Windows 平台不启动采集,VRAM 恒 null 不猜值)。
 */

describe("parseTypeperfSampleLine", () => {
  it("takes the dominant adapter value from a CSV sample line", () => {
    const line = '"09/25/2026 17:40:00.123","1073741824","3221225472","536870912"';
    assert.equal(parseTypeperfSampleLine(line), 3221225472);
  });

  it("handles a single adapter", () => {
    assert.equal(parseTypeperfSampleLine('"t","2048"'), 2048);
  });

  it("returns null for empty, header-like and non-numeric lines", () => {
    assert.equal(parseTypeperfSampleLine(""), null);
    assert.equal(parseTypeperfSampleLine("   "), null);
    assert.equal(parseTypeperfSampleLine('"timestamp only"'), null);
    assert.equal(parseTypeperfSampleLine('"t"," ","-"'), null);
  });

  it("ignores malformed fields but keeps valid ones", () => {
    assert.equal(parseTypeperfSampleLine('"t","abc","4096"'), 4096);
  });
});

describe("isTypeperfHeaderLine", () => {
  it("recognizes the PDH-CSV header carrying the counter path", () => {
    assert.equal(
      isTypeperfHeaderLine(
        '"(PDH-CSV 4.0) (UTC)(0)","\\HOST\\GPU Adapter Memory(*)\\Dedicated Usage"',
      ),
      true,
    );
    assert.equal(isTypeperfHeaderLine('"09/25/2026 17:40:00.123","1024"'), false);
  });
});

describe("parseRegistryQwMemorySize", () => {
  it("takes the maximum qwMemorySize across adapter subkeys (hex)", () => {
    const output = [
      "HKEY_LOCAL_MACHINE\\...\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000",
      "    HardwareInformation.qwMemorySize    REG_QWORD    0x40000000",
      "",
      "HKEY_LOCAL_MACHINE\\...\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0001",
      "    HardwareInformation.qwMemorySize    REG_QWORD    0x1fb000000",
      "",
      "End of search: 2 match(es) found.",
    ].join("\r\n");
    assert.equal(parseRegistryQwMemorySize(output), 0x1fb000000);
  });

  it("returns null when no value is present", () => {
    assert.equal(parseRegistryQwMemorySize("End of search: 0 match(es) found."), null);
    assert.equal(parseRegistryQwMemorySize(""), null);
  });
});

describe("SystemUsageCollector degradation", () => {
  it("never starts VRAM collection off Windows; VRAM stays null (no guessing)", () => {
    const collector = new SystemUsageCollector({ platform: "linux" });
    collector.start();
    const snapshot = collector.snapshot();
    assert.equal(snapshot.schemaVersion, 1);
    assert.equal(snapshot.vramUsedBytes, null);
    assert.equal(snapshot.vramTotalBytes, null);
    assert.ok(snapshot.ramTotalBytes > 0);
    assert.ok(snapshot.ramUsedBytes >= 0);
    assert.ok(snapshot.ramUsedBytes <= snapshot.ramTotalBytes);
    collector.stop();
  });
});
