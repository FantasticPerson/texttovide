import React from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MediaScene as MediaSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: MediaSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const MediaScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;
  const variant = scene.variant ?? "plain";

  const imgProgress = spring({
    frame,
    fps,
    config: motion.spring,
  });

  const boxStart = itemTimings[1]?.startFrame ?? Math.round(0.9 * fps);
  const boxProgress =
    frame >= boxStart
      ? spring({ frame: frame - boxStart, fps, config: motion.spring })
      : 0;

  const imgSrc =
    scene.image.startsWith("http://") || scene.image.startsWith("https://")
      ? scene.image
      : staticFile(scene.image);

  const maxImgHeight = isVertical ? 760 : variant === "browser" ? 560 : 620;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 44 : 46,
          fontWeight: 800,
          color: theme.colors.textPrimary,
          textAlign: "center",
        }}
      >
        <HighlightText text={scene.title} theme={theme} />
      </div>

      <div
        style={{
          position: "relative",
          maxWidth: isVertical ? "100%" : 1240,
          borderRadius: variant === "illustration" ? 22 : 18,
          overflow: "hidden",
          border:
            variant === "illustration"
              ? `1px solid ${theme.colors.border}`
              : `1.5px solid ${theme.colors.border}`,
          backgroundColor: variant === "browser" ? theme.colors.windowBg : "transparent",
          boxShadow:
            variant === "illustration"
              ? "0 16px 44px rgba(0, 0, 0, 0.14)"
              : "0 22px 58px rgba(0, 0, 0, 0.30)",
          opacity: imgProgress,
          transform: `scale(${0.96 + 0.04 * imgProgress})`,
        }}
      >
        {/* 浏览器装裱顶栏（专用于真实网页截图） */}
        {variant === "browser" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 18px",
              backgroundColor: theme.colors.windowHeaderBg,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#EF4444" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#F59E0B" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#10B981" }} />
            </div>
            <div
              style={{
                padding: "4px 20px",
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.06)",
                fontFamily: theme.fonts.mono,
                fontSize: 15,
                color: "#94A3B8",
              }}
            >
              {scene.urlLabel ?? "https://"}
            </div>
            <div style={{ width: 46 }} />
          </div>
        )}

        <div style={{ position: "relative" }}>
          <Img
            src={imgSrc}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: maxImgHeight,
              objectFit: "contain",
            }}
          />

          {scene.highlightBox && (
            <div
              style={{
                position: "absolute",
                left: `${scene.highlightBox.x}%`,
                top: `${scene.highlightBox.y}%`,
                width: `${scene.highlightBox.w}%`,
                height: `${scene.highlightBox.h}%`,
                border: `4px solid ${theme.colors.accent}`,
                borderRadius: 10,
                boxShadow: `0 0 0 4px ${theme.colors.accentSoft}`,
                opacity: boxProgress,
                transform: `scale(${1.06 - 0.06 * boxProgress})`,
              }}
            />
          )}
        </div>
      </div>

      {scene.caption && (
        <div
          style={{
            fontSize: 24,
            color: theme.colors.textSecondary,
            textAlign: "center",
          }}
        >
          {scene.caption}
        </div>
      )}
    </div>
  );
};
