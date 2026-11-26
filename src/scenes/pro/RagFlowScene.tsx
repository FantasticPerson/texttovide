import React from "react";
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedCursor } from "../../motion/AnimatedCursor";

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

export const RagFlowScene: React.FC<Props> = ({ lineStarts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const l1 = lineStarts[1] ?? Math.round(3.0 * fps); // RAG 专属资料员
  const l2 = lineStarts[2] ?? Math.round(6.2 * fps); // 检索原文交给模型作答
  const l3 = lineStarts[3] ?? Math.round(10.0 * fps); // 闭卷 vs 开卷

  const showResultFlow = frame >= l2 + 24;
  const pickFrame = l2 + 10;

  const flowSpring = showResultFlow
    ? spring({ frame: frame - (l2 + 24), fps, config: { damping: 16, stiffness: 120 } })
    : 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        position: "relative",
        width: "100%",
      }}
    >
      <Sequence from={pickFrame} durationInFrames={6}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.38} />
      </Sequence>
      <Sequence from={l2 + 24} durationInFrames={10}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.28} />
      </Sequence>

      <div style={{ fontSize: 48, fontWeight: 900, color: "#FDE68A" }}>
        RAG · <span style={{ color: "#34D399" }}>检索增强生成</span>
      </div>

      {!showResultFlow ? (
        /* 第一阶段：18 份资料库网格 + 鼠标精准点选第 10 份 */
        <div style={{ position: "relative", width: 920 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 18,
            }}
          >
            {Array.from({ length: 18 }).map((_, idx) => {
              const s = spring({
                frame: Math.max(0, frame - (l1 - 8 + idx * 2)),
                fps,
                config: { damping: 16, stiffness: 140 },
              });
              const isPicked = idx === 9 && frame >= pickFrame;
              return (
                <div
                  key={idx}
                  style={{
                    height: 112,
                    borderRadius: 12,
                    padding: 14,
                    backgroundColor: isPicked
                      ? "rgba(16, 72, 58, 0.85)"
                      : "rgba(18, 25, 36, 0.72)",
                    border: `1.5px solid ${
                      isPicked ? "#34D399" : "rgba(148, 163, 184, 0.22)"
                    }`,
                    boxShadow: isPicked ? "0 0 28px rgba(52, 211, 153, 0.45)" : "none",
                    transform: `scale(${s * (isPicked ? 1.08 : 1)})`,
                    opacity: s * (frame >= pickFrame && !isPicked ? 0.32 : 1),
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ width: "55%", height: 6, borderRadius: 4, backgroundColor: isPicked ? "#34D399" : "#475569" }} />
                  <div style={{ width: "85%", height: 5, borderRadius: 4, backgroundColor: "rgba(148,163,184,0.3)" }} />
                  <div style={{ width: "70%", height: 5, borderRadius: 4, backgroundColor: "rgba(148,163,184,0.25)" }} />
                  <div style={{ fontSize: 13, color: isPicked ? "#34D399" : "#64748B", fontFamily: '"SF Mono", monospace' }}>
                    DOC {String(idx + 1).padStart(2, "0")}
                  </div>
                </div>
              );
            })}
          </div>

          <AnimatedCursor
            waypoints={[
              { frame: l1 + 12, x: 760, y: 310 },
              { frame: pickFrame, x: 520, y: 185, click: true },
            ]}
          />
        </div>
      ) : (
        /* 第二阶段：命中文档 -> LLM -> 有依据的回答 */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            opacity: flowSpring,
            transform: `translateY(${(1 - flowSpring) * 18}px)`,
          }}
        >
          <div
            style={{
              width: 310,
              padding: "28px 26px",
              borderRadius: 18,
              backgroundColor: "rgba(16, 62, 50, 0.45)",
              border: "1.5px solid #34D399",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 18, color: "#34D399", fontWeight: 700 }}>
              ✓ 已检索 · 合同原文
            </div>
            <div style={{ fontSize: 22, color: "#F8FAFC", lineHeight: 1.55 }}>
              「第 8 条：逾期交付超过 7 日，须按合同总额 5% 承担违约责任。」
            </div>
          </div>

          <div style={{ fontSize: 34, color: "#34D399", fontWeight: 800 }}>→</div>

          <div
            style={{
              padding: "36px 42px",
              borderRadius: 18,
              backgroundColor: "rgba(15, 23, 36, 0.9)",
              border: "1.5px solid rgba(148,163,184,0.3)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 38, fontWeight: 900, color: "#F8FAFC" }}>LLM</div>
            <div style={{ fontSize: 18, color: "#94A3B8", marginTop: 6 }}>基于原文组织答案</div>
          </div>

          <div style={{ fontSize: 34, color: "#34D399", fontWeight: 800 }}>→</div>

          <div
            style={{
              width: 380,
              padding: "28px 28px",
              borderRadius: 18,
              backgroundColor: "rgba(15, 23, 36, 0.92)",
              border: "1.5px solid rgba(253, 230, 138, 0.55)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ fontSize: 22, color: "#FDE68A", fontWeight: 800 }}>
              有据可查 · 开卷答题
            </div>
            <div style={{ fontSize: 22, color: "#E2E8F0", lineHeight: 1.55 }}>
              已精准定位第 8 条：逾期超 7 天违约金为 5%，无胡编幻觉。
            </div>
            {frame >= l3 && (
              <div style={{ fontSize: 18, color: "#34D399", fontWeight: 700 }}>
                普通模型=闭卷考 ｜ RAG=开卷考
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
