// ---------------------------------------------------------------------------
// stupidestFolkBody — the GEOMETRY and POSES of the cast of rsi-stupidest-species: EINSTEIN (c.1920s-30s), ME (the
// speaker, Dwarkesh Patel), the CHIMPANZEE (and a bonobo) and the FORAGERS (early humans). Pure functions (no React);
// the API is the header of stupidestFolk.tsx.
//
// THE HUMANS ARE covidFolk's (kyle-covid covidFolkBody, imported, never edited): the same texcoco rig, a man ~312
// units = 1.75 m, ~4.4 heads, dot eyes, a blush dot, a small nose, mitten hands, small feet. Each person is a covidFolk
// build re-inked and re-dressed: the build's shape list is read by its exact ink colours (a few inks are set to unique
// marker colours; the mittens get a "glove" one unit off the skin, so hands and face can be told apart), parts are
// dropped or recoloured, and this file's own parts are inserted at known places in the painter's order (behind the
// head, over the face, in the hand). The parts live on covidFolk's head sphere and torso lathe (copied below, as
// covidFolkBody copied them from romeFolkBody), so they turn with the figure.
//   Einstein  officer v1 (the fuller older build) in a grey-brown suit, cream shirt, a loose dark tie; his own CLOUD of
//             white hair (a soft mass behind and around the head, a receding cap, wisps at the hairline), a bushy
//             white MOUSTACHE over the mouth, soft grey-white BROWS (a kind look).
//   Me        youth v0 (the slimmer young build), after the speaker's footage (rev 1): an off-white CREAM knit
//             CREWNECK (the hoodie's neck opening with a rib collar, rib cuffs; hood, pocket, drawstrings, earbuds
//             removed), dark trousers, simple dark shoes, short black hair with a small QUIFF swept up at the front,
//             warm medium skin, dark brows, a full neatly trimmed dark BEARD and moustache (one soft flat shape over
//             the jaw, chin and cheeks to the sideburns, a small lip patch so the mouth still reads).
//   Foragers  any build, every modern garment detail removed, the body re-inked as a HIDE TUNIC (this file's hull from
//             the waist, knee length, a soft ragged hem, a cord belt with a knot), bare arms or long hide sleeves,
//             bare legs, bare or hide-wrapped feet; hair shapes from the builds (crop, long, curly, ponytail) and a
//             white beard for the elder.
// THE CHIMPANZEE is this file's own figure on the same paint (flat shapes, one crescent shadow per part): dark umber
// fur as flat matte shapes with soft tufts at the silhouette, a lighter tan face / ears / hands / feet, dot eyes, a
// small muzzle, big ears, long arms; a side-view quadruped (stand, knuckleWalk) and a front-view sitter (sit).
// ---------------------------------------------------------------------------
import {
  add,
  mix,
  mix2,
  mul,
  norm,
  rot,
  sub,
  vlen,
} from "../kits/maps/stringsMotion";
import { mixC } from "../kyle-pandemics/pandemicFolkPaint";
import {
  FU,
  HEAD_R,
  HEAD_UP,
  POSES,
  breathe,
  buildCovidFolk,
  closedD,
  covidGripTo,
  covidRig,
  ellD,
  ellPts,
  lerpPose,
  lineD,
  lookOf,
  mirrorPose,
  standAt,
  tubeD,
  walkPose,
  type CShape,
  type CovidAnchors,
  type CovidInks,
  type CovidKind,
  type CovidPose,
  type P2,
} from "../kyle-covid/covidFolkBody";

export type { CShape, CovidPose, P2 };
export { FU, lerpPose, mirrorPose };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => sst(0, 1, v);
const frac = (v: number) => v - Math.floor(v);
const lc = (h: string) => h.toLowerCase();
const D2R = Math.PI / 180;

/** this clip's sequence rate */
export const FOLK_FPS = 24000 / 1001;
/** covidFolk's breathe runs on 29.97 fps frames: this clip's frames on its clock */
const covidClock = (frame: number) => (frame * (30000 / 1001)) / FOLK_FPS;
/** a man's height in rig units (soles to the top of the skull) = 1.75 m; U = 178 units per metre */
export const MAN_UNITS = 312;
export const U = 178;
export const scaleForPx = (px: number) => px / MAN_UNITS;
/** covidFolkBody's SHADE_TO (its derived tones) and the paint's cream */
const SHADE_TO = "#2C3433";
const CREAM = "#F3EBDD";

// ===================================================================================================================
// THE HEAD SPHERE (covidFolkBody's head: hProj / hInv / regionPoly, copied; the head rebuilt from the exported rig)
// ===================================================================================================================
type Head = { C: P2; R: number; roll: number; yaw: number; pitch: number };
const hToFig = (h: Head, u: P2): P2 =>
  add(h.C, rot([u[0] * h.R, u[1] * h.R], h.roll));
const hProj = (
  h: Head,
  beta: number,
  phi: number,
  rr = 1,
): { p: P2; d: number } => {
  const x0 = rr * Math.cos(phi) * Math.sin(beta + h.yaw);
  const y0 = -rr * Math.sin(phi);
  const d0 = Math.cos(phi) * Math.cos(beta + h.yaw);
  const cp = Math.cos(h.pitch);
  const spc = Math.sin(h.pitch);
  const y1 = y0 * cp + d0 * rr * spc;
  const d1 = d0 * cp - (y0 / rr) * spc;
  return { p: hToFig(h, [x0, y1]), d: d1 };
};
const wrapPi = (a: number) => {
  let v = a;
  while (v > Math.PI) v -= 2 * Math.PI;
  while (v < -Math.PI) v += 2 * Math.PI;
  return v;
};
const hInv = (h: Head, x: number, y: number): [number, number] => {
  const d = Math.sqrt(Math.max(0, 1 - x * x - y * y));
  const cp = Math.cos(h.pitch);
  const spc = Math.sin(h.pitch);
  const y0 = y * cp - d * spc;
  const d0 = d * cp + y * spc;
  const phi = Math.asin(Math.max(-1, Math.min(1, -y0)));
  const beta = wrapPi(Math.atan2(x, d0) - h.yaw);
  return [beta, phi];
};
/** a region on the sphere as a screen polygon (head-local unit coords), scanned column by column */
const regionPoly = (
  h: Head,
  inside: (beta: number, phi: number) => boolean,
  mode: "top" | "bottom",
  vol = 1.0,
  N = 36,
): P2[] => {
  const M = 40;
  const column = (x: number): [number, number] | null => {
    const yr = Math.sqrt(Math.max(0, 1 - x * x)) * 0.9995;
    const y0 = mode === "top" ? -yr : yr;
    const y1 = -y0;
    const ins = (y: number) => {
      const [b, p] = hInv(h, x, y);
      return inside(b, p);
    };
    const bis = (a0: number, b0: number, wantIn: boolean) => {
      let a = a0;
      let b = b0;
      for (let k = 0; k < 10; k++) {
        const m = (a + b) / 2;
        if (ins(m) === wantIn) b = m;
        else a = m;
      }
      return (a + b) / 2;
    };
    let start = NaN;
    let prev = y0;
    if (ins(y0)) start = y0;
    else {
      for (let j = 1; j <= M; j++) {
        const y = mix(y0, y1, j / M);
        if (ins(y)) {
          start = bis(prev, y, true);
          break;
        }
        prev = y;
      }
    }
    if (Number.isNaN(start)) return null;
    let last = start;
    const j0 = Math.ceil(((start - y0) / (y1 - y0)) * M + 1e-9);
    for (let j = Math.max(1, j0); j <= M; j++) {
      const y = mix(y0, y1, j / M);
      if (!ins(y)) return [start, bis(y, last, true)];
      last = y;
    }
    return [start, y1];
  };
  const xs: number[] = [];
  for (let i = 0; i <= N; i++) xs.push((-1 + (2 * i) / N) * 0.999);
  const cols = xs.map(column);
  let best: [number, number] = [-1, -1];
  let st = -1;
  for (let i = 0; i <= N + 1; i++) {
    const ok = i <= N && cols[i] !== null;
    if (ok && st < 0) st = i;
    if (!ok && st >= 0) {
      if (i - 1 - st > best[1] - best[0]) best = [st, i - 1];
      st = -1;
    }
  }
  if (best[0] < 0) return [];
  const refine = (xIn: number, xOut: number) => {
    let a = xIn;
    let b = xOut;
    for (let k = 0; k < 10; k++) {
      const m = (a + b) / 2;
      if (column(m)) a = m;
      else b = m;
    }
    return a;
  };
  const xsR: number[] = [];
  const cR: [number, number][] = [];
  const endPt = (xe: number) => {
    const cc = column(xe);
    const ym = cc ? (cc[0] + cc[1]) / 2 : 0;
    xsR.push(xe);
    cR.push([ym, ym]);
  };
  if (best[0] > 0) endPt(refine(xs[best[0]], xs[best[0] - 1]));
  for (let i = best[0]; i <= best[1]; i++) {
    xsR.push(xs[i]);
    cR.push(cols[i] as [number, number]);
  }
  if (best[1] < N) endPt(refine(xs[best[1]], xs[best[1] + 1]));
  const volP = (p: P2): P2 => {
    const rr = Math.hypot(p[0], p[1]);
    const kk = 1 + (vol - 1) * sst(0.9, 0.999, rr);
    return [p[0] * kk, p[1] * kk];
  };
  const rimSide: P2[] = xsR.map((x, i) => volP([x, cR[i][0]]));
  const inner: P2[] = xsR.map((x, i): P2 => volP([x, cR[i][1]])).reverse();
  return [...rimSide, ...inner];
};
const areaOf = (pts: P2[]) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
const cw = (pts: P2[]) => (areaOf(pts) < 0 ? [...pts].reverse() : pts);
/** covidFolkBody's head of a rigged pose (its headOf, from the exported rig) */
const headOfPose = (kind: CovidKind, variant: number, q0: CovidPose): Head => {
  const { L, q, r } = covidRig(kind, variant, q0);
  const hunch = c01(q0.hunch ?? 0);
  const R = HEAD_R * L.head * (L.female ? 0.96 : 1);
  const C = add(r.headC, rot([0, -HEAD_UP + 7 * hunch], r.headAngle));
  return {
    C,
    R,
    roll: r.headAngle,
    yaw: q.headYaw,
    pitch:
      Math.max(-0.25, Math.min(0.55, ((q.pitch * Math.PI) / 180) * 0.8)) *
      Math.cos(q.headYaw),
  };
};

// ===================================================================================================================
// THE TORSO LATHE (covidFolkBody's torsoRows / makeBody, copied) and the garment hull (its hangHull, adapted)
// ===================================================================================================================
type Row = { y: number; a: number; b: number; c: number };
const sampleRow = (R: Row[], y: number): Row => {
  if (y <= R[0].y) return R[0];
  for (let i = 1; i < R.length; i++) {
    if (y <= R[i].y) {
      const t = (y - R[i - 1].y) / (R[i].y - R[i - 1].y);
      const tt = ease(t);
      return {
        y,
        a: mix(R[i - 1].a, R[i].a, tt),
        b: mix(R[i - 1].b, R[i].b, tt),
        c: mix(R[i - 1].c, R[i].c, tt),
      };
    }
  }
  return R[R.length - 1];
};
type Look = ReturnType<typeof lookOf>;
const torsoRows = (L: Look, shY: number, hunch: number): Row[] => {
  const sp = L.spec;
  const hw = sp.hw;
  const A = sp.a;
  const pl = L.plump;
  const belly = A * (1.0 + 0.08 * pl);
  const hu = 6 * hunch;
  const rows: Row[] = [
    { y: shY - 9 - hu, a: 12, b: 10, c: 0 },
    { y: shY - 4 - hu, a: hw * 0.62, b: hw * 0.42, c: 0 },
    { y: shY + 4 - hu * 0.7, a: hw * 0.9, b: hw * 0.54, c: 1 },
    { y: shY + 22, a: hw * 0.95, b: hw * 0.58, c: 2 },
    {
      y: shY + 50,
      a: Math.max(hw * 0.95, A * 0.9 + 4 * pl),
      b: A * 0.58 + 6 * pl,
      c: 3 + 6 * pl,
    },
    { y: -30, a: belly, b: A * (0.6 + 0.14 * pl), c: 4 + 10 * pl },
    {
      y: -10,
      a: A * (0.99 + 0.05 * pl),
      b: A * (0.62 + 0.1 * pl),
      c: 3 + 6 * pl,
    },
    { y: 8, a: A * 0.95, b: A * 0.58, c: 1 },
  ];
  if (L.female && !L.child) {
    rows[4] = { ...rows[4], a: hw * 0.98, b: A * 0.6, c: 4 };
    rows[5] = { ...rows[5], a: A * 0.92 };
  }
  return rows;
};
const makeBody = (rows: Row[], yaw: number) => {
  const s = Math.sin(yaw);
  const cY = Math.cos(yaw);
  const on = (p: P2, out = 0): { p: P2; d: number } => {
    const r = sampleRow(rows, p[1]);
    const A = r.a + out;
    const B = r.b + out;
    const term = Math.atan2(A * cY, B * s);
    const xc = Math.max(-A, Math.min(A, p[0]));
    const ph = Math.max(term - Math.PI, Math.min(Math.asin(xc / A), term));
    const wf = Math.hypot(A * cY, B * s) / A;
    const X =
      A * Math.sin(ph) * cY + B * Math.cos(ph) * s + (p[0] - xc) * wf + r.c * s;
    const dz = (-Math.sin(ph) * s) / A + (Math.cos(ph) * cY) / B;
    const nl = Math.hypot(Math.sin(ph) / A, Math.cos(ph) / B) || 1;
    return { p: [X, p[1]], d: dz / nl };
  };
  const edge = (y: number): [number, number] => {
    const r = sampleRow(rows, y);
    const w = Math.hypot(r.a * cY, r.b * s);
    return [r.c * s - w, r.c * s + w];
  };
  return { s, cY, on, edge };
};
type BodyL = ReturnType<typeof makeBody>;
const circ = (c: P2, r: number, n = 12): P2[] =>
  Array.from(
    { length: n },
    (_, i): P2 => [
      c[0] + r * Math.cos((i * 2 * Math.PI) / n),
      c[1] + r * Math.sin((i * 2 * Math.PI) / n),
    ],
  );
const hull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: P2, a: P2, b: P2) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0)
      lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0)
      up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const dot = (a: P2, b: P2) => a[0] * b[0] + a[1] * b[1];
const closestOnSeg = (p: P2, a: P2, b: P2): P2 => {
  const d = sub(b, a);
  const L2 = dot(d, d) || 1e-9;
  return add(a, mul(d, c01(dot(sub(p, a), d) / L2)));
};
const resampleClosed = (poly: P2[], n: number, start: P2, passes = 3): P2[] => {
  const m = poly.length;
  let bi = 0;
  let bt = 0;
  let bd = Infinity;
  for (let i = 0; i < m; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % m];
    const qq = closestOnSeg(start, a, b);
    const dd = vlen(sub(start, qq));
    if (dd < bd) {
      bd = dd;
      bi = i;
      const Ln = vlen(sub(b, a));
      bt = Ln > 1e-9 ? vlen(sub(qq, a)) / Ln : 0;
    }
  }
  const ring: P2[] = [mix2(poly[bi], poly[(bi + 1) % m], bt)];
  for (let i = 1; i <= m; i++) ring.push(poly[(bi + i) % m]);
  ring.push(ring[0]);
  const cum: number[] = [0];
  for (let i = 1; i < ring.length; i++)
    cum.push(cum[i - 1] + vlen(sub(ring[i], ring[i - 1])));
  const tot = cum[cum.length - 1] || 1;
  const out: P2[] = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const sv = (i / n) * tot;
    while (j < ring.length - 1 && cum[j] < sv) j++;
    const fr = (sv - cum[j - 1]) / Math.max(1e-9, cum[j] - cum[j - 1]);
    out.push(mix2(ring[j - 1], ring[j], c01(fr)));
  }
  let sm = out;
  for (let pass = 0; pass < passes; pass++)
    sm = sm.map((p, i) =>
      mix2(mix2(sm[(i - 1 + n) % n], sm[(i + 1) % n], 0.5), p, 0.5),
    );
  return sm;
};
type Rig = ReturnType<typeof covidRig>["r"];
type LegRig = Rig["legL"];
const legPtOf = (l: LegRig, fr: number): P2 =>
  fr <= 1 ? mix2(l.H, l.K, fr) : mix2(l.K, l.A, Math.min(1, fr - 1));
const legRadOf = (fr: number) =>
  fr <= 1 ? mix(31, 25, fr) : mix(25, 18, Math.min(1, fr - 1));
/** the HIDE TUNIC's skirt: hanging from the waist (wy, torso-local) down the legs to `len` (0 hip .. 1 knee .. 2
 *  ankle), `flare` units wider at the hem; the hull of the legs cut flat along a hem line (lowered away as the figure
 *  sits / squats, so a squat's raised knees keep the cloth over the thighs), a soft ragged hem (figure-local units) */
const tunicHull = (
  r: Rig,
  B: BodyL,
  k: number,
  wy: number,
  len: number,
  flare: number,
  hdx: number,
  out: number,
  sit: number,
  rag: number,
  seed: number,
): P2[] => {
  const [el, er] = B.edge(wy);
  const waist = [r.toFig([el - out + 1, wy]), r.toFig([er + out - 1, wy])];
  const pts: P2[] = [...waist];
  const rad = (fr: number) =>
    (legRadOf(fr) * 0.85 + out + flare * (fr / Math.max(0.01, len))) * k;
  for (const l of [r.legL, r.legR]) {
    const n = Math.max(2, Math.ceil(len / 0.2));
    for (let i = 0; i <= n; i++) {
      const fr = (i / n) * len;
      pts.push(
        ...circ(
          add(legPtOf(l, fr), [hdx * 0.3 * (fr / Math.max(0.01, len)), 0]),
          rad(fr),
          16,
        ),
      );
    }
  }
  const hl = add(legPtOf(r.legL, len), [hdx * 0.3, 0]);
  const hr = add(legPtOf(r.legR, len), [hdx * 0.3, 0]);
  const drop = rad(len) * 0.42 + 400 * sst(0.2, 0.8, sit);
  const mx = (hl[0] + hr[0]) / 2;
  const my = (hl[1] + hr[1]) / 2 + drop;
  const dxh = hr[0] - hl[0];
  const slope = Math.max(
    -0.12,
    Math.min(0.12, Math.abs(dxh) > 1 ? (hr[1] - hl[1]) / dxh : 0),
  );
  const yLine = (x: number) => my + slope * (x - mx);
  const H0 = hull(pts.map((p): P2 => [p[0], Math.min(p[1], -1.5)]));
  const dense = resampleClosed(H0, 220, waist[0], 0).map(
    (p): P2 => [p[0], Math.min(p[1], yLine(p[0]))],
  );
  const sm = resampleClosed(dense, 160, waist[0], 3);
  if (rag <= 0) return sm;
  // the ragged hem: the points along the bottom edge pushed down in a small irregular pattern fixed to the outline's
  // own sampling (it travels with the cloth, it does not crawl along it)
  const yMax = Math.max(...sm.map((p) => p[1]));
  const PAT = [0, 1, 0.35, 1.15, 0.15, 0.9, 0.5, 1.25, 0.05, 0.8];
  return sm.map((p, i) => {
    const near = sst(yMax - 14 * k, yMax - 3 * k, p[1]);
    return near > 0
      ? [p[0], p[1] + rag * k * near * PAT[(i + seed) % PAT.length]]
      : p;
  });
};

// ===================================================================================================================
// READING A covidFolk BUILD (the sections of its painter's order, by exact ink colours)
// ===================================================================================================================
type Marks = {
  skin: string;
  glove: string;
  skinSh: string;
  top: string;
  hair: Set<string>;
};
type Sections = {
  iNeck: number;
  iTorso: number;
  iBehind: number;
  iHead: number;
  iNose: number;
  iHair: number;
  iFront: number;
  /** each arm block: [first index, last index], and the index of its mitten (the hand) */
  arms: { a: number; b: number; mitten: number }[];
};
/** one unit off in the blue channel: a colour that paints the same but can be told apart */
const nudge = (hex: string) => {
  const v = parseInt(hex.slice(5, 7), 16);
  const nv = v >= 255 ? v - 1 : v + 1;
  return lc(`${hex.slice(0, 5)}${nv.toString(16).padStart(2, "0")}`);
};
const hairSetOf = (hair: string) =>
  new Set(
    [
      hair,
      mixC(hair, CREAM, 0.22),
      mixC(hair, SHADE_TO, 0.35),
      mixC(hair, SHADE_TO, 0.1),
      mixC(hair, SHADE_TO, 0.06),
    ].map(lc),
  );
const sectionsOf = (S: CShape[], m: Marks): Sections => {
  const F = (i: number) => lc(S[i].fill);
  const find = (from: number, pred: (s: CShape, i: number) => boolean) => {
    for (let i = Math.max(0, from); i < S.length; i++)
      if (pred(S[i], i)) return i;
    return S.length;
  };
  const iNeck = find(0, (s) => lc(s.fill) === m.skinSh && s.det === undefined);
  const iTorso = find(
    iNeck + 1,
    (s) => lc(s.fill) === m.top && s.det === undefined && !s.cast,
  );
  const iHead = find(
    iTorso + 1,
    (s) => lc(s.fill) === m.skin && s.sh === undefined && s.det === undefined,
  );
  let iBehind = iHead;
  while (
    iBehind - 1 > iTorso &&
    ((F(iBehind - 1) === m.skin && S[iBehind - 1].sh === 0.5) ||
      m.hair.has(F(iBehind - 1)))
  )
    iBehind--;
  const iNose = find(iHead + 1, (s) => lc(s.fill) === m.skinSh);
  const iHair = find(
    iHead + 1,
    (s) =>
      m.hair.has(lc(s.fill)) && s.det === undefined && s.blur === undefined,
  );
  const iFront = find(
    iHead + 1,
    (s) => lc(s.fill) === m.top && s.det === undefined,
  );
  const gl: number[] = [];
  S.forEach((s, i) => {
    if (lc(s.fill) === m.glove) gl.push(i);
  });
  const arms: { a: number; b: number; mitten: number }[] = [];
  // the back arm: everything before its mitten (it is drawn first); the front arms: from iFront, one per mitten pair
  const back = gl.filter((i) => i < iNeck);
  if (back.length >= 2) arms.push({ a: 0, b: back[1], mitten: back[1] });
  const fr = gl.filter((i) => i > iHead);
  let a0 = iFront;
  for (let j = 1; j < fr.length; j += 2) {
    arms.push({ a: a0, b: fr[j], mitten: fr[j] });
    a0 = fr[j] + 1;
  }
  return { iNeck, iTorso, iBehind, iHead, iNose, iHair, iFront, arms };
};
const boxOf = (d: string): [number, number, number, number] => {
  const v = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < v.length; i += 2) {
    if (v[i] < x0) x0 = v[i];
    if (v[i] > x1) x1 = v[i];
    if (v[i + 1] < y0) y0 = v[i + 1];
    if (v[i + 1] > y1) y1 = v[i + 1];
  }
  return [x0, y0, x1, y1];
};
/** an absolute-coordinate path (M / L / C / Q / Z, as the cast writes them) scaled about a point (folk units) */
const scalePathD = (d: string, c: P2, s: number, dy = 0) => {
  let k = 0;
  return d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (m) => {
    const v = Number(m);
    const out =
      k % 2 === 0 ? c[0] + (v - c[0]) * s : c[1] + (v - c[1]) * s + dy;
    k++;
    return (Math.round(out * 100) / 100).toString();
  });
};
/** which hand an arm block is (the mitten's centre against the anchors; folk units vs rig units) */
const handOfBlock = (
  S: CShape[],
  blk: { mitten: number },
  a: CovidAnchors,
): "L" | "R" => {
  const [x0, y0, x1, y1] = boxOf(S[blk.mitten].d);
  const c: P2 = [(x0 + x1) / 2 / FU, (y0 + y1) / 2 / FU];
  return vlen(sub(c, a.mittenL)) <= vlen(sub(c, a.mittenR)) ? "L" : "R";
};
type Inserts = Map<number, CShape[]>;
const ins = (m: Inserts, at: number, shapes: CShape[]) => {
  if (!shapes.length) return;
  m.set(at, [...(m.get(at) ?? []), ...shapes]);
};
const assemble = (
  S: CShape[],
  keep: (s: CShape, i: number) => CShape | null,
  inserts: Inserts,
): CShape[] => {
  const out: CShape[] = [];
  for (let i = 0; i < S.length; i++) {
    const pre = inserts.get(i);
    if (pre) out.push(...pre);
    const s = keep(S[i], i);
    if (s) out.push(s);
  }
  const post = inserts.get(S.length);
  if (post) out.push(...post);
  return out;
};

// ===================================================================================================================
// PROPS (rig units around a centre; drawn in the hand by the figure, or alone by the cut)
// ===================================================================================================================
export const FLINT = {
  lit: "#9C978C",
  mid: "#6F6A62",
  dark: "#4A4640",
  rim: "#C9C2B2",
};
export const COBBLE = { mid: "#A39784", lit: "#BDB29F" };
export const WOOD = { mid: "#7A5A3E", lit: "#9A7650" };
/** the FLINT CORE (a fist-sized knapped nodule, ~11 cm): an irregular faceted stone, flake scars as lighter facets,
 *  a cream rim on the lit edge; c = its centre, s = units per unit (1 at a man's scale), rotDeg */
export const flintCoreShapes = (c: P2, s = 1, rotDeg = 0): CShape[] => {
  const T = (x: number, y: number): P2 => add(c, rot([x * s, y * s], rotDeg));
  const body = [
    T(-12, -3),
    T(-8, -10),
    T(1, -11.5),
    T(10, -7),
    T(12.5, 1),
    T(8, 8.5),
    T(-2, 10),
    T(-10, 6),
  ];
  return [
    { d: closedD(body, 0.35), fill: FLINT.mid, sh: 0.7 },
    {
      d: closedD([T(-9, -7), T(-1, -10), T(2, -2), T(-6, 1)], 0.3),
      fill: FLINT.lit,
      sh: 0,
      op: 0.85,
    },
    {
      d: closedD([T(3, -9), T(10, -5), T(9, 2), T(3, 0)], 0.3),
      fill: mixC(FLINT.lit, FLINT.mid, 0.4),
      sh: 0,
      op: 0.8,
    },
    {
      d: closedD([T(-4, 3), T(4, 2), T(6, 7.5), T(-2, 8.5)], 0.3),
      fill: FLINT.dark,
      sh: 0,
      op: 0.5,
    },
    {
      d: lineD([T(-11.5, -3.5), T(-7.6, -9.6), T(0.8, -11.1)]),
      fill: FLINT.rim,
      det: 2.2,
      keep: true,
      op: 0.75,
    },
  ];
};
/** the HAMMERSTONE (a rounded river cobble, ~8 cm) */
export const hammerstoneShapes = (c: P2, s = 1, rotDeg = 0): CShape[] => {
  const T = (x: number, y: number): P2 => add(c, rot([x * s, y * s], rotDeg));
  return [
    {
      d: closedD(
        [
          T(-9, -2),
          T(-5, -7.5),
          T(3, -8),
          T(9, -3),
          T(9, 4),
          T(3, 7.5),
          T(-5, 7),
          T(-9.5, 3),
        ],
        0.95,
      ),
      fill: COBBLE.mid,
      sh: 0.8,
    },
    {
      d: ellD(T(-3, -3.5), 3.8 * s, 2.2 * s, rotDeg - 20),
      fill: COBBLE.lit,
      sh: 0,
      op: 0.6,
    },
  ];
};
/** a STICK from p0 (the hand end) to p1 (the tip), tapering */
export const stickShapes = (p0: P2, p1: P2, s = 1): CShape[] => [
  {
    d: tubeD([p0, mix2(p0, p1, 0.5), p1], [5 * s, 4.2 * s, 2.8 * s]),
    fill: WOOD.mid,
    sh: 0.5,
  },
  {
    d: tubeD([mix2(p0, p1, 0.06), mix2(p0, p1, 0.55)], [1.6 * s, 1.2 * s]),
    fill: WOOD.lit,
    sh: 0,
    op: 0.55,
  },
];

// ===================================================================================================================
// THE PEOPLE
// ===================================================================================================================
export type PersonId = "einstein" | "me" | "forager";
export type HoldProp = "none" | "flint" | "hammerstone" | "stick";
export type PersonPose = CovidPose & {
  /** props in the hands (L = the arm on screen left facing us = the near arm facing right) */
  holdL?: HoldProp;
  holdR?: HoldProp;
  /** drawPlan: the stick's tip (figure-local units) when a hand holds the stick */
  stickTip?: P2;
};
export type PersonAnchors = CovidAnchors & {
  /** the props' centres (figure-local; world px from the tsx anchors), the stick's tip */
  propL: P2 | null;
  propR: P2 | null;
  stickTip: P2 | null;
  /** the chin (the think pose's hand sits under it) */
  chin: P2;
};
export type PersonBuild = {
  shapes: CShape[];
  anchors: PersonAnchors;
  heightUnits: number;
};
type Base = { kind: CovidKind; variant: number };
const BASE_OF: Record<"einstein" | "me", Base> = {
  einstein: { kind: "officer", variant: 1 },
  me: { kind: "youth", variant: 0 },
};

// ---- the props in the hands (inserted right after that hand's mitten) ------------------------------------------------
const propCentre = (
  prop: HoldProp,
  a: CovidAnchors,
  hand: "L" | "R",
): P2 | null => {
  const m = hand === "L" ? a.mittenL : a.mittenR;
  const g = hand === "L" ? a.handL : a.handR;
  const w = hand === "L" ? a.wristL : a.wristR;
  const d = norm(sub(g, w));
  if (prop === "flint") return add(add(m, mul(d, 9)), [0, -6]);
  if (prop === "hammerstone") return add(m, mul(d, 8));
  return null;
};
const propShapesOf = (
  prop: HoldProp,
  a: CovidAnchors,
  hand: "L" | "R",
  tip: P2 | undefined,
): CShape[] => {
  const c = propCentre(prop, a, hand);
  if (prop === "flint" && c)
    return flintCoreShapes(c, 1, hand === "L" ? -8 : 8);
  if (prop === "hammerstone" && c) return hammerstoneShapes(c, 1, 20);
  if (prop === "stick" && tip) {
    const g = hand === "L" ? a.handL : a.handR;
    const d = norm(sub(g, tip));
    return stickShapes(add(g, mul(d, 7)), tip);
  }
  return [];
};
const addHandProps = (
  S: CShape[],
  sec: Sections,
  a: CovidAnchors,
  q: PersonPose,
  inserts: Inserts,
) => {
  for (const blk of sec.arms) {
    const hand = handOfBlock(S, blk, a);
    const prop = (hand === "L" ? q.holdL : q.holdR) ?? "none";
    if (prop === "none") continue;
    ins(inserts, blk.mitten + 1, propShapesOf(prop, a, hand, q.stickTip));
  }
};
const anchorsOf = (
  a: CovidAnchors,
  head: Head,
  q: PersonPose,
  extraTop = 0,
): PersonAnchors => {
  const headTop = add(head.C, rot([0, -(1.07 + extraTop) * head.R], head.roll));
  const chin = hProj(head, 0, -0.78, 1).p;
  const pL =
    q.holdL && q.holdL !== "none" && q.holdL !== "stick"
      ? propCentre(q.holdL, a, "L")
      : null;
  const pR =
    q.holdR && q.holdR !== "none" && q.holdR !== "stick"
      ? propCentre(q.holdR, a, "R")
      : null;
  const stick =
    q.holdL === "stick" || q.holdR === "stick" ? (q.stickTip ?? null) : null;
  return { ...a, headTop, propL: pL, propR: pR, stickTip: stick, chin };
};

// ---- EINSTEIN --------------------------------------------------------------------------------------------------------
export const EINSTEIN_INKS = {
  skin: "#E6C2A0",
  hair: "#E8E3D9",
  brow: "#BDB5A8",
  top: "#6F675B",
  top2: "#635C51",
  shirt: "#EAE4D7",
  tie: "#4C4039",
  lower: "#675F54",
  shoe: "#3B2D25",
  sole: "#2A211B",
};
/** the cloud's puffs on the head sphere: [beta, phi, rr, radius (head radii)]: big soft lobes out at the sides above
 *  the ears, over the crown and round the back (a few smaller ones off the edge: wild, not a wig) */
const EIN_PUFFS: [number, number, number, number][] = [
  [-1.45, 0.25, 1.36, 0.5],
  [1.45, 0.22, 1.34, 0.5],
  [-1.32, 0.68, 1.3, 0.47],
  [1.35, 0.64, 1.32, 0.46],
  [-1.62, -0.16, 1.24, 0.36],
  [1.64, -0.14, 1.22, 0.35],
  [-0.72, 1.0, 1.16, 0.44],
  [0.78, 0.98, 1.16, 0.43],
  [0, 1.2, 1.12, 0.44],
  [-2.15, 0.45, 1.26, 0.5],
  [2.2, 0.42, 1.26, 0.5],
  [-2.5, 0.02, 1.2, 0.42],
  [2.5, 0.0, 1.2, 0.42],
  [3.14, 0.5, 1.2, 0.5],
  [3.14, 0.05, 1.15, 0.4],
  [-2.0, 0.92, 1.2, 0.45],
  [2.0, 0.9, 1.2, 0.45],
  // the wild edge
  [-1.85, 0.25, 1.52, 0.27],
  [1.78, 0.92, 1.45, 0.26],
  [-1.05, 1.08, 1.36, 0.25],
  [1.6, 0.05, 1.5, 0.24],
  [0.45, 1.25, 1.3, 0.24],
];
/** the hairline (the cap's lower edge) by beta: high and receding at the front, low at the sides and the back */
const einHairline = (beta: number) => {
  const ab = Math.abs(beta);
  return mix(0.88, 0.16, sst(0.2, 1.3, ab)) - 0.5 * sst(1.7, 2.9, ab);
};
const einsteinParts = (head: Head) => {
  const R = head.R;
  const fs = R / 31.5;
  const hairC = EINSTEIN_INKS.hair;
  // ---- the cloud behind the head: one path of many puffs (one soft crescent shadow on the whole mass) ----
  const puffs = EIN_PUFFS.map(([b, p, rr, rad]) => ({
    c: hProj(head, b, p, rr),
    r: rad * R,
  }));
  const back = puffs
    .map((u) =>
      closedD(cw(ellPts(u.c.p, u.r, u.r * 0.9, head.roll + 15, 14)), 0.95),
    )
    .join(" ");
  const behind: CShape[] = [
    { d: back, fill: hairC, sh: 0.8 },
    // the lit side (upper left)
    {
      d: ellD(hToFig(head, [-0.7, -0.95]), R * 1.1, R * 0.8, head.roll - 20),
      fill: mixC(hairC, "#FFFFFF", 0.45),
      sh: 0,
      op: 0.6,
      blur: 7,
      clip: back,
    },
  ];
  // a few soft strands in the mass (fine lines curling out), fixed to the sphere
  const strands: string[] = [];
  for (const [b, p, dir] of [
    [-1.5, 0.4, -1],
    [1.5, 0.38, 1],
    [-1.2, 0.85, -1],
    [1.25, 0.82, 1],
  ] as [number, number, number][]) {
    const a = hProj(head, b, p, 1.15);
    const m = hProj(head, b + dir * 0.18, p + 0.1, 1.4);
    const e = hProj(head, b + dir * 0.32, p - 0.05, 1.6);
    strands.push(lineD([a.p, m.p, e.p]));
  }
  behind.push({
    d: strands.join(" "),
    fill: mixC(hairC, "#8E877B", 0.55),
    det: 1.3,
    keep: true,
    op: 0.45,
    clip: back,
  });
  // ---- the cap over the skull (above the receding hairline), soft at its edge ----
  const capPoly = regionPoly(head, (b, p) => p > einHairline(b), "top", 1.08);
  const front: CShape[] = [];
  if (capPoly.length > 2) {
    const capD = closedD(cw(capPoly.map((u) => hToFig(head, u))), 0.9);
    front.push({ d: capD, fill: hairC, sh: 0.5 });
    front.push({
      d: ellD(hToFig(head, [-0.4, -0.75]), R * 0.62, R * 0.42, head.roll - 20),
      fill: mixC(hairC, "#FFFFFF", 0.45),
      sh: 0,
      op: 0.7,
      blur: 4,
      clip: capD,
    });
    // a few strands swept back over the cap
    const sw: string[] = [];
    for (const b0 of [-0.5, -0.15, 0.2, 0.55]) {
      const pts = [
        hProj(head, b0, einHairline(b0) + 0.08, 1.08),
        hProj(head, b0 * 1.3, einHairline(b0) + 0.3, 1.08),
        hProj(head, b0 * 1.6, einHairline(b0) + 0.5, 1.08),
      ];
      if (Math.min(...pts.map((v) => v.d)) > 0.05)
        sw.push(lineD(pts.map((v) => v.p)));
    }
    if (sw.length)
      front.push({
        d: sw.join(" "),
        fill: mixC(hairC, "#8E877B", 0.5),
        det: 1.2,
        keep: true,
        op: 0.4,
        clip: capD,
      });
  }
  // ---- the face: brows (soft, the inner ends raised: kind, never stern), the moustache over the mouth ----
  const face: CShape[] = [];
  for (const sgn of [-1, 1]) {
    const pts = [
      hProj(head, sgn * 0.13, 0.34),
      hProj(head, sgn * 0.36, 0.37),
      hProj(head, sgn * 0.6, 0.26),
    ];
    const vb = sst(0.1, 0.35, Math.min(pts[0].d, pts[2].d));
    if (vb > 0.01)
      face.push({
        d: tubeD(
          pts.map((v) => v.p),
          [3.6 * fs, 5 * fs, 2.8 * fs],
        ),
        fill: EINSTEIN_INKS.brow,
        sh: 0,
        op: vb,
      });
  }
  const mo: { p: P2; d: number }[] = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const u = -1 + (2 * i) / N;
    mo.push(hProj(head, u * 0.46, -0.24 - 0.05 * u * u, 1.05));
  }
  for (let i = N; i >= 0; i--) {
    const u = -1 + (2 * i) / N;
    const droop = 0.14 * sst(0.45, 1, Math.abs(u));
    mo.push(hProj(head, u * 0.52, -0.43 - droop + 0.03 * (1 - u * u), 1.03));
  }
  const mv = mo.filter((v) => v.d > -0.05);
  const mVis = sst(0.05, 0.3, hProj(head, 0, -0.33).d);
  if (mv.length > 5 && mVis > 0.01) {
    const md = closedD(
      mv.map((v) => v.p),
      0.8,
    );
    face.push({ d: md, fill: hairC, sh: 0.7, op: mVis });
    const strands2: string[] = [];
    for (const u of [-0.6, -0.25, 0.25, 0.6]) {
      const a = hProj(head, u * 0.44, -0.28, 1.06);
      const b = hProj(head, u * 0.54, -0.42, 1.05);
      if (Math.min(a.d, b.d) > 0.1) strands2.push(lineD([a.p, b.p]));
    }
    if (strands2.length)
      face.push({
        d: strands2.join(" "),
        fill: mixC(hairC, "#8E877B", 0.6),
        det: 1.2,
        keep: true,
        op: 0.5 * mVis,
        clip: md,
      });
  }
  return { behind, front, face };
};
const buildEinstein = (q: PersonPose, frame: number): PersonBuild => {
  const { kind, variant } = BASE_OF.einstein;
  const I = EINSTEIN_INKS;
  const glove = nudge(I.skin);
  const inks: Partial<CovidInks> = {
    skin: I.skin,
    hair: I.hair,
    top: I.top,
    top2: I.top2,
    shirt: I.shirt,
    tie: I.tie,
    lower: I.lower,
    shoe: I.shoe,
    sole: I.sole,
    glove,
    mask: "none",
  };
  const b = buildCovidFolk(kind, variant, q, {
    inks,
    hold: { L: "none", R: "none" },
    carry: "none",
    frame,
  });
  const S = b.shapes;
  const skin = lc(I.skin);
  const hair = hairSetOf(lc(I.hair));
  const m: Marks = {
    skin,
    glove,
    skinSh: lc(mixC(skin, "#8A5A44", 0.22)),
    top: lc(I.top),
    hair,
  };
  const sec = sectionsOf(S, m);
  const head = headOfPose(kind, variant, q);
  const parts = einsteinParts(head);
  const inserts: Inserts = new Map();
  ins(inserts, sec.iBehind, parts.behind);
  // the face: the mouth stays under the moustache, the nose over it: the nose moves to after the mouth
  const nose = sec.iNose < S.length ? [S[sec.iNose]] : [];
  ins(inserts, sec.iHair, [...parts.face, ...nose]);
  ins(inserts, sec.iFront, parts.front);
  addHandProps(S, sec, b.anchors, q, inserts);
  const shapes = assemble(
    S,
    (s, i) =>
      i === sec.iNose || (i > sec.iHead && hair.has(lc(s.fill))) ? null : s,
    inserts,
  );
  return {
    shapes,
    anchors: anchorsOf(b.anchors, head, q, 0.35),
    heightUnits: b.heightUnits + 0.35 * head.R,
  };
};

// ---- ME ----------------------------------------------------------------------------------------------------------------
export const ME_INKS = {
  skin: "#C4946F",
  hair: "#241D1B",
  beard: "#362B26",
  brow: "#2A211E",
  top: "#E3D9C7",
  rib: "#C9BCA4",
  lower: "#34353A",
  shoe: "#3A2F28",
  sole: "#29221D",
};
const ME_TOP2 = "#0a0b0c";
const meQuiff = (head: Head): CShape[] => {
  // the front of the crop swept up into a soft crest: its lower edge a little below the dome's hairline (a gentle wave,
  // lower on his right), its top rising over the head's outline, on the sphere
  const hairC = ME_INKS.hair;
  const pts: { p: P2; d: number }[] = [];
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const u = -1 + (2 * i) / N;
    pts.push(
      hProj(
        head,
        u * 0.95,
        0.5 + 0.06 * u - 0.05 * Math.cos(u * 7) + 0.12 * u * u,
        1.03,
      ),
    );
  }
  for (let i = N; i >= 0; i--) {
    const u = -1 + (2 * i) / N;
    pts.push(
      hProj(head, u * 0.85, 1.22 - 0.1 * u * u, 1.08 + 0.12 * (1 - u * u)),
    );
  }
  const vis = sst(-0.4, 0.05, hProj(head, 0, 0.8).d);
  if (vis < 0.01) return [];
  const d = closedD(
    pts.map((v) => v.p),
    0.85,
  );
  return [
    { d, fill: hairC, sh: 0.45, op: vis },
    {
      d: ellD(
        hProj(head, -0.25, 0.95, 1.12).p,
        head.R * 0.38,
        head.R * 0.14,
        head.roll - 12,
      ),
      fill: mixC(hairC, CREAM, 0.3),
      sh: 0,
      op: 0.55 * vis,
      blur: 3,
      clip: d,
    },
  ];
};
/** Me's full, neatly trimmed dark beard (one soft flat shape on the sphere: the jaw, the chin, the cheeks up to the
 *  sideburns, the moustache over the upper lip), a small lip patch so the mouth still reads, and his dark brows (soft
 *  tubes; the inner ends rise with worry). Drawn under the nose and the mouth. */
const meFace = (head: Head, worry: number): CShape[] => {
  const R = head.R;
  const fs = R / 31.5;
  const I = ME_INKS;
  const out: CShape[] = [];
  const g = (beta: number) => {
    const a = Math.abs(beta);
    if (a <= 0.2) return -0.27;
    if (a <= 0.62) return mix(-0.27, -0.3, ease((a - 0.2) / 0.42));
    if (a <= 1.2) return mix(-0.3, 0.02, ease((a - 0.62) / 0.58));
    return mix(0.02, 0.3, ease(Math.min(1, (a - 1.2) / 0.32)));
  };
  const bp = regionPoly(
    head,
    (b, p) => Math.abs(b) < 1.6 && p < g(b),
    "bottom",
    1.04,
  );
  const parts: string[] = [];
  if (bp.length > 2)
    parts.push(closedD(cw(bp.map((u) => hToFig(head, u))), 0.9));
  // a little fullness at the chin
  const ch = hProj(head, 0, -0.86, 1.02);
  if (ch.d > -0.3)
    parts.push(
      closedD(cw(ellPts(ch.p, 0.3 * R, 0.2 * R, head.roll, 16)), 0.95),
    );
  if (parts.length) {
    const d = parts.join(" ");
    out.push({ d, fill: I.beard, sh: 0.6 });
    out.push({
      d: ellD(hToFig(head, [-0.35, 0.6]), R * 0.42, R * 0.26, head.roll - 15),
      fill: mixC(I.beard, "#9A8A7C", 0.35),
      sh: 0,
      op: 0.45,
      blur: 4,
      clip: d,
    });
  }
  // the lip patch (foreshortened on the sphere), the mouth is drawn over it
  const lp: { p: P2; d: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const t = (2 * Math.PI * i) / 16;
    lp.push(hProj(head, 0.22 * Math.cos(t), -0.4 + 0.065 * Math.sin(t), 1.05));
  }
  const lv = sst(0.15, 0.4, hProj(head, 0, -0.4).d);
  if (lv > 0.01)
    out.push({
      d: closedD(
        lp.map((v) => v.p),
        0.9,
      ),
      fill: mixC(I.skin, "#C47A6C", 0.18),
      sh: 0,
      op: lv,
    });
  // the brows
  for (const sgn of [-1, 1]) {
    const pts = [
      hProj(head, sgn * 0.16, 0.29 + 0.08 * worry),
      hProj(head, sgn * 0.36, 0.33 + 0.03 * worry),
      hProj(head, sgn * 0.58, 0.28 - 0.02 * worry),
    ];
    const vb = sst(0.1, 0.35, Math.min(pts[0].d, pts[2].d));
    if (vb > 0.01)
      out.push({
        d: tubeD(
          pts.map((v) => v.p),
          [3.4 * fs, 4.2 * fs, 2.6 * fs],
        ),
        fill: I.brow,
        sh: 0,
        op: vb,
      });
  }
  return out;
};
const buildMe = (q: PersonPose, frame: number): PersonBuild => {
  const { kind, variant } = BASE_OF.me;
  const I = ME_INKS;
  const glove = nudge(I.skin);
  const inks: Partial<CovidInks> = {
    skin: I.skin,
    hair: I.hair,
    top: I.top,
    top2: ME_TOP2,
    lower: I.lower,
    shoe: I.shoe,
    sole: I.sole,
    glove,
    mask: "none",
  };
  const b = buildCovidFolk(kind, variant, q, {
    inks,
    hold: { L: "none", R: "none" },
    carry: "none",
    frame,
  });
  const S = b.shapes;
  const skin = lc(I.skin);
  const m: Marks = {
    skin,
    glove,
    skinSh: lc(mixC(skin, "#8A5A44", 0.22)),
    top: lc(I.top),
    hair: hairSetOf(lc(I.hair)),
  };
  const sec = sectionsOf(S, m);
  const head = headOfPose(kind, variant, q);
  const inserts: Inserts = new Map();
  // the crewneck's rib collar: the hoodie's neck opening, a little larger, in the rib colour, under it
  for (let i = sec.iTorso + 1; i < sec.iBehind; i++) {
    const s = S[i];
    if (lc(s.fill) === skin && s.sh === 0) {
      const [x0, y0, x1, y1] = boxOf(s.d);
      ins(inserts, i, [
        {
          ...s,
          d: scalePathD(s.d, [(x0 + x1) / 2, (y0 + y1) / 2], 1.28, -1.2 * FU),
          fill: I.rib,
          sh: 0.3,
        },
      ]);
      break;
    }
  }
  ins(inserts, sec.iFront, meQuiff(head));
  // under the nose and the mouth (with the nose turned away: under the hair, never over the front arms)
  ins(
    inserts,
    Math.min(sec.iNose, sec.iHair, sec.iFront),
    meFace(head, q.worry ?? 0),
  );
  addHandProps(S, sec, b.anchors, q, inserts);
  // the hoodie's drawstrings and the earbuds; covidFolk's thin worry brows (his own brows carry the worry)
  const drop = new Set([
    "#e2daca",
    "#eee9de",
    lc(mixC(I.hair, "#2A201A", 0.2)),
  ]);
  const shapes = assemble(
    S,
    (s, i) => {
      const f = lc(s.fill);
      if (drop.has(f)) return null;
      if (f === ME_TOP2)
        return i > sec.iNeck && i < sec.iBehind ? null : { ...s, fill: I.rib };
      return s;
    },
    inserts,
  );
  return {
    shapes,
    anchors: anchorsOf(b.anchors, head, q, 0.12),
    heightUnits: b.heightUnits + 0.1 * head.R,
  };
};

// ---- THE FORAGERS --------------------------------------------------------------------------------------------------------
export type ForagerLook = {
  name: string;
  base: Base;
  skin: string;
  hair: string;
  hide: string;
  /** the tunic's length (0 hip .. 1 knee), flare at the hem */
  len: number;
  flare: number;
  bareArms: boolean;
  /** the feet: bare (skin) or wrapped in hide */
  feet: "bare" | "wrapped";
  beard: "none" | "white";
  cord: string;
};
export const FORAGER_LOOKS: ForagerLook[] = [
  {
    name: "v0 man: khaki hide tunic, bare arms, stubble",
    base: { kind: "commuter", variant: 0 },
    skin: "#C69872",
    hair: "#4A3629",
    hide: "#9A8E6C",
    len: 0.82,
    flare: 6,
    bareArms: true,
    feet: "bare",
    beard: "none",
    cord: "#5C4636",
  },
  {
    name: "v1 woman: oatmeal hide, long hair",
    base: { kind: "commuter", variant: 2 },
    skin: "#D2A57F",
    hair: "#5A3F30",
    hide: "#C2B194",
    len: 1.2,
    flare: 8,
    bareArms: true,
    feet: "bare",
    beard: "none",
    cord: "#6E5440",
  },
  {
    name: "v2 child: umber hide, sleeves",
    base: { kind: "child", variant: 0 },
    skin: "#C9976F",
    hair: "#4E3A2C",
    hide: "#82664B",
    len: 0.75,
    flare: 5,
    bareArms: false,
    feet: "bare",
    beard: "none",
    cord: "#4A382B",
  },
  {
    name: "v3 elder: white beard, hide wraps",
    base: { kind: "elder", variant: 2 },
    skin: "#D8AE8A",
    hair: "#D4CEC2",
    hide: "#8C7B60",
    len: 1.05,
    flare: 7,
    bareArms: false,
    feet: "wrapped",
    beard: "white",
    cord: "#4E3D30",
  },
  {
    name: "v4 man: dark umber hide",
    base: { kind: "parent", variant: 1 },
    skin: "#A67A5E",
    hair: "#2F2521",
    hide: "#735E48",
    len: 0.8,
    flare: 6,
    bareArms: true,
    feet: "bare",
    beard: "none",
    cord: "#4A3A2C",
  },
  {
    name: "v5 woman: khaki hide, ponytail",
    base: { kind: "youth", variant: 2 },
    skin: "#C08F69",
    hair: "#3E2E24",
    hide: "#A69B79",
    len: 1.15,
    flare: 8,
    bareArms: true,
    feet: "bare",
    beard: "none",
    cord: "#5C4636",
  },
  {
    name: "v6 youth: oatmeal hide, curly hair",
    base: { kind: "youth", variant: 1 },
    skin: "#9C6F52",
    hair: "#2B221E",
    hide: "#BBA986",
    len: 0.8,
    flare: 5,
    bareArms: true,
    feet: "bare",
    beard: "none",
    cord: "#5C4636",
  },
  {
    name: "v7 old woman: white curls, umber hide",
    base: { kind: "elder", variant: 1 },
    skin: "#D9B391",
    hair: "#D8D2C6",
    hide: "#7E6A52",
    len: 1.2,
    flare: 8,
    bareArms: false,
    feet: "wrapped",
    beard: "none",
    cord: "#4A382B",
  },
];
export const FORAGER_VARIANTS = FORAGER_LOOKS.length;
export const foragerLookOf = (v: number) =>
  FORAGER_LOOKS[
    ((Math.round(v) % FORAGER_VARIANTS) + FORAGER_VARIANTS) % FORAGER_VARIANTS
  ];
/** marker inks: every modern garment part paints in one of these and is dropped */
const FM = {
  top2: "#01fe02",
  shirt: "#02fe03",
  tie: "#03fe04",
  belt: "#04fe05",
  hat: "#05fe06",
  hat2: "#06fe07",
  bag: "#07fe08",
  strap: "#08fe09",
  scarf: "#09fe0a",
};
const whiteBeard = (head: Head, hairC: string): CShape[] => {
  // a soft short white beard: three round puffs on the chin and the jaw (one path, one crescent shadow), under the mouth;
  // a jaw puff fades as it turns away
  const R = head.R;
  const parts: string[] = [];
  for (const [b, p, r] of [
    [0, -0.78, 0.4],
    [-0.5, -0.62, 0.3],
    [0.5, -0.62, 0.3],
  ] as [number, number, number][]) {
    const c = hProj(head, b, p, 1.08);
    if (c.d < 0.05) continue;
    parts.push(
      closedD(cw(ellPts(c.p, r * R, r * R * 0.85, head.roll, 14)), 0.95),
    );
  }
  if (!parts.length) return [];
  const d = parts.join(" ");
  return [
    { d, fill: hairC, sh: 0.6 },
    {
      d: ellD(hToFig(head, [-0.3, 0.75]), R * 0.4, R * 0.22, head.roll - 15),
      fill: mixC(hairC, "#FFFFFF", 0.35),
      sh: 0,
      op: 0.5,
      blur: 3,
      clip: d,
    },
  ];
};
const buildForager = (
  variant: number,
  q: PersonPose,
  frame: number,
): PersonBuild => {
  const F = foragerLookOf(variant);
  const { kind, variant: bv } = F.base;
  const L = lookOf(kind, bv);
  const glove = nudge(F.skin);
  const footC =
    F.feet === "bare"
      ? mixC(F.skin, "#8A5A44", 0.14)
      : mixC(F.hide, SHADE_TO, 0.12);
  const inks: Partial<CovidInks> = {
    skin: F.skin,
    hair: F.hair,
    top: F.hide,
    top2: FM.top2,
    shirt: FM.shirt,
    tie: FM.tie,
    belt: FM.belt,
    lower: F.skin,
    tights: F.skin,
    shoe: footC,
    sole: footC,
    hat: FM.hat,
    hat2: FM.hat2,
    bag: FM.bag,
    strap: FM.strap,
    scarf: FM.scarf,
    glove,
    mask: "none",
  };
  const b = buildCovidFolk(kind, bv, q, {
    inks,
    hold: { L: "none", R: "none" },
    carry: "none",
    frame,
  });
  const S = b.shapes;
  const skin = lc(F.skin);
  const hair = hairSetOf(lc(F.hair));
  const m: Marks = {
    skin,
    glove,
    skinSh: lc(mixC(skin, "#8A5A44", 0.22)),
    top: lc(F.hide),
    hair,
  };
  const sec = sectionsOf(S, m);
  const head = headOfPose(kind, bv, q);
  // ---- the tunic (this file's hull) and the cord belt, over the torso's fill ----
  const { q: rq, r } = covidRig(kind, bv, q);
  const hunch = c01(q.hunch ?? 0);
  const B = makeBody(torsoRows(L, r.shY, hunch), rq.yaw);
  const k = L.spec.limb;
  const puff =
    L.top === "puffer"
      ? 3.2
      : L.top === "parka"
        ? 2.2
        : L.top === "coat"
          ? 1.4
          : L.top === "hoodie"
            ? 1.6
            : 1.0;
  const hdx = rq.hem - Math.tan((rq.lean * Math.PI) / 180) * 20;
  const tun = tunicHull(
    r,
    B,
    k,
    -16,
    F.len,
    F.flare,
    hdx,
    puff,
    c01(q.sit ?? 0),
    3.4,
    variant * 3,
  );
  const tunD = closedD(tun, 0.8);
  const body: CShape[] = [{ d: tunD, fill: F.hide }];
  // two soft folds down the skirt (cast), a slightly darker band at the hem (the hide's edge)
  const ys = tun.map((p) => p[1]);
  const xsT = tun.map((p) => p[0]);
  const yB = Math.max(...ys);
  const x0 = Math.min(...xsT);
  const x1 = Math.max(...xsT);
  const yW = r.toFig([0, -16])[1];
  if (yB - yW > 30)
    for (let i = 0; i < 2; i++) {
      const t = (i + 0.75) / 2.5;
      const tp: P2 = [mix(x0 + 10, x1 - 10, mix(0.32, 0.72, t)), yW + 18];
      const bt: P2 = [mix(x0 + 6, x1 - 6, t) + hdx * 0.3, yB - 2];
      body.push({
        d: tubeD([tp, mix2(tp, bt, 0.5), bt], [2.5, 5.5, 8]),
        fill: F.hide,
        cast: true,
        op: 0.32,
        clip: tunD,
      });
    }
  body.push({
    d: tunD,
    fill: mixC(F.hide, SHADE_TO, 0.16),
    sh: 0,
    op: 0.9,
    clip: closedD(
      tun.map((p): P2 => [p[0], p[1] + 7 * k]),
      0.8,
    ),
  } as CShape);
  // the cord belt round the waist (on the lathe), the knot and two ends at the front side
  const wy = -15;
  const beltPts: P2[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = mix(-L.spec.a * 1.08, L.spec.a * 1.08, i / 12);
    beltPts.push(
      r.toFig(
        B.on([x, wy + 1.5 * Math.cos((i / 12 - 0.5) * Math.PI)], puff + 0.8).p,
      ),
    );
  }
  body.push({
    d: tubeD(
      beltPts,
      beltPts.map(() => 4.6 * k),
    ),
    fill: F.cord,
    sh: 0.4,
  });
  const knot = B.on([L.spec.a * 0.32, wy], puff + 1.5);
  const kv = sst(-0.05, 0.3, knot.d);
  if (kv > 0.01) {
    const kc = r.toFig(knot.p);
    body.push({
      d: tubeD(
        [kc, add(kc, [1.5, 9 * k]), add(kc, [3, 17 * k])],
        [3.6 * k, 3.4 * k, 2.6 * k],
      ),
      fill: F.cord,
      sh: 0.4,
      op: kv,
    });
    body.push({
      d: tubeD(
        [kc, add(kc, [-2, 8 * k]), add(kc, [-2.5, 14 * k])],
        [3.4 * k, 3.2 * k, 2.4 * k],
      ),
      fill: F.cord,
      sh: 0.4,
      op: kv,
    });
    body.push({
      d: ellD(kc, 4.4 * k, 3.6 * k),
      fill: mixC(F.cord, CREAM, 0.12),
      sh: 0.5,
      op: kv,
    });
  }
  const inserts: Inserts = new Map();
  ins(inserts, sec.iTorso + 1, body);
  if (F.beard === "white") ins(inserts, sec.iNose, whiteBeard(head, F.hair));
  addHandProps(S, sec, b.anchors, q, inserts);
  // ---- what is dropped / recoloured ----
  const marks = new Set([
    ...Object.values(FM),
    lc(mixC(FM.hat2, SHADE_TO, 0.3)),
    "#5a5650",
    "#eee9de",
    "#e2daca",
  ]);
  const partLine = lc(mixC(F.hair, SHADE_TO, 0.35));
  const armOf = (i: number) => sec.arms.find((a) => i >= a.a && i <= a.b);
  const shapes = assemble(
    S,
    (s, i) => {
      const f = lc(s.fill);
      if (marks.has(f)) return null;
      if (s.det !== undefined && f === partLine) return null;
      // the build's own garment: its hanging part and every detail on the torso
      if (i > sec.iTorso && i < sec.iBehind) return null;
      if (i > sec.iNeck && i < sec.iTorso && f !== m.skinSh) return null;
      // trouser creases and sleeve quilting
      if (s.det !== undefined && (i < sec.iNeck || armOf(i))) return null;
      if (armOf(i) && f === m.top) {
        // the cuff (a wrap of darker hide on long sleeves) / the sleeve (a bare arm)
        if (s.sh === 0.4)
          return F.bareArms
            ? null
            : { ...s, fill: mixC(F.hide, SHADE_TO, 0.12) };
        if (F.bareArms) return { ...s, fill: F.skin };
      }
      return s;
    },
    inserts,
  );
  const anchors = anchorsOf(b.anchors, head, q, 0);
  return {
    shapes,
    anchors,
    // the build's own height can count a hat the forager does not wear: measure to the top of the head
    heightUnits: -anchors.headTop[1],
  };
};

/** build a person (figure-local units: feet at (0, 0) or the floor under the hips when seated / squatting; FOLK units
 *  in the shape paths, as covidFolk) */
export const buildPerson = (
  who: PersonId,
  pose: PersonPose,
  o: { variant?: number; frame?: number } = {},
): PersonBuild =>
  who === "einstein"
    ? buildEinstein(pose, o.frame ?? 0)
    : who === "me"
      ? buildMe(pose, o.frame ?? 0)
      : buildForager(o.variant ?? 0, pose, o.frame ?? 0);
const baseOf = (who: PersonId, variant = 0): Base =>
  who === "forager" ? foragerLookOf(variant).base : BASE_OF[who];
/** the grips solved so the hands land on figure-local points (covidFolk's covidGripTo on the person's build) */
export const personGripTo = (
  who: PersonId,
  variant: number,
  pose: PersonPose,
  grip: { L?: P2; R?: P2 },
): PersonPose => {
  const b = baseOf(who, variant);
  return {
    ...covidGripTo(b.kind, b.variant, pose, grip, [0, 0], 1),
    holdL: pose.holdL,
    holdR: pose.holdR,
    stickTip: pose.stickTip,
  };
};
const headOf = (who: PersonId, variant: number, q: CovidPose) => {
  const b = baseOf(who, variant);
  return headOfPose(b.kind, b.variant, q);
};

// ===================================================================================================================
// THE PEOPLE'S POSES (pure, frame-driven, seek-safe; frames at 23.976 fps; dir 1 = facing screen right)
// ===================================================================================================================
const SMILE = 0.22;
const face = (q: PersonPose, dir: 1 | -1): PersonPose =>
  dir === 1
    ? q
    : {
        ...(mirrorPose(q) as PersonPose),
        holdL: q.holdR,
        holdR: q.holdL,
        stickTip: q.stickTip ? [-q.stickTip[0], q.stickTip[1]] : undefined,
      };
const breatheP = (
  q: PersonPose,
  frame: number,
  amount = 1,
  seed = 0,
): PersonPose => ({
  ...(breathe(q, covidClock(frame), amount, seed) as PersonPose),
  holdL: q.holdL,
  holdR: q.holdR,
  stickTip: q.stickTip,
});
const lerpP = (a: PersonPose, b: PersonPose, t: number): PersonPose => ({
  ...(lerpPose(a, b, t) as PersonPose),
  holdL: t < 0.5 ? a.holdL : b.holdL,
  holdR: t < 0.5 ? a.holdR : b.holdR,
  stickTip: b.stickTip ?? a.stickTip,
});

/** the yaws of cut E's pair: Me on the left turned a little toward Einstein on the right (both arms in front: keep
 *  |yaw| <= 0.21 or >= 0.37; between them the far arm crossfades from behind the body to in front of it) */
export const PAIR_YAW = { me: 0.2, einstein: -0.2 };

/** the gesture timings (frames at 23.976) the cuts should give each t = 0..1 gesture (a guide, not a rule) */
export const GESTURE_FRAMES = {
  think: 30,
  unify: 72,
  shrug: 40,
  lookUp: 24,
  glance: 16,
};

/** UNIFY: the two hands' wrist targets (figure-local, a man's units, facing us at yaw 0): apart, then together */
const UNIFY = {
  apart: { L: [-92, -232] as P2, R: [92, -232] as P2 },
  meet: { L: [-16, -198] as P2, R: [16, -198] as P2 },
};
/** unify's phases over t: up 0..0.3 (both hands rise, open, palms in), apart 0.3..0.45 (the two things held wide),
 *  together 0.45..0.82 (they come together in front of his chest), 0.82..1 settled (a small press) */
export const UNIFY_T = {
  up: [0, 0.3],
  apart: [0.3, 0.45],
  together: [0.45, 0.82],
};

export const PERSON_POSES = {
  /** standing at a yaw (0 front, +-0.2 cut E's pair, +-0.62 three-quarter), a slow breath (~4.2 s), a small smile */
  stand: (yaw = 0, frame = 0, seed = 0): PersonPose =>
    breatheP({ ...standAt(yaw), mouth: SMILE }, frame, 1, seed),
  /** three-quarter facing dir (covidFolk's stand), breathing */
  stand3q: (dir: 1 | -1 = 1, frame = 0, seed = 0): PersonPose =>
    breatheP({ ...POSES.stand(dir), mouth: SMILE }, frame, 1, seed),
  /** the head turned toward a screen side (toward = +1 screen right, -1 left) over any pose, amount 0..1 (ease it):
   *  Einstein glances to HIS right (toward -1) at Me; Me glances to HIS left (toward +1) at Einstein */
  glance: (base: PersonPose, toward: 1 | -1, amount = 1): PersonPose => {
    const a = c01(amount);
    return {
      ...base,
      headYaw: base.headYaw + toward * 0.78 * a,
      look: [toward * 0.75 * a, 0.05 * a],
      pitch: base.pitch - 1.5 * a,
      mouth: Math.max(base.mouth, SMILE + 0.06 * a),
    };
  },
  /** Me looks UP at something above Einstein: chin up, the head turned toward `toward`, eyes up, a little awe in the
   *  open mouth; amount 0..1 (ease it over ~24 frames) */
  lookUp: (base: PersonPose, toward: 1 | -1 = 1, amount = 1): PersonPose => {
    const a = c01(amount);
    return {
      ...base,
      pitch: base.pitch - 17 * a,
      headYaw: base.headYaw + toward * 0.38 * a,
      look: [toward * 0.35 * a, -0.95 * a],
      open: 0.16 * a,
      lean: base.lean - toward * 1.5 * a,
      mouth: base.mouth,
    };
  },
  /** a small open-palms SHRUG over t 0..1: up 0..0.3 (shoulders rise, forearms out, palms up, brows up), held
   *  0.3..0.68, down 0.68..1. Give it ~40 frames. */
  shrug: (
    who: PersonId,
    yaw = 0,
    t = 0,
    frame = 0,
    variant = 0,
  ): PersonPose => {
    const base = PERSON_POSES.stand(yaw, frame);
    const up = ease(sst(0, 0.3, t)) * (1 - ease(sst(0.68, 1, t)));
    const c = Math.cos(yaw);
    const sn = Math.sin(yaw);
    const out: PersonPose = {
      ...base,
      armL: {
        w: [-76 * c + 10 * sn, -176],
        elbow: [-0.25, 1],
        fist: 0,
        hand: 46,
      },
      armR: {
        w: [76 * c + 10 * sn, -176],
        elbow: [0.25, 1],
        fist: 0,
        hand: -46,
      },
      hunch: 0.8,
      roll: base.roll + 5,
      worry: 0.6,
      mouth: 0.08,
      pitch: base.pitch - 3,
      crouch: base.crouch - 2,
    };
    void who;
    void variant;
    return lerpP(base, out, up);
  },
  /** THINK: his right hand (armL, screen left facing us) comes up under the chin, the other forearm across the
   *  waist under that elbow, the head a little down, eyes up and aside; t 0..1 = the raise (ease it; ~30 frames) */
  think: (
    who: PersonId,
    yaw = 0,
    t = 1,
    frame = 0,
    variant = 0,
  ): PersonPose => {
    const base = PERSON_POSES.stand(yaw, frame);
    const tgt: PersonPose = {
      ...base,
      pitch: base.pitch + 6,
      headYaw: base.headYaw + 0.12,
      look: [-0.45, -0.55],
      mouth: 0.14,
      roll: base.roll - 3,
    };
    const h = headOf(who, variant, tgt);
    const chin = hProj(h, 0.05, -0.8, 1).p;
    const sup: P2 = [10 + 30 * Math.sin(yaw), -172];
    const solved = personGripTo(
      who,
      variant,
      {
        ...tgt,
        armL: {
          w: [chin[0] - 4, chin[1] + 24],
          elbow: [-0.35, 1],
          fist: 0.85,
          hand: -12,
        },
        armR: { w: sup, elbow: [0.9, 0.6], fist: 0.35, hand: 70 },
      },
      { L: add(chin, [-1, 9]) },
    );
    return lerpP(
      base,
      { ...solved, armR: { w: sup, elbow: [0.9, 0.6], fist: 0.35, hand: 70 } },
      ease(c01(t)),
    );
  },
  /** UNIFY: both hands rise and bring two things together in front of him, palms in (UNIFY_T phases over t 0..1);
   *  the hands' anchors (handL / handR, mittenL / mittenR) are exposed every frame: the cut hangs the two things on
   *  them. Give it ~72 frames. */
  unify: (yaw = 0, t = 0, frame = 0): PersonPose => {
    const base = PERSON_POSES.stand(yaw, frame);
    const c = Math.cos(yaw);
    const sn = Math.sin(yaw);
    const T = (p: P2): P2 => [p[0] * c + 12 * sn, p[1]];
    const upA = ease(sst(UNIFY_T.up[0], UNIFY_T.up[1], t));
    const tog = ease(sst(UNIFY_T.together[0], UNIFY_T.together[1], t));
    const bob = 3 * Math.sin(frame * 0.2) * (1 - tog) * upA;
    const press = 2.5 * sst(UNIFY_T.together[1], 1, t);
    const wL = mix2(T(UNIFY.apart.L), add(T(UNIFY.meet.L), [press, 0]), tog);
    const wR = mix2(T(UNIFY.apart.R), add(T(UNIFY.meet.R), [-press, 0]), tog);
    const raised: PersonPose = {
      ...base,
      armL: {
        w: add(wL, [0, bob]),
        elbow: [mix(-0.75, -0.7, tog), mix(1, 0.9, tog)],
        fist: 0.05,
        hand: mix(-38, -12, tog),
      },
      armR: {
        w: add(wR, [0, -bob]),
        elbow: [mix(0.75, 0.7, tog), mix(1, 0.9, tog)],
        fist: 0.05,
        hand: mix(38, 12, tog),
      },
      pitch: base.pitch + 5 * tog,
      look: [0, 0.35 * tog],
      mouth: SMILE + 0.12 * tog,
    };
    return lerpP(base, raised, upA);
  },

  // ---- the foragers -----------------------------------------------------------------------------------------------
  /** the walk with planted feet: FOLK_WALK_CYCLE frames per two steps; move `at` by folkWalkAdvance(scale) px per
   *  frame in dir. Walkers cross the frame (yaw ~0.9); never toward / away from the camera. */
  walk: (dir: 1 | -1 = 1, frame = 0, amount = 1): PersonPose => ({
    ...POSES.walk(dir, frame / FOLK_WALK_CYCLE, amount),
    mouth: SMILE,
  }),
  /** TEACH (an adult squatting, showing a flint core in the near hand to a child in front of him and knapping it
   *  with a hammerstone in the far hand): KNAP_CYCLE frames per strike (contact at KNAP.contact of the cycle; frame
   *  drives it), amount 0 = just holding the core out to show it, 1 = knapping. `at` = the floor under the hips (the
   *  feet are ~50 units forward). The props are drawn in the hands; their centres are the anchors propL / propR. */
  teach: (dir: 1 | -1 = 1, frame = 0, amount = 1, variant = 0): PersonPose => {
    const sq = squat(1, frame, 16);
    const ph = frac(frame / KNAP_CYCLE);
    const s = knapCurve(ph) * c01(amount);
    const core: P2 = [108, -80];
    const stoneRest: P2 = [100, -116];
    const stoneHit: P2 = [106, -94];
    const stone = mix2(stoneRest, stoneHit, s);
    const base: PersonPose = {
      ...sq,
      lean: 22,
      pitch: 16,
      headYaw: 0.7,
      look: [0.55, 0.6],
      mouth: SMILE + 0.05,
      holdL: "flint",
      holdR: "hammerstone",
    };
    const q = personGripTo(
      "forager",
      variant,
      {
        ...base,
        armL: { w: core, elbow: [-0.2, 1], fist: 0.9, hand: -30 },
        armR: { w: stone, elbow: [-0.6, 0.6], fist: 1, hand: 10 },
      },
      { L: core, R: stone },
    );
    return face({ ...q, holdL: "flint", holdR: "hammerstone" }, dir);
  },
  /** WATCH (the child squatting in front of the teacher, hands on its knees, watching the hands): look = where the
   *  eyes go (-1..1), frame drives a slow breath and a small lean in on each strike when knap = true */
  watch: (dir: 1 | -1 = 1, frame = 0, variant = 2, knap = true): PersonPose => {
    const sq = squat(1, frame, 12);
    const lean =
      14 + (knap ? 3 * knapCurve(frac((frame - 4) / KNAP_CYCLE)) : 0);
    const base: PersonPose = {
      ...sq,
      lean,
      pitch: 8,
      headYaw: 0.75,
      look: [0.5, 0.05],
      mouth: SMILE + 0.08,
      open: knap ? 0.18 * knapCurve(frac((frame - 6) / KNAP_CYCLE)) : 0,
    };
    const b = baseOf("forager", variant);
    const { r } = covidRig(b.kind, b.variant, base);
    const q = personGripTo(
      "forager",
      variant,
      {
        ...base,
        armL: {
          w: add(r.legL.K, [8, 4]),
          elbow: [-0.3, 1],
          fist: 0.3,
          hand: 30,
        },
        armR: {
          w: add(r.legR.K, [4, 4]),
          elbow: [0.3, 1],
          fist: 0.3,
          hand: 30,
        },
      },
      { L: add(r.legL.K, [12, -3]), R: add(r.legR.K, [8, -3]) },
    );
    return face(q, dir);
  },
  /** HAUL (for a group pulling one rope or a log): facing the load (dir), leaning back, both fists on the rope at
   *  HAUL.y (the near fist HAUL.near, the far fist HAUL.far units ahead of the feet), knees bent, a heave every
   *  HAUL_CYCLE frames; step 0..1 walks the feet BACKWARD (planted) as the load comes: move `at` by
   *  -dir * haulAdvance(scale) * step px per frame. The rope through the hands is the cut's: a straight line at
   *  at + [dir * HAUL.near, HAUL.y] * scale, the same for every hauler. */
  haul: (dir: 1 | -1 = 1, frame = 0, step = 0, variant = 0): PersonPose => {
    const ph = frac(frame / HAUL_CYCLE);
    const heave = 0.5 - 0.5 * Math.cos(2 * Math.PI * ph);
    const st = c01(step);
    const base0: PersonPose = {
      ...standAt(0.9),
      lean: -15 - 5 * heave,
      crouch: 9 + 4 * heave,
      pitch: 5,
      headYaw: 0.95,
      look: [0.3, 0.1],
      mouth: 0.05,
      worry: 0.25,
      footL: [36, 0],
      footR: [-34, 0],
    };
    const walked =
      st > 0.001
        ? (walkPose(
            base0,
            -frame / HAUL_CYCLE,
            0.55 * st,
            HAUL_STRIDE,
          ) as PersonPose)
        : base0;
    const q0: PersonPose = {
      ...walked,
      lean: base0.lean,
      crouch: base0.crouch + (walked.crouch - base0.crouch) * 0.5,
    };
    const near: P2 = [HAUL.near, HAUL.y];
    const far: P2 = [HAUL.far, HAUL.y + 1];
    const q = personGripTo(
      "forager",
      variant,
      {
        ...q0,
        armL: { w: near, elbow: [0.2, 1], fist: 1, hand: 0 },
        armR: { w: far, elbow: [-0.3, 1], fist: 1, hand: 0 },
      },
      { L: near, R: far },
    );
    return face(q, dir);
  },
  /** DRAW A PLAN in the sand: squatting, the near hand drawing with a stick whose tip runs along PLAN_PATH on the
   *  ground in front (t 0..1 along it; ~60 frames for the whole path), the far hand on its knee. The tip is the
   *  anchor stickTip; planDrawn(dir, t) is the drawn line (figure-local units). */
  drawPlan: (dir: 1 | -1 = 1, t = 0, frame = 0, variant = 0): PersonPose => {
    const sq = squat(1, frame, 16);
    const tip = planTip(c01(t));
    const u = norm([-0.5, -0.86]);
    const grip = add(tip, mul(u, STICK_LEN));
    const base: PersonPose = {
      ...sq,
      lean: 24,
      pitch: 18,
      headYaw: 0.72,
      look: [0.45, 0.75],
      mouth: SMILE,
      holdL: "stick",
      stickTip: tip,
    };
    const b = baseOf("forager", variant);
    const { r } = covidRig(b.kind, b.variant, base);
    const knee = add(r.legR.K, [6, -3]);
    const q = personGripTo(
      "forager",
      variant,
      {
        ...base,
        armL: { w: sub(grip, [6, -4]), elbow: [-0.4, 1], fist: 1, hand: 0 },
        armR: { w: add(knee, [-4, 6]), elbow: [0.3, 1], fist: 0.3, hand: 30 },
      },
      { L: grip, R: knee },
    );
    return face({ ...q, holdL: "stick", stickTip: tip }, dir);
  },
  /** squatting on the heels (the floor under the hips at `at`, the feet ~50 units forward), breathing */
  squat: (dir: 1 | -1 = 1, frame = 0): PersonPose =>
    face(squat(1, frame, 14), dir),
};
/** frames per walk cycle (two steps, ~1.0 s at 23.976) and the feet's advance per frame (planted feet) */
export const FOLK_WALK_CYCLE = 24;
export const folkWalkAdvance = (scale: number) =>
  (2 * 44 * scale) / FOLK_WALK_CYCLE;
/** the knapping cycle: frames per strike; the stone meets the core at KNAP.contact (fraction of the cycle) */
export const KNAP_CYCLE = 28;
export const KNAP = { contact: 0.62 };
const knapCurve = (ph: number) => {
  // a slow lift off the core (0..0.45), held high, a fast accelerating strike (0.5..0.62), a small rebound
  if (ph < 0.45) return 1 - ease(ph / 0.45);
  if (ph < 0.5) return 0;
  if (ph < 0.62) {
    const u = (ph - 0.5) / 0.12;
    return u * u;
  }
  if (ph < 0.72) return 1 - 0.12 * Math.sin(Math.PI * ((ph - 0.62) / 0.1));
  return 1;
};
/** is the stone on the core at this frame (the contact frame and the next)? */
export const knapContact = (frame: number) => {
  const ph = frac(frame / KNAP_CYCLE);
  return ph >= KNAP.contact - 0.001 && ph < KNAP.contact + 1.5 / KNAP_CYCLE;
};
/** the haul: frames per heave, the rope height and the two fists ahead of the feet (units, facing right) */
export const HAUL_CYCLE = 36;
export const HAUL = { y: -152, near: 78, far: 52 };
const HAUL_STRIDE = 30;
export const haulAdvance = (scale: number) =>
  (2 * HAUL_STRIDE * 0.55 * scale) / HAUL_CYCLE;
/** the plan in the sand (figure-local units, facing right): a little route the stick draws, flat on the ground */
export const PLAN_PATH: P2[] = [
  [62, -2],
  [74, 1.5],
  [86, -1],
  [96, 2.5],
  [104, -2.5],
  [116, 0.5],
  [128, -1.5],
];
export const STICK_LEN = 62;
const planCum = (() => {
  const c = [0];
  for (let i = 1; i < PLAN_PATH.length; i++)
    c.push(c[i - 1] + vlen(sub(PLAN_PATH[i], PLAN_PATH[i - 1])));
  return c;
})();
const planTip = (t: number): P2 => {
  const L = planCum[planCum.length - 1] * t;
  for (let i = 1; i < PLAN_PATH.length; i++)
    if (L <= planCum[i])
      return mix2(
        PLAN_PATH[i - 1],
        PLAN_PATH[i],
        (L - planCum[i - 1]) / Math.max(1e-6, planCum[i] - planCum[i - 1]),
      );
  return PLAN_PATH[PLAN_PATH.length - 1];
};
/** the drawn part of the plan at drawPlan t (figure-local units, mirrored for dir -1) */
export const planDrawn = (dir: 1 | -1, t: number): P2[] => {
  const u = c01(t);
  const L = planCum[planCum.length - 1] * u;
  const out: P2[] = [PLAN_PATH[0]];
  for (let i = 1; i < PLAN_PATH.length; i++) {
    if (planCum[i] < L) out.push(PLAN_PATH[i]);
    else {
      out.push(planTip(u));
      break;
    }
  }
  return u <= 0 ? [] : out.map((p) => [p[0] * dir, p[1]] as P2);
};
/** a squat: covidFolk's seated pose on a very low seat (the hips ~0.2 m over the floor, the knees up) */
function squat(dir: 1 | -1, frame: number, seatH: number): PersonPose {
  const q = POSES.sit(dir, seatH);
  return breatheP(
    { ...q, yaw: 0.92, headYaw: 0.86, lean: 10, mouth: SMILE },
    frame,
    0.8,
  );
}

// ===================================================================================================================
// THE CHIMPANZEE (this file's own figure; rig units, a man ~312; the chimp ~150 to the top of the head)
// ===================================================================================================================
export type ChimpLook = {
  name: string;
  fur: string;
  furLit: string;
  skin: string;
  muzzle: string;
  ear: string;
  face: string;
  slim: number;
  part: boolean;
};
export const CHIMP_LOOKS: ChimpLook[] = [
  {
    name: "v0 chimpanzee",
    fur: "#4B392C",
    furLit: "#5E4938",
    skin: "#C9A27E",
    muzzle: "#D6B392",
    ear: "#B98F6C",
    face: "#C9A27E",
    slim: 1,
    part: false,
  },
  {
    name: "v1 bonobo (slimmer, darker face, parted hair)",
    fur: "#3A2E27",
    furLit: "#4A3B31",
    skin: "#9A7B66",
    muzzle: "#8E7060",
    ear: "#7C6252",
    face: "#6E5648",
    slim: 0.9,
    part: true,
  },
];
export const CHIMP_VARIANTS = CHIMP_LOOKS.length;
const chimpLookOf = (v: number) =>
  CHIMP_LOOKS[
    ((Math.round(v) % CHIMP_VARIANTS) + CHIMP_VARIANTS) % CHIMP_VARIANTS
  ];
/** a chimp's height (soles to the top of the head) sitting and on all fours, in units */
export const CHIMP_UNITS = 152;
export type ChimpPose =
  | {
      kind: "sit";
      dir: 1 | -1;
      headYaw: number;
      pitch: number;
      look: P2;
      breath: number;
      mouth: number;
      lean: number;
    }
  | {
      kind: "quad";
      dir: 1 | -1;
      phase: number;
      walk: number;
      headYaw: number;
      pitch: number;
      look: P2;
      breath: number;
      mouth: number;
    };
export type ChimpAnchors = {
  headC: P2;
  headR: number;
  headTop: P2;
  eyes: P2[];
  mouth: P2;
  handL: P2;
  handR: P2;
  footL: P2;
  footR: P2;
  rump: P2;
  chest: P2;
};
export type ChimpBuild = {
  shapes: CShape[];
  anchors: ChimpAnchors;
  heightUnits: number;
};

/** the knuckle-walk: frames per cycle (all four limbs once, ~1.33 s), the body's speed: move `at` by
 *  chimpWalkAdvance(scale) px per frame in dir (the planted knuckles and feet stay put) */
export const CHIMP_WALK_CYCLE = 32;
const CHIMP_STRIDE = 58;
export const chimpWalkAdvance = (scale: number) =>
  (CHIMP_STRIDE * scale) / CHIMP_WALK_CYCLE;
const DUTY = 0.64;
/** the lateral-sequence walk: each limb's phase offset (hind left, fore left, hind right, fore right) */
const LIMB_OFF = { LH: 0, LF: 0.25, RH: 0.5, RF: 0.75 };
/** one limb's contact point relative to its home (x forward), lift: planted in stance (moving back at the body's
 *  speed), a Hermite swing that leaves and lands at the ground's speed (no kink at lift-off or touch-down) */
const limbPath = (
  u0: number,
  amount: number,
  lift: number,
): { x: number; y: number; stance: boolean } => {
  const u = frac(u0);
  const D = CHIMP_STRIDE * DUTY * amount;
  if (u < DUTY) return { x: D * (0.5 - u / DUTY), y: 0, stance: true };
  const s = (u - DUTY) / (1 - DUTY);
  const T = 1 - DUTY;
  const m = -(D / DUTY) * T;
  const h00 = 2 * s * s * s - 3 * s * s + 1;
  const h10 = s * s * s - 2 * s * s + s;
  const h01 = -2 * s * s * s + 3 * s * s;
  const h11 = s * s * s - s * s;
  const x = h00 * (-D / 2) + h10 * m + h01 * (D / 2) + h11 * m;
  return { x, y: -lift * amount * Math.sin(Math.PI * s) ** 1.2, stance: false };
};
const ik = (S: P2, W: P2, L1: number, L2: number, bend: 1 | -1): P2 => {
  const d = sub(W, S);
  const L = Math.min(vlen(d), L1 + L2 - 0.5);
  const u = norm(d);
  const a = (L1 * L1 - L2 * L2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const n: P2 = [-u[1] * bend, u[0] * bend];
  return add(S, add(mul(u, a), mul(n, h)));
};
const chimpHead = (
  C: P2,
  R: number,
  yaw: number,
  pitch: number,
  roll: number,
): Head => ({
  C,
  R,
  roll,
  yaw,
  pitch: Math.max(-0.3, Math.min(0.5, pitch * D2R)) * Math.cos(yaw),
});
/** the chimp's head on its sphere (yaw 0 = facing us; + = turned toward screen right), back to front */
const chimpHeadShapes = (
  h: Head,
  Lk: ChimpLook,
  look: P2,
  mouth: number,
): { behind: CShape[]; head: CShape[]; eyes: P2[]; mouthP: P2 } => {
  const R = h.R;
  const behind: CShape[] = [];
  const head: CShape[] = [];
  // the ears: big round tan ears at the sides (behind the head's disc; the near one in front as it turns)
  for (const sgn of [-1, 1]) {
    const e = hProj(h, sgn * 1.5, 0.12, 1.02);
    const ear = ellPts(
      add(e.p, [sgn * 0.08 * R * Math.cos(h.yaw), 0]),
      0.36 * R,
      0.4 * R,
      h.roll,
      14,
    );
    behind.push({ d: closedD(ear, 0.95), fill: Lk.ear, sh: 0.5 });
    behind.push({
      d: ellD(
        add(e.p, [sgn * 0.1 * R * Math.cos(h.yaw), 0.02 * R]),
        0.2 * R,
        0.24 * R,
        h.roll,
      ),
      fill: mixC(Lk.ear, "#5A3F30", 0.35),
      sh: 0,
      op: 0.55 * sst(-0.4, 0.2, Math.abs(Math.cos(h.yaw)) - 0.1),
    });
  }
  // the head: fur, with tufts on the crown
  const ring: P2[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * 2 * Math.PI;
    const tuft = Math.sin(a) < -0.35 && i % 2 === 0 ? 0.09 : 0;
    ring.push(
      hToFig(h, [Math.cos(a) * (1 + tuft), Math.sin(a) * (1.02 + tuft)]),
    );
  }
  head.push({ d: closedD(ring, 0.9), fill: Lk.fur });
  head.push({
    d: ellD(hToFig(h, [-0.38, -0.5]), R * 0.6, R * 0.42, h.roll - 25),
    fill: Lk.furLit,
    sh: 0,
    op: 0.7,
    blur: 5,
    clip: closedD(ring, 0.9),
  });
  // the parted hair of the bonobo: a centre parting, the hair falling to both sides
  if (Lk.part) {
    for (const sgn of [-1, 1]) {
      const pts = [
        hProj(h, sgn * 0.04, 0.98, 1.06),
        hProj(h, sgn * 0.6, 0.78, 1.1),
        hProj(h, sgn * 1.05, 0.45, 1.12),
        hProj(h, sgn * 0.85, 0.62, 1.02),
        hProj(h, sgn * 0.3, 0.86, 1.0),
      ];
      if (Math.max(...pts.map((v) => v.d)) > -0.2)
        head.push({
          d: closedD(
            pts.map((v) => v.p),
            0.8,
          ),
          fill: Lk.fur,
          sh: 0.5,
        });
    }
    const pl = [hProj(h, 0, 0.62, 1.01), hProj(h, 0, 0.95, 1.02)];
    if (pl[0].d > 0.05)
      head.push({
        d: lineD(pl.map((v) => v.p)),
        fill: mixC(Lk.fur, Lk.face, 0.5),
        det: 1.4,
        keep: true,
        op: 0.7,
      });
  }
  // the face: a tan heart-shaped mask (two rounded lobes round the eyes, down to the chin)
  const inFace = (b: number, p: number) => {
    const lobe = (cx: number) =>
      ((b - cx) / 0.42) ** 2 + ((p - 0.06) / 0.34) ** 2 < 1;
    const lower = (b / 0.62) ** 2 + ((p + 0.42) / 0.5) ** 2 < 1;
    return lobe(-0.3) || lobe(0.3) || lower;
  };
  const fp = regionPoly(h, inFace, "top", 1.0);
  if (fp.length > 2) {
    const fd = closedD(cw(fp.map((u) => hToFig(h, u))), 0.85);
    head.push({ d: fd, fill: Lk.face, sh: 0.55 });
  }
  // the brow ridge: a soft darker band over the eyes
  const br = [
    hProj(h, -0.62, 0.3),
    hProj(h, -0.3, 0.38),
    hProj(h, 0, 0.3),
    hProj(h, 0.3, 0.38),
    hProj(h, 0.62, 0.3),
  ];
  const vis = br.filter((v) => v.d > 0.12);
  if (vis.length > 2)
    head.push({
      d: tubeD(
        vis.map((v) => v.p),
        vis.map(() => 0.1 * R),
      ),
      fill: mixC(Lk.face, "#6A4C38", 0.3),
      sh: 0,
      op: 0.6,
    });
  // the muzzle: a rounded light bump low on the face, two nostril dots, the mouth line
  const mz = hProj(h, 0, -0.42, 1.16);
  const mzV = sst(-0.15, 0.25, mz.d);
  if (mzV > 0.01) {
    head.push({
      d: ellD(
        mz.p,
        R * 0.46 * mix(0.62, 1, Math.abs(Math.cos(h.yaw))),
        R * 0.36,
        h.roll,
      ),
      fill: Lk.muzzle,
      sh: 0.6,
      op: mzV,
    });
    for (const sgn of [-1, 1]) {
      const n = hProj(h, sgn * 0.09, -0.3, 1.32);
      if (n.d > 0.1)
        head.push({
          d: ellD(n.p, R * 0.045, R * 0.035, h.roll),
          fill: "#3A2A22",
          sh: 0,
          op: 0.8 * sst(0.1, 0.4, n.d),
        });
    }
    const m0 = hProj(h, -0.3, -0.6, 1.14);
    const m1 = hProj(h, 0, -0.64 - 0.04 * mouth, 1.18);
    const m2 = hProj(h, 0.3, -0.6, 1.14);
    if (Math.min(m0.d, m2.d) > 0.05)
      head.push({
        d: lineD([m0.p, m1.p, m2.p]),
        fill: "#5A3D30",
        det: 1.7,
        keep: true,
        op: 0.75 * mzV,
      });
  }
  // dot eyes (a glance by `look`)
  const eyes: P2[] = [];
  for (const sgn of [-1, 1]) {
    const e = hProj(h, sgn * 0.3 + look[0] * 0.1, 0.07 - look[1] * 0.06, 1.0);
    eyes.push(e.p);
    const v = sst(0.12, 0.38, e.d);
    if (v > 0.003)
      head.push({
        d: ellD(e.p, 0.085 * R * mix(0.55, 1, e.d), 0.1 * R, h.roll),
        fill: "#1E1611",
        sh: 0,
        op: v,
      });
    if (v > 0.003 && Lk.part)
      head.push({
        d: ellD(add(e.p, [-0.03 * R, -0.035 * R]), 0.03 * R, 0.03 * R),
        fill: "#E8DDCB",
        sh: 0,
        op: 0.8 * v,
      });
  }
  return { behind, head, eyes, mouthP: hProj(h, 0, -0.62, 1.16).p };
};
/** a mitten-like knuckle hand: from the wrist, curled, the knuckles down at `k` (on the ground or lifted) */
const knuckleHand = (
  W: P2,
  K: P2,
  Lk: ChimpLook,
  far: boolean,
  s = 1,
): CShape[] => {
  const c = mix2(W, K, 0.55);
  const d = sub(K, W);
  const ang = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
  const col = far ? mixC(Lk.skin, "#2A1E17", 0.18) : Lk.skin;
  return [
    {
      d: ellD(c, Math.max(7, vlen(d) * 0.62) * s, 8.5 * s, ang),
      fill: col,
      sh: 0.5,
    },
  ];
};
const chimpFoot = (
  A: P2,
  dir: number,
  Lk: ChimpLook,
  far: boolean,
  lift = 0,
): CShape[] => {
  const col = far ? mixC(Lk.skin, "#2A1E17", 0.18) : Lk.skin;
  const r = (p: P2): P2 => add(A, rot(p, -lift));
  const pts: P2[] = [
    r([-8, -5]),
    r([4, -6]),
    r([20, -3]),
    r([26, 2]),
    r([22, 6]),
    r([2, 6.5]),
    r([-9, 4]),
  ].map((p) => [A[0] + (p[0] - A[0]) * dir, p[1]] as P2);
  return [{ d: closedD(pts, 0.85), fill: col, sh: 0.5 }];
};
const buildQuad = (
  q: Extract<ChimpPose, { kind: "quad" }>,
  Lk: ChimpLook,
): ChimpBuild => {
  const dir = q.dir;
  const M = (p: P2): P2 => [p[0] * dir, p[1]];
  const sl = Lk.slim;
  const w = c01(q.walk);
  const ph = q.phase;
  const bob = w * 2.2 * Math.cos(4 * Math.PI * ph);
  const br = q.breath;
  // the body: hips and shoulders (facing right), the back sloping down to the rump
  const H: P2 = [-40, -82 + bob * 0.6 - 0.4 * br];
  const S: P2 = [30, -111 + bob - 1.1 * br];
  const homes = { LH: -38, RH: -30, LF: 40, RF: 48 };
  const limb = (key: keyof typeof LIMB_OFF, lift: number) => {
    const lp =
      w > 0.001
        ? limbPath(ph + LIMB_OFF[key], w, lift)
        : { x: 0, y: 0, stance: true };
    return { x: homes[key] + lp.x, y: lp.y };
  };
  const lh = limb("LH", 14);
  const rh = limb("RH", 14);
  const lf = limb("LF", 16);
  const rf = limb("RF", 16);
  // the torso: an egg along the spine, fuller at the shoulders, tufts along the back
  const sp = sub(S, H);
  const u = norm(sp);
  const n: P2 = [u[1], -u[0]];
  const len = vlen(sp);
  const ring: P2[] = [];
  const NB = 34;
  for (let i = 0; i < NB; i++) {
    const a = (i / NB) * 2 * Math.PI;
    const along = Math.cos(a);
    const across = Math.sin(a);
    const half = len / 2 + 28 * sl;
    const fat = (along > 0 ? mix(29, 33, along) : mix(29, 25, -along)) * sl;
    const top = across > 0 ? 1.08 : 0.92;
    const p = add(
      mix2(H, S, 0.5),
      add(
        mul(u, along * half * (along > 0 ? 0.92 : 1)),
        mul(n, across * fat * top),
      ),
    );
    ring.push(p);
  }
  // tufts on the back half of the ring (across > 0 is the back)
  const tRing = ring.map((p, i) => {
    const a = (i / NB) * 2 * Math.PI;
    if (Math.sin(a) > 0.25 && i % 3 === 0)
      return add(p, mul(n, 2.4 + 1 * Math.sin(i * 1.7)));
    if (Math.sin(a) < -0.6 && i % 4 === 0) return add(p, mul(n, -2.2));
    return p;
  });
  // limbs: arms from the shoulder (elbows point back), legs from the hip (knees forward)
  const armOf = (f: { x: number; y: number }, off: number) => {
    const K: P2 = [f.x, f.y];
    const Wr: P2 = add(K, [-4, -13]);
    const Sx: P2 = add(S, [off, 4]);
    const E = ik(Sx, Wr, 55, 52, 1);
    return { S: Sx, E, W: Wr, K };
  };
  const legOf = (f: { x: number; y: number }, off: number, lift: number) => {
    const A: P2 = [f.x - 8, f.y - 9];
    const Hx: P2 = add(H, [off, 6]);
    const Kn = ik(Hx, A, 44, 42, -1);
    return { H: Hx, K: Kn, A, lift };
  };
  const aFar = armOf(rf, 5);
  const aNear = armOf(lf, -3);
  const lFar = legOf(rh, 4, rh.y < -0.5 ? 14 * sst(0, 6, -rh.y) : 0);
  const lNear = legOf(lh, -4, lh.y < -0.5 ? 14 * sst(0, 6, -lh.y) : 0);
  const furFar = mixC(Lk.fur, "#1E1611", 0.22);
  const shapes: CShape[] = [];
  const armShapes = (a: ReturnType<typeof armOf>, far: boolean): CShape[] => {
    const col = far ? furFar : Lk.fur;
    return [
      {
        d: tubeD([a.S, mix2(a.S, a.E, 0.5), a.E].map(M), [
          27 * sl,
          23 * sl,
          19 * sl,
        ]),
        fill: col,
      },
      // the long forearm hair: a soft fringe on the back of the forearm
      {
        d: tubeD([a.E, mix2(a.E, a.W, 0.5), a.W].map(M), [
          19 * sl,
          17 * sl,
          14 * sl,
        ]),
        fill: col,
      },
      {
        d: closedD(
          [
            a.E,
            add(mix2(a.E, a.W, 0.45), [-7 * dir, 2]),
            add(mix2(a.E, a.W, 0.8), [-3 * dir, 0]),
            mix2(a.E, a.W, 0.7),
          ].map(M),
          0.7,
        ),
        fill: col,
        sh: 0,
      },
      ...knuckleHand(M(a.W), M(a.K), Lk, far),
    ];
  };
  const legShapes = (l: ReturnType<typeof legOf>, far: boolean): CShape[] => {
    const col = far ? furFar : Lk.fur;
    return [
      {
        d: tubeD(
          [l.H, mix2(l.H, l.K, 0.5), l.K, mix2(l.K, l.A, 0.6), l.A].map(M),
          [32 * sl, 27 * sl, 21 * sl, 17 * sl, 14 * sl],
        ),
        fill: col,
      },
      ...chimpFoot(M(l.A), dir, Lk, far, l.lift),
    ];
  };
  shapes.push(...legShapes(lFar, true));
  shapes.push(...armShapes(aFar, true));
  shapes.push({ d: closedD(tRing.map(M), 0.9), fill: Lk.fur });
  shapes.push({
    d: ellD(
      M(add(mix2(H, S, 0.55), mul(n, 14))),
      len * 0.55,
      13,
      (Math.atan2(u[1] * 1, u[0] * dir) * 180) / Math.PI,
    ),
    fill: Lk.furLit,
    sh: 0,
    op: 0.55,
    blur: 6,
    clip: closedD(tRing.map(M), 0.9),
  });
  shapes.push(...legShapes(lNear, false));
  // the head on a short neck in front of the shoulders, a little low (the chimp's posture)
  const C: P2 = add(S, [34, -12 + 0.6 * bob]);
  const yaw = q.headYaw;
  const h = chimpHead(M(C), 27, dir * yaw, q.pitch, dir * -4);
  const hd = chimpHeadShapes(h, Lk, [q.look[0] * dir, q.look[1]], q.mouth);
  shapes.push({
    d: tubeD([S, add(S, [16, -8]), C].map(M), [44 * sl, 38 * sl, 30 * sl]),
    fill: Lk.fur,
    sh: 0.6,
  });
  shapes.push(...hd.behind, ...hd.head);
  shapes.push(...armShapes(aNear, false));
  const anchors: ChimpAnchors = {
    headC: h.C,
    headR: h.R,
    headTop: add(h.C, [0, -1.07 * h.R]),
    eyes: hd.eyes,
    mouth: hd.mouthP,
    handL: M(aNear.K),
    handR: M(aFar.K),
    footL: M(add(lNear.A, [8, 9])),
    footR: M(add(lFar.A, [8, 9])),
    rump: M(add(H, [-26, 0])),
    chest: M(add(S, [10, 18])),
  };
  return { shapes, anchors, heightUnits: -(h.C[1] - 1.07 * h.R) };
};
const buildSit = (
  q: Extract<ChimpPose, { kind: "sit" }>,
  Lk: ChimpLook,
): ChimpBuild => {
  const dir = q.dir;
  const sl = Lk.slim;
  const br = q.breath;
  const lean = q.lean;
  // body-local (front view), with a slight turn toward dir: x' = x + dir * 0.12 * depth
  const T = (p: P2): P2 => [p[0] + dir * 0.0, p[1]];
  const L = (p: P2): P2 => T(add(p, [lean * (-p[1] / 120), 0]));
  const shY = -94 - 1.2 * br;
  // the body: a pear from the rump on the ground to the hunched shoulders (one silhouette), tufts at the shoulders
  const prof: [number, number][] = [
    [-2, 34],
    [-12, 42],
    [-28, 43],
    [-46, 38],
    [-62, 35],
    [-78, 37],
    [shY + 4, 40],
    [shY - 6, 33],
    [shY - 14, 18],
  ];
  const right: P2[] = prof.map(([y, x]) => [x * sl, y]);
  const left: P2[] = prof.map(([y, x]): P2 => [-x * sl, y]).reverse();
  let ring: P2[] = [...right, ...left];
  ring = ring.map((p, i) => {
    const sh = p[1] < shY + 8 && p[1] > shY - 10;
    const hip = p[1] > -48 && p[1] < -20;
    return sh || hip
      ? add(p, [
          Math.sign(p[0]) * (i % 2 === 0 ? 4 : 0),
          i % 2 === 0 ? -1.5 : 0,
        ])
      : p;
  });
  const furFar = mixC(Lk.fur, "#1E1611", 0.12);
  const shapes: CShape[] = [];
  const bodyD = closedD(ring.map(L), 0.85);
  shapes.push({ d: bodyD, fill: Lk.fur });
  shapes.push({
    d: ellD(L([-14, -78]), 22, 30, -10),
    fill: Lk.furLit,
    sh: 0,
    op: 0.6,
    blur: 7,
    clip: bodyD,
  });
  // the legs: the thighs up to the raised knees, the shins down to the flat tan feet in front
  const legs: { H: P2; K: P2; A: P2; sgn: number }[] = [-1, 1].map((sgn) => ({
    H: [sgn * 22 * sl, -22] as P2,
    K: [sgn * 33 * sl, -56] as P2,
    A: [sgn * 25 * sl, -10] as P2,
    sgn,
  }));
  // the arms: long, hanging from the shoulders, elbows a little out, the hands resting knuckles-down on the ground
  // beside the feet (the long arms reach the floor even sitting)
  const arms = [-1, 1].map((sgn) => {
    const Sx: P2 = [sgn * 34 * sl, shY + 6];
    const Hd: P2 = [sgn * 46 * sl, -6];
    const Wr: P2 = add(Hd, [-sgn * 1, -12]);
    const E = ik(Sx, Wr, 38, 38, sgn > 0 ? -1 : 1);
    return { S: Sx, E, W: Wr, K: Hd, sgn };
  });
  for (const a of arms) {
    shapes.push({
      d: tubeD([a.S, mix2(a.S, a.E, 0.5), a.E].map(L), [
        26 * sl,
        22 * sl,
        18 * sl,
      ]),
      fill: a.sgn * dir < 0 ? furFar : Lk.fur,
    });
    shapes.push({
      d: tubeD([a.E, mix2(a.E, a.W, 0.5), a.W].map(L), [
        18 * sl,
        16 * sl,
        13 * sl,
      ]),
      fill: a.sgn * dir < 0 ? furFar : Lk.fur,
    });
    shapes.push({
      d: closedD(
        [
          a.E,
          add(mix2(a.E, a.W, 0.45), [a.sgn * 6, 0]),
          add(mix2(a.E, a.W, 0.8), [a.sgn * 3, 0]),
          mix2(a.E, a.W, 0.7),
        ].map(L),
        0.7,
      ),
      fill: a.sgn * dir < 0 ? furFar : Lk.fur,
      sh: 0,
    });
  }
  for (const l of legs) {
    shapes.push({
      d: tubeD([l.H, mix2(l.H, l.K, 0.5), l.K].map(L), [
        34 * sl,
        30 * sl,
        24 * sl,
      ]),
      fill: Lk.fur,
    });
    shapes.push({
      d: tubeD([l.K, mix2(l.K, l.A, 0.5), l.A].map(L), [
        24 * sl,
        19 * sl,
        15 * sl,
      ]),
      fill: Lk.fur,
    });
    // the knee tuft
    shapes.push({
      d: ellD(L(add(l.K, [0, -3])), 12 * sl, 10, 0),
      fill: Lk.fur,
      sh: 0,
    });
  }
  for (const l of legs) {
    const fc: P2 = L(add(l.A, [l.sgn * 3, 4]));
    shapes.push({
      d: closedD(
        [
          add(fc, [-12, -3]),
          add(fc, [0, -6]),
          add(fc, [12, -3]),
          add(fc, [13, 4]),
          add(fc, [0, 7]),
          add(fc, [-13, 4]),
        ],
        0.9,
      ),
      fill: Lk.skin,
      sh: 0.5,
    });
    shapes.push({
      d:
        lineD([add(fc, [-4, 1]), add(fc, [-4, 5])]) +
        " " +
        lineD([add(fc, [4, 1]), add(fc, [4, 5])]),
      fill: mixC(Lk.skin, "#6A4C38", 0.4),
      det: 1.1,
      keep: true,
      op: 0.45,
    });
  }
  for (const a of arms) shapes.push(...knuckleHand(L(a.W), L(a.K), Lk, false));
  // the head on the hunched shoulders (no neck), turned by headYaw
  const C: P2 = L([dir * 2, shY - 30 - 0.4 * br]);
  const h = chimpHead(C, 27, q.headYaw, q.pitch, lean * 0.3);
  const hd = chimpHeadShapes(h, Lk, q.look, q.mouth);
  shapes.push(...hd.behind, ...hd.head);
  const anchors: ChimpAnchors = {
    headC: h.C,
    headR: h.R,
    headTop: add(h.C, [0, -1.07 * h.R]),
    eyes: hd.eyes,
    mouth: hd.mouthP,
    handL: L(arms[0].K),
    handR: L(arms[1].K),
    footL: L(add(legs[0].A, [0, 10])),
    footR: L(add(legs[1].A, [0, 10])),
    rump: [0, 0],
    chest: L([0, -70]),
  };
  return { shapes, anchors, heightUnits: -(h.C[1] - 1.07 * h.R) };
};
export const buildChimp = (variant: number, pose: ChimpPose): ChimpBuild =>
  pose.kind === "sit"
    ? buildSit(pose, chimpLookOf(variant))
    : buildQuad(pose, chimpLookOf(variant));
export const chimpLookName = (v: number) => chimpLookOf(v).name;

/** the chimp's poses (pure, frame-driven; frames at 23.976) */
export const CHIMP_POSES = {
  /** sitting on its haunches (`at` = the ground under the rump), looking out; headYaw turns the head (-1..1), look
   *  moves the eyes; frame drives a slow breath and a small idle head motion */
  sit: (
    dir: 1 | -1 = 1,
    frame = 0,
    o: { headYaw?: number; look?: P2; pitch?: number } = {},
  ): ChimpPose => {
    const t = frame / FOLK_FPS;
    return {
      kind: "sit",
      dir,
      headYaw: (o.headYaw ?? dir * 0.25) + 0.05 * Math.sin(t * 0.7),
      pitch: (o.pitch ?? 0) + 2 * Math.sin(t * 0.5 + 1),
      look: o.look ?? [dir * 0.3, 0],
      breath: Math.sin((t / 3.4) * 2 * Math.PI),
      mouth: 0,
      lean: 0,
    };
  },
  /** on all fours at rest (side view facing dir; `at` = the ground under the body's middle), breathing; headYaw from
   *  the side (1.2 = profile-ish looking where it walks, smaller turns the face toward us) */
  stand: (
    dir: 1 | -1 = 1,
    frame = 0,
    o: { headYaw?: number; look?: P2; pitch?: number } = {},
  ): ChimpPose => {
    const t = frame / FOLK_FPS;
    return {
      kind: "quad",
      dir,
      phase: 0,
      walk: 0,
      headYaw: o.headYaw ?? 0.95,
      pitch: (o.pitch ?? 4) + 1.5 * Math.sin(t * 0.6),
      look: o.look ?? [0.3, 0],
      breath: Math.sin((t / 3.4) * 2 * Math.PI),
      mouth: 0,
    };
  },
  /** the KNUCKLE-WALK: a seek-safe cycle (CHIMP_WALK_CYCLE frames, the lateral sequence: hind, fore, hind, fore),
   *  knuckles and feet planted in stance; move `at` by chimpWalkAdvance(scale) px per frame in dir. amount 0..1
   *  eases the stride in / out (multiply the advance by it too). */
  knuckleWalk: (
    dir: 1 | -1 = 1,
    frame = 0,
    amount = 1,
    o: { headYaw?: number; look?: P2 } = {},
  ): ChimpPose => {
    const t = frame / FOLK_FPS;
    return {
      kind: "quad",
      dir,
      phase: frame / CHIMP_WALK_CYCLE,
      walk: amount,
      headYaw: o.headYaw ?? 1.2,
      pitch: 6 + 2 * Math.sin((frame / CHIMP_WALK_CYCLE) * 4 * Math.PI),
      look: o.look ?? [0.5, 0],
      breath: Math.sin((t / 3.4) * 2 * Math.PI) * 0.5,
      mouth: 0,
    };
  },
};
