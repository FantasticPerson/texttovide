import fs from "node:fs";
import path from "node:path";
import { buildTimeline } from "../src/timeline/build";

const slug = process.argv[2] || "demo";
const dir = path.resolve(process.cwd(), "content", slug);
const storyboardPath = path.join(dir, "storyboard.json");
const timelinePath = path.join(dir, "timeline.json");

if (!fs.existsSync(storyboardPath)) {
  console.error(`找不到分镜文件: ${storyboardPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(storyboardPath, "utf-8"));
const timeline = buildTimeline(raw);

fs.writeFileSync(timelinePath, JSON.stringify(timeline, null, 2) + "\n", "utf-8");

console.log(`✓ 校验通过并生成: content/${slug}/timeline.json`);
console.log(
  `  画布: ${timeline.width}x${timeline.height} @ ${timeline.fps}fps | 总时长: ${timeline.totalSec}s (${timeline.totalFrames} 帧)`,
);
for (const s of timeline.scenes) {
  const endFrame = s.startFrame + s.durationInFrames;
  console.log(
    `  [${s.scene.id}] ${s.scene.type.padEnd(8)} ${String(s.startFrame).padStart(4)}..${String(endFrame).padEnd(4)} (${s.readingSec.toFixed(2)}s)`,
  );
}
