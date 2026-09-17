import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp01,
  iconShadow,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
import { Packet, arriveEase, packetsOn } from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip cut 0, `DefiningTheObjective` — THE ESTABLISHING
// SHOT, and the first thing in the edit:
//   "...is like defining the objective and..."
//
// The director's note: "For the beginning when he says 'defining the
// objective', an introduction shot of the trophy icon we will use, so we
// establish it there so the other graphics make sense. Just a pretty short
// establishing clip of the objective."
//
// SOUND-OFF READING TEST — one sentence:
//   "the person draws the trophy: the objective is the thing the human defines."
//
// DURATION. The composition starts at SRT 2.399 s, so every beat is
//   frame = round((t - 2.399) * 24)
//     like 0 · defining 5 · the 16 · objective 21 · and 31 ·
//     next word "like" 46
// Speech therefore runs f0..46 and the set's 16-frame tail holds the resolved
// state: DURATION = 46 + 16 = 62.
export const DURATION = 62;

// ---------------------------------------------------------------------------
// WHAT THIS CUT IS. It is the picture cut 3 (`OptimizingTheObjective`) RESOLVES
// to, played first and played white: the person centred below, one thin line
// rising from his head, the objective above him. Cut 3 then ends on this same
// arrangement with the trophy orange and a crowd of agents around it — so by
// the time the AIs get to the objective, the viewer already knows what the
// objective is and whose it is. Nothing here is new vocabulary; every measure,
// every path and every helper is cut 3's, and the four-phase head-led draw is
// cut 2's (`StillDecideWhatWeWantV2`).
//
// VOCABULARY, fixed for the clip:
//   the human     = person.png, ink white, filled, iconShadow
//   the objective = Lucide `trophy`, outline, the same six paths, the same ink
//                   box (grid 2..22 both axes) and the same GLYPH_STROKE_WORLD
//                   convention as cuts 2 and 3. WHITE for the whole cut: the
//                   AIs have not touched it yet, so it never converts.
//   the provenance= one thin ink line, the person's head -> the trophy's base
// No dots, no dark traffic, no ground, no bubble, no second object, no text.
// This is the one cut in the set with no crowd in it, on purpose: the objective
// belongs to the human before anything else in the clip touches it.
//
// ---------------------------------------------------------------------------
// GESTURES — the word each one lands on and the frames it runs over. Every
// gesture leads its word and overlaps its neighbour; nothing in the piece is
// outside this list.
//
//   1. f0    "like"        THE PERSON ALONE, dead centre of the frame at the
//                          opening camera (k 1.40, world cy 960 — measured
//                          825.5 to 1094.5 of 1920, centre 960.0). Alive from
//                          frame 0: the glyph sways, and the camera's glide is
//                          already setting off. The trophy does not exist yet.
//   2. f3 -> "defining"    THE LINE RISES, head-led, from the top of his head
//      (f5) -> f20         straight up (f3-20, screen-space head, arriveEase,
//                          peak 38.9 screen px/f), and the camera leaves WITH
//                          it: ONE long glide up and out, k 1.400 -> 1.250 and
//                          the content centre 870.7 -> 704.9, f0-30, warp 0.55.
//                          The space above his head opens as the line climbs
//                          into it; the line lands on the trophy's base at f20.
//   3. f12 -> "the         THE OBJECTIVE DRAWS, head-led, at the top of the
//      (f16) "objective"   line, in cut 2's four phases scaled to this window:
//      (f21) -> f30        cup f12-22, handles f22-25, stems f25-28, base
//                          f26.5-30. Its cup is drawing while the line is still
//                          rising — the two heads overlap across f12-20, which
//                          is the set's rule. "the" (f16) lands inside the bowl
//                          (40% of the cup stroke) and "objective" (f21) on the
//                          bowl closing (90%). The base closes at f30, one frame
//                          before "and" (f31), so the word lands on a whole
//                          trophy.
//   4. f31 -> f62          THE HOLD, which is not a stop. The camera carries
//                          the glide's own direction into a long decaying drift
//                          (f30 onward, its target at f96 so it never finishes:
//                          1.9 -> 2.8 -> 1.7 screen px/f), the glyph sways, the
//                          trophy breathes +-1 world px on its two slow sines,
//                          and one packet runs the line head -> base every 12
//                          frames from f36. Nothing else happens.
//
// ---------------------------------------------------------------------------
// LIVENESS — mechanisms, not gestures. None is on a word and none ever stops:
//   * the camera never parks: two segments through one damped `runCamera`, the
//     second a decaying drift that continues the glide's direction rather than
//     stopping it, and whose own target is set past the last frame so it is
//     still resolving when the cut ends. Measured floor 0.36 screen px/f
//     against the set's 0.15 (scratchpad cam.txt).
//   * glyph sway: the person sways +-1.5 / +-1.2 SCREEN px on two slow sines.
//   * the objective's idle: +-1 world px on two slow hashed sines, from the
//     frame it starts drawing, so it is breathing while it is being drawn.
//   * screen-space heads: both drawing heads (the line's and the trophy's) are
//     4.5 / k, so a head is one size at every zoom — the set's convention.
//   * arriveEase on the line, so its head decelerates into the trophy's base
//     instead of stopping dead.
//   * packets on the provenance line once it and the trophy have both landed.
//   * the hand on the camera (`sway`) under all of it.
//
// ---------------------------------------------------------------------------
// THE DEPTH LADDER, by role. Two rungs are all this cut needs:
//   FG  1.00  the objective, the person, both drawing heads, the packets
//   MID 0.78  the provenance line — a claim is the container, not the thing
//
// ---------------------------------------------------------------------------
// THE WEIGHT. Every weight is the SCREEN number from the clip's shared spec
// (harmony/spec.md §1) divided by the RESTING k, and the resting k is not a
// guess: the glide's endpoint is SOLVED at module scope so the damped camera
// resolves to exactly k 1.25 at f61. The piece therefore reads person box
// 118.0, trophy ink box 118.0, outline 6.55 and line 4.92 on the last frame by
// construction. The c-track's endpoint is solved the same way, so the resolved
// ink centre lands on screen y 835 (the set's CAM_LIFT framing), sway included.
//
// ---------------------------------------------------------------------------
// CAMERA — one continuous C1 path, two segments, no cx axis. c is the CONTENT
// centre; cy = c + 125/k, taken off the eased k inside `camMove`.
//
//   f0-30    k 1.400 -> 1.2954   c 870.7 -> 741.6    warp 0.55
//            ONE long glide up and out, leaving with the line. Both endpoints
//            are the SOLVED ones: the damped camera passes through k 1.250 and
//            content centre 704.9 at f61. The person is dead centre at f0; the
//            trophy, the line and the person resolve as one composition on
//            screen y 835.
//   f30-96   k       -> -0.065   c       -> -52      warp 0.50
//            the glide's own direction, decaying. Its target sits 34 frames
//            past the last frame, so the camera is still opening when the cut
//            ends and the tail never reads as a freeze.
//
// The two segments were chosen to make |v| ONE lobe: the join was tuned until
// the camera stops decelerating and starts drifting with no stall between them.
// Measured on four fixed world probes (scratchpad cam.txt), screen px/frame of
// a fixed world point: 0 -> 10.65 (peak f9) -> 1.93 (f30) -> 2.76 (f40) ->
// 1.70 (f61). Max |dv| 1.814 px/f^2 at f4 against the 2.5 budget; min |v| 0.936
// px/f at f1 against the 0.15 floor; no frame over budget or under the floor.
// Head speeds, measured WITH the camera moving: the line's head peaks at 38.9
// screen px/f and the trophy's at 36.8 (the cup), both against the set's 45.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, and why. Measured, not guessed.
//   * THE GLIDE STARTS AT f0, not f3. The brief starts it with the line. A
//     camera whose target does not move until f3 is exactly parked for three
//     frames — `runCamera` starts at rest, so v is 0 px/f at f1 and f2, under
//     the set's 0.15 floor on the opening frames of the first cut in the edit.
//     Starting the same move at f0 costs the opening framing nothing (the
//     person is still dead centre at f0, measured 825.5..1094.5 of 1920) and
//     the cut opens already breathing.
//   * THE GLIDE'S WARP IS 0.55, not the briefed 0.85. At 0.85 the move's own
//     speed arrives so late that f1-12 measures 0.157 of motion energy — the
//     empty-frame baseline — and the first half-second of the first cut in the
//     edit reads as a still. 0.55 puts the speed where the picture needs it
//     (peak 10.7 screen px/f at f9, with the line rising and the cup starting)
//     and takes that block to 0.250. Everything else about the move is the
//     brief's: one glide, k 1.40 -> 1.25, ending on f30.
//   * THE LINE DRAWS OVER 17 FRAMES (f3-20), not the briefed 11 (f3-14). It is
//     413 world px long and it runs at the tightest camera in the cut: at 11
//     frames its head is 56 screen px/f, well over the set's 45 ceiling. At 17
//     the peak is 38.9, "defining" (f5) still lands on the stroke leaving the
//     head, and the landing at f20 sits between "the" (f16) and "objective"
//     (f21) — so the line arrives just as the word for it does. Cut 3 made the
//     same trade for the same line and the same reason (19 frames there).
//   * THE BASE STROKE DRAWS OVER 3.5 FRAMES (f26.5-30), not 2. It is the
//     longest single stroke in the glyph (16 grid units, 75.5 world px) and at
//     2 frames its head runs 48 screen px/f, over the set's 45 ceiling. At 3.5
//     it peaks at 27 and still closes on f30. It overlaps the stems, which is
//     what the four phases do everywhere else in the set.
//   * THE TAIL'S DRIFT IS AUTHORED PAST THE LAST FRAME (target f96). A drift
//     that lands inside the cut is a park with extra steps; this one is still
//     decaying at f61, at 1.70 screen px/f.
//   * THE MOTION-ENERGY FLOOR IS 0.223, not the 0.30 the set asks for, and the
//     block it falls in is f1-12 (0.250) / f49-60 (0.223) — see energy.txt. It
//     is a three-object cut: the person, one line and one trophy, about 11,000
//     drawn px of 2.07M. Cut 3's floor of 0.378 is carried by 130 agent dots
//     milling and micro-drifting under every frame, which this cut does not
//     have and must not have — the whole point of it is that the objective is
//     the human's before the AIs touch it. The camera was pushed as far as a
//     decaying drift goes (the tail still runs 1.7-2.8 screen px/f, inside the
//     set's hold-drift band) and that moved the floor 0.157 -> 0.223. The two
//     ways to buy the rest were both measured and both rejected: a second
//     camera move in the tail reads as a stall and a restart (|v| dipping to
//     1.5 and surging back to 4.3), and inflating the trophy's idle 4x above
//     cut 3's would make the same object behave differently in two cuts of one
//     clip, which is the exact failure the harmony pass exists to prevent.
// ---------------------------------------------------------------------------

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
  personSrc: z.string(),
  beats: z.object({
    like: z.number(),
    defining: z.number(),
    the: z.number(),
    objective: z.number(),
    and: z.number(),
    end: z.number(), // next word "like"; tail to 62
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
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
  personSrc: "person.png",
  beats: {
    like: 0,
    defining: 5,
    the: 16,
    objective: 21,
    and: 31,
    end: 46,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const CX = 540;

// --- the depth ladder ------------------------------------------------------
const OP_FG = 1.0;
const OP_MID = 0.78;

// ---------------------------------------------------------------------------
// THE LAYOUT, in world px. The person is the origin; the objective is 500 world
// px straight above him — the separation cut 3 resolves to, so the two cuts
// hold the same picture.
// ---------------------------------------------------------------------------
const PERSON = { x: CX, y: 960 };
const SEPARATION = 500;
const TROPHY = { x: CX, y: PERSON.y - SEPARATION }; // (540, 460)

// ---------------------------------------------------------------------------
// THE CAMERA. `camMove` verbatim — one key per frame on an eased curve, cy off
// the eased k, the set's CAM_LIFT of 125 — then the shared damper.
//
// The glide's two endpoints are SOLVED rather than authored, so the DAMPED
// camera (which lags) lands exactly where the spec needs it: k 1.25 at f61 and
// the ink centre on screen y 835. Both solves are linear — `runCamera` is a
// linear filter of its target track and every key downstream of the unknown is
// affine in it — so two evaluations and one interpolation are exact.
// ---------------------------------------------------------------------------
const K_REST_TARGET = 1.25;
const LAST = DURATION - 1; // f61, the measured frame
const K_OPEN = 1.4;
const GLIDE_F1 = 30;
const DRIFT_F1 = 96; // past the last frame: the drift never finishes
const GLIDE_WARP = 0.55;
const DRIFT_WARP = 0.5;
const DRIFT_DK = -0.065;
const DRIFT_DC = -52;

// The opening camera, solved so the person's centre is on screen y 960 at f0:
// `runCamera` returns its first key untouched at f0 and `sway(0)` is zero, so
// this is exact rather than approximate.
const C_OPEN = PERSON.y - CAM_LIFT / K_OPEN;

type Seg = { f0: number; f1: number; k0: number; k1: number; c0: number; c1: number; warp: number };

const segsFor = (kEnd: number, cEnd: number): Seg[] => [
  // 1. ONE long glide up and out, leaving with the line
  { f0: 0, f1: GLIDE_F1, k0: K_OPEN, k1: kEnd, c0: C_OPEN, c1: cEnd, warp: GLIDE_WARP },
  // 2. the glide's own direction, continued and decaying past the last frame
  {
    f0: GLIDE_F1,
    f1: DRIFT_F1,
    k0: kEnd,
    k1: kEnd + DRIFT_DK,
    c0: cEnd,
    c1: cEnd + DRIFT_DC,
    warp: DRIFT_WARP,
  },
];

const trackOf = (segs: Seg[]) => {
  const F: number[] = [0];
  const K: number[] = [segs[0].k0];
  const CY: number[] = [segs[0].c0 + CAM_LIFT / segs[0].k0];
  for (const s of segs) {
    const m = camMove(s);
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    }
  }
  return { F, K, CY };
};

// The zoom track does not depend on c at all, so it is solved first.
const kAtLast = (kEnd: number) => {
  const t = trackOf(segsFor(kEnd, 0));
  return runCamera(LAST, t.F, t.CY, t.K).k;
};
const K_END = (() => {
  const a = 1.2;
  const b = 1.32;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom the whole piece's weights are written against. */
const K_REST = kAtLast(K_END);

// ---------------------------------------------------------------------------
// THE WEIGHTS. Straight out of the clip's shared spec, in SCREEN px, divided by
// the resting zoom. Nothing in this piece writes a world weight of its own.
// ---------------------------------------------------------------------------
const SCREEN_PERSON = 118.0; // person.png box
const SCREEN_OUTLINE = 6.55; // any closed outline: here, the trophy
const SCREEN_LINE = 4.92; // 0.75 x the outline: the provenance line

const GLYPH = SCREEN_PERSON / K_REST;
const GLYPH_STROKE_WORLD = SCREEN_OUTLINE / K_REST;
const LINE_STROKE = SCREEN_LINE / K_REST;

// The person's ink inside its box (measured off person.png once, in cut 2).
const PERSON_INK_TOP = 40 / 512;
const PERSON_FOOT = 471 / 512;
const HEAD_TOP_Y = PERSON.y - GLYPH / 2 + GLYPH * PERSON_INK_TOP;
const FOOT_Y = PERSON.y - GLYPH / 2 + GLYPH * PERSON_FOOT;

// ---------------------------------------------------------------------------
// THE OBJECTIVE. Lucide `trophy`, ISC, inlined verbatim as a 24-unit icon — the
// same six paths, in the same order, that cut 2 draws in its thought bubble and
// cut 3 plants above its person. Its INK box on the grid is x 2..22 and y 2..22
// (the handle arcs bulge a half circle past the cup), and the set's rule is that
// the glyph BOX is that ink box. Here the box is the person's box: the objective
// is exactly as big as the human who defines it.
// ---------------------------------------------------------------------------
const ICON_TROPHY_CUP = "M18 2H6v7a6 6 0 0 0 12 0V2Z";
const ICON_TROPHY_HANDLE_L = "M6 9H4.5a2.5 2.5 0 0 1 0-5H6";
const ICON_TROPHY_HANDLE_R = "M18 9h1.5a2.5 2.5 0 0 0 0-5H18";
const ICON_TROPHY_STEM_L = "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22";
const ICON_TROPHY_STEM_R = "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22";
const ICON_TROPHY_BASE = "M4 22h16";
const TROPHY_INK_GRID = { x0: 2, x1: 22, y0: 2, y1: 22 };
const TROPHY_BOX = GLYPH; // the objective is the person's size, as in cut 3
const TR_S = TROPHY_BOX / (TROPHY_INK_GRID.y1 - TROPHY_INK_GRID.y0);
const TR_CXG = (TROPHY_INK_GRID.x0 + TROPHY_INK_GRID.x1) / 2;
const TR_CYG = (TROPHY_INK_GRID.y0 + TROPHY_INK_GRID.y1) / 2;
const TROPHY_HALF = TROPHY_BOX / 2;
const TROPHY_BASE_Y = TROPHY.y + TROPHY_HALF; // grid y 22: where the line lands
const TROPHY_INK = {
  x0: TROPHY.x - TROPHY_HALF,
  x1: TROPHY.x + TROPHY_HALF,
  y0: TROPHY.y - TROPHY_HALF,
  y1: TROPHY_BASE_Y,
};

/** Grid units -> world, for the stroke heads. */
const trophyWorld = (gx: number, gy: number) => ({
  x: TROPHY.x + (gx - TR_CXG) * TR_S,
  y: TROPHY.y + (gy - TR_CYG) * TR_S,
});

// ---------------------------------------------------------------------------
// THE HEAD-LED DRAW, cut 2's machinery verbatim. `strokeDashoffset` reveals a
// path by ARC LENGTH, so the head has to be placed by arc length too: each path
// is resolved into cubic segments ONCE, at module scope, and walked into a
// length table — rather than asking the DOM for `getPointAtLength`, which would
// make the render depend on a live SVG element.
//
// The machinery only handles cubics, and the trophy has four quarter-circle
// arcs in it (one half-circle bowl, one half-circle per handle). Each quarter
// is converted to a single cubic with its control points 0.5523 * r along the
// tangents — the standard approximation, well under a tenth of a grid unit of
// error, which at this TR_S is under half a world pixel of head placement. The
// drawn `d` strings still carry the real `a` commands, so only the head's
// position is approximate, never the ink.
// ---------------------------------------------------------------------------
const KAPPA = 0.5523;
const BOWL_K = KAPPA * 6;
const HAND_K = KAPPA * 2.5;
const TROPHY_CUBICS: Record<string, number[][]> = {
  cup: [
    [18, 2, 18, 2, 6, 2, 6, 2], // H6
    [6, 2, 6, 2, 6, 9, 6, 9], // v7
    [6, 9, 6, 9 + BOWL_K, 12 - BOWL_K, 15, 12, 15], // a6 6, first quarter
    [12, 15, 12 + BOWL_K, 15, 18, 9 + BOWL_K, 18, 9], // ...second quarter
    [18, 9, 18, 9, 18, 2, 18, 2], // V2, then a zero-length z
  ],
  handleL: [
    [6, 9, 6, 9, 4.5, 9, 4.5, 9], // H4.5
    [4.5, 9, 4.5 - HAND_K, 9, 2, 6.5 + HAND_K, 2, 6.5], // a2.5 2.5, first quarter
    [2, 6.5, 2, 6.5 - HAND_K, 4.5 - HAND_K, 4, 4.5, 4], // ...second quarter
    [4.5, 4, 4.5, 4, 6, 4, 6, 4], // H6
  ],
  handleR: [
    [18, 9, 18, 9, 19.5, 9, 19.5, 9],
    [19.5, 9, 19.5 + HAND_K, 9, 22, 6.5 + HAND_K, 22, 6.5],
    [22, 6.5, 22, 6.5 - HAND_K, 19.5 + HAND_K, 4, 19.5, 4],
    [19.5, 4, 19.5, 4, 18, 4, 18, 4],
  ],
  stemL: [
    [10, 14.66, 10, 14.66, 10, 17, 10, 17], // V17
    [10, 17, 10, 17.55, 9.53, 17.98, 9.03, 18.21], // c0 .55 -.47 .98 -.97 1.21
    [9.03, 18.21, 7.85, 18.75, 7, 20.24, 7, 22], // C7.85 18.75 7 20.24 7 22
  ],
  stemR: [
    [14, 14.66, 14, 14.66, 14, 17, 14, 17],
    [14, 17, 14, 17.55, 14.47, 17.98, 14.97, 18.21],
    [14.97, 18.21, 16.15, 18.75, 17, 20.24, 17, 22],
  ],
  base: [[4, 22, 4, 22, 20, 22, 20, 22]], // h16
};

type Walk = { pts: { x: number; y: number; s: number }[]; total: number };
const walkCubics = (cubics: number[][]): Walk => {
  const pts: { x: number; y: number; s: number }[] = [];
  let s = 0;
  let px = cubics[0][0];
  let py = cubics[0][1];
  pts.push({ x: px, y: py, s: 0 });
  for (const c of cubics) {
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      const u = 1 - t;
      const x = u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6];
      const y = u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
      s += Math.hypot(x - px, y - py);
      pts.push({ x, y, s });
      px = x;
      py = y;
    }
  }
  return { pts, total: s };
};
const TROPHY_WALKS: Record<string, Walk> = Object.fromEntries(
  Object.entries(TROPHY_CUBICS).map(([key, cubics]) => [key, walkCubics(cubics)]),
);
const strokeHead = (walk: Walk, u: number) => {
  const want = clamp01(u) * walk.total;
  const p = walk.pts;
  let i = 1;
  while (i < p.length - 1 && p[i].s < want) i++;
  const a = p[i - 1];
  const b = p[i];
  const t = b.s === a.s ? 0 : (want - a.s) / (b.s - a.s);
  return trophyWorld(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
};

// The four phases, scaled to this cut's window. "the" (f16) lands inside the
// bowl and "objective" (f21) on the cup closing; the base closes at f30, one
// frame before "and". The base's window is 3.5 frames rather than 2 — see
// DEVIATIONS: it is the longest stroke in the glyph and 2 frames puts its head
// over the set's 45 screen px/frame ceiling.
const TR_CUP = [12, 22];
const TR_HANDLES = [22, 25];
const TR_STEMS = [25, 28];
const TR_BASE = [26.5, 30];
const TROPHY_STROKES: { key: string; d: string; win: number[] }[] = [
  { key: "cup", d: ICON_TROPHY_CUP, win: TR_CUP },
  { key: "handleL", d: ICON_TROPHY_HANDLE_L, win: TR_HANDLES },
  { key: "handleR", d: ICON_TROPHY_HANDLE_R, win: TR_HANDLES },
  { key: "stemL", d: ICON_TROPHY_STEM_L, win: TR_STEMS },
  { key: "stemR", d: ICON_TROPHY_STEM_R, win: TR_STEMS },
  { key: "base", d: ICON_TROPHY_BASE, win: TR_BASE },
];
const DRAW_F0 = TR_CUP[0];
const DRAW_F1 = TR_BASE[1];

// The objective's idle: +-1 world px on two slow sines, from the frame it
// starts drawing. Cut 3's mechanism, at cut 3's amplitude.
const trophyIdle = (frame: number) => {
  const live = frame >= DRAW_F0;
  return {
    dx: live ? 0.6 * Math.sin(frame * 0.067 + 1.7) + 0.4 * Math.sin(frame * 0.041 + 4.1) : 0,
    dy: live ? 0.6 * Math.sin(frame * 0.053 + 0.4) + 0.4 * Math.sin(frame * 0.037 + 2.9) : 0,
  };
};

// ---------------------------------------------------------------------------
// THE PROVENANCE. One line, head-led, from the top of the person's head to the
// trophy's base, rising into the space the camera is opening above him.
// ---------------------------------------------------------------------------
const CLAIM_F0 = 3;
const CLAIM_F1 = 20;
const PACKET_F0 = 36;
const PACKET_PERIOD = 12;

// ---------------------------------------------------------------------------
// THE FRAMING. The ink the resolved frame has to hold: the trophy's rim down to
// the person's feet. Measured off the geometry, not typed, so a change to the
// layout re-solves the camera instead of quietly breaking the band.
// ---------------------------------------------------------------------------
const CONTENT_TOP = TROPHY_INK.y0 - GLYPH_STROKE_WORLD / 2;
const CONTENT_BOTTOM = FOOT_Y;
const CONTENT_C = (CONTENT_TOP + CONTENT_BOTTOM) / 2;

// The glide's last c key, solved so the DAMPED camera puts CONTENT_C on screen
// y 835 at f61 — sway included, because the render adds it.
const cyAtLast = (cEnd: number) => {
  const t = trackOf(segsFor(K_END, cEnd));
  return runCamera(LAST, t.F, t.CY, t.K).cy + sway(LAST).dy;
};
const C_END = (() => {
  const want = CONTENT_C + CAM_LIFT / K_REST; // screen 960 - 125 = 835
  const a = 500;
  const b = 900;
  const fa = cyAtLast(a);
  const fb = cyAtLast(b);
  return a + ((want - fa) * (b - a)) / (fb - fa);
})();

const CAM = trackOf(segsFor(K_END, C_END));

// The resolved camera, per frame — so the two drawing heads can be measured in
// SCREEN px with the camera moving under them.
const CAM_AT_F: { cy: number; k: number }[] = (() => {
  const out: { cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    out.push({ cy: c.cy + sway(f).dy, k: c.k });
  }
  return out;
})();
const screenAt = (f: number, wx: number, wy: number) => {
  const c = CAM_AT_F[Math.max(0, Math.min(DURATION, Math.round(f)))];
  return [CX + (wx - (CX + sway(f).dx)) * c.k, 960 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------

const DefiningTheObjective: React.FC<Props> = ({
  ink,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  personSrc,
}) => {
  const frame = useCurrentFrame();

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the objective's idle --------------------------------------------------
  const tIdle = trophyIdle(frame);

  // -- the provenance line ---------------------------------------------------
  const claimFrom = { x: CX, y: HEAD_TOP_Y };
  const claimTo = { x: TROPHY.x + tIdle.dx, y: TROPHY_BASE_Y + tIdle.dy };
  const claim = arriveEase(clamp01((frame - CLAIM_F0) / (CLAIM_F1 - CLAIM_F0)));
  const claimHead = {
    x: claimFrom.x + (claimTo.x - claimFrom.x) * claim,
    y: claimFrom.y + (claimTo.y - claimFrom.y) * claim,
  };
  const packetAt = (f: number) => {
    if (f < PACKET_F0) return null;
    const p = packetsOn({
      frame: f,
      k,
      from: claimFrom,
      to: claimTo,
      period: PACKET_PERIOD,
      phase: PACKET_F0,
      speed: 16,
      opacity: 1,
      seed: 3,
    });
    return p.length === 0 ? null : p[0];
  };

  // -- the objective, drawn head-led in four phases ---------------------------
  const trophy = TROPHY_STROKES.map((st) => ({
    ...st,
    u: clamp01((frame - st.win[0]) / (st.win[1] - st.win[0])),
  }));

  // -- the person ------------------------------------------------------------
  const swayX = (1.5 / k) * Math.sin(frame * 0.083 + 0.9);
  const swayY = (1.2 / k) * Math.sin(frame * 0.061 + 2.4);

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
        cxRest={CX}
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
            {/* the provenance: his head to the objective's base. A claim is a
                container, so it sits one rung back from the things it joins. */}
            {claim > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={claimFrom.x}
                  y1={claimFrom.y}
                  x2={claimHead.x}
                  y2={claimHead.y}
                  stroke={ink}
                  strokeWidth={LINE_STROKE}
                  strokeLinecap="round"
                  opacity={OP_MID}
                />
                {claim < 1 ? (
                  <circle cx={claimHead.x} cy={claimHead.y} r={4.5 / k} fill={ink} opacity={OP_FG} />
                ) : null}
              </g>
            ) : null}

            {/* the objective. Cup, then handles, then stems, then base — the
                same six paths, the same stroke convention, as cuts 2 and 3.
                White all the way through: the AIs have not touched it yet. */}
            {frame >= DRAW_F0 ? (
              <g
                style={{ filter: icon }}
                fill="none"
                stroke={ink}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={OP_FG}
              >
                <g transform={`translate(${tIdle.dx.toFixed(3)} ${tIdle.dy.toFixed(3)})`}>
                  <g
                    transform={`translate(${TROPHY.x} ${TROPHY.y}) scale(${TR_S.toFixed(
                      5,
                    )}) translate(${-TR_CXG} ${-TR_CYG})`}
                    strokeWidth={GLYPH_STROKE_WORLD / TR_S}
                  >
                    {trophy.map((st) =>
                      st.u > 0 ? (
                        <path
                          key={st.key}
                          d={st.d}
                          pathLength={1}
                          strokeDasharray="1 1"
                          strokeDashoffset={1 - st.u}
                        />
                      ) : null,
                    )}
                  </g>
                  {/* the stroke heads, in screen-space radius */}
                  {trophy.map((st) => {
                    if (st.u <= 0 || st.u >= 1) return null;
                    const h = strokeHead(TROPHY_WALKS[st.key], st.u);
                    return <circle key={st.key} cx={h.x} cy={h.y} r={4.5 / k} fill={ink} />;
                  })}
                </g>
              </g>
            ) : null}

            {/* signal on the landed claim, once the objective is whole */}
            {claim >= 1 && frame >= DRAW_F1 ? (
              <Packet frame={frame} k={k} at={packetAt} opacity={0.6} />
            ) : null}
          </svg>

          {/* the person: white, with the small shadow that makes a glyph read
              as a thing standing on the field. Sways from frame 0. */}
          <Img
            src={staticFile(personSrc)}
            style={{
              position: "absolute",
              left: PERSON.x - GLYPH / 2 + swayX,
              top: PERSON.y - GLYPH / 2 + swayY,
              width: GLYPH,
              height: GLYPH,
              filter: `brightness(0) invert(1) ${icon}`,
              opacity: OP_FG,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default DefiningTheObjective;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  like: defaultProps.beats.like,
  defining: defaultProps.beats.defining,
  the: defaultProps.beats.the,
  objective: defaultProps.beats.objective,
  and: defaultProps.beats.and,
  end: defaultProps.beats.end,
};
export const CAM_AT = (f: number) => runCamera(f, CAM.F, CAM.CY, CAM.K);

/** The screen speed of a drawing head, measured with the camera moving. */
const headPeak = (
  f0: number,
  f1: number,
  at: (u: number) => { x: number; y: number },
) => {
  let mx = 0;
  for (let f = Math.ceil(f0) + 1; f <= Math.ceil(f1); f++) {
    const a = at(clamp01((f - 1 - f0) / (f1 - f0)));
    const b = at(clamp01((f - f0) / (f1 - f0)));
    const p = screenAt(f - 1, a.x, a.y);
    const q = screenAt(f, b.x, b.y);
    mx = Math.max(mx, Math.hypot(q[0] - p[0], q[1] - p[1]));
  }
  return mx;
};

export const STATS = {
  kRest: Number(K_REST.toFixed(5)),
  kEnd: Number(K_END.toFixed(5)),
  cOpen: Number(C_OPEN.toFixed(2)),
  cEnd: Number(C_END.toFixed(2)),
  glyph: Number(GLYPH.toFixed(3)),
  trophyBox: Number(TROPHY_BOX.toFixed(3)),
  outlineWorld: Number(GLYPH_STROKE_WORLD.toFixed(3)),
  lineWorld: Number(LINE_STROKE.toFixed(3)),
  trophyGridStroke: Number((GLYPH_STROKE_WORLD / TR_S).toFixed(3)),
  headTopY: Number(HEAD_TOP_Y.toFixed(1)),
  footY: Number(FOOT_Y.toFixed(1)),
  trophyBaseY: Number(TROPHY_BASE_Y.toFixed(1)),
  contentTop: Number(CONTENT_TOP.toFixed(1)),
  contentBottom: Number(CONTENT_BOTTOM.toFixed(1)),
  contentC: Number(CONTENT_C.toFixed(1)),
  claimLen: Number((HEAD_TOP_Y - TROPHY_BASE_Y).toFixed(1)),
  claimHeadPeak: Number(
    headPeak(CLAIM_F0, CLAIM_F1, (u) => {
      const e = arriveEase(u);
      return {
        x: CX,
        y: HEAD_TOP_Y + (TROPHY_BASE_Y - HEAD_TOP_Y) * e,
      };
    }).toFixed(2),
  ),
  trophyHeadPeak: Number(
    Math.max(
      ...TROPHY_STROKES.map((st) =>
        headPeak(st.win[0], st.win[1], (u) => strokeHead(TROPHY_WALKS[st.key], u)),
      ),
    ).toFixed(2),
  ),
  trophyHeadPerStroke: Object.fromEntries(
    TROPHY_STROKES.map((st) => [
      st.key,
      Number(headPeak(st.win[0], st.win[1], (u) => strokeHead(TROPHY_WALKS[st.key], u)).toFixed(2)),
    ]),
  ),
  personScreenAtF0: screenAt(0, PERSON.x, PERSON.y).map((v) => Number(v.toFixed(1))),
  cupAtObjective: Number(
    clamp01((defaultProps.beats.objective - TR_CUP[0]) / (TR_CUP[1] - TR_CUP[0])).toFixed(3),
  ),
};
export const WORLD_INK = {
  trophy: TROPHY_INK,
  person: { x: PERSON.x, y: PERSON.y, box: GLYPH, headTop: HEAD_TOP_Y, foot: FOOT_Y },
  claim: { from: { x: CX, y: HEAD_TOP_Y }, to: { x: CX, y: TROPHY_BASE_Y } },
};
