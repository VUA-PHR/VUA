/**
 * useCardSpotlight:卡片墙指针聚光 + 微倾斜。
 *
 * 仅在场景模式为 animated(特效开启、非 HC、非 forced-colors、非
 * reduced-motion、WebGL 可用)时挂载监听;其余模式卡片保持纯 CSS hover,
 * 零运行时开销。写入的 --px/--py/--rx/--ry 由 warehouse.css 消费,
 * 聚光位置在指针离开后保留,供 opacity 渐隐收尾。
 */
import { useEffect } from "react";
import { useSceneMode } from "../../components/three/useSceneMode.ts";

const CARD_SELECTOR = ".vua-warehouse-card";
/** 倾斜幅度上限(度):克制的小角度,不与布局抢占注意力 */
const MAX_TILT_DEG = 4;

function resetTilt(card: HTMLElement): void {
  card.style.setProperty("--rx", "0deg");
  card.style.setProperty("--ry", "0deg");
}

export function useCardSpotlight(wall: HTMLElement | null): void {
  const mode = useSceneMode();

  useEffect(() => {
    if (mode !== "animated" || wall === null) return;

    let frame = 0;
    let current: HTMLElement | null = null;

    const onMove = (event: PointerEvent) => {
      // rAF 节流:每帧至多处理一次,长墙滚动时不堆积
      if (frame !== 0) return;
      const { clientX, clientY, target } = event;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const card =
          target instanceof Element
            ? target.closest<HTMLElement>(CARD_SELECTOR)
            : null;
        if (card !== current) {
          if (current !== null) resetTilt(current);
          current = card;
        }
        if (card === null) return;
        const rect = card.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        card.style.setProperty("--px", `${(x * 100).toFixed(2)}%`);
        card.style.setProperty("--py", `${(y * 100).toFixed(2)}%`);
        // 以卡片中心为原点:上仰下俯 rotateX,左右 rotateY
        card.style.setProperty("--rx", `${((0.5 - y) * MAX_TILT_DEG * 2).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${((x - 0.5) * MAX_TILT_DEG * 2).toFixed(2)}deg`);
      });
    };

    const onLeave = () => {
      if (current !== null) {
        resetTilt(current);
        current = null;
      }
    };

    wall.addEventListener("pointermove", onMove);
    wall.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      wall.removeEventListener("pointermove", onMove);
      wall.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, [mode, wall]);
}
