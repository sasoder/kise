import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  ELEVATION,
  FONT_LABEL,
  FONT_NUM,
  GEO,
  METRIC,
  POOL,
  RUNG_F,
  SPACE,
  STROKE,
  TNUM_ADV,
  TRACK,
  TYPE,
  AmberGradient,
  ElevationShadow,
  Label,
  LightSweep,
  StoutStage,
  amberBandFor,
  bloomFilter,
  camFor,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  numeralWidth,
  opticalFit,
  rectPath,
  smoothstep,
  toScreen,
  type Silhouette,
} from "./stoutShared";
import { cameraTrack, camJerk, type Cam, type Glide } from "./outgrowShared";

// ---------------------------------------------------------------------------
// icebergShared — Toto Wolff, "the no dickheads rule" (Cheeky Pint S4E01): SIX
// cuts on ONE world and ONE story clock S, in the Cheeky Pint S4 "stout" system
// (stoutShared, palette B1). Brief: out/dickheads/briefs/BRIEF.md.
//
// THE CONCEPT: an iceberg made of people. Outside eyes see two cars and their
// two drivers on the tip's flat top; each cut pulls further back and further
// down: the mechanics, the pit wall, the 150 at the track (the tip), the two UK
// hubs below the waterline and the rest of the 2,500. In the last cut the amber
// that marked the two "superstars" spreads to every one of the 2,500.
//
// AMBER = star treatment, and nothing else is ever amber: cuts 1-5 only the two
// drivers' helmets; cut 6 every person (and the numeral that counts them).
// TONE LADDER for people: DARK (PASS 2: in the dark, a barely-there texture, cuts
// 1-2) -> board (not seen) -> cream (lit, seen) -> amber (star). The waterline
// lifts the body DARK -> board in cut 3; the light front lifts the tip DARK ->
// cream. A person changes tone only when a FRONT reaches them (a ~12-14 f eased
// crossfade, hashed offsets inside the front), never on a timer.
//
// HONEST COUNTS (asserted below at module load): exactly 2,500 people = 2
// drivers (the amber helmets) + 8 mechanics + 6 engineers + 134 tip crowd (the
// tip: 150) + 2,350 body crowd. The two crowds are one Poisson-disk density
// (POISSON_R, exact-count seeds found offline). Every readout value is the
// number of glyphs its front has reached at that frame.
//
// THE CLOCK: cut n renders `IcebergWorld S={S_n + frame}`; cut n+1's f0 is cut
// n's last frame (S_{n+1} = S_n + DURATION_n - 1), so camera, sway, pool, drift,
// grain and every state join pixel for pixel. One camera track (the house
// cameraTrack: superposed glides + the damped follower) for the whole clock.
// ---------------------------------------------------------------------------

type P = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const hashN = (n: number, k = 0) => {
  const s = Math.sin(n * 12.9898 + k * 78.233 + 4.17) * 43758.5453;
  return s - Math.floor(s);
};
const fail = (m: string): never => {
  throw new Error(`icebergShared: ${m}`);
};
/** A load-time rule: throws, except under the analysis probe (which collects the misses). */
const PROBE = (globalThis as { __ICE_PROBE__?: string[] }).__ICE_PROBE__;
const rule = (ok: boolean, m: string) => {
  if (ok) return;
  if (PROBE) PROBE.push(m);
  else fail(m);
};

// ===========================================================================
// THE STORY CLOCK
// ===========================================================================
export const FPS = 24;
/** DURATION = round(span x 24) + a 16-frame tail (the spans: the brief's frame tables). */
export const DUR = {
  TwoDrivers: 77, // 61 + 16
  PitWall: 102, // 86 + 16
  TipOfTheIceberg: 119, // 103 + 16
  TwoHubs: 151, // 135 + 16
  QuiteVast: 161, // 145 + 16
  NotTwoSuperstars: 158, // 142 + 16
} as const;
export const S_1 = 0;
export const S_2 = 76;
export const S_3 = 177;
export const S_4 = 295;
export const S_5 = 445;
export const S_6 = 605;
export const S_END = 762;
{
  const chain: [string, number, number][] = [
    ["TwoDrivers", S_1, DUR.TwoDrivers],
    ["PitWall", S_2, DUR.PitWall],
    ["TipOfTheIceberg", S_3, DUR.TipOfTheIceberg],
    ["TwoHubs", S_4, DUR.TwoHubs],
    ["QuiteVast", S_5, DUR.QuiteVast],
    ["NotTwoSuperstars", S_6, DUR.NotTwoSuperstars],
  ];
  for (let i = 1; i < chain.length; i++) {
    const [name, S] = chain[i];
    const [pName, pS, pD] = chain[i - 1];
    if (S !== pS + pD - 1) fail(`${name} f0 (S ${S}) is not ${pName}'s last frame (S ${pS + pD - 1})`);
  }
  const [, lS, lD] = chain[chain.length - 1];
  if (S_END !== lS + lD - 1) fail(`S_END ${S_END} != ${lS + lD - 1}`);
}

// ===========================================================================
// THE WORLD (world px). x = AX is the iceberg's axis; PY is the plateau (the
// tip's flat top, the floor the cars stand on); WY the waterline.
// ===========================================================================
export const AX = 540;
export const PY = 600;
export const H_T = 200; // plateau -> waterline
export const WY = PY + H_T;
// The silhouette: faceted and angular (a classic iceberg diagram). A small flat top (the plateau) on a
// narrow tip; below the waterline the mass broadens to ~2.5x the waterline's width. PASS 2: the body is
// asymmetric (the right shoulder lower and wider, widest at depth ~374; the left higher and narrower, widest
// at ~232), ten straight facets of varied length, and a broad angled bottom facet between two vertices at
// different heights (no single point). Drawn ~930 deep, scaled by BODY_SC (the exact-count search ran on
// these numbers).
const BODY_SC = 1.01;
const TIP_L_REL: P[] = [[-96, 0], [-101, 30], [-118, 62], [-131, 70], [-152, 118], [-170, 150], [-200, H_T]];
const TIP_R_REL: P[] = [[96, 0], [99, 22], [118, 52], [134, 104], [160, 128], [181, 160], [210, H_T]];
const BODY_R_REL: P[] = (
  [[210, 0], [395, 110], [550, 370], [460, 550], [300, 755], [145, 880], [-130, 930]] as P[]
).map(([x, y], i) => [i === 0 ? x : x * BODY_SC, H_T + y * BODY_SC] as P);
const BODY_L_REL: P[] = (
  [[-200, 0], [-475, 230], [-425, 510], [-335, 745], [-130, 930]] as P[]
).map(([x, y], i) => [i === 0 ? x : x * BODY_SC, H_T + y * BODY_SC] as P);
const abs = (p: P): P => [AX + p[0], PY + p[1]];
/** The tip's flanks, top corner -> waterline (world). */
export const TIP_LEFT: P[] = TIP_L_REL.map(abs);
export const TIP_RIGHT: P[] = TIP_R_REL.map(abs);
/** The body's flanks, waterline -> the bottom vertex (world); both end on it. */
export const BODY_LEFT: P[] = BODY_L_REL.map(abs);
export const BODY_RIGHT: P[] = BODY_R_REL.map(abs);
export const BOTTOM_Y = BODY_RIGHT[BODY_RIGHT.length - 1][1];
export const PLATEAU: [number, number] = [TIP_LEFT[0][0], TIP_RIGHT[0][0]];
const TIP_POLY_REL: P[] = [...TIP_R_REL, ...[...TIP_L_REL].reverse()];
const BODY_POLY_REL: P[] = [...BODY_R_REL, ...[...BODY_L_REL].reverse().slice(1)];
const polyArea = (poly: P[]) => {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a) / 2;
};
export const TIP_AREA = polyArea(TIP_POLY_REL);
export const BODY_AREA = polyArea(BODY_POLY_REL);

// --- the person glyph (public/person.png as a vector: head circle over a shoulder dome) -------------
/** Every person: ONE glyph, GLYPH world px tall (and as wide), drawn from person.png's geometry. */
export const GLYPH = 11;
const GS = GLYPH / 429; // person.png's ink spans 41..470 of its 512 box
type Cmd = ["M" | "L", number, number] | ["Q", number, number, number, number] | ["C", number, number, number, number, number, number] | ["Z"];
const KAPPA = 0.5522847498;
const circleCmds = (cx: number, cy: number, r: number): Cmd[] => {
  const c = r * KAPPA;
  return [
    ["M", cx + r, cy],
    ["C", cx + r, cy + c, cx + c, cy + r, cx, cy + r],
    ["C", cx - c, cy + r, cx - r, cy + c, cx - r, cy],
    ["C", cx - r, cy - c, cx - c, cy - r, cx, cy - r],
    ["C", cx + c, cy - r, cx + r, cy - c, cx + r, cy],
    ["Z"],
  ];
};
type Map2 = (x: number, y: number) => P;
const pathOf = (cmds: Cmd[], map: Map2) =>
  cmds
    .map((c) => {
      if (c[0] === "Z") return "Z";
      const pts: string[] = [];
      for (let i = 1; i < c.length; i += 2) {
        const [x, y] = map(c[i] as number, c[i + 1] as number);
        pts.push(`${f3(x)} ${f3(y)}`);
      }
      return `${c[0]}${pts.join(" ")}`;
    })
    .join("");
const BUST_HEAD: Cmd[] = circleCmds(255.5, 143, 102);
const BUST_BODY: Cmd[] = [
  ["M", 41, 458],
  ["C", 41, 352, 126, 266, 232, 266],
  ["L", 279, 266],
  ["C", 385, 266, 470, 352, 470, 458],
  ["L", 470, 462],
  ["Q", 470, 470, 462, 470],
  ["L", 49, 470],
  ["Q", 41, 470, 41, 462],
  ["Z"],
];
const bustMap =
  (cx: number, cy: number, then: Map2 = (x, y) => [x, y]): Map2 =>
  (u, v) =>
    then(cx + (u - 255.5) * GS, cy + (v - 255.5) * GS);
/** The bust at (cx, cy) (its ink box centre), as one path; `then` maps world -> any space. */
export const bustPath = (cx: number, cy: number, then?: Map2) => pathOf([...BUST_HEAD, ...BUST_BODY], bustMap(cx, cy, then));
const BUST_D = bustPath(0, 0);
/** The head: centre (relative to the bust centre) and radius. */
export const HEAD = { cy: (143 - 255.5) * GS, r: 102 * GS };
// the shoulder dome's outline, sampled (for the non-overlap assertion)
const DOME_POLY: P[] = (() => {
  const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  };
  const out: P[] = [];
  for (let i = 0; i <= 16; i++) out.push(bez([41, 458], [41, 352], [126, 266], [232, 266], i / 16));
  for (let i = 0; i <= 16; i++) out.push(bez([279, 266], [385, 266], [470, 352], [470, 458], i / 16));
  out.push([470, 470], [41, 470]);
  return out.map(([u, v]) => [(u - 255.5) * GS, (v - 255.5) * GS] as P);
})();
const insidePoly = (poly: P[], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const inBust = (x: number, y: number) => x * x + (y - HEAD.cy) * (y - HEAD.cy) <= HEAD.r * HEAD.r || insidePoly(DOME_POLY, x, y);
const BUST_RIM: P[] = (() => {
  const out: P[] = [];
  for (let i = 0; i < 24; i++) out.push([HEAD.r * Math.cos((i / 24) * 2 * Math.PI), HEAD.cy + HEAD.r * Math.sin((i / 24) * 2 * Math.PI)]);
  return [...out, ...DOME_POLY];
})();

// ===========================================================================
// THE PEOPLE LAYOUT — Bridson Poisson-disk, deterministic (mulberry32, no
// transcendental functions: the same points in every engine), one radius for
// both crowds. Seeds were searched offline for EXACT counts (134 / 2,350).
// ===========================================================================
/** The bust's worst-case contact distance is 12.64 (a head under a neighbour's shoulder at ~57 deg);
 *  13 keeps every pair apart (>= 0.36 px at that angle, 2 px side by side or stacked). */
export const POISSON_R = 13;
const SEED_TIP = 3;
const SEED_BODY = 16;
const EDGE_MARGIN = 7; // a glyph centre to the glass outline
const WATER_GAP = 7.5; // a glyph centre to the waterline (no glyph straddles the rule)
const CROWD_TOP = 86; // the tip crowd's first row (rel. PY): below y 1400 at cut 1's close framing
/** The pit wall's slot terrace and the hub tiles (+ their labels) are kept clear of the crowd. */
export const PIT = { x0: AX - 50, x1: AX + 50, top: PY + 50, bot: PY + 58 } as const;
/** PASS 2: the hubs are places, not badges: 126 px tiles (~11.5 person widths, 2.1x pass 1). */
export const HUB = { size: 126, dx: 88, y: WY + 242 } as const;
const HUB_HALF = HUB.size / 2;
const ZONES_REL = [
  { x0: -56, x1: 56, y0: 40, y1: 72 },
  { x0: -HUB.dx - HUB_HALF, x1: -HUB.dx + HUB_HALF, y0: H_T + 242 - HUB_HALF, y1: H_T + 242 + HUB_HALF },
  { x0: HUB.dx - HUB_HALF, x1: HUB.dx + HUB_HALF, y0: H_T + 242 - HUB_HALF, y1: H_T + 242 + HUB_HALF },
  { x0: -HUB.dx - HUB_HALF, x1: -HUB.dx + HUB_HALF, y0: H_T + 242 + HUB_HALF, y1: H_T + 242 + HUB_HALF + 32 },
  { x0: HUB.dx - HUB_HALF, x1: HUB.dx + HUB_HALF, y0: H_T + 242 + HUB_HALF, y1: H_T + 242 + HUB_HALF + 32 },
];
const segDist2 = (px: number, py: number, a: P, b: P) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
  const ex = px - a[0] - t * dx;
  const ey = py - a[1] - t * dy;
  return ex * ex + ey * ey;
};
const edgeDist2 = (poly: P[], x: number, y: number) => {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, segDist2(x, y, poly[i], poly[(i + 1) % poly.length]));
  return d;
};
const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const okTip = (x: number, y: number) =>
  y < H_T - WATER_GAP && y >= CROWD_TOP && insidePoly(TIP_POLY_REL, x, y) && edgeDist2(TIP_POLY_REL, x, y) >= EDGE_MARGIN * EDGE_MARGIN;
const okBody = (x: number, y: number) => {
  if (!(y > H_T + WATER_GAP && insidePoly(BODY_POLY_REL, x, y) && edgeDist2(BODY_POLY_REL, x, y) >= EDGE_MARGIN * EDGE_MARGIN)) return false;
  for (const z of ZONES_REL)
    if (x > z.x0 - EDGE_MARGIN && x < z.x1 + EDGE_MARGIN && y > z.y0 - EDGE_MARGIN && y < z.y1 + EDGE_MARGIN) return false;
  return true;
};
const bridson = (R: number, seed: number, ok: (x: number, y: number) => boolean, start: P) => {
  const rnd = mulberry(seed);
  const cell = R / Math.SQRT2;
  const grid = new Map<number, P>();
  const key = (gx: number, gy: number) => gx * 100003 + gy;
  const pts: P[] = [];
  const active: number[] = [];
  const far = (x: number, y: number) => {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    for (let i = -2; i <= 2; i++)
      for (let j = -2; j <= 2; j++) {
        const q = grid.get(key(gx + i, gy + j));
        if (q) {
          const ex = q[0] - x;
          const ey = q[1] - y;
          if (ex * ex + ey * ey < R * R) return false;
        }
      }
    return true;
  };
  const add = (p: P) => {
    pts.push(p);
    active.push(pts.length - 1);
    grid.set(key(Math.floor(p[0] / cell), Math.floor(p[1] / cell)), p);
  };
  add(start);
  while (active.length) {
    const ai = Math.floor(rnd() * active.length);
    const p = pts[active[ai]];
    let found = false;
    for (let t = 0; t < 30; t++) {
      let ox = 0;
      let oy = 0;
      let o2 = 0;
      do {
        ox = (2 * rnd() - 1) * 2 * R;
        oy = (2 * rnd() - 1) * 2 * R;
        o2 = ox * ox + oy * oy;
      } while (o2 < R * R || o2 > 4 * R * R);
      const x = p[0] + ox;
      const y = p[1] + oy;
      if (ok(x, y) && far(x, y)) {
        add([x, y]);
        found = true;
        break;
      }
    }
    if (!found) active.splice(ai, 1);
  }
  return pts;
};
export type Person = { x: number; y: number };
export const TIP_CROWD: Person[] = bridson(POISSON_R, SEED_TIP, okTip, [0, (CROWD_TOP + H_T) / 2 + 20]).map(([x, y]) => ({ x: AX + x, y: PY + y }));
export const BODY_CROWD: Person[] = bridson(POISSON_R, SEED_BODY, okBody, [0, H_T + 120]).map(([x, y]) => ({ x: AX + x, y: PY + y }));

// --- the two cars (side profile, facing right) -------------------------------------------------------
/** A modern F1 car, metres (x 0 = the tail, 5.5 = the nose; y up from the ground), -> world. */
export const CAR_L = 56;
const PXM = CAR_L / 5.5;
export const CAR_H = 1.14 * PXM; // the halo's top
export const Y_TOP = PY - CAR_H; // the cars' top (the readout stands CLEAR above it)
export const CARS_CY = PY - CAR_H / 2;
/** Rest boxes: each car's tail x. A (left) is the rear car, B (right) the front car; a 6 px gap. */
export const CAR_TAIL = [AX - 59, AX + 3] as const;
const WHEEL_R = 0.36;
const WHEELS: P[] = [
  [0.86, 0.36],
  [4.38, 0.36],
];
const HELMET = { x: 2.98, y: 0.8, r: 0.2 };
const CAR_BODY: Cmd[] = [
  ["M", 0.5, 0.17],
  ["L", 0.5, 0.4],
  ["C", 1.3, 0.47, 1.95, 0.58, 2.22, 0.84],
  ["L", 2.3, 0.96],
  ["Q", 2.33, 1.0, 2.4, 1.0],
  ["L", 2.56, 1.0],
  ["Q", 2.62, 1.0, 2.64, 0.95],
  ["L", 2.7, 0.7],
  ["L", 3.42, 0.68],
  ["C", 4.05, 0.64, 4.8, 0.47, 5.4, 0.28],
  ["Q", 5.48, 0.26, 5.46, 0.21],
  ["L", 4.6, 0.18],
  ["L", 4.06, 0.22],
  ["L", 3.98, 0.07],
  ["L", 1.25, 0.05],
  ["L", 0.95, 0.1],
  ["L", 0.62, 0.16],
  ["Z"],
];
// the rear wing: a deep blade (mainplane + flap) with its endplate's trailing edge, on a swan-neck pillar
const CAR_WING_R: Cmd[] = [
  ["M", 0.0, 0.62],
  ["L", 0.0, 0.95],
  ["Q", 0.0, 1.0, 0.05, 1.0],
  ["L", 0.66, 0.97],
  ["L", 0.7, 0.92],
  ["L", 0.7, 0.8],
  ["L", 0.16, 0.78],
  ["L", 0.14, 0.62],
  ["Z"],
];
const CAR_PILLAR: Cmd[] = [["M", 0.34, 0.8], ["L", 0.46, 0.8], ["L", 0.6, 0.36], ["L", 0.48, 0.36], ["Z"]];
// the front wing: a low plank reaching past the nose, its endplate standing at the tip
const CAR_WING_F: Cmd[] = [
  ["M", 4.8, 0.03],
  ["L", 5.6, 0.03],
  ["L", 5.62, 0.26],
  ["Q", 5.62, 0.29, 5.58, 0.29],
  ["L", 5.52, 0.29],
  ["L", 5.49, 0.14],
  ["L", 4.9, 0.13],
  ["Q", 4.82, 0.12, 4.8, 0.08],
  ["Z"],
];
// ink details: the slot between mainplane and flap, the sidepod inlet, the airbox intake
const CAR_INK: Cmd[][] = [
  [["M", 0.03, 0.885], ["L", 0.68, 0.865], ["L", 0.68, 0.895], ["L", 0.03, 0.915], ["Z"]],
  [["M", 3.3, 0.33], ["Q", 3.42, 0.34, 3.43, 0.44], ["L", 3.43, 0.56], ["Q", 3.36, 0.56, 3.32, 0.5], ["Z"]],
  [["M", 2.58, 0.86], ["L", 2.65, 0.86], ["L", 2.63, 0.96], ["L", 2.59, 0.96], ["Z"]],
];
/** The halo: a band over the cockpit from its front post to the roll hoop. */
const CAR_HALO: Cmd[] = (() => {
  const seg = (p0: P, p1: P, p2: P, p3: P, n: number) => {
    const out: P[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = (1 - t) ** 3;
      const b = 3 * (1 - t) ** 2 * t;
      const c = 3 * (1 - t) * t * t;
      const d = t ** 3;
      out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
    return out;
  };
  const line = [...seg([3.4, 0.66], [3.32, 0.98], [3.12, 1.1], [2.94, 1.1], 14), ...seg([2.94, 1.1], [2.76, 1.1], [2.66, 1.05], [2.6, 0.98], 8).slice(1)];
  const w = 0.035;
  const L: P[] = [];
  const Rr: P[] = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const n = Math.hypot(tx, ty) || 1;
    L.push([p[0] - (ty / n) * w, p[1] + (tx / n) * w]);
    Rr.push([p[0] + (ty / n) * w, p[1] - (tx / n) * w]);
  });
  const pts = [...L, ...Rr.reverse()];
  return [["M", pts[0][0], pts[0][1]] as Cmd, ...pts.slice(1).map((p) => ["L", p[0], p[1]] as Cmd), ["Z"] as Cmd];
})();
const VISOR: Cmd[] = [
  ["M", 3.0, 0.8],
  ["L", 3.22, 0.8],
  ["L", 3.22, 0.87],
  ["L", 3.0, 0.87],
  ["Q", 2.97, 0.835, 3.0, 0.8],
  ["Z"],
];
/** metres -> world, the tail at x = 0 (each car is drawn under translate(tailX 0)). */
const carMap: Map2 = (x, y) => [x * PXM, PY - y * PXM];
const CAR_SIL_CMDS: Cmd[][] = [
  CAR_BODY,
  CAR_WING_R,
  CAR_PILLAR,
  CAR_WING_F,
  CAR_HALO,
  circleCmds(HELMET.x, HELMET.y, HELMET.r),
  ...WHEELS.map(([x, y]) => circleCmds(x, y, WHEEL_R)),
];
/** One car's world-space parts (tail at x 0). */
const CAR_D = {
  body: pathOf(CAR_BODY, carMap),
  wingR: pathOf(CAR_WING_R, carMap),
  pillar: pathOf(CAR_PILLAR, carMap),
  wingF: pathOf(CAR_WING_F, carMap),
  halo: pathOf(CAR_HALO, carMap),
  helmet: pathOf(circleCmds(HELMET.x, HELMET.y, HELMET.r), carMap),
  visor: pathOf(VISOR, carMap),
  ink: CAR_INK.map((c) => pathOf(c, carMap)),
  wheels: WHEELS.map(([x, y]) => pathOf(circleCmds(x, y, WHEEL_R), carMap)),
};
/** The car silhouette as one knocked-out figure in a 0..1 box (the CHASSIS tile): wheels separated
 *  from the body by a ring of cream. Returns the paths (black = knock-out) and the ring gaps (white). */
const CHASSIS_BOX = { x0: 0, x1: 5.56, y0: 0.03, y1: 1.14 };

// The mechanics: 4 per car (car A's from the left, car B's from the right), a pair at each wheel,
// standing in the tip's first row directly under their wheels (their heads just under the floor line):
// the crew the cars stand on. (Behind the cars they broke the cars' silhouettes; beside them they
// needed a plateau wider than the iceberg's tip and a pull-back before "the mechanics".)
const MECH_TOP = 3; // world px under the floor line
export const MECHANICS: (Person & { car: 0 | 1; j: number })[] = ([0, 1] as const).flatMap((car) =>
  WHEELS.flatMap(([wx], w) => [-6.6, 6.6].map((d, s) => ({ car, j: w * 2 + s, x: CAR_TAIL[car] + wx * PXM + d, y: PY + MECH_TOP + GLYPH / 2 }))),
);
/** The pit wall's six engineers: behind the bar, heads and shoulders above its top edge. */
export const ENGINEERS: Person[] = [-40, -24, -8, 8, 24, 40].map((dx) => ({ x: AX + dx, y: PIT.top - 3.5 }));
export const DRIVERS = 2;

// --- the assertions: exact counts, containment, no overlap -----------------------------------------
export const COUNT = {
  drivers: DRIVERS,
  mechanics: MECHANICS.length,
  engineers: ENGINEERS.length,
  tipCrowd: TIP_CROWD.length,
  body: BODY_CROWD.length,
  tip: DRIVERS + MECHANICS.length + ENGINEERS.length + TIP_CROWD.length,
  total: DRIVERS + MECHANICS.length + ENGINEERS.length + TIP_CROWD.length + BODY_CROWD.length,
} as const;
{
  if (COUNT.mechanics !== 8 || COUNT.engineers !== 6) fail("8 mechanics and 6 engineers");
  if (COUNT.tipCrowd !== 134) fail(`tip crowd ${COUNT.tipCrowd} != 134`);
  if (COUNT.body !== 2350) fail(`body crowd ${COUNT.body} != 2350`);
  if (COUNT.tip !== 150) fail(`tip ${COUNT.tip} != 150`);
  if (COUNT.total !== 2500) fail(`total ${COUNT.total} != 2500`);
  TIP_CROWD.forEach((p) => {
    if (!(p.y < WY && insidePoly(TIP_POLY_REL, p.x - AX, p.y - PY))) fail("a tip person outside the tip");
  });
  BODY_CROWD.forEach((p) => {
    if (!(p.y > WY && insidePoly(BODY_POLY_REL, p.x - AX, p.y - PY))) fail("a body person outside the body");
  });
  // no two glyphs overlap: every rim point of one outside the other
  const all = [...TIP_CROWD, ...BODY_CROWD];
  const cell = 16;
  const grid = new Map<number, number[]>();
  const key = (gx: number, gy: number) => gx * 100003 + gy;
  all.forEach((p, i) => {
    const k = key(Math.floor(p.x / cell), Math.floor(p.y / cell));
    grid.set(k, [...(grid.get(k) ?? []), i]);
  });
  all.forEach((p, i) => {
    const gx = Math.floor(p.x / cell);
    const gy = Math.floor(p.y / cell);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (const j of grid.get(key(gx + a, gy + b)) ?? []) {
          if (j <= i) continue;
          const q = all[j];
          if (BUST_RIM.some(([u, v]) => inBust(q.x + u - p.x, q.y + v - p.y)) || BUST_RIM.some(([u, v]) => inBust(p.x + u - q.x, p.y + v - q.y)))
            fail(`glyphs ${i} and ${j} overlap`);
        }
  });
}

// ===========================================================================
// MOTION ON THE CLOCK
// ===========================================================================
export const cutF = (S0: number, f: number) => S0 + f;
const easeOutPow = (u: number, n: number) => 1 - Math.pow(1 - clamp01(u), n);
const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};
const TONE_F = 14; // a person's crossfade (frames)

// --- cut 1: the cars glide in from off frame left and decelerate into their boxes -------------------
// ONE long curve per car from speed to rest, no bounce: x = end - D (1 - t/T)^n. The rear car (A)
// closes up from further back and rests first (S 32), the front car (B) 4 f later (S 36); the gap
// closes 14 -> ~5.3 -> 6 px and never shuts. Entry speeds <= 45 screen px/f at k 6.6.
export const CAR_MOVE = [
  { D: 100, T: 32, n: 2.2 },
  { D: 92, T: 36, n: 2.6 },
] as const;
export const carTail = (car: 0 | 1, S: number) => {
  const m = CAR_MOVE[car];
  return CAR_TAIL[car] - m.D * Math.pow(1 - clamp01(S / m.T), m.n);
};
/** The helmet warms (cream -> amber, 14 f) as its car comes to rest in the pool: 2 f before the end
 *  of its curve (the last < 0.05 px). A: S 30 -> 44, B: S 34 -> 48. */
export const HELMET_WARM = [CAR_MOVE[0].T - 2, CAR_MOVE[1].T - 2] as const;
export const helmetAmber = (car: 0 | 1, S: number) => smoothstep((S - HELMET_WARM[car]) / TONE_F);

// --- cut 2: the crew converges, the pit wall rises out of its slot ------------------------------------
/** Each mechanic's glide in along the plateau (PASS 2: it belongs to cut 2; nothing of theirs is on screen at
 *  S <= 76): car A's from just outside the left frame edge, car B's from the right, starting on cut 2 f0
 *  ("and then you see"), ONE wave, each on its own hashed arc (a gentle lift of 0.8-1.8 px, no bounce),
 *  decelerating to rest under its wheel, landing f25-30 ("mechanics" f19). Each side is a queue 13.5 px
 *  apart, the one going farthest in leading and landing first, so no two ever touch. */
export const MECH_MOVE = MECHANICS.map((m, i) => {
  const side = m.car === 0 ? -1 : 1;
  const mine = MECHANICS.filter((q) => q.car === m.car).sort((a, b) => Math.abs(a.x - AX) - Math.abs(b.x - AX));
  const rank = mine.indexOf(m); // 0 = the one going farthest in
  const start = S_2;
  const land = S_2 + 25 + rank * 1.3 + hashN(i, 5) * 0.3; // f25-29.2
  const from = AX + side * (84 + 13.5 * rank); // just outside the frame (cut 2 f0: k 7.01, half-width 77)
  const arc = 0.8 + 1.0 * hashN(i, 9);
  return { start, land, from, to: m.x, arc };
});
const mechU = (i: number, S: number) => {
  const m = MECH_MOVE[i];
  return easeOutPow((S - m.start) / (m.land - m.start), 2);
};
export const mechX = (i: number, S: number) => lerp(MECH_MOVE[i].from, MECH_MOVE[i].to, mechU(i, S));
export const mechDy = (i: number, S: number) => -MECH_MOVE[i].arc * Math.sin(Math.PI * mechU(i, S));
export const mechLift = (i: number, S: number) => {
  const m = MECH_MOVE[i];
  const u = clamp01((S - m.start) / (m.land - m.start));
  return u <= 0 ? 1 : 1 - smoothstep((u - 0.55) / 0.45);
};
/** The pit wall: its terrace (a short glass ledge, the slot's floor) draws out from the axis (f36-46),
 *  the bar rises out of the slot (f44-66), then the engineers rise in behind it until their heads and
 *  shoulders clear its top edge (f56-78): one entrance, the bar first. */
export const PIT_RISE = {
  terrace: [S_2 + 36, S_2 + 46],
  bar: [S_2 + 44, S_2 + 66],
  eng: [S_2 + 56, S_2 + 78],
  barH: PIT.bot - PIT.top + 1,
  engH: PIT.bot - PIT.top + 1.5,
} as const;
export const TERRACE_W = 64;
const riseOf = (S: number, w: readonly [number, number]) => 1 - smootherstep((S - w[0]) / (w[1] - w[0]));
export const barDy = (S: number) => PIT_RISE.barH * riseOf(S, PIT_RISE.bar);
export const engDy = (S: number) => barDy(S) + PIT_RISE.engH * riseOf(S, PIT_RISE.eng);

// --- the crowd starts in the DARK (PASS 2) -------------------------------------------------------------
/** DARK: one tone below board, a barely-there texture. Every crowd glyph starts DARK (the drivers,
 *  mechanics and engineers do not); the waterline (body) and the light front (tip) reveal them in cut 3. */
export const DARK = mixHex(COLOR.ground, COLOR.board, 0.15);

// --- the rank-timed front: a front reaches its people in their own order (distance + a hashed offset)
// at DESIGNED times, so its count runs and then decelerates continuously INTO its last person (velocity
// ∝ u (1 - u)^(p - 1) over the count, stoutActA's rest-to-rest curve): person r of N is reached when
// the curve passes (r + 1) / N; the last exactly at S1. The count stays honest (floor = reached); the
// front's motion is what is shaped.
const restToRest = (t: number, p: number) => 1 - Math.pow(1 - clamp01(t), p) * (1 + p * clamp01(t));
const rankTimes = (keys: number[], S0: number, S1: number, p: number) => {
  const order = keys.map((k, i) => [k, i] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out: number[] = keys.map(() => 0);
  order.forEach(([, i], r) => {
    const v = (r + 1) / order.length;
    let lo = 0;
    let hi = 1;
    for (let it = 0; it < 50; it++) {
      const m = (lo + hi) / 2;
      if (restToRest(m, p) >= v) hi = m;
      else lo = m;
    }
    out[i] = S0 + hi * (S1 - S0);
  });
  return { times: out, order };
};

// --- cut 3: the waterline, the tip's outline, the light front -----------------------------------------
export const WATER_DRAW = [S_3 + 20, S_3 + 44] as const;
export const TIP_DRAW = [S_3 + 24, S_3 + 52] as const;
/** The light front (cut 3): from the cars down through the tip; each tip person warms DARK -> cream as it
 *  arrives (13 f, a soft wave). PASS 2: first ~f49, the 150th on f74 ("people" f68), decelerating into it. */
const LIGHT_SRC: P = [AX, PY - 6];
const lightKey = TIP_CROWD.map((p, i) => Math.hypot(p.x - LIGHT_SRC[0], p.y - LIGHT_SRC[1]) + (hashN(i, 11) - 0.5) * 18);
export const LIGHT_FRONT = { S0: S_3 + 47, S1: S_3 + 74, p: 3 } as const;
export const LIGHT_T: number[] = rankTimes(lightKey, LIGHT_FRONT.S0, LIGHT_FRONT.S1, LIGHT_FRONT.p).times;
export const lightTone = (i: number, S: number) => smoothstep((S - LIGHT_T[i]) / (TONE_F - 1));

// --- cut 5: the body's outline draws down both flanks; its lowest point is the counter's front ----------
// A person counts once the head has passed their centre by BODY_REACH (a glyph's half height + the glass's
// clearance; = the lowest person's distance to the bottom, so the count closes as the outline closes).
// PASS 2: the head is rank-timed: it passes the people at designed times (first f19, the 2,350th on f46),
// moving between them in a straight line, so it decelerates into the bottom and "2,500" lands on f46.
export const BODY_DRAW = { S0: S_5 + 18, S1: S_5 + 46, p: 3 } as const;
export const BODY_REACH = BOTTOM_Y - Math.max(...BODY_CROWD.map((p) => p.y));
const BODY_RANK = rankTimes(
  BODY_CROWD.map((p) => p.y),
  BODY_DRAW.S0,
  BODY_DRAW.S1,
  BODY_DRAW.p,
);
export const BODY_T: number[] = BODY_RANK.times;
/** The head's y: through (S0, WY) and every (reach time, centre + BODY_REACH), straight between. */
const BODY_HEAD: [number, number][] = [[BODY_DRAW.S0, WY], ...BODY_RANK.order.map(([y, i]) => [BODY_T[i], y + BODY_REACH] as [number, number])];
export const bodyFrontY = (S: number) => {
  if (S <= BODY_HEAD[0][0]) return WY;
  if (S >= BODY_HEAD[BODY_HEAD.length - 1][0]) return BOTTOM_Y;
  let lo = 0;
  let hi = BODY_HEAD.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (BODY_HEAD[m][0] <= S) lo = m;
    else hi = m;
  }
  const [t0, y0] = BODY_HEAD[lo];
  const [t1, y1] = BODY_HEAD[hi];
  return t1 > t0 ? lerp(y0, y1, (S - t0) / (t1 - t0)) : y1;
};

// --- cut 6: the amber wave from the two helmets, out and down through every person ---------------------
const AMBER_SRC: P = [CAR_TAIL[0] + (HELMET.x * PXM + HELMET.x * PXM + CAR_TAIL[1] - CAR_TAIL[0]) / 2, PY - HELMET.y * PXM];
type Who = { kind: "mech" | "eng" | "tip" | "body"; i: number; x: number; y: number };
export const EVERYONE: Who[] = [
  ...MECHANICS.map((p, i) => ({ kind: "mech" as const, i, x: p.x, y: p.y })),
  ...ENGINEERS.map((p, i) => ({ kind: "eng" as const, i, x: p.x, y: p.y })),
  ...TIP_CROWD.map((p, i) => ({ kind: "tip" as const, i, x: p.x, y: p.y })),
  ...BODY_CROWD.map((p, i) => ({ kind: "body" as const, i, x: p.x, y: p.y })),
];
/** PASS 2: the wave leaves the helmets on f66 ("there's two and a half thousand") and reaches its last
 *  person on f118 ("them" f119), decelerating into it; "2,500" lands with it. */
export const AMBER_FRONT = { S0: S_6 + 66, S1: S_6 + 118, p: 3 } as const;

// ===========================================================================
// THE CAMERA — one track for the whole clock (look = the content centre; the
// camera centre is look + CAM_LIFT / k, so the look lands at screen y 835).
// ===========================================================================
export const K = { c1: 6.8, c2: 4.0, c3: 2.2, c4: 2.05, wide: 0.885, cars: 3.5 } as const;
/** Cut 3's rest: the readout (Y_TOP - 203.6 / k) to the waterline, centred on y 835. */
const READOUT_H = TYPE.HERO * METRIC.fig + SPACE.LOCKUP + TYPE.LABEL * METRIC.cap + SPACE.CLEAR; // screen px above the cars' top
export const LOOK = {
  cars: CARS_CY,
  pit: (Y_TOP + PIT.bot) / 2,
  tip: (Y_TOP - READOUT_H / K.c3 + WY) / 2,
  hubs: HUB.y + 11,
  /** the wide: the berg's bottom on y 1395, the readout's top ~y 205 */
  wide: BOTTOM_Y - (1395 - 835) / K.wide,
} as const;
const CAM_PRE = 40;
const CAM_START = { x: AX - 14, y: LOOK.cars, k: 6.5 };
const RISE_LOOK = LOOK.hubs - 80; // cut 5: the pull-back rises so the readout is on screen early
export const CAM_GLIDES: Glide[] = [
  // Glides are keyed in S (cut n's frame f = S - S_n). Rest k (measured on the damped track): cut 1 end 7.01,
  // cut 2 end 3.94, cut 3 end 2.35, cut 4 end 2.02, cut 5 wide 0.88 / end 3.49, cut 6 end 0.87.
  // cut 1 (S 0-76): eases right with the cars and creeps in; the tail creep
  { f0: -40, f1: 40, dx: 14, k: K.c1 },
  { f0: 34, f1: 112, k: 7.25 },
  // cut 2 (S 76-177): eases back and a little down as the pit wall rises (f22 -> f66); the creep
  { f0: S_2 + 22, f1: S_2 + 66, dy: LOOK.pit - LOOK.cars, k: K.c2, warp: 0.95 },
  { f0: S_2 + 64, f1: S_2 + 120, k: 3.9 },
  // cut 3 (S 177-295): one long pull-back that drops the waterline into the lower half (f12 -> f49); creep
  { f0: S_3 + 12, f1: S_3 + 49, dy: LOOK.tip - LOOK.pit, k: K.c3 },
  { f0: S_3 + 47, f1: S_3 + 125, k: 2.36 },
  // cut 4 (S 295-445): down through the waterline onto the hubs (f-2 -> f41); the creep to the left tile
  // through the pause (f44 -> f80); right to the second tile (f94 -> f121); ease to the pair (f119 -> f151)
  { f0: S_4 - 2, f1: S_4 + 41, dy: LOOK.hubs - LOOK.tip, k: K.c4 },
  { f0: S_4 + 44, f1: S_4 + 80, dx: -50, dy: -3, k: 2.32 },
  { f0: S_4 + 94, f1: S_4 + 121, dx: 100 },
  { f0: S_4 + 119, f1: S_4 + 151, dx: -50, dy: 3, k: K.c4 },
  // cut 5 (S 445-605): the strong pull-back and rise (f-4 -> f32: the readout on screen by f16), on to the
  // wide (f24 -> f76), the held creep (f70 -> f100), then (PASS 2) one long glide up and in to the two cars
  // (the look f84 -> f134, the zoom f88 -> f154, so the cars' screen path stays smooth); the tail creep
  { f0: S_5 - 4, f1: S_5 + 32, dy: RISE_LOOK - LOOK.hubs, k: 1.15, warp: 0.6 },
  { f0: S_5 + 24, f1: S_5 + 76, dx: 2, dy: LOOK.wide - RISE_LOOK, k: K.wide },
  { f0: S_5 + 70, f1: S_5 + 100, k: 0.86 },
  { f0: S_5 + 88, f1: S_5 + 154, k: K.cars, warp: 1.2 },
  { f0: S_5 + 84, f1: S_5 + 134, dx: -2, dy: LOOK.cars - LOOK.wide, warp: 0.65 },
  { f0: S_5 + 150, f1: S_5 + 200, k: 3.62 },
  // cut 6 (S 605-762): the held creep on the drivers (f15 -> f64); (PASS 2) the long pull-back with the
  // wave (the zoom f56 -> f130, the look f60 -> f136); the last image's creep
  { f0: S_6 + 15, f1: S_6 + 64, k: 3.9 },
  { f0: S_6 + 56, f1: S_6 + 130, k: K.wide, warp: 0.7 },
  { f0: S_6 + 60, f1: S_6 + 136, dx: 2, dy: LOOK.wide - LOOK.cars, warp: 1.8 },
  { f0: S_6 + 128, f1: S_6 + 190, k: 0.855 },
];
export const CAM_TRACK: Cam[] = cameraTrack(
  CAM_START,
  CAM_GLIDES.map((g) => ({ ...g, f0: g.f0 + CAM_PRE, f1: g.f1 + CAM_PRE })),
  S_END + CAM_PRE + 4,
).slice(CAM_PRE);
export const camAt = (S: number): Cam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(S)))];
export const CAM_REST: Cam = CAM_TRACK[0];
export const CAM_CHECK = camJerk(CAM_TRACK, S_END);
/** The camera's own k, interpolated (for continuous sub-frame solves). */
const camAtF = (S: number): Cam => {
  const a = Math.max(0, Math.min(CAM_TRACK.length - 2, Math.floor(S)));
  const t = clamp01(S - a);
  const A = CAM_TRACK[a];
  const B = CAM_TRACK[a + 1];
  return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), k: lerp(A.k, B.k, t) };
};
/** The wide rest, checked against the house framing helper: the berg's bottom on y 1395. */
{
  const want = camFor(AX, BOTTOM_Y, 540, 1395, K.wide);
  const got = cameraTrack({ x: AX, y: LOOK.wide, k: K.wide }, [], 2)[0];
  if (Math.abs(want.y - got.y) > 1e-6) fail("the wide look does not put the berg's bottom on y 1395");
}

// --- cut 6's amber wave: rank-timed (distance from the helmets + a hashed offset), never ahead of the frame
const amberKey = EVERYONE.map((p, i) => Math.hypot(p.x - AMBER_SRC[0], p.y - AMBER_SRC[1]) + (hashN(i, 17) - 0.5) * 22);
const AMBER_RANK_T = rankTimes(amberKey, AMBER_FRONT.S0, AMBER_FRONT.S1, AMBER_FRONT.p).times;
/** ...and never ahead of the eye: a person is reached no earlier than the frame shows them (screen y <=
 *  AMBER_EDGE), so while the camera pulls back the front waits at the frame's bottom edge; the end (the
 *  wide) is the designed, decelerating landing. */
const AMBER_EDGE = 1840;
const firstOnScreen = (y: number) => {
  for (let S = AMBER_FRONT.S0; S <= AMBER_FRONT.S1; S += 0.25) {
    const c = camAtF(S);
    if (960 + (y - c.y) * c.k <= AMBER_EDGE) return S;
  }
  return AMBER_FRONT.S1;
};
export const AMBER_T: number[] = EVERYONE.map((p, i) => Math.max(AMBER_RANK_T[i], firstOnScreen(p.y)));
export const amberTone = (idx: number, S: number) => smoothstep((S - AMBER_T[idx]) / TONE_F);
const IDX = { mech: 0, eng: MECHANICS.length, tip: MECHANICS.length + ENGINEERS.length, body: MECHANICS.length + ENGINEERS.length + TIP_CROWD.length };

// --- the reveal (cut 3): the waterline draws out from the axis past both frame edges and on beyond the
// berg; each body person it passes over (by |x - axis|) rises DARK -> board (13 f, a hashed 0-3 f delay) --
/** The waterline's half-length on the clock: out to the frame's edge (f20 -> f44, smoothstep, measured on
 *  the camera), then on past the berg at 90 px/f (off frame), then everywhere. */
const WATER_EDGE = (S: number) => {
  const c = camAt(S);
  return Math.abs(c.x - AX) + (540 + 24) / c.k;
};
export const waterHalfAt = (S: number) => {
  if (S <= WATER_DRAW[0]) return 0;
  if (S < WATER_DRAW[1]) return smoothstep((S - WATER_DRAW[0]) / (WATER_DRAW[1] - WATER_DRAW[0])) * WATER_EDGE(S);
  const h = WATER_EDGE(WATER_DRAW[1]) + 90 * (S - WATER_DRAW[1]);
  return h > 700 ? 1e5 : h;
};
const waterReach = (dx: number) => {
  let lo = WATER_DRAW[0];
  let hi = WATER_DRAW[1] + 12;
  for (let it = 0; it < 40; it++) {
    const m = (lo + hi) / 2;
    if (waterHalfAt(m) >= dx) hi = m;
    else lo = m;
  }
  return hi;
};
export const BODY_REVEAL_T: number[] = BODY_CROWD.map((p, i) => waterReach(Math.abs(p.x - AX)) + 3 * hashN(i, 23));
export const bodyBoard = (i: number, S: number) => smoothstep((S - BODY_REVEAL_T[i]) / 13);

// ===========================================================================
// THE READOUT — ONE instrument above the peak on the axis: HERO numeral, LABEL
// under it (SPACE.LOCKUP), CLEAR above the cars; counter-scaled (always its
// token in screen px). Tabular figures in every state (it counts). Three counts,
// each the honest number of glyphs its front has reached. PASS 2: no value ever
// sits: the display runs straight between the reach times (its floor is the
// count), the last step eases out, and the roll lands on the final value as the
// last person is reached.
// ===========================================================================
type Count = { base: number; S0: number; times: number[]; final: number };
const countOf = (base: number, S0: number, times: number[]): Count => ({ base, S0, times: [...times].sort((a, b) => a - b), final: base + times.length });
export const COUNT_TIP = countOf(16, LIGHT_FRONT.S0, LIGHT_T); // 2 drivers + 8 mechanics + 6 engineers are lit already
export const COUNT_BODY = countOf(150, BODY_DRAW.S0, BODY_T);
export const COUNT_AMBER = countOf(2, AMBER_FRONT.S0, AMBER_T);
export type Display = { v: number; blur: number };
const reached = (c: Count, S: number) => {
  let lo = 0;
  let hi = c.times.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (c.times[m] <= S) lo = m + 1;
    else hi = m;
  }
  return lo;
};
const valueAt = (c: Count, S: number) => {
  const N = c.times.length;
  if (S <= c.S0) return c.base;
  if (S >= c.times[N - 1]) return c.final;
  const n = reached(c, S);
  const t0 = n === 0 ? c.S0 : c.times[n - 1];
  const t1 = c.times[n];
  let x = clamp01((S - t0) / Math.max(1e-6, t1 - t0));
  if (n === N - 1) x = 1 - (1 - x) * (1 - x); // the last step lands with zero speed
  return c.base + n + x;
};
export const displayOf = (c: Count, S: number): Display => {
  const v = valueAt(c, S);
  const dv = Math.abs(valueAt(c, S + 0.5) - valueAt(c, S - 0.5));
  return { v, blur: Math.min(10, dv * 9) };
};
/** The landings (S) and the longest any non-final value is on screen without moving (it never is: the last
 *  step is the slowest, asserted <= 4 f end to end). */
export const LANDINGS = [COUNT_TIP, COUNT_BODY, COUNT_AMBER].map((c) => c.times[c.times.length - 1]);
export const LAST_STEP_F = [COUNT_TIP, COUNT_BODY, COUNT_AMBER].map((c) => c.times[c.times.length - 1] - c.times[c.times.length - 2]);
{
  LAST_STEP_F.forEach((h, i) => rule(h <= 4, `count ${i}: the last step takes ${h.toFixed(2)} f`));
  [COUNT_TIP, COUNT_BODY, COUNT_AMBER].forEach((c, i) => {
    const g = c.times.slice(-6).map((t, j, a) => (j ? t - a[j - 1] : 0)).slice(1);
    rule(g.every((d, j) => j === 0 || d >= g[j - 1] - 1e-9), `count ${i}: the last steps do not decelerate (${g.map((d) => d.toFixed(2)).join(" ")})`);
  });
  rule(LANDINGS[0] - S_3 >= 72 && LANDINGS[0] - S_3 <= 78, `"150" lands on cut 3 f${LANDINGS[0] - S_3}`);
  rule(LANDINGS[1] - S_5 >= 44 && LANDINGS[1] - S_5 <= 50, `"2,500" lands on cut 5 f${LANDINGS[1] - S_5}`);
  rule(LANDINGS[2] - S_6 >= 116 && LANDINGS[2] - S_6 <= 122, `"2,500" lands on cut 6 f${LANDINGS[2] - S_6}`);
  if (COUNT_TIP.final !== 150 || COUNT_BODY.final !== 2500 || COUNT_AMBER.final !== 2500) fail("a readout's final value is not 150 / 2,500 / 2,500");
}
export const fmt = (n: number) => {
  const s = `${Math.max(0, Math.floor(n))}`;
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/** The readout's states on the clock (cut frames in comments). */
export const RD = {
  in3: S_3 + 44, // the numeral rises above the peak at its honest 16 (cut 3 "it's about", f44 -> f56, lands on "150")
  label3: S_3 + 78, // AT THE TRACK blurs in, lands f90 ("go to the tracks")
  out5: S_5 + 82, // exits (the entrance reversed) f82 -> f94, before the glide to the cars arrives (PASS 2)
  in6: S_6 + 23, // "2" re-enters (amber), lands f35 ("superstars")
  label6: S_6 + 28, // SUPERSTARS lands f40
} as const;
const ENTER_F = 12;
const enterAt = (S: number, S0: number) => clamp01((S - S0) / ENTER_F);
/** The house entrance (stoutShared's): slide up 24 SCREEN px, fade, blur 6 -> 0; exit reverses. */
const entrance = (enter: number, exit: number) => {
  const a = easeOutCubic(enter);
  const e = 1 - Math.pow(1 - clamp01(exit), 3);
  return { lift: (1 - a) * 24 + e * 24, opacity: a * (1 - e), blur: 6 * (1 - a) + 6 * e };
};

// ===========================================================================
// THE LIGHT POOL — follows the subject with the camera's own lag.
// ===========================================================================
const POOL_STIFF = 0.09;
const POOL_DAMP = 0.468;
const TILE_C: P[] = [
  [AX - HUB.dx, HUB.y],
  [AX + HUB.dx, HUB.y],
];
const POOL_LEAN = 40; // cut 4's descent leans toward the left tile (world px)
const poolTarget = (S: number): P => {
  const way: { S0: number; S1: number; p: P }[] = [
    { S0: S_2 + 40, S1: S_2 + 80, p: [AX, PY + 30] }, // cut 2: drifts down to take in the pit wall
    { S0: S_3 + 44, S1: S_3 + 80, p: [AX, PY + 110] }, // cut 3: widens from the cars down through the tip
    { S0: S_4 + 2, S1: S_4 + 40, p: [AX - POOL_LEAN, WY + 80] }, // cut 4: follows down, held off the tiles (leaning left)
    { S0: S_4 + 44, S1: S_4 + 66, p: TILE_C[0] }, // onto the left tile through the pause
    { S0: S_4 + 95, S1: S_4 + 110, p: TILE_C[1] }, // onto the right tile
    { S0: S_4 + 124, S1: S_4 + 150, p: [AX, HUB.y + 8] }, // the pair
    { S0: S_5 + 0, S1: S_5 + 50, p: [AX, PY + 470] }, // cut 5: the whole berg
    { S0: S_5 + 97, S1: S_5 + 135, p: [AX, PY - 6] }, // back to the two cars
    { S0: S_6 + 66, S1: S_6 + 112, p: [AX, PY + 470] }, // cut 6: with the wave, to the whole berg
  ];
  let p: P = [AX, PY - 6];
  for (const w of way) {
    const e = smoothstep((S - w.S0) / (w.S1 - w.S0));
    p = [lerp(p[0], w.p[0], e), lerp(p[1], w.p[1], e)];
  }
  return p;
};
export const POOL_TRACK: P[] = (() => {
  const out: P[] = [];
  let p = poolTarget(-40);
  let v: P = [0, 0];
  for (let S = -40; S <= S_END + 1; S++) {
    const t = poolTarget(S);
    v = [v[0] + (t[0] - p[0]) * POOL_STIFF - v[0] * POOL_DAMP, v[1] + (t[1] - p[1]) * POOL_STIFF - v[1] * POOL_DAMP];
    p = [p[0] + v[0], p[1] + v[1]];
    if (S >= 0) out.push(p);
  }
  return out;
})();
const poolAt = (S: number): P => POOL_TRACK[Math.max(0, Math.min(POOL_TRACK.length - 1, Math.round(S)))];
/** The hub tiles stay in the DARK (with the dark crowd) until cut 4: on "two hubs" the light pool's
 *  OUTER EDGE (its screen ellipse POOL.rx x POOL.ry scaled by POOL_EDGE) reaches each tile as the look
 *  descends onto them, and it rises DARK -> board over 13 f; the pool leans a little left on its way
 *  down, so the left tile is reached first and the right ~4 f later. */
const POOL_EDGE = 0.7; // the pool's outer edge: 0.7 of its screen ellipse (its gradient's visible rim)
const tileInPool = (i: number, S: number) => {
  const p = poolAt(S);
  const c = camAt(S);
  const dx = ((TILE_C[i][0] - p[0]) * c.k) / (POOL.rx * POOL_EDGE);
  const dy = ((TILE_C[i][1] - p[1]) * c.k) / (POOL.ry * POOL_EDGE);
  return dx * dx + dy * dy <= 1;
};
export const TILE_REVEAL_T: number[] = TILE_C.map((_, i) => {
  for (let S = S_4; S <= S_5; S += 0.25) if (tileInPool(i, S)) return S;
  return fail(`the pool's edge never reaches tile ${i}`);
});
{
  const [a, b] = TILE_REVEAL_T.map((S) => S - S_4);
  rule(a >= 22 && a <= 32 && b - a >= 3 && b - a <= 6, `the tiles rise on f${a.toFixed(1)} / f${b.toFixed(1)} (want ~f24-36, left first, ~4 f apart)`);
}
/** A hub tile lifts board -> cream when the pool reaches it (within TILE_REACH world px). */
const TILE_REACH = 14;
export const TILE_LIT: number[] = TILE_C.map((c, i) => {
  for (let S = S_4 + (i === 0 ? 44 : 95); S <= S_END; S++) {
    const p = poolAt(S);
    if (Math.hypot(p[0] - c[0], p[1] - c[1]) < TILE_REACH) return S;
  }
  return fail(`the pool never reaches tile ${i}`);
});
export const HUB_LABEL_IN = TILE_LIT.map((S) => S + 2);
/** Cut 5: ENGINE / CHASSIS exit as the camera passes k 1.6 on the pull-back. */
export const HUB_LABEL_OUT = (() => {
  for (let S = S_5; S < S_6; S++) if (camAt(S).k <= 1.6) return S;
  return fail("the pull-back never passes k 1.6");
})();

// ===========================================================================
// LOAD-TIME CHECKS: the camera (|dv|), heads under 45 px/f at k >= 2, the
// cars' gap, the caption band at cut 1.
// ===========================================================================
{
  rule(CAM_CHECK.maxA <= 2.5, `camera |dv| ${CAM_CHECK.maxA.toFixed(2)} px/f^2 at S ${CAM_CHECK.at}`);
  for (let S = 1; S <= 40; S++) {
    for (const car of [0, 1] as const) {
      const a = toScreen(camAt(S - 1), carTail(car, S - 1) + CAR_L, PY);
      const b = toScreen(camAt(S), carTail(car, S) + CAR_L, PY);
      rule(Math.hypot(b.x - a.x, b.y - a.y) <= 46, `car ${car} moves ${Math.hypot(b.x - a.x, b.y - a.y).toFixed(1)} px on S ${S}`);
    }
    const gap = carTail(1, S) - (carTail(0, S) + CAR_L);
    rule(gap >= 4.5, `the cars' gap ${gap.toFixed(2)} on S ${S}`);
  }
  // cut 2: every mechanic under 45 screen px/f, and no two ever touch on the way in
  for (let S = S_2 - 16; S <= S_2 + 34; S++) {
    MECHANICS.forEach((m, i) => {
      const a = toScreen(camAt(S - 1), mechX(i, S - 1), m.y);
      const b = toScreen(camAt(S), mechX(i, S), m.y);
      rule(Math.abs(b.x - a.x) <= 46 || S < MECH_MOVE[i].start, `mechanic ${i} moves ${Math.abs(b.x - a.x).toFixed(1)} px on S ${S}`);
      MECHANICS.forEach((q, j) => {
        if (j > i) rule(Math.abs(mechX(i, S) - mechX(j, S)) >= 12.4, `mechanics ${i} and ${j} touch on S ${S}`);
      });
    });
  }
  // cut 1: the tip crowd stays under the caption line (y 1400) at the close framing
  for (let S = 0; S <= S_2; S++) {
    const y = toScreen(camAt(S), AX, PY + CROWD_TOP - GLYPH / 2).y - 5;
    rule(y >= 1400, `the tip crowd shows above y 1400 at S ${S} (${y.toFixed(0)})`);
  }
}

// ===========================================================================
// DRAWING
// ===========================================================================
/** The house elevation shadow for an object of extent `size` (world px, its geometric mean): the
 *  recipe is for TILE-scale objects, so offsets and blurs scale by size / TILE. ElevationShadow is
 *  drawn about `o` scaled by s, the silhouette pre-scaled by 1 / s. */
const shadowScale = (size: number) => size / GEO.TILE;
const ScaledShadow: React.FC<{
  o: P;
  s: number;
  sil: (map: Map2) => Silhouette;
  elevation?: "rest" | "lifted" | "float";
  lift?: number;
  contact?: { x: number; w: number } | null;
  floorY?: number;
  strength?: number;
}> = ({ o, s, sil, elevation = "rest", lift = 0, contact = null, floorY = PY, strength = 1 }) => {
  const pre: Map2 = (x, y) => [o[0] + (x - o[0]) / s, o[1] + (y - o[1]) / s];
  return (
    <g transform={`translate(${fx(o[0])} ${fx(o[1])}) scale(${fx(s)}) translate(${fx(-o[0])} ${fx(-o[1])})`}>
      <ElevationShadow
        silhouette={sil(pre)}
        elevation={elevation}
        lift={lift}
        contact={contact ? { x: pre(contact.x, 0)[0], y: pre(0, floorY)[1], w: contact.w / s } : null}
        strength={strength}
      />
    </g>
  );
};
/** The crowd's glyph shadow: the rest elevation's two layers scaled to the glyph, as ONE filter on the
 *  group (= one shadow per glyph, never stacked on itself). */
const GLYPH_S = shadowScale(GLYPH);
const GlyphShadowFilter: React.FC<{ id: string }> = ({ id }) => {
  const E = ELEVATION.rest;
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="112%" colorInterpolationFilters="sRGB">
      {[
        ["a", E.amb],
        ["k", E.key],
      ].map(([n, l]) => {
        const L = l as typeof E.amb;
        return (
          <React.Fragment key={n as string}>
            <feGaussianBlur in="SourceAlpha" stdDeviation={f3(L.blur * GLYPH_S)} result={`${n}b`} />
            <feOffset in={`${n}b`} dx={f3(L.dx * GLYPH_S)} dy={f3(L.dy * GLYPH_S)} result={`${n}o`} />
            <feFlood floodColor={COLOR.shadow} floodOpacity={L.a} result={`${n}f`} />
            <feComposite in={`${n}f`} in2={`${n}o`} operator="in" result={`${n}s`} />
          </React.Fragment>
        );
      })}
      <feMerge>
        <feMergeNode in="as" />
        <feMergeNode in="ks" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
};
/** Every amber PERSON is the same amber ("I treat all of them equally"): the accent's top tone, the
 *  numeral's own colour, never shaded by height. (The helmets keep the band gradient + hot edge.) */
const AMBER_PERSON = COLOR.amberTop;

// --- the car ---------------------------------------------------------------------------------------
const CAR_SHADOW_S = shadowScale(Math.sqrt(CAR_L * CAR_H));
const Car: React.FC<{ tailX: number; k: number; amber: number; band: [number, number] }> = ({ tailX, k, amber, band }) => {
  const uid = `ic${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const gap = 0.05 * PXM;
  const hot = EDGE.HOT / k;
  const hx = HELMET.x * PXM;
  const hy = PY - HELMET.y * PXM;
  const hr = HELMET.r * PXM;
  return (
    <g>
      <ScaledShadow
        o={[tailX + CAR_L / 2, PY]}
        s={CAR_SHADOW_S}
        sil={(pre) => CAR_SIL_CMDS.map((c) => ({ d: pathOf(c, (x, y) => { const w = carMap(x, y); return pre(w[0] + tailX, w[1]); }) }))}
        contact={{ x: tailX + CAR_L / 2, w: CAR_L * 0.9 }}
      />
      <g transform={`translate(${fx(tailX)} 0)`}>
        <defs>
          <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(Y_TOP)} x2="0" y2={f3(PY)}>
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
          <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
          <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={-10} y={Y_TOP - 10} width={CAR_L + 20} height={CAR_H + 20}>
            <rect x={-10} y={Y_TOP - 10} width={CAR_L + 20} height={CAR_H + 20} fill="#fff" />
            {WHEELS.map(([x, y], i) => (
              <circle key={i} cx={f3(x * PXM)} cy={f3(PY - y * PXM)} r={f3(WHEEL_R * PXM + gap)} fill="#000" />
            ))}
          </mask>
          <clipPath id={`${uid}h`}>
            <path d={CAR_D.helmet} />
          </clipPath>
          <linearGradient id={`${uid}hf`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hy - hr)} x2="0" y2={f3(hy - hr + EDGE.HOT_FALL / k)}>
            <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
            <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* the driver: a helmet in the cockpit (behind the body's rim), cream warming to amber */}
        <path d={CAR_D.helmet} fill={COLOR.cream} />
        {amber > 0.001 ? (
          <g opacity={f3(amber)}>
            <g style={{ filter: bloomFilter(k) }}>
              <path d={CAR_D.helmet} fill={`url(#${uid}a)`} />
            </g>
            <g clipPath={`url(#${uid}h)`}>
              <rect x={f3(hx - hr)} y={f3(hy - hr)} width={f3(2 * hr)} height={f3(EDGE.HOT_FALL / k)} fill={`url(#${uid}hf)`} />
              <path
                d={`M${f3(hx - hr * 0.8)} ${f3(hy - hr * 0.6)}A${f3(hr - hot / 2)} ${f3(hr - hot / 2)} 0 0 1 ${f3(hx + hr * 0.8)} ${f3(hy - hr * 0.6)}`}
                fill="none"
                stroke={COLOR.amberHot}
                strokeWidth={f3(hot)}
              />
            </g>
          </g>
        ) : null}
        <g clipPath={`url(#${uid}h)`}>
          <path d={CAR_D.visor} fill={COLOR.inkDark} />
        </g>
        {/* the car: body, wings, pillar, halo (the wheels knocked out of them by a ring), then the wheels */}
        <g fill={`url(#${uid}c)`} mask={`url(#${uid}m)`}>
          <path d={CAR_D.body} />
          <path d={CAR_D.pillar} />
          <path d={CAR_D.wingR} />
          <path d={CAR_D.wingF} />
        </g>
        <path d={CAR_D.halo} fill={`url(#${uid}c)`} />
        {CAR_D.wheels.map((d, i) => (
          <path key={i} d={d} fill={`url(#${uid}c)`} />
        ))}
        {WHEELS.map(([x, y], i) => (
          <circle key={i} cx={f3(x * PXM)} cy={f3(PY - y * PXM)} r={f3(0.17 * PXM)} fill="none" stroke={COLOR.inkDark} strokeWidth={f3(0.055 * PXM)} />
        ))}
        <g fill={COLOR.inkDark}>
          {CAR_D.ink.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </g>
    </g>
  );
};
/** The car silhouette (one figure) for a knock-out: metres mapped into a box; wheels ringed. */
const ChassisFigure: React.FC<{ map: Map2; ring: number }> = ({ map, ring }) => (
  <g>
    <g fill="#000">
      {CAR_SIL_CMDS.slice(0, 6).map((c, i) => (
        <path key={i} d={pathOf(c, map)} />
      ))}
    </g>
    <g fill="#fff">
      {WHEELS.map(([x, y], i) => (
        <path key={i} d={pathOf(circleCmds(x, y, WHEEL_R + ring), map)} />
      ))}
    </g>
    <g fill="#000">
      {WHEELS.map(([x, y], i) => (
        <path key={i} d={pathOf(circleCmds(x, y, WHEEL_R), map)} />
      ))}
    </g>
  </g>
);

// --- the hub tiles -----------------------------------------------------------------------------------
/** ENGINE: the classic engine-block silhouette on a 24 box (block, stepped valve cover + cap, intake
 *  with its flange, exhaust stub, mount), knocked out. */
const ENGINE_RECTS: [number, number, number, number][] = [
  [6, 9.2, 18, 18.6], // block
  [7.4, 6.4, 16.6, 8.6], // valve cover (the step)
  [10, 4.4, 14, 5.9], // its cap
  [2.6, 10.6, 6, 14.8], // intake
  [1.4, 9.6, 2.6, 15.8], // its flange
  [18, 12.6, 21.4, 15], // exhaust stub
  [9.6, 18.6, 14.4, 20.4], // mount
];
const ENGINE_BOX = { x0: 1.4, y0: 4.4, x1: 21.4, y1: 20.4 };
const HubTile: React.FC<{ cx: number; cy: number; k: number; dim: number; dark: number; figure: "engine" | "chassis" }> = ({ cx, cy, k, dim, dark, figure }) => {
  const uid = `ih${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const T = HUB.size;
  const x = cx - T / 2;
  const y = cy - T / 2;
  const r = GEO.RADIUS;
  // the figure by the family's optical rule (CREST_FILL with optical corrections, stoutShared opticalFit)
  const fig = (() => {
    if (figure === "engine") {
      const w = ENGINE_BOX.x1 - ENGINE_BOX.x0;
      const h = ENGINE_BOX.y1 - ENGINE_BOX.y0;
      const fit = opticalFit(w, h, 0.62, 0, T);
      const ox = x + fit.cx - (ENGINE_BOX.x0 + w / 2) * fit.sc;
      const oy = y + fit.cy - (ENGINE_BOX.y0 + h / 2) * fit.sc;
      return (
        <g fill="#000">
          {ENGINE_RECTS.map(([a, b, c, d], i) => (
            <path key={i} d={rectPath(ox + a * fit.sc, oy + b * fit.sc, (c - a) * fit.sc, (d - b) * fit.sc, 0.5 * fit.sc)} />
          ))}
        </g>
      );
    }
    const w = CHASSIS_BOX.x1 - CHASSIS_BOX.x0;
    const h = CHASSIS_BOX.y1 - CHASSIS_BOX.y0;
    const fit = opticalFit(w, h, 0.42, 0, T);
    const ox = x + fit.cx - (CHASSIS_BOX.x0 + w / 2) * fit.sc;
    const oy = y + fit.cy + (CHASSIS_BOX.y0 + h / 2) * fit.sc;
    return <ChassisFigure map={(mx, my) => [ox + mx * fit.sc, oy - my * fit.sc]} ring={0.07} />;
  })();
  // dark (PASS 2): 1 = in the DARK with the crowd (until the waterline reveals it), 0 = its board / cream
  const loEdge = lerp(ALPHA.edge, ALPHA.edgeBoard, dim) * (1 - dark);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y)} x2="0" y2={f3(y + T)}>
          <stop offset="0" stopColor={mixHex(mixHex(COLOR.cream, COLOR.board, dim), DARK, dark)} />
          <stop offset="1" stopColor={mixHex(mixHex(COLOR.creamFoot, COLOR.boardFoot, dim), DARK, dark)} />
        </linearGradient>
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={x} y={y} width={T} height={T}>
          <rect x={x} y={y} width={T} height={T} fill="#fff" />
          {/* in the DARK the tile is a plain dark square: its figure is knocked out only as it rises */}
          <g opacity={f3(1 - dark)}>{fig}</g>
        </mask>
      </defs>
      <ScaledShadow
        o={[cx, cy]}
        s={shadowScale(T)}
        strength={1 - dark}
        sil={(pre) => [{ d: pathOf([["M", x, y], ["L", x + T, y], ["L", x + T, y + T], ["L", x, y + T], ["Z"]], pre) }]}
      />
      <path d={rectPath(x, y, T, T, r)} fill={`url(#${uid}g)`} mask={`url(#${uid}k)`} />
      <path d={`M${f3(x + r)} ${f3(y + EDGE.CREAM / k / 2)}H${f3(x + T - r)}`} stroke={COLOR.edge} strokeOpacity={loEdge} strokeWidth={f3(EDGE.CREAM / k)} />
    </g>
  );
};

// --- the counting numeral -------------------------------------------------------------------------
const toneFill = (tone: "cream" | "amber") => (tone === "amber" ? COLOR.amberTop : COLOR.inkCream);
const advOf = (c: string, fs: number) => (/\d/.test(c) ? TNUM_ADV * fs : numeralWidth(c, fs)) + TRACK.numeral * fs;
/** Lays a string out on tabular advances, centred on x: each character's centre. */
const layout = (s: string, x: number, fs: number) => {
  const w = [...s].map((c) => advOf(c, fs));
  const total = w.reduce((a, b) => a + b, 0) - TRACK.numeral * fs;
  let cx = x - total / 2;
  return [...s].map((c, i) => {
    const xc = cx + w[i] / 2 - (TRACK.numeral * fs) / 2;
    cx += w[i];
    return { c, x: xc };
  });
};
/** CountNumeral: rolling (same-length strings roll per character by the fraction, which the count itself
 *  eases, so the last step lands softly; a change of length swaps whole centred strings). Every
 *  moving state is seen through ONE line (stoutActA's DrumTurn grammar): opaque over the glyphs' rest
 *  extents, feathered above, its floor just under the comma's tail, so an incoming figure rises out
 *  of the floor and never enters the label's lane below. Old and new figures sit one pitch (1.22 em) apart: never both whole.
 *  Tabular throughout. */
const ROLL = { CORE_UP: 0.838, CORE_DOWN: 0.11, FEATHER: 0.25, PITCH: 1.22 } as const;
const CountNumeral: React.FC<{ x: number; y: number; k: number; d: Display; tone: "cream" | "amber"; enter: number; exit: number }> = ({
  x,
  y,
  k,
  d,
  tone,
  enter,
  exit,
}) => {
  const uid = `cn${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const en = entrance(enter, exit);
  if (en.opacity <= 0.002) return null;
  const fs = TYPE.HERO / k;
  const yy = y + en.lift / k;
  const fill = toneFill(tone);
  const filters: string[] = [];
  if (en.blur > 0.05) filters.push(`blur(${f3(en.blur / k)}px)`);
  if (tone === "amber") filters.push(bloomFilter(k));
  const style: React.CSSProperties = { filter: filters.length ? filters.join(" ") : undefined };
  const txt = (key: string | number, s: string, xc: number, yc: number) => (
    <text key={key} x={f3(xc)} y={f3(yc)} textAnchor="middle">
      {s}
    </text>
  );
  const font = { fontFamily: FONT_NUM, fontWeight: 700, fontSize: f3(fs), fill, style: { fontFeatureSettings: '"tnum" 1, "lnum" 1' } as React.CSSProperties };
  const pitch = fs * ROLL.PITCH;
  // [from, to, u] (u = 0: from at rest; 1: to at rest); `perChar` rolls only the characters that change
  const from = fmt(Math.floor(d.v));
  const to = fmt(Math.floor(d.v) + 1);
  const u = d.v - Math.floor(d.v);
  const perChar = from.length === to.length;
  const moving = u > 1e-4 && u < 1 - 1e-4;
  if (!moving) {
    return (
      <g opacity={f3(en.opacity)} style={style}>
        <g {...font}>{layout(u >= 1 - 1e-4 ? to : from, x, fs).map((g, i) => txt(i, g.c, g.x, yy))}</g>
      </g>
    );
  }
  const A = layout(from, x, fs);
  const B = layout(to, x, fs);
  const y0 = yy - (ROLL.CORE_UP + ROLL.FEATHER) * fs;
  const y1 = yy - ROLL.CORE_UP * fs;
  const y2 = yy + ROLL.CORE_DOWN * fs;
  const y3 = y2 + 1.5 / k; // the line's floor: a figure rises out of it (the label's lane starts below)
  const mx = x - 6 * fs;
  const mw = 12 * fs;
  const blur = d.blur;
  return (
    <g opacity={f3(en.opacity)} style={style}>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y3)}>
          <stop offset="0" stopColor="#000" />
          <stop offset={f3((y1 - y0) / (y3 - y0))} stopColor="#fff" />
          <stop offset={f3((y2 - y0) / (y3 - y0))} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(mx)} y={f3(y0)} width={f3(mw)} height={f3(y3 - y0)}>
          <rect x={f3(mx)} y={f3(y0)} width={f3(mw)} height={f3(y3 - y0)} fill={`url(#${uid}g)`} />
        </mask>
        {blur > 0.05 ? (
          <filter id={`${uid}b`} x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${f3(blur / k)}`} />
          </filter>
        ) : null}
      </defs>
      <g {...font} mask={`url(#${uid}m)`}>
        {perChar ? (
          A.map((g, i) =>
            g.c === to[i] ? (
              txt(i, g.c, g.x, yy)
            ) : (
              <g key={i} filter={blur > 0.05 ? `url(#${uid}b)` : undefined}>
                {txt("o", g.c, g.x, yy - pitch * u)}
                {txt("n", to[i], B[i].x, yy + pitch * (1 - u))}
              </g>
            ),
          )
        ) : (
          <g filter={blur > 0.05 ? `url(#${uid}b)` : undefined}>
            {A.map((g, i) => txt(`o${i}`, g.c, g.x, yy - pitch * u))}
            {B.map((g, i) => txt(`n${i}`, g.c, g.x, yy + pitch * (1 - u)))}
          </g>
        )}
      </g>
    </g>
  );
};
/** A caps label that rolls from one word to another through a feathered line (cut 5's AT THE TRACK ->
 *  PEOPLE), the drum turn's grammar at LABEL size; at u 0 / 1 it is the plain Label. */
const LabelRoll: React.FC<{ x: number; y: number; k: number; from: string; to: string; u: number; exit: number }> = ({ x, y, k, from, to, u, exit }) => {
  const uid = `lr${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (u <= 0) return <Label x={x} y={y} k={k} text={from} tone="creamLo" exit={exit} />;
  if (u >= 1) return <Label x={x} y={y} k={k} text={to} tone="creamLo" exit={exit} />;
  const fs = TYPE.LABEL / k;
  const pitch = fs * 1.5;
  // the label's own lane: its top is the cap line (a word rolls up into it and is gone), soft below
  const y1 = y - 0.72 * fs;
  const y0 = y1 - 1.5 / k;
  const y2 = y + 0.05 * fs;
  const y3 = y + (0.05 + 0.35) * fs;
  const comp = (TRACK.label * fs) / 2;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y3)}>
          <stop offset="0" stopColor="#000" />
          <stop offset={f3((y1 - y0) / (y3 - y0))} stopColor="#fff" />
          <stop offset={f3((y2 - y0) / (y3 - y0))} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(x - 20 * fs)} y={f3(y0)} width={f3(40 * fs)} height={f3(y3 - y0)}>
          <rect x={f3(x - 20 * fs)} y={f3(y0)} width={f3(40 * fs)} height={f3(y3 - y0)} fill={`url(#${uid}g)`} />
        </mask>
      </defs>
      <g
        mask={`url(#${uid}m)`}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={f3(fs)}
        letterSpacing={`${TRACK.label}em`}
        textAnchor="middle"
        fill={COLOR.inkCreamLo}
        style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
      >
        <text x={f3(x + comp)} y={f3(y - pitch * smoothstep(u))}>
          {from.toUpperCase()}
        </text>
        <text x={f3(x + comp)} y={f3(y + pitch * (1 - smoothstep(u)))}>
          {to.toUpperCase()}
        </text>
      </g>
    </g>
  );
};

// --- the glass ------------------------------------------------------------------------------------------
const polyD = (pts: P[], close = false) => `M${pts.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}${close ? "Z" : ""}`;
/** A flank (monotone in y) cut at y. */
const flankTo = (pts: P[], y: number): P[] => {
  const out: P[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = out[out.length - 1];
    const [x1, y1] = pts[i];
    if (y1 <= y) out.push(pts[i]);
    else {
      if (y > y0) out.push([x0 + ((x1 - x0) * (y - y0)) / (y1 - y0), y]);
      break;
    }
  }
  return out;
};
const lengthOf = (pts: P[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
/** The tip's flanks drawn to a fraction of their length (the stroke-dash progress, as y). */
const tipDrawY = (u: number) => {
  if (u <= 0) return PY;
  if (u >= 1) return WY;
  // the same arc-length fraction on both flanks, expressed as the left flank's y
  const target = lengthOf(TIP_LEFT) * u;
  let acc = 0;
  for (let i = 1; i < TIP_LEFT.length; i++) {
    const seg = Math.hypot(TIP_LEFT[i][0] - TIP_LEFT[i - 1][0], TIP_LEFT[i][1] - TIP_LEFT[i - 1][1]);
    if (acc + seg >= target) return lerp(TIP_LEFT[i - 1][1], TIP_LEFT[i][1], (target - acc) / seg);
    acc += seg;
  }
  return WY;
};

/** An engineer: the person glyph wearing a headset, all in one tone (so it warms with the person). */
const HEADSET = { gap: 1.0, w: 0.7, cup: 0.8 };
const Engineer: React.FC<{ id: string; x: number; y: number; fill: string; opacity?: number }> = ({ id, x, y, fill, opacity = 1 }) => {
  const cy = y + HEAD.cy;
  const R = HEAD.r + HEADSET.gap;
  const at = (deg: number): P => [x + R * Math.cos((deg * Math.PI) / 180), cy + R * Math.sin((deg * Math.PI) / 180)];
  const a0 = at(160);
  const a1 = at(20);
  return (
    <g opacity={opacity < 1 ? f3(opacity) : undefined}>
      <use href={`#${id}`} x={f3(x)} y={f3(y)} fill={fill} />
      <path
        d={`M${f3(a0[0])} ${f3(a0[1])}A${f3(R)} ${f3(R)} 0 1 1 ${f3(a1[0])} ${f3(a1[1])}M${f3(a1[0])} ${f3(a1[1])}L${f3(a1[0] + 1.15)} ${f3(a1[1] + 1.55)}`}
        fill="none"
        stroke={fill}
        strokeWidth={HEADSET.w}
        strokeLinecap="round"
      />
      <circle cx={f3(a0[0])} cy={f3(a0[1])} r={HEADSET.cup} fill={fill} />
      <circle cx={f3(a1[0])} cy={f3(a1[1])} r={HEADSET.cup} fill={fill} />
    </g>
  );
};

// ===========================================================================
// THE WORLD AT STORY TIME S
// ===========================================================================
export const IcebergWorld: React.FC<{ S: number }> = ({ S }) => {
  const uid = `iw${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const cam = camAt(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const pool = poolAt(S);
  const sw = { dx: 3 * Math.sin(S / 23), dy: 5 * Math.sin(S / 19) };
  const onScreen = (x: number, y: number, m = 16) => {
    const p = toScreen(cam, x, y);
    return p.x + sw.dx > -m && p.x + sw.dx < 1080 + m && p.y + sw.dy > -m && p.y + sw.dy < 1920 + m;
  };
  const m0 = (GLYPH / 2 + 4) * k;

  // --- the glass: the floor (plateau) always; the tip's flanks (cut 3); the body's flanks (cut 5) ---
  const tipU = smoothstep((S - TIP_DRAW[0]) / (TIP_DRAW[1] - TIP_DRAW[0]));
  const tipY = tipDrawY(tipU);
  const bodyY = S < BODY_DRAW.S0 ? WY : bodyFrontY(S);
  const hair = STROKE.HAIRLINE / k;
  // the waterline runs from the axis out past both frame edges and stays beyond them
  const waterHalf = waterHalfAt(S);

  // --- tones ---
  const S6 = S >= AMBER_FRONT.S0 - 1;
  const baseUses: React.ReactNode[] = [];
  const amberUses: React.ReactNode[] = [];
  const sweepUses: React.ReactNode[] = [];
  TIP_CROWD.forEach((p, i) => {
    if (!onScreen(p.x, p.y, m0)) return;
    const t = lightTone(i, S);
    baseUses.push(<use key={`t${i}`} href={`#${uid}b`} x={f3(p.x)} y={f3(p.y)} fill={mixHex(DARK, COLOR.cream, t)} />);
    if (S6) {
      const a = amberTone(IDX.tip + i, S);
      if (a > 0.002) amberUses.push(<use key={`ta${i}`} href={`#${uid}b`} x={f3(p.x)} y={f3(p.y)} fill={AMBER_PERSON} opacity={f3(a)} />);
      if (a > 0.5) sweepUses.push(<use key={`ts${i}`} href={`#${uid}b`} x={f3(p.x)} y={f3(p.y)} />);
    }
  });
  BODY_CROWD.forEach((p, i) => {
    if (!onScreen(p.x, p.y, m0)) return;
    baseUses.push(<use key={`b${i}`} href={`#${uid}b`} x={f3(p.x)} y={f3(p.y)} fill={mixHex(DARK, COLOR.board, bodyBoard(i, S))} />);
    if (S6) {
      const a = amberTone(IDX.body + i, S);
      if (a > 0.002) amberUses.push(<use key={`ba${i}`} href={`#${uid}b`} x={f3(p.x)} y={f3(p.y)} fill={AMBER_PERSON} opacity={f3(a)} />);
      if (a > 0.5) sweepUses.push(<use key={`bs${i}`} href={`#${uid}b`} x={f3(p.x)} y={f3(p.y)} />);
    }
  });

  // --- the hubs ---
  const tileDim = (i: number) => 1 - smoothstep((S - TILE_LIT[i]) / RUNG_F);
  const tileDark = (i: number) => 1 - smoothstep((S - TILE_REVEAL_T[i]) / 13);
  const hubLabelY = HUB.y + HUB.size / 2 + (SPACE.CLEAR + TYPE.LABEL * METRIC.cap) / k;
  const hubOut = enterAt(S, HUB_LABEL_OUT);

  // --- the pit wall ---
  const dy = engDy(S);
  const terraceU = smoothstep((S - PIT_RISE.terrace[0]) / (PIT_RISE.terrace[1] - PIT_RISE.terrace[0]));
  const slotOn = smoothstep((S - PIT_RISE.terrace[1] + 4) / 8);
  const pitVisible = S >= PIT_RISE.terrace[0];
  const pitLift = S > PIT_RISE.bar[0] && S < PIT_RISE.bar[1] + 6 ? Math.sin(Math.PI * clamp01((S - PIT_RISE.bar[0]) / (PIT_RISE.bar[1] + 6 - PIT_RISE.bar[0]))) : 0;
  const barTop = PIT.top + barDy(S);
  const barVis = Math.max(0, PIT.bot - barTop);
  const pitR = GEO.RADIUS * shadowScale(Math.sqrt((PIT.x1 - PIT.x0) * (PIT.bot - PIT.top)));

  // --- the readout ---
  const labelY = Y_TOP - SPACE.CLEAR / k;
  const numY = labelY - (TYPE.LABEL * METRIC.cap + SPACE.LOCKUP) / k;
  const readout = (() => {
    if (S < RD.in3) return null;
    if (S < S_6) {
      const enter = enterAt(S, RD.in3);
      const exit = enterAt(S, RD.out5);
      if (exit >= 1) return null;
      const inBody = S >= COUNT_BODY.S0;
      const d = inBody ? displayOf(COUNT_BODY, S) : displayOf(COUNT_TIP, S);
      // the label rolls AT THE TRACK -> PEOPLE through its own lane as "2,500" lands (14 f)
      const labelU = smoothstep((S - (LANDINGS[1] - 9)) / 14);
      return (
        <g>
          <CountNumeral x={AX} y={numY} k={k} d={d} tone="cream" enter={enter} exit={exit} />
          {inBody ? (
            <LabelRoll x={AX} y={labelY} k={k} from="at the track" to="people" u={labelU} exit={exit} />
          ) : (
            <Label x={AX} y={labelY} k={k} text="at the track" tone="creamLo" enter={enterAt(S, RD.label3)} />
          )}
        </g>
      );
    }
    const enter = enterAt(S, RD.in6);
    return (
      <g>
        <CountNumeral x={AX} y={numY} k={k} d={displayOf(COUNT_AMBER, S)} tone="amber" enter={enter} exit={0} />
        <Label x={AX} y={labelY} k={k} text="superstars" tone="creamLo" enter={enterAt(S, RD.label6)} />
      </g>
    );
  })();

  // --- the one click (cut 6): a LightSweep across the whole amber iceberg and the numeral ---
  const SWEEP_AT = [S_6 + 121, S_6 + 143] as const;
  const sweepT = (S - SWEEP_AT[0]) / (SWEEP_AT[1] - SWEEP_AT[0]);
  const sweepBox = { x: AX - 580, y: numY - (TYPE.HERO * METRIC.fig) / k - 10, w: 1160, h: BOTTOM_Y + 10 - (numY - (TYPE.HERO * METRIC.fig) / k - 10) };

  return (
    <StoutStage S={S} cam={cam} rest={CAM_REST} pool={{ x: pool[0], y: pool[1] }}>
      <defs>
        <path id={`${uid}b`} d={BUST_D} />
        <GlyphShadowFilter id={`${uid}gs`} />
        <clipPath id={`${uid}tipc`}>
          <rect x={AX - 600} y={PY} width={1200} height={Math.max(0, tipY - PY)} />
        </clipPath>
        <clipPath id={`${uid}bodyc`}>
          <rect x={AX - 600} y={WY} width={1200} height={Math.max(0, bodyY - WY)} />
        </clipPath>
        <clipPath id={`${uid}pit`}>
          <rect x={AX - 200} y={PY} width={400} height={PIT.bot - PY} />
        </clipPath>
      </defs>

      {/* the glass tint, revealed with its outline */}
      <path d={polyD([...TIP_RIGHT, ...[...TIP_LEFT].reverse()], true)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} clipPath={`url(#${uid}tipc)`} />
      <path d={polyD([...BODY_RIGHT, ...[...BODY_LEFT].reverse().slice(1)], true)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} clipPath={`url(#${uid}bodyc)`} />

      {/* the waterline: one rule, drawn from the axis out past both edges (cut 3) */}
      {waterHalf > 0.5 ? (
        <line x1={f3(AX - waterHalf)} x2={f3(AX + waterHalf)} y1={WY} y2={WY} stroke={COLOR.rule} strokeWidth={f3(STROKE.RULE / k)} />
      ) : null}

      {/* the crowds: one glyph each, one shadow each (the group filter), tone by the fronts */}
      <g filter={`url(#${uid}gs)`}>{baseUses}</g>
      {amberUses.length ? <g style={{ filter: bloomFilter(k) }}>{amberUses}</g> : null}

      {/* the two hubs (cut 4): board tiles that lift to cream when the pool reaches them */}
      {[0, 1].map((i) => (
        <HubTile key={i} cx={TILE_C[i][0]} cy={TILE_C[i][1]} k={k} dim={tileDim(i)} dark={tileDark(i)} figure={i === 0 ? "engine" : "chassis"} />
      ))}
      {[0, 1].map((i) => (
        <Label key={i} x={TILE_C[i][0]} y={hubLabelY} k={k} text={i === 0 ? "engine" : "chassis"} tone="cream" enter={enterAt(S, HUB_LABEL_IN[i])} exit={hubOut} />
      ))}

      {/* the pit wall: rises out of its slot with its six engineers (cut 2) */}
      {pitVisible ? (
        <g>
          {barVis > 0.01 ? (
            <ScaledShadow
              o={[AX, PIT.bot]}
              s={shadowScale(Math.sqrt((PIT.x1 - PIT.x0) * (PIT.bot - PIT.top)))}
              sil={(pre) => [{ d: pathOf([["M", PIT.x0, barTop], ["L", PIT.x1, barTop], ["L", PIT.x1, PIT.bot], ["L", PIT.x0, PIT.bot], ["Z"]], pre) }]}
              lift={pitLift}
            />
          ) : null}
          <g clipPath={`url(#${uid}pit)`}>
            {/* the engineers, each wearing a headset drawn in their own tone (part of the glyph): a band arc
                over the head, ear cups, a short mic stub out from the right cup */}
            <g filter={`url(#${uid}gs)`}>
              {ENGINEERS.map((p, i) => (
                <Engineer key={i} id={`${uid}b`} x={p.x} y={p.y + dy} fill={COLOR.cream} />
              ))}
            </g>
            {S6 ? (
              <g style={{ filter: bloomFilter(k) }}>
                {ENGINEERS.map((p, i) => {
                  const a = amberTone(IDX.eng + i, S);
                  return a > 0.002 ? <Engineer key={i} id={`${uid}b`} x={p.x} y={p.y + dy} fill={AMBER_PERSON} opacity={a} /> : null;
                })}
              </g>
            ) : null}
            {/* the bar: cream card, a row of small screens in ink along its top edge */}
            <path d={rectPath(PIT.x0, barTop, PIT.x1 - PIT.x0, PIT.bot - PIT.top, pitR)} fill={COLOR.cream} />
            <path d={`M${f3(PIT.x0 + pitR)} ${f3(barTop + EDGE.CREAM / k / 2)}H${f3(PIT.x1 - pitR)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f3(EDGE.CREAM / k)} />
            <g fill={COLOR.inkDark}>
              {Array.from({ length: 9 }, (_, j) => {
                const w = 7.2;
                const pitch = (PIT.x1 - PIT.x0 - 8) / 9;
                const x = PIT.x0 + 4 + j * pitch + (pitch - w) / 2;
                return <rect key={j} x={f3(x)} y={f3(barTop + 1.6)} width={f3(w)} height={2.6} rx={0.4} />;
              })}
            </g>
            <rect x={f3(PIT.x0)} y={f3(PIT.bot - EDGE.FOOT_AO / k)} width={PIT.x1 - PIT.x0} height={f3(EDGE.FOOT_AO / k)} fill={COLOR.shadow} fillOpacity={ALPHA.footAO} />
          </g>
          {/* the terrace: a short glass ledge drawn out from the axis; the slot opens across its middle */}
          <path
            d={`M${f3(AX - TERRACE_W * terraceU)} ${f3(PIT.bot)}H${f3(AX + TERRACE_W * terraceU)}`}
            stroke={COLOR.glass}
            strokeOpacity={ALPHA.glassHi}
            strokeWidth={f3(STROKE.HAIRLINE / k)}
            strokeLinecap="round"
          />
          {/* the slot: the joint the wall rises out of (it opens as the rise begins) */}
          <rect
            x={f3(PIT.x0 - EDGE.SLOT_LIP / k)}
            y={f3(PIT.bot - EDGE.SLOT / k / 2)}
            width={f3(PIT.x1 - PIT.x0 + (2 * EDGE.SLOT_LIP) / k)}
            height={f3(EDGE.SLOT / k)}
            fill={COLOR.inkDark}
            fillOpacity={ALPHA.slot * slotOn}
          />
        </g>
      ) : null}

      {/* the glass outline: the floor hairline (the tip's top edge), the tip's flanks, the body's flanks */}
      <g fill="none" stroke={COLOR.glass} strokeWidth={f3(hair)} strokeLinejoin="round" strokeLinecap="round">
        <path d={polyD([TIP_LEFT[0], TIP_RIGHT[0]])} strokeOpacity={ALPHA.glassHi} />
        {tipY > PY + 0.01 ? (
          <>
            <path d={polyD(flankTo(TIP_LEFT, tipY))} strokeOpacity={ALPHA.glassHi} />
            <path d={polyD(flankTo(TIP_RIGHT, tipY))} strokeOpacity={ALPHA.glassHi} />
          </>
        ) : null}
        {bodyY > WY + 0.01 ? (
          <>
            <path d={polyD(flankTo(BODY_LEFT, bodyY))} strokeOpacity={ALPHA.glassLo} />
            <path d={polyD(flankTo(BODY_RIGHT, bodyY))} strokeOpacity={ALPHA.glassLo} />
          </>
        ) : null}
      </g>

      {/* the mechanics (cut 2): the tip's first row, under their wheels; each its own shadow (lifted while it travels) */}
      <g>
        {MECHANICS.map((m, i) => {
          if (S < MECH_MOVE[i].start) return null;
          const x = mechX(i, S);
          const my = m.y + mechDy(i, S);
          if (!onScreen(x, my, m0)) return null;
          const a = S6 ? amberTone(IDX.mech + i, S) : 0;
          return (
            <g key={i}>
              <ScaledShadow o={[x, my]} s={GLYPH_S} sil={(pre) => [{ d: bustPath(x, my, pre) }]} elevation="rest" lift={mechLift(i, S)} />
              <use href={`#${uid}b`} x={f3(x)} y={f3(my)} fill={COLOR.cream} />
              {a > 0.002 ? (
                <g style={{ filter: bloomFilter(k) }}>
                  <use href={`#${uid}b`} x={f3(x)} y={f3(my)} fill={AMBER_PERSON} opacity={f3(a)} />
                </g>
              ) : null}
            </g>
          );
        })}
      </g>

      {/* the two cars and their drivers */}
      {([0, 1] as const).map((car) => (
        <Car key={car} tailX={carTail(car, S)} k={k} amber={helmetAmber(car, S)} band={band} />
      ))}

      {readout}

      {/* THE ONE CLICK: one light sweep across every amber person and the numeral (cut 6, "equally") */}
      {sweepT > 0 && sweepT < 1 ? (
        <g>
          <defs>
            <clipPath id={`${uid}sw`}>
              {sweepUses}
              {[...MECHANICS, ...ENGINEERS].map((m, i) => (
                <use key={`m${i}`} href={`#${uid}b`} x={f3(m.x)} y={f3(m.y)} />
              ))}
              {layout(fmt(COUNT_AMBER.final), AX, TYPE.HERO / k).map((g, i) => (
                <text
                  key={`n${i}`}
                  x={f3(g.x)}
                  y={f3(numY)}
                  textAnchor="middle"
                  fontFamily={FONT_NUM}
                  fontWeight={700}
                  fontSize={f3(TYPE.HERO / k)}
                  style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
                >
                  {g.c}
                </text>
              ))}
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}sw)`}>
            <LightSweep x={sweepBox.x} y={sweepBox.y} w={sweepBox.w} h={sweepBox.h} k={k} t={sweepT} on="amber" r={0} />
          </g>
        </g>
      ) : null}
    </StoutStage>
  );
};
