import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MockupScene as MockupSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";

interface Props {
  scene: MockupSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

export const MockupScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const winProgress = spring({
    frame,
    fps,
    config: motion.spring,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isVertical ? 32 : 28,
        width: "100%",
      }}
    >
      {scene.title && (
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: isVertical ? 48 : 50,
            fontWeight: 800,
            color: theme.colors.textPrimary,
            textAlign: "center",
            textWrap: "balance",
          }}
        >
          <HighlightText text={scene.title} theme={theme} />
        </div>
      )}

      {/* 拟真终端 / 对话窗口 */}
      <div
        style={{
          width: "100%",
          maxWidth: isVertical ? "100%" : 1240,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: theme.colors.windowBg,
          border: `1.5px solid ${theme.colors.border}`,
          boxShadow: theme.isDark
            ? "0 24px 64px rgba(0, 0, 0, 0.55)"
            : "0 24px 56px rgba(31, 41, 51, 0.16)",
          opacity: winProgress,
          transform: `translateY(${(1 - winProgress) * 20}px)`,
        }}
      >
        {/* 窗口顶栏 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 22px",
            backgroundColor: theme.colors.windowHeaderBg,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", gap: 9 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#EF4444" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#F59E0B" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#10B981" }} />
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 18,
              color: "#94A3B8",
              letterSpacing: "0.06em",
            }}
          >
            {scene.windowTitle}
          </div>
          <div style={{ width: 54 }} />
        </div>

        {/* 窗口内容行 */}
        <div
          style={{
            padding: isVertical ? "28px 28px" : "34px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            fontFamily: theme.fonts.mono,
          }}
        >
          {scene.lines.map((line, idx) => {
            const timing = itemTimings[idx] ?? { startFrame: 12 + idx * 24, endFrame: 9999 };
            const entered = frame >= timing.startFrame;
            const s = entered
              ? spring({ frame: frame - timing.startFrame, fps, config: motion.spring })
              : 0;

            const isPrompt = line.role === "prompt";
            const isHighlight = line.role === "highlight";
            const isMuted = line.role === "muted";

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: isHighlight ? "14px 18px" : isPrompt ? "12px 16px" : "4px 6px",
                  borderRadius: 10,
                  backgroundColor: isHighlight
                    ? "rgba(52, 211, 153, 0.14)"
                    : isPrompt
                      ? "rgba(255, 255, 255, 0.05)"
                      : "transparent",
                  border: isHighlight
                    ? "1px solid rgba(52, 211, 153, 0.45)"
                    : "1px solid transparent",
                  fontSize: isVertical ? 26 : 26,
                  lineHeight: 1.5,
                  color: isHighlight
                    ? "#34D399"
                    : isMuted
                      ? "#64748B"
                      : "#F1F5F9",
                  fontWeight: isHighlight || isPrompt ? 600 : 400,
                  opacity: entered ? s : 0,
                  transform: `translateY(${(1 - s) * 12}px)`,
                }}
              >
                {isPrompt && (
                  <span style={{ color: "#34D399", flexShrink: 0 }}>&gt;</span>
                )}
                <span>{line.text}</span>
              </div>
            );
          })}
        </div>

        {/* 可选底部步骤标签条（类似参考视频 01 拆步骤 / 02 挑工具 / 03 把事做完） */}
        {scene.badges && scene.badges.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 16,
              padding: "0 40px 32px",
              flexWrap: "wrap",
            }}
          >
            {scene.badges.map((b, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  minWidth: 160,
                  textAlign: "center",
                  padding: "12px 18px",
                  borderRadius: 12,
                  backgroundColor: "rgba(52, 211, 153, 0.12)",
                  border: "1px solid rgba(52, 211, 153, 0.42)",
                  color: "#34D399",
                  fontFamily: theme.fonts.sans,
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {b}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
