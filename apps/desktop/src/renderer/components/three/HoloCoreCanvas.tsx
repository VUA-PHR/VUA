/**
 * 全息核心懒加载容器(S-VFX-2):three.js 装饰层异步加载,不挡指挥台首屏。
 * 默认导出供 React.lazy 消费;加载完成前由 .vua-home__holo 的 CSS 辉光兜底。
 */
import { SceneCanvas } from "./SceneCanvas.tsx";
import { holoCoreScene } from "./scenes/holo-core.ts";

export default function HoloCoreCanvas() {
  return <SceneCanvas factory={holoCoreScene} className="vua-home__holo-canvas" />;
}
