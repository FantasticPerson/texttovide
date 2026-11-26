# STYLE_EXTRACTION.md — 从参考图提炼新风格包的标准协议

当你刷到任何喜欢的视频、网站或杂志设计，只需准备 **2～3 张参考截图**，按以下 4 步就能在 10 分钟内为 `texttovideo-new` 扩充一套全新的风格包（如 `stripe-light`、`apple-mono`、`retro-paper`）。

---

## Step 1 · 准备参考样本
将 2～3 张代表性截图放入临时目录（如 `content/_style-refs/<style-id>/`），覆盖：
- 1 张整体氛围 / 首屏图
- 1 张信息卡片 / 数据或对比布局图
- （可选）1 张图表 / 界面或插画细节图

## Step 2 · 让 AI 反向提取 Visual DNA（不要直接写代码）
把截图交给 AI，执行以下提炼清单，先输出文字确认方向：
1. **Art Direction**：3 个正向气质词 + 3 个反例边界（绝对不能出现什么）。
2. **Color Roles**：背景底色、表面卡片色、1px 边框色、主字/次字色、主强调色、正反对比色、字幕底色与字色。
3. **Typography**：标题字体取向（无衬线现代 vs 衬线编辑感）、等宽字体、关键词高亮用法。
4. **Image Prompt DNA**：AI 生图时必须锁死的背景 HEX、材质/画风关键词、负向禁令。

## Step 3 · 落地 4 件套到 `src/styles/<style-id>/`
确认方向无误后，生成标准 4 件套并注册到 `src/styles/index.ts` 与 `src/schema/storyboard.ts`：
- `src/styles/<style-id>/tokens.ts`
- `src/styles/<style-id>/style-guide.md`
- `src/styles/<style-id>/image-prompt.md`
- `src/styles/<style-id>/reference.png`（跑 1 组标杆样片抽帧拼图作为视觉锚定样本）

## Step 4 · 质量门禁验证
1. 运行 `./node_modules/.bin/tsx scripts/verify-styles.ts` 验证 4 件套与注册完整。
2. 用新皮肤重渲一套短分镜，抽帧目检 5 项：第一眼气质是否像参考图、留白是否充足、旧要点降权是否可读、字幕对比度是否清晰、生图与代码画面是否属于同一审美家族。
