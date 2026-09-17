import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  WOBBLE_R,
  breath,
  camMove,
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
import { arriveEase } from "./levelUp";
import { CLAUDE, DEEPSEEK, GEMINI, GROK, META, MISTRAL, OPENAI } from "./brandGlyphs";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip `JohnCharlesBeren_Experience`, cut `DigitalMinds` —
// CUT 0, THE OPENER, the first graphic the viewer sees:
//   "one of the key advantages you'd expect eventually digital minds to have"
//
// DURATION. The composition starts at SRT 0.000 s, so every beat is
//   frame = round(t * 24)
//     one f0 · of f4 · the f6 · key f8 · advantages f11 · you'd f20 ·
//     expect f29 · eventually f36 · digital f52 · minds f62 · to f69 ·
//     have f73 · next word "is" f79
// Speech therefore runs f0..79 and the set's 16-frame tail holds the resolved
// state: DURATION = 79 + 16 = 95.
export const DURATION = 95;

// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "experience streams in from everywhere and gathers into a cloud; the AI
//    companies' marks burst out of it; each takes its own share of the cloud."
//
// VOCABULARY, fixed, and nothing else is in the piece:
//   experience /   small SOLID orange dots at DOT_RADIUS. ACCENT_DEEP while
//   an instance    they are streaming in and sitting in the cloud, ACCENT once
//                  they have seated in a mind's halo. Depth is radius and draw
//                  order, never alpha: a dot is opaque wherever it is.
//   a digital mind a BRAND MARK, filled, on `brandGlyphs`' 24-unit em box drawn
//                  as inline <path>. ACCENT_DEEP until the cloud reaches it,
//                  ACCENT after. Top of the z-order; nothing is ever drawn
//                  across one.
// No text, no person, no rings, no lines, no glow.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion; the words are inflections in it. Every
// gesture overlaps its neighbour and nothing in the piece starts from rest: at
// frame 0 the inflow is already 60 frames old, 299 of the 300 dots are in the
// air, and 150 of them are inside the frame with 142 moving (STATS.inflow).
//
//  1. f0-36   "one of the key   THE GATHER. 300 dots stream in from beyond
//             advantages        every frame edge toward world (540, 960) on
//             you'd expect"     individual hashed arcs (arriveEase, each dot's
//             (f0/f8/f11/       own inward swirl, speed-capped at 42 screen
//              f20/f29)         px/frame against the live camera) and seat into
//                               a feathered, wobbled cloud whose occupied
//                               radius grows 5.8 -> 172.2 world px as it fills
//                               (STATS.cloudR). Arrivals run f0..f48 without a
//                               pause at 4..8 dots a frame (mean 6.25,
//                               STATS.arrivalsPerFrame); the VISIBLE inflow is
//                               150 moving dots on screen at f0, peaks at 183
//                               on f13 and is within 9% of that peak on
//                               "advantages" (f11). The cloud mills and
//                               micro-drifts from its first seat.
//                               Camera: k 2.10 -> 1.55 over f0-40, one glide,
//                               warp 0.72 — the first dots are already inside
//                               the frame at f0 and the centre is still empty.
//  2. f36-52  "eventually"      THE TIGHTEN. Every seated dot eases inward on
//             (f36)             its own hash to 0.88 of its radius (a 12%
//                               contraction) over f36+-3 .. f52+-3, the mill
//                               ramps to 2.2x, and the camera creeps IN
//                               k 1.55 -> 1.70 over f40-53: a held breath. The
//                               damper puts its top at 1.6766 on f56, six
//                               frames into the burst, so the release starts
//                               out of a camera that is still closing in.
//  3. f50-66  "digital minds"   THE BURST. Seven marks pop out of the cloud.
//             (f52/f62)         CLAUDE is born at the centre at f50 at scale
//                               0.15, stays there and grows to 1.0 (a 6%
//                               overshoot settling over 8 f). The six others
//                               are born at the centre in hashed order and fly
//                               outward on individual hashed arcs to seats in a
//                               feathered hexagon at radius 270 +- 15 world
//                               (measured 256.6 .. 284.6, none within 25 deg of
//                               the vertical), born f47.8 .. f52.3 and landing
//                               f62.4 .. f66.9. A mark leaving the cloud does
//                               not merely part it at the nose: it cuts a WAKE
//                               (see THE WAKE) that stays open behind it for ten
//                               frames, so by f55 the crowd carries six open
//                               channels radiating from the centre and closes
//                               them again by f70. "minds" (f62) lands on the
//                               first seating.
//                               Camera: the release — one eased pull-back
//                               k 1.70 -> 1.260 over f53-84, warp 0.80.
//  4. f62-90  "to have"         THE SHARE. The cloud divides: every dot flies
//             (f69/f73)         to its NEAREST mark on its own hashed arc
//                               (arriveEase, tangential bow) and seats in a
//                               feathered CROWD around it — a two-rung annulus
//                               on a clear ring of that mark's own ink box + 12,
//                               so no dot ever sits on a mark. A dot goes
//                               ACCENT_DEEP -> ACCENT over the 6 frames it
//                               seats. Each MARK converts ACCENT_DEEP ->
//                               ACCENT when its 6th dot seats — the mechanism
//                               reaching it, not a timer (f72.6 .. f74.8).
//                               Claude's share is 60 dots, the other six 40
//                               each: 300 dealt, none left over.
//                               Departures f62.1..f72.8, landings f71.1..f87.8;
//                               "have" (f73) lands as the first crowds fill in.
//  5. f79-94  tail              The crowds mill, micro-drift AND slide +-4 world
//                               px as bodies on their own hashed sines, so the
//                               seven breathe against each other; the marks
//                               breathe on hashed phases; the camera keeps a
//                               decaying drift to the last frame. Resolved
//                               picture: seven lit marks, each 118 screen px of
//                               ink (CLAUDE 136), each wrapped in its own orange
//                               crowd, centred on screen y 846.
//
// Nothing else. No ring, no connecting line, no glow, no label.
//
// ---------------------------------------------------------------------------
// LIVENESS — mechanisms, not gestures. None is on a word and none ever stops:
//   * the inflow, f-60 .. f48, never pausing.
//   * micro-drift on every dot, +-3 world px on two hashed sines, in flight,
//     seated in the cloud and seated in a crowd.
//   * the cloud's mill: a sheared rotation, hashed rate per dot and falling
//     with radius, from the first seat to the last cloud dot's departure.
//   * each crowd's mill: the same sheared rotation about its mark.
//   * each crowd's BODY DRIFT: +-4 world px on two hashed sines per axis, at
//     its own rate, so no two of the seven move together (haloBody).
//   * every mark's breath, on its own hashed phase.
//   * the grid's parallax and its own -0.3 px/frame drift.
//   * the camera: three glides and a decaying drift, never parked.
// Audited over every 12-frame window (STATS.energy): the quietest window is
// f83..f94 and still carries 1.91 screen px/frame of mean ink motion, and no
// single frame of the piece falls below 1.63.
//
// ---------------------------------------------------------------------------
// THE MARKS. Seven, all on `brandGlyphs`' 24-unit em box, all filled, all with
// the mark shadow. A mark's INK is what the viewer sees, so each is scaled by
// its own measured ink extent rather than by the box, so that every one spans
// MARK_INK = 94 world px on its longer axis:
//
//   mark      source                    ink (units)   em (world)  ink (screen)
//   CLAUDE    brandGlyphs (was there)   24.00 x 24.00   108.10       136.2
//   OPENAI    brandGlyphs (was there)   23.67 x 24.00    94.00       118.4
//   DEEPSEEK  brandGlyphs (was there)   24.00 x 17.66    94.00       118.4
//   GEMINI    lobehub gemini.svg        22.00 x 22.00   102.55       118.4
//   GROK      lobehub grok.svg          24.00 x 23.04    94.00       118.4
//   MISTRAL   lobehub mistral.svg       24.00 x 17.14    94.00       118.4
//   META      lobehub meta.svg          24.00 x 16.00    94.00       118.4
// (ink (screen) is the ink's longer axis at the resolved K_REST 1.260. The
// floor for this cut is 100.)
//
// CLAUDE is 1.15x the others (MARK_CLAUDE_MUL), as the mind at the centre that
// the cloud gathered into. Every mark is ACCENT_DEEP at rest and ACCENT when
// its share reaches it. The em is the ink's LONGER axis, so a mark whose ink is
// short in y (META 16 of 24, MISTRAL 17.1, DEEPSEEK 17.7) is a wide mark rather
// than a stretched one — uniform scale only, as everywhere else in this repo —
// and its crowd's clear ring is an ELLIPSE on its own ink box (MARK_HALF), so
// the crowd hugs a wide mark instead of leaving two empty caps over it.
//
// THE MARKS' SHADOW. `iconShadow`'s shape — 2 px down, 3 px blur, in SCREEN px
// at every camera k — on a wrapper group that sits OUTSIDE the glyph's own
// scale(em/24) and outside the breath, so the filter is never multiplied by the
// em scale (the `FilteringPipeline`/`HiveMind` bug) and the shadow is the same
// 2/3 screen px at k 2.10 as at k 1.05. Its OPACITY is its own number, because
// a solid mark full of narrow pockets takes a drop-shadow at full strength
// inside them where a 14 px dot only ever shows a partial fringe. This cut has
// no stroked ink in it at all, so the REFERENCE IS A DOT, which carries only
// the whole-graphic 2/7/0.12 — a much lower bar than the 6 px stroke
// `MillionsOfYears` matched against (0.27) or the person glyph `Distillation`
// matched against (0.13). Measured on f090 with `scratchpad/dm/shadow.py`, as
// the DEFICIT of the darkest shadow pixel against that element's own local
// field (so the vignette cannot skew it):
//   opacity   mark deficit (median of 7)   worst mark (CLAUDE)   dot deficit
//   0.00      12                           22                    12 worst / 6 median
//   0.03      13                           24                    12 / 6
//   0.13      21                           31                    13 / 6
//   0.38      40                           52                    25 / 6  (contaminated:
//                                                                 dots beside a mark
//                                                                 catch ITS shadow)
// 0.03 is the value: the typical mark's darkest shadow pixel (13 below its
// field) equals a dot's darkest (12). CLAUDE is the irreducible outlier — its
// twelve-ray burst measures 22 with the mark shadow switched off entirely,
// because the GLOBAL shadow already saturates in the pockets between the rays.
// See MARK_SHADOW_OPACITY.
//
// ---------------------------------------------------------------------------
// THE CROWDS. Seven of them, and they are crowds and not rings: each is a
// two-rung annulus (HALO_RUNGS 1.6 at HALO_STEP 12.65 world px) sitting on a
// clear ring of the mark's own ink half-box + HALO_CLEAR 12, with its outer
// edge dissolving over HALO_FEATHER 2.5 rows — density falling on a smoothstep,
// dot radius tapering to HALO_TAPER 0.7, and the nominal boundary wobbled by
// +-6 px, exactly the crowd-shape rule of the style. The seats a crowd does NOT
// fill are chosen from the OUTSIDE IN (HALO_USED's drop key is the feather value
// with a hashed rag on it), so the body stays dense and the thinning happens in
// the feather where it reads as a soft edge. Measured: 86..118 raw seats per
// crowd, 40 of them occupied (CLAUDE 60), occupied outer radius 92.5 .. 108.5
// world px, and the closest two crowds in the resolved picture clear each other
// by 39 px with both body drifts at full throw (STATS.haloGap).
// The one ALPHA rung in the piece is here: a back-rung dot inside a SEATED crowd
// is drawn at OP_MID 0.78 (see OP_MID) so each crowd has a behind and a front.
// Every other dot in the cut — the whole inflow, the whole cloud, every front
// dot — is solid, as the orange Dwarkesh rule says.
//
// ---------------------------------------------------------------------------
// CAMERA — one keyed track, damped through `runCamera`. c is constant at 960:
// the composition is radially symmetric about the centre at every frame, so the
// ink centre IS world (540, 960) and cy = 960 + 125/k puts it on screen y 835
// (CAM_LIFT).
//
//   f0-40    k 2.100 -> 1.550   warp 0.72  THE GATHER's pull-back, one glide,
//                                          speed early; bottoms at 1.5592 on f42
//   f40-53   k 1.550 -> 1.700   warp 0.90  THE TIGHTEN's creep in; tops at
//                                          1.6766 on f56
//   f53-84   k 1.700 -> 1.267   warp 0.80  THE BURST's release
//   f84-143  k       -> -0.030  warp 0.50  a drift still running at f94, so no
//                                          frame of the piece is static
//
// The DAMPED track, measured (STATS.cam):
//   f0 2.1000 · f11 1.9908 · f29 1.6664 · f36 1.5889 · f42 1.5592 · f47 1.5870
//   f52 1.6501 · f56 1.6766 · f62 1.6338 · f73 1.4326 · f84 1.2885 · f94 1.2600
// K_END is SOLVED (secant, two probes) so the DAMPED camera reads exactly
// K_REST = 1.260 on the last frame, and every weight in the piece is a screen
// number divided by it. The probe is a fixed world point 300 px below the
// centre: peak screen speed 6.20 px/frame, peak |dv| 0.957 px/frame^2 (the
// set's ceiling is 2.2), and the SLOWEST frame of the whole piece still moves
// it 0.229 px (the floor is 0.15) — the camera is never parked. The shape of
// the move is untouched from V1: the same three glides, the same warps, the
// same opening 2.100 and the same creep 1.55 -> 1.70.
//
// Head speeds, all under the set's 45 screen px/frame ceiling and all solved by
// lengthening the flight a frame at a time until they are: the inflow peaks at
// 42.00 (all 300 stretched), the burst at 41.59 (all 6), the share at 41.00
// (none needed stretching).
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * K_REST IS 1.260, NOT 1.300. The rule is the brief's own: side margins
//     >= 60 px and the resolved picture inside the caption band y 300..1370 with
//     40 px of clearance. At MARK_INK 94 and HEX_R 270 the resolved half-extents
//     are 356.5 world px across and 344 down, so the SIDE MARGIN is again the
//     binding constraint and caps k at 480 / 356.5 = 1.346 (the band would allow
//     1.439). 1.260 sits inside both with air to spare: x 87.1 .. 985.3 (side
//     margin 87), y 413.2 .. 1279.8 (113 px clear of the band's top, 90 of its
//     bottom), content centre screen 846.5 against CAM_LIFT's 835. Every mark's
//     ink is 118 screen px on its longer axis, CLAUDE's 136, against the floor
//     of 100.
//   * THE SIX FLYERS ARE 0.9 f APART AT THEIR LANDINGS, NOT 2 f APART AT THEIR
//     BIRTHS — unchanged from V1, and for the same arithmetic: a seat at radius
//     270 needs 10.1 .. 14.6 frames to fly under the 42 screen px/frame cap, so
//     births 2 f apart from f50 would put the last landing well past "minds".
//     The LANDINGS are authored instead, at 62.4 + 0.9 * i, and each departure
//     is solved back through its own arc: births f47.8 .. f52.3, landings
//     f62.4 .. f66.9, the whole burst inside the f50-66 window. Order is hashed.
//   * THE FAR SIDE OF THE CLOUD SETS OFF FIRST. The share's departures are
//     hashed over SHARE_DEPART_W as before, but scaled by (1 - 0.5 * len/380):
//     with 300 dots and crowds at radius 270 the longest arcs are ~380 world px,
//     and a purely hashed departure put the last landing at f100 — five frames
//     past the end of the composition, with the last dots still ripening off
//     the back of it. Weighted this way the landings finish at f87.8 and the
//     last dot is fully ripe on f93.8, inside the tail.
//   * THE MILL IS A SHEARED ROTATION, NOT A SEAT-HOP — unchanged from V1: the
//     cloud is 300 dots dealt onto the front of a feathered disc and a hop-mill
//     in it has nowhere to hop.
//   * THE VISIBLE INFLOW PEAKS ON f13, NOT f11. The arrivals are near-even now
//     (ARRIVE_POW 0.85, 4..8 a frame across f0..f48) because the brief asks for
//     ~6 dots a frame; what reads as "densest" is the number of MOVING dots on
//     screen, and that is driven as much by the camera opening the frame as by
//     the arrivals. Measured every third frame it runs 150 (f0) · 168 (f9) ·
//     183 (f15) · 170 (f21) · 127 (f30) · 44 (f42) · 0 (f48): a plateau f9..f21
//     whose peak is f13, within 9% of it on "advantages" (f11).
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: an instance that has reached a mind
  accentDeep: z.string(), // deep: an instance streaming in, a mind not yet reached
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
    one: z.number(),
    key: z.number(),
    advantages: z.number(),
    youd: z.number(),
    expect: z.number(),
    eventually: z.number(),
    digital: z.number(),
    minds: z.number(),
    to: z.number(),
    have: z.number(),
    end: z.number(), // next word "is"; tail to 95
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
  beats: {
    one: 0,
    key: 8,
    advantages: 11,
    youd: 20,
    expect: 29,
    eventually: 36,
    digital: 52,
    minds: 62,
    to: 69,
    have: 73,
    end: 79,
  },
});

export const WORLD_W = 1080;
export const WORLD_H = 1920;
export const CX = 540;
export const CORE = { x: CX, y: 960 };

// --- the depth ladder ------------------------------------------------------
// Dots are SOLID: every one of them is drawn at OP_UNREAD_DOT = 1.0 and its
// state is TONE (deep -> ripe), its depth radius and draw order. No alpha rung
// on a dot anywhere in this cut — the orange Dwarkesh rule.
export const OP_FG = 1.0;
const BG_R_SCALE = 0.8; // a back dot is smaller, not fainter
const BG_DRIFT = 1.45; // and rides more micro-drift
const BACK_FRACTION = 0.34; // hashed, so "back" is a feathered third, not a band
const R_SPREAD = 0.18; // +-18% hashed per-dot radius

// ---------------------------------------------------------------------------
// THE CAMERA. fieldShared's `camMove` verbatim — one key per frame on an eased
// curve, cy taken off the eased k, the set's CAM_LIFT of 125 — then the shared
// damper.
// ---------------------------------------------------------------------------
const K_REST_TARGET = 1.26;
const LAST = DURATION - 1;
export const C_FIXED = CORE.y;

type Seg = { f0: number; f1: number; k0: number; k1: number; warp: number };

const segsFor = (kEnd: number): Seg[] => [
  { f0: 0, f1: 40, k0: 2.1, k1: 1.55, warp: 0.72 },
  { f0: 40, f1: 53, k0: 1.55, k1: 1.7, warp: 0.9 },
  { f0: 53, f1: 84, k0: 1.7, k1: kEnd, warp: 0.8 },
  { f0: 84, f1: DURATION + 48, k0: kEnd, k1: kEnd - 0.03, warp: 0.5 },
];

const trackOf = (segs: Seg[]) => {
  const F: number[] = [0];
  const K: number[] = [segs[0].k0];
  const CY: number[] = [C_FIXED + CAM_LIFT / segs[0].k0];
  for (const s of segs) {
    const m = camMove({ ...s, c0: C_FIXED, c1: C_FIXED });
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    }
  }
  return { F, K, CY };
};

const kAtLast = (kEnd: number) => {
  const t = trackOf(segsFor(kEnd));
  return runCamera(LAST, t.F, t.CY, t.K).k;
};
export const K_END = (() => {
  const a = 0.95;
  const b = 1.45;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom every weight in the piece is written against. */
export const K_REST = kAtLast(K_END);

export const CAM = trackOf(segsFor(K_END));

const CAM_AT_F: { cy: number; k: number }[] = (() => {
  const out: { cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    out.push({ cy: c.cy + sway(f).dy, k: c.k });
  }
  return out;
})();
/** Clamped at both ends: the inflow is born before frame 0, where the camera is
 *  still sitting on its opening key, so a negative frame reads f0. */
const camIdx = (f: number) => Math.max(0, Math.min(DURATION, Math.round(f)));
const kAt = (f: number) => CAM_AT_F[camIdx(f)].k;
export const screenAt = (f: number, wx: number, wy: number) => {
  const c = CAM_AT_F[camIdx(f)];
  return [CX + (wx - (CX + sway(f).dx)) * c.k, 960 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE WEIGHTS. This cut has no outline in it at all — no ring, no line — so the
// only sizes are the dot and the marks' em boxes, and both are world numbers
// whose screen value at K_REST is reported in STATS.
// ---------------------------------------------------------------------------
export const DOT_R = DOT_RADIUS;
const HEAD_CAP = 42; // screen px/frame; the set's ceiling is 45

// ---------------------------------------------------------------------------
// THE SEVEN MINDS.
// ---------------------------------------------------------------------------
/** World px a mark's ink spans on its LONGER axis. */
export const MARK_INK = 94;
export const MARK_CLAUDE_MUL = 1.15;

type MarkDef = {
  name: string;
  glyph: { viewBox: string; paths: string[] };
  /** the ink's extent inside the 24-unit box, measured off the path data */
  inkW: number;
  inkH: number;
  mul: number;
};

/** CLAUDE first: it is the mind at the centre. The other six are dealt to the
 *  hexagon's seats in HASHED order below, so the burst is never a sweep. */
export const MARKS: MarkDef[] = [
  { name: "CLAUDE", glyph: CLAUDE, inkW: 24.0, inkH: 24.0, mul: MARK_CLAUDE_MUL },
  { name: "OPENAI", glyph: OPENAI, inkW: 23.67, inkH: 24.0, mul: 1 },
  { name: "GEMINI", glyph: GEMINI, inkW: 22.0, inkH: 22.0, mul: 1 },
  { name: "DEEPSEEK", glyph: DEEPSEEK, inkW: 24.0, inkH: 17.66, mul: 1 },
  { name: "GROK", glyph: GROK, inkW: 24.0, inkH: 23.04, mul: 1 },
  { name: "MISTRAL", glyph: MISTRAL, inkW: 24.0, inkH: 17.14, mul: 1 },
  { name: "META", glyph: META, inkW: 24.0, inkH: 16.0, mul: 1 },
];
export const NM = MARKS.length;

/** The em box each mark is drawn on, so its INK is MARK_INK * mul on its LONGER
 *  axis. Uniform scale only: a mark short in y is a wide mark, not a squashed
 *  one. */
const INK_LONG = MARKS.map((m) => Math.max(m.inkW, m.inkH));
export const MARK_EM = MARKS.map((m, i) => (MARK_INK * m.mul * 24) / INK_LONG[i]);
/** Half the mark's visible INK on its longer axis — the piece's size ladder. */
const MARK_INK_HALF = MARKS.map((m, i) => (MARK_INK * m.mul) / 2);
/** Half the mark's visible ink box, PER AXIS, in world px. The halo's clear
 *  ring is an ELLIPSE on this box, so a wide-and-short mark (META 24 x 16,
 *  MISTRAL 24 x 17.1, DEEPSEEK 24 x 17.7) gets a crowd that hugs its shape
 *  instead of a circle with two empty caps above and below it. */
const MARK_HALF = MARKS.map((m, i) => ({
  x: ((MARK_INK * m.mul) / 2) * (m.inkW / INK_LONG[i]),
  y: ((MARK_INK * m.mul) / 2) * (m.inkH / INK_LONG[i]),
}));

// The feathered hexagon. Base angles 0/60/120/180/240/300 deg, so no seat is on
// the vertical axis, plus a hashed +-10 deg (which cannot reach 90 or 270) and
// a hashed +-15 world px of radius.
export const HEX_R = 270;
const HEX_JIT_R = 15;
const HEX_JIT_A = (10 * Math.PI) / 180;

/** Which glyph sits on which hexagon seat: hashed, never in index order. */
const HEX_ORDER: number[] = Array.from({ length: NM - 1 }, (_, i) => i + 1).sort(
  (a, b) => hash(a, 211) - hash(b, 211),
);

export const MARK_SEAT: { x: number; y: number }[] = (() => {
  const out = new Array<{ x: number; y: number }>(NM);
  out[0] = { x: CORE.x, y: CORE.y };
  HEX_ORDER.forEach((m, s) => {
    const a = (s * Math.PI) / 3 + (hash(s, 213) - 0.5) * 2 * HEX_JIT_A;
    const r = HEX_R + (hash(s, 214) - 0.5) * 2 * HEX_JIT_R;
    out[m] = { x: CORE.x + Math.cos(a) * r, y: CORE.y + Math.sin(a) * r };
  });
  return out;
})();

// THE BURST's schedule. The landings are authored (see DEVIATIONS) and the
// departure of each flyer is solved back through its own arc under the head cap.
const BURST_CLAUDE = 50; // CLAUDE is born, in place
const CLAUDE_GROW = 9; // frames it takes to reach full size
const BURST_LAND0 = 62.4; // just past "minds" (f62), so the word leads it
const BURST_LAND_STEP = 0.9;
const BURST_SPEED = 21; // world px/frame nominal along the arc
const MARK_OVERSHOOT = 1.06;
const MARK_SETTLE = 8;

type MarkFlight = { born: number; land: number; swirl: number; r: number; th: number };

const MARK_STATS = { stretched: 0, peakHead: 0 };

export const MARK_FLIGHT: MarkFlight[] = (() => {
  const out = new Array<MarkFlight>(NM);
  out[0] = { born: BURST_CLAUDE, land: BURST_CLAUDE + CLAUDE_GROW, swirl: 0, r: 0, th: 0 };
  HEX_ORDER.forEach((m, s) => {
    const seat = MARK_SEAT[m];
    const dx = seat.x - CORE.x;
    const dy = seat.y - CORE.y;
    const r = Math.hypot(dx, dy);
    const th = Math.atan2(dy, dx);
    const swirl = (hash(m, 217) - 0.5) * 2 * 0.42; // rad of inward swirl
    const land = BURST_LAND0 + BURST_LAND_STEP * s;
    // the arc's own length, sampled, so the flight is solved on what it flies
    const pointAt = (u: number) => {
      const g = arriveEase(u);
      const rr = r * g;
      const tt = th + swirl * (1 - g);
      return [CORE.x + Math.cos(tt) * rr, CORE.y + Math.sin(tt) * rr];
    };
    let flight = Math.max(6, r / BURST_SPEED);
    const peak = (fl: number) => {
      let mx = 0;
      const d0 = land - fl;
      for (let f = Math.ceil(d0) + 1; f <= land; f++) {
        const a = pointAt(clamp01((f - 1 - d0) / fl));
        const b = pointAt(clamp01((f - d0) / fl));
        const pa = screenAt(f - 1, a[0], a[1]);
        const pb = screenAt(f, b[0], b[1]);
        mx = Math.max(mx, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]));
      }
      return mx;
    };
    let guard = 0;
    while (peak(flight) > HEAD_CAP && guard < 40) {
      flight += 0.5;
      guard++;
    }
    if (guard > 0) MARK_STATS.stretched++;
    MARK_STATS.peakHead = Math.max(MARK_STATS.peakHead, peak(flight));
    out[m] = { born: land - flight, land, swirl, r, th };
  });
  return out;
})();

/** A mark's live world position: born at the centre, out along its own arc. */
const markPosAt = (m: number, frame: number) => {
  const F = MARK_FLIGHT[m];
  if (F.r <= 0) return MARK_SEAT[m];
  if (frame >= F.land) return MARK_SEAT[m];
  const g = arriveEase(clamp01((frame - F.born) / (F.land - F.born)));
  const rr = F.r * g;
  const tt = F.th + F.swirl * (1 - g);
  return { x: CORE.x + Math.cos(tt) * rr, y: CORE.y + Math.sin(tt) * rr };
};

/** A mark's scale: 0.15 at birth, MARK_OVERSHOOT at the landing, settling to 1
 *  over MARK_SETTLE frames, times its own breath. */
const markScaleAt = (m: number, frame: number) => {
  const F = MARK_FLIGHT[m];
  if (frame < F.born) return 0;
  const b = breath(frame, hash(m, 231));
  if (frame < F.land) {
    const g = arriveEase(clamp01((frame - F.born) / (F.land - F.born)));
    return (0.15 + (MARK_OVERSHOOT - 0.15) * g) * b;
  }
  const s = smoothstep(clamp01((frame - F.land) / MARK_SETTLE));
  return (MARK_OVERSHOOT + (1 - MARK_OVERSHOOT) * s) * b;
};

/** The mark's own shadow opacity. `iconShadow`'s shape, its own strength: a
 *  solid mark full of narrow pockets takes the blurred shadow at FULL coverage
 *  inside them, where a 5.5 px dot carrying only the global 2/7/0.12 shows a
 *  partial fringe. Measured on f090 (see the header): at 0.38 the darkest pixel
 *  under a mark is 60 against the dot's 101 on a field of 116; at 0.07 it is 99.
 *  Solved, not chosen. */
export const MARK_SHADOW_OPACITY = 0.03;

// ---------------------------------------------------------------------------
// THE CLOUD. A feathered, wobbled disc of seats around the centre, DEALT IN
// RADIUS ORDER with a hashed rag on the front, so the cloud's occupied radius
// IS its fill: it grows as the inflow lands and its boundary is never a drawn
// circle at any frame of the growth.
// ---------------------------------------------------------------------------
const CLOUD_R1 = 205;
const CLOUD_STEP = 3.45 * DOT_R; // 18.98 world px: 300 dots fill to ~175
const N_DOT = 300;
const CLOUD_RAG = 11; // world px of hashed rag on the growing front

type Seat = { x: number; y: number; r: number; rho: number; back: boolean };

/** How many seats the feathered disc actually yielded, before the 300 are dealt
 *  off the front of it: the cloud's occupancy is N_DOT / this. */
const CLOUD_RAW = { n: 0 };

const CLOUD_SEATS: Seat[] = (() => {
  const raw: (Seat & { key: number })[] = [];
  const cols = Math.ceil((2 * CLOUD_R1) / CLOUD_STEP) + 3;
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = CORE.x - CLOUD_R1 + c * CLOUD_STEP + (hash(i, 11) - 0.5) * CLOUD_STEP * 0.9;
      const y = CORE.y - CLOUD_R1 + r * CLOUD_STEP + (hash(i, 12) - 0.5) * CLOUD_STEP * 0.9;
      const dx = x - CORE.x;
      const dy = y - CORE.y;
      const rho = Math.hypot(dx, dy);
      const wob = wobble(Math.atan2(dy, dx) * WOBBLE_R, 2.3) * 5;
      const f = feather((CLOUD_R1 + wob - rho) / 16, 1);
      if (f <= 0 || hash(i, 71) >= f) continue;
      raw.push({
        x: dx,
        y: dy,
        r: (0.85 + 0.35 * hash(i, 13)) * (0.72 + 0.28 * f) * (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        rho,
        back: hash(i, 98) < BACK_FRACTION,
        key: rho - CLOUD_RAG * hash(i, 73),
      });
    }
  }
  raw.sort((a, b) => a.key - b.key);
  CLOUD_RAW.n = raw.length;
  if (raw.length < N_DOT) {
    throw new Error(`cloud: ${raw.length} seats for ${N_DOT} dots — widen CLOUD_R1`);
  }
  return raw.slice(0, N_DOT).map(({ key: _key, ...s }) => s);
})();
export const CLOUD_SEATS_RAW_N = CLOUD_RAW.n;

// THE TIGHTEN: every seated dot eases to TIGHTEN x its radius on its own hash.
const TIGHTEN = 0.88;
const TIGHT_F0 = 36; // "eventually"
const TIGHT_F1 = 52;
const TIGHT_JIT = 3;
const tightAt = (i: number, frame: number) => {
  const j = (hash(i, 141) - 0.5) * 2 * TIGHT_JIT;
  return 1 + (TIGHTEN - 1) * smoothstep(clamp01((frame - (TIGHT_F0 + j)) / (TIGHT_F1 - TIGHT_F0)));
};

// THE MILL, for both crowds: a rotation about the crowd's own centre at a
// hashed per-dot rate that falls with radius, so the crowd shears and no two
// dots ever move together. It ramps 1 -> MILL_RAMP across the tighten, which is
// the mill "speeding up", and never stops. Integrated as a cumulative table so
// the angle is continuous whatever the ramp does.
const MILL_W = 0.0095; // rad/frame at the rim, before the ramp
const MILL_RAMP = 2.2;
const MILL_CUM: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 2; f++) {
    const ramp = 1 + (MILL_RAMP - 1) * smoothstep(clamp01((f - TIGHT_F0) / (TIGHT_F1 - TIGHT_F0)));
    out.push(out[f - 1] + ramp);
  }
  return out;
})();
const millCum = (f: number) => MILL_CUM[Math.max(0, Math.min(MILL_CUM.length - 1, Math.round(f)))];
/** A dot's own angular rate: hashed +-30%, falling to 0.65x at the rim. */
const millRate = (i: number, rhoNorm: number, seed: number) =>
  MILL_W * (0.85 + 0.3 * hash(i, seed)) * (1 - 0.35 * clamp01(rhoNorm));

/** A cloud dot's live seat: the tighten and the mill, in world coordinates. */
const cloudSeatAt = (i: number, frame: number) => {
  const S = CLOUD_SEATS[i];
  const t = tightAt(i, frame);
  const w = millRate(i, S.rho / CLOUD_R1, 131) * millCum(frame);
  const cs = Math.cos(w);
  const sn = Math.sin(w);
  return {
    x: CORE.x + (S.x * cs - S.y * sn) * t,
    y: CORE.y + (S.x * sn + S.y * cs) * t,
  };
};

// ---------------------------------------------------------------------------
// THE INFLOW. 300 dots, one per cloud seat, streaming in from beyond every
// frame edge on individual hashed arcs. Arrivals are AUTHORED over f0..f48 and
// the birth is solved back through the arc under the head cap, so the first
// dots are already deep inside the frame at f0 and the stream never pauses.
//
// The spawn radius has to be outside the frame AT THE DOT'S BIRTH, and the
// frame grows as the camera pulls back: at k 2.10 the corner is 577 world px
// from the centre, at k 1.55 it is 782. SPAWN_R0 820 clears both, and STATS
// .spawnOutside measures every dot's first frame against its own camera.
// ---------------------------------------------------------------------------
const SPAWN_R0 = 820;
const SPAWN_R_SPREAD = 110;
const ARRIVE_F1 = 48;
const ARRIVE_POW = 0.85; // arrivals are near-even: ~6-7 a frame across f0..f48
const IN_SPEED = 26; // world px/frame nominal; the cap bites while k is high
const IN_SWIRL = 0.55; // rad of hashed inward swirl

type Inflow = { seat: number; born: number; arrive: number; rSpawn: number; swirl: number };

const IN_STATS = { stretched: 0, peakHead: 0 };

export const INFLOW: Inflow[] = CLOUD_SEATS.map((S, i) => {
  const arrive = ARRIVE_F1 * Math.pow(i / Math.max(1, N_DOT - 1), ARRIVE_POW);
  const rSeat = Math.hypot(S.x, S.y) * TIGHTEN + 1e-6;
  const thSeat = Math.atan2(S.y, S.x);
  const rSpawn = SPAWN_R0 + hash(i, 151) * SPAWN_R_SPREAD;
  const swirl = (hash(i, 152) - 0.5) * 2 * IN_SWIRL;
  const pointAt = (u: number) => {
    const g = arriveEase(u);
    const rr = rSpawn + (rSeat - rSpawn) * g;
    const tt = thSeat + swirl * (1 - g);
    return [CORE.x + Math.cos(tt) * rr, CORE.y + Math.sin(tt) * rr];
  };
  let flight = Math.max(10, (rSpawn - rSeat) / IN_SPEED);
  const peak = (fl: number) => {
    let mx = 0;
    const d0 = arrive - fl;
    for (let f = Math.ceil(d0) + 1; f <= arrive; f++) {
      const a = pointAt(clamp01((f - 1 - d0) / fl));
      const b = pointAt(clamp01((f - d0) / fl));
      const pa = screenAt(f - 1, a[0], a[1]);
      const pb = screenAt(f, b[0], b[1]);
      mx = Math.max(mx, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]));
    }
    return mx;
  };
  let guard = 0;
  while (peak(flight) > HEAD_CAP && guard < 120) {
    flight += 1;
    guard++;
  }
  if (guard > 0) IN_STATS.stretched++;
  IN_STATS.peakHead = Math.max(IN_STATS.peakHead, peak(flight));
  return { seat: i, born: arrive - flight, arrive, rSpawn, swirl };
});

// ---------------------------------------------------------------------------
// THE CROWDS (the halos). A feathered two-rung annulus of seats around each
// mark, on a CLEAR RING that is an ellipse on that mark's own ink box +
// HALO_CLEAR, so no dot ever sits on a mark and none floats off a wide one.
// CLAUDE's is wider and holds 60 dots; the other six hold 40 each, so all 300
// are dealt and none is left in the cloud.
// ---------------------------------------------------------------------------
const HALO_CLEAR = 12; // the clear ring is the mark's ink half-box + this
const HALO_RUNGS = 1.6; // rungs of solid crowd before the edge starts to go
const HALO_FEATHER = 2.5; // rows the outer edge dissolves over
const HALO_TAPER = 0.7; // a dot's radius at the outer edge of that feather
const HALO_WOB = 6; // world px of hashed wobble on the outer boundary
export const HALO_SHARE = [60, 40, 40, 40, 40, 40, 40]; // 300 dots, all dealt
const HALO_STEP = 2.3 * DOT_R;

type HaloSeat = {
  x: number;
  y: number;
  r: number;
  rho: number;
  th: number;
  back: boolean;
  f: number; // 1 in the body, falling to 0 through the feathered outside
};

/** The clear ring's radius along a ray: the mark's own ink box + HALO_CLEAR,
 *  as an ellipse, so the crowd keeps a constant clearance all the way round a
 *  wide mark instead of leaving caps of empty grid above and below it. */
const haloClearAt = (m: number, th: number) => {
  const ax = MARK_HALF[m].x + HALO_CLEAR;
  const ay = MARK_HALF[m].y + HALO_CLEAR;
  const c = Math.cos(th) / ax;
  const s = Math.sin(th) / ay;
  return 1 / Math.hypot(c, s);
};

const makeHalo = (m: number): HaloSeat[] => {
  const st = MARK_SEAT[m];
  const rMax = MARK_INK_HALF[m] + HALO_CLEAR + (HALO_RUNGS + HALO_FEATHER) * HALO_STEP;
  const out: HaloSeat[] = [];
  const cols = Math.ceil((2 * rMax) / HALO_STEP) + 3;
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c + m * 977 + 5171;
      const x = st.x - rMax + c * HALO_STEP + (hash(i, 11) - 0.5) * HALO_STEP * 0.7;
      const y = st.y - rMax + r * HALO_STEP + (hash(i, 12) - 0.5) * HALO_STEP * 0.7;
      const dx = x - st.x;
      const dy = y - st.y;
      const rho = Math.hypot(dx, dy);
      const th = Math.atan2(dy, dx);
      const r0 = haloClearAt(m, th); // no dot ever inside this
      const rBody = r0 + HALO_RUNGS * HALO_STEP; // the body of the crowd
      const wob = wobble(th * WOBBLE_R, 4.1 + m) * HALO_WOB;
      const f = feather(
        Math.min((rBody + wob - rho) / (HALO_FEATHER * HALO_STEP) + 1, (rho - r0) / 6),
        1,
      );
      if (f <= 0 || hash(i, 71) >= f) continue;
      out.push({
        x: dx,
        y: dy,
        r:
          (0.85 + 0.35 * hash(i, 13)) *
          (HALO_TAPER + (1 - HALO_TAPER) * f) *
          (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        rho,
        th,
        back: hash(i, 98) < BACK_FRACTION,
        f,
      });
    }
  }
  return out;
};

export const HALO: HaloSeat[][] = Array.from({ length: NM }, (_, m) => makeHalo(m));

// WHICH halo seats are occupied. Not "the ones nearest the cloud": taking the
// nearest free seat for every dot fills each halo from the centre-facing side
// and leaves the outer half bare, which renders as seven lopsided commas
// instead of seven marks wrapped in a crowd. So the OCCUPIED seats are chosen
// first, blue-noise (a seat is only dropped next to a seat that is already
// dropped, two passes), exactly as `ANN_USED` does it in `MillionsOfYears`, and
// the dots are dealt to THOSE seats by distance afterwards. Every gap is then a
// single hole with dots all round it and the crowd goes all the way round.
export const HALO_USED: number[][] = HALO.map((seats, m) => {
  if (seats.length < HALO_SHARE[m]) {
    throw new Error(`halo ${m}: ${seats.length} seats for ${HALO_SHARE[m]} dots — widen the band`);
  }
  const want = seats.length - HALO_SHARE[m];
  const empty = new Uint8Array(seats.length);
  // The OUTSIDE goes first: the drop order is the feather value with a hashed
  // rag on it, so the crowd thins from its dissolving edge inwards and its body
  // stays dense. Inside the body (f = 1) the order is pure hash and the
  // near-neighbour rule applies, so its few holes are single and scattered.
  const key = (i: number) => seats[i].f + 0.34 * hash(i + m * 31, 77);
  const order = seats.map((_s, i) => i).sort((a, b) => key(a) - key(b));
  const near = (a: number, b: number) =>
    Math.hypot(seats[a].x - seats[b].x, seats[a].y - seats[b].y) < HALO_STEP * 1.6;
  let dropped = 0;
  for (let pass = 0; pass < 2 && dropped < want; pass++) {
    for (const i of order) {
      if (dropped >= want) break;
      if (empty[i]) continue;
      if (pass === 0 && seats[i].f > 0.6 && order.some((j) => empty[j] && near(i, j))) continue;
      empty[i] = 1;
      dropped++;
    }
  }
  return seats.map((_s, i) => i).filter((i) => !empty[i]);
});

// THE HALO'S BODY DRIFT. On top of the mill, each halo slides +-4 world px as a
// WHOLE on two hashed sines per axis, at its own rate, so in the tail the seven
// crowds breathe against each other instead of seven identical mills. The mark
// itself does not move with it: the crowd drifts around the mind.
const HALO_BODY = 4;
const haloBody = (m: number, f: number) => ({
  dx:
    2.4 * Math.sin(f * 0.0817 + hash(m, 41) * 6.283) +
    1.6 * Math.sin(f * 0.1231 + hash(m, 42) * 6.283),
  dy:
    2.3 * Math.sin(f * 0.0709 + hash(m, 43) * 6.283) +
    1.7 * Math.sin(f * 0.1069 + hash(m, 44) * 6.283),
});

/** A halo seat's live world position: the mark's seat, its own milled rotation
 *  about it, and the halo's body drift. */
const haloSeatAt = (m: number, s: number, frame: number) => {
  const H = HALO[m][s];
  const w = millRate(s + m * 313, H.rho / 110, 137) * millCum(frame);
  const cs = Math.cos(w);
  const sn = Math.sin(w);
  const b = haloBody(m, frame);
  return {
    x: MARK_SEAT[m].x + (H.x * cs - H.y * sn) + b.dx,
    y: MARK_SEAT[m].y + (H.x * sn + H.y * cs) + b.dy,
  };
};

// ---------------------------------------------------------------------------
// THE SHARE. Every dot goes to its NEAREST mark, capacity-constrained: all
// (dot, mark) pairs sorted by distance from the dot's tightened cloud seat, and
// each dot taken by the nearest mark that still has room. With the cloud at the
// centre and CLAUDE on it, that divides the cloud into a core plus six wedges,
// which is what "each takes its own share" looks like.
// ---------------------------------------------------------------------------
const SHARE_F0 = 62; // "minds" — the cloud starts dividing as the last marks seat
const SHARE_DEPART_W = 11; // departures spread over f62..f73
const SHARE_FAR = 380; // world px: the length that counts as "the far side"
const SHARE_SPEED = 19; // world px/frame nominal along the arc
const SHARE_BOW = 26; // world px of hashed tangential bow
export const SEAT_TONE = 6; // frames a dot takes to go deep -> ripe as it seats
const MARK_RIPE_AT_NTH = 6; // a mark converts when its 6th dot seats

type Share = {
  mark: number;
  seat: number; // index into HALO[mark]
  depart: number;
  land: number;
  bow: number;
  back: boolean;
};

const SHARE_STATS = { stretched: 0, peakHead: 0 };

export const SHARE: Share[] = (() => {
  // -- which mark: nearest, capacity-constrained --------------------------
  const pos = CLOUD_SEATS.map((S) => ({ x: CORE.x + S.x * TIGHTEN, y: CORE.y + S.y * TIGHTEN }));
  const pairs: { d: number; i: number; m: number }[] = [];
  pos.forEach((p, i) => {
    for (let m = 0; m < NM; m++) {
      pairs.push({ d: Math.hypot(p.x - MARK_SEAT[m].x, p.y - MARK_SEAT[m].y), i, m });
    }
  });
  pairs.sort((a, b) => a.d - b.d);
  const mine = new Array<number>(N_DOT).fill(-1);
  const room = HALO_SHARE.slice();
  for (const p of pairs) {
    if (mine[p.i] >= 0 || room[p.m] <= 0) continue;
    mine[p.i] = p.m;
    room[p.m] -= 1;
  }

  // -- which seat: nearest free seat in that mark's halo -------------------
  const seatOf = new Array<number>(N_DOT).fill(-1);
  for (let m = 0; m < NM; m++) {
    const dots = mine.map((mm, i) => (mm === m ? i : -1)).filter((i) => i >= 0);
    const sp: { d: number; i: number; s: number }[] = [];
    dots.forEach((i) => {
      HALO_USED[m].forEach((s) => {
        const H = HALO[m][s];
        sp.push({
          d: Math.hypot(pos[i].x - (MARK_SEAT[m].x + H.x), pos[i].y - (MARK_SEAT[m].y + H.y)),
          i,
          s,
        });
      });
    });
    sp.sort((a, b) => a.d - b.d);
    const taken = new Uint8Array(HALO[m].length);
    for (const p of sp) {
      if (seatOf[p.i] >= 0 || taken[p.s]) continue;
      seatOf[p.i] = p.s;
      taken[p.s] = 1;
    }
  }

  // -- when: hashed departures, the flight solved under the head cap -------
  return CLOUD_SEATS.map((_S, i) => {
    const m = mine[i];
    const s = seatOf[i];
    const H = HALO[m][s];
    const target = { x: MARK_SEAT[m].x + H.x, y: MARK_SEAT[m].y + H.y };
    const bow = (hash(i, 122) - 0.5) * 2 * SHARE_BOW;
    const dx = target.x - pos[i].x;
    const dy = target.y - pos[i].y;
    const len = Math.hypot(dx, dy) || 1;
    // hashed, but the FAR side sets off first (a dot on the wrong side of the
    // cloud has further to go), so the landings finish together instead of
    // trailing the longest arc past the tail
    const depart =
      SHARE_F0 +
      SHARE_DEPART_W * Math.pow(hash(i, 121), 0.85) * (1 - 0.5 * clamp01(len / SHARE_FAR));
    const pointAt = (u: number) => {
      const g = arriveEase(u);
      const b = Math.sin(Math.PI * g) * bow;
      return [pos[i].x + dx * g + (-dy / len) * b, pos[i].y + dy * g + (dx / len) * b];
    };
    let flight = Math.max(9, len / SHARE_SPEED);
    const peak = (fl: number) => {
      let mx = 0;
      for (let f = Math.ceil(depart) + 1; f <= depart + fl; f++) {
        const a = pointAt(clamp01((f - 1 - depart) / fl));
        const b = pointAt(clamp01((f - depart) / fl));
        const pa = screenAt(f - 1, a[0], a[1]);
        const pb = screenAt(f, b[0], b[1]);
        mx = Math.max(mx, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]));
      }
      return mx;
    };
    let guard = 0;
    while (peak(flight) > HEAD_CAP && guard < 40) {
      flight += 1;
      guard++;
    }
    if (guard > 0) SHARE_STATS.stretched++;
    SHARE_STATS.peakHead = Math.max(SHARE_STATS.peakHead, peak(flight));
    return { mark: m, seat: s, depart, land: depart + flight, bow, back: H.back };
  });
})();

/** The frame each mark's MARK_RIPE_AT_NTH dot seats — read off the landings, so
 *  retiming the share retimes the marks with it. A mark with fewer dots than
 *  that converts on its last. */
export const MARK_RIPE_AT = Array.from({ length: NM }, (_, m) => {
  const ls = SHARE.filter((p) => p.mark === m)
    .map((p) => p.land)
    .sort((a, b) => a - b);
  return ls[Math.min(MARK_RIPE_AT_NTH - 1, ls.length - 1)];
});

// ---------------------------------------------------------------------------
// THE WAKE. A mark flying out of the cloud does not merely part the dots at its
// nose: it leaves a WAKE. Every dot within WAKE_R of any point the mark has
// occupied over the last WAKE_DECAY frames is pushed SIDEWAYS — perpendicular
// to the mark's own travel at that moment, to the side the dot is already on —
// by up to WAKE_AMP world px, falling off with distance from the path and with
// how long ago the mark was there. So the crowd opens ahead of the mark, the
// channel stays open behind it, and it closes back up over ten frames.
// ---------------------------------------------------------------------------
const WAKE_R = 60;
const WAKE_AMP = 35;
const WAKE_DECAY = 10; // frames the channel takes to close

// THE MICRO-DRIFT. Two hashed sines per axis, +-3 world px, never in unison.
const micro = (i: number, f: number) => ({
  dx: 1.8 * Math.sin(f * 0.2417 + hash(i, 17) * 6.283) + 1.2 * Math.sin(f * 0.1533 + hash(i, 19) * 6.283),
  dy: 1.7 * Math.sin(f * 0.2094 + hash(i, 18) * 6.283) + 1.3 * Math.sin(f * 0.1396 + hash(i, 20) * 6.283),
});

// THE HALO'S BACK RUNG. The one alpha rung in the piece, and only inside a
// seated halo: a back dot there sits at OP_MID so each crowd has a behind and a
// front and reads as a body rather than a pattern. Everywhere else — the whole
// inflow, the whole cloud, every front dot — a dot is solid, as the style says.
const OP_MID = 0.78;

export type Live = {
  key: string;
  x: number;
  y: number;
  r: number;
  tone: number;
  back: boolean;
  op: number;
};

export type MarkLive = { m: number; x: number; y: number; scale: number; tone: number };

export type World = { live: Live[]; marks: MarkLive[] };

// ---------------------------------------------------------------------------
// THE WORLD. `buildWorld(frame)` is the pure state of the inflow, the cloud,
// the share and the seven marks at a world frame; `WorldSvg` draws it.
// ---------------------------------------------------------------------------
export const buildWorld = (frame: number): World => {
  // -- the marks, first: the shove needs their live positions ---------------
  const marks: MarkLive[] = [];
  for (let m = 0; m < NM; m++) {
    const scale = markScaleAt(m, frame);
    if (scale <= 0) continue;
    const p = markPosAt(m, frame);
    marks.push({
      m,
      x: p.x,
      y: p.y,
      scale,
      tone: smoothstep(clamp01((frame - MARK_RIPE_AT[m]) / SEAT_TONE)),
    });
  }
  // only the flyers wake the crowd, and only while their channel is still open
  const shovers = marks.filter(
    (q) => MARK_FLIGHT[q.m].r > 0 && frame < MARK_FLIGHT[q.m].land + WAKE_DECAY,
  );

  const live: Live[] = [];

  for (let i = 0; i < N_DOT; i++) {
    const S = CLOUD_SEATS[i];
    const IN = INFLOW[i];
    const SH = SHARE[i];
    if (frame < IN.born) continue;

    const md = micro(i, frame);
    let x: number;
    let y: number;
    let tone = 0;
    let back = S.back;
    let shove = true;
    let rMul = S.r;

    if (frame < IN.arrive) {
      // THE GATHER: in from beyond the frame on its own arc, into its live seat
      const seat = cloudSeatAt(i, frame);
      const rSeat = Math.hypot(seat.x - CORE.x, seat.y - CORE.y) + 1e-6;
      const thSeat = Math.atan2(seat.y - CORE.y, seat.x - CORE.x);
      const g = arriveEase(clamp01((frame - IN.born) / (IN.arrive - IN.born)));
      const rr = IN.rSpawn + (rSeat - IN.rSpawn) * g;
      const tt = thSeat + IN.swirl * (1 - g);
      x = CORE.x + Math.cos(tt) * rr;
      y = CORE.y + Math.sin(tt) * rr;
      shove = false; // a dot still outside the crowd is not in the mark's way
    } else if (frame < SH.depart) {
      // seated in the cloud: the tighten and the mill
      const seat = cloudSeatAt(i, frame);
      x = seat.x;
      y = seat.y;
    } else if (frame < SH.land) {
      // THE SHARE: out to its mind on its own bowed arc
      const from = cloudSeatAt(i, SH.depart);
      const to = haloSeatAt(SH.mark, SH.seat, frame);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const g = arriveEase(clamp01((frame - SH.depart) / (SH.land - SH.depart)));
      const b = Math.sin(Math.PI * g) * SH.bow;
      x = from.x + dx * g + (-dy / len) * b;
      y = from.y + dy * g + (dx / len) * b;
    } else {
      // seated in a halo: ripe, milling
      const seat = haloSeatAt(SH.mark, SH.seat, frame);
      x = seat.x;
      y = seat.y;
      tone = clamp01((frame - SH.land) / SEAT_TONE);
      back = SH.back;
      // the halo seat's own radius, so the crowd's outer rows taper away
      rMul = HALO[SH.mark][SH.seat].r;
    }

    // THE WAKE: the strongest sideways push any flyer's recent path puts on
    // this dot, summed over the flyers (a dot is rarely near two at once).
    if (shove) {
      for (const q of shovers) {
        const FL = MARK_FLIGHT[q.m];
        let bx = 0;
        let by = 0;
        let best = 0;
        for (let j = 0; j <= WAKE_DECAY; j++) {
          const fm = frame - j;
          if (fm < FL.born) break;
          const p = markPosAt(q.m, fm);
          const dx = x - p.x;
          const dy = y - p.y;
          const d = Math.hypot(dx, dy);
          if (d >= WAKE_R) continue;
          const w = smoothstep(1 - d / WAKE_R) * (1 - j / WAKE_DECAY);
          if (w <= best) continue;
          // sideways: perpendicular to the mark's travel, on the dot's own side
          const p0 = markPosAt(q.m, fm - 0.6);
          const vx = p.x - p0.x;
          const vy = p.y - p0.y;
          const vn = Math.hypot(vx, vy);
          let nx = vn > 1e-6 ? -vy / vn : 0;
          let ny = vn > 1e-6 ? vx / vn : 0;
          if (dx * nx + dy * ny < 0) {
            nx = -nx;
            ny = -ny;
          }
          if (vn <= 1e-6) {
            const dn = d > 1e-6 ? 1 / d : 0;
            nx = dx * dn;
            ny = dy * dn;
          }
          best = w;
          bx = nx;
          by = ny;
        }
        x += bx * WAKE_AMP * best;
        y += by * WAKE_AMP * best;
      }
    }

    const dm = back ? BG_DRIFT : 1;
    live.push({
      key: `d${i}`,
      x: x + md.dx * dm,
      y: y + md.dy * dm,
      r: DOT_R * rMul * (back ? BG_R_SCALE : 1) * breath(frame, hash(i, 9)),
      tone,
      back,
      op: back && frame >= SH.land ? OP_MID : 1,
    });
  }

  return { live, marks };
};

// ---------------------------------------------------------------------------
// THE WORLD, drawn. Dots first, back rung then front; the marks last and on
// top, each in a shadow wrapper that carries NO scale of its own.
// ---------------------------------------------------------------------------
export const WorldSvg: React.FC<{
  world: World;
  accent: string;
  accentDeep: string;
  dotOpacity: number;
  markIcon: string;
}> = ({ world, accent, accentDeep, dotOpacity, markIcon }) => {
  const { live, marks } = world;
  const toRipe = makeTone(accentDeep, accent);

  return (
    <svg
      width={WORLD_W}
      height={WORLD_H}
      viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* the experience: solid dots, deep while they stream and sit, ripe once
          a mind has them. Depth is radius and draw order, never alpha. */}
      {[true, false].map((backPass) =>
        live.map((d) =>
          d.back !== backPass ? null : (
            <circle
              key={`${backPass ? "b" : "c"}${d.key}`}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={toRipe(d.tone)}
              opacity={dotOpacity * OP_FG * d.op}
            />
          ),
        ),
      )}

      {/* THE DIGITAL MINDS. Top of the z-order: nothing is drawn across one.
          The shadow wrapper is outside the em scale and the breath, so the
          shadow is the same 2/3 screen px whatever the mark is doing. */}
      {marks.map((q) => (
        <g key={`m${q.m}`} style={{ filter: markIcon }} opacity={dotOpacity * OP_FG}>
          <g
            transform={
              `translate(${q.x.toFixed(3)} ${q.y.toFixed(3)}) ` +
              `scale(${((MARK_EM[q.m] / 24) * q.scale).toFixed(5)}) ` +
              `translate(-12 -12)`
            }
          >
            {MARKS[q.m].glyph.paths.map((d, i) => (
              <path key={`p${i}`} d={d} fill={toRipe(q.tone)} fillRule="evenodd" />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------

const DigitalMinds: React.FC<Props> = ({
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
  dotOpacity,
}) => {
  const frame = useCurrentFrame();

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const markIcon = iconShadow(k, iconShadowY, iconShadowBlur, MARK_SHADOW_OPACITY);

  const world = buildWorld(frame);

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
          <WorldSvg
            world={world}
            accent={accent}
            accentDeep={accentDeep}
            dotOpacity={dotOpacity}
            markIcon={markIcon}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default DigitalMinds;

// ---------------------------------------------------------------------------
// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  advantages: defaultProps.beats.advantages,
  expect: defaultProps.beats.expect,
  eventually: defaultProps.beats.eventually,
  digital: defaultProps.beats.digital,
  minds: defaultProps.beats.minds,
  have: defaultProps.beats.have,
  end: defaultProps.beats.end,
};
export const CAM_AT = (f: number) => runCamera(f, CAM.F, CAM.CY, CAM.K);

export const STATS = (() => {
  // -- the camera, measured on the DAMPED track ----------------------------
  // The probe is a fixed world point 300 px below the centre; its screen speed
  // and acceleration are what a viewer reads as camera motion.
  const probe = { x: CX, y: CORE.y + 300 };
  const P: number[][] = [];
  for (let f = 0; f <= LAST; f++) P.push(screenAt(f, probe.x, probe.y));
  const v: number[] = [];
  for (let f = 1; f <= LAST; f++) v.push(Math.hypot(P[f][0] - P[f - 1][0], P[f][1] - P[f - 1][1]));
  const dv: number[] = [];
  for (let f = 1; f < v.length; f++) dv.push(Math.abs(v[f] - v[f - 1]));

  // -- the resolved picture's screen box -----------------------------------
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let f = LAST - 6; f <= LAST; f++) {
    const w = buildWorld(f);
    for (const d of w.live) {
      const p = screenAt(f, d.x, d.y);
      const r = d.r * kAt(f);
      x0 = Math.min(x0, p[0] - r);
      x1 = Math.max(x1, p[0] + r);
      y0 = Math.min(y0, p[1] - r);
      y1 = Math.max(y1, p[1] + r);
    }
    for (const q of w.marks) {
      const p = screenAt(f, q.x, q.y);
      const h = ((MARK_INK * MARKS[q.m].mul) / 2) * q.scale * kAt(f);
      x0 = Math.min(x0, p[0] - h);
      x1 = Math.max(x1, p[0] + h);
      y0 = Math.min(y0, p[1] - h);
      y1 = Math.max(y1, p[1] + h);
    }
  }

  // -- the inflow: inside the frame at f0, outside it at birth --------------
  const FRAME_PAD = 4;
  let insideAtF0 = 0;
  let movingAtF0 = 0;
  let bornInside = 0;
  let cloudTop = Infinity;
  const prev = buildWorld(-1);
  const now = buildWorld(0);
  const prevBy = new Map(prev.live.map((d) => [d.key, d]));
  for (const d of now.live) {
    const p = screenAt(0, d.x, d.y);
    if (p[0] > FRAME_PAD && p[0] < 1080 - FRAME_PAD && p[1] > FRAME_PAD && p[1] < 1920 - FRAME_PAD) {
      insideAtF0++;
      const q = prevBy.get(d.key);
      if (q && Math.hypot(d.x - q.x, d.y - q.y) > 0.5) movingAtF0++;
    }
  }
  for (const IN of INFLOW) {
    const f = Math.ceil(IN.born);
    const w = buildWorld(f);
    const d = w.live.find((z) => z.key === `d${IN.seat}`);
    if (!d) continue;
    const p = screenAt(f, d.x, d.y);
    if (p[0] > -40 && p[0] < 1120 && p[1] > -40 && p[1] < 1960) bornInside++;
  }

  // -- the inflow's density, per frame -------------------------------------
  const inflight: number[] = [];
  const onscreen: number[] = [];
  for (let f = 0; f <= ARRIVE_F1; f++) {
    inflight.push(INFLOW.filter((p) => f >= p.born && f < p.arrive).length);
    const w = buildWorld(f);
    let n = 0;
    for (let i = 0; i < N_DOT; i++) {
      if (f < INFLOW[i].born || f >= INFLOW[i].arrive) continue;
      const d = w.live.find((z) => z.key === `d${i}`);
      if (!d) continue;
      const p = screenAt(f, d.x, d.y);
      if (p[0] > 0 && p[0] < 1080 && p[1] > 0 && p[1] < 1920) n++;
    }
    onscreen.push(n);
  }
  const peakIn = inflight.indexOf(Math.max(...inflight));
  const peakOn = onscreen.indexOf(Math.max(...onscreen));

  // -- the cloud's occupied radius as it fills -----------------------------
  const cloudR = (f: number) => {
    let mx = 0;
    for (let i = 0; i < N_DOT; i++) {
      if (f < INFLOW[i].arrive || f >= SHARE[i].depart) continue;
      const s = cloudSeatAt(i, f);
      mx = Math.max(mx, Math.hypot(s.x - CORE.x, s.y - CORE.y));
    }
    return mx;
  };

  // -- no dead air: mean ink motion per frame, worst 12-frame window --------
  const energy: number[] = [];
  let a = buildWorld(0);
  for (let f = 1; f <= LAST; f++) {
    const b = buildWorld(f);
    const by = new Map(a.live.map((d) => [d.key, d]));
    let sum = 0;
    let n = 0;
    for (const d of b.live) {
      const q = by.get(d.key);
      const p1 = screenAt(f, d.x, d.y);
      const p0 = q ? screenAt(f - 1, q.x, q.y) : null;
      if (!p0) continue;
      sum += Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      n++;
    }
    const am = new Map(a.marks.map((q) => [q.m, q]));
    for (const q of b.marks) {
      const r = am.get(q.m);
      if (!r) continue;
      const p1 = screenAt(f, q.x, q.y);
      const p0 = screenAt(f - 1, r.x, r.y);
      sum += Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.abs(q.scale - r.scale) * 40;
      n++;
    }
    energy.push(n > 0 ? sum / n : 0);
    a = b;
  }
  let worstWin = Infinity;
  let worstAt = 0;
  for (let f = 0; f + 12 <= energy.length; f++) {
    const m = energy.slice(f, f + 12).reduce((s, e) => s + e, 0) / 12;
    if (m < worstWin) {
      worstWin = m;
      worstAt = f + 1;
    }
  }
  cloudTop = cloudR(52);

  return {
    kStart: Number(CAM.K[0].toFixed(4)),
    kRest: Number(K_REST.toFixed(5)),
    kEnd: Number(K_END.toFixed(5)),
    cam: {
      table: [0, 11, 29, 36, 42, 47, 52, 62, 73, 84, 94].map((f) => [
        f,
        Number(CAM_AT(f).k.toFixed(4)),
      ]),
      maxV: Number(Math.max(...v).toFixed(3)),
      minV: Number(Math.min(...v).toFixed(3)),
      maxDV: Number(Math.max(...dv).toFixed(3)),
    },
    dotScreen: Number((2 * DOT_R * K_REST).toFixed(2)),
    markEm: MARKS.map((m, i) => [m.name, Number(MARK_EM[i].toFixed(2)), Number((MARK_INK * m.mul * K_REST).toFixed(1))]),
    markSeat: MARK_SEAT.map((s, m) => [
      MARKS[m].name,
      Number((s.x - CORE.x).toFixed(1)),
      Number((s.y - CORE.y).toFixed(1)),
      Number(Math.hypot(s.x - CORE.x, s.y - CORE.y).toFixed(1)),
      Number(((Math.atan2(s.y - CORE.y, s.x - CORE.x) * 180) / Math.PI).toFixed(1)),
    ]),
    markBorn: MARK_FLIGHT.map((F, m) => [MARKS[m].name, Number(F.born.toFixed(1)), Number(F.land.toFixed(1))]),
    markRipeAt: MARK_RIPE_AT.map((f, m) => [MARKS[m].name, Number(f.toFixed(1))]),
    markPeakHead: Number(MARK_STATS.peakHead.toFixed(2)),
    markStretched: MARK_STATS.stretched,
    cloudSeats: CLOUD_SEATS.length,
    cloudR: [0, 6, 12, 24, 36, 48, 52].map((f) => [f, Number(cloudR(f).toFixed(1))]),
    cloudRMax: Number(cloudTop.toFixed(1)),
    haloSeats: HALO.map((h, m) => [MARKS[m].name, h.length, HALO_SHARE[m]]),
    haloOuter: HALO_USED.map((used, m) => [
      MARKS[m].name,
      Number(Math.max(...used.map((s) => HALO[m][s].rho + DOT_R * HALO[m][s].r)).toFixed(1)),
    ]),
    haloGap: (() => {
      const outer = HALO_USED.map((used, m) =>
        Math.max(...used.map((s) => HALO[m][s].rho + DOT_R * HALO[m][s].r)),
      );
      let g = Infinity;
      let at = "";
      for (let a = 0; a < NM; a++) {
        for (let b = a + 1; b < NM; b++) {
          const d =
            Math.hypot(MARK_SEAT[a].x - MARK_SEAT[b].x, MARK_SEAT[a].y - MARK_SEAT[b].y) -
            outer[a] -
            outer[b] -
            2 * HALO_BODY;
          if (d < g) {
            g = d;
            at = `${MARKS[a].name}/${MARKS[b].name}`;
          }
        }
      }
      return [Number(g.toFixed(1)), at];
    })(),
    arrivalsPerFrame: (() => {
      const bins = new Array(ARRIVE_F1 + 1).fill(0);
      for (const p of INFLOW) bins[Math.min(ARRIVE_F1, Math.max(0, Math.round(p.arrive)))]++;
      return { peak: Math.max(...bins), peakAt: bins.indexOf(Math.max(...bins)), bins };
    })(),
    haloClear: MARK_INK_HALF.map((h, m) => [MARKS[m].name, Number((h + HALO_CLEAR).toFixed(1))]),
    inflow: {
      n: INFLOW.length,
      born: [Number(Math.min(...INFLOW.map((p) => p.born)).toFixed(1)), Number(Math.max(...INFLOW.map((p) => p.born)).toFixed(1))],
      arrive: [0, ARRIVE_F1],
      peakHead: Number(IN_STATS.peakHead.toFixed(2)),
      stretched: IN_STATS.stretched,
      inflightAtF0: inflight[0],
      onscreenMoving: onscreen.filter((_x, i) => i % 3 === 0),
      onscreenPeak: Math.max(...onscreen),
      onscreenPeakAt: peakOn,
      inflightPeak: Math.max(...inflight),
      inflightPeakAt: peakIn,
      insideFrameAtF0: insideAtF0,
      movingInsideAtF0: movingAtF0,
      spawnInsideFrameAtBirth: bornInside,
    },
    share: {
      depart: [Number(Math.min(...SHARE.map((p) => p.depart)).toFixed(1)), Number(Math.max(...SHARE.map((p) => p.depart)).toFixed(1))],
      land: [Number(Math.min(...SHARE.map((p) => p.land)).toFixed(1)), Number(Math.max(...SHARE.map((p) => p.land)).toFixed(1))],
      peakHead: Number(SHARE_STATS.peakHead.toFixed(2)),
      stretched: SHARE_STATS.stretched,
      per: MARKS.map((m, i) => [m.name, SHARE.filter((p) => p.mark === i).length]),
    },
    band: {
      x: [Number(x0.toFixed(1)), Number(x1.toFixed(1))],
      y: [Number(y0.toFixed(1)), Number(y1.toFixed(1))],
      clearTop: Number((y0 - 300).toFixed(1)),
      clearBottom: Number((1370 - y1).toFixed(1)),
      sideMargin: Number(Math.min(x0, 1080 - x1).toFixed(1)),
      centre: Number(((y0 + y1) / 2).toFixed(1)),
    },
    energy: {
      worst12: Number(worstWin.toFixed(3)),
      worst12At: worstAt,
      min: Number(Math.min(...energy).toFixed(3)),
      max: Number(Math.max(...energy).toFixed(3)),
    },
  };
})();
