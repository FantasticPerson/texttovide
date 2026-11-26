export type ThemeId = "dark-tech" | "warm-editorial";

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  isDark: boolean;
  colors: {
    bg: string;
    bgGradient: string;
    gridLine: string;
    orbPrimary: string;
    orbSecondary: string;
    surface: string;
    surfaceActive: string;
    border: string;
    borderActive: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    accentText: string;
    negative: string;
    negativeBg: string;
    negativeBorder: string;
    positive: string;
    positiveBg: string;
    positiveBorder: string;
    windowBg: string;
    windowHeaderBg: string;
    subtitleBg: string;
    subtitleText: string;
  };
  fonts: {
    heading: string;
    sans: string;
    mono: string;
  };
}

export const SANS_STACK =
  '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif';
export const SERIF_STACK =
  '"Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", Georgia, serif';
export const MONO_STACK =
  '"SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace';
