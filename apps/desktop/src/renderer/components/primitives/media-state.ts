/**
 * MediaSlot 状态机(纯逻辑,可测)。
 * loading:媒体请求进行中——显示等比骨架屏(ui-ux §2.8:骨架屏只表示
 * 内容正在加载,且与最终布局同形);
 * ready:加载完成;failed:加载失败——诚实说明 + 重试,不得停留在
 * 无关闭路径的空白或破图。
 */
export type MediaState = "loading" | "ready" | "failed";

export type MediaEvent = "load" | "error" | "retry";

export function mediaReducer(state: MediaState, event: MediaEvent): MediaState {
  switch (event) {
    case "load":
      return "ready";
    case "error":
      return "failed";
    case "retry":
      // 仅失败态可重试;ready/loading 下重试无意义,保持原状
      return state === "failed" ? "loading" : state;
  }
}

/**
 * 自动重试参数(仓库目录图片等远程媒体;数值按需调整):
 * 失败后每隔 INTERVAL 毫秒重建一次请求,最多 MAX 次;耗尽后保持等待
 * 指示(转圈),直到 src 变更或组件重建(下次列出该商品时恢复额度)。
 */
export const MEDIA_AUTO_RETRY_INTERVAL_MS = 5000;
export const MEDIA_AUTO_RETRY_MAX = 5;

/** 是否还应有下一次自动重试(retryCount = 已执行的自动重试次数) */
export function shouldAutoRetry(
  retryCount: number,
  max: number = MEDIA_AUTO_RETRY_MAX,
): boolean {
  return retryCount < max;
}
