import React from "react";
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const CARDS = [
  { title: "LLM", sub: "大语言模型" },
  { title: "Token", sub: "文字单位" },
  { title: "Context", sub: "上下文窗口" },
  { title: "Prompt", sub: "提示词" },
  { title: "RAG", sub: "检索增强" },
  { title: "Tool", sub: "工具调用" },
  { title: "MCP", sub: "连接协议" },
  { title: "Agent", sub: "智能体" },
];

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

export const OpeningGridScene: React.FC<Props> = ({ lineStarts, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 第 2 句（念出所有名词）开始逐卡扫亮
  const scanStart = lineStarts[1] ?? Math.round(2.4 * fps);
  const scanEnd = lineStarts[2] ?? Math.round(7.0 * fps);
  const scanPerCard = Math.max(8, Math.floor((scanEnd - scanStart) / CARDS.length));

  const activeIdx =
    frame >= scanStart && frame < scanEnd
      ? Math.min(CARDS.length - 1, Math.floor((frame - scanStart) / scanPerCard))
      : -1;

  // 第 4 句推出底部主标语
  const ctaStart = lineStarts[3] ?? Math.floor(durationInFrames * 0.72);
  const ctaSpring =
    frame >= ctaStart
      ? spring({ frame: frame - ctaStart, fps, config: { damping: 16, stiffness: 120 } })
      : 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 44,
      }}
    >
      {/* 每次扫亮触发轻 pop 音效 */}
      {CARDS.map((_, idx) => (
        <Sequence key={`sfx-${idx}`} from={scanStart + idx * scanPerCard} durationInFrames={8}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.22} />
        </Sequence>
      ))}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 300px)",
          gap: 24,
        }}
      >
        {CARDS.map((card, idx) => {
          const enter = spring({
            frame: Math.max(0, frame - (4 + idx * 4)),
            fps,
            config: { damping: 16, stiffness: 130 },
          });
          const isLit = activeIdx === idx;
          return (
            <div
              key={card.title}
              style={{
                padding: "30px 28px",
                borderRadius: 18,
                backgroundColor: isLit
                  ? "rgba(16, 72, 58, 0.72)"
                  : "rgba(18, 25, 36, 0.72)",
                border: `1.5px solid ${
                  isLit ? "rgba(52, 211, 153, 0.9)" : "rgba(148, 163, 184, 0.16)"
                }`,
                boxShadow: isLit
                  ? "0 0 32px rgba(52, 211, 153, 0.25)"
                  : "none",
                transform: `translateY(${(1 - enter) * 24}px) scale(${isLit ? 1.05 : 1})`,
                opacity: enter * (activeIdx >= 0 && !isLit ? 0.52 : 1),
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: isLit ? "#34D399" : "#F8FAFC",
                  marginBottom: 8,
                }}
              >
                {card.title}
              </div>
              <div style={{ fontSize: 21, color: isLit ? "#D1FAE5" : "#94A3B8" }}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#FDE68A",
          letterSpacing: "0.06em",
          opacity: ctaSpring,
          transform: `translateY(${(1 - ctaSpring) * 16}px)`,
        }}
      >
        一条视频，把底层逻辑彻底演明白 →
      </div>
    </div>
  );
};
