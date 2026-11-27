import React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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

  const boxes = scene.highlightBoxes?.length
    ? scene.highlightBoxes
    : scene.highlightBox
      ? [scene.highlightBox]
      : [];

  const imgSrc =
    scene.image.startsWith("http://") || scene.image.startsWith("https://")
      ? scene.image
      : staticFile(scene.image);

  const maxImgHeight =
    variant === "phone"
      ? isVertical
        ? 720
        : 580
      : isVertical
        ? 760
        : variant === "browser"
          ? 560
          : 620;

  // 可选长图缓慢上移浏览
  const scrollY = scene.scroll
    ? interpolate(frame, [Math.round(0.8 * fps), Math.round(6.5 * fps)], [0, -140], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.sin),
      })
    : 0;

  const isPhone = variant === "phone";

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
          maxWidth: isPhone ? 340 : isVertical ? "100%" : 1240,
          borderRadius: isPhone ? 42 : variant === "illustration" ? 22 : 18,
          overflow: "hidden",
          padding: isPhone ? "14px 12px 16px" : 0,
          border: isPhone
            ? `5px solid ${theme.isDark ? "#334155" : "#1E293B"}`
            : variant === "illustration"
              ? `1px solid ${theme.colors.border}`
              : `1.5px solid ${theme.colors.border}`,
          backgroundColor: isPhone
            ? "#0B0F17"
            : variant === "browser"
              ? theme.colors.windowBg
              : "transparent",
          boxShadow:
            variant === "illustration"
              ? "0 16px 44px rgba(0, 0, 0, 0.14)"
              : "0 22px 58px rgba(0, 0, 0, 0.30)",
          opacity: imgProgress,
          transform: `scale(${0.96 + 0.04 * imgProgress})`,
        }}
      >
        {/* 手机灵动岛顶栏 */}
        {isPhone && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: 10,
            }}
          >
            <div
              style={{
                width: 88,
                height: 20,
                borderRadius: 99,
                backgroundColor: "#000000",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        )}

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

        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: isPhone ? 26 : 0,
            maxHeight: maxImgHeight,
          }}
        >
          <Img
            src={imgSrc}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: scene.scroll ? "none" : maxImgHeight,
              objectFit: "contain",
              transform: scrollY !== 0 ? `translateY(${scrollY}px)` : "none",
            }}
          />

          {/* 多个高亮框：SVG 一笔描边绘制 + 标签弹出 */}
          {boxes.map((box, bIdx) => {
            const boxStart =
              itemTimings[bIdx + 1]?.startFrame ?? Math.round((0.8 + bIdx * 1.1) * fps);
            const draw = interpolate(frame, [boxStart, boxStart + 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            if (draw <= 0.001) return null;

            const boxColor = box.color ?? theme.colors.accent;

            return (
              <div
                key={bIdx}
                style={{
                  position: "absolute",
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                  pointerEvents: "none",
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ display: "block", overflow: "visible" }}
                >
                  <rect
                    x={0}
                    y={0}
                    width={100}
                    height={100}
                    rx={2}
                    ry={2}
                    pathLength={100}
                    fill={theme.colors.accentSoft}
                    fillOpacity={0.28 * draw}
                    stroke={boxColor}
                    strokeWidth={3.5}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray={100}
                    strokeDashoffset={(1 - draw) * 100}
                  />
                </svg>

                {box.label && draw > 0.6 && (
                  <div
                    style={{
                      position: "absolute",
                      top: -32,
                      left: 0,
                      padding: "3px 12px",
                      borderRadius: 6,
                      backgroundColor: boxColor,
                      color: theme.colors.accentText,
                      fontFamily: theme.fonts.heading,
                      fontSize: 16,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      opacity: interpolate(draw, [0.6, 1], [0, 1]),
                    }}
                  >
                    {box.label}
                  </div>
                )}
              </div>
            );
          })}
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
