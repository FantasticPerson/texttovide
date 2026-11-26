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
import { TimelineData, TimelineScene } from "./schema/storyboard";
import { ThemeTokens, resolveTheme } from "./theme";
import { SceneShell } from "./components/SceneShell";
import { ChapterBar } from "./components/ChapterBar";
import { HookScene } from "./scenes/HookScene";
import { ChapterScene } from "./scenes/ChapterScene";
import { BulletsScene } from "./scenes/BulletsScene";
import { CompareScene } from "./scenes/CompareScene";
import { FlowScene } from "./scenes/FlowScene";
import { QuoteScene } from "./scenes/QuoteScene";
import { MockupScene } from "./scenes/MockupScene";
import { GridScene } from "./scenes/GridScene";
import { MediaScene } from "./scenes/MediaScene";
import { OutroScene } from "./scenes/OutroScene";

export type VideoProps = {
  timeline: TimelineData;
};

const renderSceneBody = (item: TimelineScene, theme: ThemeTokens) => {
  const { scene, itemTimings } = item;
  switch (scene.type) {
    case "hook":
      return <HookScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "chapter":
      return <ChapterScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "bullets":
      return <BulletsScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "compare":
      return <CompareScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "flow":
      return <FlowScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "quote":
      return <QuoteScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "mockup":
      return <MockupScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "grid":
      return <GridScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "media":
      return <MediaScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "outro":
      return <OutroScene scene={scene} itemTimings={itemTimings} theme={theme} />;
  }
};

export const Video: React.FC<VideoProps> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalScenes = timeline.scenes.length;
  const chapters = timeline.chapters ?? [];
  const hasChapters = chapters.length > 0;

  const currentItem =
    timeline.scenes.find(
      (s) => frame >= s.startFrame && frame < s.startFrame + s.durationInFrames,
    ) ?? timeline.scenes[timeline.scenes.length - 1];

  const activeTheme = resolveTheme(
    timeline.theme ?? "dark-tech",
    Boolean(currentItem?.scene.invert),
  );
  const progress = Math.min(
    1,
    Math.max(0, frame / Math.max(1, timeline.totalFrames - 1)),
  );
  const hasTimedSubtitles = Boolean(timeline.subtitles && timeline.subtitles.length > 0);
  const activeCue = hasTimedSubtitles
    ? timeline.subtitles!.find((c) => frame >= c.startFrame && frame <= c.endFrame)
    : undefined;

  return (
    <AbsoluteFill>
      {/* 主人克隆旁白主音轨 */}
      {timeline.narrationFile && (
        <Audio src={staticFile(timeline.narrationFile)} volume={1.0} />
      )}

      {timeline.bgm && (
        <Audio
          src={staticFile(timeline.bgm.file)}
          loop
          volume={(f) => {
            const fadeInFrames = Math.max(1, Math.round(timeline.bgm!.fadeInSec * fps));
            const fadeOutFrames = Math.max(1, Math.round(timeline.bgm!.fadeOutSec * fps));
            const base = timeline.bgm!.volume;
            const inGain = interpolate(f, [0, fadeInFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const outGain = interpolate(
              f,
              [timeline.totalFrames - fadeOutFrames, timeline.totalFrames],
              [1, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            return base * inGain * outGain;
          }}
        />
      )}

      {timeline.scenes.map((item, idx) => {
        const sceneTheme = resolveTheme(
          timeline.theme ?? "dark-tech",
          Boolean(item.scene.invert),
        );
        return (
          <Sequence
            key={item.scene.id}
            from={item.startFrame}
            durationInFrames={item.durationInFrames}
            name={`${item.scene.id}-${item.scene.type}`}
          >
            <SceneShell
              theme={sceneTheme}
              durationInFrames={item.durationInFrames}
              sceneIndex={idx}
              totalScenes={totalScenes}
              kicker={item.scene.kicker}
              subtitle={hasTimedSubtitles ? undefined : item.scene.subtitle}
              hasChapters={hasChapters}
              isFirst={idx === 0}
              isLast={idx === totalScenes - 1}
              hideTopMeta={item.scene.type === "chapter"}
            >
              {renderSceneBody(item, sceneTheme)}
            </SceneShell>
          </Sequence>
        );
      })}

      {/* 音频帧级同步单行短字幕 */}
      {activeCue && (
        <div
          style={{
            position: "absolute",
            left: 110,
            right: 110,
            bottom: 38,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 25,
          }}
        >
          <div
            style={{
              padding: activeTheme.colors.subtitleBg === "transparent" ? "4px 12px" : "8px 24px",
              borderRadius: 8,
              backgroundColor: activeTheme.colors.subtitleBg,
              color: activeTheme.colors.subtitleText,
              fontFamily: activeTheme.fonts.sans,
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textShadow: activeTheme.isDark ? "0 2px 12px rgba(0, 0, 0, 0.85)" : "none",
            }}
          >
            {activeCue.text.replace(/[。，！？；]$/, "")}
          </div>
        </div>
      )}

      {hasChapters && (
        <ChapterBar
          chapters={chapters}
          activeChapter={currentItem?.scene.chapter}
          theme={activeTheme}
          progress={progress}
        />
      )}
    </AbsoluteFill>
  );
};
