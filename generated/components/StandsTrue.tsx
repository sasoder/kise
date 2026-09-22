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
  FPS,
  GEN1_POSE,
  INK_HI,
  INK_LO,
  LABEL_PX,
  LINE_X,
  Label,
  Measure,
  N_GEN,
  SLAB_W,
  Tower,
  WorldSvg,
  slabCentre,
  towerPoses,
  type Pose,
} from "./towerShared";

// ---------------------------------------------------------------------------
// STANDS TRUE — Noam_Alignment_Degradation v2, cut 5 of 5 (in 0:32.979,
// file 32_StandsTrue). Orange Dwarkesh style, grid background, opaque.
//
//   "every generation of models we're able to make more and more aligned."
//   (the talking head before it: "there is a possibility that we go in the
//    other direction, that actually …")
//
// Opens on cut 4's last picture: the bent 16-slab tower leaning away from the
// plumb line, gen 16 ripe, the measure at the top with MISALIGNMENT (said, so
// INK_LO), ALIGNED (INK_LO) beside gen 1, the sway running.
//
// THE ONE BIG MOTION: a straightening wave climbs the tower. When the wave
// front reaches generation i its own error scale e_i eases 1 -> 0 over
// CORR_LEN frames. Every pose is still forward kinematics off its parent, so a
// correction low down carries the whole tower above it: the top sweeps ~535
// world px home in one long arc. Nothing else is animated by hand — the
// measure is read off the top slab, the label exits when the measure gets
// shorter than it, the sway falls with the lean.
//
// GESTURES (each with the word it serves; nothing else moves):
//   1. THE WAVE "every generation of models … more and more" — front at gen 2
//      on f1 ("every" 0), gen 9 f34, gen 16 f62 ("more" 61); intervals
//      5.0 -> 3.7 f; each correction 12 f. The top sweeps 535 -> 0 world px in
//      one near-linear arc (offset f0 535.3, f20 399.6, f40 198.1, f60 40.0,
//      f75 0.0); < 1 px from f71; every slab < 0.2 px/f from f73.
//      max |θ| 51.21° at f0 -> 0.000° at f75. Sway falls with the lean to 0.
//   2. THE BATON (same gesture, its colour) — ripe rides the front; gen 16
//      hands down f1-11, ripens again f59 and ends ripe.
//   3. THE MEASURE (read off the top slab) shortens with the swing; at 0
//      (f72) its ticks draw back into the line over 6 f.
//   4. MISALIGNMENT slides out f28 -> f38 ("models" 27): the measure (318
//      world = 267 screen px) has just got shorter than the label (275).
//   5. ALIGNED (top, INK_HI) slides up f64 -> in f74 ("aligned" 80).
//   CAMERA (damped, pre-rolled 8 f so f0 is already drifting):
//      A f-8 -> f44 recentre cx 686 -> 590, k 0.83 -> 0.845, leading the swing;
//      B f28 -> f68 settle cx 540, k -> 0.868, content centre on the straight
//        tower; lands ~f72 (speed < 0.5 px/f), 8 f before "aligned";
//      C f60 -> f150 the tail's creep in, a decaying lobe (k 0.873 at f74 ->
//        0.889 at f104). A+B overlap, so the join never stalls.
// MEASURED (scratchpad StandsTrue/measure.ts):
//   camera max |v| 2.91 px/f, max |Δv| 0.16 px/f², min travel 0.40 px/f
//   (never parked); max slab screen speed 8.3 px/f (f29); energy min 9.1 px
//   (f104); lowest ink y 1382.0 (f34); min edge air 113 px; label ink vs
//   slab/line ink ≥ 21.2 px (MISALIGNMENT), 24.5 (ALIGNED top), 23.3
//   (ALIGNED bottom). f0 camera cx 681.7 cy 1003.5 k 0.8307; f74 cx 540.2
//   k 0.8734 (ground at screen y 1371).
// ---------------------------------------------------------------------------

export { FPS };
export const IN_SECONDS = 32.979;
/** Grid phase continuity across the clip's cuts. */
export const GRID_F0 = Math.round(IN_SECONDS * FPS); // 791
/** 3.721 s of speech = 89 f, + 16 f tail. */
export const DURATION = 105;
export const BEATS = {
  every: 0,
  generation: 9,
  models: 27,
  able: 45,
  more1: 61,
  more2: 76,
  aligned: 80,
  ends: 89,
} as const;

// ---------------------------------------------------------------------------
// THE WAVE. The front reaches gen 2 at f1 and gen 16 at ~f62; the interval
// between generations shrinks linearly 5.0 -> 3.7 f ("more and more"). Each
// correction is a smootherstep over CORR_LEN frames: zero velocity in and out,
// so a slab that has been straightened never jolts, and the corrections
// overlap by ~2.5 generations — one continuous climb, not a list.
// ---------------------------------------------------------------------------
export const WAVE_F0 = 1;
export const WAVE_DT0 = 5.0;
export const WAVE_DT1 = 3.7;
export const CORR_LEN = 12;

/** WAVE_START[i] = the frame the front reaches generation i (i = 2..16). */
export const WAVE_START: number[] = (() => {
  const s: number[] = Array.from({ length: N_GEN + 1 }, () => Infinity);
  s[2] = WAVE_F0;
  for (let i = 3; i <= N_GEN; i++) {
    const a = (i - 3) / (N_GEN - 3);
    s[i] = s[i - 1] + WAVE_DT0 + (WAVE_DT1 - WAVE_DT0) * a;
  }
  return s;
})();

const smoother = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** Generation i's own error scale at frame f: 1 (as cut 4 left it) -> 0. */
export const eAt = (i: number, f: number) => (i < 2 ? 0 : 1 - smoother((f - WAVE_START[i]) / CORR_LEN));

/** The sway runs on the clip's global clock, so it continues across cuts. */
export const swayFrameAt = (f: number) => GRID_F0 + f;

/** All sixteen poses at frame f (index 0 = gen 1). */
export const posesAt = (f: number): Pose[] =>
  towerPoses(N_GEN, { e: (i) => eAt(i, f), swayFrame: swayFrameAt(f) });

// ---------------------------------------------------------------------------
// TONE. Ripe rides the front: a slab ripens 3 f before the front reaches it
// (the gesture leads), stays ripe while it is being corrected and returns to
// deep over the 10 f after its correction is done. Gen 16 arrives ripe from
// cut 4, hands the baton down to the bottom as the wave starts there (deep by
// f11), ripens again when the front reaches it and ENDS ripe.
// ---------------------------------------------------------------------------
export const TONE_LEAD = 3;
export const TONE_IN = 6;
export const TONE_OUT = 10;
export const TOP_HANDOFF = 10;

export const toneAt = (i: number, f: number) => {
  if (i < 2) return 0;
  const s = WAVE_START[i];
  const inT = smoothstep((f - Math.max(0, s - TONE_LEAD)) / TONE_IN);
  if (i === N_GEN) {
    const handoff = 1 - smoothstep((f - WAVE_F0) / TOP_HANDOFF);
    return Math.max(handoff, inT);
  }
  const outT = 1 - smoothstep((f - (s + CORR_LEN - 2)) / TONE_OUT);
  return inT * outT;
};

// ---------------------------------------------------------------------------
// THE CAMERA. Authored as target tracks (camEase glides, summed so they
// overlap and the join is C1 with no stall), handed to fieldShared's damper.
// cx is damped by the same runCamera (its cy channel is a plain damper).
//   A  f0 -> f44  recentre from the bent tower's composition toward LINE_X,
//                 leading the swing (warp 0.85).
//   B  f28 -> f74 settle on the straight tower: cx LINE_X, k up to K_LAND,
//                 content centre on the whole standing tower (warp 0.9).
//   C  f60 -> f150 (runs past the cut) the tail's creep in — a decaying
//                 lobe, so the frame is never parked and never starts anew.
// ---------------------------------------------------------------------------
/** Opening framing = the wide frame cut 4 ends on (humans -> bent top + label). */
export const CAM_PRE = 8;
export const K_OPEN = 0.83;
export const CX_OPEN = 686;
/** World y put at screen 835 (the content centre) at the open and at the land. */
export const C_OPEN = 853;
export const K_MID = 0.845;
export const CX_MID = 590;
export const K_LAND = 0.868;
export const C_LAND = 889;
export const K_END = 0.9;

type Glide = { f0: number; f1: number; warp: number; dk: number; dcx: number; dc: number };
export const GLIDES: Glide[] = [
  { f0: -CAM_PRE, f1: 44, warp: 0.85, dk: K_MID - K_OPEN, dcx: CX_MID - CX_OPEN, dc: 0 },
  { f0: 28, f1: 68, warp: 0.9, dk: K_LAND - K_MID, dcx: LINE_X - CX_MID, dc: C_LAND - C_OPEN },
  { f0: 60, f1: 150, warp: 0.6, dk: K_END - K_LAND, dcx: 0, dc: 0 },
];

const glideU = (g: Glide, f: number) => camEase((f - g.f0) / (g.f1 - g.f0), g.warp);
export const targetAt = (f: number) => {
  let k = K_OPEN;
  let cx = CX_OPEN;
  let c = C_OPEN;
  for (const g of GLIDES) {
    const u = glideU(g, f);
    k += g.dk * u;
    cx += g.dcx * u;
    c += g.dc * u;
  }
  return { k, cx, c, cy: c + CAM_LIFT / k };
};

// The damper runs from f -CAM_PRE, so the camera is already under way at f0
// (cut 4 hands over a drifting frame, never a parked one). Its index is
// frame + CAM_PRE.
const CAM_N = DURATION + CAM_PRE + 2;
const CAM_I = [...Array(CAM_N).keys()];
const T = CAM_I.map((i) => targetAt(i - CAM_PRE));
const K_T = T.map((t) => t.k);
const CY_T = T.map((t) => t.cy);
const CX_T = T.map((t) => t.cx);
const CAM_ALL: { cx: number; cy: number; k: number }[] = CAM_I.map((i) => {
  const a = runCamera(i, CAM_I, CY_T, K_T);
  const b = runCamera(i, CAM_I, CX_T, K_T);
  return { cx: b.cy, cy: a.cy, k: a.k };
});
/** CAM[f] for f = 0..DURATION. */
export const CAM = CAM_ALL.slice(CAM_PRE);
export const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];

// ---------------------------------------------------------------------------
// THE MEASURE is read off the top slab every frame: from the plumb line to the
// top slab's centre, at that centre's height. When the top is home (offset
// < 0.5 px) its ticks draw back into the line over MEASURE_OUT frames.
// ---------------------------------------------------------------------------
export const MEASURE_OUT = 6;
export const topCentreAt = (f: number) => slabCentre(posesAt(f)[N_GEN - 1]);
export const measureLenAt = (f: number) => topCentreAt(f).x - LINE_X;
/** The first frame the top-slab centre is within 0.5 world px of the line. */
export const MEASURE_ZERO_F = (() => {
  for (let f = 0; f < DURATION; f++) if (Math.abs(measureLenAt(f)) < 0.5) return f;
  return DURATION;
})();
export const measureDrawAt = (f: number) => 1 - smoothstep((f - MEASURE_ZERO_F) / MEASURE_OUT);

// ---------------------------------------------------------------------------
// LABELS. Every label in this cut obeys the one rule: right-aligned
// ALIGNED_DX world px left of the thing it names, vertically centred on it.
//   MISALIGNMENT names the measure: left of the plumb line, on the measure's
//     height, riding it as the top swings home. (Centred ABOVE the measure it
//     overlaps gen 15's upper-left corner by construction: the upper slabs lean
//     into the pocket over the measure.) It slides out (reverse entrance) the
//     moment the measure gets shorter than the label.
//   ALIGNED (bottom, INK_LO) names gen 1, as cuts 1-4 left it.
//   ALIGNED (top, INK_HI) names gen 16 once straight: fully in at f74, 6 f
//     before "aligned" (80).
// Widths are measured off a full-res render (ink, screen px).
// ---------------------------------------------------------------------------
export const ALIGNED_DX = 28; // world px left of the named thing
export const MIS_TEXT = "Misalignment";
export const MIS_W = 275; // screen px ink, Roboto Condensed 700 caps 40 px, 0.04 em
export const misLabelAt = (f: number) => ({ x: LINE_X - ALIGNED_DX, y: topCentreAt(f).y });
export const MIS_OUT = (() => {
  for (let f = 0; f < DURATION; f++) if (measureLenAt(f) < MIS_W / camAt(f).k) return f;
  return DURATION;
})();

export const ALIGNED_TEXT = "Aligned";
export const ALIGNED_W = 152; // screen px ink (measured)
/** Gen 1: exact and never corrected, so its label is a constant. */
export const ALIGNED_BOTTOM = { x: LINE_X - SLAB_W / 2 - ALIGNED_DX, y: slabCentre(GEN1_POSE).y };
/** Gen 16 once straight: its left end and centre height. */
export const ALIGNED_TOP = {
  x: LINE_X - SLAB_W / 2 - ALIGNED_DX,
  y: slabCentre(towerPoses(N_GEN, { e: () => 0 })[N_GEN - 1]).y,
  inFrame: 64,
};

// A few asserts, so a retune cannot silently break the brief.
if (MIS_OUT < 20 || MIS_OUT > 60) {
  throw new Error(`StandsTrue: MISALIGNMENT exits at f${MIS_OUT}, outside f20-60`);
}
if (MEASURE_ZERO_F > 76) {
  throw new Error(`StandsTrue: the top is home at f${MEASURE_ZERO_F}, after "more" (76)`);
}

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
  vignette: z.number(),
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
  vignette: 0.45,
});

const StandsTrue: React.FC<Props> = ({
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  vignette,
}) => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = camAt(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const poses = posesAt(frame);
  const slabs = poses.map((pose, i) => ({ pose, t: toneAt(i + 1, frame) }));
  const top = slabCentre(poses[N_GEN - 1]);
  const mis = misLabelAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={GRID_F0 + frame}
        cy={cy}
        cyRest={CAM[0].cy}
        cx={cx}
        cxRest={CAM[0].cx}
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
          {/* the models over us, the plumb line through them */}
          <Tower k={k} slabs={slabs} />

          {/* how far the top is from the line — read off the top slab */}
          <WorldSvg>
            <Measure k={k} y={top.y} x2={top.x} draw={measureDrawAt(frame)} opacity={INK_HI} />
          </WorldSvg>

          <Label
            k={k}
            frame={frame}
            text={ALIGNED_TEXT}
            x={ALIGNED_BOTTOM.x}
            y={ALIGNED_BOTTOM.y}
            inFrame={-100}
            anchor="right"
            size={LABEL_PX}
            opacity={INK_LO}
          />
          <Label
            k={k}
            frame={frame}
            text={MIS_TEXT}
            x={mis.x}
            y={mis.y}
            inFrame={-100}
            outFrame={MIS_OUT}
            anchor="right"
            size={LABEL_PX}
            opacity={INK_LO}
          />
          <Label
            k={k}
            frame={frame}
            text={ALIGNED_TEXT}
            x={ALIGNED_TOP.x}
            y={ALIGNED_TOP.y}
            inFrame={ALIGNED_TOP.inFrame}
            anchor="right"
            size={LABEL_PX}
            opacity={INK_HI}
          />
        </div>
      </AbsoluteFill>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export default StandsTrue;
