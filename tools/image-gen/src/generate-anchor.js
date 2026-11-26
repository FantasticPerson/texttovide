import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { generateImage, uploadToSuperbed, MODELS } from "./cloudbase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".."); // engines/image-gen/
const SONGS_ROOT = path.resolve(__dirname, "../../.."); // ai-music/

// 只生成 1 个角度:halfbody(半身)。理由:半身图主体占画面中央,
// I2I 一致性最稳,够用于场景图参考。front/3-4 不再需要。
const ANGLES = [
  { id: "halfbody", promptSuffix: "半身照，双手自然下垂，背景虚化" },
];

function downloadFile(url, dest) {
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



// ANGLES 现在只 1 张,默认回填第 1 张(就是 halfbody)。DEFAULT_PICK 保留
// 是为了避免分散的索引字面量,跟 ANGLES 数组对齐便于以后扩。
const DEFAULT_PICK = 1;

function runSeriesInProcess(songId) {
  // 自动跑 generate-series.js,用 spawn 隔离进程,失败不影响 anchor 的成功状态
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, "generate-series.js");
    const child = spawn(process.execPath, [scriptPath, songId], {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
    });
    child.on("error", (err) => {
      console.error(`\n✗ spawn generate-series.js 失败: ${err.message}`);
      resolve(1);
    });
    child.on("exit", (code) => {
      resolve(code ?? 0);
    });
  });
}

function parseArgs(argv) {
  // argv: [node, script, charId?, songId?, ...flags]
  // --local: 只生成本地锚点不上传 superbed
  const positional = [];
  const flags = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--local") {
      flags.local = true;
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

/**
 * 路径解析
 *
 * 新接口(推荐):<char-id> <song-id>
 *  - characters: songs/<song-id>/characters.json
 *  - output: songs/<song-id>/assets/anchors/<char-id>/halfbody.png
 *  锚点放在 assets/anchors/<char-id>/ 下(一个角色一个子目录),跟场景图 assets/scenes/ 同根 assets/
 *
 * 旧接口(向后兼容):只传 <char-id>
 *  - characters: engines/image-gen/characters.json
 *  - output: engines/image-gen/output/<char-id>/halfbody.png
 */
function resolvePaths(charArg, songArg) {
  // 兼容主入口单参调用:1 个参数且以 song- 开头 → 视为 songArg
  if (!songArg && charArg && /^song-\d{2,}-/.test(charArg)) {
    songArg = charArg;
    charArg = null;
  }
  if (songArg) {
    const songDir = path.join(SONGS_ROOT, "songs", songArg);
    return {
      mode: "song-id",
      charsPath: path.join(songDir, "characters.json"),
      anchorsDir: path.join(songDir, "assets", "anchors"),
      songId: songArg,
    };
  }
  return {
    mode: "legacy",
    charsPath: path.join(ROOT, "characters.json"),
    anchorsDir: path.join(ROOT, "output", charArg),
    songId: null,
  };
}

// 启动时诊断(脱敏,只看长度)
function logStartupDiag() {
  const sbKey = process.env.SUPERBED_API_KEY || "";
  if (sbKey) {
    console.log(`SUPERBED_API_KEY: loaded, length=${sbKey.length}, prefix=${sbKey.slice(0, 4)}...`);
  } else {
    console.log(`⚠️  SUPERBED_API_KEY 未加载,请在 engines/image-gen/.env 加 SUPERBED_API_KEY=<your-api-key>`);
  }
}

// 跑单个角色的半 body 锚点(生图 + 下载 + 上传 superbed + 回填 referenceImage)
// 返回 true=成功,false=失败;不 spawn series(由 main 收尾统一 spawn)
async function generateOneAnchor(target, charsDoc, resolved, flags) {
  const charDir = path.join(resolved.anchorsDir, target.id);
  fs.mkdirSync(charDir, { recursive: true });

  console.log(`\n━━ 为角色「${target.name}」(${target.id}) 生成半 body 锚点 ━━`);
  console.log(`使用模型: ${MODELS.PLUS}\n`);

  const uploaded = { charId: target.id, songId: resolved.songId, generatedAt: new Date().toISOString(), angles: {} };
  const results = [];
  for (let i = 0; i < ANGLES.length; i++) {
    const angle = ANGLES[i];
    const file = path.join(charDir, `${angle.id}.png`);
    const tag = `[${i + 1}/${ANGLES.length}] ${angle.id}`;

    // 1. 调混元生图
    let url;
    try {
      const fullPrompt = `${target.description}，${angle.promptSuffix}，写实摄影风，高质量，8K`;
      const genRes = await generateImage(fullPrompt, {
        size: "1024x1024",
        model: MODELS.PLUS,
      });
      url = genRes.url;
    } catch (err) {
      console.error(`${tag} ✗ 生图失败: ${err.message}`);
      continue;
    }

    // 2. 下载到本地
    try {
      await downloadFile(url, file);
    } catch (err) {
      console.error(`${tag} ✗ 下载失败: ${err.message}`);
      continue;
    }
    console.log(`${tag} ✓ 本地: ${file}`);

    // 3. 上传 superbed(除非 --local 或 --no-upload)
    if (flags.local || flags.noUpload) {
      uploaded.angles[angle.id] = { localPath: file, tcbUrl: null, tcbFileId: null };
      results.push({ angle: angle.id, localPath: file, tcbUrl: null });
      continue;
    }

    try {
      const apiKey = process.env.SUPERBED_API_KEY;
      const { url } = await uploadToSuperbed(file, apiKey);
      console.log(`        superbed: ${url}`);
      uploaded.angles[angle.id] = { localPath: file, tcbUrl: url, tcbFileId: url };
      results.push({ angle: angle.id, localPath: file, tcbUrl: url });
    } catch (err) {
      console.error(`${tag} ✗ superbed 上传失败: ${err.message}`);
      uploaded.angles[angle.id] = { localPath: file, tcbUrl: null, tcbFileId: null, error: err.message };
      results.push({ angle: angle.id, localPath: file, tcbUrl: null, error: err.message });
    }
  }

  if (results.length === 0) {
    console.error(`✗ 角色「${target.name}」(${target.id}) 全部角度生成失败`);
    return false;
  }

  // ANGLES 只 1 张,直接回填 halfbody(无须选)
  const pickAngle = ANGLES[0];
  const pickItem = uploaded.angles[pickAngle.id];
  if (pickItem?.tcbUrl) {
    const idx = charsDoc.characters.findIndex((c) => c.id === target.id);
    charsDoc.characters[idx].referenceImage = pickItem.tcbUrl;
    fs.writeFileSync(resolved.charsPath, JSON.stringify(charsDoc, null, 2) + "\n");
    console.log(`\n✓ 回填 ${pickAngle.id}(URL: ${pickItem.tcbUrl})到 ${resolved.charsPath}`);
    return true;
  } else {
    console.log(`\n⚠️  ${pickAngle.id} 无 superbed URL,未回填 ${target.id}`);
    return false;
  }
}

async function main() {
  const { positional, flags } = parseArgs(process.argv);
  const a1 = positional[0];
  const a2 = positional[1];
  const isMultiCharMode = !!(a1 && a1.startsWith("song-") && !a2);
  const resolved = resolvePaths(a1, a2);

  if (!fs.existsSync(resolved.charsPath)) {
    console.error(`找不到角色库: ${resolved.charsPath}`);
    console.error(`  song-id 多角色模式: <song-id>  → songs/<song-id>/characters.json`);
    console.error(`  song-id 单角色模式: <char-id> <song-id>  → 同上`);
    console.error(`  旧模式: <char-id>  → engines/image-gen/characters.json`);
    process.exit(1);
  }
  const charsDoc = JSON.parse(fs.readFileSync(resolved.charsPath, "utf-8"));
  const { characters } = charsDoc;

  logStartupDiag();
  console.log(`模式: ${resolved.mode}${resolved.songId ? " | song=" + resolved.songId : ""}`);

  // 选目标角色
  let targets;
  if (isMultiCharMode) {
    targets = characters.filter((c) => !c.referenceImage);
    if (targets.length === 0) {
      console.log(`\n✓ 所有角色都已配置 referenceImage,无需生成锚点`);
      if (resolved.songId) {
        console.log(`▶ 直接跑场景图: node src/generate-series.js ${resolved.songId}`);
        const code = await runSeriesInProcess(resolved.songId);
        if (code === 0) console.log("\n✓ 场景图完成");
        else console.log(`\n⚠️  场景图失败(exit ${code})`);
      }
      return;
    }
    console.log(`\n发现 ${targets.length} 个未配 referenceImage 的角色,依次生成:`);
    console.log(`  ${targets.map((c) => `${c.id}(${c.name})`).join(", ")}\n`);
  } else {
    const target = a1
      ? characters.find((c) => c.id === a1)
      : characters.find((c) => !c.referenceImage);
    if (!target) {
      console.error(a1 ? `未找到角色 ${a1}` : "所有角色都已配置 referenceImage");
      process.exit(1);
    }
    targets = [target];
  }

  const okIds = [];
  const failIds = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const ok = await generateOneAnchor(target, charsDoc, resolved, flags);
    (ok ? okIds : failIds).push(target.id);
    // 角色之间 sleep 5s,避开混元 QPS/RPM 限流(多角色连发容易 429)
    if (i < targets.length - 1) {
      console.log(`\n⏱  角色间等待 5s,避开 QPS 限流…`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // 汇总,决定 spawn 时机
  const total = targets.length;
  console.log(`\n━━ 锚点结果汇总: 成功 ${okIds.length}/${total},失败 ${failIds.length}/${total} ━━`);
  if (okIds.length) console.log(`  ✓ ${okIds.join(", ")}`);
  if (failIds.length) console.log(`  ✗ ${failIds.join(", ")}(场景图里这些角色会以纯 prompt 生成,一致性弱)`);

  if (resolved.songId) {
    if (okIds.length === 0) {
      console.log(`\n⚠️  全部 ${total} 个锚点失败,跳过场景图`);
      console.log(`重跑: node src/generate-anchor.js ${resolved.songId}`);
      return;
    }
    if (failIds.length > 0) {
      console.log(`\n▶ 部分角色未成功,补跑: node src/generate-anchor.js ${resolved.songId}`);
    }
    console.log(`\n━━ 自动跑场景图 ━━`);
    const code = await runSeriesInProcess(resolved.songId);
    if (code === 0) {
      console.log("\n✓ 全流程完成: 锚点 + 场景图");
    } else {
      console.log(`\n⚠️  场景图失败(exit ${code});重跑: node src/generate-series.js ${resolved.songId}`);
    }
  } else if (okIds.length > 0) {
    console.log(`\n(legacy 模式不自动跑 series,手动: node src/generate-series.js <song-id>)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
