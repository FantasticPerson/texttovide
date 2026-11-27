import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThemeTokens } from "../theme";

interface BackgroundProps {
  theme: ThemeTokens;
}

export const Background: React.FC<BackgroundProps> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const orb1X = Math.sin(sec * 0.5) * 48;
  const orb1Y = Math.cos(sec * 0.38) * 34;
  const orb1Scale = 1 + Math.sin(sec * 0.42) * 0.06;
  const orb2X = Math.cos(sec * 0.44) * 44;
  const orb2Y = Math.sin(sec * 0.34) * 32;
  const orb2Scale = 1 + Math.cos(sec * 0.36) * 0.06;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        backgroundImage: theme.colors.bgGradient,
        overflow: "hidden",
      }}
    >
      {/* 极细底纹网格 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${theme.colors.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.gridLine} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />

      {/* 柔和氛围光斑（纯 transform 合成，无亚像素抖动） */}
      <div
        style={{
          position: "absolute",
          top: -160,
          left: -120,
          width: 860,
          height: 860,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.colors.orbPrimary} 0%, transparent 68%)`,
          transform: `translate3d(${orb1X}px, ${orb1Y}px, 0) scale(${orb1Scale})`,
          willChange: "transform",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -180,
          right: -140,
          width: 820,
          height: 820,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.colors.orbSecondary} 0%, transparent 68%)`,
          transform: `translate3d(${orb2X}px, ${orb2Y}px, 0) scale(${orb2Scale})`,
          willChange: "transform",
        }}
      />
    </AbsoluteFill>
  );
};
