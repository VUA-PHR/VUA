/**
 * 传送带交互(S-IX-2):
 * - coverflow 轮盘变形(按距视口中心距离写 rotateY/scale/opacity)——
 *   仅 animated 场景模式启用,其余模式退回平直横滚(纯 CSS);
 * - 滚轮纵转横 + 拖拽滚动为纯交互,任何模式可用;
 * - 拖拽超过阈值时吞掉随后的 click,避免误触发选中。
 */
import { useEffect, useState } from "react";
import { useSceneMode } from "../../components/three/useSceneMode.ts";

const DRAG_THRESHOLD_PX = 6;

export function useConveyor<T extends HTMLElement>() {
  // 回调 ref:轨道在数据加载后才挂载,用 state 追踪元素变化
  const [track, setTrack] = useState<T | null>(null);
  const mode = useSceneMode();

  /* 滚轮纵转横 + 拖拽滚动(纯交互,全模式可用) */
  useEffect(() => {
    if (track === null) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      track.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    let dragStart: { x: number; scrollLeft: number } | null = null;
    let dragged = false;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragStart = { x: event.clientX, scrollLeft: track.scrollLeft };
      dragged = false;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragStart === null) return;
      const delta = event.clientX - dragStart.x;
      if (Math.abs(delta) > DRAG_THRESHOLD_PX) dragged = true;
      track.scrollLeft = dragStart.scrollLeft - delta;
    };
    const onPointerUp = () => {
      dragStart = null;
    };
    const onClickCapture = (event: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      event.preventDefault();
      event.stopPropagation();
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    track.addEventListener("click", onClickCapture, true);
    return () => {
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("click", onClickCapture, true);
    };
  }, [track]);

  /* coverflow 轮盘变形:滚动/尺寸变化时按中心距离重写每卡 transform */
  useEffect(() => {
    if (track === null || mode !== "animated") return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      const center = rect.left + rect.width / 2;
      for (const child of Array.from(track.children)) {
        if (!(child instanceof HTMLElement)) continue;
        const card = child.getBoundingClientRect();
        const t = Math.max(
          -1,
          Math.min(1, (card.left + card.width / 2 - center) / (rect.width / 2)),
        );
        const depth = Math.abs(t);
        child.style.transform = `rotateY(${(-t * 30).toFixed(2)}deg) scale(${(1 - depth * 0.14).toFixed(3)})`;
        child.style.opacity = (1 - depth * 0.4).toFixed(3);
        child.style.zIndex = String(100 - Math.round(depth * 50));
      }
    };
    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };
    update();
    track.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      track.removeEventListener("scroll", schedule);
      observer.disconnect();
      for (const child of Array.from(track.children)) {
        if (!(child instanceof HTMLElement)) continue;
        child.style.transform = "";
        child.style.opacity = "";
        child.style.zIndex = "";
      }
    };
  }, [track, mode]);

  const scrollByCard = (direction: 1 | -1) => {
    if (track === null) return;
    const card = track.querySelector<HTMLElement>(".vua-release-card");
    const gap = 16;
    const step = card !== null ? card.offsetWidth + gap : 260;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return { ref: setTrack, scrollByCard };
}
