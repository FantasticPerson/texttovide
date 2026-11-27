import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MetricsScene as MetricsSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";
import { NumberCounter } from "../motion/NumberCounter";

interface Props {
  scene: MetricsSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const MetricsScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleS = spring({ frame, fps, config: motion.spring });
  const maxVal = Math.max(1, ...scene.items.map((it) => it.max ?? it.value));

  const renderCards = () => {
    const cols = isVertical ? 1 : Math.min(scene.items.length, 3);
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 28,
          width: "100%",
          maxWidth: isVertical ? "100%" : 1380,
        }}
      >
        {scene.items.map((item, idx) => {
          const tStart = itemTimings[idx]?.startFrame ?? 10 + idx * 14;
          const s =
            frame >= tStart
              ? spring({ frame: frame - tStart, fps, config: motion.spring })
              : 0;
          const featured = Boolean(item.featured);
          const dimmed = Boolean(item.dimmed);
          const trendColor =
            item.trend === "down"
              ? theme.colors.accent
              : item.trend === "up"
                ? theme.colors.accent
                : theme.colors.textMuted;

          return (
            <div
              key={idx}
              style={{
                padding: "36px 34px",
                borderRadius: 22,
                backgroundColor: featured
                  ? theme.colors.surfaceActive
                  : theme.colors.surface,
                border: `1.5px solid ${
                  featured ? theme.colors.borderActive : theme.colors.border
                }`,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                opacity: dimmed ? s * 0.45 : s,
                transform: `translateY(${(1 - s) * 22}px)`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 24,
                  fontWeight: 600,
                  color: theme.colors.textSecondary,
                }}
              >
                <span>{item.label}</span>
                {item.trend && item.trend !== "neutral" && (
                  <span
                    style={{
                      fontFamily: theme.fonts.mono,
                      fontSize: 24,
                      fontWeight: 800,
                      color: trendColor,
                    }}
                  >
                    {item.trend === "up" ? "↑" : "↓"}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: isVertical ? 64 : 70,
                  fontWeight: 800,
                  color: featured ? theme.colors.accent : theme.colors.textPrimary,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {item.prefix ?? ""}
                <NumberCounter
                  from={0}
                  to={item.value}
                  startFrame={tStart + 4}
                  durationFrames={26}
                />
                <span style={{ fontSize: 32, marginLeft: 6, fontWeight: 700 }}>
                  {item.suffix ?? ""}
                </span>
              </div>

              {item.note && (
                <div
                  style={{
                    fontSize: 22,
                    color: theme.colors.textMuted,
                    lineHeight: 1.4,
                  }}
                >
                  {item.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderGauges = () => {
    const r = 84;
    const circ = 2 * Math.PI * r;
    // 270 度环形表盘
    const arcLen = circ * 0.75;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          justifyContent: "center",
          alignItems: "stretch",
          gap: 36,
          width: "100%",
          maxWidth: isVertical ? "100%" : 1260,
        }}
      >
        {scene.items.map((item, idx) => {
          const tStart = itemTimings[idx]?.startFrame ?? 10 + idx * 18;
          const s =
            frame >= tStart
              ? spring({ frame: frame - tStart, fps, config: motion.spring })
              : 0;
          const ratio = Math.min(1, Math.max(0, item.value / (item.max ?? maxVal)));
          const sweep = interpolate(frame, [tStart + 4, tStart + 34], [0, ratio], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const dimmed = Boolean(item.dimmed);
          const featured = Boolean(item.featured);
          const strokeColor = dimmed ? theme.colors.textMuted : theme.colors.accent;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                maxWidth: 480,
                padding: "36px 32px",
                borderRadius: 24,
                backgroundColor: featured
                  ? theme.colors.surfaceActive
                  : theme.colors.surface,
                border: `1.5px solid ${
                  featured ? theme.colors.borderActive : theme.colors.border
                }`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                opacity: dimmed ? s * 0.42 : s,
                transform: `translateY(${(1 - s) * 20}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 28,
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                }}
              >
                {item.label}
              </div>

              <div style={{ position: "relative", width: 210, height: 210 }}>
                <svg width={210} height={210} viewBox="0 0 210 210">
                  <g transform="rotate(135 105 105)">
                    <circle
                      cx={105}
                      cy={105}
                      r={r}
                      fill="none"
                      stroke={theme.colors.border}
                      strokeWidth={14}
                      strokeDasharray={`${arcLen} ${circ}`}
                      strokeLinecap="round"
                    />
                    <circle
                      cx={105}
                      cy={105}
                      r={r}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={14}
                      strokeDasharray={`${arcLen * sweep} ${circ}`}
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: theme.fonts.mono,
                      fontSize: 54,
                      fontWeight: 800,
                      color: dimmed ? theme.colors.textMuted : theme.colors.textPrimary,
                      lineHeight: 1,
                    }}
                  >
                    {item.prefix ?? ""}
                    <NumberCounter
                      from={0}
                      to={item.value}
                      startFrame={tStart + 4}
                      durationFrames={28}
                    />
                  </div>
                  {item.suffix && (
                    <div
                      style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: 19,
                        color: theme.colors.textSecondary,
                        marginTop: 6,
                      }}
                    >
                      {item.suffix}
                    </div>
                  )}
                </div>
              </div>

              {item.note && (
                <div
                  style={{
                    fontSize: 22,
                    color: dimmed ? theme.colors.textMuted : theme.colors.accent,
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {item.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBars = () => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "100%",
          maxWidth: isVertical ? "100%" : 1240,
          padding: "36px 42px",
          borderRadius: 24,
          backgroundColor: theme.colors.surface,
          border: `1.5px solid ${theme.colors.border}`,
        }}
      >
        {scene.items.map((item, idx) => {
          const tStart = itemTimings[idx]?.startFrame ?? 8 + idx * 10;
          const ratio = Math.min(1, Math.max(0.04, item.value / (item.max ?? maxVal)));
          const widthPct = interpolate(frame, [tStart, tStart + 24], [0, ratio * 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const featured = Boolean(item.featured);
          const dimmed = Boolean(item.dimmed);
          const barColor = featured
            ? theme.colors.accent
            : theme.isDark
              ? "rgba(148, 163, 184, 0.35)"
              : "rgba(51, 65, 85, 0.25)";

          return (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: isVertical ? "180px 1fr 110px" : "240px 1fr 140px",
                alignItems: "center",
                gap: 20,
                opacity: dimmed ? 0.45 : 1,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 24,
                  fontWeight: featured ? 800 : 600,
                  color: featured ? theme.colors.accent : theme.colors.textPrimary,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  height: 30,
                  borderRadius: 99,
                  backgroundColor: theme.isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(15,23,42,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${widthPct}%`,
                    borderRadius: 99,
                    backgroundColor: barColor,
                    boxShadow: featured ? `0 0 18px ${theme.colors.accentSoft}` : "none",
                  }}
                />
              </div>

              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: 26,
                  fontWeight: 800,
                  color: featured ? theme.colors.accent : theme.colors.textSecondary,
                }}
              >
                {item.prefix ?? ""}
                <NumberCounter
                  from={0}
                  to={item.value}
                  startFrame={tStart}
                  durationFrames={24}
                />
                {item.suffix ?? ""}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 36,
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 48 : 52,
          fontWeight: 800,
          color: theme.colors.textPrimary,
          textAlign: "center",
          opacity: titleS,
          transform: `translateY(${(1 - titleS) * 16}px)`,
        }}
      >
        <HighlightText text={scene.title} theme={theme} />
      </div>

      {scene.mode === "gauges"
        ? renderGauges()
        : scene.mode === "bars"
          ? renderBars()
          : renderCards()}
    </div>
  );
};
