import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  Vignette,
  camMove,
  clamp,
  clamp01,
  sway,
  worldTransform,
} from "./fieldShared";
import { KRAFT_BASE, KraftBackground } from "./d1Shared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Christina, on breach fatigue:
//   "Especially 10 to 15 years into this, where you're like, oh, another one."
//
// SRT span 0:35.179 -> 0:38.640 at 24 fps.
//   round((38.640 - 35.179) * 24) = round(3.461 * 24) = round(83.06) = 83
//   frames of speech, plus the house 16-frame tail so the resolved state holds
//   = DURATION 99.
//
// Word onsets, in frames from 35.179:
//   f0 especially · f14 10 · f25 to · f28 15 · f34 years · f39 into · f45 this
//   · f50 where · f55 you're · f58 like · f61 oh · f69 another · f74 one
//   · f83 end · f99 last frame
//
// ---------------------------------------------------------------------------
// CUT 4 — THIRTEEN REAL NEWS CARDS ON THE KRAFT, AND ONE CAMERA MOVE.
//
// There are no tiles, no records and no coins in this cut. The clip's material
// for one cut is the actual press: thirteen 1080 x 1080 news cards (masthead,
// date, headline, photo) supplied by the user, laid out as a 3 x 5 grid with
// the Forbes Equifax card in the CENTRE slot and the twelve other breaches
// around it in chronological order. All thirteen are mounted from f0; twelve of
// them are held far out on their own radius and close in as the frame opens.
//
// ONE MOTION: THE LENS LETS GO OF THE EQUIFAX HEADLINE AND THE WHOLE DECADE OF
// THEM CLOSES IN AROUND IT. The words are inflections in that one release:
//
//   PHASE 1 · ON EQUIFAX, AND NOTHING ELSE (f0 -> f49, "Especially 10 to 15
//   years into this, where you're like")
//     The sheet holds ONE card. The camera opens at k 3.55 centred exactly on
//     the Equifax card (540, 803) — 260 world px of card is 923 screen px, so
//     the headline "Equifax Data Breach Impacts 143 Million Americans" runs
//     almost the full width of the frame with 78 px of plain kraft down each
//     side and bands of kraft above and below it — and CREEPS IN, k 3.55 -> 3.69
//     over f2 -> f40 on a plain smoothstep (warp 1.0), landing f42 (960 px of
//     card: the 60 px x-guide exactly). "10 to 15 years into this" is not a beat
//     to hit, it is a slow tightening: we are deep in it. Held breath f42 -> f48,
//     the only one in the cut (~7 frames). The other twelve cards are at RADIAL
//     1.9 of their grid offset from the centre and are outside the frame at
//     every phase-1 k — the closest any of them comes is 363 screen px of clear
//     paper between its box and the frame's edge (see RADIAL, below) — frame 0
//     is the Forbes card and the paper, full stop.
//
//   PHASE 2 · OH, ANOTHER ONE (f48 -> f83)
//     The release and the assembly are the same motion in opposite directions.
//     The camera: k 3.69 -> K_WIDE 0.86, content centre fixed on (540, 803) the
//     whole cut, keyed f48 -> f74 on warp 0.55 so the hand's speed is spent
//     EARLY and the last third is a settle. cx never moves and cy never tilts:
//     Equifax is dead centre on every frame of the cut.
//     The twelve: from f50 to f74 they travel from RADIAL 1.9 to 1.0 on ONE
//     `flow` ease — no per-card stagger, the different distances stagger the
//     arrivals on their own — so the wall ASSEMBLES around Equifax as the frame
//     opens, and lands on the grid at f74 inside "another" (f69) / "one" (f74)
//     with the house 8 world px zero-sloped settle to f78. Radial motion out of
//     a common centre preserves the grid's angular separation and never shrinks
//     a gap below its resting 24 px, so no card can cross another and none of
//     them can pass over Equifax, which sits at radial 0 and never moves.
//     On "one" (f74) the THIRTEENTH card — Change Healthcare, 2024, 100M — is
//     climbing up out of the bottom of the frame into the empty row-5 centre
//     slot, and settles into it at f82, on the end of the word. It is the last
//     thing to land, which is the gag.
//
//   TAIL (f83 -> f99) · the hand's `sway` and nothing else. The resolved frame:
//   thirteen news cards, Equifax in the middle, the newest one alone in the
//   bottom row.
//
// No text, no counters, no accent, no highlight on Equifax: its position is the
// highlight. Nothing in this cut is ever drawn in ACCENT — the palette is the
// kraft, the cards' own ink and the vignette.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE BRIEF, AND WHY
//
//  1. THE TWELVE CLOSE IN; THEY ARE NOT PARKED ON THE GRID. (Revision 1, on
//     Fable's review of the first preview.) With the twelve sitting on their
//     slots from f0, the close-up's 9:16 slack has to fall on a NEIGHBOUR: at
//     k 3.30 centred the Al Jazeera "AT&T says data of 73 million customers
//     leaked" card came in at the bottom of frame 0 with masthead, headline and
//     photo (ao/reject_f0_k330.png), and framing the slack onto the card ABOVE
//     instead only traded the AT&T headline for the OPM card's blue photo
//     filling the top third — a second story dominating the first shot either
//     way. A 1:1 card cannot fill a 9:16 frame; there is always 0.78 card-
//     heights of vertical slack, and while twelve cards are on the sheet, that
//     slack has somewhere to be.
//     So they are not on the sheet. Each of the twelve sits at
//       position = CENTRE + RADIAL * (slot - CENTRE)
//     with RADIAL 1.9 until f50 (2.6 in revision 1; see deviation 8) — the
//     nearest of them, the two row-3 neighbours, are then at x 540 +- 1.9 * 284
//     = +-1080 and 0 world, which at the tightest phase-1 k (3.69) is +-1992
//     screen px, nearly two frame-widths out; the nearest in the tall
//     direction, the AT&T card below, clears the frame RECTANGLE by 363 px at
//     its closest (f10) — and they come home from f50 to f74 on one `flow`.
//     Frame 0 is the Forbes card alone on the paper, the reveal is a MOTION
//     rather than a cut in framing, and the camera's content centre no longer
//     has to tilt: (540, 803) from f0 to f99.
//     The whole card is inside the frame with kraft on all four sides at every
//     frame of phase 1 (see deviation 10 for the numbers); the y-band is HELD
//     through the close-up as well, which the gutter framing could not do.
//     The creep is still a live lens rather than a still: the card's side edges
//     travel 18 screen px over the 42 frames.
//
//  2. THE PULL-BACK IS KEYED f48 -> f74 ON WARP 0.55, not f54 -> f68 on warp
//     0.80, and the landing key is 2 frames past the brief's f72 cap. The speed
//     scan is why: the outer cards sit up to 635 world px off the centre, so
//     their screen speed is 635 * |dk/df| and the ratio is 4.3x at the revision-3
//     zoom. On the briefed keys a parked corner card runs well over 120 screen
//     px/frame; f48-74 / 0.55 is the slowest release that still has all twelve
//     fully in frame inside "another", and it holds the parked peak to 83.0
//     (was 89.8 at K_PUSH 4.38). The 45 px/frame cap is
//     not reachable by ANY key window this line allows — even a 26-frame window
//     leaves |dk/df| at 0.20 — so the cap is reported, not met. See SCAN NOTE.
//     UNCHANGED in revision 1; the review approved the wide frame f70 -> f98.
//
//  3. THE THIRTEENTH CARD TRAVELS f68 -> f82 (settle to f86), not f56 -> f74.
//     Its slot is 568 world px below the centre, so it is outside the frame
//     until the camera is nearly landed. A card that starts far below it and
//     lands at f74 has to cross all of that DURING the pull-back, with the whole
//     travel hidden off-frame until the last handful of frames — the arrival
//     would not be seen. Instead it starts 10 world px clear of the frame's OWN
//     bottom edge at f68 (ARRIVE_Y0 is READ OFF THE CAMERA, not written down —
//     revision 3's slower opening zoom puts the camera further back at f68, so
//     it is now 1772.5 world, a 401 px travel, up from 1709 / 338), so it is
//     genuinely outside the frame on the frame it starts, climbs through "one"
//     and settles on the end of the word at f82. Over its VISIBLE frames it
//     peaks at 88.9 screen px/frame (was 95.1), against 90.6 for a card simply
//     parked in that slot under the same camera: the arrival is no faster than
//     the lens, because it climbs against the widening.
//
//  4. THE SETTLE IS 8 WORLD PX, not a literal `Easing.out(Easing.back(0.75))`.
//     Back-out at 0.75 overshoots ~7% of the travel, which on a 401 px climb is
//     28 px and reads as a bounce. 8 world px (6.9 screen px at K_WIDE) is the
//     house `SETTLE_PX` scaled to this card, and it is written as the zero-
//     sloped `64 w^3 (1-w)^3` bump (BackIntoItV5's `overshoot`) so it adds
//     neither a step in speed nor a step in acceleration. The twelve take the
//     SAME lobe, 8 world px along each card's own radius (f74 -> f78), so the
//     wall tightens by one lobe and relaxes; the widest gap it closes is the
//     24 px gutter down to 16 px at the crest, and it opens again by f78.
//
//  5. THE ARRIVING CARD IS BELOW THE BAND (screen y > 1450) FOR f69 -> f80. It
//     cannot not be: it arrives from below the frame into the bottom row. It is
//     clear of the band from f81 and rests wholly inside it (screen 1211 ->
//     1435), so the readable half of the arrival — an empty slot filling —
//     happens in the band. Every other card is inside the band from f76.
//
//  7. NO TWO CARDS EVER OVERLAP, ON SCREEN OR OFF. (Revision 1 had one
//     off-frame overlap: at RADIAL 2.6 the row-4 centre card was parked at
//     world y 1541 and the thirteenth card at 1709, so their 260 px boxes
//     intersected by 92 px, thousands of screen px below the frame. At RADIAL
//     1.9 that card parks at 1342.6, a 366.6 px separation, and the overlap is
//     gone.) The scan's two minima are now the SAME number: over EVERY pair at
//     every quarter-frame, and over every pair with at least one card on
//     screen, the smallest separation-minus-card is +16.0 world px @f76 — the
//     settle crest, where the 24 px gutter momentarily closes to 16 and opens
//     again by f78. Nothing touches anything, ever.
//
//  8. THE TWELVE START AT RADIAL 1.9, NOT 2.6. (Revision 2, on Fable's review
//     of the revision-1 preview: the wall arrived correctly but hot.) The
//     travel is the SAME f50 -> f74 `flow`, the same camera and the same
//     thirteenth-card arrival; only the distance shrinks, so every card covers
//     0.9 of its grid offset instead of 1.6 — a corner card 571 world px
//     instead of 1016, a row-3 neighbour 256 instead of 455. That took the
//     peak screen speed of a card A VIEWER CAN SEE from 175.8 to 140.0 px/frame
//     at the revision-2 camera, and revision 3's shorter zoom ratio (deviation
//     10) takes it to 122.4. The brief's aim for that pass was ~120, which 1.9
//     did not reach at K_PUSH 4.38 and does reach now. Revision 3 did NOT touch
//     R0: 1.9 is the directed constant, and at the new, wider phase-1 k the
//     twelve still clear the frame rectangle by 363 px at their closest, so
//     nothing intrudes on the close-up and there is no reason to push them
//     further out. For the record, the revision-2 scan over R0 gave 1.8 ->
//     137.5, 1.7 -> 129.9, 1.6 -> 123.6, 1.5 -> 114.6; below 1.4 a corner
//     card's box touched the frame during the close-up, which is the floor.
//
//  9. K_WIDE IS THE BRIEF'S 0.86 and the rows are the brief's
//     235/519/803/1087/1371. Solved on screen at rest: the grid's top edge
//     (world 105) lands at screen 234.7 and its bottom edge (world 1501) at
//     1435.3 — +-600.3 about the content centre at 835, leaving 34.7 px of band
//     at the top and 14.7 at the bottom. Sideways, world 126 -> screen 184.0
//     and world 954 -> 896.0. `sway` moves all four by at most 4.3 px. The same
//     content centre now holds through the close-up (deviation 1), so cy is one
//     number for the whole cut.
//
// 10. THE OPENING IS k 3.55 -> 3.69, NOT 4.10 -> 4.38. (Revision 3, on the
//     user's note on the delivered cut: "the first shot of the first article
//     has to have some padding — it's getting cut off the screen, there has to
//     be some space to the edge.") At 4.10 the 260 px card was 1066 screen px
//     on a 1080 frame and crept to 1139: its own white margins bled off both
//     sides and the headline type ran to the bezel. Nothing else in the cut
//     changed — the creep keys (f2 -> f40, warp 1.0, landing f42), the held
//     breath (f42 -> f48), the pull's keys and warp (f48 -> f74, 0.55), RADIAL
//     1.9, the twelve's travel, the settle lobes and K_WIDE 0.86 are all as
//     delivered. Only the two numbers moved.
//       3.55: card 923 screen px, 78.5 px of kraft each side, screen box
//             x 79-1002 / y 374-1297 at f0.
//       3.69: card 959.4 px — the 60 px x-guide exactly — screen box
//             x 50-1009 / y 341-1299 at f42.
//     THE ONE THING THE ARITHMETIC DOES NOT COVER is the hand: `sway` is +-3
//     world px sideways, which at 3.69 is +-11 screen px, so the true minimum
//     over f0-48 is x 50.1 - 1010.0 and the tightest margin to the 60-1020 /
//     200-1450 guides is -9.9 px on the LEFT at f43. That is 50 px of clear
//     kraft between the card and the frame — the card is whole on every frame,
//     which is what the note asked for — but the LEFT edge is past the x-guide
//     from f25 to f48 (the right edge never is; it peaks at 1010.0), reaching
//     -9.9 px at f43. That is the creep's tightest half plus the sway's swing.
//     For scale, the delivered version crossed the same guide from about f20
//     and took the card's box to -29 px. It is reported rather than removed
//     because
//     K_PUSH 3.69 is the directed constant; K_PUSH 3.60 (card 936 px) is what
//     would hold the guide with the sway included, at the cost of 12 px of the
//     creep. Vertically there is no question: y 340.1 - 1304.0 over the whole
//     of phase 1, 140 px inside the band at the top and 146 at the bottom.
//     KNOCK-ONS, all read off the camera rather than rewritten: ARRIVE_Y0 is
//     now 1772.5 world (was 1709 — the camera is further back at f68, so the
//     thirteenth card starts lower to keep its 10 px of clearance) and its
//     travel is 401 px (was 338); the zoom ratio over the pull falls from 5.1x
//     to 4.3x, which lowers every entry speed (deviation 8 and the SCAN NOTE).
// ---------------------------------------------------------------------------

export const DURATION = 99;

export const schema = z.object({
  backgroundBase: z.string(),
  parallax: z.number(),
  cardSize: z.number(), // world px, a news card is square
  cardRadius: z.number(), // world px
  cardShadowY: z.number(), // screen px, divided by k
  cardShadowBlur: z.number(), // screen px, divided by k
  cardShadowOpacity: z.number(),
  vignette: z.number(),
  beats: z.object({
    especially: z.number(), // f0
    ten: z.number(), // f14  "10"
    fifteen: z.number(), // f28 "15"
    years: z.number(), // f34
    into: z.number(), // f39
    this: z.number(), // f45
    where: z.number(), // f50 — the release is already keyed
    like: z.number(), // f58 — the camera is visibly letting go
    oh: z.number(), // f61
    another: z.number(), // f69 — the grid is in frame
    one: z.number(), // f74 — the thirteenth card is climbing
    end: z.number(), // f83
  }),
});
export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE GRID. 3 columns x 5 rows, pitch 284 = a 260 card and a 24 px gutter.
// Composed chronologically, reading order, Equifax in the centre slot.
// ---------------------------------------------------------------------------
export const CARD = 260;
export const CARD_HALF = CARD / 2;
export const PITCH = 284;
export const COL_X = [256, 540, 824];
export const ROW_Y = [235, 519, 803, 1087, 1371];
export const CENTER = { x: 540, y: 803 };

export const GRID_TOP = ROW_Y[0] - CARD_HALF; // 105
export const GRID_BOTTOM = ROW_Y[4] + CARD_HALF; // 1501
export const GRID_LEFT = COL_X[0] - CARD_HALF; // 126
export const GRID_RIGHT = COL_X[2] + CARD_HALF; // 954

type Slot = { file: string; x: number; y: number };

// Row-major. The centre of row 3 is Equifax; row 5 holds only the newest, and
// it is the one that arrives.
export const SLOTS: Slot[] = [
  { file: "01_NBC_Sony_PSN_77M.png", x: COL_X[0], y: ROW_Y[0] },
  { file: "02_CBS_Target_40M.png", x: COL_X[1], y: ROW_Y[0] },
  { file: "03_NBC_Home_Depot_56M.png", x: COL_X[2], y: ROW_Y[0] },
  { file: "04_ABC_Anthem_80M.png", x: COL_X[0], y: ROW_Y[1] },
  { file: "05_CBS_OPM_21M.png", x: COL_X[1], y: ROW_Y[1] },
  { file: "06_NPR_Yahoo_1B.png", x: COL_X[2], y: ROW_Y[1] },
  { file: "07_NPR_Marriott_500M.png", x: COL_X[0], y: ROW_Y[2] },
  { file: "Forbes_Equifax_Breach_143M.png", x: COL_X[1], y: ROW_Y[2] },
  { file: "08_CBS_Capital_One_100M.png", x: COL_X[2], y: ROW_Y[2] },
  { file: "09_NPR_T-Mobile_50M.png", x: COL_X[0], y: ROW_Y[3] },
  { file: "10_AlJazeera_ATT_73M.png", x: COL_X[1], y: ROW_Y[3] },
  { file: "11_GlobalNews_Ticketmaster_560M.png", x: COL_X[2], y: ROW_Y[3] },
];
export const ARRIVING_FILE = "12_Forbes_Change_Healthcare_100M.png";
export const ARRIVE_X = COL_X[1];
export const ARRIVE_Y = ROW_Y[4];

// ---------------------------------------------------------------------------
// THE CAMERA. One damped `runCamera` track, cx fixed on the grid's own centre
// column so there is no pan at all: the creep in, a 6-frame held breath, and
// the release. Keys are written with fieldShared's `camMove`, one key per frame
// off the eased curve, with cy taken off the EASED k (CAM_LIFT / k) so the
// content centre sits at screen 835 at every zoom and cannot sag away from its
// own move.
// ---------------------------------------------------------------------------
export const K_OPEN = 3.55; // the Equifax card is 923 screen px wide: 78 px of kraft each side
export const K_PUSH = 3.69; // the creep's end: 960 px — exactly the 60 px band margin
export const K_WIDE = 0.86; // the whole grid, inside the band

// ONE content centre for the whole cut: the Equifax card, which is also the
// grid's centre. There is no tilt to key, because there is no neighbour for the
// 9:16 slack to land on — the twelve are still out at RADIAL 1.9 while the
// close-up is on. At CAM_LIFT the card centre sits at screen y 835 on every
// frame, so at k 3.55 the card runs screen 374 -> 1297 and at 3.69 341 -> 1299,
// both comfortably inside the 200-1450 caption band.
export const C_GRID = CENTER.y;

export const PUSH_F0 = 2;
export const PUSH_F1 = 40;
export const PULL_F0 = 48;
export const PULL_F1 = 74;
export const PULL_WARP = 0.55;

type Track = { F: number[]; K: number[]; CY: number[] };
const mergeTracks = (tracks: Track[]): Track => {
  const out: Track = { F: [], K: [], CY: [] };
  for (const t of tracks) {
    for (let i = 0; i < t.F.length; i++) {
      if (out.F.length > 0 && t.F[i] <= out.F[out.F.length - 1]) continue;
      out.F.push(t.F[i]);
      out.K.push(t.K[i]);
      out.CY.push(t.CY[i]);
    }
  }
  return out;
};

const CAM = mergeTracks([
  { F: [0], K: [K_OPEN], CY: [C_GRID + CAM_LIFT / K_OPEN] },
  camMove({ f0: PUSH_F0, f1: PUSH_F1, k0: K_OPEN, k1: K_PUSH, c0: C_GRID, c1: C_GRID, warp: 1 }),
  camMove({
    f0: PULL_F0,
    f1: PULL_F1,
    k0: K_PUSH,
    k1: K_WIDE,
    c0: C_GRID,
    c1: C_GRID,
    warp: PULL_WARP,
  }),
  { F: [DURATION], K: [K_WIDE], CY: [C_GRID + CAM_LIFT / K_WIDE] },
]);
export const CAM_F = CAM.F;
export const CAM_K = CAM.K;
export const CAM_CY = CAM.CY;

// fieldShared's `runCamera`, inlined only so the whole cut reads off one call
// (the shared one takes the track as three arrays; this is that call).
export const runCam = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

// ---------------------------------------------------------------------------
// THE TWO TRAVEL CURVES, shared by the twelve and by the thirteenth card.
// `flow` is BackIntoItV5's travel curve — eased in over the first `a`, out over
// the last `a`, one speed in between — and `overshoot` is its settle lobe, flat
// to second order at both ends so a landing adds no step in speed or in
// acceleration.
// ---------------------------------------------------------------------------
export const FLOW_A = 0.28;
export const flow = (u: number, a: number = FLOW_A) => {
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
const overshoot = (u: number) => {
  const w = clamp01(u);
  return 64 * w ** 3 * (1 - w) ** 3;
};

// ---------------------------------------------------------------------------
// THE TWELVE CLOSING IN. Every card is carried on its OWN radius out of the
// grid's centre — the slot it will occupy, scaled about (540, 803). At RADIAL
// 1.9 the nearest pair is +-540 world px off the centre column, which at the
// tightest close-up k is +-1992 screen px, and the nearest card in the tall
// direction clears the frame rectangle by 363 px; nothing is in frame but
// Equifax. From CLOSE_F0 to CLOSE_F1 the radius runs 1.9 -> 1.0 on ONE `flow`
// shared by all twelve: no per-card stagger is authored, the distances stagger
// the arrivals by themselves (a corner card covers 571 world px, a row-3
// neighbour 256). The settle is the same 8 px lobe the thirteenth card uses,
// applied along each card's own radius, so the whole wall tightens one lobe and
// relaxes together.
//
// Because the scale factor is common and >= 1 for the whole travel, every
// centre-to-centre distance in the grid is >= its resting value at all times,
// so no two cards can touch and none of them can cross Equifax, which is the
// fixed point of the map (its offset is zero). The scan proves it anyway.
// ---------------------------------------------------------------------------
export const CLOSE_R0 = 1.9;
export const CLOSE_F0 = 50;
export const CLOSE_F1 = 74;
export const CLOSE_SETTLE = 78;
export const CLOSE_SETTLE_PX = 8;

export const closeRadial = (frame: number) =>
  CLOSE_R0 + (1 - CLOSE_R0) * flow(clamp01((frame - CLOSE_F0) / (CLOSE_F1 - CLOSE_F0)));

// The slot's live position: radius, then the settle lobe carried 8 world px
// further along the same radius (i.e. inwards, the direction of travel).
export const slotPos = (x: number, y: number, frame: number) => {
  const dx = x - CENTER.x;
  const dy = y - CENTER.y;
  const d = Math.hypot(dx, dy);
  if (d === 0) return { x, y };
  const w = clamp01((frame - CLOSE_F1) / (CLOSE_SETTLE - CLOSE_F1));
  const s = closeRadial(frame) - (CLOSE_SETTLE_PX * overshoot(w)) / d;
  return { x: CENTER.x + dx * s, y: CENTER.y + dy * s };
};

export const ARRIVE_F0 = 68;
export const ARRIVE_F1 = 82; // lands on the end of "one"
export const ARRIVE_SETTLE = 86;
export const ARRIVE_CLEAR = 10; // world px of clearance below the frame at ARRIVE_F0
export const ARRIVE_SETTLE_PX = 8;

// Where it starts is READ OFF THE CAMERA rather than written down: the bottom
// of the frame at ARRIVE_F0, plus half the card, plus the clearance. So it is
// genuinely outside the frame on the frame it starts, and it stays outside it
// if the camera is ever re-keyed.
export const ARRIVE_Y0 = (() => {
  const c = runCam(ARRIVE_F0);
  return c.cy + 960 / c.k + CARD_HALF + ARRIVE_CLEAR;
})();

export const arriveY = (frame: number) => {
  const u = clamp01((frame - ARRIVE_F0) / (ARRIVE_F1 - ARRIVE_F0));
  const y = ARRIVE_Y0 + (ARRIVE_Y - ARRIVE_Y0) * flow(u);
  const w = clamp01((frame - ARRIVE_F1) / (ARRIVE_SETTLE - ARRIVE_F1));
  return y - ARRIVE_SETTLE_PX * overshoot(w);
};

// ---------------------------------------------------------------------------
// SCAN NOTE (out/ao-scan/scan.tsx, sampled at h = 1 and h = 1/4 — the two agree
// to within 1.8%, so nothing here is a hidden sub-frame step). REVISION 3, at
// K_OPEN 3.55 / K_PUSH 3.69 and RADIAL 1.9; the revision-2 number at 4.10/4.38
// is in brackets where it moved:
//   ANY of the twelve, any frame                   268.5 / 270.8 px/frame @f57  [327.0]
//   ANY of the twelve, while ON SCREEN             122.4 / 123.1 px/frame @f67  [140.0]
//   corner cards, while ON SCREEN                  122.4 / 123.1 px/frame @f67  [129.2]
//   REFERENCE: the same cards PARKED on the grid    83.0 /  83.3 px/frame @f63  [ 89.8]
//   a card PARKED in the row-5 slot (reference)     90.6 /  90.9 px/frame @f57  [112.7]
//   the arriving card, any frame                   154.8 / 155.1 px/frame @f57  [179.9]
//   the arriving card, while VISIBLE                88.9 /  90.5 px/frame @f71  [ 95.1]
//   largest frame-to-frame change in the camera's
//     screen rate (on a parked corner card)         93.1% / 93.1% @f49 / f48.25 [93.0%]
//
// The shorter zoom ratio (4.3x rather than 5.1x over the same f48-74 keys) is
// what moved all of these: nothing about the release or the close-in was
// retimed. The visible-card peak is now 122.4 px/frame — revision 2 aimed at
// ~120 and missed at 140.0 — against the 83.0 the same cards would do parked on
// the grid under this same camera. The close-in does NOT subtract from the
// zoom, it adds to it — both motions carry a card towards the centre of the
// frame — so a card still crosses the frame edge faster than a parked one. It
// is not an acceleration and not a discontinuity: each card's own speed decays
// monotonically from its off-screen peak, and its entry figure is simply the
// value it still has on the ONE frame its corner first touches the edge. The
// eleven that move enter at 122.4 (Sony, f67), 122.2 (Home Depot, f67), 119.3
// (AT&T, f56), 114.6 (Anthem, f63), 114.2 (T-Mobile, f63), 114.0 (Yahoo, f63),
// 113.6 (Ticketmaster, f63), 109.5 (Target, f67), 109.3 (OPM, f59), 81.1
// (Marriott, f63), 80.3 (Capital One, f63) px/frame — every one of the eleven
// now under 123, where revision 2 had two above 130 and revision 1 seven above
// 137. The 45 px/frame cap is not reachable by any release this line allows
// (deviation 2) and is reported, not met.
//
// The camera's OWN pinned point is stationary on screen by construction (cx and
// the content centre are both constant), so its speed is identically ~0 and
// says nothing; the scan therefore measures the camera on a PARKED corner card
// instead. The 93.1% at f49 is the authored inflection — the release leaving
// the held breath — and in absolute terms it is the Equifax card's own right
// edge going 0.25 -> 2.14 screen px/frame, then 5.7, 9.3, 12.7, 15.5, 17.6,
// 19.0: a curve, not a step. Nowhere else is there a change above 15% between
// adjacent frames.
//
// PHASE 1: no card but Equifax is on screen at any frame f0 - f50, and the
// wider opening did not change that. The smallest TRUE box-to-rectangle gap
// between any of the twelve and the frame is 363 px, the AT&T card at f10 (588
// px at the old, tighter k — the frame now sees 304 x 541 world px rather than
// 263 x 468, so the twelve are nearer the edge in screen px but nowhere near
// it). CLOSE_R0 stays at the directed 1.9. The first of the twelve to touch
// the frame is that same AT&T card at f56 ("you're"); they are all fully inside
// the FRAME from f71 and fully inside the 200-1450 / 60-1020 BAND from f76.
// From f76 the extremes over all thirteen are top 204.5, bottom 1624.1 (the
// arriving card, still in transit), left 164.5, right 916.4; at rest top 234.7
// / bottom 1435.3 / left 184.0 / right 896.0. The arriving card's box crosses
// screen y 1450 for f69-f80 (deviation 5).
//
// THE EQUIFAX CARD ITSELF, f0-f48 (the number this revision exists for): its
// screen box stays inside x 50.1 - 1010.0 and y 340.1 - 1304.0, sway included.
// Vertically that is 140 px inside the band at the top and 146 at the bottom;
// sideways the tightest margin to the 60 px guide is -9.9 px, on the left at
// f43, i.e. 50 px of clear kraft (deviation 10).
//
// OVERLAP: over every pair of the thirteen at every quarter-frame the smallest
// separation-minus-card is +16.0 world px at f76, the crest of the shared
// settle — and that is also the minimum over pairs with a card ON SCREEN, so
// the two are the same number (deviation 7). Unchanged by this revision, which
// touched only the camera. No card ever crosses, touches or passes over Equifax.
// ---------------------------------------------------------------------------

const NewsCard: React.FC<{
  file: string;
  x: number;
  y: number;
  k: number;
  size: number;
  radius: number;
  shadowY: number;
  shadowBlur: number;
  shadowOpacity: number;
}> = ({ file, x, y, k, size, radius, shadowY, shadowBlur, shadowOpacity }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: radius,
      overflow: "hidden",
      filter: `drop-shadow(0 ${(shadowY / k).toFixed(3)}px ${(shadowBlur / k).toFixed(
        3,
      )}px rgba(0,0,0,${shadowOpacity}))`,
    }}
  >
    <Img
      src={staticFile(`newscards/${file}`)}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
    />
  </div>
);

export const AnotherOne: React.FC<Props> = ({
  backgroundBase,
  parallax,
  cardSize,
  cardRadius,
  cardShadowY,
  cardShadowBlur,
  cardShadowOpacity,
  vignette,
}) => {
  const frame = useCurrentFrame();

  const cam = runCam(frame);
  const drift = sway(frame);
  const cx = CENTER.x + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const shadow = {
    shadowY: cardShadowY,
    shadowBlur: cardShadowBlur,
    shadowOpacity: cardShadowOpacity,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground frame={frame} cy={cy} cyRest={CAM_CY[0]} k={k} parallax={parallax} />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
        }}
      >
        {/* All thirteen are mounted from f0 — Remotion waits for every one of
            them before it captures a frame, so nothing can flash in. Twelve of
            them are simply far outside the close-up, on their own radius, and
            travel home from f50. */}
        {SLOTS.map((s) => {
          const p = slotPos(s.x, s.y, frame);
          return (
            <NewsCard
              key={s.file}
              file={s.file}
              x={p.x}
              y={p.y}
              k={k}
              size={cardSize}
              radius={cardRadius}
              {...shadow}
            />
          );
        })}
        <NewsCard
          key={ARRIVING_FILE}
          file={ARRIVING_FILE}
          x={ARRIVE_X}
          y={arriveY(frame)}
          k={k}
          size={cardSize}
          radius={cardRadius}
          {...shadow}
        />
      </div>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export const defaultProps: Props = schema.parse({
  backgroundBase: KRAFT_BASE,
  parallax: 0.15,
  cardSize: CARD,
  cardRadius: 4,
  cardShadowY: 4,
  cardShadowBlur: 8,
  cardShadowOpacity: 0.34,
  vignette: 0.55,
  beats: {
    especially: 0,
    ten: 14,
    fifteen: 28,
    years: 34,
    into: 39,
    this: 45,
    where: 50,
    like: 58,
    oh: 61,
    another: 69,
    one: 74,
    end: 83,
  },
});

export default AnotherOne;
