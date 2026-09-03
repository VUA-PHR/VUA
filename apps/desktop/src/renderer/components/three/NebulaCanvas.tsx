/**
 * 星云云幕懒加载容器(S-VFX-1):three.js 体量大,装饰层异步加载不挡首屏。
 * 默认导出供 React.lazy 消费;加载完成前无渲染,CSS 场景兜底。
 */
import { SceneCanvas } from "./SceneCanvas.tsx";
import { nebulaScene } from "./scenes/nebula.ts";
import "./scene-canvas.css";

export default function NebulaCanvas() {
  return <SceneCanvas factory={nebulaScene} className="vua-scene-canvas" />;
}
