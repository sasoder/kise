// ---------------------------------------------------------------------------
// ComputeTriples (rsi-ten-earths, cut 37). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 119 frames. World: the shared hall module ./tenEarthsHall (read-only; HALL_READY.md):
// its Rack / RackField, GRID_243, GROWTH_243 and YearPlate. The hall's walls are NOT drawn (director, review 1): the
// floor runs on and melts into the air, so the hall recedes into the mist.
//
// CHECK LINE: "Global AI compute has tripled every year for five years: one rack became a hall of hundreds."
//
// THE LINE: "for the last five years, global AI compute has been roughly tripling every single year."
// WORD -> FRAME (from the composition start; Whisper may run ~0.2-0.4 s early): And -3 · for 1 · the 4 · last 6 ·
//   five 13 · years, 19 · global 28 · AI 31 · compute 45 · has 51 · been 65 · roughly 75 · tripling 85 · every 97 ·
//   single 103 · year. 109 · (Even 119)
// DURATION: the slot 37.8295 -> 42.7927 s = 4.963 s x 23.976 = 119 frames (f0..f118).
//
// THE MOTION: one crane-up pull-back from one lit server rack (f0, ~420 px tall, seen low (eye 1.4 m) and three-
//   quarter so its lit left side shows; the year plate 2021 on the floor in front) to 243 racks receding into the
//   haze. The racks triple five times at a steady beat; every new rack comes out from behind a standing one at full
//   size (never a fade or a scale-in), into GRID_243's rows and aisles:
//     1 -> 3 (f2-f15, "five"): two copies slide sideways out from behind the hero in the aisle behind it (f2-f10),
//       then step forward into its row (f10-f15);
//     -> 9 (rows 1, 2 slide back out from behind the front row, nearest first, 3 frames apart; lands f34);
//     -> 27 (9 x 3: columns slide sideways out from behind the block's outer columns, telescoping; lands f54);
//     -> 81 (9 x 9: six rows peel off backwards one after another, each out from behind the row before it, nearest
//       first, 2 frames apart; f54-f74, "roughly");
//     -> 243 (27 x 9: eighteen columns slide sideways out from behind the block, telescoping; lands f94).
//   The year plate steps 2021 -> 2026 with each tripling (a continuous slide-up hand-over, the two years overlapping), on the floor in front of the
//   front row, never over a rack. The camera rises and trucks onto the grid's axis first (f0-f40), then pulls back
//   hardest over the last two triplings; it settles by ~f104 and creeps to f118 while the rack lights twinkle.
// CONTACT: a copy moves only on its slide line (the aisle behind its row, its own column), from coincident with the
//   rack it comes out from behind; checked per frame (scratch collide.ts: 0 collisions).
// Orange = the AIs only (COMMON.md): nothing orange here (racks slate iron, cream lights, cream type).
//
// DEPTH: a physical camera on one lens (F = 1062 world px): pure dolly + crane, a vertical and a horizontal lens shift.
//   The hero's front at Z = 420 (GRID_243 shifted 420); the camera's distance to it D = F / s (s = the front row's
//   screen scale, 1.18 -> 0.27), its eye h = RACK.h + slope * D with the slope over the front row's top -0.12 -> 0.58
//   (h 249 = 1.4 m -> ~14 m), the vanishing point's X from -460 (left of the hero: its left side shows) to 0 by ~f40,
//   the picture shifted so the hero's body stays centred. londonDepth camera per frame: { eyeY: -h, dRef: D - 420,
//   kRef: k, dolly: 0 }, k = F / (D - 420). Interior mood (eyeT 0.17, the probes'), fog by depth (fogVis 6000): the
//   back rows sink into the air. The front row's foot is held at y 980 so the plate has clear floor below it.
//   Window shafts at 0.3 (director, review 2: 0.6 cut a diagonal band across the rack blocks and the floor).
//   Rack layout: GRID_243 + 1.2 units per column (abutting racks never merge into one run: no seam swap at rest).
//   One RackField per depth row, far to near; a copy still overlapping its anchor sits a fraction of a unit behind it
//   (drawn under it). The VP-side copy of the first step, stepping forward beside the hero, is redrawn over the part of
//   the hero's side face that its front now hides (clipped), so the side face never pops.
//   LOD: the module's "hero" detail on every row at every size (its auto LOD popped whole rows at ~150 px), plus this
//   cut's GLINTS: a few crisp cream lights and the status bar per rack, at least ~2.4 px, faded in as a rack falls
//   below ~230 px tall, so the lights survive at the wide.
//   Checks (scratch): camera lobes, per-frame framing of the standing set (inside the keep-in box, front feet <= 985),
//   plate never over a rack, per-frame collisions, rack screen speeds.
//
// SOURCES: Epoch AI, data insights: global AI computing capacity (H100-equivalents) has grown ~3.3x per year since
//   2022 (doubling ~every 7 months), epoch.ai/data-insights. The speaker: "roughly tripling every single year" for "the
//   last five years". On screen only the years 2021-2026 (five triplings to Nov 2026); the rack counts are a picture
//   of x3 per year, not a census of real racks.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirFloor, AirHorizonHazeW, AirStage, WorldSvg, airWorldOf, mixHex, swayCam, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CREAM, GRID_243, GROWTH_243, MAT_RACK, RACK, RackField, U, YearPlate, type RackSpec } from "./tenEarthsHall";

export const FPS = 24000 / 1001;
export const DURATION = 119;
export const schema = z.object({ camFrame: z.number().default(-1) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (6 * t - 15) + 10));
const ease = (f: number, a: number, b: number) => easeInOut((f - a) / (b - a));

// ---- the world -----------------------------------------------------------------------------------------------------
/** the hero rack's front (row 0) depth */
export const HERO_Z = 420;
/** extra spacing per column so abutting racks never merge into one run */
const GAPX = 1.2;
/** how far behind its anchor a still-overlapping copy is drawn (world units) */
const EPS = 0.6;
const COLS = 27;
/** the landing frame of each tripling (1 -> 3 -> 9 -> 27 -> 81 -> 243) */
export const LAND = [15, 34, 54, 74, 94];
/** step 1: slide sideways in the aisle behind the hero, then step forward into its row */
const S1 = { a0: 2, a1: 10, b1: 15 };
/** steps 2 and 4: the new rows peel off backwards one after another, each out from behind the row before it */
const ROWS2 = { t0: 19, lag: 3, dur: 12 };
const ROWS4 = { t0: 54, lag: 2, dur: 10 };
/** steps 3 and 5: columns telescope sideways out from behind the block's outer column */
const COLS3 = { t0: 40, dur: 14 };
const COLS5 = { t0: 79, dur: 15 };

const GEN: number[] = (() => {
  const g = new Array<number>(GRID_243.length).fill(-1);
  GROWTH_243.forEach((ids, i) => ids.forEach((id) => (g[id] < 0 ? (g[id] = i) : 0)));
  return g;
})();
type Base = RackSpec & { row: number; col: number; id: number; gen: number };
const BASE: Base[] = GRID_243.map((rk) => {
  const col = rk.col ?? 0;
  const row = rk.row ?? 0;
  const id = rk.id ?? 0;
  return { ...rk, X: rk.X + (col - 13) * GAPX, Z: rk.Z + HERO_Z, row, col, id, gen: GEN[id], seed: id === 13 ? 30 : rk.seed };
});
const byRC = (r: number, c: number) => BASE[r * COLS + c];
/** the rack each copy comes out from behind (odd steps: the set's outermost column in its row; even steps: the set's
 *  back row in its column) */
const ANCHOR: (Base | null)[] = BASE.map((b) => {
  if (b.gen <= 0) return null;
  const prev = GROWTH_243[b.gen - 1].map((id) => BASE[id]);
  if (b.gen % 2 === 1) {
    const cols = prev.map((p) => p.col);
    return byRC(b.row, Math.max(Math.min(...cols), Math.min(Math.max(...cols), b.col)));
  }
  return byRC(Math.max(...prev.map((p) => p.row)), b.col);
});

export type Placed = RackSpec & { gen: number; col: number; row: number; s: number; aisle?: number };
/** the racks standing at frame f, at their sliding positions (a copy that has not started is left out: it would be
 *  coincident with, and hidden behind, the rack it comes from) */
export const racksAt = (f: number): Placed[] => {
  const out: Placed[] = [];
  const zRow = new Map<number, number>(); // id -> Z now (rows peeling off ride on the row before them)
  const rowsOf = (cfg: { t0: number; lag: number; dur: number }, k: number) => ease(f, cfg.t0 + cfg.lag * k, cfg.t0 + cfg.lag * k + cfg.dur);
  // in id order: rows ascending, so a row's predecessor is placed before it
  BASE.forEach((b, i) => {
    const a = ANCHOR[i];
    if (!a) {
      out.push({ ...b, s: 1 });
      zRow.set(b.id, b.Z);
      return;
    }
    if (b.gen === 1) {
      const ea = ease(f, S1.a0, S1.a1);
      if (ea <= 0) return;
      const eb = ease(f, S1.a1, S1.b1);
      const dz = (RACK.d + 4) * (1 - eb);
      out.push({ X: a.X + (b.X - a.X) * ea, Z: b.Z + dz, seed: b.seed, id: b.id, gen: 1, col: b.col, row: b.row, s: ea, aisle: dz });
      return;
    }
    if (b.gen === 2 || b.gen === 4) {
      const cfg = b.gen === 2 ? ROWS2 : ROWS4;
      const k = b.row - a.row - 1;
      const e = rowsOf(cfg, k);
      if (e <= 0) return;
      const pred = byRC(b.row - 1, b.col);
      const zp = zRow.get(pred.id) ?? pred.Z;
      const Z = zp + (b.Z - pred.Z) * e + EPS * (1 - e);
      zRow.set(b.id, Z);
      out.push({ X: b.X, Z, seed: b.seed, id: b.id, gen: b.gen, col: b.col, row: b.row, s: e });
      return;
    }
    const cfg = b.gen === 3 ? COLS3 : COLS5;
    const s = ease(f, cfg.t0, cfg.t0 + cfg.dur);
    if (s <= 0) return;
    out.push({ X: a.X + (b.X - a.X) * s, Z: b.Z + EPS * (1 - s), seed: b.seed, id: b.id, gen: b.gen, col: b.col, row: b.row, s });
  });
  return out;
};

// ---- the camera: a pure dolly + crane on one lens, framed by lens shifts ------------------------------------------
export const F_LENS = 1062;
const S0 = 1.18;
const S1F = 0.27;
/** the slope over the front row's top, (h - RACK.h) / D: -0.119 at f0 (eye 1.4 m, D 900) -> SIG1 */
const SIG0 = (1.4 * U - RACK.h) / (F_LENS / S0);
const SIG1 = 0.58;
/** the front row's foot on screen (the plate below it on clear floor) */
export const FOOT_Y = 980;
/** the vanishing point's X at f0 (left of the hero: its lit left side shows), trucking to the grid's axis */
const XV0 = -460;
const lobe = (a: number, b: number) => {
  const N = 600;
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    const t = (i - 0.5) / N;
    cum.push(cum[i - 1] + Math.pow(t, a) * Math.pow(1 - t, b));
  }
  const tot = cum[N];
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const x = t * N;
    const i = Math.floor(x);
    return (cum[i] + (cum[Math.min(N, i + 1)] - cum[i]) * (x - i)) / tot;
  };
};
/** the pull-back (front-row scale, log) */
const E_S = lobe(2.2, 1.5);
const S_END = 104;
/** the crane (the slope) and the truck onto the axis: early */
const E_H = lobe(0.8, 2.2);
const H_END = 96;
const E_X = lobe(1.1, 1.6);
const X_END = 42;
/** the creep after the settle (log scale per frame), blended in over f90-f106 so the speed never steps */
const CREEP = -0.0011;
const creepAt = (f: number) => {
  const a = 90;
  const b = 106;
  if (f <= a) return 0;
  const L = b - a;
  const t = (Math.min(f, b) - a) / L;
  return CREEP * (L * (t * t * t - 0.5 * t * t * t * t) + Math.max(0, f - b));
};
export type CamState = { s: number; h: number; D: number; Dc: number; k: number; xv: number; shift: number; cam: Cam; depth: DepthOpts };
export const camState = (f: number): CamState => {
  const es = E_S(f / S_END);
  const ls = Math.log(S0) + (Math.log(S1F) - Math.log(S0)) * es + creepAt(f);
  const s = Math.exp(ls);
  const D = F_LENS / s;
  const Dc = D - HERO_Z;
  const k = F_LENS / Dc;
  const h = RACK.h + (SIG0 + (SIG1 - SIG0) * E_H(f / H_END)) * D;
  const xv = XV0 * (1 - E_X(f / X_END));
  // the hero's front centre at x 540 plus half its visible side face, so its whole body is centred
  const side = Math.max(0, -xv - RACK.w / 2) * s * (RACK.d / (D + RACK.d));
  const shift = xv * s + side / 2;
  const yH = FOOT_Y - h * s;
  const eyeY = -h;
  const cam: Cam = { k, cx: xv, cy: eyeY - (yH - 960) / k };
  return { s, h, D, Dc, k, xv, shift, cam, depth: { eyeY, dRef: Dc, kRef: k, dolly: 0 } };
};

// ---- the glints: crisp cream lights that survive at the wide -------------------------------------------------------
const R_TOP = 14;
const R_BOT = 12;
const R_UH = (RACK.h - R_TOP - R_BOT) / 42;
type Glint = { x: number; y: number; per: number; ph: number };
const GLINTS = new Map<number, Glint[]>();
const glintsOf = (seed: number): Glint[] => {
  const hit = GLINTS.get(seed);
  if (hit) return hit;
  const out: Glint[] = [];
  const rnd = (s: string) => random(`ctGlint-${seed}-${s}`);
  // the left light column: six units spread down the rack; the right: three
  for (let i = 0; i < 6; i++) {
    const u = Math.min(41, Math.floor(1 + i * 6.8 + rnd(`l${i}`) * 4));
    out.push({ x: 12.5, y: R_TOP + (u + 0.5) * R_UH, per: 60 + Math.floor(rnd(`p${i}`) * 140), ph: Math.floor(rnd(`h${i}`) * 200) });
  }
  for (let i = 0; i < 3; i++) {
    const u = Math.min(41, Math.floor(4 + i * 13 + rnd(`r${i}`) * 6));
    out.push({ x: RACK.w - 12.5, y: R_TOP + (u + 0.5) * R_UH, per: 70 + Math.floor(rnd(`q${i}`) * 120), ph: Math.floor(rnd(`g${i}`) * 200) });
  }
  GLINTS.set(seed, out);
  return out;
};
const rectD = (x: number, y: number, w: number, h: number) => `M${x.toFixed(2)},${y.toFixed(2)}h${w.toFixed(2)}v${h.toFixed(2)}h${(-w).toFixed(2)}Z`;
/** the glint layer of one depth row (drawn right after its RackField, so nearer rows cover it) */
const Glints: React.FC<{ A: AirWorld; racks: Placed[]; frame: number }> = ({ A, racks, frame }) => {
  if (!racks.length) return null;
  const Z = racks[0].Z;
  const P = A.P;
  const r = P.r(Z);
  const px = r * A.k;
  const hp = RACK.h * px;
  const alpha = c01((230 - hp) / 80);
  if (alpha <= 0) return null;
  const on = 1 / px;
  const w = Math.max(3.4, 2.5 * on);
  const hh = Math.max(2.4, 2.1 * on);
  const barH = Math.max(1.8, 1.5 * on);
  let bright = "";
  let dim = "";
  let bars = "";
  for (const rk of racks) {
    const tl = P.p(rk.X - RACK.w / 2, -RACK.h, Z);
    const loc = (x: number, y: number, ww: number, h: number) => rectD(tl[0] + x * r, tl[1] + y * r, ww * r, h * r);
    bars += loc(13, 6.5 - barH / 2, RACK.w - 26, barH);
    for (const g of glintsOf(rk.seed)) {
      const off = (((Math.floor(frame) + g.ph) % g.per) + g.per) % g.per < 3;
      const d = loc(g.x - w / 2, g.y - hh / 2, w, hh);
      if (off) dim += d;
      else bright += d;
    }
  }
  const col = mixHex(CREAM, A.airHex(Z, RACK.h / 2), 0.45 * A.fog(Z));
  return (
    <g opacity={alpha}>
      <path d={bars} fill={col} fillOpacity={0.9} />
      <path d={bright} fill={col} />
      {dim ? <path d={dim} fill={col} fillOpacity={0.3} /> : null}
    </g>
  );
};

// ---- the top shade: the module's rack tops read as pale slabs from a raised eye; this cut darkens them toward the
// slate body (a veil of the rack's dark tone over each top face) and redraws the cream rim on the top's front edge,
// so the field reads as dark machines with lit rims, not a plan of grey slabs
const TOP_SHADE = 0.55;
const TopShade: React.FC<{ A: AirWorld; racks: Placed[] }> = ({ A, racks }) => {
  if (!racks.length) return null;
  const P = A.P;
  if (!(-RACK.h > P.horizonY)) return null;
  const Z = racks[0].Z;
  const Z1 = Z + RACK.d;
  let tops = "";
  let rims = "";
  const pt = (v: [number, number]) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
  for (const rk of racks) {
    const x0 = rk.X - RACK.w / 2;
    const x1 = rk.X + RACK.w / 2;
    tops += `M${pt(P.p(x0, -RACK.h, Z))}L${pt(P.p(x1, -RACK.h, Z))}L${pt(P.p(x1, -RACK.h, Z1))}L${pt(P.p(x0, -RACK.h, Z1))}Z`;
    rims += `M${pt(P.p(x0, -RACK.h, Z))}L${pt(P.p(x1, -RACK.h, Z))}`;
  }
  const fz = A.fog(Z);
  return (
    <g>
      <path d={tops} fill={A.tone(MAT_RACK.dark, Z, RACK.h)} fillOpacity={TOP_SHADE} />
      <path d={rims} fill="none" stroke={CREAM} strokeWidth={A.lw(1.3)} strokeOpacity={0.55 * (1 - fz)} strokeLinecap="round" />
    </g>
  );
};

/** the floor: the style's warm sand-umber ground one step lighter, so the slate racks read darker than the floor
 *  around them (director, review 1; measured on rendered pixels) */
const MAT_SAND = { lit: "#A8966F", mid: "#8E7C5C", dark: "#5E5242" };

// ---- the light pool: the racks' own light on the floor (cream, faint) --------------------------------------------
const SPILL = 0.12;
const LightPool: React.FC<{ A: AirWorld; racks: Placed[] }> = ({ A, racks }) => {
  let xa = 1e9;
  let xb = -1e9;
  let za = 1e9;
  let zb = -1e9;
  for (const r of racks) {
    xa = Math.min(xa, r.X - RACK.w / 2);
    xb = Math.max(xb, r.X + RACK.w / 2);
    za = Math.min(za, r.Z);
    zb = Math.max(zb, r.Z + RACK.d);
  }
  const P = A.P;
  const pad = 0.8 * U;
  const q = [P.p(xa - pad, 0, za - pad), P.p(xb + pad, 0, za - pad), P.p(xa - pad, 0, zb + pad), P.p(xb + pad, 0, zb + pad)];
  const x0 = Math.min(...q.map((v) => v[0]));
  const x1 = Math.max(...q.map((v) => v[0]));
  const y0 = Math.min(...q.map((v) => v[1]));
  const y1 = Math.max(...q.map((v) => v[1]));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = 0.5 * (x1 - x0) * 1.3;
  const ry = Math.max(0.5 * (y1 - y0) * 1.3, 0.25 * rx);
  return (
    <g>
      <defs>
        <radialGradient id="ct-pool" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={rx} gradientTransform={`translate(${cx} ${cy}) scale(1 ${(ry / rx).toFixed(5)}) translate(${-cx} ${-cy})`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={SPILL} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={SPILL * 0.45} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#ct-pool)" />
    </g>
  );
};

// ---- the year plate ------------------------------------------------------------------------------------------------
const YEARS = ["2021", "2022", "2023", "2024", "2025", "2026"];
/** the plate's type (px font size) and its centre's drop below the front row's foot (px): text ~ y 997-1067 */
const PLATE_PX = 96;
const PLATE_DOWN = 52;
const PLATE_Z = HERO_Z - 200;
/** the swap, a continuous hand-over over SWAP_W frames from LAND - SWAP_LEAD: the old year slides up 0.16 em and
 *  out while the new one slides up 0.14 em into place, overlapping, so max(old, new) opacity never drops below ~0.8
 *  (crossing at t 0.5). The floor shadow under the type is one constant ellipse, so it never dips or doubles. */
export const SWAP_LEAD = 9;
export const SWAP_W = 9;
const ss = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
/** old / new opacity at swap progress t */
export const swapOpacity = (t: number) => ({ old: 1 - ss((t - 0.3) / 0.7), nu: ss(t / 0.7) });
const easeOut3 = (t: number) => 1 - Math.pow(1 - c01(t), 3);

const ComputeTriples: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const C = camState(cf);
  const R = camState(0);
  const cam = swayCam(C.cam, cf);
  const rest = swayCam(R.cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame, scene: { mood: "interior", eyeT: 0.17, fogVis: 6000 }, fogBy: "depth" });
  const P = A.P;
  const racks = racksAt(frame);
  // one RackField per depth row, far to near
  const rowMap = new Map<number, Placed[]>();
  for (const rk of racks) {
    const key = Math.round(rk.Z * 100);
    const a = rowMap.get(key);
    if (a) a.push(rk);
    else rowMap.set(key, [rk]);
  }
  const rows = [...rowMap.entries()].sort((a, b) => b[0] - a[0]).map(([key, rr]) => ({ key, racks: rr, shadow: Math.min(...rr.map((q) => q.s * q.s)) }));
  // step 1's VP-side copy stepping forward beside the hero: redraw it over the part of the hero's side face behind
  // its front plane (the hero's side faces the VP; a copy on that side hides it as it comes level)
  const hero = BASE[13];
  const fix: React.ReactNode[] = [];
  for (const rk of racks) {
    if (rk.gen !== 1 || rk.aisle === undefined || rk.aisle >= RACK.d || rk.aisle <= 0.005) continue;
    const vpLeft = C.xv < hero.X;
    if (vpLeft !== rk.X < hero.X) continue;
    const xe = vpLeft ? hero.X - RACK.w / 2 : hero.X + RACK.w / 2;
    const z0 = hero.Z + rk.aisle;
    const z1 = hero.Z + RACK.d;
    const poly = [P.p(xe, -RACK.h, z0), P.p(xe, -RACK.h, z1), P.p(xe, 0, z1), P.p(xe, 0, z0)];
    const id = `ct-fix${rk.id}`;
    fix.push(
      <g key={id}>
        <defs>
          <clipPath id={id}>
            <path d={`M${poly.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <RackField A={A} racks={[rk]} frame={frame} uid={`ctf${rk.id}`} shadow={0} lod="hero" cull={false} />
        </g>
      </g>,
    );
  }
  const heroKey = Math.round(hero.Z * 100);
  // the plate: on the floor in front of the front row, centred on the grid's axis (X 0), a steady size on screen
  const rP = P.r(PLATE_Z);
  const sizeW = PLATE_PX / (rP * C.k);
  const footW = P.p(0, 0, HERO_Z);
  const target = footW[1] + PLATE_DOWN / C.k;
  const Yp = C.depth.eyeY + (target - C.depth.eyeY) / rP;
  const s2 = sizeW * rP;
  // X: the world point at PLATE_Z that lands on the screen's centre column (the hero's body / the grid's axis)
  const Xp = C.cam.cx + (C.cam.cx - C.shift / C.k - C.cam.cx) / rP;
  const plates: React.ReactNode[] = [];
  // one constant floor shadow under the type (YearPlate's own ellipse, plate 0.5, for a four-figure year)
  {
    const c = P.p(Xp, Yp, PLATE_Z);
    const tw = 4 * 0.62 * s2;
    plates.push(
      <g key="ct-plate">
        <defs>
          <radialGradient id="ct-plate-g">
            <stop offset="0" stopColor={AIR.A.shadow} stopOpacity={0.3} />
            <stop offset="0.6" stopColor={AIR.A.shadow} stopOpacity={0.21} />
            <stop offset="1" stopColor={AIR.A.shadow} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={c[0]} cy={c[1]} rx={tw * 0.72 + s2 * 0.75} ry={s2 * 0.92} fill="url(#ct-plate-g)" />
      </g>,
    );
  }
  YEARS.forEach((yr, i) => {
    // progress of the swap into this year (i - 1 -> i) and out of it (i -> i + 1)
    const tin = i === 0 ? 1 : (frame - (LAND[i - 1] - SWAP_LEAD)) / SWAP_W;
    const tout = i === YEARS.length - 1 ? 0 : (frame - (LAND[i] - SWAP_LEAD)) / SWAP_W;
    if (tin <= 0 || tout >= 1) return;
    const op = Math.min(swapOpacity(c01(tin)).nu, swapOpacity(c01(tout)).old);
    const lift = 0.14 * s2 * (1 - easeOut3(tin)) - 0.16 * s2 * ss(tout);
    if (op <= 0.001) return;
    plates.push(
      <g key={yr} opacity={op} transform={`translate(0 ${lift.toFixed(3)})`}>
        <YearPlate A={A} X={Xp} Y={Yp} Z={PLATE_Z} text={yr} t={1} uid={`yp${i}`} size={sizeW} plate={0} />
      </g>,
    );
  });
  return (
    <AirStage v={A.v} bloom={0.22} shafts={0.3}>
      <WorldSvg cam={cam}>
        <g transform={`translate(${(C.shift / C.k).toFixed(4)} 0)`}>
          <AirFloor A={A} x0={-14000} x1={14000} z0={-20000} z1={9000} mat={MAT_SAND} course={0.6 * U} plank={0.6 * U} jointAmt={0.6} melt={0.5} />
          <AirHorizonHazeW A={A} id="ct-haze" />
          <LightPool A={A} racks={racks} />
          {rows.map((g) => (
            <React.Fragment key={g.key}>
              <RackField A={A} racks={g.racks} frame={frame} uid={`ct${g.key}`} shadow={g.shadow} lod="hero" cull={false} />
              <TopShade A={A} racks={g.racks} />
              <Glints A={A} racks={g.racks} frame={frame} />
              {g.key === heroKey ? fix : null}
            </React.Fragment>
          ))}
          {plates}
        </g>
      </WorldSvg>
    </AirStage>
  );
};

export default ComputeTriples;
