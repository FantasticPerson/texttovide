import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const SpaceBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  // 2 颗极细慢速流星周期性划过
  const m1 = ((sec * 0.22) % 1);
  const m2 = (((sec + 2.3) * 0.17) % 1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080A10",
        backgroundImage:
          "radial-gradient(ellipse at 50% 48%, rgba(16, 185, 129, 0.08) 0%, rgba(8, 10, 16, 0) 58%), radial-gradient(ellipse at 18% 75%, rgba(88, 28, 135, 0.14) 0%, rgba(8, 10, 16, 0) 55%)",
        overflow: "hidden",
      }}
    >
      {/* 右侧微光深空星球轮廓 */}
      <div
        style={{
          position: "absolute",
          right: -220,
          top: 120,
          width: 780,
          height: 780,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 40%, rgba(15, 23, 42, 0.9) 0%, rgba(6, 10, 18, 0.98) 70%)",
          boxShadow:
            "inset 24px 0 60px rgba(52, 211, 153, 0.10), -18px 0 80px rgba(52, 211, 153, 0.06)",
          opacity: 0.72,
        }}
      />

      {/* 斜向微弱星云带 */}
      <div
        style={{
          position: "absolute",
          inset: -200,
          background:
            "linear-gradient(148deg, transparent 42%, rgba(52, 211, 153, 0.04) 50%, rgba(168, 85, 247, 0.04) 55%, transparent 64%)",
        }}
      />

      {/* 流星 1 */}
      <div
        style={{
          position: "absolute",
          left: `${12 + m1 * 38}%`,
          top: `${8 + m1 * 24}%`,
          width: 110,
          height: 1.5,
          transform: "rotate(-32deg)",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(226,232,240,0.65) 100%)",
          opacity: Math.sin(m1 * Math.PI) * 0.75,
        }}
      />

      {/* 流星 2 */}
      <div
        style={{
          position: "absolute",
          left: `${55 + m2 * 30}%`,
          top: `${16 + m2 * 22}%`,
          width: 90,
          height: 1.2,
          transform: "rotate(-32deg)",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(167,243,208,0.55) 100%)",
          opacity: Math.sin(m2 * Math.PI) * 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
