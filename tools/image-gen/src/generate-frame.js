import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "assets/frame-template.svg");
const OUT_PNG = path.join(ROOT, "assets/frame-template.png");

const W = 720;
const H = 1280;
const LINE = "#d4af37"; // 金属金色
const LINE_WIDTH = 2.5;
const INNER_MARGIN = 14;
const CORNER_SIZE = 35;

// 四角卷草纹样坐标（用贝塞尔曲线模拟教皇款）
const CORNER_TL = `
  M ${INNER_MARGIN} ${INNER_MARGIN + CORNER_SIZE}
  Q ${INNER_MARGIN + 8} ${INNER_MARGIN + CORNER_SIZE - 5} ${INNER_MARGIN + 12} ${INNER_MARGIN + CORNER_SIZE - 15}
  Q ${INNER_MARGIN + 16} ${INNER_MARGIN + CORNER_SIZE - 25} ${INNER_MARGIN + CORNER_SIZE / 2} ${INNER_MARGIN + 8}
  Q ${INNER_MARGIN + CORNER_SIZE - 10} ${INNER_MARGIN + 5} ${INNER_MARGIN + CORNER_SIZE} ${INNER_MARGIN}
`;

const CORNER_TR = `
  M ${W - INNER_MARGIN - CORNER_SIZE} ${INNER_MARGIN}
  Q ${W - INNER_MARGIN - CORNER_SIZE + 10} ${INNER_MARGIN + 5} ${W - INNER_MARGIN - CORNER_SIZE / 2} ${INNER_MARGIN + 8}
  Q ${W - INNER_MARGIN - 16} ${INNER_MARGIN + CORNER_SIZE - 25} ${W - INNER_MARGIN - 12} ${INNER_MARGIN + CORNER_SIZE - 15}
  Q ${W - INNER_MARGIN - 8} ${INNER_MARGIN + CORNER_SIZE - 5} ${W - INNER_MARGIN} ${INNER_MARGIN + CORNER_SIZE}
`;

const CORNER_BL = `
  M ${INNER_MARGIN} ${H - INNER_MARGIN - CORNER_SIZE}
  Q ${INNER_MARGIN + 8} ${H - INNER_MARGIN - CORNER_SIZE + 5} ${INNER_MARGIN + 12} ${H - INNER_MARGIN - CORNER_SIZE + 15}
  Q ${INNER_MARGIN + 16} ${H - INNER_MARGIN - CORNER_SIZE + 25} ${INNER_MARGIN + CORNER_SIZE / 2} ${H - INNER_MARGIN - 8}
  Q ${INNER_MARGIN + CORNER_SIZE - 10} ${H - INNER_MARGIN - 5} ${INNER_MARGIN + CORNER_SIZE} ${H - INNER_MARGIN}
`;

const CORNER_BR = `
  M ${W - INNER_MARGIN - CORNER_SIZE} ${H - INNER_MARGIN}
  Q ${W - INNER_MARGIN - CORNER_SIZE + 10} ${H - INNER_MARGIN - 5} ${W - INNER_MARGIN - CORNER_SIZE / 2} ${H - INNER_MARGIN - 8}
  Q ${W - INNER_MARGIN - 16} ${H - INNER_MARGIN - CORNER_SIZE + 25} ${W - INNER_MARGIN - 12} ${H - INNER_MARGIN - CORNER_SIZE + 15}
  Q ${W - INNER_MARGIN - 8} ${H - INNER_MARGIN - CORNER_SIZE + 5} ${W - INNER_MARGIN} ${H - INNER_MARGIN - CORNER_SIZE}
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- 外框 -->
  <rect x="${INNER_MARGIN}" y="${INNER_MARGIN}" width="${W - INNER_MARGIN * 2}" height="${H - INNER_MARGIN * 2}"
        fill="none" stroke="${LINE}" stroke-width="${LINE_WIDTH}" />
  <!-- 内框 -->
  <rect x="${INNER_MARGIN + 6}" y="${INNER_MARGIN + 6}" width="${W - (INNER_MARGIN + 6) * 2}" height="${H - (INNER_MARGIN + 6) * 2}"
        fill="none" stroke="${LINE}" stroke-width="${LINE_WIDTH * 0.8}" />
  <!-- 四角卷草纹样 -->
  <path d="${CORNER_TL}" fill="none" stroke="${LINE}" stroke-width="${LINE_WIDTH}" stroke-linecap="round" />
  <path d="${CORNER_TR}" fill="none" stroke="${LINE}" stroke-width="${LINE_WIDTH}" stroke-linecap="round" />
  <path d="${CORNER_BL}" fill="none" stroke="${LINE}" stroke-width="${LINE_WIDTH}" stroke-linecap="round" />
  <path d="${CORNER_BR}" fill="none" stroke="${LINE}" stroke-width="${LINE_WIDTH}" stroke-linecap="round" />
</svg>`;

fs.writeFileSync(OUT, svg);
console.log(`SVG 边框模板: ${OUT}`);

// 转 PNG
sharp(Buffer.from(svg))
  .png()
  .toFile(OUT_PNG)
  .then(() => console.log(`PNG 边框模板: ${OUT_PNG}`));
