/**
 * 目录新鲜度词表(G3 自审冻结,G13 BDB 目录端口的词汇基础)。
 *
 * 只冻结类型与枚举:目录端口签名(激活/搜索/在线回退/增量)在 G13 定义,
 * 由中台 P4 的 BDB 适配器实现;本文件确保"过期/损坏/协议不兼容"的降级
 * 语义在中台落地前已有统一表达,避免各自造词。
 */

/** 目录修订标识:三类序号/版本共同决定新鲜度 */
export interface CatalogRevision {
  /** 目录聚合更新序号(单调递增) */
  readonly catalogUpdatedSeq: number;
  /** 数据集修订号(离线包构建标识) */
  readonly datasetRevision: string;
  /** 来源数据更新序号 */
  readonly sourceUpdatedSeq: number;
}

/**
 * 目录健康状态:
 * - stale:目录已过期(有新 revision 可得,当前仍可读);
 * - corrupted:离线包损坏(校验失败,不可读);
 * - incompatible:协议不兼容(离线包格式版本超出本端可解析范围);
 * - unknown:尚未检测(诚实缺省,不猜测为 ok)。
 */
export type CatalogHealth = "unknown" | "ok" | "stale" | "corrupted" | "incompatible";

/** 目录状态快照(G13 端口视图的组成;不可变) */
export interface CatalogStatus {
  readonly health: CatalogHealth;
  readonly revision?: CatalogRevision;
}
