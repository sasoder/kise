#!/usr/bin/env bun
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const composition = args.get("--composition") ?? "TimelinePreview";
const video = args.get("--video") ?? join("out", `${composition}.mov`);
const reviewDir = args.get("--review-dir") ?? join("out", "review", composition);
const reportPath = args.get("--report") ?? join(reviewDir, `${composition}-review.json`);

const exists = async (path) => {
  try {
    return await stat(path);
  } catch {
    return null;
  }
};

const runJson = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
};

await mkdir(reviewDir, { recursive: true });

const videoStat = await exists(video);
const reviewFiles = await readdir(reviewDir).catch(() => []);
const stills = reviewFiles.filter((file) => /^frame-\d+\.png$/.test(file));
const contactSheet = reviewFiles.find((file) => file.endsWith("-contact-sheet.jpg"));

const probe = videoStat
  ? runJson("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_streams",
      "-show_format",
      video,
    ])
  : null;

const videoStream = probe?.streams?.find((stream) => stream.codec_type === "video");
const durationSeconds = Number.parseFloat(probe?.format?.duration ?? "0");
const width = videoStream?.width ?? null;
const height = videoStream?.height ?? null;
const pixFmt = videoStream?.pix_fmt ?? null;

const checks = [
  {
    id: "render-exists",
    passed: Boolean(videoStat),
    detail: videoStat ? `${videoStat.size} bytes` : `Missing ${video}`,
  },
  {
    id: "expected-square-format",
    passed: width === 1080 && height === 1080,
    detail: width && height ? `${width}x${height}` : "No video dimensions found",
  },
  {
    id: "alpha-capable-pixel-format",
    passed: typeof pixFmt === "string" && pixFmt.includes("yuva"),
    detail: pixFmt ?? "No pixel format found",
  },
  {
    id: "duration-close-to-six-seconds",
    passed: durationSeconds >= 5.8 && durationSeconds <= 6.2,
    detail: durationSeconds ? `${durationSeconds.toFixed(3)}s` : "No duration found",
  },
  {
    id: "sampled-stills-exist",
    passed: stills.length >= 6,
    detail: `${stills.length} sampled stills`,
  },
  {
    id: "contact-sheet-exists",
    passed: Boolean(contactSheet),
    detail: contactSheet ?? "No contact sheet found",
  },
];

const report = {
  composition,
  video,
  reviewDir,
  generatedAt: new Date().toISOString(),
  summary: {
    passed: checks.every((check) => check.passed),
    failedChecks: checks.filter((check) => !check.passed).map((check) => check.id),
  },
  media: {
    width,
    height,
    durationSeconds,
    pixelFormat: pixFmt,
  },
  artifacts: {
    stills: stills.map((file) => join(reviewDir, file)),
    contactSheet: contactSheet ? join(reviewDir, contactSheet) : null,
  },
  checks,
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
