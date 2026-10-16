import React from "react";

// ---------------------------------------------------------------------------
// threeYearsShip: the one engraved carrack of ThreeYearsBefore (Cortés's
// flagship standing for his fleet of 1519). Profile, facing WEST (bow left),
// in a 100-unit frame: x 0 (bow) .. 100 (stern), the waterline y 0, up
// negative. The silhouette is the cortesShared carrack's (hull with a sheer
// line, forecastle, low waist, tall sterncastle; square fore and main courses,
// main topsail, lateen mizzen); drawn larger here, so it carries more of the
// engraver's work: standing rigging, sail seams, a cross on the main course,
// castle panels, wales, a rudder, a bow wave and ripples on the waterline.
// Cream ink on a dark casing; nothing coloured.
// ---------------------------------------------------------------------------
const INK = "#E9DDBF";
const DARK = "#0B0907";

const HULL =
  "M7,-15 L23,-14.5 L24.5,-10.5 L47,-8.6 L64,-10.4 L65.5,-17 L88,-21 L95.5,-21.5 L95,-17 L92.5,-6 L89,1.2 C78,5.4 60,6.6 40,6 C26,5.6 15,3.6 11,0.2 L8.4,-6 Z";
const FORECASTLE = "M7,-15 L7.6,-18.9 L22.6,-18.2 L23,-14.5 Z";
const STERNCASTLE = "M65.5,-17 L66,-21.9 L88.6,-25.7 L95.7,-25.9 L95.5,-21.5 L88,-21 Z";
const PANELS =
  "M11.4,-15 L11.6,-18.6 M15.4,-14.9 L15.6,-18.4 M19.4,-14.7 L19.6,-18.3 M70.5,-17.9 L70.7,-22.6 M75.5,-18.8 L75.7,-23.4 M80.5,-19.7 L80.7,-24.3 M85.5,-20.6 L85.7,-25.1 M91,-21.2 L91.2,-25.7";
const PLANKS =
  "M10.2,-4.2 C30,-1.6 60,-2.2 91.2,-9.6 M9.4,-9.6 C28,-6.6 58,-6.2 93.6,-14.4 M12.6,1.2 C30,3.6 62,3.4 88.4,-2.4 M66.6,-13.6 L94.6,-17.8";
const RUDDER = "M92.6,-6.2 L95,-5.2 L92,2.4 L89,1.2";
const MASTS = "M20,-14.8 L20,-55 M45,-8.8 L45,-80 M74,-18.5 L74,-56";
const BOWSPRIT = "M8.6,-15.6 L-6.5,-25.5";
const STAYS = "M20,-55 L-6.5,-25.5 M45,-80 L20,-55 M45,-80 L74,-56 M74,-56 L95.6,-25.9";
const SHROUDS =
  "M45,-62 L36.4,-8.9 M45,-62 L40.2,-8.8 M45,-62 L49.8,-8.9 M45,-62 L53.6,-9.3 M20,-49 L14,-14.8 M20,-49 L17,-14.7 M20,-49 L23.2,-14.4 M74,-50 L69,-17.7 M74,-50 L79,-19.4";
const FORE = "M9.6,-49 L30.4,-49 C31.8,-41 31.6,-30 29.4,-21.5 C24,-19.8 16.4,-19.8 11.2,-21.5 C9,-30 8.6,-41 9.6,-49 Z";
const MAIN = "M31.6,-62 L58.4,-62 C60.2,-51 60,-38 57.4,-26.5 C50.6,-24.4 39.6,-24.4 32.8,-26.5 C30,-38 29.8,-51 31.6,-62 Z";
const MAIN_TOP = "M36.4,-77 L53.6,-77 C54.6,-72.4 54.4,-68.2 53,-64.4 C48.6,-63.4 41.4,-63.4 37,-64.4 C35.6,-68.2 35.4,-72.4 36.4,-77 Z";
const TOP = "M41.4,-63.8 L48.6,-63.8 L47.8,-60.6 L42.2,-60.6 Z";
const YARDS = "M8,-49.6 L32,-49.6 M30,-62.6 L60,-62.6 M35,-77.6 L55,-77.6";
const MIZZEN = "M61.5,-21.8 L91.5,-60.5 C90.6,-48 89.2,-35 86.4,-24.2 C78,-22.6 69,-22.2 61.5,-21.8 Z";
const MIZZEN_YARD = "M59.6,-19.4 L93.4,-63";
const PENNANT = "M45,-80 C38,-81.8 33,-79 25.5,-80.6 C31.6,-78.6 37.6,-78.4 45,-77.2";
// the cross on the main course (a plain cross pattee)
const CROSS =
  "M43.9,-46.1 L42.5,-55 L47.5,-55 L46.1,-46.1 L53.4,-47.6 L53.4,-42.4 L46.1,-43.9 L47.5,-35 L42.5,-35 L43.9,-43.9 L36.6,-42.4 L36.6,-47.6 Z";
// engraved shade: the cloths' seams, and closer lines down each sail's lee side
const SEAMS =
  "M38.6,-61.6 C37.5,-50 37.7,-38 39.5,-25.4 M51.4,-61.6 C52.5,-50 52.3,-38 50.5,-25.4 M16.6,-48.8 C15.7,-40 15.9,-30 17.1,-20.5 M23.4,-48.8 C24.3,-40 24.1,-30 22.9,-20.5 M45,-76.8 L45,-63.8 M70.4,-33 C73,-29.6 75.4,-26.2 76.6,-22.8 M78.6,-43.6 C80.6,-37 81.6,-30 81.4,-23.2";
const LEE =
  "M56.4,-58.8 L56,-30.5 M54.9,-60 L54.7,-28.6 M28.4,-46.4 L28,-25 M26.9,-47 L26.7,-23.4 M51.8,-74.4 L51.4,-66.8 M50.3,-75 L50.1,-66 M87.2,-50 L84.8,-27.4 M85.4,-45.4 L83.4,-26";
const BOW_WAVE = ["M10.4,0.6 C6.4,-3.2 1.6,-2.6 -2.6,0.8", "M13,3 C7,0.8 0.6,1.8 -6.4,5", "M17,5.6 C10,4.2 4,5.2 -1.6,7.6"];
const RIPPLES: [number, number, number][] = [
  [16, 8.6, 9],
  [31, 9.6, 14],
  [52, 9.8, 12],
  [70, 9, 10],
  [86, 7.4, 8],
  [24, 12.4, 10],
  [44, 13.2, 13],
  [66, 12.6, 9],
];

/** the glyph's box in units about its reference point (the bow at the waterline, unit (14, 0)) */
export const SHIP_REF_X = 14;
export const SHIP_BOX = { x0: -6.5 - SHIP_REF_X, x1: 96 - SHIP_REF_X, y0: -82, y1: 7 };

export const Carrack1519: React.FC<{
  /** screen position of the reference point (the bow at the waterline) */
  x: number;
  y: number;
  /** screen px per 100 units (the glyph is ~102 units long) */
  size: number;
  frame: number;
  /** 1 under way .. 0 at anchor: the bow wave, the pitch */
  way: number;
}> = ({ x, y, size, frame, way }) => {
  const u = size / 100;
  const sw = 1 / u; // 1 screen px in units
  // one continuous clock for the motion on the water: a pitch under way that
  // eases into a slight rock at anchor (never still, never a jump)
  const rock = (1.5 * way + 0.95 * (1 - way)) * Math.sin(frame * 0.2 + 0.6) + 0.5 * way;
  const bob = (0.85 * way + 0.6 * (1 - way)) * Math.sin(frame * 0.17 + 2.1);
  const casing = { fill: "none", stroke: DARK, strokeOpacity: 0.72, strokeWidth: 4.6 * sw };
  const sail = { fill: INK, stroke: DARK, strokeOpacity: 0.6, strokeWidth: 1 * sw };
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${u.toFixed(5)}) translate(${50 - SHIP_REF_X} 0)`} strokeLinejoin="round" strokeLinecap="round">
      {/* the water at the hull: ripples that drift aft, a bow wave while she is under way */}
      {RIPPLES.map(([rx, ry, len], i) => {
        const ph = (((frame * 0.035 + i * 0.37) % 1) + 1) % 1;
        const a = Math.sin(Math.PI * ph);
        const x0 = rx - 50 + 9 * ph;
        return <line key={i} x1={x0} y1={ry} x2={x0 + len} y2={ry} stroke={INK} strokeOpacity={0.5 * a} strokeWidth={1.5 * sw} />;
      })}
      <g transform={`translate(0 ${bob.toFixed(3)}) rotate(${rock.toFixed(3)}) translate(-50 0)`}>
        {way > 0.01
          ? BOW_WAVE.map((d, i) => <path key={i} d={d} fill="none" stroke={INK} strokeOpacity={(0.85 - 0.2 * i) * way} strokeWidth={(1.9 - 0.25 * i) * sw} />)
          : null}
        {/* the dark casing under everything */}
        <g {...casing}>
          <path d={MASTS} />
          <path d={BOWSPRIT} />
          <path d={MIZZEN_YARD} />
          <path d={YARDS} />
          <path d={FORE} />
          <path d={MAIN} />
          <path d={MAIN_TOP} />
          <path d={MIZZEN} />
          <path d={HULL} />
          <path d={FORECASTLE} />
          <path d={STERNCASTLE} />
          <path d={RUDDER} />
          <path d={PENNANT} />
        </g>
        <g fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={2.6 * sw}>
          <path d={STAYS} />
        </g>
        {/* standing rigging, spars */}
        <path d={STAYS} fill="none" stroke={INK} strokeOpacity={0.8} strokeWidth={1 * sw} />
        <path d={SHROUDS} fill="none" stroke={INK} strokeOpacity={0.85} strokeWidth={1 * sw} />
        <path d={MASTS} fill="none" stroke={INK} strokeWidth={2.3 * sw} />
        <path d={BOWSPRIT} fill="none" stroke={INK} strokeWidth={2 * sw} />
        <path d={MIZZEN_YARD} fill="none" stroke={INK} strokeWidth={1.8 * sw} />
        <path d={YARDS} fill="none" stroke={INK} strokeWidth={1.9 * sw} />
        {/* the sails, full */}
        <path d={FORE} {...sail} />
        <path d={MAIN} {...sail} />
        <path d={MAIN_TOP} {...sail} />
        <path d={MIZZEN} {...sail} />
        <path d={TOP} fill={INK} stroke={DARK} strokeOpacity={0.6} strokeWidth={0.9 * sw} />
        <path d={PENNANT} fill={INK} />
        <g fill="none" stroke={DARK}>
          <path d={SEAMS} strokeOpacity={0.34} strokeWidth={0.9 * sw} />
          <path d={LEE} strokeOpacity={0.6} strokeWidth={1 * sw} />
        </g>
        <path d={CROSS} fill={DARK} fillOpacity={0.8} />
        {/* the hull */}
        <path d={RUDDER} fill={INK} stroke={DARK} strokeOpacity={0.6} strokeWidth={1 * sw} />
        <path d={HULL} fill={INK} stroke={DARK} strokeOpacity={0.6} strokeWidth={1 * sw} />
        <path d={FORECASTLE} fill={INK} stroke={DARK} strokeOpacity={0.6} strokeWidth={1 * sw} />
        <path d={STERNCASTLE} fill={INK} stroke={DARK} strokeOpacity={0.6} strokeWidth={1 * sw} />
        <g fill="none" stroke={DARK} strokeOpacity={0.62}>
          <path d={PLANKS} strokeWidth={1.05 * sw} />
          <path d={PANELS} strokeWidth={0.95 * sw} />
        </g>
      </g>
    </g>
  );
};
