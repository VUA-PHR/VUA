import type { InspectionEvidenceDocumentV01, InspectionListEntryV01 } from "@vua/contracts";

export type { InspectionEvidenceDocumentV01, InspectionListEntryV01 } from "@vua/contracts";

/**
 * Inspection 读面端口(M7 检查切片消费批):检查页经此消费
 * inspection-queries v0.1 读面(016 仲裁独立词表行;数据草案面＋核心实现批
 * 已入 main)。端口按领域划分不按页面划分(G3),实现可整体替换
 * (live / not-run / DEV fixture)。
 *
 * requestRun 任务化写命令不入桌面词表:avatarGlobalObjectId 是 Unity 场景内
 * 对象身份,桌面无该事实源——登记而不消费即悬空面(016 核心表态 3 同构
 * 纪律),候对象选择面事实源提案后随真实消费批办理。
 */

/** 证据链列表视图:
 * - available:身份摘要行原样透传(performedAt 降序最新在前;摘要行刻意窄,
 *   无 dimensions/checks——细节经 get 到证据本体,引用不复制,012 纪律);
 * - not-connected:检查读面未接线(vua.inspection.unavailable)的诚实缺席,
 *   绝不以空列表伪装。 */
export type InspectionListView =
  | { readonly schemaVersion: 1; readonly kind: "not-connected" }
  | {
      readonly schemaVersion: 1;
      readonly kind: "available";
      readonly total: number;
      readonly entries: readonly InspectionListEntryV01[];
    };

/** 单证据束详情视图:
 * - available:证据束文档本体原样透传(转抄不解释;overallStatus 聚合与
 *   维状态语义在 schema,渲染层不重推导);
 * - missing:vua.inspection.not_found——正常查询无果(该 inspectionId 无
 *   证据文档),诚实空态非错误;
 * - not-connected:检查读面未接线,诚实缺席。 */
export type InspectionDetailView =
  | { readonly schemaVersion: 1; readonly kind: "not-connected" }
  | { readonly schemaVersion: 1; readonly kind: "missing" }
  | {
      readonly schemaVersion: 1;
      readonly kind: "available";
      readonly document: InspectionEvidenceDocumentV01;
    };

/** list 可选闭集过滤(词表闭集:avatarRef 精确匹配/overallStatus 聚合闭集
 *  pass|warn|fail/limit 1..200/offset≥0);守卫在 contracts 信封层,端口
 *  只透传 */
export interface InspectionListQuery {
  readonly avatarRef?: string;
  readonly overallStatus?: "pass" | "warn" | "fail";
  readonly limit?: number;
  readonly offset?: number;
}

export interface InspectionPort {
  list(params?: InspectionListQuery): Promise<InspectionListView>;
  get(inspectionId: string): Promise<InspectionDetailView>;
}
