// The map tool, step 2: the STATIC map of a set's worlds (sea, water-lines,
// graticule, land + rim, period water, period borders, coast) as tiled raster
// LOD pyramids. Heavy: run it alone (one bake at a time on this Mac).
//
//   bun scripts/maps/bake.mjs scripts/maps/configs/<set>.mjs [world ...] [--levels a0,a1] [--out <dir>]
//
// Writes <tileDir>/<world>-<level>-<col>-<row>.png (TILE + 2 PAD px, opaque RGB),
// <dataDir>/<name>Levels<World>.ts (the level grids) and <dataDir>/<name>Levels.ts
// (the index), and copies the house mottle + grain into <tileDir> when the config
// names `textures`. --levels bakes only those levels' tiles and writes no levels
// module (a test or a partial re-bake of unchanged grids). --out <dir> writes
// under <dir> instead of the repo root. See scripts/maps/README.md.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./lib/geo.mjs";
import { writeOut } from "./lib/data.mjs";
import { PALETTE, bakeWorld, indexLevelsTs, levelNames, placeholderLevelsTs, worldLevelsTs } from "./lib/raster.mjs";
import { loadConfig, makeWorld, outPathFn, parseArgs, pickWorlds } from "./lib/config.mjs";

const args = parseArgs(process.argv.slice(2), "usage: bun scripts/maps/bake.mjs <config.mjs> [world ...] [--levels a,b] [--out <dir>]");
const cfg = await loadConfig(args.configPath);
const outPath = outPathFn(args.out);
const generatedBy = `scripts/maps/bake.mjs ${cfg.rel}`;
const opt = {
  tile: cfg.tile,
  pad: cfg.pad,
  chunk: cfg.chunk,
  tileDir: cfg.tileDir,
  frame: cfg.frame,
  palette: { ...PALETTE, ...(cfg.palette ?? {}) },
  onlyLevels: args.levels,
  outPath,
};

mkdirSync(outPath(cfg.tileDir), { recursive: true });
if (cfg.textures)
  for (const f of ["mottle.png", "grain.png"]) copyFileSync(join(REPO, cfg.textures, f), outPath(`${cfg.tileDir}/${f}`));
const all = Object.keys(cfg.worlds);
for (const name of pickWorlds(cfg, args.worlds)) {
  const wc = cfg.worlds[name];
  const W = makeWorld(name, wc);
  const levels = await bakeWorld(W, wc.levels, opt);
  if (args.levels) continue;
  const rel = `${cfg.dataDir}/${levelNames(cfg.name, name).file}.ts`;
  writeOut(outPath(rel), worldLevelsTs(cfg.name, name, levels, opt, generatedBy));
  console.log(`Wrote ${outPath(rel)}`);
}
if (args.levels) console.log(`--levels: tiles only, no levels modules written`);
else {
  for (const name of all) {
    const rel = `${cfg.dataDir}/${levelNames(cfg.name, name).file}.ts`;
    if (!existsSync(outPath(rel))) writeOut(outPath(rel), placeholderLevelsTs(cfg.name, name, generatedBy));
  }
  const rel = `${cfg.dataDir}/${levelNames(cfg.name, all[0]).index}.ts`;
  writeOut(outPath(rel), indexLevelsTs(cfg.name, all, opt, generatedBy));
  console.log(`Wrote ${outPath(rel)}`);
}
