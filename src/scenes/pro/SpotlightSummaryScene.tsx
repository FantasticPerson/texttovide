import React from "react";
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const ITEMS = [
  { title: "LLM", desc: "超级学霸" },
  { title: "Token", desc: "AI 的流量" },
  { title: "Context", desc: "工作台大小" },
  { title: "Prompt", desc: "任务说明书" },
  { title: "RAG", desc: "开卷考试" },
  { title: "Agent", desc: "有手有脚的 AI" },
  { title: "MCP", desc: "AI 世界的 USB 接口" },
  { title: "多模态", desc: "看图听声的感官" },
];

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

export const SpotlightSummaryScene: React.FC<Props> = ({ lineStarts, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 第 2 句到第 5 句依次放大聚焦前 7 张核心卡
  const focusStart = lineStarts[1] ?? Math.round(2.5 * fps);
  const focusSpan = Math.max(120, durationInFrames - focusStart - 20);
  const slot = Math.floor(focusSpan / 7);

  const activeIdx =
    frame >= focusStart && frame < focusStart + slot * 7
      ? Math.min(6, Math.floor((frame - focusStart) / slot))
      : -1;

  const activeCard = activeIdx >= 0 ? ITEMS[activeIdx] : null;
  const localFrame = activeIdx >= 0 ? frame - (focusStart + activeIdx * slot) : 0;
  const popSpring =
    activeIdx >= 0
      ? spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 150 } })
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
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Sequence key={`sp-${i}`} from={focusStart + i * slot} durationInFrames={6}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.25} />
        </Sequence>
      ))}

      {/* 底层 8 宫格 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 300px)",
          gap: 24,
          opacity: activeCard ? 0.25 : 1,
          filter: activeCard ? "blur(2px)" : "none",
        }}
      >
        {ITEMS.map((item, idx) => (
          <div
            key={item.title}
            style={{
              padding: "30px 28px",
              borderRadius: 18,
              backgroundColor: "rgba(18, 25, 36, 0.78)",
              border: `1.5px solid ${
                idx === activeIdx ? "#34D399" : "rgba(148, 163, 184, 0.18)"
              }`,
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 800, color: "#F8FAFC", marginBottom: 8 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 21, color: "#94A3B8" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 放大弹到正中的聚焦卡 */}
      {activeCard && (
        <div
          style={{
            position: "absolute",
            width: 540,
            padding: "46px 52px",
            borderRadius: 24,
            backgroundColor: "rgba(13, 38, 34, 0.96)",
            border: "2px solid #34D399",
            boxShadow: "0 30px 90px rgba(0, 0, 0, 0.75), 0 0 40px rgba(52, 211, 153, 0.28)",
            transform: `scale(${0.76 + 0.24 * popSpring})`,
            opacity: popSpring,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 900, color: "#FDE68A" }}>
            {activeCard.title}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#34D399" }}>
            {activeCard.desc}
          </div>
        </div>
      )}
    </div>
  );
};
