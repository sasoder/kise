import React from "react";

// ---------------------------------------------------------------------------
// The isotype icon family for RussiaAMultipleV2: five period silhouettes drawn
// in one engraved manner. Every icon lives in a box 100 units tall (y 0 = cap
// line, y 100 = baseline) and as wide as it needs; the silhouette is one
// nonzero-filled path (details are counter-wound holes). An icon is drawn as a
// MASS: a wash + the dense engraved hatch inside the silhouette, one outer
// outline (the union's edge only, via a mask) with a dark halo outside it.
//
//   man      POPULATION: a c.1900 man front-on, peaked cap, long coat, boots
//   factory  INDUSTRIAL BASE: sawtooth roof, one tall chimney, a row of windows
//   cart     RESOURCE ENDOWMENT: a mine cart heaped with ore, on a short rail
//   soldier  ARMY: an infantryman in profile, peaked cap, greatcoat, rifle with
//            fixed bayonet at the shoulder
//   ship     NAVY: a pre-dreadnought in side view (after Knyaz Suvorov): low
//            hull with a ram bow, two tall funnels, two pole masts with
//            fighting tops, fore and aft turrets, casemate ports
// ---------------------------------------------------------------------------

const f = (v: number) => (Math.round(v * 100) / 100).toString();
const rect = (x: number, y: number, w: number, h: number, hole = false) =>
  hole
    ? `M${f(x)},${f(y)}V${f(y + h)}H${f(x + w)}V${f(y)}Z`
    : `M${f(x)},${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
const circle = (cx: number, cy: number, r: number, hole = false) =>
  `M${f(cx - r)},${f(cy)}A${f(r)},${f(r)} 0 1 ${hole ? 0 : 1} ${f(cx + r)},${f(cy)}A${f(r)},${f(r)} 0 1 ${hole ? 0 : 1} ${f(cx - r)},${f(cy)}Z`;
const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${f(x)},${f(y)}`).join("L")}Z`;

export type IconKind = "man" | "factory" | "cart" | "soldier" | "ship";
export type IconDef = { w: number; x0: number; x1: number; d: string };

const MAN: IconDef = {
  w: 46,
  x0: 5,
  x1: 41,
  d: [
    // peaked cap: crown + visor
    "M13.5,12.5L14.5,5.5Q23,1.5 31.5,5.5L32.5,12.5Z",
    rect(11.5, 11.5, 23, 3.4),
    circle(23, 19, 7.6), // head
    rect(19.5, 24, 7, 6), // neck
    // long coat, shoulders to below the knee, a little flared
    "M8,36Q9,29 17,28L29,28Q37,29 38,36L41,79L5,79Z",
    rect(13, 78, 8, 18), // legs
    rect(25, 78, 8, 18),
    "M10.5,95H21.5V100H10.5Z", // boots
    "M24.5,95H35.5V100H24.5Z",
    // coat buttons line as a narrow slit (hole)
    rect(22.2, 36, 1.6, 36, true),
  ].join(""),
};

const FACTORY: IconDef = {
  w: 132,
  x0: 4,
  x1: 128,
  d: [
    // sawtooth roof: vertical glazing faces, sloping backs
    poly([
      [4, 50],
      [4, 26],
      [27, 46],
      [27, 26],
      [50, 46],
      [50, 26],
      [73, 46],
      [73, 26],
      [96, 46],
      [96, 50],
    ]),
    rect(4, 46, 124, 54), // the shed
    rect(96, 38, 32, 10), // the engine house's flat roof
    // one tall tapered chimney with a cap band
    poly([
      [103.5, 40],
      [106.5, 4],
      [113.5, 4],
      [116.5, 40],
    ]),
    rect(104.5, 0, 11, 5),
    // windows and the door (holes)
    rect(12, 60, 13, 16, true),
    rect(33, 60, 13, 16, true),
    rect(54, 60, 13, 16, true),
    rect(75, 60, 13, 16, true),
    rect(104, 72, 14, 28, true),
  ].join(""),
};

const CART: IconDef = {
  w: 136,
  x0: 0,
  x1: 136,
  d: [
    rect(0, 94, 136, 6), // the rail
    circle(34, 83, 11), // wheels
    circle(102, 83, 11),
    // the tub: a trapezoid with a rim lip
    poly([
      [14, 42],
      [122, 42],
      [110, 78],
      [26, 78],
    ]),
    rect(9, 36, 118, 8),
    // the heap of ore lumps
    circle(27, 32, 10),
    circle(44, 24, 12),
    circle(62, 20, 12.5),
    circle(80, 17, 13),
    circle(97, 24, 12),
    circle(112, 32, 9.5),
    circle(54, 30, 10),
    circle(88, 30, 10),
    poly([
      [22, 38],
      [40, 22],
      [80, 14],
      [104, 24],
      [116, 38],
    ]), // the heap's body, so no daylight shows between lumps
    // wheel hubs (holes)
    circle(34, 83, 3.2, true),
    circle(102, 83, 3.2, true),
  ].join(""),
};

const SOLDIER: IconDef = {
  w: 60,
  x0: 16,
  x1: 54,
  d: [
    // peaked cap: crown + peak jutting forward (he faces right)
    "M21.5,15.5L22.5,8.5Q30,4.5 37.5,8.5L38.5,15.5Z",
    poly([
      [35, 12.5],
      [46.5, 15.5],
      [37, 16.5],
    ]),
    circle(30, 21, 7.6), // head
    rect(26.5, 27, 7, 5), // neck
    // greatcoat, skirt to the knee
    "M19,36Q20,31 30,30Q40,31 42,36L45,76L17,76Z",
    rect(22, 75, 15, 21), // legs
    poly([
      [20, 95],
      [43, 95],
      [44.5, 100],
      [20, 100],
    ]), // boots, toe forward
    // the arm holding the rifle at the shoulder
    poly([
      [36, 33],
      [42, 34],
      [49, 55],
      [44, 57],
    ]),
    // the rifle: stock, barrel, fixed bayonet (butt at the hip, muzzle up)
    poly([
      [46, 54],
      [52, 54],
      [54, 76],
      [47.5, 78],
    ]),
    poly([
      [47, 56],
      [50.5, 56],
      [45.4, 9],
      [43.2, 9],
    ]),
    poly([
      [43.6, 10],
      [45, 10],
      [43.8, 0],
    ]),
  ].join(""),
};

const SHIP: IconDef = {
  w: 230,
  x0: 3,
  x1: 227,
  d: [
    // the hull: low, a ram bow to the right, rounded stern to the left
    "M8,72L226,72L218,88Q214,96 204,96L22,96Q10,95 5,86L3,76Z",
    rect(40, 60, 148, 13), // the superstructure
    rect(148, 48, 28, 13), // fore bridge
    rect(62, 52, 24, 9), // aft bridge
    // two tall funnels with cap bands
    rect(102, 28, 12, 33),
    rect(100.5, 25, 15, 5),
    rect(124, 28, 12, 33),
    rect(122.5, 25, 15, 5),
    // turrets and their guns
    "M186,72L187,64Q197,60 207,64L208,72Z",
    rect(205, 64.5, 20, 3.4),
    "M22,72L23,64Q33,60 43,64L44,72Z",
    rect(5, 64.5, 20, 3.4),
    // masts with fighting tops (pole masts, no yards: crosses read as crosses)
    rect(160, 4, 3.4, 45),
    "M155,24H168.4L166.4,30H157Z",
    rect(73, 8, 3.4, 45),
    "M68,28H81.4L79.4,34H70Z",
    // a row of casemate ports (holes)
    rect(52, 76, 8, 5, true),
    rect(78, 76, 8, 5, true),
    rect(140, 76, 8, 5, true),
    rect(166, 76, 8, 5, true),
  ].join(""),
};

export const ICONS: Record<IconKind, IconDef> = { man: MAN, factory: FACTORY, cart: CART, soldier: SOLDIER, ship: SHIP };
export const ICON_H = 100;

/** the defs one icon family needs: per kind, an OUTSIDE mask (for the outer
 *  outline) and an INSIDE mask (for a partial icon's cut edge) */
export const IconDefs: React.FC<{ prefix: string }> = ({ prefix }) => (
  <>
    {(Object.keys(ICONS) as IconKind[]).map((k) => {
      const I = ICONS[k];
      return (
        <React.Fragment key={k}>
          <mask id={`${prefix}-out-${k}`} maskUnits="userSpaceOnUse" x={-30} y={-30} width={I.w + 60} height={ICON_H + 60}>
            <rect x={-30} y={-30} width={I.w + 60} height={ICON_H + 60} fill="#fff" />
            <path d={I.d} fill="#000" />
          </mask>
          <mask id={`${prefix}-in-${k}`} maskUnits="userSpaceOnUse" x={-30} y={-30} width={I.w + 60} height={ICON_H + 60}>
            <path d={I.d} fill="#fff" />
          </mask>
        </React.Fragment>
      );
    })}
  </>
);

/**
 * One icon at local (0, 0) (top-left of its 100-tall box). `frac` < 1 draws a
 * partial icon: clipped at x0 + frac * (x1 - x0) of the silhouette, with the
 * cut closed by a ruled edge in the outline ink, so it reads as a fraction of
 * one icon (isotype practice: the numeral sits right after the cut).
 */
export const IsoIcon: React.FC<{
  kind: IconKind;
  prefix: string;
  ink: string;
  shade: string;
  wash: number;
  hatchFill: string;
  sw: number;
  frac?: number;
  clipId?: string;
}> = ({ kind, prefix, ink, shade, wash, hatchFill, sw, frac = 1, clipId }) => {
  const I = ICONS[kind];
  const cut = I.x0 + frac * (I.x1 - I.x0);
  const body = (
    <>
      <path d={I.d} fill={ink} fillOpacity={wash} />
      <path d={I.d} fill={hatchFill} />
      <g mask={`url(#${prefix}-out-${kind})`}>
        <path d={I.d} fill="none" stroke={shade} strokeOpacity={0.45} strokeWidth={2 * sw + 5} strokeLinejoin="round" />
        <path d={I.d} fill="none" stroke={ink} strokeWidth={2 * sw} strokeLinejoin="round" />
      </g>
    </>
  );
  if (frac >= 0.999) return body;
  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect x={-30} y={-30} width={cut + 30} height={ICON_H + 60} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{body}</g>
      <g mask={`url(#${prefix}-in-${kind})`}>
        <line x1={cut - sw / 2} y1={-5} x2={cut - sw / 2} y2={ICON_H + 5} stroke={ink} strokeWidth={sw} />
      </g>
    </>
  );
};
