import { strings } from "../../i18n/index.ts";
import "./mascot.css";

/**
 * 像素吉祥物缺省形象(最小集,不做皮肤系统)。
 * 内联 SVG + crispEdges 硬像素;配色全走 Token,眼睛/天线灯随模块辖区色。
 * animate=true 时 3 帧眨眼循环(8fps 硬切,CSS only);false 渲染静态帧 1,
 * 供空状态等不需要动效的场景。reduced-motion 下降级为静态帧 1。
 */
export interface MascotProps {
  animate?: boolean;
  size?: number;
}

export function Mascot({ animate = true, size = 64 }: MascotProps) {
  return (
    <svg
      className={animate ? "vua-mascot vua-mascot--animate" : "vua-mascot"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      role="img"
      aria-label={strings.common.mascotAria}
    >
      {/* 三帧共用:天线、头、脸、手臂、身体、胸灯、脚 */}
      <g>
        <rect className="vua-mascot__body" x="11" y="2" width="2" height="1" />
        <rect className="vua-mascot__accent" x="11" y="0" width="2" height="2" />
        <rect className="vua-mascot__body" x="5" y="3" width="14" height="9" />
        <rect className="vua-mascot__face" x="7" y="5" width="10" height="5" />
        <rect className="vua-mascot__body" x="4" y="14" width="2" height="4" />
        <rect className="vua-mascot__body" x="18" y="14" width="2" height="4" />
        <rect className="vua-mascot__body" x="7" y="13" width="10" height="7" />
        <rect className="vua-mascot__accent" x="11" y="15" width="2" height="2" />
        <rect className="vua-mascot__limb" x="7" y="20" width="3" height="2" />
        <rect className="vua-mascot__limb" x="14" y="20" width="3" height="2" />
      </g>
      {/* 帧 1:睁眼(基态,无动画/reduced-motion 时保持此帧) */}
      <g className="vua-mascot__frame vua-mascot__frame--1">
        <rect className="vua-mascot__accent" x="9" y="6" width="2" height="3" />
        <rect className="vua-mascot__accent" x="13" y="6" width="2" height="3" />
      </g>
      {/* 帧 2:半闭 */}
      <g className="vua-mascot__frame vua-mascot__frame--2">
        <rect className="vua-mascot__accent" x="9" y="7" width="2" height="2" />
        <rect className="vua-mascot__accent" x="13" y="7" width="2" height="2" />
      </g>
      {/* 帧 3:闭眼 */}
      <g className="vua-mascot__frame vua-mascot__frame--3">
        <rect className="vua-mascot__accent" x="9" y="7" width="2" height="1" />
        <rect className="vua-mascot__accent" x="13" y="7" width="2" height="1" />
      </g>
    </svg>
  );
}
