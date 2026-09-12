/**
 * Inspection 读面 live 端口(M7 检查切片消费批):经 Desktop Gateway 消费
 * inspection-queries v0.1 读面。消费纪律:
 * - 诚实缺席:读面未接线(vua.inspection.unavailable)映射为 not-connected
 *   形态,绝不以空列表/空详情伪装(空态即终态);get 无此文档
 *   (vua.inspection.not_found)是正常查询无果,映射 missing 空态非错误;
 * - 传输/信封失败如实上抛(页面呈现失败＋重试),不折叠为空态;
 * - 响应窄化照双键纪律:list 以 total＋entries＋schemaVersion==="0.1" 三键
 *   组合窄化(schemaVersion:"0.1" 在应用契约联合中唯一属于
 *   inspection-queries v0.1 面),get 以 inspectionDocument 键窄化(联合中
 *   唯一)——零字段猜测,形状不符诚实失败。
 */
import type { InspectionListResultV01, InspectionGetResultV01 } from "@vua/contracts";
import type { GatewayClient } from "../../gateway/index.ts";
import type {
  InspectionDetailView,
  InspectionListQuery,
  InspectionListView,
  InspectionPort,
} from "./inspection-port.ts";

function isInspectionListResult(value: object): value is InspectionListResultV01 {
  if (!("total" in value) || !("entries" in value) || !("schemaVersion" in value)) return false;
  const candidate = value as InspectionListResultV01;
  return typeof candidate.total === "number"
    && Array.isArray(candidate.entries)
    && candidate.schemaVersion === "0.1";
}

function isInspectionGetResult(value: object): value is InspectionGetResultV01 {
  if (!("inspectionDocument" in value)) return false;
  const candidate = value as InspectionGetResultV01;
  return typeof candidate.inspectionDocument === "object"
    && candidate.inspectionDocument !== null;
}

export function createLiveInspectionPort(client: GatewayClient): InspectionPort {
  const list = async (params: InspectionListQuery = {}): Promise<InspectionListView> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "inspection.list",
      params,
    });
    if (!result.ok) {
      if (
        result.error.kind === "application"
        && result.error.error.code === "vua.inspection.unavailable"
      ) {
        return { schemaVersion: 1, kind: "not-connected" };
      }
      throw new Error("inspection_list_unavailable");
    }
    if (typeof result.value !== "object" || result.value === null || !isInspectionListResult(result.value)) {
      throw new Error("inspection_list_unavailable");
    }
    return {
      schemaVersion: 1,
      kind: "available",
      total: result.value.total,
      entries: result.value.entries,
    };
  };

  const get = async (inspectionId: string): Promise<InspectionDetailView> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "inspection.get",
      params: { inspectionId },
    });
    if (!result.ok) {
      if (result.error.kind === "application") {
        if (result.error.error.code === "vua.inspection.unavailable") {
          return { schemaVersion: 1, kind: "not-connected" };
        }
        if (result.error.error.code === "vua.inspection.not_found") {
          return { schemaVersion: 1, kind: "missing" };
        }
      }
      throw new Error("inspection_get_unavailable");
    }
    if (typeof result.value !== "object" || result.value === null || !isInspectionGetResult(result.value)) {
      throw new Error("inspection_get_unavailable");
    }
    return { schemaVersion: 1, kind: "available", document: result.value.inspectionDocument };
  };

  return { list, get };
}
