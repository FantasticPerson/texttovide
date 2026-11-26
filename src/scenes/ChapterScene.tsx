import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChapterScene as ChapterSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: ChapterSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const ChapterScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const p0 = spring({
    frame: Math.max(0, frame - (itemTimings[0]?.startFrame ?? 4)),
    fps,
    config: motion.spring,
  });
  const p1 = spring({
    frame: Math.max(0, frame - (itemTimings[1]?.startFrame ?? Math.round(0.7 * fps))),
    fps,
    config: motion.spring,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 28,
      }}
    >
      {scene.number && (
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: isVertical ? 30 : 28,
            fontWeight: 700,
            color: theme.colors.accent,
            letterSpacing: "0.18em",
            opacity: p0,
          }}
        >
          {scene.number}
        </div>
      )}

      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 64 : 72,
          fontWeight: 800,
          lineHeight: 1.3,
          color: theme.colors.textPrimary,
          textWrap: "balance",
          maxWidth: isVertical ? "100%" : 1360,
          opacity: p0,
          transform: `translateY(${(1 - p0) * 20}px)`,
        }}
      >
        <HighlightText text={scene.title} theme={theme} />
      </div>

      {scene.subline && (
        <div
          style={{
            fontSize: isVertical ? 32 : 30,
            color: theme.colors.textSecondary,
            fontWeight: 500,
            opacity: p1,
            transform: `translateY(${(1 - p1) * 14}px)`,
          }}
        >
          {scene.subline}
        </div>
      )}
    </div>
  );
};
