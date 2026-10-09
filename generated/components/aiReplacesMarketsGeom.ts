import { CORNER, LINE, RED_LINE, UNIT_PX, clamp01, cumLen, hash01, pointAtLen, runVCamera } from "./chinatalkVintage";
import type { Pt, VCamKey } from "./chinatalkVintage";

// ---------------------------------------------------------------------------
// aiReplacesMarketsGeom — geometry, clocks and the camera of AIReplacesMarkets
// (Logan Wright, "Brezhnev chose decay", cut D). Pure data: no React.
//
// WORLD = the frame at the wide framing (camera (540, 960), k = 1), y down.
// Ten players stand in a tall loose ring. A player is a red disc (its stock,
// area = units) inside a dashed ink ring (what it should have: TARGET units).
// The market is a web of ink links (ten rim links + six chords) carrying red
// units. The chip is written in the middle, its pins run out as spokes, every
// link the red ink touches bleeds away, and the chip then moves units along
// its spokes until every disc sits on its ring.
//
// Every time below is a LOCAL frame of the cut (S).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const SLOT_F = 179;
export const TAIL_F = 12;
export const DURATION = SLOT_F + TAIL_F;

// --- small vector helpers -----------------------------------------------------
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt, s = 1): Pt => ({ x: a.x + b.x * s, y: a.y + b.y * s });
const norm = (a: Pt) => Math.hypot(a.x, a.y);
const unit = (a: Pt): Pt => {
  const n = norm(a) || 1;
  return { x: a.x / n, y: a.y / n };
};

// --- the players --------------------------------------------------------------
/** the radius of a disc that holds exactly what it should */
export const RING_R = 62;
/** the ring is drawn one line-width outside that, so a disc that is exactly right sits in it with a thin even paper gap */
export const RING_DRAW_R = RING_R + LINE + 1;
/** units a player should have (disc area is proportional to its units) */
export const TARGET = 8;
export const HALF_UNIT = UNIT_PX / 2;
/** clockwise from the top */
export const PLAYERS: Pt[] = [
  { x: 540, y: 290 },
  { x: 865, y: 500 },
  { x: 910, y: 740 },
  { x: 905, y: 1000 },
  { x: 865, y: 1340 },
  { x: 540, y: 1590 },
  { x: 215, y: 1340 },
  { x: 175, y: 1000 },
  { x: 170, y: 740 },
  { x: 215, y: 500 },
];
export const N = PLAYERS.length;
/** what the market leaves each player with (sum = N * TARGET) */
export const STAR_STOCK = [4, 13, 3, 12, 13, 3, 4, 12, 3, 13];
/** a disc's size follows its units a little more steeply than its area would, so a disc with too much is
 *  clearly outside its ring and one with too little clearly inside (never sitting on the ring) */
const SIZE_POW = 0.62;
export const radiusOf = (stock: number) => RING_R * Math.pow(Math.max(0, stock) / TARGET, SIZE_POW);
/** the stock bands the market keeps each kind of player in (so no disc's edge lies on its dashed ring) */
export const BAND = { bigLo: 11, bigHi: 14, smallLo: 2, smallHi: 6 };
export const inBand = (i: number, lo: number, hi: number) =>
  STAR_STOCK[i] > TARGET ? lo >= BAND.bigLo && hi <= BAND.bigHi : lo >= BAND.smallLo && hi <= BAND.smallHi;
const STAR_R = STAR_STOCK.map(radiusOf);

// --- the chip -----------------------------------------------------------------
export const CHIP = { x: 540, y: 890, half: 125, r: CORNER };
/** the tip is already writing on frame 0 and the stroke closes on "AI" */
export const CHIP_T0 = -3;
export const CHIP_T1 = 18;
/** the outline as one closed stroke, clockwise, starting on the top edge */
const CHIP_START_X = CHIP.x - 35;
const chipOutline = (): Pt[] => {
  const { x, y, half, r } = CHIP;
  const L = x - half;
  const R = x + half;
  const T = y - half;
  const B = y + half;
  const pts: Pt[] = [{ x: CHIP_START_X, y: T }];
  const arc = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (i / 8) * (Math.PI / 2);
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };
  arc(R - r, T + r, -Math.PI / 2); // top right
  arc(R - r, B - r, 0); // bottom right
  arc(L + r, B - r, Math.PI / 2); // bottom left
  arc(L + r, T + r, Math.PI); // top left
  pts.push({ x: CHIP_START_X, y: T });
  return pts;
};
export const CHIP_PTS = chipOutline();
export const CHIP_CUM = cumLen(CHIP_PTS);
export const CHIP_LEN = CHIP_CUM[CHIP_CUM.length - 1];
export const CHIP_V = CHIP_LEN / (CHIP_T1 - CHIP_T0);
/** arc length of the outline written at S (constant speed) */
export const chipLenAt = (S: number) => CHIP_LEN * clamp01((S - CHIP_T0) / (CHIP_T1 - CHIP_T0));
/** the frame the writing tip passes arc length s */
export const chipTimeAt = (s: number) => CHIP_T0 + s / CHIP_V;

// --- the spokes: a pin on the chip that keeps going to its player ---------------
const PIN_LEN = 34;
/** the unit path continues this far under the chip's body */
const INNER = 46;
const FILLET = 26;
const PIN_OFF = 70;
const SIDE_OFF = 50;
const PIN_BASE: { p: Pt; n: Pt }[] = [
  { p: { x: CHIP.x, y: CHIP.y - CHIP.half }, n: { x: 0, y: -1 } },
  { p: { x: CHIP.x + PIN_OFF, y: CHIP.y - CHIP.half }, n: { x: 0, y: -1 } },
  { p: { x: CHIP.x + CHIP.half, y: CHIP.y - SIDE_OFF }, n: { x: 1, y: 0 } },
  { p: { x: CHIP.x + CHIP.half, y: CHIP.y + SIDE_OFF }, n: { x: 1, y: 0 } },
  { p: { x: CHIP.x + PIN_OFF, y: CHIP.y + CHIP.half }, n: { x: 0, y: 1 } },
  { p: { x: CHIP.x, y: CHIP.y + CHIP.half }, n: { x: 0, y: 1 } },
  { p: { x: CHIP.x - PIN_OFF, y: CHIP.y + CHIP.half }, n: { x: 0, y: 1 } },
  { p: { x: CHIP.x - CHIP.half, y: CHIP.y + SIDE_OFF }, n: { x: -1, y: 0 } },
  { p: { x: CHIP.x - CHIP.half, y: CHIP.y - SIDE_OFF }, n: { x: -1, y: 0 } },
  { p: { x: CHIP.x - PIN_OFF, y: CHIP.y - CHIP.half }, n: { x: 0, y: -1 } },
];
export type Spoke = {
  /** from a point hidden under the chip's body, through the pin base, to the player's centre */
  pts: Pt[];
  cum: number[];
  len: number;
  /** arc length of the pin base (the chip's outline) */
  sBase: number;
  /** the drawn spoke: from the pin base to the player's centre */
  drawPts: Pt[];
  drawLen: number;
};
const buildSpoke = (i: number): Spoke => {
  const { p, n } = PIN_BASE[i];
  const target = PLAYERS[i];
  const inner = add(p, n, -INNER);
  const corner = add(p, n, PIN_LEN);
  const u2 = unit(sub(target, corner));
  const dot = n.x * u2.x + n.y * u2.y;
  const phi = Math.acos(Math.max(-1, Math.min(1, dot)));
  const draw: Pt[] = [p];
  if (phi < 0.02) {
    draw.push(target);
  } else {
    const t = FILLET * Math.tan(phi / 2);
    const sgn = n.x * u2.y - n.y * u2.x > 0 ? 1 : -1;
    const p1 = add(corner, n, -t);
    const o = add(p1, { x: -n.y * sgn, y: n.x * sgn }, FILLET);
    const a1 = Math.atan2(p1.y - o.y, p1.x - o.x);
    for (let j = 0; j <= 6; j++) {
      const a = a1 + sgn * phi * (j / 6);
      draw.push({ x: o.x + FILLET * Math.cos(a), y: o.y + FILLET * Math.sin(a) });
    }
    draw.push(target);
  }
  const pts = [inner, ...draw];
  const cum = cumLen(pts);
  const dcum = cumLen(draw);
  return { pts, cum, len: cum[cum.length - 1], sBase: INNER, drawPts: draw, drawLen: dcum[dcum.length - 1] };
};
export const SPOKES: Spoke[] = PLAYERS.map((_, i) => buildSpoke(i));

/** the spokes reach their players one after another round the ring */
export const V_SPOKE = 12;
const TOUCH_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const TOUCH_T0 = 40;
const TOUCH_T1 = 68;
/** the frame spoke i's tip touches its player (ring or bulging disc) */
export const TOUCH_T: number[] = (() => {
  const t: number[] = new Array(N).fill(0);
  TOUCH_ORDER.forEach((p, rank) => {
    t[p] = TOUCH_T0 + (rank * (TOUCH_T1 - TOUCH_T0)) / (N - 1);
  });
  return t;
})();
/** distance from the player's centre at which the tip touches it */
export const TOUCH_GAP = STAR_R.map((r) => Math.max(RING_DRAW_R + LINE / 2, r) + RED_LINE / 2);
export const SPOKE_T0 = SPOKES.map((s, i) => TOUCH_T[i] - (s.drawLen - TOUCH_GAP[i]) / V_SPOKE);
/** drawn length of spoke i at S (constant speed) */
export const spokeLenAt = (i: number, S: number) => Math.max(0, Math.min(SPOKES[i].drawLen, V_SPOKE * (S - SPOKE_T0[i])));
/** the frame the chip's writing tip passes pin base i */
export const PIN_PASS_T = PIN_BASE.map(({ p }) => {
  let best = Infinity;
  let sBest = 0;
  for (let j = 1; j < CHIP_PTS.length; j++) {
    const a = CHIP_PTS[j - 1];
    const b = CHIP_PTS[j];
    const ab = sub(b, a);
    const l2 = ab.x * ab.x + ab.y * ab.y || 1;
    const t = clamp01(((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / l2);
    const d = Math.hypot(a.x + ab.x * t - p.x, a.y + ab.y * t - p.y);
    if (d < best) {
      best = d;
      sBest = CHIP_CUM[j - 1] + Math.sqrt(l2) * t;
    }
  }
  return chipTimeAt(sBest);
});

// --- the web --------------------------------------------------------------------
/** how long one place on a link takes to soak away (quick: the line reads as half gone, never as a smudge) */
export const DIFF_F = 6;
/** the bleed runs along a link from where the red ink touched it, world px / frame */
const BLEED_V = 30;
export type Trigger = { t: number; s: number };
export type Link = { a: number; b: number; A: Pt; B: Pt; len: number; chord: boolean; trig: Trigger[]; tDie: number; tGone: number };
const CHORDS: [number, number][] = [
  [9, 3],
  [1, 7],
  [8, 4],
  [2, 6],
  [2, 7],
  [3, 8],
];
/** where (arc length along the chip outline) a segment first meets the outline, or -1 */
const outlineHit = (A: Pt, B: Pt): { sOut: number; sLink: number } | null => {
  let best: { sOut: number; sLink: number } | null = null;
  const d = sub(B, A);
  const L = norm(d);
  for (let j = 1; j < CHIP_PTS.length; j++) {
    const p = CHIP_PTS[j - 1];
    const e = sub(CHIP_PTS[j], p);
    const den = d.x * e.y - d.y * e.x;
    if (Math.abs(den) < 1e-9) continue;
    const w = sub(p, A);
    const t = (w.x * e.y - w.y * e.x) / den;
    const u = (w.x * d.y - w.y * d.x) / den;
    if (t < 0 || t > 1 || u < 0 || u > 1) continue;
    const sOut = CHIP_CUM[j - 1] + norm(e) * u;
    if (!best || sOut < best.sOut) best = { sOut, sLink: L * t };
  }
  return best;
};
const buildLinks = (): Link[] => {
  const links: Link[] = [];
  const mk = (a: number, b: number, chord: boolean) => {
    const A = PLAYERS[a];
    const B = PLAYERS[b];
    const len = norm(sub(B, A));
    // a spoke touching either player starts the bleed at that player's rim
    const trig: Trigger[] = [
      { t: TOUCH_T[a], s: STAR_R[a] },
      { t: TOUCH_T[b], s: len - STAR_R[b] },
    ];
    if (chord) {
      const hit = outlineHit(A, B);
      // the bead (about half a frame of travel) touches the chord before the tip's centre does
      if (hit) trig.push({ t: chipTimeAt(hit.sOut) - 0.4, s: hit.sLink });
    }
    const tDie = Math.min(...trig.map((g) => g.t));
    let tGone = 0;
    for (let s = 0; s <= len; s += len / 16) {
      tGone = Math.max(tGone, Math.min(...trig.map((g) => g.t + Math.abs(s - g.s) / BLEED_V)) + DIFF_F);
    }
    links.push({ a, b, A, B, len, chord, trig, tDie, tGone });
  };
  for (let i = 0; i < N; i++) mk(i, (i + 1) % N, false);
  CHORDS.forEach(([a, b]) => mk(a, b, true));
  return links;
};
export const LINKS = buildLinks();
/** local bleed progress (0 intact .. 1 gone) of link l at arc length s */
export const linkBleed = (l: Link, s: number, S: number) => {
  let u = 0;
  for (const g of l.trig) u = Math.max(u, (S - g.t - Math.abs(s - g.s) / BLEED_V) / DIFF_F);
  return clamp01(u);
};
/** the MARKETS label goes with the last spoke (the one under it) */
export const LABEL_DIE_T = TOUCH_T[0];
export const LABEL_DIFF_F = 14;

// --- the market's trades ----------------------------------------------------------
export type StockEvent = { player: number; t0: number; t1: number; d: number };
export type Trade = {
  link: number;
  /** 1: from a to b, -1: from b to a */
  dir: 1 | -1;
  src: number;
  dst: number;
  /** the frame the unit's centre would be at the source's centre */
  t0: number;
  v: number;
  /** visible between these frames (leading edge out of the source .. trailing edge into the destination) */
  tIn: number;
  tOut: number;
};
/** the schedule: a seed for its timings and one bit per trade (in generation order) for which way it goes */
const TRADE_SEED = 178;
const TRADE_DIRS = 44787050;
/** Trades as a seeded, deterministic schedule. A rim link carries one unit at a
 *  time, there and back; a chord (it dies early) one or two units on their last
 *  approach. Nothing is launched on a link in its last 20 frames, and every unit
 *  is home before its link starts to bleed. */
export const buildTrades = (seed: number, dirs: number) => {
  const r = (i: number, j: number) => hash01(i * 7.13 + seed * 1.37, j * 3.77 + seed * 0.61 + 1.3);
  const raw: { link: number; dir: 1 | -1; src: number; dst: number; t0: number; v: number }[] = [];
  const push = (li: number, dir: 1 | -1, tArr: number, v: number) => {
    // tArr: the frame the unit's centre crosses the destination's (nominal) rim
    const l = LINKS[li];
    const src = dir === 1 ? l.a : l.b;
    const dst = dir === 1 ? l.b : l.a;
    const t0 = tArr - (l.len - STAR_R[dst]) / v;
    raw.push({ link: li, dir, src, dst, t0, v });
    return t0 + STAR_R[src] / v;
  };
  LINKS.forEach((l, li) => {
    const nextDir = (): 1 | -1 => ((dirs >> raw.length) & 1 ? 1 : -1);
    if (l.chord) {
      const n = l.tDie > 12 ? 2 : 1;
      let tEnd = l.tDie - 2.6;
      for (let m = 0; m < n; m++) {
        const v = 14 + 4 * r(li, 10 + m);
        const tArr = tEnd - HALF_UNIT / v;
        if (tArr < 2) break;
        push(li, nextDir(), tArr, v);
        tEnd -= 7 + 6 * r(li, 20 + m);
      }
      return;
    }
    const span = l.len - STAR_R[l.a] - STAR_R[l.b];
    let v = 8.5 + 4 * r(li, 10);
    let h = HALF_UNIT / v;
    let tArr = Math.min(l.tDie - 20.6 - 4 * r(li, 2) + h + span / v, l.tDie - 3 - h);
    for (let m = 0; m < 8 && tArr + h >= 0.5; m++) {
      const tDep = push(li, nextDir(), tArr, v);
      const launch = tDep - h;
      v = 8.5 + 4 * r(li, 11 + m);
      h = HALF_UNIT / v;
      // the unit before it is home before this one leaves
      tArr = launch - (2 + 5 * r(li, 30 + m)) - h;
    }
  });
  // event windows from the discs' real radii (a disc's radius follows its stock): iterate to a fixed point
  let rDep = raw.map((t) => STAR_R[t.src]);
  let rArr = raw.map((t) => STAR_R[t.dst]);
  let events: (StockEvent & { trade: number; dep: boolean })[] = [];
  for (let it = 0; it < 4; it++) {
    events = [];
    raw.forEach((t, j) => {
      const h = HALF_UNIT / t.v;
      const tDep = t.t0 + rDep[j] / t.v;
      const tArr = t.t0 + (LINKS[t.link].len - rArr[j]) / t.v;
      events.push({ player: t.src, t0: tDep - h, t1: tDep + h, d: -1, trade: j, dep: true });
      events.push({ player: t.dst, t0: tArr - h, t1: tArr + h, d: 1, trade: j, dep: false });
    });
    const nd = [...rDep];
    const na = [...rArr];
    for (let i = 0; i < N; i++) {
      const ev = events.filter((e) => e.player === i).sort((x, y) => y.t0 - x.t0);
      let s = STAR_STOCK[i];
      for (const e of ev) {
        s -= e.d; // the stock BEFORE this event
        if (e.dep) nd[e.trade] = radiusOf(s);
        else na[e.trade] = radiusOf(s);
      }
    }
    rDep = nd;
    rArr = na;
  }
  const trades: Trade[] = raw.map((t, j) => {
    const dep = events.filter((e) => e.trade === j && e.dep)[0];
    const arr = events.filter((e) => e.trade === j && !e.dep)[0];
    return { ...t, tIn: dep.t0, tOut: arr.t1 };
  });
  const ev: StockEvent[] = events.map((e) => ({ player: e.player, t0: e.t0, t1: e.t1, d: e.d }));
  return { trades, events: ev };
};
const MARKET = buildTrades(TRADE_SEED, TRADE_DIRS);
export const TRADES = MARKET.trades;

// --- the reallocation: one highlight (the instruction), then trains ----------------
export const HL_T0 = 114;
export const HL_V = 34;
/** one constant speed for every unit the chip moves, and the gap between units of a train */
export const V_TRAIN = 24;
export const TRAIN_GAP_F = 4;
export type TrainUnit = {
  player: number;
  /** 1: outward (chip -> player), -1: inward (player -> chip) */
  dir: 1 | -1;
  /** arc length along the spoke path at frame tA, then moving at V_TRAIN * dir */
  sA: number;
  tA: number;
  /** drawn between these frames */
  tIn: number;
  tOut: number;
};
/** players the chip fills, with the frame their LAST unit has gone in (round the circle) */
const FILL_LAND: [number, number][] = [
  [6, 156.5],
  [8, 159.5],
  [0, 162.5],
  [2, 165.5],
  [5, 168.5],
];
const buildTrains = () => {
  const units: TrainUnit[] = [];
  const events: StockEvent[] = [];
  const landT: number[] = new Array(N).fill(0);
  const firstT: number[] = new Array(N).fill(0);
  const chipIn: number[] = [];
  const chipOut: number[] = [];
  const h = HALF_UNIT / V_TRAIN;
  // inward: a player with too much starts sending when the instruction reaches it
  for (let i = 0; i < N; i++) {
    const extra = STAR_STOCK[i] - TARGET;
    if (extra <= 0) continue;
    const sp = SPOKES[i];
    const hlArrive = HL_T0 + (sp.len - sp.sBase - STAR_R[i]) / HL_V;
    // (mirror-image players would finish together: one of each pair waits a moment)
    const start = Math.ceil(hlArrive * 2) / 2 + 1 + (i === 9 ? 2.5 : i === 7 ? 2 : 0);
    firstT[i] = start;
    for (let j = 0; j < extra; j++) {
      const r = radiusOf(STAR_STOCK[i] - j);
      const tE = start + j * TRAIN_GAP_F; // its leading edge is at the rim
      const sA = sp.len - r + HALF_UNIT;
      units.push({ player: i, dir: -1, sA, tA: tE, tIn: tE, tOut: tE + sA / V_TRAIN });
      events.push({ player: i, t0: tE, t1: tE + 2 * h, d: -1 });
      landT[i] = tE + 2 * h;
      chipIn.push(tE + (sA - sp.sBase) / V_TRAIN);
    }
  }
  // outward: trains that end on the landing frame
  FILL_LAND.forEach(([i, land]) => {
    const need = TARGET - STAR_STOCK[i];
    const sp = SPOKES[i];
    landT[i] = land;
    for (let j = 0; j < need; j++) {
      const r = radiusOf(STAR_STOCK[i] + j);
      const sTouch = sp.len - r - HALF_UNIT; // its leading edge is at the rim
      const tTouch = land - 2 * h - (need - 1 - j) * TRAIN_GAP_F;
      const tLeave = tTouch - sTouch / V_TRAIN; // at s = 0, hidden under the chip
      units.push({ player: i, dir: 1, sA: 0, tA: tLeave, tIn: tLeave, tOut: tTouch + 2 * h + 0.5 });
      events.push({ player: i, t0: tTouch, t1: tTouch + 2 * h, d: 1 });
      chipOut.push(tLeave + sp.sBase / V_TRAIN);
      if (j === 0) firstT[i] = tLeave + sp.sBase / V_TRAIN;
    }
  });
  return { units, events, landT, firstT, chipIn: chipIn.sort((a, b) => a - b), chipOut: chipOut.sort((a, b) => a - b) };
};
const TRAINS = buildTrains();
export const TRAIN_UNITS = TRAINS.units;
/** the frame player i's disc meets its ring exactly */
export const LAND_T = TRAINS.landT;
export const TRAIN_DIAG = { firstT: TRAINS.firstT, chipIn: TRAINS.chipIn, chipOut: TRAINS.chipOut };
/** the dashed ring is written solid over this many frames from LAND_T */
export const SOLID_F = 6;

// --- a player's stock at S ----------------------------------------------------------
const EVENTS_BY_PLAYER: { market: StockEvent[]; train: StockEvent[] }[] = PLAYERS.map((_, i) => ({
  market: MARKET.events.filter((e) => e.player === i),
  train: TRAINS.events.filter((e) => e.player === i),
}));
const ramp = (e: StockEvent, S: number) => clamp01((S - e.t0) / (e.t1 - e.t0));
/** units player i holds at S (fractional while a unit slides in or out under its rim) */
export const stockAt = (i: number, S: number) => {
  let s = STAR_STOCK[i];
  const ev = EVENTS_BY_PLAYER[i];
  // market events are counted BACK from the stock the market ends on
  for (const e of ev.market) s -= e.d * (1 - ramp(e, S));
  for (const e of ev.train) s += e.d * ramp(e, S);
  return s;
};
/** integer-stock extremes of the market phase per player (diagnostics / assertion) */
export const marketStockRange = (events: StockEvent[] = MARKET.events) =>
  PLAYERS.map((_, i) => {
    const ev = events.filter((e) => e.player === i && e.t1 > 0).sort((a, b) => b.t0 - a.t0);
    let s = STAR_STOCK[i];
    let lo = s;
    let hi = s;
    for (const e of ev) {
      s -= e.d;
      lo = Math.min(lo, s);
      hi = Math.max(hi, s);
    }
    return { lo, hi, at0: s };
  });

// --- the tail: the same soft highlight runs out along every spoke again, twice ----------
export const TAIL_HL_T = [168, 184];
export const TAIL_HL_V = 18;

// --- the wash that wakes the chip -------------------------------------------------------
export const WASH_T0 = 80;
export const WASH_T1 = 111;

// --- the camera: its own keyed track --------------------------------------------------
export const CAM_KEYS: VCamKey[] = [
  { f: -24, x: 540, y: 962, k: 1.0 },
  { f: 70, x: 540, y: 958, k: 1.03, ease: "linear" },
  { f: 106, x: 540, y: 946, k: 1.1 },
  { f: 122, x: 540, y: 945, k: 1.108, ease: "linear" },
  { f: 146, x: 540, y: 960, k: 1.0 },
  { f: DURATION, x: 540, y: 954, k: 1.03, ease: "linear" },
];
export const camAt = runVCamera(CAM_KEYS, DURATION);

/** a point on spoke i's unit path */
export const spokePoint = (i: number, s: number): Pt => pointAtLen(SPOKES[i].pts, SPOKES[i].cum, s);

// --- self-checks: the component refuses to render if any of these fail ------------------
export const GEOM_PROBLEMS: string[] = (() => {
  const out: string[] = [];
  for (let i = 0; i < N; i++) {
    if (SPOKE_T0[i] < PIN_PASS_T[i] + 0.5) out.push(`spoke ${i} starts before the chip tip passed its pin`);
  }
  if (STAR_STOCK.reduce((a, b) => a + b, 0) !== N * TARGET) out.push("stocks do not sum to the target");
  for (const t of TRADES) {
    if (t.tOut > LINKS[t.link].tDie - 0.4) out.push(`a trade is still on link ${t.link} when it starts to bleed`);
  }
  marketStockRange().forEach((r, i) => {
    // a disc is either clearly inside its ring or clearly overflowing it, never sitting on it
    if (!inBand(i, r.lo, r.hi)) out.push(`player ${i} leaves its stock band in the market phase (${r.lo}-${r.hi})`);
  });
  return out;
})();
