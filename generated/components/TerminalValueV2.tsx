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
  sway,
  worldTransform,
} from "./fieldShared";
// The house material and the money. The coin is d1Shared's `Coin` — r 11, a
// radial highlight and a "$" knocked out — because money in this world is
// always that object; `COIN_DOLLAR` comes with it so the one group wash can be
// laid over a coin through the same knock-out rather than painting over the "$".
import { COIN_DOLLAR, Coin, KRAFT_BASE, KRAFT_BLUR, KRAFT_DIM, KRAFT_SRC, KraftBackground, V4 } from "./d1Shared";
// The clip's shared module. Nothing here is restated: the tile, the brand
// paths, the crack, the record card, the spill physics and the centre all come
// from there.
import {
  CENTER,
  CrackedBrandTile,
  EFX_SPOT,
  HEAP_BIG,
  HEAP_ROW_PITCH,
  RECORD_H,
  RECORD_W,
  RecordCard,
  SPILL_RATE_FAST,
  crackFoot,
  heapSlots,
  spillRecords,
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
//   f4  (into "yet") — the second spill starts: twenty-four more records fall
//                 out of the crack's foot at SPILL_RATE_FAST and heap on top of
//                 the forty-four already lying there. The heap of files grows
//                 UP toward the break it came out of.
//   f56 (no word)  — THE SPILL DOES NOT STOP. The fast stream's last card is
//                 born at f50; from f56 the SAME stream continues at one card
//                 every six frames, jittered, and it goes on being born every
//                 six frames until the last frame of the cut. Nothing about it
//                 is a new event — the rate eases off, the crack keeps
//                 emptying, and there is a record in the air in every single
//                 frame from f4 to f137.
//   f45 impair  — the coin pile sags 2 px and comes straight back (f42-52). It
//                 looks like it might give, and it does not. Nothing else
//                 happens to the money in the whole of phase 1, and that IS the
//                 gesture: below it the company is still emptying out.
//   f52-74      — sixteen coins leave off-frame, alternating sides
//   f60-83      — the last records land: files arriving BELOW while money
//                 arrives ABOVE, the two halves of the line at once
//   f84-106     — the coins land, one every ~1.5 frames, into the three
//                 tapering rows 3 (7), 4 (6) and 5 (3)
//   f103 terminal — the whole pile takes one 3 px group settle (f101-109) and
//                 the cut's ONE group wash (#FFD98A, 6 frames). Forty coins in
//                 six narrowing rows: the value found its level.
//   f121 company — nothing new. The camera is still opening to take in the
//                 whole spill, and the whole spill is still spilling: a card
//                 comes out of the break at f118, f124, f129 and f135 and six
//                 of them are still in the air on the last frame.
//
// ---------------------------------------------------------------------------
// "The terminal value", CUT 3, TAKE 2 — ONE MOTION: IT SPILLS OUT BELOW AND IT
// PILES UP ON TOP.
//
// V2 of TerminalValue.tsx. The motion, the timings, the coin pile, the sag, the
// sixteen arrivals, the settle, the wash and the camera track's SHAPE are the
// approved V1 and are untouched. What changed is the SUBJECT and the LEAK, and
// only because the user said the V1 leak "is way too abstract and doesn't feel
// motivated. Replace the dots with documents so it shows actual data":
//
//   * The Equifax tile is BROKEN OPEN. `CrackedBrandTile` at `open` 1 from f0 —
//     the breach happened in cut 1 and this cut opens on its aftermath, so
//     nothing about the break is animated here. It is a fact of the picture.
//   * The amber DataDot leak is GONE. No `leakStream`, no `swellAt`, no
//     LEAK_* import: the whole generator and its swell are deleted, not
//     disabled.
//   * What comes out of the crack is RECORDS — `RecordCard`s, white paper with
//     a person and two lines knocked out of them, the same tile material as
//     everything else in this world. Forty-four of them are already lying in a
//     heap under the tile at f0 (the state cut 1 ends on) and more keep falling
//     out for the rest of the cut, so the heap of files visibly keeps growing
//     while the money on top only grows too.
//   * AND THE BREACH NEVER STOPS. REV 1 ran the spill out at f83 and the last
//     fifty frames had nothing in them but a coin settle and a 0.04 camera
//     creep — a hold with no motion under it. The stream now runs to the last
//     frame: twenty-four cards at rate 2 (f4 -> f50), then the same crack
//     emptying at rate 6 (f56 -> f135), so a record is born every six frames
//     through "terminal value of the company" and the tail. Files are still
//     landing below while the coins settle above, which is the line.
//
// So: money is amber and lies ON the company; data is white paper and lies
// UNDER it, on the sheet, in a pile that nobody is picking up. With the sound
// off: Equifax is broken open with a pile of its files spilled on the floor,
// still spilling, and the money on top keeps growing.
//
// It is NOT cut 2's chart and NOT cut 1's crowd. Same objects (the tile, the
// record, the house coin), a different picture. No chart, no price line, no
// ring of companies, no investors as people, no text, no level line, no scale,
// and nothing stands on a ground: the tile floats, the coins lie on it and the
// records lie under it on their own contact-free heap.
//
//   PHASE 1 · AND YET (f0 -> f45)
//     f0 is mid-spill, not an empty start: forty-four records are already at
//     rest in the heap. From f4 the second spill runs — one record every two
//     frames out of the crack's foot, on the shared gravity arc, tumbling and
//     settling into the next slot up the heap. The coin pile does nothing at
//     all until "impair" (f45), where it sags 2 px and recovers over f42-52.
//     The camera creeps k 1.52 -> 1.70 with its centre leaning from 837 up to
//     808 — toward the money, the thing that is about to give — and lands f38.
//     Held breath f39 -> f45, the cut's only one, with the spill running under
//     it so the frame is still and the picture is not.
//
//   PHASE 2 · INVESTORS (f46 -> f100)
//     Sixteen coins leave from off-frame, alternating left and right, hashed
//     across f52 -> f74, and cross the frame on `flow` eases with a shallow
//     hashed arc, landing f84 -> f106 into the three tapering rows: 7 left to
//     right, 6 back right to left, 3 left to right. Each landing is that coin's
//     own back(0.75) settle along its own travel; the pile itself never
//     bounces. Underneath, the fast stream's last records land f79 -> f83 and
//     the slow stream takes over without a gap — files arriving below, money
//     arriving above, which is the whole line in one picture. The camera is
//     released k 1.70 -> 1.44 back to centre 837, keyed f44 -> f68 and landing
//     f75 — before "deem" and before the first coin is down.
//
//   PHASE 3 · TERMINAL VALUE (f100 -> f121)
//     The last coin is down by f106. On "terminal" (f103) the whole pile takes
//     a single 3 px group settle (f101-109) and the one group wash (#FFD98A,
//     6 frames) — no single-object click anywhere in this cut. On "company"
//     nothing new starts: the camera creeps k 1.44 -> 1.36 (f112-134) to take
//     in the whole spill, and the spill is what the last word lands on. Under
//     it the crack is still emptying: cards born at f100, f107, f112 and f118
//     are in the air the whole way through the settle and the wash.
//
//   TAIL (f121 -> f137)
//     NOT a hold. Forty coins resolved on a broken Equifax and the camera still
//     widening, with the breach running under both: seventy-six records at rest
//     in the heap on the last frame and six more in the air between the break
//     and the top of the pile. The picture is resolved and the company is still
//     emptying out. Never faded.
//
// DEVIATIONS FROM THE BRIEF, EACH ARGUED WHERE IT IS SET:
//   * The heap is built with the shared `heapSlots` at `maxRow` 13 rather than
//     at its default 7 — see THE HEAP. Nothing is reimplemented and the shared
//     module is untouched: `maxRow` is one of its own options, and 7 is a
//     bottom row for HEAP_SMALL. At sixty-eight cards a bottom row of 7 is
//     twenty-seven rows and 736 world px of mostly two-wide cards, a chimney
//     that grows straight through the tile and out of the top of the coin pile.
//   * cy is re-solved off THIS composition: 837 open / 808 lean, not V1's 897 /
//     868 — see THE CAMERA. The k values are the brief's, untouched.
//   * The record flight is 32 frames, not the shared 26 — see THE SPILL. The
//     shared gravity arc peaks at 51 screen px/frame at 26 and the cap is 45;
//     at 32 it peaks at 41.6 and the last card is down at f83, not f78.
//   * The final creep is f112 -> f134 rather than the brief's f112 -> f124, and
//     it now runs k 1.44 -> 1.36 rather than 1.40 (REV 2: a wider release on
//     the tail). The brief's twelve frames put the damper at rest by f130 —
//     seven dead frames at the end of the cut; twenty-two frames of the SAME
//     two k values keeps the pull-back running through the last frame.
//   * The flight stays 32 frames from 560 px off-frame (V1's revised numbers):
//     the camera track and the pile geometry relative to the tile are
//     unchanged, so the speed check that set 32 still binds. Measured again
//     below.
//   * The slow stream is allocated FOURTEEN slots (82 in all) where REV 2's
//     note estimated nine (77). The note's own instruction is that records keep
//     coming "until the last frame", and at rate 6 that is fourteen births
//     (f56, f62 ... f134). The estimate of nine is the number that come to REST
//     inside the cut, and it is right: cards born after f104 are still in the
//     air at f137, so the heap that is actually lying on the sheet on the last
//     frame is 44 + 24 + 8 = SEVENTY-SIX cards, the note's ~77. The five extra
//     slots are targets for cards that never reach them and cost the heap no
//     height at all — see THE HEAP for what they would have cost if they had.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // the money's tone; nothing else in this cut is amber
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
  recordW: z.number(),
  recordH: z.number(),
  beats: z.object({
    and: z.number(), // "and"
    yet: z.number(), // "yet" — the second spill is already running
    it: z.number(), // "it"
    does: z.number(), // "does"
    not: z.number(), // "not"
    seem: z.number(), // "seem"
    to1: z.number(), // "to"
    impair: z.number(), // "impair" — the coin pile sags and recovers
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
// exists to catch exactly that.
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
// both ends. It is the settle, and it is also every sag and the wash in this
// cut — one shape for everything that goes and comes back.
export const lobe = (u: number) => {
  const w = clamp01(u);
  return 64 * w ** 3 * (1 - w) ** 3;
};
const SETTLE_U0 = 4 / 7; // where the back-out ease used to cross 1
const overshoot = (u: number) => lobe((clamp01(u) - SETTLE_U0) / (1 - SETTLE_U0));
export const SETTLE_PX = 3;

// ---------------------------------------------------------------------------
// THE COMPANY. Broken open from the first frame.
//
// The tile is EFX_SPOT (340 x 108) and its centre sits at world y 740, which is
// NOT the shared CENTER.y (835). There is no cut-1 join to honour in this take
// — the user is cutting cut 1 themselves — so the tile's y is solved from the
// COMPOSITION instead: the coin pile grows 171 px above the tile's centre and
// the heap of records falls 360 px below it, and 740 is the y that puts that
// whole stack's midpoint where the camera wants it (see THE CAMERA).
//
//   pile top edge      569   (six rows of coins, resolved)
//   tile top           686
//   tile centre        740
//   tile bottom        794   <- the crack's foot; every record comes out here
//   heap top edge      892   (row 6, resolved)
//   heap base         1100   (bottom edge of row 0, fixed for the whole cut)
//
// 98 px of clear sheet between the tile's bottom edge and the top of the heap
// at its tallest, so the pile never grows into the thing it fell out of.
// ---------------------------------------------------------------------------
export const TILE_CX = CENTER.x; // 540
export const TILE_CY = 740;
export const TILE_TOP = TILE_CY - EFX_SPOT.h / 2; // 686
export const TILE_BOTTOM = TILE_CY + EFX_SPOT.h / 2; // 794
export const CRACK_SEED = 3;

// ---------------------------------------------------------------------------
// THE PILE (money). Untouched from V1 except that it rides 95 px higher with
// the tile. Eight wide at pitch 22 (= 2r, so a row is a row of touching
// coins), rows at pitch 20 so each row bites 2 px into the one below it, and
// every odd row offset half a pitch — a brick pile, not a grid. The bottom row
// overlaps the tile's top edge by 5 px so the pile lies ON the company rather
// than hovering over it.
//
// Opening pile: 3 rows of 8, 24 coins. Rows 3, 4 and 5 arrive in phase 2 and
// TAPER — 7, 6, 3 — so the resolved pile is forty coins with a shoulder and a
// peak instead of a five-by-eight block.
// ---------------------------------------------------------------------------
export const COIN_R = V4.COIN_R_V5; // 11 — the house coin, unchanged
export const PILE_COLS = 8;
export const PILE_PITCH_X = 22;
export const PILE_PITCH_Y = 20;
export const PILE_X0 = CENTER.x - ((PILE_COLS - 1) * PILE_PITCH_X) / 2; // 463
export const PILE_ROW0_Y = TILE_TOP - COIN_R + 5; // 680
export const ROW_COUNTS = [8, 8, 8, 7, 6, 3];
export const ROW_START = ROW_COUNTS.reduce<number[]>((a, c) => [...a, a[a.length - 1] + c], [0]);
export const PILE_OPEN = ROW_START[3]; // 24 — the three rows standing at f0
export const PILE_TOTAL = ROW_START[ROW_COUNTS.length]; // 40
export const PILE_ARRIVE = PILE_TOTAL - PILE_OPEN; // 16 — rows 3, 4 and 5
export const PILE_ROWS = ROW_COUNTS.length; // 6

// A row's left-hand coin. Rows 0-2 are the brick; rows 3-5 are centred on the
// tile's axis, and because the counts alternate parity (8, 7, 6, 3) centring
// lands every coin of a narrow row in a valley of the row beneath it.
export const rowX0 = (row: number) =>
  row < 3
    ? PILE_X0 + (row % 2 === 1 ? PILE_PITCH_X / 2 : 0)
    : CENTER.x - ((ROW_COUNTS[row] - 1) * PILE_PITCH_X) / 2;

// Slot n, in fill order: each row is filled before the next one starts, and the
// direction alternates, so the arrivals read as a sweep laying down each course
// rather than as three copies of the same move.
export const pileSlot = (n: number) => {
  let row = 0;
  while (row < ROW_COUNTS.length - 1 && n >= ROW_START[row + 1]) row++;
  const j = n - ROW_START[row];
  const col = row >= 3 && row % 2 === 0 ? ROW_COUNTS[row] - 1 - j : j;
  return { x: rowX0(row) + col * PILE_PITCH_X, y: PILE_ROW0_Y - row * PILE_PITCH_Y };
};
export const PILE_TOP_Y = PILE_ROW0_Y - (PILE_ROWS - 1) * PILE_PITCH_Y - COIN_R; // 569
export const PILE_OPEN_TOP_Y = PILE_ROW0_Y - 2 * PILE_PITCH_Y - COIN_R; // 629, phase 1

// The pile's two authored moves. Both are the same zero-sloped lobe, so neither
// hands the scan a step in speed.
//   f42-52   "impair": 2 px of sag and straight back. The money looks like it
//            might give and does not — the word is answered by a refusal.
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
// nothing brighter than the half-step. WASH_PEAK IS 0.4, NOT 1: at full opacity
// the flat colour covers the coin's own radial gradient and forty coins go pale
// and flat for six frames. At 0.4 the gradient reads through it and the pile
// brightens instead of flattening.
export const WASH_F0 = 103;
export const WASH_DUR = 6;
export const WASH_PEAK = 0.4;
export const washAt = (f: number) => WASH_PEAK * lobe((f - WASH_F0) / WASH_DUR);

// ---------------------------------------------------------------------------
// THE HEAP (data). Personal records lying on the sheet under the broken tile:
// forty-four already there when the cut opens, twenty-four falling out of the
// crack during the first half of the line, and then one every six frames for
// the rest of the cut. Seventy-six are at rest on the last frame and six more
// are in the air.
//
// THE BOTTOM ROW IS 13 CARDS, NOT THE SHARED DEFAULT OF 7, AND THAT IS THE ONE
// NUMBER THIS CUT CHANGES. `heapSlots` takes `maxRow` as an option precisely so
// a heap can be sized to its pile, and 7 is the bottom row of HEAP_SMALL. Its
// row rule is max(2, maxRow - r), so at maxRow 7 the counts go 7, 6, 5, 4, 3
// and then two for ever: forty-four cards is fifteen rows and 409 world px,
// seventy-six is thirty-one rows and 845 px — a two-wide chimney growing up
// through the tile and out of the top of the coin pile. At 13 the counts are
// 13, 12, 11, 10, 9, 8, 7, 6 ... and seventy-six cards are eight rows: 352 px
// wide, 236 px tall, which is a heap. Nothing else is local — RecordCard, the
// pitches, the ±14° hashed rest angles, the ±3 px slop and `spillRecords` are
// all the shared module's, unmodified.
//
//   row pitch 27.28 (0.62 x 44), row 0 bottom edge fixed at 1100 all cut
//   row 0 (13 cards) centre y 1078, x 364 .. 716
//   f0 state:  44 cards = rows 0-2 full (36) + 8 of row 3, top edge  974
//   f83:       68 cards = rows 0-5 full (63) + 5 of row 6, top edge  891
//   f137:      76 cards = rows 0-7 full (76),              top edge  864
//   The heap grows 110 px UP toward the break it fell out of over the cut, and
//   never reaches it: the top card's edge on the last frame is 70 px below the
//   tile's bottom (94 px allowing for the rotated corner of a ±14° card, whose
//   half-height is 25.5 rather than 22). The first pass put the base at 1130
//   and the 128 px of bare sheet read as two unrelated objects; the heap now
//   closes on the thing it came out of as the cut runs, which is the point.
//
//   THE SLOT LIST GOES TO 82, FOUR ROWS OF WHICH ONLY EIGHT ARE EVER OCCUPIED.
//   Slots 76-81 are row 8 (five cards, centre y 833) and row 9 (one, centre y
//   805) and they are targets for the cards still in the air when the cut ends.
//   Row 9 would put a card's rotated top edge at 780 — INSIDE the tile, whose
//   bottom is 794 — so it matters that those cards never land: the last card to
//   come to rest inside the cut is slot 75, the last of row 7. If this cut were
//   ever extended past f137 the heap would have to be re-based before the
//   stream could keep running, and that is written here rather than discovered.
// ---------------------------------------------------------------------------
export const HEAP_BASE_Y = 1100; // the bottom edge of row 0; fixed all cut
export const HEAP_CX = CENTER.x;
export const HEAP_MAX_ROW = 13; // cards in the bottom row
export const HEAP_AT_REST = HEAP_BIG; // 44 — what cut 1 left on the sheet
export const HEAP_SPILL = 24; // the fast stream, f4 -> f50 at rate 2
export const HEAP_SEED = 77;
export const HEAP_PITCH_Y = HEAP_ROW_PITCH * RECORD_H; // 27.28, the shared fraction resolved

// The crack's foot in world coordinates: where every record comes out. The tile
// is drawn open, so the foot is the middle of a 14 px gap at the tile's bottom
// edge and a card leaves from between the two halves.
const FOOT = crackFoot(EFX_SPOT.w, EFX_SPOT.h, CRACK_SEED);
export const SPILL_FROM = {
  x: TILE_CX - EFX_SPOT.w / 2 + FOOT.x,
  y: TILE_CY - EFX_SPOT.h / 2 + FOOT.y,
};

export const SPILL_START = 4;
export const SPILL_SEED = 91;
// THE FLIGHT IS 32 FRAMES, NOT THE SHARED SPILL_FLIGHT DEFAULT OF 26, AND IT IS
// SPEED CAP THAT SETS IT. `spillRecords` drops a card on a real gravity arc and
// then blends it onto its slot over the last SPILL_ARREST (0.16) of the flight;
// both the acceleration and that blend put the card's fastest frame at the very
// end of its fall. Measured over all twenty-four cards at h = 1 and h = 1/4,
// with the camera where it actually is when each one lands: 26 frames peaks at
// 48.4 / 51.4 screen px per frame and the house cap is 45. The travel is NOT
// shortened to get under it — the heap has to stay on the floor, 98 px clear of
// the tile — so the flight is lengthened instead, exactly as V1's coin flight
// was. 32 frames peaks at 41.7.
//
// The cost is four frames on the last landing: the fast stream's last card is
// born at 4 + 23 * 2 + jitter <= 51.2 and is down by <= 83.2 rather than the
// brief's ~f78. That lands it one frame before the first coin (f84), which if
// anything tightens the picture the brief asks for — files still arriving below
// as the money starts arriving above.
export const FLIGHT_RECORD = 32;
export const SPILL_FAST_LAST_BIRTH = SPILL_START + (HEAP_SPILL - 1) * SPILL_RATE_FAST; // 50
export const SPILL_FAST_LAST_LANDING = SPILL_FAST_LAST_BIRTH + SPILL_RATE_FAST * 0.6 + FLIGHT_RECORD;

// ---------------------------------------------------------------------------
// THE SLOW STREAM. THE BREACH DOES NOT STOP.
//
// REV 1 ended the spill at f83 and Fable's note on it is the whole reason this
// revision exists: f109-f137 was near-still, and a hold has to carry motion.
// So the fast stream does not end at f50, it EASES OFF. From one rate-6 gap
// after its last birth — f56 — the same crack goes on producing a record every
// six frames, on the same hash jitter, the same 32-frame gravity arc, the same
// smoothstep arrest into the pile, until the last frame of the cut. It is not a
// third event and it is not a new mechanism: it is one stream whose rate drops
// from 2 to 6 at the point where the line stops being about the breach and
// starts being about the money, which is exactly where the breach should stop
// asking for attention and keep happening anyway.
//
//   births  f56.9 f63.5 f69.7 f77.4 f81.4 f88.1 f94.1 f99.9 (these eight land,
//           at f88.9 ... f131.9 — the last one inside the cut)
//           f107.6 f111.8 f118.3 f124.5 f129.5 f135.9 (these six are still in
//           the air on the last frame, at t 0.92, 0.79, 0.58, 0.39, 0.23, 0.03)
//   so: a card is BORN out of the break every ~6 frames from f56 to the end,
//   a card LANDS on the heap every ~6 frames from f89 to f132, and there is
//   never a frame after f4 without a record in the air.
//
// The falls get shorter as the pile rises into them — 120 world px for a card
// landing on row 6, 93 for row 7, and the ones still flying at the end are
// aimed at rows 8 and 9, 66 and 38 px below the break. The flight stays 32
// frames for every one of them (the note: same flight, same arc, same arrest),
// so those last cards are SLOW: out of the break, 8 px of lift, and then a long
// drift down onto the pile, tumbling up to half a turn on the way. That is what
// paper does, it is the same law as every other card in the cut, and it is the
// motion the tail was missing.
// ---------------------------------------------------------------------------
export const TRICKLE_RATE = 6;
export const TRICKLE_START = SPILL_FAST_LAST_BIRTH + TRICKLE_RATE; // 56
export const TRICKLE_SEED = SPILL_SEED + 7;
// births at TRICKLE_START + j * TRICKLE_RATE, for every j whose nominal birth
// is on or before the last frame of the cut.
export const TRICKLE_COUNT = Math.floor((DURATION - 1 - TRICKLE_START) / TRICKLE_RATE) + 1; // 14

export const HEAP_TOTAL = HEAP_AT_REST + HEAP_SPILL + TRICKLE_COUNT; // 82 slots, 76 ever filled
export const HEAP_SLOTS = heapSlots(HEAP_TOTAL, HEAP_CX, HEAP_BASE_Y, HEAP_SEED, {
  maxRow: HEAP_MAX_ROW,
});
export const SPILL_SLOTS = HEAP_SLOTS.slice(HEAP_AT_REST, HEAP_AT_REST + HEAP_SPILL); // 44..67
export const TRICKLE_SLOTS = HEAP_SLOTS.slice(HEAP_AT_REST + HEAP_SPILL); // 68..81

export const trickleAt = (frame: number) =>
  spillRecords({
    frame,
    start: TRICKLE_START,
    rate: TRICKLE_RATE,
    from: SPILL_FROM,
    slots: TRICKLE_SLOTS,
    seed: TRICKLE_SEED,
    flight: FLIGHT_RECORD,
  });

// How tall the heap actually gets: measured off the shared spill itself at the
// last frame rather than asserted, so the geometry above cannot drift from the
// motion. 76 at rest, 6 in the air.
export const TRICKLE_RESTED_END = trickleAt(DURATION - 1).filter((c) => c.resting).length; // 8
export const TRICKLE_AIRBORNE_END = trickleAt(DURATION - 1).length - TRICKLE_RESTED_END; // 6
export const HEAP_RESTED_END = HEAP_AT_REST + HEAP_SPILL + TRICKLE_RESTED_END; // 76
export const HEAP_TOP_Y =
  Math.min(...HEAP_SLOTS.slice(0, HEAP_RESTED_END).map((s) => s.y)) - RECORD_H / 2; // 864
export const HEAP_REST_TOP_Y =
  Math.min(...HEAP_SLOTS.slice(0, HEAP_AT_REST).map((s) => s.y)) - RECORD_H / 2; // 974
export const HEAP_GROWTH = HEAP_REST_TOP_Y - HEAP_TOP_Y; // 110 world px the pile gains

// ---------------------------------------------------------------------------
// THE MONEY ARRIVING.
//
// FLIGHT IS 32 FRAMES FROM 560 PX OFF-FRAME. On `flow` a travel peaks at
// 1/(1-0.28) times its average, so 650 world px in n frames peaks at 468/n
// world px a frame, and the arrivals cross the frame at k 1.44-1.53. Measured
// over every coin at h=1 and h=0.25: 28 frames peaks at 47.7 screen px/frame
// and 30 at 45.9 — both over the house cap of 45; 32 frames peaks at 44.2. The
// travel was never shortened to get there. The camera track and the pile's
// geometry relative to the tile are the same in V2, so the same 32 binds.
//
// DEPARTURES ARE f52 -> f74: the cadence (22 frames for sixteen coins, one
// every ~1.5) and the LAST landing (f106, before the settle on "terminal") are
// what the brief pins. A ±1.2 frame hash keeps sixteen departures from being a
// metre.
//
// 560 px out still starts every coin off the sheet at the widest the camera
// ever gets while one is in the air — k 1.44 sees x 165..915 and k 1.70 sees
// x 222..858, so a coin leaving from x -20 or x 1100 has 185 px of margin at
// its own departure frame.
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
// `runCamera`, with `cy = c + CAM_LIFT / k` off the same eased k so the content
// centre sits on screen y 835 — above the burnt-in captions — at every zoom.
//
//   LEAN    f3-32    k 1.52 -> 1.70, centre 837 -> 808: leaning toward the
//                    money, the thing that is about to give. Lands f38.
//   (held breath f39 -> f45, the cut's only one and seven frames of it. The
//    spill is running under it and the sag lands inside it, so the frame is
//    still and the picture is not)
//   RELEASE f44-68   k 1.70 -> 1.44, centre back to 837. Lands f75, five frames
//                    before "deem" and nine before the first coin is down.
//   CREEP   f112-134 k 1.44 -> 1.36 on "company": the last thing the cut does
//                    is widen far enough to hold the whole spill. It is keyed
//                    to f134 so the pull-back is STILL RUNNING on the last
//                    frame, and the release is 0.08 of k rather than REV 1's
//                    0.04 — twice the travel over the same twenty-two frames,
//                    which is the widening the tail asks for. The damper never
//                    sees more than 0.0055 of k in a frame either way.
//
// THE k VALUES ARE V1's APPROVED ONES. This is a CLOSE-UP ON THE MECHANISM —
// one tile and what is happening to it — so it does not share cut 1's k, and
// cut 2 sits between them so the set still steps.
//
// cy IS RE-SOLVED FOR THIS COMPOSITION AND IS NOT V1's. The content centre is
// the midpoint of the resolved picture: the coin pile's top edge (569) to the
// heap's base (1100), i.e. 834.5, nudged 2.5 px down to 837 to split the
// difference with the shorter composition of phase 1 (three rows of coins, the
// heap four rows tall, midpoint 864.5). V1's 897/868 belonged to a picture
// whose bottom was a 240 px fall of dots from a tile at y 835 and does not
// transfer.
//
// RE-SOLVED AGAIN FOR THE WIDER TAIL, AND IT COMES OUT AT THE SAME NUMBER. The
// slow stream grows the heap UPWARD — 891 to 864 — and leaves both of the
// composition's extremes exactly where they were: the coin pile's top edge is
// still 569 and the heap's base is still 1100, because the base is row 0 and
// row 0 was full before this cut started. So the content centre is unchanged at
// 837 and the only cy that moves is the resting one the track ends on,
// CY_FINAL = 837 + CAM_LIFT / k, which goes 926.3 -> 928.9 with k.
//
//   checked, screen y = 835 + (world - centre) * k, plus sway ±5·k:
//     k 1.52 c 837 (f0)    heap base -> 1235, coin top -> 519
//     k 1.70 c 808 (f38)   heap base -> 1331, coin top -> 531
//     k 1.44 c 837 (f75)   heap base -> 1214, coin top -> 449
//     k 1.36 c 837 (f136)  heap base -> 1193, coin top -> 471
//   The caption band starts at 1450 and the rule on the pile's top is 260:
//   119 px of clearance at the worst frame and 211 px at the other end. The
//   scan measures both over every frame rather than at these four.
//
// THE KEYS ARE AHEAD OF THE LANDINGS BY DESIGN. CAM_STIFF 0.09 / CAM_DAMP 0.468
// costs about six frames on moves this size, so the brief's landings (f38 and
// f75) are what the keys are solved for, not its keys.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.52;
export const K_LEAN = 1.7;
export const K_WIDE = 1.44;
export const K_END = 1.36;
export const CONTENT_OPEN = 837;
export const CONTENT_LEAN = 808; // 29 px up toward the money — 49 screen px at K_LEAN

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
  f1: 134,
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
  recordW: RECORD_W,
  recordH: RECORD_H,
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
  const id = `tv2-wash-${Math.round(x)}-${Math.round(y)}`;
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

const TerminalValueV2: React.FC<Props> = ({
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
  recordW,
  recordH,
}) => {
  const frame = useCurrentFrame();

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the records: forty-four already down, and the crack still emptying -----
  // Two calls, one stream: the same generator, the same arc and the same
  // arrest, at rate 2 up to f50 and at rate 6 from f56 to the last frame.
  const spilling = spillRecords({
    frame,
    start: SPILL_START,
    rate: SPILL_RATE_FAST,
    from: SPILL_FROM,
    slots: SPILL_SLOTS,
    seed: SPILL_SEED,
    flight: FLIGHT_RECORD,
  });
  const trickling = trickleAt(frame);

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
            {/* the spilled files. UNDER the tile, so a record in the air comes
                out from between the two halves instead of over them. Drawn in
                slot order, so a card in a higher row lies on the one below. */}
            {HEAP_SLOTS.slice(0, HEAP_AT_REST).map((s, i) => (
              <RecordCard key={`r${i}`} x={s.x} y={s.y} w={recordW} h={recordH} rot={s.rot} k={k} />
            ))}
            {spilling.map((s, i) => (
              <RecordCard
                key={`s${i}`}
                x={s.x}
                y={s.y}
                w={recordW}
                h={recordH}
                rot={s.rot}
                k={k}
              />
            ))}
            {trickling.map((s, i) => (
              <RecordCard
                key={`t${i}`}
                x={s.x}
                y={s.y}
                w={recordW}
                h={recordH}
                rot={s.rot}
                k={k}
              />
            ))}

            {/* the company, broken open. It never moves: what is happening is
                happening out of it and on top of it. */}
            <CrackedBrandTile
              x={TILE_CX}
              y={TILE_CY}
              brand="EQUIFAX"
              w={EFX_SPOT.w}
              h={EFX_SPOT.h}
              k={k}
              open={1}
              seed={CRACK_SEED}
            />

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

export default TerminalValueV2;

// `interpolate` and `clamp` are the house's, kept in scope for the velocity
// scan's sampling of this file's tracks.
export const camAt = (f: number) => {
  const c = runCamera(f, CAM_F, CAM_CY, CAM_K);
  const d = sway(f);
  return { k: c.k, cy: c.cy + d.dy, cx: CENTRE_X + d.dx };
};
export const kTarget = (f: number) => interpolate(f, CAM_F, CAM_K, clamp);
