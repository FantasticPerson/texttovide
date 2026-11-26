import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { OutroScene as OutroSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: OutroSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const OutroScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const mainStart = itemTimings[0]?.startFrame ?? 6;
  const subStart = itemTimings[1]?.startFrame ?? Math.round(0.85 * fps);

  const mainProgress = spring({
    frame: Math.max(0, frame - mainStart),
    fps,
    config: motion.spring,
  });

  const subProgress = spring({
    frame: Math.max(0, frame - subStart),
    fps,
    config: motion.spring,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        alignItems: isVertical ? "flex-start" : "center",
        textAlign: isVertical ? "left" : "center",
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 60 : 68,
          fontWeight: 800,
          lineHeight: 1.32,
          textWrap: "balance",
          maxWidth: isVertical ? "100%" : 1360,
          color: theme.colors.textPrimary,
          opacity: mainProgress,
          transform: `translateY(${(1 - mainProgress) * 22}px)`,
        }}
      >
        <HighlightText text={scene.conclusion} theme={theme} />
      </div>

      {scene.subline && (
        <div
          style={{
            fontSize: isVertical ? 32 : 30,
            color: theme.colors.accent,
            fontWeight: 600,
            opacity: frame >= subStart ? subProgress : 0,
            transform: `translateY(${(1 - subProgress) * 16}px)`,
          }}
        >
          {scene.subline}
        </div>
      )}
    </div>
  );
};
