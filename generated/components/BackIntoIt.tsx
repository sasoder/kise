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
// The kraft backdrop and the D1 mark are shared with the other two cuts of this
// clip. Imported, never redrawn; the mark is already approved.
import { D1Mark, KRAFT_BASE, KRAFT_BLUR, KRAFT_DIM, KRAFT_SRC, KraftBackground, MARK_SIZE } from "./d1Shared";

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
// "Back into it". Orange Dwarkesh style on the kraft sheet: opaque cutaway,
// 1080x1920, 24fps, two tones of one warm amber, dots solid with no stroke,
// per-icon shadows, one damped camera, one gesture per word.
//
// The picture is a ground line, D1's money standing on it as countable dots,
// and the D1 mark above connected to it by a thread. Height and count against
// one floor; never a chart. Sixty dots is the whole book, and it is the same
// sixty dots all the way through until the end of the line takes twenty-four
// of them away.
//
//   1. BACK INTO IT — the stack is already built at f0 but hanging 150 world px
//      above the ground: one concentrated bet, 60 dots in a column 3 wide and
//      20 tall, out of the market. From f6 it descends as ONE body and lands at
//      f22 on Easing.out(Easing.back)  — a 3 px settle, no bounce. Every dot
//      goes ink-bright for 4 frames as it lands (the house click). From f10 a
//      single thread draws head-led out of the mark's foot and catches the
//      stack's top exactly as it lands, so the mark is joined to the bet at the
//      moment the bet is back on. The camera is TIGHT on it (k 1.55) and dead
//      still                          — "when we got back into it"  f0-22
//   2. LOOK — a hold, and the held breath before the spread. Three ripe packets
//      (r 3) run once down the thread, and the stack takes a single slow breath
//      (1.000 -> 1.015 -> 1.000, scaled about its own base so its feet never
//      leave the ground) over f30-50. The camera does not move
//                                     — "look"                      f38
//   3. MORE DIVERSE — the one big motion, and the only one in the piece.
//      TWELVE MOVES, NOT SIXTY. The column is cut into 12 rigid blocks of 1
//      wide and 5 tall, and a block IS one of the finished stacks of five, so
//      each one travels intact — same 22 px pitch, same vertical order — from
//      its place in the column to its place on the ground. Nothing ever
//      dissolves, so the sixty are conserved in plain sight. One wave, top
//      first: the top layer leaves at f62 and the bottom at f71, each block on
//      ONE arc out and down (a quadratic whose control point rides above the
//      chord, so the high blocks describe a shallow fountain and the bottom
//      three only slide). The row FILLS FROM THE MIDDLE OUTWARD: six
//      symmetrical pairs touch down 1.8 frames apart, f77 to f86, outer last.
//      The single thread frays into 12 at
//      f62 — it keeps its trunk and splits at the point where it used to stop,
//      the top of the bet that has just left — and each branch's head holds
//      ITS block's top dot the whole way out, so the thread is visibly what
//      carries the block. Each block's five dots go ink-bright for 4 frames as
//      it lands, so the click rolls out along the row with it. The camera's
//      one pull-back (k 1.55 -> 1.06, warp 0.72) STARTS
//      at f54, ten frames ahead of "more", so the frame is already opening
//      when the column goes, and the damper has it landed at f80 — four frames
//      before "diverse"
//                                     — "more diverse"              f62-86
//   4. LESS AGGRESSIVE — a second act, one motion. At f113 the top TWO rows of
//      every stack let go together (per-dot 0-4 frame hash), fall straight down
//      through the ground line and fade out: 24 dots gone, the exposure D1 gave
//      up, and the ridge drops from 5 high to 3; the 12 branches settle 44 px
//      with it, so the thread stays ON the book. They dim from live
//      0.95 to idle 0.4 over f113-135 and the 36 that stay ramp ripe -> deep
//      over f118-140: less aggressive is at rest. The camera creeps down and in
//      (k 1.06 -> 1.12, content centre +40) from f108 so the lower ridge does
//      not look like it sank out of the picture
//                                     — "less aggressive"           f113-140
//   5. TAIL — held resolved, never faded: 12 low deep-tone stacks of 3 on the
//      ground, 12 idle threads up to the mark, one packet per thread drifting
//      down at the ambient ceiling, and the kraft's own drift
//                                     — tail                        f141-157
//
// ambient, throughout and not a gesture: `breath` on every dot, `sway` on the
// camera, the backdrop's parallax drift, and — once a thread has found its own
// stack — one packet per thread at the shared ambient ceiling of 0.38.
//
// Two numbers are derived rather than taken from the brief and both are argued
// where they are set: the hang is 150 px rather than 160 (at 160 the top of the
// column passes through the mark at f0 and there is no thread to draw), and the
// landing's back() overshoot is scaled to 0.75 so a 150 px drop settles 3 px
// instead of the 12 px that back(1.5) would put through the ground.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: the aggressive book, and every live thread
  accentDeep: z.string(), // deep: the book at rest, after "less aggressive"
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
  markSize: z.number(),
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
// THE WORLD. Every position below is derived from six numbers — the ground, the
// unit radius, the two pitches, the stack count and the centre — and nothing in
// this piece is placed by eye.
// ---------------------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1400;
export const CENTRE_X = 540;

export const GROUND_Y = 1000;
export const GROUND_X0 = 120;
export const GROUND_X1 = 960;
export const GROUND_W = 5;
export const GROUND_OP = 0.24;

export const DOT_R = 9; // the unit: one dot is one unit of the book
export const PITCH = 22; // the grid, vertically and inside a stack

// The concentrated bet: 60 dots, 3 wide x 20 tall, standing on the ground.
export const COL_COLS = 3;
export const COL_ROWS = 20;
export const N = COL_COLS * COL_ROWS; // 60
export const FOOT_Y = GROUND_Y - 11; // bottom row centre: the dot rests on the line
export const colX = (c: number) => CENTRE_X + (c - (COL_COLS - 1) / 2) * PITCH; // 518 540 562
export const rowY = (r: number) => FOOT_Y - r * PITCH; // 989 .. 571

// After "diverse": the same 60 dots as 12 stacks of 5, 66 px apart.
export const SP_STACKS = 12;
export const SP_ROWS = 5;
export const SP_PITCH = 66;
export const stackX = (j: number) => CENTRE_X + (j - (SP_STACKS - 1) / 2) * SP_PITCH; // 177 .. 903

// After "less aggressive": the top two rows of every stack are gone.
export const SHED_ROWS = 2;
export const KEEP_ROWS = SP_ROWS - SHED_ROWS; // 3

// The mark. It never moves. Its foot is where every thread starts.
export const MARK_X = CENTRE_X;
export const MARK_Y = 340;
export const MARK_FOOT_Y = MARK_Y + MARK_SIZE / 2; // 394

// The thread's far end: the top of whatever it is holding.
export const COL_TOP_Y = rowY(COL_ROWS - 1) - DOT_R; // 562
export const SP_TOP_Y = rowY(SP_ROWS - 1) - DOT_R; // 892

// ---------------------------------------------------------------------------
// 1. BACK INTO IT. The stack is out of the market at f0 — fully built, hanging
// above its own ground — and comes back down as one body.
//
// THE HANG IS 150, NOT THE BRIEF'S 160. At 160 the column's top dot sits at
// world y 402 with its top edge at 393, and the mark's foot is at 394: the
// column passes through the mark at f0 and there is no gap for the thread to
// draw across. 150 leaves 18 px of air at f0, which grows to 168 as the stack
// falls, so the thread's head is chasing a target that is running away from it
// and catches it exactly on the landing.
// ---------------------------------------------------------------------------
export const HANG = 150;
export const DESC_F0 = 6; // "we got"
export const DESC_F1 = 22; // "it" — it lands on the word
// Easing.out(Easing.back(s)) overshoots 4s^3 / (27 (s+1)^2) of the travel.
// back(1.5) is 8.0% = 12.0 px on this 150 px drop, which puts the bottom row
// through the ground line and reads as a bounce. s = 0.75 is 2.04% = 3.06 px:
// the settle the brief asks for, landing on the same frame with the same shape.
export const LAND_BACK = 0.75;

export const CLICK_F = DESC_F1; // the house click-bright, on the landing
export const CLICK_DUR = 4;

export const THREAD_F0 = 10; // "back"
export const THREAD_F1 = 22; // caught, on "it"
export const THREAD_W = 2.5;
export const THREAD_LIVE = 0.95;
export const THREAD_IDLE = 0.4;
export const HEAD_R = 3;

// ---------------------------------------------------------------------------
// 2. LOOK. A hold with two pieces of motion and nothing else: the packets, and
// one breath of the whole stack about its own feet.
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
// 3. MORE DIVERSE. One continuous gesture: the column breaks into twelve rigid
// units and they fly out to their places on the ground.
//
// TWELVE MOVES, NOT SIXTY. The first pass sent all sixty dots out on their own
// hashed arcs, and mid-flight it read as a swarm — a cloud of loose dots with
// nothing in it to count. The eye counts MOVES, and sixty moves is a swarm. So
// the column (3 wide, 20 tall) is cut into TWELVE BLOCKS of 1 wide and 5 tall
// — four layers of three — and a block is exactly one of the finished stacks
// of five. Each block travels INTACT: its five dots keep their 22 px pitch and
// their vertical order the whole way across, so nothing ever dissolves and the
// count is conserved in plain sight. Twelve moves.
//
// WHICH BLOCK GOES WHERE: the higher a block sits, the further it goes — what
// a thing falling from height does. Layer 0, the bottom five rows, fills the
// three stacks at the middle of the row (its centre block slides 33 px and no
// more); layer 3, the top five rows, fills the three at the ends, 385 px out
// and 330 px down. Inside a layer the centre column and the two sides take
// different directions, so the twelve destinations interleave and no two
// blocks in the air are running the same lane.
//
// THE PATH is one quadratic arc per block whose control point rides above the
// chord, so a block lifts slightly before it settles: the high blocks describe
// a shallow fountain and the bottom three a slide. The travel ease is the
// file's own flat-middle `flow`, NOT Easing.inOut(Easing.cubic): inOut cubic
// peaks at 3.00x its own average speed, which on the 507 px blocks is 69 world
// px a frame — about 74 screen px a frame at the pull-back's zoom, well over
// the house cap of 45 — and the travel cannot be lengthened to fix it without
// landing after f86. `flow` has the same zero velocity at both ends and peaks
// at 1.39x, which measures 42 screen px a frame at the worst block.
//
// THE LANDINGS ARE KEYED, NOT DERIVED. Timing the travel straight off distance
// — 12 frames for the shortest, 22 for the longest, over starts that are 9
// frames apart — synchronises the arrivals instead of spreading them: it was
// built that way first and every block touched down inside f83-86, which put
// all sixty dots into the 4-frame landing click at once and flashed the whole
// row white. So the START is keyed off the layer and the END is keyed off the
// stack's RING — how far out from the middle it stands — and the duration is
// whatever joins them. The row then fills from the centre outward in six
// symmetrical pairs, 1.8 frames apart, f77 to f86, and the click rolls out
// along it with about twenty dots lit at a time. Duration still rises with
// distance (4.9 frames on the 11 px slide, 22.8 on the 507 px throw) because
// the far blocks are also the ones that leave first and land last.
// ---------------------------------------------------------------------------
export const POUR_F0 = 62; // "be", two frames ahead of "more"
// One wave, top first: layer 3 at f62, then f65, f68, f71 down the column.
export const LAYER_F = [71, 68, 65, 62]; // index = layer, 0 = the bottom five rows
export const SIDE_LAG = 1; // the centre block of a layer leaves a frame ahead of its sides
export const SIDE_JITTER = 0.6; // and the two sides are hashed apart from each other
export const LAND_F0 = 77; // the middle pair of stacks touches down here
export const LAND_STEP = 1.8; // and each ring further out, this much later: f86 at the ends
export const ARC = 0.13; // the fountain: peak lift above the chord, as a fraction of its length
export const SETTLE_PX = 3; // the landing overshoot, in world px, along the travel
// how far out a stack stands, in pairs: 5 and 6 are ring 0, 0 and 11 are ring 5
export const ring = (j: number) => Math.abs(j - (SP_STACKS - 1) / 2) - 0.5;

export const BLOCK_ROWS = 5;
export const BLOCK_LAYERS = COL_ROWS / BLOCK_ROWS; // 4
// layer -> the stack each of its three columns lands in, as [left, centre, right]
export const LAYER_STACKS: number[][] = [
  [4, 5, 6], // bottom: the middle of the row
  [8, 7, 3],
  [1, 2, 9],
  [11, 10, 0], // top: the ends
];

export type Seat = { x: number; y: number };
export type Block = {
  layer: number;
  col: number;
  stack: number;
  src: Seat; // the block's BOTTOM dot, in the column
  dst: Seat; // the block's BOTTOM dot, in its stack
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
      const stack = LAYER_STACKS[layer][col];
      const src = { x: colX(col), y: rowY(layer * BLOCK_ROWS) };
      const dst = { x: stackX(stack), y: rowY(0) };
      raw.push({ layer, col, stack, src, dst, dx: dst.x - src.x, dy: dst.y - src.y });
    }
  }
  return raw.map((b, i) => {
    const dist = Math.hypot(b.dx, b.dy);
    const start = LAYER_F[b.layer] + (b.col === 1 ? 0 : SIDE_LAG + SIDE_JITTER * hash(i, 11));
    const end = LAND_F0 + LAND_STEP * ring(b.stack);
    const dur = end - start;
    return {
      ...b,
      dist,
      ux: dist === 0 ? 0 : b.dx / dist,
      uy: dist === 0 ? 0 : b.dy / dist,
      start,
      dur,
      end,
      arc: ARC * dist,
      // a couple of px, not a couple of per cent: 2% of a 507 px travel is 10 px
      // and reads as a bounce, and on the 11 px slide a flat 3 px is a lurch
      settle: Math.min(SETTLE_PX, 0.1 * dist),
    };
  });
})();

export const BLOCK_BY_STACK: number[] = (() => {
  const out = new Array<number>(SP_STACKS).fill(0);
  BLOCKS.forEach((b, i) => {
    out[b.stack] = i;
  });
  return out;
})();

// The sixty, five to a block, in block order: i = block * 5 + slot. A dot's
// slot in its finished stack IS its row inside its block, so the block's
// vertical order survives the flight untouched.
export type Plan = {
  src: Seat;
  dst: Seat;
  block: number;
  stack: number;
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
    stack: b.stack,
    slot,
    start: b.start,
    dur: b.dur,
    end: b.end,
  })),
);

// When each stack is complete — its branch is attached to its block's top dot
// the whole way, so this is also when that branch stops moving.
export const STACK_LAND: number[] = Array.from(
  { length: SP_STACKS },
  (_, j) => BLOCKS[BLOCK_BY_STACK[j]].end,
);
export const POUR_END = Math.max(...STACK_LAND); // 86
// the fray: one thread becomes twelve at the moment the first block leaves
export const FRAY_F = POUR_F0;
export const FRAY_DUR = 4;

// ---------------------------------------------------------------------------
// 4. LESS AGGRESSIVE. The top two rows let go, fall through the ground and are
// gone; the threads go idle and the book goes deep.
// ---------------------------------------------------------------------------
export const SHED_F = 113; // "be", one word ahead of "less"
export const SHED_JITTER = 4;
// They LET GO rather than sag: a real initial velocity plus gravity, so the two
// rows are visibly clear of the stack on "aggressive" at f120. Pure gravity was
// built first and rejected — at f120 it had moved them 30 px, which reads as
// the top of every stack going blurry rather than as 24 units leaving.
export const FALL_V0 = 3;
export const FALL_A = 1.2;
export const FALL_FADE = 13; // gone by f130, 210 px down, well under the ground

export const DIM_F0 = 113;
export const DIM_F1 = 135;
export const TONE_F0 = 118; // "aggressive" is at 120
export const TONE_F1 = 140;

// ambient packets: one per thread, from the moment that thread finds its stack
export const AMBIENT_OP = 0.38;
export const AMBIENT_PERIOD = 46;

// ---------------------------------------------------------------------------
// THE CAMERA. Two moves, both motivated, both landed ahead of their word.
//
// The content centre is the midpoint of the mark's top edge (286) and the
// ground (1000), so `cy = centre + CAM_LIFT / k` puts the whole picture's
// middle on screen y 835, under the captions, at every zoom.
//
// There is deliberately NO move under gesture 1. The obvious one — riding the
// stack down so it holds its place on screen — cannot be had here: the mark is
// nailed to the world at y 340, and at k 1.55 a camera that follows 150 px of
// descent carries the mark's top edge from screen y 282 to y 49. A ride small
// enough to keep the mark in frame is 0.12% of the frame per frame, which the
// house rules call a hesitation and say to drop. So the opening is tight and
// dead still, and the motion in it is the stack's own fall.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.55;
export const K_WIDE = 1.06;
export const K_FINAL = 1.12;
export const CONTENT = (MARK_Y - MARK_SIZE / 2 + GROUND_Y) / 2; // 643
export const CONTENT_FINAL = CONTENT + 40;

// The pull-back. It is KEYED f54-72, not f56-80, because the damper is what the
// eye sees and it lags its target: keyed to f80 the zoom is still drifting
// 0.37% a frame on "diverse" and only settles at f86, which is the landing
// arriving after its word. Keyed to f72 the damper is inside 1.2% of the wide
// at f80 and drifting 0.02% a frame by f84 — settled four frames early, which
// is what the house rule asks for. The hand starts moving eight frames before
// the pour either way, so the frame is already opening when the column goes.
export const PULL = camMove({
  f0: 54,
  f1: 72,
  k0: K_OPEN,
  k1: K_WIDE,
  c0: CONTENT,
  c1: CONTENT,
  warp: 0.72,
});
// the creep: down and in, so the ridge that just lost its top two rows stays in
// the middle of the picture instead of reading as having sunk out of it
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
  dotRadius: DOT_R,
  markSize: MARK_SIZE,
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

// The landing, for a block. Easing.out(Easing.back(0.75)) overshoots 2.04% of
// its travel; a block's travel is up to 507 px, and 2% of that is 10 px, which
// is a bounce. So the block keeps the SHAPE of that overshoot and is given a
// fixed couple of px of it: `overshoot(u)` is the part of landEase that sticks
// out past 1, normalised to peak at 1, and it is scaled in world px and applied
// along the block's own direction of travel. One landing per block.
const BACK_PEAK = (4 * LAND_BACK ** 3) / (27 * (LAND_BACK + 1) ** 2); // 0.0204
const overshoot = (u: number) => Math.max(0, landEase(clamp01(u)) - 1) / BACK_PEAK;

// A travel curve with a flat middle. A pour of 60 dots over a 470 px reach on a
// plain smoothstep peaks at 1.5x its own average speed, which at this zoom is
// 49 screen px a frame — over the house cap of 45. This eases in over the first
// 28% and out over the last 28% and runs at one speed in between, so the peak
// is 1.39x the average and the ends still have zero velocity, which is what
// keeps the mass reading as one body rather than as 60 thrown objects.
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

const BackIntoIt: React.FC<Props> = ({
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
  dotRadius,
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = at rest (deep), 1 = aggressive (ripe). Built once per frame.
  const tone = makeTone(accentDeep, accent);

  // -- 1. the descent, one body ----------------------------------------------
  const drop = landEase(clamp01((frame - DESC_F0) / (DESC_F1 - DESC_F0)));
  const hang = HANG * (1 - drop); // world px the column is still off its seats

  // -- 2. the breath, about the stack's own feet -----------------------------
  const bphase = clamp01((frame - BREATH_F0) / (BREATH_F1 - BREATH_F0));
  const stackScale = 1 + BREATH_AMP * Math.sin(Math.PI * bphase);

  // -- 4. the tone and the thread's opacity ----------------------------------
  const toneT = 1 - clamp01((frame - TONE_F0) / (TONE_F1 - TONE_F0));
  const threadOp = interpolate(frame, [DIM_F0, DIM_F1], [THREAD_LIVE, THREAD_IDLE], clamp);
  const click = frame >= CLICK_F && frame < CLICK_F + CLICK_DUR;

  // -- the dots --------------------------------------------------------------
  // One list, sixty entries, from f0 to the last frame. A dot is in its column
  // seat, or riding its BLOCK's one arc, or in its stack seat, or falling out
  // of the picture. Every dot of a block shares its block's g, its bow and its
  // settle, so the five of them are welded together for the whole flight.
  const blockAt = (b: Block) => {
    const u = clamp01((frame - b.start) / b.dur);
    const g = flow(u);
    return { u, g, bow: 4 * g * (1 - g), os: b.settle * overshoot(u) };
  };

  const dots = PLAN.map((p, i) => {
    const b = BLOCKS[p.block];
    const { u, g, bow, os } = blockAt(b);
    let x = p.src.x + b.dx * g + b.ux * os;
    let y = p.src.y + b.dy * g - b.arc * bow + b.uy * os;
    let op = 1;

    if (u === 0) {
      // still the column: the hang, and the one breath about the base
      x = CENTRE_X + (p.src.x - CENTRE_X) * stackScale;
      y = FOOT_Y - (FOOT_Y - p.src.y) * stackScale - hang;
    } else if (u === 1 && p.slot >= KEEP_ROWS) {
      // the top two rows let go and fall through the ground
      const t = frame - (SHED_F + SHED_JITTER * hash(i, 21));
      if (t > 0) {
        y += FALL_V0 * t + FALL_A * t * t;
        op = 1 - clamp01(t / FALL_FADE);
      }
    }

    const r = dotRadius * breath(frame, hash(i, 9));
    // the house click: on the f22 landing for all of them, and then once more
    // per block, on the frame that block touches down
    const lit = click || (frame >= p.end && frame < p.end + CLICK_DUR);
    return { key: i, x, y, r, op, lit };
  });

  // The live top of the column, breath and hang included, so the thread's head
  // sits ON the top dot rather than 6 px above it at the peak of the breath.
  const colTop = FOOT_Y - (FOOT_Y - rowY(COL_ROWS - 1)) * stackScale - hang - DOT_R;

  // -- the thread ------------------------------------------------------------
  // ONE trunk, and twelve branches off its foot.
  //
  // Twelve full-length threads converging on the mark was built first and
  // rejected on the frame: at 500 world px long they carry more accent area
  // than the sixty dots do, and where they converge they merge into a solid
  // wedge — a circus tent over the row, with the subject underneath it. So the
  // thread stays SINGLE for its whole original length and frays only at its
  // foot. The junction is not a new place: it is exactly where the single
  // thread already ended, the top of the concentrated bet, so at f62 the line
  // the mark has been holding since f22 simply splits where it stops.
  const draw = clamp01((frame - THREAD_F0) / (THREAD_F1 - THREAD_F0));
  const junctionY = colTop;
  // the branches' far end follows the stacks down as the top two rows go
  const liveTop = SP_TOP_Y + (rowY(KEEP_ROWS - 1) - DOT_R - SP_TOP_Y) * smoothstep((frame - SHED_F) / 14);
  const trunkY = MARK_FOOT_Y + (junctionY - MARK_FOOT_Y) * draw;
  // A branch is not a line that grows toward a place: it is the line HOLDING
  // its block. Its far end sits on that block's TOP dot from f62 — inside the
  // column at first, where the twelve of them are one bundle down the column's
  // spine — and stays welded to it all the way out, so the block is carried
  // rather than shot. Once the block is down the branch's end is the stack's
  // top, which the shed then pulls 44 px lower with it.
  const fray = clamp01((frame - FRAY_F) / FRAY_DUR);
  const branches = Array.from({ length: SP_STACKS }, (_, j) => {
    const b = BLOCKS[BLOCK_BY_STACK[j]];
    const { u, g, bow, os } = blockAt(b);
    const topRowY = rowY(b.layer * BLOCK_ROWS + BLOCK_ROWS - 1);
    return {
      key: j,
      on: draw >= 1 && fray > 0,
      x2: b.src.x + b.dx * g + b.ux * os,
      y2: u === 1 ? liveTop : topRowY + b.dy * g - b.arc * bow + b.uy * os - DOT_R,
      head: frame >= b.start && u < 1,
    };
  });

  // -- the packets -----------------------------------------------------------
  // "look": three of them, once, down the one thread. Then, from the frame each
  // branch finds its own stack, one ambient packet per branch forever. A packet
  // runs the trunk and then its branch as one path, so the junction is a thing
  // traffic passes through rather than a joint drawn on top of a line.
  const trunkLen = junctionY - MARK_FOOT_Y;
  const packetAt = (j: number, t: number) => {
    const b = branches[j];
    // before the fray there is only the trunk, so "look" runs the one thread
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
  for (let j = 0; j < SP_STACKS; j++) {
    if (frame < STACK_LAND[j]) continue;
    const local = frame - STACK_LAND[j] + hash(j, 31) * AMBIENT_PERIOD;
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
            {/* the ground: one floor, everything is counted against it */}
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

            {/* the thread: one trunk out of the mark's foot, and after "more
                diverse" twelve branches off the point where it used to stop.
                One group, so the twelve that leave the junction together read
                as one line frayed rather than twelve lines stacked, and one
                group opacity carries the live -> idle dim. */}
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

            {/* the book: sixty units, then thirty-six */}
            {dots.map((d) =>
              d.op <= 0.01 ? null : (
                <circle
                  key={d.key}
                  cx={d.x}
                  cy={d.y}
                  r={d.r}
                  fill={d.lit ? ink : tone(toneT)}
                  opacity={d.op}
                />
              ),
            )}

            {/* the mark. It never moves. */}
            <D1Mark x={MARK_X} y={MARK_Y} size={markSize} k={k} dotColor={accent} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default BackIntoIt;
