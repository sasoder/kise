import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  camMove,
  clamp,
  clamp01,
  hash,
  sway,
  worldTransform,
} from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

export const FPS = 24;
// Clip "joel - hyperscalers are deploying a crap ton of solar". The composition
// starts at SRT 21.260 s; the passage runs 4.040 s.
// round(4.040 * 24) = 97 frames of speech, plus a 28 frame tail so the crown
// lands, the lattice closes and the feed down the centre column gets the tower
// running again = 125.
export const DURATION = 125;

// ---------------------------------------------------------------------------
// "COULD BE ON THE GRID". The sibling of `SolarFoundation` and `PeakForSolar`:
// same paper, same chain, same type, same hard shadow, same camera. The panels
// and the slab-with-an-LED-hole are `SolarFoundation`'s own primitives, reused
// at this cut's sizes, because it is the same episode and the same world.
//
// THE LINE: "Does it need to be right next to your data center? — No. Like, it
// could be on the grid."
//   does f0 - it f9 - need f12 - to f15 - be f18 - RIGHT f22 - NEXT f26 -
//   to f32 - your f35 - DATA f36 - CENTER f40 (ends f53) - NO f53 - like f64 -
//   it f71 - could f82 - be f84 - ON f87 - the f90 - GRID f92 (ends f97)
//
// THE PICTURE. Two nouns and one wire, and the wire becomes the grid.
//   V2, on the director's review: the rest is 18% bigger (k 1.05, not 0.89),
//   the wide shot carries 9-13 moving squares instead of two, the snug is a
//   DOCK with no wire at all, the crown steps come down to 14 px so it is not
//   jammed under row 998, and the cut runs 12 frames longer so the feed down
//   the centre column gets the tower running again before the end.
//
//   SOLAR        two 184 x 88 panels (a 4 x 2 array of 40 x 40 cells with 8 px
//                gaps, paper showing through) 12 px apart -> 184 x 188, with
//                "SOLAR" 900/44 centred 20 px above it. The tag rides with the
//                glyph everywhere it goes.
//   DATA CENTER  four 240 x 48 slabs with 8 px gaps -> 240 x 216, each with an
//                18 x 18 LED hole, right edge 20 px in, the hole carried
//                UNOFFSET in the shadow layer so an unlit LED is clean paper.
//                "DATA CENTER" 900/44 centred 24 px below. It never moves.
//   THE GRID     5 columns x 5 rows on a square pitch of 172.
//
// COLOUR JOBS, consistent with `SolarFoundation`. White #FFFFFF is solar, the
// wire, the packets and the grid. The CORE MEMORY chain — orange #FFB765,
// purple #BC37FF, blue #0046FF, raw hex, no glow, no blend, nothing ever fades
// — belongs to the DATA CENTER and to nothing else: its four LEDs, and as this
// cut's one payoff its crown. There is no chain colour on the solar, on the
// wire, on a packet or on a lattice line at any frame.
//
// THE MATERIAL IS PAPER, copied from `SolarFoundation` down to the number:
// `public/paper-supaclean-still.png`, 3864 x 2164 landscape, rotated 90 deg on
// its own plane at parallax 0.15 in both axes with the same -0.3 px/frame drift
// and the same 1 + (k - 1) * 0.3 scale, `brightness(0.88) blur(3px)` on the
// image and nothing else, over a #C0C0C0 root. A local BG_OVERSIZE of 1.6:
// `objectFit: cover` solves 3864 x 2164 into 3072 x 1728 at 0.7985 of source,
// and at this cut's tightest camera (k 1.35) that is 0.8824 — never upscaled.
//
// THE GEOMETRY, world px. Barlow's cap height is 0.700 em, the number measured
// off the shipped webfont in `PeakForSolar`.
//   COLUMNS  x 196, 368, 540, 712, 884        (pitch 172)
//   ROWS     y0, y0+172, y0+344, y0+516, y0+688
//   The tower is centred on the bottom-row centre node (540, y0+688); SOLAR's
//   rest is centred on the top-row centre node (540, y0).
//   Solving the block: "SOLAR" ink top = y0 - 94 - 20 - 0.700*44 = y0 - 144.80;
//   "DATA CENTER" ink bottom = y0 + 688 + 108 + 24 + 0.700*44 = y0 + 850.80;
//   centre = y0 + 353.00 = 835.000  ->  Y0 = 482.00.
//   ROWS      482, 654, 826, 998, 1170
//   SOLAR rest box   x 448..632, y 388..576;   tag ink 337.20..368.00
//   TOWER box        x 420..660, y 1062..1278; tag ink 1302.00..1332.80
//   BLOCK 337.20..1332.80, centre 835.000 exactly.
//   SLAB LED  18 x 18 at x 622..640, 15 px down inside its slab
//   CROWN     orange +54 / purple +36 / blue +18 above the tower top 1062, so
//             the rest crown is three 18 px bands, 1008..1062
//   NODES     18 x 18 white squares on the intersections
//   WIRE      from the tower's left edge -12 (408, 1170) outward along the
//             bottom row, up the left column, along the top row; total 1244.
//             The glyph's own path fillets both corners at r 40; the WIRE keeps
//             square corners.
//
// THE GESTURES — one continuous motion. Gestures lead, words land on them.
//   f0-22   OPEN, ALREADY ALIVE. Tight two-shot at k 1.30 on the pair. SOLAR
//           sits on the bottom row at x 196 (gap to the tower 132), the wire is
//           the bottom-row segment between them, packets run it at 22 px/frame
//           and the LEDs toggle on their arrivals. Two LEDs are lit at f0 and a
//           packet is 62 px along a 106 px wire.      — "does it need to be"
//   f16-30  THE DOCK. SOLAR slides right to x 316 on Easing.inOut(cubic),
//           landing f30 with its box 12 px off the tower's. The wire is trimmed
//           12 px at each end, so it shortens to nothing as the gap closes and
//           from f26 there is no wire at all — the feed is DIRECT, and an LED
//           toggles on every emission frame (f29 35 41 47, every 6). The camera
//           creeps 1.30 -> 1.34 and recentres on the docked pair (cx 458).
//                                          — "RIGHT NEXT to your data center"
//   f47-86  THE DEPARTURE, the big move: ONE eased journey along the arc length
//           of the route — bottom row left to x 196, up the left column, right
//           along the top row to x 540 — 1152 px of arc, corners passed at
//           speed on a 40 px fillet. It starts at f47 so the glyph is clearly
//           leaving on "NO" f53 (55 px gone by then). The wire PAYS OUT from
//           the tower's edge as the gap opens: solar never disconnects. Packets
//           keep being emitted every 6 frames and the source outruns them, so
//           arrivals thin and the LEDs visibly slow. — "NO" / "like"
//   f60-107 THE GRID IS DRAWN BY THE TRIP. No timers: as SOLAR's centre passes
//           a lattice node a front leaves that node at 60 px/frame.
//             rows 998 / 826 / 654 shoot RIGHT from x 196 at f60.9 / 64.5 /
//             67.5 as the glyph climbs past them, reaching x 884 at f72.3 /
//             76.0 / 79.0;
//             column 368 drops at f75.3 as the glyph crosses it on the top row
//             and meets the bottom row — a SECOND PATH to the tower — at f86.8;
//             on parking at f86 the centre column drops and the top row runs on
//             to 884; the top row reaches 712 at f88.9 and 884 at f91.7 and
//             each drops as it is reached; column 884 meets the bottom row at
//             f103.2, turns LEFT and closes the lattice on the tower's right
//             edge +12 at f106.7.
//           A node square appears the frame both of its lines cover it.
//           THE LADDER SWITCHES ONCE, on the mechanism: the route is the only
//           path and therefore 1.0 until the centre column connects (f95), and
//           from that frame every line is the same lattice at 0.78. Packets are
//           1.0, ambient traffic 0.55. Three rungs, no fades.
//                                             — "it COULD be ON the GRID" f92
//   f95-125 THE CROWN, the cut's single chain moment, triggered by the centre
//           column's front reaching the tower at f94.77: orange f95 (it clears
//           the tower's top edge on f96), purple f97, blue f99, each rising
//           42 px over 22 frames on Easing.bezier(0.16, 1, 0.3, 1), clipped to
//           the tower's top edge so colour is only ever ABOVE the white and
//           never shows through a slab gap or an LED hole. The steps are 14 px,
//           so the crown's rest top is 1020 and it stands 15 px clear of row
//           998's own shadow with the centre column's end between them.
//   f109-125 THE FEED IS BACK. The centre column is 420 px and a packet runs it
//           in 13.1 frames, so from the first emission after the column
//           connects the tower is fed every 6 frames again: arrivals f109 (two
//           at once — one down the column, one finishing the long way round),
//           115, 119, 125.                                    — the tail
//   ALWAYS  packets on the wire; LEDs on arrivals; one ambient 12 x 12 square
//           launched every 4 frames from f65 (two lattice lines exist by then),
//           always from a node a front has already reached and along a run of
//           two or three whole segments that exist; the camera creeping or
//           gliding on every frame.
//
// THE CAMERA — its own keyed track through `camMove`, damped by the house
// tracker (`runCamera2`, CAM_STIFF / CAM_DAMP), three long glides, never
// chasing the glyph.
//   SNUG  f4-30   k 1.30 -> 1.32, cx 400 -> 458, centre held on C_OPEN 1179.0.
//                 It starts twelve frames before SOLAR does: the camera leads.
//   CREEP f30-48  k 1.32 -> 1.35, cx 458 -> 462 (the camera is never parked)
//   PULL  f48-88  k 1.35 -> 1.05, cx 462 -> 540, centre 1179.0 -> 835.0.
//                 One glide that pulls back and rises with the trip. k is
//                 front-loaded (warp 0.7) and cx is BACK-loaded (warp 1.9), so
//                 the zoom opens early while the frame stays left through the
//                 climb: SOLAR and its tag never come near the edge.
//   TAIL  f92-125 k 1.05 -> 1.065, centre held
//
// MEASURED, every frame 0..124, with the damper, the sway and the drift in.
//   THE GLYPH. Max step 58.32 world px between f66 and f67 — the cap is 60.
//   1152 px of arc over 39 frames. One acceleration lobe, one deceleration.
//
//   THE NODES, the frame each square appears (both of its lines cover it):
//     y 482    196:74  368:80  540:87  712:89  884:92
//     y 654    196:70  368:79  540:89  712:92  884:95
//     y 826    196:67  368:82  540:92  712:95  884:98
//     y 998    196:64  368:84  540:95  712:98  884:101
//     y 1170   196:60  368:87  540:--  712:107 884:104
//   (540, 1170) is inside the tower and is knocked out with it; the lattice's
//   last node lands on f107, its last line on f106.7.
//
//   THE PACKET ARRIVALS, which is the LED cadence. Emissions are every 6 frames
//   on fe = 5 (mod 6); packets run 32 world px/frame, 43.06 screen px at the
//   opening k (cap 45).
//     f3 9 15 21 25 29 35 41 47 55 66 80 96 109 109 115 119 125
//     gaps 6 6 6 4 4 6 6 6 8 11 14 16 13 0 6 4 6
//   Six on the beat down the opening wire, six on the beat while DOCKED (the
//   feed is direct, so a packet's distance is zero and it arrives on its own
//   emission frame), then the trip stretches them to 8, 11, 14, 16, and the
//   centre column brings them back to 6, 4, 6 before the end. Two arrive
//   together on f109 — one down the new column, one finishing the long way
//   round. The LEDs are never all dark (minimum one lit) and two are lit at f0.
//
//   SQUARES IN MOTION on the lattice, f90..125: min 9, mean 10.97
//     f90 10 · f95 11 · f100 11 · f105 13 · f110 10 · f115 10 · f120 11
//   Frames with nothing moving on the wire: 3-4, 9-10, 15-16, 21-22 (the
//   two-frame beat between packets on a 106 px wire) and 25-52 and 55-58. The
//   long one is the DOCK, where by construction there is no wire to travel: its
//   motion is the LED toggling every six frames on f29 35 41 47 and the camera
//   creeping 1.318 -> 1.345 under "your data center".
//
//   THE CAMERA, what `runCamera2` actually produces:
//     f     k       cx       cy        centre     vk         vcy
//     0     1.3000  400.00   1275.15   1179.00     0.00000     0.000
//     16    1.3047  413.75   1274.80   1179.00     0.00087    -0.064
//     30    1.3180  452.34   1273.84   1179.00     0.00061    -0.044   docked
//     40    1.3285  459.08   1273.09   1179.00     0.00188    -0.133
//     48    1.3446  461.30   1271.96   1179.00     0.00161    -0.112
//     53    1.3361  461.88   1257.74   1164.18    -0.00452    -5.401   "NO"
//     62    1.2553  463.55   1170.09   1070.51    -0.01076   -11.494
//     71    1.1617  474.32   1070.72    963.12    -0.00961   -10.133   the climb
//     86    1.0628  524.64    967.30    849.69    -0.00348    -3.610   park
//     92    1.0518  537.42    955.93    837.09    -0.00086    -0.889   "GRID"
//     95    1.0505  539.26    954.52    835.53    -0.00026    -0.316   the crown
//     104   1.0523  540.03    953.75    834.96     0.00045    -0.046
//     124   1.0637  540.00    952.51    835.00     0.00036    -0.040
//   max |dv| per frame: k 0.00146, cy 1.345, cx 0.467. Two sign changes on k
//   over the whole cut — one per move boundary — and at f95 the camera is
//   moving 0.32 world px, so the crown erupts in a still frame.
//
//   THE ASSERTIONS:
//     * SOLAR + ITS TAG are fully in frame on every frame of the departure:
//       worst margin 70.2 screen px at f57 (gate 60), on the left edge as the
//       glyph reaches the bottom-left corner ahead of the pull. The back-loaded
//       cx is what buys it: with cx on the zoom's own curve it fell to 51.
//     * SIDE PADDING AT REST, measured on the rendered pixels rather than the
//       model: 167 px left, 159 px right at f124 (gate 97). Worst over the whole
//       cut 68.8 px at f73, on a row front running for the frame edge.
//     * THE LOWEST INK on screen: 1366 px at f124, measured on the pixels
//       (gate 1400 — the captions live below that line). The highest is 303.
//     * THE PAPER: max 0.8813 of source at the opening k, never upscaled, and
//       its margins never fall below 315.5 px sideways or 576.3 px vertically.
//     * CHAIN COLOUR INSIDE THE TOWER BODY, counted on the rendered frames with
//       the LED holes excluded: 0 pixels. The crown is only ever a band above
//       the white.
//     * THE CROWN STACK: row 998's stroke ends at 1001 and its shadow at 1005;
//       the centre column's white ends on 1008 and its shadow on 1012; the
//       orange band's rest top is 1020. 15 px of paper between the row's shadow
//       and the orange, 8 px between the column's shadow and the orange.
//     * COLUMN 368's DROP: white x 365..371, shadow to 375. The tower's box
//       starts at 420 — 45 px of paper — and the column's lowest ink is y 1177
//       against the "DATA CENTER" ink top at 1302, so it clears the tag by
//       125 px vertically (and by 19 px horizontally: the tag's measured left
//       ink edge is x 394).

// DEVIATIONS from the brief, and why.
//   * THE DEPARTURE'S EASE IS Easing.inOut(Easing.quad), NOT inOut(cubic), AND
//     IT STARTS AT f47, NOT f50. The route is 1152 px of arc; inOut cubic peaks
//     at 3x the mean, which is an 88 px step in a single frame — well over the
//     brief's own 60 px/frame cap, and it strobes. inOut quad peaks at 2x, and
//     at 38 frames that still measured 60.5; 39 frames lands it at 58.32. It
//     still accelerates exactly once and decelerates exactly once, and it still
//     parks on f86, so the crown still fires on f95. The cap won.
//   * THE CROWN IS TRIGGERED BY THE CENTRE COLUMN'S FRONT REACHING THE TOWER,
//     not by the first packet down that column. The column is 514 px from the
//     solar node to the tower's entry and a packet runs at 22 px/frame, so the
//     earliest packet that can be emitted onto it (f102, the first emission
//     after it connects at f94.57) arrives at f120.5 — eight frames past the
//     end of the cut. No column-front speed fixes that: even an instant column
//     leaves the first packet arriving at f104.6 at best, and the brief's own
//     window is f94-98. So the trigger is the grid itself arriving at the data
//     center, which is the same argument one step earlier, and it lands at f95.
//   * THE CENTRE COLUMN STOPS AT y 996, 12 px above the crown's rest top 1008,
//     exactly as instructed — which at Y0 = 482 is 2 px above row 998's centre
//     line, so the column terminates inside that row's own 6 px stroke. The
//     grid therefore reaches the tower's level and the crown erupts into the
//     7 px of paper below it. Nothing ever retracts.
//   * THE CAMERA HAS FOUR MOVES, NOT THREE, AND THE FIRST STARTS ON f4. The
//     brief's table leaves f0-16 and f30-48 with no key at all — 34 of the
//     cut's 113 frames on a parked camera, two of them under "your data
//     center". Splitting the creep in two (1.30 -> 1.32 over f4-30, then
//     1.32 -> 1.35 over f30-48) keeps the zoom moving on every frame, lets the
//     camera lead the glyph into the snug by twelve frames, and still lands
//     1.35 before the pull.
//   * THE AMBIENT TRAFFIC RUNS TWO OR THREE WHOLE SEGMENTS, not one. One
//     launch every 4 frames over a single 172 px segment at 16 px/frame is 10.7
//     frames of life and 2.7 squares in the air — nowhere near the 8-12 the
//     brief asks for. A run of two or three segments (344 or 516 px, 21.5 or
//     32.3 frames) puts 6-9 ambient squares up beside 4-5 packets. The launch
//     rate, the size, the speed, the ladder and the "only on lines that exist,
//     from a node a front has reached" rule are all as briefed.
//   * THE AMBIENT SQUARES KEEP THE +4/+4 SHADOW. At 12 x 12 they read as white
//     with a small dark corner rather than as dark specks (checked on the 2x
//     lattice crop at f112), so the piece keeps ONE shadow offset throughout.
//   * THE PULL'S KEYS END AT f88 AND THE TAIL STARTS AT f92, not f90/f90. The
//     damper needs the gap to settle, so the crown at f95 lands in a still
//     frame.
//   * ONE PACKET IS IN FLIGHT AT f0, NOT SEVERAL. The opening wire is 106 px
//     and a packet crosses it in 4.8 frames against an 8 frame emission
//     period, so the wire can only ever hold one. The emission phase is set to
//     fe = 6 (mod 8) so that the one at f0 is 62 px along it rather than
//     sitting on the emitter.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";

// This cut's own background oversize — see the header.
const BG_OVERSIZE_CBG = 1.6;

export const schema = z.object({
  paperSrc: z.string(),
  parallax: z.number(),
  paperDim: z.number(),
  paperBlur: z.number(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  // the hard shadow, in WORLD px, so it rides everything at every zoom
  shadowOffset: z.number(),
  solarLabel: z.string(),
  towerLabel: z.string(),
  beats: z.object({
    open: z.number(), // "does it need to be"  — the two-shot, already alive
    snug: z.number(), // "RIGHT NEXT"          — SOLAR slides in
    depart: z.number(), // "NO"                — the departure leaves
    grid: z.number(), // "GRID"                — the fronts are flying
    end: z.number(), // speech ends; tail to 113
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE GEOMETRY. Every number is resolved from the lattice pitch, the two
// glyphs' modules and Barlow's real cap height, so the block really is centred
// on the caption-safe line.
// ---------------------------------------------------------------------------
export const CONTENT_C = 835; // the content centre, on screen y 835 at every k
export const CENTRE_X = FRAME_W / 2; // 540
const CAP = 0.7; // Barlow's cap height per em, measured on the shipped webfont

export const STROKE = 6; // one stroke weight for every line in the cut

// -- SOLAR, from SolarFoundation's panel module ------------------------------
export const CELL = 40;
export const CELL_GAP = 8;
export const CELL_PITCH = CELL + CELL_GAP; // 48
export const PANEL_COLS = 4;
export const PANEL_ROWS = 2;
export const PANEL_W = PANEL_COLS * CELL + (PANEL_COLS - 1) * CELL_GAP; // 184
export const PANEL_H = PANEL_ROWS * CELL + (PANEL_ROWS - 1) * CELL_GAP; // 88
export const PANEL_GAP = 12;
export const SOLAR_W = PANEL_W; // 184
export const SOLAR_H = 2 * PANEL_H + PANEL_GAP; // 188
export const SOLAR_HX = SOLAR_W / 2; // 92
export const SOLAR_HY = SOLAR_H / 2; // 94

// -- DATA CENTER, from SolarFoundation's slab module -------------------------
export const SLAB_W = 240;
export const SLAB_H = 48;
export const SLAB_GAP = 8;
export const SLAB_N = 4;
export const SLAB_PITCH = SLAB_H + SLAB_GAP; // 56
export const TOWER_W = SLAB_W; // 240
export const TOWER_H = SLAB_N * SLAB_H + (SLAB_N - 1) * SLAB_GAP; // 216
export const TOWER_HX = TOWER_W / 2; // 120
export const TOWER_HY = TOWER_H / 2; // 108
export const LED = 18;
export const LED_INSET = 20; // from the slab's right end to the hole's right edge
export const LED_DY = (SLAB_H - LED) / 2; // 15

// -- type --------------------------------------------------------------------
export const TAG_SIZE = 44;
export const TAG_TRACK = 0.06; // em
export const TAG_INK = CAP * TAG_SIZE; // 30.8
export const SOLAR_TAG_GAP = 20; // ink bottom above the glyph's box top
export const TOWER_TAG_GAP = 24; // ink top below the tower's box bottom

// -- the lattice -------------------------------------------------------------
export const PITCH = 172;
export const COLS = [196, 368, 540, 712, 884];
export const NODE = 18;

// Y0 solves "block centre = 835": the block runs from "SOLAR"'s ink top at
// Y0 - SOLAR_HY - SOLAR_TAG_GAP - TAG_INK to "DATA CENTER"'s ink bottom at
// Y0 + 4*PITCH + TOWER_HY + TOWER_TAG_GAP + TAG_INK.
const BLOCK_UP = SOLAR_HY + SOLAR_TAG_GAP + TAG_INK; // 144.80
const BLOCK_DOWN = 4 * PITCH + TOWER_HY + TOWER_TAG_GAP + TAG_INK; // 850.80
export const Y0 = CONTENT_C - (BLOCK_DOWN - BLOCK_UP) / 2; // 482.00
export const ROWS = [Y0, Y0 + PITCH, Y0 + 2 * PITCH, Y0 + 3 * PITCH, Y0 + 4 * PITCH];
export const ROW_BOTTOM = ROWS[4]; // 1170
export const BLOCK_TOP = Y0 - BLOCK_UP; // 337.20
export const BLOCK_BOTTOM = Y0 + BLOCK_DOWN; // 1332.80

// -- the tower, fixed ---------------------------------------------------------
export const TOWER_CX = CENTRE_X;
export const TOWER_CY = ROW_BOTTOM;
export const TOWER_L = TOWER_CX - TOWER_HX; // 420
export const TOWER_R = TOWER_CX + TOWER_HX; // 660
export const TOWER_TOP = TOWER_CY - TOWER_HY; // 1062
export const TOWER_BOTTOM = TOWER_CY + TOWER_HY; // 1278
export const LED_X = TOWER_L + SLAB_W - LED_INSET - LED; // 622
export const TOWER_TAG_BASELINE = TOWER_BOTTOM + TOWER_TAG_GAP + TAG_INK; // 1332.80

// -- the crown ----------------------------------------------------------------
export const CROWN_STEP = 14;
export const CROWN_OFFSETS = { blue: CROWN_STEP, purple: 2 * CROWN_STEP, orange: 3 * CROWN_STEP };
export const CROWN = CROWN_OFFSETS.orange; // 54
export const CROWN_REST_TOP = TOWER_TOP - CROWN; // 1008
export const CROWN_TRAVEL = 22;
export const CHAIN_STAGGER = 2;

// -- clearances ---------------------------------------------------------------
export const TRIM = 12; // a line stops 12 px short of a glyph's box

// -- the route ----------------------------------------------------------------
// Measured from the TOWER outward, so a packet's distance-to-the-tower is its
// own number and the wire can pay out behind the glyph without moving it.
export type Pt = { x: number; y: number };
export const WIRE: Pt[] = [
  { x: TOWER_L - TRIM, y: ROW_BOTTOM }, // 408, 1170
  { x: COLS[0], y: ROW_BOTTOM }, // 196, 1170
  { x: COLS[0], y: Y0 }, // 196, 482
  { x: CENTRE_X, y: Y0 }, // 540, 482
];

const cum = (poly: Pt[]) => {
  const out = [0];
  for (let i = 1; i < poly.length; i++) {
    out.push(out[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y));
  }
  return out;
};
export const polyLen = (poly: Pt[]) => cum(poly)[poly.length - 1];
export const polyAt = (poly: Pt[], s: number): Pt => {
  const c = cum(poly);
  const total = c[poly.length - 1];
  const d = Math.max(0, Math.min(total, s));
  for (let i = 1; i < poly.length; i++) {
    if (d <= c[i]) {
      const t = c[i] === c[i - 1] ? 0 : (d - c[i - 1]) / (c[i] - c[i - 1]);
      return {
        x: poly[i - 1].x + (poly[i].x - poly[i - 1].x) * t,
        y: poly[i - 1].y + (poly[i].y - poly[i - 1].y) * t,
      };
    }
  }
  return poly[poly.length - 1];
};

export const WIRE_LEN = polyLen(WIRE); // 1244
export const S_CORNER_1 = 212; // (196, 1170)
export const S_CORNER_2 = 900; // (196, 482)
export const FILLET_R = 40;

// The glyph's own path: the same arc length, with both corners passed at speed
// on a 40 px fillet. The WIRE keeps its square corners.
export const glyphAt = (s: number): Pt => {
  for (const sc of [S_CORNER_1, S_CORNER_2]) {
    if (Math.abs(s - sc) < FILLET_R) {
      const t = (s - sc + FILLET_R) / (2 * FILLET_R);
      const a = polyAt(WIRE, sc - FILLET_R);
      const b = polyAt(WIRE, sc);
      const c = polyAt(WIRE, sc + FILLET_R);
      const m = 1 - t;
      return {
        x: m * m * a.x + 2 * m * t * b.x + t * t * c.x,
        y: m * m * a.y + 2 * m * t * b.y + t * t * c.y,
      };
    }
  }
  return polyAt(WIRE, s);
};

// -- the trip -----------------------------------------------------------------
export const SNUG_F0 = 16;
export const SNUG_F1 = 30;
export const SNUG_X0 = COLS[0]; // 196, on the bottom-row left node
// DOCKED: SOLAR slides until its box is TRIM from the tower's box, so the wire
// (trimmed TRIM at each end) shortens to nothing and is simply not drawn.
export const SNUG_X1 = TOWER_L - TRIM - SOLAR_HX; // 316, gap to the tower 12 px
// See DEVIATIONS: the arc is 1152 px now that the dock is 24 px closer, and at
// 38 frames a single step measures 60.5 px, over the 60 px/frame cap. 39 lands
// it at 58.28.
export const DEP_F0 = 47;
export const DEP_F1 = 86;
export const S_OPEN = TOWER_L - TRIM - SNUG_X0; // 212
export const S_SNUG = TOWER_L - TRIM - SNUG_X1; // 116
const EASE_SNUG = Easing.inOut(Easing.cubic);
// See DEVIATIONS: inOut(cubic) peaks at 86.2 px/frame here, over the cap.
const EASE_DEP = Easing.inOut(Easing.quad);
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

export const solarS = (f: number) => {
  if (f <= SNUG_F1) {
    const cx = SNUG_X0 + (SNUG_X1 - SNUG_X0) * EASE_SNUG(clamp01((f - SNUG_F0) / (SNUG_F1 - SNUG_F0)));
    return TOWER_L - TRIM - cx;
  }
  return S_SNUG + (WIRE_LEN - S_SNUG) * EASE_DEP(clamp01((f - DEP_F0) / (DEP_F1 - DEP_F0)));
};
export const solarPos = (f: number) => glyphAt(solarS(f));
// Half the glyph's extent along the path, plus the 12 px clearance.
export const WIRE_TRIM = SOLAR_HY + TRIM; // 106
export const wireS = (f: number) => Math.max(0, solarS(f) - WIRE_TRIM);

// -- the fronts, 60 world px per frame ---------------------------------------
export const FRONT_V = 60;
// The frame the glyph's centre passes a given arc length.
const passedAt = (s: number) => {
  const e = (s - S_SNUG) / (WIRE_LEN - S_SNUG);
  // invert Easing.inOut(Easing.quad)
  const u = e < 0.5 ? Math.sqrt(e / 2) : 1 - Math.sqrt((1 - e) / 2);
  return DEP_F0 + u * (DEP_F1 - DEP_F0);
};
// The three rows the glyph climbs past, INDEXED BY ROW INDEX: rows 1, 2 and 3
// each get the frame the glyph's centre passes their node on the left column.
// Rows 0 and 4 are drawn by the trip itself and the closing front, so they
// carry no entry here.
export const ROW_FRONT_AT = ROWS.map((y, r) =>
  r >= 1 && r <= 3 ? passedAt(S_CORNER_1 + (ROW_BOTTOM - y)) : Number.NaN,
);
export const COL368_AT = passedAt(S_CORNER_2 + (COLS[1] - COLS[0]));
export const PARK_AT = DEP_F1; // 86
// The centre column's front leaves the node it parks on and stops 12 px above
// the crown's REST top, so nothing ever retracts.
export const COL_C_END = CROWN_REST_TOP - TRIM; // 1008
export const COL_C_CONNECT = PARK_AT + (COL_C_END - Y0) / FRONT_V; // 94.567
// The top row runs on from the node it parks on.
export const TOPROW_AT = PARK_AT;
export const COL712_AT = TOPROW_AT + (COLS[3] - CENTRE_X) / FRONT_V; // 88.867
export const COL884_AT = TOPROW_AT + (COLS[4] - CENTRE_X) / FRONT_V; // 91.733
export const COL368_BOTTOM_AT = COL368_AT + (ROW_BOTTOM - Y0) / FRONT_V; // 87.53
export const COL884_BOTTOM_AT = COL884_AT + (ROW_BOTTOM - Y0) / FRONT_V; // 103.20
export const CLOSE_AT = COL884_BOTTOM_AT + (COLS[4] - (TOWER_R + TRIM)) / FRONT_V; // 106.73
export const CONNECT_F = Math.ceil(COL_C_CONNECT); // 95 — the ladder's one switch

// -- the packets --------------------------------------------------------------
export const PACKET = 16;
export const PACKET_V = 32; // world px per frame — 43.2 screen px at the opening k
export const EMIT_EVERY = 6;
// fe = 5 (mod 6): f0 carries a packet 74 px along a 106 px wire, and the first
// emission after the centre column connects (f94.77) is f95.
export const EMIT_PHASE = -1;

// The monotone lattice routes from the tower up to the solar's rest, and the
// frame each one becomes available. Every one is written from the TOWER
// outward, so a packet's distance is always its distance to the tower.
const solarExit = {
  down: { x: CENTRE_X, y: Y0 + SOLAR_HY + TRIM }, // 588
  left: { x: CENTRE_X - SOLAR_HX - TRIM, y: Y0 }, // 436
  right: { x: CENTRE_X + SOLAR_HX + TRIM, y: Y0 }, // 644
};
export const ROUTES: { poly: Pt[]; from: number }[] = [
  {
    poly: [
      { x: TOWER_L - TRIM, y: ROW_BOTTOM },
      { x: COLS[0], y: ROW_BOTTOM },
      { x: COLS[0], y: Y0 },
      solarExit.left,
    ],
    from: PARK_AT,
  },
  {
    poly: [
      { x: TOWER_L - TRIM, y: ROW_BOTTOM },
      { x: COLS[1], y: ROW_BOTTOM },
      { x: COLS[1], y: Y0 },
      solarExit.left,
    ],
    from: COL368_BOTTOM_AT,
  },
  { poly: [{ x: CENTRE_X, y: COL_C_END }, solarExit.down], from: COL_C_CONNECT },
  {
    poly: [
      { x: TOWER_R + TRIM, y: ROW_BOTTOM },
      { x: COLS[3], y: ROW_BOTTOM },
      { x: COLS[3], y: Y0 },
      solarExit.right,
    ],
    from: CLOSE_AT,
  },
  {
    poly: [
      { x: TOWER_R + TRIM, y: ROW_BOTTOM },
      { x: COLS[4], y: ROW_BOTTOM },
      { x: COLS[4], y: Y0 },
      solarExit.right,
    ],
    from: CLOSE_AT,
  },
];
// The frame a SECOND path exists and routing therefore begins.
export const ROUTING_F = Math.ceil(COL368_BOTTOM_AT); // 88

export type Packet = { i: number; emit: number; poly: Pt[] | null; d0: number; arrive: number };

export const PACKETS: Packet[] = (() => {
  const out: Packet[] = [];
  let i = 0;
  for (let fe = EMIT_PHASE; fe <= DURATION; fe += EMIT_EVERY, i++) {
    if (fe < ROUTING_F) {
      // The wire is the only path: the packet is put on it at the solar's end
      // and keeps its own distance to the tower while the wire pays out.
      const d0 = wireS(fe);
      out.push({ i, emit: fe, poly: null, d0, arrive: Math.ceil(fe + d0 / PACKET_V) });
    } else {
      // Shortest first, and the hash is squared so the pick leans on the short
      // routes: once the grid is there the feed takes the grid, and the long
      // way round is the exception rather than a coin toss.
      const open = ROUTES.filter((r) => fe >= r.from).sort(
        (a, b) => polyLen(a.poly) - polyLen(b.poly),
      );
      const u = hash(i, 13);
      const pick = open[Math.min(open.length - 1, Math.floor(u * u * open.length))];
      const d0 = polyLen(pick.poly);
      out.push({ i, emit: fe, poly: pick.poly, d0, arrive: Math.ceil(fe + d0 / PACKET_V) });
    }
  }
  return out;
})();

// THE LEDS ARE DRIVEN BY ARRIVALS, not by a timer. Each packet that reaches the
// tower toggles the next LED in the sequence 0, 1, 2, 3, 0... — hard on, hard
// off. When arrivals thin out the tower visibly slows.
export const ARRIVALS = PACKETS.map((p) => p.arrive)
  .filter((f) => f <= DURATION)
  .sort((a, b) => a - b);
export const LED_COLOURS = ["orange", "purple", "blue", "orange"] as const;
export const LED_STATE_AT = (() => {
  const out: boolean[][] = [];
  const state = [true, false, true, false]; // f0 carries two lit LEDs
  let next = 0;
  let cursor = 0;
  for (let f = 0; f <= DURATION; f++) {
    while (cursor < ARRIVALS.length && ARRIVALS[cursor] === f) {
      state[next % SLAB_N] = !state[next % SLAB_N];
      next++;
      cursor++;
    }
    out.push([...state]);
  }
  return out;
})();

// -- the camera ---------------------------------------------------------------
// What the camera frames while the pair is all there is: "SOLAR"'s ink top over
// the glyph on the bottom row, down to "DATA CENTER"'s ink bottom.
export const C_OPEN = (ROW_BOTTOM - BLOCK_UP + TOWER_TAG_BASELINE) / 2; // 1179.00
export const K_OPEN = 1.3;
export const K_SNUG = 1.32;
export const K_TIGHT = 1.35;
export const K_REST = 1.05;
export const K_TAIL = 1.065;
export const X_OPEN = 400;
export const X_SNUG = 458; // the DOCKED pair: 224..692, centre 458
export const X_TIGHT = 462;
export const X_REST = CENTRE_X;
export const SNUG_WARP = 1.0;
export const CREEP_F0 = 30;
export const CREEP_F1 = 48;
export const CREEP_WARP = 1.0;
export const PULL_F0 = 48;
export const PULL_F1 = 88;
export const PULL_WARP = 0.7;
// cx is warped the other way from k: the zoom leads, the pan LAGS, so the frame
// stays left through the climb and SOLAR never comes near the edge.
export const PULL_X_WARP = 1.9;
export const TAIL_F0 = 92;
export const TAIL_F1 = DURATION;
export const TAIL_WARP = 1.0;

// The camera LEADS the glyph: it starts easing right and in at f4, twelve
// frames before SOLAR itself moves, so no frame of the cut is parked.
export const CAM_SNUG_F0 = 4;

const SNUG = camMove({
  f0: CAM_SNUG_F0,
  f1: SNUG_F1,
  k0: K_OPEN,
  k1: K_SNUG,
  c0: C_OPEN,
  c1: C_OPEN,
  warp: SNUG_WARP,
});
const SNUG_X = SNUG.F.map(
  (_, i) => X_OPEN + (X_SNUG - X_OPEN) * camEase(i / (SNUG_F1 - CAM_SNUG_F0), SNUG_WARP),
);
const CREEP = camMove({
  f0: CREEP_F0,
  f1: CREEP_F1,
  k0: K_SNUG,
  k1: K_TIGHT,
  c0: C_OPEN,
  c1: C_OPEN,
  warp: CREEP_WARP,
});
const CREEP_X = CREEP.F.map(
  (_, i) => X_SNUG + (X_TIGHT - X_SNUG) * camEase(i / (CREEP_F1 - CREEP_F0), CREEP_WARP),
);
const PULL = camMove({
  f0: PULL_F0,
  f1: PULL_F1,
  k0: K_TIGHT,
  k1: K_REST,
  c0: C_OPEN,
  c1: CONTENT_C,
  warp: PULL_WARP,
});
const PULL_X = PULL.F.map(
  (_, i) => X_TIGHT + (X_REST - X_TIGHT) * camEase(i / (PULL_F1 - PULL_F0), PULL_X_WARP),
);
const TAIL = camMove({
  f0: TAIL_F0,
  f1: TAIL_F1,
  k0: K_REST,
  k1: K_TAIL,
  c0: CONTENT_C,
  c1: CONTENT_C,
  warp: TAIL_WARP,
});

// Each move's last key and the next move's first are the same frame carrying
// the same value, so the later move contributes from its second key on and the
// track stays strictly increasing, which `interpolate` requires.
export const CBG_CAM_F = [
  0,
  ...SNUG.F,
  ...CREEP.F.slice(1),
  ...PULL.F.slice(1),
  TAIL_F0 - 1,
  ...TAIL.F,
];
export const CBG_CAM_K = [
  K_OPEN,
  ...SNUG.K,
  ...CREEP.K.slice(1),
  ...PULL.K.slice(1),
  K_REST,
  ...TAIL.K,
];
export const CBG_CAM_CY = [
  C_OPEN + CAM_LIFT / K_OPEN,
  ...SNUG.CY,
  ...CREEP.CY.slice(1),
  ...PULL.CY.slice(1),
  CONTENT_C + CAM_LIFT / K_REST,
  ...TAIL.CY,
];
export const CBG_CAM_CX = [
  X_OPEN,
  ...SNUG_X,
  ...CREEP_X.slice(1),
  ...PULL_X.slice(1),
  X_REST,
  ...TAIL.F.map(() => X_REST),
];

// `runCamera` damps cy and k only. This is the house tracker with an x channel,
// on the same CAM_STIFF / CAM_DAMP, so this file owns its camera and
// `fieldShared` is not touched.
export const runCamera2 = (upto: number, F: number[], CY: number[], CX: number[], K: number[]) => {
  let cy = CY[0];
  let cx = CX[0];
  let k = K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tx = interpolate(f, F, CX, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, cx, k };
};

// ---------------------------------------------------------------------------
// THE LATTICE, as coverage. Nothing here is a timer: every line reports how far
// its own front has run, and a node exists the frame both of its lines cover it.
// ---------------------------------------------------------------------------
export type Seg = { x0: number; y0: number; x1: number; y1: number; route: boolean };

// A row's covered span [x0, x1] at `frame`, or null.
export const rowSpan = (r: number, frame: number): { a: number; b: number; route: boolean } | null => {
  const sw = wireS(frame);
  if (r === 0) {
    // The top row IS the trip's own payout from x 196 to 540, and from f86 the
    // front runs on to 884.
    const paid = Math.max(0, Math.min(CENTRE_X - COLS[0], sw - S_CORNER_2));
    if (frame < PARK_AT) {
      return paid <= 0 ? null : { a: COLS[0], b: COLS[0] + paid, route: true };
    }
    const run = Math.min(COLS[4] - CENTRE_X, FRONT_V * (frame - TOPROW_AT));
    return { a: COLS[0], b: CENTRE_X + run, route: true };
  }
  if (r === 4) {
    // The bottom row: the original wire on the left, the closing front on the
    // right.
    return null; // handled by bottomSpans
  }
  const t0 = ROW_FRONT_AT[r];
  if (frame < t0) {
    return null;
  }
  const run = Math.min(COLS[4] - COLS[0], FRONT_V * (frame - t0));
  return run <= 0 ? null : { a: COLS[0], b: COLS[0] + run, route: false };
};

export const bottomSpans = (frame: number) => {
  const out: { a: number; b: number; route: boolean }[] = [];
  const sw = wireS(frame);
  const left = Math.min(S_CORNER_1, sw);
  if (left > 0) {
    out.push({ a: TOWER_L - TRIM - left, b: TOWER_L - TRIM, route: true });
  }
  if (frame >= COL884_BOTTOM_AT) {
    const run = Math.min(COLS[4] - (TOWER_R + TRIM), FRONT_V * (frame - COL884_BOTTOM_AT));
    out.push({ a: COLS[4] - run, b: COLS[4], route: false });
  }
  return out;
};

// A column's covered span [y0, y1] at `frame`, or null.
export const colSpan = (c: number, frame: number): { a: number; b: number; route: boolean } | null => {
  const sw = wireS(frame);
  if (c === 0) {
    const paid = Math.max(0, Math.min(ROW_BOTTOM - Y0, sw - S_CORNER_1));
    return paid <= 0 ? null : { a: ROW_BOTTOM - paid, b: ROW_BOTTOM, route: true };
  }
  const t0 = c === 1 ? COL368_AT : c === 2 ? PARK_AT : c === 3 ? COL712_AT : COL884_AT;
  if (frame < t0) {
    return null;
  }
  // The centre column's WHITE has to stop ON COL_C_END, and pushV adds half a
  // stroke at each end, so its span stops half a stroke short of it.
  const end = c === 2 ? COL_C_END - STROKE / 2 : ROW_BOTTOM;
  const run = Math.min(end - Y0, FRONT_V * (frame - t0));
  return run <= 0 ? null : { a: Y0, b: Y0 + run, route: false };
};

// A node exists the frame BOTH of its lines cover it — the mechanism reached it.
export const nodeLive = (ci: number, ri: number, frame: number) => {
  const col = colSpan(ci, frame);
  const y = ROWS[ri];
  // The centre column stops 2 px above row 998's centre line, inside that row's
  // own stroke, so it counts as covering it.
  const colOk = col !== null && y >= col.a - STROKE / 2 && y <= col.b + STROKE / 2;
  if (!colOk) {
    return false;
  }
  const x = COLS[ci];
  if (ri === 4) {
    return bottomSpans(frame).some((s) => x >= s.a - STROKE / 2 && x <= s.b + STROKE / 2);
  }
  const row = rowSpan(ri, frame);
  return row !== null && x >= row.a - STROKE / 2 && x <= row.b + STROKE / 2;
};

// ---------------------------------------------------------------------------
// AMBIENT TRAFFIC. One 10 x 10 square launched every 10 frames from the first
// frame a line exists, on a lattice segment that exists and that no live packet
// is currently using. Ladder 0.55.
// ---------------------------------------------------------------------------
export const AMBIENT = 12;
export const AMBIENT_V = 16;
export const AMBIENT_EVERY = 4;
export const AMBIENT_F0 = 61;
export const AMBIENT_MIN_LINES = 2; // launches begin once two lattice lines exist
export const AMBIENT_RUN = [2, 3]; // a run is two or three whole segments

type Amb = { poly: Pt[]; f0: number; len: number };

const segmentExists = (seg: Seg, frame: number) => {
  if (seg.y0 === seg.y1) {
    const ri = ROWS.indexOf(seg.y0);
    const lo = Math.min(seg.x0, seg.x1);
    const hi = Math.max(seg.x0, seg.x1);
    if (ri === 4) {
      return bottomSpans(frame).some((s) => lo >= s.a && hi <= s.b);
    }
    const row = rowSpan(ri, frame);
    return row !== null && lo >= row.a && hi <= row.b;
  }
  const ci = COLS.indexOf(seg.x0);
  const col = colSpan(ci, frame);
  const lo = Math.min(seg.y0, seg.y1);
  const hi = Math.max(seg.y0, seg.y1);
  return col !== null && lo >= col.a && hi <= col.b + STROKE / 2;
};

const ALL_SEGS: Seg[] = (() => {
  const out: Seg[] = [];
  for (let ri = 0; ri < ROWS.length; ri++) {
    for (let ci = 0; ci < COLS.length - 1; ci++) {
      out.push({ x0: COLS[ci], y0: ROWS[ri], x1: COLS[ci + 1], y1: ROWS[ri], route: false });
    }
  }
  for (let ci = 0; ci < COLS.length; ci++) {
    for (let ri = 0; ri < ROWS.length - 1; ri++) {
      out.push({ x0: COLS[ci], y0: ROWS[ri], x1: COLS[ci], y1: ROWS[ri + 1], route: false });
    }
  }
  return out;
})();

export const packetAt = (p: Packet, frame: number) => {
  const d = p.d0 - PACKET_V * (frame - p.emit);
  if (frame < p.emit || d <= 0) {
    return null;
  }
  const poly = p.poly ?? WIRE;
  if (d > polyLen(poly)) {
    return null;
  }
  return polyAt(poly, d);
};

// How many LATTICE lines (the fronts' own rows and columns, not the route) have
// any coverage: the ambient traffic waits for two of them.
const latticeLineCount = (frame: number) => {
  let n = 0;
  for (let ri = 1; ri <= 3; ri++) {
    if (rowSpan(ri, frame) !== null) {
      n++;
    }
  }
  for (let ci = 1; ci < COLS.length; ci++) {
    if (colSpan(ci, frame) !== null) {
      n++;
    }
  }
  return n;
};

// The segments that leave a given node and exist at `frame`.
const segsFrom = (ci: number, ri: number, frame: number) =>
  ALL_SEGS.filter(
    (s) =>
      segmentExists(s, frame) &&
      ((s.x0 === COLS[ci] && s.y0 === ROWS[ri]) || (s.x1 === COLS[ci] && s.y1 === ROWS[ri])),
  );

const otherEnd = (s: Seg, at: Pt): Pt =>
  s.x0 === at.x && s.y0 === at.y ? { x: s.x1, y: s.y1 } : { x: s.x0, y: s.y0 };

export const AMBIENTS: Amb[] = (() => {
  const out: Amb[] = [];
  let i = 0;
  for (let f = AMBIENT_F0; f <= DURATION; f += AMBIENT_EVERY, i++) {
    if (latticeLineCount(f) < AMBIENT_MIN_LINES) {
      continue;
    }
    // A run starts on a node the mechanism has already reached.
    const starts: { ci: number; ri: number }[] = [];
    for (let ci = 0; ci < COLS.length; ci++) {
      for (let ri = 0; ri < ROWS.length; ri++) {
        if (nodeLive(ci, ri, f) && segsFrom(ci, ri, f).length > 0) {
          starts.push({ ci, ri });
        }
      }
    }
    if (starts.length === 0) {
      continue;
    }
    const s0 = starts[Math.floor(hash(i, 41) * starts.length) % starts.length];
    let at: Pt = { x: COLS[s0.ci], y: ROWS[s0.ri] };
    const poly: Pt[] = [at];
    const want = AMBIENT_RUN[Math.floor(hash(i, 59) * AMBIENT_RUN.length) % AMBIENT_RUN.length];
    let prev: Pt | null = null;
    for (let step = 0; step < want; step++) {
      const ci = COLS.indexOf(at.x);
      const ri = ROWS.indexOf(at.y);
      if (ci < 0 || ri < 0) {
        break;
      }
      let open = segsFrom(ci, ri, f).filter((sg) => {
        const o = otherEnd(sg, at);
        return prev === null || o.x !== prev.x || o.y !== prev.y;
      });
      if (step === 0) {
        // Prefer a segment no live packet is on, the way the brief has it, and
        // fall back to any if the grid is busy.
        const busy = PACKETS.map((pk) => packetAt(pk, f)).filter((q): q is Pt => q !== null);
        const free = open.filter(
          (sg) =>
            !busy.some(
              (q) =>
                q.x >= Math.min(sg.x0, sg.x1) - 10 &&
                q.x <= Math.max(sg.x0, sg.x1) + 10 &&
                q.y >= Math.min(sg.y0, sg.y1) - 10 &&
                q.y <= Math.max(sg.y0, sg.y1) + 10,
            ),
        );
        if (free.length > 0) {
          open = free;
        }
      }
      if (open.length === 0) {
        break;
      }
      const pick = open[Math.floor(hash(i * 7 + step, 23) * open.length) % open.length];
      prev = at;
      at = otherEnd(pick, at);
      poly.push(at);
    }
    if (poly.length < 2) {
      continue;
    }
    out.push({ poly, f0: f, len: polyLen(poly) });
  }
  return out;
})();

export const defaultProps: Props = schema.parse({
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  paperDim: 0.88,
  paperBlur: 3,
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  solarLabel: "SOLAR",
  towerLabel: "DATA CENTER",
  beats: {
    open: 0,
    snug: 22,
    depart: 53,
    grid: 92,
    end: 97,
  },
});

// ---------------------------------------------------------------------------
// THE GROUND. `SolarFoundation`'s `PaperGround`, unchanged.
// ---------------------------------------------------------------------------
const PaperGround: React.FC<{
  src: string;
  frame: number;
  cy: number;
  cyRest: number;
  cx: number;
  cxRest: number;
  k: number;
  parallax: number;
  dim: number;
  blur: number;
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax, dim, blur }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgX = -(cx - cxRest) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE_CBG,
          height: FRAME_W * BG_OVERSIZE_CBG,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const MASK_CLEAR = "cbg-clear-of-the-glyphs";
const CLIP_CROWN = "cbg-above-the-tower";

// A slab: the 240 x 48 block with its LED hole punched out, so the paper shows
// through. The outer rect and the hole are given separately, because the shadow
// layer offsets the rect by +4/+4 and leaves the hole exactly where the white
// one is — so an unlit LED is a clean square of paper with nothing black in it.
const slabPath = (ox: number, oy: number, hx: number, hy: number) =>
  `M${ox} ${oy} h${SLAB_W} v${SLAB_H} h${-SLAB_W} Z M${hx} ${hy} h${LED} v${LED} h${-LED} Z`;

// -- the ladder ---------------------------------------------------------------
export const OP_LIVE = 1.0; // the two nouns, the live wire, live packets
export const OP_LATTICE = 0.78; // lattice lines and nodes
export const OP_AMBIENT = 0.55; // ambient traffic

const CouldBeOnTheGrid: React.FC<Props> = ({
  paperSrc,
  parallax,
  paperDim,
  paperBlur,
  ink,
  shadow,
  orange,
  purple,
  blue,
  shadowOffset,
  solarLabel,
  towerLabel,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, CBG_CAM_F, CBG_CAM_CY, CBG_CAM_CX, CBG_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const chainOf = (name: string) => (name === "orange" ? orange : name === "purple" ? purple : blue);

  // -- the glyph and its wire ------------------------------------------------
  const solar = solarPos(frame);

  // THE LADDER'S ONE SWITCH, on the mechanism: the route is the only path until
  // the centre column connects, and from that frame every line is lattice.
  const routeRung = frame >= CONNECT_F ? OP_LATTICE : OP_LIVE;

  // -- every line that exists this frame, as rects ---------------------------
  const lines: { x: number; y: number; w: number; h: number; route: boolean }[] = [];
  const pushH = (a: number, b: number, y: number, route: boolean) => {
    if (b - a > 0.5) {
      lines.push({ x: a - STROKE / 2, y: y - STROKE / 2, w: b - a + STROKE, h: STROKE, route });
    }
  };
  const pushV = (a: number, b: number, x: number, route: boolean) => {
    if (b - a > 0.5) {
      lines.push({ x: x - STROKE / 2, y: a - STROKE / 2, w: STROKE, h: b - a + STROKE, route });
    }
  };
  for (let ri = 0; ri < ROWS.length; ri++) {
    if (ri === 4) {
      bottomSpans(frame).forEach((s) => pushH(s.a, s.b, ROWS[ri], s.route));
    } else {
      const s = rowSpan(ri, frame);
      if (s) {
        pushH(s.a, s.b, ROWS[ri], s.route);
      }
    }
  }
  for (let ci = 0; ci < COLS.length; ci++) {
    const s = colSpan(ci, frame);
    if (s) {
      pushV(s.a, s.b, COLS[ci], s.route);
    }
  }
  // The wire's own stub, between the tower and the bottom-row left run: it is
  // already covered by bottomSpans. Nothing else to add.

  const nodes: Pt[] = [];
  for (let ci = 0; ci < COLS.length; ci++) {
    for (let ri = 0; ri < ROWS.length; ri++) {
      if (nodeLive(ci, ri, frame)) {
        nodes.push({ x: COLS[ci], y: ROWS[ri] });
      }
    }
  }

  const livePackets = PACKETS.map((p) => packetAt(p, frame)).filter((q): q is Pt => q !== null);

  const ambients = AMBIENTS.map((a) => {
    const d = AMBIENT_V * (frame - a.f0);
    if (frame < a.f0 || d > a.len) {
      return null;
    }
    return polyAt(a.poly, d);
  }).filter((q): q is Pt => q !== null);

  // -- the crown, the cut's one chain moment ---------------------------------
  const crownRise = (start: number) => {
    const t = interpolate(frame, [start, start + CROWN_TRAVEL], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
    return (1 - t) * CROWN;
  };
  const chain = [
    { key: "orange", start: CONNECT_F, extra: CROWN_OFFSETS.orange },
    { key: "purple", start: CONNECT_F + CHAIN_STAGGER, extra: CROWN_OFFSETS.purple },
    { key: "blue", start: CONNECT_F + 2 * CHAIN_STAGGER, extra: CROWN_OFFSETS.blue },
  ];

  const type = () =>
    ({
      fontFamily,
      fontWeight: 900,
      fontSize: TAG_SIZE,
      textTransform: "uppercase",
      letterSpacing: `${TAG_TRACK}em`,
    }) as const;

  const shadowedText = (key: string, text: string, x: number, y: number) => (
    <g key={key}>
      <text
        x={x + shadowOffset - (TAG_TRACK * TAG_SIZE) / 2}
        y={y + shadowOffset}
        textAnchor="middle"
        fill={shadow}
        style={type()}
      >
        {text}
      </text>
      <text
        x={x - (TAG_TRACK * TAG_SIZE) / 2}
        y={y}
        textAnchor="middle"
        fill={ink}
        style={type()}
      >
        {text}
      </text>
    </g>
  );

  // SOLAR: the two panels, each a 4 x 2 array of cells with the paper showing
  // through the gaps, carried on the glyph's current centre.
  const panelCells: { x: number; y: number }[] = [];
  for (let p = 0; p < 2; p++) {
    for (let c = 0; c < PANEL_COLS; c++) {
      for (let r = 0; r < PANEL_ROWS; r++) {
        panelCells.push({
          x: solar.x - SOLAR_HX + c * CELL_PITCH,
          y: solar.y - SOLAR_HY + p * (PANEL_H + PANEL_GAP) + r * CELL_PITCH,
        });
      }
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={CBG_CAM_CY[0]}
        cx={cx}
        cxRest={CBG_CAM_CX[0]}
        k={k}
        parallax={parallax}
        dim={paperDim}
        blur={paperBlur}
      />

      <AbsoluteFill>
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
            <defs>
              {/* No line, packet or node is ever drawn through a glyph: both
                  boxes are knocked out with their 12 px clearance. */}
              <mask id={MASK_CLEAR} maskUnits="userSpaceOnUse" x={-2000} y={-4000} width={6000} height={12000}>
                <rect x={-2000} y={-4000} width={6000} height={12000} fill="#FFFFFF" />
                <rect
                  x={solar.x - SOLAR_HX - TRIM}
                  y={solar.y - SOLAR_HY - TRIM}
                  width={SOLAR_W + 2 * TRIM}
                  height={SOLAR_H + 2 * TRIM}
                  fill="#000000"
                />
                <rect
                  x={TOWER_L - TRIM}
                  y={TOWER_TOP - TRIM}
                  width={TOWER_W + 2 * TRIM}
                  height={TOWER_H + 2 * TRIM}
                  fill="#000000"
                />
              </mask>
              {/* Colour is only ever a band ABOVE the white tower. */}
              <clipPath id={CLIP_CROWN}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + TOWER_TOP} />
              </clipPath>
            </defs>

            {/* THE GRID, THE WIRE, THE PACKETS AND THE TRAFFIC, all clear of
                both glyphs. Three rungs, each a single composited group so an
                overlap never doubles up. */}
            <g mask={`url(#${MASK_CLEAR})`}>
              {/* the lattice: everything that is not the route, or everything
                  once the route stops being the only path */}
              {/* THE LIVE WIRE, while it is the only path. It goes down
                  FIRST, so the lattice's node squares cap every junction it
                  shares with a front instead of being cut by one. */}
              {routeRung === OP_LIVE ? (
                <g opacity={OP_LIVE}>
                  {lines
                    .filter((l) => l.route)
                    .map((l, i) => (
                      <rect
                        key={`rs-${i}`}
                        x={l.x + shadowOffset}
                        y={l.y + shadowOffset}
                        width={l.w}
                        height={l.h}
                        fill={shadow}
                      />
                    ))}
                  {lines
                    .filter((l) => l.route)
                    .map((l, i) => (
                      <rect key={`rw-${i}`} x={l.x} y={l.y} width={l.w} height={l.h} fill={ink} />
                    ))}
                </g>
              ) : null}

              {/* The lattice is ONE object, so its whole shadow goes down
                  first and its whole white on top: a node's own +4/+4 copy
                  painted after the line whites notches every junction. */}
              <g opacity={OP_LATTICE}>
                {lines
                  .filter((l) => !l.route || routeRung === OP_LATTICE)
                  .map((l, i) => (
                    <rect
                      key={`ls-${i}`}
                      x={l.x + shadowOffset}
                      y={l.y + shadowOffset}
                      width={l.w}
                      height={l.h}
                      fill={shadow}
                    />
                  ))}
                {nodes.map((n, i) => (
                  <rect
                    key={`ns-${i}`}
                    x={n.x - NODE / 2 + shadowOffset}
                    y={n.y - NODE / 2 + shadowOffset}
                    width={NODE}
                    height={NODE}
                    fill={shadow}
                  />
                ))}
                {lines
                  .filter((l) => !l.route || routeRung === OP_LATTICE)
                  .map((l, i) => (
                    <rect key={`lw-${i}`} x={l.x} y={l.y} width={l.w} height={l.h} fill={ink} />
                  ))}
                {nodes.map((n, i) => (
                  <rect
                    key={`nw-${i}`}
                    x={n.x - NODE / 2}
                    y={n.y - NODE / 2}
                    width={NODE}
                    height={NODE}
                    fill={ink}
                  />
                ))}
              </g>

              {/* ambient traffic */}
              <g opacity={OP_AMBIENT}>
                {ambients.map((a, i) => (
                  <rect
                    key={`as-${i}`}
                    x={a.x - AMBIENT / 2 + shadowOffset}
                    y={a.y - AMBIENT / 2 + shadowOffset}
                    width={AMBIENT}
                    height={AMBIENT}
                    fill={shadow}
                  />
                ))}
                {ambients.map((a, i) => (
                  <rect
                    key={`aw-${i}`}
                    x={a.x - AMBIENT / 2}
                    y={a.y - AMBIENT / 2}
                    width={AMBIENT}
                    height={AMBIENT}
                    fill={ink}
                  />
                ))}
              </g>

              {/* live packets */}
              <g opacity={OP_LIVE}>
                {livePackets.map((p, i) => (
                  <rect
                    key={`ps-${i}`}
                    x={p.x - PACKET / 2 + shadowOffset}
                    y={p.y - PACKET / 2 + shadowOffset}
                    width={PACKET}
                    height={PACKET}
                    fill={shadow}
                  />
                ))}
                {livePackets.map((p, i) => (
                  <rect
                    key={`pw-${i}`}
                    x={p.x - PACKET / 2}
                    y={p.y - PACKET / 2}
                    width={PACKET}
                    height={PACKET}
                    fill={ink}
                  />
                ))}
              </g>
            </g>

            {/* THE CROWN, behind the tower and clipped to its top edge. */}
            <g clipPath={`url(#${CLIP_CROWN})`}>
              {frame >= CONNECT_F ? (
                <rect
                  x={TOWER_L + shadowOffset}
                  y={TOWER_TOP - CROWN_OFFSETS.orange + crownRise(CONNECT_F) + shadowOffset}
                  width={SLAB_W}
                  height={SLAB_H}
                  fill={shadow}
                />
              ) : null}
              {chain.map((c) =>
                frame >= c.start ? (
                  <rect
                    key={c.key}
                    x={TOWER_L}
                    y={TOWER_TOP - c.extra + crownRise(c.start)}
                    width={SLAB_W}
                    height={SLAB_H}
                    fill={chainOf(c.key)}
                  />
                ) : null,
              )}
            </g>

            {/* THE DATA CENTER. Four slabs, each with its hole; the shadow
                carries the hole UNOFFSET so an unlit LED is clean paper. */}
            {Array.from({ length: SLAB_N }, (_, i) => (
              <path
                key={`slab-shadow-${i}`}
                d={slabPath(
                  TOWER_L + shadowOffset,
                  TOWER_TOP + i * SLAB_PITCH + shadowOffset,
                  LED_X,
                  TOWER_TOP + i * SLAB_PITCH + LED_DY,
                )}
                fill={shadow}
                fillRule="evenodd"
              />
            ))}
            {Array.from({ length: SLAB_N }, (_, i) => (
              <path
                key={`slab-${i}`}
                d={slabPath(TOWER_L, TOWER_TOP + i * SLAB_PITCH, LED_X, TOWER_TOP + i * SLAB_PITCH + LED_DY)}
                fill={ink}
                fillRule="evenodd"
              />
            ))}
            {Array.from({ length: SLAB_N }, (_, i) =>
              LED_STATE_AT[Math.min(frame, DURATION)][i] ? (
                <rect
                  key={`led-${i}`}
                  x={LED_X}
                  y={TOWER_TOP + i * SLAB_PITCH + LED_DY}
                  width={LED}
                  height={LED}
                  fill={chainOf(LED_COLOURS[i])}
                />
              ) : null,
            )}
            {shadowedText("tower-tag", towerLabel, TOWER_CX, TOWER_TAG_BASELINE)}

            {/* SOLAR, wherever it is: the cells, then its tag riding above. */}
            {panelCells.map((c, i) => (
              <rect
                key={`cs-${i}`}
                x={c.x + shadowOffset}
                y={c.y + shadowOffset}
                width={CELL}
                height={CELL}
                fill={shadow}
              />
            ))}
            {panelCells.map((c, i) => (
              <rect key={`cw-${i}`} x={c.x} y={c.y} width={CELL} height={CELL} fill={ink} />
            ))}
            {shadowedText("solar-tag", solarLabel, solar.x, solar.y - SOLAR_HY - SOLAR_TAG_GAP)}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default CouldBeOnTheGrid;
