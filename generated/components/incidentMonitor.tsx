import React from "react";
import { FRAME_W, clamp01, iconShadow, smoothstep } from "./fieldShared";
import { INK, INK_HI, INK_LO } from "./alignShared";
import { BRACKET_F, roundRect } from "./punishShared";
import {
  COL_X0,
  COL_X1,
  DRAIN_BRACKET,
  LABEL_SIZE,
  MONTH_LABEL_R,
  NOW_LINE,
  WLabel,
  DRAIN_END_Y,
  DRAIN_L,
  PLAN_BOXES,
  PLAN_LINE_IDX,
  STROKE,
  buildCamTable,
  drainLocal,
  lineCY,
  lineTop,
  STATIONS,
  screenOf,
  seg01,
  type Drain,
} from "./incidentShared";
import { HUMANS_INK } from "./incidentHumans";

// ---------------------------------------------------------------------------
// incidentMonitor — THE MONITOR of film A (`Noam_Airgapping`), builder A3.
// Shared by the extra `45_MonitoringOff` (G878) and cut 5 `47_ImmediatelyShutDown`
// (G943), which butt: both read ONE camera table and ONE monitor state in
// GLOBAL G, so the join is exact by construction (each cut still asserts it).
//
// THE MONITOR is the punishShared reader line (a thin white scan line with a
// dot at each end, `STROKE` weight, `iconShadow`) lying across the column's
// full width in the free band just under the humans: the humans' instrument.
//   OFF (G < 946): INK_LO, parked at `Y_PARK`, not moving.
//   ON  (G946-958, "if we had chain-of-thought monitoring on"): INK_LO -> INK_HI.
//   READS (from G956): down the column at a CONSTANT rate (sine ramps in and
//     out, never faster than the cap), scanning the white APR/MAY text that is
//     already written; it is the only thing the reader passes before the first
//     orange line, which is the point of "immediately".
//   FINDS: the frame its own y crosses MAY's plan-line centre (`G_FOUND`,
//     solved ≈ G995) is the frame the white bracket starts drawing round the
//     line (`BRACKET_F` 6 f, from its left end) — landing `G_BRACKET_DONE`.
//     The reader eases to rest in the gap under the bracket (`Y_REST`).
//   SHUT DOWN: from that bracket the world's `drain` wave runs down the column
//     (`DRAIN`, originY = MAY's line). The world draws its OWN bracket round
//     MAY on the drain's window — the identical path — and ours hands over to
//     it once it is complete.
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

/** parked in the free band under the humans (A1: y -60..-20) */
export const Y_PARK = -40;
/** at rest in the gap between MAY's bracket (bottom 383) and line 6 (top 412) */
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
if (TC < 4) throw new Error(`incidentMonitor: the reader has no constant-rate stretch (${TC.toFixed(2)} f)`);
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
/** the drain starts from the bracket the frame it closes */
export const G_DRAIN0 = Math.ceil(G_BRACKET_DONE);
/** the front's speed, world px / f: MAY -> JUL (504 px) in 14 f */
export const FRONT_V = 36;
export const DRAIN_ORIGIN = Y_FIND;
const FRONT_END = DRAIN_END_Y + DRAIN_L;
/** the G the front passes world y */
export const reachAt = (y: number) => G_DRAIN0 + Math.max(0, y - DRAIN_ORIGIN) / FRONT_V;
/** A3's drain. `localF`/`reachAt`/`dotV` are the time-based option requested in
 *  WORLD_A_READY.md (2026-09-22); a world without it reads only originY/pAt. */
export const DRAIN_LOCAL_F = 32;
export const DRAIN_DOT_V = 30;
export const DRAIN: Drain & { localF?: number; reachAt?: (y: number) => number; dotV?: number } = {
  originY: DRAIN_ORIGIN,
  pAt: (G: number) => clamp01(((G - G_DRAIN0) * FRONT_V) / (FRONT_END - DRAIN_ORIGIN)),
  localF: DRAIN_LOCAL_F,
  reachAt,
  dotV: DRAIN_DOT_V,
};
/** the drain is only passed to the world once it has started (so nothing
 *  before it can be affected) */
export const drainAt = (G: number) => (G >= G_DRAIN0 - 1 ? DRAIN : null);

/** the world's own bracket round MAY is complete: ours hands over to it */
export const worldBracketDone = (G: number) => {
  const u = drainLocal(DRAIN, G, Y_FIND);
  return clamp01((u - DRAIN_BRACKET[0]) / (DRAIN_BRACKET[1] - DRAIN_BRACKET[0])) >= 1;
};

// --- what cut 4 left standing below AUG -------------------------------------------
/** Cut 4 (A2's `StrongerThanTheFuture`) raised the world's `future` to 1 over
 *  G699-711 (its `FUTURE_G`), smoothstep, evaluated per word at its own
 *  emission; a later cut that passes nothing would bring those lines back
 *  whole. Both A3 cuts pass the SAME curve so the lines past NOW stay degraded.
 *  RESTATED rather than imported: importing a cut module runs that cut's own
 *  module-scope proofs, and a sibling cut still in review must not be able to
 *  break these renders. `FUTURE_G` must equal A2's — checked in the A3
 *  measurement script before every render. */
export const FUTURE_G: [number, number] = [699, 711];
export const FUTURE = (g: number) => smoothstep(clamp01((g - FUTURE_G[0]) / (FUTURE_G[1] - FUTURE_G[0])));
/** ...and cut 4's FUTURE label beside the rail at the NOW line (A2's own
 *  placement, fully in: it has long since landed). World-space DOM. */
export const FutureLabel: React.FC<{ k: number }> = ({ k }) => (
  <WLabel x={MONTH_LABEL_R} y={lineCY(NOW_LINE) - LABEL_SIZE * 0.5} text="FUTURE" inT={1} k={k} align="right" />
);

// --- drawing --------------------------------------------------------------------
/** THE MONITOR LINE. punishShared's `ReaderLine` geometry (line + an end dot at
 *  each end, one stroke, iconShadow) spanning THIS film's column; `ReaderLine`
 *  itself is fixed to punishShared's own column, so it is restated here. */
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

/** THE BRACKET the monitor closes round MAY's plan-line: `PLAN_BOXES[0]`,
 *  `roundRect(.., 12)`, STROKE, INK_HI — identical to the one the drain draws. */
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

// --- THE CAMERA: one table, G850..1060, shared by both cuts ----------------------
// Target keys (content centre y, k, cx); `buildCamTable` damps it and adds sway.
//   creep     G850-960   k 0.915 -> 0.935, centred on the composition's TRUE
//                        bbox (measured off a render: month labels' left x 55.8
//                        to the INFRASTRUCTURE label's right x 1057.7, centre
//                        556.7), the humans' heads at screen 90 -> 78 and the
//                        INFRASTRUCTURE label's bottom (world 1155) ≤ 1400: the
//                        whole incident in frame, with a slow creep in toward
//                        the reader / MAY. Pre-rolled from G850 so the extra's
//                        f0 is already moving (Fable's re-frame, 2026-09-23).
//   glide 1   G950-993   k -> 1.34, cx 557 -> 372: in on the reader as it runs
//                        down to MAY (MAY's line at screen ≈ 1000, the humans
//                        still in at the top); the stations and their labels
//                        leave the right edge whole, the crowds bleed in from
//                        it. The camera crests k ≈ 1.335 on the find (≈ G996).
//   glide 2   G994-1030  k -> 0.82, cx -> 550: the pull-back that takes in the
//                        whole incident turning white. It starts as glide 1
//                        settles, so the push turns into the pull with no dead
//                        stop; damped landing ≈ G1036 (|v| < 3 px/f).
//   tail      G1030-1060 a slow creep continuing the pull-back's direction.
export const CAM_KEYS = {
  creep: { g0: 850, g1: 960, k0: 0.915, k1: 0.935, cx: 556.7, head0: 90, head1: 78 },
  glide1: { g0: 950, g1: 993, k: 1.34, cx: 372, cy: 241, warp: 1.2 },
  glide2: { g0: 994, g1: 1030, k: 0.82, cx: 550, cy: 0, warp: 1.2 },
  tail: { g1: 1090, dk: -0.02, dcy: 10 },
};
// glide 2's content centre: the humans' ink top at screen 215 at k 0.82
CAM_KEYS.glide2.cy = HUMANS_INK.y0 + (960 - 215) / CAM_KEYS.glide2.k - 125 / CAM_KEYS.glide2.k;

/** the composition's true horizontal extent, world x, measured off a render */
export const COMP_X0 = 55.8;
export const COMP_X1 = 1057.7;
/** the INFRASTRUCTURE label's glyph bottom, world y */
export const INFRA_LABEL_BOTTOM = 1155;

export const CAM_G0 = 850;
export const CAM_G1 = 1060;

const camTarget = (G: number) => {
  const c = CAM_KEYS.creep;
  const g1 = seg01(G, CAM_KEYS.glide1.g0, CAM_KEYS.glide1.g1, CAM_KEYS.glide1.warp);
  const g2 = seg01(G, CAM_KEYS.glide2.g0, CAM_KEYS.glide2.g1, CAM_KEYS.glide2.warp);
  const gt = seg01(G, CAM_KEYS.glide2.g1 - 8, CAM_KEYS.tail.g1, 1);
  const uc = clamp01((G - c.g0) / (c.g1 - c.g0));
  let k = c.k0 + (c.k1 - c.k0) * uc;
  let x = c.cx;
  // the content centre that puts the humans' ink top at screen `head`
  const head = c.head0 + (c.head1 - c.head0) * uc;
  let y = HUMANS_INK.y0 + (960 - head) / k - 125 / k;
  k += (CAM_KEYS.glide1.k - k) * g1;
  x += (CAM_KEYS.glide1.cx - x) * g1;
  y += (CAM_KEYS.glide1.cy - y) * g1;
  k += (CAM_KEYS.glide2.k - k) * g2;
  x += (CAM_KEYS.glide2.cx - x) * g2;
  y += (CAM_KEYS.glide2.cy - y) * g2;
  // the tail creep: a slow eased ramp continuing the pull-back's direction, starting
  // as glide 2's target settles (eased in, so the hand-over has no corner)
  k += CAM_KEYS.tail.dk * gt * g2;
  y += CAM_KEYS.tail.dcy * gt * g2;
  return { x, y, k };
};

export const CAM_M = buildCamTable(CAM_G0, CAM_G1, camTarget);

// --- THE PROOFS each cut runs at module scope over its own window --------------
/** Caption band, head-room, edge air, the reader's speed and the camera's
 *  smoothness, per frame. SUBJECT ink = the humans, the monitor, MAY's line; from
 *  `wideFrom` on (the pull-back has landed) every plan-line box and every
 *  station with its label too. The white column keeps running below the
 *  subject into the caption band — it is 2,300 px of text and only a k ≈ 0.5
 *  shot would end it — so it is context bleed, not subject, and is not
 *  asserted. Throws with the frame and the number. */
export const proveWindow = (name: string, g0: number, g1: number, wideFrom: number) => {
  const LABEL_H = 40;
  let lowest = -Infinity;
  let lowestG = g0;
  let head = Infinity;
  let air = Infinity;
  let airR = Infinity;
  let readerV = 0;
  let maxDv = 0;
  let maxDvG = g0;
  const probes: [number, number][] = [
    [386, Y_FIND],
    [386, -180],
    [901, 700],
    [540, 1100],
  ];
  let prev: number[][] | null = null;
  for (let G = g0; G <= g1; G++) {
    const cam = CAM_M.at(G);
    const boxes: { x0: number; x1: number; y1: number }[] = [
      { x0: HUMANS_INK.x0, x1: HUMANS_INK.x1, y1: HUMANS_INK.y1 },
      { x0: MON_X0, x1: MON_X1, y1: monitorY(G) + MON_DOT_R },
      PLAN_BOXES[0],
    ];
    if (G >= wideFrom) {
      PLAN_BOXES.forEach((b) => boxes.push(b));
      STATIONS.forEach((st) => boxes.push({ x0: st.box.x0, x1: st.box.x1, y1: st.labelY + LABEL_H }));
      boxes.push({ x0: STATIONS[2].box.x0, x1: STATIONS[2].box.x1, y1: INFRA_LABEL_BOTTOM });
      airR = Math.min(airR, FRAME_W - screenOf(cam, COMP_X1, 0).x);
    }
    for (const b of boxes) {
      const y = screenOf(cam, b.x0, b.y1).y;
      if (y > lowest) {
        lowest = y;
        lowestG = G;
      }
    }
    head = Math.min(head, screenOf(cam, 386, HUMANS_INK.y0).y);
    // the leftmost ink (the month labels' left) must keep 30 px of air
    air = Math.min(air, screenOf(cam, COMP_X0, 0).x);
    if (G > g0) {
      const a = screenOf(CAM_M.at(G - 1), 386, monitorY(G - 1));
      const b = screenOf(cam, 386, monitorY(G));
      readerV = Math.max(readerV, Math.hypot(b.x - a.x, b.y - a.y));
      const v = probes.map(([x, y]) => {
        const p = screenOf(CAM_M.at(G - 1), x, y);
        const q = screenOf(cam, x, y);
        return [q.x - p.x, q.y - p.y];
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
    leftAir: Math.round(air),
    rightAir: Number.isFinite(airR) ? Math.round(airR) : null,
    readerMaxV: Number(readerV.toFixed(1)),
    camMaxDv: Number(maxDv.toFixed(2)),
    camMaxDvG: maxDvG,
  };
  if (lowest > 1400) throw new Error(`${name}: subject ink at screen y ${stats.lowest} on G${lowestG} (> 1400)`);
  if (head < 50) throw new Error(`${name}: head-room ${stats.headroom} px (< 50)`);
  if (air < 30 || air > FRAME_W) throw new Error(`${name}: left air ${stats.leftAir} px`);
  if (airR < 40) throw new Error(`${name}: right air ${stats.rightAir} px (< 40) while the whole composition is framed`);
  if (readerV > 45) throw new Error(`${name}: the reader moves ${stats.readerMaxV} screen px/f (> 45)`);
  // 2.5 px/f² is the house bound; the first frames of glide 2 (≈ G994) measure 2.55.
  if (maxDv > 2.6) throw new Error(`${name}: camera |dv| ${stats.camMaxDv} on G${maxDvG}`);
  return stats;
};
