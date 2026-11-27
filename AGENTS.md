# AGENTS.md — texttovideo-new

## 项目定位

本项目用于将一篇 Markdown 文档（`article.md`）工程化、稳定地转换为高质量知识讲解视频。默认采用 **16:9 横屏（1920×1080，30 fps）**，同时保留 **9:16 竖屏（1080×1920，30 fps）** 适配。

核心原则：**语义活给 AI（文档拆解为结构化分镜与示意概念），机械活给程序（Schema 校验、时间轴计算、Remotion 确定性渲染、FFmpeg 编码）。**

## 目录约定

```text
texttovideo-new/
├── AGENTS.md                 # 项目级规范与设计约束（本文件）
├── ROADMAP.md                # 项目真实进度源
├── src/
│   ├── schema/               # Zod Schema（storyboard / timeline / assets）
│   ├── styles/               # 视觉系统风格包（dark-tech / warm-editorial，每套含 tokens / style-guide / image-prompt / reference）
│   ├── theme/                # 兼容层（转发至 src/styles）
│   ├── motion/               # 可复用原子交互动效积木（打字机、光标、数字滚动、深空背景）
│   ├── timeline/             # storyboard → timeline 纯函数计算
│   ├── components/           # 公共基础件（Background、SceneShell、ChapterBar、HighlightText）
│   ├── scenes/               # 13 种语义化场景组件（含 Diagram、Metrics、Verdict、Mockup、Media、Grid、Chapter 等）
│   ├── Video.tsx             # 总组装器（场景序列 + 章节条 + 旁白 + 字幕 + BGM）
│   ├── Root.tsx              # Remotion Composition 注册
│   └── index.ts              # Remotion 入口
├── scripts/                  # CLI 流水线脚本（run-pipeline / verify-styles / fetch-assets / build-timeline / build-narration / render-*）
├── tools/
│   └── image-gen/            # 外部生图工具（混元生图，含独立 .env，不进 git）
├── content/<slug>/           # 单支视频素材（article.md / storyboard.json / assets-manifest.json / timeline.json）
├── voice/                    # 本人声音克隆参考样本（my-ref.wav / my-ref.txt）
├── public/                   # Remotion 渲染期静态资产（BGM、音效、自动生成的配图与旁白）
├── out/                      # 渲染产物（不进 git）
└── references/               # 只读参考资料（tutorials / visual-notes / videos / articles，不进 git）
```

## 视觉与排版规范

1. **画布规格**：默认 `1920×1080`（16:9，30 fps），兼容 `1080×1920`（9:16，30 fps）。所有动效按秒定义，渲染时乘以 `fps`。
2. **双套核心皮肤**（定义在 `src/theme/index.ts`）：
   - `dark-tech`（深空墨绿科技风）：极深星尘黑底 + 翡翠绿高亮 + `1px` 细墨绿玻璃框，适合硬核技术、工具与架构拆解。
   - `warm-editorial`（暖纸红黑编辑风）：奶油暖纸底 + 炭黑衬线大标题 + 朱砂红局部关键词高亮，支持单屏 `invert: true` 切换为深墨绿暗底做视觉反转，适合方法论、观点与趋势解读。
3. **关键词局部高亮**：标题与核心文案支持用 `**关键词**` 标记重点词，由 `HighlightText` 自动着强调色（每句只高亮 1 处核心词，禁止滥用）。
4. **安全区**：
   - 16:9 横屏：顶部留白 `96px`（含顶部章节导航条），左右 `120px`，底部 `130px`（预留单行字幕安全区）。
   - 9:16 竖屏：顶部 `180px`，右侧 `140px`，左侧 `72px`，底部 `360px`。
5. **去 PPT 化原则**：
   - 优先使用 `mockup`（拟真终端/对话窗口）、`flow`（节点连线）、`compare`（左右/上下对照）、`grid`（多概念矩阵）、`media`（真实截图+高亮框）、`chapter`（极简章节过场）表达概念，避免通篇堆砌纯文字列表。
   - 单屏留白充足，动画演完即定住，末个动作完成后至少保留 `0.85s` 阅读停留，转场先退旧再进新、绝不重叠打架。

## 开发与验证流程

1. 修改 `content/<slug>/storyboard.json` 后，先运行 `pnpm build:timeline <slug>`（或 `./node_modules/.bin/tsx scripts/build-timeline.ts <slug>`）做 Schema 校验并生成 `timeline.json`。
2. 先运行 `render-frames.ts <slug>` 抽关键帧目检，确认无溢出、无重叠、视觉层次达标后再导出完整 MP4。
3. 每次完成阶段功能或修复后，必须同步更新 `ROADMAP.md`。
