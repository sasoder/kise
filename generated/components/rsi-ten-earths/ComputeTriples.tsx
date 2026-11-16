// ---------------------------------------------------------------------------
// ComputeTriples (rsi-ten-earths, cut 37), REVISION 1. Dwarkesh 3D style (styles/dwarkesh-3d.md; REV1_COMMON.md).
// Opaque 1080x1920, 23.976 fps, 119 frames. World: the shared hall module ./tenEarthsHall (read-only; HALL_READY.md):
// its RackField (power wave, twinkle), GRID_243 / GROWTH_243 and PLATE_FONT. No robots: compute only.
//
// CHECK LINE: "It started as one rack, and every year it tripled until it was a whole hall stretching into the haze."
//
// THE LINE: "for the last five years, global AI compute has been roughly tripling every single year."
// WORD -> FRAME (director's onsets, review 3): last 1 · five 9 · years 15 · global 29 · AI 34 · compute 39 · has 52 ·
//   been 59 · roughly 76 · tripling 84 · every 98 · single 104 · year 110
// DURATION: the slot 37.8295 -> 42.7927 s = 4.963 s x 23.976 = 119 frames (f0..f118).
//
// THE MOTION (director review 3): copy, paste, paste. f0 is on ONE rack's lit face (~770 px wide, the eye at 0.4 of
//   its height); from f2 the camera eases off it (an ease-in, no whip) and 2021 paints in at the rack's foot on
//   "years". Each tripling is then TWO COPIES of the whole block so far, landing in unison (one 9-frame rise in place,
//   lights coming on top to bottom with the module's power wave during the rise), each copy's footprint first laid
//   down as a cream tape slot ~4 frames before its rise, gone as it lands: 1 -> 1 x 3 (copies left and right, on
//   "global" f29) -> 3 x 3 (two rows behind, "compute" f40) -> 3 x 9 (left and right, "has been" f55) -> 9 x 9 (behind,
//   "roughly" f72) -> 9 x 27 (left and right, "tripling" f84), and from f82 the 9 x 27 itself copied on out to the
//   haze in rings of whole tiles, one ring every 3 frames (landed by ~f100). Depth copies always go BEHIND, so nothing
//   lands near the lens or under the caption bands. The aisles nest in base 3, so each copy carries the seams of the
//   block it copies. The camera pulls back ~25x and cranes: steep (~55-59 deg to the foot) through the depth steps so
//   the rows behind clear the block, then from ~f72 it rises and tilts up to the end (cut 17's crane language): centre
//   ray ~51 deg down, the horizon at y ~150, a thin haze band, the field edge to edge from y ~220 to ~850 and off both
//   sides; it keeps rising slowly through "every single year" and settles at f110. Below the field: the year column
//   and calm floor only. The years are painted on the floor in front of the first rack, on the axis, each a ring
//   further toward the lens and a size up, each landing big (>= 94 px cap) at the keep-in's foot (y ~1045) 2 frames
//   after its copies land; only the last three ever read (older years fade out as they shrink below ~30 px).
// CAUSE: a rack's lights come on only as it rises; a year's paint comes up (over 5 frames) as its copies land, only
//   once its whole plate is above the caption band (no numeral ever crosses a band).
// Orange = the AIs only (COMMON.md): nothing orange in this cut (racks slate iron, cream lights, cream paint).
//
// DEPTH: a real crane eye on a shift lens (verticals stay vertical), mapped onto a londonDepth perspective per frame
//   (the PushTheLimitsOnLatency camera): focal F = 660 screen px, eye height He, horizontal distance Dc to the first
//   row's plane (Z = 0, the first rack's front face), eye on the axis; londonDepth { eyeY: -He, dRef: Dc, kRef: F / Dc,
//   dolly 1 }, cam { k: F / Dc, cx: 0, cy } with cy solving the first rack's foot onto screen row FOOT(f). Interior
//   air (eyeT 0.17), fog by depth (near 1400, vis 7000: the far tiles still count at phone size).
//
// SOURCES: Epoch AI, data insights: global AI computing capacity (H100-equivalents) has grown ~3.3x per year since
//   2022 (doubling ~every 7 months), epoch.ai/data-insights. The speaker: "roughly tripling every single year" for "the
//   last five years". On screen only the years 2021-2026 (five triplings to Nov 2026); the rack counts are a picture
//   of x3 per year, not a census of real racks.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirFloor, AirHorizonHazeW, AirStage, WorldSvg, airWorldOf, mixHex, pchip, swayCam, type AirWorld, type Cam, type DepthOpts, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CREAM, MAT_RACK, PLATE_FONT, RACK, RackField, U, type RackSpec } from "./tenEarthsHall";

export const FPS = 24000 / 1001;
export const DURATION = 119;
export const schema = z.object({ camFrame: z.number().default(-1) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;

// ===================================================================================================================
// THE HALL: copy, paste, paste. Each tripling is TWO COPIES of the whole block so far, landing in unison on either
// side of it (width steps) or behind it (depth steps, both behind, so nothing ever lands near the lens or under the
// caption bands): 1 -> 1 x 3 -> 3 x 3 -> 3 x 9 -> 9 x 9 -> 9 x 27 (rows x columns), then the 9 x 27 itself copied
// on out to the haze in rings of whole 9 x 27 tiles. The aisles nest the same way (base 3), so every copy carries
// the seams of the block it copies. The first rack is column 0, row 0; rows run back from it (row 0 nearest)
// ===================================================================================================================
const D2R = Math.PI / 180;
/** the landing frames, on the words: (the first rack) · "global" 29 · "compute" 40 · "has been" 55 · "roughly" 72 ·
 *  "tripling" 84 */
export const LAND = [0, 29, 40, 55, 72, 84];
/** a copy's rise out of the floor (frames), all its racks in unison */
export const RISE = 9;
/** the haze tiles: one more ring of 9 x 27 copies every RING_LAG frames, the first rising from 2 frames before
 *  "tripling" (once the 9 x 27 has nearly landed) */
const RING_LAG = 3;
const TX = 5;
const TZ = 5;
const COLS_H = 13 + 27 * TX;
const ROW_MAX = 9 * (TZ + 1) - 1;
/** the aisle after index p by its level in the base-3 nesting (0 inside a triple .. 3 between 9 x 27 tiles) */
const levelOf = (p: number) => {
  let L = 0;
  let q = p + 1;
  while (L < 3 && q % 3 === 0) {
    q /= 3;
    L++;
  }
  return L;
};
const GAP_X = [0.12 * U, 0.45 * U, 0.9 * U, 1.4 * U];
const GAP_Z = [1.0 * U, 1.4 * U, 2.0 * U, 2.6 * U];
const P0 = 13 + 27 * TX;
const COL_X: number[] = (() => {
  const xs = [0];
  for (let p = 1; p <= 2 * COLS_H; p++) xs.push(xs[p - 1] + RACK.w + GAP_X[levelOf(p - 1)]);
  const o = xs[P0];
  return xs.map((x) => x - o);
})();
const colX = (c: number) => COL_X[c + P0];
export const ROW_Z: number[] = (() => {
  const zs = [0];
  for (let r = 1; r <= ROW_MAX; r++) zs.push(zs[r - 1] + RACK.d + GAP_Z[levelOf(r - 1)]);
  return zs;
})();
/** generation 0 the first rack .. 5 the 9 x 27, 6 the haze tiles */
const genOf = (c: number, r: number) => {
  const a = Math.abs(c);
  if (a > 13 || r > 8) return 6;
  if (r === 0 && a === 0) return 0;
  if (r === 0 && a === 1) return 1;
  if (a <= 1 && r <= 2) return 2;
  if (a <= 4 && r <= 2) return 3;
  if (a <= 4) return 4;
  return 5;
};
const tileOf = (c: number, r: number): [number, number] => [Math.floor((c + 13) / 27), Math.floor(r / 9)];
/** which copy of its generation a rack belongs to (all of a copy rise together) */
const copyOf = (c: number, r: number, g: number): string => {
  if (g === 1 || g === 3 || g === 5) return `${g}${c < 0 ? "L" : "R"}`;
  if (g === 2) return `2r${r}`;
  if (g === 4) return `4${r < 6 ? "a" : "b"}`;
  if (g === 6) {
    const [tx, tz] = tileOf(c, r);
    return `6:${tx}:${tz}`;
  }
  return "0";
};
const startOf = (c: number, r: number, g: number) => {
  if (g === 0) return -1e9;
  if (g < 6) return LAND[g] - RISE;
  const [tx, tz] = tileOf(c, r);
  return LAND[5] - 2 + RING_LAG * (Math.max(Math.abs(tx), tz) - 1);
};
/** a rise 0..1, u frames into it (a firm start, a fully eased landing) */
const riseU = (u: number) => {
  const t = c01(u / RISE);
  return t * (0.8 + t * (1.4 - 1.2 * t));
};

// ===================================================================================================================
// THE CAMERA: a crane eye on a shift lens (verticals stay vertical), one log-space pull-back and climb
// ===================================================================================================================
export const F_LENS = 660;
/** the opening scale: the one rack's face ~770 px wide, ~2560 px tall (only its lit middle in frame) */
const K0 = 7.2;
/** the eye at 0.4 of the rack's height at f0 */
const EYE0 = RACK.h * 0.4;
/** THE PULL-BACK, keyed in LOG scale at the first rack's front plane: off the face with an ease-in from f2, then each
 *  step's copies framed as they land, the crane up from ~f60, a slow rise through "every single year" to f110 */
const LOG_K = pchip(
  (
    [
      [0, K0],
      [2, 7.15],
      [8, 5.4],
      [13, 3.7],
      [17, 2.75],
      [23, 1.98],
      [29, 1.42],
      [35, 1.08],
      [40, 0.9],
      [47, 0.8],
      [55, 0.72],
      [63, 0.56],
      [72, 0.43],
      [78, 0.375],
      [84, 0.335],
      [97, 0.302],
      [110, 0.287],
      [118, 0.285],
    ] as [number, number][]
  ).map(([f, k]) => [f, Math.log(k)] as [number, number]),
);
/** THE CLIMB, keyed as the depression to the first rack's foot */
const DEG = pchip([
  [0, Math.atan((EYE0 * K0) / F_LENS) / D2R],
  [2, Math.atan((EYE0 * 1.002 * 7.15) / F_LENS) / D2R],
  [17, 55],
  [29, 57],
  [40, 59],
  [47, 57],
  [55, 55.5],
  [63, 58],
  [72, 57],
  [78, 52],
  [84, 47.5],
  [97, 45.6],
  [110, 45.5],
  [118, 45.5],
]);
type Core = { Dc: number; He: number; k: number };
const coreAt = (f: number): Core => {
  const k = Math.exp(LOG_K(f));
  const Dc = F_LENS / k;
  return { Dc, He: Dc * Math.tan(DEG(f) * D2R), k };
};
/** screen px below the first rack's foot of a floor point at depth Z */
const dyOf = (c: Core, Z: number) => c.He * F_LENS * (1 / (c.Dc + Z) - 1 / c.Dc);

// ===================================================================================================================
// THE YEAR STENCILS: tree rings on the floor in the aisle in front of the first rack, on the axis, 2021 at its foot
// and each later year one ring further toward the lens and a size up. Each is sized on its settle frame (big then)
// and shrinks with the world after; only the last three ever read (older ones fade as they fall below ~30 px)
// ===================================================================================================================
const YEARS = ["2021", "2022", "2023", "2024", "2025", "2026"];
const CAP = 0.69;
const ADV = 0.64;
/** each year's cap height on screen on its settle frame (px) */
const ST_PX = [104, 98, 96, 94, 94, 96];
/** the settle frames: 2021 with the first rack on "years", the rest 2 frames after their copies land */
const ST_AT = [17, 31, 42, 57, 74, 86];
/** clear floor in front of the first rack's foot, and between rings (x the plate depth) */
const MARGIN = 30;
const GAP = 0.2;
export type Stencil = { text: string; X: number; zFar: number; zNear: number; em: number; land: number };
const nearFor = (c: Core, zFar: number, px: number) => 1 / (1 / (c.Dc + zFar) + px / (c.He * F_LENS)) - c.Dc;
export const STENCILS: Stencil[] = (() => {
  const st: Stencil[] = [];
  let zf = -MARGIN;
  YEARS.forEach((text, n) => {
    const zNear = nearFor(coreAt(ST_AT[n]), zf, ST_PX[n]);
    const h = zf - zNear;
    st.push({ text, X: 0, zFar: zf, zNear, em: h / CAP, land: LAND[n] });
    zf = zNear - GAP * h;
  });
  return st;
})();

/** the first rack's foot on screen: on each settle frame the newest year's near edge at y ~1045 (the keep-in's foot,
 *  clear of the caption band at 1080) */
const Y_YEAR = 1045;
const FOOT = pchip(
  [
    [0, 960 + EYE0 * K0],
    [2, 960 + EYE0 * 1.002 * coreAt(2).k],
    ...STENCILS.map((s, n) => [ST_AT[n], Y_YEAR - dyOf(coreAt(ST_AT[n]), s.zNear)] as [number, number]),
    [110, Y_YEAR - dyOf(coreAt(110), STENCILS[5].zNear)],
    [118, Y_YEAR - dyOf(coreAt(118), STENCILS[5].zNear)],
  ],
  true,
);

export type CamState = { f: number; Dc: number; He: number; ex: number; k: number; s: number; foot: number; yh: number; shift: number; cam: Cam; depth: DepthOpts };
export const camState = (f: number): CamState => {
  const ff = Math.max(0, Math.min(DURATION - 1, f));
  const { Dc, He, k } = coreAt(ff);
  const foot = FOOT(ff);
  const yh = foot - He * k;
  const eyeY = -He;
  const cam: Cam = { k, cx: 0, cy: eyeY - (yh - 960) / k };
  return { f, Dc, He, ex: 0, k, s: k, foot, yh, shift: 0, cam, depth: { eyeY, dRef: Dc, kRef: k, dolly: 1 } };
};
/** a world point to the screen (px), at camera state C (no sway) */
export const toScreen = (C: CamState, X: number, Y: number, Z: number): P2 => {
  const d = C.Dc + Z;
  return [540 + (X - C.ex) * (F_LENS / d) + C.shift, C.yh + (Y + C.He) * (F_LENS / d)];
};
/** each year's paint comes up in place once its whole plate is above the caption band (y 1072), over at least 5
 *  frames: no numeral ever crosses a band, no doubled ghost */
const ST_FADE = 5;
const ST_IN = STENCILS.map((st, n) => {
  let f = ST_AT[n] - ST_FADE;
  while (f < DURATION && toScreen(camState(f), 0, 0, st.zNear)[1] > 1072) f += 0.25;
  return f;
});
export const stencilT = (n: number, f: number) => c01((f - ST_IN[n]) / ST_FADE);
/** a year's plate depth on screen (px, ~ its cap height) */
export const stencilPx = (n: number, f: number) => {
  const C = camState(f);
  return toScreen(C, 0, 0, STENCILS[n].zNear)[1] - toScreen(C, 0, 0, STENCILS[n].zFar)[1];
};
/** its visibility: in by stencilT, out as it shrinks under ~30 px, and out once three later years are down */
export const stencilA = (n: number, f: number) => {
  const later = n + 3 < STENCILS.length ? 1 - c01((f - ST_IN[n + 3]) / 6) : 1;
  return ss(stencilT(n, f)) * ss(c01((stencilPx(n, f) - 22) / 10)) * later;
};

// ===================================================================================================================
// THE RACKS: 243 columns x 45 rows; each with its generation, copy and the first frame of its rise
// ===================================================================================================================
export type Base = RackSpec & { row: number; col: number; id: number; gen: number; copy: string; start: number };
export const BASE: Base[] = (() => {
  const out: Base[] = [];
  for (let r = 0; r <= ROW_MAX; r++) {
    for (let c = -COLS_H; c <= COLS_H; c++) {
      const gen = genOf(c, r);
      const id = r * (2 * COLS_H + 1) + (c + COLS_H);
      out.push({ X: colX(c), Z: ROW_Z[r], seed: gen === 0 ? 30 : id * 7 + 3, row: r, col: c, id, gen, copy: copyOf(c, r, gen), start: startOf(c, r, gen) });
    }
  }
  return out;
})();
/** a rack's rise 0..1 at frame f */
export const riseOf = (b: Base, f: number) => (b.gen === 0 ? 1 : riseU(f - b.start));
/** its lights: the module's top-to-bottom wave, from half a frame into the rise, done at 3/4 of it */
const powerOf = (b: Base, f: number) => (b.gen === 0 ? 1 : c01((f - b.start - 0.5) / (0.7 * RISE)));
/** the copies of generations 1-5, each with its footprint box (for the tape slot) */
type Copy = { key: string; gen: number; start: number; x0: number; x1: number; z0: number; z1: number };
export const COPIES: Copy[] = (() => {
  const m = new Map<string, Copy>();
  for (const b of BASE) {
    if (b.gen < 1 || b.gen > 5) continue;
    const c = m.get(b.copy);
    const x0 = b.X - RACK.w / 2;
    const x1 = b.X + RACK.w / 2;
    if (!c) m.set(b.copy, { key: b.copy, gen: b.gen, start: b.start, x0, x1, z0: b.Z, z1: b.Z + RACK.d });
    else {
      c.x0 = Math.min(c.x0, x0);
      c.x1 = Math.max(c.x1, x1);
      c.z0 = Math.min(c.z0, b.Z);
      c.z1 = Math.max(c.z1, b.Z + RACK.d);
    }
  }
  return [...m.values()];
})();

const YearStencil: React.FC<{ A: AirWorld; st: Stencil; t: number }> = ({ A, st, t }) => {
  if (t <= 0) return null;
  const P = A.P;
  const Zc = (st.zFar + st.zNear) / 2;
  const Dc = P.Dc;
  const cx = A.cam.cx;
  const He = -P.opts.eyeY;
  const r = P.r(Zc);
  const fz = A.fog(Zc);
  const paint = mixHex(CREAM, A.airHex(Zc, 0), 0.55 * fz);
  const under = AIR.A.shadow;
  const op = t;
  const glyphs = [...st.text];
  const n = glyphs.length;
  return (
    <g opacity={op}>
      {glyphs.map((ch, i) => {
        const X = st.X + (i - (n - 1) / 2) * ADV * st.em;
        const p = P.p(X, 0, Zc);
        // the floor's local affine at the glyph: text x -> +X, text y (down) -> toward the lens (-Z)
        const a = r;
        const c = ((X - cx) * r * r) / Dc;
        const d = (He * r * r) / Dc;
        const m = `matrix(${a.toFixed(6)} 0 ${c.toFixed(6)} ${d.toFixed(6)} ${f2(p[0])} ${f2(p[1])})`;
        return (
          <g key={i} transform={m}>
            <text
              x={0}
              y={(CAP * st.em) / 2}
              textAnchor="middle"
              fill={paint}
              stroke={under}
              strokeOpacity={0.32 * (1 - fz)}
              strokeWidth={st.em * 0.09}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: st.em, fontVariantNumeric: "lining-nums" }}
            >
              {ch}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ===================================================================================================================
// THE GLINTS and TOP SHADE (take 1's): crisp cream lights that survive at the wide; tops a step darker
// ===================================================================================================================
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
const rectD = (x: number, y: number, w: number, h: number) => `M${f2(x)},${f2(y)}h${f2(w)}v${f2(h)}h${f2(-w)}Z`;
type Placed = RackSpec & { power: number; relight: boolean };
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
    const pw = rk.power ?? 1;
    const tl = P.p(rk.X - RACK.w / 2, -RACK.h, Z);
    const loc = (x: number, y: number, ww: number, h: number) => rectD(tl[0] + x * r, tl[1] + y * r, ww * r, h * r);
    const lit = (y: number) => y / RACK.h < pw;
    if (lit(6.5)) bars += loc(13, 6.5 - barH / 2, RACK.w - 26, barH);
    for (const g of glintsOf(rk.seed)) {
      if (!lit(g.y)) continue;
      const off = (((Math.floor(frame) + g.ph) % g.per) + g.per) % g.per < 3;
      const d = loc(g.x - w / 2, g.y - hh / 2, w, hh);
      if (off) dim += d;
      else bright += d;
    }
  }
  const col = mixHex(CREAM, A.airHex(Z, RACK.h / 2), 0.45 * A.fog(Z));
  return (
    <g opacity={alpha}>
      {bars ? <path d={bars} fill={col} fillOpacity={0.9} /> : null}
      {bright ? <path d={bright} fill={col} /> : null}
      {dim ? <path d={dim} fill={col} fillOpacity={0.3} /> : null}
    </g>
  );
};
const TOP_SHADE = 0.55;
const TopShade: React.FC<{ A: AirWorld; racks: Placed[] }> = ({ A, racks }) => {
  if (!racks.length) return null;
  const P = A.P;
  if (!(-RACK.h > P.horizonY)) return null;
  const Z = racks[0].Z;
  const Z1 = Z + RACK.d;
  let tops = "";
  let rims = "";
  for (const rk of racks) {
    const x0 = rk.X - RACK.w / 2;
    const x1 = rk.X + RACK.w / 2;
    tops += `M${Pt(P.p(x0, -RACK.h, Z))}L${Pt(P.p(x1, -RACK.h, Z))}L${Pt(P.p(x1, -RACK.h, Z1))}L${Pt(P.p(x0, -RACK.h, Z1))}Z`;
    rims += `M${Pt(P.p(x0, -RACK.h, Z))}L${Pt(P.p(x1, -RACK.h, Z))}`;
  }
  const fz = A.fog(Z);
  return (
    <g>
      <path d={tops} fill={A.tone(MAT_RACK.dark, Z, RACK.h)} fillOpacity={TOP_SHADE} />
      <path d={rims} fill="none" stroke={CREAM} strokeWidth={A.lw(1.3)} strokeOpacity={0.55 * (1 - fz)} strokeLinecap="round" />
    </g>
  );
};

/** the floor: the style's warm sand-umber ground one step lighter, so the slate racks read darker than the floor */
const MAT_SAND = { lit: "#A8966F", mid: "#8E7C5C", dark: "#5E5242" };

// ---- the light pool: the racks' own light on the floor (cream, faint) --------------------------------------------
const SPILL = 0.12;
const LightPool: React.FC<{ A: AirWorld; racks: Placed[] }> = ({ A, racks }) => {
  if (!racks.length) return null;
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

// ---- the slots: cream tape round each copy's footprint, down just before it rises, gone as it lands ----------------
const SLOT_A = 0.42;
const SLOT_W = 0.07 * U;
const SLOT_PAD = 0.1 * U;
export const slotOf = (cp: Copy, f: number) => ss(c01((f - (cp.start - 4)) / 3)) * (1 - ss(c01((f - cp.start) / RISE)));
const Slots: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  for (const cp of COPIES) {
    const m = slotOf(cp, frame);
    if (m <= 0.01) continue;
    const x0 = cp.x0 - SLOT_PAD;
    const x1 = cp.x1 + SLOT_PAD;
    const z0 = cp.z0 - SLOT_PAD;
    const z1 = cp.z1 + SLOT_PAD;
    const w = SLOT_W;
    const q = (a: number, za: number, b: number, zb: number) => `M${[P.p(a, 0, za), P.p(b, 0, za), P.p(b, 0, zb), P.p(a, 0, zb)].map(Pt).join("L")}Z`;
    const a = SLOT_A * m * (1 - A.fog((z0 + z1) / 2));
    els.push(<path key={cp.key} d={q(x0, z0, x1, z1) + q(x0 + w, z0 + w, x1 - w, z1 - w)} fill={CREAM} fillOpacity={a.toFixed(3)} fillRule="evenodd" />);
  }
  return <g>{els}</g>;
};

// ===================================================================================================================
// A RISING COPY: each of its row runs drawn on a perspective lowered by dy and clipped at the floor (it comes up out
// of its own footprint), faded in over its first frames so the lid never pops
// ===================================================================================================================
const lowered = (A: AirWorld, dy: number): AirWorld => {
  const P = A.P;
  const p = (X: number, Y: number, Z: number) => P.p(X, Y + dy, Z);
  return { ...A, P: { ...P, p, at: (X: number, Z: number) => ({ at: p(X, 0, Z), scale: P.r(Z) }), horizonY: P.horizonY - dy } };
};
/** the screen region above a run's footprint (its near outline, extended up): what the floor does not hide */
const aboveFootprint = (A: AirWorld, x0: number, x1: number, Z: number): string => {
  const P = A.P;
  const pts = [P.p(x0, 0, Z), P.p(x1, 0, Z), P.p(x1, 0, Z + RACK.d), P.p(x0, 0, Z + RACK.d)];
  const sorted = [...pts].sort((a, b) => a[0] - b[0]);
  const L = sorted[0];
  const R = sorted[3];
  const lower: P2[] = [L];
  for (const q of [sorted[1], sorted[2]]) {
    const t = (q[0] - L[0]) / Math.max(1e-6, R[0] - L[0]);
    if (q[1] >= lerp(L[1], R[1], t) - 1e-6) lower.push(q);
  }
  lower.push(R);
  const top = Math.min(...pts.map((v) => v[1])) - 3 * RACK.h;
  return `M${f2(L[0])},${f2(top)}L${lower.map(Pt).join("L")}L${f2(R[0])},${f2(top)}Z`;
};
/** the module's contact band in front of a run's foot (drawn at the floor for a rising run) */
const ContactBand: React.FC<{ A: AirWorld; x0: number; x1: number; Z: number; amt: number; uid: string }> = ({ A, x0, x1, Z, amt, uid }) => {
  if (amt <= 0.002) return null;
  const P = A.P;
  const yA = P.p(0, 0, Z - 40)[1];
  const yB = P.p(0, 0, Z)[1];
  const fz = A.fog(Z);
  return (
    <g>
      <defs>
        <linearGradient id={uid} gradientUnits="userSpaceOnUse" x1="0" y1={f2(yA)} x2="0" y2={f2(yB)}>
          <stop offset="0" stopColor={AIR.A.shadow} stopOpacity={0} />
          <stop offset="1" stopColor={AIR.A.shadow} stopOpacity={0.42 * amt * (1 - fz)} />
        </linearGradient>
      </defs>
      <path d={`M${[P.p(x0 - 8, 0, Z - 40), P.p(x1 + 26, 0, Z - 40), P.p(x1 + 26, 0, Z), P.p(x0 - 8, 0, Z)].map(Pt).join("L")}Z`} fill={`url(#${uid})`} />
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
export type Live = Placed & { b: Base; e: number };
/** the racks standing (or rising) at frame f */
export const racksAt = (f: number): Live[] => {
  const out: Live[] = [];
  for (const b of BASE) {
    const e = riseOf(b, f);
    if (e <= 0.001) continue;
    out.push({ X: b.X, Z: b.Z, seed: b.seed, id: b.id, row: b.row, col: b.col, power: powerOf(b, f), relight: true, b, e });
  }
  return out;
};

const ComputeTriples: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const C = camState(cf);
  const R = camState(0);
  const cam = swayCam(C.cam, cf);
  const rest = swayCam(R.cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame, scene: { mood: "interior", eyeT: 0.17, fogNear: 1400, fogVis: 7000 }, fogBy: "depth" });
  // off-frame racks are skipped before any element is built (the haze tiles hold ~11,000)
  const onScreen = (rk: Live) => {
    const a = toScreen(C, rk.X - RACK.w / 2, 0, rk.Z);
    const b = toScreen(C, rk.X + RACK.w / 2, 0, rk.Z + RACK.d);
    const t = Math.min(toScreen(C, rk.X, -RACK.h, rk.Z)[1], toScreen(C, rk.X, -RACK.h, rk.Z + RACK.d)[1]);
    return !(Math.max(a[0], b[0]) < -40 || Math.min(a[0], b[0]) > 1120 || t > 1960 || Math.max(a[1], b[1]) < -40);
  };
  const racks = racksAt(frame).filter(onScreen);
  const rowMap = new Map<number, Live[]>();
  for (const rk of racks) {
    const a = rowMap.get(rk.b.row);
    if (a) a.push(rk);
    else rowMap.set(rk.b.row, [rk]);
  }
  const rows = [...rowMap.entries()].sort((a, b) => b[0] - a[0]);
  const rowEls: React.ReactNode[] = [];
  for (const [ri, rr] of rows) {
    // each side outside-in toward the axis (the vanishing point is on it), the first rack's column last
    const left = rr.filter((rk) => rk.X < -1).sort((a, b) => a.X - b.X);
    const right = rr.filter((rk) => rk.X > 1).sort((a, b) => b.X - a.X);
    const mid = rr.filter((rk) => Math.abs(rk.X) <= 1);
    const seq = [...left, ...right, ...mid];
    // consecutive racks in the same state: settled, or rising with the same copy
    const groups: { key: string; racks: Live[] }[] = [];
    for (const rk of seq) {
      const key = rk.e >= 1 ? "s" : rk.b.copy;
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.racks.push(rk);
      else groups.push({ key, racks: [rk] });
    }
    groups.forEach((g, gi) => {
      const uid = `r${ri}g${gi}`;
      if (g.key === "s") {
        rowEls.push(
          <React.Fragment key={uid}>
            <RackField A={A} racks={g.racks} frame={frame} uid={`ct${uid}`} shadow={1} cull={false} />
            <TopShade A={A} racks={g.racks} />
            <Glints A={A} racks={g.racks} frame={frame} />
          </React.Fragment>,
        );
        return;
      }
      const e = g.racks[0].e;
      const u = frame - g.racks[0].b.start;
      const dy = RACK.h * (1 - e);
      const AL = lowered(A, dy);
      const x0 = Math.min(...g.racks.map((rk) => rk.X)) - RACK.w / 2;
      const x1 = Math.max(...g.racks.map((rk) => rk.X)) + RACK.w / 2;
      const Z = g.racks[0].Z;
      const id = `ctc${uid}`;
      rowEls.push(
        <g key={uid} opacity={ss(c01(u / 2.5)).toFixed(3)}>
          <ContactBand A={A} x0={x0} x1={x1} Z={Z} amt={e * e} uid={`${id}-cb`} />
          <defs>
            <clipPath id={id}>
              <path d={aboveFootprint(A, x0, x1, Z)} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id})`}>
            <RackField A={AL} racks={g.racks} frame={frame} uid={`ctu${uid}`} shadow={0.001} cull={false} />
            <TopShade A={AL} racks={g.racks} />
            <Glints A={AL} racks={g.racks} frame={frame} />
          </g>
        </g>,
      );
    });
  }
  return (
    <AirStage v={A.v} bloom={0.22} shafts={0.3}>
      <WorldSvg cam={cam}>
        <g transform={`translate(${(C.shift / C.k).toFixed(4)} 0)`}>
          <AirFloor A={A} x0={-30000} x1={30000} z0={-20000} z1={40000} mat={MAT_SAND} course={0.6 * U} plank={0.6 * U} jointAmt={0.6} melt={0.5} />
          <AirHorizonHazeW A={A} id="ct-haze" />
          <LightPool A={A} racks={racks.filter((rk) => rk.b.gen <= 5)} />
          <Slots A={A} frame={frame} />
          {STENCILS.map((st, n) => (
            <YearStencil key={st.text} A={A} st={st} t={stencilA(n, frame)} />
          ))}
          {rowEls}
        </g>
      </WorldSvg>
    </AirStage>
  );
};

export default ComputeTriples;
