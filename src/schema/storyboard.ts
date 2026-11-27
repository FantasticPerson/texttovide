import { z } from "zod";

const nonEmpty = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}不能为空`)
    .max(max, `${label}超过 ${max} 字上限，请精简以防溢出`);

export const TransitionSchema = z.enum(["fade", "slide-up", "slide-left", "wipe", "zoom"]);
export const CameraMotionSchema = z.enum(["none", "zoom-in", "zoom-out", "pan-left", "pan-right"]);
export type TransitionType = z.infer<typeof TransitionSchema>;
export type CameraMotion = z.infer<typeof CameraMotionSchema>;

const baseSceneFields = {
  id: z.string().min(1),
  kicker: nonEmpty(16, "角标").optional(),
  chapter: nonEmpty(12, "所属章节").optional(),
  subtitle: nonEmpty(24, "底部单行字幕").optional(),
  narration: z.array(z.string().trim().min(1)).optional(),
  invert: z.boolean().optional(),
  durationSec: z.number().min(2).max(25).optional(),
  transition: TransitionSchema.optional(),
  camera: CameraMotionSchema.optional(),
};

export const HookSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("hook"),
  headline: nonEmpty(30, "开场主钩子"),
  subline: nonEmpty(36, "开场副句").optional(),
});

export const ChapterSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("chapter"),
  number: nonEmpty(8, "章节序号").optional(),
  title: nonEmpty(24, "章节标题"),
  subline: nonEmpty(30, "章节副句").optional(),
});

export const BulletsSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("bullets"),
  title: nonEmpty(24, "场景标题"),
  bullets: z
    .array(nonEmpty(24, "屏显要点"))
    .min(1, "至少需要 1 条要点")
    .max(4, "单屏要点最多 4 条"),
});

export const CompareSideSchema = z.object({
  label: nonEmpty(12, "对照标签"),
  points: z
    .array(nonEmpty(22, "对照要点"))
    .min(1)
    .max(3, "每侧对照最多 3 条要点"),
});

export const CompareSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("compare"),
  title: nonEmpty(24, "场景标题"),
  before: CompareSideSchema,
  after: CompareSideSchema,
});

export const FlowStepSchema = z.object({
  label: nonEmpty(16, "步骤标题"),
  detail: nonEmpty(24, "步骤说明"),
});

export const FlowSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("flow"),
  title: nonEmpty(24, "场景标题"),
  steps: z
    .array(FlowStepSchema)
    .min(3, "流程场景至少 3 步")
    .max(4, "流程场景最多 4 步"),
});

export const QuoteSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("quote"),
  highlight: nonEmpty(18, "大字核心词").optional(),
  quote: nonEmpty(44, "金句正文"),
  caption: nonEmpty(28, "补充说明").optional(),
});

export const MockupLineSchema = z.object({
  role: z.enum(["prompt", "output", "highlight", "muted"]).default("output"),
  text: nonEmpty(64, "窗口内容行"),
});

export const MockupSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("mockup"),
  title: nonEmpty(24, "场景标题").optional(),
  windowTitle: nonEmpty(24, "窗口标题").default("Terminal"),
  lines: z.array(MockupLineSchema).min(2).max(7),
  badges: z.array(nonEmpty(12, "底部步骤标签")).max(4).optional(),
});

export const GridCardSchema = z.object({
  tag: nonEmpty(10, "卡片标签").optional(),
  title: nonEmpty(16, "卡片标题"),
  desc: nonEmpty(24, "卡片简介").optional(),
  featured: z.boolean().optional(),
});

export const GridSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("grid"),
  title: nonEmpty(24, "场景标题").optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(4),
  /** 聚光灯模式：按 itemTimings 逐卡高亮微放大，其余卡片自动压暗 */
  focusMode: z.boolean().default(false),
  cards: z.array(GridCardSchema).min(4).max(8),
});

const HighlightBoxSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(1).max(100),
  h: z.number().min(1).max(100),
  label: nonEmpty(20, "高亮框标签").optional(),
  color: z.string().optional(),
});

export const MediaSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("media"),
  title: nonEmpty(24, "场景标题"),
  image: z.string().min(1, "图片路径不能为空"),
  variant: z.enum(["browser", "illustration", "phone", "plain"]).default("plain"),
  urlLabel: nonEmpty(48, "网址栏显示").optional(),
  caption: nonEmpty(30, "图片说明").optional(),
  /** 长图缓慢向上平移浏览 */
  scroll: z.boolean().default(false),
  // 可选单个高亮框（向后兼容）
  highlightBox: HighlightBoxSchema.optional(),
  // 可选多个高亮框（按时间轴依次描边绘制弹出）
  highlightBoxes: z.array(HighlightBoxSchema).max(4).optional(),
});

const DiagramNodeSchema = z.object({
  label: nonEmpty(14, "节点名称"),
  sub: nonEmpty(20, "节点副说明").optional(),
  tone: z.enum(["default", "accent", "danger"]).default("default"),
});

export const DiagramSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("diagram"),
  title: nonEmpty(26, "架构标题"),
  layout: z.enum(["converge", "hub"]).default("converge"),
  center: DiagramNodeSchema,
  /** converge 模式：左侧输入节点；hub 模式：辐射卫星节点 */
  inputs: z.array(DiagramNodeSchema).min(2).max(6),
  /** converge 模式可选右侧输出节点 */
  outputs: z.array(DiagramNodeSchema).max(4).optional(),
});

export const MetricsSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("metrics"),
  title: nonEmpty(26, "指标标题"),
  mode: z.enum(["cards", "gauges", "bars", "line", "donut"]).default("cards"),
  /** donut 模式中心说明文字（可选） */
  centerLabel: nonEmpty(14, "环心标签").optional(),
  items: z
    .array(
      z.object({
        label: nonEmpty(18, "指标名"),
        value: z.number(),
        /** 仪表盘/进度条满格上限（默认取本组最大值或 100） */
        max: z.number().positive().optional(),
        prefix: nonEmpty(8, "前缀").optional(),
        suffix: nonEmpty(12, "单位后缀").optional(),
        note: nonEmpty(26, "补充说明").optional(),
        trend: z.enum(["up", "down", "neutral"]).optional(),
        featured: z.boolean().optional(),
        dimmed: z.boolean().optional(),
      }),
    )
    .min(2)
    .max(8),
});

export const VerdictSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("verdict"),
  title: nonEmpty(26, "判定标题").optional(),
  mode: z.enum(["judge", "pills"]).default("judge"),
  items: z
    .array(
      z.object({
        label: nonEmpty(22, "条目文案"),
        detail: nonEmpty(30, "补充说明").optional(),
        status: z.enum(["pass", "fail", "neutral"]).default("neutral"),
      }),
    )
    .min(2)
    .max(5),
});

export const OutroSceneSchema = z.object({
  ...baseSceneFields,
  type: z.literal("outro"),
  conclusion: nonEmpty(26, "收尾结论"),
  subline: nonEmpty(30, "收尾副句").optional(),
});

export const SceneSchema = z.discriminatedUnion("type", [
  HookSceneSchema,
  ChapterSceneSchema,
  BulletsSceneSchema,
  CompareSceneSchema,
  FlowSceneSchema,
  QuoteSceneSchema,
  MockupSceneSchema,
  GridSceneSchema,
  MediaSceneSchema,
  DiagramSceneSchema,
  MetricsSceneSchema,
  VerdictSceneSchema,
  OutroSceneSchema,
]);

export const StoryboardSchema = z.object({
  title: nonEmpty(36, "视频标题"),
  theme: z.enum(["dark-tech", "warm-editorial"]).default("dark-tech"),
  fps: z.number().int().min(24).max(60).default(30),
  width: z.number().int().default(1920),
  height: z.number().int().default(1080),
  chapters: z.array(nonEmpty(12, "章节名")).max(10).optional(),
  bgm: z
    .object({
      file: z.string().min(1),
      volume: z.number().min(0).max(1).default(0.18),
      fadeInSec: z.number().min(0).max(5).default(1),
      fadeOutSec: z.number().min(0).max(5).default(1.8),
    })
    .optional(),
  sfx: z
    .object({
      enabled: z.boolean().default(true),
      volume: z.number().min(0).max(2).default(1),
    })
    .optional(),
  scenes: z.array(SceneSchema).min(2, "至少 2 个场景").max(16, "最多 16 个场景"),
});

export type HookScene = z.infer<typeof HookSceneSchema>;
export type ChapterScene = z.infer<typeof ChapterSceneSchema>;
export type BulletsScene = z.infer<typeof BulletsSceneSchema>;
export type CompareScene = z.infer<typeof CompareSceneSchema>;
export type FlowScene = z.infer<typeof FlowSceneSchema>;
export type QuoteScene = z.infer<typeof QuoteSceneSchema>;
export type MockupScene = z.infer<typeof MockupSceneSchema>;
export type GridScene = z.infer<typeof GridSceneSchema>;
export type MediaScene = z.infer<typeof MediaSceneSchema>;
export type DiagramScene = z.infer<typeof DiagramSceneSchema>;
export type MetricsScene = z.infer<typeof MetricsSceneSchema>;
export type VerdictScene = z.infer<typeof VerdictSceneSchema>;
export type OutroScene = z.infer<typeof OutroSceneSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;

export interface ItemTiming {
  startFrame: number;
  endFrame: number;
}

export interface TimelineScene {
  scene: Scene;
  index: number;
  startFrame: number;
  durationInFrames: number;
  readingSec: number;
  itemTimings: ItemTiming[];
}

export interface SubtitleCue {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface TimelineData {
  title: string;
  theme: Storyboard["theme"];
  fps: number;
  width: number;
  height: number;
  chapters?: string[];
  totalFrames: number;
  totalSec: number;
  bgm?: Storyboard["bgm"];
  sfx?: Storyboard["sfx"];
  narrationFile?: string;
  subtitles?: SubtitleCue[];
  scenes: TimelineScene[];
}
