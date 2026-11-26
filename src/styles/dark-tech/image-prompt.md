# Image Prompt Spec — dark-tech（AI 生图风格锁死规范）

> 当工作流需要为 `dark-tech` 视频生成配图、隐喻插画或封面时，**必须将本规范的前缀与负面禁令拼入最终生图 Prompt**，保证生成图与 Remotion 深空墨绿画面无缝融合。

## 1. 通用正向风格前缀（英文，直接拼接在主体描述前）

```text
Minimalist dark tech editorial illustration on a solid deep space black background (#090B10), subtle emerald green (#34D399) and warm gold (#FDE68A) accent lighting, ultra-clean frosted dark glassmorphism surfaces with thin 1px glowing emerald edges, soft volumetric rim light, generous negative space (at least 45% empty dark background), isometric or clean front composition, Apple keynote / Linear.app aesthetic, crisp vector-meets-3D precision, 16:9 widescreen
```

## 2. 通用负面禁令（Negative Prompt）

```text
no text, no Chinese characters, no watermarks, no cluttered background, no cyberpunk neon pink or purple, no bright white background, no cartoonish clipart, no stock photo people, no busy gradients, no low-res blur
```

## 3. 场景化模板示例

- **抽象隐喻图**（如「知识库 / 大脑与工具」）：
  > `[正向前缀], a sleek minimalist dark glass cube representing an AI brain connected by thin glowing emerald fiber lines to three clean geometric tool icons floating in dark space, balanced centered layout, [负面禁令]`
- **深空氛围封面**：
  > `[正向前缀], a dark planet horizon with a subtle emerald and pale gold sunrise light ray from the top right, ultra-minimalist cosmic atmosphere, empty left half reserved for typography, [负面禁令]`

## 4. 验收红线

1. **严禁让生图模型画中文文字**（所有文字一律由 Remotion 渲染层叠加，避免乱码）。
2. 背景边缘必须自然融入 `#090B10`，不允许出现突兀白边或高饱和杂色。
