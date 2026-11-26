import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { AssetsManifestSchema, AssetItem } from "../src/schema/assets";

const slug = process.argv[2];
const force = process.argv.includes("--force");

if (!slug || slug.startsWith("--")) {
  console.error("用法: tsx scripts/fetch-assets.ts <slug> [--force]");
  process.exit(1);
}

const manifestPath = path.resolve(process.cwd(), "content", slug, "assets-manifest.json");
const outDir = path.resolve(process.cwd(), "public", "assets", slug);

if (!fs.existsSync(manifestPath)) {
  console.log(`ℹ️  未找到 ${manifestPath}，跳过素材生产。`);
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
const manifest = AssetsManifestSchema.parse(
  JSON.parse(fs.readFileSync(manifestPath, "utf-8")),
);

/** 从风格包的 image-prompt.md 提取正向前缀和负面禁令 */
function loadStyleImagePrompt(styleId: string): { prefix: string; negative: string } {
  const mdPath = path.resolve(process.cwd(), "src", "styles", styleId, "image-prompt.md");
  if (!fs.existsSync(mdPath)) return { prefix: "", negative: "" };
  const text = fs.readFileSync(mdPath, "utf-8");
  const blocks = [...text.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].trim());
  return {
    prefix: blocks[0] ?? "",
    negative: blocks[1] ?? "",
  };
}

/** 递归查找 Remotion 已下载的 chrome-headless-shell 可执行文件 */
function findHeadlessChrome(): string {
  const remotionDir = path.resolve(process.cwd(), "node_modules", ".remotion");
  if (!fs.existsSync(remotionDir)) {
    throw new Error("未找到 node_modules/.remotion 浏览器，请先运行 ./node_modules/.bin/remotion browser ensure");
  }
  const stack = [remotionDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name === "chrome-headless-shell" || entry.name === "chrome") {
        return full;
      }
    }
  }
  throw new Error("未找到无头 Chrome 可执行文件");
}

function downloadUrl(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https:") ? https : http;
    mod
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadUrl(res.headers.location, dest).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`下载失败 HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          fs.writeFileSync(dest, Buffer.concat(chunks));
          resolve();
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function handleAiImage(
  item: Extract<AssetItem, { type: "ai-image" }>,
  dest: string,
  styleSpec: { prefix: string; negative: string },
) {
  const cloudbasePath = path.resolve(process.cwd(), "tools", "image-gen", "src", "cloudbase.js");
  if (!fs.existsSync(cloudbasePath)) {
    throw new Error(`找不到生图模块: ${cloudbasePath}`);
  }
  const mod = await import(pathToFileURL(cloudbasePath).href);
  const fullPrompt = item.skipStylePrefix
    ? item.prompt
    : [styleSpec.prefix, item.prompt, styleSpec.negative].filter(Boolean).join(", ");

  const { url } = await mod.generateImage(fullPrompt, {
    size: item.size,
    revise: item.revise,
  });
  await downloadUrl(url, dest);
}

async function handleWebCapture(
  item: Extract<AssetItem, { type: "web-capture" }>,
  dest: string,
) {
  const chromeBin = findHeadlessChrome();
  const port = 19222 + Math.floor(Math.random() * 1000);
  const child = spawn(
    chromeBin,
    [
      `--remote-debugging-port=${port}`,
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${item.width},${item.height}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    // 等待 CDP HTTP 端口就绪
    let wsUrl = "";
    for (let i = 0; i < 40; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${port}/json/list`);
        const pages = (await resp.json()) as Array<{ type: string; webSocketDebuggerUrl?: string }>;
        const page = pages.find((p) => p.type === "page" && p.webSocketDebuggerUrl);
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await sleep(150);
    }
    if (!wsUrl) throw new Error("无头 Chrome CDP 端口启动超时");

    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = (e) => reject(new Error(`CDP WebSocket 连接失败: ${String(e)}`));
    });

    let msgId = 1;
    const send = (method: string, params: Record<string, unknown> = {}) =>
      new Promise<Record<string, unknown>>((resolve, reject) => {
        const id = msgId++;
        const onMessage = (ev: MessageEvent) => {
          const data = JSON.parse(String(ev.data)) as {
            id?: number;
            result?: Record<string, unknown>;
            error?: { message: string };
          };
          if (data.id === id) {
            ws.removeEventListener("message", onMessage);
            if (data.error) reject(new Error(data.error.message));
            else resolve(data.result ?? {});
          }
        };
        ws.addEventListener("message", onMessage);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: item.width,
      height: item.height,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await send("Page.navigate", { url: item.url });
    await sleep(item.waitMs);

    const shot = await send("Page.captureScreenshot", {
      format: "png",
      ...(item.clip
        ? {
            clip: {
              x: item.clip.x,
              y: item.clip.y,
              width: item.clip.width,
              height: item.clip.height,
              scale: 1,
            },
          }
        : {}),
    });
    ws.close();

    const b64 = String(shot.data || "");
    if (!b64) throw new Error("CDP 截图返回空数据");
    fs.writeFileSync(dest, Buffer.from(b64, "base64"));
  } finally {
    child.kill("SIGKILL");
  }
}

async function main() {
  const styleSpec = loadStyleImagePrompt(manifest.style);
  console.log(`━━ 素材生产开始 [${slug}] | 风格包: ${manifest.style} | 共 ${manifest.assets.length} 项 ━━`);

  for (let i = 0; i < manifest.assets.length; i++) {
    const item = manifest.assets[i];
    const dest = path.join(outDir, item.filename);
    const tag = `[${i + 1}/${manifest.assets.length}] (${item.type}) ${item.filename}`;

    if (fs.existsSync(dest) && !force) {
      console.log(`${tag} ⏭  已存在，跳过`);
      continue;
    }

    if (item.type === "ai-image") {
      await handleAiImage(item, dest, styleSpec);
      console.log(`${tag} ✓ 已生图落盘 -> public/assets/${slug}/${item.filename}`);
      if (i < manifest.assets.length - 1) await sleep(2500);
    } else {
      await handleWebCapture(item, dest);
      console.log(`${tag} ✓ 已网页截图 -> public/assets/${slug}/${item.filename}`);
    }
  }
  console.log(`✓ 素材管线完成: public/assets/${slug}/`);
}

main().catch((err) => {
  console.error("✗ 素材生产失败:", err instanceof Error ? err.message : err);
  process.exit(1);
});
