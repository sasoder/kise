// ---------------------------------------------------------------------------
// DisgustingLondonCold (kyle-london, cut 2; delivered as 2_DisgustingLondon_V3.mov): the cold-review pass on V2.
// Dwarkesh map style (styles/dwarkesh-map.md). Opaque 1080x1920, 29.97 fps, 115 frames.
// Changes from V2: the cathedral pushed into the distance (smaller, right of the roof, its base dissolving into the
// distant roofs); a shorter, calmer drift (peak ~13 px/f); the sash lifts on "century" (f42); LONDON slides up f12 ->
// lands f19; the pot tipped only 62 deg so it stays a wide, low chamber pot, with a cuffed sleeve and a gripping hand;
// the slop is greenish-umber sewage in the house's engraved manner (cream lit contour, hatching, smooth gloopy edges,
// clots carried in it), thrown out and accelerating to CONTACT on f79 (first reaction f79: a lumpy splash with clots
// flung up and droplets thrown out); it keeps pouring to the cut (a second slosh ~f100) while the run spreads along
// the kennel and an engraved wet stain soaks the setts. World + camera + timeline in disgustingLondonWorldCold.ts.
//
// CHECK LINE: "London's streets were open sewers: people tipped chamber pots out of the window into the street."
//
// THE LINE: "...living in London in the 18th century and just like how disgusting it was."
// WORD -> FRAME: living 4 · in 12 · London 18 · in 25 · the 28 · 18th 32 · century 42 · and 52 · just 66 ·
//   like 71 · how 75 · disgusting 80 · it 91 · was 101 (the speaker goes on "Pretty disgusting" at 115, after the cut)
// DURATION: the slot 2.436 -> 6.273 s (in frame 73, out frame 188) = 115 frames (f0..f114).
//
// THE MOTION (one continuous tilt down one engraved column, skyline to gutter): f0 the camera is already
// moving on the London skyline, the dome of St Paul's (lantern, ball and cross, the drum's colonnade) at the
// frame's centre; LONDON slides up under the dome on its word (f4 -> lands f18, world space, it leaves the top as
// the camera tilts). The tilt runs down the front of a tall, narrow, leaning timber-and-brick row house and pushes in
// harder in its second half (k 0.82 -> 1.38 at f80 -> 1.42 at f114, one keyed track through the house damped follow),
// so the pour is close: the window ~430 px wide, the pot ~215 px tall. The lower sash is thrown up (f45-51), a
// forearm in a brown sleeve brings a squat chamber pot (round belly, flared lip, loop handle, the dark contents in its
// mouth) up out of the dark room (lifted from behind the wall below the window, f46-56) and tips it (f54-66); the slop
// leaves the lip from ~f63 (cause), thrown OUT over the street in an arc: one continuous dark pour, widest at the lip,
// thinning as it falls, a wavy edge and one wet sheen, breaking into drops only just above the kennel. It meets the
// kennel, the broad open channel brimming with sludge, well clear of the wall on f79 (CONTACT f79; first reaction on
// f79: the churning splash and drops thrown sideways; the run along the gutter from f80) on "disgusting", still one
// unbroken pour from lip to splash. Only after contact does the pot run dry (f81-86): the pour thins at the lip, tears
// off (~f88) and the rest falls as drops, top down (gone by ~f96), each ringing the slop. f80-114: the slop spreads
// in the kennel, drips fall from the pot and the sill, the sludge drifts with lumps, straw and popping bubbles; on the
// near stones dung (with flies), brown puddles with floating bits, straw, a leaf, a broken crock; flies circle the
// lumpy refuse heap (a sack, rags, a broken basket); the camera creeps on. Nothing fades.
// Orange = the new science (the clip rule); this cut is the old London: no orange. The slop is DEAD #8A7B62
// darkened with umber.
//
// SOURCES: St Paul's Cathedral, Wren, completed 1710 (dome on a peristyle drum, stone gallery, lantern, golden ball
//   and cross: drawn from its well-known west/south elevation silhouette; no reference image was supplied in
//   animation_source/refs/). Emptying chamber pots from windows into the street and the central "kennel": the
//   speaker's claim, and Hogarth, "Night" (Four Times of the Day, 1738), which shows a pot emptied from a window.
//   No figures or dates on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { fellSC, labelSlide, swayCam } from "../kits/maps/incaShared";
import {
  CROSS_TOP,
  DOME,
  DURATION,
  ELBOW_OFF,
  FASCIA,
  FLOOR1,
  FOOT,
  FPS,
  HOUSE,
  KENNEL,
  LEAN,
  LONDON_Y,
  ROOF,
  SILL,
  SKY_SHIFT,
  SLOP_V0,
  T,
  WIN,
  camAt,
  gripAt,
  lean,
  lipAt,
  potPoint,
  tipAngle,
  toScreen,
  type Cam,
} from "./disgustingLondonWorldCold";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// PALETTE (styles/dwarkesh-map.md): the page LAND, cream INK at two levels, DARK casing (pearlShared's #17120D)
// ---------------------------------------------------------------------------
const DARK = "#17120D";
const INK_RGB = "233,221,191";
const cream = (a: number) => `rgba(${INK_RGB},${a})`;
const INK = "#E9DDBF";
const INK_DEEP = "#D3C5A2";
const FAR = "#342A20"; // the distant city's roofs
const DOME_FILL = "#3C3228"; // the distant cathedral, close to the sky (depth)
const PLANE = "#30271D"; // the house front: a step darker than the LAND sky
const TIMBER = "#241C14";
const GLASS = "#16110C";
const ROOM = "#100C08";
const COAT = "#4A3D2E"; // the sleeve of a brown coat
const SLUDGE = "#33281D"; // the kennel: darker than the street, lighter than fresh slop
const DEAD = "#8A7B62";
const SLOP = "#665834"; // r3: greenish umber sewage (lighter than the street, darker than r2 tan)
const SLOP_D = "#4A4226"; // clots and the wet stain
const SHEEN = "#9C9064"; // the wet sheen on the slop

const r2 = (v: number) => Math.round(v * 100) / 100;
const lin = (f: number, a: number, b: number) => Math.max(0, Math.min(1, (f - a) / (b - a)));
const sstep = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const easeOut = (u: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);

/** parallel hatch lines across a box at `angle` deg, `gap` apart, as one path d (clip it to the shape) */
const hatchD = (x0: number, y0: number, x1: number, y1: number, angle: number, gap: number) => {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
  let d = "";
  for (let s = -R; s <= R; s += gap) {
    const px = cx - dy * s;
    const py = cy + dx * s;
    d += `M${r2(px - dx * R)} ${r2(py - dy * R)}L${r2(px + dx * R)} ${r2(py + dy * R)}`;
  }
  return d;
};
let CLIP_N = 0;
/** a hatch clipped to a path (static: built once at module load) */
const Hatch: React.FC<{ id: string; clip: string; box: [number, number, number, number]; angle: number; gap: number; w?: number; color?: string }> = ({ id, clip, box, angle, gap, w = 1.1, color = cream(0.3) }) => (
  <>
    <clipPath id={id}>
      <path d={clip} />
    </clipPath>
    <path d={hatchD(box[0], box[1], box[2], box[3], angle, gap)} stroke={color} strokeWidth={w} clipPath={`url(#${id})`} fill="none" />
  </>
);
const hid = () => `dl-h${CLIP_N++}`;
const rectD = (x0: number, y0: number, x1: number, y1: number) => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
/** a closed outline through the points (midpoint quadratics: smooth, but the points themselves are ragged) */
const blobD = (ring: [number, number][]) => {
  const n = ring.length;
  const mid = (i: number) => [(ring[i][0] + ring[(i + 1) % n][0]) / 2, (ring[i][1] + ring[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  let d = `M${r2(m0[0])} ${r2(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    d += `Q${r2(ring[i][0])} ${r2(ring[i][1])} ${r2(m[0])} ${r2(m[1])}`;
  }
  return `${d}Z`;
};
/** an irregular clot of slop round (x, y), stretched along its fall (ux, uy), half-size r */
const clotRing = (x: number, y: number, r: number, ux: number, uy: number, seed: string): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const rr = r * (0.7 + 0.6 * random(`${seed}-${i}`));
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    // stretch 1.6x along the motion
    const along = ca * 1.6;
    out.push([x + (ux * along - uy * sa) * rr, y + (uy * along + ux * sa) * rr]);
  }
  return out;
};

/** a paned window light (dark glass, cream glazing bars, a faint diagonal glint) */
const Panes: React.FC<{ x0: number; y0: number; x1: number; y1: number; cols: number; rows: number; a: number; bar?: number }> = ({ x0, y0, x1, y1, cols, rows, a, bar = 3 }) => {
  const id = hid();
  let d = "";
  for (let i = 1; i < cols; i++) {
    const x = x0 + ((x1 - x0) * i) / cols;
    d += `M${r2(x)} ${y0}V${y1}`;
  }
  for (let j = 1; j < rows; j++) {
    const y = y0 + ((y1 - y0) * j) / rows;
    d += `M${x0} ${r2(y)}H${x1}`;
  }
  return (
    <>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={GLASS} />
      <Hatch id={id} clip={`M${x0 + (x1 - x0) * 0.08} ${y0}L${x0 + (x1 - x0) * 0.42} ${y0}L${x0 + (x1 - x0) * 0.12} ${y1}L${x0} ${y1}L${x0} ${y0 + (y1 - y0) * 0.5}Z`} box={[x0, y0, x1, y1]} angle={-62} gap={5} w={1} color={cream(a * 0.22)} />
      <path d={d} stroke={DARK} strokeWidth={bar + 2} fill="none" />
      <path d={d} stroke={cream(a * 0.8)} strokeWidth={bar * 0.6} fill="none" />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke={cream(a)} strokeWidth={2.7} />
    </>
  );
};

// ---------------------------------------------------------------------------
// V2 DRAWING RULES: one hatch for every shaded plane (HATCH: -56 deg, 5 px, cream 0.2, 1.1 px: light from the upper
// left); three line weights: SUBJECT (the window, the pot, the dome at f0) heavy and bright, HOUSE medium, CONTEXT
// (the drum, the city, the neighbours, the street) light or none.
// ---------------------------------------------------------------------------
const HATCH = { angle: -56, gap: 5, w: 1.1, color: cream(0.2) };
const LW = { subject: 3.6, house: 2.6, detail: 1.7, context: 1.3 };
const Shade: React.FC<{ clip: string; box: [number, number, number, number] }> = ({ clip, box }) => (
  <Hatch id={hid()} clip={clip} box={box} angle={HATCH.angle} gap={HATCH.gap} w={HATCH.w} color={HATCH.color} />
);

// ---------------------------------------------------------------------------
// ST PAUL'S (drawing coordinates, set down by SKY_SHIFT): the dome and lantern read; the drum is quiet context
// ---------------------------------------------------------------------------
const StPauls: React.ReactElement = (() => {
  const { cx, spring, rx, ry } = DOME;
  const domeD = `M${cx - rx} ${spring}A${rx} ${ry} 0 0 1 ${cx + rx} ${spring}Z`;
  const merid = (phi: number) => {
    let d = "";
    for (let i = 0; i <= 24; i++) {
      const lat = (i / 24) * ((82 * Math.PI) / 180);
      d += `${i ? "L" : "M"}${r2(cx + rx * Math.cos(lat) * Math.sin(phi))} ${r2(spring - ry * Math.sin(lat))}`;
    }
    return d;
  };
  let ribs = "";
  for (let i = -3; i <= 3; i++) ribs += merid((i * 22.5 * Math.PI) / 180);
  const R_PER = 410;
  let cols = "";
  for (let th = -72; th <= 72; th += 12) {
    const x = cx + R_PER * Math.sin((th * Math.PI) / 180);
    const hw = 6 * Math.cos((th * Math.PI) / 180);
    cols += `M${r2(x - hw)} 830V944M${r2(x + hw)} 830V944`;
  }
  // the shaded right flank of the dome: the house hatch, clipped to the dome right of a soft terminator
  const shadeClip = `M${cx + 70} ${spring}C${cx + 120} ${spring - 200} ${cx + 60} ${spring - 300} ${cx + 30} ${spring - ry}L${cx + rx + 10} ${spring - ry}L${cx + rx + 10} ${spring}Z`;
  const dc = hid();
  return (
    <g>
      {/* the drum (context): the peristyle as a colonnade in cream line, its entablature, the attic, the stone gallery */}
      <rect x={cx - R_PER} y={826} width={2 * R_PER} height={120} fill={DOME_FILL} />
      <Shade clip={rectD(cx + 140, 826, cx + R_PER, 946)} box={[cx + 140, 826, cx + R_PER, 946]} />
      <path d={cols} stroke={cream(0.68)} strokeWidth={LW.detail} fill="none" />
      <rect x={cx - R_PER - 6} y={806} width={2 * R_PER + 12} height={22} fill={DOME_FILL} stroke={cream(0.5)} strokeWidth={LW.context} />
      <rect x={cx - R_PER - 10} y={944} width={2 * R_PER + 20} height={20} fill={DOME_FILL} stroke={cream(0.5)} strokeWidth={LW.context} />
      <rect x={cx - 318} y={722} width={636} height={84} fill={DOME_FILL} stroke={cream(0.5)} strokeWidth={LW.context} />
      <rect x={cx - 328} y={700} width={656} height={22} fill={DOME_FILL} stroke={cream(0.55)} strokeWidth={LW.detail} />
      {/* the dome */}
      <path d={domeD} fill={DOME_FILL} />
      <clipPath id={dc}>
        <path d={domeD} />
      </clipPath>
      <g clipPath={`url(#${dc})`}>
        <Shade clip={shadeClip} box={[cx, spring - ry - 10, cx + rx + 10, spring]} />
      </g>
      <path d={ribs} stroke={cream(0.62)} strokeWidth={LW.detail} fill="none" />
      <path d={domeD} fill="none" stroke={cream(0.92)} strokeWidth={LW.subject} />
      {/* the lantern, the golden ball and the cross */}
      <rect x={cx - 54} y={356} width={108} height={16} fill={DOME_FILL} stroke={cream(0.85)} strokeWidth={LW.house} />
      <rect x={cx - 40} y={262} width={80} height={96} fill={DOME_FILL} stroke={cream(0.85)} strokeWidth={LW.house} />
      <path d={`M${cx - 28} 266V354M${cx + 28} 266V354`} stroke={cream(0.55)} strokeWidth={LW.detail} />
      <path d={`M${cx - 11} 350V298A11 11 0 0 1 ${cx + 11} 298V350Z`} fill={GLASS} stroke={cream(0.6)} strokeWidth={LW.detail} />
      <rect x={cx - 50} y={250} width={100} height={13} fill={DOME_FILL} stroke={cream(0.85)} strokeWidth={LW.house} />
      <path d={`M${cx - 36} 250A36 40 0 0 1 ${cx + 36} 250Z`} fill={DOME_FILL} stroke={cream(0.85)} strokeWidth={LW.house} />
      <path d={`M${cx - 12} 212Q${cx - 4} 176 ${cx - 6} 142L${cx + 6} 142Q${cx + 4} 176 ${cx + 12} 212Z`} fill={DOME_FILL} stroke={cream(0.85)} strokeWidth={LW.house} />
      <circle cx={cx} cy={126} r={16} fill={DOME_FILL} stroke={cream(0.9)} strokeWidth={LW.house} />
      <path d={`M${cx - 9} 120A10 10 0 0 1 ${cx - 2} 113`} stroke={cream(0.7)} strokeWidth={2} fill="none" />
      <path d={`M${cx - 4} ${CROSS_TOP}H${cx + 4}V54H${cx + 20}V63H${cx + 4}V110H${cx - 4}V63H${cx - 20}V54H${cx - 4}Z`} fill={cream(0.65)} stroke={DARK} strokeWidth={1.2} />
    </g>
  );
})();

// THE DISTANT CITY (context): one flat band of roofs in front of the drum, its skyline the only line
const City: React.ReactElement = (() => {
  let fill = `M-300 ${FOOT - SKY_SHIFT + 20}`;
  let edge = "";
  let x = -300;
  let i = 0;
  while (x < 1400) {
    const w = 80 + random(`cw${i}`) * 90;
    const top = 1000 + random(`ct${i}`) * 24;
    const peak = top - (random(`cg${i}`) > 0.5 ? 10 + random(`cp${i}`) * 8 : 0);
    const seg = `L${r2(x)} ${r2(top)}L${r2(x + w / 2)} ${r2(peak)}L${r2(x + w)} ${r2(top)}`;
    fill += seg;
    edge += `${i ? "" : "M"}${seg.slice(i ? 0 : 1)}`;
    if (random(`cn${i}`) > 0.55) {
      const chx = x + w * (0.25 + random(`cx${i}`) * 0.5);
      fill += `L${r2(chx - 8)} ${r2(top)}L${r2(chx - 8)} ${r2(top - 34)}L${r2(chx + 8)} ${r2(top - 34)}L${r2(chx + 8)} ${r2(top)}`;
    }
    x += w;
    i++;
  }
  fill += `L1400 ${FOOT - SKY_SHIFT + 20}L-300 ${FOOT - SKY_SHIFT + 20}Z`;
  return (
    <g>
      <defs>
        <linearGradient id="dl-city" gradientUnits="userSpaceOnUse" x1="0" y1="975" x2="0" y2="1200">
          <stop offset="0" stopColor={FAR} stopOpacity={0} />
          <stop offset="1" stopColor={FAR} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#dl-city)" />
      <path d={edge} fill="none" stroke={cream(0.12)} strokeWidth={LW.context} />
    </g>
  );
})();

// (r2: no neighbouring fronts; the distant roofs' silhouette runs down to the street as one continuous ground)

// ---------------------------------------------------------------------------
// THE HOUSE (drawn upright, leaned by one skew about its foot): fewer, bigger shapes; one clear window
// ---------------------------------------------------------------------------
const W1 = { x0: WIN.x0 + 14, x1: WIN.x1 - 14, y0: WIN.y0 + 14, y1: WIN.y1 - 6 }; // the opening inside the casing
const SASH_H = (W1.y1 - W1.y0) / 2 + 4;
const HouseStatic: React.ReactElement = (() => {
  const a = 0.86; // the house front's own line (the window is brighter)
  const x0 = HOUSE.x0;
  const x1 = HOUSE.x1;
  const roofD = `M${x0 - 10} ${ROOF.eaves}L${x1 + 10} ${ROOF.eaves}L${x1 - 16} ${ROOF.ridge}L${x0 + 16} ${ROOF.ridge}Z`;
  let tiles = "";
  [0.3, 0.55, 0.8].forEach((u) => {
    const y = ROOF.ridge + (ROOF.eaves - ROOF.ridge) * u;
    tiles += `M${x0 + 4} ${r2(y)}H${x1 - 4}`;
  });
  const chim = (cx: number, top: number, key: string) => {
    const body = rectD(cx - 32, top, cx + 32, ROOF.ridge + 30);
    return (
      <g key={key}>
        <path d={body} fill={PLANE} stroke={cream(a)} strokeWidth={LW.house} />
        <Shade clip={rectD(cx + 4, top + 12, cx + 32, ROOF.ridge + 30)} box={[cx, top, cx + 34, ROOF.ridge + 30]} />
        <rect x={cx - 37} y={top} width={74} height={12} fill={PLANE} stroke={cream(a)} strokeWidth={LW.house} />
        {[-12, 12].map((o, i) => (
          <path key={i} d={`M${cx + o - 8} ${top}V${top - 26 - i * 4}H${cx + o + 8}V${top}Z`} fill={PLANE} stroke={cream(a)} strokeWidth={LW.detail} />
        ))}
      </g>
    );
  };
  const timber = (d: string, key: string) => (
    <g key={key}>
      <path d={d} stroke={cream(0.5)} strokeWidth={16} strokeLinecap="butt" fill="none" />
      <path d={d} stroke={TIMBER} strokeWidth={13} strokeLinecap="butt" fill="none" />
    </g>
  );
  const door = { x0: 272, x1: 382, y0: 2214, y1: FOOT };
  const shop = { x0: 432, x1: 650, y0: 2182, y1: 2300 };
  const r = (door.x1 - door.x0) / 2;
  return (
    <g>
      {chim(282, 1420, "cL")}
      {chim(800, 1412, "cR")}
      {/* the roof */}
      <path d={roofD} fill={PLANE} stroke={cream(a)} strokeWidth={LW.house} />
      <path d={tiles} stroke={cream(0.16)} strokeWidth={LW.context} />
      <rect x={x0 - 14} y={ROOF.eaves} width={x1 - x0 + 28} height={16} fill={PLANE} stroke={cream(a)} strokeWidth={LW.house} />
      {/* the upper storey: dark plaster, a few heavy timbers */}
      <rect x={x0 - 4} y={FLOOR1.top} width={x1 - x0 + 8} height={FLOOR1.bottom - FLOOR1.top} fill={PLANE} stroke={cream(a)} strokeWidth={LW.house} />
      <rect x={x0 - 4} y={FLOOR1.top} width={x1 - x0 + 8} height={22} fill="rgba(12,9,6,0.5)" />
      {timber(`M${x0 + 6} ${FLOOR1.top + 4}V${FLOOR1.bottom}`, "pL")}
      {timber(`M${x1 - 6} ${FLOOR1.top + 4}V${FLOOR1.bottom}`, "pR")}
      {timber(`M${x0 + 14} ${FLOOR1.bottom - 16}L${WIN.x0 - 14} ${FLOOR1.top + 40}`, "bL")}
      {timber(`M${WIN.x1 + 26} ${FLOOR1.bottom - 16}L${x1 - 16} ${FLOOR1.top + 40}`, "bR")}
      {/* the window's head */}
      <rect x={WIN.x0 - 10} y={WIN.y0 - 18} width={WIN.x1 - WIN.x0 + 20} height={18} fill={PLANE} stroke={cream(0.9)} strokeWidth={LW.house} />
      {/* fascia over the shop */}
      <rect x={x0 - 6} y={FASCIA.top} width={x1 - x0 + 12} height={FASCIA.bottom - FASCIA.top} fill={TIMBER} stroke={cream(a)} strokeWidth={LW.house} />
      {/* the shop storey: a door under a fanlight, one shop window */}
      <rect x={x0} y={FASCIA.bottom} width={x1 - x0} height={FOOT - FASCIA.bottom} fill={PLANE} stroke={cream(a)} strokeWidth={LW.house} />
      <path d={`M${door.x0 - 8} ${door.y1}V${door.y0}A${r + 8} ${r + 8} 0 0 1 ${door.x1 + 8} ${door.y0}V${door.y1}Z`} fill={TIMBER} stroke={cream(a)} strokeWidth={LW.house} />
      <path d={`M${door.x0} ${door.y0}A${r} ${r} 0 0 1 ${door.x1} ${door.y0}Z`} fill={GLASS} stroke={cream(0.5)} strokeWidth={LW.detail} />
      <rect x={door.x0} y={door.y0} width={door.x1 - door.x0} height={door.y1 - door.y0} fill={TIMBER} stroke={cream(0.6)} strokeWidth={LW.detail} />
      <rect x={door.x0 + 14} y={door.y0 + 16} width={door.x1 - door.x0 - 28} height={70} fill="none" stroke={cream(0.35)} strokeWidth={LW.context} />
      <rect x={door.x0 + 14} y={door.y0 + 100} width={door.x1 - door.x0 - 28} height={70} fill="none" stroke={cream(0.35)} strokeWidth={LW.context} />
      <rect x={shop.x0 - 10} y={shop.y0 - 10} width={shop.x1 - shop.x0 + 20} height={FOOT - shop.y0 + 10} fill={TIMBER} stroke={cream(a)} strokeWidth={LW.house} />
      <Panes x0={shop.x0} y0={shop.y0} x1={shop.x1} y1={shop.y1} cols={3} rows={2} a={0.6} bar={3} />
      {/* the shaded right side of the house front and under the cornice and fascia */}
      <Shade clip={rectD(x1 - 30, FLOOR1.top, x1 + 4, FOOT)} box={[x1 - 40, FLOOR1.top, x1 + 10, FOOT]} />
      <Shade clip={rectD(x0, FASCIA.bottom, x1, FASCIA.bottom + 26)} box={[x0, FASCIA.bottom, x1, FASCIA.bottom + 26]} />
      {/* contact shadow at the foot */}
      <rect x={-320} y={FOOT - 2} width={1740} height={12} fill="rgba(12,9,6,0.6)" />
    </g>
  );
})();

/** THE window, live: a heavy bright casing, two big sashes (four panes each); the lower one thrown up behind the upper */
const TheWindow: React.FC<{ frame: number }> = ({ frame }) => {
  const rise = (SASH_H - 8) * sstep(lin(frame, T.sashUp[0], T.sashUp[1]));
  const ly0 = W1.y1 - SASH_H - rise;
  const sash = (y: number, key: string) => (
    <g key={key}>
      <rect x={W1.x0} y={y} width={W1.x1 - W1.x0} height={SASH_H} fill={TIMBER} stroke={cream(0.9)} strokeWidth={LW.house} />
      <Panes x0={W1.x0 + 10} y0={y + 10} x1={W1.x1 - 10} y1={y + SASH_H - 10} cols={2} rows={2} a={0.9} bar={5} />
    </g>
  );
  return (
    <g>
      <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} fill={TIMBER} stroke={cream(0.95)} strokeWidth={LW.subject} />
      <rect x={W1.x0} y={W1.y0} width={W1.x1 - W1.x0} height={W1.y1 - W1.y0} fill={ROOM} />
      {sash(ly0, "lo")}
      {sash(W1.y0, "up")}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STREET: a quiet cobble texture that sinks into darkness toward us; the kennel (the one filthy thing)
// ---------------------------------------------------------------------------
const rowH = (y: number) => 10 + 0.075 * (y - FOOT);
const Street: React.ReactElement = (() => {
  const K = KENNEL;
  const rowsD: { d: string; y: number }[] = [];
  let y = FOOT + 6;
  let j = 0;
  while (y < 3800) {
    const h = rowH(y);
    if (y + h > K.y0 + 4 && y < K.y1) {
      y = K.y1;
      continue;
    }
    const w = 1.6 * h;
    let x = -320 - (j % 2) * w * 0.5;
    let d = "";
    let i = 0;
    while (x < 1420) {
      const ww = w * (0.7 + random(`cw${j}-${i}`) * 0.6);
      const g = h * 0.14;
      // a rounded sett, jittered: a soft texture, never a grid of bricks
      const jy = (random(`cj${j}-${i}`) - 0.5) * h * 0.2;
      const x0 = x + g;
      const x1 = x + ww - g;
      const y0 = y + g + jy;
      const y1 = y + h - g + jy;
      const rx = Math.min((x1 - x0) / 2, h * 0.5);
      const ry = (y1 - y0) / 2;
      d += `M${r2(x0 + rx)} ${r2(y0)}H${r2(x1 - rx)}A${r2(rx)} ${r2(ry)} 0 0 1 ${r2(x1 - rx)} ${r2(y1)}H${r2(x0 + rx)}A${r2(rx)} ${r2(ry)} 0 0 1 ${r2(x0 + rx)} ${r2(y0)}Z`;
      x += ww;
      i++;
    }
    rowsD.push({ d, y });
    y += h;
    j++;
  }
  let top = `M-320 ${K.y0 + 14}`;
  let bot = "";
  for (let x = -320; x <= 1420; x += 40) {
    top += `L${x} ${r2(K.y0 + 12 + 5 * Math.sin(x * 0.031) + 3 * Math.sin(x * 0.09))}`;
    bot = `L${x} ${r2(K.y1 - 10 + 4 * Math.sin(x * 0.027 + 1) + 3 * Math.sin(x * 0.11))}` + bot;
  }
  const surfD = `${top}L1420 ${K.y1 - 10}${bot}Z`;
  let sheen = "";
  for (let x = -320; x <= 1420; x += 30) sheen += `${x === -320 ? "M" : "L"}${x} ${r2(K.y0 + 30 + 3 * Math.sin(x * 0.05))}`;
  return (
    <g>
      <defs>
        <linearGradient id="dl-street-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E0B08" stopOpacity={0} />
          <stop offset="0.5" stopColor="#0E0B08" stopOpacity={0.35} />
          <stop offset="1" stopColor="#0E0B08" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <rect x={-320} y={FOOT} width={1740} height={1400} fill="#382D22" />
      {/* the setts as a soft texture: lighter blocks, no outlines */}
      {rowsD.map((r) => (
        <path key={r.y} d={r.d} fill="#3E3226" />
      ))}
      <rect x={-320} y={K.y1 + 320} width={1740} height={900} fill="url(#dl-street-dark)" />
      {/* THE KENNEL: the far edge, the channel brimming with sludge, the near edge */}
      <path d={`M-320 ${K.y0}H1420V${K.y0 + 16}H-320Z`} fill="#4A3C2D" stroke={cream(0.5)} strokeWidth={LW.detail} />
      <path d={surfD} fill={SLUDGE} stroke={DARK} strokeWidth={2.4} />
      <path d={`M-320 ${K.y0 + 22}H1420`} stroke="rgba(10,8,5,0.45)" strokeWidth={6} />
      <path d={sheen} stroke={cream(0.2)} strokeWidth={1.6} fill="none" />
      <path d={`M-320 ${K.y1 - 8}H1420V${K.y1}H-320Z`} fill="#4A3C2D" stroke={cream(0.45)} strokeWidth={LW.detail} />
    </g>
  );
})();

/** the sludge in the kennel, alive: slow ripples, a few lumps and straws, the odd bubble, all drifting downhill */
const Sludge: React.FC<{ frame: number }> = ({ frame }) => {
  const K = KENNEL;
  const span = 1760;
  const drift = (i: number, sp = 0.8) => ((random(`sx${i}`) * span + frame * sp) % span) - 330;
  const yIn = (i: number, m = 0) => K.y0 + 32 + m + random(`sy${i}`) * (K.y1 - K.y0 - 52 - 2 * m);
  let rip = "";
  for (let i = 0; i < 36; i++) {
    const x = drift(i, 0.7 + random(`sv${i}`) * 0.4);
    const w = 18 + random(`sw${i}`) * 28;
    rip += `M${r2(x)} ${r2(yIn(i))}q${r2(w / 2)} -3 ${r2(w)} 0`;
  }
  const lumps: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const x = drift(100 + i, 0.75);
    const yy = yIn(100 + i, 8);
    const r = 10 + random(`lr${i}`) * 8;
    lumps.push(
      <g key={i}>
        <path d={blobD(clotRing(x, yy, r, 1, 0, `lp${i}`))} fill="#4A3B2B" stroke={DARK} strokeWidth={1.8} />
        <path d={`M${r2(x - r * 0.9)} ${r2(yy - r * 0.2)}q${r2(r * 0.6)} ${r2(-r * 0.55)} ${r2(r * 1.2)} ${r2(-r * 0.3)}`} stroke={cream(0.4)} strokeWidth={1.4} fill="none" />
      </g>,
    );
  }
  let bits = "";
  for (let i = 0; i < 6; i++) bits += `M${r2(drift(200 + i, 0.8))} ${r2(yIn(200 + i))}l22 -4`;
  const bub: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const per = 30 + Math.floor(random(`bp${i}`) * 14);
    const off = Math.floor(random(`bo${i}`) * per);
    const ph = (frame + off) % per;
    const cyc = Math.floor((frame + off) / per);
    const x = -100 + random(`bx${i}-${cyc}`) * 1300;
    const yy = yIn(300 + i, 10);
    if (ph < 10) bub.push(<circle key={i} cx={r2(x)} cy={r2(yy)} r={r2(2 + ph * 0.7)} fill="#2E2318" stroke={cream(0.45)} strokeWidth={1.2} />);
    else if (ph < 13) bub.push(<ellipse key={i} cx={r2(x)} cy={r2(yy)} rx={r2(9 + (ph - 10) * 5)} ry={r2(3 + (ph - 10) * 1.5)} fill="none" stroke={cream(0.35)} strokeWidth={1.2} />);
  }
  return (
    <g>
      <path d={rip} stroke={DEAD} strokeOpacity={0.55} strokeWidth={1.7} fill="none" />
      {lumps}
      <path d={bits} stroke={cream(0.45)} strokeWidth={1.8} fill="none" />
      {bub}
    </g>
  );
};


// ---------------------------------------------------------------------------
// THE FOREARM AND THE CHAMBER POT (the live subject)
// ---------------------------------------------------------------------------
/** the chamber pot in pot-local coords: squat, round-bellied, a broad flared lip, a loop handle on the left (away from
 *  the pouring lip on the right); origin = the handle's root. Seen a little from above, so the mouth shows as an
 *  ellipse with the dark contents in it; light from the upper left, hatching on the shaded right and underside. */
const POT_BODY = "M40 -60C6 -46 10 40 62 62H158C210 40 214 -46 180 -60Z";
const POT_CLIP = "dl-pot-body";
const PotShape: React.FC<{ full: number }> = ({ full }) => (
  <g>
    {/* the loop handle */}
    <path d="M44 -42C-10 -54 -20 26 44 22" stroke={DARK} strokeWidth={20} fill="none" />
    <path d="M44 -42C-10 -54 -20 26 44 22" stroke={INK_DEEP} strokeWidth={12} fill="none" />
    <path d="M30 -44C2 -44 -6 -8 4 6" stroke="#FFF7E2" strokeOpacity={0.6} strokeWidth={3} fill="none" strokeLinecap="round" />
    {/* the foot ring */}
    <rect x={62} y={56} width={96} height={14} rx={4} fill={INK_DEEP} stroke={DARK} strokeWidth={3.6} />
    {/* the belly */}
    <path d={POT_BODY} fill={INK} stroke={DARK} strokeWidth={4.2} />
    <clipPath id={POT_CLIP}>
      <path d={POT_BODY} />
    </clipPath>
    <g clipPath={`url(#${POT_CLIP})`}>
      <path d={hatchD(110, -70, 230, 80, -56, 5)} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.7} clipPath="url(#dl-pot-shade)" />
      <path d="M30 30Q110 60 190 30M34 44Q110 70 186 44" stroke={DARK} strokeOpacity={0.45} strokeWidth={1.6} fill="none" />
    </g>
    <clipPath id="dl-pot-shade">
      <path d="M142 -80H240V90H20V40Q120 46 142 -80Z" />
    </clipPath>
    {/* a glaze band round the shoulder, the highlight on the lit side */}
    <path d="M24 -34Q110 -20 196 -34" stroke={DARK} strokeOpacity={0.55} strokeWidth={2} fill="none" />
    <path d="M44 -26C30 -8 32 16 46 32" stroke="#FFF7E2" strokeOpacity={0.8} strokeWidth={6} fill="none" strokeLinecap="round" />
    {/* the flared lip and the mouth, the dark contents in it */}
    <ellipse cx={110} cy={-66} rx={96} ry={17} fill={INK} stroke={DARK} strokeWidth={4} />
    <ellipse cx={110} cy={-66} rx={80} ry={11} fill={DARK} />
    {full > 0.02 ? <ellipse cx={110 + 22 * (1 - full)} cy={-65} rx={r2(72 * (0.4 + 0.6 * full))} ry={r2(8 * (0.5 + 0.5 * full))} fill={SLOP_D} /> : null}
    {full > 0.02 ? <path d={`M${r2(70 + 20 * (1 - full))} -68q22 -3 40 0`} stroke={cream(0.45)} strokeWidth={1.6} fill="none" /> : null}
  </g>
);
const ArmAndPot: React.FC<{ frame: number }> = ({ frame }) => {
  const out = lin(frame, T.armOut[0] - 1, T.armOut[1]);
  if (out <= 0) return null;
  const g = gripAt(frame);
  const th = tipAngle(frame);
  const piv = potPoint(frame, [0, 0]); // where the pot-local origin is now
  const elbow: [number, number] = [g[0] + ELBOW_OFF[0], g[1] + ELBOW_OFF[1]];
  // the forearm: a tapered sleeve from the elbow (in the dark room) to the cuff at the wrist
  const dx = g[0] - elbow[0];
  const dy = g[1] - elbow[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  const wrist: [number, number] = [g[0] - ux * 18, g[1] - uy * 18];
  const we = 40;
  const ww = 26;
  const mx = (elbow[0] + wrist[0]) / 2;
  const my = (elbow[1] + wrist[1]) / 2;
  const wm = (we + ww) / 2 + 5;
  const sleeve = `M${r2(elbow[0] + nx * we)} ${r2(elbow[1] + ny * we)}Q${r2(mx + nx * wm * 1.1)} ${r2(my + ny * wm * 1.1)} ${r2(wrist[0] + nx * ww)} ${r2(wrist[1] + ny * ww)}Q${r2(wrist[0] + ux * 6)} ${r2(wrist[1] + uy * 6)} ${r2(wrist[0] - nx * ww)} ${r2(wrist[1] - ny * ww)}Q${r2(mx - nx * wm * 1.15)} ${r2(my - ny * wm * 1.15)} ${r2(elbow[0] - nx * we)} ${r2(elbow[1] - ny * we)}Z`;
  // the sleeve's shaded underside (hatch lines along it)
  let sh = "";
  for (let i = 0; i < 6; i++) {
    const t0 = 0.1 + i * 0.13;
    const p = [elbow[0] + dx * t0, elbow[1] + dy * t0];
    const wv = we + (ww - we) * t0;
    sh += `M${r2(p[0] - nx * wv * 0.15)} ${r2(p[1] - ny * wv * 0.15)}L${r2(p[0] - nx * wv * 0.95)} ${r2(p[1] - ny * wv * 0.95)}`;
  }
  // two creases across the sleeve
  let folds = "";
  [0.5, 0.7].forEach((t0) => {
    const p = [elbow[0] + dx * t0, elbow[1] + dy * t0];
    const wv = (we + (ww - we) * t0) * 0.85;
    folds += `M${r2(p[0] + nx * wv)} ${r2(p[1] + ny * wv)}Q${r2(p[0] + ux * 9)} ${r2(p[1] + uy * 9)} ${r2(p[0] - nx * wv * 0.6)} ${r2(p[1] - ny * wv * 0.6)}`;
  });
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  // coming out of the dark room: the arm and the pot are sunk in shadow until they reach the light
  const lit = sstep(out);
  const full = frame < T.pour[0] ? 1 : 1 - lin(frame, T.pour[0], T.pour[1]);
  return (
    <g>
      <defs>
        <linearGradient id="dl-arm-dark" gradientUnits="userSpaceOnUse" x1={elbow[0]} y1={elbow[1]} x2={wrist[0]} y2={wrist[1]}>
          <stop offset="0" stopColor={ROOM} stopOpacity={1} />
          <stop offset="0.18" stopColor={ROOM} stopOpacity={0.3} />
          <stop offset="0.32" stopColor={ROOM} stopOpacity={0} />
          <stop offset="1" stopColor={ROOM} stopOpacity={0} />
        </linearGradient>
        <clipPath id="dl-arm-clip">
          {/* never in front of the window's left jamb (the elbow is inside the room); and while the pot is still being
              lifted out of the room, nothing shows below the window's bottom rail (the wall below hides it) */}
          <rect x={lean(W1.x0, 1960) + 1} y={0} width={2000} height={W1.y1 + 400 * lin(frame, T.armOut[1] - 2, T.armOut[1] + 8)} />
        </clipPath>
      </defs>
      {lit < 1 ? (
        <filter id="dl-sunk">
          {/* in the room's shadow until it is out: the whole arm and pot darkened as one (no shadow shape) */}
          <feComponentTransfer>
            <feFuncR type="linear" slope={r2(0.25 + 0.75 * lit)} />
            <feFuncG type="linear" slope={r2(0.25 + 0.75 * lit)} />
            <feFuncB type="linear" slope={r2(0.25 + 0.75 * lit)} />
          </feComponentTransfer>
        </filter>
      ) : null}
      <g clipPath="url(#dl-arm-clip)" filter={lit < 1 ? "url(#dl-sunk)" : undefined}>
      <g>
        <path d={sleeve} fill={COAT} stroke={DARK} strokeWidth={3} />
        <path d={sleeve} fill="none" stroke={cream(0.95)} strokeWidth={3} />
        <path d={sh} stroke={cream(0.55)} strokeWidth={1.6} />
        <path d={folds} stroke={cream(0.55)} strokeWidth={1.5} fill="none" />
        <path d={sleeve} fill="url(#dl-arm-dark)" />
      </g>
      {/* the pot, turned about its pivot */}
      <g transform={`translate(${r2(piv[0])} ${r2(piv[1])}) rotate(${th.toFixed(3)})`}>
        <PotShape full={full} />
      </g>
      {/* the cuff: a ruffle at the wrist */}
      <g transform={`translate(${r2(wrist[0])} ${r2(wrist[1])}) rotate(${ang.toFixed(3)})`}>
        {/* the cuff: a turned-back cream band at the wrist */}
        <path d="M-10 -27L10 -25Q14 0 10 25L-10 27Q-6 0 -10 -27Z" fill={INK} stroke={DARK} strokeWidth={2.6} />
        <path d="M-2 -24Q2 0 -2 24" stroke={DARK} strokeOpacity={0.5} strokeWidth={1.4} fill="none" />
      </g>
      {/* the hand round the handle */}
      <g transform={`translate(${r2(g[0])} ${r2(g[1])}) rotate(${(ang + th * 0.35).toFixed(3)}) scale(1.7)`}>
        <path d="M-20 -13Q-6 -19 6 -14Q16 -10 15 0Q16 10 6 14Q-6 18 -20 12Z" fill={INK_DEEP} stroke={DARK} strokeWidth={3.2} />
        <path d="M2 -12Q9 -7 8 -1M4 -2Q11 2 9 7M2 6Q8 10 5 13" stroke={DARK} strokeWidth={2.1} fill="none" />
        <path d="M-8 -14Q2 -24 12 -16" stroke={DARK} strokeWidth={2.9} fill={INK_DEEP} />
      </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SLOP: one stream of particles from the lip, then the splash, the run, drips (pure functions of the frame)
// ---------------------------------------------------------------------------
type Drop = { te: number; p0: [number, number]; v: [number, number]; ti: number; flux: number; hit: [number, number] };
const POUR_STEP = 0.25;
const POUR_FULL_UNTIL = 999; // r2: the pour never stops before the cut
const fluxAt = (te: number) => {
  if (te < T.pour[0] || te > T.pour[1]) return 0;
  // a gulp out of the full pot, a steady stream that eases as the pot empties, a second slosh at ~f100
  const rise = Math.min(1, 0.4 + (te - T.pour[0]) / 1.0);
  const ease = 1 - 0.35 * lin(te, 84, 98);
  const slosh = 0.3 * Math.sin(Math.PI * lin(te, 97, 109));
  return Math.min(1, rise * ease + slosh);
};
const impactT = (y0: number, vy: number, g: number, yS: number) => (-vy + Math.sqrt(vy * vy + 2 * g * (yS - y0))) / g;
const SLOP_G = (() => {
  const t = T.contact - T.pour[0];
  const p0 = lipAt(T.pour[0]);
  const p1 = lipAt(T.pour[0] + 0.5);
  const vy = SLOP_V0[1] + 0.3 * (p1[1] - p0[1]) * 2;
  return (2 * (KENNEL.surf - p0[1] - vy * t)) / (t * t);
})();
const STREAM: Drop[] = (() => {
  const out: Drop[] = [];
  for (let te = T.pour[0]; te <= T.pour[1] + 1e-6; te += POUR_STEP) {
    const p0 = lipAt(te);
    const p1 = lipAt(te + 0.5);
        // thrown out over the street (the swing of the wrist, not the lip's own drift)
    // the last dribble (after the pour has run dry) drops away quickly instead of trailing
    const v: [number, number] = [SLOP_V0[0], SLOP_V0[1] + 0.3 * (p1[1] - p0[1]) * 2 + 0.6 * Math.max(0, te - POUR_FULL_UNTIL)];
    const ti = impactT(p0[1], v[1], SLOP_G, KENNEL.surf);
    out.push({ te, p0, v, ti, flux: fluxAt(te), hit: [p0[0] + v[0] * ti, KENNEL.surf] });
  }
  return out;
})();
const dropPos = (d: Drop, f: number): [number, number] => {
  const t = f - d.te;
  return [d.p0[0] + d.v[0] * t, d.p0[1] + d.v[1] * t + 0.5 * SLOP_G * t * t];
};
/** the splat's droplets: 8 drops thrown up and out from the first slop to hit (f79-81), arcing and falling back */
type Fleck = { t0: number; p0: [number, number]; v: [number, number]; tl: number; land: [number, number]; r: number };
const FLECKS: Fleck[] = (() => {
  const out: Fleck[] = [];
  const first = STREAM.slice(0, 12).filter((_, i) => i % 3 !== 2); // 8 of the first particles to land
  first.forEach((d, j) => {
    const s = `fk${j}`;
    const side = j % 2 ? 1 : -1;
    const spread = 0.3 + 0.7 * ((j >> 1) / 3);
    const v: [number, number] = [side * (6 + 15 * spread + random(`fv${s}`) * 3), -(15 - 6 * spread + random(`fu${s}`) * 3)];
    const dyLand = -6 + random(`fd${s}`) * 26;
    const g = SLOP_G * 0.55;
    const tl = impactT(d.hit[1], v[1], g, d.hit[1] + dyLand);
    out.push({ t0: d.te + d.ti, p0: d.hit, v, tl, land: [d.hit[0] + v[0] * tl, d.hit[1] + dyLand], r: 9 + random(`fr${s}`) * 4 });
  });
  return out;
})();
const FLECK_G = SLOP_G * 0.55;
const IMPACT_X = (() => {
  let s = 0;
  let w = 0;
  STREAM.forEach((d) => {
    s += d.hit[0] * d.flux;
    w += d.flux;
  });
  return s / w;
})();

/** THE POUR: thrown from the lip out over the street in one continuous, tapered pour, widest at the lip and thinning
 *  as it falls (as falling liquid does), its edge a little wavy, one wet sheen along it. It breaks into drops only in
 *  the last ~15 % of the fall and, at the end, where the emptying pot gives only a dribble; when the pour stops the
 *  tail leaves the lip first and falls away downward. */
const Stream: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  type Pt = { p: [number, number]; w: number; te: number; fl: number; frac: number; u: [number, number]; i: number };
  const pts: Pt[] = [];
  STREAM.forEach((d, i) => {
    if (!(d.te <= f && f < d.te + d.ti)) return;
    const age = f - d.te;
    const p = dropPos(d, f);
    const vx = d.v[0];
    const vy = d.v[1] + SLOP_G * age;
    const vl = Math.hypot(vx, vy) || 1;
    // varicose: the falling sheet swells and necks in slow waves travelling down it
    const gulp = 1 + 0.45 * Math.max(0, 1 - (d.te - T.pour[0]) / 2.5);
    const w = gulp * (10 + 84 * d.flux) * Math.max(0.5, 1 - 0.03 * age) * (1 + Math.min(0.12, 0.016 * age) * Math.sin(d.te * 2.2) + 0.04 * Math.sin(d.te * 1.7 + 1));
    pts.push({ p, w, te: d.te, fl: d.flux, frac: (p[1] - d.p0[1]) / (KENNEL.surf - d.p0[1]), u: [vx / vl, vy / vl], i });
  });
  if (f >= T.pour[0] && f <= T.pour[1]) pts.push({ p: lipAt(f), w: 10 + 84 * fluxAt(f), te: f, fl: fluxAt(f), frac: 0, u: [0.6, 0.8], i: -1 });
  pts.sort((a, b) => b.te - a.te); // from the lip down to the head
  // after the pour has torn off at the lip (~f88) the tear runs down the falling remainder: it breaks into drops
  // from the top down instead of falling as one piece
  const tearTe = 999;
  const inBody = (q: Pt) => q.frac < 0.85 && q.fl >= 0.3 && q.te < tearTe;
  // the body: consecutive particles still in one sheet (a new run only if a dribble interrupts it)
  const runs: Pt[][] = [];
  let cur: Pt[] = [];
  const drops: React.ReactNode[] = [];
  pts.forEach((q) => {
    if (inBody(q)) {
      cur.push(q);
      return;
    }
    if (cur.length) runs.push(cur);
    cur = [];
    // a drop: every other bit of the dribble and the breaking foot of the pour
    if (q.i >= 0 && q.i % (q.te >= tearTe ? 3 : 4) === 0) {
      const r = Math.max(3, q.w * 0.3);
      drops.push(<ellipse key={`d${q.i}`} cx={r2(q.p[0])} cy={r2(q.p[1])} rx={r2(r)} ry={r2(r * 1.5)} transform={`rotate(${r2((Math.atan2(q.u[1], q.u[0]) * 180) / Math.PI - 90)} ${r2(q.p[0])} ${r2(q.p[1])})`} fill={SLOP} stroke={DARK} strokeWidth={1.6} />);
    }
  });
  if (cur.length) runs.push(cur);
  const bodies: React.ReactNode[] = [];
  runs.forEach((run, j) => {
    if (run.length < 2) return;
    const L: [number, number][] = [];
    const R: [number, number][] = [];
    const SH: string[] = [];
    run.forEach((q, i) => {
      const a = run[Math.max(0, i - 1)].p;
      const b = run[Math.min(run.length - 1, i + 1)].p;
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl;
      const ny = tx / tl;
      const hw = q.w / 2;
      // gloopy: each edge bulges and pinches on its own, the bulges riding down with the slop
      const gl = 1 + 0.18 * Math.sin(q.te * 1.25) + 0.1 * Math.sin(q.te * 2.6 + 1.1);
      const gr = 1 + 0.18 * Math.sin(q.te * 1.1 + 2) + 0.1 * Math.sin(q.te * 2.3 + 0.3);
      L.push([q.p[0] - nx * hw * gl, q.p[1] - ny * hw * gl]);
      R.push([q.p[0] + nx * hw * gr, q.p[1] + ny * hw * gr]);
      // the sheen runs only where the pour is full (never round a thinning end)
      if (q.fl >= 0.7) SH.push(`${r2(q.p[0] - nx * hw * 0.35)} ${r2(q.p[1] - ny * hw * 0.35)}`);
    });
    // the ends taper to a point along the fall: the foot where it is breaking up, the top once it has left the lip
    const head = run[run.length - 1];
    const ring: [number, number][] = [...L, [head.p[0] + head.u[0] * head.w * 0.42, head.p[1] + head.u[1] * head.w * 0.42], ...R.slice().reverse()];
    // its top is the lip while it pours; once it has torn off, the top has thinned to a thread (the drops above it)
    const bid = `dl-pour${j}`;
    const xs = ring.map((q) => q[0]);
    const ys = ring.map((q) => q[1]);
    bodies.push(
      <g key={j}>
        <path d={blobD(ring)} fill={SLOP} stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
        <clipPath id={bid}>
          <path d={blobD(ring)} />
        </clipPath>
        <path d={hatchD(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), HATCH.angle, 7)} stroke={cream(0.2)} strokeWidth={1.1} clipPath={`url(#${bid})`} />
        <path d={`M${L.map((q) => `${r2(q[0])} ${r2(q[1])}`).join("L")}`} stroke={cream(0.8)} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        {SH.length > 3 ? <path d={`M${SH.slice(1, -1).join("L")}`} stroke={SHEEN} strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
      </g>,
    );
  });
  // lumps and clots carried down in the stream (they ride with the slop, a darker body with a lit edge)
  pts.forEach((q) => {
    if (q.i < 0 || q.i % 7 !== 3 || !inBody(q) || q.frac < 0.05) return;
    const r = Math.max(6, q.w * (0.22 + 0.12 * random(`cs${q.i}`)));
    const ox = (random(`co${q.i}`) - 0.5) * q.w * 0.35;
    const x = q.p[0] - q.u[1] * ox;
    const y = q.p[1] + q.u[0] * ox;
    drops.push(
      <g key={`c${q.i}`}>
        <path d={blobD(clotRing(x, y, r, q.u[0], q.u[1], `cl${q.i}`))} fill={SLOP_D} stroke={DARK} strokeWidth={1.6} />
        <path d={`M${r2(x - r * 0.8)} ${r2(y)}q${r2(r * 0.4)} ${r2(-r * 0.9)} ${r2(r * 1.2)} ${r2(-r * 0.7)}`} stroke={cream(0.6)} strokeWidth={1.4} fill="none" />
      </g>,
    );
  });
  // a little spray peeling off the sides of the falling sheet
  pts.forEach((q) => {
    if (q.i < 0 || q.i % 5 !== 2 || q.frac < 0.25 || !inBody(q)) return;
    const side = q.i % 10 === 2 ? -1 : 1;
    const off = q.w * 0.5 + 6 + 30 * q.frac;
    const x = q.p[0] - q.u[1] * off * side;
    const y = q.p[1] + q.u[0] * off * side;
    drops.push(<ellipse key={`s${q.i}`} cx={r2(x)} cy={r2(y)} rx={3.4} ry={4.6} fill={SLOP} stroke={DARK} strokeWidth={1.4} />);
  });
  return (
    <g>
      {bodies}
      {drops}
    </g>
  );
};

/** the splash at the kennel: the crown while the stream lands, the flecks thrown out, the spatter they leave */
const Splash: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  // landing rate now (flux of drops landing in the last 3 frames)
  let rate = 0;
  let hx = 0;
  STREAM.forEach((d) => {
    const tl = d.te + d.ti;
    if (tl <= f && tl > f - 3) {
      rate += d.flux;
      hx += d.hit[0] * d.flux;
    }
  });
  const crown: React.ReactNode[] = [];
  if (rate > 0.01) {
    const cx = hx / rate;
    // biggest on the first hit, then a smaller churn while the pour keeps landing
    const hit = 1 - lin(f, T.contact + 3, T.contact + 9) * 0.4;
    const I = Math.min(1, rate / 9) * hit;
    const base = KENNEL.surf + 4;
    const rw = 66 + 60 * I;
    // a lumpy, churning heap of slop where the stream lands, its top lit, with clots flung up and falling back
    const ring: [number, number][] = [];
    const N = 14;
    const ph = Math.floor(f / 2);
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = cx - rw + 2 * rw * u;
      const hgt = (22 + 46 * I) * Math.sin(Math.PI * u) * (0.6 + 0.7 * random(`mh${i}-${ph}`));
      ring.push([x, base - hgt]);
    }
    ring.push([cx + rw * 0.9, base + 8], [cx, base + 12], [cx - rw * 0.9, base + 8]);
    crown.push(<path key="heap" d={blobD(ring)} fill={SLOP} stroke={DARK} strokeWidth={2} strokeLinejoin="round" />);
    crown.push(<path key="heaplit" d={`M${ring.slice(1, Math.ceil(N * 0.55)).map(([x, y]) => `${r2(x)} ${r2(y + 3)}`).join("L")}`} stroke={cream(0.75)} strokeWidth={2} fill="none" />);
    for (let k = 0; k < 6; k++) {
      // each clot on its own short arc, re-thrown every 7 frames
      const per = 7;
      const t0 = ((f + k * 3) % per) / per;
      const side = k % 2 ? 1 : -1;
      const sp = 0.4 + 0.6 * random(`cf${k}-${Math.floor((f + k * 3) / per)}`);
      const x = cx + side * (12 + 70 * sp * I) * t0;
      const y = base - 20 - (40 + 60 * sp) * I * 4 * t0 * (1 - t0);
      const r = (6 + 6 * sp) * (0.6 + 0.4 * I);
      crown.push(
        <g key={`cf${k}`}>
          <path d={blobD(clotRing(x, y, r, 0.2, -1, `cr${k}`))} fill={SLOP_D} stroke={DARK} strokeWidth={1.6} />
          <path d={`M${r2(x - r * 0.7)} ${r2(y)}q${r2(r * 0.3)} ${r2(-r * 0.8)} ${r2(r)} ${r2(-r * 0.6)}`} stroke={cream(0.6)} strokeWidth={1.3} fill="none" />
        </g>,
      );
    }
  }
  const flecks: React.ReactNode[] = [];
  const spatter: React.ReactNode[] = [];
  FLECKS.forEach((k, i) => {
    const t = f - k.t0;
    if (t < 0) return;
    if (t < k.tl) {
      const x = k.p0[0] + k.v[0] * t;
      const y = k.p0[1] + k.v[1] * t + 0.5 * FLECK_G * t * t;
      flecks.push(
        <g key={i}>
          <path d={blobD(clotRing(x, y, k.r, 0.3, 0.9, `fk${i}`))} fill={SLOP} stroke={DARK} strokeWidth={1.6} />
          <path d={`M${r2(x - k.r * 0.7)} ${r2(y + k.r * 0.1)}A${r2(k.r * 0.75)} ${r2(k.r * 0.75)} 0 0 1 ${r2(x + k.r * 0.2)} ${r2(y - k.r * 0.7)}`} stroke={cream(0.75)} strokeWidth={1.4} fill="none" />
        </g>,
      );
    } else {
      const grow = Math.min(1, (t - k.tl) / 3);
      spatter.push(<ellipse key={i} cx={r2(k.land[0])} cy={r2(k.land[1])} rx={r2(k.r * (1.2 + 0.6 * grow))} ry={r2(k.r * 0.55)} fill={SLOP} stroke={cream(0.5)} strokeWidth={1} />);
    }
  });
  // rings where the tail's drops and clots fall into the slop
  const rings: React.ReactNode[] = [];
  STREAM.forEach((d, i) => {
    if (!(d.flux < 0.6 || i % 7 === 3)) return;
    const u = (f - (d.te + d.ti)) / 13;
    if (u < 0 || u >= 1) return;
    rings.push(<ellipse key={`rg${i}`} cx={r2(d.hit[0])} cy={KENNEL.surf + 2} rx={r2(6 + 34 * u)} ry={r2(2 + 9 * u)} fill="none" stroke={cream(0.5 * (1 - u))} strokeWidth={1.6} />);
  });
  return (
    <g>
      {spatter}
      {rings}
      {crown}
      {flecks}
    </g>
  );
};

/** the slop in the kennel: from the impact it runs on along the gutter (mostly downhill, to the right) */
const Run: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - T.contact;
  if (t < 0) return null;
  const cx = IMPACT_X;
  // the slop spreads along the kennel, mostly downhill (right), and stops well inside the frame
  // r3: it keeps spreading to the cut (it gets worse through "it was")
  const xR = cx + 30 + 300 * (1 - Math.exp(-t / 30));
  const xL = cx - 30 - 170 * (1 - Math.exp(-t / 28));
  const y0 = KENNEL.y0 + 18;
  const y1 = KENNEL.y1 - 12;
  const ym = (y0 + y1) / 2;
  // an irregular patch, thickest at the impact, its edges lobed (no outline: it merges into the sludge)
  const N = 26;
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = xL + ((xR - xL) * i) / N;
    const dist = x < cx ? (cx - x) / Math.max(1, cx - xL) : (x - cx) / Math.max(1, xR - cx);
    const hw = (y1 - y0) * 0.5 * (0.2 + 0.8 * Math.sqrt(Math.max(0, 1 - dist * dist)));
    const lobe = 5 * Math.sin(i * 1.9 + 0.7) + 3 * Math.sin(i * 3.7 + t * 0.12);
    top.push([x, ym - hw + lobe]);
    bot.push([x, ym + hw - lobe * 0.7]);
  }
  const d = blobD([...top, ...bot.reverse()]);
  let rip = "";
  for (let i = 0; i < 10; i++) {
    const span = xR - xL - 40;
    if (span <= 10) break;
    const u = (random(`rr${i}`) + (t * (0.6 + random(`rv${i}`) * 0.6)) / Math.max(60, span)) % 1;
    const x = xL + 20 + u * span;
    const yy = ym - 12 + random(`ry${i}`) * 24;
    rip += `M${r2(x)} ${r2(yy)}q8 -2.5 16 0`;
  }
  let bits = "";
  for (let i = 0; i < 4; i++) {
    const x = cx - 40 + random(`rb${i}`) * 100 + t * (0.5 + 0.3 * i);
    if (x > xR - 14) continue;
    bits += `M${r2(x)} ${r2(ym - 8 + i * 6)}l16 -3`;
  }
  // the wet stain soaking out over the setts either side of the kennel (toward the wall and a little toward us)
  const sg = easeOut(t / 30);
  const stain: [number, number][] = [];
  for (let j = 0; j < 16; j++) {
    const a = (j / 16) * Math.PI * 2;
    const rr = 0.82 + 0.3 * random(`sn${j}`);
    const rx = (xR - xL) * 0.55;
    const up = Math.sin(a) < 0;
    const ry = up ? (KENNEL.y1 - KENNEL.y0) * 0.5 + 34 * sg : (KENNEL.y1 - KENNEL.y0) * 0.5 + 12 * sg;
    stain.push([(xL + xR) / 2 + Math.cos(a) * rx * rr, ym + Math.sin(a) * ry * (0.85 + 0.2 * random(`sm${j}`))]);
  }
  return (
    <g>
      {t > 1 ? (
        <g>
          <clipPath id="dl-stain">
            <path d={blobD(stain)} />
          </clipPath>
          <path d={hatchD(xL - 80, KENNEL.y0 - 60, xR + 80, KENNEL.y1 + 30, HATCH.angle, 4)} stroke={DARK} strokeOpacity={0.55} strokeWidth={1.6} clipPath="url(#dl-stain)" />
        </g>
      ) : null}
      <path d={d} fill={SLOP} stroke={DARK} strokeWidth={1.6} />
      <clipPath id="dl-run">
        <path d={d} />
      </clipPath>
      <path d={hatchD(xL, y0 - 10, xR, y1 + 10, HATCH.angle, 7)} stroke={cream(0.2)} strokeWidth={1.1} clipPath="url(#dl-run)" />
      <path d={`M${top.map(([x, y]) => `${r2(x)} ${r2(y + 1.5)}`).join("L")}`} stroke={cream(0.8)} strokeWidth={2.2} fill="none" />
      <path d={rip} stroke={SHEEN} strokeOpacity={0.8} strokeWidth={1.8} fill="none" />
      <path d={bits} stroke={cream(0.5)} strokeWidth={1.8} fill="none" />
    </g>
  );
};

/** drips: from the pot's lip after the pour and from the sill's edge; each falls and rings the slop */
const DRIPS: { from: "lip" | "sill"; t0: number }[] = [
  { from: "sill", t0: 85 },
  { from: "sill", t0: 97 },
];
const SILL_DRIP_X = 606;
const Drips: React.FC<{ frame: number }> = ({ frame }) => {
  const out: React.ReactNode[] = [];
  // the wet smear on the sill (the slop that ran down the pot's side as it went over)
  const wet = easeOut(lin(frame, 64, 74));
  const sx = lean(SILL_DRIP_X, SILL.y1);
  if (wet > 0) {
    out.push(<path key="sw" d={`M${r2(sx - 34 * wet)} ${SILL.y0 + 1}H${r2(sx + 26 * wet)}V${SILL.y1}H${r2(sx - 34 * wet)}Z`} fill={SLOP} opacity={0.85} />);
    out.push(<path key="sw2" d={`M${r2(sx - 3)} ${SILL.y1}q3 ${r2(8 * wet)} 6 0`} fill={SLOP} />);
  }
  DRIPS.forEach((d, i) => {
    const grow = 5; // the drop swells, then lets go
    const t = frame - d.t0;
    if (t < -grow) return;
    const src: [number, number] = d.from === "lip" ? lipAt(Math.min(frame, d.t0)) : [sx, SILL.y1 + 2];
    if (t < 0) {
      const s = (t + grow) / grow;
      out.push(<ellipse key={i} cx={r2(src[0])} cy={r2(src[1] + 3 * s)} rx={r2(2 + 2 * s)} ry={r2(2.5 + 3 * s)} fill={SLOP} stroke={DARK} strokeWidth={1.1} />);
      return;
    }
    const tl = impactT(src[1], 0, SLOP_G, KENNEL.surf);
    if (t < tl) {
      const y = src[1] + 0.5 * SLOP_G * t * t;
      out.push(<ellipse key={i} cx={r2(src[0])} cy={r2(y)} rx={3.6} ry={r2(4.5 + Math.min(5, t * 0.6))} fill={SLOP} stroke={DARK} strokeWidth={1.1} />);
      return;
    }
    const u = (t - tl) / 12;
    if (u < 1) {
      out.push(<ellipse key={i} cx={r2(src[0])} cy={KENNEL.surf} rx={r2(4 + 20 * u)} ry={r2(1.5 + 4 * u)} fill="none" stroke={cream(0.45 * (1 - u))} strokeWidth={1.4} />);
    }
  });
  return <g>{out}</g>;
};

/** flies: tiny cream specks on looping paths round the refuse heap and the dung */
const FLY_SWARMS = [{ cx: 660, cy: KENNEL.y0 - 34, n: 3, rx: 70, ry: 18, seed: "k" }];
const Flies: React.FC<{ frame: number }> = ({ frame }) => {
  const out: React.ReactNode[] = [];
  FLY_SWARMS.forEach((sw) => {
    for (let i = 0; i < sw.n; i++) {
      const k = `${sw.seed}${i}`;
      const w = 0.1 + random(`fw${k}`) * 0.05;
      const ph = random(`fp${k}`) * 6.28;
      const rx = sw.rx * (0.6 + random(`fx${k}`) * 0.7);
      const ry = sw.ry * (0.6 + random(`fy${k}`) * 0.7);
      const t = frame * w + ph;
      const x = sw.cx + rx * Math.sin(t) + 14 * Math.sin(2.7 * t + i);
      const y = sw.cy - random(`fh${k}`) * 30 + ry * Math.sin(2 * t + ph) + 6 * Math.cos(3.3 * t);
      const flap = Math.sin(frame * 2.9 + i) > 0 ? 1 : 0.4;
      out.push(
        <g key={k}>
          <ellipse cx={r2(x - 2.4)} cy={r2(y - 2.2)} rx={2.4} ry={r2(1.1 + flap)} fill={cream(0.4)} />
          <ellipse cx={r2(x + 2.4)} cy={r2(y - 2.2)} rx={2.4} ry={r2(1.1 + flap)} fill={cream(0.4)} />
          <circle cx={r2(x)} cy={r2(y)} r={2.8} fill={INK} stroke={DARK} strokeWidth={1.3} />
        </g>,
      );
    }
  });
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// LONDON: IM Fell English SC, widely spaced caps, slides up while fading in on its word; lives in world space
// ---------------------------------------------------------------------------
const LondonLabel: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const sl = labelSlide(frame, 12, 7, 5); // slides up f12 -> lands f19, on the word
  if (sl.op <= 0.002) return null;
  const [sx, sy] = toScreen(cam, 820, LONDON_Y);
  if (sy < -120) return null;
  const size = 74;
  const sp = 0.4;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <text x={sx + (size * sp) / 2} y={sy + sl.dy} textAnchor="middle" opacity={sl.op} fill={INK} stroke={DARK} strokeOpacity={0.75} strokeWidth={size * 0.12} paintOrder="stroke" style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * sp }}>
        LONDON
      </text>
    </svg>
  );
};

/** where the (drawing-coordinate) cathedral is set in the world: scaled 0.7, its centre line at x 820, its base at y 1330 */
const DOME_AT = { s: 0.7, tx: 820 - 0.7 * DOME.cx, ty: 1330 - 0.7 * 964 };
const HOUSE_SKEW = `matrix(1 0 ${LEAN} 1 ${-LEAN * FOOT} 0)`;

const DisgustingLondonCold: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  return (
    <TexcocoPage cam={cam} vignette={0.3}>
      <WorldSvg cam={cam}>
        {/* the cathedral pushed into the distance: smaller, to the right of the house roof, behind a strip of roofs */}
        <g transform={`translate(${DOME_AT.tx} ${DOME_AT.ty}) scale(${DOME_AT.s})`}>
          <defs>
            <linearGradient id="dl-dome-fade" gradientUnits="userSpaceOnUse" x1="0" y1="880" x2="0" y2="975">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
            <mask id="dl-dome-mask" maskUnits="userSpaceOnUse" x={-200} y={-100} width={1500} height={1200}>
              <rect x={-200} y={-100} width={1500} height={1200} fill="url(#dl-dome-fade)" />
            </mask>
          </defs>
          <g mask="url(#dl-dome-mask)">{StPauls}</g>
        </g>
        <g transform={`translate(0 ${SKY_SHIFT})`}>{City}</g>
        <g transform={HOUSE_SKEW}>
          {HouseStatic}
          <TheWindow frame={frame} />
          <rect x={SILL.x0} y={SILL.y0} width={SILL.x1 - SILL.x0} height={SILL.y1 - SILL.y0} fill={PLANE} stroke={cream(0.95)} strokeWidth={3} />
          <rect x={SILL.x0 + 4} y={SILL.y1} width={SILL.x1 - SILL.x0 - 8} height={9} fill="rgba(12,9,6,0.55)" />
        </g>
        {Street}
        <Sludge frame={frame} />
        <Run frame={frame} />
        <Drips frame={frame} />
        <ArmAndPot frame={frame} />
        <Stream frame={frame} />
        <Splash frame={frame} />
        <Flies frame={frame} />
      </WorldSvg>
      <LondonLabel cam={cam} frame={frame} />
    </TexcocoPage>
  );
};

export default DisgustingLondonCold;
