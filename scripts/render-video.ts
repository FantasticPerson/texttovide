import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { TimelineData } from "../src/schema/storyboard";

const slug = process.argv[2] || "demo-tech";
const timelinePath = path.resolve(process.cwd(), "content", slug, "timeline.json");
const outDir = path.resolve(process.cwd(), "out");
const outFile = path.join(outDir, `${slug}.mp4`);

if (!fs.existsSync(timelinePath)) {
  console.error(`找不到 timeline.json，请先运行: pnpm build:timeline ${slug}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const timeline: TimelineData = JSON.parse(fs.readFileSync(timelinePath, "utf-8"));
const propsFile = path.join(outDir, `_${slug}_props.json`);
fs.writeFileSync(propsFile, JSON.stringify({ timeline }), "utf-8");

const remotionBin = path.resolve(process.cwd(), "node_modules", ".bin", "remotion");

try {
  execFileSync(
    remotionBin,
    [
      "render",
      "src/index.ts",
      "MainVideo",
      outFile,
      `--props=${propsFile}`,
    ],
    { stdio: "inherit" },
  );
  console.log(`✓ 成片已导出: out/${slug}.mp4`);
} finally {
  if (fs.existsSync(propsFile)) fs.unlinkSync(propsFile);
}
