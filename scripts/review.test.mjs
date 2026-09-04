import process from "node:process";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs, sampleFrames } from "./review.mjs";

let dir;
let alpha;
let noAlpha;
const cli = resolve("scripts/review.mjs");
function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", ...args]);
  if (r.error || r.status !== 0)
    throw new Error(r.error?.message ?? r.stderr.toString());
  return r.stdout;
}
function invoke(args, env = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env, KISE_TRANSPARENT: "0", ...env },
  });
}
function redPixel(file, x, y) {
  return ffmpeg([
    "-i",
    file,
    "-vf",
    `format=rgb24,crop=1:1:${x}:${y}`,
    "-frames:v",
    "1",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgb24",
    "pipe:1",
  ])[0];
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "kise-review-test-"));
  alpha = join(dir, "alpha master.mov");
  noAlpha = join(dir, "opaque.mkv");
  // Increasing red per frame makes ordering and endpoint extraction observable.
  ffmpeg([
    "-f",
    "lavfi",
    "-i",
    "nullsrc=s=96x160:r=12,format=rgba,geq=r='N*20':g=0:b=0:a=128",
    "-frames:v",
    "12",
    "-c:v",
    "prores_ks",
    "-profile:v",
    "4",
    "-pix_fmt",
    "yuva444p10le",
    alpha,
  ]);
  // Matroska has no nb_frames; the audio extends past the six video frames.
  ffmpeg([
    "-f",
    "lavfi",
    "-i",
    "color=c=blue:s=96x160:r=12:d=0.5",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=1",
    "-c:v",
    "ffv1",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "pcm_s16le",
    noAlpha,
  ]);
});
afterAll(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
});

test("beat sampling retains endpoints and adjacent frames, deduplicating at boundaries", () => {
  expect(sampleFrames(12, 3, [0, 5, 11])).toEqual([0, 1, 4, 5, 6, 10, 11]);
  expect(sampleFrames(1, 9, [0])).toEqual([0]);
  expect(() => sampleFrames(12, 9, [12])).toThrow("outside source range");
});

test("bad CLI arguments fail instead of silently producing a different review", () => {
  for (const args of [
    ["--frames", "0"],
    ["--frames", "2.5"],
    ["--frames"],
    ["--at", "2,-1"],
    ["--at", "2,"],
    ["--background", "red;movie=private"],
    ["--unknown", "1"],
  ]) {
    expect(() => parseArgs(["a.mov", ...args])).toThrow();
  }
  expect(
    parseArgs(["--video", "a.mov", "--preview", "--at", "2,5"]).at,
  ).toEqual([2, 5]);
});

test("alpha review creates ordered samples and playback without deleting neighbouring work", async () => {
  const sentinel = join(dir, "keep.txt");
  await writeFile(sentinel, "unrelated work");
  const result = invoke(
    [
      alpha,
      "--out-dir",
      dir,
      "--frames",
      "3",
      "--at",
      "5",
      "--background",
      "dark",
      "--preview",
    ],
    { KISE_TRANSPARENT: "1" },
  );
  expect(result.status, result.stderr).toBe(0);
  const report = JSON.parse(
    await readFile(join(dir, "alpha master-review.json"), "utf8"),
  );
  expect(report.sampledFrames).toEqual([0, 4, 5, 6, 11]);
  expect(report.hasAlphaChannel).toBe(true);
  expect(report.totalFrames).toBe(12);
  expect(await readFile(sentinel, "utf8")).toBe("unrelated work");
  expect(existsSync(alpha)).toBe(true);
  expect(existsSync(report.preview)).toBe(true);
  // Last sample occupies row 2, column 2. Probe away from possible labels.
  expect(
    redPixel(report.contactSheet, 8 + 368 + 180, 8 + 608 + 300),
  ).toBeGreaterThan(redPixel(report.contactSheet, 188, 308) + 70);
  const probe = JSON.parse(
    spawnSync(
      "ffprobe",
      ["-v", "error", "-show_streams", "-of", "json", report.preview],
      { encoding: "utf8" },
    ).stdout,
  );
  expect(probe.streams[0].codec_name).toBe("h264");
  expect(Number(probe.streams[0].nb_frames)).toBe(12);
}, 30000);

test("light backing changes visible transparency and a custom sheet path works", async () => {
  const output = join(dir, "light");
  const sheet = join(dir, "custom", "sheet.jpg");
  const result = invoke([
    alpha,
    "--out-dir",
    output,
    "--sheet",
    sheet,
    "--frames",
    "2",
    "--background",
    "light",
  ]);
  expect(result.status, result.stderr).toBe(0);
  // f0 is half-transparent black, so light backing should be plainly visible.
  expect(redPixel(sheet, 188, 308)).toBeGreaterThan(100);
}, 30000);

test("missing frame metadata uses decoded count, not the longer audio duration", async () => {
  const output = join(dir, "counted");
  const result = invoke([
    noAlpha,
    "--out-dir",
    output,
    "--frames",
    "2",
    "--preview",
  ]);
  expect(result.status, result.stderr).toBe(0);
  const report = JSON.parse(
    await readFile(join(output, "opaque-review.json"), "utf8"),
  );
  expect(report.totalFrames).toBe(6);
  expect(report.sampledFrames).toEqual([0, 5]);
  expect(report.hasAlphaChannel).toBe(false);
  const probe = JSON.parse(
    spawnSync(
      "ffprobe",
      ["-v", "error", "-show_streams", "-of", "json", report.preview],
      { encoding: "utf8" },
    ).stdout,
  );
  expect(probe.streams.some((s) => s.codec_type === "audio")).toBe(true);
  expect(
    Number(probe.streams.find((s) => s.codec_type === "video").nb_frames),
  ).toBe(6);
}, 30000);

test("required alpha, out-of-range beats, and source-overwriting paths fail clearly", () => {
  const before = ffmpeg([
    "-i",
    alpha,
    "-frames:v",
    "1",
    "-f",
    "md5",
    "pipe:1",
  ]).toString();
  expect(invoke([noAlpha], { KISE_TRANSPARENT: "1" }).stderr).toContain(
    "no alpha channel",
  );
  expect(invoke([alpha, "--at", "99"]).stderr).toContain(
    "outside source range",
  );
  expect(invoke([alpha, "--sheet", alpha]).stderr).toContain(
    "must not overwrite",
  );
  const after = ffmpeg([
    "-i",
    alpha,
    "-frames:v",
    "1",
    "-f",
    "md5",
    "pipe:1",
  ]).toString();
  expect(after).toBe(before);
});
