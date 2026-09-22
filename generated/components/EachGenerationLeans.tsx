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
  INK_LO,
  LABEL_PX,
  Label,
  LINE_X,
  SLAB_H,
  SLAB_W,
  Tower,
  birthPose,
  childPose,
  settleDip,
  slabCentre,
  swayRot,
  toneBaton,
} from "./towerShared";
import type { Pose } from "./towerShared";

export { FPS };

// ---------------------------------------------------------------------------
// `Noam_Alignment_Degradation` v2, cut 3 of five — EACH GENERATION LEANS.
// In at 0:15.300 (file 15_EachGenerationLeans).
//
//   "And then each subsequent generation actually we see an increasing
//    degradation in alignment,"
//
// One accelerating chain of births on the towerShared world: gens 3 → 8, each
// a copy sliding up out of its parent (`birthPose`) with its own ERR, each
// starting while the last is still settling, the start-to-start interval
// shrinking 11 → 11 → 10 → 10 → 9 f — the cadence itself is "increasing". The
// error compounds by forward kinematics, so the tower curves off the white
// plumb line; the camera rises with the top and then pulls back so the whole
// lean reads against the line on "in alignment".
//
// Word onsets (frames from f0, 24 fps): and 0 · then 2 · each 5 ·
//   subsequent 11 · generation 19 · actually 33 · we see 40 · an 51 ·
//   increasing 54 · degradation 62 · in 72 · alignment 81 · ends 91.
//   DURATION = round(3.80 · 24) + 16 = 91 + 16 = 107.
//
// ---------------------------------------------------------------------------
// GESTURES — every one, with the word it serves. Nothing else moves.
//
//  1. f0      Opening picture = cut 2's end: humans + ground, gen 1 deep,
//             gen 2 ripe a hair off, plumb line, ALIGNED (INK_LO) left of gen 1.
//  2. f2-17   gen 3 born out of gen 2 — "each subsequent generation" (19).
//  3. f13-27  gen 4 — "generation" → "actually" (33).
//  4. f24-37  gen 5 — "we see" (40).
//  5. f34-46  gen 6 — "an increasing" (51-54).
//  6. f44-55  gen 7 — "degradation" (62).
//  7. f53-63  gen 8 — "degradation" → "in alignment" (72-81).
//     Each birth: tone baton (parent ripe → deep over 8 f from the landing),
//     settle dip (≤ 3 px) on the slab stack. Humans never move.
//  8. f66-106 no new birth: the pull-back lets the lean read against the line;
//             shared sway + the camera's decaying drift carry the tail.
//
// CAMERA — three glides + a decaying drift, summed (C1), damped by runCamera:
//   A (target f-10 → 32, warp 0.9)  k 1.63 → 1.45, rising with the growing top.
//   B (target f26 → 58, warp 0.9)   k → 1.35, rising with gens 5-8.
//   C (target f48 → 72, warp 0.85)  k → 1.20, the pull-back that frames humans,
//                                   8 slabs, plumb line and ALIGNED.
//   D (from f66)                    decaying drift, continuing C's pull-back.
//   cx follows the composition's area-weighted centroid (slabs + humans +
//   label), so the leaning tower+line pair stays on the frame's axis.
//
// MEASURED ($S/EachGenerationLeans/measure.ts, 2026-09-22):
//   gen  start land | own slab (bottom clear) → its child shows (≥2 px) | wedge L/R
//    3     2   17   |  f10 → f14 (4 f)                                 | 24.8/12
//    4    13   27   |  f21 → f25 (4 f)                                 | 26.3/12
//    5    24   37   |  f31 → f35 (4 f)                                 | 27.4/12
//    6    34   46   |  f41 → f45 (4 f)                                 | 28.3/12
//    7    44   55   |  f50 → f54 (4 f)                                 | 29.1/12
//    8    53   63   |  f59 (top)                                       | 29.9/12
//   top after gen 8: θ 19.49°, centre +124.2 px (= READY); live f66 19.54° / +124.4.
//   lowest ink 1350 px (f55; ≤1400) · min edge air 101 px (f52; the label at
//   f0 108) · min energy 13.9 px/f (f105) · camera max |Δv| 0.79 px/f² · max
//   fixed-point speed 12.0 px/f · max slab speed 15.7 px/f · never parked
//   (tail ≥ 0.58 px/f at the feet, k −0.09 %/f) · k 1.614 (f0) → 1.463 (f29)
//   → 1.329 (f57) → 1.198 (f76, C lands) → 1.158 (f106) · end framing ink bbox
//   y 390..1290 (centre 840), centroid on x 540.2 · ALIGNED ink 150 x 30
//   screen px (measured on the render).
//   Sway at gen 8 is 0.53 px of travel over the tail (shared SWAY_GAIN): not
//   perceptible — the camera's drift carries the tail.
// ---------------------------------------------------------------------------

export const IN_SECONDS = 15.3;
export const GRID_F0 = Math.round(IN_SECONDS * FPS); // 367
export const DURATION = 107;

// ---------------------------------------------------------------------------
// THE BIRTH SCHEDULE. Solved so each child is its own slab (bottom clear of
// its parent's top face) for ≥ 4 f before its own child shows above it, with
// the start-to-start interval shrinking. Index = generation.
// ---------------------------------------------------------------------------
export const TOP_GEN = 8;
export const BIRTH_START: Record<number, number> = { 3: 2, 4: 13, 5: 24, 6: 34, 7: 44, 8: 53 };
export const BIRTH_DUR: Record<number, number> = { 3: 15, 4: 14, 5: 13, 6: 12, 7: 11, 8: 10 };
export const BIRTH_LAND: Record<number, number> = Object.fromEntries(
  Object.keys(BIRTH_START).map((g) => [Number(g), BIRTH_START[Number(g)] + BIRTH_DUR[Number(g)]]),
);
// gen 2 landed in cut 2; long before this cut's f0.
const LAND_OF = (g: number) => (g <= 2 ? -1000 : BIRTH_LAND[g]);

/** The sway clock: the clip's global frame, so the hold motion is continuous. */
const swayClock = (frame: number) => GRID_F0 + frame;

export type SlabState = { pose: Pose; t: number; gen: number; u: number };

/** Every visible generation's pose (forward kinematics off the live parent) and
 *  tone at `frame`. Index 0 = gen 1. */
export const towerAt = (frame: number): SlabState[] => {
  const sf = swayClock(frame);
  const out: SlabState[] = [{ pose: GEN1_POSE, t: 0, gen: 1, u: 1 }];
  let lean = 0;
  let parent = GEN1_POSE;
  for (let g = 2; g <= TOP_GEN; g++) {
    lean += ERR[g].rot;
    const fin = childPose(parent, g, 1, swayRot(g, sf, lean));
    let pose = fin;
    let u = 1;
    if (g >= 3) {
      if (frame < BIRTH_START[g]) break;
      u = clamp01((frame - BIRTH_START[g]) / BIRTH_DUR[g]);
      pose = birthPose(parent, fin, u);
    }
    out.push({ pose, t: 1, gen: g, u });
    parent = pose;
  }
  // tone baton: a slab is ripe until its child lands, then deep over 8 f
  for (let i = 0; i < out.length; i++) {
    const child = out[i + 1];
    out[i].t = child ? toneBaton(frame - LAND_OF(child.gen)).parent : 1;
  }
  return out;
};

/** The settle dip on the slab stack (world px, down), summed over landings. */
export const dipAt = (frame: number) => {
  let d = 0;
  for (let g = 3; g <= TOP_GEN; g++) d += settleDip(frame - BIRTH_LAND[g]);
  return d;
};

// ---------------------------------------------------------------------------
// ALIGNED — said in cut 1, now context: right-aligned 28 world px left of
// gen 1's left end, vertically centred on it, INK_LO. Its width is measured
// on the render (Roboto Condensed Bold caps 0.04 em at 40 screen px).
// ---------------------------------------------------------------------------
export const ALIGNED_X = LINE_X - SLAB_W / 2 - 28; // right edge, world
export const ALIGNED_Y = slabCentre(GEN1_POSE).y;
export const ALIGNED_W_SCREEN = 150; // measured ink width at LABEL_PX (see measure.ts)
export const ALIGNED_H_SCREEN = 29; // cap height at LABEL_PX

// ---------------------------------------------------------------------------
// CAMERA.
// ---------------------------------------------------------------------------
const PRE = 12; // pre-roll, so the camera is already moving at f0
const POST = 12;

/** The composition's area-weighted centroid x: slabs, the three people, the
 *  ALIGNED label (at the zoom it is seen at). */
const HUMAN_AREA = 5200;
export const centroidX = (slabs: Pose[], k: number) => {
  let a = 0;
  let s = 0;
  for (const p of slabs) {
    const c = slabCentre(p);
    a += SLAB_W * SLAB_H;
    s += SLAB_W * SLAB_H * c.x;
  }
  a += 3 * HUMAN_AREA;
  s += 3 * HUMAN_AREA * LINE_X;
  const lw = ALIGNED_W_SCREEN / k;
  const la = lw * (ALIGNED_H_SCREEN / k);
  a += la;
  s += la * (ALIGNED_X - lw / 2);
  return s / a;
};

const landed = (n: number) => towerAt(200).slice(0, n).map((s) => s.pose);

type Glide = { f0: number; f1: number; dk: number; dc: number; dx: number; warp: number };

export const K0 = 1.63;
export const C0 = (slabCentre(landed(2)[0]).y + slabCentre(landed(2)[1]).y) / 2; // gens 1-2
const K_A = 1.45;
const K_B = 1.35;
const K_C = 1.2;
export const C_A = 1204;
export const C_B = 1106;
export const C_C = 1122;
const X0 = centroidX(landed(2), 1.6);
const X_A = centroidX(landed(5), K_A);
const X_B = centroidX(landed(8), K_B);
const X_C = centroidX(landed(8), K_C);

export const GLIDES: Glide[] = [
  { f0: -10, f1: 32, dk: K_A - K0, dc: C_A - C0, dx: X_A - X0, warp: 0.9 },
  { f0: 26, f1: 58, dk: K_B - K_A, dc: C_B - C_A, dx: X_B - X_A, warp: 0.9 },
  { f0: 48, f1: 72, dk: K_C - K_B, dc: C_C - C_B, dx: X_C - X_B, warp: 0.85 },
];
// D: the decaying drift, continuing C's pull-back. Velocity eases in over
// DRIFT_IN f (while C decelerates) and decays with DRIFT_TAU.
const DRIFT_F0 = 64;
const DRIFT_IN = 10;
const DRIFT_TAU = 70;
const DRIFT_DK = -0.0017; // k per frame at the drift's peak
const DRIFT_DC = 0.3; // world px per frame at the peak (continues C's c)

const driftGain = (f: number) => {
  // ∫ smoothstep((t - F0)/IN) · e^{-(t - F0)/TAU} dt, per-frame sum
  let s = 0;
  for (let t = DRIFT_F0; t <= f; t++) {
    s += smoothstep((t - DRIFT_F0) / DRIFT_IN) * Math.exp(-(t - DRIFT_F0) / DRIFT_TAU);
  }
  return s;
};

const targetAt = (f: number) => {
  let k = K0;
  let c = C0;
  let x = X0;
  for (const g of GLIDES) {
    const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp);
    k += g.dk * e;
    c += g.dc * e;
    x += g.dx * e;
  }
  const d = driftGain(f);
  k += DRIFT_DK * d;
  c += DRIFT_DC * d;
  return { k, c, x };
};

// One key per frame from -PRE; runCamera starts at index 0.
const N_CAM = PRE + DURATION + POST;
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_CY: number[] = [];
const CAM_CX: number[] = [];
for (let i = 0; i <= N_CAM; i++) {
  const t = targetAt(i - PRE);
  CAM_F.push(i);
  CAM_K.push(t.k);
  CAM_CY.push(t.c + CAM_LIFT / t.k);
  CAM_CX.push(t.x);
}
export const CAM_TABLE: { cx: number; cy: number; k: number }[] = [];
for (let f = 0; f < DURATION + POST; f++) {
  const a = runCamera(f + PRE, CAM_F, CAM_CY, CAM_K);
  const b = runCamera(f + PRE, CAM_F, CAM_CX, CAM_K);
  CAM_TABLE.push({ cx: b.cy, cy: a.cy, k: a.k });
}
export const CAM_AT = (f: number) => CAM_TABLE[Math.max(0, Math.min(CAM_TABLE.length - 1, Math.round(f)))];
const CAM_REST = CAM_AT(0);

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

const EachGenerationLeans: React.FC<Props> = ({
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
  const { tx, ty } = worldTransform(cx, cy, k);
  const slabs = towerAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={GRID_F0 + frame}
        cy={cy}
        cyRest={CAM_REST.cy}
        cx={cx}
        cxRest={CAM_REST.cx}
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
          <Tower k={k} slabs={slabs.map((s) => ({ pose: s.pose, t: s.t }))} dy={dipAt(frame)} />
          <Label
            k={k}
            frame={frame}
            text="ALIGNED"
            x={ALIGNED_X}
            y={ALIGNED_Y}
            inFrame={-100}
            size={LABEL_PX}
            opacity={INK_LO}
            anchor="right"
          />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default EachGenerationLeans;
