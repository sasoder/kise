// ---------------------------------------------------------------------------
// iraqEFGGlyphs: the non-world pieces of cuts E/F/G of the Sheppard Iraq clip
// (builder N; used only by iraqEFG.tsx): the mile ODOMETER (IM Fell numerals,
// rolling wheels), the WALL TEETH along a border polyline, the pressing DART,
// and the AL-ASKARI SHRINE glyph (draw-on + the dome's collapse). Palette from
// the Iraq world (iraqShared), never redefined here.
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { DARK, FRAME_H, FRAME_W, INK, SEA, type Cam, type P2 } from "./iraqShared";

const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fellSCFont } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export { fell as fellRoman, fellSCFont };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// THE ODOMETER. A mechanical counter: the units wheel turns with the value, a
// higher wheel turns only while every lower wheel passes 9 -> 0 (so at any
// integer value every wheel is at rest on its digit). Leading zeros are blank:
// a new leading wheel rolls up from blank as the carry reaches it, the comma
// rising with the thousands wheel. A wheel turning faster than ~0.3 digit per
// frame is blurred vertically by its own rate, so a fast roll reads as a roll,
// never a flicker. Old-style IM Fell figures (>= 156 px font, the house rule).
// Screen space; (cx, base) = the centre of the layout and its baseline.
// ---------------------------------------------------------------------------
export const ODO = { DW: 0.5, COMMA: 0.24, WIN_UP: 0.8, WIN_DN: 0.34, PITCH: 1.1 };
/** the layout width (em) of a number with n visible digits (comma after the 3rd) */
export const odoWidthEm = (n: number) => n * ODO.DW + clamp01(n - 3) * ODO.COMMA;
/** number of digits of floor(v) (>= 1) */
export const digitsOf = (v: number) => Math.max(1, Math.floor(Math.log10(Math.max(1, Math.floor(v)))) + 1);

/** one wheel's state at value v: its position (digits), whether its zero face is blank,
 *  its total turn (for the leading wheel's entrance) */
const wheelAt = (v: number, p: number) => {
  const unit = Math.pow(10, p);
  // a higher wheel turns while the wheel below it makes its last tenth (9 -> 0)
  const carry = p === 0 ? 0 : clamp01((v % unit) / unit / 0.1 - 9);
  const total = p === 0 ? v : Math.floor(v / unit) + carry;
  const pos = p === 0 ? v % 10 : (Math.floor(v / unit) % 10) + carry;
  return { pos, total, blank0: p > 0 && total < 1 };
};
/** The odometer at frame g of valueAt. A wheel turning faster than ~0.3 digit per frame is
 *  drawn MOTION-BLURRED the way a camera would see it: the average of sub-frame samples
 *  over a half-frame shutter (each a faint glyph pair), so a fast wheel is a column of faint
 *  numerals rolling past, never a digit flickering from frame to frame. */
export const Odometer: React.FC<{
  id: string;
  valueAt: (g: number) => number;
  g: number;
  wheels: number; // number of wheel slots (4 for 2,367)
  layoutDigits: number; // continuous: the width the layout is centred for (smoothed by the caller)
  cx: number;
  base: number;
  size: number;
  opacity?: number;
  color?: string;
}> = ({ id, valueAt, g, wheels, layoutDigits, cx, base, size, opacity = 1, color = INK }) => {
  if (opacity <= 0.002) return null;
  const v = Math.max(0, valueAt(g));
  const em = size;
  const W = odoWidthEm(layoutDigits) * em;
  const right = cx + W / 2;
  const pitch = ODO.PITCH * em;
  // slot x centres, from the right: units, tens, hundreds, [comma], thousands
  const slotX = (p: number) => right - (p + 0.5) * ODO.DW * em - (p >= 3 ? ODO.COMMA * em : 0);
  const cols: React.ReactNode[] = [];
  let thousandsVis = 0;
  for (let p = 0; p < wheels; p++) {
    const w = wheelAt(v, p);
    if (p === 3) thousandsVis = clamp01(w.total);
    // the wheel's turning rate (digits per frame), from its position a quarter frame either side
    const wa = wheelAt(Math.max(0, valueAt(g - 0.25)), p);
    const wb = wheelAt(Math.max(0, valueAt(g + 0.25)), p);
    let dpos = wb.pos - wa.pos;
    if (dpos < -5) dpos += 10;
    const rate = Math.abs(dpos) * 2;
    // the shutter shortens as the wheel speeds up, so a blurred wheel spreads over ~1 face;
    // a fast wheel recedes (the slower, higher wheels carry the reading)
    const shutter = Math.min(0.5, 1.1 / Math.max(rate, 0.01));
    const n = rate <= 0.3 ? 1 : Math.min(10, Math.ceil(rate * shutter * 5) + 2);
    const spin = smoothstep((rate - 0.5) / 1.5);
    if (p > 0 && w.total <= 0 && wa.total <= 0 && wb.total <= 0) continue;
    const x = slotX(p);
    const a = n === 1 ? 1 : Math.min(1, 2.2 / n);
    const glyphs: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const ts = n === 1 ? g : g - shutter / 2 + (shutter * (i + 0.5)) / n;
      const ws = n === 1 ? w : wheelAt(Math.max(0, valueAt(ts)), p);
      if (p > 0 && ws.total <= 0) continue;
      const d0 = Math.floor(ws.pos) % 10;
      const f = ws.pos - Math.floor(ws.pos);
      if (!(ws.blank0 && d0 === 0))
        glyphs.push(
          <text key={`a${i}`} x={x.toFixed(2)} y={(base - pitch * f).toFixed(2)} textAnchor="middle" fillOpacity={a} strokeOpacity={n === 1 ? 0.5 : 0}>
            {String(d0)}
          </text>,
        );
      if (f > 0.001)
        glyphs.push(
          <text key={`b${i}`} x={x.toFixed(2)} y={(base + pitch * (1 - f)).toFixed(2)} textAnchor="middle" fillOpacity={a} strokeOpacity={n === 1 ? 0.5 : 0}>
            {String((d0 + 1) % 10)}
          </text>,
        );
    }
    cols.push(
      <g key={`w${p}`} opacity={spin > 0.001 ? 1 - 0.7 * spin : undefined}>
        {glyphs}
      </g>,
    );
  }
  const commaX = right - 3 * ODO.DW * em - ODO.COMMA * em * 0.5;
  const y0 = base - ODO.WIN_UP * em;
  const y1 = base + ODO.WIN_DN * em;
  const feather = 0.12 * em;
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
          <stop offset={0} stopColor="#fff" stopOpacity={0} />
          <stop offset={feather / (y1 - y0)} stopColor="#fff" stopOpacity={1} />
          <stop offset={1 - feather / (y1 - y0)} stopColor="#fff" stopOpacity={1} />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-win`} maskUnits="userSpaceOnUse" x={0} y={y0} width={FRAME_W} height={y1 - y0}>
          <rect x={0} y={y0} width={FRAME_W} height={y1 - y0} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g opacity={opacity}>
        <g mask={`url(#${id}-win)`} fontFamily={fell} fontSize={em} fill={color} stroke={SEA} strokeOpacity={0.5} strokeWidth={em * 0.06} paintOrder="stroke">
          {cols}
          {thousandsVis > 0.001 ? (
            <text x={commaX.toFixed(2)} y={(base + pitch * (1 - smoothstep(thousandsVis)) * 0.6).toFixed(2)} textAnchor="middle" opacity={smoothstep(thousandsVis)}>
              ,
            </text>
          ) : null}
        </g>
      </g>
    </svg>
  );
};

/** a soft dark halo (screen space) behind a readout: a feathered ellipse */
export const Halo: React.FC<{ id: string; cx: number; cy: number; rx: number; ry: number; opacity?: number }> = ({ id, cx, cy, rx, ry, opacity = 0.5 }) =>
  opacity <= 0.002 ? null : (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset={0} stopColor={DARK} stopOpacity={1} />
          <stop offset={0.55} stopColor={DARK} stopOpacity={0.75} />
          <stop offset={1} stopColor={DARK} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-halo)`} opacity={opacity} />
    </svg>
  );

// ---------------------------------------------------------------------------
// POLYLINES
// ---------------------------------------------------------------------------
export type Poly = {
  pts: P2[];
  cum: number[];
  len: number;
  pointAt: (s: number) => P2;
  tangentAt: (s: number) => P2;
  partial: (s0: number, s1: number) => P2[];
};
export const makePoly = (pts: P2[]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const seg = (s: number) => {
    const t = Math.max(0, Math.min(len, s));
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= t) lo = mid;
      else hi = mid;
    }
    return { lo, hi, u: (t - cum[lo]) / (cum[hi] - cum[lo] || 1) };
  };
  const pointAt = (s: number): P2 => {
    const { lo, hi, u } = seg(s);
    return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * u, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * u];
  };
  const tangentAt = (s: number): P2 => {
    const h = Math.max(0.5, len * 0.004);
    const a = pointAt(Math.max(0, s - h));
    const b = pointAt(Math.min(len, s + h));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const partial = (s0: number, s1: number): P2[] => {
    const a0 = Math.max(0, Math.min(len, Math.min(s0, s1)));
    const a1 = Math.max(0, Math.min(len, Math.max(s0, s1)));
    const A = seg(a0);
    const B = seg(a1);
    const out: P2[] = [pointAt(a0)];
    for (let i = A.hi; i <= B.lo; i++) out.push(pts[i]);
    out.push(pointAt(a1));
    return out;
  };
  return { pts, cum, len, pointAt, tangentAt, partial };
};
export const dOfPts = (pts: P2[], close = false) =>
  pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}${close ? "Z" : ""}` : "";

// ---------------------------------------------------------------------------
// THE WALL TEETH. Crenellation along a polyline on its outer side (`side`: +1 =
// the left-hand normal of the direction of travel, -1 the right). World-anchored
// teeth whose screen size holds through a zoom (a period per octave of k, the
// half-period set fading in across the octave, like the house dashes). grow(s)
// = 0..1 the height of the tooth at arclength s (the growth front).
// ---------------------------------------------------------------------------
export const TEETH = { PERIOD: 15, H: 7.5, MERLON: 0.5 }; // screen px at the bottom of an octave
const teethPath = (poly: Poly, side: number, P: number, H: number, grow: (s: number) => number) => {
  let d = "";
  const n = Math.floor(poly.len / P);
  for (let i = 0; i < n; i++) {
    const s0 = i * P + P * (1 - TEETH.MERLON) * 0.5;
    const s1 = s0 + P * TEETH.MERLON;
    const g = grow((s0 + s1) / 2);
    if (g <= 0.01) continue;
    const a = poly.pointAt(s0);
    const b = poly.pointAt(s1);
    const t = poly.tangentAt((s0 + s1) / 2);
    const nx = -t[1] * side;
    const ny = t[0] * side;
    const h = H * g;
    d += `M${a[0].toFixed(2)},${a[1].toFixed(2)}L${(a[0] + nx * h).toFixed(2)},${(a[1] + ny * h).toFixed(2)}L${(b[0] + nx * h).toFixed(2)},${(b[1] + ny * h).toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`;
  }
  return d;
};
export const WallTeeth: React.FC<{
  poly: Poly;
  side: number;
  cam: Cam;
  grow: (s: number) => number;
  color: string;
  opacity?: number;
}> = ({ poly, side, cam, grow, color, opacity = 1 }) => {
  if (opacity <= 0.002) return null;
  const L2 = Math.log2(cam.k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const sets = [
    { P: TEETH.PERIOD / Math.pow(2, o), op: 1 - t },
    { P: TEETH.PERIOD / Math.pow(2, o + 1), op: t },
  ].filter((q) => q.op > 0.002);
  const px = (v: number) => v / cam.k;
  return (
    <g fill="none" strokeLinejoin="miter" strokeLinecap="butt">
      {sets.map((q) => {
        // teeth height in screen px follows the period (so both sets read as one wall)
        const H = (TEETH.H * q.P * cam.k) / TEETH.PERIOD / cam.k;
        const d = teethPath(poly, side, q.P, H, grow);
        if (!d) return null;
        return (
          <g key={`t${q.P.toFixed(4)}`} opacity={q.op * opacity}>
            <path d={d} stroke={DARK} strokeOpacity={0.55} strokeWidth={px(4.6)} />
            <path d={d} stroke={color} strokeWidth={px(2.2)} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE DART: a short tapered engraved arrow (screen-sized), its point at (x, y)
// in world px, pointing along unit dir. len = screen px of its shaft + head.
// ---------------------------------------------------------------------------
export const Dart: React.FC<{ x: number; y: number; dir: P2; cam: Cam; len?: number; scale?: number; opacity?: number; color?: string }> = ({
  x,
  y,
  dir,
  cam,
  len = 54,
  scale = 1.6,
  opacity = 1,
  color = INK,
}) => {
  if (opacity <= 0.002) return null;
  const u = scale / cam.k;
  const ang = (Math.atan2(dir[1], dir[0]) * 180) / Math.PI;
  // glyph units = screen px; point at (0, 0), tail at (-len, 0)
  const L = len;
  const head = 15;
  const shaft = `M${-L},0 L${-head + 2},-2.1 L${-head + 2},2.1 Z`; // a tapered shaft: hairline at the tail
  const tip = `M0,0 L${-head},-6.5 L${-head + 4},0 L${-head},6.5 Z`;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${ang.toFixed(2)}) scale(${u})`} strokeLinejoin="round">
      <path d={shaft} fill={DARK} fillOpacity={0.55} stroke={DARK} strokeOpacity={0.55} strokeWidth={3.2} />
      <path d={tip} fill={DARK} fillOpacity={0.55} stroke={DARK} strokeOpacity={0.55} strokeWidth={3.2} />
      <path d={shaft} fill={color} />
      <path d={tip} fill={color} stroke={color} strokeWidth={0.8} />
      {/* engraved: a fine hatch on the head's lower barb */}
      <path d={`M${-head + 3},1.2 L${-head + 6},4.6 M${-head + 6.5},0.9 L${-head + 8.8},3.4`} stroke={DARK} strokeOpacity={0.6} strokeWidth={0.9} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE AL-ASKARI SHRINE, Samarra: the golden dome on its drum over the arcaded
// base, flanked by two minarets. Cream engraved line art (dark casings), fine
// hatching on the dome. Glyph units: 100 = `size` screen px of height; (x, y) =
// the middle of the base line; y up is negative; x -50 .. 50, y -100 .. 0.
// progress 0..1 draws it with a pen, stroke by stroke from the bottom up.
// collapse 0..1 (the blast): the dome's outline splits at the crown, its two
// halves and its hatching fall in (into the drum, clipped there), a few shards
// scatter and settle on the ground; a broken stump is left on the drum; the
// minarets stand.
// ---------------------------------------------------------------------------
type Stroke = { d: string; w: number; kind: "line" | "hatch"; part: "base" | "drum" | "minL" | "minR" | "dome" | "domeHatch" };
const DOME_L = "M-19,-50 C-25,-58 -25,-71 -17,-80 C-12,-85 -5,-88 0,-91";
const DOME_R = "M19,-50 C25,-58 25,-71 17,-80 C12,-85 5,-88 0,-91";
const SHRINE: Stroke[] = [
  // the ground line and the base (an arcaded front)
  { d: "M-50,0 L50,0", w: 1.9, kind: "line", part: "base" },
  { d: "M-31,0 L-31,-26 L31,-26 L31,0", w: 1.9, kind: "line", part: "base" },
  { d: "M-25,0 L-25,-12 C-25,-19 -16,-19 -16,-12 L-16,0 M-6,0 L-6,-14 C-6,-21 6,-21 6,-14 L6,0 M16,0 L16,-12 C16,-19 25,-19 25,-12 L25,0", w: 1.4, kind: "line", part: "base" },
  { d: "M-31,-22 L31,-22", w: 1.1, kind: "line", part: "base" },
  // the minarets: shafts, balconies, lanterns, caps
  { d: "M-41,0 L-41,-66 M-35,0 L-35,-66", w: 1.6, kind: "line", part: "minL" },
  { d: "M41,0 L41,-66 M35,0 L35,-66", w: 1.6, kind: "line", part: "minR" },
  { d: "M-44,-66 L-32,-66 L-33,-70 L-43,-70 Z M-42,-70 L-42,-82 M-34,-70 L-34,-82 M-44,-82 L-32,-82", w: 1.4, kind: "line", part: "minL" },
  { d: "M44,-66 L32,-66 L33,-70 L43,-70 Z M42,-70 L42,-82 M34,-70 L34,-82 M44,-82 L32,-82", w: 1.4, kind: "line", part: "minR" },
  { d: "M-43,-82 C-43,-90 -38,-94 -38,-100 C-38,-94 -33,-90 -33,-82", w: 1.4, kind: "line", part: "minL" },
  { d: "M43,-82 C43,-90 38,-94 38,-100 C38,-94 33,-90 33,-82", w: 1.4, kind: "line", part: "minR" },
  { d: "M-41,-30 L-35,-30 M-41,-48 L-35,-48 M41,-30 L35,-30 M41,-48 L35,-48", w: 1.0, kind: "hatch", part: "base" },
  // the drum, its windows, the dome's collar
  { d: "M-18,-26 L-18,-47 M18,-26 L18,-47 M-20,-47 L20,-47", w: 1.6, kind: "line", part: "drum" },
  { d: "M-12,-31 L-12,-41 M-6,-31 L-6,-41 M0,-31 L0,-41 M6,-31 L6,-41 M12,-31 L12,-41", w: 1.2, kind: "line", part: "drum" },
  { d: "M-21,-47 L-19,-50 L19,-50 L21,-47", w: 1.4, kind: "line", part: "drum" },
  // the dome (two halves meeting at the crown) and its finial
  { d: DOME_L, w: 1.9, kind: "line", part: "dome" },
  { d: DOME_R, w: 1.9, kind: "line", part: "dome" },
  { d: "M0,-91 L0,-99 M-2.4,-95 L2.4,-95", w: 1.3, kind: "line", part: "dome" },
  // the dome's engraved hatching: meridians on its shaded east side + ribs
  {
    d: "M6,-52 C9,-62 9,-74 5,-84 M10,-52 C14,-62 14,-73 9,-82 M14,-52 C18,-61 18,-71 13,-79 M-10,-52 C-12,-62 -12,-72 -9,-82",
    w: 0.95,
    kind: "hatch",
    part: "domeHatch",
  },
  { d: "M-21,-60 C-10,-63 10,-63 21,-60 M-20,-70 C-10,-73 10,-73 20,-70", w: 0.9, kind: "hatch", part: "domeHatch" },
];
// bottom-up order: by each stroke's lowest point (largest y), then its listing
const strokeMaxY = (d: string) => Math.max(...(d.match(/-?\d+(\.\d+)?/g) || []).filter((_, i) => i % 2 === 1).map(Number));
const strokeMinY = (d: string) => Math.min(...(d.match(/-?\d+(\.\d+)?/g) || []).filter((_, i) => i % 2 === 1).map(Number));
const ORDER = SHRINE.map((s, i) => ({ i, lo: strokeMaxY(s.d), hi: strokeMinY(s.d) })).sort((a, b) => b.lo - a.lo || a.i - b.i);
// each stroke's slice of progress: starts when the pen reaches its bottom, overlapping (a quick hand)
const SLICES = (() => {
  const out: Record<number, [number, number]> = {};
  const n = ORDER.length;
  ORDER.forEach((o, j) => {
    const a = (j / n) * 0.82;
    const len = 0.18 + 0.12 * ((o.lo - o.hi) / 100);
    out[o.i] = [a, Math.min(1, a + len)];
  });
  return out;
})();
// the shards: small triangles off the dome (glyph units), each with its flight
const SHARDS = Array.from({ length: 7 }, (_, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  const sx = side * (6 + 12 * hash(i, 1));
  const sy = -60 - 22 * hash(i, 2);
  const vx = side * (26 + 34 * hash(i, 3)); // units over the flight
  const land = side * (34 + 26 * hash(i, 4)) + sx * 0.4;
  const r = 3.4 + 3.0 * hash(i, 5);
  const rot = (hash(i, 6) - 0.5) * 540;
  const delay = 0.04 * i;
  return { sx, sy, vx, land, r, rot, delay, side };
});

export const Shrine: React.FC<{
  x: number;
  y: number;
  cam: Cam;
  size: number;
  progress?: number;
  collapse?: number;
  opacity?: number;
  color?: string;
  id?: string;
}> = ({ x, y, cam, size, progress = 1, collapse = 0, opacity = 1, color = INK, id = "shr" }) => {
  if (opacity <= 0.002 || progress <= 0.0005) return null;
  const u = size / 100 / cam.k;
  const sw = 100 / size; // 1 screen px in glyph units
  const c = clamp01(collapse);
  // the dome's fall: the halves part at the crown (rotate outward about their foot) and drop into the drum
  const fall = c <= 0 ? 0 : Math.pow(clamp01(c / 0.7), 2); // gravity: accelerating
  const part = smoothstep(c / 0.25);
  const domeFor = (s: Stroke) => {
    if (s.part !== "dome" && s.part !== "domeHatch") return undefined;
    if (c <= 0) return undefined;
    const isL = s.d === DOME_L;
    const isR = s.d === DOME_R;
    const rot = isL ? -14 * part - 10 * fall : isR ? 14 * part + 10 * fall : 0;
    const px = isL ? -19 : isR ? 19 : 0;
    const drop = 46 * fall;
    return `translate(0 ${drop.toFixed(2)}) rotate(${rot.toFixed(2)} ${px} -50)`;
  };
  const strokeEl = (s: Stroke, i: number) => {
    const [a, b] = SLICES[i];
    const q = clamp01((progress - a) / (b - a));
    if (q <= 0.001) return null;
    const da = q >= 0.999 ? undefined : `${q.toFixed(4)} 1`;
    const tf = domeFor(s);
    const fade = s.part === "dome" || s.part === "domeHatch" ? 1 - smoothstep((c - 0.55) / 0.4) : 1;
    if (fade <= 0.002) return null;
    const el = (
      <g key={`s${i}`} transform={tf} opacity={fade < 0.999 ? fade : undefined}>
        <path d={s.d} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={(s.w + 2.6) * sw} pathLength={1} strokeDasharray={da} />
        <path d={s.d} fill="none" stroke={color} strokeOpacity={s.kind === "hatch" ? 0.85 : 1} strokeWidth={s.w * sw} pathLength={1} strokeDasharray={da} />
      </g>
    );
    return el;
  };
  const domeEls: React.ReactNode[] = [];
  const restEls: React.ReactNode[] = [];
  SHRINE.forEach((s, i) => {
    const el = strokeEl(s, i);
    if (!el) return;
    if ((s.part === "dome" || s.part === "domeHatch") && c > 0) domeEls.push(el);
    else restEls.push(el);
  });
  // the dark ground under the dome and drum (so the glyph reads on the map), laid as the drawing closes
  const groundOp = smoothstep((progress - 0.45) / 0.45);
  const domeGround = `${DOME_L} L19,-50 Z`;
  const stump = "M-19,-50 L-15,-55 L-11,-52 L-7,-58 L-3,-53 L1,-56 L5,-52 L9,-57 L13,-53 L16,-55 L19,-50";
  const stumpOp = smoothstep((c - 0.35) / 0.3);
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${u})`} strokeLinejoin="round" strokeLinecap="round">
      <defs>
        {/* the dome falls INTO the drum: everything below the collar is hidden */}
        <clipPath id={`${id}-above`}>
          <rect x={-60} y={-130} width={120} height={80} />
        </clipPath>
      </defs>
      {groundOp > 0.002 ? (
        <g fill={DARK} fillOpacity={0.42 * groundOp} stroke="none">
          <path d="M-31,0 L-31,-26 L31,-26 L31,0 Z M-18,-26 L-18,-47 L18,-47 L18,-26 Z" />
          <path d="M-41,0 L-41,-66 L-35,-66 L-35,0 Z M41,0 L41,-66 L35,-66 L35,0 Z" />
          {c < 1 ? <path d={domeGround} opacity={1 - smoothstep((c - 0.2) / 0.5)} transform={c > 0 ? `translate(0 ${(46 * fall).toFixed(2)})` : undefined} clipPath={c > 0 ? `url(#${id}-above)` : undefined} /> : null}
        </g>
      ) : null}
      {restEls}
      {domeEls.length ? <g clipPath={`url(#${id}-above)`}>{domeEls}</g> : null}
      {/* the broken stump left on the drum */}
      {stumpOp > 0.002 ? (
        <g opacity={stumpOp}>
          <path d={stump} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={4.2 * sw} />
          <path d={stump} fill="none" stroke={color} strokeWidth={1.6 * sw} />
        </g>
      ) : null}
      {/* the shards: thrown from the dome on short arcs, settling on the ground line */}
      {c > 0
        ? SHARDS.map((sh, i) => {
            const t = clamp01((c - sh.delay) / 0.62);
            if (t <= 0) return null;
            const e = 1 - Math.pow(1 - t, 2.2); // decelerating along x
            const sxNow = sh.sx + (sh.land - sh.sx) * e;
            // a ballistic arc in y: up a little, then down onto the ground (y = -sh.r)
            const yEnd = -sh.r * 0.6;
            const syNow = sh.sy + (yEnd - sh.sy) * Math.pow(t, 1.6) - 14 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t);
            const rot = sh.rot * e;
            const tri = `M${-sh.r},${sh.r * 0.55} L${sh.r * 0.9},${sh.r * 0.7} L${sh.r * 0.1},${-sh.r}Z`;
            return (
              <g key={`sh${i}`} transform={`translate(${sxNow.toFixed(2)} ${syNow.toFixed(2)}) rotate(${rot.toFixed(1)})`}>
                <path d={tri} fill={DARK} fillOpacity={0.6} stroke={DARK} strokeOpacity={0.55} strokeWidth={2.6 * sw} />
                <path d={tri} fill={color} fillOpacity={0.9} stroke={color} strokeWidth={0.8 * sw} />
              </g>
            );
          })
        : null}
    </g>
  );
};
