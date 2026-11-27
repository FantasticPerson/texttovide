# texttovideo-new

将 Markdown 技术/观点文档工程化转换为高质量知识讲解视频（默认 **16:9 1920×1080 @ 30fps**，兼容 **9:16 竖屏**）。

核心思路：**语义活交给 AI（把文章拆成结构化分镜、配图提示词与口播稿），机械活交给程序（Zod Schema 校验、混元生图/网页截图、本地 Qwen3-TTS 声音克隆、音画同步时间轴、Remotion 确定性渲染）。**

---

## 目录结构

```text
texttovideo-new/
├── AGENTS.md                 # 项目规范与视觉排版约束
├── ROADMAP.md                # 真实进度与验收记录
├── src/                      # 视频引擎源码（10 类场景组件、双风格包、动效积木、Schema）
├── scripts/                  # CLI 流水线脚本（一键出片、素材抓取、配音、抽帧、渲染）
├── tools/image-gen/          # 外部混元生图工具（含独立 .env，不进 Git）
├── content/<slug>/           # 单支视频原料（article.md / storyboard.json / assets-manifest.json / timeline.json）
├── voice/                    # 本人声音克隆参考样本（my-ref.wav / my-ref.txt）
├── public/                   # Remotion 渲染期静态资产（BGM、音效、自动生成的配图与旁白）
├── out/                      # 导出产物（MP4 与抽帧图，不进 Git）
└── references/               # 只读参考资料（不进 Git）
```

---

## 日常出片流程（3 步）

### 1. 准备单支视频目录

在 `content/<slug>/` 下放入：

- `article.md`：原始 Markdown 文档。
- `storyboard.json`：结构化分镜（可参考 [content/codex-rules-hooks/storyboard.json](content/codex-rules-hooks/storyboard.json)）。
  - `theme`：`"dark-tech"`（深空墨绿科技风）或 `"warm-editorial"`（暖纸红黑编辑风，支持单屏 `"invert": true` 暗色反转）。
  - `narration`：每个场景下的中文口播数组；若省略则输出无旁白配乐版。
  - `bgm`：配乐路径与音量（推荐有旁白时 `volume: 0.24–0.28`）。
- `assets-manifest.json`（可选）：需要 AI 生成的配图或自动截取的网页清单（可参考 [content/codex-rules-hooks/assets-manifest.json](content/codex-rules-hooks/assets-manifest.json)）。

### 2. 一键运行全链路

```bash
pnpm pipeline <slug>
```

流水线会自动按顺序执行：

1. `verify-styles.ts`：校验 `src/styles/` 风格包完整性。
2. `fetch-assets.ts`：按风格包前缀调用 `tools/image-gen` 混元生图，并用无头 Chrome 自动截取网页到 `public/assets/<slug>/`（已存在则自动跳过）。
3. `build-timeline.ts`：Zod Schema 校验并计算基础时间轴。
4. `build-narration.py`：若分镜包含 `narration` 且本地存在 `.venv-tts/` 与 `voice/my-ref.wav`，自动调用本地 `Qwen3-TTS-12Hz-1.7B-Base`（Apple Silicon `mps float16`）克隆本人音色合成全片旁白 `public/audio/<slug>/narration.mp3`，并回写帧级同步字幕与场景时长到 `timeline.json`。
5. `render-frames.ts`：抽取各场景关键帧到 `out/<slug>-frames/`。
6. `render-video.ts`：导出最终成片 `out/<slug>.mp4`。

### 3. 验收成片

- 先看 `out/<slug>-frames/` 确认排版无溢出、无重叠。
- 播放 `out/<slug>.mp4` 检查配音节奏、字幕对齐与 BGM 比例。

---

## 常用命令速查

| 场景 | 命令 |
| --- | --- |
| 一键全链路出片 | `pnpm pipeline <slug>` |
| 手动指定风格一键出片 | `pnpm pipeline <slug> --theme dark-tech` 或 `--theme warm-editorial` |
| 查看全部可用视觉风格包 | `pnpm pipeline --list-themes` |
| 同分镜换皮肤快速重导（复用旁白，输出 `<slug>-<theme>.mp4`） | `pnpm render <slug> --theme warm-editorial` |
| 仅抽帧目检（不导 MP4） | `pnpm pipeline <slug> --frames-only` |
| 跳过素材抓取 | `pnpm pipeline <slug> --skip-assets` |
| 强制重生成全部素材 | `pnpm pipeline <slug> --force-assets` |
| 仅重新构建时间轴（无旁白） | `pnpm build:timeline <slug>` |
| 仅重新合成克隆旁白并对齐字幕 | `.venv-tts/bin/python scripts/build-narration.py <slug>` |
| 仅重新抽帧 | `pnpm render:frames <slug>` |
| 仅重新导出 MP4（改 BGM 音量/画面后复用旁白） | `pnpm render <slug>` |
| 浏览器实时预览调试 | `pnpm studio` |
| TypeScript 类型检查 | `pnpm typecheck` |
| 视觉风格包完整性校验 | `pnpm verify:styles` |

---

## 常见微调技巧

- **只调 BGM 音量不想重跑配音**：同时修改 `content/<slug>/storyboard.json` 与 `content/<slug>/timeline.json` 里的 `bgm.volume`，直接执行 `pnpm render <slug>`（约 1 分钟出片）。
- **更换本人克隆参考音**：将 10–25 秒清晰人声转为 `24kHz` 单声道 WAV 放至 `voice/my-ref.wav`，并在 `voice/my-ref.txt` 填入完全一致的逐字稿。
- **新增视觉风格包**：参考 [src/styles/STYLE_EXTRACTION.md](src/styles/STYLE_EXTRACTION.md) 准备 4 件套（`tokens.ts` / `style-guide.md` / `image-prompt.md` / `reference.png`），在 `src/styles/index.ts` 注册后跑 `pnpm verify:styles` 校验。

---

## 环境前提

- Node.js `>= 22`、`pnpm`、`ffmpeg` / `ffprobe`
- Remotion 无头浏览器（首次运行一次）：`./node_modules/.bin/remotion browser ensure`
- 本地声音克隆环境：项目内独立 `.venv-tts/`（含 `qwen-tts`、`torch`、`soundfile`、`modelscope`）
- 混元生图密钥：配置在 `tools/image-gen/.env`（已入 `.gitignore`，切勿提交）
