import { z } from "zod";
import { STYLE_IDS } from "../styles/types";

export const AiImageAssetSchema = z.object({
  id: z.string().min(1),
  type: z.literal("ai-image"),
  filename: z.string().min(1),
  prompt: z.string().min(4),
  size: z.string().default("1280x720"),
  revise: z.boolean().default(false),
  skipStylePrefix: z.boolean().default(false),
});

export const WebCaptureAssetSchema = z.object({
  id: z.string().min(1),
  type: z.literal("web-capture"),
  filename: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().min(360).max(2560).default(1440),
  height: z.number().int().min(360).max(2560).default(900),
  waitMs: z.number().int().min(500).max(15000).default(3000),
  clip: z
    .object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      width: z.number().int().min(100),
      height: z.number().int().min(100),
    })
    .optional(),
});

export const AssetItemSchema = z.discriminatedUnion("type", [
  AiImageAssetSchema,
  WebCaptureAssetSchema,
]);

export const AssetsManifestSchema = z.object({
  style: z.enum(STYLE_IDS).default("dark-tech"),
  assets: z.array(AssetItemSchema).min(1),
});

export type AssetItem = z.infer<typeof AssetItemSchema>;
export type AssetsManifest = z.infer<typeof AssetsManifestSchema>;
