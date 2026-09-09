import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Hockey_Stick`, cut 2b — it sits between cut 2 (0:18)
// and cut 3 (0:52) in the edit: "I imagine China will start to be able to
// extract more and more purchasing of even foreign chips into domestic China,
// or at least close the gap in what the US is allowing, you know, Nvidia to
// sell them, or what have you."
//
// SRT span 0:35.300 -> 0:45.539 at 24fps. ("I" is estimated at 35.300 inside
// the cue "and you know i", 34.840-35.460.)
// round((45.539 - 35.300) * 24) = round(10.239 * 24) = round(245.74) = 246
// frames of speech, plus a 16 frame tail so the resolved state holds = 262.
export const DURATION = 262;

// ---------------------------------------------------------------------------
// "Close the gap" — cut 3's exchange, the other way round.
//
// The US flag has a full block of FIFTY orange chips under it: what Nvidia has
// to sell. Under the China flag is an EMPTY area of fifty seats. Chips cross
// from the US block into China's seats, bottom row first, at a rate that keeps
// increasing — "more and more" — stacking up from the bottom. They stay orange:
// they are foreign chips inside China. By the last word FORTY-FIVE of the fifty
// seats are taken and the top row is half empty: the gap has CLOSED, not
// vanished. Each chip that leaves the US block leaves its trace at OP_UNREAD
// 0.45, exactly as cut 3's fifty do.
//
// No text anywhere. No floor. Nothing stands on anything: the two flags float
// and every position in the piece is measured off them, as in cuts 2 and 3.
//
// GEOMETRY (world; identical to cut 3 wherever it overlaps)
//   China flag    240x160 on the shared squircle, FLAG_RED with the stars in
//                 the house accent, centred at world x 350 — so x 230..470,
//                 y 1000..1160. Present from f0, no entrance: it is the
//                 carry-over from cut 2, and it is the carry-over INTO cut 3,
//                 whose first frame is this cut's last.
//   US flag       the same 240x160 squircle at world x 730, same y — x 610..850.
//                 Also present from f0: in cut 3 it arrives, here it is already
//                 there, because the sentence starts with both sides in it.
//   the US block  10 wide x 5 tall on the field's own crowd step (940/39 =
//                 24.10), jittered, centred under the US flag, its TOP ROW 40
//                 world px below the flag's bottom edge: y 1200, 1224, 1248,
//                 1272, 1296 and x 621.5..838.5 before jitter. Fifty
//                 ACCENT_DEEP dots from f0.
//   China's seats the same 10 x 5 grid on the same rows, centred under the
//                 China flag: x 241.5..458.5. EMPTY at f0 — a seat is a
//                 position, not a drawn thing.
//   tones         a chip is ACCENT_DEEP at rest in the US block; in flight and
//                 once seated in China it is ACCENT (ripe — it is the
//                 purchased, live compute); the trace it leaves in the US block
//                 is ACCENT_DEEP at OP_UNREAD.
//   framing       a PURE ZOOM about the midpoint of the pair. cx is world 540
//                 for the whole cut — there is no lateral travel — and the only
//                 thing that moves is k, 1.45 -> 1.25. Both flags and both
//                 blocks are inside the frame from f0: at k 1.45 the China
//                 flag's left edge is at screen x 90.5 and the US flag's right
//                 edge at 989.5, and the blocks' outer dots at 90.3 and 989.3,
//                 so the tightest margin in the opening frame is a block's
//                 outermost dot at its widest breath, 88.8 px. At the resolve,
//                 k 1.25, those edges are at 152.5 and 927.5 — cut 3's own
//                 resolve, so this
//                 cut's last frame and cut 3's first are the same picture.
//                 Both flags are on world y 1000..1160 and that row's centre
//                 line, world 1080, sits at SCREEN y 830 at BOTH ends of the
//                 move and never leaves it by more than 0.3 px while it runs —
//                 the same place the mark holds in cuts 2 and 3.
//
// THE GESTURE LIST — one gesture per word, nothing else.
//   both flags and the full US block, over the
//     empty China area. Breath only                 — hold              f0-16
//   the ONE camera move: a PURE ZOOM, k 1.45 ->
//     1.25 about a fixed cx 540, on one warped
//     smoothstep (warp 0.72). It opens on BOTH
//     flags already whole, the US block full on the
//     right and the empty seats on the left, and
//     widens to the frame the crossing needs — the
//     same picture, given room. No
//     lateral travel: the sentence names both sides
//     at once, so the camera has nowhere to go but
//     out. Keyed f16-26; the damper is inside 0.5%
//     of its target by f36 (0.52% there, 0.06% by
//     f38), seven frames before "extract", and the
//     flag row never leaves screen y 830 by more
//     than 0.3 px while it runs. Nothing new
//     appears while it does                         — "China will start to"
//                                                                      f16-36
//   THE CROSSING. Forty-five chips leave the US
//     block — hashed order, drawn from the block
//     BOTTOM-UP so the US block empties from its
//     bottom rows — each on its own quadratic arc
//     (control point 60-110 px above the chord,
//     hashed and capped) to a seat in China. China
//     fills BOTTOM ROW FIRST and, inside a row, the
//     FAR SIDE first — the left, since the chips
//     arrive from the right — which is cut 3's rule
//     and what keeps a flyer out of a seated disc.
//     Launch spacing shrinks GEOMETRICALLY from
//     6.97 frames at the first launch to 1.99 at
//     the last — a 3.5:1 ramp over a span of 175.47
//     frames, solved so the first launch is f43 and
//     the 45th landing is exactly f236. Flights run
//     16.1-21.9 frames, so the first landing is
//     f64.9. THREE chips are in the air at f80,
//     FIVE at f151, EIGHT at f211: "more and more"
//     is the rate itself. Seats 46-50, the top
//     row's five nearest the US side, stay empty
//     forever                                       — "be able to extract
//                                                     more and more
//                                                     purchasing of even
//                                                     foreign chips into
//                                                     domestic China ...
//                                                     close the gap ...
//                                                     Nvidia to sell them ...
//                                                     have you"      f43-236
//   the chips STAY. The frame a chip leaves its
//     seat, an ACCENT_DEEP dot at OP_UNREAD 0.45
//     appears in it — same radius, same breath, no
//     fade-in: the departing chip leaves itself
//     behind. Derived from the launch, so it cannot
//     drift from it. Exactly cut 3's trace          — under the crossing
//                                                                    f43-236
//   NO GESTURE. The word names the quota and the
//     quota is no longer drawn; the crossing is
//     running under it, as it is under every word
//     inside the ellipses above                     — "allowing"          f175
//   hold resolved, never fades                      — tail           f246-262
//
// ambient on every hold: the shared `breath` on every seated dot and every
// trace, the grid's own drift and parallax, and the shared `sway`. Nothing
// else. The longest stretch with no gesture is f0-16, the hold the cut opens
// on, which is cut 2's last frame held while the sentence starts.
//
// No springs, flashes, rims, boxes, labels or marks. One opacity ladder.
//
// PASS 2, AND WHY THE OPEN CHANGED. The first build inherited cut 3's open
// frame for frame — k 1.6 about cx 350, tight on the China flag — and then slid
// right as it widened. That is the right open for cut 3, where the US flag
// ARRIVES; it is the wrong one here, because in this cut both flags and both
// blocks exist from f0, and at k 1.6 about x 350 the US flag spans screen x
// 956..1340: only its left third is in shot, hanging off the right edge, with
// its block behind it, until the pull-back catches up. A mark cut in three by
// the frame edge reads as a mistake, not as a frame.
//
// The fix is a pure zoom about the pair's own midpoint: cx 540 for the whole
// cut, k 1.45 -> 1.25, no lateral travel at all. 1.45 is the tightest k that
// still holds everything with room — every edge in the opening frame clears the
// side by at least 88.8 px — and it is close enough to the resolve that the
// move stays one readable gesture rather than a lurch. Everything else in this
// file is untouched: the same keys f16-26, the same warp, the same schedule,
// the same 45th landing on f236.
//
// The move also gets simpler than it was. With cx constant there is no lateral
// track to run through a second damper, so the camera is one `camMove` and one
// `runCamera`, and `GridBackground` is handed no cx at all — the parallax is
// vertical only, exactly as cut 1's is.
//
// THE LAUNCH RAMP, and why it is geometric. The brief's shape is "7 frames at
// the first launch to 2 at the last" and the schedule is not free: the first
// launch is f43 and the 45th landing is f236, so the 44 gaps have to fit
// 193 frames minus the last flight. A LINEAR ramp from 7 to 2 sums to 198
// frames on its own and has to be squashed to 0.88 of itself to fit, which
// costs the ratio its shape at both ends. A GEOMETRIC one — gap_i = g0 * q^i
// with q = (2/7)^(1/43) — sums to 175.6, which is within 1% of the span the
// solver actually wants, so the ratio survives almost exactly: 6.85 -> 1.96,
// 3.5:1, as asked. The solver bisects the span so the 45th landing is f236 to
// the frame.
//
// LANDINGS IN LAUNCH ORDER. Durations are hashed over 16-22 frames while the
// gaps at the end of the ramp are under two, so a fast chip launched late can
// overtake a slow one launched early — and that would break the one hard rule
// this layout is built on, because a seat claimed out of order can be sitting
// in a later flight's path. Each landing is therefore floored at half a frame
// after the one before it, which only ever LENGTHENS a flight and leaves the
// durations inside 16-24. The order is then true by construction.
//
// THE ARCS, AND THE FLAG CEILING. The control point sits straight above the
// chord's midpoint, so x is linear in t and a ceiling is a bound on the bow
// rather than a search. One of them: a flag. An arc may not pass behind either
// mark. The chords run from x 621..838 to x 242..458, so their midpoints land
// anywhere in 431..648 — under the China flag at one end of that range and
// under the US flag at the other — and both have to be tested, as they are in
// cut 3.
// The bow is also floored at half the chord's rise plus 8, which is what makes
// the arc monotone in y — so a chip always arrives at its seat from ABOVE and
// can never rise into it through the row below. Where the ceiling would fall
// under that floor the floor wins, because monotonicity is the rule the
// no-overlap proof rests on.
//
// THE SWEEP. Run at module scope at quarter-frame resolution, as cut 3's was.
// It throws rather than rendering a frame with a chip drawn through a chip.
// Re-run after the client pass, with the quota ceiling gone: ZERO flyer/seated
// overlaps in China; the worst clearance under either flag is 5.96 px, the
// arcs now sitting on the 6 px flag ceiling that the quota's stricter one used
// to hold them off; and forty-five chips are seated on f236. The origin is measured separately and
// is not a fault — see the note on the sweep itself.
//
// CLIENT PASS. "Remove the dotted line under the China flag — it doesn't make
// any sense." Gone: the dashed quota, its geometry, its click on "allowing",
// its ceiling on the arcs and the `ink` prop that only ever coloured it. The
// note is right on its own terms. The line was drawn as a quota the chips
// stack up toward, but a quota is a NUMBER, not a place, and a horizontal rule
// hanging over an empty grid reads as a floor, a ledge or an axis long before
// it reads as a limit — and it reads as one the chips are about to hit, which
// is the opposite of "close the gap".
//
// What carries the meaning was never the line: it is the FIVE EMPTY SEATS in
// the top row on the US side. Forty-five of fifty taken, five never claimed —
// the gap is closed, not gone — and that is legible without a caption because
// the block's own outline is the measure. The line was drawing the same idea a
// second time, in a second material, and one of the two had to go.
//
// Removing it also loosens the arcs, and only in the right direction. The
// quota ceiling was stricter than the flag's over the China block (1180
// against 1160) and it was what flattened the last arrivals into the top row.
// With it gone those arcs are free to take the bow their hash asks for, capped
// by the flags alone; the sweep re-runs at zero overlaps, so nothing had to be
// re-timed to pay for it. Untouched: the seats, the schedule (first launch
// f43, 45th landing f236), the traces, the camera, the hold.
// ---------------------------------------------------------------------------

// The flag's red. Copied from cuts 1-3 rather than imported, so none of them is
// ever touched by this file.
const FLAG_RED = "#DE2910";

export const schema = z.object({
  accent: z.string(), // ripe: a chip in flight, and a chip seated in China
  accentDeep: z.string(), // deep: a chip at rest in the US block, and its trace
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
  traceOpacity: z.number(), // the dot a departing chip leaves in its seat
  beats: z.object({
    i: z.number(), // "i"
    imagine: z.number(), // "imagine"
    chinaWill: z.number(), // "china will"
    startTo: z.number(), // "start to"
    beAbleTo: z.number(), // "be able to"
    extractMore: z.number(), // "extract more"
    andMore: z.number(), // "and more"
    purchasing: z.number(), // "purchasing"
    ofEvenForeign: z.number(), // "of even foreign"
    chipsInto: z.number(), // "chips into"
    domestic: z.number(), // "domestic"
    chinaOrAt: z.number(), // "china or at"
    leastCloseThe: z.number(), // "least close the"
    gapIn: z.number(), // "gap in"
    whatTheUsIs: z.number(), // "what the us is"
    allowing: z.number(), // "allowing"
    youKnow: z.number(), // "you know"
    nvidiaTo: z.number(), // "nvidia to"
    sellThem: z.number(), // "sell them"
    orWhat: z.number(), // "or what"
    haveYou: z.number(), // "have you"
    end: z.number(), // speech ends; tail to 262
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
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
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  traceOpacity: OP_UNREAD,
  beats: {
    i: 0,
    imagine: 4,
    chinaWill: 13,
    startTo: 28,
    beAbleTo: 37,
    extractMore: 43,
    andMore: 62,
    purchasing: 69,
    ofEvenForeign: 80,
    chipsInto: 97,
    domestic: 112,
    chinaOrAt: 120,
    leastCloseThe: 136,
    gapIn: 151,
    whatTheUsIs: 160,
    allowing: 175,
    youKnow: 186,
    nvidiaTo: 211,
    sellThem: 220,
    orWhat: 229,
    haveYou: 236,
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

// ---------------------------------------------------------------------------
// The ground truth, which is not a ground: TWO FLAGS, both present from f0.
// Every other position in the piece is derived from their edges. Cut 3's
// numbers exactly — 240 x 160 at world x 350 and 730 on y 1000..1160.
// ---------------------------------------------------------------------------
const CENTRE_X = 540;

const FLAG_W = 240;
const FLAG_H = 160; // 3:2
const FLAG_UNIT = FLAG_W / 30; // 8, the official 30x20 unit grid of cut 1
const FLAG_PATH = squirclePath(FLAG_W, FLAG_H);
const FLAG_TOP = 1000;
const FLAG_BOTTOM = FLAG_TOP + FLAG_H; // 1160

const CN_CX = 350;
const CN_X = CN_CX - FLAG_W / 2; // 230
const CN_RIGHT = CN_X + FLAG_W; // 470
const US_CX = 730;
const US_X = US_CX - FLAG_W / 2; // 610
const US_RIGHT = US_X + FLAG_W; // 850

// ---------------------------------------------------------------------------
// The two blocks. Both hang off the flags' bottom edge — there is no floor —
// and both are laid out on the field's own crowd step, so a chip here is made
// of the same material as every crowd in this set. A seat is jittered by up to
// a quarter of a step so a block is organic without losing its outline, and a
// dot's radius varies 0.75-1.25 the way the field's do. Cut 3's helpers, copied
// rather than imported.
// ---------------------------------------------------------------------------
const STEP = 940 / 39;
const BLOCK_GAP = 40; // the top row's centre, below the flag's bottom edge
const BLOCK_TOP_Y = FLAG_BOTTOM + BLOCK_GAP; // 1200

const COLS = 10;
const ROWS = 5;
const N_CELLS = COLS * ROWS; // 50

const jit = (i: number, k: number) => (hash(i, k) - 0.5) * STEP * 0.5;

const blockSeat = (cx: number, cols: number, row: number, col: number, i: number): Pt => ({
  x: cx + (col - (cols - 1) / 2) * STEP + jit(i, 11),
  y: BLOCK_TOP_Y + row * STEP + jit(i, 12),
});

// China's seats, in FILL ORDER: bottom row first, and inside a row the FAR side
// first — the LEFT, since the chips arrive from the right. Cut 3's rule,
// mirrored, and it is what makes "no flyer through a seated disc" true by
// construction rather than by luck: a flight's x falls monotonically to its own
// seat, so every seat already claimed in its row is beyond it, and every row
// already full is below the height it descends to.
//
// Seats 45-49 of this order — the top row's five nearest the US side — are
// never claimed. That is the gap that does not close.
const CHINA_SEATS: Pt[] = (() => {
  const out: Pt[] = [];
  for (let row = ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < COLS; col++) {
      out.push(blockSeat(CN_CX, COLS, row, col, 5000 + row * COLS + col));
    }
  }
  return out;
})();
if (CHINA_SEATS.length !== N_CELLS) {
  throw new Error(`China has ${CHINA_SEATS.length} seats, not ${N_CELLS}`);
}

// ---------------------------------------------------------------------------
// The camera. ONE MOVE, and it is a PURE ZOOM: cx is world 540 — the midpoint
// of the two flags — for every frame of the cut, and only k travels, 1.45 ->
// 1.25, on one warped smoothstep, warp 0.72. The pair is the subject from the
// first frame, so there is nothing to pan to; a lateral move here would only
// take a mark off the edge and bring it back, which is what pass 1 did. See
// the header note on the open.
//
// It shares cut 3's resolve exactly (k 1.25 about x 540), so this cut's last
// frame and cut 3's first are the same picture, and it serves the same word:
// keyed f16-26, on "China will start to". This damper lags its target by about
// ten frames, so the move is inside 0.5% of its target by f36 (0.52% there,
// 0.06% by f38), seven frames before "extract" at f43.
//
// cy is taken off the EASED k by `camMove` so the framing settles with the
// zoom, and what it settles ON is the FLAG ROW rather than the content box:
// the flags are the one element that carries through every cut of this clip,
// and their centre line (world 1080) is pinned to screen y 830 at both ends —
// and, since the zoom is about the flags' own midpoint, it never leaves it by
// more than 0.3 px in between.
//
//   f0-15    k 1.45     both flags whole with room: the China flag's left edge
//            cx 540     at screen x 90.5 and the US flag's right edge at 989.5,
//                       the blocks' outer dots at 90.3 and 989.3 — every
//                       margin over 88 px, the tightest being a dot's outer
//                       edge at 88.8. The flags' centre at screen y 830, the
//                       blocks' bottom row at 1144.
//   f16-36   -> k 1.25  the same picture, wider: those edges at 152.5 and
//            cx 540     927.5, the flags' centre still at screen y 830 and the
//                       blocks' bottom row at 1100. Inside 0.5% of target by
//                       f36.
// ---------------------------------------------------------------------------
const K_OPEN = 1.45;
const K_FINAL = 1.25;
// The one cx the whole cut is shot from: the midpoint of the two flags.
const CX = CENTRE_X;
const CAM_F0 = 16;
const CAM_F1 = 26;
const CAM_WARP = 0.72;
const FLAG_MID = FLAG_TOP + FLAG_H / 2; // 1080
const FLAG_SCREEN_Y = 830;
// what `camMove` has to be handed so that FLAG_MID lands on FLAG_SCREEN_Y
const contentFor = (k: number) => FLAG_MID + (FRAME_H / 2 - FLAG_SCREEN_Y - CAM_LIFT) / k;
const CONTENT_OPEN = contentFor(K_OPEN); // 1083.13
const CONTENT_FINAL = contentFor(K_FINAL); // 1084
const CY_OPEN = CONTENT_OPEN + CAM_LIFT / K_OPEN; // 1161.25
const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL; // 1184

const BLOCK_BOTTOM_Y = BLOCK_TOP_Y + (ROWS - 1) * STEP; // 1296.4
// The blocks' bottom row on screen at the resolve: the lowest thing in the cut,
// and the check that pinning the flag has not pushed it out of shot.
const BLOCK_BOTTOM_SCREEN = FRAME_H / 2 + (BLOCK_BOTTOM_Y - CY_FINAL) * K_FINAL; // 1100
if (BLOCK_BOTTOM_SCREEN > FRAME_H - 200) {
  throw new Error(`the blocks' bottom row is at screen y ${BLOCK_BOTTOM_SCREEN.toFixed(0)}`);
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

// The opening frame is the whole point of pass 2, so it is a test rather than a
// claim: at K_OPEN about CX, every horizontal extreme in the piece — the two
// flags' outer edges and both blocks' outermost dots at their largest breath —
// has to clear the side of the frame by 60 px.
const SIDE_MARGIN_MIN = 60;
const OPEN_MARGIN = (() => {
  const screenX = (x: number) => FRAME_W / 2 + (x - CX) * K_OPEN;
  const extremes: number[] = [CN_X, US_RIGHT];
  const rMax = DOT_RADIUS * 1.25 * 1.05; // the widest a dot ever breathes
  for (const cx of [CN_CX, US_CX]) {
    for (const col of [0, COLS - 1]) {
      for (let row = 0; row < ROWS; row++) {
        // both seedings of the same lattice: 1000+ in the US block, 5000+ in China
        for (const base of [1000, 5000]) {
          const s = blockSeat(cx, COLS, row, col, base + row * COLS + col);
          extremes.push(s.x - rMax, s.x + rMax);
        }
      }
    }
  }
  return Math.min(...extremes.map((x) => Math.min(screenX(x), FRAME_W - screenX(x))));
})();
if (OPEN_MARGIN < SIDE_MARGIN_MIN) {
  throw new Error(`the open leaves only ${OPEN_MARGIN.toFixed(1)} px at the side of the frame`);
}

// ---------------------------------------------------------------------------
// The crossing.
// ---------------------------------------------------------------------------
const CROSS_F0 = 43; // "extract more": the first launch
const CROSS_LAST_LAND = 236; // "have you": the forty-fifth landing
const N_CROSS = 45;
const GAP_FIRST = 7;
const GAP_LAST = 2;
const CROSS_DUR_MIN = 16;
const CROSS_DUR_MAX = 22;
const LAND_MIN_GAP = 0.5; // landings stay in launch order; see the header
// The crossing's two ends are words, not numbers: the schedule below is solved
// at module scope so they have to be pinned here rather than read off a prop.
if (
  CROSS_F0 !== defaultProps.beats.extractMore ||
  CROSS_LAST_LAND !== defaultProps.beats.haveYou
) {
  throw new Error("the crossing no longer starts on `extract` and ends on `have you`");
}
const BOW_MIN = 60; // the control point, above the chord
const BOW_MAX = 110;
const FLAG_CLEAR = 6; // how far under a flag an arc has to stay
const RIPEN = 4; // frames a chip takes to go deep -> ripe once it launches

// The ramp, normalised. gap_i = GAP_FIRST * q^i with q chosen so the last of
// the 44 gaps is GAP_LAST; U[k] is the cumulative position of launch k in
// 0..1, and the span it is multiplied by is solved below.
const RAMP_Q = Math.pow(GAP_LAST / GAP_FIRST, 1 / (N_CROSS - 2));
const RAMP_U: number[] = (() => {
  const out: number[] = [];
  const total = 1 - Math.pow(RAMP_Q, N_CROSS - 1);
  for (let k = 0; k < N_CROSS; k++) out.push((1 - Math.pow(RAMP_Q, k)) / total);
  return out;
})();

type Cell = {
  seed: number;
  rad: number; // 0.75-1.25
  seat: Pt; // its seat in the US block
  crosses: boolean;
  target: Pt; // its seat in China, when it crosses
  seatIdx: number;
  bow: number;
  xT0: number;
  xDur: number;
  xLand: number;
};

const SCHEDULE = (() => {
  const dur0: number[] = [];
  for (let k = 0; k < N_CROSS; k++) {
    dur0.push(CROSS_DUR_MIN + (CROSS_DUR_MAX - CROSS_DUR_MIN) * hash(2000 + k, 55));
  }
  const build = (span: number) => {
    const launch: number[] = [];
    const land: number[] = [];
    for (let k = 0; k < N_CROSS; k++) {
      const t0 = CROSS_F0 + RAMP_U[k] * span;
      let l = t0 + dur0[k];
      if (k > 0 && l < land[k - 1] + LAND_MIN_GAP) l = land[k - 1] + LAND_MIN_GAP;
      launch.push(t0);
      land.push(l);
    }
    return { launch, land };
  };
  // land[N-1] rises monotonically with the span, so bisection is exact.
  let lo = 1;
  let hi = 400;
  for (let it = 0; it < 80; it++) {
    const mid = (lo + hi) / 2;
    if (build(mid).land[N_CROSS - 1] < CROSS_LAST_LAND) lo = mid;
    else hi = mid;
  }
  const span = (lo + hi) / 2;
  const { launch, land } = build(span);
  return { span, launch, land, dur: launch.map((t, k) => land[k] - t) };
})();

const CELLS: Cell[] = (() => {
  // --- the fifty seats of the US block, and each chip's own radius ----------
  const base = [] as { seed: number; rad: number; seat: Pt; row: number }[];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const seed = 1000 + row * COLS + col;
      base.push({
        seed,
        rad: 0.75 + 0.5 * hash(seed, 13),
        seat: blockSeat(US_CX, COLS, row, col, seed),
        row,
      });
    }
  }

  // --- the departure order: bottom row first, hashed inside a row -----------
  // The block therefore empties from its bottom rows, and the five chips left
  // behind at the end are five of the ten in its TOP row.
  const crossOrder = base
    .map((b, n) => ({ n, key: (ROWS - 1 - b.row) * 10 + hash(b.seed, 71) * 9.5 }))
    .sort((a, b2) => a.key - b2.key)
    .map((o) => o.n);

  const seatIdx = base.map(() => -1);
  const xT0 = base.map(() => Infinity);
  const xDur = base.map(() => 0);
  const xLand = base.map(() => Infinity);
  for (let k = 0; k < N_CROSS; k++) {
    const n = crossOrder[k];
    seatIdx[n] = k; // launch order IS fill order: seat k for launch k
    xT0[n] = SCHEDULE.launch[k];
    xDur[n] = SCHEDULE.dur[k];
    xLand[n] = SCHEDULE.land[k];
  }

  // --- the arcs, and the two ceilings --------------------------------------
  // The control point sits straight above the chord's midpoint, so x is linear
  // in t and a ceiling is a bound on the bow rather than a search. See the
  // header for the flag ceiling and why the monotonicity floor outranks it.
  const bows = base.map((b, n) => {
    if (seatIdx[n] < 0) return 0;
    const p0 = b.seat;
    const p2 = CHINA_SEATS[seatIdx[n]];
    const r = DOT_RADIUS * b.rad;
    const floorBow = Math.abs(p0.y - p2.y) / 2 + 8;
    let cap = Infinity;
    for (let s = 1; s < 60; s++) {
      const t = s / 60;
      const x = p0.x + (p2.x - p0.x) * t;
      const underFlag = (x + r > CN_X && x - r < CN_RIGHT) || (x + r > US_X && x - r < US_RIGHT);
      if (!underFlag) continue;
      const ceiling = FLAG_BOTTOM + FLAG_CLEAR;
      const chord = p0.y + (p2.y - p0.y) * t;
      const w = 2 * (1 - t) * t;
      cap = Math.min(cap, (chord - r - ceiling) / w);
    }
    // Monotonicity outranks the ceiling: an arc that is not monotone in y can
    // rise into its seat through the row below it, and that is the rule the
    // no-overlap proof rests on.
    return Math.min(Math.max(BOW_MIN + (BOW_MAX - BOW_MIN) * hash(b.seed, 53), floorBow),
      Math.max(cap, floorBow));
  });

  return base.map((b, n) => ({
    seed: b.seed,
    rad: b.rad,
    seat: b.seat,
    crosses: seatIdx[n] >= 0,
    target: seatIdx[n] >= 0 ? CHINA_SEATS[seatIdx[n]] : b.seat,
    seatIdx: seatIdx[n],
    bow: bows[n],
    xT0: xT0[n],
    xDur: xDur[n],
    xLand: xLand[n],
  }));
})();

// Where a chip is mid-flight. One quadratic, control point straight above the
// chord's midpoint, walked on a smoothstep — not an ease-out, which over a
// ~400 px chord piles the whole population into the last stride.
const flyAt = (c: Cell, frame: number): Pt => {
  const e = smooth(clamp01((frame - c.xT0) / c.xDur));
  const m = 1 - e;
  const cpx = (c.seat.x + c.target.x) / 2;
  const cpy = (c.seat.y + c.target.y) / 2 - c.bow;
  return {
    x: m * m * c.seat.x + 2 * m * e * cpx + e * e * c.target.x,
    y: m * m * c.seat.y + 2 * m * e * cpy + e * e * c.target.y,
  };
};

// ---------------------------------------------------------------------------
// THE SWEEP, at module scope and at quarter-frame resolution, as cut 3's was.
// Every flyer against every seat already claimed in China. It throws rather
// than letting a frame render with a chip drawn through a chip.
//
// It also measures the thing the ceiling is for — the worst clearance under
// either flag — and, kept apart from the hard test, how close a departing chip
// passes to one still
// sitting in its own block. That second number is the ORIGIN, and it is not a
// fault: a block that empties from the bottom has its lower rows lift off over
// the rows above them, which is what a departure looks like and is exactly
// what cut 3's fifty do on the way out. Cut 3 swept its destination only, for
// the same reason. It is measured here so it is a number rather than a hope.
// ---------------------------------------------------------------------------
export const SWEEP = (() => {
  const CROSSING = CELLS.filter((c) => c.crosses).sort((a, b) => a.xLand - b.xLand);
  const STAY = CELLS.filter((c) => !c.crosses);
  let overlaps = 0;
  let worstOverlap = 0;
  let originGrazes = 0;
  let stayGrazes = 0;
  let flagClear = Infinity;
  for (const c of CROSSING) {
    const r = DOT_RADIUS * c.rad;
    for (let f = c.xT0; f <= c.xLand; f += 0.25) {
      const p = flyAt(c, f);
      // the flags
      if (p.x + r > CN_X && p.x - r < CN_RIGHT) flagClear = Math.min(flagClear, p.y - r - FLAG_BOTTOM);
      if (p.x + r > US_X && p.x - r < US_RIGHT) flagClear = Math.min(flagClear, p.y - r - FLAG_BOTTOM);
      // THE HARD TEST: seats already claimed in China
      for (const o of CROSSING) {
        if (o.xLand >= c.xLand || o.xLand > f) continue;
        const or = DOT_RADIUS * o.rad;
        const d = Math.hypot(p.x - o.target.x, p.y - o.target.y);
        if (d < r + or) {
          overlaps++;
          worstOverlap = Math.max(worstOverlap, r + or - d);
        }
      }
      // the origin, measured and not enforced
      if (f > c.xT0 + 1) {
        for (const o of CROSSING) {
          if (o === c || f >= o.xT0) continue;
          if (Math.hypot(p.x - o.seat.x, p.y - o.seat.y) < r + DOT_RADIUS * o.rad) originGrazes++;
        }
        for (const o of STAY) {
          if (Math.hypot(p.x - o.seat.x, p.y - o.seat.y) < r + DOT_RADIUS * o.rad) stayGrazes++;
        }
      }
    }
  }
  const inFlightAt = (f: number) =>
    CELLS.filter((c) => c.crosses && f >= c.xT0 && f < c.xLand).length;
  const summary = {
    overlaps,
    worstOverlap: Number(worstOverlap.toFixed(2)),
    originGrazes,
    stayGrazes,
    flagClear: Number(flagClear.toFixed(2)),
    span: Number(SCHEDULE.span.toFixed(2)),
    gapFirst: Number((SCHEDULE.launch[1] - SCHEDULE.launch[0]).toFixed(2)),
    gapLast: Number(
      (SCHEDULE.launch[N_CROSS - 1] - SCHEDULE.launch[N_CROSS - 2]).toFixed(2),
    ),
    firstLaunch: Number(SCHEDULE.launch[0].toFixed(2)),
    firstLand: Number(SCHEDULE.land[0].toFixed(2)),
    lastLaunch: Number(SCHEDULE.launch[N_CROSS - 1].toFixed(2)),
    lastLand: Number(SCHEDULE.land[N_CROSS - 1].toFixed(2)),
    durMin: Number(Math.min(...SCHEDULE.dur).toFixed(2)),
    durMax: Number(Math.max(...SCHEDULE.dur).toFixed(2)),
    inFlight80: inFlightAt(80),
    inFlight151: inFlightAt(151),
    inFlight211: inFlightAt(211),
    seatedAt236: CELLS.filter((c) => c.crosses && c.xLand <= 236).length,
  };
  if (overlaps > 0) {
    throw new Error(
      `the crossing puts a flyer through a seated chip: ${overlaps} samples, worst ${worstOverlap.toFixed(1)} px inside`,
    );
  }
  if (flagClear < 0) {
    throw new Error(`an arc passes ${(-flagClear).toFixed(1)} px behind a flag`);
  }
  return summary;
})();

if (SWEEP.seatedAt236 !== N_CROSS) {
  throw new Error(`${SWEEP.seatedAt236} of ${N_CROSS} chips are seated on f236`);
}

// ---------------------------------------------------------------------------
// The flag of China. Copied from cut 1 rather than imported, so cut 1 is never
// touched: the same 240x160 on the shared squircle, the same red, the same
// official 30x20 unit star grid at 8 world px to the unit — the large star at
// (5,5) with a circumscribed radius of 3 units and a point straight up, four
// small stars of radius 1 unit at (10,2), (12,4), (12,7) and (10,9), each
// turned so one of its points aims at the large star's centre — and the same
// accent fill.
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
const CN_CLIP = "cg-cn-clip";
const CN_AT = `translate(${CN_X} ${FLAG_TOP})`;

// ---------------------------------------------------------------------------
// The flag of the United States, drawn to the same 240x160 squircle so the two
// marks are the same object in two colours. Cut 3's construction exactly:
// thirteen stripes red at the even indices, a 96 x 86.15 canton, and fifty
// stars in nine rows of six and five at one through nine of the ten row
// pitches, so the star field is centred in its canton both ways.
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
const US_CLIP = "cg-us-clip";
const US_AT = `translate(${US_X} ${FLAG_TOP})`;

const path = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

const CloseTheGap: React.FC<Props> = ({
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
  dotRadius,
  dotOpacity,
  traceOpacity,
}) => {
  const frame = useCurrentFrame();

  // The one tone ramp a chip ever takes: a chip at rest in the US block is
  // deep, and it goes ripe as it lifts off — it is bought the moment it moves.
  const tone = makeTone(accentDeep, accent);

  // -- what a departing chip leaves behind ------------------------------------
  // The frame a chip leaves its seat, it leaves ITSELF there: the same radius,
  // the same breath, the same deep tone, at the ladder's "present, not the
  // subject" rung. The test is the launch itself, so the trace cannot drift
  // from the chip, and it never fades in, because it is not arriving.
  const traces = CELLS.filter((c) => c.crosses && frame >= c.xT0).map((c) => ({
    key: c.seed,
    x: c.seat.x,
    y: c.seat.y,
    r: dotRadius * c.rad * breath(frame, hash(c.seed, 9)),
  }));

  // -- the chips --------------------------------------------------------------
  const dots = CELLS.map((c) => {
    let x: number;
    let y: number;
    if (!c.crosses || frame < c.xT0) {
      x = c.seat.x;
      y = c.seat.y;
    } else if (frame < c.xLand) {
      const p = flyAt(c, frame);
      x = p.x;
      y = p.y;
    } else {
      x = c.target.x;
      y = c.target.y;
    }
    const t = c.crosses ? smooth((frame - c.xT0) / RIPEN) : 0;
    return {
      key: c.seed,
      x,
      y,
      r: dotRadius * c.rad * breath(frame, hash(c.seed, 9)),
      fill: tone(t),
    };
  });

  // -- camera -----------------------------------------------------------------
  const cam = runCamera(frame, CAM_FF, CAM_CY, CAM_K);
  // cx is fixed at the flags' midpoint, so the only thing sideways is the hand.
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
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
            {/* what the departed leave behind, under everything: a seat in the
                US block still holding a deep chip at OP_UNREAD */}
            {traces.map((t) => (
              <circle
                key={`t${t.key}`}
                cx={t.x}
                cy={t.y}
                r={t.r}
                fill={accentDeep}
                opacity={traceOpacity}
              />
            ))}

            {/* the chips */}
            {dots.map((d) => (
              <circle key={d.key} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={dotOpacity} />
            ))}

            {/* the flag of China, floating from f0 */}
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

            {/* the flag of the United States, floating from f0 */}
            <g style={{ filter: icon }}>
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
                <rect x={US_X} y={FLAG_TOP} width={US_CANTON_W} height={US_CANTON_H} fill={US_BLUE} />
                {US_STARS.map((s, i) => (
                  <path key={`u${i}`} d={`${path(s)} Z`} fill={US_WHITE} />
                ))}
              </g>
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default CloseTheGap;
