import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThemeTokens, getSafeArea, motion } from "../theme";
import { Background } from "./Background";

interface SceneShellProps {
  theme: ThemeTokens;
  durationInFrames: number;
  sceneIndex: number;
  totalScenes: number;
  kicker?: string;
  subtitle?: string;
  hasChapters?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  hideTopMeta?: boolean;
  children: React.ReactNode;
}

export const SceneShell: React.FC<SceneShellProps> = ({
  theme,
  durationInFrames,
  sceneIndex,
  totalScenes,
  kicker,
  subtitle,
  hasChapters = false,
  isFirst = false,
  isLast = false,
  hideTopMeta = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeArea(width, height, hasChapters);
  const isVertical = height > width;

  const enterFrames = Math.max(1, Math.round(motion.enterSec * fps));
  const exitFrames = Math.max(
    1,
    Math.round((isLast ? 0.5 : motion.exitSec) * fps),
  );

  const enterOpacity = interpolate(frame, [0, enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enterY = interpolate(frame, [0, enterFrames], [isFirst ? 14 : 20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitStart = Math.max(enterFrames, durationInFrames - exitFrames);
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const exitY = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, isLast ? 0 : -12],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const contentOpacity = enterOpacity * exitOpacity;
  const translateY = enterY + exitY;

  return (
    <AbsoluteFill>
      <Background theme={theme} />

      <AbsoluteFill
        style={{
          paddingTop: safeArea.top,
          paddingRight: safeArea.right,
          paddingBottom: safeArea.bottom,
          paddingLeft: safeArea.left,
          fontFamily: theme.fonts.sans,
          color: theme.colors.textPrimary,
          display: "flex",
          flexDirection: "column",
          opacity: contentOpacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {/* 顶部轻量角标 + 编号 */}
        {!hideTopMeta && (kicker || isVertical) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: isVertical ? 36 : 24,
              minHeight: 36,
            }}
          >
            {kicker ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 18px",
                  borderRadius: 999,
                  backgroundColor: theme.colors.accentSoft,
                  border: `1px solid ${theme.colors.borderActive}`,
                  color: theme.colors.accent,
                  fontSize: isVertical ? 26 : 22,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: theme.colors.accent,
                  }}
                />
                {kicker}
              </div>
            ) : (
              <div />
            )}

            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: isVertical ? 22 : 20,
                color: theme.colors.textMuted,
                letterSpacing: "0.08em",
              }}
            >
              {String(sceneIndex + 1).padStart(2, "0")} /{" "}
              {String(totalScenes).padStart(2, "0")}
            </div>
          </div>
        )}

        {/* 主内容区 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      </AbsoluteFill>

      {/* 底部单行短字幕安全区（复刻参考视频：极简不抢画面） */}
      {subtitle && (
        <div
          style={{
            position: "absolute",
            left: isVertical ? 60 : 120,
            right: isVertical ? 60 : 120,
            bottom: isVertical ? 250 : 44,
            display: "flex",
            justifyContent: "center",
            opacity: contentOpacity,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: theme.colors.subtitleBg === "transparent" ? "4px 12px" : "8px 24px",
              borderRadius: 8,
              backgroundColor: theme.colors.subtitleBg,
              color: theme.colors.subtitleText,
              fontFamily: theme.fonts.sans,
              fontSize: isVertical ? 32 : 28,
              fontWeight: 500,
              letterSpacing: "0.06em",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
