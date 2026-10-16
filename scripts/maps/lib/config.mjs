// The map tool's config loading and CLI plumbing (build.mjs, bake.mjs).
//
// A config (scripts/maps/configs/<set>.mjs) default-exports:
//   name       "pearl": tile prefix and levels names (pearlLevels.ts, PearlLevel, PEARL_LEVELS_ASIA)
//   dataDir    where the TS modules go (the clip folder, generated/components/<clip>)
//   tileDir    where the tiles go (public/<set>)
//   textures   optional: a folder whose mottle.png + grain.png are copied into tileDir
//   frame      [1080, 1920] (default; [2048, 1080] for a 16:9 trailer)
//   palette    optional overrides of lib/raster.mjs PALETTE
//   tile, pad, chunk   1024, 2, 4 (defaults)
//   worlds     { <world>: {
//       projection   see lib/projection.mjs
//       clip         { lon, lat }: geometry is clipped to it (wider than any level)
//       lon360       true when the world straddles 180 (rings west of 100 W move to 260..360)
//       landStep     world px between kept land vertices (0.05-0.1)
//       regionStep   the same for region rings (0.12-0.2)
//       graticule    degrees (5 regional, 10 ocean); 0 = none
//       deep         [{ lon, lat, step }]: land kept finer there (deep zoom)
//       borders      { pairs: [["Russia", "China"], ...], extra: (W) => world px lines }
//       lakes        [[lon, lat]...] rings of period water (Lake Texcoco 1519)
//       regions      (W) => { name: MultiPolygon, ... } (build only; lib/geo.mjs helpers)
//       data         { file, comment, types, exports } (lib/data.mjs)
//       levels       [{ name, s, kBake, band, rects }] (lib/raster.mjs)
//   } }

import { relative, resolve, join, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { makeProjection } from "./projection.mjs";
import { REPO } from "./geo.mjs";

/** argv -> { config, worlds, out, levels } (positional: config path, then world names) */
export const parseArgs = (argv, usage) => {
  const a = { pos: [], out: null, levels: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") a.out = argv[++i];
    else if (argv[i].startsWith("--out=")) a.out = argv[i].slice(6);
    else if (argv[i] === "--levels") a.levels = argv[++i];
    else if (argv[i].startsWith("--levels=")) a.levels = argv[i].slice(9);
    else if (argv[i] === "-h" || argv[i] === "--help") {
      console.log(usage);
      process.exit(0);
    } else a.pos.push(argv[i]);
  }
  if (!a.pos.length) {
    console.error(usage);
    process.exit(1);
  }
  if (a.out === "") throw new Error("--out needs a directory");
  return { configPath: a.pos[0], worlds: a.pos.slice(1), out: a.out ? resolve(a.out) : null, levels: a.levels ? new Set(a.levels.split(",")) : null };
};

export const loadConfig = async (configPath) => {
  const abs = resolve(configPath);
  const cfg = (await import(pathToFileURL(abs).href)).default;
  if (!cfg?.name || !cfg?.worlds) throw new Error(`${configPath}: default-export { name, dataDir, tileDir, worlds }`);
  return {
    frame: [1080, 1920],
    tile: 1024,
    pad: 2,
    chunk: 4,
    ...cfg,
    rel: relative(REPO, abs),
  };
};

/** a repo-relative output path -> where it is written (under --out when given) */
export const outPathFn = (out) => (rel) => (isAbsolute(rel) ? rel : join(out ?? REPO, rel));

/** the world object the lib works on */
export const makeWorld = (name, wc) => {
  const { proj, params } = makeProjection(wc.projection);
  return {
    name,
    proj,
    params,
    tsDoc: wc.projection.tsDoc,
    res: wc.naturalEarth ?? "10m",
    clip: wc.clip,
    lon360: !!wc.lon360,
    landStep: wc.landStep ?? 0.07,
    regionStep: wc.regionStep ?? 0.2,
    graticule: wc.graticule ?? 5,
    deep: wc.deep ?? [],
    skipSouthOf: wc.skipSouthOf ?? -55,
    borders: wc.borders ?? null,
    lakes: wc.lakes ?? [],
    cfg: wc,
  };
};

export const pickWorlds = (cfg, names) => {
  const all = Object.keys(cfg.worlds);
  for (const n of names) if (!all.includes(n)) throw new Error(`no world "${n}" in ${cfg.rel} (has ${all.join(", ")})`);
  return names.length ? all.filter((n) => names.includes(n)) : all;
};
