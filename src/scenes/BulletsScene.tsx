import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BulletsScene as BulletsSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: BulletsSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const BulletsScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleProgress = spring({
    frame,
    fps,
    config: motion.spring,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isVertical ? "stretch" : "center",
        gap: isVertical ? 44 : 36,
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 56 : 54,
          fontWeight: 800,
          lineHeight: 1.25,
          textAlign: isVertical ? "left" : "center",
          color: theme.colors.textPrimary,
          opacity: titleProgress,
          transform: `translateY(${(1 - titleProgress) * 18}px)`,
        }}
      >
        <HighlightText text={scene.title} theme={theme} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isVertical ? 26 : 20,
          width: "100%",
          maxWidth: isVertical ? "100%" : 1160,
        }}
      >
        {scene.bullets.map((text, idx) => {
          const timing = itemTimings[idx] ?? { startFrame: 18 + idx * 40, endFrame: 9999 };
          const hasEntered = frame >= timing.startFrame;
          const nextTiming = itemTimings[idx + 1];
          const isPast = nextTiming ? frame >= nextTiming.startFrame : false;
          const isActive = hasEntered && !isPast;

          const enterSpring = hasEntered
            ? spring({
                frame: frame - timing.startFrame,
                fps,
                config: motion.spring,
              })
            : 0;

          const targetOpacity = !hasEntered
            ? 0
            : isActive
              ? enterSpring
              : motion.dimmedOpacity;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                padding: isVertical ? "28px 30px" : "24px 32px",
                borderRadius: 20,
                backgroundColor: isActive
                  ? theme.colors.surfaceActive
                  : theme.colors.surface,
                border: `1.5px solid ${
                  isActive ? theme.colors.borderActive : theme.colors.border
                }`,
                opacity: targetOpacity,
                transform: `translateX(${(1 - enterSpring) * 36}px)`,
              }}
            >
              <div
                style={{
                  width: 7,
                  alignSelf: "stretch",
                  minHeight: 40,
                  borderRadius: 99,
                  backgroundColor: isActive
                    ? theme.colors.accent
                    : theme.colors.textMuted,
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  fontSize: isVertical ? 38 : 34,
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1.45,
                  color: isActive
                    ? theme.colors.textPrimary
                    : theme.colors.textSecondary,
                }}
              >
                <HighlightText text={text} theme={theme} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
