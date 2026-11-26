import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { TimelineData } from "../src/schema/storyboard";

const slug = process.argv[2] || "demo-tech";
const timelinePath = path.resolve(process.cwd(), "content", slug, "timeline.json");
const outDir = path.resolve(process.cwd(), "out", `${slug}-frames`);

if (!fs.existsSync(timelinePath)) {
  console.error(`找不到 timeline.json，请先运行: pnpm build:timeline ${slug}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const timeline: TimelineData = JSON.parse(fs.readFileSync(timelinePath, "utf-8"));

const propsFile = path.join(outDir, "_props.json");
fs.writeFileSync(propsFile, JSON.stringify({ timeline }), "utf-8");

// 每个场景抽取「中段展示态」1 帧 + 最后一个场景抽取「片尾前 1 秒」确认未截断
const targets: Array<{ name: string; frame: number }> = [];
for (const s of timeline.scenes) {
  const midFrame = s.startFrame + Math.floor(s.durationInFrames * 0.65);
  targets.push({ name: `${s.scene.id}-${s.scene.type}-f${midFrame}.png`, frame: midFrame });
}
const last = timeline.scenes[timeline.scenes.length - 1];
const nearEnd = Math.max(0, last.startFrame + last.durationInFrames - Math.round(timeline.fps * 0.7));
targets.push({ name: `99-end-check-f${nearEnd}.png`, frame: nearEnd });

const remotionBin = path.resolve(process.cwd(), "node_modules", ".bin", "remotion");

for (const t of targets) {
  const outFile = path.join(outDir, t.name);
  execFileSync(
    remotionBin,
    [
      "still",
      "src/index.ts",
      "MainVideo",
      outFile,
      `--frame=${t.frame}`,
      `--props=${propsFile}`,
    ],
    { stdio: "inherit" },
  );
}

fs.unlinkSync(propsFile);
console.log(`✓ 已抽取 ${targets.length} 张关键帧到 out/${slug}-frames/`);
