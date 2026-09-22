import React from "react";
import { ACCENT, clamp01, hash, smoothstep } from "./fieldShared";
import {
  COL_X0,
  DRAIN_THREADS,
  LINES,
  PACKET_R,
  PLAN_LINE_IDX,
  SWARM_N,
  SWARM_PLANS,
  THREAD,
  drainLocal,
  lineCY,
  swarmDot,
  type Drain,
} from "./incidentShared";

// ---------------------------------------------------------------------------
// incidentCollective — "the scope of what this COLLECTIVE was doing" (cut 3,
// 26_InTheDark, "collective" G538). Owned by builder A2.
//
// On that word the three swarms stop being three: orange THREADS join them
// into ONE network — each plan-line to the swarm it boiled out, and each swarm
// to the next (MAY -> JUN -> JUL) — with packets running along every thread in
// alternating directions, so the traffic circulates through the whole shape.
// The column's plan-lines, the three crowds and (through the crowds) their
// converted stations read as one organism.
//
// It is ORANGE (the rogue AI's own), THREAD weight, packets PACKET_R — the same
// line family as the world's rack threads. Draw it in `IncidentWorld`'s
// `orangeSvg` (it stays full through the dim, like all orange).
//
// It is PART OF THE WORLD from G516 on: every later cut of film A should draw
// `<Collective G={G} drain={drain} />` so it is still standing. It honours the
// drain: a thread retracts toward its lower endpoint on the same local window
// the world's rack threads use (`DRAIN_THREADS` of the plan-line's month for a
// line thread, of the lower swarm's month for a spine thread), before the dots
// fly home.
//
// Timing (global G): threads draw head-led, top to bottom, starting
// NET_G0 + NET_STEP * n (n = 0..6), each over NET_DRAW_F frames; the last lands
// G538 on "collective". Packets start on each thread as it completes.
// ---------------------------------------------------------------------------

export const NET_G0 = 516;
export const NET_STEP = 1.5;
export const NET_DRAW_F = 9;
export const NET_PACKET_PERIOD = 13;
export const NET_PACKET_V = 4.2; // world px / frame (<= 45 screen px/f at any k this film uses)

type End = { kind: "dot"; s: number; i: number } | { kind: "line"; s: number; word: number };
export type NetThread = { a: End; b: End; month: number; dir: 1 | -1 };

const rest = (s: number, i: number) => SWARM_PLANS[s][i].rest;

/** The dot of swarm s whose rest seat is nearest to point p, excluding used ones. */
const nearestDot = (s: number, p: { x: number; y: number }, used: Set<number>) => {
  let best = -1;
  let bd = Infinity;
  for (let i = 0; i < SWARM_N; i++) {
    if (used.has(s * 1000 + i)) continue;
    const q = rest(s, i);
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  used.add(s * 1000 + best);
  return best;
};

/** Where a plan-line thread leaves the line: the right end of word `word`. */
const lineEnd = (s: number, word: number) => {
  const l = LINES[PLAN_LINE_IDX[s]];
  const w = l.words[Math.min(word, l.words.length - 1)];
  return { x: COL_X0 + w.x + w.w, y: lineCY(PLAN_LINE_IDX[s]) };
};

export const NET_THREADS: NetThread[] = (() => {
  const used = new Set<number>();
  const out: NetThread[] = [];
  for (let s = 0; s < 3; s++) {
    // the plan-line -> its own swarm (provenance): from the line's last word
    const last = LINES[PLAN_LINE_IDX[s]].words.length - 1;
    const p = lineEnd(s, last);
    out.push({
      a: { kind: "line", s, word: last },
      b: { kind: "dot", s, i: nearestDot(s, { x: p.x + 60, y: p.y }, used) },
      month: s,
      dir: 1,
    });
    if (s < 2) {
      // swarm s -> swarm s+1: two threads between facing edges, left and right
      for (const side of [0, 1]) {
        const xs = side === 0 ? 0.3 : 0.75;
        let x0 = Infinity;
        let x1 = -Infinity;
        let yb = -Infinity;
        let yt = Infinity;
        for (let i = 0; i < SWARM_N; i++) {
          const q = rest(s, i);
          x0 = Math.min(x0, q.x);
          x1 = Math.max(x1, q.x);
          yb = Math.max(yb, q.y);
          const r = rest(s + 1, i);
          yt = Math.min(yt, r.y);
        }
        const px = x0 + (x1 - x0) * xs;
        const ia = nearestDot(s, { x: px, y: yb }, used);
        const ra = rest(s, ia);
        const ib = nearestDot(s + 1, { x: ra.x + (side === 0 ? -10 : 10), y: yt }, used);
        out.push({
          a: { kind: "dot", s, i: ia },
          b: { kind: "dot", s: s + 1, i: ib },
          month: s + 1,
          dir: side === 0 ? 1 : -1,
        });
      }
    }
  }
  return out;
})();

/** Draw order and draw start per thread: top to bottom by the thread's upper end. */
const endPos = (e: End, G: number) =>
  e.kind === "line" ? lineEnd(e.s, e.word) : (() => {
    const d = swarmDot(e.s, e.i, G);
    return { x: d.x, y: d.y };
  })();

export const NET_START: number[] = (() => {
  const order = NET_THREADS.map((t, n) => ({ n, y: Math.min(endPos(t.a, 600).y, endPos(t.b, 600).y) })).sort(
    (p, q) => p.y - q.y,
  );
  const start = new Array<number>(NET_THREADS.length);
  order.forEach((o, r) => {
    start[o.n] = NET_G0 + NET_STEP * r + 0.8 * hash(o.n, 7);
  });
  return start;
})();

/** 0..1: thread n drawn at G (before any drain). */
export const netDraw = (n: number, G: number) => smoothstep(clamp01((G - NET_START[n]) / NET_DRAW_F));
/** The G the whole network is joined. */
export const NET_JOINED = Math.max(...NET_START) + NET_DRAW_F;

/** THE COLLECTIVE at G, world-space SVG for `orangeSvg`. */
export const Collective: React.FC<{ G: number; drain?: Drain | null; opacity?: number }> = ({
  G,
  drain = null,
  opacity = 0.95,
}) => {
  if (G < NET_G0) return null;
  const els: React.ReactNode[] = [];
  NET_THREADS.forEach((t, n) => {
    const a = endPos(t.a, G);
    const b = endPos(t.b, G);
    const up = a.y <= b.y ? a : b;
    const lo = a.y <= b.y ? b : a;
    // the drain retracts it toward its LOWER end, on its month's own window
    const dl = drainLocal(drain, G, lineCY(PLAN_LINE_IDX[t.month]));
    const keep = 1 - clamp01((dl - DRAIN_THREADS[0]) / (DRAIN_THREADS[1] - DRAIN_THREADS[0]));
    const draw = netDraw(n, G) * keep;
    if (draw <= 0.002) return;
    // head-led from the upper end while drawing; its upper end slides down while retracting
    const retracting = keep < 1;
    const from = retracting ? { x: lo.x + (up.x - lo.x) * draw, y: lo.y + (up.y - lo.y) * draw } : up;
    const to = retracting ? lo : { x: up.x + (lo.x - up.x) * draw, y: up.y + (lo.y - up.y) * draw };
    els.push(
      <line
        key={`nl${n}`}
        x1={from.x.toFixed(2)}
        y1={from.y.toFixed(2)}
        x2={to.x.toFixed(2)}
        y2={to.y.toFixed(2)}
        stroke={ACCENT}
        strokeWidth={THREAD.toFixed(3)}
        strokeLinecap="round"
      />,
    );
    if (retracting || draw < 1) return;
    // packets: launched every NET_PACKET_PERIOD from the thread's completion,
    // alternating direction thread to thread so the traffic circulates
    const g0 = NET_START[n] + NET_DRAW_F;
    const len = Math.hypot(lo.x - up.x, lo.y - up.y);
    const travel = len / NET_PACKET_V;
    const s0 = t.dir === 1 ? up : lo;
    const s1 = t.dir === 1 ? lo : up;
    const nMax = Math.floor((G - g0) / NET_PACKET_PERIOD);
    const nMin = Math.max(0, Math.ceil((G - g0 - travel) / NET_PACKET_PERIOD));
    for (let q = nMin; q <= nMax; q++) {
      const u = (G - g0 - q * NET_PACKET_PERIOD) / travel;
      if (u < 0 || u > 1) continue;
      els.push(
        <circle
          key={`np${n}-${q}`}
          cx={(s0.x + (s1.x - s0.x) * u).toFixed(2)}
          cy={(s0.y + (s1.y - s0.y) * u).toFixed(2)}
          r={PACKET_R.toFixed(3)}
          fill={ACCENT}
        />,
      );
    }
  });
  return <g opacity={opacity}>{els}</g>;
};
