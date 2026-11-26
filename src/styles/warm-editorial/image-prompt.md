# Image Prompt Spec — warm-editorial（AI 生图风格锁死规范）

> 当工作流需要为 `warm-editorial` 视频生成隐喻插画（如硬币罐、跷跷板、成长曲线、书桌场景）时，**必须将本规范的前缀与负面禁令拼入最终生图 Prompt**。

## 1. 通用正向风格前缀（英文，直接拼接在主体描述前）

```text
Minimalist editorial flat vector illustration on a warm cream paper background (#FBF1C7), clean muted palette of charcoal ink (#1F2933), vermilion red accent (#C83E2B), deep forest green (#1B4D3E), and soft warm ochre, subtle paper grain texture, New Yorker / Kinfolk / Monocle magazine editorial style, clean geometric shapes with generous empty warm cream margins (at least 50% negative space), calm intellectual atmosphere, 16:9 widescreen
```

## 2. 通用负面禁令（Negative Prompt）

```text
no text, no letters, no Chinese characters, no watermarks, no 3D glossy plastic render, no neon glow, no dark black background, no photorealistic stock photo, no cluttered details, no anime style
```

## 3. 场景化模板示例

- **概念隐喻插画**（如「守住现金流与杠杆」）：
  > `[正向前缀], a simple glass jar filled with stacked ochre coins on the left and a minimal unbalanced wooden seesaw lever on the right with one small vermilion red accent weight, flat editorial diagram feel, centered with wide margins, [负面禁令]`
- **个人作品集 / 持续输出**：
  > `[正向前缀], neatly arranged minimalist cards of a notebook, a small dark code window, and a vermilion red circle emblem floating lightly on warm cream paper, subtle soft drop shadows, [负面禁令]`

## 4. 验收红线

1. **严禁出现文字/字母**（文字由 Remotion 渲染层叠加）。
2. 底色必须干净贴近 `#FBF1C7`，方便直接无边框融入暖纸画面。
