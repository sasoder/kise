// ---------------------------------------------------------------------------
// BehindTheGun: a cut of the clip "Sheppard: East India Company vs. the kings"
// (Dwarkesh Patel with Si Sheppard). Dwarkesh map style on the umber page (the
// non-map variant of PriorYearRecessionV2 / InterestRatesGoDownV2): engraved
// cream objects, house orange as the only accent. 1080x1920, opaque.
//
// SPOKEN LINE (Dwarkesh; word onsets in frames from the start of this cut):
//   that f4 · we f9 · often f16 · talk f20 · about f24 · advantages f28 · in f38
//   · technology f44 · but f55 · we f61 · don't f63 · talk f67 · about f72 ·
//   advantages f76 · in f92 · sort f97 · of f100 · governance f102 · or f112 ·
//   in f122 · terms f128 · of f133 · organization f140 · (cut back f162)
// CHECK LINE: "The Company's edge was not the gun; it was the organization
//   standing behind the gun."
// DURATION = sequence frames 42-204 = 162 frames at 24000/1001 fps = 6.76 s.
//
// ONE CONTINUOUS MOTION. f0: the camera is close on one mid-18th-century
// 6-pounder field gun (cream) being brought into action: it rolls right to its
// rest position (wheels turning with the travel, f0-34) while the camera pushes
// in, and its barrel is trained up a few degrees as it comes to rest (to f46).
// Leading "but" (from ~f42) the camera pulls back and tilts up in one long
// move, and the structure standing behind the gun draws itself upward in
// ORANGE without stopping (the links grow as one front; each figure arrives
// whole as the front reaches its feet): the gun crew, the officers, the governor, and (the
// front arriving on "governance") the long board table of the Court of
// Directors; the table is whole before "organization". The settled frame is
// the whole chain of command with the cream gun as its smallest, lowest part;
// a slow creep, a faint highlight running down the links from table to gun.
//
// ORANGE = the organization (the Company's structure). The gun stays cream.
// No text. SCHEMATIC: the tiers are a chain of command, not a head-count
// (five crew, three officers, one governor, nine directors at the table are
// drawing choices; the real Court of Directors sat twenty-four).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { sway } from "./fieldShared";
import { DURATION, FPS, appearAt, barrelDeg, cameraAt, frontReaches, frontY, gunDx, shimmerAt } from "./BehindTheGunMotion";

export { DURATION, FPS };
export const W = 1080;
export const H = 1920;

export const INK = "#E9DDBF";
const INK_FAR = "#B4A98D"; // the far wheel, a step back
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const SHADE = "#140F0A";
const PALE = "#FFF1C4";

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backdropSrc: z.string(),
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  vignette: 0.34,
});

// ---------------------------------------------------------------------------
// THE LAYOUT (world px == screen px in the settled frame). The captions strip
// y 1080-1250 holds only the links between the officers and the crew.
// ---------------------------------------------------------------------------
const CX = 540;
// the board table, seen a little from above
const TB = { farY: 310, nearY: 396, apron: 15, farL: 205, farR: 875, nearL: 140, nearR: 940 };
const FAR_DIRECTORS = [260, 400, 540, 680, 820].map((x) => ({ x, y: 404, s: 2 }));
const NEAR_DIRECTORS = [320, 467, 613, 760].map((x) => ({ x, y: 574, s: 2 }));
const GOVERNOR = { x: CX, y: 806, s: 2 };
const OFFICERS = [250, 540, 830].map((x) => ({ x, y: 1066, s: 1.84 }));
const CREW = [160, 350, 540, 730, 920].map((x) => ({ x, y: 1424, s: 1.55 }));
// the gun: a 110-unit-high glyph (ground y 0, up negative), 1.7 px per unit
const GUN = { x: 566, y: 1748, s: 1.7 };
const TRUNNION = { x: 8, y: -98 };

const LINK_W = 11;
const BAR_GOV = 846;
const BAR_OFF = 1166;
const BAR_CREW = 1470;
const top = (f: { y: number; s: number }) => f.y - 100 * f.s;
/** every link of the chain of command (one path; all joints round) */
const LINKS_D = [
  // the table down to the governor
  `M${CX},${TB.nearY + TB.apron} V${top(GOVERNOR) + 8}`,
  // the governor down to the officers
  `M${CX},${GOVERNOR.y - 2} V${BAR_GOV}`,
  `M${OFFICERS[0].x},${top(OFFICERS[0]) + 6} V${BAR_GOV} H${OFFICERS[2].x} V${top(OFFICERS[2]) + 6}`,
  `M${CX},${BAR_GOV} V${top(OFFICERS[1]) + 6}`,
  // the officers down to the crew (through the captions strip)
  ...OFFICERS.map((o) => `M${o.x},${o.y - 2} V${BAR_OFF}`),
  `M${CREW[0].x},${top(CREW[0]) + 6} V${BAR_OFF} H${CREW[4].x} V${top(CREW[4]) + 6}`,
  ...CREW.slice(1, 4).map((c) => `M${c.x},${BAR_OFF} V${top(c) + 6}`),
  // the crew down to the gun
  `M${CREW[0].x},${CREW[0].y - 2} V${BAR_CREW} H${CREW[4].x} V${CREW[4].y - 2}`,
  ...CREW.slice(1, 4).map((c) => `M${c.x},${c.y - 2} V${BAR_CREW}`),
  `M${CX},${BAR_CREW} V${GUN.y + (TRUNNION.y - 9) * GUN.s}`,
].join(" ");

// ---------------------------------------------------------------------------
// THE FIGURE: one engraved period silhouette (tricorne, skirted coat, breeches)
// in a 100-unit frame: feet at (0, 0), the hat's point at y -100. Filled, with
// a dark casing, a thin dark contour and dark engraved hatching.
// ---------------------------------------------------------------------------
// a cocked hat from the front: the brim turned up to a point at each side, the front cock dipping over the brow
const F_HAT = "M-22,-95 C-17,-96.5 -11,-100 -6,-100 C-3,-100 -2,-98.6 0,-98.6 C2,-98.6 3,-100 6,-100 C11,-100 17,-96.5 22,-95 C17,-90 8,-83.5 0,-82 C-8,-83.5 -17,-90 -22,-95 Z";
const F_HAT_LINE = "M-19,-94.4 C-12,-93.4 -5,-90.4 0,-87 C5,-90.4 12,-93.4 19,-94.4";
const F_COAT = "M-7,-70 L7,-70 C13,-70 16,-66 16.5,-60 L21,-27 L-21,-27 L-16.5,-60 C-16,-66 -13,-70 -7,-70 Z";
const F_COAT_LONG = "M-7,-70 L7,-70 C13,-70 17,-66 17.5,-60 L24,-20 L-24,-20 L-17.5,-60 C-17,-66 -13,-70 -7,-70 Z";
const F_ARMS = "M-16.5,-63 L-21.5,-40 M16.5,-63 L21.5,-40";
const F_LEGS = "M-8.5,-27 L-7.5,-3 M8.5,-27 L7.5,-3";
const F_SHOES = "M-11.5,-1.6 L-4,-1.6 M4,-1.6 L11.5,-1.6";
const F_FRONT = "M0,-69 L0,-28 M-5.5,-70 L0,-61 L5.5,-70";
const F_HATCH = "M5,-58 L8,-30 M9.5,-60 L13.5,-30 M13.5,-58 L17.5,-31";
const F_BELT = "M-12.5,-67 L13,-38";
const F_SASH = "M-15,-45 L15,-45 M-15,-41.4 L15,-41.4";
const F_SWORD = "M-15,-42 L-31,-9";
const F_SWORD_HILT = "M-17.4,-36 L-11,-40";
const F_CANE = "M22.5,-40 L27,-1";
const F_WIG = "M-9.6,-80 C-13.6,-78 -14,-70 -10.6,-66.4 L-5,-70 Z M9.6,-80 C13.6,-78 14,-70 10.6,-66.4 L5,-70 Z";
const F_RAMMER = "M24.5,-112 L24.5,-1";
const F_SPONGE = "M21,-112 L28,-112 L28,-97 L21,-97 Z";
const F_QUEUE = "M0,-72.5 L0,-58 M-3.4,-69.6 L3.4,-69.6";
const F_BACK = "M0,-69 L0,-28 M-11,-62 L-13.5,-30 M11,-62 L13.5,-30";
const F_STOOL = "M-15,-27 L-17,-13 M15,-27 L17,-13";

type FigKind = "crew" | "officer" | "governor" | "far" | "near";
const Figure: React.FC<{ x: number; y: number; s: number; kind: FigKind; fill: string; deep: string; mirror?: boolean; tool?: boolean }> = ({
  x,
  y,
  s,
  kind,
  fill,
  deep,
  mirror = false,
  tool = false,
}) => {
  const sw = 1 / s; // one world px in figure units
  const coat = kind === "governor" ? F_COAT_LONG : F_COAT;
  const standing = kind === "crew" || kind === "officer" || kind === "governor";
  const casing = { fill: "none", stroke: SHADE, strokeOpacity: 0.72 };
  const edge = { stroke: SHADE, strokeOpacity: 0.6, strokeWidth: 1.5 * sw };
  const engr = { fill: "none", stroke: SHADE, strokeOpacity: 0.62, strokeWidth: 1.9 * sw };
  return (
    <g transform={`translate(${x} ${y}) scale(${mirror ? -s : s} ${s})`} strokeLinecap="round" strokeLinejoin="round">
      {/* the dark casing under everything */}
      <g {...casing}>
        {standing ? <path d={F_LEGS} strokeWidth={7.5 + 5 * sw} /> : null}
        {standing ? <path d={F_SHOES} strokeWidth={4 + 5 * sw} /> : null}
        {kind === "near" ? <path d={F_STOOL} strokeWidth={4 + 5 * sw} /> : null}
        {kind === "officer" ? <path d={F_SWORD} strokeWidth={3 + 5 * sw} /> : null}
        {kind === "governor" ? <path d={F_CANE} strokeWidth={3.2 + 5 * sw} /> : null}
        {tool ? <path d={F_RAMMER} strokeWidth={3.4 + 5 * sw} /> : null}
        {tool ? <path d={F_SPONGE} strokeWidth={5 * sw} /> : null}
        <path d={F_ARMS} strokeWidth={7 + 5 * sw} />
        <path d={coat} strokeWidth={5 * sw} />
        <circle cx={0} cy={-78} r={7.6} strokeWidth={5 * sw} />
        <path d={F_HAT} strokeWidth={5 * sw} />
      </g>
      {/* props behind the body */}
      {kind === "near" ? <path d={F_STOOL} fill="none" stroke={deep} strokeWidth={4} /> : null}
      {kind === "officer" ? (
        <>
          <path d={F_SWORD} fill="none" stroke={deep} strokeWidth={3} />
          <path d={F_SWORD_HILT} fill="none" stroke={deep} strokeWidth={3} />
        </>
      ) : null}
      {tool ? (
        <>
          <path d={F_RAMMER} fill="none" stroke={deep} strokeWidth={3.4} />
          <path d={F_SPONGE} fill={deep} {...edge} />
        </>
      ) : null}
      {standing ? (
        <>
          <path d={F_LEGS} fill="none" stroke={fill} strokeWidth={7.5} />
          <path d={F_SHOES} fill="none" stroke={deep} strokeWidth={4} />
        </>
      ) : null}
      {/* the coat, the arms, the head, the hat */}
      <path d={F_ARMS} fill="none" stroke={fill} strokeWidth={7} />
      <path d={coat} fill={fill} {...edge} />
      <path d={F_ARMS} fill="none" stroke={SHADE} strokeOpacity={0.5} strokeWidth={1.3 * sw} transform="translate(3.6 0) scale(0.78 1)" />
      {kind === "governor" ? <path d={F_CANE} fill="none" stroke={deep} strokeWidth={3.2} /> : null}
      <circle cx={0} cy={-78} r={7.6} fill={fill} {...edge} />
      {kind === "governor" ? <path d={F_WIG} fill={fill} {...edge} /> : null}
      <path d={F_HAT} fill={fill} {...edge} />
      <path d={F_HAT_LINE} {...engr} />
      {/* the engraving */}
      {kind === "near" ? (
        <>
          <path d={F_BACK} {...engr} />
          <path d={F_QUEUE} fill="none" stroke={SHADE} strokeOpacity={0.7} strokeWidth={2.6 * sw} />
        </>
      ) : (
        <>
          <path d={F_FRONT} {...engr} />
          <path d={F_HATCH} {...engr} strokeOpacity={0.5} />
        </>
      )}
      {kind === "crew" ? <path d={F_BELT} fill="none" stroke={SHADE} strokeOpacity={0.62} strokeWidth={3.2 * sw} /> : null}
      {kind === "officer" || kind === "governor" ? <path d={F_SASH} {...engr} /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GUN: a 6-pounder on its two-wheeled field carriage, three-quarter side
// view, muzzle to the right. Glyph units: ground y 0, up negative; the near
// wheel's hub at (0, -46), the trunnions at (8, -98). The barrel turns on its
// trunnions by `deg` (+ = muzzle down).
// ---------------------------------------------------------------------------
const WHEEL_R = 46;
const SPOKES = 12;
const Wheel: React.FC<{ cx: number; cy: number; r: number; ink: string; sw: number; spin?: number }> = ({ cx, cy, r, ink, sw, spin = 0 }) => {
  const spokes: string[] = [];
  const joints: string[] = [];
  for (let i = 0; i < SPOKES; i++) {
    const a = spin + (i / SPOKES) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    spokes.push(`M${(c * 7).toFixed(2)},${(s * 7).toFixed(2)} L${(c * (r - 6)).toFixed(2)},${(s * (r - 6)).toFixed(2)}`);
    if (i % 2 === 0) {
      const b = a + Math.PI / SPOKES;
      joints.push(`M${(Math.cos(b) * (r - 7.6)).toFixed(2)},${(Math.sin(b) * (r - 7.6)).toFixed(2)} L${(Math.cos(b) * (r - 0.6)).toFixed(2)},${(Math.sin(b) * (r - 0.6)).toFixed(2)}`);
    }
  }
  const sd = spokes.join("");
  return (
    // a three-quarter wheel: a touch narrower than it is tall
    <g transform={`translate(${cx} ${cy}) scale(0.87 1)`} strokeLinecap="round">
      <circle r={r - 4} fill="none" stroke={SHADE} strokeOpacity={0.72} strokeWidth={8 + 5 * sw} />
      <path d={sd} fill="none" stroke={SHADE} strokeOpacity={0.72} strokeWidth={3.8 + 4 * sw} />
      <path d={sd} fill="none" stroke={ink} strokeWidth={3.8} />
      <circle r={r - 4} fill="none" stroke={ink} strokeWidth={8} />
      <circle r={r - 1.6} fill="none" stroke={SHADE} strokeOpacity={0.5} strokeWidth={1.2 * sw} />
      <circle r={r - 6.6} fill="none" stroke={SHADE} strokeOpacity={0.4} strokeWidth={1.2 * sw} />
      <path d={joints.join("")} fill="none" stroke={SHADE} strokeOpacity={0.5} strokeWidth={1.3 * sw} />
      <circle r={9.5} fill={ink} stroke={SHADE} strokeOpacity={0.7} strokeWidth={1.6 * sw} />
      <circle r={5.6} fill="none" stroke={SHADE} strokeOpacity={0.55} strokeWidth={1.3 * sw} />
      <circle r={2.4} fill={SHADE} fillOpacity={0.8} />
    </g>
  );
};
// the barrel, in its own frame: the bore along +x, the trunnions at (0, 0)
const B_TUBE =
  "M-60,-13 L-20,-12.2 L-20,-10.8 L38,-9.8 L38,-9 L90,-8 L93,-11.4 L106,-12 L110,-10.4 L110,10.4 L106,12 L93,11.4 L90,8 L38,9 L38,9.8 L-20,10.8 L-20,12.2 L-60,13 " +
  "C-66,11 -69,5 -69,0 C-69,-5 -66,-11 -60,-13 Z";
const B_CASCABEL = "M-68,-3 L-73,-2.6 L-73,2.6 L-68,3 Z";
const B_RINGS = "M-57,-12.9 L-57,12.9 M-20,-12 L-20,12 M-16.4,-10.8 L-16.4,10.8 M38,-9.6 L38,9.6 M41.4,-8.9 L41.4,8.9 M90,-8 L90,8 M93,-11.2 L93,11.2 M106,-11.8 L106,11.8";
const B_HATCH = "M-54,4.6 L-23,4.2 M-54,8.2 L-23,7.6 M-13,3.8 L35,3.2 M-13,7 L35,6.2 M44,3 L88,2.6 M44,5.8 L88,5.2 M-54,10.8 L-23,10";
// the carriage: the cheeks under the trunnions running back into the trail
const C_TRAIL = "M30,-68 L26,-97 L-10,-97 L-22,-84 L-124,-18 L-142,-16 L-144,-3 L-132,1 L-120,-2 L-34,-50 L30,-50 Z";
const C_STRAPS = "M-22,-84 L-33,-51 M-58,-61 L-66,-33 M-94,-37 L-101,-12 M-124,-18 L-128,0 M26,-97 L-10,-97 M22,-68 L22,-51";
const C_HATCH = "M-30,-56 L-54,-44 M-70,-36 L-90,-25 M-106,-17 L-120,-9 M-8,-58 L20,-58 M-8,-63 L20,-63";
const C_TOWRING = "M-144,-9 L-152,-9";
const GROUND = "M-236,4 L146,4 M-216,9.5 L-170,9.5 M-150,9.5 L-86,9.5 M-62,9.5 L62,9.5 M86,9.5 L126,9.5 M-110,15 L-30,15 M0,15 L70,15";

const Cannon: React.FC<{ x: number; y: number; s: number; deg: number; ink: string; dx: number }> = ({ x, y, s, deg, ink, dx }) => {
  // dx: the gun's offset from rest in world px; the wheels turn in step with it
  const roll = dx / s;
  const sw = 1 / s;
  const edge = { stroke: SHADE, strokeOpacity: 0.7, strokeWidth: 1.7 * sw };
  const engr = { fill: "none", stroke: SHADE, strokeOpacity: 0.58, strokeWidth: 1.5 * sw };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round" strokeLinecap="round">
      {/* the ground it stands on (it stays put while the gun rolls) */}
      <path d={GROUND} fill="none" stroke={SHADE} strokeOpacity={0.5} strokeWidth={2.2 * sw} />
      <g transform={`translate(${roll.toFixed(3)} 0)`}>
      {/* the far wheel and the axle between the hubs */}
      <Wheel cx={24} cy={-54} r={WHEEL_R - 4} ink={INK_FAR} sw={sw} spin={0.13 + roll / (WHEEL_R - 4)} />
      <path d="M0,-46 L24,-54" fill="none" stroke={SHADE} strokeOpacity={0.75} strokeWidth={9 + 4 * sw} />
      <path d="M0,-46 L24,-54" fill="none" stroke={INK_FAR} strokeWidth={9} />
      {/* the barrel on its trunnions */}
      <g transform={`translate(${TRUNNION.x} ${TRUNNION.y}) rotate(${deg.toFixed(3)})`}>
        <path d={B_TUBE} fill="none" stroke={SHADE} strokeOpacity={0.75} strokeWidth={5 * sw} />
        <path d={B_CASCABEL} fill={ink} {...edge} />
        <circle cx={-77} cy={0} r={4.8} fill={ink} {...edge} />
        <path d={B_TUBE} fill={ink} {...edge} />
        <path d={B_HATCH} {...engr} strokeOpacity={0.42} />
        <path d={B_RINGS} {...engr} strokeWidth={1.7 * sw} />
        {/* the bore, seen a little from the front */}
        <ellipse cx={110.6} cy={0} rx={3.3} ry={10.2} fill={ink} {...edge} />
        <ellipse cx={111} cy={0} rx={1.9} ry={6} fill={SHADE} fillOpacity={0.88} />
        <circle cx={-48} cy={-12.4} r={1.5} fill={SHADE} fillOpacity={0.8} />
      </g>
      {/* the carriage: cheeks and trail */}
      <path d={C_TOWRING} fill="none" stroke={SHADE} strokeOpacity={0.75} strokeWidth={3 + 4 * sw} />
      <path d={C_TOWRING} fill="none" stroke={ink} strokeWidth={3} />
      <path d={C_TRAIL} fill="none" stroke={SHADE} strokeOpacity={0.75} strokeWidth={5 * sw} />
      <path d={C_TRAIL} fill={ink} {...edge} />
      <path d={C_HATCH} {...engr} strokeOpacity={0.4} />
      <path d={C_STRAPS} {...engr} strokeWidth={2 * sw} />
      {/* the trunnion in its cap-square */}
      <circle cx={TRUNNION.x} cy={TRUNNION.y} r={6.2} fill={ink} {...edge} />
      <circle cx={TRUNNION.x} cy={TRUNNION.y} r={2.2} fill={SHADE} fillOpacity={0.75} />
      {/* the near wheel */}
      <Wheel cx={0} cy={-46} r={WHEEL_R} ink={ink} sw={sw} spin={roll / WHEEL_R} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BOARD TABLE of the Court of Directors: a long table seen a little from
// above, five directors seated behind it, four with their backs to us.
// ---------------------------------------------------------------------------
const TABLE_TOP = `M${TB.farL},${TB.farY} L${TB.farR},${TB.farY} L${TB.nearR},${TB.nearY} L${TB.nearL},${TB.nearY} Z`;
const TABLE_APRON = `M${TB.nearL},${TB.nearY} L${TB.nearR},${TB.nearY} L${TB.nearR - 4},${TB.nearY + TB.apron} L${TB.nearL + 4},${TB.nearY + TB.apron} Z`;
const TABLE_LEGS = `M${TB.nearL + 22},${TB.nearY + TB.apron} V${TB.nearY + 150} M${TB.nearR - 22},${TB.nearY + TB.apron} V${TB.nearY + 150}`;
const TABLE_HATCH = (() => {
  // long engraved strokes along the boards, converging a little toward the far edge
  let d = "";
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const y = TB.farY + t * (TB.nearY - TB.farY);
    const l = TB.farL + t * (TB.nearL - TB.farL) + 26;
    const r = TB.farR + t * (TB.nearR - TB.farR) - 26;
    d += `M${l},${y} L${r},${y} `;
  }
  return d;
})();
// papers on the table in front of the far directors (dark outline only)
const TABLE_PAPERS = FAR_DIRECTORS.map(({ x }) => {
  const px = CX + (x - CX) * 1.06;
  return `M${px - 26},${TB.farY + 20} L${px + 26},${TB.farY + 20} L${px + 30},${TB.farY + 50} L${px - 30},${TB.farY + 50} Z`;
}).join(" ");

const BoardTable: React.FC<{ fill: string; deep: string }> = ({ fill, deep }) => (
  <g strokeLinejoin="round" strokeLinecap="round">
    <path d={TABLE_LEGS} fill="none" stroke={SHADE} strokeOpacity={0.72} strokeWidth={17} />
    <path d={TABLE_LEGS} fill="none" stroke={deep} strokeWidth={12} />
    <path d={`${TABLE_TOP} ${TABLE_APRON}`} fill="none" stroke={SHADE} strokeOpacity={0.75} strokeWidth={6} />
    <path d={TABLE_APRON} fill={deep} stroke={SHADE} strokeOpacity={0.6} strokeWidth={1.6} />
    <path d={TABLE_TOP} fill={deep} stroke={SHADE} strokeOpacity={0.6} strokeWidth={1.6} />
    <path d={TABLE_HATCH} fill="none" stroke={SHADE} strokeOpacity={0.3} strokeWidth={2} />
    <path d={TABLE_PAPERS} fill={fill} stroke={SHADE} strokeOpacity={0.55} strokeWidth={1.8} />
  </g>
);

// ---------------------------------------------------------------------------
// HOW A FIGURE ARRIVES: whole, as the link front reaches its feet: it rises
// 30 px while fading and scaling in from 0.85 (eased out, 8 frames), a little
// later for each figure to the right in its tier. The table arrives first,
// then its nine directors in one quick left-to-right run (whole by f134).
// ---------------------------------------------------------------------------
// a standing figure starts LEAD frames before the front touches its feet, so no bare link stub waits for it
const LEAD = 2.5;
const tier = (figs: { x: number; y: number }[], step: number) => figs.map((g, i) => frontReaches(g.y) - LEAD + i * step);
const T_CREW = tier(CREW, 1);
const T_OFFICERS = tier(OFFICERS, 1.5);
const T_GOVERNOR = frontReaches(GOVERNOR.y) - LEAD;
const TABLE_FOOT = { x: CX, y: TB.nearY + 150 };
const T_TABLE = frontReaches(NEAR_DIRECTORS[0].y);
const DIRECTOR_ORDER = [...FAR_DIRECTORS, ...NEAR_DIRECTORS].map((d) => d.x).sort((a, b) => a - b);
const tDirector = (x: number) => T_TABLE + 4 + DIRECTOR_ORDER.indexOf(x) * 2;
const Arrive: React.FC<{ frame: number; t0: number; x: number; y: number; children: React.ReactNode }> = ({ frame, t0, x, y, children }) => {
  const e = appearAt(frame, t0);
  if (e <= 0.001) return null;
  const sc = 0.85 + 0.15 * e;
  return (
    <g opacity={e} transform={`translate(${x} ${(y + 30 * (1 - e)).toFixed(3)}) scale(${sc.toFixed(5)}) translate(${-x} ${-y})`}>
      {children}
    </g>
  );
};

const BehindTheGun: React.FC<Props> = ({ ink, accent, accentDeep, backdropSrc, vignette }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const drift = sway(frame);
  const tx = W / 2 - cam.cx * cam.k + drift.dx * 0.6;
  const ty = H / 2 - cam.cy * cam.k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(5)})`;

  // the page moves with the camera at a third of its travel (it is far away)
  const bk = 1 + (cam.k - 1) * 0.32;
  const bty = -(cam.cy - H / 2) * 0.3 * bk + drift.dy * 0.3;

  const fy = frontY(frame);
  const sh = shimmerAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "50% 50%",
          transform: `translate(${(drift.dx * 0.3).toFixed(3)}px, ${bty.toFixed(3)}px) scale(${bk.toFixed(5)})`,
        }}
      >
        <Img
          src={staticFile(backdropSrc)}
          style={{ position: "absolute", left: -W * 0.16, top: -H * 0.16, width: W * 1.32, height: H * 1.32 }}
        />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          {/* the orange front: everything below it is drawn, a soft edge at it */}
          <linearGradient id="btgFrontGrad" gradientUnits="userSpaceOnUse" x1={0} y1={fy - 34} x2={0} y2={fy + 6}>
            <stop offset="0" stopColor="#000" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <mask id="btgFront" maskUnits="userSpaceOnUse" x={-400} y={-400} width={W + 800} height={H + 1200}>
            <rect x={-400} y={-400} width={W + 800} height={H + 1200} fill="url(#btgFrontGrad)" />
          </mask>
          {/* the highlight: a soft band that runs down the links */}
          <linearGradient id="btgShimGrad" gradientUnits="userSpaceOnUse" x1={0} y1={sh.y - 110} x2={0} y2={sh.y + 110}>
            <stop offset="0" stopColor="#000" />
            <stop offset="0.5" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="btgShim" maskUnits="userSpaceOnUse" x={-400} y={-400} width={W + 800} height={H + 1200}>
            <rect x={-400} y={-400} width={W + 800} height={H + 1200} fill="url(#btgShimGrad)" />
          </mask>
        </defs>

        <g transform={camT}>
          {/* THE ORGANIZATION (orange), drawn upward by one front */}
          {fy < 1640 ? (
            <g mask="url(#btgFront)">
              <path d={LINKS_D} fill="none" stroke={SHADE} strokeOpacity={0.72} strokeWidth={LINK_W + 6} strokeLinejoin="round" strokeLinecap="round" />
              <path d={LINKS_D} fill="none" stroke={accentDeep} strokeWidth={LINK_W} strokeLinejoin="round" strokeLinecap="round" />
              {sh.op > 0.01 ? (
                <g mask="url(#btgShim)">
                  <path d={LINKS_D} fill="none" stroke={PALE} strokeOpacity={0.62 * sh.op} strokeWidth={LINK_W - 4} strokeLinejoin="round" strokeLinecap="round" />
                </g>
              ) : null}
            </g>
          ) : null}
          {CREW.map((c, i) => (
            <Arrive key={`c${i}`} frame={frame} t0={T_CREW[i]} x={c.x} y={c.y}>
              <Figure {...c} kind="crew" fill={accent} deep={accentDeep} tool={i === 0 || i === 4} mirror={i === 0} />
            </Arrive>
          ))}
          {OFFICERS.map((o, i) => (
            <Arrive key={`o${i}`} frame={frame} t0={T_OFFICERS[i]} x={o.x} y={o.y}>
              <Figure {...o} kind="officer" fill={accent} deep={accentDeep} mirror={i === 2} />
            </Arrive>
          ))}
          <Arrive frame={frame} t0={T_GOVERNOR} x={GOVERNOR.x} y={GOVERNOR.y}>
            <Figure {...GOVERNOR} kind="governor" fill={accent} deep={accentDeep} />
          </Arrive>
          {FAR_DIRECTORS.map((d) => (
            <Arrive key={`fd${d.x}`} frame={frame} t0={tDirector(d.x)} x={d.x} y={d.y}>
              <Figure {...d} kind="far" fill={accent} deep={accentDeep} />
            </Arrive>
          ))}
          <Arrive frame={frame} t0={T_TABLE} x={TABLE_FOOT.x} y={TABLE_FOOT.y}>
            <BoardTable fill={accent} deep={accentDeep} />
          </Arrive>
          {NEAR_DIRECTORS.map((d) => (
            <Arrive key={`nd${d.x}`} frame={frame} t0={tDirector(d.x)} x={d.x} y={d.y}>
              <Figure {...d} kind="near" fill={accent} deep={accentDeep} />
            </Arrive>
          ))}

          {/* THE GUN (cream), the smallest and lowest part */}
          <Cannon {...GUN} deg={barrelDeg(frame)} ink={ink} dx={gunDx(frame)} />
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 48%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(
            3,
          )}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default BehindTheGun;
