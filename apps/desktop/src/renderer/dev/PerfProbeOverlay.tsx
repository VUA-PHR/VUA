import { useEffect, useSyncExternalStore } from "react";
import {
  ensureLongTaskObserver,
  longTaskCount,
  recentMeasures,
  subscribePerfSamples,
} from "../app/perf-probe.ts";
import { format, strings } from "../i18n/index.ts";
import "./perf-probe-overlay.css";

const copy = strings.dev.perfProbe;

/**
 * 性能采样浮层(G2-A,dev-only):右下角固定小面板,显示长任务计数与
 * 最近 perfMeasure 采样。仅挂 dev 页面(当前:组件状态展台);
 * G9 图谱埋点后数据自然出现,无需改动本组件。
 */
export function PerfProbeOverlay() {
  useEffect(() => {
    ensureLongTaskObserver();
  }, []);
  useSyncExternalStore(subscribePerfSamples, () => `${longTaskCount()}|${recentMeasures().length}`);

  const measures = recentMeasures().slice(-5).reverse();
  return (
    <aside className="perf-probe" aria-label={copy.title}>
      <p className="perf-probe__title">{copy.title}</p>
      <p className="perf-probe__line">{format(copy.longTasks, { count: longTaskCount() })}</p>
      <p className="perf-probe__title">{copy.measures}</p>
      {measures.length === 0 ? (
        <p className="perf-probe__line">{copy.empty}</p>
      ) : (
        measures.map((m) => (
          <p className="perf-probe__line" key={`${m.name}-${m.at}`}>
            {m.name}: {m.duration.toFixed(1)}ms
          </p>
        ))
      )}
    </aside>
  );
}
