import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HookScene as HookSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: HookSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const HookScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const mainStart = itemTimings[0]?.startFrame ?? 5;
  const subStart = itemTimings[1]?.startFrame ?? Math.round(1.0 * fps);

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
        alignItems: isVertical ? "flex-start" : "center",
        textAlign: isVertical ? "left" : "center",
        gap: isVertical ? 40 : 34,
        paddingBottom: isVertical ? 50 : 20,
      }}
    >
      <div
        style={{
          width: 88 * mainProgress,
          height: 6,
          borderRadius: 99,
          backgroundColor: theme.colors.accent,
        }}
      />

      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 72 : 76,
          fontWeight: 800,
          lineHeight: 1.28,
          letterSpacing: "-0.01em",
          textWrap: "balance",
          maxWidth: isVertical ? "100%" : 1440,
          color: theme.colors.textPrimary,
          opacity: mainProgress,
          transform: `translateY(${(1 - mainProgress) * 28}px)`,
        }}
      >
        <HighlightText text={scene.headline} theme={theme} />
      </div>

      {scene.subline && (
        <div
          style={{
            fontSize: isVertical ? 38 : 34,
            fontWeight: 500,
            lineHeight: 1.5,
            color: theme.colors.textSecondary,
            paddingLeft: isVertical ? 24 : 0,
            borderLeft: isVertical ? `4px solid ${theme.colors.accent}` : "none",
            opacity: frame >= subStart ? subProgress : 0,
            transform: `translateY(${(1 - subProgress) * 20}px)`,
          }}
        >
          <HighlightText text={scene.subline} theme={theme} />
        </div>
      )}
    </div>
  );
};
