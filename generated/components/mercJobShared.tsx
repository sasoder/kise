import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  ALPHA,
  COLOR,
  EDGE,
  GEO,
  GRAIN,
  GROUND,
  METRIC,
  POOL,
  STROKE,
  TYPE,
  VIGNETTE,
  AmberGradient,
  ElevationShadow,
  FigureMark,
  GROUND_ONLY,
  Label,
  Numeral,
  labelWidth,
  numeralWidth,
  LightSweep,
  bloomFilter,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  opticalFit,
  rectPath,
  smoothstep,
  type Elevation,
  type Silhouette,
} from "./stoutShared";
import { camEase, type Cam, type Glide } from "./outgrowShared";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";

// ===========================================================================
// mercJobShared — Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01).
// ONE world for five cuts (brief: out/mercjob/briefs/BRIEF.md), in the Cheeky Pint
// S4 system (stoutShared, palette B1), in the house 9:16 frame (1080x1920, content centre y 835,
// subject ink above the captions at y 1400, read at 270 px wide). (Pass 1-2 were 16:9; converted Oct 5.)
//
// THE WORLD (world px; the floor is FLOOR):
//   * two team tiles on one floor: WILLIAMS (left, x WX) and MERCEDES (right, x MX), PAIR_PITCH apart;
//   * TOTO, the person bust in AMBER (the clip's only amber: amber = Toto), 0.55 of a tile tall,
//     standing on the floor at HOME (on Williams' inner side) or VISITING (left of Mercedes), both
//     BETWEEN the tiles, so no path of his ever crosses a tile; or ON TOP of the Mercedes tile (Act B);
//   * money is a cream BAR (3 tiles tall: the portrait frame's vertical room) rising out of the slot in
//     a tile's top edge (no numbers);
//   * Mercedes' setup: two HUB tiles (engine, F1 car) living behind the Mercedes tile, sliding out to
//     its right (see HUBS below);
//   * the TROPHY (cream Lucide-grammar outline) over Mercedes' bar, the TOP 6 lockup over Williams';
//   * THE INDUSTRY (Act B): the 2013 grid as a STARTING-GRID FORMATION (GRID below): two columns (x WX
//     and MX) running down the frame, 6 rows x 2 = 12 slots, rows level pairs staggered sideways
//     (odd rows shifted right), Williams + Mercedes the level pair of the MIDDLE row (row 2), the 9
//     others in the remaining slots and the back-right slot empty;
//   * the F1 mark (cream) anchored above the formation's front.
//
// PAIR PITCH 300: the pair framings (Williams' left edge to Mercedes' right edge, 396 world) fit 1080 at
// k 2.3-2.34 with >= 64 px side margins and tiles >= 220 px, and leave Toto 111 world between HOME and
// VISITING. HUBS: they slide out to Mercedes' RIGHT (engine, then car), smaller than the team tiles (64),
// the camera re-centring the column on Toto + tile + hubs at k 2.66 (tiles 255, hubs 170 px). The
// suggested split (engine left, Toto left of it) needs VISITING ~85 world further left, i.e. a pitch
// >= 338, which forces the pair framings to k <= 2.19 (tiles ~210 px) at 64 px margins.
//
// UNITS: world px under the camera for geometry and shadows; SCREEN px for type, hairlines,
// edges, slot lines and bloom (`px / k`), exactly as stoutShared.
// THE CLOCK: Act A (cuts 1-3) and Act B (cuts 4-5) each run on one continuous story clock S;
// every state here is a pure function of S, so a fractional join (cut 3 at S 69.12 into cut 2)
// is exact.
// ===========================================================================

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `mj${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const fail = (m: string): never => {
  throw new Error(`mercJobShared: ${m}`);
};
type P = [number, number];

// ===========================================================================
// FRAME, TYPE, CAMERA CONSTANTS (landscape)
// ===========================================================================
export const FPS = 24;
export const FRAME_W = 1080;
export const FRAME_H = 1920;
/** The content centre's screen y (the house 9:16 framing: captions sit below y 1400). */
export const LOOK_Y = 835;
/** The camera centre is look + CAM_LIFT / k, so the look lands at screen y LOOK_Y. */
export const CAM_LIFT = FRAME_H / 2 - LOOK_Y;
/** The caption line: subject ink stays above it. */
export const CAPTION_Y = 1400;
/** Nothing that enters (the trophy, TOP 6) stands above this screen y. */
export const TOP_CLEAR = 180;
/** The S4 type sizes as they are (the frame they were tuned for). */
export const TYPE_FACTOR = 1;
export const TYPE_L = { HERO: TYPE.HERO, SECONDARY: TYPE.SECONDARY, LABEL: TYPE.LABEL } as const;
/** Every stroked glyph of the set (the trophy) draws at the stoutShared sport-glyph weight:
 *  2.6 units of a 24-unit box filling GEO.SPORT_FILL of a tile, in WORLD px. */
export const GLYPH_STROKE = (2.6 * GEO.TILE * GEO.SPORT_FILL) / 24;

// ===========================================================================
// THE WORLD (world px)
// ===========================================================================
export const FLOOR = 600;
export const TILE = GEO.TILE; // 96
export const TILE_TOP = FLOOR - TILE; // 504
/** The pair's pitch (centre to centre). */
export const PAIR_PITCH = 300;
export const MX = 2016; // Mercedes
export const WX = MX - PAIR_PITCH; // 1716, Williams
/** The budget bar (both teams, "the same budgets"): world px above the tile's top edge (3 tiles). */
export const BAR_H = 288;
export const BAR_TOP = TILE_TOP - BAR_H; // 216
/** Toto: the bust is TOTO_H tall (and as wide), 0.55 of a tile. */
export const TOTO_H = 0.55 * TILE;
/** Toto's gap to the tile he stands beside. */
export const TOTO_GAP = 20;
export type Pose = { x: number; feetY: number };
/** HOME stands on Williams' INNER side (right of it), so no path of his ever crosses a tile. */
export const TOTO_HOME: Pose = { x: WX + TILE / 2 + TOTO_GAP + TOTO_H / 2, feetY: FLOOR };
export const TOTO_VISITING: Pose = { x: MX - TILE / 2 - TOTO_GAP - TOTO_H / 2, feetY: FLOOR };
export const TOTO_ON_MERC: Pose = { x: MX, feetY: TILE_TOP };
/** Mercedes' setup: two hub tiles (engine, F1 car), HUB world px, behind the Mercedes tile at rest
 *  (fully hidden: HUB < TILE), sliding out to its right at floor level to HUB_OUT (16 px gaps). */
export const HUB = 64;
export const HUB_GAP = 16;
export const HUB_OUT: [number, number] = [MX + TILE / 2 + HUB_GAP + HUB / 2, MX + TILE / 2 + 2 * HUB_GAP + 1.5 * HUB]; // 2096, 2176
/** The trophy (Lucide grammar): its path box TROPHY_BOX world px, standing TROPHY_GAP over the bar. */
export const TROPHY_BOX = 56;
export const TROPHY_GAP = 24;
export const TROPHY_BOTTOM = BAR_TOP - TROPHY_GAP; // 192 (the path box's bottom)
export const TROPHY_CY = TROPHY_BOTTOM - TROPHY_BOX / 2; // 164 (the TOP 6 lockup's centre stands here too)
/** DARK: one tone below board, a barely-there texture (icebergShared's DARK). */
export const DARK = mixHex(COLOR.ground, COLOR.board, 0.15);

// --- THE INDUSTRY (Act B): a starting-grid formation -------------------------------------------------
/**
 * GRID: 6 rows x 2 columns = 12 slots, front (row 0) at the top, running down the frame. Columns at WX
 * (left, "L") and MX (right, "R"); rows GRID.rowPitch apart; every row a level pair; odd rows shifted
 * right by GRID.shift (the stagger), so the columns zig-zag. Williams + Mercedes are row GRID.pairRow
 * (2: the middle, unshifted, on FLOOR, exactly where Act A has them); the back-right slot (11) is empty.
 * Each slot: { slot, row, col, x, floor (its tile's bottom edge), team }.
 */
export const GRID = { rows: 6, rowPitch: 192, shift: 64, pairRow: 2, emptySlot: 11 } as const;
export type GridSlot = { slot: number; row: number; col: "L" | "R"; x: number; floor: number; team: "williams" | "mercedes" | "other" | "empty" };
export const GRID_SLOTS: GridSlot[] = Array.from({ length: GRID.rows * 2 }, (_, slot) => {
  const row = Math.floor(slot / 2);
  const col = slot % 2 === 0 ? "L" : "R";
  const x = (col === "L" ? WX : MX) + (row % 2 === 1 ? GRID.shift : 0);
  const floor = FLOOR + (row - GRID.pairRow) * GRID.rowPitch;
  const team = row === GRID.pairRow ? (col === "L" ? "williams" : "mercedes") : slot === GRID.emptySlot ? "empty" : "other";
  return { slot, row, col, x, floor, team };
});
/** The 9 other teams' slots, in slot order: `WorldState.row.reveal[i]` addresses GRID_OTHERS[i]. */
export const GRID_OTHERS: GridSlot[] = GRID_SLOTS.filter((g) => g.team === "other");
/** The formation's box (tile edges, world px) and its centre. */
export const GRID_BOX = {
  x0: Math.min(...GRID_SLOTS.map((g) => g.x)) - TILE / 2,
  x1: Math.max(...GRID_SLOTS.map((g) => g.x)) + TILE / 2,
  y0: Math.min(...GRID_SLOTS.map((g) => g.floor)) - TILE,
  y1: Math.max(...GRID_SLOTS.map((g) => g.floor)),
};
export const GRID_CENTRE = { x: (GRID_BOX.x0 + GRID_BOX.x1) / 2, y: (GRID_BOX.y0 + GRID_BOX.y1) / 2 };
/** Compatibility (the 16:9 row's names): the 9 others' x and slot list (now the formation's). */
export const ROW_X: number[] = GRID_OTHERS.map((g) => g.x);
export const ROW_SLOTS = GRID_OTHERS.map((g) => g.slot);
export const rowSlotX = (i: number) => GRID_SLOTS[i].x;
export const ROW_CENTRE_X = GRID_CENTRE.x;
/** The F1 mark's anchor (Act B): bottom-centre of its box, centred over the formation's front row,
 *  64 world px above its tiles. */
export const F1_ANCHOR = { x: GRID_CENTRE.x, bottom: GRID_BOX.y0 - 64 } as const;
{
  if (GRID_OTHERS.length !== 9) fail("9 other teams");
  if (GRID_SLOTS.filter((g) => g.team !== "empty").length !== 11) fail("11 teams");
  if (GRID_SLOTS[GRID.pairRow * 2].x !== WX || GRID_SLOTS[GRID.pairRow * 2 + 1].x !== MX) fail("the pair row is Williams + Mercedes, unshifted");
  // Toto on the Mercedes tile clears the row in front of it
  if (TILE_TOP - TOTO_H - (FLOOR - GRID.rowPitch) < 24) fail("Toto on Mercedes crowds the row in front");
}

// ===========================================================================
// CAMERA (landscape): the house superposed glides + damped follower, look on LOOK_Y
// ===========================================================================
export type { Cam, Glide };
export const toScreenL = (c: Cam, x: number, y: number) => ({ x: FRAME_W / 2 + (x - c.x) * c.k, y: FRAME_H / 2 + (y - c.y) * c.k });
/** A camera whose centre puts world point (wx, wy) at screen point (sx, sy). */
export const camForL = (wx: number, wy: number, sx: number, sy: number, k: number): Cam => ({
  x: wx - (sx - FRAME_W / 2) / k,
  y: wy - (sy - FRAME_H / 2) / k,
  k,
});
/** The visible world rect of a camera (no sway). */
export const viewOf = (c: Cam) => ({ x0: c.x - FRAME_W / 2 / c.k, x1: c.x + FRAME_W / 2 / c.k, y0: c.y - FRAME_H / 2 / c.k, y1: c.y + FRAME_H / 2 / c.k });
/**
 * cameraTrackL: outgrowShared's cameraTrack for the landscape frame. `start` is a LOOK (the world
 * point on screen (960, LOOK_Y)); glides are eased deltas of look x / y and ln k over [f0, f1]
 * (smoothstep^warp, so they superpose C1); then the house damped follower (CAM_STIFF / CAM_DAMP).
 * Returns camera CENTRES, one per frame f = 0 .. frames + 2 (index = f).
 */
export const cameraTrackL = (start: { x: number; y: number; k: number }, glides: Glide[], frames: number): Cam[] => {
  const T: Cam[] = [];
  for (let f = 0; f <= frames + 2; f++) {
    let x = start.x;
    let y = start.y;
    let lk = Math.log(start.k);
    let kPrev = start.k;
    for (const g of glides) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    const k = Math.exp(lk);
    T.push({ x, y: y + CAM_LIFT / k, k });
  }
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let f = 0; f < T.length; f++) {
    if (f > 0) {
      const t = T[f];
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    out.push({ ...c });
  }
  return out;
};
/** A camera track keyed on a story clock: glides in S, a pre-roll so S 0 is already settled
 *  (or already moving), sampled continuously (linear between frames, so a fractional S is exact). */
export const makeClockCam = (startLook: { x: number; y: number; k: number }, glides: Glide[], S_END: number, PRE = 40) => {
  const track = cameraTrackL(
    startLook,
    glides.map((g) => ({ ...g, f0: g.f0 + PRE, f1: g.f1 + PRE })),
    S_END + PRE + 4,
  ).slice(PRE);
  const at = (S: number): Cam => {
    const a = Math.max(0, Math.min(track.length - 2, Math.floor(S)));
    const t = Math.max(0, Math.min(1, S - a));
    const A = track[a];
    const B = track[a + 1];
    return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), k: lerp(A.k, B.k, t) };
  };
  return { track, at, rest: track[0] };
};
/**
 * camCheckL: the brief's two camera numbers over S in [S0, S1] (integer frames): the largest screen
 * speed (px/f) and the largest change of screen velocity (|dv|, px/f^2) of fixed world points at the
 * frame's centre and at (±200, ±300) from it (the house camJerk's points; on the 9:16 frame).
 */
export const camCheckL = (at: (S: number) => Cam, S0: number, S1: number) => {
  let maxA = 0;
  let atA = S0;
  let maxV = 0;
  let atV = S0;
  const pts: P[] = [
    [0, 0],
    [-200, -300],
    [200, 300],
    [-200, 300],
    [200, -300],
  ];
  for (let S = S0 + 1; S < S1; S++) {
    const c0 = at(S - 1);
    const c1 = at(S);
    const c2 = at(S + 1);
    for (const [ox, oy] of pts) {
      const wx = c1.x + ox / c1.k;
      const wy = c1.y + oy / c1.k;
      const s0 = toScreenL(c0, wx, wy);
      const s1 = toScreenL(c1, wx, wy);
      const s2 = toScreenL(c2, wx, wy);
      const v = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      const a = Math.hypot(s2.x - 2 * s1.x + s0.x, s2.y - 2 * s1.y + s0.y);
      if (a > maxA) {
        maxA = a;
        atA = S;
      }
      if (v > maxV) {
        maxV = v;
        atV = S;
      }
    }
  }
  return { maxA, atA, maxV, atV };
};
/** The amber band for a frame (screen y 300 -> 1368, the house band): every amber body of a frame samples it. */
export const amberBandForL = (c: Cam, y0 = 300, y1 = 1368): [number, number] => [c.y + (y0 - FRAME_H / 2) / c.k, c.y + (y1 - FRAME_H / 2) / c.k];

// ===========================================================================
// MOTION HELPERS
// ===========================================================================
/** Rest to rest with a long soft landing: velocity ∝ t (1 - t)^(p - 1); exactly 1 at t = 1. */
export const restToRest = (t: number, p: number) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, p) * (1 + p * u);
};
/** The house text entrance (stoutShared's): slide up 24 SCREEN px, fade, blur 6 -> 0 px. */
export const entranceOf = (enter: number, exit = 0) => {
  const a = easeOutCubic(enter);
  const e = 1 - Math.pow(1 - clamp01(exit), 3);
  return { lift: (1 - a) * 24 + e * 24, opacity: a * (1 - e), blur: 6 * (1 - a) + 6 * e };
};
/**
 * Toto's travel from pose a to pose b between S0 and S1 (S4: lift one elevation, glide, settle; no hop).
 * x eases rest to rest (velocity ∝ t (1 - t)^1.5: a decelerating landing); the feet follow the same
 * progress in y (an up-and-over move to the Mercedes tile's top rises EARLY: `riseLead` > 0 runs the
 * vertical progress ahead of the horizontal so he clears the tile's corner); `lift` (0..1) is the
 * elevation envelope: up over the first 25 %, held, settled over the last 30 % (zero vertical speed
 * at the landing); the body rises LIFT_DY world px with it. A lifted Toto passes OVER a tile (toward the
 * viewer: S4's board seen from above), his lifted shadow on it; `opts` (additive) sets the landing's power
 * p (default 2.5) and where the settle starts (default 0.7).
 */
export const LIFT_DY = 6;
export const totoTravel = (a: Pose, b: Pose, S: number, S0: number, S1: number, riseLead = 0, opts: { p?: number; settleFrom?: number } = {}) => {
  const u = (S - S0) / (S1 - S0);
  const pw = opts.p ?? 2.5; // the landing's softness (3 = longer: Act A, so he is clear of Williams' tile before he settles)
  const sf = opts.settleFrom ?? 0.7; // where the settle starts (fraction of the move)
  const ux = restToRest(u, pw);
  const uy = riseLead > 0 ? restToRest(clamp01(u * (1 + riseLead)), pw) : ux;
  const lift = u <= 0 || u >= 1 ? 0 : smoothstep(u / 0.25) * (1 - smoothstep((u - sf) / (1 - sf)));
  return { x: lerp(a.x, b.x, ux), feetY: lerp(a.feetY, b.feetY, uy), lift };
};
/** A damped follower over an eased target (the light pool's lag), sampled continuously in S. */
export const POOL_STIFF = 0.09;
export const POOL_DAMP = 0.468;
export type PoolKey = { S0: number; S1: number; x: number; y: number; spread?: number };
export const makePoolTrack = (start: { x: number; y: number; spread?: number }, keys: PoolKey[], S_END: number, PRE = 40) => {
  const target = (S: number) => {
    let p = { x: start.x, y: start.y, spread: start.spread ?? 1 };
    for (const w of keys) {
      const e = smoothstep((S - w.S0) / (w.S1 - w.S0));
      p = { x: lerp(p.x, w.x, e), y: lerp(p.y, w.y, e), spread: lerp(p.spread, w.spread ?? p.spread, e) };
    }
    return p;
  };
  const out: { x: number; y: number; spread: number }[] = [];
  let p = target(-PRE);
  let v = { x: 0, y: 0, spread: 0 };
  for (let S = -PRE; S <= S_END + 2; S++) {
    const t = target(S);
    v = {
      x: v.x + (t.x - p.x) * POOL_STIFF - v.x * POOL_DAMP,
      y: v.y + (t.y - p.y) * POOL_STIFF - v.y * POOL_DAMP,
      spread: v.spread + (t.spread - p.spread) * POOL_STIFF - v.spread * POOL_DAMP,
    };
    p = { x: p.x + v.x, y: p.y + v.y, spread: p.spread + v.spread };
    if (S >= 0) out.push({ ...p });
  }
  return (S: number) => {
    const i = Math.max(0, Math.min(out.length - 2, Math.floor(S)));
    const t = Math.max(0, Math.min(1, S - i));
    return { x: lerp(out[i].x, out[i + 1].x, t), y: lerp(out[i].y, out[i + 1].y, t), spread: lerp(out[i].spread, out[i + 1].spread, t) };
  };
};

// ===========================================================================
// THE STAGE (stoutShared's StoutStage + a pool `spread`, for this module's frame): the baked ground
// sheet (rotated 90° only if the frame were landscape), mirror-padded past its edges, parallax 0.15 +
// drift on S, a gentle zoom with k; the light pool (screen-blended; `spread` widens it); the world under
// the camera; the vignette; film grain on twos.
// ===========================================================================
const ROTATE = FRAME_W > FRAME_H;
const SHEET_W = ROTATE ? GROUND.H : GROUND.W; // 1296 on 9:16
const SHEET_H = ROTATE ? GROUND.W : GROUND.H; // 2304
/** The pool's ellipse for this frame (the house POOL on 9:16). */
export const POOL_L = ROTATE ? ({ rx: POOL.ry, ry: POOL.rx } as const) : ({ rx: POOL.rx, ry: POOL.ry } as const);
const Sheet: React.FC<{ src: string; style: React.CSSProperties }> = ({ src, style }) => (
  <div style={{ position: "absolute", left: (FRAME_W - SHEET_W) / 2, top: (FRAME_H - SHEET_H) / 2, width: SHEET_W, height: SHEET_H, ...style }}>
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: (SHEET_W - GROUND.W) / 2,
        top: (SHEET_H - GROUND.H) / 2,
        width: GROUND.W,
        height: GROUND.H,
        transform: ROTATE ? "rotate(90deg)" : undefined,
      }}
    />
  </div>
);
/** stoutShared's groundCopies (GROUND_EDGE) for the landscape sheet: mirrored copies past its edges. */
const groundCopiesL = (gx: number, gy: number, s: number) => {
  const W = SHEET_W;
  const H = SHEET_H;
  const odd = (n: number) => Math.abs(n) % 2 === 1;
  const q = (p: number, c: number, g: number, half: number) => (p - c - g) / s + half;
  const i0 = Math.floor(q(-1, FRAME_W / 2, gx, W / 2) / W);
  const i1 = Math.floor(q(FRAME_W + 1, FRAME_W / 2, gx, W / 2) / W);
  const j0 = Math.floor(q(-1, FRAME_H / 2, gy, H / 2) / H);
  const j1 = Math.floor(q(FRAME_H + 1, FRAME_H / 2, gy, H / 2) / H);
  const out: { key: string; matrix: string }[] = [];
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      if (i === 0 && j === 0) continue;
      const ax = odd(i) ? -1 : 1;
      const ay = odd(j) ? -1 : 1;
      const bx = i * W + (odd(i) ? W : 0);
      const by = j * H + (odd(j) ? H : 0);
      const e = W / 2 + gx + s * (bx - W / 2);
      const f = H / 2 + gy + s * (by - H / 2);
      out.push({ key: `${i},${j}`, matrix: `matrix(${fx(ax * s)}, 0, 0, ${fx(ay * s)}, ${fx(e)}, ${fx(f)})` });
    }
  }
  return out;
};
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export type PoolL = { x: number; y: number; strength?: number; spread?: number } | null;
/** The house sway (screen px) on the story clock. */
export const swayAt = (S: number, on = true) => (on ? { dx: 3 * Math.sin(S / 23), dy: 5 * Math.sin(S / 19) } : { dx: 0, dy: 0 });
export const MJStage: React.FC<{
  S: number;
  cam: Cam;
  rest?: Cam;
  pool?: PoolL;
  sway?: boolean;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ S, cam, rest = cam, pool = null, sway = true, children, overlay }) => {
  const k = cam.k;
  const sw = swayAt(S, sway);
  const tx = FRAME_W / 2 - cam.x * k + sw.dx;
  const ty = FRAME_H / 2 - cam.y * k + sw.dy;
  const gScale = Math.pow(k / rest.k, GROUND.zoom);
  const gx = -(cam.x - rest.x) * k * GROUND.parallax;
  const gy = -(cam.y - rest.y) * k * GROUND.parallax - S * GROUND.drift;
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash01(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 7) * 2 - 1) * GRAIN.travel;
  const p = pool
    ? { x: FRAME_W / 2 + (pool.x - cam.x) * k + sw.dx, y: FRAME_H / 2 + (pool.y - cam.y) * k + sw.dy, s: pool.strength ?? 1, sp: pool.spread ?? 1 }
    : null;
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground, overflow: "hidden" }}>
      {groundCopiesL(gx, gy, gScale).map((c) => (
        <Sheet key={c.key} src={GROUND.src} style={{ left: (FRAME_W - SHEET_W) / 2, top: (FRAME_H - SHEET_H) / 2, transformOrigin: "0 0", transform: c.matrix }} />
      ))}
      <Sheet src={GROUND.src} style={{ transform: `translate(${fx(gx)}px, ${fx(gy)}px) scale(${fx(gScale)})` }} />
      {p ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse ${f3(POOL_L.rx * p.sp)}px ${f3(POOL_L.ry * Math.sqrt(p.sp))}px at ${fx(p.x)}px ${fx(p.y)}px, rgba(${POOL.color},${f3(
              POOL.a0 * p.s,
            )}) 0%, rgba(${POOL.color},${f3(POOL.a1 * p.s)}) 45%, rgba(${POOL.color},0) 100%)`,
          }}
        />
      ) : null}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${fx(k)})`}>{GROUND_ONLY ? null : children}</g>
      </svg>
      {GROUND_ONLY ? null : overlay}
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <Sheet src={GROUND.grain} style={{ transform: `translate(${fx(grx)}px, ${fx(gry)}px)` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ===========================================================================
// MARKS (tile-local box 0..size; black = knocked out to the ground)
// ===========================================================================
/**
 * WILLIAMS — public/cheekypint2/mercjob/williams.svg (Williams Racing 2022 logo, Wikimedia Commons,
 * CC BY-SA 4.0; SOURCES.txt there): its "WILLIAMS" path only (RACING dropped: Toto's 2012 team was
 * not called that), inlined verbatim as data (never an <image>: it races frame capture). Path units;
 * the ink box below was measured off the path.
 */
const WILLIAMS_D =
  "m 23.581192,5.8462835 h 1.311092 V 0.07004733 H 23.581192 Z M 19.767979,0.07004733 H 18.458084 V 5.8462835 h 3.806017 V 4.8017353 H 19.767979 Z M 36.142197,3.1784815 33.344715,0.00401262 H 33.16942 V 5.8510863 h 1.264273 V 3.7235674 a 8.6085236,8.6085236 0 0 0 -0.04203,-0.9797145 c 0,0 0.222117,0.340978 0.446633,0.6111208 l 1.217446,1.4995881 h 0.184901 l 1.211431,-1.4995881 c 0.218517,-0.2689406 0.440632,-0.6099204 0.440632,-0.6099204 a 8.6085236,8.6085236 0 0 0 -0.04202,0.9797147 v 2.1263183 h 1.264266 V 0.00401262 H 38.939656 Z M 43.473244,2.3824627 43.175475,2.2551963 C 42.787674,2.0907091 42.443099,1.9058111 42.443099,1.5480239 c 0,-0.2893512 0.164479,-0.4802522 0.513876,-0.4802522 a 0.90767703,0.90767703 0 0 1 0.790007,0.5042649 L 44.729096,0.98732939 C 44.314894,0.26695072 43.648533,-0.02 42.928152,-0.02 c -1.06376,0 -1.727709,0.69756669 -1.746911,1.5908363 -0.02041,0.9929214 0.686743,1.4407565 1.546401,1.8069491 l 0.297753,0.1272676 c 0.545095,0.240127 0.800834,0.41902 0.791221,0.7804102 -0.01087,0.3409787 -0.240127,0.5871081 -0.731189,0.5871081 -0.58711,0 -0.932882,-0.3229692 -1.140579,-0.7648029 l -1.037363,0.5931123 c 0.280954,0.6507421 1.058966,1.2486565 2.169554,1.2486565 1.110572,0 2.008649,-0.5823055 2.047076,-1.6532696 C 45.156521,3.3729832 44.538188,2.800283 43.47445,2.375259 M 3.8139937,0.02202209 1.6864772,4.6324451 2.1307091,5.8462835 H 2.3384183 L 3.6218924,2.9539632 A 4.3955101,4.3955101 0 0 0 3.9064437,2.2263802 4.7941204,4.7941204 0 0 0 4.1861897,2.946758 L 5.4768673,5.8462835 H 5.6845774 L 6.1276102,4.6324451 4.0012934,0.02202209 Z M 1.3695088,0.07004733 H 0.02 L 1.549604,4.2590495 2.2699825,2.6886238 Z M 5.5332969,2.6742171 6.2632821,4.2590495 7.7976878,0.07004733 H 6.4349717 Z m 4.014912,3.1720664 H 10.858097 V 0.07004733 H 9.5482089 Z M 14.604065,0.07004733 H 13.294187 V 5.8462835 h 3.805995 V 4.8017353 H 14.604065 Z M 29.056061,3.9096651 h -0.653135 l 0.49705,-1.2750698 c 0.09365,-0.2401262 0.156085,-0.4430327 0.156085,-0.4430327 0,0 0.06123,0.2053074 0.154886,0.4430327 L 29.708,3.9036619 Z m 0.09365,-3.89964933 H 28.962415 L 26.383451,5.8378783 h 1.258266 l 0.375795,-0.9244845 h 2.075901 l 0.375786,0.9244845 h 1.259459 z";
/** The WILLIAMS ink box [x, y, w, h] in path units, and its fill (ink area / box area). */
export const WILLIAMS_BOX = [0.02, -0.02, 45.137, 5.871] as const;
const WILLIAMS_FILL = 0.42;
/** One switch for the wordmark: "logo" = the real file's paths (default), "standin" = Söhne caps. */
export const WILLIAMS_MODE = "logo" as "logo" | "standin";
export const WilliamsMark: React.FC<{ size: number }> = ({ size }) => {
  if (WILLIAMS_MODE === "standin") {
    const fs = (GEO.TILE * 0.84 * size) / GEO.TILE / 5.13;
    return (
      <text x={f3(size / 2)} y={f3(size / 2 + (fs * METRIC.cap) / 2)} textAnchor="middle" fontFamily="StoutSohneKraftig" fontWeight={500} fontSize={f3(fs)} letterSpacing="0.06em" fill="#000">
        WILLIAMS
      </text>
    );
  }
  const [bx, by, bw, bh] = WILLIAMS_BOX;
  const fit = opticalFit(bw, bh, WILLIAMS_FILL, 0, size);
  const ox = fit.cx - (bx + bw / 2) * fit.sc;
  const oy = fit.cy - (by + bh / 2) * fit.sc;
  return (
    <g transform={`translate(${fx(ox)} ${fx(oy)}) scale(${fx(fit.sc)})`} fill="#000">
      <path d={WILLIAMS_D} />
    </g>
  );
};
export const MercedesMark: React.FC<{ size: number }> = ({ size }) => <FigureMark figure={{ kind: "mercedes" }} size={size} />;

// --- the hub glyphs (icebergShared's, copied): ENGINE block and the F1 CAR silhouette ---------------
type Cmd = ["M" | "L", number, number] | ["Q", number, number, number, number] | ["C", number, number, number, number, number, number] | ["Z"];
type Map2 = (x: number, y: number) => P;
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
const ENGINE_RECTS: [number, number, number, number][] = [
  [6, 9.2, 18, 18.6],
  [7.4, 6.4, 16.6, 8.6],
  [10, 4.4, 14, 5.9],
  [2.6, 10.6, 6, 14.8],
  [1.4, 9.6, 2.6, 15.8],
  [18, 12.6, 21.4, 15],
  [9.6, 18.6, 14.4, 20.4],
];
const ENGINE_BOX = { x0: 1.4, y0: 4.4, x1: 21.4, y1: 20.4 };
export const EngineMark: React.FC<{ size: number }> = ({ size }) => {
  const w = ENGINE_BOX.x1 - ENGINE_BOX.x0;
  const h = ENGINE_BOX.y1 - ENGINE_BOX.y0;
  const fit = opticalFit(w, h, 0.62, 0, size);
  const ox = fit.cx - (ENGINE_BOX.x0 + w / 2) * fit.sc;
  const oy = fit.cy - (ENGINE_BOX.y0 + h / 2) * fit.sc;
  return (
    <g fill="#000">
      {ENGINE_RECTS.map(([a, b, c, d], i) => (
        <path key={i} d={rectPath(ox + a * fit.sc, oy + b * fit.sc, (c - a) * fit.sc, (d - b) * fit.sc, 0.5 * fit.sc)} />
      ))}
    </g>
  );
};
// the car (metres: x 0 = the tail, 5.5 = the nose; y up from the ground)
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
  const R: P[] = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const n = Math.hypot(tx, ty) || 1;
    L.push([p[0] - (ty / n) * w, p[1] + (tx / n) * w]);
    R.push([p[0] + (ty / n) * w, p[1] - (tx / n) * w]);
  });
  const pts = [...L, ...R.reverse()];
  return [["M", pts[0][0], pts[0][1]] as Cmd, ...pts.slice(1).map((p) => ["L", p[0], p[1]] as Cmd), ["Z"] as Cmd];
})();
const CAR_SIL_CMDS: Cmd[][] = [CAR_BODY, CAR_WING_R, CAR_PILLAR, CAR_WING_F, CAR_HALO, circleCmds(HELMET.x, HELMET.y, HELMET.r)];
const CHASSIS_BOX = { x0: 0, x1: 5.56, y0: 0.03, y1: 1.14 };
/** The F1 car silhouette, knocked out (wheels ringed off the body by a cream gap). */
export const ChassisMark: React.FC<{ size: number }> = ({ size }) => {
  const w = CHASSIS_BOX.x1 - CHASSIS_BOX.x0;
  const h = CHASSIS_BOX.y1 - CHASSIS_BOX.y0;
  const fit = opticalFit(w, h, 0.42, 0, size);
  const ox = fit.cx - (CHASSIS_BOX.x0 + w / 2) * fit.sc;
  const oy = fit.cy + (CHASSIS_BOX.y0 + h / 2) * fit.sc;
  const map: Map2 = (mx, my) => [ox + mx * fit.sc, oy - my * fit.sc];
  return (
    <g>
      <g fill="#000">
        {CAR_SIL_CMDS.map((c, i) => (
          <path key={i} d={pathOf(c, map)} />
        ))}
      </g>
      <g fill="#fff">
        {WHEELS.map(([x, y], i) => (
          <path key={i} d={pathOf(circleCmds(x, y, WHEEL_R + 0.07), map)} />
        ))}
      </g>
      <g fill="#000">
        {WHEELS.map(([x, y], i) => (
          <path key={i} d={pathOf(circleCmds(x, y, WHEEL_R), map)} />
        ))}
      </g>
    </g>
  );
};

// ===========================================================================
// THE PILLAR (stoutShared's Pillar, cut down: tile + bar, ONE object, ONE union shadow) with any
// knock-out mark. dim 0 = cream (lit, the subject), 1 = board (context); eased by TONE only.
// ===========================================================================
export type Mark = "mercedes" | "williams" | "engine" | "chassis" | "none";
const MarkOf: React.FC<{ mark: Mark; size: number }> = ({ mark, size }) =>
  mark === "mercedes" ? (
    <MercedesMark size={size} />
  ) : mark === "williams" ? (
    <WilliamsMark size={size} />
  ) : mark === "engine" ? (
    <EngineMark size={size} />
  ) : mark === "chassis" ? (
    <ChassisMark size={size} />
  ) : null;
export const MJPillar: React.FC<{
  x: number;
  k: number;
  mark?: Mark;
  floor?: number;
  tile?: number;
  barW?: number;
  bar?: number;
  dim?: number;
  elevation?: Elevation;
  lift?: number;
  /** the shadow's strength (a hub still hidden behind the Mercedes tile casts none) */
  shadow?: number;
  /** 0..1 toward DARK (icebergShared's grammar): a plain dark square, its mark, lit edge and shadow fade out */
  dark?: number;
}> = (p) => {
  const uid = uidOf(useId());
  const k = p.k;
  const T = p.tile ?? TILE;
  const Wb = p.barW ?? GEO.BAR;
  const floor = p.floor ?? FLOOR;
  const tileTop = floor - T;
  const bar = Math.max(0, p.bar ?? 0);
  const dim = clamp01(p.dim ?? 0);
  const r = GEO.RADIUS;
  const tile = { x: p.x - T / 2, y: tileTop, w: T, h: T };
  const barR = bar > 0.01 ? { x: p.x - Wb / 2, y: tileTop - bar, w: Wb, h: bar } : null;
  const sil: Silhouette = [{ d: rectPath(tile.x, tile.y, tile.w, tile.h, r) }];
  if (barR) sil.push({ d: rectPath(barR.x, barR.y, barR.w, barR.h + r, r, true, false) });
  const creamTop = barR ? barR.y : tile.y;
  const dark = clamp01(p.dark ?? 0);
  const loEdge = lerp(ALPHA.edge, ALPHA.edgeBoard, dim) * (1 - dark);
  const slotW = Wb + (2 * EDGE.SLOT_LIP) / k;
  const slotH = EDGE.SLOT / k;
  const sw = f3(EDGE.CREAM / k);
  const ey = tile.y + EDGE.CREAM / k / 2;
  const elevation = p.elevation ?? "rest";
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(creamTop)} x2="0" y2={f3(floor)}>
          <stop offset="0" stopColor={mixHex(mixHex(COLOR.cream, COLOR.board, dim), DARK, dark)} />
          <stop offset="1" stopColor={mixHex(mixHex(COLOR.creamFoot, COLOR.boardFoot, dim), DARK, dark)} />
        </linearGradient>
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={f3(tile.x)} y={f3(tile.y)} width={f3(T)} height={f3(T)}>
          <rect x={f3(tile.x)} y={f3(tile.y)} width={f3(T)} height={f3(T)} fill="#fff" />
          <g transform={`translate(${fx(tile.x)} ${fx(tile.y)})`} opacity={dark > 0 ? f3(1 - dark) : undefined}>
            <MarkOf mark={p.mark ?? "none"} size={T} />
          </g>
        </mask>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {(p.shadow ?? 1) * (1 - dark) > 0.002 ? (
        <ShadowAtScale
          o={[p.x, floor]}
          s={T / TILE}
          sil={sil}
          elevation={elevation}
          lift={p.lift ?? 0}
          contact={elevation === "rest" ? { x: p.x, y: floor, w: T } : null}
          strength={(p.shadow ?? 1) * (1 - dark)}
        />
      ) : null}
      {barR ? <path d={rectPath(barR.x, barR.y, barR.w, barR.h, r, true, false)} fill={`url(#${uid}c)`} /> : null}
      <path d={rectPath(tile.x, tile.y, tile.w, tile.h, r)} fill={`url(#${uid}c)`} mask={`url(#${uid}k)`} />
      {barR ? (
        <path d={`M${f3(barR.x + r)} ${f3(barR.y + EDGE.CREAM / k / 2)}H${f3(barR.x + barR.w - r)}`} stroke={COLOR.edge} strokeOpacity={loEdge} strokeWidth={sw} />
      ) : null}
      {barR ? (
        <path
          d={`M${f3(tile.x + r)} ${f3(ey)}H${f3(p.x - slotW / 2)}M${f3(p.x + slotW / 2)} ${f3(ey)}H${f3(tile.x + T - r)}`}
          stroke={COLOR.edge}
          strokeOpacity={loEdge}
          strokeWidth={sw}
        />
      ) : (
        <path d={`M${f3(tile.x + r)} ${f3(ey)}H${f3(tile.x + T - r)}`} stroke={COLOR.edge} strokeOpacity={loEdge} strokeWidth={sw} />
      )}
      {barR ? (
        <>
          <rect x={f3(barR.x)} y={f3(tileTop - Math.min(barR.h, EDGE.FOOT_AO / k))} width={f3(barR.w)} height={f3(Math.min(barR.h, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
          <rect x={f3(p.x - slotW / 2)} y={f3(tileTop - slotH / 2)} width={f3(slotW)} height={f3(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
        </>
      ) : null}
    </g>
  );
};
/** The house elevation shadow for an object of extent s x TILE (icebergShared's ScaledShadow): the
 *  recipe is for TILE-scale objects, so offsets and blurs scale by s; the silhouette is drawn in
 *  world px (pre-scaled by 1 / s about o). */
const ShadowAtScale: React.FC<{
  o: P;
  s: number;
  sil: Silhouette;
  elevation?: Elevation;
  lift?: number;
  contact?: { x: number; y: number; w: number } | null;
  strength?: number;
}> = ({ o, s, sil, elevation = "rest", lift = 0, contact = null, strength = 1 }) => {
  if (Math.abs(s - 1) < 1e-9) return <ElevationShadow silhouette={sil} elevation={elevation} lift={lift} contact={contact} strength={strength} />;
  return (
    <g transform={`translate(${fx(o[0])} ${fx(o[1])}) scale(${fx(s)}) translate(${fx(-o[0])} ${fx(-o[1])})`}>
      {/* the silhouette pre-scaled by 1 / s: it lands in world px, only the offsets and blurs carry s */}
      <ElevationShadow
        silhouette={sil.map((q) => ({ ...q, d: scalePathAbout(q.d, o, 1 / s) }))}
        elevation={elevation}
        lift={lift}
        contact={contact ? { x: o[0] + (contact.x - o[0]) / s, y: o[1] + (contact.y - o[1]) / s, w: contact.w / s } : null}
        strength={strength}
      />
    </g>
  );
};
/** Scale an absolute path (M/L/H/V/A/C/Q/Z with absolute numbers, as rectPath / pathOf write them)
 *  about point o by s. Arc radii scale; flags stay. */
const scalePathAbout = (d: string, o: P, s: number) => {
  const toks = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let out = "";
  let cmd = "";
  let idx = 0;
  const X = (v: number) => f3(o[0] + (v - o[0]) * s);
  const Y = (v: number) => f3(o[1] + (v - o[1]) * s);
  for (const t of toks) {
    if (/[A-Za-z]/.test(t)) {
      cmd = t;
      idx = 0;
      out += t;
      continue;
    }
    const v = parseFloat(t);
    let w: string;
    if (cmd === "H") w = X(v);
    else if (cmd === "V") w = Y(v);
    else if (cmd === "A") {
      const j = idx % 7;
      w = j === 0 || j === 1 ? f3(v * s) : j === 5 ? X(v) : j === 6 ? Y(v) : t;
    } else w = idx % 2 === 0 ? X(v) : Y(v);
    out += (idx > 0 ? " " : "") + w;
    idx++;
  }
  return out;
};

// ===========================================================================
// TOTO — the person bust (icebergShared's bustPath geometry, public/person.png as a vector), AMBER
// ===========================================================================
const GS = 1 / 429; // person.png's ink spans 41..470 of its 512 box: a unit bust
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
/** The bust TOTO_H tall with its ink box centred on (cx, cy), as one path. */
export const totoPath = (cx: number, cy: number, h = TOTO_H) => pathOf([...BUST_HEAD, ...BUST_BODY], (u, v) => [cx + (u - 255.5) * GS * h, cy + (v - 255.5) * GS * h]);
/** The head (relative to the bust's centre) for a bust h tall. */
export const totoHead = (h = TOTO_H) => ({ cy: (143 - 255.5) * GS * h, r: 102 * GS * h });
/**
 * TotoBust — amber (the band gradient + the fixed bloom + a 2 px hot top edge on the head), one
 * shadow (rest with its contact on the surface he stands on; `lift` 0..1 eases it toward lifted
 * while he travels, and the body rises LIFT_DY world px with it).
 */
export const TotoBust: React.FC<{ x: number; feetY: number; k: number; lift?: number; band: [number, number] }> = ({ x, feetY, k, lift = 0, band }) => {
  const uid = uidOf(useId());
  const dy = LIFT_DY * smoothstep(lift);
  const cy = feetY - TOTO_H / 2 - dy;
  const d = totoPath(x, cy);
  const head = totoHead();
  const hx = x;
  const hy = cy + head.cy;
  const hr = head.r;
  const hot = EDGE.HOT / k;
  const s = TOTO_H / TILE;
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <clipPath id={`${uid}h`}>
          <circle cx={f3(hx)} cy={f3(hy)} r={f3(hr)} />
        </clipPath>
        <linearGradient id={`${uid}hf`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hy - hr)} x2="0" y2={f3(hy - hr + EDGE.HOT_FALL / k)}>
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <ShadowAtScale
        o={[x, feetY]}
        s={s}
        sil={[{ d: totoPath(x, cy) }]}
        lift={lift}
        contact={lift < 0.999 ? { x, y: feetY, w: TOTO_H * 0.92 } : null}
      />
      <g style={{ filter: bloomFilter(k) }}>
        <path d={d} fill={`url(#${uid}a)`} />
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
  );
};

// ===========================================================================
// THE TROPHY (Lucide "trophy", ISC; 24-unit box, path box x 2..22, y 2..22), cream outline at
// GLYPH_STROKE, standing on the ground like type (no card, no shadow); the house entrance.
// ===========================================================================
const TROPHY_D = [
  "M6 9H4.5a2.5 2.5 0 0 1 0-5H6",
  "M18 9h1.5a2.5 2.5 0 0 0 0-5H18",
  "M4 22h16",
  "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",
  "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",
  "M18 2H6v7a6 6 0 0 0 12 0V2Z",
];
export const Trophy: React.FC<{ cx: number; cy: number; k: number; enter?: number; box?: number }> = ({ cx, cy, k, enter = 1, box = TROPHY_BOX }) => {
  const en = entranceOf(enter);
  if (en.opacity <= 0.002) return null;
  const sc = box / 20;
  return (
    <g opacity={en.opacity < 1 ? f3(en.opacity) : undefined} style={{ filter: en.blur > 0.05 ? `blur(${f3(en.blur / k)}px)` : undefined }}>
      <g
        transform={`translate(${fx(cx - 12 * sc)} ${fx(cy - 12 * sc + en.lift / k)}) scale(${fx(sc)})`}
        fill="none"
        stroke={COLOR.inkCream}
        strokeWidth={f3(GLYPH_STROKE / sc)}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {TROPHY_D.map((p, i) => (
          <path key={i} d={p} />
        ))}
      </g>
    </g>
  );
};
/**
 * TOP 6 — a numeral lockup centred on (x, cy): "TOP" (Söhne Kräftig caps, tracked +0.06 em, 64 px, about as
 * wide as the 6 or a little wider: it must read at 270 px wide) over a "6" (Söhne Dreiviertelfett,
 * SECONDARY), both cream, 16 px apart, counter-scaled (screen px). Its box (~161 px) is about the trophy's
 * (~145 px at the pair framings), centred on the same line, so the two share their clearances.
 * (A one-line "TOP 6" at SECONDARY is ~410 px wide and would cross the frame's left edge over Williams.)
 * `px` (deprecated, ignored) is kept for compatibility.
 */
export const TOP6_LOCKUP = { label: 64, numeral: TYPE.SECONDARY, gap: 16 } as const;
export const top6Height = () => TOP6_LOCKUP.label * METRIC.cap + TOP6_LOCKUP.gap + TOP6_LOCKUP.numeral * METRIC.fig; // screen px
/** The lockup's widest line ("TOP"), screen px. */
export const top6Width = () => Math.max(labelWidth("TOP", TOP6_LOCKUP.label), numeralWidth("6", TOP6_LOCKUP.numeral));
export const Top6: React.FC<{ x: number; cy: number; k: number; enter?: number; px?: number }> = ({ x, cy, k, enter = 1 }) => {
  const top = cy - top6Height() / 2 / k;
  const labelY = top + (TOP6_LOCKUP.label * METRIC.cap) / k;
  const numY = labelY + (TOP6_LOCKUP.gap + TOP6_LOCKUP.numeral * METRIC.fig) / k;
  return (
    <g>
      <Label x={x} y={labelY} k={k} text="top" px={TOP6_LOCKUP.label} tone="cream" enter={enter} />
      <Numeral x={x} y={numY} k={k} px={TOP6_LOCKUP.numeral} text="6" tone="cream" enter={enter} />
    </g>
  );
};

// ===========================================================================
// THE F1 MARK — public/cheekypint2/mercjob/f1.svg (the F1 logo, Wikimedia Commons, public domain),
// inlined verbatim as data minus its ™; ONE colour: cream (no red). Path units, box 0..120 x 0..30.
// ===========================================================================
const F1_D =
  "M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.065 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z";
export const F1_BOX = { w: 120, h: 30 } as const;
/** F1Mark: the F1 logo in cream, its box `width` world px wide, bottom-centred on (cx, bottom); the
 *  house entrance (slide up 24 SCREEN px + fade + blur) on `enter` 0..1. */
export const F1Mark: React.FC<{ cx: number; bottom: number; width: number; k: number; enter?: number }> = ({ cx, bottom, width, k, enter = 1 }) => {
  const en = entranceOf(enter);
  if (en.opacity <= 0.002) return null;
  const sc = width / F1_BOX.w;
  const h = F1_BOX.h * sc;
  return (
    <g opacity={en.opacity < 1 ? f3(en.opacity) : undefined} style={{ filter: en.blur > 0.05 ? `blur(${f3(en.blur / k)}px)` : undefined }}>
      <path d={F1_D} transform={`translate(${fx(cx - width / 2)} ${fx(bottom - h + en.lift / k)}) scale(${fx(sc)})`} fill={COLOR.inkCream} />
    </g>
  );
};

// ===========================================================================
// THE WORLD STATE and THE WORLD
// ===========================================================================
export type WorldState = {
  /** 0 = cream (lit), 1 = board (closed / context) */
  mercDim: number;
  willDim: number;
  /** bar heights above the tile tops (world px) */
  mercBar: number;
  willBar: number;
  /** the hubs' centres (x; MX = hidden behind the Mercedes tile) and tones */
  hubX: [number, number];
  hubDim: [number, number];
  /** 0..1 shadow lift while the hubs slide */
  hubLift: number;
  toto: { x: number; feetY: number; lift: number };
  /** entrances 0..1 */
  trophy: number;
  top6: number;
  /** the level rule's draw progress 0..1 (Mercedes' bar top -> Williams') */
  level: number;
  /** the one LightSweep of a cut: progress t over a bar ("merc" / "will") or a tile */
  sweep: { t: number; on: "mercBar" | "willBar" | "mercTile" } | null;
  /** the industry (the GRID formation's 9 others): shown, and its tone (board by default). `reveal`, one per
   *  GRID_OTHERS entry (= ROW_X):
   *  0 = DARK (barely there, no glyph) .. 1 = its tone `dim`; absent = all revealed (the old behaviour). */
  row: { dim: number; reveal?: number[]; appear?: number[] } | null;
  /** (9:16, additive) per GRID_OTHERS entry: 0 = not drawn at all .. 1 = drawn (an opacity: the tile comes up
   *  out of the ground before / while `reveal` tones it DARK -> board); absent = all drawn. */
  /** the F1 mark's entrance 0..1 (Act B), and its box width (world px) */
  f1: number;
  f1Width?: number;
};
/** Act B's opening rest (cut 4 f0): both tiles cream at rest, no bars, no trophy, no TOP 6, Toto at home. */
export const REST_STATE_B: WorldState = {
  mercDim: 0,
  willDim: 0,
  mercBar: 0,
  willBar: 0,
  hubX: [MX, MX],
  hubDim: [1, 1],
  hubLift: 0,
  toto: { x: TOTO_HOME.x, feetY: TOTO_HOME.feetY, lift: 0 },
  trophy: 0,
  top6: 0,
  level: 0,
  sweep: null,
  row: { dim: 1, reveal: GRID_OTHERS.map(() => 0), appear: GRID_OTHERS.map(() => 0) }, // the formation's 9 others: not drawn until revealed (cut 5)
  f1: 0,
};
/** A hub's share out from behind the Mercedes tile (0 hidden .. 1 its full width clear). */
const hubOut = (x: number) => clamp01((x + HUB / 2 - (MX + TILE / 2)) / HUB);

/**
 * MercJobWorld — the world at story time S under `cam` (draw order: the row, the hubs behind the
 * Mercedes tile, Williams, Mercedes, the level rule, the trophy, TOP 6, Toto, the sweep, the F1 mark).
 * `rest` is the act's opening camera (the ground's parallax origin).
 */
export const MercJobWorld: React.FC<{
  S: number;
  cam: Cam;
  rest: Cam;
  pool: PoolL;
  state: WorldState;
  sway?: boolean;
  /** anything extra a cut draws in WORLD px, on top of the world (under the vignette and grain) */
  children?: React.ReactNode;
}> = ({ S, cam, rest, pool, state: st, sway = true, children }) => {
  const k = cam.k;
  const band = amberBandForL(cam);
  const v = viewOf(cam);
  const inView = (x: number, half: number) => x + half > v.x0 - 40 / k && x - half < v.x1 + 40 / k;
  const sweepRect =
    st.sweep === null
      ? null
      : st.sweep.on === "mercBar"
        ? { x: MX - GEO.BAR / 2, y: TILE_TOP - st.mercBar, w: GEO.BAR, h: st.mercBar }
        : st.sweep.on === "willBar"
          ? { x: WX - GEO.BAR / 2, y: TILE_TOP - st.willBar, w: GEO.BAR, h: st.willBar }
          : { x: MX - TILE / 2, y: TILE_TOP, w: TILE, h: TILE };
  const hubs = ([1, 0] as const).map((i) => {
    const x = st.hubX[i];
    const out = hubOut(x);
    if (out <= 0.0005) return null;
    return (
      <MJPillar key={`h${i}`} x={x} k={k} tile={HUB} mark={i === 0 ? "engine" : "chassis"} dim={st.hubDim[i]} shadow={smoothstep(out)} lift={st.hubLift} />
    );
  });
  const levelX0 = MX - GEO.BAR / 2;
  const levelX1 = WX + GEO.BAR / 2;
  return (
    <MJStage S={S} cam={cam} rest={rest} pool={pool} sway={sway}>
      {st.row
        ? GRID_OTHERS.map((g, i) => {
            const ap = st.row && st.row.appear ? clamp01(st.row.appear[i] ?? 1) : 1;
            return inView(g.x, TILE) && ap > 0.0005 ? (
              <g key={`r${g.slot}`} opacity={ap < 1 ? f3(ap) : undefined}>
                <MJPillar x={g.x} floor={g.floor} k={k} mark="chassis" dim={st.row ? st.row.dim : 1} dark={st.row && st.row.reveal ? 1 - clamp01(st.row.reveal[i] ?? 1) : 0} />
              </g>
            ) : null;
          })
        : null}
      {hubs}
      <MJPillar x={WX} k={k} mark="williams" bar={st.willBar} dim={st.willDim} />
      <MJPillar x={MX} k={k} mark="mercedes" bar={st.mercBar} dim={st.mercDim} />
      {st.level > 0.001 ? (
        <line
          x1={f3(levelX0)}
          x2={f3(lerp(levelX0, levelX1, smoothstep(st.level)))}
          y1={f3(BAR_TOP)}
          y2={f3(BAR_TOP)}
          stroke={COLOR.inkCream}
          strokeOpacity={ALPHA.glassHi}
          strokeWidth={f3(STROKE.RULE / k)}
        />
      ) : null}
      <Trophy cx={MX} cy={TROPHY_CY} k={k} enter={st.trophy} />
      {st.top6 > 0 ? <Top6 x={WX} cy={TROPHY_CY} k={k} enter={st.top6} /> : null}
      <TotoBust x={st.toto.x} feetY={st.toto.feetY} k={k} lift={st.toto.lift} band={band} />
      {st.sweep && sweepRect && sweepRect.h > 0.5 ? (
        <LightSweep x={sweepRect.x} y={sweepRect.y} w={sweepRect.w} h={sweepRect.h} k={k} t={st.sweep.t} on="cream" />
      ) : null}
      {st.f1 > 0 ? <F1Mark cx={F1_ANCHOR.x} bottom={F1_ANCHOR.bottom} width={st.f1Width ?? 2 * TILE} k={k} enter={st.f1} /> : null}
      {children}
    </MJStage>
  );
};

// ===========================================================================
// ACT A — cuts 1-3 on ONE story clock S (cut 1: S = f; cut 2: S = 168 + f, opening on cut 1's last
// frame; cut 3: S = 168 + 69.12 + f, cut 2's clock at 69.12)
// ===========================================================================
export const DUR_A = { TheirNumbers: 169, SameBudgets: 85, TopSix: 66 } as const; // round(span x 24) + 16
export const S_A = {
  TheirNumbers: 0,
  SameBudgets: DUR_A.TheirNumbers - 1, // 168
  TopSix: DUR_A.TheirNumbers - 1 + 69.12, // 237.12
} as const;
export const S_A_END = S_A.TopSix + DUR_A.TopSix - 1; // 302.12
const C2 = S_A.SameBudgets;
const C3 = S_A.TopSix;
/** Act A's gestures on the clock (S). Comments: cut, frames, the word. */
export const ACT_A = {
  mercOpen: [16, 28], // c1 f16-28 "They gave me": board -> cream
  hubsOut: [45, 65], // c1 f45-65 "look at their setup": slide out, decelerating
  hubsLit: [57, 69], // c1: each glyph lights as its hub lands
  mercBar: [84, 112], // c1 f84-112 "their numbers" (f98 mid-rise): the bar rises out of the slot, a long gentle ease
  sweep1: [106, 118], // c1: THE CLICK on the bar's landing
  hubsDim: [124, 136], // c1 "And I came back": the books close (tone first)
  hubsIn: [126, 146], // c1: slide back behind the tile
  totoHome: [128, 150], // c1 f128-150: lift, glide to Williams, settle ("said" f145 in the settle)
  trophy: [C2 + 1, C2 + 15], // c2 f1-15 (the aspiration just heard)
  willBar: [C2 + 31, C2 + 54], // c2 f31-54 "because I'm working on ... the same budgets"
  level: [C2 + 44, C2 + 57], // c2 f44-57: the rule draws from Mercedes' bar top; the bar meets it
  sweep2: [C2 + 50, C2 + 62], // c2: THE CLICK on Williams' landing ("budgets" f54)
  top6: [C3 + 26, C3 + 38], // c3 f26-38 "top six": slide up + fade, landed by f38
} as const;
const winU = (S: number, w: readonly [number, number]) => (S - w[0]) / (w[1] - w[0]);
export const actAState = (S: number): WorldState => {
  // the hubs: out (rest to rest, p 2.5), lit as they land; dimmed then slid back behind the tile
  const outU = S < ACT_A.hubsIn[0] ? restToRest(winU(S, ACT_A.hubsOut), 2.5) : 1 - smoothstep(winU(S, ACT_A.hubsIn));
  const hubDim = S < ACT_A.hubsDim[0] ? 1 - smoothstep(winU(S, ACT_A.hubsLit)) : smoothstep(winU(S, ACT_A.hubsDim));
  const outV = Math.abs(outU - (S < ACT_A.hubsIn[0] ? restToRest(winU(S - 1, ACT_A.hubsOut), 2.5) : 1 - smoothstep(winU(S - 1, ACT_A.hubsIn))));
  // between the tiles (never over one): lift, glide, a long soft landing (p 3)
  const t = totoTravel(TOTO_VISITING, TOTO_HOME, S, ACT_A.totoHome[0], ACT_A.totoHome[1], 0, { p: 3 });
  const sweep1 = winU(S, ACT_A.sweep1);
  const sweep2 = winU(S, ACT_A.sweep2);
  return {
    mercDim: 1 - smoothstep(winU(S, ACT_A.mercOpen)),
    willDim: 0,
    mercBar: BAR_H * restToRest(winU(S, ACT_A.mercBar), 2.5),
    willBar: BAR_H * restToRest(winU(S, ACT_A.willBar), 3.25),
    hubX: [lerp(MX, HUB_OUT[0], outU), lerp(MX, HUB_OUT[1], outU)],
    hubDim: [hubDim, hubDim],
    hubLift: clamp01(outV * 8) * 0.6,
    toto: t,
    trophy: clamp01(winU(S, ACT_A.trophy)),
    top6: clamp01(winU(S, ACT_A.top6)),
    level: clamp01(winU(S, ACT_A.level)),
    sweep: sweep1 > 0 && sweep1 < 1 ? { t: sweep1, on: "mercBar" } : sweep2 > 0 && sweep2 < 1 ? { t: sweep2, on: "willBar" } : null,
    row: null, // Act A: the row is not drawn (pass 2: a DARK tile at the frame edge read as a glitch)
    f1: 0,
  };
};

// --- Act A's camera (look = the world point on screen (540, 835)); every phase a centred column ----------
const xMid = (a: number, b: number) => (a + b) / 2;
/** Toto + the Mercedes tile (cut 1's opening): tile ~340 px, creeping in to ~375. */
const LOOK_VISIT = { x: xMid(TOTO_VISITING.x - TOTO_H / 2, MX + TILE / 2), y: (TILE_TOP + FLOOR) / 2, k: 3.36 };
/** Toto + tile + both hubs out (tile ~255 px, hubs ~170). */
const LOOK_SETUP = { x: xMid(TOTO_VISITING.x - TOTO_H / 2, HUB_OUT[1] + HUB / 2), y: (TILE_TOP + FLOOR) / 2, k: 2.66 };
/** ... + the bar (the column from the bar's top to the floor). */
const LOOK_BAR = { x: LOOK_SETUP.x, y: (BAR_TOP + FLOOR) / 2, k: 2.62 };
/** The pair with Mercedes' bar (cut 1's end): Williams' left edge to Mercedes' right edge (tiles ~222 px). */
const LOOK_HOME = { x: xMid(WX - TILE / 2, MX + TILE / 2), y: (BAR_TOP + FLOOR) / 2, k: 2.31 };
/** The pair framing with the trophy's headroom (cuts 2-3). */
export const PAIR_LOOK = { x: LOOK_HOME.x, y: 372, k: 2.3 } as const;
const OPEN_DX = 10;
export const ACT_A_GLIDES: Glide[] = [
  // cut 1 f-34 -> f44: framed on Toto + the closed tile, a visible creep-in (~+10 % by f40) already moving on
  // f0 ("They gave me the opportunity to look"), flowing into the drift right without a stop
  { f0: -34, f1: 44, dx: OPEN_DX, k: 3.84 },
  // cut 1 f24-70 / f34-64: drifts right and eases back as the hubs slide out, centring the setup ("look at their setup")
  { f0: 24, f1: 70, dx: LOOK_SETUP.x - LOOK_VISIT.x - OPEN_DX },
  { f0: 34, f1: 64, k: LOOK_SETUP.k },
  // cut 1 f74-114: up and back as the bar rises (f84-112), to take in tile, hubs and bar ("their numbers ... and everything")
  { f0: 74, f1: 114, dy: LOOK_BAR.y - LOOK_SETUP.y, k: LOOK_BAR.k },
  // cut 1 f104-144: follows Toto home, revealing Williams (leads him; lands ahead of his f150 landing)
  { f0: 104, f1: 144, dx: LOOK_HOME.x - LOOK_BAR.x, k: LOOK_HOME.k },
  // the tail: a slow creep on the pair
  { f0: 146, f1: 200, k: 2.34 },
  // cut 1 f142 -> cut 2 f10: up (leading) to take in the trophy as it rises ("one of us"); then the creep
  { f0: C2 - 26, f1: C2 + 10, dy: PAIR_LOOK.y - LOOK_HOME.y, k: PAIR_LOOK.k },
  { f0: C2 + 12, f1: C2 + 92, k: 2.34 },
  // cut 3 (S 237.12 + f): one slow push toward Williams, already moving on f0, f-4 -> f34; the tail creep
  // (9:16: the pair fills the width, so "toward Williams" is a few px; the push is mostly in)
  { f0: C3 - 4, f1: C3 + 34, dx: -3, dy: 3, k: 2.355 },
  { f0: C3 + 22, f1: C3 + 110, dy: 4, k: 2.37 },
];
const ACT_A_CAM = makeClockCam(LOOK_VISIT, ACT_A_GLIDES, Math.ceil(S_A_END) + 2);
export const actACam = ACT_A_CAM.at;
export const ACT_A_REST: Cam = ACT_A_CAM.rest;
export const ACT_A_CHECK = camCheckL(ACT_A_CAM.at, 0, Math.ceil(S_A_END));

// --- Act A's light pool ---------------------------------------------------------------------------
export const actAPool = makePoolTrack(
  { x: TOTO_VISITING.x, y: FLOOR - TOTO_H / 2 },
  [
    { S0: 2, S1: 34, x: MX, y: TILE_TOP + TILE / 2 }, // c1 "They gave me": onto the opening tile
    { S0: 48, S1: 70, x: (MX + HUB_OUT[1]) / 2, y: TILE_TOP + TILE / 2 }, // the setup
    { S0: 90, S1: 114, x: MX + 30, y: (BAR_TOP + TILE_TOP) / 2 }, // up with the bar
    { S0: 124, S1: 150, x: (TOTO_HOME.x + WX) / 2, y: FLOOR - 50 }, // follows Toto home
    { S0: C2 + 2, S1: C2 + 18, x: (WX + MX) / 2, y: (BAR_TOP + FLOOR) / 2, spread: 1.3 }, // c2 "one of us": both tiles
    { S0: C3 + 0, S1: C3 + 40, x: (WX + MX) / 2 - 40, y: (BAR_TOP + FLOOR) / 2 }, // c3: drifts toward Williams
  ],
  Math.ceil(S_A_END) + 2,
);

/** Act A's pool reads stronger (pass 2: its slide onto the opening tile must read as motion). */
export const ACT_A_POOL_STRENGTH = 1.8;
/** Act A's world at S (cuts 1-3 render this with their own S). */
export const ActAWorld: React.FC<{ S: number }> = ({ S }) => {
  const cam = actACam(S);
  const p = actAPool(S);
  return <MercJobWorld S={S} cam={cam} rest={ACT_A_REST} pool={{ x: p.x, y: p.y, spread: p.spread, strength: ACT_A_POOL_STRENGTH }} state={actAState(S)} />;
};

// ===========================================================================
// LOAD-TIME CHECKS (Act A): the camera caps; Williams and the row off-frame where they must be;
// the caption band; the bars equal.
// ===========================================================================
{
  // under the analysis probe (globalThis.__MJ_PROBE__ = []) the misses are collected, not thrown
  const probe = (globalThis as { __MJ_PROBE__?: string[] }).__MJ_PROBE__;
  const rule = (ok: boolean, m: string) => {
    if (ok) return;
    if (probe) probe.push(m);
    else fail(m);
  };
  rule(ACT_A_CHECK.maxA <= 2.5, `Act A camera |dv| ${ACT_A_CHECK.maxA.toFixed(2)} px/f^2 at S ${ACT_A_CHECK.atA}`);
  rule(ACT_A_CHECK.maxV <= 45, `Act A camera ${ACT_A_CHECK.maxV.toFixed(1)} px/f at S ${ACT_A_CHECK.atV}`);
  const margin = 16; // a tile's shadow reaches ~16 world px past its right edge
  for (let S = 0; S <= S_A_END; S++) {
    const c = actACam(S);
    const v = viewOf(c);
    const sw = 6 / c.k;
    // cut 1 until the follow: Williams is off-frame left
    // cut 1 until the follow (which leads Toto) has begun: Williams is off-frame left
    if (S <= 117) rule(WX + TILE / 2 + margin < v.x0 - sw, `Williams in frame at S ${S}`);
    // the floor (+ the contact shadow) above the caption line
    rule(toScreenL(c, MX, FLOOR + 4).y + 5 <= CAPTION_Y, `the floor at y ${toScreenL(c, MX, FLOOR + 4).y.toFixed(0)} on S ${S}`);
  }
  // Toto's path never meets a tile: he keeps >= TOTO_GAP - 0.5 from both on his way home
  for (let S = ACT_A.totoHome[0]; S <= ACT_A.totoHome[1]; S += 0.25) {
    const t = actAState(S).toto;
    rule(t.x - TOTO_H / 2 >= WX + TILE / 2 + TOTO_GAP - 0.5 && t.x + TOTO_H / 2 <= MX - TILE / 2 - TOTO_GAP + 0.5, `Toto meets a tile on S ${S}`);
  }
  // the trophy and TOP 6 (their glyph / cap tops, the entrance's lift included) stay >= 90 px under the frame's top
  for (let S = C2; S <= S_A_END; S++) {
    const c = actACam(S);
    const st = actAState(S);
    const top = toScreenL(c, MX, TROPHY_CY - TROPHY_BOX / 2 - GLYPH_STROKE / 2).y;
    if (st.trophy > 0) rule(top >= TOP_CLEAR, `the trophy's top at y ${top.toFixed(0)} on S ${S}`);
  }
  // nothing hovers at a frame edge: each object (the two tiles, the hubs, Toto) is partly in frame
  // (0 < visible share < 1) while crossing the edge slower than 6 px/f for at most 3 frames in a row
  // (an object a move carries across the edge is entering, not hovering)
  {
    const objs: [string, (S: number) => [number, number] | null][] = [
      ["Williams", () => [WX - TILE / 2, WX + TILE / 2]],
      ["Mercedes", () => [MX - TILE / 2, MX + TILE / 2]],
      ["hub 1", (S) => { const x = actAState(S).hubX[0]; return x - MX > 1 ? [x - HUB / 2, x + HUB / 2] : null; }],
      ["hub 2", (S) => { const x = actAState(S).hubX[1]; return x - MX > 1 ? [x - HUB / 2, x + HUB / 2] : null; }],
      ["Toto", (S) => { const t = actAState(S).toto; return [t.x - TOTO_H / 2, t.x + TOTO_H / 2]; }],
    ];
    for (const [name, box] of objs) {
      let run = 0;
      for (let S = 0; S <= S_A_END; S++) {
        const b = box(S);
        const c = actACam(S);
        if (!b) { run = 0; continue; }
        const a0 = toScreenL(c, b[0], 0).x;
        const a1 = toScreenL(c, b[1], 0).x;
        const share = Math.max(0, Math.min(FRAME_W, a1) - Math.max(0, a0)) / (a1 - a0);
        const bp = box(S - 1);
        const cp = actACam(S - 1);
        const speed = bp ? Math.abs((a0 + a1) / 2 - (toScreenL(cp, bp[0], 0).x + toScreenL(cp, bp[1], 0).x) / 2) : 99;
        run = share > 0.001 && share < 0.999 && speed < 6 ? run + 1 : 0;
        rule(run <= 3, `${name} hovers at the frame edge (${run} f) on S ${S}`);
      }
    }
  }
  // the setup framing (hubs out) keeps >= 60 px side margins: Toto's left edge, the far hub's right edge
  for (let S = 66; S <= 104; S++) {
    const c = actACam(S);
    const st = actAState(S);
    const l = toScreenL(c, st.toto.x - TOTO_H / 2, 0).x;
    const r = FRAME_W - toScreenL(c, st.hubX[1] + HUB / 2, 0).x;
    rule(Math.min(l, r) >= 60, `the setup's side margin ${Math.min(l, r).toFixed(0)} px on S ${S}`);
  }
  // the pair framings keep >= 64 px side margins (cut 1 from f150, cuts 2-3)
  for (let S = 150; S <= S_A_END; S++) {
    const c = actACam(S);
    const l = toScreenL(c, WX - TILE / 2, 0).x;
    const r = FRAME_W - toScreenL(c, MX + TILE / 2, 0).x;
    rule(Math.min(l, r) >= 60, `the pair's side margin ${Math.min(l, r).toFixed(0)} px on S ${S}`);
  }
  // the TOP 6 lockup stays >= 64 px inside the frame's sides whenever it shows (cuts 2-3)
  for (let S = C2; S <= S_A_END; S++) {
    if (actAState(S).top6 <= 0) continue;
    const c = actACam(S);
    const cx = toScreenL(c, WX, 0).x;
    rule(cx - top6Width() / 2 >= 64 && cx + top6Width() / 2 <= FRAME_W - 64, `TOP 6 within ${(cx - top6Width() / 2).toFixed(0)} px of the frame's side on S ${S}`);
  }
  rule(Math.abs(actAState(C2 + 70).willBar - actAState(C2 + 70).mercBar) < 1e-9, "the bars are not equal");
}
