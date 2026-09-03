/**
 * 展台懒加载容器(S-IX-2):three.js 装饰层异步加载,不挡出厂页首屏。
 * 默认导出供 React.lazy 消费;mode === "off" 时 SceneCanvas 不渲染,
 * 由 .vua-release__pedestal 的 CSS 台座兜底。
 *
 * mood/flourishKey 经控制通道流入已挂载场景,切换选中不重建 WebGL。
 */
import { useMemo, useRef } from "react";
import { SceneCanvas } from "./SceneCanvas.tsx";
import {
  createPedestalFactory,
  type PedestalControl,
  type PedestalMood,
} from "./scenes/pedestal.ts";

export default function PedestalCanvas({
  mood,
  flourishKey,
}: {
  mood: PedestalMood;
  flourishKey: number;
}) {
  const controlRef = useRef<PedestalControl>({ mood, flourishKey });
  controlRef.current = { mood, flourishKey };
  const factory = useMemo(() => createPedestalFactory(controlRef), []);
  return <SceneCanvas factory={factory} className="vua-release__pedestal-canvas" />;
}
