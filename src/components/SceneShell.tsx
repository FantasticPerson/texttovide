import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CameraMotion, TransitionType } from "../schema/storyboard";
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
  transition?: TransitionType;
  camera?: CameraMotion;
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
  transition = "fade",
  camera = "none",
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeArea(width, height, hasChapters);
  const isVertical = height > width;

  const enterFrames = Math.max(
    1,
    Math.round((transition === "wipe" || transition === "slide-left" ? 0.36 : motion.enterSec) * fps),
  );
  const exitFrames = Math.max(
    1,
    Math.round((isLast ? 0.5 : motion.exitSec) * fps),
  );
  const exitStart = Math.max(enterFrames, durationInFrames - exitFrames);

  const enterP = interpolate(frame, [0, enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const exitP = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const contentOpacity =
    transition === "wipe"
      ? (1 - exitP)
      : enterP * (1 - exitP);

  // 通用转场几何变换
  let tx = 0;
  let ty = 0;
  let tScale = 1;
  let clipPath: string | undefined;

  if (transition === "fade") {
    ty = (1 - enterP) * (isFirst ? 14 : 20) + exitP * (isLast ? 0 : -12);
  } else if (transition === "slide-up") {
    ty = (1 - enterP) * 64 + exitP * (isLast ? 0 : -36);
  } else if (transition === "slide-left") {
    tx = (1 - enterP) * 96 + exitP * (isLast ? 0 : -64);
  } else if (transition === "zoom") {
    tScale = (0.91 + 0.09 * enterP) * (1 + (isLast ? 0 : 0.045 * exitP));
  } else if (transition === "wipe") {
    const rightInset = (1 - enterP) * 100;
    clipPath = rightInset > 0.1 ? `inset(0 ${rightInset}% 0 0)` : undefined;
  }

  // 持续镜头呼吸运动（推荐仅用于配图/插画屏；纯文字 UI 屏默认 none 以避免 Chromium 亚像素抖动）
  const camP = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  let camScale = 1;
  let camX = 0;
  if (camera === "zoom-in") {
    camScale = 1 + 0.042 * camP;
  } else if (camera === "zoom-out") {
    camScale = 1.042 - 0.042 * camP;
  } else if (camera === "pan-left") {
    camScale = 1.02;
    camX = 18 - 36 * camP;
  } else if (camera === "pan-right") {
    camScale = 1.02;
    camX = -18 + 36 * camP;
  }

  const isShellIdle = Math.abs(tx) < 0.05 && Math.abs(ty) < 0.05 && Math.abs(tScale - 1) < 0.0005;
  const shellTransform = isShellIdle
    ? undefined
    : `translate3d(${tx}px, ${ty}px, 0) scale(${tScale})`;
  const stageTransform =
    camera === "none" ? undefined : `translate3d(${camX}px, 0, 0) scale(${camScale})`;

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
          transform: shellTransform,
          clipPath,
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
            transform: stageTransform,
            transformOrigin: "center center",
            willChange: stageTransform ? "transform" : undefined,
            backfaceVisibility: stageTransform ? "hidden" : undefined,
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
