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

  const renderLine = () => {
    const svgW = 1160;
    const svgH = 380;
    const padL = 70;
    const padR = 70;
    const padT = 56;
    const padB = 64;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;

    const vals = scene.items.map((it) => it.value);
    const minV = Math.min(0, ...vals);
    const maxV = Math.max(1, ...scene.items.map((it) => it.max ?? it.value));
    const spanV = Math.max(1, maxV - minV);

    const pts = scene.items.map((it, i) => {
      const x =
        scene.items.length === 1
          ? padL + plotW / 2
          : padL + (i / (scene.items.length - 1)) * plotW;
      const y = padT + plotH - ((it.value - minV) / spanV) * plotH;
      return { x, y, item: it };
    });

    const lineD = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

    const drawStart = 8;
    const drawDur = 42;
    const drawP = interpolate(frame, [drawStart, drawStart + drawDur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    const clipW = padL + plotW * drawP + 12;
    const gradId = `line-area-${scene.id}`;
    const clipId = `line-clip-${scene.id}`;

    return (
      <div
        style={{
          width: "100%",
          maxWidth: isVertical ? "100%" : 1260,
          padding: "30px 36px 24px",
          borderRadius: 24,
          backgroundColor: theme.colors.surface,
          border: `1.5px solid ${theme.colors.border}`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ maxWidth: svgW, overflow: "visible" }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.colors.accent} stopOpacity={0.32} />
              <stop offset="100%" stopColor={theme.colors.accent} stopOpacity={0.0} />
            </linearGradient>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={clipW} height={svgH} />
            </clipPath>
          </defs>

          {/* 水平参考网格线 */}
          {[0, 0.33, 0.66, 1].map((r, idx) => {
            const y = padT + plotH * (1 - r);
            return (
              <line
                key={idx}
                x1={padL}
                y1={y}
                x2={svgW - padR}
                y2={y}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray={idx === 0 ? undefined : "6 6"}
              />
            );
          })}

          {/* 渐变面积填充（随折线从左向右揭开） */}
          <path d={areaD} fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />

          {/* 主趋势折线 */}
          <path
            d={lineD}
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={(1 - drawP) * 100}
          />

          {/* 数据点与数值标注 */}
          {pts.map((pt, i) => {
            const ratio = pts.length === 1 ? 0 : i / (pts.length - 1);
            const ptStart = drawStart + Math.round(ratio * drawDur);
            const ptS =
              frame >= ptStart
                ? spring({ frame: frame - ptStart, fps, config: motion.spring })
                : 0;
            const featured = Boolean(pt.item.featured);
            return (
              <g key={i}>
                {/* X 轴标签 */}
                <text
                  x={pt.x}
                  y={padT + plotH + 38}
                  textAnchor="middle"
                  fill={featured ? theme.colors.accent : theme.colors.textSecondary}
                  fontFamily={theme.fonts.heading}
                  fontSize={22}
                  fontWeight={featured ? 800 : 600}
                >
                  {pt.item.label}
                </text>

                {ptS > 0.01 && (
                  <g opacity={ptS}>
                    {featured && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={16 * ptS}
                        fill={theme.colors.accent}
                        opacity={0.22}
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={(featured ? 8 : 6) * ptS}
                      fill={theme.colors.bg}
                      stroke={theme.colors.accent}
                      strokeWidth={4}
                    />
                    <text
                      x={pt.x}
                      y={pt.y - (featured ? 22 : 18)}
                      textAnchor="middle"
                      fill={featured ? theme.colors.accent : theme.colors.textPrimary}
                      fontFamily={theme.fonts.mono}
                      fontSize={featured ? 26 : 22}
                      fontWeight={800}
                    >
                      {pt.item.prefix ?? ""}
                      {pt.item.value}
                      {pt.item.suffix ?? ""}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderDonut = () => {
    const total = Math.max(
      1,
      scene.items.reduce((sum, it) => sum + Math.max(0, it.value), 0),
    );
    const palette = theme.isDark
      ? [theme.colors.accent, "#38BDF8", "#F59E0B", "#A78BFA", "#64748B", "#FB7185"]
      : [theme.colors.accent, "#18221F", "#D97706", "#475569", "#94A3B8", "#0F766E"];

    const r = 122;
    const circ = 2 * Math.PI * r;
    const strokeW = 38;
    const size = 320;
    const cx = size / 2;
    const cy = size / 2;

    const ringP = interpolate(frame, [6, 46], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    let accFrac = 0;
    const slices = scene.items.map((item, idx) => {
      const frac = Math.max(0, item.value) / total;
      const startFrac = accFrac;
      accFrac += frac;
      const color = item.featured ? theme.colors.accent : palette[idx % palette.length];
      return { item, idx, frac, startFrac, color };
    });

    const featuredSlice = slices.find((s) => s.item.featured) ?? slices[0];
    const centerPct = Math.round(featuredSlice.frac * 100);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isVertical ? 36 : 64,
          width: "100%",
          maxWidth: isVertical ? "100%" : 1220,
          padding: "36px 46px",
          borderRadius: 24,
          backgroundColor: theme.colors.surface,
          border: `1.5px solid ${theme.colors.border}`,
        }}
      >
        {/* 左侧环形占比图 */}
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={theme.colors.border}
              strokeWidth={strokeW}
            />
            <g transform={`rotate(-90 ${cx} ${cy})`}>
              {slices.map((s) => {
                const segLen = Math.max(0, s.frac * circ * ringP - 3);
                const offset = -s.startFrac * circ * ringP;
                return (
                  <circle
                    key={s.idx}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.item.featured ? strokeW + 4 : strokeW}
                    strokeDasharray={`${segLen} ${circ}`}
                    strokeDashoffset={offset}
                    opacity={s.item.dimmed ? 0.4 : 1}
                  />
                );
              })}
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
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 56,
                fontWeight: 800,
                color: theme.colors.accent,
                lineHeight: 1,
              }}
            >
              <NumberCounter from={0} to={centerPct} startFrame={8} durationFrames={32} />
              <span style={{ fontSize: 28 }}>%</span>
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: theme.colors.textSecondary,
                marginTop: 8,
              }}
            >
              {scene.centerLabel ?? featuredSlice.item.label}
            </div>
          </div>
        </div>

        {/* 右侧图例明细 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            width: "100%",
          }}
        >
          {slices.map((s) => {
            const tStart = itemTimings[s.idx]?.startFrame ?? 10 + s.idx * 10;
            const ent =
              frame >= tStart
                ? spring({ frame: frame - tStart, fps, config: motion.spring })
                : 0;
            const pct = Math.round(s.frac * 100);
            const featured = Boolean(s.item.featured);
            return (
              <div
                key={s.idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "16px 22px",
                  borderRadius: 16,
                  backgroundColor: featured ? theme.colors.surfaceActive : "transparent",
                  border: `1.5px solid ${
                    featured ? theme.colors.borderActive : theme.colors.border
                  }`,
                  opacity: s.item.dimmed ? ent * 0.45 : ent,
                  transform: `translateX(${(1 - ent) * 18}px)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      backgroundColor: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div
                      style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: 25,
                        fontWeight: featured ? 800 : 600,
                        color: featured ? theme.colors.accent : theme.colors.textPrimary,
                      }}
                    >
                      {s.item.label}
                    </div>
                    {s.item.note && (
                      <div style={{ fontSize: 18, color: theme.colors.textMuted }}>
                        {s.item.note}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: 26,
                    fontWeight: 800,
                    color: featured ? theme.colors.accent : theme.colors.textPrimary,
                    whiteSpace: "nowrap",
                  }}
                >
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
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
          : scene.mode === "line"
            ? renderLine()
            : scene.mode === "donut"
              ? renderDonut()
              : renderCards()}
    </div>
  );
};
