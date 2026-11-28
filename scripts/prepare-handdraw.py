#!/usr/bin/env python3
"""
手绘白板动画预处理脚本（零 OpenCV 依赖，仅用 Pillow + NumPy + SciPy）：
给定一张彩色插画 <img.png>，自动生成：
  1. <img.sketch.png>  ：透明底深棕线稿图（Sobel 边缘 + 暗部细节提取）
  2. <img.strokes.json>：归一化 (0..1) 线稿笔尖轨迹 sketchPoints + Z 字上色轨迹 paintPoints

用法：
  .venv-tts/bin/python scripts/prepare-handdraw.py <image_path_or_slug> [--force]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, sobel


def extract_sketch_and_strokes(img_path: Path, force: bool = False) -> None:
    sketch_path = img_path.with_suffix(".sketch.png")
    strokes_path = img_path.with_suffix(".strokes.json")

    if not force and sketch_path.exists() and strokes_path.exists():
        print(f"⏭  已存在手绘预处理产物，跳过: {img_path.name}")
        return

    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    arr = np.asarray(img, dtype=np.float32) / 255.0

    # 1. 灰度 + 轻微高斯平滑去噪，再用 Sobel 提取清晰轮廓边缘
    gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    smooth = gaussian_filter(gray, sigma=0.9)
    gx = sobel(smooth, axis=1)
    gy = sobel(smooth, axis=0)
    mag = np.hypot(gx, gy)

    # 归一化边缘强度，保留清晰的工笔/钢笔线条感
    p95 = float(np.percentile(mag, 96)) or 1.0
    edge = np.clip((mag / p95) * 1.35, 0.0, 1.0)
    # 去掉微弱背景噪点，强化真实线条
    edge = np.where(edge > 0.18, np.clip((edge - 0.18) / 0.65, 0.0, 1.0), 0.0)

    # 融合少量原图极暗线条（如纯黑轮廓/深色细节）
    dark_ink = np.clip((0.28 - gray) / 0.22, 0.0, 1.0) * 0.55
    ink_alpha = np.clip(np.maximum(edge, dark_ink), 0.0, 1.0)

    # 输出透明底深棕墨水线稿 (#2C1E14)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = 44
    rgba[:, :, 1] = 30
    rgba[:, :, 2] = 20
    rgba[:, :, 3] = (ink_alpha * 245).astype(np.uint8)
    Image.fromarray(rgba, mode="RGBA").save(sketch_path)

    # 2. 基于线稿密度网格生成最近邻连贯笔尖轨迹 (sketchPoints)
    grid_cols, grid_rows = 28, 18
    cell_w = w / grid_cols
    cell_h = h / grid_rows
    candidates = []
    for r in range(grid_rows):
        for c in range(grid_cols):
            y0, y1 = int(r * cell_h), int((r + 1) * cell_h)
            x0, x1 = int(c * cell_w), int((c + 1) * cell_w)
            patch = ink_alpha[y0:y1, x0:x1]
            density = float(patch.mean())
            if density > 0.035:
                candidates.append(((c + 0.5) / grid_cols, (r + 0.5) / grid_rows, density))

    if not candidates:
        candidates = [(0.2, 0.2, 1.0), (0.8, 0.2, 1.0), (0.8, 0.8, 1.0), (0.2, 0.8, 1.0)]

    # 从最左上角有线条的区域起笔，按最近邻贪心串联成自然手绘轨迹
    candidates.sort(key=lambda p: p[0] + p[1])
    visited = [False] * len(candidates)
    order = [0]
    visited[0] = True
    for _ in range(len(candidates) - 1):
        cur_x, cur_y, _ = candidates[order[-1]]
        best_i = -1
        best_d = 1e9
        for i, (cx, cy, _) in enumerate(candidates):
            if visited[i]:
                continue
            d = math.hypot(cx - cur_x, cy - cur_y)
            if d < best_d:
                best_d = d
                best_i = i
        if best_i >= 0:
            visited[best_i] = True
            order.append(best_i)

    # 下采样控制在 ~95 个关键轨迹点，流畅且 JSON 轻量
    step = max(1, len(order) // 95)
    sketch_pts = [
        [round(candidates[idx][0], 4), round(candidates[idx][1], 4)]
        for idx in order[::step]
    ]
    if order[-1] != order[::step][-1]:
        sketch_pts.append([round(candidates[order[-1]][0], 4), round(candidates[order[-1]][1], 4)])

    # 3. 计算主体包围盒并生成斜向 Z 字形上色涂抹轨迹 (paintPoints)
    xs = [p[0] for p in sketch_pts]
    ys = [p[1] for p in sketch_pts]
    min_x, max_x = max(0.04, min(xs) - 0.05), min(0.96, max(xs) + 0.05)
    min_y, max_y = max(0.04, min(ys) - 0.05), min(0.96, max(ys) + 0.05)

    paint_pts = []
    stripes = 7
    for i in range(stripes):
        t = i / max(1, stripes - 1)
        y = min_y + t * (max_y - min_y)
        if i % 2 == 0:
            paint_pts.append([round(min_x, 4), round(y, 4)])
            paint_pts.append([round((min_x + max_x) / 2, 4), round(y, 4)])
            paint_pts.append([round(max_x, 4), round(y, 4)])
        else:
            paint_pts.append([round(max_x, 4), round(y, 4)])
            paint_pts.append([round((min_x + max_x) / 2, 4), round(y, 4)])
            paint_pts.append([round(min_x, 4), round(y, 4)])

    payload = {
        "width": w,
        "height": h,
        "sketchPoints": sketch_pts,
        "paintPoints": paint_pts,
    }
    strokes_path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"✓ 已生成手绘线稿与轨迹: {sketch_path.name} ({len(sketch_pts)} 线稿点, {len(paint_pts)} 上色点)")


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv[1:]
    if not args:
        print("用法: prepare-handdraw.py <image_path_or_slug> [--force]")
        sys.exit(1)

    target = Path(args[0])
    if target.exists() and target.is_file():
        extract_sketch_and_strokes(target, force=force)
        return

    # 按 slug 扫描 storyboard.json 中所有 hand-draw 场景引用的图片
    sb_path = Path("content") / args[0] / "storyboard.json"
    if not sb_path.exists():
        print(f"✗ 找不到图片或分镜文件: {args[0]}")
        sys.exit(1)

    sb = json.loads(sb_path.read_text(encoding="utf-8"))
    images: list[str] = []
    for scene in sb.get("scenes", []):
        if scene.get("type") != "hand-draw":
            continue
        if scene.get("image"):
            images.append(scene["image"])
        for it in scene.get("items", []):
            if it.get("image"):
                images.append(it["image"])

    if not images:
        print(f"ℹ️  [{args[0]}] 无 hand-draw 场景，跳过手绘预处理。")
        return

    for rel in dict.fromkeys(images):
        p = Path("public") / rel
        if p.exists():
            extract_sketch_and_strokes(p, force=force)
        else:
            print(f"⚠️  未找到手绘源图: {p}")


if __name__ == "__main__":
    main()
