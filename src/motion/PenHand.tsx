import React from "react";
import { staticFile } from "remotion";

interface PenHandProps {
  /** 笔尖在当前 SVG/容器坐标系中的精确位置 */
  x: number;
  y: number;
  /** 细微手腕晃动角度（度） */
  tiltDeg?: number;
  scale?: number;
  opacity?: number;
  penColor?: string;
}

/**
 * 棚拍实拍级透明抠图握笔手（public/assets/common/hand-pen.png，笔尖精确锚定 (0, 0)）
 */
export const PenHand: React.FC<PenHandProps> = ({
  x,
  y,
  tiltDeg = 0,
  scale = 1,
  opacity = 1,
}) => {
  if (opacity <= 0.01) return null;

  return (
    <g
      opacity={opacity}
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${tiltDeg.toFixed(2)}) scale(${scale})`}
      style={{ pointerEvents: "none" }}
    >
      <image
        href={staticFile("assets/common/hand-pen.png")}
        x={-2}
        y={-1}
        width={340}
        height={321}
        style={{ filter: "drop-shadow(0 14px 20px rgba(15, 23, 42, 0.22))" }}
      />
    </g>
  );
};
