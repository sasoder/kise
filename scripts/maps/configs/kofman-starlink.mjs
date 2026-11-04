// Map config: kofman-starlink (ChinaTalk, Michael Kofman "Russia is doing really badly this year").
// One LCC world fitted to Ukraine, for cut 33 TerminalsAcrossUkraine. BUILD ONLY, no bake: the ChinaTalk page is the
// newsprint stage, so the cut draws the outline and the occupied hatch as vectors and there are no tiles.
//   bun scripts/maps/build.mjs scripts/maps/configs/kofman-starlink.mjs
//
// Ukraine: Natural Earth 10m (world-atlas) "Ukraine". This Natural Earth build puts Crimea under "Russia", so the
// Crimea polygon is taken from Natural Earth's "Russia" feature (picked by its lon/lat box) and unioned in: the
// internationally recognised border, with the same Natural Earth coast as the mainland (the Perekop join is exact).
// Occupied: DeepStateMap, 3 Nov 2026 (assets-src/kofman-starlink/deepstate_occupied_20261103.geojson, 28 polygons:
// occupied areas, ORDLO, Crimea, Tuzla), unioned, clipped to the outline, slivers dropped.
// Terminals: a jittered, relaxed dot field over free Ukraine (outline minus occupied), the Dwarkesh crowd grain
// (FiniteJobs' relaxation), kept clear of the border line and the front.
import { countryMP, featureMP, inter, loadFeatures, union, clean, ringArea } from "../lib/geo.mjs";
import { mpD, mpBox } from "../lib/data.mjs";

const OCC = loadFeatures("assets-src/kofman-starlink/deepstate_occupied_20261103.geojson");
const crimeaPick = (b) => b.x0 > 32 && b.x1 < 37 && b.y0 > 44 && b.y1 < 46.5;

// --- the terminal field --------------------------------------------------------------------------------------------
/** mean dot radius, world px (= screen px at the resolved view, k 1) */
const DOT_R = 4.6;
/** jittered-grid pitch (world px) before relaxation; ~40 % cover at DOT_R */
const PITCH = 12.3;
const JITTER = 0.9;
const RELAX_GAP = 1.06;
const RELAX_ITERS = 40;
/** clear of the border line's centre (half the LINE weight at k 1 plus paper) and of the front */
const BORDER_CLEAR = 3 + 2.5;
const FRONT_CLEAR = 2.5;

const hash = (i, k) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const r2 = (v) => Math.round(v * 100) / 100;
const ringsOf = (mp) => mp.flatMap((poly) => poly);
const inside = (rings, x, y) => {
  let c = false;
  for (const r of rings)
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [ax, ay] = r[i];
      const [bx, by] = r[j];
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
    }
  return c;
};
const segDist = (x, y, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2));
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
};
/** a bucketed edge index: distance from (x, y) to the nearest edge of the rings (capped at `max`) */
const edgeIndex = (rings, B = 16) => {
  const grid = new Map();
  const key = (i, j) => i * 100003 + j;
  for (const r of rings)
    for (let i = 0; i < r.length; i++) {
      const a = r[i];
      const b = r[(i + 1) % r.length];
      const i0 = Math.floor(Math.min(a[0], b[0]) / B);
      const i1 = Math.floor(Math.max(a[0], b[0]) / B);
      const j0 = Math.floor(Math.min(a[1], b[1]) / B);
      const j1 = Math.floor(Math.max(a[1], b[1]) / B);
      for (let p = i0; p <= i1; p++)
        for (let q = j0; q <= j1; q++) {
          const kk = key(p, q);
          if (!grid.has(kk)) grid.set(kk, []);
          grid.get(kk).push([a, b]);
        }
    }
  return (x, y) => {
    let best = Infinity;
    const i0 = Math.floor(x / B);
    const j0 = Math.floor(y / B);
    for (let p = i0 - 1; p <= i0 + 1; p++) for (let q = j0 - 1; q <= j0 + 1; q++) for (const [a, b] of grid.get(key(p, q)) ?? []) best = Math.min(best, segDist(x, y, a, b));
    return best;
  };
};

const terminalField = (ukr, occ) => {
  const uR = ringsOf(ukr);
  const oR = ringsOf(occ);
  const uD = edgeIndex(uR);
  const oD = edgeIndex(oR);
  const [x0, y0, x1, y1] = mpBox(ukr);
  const ok = (p) => {
    const rr = DOT_R * p.r;
    return inside(uR, p.x, p.y) && !inside(oR, p.x, p.y) && uD(p.x, p.y) > rr + BORDER_CLEAR && oD(p.x, p.y) > rr + FRONT_CLEAR;
  };
  const raw = [];
  const cols = Math.ceil((x1 - x0) / PITCH) + 1;
  const rows = Math.ceil((y1 - y0) / PITCH) + 1;
  for (let gr = 0; gr < rows; gr++)
    for (let gc = 0; gc < cols; gc++) {
      const i = gr * cols + gc;
      const p = { x: x0 + gc * PITCH + (hash(i, 11) - 0.5) * PITCH * JITTER, y: y0 + gr * PITCH + (hash(i, 12) - 0.5) * PITCH * JITTER, r: 0.75 + 0.5 * hash(i, 13), h: hash(i, 9) };
      if (ok(p)) raw.push(p);
    }
  // the relaxation (FiniteJobs): part any two that overlap until they just touch; a dot pushed out of free Ukraine
  // goes back to where it was
  const CS = 2 * DOT_R * 1.25 * RELAX_GAP + 2;
  const GW = Math.ceil((x1 - x0 + 400) / CS);
  const cellOf = (p) => Math.floor((p.x - x0 + 200) / CS) + GW * Math.floor((p.y - y0 + 200) / CS);
  for (let it = 0; it < RELAX_ITERS; it++) {
    const cells = new Map();
    raw.forEach((p, i) => {
      const c = cellOf(p);
      if (!cells.has(c)) cells.set(c, []);
      cells.get(c).push(i);
    });
    let moved = 0;
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i];
      const c = cellOf(a);
      for (let oy = -1; oy <= 1; oy++)
        for (let ox = -1; ox <= 1; ox++)
          for (const j of cells.get(c + ox + oy * GW) ?? []) {
            if (j <= i) continue;
            const b = raw[j];
            const want = DOT_R * (a.r + b.r) * RELAX_GAP;
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let d = Math.hypot(dx, dy);
            if (d >= want) continue;
            if (d < 1e-4) {
              const th = 2 * Math.PI * hash(i, 97 + (j % 7));
              dx = Math.cos(th);
              dy = Math.sin(th);
              d = 1;
            }
            const push = (want - d) / 2;
            const na = { ...a, x: a.x - (dx / d) * push, y: a.y - (dy / d) * push };
            const nb = { ...b, x: b.x + (dx / d) * push, y: b.y + (dy / d) * push };
            if (ok(na)) Object.assign(a, na);
            if (ok(nb)) Object.assign(b, nb);
            moved++;
          }
    }
    if (!moved) break;
  }
  // a dot that is still overlapping after the relaxation (pinned at a border) is dropped
  const out = [];
  const cells = new Map();
  raw.forEach((p) => {
    const c = cellOf(p);
    const near = [-1, 0, 1].flatMap((oy) => [-1, 0, 1].flatMap((ox) => cells.get(c + ox + oy * GW) ?? []));
    if (near.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < DOT_R * (q.r + p.r) * 0.98)) return;
    if (!cells.has(c)) cells.set(c, []);
    cells.get(c).push(p);
    out.push(p);
  });
  return out.map((p) => [r2(p.x), r2(p.y), Math.round(p.r * 1000) / 1000, Math.round(p.h * 1000) / 1000]);
};

const areaOf = (mp) => mp.reduce((s, poly) => s + Math.abs(ringArea(poly[0])) - poly.slice(1).reduce((t, h) => t + Math.abs(ringArea(h)), 0), 0);

export default {
  name: "kofmanStarlink",
  dataDir: "generated/components/kofman-starlink",
  tileDir: "public/kofman-starlink", // unused: build only, never baked
  worlds: {
    ukraine: {
      // centre meridian 31.3 E; the scale puts Ukraine's west tip (22.14 E) and east tip (40.23 E) ~960 px apart
      projection: { kind: "lcc", parallels: [45.5, 51], rotate: -31.3, scale: { span: [[22.14, 48.3], [40.23, 49.4]], px: 958 }, anchor: [[31.3, 48.6], [552, 684]] },
      clip: { lon: [14, 48], lat: [41, 56] },
      landStep: 0.3,
      regionStep: 0.35,
      graticule: 0,
      borders: { pairs: [] },
      regions: (W) => {
        const mainland = countryMP(W, "Ukraine", W.regionStep);
        const crimea = countryMP(W, "Russia", W.regionStep, crimeaPick);
        if (crimea.length !== 1) throw new Error(`expected one Crimea polygon in NE Russia, got ${crimea.length}`);
        const ukraine = clean(union(mainland, crimea), 30);
        const occRaw = union(...OCC.map((f) => featureMP(W, f, W.regionStep)));
        const occupied = clean(inter(occRaw, ukraine), 30);
        return { ukraine, occupied };
      },
      data: {
        file: "ukraineMapData.ts",
        comment:
          "Ukraine in the internationally recognised border (Natural Earth 10m; Crimea unioned in from NE's \"Russia\" feature),\n" +
          "the occupied territory as of 3 Nov 2026 (DeepStateMap, https://deepstatemap.live), and the terminal dots of\n" +
          "cut 33 TerminalsAcrossUkraine. World px == screen px at k 1 (the resolved full-country view).",
        types: ["P2", "LL", "Box", "export type Dot = [number, number, number, number];"],
        exports: [
          { name: "UKRAINE_D", doc: "the outline (Crimea included), SVG path d, world px", value: (c) => mpD(c.R.ukraine), type: ": string" },
          { name: "UKRAINE_BOX", doc: "the outline's box [x0, y0, x1, y1]", value: (c) => mpBox(c.R.ukraine), type: ": Box" },
          {
            name: "OCCUPIED",
            doc: "each occupied polygon's outer ring (world px), largest first; holes none of note",
            value: (c) =>
              c.R.occupied
                .map((poly) => poly[0].map(([x, y]) => [r2(x), r2(y)]))
                .sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a))),
            type: ": P2[][]",
          },
          { name: "OCCUPIED_D", doc: "the occupied territory, SVG path d (holes included)", value: (c) => mpD(c.R.occupied), type: ": string" },
          { name: "OCCUPIED_BOX", value: (c) => mpBox(c.R.occupied), type: ": Box" },
          {
            name: "AREAS",
            doc: "world px^2 of the outline, the occupied part and free Ukraine",
            value: (c) => {
              const u = areaOf(c.R.ukraine);
              const o = areaOf(c.R.occupied);
              return { ukraine: Math.round(u), occupied: Math.round(o), free: Math.round(u - o) };
            },
            type: ": { ukraine: number; occupied: number; free: number }",
          },
          { name: "DOT_R", value: DOT_R, doc: "mean terminal dot radius, world px", type: ": number" },
          { name: "PLACES", value: (c) => Object.fromEntries(Object.entries({ lviv: [24.03, 49.84], kyiv: [30.52, 50.45], uzhhorod: [22.29, 48.62], kharkiv: [36.23, 49.99], odesa: [30.73, 46.48] }).map(([k, ll]) => [k, c.P(ll).map(r2)])), type: ": Record<string, P2>" },
          {
            name: "DOTS",
            doc: "the terminals: [x, y, radius multiplier 0.75-1.25, hash 0..1], world px, free Ukraine only",
            value: (c) => terminalField(c.R.ukraine, c.R.occupied),
            type: ": Dot[]",
          },
        ],
      },
    },
  },
};
