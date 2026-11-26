import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FRAME = path.join(ROOT, "assets/frame-template.png");
const INPUT_DIR = path.join(ROOT, "output");
const OUTPUT_DIR = path.join(ROOT, "output-framed");

// 右下角 "AI生成" 水印区域: 约 600-720 宽，1200-1280 高
const WATERMARK_LEFT = 600;
const WATERMARK_TOP = 1200;

async function applyFrame(inputPath, outputPath) {
  const img = sharp(inputPath);
  const { info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // 先去掉右下角 "AI生成" 水印：用水印上方的深色蓝紫像素克隆覆盖
  const cloneHeight = 90;
  const cloneY = WATERMARK_TOP - cloneHeight;
  const clone = await img
    .extract({ left: WATERMARK_LEFT, top: cloneY, width: width - WATERMARK_LEFT, height: cloneHeight })
    .toBuffer();

  await sharp(inputPath)
    .composite([
      // 1. 覆盖水印
      { input: clone, left: WATERMARK_LEFT, top: WATERMARK_TOP, blend: "over" },
      // 2. 叠加统一边框
      { input: FRAME, blend: "over" },
    ])
    .png()
    .toFile(outputPath);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(INPUT_DIR)
    .filter((f) => f.endsWith(".png"))
    .sort((a, b) => Number(a.split("-")[0]) - Number(b.split("-")[0]));

  console.log(`共 ${files.length} 张待合成`);

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const src = path.join(INPUT_DIR, f);
    const dest = path.join(OUTPUT_DIR, f);

    if (fs.existsSync(dest)) {
      console.log(`[${i + 1}/${files.length}] ${f} ⏭  已存在`);
      continue;
    }

    try {
      await applyFrame(src, dest);
      console.log(`[${i + 1}/${files.length}] ${f} ✓`);
    } catch (e) {
      console.error(`[${i + 1}/${files.length}] ${f} ✗ ${e.message}`);
    }
  }

  console.log(`\n完成，已输出至 ${OUTPUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
