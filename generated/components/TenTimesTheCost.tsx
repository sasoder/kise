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
// built from the field's own primitives: FOUR white server racks standing in a
// row on the baseline, joined by an ink bus above them, 412 world px wide, at
// world (540, 0). A rack is the `#rack` glyph — a 100 x 130 rounded rectangle
// (r 10) with three slot cut-outs (56 x 20, r 5) taken out of it by
// `fillRule="evenodd"`, so the field shows through the slots, plus one static
// white LED (r 3.5) sitting in each slot.
// Money is the field's dots: a block of 4 x 3 solid dots at a 22px step is one
// unit. The cost is ONE block in the deep tone on the left of the building; the
// rent is TEN blocks in the ripe tone stacked in a column on the right, on the
// same baseline. The tenants are the two marks above it, tied to it by two
// accent threads that leave the bus's two end points.
//
// racks pass: six rings -> four server-rack glyphs on a bus (user note 2026-09-08: "make the data center more clear")
// calm-open pass: nineteen element draws in the first 60 frames -> four moves (user note 2026-09-08: "feels super rushed")
//
// There is no crowd in this piece. The field is the grid, the vignette, the
// global shadow and the per-icon shadow on every rack, the bus, the stubs, the
// packets and the marks.
//
// Every gesture is one word. Nothing else happens.
//   the plan FADES IN as one drawing: the complete
//     dashed geometry — four rack outlines, the bus,
//     the four stubs (9/7, ink at OP_UNREAD) — is
//     already there and its opacity goes 0 ->
//     OP_UNREAD, ease-out; no head-led draw, no
//     stagger, no tips; then it holds still (sway
//     only) to f38                                  — "even at the data
//                                                     center level"      f0-14
//   ONE WIPE raises the four racks: a single clip
//     rectangle rises from the baseline past the
//     rack tops across the whole row, ease-out,
//     filling all four racks solid at once with
//     their slots and LEDs and swallowing their
//     dashed outlines as it passes                  — "like build a data
//                                                     center"            f38-52
//   the bus draws solid head-led with the white tip,
//     left to right, the dashed bus disappearing
//     under the head                                — (same beat)        f50-58
//   the four stubs drop TOGETHER, solid, from the
//     bus down to the rack tops; 4-frame click-
//     bright on completion at f60, then OP_READ     — (same beat)        f56-60
//   two accent threads leave the BUS'S TWO END
//     POINTS straight up, left first, right four
//     frames later, each ending at an empty spot    — "get rented out to" f89-107
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
// ambient: the structure's own packets from f60 — a 4px ink bead running the
// BUS end to end over 14 frames, a new one every 7, two alive at once (the
// stubs carry nothing) — and from f125 one small white packet at a time
// travelling DOWN a thread from a mark to the bus end it leaves from,
// alternating threads, one every 8 frames. Neither is a gesture; they are what
// a rented, running building looks like.
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
// margin on each side. The marks at world y -300 sit at screen 843, their
// boxes topping out at 789 - well inside it - and nothing is below 1480. The
// racks span world x -206..+206 from the centre; the cost block's left edge is
// -323 and the column's right edge +323, so the row of racks clears both.
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
// The building: FOUR server racks standing in a row on the baseline, joined by
// a bus above them. A row is what reads as a data center, so there are no
// hashed offsets here: the four racks are on a ruled row at 104px pitch.
//
// The glyph is `#rack` from the test sheet, verbatim, with its origin at the
// rack's bottom centre: a rounded rectangle -50..+50 x -130..0 (r 10) filled
// white, with three 56 x 20 slots (r 5) at y -112, -75, -38 cut out of it by
// `fillRule="evenodd"` so the field shows through them, and one white LED
// (r 3.5) at x +24 in each slot. The LEDs are static — no blinking, no
// breathing; a rack is a thing on the field, not a gadget.
//
// The bus is an ink line at y -78 running between the two outer rack centres,
// with a 40px stub down to each rack's top centre. Stroke 3, round caps, the
// same weight as every other line in the piece.
// ---------------------------------------------------------------------------
const RACK_HW = 50; // the glyph is 100 wide
const RACK_H = 130;
const RACK_R = 10;
const RACK_DX = [-156, -52, 52, 156];

// The baseline. Nothing is drawn on it: it is where the four racks stand, world
// y +92, and both the cost block and the rent column sit on it.
const BASELINE = 92;
const RACK_TOP = BASELINE - RACK_H; // -38
const BUS_Y = -78;
const RACK_X = RACK_DX.map((dx) => STRUCT_CX + dx);
const BUS_X0 = RACK_X[0];
const BUS_X1 = RACK_X[RACK_X.length - 1];
// the row's outer edges: the one wipe crosses all four racks at once
const ROW_L = RACK_X[0] - RACK_HW;
const ROW_R = RACK_X[RACK_X.length - 1] + RACK_HW;

// The glyph, verbatim from the test sheet; drawn under translate(cx, BASELINE).
const RACK_D = [
  "M-40,-130 h80 a10,10 0 0 1 10,10 v110 a10,10 0 0 1 -10,10 h-80 a10,10 0 0 1 -10,-10 v-110 a10,10 0 0 1 10,-10 z",
  "M-28,-112 h56 a5,5 0 0 1 5,5 v10 a5,5 0 0 1 -5,5 h-56 a5,5 0 0 1 -5,-5 v-10 a5,5 0 0 1 5,-5 z",
  "M-28,-75 h56 a5,5 0 0 1 5,5 v10 a5,5 0 0 1 -5,5 h-56 a5,5 0 0 1 -5,-5 v-10 a5,5 0 0 1 5,-5 z",
  "M-28,-38 h56 a5,5 0 0 1 5,5 v10 a5,5 0 0 1 -5,5 h-56 a5,5 0 0 1 -5,-5 v-10 a5,5 0 0 1 5,-5 z",
].join(" ");
const LED_DX = 24;
const LED_DY = [-102, -65, -28];
const LED_R = 3.5;

type Elem = { kind: "rack" | "bus" | "stub"; i: number };
// Build order: the four racks left to right, then the bus, then the four stubs.
const STRUCTURE: Elem[] = [
  { kind: "rack", i: 0 },
  { kind: "rack", i: 1 },
  { kind: "rack", i: 2 },
  { kind: "rack", i: 3 },
  { kind: "bus", i: 0 },
  { kind: "stub", i: 0 },
  { kind: "stub", i: 1 },
  { kind: "stub", i: 2 },
  { kind: "stub", i: 3 },
];
// The plan is NOT drawn element by element any more. It is one complete dashed
// drawing — all four rack outlines, the bus and the four stubs, already there —
// and it FADES UP as one thing over f0-14, then holds still to f38. See the
// calm-open note in the header.
const PLAN_FADE_DUR = 14;

// The ink is two different things: the racks FILL and the lines DRAW. All four
// racks fill from the baseline up behind ONE clip wipe that rises across the
// whole row from +1 to +15 (f38-52); the bus draws head-led from +13 to +21
// (f50-58); the four stubs draw together from +19 to +23 (f56-60), so the
// structure still completes at f60 and the click-bright is where it was.
const FILL_T0 = 1;
const FILL_DUR = 14;
const WIPE_OVER = 6; // the wipe runs 6px past the rack top, so no dash survives
const BUS_INK_T0 = 13;
const BUS_INK_DUR = 8;
const STUB_INK_T0 = 19;
const STUB_INK_DUR = 4;
const INK_SPAN = STUB_INK_T0 + STUB_INK_DUR; // 23

const DASH = "9 7";
const DASH_PERIOD = 16;

// The geometry of one element, as an arc-length parameterisation, so the plan
// can be drawn head-led from it and the solid line can start exactly where the
// dashed one has got to.
type Geo = {
  len: number;
  at: (u: number) => P;
  path: (u0: number, u1: number) => string;
};

// A polyline, walked by arc length. The rack outline is one of these: its four
// corner arcs are sampled into 6 chords each, which at r 10 is 0.09px off the
// true arc — invisible under a 3px stroke, and it lets the outline, the bus and
// the stubs share one head-led draw.
const polyGeo = (pts: P[]): Geo => {
  const seg: number[] = [];
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(l);
    cum.push(cum[i - 1] + l);
  }
  const total = cum[cum.length - 1] || 1;
  const at = (u: number) => {
    const d = clamp01(u) * total;
    let i = 1;
    while (i < pts.length - 1 && cum[i] < d) i++;
    const t = seg[i - 1] > 0 ? (d - cum[i - 1]) / seg[i - 1] : 0;
    return {
      x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
      y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
    };
  };
  return {
    len: total,
    at,
    path: (u0, u1) => {
      if (u1 - u0 <= 1e-4) return "";
      const d0 = clamp01(u0) * total;
      const d1 = clamp01(u1) * total;
      const a = at(u0);
      let s = `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}`;
      for (let i = 1; i < pts.length; i++) {
        if (cum[i] <= d0) continue;
        if (cum[i] >= d1) break;
        s += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
      }
      const b = at(u1);
      return `${s} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
    },
  };
};

// One rack's OUTER outline (no slots), as a closed polyline starting at the
// bottom-left corner and running clockwise: up the left side, across the top,
// down the right, back along the bottom.
const rackOutline = (cx: number): P[] => {
  const L = cx - RACK_HW;
  const R = cx + RACK_HW;
  const T = RACK_TOP;
  const B = BASELINE;
  const r = RACK_R;
  const pts: P[] = [{ x: L, y: B - r }];
  const arc = (ax: number, ay: number, a0: number, a1: number) => {
    for (let i = 1; i <= 6; i++) {
      const a = a0 + ((a1 - a0) * i) / 6;
      pts.push({ x: ax + r * Math.cos(a), y: ay + r * Math.sin(a) });
    }
  };
  pts.push({ x: L, y: T + r });
  arc(L + r, T + r, Math.PI, 1.5 * Math.PI);
  pts.push({ x: R - r, y: T });
  arc(R - r, T + r, -Math.PI / 2, 0);
  pts.push({ x: R, y: B - r });
  arc(R - r, B - r, 0, Math.PI / 2);
  pts.push({ x: L + r, y: B });
  arc(L + r, B - r, Math.PI / 2, Math.PI);
  return pts;
};

const GEO: Geo[] = STRUCTURE.map((e) => {
  if (e.kind === "rack") return polyGeo(rackOutline(RACK_X[e.i]));
  if (e.kind === "bus") {
    return polyGeo([
      { x: BUS_X0, y: BUS_Y },
      { x: BUS_X1, y: BUS_Y },
    ]);
  }
  return polyGeo([
    { x: RACK_X[e.i], y: BUS_Y },
    { x: RACK_X[e.i], y: RACK_TOP },
  ]);
});
const BUS_GEO = GEO[4];

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
// The tenants. Two white marks above the building, each sitting directly over
// one END of the bus and tied to it by an accent thread that draws head-led
// straight up out of that end point into the empty spot where the mark will
// land, and stays live for the rest of the piece.
// ---------------------------------------------------------------------------
const MARK_SIZE = 108;
const MARKS = [
  // glyphBottom: where the visible glyph ends inside the 108 box (the Anthropic
  // mark is a wide short A\, its PNG has 61px of empty alpha below it) so the
  // thread meets the ink, not the box
  { src: "anthropic.png", x: BUS_X0, y: -300, glyphBottom: 259 / 320 },
  { src: "openai-chatgpt-logo.png", x: BUS_X1, y: -300, glyphBottom: 1 },
];
const THREADS = MARKS.map((m) => ({
  x1: m.x,
  y1: BUS_Y,
  x2: m.x,
  y2: m.y - MARK_SIZE / 2 + MARK_SIZE * m.glyphBottom, // the bottom edge of the glyph
}));
const THREAD_T0 = [89, 93];
const THREAD_DUR = 12;

// The structure's own packets: an ink bead running the BUS end to end over 14
// frames, a new one every 7, two alive at once, from the frame it completes.
// The stubs carry nothing — they are the racks' connections, not traffic.
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
  // The plan is the complete dashed drawing, faded up as ONE thing over f0-14.
  // The ink is two different things: the racks FILL from the baseline up behind
  // one clip wipe that crosses the whole row, and the bus and the stubs DRAW
  // head-led. Either way the dashed plan is only ever shown where the ink has
  // not reached, so it disappears under the ink rather than showing through it.
  const planFade = interpolate(
    frame,
    [beats.evenAt, beats.evenAt + PLAN_FADE_DUR],
    [0, 1],
    { ...clamp, easing: Easing.out(Easing.cubic) },
  );
  // ONE wipe for the whole row: how far the ink has risen, 0 = the baseline,
  // 1 = past every rack top.
  const wipe = interpolate(
    frame,
    [beats.likeBuild + FILL_T0, beats.likeBuild + FILL_T0 + FILL_DUR],
    [0, 1],
    { ...clamp, easing: Easing.out(Easing.cubic) },
  );
  const wipeTop = BASELINE - (RACK_H + WIPE_OVER) * wipe;
  // the head-led solid draws, one number per element (0 for the racks: their
  // ink is a fill, and the plan is cleared by the wipe instead). The four stubs
  // share one number: they drop together.
  const inkDrawn = STRUCTURE.map((e) => {
    if (e.kind === "rack") return 0;
    const t0 = beats.likeBuild + (e.kind === "bus" ? BUS_INK_T0 : STUB_INK_T0);
    const dur = e.kind === "bus" ? BUS_INK_DUR : STUB_INK_DUR;
    return interpolate(frame, [t0, t0 + dur], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
  });
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
    const t = age / (PKT_LIFE - 1);
    const p = hash(n, 92) < 0.5 ? t : 1 - t; // either way along the bus
    const q = BUS_GEO.at(p);
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

            {/* the wipe: ONE rect rising from the baseline across the whole
                row. The fills are clipped to what is inside it; the racks'
                dashed outlines are clipped to what is still OUTSIDE it, so the
                plan is swallowed exactly as the ink rises past it. */}
            <defs>
              <clipPath id="tc-fill">
                <rect
                  x={ROW_L - 10}
                  y={wipeTop}
                  width={ROW_R - ROW_L + 20}
                  height={BASELINE - wipeTop + 10}
                />
              </clipPath>
              <clipPath id="tc-plan">
                <rect
                  x={ROW_L - 20}
                  y={RACK_TOP - 40}
                  width={ROW_R - ROW_L + 40}
                  height={Math.max(0, wipeTop - (RACK_TOP - 40))}
                />
              </clipPath>
            </defs>

            {/* the plan: the complete dashed drawing, faded up as one thing,
                shown only where the ink has not reached */}
            {STRUCTURE.map((e, ei) => {
              if (planFade <= 0) return null;
              const u0 = inkDrawn[ei];
              if (1 - u0 <= 1e-3) return null;
              if (e.kind === "rack" && wipe >= 1) return null;
              const g = GEO[ei];
              const d = g.path(u0, 1);
              if (!d) return null;
              return (
                <g key={`pl${ei}`} style={{ filter: icon }}>
                  <g clipPath={e.kind === "rack" ? "url(#tc-plan)" : undefined}>
                    <path
                      d={d}
                      fill="none"
                      stroke={ink}
                      strokeWidth={3}
                      strokeLinecap="butt"
                      strokeDasharray={DASH}
                      strokeDashoffset={(u0 * g.len) % DASH_PERIOD}
                      opacity={OP_UNREAD * planFade}
                    />
                  </g>
                </g>
              );
            })}

            {/* the ink, part one: the four racks fill solid from the baseline
                up behind that one wipe, the slots and the LEDs coming with it */}
            {wipe <= 0
              ? null
              : RACK_X.map((cx, i) => (
                  <g key={`rk${i}`} style={{ filter: icon }}>
                    <g clipPath="url(#tc-fill)">
                      <g transform={`translate(${cx} ${BASELINE})`}>
                        <path d={RACK_D} fill={ink} fillRule="evenodd" opacity={inkOp} />
                        {LED_DY.map((ly) => (
                          <circle
                            key={`l${ly}`}
                            cx={LED_DX}
                            cy={ly}
                            r={LED_R}
                            fill={ink}
                            opacity={inkOp}
                          />
                        ))}
                      </g>
                    </g>
                  </g>
                ))}

            {/* the ink, part two: the bus and the stubs draw solid, head-led */}
            {STRUCTURE.map((e, ei) => {
              if (e.kind === "rack") return null;
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
                    strokeWidth={3}
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
