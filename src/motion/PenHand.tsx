import React from "react";

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
 * 矢量握笔手（锚点 (0, 0) 精确对齐笔尖，用于 HandDrawScene 实时跟随笔迹）
 */
export const PenHand: React.FC<PenHandProps> = ({
  x,
  y,
  tiltDeg = 0,
  scale = 1,
  opacity = 1,
  penColor = "#C83E2B",
}) => {
  if (opacity <= 0.01) return null;

  return (
    <g
      opacity={opacity}
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${tiltDeg.toFixed(2)}) scale(${scale})`}
      style={{ pointerEvents: "none" }}
    >
      {/* 柔和地面投影 */}
      <ellipse cx={68} cy={78} rx={72} ry={24} fill="rgba(15, 23, 42, 0.14)" />

      {/* 马克笔笔身（从笔尖 (0,0) 向右下方 42° 延伸） */}
      <g transform="rotate(42)">
        {/* 笔尖锥体 */}
        <polygon points="0,0 16,-4 16,4" fill="#2C1E14" />
        <polygon points="16,-5 32,-7 32,7 16,5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={1} />
        {/* 主笔杆 */}
        <rect
          x={32}
          y={-8.5}
          width={126}
          height={17}
          rx={4}
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth={1.2}
        />
        {/* 笔杆品牌色环 */}
        <rect x={44} y={-8.5} width={22} height={17} fill={penColor} />
        <rect x={144} y={-8.5} width={22} height={17} rx={3} fill={penColor} />
      </g>

      {/* 手掌与手指（自然握持马克笔） */}
      <g>
        {/* 手腕与手背 */}
        <path
          d="M 74 52 C 98 44, 134 62, 166 96 L 194 140 L 128 168 L 96 124 C 78 104, 62 84, 66 64 Z"
          fill="#F5C9A6"
          stroke="#C8936C"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {/* 食指（压在笔杆上方） */}
        <path
          d="M 28 24 C 44 16, 70 22, 92 42 C 98 48, 92 58, 82 54 C 64 42, 46 36, 30 34 C 24 33, 22 27, 28 24 Z"
          fill="#FAD4B4"
          stroke="#C8936C"
          strokeWidth={1.5}
        />
        {/* 大拇指（从下侧扣住笔杆） */}
        <path
          d="M 38 42 C 52 38, 72 48, 82 64 C 86 72, 76 80, 66 74 C 54 66, 42 58, 34 52 C 30 48, 32 43, 38 42 Z"
          fill="#F8CCA8"
          stroke="#C8936C"
          strokeWidth={1.5}
        />
        {/* 中指微露 */}
        <path
          d="M 52 68 C 66 66, 86 76, 94 92 C 96 98, 86 104, 78 98 C 66 88, 56 80, 50 76 Z"
          fill="#EBB892"
          stroke="#C8936C"
          strokeWidth={1.4}
        />
      </g>
    </g>
  );
};
