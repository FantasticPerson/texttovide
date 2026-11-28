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
import { DiagramScene } from "./scenes/DiagramScene";
import { MetricsScene } from "./scenes/MetricsScene";
import { VerdictScene } from "./scenes/VerdictScene";
import { IsoBoardScene } from "./scenes/IsoBoardScene";
import { IsoStackScene } from "./scenes/IsoStackScene";
import { IsoMetricsScene } from "./scenes/IsoMetricsScene";
import { HandDrawScene } from "./scenes/HandDrawScene";
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
    case "diagram":
      return <DiagramScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "metrics":
      return <MetricsScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "verdict":
      return <VerdictScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "iso-board":
      return <IsoBoardScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "iso-stack":
      return <IsoStackScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "iso-metrics":
      return <IsoMetricsScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "hand-draw":
      return <HandDrawScene scene={scene} itemTimings={itemTimings} theme={theme} />;
    case "outro":
      return <OutroScene scene={scene} itemTimings={itemTimings} theme={theme} />;
  }
};

const renderSceneSfx = (
  item: TimelineScene,
  idx: number,
  fps: number,
  sfxScale: number,
) => {
  const cues: Array<{ key: string; from: number; dur: number; file: string; volume: number }> = [];

  // 切屏微风声（首屏除外）
  if (idx > 0) {
    cues.push({
      key: "whoosh",
      from: 0,
      dur: Math.ceil(0.32 * fps),
      file: "sfx/whoosh.wav",
      volume: Math.min(1, 0.45 * sfxScale),
    });
  }

  // 结构化元素出现音效（按 itemTimings 精准对齐，自动去重防过密）
  const type = item.scene.type;
  let itemFile: string | null = null;
  let itemVol = 0;
  let maxItems = 0;

  if (
    type === "bullets" ||
    type === "compare" ||
    type === "flow" ||
    type === "grid" ||
    type === "diagram" ||
    type === "metrics" ||
    type === "iso-board" ||
    type === "iso-stack" ||
    type === "iso-metrics"
  ) {
    itemFile = "sfx/pop.wav";
    itemVol = Math.min(1, 0.28 * sfxScale);
    maxItems = 8;
  } else if (type === "mockup" || type === "verdict") {
    itemFile = "sfx/click.wav";
    itemVol = Math.min(1, 0.24 * sfxScale);
    maxItems = 5;
  } else if (type === "media") {
    itemFile = "sfx/click.wav";
    itemVol = Math.min(1, 0.24 * sfxScale);
    maxItems = 4;
  }

  if (itemFile && maxItems > 0) {
    let lastFrame = -999;
    let count = 0;
    for (const timing of item.itemTimings) {
      if (count >= maxItems) break;
      const f = Math.max(0, timing.startFrame);
      if (f - lastFrame < 5 || f >= item.durationInFrames - 4) continue;
      cues.push({
        key: `item-${count}`,
        from: f,
        dur: Math.ceil(0.15 * fps),
        file: itemFile,
        volume: itemVol,
      });
      lastFrame = f;
      count += 1;
    }
  }

  return cues.map((cue) => (
    <Sequence
      key={cue.key}
      from={cue.from}
      durationInFrames={Math.min(cue.dur, Math.max(1, item.durationInFrames - cue.from))}
    >
      <Audio src={staticFile(cue.file)} volume={cue.volume} />
    </Sequence>
  ));
};

export const Video: React.FC<VideoProps> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalScenes = timeline.scenes.length;
  const chapters = timeline.chapters ?? [];
  const hasChapters = Boolean(timeline.showChapterBar) && chapters.length > 0;
  const sfxEnabled = timeline.sfx?.enabled !== false;
  const sfxScale = timeline.sfx?.volume ?? 1;

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
              transition={item.scene.transition}
              camera={item.scene.camera}
            >
              {renderSceneBody(item, sceneTheme)}
            </SceneShell>
            {sfxEnabled && renderSceneSfx(item, idx, fps, sfxScale)}
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
