// ---------------------------------------------------------------------------
// IntelligenceDiluted (rsi-stupidest-species, cut 74). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 101 frames.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d (its header is the API). No shared module.
//
// CHECK LINE: "Whatever push evolution gave intelligence got watered down by pressures pulling the other way."
//
// THE LINE: "been diluted by the selection pressures that have opposed greater intelligence. For"
// WORD -> FRAME: been 1 · diluted 6 · by 19 · the 27 · selection 29 · pressures 35 · that 50 · have 57 · opposed 60 ·
//   greater 71 · intelligence 85 · For 98
// DURATION: the slot 74.658 -> 78.870 s (sequence frames 1790-1891) = 101 frames at 24000/1001 (f0..f100).
//
// THE MOTION: one plain tall lab glass on a stone plinth holds a modest layer of glowing orange liquid; at f0 the last of an
// orange trickle is falling into it from above (its tail drops in by ~f10). Two iron pipes reach in from the frame
// edges above the glass (left lands f7, right f15) and pour a dull petrol-khaki liquid: the level climbs from y ~840 to
// ~440, dull plumes curl down into the orange where the streams land and orange curls are dragged up into the murk;
// f35-85 the pours thin and the mixing spreads until the murk wins: the whole volume is a dull olive grey-khaki (pond water) with only a faint warm trace low down;
// f85-100 the last drips fall and slow swirls keep turning. The camera makes one slow, even push-in (k 1.00 -> 1.032), still creeping at the cut.
// CAUSE BEFORE EFFECT: every stream is a column of parcels leaving the nozzle at the flow of that instant and falling
//   under gravity (G 36 px/f^2); the level is the integral of the parcels that have LANDED, so the surface rises only
//   while a stream touches it. Left pour: valve f7.4, contact ~f12.2 (first ripple, slick and plume the same frame);
//   right: valve f15.3, contact ~f19.9. Plumes are tracers released at each landing point and carried by the jets'
//   vortex pairs; the paling (mu) runs while the plumes spread.
// Orange = INTELLIGENCE (the clip rule): only the orange liquid and its trickle glow. The murk, the iron pipes, the
// stone plinth and the clear glass are in the style's muted local colours. No text.
//
// DEPTH: the eye at screen row ~150 (looking slightly down into the beaker), dRef 3800 at kRef 1, dolly 0.35, fog by
//   depth (nothing is deep: the glass Z -236..236, the plinth -300..300). World units = f0 screen px (Y = sy - 1900).
//
// SOURCES: none (an illustrative lab beaker; no figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  AirBox,
  AirShadow,
  AirStage,
  MAT,
  ORANGE_LINE,
  WorldSvg,
  airWorldOf,
  c01,
  lerp,
  lineOf,
  makeCamera,
  mixHex,
  smoothstep,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Persp,
} from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 24000 / 1001;
export const DURATION = 101;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

// ===================================================================================================================
// THE WORLD (units = f0 screen px; X = sx - 540, Y = sy - 1900, Z depth behind the glass axis)
// ===================================================================================================================
export const SY = (sy: number) => sy - 1900;
export const R_OUT = 258;
export const R_IN = 248;
export const Y_RIM = SY(402);
export const Y_FLOOR = SY(990);
export const Y_BASE = SY(1013);
export const DEPTH: DepthOpts = { eyeY: SY(150), dRef: 3800, kRef: 1, dolly: 0.35 };
const PL = { cap: 304, capH: 34, capZ: 290, shaft: 244, shaftZ: 230 };

// colours (before fog; nothing here is deep)
const O_SURF = "#FFC03A";
const M_STREAM = "#73745E";
const M_STREAM_LIT = "#9A9B85";
const M_STREAM_LINE = "#47483A";
const M_LAYER = "#7A7A62";
const M_SURF = "#87876F";
const M_PLUME = "#6E6E58";
/** the end: the murk wins, a dull olive grey-khaki (pond water), only a faint warm trace low down */
const F = "#7B785F";
const F_WARM_LOW = "#867657";
const F_SURF = "#8A876F";
const GLASS_EDGE = "#2F4A45";

// ===================================================================================================================
// THE CAMERA: one slow push-in on the glass
// ===================================================================================================================
export const camAt = makeCamera(
  [
    { f: 0, k: 1.0, wx: 0, wy: SY(745), sy: 745 },
    { f: 50, k: 1.018, wx: 0, wy: SY(742), sy: 751 },
    { f: 100, k: 1.032, wx: 0, wy: SY(738), sy: 752 },
  ],
  false,
);
export const camOf = (f: number): Cam => swayCam(camAt(f), f);
const REST = camOf(0);

// ===================================================================================================================
// THE POUR: sources, parcels under gravity, the level as the integral of what has landed
// ===================================================================================================================
const G = 36;
const V0 = 10;
const dropOf = (a: number) => V0 * a + 0.5 * G * a * a;
const ageOfDrop = (d: number) => (-V0 + Math.sqrt(V0 * V0 + 2 * G * Math.max(0, d))) / G;
/** a falling jet narrows as it speeds up (continuity), softened so the stream keeps body */
const widthFac = (a: number) => Math.sqrt((V0 + 24) / (V0 + G * a + 24));
const ease = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};

export type PipeDef = { side: -1 | 1; Xn: number; Yp: number; tip: number; slide: [number, number]; D: number; open: number; slow: number; stop: number; drips: number[] };
export const PIPES: PipeDef[] = [
  { side: -1, Xn: -124, Yp: SY(318), tip: SY(376), slide: [-5, 7], D: 470, open: 7.4, slow: 33, stop: 82, drips: [88, 95.5] },
  { side: 1, Xn: 120, Yp: SY(336), tip: SY(378), slide: [2, 15], D: 540, open: 15.3, slow: 37, stop: 85, drips: [91] },
];
export const RP = 18;
const RB = 24;
const W_MURK = 28;
/** the pipe's slide in from its frame edge (world px; 0 = home) */
export const pipeDx = (p: PipeDef, t: number) => p.side * p.D * (1 - ease((t - p.slide[0]) / (p.slide[1] - p.slide[0])));
/** the flow 0..1 leaving the nozzle at time t: a fast valve, a steady pour, then a thinning to nothing */
export const pipeQ = (p: PipeDef, t: number) => {
  if (t <= p.open || t >= p.stop) return 0;
  const rise = ease((t - p.open) / 0.8);
  const fall = t < p.slow ? 1 : Math.pow(1 - (t - p.slow) / (p.stop - p.slow), 2);
  return rise * fall;
};
/** the orange trickle: from above the frame, already running at f0, cut off at the source f1.2-3.2 */
export const ORANGE = { X: 10, tip: SY(-300), W: 15 };
export const orangeQ = (t: number) => 1 - ease((t - 1.2) / 2);
const ORANGE_RATE = 2.3;
const VO0 = 150;
const MURK_TOTAL = 382;

const T0 = -24;
const DT = 0.05;
const NS = Math.round((106 - T0) / DT);
type Sim = { V: Float64Array; Vo: Float64Array; QL: Float64Array[]; qmax: number; contact: number[]; tailLand: number[]; orangeTail: number; dripLand: number[][] };
const SIM: Sim = (() => {
  // the murk rate per unit flow, so the whole pour adds MURK_TOTAL px of level
  let integ = 0;
  for (let i = 0; i <= NS; i++) for (const p of PIPES) integ += pipeQ(p, T0 + i * DT) * DT;
  const qmax = MURK_TOTAL / integ;
  const V = new Float64Array(NS + 1);
  const Vo = new Float64Array(NS + 1);
  const QL = PIPES.map(() => new Float64Array(NS + 1));
  const queues: { tau: number; vol: number; q: number }[][] = [[], [], []];
  const contact = PIPES.map(() => Infinity);
  const tailLand = PIPES.map(() => -Infinity);
  let orangeTail = -Infinity;
  let v = VO0;
  let vo = VO0;
  for (let i = 0; i <= NS; i++) {
    const t = T0 + i * DT;
    PIPES.forEach((p, s) => {
      const q = pipeQ(p, t);
      if (q > 0) queues[s].push({ tau: t, vol: qmax * q * DT, q });
    });
    const qo = orangeQ(t);
    if (qo > 0.001) queues[2].push({ tau: t, vol: ORANGE_RATE * qo * DT, q: qo });
    const ys = Y_FLOOR - v;
    PIPES.forEach((p, s) => {
      const Q = queues[s];
      while (Q.length && p.tip + dropOf(t - Q[0].tau) >= ys) {
        const c = Q.shift()!;
        v += c.vol;
        QL[s][i] += c.q;
        if (contact[s] === Infinity) contact[s] = t;
        tailLand[s] = t;
      }
    });
    const Qo = queues[2];
    while (Qo.length && ORANGE.tip + dropOf(t - Qo[0].tau) >= ys) {
      const c = Qo.shift()!;
      if (t >= 0) {
        v += c.vol;
        vo += c.vol;
      }
      orangeTail = t;
    }
    V[i] = v;
    Vo[i] = vo;
  }
  // the landing flow, smoothed over one frame (parcels land in a lumpy cadence while the level moves)
  const QLs = QL.map((a) => {
    const out = new Float64Array(a.length);
    const h = Math.round(0.5 / DT);
    for (let i = 0; i < a.length; i++) {
      let s = 0;
      let n = 0;
      for (let j = i - h; j <= i + h; j++) if (j >= 0 && j < a.length) {
        s += a[j];
        n++;
      }
      out[i] = s / n;
    }
    return out;
  });
  // drips: a bead swells on the nozzle for 3 frames, lets go at td and falls to the surface
  const dripLand = PIPES.map((p) =>
    p.drips.map((td) => {
      for (let t = td; t < 110; t += DT) {
        const i = Math.min(NS, Math.max(0, Math.round((t - T0) / DT)));
        if (p.tip + dropOf(t - td) >= Y_FLOOR - V[i]) return t;
      }
      return Infinity;
    }),
  );
  return { V, Vo, QL: QLs, qmax, contact, tailLand, orangeTail, dripLand };
})();
export { SIM };
const sampleArr = (a: Float64Array, t: number) => {
  const x = c01((t - T0) / (NS * DT)) * NS;
  const i = Math.min(NS - 1, Math.floor(x));
  return lerp(a[i], a[i + 1], x - i);
};
/** the surface's world Y (its row on the glass axis) */
export const levelY = (t: number) => Y_FLOOR - sampleArr(SIM.V, t);
/** the top of the orange layer (the interface's row on the axis) */
export const interfaceY = (t: number) => Y_FLOOR - sampleArr(SIM.Vo, t);
/** the normalised flow landing from pipe s now */
export const landQ = (s: number, t: number) => sampleArr(SIM.QL[s], t);

/** the dilution: how far the volume has gone to one murky colour (0 bright orange under murk .. 1 mixed) */
export const muAt = (t: number) => {
  const u = c01((t - 22) / (88 - 22));
  return 0.5 - 0.5 * Math.cos(Math.PI * Math.pow(u, 0.9));
};

// ===================================================================================================================
// GEOMETRY HELPERS
// ===================================================================================================================
const Pt = (v: [number, number]) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
type Ell = { cx: number; cy: number; rx: number; ry: number };
/** a horizontal circle of radius R at height Y around the glass axis, projected */
export const ellOf = (P: Persp, Y: number, R: number): Ell => {
  const f = P.p(0, Y, -R);
  const b = P.p(0, Y, R);
  const c = P.p(0, Y, 0);
  return { cx: c[0], cy: (f[1] + b[1]) / 2, rx: R * P.r(0), ry: Math.abs(f[1] - b[1]) / 2 };
};
const L = (e: Ell): [number, number] => [e.cx - e.rx, e.cy];
const Rt = (e: Ell): [number, number] => [e.cx + e.rx, e.cy];
const A0 = (e: Ell, sweep: 0 | 1, to: [number, number]) => `A${e.rx.toFixed(2)},${e.ry.toFixed(2)} 0 0 ${sweep} ${Pt(to)}`;
/** the front arc's row at x (screen-world x) */
const frontY = (e: Ell, x: number) => e.cy + e.ry * Math.sqrt(c01(1 - Math.pow((x - e.cx) / e.rx, 2)));
/** a cylinder silhouette between two rings (top ring fully, bottom ring's front arc) */
const silhouette = (top: Ell, bot: Ell) => `M${Pt(L(top))}L${Pt(L(bot))}${A0(bot, 0, Rt(bot))}L${Pt(Rt(top))}${A0(top, 0, L(top))}Z`;
/** the body below a ring's front arc down to the bottom ring's front arc */
const bodyBelow = (top: Ell, bot: Ell) => `M${Pt(L(top))}${A0(top, 0, Rt(top))}L${Pt(Rt(bot))}${A0(bot, 1, L(bot))}Z`;
const ellD = (e: Ell) => `M${Pt(L(e))}${A0(e, 0, Rt(e))}${A0(e, 0, L(e))}Z`;

// ===================================================================================================================
// THE MIXING: tracers in a flow of vortex pairs under each landing jet plus one slow stirring cell
// ===================================================================================================================
const VX = { sink: 5, d0: 20, dGrow: 85, dTau: 20, gam: 1500, gTau: 36, a0: 12, aGrow: 0.45, jet: 5, jetDecay: 60 };
type Pair = { s: number; tb: number; x: number; y0: number; dTot: number; q: number };
const PAIRS: Pair[] = (() => {
  const out: Pair[] = [];
  PIPES.forEach((p, s) => {
    for (let tb = SIM.contact[s] + 0.4; tb < p.stop; tb += 7) {
      const q = landQ(s, tb);
      if (q < 0.18) continue;
      const y0 = levelY(tb) + 14;
      const target = Math.min(Y_FLOOR - 60, interfaceY(tb) + 140);
      out.push({ s, tb, x: p.Xn, y0, dTot: Math.max(40, (target - y0) * Math.sqrt(q)), q });
    }
  });
  return out;
})();
const cellAmp = (t: number) => 1.0 * smoothstep(14, 46, t) * (1 - 0.5 * smoothstep(70, 100, t));
const CELL = { yT: SY(470), yB: Y_FLOOR - 4 };
/** the flow (world px per frame) at (x, y) and time t; buoy: an extra lift for the orange curls */
const flowAt = (x: number, y: number, t: number): [number, number] => {
  let u = 0;
  let v = 0;
  for (const pr of PAIRS) {
    const age = t - pr.tb;
    if (age < 0 || age > 70) continue;
    const yc = pr.y0 + pr.dTot * (1 - Math.exp((-age * VX.sink) / pr.dTot));
    const d = VX.d0 + VX.dGrow * (1 - Math.exp(-age / VX.dTau));
    const gam = VX.gam * pr.q * Math.exp(-age / VX.gTau) * smoothstep(0, 2, age);
    const a2 = Math.pow(VX.a0 + VX.aGrow * age, 2);
    for (const sg of [-1, 1]) {
      const dx = x - (pr.x + sg * d);
      const dy = y - yc;
      const r2 = dx * dx + dy * dy + 1e-3;
      const f = (1 - Math.exp(-r2 / a2)) / (2 * Math.PI * r2);
      const g = -sg * gam; // left (sg -1) +, right -: down between them
      u += -g * dy * f;
      v += g * dx * f;
    }
  }
  // the jets' own push below each landing point
  PIPES.forEach((p, s) => {
    const q = landQ(s, t);
    if (q <= 0.001) return;
    const ys = levelY(t);
    v += VX.jet * q * Math.exp(-Math.pow((x - p.Xn) / 13, 2)) * Math.exp(-Math.max(0, y - ys) / VX.jetDecay);
  });
  // one slow stirring cell (clockwise), the living hold
  const A = cellAmp(t);
  if (A > 0) {
    const xi = (x + R_IN) / (2 * R_IN);
    const eta = c01((y - CELL.yT) / (CELL.yB - CELL.yT));
    const H = CELL.yB - CELL.yT;
    u += A * Math.sin(Math.PI * xi) * Math.cos(Math.PI * eta);
    v += -A * (H / (2 * R_IN)) * Math.cos(Math.PI * xi) * Math.sin(Math.PI * eta);
  }
  return [u, v];
};

type Tracer = { t0: number; x0: number; y0: number; kind: 0 | 1; r0: number; line: number; pos: Float32Array };
const TR_DT = 0.25;
const TURB_AMP = 1.6;
const DOT_GROW = 0.9;
const TRACERS: Tracer[] = (() => {
  const list: Omit<Tracer, "pos">[] = [];
  let line = 0;
  PIPES.forEach((p, s) => {
    // the murk: two streaklines per jet, either side of its axis, released where the stream lands
    let n = 0;
    for (let t = SIM.contact[s] + 0.25; t < SIM.tailLand[s]; t += 0.5) {
      const q = landQ(s, t);
      if (q < 0.04) continue;
      const aLand = ageOfDrop(levelY(t) - p.tip);
      const w = W_MURK * Math.sqrt(q) * widthFac(aLand);
      list.push({ t0: t, x0: p.Xn + (random(`m${s}-${n++}`) - 0.5) * 0.7 * w, y0: levelY(t) + 3, kind: 0, r0: 0.5 * w + 2, line });
    }
    line++;
    // drips: a little puff each
    SIM.dripLand[s].forEach((tl) => {
      for (let k = 0; k < 6; k++) list.push({ t0: tl + k * 0.25, x0: p.Xn, y0: levelY(tl) + 3, kind: 0, r0: 3.5, line });
      line++;
    });
  });
  const out: Tracer[] = list.map((tr) => ({ ...tr, pos: new Float32Array(2 * (DURATION + 2)).fill(NaN) }));
  const xs = out.map((tr) => tr.x0);
  const ys = out.map((tr) => tr.y0);
  const born = out.map(() => false);
  const TURB = out.map((_, i) => [6.28 * random(`ta${i}`), 6.28 * random(`tb${i}`), 0.05 + 0.08 * random(`tc${i}`), 0.05 + 0.08 * random(`td${i}`)]);
  const clampTo = (i: number, t: number) => {
    const lim = R_IN - 9;
    xs[i] = Math.max(-lim, Math.min(lim, xs[i]));
    ys[i] = Math.max(levelY(t) + 4, Math.min(Y_FLOOR - 7, ys[i]));
  };
  const step = (i: number, t: number, h: number) => {
    const tr = out[i];
    const age = t - tr.t0;
    const lift = 0;
    // a smooth per-tracer eddy drift (the plume's turbulence), growing as it spreads, calming as the pour slows
    const ph = TURB[i];
    const ta = TURB_AMP * Math.min(1, age / 10) * (1 - 0.6 * smoothstep(60, 95, t));
    const tu = ta * Math.sin(ph[0] + t * ph[2]);
    const tv = 0.6 * ta * Math.sin(ph[1] + t * ph[3]);
    const [u1, v1] = flowAt(xs[i], ys[i], t);
    const xm = xs[i] + 0.5 * h * (u1 + tu);
    const ym = ys[i] + 0.5 * h * (v1 + lift + tv);
    const [u2, v2] = flowAt(xm, ym, t + 0.5 * h);
    xs[i] += h * (u2 + tu);
    ys[i] += h * (v2 + lift + tv);
    clampTo(i, t + h);
  };
  const tStart = Math.floor(Math.min(...out.map((tr) => tr.t0))) - 1;
  const perFrame = Math.round(1 / TR_DT);
  for (let n = 0; tStart + n * TR_DT <= DURATION + 1; n++) {
    const t = tStart + n * TR_DT;
    for (let i = 0; i < out.length; i++) {
      const tr = out[i];
      if (!born[i]) {
        if (tr.t0 > t + TR_DT) continue;
        born[i] = true;
        // first (partial) step from its own release time
        const h = t + TR_DT - tr.t0;
        if (h > 0) step(i, tr.t0, h);
        continue;
      }
      step(i, t, TR_DT);
    }
    // record at integer frames
    if ((n + 1) % perFrame === 0) {
      const fi = tStart + (n + 1) / perFrame;
      if (fi >= 0 && fi <= DURATION + 1)
        for (let i = 0; i < out.length; i++) if (born[i]) {
          out[i].pos[2 * fi] = xs[i];
          out[i].pos[2 * fi + 1] = ys[i];
        }
    }
  }
  return out;
})();
export { TRACERS };

// ===================================================================================================================
// THE STREAMS
// ===================================================================================================================
type StreamSpec = { X: number; tip: number; W: number; q: (t: number) => number; tStart: number; tEnd: number };
/** a stream's outline at frame t: parcels from release tau (nozzle) down to the surface or its falling head */
const streamPath = (sp: StreamSpec, t: number, ys: number, wob: number) => {
  const aSurf = ageOfDrop(ys - sp.tip);
  const tauLo = Math.max(sp.tStart, t - aSurf);
  const tauHi = Math.min(t, sp.tEnd);
  if (tauHi <= tauLo) return null;
  const N = 48;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  let maxW = 0;
  for (let i = 0; i <= N; i++) {
    const tau = lerp(tauHi, tauLo, i / N);
    const a = t - tau;
    const y = Math.min(ys, sp.tip + dropOf(a));
    const w = sp.W * Math.sqrt(sp.q(tau)) * widthFac(a);
    maxW = Math.max(maxW, w);
    const xo = wob * Math.sin(y * 0.045 + t * 0.9) * Math.min(1, a / 1.2);
    left.push([sp.X + xo - w / 2, y]);
    right.push([sp.X + xo + w / 2, y]);
  }
  if (maxW < 0.6) return null;
  const hitsSurface = t - tauLo >= aSurf - 1e-6;
  const body = `M${left.map(Pt).join("L")}L${right.reverse().map(Pt).join("L")}Z`;
  const headY = left[left.length - 1][1];
  const headW = right[0][0] - left[left.length - 1][0];
  return { body, hitsSurface, headY, headW, x: sp.X, left, right };
};

const murkSpec = (p: PipeDef): StreamSpec => ({ X: p.Xn, tip: p.tip, W: W_MURK, q: (tau) => pipeQ(p, tau), tStart: p.open, tEnd: p.stop });
const orangeSpec: StreamSpec = { X: ORANGE.X, tip: ORANGE.tip, W: ORANGE.W, q: orangeQ, tStart: -40, tEnd: 3.2 };

const Stream: React.FC<{ sp: StreamSpec; t: number; ys: number; fill: string; lit: string; line: string; uid: string; lw: number }> = ({ sp, t, ys, fill, lit, line, lw }) => {
  const s = streamPath(sp, t, ys, 0.9);
  if (!s) return null;
  // the sheen: a narrower band on the lit (left) side
  const sheen = `M${s.left.map((q, i) => Pt([q[0] + 0.18 * (s.right[s.right.length - 1 - i][0] - q[0]), q[1]])).join("L")}L${s.left
    .slice()
    .reverse()
    .map((q, i) => {
      const rr = s.right[i][0];
      return Pt([q[0] + 0.42 * (rr - q[0]), q[1]]);
    })
    .join("L")}Z`;
  return (
    <g>
      <path d={s.body} fill={fill} stroke={line} strokeWidth={lw} strokeOpacity={0.55} strokeLinejoin="round" />
      <path d={sheen} fill={lit} opacity={0.5} />
      {!s.hitsSurface && s.headW > 1 ? <ellipse cx={s.x} cy={s.headY} rx={s.headW * 0.55} ry={s.headW * 0.62} fill={fill} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE PIPES
// ===================================================================================================================
const pipeCenterline = (p: PipeDef) => {
  const s = p.side;
  const x0 = p.Xn + s * 1600;
  const xe = p.Xn + s * RB;
  const bend = `A${RB},${RB} 0 0 ${s === -1 ? 1 : 0} ${Pt([p.Xn, p.Yp + RB])}`;
  return `M${Pt([x0, p.Yp])}L${Pt([xe, p.Yp])}${bend}L${Pt([p.Xn, p.tip - 10])}`;
};
const IronPipe: React.FC<{ A: AirWorld; p: PipeDef; dx: number; uid: string; bead: number }> = ({ A, p, dx, uid, bead }) => {
  const m = MAT.iron;
  const h = -p.Yp;
  const t = (hex: string) => A.tone(hex, 0, h);
  const d = pipeCenterline(p);
  const ln = t(lineOf(m));
  const flanges = [p.Xn + p.side * (RB + 64), p.Xn + p.side * (RB + 330)];
  const Flange: React.FC<{ x: number; y: number; w: number; hh: number; vertical?: boolean }> = ({ x, y, w, hh }) => (
    <g>
      <rect x={x - w / 2} y={y - hh / 2} width={w} height={hh} rx={2.2} fill={t(m.mid)} stroke={ln} strokeWidth={1.3} />
      <rect x={x - w / 2 + 1.2} y={y - hh / 2 + 1.2} width={w * 0.34} height={hh - 2.4} rx={1.2} fill={t(m.lit)} opacity={0.75} />
      <rect x={x + w * 0.12} y={y - hh / 2 + 1.2} width={w * 0.36} height={hh - 2.4} rx={1.2} fill={t(m.dark)} opacity={0.6} />
      <path d={`M${(x - w / 2 + 1.5).toFixed(2)},${(y - hh / 2 + 1).toFixed(2)}L${(x + w / 2 - 1.5).toFixed(2)},${(y - hh / 2 + 1).toFixed(2)}`} stroke="#F3EBDD" strokeWidth={1.4} strokeOpacity={0.55} />
    </g>
  );
  return (
    <g transform={`translate(${dx.toFixed(2)},0)`}>
      <defs>
        <mask id={`${uid}-mk`} maskUnits="userSpaceOnUse" x={-2400} y={p.Yp - 200} width={4800} height={400}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={2 * RP} />
        </mask>
      </defs>
      <path d={d} fill="none" stroke={ln} strokeWidth={2 * RP + 2.6} />
      <path d={d} fill="none" stroke={t(m.mid)} strokeWidth={2 * RP} />
      <g mask={`url(#${uid}-mk)`}>
        <path d={d} transform={`translate(${(0.42 * RP).toFixed(2)},${(0.5 * RP).toFixed(2)})`} fill="none" stroke={t(mixHex(m.dark, "#22180F", 0.2))} strokeWidth={1.25 * RP} />
        <path d={d} transform={`translate(${(-0.3 * RP).toFixed(2)},${(-0.46 * RP).toFixed(2)})`} fill="none" stroke={t(m.lit)} strokeWidth={0.75 * RP} opacity={0.9} />
        <path d={d} transform={`translate(${(-0.62 * RP).toFixed(2)},${(-0.74 * RP).toFixed(2)})`} fill="none" stroke="#F3EBDD" strokeWidth={0.2 * RP} opacity={0.6} />
      </g>
      {flanges.map((x, i) => (
        <Flange key={i} x={x} y={p.Yp} w={12} hh={2 * RP + 10} />
      ))}
      {/* the nozzle's lip */}
      <Flange x={p.Xn} y={p.tip - 6} w={2 * RP + 8} hh={12} />
      {bead > 0.05 ? <ellipse cx={p.Xn} cy={p.tip + bead * 4.2} rx={4 + bead * 3} ry={bead * 7} fill={M_STREAM} stroke={M_STREAM_LINE} strokeWidth={0.9} strokeOpacity={0.5} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
type Ripple = { t0: number; X: number; amp: number };
const RIPPLES: Ripple[] = (() => {
  const out: Ripple[] = [];
  PIPES.forEach((p, s) => {
    for (let t = SIM.contact[s]; t <= SIM.tailLand[s]; t += 3) out.push({ t0: t, X: p.Xn, amp: Math.sqrt(c01(landQ(s, t) + 0.15)) });
    SIM.dripLand[s].forEach((tl) => out.push({ t0: tl, X: p.Xn, amp: 0.7 }));
  });
  for (let t = -18; t <= SIM.orangeTail; t += 3) out.push({ t0: t, X: ORANGE.X, amp: 0.55 });
  return out;
})();

const IntelligenceDiluted: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const cam = camOf(cf);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, fogBy: "depth" });
  const P = A.P;
  const t = frame;
  const mu = muAt(t);
  const ys = levelY(t);
  const yI = interfaceY(t);

  // rings
  const rimO = ellOf(P, Y_RIM, R_OUT);
  const rimI = ellOf(P, Y_RIM, R_IN);
  const baseO = ellOf(P, Y_BASE, R_OUT);
  const floorI = ellOf(P, Y_FLOOR, R_IN);
  const surf = ellOf(P, ys, R_IN);
  const intf = ellOf(P, yI, R_IN);

  // colours of the moment
  const upper = mixHex(M_LAYER, F, Math.pow(mu, 0.85));
  const lower = mixHex(ACCENT, F, mu);
  const lowerDeep = mixHex(ACCENT_DEEP, F_WARM_LOW, mu);
  const surfMurk = mixHex(M_SURF, F_SURF, Math.pow(mu, 0.85));
  const surfOrange = mixHex(O_SURF, F_SURF, mu);
  // the mixing beyond the plumes: from ~f34 the boundary melts and the orange dulls from the top down
  const mixG = smoothstep(34, 66, t);
  // the plumes: cloudy murk a shade off the murk layer (a touch of the orange they carry), never the darkest thing
  const plumeCol = mixHex(mixHex(M_LAYER, lower, 0.2), mixHex(F, M_PLUME, 0.18), mu);
  const plumeOp = lerp(0.72, 0.3, mu);
  const glowOp = 0.6 * (1 - mu) + 0.1;
  const glowCol = mixHex("#FFE39A", "#A99068", mu);
  const lw = A.lw(1.2);
  const glowY = Y_FLOOR - 70;

  // the interface's front edge (the orange layer's top seen through the front wall): the ring's front arc, dipped
  // under each landing jet and gently waving
  const iN = 44;
  const ipts: [number, number][] = [];
  for (let i = 0; i <= iN; i++) {
    const x = lerp(-R_IN - 4, R_IN + 4, i / iN);
    let y = frontY(intf, Math.max(-R_IN, Math.min(R_IN, x)));
    y += 4.5 * Math.sin(x / 31 + t * 0.19) * (0.4 + 0.6 * c01((t - 10) / 20));
    PIPES.forEach((p, s) => {
      // pushed down under the jet, heaved up in a lobe either side (the orange dragged up into the murk)
      const q = landQ(s, t);
      y += 30 * q * Math.exp(-Math.pow((x - p.Xn) / 40, 2));
      y -= 20 * q * (Math.exp(-Math.pow((x - p.Xn - 78) / 30, 2)) + Math.exp(-Math.pow((x - p.Xn + 78) / 30, 2)));
    });
    ipts.push([x, y]);
  }
  // the path runs well past the walls and floor so its blur only softens the boundary, never the sides
  const iL = ipts[0];
  const iR = ipts[ipts.length - 1];
  const lowerD = `M${Pt([-R_IN - 160, iL[1]])}L${ipts.map(Pt).join("L")}L${Pt([R_IN + 160, iR[1]])}L${R_IN + 160},${(Y_FLOOR + 220).toFixed(1)}L${-R_IN - 160},${(Y_FLOOR + 220).toFixed(1)}Z`;
  const ifBlur = 1.6 + 34 * mixG + 6 * mu;

  // slicks on the surface where each stream lands
  const slicks = PIPES.map((p, s) => ({ x: p.Xn, r: t >= SIM.contact[s] ? 12 + 40 * (t - SIM.contact[s]) : 0 }));

  // tracers at this frame
  const fi = Math.max(0, Math.min(DURATION, frame));
  // tongues: each tracer an ellipse stretched along its own motion, longer and thinner as it sinks
  const dots = (kind: 0 | 1) =>
    TRACERS.filter((tr) => tr.kind === kind && !Number.isNaN(tr.pos[2 * fi])).map((tr, i) => {
      const age = fi - tr.t0;
      const r = Math.min(46, tr.r0 + DOT_GROW * age);
      const x = tr.pos[2 * fi];
      const y = tr.pos[2 * fi + 1];
      const pf = Math.max(0, fi - 2);
      const hasPrev = !Number.isNaN(tr.pos[2 * pf]);
      const vx = hasPrev ? (x - tr.pos[2 * pf]) / 2 : 0;
      const vy = (hasPrev ? (y - tr.pos[2 * pf + 1]) / 2 : 0) + 0.35;
      const ang = (Math.atan2(vy, vx) * 180) / Math.PI;
      const along = r * Math.min(2.4, 0.85 + age / 22);
      const across = r * Math.max(0.32, 0.72 - age / 140);
      return <ellipse key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} rx={along.toFixed(2)} ry={across.toFixed(2)} transform={`rotate(${ang.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})`} />;
    });

  // ripples
  const ripples = RIPPLES.filter((r) => t - r.t0 >= 0 && t - r.t0 < 15).map((r, i) => {
    const age = t - r.t0;
    const rho = 8 + 7.5 * age;
    const a = r.amp * 0.5 * Math.pow(1 - age / 15, 1.5);
    return <ellipse key={i} cx={r.X} cy={surf.cy} rx={rho} ry={(rho * surf.ry) / surf.rx} fill="none" stroke="#F3EBDD" strokeWidth={1.6} strokeOpacity={a} />;
  });

  // drips falling
  const drips: React.ReactNode[] = [];
  const beads = PIPES.map(() => 0);
  PIPES.forEach((p, s) => {
    p.drips.forEach((td, j) => {
      if (t >= td - 3 && t < td) beads[s] = ease((t - (td - 3)) / 3);
      const tl = SIM.dripLand[s][j];
      if (t >= td && t < tl) {
        const y = p.tip + dropOf(t - td) + 4;
        const sp = Math.min(1, (t - td) / 0.6);
        drips.push(<ellipse key={`${s}-${j}`} cx={p.Xn} cy={y} rx={5} ry={7 + 3 * sp} fill={M_STREAM} stroke={M_STREAM_LINE} strokeWidth={0.9} strokeOpacity={0.5} />);
      }
    });
  });

  // the glass
  const glassSil = silhouette(rimO, baseO);
  const liquidSil = silhouette(surf, floorI);
  const bodyD = bodyBelow(surf, floorI);
  const tint = mixHex(A.airHex(0, -Y_RIM + 300), "#F3EBDD", 0.22);
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <defs>
          <clipPath id="id-liq">
            <path d={liquidSil} />
          </clipPath>
          <clipPath id="id-body">
            <path d={bodyD} />
          </clipPath>
          <clipPath id="id-surf">
            <path d={ellD(surf)} />
          </clipPath>
          <clipPath id="id-glass">
            <path d={glassSil} />
          </clipPath>
          <filter id="id-ifb" filterUnits="userSpaceOnUse" x={-400} y={SY(250)} width={800} height={1100}>
            <feGaussianBlur stdDeviation={ifBlur.toFixed(2)} />
          </filter>
          <filter id="id-goo" filterUnits="userSpaceOnUse" x={-400} y={SY(250)} width={800} height={1100} colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={(4.5 + 5 * mu).toFixed(2)} result="b" />
            <feColorMatrix in="b" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${lerp(3.4, 2.0, mu).toFixed(2)} ${lerp(-0.9, -0.35, mu).toFixed(2)}`} result="g" />
            <feGaussianBlur in="g" stdDeviation={4} />
          </filter>
          <filter id="id-soft" filterUnits="userSpaceOnUse" x={-400} y={SY(250)} width={800} height={1100}>
            <feGaussianBlur stdDeviation={7} />
          </filter>
          <linearGradient id="id-form" gradientUnits="userSpaceOnUse" x1={-R_IN} y1={0} x2={R_IN} y2={0}>
            <stop offset="0" stopColor="#2A1F12" stopOpacity={0.34} />
            <stop offset="0.13" stopColor="#2A1F12" stopOpacity={0} />
            <stop offset="0.3" stopColor="#FFF3D6" stopOpacity={0.13} />
            <stop offset="0.52" stopColor="#FFF3D6" stopOpacity={0} />
            <stop offset="0.84" stopColor="#2A1F12" stopOpacity={0.12} />
            <stop offset="1" stopColor="#2A1F12" stopOpacity={0.36} />
          </linearGradient>
          <mask id="id-plm" maskUnits="userSpaceOnUse" x={-400} y={SY(250)} width={800} height={1100}>
            <rect x={-400} y={SY(250)} width={800} height={1100} fill="#fff" opacity={lerp(0.32, 0.85, mu)} />
            <path d={lowerD} fill="#fff" filter="url(#id-ifb)" />
          </mask>
          <linearGradient id="id-lower" gradientUnits="userSpaceOnUse" x1={0} y1={yI} x2={0} y2={Y_FLOOR + 60}>
            <stop offset="0" stopColor={mixHex(lower, upper, 0.6 * mixG)} />
            <stop offset="0.5" stopColor={mixHex(lower, upper, 0.22 * mixG)} />
            <stop offset="1" stopColor={lowerDeep} />
          </linearGradient>
          <linearGradient id="id-upper" gradientUnits="userSpaceOnUse" x1={0} y1={ys} x2={0} y2={yI + 40}>
            <stop offset="0" stopColor={upper} />
            <stop offset="0.6" stopColor={mixHex(upper, lower, 0.12 * mixG)} />
            <stop offset="1" stopColor={mixHex(upper, lower, 0.4 * mixG)} />
          </linearGradient>
          <radialGradient id="id-glow">
            <stop offset="0" stopColor={glowCol} stopOpacity={glowOp} />
            <stop offset="0.6" stopColor={glowCol} stopOpacity={glowOp * 0.35} />
            <stop offset="1" stopColor={glowCol} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="id-veil" gradientUnits="userSpaceOnUse" x1={0} y1={SY(1150)} x2={0} y2={SY(1800)}>
            {[0, 0.25, 0.5, 0.75, 1].map((s) => (
              <stop key={s} offset={s} stopColor={A.screenAir(lerp(SY(1150), SY(1800), s))} stopOpacity={0.95 * Math.pow(s, 0.7)} />
            ))}
          </linearGradient>
        </defs>

        {/* the plinth, its foot sinking into the low air */}
        <AirBox A={A} X0={-PL.shaft} X1={PL.shaft} Y0={Y_BASE + PL.capH} Y1={SY(2300)} Z0={-PL.shaftZ} Z1={PL.shaftZ} mat={MAT.stone} uid="shaft" />
        <AirBox A={A} X0={-PL.cap} X1={PL.cap} Y0={Y_BASE} Y1={Y_BASE + PL.capH} Z0={-PL.capZ} Z1={PL.capZ} mat={MAT.stone} uid="cap" />
        <AirShadow A={A} X={0} Z={0} w={262} d={250} Y={Y_BASE} amt={0.85} uid="gsh" />
        <ellipse cx={baseO.cx} cy={baseO.cy + 8} rx={baseO.rx * 1.05} ry={baseO.ry * 1.1} fill={ACCENT} opacity={0.14 * (1 - mu)} filter="url(#id-soft)" />
        <rect x={-900} y={SY(1150)} width={1800} height={1000} fill="url(#id-veil)" />

        {/* the glass: its tint and the back of the rim */}
        <path d={glassSil} fill={tint} opacity={0.2} />
        <path d={`M${Pt(L(rimO))}${A0(rimO, 0, Rt(rimO))}`} fill="none" stroke="#F3EBDD" strokeWidth={lw * 1.4} strokeOpacity={0} />
        <path d={`M${Pt(Rt(rimI))}${A0(rimI, 0, L(rimI))}`} fill="none" stroke="#D9CDB4" strokeWidth={lw * 1.6} strokeOpacity={0.45} />
        <path d={`M${Pt(Rt(rimO))}${A0(rimO, 0, L(rimO))}`} fill="none" stroke="#F3EBDD" strokeWidth={lw * 2} strokeOpacity={0.6} />

        {/* the orange trickle (above the surface) */}
        <Stream sp={orangeSpec} t={t} ys={ys} fill={ACCENT} lit="#FFE7A3" line={ORANGE_LINE} uid="ostream" lw={lw} />

        {/* the liquid */}
        <g clipPath="url(#id-liq)">
          <rect x={-R_IN - 10} y={ys - 80} width={2 * R_IN + 20} height={Y_FLOOR - ys + 200} fill="url(#id-upper)" />
          <path d={lowerD} fill="url(#id-lower)" filter="url(#id-ifb)" />
          <g clipPath="url(#id-body)">
            <ellipse cx={0} cy={glowY} rx={lerp(200, 230, mu)} ry={140} fill="url(#id-glow)" />
            <g mask="url(#id-plm)">
              <g filter="url(#id-goo)" fill={plumeCol} opacity={plumeOp}>
                {dots(0)}
              </g>
            </g>
            <rect x={-R_IN - 10} y={ys - 80} width={2 * R_IN + 20} height={Y_FLOOR - ys + 200} fill="url(#id-form)" />
          </g>
          {/* the surface: orange until the slicks spread, then the murk, then one murky colour */}
          <path d={ellD(surf)} fill={mixHex(surfOrange, surfMurk, c01((yI - ys) / 30))} />
          <g clipPath="url(#id-surf)">
            {slicks.map((sl, i) => (sl.r > 0 ? <ellipse key={i} cx={sl.x} cy={surf.cy} rx={sl.r} ry={(sl.r * surf.ry) / surf.rx} fill={surfMurk} filter="url(#id-ifb)" /> : null))}
            <ellipse cx={surf.cx - 0.3 * surf.rx} cy={surf.cy - 0.35 * surf.ry} rx={surf.rx * 0.45} ry={surf.ry * 0.32} fill="#F3EBDD" opacity={0.1} filter="url(#id-soft)" />
            {ripples}
          </g>
          <path d={`M${Pt(L(surf))}${A0(surf, 0, Rt(surf))}`} fill="none" stroke="#F3EBDD" strokeWidth={lw * 1.6} strokeOpacity={0.45} />
        </g>

        {/* the murk streams and drips */}
        {PIPES.map((p, s) => (
          <Stream key={s} sp={murkSpec(p)} t={t} ys={ys} fill={M_STREAM} lit={M_STREAM_LIT} line={M_STREAM_LINE} uid={`m${s}`} lw={lw} />
        ))}
        {drips}

        {/* the glass in front: base slab, walls, highlights, the front of the rim */}
        <path d={`M${Pt(L(floorI))}${A0(floorI, 0, Rt(floorI))}L${Pt(Rt(baseO))}${A0(baseO, 1, L(baseO))}Z`} fill={mixHex(tint, "#F3EBDD", 0.25)} opacity={0.42} />
        <path d={`M${Pt(L(baseO))}${A0(baseO, 0, Rt(baseO))}`} fill="none" stroke="#F3EBDD" strokeWidth={lw * 1.6} strokeOpacity={0.4} />
        <g clipPath="url(#id-glass)">
          <rect x={-0.68 * R_OUT} y={Y_RIM} width={0.12 * R_OUT} height={Y_BASE - Y_RIM + 60} fill="#F3EBDD" opacity={0.16} filter="url(#id-soft)" />
          <path d={`M${(-0.79 * R_OUT).toFixed(2)},${(Y_RIM + 30).toFixed(2)}L${(-0.79 * R_OUT).toFixed(2)},${(Y_BASE - 20).toFixed(2)}`} stroke="#F3EBDD" strokeWidth={3.2} strokeOpacity={0.42} strokeLinecap="round" />
          <path d={`M${(0.84 * R_OUT).toFixed(2)},${(Y_RIM + 50).toFixed(2)}L${(0.84 * R_OUT).toFixed(2)},${(Y_BASE - 40).toFixed(2)}`} stroke="#F3EBDD" strokeWidth={5} strokeOpacity={0.14} strokeLinecap="round" />
        </g>
        {[-1, 1].map((sg) => (
          <g key={sg}>
            <path d={`M${(sg * rimO.rx).toFixed(2)},${rimO.cy.toFixed(2)}L${(sg * baseO.rx).toFixed(2)},${baseO.cy.toFixed(2)}`} stroke={GLASS_EDGE} strokeWidth={lw * 2.2} strokeOpacity={0.5} />
            <path d={`M${(sg * rimI.rx).toFixed(2)},${rimI.cy.toFixed(2)}L${(sg * floorI.rx).toFixed(2)},${floorI.cy.toFixed(2)}`} stroke={GLASS_EDGE} strokeWidth={lw * 1.2} strokeOpacity={0.28} />
          </g>
        ))}
        <path d={`M${Pt(L(rimI))}${A0(rimI, 0, Rt(rimI))}`} fill="none" stroke="#D9CDB4" strokeWidth={lw * 1.6} strokeOpacity={0.55} />
        <path d={`M${Pt(L(rimO))}${A0(rimO, 0, Rt(rimO))}`} fill="none" stroke="#F3EBDD" strokeWidth={lw * 2.4} strokeOpacity={0.85} />

        {/* the pipes */}
        {PIPES.map((p, s) => (
          <IronPipe key={s} A={A} p={p} dx={pipeDx(p, t)} uid={`pipe${s}`} bead={beads[s]} />
        ))}
      </WorldSvg>
    </AirStage>
  );
};

export default IntelligenceDiluted;
