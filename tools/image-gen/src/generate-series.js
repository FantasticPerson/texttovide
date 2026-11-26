import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { generateImage } from "./cloudbase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".."); // engines/image-gen/
const SONGS_ROOT = path.resolve(__dirname, "../../.."); // ai-music/

const DELAY_MS = 3000;  // 场景图间隔,避开混元 QPS 限流(1.5s 太紧)

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

// 兼容旧格式 script.characterId(单角色)和新格式 script.characters(多角色数组)
function getScriptCharacters(script) {
  if (Array.isArray(script.characters)) return script.characters;
  if (script.characterId) return [script.characterId];
  return [];
}

// 解析单场涉及的角色:scene.characters > scene.skipRef? [] : script.characters
function getSceneCharacters(scene, scriptCharIds) {
  if (Array.isArray(scene.characters)) return scene.characters;
  if (scene.skipRef) return [];
  return scriptCharIds;
}

function buildPrompt(scene, characters, sceneCharIds) {
  const parts = [];
  const charDescs = sceneCharIds
    .map((id) => characters.find((c) => c.id === id)?.description)
    .filter(Boolean)
    .join("；");
  if (charDescs) parts.push(charDescs);
  parts.push(scene.prompt);
  if (scene.mood) parts.push(`氛围:${scene.mood}`);
  if (scene.styleSuffix) parts.push(scene.styleSuffix);
  return parts.join("，");
}

function getReferenceImage(scene, characters, sceneCharIds, scriptCharIds) {
  if (scene.skipRef) return undefined;
  const refId = scene.primaryRef || sceneCharIds[0] || scriptCharIds[0];
  if (!refId) return undefined;
  const c = characters.find((c) => c.id === refId);
  if (!c) {
    console.warn(`    ⚠️  primaryRef=${refId} 未在 characters.json 中找到`);
    return undefined;
  }
  if (!c.referenceImage) {
    console.warn(`    ⚠️  角色 ${refId} 未配置 referenceImage，将以纯 prompt 生成(一致性弱)`);
    return undefined;
  }
  return c.referenceImage;
}

/**
 * 路径解析:song-id 模式 vs 旧模式
 *
 * 优先 song-id 模式:如果 songs/<arg>/script.json 存在,走 song-id 模式
 *  - script: songs/<arg>/script.json
 *  - characters: songs/<arg>/characters.json
 *  - output: songs/<arg>/assets/scenes/
 *
 * 否则旧模式(向后兼容):arg 是 scripts/ 下的脚本名(不带 .json)
 *  - script: engines/image-gen/scripts/<arg>.json
 *  - characters: engines/image-gen/characters.json
 *  - output: engines/image-gen/output/<arg>/
 */
function resolvePaths(scriptArg) {
  if (scriptArg) {
    // song-id 模式优先
    const songScript = path.join(SONGS_ROOT, "songs", scriptArg, "script.json");
    if (fs.existsSync(songScript)) {
      const songDir = path.join(SONGS_ROOT, "songs", scriptArg);
      return {
        mode: "song-id",
        scriptPath: songScript,
        charsPath: path.join(songDir, "characters.json"),
        outputDir: path.join(songDir, "assets", "scenes"),
        label: scriptArg,
      };
    }
    // 旧模式
    const oldScript = path.join(ROOT, "scripts", `${scriptArg}.json`);
    return {
      mode: "legacy",
      scriptPath: oldScript,
      charsPath: path.join(ROOT, "characters.json"),
      outputDir: path.join(ROOT, "output", safeName(scriptArg)),
      label: scriptArg,
    };
  }
  // 无参数:旧模式跑所有 scripts/*.json
  return {
    mode: "legacy-batch",
    scriptPath: null,
    charsPath: path.join(ROOT, "characters.json"),
    outputDir: path.join(ROOT, "output"),
    label: null,
  };
}

async function runScript(script, characters, outputDir) {
  // 场景图统一放 songs/<song-id>/assets/scenes/,跟锚点 assets/anchors/<char-id>/ 同根 assets/
  fs.mkdirSync(outputDir, { recursive: true });

  const scriptCharIds = getScriptCharacters(script);
  const defaultSize = script.size || "1024x1024";

  console.log(`\n=== ${script.name || script.type} ===`);
  console.log(`类型: ${script.type} | 场景数: ${script.scenes.length} | 角色: ${scriptCharIds.join(", ") || "无"} | 尺寸: ${defaultSize}`);
  console.log(`输出: ${outputDir}`);

  const failed = [];
  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const file = path.join(outputDir, `${scene.id}.png`);
    const sceneCharIds = getSceneCharacters(scene, scriptCharIds);
    const referenceImage = getReferenceImage(scene, characters, sceneCharIds, scriptCharIds);
    const title = scene.title || scene.id;
    const tag = `[${i + 1}/${script.scenes.length}] ${scene.id}${scene.title ? " · " + title : ""}`;

    if (fs.existsSync(file)) {
      console.log(`${tag} ⏭  已存在，跳过`);
      continue;
    }

    const prompt = buildPrompt(scene, characters, sceneCharIds);
    console.log('generate scene',Date.now())
    try {
      const { url } = await generateImage(prompt, {
        size: scene.size || defaultSize,
        referenceImage,
      });
      await downloadImage(url, file);
      const refTag = referenceImage ? ` (ref: ${scene.primaryRef || sceneCharIds[0]})` : " (no ref)";
      console.log(`${tag} ✓${refTag}`);
    } catch (err) {
      console.error(`${tag} ✗ ${err.message}`);
      failed.push({ sceneId: scene.id, error: err.message });
    }

    if (i < script.scenes.length - 1) await sleep(DELAY_MS);
  }

  if (failed.length) {
    console.log(`失败 ${failed.length} 张：${failed.map((f) => f.sceneId).join(", ")}`);
    console.log(`重跑会自动跳过已成功的，只补失败的。`);
  }
}

async function main() {
  const scriptArg = process.argv[2];
  const resolved = resolvePaths(scriptArg);

  if (!fs.existsSync(resolved.charsPath)) {
    console.error(`找不到角色库: ${resolved.charsPath}`);
    process.exit(1);
  }
  const { characters } = JSON.parse(fs.readFileSync(resolved.charsPath, "utf-8"));

  let scripts = [];
  if (resolved.scriptPath) {
    if (!fs.existsSync(resolved.scriptPath)) {
      console.error(`找不到脚本: ${resolved.scriptPath}`);
      console.error(`  song-id 模式:确认 songs/${scriptArg}/script.json 存在`);
      console.error(`  旧模式:确认 engines/image-gen/scripts/${scriptArg}.json 存在`);
      process.exit(1);
    }
    const script = JSON.parse(fs.readFileSync(resolved.scriptPath, "utf-8"));
    scripts = [script];
  } else {
    // legacy-batch: 跑 scripts/ 下所有 .json
    const legacyScriptsDir = path.join(ROOT, "scripts");
    if (!fs.existsSync(legacyScriptsDir)) {
      console.error(`scripts/ 目录不存在，先创建脚本文件`);
      process.exit(1);
    }
    const files = fs.readdirSync(legacyScriptsDir).filter((f) => f.endsWith(".json"));
    if (files.length === 0) {
      console.error(`scripts/ 目录下没有 .json 脚本`);
      process.exit(1);
    }
    scripts = files.map((f) => JSON.parse(fs.readFileSync(path.join(legacyScriptsDir, f), "utf-8")));
  }

  console.log(`模式: ${resolved.mode}${scriptArg ? " | arg=" + scriptArg : ""}`);
  console.log(`角色库: ${resolved.charsPath}`);

  for (const script of scripts) {
    await runScript(script, characters, resolved.outputDir);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
