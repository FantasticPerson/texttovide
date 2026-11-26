import React from "react";
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TypewriterText } from "../../motion/TypewriterText";

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

export const PromptTerminalScene: React.FC<Props> = ({ lineStarts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const l1 = lineStarts[1] ?? Math.round(2.8 * fps); // 模糊提问
  const l2 = lineStarts[2] ?? Math.round(6.2 * fps); // 清晰 Prompt 答案立刻具体十倍
  const l3 = lineStarts[3] ?? Math.round(10.0 * fps); // 拆出 4 要素高亮

  const isGoodPhase = frame >= l2 - 4;
  const planStart = l2 + 34;

  const planSpring =
    frame >= planStart
      ? spring({ frame: frame - planStart, fps, config: { damping: 16, stiffness: 120 } })
      : 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        width: "100%",
      }}
    >
      <Sequence from={l2 - 4} durationInFrames={10}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.28} />
      </Sequence>
      {[0, 5, 10, 15, 20, 25].map((d) => (
        <Sequence key={`pt-${d}`} from={l2 + 2 + d} durationInFrames={4}>
          <Audio src={staticFile("sfx/type.wav")} volume={0.2} />
        </Sequence>
      ))}
      <Sequence from={planStart} durationInFrames={8}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.32} />
      </Sequence>

      <div
        style={{
          width: 1180,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "rgba(13, 18, 26, 0.94)",
          border: `1.5px solid ${isGoodPhase ? "rgba(52, 211, 153, 0.55)" : "rgba(248, 113, 113, 0.45)"}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
        }}
      >
        {/* 顶栏 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 22px",
            backgroundColor: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#EF4444" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#F59E0B" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#10B981" }} />
          </div>
          <div style={{ fontSize: 18, color: "#94A3B8", fontFamily: '"SF Mono", monospace' }}>
            {isGoodPhase ? "Prompt · 清晰任务说明" : "Prompt · 模糊指令"}
          </div>
          <div style={{ width: 48 }} />
        </div>

        <div style={{ padding: "32px 38px", display: "flex", flexDirection: "column", gap: 22 }}>
          {!isGoodPhase ? (
            <>
              <div
                style={{
                  padding: "18px 22px",
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  fontSize: 28,
                  color: "#F8FAFC",
                }}
              >
                <span style={{ color: "#F87171", marginRight: 12 }}>&gt;</span>
                <TypewriterText text="帮我弄一下报告" startFrame={Math.max(4, l1 - 6)} charsPerFrame={0.45} />
              </div>

              <div
                style={{
                  padding: "24px 26px",
                  borderRadius: 14,
                  backgroundColor: "rgba(248, 113, 113, 0.08)",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                  color: "#CBD5E1",
                  fontSize: 25,
                  lineHeight: 1.7,
                }}
              >
                <div style={{ color: "#F87171", fontWeight: 700, marginBottom: 8 }}>
                  AI 输出：正确的废话
                </div>
                <div>· 报告需要明确主题、结构清晰、逻辑严谨…</div>
                <div>· 建议补充核心数据并做好总结与展望…</div>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: "18px 22px",
                  borderRadius: 12,
                  backgroundColor: "rgba(52, 211, 153, 0.08)",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  fontSize: 25,
                  lineHeight: 1.6,
                  color: "#F8FAFC",
                }}
              >
                <span style={{ color: "#34D399", marginRight: 10 }}>&gt;</span>
                <TypewriterText
                  text="面向高管的季度总结，300 字以内，重点突出销售增长与份额，语气正式。"
                  startFrame={l2}
                  charsPerFrame={1.1}
                  showCursor={frame < planStart}
                />
              </div>

              {/* 4 要素标亮胶囊 */}
              {frame >= l3 - 8 && (
                <div style={{ display: "flex", gap: 14 }}>
                  {["对象：高管", "限制：300 字内", "重点：增长与份额", "风格：正式"].map((tag) => (
                    <div
                      key={tag}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "10px 14px",
                        borderRadius: 10,
                        backgroundColor: "rgba(16, 62, 50, 0.65)",
                        border: "1px solid rgba(52, 211, 153, 0.55)",
                        color: "#34D399",
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}

              {/* 具体输出 */}
              <div
                style={{
                  padding: "24px 28px",
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  opacity: planSpring,
                  transform: `translateY(${(1 - planSpring) * 16}px)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontSize: 23,
                  color: "#E2E8F0",
                }}
              >
                <div style={{ color: "#FDE68A", fontWeight: 800 }}>
                  Q3 季度高管摘要（268 字 · 已可直接发邮件）
                </div>
                <div>· 营收环比增长 34%，核心产品市场份额提升至 18.6%</div>
                <div>· 新增企业客户 120 家，续费率维持 94% 以上</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
