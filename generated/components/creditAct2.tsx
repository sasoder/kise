import React from "react";
import {
  DATA_W,
  DOT_R,
  DashedPath,
  FeatherWipe,
  HatchFill,
  INK,
  INK_HI,
  INK_LO,
  INK_W,
  Label,
  PAPER,
  RED,
  RED_DEEP,
  RED_HI,
  RED_WET,
  WASH_FILL,
  WASH_HATCH,
  WetLine,
  Bead,
  camEase,
  camFromTrack,
  clamp01,
  cumLen,
  easeOutCubic,
  enterU,
  glideTargetAt,
  inkDiffuse,
  labelCapH,
  labelPx,
  labelWidth,
  lerp,
  mixHex,
  paperShadow,
  pointAtLen,
  polyD,
  CAM_DAMP,
  CAM_STIFF,
  camFromLook,
  smoothstep,
  subPathD,
  sz,
} from "./chinatalkShared";
import type { Cam, Glide, Pt } from "./chinatalkShared";
import { ACT1_END, CAM_JOIN_S, CAM_START, DIP_D, E_Y, GLIDES_ACT1, JOIN_CAM_STATE, S_END, VALVE, X, eTipYear, eY, yearAtX } from "./creditGeom";
import type { WorldOverride } from "./creditWorld";

// ---------------------------------------------------------------------------
// creditAct2 — ACT 2, the machine at the tower's foot (builder B; B2 second pass,
// Oct 5 2026), master S 480-1346, plus the camera and the retirements from S 440.
// Logan Wright: "first, there was a deliberate attempt to provide this sort of credit
// expansion ... in the response to global financial crisis, but the extension of it
// after that was essentially a form of path dependence. Growth was strong, it was
// dependent upon investment, and then it became too difficult for authorities to shut
// down without imperiling the overall economy. And so as a result you had a variety of
// different developments that took place that facilitated the growth of the shadow
// banking system, and growth in credit was increasingly disconnected from the real
// economy itself."
//
// One machine, one continuous flow: the red tower (credit) drains through a valve into
// the 2008 dip, fills it, runs on in its own groove under the economy line E, props E up
// through investment pills, is throttled and released by a hand, leaks into shadow
// channels, and finally surfaces as a red line that peels away from E.
// Every flow state is a function of the valve opening o(S) travelling down the groove at
// FRONT_V world px / frame, so the blocks, the line's sag and the surge are reached by
// the mechanism, never by a timer. Everything is a function of the master clock S.
//
// GESTURES (gesture -> the word it serves -> S frames)
//  1 camera: ONE long C1 dive out of Act 1's decaying creep down + in to the
//    tower's foot (k 0.20 -> 1.2), the flag and the tower's top leaving through
//    the top; lands into the pool creep, settled (< 2.5 px/f) by S 502 ........... "aspects of that / first there was a" 440-502
//    (retirements through the move: the history row diffuses out like ink 449-477,
//    "BANK ASSETS" diffuses as it rises out 451-468)
//  2 the valve writes in (spout walls, stem, a plain handwheel: rim, 4 spokes, hub) "was a" -> "deliberate" ..... 494-512
//  3 the wheel turns 110 deg open; red runs down the spout ...................... "deliberate attempt" ........ 508-522
//  4 the stream falls and POOLS in the dip, level = integral of the flow;
//    the camera creeps in on it (k 1.2 -> 2.7, held breath) ..................... "to provide ... global financial" 518-666
//    the pool reaches the brim and E writes back across it ....................... "crisis" .................... 664-682
//  5 the full pool pushes out under E to the right, under the tower's foot;
//    the groove's banks are written by the advancing head ........................ "but the extension of it after that" 682-765
//  6 the head races right carving the groove; the camera follows, lands ......... "path dependence" ........... 765-792
//  7 E right of the tower rises into the growth curve (wet ink), camera follows .. "growth was strong" ......... 794-834
//  8 four investment pills slide up out of the groove and seat under E; red seeps
//    up into each from the groove; "INVESTMENT" lands ........................... "dependent upon investment" . 829-863 (label 849)
//  9 camera eases back to hold grip + valve + growth line + the whole dashed fall
//    in one frame centred on x 540, slow creep ................................... "and then it became too difficult" 862-930
// 10 an arm reaches in from off-frame left (sleeve lines, cuff, a slim hand) ..... "for authorities" ........... 893-924
// 11 the fingers close round the rim (one eased morph), the hand turns the wheel
//    75 deg closed riding the rim: the stream thins and darkens, the
//    throttle travels down the groove, the pills lose their red ................. "to shut down" .............. 922-960
// 12 E SINKS ~26 screen px at its tip (lagged, one small wobble) as its props go
//    dark; a DASHED projection
//    writes ahead of its tip, falling steeply to E's level ...................... "without imperiling" ........ 950-987
// 13 the hand lets go and pulls out of frame; the wheel spins back open; a wet
//    surge runs down the groove, the pills re-redden, E recovers, the dashed line
//    diffuses like ink ............................................................ "the overall economy" ....... 989-1035
// 14 camera tilts down to the groove (valve whole at left, E's tip whole at right);
//    a pressure pulse runs along it and four
//    branch points open on its lower bank as it passes ........................... "a variety of different developments" 1024-1100
// 15 deep-red shadow channels root downward and fork (camera follows them down);
//    "SHADOW BANKING" lands ....................................................... "facilitated ... shadow banking" 1138-1211 (label 1181)
// 16 the head at the groove's end surfaces as a red line through E and runs
//    alongside it; "CREDIT" lands ............................................... "and growth in credit" ...... 1219-1262 (label 1241)
//    (FINAL fix: "CREDIT" and "REAL ECONOMY" hold >= 42 screen px; through the pull-back
//    "CREDIT" rides up beside the climbing red line, behind its tip)
// 17 the red line climbs steeply away toward the tower's height, E runs on flat,
//    the gap fills with an ink wash + hatch (feathered at the tip); the camera pulls
//    back (pivot zoom, k 1.36 -> 0.21) FOLLOWING the red tip (held at screen x ~905)
//    until the whole tower stands at the left as the source ...................... "was increasingly disconnected" 1252-1346
// 18 "REAL ECONOMY" lands under E; the divergence is still widening on the last frame "real economy itself" ...... 1307 / tail
// Retirements (no word of their own; the picture no longer needs them): "INVESTMENT" diffuses
// before the channels grow through it (1122-1138); "SHADOW BANKING" diffuses as the camera
// leaves it (1232-1248); the valve and the groove banks settle to ink 0.42 once they stop being
// the subject; E is 0.90 while it is the subject (794-1030, 1294-).
// ---------------------------------------------------------------------------

// --- small helpers ------------------------------------------------------------------
type HK = { S: number; x: number; v: number };
/** C1 piecewise cubic Hermite through (S, x, dx/dS) knots; linear outside. */
const herm = (knots: HK[], S: number) => {
  const a0 = knots[0];
  const z = knots[knots.length - 1];
  if (S <= a0.S) return a0.x + a0.v * (S - a0.S);
  if (S >= z.S) return z.x + z.v * (S - z.S);
  let i = 0;
  while (i < knots.length - 2 && S > knots[i + 1].S) i++;
  const a = knots[i];
  const b = knots[i + 1];
  const h = b.S - a.S;
  const t = (S - a.S) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a.x + (t3 - 2 * t2 + t) * h * a.v + (-2 * t3 + 3 * t2) * b.x + (t3 - t2) * h * b.v;
};
/** first S in [lo, hi] where a monotone f(S) reaches v (bisection). */
const sWhen = (f: (S: number) => number, v: number, lo: number, hi: number) => {
  if (f(lo) >= v) return lo;
  if (f(hi) < v) return Infinity;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (f(m) < v) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
/** mix two #RRGGBB colours -> #RRGGBB (chinatalkShared's mixHex returns rgb(), which cannot be re-mixed) */
const mixH = (a: string, b: string, t: number) => {
  const m = mixHex(a, b, t).match(/\d+/g) ?? ["0", "0", "0"];
  return `#${m.map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
};
const bump = (u: number) => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) ** 2);
const deg = Math.PI / 180;

// --- the words (start_f from words.tsv) ---------------------------------------------------
const W = {
  deliberate: 506,
  crisis: 668,
  but: 684,
  path: 769,
  dependence: 775,
  growth: 794,
  investment: 849,
  authorities: 913,
  shut: 930,
  imperiling: 962,
  economy: 1007,
  facilitated: 1140,
  banking: 1180,
  credit: 1241,
  disconnected: 1270,
  realEconomy: 1302,
};

// ---------------------------------------------------------------------------
// THE VALVE: an ink spout out of the tower's left wall (VALVE anchor), bending down
// over the dip, with a ship's-wheel handwheel on a stem (Lucide "ship-wheel" grammar:
// rim r 8, hub r 2.5, eight spokes out to r 10, at U_WHEEL world px per unit).
// ---------------------------------------------------------------------------
const VX = VALVE.x; // 113
const VY = VALVE.y; // -70
const PIPE_HALF = 9;
const ELBOW_R = 12;
const MOUTH = { x: 54, y: -40 };
/** the spout's centreline, wall -> mouth */
const PIPE_C: Pt[] = (() => {
  const pts: Pt[] = [{ x: VX, y: VY }, { x: MOUTH.x + ELBOW_R, y: VY }];
  const cx = MOUTH.x + ELBOW_R;
  const cy = VY + ELBOW_R;
  for (let i = 1; i <= 8; i++) {
    const a = -Math.PI / 2 - (i / 8) * (Math.PI / 2);
    pts.push({ x: cx + ELBOW_R * Math.cos(a), y: cy + ELBOW_R * Math.sin(a) });
  }
  pts.push({ x: MOUTH.x, y: MOUTH.y });
  return pts;
})();
/** a wall of the spout at offset r from the elbow centre (r = ELBOW_R +- PIPE_HALF) */
const pipeWall = (side: 1 | -1): Pt[] => {
  const r = ELBOW_R + side * PIPE_HALF;
  const cx = MOUTH.x + ELBOW_R;
  const cy = VY + ELBOW_R;
  const pts: Pt[] = [{ x: VX, y: cy - r }, { x: cx, y: cy - r }];
  for (let i = 1; i <= 8; i++) {
    const a = -Math.PI / 2 - (i / 8) * (Math.PI / 2);
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  pts.push({ x: cx - r, y: MOUTH.y });
  return pts;
};
const WALL_OUT = pipeWall(1);
const WALL_IN = pipeWall(-1);
const WALL_OUT_LEN = cumLen(WALL_OUT)[WALL_OUT.length - 1];
const WALL_IN_LEN = cumLen(WALL_IN)[WALL_IN.length - 1];
/** the S at which the spout walls' draw reached fraction q (inverse of easeOutCubic over S 486-496) */
const wallS = (q: number) => 494 + 10 * (1 - Math.cbrt(1 - clamp01(q)));
/** a plain valve handwheel on Lucide's 24 grid: rim r 9, hub r 2, four spokes hub -> rim
 *  (round caps and joins, no fill), U_WHEEL world px per grid unit; stroke = INK_W on screen */
const U_WHEEL = 4;
const RIM_R = 9 * U_WHEEL;
const HUB_R = 2 * U_WHEEL;
const WHEEL = { x: 70, y: VY - PIPE_HALF - 14 - RIM_R };
const STEM: Pt[] = [
  { x: WHEEL.x, y: VY - PIPE_HALF },
  { x: WHEEL.x, y: WHEEL.y + RIM_R },
];

/** wheel angle (deg, clockwise +): opens -110 on "deliberate", the hand closes it 75,
 *  it spins back open when let go. */
const OPEN0 = 508;
const OPEN1 = 522;
const CLOSE0 = 930;
const CLOSE1 = 946;
const REOPEN0 = 998;
const REOPEN1 = 1011;
const OPEN_DEG = 110;
const CLOSE_DEG = 75;
const wheelDeg = (S: number) =>
  -OPEN_DEG * smoothstep((S - OPEN0) / (OPEN1 - OPEN0)) +
  CLOSE_DEG * smoothstep((S - CLOSE0) / (CLOSE1 - CLOSE0)) -
  CLOSE_DEG * easeOutCubic((S - REOPEN0) / (REOPEN1 - REOPEN0));
/** the valve's opening 0..1 */
const openAt = (S: number) => clamp01(-wheelDeg(S) / OPEN_DEG);
const O_MIN = 1 - CLOSE_DEG / OPEN_DEG; // 0.318: "part-way closed"
/** throttle 0..1 at the valve (0 = full flow, 1 = the hand's closed position) */
const thrValve = (S: number) => (S < OPEN1 ? 0 : clamp01((1 - openAt(S)) / (1 - O_MIN)));

// --- the flow's travel ---------------------------------------------------------------------
const PIPE_LEN = (() => {
  const c = cumLen(PIPE_C);
  return c[c.length - 1];
})();
const PIPE_RED0 = 512; // red enters the spout as the wheel passes ~1/3 open
const PIPE_RED1 = 518; // ... and reaches the mouth
const FALL0 = 518;
const FALL1 = 530;
/** the throttle state (and the surge) travel from the valve down the system at this
 *  speed (world px / frame); `along` = distance from the valve. */
const FRONT_V = 40;
const thrAlong = (along: number, S: number) => thrValve(S - along / FRONT_V);
/** the reopening surge: wetness at distance `along` (rises in 3 f, dries over 16 f) */
const SURGE0 = REOPEN0 + 1;
const surgeAlong = (along: number, S: number) => {
  const d = S - SURGE0 - along / FRONT_V;
  if (d < 0) return 0;
  if (d < 3) return d / 3;
  return 1 - smoothstep((d - 3) / 16);
};
/** the flow's highlight phase: material speed is proportional to the opening */
const PHASE: number[] = (() => {
  const out: number[] = [];
  let p = 0;
  for (let S = ACT1_END; S <= S_END + 4; S++) {
    out.push(p);
    p += 4.2 * (S >= OPEN0 ? openAt(S) : 0);
  }
  return out;
})();
const phaseAt = (S: number) => {
  const t = Math.max(0, Math.min(PHASE.length - 1.001, S - ACT1_END));
  const i = Math.floor(t);
  return PHASE[i] + (PHASE[i + 1] - PHASE[i]) * (t - i);
};
const HL_P = 230;
/** travelling highlight amount at arc s of a flow whose phase is ph */
const hlAt = (s: number, ph: number) => {
  const m = (((ph - s) % HL_P) + HL_P) % HL_P;
  return Math.exp(-Math.pow((m - HL_P / 2) / 24, 2));
};

// ---------------------------------------------------------------------------
// THE DIP and THE POOL. Left wall: dipDy rises as ((yr-2008)/0.75)^1.5; right wall:
// D (1-u)^2 (creditGeom). The pool fills the V from the floor, its volume = the
// integral of the flow since the stream landed; the level is the inverse of the V's
// area table. Inset by half an ink stroke so E's V stays drawn over it.
// ---------------------------------------------------------------------------
const ERA = 75;
const xLeftWall = (y: number) => ERA * 0.75 * Math.pow(clamp01(y / DIP_D), 2 / 3);
const xRightWall = (y: number) => ERA * (0.75 + 0.65 * (1 - Math.sqrt(clamp01(y / DIP_D))));
const AREA: number[] = (() => {
  // AREA[i] = area of the V between y = i and the floor (y = DIP_D)
  const out: number[] = new Array(DIP_D + 1).fill(0);
  for (let i = DIP_D - 1; i >= 0; i--) {
    const w = xRightWall(i + 0.5) - xLeftWall(i + 0.5);
    out[i] = out[i + 1] + w;
  }
  return out;
})();
const BRIM_Y = E_Y + 3;
const POOL0 = FALL1; // the stream lands
const BRIM_S = 666; // full as "crisis" lands
const POOL_FLOW: number[] = (() => {
  const out: number[] = [];
  let v = 0;
  for (let S = POOL0; S <= BRIM_S; S++) {
    out.push(v);
    v += openAt(S);
  }
  return out;
})();
/** the pool's surface y at S (DIP_D = empty, BRIM_Y = full) */
const poolLevel = (S: number) => {
  if (S <= POOL0) return DIP_D;
  if (S >= BRIM_S) return BRIM_Y;
  const t = S - POOL0;
  const i = Math.floor(t);
  const f = POOL_FLOW[i] + (POOL_FLOW[Math.min(i + 1, POOL_FLOW.length - 1)] - POOL_FLOW[i]) * (t - i);
  const target = (f / POOL_FLOW[POOL_FLOW.length - 1]) * AREA[Math.ceil(BRIM_Y)];
  let lo = BRIM_Y;
  let hi = DIP_D;
  const areaAt = (y: number) => {
    const j = Math.floor(y);
    const u = y - j;
    return AREA[Math.min(j, DIP_D)] + (AREA[Math.min(j + 1, DIP_D)] - AREA[Math.min(j, DIP_D)]) * u;
  };
  for (let it = 0; it < 30; it++) {
    const m = (lo + hi) / 2;
    if (areaAt(m) > target) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
const poolPoly = (level: number, inset: number): Pt[] => {
  const L: Pt[] = [];
  const R: Pt[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const y = level + ((DIP_D - level) * i) / n;
    const xl = xLeftWall(y) + inset;
    const xr = xRightWall(y) - inset;
    if (xr - xl < 0.5) break;
    L.push({ x: xl, y });
    R.push({ x: xr, y });
  }
  return [...L, ...R.reverse()];
};

// ---------------------------------------------------------------------------
// THE GROOVE: a channel under E (banks at GT / GB below E_Y), out of the dip's right
// wall to GROOVE_END, written by the advancing red head.
// ---------------------------------------------------------------------------
const GT = 16;
const GB = 50;
const GC = (GT + GB) / 2;
const GROOVE_END = 470;
const G_X0 = xRightWall(GC) - 8; // the red starts inside the pool
const GT_X0 = xRightWall(GT);
const GB_X0 = xRightWall(GB);
const HEAD: HK[] = [
  { S: 682, x: G_X0 + 2, v: 0.6 },
  { S: 723, x: 214, v: 2.0 }, // under the tower's foot by "that"
  { S: 765, x: 285, v: 2.4 },
  { S: 792, x: GROOVE_END, v: 0 }, // "path dependence"
];
const headX = (S: number) => (S < HEAD[0].S ? -Infinity : Math.min(GROOVE_END, herm(HEAD, Math.min(S, 792))));
const sAtHeadX = (x: number) => sWhen(headX, x, HEAD[0].S, 792);
/** distance from the valve along the flow to groove x (spout + fall + pool) */
const ALONG_POOL = PIPE_LEN + 120;
const alongGroove = (x: number) => ALONG_POOL + Math.max(0, x - G_X0);

// ---------------------------------------------------------------------------
// E RIGHT OF THE TOWER: growth G(x) (world px up), written by a lift front fx(S) on
// "growth was strong"; sagging where its props lose their red; recovering on the surge.
// ---------------------------------------------------------------------------
/** the red line leaves E here, on "increasingly" (S 1262), with E's tip E_LEAD ahead of it */
const PEEL_X = 640;
const PEEL_S = 1262;
const E_LEAD = 30;
const G_KN: HK[] = [
  { S: 215, x: 0, v: 0 },
  { S: 440, x: 250, v: 0.3 },
  { S: 620, x: 280, v: 0 },
];
const growthG = (x: number) => (x <= 215 ? 0 : x >= 620 ? 280 : herm(G_KN, x));
const G_MAX = 250;
const LIFT0 = 794;
/** E lifts into the growth curve, all of it together (a hair earlier near the tower): the rise reaches x at
 *  liftStart(x) (LIFT_V world px / frame) and each point rises over LIFT_F frames */
const LIFT_V = 120;
const LIFT_F = 34;
const liftStart = (x: number) => LIFT0 + Math.max(0, x - 215) / LIFT_V;
const liftAt = (x: number, S: number) => smoothstep((S - liftStart(x)) / LIFT_F);
const LIFT1 = liftStart(560) + LIFT_F;
const aTipX = (S: number) => X(eTipYear(S), S);
/** after A's creep: a slower decaying creep (E's tip never stops dead), then the onward write */
const TIP0 = aTipX(LIFT0);
const TIP_V0 = aTipX(LIFT0 + 0.5) - aTipX(LIFT0 - 0.5);
const TIP_TAU = 60;
const tipCreep = (S: number) => TIP0 + TIP_V0 * TIP_TAU * (1 - Math.exp(-(S - LIFT0) / TIP_TAU));
const WRITE2: HK[] = [
  { S: 1217, x: tipCreep(1217), v: TIP_V0 * Math.exp(-(1217 - LIFT0) / TIP_TAU) },
  { S: PEEL_S, x: PEEL_X + E_LEAD, v: 5 },
];
/** E's tip x in Act 2: A's creep, a slower creep, the onward write; from the peel on it keeps
 *  E_LEAD ahead of the red tip's x (E runs on flat while the red line climbs away) */
const eTipX = (S: number) => (S < LIFT0 ? aTipX(S) : S < 1217 ? tipCreep(S) : S < PEEL_S ? herm(WRITE2, S) : redTip(S).x + E_LEAD);
/** support deficit under E at x: the throttle reaching the props under it */
const BLOCK_X = [270, 326, 382, 438];
const deficitAt = (x: number, S: number) => thrAlong(alongGroove(Math.max(BLOCK_X[0], Math.min(BLOCK_X[BLOCK_X.length - 1], x))), S - 6);
/** E sags where its props go dark: the deficit under it, followed with a first-order lag
 *  (SAG_TAU) so the line visibly SINKS through "imperiling" (~17 world = ~26 screen px at
 *  the tip at k 1.54) and climbs back after the surge reaches the props. */
const SAG = 17;
const SAG_TAU = 13;
const lagged = (x: number, S: number, tau: number) => {
  let acc = 0;
  let wsum = 0;
  for (let i = 0; i <= 4 * tau; i++) {
    const w = Math.exp(-i / tau);
    acc += w * deficitAt(x, S - i);
    wsum += w;
  }
  return acc / wsum;
};
/** sinks slowly (SAG_TAU), recovers quicker (the surge lifts it): the smaller of two lags */
const sagLag = (x: number, S: number) => (S <= CLOSE0 ? 0 : Math.min(lagged(x, S, SAG_TAU), lagged(x, S, 6)));
const WOB0 = 950;
const WOB1 = 996;
/** E's extra dy (world, + down) at x */
const eDyAt = (x: number, S: number) => {
  const G = growthG(x);
  if (G <= 0) return 0;
  const lift = liftAt(x, S);
  if (lift <= 0) return 0;
  const rel = Math.min(1, G / G_MAX);
  const sag = S > CLOSE0 && S < 1090 ? SAG * rel * sagLag(x, S) : 0;
  const wob = S > WOB0 && S < WOB1 ? 2.5 * rel * bump((S - WOB0) / (WOB1 - WOB0)) * Math.sin((2 * Math.PI * (S - WOB0)) / 15 + x / 70) : 0;
  return -G * lift + sag + wob;
};
/** E's y at world x in Act 2 */
const eYAt = (x: number, S: number) => eY(yearAtX(x, S), S) + eDyAt(x, S);
/** E's rung: context, subject on "growth", context from the shadow banking, subject on "real economy" */
const eRungAt = (S: number) => {
  if (S < 794) return INK_LO;
  if (S < 1030) return lerp(INK_LO, INK_HI, smoothstep((S - 794) / 12));
  if (S < 1294) return lerp(INK_HI, INK_LO, smoothstep((S - 1030) / 12));
  return lerp(INK_LO, INK_HI, smoothstep((S - 1294) / 12));
};

/** The history row has done its job: it diffuses out like ink during the dive. */
const BOOMS_OUT0 = 449;
const BOOMS_OUT1 = 477;
const boomsDiffuseAt = (S: number) => clamp01((S - BOOMS_OUT0) / (BOOMS_OUT1 - BOOMS_OUT0));
/** "BANK ASSETS" (Act 1's last label) diffuses as it rises out through the dive.
 *  The master draws Act1Standing with this from CAM_JOIN_S on. */
export const bankAssetsDiffuse = (S: number) => clamp01((S - 451) / 17);

/** What Act 2 bends in A's standing world (the master passes it from CAM_JOIN_S on). */
export const worldOverrideAct2 = (S: number): WorldOverride | undefined => {
  if (S <= ACT1_END) return boomsDiffuseAt(S) > 0 ? { boomsDiffuse: boomsDiffuseAt(S) } : undefined;
  return {
    eTipYear: yearAtX(eTipX(S), S),
    eRung: eRungAt(S),
    eDy: (year: number) => eDyAt(X(year, S), S),
    boomsDiffuse: boomsDiffuseAt(S),
    eBead: S > 1217 ? smoothstep((S - 1217) / 6) : 0,
  };
};

// ---------------------------------------------------------------------------
// THE INVESTMENT PILLS: slim ink pills (wash + fine hatch) standing on the groove's top
// bank, sliding up out of the groove and seating against E.
// ---------------------------------------------------------------------------
const BLOCK_W = 28;
const BLOCK_S0 = 829;
const BLOCK_STEP = 6;
const BLOCK_F = 13;
const blockSeat = (i: number, S: number) => easeOutCubic((S - (BLOCK_S0 + i * BLOCK_STEP)) / BLOCK_F);
const pillPoly = (cx: number, top: number, bottom: number, w: number): Pt[] => {
  const r = w / 2;
  const pts: Pt[] = [{ x: cx - r, y: bottom }];
  const ry = Math.min(r, (bottom - top) / 2);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    pts.push({ x: cx + r * Math.cos(a), y: top + ry + ry * Math.sin(a) });
  }
  pts.push({ x: cx + r, y: bottom });
  return pts;
};

// ---------------------------------------------------------------------------
// THE DASHED PROJECTION (the one dashed element): from E's tip, falling to E_Y.
// ---------------------------------------------------------------------------
const DASH0 = 963;
const DASH1 = 987;
const DASH_SHAPE = [
  [0, 0],
  [0.22, 0.04],
  [0.45, 0.16],
  [0.64, 0.37],
  [0.8, 0.64],
  [0.92, 0.86],
  [1, 1],
];
const DASH_DX = 42;

// ---------------------------------------------------------------------------
// THE SHADOW CHANNELS: branch points opened by a pressure pulse along the groove, then
// deep-red roots growing down from them.
// ---------------------------------------------------------------------------
const PULSE0 = 1046;
const PULSE_V = 8;
const BRANCH_X = [250, 322, 394, 458];
const branchOpenS = (x: number) => PULSE0 + (x - G_X0) / PULSE_V;
type Root = { from: number; parent?: number; at?: number; pts: Pt[]; t0: number; t1: number; w0: number };
const ROOTS: Root[] = (() => {
  const shapes: Pt[][] = [
    [{ x: 0, y: 0 }, { x: -4, y: 55 }, { x: -18, y: 115 }, { x: -12, y: 175 }, { x: -26, y: 238 }],
    [{ x: 0, y: 0 }, { x: 6, y: 60 }, { x: 0, y: 125 }, { x: 14, y: 190 }, { x: 8, y: 262 }],
    [{ x: 0, y: 0 }, { x: -6, y: 50 }, { x: 4, y: 105 }, { x: -6, y: 160 }, { x: 2, y: 214 }],
    [{ x: 0, y: 0 }, { x: 8, y: 45 }, { x: 22, y: 95 }, { x: 18, y: 148 }],
  ];
  const forks: { parent: number; at: number; pts: Pt[] }[] = [
    { parent: 0, at: 0.45, pts: [{ x: 0, y: 0 }, { x: 26, y: 40 }, { x: 34, y: 92 }] },
    { parent: 1, at: 0.4, pts: [{ x: 0, y: 0 }, { x: -30, y: 38 }, { x: -44, y: 86 }, { x: -40, y: 130 }] },
    { parent: 2, at: 0.55, pts: [{ x: 0, y: 0 }, { x: 28, y: 34 }, { x: 36, y: 78 }] },
    { parent: 3, at: 0.6, pts: [{ x: 0, y: 0 }, { x: -22, y: 36 }, { x: -26, y: 70 }] },
  ];
  const out: Root[] = [];
  BRANCH_X.forEach((bx, i) => {
    const t0 = 1138 + 7 * i;
    out.push({ from: i, pts: shapes[i].map((p) => ({ x: bx + 0.8 * p.x, y: GB + 1.1 * p.y })), t0, t1: t0 + 58, w0: 22 });
  });
  for (const f of forks) {
    const par = out[f.parent];
    const c = cumLen(par.pts);
    const base = pointAtLen(par.pts, c, c[c.length - 1] * f.at);
    const t0 = par.t0 + (par.t1 - par.t0) * Math.pow(f.at, 0.7) + 2;
    out.push({ from: par.from, parent: f.parent, at: f.at, pts: f.pts.map((p) => ({ x: base.x + 0.8 * p.x, y: base.y + 1.1 * p.y })), t0, t1: t0 + 40, w0: 14 });
  }
  return out;
})();
/** a root's drawn length at S: an ease-out draw, then a slow decaying creep (never stops dead) */
const rootDraw = (r: Root, S: number) => {
  const u = (S - r.t0) / (r.t1 - r.t0);
  if (u <= 0) return 0;
  return Math.min(1, 0.92 * easeOutCubic(u) + 0.08 * clamp01((S - r.t0) / 160));
};
/** the channel polygon for the drawn part of a root (width tapering w0 -> 0.45 w0) */
const channel = (pts: Pt[], len: number, w0: number) => {
  const c = cumLen(pts);
  const total = c[c.length - 1];
  const L = Math.min(total, len);
  const left: Pt[] = [];
  const right: Pt[] = [];
  const n = Math.max(2, Math.ceil(L / 6));
  for (let i = 0; i <= n; i++) {
    const s = (L * i) / n;
    const p = pointAtLen(pts, c, s);
    const q = pointAtLen(pts, c, Math.min(total, s + 2));
    const p0 = pointAtLen(pts, c, Math.max(0, s - 2));
    const dx = q.x - p0.x;
    const dy = q.y - p0.y;
    const d = Math.hypot(dx, dy) || 1;
    const w = (w0 / 2) * (1 - 0.55 * (s / total)) * (i === n && L < total ? 0.85 : 1);
    left.push({ x: p.x - (dy / d) * w, y: p.y + (dx / d) * w });
    right.push({ x: p.x + (dy / d) * w, y: p.y - (dx / d) * w });
  }
  return { left, right, poly: [...left, ...right.slice().reverse()] };
};

// ---------------------------------------------------------------------------
// THE RED LINE (seg 50): the groove's head surfaces through E and runs alongside it,
// then climbs steeply away. World-fixed polyline built on E's final shape.
// ---------------------------------------------------------------------------
const E_FINAL = (x: number) => eY(yearAtX(x, 1300), 1300) - growthG(x);
const RED_OFF = 20;
/** the climb (B2): from the peel the red line rises toward the tower's height, steepening
 *  (y = y0 - RISE_H u^RISE_P over RISE_W); at S 1346 its tip is ~89 % of the way, still climbing */
const RISE_W = 3700;
const RISE_H = 4900;
const RISE_P = 1.7;
const RED_PTS: Pt[] = (() => {
  const pts: Pt[] = [];
  const top = E_FINAL(GROOVE_END + 48) - RED_OFF;
  // the riser: a quarter-curve up out of the groove's head, through E
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2);
    pts.push({ x: GROOVE_END + 48 * (1 - Math.cos(a)), y: GC + (top - GC) * Math.sin(a) });
  }
  for (let x = GROOVE_END + 58; x <= PEEL_X; x += 10) pts.push({ x, y: E_FINAL(x) - RED_OFF });
  const y0 = E_FINAL(PEEL_X) - RED_OFF;
  for (let i = 1; i <= 240; i++) {
    const t = i / 240;
    pts.push({ x: PEEL_X + RISE_W * t, y: y0 - RISE_H * Math.pow(t, RISE_P) });
  }
  return pts;
})();
const RED_CUM = cumLen(RED_PTS);
const RED_TOTAL = RED_CUM[RED_CUM.length - 1];
const RED_RISER = (() => {
  // arc length where the riser ends and the run along E begins
  let i = 0;
  while (RED_PTS[i].x < GROOVE_END + 58) i++;
  return RED_CUM[i];
})();
const RED_PEEL = (() => {
  let i = 0;
  while (RED_PTS[i].x < PEEL_X) i++;
  return RED_CUM[i];
})();
const RED_KN: HK[] = [
  { S: 1219, x: 0, v: 4 },
  { S: 1236, x: RED_RISER, v: 5 },
  { S: PEEL_S, x: RED_PEEL, v: 5 },
];
/** After the peel the camera FOLLOWS the tip: its screen x eases from where the knots leave
 *  it (moving at 5 world px/f) to TIP_HOLD_X by PEEL_S + TIP_HOLD_F and holds there while the
 *  camera pulls back, so the tip keeps climbing in world (and up the screen) to the last
 *  frame. The arc length is solved per frame against the camera (lazy: it needs camAct2). */
const TIP_HOLD_X = 905;
const TIP_HOLD_F = 30;
/** "REAL ECONOMY" stands under E here (in frame from its word to the last frame; at the end
 *  its left end clears E's rise over the pills and it sits under the gap) */
const RE_X = 1540;
/** FINAL fix: the two payoff labels never drop below this screen font size (the 80 % floor
 *  alone shrank them to ~29 px in the pull-back, unreadable on a phone) */
const PAYOFF_PX = 42;
/** "CREDIT" rides the red line: it sits beside the line (on its upper-left side, clear of it
 *  by CREDIT_GAP screen px) at an arc position that starts at its landing spot over the run
 *  (x 585) and moves up the climb at a fixed fraction of the drawn length, so it is always
 *  behind the tip and ends at CREDIT_L_END, in the open paper between the tower and the climb */
const CREDIT_L_END = 2050;
const CREDIT_GAP = 36;
const CREDIT_L0 = (() => {
  let i = 0;
  while (RED_PTS[i].x < 585) i++;
  return RED_CUM[i];
})();
/** caps centre of "CREDIT" (world), placed in screen space against the camera */
const creditAt = (S: number, cam: Cam) => {
  const k = cam.k;
  const drawnEnd = redLen(S_END);
  const rho = (CREDIT_L_END - CREDIT_L0) / (drawnEnd - CREDIT_L0);
  const Lc = CREDIT_L0 + rho * Math.max(0, redLen(S) - CREDIT_L0);
  const p = pointAtLen(RED_PTS, RED_CUM, Lc);
  const a = pointAtLen(RED_PTS, RED_CUM, Math.max(0, Lc - 20));
  const b = pointAtLen(RED_PTS, RED_CUM, Lc + 20);
  const tl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const n = { x: (b.y - a.y) / tl, y: -(b.x - a.x) / tl };
  const fs = Math.max(labelPx("word", k), PAYOFF_PX / k) * k;
  const hw = (labelWidth("CREDIT", "word", k) * (fs / (labelPx("word", k) * k)) * k) / 2;
  const hh = (0.669 * fs) / 2;
  const d = hw * Math.abs(n.x) + hh * Math.abs(n.y) + CREDIT_GAP;
  return { x: p.x + (n.x * d) / k, y: p.y + (n.y * d) / k, hw, hh };
};
let RED_TABLE: number[] | null = null;
const redTable = () => {
  if (RED_TABLE) return RED_TABLE;
  const sxAt = (arc: number, S: number) => {
    const p = pointAtLen(RED_PTS, RED_CUM, arc);
    const c = camAct2(S);
    return 540 + (p.x - c.x) * c.k;
  };
  // the tip's screen x and velocity as the knots hand over (extrapolated at v 5)
  const xs0 = sxAt(RED_PEEL, PEEL_S);
  const vs0 = sxAt(RED_PEEL + 5, PEEL_S + 1) - xs0;
  const xsAt = (S: number) =>
    S >= PEEL_S + TIP_HOLD_F ? TIP_HOLD_X : herm([{ S: PEEL_S, x: xs0, v: vs0 }, { S: PEEL_S + TIP_HOLD_F, x: TIP_HOLD_X, v: 0 }], S);
  const tb: number[] = [RED_PEEL];
  for (let S = PEEL_S + 1; S <= S_END + 40; S++) {
    let lo = tb[tb.length - 1];
    let hi = RED_TOTAL;
    const want = xsAt(S);
    if (sxAt(lo, S) >= want) {
      tb.push(lo + 0.5);
      continue;
    }
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (sxAt(m, S) < want) lo = m;
      else hi = m;
    }
    tb.push((lo + hi) / 2);
  }
  RED_TABLE = tb;
  return RED_TABLE;
};
const redLen = (S: number) => {
  if (S < 1219) return 0;
  if (S <= PEEL_S) return herm(RED_KN, S);
  const tb = redTable();
  const t = Math.min(tb.length - 1.001, S - PEEL_S);
  const i = Math.floor(t);
  return Math.min(RED_TOTAL, tb[i] + (tb[i + 1] - tb[i]) * (t - i));
};
const redTip = (S: number) => pointAtLen(RED_PTS, RED_CUM, redLen(S));
const sAtRedLen = (s: number) => sWhen(redLen, s, 1219, 1420);

// ---------------------------------------------------------------------------
// THE HAND (B2): a refined ink outline at INK_W (no Lucide glyph: the old one read as a
// cartoon glove). A slim hand on a forearm: the sleeve is two parallel ink lines running
// off-frame left, closed by a cuff line; the hand comes out of the cuff. Local frame: u
// points from the wrist INTO the wheel (toward its centre), v is u turned +90 deg; the
// rim passes through the grip point (u 0, v 0) along v. Two poses with the same points,
// morphed (one eased change): OPEN (reaching: a flat hand, fingers out) and GRIP (a fist
// whose curled fingers close round the rim, three finger seams, the thumb over the top).
// The hand is backed with paper so the rim reads as held INSIDE the fist.
// ---------------------------------------------------------------------------
const HAND_OPEN_PTS: Pt[] = [
  { x: -48, y: -11 }, { x: -36, y: -13 }, { x: -20, y: -16 }, { x: -4, y: -18 }, { x: 12, y: -17 },
  { x: 22, y: -10 }, { x: 22, y: -1 }, { x: 13, y: -3 }, { x: 6, y: 5 }, { x: 1, y: 14 },
  { x: -18, y: 15 }, { x: -36, y: 13 }, { x: -48, y: 11 },
];
const HAND_GRIP_PTS: Pt[] = [
  { x: -48, y: -11 }, { x: -36, y: -14 }, { x: -22, y: -18 }, { x: -8, y: -20 }, { x: 3, y: -18 },
  { x: 9, y: -12 }, { x: 11, y: 0 }, { x: 9, y: 12 }, { x: 3, y: 18 }, { x: -8, y: 20 },
  { x: -24, y: 17 }, { x: -37, y: 13 }, { x: -48, y: 11 },
];
const THUMB_OPEN: Pt[] = [{ x: -32, y: -13 }, { x: -20, y: -19 }, { x: -8, y: -21 }, { x: 2, y: -19 }];
const THUMB_GRIP: Pt[] = [{ x: -30, y: -15 }, { x: -18, y: -24 }, { x: -6, y: -26 }, { x: 2, y: -22 }];
/** finger seams on the fist (grip only): short strokes across the curled fingers */
const SEAMS: [Pt, Pt][] = [
  [{ x: -3, y: -9 }, { x: 10, y: -7 }],
  [{ x: -3, y: 0 }, { x: 11, y: 1 }],
  [{ x: -3, y: 9 }, { x: 10, y: 9 }],
];
const SLEEVE_HALF = 15;
const CUFF_U = -48;
const SLEEVE_LEN = 1600;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
/** a smooth path through points (Catmull-Rom -> cubic Bezier) */
const smoothD = (pts: Pt[], closed = false) => {
  const n = pts.length;
  const P = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    d += `C${(p1.x + (p2.x - p0.x) / 6).toFixed(2)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(2)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(2)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return closed ? `${d}Z` : d;
};
const HAND_IN0 = 893;
const HAND_IN1 = 924;
const GRIP0 = 922;
const GRIP1 = 930;
const LET0 = 989;
const LET1 = 997;
const OUT0 = 991;
const OUT1 = 1009;
/** the shoulder: far off-frame left, level with the wheel's centre (the arm reaches in flat) */
const SHOULDER = { x: WHEEL.x - RIM_R - 640, y: WHEEL.y + 18 };
/** how far back along the arm the hand starts / ends (just off frame: its speed stays
 *  under the 45 px/f cap) */
const REACH = 175;
/** the wrist follows a part of the wheel's turn (the forearm takes the rest) */
const WRIST_SHARE = 0.4;
/** the grip point, the hand's axis angle (rad), the arm's angle (rad) and the grip 0..1 at S */
const handAt = (S: number) => {
  const grip = smoothstep((S - GRIP0) / (GRIP1 - GRIP0)) * (1 - smoothstep((S - LET0) / (LET1 - LET0)));
  // the turn the hand rides (clockwise = closing); unwinds as it pulls out
  const th = S < OUT0 ? CLOSE_DEG * smoothstep((S - CLOSE0) / (CLOSE1 - CLOSE0)) : CLOSE_DEG * (1 - smoothstep((S - OUT0) / (OUT1 - OUT0)));
  const ga = Math.PI + th * deg;
  const rim = { x: WHEEL.x + RIM_R * Math.cos(ga), y: WHEEL.y + RIM_R * Math.sin(ga) };
  const arm = Math.atan2(rim.y - SHOULDER.y, rim.x - SHOULDER.x);
  const dir = { x: Math.cos(arm), y: Math.sin(arm) };
  // in: eases in along the arm; out: accelerates back along it
  const back = S < OUT0 ? REACH * (1 - easeOutCubic((S - HAND_IN0) / (HAND_IN1 - HAND_IN0))) : REACH * smoothstep((S - OUT0) / (OUT1 - OUT0));
  const g = { x: rim.x - dir.x * back, y: rim.y - dir.y * back };
  return { g, ang: arm + WRIST_SHARE * th * deg, arm, grip, on: S >= HAND_IN0 && S <= OUT1 + 1 };
};

// ---------------------------------------------------------------------------
// THE CAMERA: continues A's follower from JOIN_CAM_STATE (A's state at CAM_JOIN_S
// 440), through the same damped follower, zoom followed in ln k.
//  * THE DIVE (B2): one long C1 glide that grows out of A's decaying creep in the
//    unpicked tail ("there's a few ASPECTS of that") and lands at the tower's foot
//    before "deliberate". Two superposed parts: the foot's screen position eases
//    from where A left it (632, 1322) up to the content centre (camEase, warp 0.7,
//    early), and the zoom is a bang-bang profile in ln k (k''/k = +a^2, then
//    -(1.4 a)^2: the steepest zoom whose fixed points never accelerate past the
//    |dv| cap). It lands into the pool creep (k 1.2 -> 2.7) instead of stopping.
//  * THE ENDING: a pivot zoom (the world point that stays put on screen is the
//    one that is at the same screen spot in both framings: the machine's lower
//    left), easing ln k from the "credit" framing to the whole tower.
// Every other move is a superposed glide in LOOK space.
// ---------------------------------------------------------------------------
/** the dive's landing: this world point lands at the content centre at k DIVE.K1 */
const DIVE_P = { x: 95, y: -12 };
const DIVE = { D0: CAM_JOIN_S, TN: 52, TW: 0.7, KS: 1, KN: 56, ASYM: 1.4, K1: 1.2 };
/** ln k profile 0..1 over [0, T] for a total change L: k''/k = +a^2, then -(asym a)^2. */
const bangBangZoom = (L: number, T: number, asym: number) => {
  const yOf = (x: number) => Math.atan(Math.tanh(x) / asym);
  let lo = 0;
  let hi = 20;
  for (let i = 0; i < 60; i++) {
    const x = (lo + hi) / 2;
    const l = Math.log(Math.cosh(x)) - Math.log(Math.cos(yOf(x))) / (asym * asym);
    if (l < L) lo = x;
    else hi = x;
  }
  const a = (lo + yOf(lo) / asym) / T;
  const t1 = lo / a;
  return (t: number) => {
    const tt = Math.max(0, Math.min(T, t));
    if (tt <= t1) return Math.log(Math.cosh(a * tt)) / L;
    return (L + Math.log(Math.cos(a * asym * (T - tt))) / (asym * asym)) / L;
  };
};
/** A's look target (its glide list continues under the dive as a residual that fades out) */
const aTarget = (f: number) => glideTargetAt(CAM_START, GLIDES_ACT1, f);
const DIVE_BASE = aTarget(DIVE.D0);
const DIVE_O0 = { x: (DIVE_P.x - DIVE_BASE.x) * DIVE_BASE.k, y: (DIVE_P.y - DIVE_BASE.y) * DIVE_BASE.k };
const DIVE_L = Math.log(DIVE.K1 / DIVE_BASE.k);
const DIVE_Z = bangBangZoom(DIVE_L, DIVE.KN, DIVE.ASYM);
/** the dive's look (absolute) at f; equals A's target up to D0 */
const diveLook = (f: number): Cam => {
  if (f <= DIVE.D0) return aTarget(f);
  const t = camEase((f - DIVE.D0) / DIVE.TN, DIVE.TW);
  const k = DIVE_BASE.k * Math.exp(DIVE_L * DIVE_Z(f - DIVE.D0 - DIVE.KS));
  const res = aTarget(f);
  return {
    x: DIVE_P.x - (DIVE_O0.x * (1 - t)) / k + (res.x - DIVE_BASE.x) * (1 - t),
    y: DIVE_P.y - (DIVE_O0.y * (1 - t)) / k + (res.y - DIVE_BASE.y) * (1 - t),
    k,
  };
};
type Way = { f0: number; f1: number; x: number; y: number; k: number; warp?: number; even?: number };
const WAYS: Way[] = [
  // "to provide this sort of credit expansion ... crisis": the dive lands INTO a long even creep in on the pool (held breath)
  { f0: 496, f1: 668, x: 68, y: 10, k: 2.7, even: 0.3 },
  // "but the extension of it after that": eases out and right as the pool pushes under E
  { f0: 668, f1: 744, x: 140, y: 10, k: 2.25 },
  // "path dependence": follows the head right, landing before "dependence" ends
  { f0: 734, f1: 790, x: 265, y: 8, k: 1.68 },
  // "growth was strong ... investment": follows E up as it is written upward
  { f0: 790, f1: 838, x: 268, y: -100, k: 1.66 },
  // "and then it became too difficult": eases back to hold the hand's grip, the valve, the growth
  // line and the whole dashed fall in one frame centred on x 540 (>= 100 px margins)
  { f0: 862, f1: 902, x: 296, y: -32, k: 1.5 },
  // "... for authorities to shut down without imperiling the overall economy": a slow creep (held breath)
  { f0: 900, f1: 1020, x: 296, y: -30, k: 1.54, even: 0.3 },
  // "and so as a result you had a variety of different developments": tilts down to the groove,
  // the valve still whole on the left and E's tip whole on the right
  { f0: 1024, f1: 1068, x: 265, y: 30, k: 1.66 },
  // "facilitated the growth of the shadow banking system": creeps, then follows the roots down
  { f0: 1064, f1: 1112, x: 265, y: 42, k: 1.69, even: 0.4 },
  { f0: 1120, f1: 1206, x: 265, y: 135, k: 1.58 },
  // "and growth in credit": over to the groove's end, the red surfacing (valve -> peel in frame)
  { f0: 1200, f1: 1244, x: 318, y: -10, k: 1.3 },
];
const GLIDES: Glide[] = (() => {
  let prev: { x: number; y: number } = DIVE_P;
  return WAYS.map((w) => {
    const g: Glide = { f0: w.f0, f1: w.f1, dx: w.x - prev.x, dy: w.y - prev.y, k: w.k, warp: w.warp, even: w.even };
    prev = w;
    return g;
  });
})();
/** the dive + the glides (look space) */
const baseTarget = (f: number): Cam => {
  const g = glideTargetAt({ x: 0, y: 0, k: DIVE.K1 }, GLIDES, f);
  const d = diveLook(f);
  return { x: d.x + g.x, y: d.y + g.y, k: d.k * (g.k / DIVE.K1) };
};
/** THE ENDING: "was increasingly disconnected from the real economy itself": the pull-back
 *  to the whole tower (left, the source), the machine at its foot, the red line climbing
 *  away right toward the tower's height. A pivot zoom from the "credit" framing. */
const END = { P0: 1246, P1: 1336, x: 2015, y: -2366, k: 0.205 };
const END_FROM = baseTarget(END.P0);
const END_Q = {
  x: (END.x * END.k - END_FROM.x * END_FROM.k) / (END.k - END_FROM.k),
  y: (END.y * END.k - END_FROM.y * END_FROM.k) / (END.k - END_FROM.k),
};
const END_Z = bangBangZoom(Math.log(END_FROM.k / END.k), END.P1 - END.P0, 1);
const targetAt = (f: number): Cam => {
  if (f <= END.P0) return baseTarget(f);
  const e = END_Z(f - END.P0);
  const k = Math.exp(Math.log(END_FROM.k) + (Math.log(END.k) - Math.log(END_FROM.k)) * e);
  return { x: END_Q.x - ((END_Q.x - END_FROM.x) * END_FROM.k) / k, y: END_Q.y - ((END_Q.y - END_FROM.y) * END_FROM.k) / k, k };
};
/** The same damped follower as runFollower (CAM_STIFF / CAM_DAMP), but zoom is
 *  followed in ln k (a 6x dive followed in linear k lags and then snaps). Starts
 *  exactly from JOIN_CAM_STATE (its k velocity converted to ln k), so the
 *  hand-over at CAM_JOIN_S is C1. */
const RUN = (() => {
  const cams: Cam[] = [];
  const from = JOIN_CAM_STATE;
  let c = { x: from.pos.x, y: from.pos.y, lk: Math.log(from.pos.k) };
  let v = { x: from.vel.x, y: from.vel.y, lk: from.vel.k / from.pos.k };
  for (let f = CAM_JOIN_S; f <= S_END + 2; f++) {
    if (f > CAM_JOIN_S) {
      const tl = targetAt(f);
      const t = camFromLook(tl.x, tl.y, tl.k);
      const tlk = Math.log(t.k);
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        lk: v.lk + (tlk - c.lk) * CAM_STIFF - v.lk * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, lk: c.lk + v.lk };
    }
    cams.push({ x: c.x, y: c.y, k: Math.exp(c.lk) });
  }
  return { cams };
})();
/** Act 2's camera (camera centre + zoom) for S >= CAM_JOIN_S. */
export const camAct2 = (S: number): Cam => camFromTrack(RUN.cams, CAM_JOIN_S)(S);

// ---------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------
/** a flow path drawn as short segments, each coloured by `col(sMid)` */
const FlowPath: React.FC<{ pts: Pt[]; s0: number; s1: number; width: number; col: (s: number) => string; step?: number; capEnd?: boolean }> = ({
  pts,
  s0,
  s1,
  width,
  col,
  step = 7,
  capEnd = true,
}) => {
  if (s1 - s0 <= 0.05 || width <= 0.01) return null;
  const c = cumLen(pts);
  const segs: React.ReactNode[] = [];
  const n = Math.max(1, Math.ceil((s1 - s0) / step));
  for (let i = 0; i < n; i++) {
    const a = s0 + ((s1 - s0) * i) / n;
    const b = s0 + ((s1 - s0) * (i + 1)) / n;
    segs.push(
      <path
        key={i}
        d={subPathD(pts, c, a, Math.min(s1, b + 0.6))}
        stroke={col((a + b) / 2)}
        strokeLinecap={(i === 0 || (i === n - 1 && capEnd)) ? "round" : "butt"}
      />,
    );
  }
  return (
    <g fill="none" strokeWidth={width.toFixed(3)} strokeLinejoin="round">
      {segs}
    </g>
  );
};

/** an ink polyline with a wet stretch behind a moving draw head */
const WetInk: React.FC<{ id: string; pts: Pt[]; len: number; k: number; rung: number; ageAt?: (s: number) => number; bead?: number }> = ({
  id,
  pts,
  len,
  k,
  rung,
  ageAt,
  bead = 0,
}) => <WetLine id={id} points={pts} len={len} k={k} ink rung={rung} ageAt={ageAt} bead={bead} />;

export const Act2Layer: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const k = cam.k;
  const s = sz(k);
  const inkW = INK_W * s;
  const dataW = DATA_W * s;
  const out: React.ReactNode[] = [];
  const ph = phaseAt(S);
  const opening = S >= OPEN0 ? openAt(S) : 0;
  const valveRung = lerp(INK_HI, INK_LO, smoothstep((S - 1036) / 12));
  const grooveRung = lerp(INK_HI, INK_LO, smoothstep((S - 800) / 12));
  const throttleCol = (along: number) => {
    const t = thrAlong(along, S);
    const w = surgeAlong(along, S);
    return mixH(mixH(RED, RED_DEEP, 0.85 * t), RED_WET, 0.85 * w);
  };
  const flowCol = (along: number, s0: number, phase: number) => {
    const base = throttleCol(along);
    const h = hlAt(s0, phase) * 0.42 * (1 - 0.6 * thrAlong(along, S));
    // the pressure pulse that opens the branch points ("a variety of different developments")
    const px = G_X0 + PULSE_V * (S - PULSE0);
    const gx = along - ALONG_POOL + G_X0;
    const pu = along >= ALONG_POOL && S > PULSE0 && px < GROOVE_END + 60 ? Math.exp(-Math.pow((gx - px) / 26, 2)) * 0.8 : 0;
    const hh = Math.max(h, pu);
    return hh < 0.01 ? base : mixH(base, RED_HI, hh);
  };

  // ---- 15. the shadow channels (under the groove) ----------------------------------------
  {
    const chans: React.ReactNode[] = [];
    ROOTS.forEach((r, i) => {
      const d = rootDraw(r, S);
      if (d <= 0) return;
      const c = cumLen(r.pts);
      const len = c[c.length - 1] * d;
      if (len < 1) return;
      const ch = channel(r.pts, len, r.w0);
      chans.push(
        <g key={`root${i}`}>
          <HatchFill id={`ca2-root-${i}`} region={ch.poly} k={k} color={RED_DEEP} fill={0.16} lineOpacity={0.3} pitch={7} angleDeg={90} anchor={{ x: 0, y: 0 }} />
          <path d={polyD(ch.left)} fill="none" stroke={INK} strokeOpacity={INK_LO} strokeWidth={inkW.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={polyD(ch.right)} fill="none" stroke={INK} strokeOpacity={INK_LO} strokeWidth={inkW.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
        </g>,
      );
    });
    // branch bulbs (deep red, at each opened branch point)
    BRANCH_X.forEach((bx, i) => {
      const o = smoothstep((S - branchOpenS(bx)) / 10);
      if (o <= 0) return;
      const rr = (6 + 4 * smoothstep((S - branchOpenS(bx) - 6) / 34)) * o;
      chans.push(<circle key={`bulb${i}`} cx={bx} cy={(GB + rr * 0.7).toFixed(2)} r={rr.toFixed(2)} fill={RED_DEEP} opacity={0.6} />);
    });
    if (chans.length) out.push(<g key="shadow">{chans}</g>);
  }

  // ---- 5/6. the groove banks (ink, written by the head) ------------------------------------
  const hx = headX(S);
  if (hx > G_X0) {
    const bankAge = (x: number) => S - sAtHeadX(x);
    const gaps = BRANCH_X.map((bx) => ({ x: bx, w: 10 * smoothstep((S - branchOpenS(bx)) / 10) })).filter((g) => g.w > 0.3);
    const bank = (y: number, x0: number, key: string, withGaps: boolean) => {
      const x1 = Math.max(x0, hx);
      if (x1 - x0 < 0.5) return null;
      const pieces: [number, number][] = [];
      let cur = x0;
      if (withGaps) {
        for (const g of gaps) {
          if (g.x - g.w > cur && g.x - g.w < x1) {
            pieces.push([cur, g.x - g.w]);
            cur = g.x + g.w;
          }
        }
      }
      if (x1 > cur) pieces.push([cur, x1]);
      return pieces.map(([a, b], j) => (
        <WetInk
          key={`${key}${j}`}
          id={`ca2-${key}${j}`}
          pts={[{ x: a, y }, { x: b, y }]}
          len={b - a}
          k={k}
          rung={grooveRung}
          ageAt={(sArc) => bankAge(a + sArc)}
        />
      ));
    };
    out.push(<g key="banks">{bank(GT, GT_X0, "gt", false)}{bank(GB, GB_X0, "gb", true)}</g>);
    // the branch lips: two short ink strokes turning down at each opened gap
    const lips: React.ReactNode[] = [];
    gaps.forEach((g, i) => {
      const o = g.w / 10;
      lips.push(
        <path
          key={i}
          d={`M${(g.x - g.w).toFixed(2)} ${GB}Q${(g.x - g.w + 1).toFixed(2)} ${(GB + 6 * o).toFixed(2)} ${(g.x - g.w * 0.8).toFixed(2)} ${(GB + 10 * o).toFixed(2)}M${(g.x + g.w).toFixed(2)} ${GB}Q${(g.x + g.w - 1).toFixed(2)} ${(GB + 6 * o).toFixed(2)} ${(g.x + g.w * 0.8).toFixed(2)} ${(GB + 10 * o).toFixed(2)}`}
          fill="none"
          stroke={INK}
          strokeOpacity={grooveRung}
          strokeWidth={inkW.toFixed(3)}
          strokeLinecap="round"
        />,
      );
    });
    if (lips.length) out.push(<g key="lips">{lips}</g>);
  }

  // ---- 8. the investment pills ---------------------------------------------------------------
  {
    const blocks: React.ReactNode[] = [];
    const bRung = lerp(INK_HI, INK_LO, smoothstep((S - 878) / 12));
    BLOCK_X.forEach((bx, i) => {
      const seat = blockSeat(i, S);
      if (seat <= 0) return;
      const eTop = eYAt(bx, S) + inkW / 2 + 1.5;
      const bottom = GT - inkW / 2 - 0.5;
      const H = bottom - eTop;
      if (H < 4) return;
      const lift = (1 - seat) * H; // slides up out of the groove
      const top = eTop + lift;
      const poly = pillPoly(bx, top, bottom + lift, BLOCK_W);
      // clip at the bank: nothing of the pill shows below the groove's top bank
      const clipId = `ca2-blkclip-${i}`;
      const along = alongGroove(bx);
      const red = 0.42 * smoothstep((S - (BLOCK_S0 + i * BLOCK_STEP + 9)) / 14) * (1 - thrAlong(along, S - 3));
      const wet = surgeAlong(along, S - 2);
      const redTop = bottom - H * red;
      blocks.push(
        <g key={`blk${i}`}>
          <defs>
            <clipPath id={clipId}>
              <rect x={bx - BLOCK_W} y={top - 40} width={BLOCK_W * 2} height={bottom - top + 40} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <HatchFill id={`ca2-blk-${i}`} region={poly} k={k} color={INK} fill={WASH_FILL} lineOpacity={WASH_HATCH} anchor={{ x: 0, y: 0 }} />
            {red > 0.005 ? (
              <g>
                <defs>
                  <clipPath id={`ca2-blkred-${i}`}>
                    <path d={polyD(poly, true)} />
                  </clipPath>
                </defs>
                <rect
                  x={bx - BLOCK_W}
                  y={redTop.toFixed(2)}
                  width={BLOCK_W * 2}
                  height={(bottom - redTop + 2).toFixed(2)}
                  clipPath={`url(#ca2-blkred-${i})`}
                  fill={mixH(RED, RED_WET, wet)}
                  opacity={0.85}
                />
              </g>
            ) : null}
            <path d={polyD(poly, true)} fill="none" stroke={INK} strokeOpacity={bRung} strokeWidth={inkW.toFixed(3)} strokeLinejoin="round" />
          </g>
        </g>,
      );
    });
    if (blocks.length) out.push(<g key="blocks">{blocks}</g>);
  }

  // ---- RED: pool, groove flow, stream, spout (one paper-shadowed group) ----------------------
  {
    const red: React.ReactNode[] = [];
    // the pool
    const level = poolLevel(S);
    if (level < DIP_D - 0.5) {
      const poly = poolPoly(level, inkW / 2);
      const full = smoothstep((S - BRIM_S) / 18);
      red.push(<path key="pool" d={polyD(poly, true)} fill={mixH(RED, RED_WET, 0.25 * (1 - full))} />);
      // the wet surface line
      const xl = xLeftWall(level) + inkW / 2;
      const xr = xRightWall(level) - inkW / 2;
      if (xr - xl > 1) {
        red.push(
          <line
            key="surface"
            x1={xl.toFixed(2)}
            y1={level.toFixed(2)}
            x2={xr.toFixed(2)}
            y2={level.toFixed(2)}
            stroke={mixH(RED_WET, RED, full)}
            strokeWidth={(dataW * 0.42 * (1 + 0.15 * (1 - full))).toFixed(3)}
            strokeLinecap="round"
          />,
        );
      }
    }
    // the groove's flow (pool -> head), with the travelling highlight
    if (hx > G_X0 + 0.5) {
      const gpts: Pt[] = [
        { x: G_X0, y: GC },
        { x: GROOVE_END, y: GC },
      ];
      const gWidth = dataW * (1 - 0.18 * thrAlong(alongGroove(hx), S));
      red.push(
        <FlowPath
          key="gflow"
          pts={gpts}
          s0={0}
          s1={hx - G_X0}
          width={gWidth}
          col={(sm) => flowCol(alongGroove(G_X0 + sm), sm, ph)}
          step={9}
        />,
      );
    }
    // the stream: mouth -> pool surface
    if (S >= FALL0 && opening > 0) {
      const fallU = clamp01((S - FALL0) / (FALL1 - FALL0));
      const yEnd = S < FALL1 ? MOUTH.y + (Math.max(level, MOUTH.y) - MOUTH.y) * fallU * fallU : level;
      const spts: Pt[] = [
        { x: MOUTH.x, y: MOUTH.y - 2 },
        { x: MOUTH.x, y: yEnd + 1 },
      ];
      const sw = dataW * 0.82 * (0.32 + 0.68 * openAt(S - 2));
      if (yEnd > MOUTH.y + 0.5) {
        red.push(
          <FlowPath key="stream" pts={spts} s0={0} s1={yEnd + 1 - MOUTH.y + 2} width={sw} col={(sm) => flowCol(PIPE_LEN + sm, sm, ph * 2.2)} step={8} capEnd={S < FALL1} />,
        );
        if (S < FALL1 + 3) red.push(<Bead key="sbead" id="ca2-sbead" x={MOUTH.x} y={yEnd} r={DOT_R * 0.55 * s} color={RED} opacity={1 - smoothstep((S - FALL1) / 3)} />);
      }
    }
    // the spout's red (wall -> mouth)
    if (S >= PIPE_RED0) {
      const u = clamp01((S - PIPE_RED0) / (PIPE_RED1 - PIPE_RED0));
      const len = PIPE_LEN * u * u;
      const pw = dataW * 0.82 * (0.32 + 0.68 * opening);
      red.push(<FlowPath key="pipe" pts={PIPE_C} s0={0} s1={Math.max(0.1, len)} width={pw} col={(sm) => flowCol(sm, sm, ph)} step={8} />);
      if (u < 1) {
        const c = cumLen(PIPE_C);
        const p = pointAtLen(PIPE_C, c, len);
        red.push(<Bead key="pbead" id="ca2-pbead" x={p.x} y={p.y} r={DOT_R * 0.55 * s} color={RED} />);
      }
    }
    // the groove head's bead while it carves
    if (hx > G_X0 && S <= 796) {
      const v = headX(S + 0.5) - headX(S - 0.5);
      const b = smoothstep((v - 0.3) / 2);
      if (b > 0.01) red.push(<Bead key="gbead" id="ca2-gbead" x={hx} y={GC} r={DOT_R * s} color={RED} opacity={b} />);
    }
    if (red.length) out.push(<g key="red" style={{ filter: paperShadow(k) }}>{red}</g>);
  }

  // ---- 2. the valve: spout walls, stem, wheel ------------------------------------------------
  {
    const wu = clamp01((S - 494) / 10);
    const su = clamp01((S - 502) / 5);
    const ru = clamp01((S - 504) / 8);
    if (wu > 0) {
      const v: React.ReactNode[] = [];
      v.push(
        <WetInk key="wo" id="ca2-wo" pts={WALL_OUT} len={WALL_OUT_LEN * easeOutCubic(wu)} k={k} rung={valveRung} ageAt={(sA) => S - wallS(sA / WALL_OUT_LEN)} />,
        <WetInk key="wi" id="ca2-wi" pts={WALL_IN} len={WALL_IN_LEN * easeOutCubic(wu)} k={k} rung={valveRung} ageAt={(sA) => S - wallS(sA / WALL_IN_LEN)} />,
      );
      if (su > 0) v.push(<WetInk key="st" id="ca2-st" pts={STEM} len={(STEM[0].y - STEM[1].y) * easeOutCubic(su)} k={k} rung={valveRung} />);
      if (ru > 0) {
        const a = wheelDeg(S);
        const R = RIM_R;
        const rimDraw = easeOutCubic(ru);
        const sp = smoothstep((ru - 0.25) / 0.75);
        const spokes: string[] = [];
        for (let i = 0; i < 4; i++) {
          const an = (a + i * 90 - 90) * deg;
          const r0 = HUB_R;
          const r1 = r0 + (RIM_R - r0) * sp;
          spokes.push(
            `M${(WHEEL.x + r0 * Math.cos(an)).toFixed(2)} ${(WHEEL.y + r0 * Math.sin(an)).toFixed(2)}L${(WHEEL.x + r1 * Math.cos(an)).toFixed(2)} ${(WHEEL.y + r1 * Math.sin(an)).toFixed(2)}`,
          );
        }
        v.push(
          <g key="wheel" fill="none" stroke={INK} strokeOpacity={valveRung} strokeWidth={inkW.toFixed(3)} strokeLinecap="round" strokeLinejoin="round">
            <circle
              cx={WHEEL.x}
              cy={WHEEL.y}
              r={R}
              pathLength={1}
              strokeDasharray={rimDraw >= 0.999 ? undefined : `${rimDraw.toFixed(4)} 1`}
              transform={`rotate(${(a + 90).toFixed(2)} ${WHEEL.x} ${WHEEL.y})`}
            />
            <circle cx={WHEEL.x} cy={WHEEL.y} r={(HUB_R * smoothstep(ru / 0.5)).toFixed(3)} />
            {sp > 0.01 ? <path d={spokes.join("")} /> : null}
          </g>,
        );
      }
      out.push(<g key="valve">{v}</g>);
    }
  }

  // ---- 4. E writes back across the brim -------------------------------------------------------
  {
    const c0 = 664;
    const c1 = 682;
    if (S >= c0) {
      const u = (S - c0) / (c1 - c0);
      const L = 105 * easeOutCubic(clamp01(u));
      const rung = S < 690 ? INK_HI : lerp(INK_HI, eRungAt(S), smoothstep((S - 690) / 12));
      out.push(
        <WetInk
          key="brim"
          id="ca2-brim"
          pts={[{ x: 0, y: E_Y }, { x: 105, y: E_Y }]}
          len={L}
          k={k}
          rung={S < 1030 ? rung : eRungAt(S)}
          ageAt={(sArc) => S - (c0 + (c1 - c0) * (1 - Math.cbrt(1 - sArc / 105)))}
          bead={u < 1 ? 1 : 0}
        />,
      );
    }
  }

  // ---- 7. E's wet stretch while it is written upward / onward -----------------------------------
  {
    const lifting = S > LIFT0 && S < LIFT1 + 20;
    if (lifting || S > 1217) {
      const tipX = eTipX(S);
      const x0 = lifting ? 215 : Math.max(215, tipX - 80);
      if (tipX - x0 > 2) {
        const pts: Pt[] = [];
        for (let x = x0; x <= tipX; x += 5) pts.push({ x, y: eYAt(x, S) });
        pts.push({ x: tipX, y: eYAt(tipX, S) });
        const segs: React.ReactNode[] = [];
        const c = cumLen(pts);
        const tot = c[c.length - 1];
        for (let i = 0; i < pts.length - 1; i++) {
          const xm = (pts[i].x + pts[i + 1].x) / 2;
          // wet while it rises, drying over 18 f after; on the onward write, wet behind the tip
          const wet = lifting
            ? xm > TIP0 + 2
              ? 0
              : liftAt(xm, S) * (1 - smoothstep((S - liftStart(xm) - LIFT_F) / 18))
            : (1 - smoothstep((S - sWhen(eTipX, xm, 1217, 1400)) / 18)) * (1 - smoothstep((tot - (c[i] + c[i + 1]) / 2) / 70));
          if (wet < 0.03) continue;
          segs.push(
            <path
              key={i}
              d={`M${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}L${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`}
              stroke={INK}
              strokeOpacity={(0.55 * wet).toFixed(4)}
              strokeWidth={(inkW * 1.15).toFixed(3)}
              strokeLinecap="round"
            />,
          );
        }
        if (segs.length) out.push(<g key="ewet" fill="none">{segs}</g>);
      }
    }
  }

  // ---- 12/13. the dashed projection ----------------------------------------------------------------
  if (S >= DASH0) {
    const tx = eTipX(DASH0);
    const ty = eYAt(tx, S);
    const fall = E_Y - ty;
    const pts = DASH_SHAPE.map(([u, v]) => ({ x: tx + 4 + DASH_DX * u, y: ty + fall * v }));
    const draw = easeOutCubic((S - DASH0) / (DASH1 - DASH0));
    const D0 = 1005;
    const total = cumLen(pts)[pts.length - 1];
    out.push(
      <DashedPath
        key="dashed"
        points={pts}
        k={k}
        S={S}
        draw={draw}
        rung={INK_HI}
        dashMod={(_, sMid) => {
          const u = (S - D0 - (sMid / total) * 8) / 16;
          if (u <= 0) return null;
          const d = inkDiffuse(u);
          return { opacity: d.opacity, blur: d.blur, spread: d.spread };
        }}
      />,
    );
  }

  // ---- 16/17. the red line surfaces, runs alongside E, peels away; the gap fills ------------------
  {
    const L = redLen(S);
    if (L > 0.5) {
      const tip = pointAtLen(RED_PTS, RED_CUM, L);
      // the gap: between the red line and E, from the peel to the tip
      if (L > RED_PEEL + 4) {
        const top: Pt[] = [];
        const stepT = Math.max(8, (L - RED_PEEL) / 400);
        for (let sA = RED_PEEL; sA < L; sA += stepT) {
          const p = pointAtLen(RED_PTS, RED_CUM, sA);
          top.push({ x: p.x, y: p.y + dataW / 2 + 1 });
        }
        top.push({ x: tip.x, y: tip.y + dataW / 2 + 1 });
        const bottom: Pt[] = [];
        const stepB = Math.max(8, (tip.x - PEEL_X) / 300);
        for (let x = tip.x; x > PEEL_X; x -= stepB) bottom.push({ x, y: eYAt(x, S) - inkW / 2 - 1 });
        bottom.push({ x: PEEL_X, y: eYAt(PEEL_X, S) - inkW / 2 - 1 });
        const region = [...top, ...bottom];
        out.push(
          <FeatherWipe
            key="gap"
            id="ca2-gapwipe"
            box={{ x0: PEEL_X, y0: tip.y - 20, x1: tip.x, y1: E_Y + 20 }}
            u={(tip.x - PEEL_X) / (tip.x - PEEL_X + 70)}
            feather={70}
            dir="right"
          >
            <HatchFill id="ca2-gap" region={region} k={k} color={INK} fill={WASH_FILL} lineOpacity={WASH_HATCH} anchor={{ x: PEEL_X, y: 0 }} />
          </FeatherWipe>,
        );
      }
      const speed = redLen(S + 0.5) - redLen(S - 0.5);
      out.push(
        <WetLine
          key="redline"
          id="ca2-redline"
          points={RED_PTS}
          len={L}
          k={k}
          ageAt={(sA) => S - sAtRedLen(sA)}
          bead={smoothstep((speed - 0.4) / 2)}
        />,
      );
    }
  }

  // ---- labels -----------------------------------------------------------------------------------
  {
    const capW = labelCapH("word", k);
    // INVESTMENT under the groove, centred on the pills
    out.push(
      <Label
        key="inv"
        text="INVESTMENT"
        x={BLOCK_X[2]}
        y={GB + 26 * s + capW / 2}
        k={k}
        size="word"
        rung={lerp(INK_HI, INK_LO, smoothstep((S - 878) / 12))}
        appear={enterU(S, W.investment)}
        diffuse={clamp01((S - 1122) / 16)}
      />,
    );
    // SHADOW BANKING under the roots
    out.push(
      <Label
        key="sb"
        text="SHADOW BANKING"
        x={354}
        y={GB + 318 + capW / 2}
        k={k}
        size="word"
        rung={lerp(INK_HI, INK_LO, smoothstep((S - 1222) / 12))}
        appear={enterU(S, W.banking)}
        diffuse={clamp01((S - 1232) / 16)}
      />,
    );
    // CREDIT beside the red line, riding up the climb behind the tip (creditAt), >= PAYOFF_PX on screen
    const capP = 0.669 * Math.max(labelPx("word", k), PAYOFF_PX / k);
    const cr = creditAt(S, cam);
    out.push(
      <Label
        key="cr"
        text="CREDIT"
        x={cr.x}
        y={cr.y}
        k={k}
        size="word"
        color={RED}
        rung={1}
        appear={enterU(S, W.credit)}
        minPx={PAYOFF_PX}
      />,
    );
    // REAL ECONOMY under E (world-fixed, centred under the flat run of E at the end)
    out.push(
      <Label
        key="re"
        text="REAL ECONOMY"
        x={RE_X}
        y={eYAt(RE_X, S) + 30 * s + capP / 2}
        k={k}
        size="word"
        rung={INK_HI}
        appear={enterU(S, W.realEconomy + 5)}
        minPx={PAYOFF_PX}
      />,
    );
  }

  // ---- 10-13. the hand: forearm off-frame left, cuff, slim hand gripping the rim ----------------
  {
    const h = handAt(S);
    if (h.on) {
      const t = smoothstep(h.grip);
      const outline = HAND_OPEN_PTS.map((p, i) => lerpPt(p, HAND_GRIP_PTS[i], t));
      const thumb = THUMB_OPEN.map((p, i) => lerpPt(p, THUMB_GRIP[i], t));
      const ca = Math.cos(h.ang);
      const sa = Math.sin(h.ang);
      const handMap = (p: Pt): Pt => ({ x: h.g.x + p.x * ca - p.y * sa, y: h.g.y + p.x * sa + p.y * ca });
      // the sleeve follows the arm's own direction from the cuff; the wrist takes the bend as a
      // smooth blend from the arm's frame (at the cuff) to the hand's frame (from the knuckles on)
      const cuffC = handMap({ x: CUFF_U, y: 0 });
      const cb = Math.cos(h.arm);
      const sb = Math.sin(h.arm);
      const armMap = (p: Pt): Pt => ({ x: cuffC.x + (p.x - CUFF_U) * cb - p.y * sb, y: cuffC.y + (p.x - CUFF_U) * sb + p.y * cb });
      const toW = (p: Pt): Pt => {
        const w = smoothstep((p.x - CUFF_U) / (2 - CUFF_U));
        return lerpPt(armMap(p), handMap(p), w);
      };
      const aa = { x: Math.cos(h.arm), y: Math.sin(h.arm) };
      const an = { x: -aa.y, y: aa.x };
      const sl = (side: number, along: number): Pt => ({ x: cuffC.x + an.x * side * SLEEVE_HALF - aa.x * along, y: cuffC.y + an.y * side * SLEEVE_HALF - aa.y * along });
      const handW = outline.map(toW);
      const sleeve: Pt[] = [sl(-1, 0), sl(-1, SLEEVE_LEN), sl(1, SLEEVE_LEN), sl(1, 0)];
      const stroke = { fill: "none", stroke: INK, strokeOpacity: INK_HI, strokeWidth: inkW, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
      out.push(
        <g key="hand">
          {/* paper backing: the rim and spokes pass BEHIND the hand */}
          <path d={`${smoothD(handW)}L${sl(1, -2).x.toFixed(2)} ${sl(1, -2).y.toFixed(2)}L${sl(-1, -2).x.toFixed(2)} ${sl(-1, -2).y.toFixed(2)}Z`} fill={PAPER} />
          <path d={polyD(sleeve, true)} fill={PAPER} />
          <path d={smoothD(handW)} {...stroke} />
          <path d={polyD([sl(-1, SLEEVE_LEN), sl(-1, 0), sl(1, 0), sl(1, SLEEVE_LEN)])} {...stroke} />
          <path d={smoothD(thumb.map(toW))} {...stroke} />
          {t > 0.02 ? (
            <g opacity={t.toFixed(4)}>
              {SEAMS.map(([p, q], i) => (
                <path key={i} d={polyD([toW(lerpPt(p, q, 0.5 - 0.5 * t)), toW(q)])} {...stroke} />
              ))}
            </g>
          ) : null}
        </g>,
      );
    }
  }

  return <>{out}</>;
};

/** exported for the review probes */
export const ACT2_DEBUG = { creditAt, RED_PTS, RED_CUM, targetAt, headX, poolLevel, openAt, eTipX, eYAt, redLen, redTip, handAt, BLOCK_X, GROOVE_END, ALONG_POOL, WHEEL, RIM_R };
