import type { ApplicationEventV01 } from "@vua/contracts";
import type {
  AcquireEntryDetailView,
  AcquirePort,
  AcquireView,
  WarehouseArtifact,
  WarehouseArtifactFact,
  WarehouseArtifactMode,
  WarehouseArtifactRole,
  WarehouseArtifactState,
  WarehouseEntry,
  WarehouseEntryDetail,
  WarehouseEntryKind,
} from "./acquire-port.ts";import type { GatewayClient } from "./gateway-client.ts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";

/**
 * F4-6 live 本地轨端口:createAcquire 唯一替换点。warehouse.listEntries /
 * warehouse.entryDetail(bdl-queries v0.3 冻结读取面)经 typed client →
 * Kernel 路由 → AMF/BDL 真实链路,投影为条目域类型;not-run 退路保持
 * empty-gateway 的诚实 not-connected。
 *
 * - 投影纪律(client 纪律):wire 值按字段存在性收窄;闭集词表外取值、
 *   收不齐条目必需字段的条目如实丢弃(不渲染半可信条目);可空信息字段
 *   (建议文件名/判定时刻/拒绝理由)按 null 诚实呈现;
 * - 断连语义:snapshot 失败回落 not-connected,不向上抛错(首帧由
 *   capability() 向上报告不可用,不阻断整个应用启动);订阅期间失败保留
 *   上一视图,恢复由下一次事件驱动;
 * - 刷新触发:任务生命周期事件(批量导入/下载/生成 VPM 均为任务驱动)+
 *   capability.changed 时重取权威快照;progress 与 download.intent 回执
 *   不改变条目事实,不触发重取;并发事件合并为尾随一次重取;
 * - F4-9 的模式编辑命令不在本端口(读取面保持只读)。
 */

const notConnectedView: AcquireView = { schemaVersion: 1, kind: "not-connected" };

const ARTIFACT_MODES: readonly WarehouseArtifactMode[] = [
  "use_original_unitypackage",
  "generate_vpm",
];
const ARTIFACT_ROLES: readonly WarehouseArtifactRole[] = ["original", "generated_vpm"];
const ARTIFACT_STATES: readonly WarehouseArtifactState[] = ["pending", "clean", "quarantined"];
const ENTRY_KINDS: readonly WarehouseEntryKind[] = ["imported_material", "downloaded_material"];

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** 词表收窄:词表内取值原样返回,否则 null */
function word<T extends string>(value: unknown, vocabulary: readonly T[]): T | null {
  return typeof value === "string" && (vocabulary as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function projectArtifact(value: unknown): WarehouseArtifact | null {
  const record = asRecord(value);
  if (record === null) return null;
  const artifactSha256 = asString(record.artifactSha256);
  const relativePath = asString(record.relativePath);
  const state = word(record.state, ARTIFACT_STATES);
  const role = word(record.role, ARTIFACT_ROLES);
  const sizeBytes = record.sizeBytes;
  if (
    artifactSha256 === null ||
    relativePath === null ||
    state === null ||
    role === null ||
    typeof sizeBytes !== "number" ||
    !Number.isSafeInteger(sizeBytes) ||
    sizeBytes < 0
  ) {
    return null;
  }
  return { artifactSha256, relativePath, state, role, sizeBytes };
}

/** 可空信息字段:字段缺失或词表外按 null(诚实空值),合法字符串原样保留 */
function nullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function projectArtifactFact(value: unknown): WarehouseArtifactFact | null {
  const artifact = projectArtifact(value);
  const record = asRecord(value);
  if (artifact === null || record === null) return null;
  // 结构性字段:非布尔/非数组按形态不符处理(条目丢弃,不渲染半可信事实)
  if (typeof record.sourceCorrelated !== "boolean") return null;
  if (!Array.isArray(record.mappedProductIds)) return null;
  const mappedProductIds = asArray(record.mappedProductIds).filter(
    (productId): productId is string => typeof productId === "string" && productId.length > 0,
  );
  return {
    ...artifact,
    suggestedFileName: nullableString(record, "suggestedFileName"),
    inspectedAt: nullableString(record, "inspectedAt"),
    rejectionReason: nullableString(record, "rejectionReason"),
    sourceCorrelated: record.sourceCorrelated,
    mappedProductIds,
  };
}

function projectEntry(value: unknown): WarehouseEntry | null {
  const record = asRecord(value);
  if (record === null) return null;
  const warehouseItemId = asString(record.warehouseItemId);
  const folderName = asString(record.folderName);
  const displayName = asString(record.displayName);
  const kind = word(record.kind, ENTRY_KINDS);
  const createdAt = asString(record.createdAt);
  const effectiveArtifactMode = word(record.effectiveArtifactMode, ARTIFACT_MODES);
  // artifactMode:合法闭集或显式 null(跟随全局);词表外取值按条目丢弃
  let artifactMode: WarehouseArtifactMode | null = null;
  if (record.artifactMode !== null) {
    const parsed = word(record.artifactMode, ARTIFACT_MODES);
    if (parsed === null) return null;
    artifactMode = parsed;
  }
  if (
    warehouseItemId === null ||
    folderName === null ||
    displayName === null ||
    kind === null ||
    createdAt === null ||
    effectiveArtifactMode === null
  ) {
    return null;
  }
  const artifacts: WarehouseArtifact[] = [];
  for (const raw of asArray(record.artifacts)) {
    const artifact = projectArtifact(raw);
    // 形态不齐的工件按条目丢弃,不渲染半可信条目
    if (artifact === null) return null;
    artifacts.push(artifact);
  }
  return {
    warehouseItemId,
    folderName,
    displayName,
    kind,
    createdAt,
    artifactMode,
    effectiveArtifactMode,
    artifacts,
  };
}

function projectEntryDetail(value: unknown): WarehouseEntryDetail | null {
  const record = asRecord(value);
  if (record === null) return null;
  const entry = projectEntry(record);
  if (entry === null) return null;
  const artifacts: WarehouseArtifactFact[] = [];
  for (const raw of asArray(record.artifacts)) {
    const fact = projectArtifactFact(raw);
    if (fact === null) return null;
    artifacts.push(fact);
  }
  return { ...entry, artifacts };
}

function projectEntryList(value: unknown): AcquireView | null {
  const record = asRecord(value);
  if (record === null || !Array.isArray(record.entries)) return null;
  const entries: WarehouseEntry[] = [];
  for (const raw of asArray(record.entries)) {
    const entry = projectEntry(raw);
    // 词表外/形态不齐的条目如实丢弃,不渲染半可信条目
    if (entry !== null) entries.push(entry);
  }
  return { schemaVersion: 1, kind: "entries", entries };
}

export function createLiveAcquire(client: GatewayClient): AcquirePort {
  let current: AcquireView = notConnectedView;
  const listeners = new Set<(view: AcquireView) => void>();

  const emit = () => {
    for (const listener of listeners) listener(current);
  };

  /** 权威重取:失败保留上一视图(返回 false),形态不齐按未接入处理 */
  const refresh = async (): Promise<boolean> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "warehouse.listEntries",
      params: {},
    });
    if (!result.ok) return false;
    const view = projectEntryList(result.value);
    if (view === null) return false;
    current = view;
    return true;
  };

  // 并发事件合并:进行中的重取期间只记脏标记,结束后尾随补一次
  let refreshing = false;
  let dirty = false;
  const refreshCoalesced = () => {
    if (refreshing) {
      dirty = true;
      return;
    }
    refreshing = true;
    void refresh()
      .then((ok) => {
        // 失败保留上一视图,不重复推送
        if (ok) emit();
      })
      .finally(() => {
        refreshing = false;
        if (dirty) {
          dirty = false;
          refreshCoalesced();
        }
      });
  };

  /** 条目事实由任务驱动(批量导入/下载/生成 VPM);progress 与意图回执不触发 */
  function isWarehouseMutationEvent(event: ApplicationEventV01): boolean {
    if (event.kind === "capability.changed") return true;
    if (event.kind === "download.intent") return false;
    return event.kind !== "task.progressed";
  }

  let unsubscribeEvents: Unsubscribe | null = null;

  const ensureEventSubscription = () => {
    if (unsubscribeEvents !== null) return;
    unsubscribeEvents = client.subscribe((event) => {
      if (isWarehouseMutationEvent(event)) refreshCoalesced();
    });
  };

  const releaseEventSubscription = () => {
    if (unsubscribeEvents === null) return;
    unsubscribeEvents();
    unsubscribeEvents = null;
    dirty = false;
  };

  return {
    snapshot: async () => {
      const ok = await refresh();
      return ok ? current : notConnectedView;
    },
    async entryDetail(warehouseItemId): Promise<AcquireEntryDetailView> {
      const result = await client.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "warehouse.entryDetail",
        params: { warehouseItemId },
      });
      if (result.ok) {
        const record = asRecord(result.value);
        const entry = record === null ? null : projectEntryDetail(record.entry);
        // 形态不齐按未接入处理,不渲染半可信详情
        return entry !== null
          ? { schemaVersion: 1, kind: "detail", entry }
          : { schemaVersion: 1, kind: "not-connected" };
      }
      if (
        result.error.kind === "application" &&
        result.error.error.code === "vua.warehouse.not_found"
      ) {
        return { schemaVersion: 1, kind: "not-found" };
      }
      return { schemaVersion: 1, kind: "not-connected" };
    },
    subscribe(callback) {
      listeners.add(callback);
      ensureEventSubscription();
      return () => {
        listeners.delete(callback);
        if (listeners.size === 0) releaseEventSubscription();
      };
    },
    async capability(): Promise<CapabilityReport> {
      const result = await client.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "warehouse.listEntries",
        params: {},
      });
      return result.ok
        ? { state: "ready" }
        : { state: "unavailable", detailKey: "warehouseMissing" };
    },
  };
}
