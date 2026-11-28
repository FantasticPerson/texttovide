import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ThemeTokens } from "../../theme";
import { isoProject, ptsToString, shadeHex } from "./math";

interface IsoBoardProps {
  size: number;
  thickness?: number;
  originX: number;
  originY: number;
  unit: number;
  theme: ThemeTokens;
  gridStep?: number;
}

/**
 * 2.5D 等距沙盘底盘（带双层厚度包边 + 地面阴影 + 表面极简网格点）
 */
export const IsoBoard: React.FC<IsoBoardProps> = ({
  size,
  thickness = 0.55,
  originX,
  originY,
  unit,
  theme,
  gridStep = 1,
}) => {
  const p = (x: number, y: number, z = 0) => isoProject(x, y, z, originX, originY, unit);
  const topFace = [p(0, 0, 0), p(size, 0, 0), p(size, size, 0), p(0, size, 0)];
  const leftFace = [
    p(0, size, 0),
    p(size, size, 0),
    p(size, size, -thickness),
    p(0, size, -thickness),
  ];
  const rightFace = [
    p(size, 0, 0),
    p(size, size, 0),
    p(size, size, -thickness),
    p(size, 0, -thickness),
  ];
  const shadowFace = [
    p(0.25, 0.25, -thickness - 0.16),
    p(size + 0.25, 0.25, -thickness - 0.16),
    p(size + 0.25, size + 0.25, -thickness - 0.16),
    p(0.25, size + 0.25, -thickness - 0.16),
  ];

  const topColor = theme.isDark ? "#131F1B" : "#FBEBB8";
  const leftColor = theme.isDark ? "#0D1613" : "#D4BF8C";
  const rightColor = theme.isDark ? "#09100E" : "#B8A270";
  const dotColor = theme.isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(120, 95, 55, 0.24)";
  const edgeStroke = theme.isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(130, 102, 56, 0.28)";

  const dots: Array<{ x: number; y: number }> = [];
  for (let gx = gridStep; gx < size; gx += gridStep) {
    for (let gy = gridStep; gy < size; gy += gridStep) {
      dots.push(p(gx, gy, 0.01));
    }
  }

  return (
    <g>
      <polygon
        points={ptsToString(shadowFace)}
        fill={theme.isDark ? "rgba(0,0,0,0.45)" : "rgba(120, 95, 55, 0.14)"}
      />
      <polygon points={ptsToString(leftFace)} fill={leftColor} stroke={edgeStroke} strokeWidth={1} />
      <polygon points={ptsToString(rightFace)} fill={rightColor} stroke={edgeStroke} strokeWidth={1} />
      <polygon points={ptsToString(topFace)} fill={topColor} stroke={edgeStroke} strokeWidth={1.2} />
      {dots.map((d, idx) => (
        <circle key={idx} cx={d.x} cy={d.y} r={1.8} fill={dotColor} />
      ))}
    </g>
  );
};

interface IsoBoxProps {
  /** 积木中心在沙盘上的 (x, y) 坐标 */
  cx: number;
  cy: number;
  /** 底部起始高度 z */
  z?: number;
  w: number;
  d: number;
  h: number;
  color: string;
  originX: number;
  originY: number;
  unit: number;
  opacity?: number;
  /** 顶面平贴文字（例如 PG） */
  topLabel?: string;
  /** 左侧面斜贴文字（例如 pgmq / pgvector） */
  leftLabel?: string;
  /** 是否画地面投影 */
  showShadow?: boolean;
  /** 是否画水平分层装饰线（用于 2.5D 柱状图） */
  layerLines?: number;
}

/**
 * 2.5D 等距长方体积木块（自动计算三面明暗 + 地面阴影 + 顶面/侧面贴字）
 */
export const IsoBox: React.FC<IsoBoxProps> = ({
  cx,
  cy,
  z = 0,
  w,
  d,
  h,
  color,
  originX,
  originY,
  unit,
  opacity = 1,
  topLabel,
  leftLabel,
  showShadow = true,
  layerLines = 0,
}) => {
  if (opacity <= 0.01 || h <= 0.001) return null;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - d / 2;
  const y1 = cy + d / 2;
  const p = (x: number, y: number, zz: number) => isoProject(x, y, zz, originX, originY, unit);

  const topFace = [p(x0, y0, z + h), p(x1, y0, z + h), p(x1, y1, z + h), p(x0, y1, z + h)];
  const leftFace = [p(x0, y1, z + h), p(x1, y1, z + h), p(x1, y1, z), p(x0, y1, z)];
  const rightFace = [p(x1, y0, z + h), p(x1, y1, z + h), p(x1, y1, z), p(x1, y0, z)];

  const topCol = shadeHex(color, 13);
  const leftCol = color;
  const rightCol = shadeHex(color, -18);
  const strokeCol = shadeHex(color, -26);

  // 地面投影随 z 升高自动变淡变小
  const shadowScale = Math.max(0.55, 1 - z * 0.08);
  const shadowOpacity = Math.max(0.06, 0.22 - z * 0.04) * opacity;
  const sw = (w / 2) * shadowScale;
  const sd = (d / 2) * shadowScale;
  const shadowPoly = [
    p(cx - sw + 0.12, cy - sd + 0.12, 0.01),
    p(cx + sw + 0.12, cy - sd + 0.12, 0.01),
    p(cx + sw + 0.12, cy + sd + 0.12, 0.01),
    p(cx - sw + 0.12, cy + sd + 0.12, 0.01),
  ];

  const topCenter = p(cx, cy, z + h);
  const leftCenter = p(cx, y1, z + h * 0.5);

  return (
    <g opacity={opacity}>
      {showShadow && z >= 0 && (
        <polygon points={ptsToString(shadowPoly)} fill={`rgba(15, 23, 42, ${shadowOpacity})`} />
      )}
      <polygon points={ptsToString(leftFace)} fill={leftCol} stroke={strokeCol} strokeWidth={0.8} />
      <polygon points={ptsToString(rightFace)} fill={rightCol} stroke={strokeCol} strokeWidth={0.8} />
      <polygon points={ptsToString(topFace)} fill={topCol} stroke={strokeCol} strokeWidth={0.8} />

      {/* 水平分层刻线（立体柱状图质感） */}
      {layerLines > 1 &&
        Array.from({ length: layerLines - 1 }, (_, i) => {
          const lz = z + ((i + 1) / layerLines) * h;
          const lp0 = p(x0, y1, lz);
          const lp1 = p(x1, y1, lz);
          const rp1 = p(x1, y0, lz);
          return (
            <polyline
              key={i}
              points={ptsToString([lp0, lp1, rp1])}
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={1}
            />
          );
        })}

      {/* 顶面等距平贴大字 */}
      {topLabel && (
        <g transform={`translate(${topCenter.x.toFixed(1)}, ${topCenter.y.toFixed(1)})`}>
          <g transform="scale(1, 0.58) rotate(-45)">
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#FBF1C7"
              fontFamily='"SF Mono", ui-monospace, system-ui, sans-serif'
              fontSize={Math.max(18, Math.min(40, w * unit * 0.42))}
              fontWeight={900}
              letterSpacing="0.04em"
            >
              {topLabel}
            </text>
          </g>
        </g>
      )}

      {/* 左侧面等距斜贴标签 */}
      {leftLabel && (
        <g transform={`translate(${leftCenter.x.toFixed(1)}, ${leftCenter.y.toFixed(1)})`}>
          <g transform="skewY(30)">
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#FFFFFF"
              fontFamily='"SF Mono", ui-monospace, system-ui, sans-serif'
              fontSize={Math.max(13, Math.min(22, h * unit * 0.48))}
              fontWeight={800}
              letterSpacing="0.02em"
            >
              {leftLabel}
            </text>
          </g>
        </g>
      )}
    </g>
  );
};

interface IsoCylinderProps {
  cx: number;
  cy: number;
  z?: number;
  radius: number;
  h: number;
  color: string;
  originX: number;
  originY: number;
  unit: number;
  opacity?: number;
}

/**
 * 2.5D 等距圆柱体（专用于数据库 / 中间件节点）
 */
export const IsoCylinder: React.FC<IsoCylinderProps> = ({
  cx,
  cy,
  z = 0,
  radius,
  h,
  color,
  originX,
  originY,
  unit,
  opacity = 1,
}) => {
  if (opacity <= 0.01) return null;
  const topPt = isoProject(cx, cy, z + h, originX, originY, unit);
  const botPt = isoProject(cx, cy, z, originX, originY, unit);
  const shadowPt = isoProject(cx + 0.14, cy + 0.14, 0.01, originX, originY, unit);

  const rx = radius * unit * 1.12;
  const ry = rx * 0.56;
  const bodyH = botPt.y - topPt.y;

  const topCol = shadeHex(color, 16);
  const sideLeft = color;
  const sideRight = shadeHex(color, -20);
  const strokeCol = shadeHex(color, -28);
  const gradId = `cyl-${Math.round(cx * 10)}-${Math.round(cy * 10)}-${color.slice(1)}`;

  const shadowOpacity = Math.max(0.06, 0.22 - z * 0.04) * opacity;

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={sideLeft} />
          <stop offset="100%" stopColor={sideRight} />
        </linearGradient>
      </defs>

      <ellipse
        cx={shadowPt.x}
        cy={shadowPt.y}
        rx={rx * 1.02}
        ry={ry * 1.02}
        fill={`rgba(15, 23, 42, ${shadowOpacity})`}
      />

      {/* 圆柱侧面 */}
      <path
        d={`M ${topPt.x - rx} ${topPt.y} L ${topPt.x - rx} ${topPt.y + bodyH} A ${rx} ${ry} 0 0 0 ${topPt.x + rx} ${topPt.y + bodyH} L ${topPt.x + rx} ${topPt.y} Z`}
        fill={`url(#${gradId})`}
        stroke={strokeCol}
        strokeWidth={0.8}
      />

      {/* 数据库特征环线 */}
      {[0.38, 0.7].map((frac, idx) => (
        <path
          key={idx}
          d={`M ${topPt.x - rx} ${topPt.y + bodyH * frac} A ${rx} ${ry} 0 0 0 ${topPt.x + rx} ${topPt.y + bodyH * frac}`}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={1.1}
        />
      ))}

      {/* 圆柱顶面 */}
      <ellipse
        cx={topPt.x}
        cy={topPt.y}
        rx={rx}
        ry={ry}
        fill={topCol}
        stroke={strokeCol}
        strokeWidth={0.9}
      />
    </g>
  );
};

interface IsoCalloutProps {
  cx: number;
  cy: number;
  zTop: number;
  label: string;
  sub?: string;
  stemHeight?: number;
  originX: number;
  originY: number;
  unit: number;
  theme: ThemeTokens;
  accent?: boolean;
  opacity?: number;
}

/**
 * 2.5D 垂直细引线标注（参考片中节点正上方立起的细引线 + 清晰标签）
 */
export const IsoCallout: React.FC<IsoCalloutProps> = ({
  cx,
  cy,
  zTop,
  label,
  sub,
  stemHeight = 46,
  originX,
  originY,
  unit,
  theme,
  accent = false,
  opacity = 1,
}) => {
  if (opacity <= 0.01) return null;
  const anchor = isoProject(cx, cy, zTop, originX, originY, unit);
  const topY = anchor.y - stemHeight;
  const lineCol = accent
    ? theme.colors.accent
    : theme.isDark
      ? "rgba(241, 245, 249, 0.45)"
      : "rgba(31, 41, 51, 0.45)";

  return (
    <g opacity={opacity}>
      <line
        x1={anchor.x}
        y1={anchor.y - 4}
        x2={anchor.x}
        y2={topY}
        stroke={lineCol}
        strokeWidth={1.4}
      />
      <circle cx={anchor.x} cy={anchor.y - 4} r={3} fill={lineCol} />
      <text
        x={anchor.x}
        y={topY - (sub ? 26 : 10)}
        textAnchor="middle"
        fill={accent ? theme.colors.accent : theme.colors.textPrimary}
        fontFamily={theme.fonts.heading}
        fontSize={22}
        fontWeight={800}
      >
        {label}
      </text>
      {sub && (
        <text
          x={anchor.x}
          y={topY - 4}
          textAnchor="middle"
          fill={theme.colors.textSecondary}
          fontFamily={theme.fonts.sans}
          fontSize={16}
          fontWeight={500}
        >
          {sub}
        </text>
      )}
    </g>
  );
};

interface IsoLinkProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  originX: number;
  originY: number;
  unit: number;
  startFrame: number;
  color: string;
  dashed?: boolean;
  showOrb?: boolean;
  orbPhase?: number;
}

/**
 * 沙盘平面等距连线（支持虚线生长 + 流动光点）
 */
export const IsoLink: React.FC<IsoLinkProps> = ({
  from,
  to,
  originX,
  originY,
  unit,
  startFrame,
  color,
  dashed = true,
  showOrb = true,
  orbPhase = 0,
}) => {
  const frame = useCurrentFrame();
  const p0 = isoProject(from.x, from.y, 0.04, originX, originY, unit);
  const p1 = isoProject(to.x, to.y, 0.04, originX, originY, unit);

  const prog = interpolate(frame, [startFrame, startFrame + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  if (prog <= 0.01) return null;

  const t = (((frame - startFrame) / 48 + orbPhase) % 1 + 1) % 1;
  const ox = p0.x + (p1.x - p0.x) * t;
  const oy = p0.y + (p1.y - p0.y) * t;

  return (
    <g opacity={prog}>
      <line
        x1={p0.x}
        y1={p0.y}
        x2={p0.x + (p1.x - p0.x) * prog}
        y2={p0.y + (p1.y - p0.y) * prog}
        stroke={color}
        strokeWidth={2.2}
        strokeDasharray={dashed ? "7 6" : undefined}
        strokeLinecap="round"
        opacity={0.78}
      />
      {showOrb && prog > 0.85 && (
        <g>
          <circle cx={ox} cy={oy} r={6.5} fill={color} opacity={0.25} />
          <circle cx={ox} cy={oy} r={3.5} fill={color} />
        </g>
      )}
    </g>
  );
};

interface IsoPersonProps {
  x: number;
  y: number;
  originX: number;
  originY: number;
  unit: number;
  color: string;
  scale?: number;
}

/**
 * 极简 2.5D 小人图标（用于 10×10 开发者矩阵或 Agent 角色）
 */
export const IsoPerson: React.FC<IsoPersonProps> = ({
  x,
  y,
  originX,
  originY,
  unit,
  color,
  scale = 1,
}) => {
  const pt = isoProject(x, y, 0.02, originX, originY, unit);
  const r = 4.2 * scale;
  const bodyW = 9 * scale;
  const bodyH = 12 * scale;

  return (
    <g transform={`translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`}>
      <ellipse cx={0} cy={1} rx={bodyW * 0.55} ry={bodyW * 0.28} fill="rgba(15,23,42,0.16)" />
      <rect
        x={-bodyW / 2}
        y={-bodyH}
        width={bodyW}
        height={bodyH}
        rx={bodyW * 0.42}
        fill={color}
      />
      <circle cx={0} cy={-bodyH - r * 1.15} r={r} fill={shadeHex(color, 12)} />
    </g>
  );
};
