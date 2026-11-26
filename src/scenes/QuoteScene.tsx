import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { QuoteScene as QuoteSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: QuoteSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const QuoteScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const p0 = spring({
    frame: Math.max(0, frame - (itemTimings[0]?.startFrame ?? 8)),
    fps,
    config: motion.spring,
  });
  const p1 = spring({
    frame: Math.max(0, frame - (itemTimings[1]?.startFrame ?? 26)),
    fps,
    config: motion.spring,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isVertical ? "flex-start" : "center",
        gap: 32,
        width: "100%",
      }}
    >
      {scene.highlight && (
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: isVertical ? 88 : 96,
            fontWeight: 900,
            lineHeight: 1.1,
            color: theme.colors.accent,
            letterSpacing: "-0.02em",
            opacity: p0,
            transform: `translateY(${(1 - p0) * 20}px)`,
          }}
        >
          {scene.highlight}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 28,
          padding: isVertical ? "34px 34px" : "40px 48px",
          borderRadius: 24,
          backgroundColor: theme.colors.surface,
          border: `1.5px solid ${theme.colors.border}`,
          maxWidth: isVertical ? "100%" : 1240,
          width: "100%",
          opacity: p1,
          transform: `translateY(${(1 - p1) * 22}px)`,
        }}
      >
        <div
          style={{
            width: 8,
            borderRadius: 99,
            backgroundColor: theme.colors.accent,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: isVertical ? 44 : 46,
            fontWeight: 700,
            lineHeight: 1.48,
            textWrap: "balance",
            color: theme.colors.textPrimary,
          }}
        >
          <HighlightText text={scene.quote} theme={theme} />
        </div>
      </div>

      {scene.caption && (
        <div
          style={{
            fontSize: 26,
            color: theme.colors.textSecondary,
            opacity: p1,
          }}
        >
          {scene.caption}
        </div>
      )}
    </div>
  );
};
