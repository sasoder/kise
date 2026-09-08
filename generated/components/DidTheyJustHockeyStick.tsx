import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_DARK,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  camMove,
  clamp,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Hockey_Stick`: "how much is China able to add the
// subsequent year? Basically I want to know: did they just hockey stick at the
// point at which they are able to start shipping large amounts of compute".
//
// SRT span 0:02.600 -> 0:10.199 at 24fps. The cut starts on "how", which sits
// inside the SRT cue "year how" 2.339-2.859; the onset is estimated at 2.600.
// round((10.199 - 2.600) * 24) = round(7.599 * 24) = round(182.4) = 182 frames
// of speech, plus a 16 frame tail so the resolved state holds = 198.
export const DURATION = 198;

// ---------------------------------------------------------------------------
// "Did they just hockey stick". The question IS a graph, so the graph is the
// only thing in the frame: years along a floor, and how much compute China
// adds in a year as a column of agent dots standing on it. The three past
// years are three short columns you can count. The subsequent year is an empty
// dashed slot. The hockey stick is an ink curve run along the column tops that
// turns up at that slot and leaves the top of the frame. And then "shipping
// large amounts of compute" pours the dots in under it, so the stick is
// countable rather than asserted.
//
// No text, no marks, no people. Dots, ink lines, one ring.
//
// Every gesture is one word. Nothing else happens.
//   the floor alone                                 — before "how"           f0-6
//   the 36 dots of the three past columns (2, 3 and
//     4 rows, 4 dots wide) arrive from beyond the
//     LEFT edge, each at its seat's height on its
//     own shallow arc, bottom rows first, hashed
//     within a row, ~1.5 a frame; the 36th is
//     seated on "add"                               — "how much is China able
//                                                    to add"               f6-40
//   the dashed slot draws head-led around its
//     outline at position 4 and closes on "year"    — "the subsequent year?" f45-54
//   the ONE camera move: k 1.25 -> 0.8 on one
//     warped smoothstep (warp 0.72) keyed f68-78,
//     damped to 0.5% of its target by f88, five
//     frames before "hockey stick". It opens the
//     empty space above and to the right. Nothing
//     new appears while it runs                     — "I want to know, did
//                                                    they just"            f68-88
//   the curve draws head-led from the top of column
//     1 along the tops of 2 and 3 (nearly flat),
//     reaches column 4 exactly on "hockey stick",
//     then turns up and accelerates through the
//     future column tops and is off the top of the
//     frame by f106. A 4px ink bead leads the head  — "they just hockey
//                                                    stick"                f86-106
//   the ring closes head-led on the kink — the top
//     of column 4, where the line leaves the flat —
//     its radius landing with Easing.out(back 1.6)
//     and a 4-frame click-bright                    — "the point at which"  f106-119
//   the pour: 728 dots enter from beyond the left
//     edge as ONE stream in a narrow band at the
//     kink's height, run right along it and each
//     turns up under its own column into its seat,
//     filling columns 4 -> 8 in order, bottom rows
//     first, the columns' launch bands overlapping
//     so the front moves right AND up. The rate
//     accelerates from ~12 a frame to ~34 as the
//     columns double. As each
//     column completes its dots ripen deep -> ripe
//     over 6 frames, the curve segment above it
//     converts ink -> accent, and the dashed slot
//     darkens and goes as column 4's dots take its
//     place. The last seat is taken on "compute"    — "able to start shipping
//                                                    large amounts of
//                                                    compute"              f137-171
//   hold resolved, never fades                      — tail                 f182-198
//
// ambient on every hold: the shared `breath` on every seated dot and the grid's
// own drift. Nothing else. The longest stretch with no gesture is f54-68, 14
// frames.
//
// Counts are geometry, never asserted: a column is 4 dots wide on the crowd
// step and 2, 3, 4, 7, 14, 28, 56 and 112 rows tall — a doubling from the
// subsequent year on. Columns 7 and 8 run off the top of the frame at the
// resolved camera; column 8 is capped at 77 rows, three rows above the frame
// top, so the pour does not spend dots nobody sees. 764 dots in all.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a full column, and every converted curve segment
  accentDeep: z.string(), // deep: a dot in a column that is not full yet
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
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  beats: z.object({
    how: z.number(), // "how"
    muchIs: z.number(), // "much is"
    chinaAble: z.number(), // "china able"
    toAddThe: z.number(), // "to add the"
    subsequent: z.number(), // "subsequent"
    year: z.number(), // "year?"
    basically: z.number(), // "basically"
    iWantTo: z.number(), // "i want to"
    knowDid: z.number(), // "know did"
    theyJust: z.number(), // "they just"
    hockeyStick: z.number(), // "hockey stick at"
    thePoint: z.number(), // "the point"
    atWhich: z.number(), // "at which"
    theyAre: z.number(), // "they are"
    ableToStart: z.number(), // "able to start"
    shippingLarge: z.number(), // "shipping large"
    amountsOf: z.number(), // "amounts of"
    compute: z.number(), // "compute"
    end: z.number(), // speech ends; tail to 198
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
  dotUnread: OP_UNREAD_DOT,
  beats: {
    how: 0,
    muchIs: 6,
    chinaAble: 23,
    toAddThe: 40,
    subsequent: 47,
    year: 54,
    basically: 63,
    iWantTo: 71,
    knowDid: 75,
    theyJust: 86,
    hockeyStick: 93,
    thePoint: 110,
    atWhich: 119,
    theyAre: 126,
    ableToStart: 137,
    shippingLarge: 148,
    amountsOf: 161,
    compute: 171,
    end: 182,
  },
});

type Pt = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 3200;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------------------------
// The graph's ground truth. The crowd step is the field's own (940/39), so a
// column of agents here is made of the same material as every crowd in this
// set, and a row is that step tall. Eight year positions at a 120px pitch put
// four dots and a gap of two steps between neighbours: 940 world px end to end.
// ---------------------------------------------------------------------------
const STEP = 940 / 39;
const FLOOR_Y = 2900;
const CENTRE_X = 538;
const PITCH = 120;
const NCOL = 8;
const COL_W = 4; // dots across a column
const colX = (i: number) => CENTRE_X + (i - (NCOL - 1) / 2) * PITCH;

// Rows per year. Three small past years, the subsequent year, then a doubling.
const ROWS_NOMINAL = [2, 3, 4, 7, 14, 28, 56, 112];

// ---------------------------------------------------------------------------
// The camera. ONE move, on "I want to know, did they just": a pull-back out of
// the graph that opens the empty space the hockey stick needs, above and to the
// right. `camMove` writes it as a warped smoothstep, a key per frame, with cy
// taken off the eased k so the content centre stays at screen y 835 through the
// move and not only at its ends. cx rides the SAME eased curve through the same
// damper, so the pan and the zoom are one hand.
//
// Keyed f68-78 rather than f70-84: this damper lags its target by about ten
// frames, and the move has to be settled before the curve starts drawing at
// f86. At f88 the zoom is within 0.5% of 0.8 and the floor is within 0.3px of
// where it ends up, so the curve draws into a camera that has stopped.
//
//   f0-67    k 1.25, cx 340   inside the graph: the floor at screen y 1130 so
//                             the three past columns sit ON the content centre,
//                             position 4 inside the frame on the right.
//   f68-88   -> k 0.8, cx 538 the eight positions centred, the floor at screen
//                             y 1420 with empty ground below it, and 1125 world
//                             px of clear air above the floor for the stick.
// ---------------------------------------------------------------------------
const K_OPEN = 1.25;
const K_FINAL = 0.8;
const CX_OPEN = 340;
const CX_FINAL = CENTRE_X;
const CAM_F0 = 68;
const CAM_F1 = 78;
const CAM_WARP = 0.72;
// the floor lands at screen y 1420 resolved and opens at 1340
const CY_FINAL = FLOOR_Y - (1420 - FRAME_H / 2) / K_FINAL;
const CY_OPEN = FLOOR_Y - (1130 - FRAME_H / 2) / K_OPEN;
const CONTENT_FINAL = CY_FINAL - 125 / K_FINAL;
const CONTENT_OPEN = CY_OPEN - 125 / K_OPEN;

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
// the sideways half of the same move, on the same eased curve
const CAM_CX = [
  CX_OPEN,
  ...CAM.F.map((_, i) => CX_OPEN + (CX_FINAL - CX_OPEN) * camEase(i / (CAM_F1 - CAM_F0), CAM_WARP)),
  CX_FINAL,
];

// The frame's own extremes over the whole track: the widest zoom decides how
// high the graph is ever seen and how far out to the left a dot has to start.
const FRAME_TOP = Math.min(...CAM_K.map((k, i) => CAM_CY[i] - FRAME_H / 2 / k));
const LEFT_EDGE = Math.min(...CAM_K.map((k, i) => CAM_CX[i] - FRAME_W / 2 / k));

// Cap: no seat further than three rows above the highest the frame ever sees,
// so the pour does not spend dots nobody watches. Column 8's nominal 112 rows
// become 77; every other column is under the cap and untouched.
const ROW_CAP = Math.ceil((FLOOR_Y - FRAME_TOP) / STEP) + 3;
const ROWS = ROWS_NOMINAL.map((r) => Math.min(r, ROW_CAP));

// A seat: 4 across on the crowd step, rows stacked upward off the floor, each
// jittered by up to a quarter of a step so a column is organic without losing
// its outline.
const seatPos = (c: number, row: number, j: number): Pt => {
  const i = c * 100000 + row * 4 + j;
  return {
    x: colX(c) + (j - (COL_W - 1) / 2) * STEP + (hash(i, 11) - 0.5) * STEP * 0.5,
    y: FLOOR_Y - (row + 0.6) * STEP + (hash(i, 12) - 0.5) * STEP * 0.5,
  };
};

type Dot = {
  x: number;
  y: number;
  r: number;
  col: number;
  sx: number;
  sy: number;
  cpx: number; // the one control point of the flight's quadratic curve
  cpy: number;
  dur: number;
  t0: number;
  land: number;
  seed: number;
};

// A dot's flight in from beyond the left edge of the frame, at its own seat's
// height. Everything about it is hashed per dot and hashed WIDE: the start is
// anywhere in a 600px band out to the left, the arc bows it off its own
// straight line by up to +/-75px, and the duration varies by five frames on top
// of the distance, so two dots launched on the same frame are never at the same
// point of the same path. The first pass had a narrow band and a duration that
// was a pure function of distance, and the pour came in as one coherent ribbon
// — the "straight line in unison" this style rejects.
//
// Director's pass: that version scattered the pour's entries over the seats'
// own heights, so 700 dots crossed the whole frame at once as a spray with no
// shape. The pour is now ONE stream. Every pour dot enters from beyond the left
// edge in a narrow band at the height of the kink — just above the past
// columns, just under the ring — runs right along that height, and turns UP
// under its own column into its seat: a quadratic curve whose control point
// sits at the seat's x on the entry height, so the path bends from horizontal
// to vertical the way the stick itself does. The past columns keep the
// reference's flight: entry at seat height, a shallow individual bow.
const JET_ROW = 6.2; // the entry band, in rows above the floor
const JET_BAND = 1.6; // its width, in rows
const flightOf = (x: number, y: number, i: number, jet: boolean) => {
  const sx = Math.min(x - (260 + 620 * hash(i, 44)), LEFT_EDGE - 25 - 260 * hash(i, 45));
  if (jet) {
    const sy = FLOOR_Y - (JET_ROW + (hash(i, 46) - 0.5) * JET_BAND) * STEP;
    const cpx = x + (hash(i, 47) - 0.5) * STEP * 1.5;
    const cpy = sy + (hash(i, 49) - 0.5) * STEP * 0.8;
    const dist = Math.abs(x - sx) + Math.abs(y - sy);
    return { sx, sy, cpx, cpy, dur: 8 + dist / 520 + hash(i, 48) * 4 };
  }
  const sy = Math.min(y + (hash(i, 46) - 0.5) * 44, FLOOR_Y - 10);
  const dx = x - sx;
  const dy = y - sy;
  const dist = Math.hypot(dx, dy) || 1;
  // A shallow bow off the chord, upward only: the travel is near-horizontal
  // and a downward bow would put the dot under the floor on its way in.
  const bow = -Math.abs((hash(i, 47) - 0.5) * 150);
  return {
    sx,
    sy,
    // a quadratic's peak deviation is half its control offset, hence the 2
    cpx: sx + dx / 2 + (-dy / dist) * 2 * bow,
    cpy: sy + dy / 2 + (dx / dist) * 2 * bow,
    dur: 7 + dist / 420 + hash(i, 48) * 5,
  };
};

// Solve the launch span so the LAST landing falls on its word exactly. The
// flights are different lengths, so this is a search over the span rather than
// arithmetic on the last one.
const solveSpan = (u: number[], dur: number[], want: number) => {
  let lo = 0.5;
  let hi = 200;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    let mx = 0;
    for (let i = 0; i < u.length; i++) mx = Math.max(mx, u[i] * mid + dur[i]);
    if (mx < want) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

// --- the three past columns: 36 dots, f6 -> the 36th seated on "add" (f40) ---
const PAST_F0 = 6;
const PAST_LAND = 40;
const PAST_DOTS: Dot[] = (() => {
  const seats: { p: Pt; c: number; row: number; key: number; i: number }[] = [];
  for (let c = 0; c < 3; c++) {
    for (let row = 0; row < ROWS[c]; row++) {
      for (let j = 0; j < COL_W; j++) {
        const i = c * 100000 + row * 4 + j;
        // bottom rows first across all three columns, hashed inside a row
        seats.push({ p: seatPos(c, row, j), c, row, key: row * 10 + hash(i, 43) * 9.5, i });
      }
    }
  }
  seats.sort((a, b) => a.key - b.key);
  const fl = seats.map((s) => flightOf(s.p.x, s.p.y, s.i, false));
  const u = seats.map((_, n) => (n + 0.5) / seats.length);
  const span = solveSpan(
    u,
    fl.map((f) => f.dur),
    PAST_LAND - PAST_F0,
  );
  return seats.map((s, n) => {
    const t0 = PAST_F0 + u[n] * span;
    return {
      x: s.p.x,
      y: s.p.y,
      r: 0.75 + 0.5 * hash(s.i, 13),
      col: s.c,
      sx: fl[n].sx,
      sy: fl[n].sy,
      cpx: fl[n].cpx,
      cpy: fl[n].cpy,
      dur: fl[n].dur,
      t0,
      land: t0 + fl[n].dur,
      seed: s.i,
    };
  });
})();

// --- the pour: columns 4-8, f137 -> the last seat taken on "compute" (f171) --
// Each column gets a launch band whose width goes as count^0.45, and the bands
// advance by 85% of their own width so consecutive columns overlap and the
// arrival front moves right and up rather than stepping column by column. The
// rate therefore accelerates on its own, because the columns double and their
// bands do not: ~12 dots a frame into column 4, ~34 into column 8.
const POUR_F0 = 137;
const POUR_LAND = 171;
const POUR_OVERLAP = 0.85;
const POUR_DOTS: Dot[] = (() => {
  const counts: number[] = [];
  for (let c = 3; c < NCOL; c++) counts.push(ROWS[c] * COL_W);
  const w = counts.map((n) => Math.pow(n, 0.45));
  const W = w.reduce((a, b) => a + b, 0);
  const start: number[] = [];
  let acc = 0;
  for (let j = 0; j < w.length; j++) {
    start.push(acc);
    acc += (POUR_OVERLAP * w[j]) / W;
  }
  const uMax = start[start.length - 1] + w[w.length - 1] / W;

  const rows: { p: Pt; c: number; u: number; i: number }[] = [];
  for (let c = 3; c < NCOL; c++) {
    const n = ROWS[c];
    for (let row = 0; row < n; row++) {
      for (let j = 0; j < COL_W; j++) {
        const i = c * 100000 + row * 4 + j;
        // bottom rows first inside the column, and hashed across three rows so
        // the front is a band of arrivals rather than a single row at a time
        const within = clamp01((row + 0.5 + 3 * (hash(i, 43) - 0.5)) / n);
        rows.push({
          p: seatPos(c, row, j),
          c,
          u: (start[c - 3] + (within * w[c - 3]) / W) / uMax,
          i,
        });
      }
    }
  }
  rows.sort((a, b) => a.u - b.u);
  const fl = rows.map((s) => flightOf(s.p.x, s.p.y, s.i, true));
  // Solved over the seats the camera can actually see: the capped rows above
  // the frame top would otherwise be the ones binding the schedule, and the
  // last seat the viewer watches being taken would land a frame or two early.
  const seen = rows.map((s, n) => ({ u: s.u, dur: fl[n].dur, vis: s.p.y >= FRAME_TOP }));
  const span = solveSpan(
    seen.filter((s) => s.vis).map((s) => s.u),
    seen.filter((s) => s.vis).map((s) => s.dur),
    POUR_LAND - POUR_F0,
  );
  return rows.map((s, n) => {
    const t0 = POUR_F0 + s.u * span;
    return {
      x: s.p.x,
      y: s.p.y,
      r: 0.75 + 0.5 * hash(s.i, 13),
      col: s.c,
      sx: fl[n].sx,
      sy: fl[n].sy,
      cpx: fl[n].cpx,
      cpy: fl[n].cpy,
      dur: fl[n].dur,
      t0,
      land: t0 + fl[n].dur,
      seed: s.i,
    };
  });
})();

const DOTS: Dot[] = [...PAST_DOTS, ...POUR_DOTS];

// When each column's LAST dot sits down. Everything that "a full column" drives
// — the column ripening, the curve segment above it converting, the dashed slot
// going — hangs off these frames, which are the arrival schedule's own numbers
// and not a parallel timer.
const COL_TOTAL = ROWS.map((r) => r * COL_W);
const COL_FULL = ROWS.map(() => -Infinity);
DOTS.forEach((d) => {
  if (d.land > COL_FULL[d.col]) COL_FULL[d.col] = d.land;
});
const COL_LANDINGS = ROWS.map((): number[] => []);
DOTS.forEach((d) => COL_LANDINGS[d.col].push(d.land));
const RIPEN = 6; // frames a full column takes to go deep -> ripe

// ---------------------------------------------------------------------------
// The curve. A monotone cubic (Fritsch-Carlson) through the eight column tops,
// so it is smooth and cannot dip below a top on its way between two of them.
// The last knot is column 8's NOMINAL top, not its capped one: the stick has to
// leave the frame, and the seats it leaves through are the ones nobody sees.
// ---------------------------------------------------------------------------
// 0.55 of a step above the top seat's own row, not 0.2: a seat is jittered by a
// quarter of a step and drawn at up to 1.25x the dot radius, and at 0.2 the top
// dots of a column poked through their own curve.
const topY = (rows: number) => FLOOR_Y - (rows + 0.55) * STEP;
const KNOT_X = ROWS_NOMINAL.map((_, i) => colX(i));
const KNOT_Y = ROWS_NOMINAL.map((r) => topY(r));

const monotone = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    m.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }
  const c1 = [m[0]];
  for (let i = 0; i < m.length - 1; i++) {
    if (m[i] * m[i + 1] <= 0) {
      c1.push(0);
    } else {
      const common = dx[i] + dx[i + 1];
      c1.push((3 * common) / ((common + dx[i + 1]) / m[i] + (common + dx[i]) / m[i + 1]));
    }
  }
  c1.push(m[m.length - 1]);
  return (x: number) => {
    let i = n - 2;
    for (let j = 0; j < n - 1; j++) {
      if (x <= xs[j + 1]) {
        i = j;
        break;
      }
    }
    const t = (x - xs[i]) / dx[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * dx[i] * c1[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * dx[i] * c1[i + 1]
    );
  };
};
const curveY = monotone(KNOT_X, KNOT_Y);

const CURVE_X0 = KNOT_X[0];
const CURVE_X1 = KNOT_X[NCOL - 1];
const CURVE_N = 360;
const CURVE: Pt[] = Array.from({ length: CURVE_N + 1 }, (_, i) => {
  const x = CURVE_X0 + ((CURVE_X1 - CURVE_X0) * i) / CURVE_N;
  return { x, y: curveY(x) };
});

// The kink: where the line leaves the flat and turns up, which is the top of
// the subsequent year. Both the ring and the ink/accent boundary sit on it.
const KINK: Pt = { x: KNOT_X[3], y: KNOT_Y[3] };

// The head is a position on the graph, not a fraction of a timer: flat and
// even from column 1 to the kink, then accelerating up the stick.
const CURVE_DRAW1 = 106; // clear of the top of the frame, and the ring's cue
const curveHead = (f: number, d0: number, dk: number) => {
  if (f <= d0) return CURVE_X0;
  if (f <= dk) return CURVE_X0 + (KINK.x - CURVE_X0) * ((f - d0) / (dk - d0));
  const u = clamp01((f - dk) / (CURVE_DRAW1 - dk));
  return KINK.x + (CURVE_X1 - KINK.x) * Math.pow(u, 1.5);
};

// The ring on the kink. It starts where the curve leaves the frame and closes
// on "at which".
const RING_R = 44;
const RING_F0 = CURVE_DRAW1;
const RING_HEAD_F1 = 118;
const RING_CLICK = 4;

// The dashed slot: one row tall, one column wide, on the floor at position 4.
// Dashed, because dashed means "a position in a sequence" — this one is the
// year the question is actually about.
const SLOT_W = (COL_W - 1) * STEP + 16;
const SLOT_H = STEP * 1.2;
const SLOT_R = 5;
const SLOT_CX = colX(3);
const SLOT_BOTTOM = FLOOR_Y - 3;
const SLOT_F0 = 45; // two frames of anticipation on "subsequent" (f47)
const SLOT_DASH_ON = 12;
const SLOT_DASH_OFF = 9;

// the slot's outline as a polyline, clockwise from the top-left corner
const roundedRect = (cx: number, bottom: number, w: number, h: number, r: number): Pt[] => {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y1 = bottom;
  const y0 = bottom - h;
  const arc = (ax: number, ay: number, a0: number, a1: number) =>
    Array.from({ length: 7 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / 6;
      return { x: ax + r * Math.cos(a), y: ay + r * Math.sin(a) };
    });
  return [
    { x: x0 + r, y: y0 },
    { x: x1 - r, y: y0 },
    ...arc(x1 - r, y0 + r, -Math.PI / 2, 0),
    { x: x1, y: y1 - r },
    ...arc(x1 - r, y1 - r, 0, Math.PI / 2),
    { x: x0 + r, y: y1 },
    ...arc(x0 + r, y1 - r, Math.PI / 2, Math.PI),
    { x: x0, y: y0 + r },
    ...arc(x0 + r, y0 + r, Math.PI, 1.5 * Math.PI),
  ];
};
const SLOT_PTS = roundedRect(SLOT_CX, SLOT_BOTTOM, SLOT_W, SLOT_H, SLOT_R);

// --- polyline arithmetic, shared by the curve, the slot and the ring ---------
const cumulative = (pts: Pt[]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) {
    c.push(c[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return c;
};
const atLength = (pts: Pt[], cum: number[], s: number): Pt => {
  if (s <= 0) return pts[0];
  if (s >= cum[cum.length - 1]) return pts[pts.length - 1];
  let i = 1;
  while (cum[i] < s) i++;
  const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return {
    x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
    y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
  };
};
const slicePoly = (pts: Pt[], cum: number[], a: number, b: number): Pt[] => {
  if (b <= a) return [];
  const out: Pt[] = [atLength(pts, cum, a)];
  for (let i = 0; i < pts.length; i++) {
    if (cum[i] > a && cum[i] < b) out.push(pts[i]);
  }
  out.push(atLength(pts, cum, b));
  return out;
};
const SLOT_CUM = cumulative(SLOT_PTS);
const SLOT_LEN = SLOT_CUM[SLOT_CUM.length - 1];
const path = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

// the dashes, as [start, end] arc lengths around the slot's outline
const SLOT_DASHES: [number, number][] = (() => {
  const out: [number, number][] = [];
  const period = SLOT_DASH_ON + SLOT_DASH_OFF;
  const n = Math.max(1, Math.round(SLOT_LEN / period));
  const p = SLOT_LEN / n;
  const on = (p * SLOT_DASH_ON) / period;
  for (let i = 0; i < n; i++) out.push([i * p, i * p + on]);
  return out;
})();

// The floor. One ink rule under the eight positions with a small overhang, and
// snapped so it is one crisp line rather than a shimmering pair of half-pixels.
const FLOOR_X0 = colX(0) - ((COL_W - 1) / 2) * STEP - 40;
const FLOOR_X1 = colX(NCOL - 1) + ((COL_W - 1) / 2) * STEP + 40;
const FLOOR_LINE = Math.round(FLOOR_Y) + 0.5;

const DidTheyJustHockeyStick: React.FC<Props> = ({
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
  dotUnread,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = a column still filling (deep), 1 = a full column (ripe).
  const tone = makeTone(accentDeep, accent);

  // -- the columns, dot by dot ----------------------------------------------
  // A column's tone is its own dots' landings: ripe only once the last of them
  // is down. The three past columns are never full in this sense — they were
  // never part of the pour — so they stay deep, which is the point of them.
  const ripe = COL_FULL.map((f, c) =>
    c < 3 ? 0 : smooth((frame - f) / RIPEN),
  );
  const seatedFrac = COL_LANDINGS.map((ls, c) => {
    let n = 0;
    for (const l of ls) if (l <= frame) n++;
    return n / COL_TOTAL[c];
  });

  const dots = DOTS.map((d) => {
    if (frame < d.t0) return null;
    const lin = clamp01((frame - d.t0) / d.dur);
    const e = Easing.out(Easing.cubic)(lin);
    const m = 1 - e;
    return {
      x: m * m * d.sx + 2 * m * e * d.cpx + e * e * d.x,
      y: m * m * d.sy + 2 * m * e * d.cpy + e * e * d.y,
      r: dotRadius * d.r * breath(frame, hash(d.seed, 9)),
      t: lin >= 1 ? ripe[d.col] : 0,
      op: dotUnread * smooth(lin / 0.18),
      seed: d.seed,
    };
  });

  // -- the curve -------------------------------------------------------------
  // Drawn head-led by x, so "reaches column 4" is a position on the graph and
  // not a fraction of a timer. The accent front behind it is the columns: the
  // segment that ends at a column's top converts as that column completes, and
  // everything below the kink stays ink for good — the flat years never became
  // the stick.
  const headX = curveHead(frame, beats.theyJust, beats.hockeyStick);
  const drawing = frame > beats.theyJust && headX < CURVE_X1 - 0.5;
  const drawn = frame > beats.theyJust ? CURVE.filter((p) => p.x <= headX) : [];
  if (drawn.length && headX < CURVE_X1) drawn.push({ x: headX, y: curveY(headX) });

  const SEG_X = [KINK.x, KNOT_X[4], KNOT_X[5], KNOT_X[6], CURVE_X1];
  let accentX = KINK.x;
  for (let j = 0; j < 4; j++) accentX += ripe[j + 4] * (SEG_X[j + 1] - SEG_X[j]);
  const accentTo = Math.min(accentX, headX);
  const accentPts = accentTo > KINK.x ? CURVE.filter((p) => p.x >= KINK.x && p.x <= accentTo) : [];
  if (accentPts.length) {
    accentPts.unshift({ x: KINK.x, y: KINK.y });
    accentPts.push({ x: accentTo, y: curveY(accentTo) });
  }

  // -- the ring on the kink --------------------------------------------------
  const ringU = clamp01((frame - RING_F0) / (RING_HEAD_F1 - RING_F0));
  const ringR =
    RING_R *
    Easing.out(Easing.back(1.6))(clamp01((frame - RING_F0) / (beats.atWhich - RING_F0)));
  const ringPts: Pt[] =
    frame > RING_F0 && ringU > 0
      ? Array.from({ length: Math.max(2, Math.ceil(ringU * 72) + 1) }, (_, i) => {
          const a = -Math.PI / 2 + (2 * Math.PI * ringU * i) / Math.max(1, Math.ceil(ringU * 72));
          return { x: KINK.x + ringR * Math.cos(a), y: KINK.y + ringR * Math.sin(a) };
        })
      : [];
  const ringClick = frame >= RING_HEAD_F1 && frame < RING_HEAD_F1 + RING_CLICK ? 1 : 0;
  const ringOp = Math.min(1, OP_READ + (1 - OP_READ) * ringClick);

  // -- the dashed slot -------------------------------------------------------
  // It draws head-led on "the subsequent year", and it goes when its dots take
  // its place: it darkens with column 4's seated fraction and fades out over
  // the eight frames after the last of them sits down.
  const slotHead = interpolate(frame, [SLOT_F0, beats.year], [0, SLOT_LEN], clamp);
  const slotDrawing = frame > SLOT_F0 && frame < beats.year;
  const slotOpacity =
    (OP_READ + (OP_DARK - OP_READ) * seatedFrac[3]) * (1 - smooth((frame - COL_FULL[3]) / 8));

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_FF, CAM_CY, CAM_K);
  const camX = runCamera(frame, CAM_FF, CAM_CX, CAM_K).cy;
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // The structure — floor, slot, curve, ring — carries the small per-icon
  // shadow, in screen px, so it reads as ink lying on the field at every zoom.
  // The dots never do: they are the field.
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
        cx={cx}
        cxRest={CAM_CX[0]}
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
            {/* the columns */}
            {dots.map((d) =>
              d ? (
                <circle key={d.seed} cx={d.x} cy={d.y} r={d.r} fill={tone(d.t)} opacity={d.op} />
              ) : null,
            )}

            {/* floor, slot, curve, ring — the ink structure, one weight */}
            <g style={{ filter: icon }}>
              <line
                x1={FLOOR_X0}
                y1={FLOOR_LINE}
                x2={FLOOR_X1}
                y2={FLOOR_LINE}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={OP_READ}
              />

              {slotOpacity > 0.005 && slotHead > 0
                ? SLOT_DASHES.map(([a, b], i) => {
                    const pts = slicePoly(SLOT_PTS, SLOT_CUM, a, Math.min(b, slotHead));
                    if (pts.length < 2) return null;
                    return (
                      <path
                        key={`s${i}`}
                        d={path(pts)}
                        fill="none"
                        stroke={ink}
                        strokeWidth={3}
                        strokeLinecap="round"
                        opacity={slotOpacity}
                      />
                    );
                  })
                : null}
              {slotDrawing ? (
                <circle
                  cx={atLength(SLOT_PTS, SLOT_CUM, slotHead).x}
                  cy={atLength(SLOT_PTS, SLOT_CUM, slotHead).y}
                  r={4}
                  fill={ink}
                  opacity={OP_READ}
                />
              ) : null}

              {drawn.length > 1 ? (
                <path
                  d={path(drawn)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={OP_READ}
                />
              ) : null}
              {accentPts.length > 1 ? (
                <path
                  d={path(accentPts)}
                  fill="none"
                  stroke={accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={1}
                />
              ) : null}
              {drawing ? (
                <circle cx={headX} cy={curveY(headX)} r={4} fill={ink} opacity={OP_READ} />
              ) : null}

              {ringPts.length > 1 ? (
                <path
                  d={path(ringPts)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  opacity={ringOp}
                />
              ) : null}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default DidTheyJustHockeyStick;
