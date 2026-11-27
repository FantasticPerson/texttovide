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
  if (!invert) return themes[themeId];
  return themeId === "warm-editorial"
    ? themes["dark-tech"]
    : themes["warm-editorial"];
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
