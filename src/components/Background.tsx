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

  const orb1X = Math.sin(sec * 0.45) * 40;
  const orb1Y = Math.cos(sec * 0.35) * 30;
  const orb2X = Math.cos(sec * 0.4) * 36;
  const orb2Y = Math.sin(sec * 0.3) * 28;

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

      {/* 柔和氛围光斑 */}
      <div
        style={{
          position: "absolute",
          top: -160 + orb1Y,
          left: -120 + orb1X,
          width: 820,
          height: 820,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.colors.orbPrimary} 0%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -180 + orb2Y,
          right: -140 + orb2X,
          width: 780,
          height: 780,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.colors.orbSecondary} 0%, transparent 68%)`,
        }}
      />
    </AbsoluteFill>
  );
};
