import React from "react";
import { FRAME_H, FRAME_W, clamp01, iconShadow, smoothstep } from "./fieldShared";
import { INK, INK_HI, INK_LO } from "./alignShared";
import { BRACKET_F, roundRect } from "./punishShared";
import {
  COL_X0,
  COL_X1,
  DRAIN_BRACKET,
  DRAIN_END_Y,
  DRAIN_L,
  LABEL_SIZE,
  PLAN_BOXES,
  PLAN_LINE_IDX,
  SCOPE,
  STATIONS,
  STROKE,
  SWARM_N,
  buildCamTable,
  drainLocal,
  lineCY,
  lineTop,
  screenOf,
  seg01,
  swarmDot,
  type Cam,
  type Drain,
} from "./incidentSharedV2";
import { HUMANS_INK } from "./incidentHumansV2";

// ---------------------------------------------------------------------------
// incidentMonitorV2 — THE MONITOR of film A V2 (`Noam_Airgapping`), builder v2m.
// A V2 copy of `incidentMonitor.tsx` (which stays frozen for the delivered V1
// cuts) on the V2 world (`incidentSharedV2`: the column centred on x 540 alone,
// the stations far right at x 1420 and spread down the page, TRAINING level
// with MAY, EVALUATION y 1019, INFRASTRUCTURE y 1764).
//
// Shared by the extra `45_MonitoringOff_V2` (G878) and cut 5
// `47_ImmediatelyShutDown_V2` (G943), which butt: ONE camera table and ONE
// monitor state in GLOBAL G, so the join is exact by construction.
//
// THE MONITOR is V1's, unchanged in look and staging (the approved 47): the
// punishShared reader line (thin white line, a dot at each end, STROKE,
// iconShadow) across the column's full width in the free band under the humans.
//   OFF (G < 946): INK_LO, parked at `Y_PARK`, not moving.
//   ON  (G946-958): INK_LO -> INK_HI in place.
//   READS (from G956): down the column at a CONSTANT rate over the white APR
//     text — nothing to find there.
//   FINDS: the frame its own y crosses MAY's plan-line centre (`G_FOUND` ≈ 995)
//     the white bracket starts round the line (BRACKET_F 6 f), closed ≈ G1001:
//     "immediately". The reader eases to rest in the gap under it.
//   SHUT DOWN: from that bracket ONE drain wave (`DRAIN`) runs down the page.
//
// V2 CHANGES (the layout, nothing else):
//  - The drain is re-timed for the far stations. Each swarm now flies back
//    430-1170 world px from beside its station into its own plan-line (V1:
//    ~150-350), which the world times at its 30-frame cap. The wave leaves the
//    bracket at G1009 (on "immediately", 1007), the front runs MAY -> JUL in 7 f
//    (FRONT_V 72: one wave), a month's window is 36 f: the stations revert as
//    their swarms leave them, in frame, on "shut it down" (TRAINING G1014-1029,
//    EVALUATION 1017-1032, INFRASTRUCTURE 1021-1036; "shut" 1017, "down" 1033);
//    JUL's line has un-typed by 1050 and no dot is above 30 % size at G1053.
//  - `future` = 0 (V2 cut 4 is plain text being written: no FUTURE label, no
//    NOW line, no breaking-up). The lines past NOW are plain text in the wide.
//  - THE CAMERA (one table G850..1060): the column framing (humans, reader,
//    column; the stations off right, the collective's threads running out of
//    the right edge), the push-in on the reader, then ONE pull-back that pans
//    right to the SCOPE wide (column + all three stations + the humans) as the
//    drain reaches the stations. See CAM_KEYS.
//
// Everything here is a pure function of G. Nothing is keyed to a cut.
// ---------------------------------------------------------------------------

export const G_EXTRA0 = 878;
export const EXTRA_DURATION = 81; // round(2.700 * 24) = 65 + 16
export const G_CUT5_0 = 943;
export const CUT5_DURATION = 111; // round(3.940 * 24) = 95 + 16

// --- the monitor line ---------------------------------------------------------
export const MON_OVERHANG = 16; // punishShared's READER_OVERHANG
export const MON_X0 = COL_X0 - MON_OVERHANG;
export const MON_X1 = COL_X1 + MON_OVERHANG;
/** end-dot radius: punishShared's 7 against its 5.2 stroke, scaled to this film's STROKE */
export const MON_DOT_R = STROKE * (7 / 5.2);

/** parked in the free band under the humans */
export const Y_PARK = -40;
/** at rest in the gap between MAY's bracket and the next line */
export const Y_REST = (PLAN_BOXES[0].y1 + lineTop(PLAN_LINE_IDX[0] + 1)) / 2;
/** the line the reader must find: MAY's plan-line, its word-band centre */
export const Y_FIND = lineCY(PLAN_LINE_IDX[0]);

export const G_LIT0 = 946; // "if"
export const G_LIT1 = 958;
export const G_MOVE0 = 956;
export const RAMP_IN = 8;
export const RAMP_OUT = 12;
/** the bracket should START on this frame, so it lands ≈ G1001 */
const G_FOUND_TARGET = 995;

/** distance travelled after t frames of motion at plateau speed V */
const travelled = (t: number, V: number, Tc: number) => {
  if (t <= 0) return 0;
  const a = RAMP_IN;
  if (t < a) return (V / 2) * (t - (a / Math.PI) * Math.sin((Math.PI * t) / a));
  const dA = (V * a) / 2;
  if (t < a + Tc) return dA + V * (t - a);
  const dC = dA + V * Tc;
  const b = RAMP_OUT;
  const u = Math.min(t - a - Tc, b);
  return dC + (V / 2) * (u + (b / Math.PI) * Math.sin((Math.PI * u) / b));
};

const D_TOTAL = Y_REST - Y_PARK;
const plateauFor = (V: number) => D_TOTAL / V - (RAMP_IN + RAMP_OUT) / 2;
const crossingT = (V: number) => {
  const Tc = plateauFor(V);
  const target = Y_FIND - Y_PARK;
  let lo = 0;
  let hi = RAMP_IN + Tc + RAMP_OUT;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (travelled(m, V, Tc) < target) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

/** the plateau speed, world px/f, solved so the reader crosses MAY at G_FOUND_TARGET */
export const READ_V = (() => {
  let lo = 4;
  let hi = 40;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (G_MOVE0 + crossingT(m) > G_FOUND_TARGET) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
})();
const TC = plateauFor(READ_V);
if (TC < 4) throw new Error(`incidentMonitorV2: the reader has no constant-rate stretch (${TC.toFixed(2)} f)`);
export const G_FOUND = G_MOVE0 + crossingT(READ_V);
export const G_BRACKET_DONE = G_FOUND + BRACKET_F;
export const G_REST = G_MOVE0 + RAMP_IN + TC + RAMP_OUT;

/** the monitor's world y at G (continuous in G) */
export const monitorY = (G: number) => Y_PARK + travelled(G - G_MOVE0, READ_V, TC);
/** its ink opacity: INK_LO (off) -> INK_HI (on) */
export const monitorOp = (G: number) => INK_LO + (INK_HI - INK_LO) * smoothstep((G - G_LIT0) / (G_LIT1 - G_LIT0));
/** the bracket round MAY, 0..1 from its left end */
export const bracketU = (G: number) => clamp01((G - G_FOUND) / BRACKET_F);

// --- the shut-down ------------------------------------------------------------
const TUNE = ((globalThis as { V2M_TUNE?: Record<string, number> }).V2M_TUNE ?? {}) as Record<string, number>;
/** the wave leaves MAY's bracket on "immediately" (G1007): the bracket closes
 *  ≈ G1001, the wave goes ≈ G1009 — the shut-down follows the find at once */
export const G_DRAIN0 = TUNE.G_DRAIN0 ?? 1009;
/** the front's speed, world px / f: MAY -> JUL (504 px) in 7 f — one wave */
export const FRONT_V = TUNE.FRONT_V ?? 72;
export const DRAIN_ORIGIN = Y_FIND;
const FRONT_END = DRAIN_END_Y + DRAIN_L;
/** the G the front passes world y */
export const reachAt = (y: number) => G_DRAIN0 + Math.max(0, y - DRAIN_ORIGIN) / FRONT_V;
/** a month's local window, frames: threads [0, .25], dots launch [0, .3] and fly
 *  (the world's 12..30 f), stations revert [.15, .55], brackets [.4, .6], the
 *  line un-types [.6, .95] */
export const DRAIN_LOCAL_F = TUNE.L ?? 36;
/** the dots' flight speed parameter (the world: T = clamp(1.5 d / dotV, 12, 30)) */
export const DRAIN_DOT_V = TUNE.DOT_V ?? 20;
export const DRAIN: Drain = {
  originY: DRAIN_ORIGIN,
  pAt: (G: number) => clamp01(((G - G_DRAIN0) * FRONT_V) / (FRONT_END - DRAIN_ORIGIN)),
  localF: DRAIN_LOCAL_F,
  reachAt,
  dotV: DRAIN_DOT_V,
};
/** the drain is only passed to the world once it has started */
export const drainAt = (G: number) => (G >= G_DRAIN0 - 1 ? DRAIN : null);

/** the world's own bracket round MAY is complete: ours hands over to it */
export const worldBracketDone = (G: number) => {
  const u = drainLocal(DRAIN, G, Y_FIND);
  return clamp01((u - DRAIN_BRACKET[0]) / (DRAIN_BRACKET[1] - DRAIN_BRACKET[0])) >= 1;
};

/** V2: cut 4 is plain text being written, so nothing past NOW breaks up */
export const FUTURE = 0;

// --- drawing --------------------------------------------------------------------
/** THE MONITOR LINE (V1's, on the V2 column). */
export const MonitorLine: React.FC<{ G: number; k: number }> = ({ G, k }) => {
  const y = monitorY(G);
  const op = monitorOp(G);
  return (
    <g opacity={op} style={{ filter: iconShadow(k) }}>
      <line x1={MON_X0} y1={y} x2={MON_X1} y2={y} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx={MON_X0} cy={y} r={MON_DOT_R} fill={INK} />
      <circle cx={MON_X1} cy={y} r={MON_DOT_R} fill={INK} />
    </g>
  );
};

/** THE BRACKET the monitor closes round MAY's plan-line — identical to the drain's. */
export const MonitorBracket: React.FC<{ G: number; k: number }> = ({ G, k }) => {
  const u = bracketU(G);
  if (u <= 0 || worldBracketDone(G)) return null;
  const b = PLAN_BOXES[0];
  return (
    <path
      d={roundRect(b.x0, b.y0, b.x1, b.y1, 12)}
      fill="none"
      stroke={INK}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      opacity={INK_HI}
      pathLength={1}
      strokeDasharray={u < 1 ? `${u} ${Math.max(1e-4, 1 - u)}` : undefined}
      style={{ filter: iconShadow(k) }}
    />
  );
};

// --- the ink the framings must hold ----------------------------------------------
/** month labels' left (measured on V1: 76.2 px left of MONTH_LABEL_R) */
export const COMP_X0 = SCOPE.x0 - 6;
/** label half width, Roboto Condensed Bold caps 40 px (+0.04 em) — v2w's measure */
const LABEL_HALF = (text: string) => (text.length * 23.4) / 2;
/** every station's ink (icon box + label) */
export const STATION_INK = STATIONS.map((st) => {
  const lh = LABEL_HALF(st.key);
  return {
    x0: Math.min(st.box.x0, st.cx - lh),
    x1: Math.max(st.box.x1, st.cx + lh),
    y0: st.box.y0,
    y1: st.labelY + LABEL_SIZE,
  };
});
/** the scope wide's content: the humans' heads .. INFRASTRUCTURE's label, the
 *  month labels .. the stations' right edge */
export const WIDE_INK = {
  x0: COMP_X0,
  x1: Math.max(...STATION_INK.map((r) => r.x1)),
  y0: HUMANS_INK.y0,
  y1: Math.max(...STATION_INK.map((r) => r.y1)),
};

// --- THE CAMERA: one table, G850..1060, shared by both cuts ----------------------
// Target keys: content centre (x, y) and k; buildCamTable adds CAM_LIFT/k, damps
// it and adds the hand's sway.
//   creep   G850-960  the COLUMN framing: humans' heads at screen 96 -> 86, k
//                     1.03 -> 1.06, x 550 (the column's composition centre 540,
//                     leaning right); the stations and the swarms beside them
//                     are off right with >= 70 px margin, the collective's orange
//                     threads run out of the right edge. Pre-rolled so 45's f0 moves.
//   glide 1 G948-985  a lean in on the reader as it lights and starts down
//                     (k -> ~1.07 net: glide 2 takes over before it can go
//                     deeper — the budget below does not allow V1's k 1.34 crest).
//   glide 2 G966-1020 THE PULL-BACK: out and right to the SCOPE wide (k 0.585,
//                     centred on the wide's ink, the humans' heads ≈ 125 and
//                     INFRASTRUCTURE's label ≈ 1390). It must start during the
//                     read: the pull-back needs ~55 f inside the 45 px/f cap, and
//                     the stations must be whole in frame (G1007-1010) before
//                     their swarms leave them. At the find (G995) k ≈ 0.9.
//   tail    G1012-1080 a slow creep continuing the pull-back's direction.
export const CAM_KEYS = {
  creep: { g0: 850, g1: 960, k0: 1.03, k1: 1.06, x: 550, head0: 96, head1: 86 },
  glide1: { g0: 948, g1: TUNE.G1E ?? 985, k: TUNE.K1 ?? 1.1, x: 556, may: 990, warp: 1.15 },
  glide2: { g0: TUNE.G2S ?? 966, g1: TUNE.G2E ?? 1020, k: TUNE.K2 ?? 0.585, top: TUNE.TOP ?? 125, warp: TUNE.W2 ?? 1.1 },
  tail: { g1: 1080, dk: -0.012, dy: 8 },
};
const W_CX = (WIDE_INK.x0 + WIDE_INK.x1) / 2;
/** content centre y that puts world y `wy` at screen `sy` at zoom k */
const centreFor = (wy: number, sy: number, k: number) => wy + (835 - sy) / k;

export const CAM_G0 = 850;
export const CAM_G1 = 1060;

const camTarget = (G: number) => {
  const c = CAM_KEYS.creep;
  const g1 = seg01(G, CAM_KEYS.glide1.g0, CAM_KEYS.glide1.g1, CAM_KEYS.glide1.warp);
  const g2 = seg01(G, CAM_KEYS.glide2.g0, CAM_KEYS.glide2.g1, CAM_KEYS.glide2.warp);
  const gt = seg01(G, CAM_KEYS.glide2.g1 - 8, CAM_KEYS.tail.g1, 1);
  const uc = clamp01((G - c.g0) / (c.g1 - c.g0));
  let k = c.k0 + (c.k1 - c.k0) * uc;
  let x = c.x;
  let y = centreFor(HUMANS_INK.y0, c.head0 + (c.head1 - c.head0) * uc, k);
  const k1 = CAM_KEYS.glide1.k;
  k += (k1 - k) * g1;
  x += (CAM_KEYS.glide1.x - x) * g1;
  y += (centreFor(Y_FIND, CAM_KEYS.glide1.may, k1) - y) * g1;
  const k2 = CAM_KEYS.glide2.k;
  k += (k2 - k) * g2;
  x += (W_CX - x) * g2;
  y += (centreFor(WIDE_INK.y0, CAM_KEYS.glide2.top, k2) - y) * g2;
  k += CAM_KEYS.tail.dk * gt * g2;
  y += CAM_KEYS.tail.dy * gt * g2;
  return { x, y, k };
};

export const CAM_M = buildCamTable(CAM_G0, CAM_G1, camTarget);

// --- THE PROOFS each cut runs at module scope over its own window --------------
/** Per frame: caption band (subject ink ≤ 1400), head-room, the column framing's
 *  side air, stations never cut by a frame edge (wholly in or wholly out, with
 *  air), the reader's speed, the fastest on-screen swarm dot and fixed ink, and
 *  the camera's |Δv|. SUBJECT = the humans, the monitor, MAY's line; from
 *  `wideFrom` on every plan-line box and every station with its label too.
 *  Throws with the frame and the number. */
export const proveWindow = (name: string, g0: number, g1: number, wideFrom: number) => {
  let lowest = -Infinity;
  let lowestG = g0;
  let head = Infinity;
  let airL = Infinity;
  let airR = Infinity;
  let readerV = 0;
  let maxDv = 0;
  let maxDvG = g0;
  let inkV = 0;
  let inkVG = g0;
  let dotV = 0;
  let dotVG = g0;
  let cut: string | null = null;
  let prev: number[][] | null = null;
  const probeScreen = [
    [540, 835],
    [120, 260],
    [960, 1400],
  ];
  for (let G = g0; G <= g1; G++) {
    const cam = CAM_M.at(G);
    const pc = CAM_M.at(G - 1);
    const boxes: { x0: number; x1: number; y1: number }[] = [
      { x0: HUMANS_INK.x0, x1: HUMANS_INK.x1, y1: HUMANS_INK.y1 },
      { x0: MON_X0, x1: MON_X1, y1: monitorY(G) + MON_DOT_R },
      PLAN_BOXES[0],
    ];
    if (G >= wideFrom) {
      PLAN_BOXES.forEach((b) => boxes.push(b));
      STATION_INK.forEach((r) => boxes.push(r));
      airR = Math.min(airR, FRAME_W - screenOf(cam, WIDE_INK.x1, 0).x);
    }
    for (const b of boxes) {
      const y = screenOf(cam, b.x0, b.y1).y;
      if (y > lowest) {
        lowest = y;
        lowestG = G;
      }
    }
    head = Math.min(head, screenOf(cam, 0, HUMANS_INK.y0).y);
    airL = Math.min(airL, screenOf(cam, COMP_X0, 0).x);
    // a station (or its label) is never cut by the left/right/top edge: wholly
    // outside, or inside with >= 24 px of air
    STATION_INK.forEach((r, s) => {
      const a = screenOf(cam, r.x0, r.y0);
      const b = screenOf(cam, r.x1, r.y1);
      const out = a.x >= FRAME_W || b.x <= 0 || b.y <= 0 || a.y >= FRAME_H;
      if (out) return;
      const inside = a.x >= 24 && b.x <= FRAME_W - 24 && a.y >= 24;
      // entering from the right during the pull-back is motion, not a parked crop
      const entering = G < wideFrom;
      if (!inside && !entering && !cut) cut = `${STATIONS[s].key} cut by the frame at G${G}`;
    });
    if (G > g0) {
      const a = screenOf(pc, 400, monitorY(G - 1));
      const b = screenOf(cam, 400, monitorY(G));
      readerV = Math.max(readerV, Math.hypot(b.x - a.x, b.y - a.y));
      // fixed ink: the stations' corners, the column's edges
      const pts: { x: number; y: number }[] = [];
      STATION_INK.forEach((r) => pts.push({ x: r.x0, y: r.y0 }, { x: r.x1, y: r.y1 }, { x: r.x0, y: r.y1 }, { x: r.x1, y: r.y0 }));
      for (let yy = -240; yy <= 2400; yy += 120) pts.push({ x: COMP_X0, y: yy }, { x: COL_X1, y: yy });
      for (const q of pts) {
        const p0 = screenOf(pc, q.x, q.y);
        const p1 = screenOf(cam, q.x, q.y);
        if (p1.x < 0 || p1.x > FRAME_W || p1.y < 0 || p1.y > FRAME_H) continue;
        const v = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        if (v > inkV) {
          inkV = v;
          inkVG = G;
        }
      }
      // swarm dots before the drain (the drain's flights are measured by the render probe)
      for (let s = 0; s < 3; s++) {
        for (let i = 0; i < SWARM_N; i += 3) {
          const A = swarmDot(s, i, G - 1);
          const B = swarmDot(s, i, G);
          const p0 = screenOf(pc, A.x, A.y);
          const p1 = screenOf(cam, B.x, B.y);
          if (p1.x < 0 || p1.x > FRAME_W || p1.y < 0 || p1.y > FRAME_H) continue;
          const v = Math.hypot(p1.x - p0.x, p1.y - p0.y);
          if (v > dotV) {
            dotV = v;
            dotVG = G;
          }
        }
      }
      const v = probeScreen.map(([sx, sy]) => {
        const wx = cam.cx + (sx - FRAME_W / 2) / cam.k;
        const wy = cam.cy + (sy - FRAME_H / 2) / cam.k;
        const p = screenOf(pc, wx, wy);
        return [sx - p.x, sy - p.y];
      });
      if (prev) {
        v.forEach((w, i) => {
          const d = Math.hypot(w[0] - prev![i][0], w[1] - prev![i][1]);
          if (d > maxDv) {
            maxDv = d;
            maxDvG = G;
          }
        });
      }
      prev = v;
    }
  }
  const stats = {
    lowest: Math.round(lowest),
    lowestG,
    headroom: Math.round(head),
    leftAir: Math.round(airL),
    rightAir: Number.isFinite(airR) ? Math.round(airR) : null,
    readerMaxV: Number(readerV.toFixed(1)),
    inkMaxV: Number(inkV.toFixed(1)),
    inkMaxVG: inkVG,
    dotMaxV: Number(dotV.toFixed(1)),
    dotMaxVG: dotVG,
    camMaxDv: Number(maxDv.toFixed(2)),
    camMaxDvG: maxDvG,
  };
  const probe = (globalThis as { V2M_PROBE?: boolean }).V2M_PROBE;
  const fail = (m: string) => {
    if (probe) console.log("FAIL", m);
    else throw new Error(m);
  };
  if (lowest > 1400) fail(`${name}: subject ink at screen y ${stats.lowest} on G${lowestG} (> 1400)`);
  if (head < 50) fail(`${name}: head-room ${stats.headroom} px (< 50)`);
  if (airL < 40) fail(`${name}: left air ${stats.leftAir} px`);
  if (airR < 40) fail(`${name}: right air ${stats.rightAir} px (< 40) in the wide`);
  if (cut) fail(`${name}: ${cut}`);
  if (readerV > 45) fail(`${name}: the reader moves ${stats.readerMaxV} screen px/f (> 45)`);
  if (inkV > 45) fail(`${name}: fixed ink moves ${stats.inkMaxV} screen px/f on G${inkVG} (> 45)`);
  if (dotV > 45) fail(`${name}: a swarm dot moves ${stats.dotMaxV} screen px/f on G${dotVG} (> 45)`);
  if (maxDv > 2.6) fail(`${name}: camera |dv| ${stats.camMaxDv} on G${maxDvG}`);
  return stats;
};

/** for the report */
export const MONITOR_EVENTS = {
  lit: [G_LIT0, G_LIT1],
  moves: G_MOVE0,
  found: G_FOUND,
  bracketDone: G_BRACKET_DONE,
  rest: G_REST,
  drain0: G_DRAIN0,
  reach: PLAN_LINE_IDX.map((i) => reachAt(lineCY(i))),
  revert: PLAN_LINE_IDX.map((i) => [reachAt(lineCY(i)) + 0.15 * DRAIN_LOCAL_F, reachAt(lineCY(i)) + 0.55 * DRAIN_LOCAL_F]),
  untype: PLAN_LINE_IDX.map((i) => [reachAt(lineCY(i)) + 0.6 * DRAIN_LOCAL_F, reachAt(lineCY(i)) + 0.95 * DRAIN_LOCAL_F]),
  /** the last dot's landing: its month's reach + its launch share (<= .3 L) + the world's 30 f cap */
  lastDotHome: reachAt(lineCY(PLAN_LINE_IDX[2])) + 0.3 * DRAIN_LOCAL_F + 30,
};
export type { Cam };
export { FRAME_H };
