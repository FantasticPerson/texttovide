import {
  Scene,
  Storyboard,
  StoryboardSchema,
  TimelineData,
  TimelineScene,
  ItemTiming,
} from "../schema/storyboard";
import { motion } from "../theme";

/**
 * 阅读单元估算（去除 ** 高亮标记）：中文=1，英文/数字=0.5，标点=0.35
 */
export function countReadingUnits(text: string): number {
  const clean = text.replace(/\*\*/g, "");
  let units = 0;
  for (const ch of clean) {
    if (/\s/.test(ch)) continue;
    if (/[\u4e00-\u9fff]/.test(ch)) {
      units += 1;
    } else if (/[A-Za-z0-9]/.test(ch)) {
      units += 0.5;
    } else {
      units += 0.35;
    }
  }
  return units;
}

function collectSceneItemTexts(scene: Scene): string[] {
  switch (scene.type) {
    case "hook":
      return scene.subline ? [scene.headline, scene.subline] : [scene.headline];
    case "chapter":
      return scene.subline ? [scene.title, scene.subline] : [scene.title];
    case "bullets":
      return scene.bullets;
    case "compare":
      return [
        `${scene.before.label} ${scene.before.points.join(" ")}`,
        `${scene.after.label} ${scene.after.points.join(" ")}`,
      ];
    case "flow":
      return scene.steps.map((s) => `${s.label} ${s.detail}`);
    case "quote":
      return [scene.highlight ?? "", scene.quote, scene.caption ?? ""].filter(
        Boolean,
      );
    case "mockup":
      return scene.lines.map((l) => l.text);
    case "grid":
      return scene.cards.map((c) => `${c.title} ${c.desc ?? ""}`);
    case "media": {
      const boxTexts = scene.highlightBoxes?.length
        ? scene.highlightBoxes.map((b, i) => b.label ?? `高亮区域${i + 1}`)
        : scene.caption
          ? [scene.caption]
          : [];
      return [scene.title, ...boxTexts];
    }
    case "diagram":
      return [
        ...scene.inputs.map((n) => `${n.label} ${n.sub ?? ""}`),
        `${scene.center.label} ${scene.center.sub ?? ""}`,
        ...(scene.outputs ?? []).map((n) => `${n.label} ${n.sub ?? ""}`),
      ];
    case "metrics":
      return scene.items.map((m) => `${m.label} ${m.note ?? ""}`);
    case "verdict":
      return scene.items.map((v) => `${v.label} ${v.detail ?? ""}`);
    case "iso-board":
      return scene.nodes.map((n, i) => n.label ?? n.topText ?? `节点${i + 1}`);
    case "iso-stack":
      return scene.layers.map((l) => `${l.from ?? ""} ${l.label} ${l.note ?? ""}`);
    case "iso-metrics":
      return scene.mode === "bars" && scene.bars?.length
        ? scene.bars.map((b) => b.label)
        : [scene.crowdLabel ?? scene.title];
    case "outro":
      return scene.subline
        ? [scene.conclusion, scene.subline]
        : [scene.conclusion];
  }
}

function getSceneHeaderText(scene: Scene): string {
  switch (scene.type) {
    case "bullets":
    case "compare":
    case "flow":
    case "media":
    case "diagram":
    case "metrics":
    case "iso-board":
    case "iso-stack":
    case "iso-metrics":
      return `${scene.kicker ?? ""} ${scene.title}`;
    case "mockup":
    case "grid":
    case "verdict":
      return `${scene.kicker ?? ""} ${scene.title ?? ""}`;
    default:
      return scene.kicker ?? "";
  }
}

function estimateReadingSec(scene: Scene): number {
  if (scene.durationSec !== undefined) {
    return scene.durationSec;
  }

  const headerUnits = countReadingUnits(getSceneHeaderText(scene));
  const itemUnits = collectSceneItemTexts(scene).reduce(
    (sum, t) => sum + countReadingUnits(t),
    0,
  );
  const rawSec = (headerUnits * 0.65 + itemUnits) / 5.0 + 1.3;

  switch (scene.type) {
    case "chapter":
      return Math.max(2.6, Math.min(3.8, Number(rawSec.toFixed(2))));
    case "hook":
      return Math.max(3.6, Math.min(5.2, Number(rawSec.toFixed(2))));
    case "outro":
      return Math.max(3.2, Math.min(4.8, Number(rawSec.toFixed(2))));
    case "grid":
      return Math.max(5.0, Math.min(9.0, Number((rawSec * 0.72).toFixed(2))));
    case "mockup":
      return Math.max(5.5, Math.min(11.0, Number((rawSec * 0.8).toFixed(2))));
    case "media":
      return Math.max(4.5, Math.min(8.0, Number(rawSec.toFixed(2))));
    case "compare":
      return Math.max(5.5, Math.min(10.5, Number((rawSec * 0.72).toFixed(2))));
    case "flow":
      return Math.max(5.5, Math.min(10.5, Number((rawSec * 0.78).toFixed(2))));
    case "quote":
      return Math.max(4.5, Math.min(7.5, Number((rawSec * 0.78).toFixed(2))));
    case "diagram":
      return Math.max(5.5, Math.min(9.5, Number((rawSec * 0.78).toFixed(2))));
    case "metrics":
      return Math.max(5.0, Math.min(9.0, Number((rawSec * 0.76).toFixed(2))));
    case "verdict":
      return Math.max(4.8, Math.min(8.5, Number((rawSec * 0.78).toFixed(2))));
    case "iso-board":
      return Math.max(5.5, Math.min(9.5, Number((rawSec * 0.85).toFixed(2))));
    case "iso-stack":
      return Math.max(6.0, Math.min(11.0, Number((rawSec * 0.85).toFixed(2))));
    case "iso-metrics":
      return Math.max(4.5, Math.min(7.5, Number(rawSec.toFixed(2))));
    default:
      return Math.max(4.5, Math.min(10.0, Number(rawSec.toFixed(2))));
  }
}

function buildItemTimings(
  scene: Scene,
  durationInFrames: number,
  fps: number,
): ItemTiming[] {
  const texts = collectSceneItemTexts(scene);
  if (texts.length === 0) return [];

  const headerLeadFrames =
    scene.type === "hook" || scene.type === "outro" || scene.type === "chapter"
      ? Math.round(0.2 * fps)
      : Math.round(motion.headerLeadSec * fps);

  const exitFrames = Math.round(motion.exitSec * fps);
  const holdFrames = Math.round(motion.minHoldAfterLastActionSec * fps);

  const activeStart = headerLeadFrames;
  const activeEnd = Math.max(
    activeStart + Math.round(0.8 * fps),
    durationInFrames - exitFrames - holdFrames,
  );
  const activeSpan = activeEnd - activeStart;

  if (scene.type === "hook" || scene.type === "chapter") {
    const subDelay = Math.min(
      Math.round(0.95 * fps),
      Math.floor(activeSpan * 0.45),
    );
    if (texts.length === 1) {
      return [
        { startFrame: activeStart, endFrame: durationInFrames - exitFrames },
      ];
    }
    return [
      { startFrame: activeStart, endFrame: activeStart + subDelay },
      {
        startFrame: activeStart + subDelay,
        endFrame: durationInFrames - exitFrames,
      },
    ];
  }

  // grid 非聚光灯模式 & diagram / iso-board 沙盘快速错峰入场，让完整结构尽早呈现并保持光点流动
  if (
    (scene.type === "grid" && !scene.focusMode) ||
    scene.type === "diagram" ||
    scene.type === "iso-board"
  ) {
    const maxStep =
      scene.type === "grid" ? Math.round(0.22 * fps) : Math.round(0.38 * fps);
    const stepFrames = Math.max(
      4,
      Math.min(maxStep, Math.floor((activeSpan * 0.65) / texts.length)),
    );
    return texts.map((_, idx) => ({
      startFrame: activeStart + idx * stepFrames,
      endFrame: durationInFrames - exitFrames,
    }));
  }

  const weights = texts.map((t) => Math.max(4, countReadingUnits(t)));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let cursor = activeStart;
  return weights.map((w, idx) => {
    const startFrame = cursor;
    const isLast = idx === weights.length - 1;
    const slot = isLast
      ? durationInFrames - exitFrames - startFrame
      : Math.max(
          Math.round(0.65 * fps),
          Math.round((w / totalWeight) * activeSpan),
        );
    const endFrame = Math.min(durationInFrames - exitFrames, startFrame + slot);
    cursor = endFrame;
    return { startFrame, endFrame };
  });
}

export function buildTimeline(input: unknown): TimelineData {
  const storyboard: Storyboard = StoryboardSchema.parse(input);
  const { fps, width, height, title, bgm, sfx, theme, chapters, showChapterBar } = storyboard;

  let cursorFrame = 0;
  const scenes: TimelineScene[] = storyboard.scenes.map((scene, index) => {
    const readingSec = estimateReadingSec(scene);
    const durationInFrames = Math.round(readingSec * fps);
    const itemTimings = buildItemTimings(scene, durationInFrames, fps);
    const startFrame = cursorFrame;
    cursorFrame += durationInFrames;

    return {
      scene,
      index,
      startFrame,
      durationInFrames,
      readingSec,
      itemTimings,
    };
  });

  return {
    title,
    theme,
    fps,
    width,
    height,
    chapters,
    showChapterBar,
    totalFrames: cursorFrame,
    totalSec: Number((cursorFrame / fps).toFixed(2)),
    bgm,
    sfx,
    scenes,
  };
}
