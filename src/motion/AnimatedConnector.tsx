import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface Point {
  x: number;
  y: number;
}

interface AnimatedConnectorProps {
  from: Point;
  to: Point;
  /** 控制点偏移（默认按水平 S 曲线自动生成） */
  curvature?: number;
  /** 曲线方向：horizontal 用于左右连线，radial 用于中心辐射 */
  mode?: "horizontal" | "radial";
  startFrame: number;
  drawFrames?: number;
  color: string;
  orbColor?: string;
  strokeWidth?: number;
  showOrb?: boolean;
  /** 光点循环周期（帧数） */
  orbPeriodFrames?: number;
  /** 光点相位偏移 0..1 */
  orbPhase?: number;
  dashed?: boolean;
}

function getControlPoints(from: Point, to: Point, mode: "horizontal" | "radial", curvature: number) {
  if (mode === "radial") {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const c1 = { x: from.x + dx * 0.45, y: from.y + dy * 0.15 };
    const c2 = { x: from.x + dx * 0.55, y: from.y + dy * 0.85 };
    return { c1, c2 };
  }
  const dx = to.x - from.x;
  const offset = Math.abs(dx) * curvature;
  const dir = dx >= 0 ? 1 : -1;
  return {
    c1: { x: from.x + offset * dir, y: from.y },
    c2: { x: to.x - offset * dir, y: to.y },
  };
}

function cubicBezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

function estimateCubicLength(p0: Point, p1: Point, p2: Point, p3: Point, steps = 16): number {
  let len = 0;
  let prev = p0;
  for (let i = 1; i <= steps; i++) {
    const pt = cubicBezierPoint(p0, p1, p2, p3, i / steps);
    len += Math.hypot(pt.x - prev.x, pt.y - prev.y);
    prev = pt;
  }
  return Math.max(1, len);
}

/**
 * SVG 三次贝塞尔连线：支持沿路径生长（strokeDashoffset）+ 发光光点循环流动。
 * 需放在 <svg> 内部渲染。
 */
export const AnimatedConnector: React.FC<AnimatedConnectorProps> = ({
  from,
  to,
  curvature = 0.52,
  mode = "horizontal",
  startFrame,
  drawFrames = 18,
  color,
  orbColor,
  strokeWidth = 2.5,
  showOrb = true,
  orbPeriodFrames = 56,
  orbPhase = 0,
  dashed = false,
}) => {
  const frame = useCurrentFrame();
  const { c1, c2 } = getControlPoints(from, to, mode, curvature);
  const d = `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
  const pathLen = estimateCubicLength(from, c1, c2, to);

  const progress = interpolate(frame, [startFrame, startFrame + drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  if (progress <= 0.001) return null;

  const orbReady = showOrb && frame >= startFrame + drawFrames * 0.7;
  const rawT = (((frame - startFrame) / orbPeriodFrames + orbPhase) % 1 + 1) % 1;
  const orbPt = orbReady ? cubicBezierPoint(from, c1, c2, to, rawT) : null;
  const orbFade = orbReady
    ? Math.sin(rawT * Math.PI)
    : 0;
  const dotColor = orbColor ?? color;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashed ? "8 7" : pathLen}
        strokeDashoffset={dashed ? (1 - progress) * pathLen : (1 - progress) * pathLen}
        opacity={0.78 * progress}
      />

      {/* 终点锚点微圆 */}
      {progress > 0.85 && (
        <circle
          cx={to.x}
          cy={to.y}
          r={4}
          fill={dotColor}
          opacity={interpolate(progress, [0.85, 1], [0, 0.9])}
        />
      )}

      {/* 沿贝塞尔曲线流动的发光光点 */}
      {orbPt && orbFade > 0.05 && (
        <g opacity={orbFade}>
          <circle cx={orbPt.x} cy={orbPt.y} r={9} fill={dotColor} opacity={0.22} />
          <circle cx={orbPt.x} cy={orbPt.y} r={4.2} fill={dotColor} />
        </g>
      )}
    </g>
  );
};
