// ---------------------------------------------------------------------------
// rsi-another-jump — the world of cut 7 (`WholeVideoGames`): every position,
// schedule and track the cut draws, as pure functions of the frame. No React.
//
// It continues cut 2's world (`outputShared.tsx`): the 2022 card stays where
// cut 2 put it (600 x 370 world px centred on (540, 870)) and this cut's camera
// starts on cut 2's resolved camera (f81) and pulls back ~3.5x around it.
//
// WORLD LAYOUT at the resting zoom K_END (0.285; a world px is 0.285 screen px),
// with the card in the top-left corner of the frame:
//   card        world (240..840, 685..1055)      screen ~ (205..375, 97..203)
//   game window world (217..2617, 1260..3060)    screen ~ (198..882, 261..774)
//   code        two columns of 4 files flanking the window (x -333..127 and
//               2707..3167), the files the game is built from
//   the model   rests at the hub (1417, 3340), just under the window
//   the flood   pages pile up from a floor at world y 7300 to ~3600 at the end
// ---------------------------------------------------------------------------
import {
  CAM_DAMP,
  CAM_STIFF,
  clamp01,
  hash,
  smoothstep,
  sway,
} from "../kits/dwarkesh/fieldShared";
import { CARD_CX, CARD_CY, PL_LAST, plCamAt } from "./outputShared";

export const VG_DURATION = 149;
/** Cut 2's frame this cut's f0 continues (its resolved, last frame). */
export const PL_F0 = PL_LAST;

/** The zoom new things are sized for: the resting zoom at the end. */
export const K_END = 0.285;
/** World px for `px` screen px at the resting zoom. */
export const wpx = (px: number) => px / K_END;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
const easeInOutCubic = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Easing.out(Easing.back(s)) */
export const easeOutBack = (u: number, s = 1.6) => {
  const x = clamp01(u) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};

// ---------------------------------------------------------------------------
// LAYOUT (world px)
// ---------------------------------------------------------------------------
/** The card's screen centre at the end: the top-left of the frame. */
export const CARD_SCREEN_END = { x: 290, y: 150 };

// THE GAME. A 16 x 12 tile view (4:3), tile T world px.
export const T = 150;
export const VIEW_COLS = 16;
export const VIEW_ROWS = 12;
export const WIN_W = VIEW_COLS * T; // 2400
export const WIN_H = VIEW_ROWS * T; // 1800
export const WIN_CX = CARD_CX + (540 - CARD_SCREEN_END.x) / K_END; // ~1417: centred at the end
export const WIN_X0 = WIN_CX - WIN_W / 2;
export const WIN_X1 = WIN_X0 + WIN_W;
export const WIN_Y0 = 1260;
export const WIN_Y1 = WIN_Y0 + WIN_H;
/** The window outline, the style's one weight at the resting zoom. */
export const WIN_STROKE = wpx(6.5);

// THE MODEL (today's): an unbranded bright agent dot.
export const AGENT_R = 55;
export const HUB = { x: WIN_CX, y: WIN_Y1 + 330 };

// ---------------------------------------------------------------------------
// THE CAMERA. One damped track on (ln k, card screen x, card screen y), started
// on cut 2's state at its f81 (so f0 IS cut 2's last frame, and its creep's
// velocity carries on). The targets ride one single-lobe curve: the pull-back
// is fastest around f15-20 (the dive) and keeps creeping to the last frame.
// `sway` continues on cut 2's clock (PL_F0 + f).
// ---------------------------------------------------------------------------
const CAM_N = VG_DURATION + 40;

/** A normalised gamma-shaped progress: 0 at f0, ~1 by the end, single lobe. */
const gammaProgress = (a: number, tau: number, fNorm: number) => {
  const v: number[] = [];
  for (let f = 0; f <= fNorm; f++) v.push(Math.pow(f, a) * Math.exp(-f / tau));
  const c: number[] = [0];
  for (let f = 1; f <= fNorm; f++) c.push(c[f - 1] + 0.5 * (v[f - 1] + v[f]));
  const tot = c[fNorm];
  return (f: number) => c[Math.max(0, Math.min(fNorm, Math.round(f)))] / tot;
};

export const K_TARGET_END = 0.278;
const G_K = gammaProgress(0.8, 14, 190);
const G_S = gammaProgress(0.8, 8, 190);

const base81 = (() => {
  const c = plCamAt(PL_F0);
  const s = sway(PL_F0);
  return { cx: c.cx - s.dx, cy: c.cy - s.dy, k: c.k };
})();
const base80 = (() => {
  const c = plCamAt(PL_F0 - 1);
  const s = sway(PL_F0 - 1);
  return { cx: c.cx - s.dx, cy: c.cy - s.dy, k: c.k };
})();
const anchorOf = (b: { cx: number; cy: number; k: number }) => ({
  x: 540 + (CARD_CX - b.cx) * b.k,
  y: 960 + (CARD_CY - b.cy) * b.k,
});
const A0 = anchorOf(base81);
const A_PREV = anchorOf(base80);

const camTarget = (f: number) => {
  const gk = G_K(f);
  const gs = G_S(f);
  return {
    lk: lerp(Math.log(base81.k), Math.log(K_TARGET_END), gk),
    sx: lerp(A0.x, CARD_SCREEN_END.x, gs),
    sy: lerp(A0.y, CARD_SCREEN_END.y, gs),
  };
};

export type Cam = { cx: number; cy: number; k: number };

const CAM_TABLE: Cam[] = (() => {
  let lk = Math.log(base81.k);
  let sx = A0.x;
  let sy = A0.y;
  let vlk = Math.log(base81.k) - Math.log(base80.k);
  let vsx = A0.x - A_PREV.x;
  let vsy = A0.y - A_PREV.y;
  const out: Cam[] = [];
  for (let f = 0; f <= CAM_N; f++) {
    if (f > 0) {
      const t = camTarget(f);
      vlk += (t.lk - lk) * CAM_STIFF - vlk * CAM_DAMP;
      lk += vlk;
      vsx += (t.sx - sx) * CAM_STIFF - vsx * CAM_DAMP;
      sx += vsx;
      vsy += (t.sy - sy) * CAM_STIFF - vsy * CAM_DAMP;
      sy += vsy;
    }
    const k = Math.exp(lk);
    const d = sway(PL_F0 + f);
    if (f === 0) {
      // exactly cut 2's camera at its f81
      const c = plCamAt(PL_F0);
      out.push({ cx: c.cx, cy: c.cy, k: c.k });
    } else {
      out.push({ cx: CARD_CX - (sx - 540) / k + d.dx, cy: CARD_CY - (sy - 960) / k + d.dy, k });
    }
  }
  return out;
})();

export const camAt = (f: number): Cam => CAM_TABLE[Math.max(0, Math.min(CAM_N, Math.round(f)))];
export const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: 540 + (wx - c.cx) * c.k, y: 960 + (wy - c.cy) * c.k };
};

// ---------------------------------------------------------------------------
// THE 2022 CARD RECEDES: its accent drains to ACCENT_DEEP and its white to
// INK_LO over F_DRAIN0..F_DRAIN1. Its outline keeps a readable weight as the
// camera pulls back (world width grows from CARD_STROKE at f0, a partial
// non-scaling stroke), so the card stays findable as a small rectangle.
// ---------------------------------------------------------------------------
export const F_DRAIN0 = 1;
export const F_DRAIN1 = 16;
export const drainAt = (f: number) => smoothstep((f - F_DRAIN0) / (F_DRAIN1 - F_DRAIN0));
/** Multiplier on the card's world stroke: 1 at f0, (k0 / k)^0.62 after. */
export const cardStrokeMul = (f: number) => Math.max(1, Math.pow(camAt(0).k / camAt(f).k, 0.62));

// ---------------------------------------------------------------------------
// THE MODEL'S DIVE. Today's model enters from above the frame at F_AGENT0,
// passes beside the 2022 card (f~11), dives on one gentle arc through where the
// game window will be, and settles at the hub under it by F_AGENT1. A Hermite
// spline in time through authored knots; the speed is read off the spline, not
// measured from frames.
// ---------------------------------------------------------------------------
export const F_AGENT0 = 2;
export const F_AGENT1 = 50;
type Knot = { f: number; x: number; y: number };
const AGENT_KNOTS: Knot[] = [
  { f: F_AGENT0, x: 975, y: -360 },
  { f: 11, x: 1040, y: 860 },
  { f: 19, x: 1150, y: 1330 },
  { f: 31, x: 1330, y: 2230 },
  { f: 42, x: 1405, y: 3020 },
  { f: F_AGENT1, x: HUB.x, y: HUB.y },
];
// tangents (world px per frame) at each knot: in at speed, out at rest
const AGENT_TAN = (() => {
  const n = AGENT_KNOTS.length;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      out.push({ x: 0, y: 0 });
    } else if (i === 0) {
      const a = AGENT_KNOTS[0];
      const b = AGENT_KNOTS[1];
      out.push({ x: (b.x - a.x) / (b.f - a.f), y: (b.y - a.y) / (b.f - a.f) });
    } else {
      const a = AGENT_KNOTS[i - 1];
      const b = AGENT_KNOTS[i + 1];
      out.push({ x: (b.x - a.x) / (b.f - a.f), y: (b.y - a.y) / (b.f - a.f) });
    }
  }
  // the last interior knot eases toward rest
  out[n - 2] = { x: out[n - 2].x * 0.8, y: out[n - 2].y * 0.8 };
  return out;
})();

const hermite = (p0: number, m0: number, p1: number, m1: number, t: number, dt: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p0 +
    (t3 - 2 * t2 + t) * dt * m0 +
    (-2 * t3 + 3 * t2) * p1 +
    (t3 - t2) * dt * m1
  );
};

export const agentAt = (f: number): { x: number; y: number } => {
  const K = AGENT_KNOTS;
  if (f <= K[0].f) {
    // before entry it is further up its own line, off frame
    const m = AGENT_TAN[0];
    return { x: K[0].x + m.x * (f - K[0].f), y: K[0].y + m.y * (f - K[0].f) };
  }
  if (f >= K[K.length - 1].f) return { x: K[K.length - 1].x, y: K[K.length - 1].y };
  let i = 0;
  while (i < K.length - 2 && f > K[i + 1].f) i++;
  const a = K[i];
  const b = K[i + 1];
  const dt = b.f - a.f;
  const t = (f - a.f) / dt;
  return {
    x: hermite(a.x, AGENT_TAN[i].x, b.x, AGENT_TAN[i + 1].x, t, dt),
    y: hermite(a.y, AGENT_TAN[i].y, b.y, AGENT_TAN[i + 1].y, t, dt),
  };
};
/** The model's heading and world speed (central difference of the spline). */
export const agentMotion = (f: number) => {
  const a = agentAt(f - 0.25);
  const b = agentAt(f + 0.25);
  const vx = (b.x - a.x) / 0.5;
  const vy = (b.y - a.y) / 0.5;
  return { heading: Math.atan2(vy, vx), speed: Math.hypot(vx, vy) };
};

// ---------------------------------------------------------------------------
// THE CODE. The game's code is written INSIDE the blank window first: nine
// blocks, three columns by three bands. Each block's caret peels off the model
// as its dive passes the block's band and darts to the block's first line; a
// caret whose block is written flies back into the model. Then the code becomes
// the level (BUILDS, below).
// ---------------------------------------------------------------------------
export const CODE_COLS = 3;
export const CODE_BANDS = 3;
export const CODE_H = 30;
export const CODE_PITCH = 64;
export const CODE_INDENT = 56;
export const CODE_GAP = 18;
export const CODE_CARET_W = 24;
export const CODE_CARET_H = 58;
export const CODE_CARET_LEAD = 13;
const LINES_PER_BLOCK = 6;
const BLOCK_PAD_X = 64;
const BLOCK_PAD_Y = 56;
const BLOCK_W = WIN_W / CODE_COLS - 2 * BLOCK_PAD_X;
const BAND_H = WIN_H / CODE_BANDS;
/** Frames a caret takes home to the model once its block is written. */
export const CARET_HOME_F = 9;

export type CodeBar = { x: number; y: number; w: number; gi: number; block: number; fWritten: number };
export type CodeBlock = {
  id: number;
  band: number;
  col: number;
  x0: number;
  y0: number;
  bars: CodeBar[];
  /** the caret leaves the model at fLaunch and lands on the first line at fArrive */
  fLaunch: number;
  fArrive: number;
  launch: { x: number; y: number };
  /** bars per frame */
  rate: number;
  fDone: number;
  /** the caret leaves for home at fDone + 2 and is absorbed into the model at fHome */
  fHome: number;
};

const makeBars = (id: number, x0: number, y0: number) => {
  const H = (i: number, k: number) => hash(i + id * 131 + 7, k + id * 17 + 3);
  const bars: Omit<CodeBar, "fWritten">[] = [];
  let gi = 0;
  let indent = 0;
  for (let li = 0; li < LINES_PER_BLOCK; li++) {
    // code shape: a header line at indent 0, then bodies that step in and out
    if (li === 0) indent = 0;
    else if (li === 1) indent = 1;
    else {
      const r = H(li, 5);
      if (r < 0.3 && indent < 2) indent++;
      else if (r > 0.75 && indent > 0) indent--;
    }
    const lx0 = x0 + indent * CODE_INDENT;
    const room = BLOCK_W - indent * CODE_INDENT;
    const n = 2 + Math.floor(H(li, 9) * 3); // 2..4 tokens
    let x = lx0;
    for (let j = 0; j < n; j++) {
      let w = 50 + 130 * H(li * 7 + j, 11);
      if (x + w > lx0 + room) w = lx0 + room - x;
      if (w < 36) break;
      bars.push({ x, y: y0 + li * CODE_PITCH, w, gi, block: id });
      gi++;
      x += w + CODE_GAP;
      if (x > lx0 + room * (0.5 + 0.45 * H(li, 13))) break;
    }
  }
  return bars;
};

/** The first frame the model's dive has passed world y. */
const agentPasses = (y: number) => {
  let f = F_AGENT0;
  while (f < F_AGENT1 && agentAt(f).y < y) f += 0.05;
  return f;
};

export const BLOCKS: CodeBlock[] = (() => {
  const out: CodeBlock[] = [];
  let id = 0;
  for (let band = 0; band < CODE_BANDS; band++) {
    const y0 = WIN_Y0 + band * BAND_H + BLOCK_PAD_Y;
    const fBand = agentPasses(y0 + CODE_H);
    const ax = agentAt(fBand).x;
    // the column the model is in first, then the others
    const cols = [0, 1, 2].sort(
      (a, b) =>
        Math.abs(WIN_X0 + (a + 0.5) * (WIN_W / CODE_COLS) - ax) -
        Math.abs(WIN_X0 + (b + 0.5) * (WIN_W / CODE_COLS) - ax),
    );
    cols.forEach((col, j) => {
      const x0 = WIN_X0 + col * (WIN_W / CODE_COLS) + BLOCK_PAD_X;
      const raw = makeBars(id, x0, y0);
      const fLaunch = fBand + j * 0.9;
      const launch = agentAt(fLaunch);
      const dist = Math.hypot(x0 + CODE_CARET_LEAD - launch.x, y0 + CODE_H / 2 - launch.y);
      const fArrive = fLaunch + 3 + dist / 260;
      const rate = 2.1 + 0.5 * hash(id, 41);
      const bars = raw.map((b) => ({ ...b, fWritten: fArrive + (b.gi + 1) / rate }));
      const fDone = fArrive + bars.length / rate;
      out.push({ id, band, col, x0, y0, bars, fLaunch, fArrive, launch, rate, fDone, fHome: fDone + 2 + CARET_HOME_F });
      id++;
    });
  }
  return out;
})();
export const CODE_BARS: CodeBar[] = BLOCKS.flatMap((b) => b.bars);

/** Bars written by frame f in a block (fractional: the head is inside bar floor(n)). */
export const writtenAt = (blk: CodeBlock, f: number) =>
  Math.max(0, Math.min(blk.bars.length, (f - blk.fArrive) * blk.rate));

/** The writing head of a block at frame f: world x (before the lead), line top y. */
export const blockHeadAt = (blk: CodeBlock, f: number) => {
  const n = writtenAt(blk, f);
  const i = Math.min(blk.bars.length - 1, Math.floor(n));
  const b = blk.bars[i];
  const g = n >= blk.bars.length ? 1 : n - i;
  return { x: b.x + b.w * g, y: b.y };
};

/** A block's caret at frame f (centre, and its scale), or null when it is inside the model. */
export const blockCaretAt = (blk: CodeBlock, f: number) => {
  if (f < blk.fLaunch || f >= blk.fHome) return null;
  const first = { x: blk.x0 + CODE_CARET_LEAD, y: blk.y0 + CODE_H / 2 };
  if (f < blk.fArrive) {
    // the dart out of the model: eased, on a shallow arc, growing out of it
    const u = clamp01((f - blk.fLaunch) / (blk.fArrive - blk.fLaunch));
    const e = easeOutCubic(u);
    const a = blk.launch;
    const lift = -0.12 * Math.hypot(first.x - a.x, first.y - a.y) * Math.sin(Math.PI * e);
    return { x: lerp(a.x, first.x, e), y: lerp(a.y, first.y, e) + lift, s: lerp(0.4, 1, easeOutCubic(u * 2)) };
  }
  const leave = blk.fDone + 2;
  const h = blockHeadAt(blk, Math.min(f, blk.fDone));
  const rest = { x: h.x + CODE_CARET_LEAD, y: h.y + CODE_H / 2 };
  if (f < leave) return { ...rest, s: 1 };
  // home into the model, wherever it is now; shrinks into it on arrival
  const u = clamp01((f - leave) / CARET_HOME_F);
  const e = easeInOutCubic(u);
  const ag = agentAt(f);
  return { x: lerp(rest.x, ag.x, e), y: lerp(rest.y, ag.y, e), s: 1 - smoothstep((u - 0.6) / 0.4) };
};

// ---------------------------------------------------------------------------
// THE WINDOW OUTLINE: drawn head-led from where the model's dive crosses the
// window's top edge, two heads running both ways round it and meeting on the
// far side of the bottom edge.
// ---------------------------------------------------------------------------
export const F_OUTLINE0 = (() => {
  // the frame the dive crosses the top edge
  let f = F_AGENT0;
  while (f < F_AGENT1 && agentAt(f).y < WIN_Y0) f += 0.05;
  return f;
})();
export const OUTLINE_X0 = agentAt(F_OUTLINE0).x;
export const F_OUTLINE1 = F_OUTLINE0 + 17;
/** 0..1, how far each head has run (1 = the heads have met). */
export const outlineAt = (f: number) => easeInOutCubic((f - F_OUTLINE0) / (F_OUTLINE1 - F_OUTLINE0));
/** Position along the rectangle's perimeter, measured clockwise from the top-left corner. */
export const PERIM = 2 * (WIN_W + WIN_H);
export const perimPoint = (d: number) => {
  let s = ((d % PERIM) + PERIM) % PERIM;
  if (s <= WIN_W) return { x: WIN_X0 + s, y: WIN_Y0 };
  s -= WIN_W;
  if (s <= WIN_H) return { x: WIN_X1, y: WIN_Y0 + s };
  s -= WIN_H;
  if (s <= WIN_W) return { x: WIN_X1 - s, y: WIN_Y1 };
  s -= WIN_W;
  return { x: WIN_X0, y: WIN_Y1 - s };
};
export const OUTLINE_D0 = OUTLINE_X0 - WIN_X0;

// ---------------------------------------------------------------------------
// THE GAME. A side-scrolling platformer in tile units (col, row), row 0 at the
// top of the view. The level runs past the view's right edge; the view scrolls
// once the runner passes VIEW_FOLLOW.
// ---------------------------------------------------------------------------
export type Tile = { kind: "ground" | "brick" | "step"; col: number; row: number; w: number };
export type Coin = { col: number; row: number };

const PITS: [number, number][] = [
  [7, 8],
  [22, 24],
];
const LEVEL_COLS = 40;
/** The goal flag's pole stands on the ground at this column's centre; it scrolls into view near the end. */
export const GOAL_COL = 28;
const inPit = (c: number) => PITS.some(([a, b]) => c >= a && c <= b);

export const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  for (let c = 0; c < LEVEL_COLS; c++) {
    if (inPit(c)) continue;
    out.push({ kind: "ground", col: c, row: 10, w: 1 });
    out.push({ kind: "ground", col: c, row: 11, w: 1 });
  }
  // floating bricks
  for (const c of [3, 4, 5]) out.push({ kind: "brick", col: c, row: 6, w: 1 });
  for (const c of [16, 17, 18, 19]) out.push({ kind: "brick", col: c, row: 6, w: 1 });
  // a little staircase: one block, then two (inside the footprint the jumps were planned around)
  out.push({ kind: "step", col: 12, row: 9, w: 1 });
  out.push({ kind: "step", col: 13, row: 8, w: 1 });
  out.push({ kind: "step", col: 13, row: 9, w: 1 });
  // past the goal flag (GOAL_COL) only ground: the level ends there
  return out;
})();

export const COINS: Coin[] = [
  { col: 3, row: 5 },
  { col: 4, row: 5 },
  { col: 5, row: 5 },
  { col: 7.4, row: 6 },
  { col: 12.5, row: 5.4 },
  { col: 16, row: 9 },
  { col: 17.2, row: 9 },
  { col: 16.5, row: 5 },
  { col: 18.5, row: 5 },
  { col: 22.6, row: 5.6 },
];

/** World position of a tile cell's top-left at view scroll `vx` (tiles). */
export const cellToWorld = (col: number, row: number, vx: number) => ({
  x: WIN_X0 + (col - vx) * T,
  y: WIN_Y0 + row * T,
});

// --- the runner -------------------------------------------------------------
export const F_DROP0 = 58; // falls in from the top edge of the view
export const F_LAND = 64;
export const RUN_SPEED = 0.26; // tiles per frame
export const RUN_X0 = 1.6; // the runner's centre column at landing
export const VIEW_FOLLOW = 5.2; // the view scrolls once the runner passes this column
export const RUNNER_W = 0.78;
export const RUNNER_H = 0.95;
const GROUND_TOP = 10;
// jumps: [take-off column (runner centre), length in columns, height in rows]
const JUMPS: [number, number, number][] = [
  [5.6, 4.6, 3.0],
  [10.5, 5.6, 3.5],
  [20.4, 5.4, 3.4],
  [29.0, 5.2, 4.0],
  [34.7, 4.4, 3.2],
  [45.4, 4.8, 3.4],
];
const RUN_F0 = F_LAND + 2;
export const runnerXAt = (f: number) => (f <= RUN_F0 ? RUN_X0 : RUN_X0 + (f - RUN_F0) * RUN_SPEED);

/** The runner's feet y (rows) and whether airborne, at frame f. */
export const runnerAt = (f: number) => {
  const x = runnerXAt(f);
  if (f < F_LAND) {
    // falling in from above the view: a gravity drop onto the ground
    const u = clamp01((f - F_DROP0) / (F_LAND - F_DROP0));
    const top = -RUNNER_H - 0.3;
    const feet = lerp(top, GROUND_TOP, u * u);
    return { x, feet, air: true, squash: 0 };
  }
  for (const [c0, len, h] of JUMPS) {
    if (x >= c0 && x <= c0 + len) {
      const u = (x - c0) / len;
      return { x, feet: GROUND_TOP - 4 * h * u * (1 - u), air: true, squash: 0 };
    }
  }
  // a short squash after the drop landing
  const sq = f >= F_LAND && f < F_LAND + 4 ? Math.sin(((f - F_LAND) / 4) * Math.PI) : 0;
  return { x, feet: GROUND_TOP, air: false, squash: sq };
};

/** The view's scroll (columns): a softplus of the runner's lead past VIEW_FOLLOW,
 *  so it eases in over about a column and never steps. 0 until the run. */
const softplus = (d: number) => 0.6 * Math.log(1 + Math.exp(d / 0.6));
const VIEW_BIAS = softplus(RUN_X0 - VIEW_FOLLOW);
export const viewAt = (f: number) => Math.max(0, softplus(runnerXAt(f) - VIEW_FOLLOW) - VIEW_BIAS);

/** The frame a coin is collected (the runner's body reaches it), or Infinity. */
export const coinCollectAt = (coin: Coin) => {
  for (let f = RUN_F0; f < VG_DURATION + 40; f += 0.25) {
    const r = runnerAt(f);
    const cx = r.x;
    const cy = r.feet - RUNNER_H / 2;
    if (Math.abs(cx - (coin.col + 0.5)) < 0.62 && Math.abs(cy - (coin.row + 0.5)) < 0.75) return f;
  }
  return Infinity;
};

// The runner never passes through a solid tile and never lands over a pit:
// asserted at module load over the whole run.
const solidAt = (col: number, row: number) =>
  TILES.some((t) => row >= t.row && row < t.row + 1 && col >= t.col && col < t.col + t.w);
for (let f = F_LAND; f <= VG_DURATION; f += 0.25) {
  const r = runnerAt(f);
  const xs = [r.x - RUNNER_W / 2 + 0.02, r.x, r.x + RUNNER_W / 2 - 0.02];
  for (const x of xs) {
    for (let y = r.feet - RUNNER_H + 0.02; y < r.feet - 0.02; y += 0.1) {
      if (solidAt(x, y)) throw new Error(`videoGamesWorld: runner inside a tile at f${f} (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }
  }
  if (!r.air && !xs.some((x) => solidAt(x, GROUND_TOP + 0.5))) {
    throw new Error(`videoGamesWorld: runner over a pit at f${f} (x ${r.x.toFixed(2)})`);
  }
}

// --- the code becomes the first screen ---------------------------------------
// Every tile and coin of the first view (cols 0..15) is assembled from the code:
// it takes the nearest free code bar as its CORE, which flies to the tile's slot
// and morphs from a bar into the block, landing with a back ease; every other bar
// flies to its nearest tile and shrinks into it as the core lands. Rows assemble
// top down, after the model's dive is clear of them. Tiles further right were
// built off-view: they scroll in from behind the window's right edge.
export type Build = {
  kind: Tile["kind"] | "coin";
  col: number;
  row: number;
  w: number;
  key: string;
  core: CodeBar;
  fEmit: number;
  fLand: number;
};
export type Feed = { bar: CodeBar; build: number; fEmit: number; fLand: number };
export const BUILD_FLIGHT = 10;
export const BUILD_F0 = 34;
export const BUILD_F1 = 50;

const slotOf = (it: { col: number; row: number; w: number }) => ({
  x: WIN_X0 + (it.col + it.w / 2) * T,
  y: WIN_Y0 + (it.row + 0.5) * T,
});
const barCentre = (b: CodeBar) => ({ x: b.x + b.w / 2, y: b.y + CODE_H / 2 });

const BUILD_PLAN = (() => {
  const items: { kind: Build["kind"]; col: number; row: number; w: number }[] = [];
  TILES.forEach((t) => {
    if (t.col < VIEW_COLS && t.col + t.w > 0) items.push({ kind: t.kind, col: t.col, row: t.row, w: t.w });
  });
  COINS.forEach((c) => {
    if (c.col < VIEW_COLS - 0.5) items.push({ kind: "coin", col: c.col, row: c.row, w: 1 });
  });
  // top down; each row from its outer edges inward
  const rank = (it: (typeof items)[number]) => {
    const edge = Math.min(it.col, VIEW_COLS - 1 - it.col);
    return it.row * 100 + edge * 3 + hash(it.col * 13 + it.row, 3);
  };
  items.sort((a, b) => rank(a) - rank(b));
  // cores: each tile takes its nearest free bar
  const free = new Set(CODE_BARS.map((_, i) => i));
  const coreIdx: number[] = items.map((it) => {
    const s0 = slotOf(it);
    let best = -1;
    let bd = Infinity;
    free.forEach((i) => {
      const c = barCentre(CODE_BARS[i]);
      const d = Math.hypot(c.x - s0.x, c.y - s0.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    free.delete(best);
    return best;
  });
  // feeds: every other bar goes to its nearest tile
  const feedsOf: number[][] = items.map(() => []);
  free.forEach((i) => {
    const c = barCentre(CODE_BARS[i]);
    let best = 0;
    let bd = Infinity;
    items.forEach((it, j) => {
      const s0 = slotOf(it);
      const d = Math.hypot(c.x - s0.x, c.y - s0.y);
      if (d < bd) {
        bd = d;
        best = j;
      }
    });
    feedsOf[best].push(i);
  });
  const n = items.length;
  const builds: Build[] = items.map((it, j) => {
    const core = CODE_BARS[coreIdx[j]];
    const ready = Math.max(core.fWritten, ...feedsOf[j].map((i) => CODE_BARS[i].fWritten)) + 1;
    const sched = BUILD_F0 - BUILD_FLIGHT + ((BUILD_F1 - BUILD_F0) * j) / Math.max(1, n - 1);
    // never land in the model's path before it has passed
    const s0 = slotOf(it);
    const clear = agentPasses(WIN_Y0 + (it.row + 1) * T + AGENT_R * 1.5);
    const inPath = Math.abs(s0.x - agentAt(clear).x) < (it.w / 2 + 1.2) * T;
    const fEmit = Math.max(ready, sched, inPath ? clear + 2 - BUILD_FLIGHT : -Infinity) + hash(j, 61) * 0.7;
    return { ...it, key: `${it.kind}:${it.col}:${it.row}`, core, fEmit, fLand: fEmit + BUILD_FLIGHT };
  });
  const feeds: Feed[] = [];
  builds.forEach((bd, j) => {
    feedsOf[j].forEach((i, q) => {
      const bar = CODE_BARS[i];
      const fEmit = Math.max(bar.fWritten + 0.5, bd.fEmit - 1.5 + hash(i, 67) * 2.5);
      feeds.push({ bar, build: j, fEmit, fLand: Math.max(fEmit + 5, bd.fLand - 0.5 * hash(q, 5)) });
    });
  });
  return { builds, feeds };
})();
export const BUILDS: Build[] = BUILD_PLAN.builds;
export const FEEDS: Feed[] = BUILD_PLAN.feeds;
/** The frame each code bar leaves the code (as a core or a feed). */
export const BAR_LEAVES: Map<CodeBar, number> = (() => {
  const m = new Map<CodeBar, number>();
  BUILDS.forEach((b) => m.set(b.core, b.fEmit));
  FEEDS.forEach((fd) => m.set(fd.bar, fd.fEmit));
  return m;
})();
export const BUILD_SLOT = slotOf;

// ---------------------------------------------------------------------------
// THE FLOOD. Proof pages, each carrying its medal, pour out of the model, are
// flung sideways and fall into a pile that rises from a floor below the frame
// like a level. The schedule is written as LANDINGS: a landing density that
// starts at F_LAND0 and keeps climbing to F_LAND_PEAK (the pile's top rises
// steadily through the frame), then falls to a trickle. Each landing takes the
// lowest of three hashed spots on the pile's height map (so the pile rises as a
// level, not a cone); its fall from the model fixes its flight time, and
// emission = landing - flight. Early pages fall far (long flights), late ones
// barely drop, so the EMISSION rate climbs on its own: tempo and count ride one
// curve. Pages are drawn in landing order, one fixed order for the whole cut,
// so no page ever changes layer.
// ---------------------------------------------------------------------------
export const PAGE_W = 470;
export const PAGE_H = 610;
export const PAGE_STROKE = wpx(6.5);
export const F_LAND0 = 90;
export const F_LAND_PEAK = 139;
export const F_LAND_TRICKLE = 146;
const LAND_RATE0 = 0.35;
const LAND_RATE_PEAK = 3.8;
const LAND_RATE_TRICKLE = 0.45;
export const PILE_FLOOR = 7000;
export const PILE_X0 = -560;
export const PILE_X1 = 3440;
const PILE_BIN = 40;
const PILE_RISE = 0.245; // a landing page raises the pile under it by this share of its height
const N_PAGES_MAX = 140;

export const landRateAt = (f: number) => {
  if (f < F_LAND0) return 0;
  if (f <= F_LAND_PEAK) {
    const u = (f - F_LAND0) / (F_LAND_PEAK - F_LAND0);
    return lerp(LAND_RATE0, LAND_RATE_PEAK, Math.pow(u, 1.5)) * smoothstep((f - F_LAND0) / 5);
  }
  const u = smoothstep((f - F_LAND_PEAK) / (F_LAND_TRICKLE - F_LAND_PEAK));
  return lerp(LAND_RATE_PEAK, LAND_RATE_TRICKLE, u);
};

export type Page = {
  i: number;
  fEmit: number;
  x1: number;
  y1: number;
  rot1: number;
  rot0: number;
  vy0: number;
  T: number;
  fLand: number;
};

const G_PAGE = 14; // world px / frame^2 until drag
const V_TERM = 170; // terminal fall speed, world px / frame
const TAU_X = 10; // sideways drag

/** y offset after t frames with gravity + linear-drag terminal speed, launched with vy0. */
const fallY = (t: number, vy0: number) => {
  const tau = V_TERM / G_PAGE;
  return V_TERM * t + (vy0 - V_TERM) * tau * (1 - Math.exp(-t / tau));
};

/** Every page, in LANDING order (= draw order). */
export const PAGES: Page[] = (() => {
  const nb = Math.ceil((PILE_X1 - PILE_X0) / PILE_BIN);
  const surf: number[] = new Array(nb).fill(PILE_FLOOR);
  const out: Page[] = [];
  let acc = 0;
  let i = 0;
  for (let f = F_LAND0; f < VG_DURATION + 30 && i < N_PAGES_MAX; f += 0.25) {
    const r = landRateAt(f) * 0.25;
    acc += r;
    if (acc < 1) continue;
    acc -= 1;
    const fLand = f;
    // three hashed candidate spots; take the lowest (largest y) surface
    let bestX = 0;
    let bestTop = -Infinity;
    for (let c = 0; c < 3; c++) {
      const x = PILE_X0 + PAGE_W / 2 + hash(i * 3 + c, 71) * (PILE_X1 - PILE_X0 - PAGE_W);
      const b0 = Math.floor((x - PAGE_W / 2 - PILE_X0) / PILE_BIN);
      const b1 = Math.floor((x + PAGE_W / 2 - PILE_X0) / PILE_BIN);
      let top = Infinity;
      for (let b = Math.max(0, b0); b <= Math.min(nb - 1, b1); b++) top = Math.min(top, surf[b]);
      if (top > bestTop) {
        bestTop = top;
        bestX = x;
      }
    }
    const y1 = bestTop + PAGE_H * (0.5 - PILE_RISE);
    const newTop = y1 - PAGE_H / 2;
    const b0 = Math.floor((bestX - PAGE_W / 2 - PILE_X0) / PILE_BIN);
    const b1 = Math.floor((bestX + PAGE_W / 2 - PILE_X0) / PILE_BIN);
    for (let b = Math.max(0, b0); b <= Math.min(nb - 1, b1); b++) {
      surf[b] = Math.min(surf[b], newTop + 30 * hash(b + i, 5));
    }
    // flight: flung sideways and down out of the model (it never rises toward
    // the window above), falling to y1
    const dy = y1 - HUB.y;
    // the further it has to fall, the harder it is thrown down
    const vy0 = 20 + 15 * hash(i, 73) + 0.028 * Math.max(0, dy);
    let tt = 3;
    while (fallY(tt, vy0) < dy && tt < 200) tt += 0.05;
    out.push({
      i,
      fEmit: fLand - tt,
      x1: bestX,
      y1,
      rot1: (hash(i, 79) - 0.5) * 26,
      rot0: (hash(i, 83) - 0.5) * 50,
      vy0,
      T: tt,
      fLand,
    });
    i++;
  }
  return out;
})();
export const F_POUR0 = PAGES.reduce((m, p) => Math.min(m, p.fEmit), Infinity);

/** A page's state at frame f: null before emission. */
export const pageAt = (p: Page, f: number) => {
  const t = f - p.fEmit;
  if (t < 0) return null;
  if (t >= p.T) return { x: p.x1, y: p.y1, rot: p.rot1, s: 1, landed: true, t };
  const y = HUB.y + fallY(t, p.vy0);
  const ex = (1 - Math.exp(-t / TAU_X)) / (1 - Math.exp(-p.T / TAU_X));
  const x = HUB.x + (p.x1 - HUB.x) * ex;
  const u = t / p.T;
  const rot = lerp(p.rot0, p.rot1, easeInOutCubic(u));
  // out of the model: grows from the model's size over the first frames
  const s = lerp(0.3, 1, easeOutCubic(t / 7));
  return { x, y, rot, s, landed: false, t };
};
