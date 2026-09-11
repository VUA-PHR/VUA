/**
 * F6 检测段呈现纯函数(013 读面消费,T-B;proposal 013 冻结面 envelope
 * 强度承载——快照本体按字段存在性收窄,不复制 Schema;缺失/不可解释 =
 * null,不猜测):
 * - environmentManagers 快照 → 管理器在位呈现行(VCC/ALCOM presence、
 *   编辑器/项目计数、采集时刻);
 * - inspectProject associations → 关联标签(词表外原文呈现,诚实);
 * - lockStatus mutationStatus → 三态呈现键。
 */

export type ManagerPresence = "found" | "not_found" | "read_failed";

export interface ManagerCapabilityNarrowed {
  readonly presence: ManagerPresence;
  readonly settingsPath: string | null;
  readonly userProjectsCount: number | null;
}

/** 单个管理器能力对象收窄(Record unknown → 呈现字段);非对象/词表外
 *  presence = null(不可解释,不猜测) */
export function narrowManagerCapability(raw: unknown): ManagerCapabilityNarrowed | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const presence = record.presence;
  if (presence !== "found" && presence !== "not_found" && presence !== "read_failed") {
    return null;
  }
  const settingsPath =
    typeof record.settingsPath === "string" && record.settingsPath.length > 0
      ? record.settingsPath
      : null;
  const userProjectsCount = Array.isArray(record.userProjects)
    ? record.userProjects.length
    : null;
  return { presence, settingsPath, userProjectsCount };
}

export interface EnvironmentSnapshotNarrowed {
  readonly capturedAt: string | null;
  readonly vcc: ManagerCapabilityNarrowed | null;
  readonly alcom: ManagerCapabilityNarrowed | null;
  readonly editorsCount: number | null;
  readonly projectsCount: number | null;
}

/** environmentManagers 快照收穷:顶层字段存在性读取;本体缺失 = null */
export function narrowEnvironmentSnapshot(raw: unknown): EnvironmentSnapshotNarrowed | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  return {
    capturedAt:
      typeof record.capturedAt === "string" && record.capturedAt.length > 0
        ? record.capturedAt
        : null,
    vcc: narrowManagerCapability(record.vcc),
    alcom: narrowManagerCapability(record.alcom),
    editorsCount: Array.isArray(record.editors) ? record.editors.length : null,
    projectsCount: Array.isArray(record.projects) ? record.projects.length : null,
  };
}

/** inspectProject 关联 → 呈现标签(词表两值映射;词表外原文诚实呈现) */
export function associationLabel(
  association: unknown,
  labels: { readonly vcc: string; readonly alcom: string },
): string {
  if (association === "vcc_registered") return labels.vcc;
  if (association === "alcom_registered") return labels.alcom;
  return typeof association === "string" ? association : "";
}

/** lockStatus 三态 → 呈现键(mutationStatus 词表外 = null,不猜测) */
export function lockStatusKey(
  status: unknown,
): "lockNone" | "lockLeftover" | "lockUnreadable" | null {
  if (status === "none") return "lockNone";
  if (status === "leftover") return "lockLeftover";
  if (status === "unreadable") return "lockUnreadable";
  return null;
}

/** inspectProject 结果收窄(associations 词表外字符串过滤;词表映射由
 *  associationLabel 呈现时处理) */
export function narrowInspectAssociations(
  associations: readonly unknown[],
): readonly string[] {
  return associations.filter(
    (association: unknown): association is string =>
      typeof association === "string" && association.length > 0,
  );
}

/** vuaIdentity 三态(project-inspection v0.2 vuaIdentityFinding):absent /
 *  present{markedAt,note} / unreadable。present 的 note 字段名与
 *  project-ops v0.2 setNote 完成面一致(核心冻结注记);字段收不齐 =
 *  null(不可解释,不猜测) */
export interface VuaIdentityNarrowed {
  readonly status: "absent" | "present" | "unreadable";
  readonly markedAt: string | null;
  readonly note: string | null;
}

export function narrowVuaIdentity(raw: unknown): VuaIdentityNarrowed | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const status = record.status;
  if (status === "absent" || status === "unreadable") {
    return { status, markedAt: null, note: null };
  }
  if (status === "present") {
    const markedAt = record.markedAt;
    if (typeof markedAt !== "string" || markedAt.length === 0) return null;
    const note = record.note;
    if (note !== null && typeof note !== "string") return null;
    return { status, markedAt, note };
  }
  return null;
}

