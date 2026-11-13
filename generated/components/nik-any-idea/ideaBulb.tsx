import React, { useId } from "react";
import { ALPHA, COLOR, EDGE, ElevationShadow, bloomFilter, clamp01, mixHex, smoothstep, type Elevation, type Silhouette } from "../kits/cheeky-pint/stoutShared";

// ---------------------------------------------------------------------------
// ideaBulb — THE IDEA BULB of the nik-any-idea clip (Cheeky Pint, stout board, palette B1).
// Owned by cut 34 NinetyNineYes; cut 4 ExecutionOutweighs imports it. After ideaBulb_READY.md only ADD
// exports, never change existing geometry (log additions in the notes folder's SHARED_CHANGES.md).
//
// A chunky, flat, stylised lightbulb in the stout material: a round glass bulb with a short waist, a
// board-tone screw base of three bands with two dark grooves, a darker contact tip, a chunky filament.
// No outlines. One key light (above, a little left): the glass carries the cream lit top edge (unlit) or
// the 2 px hot top edge (lit) and a soft highlight on its upper left; one union shadow per bulb.
//
// LIT 0..1: the filament warms first, then the amber spreads out from the filament through the glass
// (a feathered disc, masked to the glass) until the whole glass is amber, glowing through the kit's
// bloom. 0 = cream glass, off; 1 = amber glass, on. Drive it from whatever lights the bulb (a wavefront),
// over ~8-12 frames.
//
// UNITS: (x, y) is the centre of the bulb's bounding box, `size` its full height, both WORLD px (inside
// StoutStage under the camera). `k` is the camera zoom (screen-px edges and bloom). The box is
// BULB.W x 1 of size: a bulb of size 74 is 56 x 74 world px. Readable from ~60 screen px tall.
//
// API
//   IdeaBulb({ x, y, size, k, lit?, dim?, part?, shadow?, bloom?, elevation?, lift?, amberBand?, filament? })
//   BulbField({ bulbs: {x, y, size, lit?, dim?}[], k, elevation?, amberBand? })  many bulbs: ONE shadow layer,
//             one bloom pass (use it for any crowd of bulbs; IdeaBulb with part= does the same by hand)
//   bulbSilhouette(x, y, size)  the union silhouette (for ElevationShadow / a shared shadow)
//   bulbBox(size)               { w, h } world px;  bulbGlass(x, y, size)  the glass circle { cx, cy, r }
//   BULB                        the geometry (fractions of size, origin at the box centre)
// ---------------------------------------------------------------------------

/** The bulb's geometry as fractions of its height (origin = the box centre, y down). */
export const BULB = {
  W: 0.76, // box width / height
  R: 0.38, // glass radius
  CY: -0.12, // glass centre y
  SHOULDER: 35, // degrees below horizontal where the round glass turns into the waist
  NECK_HW: 0.155, // the waist's half-width where it enters the base
  NECK_Y: 0.24, // ... and its y (under the base's top band)
  BASE_TOP: 0.228, // the screw base: top of its first band
  BASE_HW: 0.172, // band half-width (a touch wider than the waist: the glass sits in the collar)
  BANDS: [
    [0.228, 0.288],
    [0.312, 0.362],
    [0.386, 0.432],
  ] as readonly (readonly [number, number])[],
  CORE_HW: 0.145, // the groove core behind the bands
  TIP: { y0: 0.426, y1: 0.5, hwTop: 0.112, hwBot: 0.066 }, // the contact tip
  FIL: { hw: 0.06, y0: 0.238, y1: -0.02, w: 0.05 }, // filament: two posts from the waist, a loop on top (stroke w)
  GLOW_C: -0.05, // where the light starts (the filament loop)
  HIGHLIGHT: { x: -0.17, y: -0.275, rx: 0.05, ry: 0.112, rot: 38 },
} as const;

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

export const bulbBox = (size: number) => ({ w: BULB.W * size, h: size });
export const bulbGlass = (x: number, y: number, size: number) => ({ cx: x, cy: y + BULB.CY * size, r: BULB.R * size });

/** The glass outline (round bulb + waist), world px. */
export const bulbGlassPath = (x: number, y: number, s: number) => {
  const R = BULB.R * s;
  const cy = y + BULB.CY * s;
  const a = (BULB.SHOULDER * Math.PI) / 180;
  const sx = R * Math.cos(a);
  const sy = cy + R * Math.sin(a);
  const tx = -Math.sin(a); // tangent going down the right shoulder
  const ty = Math.cos(a);
  const nhw = BULB.NECK_HW * s;
  const ny = y + BULB.NECK_Y * s;
  const c1 = 0.32 * (ny - sy) / ty; // control lengths along the tangent / straight up from the neck
  const c2 = 0.55 * (ny - sy);
  return (
    `M${f3(x - sx)} ${f3(sy)}` +
    `A${f3(R)} ${f3(R)} 0 1 1 ${f3(x + sx)} ${f3(sy)}` +
    `C${f3(x + sx + tx * c1)} ${f3(sy + ty * c1)} ${f3(x + nhw)} ${f3(ny - c2)} ${f3(x + nhw)} ${f3(ny)}` +
    `H${f3(x - nhw)}` +
    `C${f3(x - nhw)} ${f3(ny - c2)} ${f3(x - sx - tx * c1)} ${f3(sy + ty * c1)} ${f3(x - sx)} ${f3(sy)}Z`
  );
};

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f3(x + r)} ${f3(y)}H${f3(x + w - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + w)} ${f3(y + r)}V${f3(y + h - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + w - r)} ${f3(
    y + h,
  )}H${f3(x + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x)} ${f3(y + h - r)}V${f3(y + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + r)} ${f3(y)}Z`;

const tipPath = (x: number, y: number, s: number) => {
  const T = BULB.TIP;
  const y0 = y + T.y0 * s;
  const y1 = y + T.y1 * s;
  const a = T.hwTop * s;
  const b = T.hwBot * s;
  const r = (y1 - y0) * 0.45;
  return `M${f3(x - a)} ${f3(y0)}H${f3(x + a)}L${f3(x + b)} ${f3(y1 - r)}Q${f3(x + b * 0.8)} ${f3(y1)} ${f3(x + b - r)} ${f3(y1)}H${f3(x - b + r)}Q${f3(
    x - b * 0.8,
  )} ${f3(y1)} ${f3(x - b)} ${f3(y1 - r)}Z`;
};

/** The union silhouette of one bulb (glass + base + tip), for its one shadow. */
export const bulbSilhouette = (x: number, y: number, s: number): Silhouette => [
  { d: bulbGlassPath(x, y, s) },
  { d: rr(x - BULB.BASE_HW * s, y + BULB.BASE_TOP * s, 2 * BULB.BASE_HW * s, (BULB.BANDS[2][1] - BULB.BASE_TOP) * s, 0.02 * s) },
  { d: tipPath(x, y, s) },
];

/** An arc of the glass circle (for the lit top edge), from angle a0 to a1 (degrees, screen: 270 = top). */
const glassArc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (deg: number) => {
    const t = (deg * Math.PI) / 180;
    return `${f3(cx + r * Math.cos(t))} ${f3(cy + r * Math.sin(t))}`;
  };
  return `M${p(a0)}A${f3(r)} ${f3(r)} 0 0 1 ${p(a1)}`;
};

export type BulbPart = "all" | "body" | "amber" | "top";
export type IdeaBulbProps = {
  x: number;
  y: number;
  /** full height, world px */
  size: number;
  /** camera zoom (screen-px edges and bloom) */
  k: number;
  /** 0 = off (cream glass) .. 1 = on (amber glass) */
  lit?: number;
  /** 0 = lit card .. 1 = context: the unlit glass mixes toward the board tone (dim by tone, never opacity) */
  dim?: number;
  /** draw only one layer (BulbField layers a crowd: body, then all amber in one bloom, then tops) */
  part?: BulbPart;
  /** its own shadow (part "all" only; a crowd shares one: BulbField) */
  shadow?: boolean;
  /** the amber's bloom (off when a crowd blooms its amber in one pass) */
  bloom?: boolean;
  elevation?: Elevation;
  lift?: number;
  /** world [y0, y1] of the amber gradient; default the bulb's own glass (lit from above) */
  amberBand?: [number, number];
  filament?: boolean;
};

/**
 * IdeaBulb — one idea bulb. See the header for the geometry and LIT.
 */
export const IdeaBulb: React.FC<IdeaBulbProps> = ({
  x,
  y,
  size: s,
  k,
  lit = 0,
  dim = 0,
  part = "all",
  shadow = true,
  bloom = true,
  elevation = "rest",
  lift = 0,
  amberBand,
  filament = true,
}) => {
  const uid = `ib${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const L = clamp01(lit);
  const glass = bulbGlassPath(x, y, s);
  const G = bulbGlass(x, y, s);
  const band = amberBand ?? [G.cy - G.r, y + BULB.NECK_Y * s];
  // the spread: a feathered disc from the filament; at 1 it covers the whole glass
  const spread = smoothstep(L);
  const full = L >= 0.999;
  const off = L <= 0.001;
  const gc = { x, y: y + BULB.GLOW_C * s };
  const reach = (BULB.R + Math.abs(BULB.GLOW_C - BULB.CY)) * s + 0.02 * s; // farthest glass point from the glow's centre (+ a hair)
  const feather = 0.16 * s;
  const rG = reach + feather;
  const edge = spread * rG; // the disc's outer (black) stop, gradient px
  const inner = Math.max(0, edge - feather);
  // the filament warms ahead of the glass
  const warm = smoothstep(L / 0.35);
  const glassTop = mixHex(COLOR.cream, COLOR.board, dim);
  const glassFoot = mixHex(COLOR.creamFoot, COLOR.boardFoot, dim);
  const groove = mixHex(COLOR.boardFoot, COLOR.inkDark, 0.5);
  const tip = mixHex(COLOR.boardFoot, COLOR.inkDark, 0.32);
  const filOff = mixHex(COLOR.creamFoot, COLOR.board, 0.62 + 0.25 * dim);
  const filCol = mixHex(filOff, COLOR.amberHot, warm);
  const sw = (px: number) => f3(px / k);

  const F = BULB.FIL;
  const filPath =
    `M${f3(x - F.hw * s)} ${f3(y + F.y0 * s)}V${f3(y + F.y1 * s)}` +
    `A${f3(F.hw * s)} ${f3(F.hw * s)} 0 0 1 ${f3(x + F.hw * s)} ${f3(y + F.y1 * s)}V${f3(y + F.y0 * s)}`;
  const H = BULB.HIGHLIGHT;

  const showBody = part === "all" || part === "body";
  const showAmber = (part === "all" || part === "amber") && !off;
  const showTop = part === "all" || part === "top";

  const amberBody = (
    <path
      d={glass}
      fill={`url(#${uid}a)`}
      mask={full ? undefined : `url(#${uid}m)`}
    />
  );

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(G.cy - G.r)} x2="0" y2={f3(y + BULB.NECK_Y * s)}>
          <stop offset="0" stopColor={glassTop} />
          <stop offset="1" stopColor={glassFoot} />
        </linearGradient>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y + BULB.BASE_TOP * s)} x2="0" y2={f3(y + BULB.TIP.y1 * s)}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
        {showAmber ? (
          <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
            <stop offset="0" stopColor={COLOR.amberTop} />
            <stop offset="1" stopColor={COLOR.amberFoot} />
          </linearGradient>
        ) : null}
        {showAmber && !full ? (
          <>
            <radialGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" cx={f3(gc.x)} cy={f3(gc.y)} r={f3(rG)}>
              <stop offset={f3(inner / rG)} stopColor="#fff" />
              <stop offset={f3(Math.max(edge, inner + 1e-3) / rG)} stopColor="#000" />
            </radialGradient>
            <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(gc.x - rG)} y={f3(gc.y - rG)} width={f3(2 * rG)} height={f3(2 * rG)}>
              <rect x={f3(gc.x - rG)} y={f3(gc.y - rG)} width={f3(2 * rG)} height={f3(2 * rG)} fill={`url(#${uid}r)`} />
            </mask>
          </>
        ) : null}
      </defs>

      {part === "all" && shadow ? (
        <ElevationShadow silhouette={bulbSilhouette(x, y, s)} elevation={elevation} lift={lift} />
      ) : null}

      {showBody ? (
        <g>
          {/* the glass, cream (under the amber; skipped once the amber covers it) */}
          {full && part === "all" ? null : <path d={glass} fill={`url(#${uid}c)`} />}
          {/* the screw base: groove core, three bands, the contact tip */}
          <path d={rr(x - BULB.CORE_HW * s, y + BULB.BASE_TOP * s, 2 * BULB.CORE_HW * s, (BULB.BANDS[2][1] - BULB.BASE_TOP) * s, 0.015 * s)} fill={groove} />
          {BULB.BANDS.map(([a, b], i) => (
            <path key={i} d={rr(x - BULB.BASE_HW * s, y + a * s, 2 * BULB.BASE_HW * s, (b - a) * s, 0.022 * s)} fill={`url(#${uid}b)`} />
          ))}
          <path d={tipPath(x, y, s)} fill={tip} />
          {/* the collar's lit top edge */}
          <path
            d={`M${f3(x - BULB.BASE_HW * s + 0.02 * s)} ${f3(y + BULB.BASE_TOP * s + EDGE.CREAM / k / 2)}H${f3(x + BULB.BASE_HW * s - 0.02 * s)}`}
            stroke={COLOR.edge}
            strokeOpacity={ALPHA.edgeBoard}
            strokeWidth={sw(EDGE.CREAM)}
          />
        </g>
      ) : null}

      {showAmber ? (bloom ? <g style={{ filter: bloomFilter(k) }}>{amberBody}</g> : amberBody) : null}

      {showTop ? (
        <g>
          {filament ? (
            <path d={filPath} fill="none" stroke={filCol} strokeWidth={f3(F.w * s)} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {/* the soft highlight, upper left */}
          <ellipse
            cx={f3(x + H.x * s)}
            cy={f3(y + H.y * s)}
            rx={f3(H.rx * s)}
            ry={f3(H.ry * s)}
            transform={`rotate(${H.rot} ${f3(x + H.x * s)} ${f3(y + H.y * s)})`}
            fill={mixHex("#FFFFFF", COLOR.amberHot, spread)}
            opacity={f3(0.5 + 0.3 * spread)}
          />
          {/* the lit top edge: cream card's white edge, crossfading to the amber's 2 px hot edge */}
          <path d={glassArc(G.cx, G.cy, G.r - EDGE.CREAM / k / 2, 222, 318)} fill="none" stroke={COLOR.edge} strokeOpacity={f3(ALPHA.edge * (1 - spread) * (1 - 0.6 * dim))} strokeWidth={sw(EDGE.CREAM)} strokeLinecap="round" />
          {spread > 0.001 ? (
            <path d={glassArc(G.cx, G.cy, G.r - EDGE.HOT / k / 2, 222, 318)} fill="none" stroke={COLOR.amberHot} strokeOpacity={f3(spread)} strokeWidth={sw(EDGE.HOT)} strokeLinecap="round" />
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

export type FieldBulb = { x: number; y: number; size: number; lit?: number; dim?: number };
/**
 * BulbField — a crowd of bulbs as the style wants a crowd: ONE shadow layer for all of them, every body,
 * then all the amber in ONE bloom pass, then every filament, highlight and edge on top.
 */
export const BulbField: React.FC<{ bulbs: FieldBulb[]; k: number; elevation?: Elevation; amberBand?: [number, number]; filament?: boolean }> = ({
  bulbs,
  k,
  elevation = "rest",
  amberBand,
  filament = true,
}) => (
  <g>
    <ElevationShadow silhouette={bulbs.flatMap((b) => bulbSilhouette(b.x, b.y, b.size))} elevation={elevation} />
    {bulbs.map((b, i) => (
      <IdeaBulb key={`b${i}`} {...b} k={k} part="body" />
    ))}
    <g style={{ filter: bloomFilter(k) }}>
      {bulbs.map((b, i) => (
        <IdeaBulb key={`a${i}`} {...b} k={k} part="amber" bloom={false} amberBand={amberBand} />
      ))}
    </g>
    {bulbs.map((b, i) => (
      <IdeaBulb key={`t${i}`} {...b} k={k} part="top" filament={filament} />
    ))}
  </g>
);
