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
  INK,
  MARK,
  MARK_R,
  PACKET_V,
  PERSON_H,
  PERSON_INK,
  PEOPLE_Y,
  SPEED_CAP_SCREEN,
  THETA,
  World,
  arrowOf,
  bounds,
  copyGeom,
  deviationAt,
  nodesAt,
  sched,
  stateAt,
} from "./degradationShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Alignment_Degradation`, cut 4 of five:
// `MisalignmentFromHumans`.
// Line (SRT 0:25.940 -> 0:29.800):
//   "in the long run they end up going in a direction of increasing
//    misalignment from humans."
//
// THE CLIP'S ONE IDEA: **Alignment is passed on, generation to generation,
// like a copy of a copy. Each generation is made by the one before it and
// inherits its idea of "aligned" — with a little error. Left alone the errors
// compound and the lineage curls away from what the humans wanted; corrected
// every generation, it straightens onto the humans' line.**
//
// THIS CUT IS THE LONG RUN. It is a WINDOW onto the shared world — nothing is
// keyed to this cut, nothing is invented for it, not one element is added. The
// world goes on building generations 8, 9 and 10 exactly as the schedule says;
// all this cut does is CHOOSE WHERE THE CAMERA IS, and it makes one choice:
// start close on the head of the chain while it keeps curling over, then pull
// all the way back so the whole spiral AND the five humans at its base are in
// one frame. The distance between the humans' arrow — still pointing straight
// up its guide — and the head's arrow, now pointing flat right, IS "increasing
// misalignment from humans". The line's argument is a framing, so the framing
// is the gesture.
//
// DURATION. 3.860 s of speech x 24 = 92.64 -> 93 frames, plus the set's
// 16-frame tail: DURATION = 93 + 16 = 109. CUT_OFFSET 516, so G = 516 + frame,
// and f0 is not a beginning: gen 7's arrow landed 2 frames ago (G514) and gen
// 8's build packets set off on this very frame (G516).
//
// Word -> frame (24 fps from the cut's in-point):
//   in-the 0 · long 9 · run 14 · they 20 · end-up 26 · going 30 · in-a 33 ·
//   direction 40 · of 52 · increasing 62 · misalignment 73 · from 82 ·
//   humans 89 · (speech ends 93)
//
// SOUND-OFF READING TEST — one sentence:
//   "three more orange marks are built off the end of a chain that is bending
//    further right each time, and then the camera pulls back far enough to
//    show that the chain started at five people whose own arrow is still
//    pointing straight up a dotted line the chain left long ago."
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous movement. Two of them are the camera; the other
// three are the world's own mechanism, which this cut only watches. Nothing
// is added: no new element type, no new mechanism, no label.
//
//  1. f0-36    "in the long run     GENERATION 8. The build is already running
//              they end up"         when the cut opens — ACCENT packets at the
//              (0/9/14/20/26)       build rate on gen 7's arrow, landing in an
//                                   empty spot — the mark fills f4-24 at its
//                                   MAKER'S tone, and gen 7's arrow is copied
//                                   up onto it f24-36, turning to 58 deg. "end
//                                   up" (26) lands mid-copy.
//
//  2. f6-50    (camera)             THE TRACK. One glide with the head as it
//              "going in a"         curls away: k 0.85 -> 0.80, 152 world px
//              (30/33)              right and 99 up, warp 0.9, so gen 9 arrives
//                                   on the same screen y 600 gen 8 opened on.
//                                   The head still outruns the camera — it ends
//                                   the glide right of centre, which is the
//                                   line's "going in a direction" before the
//                                   word.
//
//  3. f40-68   "direction"          GENERATION 9. Fills f40-56, arrow lands
//              (40)                 f56-68 at 74 deg: the head's arrow is now
//                                   pointing more sideways than up. The word
//                                   lands on the frame its build starts.
//
//  4. f50-92   (camera)             THE PULL-BACK — THE CUT'S ONE BIG MOVE.
//              "of increasing       k 0.80 -> 0.572, content y +701, warp 0.75
//              misalignment from    so the speed is early; measured, 96% spent
//              humans"              by f84, five frames before "humans" (89),
//              (52/62/73/82/89)     then a decaying creep that is still pulling
//                                   out a hair on the last frame. The frame
//                                   opens from eight marks running off both
//                                   ends of it to ALL TEN plus the guide, the
//                                   humans' arrow and the five people — the
//                                   first time in the clip anyone sees both
//                                   ends of the lineage at once. Solved for
//                                   the module's own
//                                   `bounds`: the whole box lands inside screen
//                                   x 110..970, y 200..1400, people's centres
//                                   at screen y 1326, marks 50.3 px.
//
//  5. f72-96   "misalignment"       GENERATION 10. Fills f72-84 and its arrow
//              (73)                 lands f84-96 at 88 deg — flat right, a full
//                                   quarter turn off the humans' line, landing
//                                   inside the reveal.
//
//  6. f96-108  (tail)               The hold: ten idle ACCENT streams, the white
//                                   one on the humans' arrow, the dashes still
//                                   marching up a guide nothing is on any more,
//                                   and the camera still creeping out. NOTHING
//                                   IS CORRECTED — that is cut 5's line. THE CUT
//                                   DOES NOT RESOLVE.
//
// AMBIENT ONLY: per-element drift, marching dashes, idle packets on every
// standing arrow, the grid's parallax and drift, the camera's `sway` and its
// never-zero creep. No springs, flashes, glows, labels or text.
//
// ---------------------------------------------------------------------------
// THE CAMERA — one keyed track as a sum of eased segments, Gaussian-rounded,
// through `camKnots3` / `runCam3`, with 40 frames of pre-roll so the shot is
// already moving on f0. This is the first cut of the clip whose camera PANS as
// well as zooms, so cx is keyed per frame like k and the content y, and the
// grid is given cx/cxRest so the sideways travel reads as depth.
//
//   the pre-roll   f-40 -> 6    content y -12, k -0.006 — the tail of cut 3's
//                               own creep, so f0 is mid-move, not a start.
//   THE TRACK      f6 -> 50     cx 747.6 -> 900, content y 238.1 -> 138.8,
//                               k -> 0.80, warp 0.9. Slow: 3.6 screen px/f.
//   THE PULL-BACK  f50 -> 80    cx -> 851.3, content y -> 840.1, k -> 0.572, warp
//                               0.75. Authored to finish at f80 because the
//                               damper lags ~6 f: measured 96.4% spent at f84.
//   the creep      f86 -> 210   content y +26, k -0.010. Still running at f108.
//
// THE WIDE FRAME IS SOLVED, NOT GUESSED, and it is SMALLER than the brief's
// estimate of k 0.62-0.65 for one measurable reason: `bounds(624)` is 1241.8 x
// 2034.1 world px (the people's feet at y 1774.5 to gen 10's mark top at
// y -259.6), and the caption-safe band is 860 x 1200 screen px. Height is the
// binding constraint at k <= 0.590; 0.572 is that with the settle overshoot and
// the camera's own sway paid for, and it is what puts the people's glyph
// centres on screen y 1326 (the brief asked for ~1330). A mark is 50.3 screen
// px there — comfortably over the 44 px floor the brief sets — so nothing had
// to be traded against mark size.
// ---------------------------------------------------------------------------

export const CUT_OFFSET = CUT_OFFSETS.MisalignmentFromHumans;
export const DURATION = 109;

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
    inThe: z.number(),
    long: z.number(),
    run: z.number(),
    they: z.number(),
    endUp: z.number(),
    going: z.number(),
    inA: z.number(),
    direction: z.number(),
    of: z.number(),
    increasing: z.number(),
    misalignment: z.number(),
    from: z.number(),
    humans: z.number(),
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
    inThe: 0,
    long: 9,
    run: 14,
    they: 20,
    endUp: 26,
    going: 30,
    inA: 33,
    direction: 40,
    of: 52,
    increasing: 62,
    misalignment: 73,
    from: 82,
    humans: 89,
    end: 93,
  },
});

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);

/** The world, resolved at this cut's last frame: every generation standing,
 *  nothing corrected. Every number below is read off it. */
const P_END = nodesAt(CUT_OFFSET + LAST);
const BOX = bounds(CUT_OFFSET + LAST);

// --- the open: the head of the chain, close ---------------------------------
const K_OPEN = 0.85;
/** THE HEAD IS THE TOP OF THE FRAME, NOT ITS MIDDLE. Gen 8's empty spot — where
 *  the cut's first build lands — sits on screen (620, 600), which the brief
 *  suggested at (620, 760). 600 is the measured fix for a first frame that was
 *  bottom-heavy: at 760 the top 40% of the frame was empty grid and gens 1-4
 *  were under the caption band or off the bottom, so the ink's centre of mass
 *  sat at screen y ~1150 against the set's 835. Lifted, f0 stands FIVE marks
 *  (gens 4-8 at y 1268 / 1083 / 904 / 739 / 600) in the safe band with the tail
 *  still running off the bottom, and it leaves 400 px of headroom for gens 9
 *  and 10 to climb into — which is the only direction this chain is going. */
const HEAD_SCREEN_Y = 600;
/** Sideways the same correction, measured the same way: the brief's 620 put the
 *  chain's ink at screen x 270..600, 105 px left of the frame's axis, with the
 *  whole right half empty. 680 puts it at 330..660 — centred on 495, the same
 *  45 px of lead room the frame has at the end of the glide, so the two ends of
 *  the move are composed alike and the empty space ahead of the head is deliberate
 *  rather than accidental. */
const CX_OPEN = P_END[8].x - (680 - 540) / K_OPEN;
const C_OPEN = P_END[8].y - (HEAD_SCREEN_Y - 835) / K_OPEN;

// --- the track: with the head as it curls right and up ----------------------
const K_TRACK = 0.8;
const CX_TRACK = 900;
/** THE HEAD KEEPS ITS SCREEN HEIGHT: gen 9, which is the head by the end of the
 *  glide, arrives on the same screen y 600 gen 8 opened on. That is what makes
 *  the move read as tracking rather than as a tilt — the frame is held on the
 *  end of the chain while the chain grows out from under it, and six marks are
 *  standing in the band when the pull-back starts. */
const C_TRACK = P_END[9].y - (HEAD_SCREEN_Y - 835) / K_TRACK;

// --- the wide frame: SOLVED on the module's own bounds ----------------------
/** The top of the box (gen 10's mark) on screen y 206, its feet on 1369. */
const WIDE_TOP = 206;
const K_WIDE = 0.572;
const CX_WIDE = (BOX.x0 + BOX.x1) / 2;
const C_WIDE = BOX.y0 - (WIDE_TOP - 835) / K_WIDE;

const TRACK_F0 = 6;
const TRACK_F1 = 50;
const PULL_F0 = 50;
const PULL_F1 = 80;
const CREEP_F0 = 86;
const CREEP_F1 = 210;

const contentYOf = (f: number) =>
  C_OPEN +
  12 * (1 - seg(f, FIRST, TRACK_F0, 1.3)) -
  (C_OPEN - C_TRACK) * seg(f, TRACK_F0, TRACK_F1, 0.9) -
  (C_TRACK - C_WIDE) * seg(f, PULL_F0, PULL_F1, 0.75) +
  26 * seg(f, CREEP_F0, CREEP_F1, 0.9);

const kOf = (f: number) =>
  K_OPEN +
  0.006 * (1 - seg(f, FIRST, TRACK_F0, 1.3)) -
  (K_OPEN - K_TRACK) * seg(f, TRACK_F0, TRACK_F1, 0.9) -
  (K_TRACK - K_WIDE) * seg(f, PULL_F0, PULL_F1, 0.75) -
  0.01 * seg(f, CREEP_F0, CREEP_F1, 0.9);

const cxOf = (f: number) =>
  CX_OPEN +
  (CX_TRACK - CX_OPEN) * seg(f, TRACK_F0, TRACK_F1, 0.9) +
  (CX_WIDE - CX_TRACK) * seg(f, PULL_F0, PULL_F1, 0.75);

/** The Gaussian the set runs before the damper: no lag of its own, it only
 *  rounds curvature so the damper is handed a C2 target. */
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
  const xx = hold(cxOf);
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({ f: f - FIRST, k: gauss(kk, f), x: gauss(xx, f), y: gauss(y, f) });
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
  if (CUT_OFFSET !== 516 || DURATION !== Math.round(3.86 * 24) + 16) {
    throw new Error("MisalignmentFromHumans: the cut's offset or duration is not the clip's.");
  }
})();

/** 2. F0 IS CUT 3'S STANDING PICTURE, AND THE NEXT BUILD IS ON THIS FRAME.
 *  Seven generations stand, gen 7 owns its 42 deg arrow, gen 8 does not exist
 *  yet, and gen 8's build packets set off at G516 = f0 exactly. */
(() => {
  const st = stateAt(CUT_OFFSET);
  for (let i = 0; i < 7; i++) {
    if (st.gens[i].fill < 0.999 || !st.gens[i].hasArrow) {
      throw new Error(`MisalignmentFromHumans: gen ${i + 1} is not standing at f0.`);
    }
  }
  if (st.gens[7].fill > 0) {
    throw new Error("MisalignmentFromHumans: gen 8 already exists at f0.");
  }
  if (sched(8).packets !== CUT_OFFSET) {
    throw new Error("MisalignmentFromHumans: gen 8's build does not start on f0.");
  }
  if (Math.abs(deviationAt(7, CUT_OFFSET) - 42) > 1e-9) {
    throw new Error("MisalignmentFromHumans: gen 7's arrow is not 42 deg off at f0.");
  }
})();

/** 3. THE PULL-BACK LANDS BEFORE "humans" (f89) — and the frame it is solved
 *  for is the widest frame of the whole clip. */
export const LANDING = (() => {
  const f = 84;
  const k0 = kAt(PULL_F0);
  const kEnd = kAt(LAST);
  const done = (k0 - kAt(f)) / (k0 - kEnd);
  if (done < 0.95) {
    throw new Error(
      `MisalignmentFromHumans: the pull-back is only ${(done * 100).toFixed(0)}% spent at f84.`,
    );
  }
  const markPx = MARK * kAt(LAST);
  if (markPx < 44) {
    throw new Error(`MisalignmentFromHumans: a mark is only ${markPx.toFixed(1)} px on the wide.`);
  }
  return {
    f,
    spentAt84: Number((done * 100).toFixed(1)),
    kOpen: Number(kAt(0).toFixed(4)),
    kTrackEnd: Number(kAt(TRACK_F1).toFixed(4)),
    kAt84: Number(kAt(f).toFixed(4)),
    kLast: Number(kAt(LAST).toFixed(4)),
    markScreenPx: Number(markPx.toFixed(1)),
    personScreenPx: Number((PERSON_H * PERSON_INK * kAt(LAST)).toFixed(1)),
    peopleScreenY: Number(screenAt(LAST, 540, PEOPLE_Y).y.toFixed(0)),
    gen10Screen: [
      Number(screenAt(LAST, P_END[10].x, P_END[10].y).x.toFixed(0)),
      Number(screenAt(LAST, P_END[10].x, P_END[10].y).y.toFixed(0)),
    ],
    guideScreenX: Number(screenAt(LAST, 540, 0).x.toFixed(0)),
  };
})();

/** 4. THE CAMERA IS SMOOTH AND NEVER PARKED. Measured on gen 8's mark, the
 *  world point the cut opens on and ends holding. */
export const CAM_STATS = (() => {
  const pt = P_END[8];
  const v: number[] = [];
  for (let f = 1; f <= LAST; f++) {
    const a = screenAt(f - 1, pt.x, pt.y);
    const b = screenAt(f, pt.x, pt.y);
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
    throw new Error(`MisalignmentFromHumans: the camera's |dv| peaks at ${CAM_STATS.maxDv}.`);
  }
  if (CAM_STATS.minV <= 0.01) {
    throw new Error("MisalignmentFromHumans: the camera comes to a dead stop.");
  }
})();

/** 5. NOTHING BREAKS THE SPEED CAP — the three arrow copies' tips, the packets,
 *  and the fastest world point the pull-back drags across the frame (the
 *  people, which travel furthest because they are furthest from the zoom's
 *  centre when the frame opens). */
export const SPEED = (() => {
  let copyMax = 0;
  let copyMaxF = 0;
  let copyMaxN = 0;
  for (const n of [8, 9, 10]) {
    const w = sched(n).copy;
    for (let G = w[0] + 1; G <= w[1]; G++) {
      const f = G - CUT_OFFSET;
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
  // Camera-induced: the screen speed of the world's four extreme fixed points.
  let dragged = 0;
  let draggedF = 0;
  const probes: [number, number][] = [
    [540, PEOPLE_Y],
    [P_END[1].x, P_END[1].y],
    [BOX.x0, BOX.y1],
    [P_END[10].x, P_END[10].y],
  ];
  for (const [wx, wy] of probes) {
    for (let f = 1; f <= LAST; f++) {
      const a = screenAt(f - 1, wx, wy);
      const b = screenAt(f, wx, wy);
      const s = Math.hypot(b.x - a.x, b.y - a.y);
      if (s > dragged) {
        dragged = s;
        draggedF = f;
      }
    }
  }
  const worst = Math.max(copyMax, packet, dragged);
  if (worst > SPEED_CAP_SCREEN) {
    throw new Error(`MisalignmentFromHumans: something moves at ${worst.toFixed(1)} screen px/f.`);
  }
  return {
    copyTipMax: Number(copyMax.toFixed(2)),
    copyTipMaxF: copyMaxF,
    copyTipMaxGen: copyMaxN,
    packetMax: Number(packet.toFixed(2)),
    draggedMax: Number(dragged.toFixed(2)),
    draggedMaxF: draggedF,
  };
})();

/** 6. CAPTION-SAFE. Two different promises, because the cut is a close-up that
 *  becomes a wide: THE SUBJECT (every mark from gen 6 up, and the arrow it
 *  owns, plus any copy in mid-slide) is inside x 110..970 / y 200..1400 on
 *  EVERY frame; and from the landing (f84) to the end THE WHOLE WORLD is.
 *  Below the landing the chain's tail runs off the bottom of the frame on
 *  purpose — that is what "the long run" looks like from the head of it. */
export const INK_BOX = (() => {
  const subject = (f: number) => {
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
    for (const g of st.gens) {
      if (g.n < 6) continue;
      if (g.fill > 0.05) {
        put(g.node.x - MARK_R, g.node.y - MARK_R);
        put(g.node.x + MARK_R, g.node.y + MARK_R);
      }
      if (g.hasArrow) {
        const a = arrowOf(g.n, G);
        put(a.x0, a.y0);
        put(a.x1, a.y1);
      }
      if (g.copying) {
        const c = copyGeom(g.n, G).g;
        put(c.x0, c.y0);
        put(c.x1, c.y1);
      }
    }
    return { x0, x1, y0, y1 };
  };
  let sx0 = 1e9;
  let sx1 = -1e9;
  let sy0 = 1e9;
  let sy1 = -1e9;
  for (let f = 0; f <= LAST; f++) {
    const b = subject(f);
    sx0 = Math.min(sx0, b.x0);
    sx1 = Math.max(sx1, b.x1);
    sy0 = Math.min(sy0, b.y0);
    sy1 = Math.max(sy1, b.y1);
    if (b.x0 < 110 || b.x1 > 970 || b.y0 < 200 || b.y1 > 1400) {
      throw new Error(
        `MisalignmentFromHumans: the subject leaves the safe band at f${f} — x ${b.x0.toFixed(
          0,
        )}..${b.x1.toFixed(0)}, y ${b.y0.toFixed(0)}..${b.y1.toFixed(0)}.`,
      );
    }
  }
  let wx0 = 1e9;
  let wx1 = -1e9;
  let wy0 = 1e9;
  let wy1 = -1e9;
  for (let f = LANDING.f; f <= LAST; f++) {
    const b = bounds(CUT_OFFSET + f);
    const a = screenAt(f, b.x0, b.y0);
    const c = screenAt(f, b.x1, b.y1);
    wx0 = Math.min(wx0, a.x);
    wx1 = Math.max(wx1, c.x);
    wy0 = Math.min(wy0, a.y);
    wy1 = Math.max(wy1, c.y);
    if (a.x < 110 || c.x > 970 || a.y < 200 || c.y > 1400) {
      throw new Error(
        `MisalignmentFromHumans: the world leaves the safe band at f${f} — x ${a.x.toFixed(
          0,
        )}..${c.x.toFixed(0)}, y ${a.y.toFixed(0)}..${c.y.toFixed(0)}.`,
      );
    }
  }
  const bl = bounds(CUT_OFFSET + 92);
  const a92 = screenAt(92, bl.x0, bl.y0);
  const c92 = screenAt(92, bl.x1, bl.y1);
  return {
    subject: [sx0, sy0, sx1, sy1].map((q) => Number(q.toFixed(0))),
    wideFromLanding: [wx0, wy0, wx1, wy1].map((q) => Number(q.toFixed(0))),
    at92: [a92.x, a92.y, c92.x, c92.y].map((q) => Number(q.toFixed(0))),
  };
})();

/** 7. THE WORLD IS DOING WHAT THE SCHEDULE SAYS on this cut's beats, and the
 *  cut does not resolve: gen 10 stands, 88 deg off, with nothing corrected. */
(() => {
  const b = defaultProps.beats;
  const gen = (n: number, f: number) => stateAt(CUT_OFFSET + f).gens[n - 1];
  if (gen(8, b.endUp).copyU <= 0 || gen(8, b.endUp).hasArrow) {
    throw new Error("MisalignmentFromHumans: gen 8's arrow is not mid-slide on 'end up'.");
  }
  if (gen(8, b.going).copyU <= 0 || gen(9, b.going).fill > 0) {
    throw new Error("MisalignmentFromHumans: the world is not between 8 and 9 on 'going'.");
  }
  if (gen(9, b.direction).fill > 0.05 || gen(9, b.direction + 16).fill < 0.5) {
    throw new Error("MisalignmentFromHumans: gen 9 does not start building on 'direction'.");
  }
  if (gen(9, b.increasing).copyU <= 0 || gen(9, b.increasing).hasArrow) {
    throw new Error("MisalignmentFromHumans: gen 9's arrow is not mid-slide on 'increasing'.");
  }
  if (!gen(9, 68).hasArrow) {
    throw new Error("MisalignmentFromHumans: gen 9's arrow has not landed by f68.");
  }
  if (gen(10, b.misalignment).fill <= 0 || gen(10, b.misalignment).fill >= 1) {
    throw new Error("MisalignmentFromHumans: gen 10 is not mid-build on 'misalignment'.");
  }
  if (!gen(10, LAST).hasArrow) {
    throw new Error("MisalignmentFromHumans: gen 10 does not own its arrow by the end.");
  }
  if (Math.abs(deviationAt(10, CUT_OFFSET + LAST) - THETA[10]) > 1e-9) {
    throw new Error("MisalignmentFromHumans: something has already been corrected.");
  }
})();

// ---------------------------------------------------------------------------

const MisalignmentFromHumans: React.FC<Props> = ({
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

export default MisalignmentFromHumans;

export const CAM_AT = (f: number) => camAt(f);

/** WHAT CUT 5 OPENS ON. The camera at this cut's last frame, `sway` included
 *  (it is part of where the frame actually is), with the content y taken back
 *  off the live k so cut 5 can re-key from it rather than from a cy that only
 *  means anything at this zoom. Cut 5's world is 61 frames later (G685 against
 *  this cut's G624), so it inherits the FRAMING, not the moment. */
export const WIDE_CAM = (() => {
  const c = camAt(LAST);
  return {
    f: LAST,
    G: CUT_OFFSET + LAST,
    k: Number(c.k.toFixed(6)),
    cx: Number(c.cx.toFixed(3)),
    cy: Number(c.cy.toFixed(3)),
    contentY: Number((c.cy - CAM_LIFT / c.k).toFixed(3)),
    /** the still-running creep, so cut 5 can continue it instead of restarting */
    dk: Number((camAt(LAST).k - camAt(LAST - 8).k).toFixed(6)),
  };
})();

export const BEAT_CHECK = {
  direction: defaultProps.beats.direction,
  misalignment: defaultProps.beats.misalignment,
  humans: defaultProps.beats.humans,
  end: defaultProps.beats.end,
};

export const STATS = {
  LANDING,
  CAM_STATS,
  SPEED,
  INK_BOX,
  WIDE_CAM,
  camLift: CAM_LIFT,
  box: {
    x0: Number(BOX.x0.toFixed(2)),
    y0: Number(BOX.y0.toFixed(2)),
    x1: Number(BOX.x1.toFixed(2)),
    y1: Number(BOX.y1.toFixed(2)),
  },
  track: { f0: TRACK_F0, f1: TRACK_F1, kOpen: K_OPEN, kTrack: K_TRACK, cxOpen: CX_OPEN, cxTrack: CX_TRACK },
  pull: { f0: PULL_F0, f1: PULL_F1, kWide: K_WIDE, cxWide: CX_WIDE, cWide: C_WIDE, warp: 0.75 },
};
