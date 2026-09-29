// Bakes the extra geography for PivotalNotDecisive on top of the Dwarkesh map
// style's Manchuria map (manchuriaMapData.ts, which is read-only and reused as
// is for land, coast, borders, graticule and the railway).
//
//   bun scripts/build-pivotal-map.mjs
//
// Writes generated/components/pivotalMapData.ts: every army dot's slot in world
// px (the same world as manchuriaMapData), all placed on LAND by a test against
// LAND_D (Natural Earth 10m land), plus the railway's land-safe lane widths.
//
// THE PROJECTION is copied from scripts/build-manchuria-map.mjs, unchanged:
// north-up Lambert conformal conic, parallels 35 / 50, centre meridian 125 E,
// scale from Manzhouli -> Vladivostok (x 170 -> 890), Port Arthur on y 1070.
// The script asserts that Port Arthur and Mukden land on the same pixels as
// CITIES in manchuriaMapData.ts before writing anything.
//
// ONE DOT = 3,000 MEN (figures in PivotalNotDecisive.tsx's header):
//   Port Arthur garrison at the surrender   ~24,000  ->  8 cream dots
//   Nogi's Third Army ring                  ~90,000  -> 30 orange dots
//   Shaho line, Russian                    ~210,000  -> 70 cream dots
//   Shaho line, Japanese                   ~170,000  -> 57 orange dots
//   + Third Army's 30 arriving behind the Japanese line (the arrival slots)

import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoConicConformal } from "d3-geo";
import { CITIES, LAND_D, RAIL_SOUTH_PTS } from "../generated/components/manchuriaMapData.ts";

const OUT = "generated/components/pivotalMapData.ts";

// -- the projection, exactly as build-manchuria-map.mjs -----------------------
const P_MANZHOULI = [117.43, 49.6];
const P_VLADIVOSTOK = [131.89, 43.12];
const P_PORT_ARTHUR = [121.26, 38.81];
const P_MUKDEN = [123.43, 41.8];
const projection = geoConicConformal().parallels([35, 50]).rotate([-125, 0]).center([0, 42]);
projection.scale(1).translate([0, 0]);
const u0 = projection(P_MANZHOULI);
const u1 = projection(P_VLADIVOSTOK);
projection.scale((890 - 170) / (u1[0] - u0[0]));
const a = projection(P_MANZHOULI);
const b = projection(P_PORT_ARTHUR);
projection.translate([170 - a[0], 1070 - b[1]]);

for (const [name, ll, ref] of [
  ["Port Arthur", P_PORT_ARTHUR, CITIES.portArthur],
  ["Mukden", P_MUKDEN, CITIES.mukden],
]) {
  const [x, y] = projection(ll);
  const err = Math.hypot(x - ref.x, y - ref.y);
  console.log(`${name.padEnd(12)} (${x.toFixed(2)}, ${y.toFixed(2)})  manchuriaMapData (${ref.x}, ${ref.y})  err ${err.toFixed(3)} px`);
  if (err > 0.02) throw new Error(`projection mismatch at ${name}`);
}

// -- land: LAND_D itself (already in world px) rasterised to a mask ----------
// 8 texels per world px over the region the armies use. Testing against the
// very path the component draws means "on land" is what the viewer sees.
const MASK = { x0: 240, y0: 690, x1: 560, y1: 1110, s: 8 };
const MW = (MASK.x1 - MASK.x0) * MASK.s;
const MH = (MASK.y1 - MASK.y0) * MASK.s;
const mask = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}" height="${MH}" viewBox="${MASK.x0} ${MASK.y0} ${MASK.x1 - MASK.x0} ${MASK.y1 - MASK.y0}"><rect x="${MASK.x0}" y="${MASK.y0}" width="${MASK.x1 - MASK.x0}" height="${MASK.y1 - MASK.y0}" fill="#000"/><path d="${LAND_D}" fill="#fff" fill-rule="evenodd"/></svg>`;
  const img = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 1 }).render();
  const px = img.pixels;
  const m = new Uint8Array(MW * MH);
  for (let i = 0; i < MW * MH; i++) m[i] = px[i * 4] > 127 ? 1 : 0;
  return m;
})();
const onLand = (x, y) => {
  const i = Math.floor((x - MASK.x0) * MASK.s);
  const j = Math.floor((y - MASK.y0) * MASK.s);
  if (i < 0 || j < 0 || i >= MW || j >= MH) throw new Error(`land test outside the mask at ${x}, ${y}`);
  return mask[j * MW + i] === 1;
};
/** a whole dot (centre + 8 rim points at radius r) on land */
const diskOnLand = (x, y, r) => {
  if (!onLand(x, y)) return false;
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2;
    if (!onLand(x + r * Math.cos(t), y + r * Math.sin(t))) return false;
  }
  return true;
};

// -- sizes, shared with the component --------------------------------------
// K_CLOSE is the Port Arthur close-up, K_FRONT the Shaho framing. The dot's
// screen diameter scales as k^0.35 between them: DOT_CLOSE px at K_CLOSE.
export const K_CLOSE = 13.5;
export const K_FRONT = 13;
export const DOT_CLOSE = 17; // screen px diameter at K_CLOSE
const dotAt = (k) => DOT_CLOSE * Math.pow(k / K_CLOSE, 0.35);
// Organic crowds: Poisson spacing in screen px at each framing.
const PITCH_GARRISON = 19.5; // packed round the fortress, at K_CLOSE
const PITCH_TIP = 20.5; // the crescent, at K_CLOSE
const PITCH_FRONT = 25.7; // the Shaho bands, at K_FRONT: 1.4 dots + 2.2 px of breathing

// -- a seeded Poisson disc (Bridson) -----------------------------------------
const mulberry = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const poisson = (x0, y0, x1, y1, r, accept, seed) => {
  const rnd = mulberry(seed);
  const cell = r / Math.SQRT2;
  const gw = Math.ceil((x1 - x0) / cell);
  const gh = Math.ceil((y1 - y0) / cell);
  const grid = new Array(gw * gh).fill(-1);
  const pts = [];
  const active = [];
  const put = (p) => {
    pts.push(p);
    active.push(pts.length - 1);
    grid[Math.floor((p[1] - y0) / cell) * gw + Math.floor((p[0] - x0) / cell)] = pts.length - 1;
  };
  const far = (p) => {
    const gx = Math.floor((p[0] - x0) / cell);
    const gy = Math.floor((p[1] - y0) / cell);
    for (let yy = Math.max(0, gy - 2); yy <= Math.min(gh - 1, gy + 2); yy++) {
      for (let xx = Math.max(0, gx - 2); xx <= Math.min(gw - 1, gx + 2); xx++) {
        const i = grid[yy * gw + xx];
        if (i >= 0 && Math.hypot(pts[i][0] - p[0], pts[i][1] - p[1]) < r) return false;
      }
    }
    return true;
  };
  // seed several starts so disconnected pieces of the region are filled
  for (let n = 0; n < 400 && pts.length < 12; n++) {
    const p = [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)];
    if (accept(p) && far(p)) put(p);
  }
  while (active.length) {
    const ai = Math.floor(rnd() * active.length);
    const c = pts[active[ai]];
    let found = false;
    for (let t = 0; t < 30; t++) {
      const ang = rnd() * Math.PI * 2;
      const rr = r * (1 + rnd());
      const p = [c[0] + rr * Math.cos(ang), c[1] + rr * Math.sin(ang)];
      if (p[0] < x0 || p[0] >= x1 || p[1] < y0 || p[1] >= y1) continue;
      if (!far(p) || !accept(p)) continue;
      put(p);
      found = true;
      break;
    }
    if (!found) active.splice(ai, 1);
  }
  return pts;
};
const hash = (i, k) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const r2 = (v) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------------------
// THE SIEGE at the tip of the Liaodong peninsula (about 33 x 20 world px,
// ~50 x 30 km), at K_CLOSE 13.5 so the tip fills the middle of the frame.
//   GARRISON  8 slots packed round the swords glyph, on land
//   CRESCENT  Third Army's 30 at the start: one blue-noise crowd in a band
//             11.2-19.2 world px out from Port Arthur, across the peninsula
//             north-east of the fortress from coast to coast, with a clear
//             strip of land between it and the garrison
//   MID       where the crescent has crept to by "pivotal": the whole crowd
//             contracted toward a point past the fortress (~3.3 world px
//             nearer, spacing x0.96): the gap narrows, no dot converges
//   FINAL     the closed slots, over the garrison's position round the glyph;
//             crescent -> final by optimal assignment (non-crossing paths)
// ---------------------------------------------------------------------------
const PA = [CITIES.portArthur.x, CITIES.portArthur.y];
const TIP_PITCH = PITCH_TIP / K_CLOSE;
const TIP_R = (dotAt(K_CLOSE) / 2 + 1) / K_CLOSE; // a whole dot + 1 px of shore
const GLYPH_CLEAR = 3.05; // world px: the 75 px glyph's ink + a dot's radius
const bearing = (p) => (Math.atan2(-(p[1] - PA[1]), p[0] - PA[0]) * 180) / Math.PI; // 0 = east, 90 = north
const rOf = (p) => Math.hypot(p[0] - PA[0], p[1] - PA[1]);
// Landward: from west-north-west round north to east-south-east. Never the
// harbour mouth or the open sea to the south.
const LANDWARD = (p) => {
  const t = bearing(p);
  return t >= -35 && t <= 172;
};
const BOX = [PA[0] - 12, PA[1] - 22, PA[0] + 30, PA[1] + 8];
const GARRISON = poisson(...BOX, PITCH_GARRISON / K_CLOSE, (p) => {
  const r = rOf(p);
  return r >= GLYPH_CLEAR && r <= 5.8 && diskOnLand(p[0], p[1], TIP_R);
}, 17)
  .sort((m, n) => rOf(m) - rOf(n))
  .slice(0, 8);
if (GARRISON.length < 8) throw new Error("garrison does not fit");

// The crescent: ONE organic band, 30 dots placed as blue noise inside the
// crescent region (radius CRES from Port Arthur, bearings -8..95, whole dots
// on land), then relaxed apart so the closest pair is as far apart as the
// region allows. The creep to "pivotal" is a gentle contraction toward a point
// CRES_BACK world px behind the crescent's centre (past the fortress), so the
// crowd moves toward the fortress as one body, the gap narrows by CRES_SHIFT,
// and spacing shrinks only by the factor CRES_LAMBDA (never radial convergence).
const CRES = [11.2, 19.2];
const CRES_SHIFT = 3.3;
const CRES_BACK = 80;
const CRES_LAMBDA = 1 - CRES_SHIFT / CRES_BACK;
const byBearing = (pts) => [...pts].sort((m, n) => bearing(m) - bearing(n));
const inCres = (p) => {
  const r = rOf(p);
  const t = bearing(p);
  return r >= CRES[0] && r <= CRES[1] && t >= -8 && t <= 95 && diskOnLand(p[0], p[1], TIP_R);
};
// the contraction centre, from the region's own centroid
const CRES_C = (() => {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let x = PA[0]; x < PA[0] + 20; x += 0.25)
    for (let y = PA[1] - 20; y < PA[1] + 4; y += 0.25)
      if (inCres([x, y])) {
        sx += x;
        sy += y;
        n++;
      }
  const c = [sx / n, sy / n];
  const d = Math.hypot(PA[0] - c[0], PA[1] - c[1]);
  return [c[0] + ((PA[0] - c[0]) / d) * CRES_BACK, c[1] + ((PA[1] - c[1]) / d) * CRES_BACK];
})();
const toMid = (p) => [CRES_C[0] + (p[0] - CRES_C[0]) * CRES_LAMBDA, CRES_C[1] + (p[1] - CRES_C[1]) * CRES_LAMBDA];
const valid = (p) => {
  if (!inCres(p)) return false;
  const m = toMid(p);
  if (!(diskOnLand(m[0], m[1], TIP_R) && rOf(m) > 7.6)) return false;
  // the creep itself stays on land
  for (let n2 = 1; n2 < 6; n2++) {
    const t = n2 / 6;
    if (!diskOnLand(p[0] + (m[0] - p[0]) * t, p[1] + (m[1] - p[1]) * t, TIP_R)) return false;
  }
  // a clear land path from the crept position toward the fortress (no dot
  // stranded on a promontory behind an inlet of the north shore)
  for (let n2 = 1; n2 <= 12; n2++) {
    const t = (0.6 * n2) / 12;
    if (!diskOnLand(m[0] + (PA[0] - m[0]) * t, m[1] + (PA[1] - m[1]) * t, 0.5)) return false;
  }
  return true;
};
const minPair = (pts) => {
  let m = Infinity;
  for (let a2 = 0; a2 < pts.length; a2++)
    for (let b2 = a2 + 1; b2 < pts.length; b2++) m = Math.min(m, Math.hypot(pts[a2][0] - pts[b2][0], pts[a2][1] - pts[b2][1]));
  return m;
};
const relax = (pts, target, iters, ok) => {
  const P = pts.map((p) => [...p]);
  for (let it = 0; it < iters; it++) {
    for (let a2 = 0; a2 < P.length; a2++) {
      let fx = 0;
      let fy = 0;
      for (let b2 = 0; b2 < P.length; b2++) {
        if (a2 === b2) continue;
        const dx = P[a2][0] - P[b2][0];
        const dy = P[a2][1] - P[b2][1];
        const d = Math.hypot(dx, dy) || 1e-3;
        if (d < target) {
          fx += (dx / d) * (target - d);
          fy += (dy / d) * (target - d);
        }
      }
      const q = [P[a2][0] + 0.35 * fx, P[a2][1] + 0.35 * fy];
      if (ok(q)) P[a2] = q;
      else {
        // slide: try each axis alone
        const qx = [P[a2][0] + 0.35 * fx, P[a2][1]];
        const qy = [P[a2][0], P[a2][1] + 0.35 * fy];
        if (ok(qx)) P[a2] = qx;
        else if (ok(qy)) P[a2] = qy;
      }
    }
  }
  return P;
};
const dartThrow = (n, r, ok, seed, box) => {
  const rnd = mulberry(seed);
  const pts = [];
  for (let t = 0; t < 60000 && pts.length < n; t++) {
    const p = [box[0] + rnd() * (box[2] - box[0]), box[1] + rnd() * (box[3] - box[1])];
    if (ok(p) && pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) >= r)) pts.push(p);
  }
  return pts;
};
// best of several seeds: throw 30 at a modest radius, relax toward a large one
let RING_START = [];
{
  let best = -1;
  for (const seed of [3, 5, 7, 11, 13, 17, 19, 23]) {
    const init = dartThrow(30, 1.2, valid, seed, BOX);
    if (init.length < 30) continue;
    const relaxed = relax(init, 2.3, 400, valid);
    const m = minPair(relaxed);
    if (m > best) {
      best = m;
      RING_START = relaxed;
    }
  }
  if (RING_START.length < 30) throw new Error("crescent does not fit");
  RING_START = byBearing(RING_START);
}
const RING_MID_RAW = RING_START.map(toMid);
const crescentPts = RING_START;
const midR = (CRES[0] + CRES[1]) / 2;
console.log(
  `crescent: min spacing ${(minPair(RING_START) * K_CLOSE).toFixed(1)} px at start, ${(minPair(RING_MID_RAW) * K_CLOSE).toFixed(1)} px at f44 (1.4 d = ${(1.4 * dotAt(K_CLOSE)).toFixed(1)} px); lambda ${CRES_LAMBDA.toFixed(3)}`,
);

const finalPts = poisson(...BOX, (1.4 * dotAt(K_CLOSE)) / K_CLOSE, (p) => {
  const r = rOf(p);
  return r >= GLYPH_CLEAR && r <= 12 && LANDWARD(p) && diskOnLand(p[0], p[1], TIP_R);
}, 71).sort((m, n) => rOf(m) - rOf(n));
if (finalPts.length < 30) throw new Error(`only ${finalPts.length} closed slots`);
// Crescent -> closed slot by optimal assignment (least total squared
// distance, Hungarian): straight paths under it never cross, so the crowd
// closes without dots running through each other. RING_FINAL[i] is the slot
// of RING_START[i].
const hungarian = (cost) => {
  const n2 = cost.length;
  const u = new Array(n2 + 1).fill(0);
  const v = new Array(n2 + 1).fill(0);
  const pp = new Array(n2 + 1).fill(0);
  const way = new Array(n2 + 1).fill(0);
  for (let i = 1; i <= n2; i++) {
    pp[0] = i;
    let j0 = 0;
    const minv = new Array(n2 + 1).fill(Infinity);
    const used = new Array(n2 + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = pp[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n2; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n2; j++) {
        if (used[j]) {
          u[pp[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      }
      j0 = j1;
    } while (pp[j0] !== 0);
    do {
      const j1 = way[j0];
      pp[j0] = pp[j1];
      j0 = j1;
    } while (j0);
  }
  const ans = new Array(n2);
  for (let j = 1; j <= n2; j++) ans[pp[j] - 1] = j - 1;
  return ans;
};
const slots30 = finalPts.slice(0, 30);
// (every crescent dot has a land path toward the fortress, see `valid`; this
// reports whether any straight close still crosses water)
const pathOnLand = (m, q) => {
  for (let n2 = 1; n2 < 30; n2++) {
    const t = n2 / 30;
    if (!diskOnLand(m[0] + (q[0] - m[0]) * t, m[1] + (q[1] - m[1]) * t, 0.5)) return false;
  }
  return true;
};
const assign = hungarian(
  RING_MID_RAW.map((m) => slots30.map((q) => (m[0] - q[0]) ** 2 + (m[1] - q[1]) ** 2)),
);
const wet = RING_MID_RAW.filter((m, i) => !pathOnLand(m, slots30[assign[i]])).length;
console.log(`closing paths over water: ${wet}`);
const ringFinal = RING_MID_RAW.map((_, i) => slots30[assign[i]]);

const RING_MID = RING_MID_RAW;

const bearings = RING_START.map(bearing);
const landSpan = (() => {
  // the landward arc at the crescent's middle radius that is land
  let first = null;
  let last = null;
  for (let t = -35; t <= 172; t += 0.5) {
    const q = [PA[0] + midR * Math.cos((t * Math.PI) / 180), PA[1] - midR * Math.sin((t * Math.PI) / 180)];
    if (onLand(q[0], q[1])) {
      if (first === null) first = t;
      last = t;
    }
  }
  return [first, last];
})();
const gOut = Math.max(...GARRISON.map(rOf));
const cIn = Math.min(...RING_START.map(rOf));
const mIn = Math.min(...RING_MID.map(rOf));
console.log(`garrison r ${GARRISON.map((p) => rOf(p).toFixed(1)).join(" ")}`);
console.log(
  `crescent: ${crescentPts.length} candidates, r ${cIn.toFixed(1)}..${Math.max(...RING_START.map(rOf)).toFixed(1)}, bearings ${Math.min(...bearings).toFixed(0)}..${Math.max(...bearings).toFixed(0)} deg (land at r ${midR}: ${landSpan[0]}..${landSpan[1]} deg)`,
);
console.log(
  `clear strip: start ${((cIn - gOut) * K_CLOSE - dotAt(K_CLOSE)).toFixed(0)} px of empty land, at f44 ${((mIn - gOut) * K_CLOSE - dotAt(K_CLOSE)).toFixed(0)} px`,
);
console.log(`closed r ${ringFinal.map((p) => rOf(p).toFixed(1)).join(" ")}`);

// ---------------------------------------------------------------------------
// THE SHAHO LINE: the front runs about east-west over the railway on ~41.58 N
// from 122.97 to 123.97 E (a gentle natural bow), Russians north, Japanese
// south, a thin no-man's-land strip between. Each army is a wide, shallow
// blue-noise band (see `band`), never closer than 1.4 dots.
// ---------------------------------------------------------------------------
// ~83 km of front (1.0 deg of longitude at 41.6 N): wide, shallow bands.
const FRONT_LON = [122.97, 123.97];
const frontLat = (lon) => 41.58 + 0.012 * Math.sin(((lon - 122.97) / 1.0) * Math.PI * 1.1 + 0.5);
const FRONT_PTS = [];
for (let i = 0; i <= 24; i++) {
  const lon = FRONT_LON[0] - 0.1 + ((FRONT_LON[1] - FRONT_LON[0] + 0.2) * i) / 24;
  FRONT_PTS.push(projection([lon, frontLat(lon)]));
}
const [FX0] = projection([FRONT_LON[0], frontLat(FRONT_LON[0])]);
const [FX1] = projection([FRONT_LON[1], frontLat(FRONT_LON[1])]);
const frontYAt = (x) => {
  for (let i = 1; i < FRONT_PTS.length; i++) {
    if (FRONT_PTS[i][0] >= x) {
      const [xa, ya] = FRONT_PTS[i - 1];
      const [xb, yb] = FRONT_PTS[i];
      return ya + ((yb - ya) * (x - xa)) / (xb - xa);
    }
  }
  return FRONT_PTS[FRONT_PTS.length - 1][1];
};
const FRONT_PITCH = PITCH_FRONT / K_FRONT;
const GAP = 36 / K_FRONT; // no-man's land: the facing rows' centres are >= 36 screen px apart
// Each army is a relaxed blue-noise crowd in a band along the front: from the
// no-man's-land strip back to a depth that wanders a little along the line
// (hashed, so the back is ragged). The depth is the shallowest that still
// holds FRONT_PITCH (1.4 dots + breathing) between every pair.
const bandDepthAt = (x, D, seed) => {
  const u = (x - FX0) / (FX1 - FX0);
  return D * (1 + 0.12 * Math.sin(u * 7.1 + seed) + 0.08 * Math.sin(u * 17.3 + 2 * seed));
};
const band = (n, sgn, seed) => {
  for (let D = 2.5; D < 14; D += 0.1) {
    const ok = (p) => {
      if (p[0] < FX0 || p[0] > FX1) return false;
      const d = sgn * (frontYAt(p[0]) - p[1]);
      return d >= GAP / 2 && d <= GAP / 2 + bandDepthAt(p[0], D, seed);
    };
    const box = [FX0, frontYAt(FX0) - 20, FX1, frontYAt(FX0) + 20];
    const init = dartThrow(n, FRONT_PITCH * 0.55, ok, seed, box);
    if (init.length < n) continue;
    const relaxed = relax(init, FRONT_PITCH * 1.04, 500, ok);
    if (minPair(relaxed) >= FRONT_PITCH) return relaxed;
  }
  throw new Error("band does not fit");
};
const RUSSIANS = band(70, 1, 3);
const japanese = band(87, -1, 5);
// the 30 deepest of the 87 are the back of the line, where Third Army arrives
const byDepth = [...japanese].sort((m, n) => m[1] - frontYAt(m[0]) - (n[1] - frontYAt(n[0])));
const JAPANESE = byDepth.slice(0, 57);
const ARRIVALS = byDepth.slice(57);
const [RAIL_X_AT_FRONT] = (() => {
  // where the railway crosses the front
  for (let i = 1; i < RAIL_SOUTH_PTS.length; i++) {
    const [xa, ya] = RAIL_SOUTH_PTS[i - 1];
    const [xb, yb] = RAIL_SOUTH_PTS[i];
    const fa = frontYAt(xa);
    const fb = frontYAt(xb);
    if ((ya - fa) * (yb - fb) <= 0) {
      const t = (fa - ya) / (yb - ya - (fb - fa));
      return [xa + (xb - xa) * t];
    }
  }
  return [NaN];
})();
const ext = (pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return `x ${Math.min(...xs).toFixed(1)}..${Math.max(...xs).toFixed(1)}  y ${Math.min(...ys).toFixed(1)}..${Math.max(...ys).toFixed(1)}`;
};
console.log(`front x ${FX0.toFixed(1)}..${FX1.toFixed(1)}  y ~${frontYAt((FX0 + FX1) / 2).toFixed(1)}  rail crosses x ${RAIL_X_AT_FRONT.toFixed(1)}`);
const bandPx = (pts) => {
  const d = pts.map((q) => Math.abs(q[1] - frontYAt(q[0])));
  const xs = pts.map((q) => q[0]);
  return `${((Math.max(...xs) - Math.min(...xs)) * K_FRONT).toFixed(0)} x ${((Math.max(...d) - Math.min(...d)) * K_FRONT).toFixed(0)} screen px (+ dot)`;
};
console.log(`band min spacing ${(minPair(RUSSIANS) * K_FRONT).toFixed(1)} / ${(minPair([...JAPANESE, ...ARRIVALS]) * K_FRONT).toFixed(1)} px (1.4 d = ${(1.4 * dotAt(K_FRONT)).toFixed(1)})`);
console.log(`bands at k ${K_FRONT}: russians ${bandPx(RUSSIANS)}, japanese ${bandPx(JAPANESE)}, japanese + arrivals ${bandPx([...JAPANESE, ...ARRIVALS])}`);
console.log(`russians ${RUSSIANS.length}  ${ext(RUSSIANS)}`);
console.log(`japanese ${JAPANESE.length}  ${ext(JAPANESE)}`);
console.log(`arrivals ${ARRIVALS.length}  ${ext(ARRIVALS)}`);
for (const p of [...RUSSIANS, ...japanese]) if (!onLand(p[0], p[1])) throw new Error("crowd dot at sea");

// ---------------------------------------------------------------------------
// THE RAILWAY'S LAND-SAFE LANES: at every RAIL_SOUTH_PTS sample, how far a dot
// centre may sit off the line on each side (normal n = (-ty, tx), + = left of
// the Changchun -> Port Arthur direction) and still be a whole dot on land at
// the close-up's dot size. The Jinzhou isthmus squeezes the column.
// ---------------------------------------------------------------------------
const R = RAIL_SOUTH_PTS;
const SAFE_R = (dotAt(K_CLOSE) / 2 + 1) / K_CLOSE;
const LANE_MAX = 4.5;
const safe = R.map((p, i) => {
  const q0 = R[Math.max(0, i - 1)];
  const q1 = R[Math.min(R.length - 1, i + 1)];
  const L = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
  const nx = -(q1[1] - q0[1]) / L;
  const ny = (q1[0] - q0[0]) / L;
  const run = (sgn) => {
    let d = 0;
    while (d < LANE_MAX && diskOnLand(p[0] + sgn * nx * (d + 0.25), p[1] + sgn * ny * (d + 0.25), SAFE_R)) d += 0.25;
    return d;
  };
  return [run(1), run(-1)];
});
// min-filter over +-4 samples so the lane narrows ahead of a pinch, not at it
const minF = (col) =>
  safe.map((_, i) => {
    let m = Infinity;
    for (let j = Math.max(0, i - 4); j <= Math.min(safe.length - 1, i + 4); j++) m = Math.min(m, safe[j][col]);
    return Math.round(m * 100) / 100;
  });
const SAFE_L_ARR = minF(0);
const SAFE_R_ARR = minF(1);
console.log(
  `rail lanes: min left ${Math.min(...SAFE_L_ARR)}  min right ${Math.min(...SAFE_R_ARR)} (world px)`,
);

// ---------------------------------------------------------------------------
// A LAND BITMAP of the tip and the Jinzhou isthmus (4 texels per world px),
// so the motion module can keep the swing round the fortress and the column's
// lanes on land without shipping the coast polygon.
// ---------------------------------------------------------------------------
const TIP_MASK = { x0: 290, y0: 985, x1: 380, y1: 1085, s: 4 };
const TW = (TIP_MASK.x1 - TIP_MASK.x0) * TIP_MASK.s;
const TH = (TIP_MASK.y1 - TIP_MASK.y0) * TIP_MASK.s;
const bits = new Uint8Array(Math.ceil((TW * TH) / 8));
for (let j = 0; j < TH; j++) {
  for (let i = 0; i < TW; i++) {
    const x = TIP_MASK.x0 + (i + 0.5) / TIP_MASK.s;
    const y = TIP_MASK.y0 + (j + 0.5) / TIP_MASK.s;
    if (onLand(x, y)) bits[(j * TW + i) >> 3] |= 1 << ((j * TW + i) & 7);
  }
}
const TIP_BITS = Buffer.from(bits).toString("base64");

const P = (pts) => JSON.stringify(pts.map(([x, y]) => [r2(x), r2(y)]));
const body = `// Generated by scripts/build-pivotal-map.mjs — do not edit by hand.
// Same world as manchuriaMapData.ts (Lambert conformal conic, parallels 35/50,
// centre meridian 125 E; Port Arthur ${CITIES.portArthur.x}, ${CITIES.portArthur.y}; Mukden ${CITIES.mukden.x}, ${CITIES.mukden.y}).
// Every slot is a whole dot on LAND_D (Natural Earth 10m land). One dot = 3,000 men.

export const K_CLOSE = ${K_CLOSE};
export const K_FRONT = ${K_FRONT};
/** screen px diameter at K_CLOSE; scales as k^0.35 */
export const DOT_CLOSE = ${DOT_CLOSE};

/** Port Arthur garrison at the surrender, ~24,000: 8 slots round the fortress. */
export const GARRISON: [number, number][] = ${P(GARRISON)};
/** Nogi's Third Army, ~90,000: the 30 closed slots over the garrison's position (bearing order). */
export const RING_FINAL: [number, number][] = ${P(ringFinal)};
/** ...and the crescent they start in, coast to coast NE of the fortress (same order). */
export const RING_START: [number, number][] = ${P(RING_START)};
/** ...and where each has crept to by 'pivotal' (f44): same ray, nearer. */
export const RING_MID: [number, number][] = ${P(RING_MID)};

/** The Shaho front, ~41.58 N from 123.0 to 123.9 E (polyline, west -> east). */
export const FRONT_PTS: [number, number][] = ${P(FRONT_PTS)};
export const FRONT = ${JSON.stringify({ x0: r2(FX0), x1: r2(FX1), railX: r2(RAIL_X_AT_FRONT), y: r2(frontYAt(RAIL_X_AT_FRONT)), cx: r2((FX0 + FX1) / 2), cy: r2(frontYAt((FX0 + FX1) / 2)) })};
/** Russians on the Shaho line, ~210,000: 70 slots north of the front. */
export const RUSSIANS: [number, number][] = ${P(RUSSIANS)};
/** Japanese on the Shaho line, ~170,000: 57 slots south of the front. */
export const JAPANESE: [number, number][] = ${P(JAPANESE)};
/** Minimum centre spacing in the bands, world px (1.4 dots + breathing at K_FRONT). */
export const BAND_SPACING = ${Math.round(FRONT_PITCH * 10000) / 10000};
/** The back of the Japanese line, where Third Army's 30 dots arrive. */
export const ARRIVALS: [number, number][] = ${P(ARRIVALS)};

/** Per RAIL_SOUTH_PTS sample: land-safe lane offset left (+normal) and right, world px. */
export const RAIL_SAFE_L: number[] = ${JSON.stringify(SAFE_L_ARR)};
export const RAIL_SAFE_R: number[] = ${JSON.stringify(SAFE_R_ARR)};

/** Land bitmap of the tip + isthmus: row-major bits, 1 = land, texel centres at x0 + (i + 0.5) / s. */
export const TIP_MASK = ${JSON.stringify({ ...TIP_MASK, w: TW, h: TH })};
export const TIP_BITS = "${TIP_BITS}";
`;
writeFileSync(OUT, body);
console.log(`wrote ${OUT}`);
