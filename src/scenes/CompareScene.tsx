import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CompareScene as CompareSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: CompareSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const CompareScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const beforeStart = itemTimings[0]?.startFrame ?? 16;
  const afterStart = itemTimings[1]?.startFrame ?? 68;

  const beforeEntered = frame >= beforeStart;
  const afterEntered = frame >= afterStart;

  const beforeSpring = beforeEntered
    ? spring({ frame: frame - beforeStart, fps, config: motion.spring })
    : 0;
  const afterSpring = afterEntered
    ? spring({ frame: frame - afterStart, fps, config: motion.spring })
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isVertical ? "stretch" : "center",
        gap: isVertical ? 32 : 40,
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

      {/* 16:9 左右并排对照；9:16 上下对照 */}
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: "stretch",
          justifyContent: "center",
          gap: isVertical ? 24 : 32,
          width: "100%",
          maxWidth: isVertical ? "100%" : 1440,
        }}
      >
        {/* 左侧 / 上方：旧做法 */}
        <div
          style={{
            flex: 1,
            padding: isVertical ? "28px 30px" : "36px 38px",
            borderRadius: 22,
            backgroundColor: theme.colors.negativeBg,
            border: `1.5px solid ${theme.colors.negativeBorder}`,
            opacity: beforeEntered ? (afterEntered ? 0.65 : beforeSpring) : 0,
            transform: `translateY(${(1 - beforeSpring) * 24}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "6px 16px",
              borderRadius: 999,
              backgroundColor: theme.colors.negativeBg,
              border: `1px solid ${theme.colors.negativeBorder}`,
              color: theme.colors.negative,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            ✕ {scene.before.label}
          </div>
          {scene.before.points.map((pt, i) => (
            <div
              key={i}
              style={{
                fontSize: isVertical ? 32 : 30,
                lineHeight: 1.5,
                color: theme.colors.textPrimary,
                fontWeight: 500,
              }}
            >
              · {pt}
            </div>
          ))}
        </div>

        {/* 方向箭头 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: afterEntered ? afterSpring : 0,
            color: theme.colors.accent,
            fontSize: 38,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {isVertical ? "↓" : "→"}
        </div>

        {/* 右侧 / 下方：新做法 */}
        <div
          style={{
            flex: 1,
            padding: isVertical ? "28px 30px" : "36px 38px",
            borderRadius: 22,
            backgroundColor: theme.colors.positiveBg,
            border: `1.5px solid ${theme.colors.positiveBorder}`,
            opacity: afterEntered ? afterSpring : 0,
            transform: `translateY(${(1 - afterSpring) * 28}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "6px 16px",
              borderRadius: 999,
              backgroundColor: theme.colors.positiveBg,
              border: `1px solid ${theme.colors.positiveBorder}`,
              color: theme.colors.positive,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            ✓ {scene.after.label}
          </div>
          {scene.after.points.map((pt, i) => (
            <div
              key={i}
              style={{
                fontSize: isVertical ? 32 : 30,
                lineHeight: 1.5,
                color: theme.colors.textPrimary,
                fontWeight: 700,
              }}
            >
              · {pt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
