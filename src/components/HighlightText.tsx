import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ThemeTokens } from "../theme";

interface HighlightTextProps {
  text: string;
  theme: ThemeTokens;
  accentColor?: string;
  /** 荧光笔刷过动画的起始帧（仅对 ==荧光词== 生效） */
  markerStartFrame?: number;
}

/**
 * 局部高亮渲染器：
 * - `**关键词**`：渲染为主题强调色
 * - `==荧光词==`：从左到右刷出荧光笔底色（参考编辑风划重点动效）
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  theme,
  accentColor,
  markerStartFrame = 8,
}) => {
  const frame = useCurrentFrame();
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+==)/g);
  const color = accentColor ?? theme.colors.accent;
  const markerBg = theme.isDark
    ? "rgba(52, 211, 153, 0.24)"
    : "rgba(250, 204, 21, 0.55)";

  const sweep = interpolate(frame, [markerStartFrame, markerStartFrame + 16], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <span key={idx} style={{ color }}>
              {part.slice(2, -2)}
            </span>
          );
        }
        if (part.startsWith("==") && part.endsWith("==") && part.length > 4) {
          return (
            <span
              key={idx}
              style={{
                position: "relative",
                display: "inline-block",
                padding: "0 8px",
                margin: "0 2px",
                borderRadius: 6,
                backgroundImage: `linear-gradient(90deg, ${markerBg} ${sweep}%, transparent ${sweep}%)`,
                color: theme.isDark ? theme.colors.textPrimary : "#111827",
              }}
            >
              {part.slice(2, -2)}
            </span>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
};
