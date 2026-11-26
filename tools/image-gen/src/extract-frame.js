import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "output/5-教皇.png"); // 边框最标准的样本
const OUT = path.join(ROOT, "assets/frame-template.png");

function isGoldish(r, g, b, a = 255) {
  if (a < 128) return false;
  // 金色：R/G 都高，B 低，且 R ≈ G > B
  const sum = r + g + b;
  if (sum === 0) return false;
  const rRatio = r / sum;
  const gRatio = g / sum;
  const bRatio = b / sum;
  return rRatio > 0.32 && gRatio > 0.32 && bRatio < 0.28 && Math.abs(r - g) < 30;
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const img = sharp(SRC);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // 新建 RGBA buffer，全透明
  const frameData = Buffer.alloc(width * height * 4);

  // 只保留边缘 60px 内的金色像素（中间全部挖空）
  const margin = 60;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const j = (y * width + x) * 4;

      // 非边缘区 → 全透明
      if (x > margin && x < width - margin && y > margin && y < height - margin) {
        continue;
      }

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 边缘区且是金色 → 保留，设为不透明金色
      if (isGoldish(r, g, b)) {
        frameData[j] = r;
        frameData[j + 1] = g;
        frameData[j + 2] = b;
        frameData[j + 3] = 255;
      }
    }
  }

  await sharp(frameData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(OUT);

  console.log(`边框模板已生成: ${OUT} (${width}x${height})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
