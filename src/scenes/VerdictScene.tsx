import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { VerdictScene as VerdictSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: VerdictSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const VerdictScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleS = spring({ frame, fps, config: motion.spring });

  const renderJudge = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        width: "100%",
        maxWidth: isVertical ? "100%" : 980,
      }}
    >
      {scene.items.map((item, idx) => {
        const tStart = itemTimings[idx]?.startFrame ?? 10 + idx * 24;
        const s =
          frame >= tStart
            ? spring({ frame: frame - tStart, fps, config: motion.spring })
            : 0;
        const stampStart = tStart + 10;
        const stampS =
          frame >= stampStart
            ? spring({
                frame: frame - stampStart,
                fps,
                config: { damping: 14, stiffness: 220, mass: 0.7 },
              })
            : 0;

        const isFail = item.status === "fail";
        const isPass = item.status === "pass";
        const badgeColor = isFail
          ? "#EF4444"
          : isPass
            ? theme.colors.accent
            : theme.colors.textMuted;

        return (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 32,
              padding: isVertical ? "28px 30px" : "30px 44px",
              borderRadius: 22,
              backgroundColor: isPass
                ? theme.colors.surfaceActive
                : theme.colors.surface,
              border: `1.5px solid ${
                isPass
                  ? theme.colors.borderActive
                  : isFail
                    ? "rgba(239, 68, 68, 0.35)"
                    : theme.colors.border
              }`,
              opacity: s,
              transform: `translateY(${(1 - s) * 20}px)`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: isVertical ? 44 : 48,
                  fontWeight: 800,
                  color: isFail
                    ? theme.colors.textSecondary
                    : theme.colors.textPrimary,
                  textDecoration: isFail && stampS > 0.6 ? "line-through" : "none",
                  textDecorationColor: "rgba(239, 68, 68, 0.7)",
                }}
              >
                <HighlightText text={item.label} theme={theme} />
              </div>
              {item.detail && (
                <div
                  style={{
                    fontSize: 24,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {item.detail}
                </div>
              )}
            </div>

            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: isFail
                  ? "rgba(239, 68, 68, 0.14)"
                  : isPass
                    ? theme.colors.accentSoft
                    : "rgba(148,163,184,0.12)",
                border: `2.5px solid ${badgeColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                opacity: stampS,
                transform: `scale(${1.35 - 0.35 * stampS})`,
              }}
            >
              <svg width={36} height={36} viewBox="0 0 36 36">
                {isFail ? (
                  <>
                    <line
                      x1={9}
                      y1={9}
                      x2={27}
                      y2={27}
                      stroke={badgeColor}
                      strokeWidth={4.5}
                      strokeLinecap="round"
                    />
                    <line
                      x1={27}
                      y1={9}
                      x2={9}
                      y2={27}
                      stroke={badgeColor}
                      strokeWidth={4.5}
                      strokeLinecap="round"
                    />
                  </>
                ) : (
                  <polyline
                    points="7,19 15,27 29,11"
                    fill="none"
                    stroke={badgeColor}
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPills = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 22,
        width: "100%",
        maxWidth: isVertical ? "100%" : 760,
      }}
    >
      {scene.items.map((item, idx) => {
        const timing = itemTimings[idx] ?? { startFrame: 8 + idx * 36, endFrame: 9999 };
        const nextTiming = itemTimings[idx + 1];
        const hasEntered = frame >= timing.startFrame;
        const isPast = nextTiming ? frame >= nextTiming.startFrame : false;
        const isActive = hasEntered && !isPast;
        const enterS = hasEntered
          ? spring({ frame: frame - timing.startFrame, fps, config: motion.spring })
          : 0;
        const underlinePct = isActive
          ? interpolate(frame, [timing.startFrame, timing.startFrame + 16], [0, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        return (
          <div
            key={idx}
            style={{
              position: "relative",
              padding: "26px 34px",
              borderRadius: 18,
              backgroundColor: isActive
                ? theme.colors.surfaceActive
                : theme.colors.surface,
              border: `1.5px solid ${
                isActive ? theme.colors.borderActive : theme.colors.border
              }`,
              boxShadow: isActive
                ? `0 0 30px ${theme.colors.accentSoft}`
                : "none",
              display: "flex",
              alignItems: "center",
              gap: 22,
              overflow: "hidden",
              opacity: !hasEntered ? 0.18 : isActive ? enterS : 0.42,
              transform: `scale(${isActive ? 1.03 : 0.99}) translateX(${
                hasEntered ? (1 - enterS) * 20 : 0
              }px)`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: isActive
                  ? theme.colors.accent
                  : theme.colors.accentSoft,
                color: isActive ? theme.colors.accentText : theme.colors.accent,
                fontFamily: theme.fonts.mono,
                fontSize: 20,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              0{idx + 1}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 32,
                  fontWeight: 800,
                  color: isActive
                    ? theme.colors.textPrimary
                    : theme.colors.textSecondary,
                }}
              >
                {item.label}
              </div>
              {item.detail && (
                <div style={{ fontSize: 22, color: theme.colors.textSecondary }}>
                  {item.detail}
                </div>
              )}
            </div>

            {/* 激活胶囊底部高亮进度线 */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: 3.5,
                  width: `${underlinePct}%`,
                  backgroundColor: theme.colors.accent,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

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
      {scene.title && (
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
      )}

      {scene.mode === "pills" ? renderPills() : renderJudge()}
    </div>
  );
};
