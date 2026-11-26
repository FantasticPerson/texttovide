import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FlowScene as FlowSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: FlowSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const FlowScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isVertical ? "stretch" : "center",
        gap: isVertical ? 36 : 48,
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 54 : 54,
          fontWeight: 800,
          lineHeight: 1.25,
          textAlign: isVertical ? "left" : "center",
          color: theme.colors.textPrimary,
        }}
      >
        <HighlightText text={scene.title} theme={theme} />
      </div>

      {/* 16:9 横向流程图；9:16 纵向流程图 */}
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: isVertical ? "stretch" : "stretch",
          justifyContent: "center",
          gap: isVertical ? 0 : 18,
          width: "100%",
          maxWidth: isVertical ? "100%" : 1520,
        }}
      >
        {scene.steps.map((step, idx) => {
          const timing = itemTimings[idx] ?? { startFrame: 16 + idx * 36, endFrame: 9999 };
          const nextTiming = itemTimings[idx + 1];
          const hasEntered = frame >= timing.startFrame;
          const isPast = nextTiming ? frame >= nextTiming.startFrame : false;
          const isActive = hasEntered && !isPast;
          const isLast = idx === scene.steps.length - 1;

          const s = hasEntered
            ? spring({ frame: frame - timing.startFrame, fps, config: motion.spring })
            : 0;

          if (!isVertical) {
            return (
              <React.Fragment key={idx}>
                <div
                  style={{
                    flex: 1,
                    padding: "32px 28px",
                    borderRadius: 20,
                    backgroundColor: isActive
                      ? theme.colors.surfaceActive
                      : theme.colors.surface,
                    border: `1.5px solid ${
                      isActive ? theme.colors.borderActive : theme.colors.border
                    }`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    opacity: !hasEntered
                      ? 0
                      : isActive
                        ? s
                        : 0.65,
                    transform: `translateY(${(1 - s) * 20}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: theme.fonts.mono,
                      fontSize: 22,
                      fontWeight: 800,
                      backgroundColor: isActive
                        ? theme.colors.accent
                        : theme.colors.accentSoft,
                      color: isActive ? theme.colors.accentText : theme.colors.accent,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 32,
                      fontWeight: 800,
                      color: isActive
                        ? theme.colors.accent
                        : theme.colors.textPrimary,
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontSize: 25,
                      lineHeight: 1.5,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {step.detail}
                  </div>
                </div>

                {!isLast && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: hasEntered ? theme.colors.accent : theme.colors.border,
                      fontSize: 32,
                      fontWeight: 700,
                      opacity: hasEntered ? 0.85 : 0.2,
                    }}
                  >
                    →
                  </div>
                )}
              </React.Fragment>
            );
          }

          return (
            <div key={idx} style={{ display: "flex", gap: 22 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 52,
                  flexShrink: 0,
                  opacity: hasEntered ? (isActive ? s : 0.65) : 0.2,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: theme.fonts.mono,
                    fontSize: 22,
                    fontWeight: 800,
                    backgroundColor: isActive
                      ? theme.colors.accent
                      : theme.colors.surface,
                    color: isActive ? theme.colors.accentText : theme.colors.textPrimary,
                    border: `2px solid ${
                      isActive ? theme.colors.accent : theme.colors.border
                    }`,
                  }}
                >
                  {idx + 1}
                </div>
                {!isLast && (
                  <div
                    style={{
                      width: 3,
                      flex: 1,
                      minHeight: 32,
                      margin: "6px 0",
                      backgroundColor: hasEntered
                        ? theme.colors.borderActive
                        : theme.colors.border,
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  marginBottom: isLast ? 0 : 20,
                  padding: "22px 26px",
                  borderRadius: 18,
                  backgroundColor: isActive
                    ? theme.colors.surfaceActive
                    : theme.colors.surface,
                  border: `1.5px solid ${
                    isActive ? theme.colors.borderActive : theme.colors.border
                  }`,
                  opacity: !hasEntered ? 0 : isActive ? s : motion.dimmedOpacity,
                  transform: `translateY(${(1 - s) * 18}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    color: isActive
                      ? theme.colors.accent
                      : theme.colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    lineHeight: 1.4,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {step.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
