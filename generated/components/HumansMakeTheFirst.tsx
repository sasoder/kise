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
  GROUND_Y,
  Humans,
  LINE_TOP_Y,
  LINE_X,
  Label,
  PLUMB_Y0,
  PlumbLine,
  type Pose,
  SLAB_H,
  SLAB_W,
  STROKE,
  Slab,
  WorldSvg,
  birthEase,
  birthPose,
  slabCentre,
} from "./towerShared";

// ---------------------------------------------------------------------------
// HumansMakeTheFirst — Noam_Alignment_Degradation v2, cut 1 of 5 (in 0:04.440).
//
//   "we make them, we make them, we think what we think is aligned,"
//
// The tower's first generation is made by US: a solid ripe slab rises out of
// the row of humans in one continuous rise with two pushes (one per "make"),
// seats above their heads, and then our idea of "aligned" — the plumb line —
// draws up out of the middle person's head, straight through the slab's
// middle and off the top of the frame. ALIGNED arrives beside the slab.
//
// GESTURES (nothing else), with the word each one serves:
//   1. gen 1 born out of the humans  f2 -> seated f37   "we MAKE them, we MAKE them"
//      one rise, two pushes: speed peaks f10 (after "make" f4) and f32 (after
//      "make" f30), eases to a trough at f25 (29 % of the peak, never stops);
//      top edge 4.7 px clear of the heads at f18 ("them"). Ripe throughout.
//      It rises out of the humans' ground, behind their shoulders (first orange
//      in the gaps at f5), and crests above their heads.
//   2. plumb line draws up from the middle head  f38 -> through the slab's
//      centre f41 -> off the frame top f53 -> fully drawn (off-screen) f70
//                                                  "we THINK what we think is aligned"
//   3. ALIGNED slides up left of slab 1   in f42 -> fully in f52   "ALIGNED" (f56)
//   4. tail f62-77: the camera's drift decaying + grid parallax. No new gesture.
//
// CAMERA (three superposed glides on one clock, damped by runCamera; the
// clock starts PRE = 8 frames before f0, so the camera is already moving at
// f0 — k -0.30 %/f):
//   A f-8 -> f36 (warp 0.9): torsos at k 1.70 -> people + seat + label space
//     at k 1.38, content y 1448 -> 1405 (rises with the slab).
//   B f30 -> f47 (warp 0.9): rise with the line + room for the label: k ->
//     1.335, content y -> 1368, x 540 -> 484. Lands ~f51, 5 f before "aligned".
//   C f44 -> f120 (warp 0.75): the decaying drift in the same directions,
//     k -> 1.29, y -> 1342, x -> 478. Still travelling at f77 (0.4 px/f).
//   f0 k 1.685 (content y 1446) · f37 k 1.380 · f52 k 1.335 · f77 k 1.314,
//   END (f77) cx 481.2 cy 1450.8 k 1.3137 — cut 2 opens here.
//
// MEASURED ($S/HumansMakeTheFirst/measure.ts, final run):
//   slab speed peaks 9.66 @f10 / 5.43 @f32 world px/f, trough 2.83 @f25
//     = 0.293 of the peak (≥ 0.25 PASS); max 14.4 screen px/f
//   seated (|dy| < 0.5 for good) f37 PASS; plumb reaches slab centre f41 PASS
//     (x = 540 = slab centre: dead on); label fully in f52 PASS
//   lowest ink max screen y 1032.9 (≤ 1400 PASS); edge air min 165 px (PASS)
//   camera max |dv| 1.005 px/f² (≤ 2.5 PASS), max |v| 9.3 px/f; never parked
//     (min 1.57x the 0.4 px/f / 0.15 %/f floor, f61); energy > 0 every frame
//     (min 1.30 @f77)
//   end group (ALIGNED left 229 .. slab right 830 screen) centre 529.5
//
// DEVIATIONS
//   * Gen 1's birth starts from a pose one slab-height BELOW the ground line
//     (top face on the ground), clipped 2.5 px above the ground stroke, not
//     from HUMANS_POSE: at HUMANS_POSE the slab stands between the people's
//     heads and would pop into view at f2 over an opening picture that must be
//     "only the humans". It is still birthPose(parent, GEN1_POSE, u): it rises
//     up out of the humans' ground, behind their shoulders, shows in the gaps,
//     and crests above their heads.
//   * The plumb-line tip peaks at 72 screen px/f (> the 45 cap) while it runs
//     to the frame top (a continuous growing line, not an object, so nothing
//     strobes); the brief's timing leaves ~15 f for ~900 screen px.
//   * End framing centres the ALIGNED + slab box at 529.5, not 540: the right
//     side (slab, people, ground) is the visual mass, so the box sits ~10 px
//     left to keep the mass near the axis.
// ---------------------------------------------------------------------------

export const IN_SECONDS = 4.44;
export const GRID_F0 = Math.round(IN_SECONDS * FPS); // 107
export const DURATION = 78; // 62 f speech + 16 tail

// ---------------------------------------------------------------------------
// GESTURE 1 — the birth. One rise with two pushes. The speed is authored as a
// sum of three smooth lobes (push 1, push 2, and a shallow envelope under both
// so the rise never stops between them), integrated and normalised to 1.
// ---------------------------------------------------------------------------
export const BIRTH_F0 = 2;
export const BIRTH_F1 = 37;
/** The birth's parent: one slab below GROUND_Y, its top face on the ground. */
export const START_POSE: Pose = { x: LINE_X, y: GROUND_Y + SLAB_H, theta: 0 };
/** The clip line: 2.5 px above the ground stroke's top edge (= the people's
 *  ink base), so the slab never shares an anti-aliased edge with the ground or
 *  the shoulders — at 1:1 a shared edge showed as a thin orange seam. */
export const CLIP_Y = GROUND_Y - STROKE / 2 - 2.5;

const lobe = (f: number, a: number, b: number, p: number, q: number) => {
  const x = (f - a) / (b - a);
  return x <= 0 || x >= 1 ? 0 : Math.pow(x, p) * Math.pow(1 - x, q);
};
const lobePeak = (a: number, b: number, p: number, q: number) => {
  const x = p / (p + q);
  return lobe(a + x * (b - a), a, b, p, q);
};
const PUSH1 = { a: BIRTH_F0, b: 21, p: 1.3, q: 2.6, w: 1.6 };
const PUSH2 = { a: 23, b: BIRTH_F1, p: 2.8, q: 1.5, w: 0.85 };
const FLOOR = { a: BIRTH_F0, b: BIRTH_F1, p: 1.6, q: 1.6, w: 0.6 };
const riseSpeed = (f: number) =>
  [PUSH1, PUSH2, FLOOR].reduce((s, L) => s + (L.w * lobe(f, L.a, L.b, L.p, L.q)) / lobePeak(L.a, L.b, L.p, L.q), 0);

const SUB = 40;
const RISE_TABLE: number[] = (() => {
  const out: number[] = [0];
  let acc = 0;
  for (let f = BIRTH_F0; f < BIRTH_F1; f++) {
    for (let s = 0; s < SUB; s++) acc += riseSpeed(f + (s + 0.5) / SUB) / SUB;
    out.push(acc);
  }
  return out.map((v) => v / acc);
})();
/** Birth progress 0..1 (fraction of the rise) at frame f. */
export const riseAt = (f: number) => {
  if (f <= BIRTH_F0) return 0;
  if (f >= BIRTH_F1) return 1;
  const i = Math.floor(f - BIRTH_F0);
  const fr = f - BIRTH_F0 - i;
  return RISE_TABLE[i] + (RISE_TABLE[i + 1] - RISE_TABLE[i]) * fr;
};
/** birthEase is monotonic; invert it so birthPose travels `s` of the rise. */
const invBirthEase = (s: number) => {
  let lo = 0;
  let hi = 1;
  for (let n = 0; n < 40; n++) {
    const m = (lo + hi) / 2;
    if (birthEase(m) < s) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
export const gen1PoseAt = (f: number): Pose => {
  const s = riseAt(f);
  if (s >= 1) return GEN1_POSE;
  return birthPose(START_POSE, GEN1_POSE, invBirthEase(s));
};

// ---------------------------------------------------------------------------
// GESTURE 2 — the plumb line. Its tip's speed ramps up from rest at the head,
// holds while it runs off the top of the frame, and eases to rest again
// off-screen at LINE_TOP_Y: draw 0 -> 1 ease-in-out, with the ease-out where
// nobody sees it.
// ---------------------------------------------------------------------------
export const PLUMB_F0 = 37;
const PLUMB_RAMP = 7;
const PLUMB_CRUISE_END = 60;
const PLUMB_DECEL = 10;
const PLUMB_LEN = PLUMB_Y0 - LINE_TOP_Y;
const plumbSpeed = (f: number) =>
  smoothstep((f - PLUMB_F0) / PLUMB_RAMP) * (1 - smoothstep((f - PLUMB_CRUISE_END) / PLUMB_DECEL));
const PLUMB_TABLE: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(acc);
    for (let s = 0; s < SUB; s++) acc += plumbSpeed(f + (s + 0.5) / SUB) / SUB;
  }
  return out.map((v) => Math.min(1, v / acc));
})();
export const PLUMB_DONE = PLUMB_CRUISE_END + PLUMB_DECEL;
/** Plumb-line draw 0..1 at frame f. */
export const plumbDrawAt = (f: number) => {
  const i = Math.max(0, Math.min(PLUMB_TABLE.length - 1, Math.round(f)));
  return PLUMB_TABLE[i];
};
/** The tip's world y at frame f. */
export const plumbTipY = (f: number) => PLUMB_Y0 - PLUMB_LEN * plumbDrawAt(f);

// ---------------------------------------------------------------------------
// GESTURE 3 — ALIGNED, right-aligned 28 world px left of the slab's left end,
// vertically centred on the slab. Fully in by f52; the word is f56.
// ---------------------------------------------------------------------------
export const LABEL_IN_F = 42;
export const LABEL_GAP = 28;
export const LABEL_X = LINE_X - SLAB_W / 2 - LABEL_GAP;
export const LABEL_Y = slabCentre(GEN1_POSE).y;

// ---------------------------------------------------------------------------
// CAMERA. Three glides superposed on one clock (each is a camEase lobe, so the
// sum is C1 and the joins never stall), handed to runCamera's damper. The
// clock runs PRE frames ahead of f0 so the camera is already moving at f0.
// ---------------------------------------------------------------------------
export const PRE = 8;
type Glide = { f0: number; f1: number; warp: number; dk: number; dy: number; dx: number };
export const K0 = 1.7;
export const C0 = { x: LINE_X, y: 1448 };
export const GLIDES: Glide[] = [
  { f0: -PRE, f1: 36, warp: 0.9, dk: 1.38 - 1.7, dy: 1405 - 1448, dx: 0 },
  { f0: 30, f1: 47, warp: 0.9, dk: 1.335 - 1.38, dy: 1368 - 1405, dx: 484 - 540 },
  { f0: 44, f1: 120, warp: 0.75, dk: 1.29 - 1.335, dy: 1342 - 1368, dx: 478 - 484 },
];
const target = (f: number) => {
  let k = K0;
  let y = C0.y;
  let x = C0.x;
  for (const g of GLIDES) {
    const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp);
    k += g.dk * e;
    y += g.dy * e;
    x += g.dx * e;
  }
  return { k, cy: y + CAM_LIFT / k, cx: x };
};
const TAU_N = DURATION + PRE + 4;
const TF: number[] = [];
const TK: number[] = [];
const TCY: number[] = [];
const TCX: number[] = [];
for (let t = 0; t <= TAU_N; t++) {
  const g = target(t - PRE);
  TF.push(t);
  TK.push(g.k);
  TCY.push(g.cy);
  TCX.push(g.cx);
}
export const CAM_TABLE: { cx: number; cy: number; k: number }[] = [];
for (let f = 0; f <= DURATION + 2; f++) {
  const a = runCamera(f + PRE, TF, TCY, TK);
  const b = runCamera(f + PRE, TF, TCX, TK);
  CAM_TABLE.push({ cx: b.cy, cy: a.cy, k: a.k });
}
export const camAt = (f: number) => CAM_TABLE[Math.max(0, Math.min(CAM_TABLE.length - 1, Math.round(f)))];
export const END_CAM = CAM_TABLE[DURATION - 1];

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
  label: z.string(),
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
  label: "Aligned",
});

const CAM_REST = CAM_TABLE[0];

const HumansMakeTheFirst: React.FC<Props> = ({
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  label,
}) => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = camAt(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const pose = gen1PoseAt(frame);
  const hidden = pose.y - SLAB_H >= CLIP_Y; // wholly under the ground: draw nothing

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
          {/* generation 1, rising up out of the humans' ground, behind them */}
          <WorldSvg>
            <defs>
              <clipPath id="hmtf-ground" clipPathUnits="userSpaceOnUse">
                <rect x={-2000} y={-4000} width={5080} height={4000 + CLIP_Y} />
              </clipPath>
            </defs>
            {hidden ? null : (
              <g clipPath="url(#hmtf-ground)">
                <Slab pose={pose} t={1} k={k} />
              </g>
            )}
          </WorldSvg>

          {/* us */}
          <Humans k={k} />

          {/* our idea of "aligned", out of the middle head */}
          <WorldSvg>
            <PlumbLine k={k} draw={clamp01(plumbDrawAt(frame))} />
          </WorldSvg>

          <Label
            k={k}
            frame={frame}
            text={label}
            x={LABEL_X}
            y={LABEL_Y}
            inFrame={LABEL_IN_F}
            anchor="right"
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HumansMakeTheFirst;
