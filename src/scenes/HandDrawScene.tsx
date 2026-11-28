import React, { useEffect, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HandDrawScene as HandDrawSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";
import { PenHand } from "../motion/PenHand";

interface StrokeData {
  width: number;
  height: number;
  sketchPoints: Array<[number, number]>;
  paintPoints: Array<[number, number]>;
}

const DEFAULT_PAINT: Array<[number, number]> = [
  [0.08, 0.14],
  [0.92, 0.14],
  [0.92, 0.32],
  [0.08, 0.32],
  [0.08, 0.50],
  [0.92, 0.50],
  [0.92, 0.68],
  [0.08, 0.68],
  [0.08, 0.86],
  [0.92, 0.86],
];

const DEFAULT_STROKES: StrokeData = {
  width: 1280,
  height: 720,
  sketchPoints: DEFAULT_PAINT,
  paintPoints: DEFAULT_PAINT,
};

function toSiblingPath(rel: string, suffix: string): string {
  return rel.replace(/\.[^/.]+$/, suffix);
}

/** 按进度 t (0..1) 沿折线采样当前笔尖点与已走过的 polyline 路径 */
function samplePolyline(pts: Array<[number, number]>, w: number, h: number, t: number) {
  if (pts.length === 0) return { tip: { x: w / 2, y: h / 2 }, path: "" };
  if (pts.length === 1 || t <= 0) {
    const x = pts[0][0] * w;
    const y = pts[0][1] * h;
    return { tip: { x, y }, path: `M ${x.toFixed(1)} ${y.toFixed(1)}` };
  }

  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot((pts[i][0] - pts[i - 1][0]) * w, (pts[i][1] - pts[i - 1][1]) * h);
    segs.push(d);
    total += d;
  }

  const target = Math.max(0, Math.min(1, t)) * Math.max(1, total);
  let acc = 0;
  const cmds: string[] = [`M ${(pts[0][0] * w).toFixed(1)} ${(pts[0][1] * h).toFixed(1)}`];
  let tipX = pts[0][0] * w;
  let tipY = pts[0][1] * h;

  for (let i = 0; i < segs.length; i++) {
    const len = segs[i];
    const x1 = pts[i + 1][0] * w;
    const y1 = pts[i + 1][1] * h;
    if (acc + len <= target) {
      cmds.push(`L ${x1.toFixed(1)} ${y1.toFixed(1)}`);
      tipX = x1;
      tipY = y1;
      acc += len;
    } else {
      const local = len > 0 ? (target - acc) / len : 0;
      const x0 = pts[i][0] * w;
      const y0 = pts[i][1] * h;
      tipX = x0 + (x1 - x0) * local;
      tipY = y0 + (y1 - y0) * local;
      cmds.push(`L ${tipX.toFixed(1)} ${tipY.toFixed(1)}`);
      break;
    }
  }

  return { tip: { x: tipX, y: tipY }, path: cmds.join(" ") };
}

interface DrawCanvasProps {
  imageRel: string;
  label?: string;
  startFrame: number;
  drawFrames: number;
  showHand: boolean;
  boxW: number;
  boxH: number;
  theme: ThemeTokens;
  uid: string;
}

const HandDrawCanvas: React.FC<DrawCanvasProps> = ({
  imageRel,
  label,
  startFrame,
  drawFrames,
  showHand,
  boxW,
  boxH,
  theme,
  uid,
}) => {
  const frame = useCurrentFrame();
  const [strokes, setStrokes] = useState<StrokeData>(DEFAULT_STROKES);
  const [hasSketchImg, setHasSketchImg] = useState(false);

  const sketchRel = toSiblingPath(imageRel, ".sketch.png");
  const strokesRel = toSiblingPath(imageRel, ".strokes.json");

  useEffect(() => {
    const handle = delayRender(`load-handdraw-${uid}`);
    let cancelled = false;
    fetch(staticFile(strokesRel))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.sketchPoints)) {
          setStrokes(data);
          setHasSketchImg(true);
        }
      })
      .catch(() => {
        // 降级使用默认 Z 字涂色路径
      })
      .finally(() => {
        if (!cancelled) continueRender(handle);
      });
    return () => {
      cancelled = true;
    };
  }, [strokesRel, uid]);

  const localF = frame - startFrame;
  const totalDraw = Math.max(24, drawFrames);
  const sketchEnd = Math.round(totalDraw * 0.56);
  const paintEnd = Math.round(totalDraw * 0.90);
  const exitEnd = totalDraw;

  const sketchP = interpolate(localF, [0, sketchEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const paintP = interpolate(localF, [sketchEnd, paintEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const handExitP = interpolate(localF, [paintEnd, exitEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const sketchSample = samplePolyline(strokes.sketchPoints, boxW, boxH, sketchP);
  const paintSample = samplePolyline(strokes.paintPoints, boxW, boxH, paintP);

  // 当前笔尖坐标：阶段 1 走线稿轨迹 + 细微手抖，阶段 2 走 Z 字上色轨迹，结束滑出画外
  const inSketch = localF >= 0 && localF < sketchEnd;
  const inPaint = localF >= sketchEnd && localF <= paintEnd;
  const baseTip = inSketch
    ? sketchSample.tip
    : paintSample.tip;
  const jitterX = inSketch ? Math.sin(frame * 1.9) * 3.5 : 0;
  const jitterY = inSketch ? Math.cos(frame * 2.3) * 3.5 : 0;
  const handX = baseTip.x + jitterX + handExitP * 180;
  const handY = baseTip.y + jitterY + handExitP * 140;
  const handOpacity =
    !showHand || localF < 0 || localF >= exitEnd
      ? 0
      : interpolate(localF, [0, 6], [0, 1], { extrapolateRight: "clamp" }) *
        (1 - handExitP);
  const tilt = inSketch
    ? Math.sin(frame * 0.55) * 4.2
    : inPaint
      ? Math.sin(frame * 0.35) * 6.5
      : 0;

  const sketchMaskId = `hd-sketch-${uid}`;
  const paintMaskId = `hd-paint-${uid}`;
  const clipRectId = `hd-clip-${uid}`;

  // 线稿刷头宽度与上色大刷头宽度按画面尺寸自适应
  const sketchStrokeW = Math.round(boxW * 0.145);
  const paintStrokeW = Math.round(boxH * 0.28);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <svg
        width={boxW}
        height={boxH}
        viewBox={`0 0 ${boxW} ${boxH}`}
        style={{
          overflow: "visible",
          filter: "drop-shadow(0 16px 36px rgba(15, 23, 42, 0.14))",
        }}
      >
        <defs>
          <clipPath id={clipRectId}>
            <rect x={0} y={0} width={boxW} height={boxH} rx={18} ry={18} />
          </clipPath>

          {/* 阶段 1：线稿显露蒙版 */}
          <mask id={sketchMaskId}>
            <rect x={0} y={0} width={boxW} height={boxH} fill="black" />
            {sketchP > 0.001 && (
              <path
                d={sketchSample.path}
                fill="none"
                stroke="white"
                strokeWidth={sketchStrokeW}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {sketchP >= 0.99 && <rect x={0} y={0} width={boxW} height={boxH} fill="white" />}
          </mask>

          {/* 阶段 2：Z 字上色显露蒙版 */}
          <mask id={paintMaskId}>
            <rect x={0} y={0} width={boxW} height={boxH} fill="black" />
            {paintP > 0.001 && (
              <path
                d={paintSample.path}
                fill="none"
                stroke="white"
                strokeWidth={paintStrokeW}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {paintP >= 0.99 && <rect x={0} y={0} width={boxW} height={boxH} fill="white" />}
          </mask>
        </defs>

        {/* 画纸底板 */}
        <rect
          x={0}
          y={0}
          width={boxW}
          height={boxH}
          rx={18}
          ry={18}
          fill={theme.isDark ? "#131C19" : "#FDF5D7"}
          stroke={theme.colors.border}
          strokeWidth={1.5}
        />

        {/* 线稿层（先画出来） */}
        <g clipPath={`url(#${clipRectId})`} mask={`url(#${sketchMaskId})`}>
          <image
            href={staticFile(hasSketchImg ? sketchRel : imageRel)}
            x={0}
            y={0}
            width={boxW}
            height={boxH}
            preserveAspectRatio="xMidYMid slice"
            opacity={hasSketchImg ? 0.95 : 0.35}
          />
        </g>

        {/* 彩色原图层（后随 Z 字笔刷涂出来） */}
        <g clipPath={`url(#${clipRectId})`} mask={`url(#${paintMaskId})`}>
          <image
            href={staticFile(imageRel)}
            x={0}
            y={0}
            width={boxW}
            height={boxH}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>

        {/* 实时跟随笔尖的矢量握笔手 */}
        <PenHand
          x={handX}
          y={handY}
          tiltDeg={tilt}
          scale={boxW < 700 ? 0.85 : 1.05}
          opacity={handOpacity}
          penColor={theme.colors.accent}
        />
      </svg>

      {label && (
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 24,
            fontWeight: 700,
            color: theme.colors.textSecondary,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

interface Props {
  scene: HandDrawSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const HandDrawScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleS = spring({ frame, fps, config: motion.spring });

  const panels =
    scene.items && scene.items.length > 0
      ? scene.items
      : scene.image
        ? [{ image: scene.image, label: undefined }]
        : [];

  const isDual = panels.length >= 2;
  const boxW = isVertical
    ? 880
    : isDual
      ? 680
      : 1080;
  const boxH = Math.round(boxW * (9 / 16));
  const showHand = scene.showHand !== false;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        width: "100%",
      }}
    >
      {scene.title && (
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: isVertical ? 46 : 50,
            fontWeight: 800,
            color: theme.colors.textPrimary,
            textAlign: "center",
            opacity: titleS,
            transform: `translateY(${(1 - titleS) * 14}px)`,
          }}
        >
          <HighlightText text={scene.title} theme={theme} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isDual ? 34 : 0,
          width: "100%",
        }}
      >
        {panels.map((panel, idx) => {
          const t = itemTimings[idx];
          const startF = t ? t.startFrame : idx === 0 ? 8 : Math.round(3.6 * fps);
          const defaultDrawF = Math.round((scene.drawSec ?? (isDual ? 3.4 : 4.6)) * fps);
          const drawF = t
            ? Math.max(Math.round(2.4 * fps), Math.min(defaultDrawF, t.endFrame - t.startFrame - 8))
            : defaultDrawF;

          return (
            <HandDrawCanvas
              key={idx}
              imageRel={panel.image}
              label={panel.label}
              startFrame={startF}
              drawFrames={drawF}
              showHand={showHand}
              boxW={boxW}
              boxH={boxH}
              theme={theme}
              uid={`${scene.id}-${idx}`}
            />
          );
        })}
      </div>

      {scene.caption && (
        <div
          style={{
            fontSize: 23,
            color: theme.colors.textSecondary,
            textAlign: "center",
          }}
        >
          {scene.caption}
        </div>
      )}
    </div>
  );
};
