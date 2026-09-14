import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
// The kraft backdrop, the D1 mark and the company cards are shared with the
// other two cuts of this clip. Imported, never redrawn.
import {
  CARD_SIZE,
  CompanyCard,
  D1Mark,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  MARK_SIZE,
  SECTOR_NAMES,
} from "./d1Shared";

export const FPS = 24;
// Dan Sundheim, D1 Capital, on coming back to shorting after a year out:
// "When we got back into it I said, look, we're going to have to be more
//  diverse, we're going to have to be less aggressive."
//
// SRT span 0:15.480 -> 0:21.339 at 24fps.
// round((21.339 - 15.480) * 24) = round(5.859 * 24) = round(140.6) = 141
// frames of speech, plus a 16 frame tail so the resolved state holds = 157.
export const DURATION = 157;

// Word onsets, in frames from the composition's start (= 15.480):
//   f0 when · f3 we · f7 got · f10 back · f15 into · f22 it · f28 i · f33 said
//   · f38 look · f45 we're · f52 going · f53 to · f57 have · f60 to · f62 be
//   · f64 more · f84 diverse · f84 we're · f91 going · f95 to · f99 have
//   · f110 to · f113 be · f115 less · f120 aggressive · f141 end · tail to f157
//
// ---------------------------------------------------------------------------
// "Back into it", V2. Same beat table, same DURATION, same camera-track shape,
// same `flow`, same rigid-block pour and same shed as V1 — V2 changes WHAT the
// things are, not the rhythm. A stock is no longer an anonymous dot: it is a
// COMPANY CARD, a white tile with a sector glyph knocked out of it, and
// "diverse" is visibly twelve DIFFERENT kinds of company. Money stays amber
// coins, because money is the one thing that should be countable.
//
// The picture is a ground line, twelve cards that will stand on it, D1 above,
// and the coins D1 has on those companies.
//
//   1. BACK INTO IT — at f0 the mark and the ground are there and ONE company
//      (index 5, SMARTPHONE) hangs off the ground with the whole book on it:
//      36 coins, 3 wide and 12 tall, one concentrated bet. Card and pile
//      descend f6-22 as ONE body on `flow`, landing on "it" with a 3 px
//      back(0.75) settle. Single object, so it takes the full house click: the
//      COINS go ink for 4 frames and the tile never flashes. The trunk thread
//      draws head-led out of the mark's bottom edge f10-22 and catches the
//      pile's top coin exactly as it lands. Camera tight (k 1.5) on mark and
//      pile, dead still                   — "when we got back into it"  f0-22
//   2. LOOK — the held breath. Three ripe packets run once down the trunk, and
//      the pile takes a single 1.5% breath about its own base f30-50 so its
//      feet never leave the card. Nothing else, and no camera
//                                          — "look"                     f38
//   3. MORE DIVERSE — one window, two overlapping motions, the only big move in
//      the piece. (a) The other ELEVEN cards slide OUT along the ground from
//      behind the centre card, left and right on `flow`, outermost travelling
//      farthest, and each one arrives SIX FRAMES BEFORE the coins that land on
//      it — so the ground fills from the middle outward as a fan of twelve
//      different glyphs and the money always has something to land on. Each
//      card is masked by the squares of the cards in front of it, so the twelve
//      OCCLUDE rather than overlap and the fan reads as a deck. (b) The pile
//      pours as TWELVE RIGID BLOCKS
//      of three — the V1 pour retargeted onto the cards — starting f62/65/68/71
//      by layer and landing by ring f77 -> f86, each on one arc whose control
//      point rides above the chord, each welded to its own branch head. The
//      trunk frays into twelve at the junction. Group beat, so the landing is
//      the half-step (#FFD98A, 3 frames) per block, never full ink. Camera
//      pull-back k 1.5 -> 1.06 keyed f54-72, landed by f80, four frames ahead
//      of "diverse"                        — "more diverse"             f60-86
//   4. LESS AGGRESSIVE — every pile gives up its TOP COIN together (per-coin
//      0-4 frame hash): twelve coins let go, fall across their own company's
//      tile, through the ground and out of the picture, fading over 12 frames —
//      every pile goes from three to two. The 24 that stay
//      ramp ripe -> deep f118-140, the branches dim 0.95 -> 0.40 over f113-135
//      and settle the 20 px onto the shorter piles. Camera creeps k 1.06 ->
//      1.12, centre +40, f108-126, so the shorter row stays in the middle of
//      the picture                         — "less aggressive"          f113-140
//   5. TAIL — held resolved, never faded: twelve different companies on the
//      ground, two deep coins on each, twelve idle branches, one ambient packet
//      per branch at 0.38, and the kraft's own drift
//                                          — tail                       f141-157
//
// ambient, throughout and not a gesture: `breath` on every coin, `sway` on the
// camera, the backdrop's parallax drift, and one packet per branch from the
// frame that branch finds its own pile.
//
// TWO NUMBERS DEVIATE FROM THE BRIEF AND BOTH ARE ARGUED WHERE THEY ARE SET:
// the hang is 66 px, not 150 (at 150 the pile's top coin sits 65 px ABOVE the
// mark's bottom edge at f0 and the two collide — see HANG), and the cards'
// start spread is ORDERED outward-first rather than randomly hashed (a random
// spread lets an inner card overtake an outer one and the fan inverts — see
// CARD_SPREAD).
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: the aggressive book, and every live thread
  accentDeep: z.string(), // deep: the book at rest, after "less aggressive"
  accentHalf: z.string(), // the half-step click, for a GROUP beat
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
  coinRadius: z.number(),
  markSize: z.number(),
  cardSize: z.number(),
  beats: z.object({
    when: z.number(), // "when"
    we: z.number(), // "we"
    got: z.number(), // "got"
    back: z.number(), // "back"
    into: z.number(), // "into"
    it: z.number(), // "it"
    i: z.number(), // "I"
    said: z.number(), // "said"
    look: z.number(), // "look"
    were1: z.number(), // "we're"
    going1: z.number(), // "going"
    to1: z.number(), // "to"
    have1: z.number(), // "have"
    to2: z.number(), // "to"
    be1: z.number(), // "be"
    more: z.number(), // "more"
    diverse: z.number(), // "diverse"
    were2: z.number(), // "we're"
    going2: z.number(), // "going"
    to3: z.number(), // "to"
    have2: z.number(), // "have"
    to4: z.number(), // "to"
    be2: z.number(), // "be"
    less: z.number(), // "less"
    aggressive: z.number(), // "aggressive"
    end: z.number(), // speech ends; tail to 157
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE WORLD — the V2 shared world, so the three cuts sit on the same floor with
// the same mark and the same company row. Nothing here is placed by eye.
// ---------------------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1400;
export const CENTRE_X = 540;

export const GROUND_Y = 880;
export const GROUND_X0 = 60;
export const GROUND_X1 = 1020;
export const GROUND_W = 5;
// 0.40, not the 0.24 idle: in this cut every pile's height is read against it.
export const GROUND_OP = 0.4;

// The mark. It never moves; its bottom edge is where the trunk starts.
export const MARK_X = CENTRE_X;
export const MARK_Y = 430;
export const MARK_FOOT_Y = MARK_Y + MARK_SIZE / 2; // 484

// The companies. Twelve sectors in SECTOR_NAMES order, left to right, pitch 76
// centred on 540 — so the row spans 122 .. 958 and a card STANDS ON the ground.
export const N_CARDS = SECTOR_NAMES.length; // 12
export const CARD_PITCH = 76;
export const CARD_Y = GROUND_Y - CARD_SIZE / 2; // 844
export const CARD_TOP_Y = GROUND_Y - CARD_SIZE; // 808
export const cardX = (i: number) => CENTRE_X + (i - (N_CARDS - 1) / 2) * CARD_PITCH;
export const CENTRE_CARD = 5; // SMARTPHONE: the one company D1 comes back on

// Money. One coin is one unit of the book; 36 of them all the way through.
export const COIN_R = 9;
export const PITCH_X = 22; // across the concentrated pile
export const PITCH_Y = 20; // up any pile

export const COL_COLS = 3;
export const COL_ROWS = 12;
export const N = COL_COLS * COL_ROWS; // 36
// A coin stands ON the card's top edge, the way a card stands on the ground.
export const FOOT_Y = CARD_TOP_Y - COIN_R; // 798
export const colX = (c: number) => CENTRE_X + (c - (COL_COLS - 1) / 2) * PITCH_X; // 518 540 562
export const rowY = (r: number) => FOOT_Y - r * PITCH_Y; // 798 .. 578

// After "diverse": twelve piles of three, one per company.
export const PILE_ROWS = 3;
// After "less aggressive": every pile gives up its top coin.
export const SHED_ROWS = 1;
export const KEEP_ROWS = PILE_ROWS - SHED_ROWS; // 2

// The thread's far end: the top edge of whatever it is holding.
export const COL_TOP_Y = rowY(COL_ROWS - 1) - COIN_R; // 569
export const PILE_TOP_Y = rowY(PILE_ROWS - 1) - COIN_R; // 749
export const KEPT_TOP_Y = rowY(KEEP_ROWS - 1) - COIN_R; // 769 — 20 px lower

// ---------------------------------------------------------------------------
// 1. BACK INTO IT. One company with the whole book on it, out of the market at
// f0 — fully built, hanging off its own ground — coming back down as one body.
//
// THE HANG IS 66, NOT THE BRIEF'S 150. The V2 world is shorter than V1's: the
// mark's bottom edge is at 484 and the pile's top coin has its top edge at 569,
// so there are only 85 px of air between them when the body is standing. At a
// 150 px hang the pile's top edge starts at 419 — 65 px INSIDE the mark — and
// the two collide for the first thirteen frames, with no gap for the trunk to
// draw across until f14. 66 leaves 19 px of air at f0 (the same margin V1 kept
// at its own hang) growing to 85 as the body falls, so the thread's head is
// chasing a target that is running away from it and catches it on the landing.
// ---------------------------------------------------------------------------
export const HANG = 66;
export const DESC_F0 = 6; // "we got"
export const DESC_F1 = 22; // "it" — it lands on the word
// The travel is `flow` and the landing is the back(0.75) shape scaled to a
// fixed few px along the travel, exactly as a pour block's is: a spring on a
// body this big rings, and a percentage overshoot on a 66 px drop is invisible.
export const DESC_SETTLE = 3;
export const LAND_BACK = 0.75;

export const CLICK_F = DESC_F1; // the house click, on the landing
export const CLICK_DUR = 4; // ONE object arrives, so it is the full ink click
export const GROUP_CLICK_DUR = 3; // a group beat takes the half-step instead

export const THREAD_F0 = 10; // "back"
export const THREAD_F1 = 22; // caught, on "it"
export const THREAD_W = 2.5;
export const THREAD_LIVE = 0.95;
export const THREAD_IDLE = 0.4;
export const HEAD_R = 3;

// ---------------------------------------------------------------------------
// 2. LOOK. A hold with two pieces of motion and nothing else.
// ---------------------------------------------------------------------------
export const PACKET_R = 3;
export const LOOK_F = 38; // "look"
export const LOOK_TRAVEL = 12; // one trip down the thread
export const LOOK_GAP = 4; // between the three of them
export const LOOK_N = 3;

export const BREATH_F0 = 30;
export const BREATH_F1 = 50;
export const BREATH_AMP = 0.015;

// ---------------------------------------------------------------------------
// 3. MORE DIVERSE. Two motions in one window, overlapping rather than
// sequenced: the companies arrive and the money pours onto them.
//
// (b) THE POUR — TWELVE MOVES, NOT THIRTY-SIX, and the V1 mapping unchanged.
// The column (3 wide, 12 tall) is cut into TWELVE BLOCKS of 1 wide and 3 tall
// — four layers of three — and a block IS one of the finished piles of three.
// Each block travels INTACT: its coins keep their 20 px pitch and their order
// the whole way, so nothing dissolves and the 36 are conserved in plain sight.
// The higher a block sits the further it goes: layer 0 fills the middle of the
// row (its centre block only slides the 38 px from the column's axis onto card
// 5, which is where card 5 ends up), layer 3 fills the ends.
//
// THE PATH is one quadratic arc per block, control point above the chord, so
// the high blocks describe a shallow fountain and the bottom three only slide.
// The travel ease is `flow`, whose peak is 1.39x its own average: the worst
// block covers 475 px and peaks at 29 world px a frame, ~33 screen px at the
// zoom it is travelling through, inside the house cap of 45.
//
// THE LANDINGS ARE KEYED, NOT DERIVED: the START is keyed off the layer, the
// END off the card's RING — how far out from the middle it stands — and the
// duration is whatever joins them. The row fills from the centre outward in six
// symmetrical pairs, 1.8 frames apart, f77 to f86.
// ---------------------------------------------------------------------------
export const POUR_F0 = 62; // "be", two frames ahead of "more"
export const LAYER_F = [71, 68, 65, 62]; // index = layer, 0 = the bottom three rows
export const SIDE_LAG = 1; // the centre block of a layer leaves a frame ahead of its sides
export const SIDE_JITTER = 0.6; // and the two sides are hashed apart from each other
export const LAND_F0 = 77; // the middle pair of piles touches down here
export const LAND_STEP = 1.8; // and each ring further out, this much later: f86 at the ends
export const ARC = 0.13; // the fountain: peak lift above the chord, as a fraction of its length
export const SETTLE_PX = 3; // the landing overshoot, in world px, along the travel
// how far out a card stands, in pairs: 5 and 6 are ring 0, 0 and 11 are ring 5
export const ring = (j: number) => Math.abs(j - (N_CARDS - 1) / 2) - 0.5;

export const BLOCK_ROWS = 3;
export const BLOCK_LAYERS = COL_ROWS / BLOCK_ROWS; // 4
// layer -> the card each of its three columns lands on, as [left, centre, right]
export const LAYER_CARDS: number[][] = [
  [4, 5, 6], // bottom: the middle of the row
  [8, 7, 3],
  [1, 2, 9],
  [11, 10, 0], // top: the ends
];

export type Seat = { x: number; y: number };
export type Block = {
  layer: number;
  col: number;
  card: number;
  src: Seat; // the block's BOTTOM coin, in the column
  dst: Seat; // the block's BOTTOM coin, on its card
  dx: number;
  dy: number;
  dist: number;
  ux: number; // the travel's unit direction, for the landing settle
  uy: number;
  start: number;
  dur: number;
  end: number;
  arc: number;
  settle: number;
};

export const BLOCKS: Block[] = (() => {
  const raw: Omit<Block, "dist" | "ux" | "uy" | "start" | "dur" | "end" | "arc" | "settle">[] = [];
  for (let layer = 0; layer < BLOCK_LAYERS; layer++) {
    for (let col = 0; col < COL_COLS; col++) {
      const card = LAYER_CARDS[layer][col];
      const src = { x: colX(col), y: rowY(layer * BLOCK_ROWS) };
      const dst = { x: cardX(card), y: rowY(0) };
      raw.push({ layer, col, card, src, dst, dx: dst.x - src.x, dy: dst.y - src.y });
    }
  }
  return raw.map((b, i) => {
    const dist = Math.hypot(b.dx, b.dy);
    const start = LAYER_F[b.layer] + (b.col === 1 ? 0 : SIDE_LAG + SIDE_JITTER * hash(i, 11));
    const end = LAND_F0 + LAND_STEP * ring(b.card);
    return {
      ...b,
      dist,
      ux: dist === 0 ? 0 : b.dx / dist,
      uy: dist === 0 ? 0 : b.dy / dist,
      start,
      dur: end - start,
      end,
      arc: ARC * dist,
      // a couple of px, not a couple of per cent
      settle: Math.min(SETTLE_PX, 0.1 * dist),
    };
  });
})();

export const BLOCK_BY_CARD: number[] = (() => {
  const out = new Array<number>(N_CARDS).fill(0);
  BLOCKS.forEach((b, i) => {
    out[b.card] = i;
  });
  return out;
})();

// The thirty-six, three to a block, in block order: i = block * 3 + slot. A
// coin's slot in its finished pile IS its row inside its block, so the block's
// vertical order survives the flight untouched.
export type Plan = {
  src: Seat;
  dst: Seat;
  block: number;
  card: number;
  slot: number;
  start: number;
  dur: number;
  end: number;
};

export const PLAN: Plan[] = BLOCKS.flatMap((b, block) =>
  Array.from({ length: BLOCK_ROWS }, (_, slot) => ({
    src: { x: b.src.x, y: rowY(b.layer * BLOCK_ROWS + slot) },
    dst: { x: b.dst.x, y: rowY(slot) },
    block,
    card: b.card,
    slot,
    start: b.start,
    dur: b.dur,
    end: b.end,
  })),
);

// When each pile is complete — its branch is attached to its block's top coin
// the whole way, so this is also when that branch stops moving.
export const PILE_LAND: number[] = Array.from(
  { length: N_CARDS },
  (_, j) => BLOCKS[BLOCK_BY_CARD[j]].end,
);
export const POUR_END = Math.max(...PILE_LAND); // 86
// the fray: one thread becomes twelve at the moment the first block leaves
export const FRAY_F = POUR_F0;
export const FRAY_DUR = 4;

// ---------------------------------------------------------------------------
// 3(a). THE COMPANIES ARRIVING. Eleven cards slide out from behind the twelfth,
// along the ground, each ARRIVING SIX FRAMES BEFORE its coins do — that lead is
// the whole reason the two motions overlap instead of queueing, and it is what
// makes the money land on something rather than beside it.
//
// THE START SPREAD IS ORDERED, NOT HASHED. The brief asks for a 0-3 frame hash
// on the starts; a random one inverts the fan. Twelve cards leaving one point
// for a row that is 72 px wide at a 76 px pitch are necessarily overlapping for
// most of the travel, so the only thing that keeps the picture legible is that
// the further-out card is ALWAYS further out — a fanned deck. Measured on the
// worst pair (cards 10 and 11 at f66) the margin between them is 3 px, so a
// card handed a start three frames late is overtaken by its inner neighbour and
// the deck folds through itself. So the spread runs OUTWARD-FIRST — ring 5
// leaves at f60 and ring 0 at f63 — with 0.4 frames of hash left on top to
// break the left/right symmetry. Outer leaves first, travels farthest, lands
// last, and the order across the row is monotonic at every frame.
// ---------------------------------------------------------------------------
export const CARD_F0 = 60;
export const CARD_SPREAD = 3; // ring 5 at f60, ring 0 at f63
export const CARD_JITTER = 0.4;
export const CARD_LEAD = 6; // frames a card is home before its coins arrive

export type CardPlan = {
  i: number;
  ring: number;
  x1: number;
  dist: number;
  ux: number;
  start: number;
  end: number;
  settle: number;
};

export const CARDS: CardPlan[] = Array.from({ length: N_CARDS }, (_, i) => {
  const r = ring(i);
  const x1 = cardX(i);
  const dx = x1 - CENTRE_X;
  const dist = Math.abs(dx);
  return {
    i,
    ring: r,
    x1,
    dist,
    ux: dist === 0 ? 0 : dx / dist,
    start: CARD_F0 + CARD_SPREAD * (1 - r / 5) + CARD_JITTER * hash(i, 13),
    end: PILE_LAND[i] - CARD_LEAD,
    settle: Math.min(SETTLE_PX, 0.1 * dist),
  };
});
// Draw order, back to front: furthest-out at the back, the company D1 came
// back on in front of all of them, so the eleven read as a deck fanning out
// from the twelfth rather than as eleven tiles crossing each other.
//
// And they have to OCCLUDE, not overlap. A card tile is white at OP_READ 0.9
// with its glyph knocked out of it, so two cards on top of each other show
// both glyphs at once and the middle of the fan turns into a double exposure —
// which it did on the first pass, all through f62-80. So every card is masked
// by the squares of the cards in FRONT of it: each one is uncovered exactly at
// its neighbour's edge, its neighbour's knocked out glyph stays kraft, and the
// fan reads as twelve opaque things sliding past each other.
export const CARD_Z: number[] = [
  ...CARDS.filter((c) => c.i !== CENTRE_CARD)
    .sort((a, b) => b.ring - a.ring)
    .map((c) => c.i),
  CENTRE_CARD,
];

// ---------------------------------------------------------------------------
// 4. LESS AGGRESSIVE. Every pile gives up its top coin and cools.
// ---------------------------------------------------------------------------
export const SHED_F = 113; // "be", one word ahead of "less"
export const SHED_JITTER = 4;
// They LET GO rather than sag: a real initial velocity plus gravity.
//
// V1's 3 / 1.2 was tuned for coins falling through open air onto a bare ground
// line. Here every pile stands on a 72 px card and the coin below it is only 20
// px away, so at that speed the shed coin spends its first four frames sitting
// on top of the coin it just left and the next four smeared across a white
// tile: on "aggressive" at f120 the whole row read as twelve blurred pile tops
// rather than twelve coins leaving. 7 / 1.0 clears the kept coin in two frames
// and the card in five, and is past the ground by t9, so the whole departure
// is eight legible frames instead of four muddled ones.
// Peak 31 world px a frame at t12, ~33 screen px: inside the house cap.
export const FALL_V0 = 7;
export const FALL_A = 1;
// AND IT HOLDS ITS INK WHILE IT CROSSES THE TILE. A coin that starts fading the
// frame it lets go is down to 0.4 by the time it is over its company's glyph,
// which is the one place it has to be read: measured on f120, the twelve of
// them were pale smudges on twelve white tiles. So the coin keeps full opacity
// for six frames — long enough to travel the pile, the gap and most of the card
// — and fades over the six after that, which is exactly the stretch where it is
// below the ground line and on its way out of the picture.
export const FALL_HOLD = 6;
export const FALL_FADE = 6;

export const DIM_F0 = 113;
export const DIM_F1 = 135;
export const TONE_F0 = 118; // "aggressive" is at 120
export const TONE_F1 = 140;

// ambient packets: one per branch, from the moment that branch finds its pile
export const AMBIENT_OP = 0.38;
export const AMBIENT_PERIOD = 46;

// ---------------------------------------------------------------------------
// THE CAMERA. V1's track, shape for shape: tight and dead still over the
// descent, one pull-back keyed f54-72 that is landed by f80 — four frames ahead
// of "diverse" — and one creep under "less aggressive".
//
// The content centre is the midpoint of the mark's top edge (376) and the
// ground (880), so `cy = centre + CAM_LIFT / k` puts the picture's middle on
// screen y 835, under the captions, at every zoom.
//
// There is deliberately NO move under gesture 1: the mark is nailed to the
// world, so a camera that rode the descent would carry it out of frame, and a
// ride small enough to keep it in is under 1% a frame, which the house rules
// call a hesitation and say to drop. The opening is still, and the motion in it
// is the body's own fall.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.5;
export const K_WIDE = 1.06; // the whole row, 122-958, inside the frame with 55 px of margin
export const K_FINAL = 1.02; // was 1.12: at 1.12 the outer cards sat 30 px from the frame edge; 1.02 gives ~75
export const CONTENT = (MARK_Y - MARK_SIZE / 2 + GROUND_Y) / 2; // 628
export const CONTENT_FINAL = CONTENT + 40;

export const PULL = camMove({
  f0: 54,
  f1: 72,
  k0: K_OPEN,
  k1: K_WIDE,
  c0: CONTENT,
  c1: CONTENT,
  warp: 0.72,
});
export const CREEP = camMove({
  f0: 108,
  f1: 126,
  k0: K_WIDE,
  k1: K_FINAL,
  c0: CONTENT,
  c1: CONTENT_FINAL,
  warp: 1,
});
export const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL;
export const CAM_F = [0, ...PULL.F, ...CREEP.F, DURATION];
export const CAM_K = [K_OPEN, ...PULL.K, ...CREEP.K, K_FINAL];
export const CAM_CY = [PULL.CY[0], ...PULL.CY, ...CREEP.CY, CY_FINAL];

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  accentHalf: "#FFD98A",
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  coinRadius: COIN_R,
  markSize: MARK_SIZE,
  cardSize: CARD_SIZE,
  beats: {
    when: 0,
    we: 3,
    got: 7,
    back: 10,
    into: 15,
    it: 22,
    i: 28,
    said: 33,
    look: 38,
    were1: 45,
    going1: 52,
    to1: 53,
    have1: 57,
    to2: 60,
    be1: 62,
    more: 64,
    diverse: 84,
    were2: 84,
    going2: 91,
    to3: 95,
    have2: 99,
    to4: 110,
    be2: 113,
    less: 115,
    aggressive: 120,
    end: 141,
  },
});

const landEase = Easing.out(Easing.back(LAND_BACK));

// `overshoot(u)` is the part of landEase that sticks out past 1, normalised to
// peak at 1, so it can be scaled in world px and applied along a travel's own
// direction. One landing per thing that arrives, never on a hold.
const BACK_PEAK = (4 * LAND_BACK ** 3) / (27 * (LAND_BACK + 1) ** 2); // 0.0204
const overshoot = (u: number) => Math.max(0, landEase(clamp01(u)) - 1) / BACK_PEAK;

// A travel curve with a flat middle. Eases in over the first 28% and out over
// the last 28% and runs at one speed in between, so the peak is 1.39x the
// average and the ends still have zero velocity — which is what keeps a mass
// reading as one body rather than as n thrown objects.
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

// Where a card is at this frame, and how far it has come.
export const cardAt = (c: CardPlan, frame: number) => {
  const u = clamp01((frame - c.start) / (c.end - c.start));
  const g = flow(u);
  return { u, x: CENTRE_X + (c.x1 - CENTRE_X) * g + c.ux * c.settle * overshoot(u) };
};

const BackIntoItV2: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  accentHalf,
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
  coinRadius,
  markSize,
  cardSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = at rest (deep), 1 = aggressive (ripe). Built once per frame.
  const tone = makeTone(accentDeep, accent);

  // -- 1. the descent, card and pile as one body -----------------------------
  const du = clamp01((frame - DESC_F0) / (DESC_F1 - DESC_F0));
  const hang = HANG * (1 - flow(du)) - DESC_SETTLE * overshoot(du);

  // -- 2. the breath, about the pile's own base ------------------------------
  const bphase = clamp01((frame - BREATH_F0) / (BREATH_F1 - BREATH_F0));
  const pileScale = 1 + BREATH_AMP * Math.sin(Math.PI * bphase);

  // -- 4. the tone and the thread's opacity ----------------------------------
  const toneT = 1 - clamp01((frame - TONE_F0) / (TONE_F1 - TONE_F0));
  const threadOp = interpolate(frame, [DIM_F0, DIM_F1], [THREAD_LIVE, THREAD_IDLE], clamp);
  const openClick = frame >= CLICK_F && frame < CLICK_F + CLICK_DUR;

  // -- the companies ---------------------------------------------------------
  // Card 5 carries the concentrated bet from f0 and is drawn LAST, on top. The
  // other eleven sit exactly behind it until they leave, and the group they are
  // in is masked by card 5's own square, so nothing shows through its knocked
  // out glyph and each card is uncovered exactly at its edge.
  const cards = CARDS.map((c) => {
    const { x } = cardAt(c, frame);
    return { i: c.i, x, on: c.i === CENTRE_CARD || frame >= c.start };
  });
  const cardTop = CARD_Y - hang;
  // back to front, each one carrying the squares of everything in front of it
  const cardLayers = CARD_Z.map((i, p) => ({
    i,
    occluders: CARD_Z.slice(p + 1).filter((q) => cards[q].on),
  })).filter((l) => cards[l.i].on);

  // -- the coins -------------------------------------------------------------
  // One list, thirty-six entries, from f0 to the last frame. A coin is in its
  // column seat, or riding its BLOCK's one arc, or in its pile seat, or falling
  // out of the picture. Every coin of a block shares its block's g, its bow and
  // its settle, so the three of them are welded together for the whole flight.
  const blockAt = (b: Block) => {
    const u = clamp01((frame - b.start) / b.dur);
    const g = flow(u);
    return { u, g, bow: 4 * g * (1 - g), os: b.settle * overshoot(u) };
  };

  const coins = PLAN.map((p, i) => {
    const b = BLOCKS[p.block];
    const { u, g, bow, os } = blockAt(b);
    let x = p.src.x + b.dx * g + b.ux * os;
    let y = p.src.y + b.dy * g - b.arc * bow + b.uy * os;
    let op = 1;
    let fell = false;

    if (u === 0) {
      // still the concentrated bet: the hang, and the one breath about its base
      x = CENTRE_X + (p.src.x - CENTRE_X) * pileScale;
      y = FOOT_Y - (FOOT_Y - p.src.y) * pileScale - hang;
    } else if (u === 1 && p.slot >= KEEP_ROWS) {
      // the top coin of every pile lets go and falls through the ground
      const t = frame - (SHED_F + SHED_JITTER * hash(i, 21));
      if (t > 0) {
        y += FALL_V0 * t + FALL_A * t * t;
        op = 1 - clamp01((t - FALL_HOLD) / FALL_FADE);
        fell = true;
      }
    }

    const r = coinRadius * breath(frame, hash(i, 9));
    // one object landing takes the full ink click; a block landing inside a
    // group beat takes the half-step
    const grouped = frame >= p.end && frame < p.end + GROUP_CLICK_DUR;
    return {
      key: i,
      x,
      y,
      r,
      op,
      falling: fell,
      fill: openClick ? ink : grouped ? accentHalf : tone(toneT),
    };
  });
  const shed = coins.filter((d) => d.falling && d.op > 0.01);
  const held = coins.filter((d) => !d.falling);

  // The live top of the column, breath and hang included, so the thread's head
  // sits ON the top coin rather than above it at the peak of the breath.
  const colTop = FOOT_Y - (FOOT_Y - rowY(COL_ROWS - 1)) * pileScale - hang - coinRadius;

  // -- the thread ------------------------------------------------------------
  // ONE trunk out of the mark's bottom edge, and twelve branches off its foot.
  // The junction is not a new place: it is exactly where the single thread
  // already ended — the top of the concentrated bet — so at f62 the line the
  // mark has been holding since f22 simply splits where it stops.
  const draw = clamp01((frame - THREAD_F0) / (THREAD_F1 - THREAD_F0));
  const junctionY = colTop;
  // the branches' far end follows the piles down as the top coins go
  const liveTop = PILE_TOP_Y + (KEPT_TOP_Y - PILE_TOP_Y) * smoothstep((frame - SHED_F) / 14);
  const trunkY = MARK_FOOT_Y + (junctionY - MARK_FOOT_Y) * draw;
  // A branch is not a line that grows toward a place: it is the line HOLDING
  // its block. Its far end sits on that block's TOP coin from f62 — inside the
  // column at first, where the twelve of them are one bundle down the column's
  // spine — and stays welded to it all the way out, so the block is carried
  // rather than shot.
  const fray = clamp01((frame - FRAY_F) / FRAY_DUR);
  const branches = Array.from({ length: N_CARDS }, (_, j) => {
    const b = BLOCKS[BLOCK_BY_CARD[j]];
    const { u, g, bow, os } = blockAt(b);
    const topRowY = rowY(b.layer * BLOCK_ROWS + BLOCK_ROWS - 1);
    return {
      key: j,
      on: draw >= 1 && fray > 0,
      x2: b.src.x + b.dx * g + b.ux * os,
      y2: u === 1 ? liveTop : topRowY + b.dy * g - b.arc * bow + b.uy * os - coinRadius,
      head: frame >= b.start && u < 1,
    };
  });

  // -- the packets -----------------------------------------------------------
  // "look": three of them, once, down the one thread. Then, from the frame each
  // branch finds its own pile, one ambient packet per branch forever. A packet
  // runs the trunk and then its branch as one path, so the junction is a thing
  // traffic passes through rather than a joint drawn on top of a line.
  const trunkLen = junctionY - MARK_FOOT_Y;
  const packetAt = (j: number, t: number) => {
    const b = branches[j];
    const bLen = b.on ? Math.hypot(b.x2 - CENTRE_X, b.y2 - junctionY) : 0;
    const d = clamp01(t) * (trunkLen + bLen);
    if (d <= trunkLen || bLen === 0) return { x: MARK_X, y: MARK_FOOT_Y + Math.min(d, trunkLen) };
    const f = (d - trunkLen) / bLen;
    return { x: CENTRE_X + (b.x2 - CENTRE_X) * f, y: junctionY + (b.y2 - junctionY) * f };
  };
  type Pk = { key: string; t: number; j: number; op: number };
  const packets: Pk[] = [];
  for (let n = 0; n < LOOK_N; n++) {
    const t = (frame - (LOOK_F + n * LOOK_GAP)) / LOOK_TRAVEL;
    if (t > 0 && t < 1) packets.push({ key: `l${n}`, t, j: 0, op: THREAD_LIVE });
  }
  for (let j = 0; j < N_CARDS; j++) {
    if (frame < PILE_LAND[j]) continue;
    const local = frame - PILE_LAND[j] + hash(j, 31) * AMBIENT_PERIOD;
    const t = (local % AMBIENT_PERIOD) / (LOOK_TRAVEL + 6);
    if (t > 0 && t < 1) packets.push({ key: `a${j}`, t, j, op: AMBIENT_OP });
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

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
            <defs>
              {cardLayers.map((l) =>
                l.occluders.length ? (
                  <mask
                    key={l.i}
                    id={`bi2-occ-${l.i}`}
                    maskUnits="userSpaceOnUse"
                    x={0}
                    y={0}
                    width={WORLD_W}
                    height={WORLD_H}
                  >
                    <rect x={0} y={0} width={WORLD_W} height={WORLD_H} fill="#fff" />
                    {l.occluders.map((q) => (
                      <rect
                        key={q}
                        x={cards[q].x - cardSize / 2}
                        y={cardTop - cardSize / 2}
                        width={cardSize}
                        height={cardSize}
                        fill="#000"
                      />
                    ))}
                  </mask>
                ) : null,
              )}
            </defs>

            {/* the ground: one floor, every pile is counted against it */}
            <line
              x1={GROUND_X0}
              y1={GROUND_Y}
              x2={GROUND_X1}
              y2={GROUND_Y}
              stroke={ink}
              strokeWidth={GROUND_W}
              strokeLinecap="round"
              opacity={GROUND_OP}
              style={{ filter: icon }}
            />

            {/* the twelve companies, furthest-out at the back, every one of
                them masked by the squares of the cards in front of it */}
            {cardLayers.map((l) => (
              <g key={l.i} mask={l.occluders.length ? `url(#bi2-occ-${l.i})` : undefined}>
                <CompanyCard
                  x={cards[l.i].x}
                  y={cardTop}
                  sector={SECTOR_NAMES[l.i]}
                  size={cardSize}
                  k={k}
                />
              </g>
            ))}

            {/* the thread: one trunk out of the mark's bottom edge, and after
                "more diverse" twelve branches off the point where it used to
                stop. One group, so the twelve that leave the junction together
                read as one line frayed rather than twelve lines stacked. */}
            {draw > 0 ? (
              <g opacity={threadOp} style={{ filter: icon }}>
                <line
                  x1={MARK_X}
                  y1={MARK_FOOT_Y}
                  x2={MARK_X}
                  y2={trunkY}
                  stroke={accent}
                  strokeWidth={THREAD_W}
                  strokeLinecap="round"
                />
                <g opacity={fray}>
                  {branches.map((b) =>
                    b.on ? (
                      <line
                        key={b.key}
                        x1={CENTRE_X}
                        y1={junctionY}
                        x2={b.x2}
                        y2={b.y2}
                        stroke={accent}
                        strokeWidth={THREAD_W}
                        strokeLinecap="round"
                      />
                    ) : null,
                  )}
                  {branches.map((b) =>
                    b.on && b.head ? (
                      <circle key={`h${b.key}`} cx={b.x2} cy={b.y2} r={HEAD_R} fill={ink} />
                    ) : null,
                  )}
                </g>
                {draw < 1 ? <circle cx={MARK_X} cy={trunkY} r={HEAD_R} fill={ink} /> : null}
              </g>
            ) : null}

            {/* packets, down the trunk and out along a branch */}
            {packets.map((p) => {
              const at = packetAt(p.j, p.t);
              return (
                <circle key={p.key} cx={at.x} cy={at.y} r={PACKET_R} fill={accent} opacity={p.op} />
              );
            })}

            {/* the coins that have been let go, OVER the row: amber crossing a
                white tile is the clearest read of money leaving a company, and
                a coin dropped behind the row is simply gone — built that way
                first, and at f120 every pile had quietly become two with
                nothing seen to leave it */}
            {shed.map((d) => (
              <circle key={`s${d.key}`} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={d.op} />
            ))}

            {/* the money: thirty-six units, then twenty-four */}
            {held.map((d) => (
              <circle key={d.key} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={d.op} />
            ))}

            {/* the mark. It never moves. */}
            <D1Mark x={MARK_X} y={MARK_Y} size={markSize} k={k} dotColor={accent} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default BackIntoItV2;
