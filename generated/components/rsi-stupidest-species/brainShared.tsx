// ---------------------------------------------------------------------------
// brainShared (rsi-stupidest-species, W3): THE BRAIN of the clip, used by cuts D, E, I1 and I2, plus the PELVIS ring
// for cut I1. Dwarkesh 3D style (styles/dwarkesh-3d.md), painted by the cast's hand (kyle-pandemics/pandemicFolkPaint:
// flat matte fills, ONE soft crescent shadow per part from the upper left, the gouache texture filter, no outline).
//
// THE BRAIN: one clean drawn brain icon in side view, facing LEFT (frontal lobe at the left): a smooth bean
// silhouette, six soft fold lines in a darker local tone, the cerebellum tucked under the back and a short brain stem,
// flat warm pink-oatmeal (#D9B8A8 family), a cream rim along the upper-left edge. Approved direction (sister clip): "a
// clean drawn brain icon: smooth outline, few folds, cerebellum + stem". Reads as a brain from ~60 px wide.
//
// API (all lengths in the units of the svg it is drawn in: screen px, or world units inside a WorldSvg)
//   <Brain x y size uid unitPx? glow? swell? squashX? squashY? pivot? variant? fog? rot? stem? opacity? halo? />
//     x, y     the ANCHOR: bottom centre (x = the centre of the brain's bounding box, y = its lowest point, the stem's
//              tip). Stand it on a plinth top: y = the plinth's top row.
//     size     the bounding-box WIDTH at swell 0 (height = size * BRAIN_ASPECT)
//     unitPx   screen px per unit of the parent svg (inside a WorldSvg: cam.k [x the depth ratio r for a perspective
//              placement]) so the paint's texture, the crescent's softness and the fold lines stay in screen px
//     glow     0..1: an orange light from INSIDE (intelligence): the pink shell stays, a warm core shows through it,
//              the fold lines turn orange (the AirStage bloom picks them up), a faint orange halo behind
//     swell    0..1+: the brain grows (x 1 + 0.6 swell about its anchor) and rounds out (the bean bulges toward a ball,
//              folds carried along); squashX / squashY (default 1) a soft squash on top when it presses on something,
//              about `pivot` ("bottom" = the anchor, default; "center" = the box centre)
//     variant  0 | 1: two near-identical brains; v1 differs from v0 by two fold lines only (the frontal and the
//              parietal fold). Cut D puts v0 left and v1 right; cut E keeps the same two above ME and EINSTEIN.
//     fog      { rgb: "#hex", amount } (a RomeFolk / AirWorld folkFog): every colour mixed toward the air
//     rot      degrees about the box centre (falls, tilts); stem false hides the brain stem (a ball-like brain)
//     halo     multiplier on the glow halo (default 1); opacity the whole brain
//   BRAIN_ASPECT                height / width (~0.75)
//   brainBox(size, swell?, squashX?, squashY?, pivot?) -> { w, h, top, cy, left, right }: the box relative to the anchor
//              (top, cy negative = up), for placing columns, labels and collisions
//   <BrainShadow x y size amt? color? />   its soft contact shadow on a flat 2D floor row (in a depth cut use the kit's
//              AirShadow under the anchor: w = 0.42 size, d = 0.16 size, amt ~0.75)
//
// THE PELVIS (cut I1): a stylised human pelvis seen from the front as one cream-ivory bone ring: two flared iliac
// wings, the sacrum closing the ring at the top, the round pelvic INLET as a clear opening in the middle, two small
// obturator holes low down, a soft fold inside each wing. Clean, not anatomical-gory; the same paint.
//   <Pelvis x y size uid unitPx? inlet? fog? part? opacity? />
//     x, y     the ANCHOR: the inlet's centre; size the pelvis' width (height = size * PELVIS_ASPECT)
//     inlet    the inlet's radius as a fraction of size (default PELVIS_INLET = 0.22; the sacrum's tip reaches ~0.025
//              size into its top, the rest of the opening is clear)
//     part     "all" (default) | "back" | "front": "front" is the ring below the inlet's centre row (the pubic arch
//              and the lower rim), "back" everything else, so a brain can be drawn between them and sit IN the opening
//   PELVIS_ASPECT, PELVIS_INLET, pelvisInlet(size, inlet?) -> { cx: 0, cy: 0, r } relative to the anchor
//
// Probe: brainProbe.tsx (src/Root.RsiBrainProbe.tsx); stills in animation_source/notes/brain_probe_*.png; notes
// BRAIN_READY.md. Shared module: additions keep the old names (COMMON.md, SHARED_CHANGES.md).
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, Paint } from "../kits/dwarkesh-3d/dwarkesh3d";

type P2 = [number, number];
type Fog = { rgb: string | [number, number, number]; amount: number };
const mixC = Paint.mixC;
const toHex = (c: [number, number, number]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const fogOf = (f?: Fog) => (f ? { hex: typeof f.rgb === "string" ? f.rgb : toHex(f.rgb), a: Math.max(0, Math.min(1, f.amount)) } : null);
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const pt = (p: P2) => `${n3(p[0])},${n3(p[1])}`;

/** a smooth closed path through points (Catmull-Rom as cubic Beziers, tension 1/6) */
const smoothClosed = (q: P2[], t = 1 / 6) => {
  const n = q.length;
  let d = `M${pt(q[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n];
    const p1 = q[i];
    const p2 = q[(i + 1) % n];
    const p3 = q[(i + 2) % n];
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return `${d}Z`;
};
/** a smooth open path through points */
const smoothOpen = (q: P2[], t = 1 / 6) => {
  const n = q.length;
  let d = `M${pt(q[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = q[Math.max(0, i - 1)];
    const p1 = q[i];
    const p2 = q[i + 1];
    const p3 = q[Math.min(n - 1, i + 2)];
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
};
/** a tapered brush stroke along a smooth run: width w (units) in the middle, pointed ends */
const taperD = (q: P2[], w: number) => {
  // sample the centre line (Catmull-Rom), offset by the normal with a sine profile
  const N = 28;
  const n = q.length;
  const at = (u: number): P2 => {
    const s = Math.min(n - 1.0001, Math.max(0, u * (n - 1)));
    const i = Math.floor(s);
    const t = s - i;
    const p0 = q[Math.max(0, i - 1)];
    const p1 = q[i];
    const p2 = q[i + 1];
    const p3 = q[Math.min(n - 1, i + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
    return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
  };
  const pts = Array.from({ length: N + 1 }, (_, i) => at(i / N));
  const L: P2[] = [];
  const R: P2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(N, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const hw = (w / 2) * Math.pow(Math.sin((Math.PI * i) / N), 0.6);
    L.push([p[0] - (dy / l) * hw, p[1] + (dx / l) * hw]);
    R.push([p[0] + (dy / l) * hw, p[1] - (dx / l) * hw]);
  });
  return `M${[...L, ...R.reverse()].map(pt).join("L")}Z`;
};
const signedArea = (q: P2[]) => q.reduce((s, p, i) => s + p[0] * q[(i + 1) % q.length][1] - q[(i + 1) % q.length][0] * p[1], 0) / 2;

// ===================================================================================================================
// THE BRAIN: geometry in brain units (side view, facing left; x right, y down). Shifted below so the anchor (bottom
// centre of the box) is the origin.
// ===================================================================================================================
const CEREBRUM: P2[] = [
  [-440, -432], // frontal underside
  [-494, -548],
  [-506, -660], // frontal pole, rounding up
  [-468, -772],
  [-385, -862],
  [-240, -930],
  [-40, -955],
  [170, -925],
  [340, -847],
  [465, -717],
  [505, -578], // occipital pole
  [460, -462],
  [350, -407], // occipital underside (the cerebellum tucks under here)
  [205, -357],
  [60, -306], // temporal underside
  [-95, -287],
  [-215, -306],
  [-292, -356], // temporal pole
  [-352, -412], // the notch at the Sylvian fissure's mouth (a slight concavity)
];
/** the cream rim: the upper-left run of the outline (frontal underside, up the front, over the top) */
const RIM_RUN: P2[] = [
  [-466, -482],
  [-497, -560],
  [-502, -660],
  [-466, -770],
  [-384, -858],
  [-240, -925],
  [-40, -950],
  [130, -930],
];
const CEREBELLUM: P2[] = [
  [140, -335],
  [205, -402],
  [330, -424],
  [445, -392],
  [492, -324],
  [458, -244],
  [350, -200],
  [230, -198],
  [150, -252],
];
const STEM: P2[] = [
  [62, -322],
  [205, -350],
  [222, -262],
  [212, -212],
  [190, -196],
  [140, -197],
  [114, -238],
  [90, -282],
];
/** the folds: smooth open runs (the same four on both variants; the frontal and parietal folds differ on v1) */
const FOLDS_BASE: Record<string, P2[]> = {
  sylvian: [
    [-345, -414],
    [-220, -462],
    [-80, -500],
    [62, -546],
    [150, -606],
    [168, -662],
  ],
  central: [
    [-30, -950],
    [-58, -862],
    [-112, -792],
    [-114, -700],
    [-82, -626],
  ],
  temporal: [
    [-205, -348],
    [-70, -380],
    [100, -416],
    [232, -452],
    [330, -502],
  ],
  occipital: [
    [456, -650],
    [392, -606],
    [378, -530],
  ],
};
const FOLDS_V: Record<0 | 1, Record<string, P2[]>> = {
  0: {
    frontal: [
      [-432, -742],
      [-346, -736],
      [-286, -676],
      [-276, -590],
    ],
    parietal: [
      [215, -912],
      [175, -830],
      [210, -756],
      [320, -706],
    ],
  },
  1: {
    frontal: [
      [-447, -680],
      [-360, -702],
      [-296, -642],
      [-312, -556],
    ],
    parietal: [
      [190, -918],
      [238, -836],
      [180, -760],
      [246, -680],
      [336, -662],
    ],
  },
};
/** the cerebellum's folia: soft arcs across it */
const FOLIA: P2[][] = [
  [
    [205, -362],
    [320, -374],
    [440, -342],
  ],
  [
    [190, -292],
    [320, -302],
    [470, -284],
  ],
  [
    [240, -234],
    [350, -238],
    [440, -240],
  ],
];
// THE GEOMETRY OF ONE BRAIN at a swell: the cerebrum bulges toward a ball about its centre, normalised back to its
// own width (the size is the `size` prop's job), the cerebellum and the stem ride along with the underside, and the
// whole is shifted so the anchor (bottom centre of the box) is the origin. Its bottom is where the cerebellum and the
// stem rest (both touch the floor row, so the brain sits on its underside, not perched on a stalk).
const CER_C0: P2 = [-10, -620];
const UNDER: P2 = [205, -357];
const hull = (q: P2[]) => ({ x0: Math.min(...q.map((p) => p[0])), x1: Math.max(...q.map((p) => p[0])), y0: Math.min(...q.map((p) => p[1])), y1: Math.max(...q.map((p) => p[1])) });
const CER_W0 = (() => {
  const h = hull(CEREBRUM);
  return h.x1 - h.x0;
})();
type BrainGeom = { map: (p: P2) => P2; cer: P2[]; cerebellum: P2[]; stem: P2[]; w: number; h: number; cy: number };
const geomCache = new Map<string, BrainGeom>();
const brainGeom = (swell: number, stem: boolean): BrainGeom => {
  const key = `${swell.toFixed(4)}|${stem}`;
  const hit = geomCache.get(key);
  if (hit) return hit;
  const bul = 0.14 * Math.max(0, swell);
  const R0 = 470;
  const raw = (p: P2): P2 => {
    if (bul <= 0) return p;
    const dx = p[0] - CER_C0[0];
    const dy = p[1] - CER_C0[1];
    const r = Math.hypot(dx, dy) || 1;
    const target = r + (R0 - r) * Math.min(1, bul * 2.2) + R0 * bul * 0.25;
    return [CER_C0[0] + (dx * target) / r, CER_C0[1] + (dy * target) / r];
  };
  const hb = hull(CEREBRUM.map(raw));
  const sn = CER_W0 / (hb.x1 - hb.x0);
  const m0 = (p: P2): P2 => {
    const q = raw(p);
    return [CER_C0[0] + (q[0] - CER_C0[0]) * sn, CER_C0[1] + (q[1] - CER_C0[1]) * sn];
  };
  const u = m0(UNDER);
  const ride = (p: P2): P2 => [p[0] + u[0] - UNDER[0], p[1] + u[1] - UNDER[1]];
  const cer0 = CEREBRUM.map(m0);
  const cb0 = CEREBELLUM.map(ride);
  const st0 = STEM.map(ride);
  const H = hull([...cer0, ...cb0, ...(stem ? st0 : [])]);
  const sx = -(H.x0 + H.x1) / 2;
  const sy = -H.y1;
  const sh = (p: P2): P2 => [p[0] + sx, p[1] + sy];
  const g: BrainGeom = { map: (p) => sh(m0(p)), cer: cer0.map(sh), cerebellum: cb0.map(sh), stem: st0.map(sh), w: H.x1 - H.x0 + 8, h: H.y1 - H.y0 + 4, cy: -(H.y1 - H.y0) / 2 };
  geomCache.set(key, g);
  return g;
};
const G0 = brainGeom(0, true);
/** height / width of the brain's box at swell 0 */
export const BRAIN_ASPECT = G0.h / G0.w;

/** the colours (local, before fog and glow) */
export const BRAIN_INK = {
  shell: "#D9B8A8",
  cerebellum: "#CFA897",
  stem: "#C59C8B",
  fold: "#9E7469",
  folia: "#99705F",
  rim: "#F3EBDD",
  core: "#FFC861",
};

/** the brain's box relative to its anchor (top, cy negative = up), in the parent's units */
export const brainBox = (size: number, swell = 0, squashX = 1, squashY = 1, pivot: "bottom" | "center" = "bottom") => {
  const G = brainGeom(swell, true);
  const s = (size / G0.w) * (1 + 0.6 * Math.max(0, swell));
  const w = G.w * s * squashX;
  const h0 = G.h * s;
  const h = h0 * squashY;
  const base = pivot === "bottom" ? 0 : (-h0 / 2) * (1 - squashY);
  return { w, h, top: base - h, cy: base - h / 2, left: -w / 2, right: w / 2 };
};

export const Brain: React.FC<{
  x: number;
  y: number;
  size: number;
  uid: string;
  unitPx?: number;
  glow?: number;
  swell?: number;
  squashX?: number;
  squashY?: number;
  pivot?: "bottom" | "center";
  variant?: 0 | 1;
  fog?: Fog;
  rot?: number;
  stem?: boolean;
  opacity?: number;
  halo?: number;
}> = ({ x, y, size, uid, unitPx = 1, glow = 0, swell = 0, squashX = 1, squashY = 1, pivot = "bottom", variant = 0, fog, rot = 0, stem = true, opacity = 1, halo = 1 }) => {
  const gl = Math.max(0, Math.min(1, glow));
  const g = 1 + 0.6 * Math.max(0, swell);
  const G = brainGeom(swell, stem);
  const scale = (size / G0.w) * g;
  const f = fogOf(fog);
  const fogC = (c: string, k = 1) => (f ? mixC(c, f.hex, f.a * k) : c);
  const cerD = smoothClosed(G.cer);
  const folds = { ...FOLDS_BASE, ...FOLDS_V[variant] };
  // the shell warms a touch as the core lights; the folds turn orange
  const shell = fogC(mixC(BRAIN_INK.shell, "#E8B48E", 0.28 * gl));
  const foldC = fogC(mixC(BRAIN_INK.fold, ACCENT_DEEP, Math.min(1, gl * 1.15)), 0.5);
  const foldHot = fogC(mixC(ACCENT_DEEP, ACCENT, gl), 0.4);
  const px = Math.max(0.2, (size * g * unitPx) / 520);
  const shapes: Paint.Shape[] = [];
  shapes.push({ d: smoothClosed(G.cerebellum), fill: fogC(BRAIN_INK.cerebellum), sh: 3.2 });
  const dCb: P2 = [G.cerebellum[0][0] - CEREBELLUM[0][0], G.cerebellum[0][1] - CEREBELLUM[0][1]];
  for (const fl of FOLIA) shapes.push({ d: smoothOpen(fl.map((p) => [p[0] + dCb[0], p[1] + dCb[1]] as P2)), fill: fogC(BRAIN_INK.folia), det: 3.4, keep: true, op: 0.5 });
  if (stem) shapes.push({ d: smoothClosed(G.stem), fill: fogC(BRAIN_INK.stem), sh: 2.6 });
  shapes.push({ d: cerD, fill: shell, sh: 4.2 });
  // the inner light: a warm core showing through the shell (no crescent on it)
  if (gl > 0.002) shapes.push({ d: cerD, fill: `url(#${uid}core)`, sh: 0, op: Math.min(1, gl * 1.05) });
  // fold width: ~13 units, never thinner than ~1.7 screen px (so they still read at 60 px)
  const pxPerUnit = scale * unitPx;
  const fw = Math.max(13, 1.7 / pxPerUnit);
  for (const k of Object.keys(folds)) {
    const run = folds[k].map(G.map);
    shapes.push({ d: taperD(run, fw), fill: foldC, sh: 0, op: 0.6 + 0.3 * gl });
    if (gl > 0.002) shapes.push({ d: taperD(run, fw * 0.5), fill: foldHot, sh: 0, op: 0.9 * gl });
  }
  const cc = G.map(CER_C0);
  shapes.push({ d: smoothOpen(RIM_RUN.map(G.map).map((p) => [cc[0] + (p[0] - cc[0]) * 0.975, cc[1] + (p[1] - cc[1]) * 0.975] as P2)), fill: fogC(BRAIN_INK.rim, 0.8), det: 3.2, keep: true, op: 0.55 });
  // transforms: squash about the pivot, rotation about the box centre
  const cy = G.cy * scale;
  const pvY = pivot === "bottom" ? 0 : cy;
  const tf = `translate(${n3(x)} ${n3(y)}) rotate(${n3(rot)} 0 ${n3(cy)}) translate(0 ${n3(pvY)}) scale(${n3(squashX)} ${n3(squashY)}) translate(0 ${n3(-pvY)})`;
  const haloA = 0.6 * gl * halo * (f ? 1 - 0.5 * f.a : 1);
  const coreC = fogC(BRAIN_INK.core, 0.4);
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={`${uid}core`} cx="0.47" cy="0.55" r="0.62">
          <stop offset="0" stopColor={coreC} stopOpacity={0.62} />
          <stop offset="0.45" stopColor={coreC} stopOpacity={0.34} />
          <stop offset="1" stopColor={coreC} stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}aura`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={n3(Math.max(1, (0.05 * size * g) / scale))} />
        </filter>
      </defs>
      <g transform={tf}>
        {haloA > 0.002 ? (
          <g transform={`scale(${n3(scale)})`} opacity={n3(haloA)}>
            <path d={cerD} fill={ACCENT} filter={`url(#${uid}aura)`} />
          </g>
        ) : null}
        <Paint.FolkPaint shapes={shapes} x={0} y={0} scale={scale} uid={uid} px={px} unitPx={unitPx} />
      </g>
    </g>
  );
};

/** a soft contact shadow for a brain standing at (x, y) on a flat 2D floor row */
export const BrainShadow: React.FC<{ x: number; y: number; size: number; uid: string; amt?: number; color?: string }> = ({ x, y, size, uid, amt = 0.7, color = "#22180F" }) => (
  <g>
    <defs>
      <radialGradient id={`${uid}bs`}>
        <stop offset="0" stopColor={color} stopOpacity={0.6 * amt} />
        <stop offset="0.6" stopColor={color} stopOpacity={0.3 * amt} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x + 0.07 * size} cy={y + 0.012 * size} rx={0.42 * size} ry={0.07 * size} fill={`url(#${uid}bs)`} />
  </g>
);

// ===================================================================================================================
// THE PELVIS: front view, origin at the inlet's centre, width 1000 units (x -500..500)
// ===================================================================================================================
export const PELVIS_INLET = 0.22;
/** one hip bone's outer contour, right half (x >= 0), top (beside the sacrum) to bottom centre (the symphysis) */
const HIP_R: P2[] = [
  [118, -292], // the sacroiliac joint
  [226, -420], // the crest rising
  [378, -478],
  [482, -420],
  [506, -300], // the front of the crest
  [470, -200],
  [440, -108],
  [454, 12], // the hip socket's bulge
  [430, 142],
  [382, 272],
  [334, 398], // the ischium
  [272, 440],
  [202, 420],
  [140, 372], // up the pubic arch
  [72, 316],
  [0, 302], // the symphysis
];
const PELVIS_OUT: P2[] = [...HIP_R, ...HIP_R.slice(0, -1).reverse().map(([x, y]) => [-x, y] as P2), [0, -262]];
/** the sacrum, behind the ring, closing it at the top; its tip (the promontory) just shows at the inlet's top */
const SACRUM: P2[] = [
  [0, -352],
  [128, -332],
  [156, -262],
  [92, -214],
  [0, -196],
  [-92, -214],
  [-156, -262],
  [-128, -332],
];
const PY0 = -478;
const PY1 = 440;
export const PELVIS_ASPECT = (PY1 - PY0) / 1000;
export const pelvisInlet = (size: number, inlet = PELVIS_INLET) => ({ cx: 0, cy: 0, r: inlet * size });
export const PELVIS_INK = { bone: "#E6DAC1", sacrum: "#D2C3A4", fold: "#A8987A", rim: "#F6EEDC" };

const circleD = (cx: number, cy: number, r: number, ccw: boolean) => {
  const s = ccw ? 0 : 1;
  return `M${n3(cx + r)},${n3(cy)}A${n3(r)},${n3(r)} 0 1 ${s} ${n3(cx - r)},${n3(cy)}A${n3(r)},${n3(r)} 0 1 ${s} ${n3(cx + r)},${n3(cy)}Z`;
};
const ellipseD = (cx: number, cy: number, rx: number, ry: number, rotDeg: number, ccw: boolean) => {
  const q: P2[] = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = ((ccw ? -1 : 1) * i * 2 * Math.PI) / N;
    const ex = rx * Math.cos(a);
    const ey = ry * Math.sin(a);
    const r = (rotDeg * Math.PI) / 180;
    q.push([cx + ex * Math.cos(r) - ey * Math.sin(r), cy + ex * Math.sin(r) + ey * Math.cos(r)]);
  }
  return smoothClosed(q);
};

export const Pelvis: React.FC<{ x: number; y: number; size: number; uid: string; unitPx?: number; inlet?: number; fog?: Fog; part?: "all" | "back" | "front"; opacity?: number }> = ({
  x,
  y,
  size,
  uid,
  unitPx = 1,
  inlet = PELVIS_INLET,
  fog,
  part = "all",
  opacity = 1,
}) => {
  const f = fogOf(fog);
  const fogC = (c: string, k = 1) => (f ? mixC(c, f.hex, f.a * k) : c);
  const scale = size / 1000;
  const R = inlet * 1000;
  // holes wind against the outer path so the default nonzero fill (and the crescent mask) leaves them open
  const outerCcw = signedArea(PELVIS_OUT) < 0;
  const ring = `${smoothClosed(PELVIS_OUT)}${circleD(0, 0, R, !outerCcw)}${ellipseD(232, 300, 84, 56, 38, !outerCcw)}${ellipseD(-232, 300, 84, 56, -38, !outerCcw)}`;
  const bone = fogC(PELVIS_INK.bone);
  const fold = fogC(PELVIS_INK.fold, 0.6);
  const shapes: Paint.Shape[] = [
    { d: smoothClosed(SACRUM), fill: fogC(PELVIS_INK.sacrum), sh: 2.4 },
    { d: smoothOpen([[-62, -300], [0, -292], [62, -300]]), fill: fold, det: 3, keep: true, op: 0.45 },
    { d: smoothOpen([[-52, -250], [0, -244], [52, -250]]), fill: fold, det: 3, keep: true, op: 0.45 },
    { d: ring, fill: bone, sh: 3.4 },
    // the wings' soft inner folds (the iliac fossae), the sacrum's edges, the pubic symphysis
    { d: smoothOpen([[-372, -395], [-300, -300], [-268, -170], [-240, -95]]), fill: fold, det: 4, keep: true, op: 0.55 },
    { d: smoothOpen([[372, -395], [300, -300], [268, -170], [240, -95]]), fill: fold, det: 4, keep: true, op: 0.55 },
    { d: smoothOpen([[0, 236], [0, 300]]), fill: fold, det: 3.4, keep: true, op: 0.5 },
    // the cream rim: the left wing's crest and the inlet's lower-right lip (lit from the upper left)
    { d: smoothOpen([[-462, -300], [-470, -400], [-375, -458], [-240, -430]]), fill: fogC(PELVIS_INK.rim, 0.8), det: 3, keep: true, op: 0.55 },
    { d: `M${n3(R * 0.98 * Math.cos(0.1))},${n3(R * 0.98 * Math.sin(0.1))}A${n3(R * 0.98)},${n3(R * 0.98)} 0 0 1 ${n3(R * 0.98 * Math.cos(1.9))},${n3(R * 0.98 * Math.sin(1.9))}`, fill: fogC(PELVIS_INK.rim, 0.8), det: 2.6, keep: true, op: 0.4 },
  ];
  const px = Math.max(0.2, (size * unitPx) / 620);
  const clip = part === "all" ? null : part === "front" ? `M-2000,0H2000V2000H-2000Z` : `M-2000,-2000H2000V0H-2000Z`;
  return (
    <g opacity={opacity} transform={`translate(${n3(x)} ${n3(y)}) scale(${n3(scale)})`}>
      {clip ? (
        <defs>
          <clipPath id={`${uid}pc`}>
            <path d={clip} />
          </clipPath>
        </defs>
      ) : null}
      <g clipPath={clip ? `url(#${uid}pc)` : undefined}>
        <Paint.FolkPaint shapes={shapes} x={0} y={0} scale={1} uid={uid} px={px} unitPx={unitPx * scale} />
      </g>
    </g>
  );
};
