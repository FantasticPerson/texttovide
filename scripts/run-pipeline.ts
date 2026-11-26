import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const skipAssets = args.includes("--skip-assets");
const framesOnly = args.includes("--frames-only");
const forceAssets = args.includes("--force-assets");

if (!slug) {
  console.error("用法: tsx scripts/run-pipeline.ts <slug> [--skip-assets] [--frames-only] [--force-assets]");
  process.exit(1);
}

const tsxBin = path.resolve(process.cwd(), "node_modules", ".bin", "tsx");
const run = (script: string, extraArgs: string[] = []) => {
  console.log(`\n▶ 运行 ${script} ${extraArgs.join(" ")}`);
  execFileSync(tsxBin, [script, ...extraArgs], { stdio: "inherit" });
};

// 1. 校验视觉系统风格包
run("scripts/verify-styles.ts");

// 2. 自动生产素材（生图 + 网页截图）
const manifestPath = path.resolve(process.cwd(), "content", slug, "assets-manifest.json");
if (!skipAssets && fs.existsSync(manifestPath)) {
  run("scripts/fetch-assets.ts", forceAssets ? [slug, "--force"] : [slug]);
} else {
  console.log("\n▶ 跳过素材生产（无 assets-manifest.json 或指定 --skip-assets）");
}

// 3. 校验分镜并计算基础时间轴
run("scripts/build-timeline.ts", [slug]);

// 3.5 若分镜含 narration 且本地已就绪 Qwen3-TTS 与本人参考音，自动合成克隆旁白并对齐时间轴
const ttsPy = path.resolve(process.cwd(), ".venv-tts", "bin", "python");
const refWav = path.resolve(process.cwd(), "voice", "my-ref.wav");
const sbPath = path.resolve(process.cwd(), "content", slug, "storyboard.json");
const sbRaw = JSON.parse(fs.readFileSync(sbPath, "utf-8"));
const hasNarration = Array.isArray(sbRaw.scenes) && sbRaw.scenes.some((s: { narration?: string[] }) => Array.isArray(s.narration) && s.narration.length > 0);
if (hasNarration && fs.existsSync(ttsPy) && fs.existsSync(refWav)) {
  console.log(`\n▶ 运行 scripts/build-narration.py ${slug} (Qwen3-TTS 本人声音克隆)`);
  execFileSync(ttsPy, ["scripts/build-narration.py", slug], { stdio: "inherit" });
}

// 4. 抽取关键帧用于目检
run("scripts/render-frames.ts", [slug]);

// 5. 渲染完整 MP4
if (!framesOnly) {
  run("scripts/render-video.ts", [slug]);
}

console.log(`\n✓ 工作流完成 [${slug}]`);
