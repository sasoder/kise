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
  worldTransform,
} from "./fieldShared";
import {
  BG_BLUR,
  BG_PARALLAX,
  BG_SRC,
  FPS,
  GEN1_POSE,
  INK_LO,
  Label,
  SLAB_W,
  Tower,
  birthPose,
  settleDip,
  slabCentre,
  toneBaton,
  towerPoses,
  type Pose,
} from "./towerShared";

// ---------------------------------------------------------------------------
// ModelsMakeTheNext — Noam_Alignment_Degradation v2, cut 2 of 5, in 0:09.380.
//   "And then we use these models to help us with the next generation of models"
//
//   SRT 00:00:09,380 → 00:00:12,419 = 73 f speech + 16 f tail = 89 f, 24 fps.
//   Word onsets: and 0 · then 1 · we use 5 · these 14 · models 17 · to 25 ·
//   help 30 · us 35 · with 41 · the 47 · next 49 · generation 51 · of 59 ·
//   models 64 · ends 73.
//
// Opens on cut 1's end picture: humans + ground, generation 1 dead on the white
// line, the plumb line running off the top, ALIGNED (now INK_LO) left of slab 1.
// Camera at f0 = HumansMakeTheFirst's END_CAM (cx 481.2, cy 1450.8, k 1.314),
// already moving.
//
// GESTURES (nothing else is animated):
//   1. "we use these models" — generation 1 is USED: gen 2's birth starts at
//      f12 (birthPose(gen1, gen2, u), linear u, shared birthEase); its top edge
//      is 2.3 px out of slab 1 at f14 "these", 25 px at f20 — slow first.
//   2. "to help us with the next generation" — the child slides up out of slab
//      1 (rise 60.5 px by f30 "help") and its own ERR[2] comes in over the last
//      40 % (f32 → f45): it LANDS f45, a hair off — 4 f before "next" (49),
//      6 f before "generation" (51). Still (< 0.5 px/f) from f44.
//   3. Landing f45 → f53: settleDip on the slab stack (≤ 3 px world; humans and
//      plumb line never move) + TONE BATON: slab 1 ripe → deep over 8 f, gen 2
//      stays ripe.
//   4. "of models" + tail f55 → f88: the close-up holds the landed pair — the
//      white line passing just left of gen 2's centre and the thin wedge on
//      the left. Carried by glide C (below); sway at gen 2 is 0.0025°. No label
//      for gen 2.
//   The ALIGNED label is static context (said in cut 1), never re-animated.
//
// CAMERA (summed camEase glides on one target → runCamera damper, pre-rolled
// 16 f so it is moving at f0; cx damped by the same damper):
//   A f-8 → f32  warp 0.90  rise with the emerging child: k 1.31 → 1.40,
//                content c 1358 → 1320, cx 479 → 513.
//   B f24 → f49  warp 0.85  push in on the landing: k → 2.0, cx → 531; the
//                damped camera reaches 98.5 % of its k at f52, 7 f before "of".
//   C f24 → f150 warp 0.55  the push continuing, decaying through the tail
//                (k +0.1, c −12, cx +6 over its span): 0.34 %/f at f53 →
//                0.04 %/f + 0.45 px/f travel at f88, same direction as B.
//   Final (f88): k 2.042, cx 535.7, cy 1372 — the slab pair's centre at
//   screen y 850, the whole pair + ALIGNED + humans in frame.
//
// MEASURED ($S/ModelsMakeTheNext/measure.ts):
//   camera max |Δv| of a fixed world point 0.92 px/f² (≤ 2.5), max |v| 10.4 px/f,
//     min travel 0.45 px/f (f88) — never parked
//   max screen speed of any element 10.5 px/f (≤ 45)
//   gen 2 still from f44 (≤ 46); wedge at landing left 19.9 / right 12.0 world px
//   gen 2 centre − LINE_X 6.81 world px = 12.8 screen px at landing (k 1.87),
//     13.9 screen px at f88 (k 2.04); θ 1.502°
//   lowest ink screen y 1226 (f88, ground line) ≤ 1400
//   min edge air 30.5 px (f88, ALIGNED left edge; ground right end 76.9) ≥ 30
//   min per-frame energy 5.4 px/f (f88) > 0
// ---------------------------------------------------------------------------

export { FPS };
export const IN_SECONDS = 9.38;
export const GRID_F0 = Math.round(IN_SECONDS * FPS); // 225
export const DURATION = 89; // 73 f speech + 16 tail

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

// ---------------------------------------------------------------------------
// THE BIRTH. Generation 2 slides up out of generation 1 — the first model-made
// model — and lands a hair off (ERR[2]: 1.5°, 6 px). Everything else follows
// from the landing frame: the settle dip, the tone baton.
// ---------------------------------------------------------------------------
export const BIRTH_F0 = 12; // u = 0: coincident with slab 1, behind it
export const LAND_F = 45; // u = 1: seated on slab 1's top face

export const birthU = (f: number) => clamp01((f - BIRTH_F0) / (LAND_F - BIRTH_F0));

/** The sway clock is the clip's global frame, so it is continuous across cuts. */
export const swayFrameOf = (f: number) => GRID_F0 + f;

/** Everything the tower draws at cut frame f. */
export const towerAt = (f: number) => {
  const P = towerPoses(2, { swayFrame: swayFrameOf(f) });
  const gen1: Pose = P[0];
  const slabs: { pose: Pose; t: number }[] = [{ pose: gen1, t: toneBaton(f - LAND_F).parent }];
  if (f >= BIRTH_F0) {
    slabs.push({ pose: birthPose(gen1, P[1], birthU(f)), t: toneBaton(f - LAND_F).child });
  }
  return { slabs, dy: settleDip(f - LAND_F), gen2Final: P[1] };
};

// ALIGNED, said in cut 1: right-aligned 28 world px left of slab 1, centred on it.
export const LABEL_X = GEN1_POSE.x - SLAB_W / 2 - 28;
export const LABEL_Y = slabCentre(GEN1_POSE).y;

// ---------------------------------------------------------------------------
// CAMERA. Glides are summed eased increments on one target (so they overlap and
// join C1), then put through the shared damper. The track starts PRE frames
// before f0 so the camera is already moving when the cut opens.
// `c` is the world y that lands at screen 835 (cy = c + CAM_LIFT / k).
// ---------------------------------------------------------------------------
type Glide = { f0: number; f1: number; dk: number; dc: number; dx: number; warp: number };

export const CAM_START = { k: 1.308, c: 1357.82, x: 479.24 };
export const GLIDES: Glide[] = [
  // A: rise with the emerging child, ease in a touch
  { f0: -8, f1: 32, dk: 0.1, dc: -38, dx: 34, warp: 0.9 },
  // B: push in on the landing — the wedge and the line through gen 2
  { f0: 24, f1: 49, dk: 0.56, dc: 0, dx: 18, warp: 0.85 },
  // C: the push continuing, decaying through the tail
  { f0: 24, f1: 150, dk: 0.1, dc: -12, dx: 6, warp: 0.55 },
];

const PRE = 16;
const F_END = DURATION + 4;
const keyAt = (f: number) => {
  let k = CAM_START.k;
  let c = CAM_START.c;
  let x = CAM_START.x;
  for (const g of GLIDES) {
    const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp);
    k += g.dk * e;
    c += g.dc * e;
    x += g.dx * e;
  }
  return { k, c, x, cy: c + CAM_LIFT / k };
};

const TF: number[] = [];
const TK: number[] = [];
const TCY: number[] = [];
const TCX: number[] = [];
for (let f = -PRE; f <= F_END; f++) {
  const key = keyAt(f);
  TF.push(f + PRE);
  TK.push(key.k);
  TCY.push(key.cy);
  TCX.push(key.x);
}

export const CAM_TABLE: { cx: number; cy: number; k: number }[] = [];
for (let f = 0; f <= F_END; f++) {
  const a = runCamera(f + PRE, TF, TCY, TK);
  const b = runCamera(f + PRE, TF, TCX, TK);
  CAM_TABLE.push({ cx: b.cy, cy: a.cy, k: a.k });
}
export const CAM_AT = (f: number) => CAM_TABLE[Math.max(0, Math.min(CAM_TABLE.length - 1, Math.round(f)))];
export const CAM_KEY = keyAt;

// ---------------------------------------------------------------------------
const ModelsMakeTheNext: React.FC<Props> = ({
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
  const { slabs, dy } = towerAt(frame);

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
          <Label
            k={k}
            frame={frame}
            text="Aligned"
            x={LABEL_X}
            y={LABEL_Y}
            inFrame={-1000}
            opacity={INK_LO}
            anchor="right"
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ModelsMakeTheNext;
