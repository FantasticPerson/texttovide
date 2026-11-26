import React from "react";
import { Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const OLD_PORTS = [
  { x: -320, y: -90, rot: -14, w: 120, h: 46 },
  { x: -110, y: -95, rot: 8, w: 108, h: 44 },
  { x: 110, y: -90, rot: -6, w: 80, h: 66 },
  { x: 320, y: -88, rot: 12, w: 124, h: 44 },
  { x: -310, y: 86, rot: 10, w: 116, h: 46 },
  { x: -105, y: 92, rot: -10, w: 102, h: 48 },
  { x: 110, y: 88, rot: 14, w: 72, h: 72 },
  { x: 315, y: 86, rot: -8, w: 122, h: 48 },
];

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

export const McpHubScene: React.FC<Props> = ({ lineStarts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const l1 = lineStarts[1] ?? Math.round(3.0 * fps); // 工具一多接口各异
  const l2 = lineStarts[2] ?? Math.round(6.5 * fps); // 汇聚成 USB Type-C
  const l3 = lineStarts[3] ?? Math.round(10.0 * fps); // 架构连线即插即用

  const merge = interpolate(frame, [l2, l2 + 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const showDiagram = frame >= l3 - 4;
  const diagSpring = showDiagram
    ? spring({ frame: frame - (l3 - 4), fps, config: { damping: 16, stiffness: 120 } })
    : 0;

  const pulseX = ((frame - l3) * 6) % 140;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        position: "relative",
        width: "100%",
      }}
    >
      <Sequence from={l2 + 12} durationInFrames={10}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.32} />
      </Sequence>
      <Sequence from={l2 + 26} durationInFrames={8}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.36} />
      </Sequence>

      <div style={{ fontSize: 60, fontWeight: 900, color: "#FDE68A", letterSpacing: "0.08em" }}>
        MCP
      </div>

      {!showDiagram ? (
        <div
          style={{
            position: "relative",
            width: 860,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* 8 个各不相同的杂乱旧接口 -> 向中心汇聚消失 */}
          {OLD_PORTS.map((p, i) => {
            const appear = spring({
              frame: Math.max(0, frame - (l1 - 12 + i * 3)),
              fps,
              config: { damping: 16, stiffness: 130 },
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: p.w,
                  height: p.h,
                  borderRadius: p.w === p.h ? "50%" : 10,
                  border: "2px solid rgba(148, 163, 184, 0.55)",
                  backgroundColor: "rgba(15, 23, 36, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: appear * (1 - merge),
                  transform: `translate(${p.x * (1 - merge)}px, ${p.y * (1 - merge)}px) rotate(${p.rot * (1 - merge)}deg) scale(${1 - merge * 0.4})`,
                }}
              >
                {[0, 1, 2, 3].map((pin) => (
                  <span
                    key={pin}
                    style={{
                      width: 6,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: "rgba(148, 163, 184, 0.7)",
                    }}
                  />
                ))}
              </div>
            );
          })}

          {/* 汇聚后正中唯一发光的 USB Type-C 接口 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              opacity: merge,
              transform: `scale(${0.6 + 0.4 * merge})`,
            }}
          >
            <div
              style={{
                width: 196,
                height: 76,
                borderRadius: 999,
                border: "3px solid #34D399",
                backgroundColor: "rgba(16, 62, 50, 0.75)",
                boxShadow: "0 0 42px rgba(52, 211, 153, 0.42)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((pin) => (
                <span
                  key={pin}
                  style={{
                    width: 8,
                    height: 22,
                    borderRadius: 3,
                    backgroundColor: "#34D399",
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#34D399" }}>
              USB Type-C · MCP 统一接口
            </div>
          </div>
        </div>
      ) : (
        /* 架构图：工具箱 -> 统一协议 -> AI */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            opacity: diagSpring,
            transform: `translateY(${(1 - diagSpring) * 20}px)`,
          }}
        >
          {/* 工具箱 */}
          <div
            style={{
              padding: "26px 28px",
              borderRadius: 20,
              border: "1.5px solid rgba(52, 211, 153, 0.45)",
              backgroundColor: "rgba(12, 26, 24, 0.75)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              width: 260,
            }}
          >
            <div style={{ fontSize: 20, color: "#34D399", fontWeight: 700, textAlign: "center" }}>
              外部工具与应用
            </div>
            {["本地文件", "日程与邮件", "知识库搜索"].map((t) => (
              <div
                key={t}
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  fontSize: 24,
                  color: "#F1F5F9",
                  textAlign: "center",
                }}
              >
                {t}
              </div>
            ))}
          </div>

          {/* 动效光点连线 1 */}
          <div style={{ position: "relative", width: 140, height: 4, backgroundColor: "rgba(52, 211, 153, 0.35)" }}>
            <div
              style={{
                position: "absolute",
                left: pulseX,
                top: -4,
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#34D399",
                boxShadow: "0 0 12px #34D399",
              }}
            />
          </div>

          {/* MCP 统一协议中心块 */}
          <div
            style={{
              padding: "36px 40px",
              borderRadius: 20,
              border: "2px solid #34D399",
              backgroundColor: "rgba(16, 62, 50, 0.65)",
              boxShadow: "0 0 36px rgba(52, 211, 153, 0.25)",
              fontSize: 32,
              fontWeight: 800,
              color: "#34D399",
            }}
          >
            统一协议
          </div>

          {/* 动效光点连线 2 */}
          <div style={{ position: "relative", width: 140, height: 4, backgroundColor: "rgba(52, 211, 153, 0.35)" }}>
            <div
              style={{
                position: "absolute",
                left: pulseX,
                top: -4,
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#FDE68A",
                boxShadow: "0 0 12px #FDE68A",
              }}
            />
          </div>

          {/* AI 主体 */}
          <div
            style={{
              padding: "46px 56px",
              borderRadius: 20,
              border: "1.5px solid rgba(253, 230, 138, 0.55)",
              backgroundColor: "rgba(15, 23, 36, 0.88)",
              fontSize: 44,
              fontWeight: 900,
              color: "#FDE68A",
            }}
          >
            AI Agent
          </div>
        </div>
      )}
    </div>
  );
};
