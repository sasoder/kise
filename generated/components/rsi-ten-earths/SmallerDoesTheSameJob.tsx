// ---------------------------------------------------------------------------
// SmallerDoesTheSameJob (rsi-ten-earths, cut 57). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 152 frames. World: the shared modules ./tenEarthsGenius (the Genius: walk, writeTick,
// stand, tickDrawn; GENIUS_READY.md) and ./tenEarthsHall (RackField, rackGrid, powerWave, YearPlate; HALL_READY.md),
// both read-only; the floor, air and rack look of the approved cut 6 (./computeBlockState FLOOR / AIR_SCENE / STAGE and
// ComputePerAIFalls' RackHalo / RackPools / BlockTopShade, read-only imports) so cut 5 and cut 6 read as one hall.
//
// CHECK LINE: "This year a small, cheap model does exactly the job that took last year's giant model."
//
// THE LINE: "AI industry figures out how to train smaller and cheaper models that can do what it took a bigger model
//   to do the year before. And"
// WORD -> FRAME (from the composition start; Whisper may run ~0.2-0.4 s early): AI 0 · industry 6 · figures 16 ·
//   out 25 · how 30 · to 34 · train 37 · smaller 46 · and 58 · cheaper 65 · models 69 · that 79 · can 86 · do 89 ·
//   what 94 · it 101 · took 103 · a 106 · bigger 108 · model 114 · to 121 · do 128 · the 132 · year 134 ·
//   before. 139 · (And 150)
// DURATION: the slot 57.5575 -> 63.8972 s = 6.340 s x 23.976 = 152 frames (f0..f151).
//
// THE MOTION: one camera. It opens close on the right: one dark rack powers up (a top-to-bottom light wave, f3-f13)
//   and a normal-size Genius walks out of it, through its side panel, at full size (five steps, f10-f58, the part
//   still inside the rack clipped at the side panel's plane), settles at a flip-chart easel with a problem sheet
//   (f58-f64), raises his pencil and draws a tick (writeTick f64-f106: the strokes f77-f94, "that can do what"), then
//   lowers it (f106-f120). From f62 the camera pulls back and pans left in one soft lobe (fastest ~f90-f102, settled
//   by f140) with a gentle tilt-up through its middle, and reveals what was already standing there: a giant Genius
//   (the same figure at 3x) beside a bank of 9 lit racks, its mitten resting at an identical problem sheet with an
//   identical tick. Nothing of it shows before f97 (the tick is done at f94); it comes in from the left as a whole
//   column, its head already inside the frame (f99), wholly in frame by f106 and inside the keep-in by f112 ("bigger").
//   Year plates slide up in clear floor in front of the feet: 2026 (f124) under the small one, 2025 (f127) under the
//   giant. Resolved by "the year before" (f134): giant + 9 racks on the left, the small one + 1 rack on the right;
//   living hold (the small one nods f128-f146, the giant breathes, the racks twinkle, a slow creep).
// CAUSE: the rack's power-up wave (f3-13) precedes the first step out (f10, visible from ~f16); the pencil tip is on
//   the stroke on every drawing frame (tickDrawn = the module's own stroke polyline).
// Orange = the AIs only (COMMON.md): the two Geniuses are the only orange things; racks slate, lights and type cream,
//   the sheets cream with graphite marks (the tick is the pencil's graphite, the same on both sheets).
//
// DEPTH: a physical camera whose lens and dolly change together along one progress p(f) (a 5 % creep plus one sin^2
//   lobe f62-f140): the figures' plane Z 45 goes from 1.75 to 0.561 screen px per unit (log-interpolated; the small
//   Genius ~570 -> ~182 px, the giant ~540 px), the eye cranes 650 -> 1000 units (cut 6's), the distance Dc 880 -> 1250
//   (cut 6's), the floor point at Z 45 from screen y 1060 to 985 plus a 30 px sin^2(pi p) tilt-up; the pan keeps the
//   small sheet's right edge moving linearly on screen. The small rack (X 253, Z 0) and the small Genius in front of
//   it (Z 45, walking out to X ~428); the giant (X -380, Z 60, scale 3) right of its bank (3 x 3 from X -770, rows at
//   Z 0 / 0.75 U / 1.5 U); both easels in the figures' plane, the giant's sheet scaled so both sheets end the same size
//   on screen; the plates at Z -75, clear of every leg, foot and rack base. Interior mood, fog by depth.
//
// SOURCES: the speaker; Epoch AI, algorithmic progress in language models (Ho et al. 2024: the compute needed for a
//   given performance halves ~every 8 months) and Epoch's inference price per capability trend. On screen only the
//   years 2025 / 2026; the 9 racks vs 1 is a picture of "a bigger model", not a measured ratio.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirFloor, AirHorizonHazeW, AirShadow, AirStage, WorldSvg, airWorldOf, mixHex, swayCam, type AirWorld, type Cam, type DepthOpts, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { covidRig } from "../kyle-covid/covidFolkBody";
import { Genius, GENIUS_POSES as G, GENIUS_WALK_CYCLE, lerpPose, tickDrawn, type GeniusPose } from "./tenEarthsGenius";
import { CREAM, MAT_KEYS, RACK, RackField, YearPlate, powerWave, rackGrid, yearPlateT, type RackSpec } from "./tenEarthsHall";
import { AIR_FOG_BY, AIR_SCENE, FLOOR, STAGE } from "./computeBlockState";
import { BlockTopShade, RackHalo, RackPools } from "./ComputePerAIFalls";

export const FPS = 24000 / 1001;
export const DURATION = 152;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const U = 178;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (v: number) => v.toFixed(2);
const frac = (v: number) => v - Math.floor(v);

// ---- the world ------------------------------------------------------------------------------------------------------
/** the figures' plane: the small Genius and his sheet stand at this depth (inside the small rack's depth 0..178) */
export const Z_FIG = 45;
/** this year's model: one rack (X centre, front face Z 0) */
export const SMALL_RACK: RackSpec = { X: 253.4, Z: 0, seed: 517, id: 100, row: 0, col: 0 };
const RACK_RIGHT = SMALL_RACK.X + RACK.w / 2;
/** last year's model: the giant (feet X, Z, scale x the Genius) and its bank of 9 racks to its left */
/** how far left of the small rack last year's model stands: far enough that the pull-back brings it in from the left
 *  as a whole column (head already inside the frame), not as a corner fragment */
const GIANT_DX = 200;
export const GIANT = { X: -180 - GIANT_DX, Z: 60, k: 3, fogZ: 700 };
export const BANK: RackSpec[] = rackGrid({ cols: 3, rows: 3, aisle: 1.0 * U, x: -570 - GIANT_DX, z: 0, seed0: 540, pitch: 0.75 * U });
/** the giant's easel: in the figures' plane by its right leg (its legs end at foot level, clear of the plate in front);
 *  its sheet is drawn the same screen size as the small one's, a shorter stand puts it at the giant's mitten */
export const GIANT_SHEET = { X: GIANT.X, Z: Z_FIG, lift: -8 };

/** the giant stands, breathing; its front hand a little out and down, resting by its sheet's top corner */
export const giantPose = (f: number): GeniusPose => {
  const q = G.stand(1, f + 37);
  return { ...q, armR: { ...q.armR, w: [q.armR.w[0] + 14, q.armR.w[1] + 7] } };
};

// ---- the camera -----------------------------------------------------------------------------------------------------
type CamSpec = { cx: number; s: number; Dc: number; eye: number; feetY: number };
export const CAM_S: CamSpec = { cx: 436, s: 1.75, Dc: 880, eye: 650, feetY: 1060 };
export const CAM_E: CamSpec = { cx: -157, s: 0.561, Dc: 1250, eye: 1000, feetY: 985 };
/** the progress p(f): a slow creep (v0) plus one soft lobe (sin^2) from LOBE.a to LOBE.b; p(DURATION - 1) = 1 */
export const LOBE = { a: 62, b: 140, creep: 0.05 };
const P_TABLE: number[] = (() => {
  const area = (LOBE.b - LOBE.a) / 2;
  const T = area / (1 - LOBE.creep);
  const v0 = (LOBE.creep * T) / (DURATION - 1);
  const v = (f: number) => v0 + (f > LOBE.a && f < LOBE.b ? Math.sin((Math.PI * (f - LOBE.a)) / (LOBE.b - LOBE.a)) ** 2 : 0);
  const out = [0];
  let acc = 0;
  for (let f = 1; f < DURATION + 2; f++) {
    const n = 20;
    for (let i = 0; i < n; i++) acc += v(f - 1 + (i + 0.5) / n) / n;
    out.push(acc);
  }
  const tot = out[DURATION - 1];
  return out.map((x) => x / tot);
})();
export const camP = (f: number) => {
  const i = Math.max(0, Math.min(P_TABLE.length - 2, Math.floor(f)));
  return lerp(P_TABLE[i], P_TABLE[i + 1], f - i);
};
/** the pan's screen anchor: the small sheet's right edge (world X in the figures' plane) */
const X_ANCHOR = 640;
/** the tilt-up's depth (screen px the floor drops at mid-move) */
const TILT = 30;
export type CutCam = { cam: Cam; depth: DepthOpts; s: number };
export const camState = (f: number): CutCam => {
  const p = camP(f);
  const s = Math.exp(lerp(Math.log(CAM_S.s), Math.log(CAM_E.s), p));
  const Dc = lerp(CAM_S.Dc, CAM_E.Dc, p);
  const eye = lerp(CAM_S.eye, CAM_E.eye, p);
  // the pan: the small sheet's right edge (X_ANCHOR in the figures' plane) moves at a steady screen pace from its
  // start x to its end x, so nothing bulges past the frame mid-move (cx follows from the zoom)
  const xs = 540 + (X_ANCHOR - CAM_S.cx) * CAM_S.s;
  const xe = 540 + (X_ANCHOR - CAM_E.cx) * CAM_E.s;
  const cx = X_ANCHOR - (lerp(xs, xe, p) - 540) / s;
  // a gentle tilt-up through the middle of the move (the floor dips TILT px at p 0.5): the giant's head enters the frame
  // lower, clear of the top edge, as his column comes in from the left
  const feetY = lerp(CAM_S.feetY, CAM_E.feetY, p) + TILT * Math.sin(Math.PI * p) ** 2;
  const k = (s * (Dc + Z_FIG)) / Dc;
  const r = Dc / (Dc + Z_FIG);
  const wy = -eye + eye * r;
  const cy = wy - (feetY - 960) / k;
  return { cam: { k, cx, cy }, depth: { eyeY: -eye, dRef: Dc, kRef: k, dolly: 0 }, s };
};

// ---- the small Genius: out of the rack, to the easel, the tick, the nod ---------------------------------------------
const PENCIL_REST = { hand: "L" as const, ang: 80 };
/** the walk out of the rack: five steps from a standstill to a standstill (the walk's stride eased in and out) */
export const WALK = { f0: 10, n: 48, steps: 5 };
const walkCurve = (u: number) => {
  const w = c01(u);
  return { phase: 0.05 + (WALK.steps / 2) * w, amt: sst(0, 0.16, w) * (1 - sst(0.8, 1, w)) };
};
const walkPoseU = (u: number): GeniusPose => {
  const { phase, amt } = walkCurve(u);
  return { ...G.walk(1, phase * GENIUS_WALK_CYCLE, amt), pencil: PENCIL_REST };
};
/** the planted-foot shift along the walk (units, + = screen right), integrated from the rig's own stance ankle */
const SHIFT: number[] = (() => {
  const N = WALK.n * 6;
  const ank = (u: number): [number, number] => {
    const { r } = covidRig("officer", 3, walkPoseU(u));
    return [r.legL.A[0], r.legR.A[0]];
  };
  const out = [0];
  let s = 0;
  let prev = ank(0);
  for (let i = 0; i < N; i++) {
    const a = i / N;
    const b = (i + 1) / N;
    const cur = ank(b);
    const lA = frac(walkCurve(a).phase) < 0.5;
    const lB = frac(walkCurve(b).phase) < 0.5;
    if (lA === lB) s -= lA ? cur[0] - prev[0] : cur[1] - prev[1];
    prev = cur;
    out.push(s);
  }
  return out;
})();
const shiftAt = (u: number) => {
  const x = c01(u) * (SHIFT.length - 1);
  const i = Math.min(SHIFT.length - 2, Math.floor(x));
  return lerp(SHIFT[i], SHIFT[i + 1], x - i);
};
/** where he starts (inside the rack, wholly within its width) and where he stops */
export const SMALL_X0 = SMALL_RACK.X;
export const SMALL_X1 = SMALL_X0 + SHIFT[SHIFT.length - 1];
/** the settle into the writing stance, then writeTick (TICK.n frames), then the hold with one satisfied nod */
export const SETTLE = { f0: WALK.f0 + WALK.n, n: 6 };
export const TICK = { f0: SETTLE.f0 + SETTLE.n, n: 42 };
export const LOWER = { f0: TICK.f0 + TICK.n, n: 14 };
export const NOD = { f0: 128, n: 18 };
export const tickT = (f: number) => c01((f - TICK.f0) / TICK.n);
export const smallState = (f: number): { X: number; pose: GeniusPose } => {
  const wEnd = WALK.f0 + WALK.n;
  if (f <= wEnd) {
    const u = (f - WALK.f0) / WALK.n;
    return { X: SMALL_X0 + shiftAt(u), pose: walkPoseU(u) };
  }
  if (f < TICK.f0) {
    const t = sst(0, 1, (f - SETTLE.f0) / SETTLE.n);
    return { X: SMALL_X1, pose: { ...(lerpPose(walkPoseU(1), G.writeTick(1, 0, f), t) as GeniusPose), pencil: PENCIL_REST } };
  }
  // after the tick he lowers the pencil back to his side (to writeTick's own start pose), so the tick shows whole
  const lower = sst(0, 1, (f - LOWER.f0) / LOWER.n);
  const w = G.writeTick(1, tickT(f), f);
  const q = lower > 0 ? ({ ...(lerpPose(w, G.writeTick(1, 0, f), lower) as GeniusPose), pencil: { hand: "L", ang: lerp(w.pencil?.ang ?? PENCIL_REST.ang, PENCIL_REST.ang, lower) } } as GeniusPose) : w;
  const nod = Math.sin(Math.PI * c01((f - NOD.f0) / NOD.n)) ** 2;
  return { X: SMALL_X1, pose: { ...q, pitch: q.pitch + 8 * nod, mouth: (q.mouth ?? 0) + 0.08 * nod } };
};

// ---- the sheet on its easel (units from the figure's `at`, facing right; the tick at GENIUS_TICK) ----------------
export const SHEET = { x0: 52, x1: 212, y0: -345, y1: -160 };
const GRAPHITE = "#3A2D25";
const PAPER = "#EFE6D3";
/** the problem: lines of working (graphite), a small boxed figure, an answer line beside where the tick goes */
const MARKS: { d: string; w: number; op: number }[] = [
  { d: "M70,-326 L132,-326 M140,-326 L186,-326 M192,-326 L198,-326", w: 3.2, op: 0.62 },
  { d: "M70,-307 L110,-307 M118,-307 L176,-307", w: 3.2, op: 0.62 },
  { d: "M70,-288 L96,-288 M104,-288 L150,-288 M158,-288 L170,-288", w: 3.2, op: 0.62 },
  { d: "M150,-277 L194,-277 L194,-250 L150,-250 Z M150,-250 L194,-277", w: 2.6, op: 0.5 },
  { d: "M70,-266 L132,-266", w: 3.2, op: 0.62 },
  { d: "M124,-232 L150,-232 M156,-232 L178,-232", w: 3.4, op: 0.75 },
  { d: "M118,-218 L198,-218", w: 2.4, op: 0.55 },
];
const TICK_W = 6;
const Easel: React.FC<{ A: AirWorld; at: P2; sc: number; Z: number; tick: P2[]; uid: string; lift?: number }> = ({ A, at, sc, Z, tick, uid, lift = 0 }) => {
  // the sheet's origin (`at` raised by `lift` units: a taller stand), the legs stand on the floor at `at`
  const o: P2 = [at[0], at[1] - lift * sc];
  const P = (x: number, y: number) => `${f2(o[0] + x * sc)},${f2(o[1] + y * sc)}`;
  const F = (x: number) => `${f2(at[0] + x * sc)},${f2(at[1])}`;
  const { x0, x1, y0, y1 } = SHEET;
  const fz = A.fog(Z);
  const metal = A.tone(MAT_KEYS.mid, Z, 150);
  const metalDk = A.tone(MAT_KEYS.dark, Z, 150);
  const board = A.tone("#4A5356", Z, 250);
  const paper = A.tone(PAPER, Z, 250);
  const ink = mixHex(GRAPHITE, A.airHex(Z, 250), 0.5 * fz);
  const tickPts = tick.map((p) => P(p[0], p[1])).join("L");
  return (
    <g>
      {/* the back leg, then the two front legs (thin slate tubes), the board, the tray */}
      <path d={`M${P((x0 + x1) / 2, y0 + 30)}L${F((x0 + x1) / 2 + 26)}`} stroke={metalDk} strokeWidth={4.2 * sc} strokeLinecap="round" />
      <path d={`M${P(x0 + 14, y1 + 10)}L${F(x0 - 4)}M${P(x1 - 14, y1 + 10)}L${F(x1 + 4)}`} stroke={metal} strokeWidth={5 * sc} strokeLinecap="round" />
      <rect x={o[0] + (x0 - 7) * sc} y={o[1] + (y0 - 8) * sc} width={(x1 - x0 + 14) * sc} height={(y1 - y0 + 14) * sc} rx={3 * sc} fill={board} />
      <rect x={o[0] + (x0 - 10) * sc} y={o[1] + (y1 + 4) * sc} width={(x1 - x0 + 20) * sc} height={7 * sc} rx={2 * sc} fill={metal} />
      <path d={`M${P(x0 - 10, y1 + 4)}L${P(x1 + 10, y1 + 4)}`} stroke={CREAM} strokeOpacity={0.35 * (1 - fz)} strokeWidth={1.2 * sc} />
      {/* the sheet: cream paper, a faint top shade and the problem in graphite */}
      <rect x={o[0] + x0 * sc} y={o[1] + y0 * sc} width={(x1 - x0) * sc} height={(y1 - y0) * sc} fill={paper} />
      <rect x={o[0] + x0 * sc} y={o[1] + y0 * sc} width={(x1 - x0) * sc} height={(y1 - y0) * sc} fill={`url(#${uid}-shade)`} />
      <defs>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.1} />
          <stop offset="1" stopColor={GRAPHITE} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <rect x={o[0] + (x0 + 30) * sc} y={o[1] + (y0 - 11) * sc} width={(x1 - x0 - 60) * sc} height={9 * sc} rx={2 * sc} fill={metalDk} />
      <g transform={`translate(${f2(o[0])} ${f2(o[1])}) scale(${sc.toFixed(5)})`}>
        {MARKS.map((m, i) => (
          <path key={i} d={m.d} fill="none" stroke={ink} strokeOpacity={m.op} strokeWidth={m.w} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
      {tick.length >= 2 ? <path d={`M${tickPts}`} fill="none" stroke={ink} strokeWidth={TICK_W * sc} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </g>
  );
};

// ---- the rack glints and wash (cut 3 / cut 6's look), aware of a relight wave (lit = the TOP `power` while relit) --
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
const litAt = (rk: RackSpec) => {
  const pw = rk.power ?? 1;
  return (y: number) => (rk.relight ? y / RACK.h <= pw : y / RACK.h >= 1 - pw);
};
const Glints: React.FC<{ A: AirWorld; racks: RackSpec[]; frame: number }> = ({ A, racks, frame }) => {
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
    if ((rk.power ?? 1) <= 0) continue;
    const lit = litAt(rk);
    const tl = P.p(rk.X - RACK.w / 2, -RACK.h, Z);
    const loc = (x: number, y: number, ww: number, h: number) => rectD(tl[0] + x * r, tl[1] + y * r, ww * r, h * r);
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
const WASH = 0.16;
const Wash: React.FC<{ A: AirWorld; racks: RackSpec[] }> = ({ A, racks }) => {
  if (!racks.length) return null;
  const P = A.P;
  const Z = racks[0].Z;
  let d = "";
  for (const rk of racks) {
    const pw = rk.power ?? 1;
    if (pw <= 0.002) continue;
    const [ya, yb] = rk.relight ? [-RACK.h, -RACK.h * (1 - pw)] : [-RACK.h * pw, 0];
    const a = P.p(rk.X - RACK.w / 2, ya, Z);
    const b = P.p(rk.X + RACK.w / 2, yb, Z);
    d += rectD(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  }
  if (!d) return null;
  return <path d={d} fill={CREAM} fillOpacity={WASH * (1 - A.fog(Z))} />;
};

// ---- the plates ------------------------------------------------------------------------------------------------------
export const PLATES = [
  { text: "2026", X: SMALL_X1 - 28, Z: -75, Y: -16, size: 88, f0: 124 },
  { text: "2025", X: GIANT.X + 20, Z: -75, Y: -16, size: 88, f0: 127 },
];

/** the plates' slide-up (em) */
export const PLATE_SLIDE = 0.18;
export const SMALL_POWER_F0 = 3;
export const racksAt = (f: number): RackSpec[] => {
  const pw = powerWave(f, SMALL_POWER_F0, "on", 10);
  return [...BANK, { ...SMALL_RACK, power: pw.power, relight: pw.relight }];
};

const SmallerDoesTheSameJob: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const C = camState(frame);
  const cam = swayCam(C.cam, frame);
  const rest = swayCam(camState(0).cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame, scene: AIR_SCENE, fogBy: AIR_FOG_BY });
  const P = A.P;
  const racks = racksAt(frame);
  const rowMap = new Map<number, RackSpec[]>();
  for (const rk of racks) {
    const key = Math.round(rk.Z * 100);
    const a = rowMap.get(key);
    if (a) a.push(rk);
    else rowMap.set(key, [rk]);
  }
  const rows = [...rowMap.entries()].sort((a, b) => b[0] - a[0]);

  // the giant
  const gi = P.at(GIANT.X, GIANT.Z);
  const giScale = gi.scale * GIANT.k;
  // the giant's sheet: in its own plane, drawn at the small sheet's screen size at the end camera
  const endP = camState(DURATION - 1);
  const rEnd = (Zq: number) => endP.depth.dRef / (endP.depth.dRef + Zq);
  const gsS = P.at(GIANT_SHEET.X, GIANT_SHEET.Z);
  const gsScale = gsS.scale * (rEnd(Z_FIG) / rEnd(GIANT_SHEET.Z));

  // the small Genius
  const st = smallState(frame);
  const sm = P.at(st.X, Z_FIG);
  const easelAt = P.at(SMALL_X1, Z_FIG);
  const tick = tickDrawn(1, tickT(frame));
  // the rack's right side panel, in his plane: what of him is still inside the rack is behind it
  const clipX = P.p(RACK_RIGHT, 0, Z_FIG)[0];
  const inside = frame <= WALK.f0 + WALK.n;

  return (
    <AirStage v={A.v} bloom={STAGE.bloom} shafts={STAGE.shafts}>
      <WorldSvg cam={cam}>
        <defs>
          <clipPath id="sdj-out">
            <rect x={clipX} y={-20000} width={40000} height={40000} />
          </clipPath>
        </defs>
        <AirFloor A={A} x0={FLOOR.x0} x1={FLOOR.x1} z0={FLOOR.z0} z1={FLOOR.z1} mat={FLOOR.mat} course={FLOOR.tile} plank={FLOOR.tile} jointAmt={FLOOR.jointAmt} melt={FLOOR.melt} />
        <AirHorizonHazeW A={A} id="sdj-haze" />
        <RackPools A={A} racks={racks} uid="sdj" />
        {rows.map(([key, rr]) => (
          <React.Fragment key={key}>
            <RackHalo A={A} racks={rr} uid={`sdjh${key}`} />
            <RackField A={A} racks={rr} frame={frame} uid={`sdj${key}`} lod="hero" cull={false} />
            <Wash A={A} racks={rr} />
            <BlockTopShade A={A} racks={rr} />
            <Glints A={A} racks={rr} frame={frame} />
          </React.Fragment>
        ))}
        {/* last year's model: the giant, its easel in front of its right leg */}
        <AirShadow A={A} X={GIANT.X} Z={GIANT.Z} w={62 * GIANT.k} d={30 * GIANT.k} uid="sdj-gis" amt={0.75} />
        <Genius variant={0} pose={giantPose(frame)} at={gi.at} scale={giScale} uid="sdj-gi" frame={frame} fog={A.folkFog(GIANT.Z + GIANT.fogZ)} unitPx={cam.k} />
        <Easel A={A} at={gsS.at} sc={gsScale} Z={GIANT_SHEET.Z} tick={tickDrawn(1, 1)} uid="sdj-ges" lift={GIANT_SHEET.lift} />
        {/* this year's model */}
        <Easel A={A} at={easelAt.at} sc={easelAt.scale} Z={Z_FIG} tick={tick} uid="sdj-ses" />
        <g clipPath={inside ? "url(#sdj-out)" : undefined}>
          <AirShadow A={A} X={st.X} Z={Z_FIG} w={62} d={30} uid="sdj-ss" amt={0.8} />
          <Genius variant={0} pose={st.pose} at={sm.at} scale={sm.scale} uid="sdj-sm" frame={frame} fog={A.folkFog(Z_FIG)} unitPx={cam.k} />
        </g>
        {PLATES.map((pl, i) => {
          // the module's slide-up is 0.5 em; take it back to PLATE_SLIDE em so the entering glyphs stay above the band
          const t = yearPlateT(frame, pl.f0, 12);
          const back = (0.5 - PLATE_SLIDE) * pl.size * P.r(pl.Z) * (1 - (1 - Math.pow(1 - t, 3)));
          return (
            <g key={pl.text} transform={`translate(0 ${f2(-back)})`}>
              <YearPlate A={A} X={pl.X} Y={pl.Y} Z={pl.Z} text={pl.text} t={t} uid={`sdj-yp${i}`} size={pl.size} />
            </g>
          );
        })}
      </WorldSvg>
    </AirStage>
  );
};

export default SmallerDoesTheSameJob;
