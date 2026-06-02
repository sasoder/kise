#!/usr/bin/env bun
// Build a contact sheet from a rendered video so the agent can SEE its output.
//
// - Pulls frames straight from the .mov (no re-rendering of stills).
// - Composites over a checkerboard so transparency is unmistakable — an empty
//   frame looks empty, not black.
// - Samples evenly across the timeline, always including the first and last
//   frame, with the frame number burned into each tile.
//
// Usage:
//   bun scripts/review.mjs out/<name>.mov [--frames 9]
//   bun scripts/review.mjs --video out/<name>.mov [--frames 9]
//
// Output: out/review/<name>/<name>-contact-sheet.jpg  (Read this image)

import { mkdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const argv = new Map();
const positional = [];
const raw = process.argv.slice(2);
for (let i = 0; i < raw.length; i += 1) {
  if (raw[i].startsWith("--")) {
    argv.set(raw[i], raw[i + 1]);
    i += 1;
  } else {
    positional.push(raw[i]);
  }
}

const video = argv.get("--video") ?? positional[0];
if (!video) {
  console.error("Missing video. Usage: bun scripts/review.mjs out/<name>.mov [--frames 9]");
  process.exit(1);
}
if (!existsSync(video)) {
  console.error(`Video not found: ${video}`);
  process.exit(1);
}

const count = Math.max(2, Number.parseInt(argv.get("--frames") ?? "9", 10) || 9);
const name = basename(video, extname(video));
const outDir = argv.get("--out-dir") ?? join("out", "review", name);
const sheetPath = argv.get("--sheet") ?? join(outDir, `${name}-contact-sheet.jpg`);

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed:\n${r.stderr || r.stdout}`);
  }
  return r.stdout;
};

// Burned-in frame labels need ffmpeg's drawtext (libfreetype) + a font file.
// Plenty of builds (incl. common Homebrew ones) ship without it — fall back to
// reading-order placement + a printed map so the script never hard-fails.
const FONT = [
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/Library/Fonts/Arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
].find((p) => existsSync(p));
const HAS_DRAWTEXT = spawnSync("ffmpeg", ["-hide_banner", "-filters"], {
  encoding: "utf8",
}).stdout?.includes(" drawtext ");
const canLabel = Boolean(FONT && HAS_DRAWTEXT);

// --- Probe the video --------------------------------------------------------
const probe = JSON.parse(
  run("ffprobe", [
    "-v", "quiet", "-print_format", "json",
    "-show_streams", "-show_format", video,
  ]),
);
const vstream = probe.streams.find((s) => s.codec_type === "video") ?? {};
const width = vstream.width ?? 1080;
const height = vstream.height ?? 1080;
const pixFmt = vstream.pix_fmt ?? "unknown";
const [fpsNum, fpsDen] = (vstream.r_frame_rate ?? "30/1").split("/").map(Number);
const fps = fpsDen ? fpsNum / fpsDen : 30;
const duration = Number.parseFloat(probe.format?.duration ?? "0");
const totalFrames =
  Number.parseInt(vstream.nb_frames, 10) || Math.max(1, Math.round(duration * fps));
const lastFrame = totalFrames - 1;
const hasAlpha = /^(yuva|rgba|argb|bgra|abgr|ya)/.test(pixFmt);

// Evenly spaced frame indices, always including first + last, deduped.
const indices = [
  ...new Set(
    Array.from({ length: count }, (_, i) =>
      Math.round((i * lastFrame) / (count - 1)),
    ),
  ),
].sort((a, b) => a - b);

// --- Extract + label each frame, flattened on a checkerboard ----------------
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const tilePaths = [];
indices.forEach((frame, i) => {
  const out = join(outDir, `tile-${String(i).padStart(3, "0")}.png`);
  // Checkerboard background so transparency reads as a pattern, not black.
  const checker =
    `color=c=0x9a9a9a:s=${width}x${height},` +
    `geq=lum='if(mod(floor(X/48)+floor(Y/48)\\,2)\\,200\\,150)':cb=128:cr=128`;
  const label = canLabel
    ? `,drawtext=fontfile=${FONT}:text='f${frame}':x=24:y=24:` +
      `fontsize=${Math.round(height / 22)}:fontcolor=white:` +
      `box=1:boxcolor=black@0.55:boxborderw=12`
    : "";
  run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", video,
    "-filter_complex",
    `[0:v]select='eq(n\\,${frame})',setpts=PTS-STARTPTS[fg];` +
      `${checker}[bg];` +
      `[bg][fg]overlay=shortest=1${label}[out]`,
    "-map", "[out]", "-frames:v", "1", out,
  ]);
  tilePaths.push(out);
});

// --- Tile into one sheet ----------------------------------------------------
const cols = Math.ceil(Math.sqrt(tilePaths.length));
const rows = Math.ceil(tilePaths.length / cols);
const cell = 360;
run("ffmpeg", [
  "-y", "-loglevel", "error",
  "-framerate", "1", "-i", join(outDir, "tile-%03d.png"),
  "-frames:v", "1",
  "-vf", `scale=${cell}:-1,tile=${cols}x${rows}:padding=8:margin=8:color=0x1a1a1a`,
  "-q:v", "3", sheetPath,
]);

// --- Report -----------------------------------------------------------------
const bytes = (await stat(sheetPath)).size;
const transparentBg = process.env.KISE_BG !== "opaque"; // default expectation
console.log(
  [
    `Contact sheet: ${sheetPath}  (${(bytes / 1024).toFixed(0)} KB)`,
    `Source:        ${video}`,
    `Format:        ${width}x${height}  ${duration.toFixed(2)}s  ${fps}fps  ${totalFrames} frames`,
    `Pixel format:  ${pixFmt}${hasAlpha ? "  (has alpha)" : transparentBg ? "  ⚠ NO alpha channel — transparency may be lost" : ""}`,
    `Sampled:       ${indices.map((f) => `f${f}`).join(", ")}`,
    canLabel
      ? "Layout:        frame number burned into each tile (top-left)."
      : `Layout:        ${cols}×${rows} grid, reading order (L→R, top→bottom): ` +
        indices.map((f) => `f${f}`).join(" · "),
    "",
    "→ Read the contact sheet image and check: empty/early-blank frames, content",
    "  clipped at edges, text legibility, safe margins, and a resolved final frame.",
  ].join("\n"),
);
