import express from "express";
import { generateImage } from "./cloudbase.js";

const app = express();
app.use(express.json());

// 健康检查
console.log(process.env.ENV_ID)
app.get("/health", (req, res) => {
  res.json({ ok: true, env: process.env.ENV_ID ? "configured" : "missing" });
});

// 生图接口
app.post("/api/generate", async (req, res) => {
  const { prompt, size, seed, footnote, revise } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt 必填，且为字符串" });
  }
  if (prompt.length > 8192) {
    return res.status(400).json({ error: "prompt 不超过 8192 字符" });
  }

  try {
    const result = await generateImage(prompt, { size, seed, footnote, revise });
    res.json(result);
  } catch (err) {
    console.error("生图失败:", err);
    res.status(500).json({ error: err?.message || "生图失败", detail: String(err) });
  }
});

// 极简测试页
app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>混元生图测试</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; }
    textarea { width: 100%; height: 80px; box-sizing: border-box; padding: 8px; }
    .row { display: flex; gap: 8px; margin: 12px 0; }
    input, select { padding: 6px; }
    button { padding: 8px 20px; cursor: pointer; }
    #out img { max-width: 100%; margin-top: 16px; border: 1px solid #ddd; }
    #status { color: #888; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>混元生图</h1>
  <textarea id="prompt" placeholder="描述你想生成的图片，例如：一只胖橘猫在窗台打盹，水彩风格"></textarea>
  <div class="row">
    <select id="size">
      <option value="1024x1024">1024x1024 方形</option>
      <option value="720x1280">720x1280 竖屏</option>
      <option value="1280x720">1280x720 横屏</option>
      <option value="1280x1280">1280x1280 方形</option>
    </select>
    <button id="btn">生成</button>
  </div>
  <div id="status"></div>
  <div id="out"></div>
  <script>
    const btn = document.getElementById("btn");
    const status = document.getElementById("status");
    const out = document.getElementById("out");
    btn.onclick = async () => {
      const prompt = document.getElementById("prompt").value.trim();
      const size = document.getElementById("size").value;
      if (!prompt) { status.textContent = "请输入提示词"; return; }
      btn.disabled = true; status.textContent = "生成中…"; out.innerHTML = "";
      try {
        const r = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, size }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "请求失败");
        status.textContent = "改写后 prompt：" + (data.revisedPrompt || "（无）");
        out.innerHTML = '<img src="' + data.url + '" />';
      } catch (e) {
        status.textContent = "失败：" + e.message;
      } finally {
        btn.disabled = false;
      }
    };
  </script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`生图服务已启动: http://localhost:${PORT}`);
  if (!process.env.ENV_ID || process.env.ENV_ID === "your-env-id") {
    console.warn("⚠️  ENV_ID 未配置，请在 .env 填写真实的 CloudBase 环境 ID");
  }
});
