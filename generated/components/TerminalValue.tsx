import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp,
  clamp01,
  hash,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
// The house material and the money. The coin is d1Shared's `Coin` — r 11, a
// radial highlight and a "$" knocked out — because money in this world is
// always that object; `COIN_DOLLAR` comes with it so the one group wash can be
// laid over a coin through the same knock-out rather than painting over the "$".
import { COIN_DOLLAR, Coin, KRAFT_BASE, KRAFT_BLUR, KRAFT_DIM, KRAFT_SRC, KraftBackground, V4 } from "./d1Shared";
// The clip's shared module, written by cut 1. Nothing here is restated: the
// tile, the brand paths, the data dot, the leak's tempos, the centre and the
// camera cut 1 resolves on all come from there.
import {
  BrandTile,
  CENTER,
  DOT_R,
  DataDot,
  EFX_SPOT,
  LEAK_DRIFT,
  LEAK_FADE,
  LEAK_FALL,
  LEAK_FAST,
  LEAK_HUGE,
  LEAK_LIFE,
  type LeakDot,
} from "./equifaxShared";

export const FPS = 24;

// Christina Qi / Domeyard on Equifax:
// "...and yet it does not seem to impair what investors deem to be the terminal
//  value of the company."
//
// SRT span 0:21.300 -> 0:26.339 at 24fps.
// round((26.339 - 21.300) * 24) = round(5.039 * 24) = round(120.9) = 121 frames
// of speech, plus a 16 frame tail so the resolved state holds = 137.
export const DURATION = 137;

// Word onsets, in frames from the composition's start (= 21.300):
//   f0 and · f5 yet · f13 it · f17 does · f22 not · f28 seem · f33 to
//   · f45 impair · f58 what · f70 investors · f80 deem · f82 to · f84 be
//   · f90 the · f103 terminal · f109 value · f111 of · f112 the · f121 company
//   · tail to f137
//
// The inflections that actually bend the motion:
//   f5  yet     — the leak starts to swell: gap LEAK_FAST -> LEAK_HUGE, the
//                 fall lengthens 170 -> 240, the edge spreads 180 -> 260
//   f45 impair  — the pile sags 2 px and comes straight back (f42-52). It looks
//                 like it might give, and it does not. Nothing else happens to
//                 it in the whole of phase 1, and that IS the gesture.
//   f52-74      — sixteen coins leave off-frame, alternating sides
//   f84-106     — they land, one every ~1.5 frames, into the three tapering
//                 rows 3 (7), 4 (6) and 5 (3)
//   f103 terminal — the whole pile takes one 3 px group settle (f101-109) and
//                 the cut's ONE group wash (#FFD98A, 6 frames). Forty coins in
//                 six narrowing rows: the value found its level.
//   f121 company — nothing new. The leak is still pouring and the camera is
//                 still opening to take in the full fall.
//
// ---------------------------------------------------------------------------
// "The terminal value", CUT 3 — ONE MOTION: IT POURS OUT BELOW AND IT PILES UP
// ON TOP.
//
// Cut 1's resolved subject, alone, in CLOSE-UP. The EQUIFAX tile (EFX_SPOT,
// 340 x 108) at CENTER, the camera opening on k 1.52, the breach still running
// out of its bottom edge as amber data dots. On top of the tile is what the
// company is WORTH: a heap of house coins, 8 wide at the base at pitch 22, rows
// at pitch 20 brick-staggered by half a pitch and narrowing to three coins at
// the top, so it reads as a pile and not a grid or a wall. The one
// continuous motion of the cut is those two things at once — the leak gets
// worse and worse, and the money on top keeps arriving and never dips. With the
// sound off: the company is leaking and the value on it keeps growing.
//
// It is NOT cut 2's chart and NOT cut 1's crowd. Same objects (the tile, the
// amber leak, the house coin), a different picture. There is no chart, no price
// line, no ring of companies, no investors as people, no text, no level line
// and no scale, and nothing stands on a ground: the tile floats and the coins
// lie on it.
//
//   PHASE 1 · AND YET (f0 -> f45)
//     f0 is mid-leak, not an empty start: the emission schedule is primed from
//     f -48 so the pipeline is already full of falling dots on the first frame.
//     From f5 the leak swells on ONE long ease to f45 — the gap between dots
//     closes LEAK_FAST -> LEAK_HUGE, each new dot falls further (LEAK_FALL 170
//     -> 240)
//     and the stretch of edge they leave from spreads 180 -> 260 px. The pile
//     does nothing at all until "impair" (f45), where it sags 2 px and recovers
//     over f42-52. The camera creeps k 1.52 -> 1.70 with its centre leaning
//     from 897 up to 868 — toward the pile, the thing that is about to give —
//     and lands f38. Held breath f39 -> f45, the cut's only one.
//
//   PHASE 2 · INVESTORS (f46 -> f100)
//     Sixteen coins leave from off-frame, alternating left and right, hashed
//     across f52 -> f74 — roughly one every 1.5 frames — and cross the frame on
//     `flow` eases with a shallow hashed arc, landing f84 -> f106 into the
//     three tapering rows: 7 left-to-right, 6 back right-to-left, 3 left-to-
//     right. Each landing is that coin's own back(0.75) settle along its own
//     travel; the pile itself never bounces. The leak underneath runs at
//     LEAK_HUGE throughout. The camera is
//     released k 1.70 -> 1.44 back to centre 897, keyed f44 -> f68 and landing
//     f75 — before "deem" and before the first coin is down — so the arrivals
//     enter a frame that is already open for them, and then holds while they
//     fill it.
//
//   PHASE 3 · TERMINAL VALUE (f100 -> f121)
//     The last coin is down by f106. On "terminal" (f103) the whole pile takes
//     a single 3 px group settle (f101-109) and the one group wash (#FFD98A,
//     6 frames from f103) — no single-object click anywhere in this cut. On
//     "company" nothing new starts: the camera creeps k 1.44 -> 1.40 (f112-124)
//     to take in the full fall, and the fall is what the last word lands on.
//
//   TAIL (f121 -> f137)
//     Hold on `sway`: 40 coins on the tile, the amber leak at LEAK_HUGE below,
//     still pouring on the last frame. Resolved, never faded.
//
// DEVIATIONS FROM THE BRIEF, EACH ARGUED WHERE IT IS SET:
//   * `leakStream` here rather than the shared `leakDots` — see LEAK. The
//     shared helper takes ONE rate, one fall and one width, and the whole of
//     phase 1 is those three swelling; re-parameterising the shared generator
//     every frame would re-place every dot already in the air. The per-dot
//     physics is `leakDots`' to the letter — its own `LEAK_LIFE`, `LEAK_FALL`,
//     `LEAK_DRIFT`, `LEAK_FADE` and its `LeakDot` are imported, not restated —
//     and every dot's parameters are frozen at its own birth frame, so nothing
//     ever changes mid-fall.
//   * The flight is 32 frames from 560 px off-frame, not 22 from 640 — see
//     FLIGHT. The brief's numbers peak at 54 screen px/frame at the ORIGINAL
//     zoom and the house cap is 45; at the revised zoom even 28 frames peaks at
//     47.7, so the flight was lengthened again rather than the travel cut.
//   * Departures therefore run f52 -> f74 rather than f60 -> f84, which keeps
//     the briefed cadence and the briefed LAST landing (f106) and moves the
//     first one from f82 to f84.
//   * The camera's keys are f3/f44/f112 rather than f8/f52/f112: the damper
//     costs about six frames on a move this size, so the brief's LANDINGS
//     (f38, f75, and the creep through "company") are what the keys are solved
//     for. Measured by sweep, not guessed — see THE CAMERA.
//
// REVISION 1 (Fable's review of the first preview). The motion was approved and
// is untouched — the sag on "impair", the arrivals, the settle and the wash on
// "terminal", the leak. Two things changed and nothing else:
//   * FRAMING. The camera track is raised a step to 1.52 / 1.70 / 1.44 / 1.40
//     on the same keys and the same landings, and cy is re-solved off the
//     composition's centre rather than the tile's — see THE CAMERA. The flight
//     grew 28 -> 32 frames so the coins stay under the speed cap at the higher
//     k, with the departure window slid back to hold the cadence and the last
//     landing.
//   * THE PILE'S TOP. Five full rows of eight read as a block, so the sixteen
//     arriving coins now land as 7, 6 and 3 — see THE PILE. Same sixteen
//     coins, same cadence, same per-coin settle, same forty.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // the leak; every dot of data leaving the company
  accentDeep: z.string(), // the set's shared palette
  wash: z.string(), // the half-step the pile takes as a group on "terminal"
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  coinRadius: z.number(),
  dotRadius: z.number(),
  beats: z.object({
    and: z.number(), // "and"
    yet: z.number(), // "yet" — the leak begins to swell
    it: z.number(), // "it"
    does: z.number(), // "does"
    not: z.number(), // "not"
    seem: z.number(), // "seem"
    to1: z.number(), // "to"
    impair: z.number(), // "impair" — the pile sags and recovers
    what: z.number(), // "what"
    investors: z.number(), // "investors" — coins are already crossing the frame
    deem: z.number(), // "deem"
    to2: z.number(), // "to"
    be: z.number(), // "be"
    the1: z.number(), // "the"
    terminal: z.number(), // "terminal" — the group settle and the one wash
    value: z.number(), // "value"
    of: z.number(), // "of"
    the2: z.number(), // "the"
    company: z.number(), // "company" — speech ends f121; tail to 137
  }),
});

export type Props = z.infer<typeof schema>;

export const WORLD_W = 1080;
export const WORLD_H = 1400;
export const CENTRE_X = CENTER.x;

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---------------------------------------------------------------------------
// THE HELPERS, copied from `BackIntoItV5` with their reasons intact.
//
// `flow` is a travel with a flat middle: it eases in over the first `a` and out
// over the last `a` and runs at one speed in between, so a mass reads as one
// body rather than as n thrown objects. Its peak is 1/(1-a) times its average,
// which is the number every speed check in this file is done against.
//
// `overshoot` is the back(0.75) settle written as a zero-sloped bump rather
// than a kinked `max(0, back(u) - 1)`: the kink puts a step in the object's
// speed two thirds of the way through every landing, and the velocity scan
// exists to catch exactly that. `64 w^3 (1-w)^3` is the same shape — nothing,
// then a few px past the target, then exactly the target at u = 1 — and it is
// flat to second order at both ends.
// ---------------------------------------------------------------------------
const FLOW_A = 0.28;
const flow = (u: number, a: number = FLOW_A) => {
  const x = clamp01(u);
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};

// The lobe: 0 at both ends, 1 in the middle, zero-sloped and zero-curved at
// both ends. It is the settle above, and it is also every sag and every wash in
// this cut — one shape for everything that goes and comes back.
export const lobe = (u: number) => {
  const w = clamp01(u);
  return 64 * w ** 3 * (1 - w) ** 3;
};
const SETTLE_U0 = 4 / 7; // where the back-out ease used to cross 1
const overshoot = (u: number) => lobe((clamp01(u) - SETTLE_U0) / (1 - SETTLE_U0));
export const SETTLE_PX = 3;

// ---------------------------------------------------------------------------
// THE PILE. Eight wide at pitch 22 (= 2r, so a row is a row of touching coins),
// rows at pitch 20 so each row bites 2 px into the one below it, and every odd
// row offset half a pitch — a brick pile, not a grid. Row 0 sits one pitch
// above the tile's top edge, so the bottom row's coins overlap the tile and
// the pile is ON it rather than hovering.
//
// Opening pile: 3 rows of 8, 24 coins, untouched. Rows 3, 4 and 5 arrive in
// phase 2 and TAPER — 7, 6, 3 — so the resolved pile is forty coins with a
// shoulder and a peak instead of a five-by-eight block. Top coin's top edge
// lands at y 664, well inside the band.
// ---------------------------------------------------------------------------
export const COIN_R = V4.COIN_R_V5; // 11 — the house coin, unchanged
export const PILE_COLS = 8;
export const PILE_PITCH_X = 22;
export const PILE_PITCH_Y = 20;
export const TILE_TOP = CENTER.y - EFX_SPOT.h / 2; // 781
export const TILE_BOTTOM = CENTER.y + EFX_SPOT.h / 2; // 889
export const PILE_X0 = CENTER.x - ((PILE_COLS - 1) * PILE_PITCH_X) / 2; // 463
// The bottom row OVERLAPS the tile's top edge by 5 px, so the pile lies ON the
// company rather than hovering over it. Row 0 one full pitch clear of the edge
// (the brief's arithmetic) left a 9 px gap in the render and the pile read as a
// second, separate object.
export const PILE_ROW0_Y = TILE_TOP - COIN_R + 5; // 775
// THE TOP TAPERS. Five full rows of eight was a block: eight coins wide from
// the tile's edge to the top edge of the pile is a rectangle, and a rectangle
// of coins reads as a grid or a wall, not as a heap. The sixteen arriving coins
// therefore land as three NARROWING rows — 7, then 6, then 3 — so the thing
// that grows has a shoulder and a peak. Same sixteen coins, same forty total.
export const ROW_COUNTS = [8, 8, 8, 7, 6, 3];
export const ROW_START = ROW_COUNTS.reduce<number[]>((a, c) => [...a, a[a.length - 1] + c], [0]);
export const PILE_OPEN = ROW_START[3]; // 24 — the three rows standing at f0
export const PILE_TOTAL = ROW_START[ROW_COUNTS.length]; // 40
export const PILE_ARRIVE = PILE_TOTAL - PILE_OPEN; // 16 — rows 3, 4 and 5
export const PILE_ROWS = ROW_COUNTS.length; // 6

// A row's left-hand coin. Rows 0-2 are the opening pile and are untouched: the
// eight-wide row with every odd row pushed half a pitch right, which is the
// brick. Rows 3-5 are CENTRED on the tile's axis instead — and because the
// counts alternate parity (8, 7, 6, 3) centring lands every coin of a narrow
// row exactly in a valley of the row beneath it, so the brick holds all the way
// up without a second rule: row 3 at 474 is row 2's 463 + half a pitch, row 4
// at 485 sits in row 3's valleys, row 5's three coins in row 4's.
export const rowX0 = (row: number) =>
  row < 3
    ? PILE_X0 + (row % 2 === 1 ? PILE_PITCH_X / 2 : 0)
    : CENTER.x - ((ROW_COUNTS[row] - 1) * PILE_PITCH_X) / 2;

// Slot n, in fill order: each row is filled before the next one starts, and the
// direction alternates — row 3 left to right, row 4 back right to left, row 5
// left to right — so the arrivals read as a sweep laying down each course
// rather than as three copies of the same move.
export const pileSlot = (n: number) => {
  let row = 0;
  while (row < ROW_COUNTS.length - 1 && n >= ROW_START[row + 1]) row++;
  const j = n - ROW_START[row];
  const col = row >= 3 && row % 2 === 0 ? ROW_COUNTS[row] - 1 - j : j;
  return { x: rowX0(row) + col * PILE_PITCH_X, y: PILE_ROW0_Y - row * PILE_PITCH_Y };
};
export const PILE_TOP_Y = PILE_ROW0_Y - (PILE_ROWS - 1) * PILE_PITCH_Y - COIN_R; // 664

// The pile's two authored moves, and its whole motion track. Both are the same
// zero-sloped lobe, so neither of them ever hands the scan a step in speed.
//   f42-52  "impair": 2 px of sag and straight back. The pile looks like it
//           might give and does not — the word is answered by a refusal.
//   f101-109 "terminal": 3 px of group settle, the value finding its level.
export const SAG_F0 = 42;
export const SAG_F1 = 52;
export const SAG_PX = 2;
export const GROUP_F0 = 101;
export const GROUP_F1 = 109;
export const GROUP_PX = 3;
export const pileDy = (f: number) =>
  SAG_PX * lobe((f - SAG_F0) / (SAG_F1 - SAG_F0)) + GROUP_PX * lobe((f - GROUP_F0) / (GROUP_F1 - GROUP_F0));

// The cut's ONE group wash. No single-object click anywhere in this cut, and
// nothing brighter than the half-step: the coins pass through #FFD98A and come
// straight back, on the same lobe as everything else that goes and returns.
// WASH_PEAK IS 0.4, NOT 1. The half-step is a ceiling on how bright a group may
// go, not a target to hit. At full opacity the flat colour covers the coin's own
// radial gradient and forty coins go pale and flat for six frames — the pile
// stops being money and becomes a shape; at 0.55 it still flattened. At 0.4 the
// gradient reads through it and the pile brightens instead.
export const WASH_F0 = 103;
export const WASH_DUR = 6;
export const WASH_PEAK = 0.4;
export const washAt = (f: number) => WASH_PEAK * lobe((f - WASH_F0) / WASH_DUR);

// ---------------------------------------------------------------------------
// THE LEAK. `leakStream` rather than the shared `leakDots`, and the reason is
// the whole of phase 1: the brief asks the rate, the fall AND the width to
// swell together on one long ease from f5 to f45, and the shared generator
// takes each of those as ONE number. Handing it a different rate every frame
// re-derives every dot's birth time every frame, so the dots already in the air
// jump; handing it a different `fall` re-places them too.
//
// So the emission schedule is integrated instead: dot i is born gap(b) frames
// after dot i-1, where gap is the eased LEAK_FAST -> LEAK_HUGE at the birth
// frame, and its fall, its stretch of edge and its drift are all sampled ONCE,
// at its own birth. A dot in the air is therefore never re-parameterised: it
// falls the fall it was born with. The per-dot physics is the shared helper's
// to the letter — y = fall * t^2 over `life` frames, a hashed x on the edge, a
// +/- 6 px hashed sideways drift, opaque to t 0.65 and gone by t 1 — so a dot
// from this stream and a dot from cut 1's `leakDots` are the same object.
//
// The schedule is primed from f -48 (one life plus a gap) so f0 opens with a
// full pipeline of falling dots and not with an empty edge.
// ---------------------------------------------------------------------------
export const SWELL_F0 = 5; // "yet"
export const SWELL_F1 = 45; // "impair"
export const LEAK_FALL_1 = 240; // the swollen fall; LEAK_FALL (170) is the one at rest
export const LEAK_WIDTH_0 = 180;
export const LEAK_WIDTH_1 = 260;

export const swellAt = (f: number) => smoothstep((f - SWELL_F0) / (SWELL_F1 - SWELL_F0));
export const leakGap = (f: number) => lerp(LEAK_FAST, LEAK_HUGE, swellAt(f));

// The integrated schedule: dot i is born `leakGap(birth)` frames after dot i-1.
// Primed from one life plus a gap before f0, so the first frame of the cut
// opens on a full pipeline of falling dots rather than an empty edge.
export const LEAK_BIRTHS: number[] = (() => {
  const out: number[] = [];
  let b = -LEAK_LIFE - LEAK_FAST;
  while (b < DURATION) {
    out.push(b);
    b += leakGap(b);
  }
  return out;
})();

export const leakStream = (frame: number): LeakDot[] => {
  const out: LeakDot[] = [];
  for (let i = 0; i < LEAK_BIRTHS.length; i++) {
    const birth = LEAK_BIRTHS[i];
    const t = (frame - birth) / LEAK_LIFE;
    if (t <= 0 || t >= 1) continue;
    const s = swellAt(birth); // frozen at birth: a dot never changes mid-fall
    const width = lerp(LEAK_WIDTH_0, LEAK_WIDTH_1, s);
    const fall = lerp(LEAK_FALL, LEAK_FALL_1, s);
    out.push({
      key: i,
      birth,
      x:
        CENTER.x +
        (hash(i, 131) - 0.5) * width +
        LEAK_DRIFT * Math.sin(t * 3.2 + hash(i, 232) * 6.28),
      y: TILE_BOTTOM + fall * t * t,
      opacity: t < LEAK_FADE ? 1 : 1 - (t - LEAK_FADE) / (1 - LEAK_FADE),
    });
  }
  return out;
};
export const LEAK_BOTTOM_Y = TILE_BOTTOM + LEAK_FALL_1; // 1129, inside the band at every k this cut uses

// ---------------------------------------------------------------------------
// THE MONEY ARRIVING.
//
// FLIGHT IS 32 FRAMES FROM 560 PX OFF-FRAME, NOT 22 FROM 640, AND NOT THE 28
// THIS FILE CARRIED AT THE OLD ZOOM. The travel is the same 650 world px; the
// frames are what changed, because the whole camera track went up. On `flow` a
// travel peaks at 1/(1-0.28) times its average, so 650 px in n frames peaks at
// 468/n world px a frame, and the arrivals now cross the frame at k 1.44-1.53
// instead of 1.18. Measured over every coin at h=1 and h=0.25: 28 frames peaks
// at 47.7 screen px/frame and 30 at 45.9 — both over the house cap of 45. 32
// frames peaks at 44.2. The travel was NOT shortened to get there; the flight
// was lengthened, which is the only move that keeps the coins coming from off
// the sheet.
//
// DEPARTURES ARE f52 -> f74. The cadence (22 frames for sixteen coins, one
// every ~1.5) and the LAST landing (f106, before the settle on "terminal") are
// what the brief pins, so the departure window slides forward by the four
// frames the flight grew and everything downstream is where it was: first
// landing f84, last f106, fill order unchanged. A +/- 1.2 frame hash keeps
// sixteen departures from being a metre.
//
// 560 px out still starts every coin off the sheet at the widest the camera
// ever gets while one is in the air — k 1.44 sees x 165..915, and k 1.70
// during the lean sees x 222..858, so a coin leaving from x -20 or x 1100 has
// 252 px of margin at its own departure frame.
// ---------------------------------------------------------------------------
export const START_OFF = 560;
export const FLIGHT = 32;
export const DEPART_F0 = 52;
export const DEPART_F1 = 74;
export const DEPART_JITTER = 1.2;
export const ARC_MIN = 8; // a shallow hashed lift mid-flight: a coin is thrown,
export const ARC_MAX = 22; // not slid, and sixteen of them never travel in unison

export type Flight = {
  m: number;
  n: number; // the slot it fills
  depart: number;
  land: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  arc: number;
  ux: number;
  uy: number;
};

export const FLIGHTS: Flight[] = Array.from({ length: PILE_ARRIVE }, (_, m) => {
  const n = PILE_OPEN + m;
  const slot = pileSlot(n);
  const depart =
    DEPART_F0 + ((DEPART_F1 - DEPART_F0) * m) / (PILE_ARRIVE - 1) + (hash(m, 13) * 2 - 1) * DEPART_JITTER;
  const side = m % 2 === 0 ? -1 : 1; // alternating, so the money comes from everywhere
  const x0 = CENTER.x + side * START_OFF;
  // they leave level with the top of the pile as it stands when they set off
  const y0 = PILE_ROW0_Y - 2 * PILE_PITCH_Y + (hash(m, 29) * 2 - 1) * 30;
  const dx = slot.x - x0;
  const dy = slot.y - y0;
  const len = Math.hypot(dx, dy);
  return {
    m,
    n,
    depart,
    land: depart + FLIGHT,
    x0,
    y0,
    x1: slot.x,
    y1: slot.y,
    arc: ARC_MIN + (ARC_MAX - ARC_MIN) * hash(m, 41),
    ux: dx / len,
    uy: dy / len,
  };
});
export const LAST_LANDING = Math.max(...FLIGHTS.map((f) => f.land));

// ---------------------------------------------------------------------------
// THE CAMERA. Three moves and one held breath, all through one damped
// `runCamera`, with `cy = c + CAM_LIFT / k` off the same eased k so the tile's
// centre sits on screen y 835 — above the burnt-in captions — at every zoom it
// resolves at.
//
//   LEAN    f3-32    k 1.52 -> 1.70, centre 897 -> 868: leaning toward the
//                    pile, the thing that is about to give. Lands f38.
//   (held breath f39 -> f45, the cut's only one, and seven frames of it. The
//    leak is swelling under it and the sag lands inside it, so the frame is
//    still and the picture is not)
//   RELEASE f44-68   k 1.70 -> 1.44, centre back to 897. Lands f75, five frames
//                    before "deem" and nine before the first coin is down, so
//                    the arrivals enter a frame that is already open for them.
//   CREEP   f112-124 k 1.44 -> 1.40 on "company": the last thing the cut does
//                    is widen far enough to hold the whole fall.
//
// THIS CUT DOES NOT SHARE CUT 1'S k, AND THAT IS THE POINT. It is a CLOSE-UP ON
// THE MECHANISM: one tile and what is happening to it. At K_FINAL_1 (1.28) the
// 340 px tile left two thirds of the sheet empty and the subject read small.
// The whole track is raised a step — 1.52 / 1.70 / 1.44 / 1.40 — on the same
// keys and the same landings, so the motion is untouched and only the framing
// changed. Cut 2 sits between cut 1's k and this one, so the set still steps.
//
// cy IS RE-SOLVED, NOT INHERITED. `camMove` puts the content centre it is given
// on screen y 835 (cy = c + CAM_LIFT / k), and at 1.28 it hardly mattered which
// world y that was; at 1.70 it does. The content centre is now the CENTRE OF
// THE COMPOSITION — the pile's top edge down to the lowest leak dot — rather
// than the tile's centre, so the picture stays centred as the pile grows up and
// the fall grows down. Measured at the four check frames: the whole composition
// sits between screen y 503 and 1167 for the entire cut, the pile's top never
// goes above screen y 572 (the rule is 260), and the bottom of the fall lands
// where it landed before the zoom went up, so the caption clearance is the one
// that was already approved.
//
// THE KEYS ARE AHEAD OF THE LANDINGS BY DESIGN. CAM_STIFF 0.09 / CAM_DAMP 0.468
// costs about six frames on moves this size, so the brief's landings (f38 and
// f75) are what the keys are solved for, not its keys. Re-swept at the new k:
// f3/f44/f112 still land f38, f75 and hold a seven-frame breath, so the keys
// are unchanged.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.52;
export const K_LEAN = 1.7;
export const K_WIDE = 1.44;
export const K_END = 1.4;
// The world y that lands on screen 835. It is the CENTRE OF THE COMPOSITION,
// not the tile's centre: the picture is the pile's top edge (PILE_TOP_Y 664)
// down to the lowest leak dot (LEAK_BOTTOM_Y + DOT_R = 1134.5), whose midpoint
// is 899. 897 is that, nudged 2 px up, which splits the difference with the
// shorter composition of phase 1 (three rows, the fall not yet grown).
export const CONTENT_OPEN = 897;
export const CONTENT_LEAN = 868; // 29 px up toward the pile — 50 screen px at
// K_LEAN, the same lean in the eye as the briefed 35 px was at the old 1.42.

export const LEAN = camMove({ f0: 3, f1: 32, k0: K_OPEN, k1: K_LEAN, c0: CONTENT_OPEN, c1: CONTENT_LEAN, warp: 1 });
export const RELEASE = camMove({
  f0: 44,
  f1: 68,
  k0: K_LEAN,
  k1: K_WIDE,
  c0: CONTENT_LEAN,
  c1: CONTENT_OPEN,
  warp: 0.72,
});
export const CREEP = camMove({
  f0: 112,
  f1: 124,
  k0: K_WIDE,
  k1: K_END,
  c0: CONTENT_OPEN,
  c1: CONTENT_OPEN,
  warp: 1,
});
export const CY_FINAL = CONTENT_OPEN + CAM_LIFT / K_END;
export const CAM_F = [0, ...LEAN.F, ...RELEASE.F, ...CREEP.F, DURATION];
export const CAM_K = [K_OPEN, ...LEAN.K, ...RELEASE.K, ...CREEP.K, K_END];
export const CAM_CY = [LEAN.CY[0], ...LEAN.CY, ...RELEASE.CY, ...CREEP.CY, CY_FINAL];

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  wash: "#FFD98A",
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  coinRadius: COIN_R,
  dotRadius: DOT_R,
  beats: {
    and: 0,
    yet: 5,
    it: 13,
    does: 17,
    not: 22,
    seem: 28,
    to1: 33,
    impair: 45,
    what: 58,
    investors: 70,
    deem: 80,
    to2: 82,
    be: 84,
    the1: 90,
    terminal: 103,
    value: 109,
    of: 111,
    the2: 112,
    company: 121,
  },
});

// The one group wash, laid over a coin through the same "$" knock-out the coin
// itself uses, so the pile takes the half-step without the "$" being painted
// over. Nothing in this cut is ever brighter than this.
const CoinWash: React.FC<{ x: number; y: number; r: number; color: string; opacity: number }> = ({
  x,
  y,
  r,
  color,
  opacity,
}) => {
  const s = (r * 2 * 0.62) / 24;
  const o = -12 * s;
  const id = `tv-wash-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-r} y={-r} width={r * 2} height={r * 2}>
          <rect x={-r} y={-r} width={r * 2} height={r * 2} fill="#fff" />
          <g
            transform={`translate(${o} ${o}) scale(${s})`}
            fill="none"
            stroke="#000"
            strokeWidth={2.6}
            strokeLinecap="square"
            dangerouslySetInnerHTML={{ __html: COIN_DOLLAR }}
          />
        </mask>
      </defs>
      <circle r={r} fill={color} mask={`url(#${id})`} />
    </g>
  );
};

const TerminalValue: React.FC<Props> = ({
  accent,
  wash,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  coinRadius,
  dotRadius,
}) => {
  const frame = useCurrentFrame();

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the breach, still running ---------------------------------------------
  const leak = leakStream(frame);

  // -- the pile, and the money still on its way ------------------------------
  const dy = pileDy(frame);
  const placed: { key: number; x: number; y: number }[] = [];
  const flying: { key: number; x: number; y: number }[] = [];
  for (let n = 0; n < PILE_OPEN; n++) {
    const p = pileSlot(n);
    placed.push({ key: n, x: p.x, y: p.y + dy });
  }
  for (const L of FLIGHTS) {
    if (frame >= L.land) {
      placed.push({ key: L.n, x: L.x1, y: L.y1 + dy });
      continue;
    }
    if (frame < L.depart) continue;
    const u = flow((frame - L.depart) / FLIGHT);
    // the back(0.75) settle, along this coin's own travel and nothing else's
    const s = SETTLE_PX * overshoot((frame - L.depart) / FLIGHT);
    flying.push({
      key: L.n,
      x: lerp(L.x0, L.x1, u) + L.ux * s,
      y: lerp(L.y0, L.y1 + dy, u) - L.arc * 4 * u * (1 - u) + L.uy * s,
    });
  }
  placed.sort((a, b) => a.key - b.key);
  const washOp = washAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CENTRE_X}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
            {/* the breach. UNDER the tile, so every dot comes out from beneath
                its bottom edge instead of appearing next to it. */}
            {leak.map((d) => (
              <DataDot key={d.key} x={d.x} y={d.y} k={k} opacity={d.opacity} color={accent} r={dotRadius} />
            ))}

            {/* the company. It never moves and never changes: what is happening
                is happening around it. */}
            <BrandTile x={CENTER.x} y={CENTER.y} brand="EQUIFAX" w={EFX_SPOT.w} h={EFX_SPOT.h} k={k} />

            {/* what it is worth, lying on top of it */}
            {placed.map((c) => (
              <Coin key={`p${c.key}`} x={c.x} y={c.y} r={coinRadius} />
            ))}
            {washOp > 0 &&
              placed.map((c) => (
                <CoinWash key={`w${c.key}`} x={c.x} y={c.y} r={coinRadius} color={wash} opacity={washOp} />
              ))}

            {/* and what is still arriving */}
            {flying.map((c) => (
              <Coin key={`f${c.key}`} x={c.x} y={c.y} r={coinRadius} />
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default TerminalValue;

// `interpolate` and `clamp` are the house's, kept in scope for the velocity
// scan's sampling of this file's tracks.
export const camAt = (f: number) => {
  const c = runCamera(f, CAM_F, CAM_CY, CAM_K);
  const d = sway(f);
  return { k: c.k, cy: c.cy + d.dy, cx: CENTRE_X + d.dx };
};
export const kTarget = (f: number) => interpolate(f, CAM_F, CAM_K, clamp);
