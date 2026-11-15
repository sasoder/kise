// ---------------------------------------------------------------------------
// tenThousandAgentsPlan: the pure geometry of TenThousandAgents (rsi-since-writing): the field, the doubling and the
// camera. No React, so a sheet script can import it. Units: the cast's (a Genius 312 = 1.75 m, U = 178 per metre);
// X across (0 = the hero's column), Z depth behind the front row (0), floor Y = 0, up -Y.
//
// THE FIELD: 100 columns x 100 rows = 10,000 Geniuses, SX = 180 apart across (1 m: a third of a figure's
// width clear between neighbours), SZ = 240 deep (1.35 m). The hero stands in the front row at column 50 (cols 0..49 to his left on screen, 51..99 to his right).
//
// THE DOUBLING (copies, never fading or scaling in): the field grows by SPLITS. In a split every agent of a side
// (or of the field, in depth) splits in two: its copy starts exactly behind it (same place, EPS deeper, so it hides
// it) and comes out one cell outward (across) or one row back (in depth) while the ranks spread to make room (column
// k -> 2k -+ 1, row r -> 2r), so the whole field stretches outward and backward at once and its density stays the
// same. The hero, his two live copies and the front row never move. Motions add up (each agent's position is its
// birth place plus every later split's eased step), so splits overlap smoothly; nothing passes through anything.
// Generation 1 is the hero's two copies side-stepping out to his left and right as live figures (sidePose, planted
// feet, clear of him by ~f12); the rest are crowd sprites. Then seven beats, each landing before the next starts:
// columns per side 1 -> 2 -> 4 -> 8 -> 16 -> 32 -> 50 / 49 (the last split: only the outer ones) together with rows
// 1 -> 2 -> 4 -> 8 -> 16 -> 32 -> 64, then rows 64 -> 100: 1, 3, 10, 36, 136, 528, 2080, 6400, 10000.
//
// THE CAMERA: one pinhole (focal F, no pitch: verticals stay vertical, one VP on the horizon) at (cx, -h, -d) looking
// down +Z; the front row's feet sit at screen y = ty (a lens shift). ONE dolly straight back and up from the hero
// (1.4 m eye, 3.1 m off) to a low crowd view (3.6 m eye, 6.9 m off: front row ~255 px, horizon y ~520): log d, h / d, ty and cx each on a
// bell-shaped speed profile (one acceleration lobe, one long settle lobe still creeping at the cut).
// ---------------------------------------------------------------------------
import { GENIUS_POSES as G, GENIUS_WALK_CYCLE, lerpPose, type GeniusPose } from "../rsi-ten-earths/tenEarthsGenius";

export const DURATION = 88;
export const COLS = 100;
export const ROWS = 100;
export const HERO_COL = 50;
export const SX = 180;
export const SZ = 240;
export const N = COLS * ROWS;
export const colX = (c: number) => (c - HERO_COL) * SX;
export const rowZ = (r: number) => r * SZ;
/** the field's middle across (between cols 49 and 50 the hero stands right of it by half a spacing) */
export const FIELD_CX = (colX(0) + colX(COLS - 1)) / 2;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** ease in-out (the copies slide out and settle) */
export const easeIO = (u: number) => {
  const t = c01(u);
  return t * t * t * (t * (6 * t - 15) + 10);
};

// ---- the camera -----------------------------------------------------------------------------------------------------
export const F = 1000;
/** a bell-shaped progress 0..1 over f0..f1: the integral of t^a (1-t)^b, normalised (tollWorld's) */
const bell = (f0: number, f1: number, a: number, b: number) => {
  const M = 400;
  const cum = new Float64Array(M + 1);
  for (let i = 1; i <= M; i++) {
    const t = (i - 0.5) / M;
    cum[i] = cum[i - 1] + Math.pow(t, a) * Math.pow(1 - t, b);
  }
  const tot = cum[M];
  return (f: number) => {
    const t = c01((f - f0) / (f1 - f0)) * M;
    const i = Math.min(M - 1, Math.floor(t));
    return (cum[i] + (cum[i + 1] - cum[i]) * (t - i)) / tot;
  };
};
/** f0: the hero ~560 px tall (scale F / d0 = 1.795), his eyes at y ~560, the eye a little under his head top */
export const CAM_KEYS = {
  d: [557, 1224],
  hOverD: [250 / 557, 650 / 1224],
  ty: [969, 1050],
  cx: [0, 0],
};
const pD = bell(-2, 92, 2.4, 3.6);
const pH = bell(4, 90, 2.4, 2.4);
const pT = bell(0, 90, 2, 2);
const pX = bell(20, 100, 2, 2.4);
export type Cam3 = { cx: number; h: number; d: number; hy: number; ty: number };
export const cam3At = (f: number): Cam3 => {
  const d = Math.exp(mix(Math.log(CAM_KEYS.d[0]), Math.log(CAM_KEYS.d[1]), pD(f)));
  const h = d * mix(CAM_KEYS.hOverD[0], CAM_KEYS.hOverD[1], pH(f));
  const ty = mix(CAM_KEYS.ty[0], CAM_KEYS.ty[1], pT(f));
  return { cx: mix(CAM_KEYS.cx[0], CAM_KEYS.cx[1], pX(f)), h, d, ty, hy: ty - (h * F) / d };
};
/** a world point on screen: x, y and px per unit */
export const project = (c: Cam3, X: number, Y: number, Z: number) => {
  const dd = Z + c.d;
  const s = F / Math.max(1, dd);
  return { x: 540 + (X - c.cx) * s, y: c.hy + (Y + c.h) * s, s };
};

// ---- the live copies (generation 1) -----------------------------------------------------------------------------------
/** the hero's two copies side-step out from f3 (u 0..1 over LIVE_FRAMES: three long side steps to u 0.8, then they
 *  close up facing us); they start EPS_LIVE behind him and stand clear of him (a third of a figure's width between)
 *  from ~f13 */
export const LIVE_T0 = 3;
export const LIVE_FRAMES = 14;
/** the live copies stand still, facing us, by this frame: their own copies wait for it */
export const LIVE_READY = 17;
export const EPS_LIVE = 60;
export const liveT = (f: number) => c01((f - LIVE_T0) / LIVE_FRAMES);
const sst = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** the side step: the Genius walk (planted feet) over three steps with a long stride (SIDE_AMT x the walk's), its foot
 *  raise, toe lift, arm swing and bob kept at the walk's own size; then the feet close up and he faces us */
const SIDE_STEPS_PHASE = 1.5;
let SIDE_AMT = 2;
const sideCurve = (u: number) => {
  const w = c01(u / 0.8);
  return { phase: 0.05 + SIDE_STEPS_PHASE * w, amt: sst(0, 0.22, w) * (1 - sst(0.72, 1, w)) };
};
export const sidePose = (dir: 1 | -1, u: number, frame = 0, seed = 0): GeniusPose => {
  const { phase, amt } = sideCurve(u);
  const wf = phase * GENIUS_WALK_CYCLE;
  const tame = G.walk(dir, wf, amt) as GeniusPose;
  const long = G.walk(dir, wf, amt * SIDE_AMT) as GeniusPose;
  const w: GeniusPose = { ...tame, footL: [long.footL[0], tame.footL[1]], footR: [long.footR[0], tame.footR[1]] };
  const q = lerpPose(w, G.front(frame, seed), sst(0.72, 1, u)) as GeniusPose;
  // the trailing foot lifts while it closes up (the lead foot stays planted)
  const lift = 12 * Math.sin(Math.PI * sst(0.74, 0.98, u));
  const trail = dir === 1 ? "footL" : "footR";
  return { ...q, [trail]: [q[trail][0], q[trail][1] - lift] };
};
/** units to move the figure's `at` at u so the supporting foot stays put (signed: includes dir); tabulated */
const SIDE_N = 240;
const sideTable = (dir: 1 | -1) => {
  const out = new Float64Array(SIDE_N + 1);
  const footsX = (u: number) => {
    const q = sidePose(dir, u);
    return [q.footL[0], q.footR[0]];
  };
  let prev = footsX(0);
  for (let i = 1; i <= SIDE_N; i++) {
    const a = (i - 1) / SIDE_N;
    const b = i / SIDE_N;
    const cur = footsX(b);
    // the support: the stance foot of the walk (L while frac(phase) < 0.5); in the close-up, the lead foot
    const ph = sideCurve(a).phase;
    const leadIsL = dir === -1;
    const useL = a < 0.8 ? ph % 1 < 0.5 : leadIsL;
    const lB = sideCurve(b).phase % 1 < 0.5;
    const switching = a < 0.8 && b < 0.8 && useL !== lB;
    out[i] = out[i - 1] - (switching ? 0 : useL ? cur[0] - prev[0] : cur[1] - prev[1]);
    prev = cur;
  }
  return out;
};
// solve the stride so the three steps carry him exactly one cell (SX) over
{
  let lo = 1;
  let hi = 4;
  for (let k = 0; k < 30; k++) {
    SIDE_AMT = (lo + hi) / 2;
    const T = sideTable(1);
    if (T[SIDE_N] < SX) lo = SIDE_AMT;
    else hi = SIDE_AMT;
  }
}
export const SIDE_STRIDE = SIDE_AMT;
const SIDE_T: Record<1 | -1, Float64Array> = { 1: sideTable(1), [-1]: sideTable(-1) } as Record<1 | -1, Float64Array>;
export const sideShift = (dir: 1 | -1, u: number) => {
  const x = c01(u) * SIDE_N;
  const i = Math.min(SIDE_N - 1, Math.floor(x));
  const T = SIDE_T[dir];
  return T[i] + (T[i + 1] - T[i]) * (x - i);
};
/** the live copy's feet (world X, Z) at frame f: the planted-foot shift (sign by dir), the few units left to its cell
 *  eased in while the feet close up, and a step forward from behind him once he is past the hero's shoulder */
export const livePos = (dir: 1 | -1, f: number): { X: number; Z: number } => {
  const u = liveT(f);
  const sh = dir * Math.abs(sideShift(dir, u));
  const endSh = dir * Math.abs(sideShift(dir, 1));
  const X = sh + (dir * SX - endSh) * easeIO((u - 0.72) / 0.28);
  const Z = EPS_LIVE * (1 - easeIO((Math.abs(sh) - 0.55 * SX) / (0.4 * SX)));
  return { X, Z };
};

// ---- the doubling ----------------------------------------------------------------------------------------------------
/** the splits after the live one: L = across (each side to `neg` / `pos` columns), D = in depth (to `rows` rows);
 *  T0 = the frame the copies start out from behind, dur = the split's frames */
export type Gen = { kind: "L" | "D"; to: number; to2?: number; T0: number; dur: number };
export const GENS: Gen[] = [
  // seven beats, each landing (copies one clear cell out) before the next starts; across and back split together
  // (across first: from the low eye a copy straight behind hides, one beside reads)
  { kind: "L", to: 2, to2: 2, T0: 17, dur: 5 },
  { kind: "D", to: 2, T0: 17, dur: 5 },
  { kind: "L", to: 4, to2: 4, T0: 22, dur: 5 },
  { kind: "D", to: 4, T0: 22, dur: 5 },
  { kind: "L", to: 8, to2: 8, T0: 27, dur: 5 },
  { kind: "D", to: 8, T0: 27, dur: 5 },
  { kind: "L", to: 16, to2: 16, T0: 32, dur: 4 },
  { kind: "D", to: 16, T0: 32, dur: 4 },
  { kind: "L", to: 32, to2: 32, T0: 36, dur: 4 },
  { kind: "D", to: 32, T0: 36, dur: 4 },
  { kind: "L", to: 50, to2: 49, T0: 40, dur: 4 },
  { kind: "D", to: 64, T0: 40, dur: 4 },
  { kind: "D", to: 100, T0: 44, dur: 5 },
];
export const EPS = 2;
/** one eased step of an agent's position (cells; across or back) */
export type Step = { T0: number; dur: number; d: number };
export type Agent = {
  /** final cell: k = column - HERO_COL, r = row */
  k: number;
  r: number;
  /** the agent it split from (-1: the hero) */
  src: number;
  /** its birth split: T0 / dur (its EPS lasts while that runs) and the axis it came out along */
  T0: number;
  dur: number;
  axis: "x" | "z";
  /** where it is born (cells: k0, r0) and every later eased step */
  k0: number;
  r0: number;
  sx: Step[];
  sz: Step[];
  /** 0 the hero, 1 / 2 the live copies (dir -1 / +1), 3 crowd */
  kind: 0 | 1 | 2 | 3;
  gen: number;
};
const kAt = (a: Agent) => a.sx.reduce((v, st) => v + st.d, a.k0);
const rAt = (a: Agent) => a.sz.reduce((v, st) => v + st.d, a.r0);
export const AGENTS: Agent[] = (() => {
  const out: Agent[] = [];
  const mk = (o: Partial<Agent> & Pick<Agent, "k0" | "r0" | "src" | "T0" | "dur" | "axis" | "kind" | "gen">): Agent => ({ k: 0, r: 0, sx: [], sz: [], ...o });
  out.push(mk({ k0: 0, r0: 0, src: -1, T0: -1e9, dur: 1, axis: "x", kind: 0, gen: 0 }));
  out.push(mk({ k0: -1, r0: 0, src: 0, T0: LIVE_T0, dur: LIVE_FRAMES, axis: "x", kind: 1, gen: 1 }));
  out.push(mk({ k0: 1, r0: 0, src: 0, T0: LIVE_T0, dur: LIVE_FRAMES, axis: "x", kind: 2, gen: 1 }));
  let neg = 1;
  let pos = 1;
  let rows = 1;
  GENS.forEach((g, gi) => {
    const cur = out.slice();
    const born = (src: number) => {
      const s = out[src];
      return Math.max(g.T0, s.kind === 1 || s.kind === 2 ? LIVE_READY : s.T0);
    };
    if (g.kind === "L") {
      // each side: walking out from the hero, an agent at old index i (1-based) moves to its new index; the outer
      // `splits` agents split (the agent first, its copy one cell farther out)
      const sides: [number, number, -1 | 1][] = [
        [neg, g.to, -1],
        [pos, g.to2 ?? g.to, 1],
      ];
      for (const [p, q, sgn] of sides) {
        const splits = q - p;
        if (splits < 0 || splits > p) throw new Error("bad split");
        const newIdx: number[] = [];
        let next = 1;
        for (let i = 1; i <= p; i++) {
          newIdx[i] = next;
          next += i > p - splits ? 2 : 1;
        }
        cur.forEach((a, ai) => {
          const k = kAt(a);
          if (Math.sign(k) !== sgn) return;
          const i = Math.abs(k);
          const d = sgn * (newIdx[i] - i);
          const T0 = Math.max(g.T0, a.T0);
          if (d !== 0) a.sx.push({ T0, dur: g.dur, d });
          if (i > p - splits) {
            const t0 = born(ai);
            // the copy: born on its source (its source's steps so far), then one cell farther out than the source
            out.push(mk({ k0: a.k0, r0: a.r0, sx: [...a.sx.slice(0, d !== 0 ? -1 : undefined), { T0: t0, dur: g.dur, d: d + sgn }], sz: [...a.sz], src: ai, T0: t0, dur: g.dur, axis: "x", kind: 3, gen: gi + 2 }));
          }
        });
      }
      neg = g.to;
      pos = g.to2 ?? g.to;
    } else {
      const p = rows;
      const q = g.to;
      const splits = q - p;
      if (splits < 0 || splits > p) throw new Error("bad split");
      const newIdx: number[] = [];
      let next = 0;
      for (let r = 0; r < p; r++) {
        newIdx[r] = next;
        next += r >= p - splits ? 2 : 1;
      }
      cur.forEach((a, ai) => {
        const r = rAt(a);
        const d = newIdx[r] - r;
        const T0 = Math.max(g.T0, a.T0);
        if (d !== 0) a.sz.push({ T0, dur: g.dur, d });
        if (r >= p - splits) {
          const t0 = born(ai);
          out.push(mk({ k0: a.k0, r0: a.r0, sx: [...a.sx], sz: [...a.sz.slice(0, d !== 0 ? -1 : undefined), { T0: t0, dur: g.dur, d: d + 1 }], src: ai, T0: t0, dur: g.dur, axis: "z", kind: 3, gen: gi + 2 }));
        }
      });
      rows = q;
    }
  });
  for (const a of out) {
    a.k = kAt(a);
    a.r = rAt(a);
  }
  const seen = new Set(out.map((a) => a.k * 1000 + a.r));
  if (out.length !== N || seen.size !== N || neg !== HERO_COL || pos !== COLS - 1 - HERO_COL || rows !== ROWS) throw new Error(`field ${out.length} ${seen.size} ${neg} ${pos} ${rows}`);
  return out;
})();
/** the frame the whole field stands complete */
export const SETTLED = AGENTS.reduce((m, a) => Math.max(m, ...a.sx.map((st) => st.T0 + st.dur), ...a.sz.map((st) => st.T0 + st.dur)), 0);

/** every agent's feet (X, Z) at frame f (Z with the EPS that keeps a copy behind its source while it slides), how far
 *  along its own slide it is (1 = settled; 0 also before birth) and whether it exists yet */
export type Field = { X: Float64Array; Z: Float64Array; e: Float64Array; born: Uint8Array };
const stepsAt = (steps: Step[], f: number) => {
  let v = 0;
  for (const st of steps) v += st.d * easeIO((f - st.T0) / st.dur);
  return v;
};
export const fieldAt = (f: number, out?: Field): Field => {
  const o = out ?? { X: new Float64Array(N), Z: new Float64Array(N), e: new Float64Array(N), born: new Uint8Array(N) };
  const L = livePos(-1, f);
  const R = livePos(1, f);
  for (let i = 0; i < AGENTS.length; i++) {
    const a = AGENTS[i];
    if (a.kind === 1 || a.kind === 2) {
      const p = a.kind === 1 ? L : R;
      o.X[i] = p.X;
      o.Z[i] = p.Z;
      o.e[i] = liveT(f);
      o.born[i] = f >= a.T0 ? 1 : 0;
      continue;
    }
    const e = a.kind === 0 ? 1 : c01((f - a.T0) / a.dur);
    o.X[i] = (a.k0 + stepsAt(a.sx, f)) * SX;
    o.Z[i] = (a.r0 + stepsAt(a.sz, f)) * SZ + (e < 1 ? EPS : 0);
    o.e[i] = e;
    o.born[i] = a.kind === 0 || (f >= a.T0 && o.born[a.src]) ? 1 : 0;
  }
  return o;
};

/** the plate "10,000": numerals ~95 px tall in the air above the horizon (y ~420 at rest), a few rows into the field,
 *  rising in on the word (f43) */
export const PLATE = { X: 0, Y: -1167, Z: 4000, size: 580, f0: 43, dur: 10 };
