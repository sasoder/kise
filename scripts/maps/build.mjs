// The map tool, step 1: the VECTOR data of a map set's worlds, as flat TS modules
// the cuts import (projection, regions clipped to land with their inland edges,
// places, routes, suggested framings). Light; seconds to a minute.
//
//   bun scripts/maps/build.mjs scripts/maps/configs/<set>.mjs [world ...] [--out <dir>]
//
// Writes <dataDir>/<world.data.file> for each world (all worlds when none is named).
// --out <dir> writes under <dir> instead of the repo root (same relative paths), for tests.
// See scripts/maps/README.md.

import { checkProjection } from "./lib/projection.mjs";
import { coastIndex, landOf } from "./lib/geo.mjs";
import { buildContext, dataModule, writeOut } from "./lib/data.mjs";
import { loadConfig, makeWorld, outPathFn, parseArgs, pickWorlds } from "./lib/config.mjs";

const args = parseArgs(process.argv.slice(2), "usage: bun scripts/maps/build.mjs <config.mjs> [world ...] [--out <dir>]");
const cfg = await loadConfig(args.configPath);
const outPath = outPathFn(args.out);
const generatedBy = `scripts/maps/build.mjs ${cfg.rel}`;

for (const name of pickWorlds(cfg, args.worlds)) {
  const wc = cfg.worlds[name];
  if (!wc.data) {
    console.log(`${name}: no data module in the config, skipped`);
    continue;
  }
  const W = makeWorld(name, wc);
  checkProjection(W);
  const t0 = Date.now();
  const land = landOf(W);
  const coast = coastIndex(land);
  console.log(`${name}: ${land.length} land polygons, coast index ${Date.now() - t0} ms`);
  const R = wc.regions ? wc.regions(W) : {};
  console.log(`${name}: regions ${Date.now() - t0} ms`);
  const c = buildContext(W, R, land, coast, cfg.frame);
  const text = dataModule(W, wc.data, c, generatedBy);
  const rel = `${cfg.dataDir}/${wc.data.file}`;
  writeOut(outPath(rel), text);
  console.log(`Wrote ${outPath(rel)} (${(text.length / 1024).toFixed(0)} KB) in ${Date.now() - t0} ms`);
}
