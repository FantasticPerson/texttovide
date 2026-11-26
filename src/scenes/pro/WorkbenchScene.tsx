import React from "react";
import { Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const FOLDERS = [
  { label: "任务目标", color: "#14532D", border: "#34D399", x: 55, y: 52, drop: true },
  { label: "背景资料", color: "#78350F", border: "#FBBF24", x: 255, y: 46, drop: true },
  { label: "对话历史", color: "#1E3A5F", border: "#38BDF8", x: 465, y: 50, drop: false },
  { label: "格式要求", color: "#3F3F46", border: "#A1A1AA", x: 665, y: 44, drop: false },
  { label: "参考案例", color: "#713F12", border: "#FDE047", x: 160, y: 170, drop: false },
  { label: "输出规范", color: "#134E4A", border: "#2DD4BF", x: 420, y: 168, drop: false },
];

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

export const WorkbenchScene: React.FC<Props> = ({ lineStarts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const l1 = lineStarts[1] ?? Math.round(3.0 * fps); // 工作台摆满资料
  const l2 = lineStarts[2] ?? Math.round(7.0 * fps); // 桌子变小，旧文件挤掉
  const l3 = lineStarts[3] ?? Math.round(10.5 * fps); // 不是变笨，是装不下

  const shrink = interpolate(frame, [l2 + 6, l2 + 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const deskWidth = interpolate(shrink, [0, 1], [920, 560]);
  const shiftLeft = interpolate(frame, [l3, l3 + 22], [0, -170], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const verdictSpring =
    frame >= l3 + 8
      ? spring({ frame: frame - (l3 + 8), fps, config: { damping: 16, stiffness: 120 } })
      : 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <Sequence from={l2 + 12} durationInFrames={10}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={l3 + 10} durationInFrames={8}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.32} />
      </Sequence>

      {/* 工作台主体 */}
      <div
        style={{
          position: "relative",
          transform: `translateX(${shiftLeft}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 32,
            color: "#94A3B8",
            marginBottom: 24,
            fontWeight: 600,
          }}
        >
          Context Window · <span style={{ color: "#FDE68A" }}>AI 的工作台</span>
        </div>

        {/* 桌面 */}
        <div
          style={{
            position: "relative",
            width: deskWidth,
            height: 310,
            borderRadius: 18,
            backgroundColor: "#0D1F18",
            border: "3px solid rgba(52, 211, 153, 0.45)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}
        >
          {FOLDERS.map((fd, i) => {
            const appearFrame = l1 + i * 8;
            const s =
              frame >= appearFrame
                ? spring({
                    frame: frame - appearFrame,
                    fps,
                    config: { damping: 15, stiffness: 130 },
                  })
                : 0;

            // 前 2 个旧文件夹在桌子缩窄时物理掉落出去！
            const dropProgress = fd.drop
              ? interpolate(frame, [l2 + 14 + i * 8, l2 + 44 + i * 8], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.in(Easing.quad),
                })
              : 0;

            const curX = fd.drop
              ? fd.x - dropProgress * (170 + i * 40)
              : interpolate(shrink, [0, 1], [fd.x, 42 + ((i - 2) % 2) * 235]);
            const curY = fd.drop
              ? fd.y + dropProgress * (290 + i * 25)
              : interpolate(shrink, [0, 1], [fd.y, 44 + Math.floor((i - 2) / 2) * 124]);
            const rot = fd.drop ? -dropProgress * (22 + i * 12) : 0;

            return (
              <div
                key={fd.label}
                style={{
                  position: "absolute",
                  left: curX,
                  top: curY,
                  width: 190,
                  height: 92,
                  borderRadius: 12,
                  backgroundColor: fd.color,
                  border: `1.5px solid ${fd.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#F8FAFC",
                  opacity: s * (fd.drop ? 1 - dropProgress * 0.25 : 1),
                  transform: `scale(${s}) rotate(${rot}deg)`,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
                }}
              >
                {fd.label}
              </div>
            );
          })}
        </div>

        {/* 两条桌腿 */}
        <div
          style={{
            width: deskWidth * 0.78,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ width: 16, height: 74, backgroundColor: "#143528", borderRadius: "0 0 8px 8px" }} />
          <div style={{ width: 16, height: 74, backgroundColor: "#143528", borderRadius: "0 0 8px 8px" }} />
        </div>
      </div>

      {/* 右侧结论：变笨 ✕ / 装不下 ✓ */}
      {frame >= l3 + 8 && (
        <div
          style={{
            position: "absolute",
            right: 170,
            display: "flex",
            flexDirection: "column",
            gap: 34,
            opacity: verdictSpring,
            transform: `translateX(${(1 - verdictSpring) * 32}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 58, fontWeight: 800 }}>
            <span style={{ color: "#94A3B8" }}>变笨</span>
            <span style={{ color: "#F87171", fontSize: 64 }}>✕</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 58, fontWeight: 800 }}>
            <span style={{ color: "#F8FAFC" }}>装不下</span>
            <span style={{ color: "#34D399", fontSize: 64 }}>✓</span>
          </div>
        </div>
      )}
    </div>
  );
};
