export const theme = {
  canvas: {
    width: 1080,
    height: 1920,
    fps: 30,
  },
  // 9:16 竖屏平台安全区（避开顶部状态栏、右侧互动按钮、底部标题栏 + 预留 120px 字幕区）
  safeArea: {
    top: 180,
    right: 140,
    bottom: 360,
    left: 72,
  },
  colors: {
    bg: "#0B0F19",
    bgSurface: "rgba(255, 255, 255, 0.045)",
    bgSurfaceActive: "rgba(56, 189, 248, 0.11)",
    border: "rgba(148, 163, 184, 0.18)",
    borderActive: "rgba(56, 189, 248, 0.55)",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    accent: "#38BDF8",
    accentSoft: "rgba(56, 189, 248, 0.16)",
    negative: "#F87171",
    negativeBg: "rgba(248, 113, 113, 0.10)",
    negativeBorder: "rgba(248, 113, 113, 0.36)",
    positive: "#34D399",
    positiveBg: "rgba(52, 211, 153, 0.10)",
    positiveBorder: "rgba(52, 211, 153, 0.38)",
  },
  fonts: {
    sans: '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
    mono: '"SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace',
  },
  typography: {
    kicker: 28,
    hookTitle: 74,
    sceneTitle: 58,
    cardTitle: 38,
    body: 40,
    bodyCompact: 34,
    caption: 28,
  },
  motion: {
    // 全部按秒定义，渲染时乘 fps，避免硬编码帧数
    enterSec: 0.32,
    exitSec: 0.24,
    headerLeadSec: 0.65,
    minHoldAfterLastActionSec: 0.9,
    spring: {
      damping: 18,
      stiffness: 120,
      mass: 0.9,
    },
    dimmedOpacity: 0.52,
  },
} as const;
