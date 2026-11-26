import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cloudbase from "@cloudbase/js-sdk";

// 自动加载 .env: 优先用 __dirname 锁定 engines/image-gen/.env(跟 cwd 无关)
// 然后兜底向上找 cwd/.env
function findEnvFile() {
  const fixed = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"); // src/../.env
  if (fs.existsSync(fixed)) return fixed;
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadEnvFile() {
  const envPath = findEnvFile();
  if (!envPath) return;
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(envPath);
      return;
    }
  } catch {}
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFile();

// 支持的模型
// - PLUS: 艺术优化版，text-to-image 默认（无参考图时使用）
// - I2I:  图生图专用，SDK 显式校验支持 image_urls（≤1 张），有参考图时自动启用
export const MODELS = {
  PLUS: "HY-Image-3.0-Plus-4090-Tob-v1.0",
  I2I: "HY-Image-v3.0-I2I-ToB-v1.0.1",
};

// SDK Node 端需要 env(选环境)+ secretId/secretKey(子账号鉴权)一起传
// 注意:env 不能是 undefined(SDK 校验 "env must not be specified"),所以依赖 loadEnvFile 加载 .env
const app = cloudbase.init({
  env: process.env.ENV_ID,
  secretId: process.env.TENCENTCLOUD_SECRET_ID,
  secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
});

const ai = app.ai();
const imageModel = ai.createImageModel("hunyuan-image");

// 为 I2I 模型显式指向 AR 端点（images/ar/generations）
// 注：Plus 模型走 SDK 默认的 images/ar/generations 同样能工作，但 I2I 是文档明确支持的图生图入口
imageModel.generateImageSubUrlConfig["hunyuan-image"][MODELS.I2I] = "images/ar/generations";

/**
 * 调用混元生图，返回图片 URL（24 小时有效）
 * @param {string} prompt 提示词，不超过 8192 字符
 * @param {{
 *   size?: string,        // 默认 "1024x1024"
 *   seed?: number,        // 范围 [1, 4294967295]
 *   footnote?: string,    // 水印，最多 16 字符
 *   revise?: boolean,     // 默认 true（自动改写 prompt）
 *   model?: string,       // 默认 PLUS，传了 referenceImage 时自动切到 I2I
 *   referenceImage?: string  // 公开可访问的图片 URL，仅 I2I 模型有效
 * }} options
 */
export async function generateImage(prompt, options = {}) {
  const {
    size = "1024x1024",
    seed,
    footnote,
    revise = true,
    model: modelOpt,
    referenceImage,
  } = options;

  // 自动选模型：传了 referenceImage 强制用 I2I
  const model = modelOpt || (referenceImage ? MODELS.I2I : MODELS.PLUS);

  if (referenceImage && model !== MODELS.I2I) {
    throw new Error(
      `referenceImage 只能与 I2I 模型 (${MODELS.I2I}) 配合使用，当前 model=${model}`
    );
  }

  const params = {
    model,
    prompt,
    size,
    seed,
    footnote,
    revise: { value: revise },
  };

  // I2I 模型：传入参考图（SDK 校验 image_urls 最多 1 个）
  if (referenceImage) {
    params.image_urls = [referenceImage];
  }

  // 429/5xx/网络错误:指数退避重试(8s / 20s / 40s,最多 3 次)
  // 判定原则:success 响应(res.data[0].url 存在)直接放行,不进 retry
  // 只对 error 字段做正则匹配(error.message / error.code),不再整段扫 res
  // 教训:之前 5\d\d 关键词把 hash id (e.g. "...548fba...")误判为 5xx,造成 success 也被 retry 3 次
  const MAX_RETRIES = 3;
  const BACKOFF_MS = [8000, 20000, 40000];  // 8s/20s/40s 覆盖混元 RPM 限流
  const isRetryableText = (txt) =>
    /429|限流|rate.?limit|超时|timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|系统繁忙|service.?unavailable/i.test(
      txt
    );
  const isRetryableRes = (r) => {
    // 1) success 响应直接放行
    if (r?.data?.[0]?.url) return false;
    // 2) 看 error.code(结构化)
    const code = r?.error?.code;
    if (code == 429 || code == "429") return true;
    if (typeof code === "number" ? code >= 500 && code < 600 : /^5\d{2}$/.test(String(code))) return true;
    // 3) 看 error.message(关键词),不再整段扫 res
    if (r?.error?.message && isRetryableText(r.error.message)) return true;
    return false;
  };

  let res;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      res = await imageModel.generateImage(params);
    } catch (err) {
      const msg = String(err?.message || err);
      if (!isRetryableText(msg) || attempt === MAX_RETRIES) throw err;
      const wait = BACKOFF_MS[attempt];
      console.log(`  ⚠️  混元接口异常(${msg.slice(0, 80)}),${wait / 1000}s 后重试(${attempt + 1}/${MAX_RETRIES})…`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    // SDK 成功返回(没 throw)但 res.error 是限流/5xx:也按 retry 处理
    if (isRetryableRes(res)) {
      const errTxt = JSON.stringify(res?.error || res).slice(0, 120);
      if (attempt === MAX_RETRIES) break; // 用下面的"返回无图片数据"抛
      const wait = BACKOFF_MS[attempt];
      console.log(`  ⚠️  混元接口限流/繁忙(${errTxt}),${wait / 1000}s 后重试(${attempt + 1}/${MAX_RETRIES})…`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    break;
  }

  if (!res?.data?.[0]?.url) {
    throw new Error(`返回无图片数据: ${JSON.stringify(res)?.slice(0, 300)}`);
  }

  return {
    url: res.data[0].url,
    revisedPrompt: res.data[0].revised_prompt,
    model,
  };
}


/**
 * 上传本地文件到 TCB 云存储,拿临时访问 URL(用于 I2I 参考图)
 *
 * 流程:uploadFile → getTempFileURL → 返回 {fileID, tempURL}
 * URL 有时限(跟混元临时 URL 类似),但 24h 内生图足够用,
 * 过期后主人手动重新上传到 TCB 拿新 URL 改 characters.json 即可
 *
 * @param {string} filePath 本地文件路径
 * @param {string} cloudPath 云端路径(例: ai-music-anchors/song-01/char-x/front.png)
 * @returns {Promise<{fileID: string, tempURL: string}>}
 */
export async function uploadToTCB(filePath, cloudPath) {
  // Node 端用 fileContent 传 Buffer(SDK Node 适配器走标准 fetch,filePath 走 Web 端路径触发 JSON parse bug)
  const buf = fs.readFileSync(filePath);
  const uploadRes = await app.uploadFile({ cloudPath, fileContent: buf });
  if (!uploadRes?.fileID) {
    throw new Error(`uploadFile 返回无 fileID: ${JSON.stringify(uploadRes)?.slice(0, 300)}`);
  }

  const tmpRes = await app.getTempFileURL({ fileList: [uploadRes.fileID] });
  const item = tmpRes?.fileList?.[0];
  if (!item?.tempFileURL && !item?.download_url) {
    throw new Error(`getTempFileURL 返回无 URL: ${JSON.stringify(tmpRes)?.slice(0, 300)}`);
  }

  return {
    fileID: uploadRes.fileID,
    tempURL: item.tempFileURL || item.download_url,
  };
}


/**
 * 上传本地文件到 superbed.cn 第三方图床(替代 uploadToTCB,适用于无 TCB 写权限场景)
 *
 * API: https://api.superbed.cn/upload (单文件兼容端点)
 * Header: X-API-Key: <your-api-key>
 * Body: multipart/form-data, 字段 file=<本地文件>
 * 响应: {err: 0|1, url?: string, msg?: string}
 *
 * @param {string} filePath 本地文件路径
 * @param {string} apiKey superbed API Key(.env SUPERBED_API_KEY)
 * @returns {Promise<{url: string, fileID?: string}>}
 */
export async function uploadToSuperbed(filePath, apiKey) {
  if (!apiKey) {
    throw new Error("缺少 SUPERBED_API_KEY,主人请在 engines/image-gen/.env 加 SUPERBED_API_KEY=<your-api-key>");
  }
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  // superbed 标准上传契约(对齐 help.html / 主人截图):
  //   端点  POST https://api.superbed.cn/api/v1/upload/   (注意带尾斜杠)
  //   字段  multipart/form-data,字段名必须为 "files"(复数,即使单文件)
  //   鉴权  Header: X-API-Key: <your-api-key>
  //   响应  { success, files?: [{id, url, filename, file_size}], total, succeed, failed }
  //   旧简版 /upload + 字段 file + 响应 {err, url} 已弃用,不要回退
  const form = new FormData();
  form.append("files", new Blob([fileBuffer]), fileName);

  const res = await fetch("https://api.superbed.cn/api/v1/upload/", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
    },
    body: form,
  });

  const data = await res.json().catch(() => ({ success: false, failed: 1, _msg: `响应非 JSON (HTTP ${res.status})` }));

  if (data?.success !== true) {
    const reason = data?._msg || data?.files?.[0]?.error || `success=${data?.success}, failed=${data?.failed}`;
    throw new Error(`superbed 上传失败: ${reason}`);
  }
  const file = data?.files?.[0];
  if (!file?.url) {
    throw new Error(`superbed 响应无 url: ${JSON.stringify(data)?.slice(0, 200)}`);
  }

  return {
    url: file.url,
    fileID: file.id || file.url, // superbed 没有 fileID,优先用响应里的 id,否则用 url 作唯一标识
  };
}
