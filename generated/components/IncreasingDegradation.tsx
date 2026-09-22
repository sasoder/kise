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
  ARROW_BASE,
  CAM_LIFT,
  CUT_OFFSETS,
  FPS,
  INK,
  MARK,
  MARK_R,
  PACKET_V,
  PEOPLE,
  PERSON_H,
  PERSON_INK,
  SPEED_CAP_SCREEN,
  World,
  arrowOf,
  copyGeom,
  lerp,
  nodesAt,
  sched,
  stateAt,
} from "./degradationShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Alignment_Degradation`, cut 3 of five:
// `IncreasingDegradation`. Line (SRT 0:15.300 -> 0:19.100):
//   "And then each subsequent generation actually we see an increasing
//    degradation in alignment,"
//
// THE CLIP'S ONE IDEA: **Alignment is passed on, generation to generation,
// like a copy of a copy. Each generation is made by the one before it and
// inherits its idea of "aligned" — with a little error. Left alone, the errors
// compound and the lineage curls away from what the humans wanted. Corrected
// every generation, it straightens onto the humans' line.**
//
// This cut is THE COMPOUNDING. Cut 2 showed one link being made; here the same
// link is made four times over, each one faster than the last and each one
// landing further off the dashed guide — 4 deg, then 9, then 17, with 28 being
// aimed at as the cut ends. NOTHING IS ADDED FOR IT: the world runs its own
// schedule and this cut is a camera anchored on the humans that gives ground
// upward as the chain grows out of the top of the frame, so that the bend the
// viewer could not see in cut 2 is four generations wide by the last frame and
// the line it bends away from is still pinned to the people who drew it.
//
// VOCABULARY — `degradationShared`'s, imported and never redefined. The world
// is ONE 790-frame timeline; this cut is a window onto G261-367. f0 is not a
// beginning: generation 3 is already 93% filled, the humans' white packets are
// still arriving at it, and gen 2's arrow is the wire it is being built along.
//
// DURATION. 3.800 s of speech (15.300 -> 19.100) x 24 = 91.2 -> 91 frames,
// plus the set's 16-frame tail: DURATION = 91 + 16 = 107. CUT_OFFSET 261, so
// G = 261 + frame, and the cut's last frame is G367.
//
// Word -> frame (24 fps from the cut's in-point):
//   and 0 · then 2 · each 5 · subsequent 11 · generation 18 · actually 33 ·
//   we-see 40 · an 50 · increasing 53 · degradation 61 · in 72 · alignment 80 ·
//   (speech ends 91)
//
// SOUND-OFF READING TEST — one sentence:
//   "the third orange mark finishes and its arrow is copied on, leaning a
//    little off the dashed line; the next one arrives sooner and leans more,
//    and the next sooner still and more again, until the chain is visibly
//    curling away from the line while the camera falls back to hold all of it."
//
// ---------------------------------------------------------------------------
// GESTURES — every one of them is the world's own mechanism, plus two camera
// glides. Nothing was invented for this cut.
//
//  1. f0-7     "and then each"     GEN 3 CLOSES. Its circular fill finishes on
//              (0/2/5)             "each" (G268), with the humans' own white
//                                  packets still arriving at it — they come up
//                                  the humans' arrow and run THROUGH gens 1 and
//                                  2 to get here. This is the LAST generation
//                                  the humans reach at all.
//
//  2. f7-23    "subsequent         THE FIRST VISIBLE ERROR. Gen 2's arrow
//              generation"         duplicates, slides 220 px up its own
//              (11/18)             direction, turns to 4 deg and lands as gen
//                                  3's own — the first deviation from the guide
//                                  a viewer can actually see. It lands on 23,
//                                  five frames after "generation".
//
//  3. f0-51    "actually" (33)     THE HUMANS LET GO. Their last through-packet
//              "an" (50)           was launched at f14.5 and is absorbed into
//                                  gen 3 at f51 — four of them are on the chain
//                                  at f0, three at f23, two at f40, none from
//                                  f52. From "increasing" on there is NOTHING
//                                  of the humans on the chain at all, and that
//                                  is the frame the lean starts to grow.
//
//  4. f22-60   (camera)            GLIDE 1, THE FRAME OPENS FOR GEN 4. k 1.051
//              "we see" (40)       -> 0.938, warp 0.9, with the people's feet
//              "an" (50)           held at screen 1385: the top of the picture
//                                  lifts away from a fixed base so that the
//                                  empty spot gen 4 is being built into comes
//                                  into the band before it exists (screen y 309
//                                  at f0, 355 when it fills at f31-49). Its
//                                  arrow lands f49-63 at 9 deg — twice gen 3's
//                                  lean, on "increasing" (53).
//
//  5. f60-100  (camera)            GLIDE 2, THE PULL-BACK. k 0.938 -> 0.772,
//              "degradation" (61)  cx 543 -> 567, warp 0.85. The zoom is not a
//              "alignment" (80)    choice here, it is FORCED: by "alignment" the
//                                  ink spans 1400 world px and by the last frame
//                                  1499, and 1200 screen px is all the caption
//                                  band has. So the camera gives ground at
//                                  exactly the rate the lineage takes it, and
//                                  every new generation is born at the top of
//                                  the band (gen 5 at 424 on f95, gen 6 at 268
//                                  on f106) while the humans do not move. It
//                                  drifts RIGHT because the chain does.
//
//  6. f69-95   (world)             GEN 5. Fills f69-83, its arrow lands f83-95
//                                  at 17 deg — the lean is now unmistakable,
//                                  and each generation has come faster than the
//                                  one before it (gen 3 is 42 f of fill, gen 4
//                                  is 18, gen 5 is 14, gen 6 is 12).
//
//  7. f99-106  (world)             GEN 6 IS STILL FILLING on the last frame,
//                                  its mask 62% open, its maker's packets still
//                                  running up the wire and the camera still
//                                  creeping. THE CUT DOES NOT RESOLVE.
//
// AMBIENT ONLY: per-element drift, the guide's dashes marching, idle ACCENT
// packets on every standing arrow, the grid's parallax and drift, the camera's
// `sway` and its never-zero creep. No springs, flashes, glows, labels or text.
//
// ---------------------------------------------------------------------------
// THE CAMERA — one keyed track, Gaussian-rounded (sigma 5) and run through
// `runCam3`'s damper, with 40 frames of pre-roll. It is ONE COUPLED MOVE, not
// two keyed ones: the zoom is authored and the vertical is DERIVED from it by
// holding the people's lowest ink on screen y 1390 -> 1378, so the base of the
// picture cannot drift into the caption band and the shot opens upward out of
// it. Authored stages (cx = the world x that lands on screen 540):
//
//   the drift   f-40 -> 46   k -0.009 — already running at f0, hands over to
//                            glide 1 rather than settling before it.
//   GLIDE 1     f22  -> 54   k -> 0.945, warp 0.9
//   GLIDE 2     f56  -> 90   k -> 0.768, cx 540 -> 570, warp 0.85
//   the creep   f86  -> 180  k -0.020, cx +14 — still running on the last frame.
//
// DELIVERED (damped, sway included) as (frame, k, cx, content y):
//   f0   1.0506  540.0  1247.3      f60  0.9382  543.1  1189.1
//   f40  0.9996  543.0  1227.5      f95  0.7717  567.1  1062.4
//                                   f106 0.7658  568.6  1059.7
// Glide 1 is 96%+ spent by f60 and glide 2 by f100 — authored to finish early
// because the damper lags. Screen velocity of a fixed world point: two lobes
// peaking 7.0 px/f, mean 2.77, max |dv| 0.395 px/f^2 (cap 2.5); the camera's own
// motion never drops below 0.377 px/f and is still 0.377 on the last frame.
//
// WHAT THE FRAME HOLDS. On every frame all bright ink — the five people
// included — is inside screen x 211..868 and y 233..1391, so nothing of it is
// ever under a caption and nothing is half out of frame. The guide is the one
// exception, as `bounds` intends: it is INK_LO and runs off the top forever.
// Marks are 92.5 screen px at f0 and 67.4 at f106, both well over the 44 the
// phone test asks for.
//
// TWO THINGS THE BRIEF ASKED FOR THAT THE GEOMETRY WILL NOT GIVE, both
// reported rather than faked:
//   - "the head near screen (600, 760) at f95". The people's foot and gen 6's
//     rim are 1499 world px apart; at the k that fits them in the band that is
//     1157 screen px, so with the feet at 1385 the head is at 262-304. What is
//     at (600, 760) at f95 is gen 3.
//   - "the guide in the left third". The chain's whole sideways travel is 121
//     world px (94 screen px at f95), so the guide and the head cannot be a
//     third of a frame apart. The guide sits at screen x 519 and the head's
//     arrow tip at 600 — 94 px of daylight, 23.5 px at a 270 px downscale,
//     which is what makes the bend readable on a phone.
// ---------------------------------------------------------------------------

export const CUT_OFFSET = CUT_OFFSETS.IncreasingDegradation;
export const DURATION = 107;

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
    each: z.number(),
    subsequent: z.number(),
    generation: z.number(),
    actually: z.number(),
    weSee: z.number(),
    an: z.number(),
    increasing: z.number(),
    degradation: z.number(),
    inWord: z.number(),
    alignment: z.number(),
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
    then: 2,
    each: 5,
    subsequent: 11,
    generation: 18,
    actually: 33,
    weSee: 40,
    an: 50,
    increasing: 53,
    degradation: 61,
    inWord: 72,
    alignment: 80,
    end: 91,
  },
});

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);

const NODES = nodesAt(CUT_OFFSET);

/**
 * THE FRAMING IS SOLVED FOR THE CAPTION BAND, NOT FOR THE HEAD.
 *
 * The first cut of this camera followed the head of the chain up and left the
 * people behind, which put their feet at screen y 1627 at f0 and 1763 at f95 —
 * inside the band the burned-in captions own. The people are bright ink and
 * they are the thing the whole clip is measured against, so they may not sit
 * under a caption and they may not be half out of frame either.
 *
 * So the shot is now anchored at the BOTTOM: the people's lowest ink is held a
 * few px inside 1400 on every frame, and the vertical position is DERIVED from
 * the zoom rather than keyed against it —
 *
 *    C(f) = FOOT_W - (footScreen(f) - 835) / k(f)
 *
 * — which makes the whole cut ONE COUPLED MOVE: the frame opens upward out of
 * a fixed base as the chain grows, because it has to. That is not a
 * compromise, it is the cut's own argument: the humans stay exactly where they
 * were, and it is the lineage that runs away off the top of the picture.
 *
 * THE ZOOM IS FORCED, FRAME BY FRAME. The ink spans FOOT_W down to the top of
 * whatever exists, so k may never be more than 1200 / that span (the band is
 * 200..1400). The span, and the ceiling it imposes:
 *    f0   852 px (gen 3's rim)          k <= 1.408
 *    f31 1071 px (gen 4's rim)          k <= 1.120
 *    f49 1187 px (gen 4's arrow tip)    k <= 1.011
 *    f69 1289 px (gen 5's rim)          k <= 0.931
 *    f83 1400 px (gen 5's arrow tip)    k <= 0.857
 *    f99 1499 px (gen 6's rim)          k <= 0.800
 * The track below sits under that ceiling on every frame with margin, and
 * `INK_BOX` proves it against the real ink rather than against this table.
 */
const K_OPEN = 1.05;
const K_MID = 0.945;
const K_LAND = 0.768;

/** The world y of the lowest ink in the cut: the outermost person's foot. */
const FOOT_W = Math.max(...PEOPLE.map((p) => p.y)) + (PERSON_H * PERSON_INK) / 2;
/** Where that foot is asked to sit, screen px. It rises 12 px across the cut —
 *  the bottom is anchored, not nailed down. */
const FOOT_OPEN = 1390;
const FOOT_END = 1378;
const FOOT_F1 = 150;
const footScreen = (f: number) => lerp(FOOT_OPEN, FOOT_END, seg(f, FIRST, FOOT_F1));

const CX_OPEN = 540;
/** The camera drifts right by as much as the chain does — 30 world px, which is
 *  what separates gen 5's arrow tip from the guide. The chain is only 121 world
 *  px wide at gen 6, so this is the whole sideways move there is to make. */
const CX_LAND = 570;

/** THE PRE-ROLL IS NOT A SETTLE, IT IS A DRIFT THAT IS ALREADY RUNNING. A
 *  camera that has finished settling by f0 and then waits 20 frames for its
 *  first glide is parked for the whole of "and then each subsequent" — measured
 *  at 0.1 screen px/f on a fixed point, which is a still frame. This one is
 *  climbing slowly from 40 frames before the cut and does not stop climbing:
 *  the drift is at its fastest around f0 and hands over to glide 1. */
const DRIFT_F1 = 46;
const DRIFT_K = 0.009;
const DRIFT_AT_0 = seg(0, FIRST, DRIFT_F1);

const G1_F0 = 22;
const G1_F1 = 54;
const G2_F0 = 56;
const G2_F1 = 90;
const CREEP_F0 = 86;
const CREEP_F1 = 180;
const CREEP_K = 0.02;
const CREEP_X = 14;

/** Each stage LERPS to its own absolute target rather than subtracting a delta,
 *  so the drift running underneath glide 1 cannot shift where glide 1 lands. */
const kOf = (f: number) => {
  let k = K_OPEN + DRIFT_K * (DRIFT_AT_0 - seg(f, FIRST, DRIFT_F1));
  k = lerp(k, K_MID, seg(f, G1_F0, G1_F1, 0.9));
  k = lerp(k, K_LAND, seg(f, G2_F0, G2_F1, 0.85));
  return k - CREEP_K * seg(f, CREEP_F0, CREEP_F1, 0.9);
};

/** ...and the vertical rides on it, so the base cannot drift into the band. */
const contentYOf = (f: number) => FOOT_W - (footScreen(f) - 835) / kOf(f);

const cxOf = (f: number) =>
  lerp(CX_OPEN, CX_LAND, seg(f, G2_F0, G2_F1, 0.85)) +
  CREEP_X * seg(f, CREEP_F0, CREEP_F1, 0.9);

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
  const x = hold(cxOf);
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({ f: f - FIRST, k: gauss(kk, f), x: gauss(x, f), y: gauss(y, f) });
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
  if (CUT_OFFSET !== 261 || DURATION !== Math.round(3.8 * 24) + 16) {
    throw new Error("IncreasingDegradation: the cut's offset or duration is not the clip's.");
  }
})();

/** 2. F0 IS MID-BUILD. Gen 3 is part-filled, gen 2 owns the arrow it is being
 *  built along, and gen 4 does not exist yet. Whether the humans' help reaches
 *  it as threads or as packets running up through gens 1 and 2 is the world's
 *  business, not this cut's — it is not asserted here. */
export const F0_STATE = (() => {
  const st = stateAt(CUT_OFFSET);
  const g3 = st.gens[2];
  if (g3.fill <= 0.05 || g3.fill >= 0.999) {
    throw new Error(`IncreasingDegradation: gen 3 is ${g3.fill.toFixed(3)} filled at f0.`);
  }
  if (!st.gens[1].hasArrow || st.gens[3].fill > 0) {
    throw new Error("IncreasingDegradation: the world at f0 is not what the schedule says.");
  }
  return {
    gen3Fill: Number(g3.fill.toFixed(3)),
    gen3ThreadOpacity: Number(g3.threads.opacity.toFixed(3)),
  };
})();

/** 3. THE FOUR LANDINGS ARE THE CUT'S SPINE, and each one leans further off
 *  the guide than the last. */
export const LINEAGE = (() => {
  const rows: { n: number; fillDone: number; arrowLands: number; deg: number }[] = [];
  for (const n of [3, 4, 5, 6]) {
    const s = sched(n);
    rows.push({
      n,
      fillDone: s.fill[1] - CUT_OFFSET,
      arrowLands: s.copy[1] - CUT_OFFSET,
      deg: [0, 0.5, 1.5, 4, 9, 17, 28][n],
    });
  }
  if (rows[0].fillDone !== 7 || rows[0].arrowLands !== 23) {
    throw new Error("IncreasingDegradation: gen 3 does not close and land where the brief says.");
  }
  if (rows[1].arrowLands !== 63 || rows[2].arrowLands !== 95) {
    throw new Error("IncreasingDegradation: gens 4 and 5 do not land where the brief says.");
  }
  const last = stateAt(CUT_OFFSET + LAST).gens[5];
  if (last.fill <= 0 || last.fill >= 0.95) {
    throw new Error(
      `IncreasingDegradation: gen 6 is ${last.fill.toFixed(3)} filled on the last frame — the cut resolves.`,
    );
  }
  return { rows, gen6FillAtLast: Number(last.fill.toFixed(3)) };
})();

/** 4. THE CAMERA IS SMOOTH AND NEVER PARKED.
 *  SMOOTH is measured the way the rest of the set measures it: the screen
 *  velocity of a FIXED world point (gen 4's node, the thing glide 1 is solved
 *  for) and the frame-to-frame change in it.
 *  NEVER PARKED cannot be read off one point in a shot that rises AND pulls
 *  back: a rise carries a point down the screen while the widening zoom carries
 *  it back toward the centre, and there are frames where those two cancel
 *  exactly at one particular world y. So the park test is on the CAMERA's own
 *  state — how far it travels and how much it opens per frame — which is zero
 *  only when the shot is actually dead. */
export const CAM_STATS = (() => {
  const P = NODES[4];
  const v: number[] = [];
  const m: number[] = [];
  for (let f = 1; f <= LAST; f++) {
    const a = screenAt(f - 1, P.x, P.y);
    const b = screenAt(f, P.x, P.y);
    v.push(Math.hypot(b.x - a.x, b.y - a.y));
    const c0 = camAt(f - 1);
    const c1 = camAt(f);
    m.push(
      Math.hypot(c1.cx - c0.cx, c1.cy - c0.cy) * c1.k + Math.abs(c1.k - c0.k) * (WORLD_H / 2),
    );
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
    minCameraMotion: Number(Math.min(...m).toFixed(3)),
    lastCameraMotion: Number(m[m.length - 1].toFixed(3)),
  };
})();

(() => {
  if (CAM_STATS.maxDv > 2.5) {
    throw new Error(`IncreasingDegradation: the camera's |dv| peaks at ${CAM_STATS.maxDv} px/f^2.`);
  }
  if (CAM_STATS.minCameraMotion <= 0.05 || CAM_STATS.lastCameraMotion <= 0.2) {
    throw new Error(
      `IncreasingDegradation: the camera parks (min motion ${CAM_STATS.minCameraMotion}, last ${CAM_STATS.lastCameraMotion}).`,
    );
  }
})();

/** 5. THE GLIDES LAND WHERE THE BRIEF ASKS: glide 1 by f60, glide 2 by f100,
 *  measured on the delivered (damped) camera rather than on the authored one. */
export const GLIDES = (() => {
  const spent = (f: number, from: number, to: number) => (kAt(f) - from) / (to - from);
  const g1 = spent(60, kAt(0), K_MID);
  const g2 = (kAt(100) - K_MID) / (kAt(LAST) - K_MID);
  if (g1 < 0.9) {
    throw new Error(`IncreasingDegradation: glide 1 is only ${(g1 * 100).toFixed(0)}% spent at f60.`);
  }
  if (g2 < 0.9) {
    throw new Error(`IncreasingDegradation: glide 2 is only ${(g2 * 100).toFixed(0)}% spent at f100.`);
  }
  return {
    g1SpentAt60: Number((g1 * 100).toFixed(1)),
    g2SpentAt100: Number((g2 * 100).toFixed(1)),
    k0: Number(kAt(0).toFixed(4)),
    k60: Number(kAt(60).toFixed(4)),
    k95: Number(kAt(95).toFixed(4)),
    kLast: Number(kAt(LAST).toFixed(4)),
  };
})();

/** 6. NOTHING BREAKS THE SPEED CAP — the three arrow copies that land inside
 *  this cut, the packets, and the camera's own pull on a fixed point. */
export const SPEED = (() => {
  let copyMax = 0;
  let copyMaxF = 0;
  let copyMaxN = 0;
  for (const n of [3, 4, 5, 6]) {
    const w = sched(n).copy;
    for (let G = w[0] + 1; G <= w[1]; G++) {
      const f = G - CUT_OFFSET;
      if (f < 0 || f > LAST) continue;
      const a = copyGeom(n, G - 1).g;
      const b = copyGeom(n, G).g;
      const s = Math.hypot(b.x1 - a.x1, b.y1 - a.y1) * kAt(f);
      if (s > copyMax) {
        copyMax = s;
        copyMaxF = f;
        copyMaxN = n;
      }
    }
  }
  let kMax = 0;
  for (let f = 0; f <= LAST; f++) kMax = Math.max(kMax, kAt(f));
  const packet = PACKET_V * kMax;
  const worst = Math.max(copyMax, packet, CAM_STATS.maxV);
  if (worst > SPEED_CAP_SCREEN) {
    throw new Error(`IncreasingDegradation: something moves at ${worst.toFixed(1)} screen px/f.`);
  }
  return {
    copyTipMax: Number(copyMax.toFixed(2)),
    copyTipMaxF: copyMaxF,
    copyTipMaxGen: copyMaxN,
    packetMax: Number(packet.toFixed(2)),
    cameraMax: CAM_STATS.maxV,
  };
})();

/** 7. EVERY PIECE OF BRIGHT INK IS CAPTION-SAFE ON EVERY FRAME — the five
 *  people included, which is what this camera is solved for. The box takes the
 *  people's ink (0.84 of their box, plus their own <= 2.2 px drift), every mark
 *  that has begun to fill, every standing arrow and the copy mid-slide. The
 *  guide is excluded, as `bounds` excludes it: it is INK_LO and runs off the
 *  top of the frame by design. */
const PERSON_INK_H = PERSON_H * PERSON_INK;
const inkBox = (f: number) => {
  const G = CUT_OFFSET + f;
  const st = stateAt(G);
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  let y1 = -1e9;
  const put = (wx: number, wy: number) => {
    const s = screenAt(f, wx, wy);
    x0 = Math.min(x0, s.x);
    x1 = Math.max(x1, s.x);
    y0 = Math.min(y0, s.y);
    y1 = Math.max(y1, s.y);
  };
  for (const p of PEOPLE) {
    put(p.x - PERSON_INK_H / 2 - 2.2, p.y - PERSON_INK_H / 2 - 2.2);
    put(p.x + PERSON_INK_H / 2 + 2.2, p.y + PERSON_INK_H / 2 + 2.2);
  }
  {
    const a = arrowOf(0, G);
    put(a.x0, a.y0);
    put(a.x1, a.y1);
  }
  for (const gen of st.gens) {
    if (gen.fill > 0) {
      put(gen.node.x - MARK_R, gen.node.y - MARK_R);
      put(gen.node.x + MARK_R, gen.node.y + MARK_R);
    }
    if (gen.hasArrow) {
      const a = arrowOf(gen.n, G);
      put(a.x0, a.y0);
      put(a.x1, a.y1);
    }
    if (gen.copying) {
      const c = copyGeom(gen.n, G).g;
      put(c.x0, c.y0);
      put(c.x1, c.y1);
    }
  }
  return { x0, x1, y0, y1 };
};

export const INK_BOX = (() => {
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  let y1 = -1e9;
  let lowF = 0;
  let highF = 0;
  for (let f = 0; f <= LAST; f++) {
    const b = inkBox(f);
    x0 = Math.min(x0, b.x0);
    x1 = Math.max(x1, b.x1);
    if (b.y0 < y0) {
      y0 = b.y0;
      highF = f;
    }
    if (b.y1 > y1) {
      y1 = b.y1;
      lowF = f;
    }
  }
  if (x0 < 110 || x1 > 970 || y0 < 200 || y1 > 1400) {
    throw new Error(
      `IncreasingDegradation: bright ink runs to screen x ${x0.toFixed(0)}..${x1.toFixed(
        0,
      )}, y ${y0.toFixed(0)} (f${highF})..${y1.toFixed(0)} (f${lowF}).`,
    );
  }
  return {
    x0: Number(x0.toFixed(0)),
    x1: Number(x1.toFixed(0)),
    y0: Number(y0.toFixed(0)),
    y1: Number(y1.toFixed(0)),
    highestAtF: highF,
    lowestAtF: lowF,
  };
})();

/** 8. THE GUIDE IS IN FRAME ON EVERY FRAME — it is what the bend is read
 *  against, so it may never leave the picture. */
export const GUIDE_X = (() => {
  let lo = 1e9;
  let hi = -1e9;
  for (let f = 0; f <= LAST; f++) {
    const x = screenAt(f, ARROW_BASE.x, 0).x;
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
  }
  if (lo < 60 || hi > 1020) {
    throw new Error(`IncreasingDegradation: the guide leaves the frame (x ${lo}..${hi}).`);
  }
  return { min: Number(lo.toFixed(1)), max: Number(hi.toFixed(1)) };
})();

/** 9. WHAT THE CUT IS ACTUALLY FRAMED ON at f95 — the frame the brief asks to
 *  be measured, plus the head's read at a 270 px downscale. */
export const F95 = (() => {
  const f = 95;
  const G = CUT_OFFSET + f;
  const k = kAt(f);
  const tip = arrowOf(5, G);
  const box = inkBox(f);
  const gen = (n: number) => {
    const s = screenAt(f, NODES[n].x, NODES[n].y);
    return { x: Number(s.x.toFixed(0)), y: Number(s.y.toFixed(0)) };
  };
  return {
    k: Number(k.toFixed(4)),
    markScreenPx: Number((MARK * k).toFixed(1)),
    guideScreenX: Number(screenAt(f, ARROW_BASE.x, 0).x.toFixed(1)),
    gen3: gen(3),
    gen4: gen(4),
    gen5: gen(5),
    gen6Spot: gen(6),
    gen5TipScreen: {
      x: Number(screenAt(f, tip.x1, tip.y1).x.toFixed(0)),
      y: Number(screenAt(f, tip.x1, tip.y1).y.toFixed(0)),
    },
    /** how far the head of the chain is off the guide, on screen and at 270 px */
    headOffGuidePx: Number((screenAt(f, NODES[6].x, 0).x - screenAt(f, ARROW_BASE.x, 0).x).toFixed(1)),
    headOffGuideAt270: Number(
      (((screenAt(f, NODES[6].x, 0).x - screenAt(f, ARROW_BASE.x, 0).x) * 270) / 1080).toFixed(1),
    ),
    ink: {
      x0: Number(box.x0.toFixed(0)),
      x1: Number(box.x1.toFixed(0)),
      y0: Number(box.y0.toFixed(0)),
      y1: Number(box.y1.toFixed(0)),
    },
  };
})();

(() => {
  if (F95.markScreenPx < 44) {
    throw new Error(`IncreasingDegradation: a mark is only ${F95.markScreenPx} screen px at f95.`);
  }
})();

/** 10. THE BASE — where the humans and the first two generations sit. They are
 *  the anchor this camera is solved for: the people's lowest ink is held just
 *  inside the caption band all the way through, and what moves is the top of
 *  the picture opening away from them. */
export const TAIL = (() => {
  const footY = Math.max(...PEOPLE.map((p) => p.y)) + (PERSON_H * PERSON_INK) / 2;
  const headY = Math.min(...PEOPLE.map((p) => p.y)) - (PERSON_H * PERSON_INK) / 2;
  const at = (f: number) => ({
    f,
    peopleHeadTop: Number(screenAt(f, 540, headY).y.toFixed(0)),
    peopleFoot: Number(screenAt(f, 540, footY).y.toFixed(0)),
    gen1: Number(screenAt(f, NODES[1].x, NODES[1].y).y.toFixed(0)),
    gen2: Number(screenAt(f, NODES[2].x, NODES[2].y).y.toFixed(0)),
  });
  return [at(0), at(53), at(95), at(LAST)];
})();

// ---------------------------------------------------------------------------

const IncreasingDegradation: React.FC<Props> = ({
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

export default IncreasingDegradation;

export const CAM_AT = (f: number) => camAt(f);

export const STATS = {
  LINEAGE,
  CAM_STATS,
  GLIDES,
  SPEED,
  INK_BOX,
  GUIDE_X,
  F95,
  TAIL,
  camLift: CAM_LIFT,
  knots: {
    footW: Number(FOOT_W.toFixed(3)),
    footScreen: { open: FOOT_OPEN, end: FOOT_END },
    drift: { f0: FIRST, f1: DRIFT_F1, dK: -DRIFT_K },
    glide1: { f0: G1_F0, f1: G1_F1, k: K_MID, cx: CX_OPEN },
    glide2: { f0: G2_F0, f1: G2_F1, k: K_LAND, cx: CX_LAND },
    creep: { f0: CREEP_F0, f1: CREEP_F1, dK: -CREEP_K, dCx: CREEP_X },
    delivered: [0, 40, 60, 95, LAST].map((f) => ({
      f,
      k: Number(camAt(f).k.toFixed(4)),
      cx: Number(camAt(f).cx.toFixed(1)),
      cy: Number((camAt(f).cy - CAM_LIFT / camAt(f).k).toFixed(1)),
    })),
  },
};
