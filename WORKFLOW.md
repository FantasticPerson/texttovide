# WORKFLOW.md — Markdown 一键转知识视频出片 SOP

> 每次接到「把某篇 `.md` 文档 / 文章做成视频」任务时，严格按本手册执行，禁止退化成纯文字 PPT 列表或重踩历史坑。

---

## 一、标准 5 步出片流程

### Step 1：初始化单支视频目录
在 `content/<slug>/` 下建目录，复制原文为 `content/<slug>/article.md`（`<slug>` 用简洁英文短横线命名，如 `codex-rules-hooks`）。

### Step 2：手动选择视觉皮肤与章节结构
- **先确认风格**：若主人未明确指定风格，先列出当前可用风格包并给出推荐项，由主人手动选择后再开始拆镜与生图；若主人已指定风格，直接按指定风格执行（也支持 CLI `--theme <style>` 手动覆盖）：
  - `dark-tech`（深空墨绿科技风）：适合硬核技术、工具与架构拆解。
  - `warm-editorial`（暖纸红黑编辑风）：适合方法论、观点、趋势与个人成长，每隔 2–3 屏可对重点屏设 `"invert": true` 做深墨绿暗屏视觉反转。
- 规划 `4–8` 个简短章节名写入顶层 `chapters`，全片控制在 `8–14` 个场景。

### Step 3：编写 `storyboard.json`（+ 可选 `assets-manifest.json`）
按「二、组件选型矩阵」把文章语义拆成结构化分镜；如需混元风格化配图或真实网页截图，在同目录建 `assets-manifest.json`（参考 [content/codex-rules-hooks/assets-manifest.json](content/codex-rules-hooks/assets-manifest.json)）。

### Step 4：运行一键流水线
```bash
# 沙箱内先校验（无网络/无浏览器依赖）
./node_modules/.bin/tsx scripts/verify-styles.ts
./node_modules/.bin/tsx scripts/build-timeline.ts <slug>

# 全链路执行（含混元生图/网页截图、Qwen3-TTS MPS 声音克隆、抽帧、渲染 MP4）
./node_modules/.bin/tsx scripts/run-pipeline.ts <slug>
```
> 注：若分镜含 `narration` 且本地存在 `.venv-tts/bin/python` 与 `voice/my-ref.wav`，`run-pipeline.ts` 会自动调用本地 `Qwen3-TTS-12Hz-1.7B-Base`（Apple Silicon `mps float16`）合成克隆旁白并回写帧级同步字幕与场景时长。单进程跑，切勿并发多个 TTS。

### Step 5：强制验收（缺一不可）
1. **抽帧目检**：读取 `out/<slug>-frames/` 下关键帧图片，检查：
   - 标题无标点掉行首、无溢出安全区；
   - 底部单行字幕不与图注/卡片重叠；
   - `diagram` 节点与连线完整、`media` 高亮框位置准确。
2. **音画校验**：用 `ffprobe` 与 `ffmpeg -af volumedetect` 校验 `out/<slug>.mp4`：
   - 视频 `1920×1080 @ 30fps`（`h264`）、音频 `aac 48kHz stereo`；
   - 成片时长与 `public/audio/<slug>/narration.mp3` 一致；
   - 全片峰值 `max_volume < -2 dB`（无削波）。
3. **交付与同步**：向主人给出可点击 `file://` 成品路径与核心指标，并同步更新 `ROADMAP.md`。

---

## 二、13 类场景组件选型矩阵（去 PPT 化铁律）

| 文章语义 | 推荐组件 (`type`) | 子模式 / 关键字段 | 说明 |
| --- | --- | --- | --- |
| 开场抛痛点 / 反常识钩子 | `hook` | `headline` + `subline` | 支持 `**关键词**` 与 `==荧光词==` |
| 大章节切换 | `chapter` | `number` + `title` | 极简过场，用于节奏换气 |
| 多输入汇聚 / 中心辐射架构 | `diagram` | `layout: "converge" \| "hub"` | 自带 SVG 贝塞尔画线 + 流动光点，`tone: "danger"` 画红框虚线淘汰项 |
| 线性步骤 / 工作流 | `flow` | `steps[]` | 3–4 步横向流程 |
| 新旧方案 / 利弊对照 | `compare` | `before` / `after` | 左右对比卡片 |
| 性能数据 / 跑分 / 趋势 / 占比 | `metrics` | `mode: "cards" \| "gauges" \| "bars" \| "line" \| "donut"` | 数值统一用它可视化，禁止纯文字报数字 |
| 强对错判定 / 逐条拆解 | `verdict` | `mode: "judge" \| "pills"` | `judge` 红叉绿勾印章；`pills` 玻璃胶囊逐条聚光灯 |
| 命令 / 配置 / 终端演示 | `mockup` | `windowTitle` + `lines[]` + `badges[]` | `role: "prompt"` 自动带打字机光标 |
| 概念配图 / 真实网页 / App 截图 | `media` | `variant: "illustration" \| "browser" \| "phone"` + `highlightBoxes[]` | 支持多框依次 SVG 一笔描边 + 标签、`scroll: true` 长图慢滚 |
| 4–8 个并列概念 / 全景总结 | `grid` | `columns: 2\|3\|4` + `focusMode: true` | 开 `focusMode` 可逐卡聚光灯扫亮 |
| 金句 / 核心原则 | `quote` | `highlight` + `quote` + `caption` | 适合观点类强记忆点 |
| 少量纯要点（兜底少用） | `bullets` | `bullets[]`（最多 4 条） | 全片最多出现 1–2 次，避免 PPT 感 |
| 结尾收束 | `outro` | `conclusion`（≤26 字）+ `subline` | 简洁有力收尾 |

---

## 三、动效、音频与文案铁律（历史避坑沉淀）

1. **高亮克制**：每句标题最多 1 处 `**关键词**`（或搭配 1 处 `==荧光词==`）；禁止在 `==荧光词==` 后紧跟逗号导致标点掉到下一行首。
2. **转场与镜头防抖**：
   - `transition`（`"fade" | "slide-up" | "slide-left" | "wipe" | "zoom"`）按章节交替使用，制造节奏变化。
   - **纯文字 / UI 卡片屏一律保持 `camera: "none"`**（省略即可），避免 Chromium 在 30fps 慢速缩放文字和 `1px` 细框时产生亚像素跳格；持续呼吸感由 `Background.tsx` 柔和光斑提供。`camera` 仅用于全幅插画/照片类画面。
3. **音频配比**：
   - 有旁白时 `bgm.volume` 设为 **`0.24–0.28`**（`Video.tsx` 按配置直出，不再二次折减）。
   - `sfx` 默认开启（`{ enabled: true, volume: 1 }`），自动对齐切屏 `whoosh` 与元素出现 `pop / click`。
4. **口播稿规范（`narration`）**：
   - 每屏 `1–3` 句，单句控制在 **`15–28` 个中文字符**，符合口语停顿，保证底部单行字幕不换行、不溢出。
   - 专业英文术语保持自然拼写（如 `Codex`、`Hooks`、`AGENTS.md`）。
5. **素材分工**：
   - 具象比喻用 `assets-manifest.json` 里的 `type: "ai-image"`（`fetch-assets.ts` 会自动拼接风格包 `image-prompt.md` 前缀，保持全片画风一致）；
   - 官网/文档界面用 `type: "web-capture"`（Node 22 原生 CDP 2× DPR 截图），配合 `MediaScene` 的 `variant: "browser"` + `highlightBoxes[]`。

---

## 四、高频局部重跑技巧（省时间）

- **只改画面、转场、BGM 音量或微音效（不改口播文本）**：
  同步改 `storyboard.json` 与 `timeline.json` 对应字段后，直接跑 `./node_modules/.bin/tsx scripts/render-video.ts <slug>`（约 30–60 秒，跳过 3 分钟 TTS 重新合成）。
- **只改分镜文字但不导 MP4**：
  跑 `./node_modules/.bin/tsx scripts/run-pipeline.ts <slug> --frames-only` 快速抽帧目检。
