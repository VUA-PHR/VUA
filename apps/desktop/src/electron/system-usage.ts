import { execFile, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import os from "node:os";
import type { SystemResourceUsageV1 } from "@vua/contracts";

/**
 * 系统资源占用采集(2026-09-25 用户裁决:顶栏占用查看器):
 * - RAM:os 模块直接读,恒在场;
 * - VRAM(仅 Windows):总量读显卡注册表 qwMemorySize(64 位,WMI
 *   AdapterRAM 在 >4GB 时截断不可靠),已用读 GPU 性能计数器
 *   \GPU Adapter Memory(*)\Dedicated Usage——经常驻 typeperf 子进程
 *   连续采样(避免每次采样都付出进程启动成本),多适配器取主导值;
 * - 诚实口径:任一采集路径不可用即对应字段 null,绝不猜值、绝不
 *   回退旧读数冒充当前;非 Windows 平台 VRAM 恒 null。
 * 采集自身开销:一个 typeperf 常驻进程(2s 采样间隔)+ 一次性注册表查询。
 */

/** typeperf 采样间隔(秒):顶栏数字与弹层共读的缓存新鲜度 */
export const VRAM_SAMPLE_INTERVAL_SECONDS = 2;
/** typeperf 意外退出后的重试延迟(ms):计数器偶发不可用不等于永久缺席 */
export const VRAM_RESPAWN_DELAY_MS = 30_000;

const GPU_MEMORY_COUNTER = "\\GPU Adapter Memory(*)\\Dedicated Usage";
const GPU_CLASS_REGISTRY_KEY =
  "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}";

/**
 * 解析 typeperf CSV 采样行:首列为时间戳,其余为各适配器计数器值(字节);
 * 取各适配器中的最大值(主导 GPU 口径)。表头行/空行/无数值行返回 null。
 */
export function parseTypeperfSampleLine(line: string): number | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  const fields = trimmed.split(",");
  // 跳过首列时间戳;数值字段带引号,形如 "12345678" 或 " "
  let max: number | null = null;
  for (const field of fields.slice(1)) {
    // 去引号后再 trim:空白字段(如 " ")Number 会强转为 0,必须先排除
    const text = field.trim().replace(/^"|"$/g, "").trim();
    if (text.length === 0) continue;
    const value = Number(text);
    if (!Number.isFinite(value) || value < 0) continue;
    if (max === null || value > max) max = value;
  }
  return max;
}

/** 识别 typeperf 表头行(PDH-CSV 版本行,含计数器路径而非读数) */
export function isTypeperfHeaderLine(line: string): boolean {
  return line.includes(GPU_MEMORY_COUNTER.split("\\")[2] ?? "GPU Adapter Memory")
    || line.startsWith("\"(PDH-CSV");
}

/**
 * 解析 reg query qwMemorySize 输出:各子键下
 * `HardwareInformation.qwMemorySize    REG_QWORD    0x...` 行,
 * 取最大值(主导适配器);一个都解析不到返回 null。
 */
export function parseRegistryQwMemorySize(text: string): number | null {
  let max: number | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("HardwareInformation.qwMemorySize")) continue;
    const match = line.match(/REG_QWORD\s+(0x[0-9a-fA-F]+|\d+)/);
    if (!match || match[1] === undefined) continue;
    const value = match[1].startsWith("0x")
      ? Number.parseInt(match[1], 16)
      : Number.parseInt(match[1], 10);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (max === null || value > max) max = value;
  }
  return max;
}

export interface SystemUsageCollectorOptions {
  /** 平台注入(测试可模拟非 Windows 降级路径) */
  readonly platform?: NodeJS.Platform;
  /** 子进程 spawn 注入(测试不碰真进程) */
  readonly spawnImpl?: typeof spawn;
  readonly execFileImpl?: typeof execFile;
}

/**
 * 占用采集器:start 后常驻 typeperf 流式采样 VRAM 已用、一次性查询 VRAM
 * 总量;snapshot() 合并实时 RAM 与最新 VRAM 缓存。stop 幂等。
 */
export class SystemUsageCollector {
  private vramUsedBytes: number | null = null;
  private vramTotalBytes: number | null = null;
  private typeperf: ChildProcessWithoutNullStreams | null = null;
  private respawnTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private readonly platform: NodeJS.Platform;
  private readonly spawnImpl: typeof spawn;
  private readonly execFileImpl: typeof execFile;

  constructor(options: SystemUsageCollectorOptions = {}) {
    this.platform = options.platform ?? process.platform;
    this.spawnImpl = options.spawnImpl ?? spawn;
    this.execFileImpl = options.execFileImpl ?? execFile;
  }

  start(): void {
    if (this.platform !== "win32") return;
    this.refreshVramTotal();
    this.spawnTypeperf();
  }

  snapshot(): SystemResourceUsageV1 {
    const ramTotal = os.totalmem();
    return {
      schemaVersion: 1,
      ramUsedBytes: ramTotal - os.freemem(),
      ramTotalBytes: ramTotal,
      vramUsedBytes: this.vramUsedBytes,
      vramTotalBytes: this.vramTotalBytes,
      sampledAt: new Date().toISOString(),
    };
  }

  stop(): void {
    this.stopped = true;
    if (this.respawnTimer !== null) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
    this.typeperf?.kill();
    this.typeperf = null;
  }

  private refreshVramTotal(): void {
    this.execFileImpl(
      "reg",
      ["query", GPU_CLASS_REGISTRY_KEY, "/v", "HardwareInformation.qwMemorySize", "/s"],
      { encoding: "utf8", windowsHide: true },
      (error, stdout) => {
        if (error) {
          this.vramTotalBytes = null;
          return;
        }
        this.vramTotalBytes = parseRegistryQwMemorySize(String(stdout));
      },
    );
  }

  private spawnTypeperf(): void {
    if (this.stopped) return;
    let child: ChildProcessWithoutNullStreams;
    try {
      child = this.spawnImpl(
        "typeperf",
        [GPU_MEMORY_COUNTER, "-si", String(VRAM_SAMPLE_INTERVAL_SECONDS)],
        { windowsHide: true },
      ) as ChildProcessWithoutNullStreams;
    } catch {
      this.scheduleRespawn();
      return;
    }
    this.typeperf = child;
    let buffered = "";
    child.stdout.on("data", (chunk: Buffer | string) => {
      buffered += String(chunk);
      const lines = buffered.split(/\r?\n/);
      buffered = lines.pop() ?? "";
      for (const line of lines) {
        if (isTypeperfHeaderLine(line)) continue;
        const sample = parseTypeperfSampleLine(line);
        if (sample !== null) this.vramUsedBytes = sample;
      }
    });
    child.on("error", () => {
      this.vramUsedBytes = null;
      this.scheduleRespawn();
    });
    child.on("exit", () => {
      this.typeperf = null;
      if (!this.stopped) {
        this.vramUsedBytes = null;
        this.scheduleRespawn();
      }
    });
  }

  private scheduleRespawn(): void {
    if (this.stopped || this.respawnTimer !== null) return;
    this.respawnTimer = setTimeout(() => {
      this.respawnTimer = null;
      this.spawnTypeperf();
    }, VRAM_RESPAWN_DELAY_MS);
  }
}
