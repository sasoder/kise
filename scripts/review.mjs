#!/usr/bin/env bun
// Review decoded frames from the master, including exact beats and their neighbours.
// Optional H.264 playback copy uses the same backing as the contact sheet.
// See README.md for CLI examples. Requires ffmpeg and ffprobe.
import process from "node:process";
import console from "node:console";
import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const usage =
  "bun scripts/review.mjs <video> [--frames 9] [--at 24,60] " +
  "[--background checker|dark|light|#RRGGBB] [--preview] [--out-dir path] [--sheet path]";

export function parseArgs(raw) {
  const options = { frames: 9, at: [], background: "checker", preview: false };
  const values = new Set([
    "--video",
    "--frames",
    "--at",
    "--background",
    "--out-dir",
    "--sheet",
  ]);
  for (let i = 0; i < raw.length; i++) {
    const key = raw[i];
    if (key === "--help") return { help: true };
    if (key === "--preview") {
      options.preview = true;
      continue;
    }
    if (values.has(key)) {
      const value = raw[++i];
      if (!value || value.startsWith("--"))
        throw new Error(`Missing value for ${key}.`);
      options[key.slice(2)] = value;
    } else if (key.startsWith("--")) {
      throw new Error(`Unknown option: ${key}`);
    } else if (!options.video) {
      options.video = key;
    } else {
      throw new Error(`Unexpected argument: ${key}`);
    }
  }
  if (!options.video) throw new Error(`Missing video. Usage: ${usage}`);
  options.frames = Number(options.frames);
  if (
    !Number.isInteger(options.frames) ||
    options.frames < 2 ||
    options.frames > 60
  ) {
    throw new Error("--frames must be an integer from 2 to 60.");
  }
  if (typeof options.at === "string") {
    if (!/^\d+(,\d+)*$/.test(options.at))
      throw new Error(
        "--at must be comma-separated, non-negative frame indices.",
      );
    options.at = options.at.split(",").map(Number);
  }
  if (
    options.at.length > 30 ||
    options.at.some((frame) => !Number.isSafeInteger(frame))
  ) {
    throw new Error("--at supports up to 30 safe integer frame indices.");
  }
  if (
    !["checker", "dark", "light"].includes(options.background) &&
    !/^#[\da-f]{6}$/i.test(options.background)
  ) {
    throw new Error("--background must be checker, dark, light, or #RRGGBB.");
  }
  return options;
}

export function sampleFrames(totalFrames, count, beats) {
  if (!Number.isSafeInteger(totalFrames) || totalFrames < 1)
    throw new Error("Cannot determine the video frame count.");
  const last = totalFrames - 1;
  if (beats.some((f) => f < 0 || f > last))
    throw new Error(`Beat frame outside source range 0–${last}.`);
  return [
    ...new Set([
      ...Array.from({ length: count }, (_, i) =>
        Math.round((i * last) / (count - 1)),
      ),
      ...beats.flatMap((f) => [Math.max(0, f - 1), f, Math.min(last, f + 1)]),
    ]),
  ].sort((a, b) => a - b);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (r.error || r.status !== 0)
    throw new Error(
      `${cmd} failed: ${r.error?.message ?? r.stderr ?? r.stdout}`,
    );
  return r.stdout;
}

function backdrop(background, width, height, fps) {
  const colour =
    { dark: "0x141414", light: "0xf2f2f2", checker: "0x9a9a9a" }[background] ??
    background.replace("#", "0x");
  const base = `color=c=${colour}:s=${width}x${height}:r=${fps}`;
  return background === "checker"
    ? base +
        ",geq=lum='if(mod(floor(X/48)+floor(Y/48)\\,2)\\,200\\,150)':cb=128:cr=128"
    : base;
}

export async function review(options) {
  const video = await realpath(options.video);
  const name = basename(video, extname(video));
  const outDir = resolve(options["out-dir"] ?? join("out", "review", name));
  const sheetPath = resolve(
    options.sheet ?? join(outDir, `${name}-contact-sheet.jpg`),
  );
  const previewPath = join(outDir, `${name}-preview.mp4`);
  const reportPath = join(outDir, `${name}-review.json`);
  const outputs = [
    sheetPath,
    reportPath,
    ...(options.preview ? [previewPath] : []),
  ];
  const identities = await Promise.all(
    outputs.map(async (p) => (existsSync(p) ? realpath(p) : resolve(p))),
  );
  if (
    identities.includes(video) ||
    new Set(identities).size !== identities.length
  ) {
    throw new Error(
      "Review output paths must be distinct and must not overwrite the source video.",
    );
  }

  const probe = JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      video,
    ]),
  );
  const stream = probe.streams?.find((s) => s.codec_type === "video");
  if (!stream) throw new Error("Source has no video stream.");
  const { width, height, pix_fmt: pixelFormat } = stream;
  const rate = (value) => {
    const [n, d] = (value ?? "0/0").split("/").map(Number);
    return d ? n / d : 0;
  };
  const fps = rate(stream.avg_frame_rate) || rate(stream.r_frame_rate);
  if (!(fps > 0) || !Number.isFinite(fps) || !(width > 0) || !(height > 0)) {
    throw new Error("Source has invalid dimensions or frame rate.");
  }
  // Container duration can include a longer audio track. Count decoded video frames
  // when stream metadata has no count instead of guessing from that duration.
  let totalFrames = Number(stream.nb_frames);
  if (!Number.isSafeInteger(totalFrames) || totalFrames < 1) {
    const counted = JSON.parse(
      run("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-count_frames",
        "-show_entries",
        "stream=nb_read_frames",
        "-of",
        "json",
        video,
      ]),
    );
    totalFrames = Number(counted.streams?.[0]?.nb_read_frames);
  }
  const indices = sampleFrames(totalFrames, options.frames, options.at);
  const duration = Number(stream.duration) || totalFrames / fps;
  const hasAlpha = /^(yuva|rgba|argb|bgra|abgr|ya|gbrap|ayuv|vuya)/.test(
    pixelFormat ?? "",
  );
  if (process.env.KISE_TRANSPARENT === "1" && !hasAlpha) {
    throw new Error(
      `Transparent render has no alpha channel (pixel format: ${pixelFormat}).`,
    );
  }

  const font = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ].find(existsSync);
  const canLabel = Boolean(
    font && run("ffmpeg", ["-hide_banner", "-filters"]).includes(" drawtext "),
  );
  await mkdir(outDir, { recursive: true });
  await mkdir(dirname(sheetPath), { recursive: true });
  // Only remove scratch files we own; --out-dir can contain a master or other work.
  const scratch = await mkdtemp(join(outDir, ".review-"));
  const cellWidth = 360;
  const cellHeight = Math.max(
    2,
    Math.round((height * cellWidth) / width / 2) * 2,
  );
  const bg = backdrop(options.background, cellWidth, cellHeight, fps);
  try {
    // Decode once, then select exact frame numbers. Preserve source timestamps until
    // after selection and disable output duplication/dropping for sparse samples.
    const selection = indices.map((f) => `eq(n\\,${f})`).join("+");
    run("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      video,
      "-map",
      "0:v:0",
      "-an",
      "-vf",
      `select='${selection}',scale=${cellWidth}:${cellHeight},format=rgba`,
      "-fps_mode",
      "passthrough",
      "-start_number",
      "0",
      join(scratch, "raw-%03d.png"),
    ]);
    for (let i = 0; i < indices.length; i++) {
      const suffix = `${String(i).padStart(3, "0")}.png`;
      const label = canLabel
        ? `,drawtext=fontfile=${font}:text='f${indices[i]}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=4`
        : "";
      run("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-i",
        join(scratch, `raw-${suffix}`),
        "-filter_complex",
        `${bg}[bg];[bg][0:v]overlay=shortest=1${label}[out]`,
        "-map",
        "[out]",
        "-frames:v",
        "1",
        join(scratch, `tile-${suffix}`),
      ]);
    }
    const cols = Math.min(5, Math.ceil(Math.sqrt(indices.length)));
    const rows = Math.ceil(indices.length / cols);
    run("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-framerate",
      "1",
      "-start_number",
      "0",
      "-i",
      join(scratch, "tile-%03d.png"),
      "-frames:v",
      "1",
      "-vf",
      `tile=${cols}x${rows}:padding=8:margin=8:color=0x1a1a1a`,
      "-q:v",
      "3",
      sheetPath,
    ]);
    if (options.preview) {
      // Even dimensions for yuv420p; cap the longest edge at 960, preserving aspect.
      const scale = Math.min(1, 960 / Math.max(width, height));
      const pw = Math.max(2, Math.round((width * scale) / 2) * 2);
      const ph = Math.max(2, Math.round((height * scale) / 2) * 2);
      run("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-i",
        video,
        "-filter_complex",
        `[0:v:0]scale=${pw}:${ph},setpts=PTS-STARTPTS[fg];` +
          `${backdrop(options.background, pw, ph, fps)}[bg];[bg][fg]overlay=shortest=1[out]`,
        "-map",
        "[out]",
        "-map",
        "0:a:0?",
        "-c:v",
        "libx264",
        "-crf",
        "20",
        "-preset",
        "fast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-af",
        "asetpts=PTS-STARTPTS",
        "-t",
        String(duration),
        "-movflags",
        "+faststart",
        previewPath,
      ]);
    }
    const report = {
      source: video,
      width,
      height,
      fps,
      totalFrames,
      duration,
      pixelFormat,
      hasAlphaChannel: hasAlpha,
      background: options.background,
      requestedBeats: options.at,
      sampledFrames: indices,
      layout: { cols, rows, labelled: canLabel },
      contactSheet: sheetPath,
      preview: options.preview ? previewPath : null,
      note: "Technical evidence only. Alpha-capable format does not prove visible transparency. Inspect composition and playback before creative approval.",
    };
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
    console.log(
      [
        `Contact sheet: ${sheetPath} (${Math.round((await stat(sheetPath)).size / 1024)} KB)`,
        ...(options.preview ? [`Preview:       ${previewPath}`] : []),
        `Report:        ${reportPath}`,
        `Source:        ${width}x${height}, ${fps}fps, ${totalFrames} frames, ${pixelFormat}`,
        `Backing:       ${options.background}`,
        `Sampled:       ${indices.map((f) => `f${f}`).join(", ")}`,
        `Layout:        ${cols}x${rows}, reading order; ${canLabel ? "labelled" : "labels unavailable, use sampled-frame map"}`,
        "Read the sheet for meaning, staging, edges and endpoints. Watch playback for rhythm, continuity and settling.",
      ].join("\n"),
    );
    return report;
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log(usage);
    else await review(options);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
