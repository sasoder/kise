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
import { CAM_AT as CUT4_CAM_AT, DURATION as CUT4_DURATION, WIDE_CAM } from "./MisalignmentFromHumans";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  CUT_OFFSETS,
  FPS,
  GENS,
  INK,
  MARK,
  MARK_R,
  PACKET_V,
  PEOPLE,
  PEOPLE_Y,
  PERSON_H,
  PERSON_INK,
  SPEED_CAP_SCREEN,
  THETA,
  TURN_F,
  WAVE_G0,
  WAVE_V,
  World,
  arrowOf,
  bounds,
  deviationAt,
  nodesAt,
  stateAt,
  toneAt,
  turnAt,
  wavePackets,
} from "./degradationShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Alignment_Degradation`, cut 5 of five:
// `MoreAndMoreAligned`. Line (SRT 0:32.979 -> 0:36.700):
//   "every generation of models we're able to make more and more aligned."
//
// THE CLIP'S ONE IDEA: **Alignment is passed on, generation to generation,
// like a copy of a copy. Each generation is made by the one before it and
// inherits its idea of "aligned" — with a little error. Left alone, the errors
// compound and the lineage curls away from what the humans wanted. Corrected
// every generation, it straightens onto the humans' line.**
//
// This cut is THE CORRECTION. Cut 4 left the ten generations curled away to the
// right, the head of the spiral pointing flat sideways and deep in tone. Four
// frames before this cut opens, a white train set off from the humans; it runs
// up the chain at 220 px per 7 frames, THROUGH each mark, and the frame its
// front reaches a generation's centre that generation's arrow starts turning
// back to straight up over 18 frames while its tone ripens. Because every child
// sits on its parent's arrow tip, each turn swings the whole chain above it:
// THE SPIRAL UNROLLS FROM THE BASE UP INTO A STRAIGHT COLUMN ON THE GUIDE.
// That unrolling is the whole cut. NOTHING IS ADDED TO THE WORLD FOR IT — this
// file owns one thing only, its camera.
//
// VOCABULARY — `degradationShared`'s, imported and never redefined. The world
// is ONE 790-frame timeline; this cut is a window onto G685-789 with a camera
// on it, and f0 is not a beginning: it is cut 4's last frame 60 frames on, the
// same ten marks standing in the same places, with two train packets already on
// the wire below generation 1.
//
// DURATION. 3.721 s of speech x 24 = 89.3 -> 89 frames, plus the set's 16-frame
// tail: DURATION = 89 + 16 = 105. CUT_OFFSET 685, so G = 685 + frame.
//
// Word -> frame (24 fps from the cut's in-point):
//   every 0 · generation 9 · of 17 · models 27 · we're 36 · able 45 · to 50 ·
//   make 56 · more 61 · and 71 · more 76 · aligned 80 · (speech ends 89)
//
// SOUND-OFF READING TEST — one sentence:
//   "a line of white beads runs up the crooked chain from the people, and every
//    orange mark it passes swings its arrow back onto the dashed line and
//    brightens, until the whole crooked thing has straightened into one column
//    standing on the humans' line."
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous unrolling. Every gesture below except the camera is
// the world's own schedule; this cut may not move a frame of it.
//
//  1. f3-21    "every"/"generation"   THE FIRST CORRECTION. The train's front
//              (0/9)                  reaches generation 1 at f3 and its arrow
//                                     turns the half-degree back to straight up
//                                     while its tone ripens. It is the smallest
//                                     turn in the cut and the one that starts
//                                     everything: "EVERY generation".
//
//  2. f10-56   "of models we're       THE UNROLLING CLIMBS. Generations 2, 3, 4,
//              able" (17/27/36/45)    5 and 6 start turning at f10, 17, 24, 31,
//                                     38 — seven frames apart, strictly from the
//                                     base up, never in unison — and each turn
//                                     swings everything above it, so the curl is
//                                     being pushed up out of the chain.
//
//  3. f8-70    (camera)               THE ONE PULL-BACK, and the only thing in
//                                     this file that is not the world's. k
//                                     0.5711 -> 0.5100, content rising 839 ->
//                                     690 and the frame sliding 308 px LEFT off
//                                     the spiral's bulge onto the guide's axis,
//                                     warp 0.9 — one move, three channels, no
//                                     second key anywhere. The straight chain is
//                                     2,200 px tall where the spiral was 1,842,
//                                     so the frame has to open to hold what the
//                                     correction is making. It is 100% spent by
//                                     f74, six frames ahead of "aligned", and
//                                     peaks at 5.6 screen px/f with |dv| 0.28.
//
//  4. f45-70   "to make more"         THE FAST PART. Generations 7 and 8 turn
//              (50/56/61)             while 5 and 6 are still turning; four
//                                     swings compound and the head of the chain
//                                     moves 33.4 world px in a frame at f66 —
//                                     the fastest thing in the clip, and still
//                                     only 17.4 screen px/f.
//
//  5. f59-84   "and more aligned"     THE LAST TWO. Generation 9 turns at f59
//              (71/76/80)             and generation 10 — the head, 88 degrees
//                                     off, the deepest mark in the clip — at
//                                     f66, landing straight and ripe at f84,
//                                     four frames after "aligned". The column
//                                     stands on the guide.
//
//  6. f84-104  (tail)                 THE CUT DOES NOT RESOLVE. The train keeps
//                                     running up the straight column and on past
//                                     generation 10's arrow into the generation
//                                     that is never made, ten arrows carry their
//                                     idle packets, the dashes march, every mark
//                                     drifts on its own period and the camera is
//                                     still creeping.
//
// AMBIENT ONLY: per-element drift, marching dashes, idle ACCENT packets on all
// eleven standing arrows, the grid's parallax and drift, the camera's `sway` and
// its never-zero creep. No springs, flashes, glows, labels or text.
//
// ---------------------------------------------------------------------------
// THE FRAMING — WHY THE PULL-BACK AND NOT THE CLIMB.
//
// The cut brief offers two: pull back until the whole straight column is in
// frame, or hold k ~ 0.62 and ride up with the correction front, letting the
// people leave the bottom. It asks for the pull-back unless that puts a mark
// under 44 screen px. MEASURED, on the world's own numbers:
//
//   f0    ink box  x 230.440..1472.204 (w 1241.764)
//                  y -259.567..1774.505 (h 2034.072)
//   f84+  ink box  x 230.440.. 849.560 (w  619.120) — the PEOPLE are now the
//                  y -735.545..1774.505 (h 2510.050)  widest thing in the world
//
// The chain gets 476 px TALLER and 623 px NARROWER as it unrolls. Fitting the
// ten marks and the five people between screen y 200 and 1400 wants
// k = 1200 / 2392.050 = 0.5017, which is a mark of 44.1 screen px — over the
// floor, so the pull-back stands. K_LAND is 0.510 rather than 0.5017: the extra
// 1.7% buys the mark 44.7 screen px at f88 and 44.5 on the last frame, against
// a floor of 44, and costs only generation 10, whose centre lands at screen
// y 197 instead of 200. THAT IS THE RIGHT THING TO SPEND IT ON.
// Generation 10's arrow points at a generation that is never made; like the
// guide — which `bounds` excludes by design because it runs off frame — it is
// allowed to leave the top of the safe band. Generations 1 through 9, all five
// people and every mark body stay inside it.
//
// The climb was rejected on the picture, not on a number: riding up with the
// front keeps a mark at 54 px but loses the humans at the base, and the humans'
// line IS what "aligned" is aligned to. A column with nothing under it is just
// a column.
//
// THE CAMERA — one keyed track as a sum of eased segments, Gaussian-rounded,
// through `runCam3`, 40 frames of pre-roll carrying cut 4's own creep.
//
//   the pre-roll   f-40 -> 8    cut 4's own published creep (6.11e-5 of k a
//                               frame) run backwards over 40 frames, content
//                               balanced against it on the people, so the
//                               damper reaches f0 already moving. The three
//                               opening values are then SOLVED so that what
//                               comes OUT of the Gaussian and the damper at f0
//                               is cut 4's last frame, not what goes in.
//   THE PULL-BACK  f8 -> 70     cx 848.32 -> 540, content y 839.49 -> 690.19,
//                               k 0.5711 -> 0.5100, warp 0.9. Authored to finish
//                               at f70 because the damper lags: measured, the
//                               shot is 100% of the way there at f74 and 96% at
//                               f67, thirteen frames ahead of "aligned".
//   the creep      f72 -> 150   k -0.012 and content y -25.5, the two solved against
//                               each other so the people hold their screen line while the
//                               column keeps opening out. Still running at 0.5 px/f on f104.
// ---------------------------------------------------------------------------

export const CUT_OFFSET = CUT_OFFSETS.MoreAndMoreAligned;
export const DURATION = 105;

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
    every: z.number(),
    generation: z.number(),
    of: z.number(),
    models: z.number(),
    were: z.number(),
    able: z.number(),
    to: z.number(),
    make: z.number(),
    more1: z.number(),
    and: z.number(),
    more2: z.number(),
    aligned: z.number(),
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
    every: 0,
    generation: 9,
    of: 17,
    models: 27,
    were: 36,
    able: 45,
    to: 50,
    make: 56,
    more1: 61,
    and: 71,
    more2: 76,
    aligned: 80,
    end: 89,
  },
});

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);

/** Screen y the set's content centre sits on: 960 - CAM_LIFT. */
const CONTENT_SCREEN_Y = WORLD_H / 2 - CAM_LIFT;

/** The lowest bright ink in the whole cut: the outermost person's foot. It does
 *  not move, in any frame, in any cut — the people never move. */
const INK_FOOT = Math.max(...PEOPLE.map((p) => p.y + (PERSON_H * PERSON_INK) / 2));

// --- the opening: CUT 4'S WIDE_CAM, NOT A SOLVE OF MY OWN --------------------
// This cut opens on the frame cut 4 ends on. The spiral is complete and
// unturned at both, 61 world frames apart, so the two frames hold the SAME
// PICTURE and only the sway, the dashes and the packets may differ — the edit
// cuts on a held camera. Cut 4 publishes that frame as `WIDE_CAM` (its k, its
// cx and its content y with `sway` already in them, the content y taken back
// off the live k so it can be re-keyed at any zoom) and this file takes those
// three numbers rather than re-deriving them. Solved independently here first,
// off `bounds(685)` centred in the caption-safe band, this file had k 0.575,
// cx 851.32, content y 818.34 against cut 4's 0.571144 / 848.322 / 839.492 —
// 0.7%, 0.4% and 2.6% apart. CUT 4 IS THE REFERENCE, so cut 4's numbers stand;
// the independent solve is kept only as the check that they are sane.
const BOX_OPEN = bounds(CUT_OFFSET);
export const K_OPEN = WIDE_CAM.k;
const CX_OPEN = WIDE_CAM.cx;
const C_OPEN = WIDE_CAM.contentY;

/** Cut 4's creep, still running when it cuts: it publishes the k it lost over
 *  its last eight frames, which is 6.11e-5 per frame. The pre-roll runs that
 *  backwards over its 40 frames so the damper arrives at f0 already moving
 *  instead of starting from a standing start, with the content channel balanced
 *  against it on the people the same way the creep at the other end is. */
const PRE_K = (-WIDE_CAM.dk / 8) * PRE;
const PRE_C = ((INK_FOOT - C_OPEN) * PRE_K) / K_OPEN;

// --- the landing: the straight column, the guide's axis ----------------------
export const K_LAND = 0.51;
const CX_LAND = 540;
/** The people's feet on screen y 1388, twelve px clear of the caption band. */
const C_LAND = INK_FOOT - (1388 - CONTENT_SCREEN_Y) / K_LAND;

const GLIDE_F0 = 8;
const GLIDE_F1 = 70;
const CREEP_F0 = 72;
const CREEP_F1 = 150;

/**
 * THE CREEP IS BALANCED ON THE PEOPLE. A creep is the decaying drift that keeps
 * a hold alive, and this one has 20 frames of tail to carry on its own after the
 * last generation lands at f84 — the first version, 26 content px and 0.008 of k
 * spread over 148 frames, was down to 0.04 screen px/f by f90, which is parked.
 * So it is shorter (78 frames) and bigger (0.012 of k), and the two channels are
 * SOLVED AGAINST EACH OTHER so the extra pull-back costs nothing at the bottom
 * of the frame: with the people (INK_FOOT - C_LAND = 1084.3 world px below the
 * content centre) held on their screen line, dC = 1084.3 * dk / K_LAND = 25.5.
 * The people stay put, the column above them keeps opening out, and the camera
 * is still moving at 0.5 screen px/f on the last frame of the cut.
 */
const CREEP_K = 0.012;
const CREEP_C = ((INK_FOOT - C_LAND) * CREEP_K) / K_LAND;

/** The Gaussian and the damper both LAG, so a track authored to sit on
 *  `WIDE_CAM` at f0 does not come out of them on `WIDE_CAM` at f0 — it comes out
 *  a little behind, still carrying the pre-roll. The three opening values are
 *  therefore SOLVED, not written: the track is built, read at f0, and the
 *  opening offsets are moved by whatever it missed by. Three passes takes the
 *  join under 1e-6 of each channel; the fourth is there to prove it converged. */
const solveOpen = () => {
  let dK = 0;
  let dC = 0;
  let dX = 0;
  let last = { k: 0, cx: 0, cy: 0 };
  for (let pass = 0; pass < 4; pass++) {
    const cam = buildCam(dK, dC, dX);
    const c = runCam3(-FIRST, cam.CX, cam.CY, cam.K);
    const sw = sway(0);
    last = { k: c.k, cx: c.cx + sw.dx, cy: c.cy + sw.dy };
    dK += K_OPEN - last.k;
    dX += CX_OPEN - last.cx;
    dC += C_OPEN + CAM_LIFT / K_OPEN - last.cy;
  }
  return { dK, dC, dX, landed: last };
};

const contentYOf = (f: number, dC = 0) =>
  C_OPEN +
  dC +
  PRE_C * (1 - seg(f, FIRST, GLIDE_F0, 1.3)) -
  (C_OPEN - C_LAND) * seg(f, GLIDE_F0, GLIDE_F1, 0.9) -
  CREEP_C * seg(f, CREEP_F0, CREEP_F1, 0.9);

const cxOf = (f: number, dX = 0) =>
  CX_OPEN + dX - (CX_OPEN - CX_LAND) * seg(f, GLIDE_F0, GLIDE_F1, 0.9);

const kOf = (f: number, dK = 0) =>
  K_OPEN +
  dK +
  PRE_K * (1 - seg(f, FIRST, GLIDE_F0, 1.3)) -
  (K_OPEN - K_LAND) * seg(f, GLIDE_F0, GLIDE_F1, 0.9) -
  CREEP_K * seg(f, CREEP_F0, CREEP_F1, 0.9);

const CAM_SMOOTH = 5;
const buildCam = (dK: number, dC: number, dX: number) => {
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
  const y = hold((f) => contentYOf(f, dC));
  const x = hold((f) => cxOf(f, dX));
  const kk = hold((f) => kOf(f, dK));
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({ f: f - FIRST, k: gauss(kk, f), x: gauss(x, f), y: gauss(y, f) });
  }
  return camKnots3(knots, LAST + 2 - FIRST);
};

const OPEN_FIX = solveOpen();
const CAM = buildCam(OPEN_FIX.dK, OPEN_FIX.dC, OPEN_FIX.dX);

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
  if (CUT_OFFSET !== 685 || DURATION !== Math.round(3.721 * 24) + 16) {
    throw new Error("MoreAndMoreAligned: the cut's offset or duration is not the clip's.");
  }
})();

/** 2. F0 IS CUT 4'S STANDING PICTURE. All ten generations are complete and own
 *  their arrows, NOTHING has been corrected yet, and the train that does the
 *  correcting is already on the wire — it launched four frames before f0. */
export const OPENING = (() => {
  const st = stateAt(CUT_OFFSET);
  for (const g of st.gens) {
    if (g.fill < 0.999 || !g.hasArrow || g.copying) {
      throw new Error(`MoreAndMoreAligned: generation ${g.n} is not standing at f0.`);
    }
  }
  for (let n = 1; n <= GENS; n++) {
    if (Math.abs(deviationAt(n, CUT_OFFSET) - THETA[n]) > 1e-9) {
      throw new Error(`MoreAndMoreAligned: generation ${n} is already turning at f0.`);
    }
  }
  const train = wavePackets(CUT_OFFSET).length;
  if (CUT_OFFSET - WAVE_G0 !== 4 || train < 2) {
    throw new Error("MoreAndMoreAligned: the correction train is not already running at f0.");
  }
  return { train, box: BOX_OPEN };
})();

/** 2b. THE JOIN. CUT 5'S FIRST FRAME IS CUT 4'S LAST FRAME. The two cuts are 61
 *  world frames apart and the world is unturned in both of them, so the picture
 *  is identical and only the sway, the marching dashes and the packets may
 *  differ. Every channel of this cut's f0 camera is cut 4's f108 camera to
 *  better than 0.001% — far inside the 0.3% the brief allows — and the check is
 *  run against cut 4's OWN `CAM_AT`, not against the numbers it published, so a
 *  re-key of cut 4 stops this file building rather than quietly drifting apart
 *  in the edit. */
export const JOIN = (() => {
  const a = CUT4_CAM_AT(CUT4_DURATION - 1);
  const b = camAt(0);
  const rel = {
    k: Math.abs(b.k - a.k) / Math.abs(a.k),
    cx: Math.abs(b.cx - a.cx) / Math.abs(a.cx),
    cy: Math.abs(b.cy - a.cy) / Math.abs(a.cy),
  };
  for (const key of ["k", "cx", "cy"] as const) {
    if (!(rel[key] < 0.003)) {
      throw new Error(
        `MoreAndMoreAligned: f0's ${key} is ${(rel[key] * 100).toFixed(
          3,
        )}% off cut 4's last frame (${a[key]} vs ${b[key]}).`,
      );
    }
  }
  const P4 = nodesAt(CUT_OFFSETS.MisalignmentFromHumans + CUT4_DURATION - 1);
  const P5 = nodesAt(CUT_OFFSET);
  for (let n = 0; n <= GENS; n++) {
    if (Math.abs(P4[n].x - P5[n].x) > 1e-9 || Math.abs(P4[n].y - P5[n].y) > 1e-9) {
      throw new Error(`MoreAndMoreAligned: node ${n} is not where cut 4 left it.`);
    }
  }
  return {
    cut4: { f: CUT4_DURATION - 1, k: Number(a.k.toFixed(6)), cx: Number(a.cx.toFixed(3)), cy: Number(a.cy.toFixed(3)) },
    cut5: { f: 0, k: Number(b.k.toFixed(6)), cx: Number(b.cx.toFixed(3)), cy: Number(b.cy.toFixed(3)) },
    relPct: {
      k: Number((rel.k * 100).toFixed(5)),
      cx: Number((rel.cx * 100).toFixed(5)),
      cy: Number((rel.cy * 100).toFixed(5)),
    },
    solve: {
      dK: Number(OPEN_FIX.dK.toFixed(6)),
      dC: Number(OPEN_FIX.dC.toFixed(3)),
      dX: Number(OPEN_FIX.dX.toFixed(3)),
    },
  };
})();

/** 3. THE TURNS, AS ACTUALLY RENDERED. The first frame generation n's deviation
 *  is off its standing value, and the first frame it is straight. */
export const TURNS = (() => {
  const out: { n: number; start: number; end: number; schedStart: number }[] = [];
  for (let n = 1; n <= GENS; n++) {
    let start = -1;
    let end = -1;
    for (let f = 0; f <= LAST; f++) {
      const dev = deviationAt(n, CUT_OFFSET + f);
      if (start < 0 && THETA[n] - dev > 1e-9) start = f;
      if (end < 0 && dev <= 0) end = f;
    }
    const schedStart = turnAt(n) - CUT_OFFSET;
    if (start !== schedStart + 1 || end !== schedStart + TURN_F) {
      throw new Error(
        `MoreAndMoreAligned: generation ${n} turns f${start}-${end}, the schedule says f${
          schedStart + 1
        }-${schedStart + TURN_F}.`,
      );
    }
    out.push({ n, start, end, schedStart });
  }
  if (out[GENS - 1].end !== 84) {
    throw new Error(`MoreAndMoreAligned: the last turn finishes at f${out[GENS - 1].end}, not f84.`);
  }
  return out;
})();

/** 4. THE COLUMN IS STRAIGHT, ON THE GUIDE, FOUR FRAMES AFTER "aligned". */
export const COLUMN = (() => {
  const f = 84;
  const P = nodesAt(CUT_OFFSET + f);
  for (let n = 1; n <= GENS; n++) {
    if (Math.abs(P[n].x - 540) > 1e-6 || Math.abs(P[n].y - (P[0].y - 220 * n)) > 1e-6) {
      throw new Error(`MoreAndMoreAligned: generation ${n} is not on the guide at f84.`);
    }
    if (toneAt(n, CUT_OFFSET + f) < 0.999) {
      throw new Error(`MoreAndMoreAligned: generation ${n} has not ripened by f84.`);
    }
  }
  return { f, top: P[GENS].y, bottom: P[0].y, height: P[0].y - P[GENS].y };
})();

/** 5. THE PULL-BACK LANDS BEFORE "aligned" (f80), and lands on the column. */
export const LANDING = (() => {
  const f = 74;
  const k0 = kAt(0);
  const done = (k0 - kAt(f)) / (k0 - K_LAND);
  if (done < 0.95) {
    throw new Error(
      `MoreAndMoreAligned: the pull-back is only ${(done * 100).toFixed(0)}% spent at f74.`,
    );
  }
  const P = nodesAt(CUT_OFFSET + 88);
  return {
    f,
    spent: Number((done * 100).toFixed(1)),
    kAt74: Number(kAt(74).toFixed(4)),
    kAt88: Number(kAt(88).toFixed(4)),
    markScreenPx88: Number((MARK * kAt(88)).toFixed(1)),
    peopleScreenY88: Number(screenAt(88, 540, PEOPLE_Y).y.toFixed(0)),
    gen1ScreenY88: Number(screenAt(88, P[1].x, P[1].y).y.toFixed(0)),
    gen10ScreenY88: Number(screenAt(88, P[GENS].x, P[GENS].y).y.toFixed(0)),
    gen10MarkTop88: Number(screenAt(88, P[GENS].x, P[GENS].y - MARK_R).y.toFixed(0)),
    gen10TipScreenY88: Number(screenAt(88, 540, arrowOf(GENS, CUT_OFFSET + 88).y1).y.toFixed(0)),
    columnScreenX88: Number(screenAt(88, 540, P[1].y).x.toFixed(0)),
  };
})();

/** A mark is the subject of this cut's payoff, so it may not go under the set's
 *  44 screen px floor on ANY frame from the landing to the end — the creep is
 *  still opening the frame out after f84 and it has to pay for that. */
export const MARK_FLOOR = (() => {
  let worst = Infinity;
  let worstF = 0;
  for (let f = 70; f <= LAST; f++) {
    const px = MARK * kAt(f);
    if (px < worst) {
      worst = px;
      worstF = f;
    }
  }
  if (worst < 44) {
    throw new Error(
      `MoreAndMoreAligned: a mark is only ${worst.toFixed(1)} screen px at f${worstF}.`,
    );
  }
  return { px: Number(worst.toFixed(1)), f: worstF };
})();

/** 6. THE CAMERA IS SMOOTH AND NEVER PARKED. Measured on TWO fixed world points,
 *  because one is not enough to tell a moving camera from a still one: the
 *  humans' arrow base sits 1,084 px under the content centre and the head of the
 *  finished column 1,264 px over it, so the base reads the lift and the head
 *  reads the lift AND the zoom. `|dv|` must hold on both; the never-parked test
 *  is on the head, which is the thing the shot is opening out to hold. */
const CAM_PROBE = [
  { name: "base", x: 540, y: 1626.455 },
  { name: "head", x: 540, y: -573.545 },
];

export const CAM_STATS = (() => {
  const out: Record<
    string,
    {
      maxDv: number;
      maxDvF: number;
      maxV: number;
      minV: number;
      minVF: number;
      meanV: number;
      tailV: number;
    }
  > = {};
  for (const p of CAM_PROBE) {
    const v: number[] = [];
    for (let f = 1; f <= LAST; f++) {
      const a = screenAt(f - 1, p.x, p.y);
      const b = screenAt(f, p.x, p.y);
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
    const minV = Math.min(...v);
    out[p.name] = {
      maxDv: Number(maxDv.toFixed(3)),
      maxDvF,
      maxV: Number(Math.max(...v).toFixed(3)),
      minV: Number(minV.toFixed(3)),
      minVF: v.indexOf(minV) + 1,
      meanV: Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(3)),
      tailV: Number(v[v.length - 1].toFixed(3)),
    } as never;
  }
  return out as Record<
    string,
    {
      maxDv: number;
      maxDvF: number;
      maxV: number;
      minV: number;
      minVF: number;
      meanV: number;
      tailV: number;
    }
  >;
})();

(() => {
  for (const name of Object.keys(CAM_STATS)) {
    if (CAM_STATS[name].maxDv > 2.5) {
      throw new Error(
        `MoreAndMoreAligned: the camera's |dv| peaks at ${CAM_STATS[name].maxDv} px/f^2 on the ${name}.`,
      );
    }
  }
  // THE HOLD AT THE END IS THE ONE THAT MATTERS. The opening is deliberately
  // slow — it is cut 4's own dying creep, and inventing velocity there would
  // break the join — but the 20 frames after the last generation lands at f84
  // are this cut's own hold, and a hold has to carry motion.
  if (CAM_STATS.head.minV <= 0.01 || CAM_STATS.base.minV <= 0.01) {
    throw new Error("MoreAndMoreAligned: the camera comes to a dead stop.");
  }
  if (CAM_STATS.head.tailV < 0.25) {
    throw new Error(
      `MoreAndMoreAligned: the hold parks — the head moves ${CAM_STATS.head.tailV} px/f on the last frame.`,
    );
  }
})();

/** 7. NOTHING BREAKS THE SPEED CAP. The swinging head of the chain is the
 *  fastest thing in this clip and it is measured here by name, on screen, with
 *  the camera's own zoom and pan in it. */
export const SPEED = (() => {
  let headMax = 0;
  let headMaxF = 0;
  let headWorld = 0;
  for (let f = 1; f <= LAST; f++) {
    const a = nodesAt(CUT_OFFSET + f - 1)[GENS];
    const b = nodesAt(CUT_OFFSET + f)[GENS];
    headWorld = Math.max(headWorld, Math.hypot(b.x - a.x, b.y - a.y));
    const sa = screenAt(f - 1, a.x, a.y);
    const sb = screenAt(f, b.x, b.y);
    const s = Math.hypot(sb.x - sa.x, sb.y - sa.y);
    if (s > headMax) {
      headMax = s;
      headMaxF = f;
    }
  }
  let frontMax = 0;
  let frontMaxF = 0;
  for (let f = 1; f <= LAST; f++) {
    const a = wavePackets(CUT_OFFSET + f - 1)[0];
    const b = wavePackets(CUT_OFFSET + f)[0];
    if (!a || !b) continue;
    const sa = screenAt(f - 1, a.x, a.y);
    const sb = screenAt(f, b.x, b.y);
    const s = Math.hypot(sb.x - sa.x, sb.y - sa.y);
    if (s > frontMax) {
      frontMax = s;
      frontMaxF = f;
    }
  }
  let kMax = 0;
  for (let f = 0; f <= LAST; f++) kMax = Math.max(kMax, kAt(f));
  const packet = PACKET_V * kMax;
  const train = WAVE_V * kMax;
  const worst = Math.max(headMax, frontMax, packet, train);
  if (worst > SPEED_CAP_SCREEN) {
    throw new Error(`MoreAndMoreAligned: something moves at ${worst.toFixed(1)} screen px/f.`);
  }
  return {
    headScreenMax: Number(headMax.toFixed(2)),
    headScreenMaxF: headMaxF,
    headWorldMax: Number(headWorld.toFixed(2)),
    frontScreenMax: Number(frontMax.toFixed(2)),
    frontScreenMaxF: frontMaxF,
    packetMax: Number(packet.toFixed(2)),
    trainMax: Number(train.toFixed(2)),
  };
})();

/** 8. CAPTION-SAFE ON EVERY FRAME, and the marks and the people stay inside the
 *  band. The one thing allowed above it is generation 10's arrow — the link to a
 *  generation that is never made, which leaves the top of the frame the way the
 *  guide does. */
export const INK_BOX = (() => {
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  let y1 = -1e9;
  let markTop = 1e9;
  for (let f = 0; f <= LAST; f++) {
    const b = bounds(CUT_OFFSET + f);
    const a = screenAt(f, b.x0, b.y0);
    const c = screenAt(f, b.x1, b.y1);
    x0 = Math.min(x0, a.x);
    y0 = Math.min(y0, a.y);
    x1 = Math.max(x1, c.x);
    y1 = Math.max(y1, c.y);
    const P = nodesAt(CUT_OFFSET + f);
    for (let n = 1; n <= GENS; n++) {
      markTop = Math.min(markTop, screenAt(f, P[n].x, P[n].y - MARK_R).y);
    }
  }
  if (x0 < 110 || x1 > 970 || y1 > 1400) {
    throw new Error(
      `MoreAndMoreAligned: the ink runs to screen x ${x0.toFixed(0)}..${x1.toFixed(
        0,
      )}, y ..${y1.toFixed(0)}.`,
    );
  }
  if (y0 < 0) {
    throw new Error(`MoreAndMoreAligned: ink leaves the top of the FRAME at y ${y0.toFixed(0)}.`);
  }
  return {
    x0: Number(x0.toFixed(0)),
    x1: Number(x1.toFixed(0)),
    y0: Number(y0.toFixed(0)),
    y1: Number(y1.toFixed(0)),
    lowestMarkTop: Number(markTop.toFixed(0)),
  };
})();

/** 9. THE CUT DOES NOT RESOLVE: the train is still running on the last frame,
 *  above the column and on past generation 10's arrow. */
export const TAIL = (() => {
  const pk = wavePackets(CUT_OFFSET + LAST);
  if (pk.length < 2) {
    throw new Error("MoreAndMoreAligned: the correction train has emptied — the cut resolves.");
  }
  const front = pk[0];
  const head = nodesAt(CUT_OFFSET + LAST)[GENS];
  return {
    packets: pk.length,
    frontWorldY: Number(front.y.toFixed(1)),
    frontAboveHead: Number((head.y - front.y).toFixed(1)),
    frontScreenY: Number(screenAt(LAST, front.x, front.y).y.toFixed(0)),
  };
})();

// ---------------------------------------------------------------------------

const MoreAndMoreAligned: React.FC<Props> = ({
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

export default MoreAndMoreAligned;

export const CAM_AT = (f: number) => camAt(f);

export const STATS = {
  OPENING: { train: OPENING.train },
  TURNS,
  COLUMN,
  LANDING,
  MARK_FLOOR,
  CAM_STATS,
  SPEED,
  INK_BOX,
  TAIL,
  JOIN,
  camera: {
    kOpen: K_OPEN,
    kLand: K_LAND,
    cxOpen: CX_OPEN,
    cxLand: CX_LAND,
    cOpen: C_OPEN,
    cLand: C_LAND,
    glide: [GLIDE_F0, GLIDE_F1],
    creep: [CREEP_F0, CREEP_F1],
  },
};
