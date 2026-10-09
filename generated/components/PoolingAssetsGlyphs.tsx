// ---------------------------------------------------------------------------
// PoolingAssetsGlyphs: the engraved period glyphs of the cut PoolingAssets
// (Dwarkesh map style, non-map page). One stroke family, the house's (after
// incaGlyphs): cream fills, a DARK casing under everything, a thin dark
// contour, dark engraved hatching. Every glyph is drawn in its own LOCAL units
// and takes `px` = screen px per unit, so stroke widths stay in screen px.
//
//   manParts(opts)   a 1520s-30s Spanish adventurer, ~102 units tall, feet at
//                    (0, 0), up negative, facing +x: morion or flat cap, slashed
//                    doublet, paned trunk hose, broad shoes; options: short
//                    cloak, sword at the hip, breastplate, a merchant's long gown
//   <Horse>          a riderless war horse (the body is incaGlyphs' horse, 76
//                    units long, facing +x) with a high-arched period saddle,
//                    stirrup, bridle and reins; gait 0 standing .. 1 trotting
//   <Arms>           a cross-hilted sword laid across a spanned crossbow
//   PURSE_PARTS      a drawstring purse with coin beside it
//   <Ship>           a nao / caravela redonda of c. 1500-1530: round hull, fore
//                    and aft castles, square fore and main sails, lateen mizzen
//                    (each sail 0 furled .. 1 set); horse, pikes + shields and
//                    a chest come aboard by opacity. 100 units along the hull,
//                    (0, 0) = the waterline amidships, bow toward +x.
//   <GoldBars>       a stack of gold ingots (the only orange thing)
// ---------------------------------------------------------------------------
import React from "react";

export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DARK = "#0B0907";

export type Part =
  | { k: "fill"; d: string }
  | { k: "stroke"; d: string; w: number } // a cream line, w in units
  | { k: "dark"; d: string; w?: number; o?: number } // engraved dark line, w in screen px
  | { k: "shade"; d: string; o?: number }; // a dark fill

const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r},${cy} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0 Z`;
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx},${cy} a${rx},${ry} 0 1 0 ${2 * rx},0 a${rx},${ry} 0 1 0 ${-2 * rx},0 Z`;

/** draws a parts list: dark casing pass, then the parts in order */
export const Engraved: React.FC<{ parts: Part[]; px: number; casing?: number; ink?: string }> = ({
  parts,
  px,
  casing = 3,
  ink = INK,
}) => {
  const sw = 1 / px;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <g stroke={DARK} strokeOpacity={0.7} fill="none">
        {parts.map((p, i) =>
          p.k === "fill" ? (
            <path key={i} d={p.d} strokeWidth={2 * casing * sw} fill={DARK} />
          ) : p.k === "stroke" ? (
            <path key={i} d={p.d} strokeWidth={p.w + 2 * casing * sw} />
          ) : null,
        )}
      </g>
      {parts.map((p, i) => {
        if (p.k === "fill") return <path key={i} d={p.d} fill={ink} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.5 * sw} />;
        if (p.k === "stroke") return <path key={i} d={p.d} fill="none" stroke={ink} strokeWidth={p.w} />;
        if (p.k === "dark")
          return <path key={i} d={p.d} fill="none" stroke={DARK} strokeOpacity={p.o ?? 0.6} strokeWidth={(p.w ?? 1.6) * sw} />;
        return <path key={i} d={p.d} fill={DARK} fillOpacity={p.o ?? 0.7} stroke="none" />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE MAN
// ---------------------------------------------------------------------------
export type ManOpts = { hat: "morion" | "cap"; gown?: boolean; cape?: boolean; cuirass?: boolean; sword?: boolean };
export const manParts = (o: ManOpts): Part[] => {
  const p: Part[] = [];
  if (o.cape) {
    p.push(
      { k: "fill", d: "M-11,-80 C-22,-73 -26,-56 -25,-37 L-10,-41 C-10,-55 -9,-68 -8,-78 Z" },
      { k: "dark", d: "M-17.5,-71 C-20.5,-61 -21,-50 -20.6,-40 M-13.6,-73 C-15.6,-63 -16,-52 -15.6,-42" },
    );
  }
  if (o.sword) {
    p.push({ k: "stroke", d: "M-6,-52 L-27,-21", w: 2.6 }, { k: "stroke", d: "M-9.6,-56.6 L-2.6,-51", w: 2 }, { k: "stroke", d: "M-6,-52 L-3,-57", w: 2 });
  }
  // the far arm, hand on the hip
  p.push(
    { k: "fill", d: "M-22,-61.4 L-18.4,-65.6 L-8,-56.4 L-10.4,-51.8 Z" },
    { k: "fill", d: "M-8,-79 C-14,-81.6 -21,-75 -23.4,-64.6 C-23,-60.6 -19,-59 -16,-60.6 C-14.4,-66 -11.4,-72.6 -8,-79 Z" },
    { k: "dark", d: "M-13,-76 l-3.4,5 M-16,-73.6 l-3.2,5.2 M-18.6,-70 l-2.4,4.6 M-18,-62.6 l5,4.4" },
  );
  if (o.gown) {
    // shoes under a long gown
    p.push(
      { k: "fill", d: "M-10,-5 L-1,-5 L3,-1.4 L3,0 L-10,0 Z" },
      { k: "fill", d: "M3,-5 L11,-5 L16,-1.4 L16,0 L3,0 Z" },
      { k: "fill", d: "M-12,-80 C-16,-60 -18,-34 -19,-6 L18,-6 C17,-34 15,-60 12,-80 C7,-83 -6,-83 -12,-80 Z" },
      { k: "dark", d: "M-1.6,-80 L-3.4,-6 M3,-80 L4.6,-6", w: 1.8 },
      { k: "dark", d: "M-10,-52 L-13,-8 M-6.6,-40 L-8,-8 M10,-52 L12.6,-8 M7.6,-40 L8.6,-8 M-14,-30 L-15.4,-8" },
      // the fur collar
      { k: "fill", d: "M-10,-81 C-5,-77 -3,-70 -2.4,-62 L3.6,-62 C4,-70 6,-77 10.6,-81 C5,-83.4 -5,-83.4 -10,-81 Z" },
      { k: "dark", d: "M-6.6,-79 l1.6,2.4 M-4.6,-74.6 l1.4,2.4 M7,-79 l-1.6,2.4 M5.4,-74.6 l-1.2,2.4 M-3.6,-69 l1,2.4 M4.6,-69 l-0.8,2.4" },
    );
  } else {
    p.push(
      // hose
      { k: "fill", d: "M-8,-38 C-8.6,-28 -9.6,-20 -9,-14 C-8.6,-10 -8.6,-7 -8.6,-4 L-3,-4 C-2.6,-10 -1.4,-16 -1.6,-22 C-1.6,-28 -1,-33 -0.6,-38 Z" },
      { k: "fill", d: "M1,-38 C1,-30 2,-22 3,-16 C3.6,-12 4,-8 4,-4 L9.6,-4 C10,-10 10.6,-16 10,-22 C9.6,-28 9,-33 8.6,-38 Z" },
      { k: "dark", d: "M-7.4,-30 l2.6,2.2 M-8,-24 l2.6,2.2 M-8,-18 l2.6,2.2 M2.4,-30 l2.6,2.2 M3,-24 l2.6,2.2 M4,-18 l2.6,2.2" },
      // broad-toed shoes
      { k: "fill", d: "M-10,-5 L-2.4,-5 L2,-1.6 L2,0 L-10,0 Z" },
      { k: "fill", d: "M3.4,-5 L10,-5 L16,-1.6 L16,0 L3.4,0 Z" },
      // paned trunk hose
      { k: "fill", d: "M-10.6,-53 C-16,-47 -15,-38 -8.6,-34.6 L-1,-34.6 L0.4,-40 L1.6,-34.6 L9.4,-34.6 C16,-38 16.6,-47 11.6,-53 Z" },
      { k: "dark", d: "M-7.4,-52 C-10.4,-46 -9.6,-40 -7,-35.6 M-3.4,-52 C-4.6,-46 -4.4,-40 -3.6,-35.6 M4.4,-52 C5.6,-46 5.4,-40 4.6,-35.6 M8.4,-52 C11.4,-46 10.6,-40 8,-35.6" },
      // the doublet
      { k: "fill", d: "M-12,-79 C-13.4,-70 -11.6,-60 -10,-52 L11,-52 C12.6,-60 14,-70 12,-79 C7,-82.4 -6,-82.4 -12,-79 Z" },
    );
    if (o.cuirass) {
      p.push(
        { k: "dark", d: "M0.6,-80 C2.4,-72 2.4,-64 0.6,-56.6", w: 1.8 },
        { k: "dark", d: "M-10.4,-56.6 L11.4,-56.6 M-11.6,-74 C-8,-72.6 -5,-73.6 -3.6,-78 M11.6,-74 C8,-72.6 6,-73.6 5,-78", w: 1.8 },
        { k: "dark", d: "M-9.6,-70 l3.4,3.4 M-10,-65 l3.4,3.4 M-9.6,-60.4 l3,3" },
      );
    } else {
      p.push(
        { k: "dark", d: "M0.6,-81 L0.6,-53", w: 1.8 },
        { k: "dark", d: "M-8,-76 l3,4 M-8.4,-70 l3,4 M-8,-64 l3,4 M4.4,-76 l3,4 M4.8,-70 l3,4 M4.4,-64 l3,4 M-10.4,-55 L11.4,-55" },
      );
    }
  }
  // the near arm, reaching a little toward what he brings
  p.push(
    { k: "fill", d: "M14.6,-64.4 L19.8,-66.6 L27,-58.4 L24,-54.6 Z" },
    { k: "fill", d: "M7.6,-79 C13,-82 19.6,-76.6 21.6,-67 C21.4,-63 17.6,-61 14.4,-62.4 C12.4,-67 10,-73 7.6,-79 Z" },
    { k: "dark", d: "M11.6,-76.4 l3.2,5.2 M14.6,-74.6 l3,5.4 M17.4,-71.4 l2.2,4.8 M18.4,-63 l4.6,5" },
  );
  p.push({ k: "fill", d: circ(25.4, -56, 2.7) }, { k: "fill", d: circ(-9.6, -54, 2.5) });
  // the head, a pointed beard
  p.push({ k: "fill", d: circ(1, -87.4, 6.2) }, { k: "shade", d: "M1.6,-83.6 C4,-83 6.4,-84 7.4,-86 C8,-82 6.4,-78.6 4.6,-77.4 C3,-79 2,-81 1.6,-83.6 Z", o: 0.72 });
  if (o.hat === "morion") {
    p.push(
      { k: "fill", d: "M-10,-90 C-4.6,-86.6 7,-86.6 13.6,-91.4 C9.6,-90.6 8,-91 7.6,-92.4 C7.4,-98.6 3.6,-102 1.2,-102.6 C-1.4,-102 -5.2,-98.6 -5.4,-92.4 C-6,-90.6 -7.6,-90 -10,-90 Z" },
      { k: "dark", d: "M-3.6,-95 C-1.6,-103.6 4,-103.6 6,-95 M-5,-92 C-1,-90.6 4,-90.6 7.4,-92" },
    );
  } else {
    p.push(
      { k: "stroke", d: "M5,-96 C9,-103 15,-104.6 18.6,-101", w: 2.4 },
      { k: "fill", d: "M-8,-90.6 C-9.6,-95.6 -4,-98.6 2,-98.6 C8.6,-98.6 11.6,-95 10.6,-91.6 C6,-93 -2,-93 -8,-90.6 Z" },
      { k: "dark", d: "M-6.6,-93 C-2,-95 6,-95 9.6,-93.6" },
    );
  }
  return p;
};

// ---------------------------------------------------------------------------
// THE HORSE (body, legs and gait after incaGlyphs' Horseman; here riderless,
// cream, saddled). HORSE_UNITS (76) from the tail's tip to the muzzle.
// ---------------------------------------------------------------------------
export const HORSE_UNITS = 76;
const H_BODY =
  "M-20,-1.5 C-21,-6.6 -18.6,-10.6 -13.6,-11.2 C-9.6,-11.6 -5,-9.8 -0.6,-9.8 C3.6,-9.8 7.6,-11.4 11,-12.4 " +
  "C15.6,-15.4 20.4,-21.4 24.6,-25.8 " +
  "L24.4,-29.8 L27,-26.6 C30.4,-24.2 34.6,-19.2 37.6,-15.4 C38.8,-13.8 38,-11.6 36,-11.6 " +
  "C33.6,-11.8 31.2,-13 29.2,-14.6 C28.4,-15.2 27.8,-15.6 27.4,-15.4 " +
  "C25.2,-11.6 22.8,-6.6 20.6,-2.2 C19.6,1.8 17.2,4.6 13.8,6 C7.6,7.8 -2.4,8 -9.2,7 " +
  "C-14,6.2 -17.6,4.6 -19.2,2.2 C-19.8,0.9 -20,-0.2 -20,-1.5 Z";
const H_TAIL =
  "M-18.2,-8.2 C-24.6,-9.4 -30.4,-6.8 -34.2,1.4 C-33.2,3.6 -31.2,4.2 -30.2,2.2 C-28.2,-1.4 -24.8,-3.2 -20.6,-2.4 C-19.4,-2.6 -18.6,-4.2 -18.2,-8.2 Z";
const H_MANE = "M12.2,-13.4 C15.2,-15.8 19,-20.6 23.4,-25.4 M14.6,-12.6 C17,-15 20,-18.6 23,-22.4";
const H_HATCH =
  "M-13.4,4.4 C-6,6.2 4,6.4 11.6,4.6 M-16.4,-4.4 C-14.6,-1.4 -12.4,1 -9.4,2.6 M16.4,-8.4 C15.4,-4.4 14.4,-1.4 12.6,1.8 M-11,5.6 C-5,7 3,7 9,5.8";
// a war saddle of the period: high arched cantle and pommel over a square skirt
const H_SKIRT = "M-8,-10.4 L6.6,-10.6 L7.8,-0.6 L-9.4,-0.6 Z";
const H_SADDLE =
  "M-8.6,-9.8 C-10.2,-13.6 -9.6,-17 -7.6,-18.2 C-6,-15 -3.4,-13 0.4,-12.8 C3,-12.8 4.6,-14.6 5.2,-17.4 C7.2,-16.2 7.8,-13 6.8,-9.8 Z";
const H_TACK =
  "M-0.4,-0.6 L0.4,7.6 M19.8,-0.6 C14,-3.6 10,-6 7.4,-8.6 M-9,-8.4 C-13,-9 -16.4,-7.6 -19.4,-4 " +
  "M26.6,-24.6 L30.2,-14 M33.6,-19 L30,-13.8 M34.6,-13.2 C26,-8.6 14,-11 6.4,-14.4";
const H_STIRRUP = "M1.4,-6 L2.4,6 M0.6,6 L4.6,6 L3.8,9.6 L1.4,9.6 Z";
type Leg = [number, number][];
const GALLOP: Leg[][] = [
  [
    [[14.6, 3.6], [23.6, 8.8], [34.4, 9.4]],
    [[11, 4.6], [19.4, 10.6], [30, 13.2]],
    [[-12.6, 3.8], [-21, 9.6], [-29.4, 15.6]],
    [[-16, 2.4], [-24.6, 7.4], [-33.2, 11.2]],
  ],
  [
    [[14.6, 3.6], [20.4, 11.4], [12.4, 15.8]],
    [[11, 4.6], [15, 12.8], [7, 16.6]],
    [[-12.6, 3.8], [-6.2, 10.4], [2.2, 14.4]],
    [[-16, 2.4], [-10.4, 11], [-3.4, 16]],
  ],
  [
    [[14.6, 3.6], [20.4, 11.4], [23.4, 19.6]],
    [[11, 4.6], [13.4, 13], [6.4, 17]],
    [[-12.6, 3.8], [-20.6, 10.6], [-28.4, 17.4]],
    [[-16, 2.4], [-23.4, 8.6], [-32.6, 13]],
  ],
];
const STAND: Leg[] = [
  [[14.6, 3.6], [15.6, 11.6], [16.4, 19.6]],
  [[11, 4.6], [10.6, 12.2], [10.2, 19.6]],
  [[-12.6, 3.8], [-13.4, 11.2], [-12.4, 19.6]],
  [[-16, 2.4], [-17.8, 10.8], [-17.4, 19.6]],
];
const norm = (a: number[], b: number[]): [number, number] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [-dy / L, dx / L];
};
const legShape = (l: Leg, wu: number, wl: number) => {
  const [a, b, c] = l;
  const n1 = norm(a, b);
  const n2 = norm(b, c);
  const nx = n1[0] + n2[0];
  const ny = n1[1] + n2[1];
  const nl = Math.hypot(nx, ny) || 1;
  const nk: [number, number] = [nx / nl, ny / nl];
  const P = (pt: number[], n: [number, number], w: number, sgn: number) =>
    `${(pt[0] + n[0] * w * sgn).toFixed(2)},${(pt[1] + n[1] * w * sgn).toFixed(2)}`;
  const wk = (wu * 0.45 + wl * 0.55) / 2;
  return (
    `M${P(a, n1, wu / 2, 1)} L${P(b, nk, wk, 1)} L${P(c, n2, wl / 2, 1)} ` +
    `L${P(c, n2, wl / 2, -1)} L${P(b, nk, wk, -1)} L${P(a, n1, wu / 2, -1)} Z`
  );
};
const hoofD = (l: Leg) => {
  const [kx, ky] = l[1];
  const [hx, hy] = l[2];
  const L = Math.hypot(hx - kx, hy - ky) || 1;
  const ux = (hx - kx) / L;
  const uy = (hy - ky) / L;
  return `M${(hx - ux * 1.6).toFixed(2)},${(hy - uy * 1.6).toFixed(2)} L${(hx + ux * 0.6).toFixed(2)},${(hy + uy * 0.6).toFixed(2)}`;
};
const mixLegs = (A: Leg[], B: Leg[], t: number): Leg[] =>
  A.map((leg, i) => leg.map((pt, j) => [pt[0] + (B[i][j][0] - pt[0]) * t, pt[1] + (B[i][j][1] - pt[1]) * t] as [number, number]));

/** phase: the stride clock (one stride per 3 units); gait 0 standing .. 1 full stride */
export const Horse: React.FC<{ px: number; phase?: number; gait?: number }> = ({ px, phase = 0, gait = 0 }) => {
  const sw = 1 / px;
  const ph = ((phase % 3) + 3) % 3;
  const i = Math.floor(ph);
  const fr = ph - i;
  const tt = fr * fr * (3 - 2 * fr);
  const stride = mixLegs(GALLOP[i], GALLOP[(i + 1) % 3], tt);
  const legs = mixLegs(STAND, stride, gait * 0.8);
  const rock = -2.2 + gait * 2.4 * Math.sin((ph / 3) * 2 * Math.PI);
  const lift = -0.6 - gait * 1.1 * Math.abs(Math.sin((ph / 3) * Math.PI));
  const cw = 3 * sw;
  const legD = legs.map((l, k) => legShape(l, k < 2 ? 5.6 : 6.4, 2.9));
  const edge = { stroke: DARK, strokeOpacity: 0.6, strokeWidth: 1.5 * sw };
  return (
    <g transform={`translate(0 ${lift + 8}) rotate(${rock.toFixed(3)})`} strokeLinejoin="round" strokeLinecap="round">
      <g stroke={DARK} strokeOpacity={0.7} fill={DARK}>
        {legD.map((d, k) => (
          <path key={k} d={d} strokeWidth={2 * cw} />
        ))}
        <path d={H_TAIL} strokeWidth={2 * cw} />
        <path d={H_BODY} strokeWidth={2 * cw} />
        <path d={H_SADDLE} strokeWidth={2 * cw} />
      </g>
      {[1, 3].map((k) => (
        <g key={k}>
          <path d={legD[k]} fill={INK} {...edge} />
          <path d={legD[k]} fill={DARK} fillOpacity={0.3} />
          <path d={hoofD(legs[k])} stroke={DARK} strokeOpacity={0.8} strokeWidth={3.2} fill="none" />
        </g>
      ))}
      <path d={H_TAIL} fill={INK} {...edge} />
      <path d="M-20,-6 C-25,-6.6 -29.6,-3.6 -32.6,1.6 M-20,-4 C-24,-4.2 -27.6,-2 -30.4,1.6" fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={1.4 * sw} />
      <path d={H_BODY} fill={INK} {...edge} />
      {[0, 2].map((k) => (
        <g key={k}>
          <path d={legD[k]} fill={INK} {...edge} />
          <path d={hoofD(legs[k])} stroke={DARK} strokeOpacity={0.8} strokeWidth={3.2} fill="none" />
        </g>
      ))}
      <path d={H_HATCH} stroke={DARK} strokeOpacity={0.55} strokeWidth={1.5 * sw} fill="none" />
      <path d={H_MANE} stroke={DARK} strokeOpacity={0.55} strokeWidth={1.5 * sw} fill="none" />
      <circle cx={31.4} cy={-19.6} r={0.9} fill={DARK} fillOpacity={0.8} />
      <path d={H_SKIRT} fill={INK} {...edge} />
      <path d="M-7,-7.6 L6,-7.8 M-7.6,-4.6 L6.6,-4.8 M-8.6,-2.2 L7.2,-2.4" stroke={DARK} strokeOpacity={0.5} strokeWidth={1.3 * sw} fill="none" />
      <path d={H_TACK} stroke={DARK} strokeOpacity={0.7} strokeWidth={1.9 * sw} fill="none" />
      <path d={H_SADDLE} fill={INK} {...edge} />
      <path d={H_STIRRUP} stroke={DARK} strokeOpacity={0.75} strokeWidth={1.9 * sw} fill={INK} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// ARMS: a spanned crossbow with a cross-hilted sword laid across it. ~100 units
// tall, centred on (0, 0).
// ---------------------------------------------------------------------------
const CROSSBOW: Part[] = [
  // stirrup, steel prod, string drawn back to the nut
  { k: "stroke", d: "M-5.4,-37 C-7,-50 7,-50 5.4,-37", w: 2.6 },
  { k: "stroke", d: "M-38,-13 L0,-2 L38,-13", w: 1.5 },
  { k: "stroke", d: "M-38,-12 C-27,-31 -11,-36 0,-36 C11,-36 27,-31 38,-12", w: 5 },
  // the tiller and its long trigger lever
  { k: "stroke", d: "M2.6,8 L11,36", w: 2 },
  { k: "fill", d: "M-3.4,-38 L3.4,-38 L4.2,18 C4.2,30 3,40 1.9,48 L-1.9,48 C-3,40 -4.2,30 -4.2,18 Z" },
  { k: "dark", d: "M-3.4,-33 L3.4,-33 M-3.4,-30 L3.4,-30 M-3.4,-27 L3.4,-27 M-1.6,6 L-1.9,44 M1.4,20 L1,44" },
  { k: "shade", d: circ(0, -2, 2.1), o: 0.8 },
];
const SWORD: Part[] = [
  { k: "fill", d: "M-3,-10 L-1.9,-62 L0,-70 L1.9,-62 L3,-10 Z" },
  { k: "dark", d: "M0,-13 L0,-58" },
  { k: "stroke", d: "M-14,-10 L14,-10", w: 3.6 },
  { k: "fill", d: "M-2,-8 L2,-8 L1.8,5 L-1.8,5 Z" },
  { k: "dark", d: "M-1.9,-5 L1.9,-4 M-1.9,-2 L1.9,-1 M-1.9,1 L1.9,2" },
  { k: "fill", d: circ(0, 8.6, 3.8) },
];
export const Arms: React.FC<{ px: number }> = ({ px }) => (
  <g>
    <g transform="translate(-4 2) rotate(-20)">
      <Engraved parts={CROSSBOW} px={px} />
    </g>
    <g transform="translate(-22 34) rotate(40)">
      <Engraved parts={SWORD} px={px} />
    </g>
  </g>
);

// ---------------------------------------------------------------------------
// THE PURSE: a drawstring purse, coin beside it. Centred on (0, 0), ~56 tall.
// ---------------------------------------------------------------------------
export const PURSE_PARTS: Part[] = [
  // coin
  { k: "fill", d: ell(25, 23.4, 8, 3) },
  { k: "fill", d: ell(26, 20, 8, 3) },
  { k: "fill", d: ell(24.4, 16.6, 8, 3) },
  { k: "fill", d: ell(-26, 23.6, 8, 3) },
  { k: "fill", d: ell(-23, 20.4, 8, 3) },
  // the strings
  { k: "stroke", d: "M8,-12 C17,-12 21,-5 17.4,2 M17.4,2 L19.6,7 M17.4,2 L15,7", w: 1.7 },
  // the bag and its gathered mouth
  { k: "fill", d: "M-17,22 C-27,11 -22,-6 -8.6,-12 L8.6,-12 C22,-6 27,11 17,22 C9,26.6 -9,26.6 -17,22 Z" },
  { k: "fill", d: "M-8.6,-12 C-5.4,-15.4 -6.6,-19.6 -11.6,-24.6 C-6,-26.6 6,-26.6 11.6,-24.6 C6.6,-19.6 5.4,-15.4 8.6,-12 Z" },
  { k: "dark", d: "M-8.8,-12 L8.8,-12 M-8,-14.2 L8,-14.2", w: 2 },
  { k: "dark", d: "M-6,-10 C-11,0 -13,10 -12,21 M0,-10 C-1,2 -1,13 0,24.6 M6,-10 C11,0 13,10 12,21 M-6,-23 L-5,-16 M0,-24.6 L0,-16 M6,-23 L5,-16" },
  { k: "dark", d: "M14,2 l5,5 M13.6,8 l5.4,5.4 M12,14 l4.6,4.6 M9,19 l3.6,3.6" },
];

// ---------------------------------------------------------------------------
// THE SHIP
// ---------------------------------------------------------------------------
const HULL =
  "M-47,-31 L-48.6,-12 C-47.6,0 -41,8 -31,9 L27,9 C39,8 47,-2 53.6,-16.6 L50.6,-23 L30,-23 L28.4,-13 L-14,-13 L-16,-24 L-32,-24 L-33,-31 Z";
const HULL_LINES =
  "M-48.2,-8.4 C-30,-1.4 22,-1.4 50,-10.6 M-46,-1 C-30,5 24,5 46.4,-3.4 M-33,-27.4 L-47.4,-27.4 M-16.6,-20 L-32.4,-20 M30,-19.4 L52,-19.4";
// planking between the wales, and the turn of the bilge in shade
const HULL_PLANKS =
  "M-48,-4.6 C-30,2 23,2 48.4,-7 M-47.6,-11 C-30,-4.6 21,-4.6 51,-13.4 M-44,2.6 C-30,7.6 25,7.6 43,0.4 " +
  "M-30,-3.2 l0,3.4 M-12,-1.8 l0,3.4 M8,-1.6 l0,3.4 M28,-3.6 l0,3.4 M-21,1.2 l0,3.2 M-2,2.2 l0,3.2 M18,1.8 l0,3.2 M36,-0.6 l0,3.2 " +
  "M-38,-9.4 l0,3 M-20,-6.4 l0,3 M0,-5.2 l0,3 M20,-6 l0,3 M40,-10.4 l0,3 " +
  "M24,3 l4,3.6 M29,2.4 l4,3.6 M34,1.2 l4,3.4 M39,-0.6 l3.4,3 M43.6,-3.6 l2.6,2.6 M47,-8 l2,2.2";
const HULL_TICKS =
  "M-43.6,-31 L-43.6,-27.4 M-39.6,-31 L-39.6,-27.4 M-35.6,-31 L-35.6,-27.4 M-28,-24 L-28,-20 M-24,-24 L-24,-20 M-20,-24 L-20,-20 " +
  "M34,-23 L34,-19.4 M38,-23 L38,-19.4 M42,-23 L42,-19.4 M46,-23 L46,-19.4 " +
  "M-45,-5.6 l3.6,5 M-41,-4.4 l3.6,5.4 M-37,-3.4 l3.6,5.4 M-33,-2.6 l3.4,5.4 M-44,-17 l3,4 M-40,-17 l3,4";
const squareSail = (x0: number, x1: number, yTop: number, depth: number, s: number) => {
  const D = depth * s;
  const yb = yTop + D;
  const b = 5 * s;
  return (
    `M${x0},${yTop} L${x1},${yTop} C${x1 + b},${yTop + D * 0.35} ${x1 + b},${yTop + D * 0.7} ${x1 - 1},${yb} ` +
    `C${x1 - 12},${yb - b} ${x0 + 14},${yb - b} ${x0 + 3},${yb} C${x0 + 3 + b},${yTop + D * 0.7} ${x0 + 3 + b},${yTop + D * 0.35} ${x0},${yTop} Z`
  );
};
/** the seams of a square sail: one bellied line per cloth */
const seams = (xs: number[], yTop: number, D: number) =>
  xs.map((x) => `M${x},${yTop + 1} C${x + 2.6},${yTop + D * 0.4} ${x + 2.6},${yTop + D * 0.75} ${x + 0.8},${yTop + D - 2.6}`).join(" ");
/** short engraved shade strokes down the lee edge of a sail */
const shadeTicks = (x: number, yTop: number, D: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const y = yTop + 3 + ((D - 8) * i) / Math.max(1, n - 1);
    const bulge = 4.2 * Math.sin((Math.PI * (i + 0.5)) / n);
    return `M${(x + bulge - 4).toFixed(2)},${y.toFixed(2)} l4.6,2.4`;
  }).join(" ");
const waveD = (x: number, y: number, n: number, a = 3.2, w = 5) => {
  let d = `M${x},${y}`;
  for (let i = 0; i < n; i++) d += ` q${w / 2},${-a} ${w},0`;
  return d;
};

export const Ship: React.FC<{
  px: number;
  sails: [number, number, number]; // fore, main, lateen: 0 furled .. 1 set
  aboard?: { horse: number; arms: number; coin: number };
  frame?: number;
  waves?: number;
}> = ({ px, sails, aboard = { horse: 0, arms: 0, coin: 0 }, frame = 0, waves = 1 }) => {
  const [sf, sm, sl] = sails;
  const rig: Part[] = [
    // stays and shrouds
    { k: "stroke", d: "M2,-92 L70,-37 M34,-70 L70,-37 M2,-92 L-30,-72 M2,-90 L-9,-13 M2,-90 L13,-13 M34,-68 L28.6,-23 M34,-68 L41,-23 M-30,-70 L-24,-24 M-30,-70 L-37,-31", w: 0.55 },
    // masts and bowsprit
    { k: "stroke", d: "M-30,-31 L-30,-72", w: 1.9 },
    { k: "stroke", d: "M34,-23 L34,-71", w: 2 },
    { k: "stroke", d: "M2,-13 L2,-95", w: 2.6 },
    { k: "stroke", d: "M47,-22.6 L70,-37", w: 2 },
    { k: "fill", d: "M-1.6,-84.6 L5.6,-84.6 L6.8,-89.4 L-2.8,-89.4 Z" },
  ];
  // the lateen mizzen
  const A = [-50, -46];
  const B = [-14, -79];
  const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const C0 = [-17, -35];
  const clew = [mid[0] + (C0[0] - mid[0]) * sl, mid[1] + (C0[1] - mid[1]) * sl];
  const sailsP: Part[] = [];
  if (sl > 0.03)
    sailsP.push(
      { k: "fill", d: `M${A[0]},${A[1]} L${B[0]},${B[1]} Q${clew[0] + 5 * sl},${(B[1] + clew[1]) / 2} ${clew[0]},${clew[1]} Q${(A[0] + clew[0]) / 2},${clew[1] - 4 * sl} ${A[0]},${A[1]} Z` },
      { k: "dark", d: `M${mid[0] + 4},${mid[1] + 4} L${mid[0] + (clew[0] - mid[0]) * 0.8 + 2},${mid[1] + (clew[1] - mid[1]) * 0.8} M${A[0] + 12},${A[1] - 5} L${A[0] + 12 + (clew[0] - mid[0]) * 0.7},${A[1] - 5 + (clew[1] - mid[1]) * 0.55}`, o: 0.4 * sl },
      { k: "dark", d: `M${A[0] + 6},${A[1] - 1} L${A[0] + 6 + (clew[0] - mid[0]) * 0.34},${A[1] - 1 + (clew[1] - mid[1]) * 0.3} M${B[0] - 7},${B[1] + 9} L${B[0] - 7 + (clew[0] - mid[0]) * 0.5},${B[1] + 9 + (clew[1] - mid[1]) * 0.5}`, o: 0.4 * sl },
    );
  sailsP.push({ k: "stroke", d: `M${A[0]},${A[1]} L${B[0]},${B[1]}`, w: 1.5 + 2.2 * (1 - sl) });
  // fore and main square sails, their yards (a furled sail is a bundle on its yard)
  if (sf > 0.03)
    sailsP.push(
      { k: "fill", d: squareSail(19, 49, -62, 33, sf) },
      { k: "dark", d: seams([25, 31, 37, 43], -62, 33 * sf), o: 0.42 * sf },
      { k: "dark", d: shadeTicks(46.4, -62, 33 * sf, 6), o: 0.5 * sf },
    );
  sailsP.push({ k: "stroke", d: "M17.6,-62 L50.4,-62", w: 1.5 + 2.4 * (1 - sf) });
  if (sm > 0.03) {
    const D = 50 * sm;
    sailsP.push(
      { k: "fill", d: squareSail(-24, 28, -80, 50, sm) },
      { k: "dark", d: seams([-16, -9, -2, 10, 17, 23], -80, D), o: 0.42 * sm },
      { k: "dark", d: shadeTicks(24.6, -80, D, 9), o: 0.5 * sm },
      // the cross on the mainsail
      { k: "dark", d: `M3.6,${-80 + D * 0.24} L3.6,${-80 + D * 0.78} M-6,${-80 + D * 0.5} L13.4,${-80 + D * 0.5}`, w: 4.2, o: 0.62 * sm },
    );
  }
  sailsP.push({ k: "stroke", d: "M-26,-80 L30,-80", w: 1.6 + 2.6 * (1 - sm) });
  // the pennant at the main top
  const ph = frame * 0.42;
  const py = (x: number) => 1.5 * Math.sin(ph - x * 0.42) * (x / 18);
  const pen =
    `M2,-96.4 L8,${(-97 + py(6)).toFixed(2)} L14,${(-96.6 + py(12)).toFixed(2)} L21,${(-96 + py(19)).toFixed(2)} ` +
    `L14,${(-94 + py(12)).toFixed(2)} L8,${(-93 + py(6)).toFixed(2)} L2,-92.4 Z`;
  const hull: Part[] = [
    { k: "fill", d: HULL },
    { k: "dark", d: HULL_LINES, w: 1.9 },
    { k: "dark", d: HULL_TICKS },
    { k: "dark", d: HULL_PLANKS, o: 0.45, w: 1.4 },
    // the rudder
    { k: "dark", d: "M-48,-10 C-50.6,-2 -47,6 -42,8.4", w: 1.8, o: 0.5 },
  ];
  const sw = 1 / px;
  return (
    <g>
      <Engraved parts={rig} px={px} casing={2.4} />
      <Engraved parts={sailsP} px={px} />
      <g opacity={sl}>
        <Engraved parts={[{ k: "fill", d: pen }]} px={px} casing={2.4} />
      </g>
      {aboard.arms > 0.01 ? (
        <g opacity={aboard.arms}>
          <Engraved
            parts={[
              { k: "stroke", d: "M-10,-13 L-10,-36 M-6.4,-13 L-6.4,-39 M-2.8,-13 L-2.8,-35", w: 1.1 },
              { k: "fill", d: "M-10,-40.6 L-8.8,-36 L-11.2,-36 Z M-6.4,-43.6 L-5.2,-39 L-7.6,-39 Z M-2.8,-39.6 L-1.6,-35 L-4,-35 Z" },
            ]}
            px={px}
            casing={2.2}
          />
        </g>
      ) : null}
      {aboard.horse > 0.01 ? (
        <g opacity={aboard.horse}>
          <Engraved
            parts={[
              { k: "fill", d: "M9,-12.6 C10,-19 13.4,-24 17,-26.6 L16.8,-30 L19,-27.4 C22,-25.6 24.6,-22 26,-19.4 C26.4,-17.6 24.6,-17.4 22.6,-18.4 C21,-17 19.6,-15 19,-12.6 Z" },
              { k: "dark", d: "M12,-15 C13.4,-19.4 15.4,-22.6 17.6,-24.6" },
            ]}
            px={px}
            casing={2.2}
          />
        </g>
      ) : null}
      {aboard.coin > 0.01 ? (
        <g opacity={aboard.coin}>
          <Engraved
            parts={[
              { k: "fill", d: "M-29.6,-24 L-19.6,-24 L-19.6,-29.4 C-21.6,-32 -27.6,-32 -29.6,-29.4 Z" },
              { k: "dark", d: "M-29.6,-28.6 L-19.6,-28.6 M-26.4,-31 L-26.4,-24 M-22.8,-31 L-22.8,-24" },
            ]}
            px={px}
            casing={2.2}
          />
        </g>
      ) : null}
      <Engraved parts={hull} px={px} />
      {aboard.arms > 0.01 ? (
        <g opacity={aboard.arms}>
          {[-9, -2, 5].map((x) => (
            <g key={x}>
              <circle cx={x} cy={-8.6} r={3.1} fill={INK} stroke={DARK} strokeOpacity={0.7} strokeWidth={1.8 * sw} />
              <circle cx={x} cy={-8.6} r={0.9} fill={DARK} fillOpacity={0.7} />
            </g>
          ))}
        </g>
      ) : null}
      {waves > 0.01 ? (
        <g opacity={waves} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {[
            [-70, 6, 4],
            [-44, 12.6, 5],
            [-10, 14, 5],
            [24, 12.6, 5],
            [54, 5, 4],
          ].map(([x, y, n], i) => {
            const d = waveD(x + 1.2 * Math.sin(frame * 0.16 + i), y, n);
            return (
              <g key={i}>
                <path d={d} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.2 + 5 * sw} />
                <path d={d} stroke={INK} strokeWidth={1.2} />
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// GOLD: ingots stacked in rows. Units = world px. One bar is BAR_W wide; rows
// rise by BAR_RISE. `rows` lists the bars per row from the bottom.
// ---------------------------------------------------------------------------
export const BAR_W = 50;
export const BAR_RISE = 25;
export type Bar = { x: number; y: number; row: number };
export const stackBars = (rows: number[]): Bar[] => {
  const out: Bar[] = [];
  rows.forEach((n, r) => {
    // from the middle of the row outward
    const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2));
    for (const i of idx) out.push({ x: (i - (n - 1) / 2) * BAR_W, y: -r * BAR_RISE, row: r });
  });
  return out;
};
const barFront = (b: Bar) => `M${b.x - 23},${b.y} L${b.x + 23},${b.y} L${b.x + 18.6},${b.y - 20} L${b.x - 18.6},${b.y - 20} Z`;
const barTop = (b: Bar) => `M${b.x - 18.6},${b.y - 20} L${b.x + 18.6},${b.y - 20} L${b.x + 14.6},${b.y - 27.4} L${b.x - 14.6},${b.y - 27.4} Z`;
export const barOutline = (b: Bar) =>
  `M${b.x - 23},${b.y} L${b.x + 23},${b.y} L${b.x + 18.6},${b.y - 20} L${b.x + 14.6},${b.y - 27.4} L${b.x - 14.6},${b.y - 27.4} L${b.x - 18.6},${b.y - 20} Z`;

/** present(i) 0..1 per bar (in stackBars order): a bar travels its last `from` px into place (negative = from above) */
export const GoldBars: React.FC<{ bars: Bar[]; present: (i: number) => number; px?: number; from?: number; solid?: boolean }> = ({
  bars,
  present,
  px = 1,
  from = -16,
  solid = false,
}) => {
  const sw = 1 / px;
  // back rows first, so each row overlaps the top faces of the one beneath
  const order = bars.map((b, i) => ({ b, i })).sort((p, q) => p.b.row - q.b.row);
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {order.map(({ b, i }) => {
        const pr = present(i);
        if (pr <= 0.01) return null;
        return (
          <g key={i} opacity={Math.min(1, pr * 1.6)} transform={`translate(0 ${(from * (1 - pr)).toFixed(2)})`}>
            {/* solid: the shadowed gaps between neighbours are filled, so nothing shows through the stack */}
            {solid ? <rect x={b.x - BAR_W / 2 - 0.5} y={b.y - 21} width={BAR_W + 1} height={21} fill="#1A130C" /> : null}
            <path d={barOutline(b)} fill={DARK} stroke={DARK} strokeOpacity={0.75} strokeWidth={5 * sw} />
            <path d={barFront(b)} fill={ACCENT_DEEP} stroke={DARK} strokeOpacity={0.7} strokeWidth={1.6 * sw} />
            <path d={barTop(b)} fill={ACCENT} stroke={DARK} strokeOpacity={0.7} strokeWidth={1.6 * sw} />
            <path
              d={`M${b.x + 6},${b.y - 15} l5,10 M${b.x + 11},${b.y - 16} l5.6,11 M${b.x - 16},${b.y - 16.6} L${b.x + 1},${b.y - 16.6}`}
              fill="none"
              stroke={DARK}
              strokeOpacity={0.42}
              strokeWidth={1.5 * sw}
            />
          </g>
        );
      })}
    </g>
  );
};
