import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  runCamera,
  smoothstep,
  worldTransform,
} from "./fieldShared";
import {
  BG_BLUR,
  BG_PARALLAX,
  BG_SRC,
  ERR,
  FPS,
  GEN1_POSE,
  INK_HI,
  INK_LO,
  LINE_X,
  Label,
  Measure,
  N_GEN,
  PITCH,
  type Pose,
  SLAB_H,
  SLAB_W,
  Tower,
  WorldSvg,
  birthEase,
  birthPose,
  childPose,
  settleDip,
  slabCentre,
  swayRot,
  toneBaton,
} from "./towerShared";

// ---------------------------------------------------------------------------
// CUT 4 of Noam_Alignment_Degradation v2 — `LeaningAwayFromUs` (in 0:25.940,
// file 25_LeaningAwayFromUs). Orange Dwarkesh, grid background, 24 fps.
//
//   "in the long run they end up going in a direction of increasing
//    misalignment from humans."
//
// The long run, compressed: the same birth that made every generation so far
// runs on eight more times, fast, the cadence tightening, and the compounding
// error takes the top of the tower off to the right, away from the white line.
// Then the distance is MEASURED (a white line from the plumb line to the top
// slab, at its height) and named, and the camera finishes wide on the whole
// argument: us at the base, ALIGNED beside gen 1, the line standing straight,
// the tower leaving it.
//
// GESTURES (nothing else) — word it serves:
//  1. f0 → f48  "in the long run they end up going in a direction": gens 9–16
//     are born out of their parents (shared birthPose, FK off the parent's
//     live pose), back to back, landing f9 16 22 28 33 38 43 48 (intervals
//     7 6 6 5 5 5 5 — tightening). Each start is SOLVED so the previous child
//     has been fully clear of its own parent for 3 f before it starts to rise
//     out of it; that makes the births 10 → 4 f long (not ~10 f each: at a
//     5-f cadence a 10-f birth cannot give 3 clear frames). Gen 9 is already
//     emerging at f0. The ripe tone rides up the stack (toneBaton); the settle
//     dip (≤ 3 px, deepest of the landings) pulses with each landing. By
//     "direction" (37) gen 14 is landing, top at θ 39.6° → 42°: the top is
//     heading off diagonally.
//  2. f50 → f63 "of increasing misalignment" (66): the MEASURE draws out of
//     the plumb line at the top slab's centre height to its centre (y and x2
//     from the live pose, so it rides the sway and the dip); MISALIGNMENT
//     (INK_HI) slides up right-aligned 28 world px left of the plumb line on
//     the measure's y (the set's label rule, as cut 5 has it), in f52, fully
//     in f62.
//  3. ~f82 "from humans" (86): the pull-back lands wide — humans, ALIGNED
//     (INK_LO), plumb line, bent tower, measure + MISALIGNMENT. Tail: the sway
//     (largest in the clip) and the camera's decaying drift.
//
// CAMERA (three warped-smoothstep glides summed so they overlap C1, + one
// decaying drift, damped by runCamera, pre-rolled 12 f): reads as ONE long
// pull-back that decelerates into the drift.
//   f0   ON cut 3's end: k 1.1581, cx 577.77, cy 1237.34 (EachGenerationLeans
//        CAM_AT(106), 2026-09-22; the pre-roll's rest framing is solved so the
//        damped camera is exactly there — re-sync K/X/CY_START if cut 3 moves).
//   A  f-6 → f36  k → 0.99, rising and sliding right with the shooting top.
//   B  f30 → f60  k → 0.90, the top slab + line + measure space.
//   C  f52 → f76  k → 0.8475 (2 % tighter than the end); damped, it lands
//                 ~f82 (1.0 px/f), 4 f before "humans".
//   D  f62 →      decaying drift (τ 90) sized by a solve so the damped camera
//                 ENDS on cut 5's opening: k 0.8307, cx 681.7, cy 1003.5.
//
// MEASURED (measure.ts, last run):
//   births start/dur: 9 -1.00/10.00 · 10 7.13/8.87 · 11 14.68/7.32 ·
//     12 21.44/6.56 · 13 27.81/5.19 · 14 33.47/4.53 · 15 38.80/4.20 ·
//     16 43.95/4.05; own-slab frames before the next child shows ≥ 3.15
//   f48 top θ 50.12°, top centre +528.9 px (READY gen 16: 50.64°, +531.8 —
//     the difference is the sway on the clip clock)
//   measure length 532.3 world px at f63, 530.4 at f108
//   MISALIGNMENT clearance ≥ 21.2 screen px (plumb line / measure tick),
//     188 from any slab
//   camera: f0 = cut 3's end, f108 = cut 5's opening (both exact); max |v|
//     13.7 px/f, max |Δv| 1.10 px/f²; tail travel ≥ 0.54 px/f (never parked)
//   lowest ink 1385.1 (f45) ≤ 1400; min edge air 51.4 px (f48, gen 16);
//     max slab screen speed 25.1 px/f (f34); min energy 0.67 px/f (f107)
//   feet screen y: f0 1261, f36 1377, f62 1378, f80 1372, f108 1370;
//     content centre f108 (541.6, 834.9)
// ---------------------------------------------------------------------------

export const IN_SECONDS = 25.94;
export const GRID_F0 = Math.round(IN_SECONDS * FPS); // 623
export const DURATION = 109; // round(3.86 * 24) = 93 speech + 16 tail

/** The sway runs on the clip's global clock so cuts 3 → 4 → 5 share a phase. */
const swayClock = (frame: number) => GRID_F0 + frame;

// ---------------------------------------------------------------------------
// BIRTHS. Landing frames from the brief; the start of each birth solved so the
// previous child has been fully clear of ITS parent (bottom face above the
// parent's top face, i.e. birthEase(u) · PITCH ≥ SLAB_H) for CLEAR_HOLD frames
// before this one starts to rise out of it. Gen 9 is already under way at f0.
// ---------------------------------------------------------------------------
export const FIRST_GEN = 9;
export const LAND: Record<number, number> = { 9: 9, 10: 16, 11: 22, 12: 28, 13: 33, 14: 38, 15: 43, 16: 48 };
const G9_START = -1;
export const CLEAR_HOLD = 3;

/** u at which a child's bottom face clears its parent's top face. */
export const U_CLEAR = (() => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (birthEase(m) * PITCH >= SLAB_H) hi = m;
    else lo = m;
  }
  return hi;
})();

export const BIRTHS: Record<number, { start: number; dur: number; land: number; clear: number }> = {};
{
  let start = G9_START;
  for (let g = FIRST_GEN; g <= N_GEN; g++) {
    const land = LAND[g];
    const dur = land - start;
    const clear = start + U_CLEAR * dur;
    BIRTHS[g] = { start, dur, land, clear };
    start = clear + CLEAR_HOLD;
  }
}

export type SlabState = { pose: Pose; t: number };

/** The tower at `frame`: every visible generation's pose (forward kinematics
 *  off its parent's live pose, sway on the global clock, births via the shared
 *  birthPose) and its tone. */
export const towerAt = (frame: number): SlabState[] => {
  const sf = swayClock(frame);
  const out: SlabState[] = [];
  let p = GEN1_POSE;
  let lean = 0;
  out.push({ pose: p, t: 0 });
  for (let i = 2; i <= N_GEN; i++) {
    lean += ERR[i].rot;
    const fin = childPose(p, i, 1, swayRot(i, sf, lean));
    let pose = fin;
    const b = BIRTHS[i];
    if (b) {
      const u = (frame - b.start) / b.dur;
      if (u <= 0) break;
      if (u < 1) pose = birthPose(p, fin, u);
    }
    // tone: ripe while it is the newest (being born or the top), deep once its
    // own child has landed (the baton); gens below 8 are at rest.
    const nb = BIRTHS[i + 1];
    const t = i < FIRST_GEN - 1 ? 0 : nb ? toneBaton(frame - nb.land).parent : 1;
    out.push({ pose, t });
    p = pose;
  }
  return out;
};

/** The settle dip for the whole stack: the deepest of the landings' dips. */
export const dipAt = (frame: number) => {
  let d = 0;
  for (let g = FIRST_GEN; g <= N_GEN; g++) d = Math.max(d, settleDip(frame - BIRTHS[g].land));
  return d;
};

// ---------------------------------------------------------------------------
// LABELS. The set's one rule (as cut 5 has it): a label is right-aligned
// LABEL_DX world px LEFT of the thing it names, vertically centred on it.
//   ALIGNED (INK_LO) names gen 1 — said in cut 1, context now.
//   MISALIGNMENT (INK_HI) names the measure: left of the plumb line, on the
//     measure's y, riding it (top slab's live centre y). Centred ABOVE the
//     measure it has no room: the bent top's slab ends (gens 14-16) step up
//     over the measure's line, into the pocket above it.
// Widths are ink, screen px at LABEL_PX (measured off full-res renders; same
// numbers as StandsTrue).
// ---------------------------------------------------------------------------
export const LABEL_DX = 28;
export const ALIGNED_X = LINE_X - SLAB_W / 2 - LABEL_DX;
export const ALIGNED_Y = slabCentre(GEN1_POSE).y;
export const ALIGNED_W_SCREEN = 152;
export const LABEL_CAP_SCREEN = 29; // cap height at LABEL_PX
export const MIS_X = LINE_X - LABEL_DX;
export const MIS_W_SCREEN = 275;
export const MIS_IN = 52; // fully in f62, 4 f before "misalignment" (66)

// ---------------------------------------------------------------------------
// MEASURE.
// ---------------------------------------------------------------------------
export const MEASURE_F0 = 50;
export const MEASURE_F1 = 63;
export const measureDraw = (frame: number) => {
  const x = clamp01((frame - MEASURE_F0) / (MEASURE_F1 - MEASURE_F0));
  return 1 - (1 - x) * (1 - x);
};
/** The measure's live y and x2: the top slab's centre, dip included. */
export const measureAt = (frame: number) => {
  const slabs = towerAt(frame);
  const c = slabCentre(slabs[slabs.length - 1].pose);
  const dy = dipAt(frame);
  return { y: c.y + dy, x2: c.x };
};

// ---------------------------------------------------------------------------
// CAMERA.
// ---------------------------------------------------------------------------
const PRE = 12; // pre-roll, so the camera is already moving at f0
const POST = 12;

// Opening = cut 3's end (EachGenerationLeans CAM_AT(106), 2026-09-22): the
// damped camera must be exactly here on f0. The pre-roll's rest framing
// (OPEN) is solved below so that it is.
export const K_START = 1.1581;
export const X_START = 577.77;
export const CY_START = 1237.34;
// Ending = cut 5's opening (StandsTrue camAt(0)), fixed by the director: the
// damped camera must be exactly here on the last frame.
export const K_END = 0.8307;
export const X_END = 681.7;
export const CY_END = 1003.5;

type Glide = { f0: number; f1: number; k: number; c: number; x: number; warp: number };
export const GLIDES: Glide[] = [
  { f0: -6, f1: 36, k: 0.99, c: 947, x: 668, warp: 0.9 },
  { f0: 30, f1: 60, k: 0.9, c: 894, x: 673, warp: 0.9 },
  // C lands ~2 % tighter than the end framing, a touch higher and left of it,
  // so the drift has somewhere to go (continuing C's direction on every axis).
  { f0: 52, f1: 76, k: 0.8475, c: 863, x: 676, warp: 0.9 },
];
// D: the decaying drift from C's landing into cut 5's opening framing. Its
// velocity eases in over DRIFT_IN (while C decelerates) and decays with
// DRIFT_TAU; its size (DRIFT) is solved below so the DAMPED camera is at
// (K_END, X_END, CY_END) on the last frame.
const DRIFT_F0 = 62;
const DRIFT_IN = 14;
const DRIFT_TAU = 90;
const LAST = DURATION - 1;

const driftRaw = (f: number) => {
  let s = 0;
  for (let t = DRIFT_F0; t <= f; t++) {
    s += smoothstep((t - DRIFT_F0) / DRIFT_IN) * Math.exp(-(t - DRIFT_F0) / DRIFT_TAU);
  }
  return s;
};
const DRIFT_NORM = driftRaw(LAST);
/** 0 before the drift, 1 on the last frame, still rising (never parked). */
export const driftGain = (f: number) => driftRaw(f) / DRIFT_NORM;

type Drift = { k: number; c: number; x: number };
const targetWith = (f: number, d: Drift, o: Drift = OPEN) => {
  let k = o.k;
  let c = o.c;
  let x = o.x;
  let pk = o.k;
  let pc = o.c;
  let px = o.x;
  for (const g of GLIDES) {
    const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp);
    k += (g.k - pk) * e;
    c += (g.c - pc) * e;
    x += (g.x - px) * e;
    pk = g.k;
    pc = g.c;
    px = g.x;
  }
  const u = driftGain(f);
  return { k: k + d.k * u, c: c + d.c * u, x: x + d.x * u };
};

const N_CAM = PRE + DURATION + POST;
const CAM_F: number[] = [...Array(N_CAM + 1).keys()];
const tracks = (d: Drift, o: Drift = OPEN) => {
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  for (const i of CAM_F) {
    const t = targetWith(i - PRE, d, o);
    K.push(t.k);
    CY.push(t.c + CAM_LIFT / t.k);
    CX.push(t.x);
  }
  return { K, CY, CX };
};
const camWith = (d: Drift, f: number, o: Drift = OPEN) => {
  const t = tracks(d, o);
  const a = runCamera(f + PRE, CAM_F, t.CY, t.K);
  const b = runCamera(f + PRE, CAM_F, t.CX, t.K);
  return { k: a.k, cy: a.cy, cx: b.cy };
};

// Solve the opening the same way: the rest framing the pre-roll starts from, so
// the damped camera is on cut 3's end at f0 (the glides after it are absolute,
// so this does not touch the end).
function solveOpen(): Drift {
  const o: Drift = { k: K_START, c: CY_START - CAM_LIFT / K_START, x: X_START };
  const zero: Drift = { k: 0, c: 0, x: 0 };
  for (let it = 0; it < 6; it++) {
    const e0 = camWith(zero, 0, o);
    const gk = (camWith(zero, 0, { ...o, k: o.k + 0.01 }).k - e0.k) / 0.01;
    const gc = camWith(zero, 0, { ...o, c: o.c + 1 }).cy - e0.cy;
    const gx = camWith(zero, 0, { ...o, x: o.x + 1 }).cx - e0.cx;
    o.k += (K_START - e0.k) / gk;
    const e1 = camWith(zero, 0, o);
    o.c += (CY_START - e1.cy) / gc;
    o.x += (X_START - e0.cx) / gx;
  }
  return o;
}
export const OPEN: Drift = solveOpen();

// Solve the drift: the damper is linear, so the last frame's k and cx respond
// to the drift's size with a fixed gain; cy follows from c and k. A few Newton
// steps with a numeric gain land it to well under the tolerances.
export const DRIFT: Drift = (() => {
  const last = GLIDES[GLIDES.length - 1];
  const d: Drift = { k: K_END - last.k, c: CY_END - CAM_LIFT / K_END - last.c, x: X_END - last.x };
  for (let it = 0; it < 6; it++) {
    const e0 = camWith(d, LAST);
    const gk = (camWith({ ...d, k: d.k + 0.01 }, LAST).k - e0.k) / 0.01;
    const gc = (camWith({ ...d, c: d.c + 1 }, LAST).cy - e0.cy) / 1;
    const gx = (camWith({ ...d, x: d.x + 1 }, LAST).cx - e0.cx) / 1;
    d.k += (K_END - e0.k) / gk;
    const e1 = camWith(d, LAST);
    d.c += (CY_END - e1.cy) / gc;
    d.x += (X_END - e0.cx) / gx;
  }
  return d;
})();

export const camTarget = (f: number) => targetWith(f, DRIFT);

const FINAL_TRACKS = tracks(DRIFT);
export const CAM_TABLE: { cx: number; cy: number; k: number }[] = [];
for (let f = 0; f < DURATION + POST; f++) {
  const a = runCamera(f + PRE, CAM_F, FINAL_TRACKS.CY, FINAL_TRACKS.K);
  const b = runCamera(f + PRE, CAM_F, FINAL_TRACKS.CX, FINAL_TRACKS.K);
  CAM_TABLE.push({ cx: b.cy, cy: a.cy, k: a.k });
}
{
  const b = CAM_TABLE[0];
  if (Math.abs(b.k - K_START) > 0.002 || Math.abs(b.cx - X_START) > 1 || Math.abs(b.cy - CY_START) > 1) {
    throw new Error(`LeaningAwayFromUs: camera opens at k ${b.k} cx ${b.cx} cy ${b.cy}, not cut 3's end`);
  }
  const e = CAM_TABLE[LAST];
  if (Math.abs(e.k - K_END) > 0.002 || Math.abs(e.cx - X_END) > 1 || Math.abs(e.cy - CY_END) > 1) {
    throw new Error(`LeaningAwayFromUs: camera ends at k ${e.k} cx ${e.cx} cy ${e.cy}, not cut 5's opening`);
  }
}
export const CAM_AT = (f: number) =>
  CAM_TABLE[Math.max(0, Math.min(CAM_TABLE.length - 1, Math.round(f)))];

// ---------------------------------------------------------------------------
export const schema = z.object({
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  backgroundBase: BG_BASE,
  backgroundSrc: BG_SRC,
  backgroundBlur: BG_BLUR,
  backgroundDim: BG_DIM,
  parallax: BG_PARALLAX,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
});

const LeaningAwayFromUs: React.FC<Props> = ({
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
}) => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAM_AT(frame);
  const rest = CAM_AT(0);
  const { tx, ty } = worldTransform(cx, cy, k);

  const slabs = towerAt(frame);
  const dy = dipAt(frame);
  const m = measureAt(frame);
  const draw = measureDraw(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={GRID_F0 + frame}
        cy={cy}
        cyRest={rest.cy}
        cx={cx}
        cxRest={rest.cx}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <Tower k={k} slabs={slabs} dy={dy} />

          <WorldSvg>
            <Measure k={k} y={m.y} x2={m.x2} draw={draw} opacity={INK_HI} />
          </WorldSvg>

          <Label
            k={k}
            frame={frame}
            text="ALIGNED"
            x={ALIGNED_X}
            y={ALIGNED_Y}
            inFrame={-100}
            opacity={INK_LO}
            anchor="right"
          />
          <Label
            k={k}
            frame={frame}
            text="MISALIGNMENT"
            x={MIS_X}
            y={m.y}
            inFrame={MIS_IN}
            opacity={INK_HI}
            anchor="right"
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default LeaningAwayFromUs;
