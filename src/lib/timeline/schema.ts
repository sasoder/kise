import { z } from "zod";

export const easingSchema = z.enum(["linear", "easeInOut", "spring"]);

export const formatSchema = z.object({
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1080),
  fps: z.number().int().positive().default(30),
  durationInFrames: z.number().int().positive().default(180),
  transparent: z.boolean().default(true),
});

export const beatSchema = z.object({
  id: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  intent: z.string(),
});

export const stylePlanSchema = z.object({
  palette: z.array(z.string()).default([]),
  fonts: z.array(z.string()).default([]),
  motion: z.string().default("crisp spring motion with clean resolves"),
  density: z.enum(["minimal", "balanced", "dense"]).default("balanced"),
});

export const reviewCheckSchema = z.enum([
  "transparent-background",
  "safe-margins",
  "text-legibility",
  "contrast",
  "no-empty-frames",
  "resolved-final-frame",
]);

export const baseTrackSchema = z.object({
  id: z.string(),
  start: z.number().int().nonnegative(),
  duration: z.number().int().positive(),
  easing: easingSchema.default("spring"),
});

export const textTrackSchema = baseTrackSchema.extend({
  type: z.literal("text"),
  text: z.string(),
  x: z.number().default(540),
  y: z.number().default(540),
  width: z.number().positive().default(860),
  fontSize: z.number().positive().default(96),
  fontFamily: z.string().default("Inter"),
  fontWeight: z.number().int().positive().default(800),
  color: z.string().default("#ffffff"),
  align: z.enum(["left", "center", "right"]).default("center"),
  preset: z.enum(["fade-up", "slam", "mask-reveal", "ticker"]).default("fade-up"),
});

export const shapeTrackSchema = baseTrackSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "circle", "line"]).default("rect"),
  x: z.number().default(540),
  y: z.number().default(540),
  width: z.number().positive().default(240),
  height: z.number().positive().default(240),
  radius: z.number().nonnegative().default(8),
  color: z.string().default("#ffffff"),
  opacity: z.number().min(0).max(1).default(1),
  preset: z.enum(["scale-in", "wipe", "pulse", "drift"]).default("scale-in"),
});

export const imageTrackSchema = baseTrackSchema.extend({
  type: z.literal("image"),
  src: z.string(),
  x: z.number().default(540),
  y: z.number().default(540),
  width: z.number().positive().default(640),
  height: z.number().positive().default(640),
  fit: z.enum(["contain", "cover"]).default("contain"),
  preset: z.enum(["fade", "parallax", "pop"]).default("fade"),
});

export const videoTrackSchema = baseTrackSchema.extend({
  type: z.literal("video"),
  src: z.string(),
  x: z.number().default(540),
  y: z.number().default(540),
  width: z.number().positive().default(1080),
  height: z.number().positive().default(1080),
  fit: z.enum(["contain", "cover"]).default("cover"),
  muted: z.boolean().default(true),
  preset: z.enum(["fade", "plate"]).default("plate"),
});

export const trackSchema = z.discriminatedUnion("type", [
  textTrackSchema,
  shapeTrackSchema,
  imageTrackSchema,
  videoTrackSchema,
]);

export const motionPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  concept: z.string(),
  format: formatSchema.default({
    width: 1080,
    height: 1080,
    fps: 30,
    durationInFrames: 180,
    transparent: true,
  }),
  style: stylePlanSchema.default({
    palette: [],
    fonts: [],
    motion: "crisp spring motion with clean resolves",
    density: "balanced",
  }),
  beats: z.array(beatSchema).default([]),
  tracks: z.array(trackSchema),
  reviewChecks: z.array(reviewCheckSchema).default([
    "transparent-background",
    "safe-margins",
    "text-legibility",
    "contrast",
    "no-empty-frames",
    "resolved-final-frame",
  ]),
});

export type Easing = z.infer<typeof easingSchema>;
export type MotionPlan = z.infer<typeof motionPlanSchema>;
export type TimelineTrack = z.infer<typeof trackSchema>;
export type TextTrack = z.infer<typeof textTrackSchema>;
export type ShapeTrack = z.infer<typeof shapeTrackSchema>;
export type ImageTrack = z.infer<typeof imageTrackSchema>;
export type VideoTrack = z.infer<typeof videoTrackSchema>;
