import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { themes } from "./theme";
import { ChapterBar } from "./components/ChapterBar";
import { SpaceBackdrop } from "./motion/SpaceBackdrop";
import { OpeningGridScene } from "./scenes/pro/OpeningGridScene";
import { LlmPredictScene } from "./scenes/pro/LlmPredictScene";
import { TokenSplitScene } from "./scenes/pro/TokenSplitScene";
import { WorkbenchScene } from "./scenes/pro/WorkbenchScene";
import { PromptTerminalScene } from "./scenes/pro/PromptTerminalScene";
import { RagFlowScene } from "./scenes/pro/RagFlowScene";
import { McpHubScene } from "./scenes/pro/McpHubScene";
import { SpotlightSummaryScene } from "./scenes/pro/SpotlightSummaryScene";
import { OutroCtaScene } from "./scenes/pro/OutroCtaScene";

export interface ProLine {
  text: string;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  localStartFrame: number;
  localEndFrame: number;
}

export interface ProScene {
  id: string;
  type: string;
  chapter: string;
  startFrame: number;
  durationInFrames: number;
  lines: ProLine[];
}

export interface ProTimeline {
  title: string;
  fps: number;
  width: number;
  height: number;
  chapters: string[];
  narrationFile: string;
  bgmFile: string;
  totalFrames: number;
  totalSec: number;
  scenes: ProScene[];
  subtitles: Array<{
    text: string;
    startFrame: number;
    endFrame: number;
  }>;
}

export type ProVideoProps = {
  timeline: ProTimeline;
};

const SceneFade: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        paddingTop: 64,
        paddingBottom: 110,
        paddingLeft: 80,
        paddingRight: 80,
        fontFamily: themes["dark-tech"].fonts.sans,
        opacity: enter * exit,
        display: "flex",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const renderProScene = (scene: ProScene) => {
  const lineStarts = scene.lines.map((l) => l.localStartFrame);
  switch (scene.type) {
    case "opening-grid":
      return <OpeningGridScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    case "llm-predict":
      return <LlmPredictScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    case "token-split":
      return <TokenSplitScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    case "workbench":
      return <WorkbenchScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    case "prompt-terminal":
      return <PromptTerminalScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    case "rag-flow":
      return <RagFlowScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    case "mcp-hub":
      return <McpHubScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    case "spotlight-summary":
      return <SpotlightSummaryScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    case "outro-cta":
      return <OutroCtaScene lineStarts={lineStarts} durationInFrames={scene.durationInFrames} />;
    default:
      return null;
  }
};

export const ProVideo: React.FC<ProVideoProps> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = themes["dark-tech"];

  const currentScene =
    timeline.scenes.find(
      (s) => frame >= s.startFrame && frame < s.startFrame + s.durationInFrames,
    ) ?? timeline.scenes[timeline.scenes.length - 1];

  const activeSub = timeline.subtitles.find(
    (s) => frame >= s.startFrame && frame <= s.endFrame,
  );

  const progress = Math.min(1, Math.max(0, frame / Math.max(1, timeline.totalFrames - 1)));

  return (
    <AbsoluteFill>
      <SpaceBackdrop />

      {/* 轨 1：神经旁白主音轨 */}
      <Audio src={staticFile(timeline.narrationFile)} volume={1.0} />

      {/* 轨 2：轻快电子律动 BGM（循环 + 首尾淡入淡出 + 低音量衬底不抢人声） */}
      <Audio
        src={staticFile(timeline.bgmFile)}
        loop
        volume={(f) => {
          const inGain = interpolate(f, [0, Math.round(1.0 * fps)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const outGain = interpolate(
            f,
            [timeline.totalFrames - Math.round(1.8 * fps), timeline.totalFrames],
            [1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          return 0.14 * inGain * outGain;
        }}
      />

      {/* 场景序列 */}
      {timeline.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={scene.durationInFrames}
          name={`${scene.id}-${scene.type}`}
        >
          <SceneFade durationInFrames={scene.durationInFrames}>
            {renderProScene(scene)}
          </SceneFade>
        </Sequence>
      ))}

      {/* 顶部章节导航条 */}
      <ChapterBar
        chapters={timeline.chapters}
        activeChapter={currentScene?.chapter}
        theme={theme}
        progress={progress}
      />

      {/* 底部音频精准同步单行短字幕（去句末标点，极简暖白） */}
      {activeSub && (
        <div
          style={{
            position: "absolute",
            left: 100,
            right: 100,
            bottom: 38,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: 31,
              fontWeight: 600,
              color: "#FEF3C7",
              letterSpacing: "0.06em",
              textShadow: "0 2px 12px rgba(0, 0, 0, 0.85)",
            }}
          >
            {activeSub.text.replace(/[。，！？；]$/, "")}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
