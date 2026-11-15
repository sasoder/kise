// ---------------------------------------------------------------------------
// sinceWritingProps — the HAND PROPS of rsi-since-writing as gouache paint shapes (pure geometry, no React): the coffee
// MUG, the glass coffee POT (carafe) and the PENCIL, in covidFolk's figure units (rig units in, FOLK units in the
// paths: closedD / tubeD / ellD of kyle-covid/covidFolkBody), so the same shapes are painted inside a figure (held,
// inserted before the near arm by sinceWritingFolk.tsx) and on their own in the world (sinceWritingWorld.tsx's
// CoffeeMug / CoffeePot, painted by covidFolk's CovidPaint). One hand for the cast and its props.
// Colour rule (COMMON.md): nothing here is orange. The mug is a dusty-teal glaze, the pot clear glass with a slate band.
//
// UNITS: rig units (U = 178 per metre), up is -y. Angles in degrees, screen-clockwise positive (SVG y-down).
//   MugState  { base: [x, y] the bottom centre, tilt: deg (+ = the top tips toward screen right), level 0..1 (the coffee
//             in it), handle: -1 | 1 (the handle's side on screen when upright) }
//   PotState  { grip: [x, y] the hand's grip on the handle, tilt: deg (+ = the spout dips toward screen right when sx 1),
//             level 0..1, sx: 1 | -1 (the spout faces screen right / left) }
// ---------------------------------------------------------------------------
import { add, mul, rot } from "../kits/maps/stringsMotion";
import { closedD, ellPts, tubeD, type CShape, type P2 } from "../kyle-covid/covidFolkBody";
import { mixC } from "../kyle-pandemics/pandemicFolkPaint";

const c01 = (v: number) => Math.max(0, Math.min(1, v));

// ===================================================================================================================
// THE MUG (a big mug: 11 cm tall, 9.5 cm across, stylised a little up so it reads on a phone)
// ===================================================================================================================
export const MUG = { r: 9.5, h: 21, handleOut: 7 } as const;
export const MUG_INK = { glaze: "#6E8C87", lip: "#9DB3AD", inner: "#3E504D", coffee: "#4A3426", crema: "#6B5038" };
export type MugState = { base: P2; tilt: number; level: number; handle: -1 | 1 };
/** a mug-local point (x right, y up -) placed on the state's base and tilt */
export const mugPt = (m: MugState, p: P2): P2 => add(m.base, rot(p, m.tilt));
/** the handle's grip point (where a hand holds it) */
export const mugHandle = (m: MugState): P2 => mugPt(m, [m.handle * (MUG.r + MUG.handleOut * 0.75), -MUG.h * 0.55]);
/** the mouth: centre, half widths (screen) and the rotation */
export const mugMouth = (m: MugState) => ({ c: mugPt(m, [0, -MUG.h]), rx: MUG.r * 0.92, ry: MUG.r * 0.3, rot: m.tilt });
/** the mug's base (bottom centre) that puts its rim's `side` edge (-1 left, 1 right) at point q at a tilt */
export const mugBaseForRim = (q: P2, tilt: number, side: -1 | 1): P2 => add(q, mul(rot([side * MUG.r, -MUG.h], tilt), -1));

export const mugShapes = (m: MugState, inkOver?: Partial<typeof MUG_INK>): CShape[] => {
  const ink = { ...MUG_INK, ...(inkOver ?? {}) };
  const { r, h } = MUG;
  const T = (x: number, y: number) => mugPt(m, [x, y]);
  const out: CShape[] = [];
  // the handle: a thick C on its side
  const hs = m.handle;
  const hp: P2[] = [T(hs * (r - 1), -h * 0.82), T(hs * (r + MUG.handleOut * 0.85), -h * 0.78), T(hs * (r + MUG.handleOut), -h * 0.52), T(hs * (r + MUG.handleOut * 0.7), -h * 0.27), T(hs * (r - 1), -h * 0.22)];
  out.push({ d: tubeD(hp, [3.4, 3.6, 3.6, 3.4, 3.2]), fill: ink.glaze, sh: 0.5 });
  // the body: the sides, the bottom's front arc, the rim's back arc
  const ry = r * 0.3;
  const body: P2[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI - (Math.PI * i) / 10;
    body.push(T(Math.cos(a) * r * 0.95, Math.sin(a) * ry * 0.95 - 0.5));
  }
  body.push(T(r, -h));
  for (let i = 1; i < 10; i++) {
    const a = (Math.PI * i) / 10;
    body.push(T(Math.cos(a) * r, -h - Math.sin(a) * ry));
  }
  body.push(T(-r, -h));
  out.push({ d: closedD(body, 0.5), fill: ink.glaze });
  // the mouth: the inner glaze, the coffee inside (clipped to the mouth), the lip
  const mo = mugMouth(m);
  const mouthD = closedD(ellPts(mo.c, mo.rx, mo.ry, mo.rot, 18), 0.9);
  out.push({ d: mouthD, fill: ink.inner, sh: 0 });
  const lv = c01(m.level);
  if (lv > 0.02) {
    const drop = (1 - lv) * ry * 1.6;
    const cc = mugPt(m, [0, -h + drop]);
    out.push({ d: closedD(ellPts(cc, mo.rx * 0.97, mo.ry * 0.97, mo.rot, 18), 0.9), fill: mixC(ink.coffee, ink.crema, 0.25), sh: 0, clip: mouthD });
  }
  out.push({ d: closedD(ellPts(mo.c, mo.rx * 1.02, mo.ry * 1.05, mo.rot, 18), 0.9), fill: ink.lip, det: 1.4, keep: true, op: 0.75 });
  return out;
};

// ===================================================================================================================
// THE POT: a glass drip carafe (22 cm), a slate band and handle; the coffee's surface stays level when it tilts
// ===================================================================================================================
export const POT_INK = { glass: "#DCE2D9", band: "#4E5558", coffee: "#4A3426", sheen: "#F7F4EA" };
// local geometry (x toward the spout, y up -), the grip is the handle's middle
const POT_BODY: P2[] = [
  [15, -14],
  [15, -8],
  [10, -2],
  [8.5, 8],
  [11, 17],
  [18, 22],
  [30, 22],
  [37, 17],
  [39.5, 8],
  [38, -2],
  [33, -8],
  [33, -14],
];
const POT_BAND: P2[] = [
  [13.5, -21],
  [34.5, -21],
  [35, -13],
  [13, -13],
];
const POT_LIP: P2[] = [
  [33.5, -21],
  [41.5, -24.5],
  [41, -20.5],
  [35, -15],
];
const POT_HANDLE: P2[] = [
  [14, -18],
  [3.5, -18.5],
  [-1, -8],
  [0, 6],
  [9.5, 11],
];
const POT_GRIP: P2 = [-0.6, -4];
const POT_SPOUT: P2 = [41.6, -23.4];
export type PotState = { grip: P2; tilt: number; level: number; sx: 1 | -1 };
export const potPt = (p: PotState, q: P2): P2 => {
  const l: P2 = [(q[0] - POT_GRIP[0]) * p.sx, q[1] - POT_GRIP[1]];
  return add(p.grip, rot(l, p.tilt));
};
/** the spout's tip (where the stream leaves) */
export const potSpout = (p: PotState): P2 => potPt(p, POT_SPOUT);
/** the grip that puts the spout at q at a tilt (sx: the spout's side) */
export const potGripForSpout = (q: P2, tilt: number, sx: 1 | -1): P2 => add(q, mul(rot([(POT_SPOUT[0] - POT_GRIP[0]) * sx, POT_SPOUT[1] - POT_GRIP[1]], tilt), -1));
/** a polygon clipped to y >= y0 (below a level line; screen y down) */
const clipBelow = (poly: P2[], y0: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ain = a[1] >= y0;
    const bin = b[1] >= y0;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (y0 - a[1]) / (b[1] - a[1]);
      out.push([a[0] + (b[0] - a[0]) * t, y0]);
    }
  }
  return out;
};
const densify = (poly: P2[], n = 4): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
};
export const potShapes = (p: PotState): CShape[] => {
  const T = (q: P2) => potPt(p, q);
  const out: CShape[] = [];
  out.push({ d: tubeD(POT_HANDLE.map(T), [3.6, 3.8, 4, 3.8, 3.4]), fill: POT_INK.band, sh: 0.4 });
  const body = densify(POT_BODY).map(T);
  // the glass: pale, a little see-through
  out.push({ d: closedD(body, 0.6), fill: POT_INK.glass, sh: 0.35, op: 0.62 });
  // the coffee: the body below a level line through the liquid's (tilted) mid point, kept level in screen space
  const lv = c01(p.level);
  if (lv > 0.02) {
    const mid = T([24, 22 - lv * 30]);
    const liq = clipBelow(densify(POT_BODY, 6).map(T), mid[1]);
    if (liq.length > 2) out.push({ d: closedD(liq, 0.4), fill: POT_INK.coffee, sh: 0.5 });
  }
  // a sheen down the lit side of the glass
  out.push({ d: tubeD([T([13, -6]), T([11.5, 4]), T([13, 13])], [1.4, 1.8, 1.2]), fill: POT_INK.sheen, sh: 0, op: 0.55 });
  out.push({ d: closedD(POT_LIP.map(T), 0.3), fill: mixC(POT_INK.glass, POT_INK.band, 0.25), sh: 0.3, op: 0.85 });
  out.push({ d: closedD(POT_BAND.map(T), 0.35), fill: POT_INK.band, sh: 0.5 });
  return out;
};

// ===================================================================================================================
// THE PENCIL (the Genius's, copied so the human writes with the same object; tenEarthsGeniusBody is read-only)
// ===================================================================================================================
export const PENCIL_TIP = 30;
const PENCIL_BACK = 14;
const PENCIL = { body: "#E9E1CF", wood: "#E6C9A0", lead: "#3A2D25", end: "#9C8F78" };
export const pencilShapes = (grip: P2, ang: number, op = 1): CShape[] => {
  const d: P2 = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
  const tip = add(grip, mul(d, PENCIL_TIP));
  const cone = add(grip, mul(d, PENCIL_TIP - 6.5));
  const back = add(grip, mul(d, -PENCIL_BACK));
  const n: P2 = [-d[1], d[0]];
  const w = 2.3;
  return [
    { d: closedD([add(back, mul(n, w)), add(cone, mul(n, w)), add(cone, mul(n, -w)), add(back, mul(n, -w))], 0.2), fill: PENCIL.body, sh: 0.4, op },
    { d: closedD([add(back, mul(n, w * 1.05)), add(add(back, mul(d, 3.5)), mul(n, w * 1.05)), add(add(back, mul(d, 3.5)), mul(n, -w * 1.05)), add(back, mul(n, -w * 1.05))], 0.2), fill: PENCIL.end, sh: 0, op },
    { d: closedD([add(cone, mul(n, w)), tip, add(cone, mul(n, -w))], 0.15), fill: PENCIL.wood, sh: 0, op },
    { d: closedD([add(add(tip, mul(d, -2.4)), mul(n, 0.9)), tip, add(add(tip, mul(d, -2.4)), mul(n, -0.9))], 0.15), fill: PENCIL.lead, sh: 0, op },
  ];
};
