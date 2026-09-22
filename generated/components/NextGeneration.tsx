import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  sway,
  worldTransform,
} from "./fieldShared";
import { camKnots3, runCam3 } from "./alignShared";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  CUT_OFFSETS,
  FPS,
  GUIDE_DRAW_V,
  INK,
  MARK,
  PACKET_V,
  PEOPLE_Y,
  SPEED_CAP_SCREEN,
  World,
  arrowOf,
  bounds,
  copyGeom,
  nodesAt,
  sched,
  stateAt,
  throughPackets,
} from "./degradationShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Alignment_Degradation`, cut 2 of five: `NextGeneration`.
// Line (SRT 0:09.380 -> 0:12.419):
//   "And then we use these models to help us with the next generation of models"
//
// THE CLIP'S ONE IDEA: **Alignment is passed on, generation to generation,
// like a copy of a copy. Each generation is made by the one before it and
// inherits its idea of "aligned" — with a little error. Left alone the errors
// compound and the lineage curls away from what the humans wanted; corrected
// every generation, it straightens onto the humans' line.**
//
// This cut is THE SECOND LINK, and it is where the mechanism becomes a
// mechanism: the same build as cut 1, but the packets now come out of a MODEL
// instead of only out of the people, and the arrow that gets copied is the
// MODEL'S arrow. Nothing new is invented for it.
//
// VOCABULARY — `degradationShared`'s. The world is ONE 790-frame timeline;
// this cut is a window onto G119-207 with a camera on it, and f0 is not a
// beginning — it is cut 1's standing picture 41 frames on, with the guide still
// drawing (it completes at G130 = f11) and idle packets already on the wire.
//
// DURATION. 3.039 s of speech x 24 = 72.9 -> 73 frames, plus the set's 16-frame
// tail: DURATION = 73 + 16 = 89. CUT_OFFSET 119, so G = 119 + frame.
//
// Word -> frame (24 fps from the cut's in-point):
//   and 0 · then 1 · we-use 4 · these 13 · models 17 · to 24 · help 30 ·
//   us 34 · with 41 · the 46 · next 48 · generation 51 · of 59 · models 63 ·
//   (speech ends 73)
//
// SOUND-OFF READING TEST — one sentence:
//   "the orange mark starts sending packets up its own arrow at the empty spot
//    above it, the people run threads up past it to the same spot, a second
//    orange mark fills in there, and then the first mark's arrow is copied up
//    onto it."
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion, carried straight out of cut 1's tail.
//
//  1. f4-24    "we use these       THE MODEL GOES TO WORK. Gen 1's arrow drops
//              models" (4/13/17)   from its idle rate to the BUILD rate — the
//                                  same ACCENT packets, more of them — and they
//                                  PILE AT ITS TIP, where nothing exists yet.
//                                  That emptiness is the line's "the next
//                                  generation" before the word arrives.
//
//  2. f4-53    "to help us with"   THE HUMANS ARE STILL IN IT — as PACKETS, not
//              (24/30/34/41)       as threads. White packets launch from the
//                                  base at the build rate, ride up the humans'
//                                  arrow, PASS THROUGH gen 1 (the mark occludes
//                                  each one as it goes by) and carry on up gen
//                                  1's arrow among the orange ones into the new
//                                  spot. A thread from a head to gen 2 would be
//                                  a long diagonal across the whole frame; the
//                                  packet says the same thing and says it on the
//                                  chain the rest of the clip is made of.
//
//  3. f27-53   "the next           GENERATION 2 is revealed by a circular mask
//              generation"         growing from its centre as the packets land,
//              (46/48/51)          complete two frames after "generation". It
//                                  is born at its MAKER'S tone and is 97.5%
//                                  aligned: the error is there and it is not
//                                  yet visible, which is the whole point.
//
//  4. f12-62   (camera)            THE ONE LONG GLIDE. k 1.37 -> 1.05, warp
//                                  0.85, rising 101 world px: the frame opens
//                                  to hold TWO generations and the people at
//                                  once, and it lands on "of" (59) with the
//                                  copy already under way.
//
//  5. f53-69   "of models"         THE COPY. Gen 1's arrow duplicates, slides
//              (59/63)             220 px up its own direction, turns 1 deg
//                                  further (1.5 deg total — still invisible, by
//                                  design) and lands as GEN 2's OWN arrow,
//                                  pointing at the next empty spot. "models"
//                                  (63) lands mid-slide.
//
//  6. f69-88   (tail)              The last of the humans' through-packets are
//                                  still climbing the chain, the first idle
//                                  ACCENT packets appear on gen 2's new arrow,
//                                  the dashes march and the camera is still
//                                  creeping. THE CUT DOES NOT RESOLVE — gen 2's
//                                  arrow points at nothing yet.
//
// AMBIENT ONLY: per-element drift, marching dashes, idle packets on both
// standing arrows, the grid's parallax and drift, the camera's `sway` and its
// never-zero creep. No springs, flashes, glows, labels or text. No build
// threads in this cut at all — they belong to generation 1.
//
// ---------------------------------------------------------------------------
// THE CAMERA — one keyed track as a sum of eased segments, Gaussian-rounded,
// through `runCam3`, 40 frames of pre-roll carrying cut 1's own creep.
//
//   the pre-roll   f-40 -> 12   content y -14, k 1.378 -> 1.370 — cut 1 ended
//                               still creeping upward and this picks it up.
//   THE GLIDE      f12 -> 54    content y -> C_LAND, k 1.37 -> 1.05, warp 0.85.
//                               Authored to finish at f54 because the damper
//                               lags: measured, the shot is 96% of the way
//                               there at f62.
//   the creep      f56 -> 200   content y -46, k -0.015, still running at f88.
//
// The framing is solved for the LOWEST INK — the outermost person's foot, which
// is 74.5 world px below the people's nominal line — rather than for their
// nominal centre, so the caption band is respected at the landing: the lowest
// bright ink sits at screen y 1383 at f62 and never goes below 1393 in the
// whole cut, with the camera's own 5 px sway already spent.
// ---------------------------------------------------------------------------

export const CUT_OFFSET = CUT_OFFSETS.NextGeneration;
export const DURATION = 89;

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
const PRE = 40;
const FIRST = -PRE;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  beats: z.object({
    and: z.number(),
    then: z.number(),
    weUse: z.number(),
    these: z.number(),
    models: z.number(),
    to: z.number(),
    help: z.number(),
    us: z.number(),
    with: z.number(),
    the: z.number(),
    next: z.number(),
    generation: z.number(),
    of: z.number(),
    models2: z.number(),
    end: z.number(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  beats: {
    and: 0,
    then: 1,
    weUse: 4,
    these: 13,
    models: 17,
    to: 24,
    help: 30,
    us: 34,
    with: 41,
    the: 46,
    next: 48,
    generation: 51,
    of: 59,
    models2: 63,
    end: 73,
  },
});

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);

const CX = 540;

// THE ZOOM. The open is a MATCH CUT, not a number of its own: cut 1's last
// frame is k 1.372 with gen 1 at screen y 874, the people at 1276 and the
// lowest ink at 1379, so this opens at 1.37 with gen 1 at 870. (Cut 1's landing
// was tightened from 1.25 to 1.375 on the director's note and this followed it,
// because the subject carries straight over a 2.4 s gap in the speech and two
// zooms 10% apart on the same picture read as a mistake.) The LANDING stays at
// 1.05: the caption band is the binding constraint there, not the framing.
const K_OPEN = 1.37;
const K_LAND = 1.05;

/** The world y of the lowest bright ink in the cut — the outer person's foot. */
const INK_FOOT = bounds(CUT_OFFSET).y1;
/** Cut 1 left gen 1 at screen y 874 at k 1.372; this picks it up there. */
const C_OPEN = nodesAt(CUT_OFFSET)[1].y - (870 - 835) / K_OPEN;
/** ...and lands with that foot on screen y 1382 — which with the camera's own
 *  5 px sway spent leaves 13 px of the caption band, the tightest thing in the
 *  cut and the reason the landing zoom is 1.05 and not lower. */
const C_LAND = INK_FOOT - (1382 - 835) / K_LAND;

const GLIDE_F0 = 12;
const GLIDE_F1 = 54;
const CREEP_F0 = 56;
const CREEP_F1 = 200;

const contentYOf = (f: number) =>
  C_OPEN +
  14 * (1 - seg(f, FIRST, GLIDE_F0, 1.3)) -
  (C_OPEN - C_LAND) * seg(f, GLIDE_F0, GLIDE_F1, 0.85) -
  46 * seg(f, CREEP_F0, CREEP_F1, 0.9);

const kOf = (f: number) =>
  K_OPEN +
  0.008 * (1 - seg(f, FIRST, GLIDE_F0, 1.3)) -
  (K_OPEN - K_LAND) * seg(f, GLIDE_F0, GLIDE_F1, 0.85) -
  0.015 * seg(f, CREEP_F0, CREEP_F1, 0.9);

const CAM_SMOOTH = 5;
const CAM = (() => {
  const hold = (fn: (f: number) => number) => (f: number) =>
    fn(Math.max(FIRST, Math.min(CREEP_F1, f)));
  const gauss = (src: (f: number) => number, f: number) => {
    const w = Math.ceil(3 * CAM_SMOOTH);
    let num = 0;
    let den = 0;
    for (let d = -w; d <= w; d++) {
      const g = Math.exp(-(d * d) / (2 * CAM_SMOOTH * CAM_SMOOTH));
      num += g * src(f + d);
      den += g;
    }
    return num / den;
  };
  const y = hold(contentYOf);
  const kk = hold(kOf);
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({ f: f - FIRST, k: gauss(kk, f), x: CX, y: gauss(y, f) });
  }
  return camKnots3(knots, LAST + 2 - FIRST);
})();

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCam3(f - FIRST, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: c.cx + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 2, Math.round(f)));
const camAt = (f: number) => CAM_AT_F[clampF(f)];
const kAt = (f: number) => camAt(f).k;
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: WORLD_W / 2 + (wx - c.cx) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};

// ---------------------------------------------------------------------------
// THE PROOFS.
// ---------------------------------------------------------------------------

/** 1. The cut is where the clip says it is. */
(() => {
  if (CUT_OFFSET !== 119 || DURATION !== Math.round(3.039 * 24) + 16) {
    throw new Error("NextGeneration: the cut's offset or duration is not the clip's.");
  }
})();

/** 2. F0 IS CUT 1'S STANDING PICTURE, 41 FRAMES ON. Gen 1 is complete, owns its
 *  arrow, its threads are gone, and gen 2 does not exist yet. */
(() => {
  const st = stateAt(CUT_OFFSET);
  if (st.gens[0].fill < 0.999 || !st.gens[0].hasArrow) {
    throw new Error("NextGeneration: gen 1 is not standing at f0.");
  }
  if (st.gens[0].threads.opacity > 0.001) {
    throw new Error("NextGeneration: gen 1's build threads have not gone at f0.");
  }
  if (st.gens[1].threads.people.length > 0) {
    throw new Error("NextGeneration: generation 2 still has build threads.");
  }
  if (st.gens[1].fill > 0) {
    throw new Error("NextGeneration: gen 2 already exists at f0.");
  }
})();

/** 3. THE GLIDE LANDS BEFORE "of" (f59). */
export const LANDING = (() => {
  const f = 62;
  const k0 = kAt(0);
  const kEnd = kAt(LAST);
  const done = (k0 - kAt(f)) / (k0 - kEnd);
  if (done < 0.92) {
    throw new Error(`NextGeneration: the glide is only ${(done * 100).toFixed(0)}% spent at f62.`);
  }
  const P = nodesAt(CUT_OFFSET + f);
  const tip = arrowOf(2, CUT_OFFSET + f);
  return {
    f,
    k: Number(kAt(f).toFixed(4)),
    markScreenPx: Number((MARK * kAt(f)).toFixed(1)),
    peopleScreenY: Number(screenAt(f, CX, PEOPLE_Y).y.toFixed(0)),
    gen1ScreenY: Number(screenAt(f, P[1].x, P[1].y).y.toFixed(0)),
    gen2ScreenY: Number(screenAt(f, P[2].x, P[2].y).y.toFixed(0)),
    gen2TipScreenY: Number(screenAt(f, tip.x1, tip.y1).y.toFixed(0)),
    glideSpent: Number((done * 100).toFixed(1)),
  };
})();

(() => {
  if (LANDING.markScreenPx < 90) {
    throw new Error(`NextGeneration: a mark is only ${LANDING.markScreenPx} screen px at f62.`);
  }
})();

/** 4. THE CAMERA IS SMOOTH AND NEVER PARKED. */
export const CAM_STATS = (() => {
  const P = nodesAt(CUT_OFFSET)[1];
  const v: number[] = [];
  for (let f = 1; f <= LAST; f++) {
    const a = screenAt(f - 1, P.x, P.y);
    const b = screenAt(f, P.x, P.y);
    v.push(Math.hypot(b.x - a.x, b.y - a.y));
  }
  let maxDv = 0;
  let maxDvF = 0;
  for (let i = 1; i < v.length; i++) {
    const d = Math.abs(v[i] - v[i - 1]);
    if (d > maxDv) {
      maxDv = d;
      maxDvF = i + 1;
    }
  }
  return {
    maxDv: Number(maxDv.toFixed(3)),
    maxDvF,
    maxV: Number(Math.max(...v).toFixed(3)),
    minV: Number(Math.min(...v).toFixed(3)),
    meanV: Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(3)),
  };
})();

(() => {
  if (CAM_STATS.maxDv > 2.5) {
    throw new Error(`NextGeneration: the camera's |dv| peaks at ${CAM_STATS.maxDv} px/f^2.`);
  }
  if (CAM_STATS.minV <= 0.01) {
    throw new Error("NextGeneration: the camera comes to a dead stop.");
  }
})();

/** 5. NOTHING BREAKS THE SPEED CAP — and the frame the copy's tip is fastest in
 *  is what the cut brief asks for by name. */
export const SPEED = (() => {
  let copyMax = 0;
  let copyMaxF = 0;
  const w = sched(2).copy;
  for (let G = w[0] + 1; G <= w[1]; G++) {
    const f = G - CUT_OFFSET;
    const a = copyGeom(2, G - 1).g;
    const b = copyGeom(2, G).g;
    const s = Math.hypot(b.x1 - a.x1, b.y1 - a.y1) * kAt(f);
    if (s > copyMax) {
      copyMax = s;
      copyMaxF = f;
    }
  }
  let kMax = 0;
  for (let f = 0; f <= LAST; f++) kMax = Math.max(kMax, kAt(f));
  const packet = PACKET_V * kMax;
  const guide = GUIDE_DRAW_V * kMax;
  const worst = Math.max(copyMax, packet, guide);
  if (worst > SPEED_CAP_SCREEN) {
    throw new Error(`NextGeneration: something moves at ${worst.toFixed(1)} screen px/f.`);
  }
  return {
    copyTipMax: Number(copyMax.toFixed(2)),
    copyTipMaxF: copyMaxF,
    packetMax: Number(packet.toFixed(2)),
    guideHeadMax: Number(guide.toFixed(2)),
  };
})();

/** 6. CAPTION-SAFE on every frame. */
export const INK_BOX = (() => {
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  let y1 = -1e9;
  for (let f = 0; f <= LAST; f++) {
    const b = bounds(CUT_OFFSET + f);
    const a = screenAt(f, b.x0, b.y0);
    const c = screenAt(f, b.x1, b.y1);
    x0 = Math.min(x0, a.x);
    y0 = Math.min(y0, a.y);
    x1 = Math.max(x1, c.x);
    y1 = Math.max(y1, c.y);
  }
  if (x0 < 110 || x1 > 970 || y1 > 1400) {
    throw new Error(
      `NextGeneration: the ink runs to screen x ${x0.toFixed(0)}..${x1.toFixed(
        0,
      )}, y ..${y1.toFixed(0)}.`,
    );
  }
  const b62 = bounds(CUT_OFFSET + 62);
  return {
    x0: Number(x0.toFixed(0)),
    x1: Number(x1.toFixed(0)),
    y0: Number(y0.toFixed(0)),
    y1: Number(y1.toFixed(0)),
    lowestAt62: Number(screenAt(62, b62.x1, b62.y1).y.toFixed(0)),
  };
})();

/** 7. THE WORLD IS DOING WHAT THE SCHEDULE SAYS on this cut's beats. */
(() => {
  const gen2At = (f: number) => stateAt(CUT_OFFSET + f).gens[1];
  if (gen2At(defaultProps.beats.generation).fill < 0.9) {
    throw new Error("NextGeneration: gen 2 is not nearly complete on 'generation'.");
  }
  if (gen2At(defaultProps.beats.models2).copyU <= 0 || gen2At(defaultProps.beats.models2).hasArrow) {
    throw new Error("NextGeneration: the copy is not mid-slide on the second 'models'.");
  }
  if (!gen2At(LAST).hasArrow) {
    throw new Error("NextGeneration: gen 2 does not own its arrow by the end of the cut.");
  }
  // THE CUT DOES NOT RESOLVE: the humans' last through-packets are still on the
  // chain on the final frame, so something is always arriving from below.
  if (throughPackets(2, CUT_OFFSET + LAST).length === 0) {
    throw new Error("NextGeneration: nothing is still travelling on the last frame.");
  }
})();

// ---------------------------------------------------------------------------

const NextGeneration: React.FC<Props> = ({
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
  const cam = runCam3(frame - FIRST, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const G = CUT_OFFSET + frame;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CAM.CX[0]}
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
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <World G={G} k={k} />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default NextGeneration;

export const CAM_AT = (f: number) => camAt(f);

export const BEAT_CHECK = {
  generation: defaultProps.beats.generation,
  of: defaultProps.beats.of,
  end: defaultProps.beats.end,
};

export const STATS = {
  LANDING,
  CAM_STATS,
  SPEED,
  INK_BOX,
  camLift: CAM_LIFT,
  glide: { f0: GLIDE_F0, f1: GLIDE_F1, kOpen: K_OPEN, kLand: K_LAND, cOpen: C_OPEN, cLand: C_LAND },
};
