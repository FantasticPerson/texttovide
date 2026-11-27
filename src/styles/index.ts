import { STYLE_IDS, ThemeId, ThemeTokens } from "./types";
import { darkTechTokens } from "./dark-tech/tokens";
import { warmEditorialTokens } from "./warm-editorial/tokens";

export { STYLE_IDS } from "./types";
export type { ThemeId, ThemeTokens } from "./types";

export const themes: Record<ThemeId, ThemeTokens> = {
  "dark-tech": darkTechTokens,
  "warm-editorial": warmEditorialTokens,
};

export function resolveTheme(themeId: ThemeId, invert = false): ThemeTokens {
  const base = themes[themeId];
  if (!invert) return base;

  // 同族明暗反转：只反转底色与文字明暗，严格保留当前风格包的字体体系与强调色基因，绝不串去另一套风格包
  if (themeId === "warm-editorial") {
    return {
      ...base,
      isDark: true,
      colors: {
        ...base.colors,
        bg: "#121B17",
        bgGradient:
          "radial-gradient(ellipse at 24% 18%, rgba(200, 62, 43, 0.12) 0%, transparent 52%), radial-gradient(ellipse at 82% 84%, rgba(217, 179, 108, 0.10) 0%, transparent 50%)",
        gridLine: "rgba(251, 241, 199, 0.045)",
        orbPrimary: "rgba(200, 62, 43, 0.10)",
        orbSecondary: "rgba(217, 179, 108, 0.08)",
        surface: "rgba(251, 241, 199, 0.05)",
        surfaceActive: "rgba(200, 62, 43, 0.14)",
        border: "rgba(251, 241, 199, 0.16)",
        borderActive: "rgba(232, 93, 74, 0.65)",
        textPrimary: "#FBF1C7",
        textSecondary: "#D6CBA8",
        textMuted: "#9C9276",
        accent: "#E85D4A",
        accentSoft: "rgba(232, 93, 74, 0.18)",
        accentText: "#FFFFFF",
        subtitleBg: "rgba(18, 27, 23, 0.72)",
        subtitleText: "#FBF1C7",
      },
    };
  }

  return {
    ...base,
    isDark: false,
    colors: {
      ...base.colors,
      bg: "#F4F7F5",
      bgGradient:
        "radial-gradient(ellipse at 20% 20%, rgba(16, 185, 129, 0.10) 0%, transparent 52%), radial-gradient(ellipse at 85% 80%, rgba(15, 23, 42, 0.05) 0%, transparent 50%)",
      gridLine: "rgba(15, 23, 42, 0.045)",
      orbPrimary: "rgba(16, 185, 129, 0.10)",
      orbSecondary: "rgba(15, 23, 42, 0.05)",
      surface: "rgba(255, 255, 255, 0.85)",
      surfaceActive: "rgba(16, 185, 129, 0.10)",
      border: "rgba(15, 23, 42, 0.12)",
      borderActive: "rgba(5, 150, 105, 0.55)",
      textPrimary: "#0F172A",
      textSecondary: "#334155",
      textMuted: "#64748B",
      accent: "#059669",
      accentSoft: "rgba(5, 150, 105, 0.12)",
      accentText: "#FFFFFF",
      subtitleBg: "rgba(15, 23, 42, 0.82)",
      subtitleText: "#F8FAFC",
    },
  };
}

export function getSafeArea(width: number, height: number, hasChapters: boolean) {
  const isVertical = height > width;
  if (isVertical) {
    return {
      top: hasChapters ? 200 : 180,
      right: 140,
      bottom: 360,
      left: 72,
    };
  }
  return {
    top: hasChapters ? 108 : 84,
    right: 120,
    bottom: 132,
    left: 120,
  };
}

export const motion = {
  enterSec: 0.32,
  exitSec: 0.24,
  headerLeadSec: 0.55,
  minHoldAfterLastActionSec: 0.9,
  spring: {
    damping: 18,
    stiffness: 120,
    mass: 0.9,
  },
  dimmedOpacity: 0.52,
} as const;
