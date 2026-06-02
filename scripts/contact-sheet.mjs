#!/usr/bin/env bun
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const composition = args.get("--composition") ?? "TimelinePreview";
const entry = args.get("--entry") ?? "src/index.ts";
const frames = (args.get("--frames") ?? "0,15,30,60,90,120,150,179")
  .split(",")
  .map((frame) => Number.parseInt(frame, 10))
  .filter((frame) => Number.isFinite(frame));
const outDir = args.get("--out-dir") ?? join("out", "review", composition);
const sheetPath = args.get("--sheet") ?? join(outDir, `${composition}-contact-sheet.jpg`);

const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed`);
  }
};

await mkdir(outDir, { recursive: true });

const stillPaths = [];
for (const frame of frames) {
  const stillPath = join(outDir, `frame-${String(frame).padStart(4, "0")}.png`);
  run("bunx", ["remotion", "still", entry, composition, stillPath, "--frame", String(frame)]);
  stillPaths.push(stillPath);
}

await mkdir(dirname(sheetPath), { recursive: true });

const ffmpegInput = join(outDir, "frame-%04d.png");
const tileColumns = Math.min(4, stillPaths.length);
const tileRows = Math.ceil(stillPaths.length / tileColumns);
run("ffmpeg", [
  "-y",
  "-framerate",
  "1",
  "-i",
  ffmpegInput,
  "-vf",
  `scale=270:-1,tile=${tileColumns}x${tileRows}`,
  "-frames:v",
  "1",
  "-update",
  "1",
  sheetPath,
]);

const sheetStat = await stat(sheetPath);
console.log(
  JSON.stringify(
    {
      composition,
      frames,
      stills: stillPaths,
      contactSheet: sheetPath,
      bytes: sheetStat.size,
    },
    null,
    2,
  ),
);
