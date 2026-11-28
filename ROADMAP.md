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
- **2026-11-26（主模板微音效接入验收）**：
  - 在 `src/schema/storyboard.ts`、`src/timeline/build.ts` 与 `src/Video.tsx` 接入可配置微音效层（`sfx: { enabled, volume }`，默认开启）：切屏自动触发 `whoosh.wav`，`bullets/compare/flow/grid` 按 `itemTimings` 触发 `pop.wav`，`mockup/media` 触发 `click.wav`。
  - `tsc --noEmit` 0 错误，重新导出 `out/codex-rules-hooks.mp4`（5177 帧，18.8 MB），实测转场音效与全片无削波。
- **2026-11-27（V4 组件库与动效全面升级验收：`out/components-showcase.mp4`）**：
  - 新增 `AnimatedConnector`（SVG 贝塞尔画线 + 流动光点）、`HighlightText` `==荧光词==` 扫过动效、3 类新场景组件（`DiagramScene` 多路汇聚/中心辐射、`MetricsScene` KPI 卡/环形仪表盘/评测柱状图、`VerdictScene` 红叉绿勾强判定/玻璃胶囊聚光灯），并升级 `MediaScene`（多框 SVG 描边 + 手机壳 `phone` + 长图滚动）与 `GridScene`（`focusMode` 聚光灯模式）。
  - 制作 10 屏双皮肤反转演示片 `content/components-showcase/storyboard.json` 并完成全屏抽帧目检与修复，导出 `out/components-showcase.mp4`（`h264 1920×1080 @ 30fps` + `aac 48kHz stereo`，`57.60s`，1728 帧，7.5 MB，音频峰值 `-14.7 dB` 无削波）。
- **2026-11-27（通用转场层 + 镜头呼吸动效 + 终端打字机接入）**：
  - 在 `baseSceneFields` 与 `SceneShell.tsx` 接入全场景通用的 `transition`（`fade / slide-up / slide-left / wipe / zoom`）与 `camera`（`none / zoom-in / zoom-out / pan-left / pan-right`），并在 `MockupScene.tsx` 为命令行 `prompt` 接入 `TypewriterText` 打字机光标动效。
  - `tsc --noEmit` 0 错误，重新导出 `out/components-showcase.mp4` 实测全部转场与镜头推进效果；随后修复 Chromium 慢速缩放文字时的亚像素跳格问题（将持续呼吸感迁至 `Background.tsx` 的 GPU `translate3d/scale` 光斑，前景纯文字屏默认 `camera: "none"` 且转场完成后释放 `transform`）。
- **2026-11-27（数据图表补全：`MetricsScene` 新增 `line` 折线面积图与 `donut` 环形占比图）**：
  - 吸收 `reactvideoeditor/remotion-templates` 的纯 Remotion SVG 图表绘制思路并适配双皮肤 `ThemeTokens`，为 `MetricsScene` 新增 `mode: "line"`（折线绘制 + 渐变面积揭开 + 节点弹入）与 `mode: "donut"`（顺时针环形占比 + 环心大数字 + 右侧图例明细）。
  - 抽帧目检 `05b-metrics-f946.png` 与 `05c-metrics-f1114.png` 排版无溢出、双皮肤对比清晰，导出 `out/components-showcase.mp4`（`1920×1080 @ 30fps`，`68.42s`，2052 帧，9.7 MB）。
- **2026-11-27（出片 SOP 沉淀）**：
  - 新增 `WORKFLOW.md`（固化 5 步出片验收流程、13 类组件选型矩阵、动效/音频/防抖避坑铁律与局部重跑技巧），并在 `AGENTS.md` 挂载必读入口，确保任意新会话开箱即按统一标准出片。
- **2026-11-27（支持手动选择视觉风格）**：
  - 新增 `scripts/parse-theme.ts`，为 `run-pipeline.ts`、`fetch-assets.ts`、`build-timeline.ts`、`render-video.ts` 全链路接入 `--theme <dark-tech|warm-editorial>` 手动覆写与 `--list-themes` 查询（`render-video.ts --theme` 自动输出 `out/<slug>-<theme>.mp4` 不覆盖原片），并同步更新 `WORKFLOW.md` 与 `README.md`。
  - 将风格 ID 列表收口到 `src/styles/types.ts`（`STYLE_IDS` 单点真源，`storyboard.ts` / `assets.ts` / CLI 自动联动），并在 `AGENTS.md` 挂载 `src/styles/STYLE_EXTRACTION.md` 扩肤协议入口。
  - 将顶部章节进度条改为可选配置 `showChapterBar`（默认 `false` 不显示，需显示时在分镜中显式开启）。
- **2026-11-27（真实长文全流程出片验收：`25-worktrees.md` → `out/codex-worktrees.mp4`）**：
  - 按 `WORKFLOW.md` 执行手动选风格（`warm-editorial` + 暗屏反转、`showChapterBar: false`），全自动跑通 2 张混元暖纸风配图（`medical-chart-copies.png` / `kitchen-handoff.png`）、本地 `Qwen3-TTS` 克隆 21 句本人旁白（`191.50s`）、单行同步字幕、微音效与 BGM 混音。
  - 抽帧目检 7 屏（顺手收紧 `03-diagram` 圆心标签避免折行），`ffprobe` / `volumedetect` 校验通过：`h264 1920×1080 @ 30fps` + `aac 48kHz stereo`，`191.51s`（5745 帧，22.4 MB，峰值 `-4.0 dB` 无削波）。
  - 修复 `src/styles/index.ts` 中 `resolveTheme(..., true)` 直接串切另一套风格包的 bug（改为同族明暗反转，保留原风格字体与强调色），同步更新 `WORKFLOW.md` 默认全片风格统一原则，并移除 `codex-worktrees` 全部 `invert: true` 重新导出纯暖纸红黑编辑风成片。
- **2026-11-28（V5 2.5D 等距积木沙盘引擎集成验收：`out/iso-showcase.mp4`）**：
  - 零外部 3D 依赖，在 `src/motion/iso/` 实现纯 SVG 等距投影数学与 6 类 2.5D 原子积木（`IsoBoard` / `IsoBox` / `IsoCylinder` / `IsoCallout` / `IsoLink` / `IsoPerson`），新增 3 类标准场景（`IsoBoardScene`、`IsoStackScene`、`IsoMetricsScene`），场景库扩充至 16 类并双皮肤通用。
  - 制作 7 屏演示片 `content/iso-showcase/storyboard.json`，完成全屏抽帧目检与间距微调，导出 `out/iso-showcase.mp4`（`1920×1080 @ 30fps`，`41.7s`，1251 帧）。
