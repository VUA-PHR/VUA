import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { businessModules, type AppSectionId } from "./nav-model.ts";
import { strings } from "../i18n/index.ts";

/**
 * 顶栏折叠展开菜单(S-XIII-4,用户裁定):
 * 展开的菜单项就是原来的平行四边形 Tab 控件本体(斜切卡片 + 反斜标签),
 * 竖排依次向下飞出;容器完全透明,不套面板、不加边框——控件自身承载全部视觉。
 *
 * 交互与 ContextMenu 对齐:portal 挂 body(transform 祖先不破坏 fixed 定位)、
 * Escape/外击/滚动/窗口失焦关闭、方向键循环、打开即聚焦第一项。
 * 外击排除折叠按钮自身:按钮的 click 负责 toggle,否则 pointerdown 先关、
 * click 又开,按钮上连点会变成原地闪开。
 */
export interface NavOverflowMenuProps {
  /** 视口坐标:折叠按钮下缘 */
  readonly x: number;
  readonly y: number;
  readonly activeModule: AppSectionId;
  /** 折叠按钮元素:外击判定的豁免区 */
  readonly toggleRef: RefObject<HTMLButtonElement | null>;
  readonly onSelect: (module: AppSectionId) => void;
  readonly onClose: () => void;
}

export function NavOverflowMenu({
  x,
  y,
  activeModule,
  toggleRef,
  onSelect,
  onClose,
}: NavOverflowMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.left = `${Math.min(x, Math.max(8, window.innerWidth - rect.width - 8))}px`;
    el.style.top = `${Math.min(y, Math.max(8, window.innerHeight - rect.height - 8))}px`;
    el.querySelector<HTMLButtonElement>(".vua-shell__tab")?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && el.contains(event.target)) return;
      if (event.target instanceof Node && toggleRef.current?.contains(event.target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const items = [...el.querySelectorAll<HTMLButtonElement>(".vua-shell__tab")];
      if (items.length === 0) return;
      const index = items.findIndex((item) => item === document.activeElement);
      const next =
        event.key === "ArrowDown"
          ? (index + 1) % items.length
          : (index - 1 + items.length) % items.length;
      items[next]?.focus();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("blur", onClose);
    };
  }, [x, y, toggleRef, onClose]);

  return createPortal(
    <div
      ref={ref}
      className="vua-nav-menu"
      role="menu"
      aria-label={strings.app.moduleNavAria}
      style={{ left: x, top: y }}
    >
      {businessModules.map((m, index) => (
        <button
          key={m.id}
          type="button"
          role="menuitem"
          className="vua-shell__tab"
          style={{ "--tab-index": index } as CSSProperties}
          aria-current={activeModule === m.id ? "page" : undefined}
          onClick={() => {
            onClose();
            onSelect(m.id);
          }}
        >
          <span className="vua-shell__tab-label">{strings.nav.tabs[m.labelKey]}</span>
        </button>
      ))}
    </div>,
    document.body,
  );
}
