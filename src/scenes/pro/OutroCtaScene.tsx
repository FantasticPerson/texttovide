import React from "react";
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  lineStarts: number[];
  durationInFrames: number;
}

export const OutroCtaScene: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const likeAt = Math.round(durationInFrames * 0.35);
  const favAt = Math.round(durationInFrames * 0.56);

  const liked = frame >= likeAt;
  const faved = frame >= favAt;

  const sLike = liked
    ? spring({ frame: frame - likeAt, fps, config: { damping: 12, stiffness: 180 } })
    : 0;
  const sFav = faved
    ? spring({ frame: frame - favAt, fps, config: { damping: 12, stiffness: 180 } })
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
      <Sequence from={likeAt} durationInFrames={8}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.42} />
      </Sequence>
      <Sequence from={favAt} durationInFrames={8}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.42} />
      </Sequence>

      <div style={{ display: "flex", gap: 40 }}>
        <div
          style={{
            width: 300,
            height: 112,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            backgroundColor: liked ? "rgba(16, 72, 58, 0.72)" : "rgba(18, 25, 36, 0.8)",
            border: `2px solid ${liked ? "#34D399" : "rgba(148, 163, 184, 0.25)"}`,
            boxShadow: liked ? "0 0 36px rgba(52, 211, 153, 0.32)" : "none",
            transform: `scale(${liked ? 1 + 0.06 * (1 - Math.abs(sLike - 0.5) * 2) : 1})`,
            fontSize: 34,
            fontWeight: 800,
            color: liked ? "#34D399" : "#E2E8F0",
          }}
        >
          <span style={{ fontSize: 38 }}>{liked ? "♥" : "♡"}</span>
          <span>点赞</span>
        </div>

        <div
          style={{
            width: 300,
            height: 112,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            backgroundColor: faved ? "rgba(16, 72, 58, 0.72)" : "rgba(18, 25, 36, 0.8)",
            border: `2px solid ${faved ? "#FDE68A" : "rgba(148, 163, 184, 0.25)"}`,
            boxShadow: faved ? "0 0 36px rgba(253, 230, 138, 0.28)" : "none",
            transform: `scale(${faved ? 1 + 0.06 * (1 - Math.abs(sFav - 0.5) * 2) : 1})`,
            fontSize: 34,
            fontWeight: 800,
            color: faved ? "#FDE68A" : "#E2E8F0",
          }}
        >
          <span style={{ fontSize: 38 }}>{faved ? "★" : "☆"}</span>
          <span>收藏</span>
        </div>
      </div>
    </div>
  );
};
