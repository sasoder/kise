// ---------------------------------------------------------------------------
// steelHorsesShared: the engraved cast of SteelAndHorses (Dwarkesh Patel with
// Si Sheppard, "Conquistador advantages", cut B). Everything is drawn in
// CENTIMETRES (x to screen right, y DOWN, the ground at y = 0) inside a group
// scaled by S = screen px per cm, because the cut is one pull-back of ~220x:
// every stroke is given in SCREEN px (pen.px) or clamped to a screen range
// (pen.w), and every hatch is octave-stable (finer lines fade in as the thing
// grows), so the same drawing holds from a 1900 px close-up down to 12 px.
//
// COLOUR RULE OF THE CLIP: orange = the Spaniards' edge. Their STEEL is solid
// orange (sword, morion, cuirass, gauntlets, stirrup, bit, pike heads); their
// horses and the men themselves are ORANGE LINE on a dark ground (no cream
// anywhere on that side). Everything indigenous is solid CREAM with dark
// engraving (the warrior, his cotton armour, shield and macuahuitl); obsidian
// is dark glass with a cream edge.
//
// The conquistador (the hero rider, his sword) and the warrior (with the
// macuahuitl) are cut A's figures (techAdvFigures); this module adds the HORSE
// in the same manner (solid orange coat, dark outline, hatched shade), the
// band's plain riders and foot, and the obsidian chips.
// EXPORTS: mkPen, Chip, HorseRider, FootSoldier, SADDLE_Y.
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, DARK, INK, hash, type P2 } from "./cortesShared";
import { add, mix2, mul, norm, rot, sub, vlen } from "./stringsMotion";

// ---------------------------------------------------------------------------
// INK
// ---------------------------------------------------------------------------
/** the dark ground of the orange line figures (a shade under the page) */
const COAT = ACCENT;
const COAT_SHADE = ACCENT_DEEP;
const COAT_FAR = "#B87108";
const MANE = "#2A1C0D";
const LEATHER = "#5A503C";
const CREAM_DEEP = "#D3C5A2";
const CREAM_HAIR = "#8C7F60";
const GLASS = "#070605";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const P = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
type Seg = [P2, P2];
type St = [P2, number];

/** the pen at a scale: S = screen px per unit of the group it draws in */
export type Pen = { S: number; px: (v: number) => number; w: (u: number, lo?: number, hi?: number) => number; vis: (u: number, a?: number, b?: number) => number };
export const mkPen = (S: number): Pen => ({
  S,
  /** v screen px, in units */
  px: (v) => v / S,
  /** a line u units wide, kept between lo and hi screen px */
  w: (u, lo = 1.2, hi = 3.4) => Math.min(hi, Math.max(lo, u * S)) / S,
  /** 0..1: a detail u units large is worth drawing (a px on screen .. a + b px) */
  vis: (u, a = 3, b = 3) => sstep((u * S - a) / b),
});

const smoothClosed = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`;
  }
  return `${d}Z`;
};
const polyD = (pts: P2[], close = false) => `M${pts.map(P).join("L")}${close ? "Z" : ""}`;
/** a tapered limb through stations [point, width]: one smooth outlined form */
const limbD = (st: St[]) => {
  const n = st.length;
  const L: P2[] = [];
  const R: P2[] = [];
  let last: P2 = [0, 1];
  for (let i = 0; i < n; i++) {
    const a = st[Math.max(0, i - 1)][0];
    const b = st[Math.min(n - 1, i + 1)][0];
    const dv = sub(b, a);
    const u = vlen(dv) > 0.05 ? norm(dv) : last;
    last = u;
    const nr: P2 = [-u[1], u[0]];
    const h = st[i][1] / 2;
    L.push(add(st[i][0], mul(nr, h)));
    R.push(add(st[i][0], mul(nr, -h)));
  }
  const d0 = sub(st[1][0], st[0][0]);
  const d1 = sub(st[n - 1][0], st[n - 2][0]);
  const u0: P2 = vlen(d0) > 0.05 ? norm(d0) : [0, 1];
  const u1: P2 = vlen(d1) > 0.05 ? norm(d1) : [0, 1];
  return smoothClosed([...L, add(st[n - 1][0], mul(u1, st[n - 1][1] * 0.42)), ...R.reverse(), add(st[0][0], mul(u0, -st[0][1] * 0.42))]);
};
/** two-bone IK; the middle joint goes to the side `hint` points at; the bones stretch a few % rather than miss */
const ik2 = (A: P2, W: P2, L1: number, L2: number, hint: P2) => {
  const d = sub(W, A);
  const L = Math.max(0.01, vlen(d));
  const k = Math.max(1, (L + 0.05) / (L1 + L2));
  const l1 = L1 * k;
  const l2 = L2 * k;
  const u = mul(d, 1 / L);
  const a = (l1 * l1 - l2 * l2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const n: P2 = [-u[1], u[0]];
  const b = clamp1((n[0] * hint[0] + n[1] * hint[1]) * 3);
  return add(A, add(mul(u, a), mul(n, h * b)));
};
/** hand-cut hatch lines at `ang` deg across a rect: the lines at offsets start + i step, each a hair off its place, ragged ends */
const hatchLines = (x0: number, y0: number, x1: number, y1: number, ang: number, start: number, step: number, seed: number, rag = 0.25): Seg[] => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const out: Seg[] = [];
  let i = 0;
  for (let o = -R + start; o <= R; o += step, i++) {
    const oo = o + (hash(i, seed) - 0.5) * step * 0.22;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    let t0 = -R;
    let t1 = R;
    if (Math.abs(dx) > 1e-6) {
      const a = (x0 - px) / dx;
      const b = (x1 - px) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (px < x0 || px > x1) continue;
    if (Math.abs(dy) > 1e-6) {
      const a = (y0 - py) / dy;
      const b = (y1 - py) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (py < y0 || py > y1) continue;
    const span = t1 - t0;
    if (span < step * 0.3) continue;
    t0 += hash(i, seed + 7) * rag * span;
    t1 -= hash(i, seed + 13) * rag * span;
    out.push([
      [px + dx * t0, py + dy * t0],
      [px + dx * t1, py + dy * t1],
    ]);
  }
  return out;
};
const segD = (segs: Seg[]) => segs.map(([a, b]) => `M${P(a)}L${P(b)}`).join("");
/** octave-stable hatching: lines `gap` apart, the lines between them fading in as the thing grows on screen */
const Hatch: React.FC<{ pen: Pen; box: [number, number, number, number]; ang: number; gap: number; seed: number; color?: string; w?: number; op?: number; rag?: number }> = ({
  pen,
  box,
  ang,
  gap,
  seed,
  color = DARK,
  w = 1.05,
  op = 0.6,
  rag = 0.25,
}) => {
  const out: React.ReactNode[] = [];
  for (let L = 0; L < 5; L++) {
    const g = gap / Math.pow(2, L);
    const a = L === 0 ? sstep((g * pen.S - 2.2) / 2) : sstep((g * pen.S - 4.2) / 3.2);
    if (a < 0.02) break;
    const segs = L === 0 ? hatchLines(box[0], box[1], box[2], box[3], ang, 0, g, seed, rag) : hatchLines(box[0], box[1], box[2], box[3], ang, g, 2 * g, seed + 17 * L, rag);
    out.push(<path key={L} d={segD(segs)} fill="none" stroke={color} strokeWidth={pen.px(w)} strokeOpacity={op * a} strokeLinecap="round" />);
  }
  return <>{out}</>;
};
const dirOf = (deg: number): P2 => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];

const GlassD: React.FC<{ pen: Pen; pts: P2[]; glint?: boolean }> = ({ pen, pts, glint = true }) => (
  <>
    <path d={polyD(pts, true)} fill={GLASS} stroke={INK} strokeWidth={Math.max(pen.px(1.2), 0.5)} strokeLinejoin="round" />
    {glint ? <path d={`M${P(mix2(pts[0], pts[2], 0.25))}L${P(mix2(pts[0], pts[2], 0.7))}`} stroke={INK} strokeWidth={Math.max(pen.px(1), 0.3)} strokeOpacity={0.7 * pen.vis(3, 3, 5)} strokeLinecap="round" /> : null}
  </>
);
/** a shard of obsidian: a ragged triangle or quad, r cm across */
export const Chip: React.FC<{ pen: Pen; at: P2; rot: number; r: number; seed: number }> = ({ pen, at, rot: a, r, seed }) => {
  const n = hash(seed, 3) > 0.45 ? 4 : 3;
  const pts = Array.from({ length: n }, (_, i): P2 => {
    const th = (i / n) * Math.PI * 2 + hash(seed, 10 + i) * 0.9;
    const rr = r * (0.55 + 0.6 * hash(seed, 20 + i));
    return [rr * Math.cos(th) * 1.25, rr * Math.sin(th) * 0.8];
  });
  return (
    <g transform={`translate(${P(at)}) rotate(${a.toFixed(2)})`}>
      <GlassD pen={pen} pts={pts} glint={n === 4} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// PROFILE HEADS (head units: (0, 0) = the middle of the face, ~0.59 cm; drawn
// facing + x, texcocoFigures' profile). kind "aztec": cream, a warrior's
// topknot, an ear plug. kind "spaniard": orange line on the dark ground, a
// beard, the crested morion in solid orange.
// ---------------------------------------------------------------------------
const FACE_P: P2[] = [[-2, -27], [8, -26.5], [15, -22], [18.5, -14], [19.5, -7], [18.5, -2], [19, 5], [19.5, 10], [20.5, 14.5], [19, 19], [18.5, 23.5], [13, 27.5], [4, 25.5], [-5, 20], [-9, 13], [-19, 12], [-25, 2], [-26, -10], [-21, -20], [-11, -26]];
const HAIR_P: P2[] = [[-24, 29], [-28, 18], [-29, 2], [-27, -14], [-19, -26], [-3, -31], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13.4], [14, -13], [11, -12.6], [8, -12], [4.5, -10.5], [1, -7], [-2, 0], [-4, 8], [-6, 16], [-9, 24], [-13, 30]];
const BEARD_P: P2[] = [[-8, 3], [-9, 14], [-5, 24], [4, 33], [14, 41], [18, 37], [20.5, 29], [21, 23], [20, 19.6], [18, 19.6], [15, 20], [12, 19], [6, 14], [-1, 7]];
const arc = (rx: number, ry: number, y0: number, n = 14) =>
  Array.from({ length: n + 1 }, (_, i): P2 => {
    const a = (-0.5 + i / n) * Math.PI;
    return [rx * Math.sin(a), y0 - ry * Math.cos(a)];
  });
const Head: React.FC<{ pen: Pen; kind: "aztec" | "spaniard"; uid: string; brow?: number; mouth?: number }> = ({ pen, kind, uid, brow = 0.4, mouth = -0.3 }) => {
  const az = kind === "aztec";
  const fill = INK;
  const line = DARK;
  const o = pen.w(2.1, 1.2, 3);
  const ln = (w: number, a: number) => ({ fill: "none", stroke: line, strokeWidth: pen.w(w, 0.9, 2.6), strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
  const fine = pen.vis(5, 3, 4); // the face's small marks
  const FACE = smoothClosed(FACE_P);
  const hair = az ? HAIR_P : HAIR_P.map((p, i): P2 => ([0, 21].includes(i) ? [p[0], p[1] - 15] : [1, 20].includes(i) ? [p[0], p[1] - 8] : p));
  const HAIR = smoothClosed(hair);
  const hb = Math.max(...hair.map((p) => p[1]));
  const tk = -5;
  const TOPKNOT = `M${tk - 7.5},-27C${tk - 8},-36 ${tk - 9},-41 ${tk - 13},-52Q${tk - 7},-58 ${tk},-55.5Q${tk + 7},-58.5 ${tk + 13},-52C${tk + 9},-41 ${tk + 8},-36 ${tk + 7.5},-27Z`;
  const BEARD = smoothClosed(BEARD_P);
  const w = 20.5;
  const COMB = `${polyD([...arc(w, 41, -22), ...arc(w * 0.9, 19.5, -22).reverse()])}Z`;
  const DOME = "M-24,-15C-26,-53 26,-53 24,-15Z";
  const BRIM = "M-38,-31Q-23.6,-9.6 0,-8.6Q26,-9.6 42,-32Q25.2,-19.4 0,-18.6Q-22.8,-19.4 -38,-31Z";
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <clipPath id={`${uid}-f`}>
        <path d={FACE} />
      </clipPath>
      <clipPath id={`${uid}-h`}>
        <path d={HAIR} />
      </clipPath>
      {az ? (
        <>
          <path d={TOPKNOT} fill={CREAM_HAIR} stroke={DARK} strokeWidth={o} />
          <clipPath id={`${uid}-tk`}>
            <path d={TOPKNOT} />
          </clipPath>
          <g clipPath={`url(#${uid}-tk)`}>
            <Hatch pen={pen} box={[tk - 14, -60, tk + 14, -26]} ang={90} gap={4.4} seed={71} w={1.1} op={0.8} rag={0.08} />
          </g>
          <path d={limbD([[[tk - 9.6, -38], 6.6], [[tk, -39], 6.8], [[tk + 9.6, -38], 6.6]])} fill={INK} stroke={DARK} strokeWidth={o} />
        </>
      ) : null}
      <path d={FACE} fill={fill} stroke={line} strokeWidth={o} />
      {az ? (
        <g clipPath={`url(#${uid}-f)`}>
          <Hatch pen={pen} box={[-27, -2, -8, 26]} ang={62} gap={5} seed={39} w={0.9} op={0.4} />
          <Hatch pen={pen} box={[-6, 20, 22, 29]} ang={4} gap={4} seed={26} w={0.9} op={0.45} />
        </g>
      ) : null}
      <path d={HAIR} fill={CREAM_HAIR} stroke={line} strokeWidth={o} />
      <g clipPath={`url(#${uid}-h)`}>
        <Hatch pen={pen} box={[-31, -32, 30, hb + 4]} ang={88} gap={4.3} seed={21} w={1.1} op={0.8} rag={0.1} />
      </g>
      {/* brow, eye, nose, mouth */}
      <path d={`M8.5,${(-6.8 - 1.6 * brow).toFixed(1)}Q13.4,-10 16.5,${(-5.4 + 3 * brow).toFixed(1)}`} {...ln(2.5, 0.92 * fine)} />
      <path d="M8.5,-0.4Q13,-5.2 14.5,0.2" {...ln(1.9, 0.92 * fine)} />
      <ellipse cx={13.6} cy={-0.3} rx={1.6} ry={2.1} fill={line} opacity={0.92 * fine} />
      <path d="M17.1,-4.6L26.8,8.2L22.8,10.9L15.2,9.8L15.2,-2Z" fill={fill} />
      <path d="M17.1,-4.6L26.8,8.2Q27.3,11 22.8,10.9Q18.6,11.3 15.2,9.8Q13.7,7.5 16.6,6.6" {...ln(1.7, 0.9)} />
      <path d={`M20.4,16Q18.8,14.7 13.5,${(15.7 - 1.8 * mouth).toFixed(1)}`} {...ln(2, 0.92 * fine)} />
      {az ? (
        <>
          <ellipse cx={-5} cy={4} rx={4.2} ry={6.4} fill={INK} stroke={DARK} strokeWidth={pen.w(1.8, 1, 2.6)} />
          <circle cx={-5} cy={10.6} r={4.3} fill={INK} stroke={DARK} strokeWidth={pen.w(1.9, 1, 2.6)} />
          <circle cx={-5} cy={10.6} r={1.3} fill={DARK} opacity={0.72} />
        </>
      ) : (
        <>
          <path d={BEARD} fill={CREAM_HAIR} stroke={DARK} strokeWidth={o} />
          <clipPath id={`${uid}-b`}>
            <path d={BEARD} />
          </clipPath>
          <g clipPath={`url(#${uid}-b)`}>
            <Hatch pen={pen} box={[-12, 0, 24, 44]} ang={80} gap={4.2} seed={73} w={1.1} op={0.8} rag={0.12} />
          </g>
          <path d={limbD([[[20.8, 13.2], 4.6], [[17.5, 13.6], 4.8], [[12.5, 18], 2.6]])} fill={CREAM_HAIR} stroke={DARK} strokeWidth={pen.w(1.5, 1, 2.4)} />
          {/* the morion: comb, dome, boat brim */}
          <g transform="translate(-2.5 0)">
            <clipPath id={`${uid}-dm`}>
              <path d={DOME} />
            </clipPath>
            <clipPath id={`${uid}-cb`}>
              <path d={COMB} />
            </clipPath>
            <path d={COMB} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={o} />
            <g clipPath={`url(#${uid}-cb)`}>
              <path d={[-0.34, -0.2, -0.07, 0.07, 0.2, 0.34].map((u) => `M${(w * 0.9 * Math.sin(u * Math.PI)).toFixed(1)},${(-22 - 23 * Math.cos(u * Math.PI)).toFixed(1)}L${(w * 0.9 * Math.sin(u * Math.PI)).toFixed(1)},${(-22 - 34.2 * Math.cos(u * Math.PI)).toFixed(1)}`).join("")} fill="none" stroke={DARK} strokeWidth={pen.px(1.05)} strokeOpacity={0.62 * pen.vis(8)} />
              <Hatch pen={pen} box={[w * 0.2, -62, w + 2, -22]} ang={112} gap={4.8} seed={77} w={0.9} op={0.5} />
            </g>
            <path d={DOME} fill={ACCENT} stroke={DARK} strokeWidth={o} />
            <g clipPath={`url(#${uid}-dm)`}>
              <Hatch pen={pen} box={[6, -46, 26, -15]} ang={108} gap={5} seed={74} w={0.95} op={0.6} />
              <path d="M-24,-23.5Q0,-28.5 24,-23.5" fill="none" stroke={DARK} strokeWidth={pen.w(1.2, 0.9, 2)} strokeOpacity={0.7} />
            </g>
            <path d={BRIM} fill={ACCENT} stroke={DARK} strokeWidth={o} />
            <path d="M-29.6,-20.6Q-15.2,-12.6 0,-12Q16.8,-12.6 32.8,-21" fill="none" stroke={DARK} strokeWidth={pen.px(0.95)} strokeOpacity={0.5 * pen.vis(8)} />
          </g>
        </>
      )}
    </g>
  );
};
/** cm per head unit */
const HEAD_CM = 0.56;

// ---------------------------------------------------------------------------
// THE HORSE (profile, facing screen LEFT; the saddle's middle over x = 0, the
// withers ~150 cm). A four-beat walk: phase 0..1 per stride.
// ---------------------------------------------------------------------------
const BODY_PTS: P2[] = [
  [-36, -153], [-48, -172], [-62, -188], [-77, -197], [-90, -198], [-101, -190], [-108, -174], [-113, -157], [-118, -141], [-121, -131],
  [-117, -123], [-110, -123], [-104, -131], [-97, -143], [-88, -155], [-82, -160], [-80, -146], [-81, -130], [-83, -116], [-77, -99],
  [-62, -85], [-38, -77], [-8, -74], [22, -75], [46, -81], [62, -94], [80, -103], [91, -119], [92, -138], [85, -153],
  [66, -162], [38, -159], [10, -153], [-14, -151],
];
/** how much each outline point goes with the head's nod (about the withers) */
const NOD_W = [0, 0.3, 0.62, 0.9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.75, 0.42, 0.15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const NOD_PIVOT: P2 = [-46, -150];
const ease = (v: number) => v * v * (3 - 2 * v);
const frac = (v: number) => v - Math.floor(v);
const STANCE = 0.62;
const STRIDE = 46;
/** the body rides this much lower than the outline was drawn (shorter legs), cm */
const DROP = 11;
/** a hoof's place and lift at phase u of its own cycle: x off its neutral place (cm; + = back), y (<= 0), swing 0..1 */
const footAt = (u0: number, liftH: number) => {
  const u = frac(u0);
  if (u < STANCE) return { x: -STRIDE / 2 + STRIDE * (u / STANCE), y: 0, sw: 0 };
  const v = (u - STANCE) / (1 - STANCE);
  return { x: STRIDE / 2 - STRIDE * ease(v), y: -liftH * Math.sin(Math.PI * v), sw: Math.sin(Math.PI * v) };
};
const horseRig = (phase: number) => {
  const bobRaw = 1.1 * Math.cos(4 * Math.PI * phase);
  const bob = bobRaw + DROP;
  const nod = 2.4 * Math.sin(4 * Math.PI * phase + 0.7);
  const nodPt = (p: P2, w: number): P2 => add(NOD_PIVOT, rot(sub(p, NOD_PIVOT), -nod * w));
  const body = BODY_PTS.map((p, i): P2 => add(nodPt(p, NOD_W[i]), [0, bob]));
  const head = (p: P2): P2 => add(nodPt(p, 1), [0, bob]);
  // a four-beat walk (near hind, near fore, far hind, far fore); the knee and the hock fold as the hoof is carried forward
  const fore = (ph: number) => {
    const f = footAt(ph, 17);
    const piv: P2 = [-61, -88 + bobRaw];
    const toe: P2 = [-66 + f.x, f.y];
    const fet = add(toe, rot([5, -13], -46 * f.sw));
    const knee = ik2(piv, fet, 43.5, 32, [-1, 0]);
    return { piv, knee, fet, toe, sw: f.sw };
  };
  const hind = (ph: number) => {
    const f = footAt(ph, 12);
    const piv: P2 = [58, -90 + bobRaw];
    const toe: P2 = [54 + f.x, f.y];
    const fet = add(toe, rot([5, -13], -34 * f.sw));
    const hock = ik2(piv, fet, 41, 39.5, [1, 0]);
    return { piv, hock, fet, toe, sw: f.sw };
  };
  return { bob, nod, body, head, foreN: fore(phase + 0.25), foreF: fore(phase + 0.75), hindN: hind(phase), hindF: hind(phase + 0.5) };
};
type HorseRigT = ReturnType<typeof horseRig>;
const hoofD = (fet: P2, toe: P2, sw: number) => {
  // planted: a hoof standing flat on the one ground line; carried: it hangs from the pastern
  if (sw < 0.02) return polyD([[toe[0] + 5.6, 0], [toe[0] - 6.6, 0], [toe[0] - 4.2, -7.6], [toe[0] + 4.2, -7.6]], true);
  const u = norm(sub(toe, fet));
  const n: P2 = [-u[1], u[0]];
  const c = mix2(fet, toe, 0.55);
  return polyD([add(c, mul(n, 4.3)), add(c, mul(n, -4.3)), add(add(toe, mul(u, 1)), mul(n, -5.4)), add(add(toe, mul(u, 1)), mul(n, 6.4))], true);
};

// ---------------------------------------------------------------------------
// THE HORSE (and, for the band, a plain rider with a lance). (0, 0) = the
// ground under the saddle. The engraved manner of the set: a solid ORANGE coat,
// deeper shade planes, a firm dark outline (1.2 cm, as the figures'), hatched
// shade, dark mane, tail and hooves. `rider` false = the saddle is left empty
// for the hero (cut A's conquistador is seated on it by the cut).
// ---------------------------------------------------------------------------
export const SADDLE_Y = -157 + DROP;
export const HorseRider: React.FC<{ pen: Pen; phase: number; uid: string; rider?: boolean; under?: React.ReactNode; reinTo?: P2 }> = ({ pen, phase, uid, rider = true, under, reinTo }) => {
  const r = horseRig(phase);
  const o = Math.max(pen.px(1.2), 1.2);
  const thin = Math.max(pen.px(1), 0.5);
  const hw = Math.max(1, 0.5 * pen.S);
  const OL = { stroke: DARK, strokeWidth: o, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const dl = (w: number, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });
  const big = pen.vis(40, 3, 5);
  const BODY_D = smoothClosed(r.body);
  const b = r.bob;
  const H = r.head;
  const drawFore = (l: HorseRigT["foreN"], far: boolean) => (
    <g>
      <path d={limbD([[add(l.piv, [1, -16]), 28], [l.piv, 23], [mix2(l.piv, l.knee, 0.6), 14.5], [mix2(l.piv, l.knee, 0.88), 10.2], [l.knee, 13.4], [mix2(l.knee, l.fet, 0.3), 8], [mix2(l.knee, l.fet, 0.8), 7.6], [l.fet, 10], [mix2(l.fet, l.toe, 0.5), 8]])} fill={far ? COAT_FAR : COAT} {...OL} />
      {!far ? <path d={`M${P(add(l.knee, [-4.4, -1]))}Q${P(add(l.knee, [0, 3.6]))} ${P(add(l.knee, [4.4, -1]))}`} {...dl(thin, 0.6 * big)} /> : null}
      <path d={hoofD(l.fet, l.toe, l.sw)} fill={MANE} {...OL} strokeWidth={o * 0.8} />
    </g>
  );
  const drawHind = (l: HorseRigT["hindN"], far: boolean) => (
    <g>
      <path d={limbD([[add(l.piv, [6, -26]), 44], [add(l.piv, [3, -4]), 35], [mix2(l.piv, l.hock, 0.55), 20], [mix2(l.piv, l.hock, 0.88), 12], [l.hock, 14.6], [mix2(l.hock, l.fet, 0.3), 8.6], [mix2(l.hock, l.fet, 0.8), 8], [l.fet, 10.4], [mix2(l.fet, l.toe, 0.5), 8.4]])} fill={far ? COAT_FAR : COAT} {...OL} />
      <path d={hoofD(l.fet, l.toe, l.sw)} fill={MANE} {...OL} strokeWidth={o * 0.8} />
    </g>
  );
  const sway = 3 * Math.sin(2 * Math.PI * phase + 1);
  const TAIL = limbD([[[86, -148 + b], 9], [[100, -136 + b], 14], [[109 + sway * 0.4, -108 + b], 17], [[108 + sway, -74 + b], 15], [[101 + sway * 1.6, -46 + b], 6]]);
  const crest: P2[] = [[-38, -154], [-48, -171], [-61, -186], [-76, -195], [-88, -197]];
  const MANE_D = limbD(crest.map((p, i): St => [add(H(p), [5.5, 6]), [10, 14, 15, 13, 8][i]]));
  const bit = H([-113, -128]);
  // the band's plain rider
  const hip: P2 = [1, -157 + b];
  const tor = (p: P2): P2 => add(hip, rot(p, -8));
  const shN = tor([-3, -55]);
  const knee: P2 = [-31, -131 + b];
  const ankle: P2 = [-28, -93 + b];
  const toe: P2 = [-45, -89 + b];
  const reinHand: P2 = reinTo ?? [-29, -170 + b];
  const elbowN = ik2(shN, reinHand, 30, 28, [0.4, 1]);
  const lanceHand: P2 = add(tor([-8, -22]), [-10, 0]);
  const LANCE_TOP: P2 = [lanceHand[0] + 6, lanceHand[1] - 215];
  const CUIR = `M${P(tor([-9, -60]))}Q${P(tor([-21, -52]))} ${P(tor([-21.5, -36]))}Q${P(tor([-23, -16]))} ${P(tor([-17, -7]))}L${P(tor([-10, -3]))}L${P(tor([12, -6]))}Q${P(tor([15, -32]))} ${P(tor([9, -58]))}Q${P(tor([1, -64]))} ${P(tor([-9, -60]))}Z`;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <clipPath id={`${uid}-hb`}>
        <path d={BODY_D} />
      </clipPath>
      {drawFore(r.foreF, true)}
      {drawHind(r.hindF, true)}
      {rider ? (
        <>
          <path d={`M${P(add(lanceHand, [-2, 70]))}L${P(LANCE_TOP)}`} {...dl(Math.max(pen.px(1.4), 3.2), 1)} />
          <path d={`M${P(add(lanceHand, [-2, 70]))}L${P(LANCE_TOP)}`} fill="none" stroke={CREAM_DEEP} strokeWidth={Math.max(pen.px(0.8), 1.6)} />
          <path d={`M${P(add(LANCE_TOP, [-3.6, 2]))}L${P(add(LANCE_TOP, [0.6, -24]))}L${P(add(LANCE_TOP, [4, 2]))}Z`} fill={ACCENT} {...OL} strokeWidth={o * 0.8} />
        </>
      ) : null}
      {under}
      <path d={TAIL} fill={MANE} {...OL} />
      <path d={`M${P([90, -142 + b])}Q${P([104, -116 + b])} ${P([104 + sway, -62 + b])}M${P([95, -140 + b])}Q${P([112, -112 + b])} ${P([107 + sway * 1.3, -70 + b])}`} fill="none" stroke={COAT_FAR} strokeWidth={thin} strokeOpacity={0.6 * pen.vis(20)} />
      <path d={BODY_D} fill={COAT} {...OL} />
      <g clipPath={`url(#${uid}-hb)`}>
        {/* the shade planes: under the barrel, the far side of the neck, the buttock */}
        <path d={`M${P([-78, -96 + b])}Q${P([-10, -100 + b])} ${P([64, -104 + b])}L${P([70, -60 + b])}L${P([-80, -60 + b])}Z`} fill={COAT_SHADE} />
        <path d={`M${P(H([-80, -164]))}Q${P(H([-70, -150]))} ${P([-66, -122 + b])}L${P([-90, -110 + b])}L${P(H([-90, -150]))}Z`} fill={COAT_SHADE} />
        <path d={`M${P([78, -150 + b])}Q${P([74, -124 + b])} ${P([82, -98 + b])}L${P([100, -100 + b])}L${P([100, -150 + b])}Z`} fill={COAT_SHADE} />
        <Hatch pen={pen} box={[-74, -100 + b, 64, -76 + b]} ang={24} gap={4.4} seed={51} w={hw} op={0.55} />
        <Hatch pen={pen} box={[70, -150 + b, 94, -98 + b]} ang={62} gap={4.6} seed={52} w={hw} op={0.5} />
        <Hatch pen={pen} box={[-90, -164 + b, -62, -110 + b]} ang={58} gap={4.6} seed={53} w={hw} op={0.5} />
        <Hatch pen={pen} box={[-112, -160 + b, -94, -126 + b]} ang={66} gap={4.4} seed={55} w={hw} op={0.4} />
        {/* the shoulder, the stifle and flank, the jaw */}
        <path d={`M${P([-50, -148 + b])}Q${P([-72, -130 + b])} ${P([-66, -102 + b])}`} {...dl(thin, 0.7 * big)} />
        <path d={`M${P([52, -152 + b])}Q${P([40, -124 + b])} ${P([54, -98 + b])}`} {...dl(thin, 0.65 * big)} />
        <path d={`M${P(H([-93, -186]))}Q${P(H([-80, -172]))} ${P(H([-88, -157]))}Q${P(H([-97, -146]))} ${P(H([-105, -132]))}`} {...dl(thin, 0.8 * big)} />
      </g>
      {drawHind(r.hindN, false)}
      {drawFore(r.foreN, false)}
      {/* the legs join the body without a seam */}
      <ellipse cx={-60} cy={-121 + b} rx={15} ry={9.5} fill={COAT} />
      <ellipse cx={63} cy={-131 + b} rx={21} ry={10} fill={COAT} />
      {/* the mane, the forelock, the ears */}
      <path d={MANE_D} fill={MANE} {...OL} />
      <path d={crest.slice(1).map((p, i) => `M${P(add(H(p), [1, 2]))}l${(7 + 2 * hash(i, 3)).toFixed(1)},${(9 + 2 * Math.sin(2 * Math.PI * phase + i)).toFixed(1)}`).join("")} fill="none" stroke={COAT_FAR} strokeWidth={thin} strokeOpacity={0.6 * pen.vis(20)} />
      <path d={`M${P(H([-81, -198]))}Q${P(H([-80, -212]))} ${P(H([-75, -216]))}Q${P(H([-72, -206]))} ${P(H([-73, -196]))}`} fill={COAT_FAR} {...OL} />
      <path d={`M${P(H([-91, -198]))}Q${P(H([-92, -213]))} ${P(H([-86, -219]))}Q${P(H([-81, -208]))} ${P(H([-81, -197]))}Z`} fill={COAT} {...OL} />
      <path d={limbD([[H([-88, -197]), 7], [H([-97, -193]), 8], [H([-102, -183]), 4]])} fill={MANE} {...OL} />
      {/* the eye (a cream glint), the nostril, the mouth */}
      <g opacity={pen.vis(5, 2, 3)}>
        <path d={`M${P(H([-104, -178]))}Q${P(H([-100, -182]))} ${P(H([-95.6, -178.6]))}Q${P(H([-100, -175.6]))} ${P(H([-104, -178]))}Z`} fill={DARK} />
        <circle cx={H([-100.8, -179.4])[0]} cy={H([-100.8, -179.4])[1]} r={0.95} fill={INK} />
        <path d={`M${P(H([-106, -181.6]))}Q${P(H([-100, -185.6]))} ${P(H([-94, -181.6]))}`} {...dl(thin, 0.8 * pen.vis(8))} />
      </g>
      <path d={`M${P(H([-119.6, -134]))}Q${P(H([-115.6, -135.6]))} ${P(H([-116, -130.6]))}`} {...dl(Math.max(pen.px(1), 0.9), 0.95 * pen.vis(5))} />
      <path d={`M${P(H([-119.6, -126.4]))}Q${P(H([-115, -127]))} ${P(H([-110, -128]))}`} {...dl(thin, 0.85 * pen.vis(8))} />
      {/* the bridle, the bit, the rein, the breast strap: dark leather */}
      <path d={`M${P(H([-86, -195]))}Q${P(H([-92, -164]))} ${P(bit)}M${P(H([-115.6, -148]))}L${P(H([-99, -142]))}M${P(H([-99, -190]))}L${P(H([-86, -187]))}`} {...dl(Math.max(pen.px(1.1), 1.3), 0.95)} />
      <circle cx={bit[0]} cy={bit[1]} r={2.7} fill={ACCENT} {...OL} strokeWidth={o * 0.7} />
      <path d={`M${P(bit)}Q${P([-74, -146 + b])} ${P(reinHand)}`} {...dl(Math.max(pen.px(0.9), 1.2), 0.95)} />
      <path d={`M${P([-20, -144 + b])}Q${P([-52, -128 + b])} ${P([-81, -120 + b])}`} {...dl(Math.max(pen.px(1.6), 1.5), 0.95)} />
      {/* the war saddle: a cloth, a high pommel and cantle */}
      <path d={`M${P([-25, -151 + b])}L${P([28, -154 + b])}Q${P([33, -136 + b])} ${P([29, -122 + b])}L${P([-22, -119 + b])}Q${P([-27, -135 + b])} ${P([-25, -151 + b])}Z`} fill={CREAM_DEEP} {...OL} />
      <path d={`M${P([-21, -124 + b])}L${P([28, -127 + b])}`} {...dl(thin, 0.6 * big)} />
      <path d={`M${P([-23, -152 + b])}Q${P([-25, -172 + b])} ${P([-16, -173 + b])}Q${P([-10, -158 + b])} ${P([2, -157 + b])}Q${P([14, -158 + b])} ${P([21, -178 + b])}Q${P([31, -174 + b])} ${P([27, -151 + b])}Q${P([2, -144 + b])} ${P([-23, -152 + b])}Z`} fill={LEATHER} {...OL} />
      {rider ? (
        <>
          {/* the near leg in hose and a boot, the stirrup */}
          <path d={limbD([[add(hip, [0, 1]), 19], [mix2(hip, knee, 0.5), 17], [knee, 14], [mix2(knee, ankle, 0.5), 12.5], [ankle, 9.6]])} fill={INK} {...OL} />
          <path d={limbD([[add(ankle, [3, 0]), 9.4], [mix2(ankle, toe, 0.6), 8.4], [toe, 6.4]])} fill={LEATHER} {...OL} />
          <path d={`M${P([-8, -146 + b])}L${P(add(ankle, [-9, 9]))}`} {...dl(Math.max(pen.px(0.8), 1), 0.9)} />
          <path d={limbD([[add(hip, [3, -3]), 22], [mix2(hip, knee, 0.34), 25], [mix2(hip, knee, 0.62), 19]])} fill={CREAM_DEEP} {...OL} />
          <path d={[-0.3, 0, 0.3].map((u) => `M${P(add(mix2(hip, knee, 0.06), [u * 4, u * 18]))}Q${P(add(mix2(hip, knee, 0.34), [u * 6, u * 26]))} ${P(add(mix2(hip, knee, 0.6), [u * 4, u * 16]))}`).join("")} {...dl(thin, 0.7 * big)} />
          <clipPath id={`${uid}-cu`}>
            <path d={CUIR} />
          </clipPath>
          <path d={`M${P(tor([-17, -8]))}L${P(tor([10, -7]))}L${P(tor([9, 6]))}L${P(tor([-19, 8]))}Z`} fill={ACCENT_DEEP} {...OL} />
          <path d={CUIR} fill={ACCENT} {...OL} />
          <g clipPath={`url(#${uid}-cu)`}>
            <Hatch pen={pen} box={[hip[0] - 4, hip[1] - 62, hip[0] + 20, hip[1]]} ang={104} gap={3.4} seed={44} w={hw} op={0.55} />
          </g>
          <g transform={`translate(${P(add(tor([-5, -79]), [-1, 0]))}) rotate(-4) scale(${-HEAD_CM} ${HEAD_CM})`}>
            <Head pen={mkPen(pen.S * HEAD_CM)} kind="spaniard" uid={`${uid}-hd`} />
          </g>
          <path d={limbD([[shN, 13.5], [mix2(shN, elbowN, 0.45), 13], [elbowN, 10.5], [mix2(elbowN, reinHand, 0.4), 10], [reinHand, 7.6]])} fill={CREAM_DEEP} {...OL} />
          <path d={limbD([[mix2(elbowN, reinHand, 0.8), 8.6], [reinHand, 8.6], [add(reinHand, mul(norm(sub(reinHand, elbowN)), 6)), 8]])} fill={INK} {...OL} />
          <path d={limbD([[add(shN, [-8, 4]), 8], [add(shN, [0, -4]), 13], [add(shN, [8, 4]), 8]])} fill={ACCENT} {...OL} />
        </>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// A CONQUISTADOR ON FOOT, marching to screen LEFT with his pike shouldered.
// (0, 0) = the ground under his hips. phase 0..1 per two steps.
// ---------------------------------------------------------------------------
export const FootSoldier: React.FC<{ pen: Pen; phase: number; uid: string; tilt?: number }> = ({ pen, phase, uid, tilt = 0 }) => {
  const o = Math.max(pen.px(1.1), 1.2);
  const hw = Math.max(1, 0.5 * pen.S);
  const OL = { stroke: DARK, strokeWidth: o, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const bobv = 1.5 * Math.cos(4 * Math.PI * phase);
  const hip: P2 = [0, -88 + bobv];
  const leg = (u0: number, far: boolean) => {
    const u = frac(u0);
    const st = u < 0.5;
    const v = st ? u / 0.5 : (u - 0.5) / 0.5;
    const fx = st ? -19 + 38 * v : 19 - 38 * ease(v);
    const fy = st ? 0 : -9 * Math.sin(Math.PI * v);
    const an: P2 = [fx + 2, -7 + fy];
    const kn = ik2(hip, an, 42, 41, [-1, 0]);
    return (
      <g>
        <path d={limbD([[hip, 16], [mix2(hip, kn, 0.5), 15], [kn, 11.5], [mix2(kn, an, 0.4), 12], [an, 8]])} fill={far ? CREAM_DEEP : INK} {...OL} />
        <path d={limbD([[add(an, [3, 3]), 7.5], [add(an, [-5, 5]), 7], [add(an, [-13, 6]), 5]])} fill={LEATHER} {...OL} />
      </g>
    );
  };
  const tor = (p: P2): P2 => add(hip, rot(p, -3));
  const sh = tor([-2, -52]);
  const hand: P2 = [-15, -118 + bobv];
  const el = ik2(sh, hand, 29, 27, [0.5, 1]);
  const pikeA = add(hand, mul(dirOf(-97 + tilt), -72));
  const pikeB = add(hand, mul(dirOf(-97 + tilt), 250));
  const pd = norm(sub(pikeB, pikeA));
  const pn: P2 = [-pd[1], pd[0]];
  const CUIR = `M${P(tor([-8, -58]))}Q${P(tor([-19, -50]))} ${P(tor([-19, -34]))}Q${P(tor([-20, -15]))} ${P(tor([-14, -6]))}L${P(tor([12, -7]))}Q${P(tor([14, -32]))} ${P(tor([9, -56]))}Q${P(tor([1, -62]))} ${P(tor([-8, -58]))}Z`;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {leg(phase + 0.5, true)}
      <path d={`M${P(pikeA)}L${P(pikeB)}`} fill="none" stroke={DARK} strokeWidth={Math.max(pen.px(1.4), 3.2)} />
      <path d={`M${P(pikeA)}L${P(pikeB)}`} fill="none" stroke={CREAM_DEEP} strokeWidth={Math.max(pen.px(0.8), 1.6)} />
      <path d={`M${P(add(pikeB, mul(pn, -3.4)))}L${P(add(pikeB, mul(pd, 24)))}L${P(add(pikeB, mul(pn, 3.4)))}Z`} fill={ACCENT} {...OL} strokeWidth={o * 0.8} />
      {leg(phase, false)}
      <path d={limbD([[add(hip, [-10, 2]), 20], [add(hip, [0, 6]), 24], [add(hip, [10, 2]), 20]])} fill={CREAM_DEEP} {...OL} />
      <path d={CUIR} fill={ACCENT} {...OL} />
      <clipPath id={`${uid}-cu`}>
        <path d={CUIR} />
      </clipPath>
      <g clipPath={`url(#${uid}-cu)`}>
        <Hatch pen={pen} box={[hip[0] - 2, hip[1] - 60, hip[0] + 18, hip[1]]} ang={104} gap={3.4} seed={44} w={hw} op={0.55} />
      </g>
      <g transform={`translate(${P(tor([-4, -76]))}) rotate(-3) scale(${-HEAD_CM} ${HEAD_CM})`}>
        <Head pen={mkPen(pen.S * HEAD_CM)} kind="spaniard" uid={`${uid}-hd`} />
      </g>
      <path d={limbD([[sh, 13], [mix2(sh, el, 0.45), 12.4], [el, 10], [mix2(el, hand, 0.4), 9.6], [hand, 7.4]])} fill={CREAM_DEEP} {...OL} />
      <path d={limbD([[mix2(el, hand, 0.8), 8.4], [hand, 8.4], [add(hand, mul(norm(sub(hand, el)), 6)), 8]])} fill={INK} {...OL} />
      <path d={limbD([[add(sh, [-8, 4]), 8], [add(sh, [0, -4]), 12.5], [add(sh, [8, 4]), 8]])} fill={ACCENT} {...OL} />
    </g>
  );
};

