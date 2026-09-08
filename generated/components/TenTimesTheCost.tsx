import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_READ_DOT,
  OP_UNREAD,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  hash,
  iconShadow,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Debt_Crisis`: "even at the data center level. If you,
// like, build a data center and you're trying to get it rented out to Anthropic
// and OpenAI for like 10x what it costs you on a depreciated basis to build it".
//
// SRT span 0:08.619 -> 0:17.839 at 24fps.
// round((17.839 - 8.619) * 24) = round(9.220 * 24) = round(221.28) = 221
// frames of speech, plus a 16 frame tail so the resolved state holds = 237.
export const DURATION = 237;

// ---------------------------------------------------------------------------
// "One into ten". A data center is a human-made thing, so it is ink geometry
// built from the field's own primitives: six white ink rings in a 3x2 lattice
// joined by seven ink lines, ~320 world px wide, at world (540, 0), each ring
// pushed off the lattice by a hashed offset so it is a cluster and not a grid.
// Money is the field's dots: a block of 4 x 3 solid dots at a 22px step is one
// unit. The cost is ONE block in the deep tone on the left of the building; the
// rent is TEN blocks in the ripe tone stacked in a column on the right, on the
// same baseline. The tenants are the two marks above it, tied to it by two
// accent threads.
//
// There is no crowd in this piece. The field is the grid, the vignette, the
// global shadow and the per-icon shadow on every ring, line, packet and mark.
//
// Every gesture is one word. Nothing else happens.
//   the plan: six rings and seven edges draw DASHED
//     (9/7, ink at OP_UNREAD), head-led, in reading
//     order                                        — "even at the data
//                                                     center level"      f0-30
//   the ink: solid rings and edges draw over the
//     plan in the same order, head-led with the
//     white tip, the dashed line disappearing under
//     the solid one as the head passes; 4-frame
//     click-bright on completion, then OP_READ      — "like build a data
//                                                     center"            f37-60
//   two accent threads leave the structure upward,
//     left first, right four frames later, each
//     ending at an empty spot                       — "get rented out to" f89-107
//   the Anthropic mark lands at the left thread's
//     end, 0->1 and 0.86->1 over 6 frames, ease-out  — "Anthropic"        f113
//   the OpenAI mark lands the same way on the right — "and OpenAI"        f121
//   the one camera move: pull back k 1.5 -> 1.0,
//     content centre 0 -> -308, keyed f118-134,
//     settled (k within 0.5%) by f141               — "ai for like"      f118-141
//   ten ripe blocks arrive one after another from
//     BEYOND THE RIGHT FRAME EDGE at their seat's
//     height, each on its own shallow arc, bottom
//     seat first; a block travels as a rigid group
//     of 12 dots                                    — "10x"               f136-186
//   the ONE deep block arrives from beyond the LEFT
//     frame edge and lands on the baseline; the
//     comparison completes while the rent is still
//     arriving                                      — "what it costs you" f156-166
//   the cost block is written down: its top row of
//     4 dots shrinks away, then its middle row, and
//     one deep row of 4 remains — the depreciated
//     basis                                         — "depreciated"       f186-207
//   nothing new; the resolved frame holds to the
//     tail                                          — "build it"          f212-237
//
// ambient: the structure's own packets from f60 — a 4px ink bead running one of
// its edges over 14 frames, a new one every 7, two alive at once — and from
// f125 one small white packet at a time travelling DOWN a thread from a mark to
// its ring, alternating threads, one every 8 frames. Neither is a gesture; they
// are what a rented, running building looks like.
//
// orange dwarkesh style: ACCENT / ACCENT_DEEP, solid dots with no stroke,
// BG_DIM 0.45, global drop-shadow 2/7/0.12, per-icon drop-shadow 2/3/0.38,
// one eased camera move (warp 0.72) with cy taken off the eased k.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: the rent
  accentDeep: z.string(), // deep: the cost
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
  dotOpacity: z.number(), // a money dot is solid; the ladder is tone
  beats: z.object({
    evenAt: z.number(), // "even at"
    dataCenter: z.number(), // "the data center"
    level: z.number(), // "level (if you)"
    likeBuild: z.number(), // "like build"
    aDataCenter: z.number(), // "a data center"
    andYoureLike: z.number(), // "and you're like"
    tryingTo: z.number(), // "trying to"
    getRented: z.number(), // "get rented"
    outTo: z.number(), // "out to"
    anthropic: z.number(), // "anthropic"
    andOpenai: z.number(), // "and OpenAI"
    aiForLike: z.number(), // "ai for like 10x"
    tenX: z.number(), // "10x" itself
    whatIt: z.number(), // "what it"
    costsYou: z.number(), // "costs you on a"
    depreciated: z.number(), // "depreciated"
    basisTo: z.number(), // "basis to"
    buildIt: z.number(), // "build it"
    end: z.number(), // speech ends; tail to 237
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
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_READ_DOT,
  beats: {
    evenAt: 0,
    dataCenter: 6,
    level: 17,
    likeBuild: 37,
    aDataCenter: 49,
    andYoureLike: 64,
    tryingTo: 79,
    getRented: 89,
    outTo: 107,
    anthropic: 113,
    andOpenai: 121,
    aiForLike: 127,
    tenX: 141,
    whatIt: 156,
    costsYou: 167,
    depreciated: 186,
    basisTo: 201,
    buildIt: 212,
    end: 221,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2200;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------------------------
// The camera. ONE move: the pull-back off "for like", keyed f118-134, warp 0.72
// so the speed is early in the move. cy comes from the eased k at every frame,
// so the composition's centre sits at screen y 835 at every camera position and
// not only at the ends of the ramp.
//
//   f0-118   k 1.5, content centre 0   the structure alone, drawn and running,
//                                      the frame tight on it and the two marks
//   f118-134 -> k 1.0, centre -308     the reveal: the ten seats above the
//                                      building and the ground beside it
//
// C1 = -308 is the midpoint of the resolved composition in world y: the rent
// column's top row of dots at -708 and the cost block's bottom row at +92.
// At k 1.0 that puts the composition's centre at screen y 835, its top (the
// tenth block) at 430 and its bottom (the cost block) at 1241, with 211px of
// margin on each side. The marks at world y -290 sit at screen 853 - well
// inside it - and nothing is below 1480.
// ---------------------------------------------------------------------------
const STRUCT_CX = 540;
const K_OPEN = 1.5;
const K_FINAL = 1.0;
const C1 = -308;
const CY_FINAL = C1 + 125 / K_FINAL;
const CAM = camMove({ f0: 118, f1: 134, k0: K_OPEN, k1: K_FINAL, c0: 0, c1: C1, warp: 0.72 });
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [125 / K_OPEN, ...CAM.CY, CY_FINAL];
// the world x of the frame's edges once the camera has stopped; arrivals start
// beyond them, so nothing is ever seen waiting off to the side
const RIGHT_EDGE = STRUCT_CX + FRAME_W / 2 / K_FINAL;
const LEFT_EDGE = STRUCT_CX - FRAME_W / 2 / K_FINAL;

// ---------------------------------------------------------------------------
// The building: six ink rings on a 3x2 lattice 280 x 140 world px, each pushed
// off its cell by up to +/-10px so the thing reads as a cluster someone built
// rather than a lattice someone ruled. Radius 22, stroke 3.5; the seven edges
// are the four row segments and the three column segments, stroke 3, clipped to
// the ring rims so nothing crosses into a ring.
// ---------------------------------------------------------------------------
const RING_R = 22;
const RING_BASE: P[] = [
  { x: -140, y: -70 }, // 0 top left
  { x: 0, y: -70 }, // 1 top middle
  { x: 140, y: -70 }, // 2 top right
  { x: -140, y: 70 }, // 3 bottom left
  { x: 0, y: 70 }, // 4 bottom middle
  { x: 140, y: 70 }, // 5 bottom right
];
const RINGS: P[] = RING_BASE.map((p, i) => ({
  x: STRUCT_CX + p.x + (hash(i, 80) - 0.5) * 20,
  y: p.y + (hash(i, 81) - 0.5) * 20,
}));

// The baseline. Nothing is drawn on it: it is the bottom of the lower rings,
// world y +92, and both the cost block and the rent column sit on it.
const BASELINE = 92;

type Elem = { kind: "ring" | "line"; a: number; b: number };
// Reading order: the top row and its two edges, down the left column, the
// bottom row and its edges, then the two remaining column edges.
const STRUCTURE: Elem[] = [
  { kind: "ring", a: 0, b: 0 },
  { kind: "line", a: 0, b: 1 },
  { kind: "ring", a: 1, b: 1 },
  { kind: "line", a: 1, b: 2 },
  { kind: "ring", a: 2, b: 2 },
  { kind: "line", a: 0, b: 3 },
  { kind: "ring", a: 3, b: 3 },
  { kind: "line", a: 3, b: 4 },
  { kind: "ring", a: 4, b: 4 },
  { kind: "line", a: 1, b: 4 },
  { kind: "line", a: 4, b: 5 },
  { kind: "ring", a: 5, b: 5 },
  { kind: "line", a: 2, b: 5 },
];
const NELEM = STRUCTURE.length;

// The plan and the ink run the same order at two tempos: 13 elements over 30
// frames dashed (off 2, dur 6 -> the last finishes at f30) and over 23 solid
// (off 1.5, dur 5 -> the last finishes at f60).
const PLAN_OFF = 2;
const PLAN_DUR = 6;
const INK_OFF = 1.5;
const INK_DUR = 5;
const INK_SPAN = (NELEM - 1) * INK_OFF + INK_DUR; // 23

const DASH = "9 7";
const DASH_PERIOD = 16;

// The geometry of one element, as an arc-length parameterisation, so the plan
// and the ink can both be drawn head-led from it and the dashed remainder can
// start exactly where the solid head has got to.
type Geo = {
  len: number;
  at: (u: number) => P;
  path: (u0: number, u1: number) => string;
};

const ringGeo = (c: P): Geo => {
  const C = 2 * Math.PI * RING_R;
  const at = (u: number) => {
    const a = -Math.PI / 2 + 2 * Math.PI * u;
    return { x: c.x + RING_R * Math.cos(a), y: c.y + RING_R * Math.sin(a) };
  };
  return {
    len: C,
    at,
    path: (u0, u1) => {
      if (u1 - u0 <= 1e-4) return "";
      const p0 = at(u0);
      if (u1 - u0 >= 0.9999) {
        const h = at(u0 + 0.5);
        return `M ${p0.x} ${p0.y} A ${RING_R} ${RING_R} 0 0 1 ${h.x} ${h.y} A ${RING_R} ${RING_R} 0 0 1 ${p0.x} ${p0.y}`;
      }
      const p1 = at(u1);
      const large = u1 - u0 > 0.5 ? 1 : 0;
      return `M ${p0.x} ${p0.y} A ${RING_R} ${RING_R} 0 ${large} 1 ${p1.x} ${p1.y}`;
    },
  };
};

const lineGeo = (A: P, B: P): Geo => {
  const L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
  const ux = (B.x - A.x) / L;
  const uy = (B.y - A.y) / L;
  const p0 = { x: A.x + ux * RING_R, y: A.y + uy * RING_R };
  const p1 = { x: B.x - ux * RING_R, y: B.y - uy * RING_R };
  const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const at = (u: number) => ({ x: p0.x + (p1.x - p0.x) * u, y: p0.y + (p1.y - p0.y) * u });
  return {
    len,
    at,
    path: (u0, u1) => {
      if (u1 - u0 <= 1e-4) return "";
      const a = at(u0);
      const b = at(u1);
      return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    },
  };
};

const GEO: Geo[] = STRUCTURE.map((e) =>
  e.kind === "ring" ? ringGeo(RINGS[e.a]) : lineGeo(RINGS[e.a], RINGS[e.b]),
);

// ---------------------------------------------------------------------------
// Money. One unit is a block of 4 x 3 solid dots at a 22px step: 66 x 44 world
// px of dot centres, countable at a glance. A block's anchor is its BOTTOM row.
// The cost is one deep block on the baseline at x -290 from the building; the
// rent is ten ripe blocks at x +290, block 1 on the same baseline and every
// block above it at a pitch of 84 (44 of block, 40 of gap), so the tenth
// block's top row is at world y +92 - 800 = -708.
//
// The pitch is 84 and not the 62 the layout was drafted at, because at 62 the
// gap between one block's top row and the next block's bottom row is 18px and
// the step INSIDE a block is 22: the boundary is tighter than the thing it
// bounds, and the ten blocks render as one undifferentiated 30-row strip.
// Countability is the whole point of the unit, so the gap is opened to 40 -
// 1.8x the internal step - which is where a seated column reads as ten bricks
// at 1:1. Nothing else about the block moved; the column is 800 world px tall
// instead of 602 and the framing absorbs it through C1.
// ---------------------------------------------------------------------------
const BLK_COLS = 4;
const BLK_ROWS = 3;
const BLK_STEP = 22;
const BLK_PITCH = 84;
const COST_X = STRUCT_CX - 290;
const RENT_X = STRUCT_CX + 290;
const RENT_N = 10;
// a dot's offset from its block's anchor (centre of the bottom row)
const BLK_CELLS: { dx: number; dy: number; row: number }[] = [];
for (let r = 0; r < BLK_ROWS; r++) {
  for (let c = 0; c < BLK_COLS; c++) {
    BLK_CELLS.push({
      dx: (c - (BLK_COLS - 1) / 2) * BLK_STEP,
      dy: (r - (BLK_ROWS - 1)) * BLK_STEP,
      row: r, // 0 top, 1 middle, 2 bottom
    });
  }
}

// The arrivals. Every block comes in from beyond a frame edge at its seat's
// height on its own shallow arc and eases into its seat — never in unison, and
// never in a straight line. Launch spacing 5,5,5,5,4,4,4,4,4 and a 10 frame
// travel each, started at f136 so the first block is crossing the frame edge on
// "10x" (f141) and the tenth lands at f186, on "depreciated".
const FLIGHT = 10;
const RENT_GAPS = [5, 5, 5, 5, 4, 4, 4, 4, 4];
const RENT_T0 = 136;

type Flight = { x: number; y: number; sx: number; sy: number; arc: number; t0: number };

const RENT_BLOCKS: Flight[] = (() => {
  const out: Flight[] = [];
  let t = RENT_T0;
  for (let n = 0; n < RENT_N; n++) {
    if (n > 0) t += RENT_GAPS[n - 1];
    const y = BASELINE - n * BLK_PITCH;
    out.push({
      x: RENT_X,
      y,
      sx: RIGHT_EDGE + 60 + 50 * hash(n, 21),
      sy: y + (hash(n, 22) - 0.5) * 40,
      arc: (hash(n, 23) - 0.5) * 70,
      t0: t,
    });
  }
  return out;
})();

const COST_BLOCK: Flight = {
  x: COST_X,
  y: BASELINE,
  sx: LEFT_EDGE - 60 - 50 * hash(0, 24),
  sy: BASELINE + (hash(0, 25) - 0.5) * 40,
  arc: (hash(0, 26) - 0.5) * 70,
  t0: 156,
};

// Where a block is at `frame`, or null before it launches.
const flightAt = (f: Flight, frame: number) => {
  if (frame < f.t0) return null;
  const lin = clamp01((frame - f.t0) / FLIGHT);
  const e = Easing.out(Easing.cubic)(lin); // eases in, never overshoots
  const dx = f.x - f.sx;
  const dy = f.y - f.sy;
  const L = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(Math.PI * e) * f.arc;
  return {
    x: f.sx + dx * e + (-dy / L) * bow,
    y: f.sy + dy * e + (dx / L) * bow,
    fade: smooth(lin / 0.18),
  };
};

// The write-down. The cost block's top row goes first, its middle row twelve
// frames later, each dot on its own five frame ease with a hashed stagger
// inside four frames. One deep row of four is left standing: the depreciated
// basis.
const WD_ROW_GAP = 12;
const WD_STAGGER = 4;
const WD_DUR = 5;

// ---------------------------------------------------------------------------
// The tenants. Two white marks above the building, each tied to it by an accent
// thread that draws head-led out of a ring's rim into the empty spot where the
// mark will land, and stays live for the rest of the piece.
// ---------------------------------------------------------------------------
const MARK_SIZE = 108;
const MARKS = [
  // glyphBottom: where the visible glyph ends inside the 108 box (the Anthropic
  // mark is a wide short A\, its PNG has 61px of empty alpha below it) so the
  // thread meets the ink, not the box
  { src: "anthropic.png", x: STRUCT_CX - 150, y: -290, ring: 0, glyphBottom: 259 / 320 },
  { src: "openai-chatgpt-logo.png", x: STRUCT_CX + 150, y: -290, ring: 2, glyphBottom: 1 },
];
const THREADS = MARKS.map((m) => {
  const R = RINGS[m.ring];
  const mx = m.x;
  const my = m.y - MARK_SIZE / 2 + MARK_SIZE * m.glyphBottom; // the bottom edge of the glyph
  const L = Math.hypot(mx - R.x, my - R.y) || 1;
  return {
    x1: R.x + ((mx - R.x) / L) * RING_R,
    y1: R.y + ((my - R.y) / L) * RING_R,
    x2: mx,
    y2: my,
  };
});
const THREAD_T0 = [89, 93];
const THREAD_DUR = 12;

// The structure's own packets: an ink bead running one of its edges over 14
// frames, a new one every 7, two alive at once, from the frame it completes.
const EDGES = STRUCTURE.map((e, i) => (e.kind === "line" ? i : -1)).filter((i) => i >= 0);
const PKT_PERIOD = 7;
const PKT_LIFE = 14;
const PKT_R = 4;
// The rent flowing: one bead at a time down a thread from a mark to its ring,
// alternating threads, one every 8 frames from the frame the second mark has
// landed. Life equals period, so there is exactly one alive.
const RENT_PKT_FROM = 125;
const RENT_PKT_PERIOD = 8;
const RENT_PKT_LIFE = 8;

const TenTimesTheCost: React.FC<Props> = ({
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
  dotOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the plan and the ink --------------------------------------------------
  // Two head-led draws over the same thirteen elements in the same order. The
  // dashed plan is only ever shown from where the solid ink has got to, so the
  // plan disappears under the ink as the head passes rather than showing
  // through its gaps.
  const planDrawn = STRUCTURE.map((_, i) =>
    interpolate(
      frame,
      [beats.evenAt + i * PLAN_OFF, beats.evenAt + i * PLAN_OFF + PLAN_DUR],
      [0, 1],
      { ...clamp, easing: Easing.out(Easing.cubic) },
    ),
  );
  const inkDrawn = STRUCTURE.map((_, i) =>
    interpolate(
      frame,
      [beats.likeBuild + i * INK_OFF, beats.likeBuild + i * INK_OFF + INK_DUR],
      [0, 1],
      { ...clamp, easing: Easing.out(Easing.cubic) },
    ),
  );
  const structureDone = beats.likeBuild + INK_SPAN; // f60
  const completeClick = frame >= structureDone && frame < structureDone + 4 ? 1 : 0;
  const inkOp = OP_READ + (1 - OP_READ) * completeClick;

  // -- the threads -----------------------------------------------------------
  const threads = THREADS.map((t, i) =>
    interpolate(frame, [THREAD_T0[i], THREAD_T0[i] + THREAD_DUR], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    }),
  );

  // -- the marks -------------------------------------------------------------
  const markT0 = [beats.anthropic, beats.andOpenai];
  const marks = MARKS.map((m, i) => {
    const p = interpolate(frame, [markT0[i], markT0[i] + 6], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    return { ...m, op: p, scale: 0.86 + 0.14 * p };
  });

  // -- money -----------------------------------------------------------------
  const rent = RENT_BLOCKS.map((f) => flightAt(f, frame));
  const cost = flightAt(COST_BLOCK, frame);
  // the write-down: 0 = the dot is there, 1 = it is gone
  const gone = BLK_CELLS.map((cell, i) => {
    if (cell.row === 2) return 0;
    const t0 =
      beats.depreciated + (cell.row === 1 ? WD_ROW_GAP : 0) + hash(i, 31) * WD_STAGGER;
    return interpolate(frame, [t0, t0 + WD_DUR], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
  });

  // -- the structure's own packets -------------------------------------------
  const packets: { key: string; x: number; y: number }[] = [];
  for (let n = 0; ; n++) {
    const sf = structureDone + n * PKT_PERIOD;
    if (sf > frame) break;
    const age = frame - sf;
    if (age >= PKT_LIFE) continue;
    const g = GEO[EDGES[Math.floor(hash(n, 90) * EDGES.length)]];
    const t = age / (PKT_LIFE - 1);
    const p = hash(n, 92) < 0.5 ? t : 1 - t; // either way along the edge
    const q = g.at(p);
    packets.push({ key: `p${n}`, x: q.x, y: q.y });
  }
  // and the rent coming down the threads, one at a time
  for (let n = 0; ; n++) {
    const sf = RENT_PKT_FROM + n * RENT_PKT_PERIOD;
    if (sf > frame) break;
    const age = frame - sf;
    if (age >= RENT_PKT_LIFE) continue;
    const t = THREADS[n % 2];
    const u = age / (RENT_PKT_LIFE - 1);
    packets.push({
      key: `r${n}`,
      x: t.x2 + (t.x1 - t.x2) * u,
      y: t.y2 + (t.y1 - t.y2) * u,
    });
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = STRUCT_CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  // One small shadow on each icon: every ring, every line, every packet, both
  // marks. Its lengths are screen px divided by the camera's k, so it is the
  // same shadow at k 1.5 on the plan and at k 1.0 on the resolved frame.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const dot = (key: string, x: number, y: number, r: number, fill: string, op: number) => (
    <circle key={key} cx={x} cy={y} r={r} fill={fill} opacity={op} />
  );

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
            {/* the two threads, head-led, live for the rest of the piece */}
            {THREADS.map((t, i) => {
              const d = threads[i];
              if (d <= 0) return null;
              const hx = t.x1 + (t.x2 - t.x1) * d;
              const hy = t.y1 + (t.y2 - t.y1) * d;
              return (
                <g key={`t${i}`}>
                  <line
                    x1={t.x1}
                    y1={t.y1}
                    x2={hx}
                    y2={hy}
                    stroke={accent}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={0.95}
                  />
                  {d < 1 ? <circle cx={hx} cy={hy} r={4} fill={ink} /> : null}
                </g>
              );
            })}

            {/* the plan: the same thirteen elements, dashed, shown only from
                where the ink has got to */}
            {STRUCTURE.map((e, ei) => {
              const u0 = inkDrawn[ei];
              const u1 = planDrawn[ei];
              if (u1 - u0 <= 1e-3) return null;
              const g = GEO[ei];
              const d = g.path(u0, u1);
              if (!d) return null;
              const head = g.at(u1);
              return (
                <g key={`pl${ei}`} style={{ filter: icon }}>
                  <path
                    d={d}
                    fill="none"
                    stroke={ink}
                    strokeWidth={e.kind === "ring" ? 3.5 : 3}
                    strokeLinecap="butt"
                    strokeDasharray={DASH}
                    strokeDashoffset={(u0 * g.len) % DASH_PERIOD}
                    opacity={OP_UNREAD}
                  />
                  {u1 < 1 && inkDrawn[ei] <= 0 ? (
                    <circle cx={head.x} cy={head.y} r={4} fill={ink} opacity={OP_UNREAD + 0.3} />
                  ) : null}
                </g>
              );
            })}

            {/* the ink: solid, over the plan, same order, head-led */}
            {STRUCTURE.map((e, ei) => {
              const d = inkDrawn[ei];
              if (d <= 0) return null;
              const g = GEO[ei];
              const p = g.path(0, d);
              if (!p) return null;
              const head = g.at(d);
              return (
                <g key={`ik${ei}`} style={{ filter: icon }}>
                  <path
                    d={p}
                    fill="none"
                    stroke={ink}
                    strokeWidth={e.kind === "ring" ? 3.5 : 3}
                    strokeLinecap="round"
                    opacity={inkOp}
                  />
                  {d < 1 ? <circle cx={head.x} cy={head.y} r={4} fill={ink} /> : null}
                </g>
              );
            })}

            {/* the structure's packets, and the rent coming down the threads */}
            <g style={{ filter: icon }}>
              {packets.map((p) => (
                <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={ink} />
              ))}
            </g>

            {/* the rent: ten ripe blocks, each a rigid group of twelve dots */}
            {rent.map((b, n) =>
              b === null
                ? null
                : BLK_CELLS.map((cell, i) =>
                    dot(
                      `r${n}-${i}`,
                      b.x + cell.dx,
                      b.y + cell.dy,
                      dotRadius * breath(frame, hash(n * 13 + i, 9)),
                      accent,
                      dotOpacity * b.fade,
                    ),
                  ),
            )}

            {/* the cost: one deep block, written down to a single row */}
            {cost === null
              ? null
              : BLK_CELLS.map((cell, i) => {
                  const g = gone[i];
                  if (g >= 1) return null;
                  return dot(
                    `c${i}`,
                    cost.x + cell.dx,
                    cost.y + cell.dy,
                    dotRadius * breath(frame, hash(i, 9)) * (1 - g),
                    accentDeep,
                    dotOpacity * cost.fade,
                  );
                })}
          </svg>

          {/* the tenants: two white marks at the ends of the two threads */}
          {marks.map((m) =>
            m.op <= 0 ? null : (
              <Img
                key={m.src}
                src={staticFile(m.src)}
                style={{
                  position: "absolute",
                  left: m.x - MARK_SIZE / 2,
                  top: m.y - MARK_SIZE / 2,
                  width: MARK_SIZE,
                  height: MARK_SIZE,
                  objectFit: "contain",
                  transform: `scale(${m.scale.toFixed(4)})`,
                  filter: `brightness(0) invert(1) ${icon}`,
                  opacity: m.op,
                }}
              />
            ),
          )}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default TenTimesTheCost;
