import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";
import {
  CAM_AT as GT_CAM_AT,
  CURVE_AT as curveAt,
  DOT_R,
  DURATION as GT_DURATION,
  HEAD_R,
  SPINE_OPACITY,
  STREAM_V,
  STROKE,
  S_VIS_HI,
  arcTo,
  cometPath,
  spinePath,
} from "./GoodTrajectory";
import type { Drawn } from "./GoodTrajectory";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Children`, cut `SignsBeforeSerious` — the SECOND cut, which
// stands in the FIRST cut's world and annotates it:
// "that we would see signs before things got serious, in the same way that"
//
// DURATION. The composition starts at 5.160 s of the clip and speech ends at
// 8.400 s, so
//   DURATION = round((8.400 - 5.160) * 24) + 16 = 78 + 16 = 94
//
// Word onsets, frame = round((t - 5.160) * 24):
//   that 0 · we 8 · would 11 · SEE 14 · SIGNS 18 · BEFORE 29 · THINGS 42 ·
//   got 48 · SERIOUS 51 (ends 58) · IN 58 · the 62 · SAME 64 · way 67 ·
//   that 71 · speech ends 78 · tail 78-94.
export const DURATION = 94;

// ---------------------------------------------------------------------------
// THE EDITORIAL NOTE, which decides the whole shape of this cut. At f78 the
// editor cuts to the speaker's face for "when children grow up...". So this cut
// DOES NOT RESOLVE. Nothing lands on the last frame; the last gesture — the
// twin curve drawing itself in the empty lower right — is 40% done at f78 and
// 65% done at f94, still travelling, still unfinished. The 16-frame tail is not
// a hold, it is the same motion continuing in case the editor takes a few more
// frames. Every other moving thing (the stream sliding up the curve, the signs'
// drift, the camera's closing drift, which is still opening) is mid-motion at
// f78 too.
//
// ---------------------------------------------------------------------------
// CONTINUITY, AND WHAT IT IS NOT. This is not a new scene, it is the same world
// later. The edit gap between the two cuts is 1.28 s, so
//     world time = W0 + f, W0 = 110 = GoodTrajectory's 79 frames + 31 of gap
// and everything that decides how the picture LOOKS is `GoodTrajectory`'s: the
// same curve table, the same comet path, the same spine and its weights, the
// same palette, the same density, the same feathered and undulating crowd edge.
// Nothing is copied — this file imports all of it. The line is long since drawn
// and gone off the top, and every comet is aligned and ripe. The camera opens on
// cut 1's resolved framing WITH ITS CLOSING DRIFT ALREADY RUNNING (k 0.7933,
// content centre (552, 938), the same dk/dcx/dcy it had on its last frame), so
// the join is a continuation and not an establishing shot.
//
// What this cut does NOT inherit is the individual SEATS. There is a 1.28 s cut
// to the speaker's face between the two pieces, so no viewer can hold a comet in
// one against a comet in the other, and what arrives at world time 110 is not
// worth inheriting: cut 1's relaxed corridor has by then been shuffled by 130
// frames of hashed speed spread, and its feed generator only ever scored a new
// dot against the ten before it. Two builds tried to stand in that state and
// repair it; both failed, the first as fused pairs and the second as a knot of
// eighty comets travelling down the middle of an otherwise thin stream. The
// crowd is therefore seated afresh, as one rigid blue-noise strip — see THE
// STREAM.
//
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "three of them have broken away from the line and been ringed; further up,
//    past a mark across the line, they all swell; and a second, smaller line of
//    the same shape is starting to be drawn beside it."
//
// VOCABULARY, unchanged from cut 1: ORANGE is the AI models and nothing else;
// WHITE INK is everything we build — here the spine, the three rings, the
// threshold tick and the twin curve, all at the same stroke and all opaque
// (see SPINE OPACITY in cut 1).
//
// ---------------------------------------------------------------------------
// GESTURES — the word each lands on and the frames it runs over. Every gesture
// leads its word and overlaps its neighbour; nothing starts from a dead stop.
//
//  1. f3-40  "we would see      THE SIGNS. Three comets — and only three —
//            signs" (f14/f18)   stop being aligned. Each rotates its heading
//                               64 degrees off the tangent on the shortest arc
//                               over 12 frames, drops ripe -> deep (cut 1's
//                               unaligned state, run backwards), its comet
//                               shortens to the drifter length as the tone
//                               falls, and it peels out of the stream ALONG
//                               that new heading — accelerating to 20 world
//                               px/frame as it turns and then decaying to a
//                               drifter's 0.8 — and ends up 250-266 world px
//                               off the line, CLEAR OF THE CORRIDOR and clear
//                               of the stream flowing past its ring. They start
//                               at f3, f9 and f15, on alternating sides, never
//                               in unison. The stream keeps flowing past them.
//                               WE SEE IT: when a comet's deviation passes 30
//                               degrees a white ring draws on around it over 10
//                               frames, starting from the side that faces the
//                               line, and then travels with it. The ring is
//                               caused by the peel and by nothing else — its
//                               start frame is solved from the deviation, not
//                               keyed. The three close on f18 ("signs"), f24
//                               and f30.
//                               The camera glides in from the rest framing on
//                               to the lower stream over f4-30 (k 0.79 -> 1.10,
//                               see DEVIATIONS for why not 1.35).
//  2. f34-78 "before" (f29)     THE ORDER. One long glide up the curve so the three
//                               ringed signs slide down into the lower left and
//                               STAY there while the steep upper leg comes in
//                               at the top. The spatial order along the curve
//                               IS the word: the signs are below, the threshold
//                               is above.
//  3. f40-58 "things got        THE THRESHOLD. High on the steep leg (arc 1950,
//                               screen y 358 on "serious", 394 at the cut) a white
//            serious"           tick draws across the curve — a bar
//            (f42/f51)          perpendicular to the tangent, 230 world px
//                               long, at the spine's own stroke, centre-out
//                               over 10 frames, finished at f50. Every comet
//                               that crosses it swells to 1.45x its radius AND
//                               spreads: its lateral offset opens out by 1.6x on
//                               the same ramp, so the stream beyond the threshold
//                               is bigger by being WIDER and never fuses into a
//                               bed. The rule is on the comet's ARC POSITION, so
//                               the comets already past it at world time 110 are
//                               already big and the camera discovers them rather
//                               than being told. On f51 comets are mid-swell on
//                               the tick. No colour change, no flash.
//  4. f52-94 "in the same way   THE TWIN, and the cut's open end. The camera
//            that" (f58/f64)    eases back out to K_REST2, and in the empty
//                               lower right a second curve starts drawing: the
//                               SAME curve shape at 0.55x, a bare white spine
//                               with the same head and the same screen stroke,
//                               and NO DOTS on it — children are not orange,
//                               and this is only the analogy being set up. Its
//                               head starts at f58, is 40% along at f78 (the
//                               editor's cut) and 65% at f94, still travelling.
//                               The rings and the tick are all still in frame.
//
// LIVENESS — none of it is on a word and none of it stops:
//   * the stream, still flowing up the curve at one speed, and each comet's own
//     small slow wander on top of it
//   * the three signs' drift, which never settles
//   * the swell, which every comet reaching the tick performs
//   * the grid's parallax and its own drift
//   * the camera: an opening drift inherited from cut 1, three long glides and
//     a closing drift that is still running at f94
//
// ---------------------------------------------------------------------------
// CAMERA — cut 1's construction exactly: keyed per frame off `camEase`, cy from
// the EASED k, the zoom and the pan on their own contiguous timings, both axes
// through the shared damper. What is new here is that the camera has to REVERSE
// — in to the signs and back out — which cut 1 never did, and a reversal is the
// most expensive thing a camera can do against the 2.5 px/f^2 budget. Three
// things pay for it: the pan reverses once and not twice, the two reversals are
// staggered, and the pull-back is never allowed to land.
//
//   ZOOM  f0-4    k 0.7933 -> 0.7921  warp 1.00  cut 1's closing drift, inherited
//         f4-30   k        -> 1.1000  warp 0.95  the glide in, on to the signs
//         f30-46  k 1.1000 -> 1.1330  warp 1.00  not a hold: a slow keep-closing
//         f46-110 k        -> solved  warp 1.00  opening, and STILL OPENING at f94
//   PAN   f0-4    the inherited drift
//         f4-34   centre to the curve at s 1170, lifted 120 px toward the signs
//         f34-110 one bend through the curve at s 1620 on to the solved centre,
//                 on a progress built from two overlapping ramps, still moving
//                 when the composition ends
//
//   measured k: 0.79 f0 · 1.00 f24 · 1.07 f30 · 1.13 f46-51 · 1.08 f64 ·
//               0.95 f78 (the cut) · 0.80 f93, still opening
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * THE CLOSE VIEW IS k 1.10, NOT 1.35. The camera has to leave cut 1's
//     0.7933, reach the close view, and come back — a round trip — inside
//     2.5 px/f^2, while the pan makes a reversal of its own. Swept: at
//     K_CLOSE 1.35 the best phasing measures 4.69, at 1.30 4.37, at 1.22 2.88,
//     at 1.10 2.45. Everything else was already spent: the pan's "up the curve"
//     and "ease back out" were merged into one monotone move, the two reversals
//     were staggered (pan f34, zoom f46), and the pull-back was left unlanded.
//     1.10 against the opening 0.79 is still a 1.39x push and the rings resolve
//     at 86 screen px across, which is what the close view is for.
//   * THE PULL-BACK NEVER LANDS, and K at the cut is 0.95, not 0.80. The editor
//     cuts at f78; a camera that has settled by then is a camera that has
//     stopped, which is the one thing this cut must not do. So the opening leg
//     is keyed to f110 — past the end of the composition — and solved to read
//     0.95 on f78. It is at 0.80 by f93 and still opening on the last frame.
//     Removing the settle is also what brought the budget under 2.5.
//   * THE SIGNS END 200-230 WORLD PX OFF THE LINE, not 90-130. Measured, cut 1's
//     corridor has a 95th-percentile lateral offset of 130 world px, so a comet
//     that stops at 110 is still inside the flock: built that way first, the
//     rings read as circles drawn around dots in the crowd rather than around
//     comets that had left it. They now clear the corridor's own edge by ~70 px.
//   * THE THRESHOLD IS AT ARC 1950, not 2050-2150. The brief pins it to screen
//     y 330-420 on "serious" AND on the final frame; at 2090 the camera has not
//     come far enough up the curve by f51 and it sits at y 221. At 1950 it reads
//     355 on the word, 371 at f58, 394 at the cut and 392 at f93 — inside the
//     band on all four. Its right end is ~30 px outside the frame at f51 and
//     fully inside from f55; the whole bar is in frame for the rest of the cut.
//   * THE TWIN'S SHAPE STARTS AT ARC 960, not at cut 1's window start. The
//     curve's first 220 px are dead straight, so a twin drawn from there is a
//     plain diagonal stick for its whole visible life and the analogy never
//     reads. From 960 the bend arrives at about a third along, and the twin is
//     visibly the same shape by the editor's cut.
//   * THE TWIN IS PLACED OFF THE f78 CAMERA, not the last frame's. At f93 it
//     sits x 513..846, y 732..1203 — 28 px above the briefed box's top as the
//     camera keeps opening — and at f78, the frame that matters, x 501..899,
//     y 799..1361, inside the box and clear of the caption band. Placing it off
//     f93 instead put its drawn end at y 1490 on the cut frame.
//   * THIS CUT DOES NOT INHERIT CUT 1'S SEATS — see THE STREAM above. It is the
//     same world, the same curve, the same comet, the same density and the same
//     feathered edge, but the individual seats are new, because there is a 1.28 s
//     cut to the speaker between the two pieces and no dot in one can be compared
//     with a dot in the other. Two builds that did inherit them failed the same
//     way: cut 1's corridor has been shuffled by 130 frames of hashed speed
//     spread and its feed generator only ever scored a new dot against the ten
//     before it, so what arrives at world 110 is a queue with lumps in it. The
//     first build showed that as fused pairs; relaxing the pairs apart turned the
//     lumps into a knot of eighty comets travelling down the middle of the stream
//     with thin stretches either side. The strip is seated at a constant LINEAR
//     density and slides rigidly, so neither can happen by construction.
//     Measured, largest fused group at f0/f30/f51/f78/f93 across the three
//     builds: 8/8/7/10/12 -> 3/3/1/3/3 -> 1/1/1/1/1, and the linear density's
//     max:min ratio per 150 world px before the tick is now 1.16-1.28.
//   * NO FEED GENERATOR, NO SPEED SPREAD, NO EASED CORRECTION. All three were
//     mechanisms for repairing an inherited arrangement and all three are gone.
//     The strip runs from arc -300 to 3100, which covers every arc position the
//     camera reveals on any of the 94 frames with the pattern slid up to 651 px
//     along, so comets enter the frame at the lower left because they were always
//     there.
//   * THE SWELL RIDES THE WIDENING'S RAMP, not its own 8 frames. Given a short
//     ramp of its own a comet is at 1.45x within 56 world px of the tick while
//     the corridor around it has barely opened, and the stretch just above the
//     threshold fuses — measured, a group of six on f0. The widening's span is
//     itself rate limited per dot (200 world px near the line, up to 840 at the
//     corridor's edge) so the lateral motion stays inside 1.2 world px/frame and
//     an inner comet can never overtake an outer one.
//   * THE TICK IS 176 WORLD PX AT ARC 1900, and the pan's bend control carries a
//     +55 lift. All three move together: the brief asks for both ends of the bar
//     inside the frame with 40 px to spare on "serious" AND the bar inside screen
//     y 330-420 there and at the cut, and those pull in opposite directions
//     (anything that brings the right end in also lifts the bar). Solved: at f51
//     the bar spans x 847..1038 (margin 42) and y 358..413; at f78 x 707..868,
//     y 371..417.
//   * NOTHING ENTERS FRAME BY BEING BORN. The strip reaches from arc -300, below
//     the lowest position the camera ever reveals, so the comets that arrive at
//     the lower left in the wide frames were always there. That also removes the
//     failure the feed generator had: the camera opens for the whole second half,
//     so the frame's own entry cut walks back DOWN the origin leg, and anything
//     born against the cut at its moment of birth is born above ground that is
//     about to be revealed — which is exactly why the lower left used to thin out
//     as the frame widened.
//
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
  dotOpacity: z.number(),
  beats: z.object({
    that: z.number(),
    see: z.number(),
    signs: z.number(),
    before: z.number(),
    things: z.number(),
    serious: z.number(),
    same: z.number(),
    cut: z.number(), // the editor cuts to the speaker here; tail to 94
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
  dotOpacity: OP_UNREAD_DOT,
  beats: { that: 0, see: 14, signs: 18, before: 29, things: 42, serious: 51, same: 64, cut: 78 },
});

const CX = FRAME_W / 2;
/** World time is cut 1's clock carried on: 79 frames of cut 1 plus 31 of gap. */
export const W0 = 110;
const W = (f: number) => W0 + f;

// ---------------------------------------------------------------------------
// THE THRESHOLD TICK, high on the steep leg. The swell is a rule on a comet's
// ARC POSITION, not on the clock, so a comet that was already past it when this
// cut opens is already big and the ones still coming swell as they cross.
// ---------------------------------------------------------------------------
export const S_TICK = 1900;
const TICK_HALF = 88; // world px each side of the curve — a 176 px bar
const TICK_F0 = 40;
const TICK_F1 = 50;
const SWELL_MAX = 1.45;

// BEYOND THE TICK THE STREAM GETS BIGGER BY GETTING WIDER. Swelling the comets
// alone makes the upper leg fuse into one orange bed with the spine buried in
// it, so past the threshold the corridor also opens out: a comet's lateral
// offset scales by WIDEN_MAX over WIDEN_SPAN of arc. The span is not free — it
// is a sideways motion and it is rate limited exactly the way cut 1's
// contraction is, by the OUTERMOST dot:
//     lateral rate = (WIDEN_MAX - 1) * 1.5 * D_MAX * STREAM_V / WIDEN_SPAN
// which at the cap is 1.2 world px/frame against an along-curve speed of 7, i.e.
// 9.7 degrees; each comet's own wander takes another 0.39, and the two together
// stay inside the 15 degree bound the set works to (measured worst: 13.7).
const WIDEN_MAX = 1.6;
const WIDEN_SPAN_MIN = 200; // the briefed ~180, rounded to the cell
const WIDEN_RATE = 1.2; // world px/frame of lateral motion, the cap

/** The arc a comet at lateral `d` takes to cross the threshold, solved from the
 *  rate cap. It is at least WIDEN_SPAN_MIN and grows with |d|, so the rate is
 *  monotone in |d| and an inner comet can never overtake an outer one — the
 *  same property that made cut 1's contraction a uniform scaling. */
const widenSpan = (d: number) =>
  Math.max(WIDEN_SPAN_MIN, (1.5 * (WIDEN_MAX - 1) * Math.abs(d) * STREAM_V) / WIDEN_RATE);

/** How far through the threshold a comet is: 0 below it, 1 once it has spread.
 *  THE SWELL AND THE WIDENING RIDE THE SAME RAMP. Given its own short span the
 *  swell puts a comet at 1.45x its radius within 56 world px of the tick while
 *  the corridor around it has barely opened, and the stretch just above the
 *  threshold fuses into a bed — measured, a group of six on f0. A comet here
 *  never gets bigger without also getting further from its neighbours. */
const crossAt = (s: number, d: number) => smoothstep(clamp01((s - S_TICK) / widenSpan(d)));
export const swellAt = (s: number, d: number) => 1 + (SWELL_MAX - 1) * crossAt(s, d);
export const widenAt = (s: number, d: number) => 1 + (WIDEN_MAX - 1) * crossAt(s, d);

// ---------------------------------------------------------------------------
// THE STREAM: ONE RIGID BLUE-NOISE STRIP.
//
// Two builds of this cut tried to stand in cut 1's exact end state and repair
// it. Both failed, in the same way and for the same reason. Cut 1's corridor is
// a relaxed lattice that then runs for 130 frames with a hashed +-10% speed
// spread and a feed generator that only ever scored a new dot against the ten
// dots before it; by world time 110 the dots have shuffled 90-130 world px past
// each other and what is left is not a corridor but a queue with lumps in it.
// The first build showed that as fused pairs. The second relaxed the pairs
// apart and the lumps became what they always were: a knot of eighty comets
// travelling down the middle of the stream with thin stretches either side — a
// lump moving through a hose, which is worse than the fusing was.
//
// So this cut does not inherit the seats. It cannot need to: there is a 1.28 s
// cut to the speaker's face between the two pieces, and no viewer can compare a
// dot in one with a dot in the other. It inherits the WORLD — the same curve,
// the same comet, the same density, the same feathered edge, the same look —
// and seats the crowd afresh.
//
// The seating is ONE STRIP, built once:
//   * s is a jittered sequence at a constant STRIP_DENSITY of 0.14 comets per
//     world px of arc, so the LINEAR density is constant by construction; there
//     is no place on the curve that is denser than another and no place that is
//     thinner, at any frame.
//   * d is drawn from cut 1's own lateral profile — `feather` over the last
//     FEATHER_W cells, `wobble` undulating the nominal edge along s — by
//     inverse CDF, so the crowd keeps its feathered, undulating boundary.
//   * the whole set is then relaxed to a minimum separation: blue noise, not a
//     lattice and not a random scatter.
// The strip runs from below the lowest arc the camera ever reveals to beyond
// the top of frame at every one of the 94 frames, so nothing is ever born, fed
// or spawned: the comets below the frame simply arrive.
//
// And the strip is RIGID. Every aligned comet is s = seat + STREAM_V * f: the
// whole pattern slides along the curve at one speed. No speed spread, no eased
// correction, no frozen wear, no feed generator — all of that is gone from this
// cut. Nothing can drift into anything else, so no knot can ever form.
//
// What keeps it from reading as a texture is WANDER: each comet carries its own
// small slow wander, under +-3.4 world px on each axis on a hashed period of
// 55-80 frames. It is enough to stop the eye finding the pattern and small
// enough that the lateral component (0.50 world px/frame at its fastest) plus
// the threshold's widening (1.2) keeps a comet's velocity inside 14 degrees of
// the curve it is drawn along.
// ---------------------------------------------------------------------------
const STRIP_DENSITY = 0.14; // comets per world px of arc
const STRIP_S0 = -300; // below the lowest arc the camera ever shows
const STRIP_S1 = 3100; // above the top of frame on every one of the 94 frames
const STRIP_D = 150; // the corridor's half-width, cut 1's after contraction
const STRIP_CELL = 2.45 * DOT_R;
const STRIP_FEATHER = 4.5; // cells of falloff, cut 1's
const STRIP_WOBBLE = 26; // world px of undulation on the nominal edge, cut 1's
const SEP_K3 = 2.6; // min centre separation in mean radii
const SEP_RELAX3 = 0.55;
const SEP_PASSES3 = 36;
/** The arc-length metric shrinks on the inside of the bend, so a separation
 *  along s is worth less than that in world px there. Worst case over the arc
 *  this cut shows. */
const S_METRIC = 0.8;
const WANDER_A = 3.4; // world px, each axis
const WANDER_T0 = 55; // frames
const WANDER_T1 = 80;

/** The lateral profile, as a sampler. `feather` gives the density across d;
 *  this inverts its CDF once so a seat can be drawn from it directly. */
const LAT_CDF: number[] = (() => {
  const N = 240;
  const out: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const d = (i / N) * STRIP_D;
    out.push(out[i - 1] + feather((STRIP_D - d) / STRIP_CELL, STRIP_FEATHER));
  }
  const tot = out[N];
  return out.map((v) => v / tot);
})();
const latSample = (u: number) => {
  const N = LAT_CDF.length - 1;
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (LAT_CDF[m] < u) lo = m;
    else hi = m;
  }
  const a = LAT_CDF[lo];
  const b = LAT_CDF[hi];
  return ((lo + (u - a) / Math.max(1e-9, b - a)) / N) * STRIP_D;
};

export type Seat = { key: string; s: number; d: number; r: number; wa: number; wb: number };

export const STRIP: Seat[] = (() => {
  const len = STRIP_S1 - STRIP_S0;
  const n = Math.round(len * STRIP_DENSITY);
  const step = len / n;
  const out: Seat[] = [];
  for (let i = 0; i < n; i++) {
    const s = STRIP_S0 + (i + 0.5 + (hash(i, 11) - 0.5) * 0.85) * step;
    // the edge undulates along s exactly as cut 1's does
    const edge = 1 + (wobble(s, 2.3) * STRIP_WOBBLE) / STRIP_D;
    const sgn = hash(i, 12) < 0.5 ? -1 : 1;
    const d = sgn * latSample(hash(i, 13)) * edge;
    const g = feather((STRIP_D * edge - Math.abs(d)) / STRIP_CELL, STRIP_FEATHER);
    out.push({
      key: `p${i}`,
      s,
      d,
      r: DOT_R * (0.8 + 0.4 * hash(i, 14)) * (0.75 + 0.25 * g),
      wa: hash(i, 15) * Math.PI * 2,
      wb: hash(i, 16) * Math.PI * 2,
    });
  }

  // -- blue noise: relax to a minimum separation, in the world metric --------
  // Relaxed against the configuration BEYOND the threshold as well as before
  // it, by using each seat's widened lateral and swollen radius: a seat that
  // will cross the tick has to be clear of its neighbours there too.
  const conf = out.map((p) => ({ s: p.s, d: p.d, r: p.r }));
  const idx = conf.map((_, i) => i);
  for (let pass = 0; pass < SEP_PASSES3; pass++) {
    idx.sort((a, b) => conf[a].s - conf[b].s);
    let moved = 0;
    for (let a = 0; a < idx.length; a++) {
      const i = idx[a];
      for (let b = a + 1; b < idx.length; b++) {
        const j = idx[b];
        const dsRaw = conf[j].s - conf[i].s;
        if (dsRaw > 220) break;
        const ds = dsRaw * S_METRIC;
        const dd = conf[j].d - conf[i].d;
        const dist = Math.hypot(ds, dd);
        const need = SEP_K3 * 0.5 * (conf[i].r + conf[j].r);
        if (dist >= need || dist < 1e-6) continue;
        const push = ((need - dist) / 2) * SEP_RELAX3;
        conf[i].s -= (ds / dist / S_METRIC) * push;
        conf[i].d -= (dd / dist) * push;
        conf[j].s += (ds / dist / S_METRIC) * push;
        conf[j].d += (dd / dist) * push;
        moved++;
      }
    }
    if (moved === 0) break;
  }
  out.forEach((p, i) => {
    p.s = conf[i].s;
    p.d = Math.max(-STRIP_D * 1.15, Math.min(STRIP_D * 1.15, conf[i].d));
  });
  return out;
})();

/** A seat's state at frame f: the strip slid along the curve, its own wander on
 *  top, and the threshold's rules applied to where it is. */
const seatAt = (p: Seat, f: number) => {
  const T0 = WANDER_T0 + (WANDER_T1 - WANDER_T0) * hash(p.s, 21);
  const T1 = WANDER_T0 + (WANDER_T1 - WANDER_T0) * hash(p.s, 22);
  const s = p.s + STREAM_V * f + WANDER_A * Math.sin((2 * Math.PI * f) / T0 + p.wa);
  const wob = WANDER_A * Math.sin((2 * Math.PI * f) / T1 + p.wb);
  const dBase = p.d + wob;
  const d = dBase * widenAt(s, dBase);
  const c = curveAt(s);
  return {
    x: c.x + -c.ty * d,
    y: c.y + c.tx * d,
    r: p.r * swellAt(s, dBase),
    tone: 1,
    hd: Math.atan2(c.ty, c.tx),
    s,
  };
};

// ---------------------------------------------------------------------------
// THE THREE SIGNS. Three of cut 1's own dots, picked off the stream between
// arc 1040 and 1280 at world time 110 on ALTERNATING sides of the line and far
// enough apart that their rings never meet. Each peels toward the side it is
// already on, so no sign and no ring ever crosses the spine.
// ---------------------------------------------------------------------------
type Sign = { at: number; t0: number; side: 1 | -1 };
/** Where on the curve each sign is at f0, and which way it leaves. The comet
 *  itself is whichever seat in the strip is nearest that arc position on that
 *  side with room to get out — picked below, not hand-numbered, because the
 *  strip is solved and its seats have no names until it is. */
export const SIGNS: Sign[] = [
  { at: 1020, t0: 3, side: 1 },
  { at: 1140, t0: 9, side: -1 },
  { at: 1272, t0: 15, side: 1 },
];

const PEEL_ANG = (74 * Math.PI) / 180; // off the tangent, inside the briefed 55-75
const PEEL_TURN = 12; // frames the heading takes to get there — cut 1's ALIGN_F
const PEEL_FAST = 20; // world px/frame: it leaves with energy, it is not nudged
const PEEL_DECEL = 30; // frames from that down to a drifter's
const PEEL_DRIFT = 0.8; // world px/frame it never stops doing
const RING_TRIGGER = (30 * Math.PI) / 180; // the deviation that makes it visible
const RING_DRAW = 10; // frames the ring takes to close
export const RING_R = 2.3 * 2 * DOT_R; // 2.3 x the dot's diameter

type SignState = { x: number; y: number; hd: number; tone: number; r: number; dev: number };

/** Each sign's whole path, integrated once at module scope. A peeling comet
 *  MOVES ALONG ITS DRAWN HEADING — the velocity is the heading times a speed —
 *  so the tail can never disagree with the motion, which is the rule cut 1 was
 *  built on. The heading itself is authored: a shortest-arc rotation of
 *  PEEL_ANG off the tangent it had when it broke away. */
/** The seat each sign is: nearest the briefed arc position, on the briefed
 *  side, and not so far out that it has no stream to leave. */
export const SIGN_SEAT: number[] = SIGNS.map((sg) => {
  let best = -1;
  let score = Infinity;
  STRIP.forEach((p, i) => {
    if (Math.sign(p.d) !== sg.side) return;
    if (Math.abs(p.d) > 70) return; // it has to break OUT of the crowd
    const q = Math.abs(p.s - sg.at) + 0.35 * Math.abs(p.d);
    if (q < score) {
      score = q;
      best = i;
    }
  });
  return best;
});

export const SIGN_PATH: SignState[][] = SIGNS.map((sg, j) => {
  const seat = STRIP[SIGN_SEAT[j]];
  const out: SignState[] = [];
  const base0 = seatAt(seat, sg.t0);
  const hd0 = base0.hd;
  let x = base0.x;
  let y = base0.y;
  for (let f = 0; f <= DURATION + 1; f++) {
    if (f <= sg.t0) {
      const b = seatAt(seat, f);
      out.push({ x: b.x, y: b.y, hd: b.hd, tone: 1, r: b.r, dev: 0 });
      x = b.x;
      y = b.y;
      continue;
    }
    const t = f - sg.t0;
    const turn = smoothstep(clamp01(t / PEEL_TURN));
    const hdMid =
      hd0 +
      sg.side * PEEL_ANG * smoothstep(clamp01((t - 0.5) / PEEL_TURN));
    // out of the stream's speed, up through PEEL_FAST while it turns, then all
    // the way down to a drifter's: it breaks away, it is not nudged aside
    const u = clamp01((t - 0.5) / PEEL_DECEL);
    const speed =
      STREAM_V + (PEEL_FAST - STREAM_V) * smoothstep(clamp01((t - 0.5) / 8)) -
      (PEEL_FAST - PEEL_DRIFT) * smoothstep(u);
    x += Math.cos(hdMid) * speed;
    y += Math.sin(hdMid) * speed;
    out.push({
      x,
      y,
      hd: hd0 + sg.side * PEEL_ANG * turn,
      tone: 1 - turn, // ripe -> deep: cut 1's ladder, backwards
      r: seat.r,
      dev: PEEL_ANG * turn,
    });
  }
  return out;
});

/** The ring's own clock, SOLVED from the deviation rather than keyed: the first
 *  frame the comet is more than RING_TRIGGER off the tangent. */
export const RING_START = SIGN_PATH.map((path) => {
  for (let f = 0; f < path.length; f++) if (path[f].dev > RING_TRIGGER) return f;
  return Infinity;
});

const signAt = (j: number, f: number) =>
  SIGN_PATH[j][Math.max(0, Math.min(DURATION + 1, Math.round(f)))];

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
const GT_LAST = GT_CAM_AT(GT_DURATION - 1);
const GT_PREV = GT_CAM_AT(GT_DURATION - 2);
/** Cut 1's last camera, and the drift it was still running on that frame. */
export const K_IN = GT_LAST.k;
const C_IN = { x: GT_LAST.cx, y: GT_LAST.cy - CAM_LIFT / GT_LAST.k };
const D_IN = {
  k: GT_LAST.k - GT_PREV.k,
  x: GT_LAST.cx - GT_PREV.cx,
  y: GT_LAST.cy - CAM_LIFT / GT_LAST.k - (GT_PREV.cy - CAM_LIFT / GT_PREV.k),
};

// The zoom and the pan REVERSE in this cut — in to the signs, then back out —
// which cut 1 never had to do, and a reversal is the most expensive thing a
// camera can do against the |dv| budget: the tail of one move's deceleration
// and the head of the next one's acceleration point the same way and add. Two
// things keep it inside 2.5. First, the pan reverses ONCE and not twice: the
// briefed "glide up the curve" and "ease back out" are ONE monotone pan from
// the close view all the way to the resting centre, which happens to travel up
// the curve on the way. Second, the pan's reversal (f34) and the zoom's (f42)
// are STAGGERED by eight frames, so the two accelerations never land together.
const K_CLOSE = 1.10;
const K_HOLD = 1.03; // the close view keeps closing, slowly, while it is held
const F_IN = 34; // the pan's reversal
const F_HOLD = 30; // the zoom reaches the close view here...
const F_OUT = 46; // ...and only starts opening here, so the two never coincide
/** THE PULL-BACK NEVER LANDS. The editor cuts away at f78, so this cut has no
 *  resolved frame to settle on: the opening is keyed to run past the end of the
 *  composition and is solved to READ K_AT_CUT on f78, still opening, with the
 *  pan still travelling under it. That is also what makes the camera affordable.
 *  A round trip 0.79 -> 1.30 -> 0.82 that has to settle costs more than the
 *  2.5 px/f^2 budget however it is phased, because the deceleration into the
 *  close view, the acceleration out of it and the settle at the far end are
 *  three events in 70 frames; leaving the last one out removes it. */
const F_CUT = 78;
const K_AT_CUT = 0.95;
const TRACK_F1 = DURATION + 16;

/** Where the camera looks during the glide in and the glide up, as arc
 *  positions plus a lift off the curve toward the signs' side. */
const C1_S = 1170;
const C1_LIFT = -120; // world px along the curve's left normal: toward the signs
const C2_S = 1620;
const C2_LIFT = 55;

const centreOn = (s: number, lift: number) => {
  const c = curveAt(s);
  return { x: c.x + -c.ty * lift, y: c.y + c.tx * lift };
};

type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
type CSeg = {
  f0: number;
  f1: number;
  at: (g: number) => { x: number; y: number };
  warp: number;
  /** true: `at` is handed the RAW 0..1 of the segment and does its own easing. */
  raw?: boolean;
};

const contiguous = (segs: { f0: number; f1: number }[]) => {
  segs.forEach((s, i) => {
    if (s.f1 <= s.f0) throw new Error(`camera: f${s.f0}-${s.f1} is not a forward move`);
    if (i > 0 && segs[i - 1].f1 !== s.f0) {
      throw new Error(`camera: f${segs[i - 1].f1} does not meet f${s.f0}`);
    }
  });
};

const kTrack = (segs: KSeg[]) => {
  contiguous(segs);
  const K: number[] = new Array(TRACK_F1 + 1).fill(segs[0].k0);
  for (const s of segs) {
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++) {
      K[f] = s.k0 + (s.k1 - s.k0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    }
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) K[f] = s.k1;
  }
  return K;
};

const cTrack = (segs: CSeg[], K: number[]) => {
  contiguous(segs);
  const CXT: number[] = new Array(TRACK_F1 + 1).fill(0);
  const CC: number[] = new Array(TRACK_F1 + 1).fill(0);
  const p0 = segs[0].at(0);
  CXT.fill(p0.x);
  CC.fill(p0.y);
  for (const s of segs) {
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++) {
      const u = (f - s.f0) / (s.f1 - s.f0);
      const p = s.at(s.raw ? u : camEase(u, s.warp));
      CXT[f] = p.x;
      CC[f] = p.y;
    }
    const e = s.at(1);
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) {
      CXT[f] = e.x;
      CC[f] = e.y;
    }
  }
  return {
    F: Array.from({ length: TRACK_F1 + 1 }, (_, f) => f),
    CX: CXT,
    CY: CC.map((c, f) => c + CAM_LIFT / K[f]),
  };
};

const dampX = (upto: number, F: number[], CXT: number[], K: number[]) =>
  runCamera(upto, F, CXT, K).cy;

const K_SEGS = (kEnd: number): KSeg[] => [
  { f0: 0, f1: 4, k0: K_IN, k1: K_IN + D_IN.k * 4, warp: 1.0 },
  { f0: 4, f1: F_HOLD, k0: K_IN + D_IN.k * 4, k1: K_CLOSE, warp: 0.95 },
  // not a hold: a slow continued push, so the close view is never parked and
  // the deceleration into it never meets the acceleration out of it
  { f0: F_HOLD, f1: F_OUT, k0: K_CLOSE, k1: K_CLOSE * K_HOLD, warp: 1.0 },
  // and this one runs off the end of the composition: still opening at f94
  { f0: F_OUT, f1: TRACK_F1, k0: K_CLOSE * K_HOLD, k1: kEnd, warp: 1.0 },
];

const C_SEGS = (fx: number, fy: number): CSeg[] => {
  const a = { x: C_IN.x + D_IN.x * 4, y: C_IN.y + D_IN.y * 4 };
  const b = centreOn(C1_S, C1_LIFT);
  // The way OUT passes the curve at C2_S: the pan is one move but it is not a
  // straight line, it bends through that point, so the camera visibly travels
  // UP THE CURVE on its way back to the resting centre.
  const c = centreOn(C2_S, C2_LIFT);
  const bend = (g: number) => {
    // quadratic Bezier b -> c -> (fx, fy): C1 continuous, monotone, no stall
    const m = 1 - g;
    return {
      x: m * m * b.x + 2 * m * g * c.x + g * g * fx,
      y: m * m * b.y + 2 * m * g * c.y + g * g * fy,
    };
  };
  return [
    {
      f0: 0,
      f1: 4,
      warp: 1.0,
      at: (g) => ({ x: C_IN.x + D_IN.x * 4 * g, y: C_IN.y + D_IN.y * 4 * g }),
    },
    {
      f0: 4,
      f1: F_IN,
      warp: 0.95,
      at: (g) => ({ x: a.x + (b.x - a.x) * g, y: a.y + (b.y - a.y) * g }),
    },
    // One long move that also runs off the end — the pan is still travelling
    // when the editor cuts, which is the point of the cut — but its progress is
    // the SUM OF TWO OVERLAPPING RAMPS rather than one ease. A single ease over
    // 76 frames is far too slow in its first third (the camera was still down
    // among the signs on "serious") and dead flat in its last (it would park
    // exactly where it must not). Two overlapping ramps are monotone, C1, fast
    // enough to have travelled up the curve by f51, and still rising at f94
    // because the second ramp has not finished.
    {
      f0: F_IN,
      f1: TRACK_F1,
      warp: 1,
      raw: true,
      at: (u) => {
        const f = F_IN + u * (TRACK_F1 - F_IN);
        const g =
          0.5 * camEase(clamp01((f - F_IN) / 28), 1) + 0.5 * camEase(clamp01((f - 54) / 56), 1);
        return bend(g);
      },
    },
  ];
};

const trackOf = (kEnd: number, fx: number, fy: number) => {
  const K = kTrack(K_SEGS(kEnd));
  const c = cTrack(C_SEGS(fx, fy), K);
  return { F: c.F, K, CX: c.CX, CY: c.CY };
};

// ---------------------------------------------------------------------------
// THE RESTING FRAME, solved. It has to hold cut 1's corridor over its visible
// window AND the three signs with their rings, which stand further off the line
// than any dot does. The box is measured, K_REST2 is the largest zoom that fits
// it inside the caption-safe band, and the centre is the box's own.
// ---------------------------------------------------------------------------
const BAND2 = { x0: 110, x1: 970, y0: 200, y1: 1400 };
const FRAME_LAT2 = 0.8 * 160; // cut 1's measured corridor half-width

// What the resting frame has to hold is NOT cut 1's whole arc: it is this cut's
// own annotation — the three ringed signs at the bottom, the threshold tick at
// the top, and the stretch of corridor between them. Solving on cut 1's window
// instead put the tick at screen y 568 when the brief asks for 330-420, because
// that window reaches 400 world px above the tick and 200 below the signs and
// the extra was all margin. The corridor still runs out of the top and out of
// the lower left exactly as it did in cut 1 — it is the same picture, framed on
// what this cut is about.
const S_FRAME_LO = 980; // just below the lowest sign
const S_FRAME_HI = S_TICK + 170; // just above the tick

const FRAMING = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number, m: number) => {
    minX = Math.min(minX, x - m);
    maxX = Math.max(maxX, x + m);
    minY = Math.min(minY, y - m);
    maxY = Math.max(maxY, y + m);
  };
  for (let s = S_FRAME_LO; s <= S_FRAME_HI; s += 4) {
    const c = curveAt(s);
    for (const sgn of [-1, 1]) {
      add(c.x + -c.ty * sgn * FRAME_LAT2, c.y + c.tx * sgn * FRAME_LAT2, DOT_R);
    }
  }
  {
    const c = curveAt(S_TICK);
    add(c.x + -c.ty * TICK_HALF, c.y + c.tx * TICK_HALF, STROKE / 2);
    add(c.x + c.ty * TICK_HALF, c.y - c.tx * TICK_HALF, STROKE / 2);
  }
  for (let j = 0; j < SIGNS.length; j++) {
    for (const f of [F_CUT, DURATION - 1]) {
      const p = signAt(j, f);
      add(p.x, p.y, RING_R + STROKE / 2);
    }
  }
  // The zoom the box would allow, and the one actually used. Solving on this
  // cut's own elements alone gives 0.95, which would make a dot 16 screen px
  // where cut 1 resolved it at 14 — the two cuts are seconds apart in one edit
  // and the crowd cannot change size between them. So the resting zoom is cut
  // 1's, and the solve is kept as the CEILING it has to stay under.
  const fit = Math.min(
    (BAND2.x1 - BAND2.x0) / (maxX - minX),
    (BAND2.y1 - BAND2.y0) / (maxY - minY),
  );
  const kr = Math.min(fit, K_AT_CUT);
  // cx is the box's own centre; cy is ANCHORED ON THE TICK instead, because the
  // brief pins the threshold to screen y 330-420 on the resolved frame and the
  // box centre put it at 510. Solving
  //     390 = 960 + (tickY - (c + CAM_LIFT / k)) * k
  // for the content centre c lands it at 390 by construction, and the signs and
  // their rings still clear the caption band underneath (checked, lowest ink
  // 1434 against the 1450 line).
  const tickY = curveAt(S_TICK).y;
  const cy = tickY + (960 - 390) / kr - CAM_LIFT / kr;
  return { k: kr, fit, cx: (minX + maxX) / 2, cy, box: { minX, maxX, minY, maxY } };
})();

export const K_REST2 = FRAMING.k;

export const K_END = (() => {
  const at = (kEnd: number) => {
    const t = trackOf(kEnd, FRAMING.cx, FRAMING.cy);
    return runCamera(F_CUT, t.F, t.CY, t.K).k;
  };
  const a = K_AT_CUT * 0.6;
  const b = K_AT_CUT * 1.0;
  return a + ((K_AT_CUT - at(a)) * (b - a)) / (at(b) - at(a));
})();

const CENTRE_END = (() => {
  const cyAt = (fy: number) => {
    const t = trackOf(K_END, FRAMING.cx, fy);
    const c = runCamera(F_CUT, t.F, t.CY, t.K);
    return c.cy - CAM_LIFT / c.k;
  };
  const a = FRAMING.cy - 200;
  const b = FRAMING.cy + 200;
  const fy = a + ((FRAMING.cy - cyAt(a)) * (b - a)) / (cyAt(b) - cyAt(a));
  const cxAt = (fx: number) => {
    const t = trackOf(K_END, fx, fy);
    return dampX(F_CUT, t.F, t.CX, t.K);
  };
  const p = FRAMING.cx - 200;
  const q = FRAMING.cx + 200;
  const fx = p + ((FRAMING.cx - cxAt(p)) * (q - p)) / (cxAt(q) - cxAt(p));
  return { fx, fy };
})();

export const CAM = trackOf(K_END, CENTRE_END.fx, CENTRE_END.fy);

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    const x = dampX(f, CAM.F, CAM.CX, CAM.K);
    const d = sway(f);
    out.push({ cx: x + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
export const CAM_AT = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const SCREEN_AT = (f: number, wx: number, wy: number) => {
  const c = CAM_AT(f);
  return [CX + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE TWIN. The same curve shape at 0.55x, drawn as a bare spine with the same
// head, placed so that at the resting camera it sits wholly inside the empty
// lower right — screen x 420..980, y 760..1400 — and never reaches the main
// corridor. No dots: children are not the models, and the analogy is only being
// set up, not populated.
// ---------------------------------------------------------------------------
const TW_SCALE = 0.55;
const TW_S0 = 960;
const TW_S1 = S_VIS_HI;
const TW_BOX = { x0: 420, x1: 980, y0: 760, y1: 1400 };
const TW_F0 = 58;

/** The twin's own shape, before it is placed: the main curve's visible window,
 *  scaled about its own start. */
const twShape = (u: number) => {
  const a = curveAt(TW_S0);
  const p = curveAt(TW_S0 + (TW_S1 - TW_S0) * u);
  return { x: (p.x - a.x) * TW_SCALE, y: (p.y - a.y) * TW_SCALE };
};

/** Placed off the RESTING camera, so the box the brief gives is a screen box. */
export const TW_ORIGIN = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i <= 200; i++) {
    const p = twShape(i / 200);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  // placed off the camera at the EDITOR'''S CUT, not at the last frame: f78 is
  // the frame that has to be right, and it is the tighter of the two, so the
  // twin clears the caption band there and is comfortably inside the box by f93.
  const c = CAM_AT(F_CUT);
  const w = (sx: number, sy: number) => ({
    x: c.cx + (sx - CX) / c.k,
    y: c.cy + (sy - FRAME_H / 2) / c.k,
  });
  const lo = w(TW_BOX.x0 + STROKE * c.k, TW_BOX.y0 + STROKE * c.k);
  const hi = w(TW_BOX.x1 - STROKE * c.k, TW_BOX.y1 - STROKE * c.k);
  // centre the shape's own box inside the target box
  return {
    x: (lo.x + hi.x) / 2 - (minX + maxX) / 2,
    y: (lo.y + hi.y) / 2 - (minY + maxY) / 2,
    w: maxX - minX,
    h: maxY - minY,
    boxW: hi.x - lo.x,
    boxH: hi.y - lo.y,
  };
})();

const twAt = (u: number) => {
  const p = twShape(u);
  return { x: TW_ORIGIN.x + p.x, y: TW_ORIGIN.y + p.y };
};

/** The head's progress: authored so it is 40% along on the editor's cut and 65%
 *  on the last frame, decelerating slightly and never finishing. A short ease-in
 *  over the first 4 frames, so it does not start from a step. */
export const TW_U = (() => {
  const raw: number[] = [];
  let u = 0;
  for (let f = 0; f <= TRACK_F1; f++) {
    if (f <= TW_F0) {
      raw.push(0);
      continue;
    }
    const t = f - TW_F0;
    u += smoothstep(clamp01(t / 4)) * (1 - 0.30 * clamp01(t / 36));
    raw.push(u);
  }
  // scale so u(f78) = 0.40
  const scale = 0.4 / raw[78];
  return raw.map((v) => v * scale);
})();
const twU = (f: number) => TW_U[Math.max(0, Math.min(TRACK_F1, Math.round(f)))];

// ---------------------------------------------------------------------------
// THE WORLD, DRAWN.
// ---------------------------------------------------------------------------
const MAIN_SPINE_TO = 3000; // above this the curve is out of the top at every k

export const worldAt = (f: number): Drawn[] => {
  const out: Drawn[] = [];
  const skip = new Set(SIGN_SEAT);
  STRIP.forEach((p, i) => {
    if (skip.has(i)) return;
    const now = seatAt(p, f);
    const was = seatAt(p, f - 1);
    out.push({ ...now, key: p.key, vx: now.x - was.x, vy: now.y - was.y });
  });
  SIGNS.forEach((_sg, j) => {
    const p = signAt(j, f);
    const q = signAt(j, f - 1);
    out.push({
      key: `g${j}`,
      x: p.x,
      y: p.y,
      r: p.r,
      tone: p.tone,
      hd: p.hd,
      s: 0,
      vx: p.x - q.x,
      vy: p.y - q.y,
    });
  });
  return out;
};

const SignsBeforeSerious: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
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
  dotOpacity,
}) => {
  const frame = useCurrentFrame();

  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const camX = dampX(frame, CAM.F, CAM.CX, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const world = worldAt(frame);
  const toRipe = makeTone(accentDeep, accent);

  const spine = spinePath(0, MAIN_SPINE_TO);

  // -- the threshold tick -----------------------------------------------------
  const tickU = smoothstep(clamp01((frame - TICK_F0) / (TICK_F1 - TICK_F0)));
  const tick = (() => {
    const c = curveAt(S_TICK);
    const nx = -c.ty;
    const ny = c.tx;
    const h = TICK_HALF * tickU;
    return {
      x1: c.x - nx * h,
      y1: c.y - ny * h,
      x2: c.x + nx * h,
      y2: c.y + ny * h,
    };
  })();

  // -- the twin ---------------------------------------------------------------
  const tu = twU(frame);
  // the twin is parametrised 0..1, not in arc length, so it needs its own
  // sampling step — at the spine's own 6 the whole curve would be two points
  const twin = tu > 0 ? spinePath(0, tu, (u) => twAt(u), 1 / 260) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={W(frame)}
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
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the models */}
            {world.map((d) => {
              const p = cometPath(d);
              return p ? (
                <path key={d.key} d={p} fill={toRipe(d.tone)} opacity={dotOpacity} />
              ) : null;
            })}

            {/* everything we build, all on the same stroke, all opaque */}
            <g style={{ filter: icon }}>
              {/* the spine: long since drawn, no head — it left the top in cut 1 */}
              <path
                d={spine.d}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={SPINE_OPACITY}
              />

              {/* the threshold */}
              {tickU > 0 ? (
                <line
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={SPINE_OPACITY}
                />
              ) : null}

              {/* the rings: one per sign, drawn on from the side facing the
                  line once that sign's deviation has passed the trigger */}
              {SIGNS.map((_sg, j) => {
                const u = clamp01((frame - RING_START[j]) / RING_DRAW);
                if (u <= 0) return null;
                const p = signAt(j, frame);
                const c = 2 * Math.PI * RING_R;
                // the start of the sweep faces the line: back along the comet's
                // own heading, rotated to the inside
                const a0 = (Math.atan2(p.y - curveAt(0).y, p.x - curveAt(0).x) * 180) / Math.PI;
                return (
                  <circle
                    key={`r${j}`}
                    cx={p.x}
                    cy={p.y}
                    r={RING_R}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - u)}
                    transform={`rotate(${(a0 + 180).toFixed(1)} ${p.x.toFixed(2)} ${p.y.toFixed(2)})`}
                    opacity={SPINE_OPACITY}
                  />
                );
              })}

              {/* the twin, still being drawn when the editor cuts away */}
              {twin ? (
                <>
                  <path
                    d={twin.d}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={SPINE_OPACITY}
                  />
                  <circle
                    cx={twin.head.x}
                    cy={twin.head.y}
                    r={HEAD_R * Math.min(1, (frame - TW_F0) / 3)}
                    fill={ink}
                    opacity={SPINE_OPACITY}
                  />
                </>
              ) : null}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default SignsBeforeSerious;

export const STATS = {
  duration: DURATION,
  w0: W0,
  kIn: Number(K_IN.toFixed(4)),
  kClose: K_CLOSE,
  fIn: F_IN,
  fOut: F_OUT,
  kFit: Number(FRAMING.fit.toFixed(4)),
  kRest2: Number(K_REST2.toFixed(4)),
  kEnd: Number(K_END.toFixed(4)),
  kAtCut: Number(runCamera(F_CUT, CAM.F, CAM.CY, CAM.K).k.toFixed(4)),
  kTrack: [0, 4, 14, 20, 30, 40, 50, 58, 64, 76, 93].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
  signs: SIGNS.map((s, j) => ({
    seat: SIGN_SEAT[j],
    at: s.at,
    t0: s.t0,
    side: s.side,
    ringStart: Number(RING_START[j].toFixed(1)),
    ringClosed: Number((RING_START[j] + RING_DRAW).toFixed(1)),
  })),
  ringR: Number(RING_R.toFixed(1)),
  sTick: S_TICK,
  tickHalf: TICK_HALF,
  swellMax: SWELL_MAX,
  widenMax: WIDEN_MAX,
  widenSpan: [0, 50, 120, 160].map((d) => [d, Math.round(widenSpan(d))]),
  strip: STRIP.length,
  stripDensity: STRIP_DENSITY,
  twin: {
    scale: TW_SCALE,
    origin: [Number(TW_ORIGIN.x.toFixed(0)), Number(TW_ORIGIN.y.toFixed(0))],
    shape: [Number(TW_ORIGIN.w.toFixed(0)), Number(TW_ORIGIN.h.toFixed(0))],
    box: [Number(TW_ORIGIN.boxW.toFixed(0)), Number(TW_ORIGIN.boxH.toFixed(0))],
    u: [58, 68, 78, 88, 93].map((f) => [f, Number(twU(f).toFixed(3))]),
  },
  arcTo: typeof arcTo,
};
