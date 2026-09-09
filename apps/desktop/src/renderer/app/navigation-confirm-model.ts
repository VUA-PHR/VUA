import type { NavigationConfirmRequestV1 } from "@vua/contracts";

/**
 * 导航确认流(015 §12,批 B-3)的呈现纯函数:请求队列状态机——Main 侧
 * 逐次阻断式确认(A-1),渲染层队列逐条处理;作答只作用于队首;用户不答
 * =队列保持=导航不执行(无超时,诚实形态)。
 */

export type NavConfirmQueue = readonly NavigationConfirmRequestV1[];

export const emptyNavConfirmQueue: NavConfirmQueue = [];

/** 新确认请求入队(队尾;呈现恒为队首) */
export function navConfirmEnqueue(
  queue: NavConfirmQueue,
  request: NavigationConfirmRequestV1,
): NavConfirmQueue {
  if (queue.some((item) => item.confirmId === request.confirmId)) return queue;
  return [...queue, request];
}

/** 队首作答结果:被作答的确认身份与用户决定 */
export interface NavConfirmAnswered {
  readonly confirmId: string;
  readonly approved: boolean;
}

/** 队首作答:弹出并返回作答结果与余下队列;空队列调用 = 状态不变(防御,
 *  不猜测) */
export function navConfirmAnswer(
  queue: NavConfirmQueue,
  approved: boolean,
): { readonly queue: NavConfirmQueue; readonly answered: NavConfirmAnswered | null } {
  const [head, ...rest] = queue;
  if (head === undefined) return { queue, answered: null };
  return { queue: rest, answered: { confirmId: head.confirmId, approved } };
}
