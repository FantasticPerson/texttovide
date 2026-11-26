import React from "react";
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TypewriterText } from "../../motion/TypewriterText";
import { AnimatedCursor } from "../../motion/AnimatedCursor";

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

const CANDIDATES = ["今天天气真好", "今天天气真棒", "今天天气真不错"];

export const LlmPredictScene: React.FC<Props> = ({ lineStarts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const l1 = lineStarts[1] ?? Math.round(3.5 * fps); // 不是真的懂你
  const l2 = lineStarts[2] ?? Math.round(6.2 * fps); // 预测下一个字
  const l3 = lineStarts[3] ?? Math.round(9.5 * fps); // 中文输入法

  const inInputPhase = frame >= l3 - 6;

  // 第一阶段：LLM = 懂我？ -> ≠ -> LLM = 预测
  const notEqual = frame >= l1 + 10;
  const showPredict = frame >= l2 + 6;
  const predictSpring = showPredict
    ? spring({ frame: frame - (l2 + 6), fps, config: { damping: 16, stiffness: 120 } })
    : 0;

  // 第二阶段：中文输入法打字 + 候选词 + 鼠标点选
  const typeStart = l3 + 8;
  const candStart = typeStart + 28;
  const hoverIdx =
    frame < candStart + 18
      ? 0
      : frame < candStart + 42
        ? 1
        : 2;

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
      {/* 音效卡点 */}
      <Sequence from={l1 + 10} durationInFrames={8}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
      </Sequence>
      <Sequence from={l2 + 6} durationInFrames={8}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
      </Sequence>
      <Sequence from={l3 - 4} durationInFrames={10}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.28} />
      </Sequence>
      {[0, 5, 10, 15, 20].map((d) => (
        <Sequence key={`t-${d}`} from={typeStart + d} durationInFrames={4}>
          <Audio src={staticFile("sfx/type.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={candStart + 44} durationInFrames={6}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.4} />
      </Sequence>

      {!inInputPhase ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 34,
              fontSize: 82,
              fontWeight: 900,
            }}
          >
            <span style={{ color: "#34D399" }}>LLM</span>
            <span
              style={{
                color: notEqual ? "#F87171" : "#FDE68A",
                transform: `scale(${notEqual ? 1.15 : 1})`,
              }}
            >
              {notEqual ? "≠" : "="}
            </span>
            <span style={{ color: notEqual ? "#94A3B8" : "#FDE68A" }}>懂我？</span>
          </div>

          {showPredict && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 34,
                fontSize: 84,
                fontWeight: 900,
                opacity: predictSpring,
                transform: `translateY(${(1 - predictSpring) * 26}px)`,
              }}
            >
              <span style={{ color: "#34D399" }}>LLM</span>
              <span style={{ color: "#94A3B8" }}>=</span>
              <span style={{ color: "#FDE68A" }}>预测下一个字</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: "relative", width: 880 }}>
          {/* 模拟中文输入法框 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 32px",
              borderRadius: 18,
              backgroundColor: "rgba(18, 24, 34, 0.92)",
              border: "1.5px solid rgba(52, 211, 153, 0.55)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                  color: "#052E23",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 22,
                }}
              >
                拼
              </div>
              <div style={{ fontSize: 38, fontWeight: 700, color: "#F8FAFC" }}>
                <TypewriterText
                  text="今天天气真"
                  startFrame={typeStart}
                  charsPerFrame={0.22}
                />
              </div>
            </div>
            <div style={{ fontSize: 22, color: "#64748B" }}>中文输入法</div>
          </div>

          {/* 候选词弹出框 */}
          {frame >= candStart && (
            <div
              style={{
                marginTop: 14,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "rgba(15, 22, 31, 0.95)",
                border: "1px solid rgba(148, 163, 184, 0.22)",
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {CANDIDATES.map((cand, idx) => {
                const isHover = idx === hoverIdx;
                return (
                  <div
                    key={cand}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      padding: "16px 22px",
                      borderRadius: 10,
                      backgroundColor: isHover
                        ? "rgba(16, 72, 58, 0.65)"
                        : "transparent",
                      border: isHover
                        ? "1px solid rgba(52, 211, 153, 0.55)"
                        : "1px solid transparent",
                      fontSize: 30,
                      fontWeight: isHover ? 700 : 500,
                      color: "#F8FAFC",
                    }}
                  >
                    <span style={{ color: "#64748B", fontSize: 24 }}>{idx + 1}</span>
                    <span>
                      今天天气真
                      <span style={{ color: isHover ? "#34D399" : "#FDE68A" }}>
                        {cand.slice(5)}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 模拟鼠标指针移到候选词上点选 */}
          <AnimatedCursor
            waypoints={[
              { frame: candStart + 4, x: 560, y: 120 },
              { frame: candStart + 20, x: 340, y: 215 },
              { frame: candStart + 42, x: 340, y: 290, click: true },
            ]}
          />
        </div>
      )}
    </div>
  );
};
