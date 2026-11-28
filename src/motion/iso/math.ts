export interface Vec2 {
  x: number;
  y: number;
}

const COS30 = 0.8660254;
const SIN30 = 0.5;

/**
 * 标准 2.5D 等距（Isometric）投影：
 * - x 轴向右下方延伸
 * - y 轴向左下方延伸
 * - z 轴垂直向上延伸
 */
export function isoProject(
  x: number,
  y: number,
  z: number,
  originX: number,
  originY: number,
  unit = 1,
): Vec2 {
  return {
    x: originX + (x - y) * COS30 * unit,
    y: originY + (x + y) * SIN30 * unit - z * unit,
  };
}

export function ptsToString(pts: Vec2[]): string {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/** 调整 Hex 颜色亮度（pct 正数变亮，负数变暗），用于自动生成 2.5D 三面明暗 */
export function shadeHex(hex: string, pct: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((num >> 16) & 0xff) + (255 * pct) / 100);
  const g = clamp(((num >> 8) & 0xff) + (255 * pct) / 100);
  const b = clamp((num & 0xff) + (255 * pct) / 100);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export type IsoTone =
  | "blue"
  | "orange"
  | "green"
  | "purple"
  | "red"
  | "amber"
  | "neutral";

/** 2.5D 积木配色表（同时适配暖纸编辑风与深空科技风） */
export function resolveIsoColor(tone: IsoTone, isDark: boolean): string {
  const map: Record<IsoTone, { light: string; dark: string }> = {
    blue: { light: "#5670D8", dark: "#4F83F1" },
    orange: { light: "#E86F3A", dark: "#F07B42" },
    green: { light: "#4E9A67", dark: "#34D399" },
    purple: { light: "#8C65B8", dark: "#A78BFA" },
    red: { light: "#D64E45", dark: "#F87171" },
    amber: { light: "#D4A44C", dark: "#FBBF24" },
    neutral: { light: "#8A8273", dark: "#64748B" },
  };
  return isDark ? map[tone].dark : map[tone].light;
}
