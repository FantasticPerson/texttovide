import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { IsoMetricsScene as IsoMetricsSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";
import { NumberCounter } from "../motion/NumberCounter";
import { isoProject, resolveIsoColor } from "../motion/iso/math";
import { IsoBoard, IsoBox, IsoCallout, IsoPerson } from "../motion/iso/primitives";

interface Props {
  scene: IsoMetricsSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

const SVG_W = 1120;
const SVG_H = 590;
const BOARD_SIZE = 10;
const UNIT = 44;
const ORIGIN_X = SVG_W / 2;
const ORIGIN_Y = 148;

export const IsoMetricsScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleS = spring({ frame, fps, config: motion.spring });

  const renderCrowd = () => {
    const pct = Math.min(100, Math.max(0, Math.round(scene.percent ?? 55)));
    const activeCount = Math.round(
      interpolate(frame, [10, 48], [0, pct], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      }),
    );
    const activeColor = resolveIsoColor(scene.tone ?? "blue", theme.isDark);
    const idleColor = theme.isDark ? "#334155" : "#C9B996";

    const people: Array<{ gx: number; gy: number; idx: number }> = [];
    let counter = 0;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        people.push({ gx: 1.0 + col * 0.88, gy: 1.0 + row * 0.88, idx: counter++ });
      }
    }
    // 深度排序保证前后遮挡正确
    people.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));

    const labelPt = isoProject(4.8, 4.8, 1.4, ORIGIN_X, ORIGIN_Y, UNIT);

    return (
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ maxWidth: isVertical ? "100%" : 1120, maxHeight: 610, overflow: "visible" }}
      >
        <IsoBoard
          size={BOARD_SIZE}
          originX={ORIGIN_X}
          originY={ORIGIN_Y}
          unit={UNIT}
          theme={theme}
          gridStep={1.25}
        />

        {people.map((p) => (
          <IsoPerson
            key={p.idx}
            x={p.gx}
            y={p.gy}
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
            unit={UNIT}
            color={p.idx < activeCount ? activeColor : idleColor}
            scale={0.95}
          />
        ))}

        {/* 浮空大数字 + 细引线 */}
        <line
          x1={labelPt.x}
          y1={labelPt.y + 42}
          x2={labelPt.x}
          y2={labelPt.y - 84}
          stroke={activeColor}
          strokeWidth={1.8}
        />
        <circle cx={labelPt.x} cy={labelPt.y + 42} r={4} fill={activeColor} />
        <rect
          x={labelPt.x - 122}
          y={labelPt.y - 160}
          width={244}
          height={78}
          rx={14}
          fill={theme.colors.surface}
          stroke={activeColor}
          strokeWidth={1.8}
        />
        <text
          x={labelPt.x}
          y={labelPt.y - 128}
          textAnchor="middle"
          fill={theme.colors.textSecondary}
          fontFamily={theme.fonts.heading}
          fontSize={20}
          fontWeight={700}
        >
          {scene.crowdLabel ?? "采用占比"}
        </text>
        <text
          x={labelPt.x}
          y={labelPt.y - 94}
          textAnchor="middle"
          fill={activeColor}
          fontFamily={theme.fonts.mono}
          fontSize={34}
          fontWeight={900}
        >
          <NumberCounter from={0} to={pct} startFrame={10} durationFrames={38} />
          {scene.crowdSuffix ?? "%"}
        </text>
      </svg>
    );
  };

  const renderBars = () => {
    const bars = scene.bars ?? [];
    const maxVal = Math.max(1, ...bars.map((b) => b.max ?? b.value));
    const maxBarH = 4.6;
    const count = Math.max(1, bars.length);

    return (
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ maxWidth: isVertical ? "100%" : 1120, maxHeight: 610, overflow: "visible" }}
      >
        <IsoBoard
          size={BOARD_SIZE}
          originX={ORIGIN_X}
          originY={ORIGIN_Y - 12}
          unit={UNIT}
          theme={theme}
          gridStep={1.25}
        />

        {bars.map((bar, idx) => {
          const tStart = itemTimings[idx]?.startFrame ?? 10 + idx * 18;
          const growP = interpolate(frame, [tStart, tStart + 32], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const targetH = Math.max(0.6, (bar.value / maxVal) * maxBarH);
          const curH = targetH * growP;

          // 沿沙盘横对角线均匀排布，左右对称
          const frac = count === 1 ? 0.5 : idx / (count - 1);
          const cx = 2.6 + frac * 4.8;
          const cy = 7.4 - frac * 4.8;
          const color = resolveIsoColor(
            bar.tone ?? (bar.featured ? "blue" : "neutral"),
            theme.isDark,
          );

          return (
            <g key={idx}>
              <IsoBox
                cx={cx}
                cy={cy}
                z={0}
                w={1.75}
                d={1.75}
                h={curH}
                color={color}
                originX={ORIGIN_X}
                originY={ORIGIN_Y - 12}
                unit={UNIT}
                opacity={growP > 0.01 ? 1 : 0}
                layerLines={Math.max(3, Math.round(targetH * 2.2))}
              />
              {growP > 0.25 && (
                <IsoCallout
                  cx={cx}
                  cy={cy}
                  zTop={curH}
                  label={`${bar.prefix ?? ""}${Math.round(bar.value * growP)}${bar.suffix ?? ""}`}
                  sub={bar.label}
                  stemHeight={40}
                  originX={ORIGIN_X}
                  originY={ORIGIN_Y - 12}
                  unit={UNIT}
                  theme={theme}
                  accent={bar.featured}
                  opacity={Math.min(1, (growP - 0.25) * 2)}
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        width: "100%",
      }}
    >
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

      {scene.mode === "bars" ? renderBars() : renderCrowd()}

      {scene.caption && (
        <div
          style={{
            fontSize: 22,
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
