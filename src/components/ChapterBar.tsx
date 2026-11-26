import React from "react";
import { ThemeTokens } from "../theme";

interface ChapterBarProps {
  chapters: string[];
  activeChapter?: string;
  theme: ThemeTokens;
  progress: number;
}

export const ChapterBar: React.FC<ChapterBarProps> = ({
  chapters,
  activeChapter,
  theme,
  progress,
}) => {
  if (chapters.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 46,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        backgroundColor: theme.isDark
          ? "rgba(9, 11, 16, 0.78)"
          : "rgba(253, 245, 215, 0.85)",
        borderBottom: `1px solid ${theme.colors.border}`,
        fontFamily: theme.fonts.sans,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 36,
          flex: 1,
          justifyContent: "space-around",
        }}
      >
        {chapters.map((ch, idx) => {
          const isActive = activeChapter === ch;
          return (
            <div
              key={idx}
              style={{
                fontSize: 18,
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? theme.colors.textPrimary
                  : theme.colors.textMuted,
                letterSpacing: "0.03em",
                position: "relative",
                padding: "10px 4px",
              }}
            >
              {ch}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 2.5,
                    borderRadius: 99,
                    backgroundColor: theme.colors.accent,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 极细全局进度底线 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          height: 2,
          backgroundColor: theme.colors.accent,
          opacity: 0.45,
        }}
      />
    </div>
  );
};
