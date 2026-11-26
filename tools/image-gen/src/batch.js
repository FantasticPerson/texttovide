import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { generateImage } from "./cloudbase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const PROMPTS_FILE = path.join(ROOT, "card-prompts.json");

const SIZE = "720x1280"; // 9:16
const DELAY_MS = 1500; // 每张间隔，避免限流
const LIMIT = process.argv[2] ? Number(process.argv[2]) : Infinity; // 可传数量，先跑 N 张

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`下载失败 HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          fs.writeFileSync(dest, Buffer.concat(chunks));
          resolve();
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function safeName(s) {
  return s.replace(/[\/\\:*?"<>|]/g, "_");
}

async function main() {
  const { items } = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf-8"));
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const targets = items.slice(0, LIMIT);
  console.log(`共 ${items.length} 张，本次处理 ${targets.length} 张，尺寸 ${SIZE}`);

  const failed = [];
  for (let i = 0; i < targets.length; i++) {
    const card = targets[i];
    const file = path.join(OUTPUT_DIR, `${card.cardId}-${safeName(card.name)}.png`);
    const tag = `[${i + 1}/${targets.length}] ${card.name}`;

    if (fs.existsSync(file)) {
      console.log(`${tag} ⏭  已存在，跳过`);
      continue;
    }

    try {
      const { url } = await generateImage(card.prompt, { size: SIZE });
      await downloadImage(url, file);
      console.log(`${tag} ✓`);
    } catch (err) {
      console.error(`${tag} ✗  ${err?.message || err}`);
      failed.push({ cardId: card.cardId, name: card.name, error: String(err?.message || err) });
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n完成。成功保存至 output/，失败 ${failed.length} 张`);
  if (failed.length) {
    console.log("失败列表:", failed.map((f) => `${f.cardId}-${f.name}`).join(", "));
    console.log("（重跑本命令会自动跳过已成功的，只补失败的）");
  }
}

main().catch((e) => {
  console.error("批量任务异常:", e);
  process.exit(1);
});
