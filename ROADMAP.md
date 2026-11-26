# ROADMAP.md — texttovideo-new

## 当前阶段

- **阶段**：V1 / V1.5 / V2 / V3 全链路均已打通并实测通过（16:9 双皮肤视觉系统 + 混元生图/网页截图混合素材 + 本地 Qwen3-TTS 本人声音克隆 + 自动同步字幕 + BGM 自动压低 + 一键 MD 出片）
- **状态**：全流程验收通过

---

## 阶段规划

### V1：9:16 无旁白工程化视频闭环（已完成）
- [x] 建立项目规范 `AGENTS.md`、`ROADMAP.md`、`.gitignore`
- [x] 初始化 Remotion + React + TypeScript + Zod 工程骨架
- [x] 实现基础 6 种场景组件与 `build-timeline` 脚本，跑通 9:16 首支标杆片 `out/demo.mp4`

### V1.5：16:9 标杆视觉系统与核心新组件升级（已完成）
- [x] 升级规范为默认 **16:9 横屏（1920×1080）**，同时保留 9:16 竖屏自适应布局
- [x] 实现双套标杆视觉皮肤（`src/theme/index.ts`）：`dark-tech`（深空墨绿科技风）与 `warm-editorial`（暖纸红黑编辑风，支持单屏 `invert: true` 暗色反转）
- [x] 实现标题/核心句局部高亮语法 `**关键词**`（`HighlightText`）与顶部章节进度导航条（`ChapterBar`）
- [x] 新增 4 类去 PPT 化场景组件：`chapter`（极简章节过场）、`mockup`（拟真终端/对话窗口）、`grid`（多概念卡片矩阵）、`media`（真实截图 + 局部高亮框）
- [x] 原有 `compare` / `flow` / `hook` / `bullets` / `quote` / `outro` 全面适配 16:9 横屏与双皮肤
- [x] 生成 `demo-tech` 与 `demo-editorial` 两套 16:9 标杆片，完成关键帧视觉验收并导出完整 MP4

### V2：高光交互动画积木 + 三轨音频与精准同步字幕（已完成）
- [x] 沉淀可复用原子交互积木（`src/motion/`：`TypewriterText`、`AnimatedCursor`、`NumberCounter`、`SpaceBackdrop`）
- [x] 实现 9 个概念演示级高光交互场景（`src/scenes/pro/`：8 宫格扫亮、输入法鼠标点选、Token 飞落与计数仪表盘、工作台缩窄挤掉文件、Prompt 打字机终端、RAG 网格检索、MCP 八口合一 USB-C 与光点连线、结尾 8 宫格聚焦放大、点赞收藏收尾）
- [x] 打通三轨音频合成（`gen-sfx.py` 合成循环电子 BGM + 4 种微音效，`build-pro-audio.py` 分句生成离线旁白并输出精确帧级时间戳 `audio-timeline.json`）
- [x] 导出对标标杆样片 `out/ai-dictionary-pro.mp4`（1920×1080，30 fps，158.14s，音视频双轨）
- [x] 在项目独立环境 `.venv-tts/` 中部署 `Qwen3-TTS`（`qwen-tts 0.1.1` + `torch 2.15.0` + `modelscope`），完成本地零样本声音克隆实测通过（Apple M1 Pro `mps float16`，生成 9.92s 音频耗时 20.5s，约 2.0x 实时）
- [x] 将 `scripts/build-narration.py` 接入统一流水线 `scripts/run-pipeline.ts`，并在 `src/Video.tsx` 支持旁白轨、逐句同步单行字幕与 BGM 自动压低（ducking），完成本人声音克隆整片实测导出 `out/codex-rules-hooks.mp4`

### V3：视觉系统 + 混合素材管线 + 一键 MD 工作流（已完成）
- [x] 建立 `src/styles/` 视觉系统风格包体系（`dark-tech` 与 `warm-editorial` 各含 `tokens.ts`、`style-guide.md`、`image-prompt.md`、`reference.png`），沉淀 `STYLE_EXTRACTION.md` 扩肤协议与 `verify-styles.ts` 校验脚本
- [x] 打通 `assets-manifest.json` + `scripts/fetch-assets.ts`（对接 `image-gen` 混元生图自动注入风格包前缀 + Node 22 原生 CDP 无头 Chrome 自动网页截图，零新增依赖），升级 `MediaScene` 支持 `illustration` 与 `browser` 浏览器装裱
- [x] 串成一键 CLI 工作流 `scripts/run-pipeline.ts <slug>`，端到端实测 `workflow-test` 通过（风格校验 → 混元生图 → 自动网页截图 → 时间轴构建 → 抽帧目检）

---

## 阻塞与风险

- 当前 Remotion 4.0.547 与 `zod` 3.x 有版本提示（建议 `zod@4.6.7`），暂不影响纯离线 Schema 校验与渲染。

## 最近验证

- **2026-11-26（V1.5 16:9 双皮肤与新组件验收）**：
  - `tsc --noEmit` 通过（0 错误）。
  - `demo-tech`（`dark-tech`）与 `demo-editorial`（`warm-editorial`）两套分镜通过 Zod 校验并生成时间轴。
  - 抽取全部 15 张关键帧拼图目检：两套皮肤安全区、章节导航条、拟真终端、8 宫格/6 宫格矩阵、单屏暗色反转、真实截图红框标注均无溢出/重叠，已顺手收紧 `demo-tech` 首屏文案避免拆词折行。
  - 完整渲染导出 `out/demo-tech.mp4` 与 `out/demo-editorial.mp4`（1920×1080，30 fps）。
- **2026-11-26（真实长文试跑：`toturial/test.md` → `out/ai-dictionary.mp4`）**：
  - 优化 `src/timeline/build.ts` 中 `compare` / `flow` / `quote` 默认时长上限，防止无旁白视频单屏过拖。
  - 将《AI 世界入门词典》拆解为 13 场景 `dark-tech` 分镜，导出 `out/ai-dictionary.mp4`（1920×1080，30 fps，112.3s，3369 帧，9 MB），13 屏抽帧拼图目检无溢出/重叠。
- **2026-11-26（方案 A 高光交互动画 + 三轨音频样片验收：`out/ai-dictionary-pro.mp4`）**：
  - `tsc --noEmit` 通过（0 错误）。
  - `ffprobe` 校验 `out/ai-dictionary-pro.mp4`：`h264 1920×1080 @ 30fps` + `aac 48kHz stereo`，时长 `158.14s`（4744 帧，14.7 MB）。
  - 抽取 12 个高光瞬间拼图目检：全部高光互动镜头与同步字幕排版清晰、无溢出、无重叠。
- **2026-11-26（真实文章一键工作流验收：`24-hooks.md` → `out/codex-rules-hooks.mp4`）**：
  - 通过 `scripts/run-pipeline.ts codex-rules-hooks` 一键跑通全链路：风格包校验 → 混元按 `dark-tech` 前缀自动生图 2 张 → Zod 校验与时间轴构建 → `Qwen3-TTS-12Hz-1.7B-Base` 本地 `mps float16` 克隆本人音色合成 20 句解说旁白（`public/audio/codex-rules-hooks/narration.mp3`，`172.56s`）并自动对齐 20 条单行字幕与各场景时长 → 抽帧目检 → 导出带克隆旁白 + BGM 的成品 MP4（已移除 `Video.tsx` 二次折减并将 `bgm.volume` 调至 `0.26`，实测句间 BGM 响度由 `-38.7 dB` 提至 `-30.9 dB`）。
  - `ffprobe` 校验：`h264 1920×1080 @ 30fps` + `aac 48kHz stereo`，`172.59s`（5177 帧，18.8 MB）；抽帧目检 `02-media` 与 `04-mockup` 字幕位于底部安全区、清晰无重叠。
- **2026-11-26（目录重构与规范同步）**：
  - 将 `toturial/`、`new/`、`videos/`、根目录 `24-hooks.md` 统一收口到 `references/`（并加入 `.gitignore`），将 `image-gen/` 移至 `tools/image-gen/`，清理空目录 `refet/`。
  - 更新 `scripts/fetch-assets.ts` 引用路径、`.gitignore` 与 `AGENTS.md`，验证 `tsc --noEmit`、`verify-styles.ts`、`fetch-assets.ts` 与 `tools/image-gen/src/cloudbase.js` 模块加载全部通过。
  - 完成首次基线提交 `5bf5bb2`（`main`，97 个文件），并补齐 `README.md` 日常出片与命令速查手册。
