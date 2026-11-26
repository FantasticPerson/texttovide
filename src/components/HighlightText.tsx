import React from "react";
import { ThemeTokens } from "../theme";

interface HighlightTextProps {
  text: string;
  theme: ThemeTokens;
  accentColor?: string;
}

/**
 * 将文本中的 **关键词** 渲染为主题强调色，用于标题和核心句局部提亮。
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  theme,
  accentColor,
}) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const color = accentColor ?? theme.colors.accent;

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
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
};
