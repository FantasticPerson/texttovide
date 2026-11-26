import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GridScene as GridSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: GridSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const GridScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;
  const cols = isVertical ? 2 : scene.columns;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isVertical ? 32 : 36,
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
          }}
        >
          <HighlightText text={scene.title} theme={theme} />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: isVertical ? 20 : 22,
          width: "100%",
          maxWidth: isVertical ? "100%" : 1480,
        }}
      >
        {scene.cards.map((card, idx) => {
          const timing = itemTimings[idx] ?? { startFrame: 8 + idx * 6, endFrame: 9999 };
          const entered = frame >= timing.startFrame;
          const s = entered
            ? spring({ frame: frame - timing.startFrame, fps, config: motion.spring })
            : 0;

          const isFeatured = Boolean(card.featured);
          const cardBg = isFeatured
            ? theme.isDark
              ? theme.colors.surfaceActive
              : "#18221F"
            : theme.colors.surface;
          const cardTitleColor = isFeatured
            ? theme.isDark
              ? theme.colors.accent
              : "#FDF5D7"
            : theme.colors.textPrimary;
          const cardDescColor = isFeatured
            ? theme.isDark
              ? theme.colors.textPrimary
              : "#CBD5E1"
            : theme.colors.textSecondary;

          return (
            <div
              key={idx}
              style={{
                padding: isVertical ? "24px 22px" : "28px 28px",
                borderRadius: 18,
                backgroundColor: cardBg,
                border: `1.5px solid ${
                  isFeatured ? theme.colors.borderActive : theme.colors.border
                }`,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: isVertical ? 140 : 156,
                justifyContent: "space-between",
                opacity: entered ? s : 0,
                transform: `translateY(${(1 - s) * 18}px)`,
              }}
            >
              {card.tag && (
                <div
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: 18,
                    fontWeight: 700,
                    color: isFeatured ? theme.colors.accent : theme.colors.textMuted,
                    letterSpacing: "0.06em",
                  }}
                >
                  {card.tag}
                </div>
              )}

              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: isVertical ? 30 : 32,
                  fontWeight: 800,
                  color: cardTitleColor,
                  lineHeight: 1.25,
                }}
              >
                {card.title}
              </div>

              {card.desc && (
                <div
                  style={{
                    fontSize: isVertical ? 22 : 22,
                    color: cardDescColor,
                    lineHeight: 1.4,
                  }}
                >
                  {card.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
