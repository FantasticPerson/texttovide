import React from "react";
import { Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TypewriterText } from "../../motion/TypewriterText";
import { NumberCounter } from "../../motion/NumberCounter";

const TOKENS = ["帮", "我", "制定", "一份", "AI", "学习", "计划"];

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

export const TokenSplitScene: React.FC<Props> = ({ lineStarts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const l1 = lineStarts[1] ?? Math.round(3.0 * fps); // 拆成七块字砖
  const l2 = lineStarts[2] ?? Math.round(6.8 * fps); // 1~2 个字是一个 Token
  const l3 = lineStarts[3] ?? Math.round(9.5 * fps); // 手机流量，按量计费

  const inBillingPhase = frame >= l3 - 4;
  const chipStart = l1 + 14;
  const showLabels = frame >= l2;

  const inBar = interpolate(frame, [l3 + 6, l3 + 48], [0, 82], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outBar = interpolate(frame, [l3 + 22, l3 + 68], [0, 92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        width: "100%",
      }}
    >
      {/* 飞落字砖音效 */}
      {TOKENS.map((_, i) => (
        <Sequence key={`tok-${i}`} from={chipStart + i * 7} durationInFrames={6}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={l3 - 4} durationInFrames={10}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.28} />
      </Sequence>

      {!inBillingPhase ? (
        <>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#FDE68A",
              letterSpacing: "0.04em",
            }}
          >
            Token · 模型处理文字的最小单位
          </div>

          {/* 顶部输入框 */}
          <div
            style={{
              width: 960,
              padding: "22px 30px",
              borderRadius: 14,
              backgroundColor: "rgba(18, 24, 34, 0.85)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              fontSize: 32,
              fontFamily: '"SF Mono", monospace',
              color: "#F8FAFC",
            }}
          >
            <span style={{ color: "#34D399", marginRight: 14 }}>&gt;</span>
            <TypewriterText
              text="帮我制定一份 AI 学习计划"
              startFrame={10}
              charsPerFrame={0.45}
              showCursor={frame < chipStart}
            />
          </div>

          {/* 7 块 Token 飞落展开 */}
          <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
            {TOKENS.map((tok, i) => {
              const s =
                frame >= chipStart + i * 7
                  ? spring({
                      frame: frame - (chipStart + i * 7),
                      fps,
                      config: { damping: 14, stiffness: 140 },
                    })
                  : 0;
              return (
                <div
                  key={i}
                  style={{
                    width: 122,
                    padding: showLabels ? "26px 14px 18px" : "22px 14px",
                    borderRadius: 14,
                    backgroundColor: "rgba(16, 62, 50, 0.65)",
                    border: "1.5px solid rgba(52, 211, 153, 0.65)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                    opacity: s,
                    transform: `translateY(${(1 - s) * -75}px) scale(${0.85 + 0.15 * s})`,
                  }}
                >
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#F8FAFC" }}>
                    {tok}
                  </div>
                  {showLabels && (
                    <div
                      style={{
                        fontSize: 15,
                        fontFamily: '"SF Mono", monospace',
                        color: "#34D399",
                        letterSpacing: "0.06em",
                      }}
                    >
                      TOKEN 0{i + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* 第二阶段：输入 + 输出 Token 滚动计费仪表盘 */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
            width: "100%",
            maxWidth: 1240,
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 800, color: "#F8FAFC" }}>
            Token 就是 AI 世界里的<span style={{ color: "#34D399" }}>文字流量</span>
          </div>

          <div style={{ display: "flex", gap: 36, width: "100%" }}>
            {/* 输入卡片 */}
            <div
              style={{
                flex: 1,
                padding: "32px 34px",
                borderRadius: 20,
                backgroundColor: "rgba(15, 23, 34, 0.88)",
                border: "1.5px solid rgba(52, 211, 153, 0.45)",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <div style={{ fontSize: 22, color: "#34D399", fontWeight: 700 }}>
                输入 Prompt
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: "#CBD5E1",
                  padding: "16px 20px",
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              >
                &gt; 帮我制定一份 AI 学习计划，并按周安排任务。
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontSize: 20, color: "#94A3B8" }}>输入消耗</span>
                <span
                  style={{
                    fontSize: 54,
                    fontWeight: 900,
                    fontFamily: '"SF Mono", monospace',
                    color: "#FDE68A",
                  }}
                >
                  <NumberCounter to={824} startFrame={l3 + 6} durationFrames={42} />
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 99,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${inBar}%`,
                    height: "100%",
                    backgroundColor: "#34D399",
                  }}
                />
              </div>
            </div>

            {/* 输出卡片 */}
            <div
              style={{
                flex: 1,
                padding: "32px 34px",
                borderRadius: 20,
                backgroundColor: "rgba(15, 23, 34, 0.88)",
                border: "1.5px solid rgba(52, 211, 153, 0.45)",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <div style={{ fontSize: 22, color: "#FDE68A", fontWeight: 700 }}>
                输出 Response
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: "#CBD5E1",
                  padding: "16px 20px",
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              >
                第 1 周认识工具 · 第 2 周练习提示词 · 第 3 周实战落地
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontSize: 20, color: "#94A3B8" }}>输出消耗</span>
                <span
                  style={{
                    fontSize: 54,
                    fontWeight: 900,
                    fontFamily: '"SF Mono", monospace',
                    color: "#FDE68A",
                  }}
                >
                  <NumberCounter to={963} startFrame={l3 + 22} durationFrames={46} />
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 99,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${outBar}%`,
                    height: "100%",
                    backgroundColor: "#FDE68A",
                  }}
                />
              </div>
            </div>
          </div>

          {/* 汇总条 */}
          <div
            style={{
              padding: "16px 36px",
              borderRadius: 999,
              backgroundColor: "rgba(16, 62, 50, 0.55)",
              border: "1px solid rgba(52, 211, 153, 0.5)",
              fontSize: 26,
              color: "#E2E8F0",
              fontFamily: '"SF Mono", monospace',
            }}
          >
            输入 Token + 输出 Token = 本次计费{" "}
            <span style={{ color: "#34D399", fontWeight: 800 }}>
              <NumberCounter to={1787} startFrame={l3 + 28} durationFrames={44} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
