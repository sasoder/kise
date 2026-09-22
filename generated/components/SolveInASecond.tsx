import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
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
  clamp01,
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { INK, INK_LO, PERSON_H_PX, PersonGlyph, camKnots3, runCam3 } from "./trapShared";
import {
  COLUMN,
  GATHERED,
  LevelLine,
  MODEL_EDGE,
  ModelMark,
  QUESTIONS,
  QuestionRing,
  RING_R,
  SPEED_CAP_SCREEN,
  levelW,
  ringSway,
  strokeScreen,
  strokeW,
  worldPx,
} from "./challengeShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Challenge_The_Model`, cut 4 of the set: `SolveInASecond`.
// Line (SRT 0:27.000 -> 0:34.840):
//   "out there right now, you give the model a problem and you ask it to solve
//    it. And if the problem is so easy that you can just solve it in a second,
//    it's not really learning anything."
//
// THE CLIP'S ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges
// it. A question BELOW the model's line is too easy and lifts nothing.**
//
// THIS CUT'S JOB: show the lifting NOT happening. A trainer stands below the
// model's level and hands a problem up to it. Because the problem starts and
// arrives BELOW the orange line it is easy by definition: the model solves it
// ON CONTACT — five frames, "in a second" — the tick goes dim and drops onto the
// pile of everything already answered, AND THE ORANGE LINE DOES NOT MOVE. It
// happens twice and a half, the camera closing in on the non-event, and the one
// bright `?` still standing above the line is never any nearer.
//
// VOCABULARY — `challengeShared`'s, and nothing is invented but the trainer
// (`person.png`, the set's own human glyph, PERSON_H_PX 118 at this clip's
// K_REF = 1.0) and the hand-off line they pass a problem along. The model is the
// OpenAI mark filled ACCENT; its LEVEL is one thin accent line through it that
// moves only because the mark moves; a PROBLEM is a white ring with lucide
// `circle-help`'s `?` in it, INK_HI while unanswered; ANSWERED is the `?` out,
// the tick in, the ring INK_HI -> INK_LO. Two ink rungs, one stroke family, no
// text, no boxes, no third colour, no packets on the hand-off line — the rings
// ARE the traffic.
//
// DURATION. 7.84 s of speech x 24 = 188.16 -> 188 frames, plus the set's
// 16-frame tail: DURATION = 188 + 16 = 204.
//
// Word -> frame (24 fps from comp start):
//   out 0 · there 3 · right 7 · now 12 · you 17 · give 23 · the 26 · model 31 ·
//   a 41 · problem 49 · and 55 · you 57 · ask 61 · it 63 · to 65 · solve 70 ·
//   it 77 · and 84 · if 94 · the 97 · problem 105 · is 117 · so 126 · easy 133 ·
//   that 136 · you 138 · can 139 · just 142 · solve 146 · it 147 · in 149 ·
//   a 151 · second 158 · it's 159 · not 162 · really 165 · learning 171 ·
//   anything 181 · (speech ends 188)
//
// SOUND-OFF READING TEST — one sentence:
//   "a person below the line keeps handing question marks up to the orange mark;
//    each one turns into a tick the moment it touches and sinks onto the pile
//    underneath, and the orange line never moves."
//
// ---------------------------------------------------------------------------
// GESTURES — one loop run twice and a half. The words are where it LANDS.
//
//  1. f-24-26   "out there right     THE FIND. The camera is already gliding at
//               now, you"            f0 (24 frames of pre-roll): a close shot on
//               (f0/f12/f17)         the mark at k 1.6 easing left and down until
//                                    the trainer is in frame at lower left, the
//                                    pair centred on screen (540, 835) by f26.
//                                    The trainer fades up f4-20 as the camera
//                                    finds them, rising 10 world px into place.
//
//  2. f23-37    "GIVE the model       THE HAND-OFF LINE. One white line at INK_LO,
//               a problem"           half stroke, drawn from the trainer to the
//               (f23/f31/f41)        mark's edge over 14 frames and kept for the
//                                    rest of the cut. It is the arc every problem
//                                    travels, and it runs UNDER the line the whole
//                                    way: it never crosses the model's level.
//
//  3. f28-68    "a problem and you   PROBLEM 1. A `?` at INK_HI lifts out from
//               ask it to SOLVE it"  behind the trainer at f28 and rides the arc,
//               (f49/f61/f70)        easing into the mark's lower left rim at f68
//                                    — so "solve" (f70) lands two frames into the
//                                    contact.
//
//  4. f68-73    (the mechanism)      THE FIVE-FRAME SOLVE. The flip is computed
//                                    from CONTACT GEOMETRY — the sub-frame the
//                                    ring's rim reaches the mark's disc, walked
//                                    off the travel curve, never a frame number —
//                                    and takes FLIP_F = 5 frames: the `?` undraws,
//                                    the tick draws, the ring falls to INK_LO.
//                                    THE LINE DOES NOT MOVE A WORLD PX.
//
//  5. f73-99    (continues 4)        THE DROP. The tick falls away under the mark
//                                    on a slow ease (warp 1.25) into a LANDING
//                                    SLOT solved out of the gathered mass's own
//                                    free space, and joins the pile.
//
//  6. f100-150  "if the problem is   PROBLEM 2, the same loop slower (50 frames of
//               so easy that you     travel against 40), so the two arrivals are
//               can just solve it"   never in unison and each has its own arc
//               (f105/f126/f133/     jitter. It contacts at f150 and the flip is
//                f146)               finished at f155, so "second" (f158) lands on
//                                    a tick that is already dim.
//
//  7. f100-145  "...IN A SECOND"     THE PUSH-IN. One glide, k 1.6 -> 2.0, easing
//               (f149/f158)          in from f100 and landed by f145 — 13 frames
//                                    ahead of "second" — closing on the mark so
//                                    the instant flip is seen big. The camera's
//                                    centre moves with it, from the pair to the
//                                    contact.
//
//  8. f155-171  "it's not really     THE SECOND DROP, into a slot that stacks ON
//               LEARNING anything"   the first one: the pile grows and the line
//               (f159/f171/f181)     stays exactly where it was. It is settled to
//                                    within 1 world px by f170, so "learning"
//                                    (f171) lands on nothing moving but the camera
//                                    and the unmoved line.
//
//  9. f159-199  (continues 8)        THE PULL-BACK. One long decaying glide,
//                                    k 2.0 -> 1.7, still running at the last frame.
//
// 10. f178-203  "ANYTHING"           PROBLEM 3 lifts at f178 and is 47% up the arc
//                                    on the last frame. THE CUT DOES NOT RESOLVE:
//                                    a problem is in the air, the camera is still
//                                    pulling back, the bright `?` above the line is
//                                    exactly as far away as it was at f0.
//
// AMBIENT ONLY (so no window of the cut is still): every ring's own <= 3 px drift
// on its own two periods (`ringSway`), the grid's parallax and -0.3 px/frame
// drift, the camera's `sway`, and the mark's own creep — a bob of two periods
// plus 0.012 px/f, which never stops (min |v| 0.0045 px/f) and never adds up to
// anything (the line's whole excursion over 204 frames is 3.9 world px, which is
// the "it does not move" the line is about). Nothing else: no packets on the
// hand-off line, no glow, no flash, no breath on the mark, no bounce.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the cut brief, with the arithmetic.
//
//  * THE MODEL SITS AT WORLD y 72, ABOVE THE COLUMN, and every ring of
//    `challengeShared.QUESTIONS` is therefore answered, gathered and dim. The
//    brief allows it ("its last few bright `?`, which are above frame in this
//    close-up"), and the geometry forces it. The trainer has to stand below the
//    line with a clear arc up to the mark, and the gathered mass of cut 1 is
//    PACKED — its own relaxation leaves 7 world px rim to rim — out to |dx| 338
//    across y 500..1300. Measured on that layout: with the mark at cut 1's
//    resting height (y 467) there is no point at all within 72 world px of the
//    mark that clears every gathered ring by a rim's width, i.e. NOTHING CAN
//    TOUCH THE MODEL THERE, and no path from a trainer at the brief's (-300,
//    +260) reaches it either — a 0-slot, 0-path search over a 4 px grid. Above
//    the column the mass thins to its top three rings and both exist. The world
//    is unchanged: same rings, same gathered x, same heights.
//
//  * ONE BRIGHT `?` IS ADDED ABOVE THE LINE, at world (391, -180) — outside
//    `QUESTIONS`, which stops at y 222 because that is as high as cut 1's column
//    was ever seen. The clip's idea needs an unreached question in frame: it is
//    what "not really learning anything" is measured against. It obeys the lens
//    (|dx| 149, inside `hw`'s 152 at the narrow top and outside the 84 shaft plus
//    a ring), it sways like every other ring, and the line never gets a px nearer
//    to it.
//
//  * THE FLIP TAKES 5 FRAMES, not `challengeShared.SOLVE_F`'s 10. That is the
//    line: "so easy that you can just solve it in a second". The climb's own
//    solves in cuts 1-3 stay at 10; these are the easy ones.
//
//  * THE TRAINER STANDS 300 WORLD PX LEFT AND 262 BELOW the line, which is the
//    brief's own offset, but the LINE'S y is 72 rather than cut 1's, so their
//    feet land at y 384 — 86 px clear of the mass's nearest rim.
//
//  * THE LEVEL LINE IS DRAWN AT half = 760, not LEVEL_HALF_LEN 470. At 470 its
//    solid part ends at world x 188/892 and the camera, which is off-axis at
//    k 1.6-2.0, sees that end: the model's level would read as a bar with two
//    ends rather than as a horizon. At 760 the fade happens outside every framing
//    in the cut.
//
//  * CONTACT IS THE FLIP, not `solvedAt`. A problem handed up from below is not
//    answered by the line reaching it — the line never moves — it is answered by
//    the model, on touch. It is still solved from geometry every frame and never
//    from a frame number: `contactOf` walks the travel curve against the mark's
//    own y and returns the sub-frame the rim arrives.
// ---------------------------------------------------------------------------

export const DURATION = 204;

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
    out: z.number(),
    you: z.number(),
    give: z.number(),
    model: z.number(),
    problem: z.number(),
    ask: z.number(),
    solve: z.number(),
    iff: z.number(),
    problem2: z.number(),
    easy: z.number(),
    solve2: z.number(),
    second: z.number(),
    not: z.number(),
    learning: z.number(),
    anything: z.number(),
    end: z.number(), // speech ends; the tail runs to 204
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
    out: 0,
    you: 17,
    give: 23,
    model: 31,
    problem: 49,
    ask: 61,
    solve: 70,
    iff: 94,
    problem2: 105,
    easy: 133,
    solve2: 146,
    second: 158,
    not: 162,
    learning: 171,
    anything: 181,
    end: 188,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
/** Frames of pre-roll: the camera is already moving at f0. */
const PRE = 24;

// ---------------------------------------------------------------------------
// THE STANDING PICTURE
// ---------------------------------------------------------------------------
/** The model's height, and its LEVEL's: one y drives both, all cut. */
const LINE_Y0 = 72;
/** THE MARK'S CREEP. Never zero (the model is alive) and never anything (the
 *  model is not learning).
 *
 *  IT IS WRITTEN AS A CREEP WITH TWO SLOW BREATHS ON IT, and the amplitudes are
 *  solved rather than chosen: a bob of amplitude A and period P contributes A/P
 *  to the speed, so for the mark never to stop the two have to stay under the
 *  creep — 0.7/70 + 0.2/85 = 0.0124 against 0.018, which leaves a floor of
 *  0.0056 world px/f. The whole excursion over the cut's 204 frames is then
 *  5.2 world px, i.e. 8-10 screen px across eight and a half seconds: the line
 *  is alive and it has not moved. */
const lineY = (f: number) =>
  LINE_Y0 - 0.018 * f + 0.7 * Math.sin(f / 70 + 0.6) + 0.2 * Math.sin(f / 85 + 2.4);
const lineV = (f: number) => lineY(f - 1) - lineY(f);

/** THE TRAINER — "you". 240 world px left of the model's axis and 230 below its
 *  level (the cut brief's own offset was 300 / 262; the director's composition
 *  pass tightened it, because at k 2.0 that pair reached the frame's left edge).
 *  The pile leaves room for it: the trainer's ink box clears the nearest gathered
 *  ring by 43 world px. */
const PERSON = { x: COLUMN.x - 240, y: LINE_Y0 + 230 };
const PERSON_H = worldPx(PERSON_H_PX);
/** person.png's ink fills 0.84 of its box; as a clearance box that is a half
 *  width and half height of 0.42 of it. */
const PERSON_INK_HW = PERSON_H * 0.42;

/** The trainer's own arrival: they fade up as the camera finds them and settle
 *  10 world px up into place. */
const PERSON_F0 = 4;
const PERSON_F1 = 20;
const personAt = (f: number) => {
  const u = smoothstep(clamp01((f - PERSON_F0) / (PERSON_F1 - PERSON_F0)));
  return { opacity: u, y: PERSON.y + 10 * (1 - u) };
};

/** THE UNREACHED QUESTION. See the deviations: one bright `?` above the line,
 *  inside the lens's narrow top (|dx| 149, band [146, 152]). */
const ABOVE = { x: COLUMN.x - 149, y: -140, r: RING_R * 0.98, seed: 0.37 };

/** A problem ring's radius. The three carry the field's own +/-3% jitter. */
const PROBLEM_R = [RING_R * 0.99, RING_R * 0.965, RING_R * 1.005];

/** The mark's own half box plus a ring: the distance at which a problem's rim
 *  touches the model's disc. */
const CONTACT_D = MODEL_EDGE + RING_R;
/** Frames from `?` to a dim tick. Five, not SOLVE_F's ten: "in a second". */
const FLIP_F = 5;

// ---------------------------------------------------------------------------
// THE ARC — the hand-off line, and the path every problem rides.
//
// One cubic Bezier from behind the trainer to the mark's lower-left EDGE. Its
// shape is solved against three things and nothing else:
//   * it must stay BELOW the level line the whole way (a problem handed up from
//     below is easy by definition, and one that crossed the line would be a
//     different claim). Measured: the travelling ring's top rim is never nearer
//     the line than 13.9 world px, and that minimum is AT the contact, where the
//     ring is touching a mark whose own box reaches 36 px below the line.
//   * it must clear the gathered mass's topmost ring (`QUESTIONS[0]`, gathered to
//     x 440.3 at y 238.7) by a rim's width — it passes over it with 17.9 px to
//     spare, and that IS the cut's closest call: it is the eye of the needle the
//     whole thing is threaded through.
//   * it must arrive nearly head on: the ring reaches the mark on a bearing 41.6
//     degrees below the horizontal, travelling 18.4 degrees off the line to the
//     mark's own centre, so the touch is an event and not a graze.
// ---------------------------------------------------------------------------
const ARC = {
  // inside the trainer's SHOULDER, not their head: person.png's head circle ends
  // at world y 330 and a line leaving from there reads as a thought rather than
  // as something handed over.
  p0: { x: PERSON.x + 22, y: PERSON.y + 14 },
  // c1 climbs steeply out of the trainer. With the tightened offset the arc has
  // 163 px of run to the contact and has to be above y 169 by the time it is
  // over the pile's top ring; the old, gentler c1 (255, 205) left only 13.6 px
  // of rim clearance there against this one's 21.
  c1: { x: 306, y: 175 },
  c2: { x: 420, y: 150 },
  p3: { x: 524, y: 104 },
};

type Pt = { x: number; y: number };
const bez3 = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * a.x + w1 * b.x + w2 * c.x + w3 * d.x,
    y: w0 * a.y + w1 * b.y + w2 * c.y + w3 * d.y,
  };
};
const bez2 = (a: Pt, b: Pt, c: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    y: u * u * a.y + 2 * u * t * b.y + t * t * c.y,
  };
};

/** Each problem's own arc: the shared curve with its seed's jitter on the two
 *  control points, so no two travel the same line and none of them moves in
 *  unison with another. */
const arcOf = (seed: number) => {
  const j = (k: number, amp: number) => (Math.sin(seed * 12.9898 + k * 78.233) % 1) * amp;
  return {
    p0: { x: ARC.p0.x + j(1, 5), y: ARC.p0.y + j(2, 5) },
    c1: { x: ARC.c1.x + j(3, 7), y: ARC.c1.y + j(4, 7) },
    c2: { x: ARC.c2.x + j(5, 6), y: ARC.c2.y + j(6, 6) },
    p3: ARC.p3,
  };
};
const arcAt = (seed: number, t: number) => {
  const a = arcOf(seed);
  return bez3(a.p0, a.c1, a.c2, a.p3, clamp01(t));
};

/** Arc length along one problem's curve, so the ring's SPEED is the ease and not
 *  the parameter (a Bezier's t is not uniform, and an unmapped one lurches). */
const LEN_STEPS = 400;
const arcTable = (seed: number) => {
  const xs: number[] = [0];
  let prev = arcAt(seed, 0);
  let acc = 0;
  for (let i = 1; i <= LEN_STEPS; i++) {
    const p = arcAt(seed, i / LEN_STEPS);
    acc += Math.hypot(p.x - prev.x, p.y - prev.y);
    xs.push(acc);
    prev = p;
  }
  return xs;
};
/** t at a given fraction of the curve's own length. */
const tAtLen = (tab: number[], frac: number) => {
  const want = clamp01(frac) * tab[LEN_STEPS];
  let lo = 0;
  let hi = LEN_STEPS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (tab[mid] < want) lo = mid;
    else hi = mid;
  }
  const span = tab[hi] - tab[lo] || 1;
  return (lo + (want - tab[lo]) / span) / LEN_STEPS;
};

// ---------------------------------------------------------------------------
// THE THREE PROBLEMS. Lift frames, travel lengths, landing slots and the drop's
// control point. The slots are not decoration: the gathered mass has no room
// inside it (its own relaxation leaves 7 world px rim to rim), so a problem can
// only join it at its TOP EDGE, and the second one has to stack ON the first
// because once a ring stands in the channel between QUESTIONS[0] (x 440.3) and
// QUESTIONS[1] (x 663.9) nothing else can pass it — 112 px of gap against the
// 141 two rings need. Which is the right picture anyway: the pile grows upward
// and the line stays where it is.
// ---------------------------------------------------------------------------
type Problem = {
  i: number;
  lift: number;
  arrive: number;
  seed: number;
  r: number;
  slot: Pt | null;
  dropC: Pt | null;
  dropF0: number;
  dropF1: number;
};

const PROBLEMS: Problem[] = [
  {
    i: 0,
    lift: 28,
    arrive: 68,
    seed: 0.19,
    r: PROBLEM_R[0],
    slot: { x: 555, y: 350 },
    dropC: { x: 545, y: 200 },
    dropF0: 73,
    dropF1: 99,
  },
  {
    i: 1,
    lift: 100,
    arrive: 150,
    seed: 0.63,
    r: PROBLEM_R[1],
    slot: { x: 552, y: 250 },
    dropC: { x: 530, y: 170 },
    dropF0: 155,
    dropF1: 172,
  },
  {
    i: 2,
    lift: 178,
    arrive: 232, // never reached inside the cut: it is 47% up the arc at f203
    seed: 0.81,
    r: PROBLEM_R[2],
    slot: null,
    dropC: null,
    dropF0: Infinity,
    dropF1: Infinity,
  },
];

const ARC_TABLES = PROBLEMS.map((p) => arcTable(p.seed));

/** The distance from a problem's rim to the mark's disc, for a given fraction of
 *  the arc's length and a given frame (the mark drifts, so the frame matters). */
const distAt = (p: Problem, frac: number, f: number) => {
  const c = arcAt(p.seed, tAtLen(ARC_TABLES[p.i], frac));
  return Math.hypot(c.x - COLUMN.x, c.y - lineY(f)) - (MODEL_EDGE + p.r);
};

/** REST_AIR: the ring comes to rest with 2 world px between its rim and the
 *  mark's box rather than flush against it, so the mark's own drift can never
 *  push the two through each other. At the cut's zooms that is 3-4 screen px:
 *  the ring is touching. */
const REST_AIR = 2;

/** THE CONTACT, SOLVED FROM GEOMETRY. Two things come out of one bisection on
 *  the arc's own length: the fraction at which the ring's rim reaches the mark —
 *  which is where it STOPS, because a ring cannot travel into the disc it has
 *  landed on — and, walking the distance curve frame by frame against the mark's
 *  drifting y, the SUB-FRAME at which that happens. The flip is read off that
 *  frame and off nothing else, so it cannot drift from the touch that causes it. */
const CONTACT_FRAC: number[] = PROBLEMS.map((p, i) => {
  const at = (s: number) => distAt(p, s, p.arrive) - REST_AIR;
  if (at(1) > 0) return 1; // never gets there (problem 3 does not, inside the cut)
  let lo = 0;
  let hi = 1;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    if (at(mid) > 0) lo = mid;
    else hi = mid;
  }
  return i >= 0 ? hi : hi;
});

/** The ease along the arc: speed early out of the trainer's hands, settling into
 *  the mark, and it lands ON the contact fraction exactly at `arrive`. */
const TRAVEL_WARP = 0.8;
const rawFrac = (p: Problem, f: number) =>
  CONTACT_FRAC[p.i] * camEase(clamp01((f - p.lift) / (p.arrive - p.lift)), TRAVEL_WARP);

const CONTACT: number[] = PROBLEMS.map((p) => {
  let prev = distAt(p, rawFrac(p, p.lift), p.lift) - REST_AIR;
  for (let f = p.lift + 1; f <= LAST + 2; f++) {
    const cur = distAt(p, rawFrac(p, f), f) - REST_AIR;
    if (cur <= 0) {
      const span = prev - cur;
      return span > 1e-9 ? f - 1 + prev / span : f;
    }
    prev = cur;
  }
  return Infinity;
});

const travelFrac = (p: Problem, f: number) => Math.min(rawFrac(p, f), CONTACT_FRAC[p.i]);

/** The flip, as ONE 0..1 per problem per frame, read off the contact. */
const flipOf = (p: Problem, f: number) => clamp01((f - CONTACT[p.i]) / FLIP_F);

/** The drop: a slow ease (warp 1.25 — it falls away rather than setting off) from
 *  the contact point down into the landing slot, through one control point that
 *  keeps it out of the mass on the way. */
const DROP_WARP = 1.25;
const dropOf = (p: Problem, f: number) =>
  p.slot === null ? 0 : camEase(clamp01((f - p.dropF0) / (p.dropF1 - p.dropF0)), DROP_WARP);

/** Where problem `p`'s ring stands at frame `f`, sway included: on its arc while
 *  it travels, then falling into its slot.
 *
 *  THE SWAY IS DAMPED AS IT CLOSES ON THE MARK. Every ring in this clip carries
 *  its own <= 3.4 px drift, but a ring RESTING on the model's disc that still
 *  drifted would push into it, which is the one overlap the world does not
 *  allow; and a thing leaning on another thing does not float anyway. So the
 *  drift fades out over the last 45 world px of the approach and the drop brings
 *  it back as the ring falls free. */
const problemAt = (p: Problem, f: number): Pt | null => {
  if (f < p.lift) return null;
  const s = ringSway(f, p.seed);
  const d = dropOf(p, f);
  const base =
    d > 0 && p.slot && p.dropC
      ? bez2(arcAt(p.seed, tAtLen(ARC_TABLES[p.i], CONTACT_FRAC[p.i])), p.dropC, p.slot, d)
      : arcAt(p.seed, tAtLen(ARC_TABLES[p.i], travelFrac(p, f)));
  const gap = Math.hypot(base.x - COLUMN.x, base.y - lineY(f)) - MODEL_EDGE - p.r;
  const scale = Math.max(d, clamp01(gap / 45));
  return { x: base.x + s.dx * scale, y: base.y + s.dy * scale };
};

/** Everything that is a RING at frame `f`: the gathered mass, the one bright `?`
 *  above the line, and whichever problems are in the world. */
type LiveRing = { x: number; y: number; r: number; tag: string };
const ringsAt = (f: number): LiveRing[] => {
  const out: LiveRing[] = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const s = ringSway(f, q.seed);
    out.push({ x: GATHERED[i] + s.dx, y: q.y + s.dy, r: q.r, tag: `mass${i}` });
  }
  const sa = ringSway(f, ABOVE.seed);
  out.push({ x: ABOVE.x + sa.dx, y: ABOVE.y + sa.dy, r: ABOVE.r, tag: "above" });
  for (const p of PROBLEMS) {
    const c = problemAt(p, f);
    if (c) out.push({ x: c.x, y: c.y, r: p.r, tag: `problem${p.i}` });
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE ASSERTIONS. The module cannot be built with a ring overlapping another
// ring or the mark, with a problem crossing the level line, or with the line
// having moved.
// ---------------------------------------------------------------------------
/** Rim-to-rim air any two rings must keep on every frame. */
const CLEAR_PAD = 3;

const RING_AUDIT = (() => {
  let worstPair = { f: -1, a: "", b: "", gap: Infinity };
  let worstMark = { f: -1, a: "", gap: Infinity };
  let worstLine = { f: -1, gap: Infinity };
  for (let f = 0; f <= LAST; f++) {
    const rs = ringsAt(f);
    const ly = lineY(f);
    for (let i = 0; i < rs.length; i++) {
      const a = rs[i];
      for (let j = i + 1; j < rs.length; j++) {
        const b = rs[j];
        const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
        if (gap < worstPair.gap) worstPair = { f, a: a.tag, b: b.tag, gap };
      }
      const mg = Math.hypot(a.x - COLUMN.x, a.y - ly) - MODEL_EDGE - a.r;
      if (mg < worstMark.gap) worstMark = { f, a: a.tag, gap: mg };
      if (a.tag.startsWith("problem")) {
        const lg = a.y - a.r - ly; // the ring's TOP rim, below the line
        if (lg < worstLine.gap) worstLine = { f, gap: lg };
      }
    }
  }
  if (worstPair.gap < CLEAR_PAD) {
    throw new Error(
      `SolveInASecond: ${worstPair.a}/${worstPair.b} come within ${worstPair.gap.toFixed(2)} ` +
        `world px at f${worstPair.f} (floor ${CLEAR_PAD}).`,
    );
  }
  // -0.5 rather than 0: a problem RESTS on the mark's disc at contact, and the
  // sub-frame crossing lands it a fraction of a px inside.
  if (worstMark.gap < -0.6) {
    throw new Error(
      `SolveInASecond: ${worstMark.a} overlaps the mark by ${(-worstMark.gap).toFixed(2)} ` +
        `world px at f${worstMark.f}.`,
    );
  }
  if (worstLine.gap < 5) {
    throw new Error(
      `SolveInASecond: a problem's rim comes within ${worstLine.gap.toFixed(2)} world px of the ` +
        `level line at f${worstLine.f} — a problem handed up from below may never reach it.`,
    );
  }
  return { worstPair, worstMark, worstLine };
})();

const LINE_AUDIT = (() => {
  let lo = Infinity;
  let hi = -Infinity;
  let minV = { f: -1, v: Infinity };
  for (let f = 0; f <= LAST; f++) {
    const y = lineY(f);
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
    if (f > 0) {
      const v = Math.abs(lineV(f));
      if (v < minV.v) minV = { f, v };
    }
  }
  if (hi - lo > 6) {
    throw new Error(
      `SolveInASecond: the level line moves ${(hi - lo).toFixed(2)} world px across the cut; ` +
        `the whole cut is that it does not.`,
    );
  }
  if (!(minV.v > 0.002)) {
    throw new Error(`SolveInASecond: the mark stops dead at f${minV.f}.`);
  }
  return { excursion: hi - lo, minV };
})();

// ---------------------------------------------------------------------------
// THE CAMERA — its own keyed track through `trapShared.camKnots3` (one key per
// frame off a monotone Hermite, cy taken from the eased k so framing and zoom
// settle together) and the shared damper, with 24 frames of pre-roll so it is
// already moving at f0. Three glides and the drifts between them:
//
 //  ONCE IT HAS FOUND THE PAIR THE CENTRE IS THE PAIR'S OWN MIDPOINT, `PAIR_MID`
//  (420, 187), and it stays there: the trainer and the mark then sit at
//  540 -/+ 120k, i.e. SYMMETRIC ABOUT x 540 at every zoom, with their centre of
//  mass on screen y 835. The drifts below are +/- 7 world px off that midpoint —
//  enough that no window of the cut has a parked camera, far too little to break
//  the symmetry (11 screen px at k 1.6).
//
//   f-24 -> f26   the FIND: k 1.6, the centre easing from the mark alone
//                 (566, 40) out to the pair's midpoint (420, 188).
//   f26 -> f100   the DRIFT: 9 world px up and to the left, following the first
//                 problem up its arc. It is 0.2 screen px/f — nothing to see, and
//                 it is the difference between a camera that is holding and one
//                 that has been parked. (Measured before it: the mean screen
//                 speed of a fixed world point fell to 0.028 px/f across f60-100.)
//   f100 -> f140  the PUSH-IN: k 1.6 -> 1.85, capped there rather than at the cut
//                 brief's 2.0 so both the trainer and the mark keep >= 120 screen
//                 px of edge clearance at the tightest frame (measured: 226 on the
//                 trainer's left, 251 on the mark's right). The damper lands it
//                 ~f147, 11 frames before "second".
//   f159 -> f199  the PULL-BACK: k 1.85 -> 1.70, still running on the last frame.
// ---------------------------------------------------------------------------
const PAIR_MID = { x: (COLUMN.x + PERSON.x) / 2, y: (LINE_Y0 + PERSON.y) / 2 };
const CAM_KNOTS = [
  { f: 0, k: 1.6, x: 566, y: 40 },
  // x IS THE PAIR'S MIDPOINT FROM HERE ON, and does not move again: any drift
  // sideways is asymmetry, and a reversal in it is also where the damper stalls
  // (measured with a 5 px there-and-back drift: the mean screen speed of a fixed
  // world point fell to 0.089 px/f at f99). The camera's own life between the
  // glides is therefore a MONOTONE 14 px RISE in y — it follows the problems up
  // their arc and never turns round.
  { f: PRE + 26, k: 1.6, x: PAIR_MID.x, y: PAIR_MID.y - 11 },
  { f: PRE + 100, k: 1.605, x: PAIR_MID.x, y: PAIR_MID.y + 9 },
  { f: PRE + 140, k: 1.85, x: PAIR_MID.x, y: PAIR_MID.y - 9 },
  { f: PRE + 159, k: 1.85, x: PAIR_MID.x, y: PAIR_MID.y - 7 },
  { f: PRE + 199, k: 1.7, x: PAIR_MID.x, y: PAIR_MID.y + 7 },
  { f: PRE + 240, k: 1.675, x: PAIR_MID.x, y: PAIR_MID.y + 12 },
];
const CAM_LAST = PRE + DURATION + 4;
const CAM = camKnots3(CAM_KNOTS, CAM_LAST);

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCam3(f + PRE, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: c.cx + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const camAt = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
const kAt = (f: number) => camAt(f).k;
/** Where a world point sits on screen at frame `f`. */
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: WORLD_W / 2 + (wx - c.cx) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};

// ...and the set's two ceilings, asserted rather than hoped for.
const CAM_AUDIT = (() => {
  const pts: [number, number][] = [
    [COLUMN.x, LINE_Y0],
    [PERSON.x, PERSON.y],
    [COLUMN.x - 250, 500],
    [COLUMN.x + 250, 500],
    [COLUMN.x, 800],
    [ABOVE.x, ABOVE.y],
  ];
  let maxV = { f: -1, v: 0 };
  let maxDV = { f: -1, v: 0 };
  let minMean = { f: -1, v: Infinity };
  for (let f = 2; f <= LAST; f++) {
    let sum = 0;
    for (const [px, py] of pts) {
      const a = screenAt(f - 2, px, py);
      const b = screenAt(f - 1, px, py);
      const c = screenAt(f, px, py);
      const v1 = Math.hypot(b.x - a.x, b.y - a.y);
      const v2 = Math.hypot(c.x - b.x, c.y - b.y);
      sum += v2;
      if (v2 > maxV.v) maxV = { f, v: v2 };
      if (Math.abs(v2 - v1) > maxDV.v) maxDV = { f, v: Math.abs(v2 - v1) };
    }
    const mean = sum / pts.length;
    if (mean < minMean.v) minMean = { f, v: mean };
  }
  if (maxDV.v > 2.5) {
    throw new Error(
      `SolveInASecond: the camera's |dv| reaches ${maxDV.v.toFixed(2)} screen px/f^2 at ` +
        `f${maxDV.f} (ceiling 2.5).`,
    );
  }
  return { maxV, maxDV, minMean };
})();

/** THE FRAME'S EDGES. The composition rule this cut was re-framed for: neither
 *  the trainer nor the mark may be parked at an edge. Their outermost ink is
 *  walked over every frame of the cut, sway spent. */
const EDGE_AUDIT = (() => {
  let leftMost = { f: -1, x: Infinity };
  let rightMost = { f: -1, x: -Infinity };
  for (let f = 0; f <= LAST; f++) {
    const k = kAt(f);
    const pa = personAt(f);
    if (pa.opacity < 0.05) continue; // they are not in the picture yet
    const p = screenAt(f, PERSON.x, pa.y);
    const m = screenAt(f, COLUMN.x, lineY(f));
    const l = p.x - PERSON_INK_HW * k;
    const r = m.x + MODEL_EDGE * k;
    if (l < leftMost.x) leftMost = { f, x: l };
    if (r > rightMost.x) rightMost = { f, x: r };
  }
  if (leftMost.x < 120 || rightMost.x > 960) {
    throw new Error(
      `SolveInASecond: the pair reaches the frame's edge — trainer's left ink at ` +
        `${leftMost.x.toFixed(0)} (f${leftMost.f}, floor 120), mark's right ink at ` +
        `${rightMost.x.toFixed(0)} (f${rightMost.f}, ceiling 960).`,
    );
  }
  return { leftMost, rightMost };
})();

const RING_SPEED_AUDIT = (() => {
  let worst = { f: -1, tag: "", v: 0 };
  for (let f = 1; f <= LAST; f++) {
    if (kAt(f) < 1.6) continue;
    const now = ringsAt(f);
    const then = ringsAt(f - 1);
    for (const a of now) {
      const b = then.find((q) => q.tag === a.tag);
      if (!b) continue;
      const p = screenAt(f, a.x, a.y);
      const q = screenAt(f - 1, b.x, b.y);
      const v = Math.hypot(p.x - q.x, p.y - q.y);
      if (v > worst.v) worst = { f, tag: a.tag, v };
    }
  }
  if (worst.v > SPEED_CAP_SCREEN) {
    throw new Error(
      `SolveInASecond: ${worst.tag} moves ${worst.v.toFixed(1)} screen px at f${worst.f} ` +
        `(cap ${SPEED_CAP_SCREEN}).`,
    );
  }
  return worst;
})();

// ---------------------------------------------------------------------------
// THE HAND-OFF LINE. One white line at INK_LO, half stroke, drawn from the
// trainer's end over 14 frames on "give" and kept. It is the arc itself — the
// rings are the traffic on it, so it carries no packets of its own — and it ends
// on the MARK'S EDGE, which is why the last 36 px of it are seen through the
// open interior of whatever ring is resting there.
// ---------------------------------------------------------------------------
const HANDOFF_F0 = 23;
const HANDOFF_F1 = 37;
const ARC_D = (() => {
  const a = ARC;
  return (
    `M${a.p0.x.toFixed(2)} ${a.p0.y.toFixed(2)} ` +
    `C${a.c1.x.toFixed(2)} ${a.c1.y.toFixed(2)} ${a.c2.x.toFixed(2)} ${a.c2.y.toFixed(2)} ` +
    `${a.p3.x.toFixed(2)} ${a.p3.y.toFixed(2)}`
  );
})();

// ---------------------------------------------------------------------------

const SolveInASecond: React.FC<Props> = ({
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
  const cam = runCam3(frame + PRE, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const ly = lineY(frame);
  const person = personAt(frame);
  const handoff = smoothstep(clamp01((frame - HANDOFF_F0) / (HANDOFF_F1 - HANDOFF_F0)));
  const aboveSway = ringSway(frame, ABOVE.seed);

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
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the level line goes UNDER everything: a ring's stroke and its
                glyph occlude it, its open interior does not */}
            <LevelLine k={k} y={ly} half={760} />

            {handoff > 0 ? (
              <g style={{ filter: iconShadow(k) }} opacity={INK_LO}>
                <path
                  pathLength="1"
                  d={ARC_D}
                  fill="none"
                  stroke={INK}
                  strokeWidth={levelW(k)}
                  strokeLinecap="round"
                  strokeDasharray={`${handoff.toFixed(4)} 1`}
                />
              </g>
            ) : null}

            {/* THE PILE: every question the model has already climbed past,
                gathered and dim, exactly where cut 1 left it */}
            {QUESTIONS.map((q, i) => {
              const d = ringSway(frame, q.seed);
              return (
                <QuestionRing
                  key={`m${i}`}
                  x={GATHERED[i] + d.dx}
                  y={q.y + d.dy}
                  r={q.r}
                  solved={1}
                  k={k}
                />
              );
            })}

            {/* the one question still above the line, and never any nearer */}
            <QuestionRing
              x={ABOVE.x + aboveSway.dx}
              y={ABOVE.y + aboveSway.dy}
              r={ABOVE.r}
              solved={0}
              k={k}
            />

            {/* the problems the trainer hands up. A problem lifts from BEHIND
                the trainer — they are drawn over it — and fades up over its first
                nine frames, so it is posed rather than switched on. */}
            {PROBLEMS.map((p) => {
              const c = problemAt(p, frame);
              if (!c) return null;
              return (
                <QuestionRing
                  key={`p${p.i}`}
                  x={c.x}
                  y={c.y}
                  r={p.r}
                  solved={flipOf(p, frame)}
                  k={k}
                  opacity={smoothstep(clamp01((frame - p.lift) / 9))}
                />
              );
            })}
          </svg>

          {person.opacity > 0 ? (
            <PersonGlyph
              k={k}
              x={PERSON.x}
              y={person.y}
              h={PERSON_H}
              opacity={person.opacity}
            />
          ) : null}

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <ModelMark k={k} y={ly} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default SolveInASecond;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  give: defaultProps.beats.give,
  solve: defaultProps.beats.solve,
  second: defaultProps.beats.second,
  learning: defaultProps.beats.learning,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);
export const LINE_AT = (f: number) => lineY(f);

// ---------------------------------------------------------------------------
// MEASUREMENTS. Every claim in the report is read off this.
// ---------------------------------------------------------------------------
export const STATS = {
  duration: DURATION,
  lineY0: LINE_Y0,
  person: [PERSON.x, PERSON.y],
  massRings: QUESTIONS.length,

  /** THE MECHANISM: when each problem touches, flips and lands — all of it off
   *  the contact geometry, none of it off a frame number. */
  problems: PROBLEMS.map((p, i) => ({
    i,
    lift: p.lift,
    contactF: Number(CONTACT[i].toFixed(2)),
    flipDoneF: Number((CONTACT[i] + FLIP_F).toFixed(2)),
    contactAt: (() => {
      const c = arcAt(p.seed, tAtLen(ARC_TABLES[i], CONTACT_FRAC[i]));
      return [Number(c.x.toFixed(1)), Number(c.y.toFixed(1))];
    })(),
    contactDistWorld: Number(
      (
        Math.hypot(
          arcAt(p.seed, tAtLen(ARC_TABLES[i], CONTACT_FRAC[i])).x - COLUMN.x,
          arcAt(p.seed, tAtLen(ARC_TABLES[i], CONTACT_FRAC[i])).y - lineY(CONTACT[i]),
        ) -
        (MODEL_EDGE + p.r)
      ).toFixed(2),
    ),
    slot: p.slot ? [p.slot.x, p.slot.y] : null,
    drop: p.slot ? [p.dropF0, p.dropF1] : null,
    /** the frame the drop is within 1 world px of its slot */
    settledF: (() => {
      if (!p.slot) return null;
      for (let f = p.dropF0; f <= LAST; f++) {
        const c = problemAt(p, f);
        if (c && Math.hypot(c.x - p.slot.x, c.y - p.slot.y) <= 1 + 3.4) return f;
      }
      return null;
    })(),
    /** where it is on the last frame, as a fraction of the arc */
    fracAtLast: Number(travelFrac(p, LAST).toFixed(3)),
    rWorld: Number(p.r.toFixed(2)),
  })),
  contactDistanceWorld: Number(CONTACT_D.toFixed(2)),
  flipFrames: FLIP_F,

  /** The three audits the module refuses to build without. */
  clearances: {
    minRimGapAnyFramePair: [
      RING_AUDIT.worstPair.f,
      `${RING_AUDIT.worstPair.a}/${RING_AUDIT.worstPair.b}`,
      Number(RING_AUDIT.worstPair.gap.toFixed(2)),
    ],
    minGapToMark: [
      RING_AUDIT.worstMark.f,
      RING_AUDIT.worstMark.a,
      Number(RING_AUDIT.worstMark.gap.toFixed(2)),
    ],
    minProblemRimBelowLine: [
      RING_AUDIT.worstLine.f,
      Number(RING_AUDIT.worstLine.gap.toFixed(2)),
    ],
    /** the eye of the needle: how close a problem ever comes to a pile ring on
     *  its way up and its way down */
    minProblemToPile: (() => {
      let worst = { f: -1, a: "", b: "", gap: Infinity };
      for (let f = 0; f <= LAST; f++) {
        const rs = ringsAt(f);
        for (const a of rs.filter((q) => q.tag.startsWith("problem"))) {
          for (const b of rs.filter((q) => !q.tag.startsWith("problem"))) {
            const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
            if (gap < worst.gap) worst = { f, a: a.tag, b: b.tag, gap };
          }
        }
      }
      return [worst.f, `${worst.a}/${worst.b}`, Number(worst.gap.toFixed(2))];
    })(),
  },
  line: {
    excursionWorld: Number(LINE_AUDIT.excursion.toFixed(2)),
    minSpeed: [LINE_AUDIT.minV.f, Number(LINE_AUDIT.minV.v.toFixed(4))],
    yAt: [0, 68, 100, 150, 171, LAST].map((f) => [f, Number(lineY(f).toFixed(2))]),
  },

  /** The camera: zoom every 10 frames, and the ceilings. */
  kPer10: (() => {
    const rows: [number, number][] = [];
    for (let f = 0; f <= LAST; f += 10) rows.push([f, Number(kAt(f).toFixed(4))]);
    rows.push([LAST, Number(kAt(LAST).toFixed(4))]);
    return rows;
  })(),
  camera: {
    maxScreenSpeed: [CAM_AUDIT.maxV.f, Number(CAM_AUDIT.maxV.v.toFixed(2))],
    maxDV: [CAM_AUDIT.maxDV.f, Number(CAM_AUDIT.maxDV.v.toFixed(3))],
    minMeanSpeed: [CAM_AUDIT.minMean.f, Number(CAM_AUDIT.minMean.v.toFixed(3))],
  },
  /** The composition rule: the pair is never at an edge, and it is symmetric
   *  about x 540 once the camera has found it. */
  edges: {
    trainerLeftMostX: [EDGE_AUDIT.leftMost.f, Number(EDGE_AUDIT.leftMost.x.toFixed(0)), "floor 120"],
    markRightMostX: [
      EDGE_AUDIT.rightMost.f,
      Number(EDGE_AUDIT.rightMost.x.toFixed(0)),
      "ceiling 960",
    ],
    /** |(trainer.x + mark.x)/2 - 540| on screen, the worst frame after the find */
    worstAsymmetry: (() => {
      let worst = { f: -1, d: 0 };
      for (let f = 30; f <= LAST; f++) {
        const p = screenAt(f, PERSON.x, personAt(f).y);
        const m = screenAt(f, COLUMN.x, lineY(f));
        const d = Math.abs((p.x + m.x) / 2 - 540);
        if (d > worst.d) worst = { f, d };
      }
      return [worst.f, Number(worst.d.toFixed(1))];
    })(),
    /** ...and the unreached `?`, which has to stay in frame: it is the measure */
    aboveOnScreen: [0, 68, 133, 150, 171, LAST].map((f) => {
      const s = screenAt(f, ABOVE.x, ABOVE.y);
      return [f, Number(s.x.toFixed(0)), Number(s.y.toFixed(0)), Number((s.y - ABOVE.r * kAt(f)).toFixed(0))];
    }),
  },
  ringMaxScreenSpeed: [
    RING_SPEED_AUDIT.f,
    RING_SPEED_AUDIT.tag,
    Number(RING_SPEED_AUDIT.v.toFixed(2)),
    `cap ${SPEED_CAP_SCREEN}`,
  ],

  /** Stroke weights on screen, so the one family stays one family. */
  stroke: [0, 68, 145, LAST].map((f) => [
    f,
    Number(strokeScreen(kAt(f)).toFixed(2)),
    Number(((strokeW(kAt(f)) / 2) * kAt(f)).toFixed(2)),
  ]),

  /** THE COMPOSITION, on the beat stills: where the bright ink is, where the
   *  whole picture's centre of mass sits, and how low the bright ink goes. */
  frames: [0, 20, 28, 50, 68, 73, 100, 133, 150, 158, 171, 203].map((f) => {
    const k = kAt(f);
    const ly = lineY(f);
    const pts: { x: number; y: number; bright: boolean }[] = [];
    const push = (wx: number, wy: number, rr: number, bright: boolean) => {
      const s = screenAt(f, wx, wy);
      pts.push({ x: s.x, y: s.y + rr * k, bright });
      pts.push({ x: s.x, y: s.y - rr * k, bright });
    };
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      const d = ringSway(f, q.seed);
      push(GATHERED[i] + d.dx, q.y + d.dy, q.r, false);
    }
    const sa = ringSway(f, ABOVE.seed);
    push(ABOVE.x + sa.dx, ABOVE.y + sa.dy, ABOVE.r, true);
    for (const p of PROBLEMS) {
      const c = problemAt(p, f);
      if (c) push(c.x, c.y, p.r, flipOf(p, f) < 0.5);
    }
    push(COLUMN.x, ly, MODEL_EDGE, true);
    const pa = personAt(f);
    if (pa.opacity > 0.05) push(PERSON.x, pa.y, PERSON_INK_HW, true);
    const inFrame = pts.filter((p) => p.y > 0 && p.y < WORLD_H);
    const brightY = pts.filter((p) => p.bright).map((p) => p.y);
    const mass = inFrame.length ? inFrame.reduce((a, p) => a + p.y, 0) / inFrame.length : 0;
    return {
      f,
      k: Number(k.toFixed(3)),
      markOnScreen: (() => {
        const s = screenAt(f, COLUMN.x, ly);
        return [Number(s.x.toFixed(0)), Number(s.y.toFixed(0))];
      })(),
      personOnScreen: (() => {
        const s = screenAt(f, PERSON.x, personAt(f).y);
        return [Number(s.x.toFixed(0)), Number(s.y.toFixed(0))];
      })(),
      centreOfMassY: Number(mass.toFixed(0)),
      lowestBrightInkY: Number(Math.max(...brightY).toFixed(0)),
      highestBrightInkY: Number(Math.min(...brightY).toFixed(0)),
    };
  }),

  /** The one thing the cut is about: how far the unreached `?` above the line is
   *  at the start and at the end. */
  unreachedGapWorld: [
    Number((lineY(0) - (ABOVE.y + ABOVE.r)).toFixed(1)),
    Number((lineY(LAST) - (ABOVE.y + ABOVE.r)).toFixed(1)),
  ],
  ringRadii: [
    Number(Math.min(...QUESTIONS.map((q) => q.r)).toFixed(1)),
    Number(Math.max(...QUESTIONS.map((q) => q.r)).toFixed(1)),
    RING_R,
  ],
};
