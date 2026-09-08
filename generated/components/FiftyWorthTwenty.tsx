import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FRAME_H,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  camMove,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";

// The house type, loaded at module scope so a font failure surfaces before any
// frame renders. Roboto Condensed 700 is the only weight this cut uses.
const robotoCondensed = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const FPS = 24;
// Dylan Patel, clip `Dylan_Hockey_Stick`, cut 3: "But yeah, I think it's
// completely reasonable that China in 2029 can do 50 gigs. But if most of those
// are domestic chips, there is some factor there where that 50 gigawatts is
// really worth as much as 20 gigawatts in America."
//
// SRT span 0:52.719 -> 1:02.960 at 24fps.
// round((62.960 - 52.719) * 24) = round(10.241 * 24) = round(245.78) = 246
// frames of speech, plus a 16 frame tail so the resolved state holds = 262.
export const DURATION = 262;

// ---------------------------------------------------------------------------
// "The exchange". Fifty gigawatts is a countable block of fifty dots under the
// flag of China — ten wide and five tall, on the field's own crowd step. ALL
// FIFTY turn red: they are all domestic chips. Then the whole block crosses the
// empty right half of the frame and packs into a block of TWENTY. Ten of the
// twenty seats take THREE red dots and ten take TWO: the first to reach a seat
// sits down and turns ripe, the rest are absorbed into it. Fifty visibly
// becomes twenty, and the reason is on screen — two or three domestic gigawatts
// are worth one.
//
// And the fifty do not go away. A dot that leaves its seat leaves ITSELF behind
// there — a red dot at OP_UNREAD, the ladder's "present, not the subject" rung —
// so at the end the fifty are still countable under China at 0.45 while the
// twenty stand ripe and solid under the US. The comparison is on screen at once.
//
// TEXT. The client asked for the two quantities named, so this cut carries the
// only two labels in the set: "50 GIGAWATTS" under China and "20 GIGAWATTS"
// under the US, in the house type (Roboto Condensed 700, uppercase, tracked
// 0.11em). Both strings are props. No people, no floor. Nothing stands on
// anything: the two flags float and every position in the piece is measured off
// them, as in cut 2.
//
// FRAMING AND LAYOUT
//   China flag    cut 1's flag exactly — 240x160 on the shared squircle,
//                 FLAG_RED with the stars in the house accent — centred at
//                 world x 350, so x 230..470, y 1000..1160. It is the
//                 carry-over from cuts 1 and 2: present from f0, no entrance,
//                 never fades.
//   US flag       the same 240x160 squircle, centred at world x 730 and at
//                 the same y, so x 610..850, y 1000..1160. 13 stripes, a canton
//                 96 x 86.15, 50 stars in nine rows of 6/5. Absent before f130.
//                 The two axes are 380 apart (client pass 2, from 480).
//   the fifty     10 wide x 5 tall on the crowd step (940/39 = 24.10), centred
//                 under the China flag, its TOP ROW 40 world px below the
//                 flag's bottom edge: y 1200, 1224, 1248, 1272, 1296 and
//                 x 241.5..458.5 before jitter.
//   the twenty    5 wide x 4 tall, same step, same top row, centred under the
//                 US flag position: y 1200..1272, x 681.8..778.2 before jitter.
//   the labels    38 world px — 48 screen px at the resolved k 1.25; the house
//                 58 was too wide for two side by side — each centred on its
//                 own flag's x axis, and BOTH on ONE cap top: 1336.4, which is
//                 40 world px below the bottom row of the FIFTY, the taller of
//                 the two blocks. Client pass 2: each label used to hang 40
//                 under its own block, so the twenty's sat 24.1 px high of the
//                 other. Drawn in WORLD space inside the world transform, so
//                 they track the camera like everything else.
//   framing       held on the FLAG ROW (consistency pass): both flags are on
//                 world y 1000..1160, and that row's centre line, world 1080,
//                 sits at SCREEN y 830 at BOTH ends of the move — the same
//                 place and the same size the mark holds in cut 2, so cut 2's
//                 last frame and this cut's first show the same flag.
//   content box   what is actually on screen, which is not the same box at the
//                 two ends of the move. At the OPEN it is the China flag and
//                 the fifty: world y 1000 (the flag's top edge) .. 1296.4 (the
//                 fifty's bottom row), centre 1148.2 — screen 702..1176, centre
//                 939. RESOLVED the fifty has become the twenty, one row
//                 shorter: 1000 .. 1272.3, centre 1136.2 — screen 730..1070,
//                 centre 900. Both blocks hang below the flags, so pinning the
//                 flag row at 830 puts the composition's own centre below the
//                 house's 835 rather than on it.
//   camera        two subjects, so one motivated move with lateral travel: it
//                 opens TIGHT ON THE CHINA FLAG (k 1.6 about world x 350, the
//                 flag's own centre) and pulls back while it slides right to
//                 hold both flags (k 1.25 about x 540, the midpoint of the
//                 two). Keyed f116-126, warp 0.72, settled by f135.
//                 The open is framed on the flag, so closing the two flags did
//                 not move it: the China flag's left edge (world 230) sits at
//                 screen x 348 and the fifty's leftmost dot (world 230.7, with
//                 its jitter and radius) at 349.1 — both far clear of the 50 px
//                 margin — the flag's centre is at screen y 830 and the fifty's
//                 bottom row at 1176. Resolved, the China flag's left edge is
//                 at screen x 152 and the US flag's right edge at 928, both
//                 well inside the 100 px margin the two labels need; the flags'
//                 centre is still at screen y 830 and the twenty's bottom row
//                 at 1070. The labels, on their one cap top, run 129..475 and
//                 605..951 — a 130 px gap between them and 129 px to each
//                 frame edge — and their cap band ends at screen y 1184,
//                 clear of the frame's bottom third.
//
// Every gesture is one word. Nothing else happens.
//   the China flag alone, carried over from cut 2      — before "reasonable" f0-18
//   the fifty dots EMERGE FROM BEHIND the China flag's
//     bottom edge — each is born fully occluded inside
//     the flag and slides down out of it — and drop
//     into the block, bottom row first, hashed within
//     a row, each on its own Easing.out(Easing.cubic)
//     over 10-14 frames with its own sideways drift of
//     up to 20 px so no two paths are parallel. The
//     span is solved so the fiftieth seats exactly on
//     "gigs". Deep orange: a gigawatt of compute       — "reasonable that China
//                                                        in 2029 can do 50
//                                                        gigs"             f18-51
//   the "50 GIGAWATTS" label rises 16 world px and
//     fades 0 -> 1 under the China block,
//     Easing.out(Easing.cubic), landing on "gigs" as
//     the fiftieth dot seats. It names the block the
//     moment the block is finished                     — "can do 50 gigs" f43-51
//   ALL FIFTY ramp deep orange -> red over 6 frames
//     each, in a hashed order, the first starting on
//     "most" and the last completing on "chips". The
//     order is hashed so the red arrives scattered
//     through the block and never as a region or a
//     sweep. Nothing else moves                        — "but if most of those
//                                                        are domestic chips"
//                                                                         f77-110
//   the ONE camera move: a PULL BACK WITH TRAVEL. k
//     1.6 -> 1.25 and cx 300 -> 540 on ONE warped
//     smoothstep (warp 0.72) keyed f116-126 — cx rides
//     `camEase` on exactly the curve k does, so it is
//     one continuous gesture and not a zoom with a pan
//     bolted to it — damped inside 0.5% of its target
//     by f135, eight frames before "where that 50". It
//     leaves the China flag and opens the empty right
//     half the twenty needs. Nothing new appears while
//     it runs                                          — "there is some factor
//                                                        there"          f116-136
//   the US flag arrives over the empty right half: it
//     rises the last 24 world px into place while it
//     fades in, Easing.out(Easing.cubic), landing on
//     "there" as the camera settles — the camera is
//     inside 0.5% of its target at f135 and the flag
//     lands three frames after it, so the second
//     subject appears in a frame that has already
//     stopped moving. No spring and no click — a
//     label arriving. THE FACTOR IS AMERICA: the flag
//     is what "there is some factor there" points at,
//     which is why it no longer waits for the last
//     word of the sentence                             — "factor there"  f130-138
//   the crossing. Every dot leaves its seat on its own
//     shallow quadratic arc — control point 40-90 px
//     above the chord, hashed, capped per dot so no
//     arc ever passes behind either flag — and
//     flies to a seat in the twenty over 14-20 frames.
//     Fifty red dots into twenty seats: TEN SEATS TAKE
//     THREE and ten take two, hashed which. The first
//     dot to reach a seat lands and turns ripe; the
//     rest are ABSORBED — over the last 20% of their
//     flight their radius shrinks to zero at the seat,
//     and the seated dot takes a 3-frame +25% radius
//     bump on each absorption, off the arrival itself
//     and not off a timer. The twenty fills bottom row
//     first and, inside a row, the FAR side first —
//     see the note on TWENTY_SEATS. Landings are
//     uniform in launch order from "gigawatts" to
//     "gigawatts", so the first landing is f157 and
//     the last seating or absorption is f221           — "where that 50
//                                                        gigawatts is really
//                                                        worth as much as 20
//                                                        gigawatts"     f143-221
//   the fifty STAY BEHIND. The frame a dot leaves its
//     seat, a red dot at OP_UNREAD 0.45 appears in it
//     — same radius, same breath, no fade-in: the
//     departing dot simply leaves its shadow. Derived
//     from the launch, so it cannot drift from it.
//     By f221 the fifty are all still there at 0.45
//     under China, and the twenty are ripe and solid
//     under the US                                     — under the crossing
//                                                                        f143-221
//   the "20 GIGAWATTS" label rises 16 world px and
//     fades 0 -> 1 under the US block, the same way
//     the first label did, landing on "America" — the
//     last word of the sentence now carries this beat
//     instead of the flag                              — "in America"    f225-233
//   hold resolved, never fades                         — tail            f246-262
//
// ambient on every hold: the shared `breath` on every seated dot, the grid's
// own drift and the shared `sway`. Nothing else. The longest stretch with no
// gesture is f51-77, 26 frames, which is the pause between the two sentences.
//
// Deviations from the brief, and why:
//   * The emergence launches at ~2.4 dots a frame, not ~1.5. The span is not
//     free: the fiftieth has to seat on "gigs" at f51, and with flights of
//     10-14 frames that leaves a 21-frame launch window for fifty dots. 1.5 a
//     frame would put the last landing at f63, twelve frames past its word.
//   * The twenty fills bottom row first but, inside a row, the FAR side first
//     rather than left to right. That is forced by the brief's own harder rule
//     — no dot passes through a seated dot's disc — and the note on
//     TWENTY_SEATS carries the measurements. Left to right, the sweep finds 183
//     overlaps, the worst of them a flyer passing 11.6 px inside a seated disc;
//     far side first, zero.
//   * The crossing walks its arc on a smoothstep, not on the emergence's
//     Easing.out(Easing.cubic), which piled the whole population into the last
//     stride of a 540 px chord.
//   * The US flag's nine star rows are placed at 1..9 of the ten row pitches
//     rather than at 0.5..8.5, so the star field is centred in its canton the
//     way the column rule centres it sideways. At half a pitch from the top the
//     block sits 12.9 px off centre vertically and reads as a drawing mistake.
//
// PASS 2 — the camera, and only the camera. Every gesture and every frame in
// the list above is untouched.
//   Pass 1 zoomed about x 540 and never travelled, on the reasoning that the
//   China flag is the carry-over from cuts 1 and 2 and must hold its place. The
//   director's note: a camera fixed on the midpoint of two flags can never get
//   tight on either of them, so the opening sat the flag and its fifty dots in
//   the far left of an empty frame as a small cluster, and k 1.3 was as tight
//   as the framing could ever be. This cut has TWO subjects — a flag that is
//   there from f0 and a flag that arrives at f225 — so it gets the one thing a
//   pure zoom cannot give it: lateral travel. The camera now opens on the China
//   flag alone at k 1.6, and the single move both pulls back and slides right,
//   which is exactly what "there is some factor there" is: the frame widening
//   to admit the second half of the comparison. cx travels on `camEase` at the
//   same warp as k, one key per frame, so there is no separate pan key and no
//   stall between a zoom and a pan — the damper sees one curve.
//   The resolved centre also moved 12 world px up, from the fifty's bottom row
//   to the twenty's: by the time the camera has settled the block that is going
//   to be there is one row shorter, and framing on the box that no longer
//   exists left the composition sitting 6 px low.
//
// PASS 3 — the client pass. Five notes, and nothing outside them: the
// emergence, the camera, the crossing's timing and the tail are all untouched.
//   1. The US flag moves from "in America" (f225) to "there is some factor
//      there" (f130-138). The client's reading is that the factor IS America —
//      the flag is the thing the sentence points at, not a caption on the end
//      of it — so it arrives on the words that name it, three frames after the
//      camera has settled into the frame that has room for it. The old f225-233
//      gesture is gone, not duplicated.
//   2. All fifty redden, not forty. "If MOST of those are domestic chips" was
//      read as forty-of-fifty; the client reads it as all of them. The hashed
//      order, the 6-frame ramp and the f77 -> f110 span are unchanged, so the
//      beat is the same beat with ten more dots in it. `domesticTone` is
//      untouched.
//   3. The merge is therefore 50 red -> 20 ripe, not 10 orange + 40 red. Ten
//      seats take three dots and ten take two, hashed which — the ratio is no
//      longer a flat four-to-one but an average of two and a half, which is
//      what fifty into twenty actually is. The groups are still consecutive
//      runs of the crossing order, which is what keeps the absorptions out of
//      the seats above them, and the overlap sweep was re-run: zero.
//   4. The fifty stay behind, at OP_UNREAD. Before this pass the China block
//      emptied as the crossing ran and the cut ended on twenty dots alone,
//      which shows the result and not the comparison. The trace rung is the
//      ladder's own "present, not the subject", so the fifty recede without
//      leaving — and 50 at 0.45 against 20 at 1.0 is the whole sentence in one
//      frame.
//   5. Two labels, on request. The default in this style is no text; the client
//      asked for the quantities named, so the two numbers that the piece is
//      about get the house type at the house size and nothing else does.
//
// CLIENT PASS 2 — layout only. Two notes, and nothing outside them: every beat,
// every frame and the whole camera track are untouched.
//   1. The labels are LEVEL. Both now hang from one cap top, 1336.4 — the
//      fifty's bottom row plus the same 40 the blocks hang below the flags —
//      instead of each hanging 40 under its own block. The twenty is a row
//      shorter, so "20 GIGAWATTS" sits 24.1 px further below its block than it
//      did; that is the point. Two numbers being compared are read across one
//      line, and 24 px of stagger read as a slip rather than as a measurement.
//   2. The flags close from world x 300/780 to 350/730 — 480 apart to 380 —
//      which brings the whole composition in toward the centre. Everything
//      hangs off the two axes, so the blocks, the seats, the labels, the spawn
//      points and the crossing's arcs all followed and no position is written
//      down twice. What it buys, at the resolved camera: the China flag's left
//      edge moves from screen x 93 to 152 and the US flag's right from 993 to
//      928, and the two 48 px labels — the widest things in the frame — go from
//      69/71 px off the frame edges to 129, with 130 px of air between them.
//      The open is framed on the China flag itself (cx = CN_CX), so it did not
//      move at all: 348 px to the flag's left edge at k 1.6, as before.
//      One consequence, and it is the only code outside those two constants:
//      the arcs' flag cap now tests BOTH flags. The chord is 100 px shorter, so
//      an arc's apex reaches world x 621 where the US flag now starts at 610 —
//      the sweep found eleven samples up to 1.2 px behind it. Capping against
//      both puts the worst clearance back at 5.7 px under the US flag and 5.9
//      under China's, with the crossing's schedule untouched: landings are
//      keyed, not derived from the chord, so the first is still f157 on
//      "gigawatts" and the last still f221. Re-swept at quarter-frame
//      resolution: zero flyer/seated overlaps in the twenty.
//
// CONSISTENCY PASS (across the three cuts of this clip) — cy, and only cy.
// Every beat, every frame, both k values, cx, the keys, the warp and all the
// world geometry are untouched. The flag was three different sizes at three
// different heights across the three cuts; it is now one mark, 300 x 200 screen
// px at every resolve with its centre on screen y 830 at both of this cut's
// framings and at both of cut 2's. This cut already carried the size — its
// k 1.6 / 1.25 IS the standard, and cut 2's camera was re-scaled to match it —
// so all that moved here is the camera's datum: from the content box (which
// changes between the two ends, because the fifty becomes the twenty) to the
// flag row itself (which does not). The flag's centre goes 726 -> 830 at the
// open and 759 -> 830 at the resolve; everything hanging off the flags follows
// it down the frame by the same amount, and the labels' cap band ends at screen
// y 1184 resolved, 1283 at the open.
//
// SQUIRCLE PASS, on the client's note: "I want to move away from rounded
// rectangles and use squircles instead. Consistent rounding relative to the
// shapes. Corner smoothing 60% like Apple's guidelines." The only rounded
// shapes in this cut are the two flags, and both now take `squirclePath` from
// `fieldShared` — the Figma corner-smoothing construction at s 0.6, Apple's
// continuous corner — at SQUIRCLE_RATIO (0.2) of the shorter side rather than
// at a hand-set radius. FLAG_R 14 is gone: r is 32 world px, 40 SCREEN px at
// the resolved k 1.25, which is the same fraction of the mark that cut 1's
// 384 x 256 flag and cut 2's 240 x 160 one carry at their own scales, so the
// three cuts still show one mark when they run seconds apart.
//   China   the red field AND the star clip take the one path
//   US      the clip the thirteen stripes, the canton and the fifty stars are
//           drawn inside takes it, so the stripes end on the squircle
// Nothing else moved: the geometry, the beats, the camera and the labels are
// exactly as they were.
// ---------------------------------------------------------------------------

// The flag's red, which is also the colour of a domestic chip. Copied from
// cut 2 rather than imported, so cut 2 is never touched.
const FLAG_RED = "#DE2910";

export const schema = z.object({
  accent: z.string(), // ripe: a gigawatt seated in the twenty, and the stars
  accentDeep: z.string(), // deep: a gigawatt of compute under the China flag
  domesticTone: z.string(), // a domestic chip: the flag's own red
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotOpacity: z.number(), // the dot body's opacity; the state ladder is colour
  traceOpacity: z.number(), // the dot a departing gigawatt leaves in its seat
  labelChina: z.string(), // what the fifty are called
  labelUs: z.string(), // what the twenty are called
  beats: z.object({
    butYeahI: z.number(), // "but yeah i"
    thinkIts: z.number(), // "think it's"
    completely: z.number(), // "completely"
    reasonable: z.number(), // "reasonable"
    thatChina: z.number(), // "that china"
    in2029: z.number(), // "in 2029"
    canDo50Gigs: z.number(), // "can do 50 gigs"
    butIfMostOf: z.number(), // "but if most of"
    thoseAre: z.number(), // "those are"
    domesticChips: z.number(), // "domestic chips"
    thereIsSome: z.number(), // "there is some"
    factorThere: z.number(), // "factor there"
    whereThat50: z.number(), // "where that 50"
    gigawatts: z.number(), // "gigawatts"
    isReally: z.number(), // "is really"
    worthAs: z.number(), // "worth as"
    muchAs20: z.number(), // "much as 20"
    gigawatts2: z.number(), // "gigawatts"
    inAmerica: z.number(), // "in america"
    end: z.number(), // speech ends; tail to 262
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  domesticTone: FLAG_RED,
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
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  traceOpacity: OP_UNREAD,
  labelChina: "50 GIGAWATTS",
  labelUs: "20 GIGAWATTS",
  beats: {
    butYeahI: 0,
    thinkIts: 6,
    completely: 11,
    reasonable: 18,
    thatChina: 26,
    in2029: 37,
    canDo50Gigs: 51,
    butIfMostOf: 77,
    thoseAre: 90,
    domesticChips: 96,
    thereIsSome: 118,
    factorThere: 129,
    whereThat50: 143,
    gigawatts: 157,
    isReally: 171,
    worthAs: 188,
    muchAs20: 198,
    gigawatts2: 221,
    inAmerica: 233,
    end: 246,
  },
});

type Pt = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2000;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const easeOut = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// The ground truth, which is not a ground: TWO FLAGS. They float side by side
// and every other position in the piece is derived from their edges — the two
// blocks, the emergence, the crossing's arcs, the camera. Nothing stands on
// anything.
// ---------------------------------------------------------------------------
const CENTRE_X = 540;

const FLAG_W = 240;
const FLAG_H = 160; // 3:2
const FLAG_UNIT = FLAG_W / 30; // 8, the official 30x20 unit grid of cut 1
// SQUIRCLE PASS: one outline for both marks, at SQUIRCLE_RATIO of the shorter
// side — 0.2 * 160 = 32 world px, 40 SCREEN px at the resolved k 1.25. It is
// used four times: China's field, China's star clip, the US flag's
// stripe/canton/star clip, and nothing else has a corner in this cut.
const FLAG_PATH = squirclePath(FLAG_W, FLAG_H);
const FLAG_TOP = 1000;
const FLAG_BOTTOM = FLAG_TOP + FLAG_H; // 1160

// Client pass 2: the two flags close from 300/780 (480 apart) to 350/730 (380
// apart). Every position in the piece hangs off these two axes, so the blocks,
// the seats, the labels, the spawn points and the crossing's arcs all move with
// them and nothing else had to be touched.
const CN_CX = 350;
const CN_X = CN_CX - FLAG_W / 2; // 230
const CN_RIGHT = CN_X + FLAG_W; // 470
const US_CX = 730;
const US_X = US_CX - FLAG_W / 2; // 610
const US_RIGHT = US_X + FLAG_W; // 850

// ---------------------------------------------------------------------------
// The two blocks. Both hang off the flags' bottom edge — there is no floor —
// and both are laid out on the field's own crowd step, so a gigawatt here is
// made of the same material as every crowd in this set. A seat is jittered by
// up to a quarter of a step so a block is organic without losing its outline,
// and a dot's radius varies 0.75-1.25 the way the field's do.
// ---------------------------------------------------------------------------
const STEP = 940 / 39;
const BLOCK_GAP = 40; // the top row's centre, below the flag's bottom edge
const BLOCK_TOP_Y = FLAG_BOTTOM + BLOCK_GAP; // 1200

const FIFTY_COLS = 10;
const FIFTY_ROWS = 5;
const TWENTY_COLS = 5;
const TWENTY_ROWS = 4;

const jit = (i: number, k: number) => (hash(i, k) - 0.5) * STEP * 0.5;

const blockSeat = (cx: number, cols: number, row: number, col: number, i: number): Pt => ({
  x: cx + (col - (cols - 1) / 2) * STEP + jit(i, 11),
  y: BLOCK_TOP_Y + row * STEP + jit(i, 12),
});

const FIFTY_BOTTOM_Y = BLOCK_TOP_Y + (FIFTY_ROWS - 1) * STEP; // 1296.4
const TWENTY_BOTTOM_Y = BLOCK_TOP_Y + (TWENTY_ROWS - 1) * STEP; // 1272.3

// The twenty's seats in FILL ORDER: bottom row first, and inside a row the FAR
// side first — right to left.
//
// The brief asks for left to right, and left to right cannot be drawn. Every
// dot comes from the left and arrives from above on a shallow arc, so a flight
// to a seat crosses the whole width of the block at nearly that seat's own
// height. Filling left to right puts the seats it has to cross directly in its
// path: swept at quarter-frame resolution, 183 overlaps, the worst of them a
// flyer passing dead through a seated dot 11.6 px inside its disc. Steepening
// the arrival enough to clear them takes the control point to 83% of the chord,
// which is not a shallow arc any more.
//
// Filling the far side first makes the rule true by construction and costs
// nothing: a flight's x rises monotonically to its own seat, so every seat
// already taken in its row is beyond it and every row already full is below the
// height it descends to. Zero overlaps.
const TWENTY_SEATS: Pt[] = (() => {
  const out: Pt[] = [];
  for (let row = TWENTY_ROWS - 1; row >= 0; row--) {
    for (let col = TWENTY_COLS - 1; col >= 0; col--) {
      out.push(blockSeat(US_CX, TWENTY_COLS, row, col, 5000 + row * TWENTY_COLS + col));
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The camera. ONE move, on "there is some factor there", and it is a pull-back
// WITH LATERAL TRAVEL: k 1.6 -> 1.25 and cx 300 -> 540. It opens tight on the
// China flag — cx is the flag's own centre, so the flag and its fifty dots fill
// the frame and there is no empty half sitting there waiting — and it widens
// and slides right onto the midpoint of the two flags, which is the space the
// twenty is about to fill.
//
// Pass 1 was a pure zoom about x 540 with no travel, on the reasoning that the
// China flag is the carry-over from cuts 1 and 2 and has to hold its place. It
// does not survive the frame: a camera parked on the midpoint of two flags,
// only one of which exists yet, can never be tight on the one that does, and
// the opening read as a small cluster in an empty frame. Two subjects buy one
// move with travel.
//
// The travel is not a second gesture. `camMove` writes k and cy as a warped
// smoothstep with a key per frame; CAM_CX below evaluates `camEase` at the same
// warp on the same frames, so cx is the same curve scaled to a different range.
// There is one deceleration lobe in the whole move, no separate pan key, and no
// stall between a zoom and a pan. `runCamera` damps cx exactly as it damps cy —
// the same second-order tracker, run a second time over the cx track — so the
// hand on the camera is one hand.
//
// cy is taken off the EASED k by `camMove`, so the framing settles with the
// zoom instead of sagging through it.
//
// CONSISTENCY PASS: what it settles ON is the FLAG ROW, not the content box.
// The flag is the one element that carries through all three cuts of this clip,
// and it was resolving at a different size and a different height in each of
// them — 187 screen px at y 1275 in cut 1, 240 at 885 in cut 2, 300 at 759
// here. It is now one mark: 300 x 200 SCREEN px wherever a cut resolves, and in
// cuts 2 and 3 its CENTRE is held at screen y 830 at the open AND at the
// resolve. This cut already had the size right — 240 world px at k 1.25 is 300
// on screen, and 384 at the open — so nothing here but cy moved. It is now
// FLAG_MID + (960 - 830)/k, and `camMove` is handed that minus CAM_LIFT/k: five
// world px below the flag row's own centre line, which is what the house's 835
// and this pass's 830 differ by. Because that offset is 1/k, it is evaluated at
// each end of the move and carried between them on the move's own eased curve;
// the residual against the exact 1/k curve peaks at 0.08 screen px mid-move.
//
// The old datum was the content box, carried 12 world px from the flag-over-
// fifty box at the open to the flag-over-twenty box at the resolve so that the
// content centre held screen y 835 at both ends. Holding the flag row instead
// moves that centre DOWN the frame — to 939 at the open and 900 at the resolve
// — because both blocks hang below the flags and the flag is now the thing
// pinned. That is the trade the pass buys: three cuts whose one shared mark
// never moves, against a composition that sits lower in this one.
//
// Keyed f116-126 rather than f118-136: this damper lags its target by about ten
// frames, and the move has to be settled before the crossing starts at f143.
//
//   f0-115    k 1.6      the China flag centred and 384 px wide: its left edge
//             cx 350     at screen x 348 and the fifty's leftmost dot at 348.6,
//                        its centre at screen y 830, the fifty's bottom row at
//                        1176. The right half of the world is off frame.
//   f116-136  -> k 1.25  both flags held: the China flag's left edge at screen
//             -> cx 540  x 152 and the US flag's right edge at 928, the flags'
//                        centre still at screen y 830 and the twenty's bottom
//                        row at 1070. Inside 0.5% of target by f135.
// ---------------------------------------------------------------------------
const K_OPEN = 1.6;
const K_FINAL = 1.25;
const CX_OPEN = CN_CX; // the China flag's own centre: the open is tight on it
const CX_FINAL = CENTRE_X; // the midpoint of the two flags
const CAM_F0 = 116;
const CAM_F1 = 126;
const CAM_WARP = 0.72;
// The flag row's centre line, and where it sits on screen in every cut of this
// clip. Both flags are on the same y, so this is one line for the pair.
const FLAG_MID = FLAG_TOP + FLAG_H / 2; // 1080
const FLAG_SCREEN_Y = 830;
// what `camMove` has to be handed so that FLAG_MID lands on FLAG_SCREEN_Y
const contentFor = (k: number) => FLAG_MID + (FRAME_H / 2 - FLAG_SCREEN_Y - CAM_LIFT) / k;
const CONTENT_OPEN = contentFor(K_OPEN); // 1083.13
const CONTENT_FINAL = contentFor(K_FINAL); // 1084
const CY_OPEN = CONTENT_OPEN + CAM_LIFT / K_OPEN; // 1161.25
const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL; // 1184
// The twenty's bottom row on screen at the resolve: the lowest dot in the cut,
// and the check that pinning the flag has not pushed the block out of shot.
const TWENTY_BOTTOM_SCREEN = FRAME_H / 2 + (TWENTY_BOTTOM_Y - CY_FINAL) * K_FINAL; // 1070
if (TWENTY_BOTTOM_SCREEN > FRAME_H - 200) {
  throw new Error(`the twenty's bottom row is at screen y ${TWENTY_BOTTOM_SCREEN.toFixed(0)}`);
}

const CAM = camMove({
  f0: CAM_F0,
  f1: CAM_F1,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_OPEN,
  c1: CONTENT_FINAL,
  warp: CAM_WARP,
});
const CAM_FF = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [CY_OPEN, ...CAM.CY, CY_FINAL];
// the sideways half of the same move, on the same eased curve
const CAM_CX = [
  CX_OPEN,
  ...CAM.F.map((_, i) => CX_OPEN + (CX_FINAL - CX_OPEN) * camEase(i / (CAM_F1 - CAM_F0), CAM_WARP)),
  CX_FINAL,
];

// ---------------------------------------------------------------------------
// Gesture 1 — the emergence. A dot is born FULLY OCCLUDED inside the China
// flag, just above its bottom edge, and slides down out of it into its seat.
// Its birthplace is its seat's x pushed sideways by up to 20 px and then
// clamped inside the flag, so every path has its own lean and no two are
// parallel — and so nothing is ever born where it can be seen.
// ---------------------------------------------------------------------------
const EMERGE_F0 = 18;
const EMERGE_LAND = 51;
const EMERGE_DUR_MIN = 10;
const EMERGE_DUR_MAX = 14;
const EMERGE_DRIFT = 20;
const SPAWN_CLEAR = 3;

// Solve the launch span so the LAST landing falls on its word exactly. The
// flights are different lengths, so this is a search over the span rather than
// arithmetic on the last one. (Cut 1's solver.)
const solveSpan = (u: number[], dur: number[], want: number) => {
  let lo = 0.5;
  let hi = 200;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    let mx = 0;
    for (let i = 0; i < u.length; i++) mx = Math.max(mx, u[i] * mid + dur[i]);
    if (mx < want) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

// ---------------------------------------------------------------------------
// Gesture 2 — the reddening. ALL FIFTY ramp deep -> red over 6 frames each, in
// a hashed order so the red arrives scattered through the block and never as a
// region or a sweep. The stagger is solved so the first starts on "most" and
// the last COMPLETES on "chips". (Pass 3: it was forty of the fifty. The order,
// the ramp and the span are the ones the forty had.)
// ---------------------------------------------------------------------------
const RED_F0 = 77;
const RED_LAND = 110;
const RED_RAMP = 6;
const N_CELLS = FIFTY_COLS * FIFTY_ROWS; // 50

// ---------------------------------------------------------------------------
// Gesture 4 — the crossing. Landings are uniform from "gigawatts" (f157) to
// "gigawatts" (f221) in launch order, which is what makes "landings in launch
// order" true by construction rather than by luck: with durations hashed over
// six frames and launches a frame and a third apart, a launch-keyed schedule
// lets a slow dot be overtaken by the one behind it. Each launch is therefore
// its own landing minus its own duration, and the duration is capped for the
// first few so nothing launches before f143.
// ---------------------------------------------------------------------------
const CROSS_F0 = 143;
const CROSS_FIRST_LAND = 157;
const CROSS_LAST_LAND = 221;
const CROSS_DUR_MIN = 14;
const CROSS_DUR_MAX = 20;
const BOW_MIN = 40; // the control point, above the chord
const BOW_MAX = 90;
const FLAG_CLEAR = 6; // how far under the China flag an arc has to stay
const ABSORB_SHARE = 0.2; // the last fifth of an absorbed dot's flight
const BUMP_FRAMES = 3;
const BUMP_SCALE = 0.25;
const RIPEN = 4; // frames a seated dot takes to go to ripe

// Fifty dots into twenty seats. Ten seats take THREE and ten take TWO —
// 10*3 + 10*2 = 50 — and which is which is hashed, so the twenty is not ten
// heavy seats next to ten light ones but a block whose seats happen to have
// swallowed different amounts. The hash ranks the twenty seats and the first
// ten of that ranking are the threes.
const N_SEATS = TWENTY_COLS * TWENTY_ROWS; // 20
const N_THREES = 10;
const GROUP_SIZES: number[] = (() => {
  const rank = Array.from({ length: N_SEATS }, (_, i) => ({ i, key: hash(7000 + i, 83) })).sort(
    (a, b) => a.key - b.key,
  );
  const sizes = new Array<number>(N_SEATS).fill(2);
  for (let j = 0; j < N_THREES; j++) sizes[rank[j].i] = 3;
  const total = sizes.reduce((a, b) => a + b, 0);
  if (total !== N_CELLS) {
    throw new Error(`the twenty has to swallow ${N_CELLS} dots, it swallows ${total}`);
  }
  return sizes;
})();

type Cell = {
  seed: number;
  rad: number; // 0.75-1.25
  seat: Pt; // its seat in the fifty
  spawn: Pt;
  eT0: number;
  eDur: number;
  redStart: number;
  target: Pt; // its seat in the twenty
  seatIdx: number;
  opener: boolean;
  bow: number;
  xT0: number;
  xDur: number;
  xLand: number;
};

const CELLS: Cell[] = (() => {
  // --- the fifty seats, and each dot's own radius ---------------------------
  const base = [] as { seed: number; rad: number; seat: Pt; row: number }[];
  for (let row = 0; row < FIFTY_ROWS; row++) {
    for (let col = 0; col < FIFTY_COLS; col++) {
      const seed = 1000 + row * FIFTY_COLS + col;
      base.push({
        seed,
        rad: 0.75 + 0.5 * hash(seed, 13),
        seat: blockSeat(CN_CX, FIFTY_COLS, row, col, seed),
        row,
      });
    }
  }

  // --- gesture 1: the emergence --------------------------------------------
  // bottom row first, hashed inside a row
  const emergeOrder = base
    .map((b, n) => ({ n, key: (FIFTY_ROWS - 1 - b.row) * 10 + hash(b.seed, 43) * 9.5 }))
    .sort((a, b2) => a.key - b2.key)
    .map((o) => o.n);
  const eDur = base.map(
    (b) => EMERGE_DUR_MIN + (EMERGE_DUR_MAX - EMERGE_DUR_MIN) * hash(b.seed, 48),
  );
  const eU = emergeOrder.map((_, n) => (n + 0.5) / emergeOrder.length);
  const eSpan = solveSpan(
    eU,
    emergeOrder.map((n) => eDur[n]),
    EMERGE_LAND - EMERGE_F0,
  );
  const eT0 = base.map(() => 0);
  emergeOrder.forEach((n, k) => {
    eT0[n] = EMERGE_F0 + eU[k] * eSpan;
  });

  // --- gesture 2: when each of the fifty reddens ----------------------------
  // All fifty, in hash order, evenly spread so the first STARTS on "most" and
  // the last COMPLETES on "chips".
  const redRank = base
    .map((b, n) => ({ n, key: hash(b.seed, 61) }))
    .sort((a, b2) => a.key - b2.key);
  const redStart = base.map(() => Infinity);
  const redSpan = RED_LAND - RED_RAMP - RED_F0; // the last of the fifty STARTS here
  redRank.forEach((r, k) => {
    redStart[r.n] = RED_F0 + (redSpan * k) / (N_CELLS - 1);
  });

  // --- gesture 4: the order, the seats, and the 3/2 groups ------------------
  // bottom row of the fifty first, hashed inside a row
  const crossOrder = base
    .map((b, n) => ({ n, key: (FIFTY_ROWS - 1 - b.row) * 10 + hash(b.seed, 71) * 9.5 }))
    .sort((a, b2) => a.key - b2.key)
    .map((o) => o.n);

  // The fifty are cut into the twenty groups as CONSECUTIVE runs of that order,
  // three long or two long per GROUP_SIZES, and group g takes seat g. That is
  // not decoration, it is what keeps the absorptions out of the seats above
  // them: a group's dots land within a few frames of each other, so a seat is
  // finished before the row over it starts to fill, and an arc descending to a
  // low seat never has an occupied seat in its way. A hashed partition
  // scattered each group across the whole crossing, and its last absorption
  // then had to fly down through two full rows of seated dots — swept at
  // quarter-frame resolution, 243 overlaps.
  //
  // Consecutive runs also make "seats fill in landing order" true by
  // construction: seat g is claimed by the first dot of run g, and the runs are
  // in order. A flight's only possible obstacles are therefore seats claimed
  // BEFORE its own, which after the far-side-first fill are either beyond it on
  // its own row — and its x only ever rises to its own seat — or on a row below
  // the height it descends to. Zero overlaps, by construction.
  const seatIdx = base.map(() => -1);
  const opener = base.map(() => false);
  let p = 0;
  GROUP_SIZES.forEach((size, g) => {
    for (let j = 0; j < size; j++) {
      const n = crossOrder[p++];
      seatIdx[n] = g;
      opener[n] = j === 0;
    }
  });
  if (p !== crossOrder.length || GROUP_SIZES.length !== TWENTY_SEATS.length) {
    throw new Error(`the twenty seated ${p} of ${crossOrder.length} dots`);
  }

  // Landings uniform across the crossing, in that order; each launch is its own
  // landing minus its own duration, with the duration capped for the first few
  // so nothing launches before f143.
  const pitch = (CROSS_LAST_LAND - CROSS_FIRST_LAND) / (crossOrder.length - 1);
  const xT0 = base.map(() => 0);
  const xDur = base.map(() => 0);
  const xLand = base.map(() => 0);
  crossOrder.forEach((n, k) => {
    const land = CROSS_FIRST_LAND + k * pitch;
    const want = CROSS_DUR_MIN + (CROSS_DUR_MAX - CROSS_DUR_MIN) * hash(base[n].seed, 55);
    const dur = Math.min(want, land - CROSS_F0); // nothing launches before f143
    xDur[n] = dur;
    xLand[n] = land;
    xT0[n] = land - dur;
  });

  // --- the arcs, and the cap that keeps them out of the flags ---------------
  // The control point sits straight above the chord's midpoint, so x is linear
  // in t and the flag test is a bound on the bow rather than a search. A dot is
  // capped only where its path crosses under a flag; everywhere else it keeps
  // its hashed bow. The bow is also floored at half the chord's rise plus 8,
  // which is what makes the arc monotone in y — so a dot always arrives at its
  // seat from ABOVE and can never pass through a seated dot's disc.
  //
  // Client pass 2: BOTH flags, not just China's. At 300/780 an arc's apex sat
  // at most at world x 618 and the US flag started at 660, so the US flag could
  // not be reached and the cap only ever had to know about China's — the sweep
  // measured 2.3 px of clearance under it, unasked for. At 350/730 the apexes
  // reach x 621 and the US flag starts at 610, and the same sweep found eleven
  // samples up to 1.2 px behind it. The rule was always "an arc may not pass
  // behind a flag"; it is now enforced against both.
  const bows = base.map((b, n) => {
    const p0 = b.seat;
    const p2 = TWENTY_SEATS[seatIdx[n]];
    const r = DOT_RADIUS * b.rad;
    // The floor: the control point has to sit above BOTH ends, which is what
    // makes the arc monotone in y — so "arrives from above" is a fact about the
    // curve and not a hope, and a dot never rises into its seat from under the
    // row below it.
    const floorBow = Math.abs(p0.y - p2.y) / 2 + 8;
    // The ceiling: an arc may not pass behind either flag. x is linear in t
    // because the control point sits straight above the chord's midpoint, so
    // this is a bound on the bow rather than a search.
    let cap = Infinity;
    for (let s = 1; s < 60; s++) {
      const t = s / 60;
      const x = p0.x + (p2.x - p0.x) * t;
      const underFlag = (x + r > CN_X && x - r < CN_RIGHT) || (x + r > US_X && x - r < US_RIGHT);
      if (!underFlag) continue;
      const chord = p0.y + (p2.y - p0.y) * t;
      const w = 2 * (1 - t) * t;
      cap = Math.min(cap, (chord - r - FLAG_BOTTOM - FLAG_CLEAR) / w);
    }
    if (cap < floorBow) {
      throw new Error(`dot ${b.seed}: the flag cap ${cap.toFixed(1)} is under its floor`);
    }
    return Math.min(Math.max(BOW_MIN + (BOW_MAX - BOW_MIN) * hash(b.seed, 53), floorBow), cap);
  });

  // --- the emergence spawn, fully inside the flag ---------------------------
  const spawns = base.map((b) => {
    const r = DOT_RADIUS * b.rad;
    const drift = (hash(b.seed, 21) - 0.5) * 2 * EMERGE_DRIFT;
    const lo = CN_X + r + SPAWN_CLEAR;
    const hi = CN_RIGHT - r - SPAWN_CLEAR;
    return {
      x: Math.max(lo, Math.min(hi, b.seat.x + drift)),
      y: FLAG_BOTTOM - r - SPAWN_CLEAR,
    };
  });

  return base.map((b, n) => ({
    seed: b.seed,
    rad: b.rad,
    seat: b.seat,
    spawn: spawns[n],
    eT0: eT0[n],
    eDur: eDur[n],
    redStart: redStart[n],
    target: TWENTY_SEATS[seatIdx[n]],
    seatIdx: seatIdx[n],
    opener: opener[n],
    bow: bows[n],
    xT0: xT0[n],
    xDur: xDur[n],
    xLand: xLand[n],
  }));
})();

// Every absorption, per seat, as the arrival frame it is derived from: the
// seated dot's bump comes off these and not off a timer of its own.
const ABSORB_AT: number[][] = TWENTY_SEATS.map(() => []);
CELLS.forEach((c) => {
  if (!c.opener) ABSORB_AT[c.seatIdx].push(c.xLand);
});

// ---------------------------------------------------------------------------
// The flag of China. Copied from cut 1 rather than imported, so cut 1 is never
// touched: the same 240x160 on the shared squircle, the same red, the same
// official 30x20 unit star grid at 8 world px to the unit — the large star at (5,5) with a
// circumscribed radius of 3 units and a point straight up, four small stars of
// radius 1 unit at (10,2), (12,4), (12,7) and (10,9), each turned so one of its
// points aims at the large star's centre — and the same accent fill.
//
// Its entrance, like cut 2's, is that it has none: it is the carry-over, and it
// is floating there from the first frame.
// ---------------------------------------------------------------------------
const cnPt = (ux: number, uy: number): Pt => ({
  x: CN_X + ux * FLAG_UNIT,
  y: FLAG_TOP + uy * FLAG_UNIT,
});

const STAR_INNER = 0.382;
const starPts = (c: Pt, r: number, a0: number): Pt[] =>
  Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 === 0 ? r : r * STAR_INNER;
    const a = a0 + (i * Math.PI) / 5;
    return { x: c.x + rr * Math.cos(a), y: c.y + rr * Math.sin(a) };
  });

const CN_BIG_STAR = starPts(cnPt(5, 5), 3 * FLAG_UNIT, -Math.PI / 2);
const CN_SMALL_STARS = [
  [10, 2],
  [12, 4],
  [12, 7],
  [10, 9],
].map(([ux, uy]) => starPts(cnPt(ux, uy), FLAG_UNIT, Math.atan2(5 - uy, 5 - ux)));
const CN_CLIP = "fw-cn-clip";
const CN_AT = `translate(${CN_X} ${FLAG_TOP})`;

// ---------------------------------------------------------------------------
// The flag of the United States, drawn to the same 240x160 squircle so the two
// marks are the same object in two colours.
//
//   stripes  13 of them, 160/13 = 12.31 tall, red at the even indices so the
//            top and the bottom are both red.
//   canton   0.4 x 240 = 96 wide, 7/13 x 160 = 86.15 tall, at the top left.
//   stars    50, in nine rows alternating six and five. The column pitch is
//            96/12 = 8: a row of six starts one pitch in and steps two, a row
//            of five starts two pitches in. The row pitch is 86.15/10 = 8.62,
//            and the nine rows sit at one through nine of them — centred in the
//            canton, exactly as the columns are centred across it. Each star
//            has an outer radius of 4.2, an inner of 0.382 of that, and one
//            point straight up.
// ---------------------------------------------------------------------------
const US_STRIPES = 13;
const US_STRIPE_H = FLAG_H / US_STRIPES;
const US_RED = "#B22234";
const US_WHITE = "#FFFFFF";
const US_BLUE = "#3C3B6E";
const US_CANTON_W = 0.4 * FLAG_W; // 96
const US_CANTON_H = (7 / US_STRIPES) * FLAG_H; // 86.15
const US_STAR_R = 4.2;
const US_COL_PITCH = US_CANTON_W / 12; // 8
const US_ROW_PITCH = US_CANTON_H / 10; // 8.615

const US_STARS: Pt[][] = (() => {
  const out: Pt[][] = [];
  for (let row = 0; row < 9; row++) {
    const six = row % 2 === 0;
    const n = six ? 6 : 5;
    const y = FLAG_TOP + (row + 1) * US_ROW_PITCH;
    for (let c = 0; c < n; c++) {
      const x = US_X + ((six ? 1 : 2) + 2 * c) * US_COL_PITCH;
      out.push(starPts({ x, y }, US_STAR_R, -Math.PI / 2));
    }
  }
  return out;
})();
if (US_STARS.length !== 50) {
  throw new Error(`the union needs 50 stars, drew ${US_STARS.length}`);
}
const US_CLIP = "fw-us-clip";
const US_AT = `translate(${US_X} ${FLAG_TOP})`;

// Pass 3: the flag arrives on "there is some factor there", not on "America".
// The factor is America — the flag is what the sentence points at — so it lands
// on the words that name it. f138 is three frames after the camera is inside
// 0.5% of its target (f135), so the second subject appears in a frame that has
// already stopped moving.
const US_F0 = 130;
const US_LAND = 138;
const US_RISE = 24; // how far below its resting place it starts

// ---------------------------------------------------------------------------
// The two labels, the only text in the set. House type: Roboto Condensed 700,
// uppercase, tracked 0.11em with a compensating -0.11em right margin so the
// trailing space of the tracking does not throw the pair off its centre.
//
// They are drawn in WORLD space, inside the world transform, so they track the
// camera like the flags and the dots. 38 world px is 48 screen px at the
// resolved k of 1.25.
//
// Each is centred on its own flag's x axis, and both hang from ONE cap top:
// 40 world px below the bottom row of the FIFTY, the taller of the two blocks
// and the same 40 the blocks hang below the flags. Client pass 2 — before it
// each label hung 40 under its own block, and since the twenty is a row
// shorter its label sat 24 px high of the other, which read as a slip rather
// than as a measurement.
//
// Cap top, not box top: a text box's top is half-leading plus the font's
// ascender above the baseline, and the ascender is a long way over the caps. So
// the box is placed at capTop - LABEL_CAP_TOP, where LABEL_CAP_TOP is that
// distance for Roboto Condensed at line-height 1 (unitsPerEm 2048, hhea
// ascender 1900, descender 500, cap height 1456).
// ---------------------------------------------------------------------------
const LABEL_SIZE = 38; // director's pass: 46 (58 screen px) put two labels 34/28 px from the frame edges; 38 = 48 screen px, margins ~70
const LABEL_ASC = 1900 / 2048;
const LABEL_DESC = 500 / 2048;
const LABEL_CAP = 1456 / 2048;
const LABEL_CAP_TOP =
  LABEL_SIZE * ((1 - (LABEL_ASC + LABEL_DESC)) / 2 + LABEL_ASC - LABEL_CAP); // 6.02
const LABEL_GAP = 40; // the cap top, below the block's bottom row
const LABEL_RISE = 16;
const LABEL_TRACK = 0.11; // em
// ONE cap top for BOTH labels, on the client's note that they should read as a
// pair: the taller block sets it, so it is the fifty's bottom row plus the same
// 40. The twenty is a row shorter, so "20 GIGAWATTS" now hangs 24.1 px further
// below its own block than "50 GIGAWATTS" does — intended: the two numbers are
// being compared, and a comparison is read across one line.
const LABEL_CAP_Y = FIFTY_BOTTOM_Y + LABEL_GAP; // 1336.4, both labels
const CN_LABEL_F0 = 43; // lands on `beats.canDo50Gigs`, f51, as the fiftieth seats
const US_LABEL_F0 = 225; // lands on `beats.inAmerica`, f233

const path = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

// One label. `e` is its entrance, 0 at the start of the rise and 1 landed: it
// carries both the fade and the last 16 world px of travel, so there is one
// curve and not two.
const WorldLabel: React.FC<{ text: string; cx: number; capY: number; e: number }> = ({
  text,
  cx,
  capY,
  e,
}) => (
  <div
    style={{
      position: "absolute",
      left: cx,
      top: capY - LABEL_CAP_TOP,
      transform: `translateX(-50%) translateY(${((1 - e) * LABEL_RISE).toFixed(2)}px)`,
      opacity: e * OP_READ,
      whiteSpace: "nowrap",
      fontFamily: robotoCondensed.fontFamily,
      fontWeight: 700,
      fontSize: LABEL_SIZE,
      lineHeight: 1,
      color: "#FFFFFF",
    }}
  >
    <span style={{ letterSpacing: `${LABEL_TRACK}em`, marginRight: `${-LABEL_TRACK}em` }}>
      {text}
    </span>
  </div>
);

const FiftyWorthTwenty: React.FC<Props> = ({
  accent,
  accentDeep,
  domesticTone,
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
  dotRadius,
  dotOpacity,
  traceOpacity,
  labelChina,
  labelUs,
  beats,
}) => {
  const frame = useCurrentFrame();

  // The two tones a dot ever takes, each a ramp between two of the palette's
  // own colours: compute -> domestic chip, and domestic chip -> seated ripe.
  const toneRed = makeTone(accentDeep, domesticTone);
  const toneRedRipe = makeTone(domesticTone, accent);

  // -- what the fifty leave behind --------------------------------------------
  // A dot that has left its seat leaves ITSELF there: the same radius, the same
  // breath, the same red, at the ladder's "present, not the subject" rung. It
  // appears the frame the dot departs — the test is the launch itself, so the
  // trace cannot drift from the dot — and it never fades in, because it is not
  // arriving. It is what is left.
  const traces = CELLS.filter((c) => frame >= c.xT0).map((c) => ({
    key: c.seed,
    x: c.seat.x,
    y: c.seat.y,
    r: dotRadius * c.rad * breath(frame, hash(c.seed, 9)),
  }));

  // -- the dots ---------------------------------------------------------------
  const dots = CELLS.map((c) => {
    if (frame < c.eT0) return null;

    let x: number;
    let y: number;
    let scale = 1;

    if (frame < c.xT0) {
      // the emergence, then the block holding
      const e = easeOut(clamp01((frame - c.eT0) / c.eDur));
      x = c.spawn.x + (c.seat.x - c.spawn.x) * e;
      y = c.spawn.y + (c.seat.y - c.spawn.y) * e;
    } else if (frame < c.xLand) {
      // The crossing: one quadratic, control point straight above the chord,
      // walked on a smoothstep. Not Easing.out(Easing.cubic), which the
      // emergence uses: over a 540 px chord an ease-out is 66% of the way
      // across in the first 30% of the flight, so the whole population piles up
      // in the last stride and crawls into its seats — measured on f180, where
      // eleven of the twelve dots in the air were inside the last 90 px. A
      // smoothstep leaves the seat and settles into the new one at the same
      // weight and strings the crossing out across the gap.
      const lin = clamp01((frame - c.xT0) / c.xDur);
      const e = smooth(lin);
      const m = 1 - e;
      const cpx = (c.seat.x + c.target.x) / 2;
      const cpy = (c.seat.y + c.target.y) / 2 - c.bow;
      x = m * m * c.seat.x + 2 * m * e * cpx + e * e * c.target.x;
      y = m * m * c.seat.y + 2 * m * e * cpy + e * e * c.target.y;
      // an absorbed dot shrinks to nothing over the last fifth of its flight
      if (!c.opener) scale = clamp01((1 - lin) / ABSORB_SHARE);
    } else {
      if (!c.opener) return null; // absorbed; it is the seated dot now
      x = c.target.x;
      y = c.target.y;
      // the seated dot's bump, one per absorption, off the arrival frame
      let bump = 0;
      for (const a of ABSORB_AT[c.seatIdx]) {
        if (frame >= a && frame < a + BUMP_FRAMES) bump = 1;
      }
      scale = 1 + BUMP_SCALE * bump;
    }

    const tRipe = c.opener ? smooth((frame - c.xLand) / RIPEN) : 0;
    const fill = tRipe > 0 ? toneRedRipe(tRipe) : toneRed(smooth((frame - c.redStart) / RED_RAMP));

    return {
      key: c.seed,
      x,
      y,
      r: dotRadius * c.rad * breath(frame, hash(c.seed, 9)) * scale,
      fill,
    };
  });

  // -- the US flag ------------------------------------------------------------
  // It rises the last 24 world px into place while it fades in, and lands on
  // "there" in "there is some factor there". No spring and no click: it is a
  // label arriving, not an event.
  const usE = easeOut(clamp01((frame - US_F0) / (US_LAND - US_F0)));

  // -- the two labels ---------------------------------------------------------
  // The same entrance twice: 16 world px and a fade, on the same curve the flag
  // takes. The first lands on "gigs" as the fiftieth dot seats, the second on
  // "America" as the sentence ends.
  const cnLabelE = easeOut(clamp01((frame - CN_LABEL_F0) / (beats.canDo50Gigs - CN_LABEL_F0)));
  const usLabelE = easeOut(clamp01((frame - US_LABEL_F0) / (beats.inAmerica - US_LABEL_F0)));

  // -- camera -----------------------------------------------------------------
  const cam = runCamera(frame, CAM_FF, CAM_CY, CAM_K);
  // the same damper, run a second time over the cx track, so the lateral half
  // of the move has exactly the weight the zoom does
  const camX = runCamera(frame, CAM_FF, CAM_CX, CAM_K).cy;
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // The two flags are icons lying on the field, so they take the small per-icon
  // shadow in screen px. The dots never do: they are the field.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CAM_CX[0]}
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
            {/* what the fifty leave behind, under everything: a dot's own seat
                still holding a red dot at OP_UNREAD after it has gone */}
            {traces.map((t) => (
              <circle
                key={`t${t.key}`}
                cx={t.x}
                cy={t.y}
                r={t.r}
                fill={domesticTone}
                opacity={traceOpacity}
              />
            ))}

            {/* the dots, BELOW the flags, so the fifty are born out of one of
                them and cannot be seen before they leave it */}
            {dots.map((d) =>
              d ? (
                <circle key={d.key} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={dotOpacity} />
              ) : null,
            )}

            {/* the flag of China, the carry-over, floating from f0 */}
            <g style={{ filter: icon }}>
              <defs>
                <clipPath id={CN_CLIP}>
                  <path d={FLAG_PATH} transform={CN_AT} />
                </clipPath>
              </defs>
              <path d={FLAG_PATH} transform={CN_AT} fill={FLAG_RED} />
              <g clipPath={`url(#${CN_CLIP})`}>
                {[CN_BIG_STAR, ...CN_SMALL_STARS].map((s, i) => (
                  <path key={`c${i}`} d={`${path(s)} Z`} fill={accent} />
                ))}
              </g>
            </g>

            {/* the flag of the United States, landing over the twenty */}
            {frame >= US_F0 ? (
              <g
                style={{ filter: icon }}
                opacity={usE}
                transform={`translate(0 ${((1 - usE) * US_RISE).toFixed(2)})`}
              >
                <defs>
                  <clipPath id={US_CLIP}>
                    <path d={FLAG_PATH} transform={US_AT} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${US_CLIP})`}>
                  {Array.from({ length: US_STRIPES }, (_, i) => (
                    <rect
                      key={`s${i}`}
                      x={US_X}
                      y={FLAG_TOP + i * US_STRIPE_H}
                      width={FLAG_W}
                      height={US_STRIPE_H + 0.5}
                      fill={i % 2 === 0 ? US_RED : US_WHITE}
                    />
                  ))}
                  <rect
                    x={US_X}
                    y={FLAG_TOP}
                    width={US_CANTON_W}
                    height={US_CANTON_H}
                    fill={US_BLUE}
                  />
                  {US_STARS.map((s, i) => (
                    <path key={`u${i}`} d={`${path(s)} Z`} fill={US_WHITE} />
                  ))}
                </g>
              </g>
            ) : null}
          </svg>

          {/* the two labels, in world space so they track the camera */}
          {frame >= CN_LABEL_F0 ? (
            <WorldLabel text={labelChina} cx={CN_CX} capY={LABEL_CAP_Y} e={cnLabelE} />
          ) : null}
          {frame >= US_LABEL_F0 ? (
            <WorldLabel text={labelUs} cx={US_CX} capY={LABEL_CAP_Y} e={usLabelE} />
          ) : null}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default FiftyWorthTwenty;
