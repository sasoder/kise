// ---------------------------------------------------------------------------
// cordyceps: the zombie fungus of the Kyle Harper pandemics clip (kyle-pandemics), shared by cut 58 (ZombieAnt,
// which writes it) and cut 74 (the human zombie, which imports it). Dwarkesh map style, the clip's orange rule:
// orange = THE DISEASE, so the fungus is the only orange in either cut. Engraved manner: a solid orange body, one
// light from the upper left (the lit side a paler orange with a lit stripe, the side turned away ACCENT_DEEP with
// short dark hatching across it), a firm DARK casing. The real thing: Ophiocordyceps unilateralis, whose stroma (the
// stalk) grows out of the dorsal neck of a dead carpenter ant, long and thin, with a swollen lateral fruiting body
// (the ascoma, pitted with perithecia) partway up (Hughes et al. 2011, BMC Ecology 11:13; Andersen et al. 2009,
// Am. Nat. 174:424).
//
// UNITS. Everything draws in the caller's WORLD px (inside a WorldSvg). Stalk lengths and widths are "stalk units";
// `scale` = world px per stalk unit (pass the depth ratio r(Z) of where the base stands, times any size factor).
// Angles in degrees, screen convention: 0 = straight up, + = clockwise (90 = pointing right, -90 = left).
//
// <CordycepsStalk uid base angle bend wave length width tipWidth grow ripen bodyAt bodyLen bodyWidth bodySide
//                 scale frame sway swayRate swayPhase seed shadow lit />
//   base      [x, y] world: where the stalk leaves the host (the anchor; the stalk grows away from it)
//   angle     direction it leaves at (deg, 0 = up)                                   default -20
//   bend      total turn from base to full length (deg, + clockwise), even curvature  default 40
//   wave      a gentle S along the length (deg amplitude)                             default 6
//   length    full length (stalk units)                                               default 600
//   width     half-width at the base (stalk units)                                    default 15
//   tipWidth  half-width just under the tip, as a fraction of `width`                 default 0.5
//   grow      0..1, how far the TIP has got (the shape of the drawn part never changes as it grows: the
//             growth is drawn by the moving tip, never a scale-in)                    default 1
//   ripen     0..1, how swollen the fruiting body is; default: it swells as the tip passes through it and is
//             full once the tip is ~1.4 body-lengths past it
//   bodyAt    centre of the fruiting body along the length (0..1)                     default 0.62
//   bodyLen   its length as a fraction of `length`                                    default 0.2
//   bodyWidth its extra half-width at full ripeness (stalk units)                     default 22
//   bodySide  the side it bulges to, relative to the growth direction (-1 left, 1 right) default -1
//   frame / sway / swayRate / swayPhase: the living sway, a rotation that grows toward the tip
//             (sway = tip amplitude in deg, default 1.4; swayRate rad/frame, default 0.07)
//   seed      varies the wave and the texture                                         default 1
//   shadow    0..1, the dark occlusion where it leaves the host (the split it pushes out of)  default 1;
//             it opens with the tip (full once the stalk is ~2.5 base widths long), never fades in
//   casing    multiplier on the DARK casing width (default 1 = 1.5 * scale px)                 (r1 addition)
//   lit       [lx, ly] direction TOWARD the light (screen)                             default the upper left
//
// stalkFrame(spec, u)  -> { p, t, n, w } the centre point, unit tangent, left normal and half-width at u (0..1 of
//                      the FULL length; for hanging things on it or framing a camera on the tip)
// stalkTip(spec, grow) -> the world point of the drawn tip
//
// <MyceliumThreads uid path t seed width spread every branchLen opacity scale />
//   fine branching orange threads that creep along `path` (world polyline) as t goes 0 -> 1: a wandering main thread
//   drawn by its tip, side branches (each with a fork) sprouting behind the tip as it passes and lengthening with age.
//   width (world px, default 1.6) · spread (world px of wander, default 5) · every (world px between branches,
//   default 26) · branchLen (world px, default 30) · opacity (default 1) · scale multiplies all of them.
//   A thin dark under-stroke keeps them legible on cream.
//
// Probe: CordycepsProbe in ZombieAnt's Root (src/Root.ZombieAnt.tsx; cordycepsProbe.tsx).
// ---------------------------------------------------------------------------
import React from "react";

export type P2 = [number, number];

/** the fungus inks (orange = the disease) */
export const FUNGUS = {
  main: "#FFB000", // ACCENT
  deep: "#D98A0C", // ACCENT_DEEP: the side turned away from the light
  lit: "#FFCF5C", // the lit stripe
  tip: "#FFC23A", // the growing tip, a hair paler
  hatch: "#6E3F08", // the engraving across the shade
  pore: "#7A470A", // perithecia
  core: "#B56A06", // r1: the core shadow on the side turned away
  hi: "#FFE6A6", // r1: the highlight line on the lit side
  line: "#17120D", // DARK casing
};

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const hsh = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const f2 = (v: number) => v.toFixed(2);
const pt = (p: P2) => `${f2(p[0])},${f2(p[1])}`;

export type StalkSpec = {
  base: P2;
  angle?: number;
  bend?: number;
  wave?: number;
  length?: number;
  width?: number;
  tipWidth?: number;
  bodyAt?: number;
  bodyLen?: number;
  bodyWidth?: number;
  bodySide?: 1 | -1;
  scale?: number;
  frame?: number;
  sway?: number;
  swayRate?: number;
  swayPhase?: number;
  seed?: number;
};
type Full = Required<StalkSpec>;
const withDefaults = (s: StalkSpec): Full => ({
  base: s.base,
  angle: s.angle ?? -20,
  bend: s.bend ?? 40,
  wave: s.wave ?? 6,
  length: s.length ?? 600,
  width: s.width ?? 15,
  tipWidth: s.tipWidth ?? 0.5,
  bodyAt: s.bodyAt ?? 0.62,
  bodyLen: s.bodyLen ?? 0.2,
  bodyWidth: s.bodyWidth ?? 22,
  bodySide: s.bodySide ?? -1,
  scale: s.scale ?? 1,
  frame: s.frame ?? 0,
  sway: s.sway ?? 1.4,
  swayRate: s.swayRate ?? 0.07,
  swayPhase: s.swayPhase ?? 0,
  seed: s.seed ?? 1,
});

const N = 120;
type Sample = { p: P2; t: P2; n: P2; u: number };
/** the full-length centreline (N + 1 samples), world px */
const centreline = (q: Full): Sample[] => {
  const ds = (q.length * q.scale) / N;
  const sw = q.sway * Math.sin(q.frame * q.swayRate + q.swayPhase);
  const out: Sample[] = [];
  let p: P2 = [q.base[0], q.base[1]];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const deg = q.angle + q.bend * u + q.wave * Math.sin(Math.PI * 2 * (0.85 * u) + q.seed * 1.7) * Math.min(1, u * 4) + sw * Math.pow(u, 1.5);
    const a = (deg * Math.PI) / 180;
    const t: P2 = [Math.sin(a), -Math.cos(a)];
    const n: P2 = [t[1], -t[0]]; // the left normal (left of the growth direction)
    out.push({ p: [p[0], p[1]], t, n, u });
    p = [p[0] + t[0] * ds, p[1] + t[1] * ds];
  }
  return out;
};
/** the half-width (stalk units) of the bare stalk at u: a flared foot, then a slow taper */
const stalkW = (q: Full, u: number) => q.width * (1 - (1 - q.tipWidth) * Math.pow(u, 0.9) + 0.22 * Math.exp(-u / 0.02));
/** the fruiting body's bump profile 0..1 at u */
const bump = (q: Full, u: number) => {
  const h = q.bodyLen / 2;
  const d = (u - q.bodyAt) / h;
  if (Math.abs(d) >= 1) return 0;
  // a spindle, fuller toward the top (the ascoma is cushion-like)
  const b = 0.5 + 0.5 * Math.cos(Math.PI * d);
  return Math.pow(b, 0.7) * (1 + 0.15 * d);
};
export const defaultRipen = (spec: StalkSpec, grow: number) => {
  const q = withDefaults(spec);
  return c01((grow - (q.bodyAt - q.bodyLen / 2)) / (q.bodyLen * 1.4));
};

/** centre, tangent, left normal and half-width (world px, bare stalk) at u of the full length */
export const stalkFrame = (spec: StalkSpec, u: number) => {
  const q = withDefaults(spec);
  const cl = centreline(q);
  const x = c01(u) * N;
  const i = Math.min(N - 1, Math.floor(x));
  const f = x - i;
  const a = cl[i];
  const b = cl[i + 1];
  return { p: [a.p[0] + (b.p[0] - a.p[0]) * f, a.p[1] + (b.p[1] - a.p[1]) * f] as P2, t: a.t, n: a.n, w: stalkW(q, u) * q.scale };
};
export const stalkTip = (spec: StalkSpec, grow: number) => stalkFrame(spec, grow).p;

export const CordycepsStalk: React.FC<StalkSpec & { uid: string; grow?: number; ripen?: number; shadow?: number; lit?: P2; opacity?: number; casing?: number }> = (props) => {
  const q = withDefaults(props);
  const grow = c01(props.grow ?? 1);
  const ripen = c01(props.ripen ?? defaultRipen(props, grow));
  const shadow = props.shadow ?? 1;
  const L = q.length * q.scale;
  const sc = q.scale;
  const lit = props.lit ?? ([-0.6, -0.8] as P2);
  const cl = centreline(q);
  const Ld = grow * L;
  if (Ld < 0.5) return null;
  // the drawn samples: every centreline sample under the tip, plus the tip itself
  const iEnd = Math.min(N, Math.floor((grow * N) + 1e-9));
  const frac = grow * N - iEnd;
  const samples: Sample[] = cl.slice(0, iEnd + 1);
  if (iEnd < N && frac > 1e-6) {
    const a = cl[iEnd];
    const b = cl[iEnd + 1];
    samples.push({ p: [a.p[0] + (b.p[0] - a.p[0]) * frac, a.p[1] + (b.p[1] - a.p[1]) * frac], t: a.t, n: a.n, u: grow });
  }
  if (samples.length < 2) samples.push({ ...samples[0], p: [samples[0].p[0] + samples[0].t[0] * 0.5, samples[0].p[1] + samples[0].t[1] * 0.5], u: grow });
  // the tip taper: over the last T px the width closes to a rounded point
  const wTipBase = stalkW(q, grow) * sc;
  const T = Math.min(Ld * 0.6, 1.7 * wTipBase);
  const halfW = (s: Sample, side: -1 | 1) => {
    const sAbs = s.u * L;
    let w = stalkW(q, s.u) * sc;
    const b = bump(q, s.u) * ripen * q.bodyWidth * sc;
    w += b * (side === q.bodySide ? 1 : 0.38);
    const into = sAbs - (Ld - T);
    if (into > 0) w *= Math.sqrt(Math.max(0, 1 - Math.pow(into / T, 2)));
    return w;
  };
  // which side is turned to the light (from the mean left normal)
  const mid = samples[Math.floor(samples.length / 2)];
  const litSide: -1 | 1 = mid.n[0] * lit[0] + mid.n[1] * lit[1] >= 0 ? -1 : 1; // -1 = the left side is lit
  const darkSide = (-litSide) as -1 | 1;
  // left edge (side -1 = along +n), right edge (side 1 = along -n)
  const edge = (s: Sample, side: -1 | 1, k = 1): P2 => {
    const w = halfW(s, side) * k;
    const sg = side === -1 ? 1 : -1;
    return [s.p[0] + s.n[0] * w * sg, s.p[1] + s.n[1] * w * sg];
  };
  const L_ = samples.map((s) => edge(s, -1));
  const R_ = samples.map((s) => edge(s, 1));
  const outline = `M${L_.map(pt).join("L")}L${R_.slice().reverse().map(pt).join("L")}Z`;
  // the shade band on the dark side (from 0.15 of the half-width to the edge)
  const shadeIn = samples.map((s) => {
    const w = halfW(s, darkSide) * -0.06;
    const sg = darkSide === -1 ? 1 : -1;
    return [s.p[0] + s.n[0] * w * sg, s.p[1] + s.n[1] * w * sg] as P2;
  });
  const shadeOut = samples.map((s) => edge(s, darkSide));
  const shade = `M${shadeIn.map(pt).join("L")}L${shadeOut.slice().reverse().map(pt).join("L")}Z`;
  // the hatching across the shade: short strokes from the edge inward, every ~3.4 px of length
  let hatch = "";
  const step = Math.max(2.6, 3.4 * sc);
  let acc = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const seg = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]);
    acc += seg;
    while (acc >= step) {
      acc -= step;
      const s = b;
      const o = edge(s, darkSide, 0.98);
      const into = 0.42 + 0.22 * hsh(Math.round(s.u * 1000), q.seed);
      const iP = edge(s, darkSide, 1 - into);
      // a slight slant: the stroke leans down-stalk
      hatch += `M${pt(o)}L${pt([iP[0] - s.t[0] * 1.6 * sc, iP[1] - s.t[1] * 1.6 * sc])}`;
    }
  }
  // r1 (solid 3D): a lit band down the lit side, a core shadow near the dark edge with a thin reflected rim
  const band = (side: -1 | 1, k0: number, k1: number) => {
    const a = samples.map((s) => edge(s, side, k0));
    const b = samples.map((s) => edge(s, side, k1));
    return `M${a.map(pt).join("L")}L${b.slice().reverse().map(pt).join("L")}Z`;
  };
  const litBand = band(litSide, 0.3, 0.9);
  const core = band(darkSide, 0.5, 0.86);
  const stripe = samples.map((s) => edge(s, litSide, 0.6));
  const ridgeA = samples.map((s) => edge(s, darkSide, 0.38));
  const ridgeB = samples.map((s) => edge(s, litSide, 0.12));
  const line = (pts: P2[]) => `M${pts.map(pt).join("L")}`;
  // the perithecia: pits over the swelling on its bulging side (under the tip only)
  const pores: React.ReactNode[] = [];
  if (ripen > 0.05) {
    const h = q.bodyLen / 2;
    let k = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 3; j++) {
        const u = q.bodyAt - h * 0.75 + (i + 0.5 * (j % 2)) * ((1.5 * h) / 9);
        if (u > grow - 0.01 || u < 0) continue;
        const bb = bump(q, u);
        if (bb < 0.25) continue;
        const f = stalkFrame(q, u);
        const side = q.bodySide;
        const w = stalkW(q, u) * sc + bb * ripen * q.bodyWidth * sc * (1);
        const across = (0.25 + 0.27 * j + 0.06 * (hsh(i, j + 3) - 0.5)) * w;
        const sg = side === -1 ? 1 : -1;
        const c: P2 = [f.p[0] + f.n[0] * across * sg, f.p[1] + f.n[1] * across * sg];
        const r = (1.6 + 1.3 * bb) * sc * (0.5 + 0.5 * ripen);
        pores.push(
          <g key={k++}>
            <ellipse cx={c[0]} cy={c[1]} rx={r} ry={r * 0.8} fill={FUNGUS.pore} opacity={0.8} />
            <circle cx={c[0] + lit[0] * r * 0.45} cy={c[1] + lit[1] * r * 0.45} r={r * 0.35} fill={FUNGUS.lit} opacity={0.7} />
          </g>,
        );
      }
    }
  }
  // the growing tip, a hair paler (only while it is growing)
  const tipGlow = grow < 0.999 ? (() => {
    const s0 = Math.max(0, samples.length - 1 - Math.ceil((T * 1.6) / ((q.length * sc) / N)));
    const tl = samples.slice(s0).map((s) => edge(s, -1, 0.7));
    const tr = samples.slice(s0).map((s) => edge(s, 1, 0.7));
    return `M${tl.map(pt).join("L")}L${tr.slice().reverse().map(pt).join("L")}Z`;
  })() : "";
  const ow = Math.max(1, 1.5 * sc) * (props.casing ?? 1);
  // the split it pushes out of opens with the tip (no fade): full once the drawn stalk is ~2.5 base widths long
  const occOpen = c01(Ld / (2.5 * stalkW(q, 0) * sc));
  const b0 = samples[0];
  const ang = (Math.atan2(b0.t[1], b0.t[0]) * 180) / Math.PI;
  const bw = stalkW(q, 0) * sc;
  return (
    <g opacity={props.opacity ?? 1}>
      <defs>
        <radialGradient id={`${props.uid}-occ`}>
          <stop offset="0" stopColor={FUNGUS.line} stopOpacity={0.85 * shadow} />
          <stop offset="0.55" stopColor={FUNGUS.line} stopOpacity={0.55 * shadow} />
          <stop offset="1" stopColor={FUNGUS.line} stopOpacity={0} />
        </radialGradient>
      </defs>
      {shadow > 0 && occOpen > 0.02 ? (
        <ellipse cx={b0.p[0]} cy={b0.p[1]} rx={bw * 1.05 * occOpen} ry={bw * 2.0 * occOpen} transform={`rotate(${f2(ang)} ${f2(b0.p[0])} ${f2(b0.p[1])})`} fill={`url(#${props.uid}-occ)`} />
      ) : null}
      <path d={outline} fill={FUNGUS.main} />
      <path d={litBand} fill={FUNGUS.lit} />
      <path d={shade} fill={FUNGUS.deep} />
      <path d={core} fill={FUNGUS.core} />
      <path d={hatch} fill="none" stroke={FUNGUS.hatch} strokeWidth={Math.max(0.7, 0.95 * sc)} strokeOpacity={0.4} strokeLinecap="round" />
      <path d={line(ridgeA)} fill="none" stroke={FUNGUS.hatch} strokeWidth={Math.max(0.5, 0.7 * sc)} strokeOpacity={0.35} />
      <path d={line(ridgeB)} fill="none" stroke={FUNGUS.hatch} strokeWidth={Math.max(0.5, 0.6 * sc)} strokeOpacity={0.22} />
      <path d={line(stripe)} fill="none" stroke={FUNGUS.hi} strokeWidth={Math.max(1, 0.18 * stalkW(q, 0.4) * sc)} strokeOpacity={0.8} strokeLinecap="round" />
      {tipGlow ? <path d={tipGlow} fill={FUNGUS.tip} opacity={0.55} /> : null}
      {pores}
      <path d={outline} fill="none" stroke={FUNGUS.line} strokeWidth={ow} strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// MYCELIUM THREADS
// ---------------------------------------------------------------------------
const resample = (path: P2[], step: number) => {
  const out: { p: P2; t: P2; s: number }[] = [];
  let s = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d < 1e-6) continue;
    const t: P2 = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
    const n = Math.max(1, Math.ceil(d / step));
    for (let j = 0; j < n; j++) {
      out.push({ p: [a[0] + (b[0] - a[0]) * (j / n), a[1] + (b[1] - a[1]) * (j / n)], t, s: s + (d * j) / n });
    }
    s += d;
  }
  const last = path[path.length - 1];
  const tl = out.length ? out[out.length - 1].t : ([1, 0] as P2);
  out.push({ p: [last[0], last[1]], t: tl, s });
  return { pts: out, len: s };
};

export const MyceliumThreads: React.FC<{
  uid?: string;
  path: P2[];
  t: number;
  seed?: number;
  width?: number;
  spread?: number;
  every?: number;
  branchLen?: number;
  opacity?: number;
  scale?: number;
}> = ({ path, t, seed = 1, width = 1.6, spread = 5, every = 26, branchLen = 30, opacity = 1, scale = 1 }) => {
  if (path.length < 2 || t <= 0) return null;
  const { pts, len } = resample(path, 3 * scale);
  const reach = c01(t) * len;
  const wob = (s: number) => spread * scale * (0.6 * Math.sin(s * 0.085 / scale + seed * 2.1) + 0.4 * Math.sin(s * 0.23 / scale + seed * 5.3));
  const main: P2[] = [];
  for (const q of pts) {
    if (q.s > reach) break;
    const n: P2 = [-q.t[1], q.t[0]];
    const o = wob(q.s);
    main.push([q.p[0] + n[0] * o, q.p[1] + n[1] * o]);
  }
  if (main.length < 2) return null;
  let branches = "";
  let fine = "";
  const nb = Math.floor(len / (every * scale));
  for (let i = 0; i < nb; i++) {
    const s0 = (i + 0.3 + 0.5 * hsh(i, seed)) * every * scale;
    if (s0 > reach) break;
    const age = reach - s0;
    const idx = Math.min(pts.length - 1, Math.round(s0 / (3 * scale)));
    const q = pts[idx];
    const n: P2 = [-q.t[1], q.t[0]];
    const o = wob(q.s);
    const root: P2 = [q.p[0] + n[0] * o, q.p[1] + n[1] * o];
    const side = (i + Math.floor(seed)) % 2 === 0 ? 1 : -1;
    const ang = (0.5 + 0.5 * hsh(i, seed + 7)) * side;
    const dir: P2 = [q.t[0] * Math.cos(ang) + n[0] * Math.sin(ang), q.t[1] * Math.cos(ang) + n[1] * Math.sin(ang)];
    const blen = Math.min(branchLen * scale * (0.6 + 0.7 * hsh(i, seed + 11)), age * 0.75);
    if (blen < 1) continue;
    const curl = 0.012 * side / scale;
    const bp: P2[] = [root];
    let p = root;
    let d = dir;
    const steps = Math.max(2, Math.ceil(blen / (3 * scale)));
    for (let j = 1; j <= steps; j++) {
      const c = Math.cos(curl * 3 * scale);
      const s = Math.sin(curl * 3 * scale);
      d = [d[0] * c - d[1] * s, d[0] * s + d[1] * c];
      p = [p[0] + d[0] * (blen / steps), p[1] + d[1] * (blen / steps)];
      bp.push(p);
    }
    branches += `M${bp.map(pt).join("L")}`;
    // one fork, once the branch is long enough
    if (blen > 10 * scale) {
      const k = Math.floor(bp.length * 0.55);
      const fr = bp[k];
      const fd: P2 = [d[0] * Math.cos(-side * 0.8) - d[1] * Math.sin(-side * 0.8), d[0] * Math.sin(-side * 0.8) + d[1] * Math.cos(-side * 0.8)];
      const fl = Math.min(blen * 0.5, (blen - 10 * scale) * 0.8);
      fine += `M${pt(fr)}L${pt([fr[0] + fd[0] * fl, fr[1] + fd[1] * fl])}`;
    }
  }
  const md = `M${main.map(pt).join("L")}`;
  const w = width * scale;
  return (
    <g opacity={opacity} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={md + branches + fine} stroke={FUNGUS.line} strokeWidth={w + 1.4 * scale} strokeOpacity={0.35} />
      <path d={md} stroke={FUNGUS.main} strokeWidth={w} />
      <path d={branches} stroke={FUNGUS.main} strokeWidth={w * 0.72} />
      <path d={fine} stroke={FUNGUS.main} strokeWidth={w * 0.5} />
    </g>
  );
};
