// ---------------------------------------------------------------------------
// DisgustingLondon (kyle-london, cut 2). Dwarkesh map style (styles/dwarkesh-map.md).
// Opaque 1080x1920, 29.97 fps, 115 frames. The umber page with no map (kits/maps TexcocoPage); one tall
// engraved London world drawn here as vector art (world + camera + timeline in disgustingLondonWorld.ts).
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
  FLOOR2,
  FOOT,
  FPS,
  HEAP,
  HOUSE,
  KENNEL,
  LEAN,
  LONDON_Y,
  ROOF,
  SILL,
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
} from "./disgustingLondonWorld";

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
const FAR = "#352B21"; // the distant city's roofs
const DOME_FILL = "#2D251C";
const NEIGH = "#3A2F24"; // the neighbouring houses (context: just under the page, so the house is the dark plane)
const PLANE = "#261E16"; // the house front: dark umber
const TIMBER = "#1C1610";
const GLASS = "#16110C";
const ROOM = "#100C08";
const COAT = "#4A3D2E"; // the sleeve of a brown coat
const STONE = "#30271D";
const SLUDGE = "#2A2016";
const DEAD = "#8A7B62";
const SLOP = "#4A3E2E"; // the slop: DEAD darkened with umber, darker than the page
const SLOP_D = "#3A3024";
const SHEEN = DEAD; // the wet sheen on the slop
const SUB = 0.9; // cream in play (the context runs at ~0.3-0.5)

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
// ST PAUL'S (context-to-subject: cream ~0.8; light from the upper left, the right side hatched)
// ---------------------------------------------------------------------------
const StPauls: React.ReactElement = (() => {
  const { cx, spring, rx, ry } = DOME;
  const domeD = `M${cx - rx} ${spring}A${rx} ${ry} 0 0 1 ${cx + rx} ${spring}Z`;
  // ribs: meridians of the outer dome
  const merid = (phi: number) => {
    let d = "";
    for (let i = 0; i <= 24; i++) {
      const lat = (i / 24) * (82 * Math.PI) / 180;
      const x = cx + rx * Math.cos(lat) * Math.sin(phi);
      const y = spring - ry * Math.sin(lat);
      d += `${i ? "L" : "M"}${r2(x)} ${r2(y)}`;
    }
    return d;
  };
  let ribs = "";
  for (let i = -7; i <= 7; i++) ribs += merid((i * 11.25 * Math.PI) / 180);
  let shade = "";
  for (let p = 14; p < 90; p += 2.6) shade += merid((p * Math.PI) / 180);
  let shadeL = "";
  for (let p = -88; p < -66; p += 3.5) shadeL += merid((p * Math.PI) / 180);
  // attic drum (722-800) pilasters and windows; peristyle (826-945) columns
  const R_ATT = 318;
  const R_PER = 410;
  let pil = "";
  const wins: React.ReactNode[] = [];
  for (let th = -75; th <= 75; th += 15) {
    const s = Math.sin((th * Math.PI) / 180);
    const c = Math.cos((th * Math.PI) / 180);
    const x = cx + R_ATT * s;
    pil += `M${r2(x - 5 * c)} 724V798M${r2(x + 5 * c)} 724V798`;
    const tm = ((th + 7.5) * Math.PI) / 180;
    if (th < 75) {
      const xw = cx + R_ATT * Math.sin(tm);
      const ww = 9 * Math.cos(tm);
      wins.push(<rect key={th} x={r2(xw - ww)} y={744} width={r2(2 * ww)} height={30} fill={GLASS} stroke={cream(0.45)} strokeWidth={1.1} />);
    }
  }
  const cols: React.ReactNode[] = [];
  let colN = 0;
  for (let th = -84; th <= 84; th += 7) {
    const s = Math.sin((th * Math.PI) / 180);
    const c = Math.cos((th * Math.PI) / 180);
    const x = cx + R_PER * s;
    const w = 7.5 * c;
    const shadeA = th > 20 ? 0.42 : 0.62;
    // every fourth bay is the solid buttress section of the real peristyle
    if (colN % 4 === 3 && th < 84) {
      const x2 = cx + R_PER * Math.sin(((th + 7) * Math.PI) / 180);
      cols.push(<rect key={`b${th}`} x={r2(x)} y={828} width={r2(x2 - x)} height={116} fill={DOME_FILL} stroke={cream(0.4)} strokeWidth={1} />);
      cols.push(<rect key={`n${th}`} x={r2((x + x2) / 2 - 4 * c)} y={858} width={r2(8 * c)} height={48} rx={4 * c} fill={GLASS} />);
    }
    cols.push(<rect key={th} x={r2(x - w)} y={828} width={r2(2 * w)} height={116} fill={th > 20 ? "#3A3026" : "#4A3E30"} stroke={cream(shadeA)} strokeWidth={1.2} />);
    colN++;
  }
  const hs = hid();
  const hsL = hid();
  const hd = hid();
  const lanternBody = rectD(cx - 40, 262, cx + 40, 358);
  return (
    <g>
      {/* peristyle: the dark drum wall behind the columns, columns, entablature, balustrade, base */}
      <rect x={cx - R_PER} y={826} width={2 * R_PER} height={120} fill="#1F1912" />
      {cols}
      <rect x={cx - R_PER - 6} y={806} width={2 * R_PER + 12} height={22} fill={DOME_FILL} stroke={cream(0.6)} strokeWidth={2.1} />
      <rect x={cx - R_PER - 2} y={792} width={2 * R_PER + 4} height={14} fill={DOME_FILL} stroke={cream(0.5)} strokeWidth={1.2} />
      <path d={(() => { let d = ""; for (let x = cx - R_PER + 4; x < cx + R_PER; x += 8) d += `M${x} 795V804`; return d; })()} stroke={cream(0.35)} strokeWidth={1.2} />
      <rect x={cx - R_PER - 8} y={944} width={2 * R_PER + 16} height={22} fill={DOME_FILL} stroke={cream(0.5)} strokeWidth={1.4} />
      {/* attic drum */}
      <rect x={cx - R_ATT} y={722} width={2 * R_ATT} height={72} fill={DOME_FILL} stroke={cream(0.6)} strokeWidth={2.1} />
      <path d={pil} stroke={cream(0.42)} strokeWidth={1.1} />
      {wins}
      <Hatch id={hd} clip={rectD(cx + 120, 722, cx + R_ATT, 794)} box={[cx + 120, 722, cx + R_ATT, 794]} angle={90} gap={4} w={1} color={cream(0.18)} />
      {/* the stone gallery */}
      <rect x={cx - 328} y={700} width={656} height={22} fill={DOME_FILL} stroke={cream(0.7)} strokeWidth={2.4} />
      <path d={(() => { let d = ""; for (let x = cx - 322; x < cx + 324; x += 8) d += `M${x} 704V719`; return d; })()} stroke={cream(0.4)} strokeWidth={1.3} />
      {/* the dome: ribs, the shaded right flank, the outline */}
      <path d={domeD} fill={DOME_FILL} />
      <clipPath id={hs}>
        <path d={domeD} />
      </clipPath>
      <path d={shade} stroke={cream(0.2)} strokeWidth={1.2} fill="none" clipPath={`url(#${hs})`} />
      <clipPath id={hsL}>
        <path d={domeD} />
      </clipPath>
      <path d={shadeL} stroke={cream(0.14)} strokeWidth={1.1} fill="none" clipPath={`url(#${hsL})`} />
      <path d={ribs} stroke={cream(0.62)} strokeWidth={2.2} fill="none" />
      <path d={domeD} fill="none" stroke={cream(0.85)} strokeWidth={3.2} />
      {/* the lantern: curb, columned stage, cornice, small cupola, concave finial, ball and cross */}
      <rect x={cx - 54} y={356} width={108} height={16} fill={DOME_FILL} stroke={cream(0.8)} strokeWidth={2.4} />
      <path d={lanternBody} fill={DOME_FILL} stroke={cream(0.8)} strokeWidth={2.4} />
      <path d={`M${cx - 34} 264V356M${cx - 26} 264V356M${cx + 26} 264V356M${cx + 34} 264V356`} stroke={cream(0.6)} strokeWidth={1.4} />
      <path d={`M${cx - 11} 350V298A11 11 0 0 1 ${cx + 11} 298V350Z`} fill={GLASS} stroke={cream(0.6)} strokeWidth={1.2} />
      <rect x={cx + 8} y={264} width={32} height={92} fill="rgba(23,18,13,0.35)" />
      <rect x={cx - 50} y={250} width={100} height={13} fill={DOME_FILL} stroke={cream(0.8)} strokeWidth={2.3} />
      <path d={`M${cx - 36} 250A36 40 0 0 1 ${cx + 36} 250Z`} fill={DOME_FILL} stroke={cream(0.8)} strokeWidth={2.4} />
      <path d={`M${cx} 210V250M${cx + 18} 216Q${cx + 24} 232 ${cx + 26} 250`} stroke={cream(0.35)} strokeWidth={1.1} fill="none" />
      <path d={`M${cx - 12} 212Q${cx - 4} 176 ${cx - 6} 142L${cx + 6} 142Q${cx + 4} 176 ${cx + 12} 212Z`} fill={DOME_FILL} stroke={cream(0.8)} strokeWidth={2.1} />
      <circle cx={cx} cy={126} r={16} fill={DOME_FILL} stroke={cream(0.88)} strokeWidth={2.7} />
      <path d={`M${cx - 9} 120A10 10 0 0 1 ${cx - 2} 113`} stroke={cream(0.7)} strokeWidth={2.7} fill="none" />
      <path d={`M${cx - 4} ${CROSS_TOP}H${cx + 4}V54H${cx + 20}V63H${cx + 4}V110H${cx - 4}V63H${cx - 20}V54H${cx - 4}Z`} fill={cream(0.88)} stroke={DARK} strokeWidth={1.2} />
    </g>
  );
})();

// ---------------------------------------------------------------------------
// THE DISTANT CITY: roofs and chimneys in front of the drum, two church steeples (context, cream ~0.42)
// ---------------------------------------------------------------------------
const City: React.ReactElement = (() => {
  const out: React.ReactNode[] = [];
  // steeples (behind the roofs)
  const steeple = (x: number, top: number, key: string, tiers: number) => {
    const parts: React.ReactNode[] = [];
    let y = 1010;
    let w = 46;
    parts.push(<rect key={`${key}t`} x={x - w / 2} y={760} width={w} height={y - 760} fill={FAR} stroke={cream(0.42)} strokeWidth={1.4} />);
    parts.push(<path key={`${key}o`} d={`M${x - 7} 800V780A7 7 0 0 1 ${x + 7} 780V800ZM${x - 7} 880V860A7 7 0 0 1 ${x + 7} 860V880Z`} fill={GLASS} stroke={cream(0.35)} strokeWidth={1} />);
    y = 760;
    for (let i = 0; i < tiers; i++) {
      const h = 34 - i * 6;
      w = w * 0.78;
      parts.push(<rect key={`${key}${i}`} x={x - w / 2} y={y - h} width={w} height={h} fill={FAR} stroke={cream(0.42)} strokeWidth={1.3} />);
      parts.push(<path key={`${key}c${i}`} d={`M${x - w / 2 - 3} ${y}H${x + w / 2 + 3}`} stroke={cream(0.42)} strokeWidth={1.3} />);
      y -= h;
    }
    parts.push(<path key={`${key}s`} d={`M${x - w / 2} ${y}L${x} ${top}L${x + w / 2} ${y}Z`} fill={FAR} stroke={cream(0.42)} strokeWidth={1.3} />);
    return parts;
  };
  out.push(...steeple(92, 590, "sL", 4));
  out.push(...steeple(1008, 668, "sR", 2));
  // the roofs: a row of gables and parapets across the column, tops round y 900-985, down to y 1520
  let x = -260;
  let i = 0;
  while (x < 1340) {
    const w = 70 + random(`cw${i}`) * 80;
    const nearDrum = x + w > 110 && x < 970;
    const top = nearDrum ? 908 + random(`ct${i}`) * 34 : 930 + random(`ct${i}`) * 60;
    const gable = random(`cg${i}`) > 0.45;
    const peak = top - (gable ? 26 + random(`cp${i}`) * 22 : 0);
    const d = gable ? `M${r2(x)} ${r2(top)}L${r2(x + w / 2)} ${r2(peak)}L${r2(x + w)} ${r2(top)}V1520H${r2(x)}Z` : `M${r2(x)} ${r2(top)}H${r2(x + w)}V1520H${r2(x)}Z`;
    out.push(<path key={`r${i}`} d={d} fill={FAR} />);
    out.push(<path key={`re${i}`} d={gable ? `M${r2(x)} ${r2(top)}L${r2(x + w / 2)} ${r2(peak)}L${r2(x + w)} ${r2(top)}` : `M${r2(x)} ${r2(top)}H${r2(x + w)}`} fill="none" stroke={cream(0.4)} strokeWidth={1.3} />);
    if (!gable) out.push(<path key={`p${i}`} d={`M${r2(x - 2)} ${r2(top + 6)}H${r2(x + w + 2)}`} stroke={cream(0.3)} strokeWidth={1.1} />);
    // chimney stacks with pots
    const nCh = random(`cn${i}`) > 0.35 ? 1 : 0;
    for (let c = 0; c < nCh; c++) {
      const chx = x + w * (0.2 + random(`cx${i}`) * 0.55);
      const cht = (gable ? (peak + top) / 2 : top) - 26 - random(`ch${i}`) * 18;
      out.push(<rect key={`c${i}`} x={r2(chx - 9)} y={r2(cht)} width={18} height={r2(top + 10 - cht)} fill={FAR} stroke={cream(0.4)} strokeWidth={1.2} />);
      out.push(<rect key={`cp${i}`} x={r2(chx - 6)} y={r2(cht - 8)} width={5} height={8} fill={FAR} stroke={cream(0.35)} strokeWidth={1} />);
      out.push(<rect key={`cq${i}`} x={r2(chx + 1)} y={r2(cht - 10)} width={5} height={10} fill={FAR} stroke={cream(0.35)} strokeWidth={1} />);
    }
    // a few small dark windows
    for (let wj = 0; wj < 2; wj++) {
      if (random(`cwin${i}${wj}`) < 0.5) continue;
      const wx = x + 12 + random(`cwx${i}${wj}`) * (w - 30);
      const wy = top + 22 + wj * 40;
      out.push(<rect key={`w${i}${wj}`} x={r2(wx)} y={r2(wy)} width={9} height={14} fill={GLASS} stroke={cream(0.28)} strokeWidth={0.9} />);
    }
    x += w;
    i++;
  }
  return <g>{out}</g>;
})();

// ---------------------------------------------------------------------------
// THE NEIGHBOURS (context): plain dark fronts either side, sash windows, cream ~0.42
// ---------------------------------------------------------------------------
const Neighbours: React.ReactElement = (() => {
  const a = 0.34;
  const L = { x0: -280, x1: HOUSE.x0, top: 1440 };
  const R = { x0: HOUSE.x1, x1: 1360, top: 1300 };
  const win = (x0: number, y0: number, w: number, h: number, key: string) => (
    <g key={key}>
      <Panes x0={x0} y0={y0} x1={x0 + w} y1={y0 + h} cols={3} rows={4} a={a} bar={2.4} />
      <rect x={x0 - 8} y={y0 + h} width={w + 16} height={9} fill={NEIGH} stroke={cream(a)} strokeWidth={1.3} />
    </g>
  );
  return (
    <g>
      {/* left: a lower old house, its parapet and coping */}
      <rect x={L.x0} y={L.top} width={L.x1 - L.x0} height={FOOT - L.top} fill={NEIGH} stroke={cream(a)} strokeWidth={2.1} />
      <rect x={L.x0} y={L.top - 14} width={L.x1 - L.x0 + 4} height={14} fill={NEIGH} stroke={cream(a)} strokeWidth={1.4} />
      <rect x={60} y={L.top - 70} width={44} height={58} fill={NEIGH} stroke={cream(a)} strokeWidth={1.4} />
      {win(-150, 1520, 110, 170, "l1")}
      {win(50, 1520, 110, 170, "l2")}
      {win(-150, 1790, 110, 200, "l3")}
      {win(50, 1790, 110, 200, "l4")}
      <rect x={L.x0} y={2120} width={L.x1 - L.x0} height={14} fill={NEIGH} stroke={cream(a)} strokeWidth={1.2} />
      <Panes x0={-120} y0={2180} x1={140} y1={2330} cols={6} rows={4} a={a} bar={2.2} />
      {/* right: a taller brick house with a parapet */}
      <rect x={R.x0} y={R.top} width={R.x1 - R.x0} height={FOOT - R.top} fill={NEIGH} stroke={cream(a)} strokeWidth={2.1} />
      <rect x={R.x0 - 4} y={R.top - 16} width={R.x1 - R.x0 + 4} height={16} fill={NEIGH} stroke={cream(a)} strokeWidth={1.4} />
      <rect x={1150} y={R.top - 96} width={56} height={82} fill={NEIGH} stroke={cream(a)} strokeWidth={1.4} />
      {win(905, 1380, 110, 190, "r1")}
      {win(1090, 1380, 110, 190, "r2")}
      {win(905, 1700, 110, 240, "r3")}
      {win(1090, 1700, 110, 240, "r4")}
      <path d={`M920 ${FOOT}V2250A50 50 0 0 1 1020 2250V${FOOT}Z`} fill={TIMBER} stroke={cream(a)} strokeWidth={1.5} />
      {/* the shadow the leaning house throws on its right neighbour */}
      <path d={`M${HOUSE.x1} ${FOOT}L${HOUSE.x1 + 24} ${FOOT}L${HOUSE.x1 + 40} ${ROOF.eaves}L${HOUSE.x1 + 18} ${ROOF.eaves}Z`} fill="rgba(16,12,8,0.45)" />
    </g>
  );
})();

// ---------------------------------------------------------------------------
// THE HOUSE (subject, cream ~0.9): drawn upright, leaned by one skew about its foot
// ---------------------------------------------------------------------------
const W1 = { x0: WIN.x0 + 12, x1: WIN.x1 - 12, y0: WIN.y0 + 12, y1: WIN.y1 - 6 }; // the opening inside the casing
const SASH_H = (W1.y1 - W1.y0) / 2 + 4;
const HouseStatic: React.ReactElement = (() => {
  const a = SUB;
  const x0 = HOUSE.x0;
  const x1 = HOUSE.x1;
  const roofD = `M${x0 - 10} ${ROOF.eaves}L${x1 + 10} ${ROOF.eaves}L${x1 - 14} ${ROOF.ridge}L${x0 + 14} ${ROOF.ridge}Z`;
  let tiles = "";
  // tile courses at uneven spacing (an even grid strobes under the fast tilt)
  for (let y = ROOF.ridge + 12, j = 0; y < ROOF.eaves - 4; j++) {
    const hgt = 12 + random(`tc${j}`) * 8;
    tiles += `M${x0} ${r2(y)}H${x1}`;
    for (let x = x0 + random(`tx${j}`) * 26; x < x1; x += 22 + random(`tw${j}-${x}`) * 12) tiles += `M${r2(x)} ${r2(y)}V${r2(y + hgt)}`;
    y += hgt;
  }
  const chim = (cx: number, top: number, key: string) => (
    <g key={key}>
      <rect x={cx - 34} y={top} width={68} height={ROOF.ridge + 30 - top} fill={PLANE} stroke={cream(a)} strokeWidth={2.7} />
      <rect x={cx - 39} y={top} width={78} height={12} fill={PLANE} stroke={cream(a)} strokeWidth={2.4} />
      <Hatch id={hid()} clip={rectD(cx + 6, top + 12, cx + 34, ROOF.ridge + 30)} box={[cx, top, cx + 34, ROOF.ridge + 30]} angle={90} gap={4} w={1.1} color={cream(0.25)} />
      {[-18, 0, 18].map((o, i) => (
        <path key={i} d={`M${cx + o - 7} ${top}V${top - 24 - i * 3}H${cx + o + 7}V${top}Z`} fill={PLANE} stroke={cream(a * 0.85)} strokeWidth={1.5} />
      ))}
    </g>
  );
  const post = (x: number, y0: number, y1: number, key: string) => <rect key={key} x={x} y={y0} width={18} height={y1 - y0} fill={TIMBER} stroke={cream(a * 0.75)} strokeWidth={2.1} />;
  const beam = (y: number, h: number, key: string, ext = 8) => <rect key={key} x={x0 - ext} y={y} width={x1 - x0 + 2 * ext} height={h} fill={TIMBER} stroke={cream(a * 0.85)} strokeWidth={2.4} />;
  const brace = (ax: number, ay: number, bx: number, by: number, key: string) => (
    <g key={key}>
      <path d={`M${ax} ${ay}L${bx} ${by}`} stroke={cream(a * 0.7)} strokeWidth={15} strokeLinecap="butt" />
      <path d={`M${ax} ${ay}L${bx} ${by}`} stroke={TIMBER} strokeWidth={12} strokeLinecap="butt" />
    </g>
  );
  // the 2nd-floor window
  const w2 = { x0: 448, x1: 632, y0: 1362, y1: 1572 };
  // shop front
  const door = { x0: 272, x1: 382, y0: 2214, y1: FOOT };
  const shop = { x0: 432, x1: 650, y0: 2182, y1: 2300 };
  let bricks = "";
  for (let j = 0; j < 9; j++) {
    const y = FASCIA.bottom + 18 + j * 15;
    for (let i = 0; i < 4; i++) {
      const x = 668 + ((i * 41 + (j % 2) * 20) % 170);
      if (random(`b${i}${j}`) < 0.45) bricks += `M${x} ${y}h26`;
    }
    if (j < 6 && random(`bl${j}`) < 0.7) bricks += `M${x0 + 4} ${y}h18`;
  }
  return (
    <g>
      {chim(282, 1044, "cL")}
      {chim(800, 1028, "cR")}
      {/* the roof: tile courses, a dormer */}
      <path d={roofD} fill={PLANE} stroke={cream(a)} strokeWidth={2.9} />
      <clipPath id="dl-roof">
        <path d={roofD} />
      </clipPath>
      <path d={tiles} stroke={cream(0.28)} strokeWidth={1.1} clipPath="url(#dl-roof)" fill="none" />
      <path d={`M466 1296V1196L540 1146L614 1196V1296Z`} fill={PLANE} stroke={cream(a)} strokeWidth={2.7} />
      <path d={`M456 1200L540 1140L624 1200`} stroke={cream(a)} strokeWidth={3} fill="none" />
      <Panes x0={492} y0={1206} x1={588} y1={1286} cols={2} rows={2} a={a} />
      {/* eaves cornice with dentils */}
      <rect x={x0 - 14} y={ROOF.eaves} width={x1 - x0 + 28} height={18} fill={PLANE} stroke={cream(a)} strokeWidth={2.7} />
      <path d={(() => { let d = ""; for (let x = x0 - 8; x < x1 + 10; x += 12) d += `M${x} ${ROOF.eaves + 10}v8`; return d; })()} stroke={cream(0.5)} strokeWidth={2.7} />
      {/* SECOND FLOOR: timber frame, plaster panels in dark umber, a sash window */}
      <rect x={x0 - 8} y={FLOOR2.top} width={x1 - x0 + 16} height={FLOOR2.bottom - FLOOR2.top} fill={PLANE} stroke={cream(a)} strokeWidth={2.7} />
      {post(x0 - 8, FLOOR2.top, FLOOR2.bottom, "p2a")}
      {post(x1 - 10, FLOOR2.top, FLOOR2.bottom, "p2b")}
      {brace(x0 + 14, FLOOR2.bottom - 16, 420, FLOOR2.top + 20, "b2a")}
      {brace(x1 - 14, FLOOR2.bottom - 16, 660, FLOOR2.top + 20, "b2b")}
      {post(430, FLOOR2.top, FLOOR2.bottom, "p2c")}
      {post(638, FLOOR2.top, FLOOR2.bottom, "p2d")}
      <rect x={w2.x0 - 10} y={w2.y0 - 10} width={w2.x1 - w2.x0 + 20} height={w2.y1 - w2.y0 + 14} fill={TIMBER} stroke={cream(a)} strokeWidth={2.7} />
      <Panes x0={w2.x0} y0={w2.y0} x1={w2.x1} y1={(w2.y0 + w2.y1) / 2} cols={3} rows={2} a={a} />
      <Panes x0={w2.x0} y0={(w2.y0 + w2.y1) / 2} x1={w2.x1} y1={w2.y1} cols={3} rows={2} a={a} />
      <rect x={w2.x0 - 18} y={w2.y1 + 4} width={w2.x1 - w2.x0 + 36} height={12} fill={PLANE} stroke={cream(a)} strokeWidth={2.4} />
      {/* the jetty: a bressumer beam, the shadow under its overhang */}
      {beam(FLOOR2.bottom - 8, 16, "j2", 12)}
      <rect x={x0 - 4} y={FLOOR2.bottom + 8} width={x1 - x0 + 8} height={20} fill="rgba(12,9,6,0.55)" />
      {/* FIRST FLOOR (THE window) */}
      <rect x={x0 - 4} y={FLOOR1.top + 8} width={x1 - x0 + 8} height={FLOOR1.bottom - FLOOR1.top - 8} fill={PLANE} stroke={cream(a)} strokeWidth={2.7} />
      <rect x={x0 - 4} y={FLOOR1.top + 8} width={x1 - x0 + 8} height={20} fill="rgba(12,9,6,0.5)" />
      {post(x0 - 4, FLOOR1.top + 8, FLOOR1.bottom, "p1a")}
      {post(x1 - 14, FLOOR1.top + 8, FLOOR1.bottom, "p1b")}
      {post(296, FLOOR1.top + 8, FLOOR1.bottom, "p1c")}
      {post(652, FLOOR1.top + 8, FLOOR1.bottom, "p1d")}
      {brace(x0 + 12, FLOOR1.top + 40, 294, FLOOR1.bottom - 20, "b1a")}
      {brace(672, FLOOR1.bottom - 20, 822, FLOOR1.top + 40, "b1b")}
      {brace(672, FLOOR1.top + 40, 822, FLOOR1.bottom - 20, "b1c")}
      <rect x={670} y={1866} width={152} height={12} fill={TIMBER} stroke={cream(a * 0.7)} strokeWidth={1.4} />
      {/* the window casing and its head; the opening is drawn live (the sash moves) */}
      <rect x={WIN.x0 - 8} y={WIN.y0 - 16} width={WIN.x1 - WIN.x0 + 16} height={16} fill={PLANE} stroke={cream(a)} strokeWidth={2.7} />
      <path d={`M${(WIN.x0 + WIN.x1) / 2 - 12} ${WIN.y0 - 18}L${(WIN.x0 + WIN.x1) / 2 + 12} ${WIN.y0 - 18}L${(WIN.x0 + WIN.x1) / 2 + 8} ${WIN.y0}L${(WIN.x0 + WIN.x1) / 2 - 8} ${WIN.y0}Z`} fill={PLANE} stroke={cream(a)} strokeWidth={2.1} />
      {/* fascia over the shop */}
      <rect x={x0 - 6} y={FASCIA.top} width={x1 - x0 + 12} height={FASCIA.bottom - FASCIA.top} fill={TIMBER} stroke={cream(a)} strokeWidth={2.7} />
      <path d={`M${x0} ${FASCIA.top + 9}H${x1}`} stroke={cream(0.45)} strokeWidth={1.2} />
      {/* GROUND FLOOR: brick, a panelled door under a fanlight, a small-paned shop window, a stall board */}
      <rect x={x0} y={FASCIA.bottom} width={x1 - x0} height={FOOT - FASCIA.bottom} fill={PLANE} stroke={cream(a)} strokeWidth={2.7} />
      <path d={bricks} stroke={cream(0.22)} strokeWidth={1.4} />
      <path d={`M${door.x0 - 10} ${door.y1}V${door.y0}A${(door.x1 - door.x0) / 2 + 10} ${(door.x1 - door.x0) / 2 + 10} 0 0 1 ${door.x1 + 10} ${door.y0}V${door.y1}Z`} fill={TIMBER} stroke={cream(a)} strokeWidth={2.7} />
      <path d={`M${door.x0} ${door.y0}A${(door.x1 - door.x0) / 2} ${(door.x1 - door.x0) / 2} 0 0 1 ${door.x1} ${door.y0}Z`} fill={GLASS} stroke={cream(a * 0.8)} strokeWidth={1.4} />
      <path d={(() => { const c = (door.x0 + door.x1) / 2; const rr = (door.x1 - door.x0) / 2; let d = ""; for (let k = 1; k < 5; k++) { const t = (k / 5) * Math.PI; d += `M${c} ${door.y0}L${r2(c - rr * Math.cos(t))} ${r2(door.y0 - rr * Math.sin(t))}`; } return d; })()} stroke={cream(0.55)} strokeWidth={1.3} />
      <rect x={door.x0} y={door.y0} width={door.x1 - door.x0} height={door.y1 - door.y0} fill={TIMBER} stroke={cream(a)} strokeWidth={2.4} />
      {[0, 1, 2].map((j) => [0, 1].map((i) => <rect key={`dp${i}${j}`} x={door.x0 + 12 + i * 46} y={door.y0 + 12 + j * 56} width={40} height={48} fill="none" stroke={cream(0.5)} strokeWidth={1.3} />))}
      <circle cx={door.x1 - 14} cy={door.y0 + 100} r={4} fill={cream(0.7)} />
      <rect x={shop.x0 - 10} y={shop.y0 - 10} width={shop.x1 - shop.x0 + 20} height={FOOT - shop.y0 + 10} fill={TIMBER} stroke={cream(a)} strokeWidth={2.7} />
      <Panes x0={shop.x0} y0={shop.y0} x1={shop.x1} y1={shop.y1} cols={5} rows={4} a={a} bar={2.6} />
      <rect x={shop.x0} y={shop.y1 + 10} width={shop.x1 - shop.x0} height={FOOT - shop.y1 - 22} fill="none" stroke={cream(0.5)} strokeWidth={1.4} />
      <rect x={shop.x0 + 10} y={shop.y1 + 22} width={(shop.x1 - shop.x0) / 2 - 16} height={FOOT - shop.y1 - 46} fill="none" stroke={cream(0.35)} strokeWidth={1.1} />
      <rect x={(shop.x0 + shop.x1) / 2 + 6} y={shop.y1 + 22} width={(shop.x1 - shop.x0) / 2 - 16} height={FOOT - shop.y1 - 46} fill="none" stroke={cream(0.35)} strokeWidth={1.1} />
      {/* the shaded right flank of each storey (light from the upper left) */}
      <Hatch id={hid()} clip={rectD(x1 - 4, FLOOR2.top, x1 + 8, FOOT)} box={[x1 - 10, FLOOR2.top, x1 + 10, FOOT]} angle={90} gap={3} w={1} color={cream(0.3)} />
      {/* contact shadow at the foot */}
      <rect x={-300} y={FOOT - 2} width={1700} height={12} fill="rgba(12,9,6,0.6)" />
    </g>
  );
})();

/** the iron sign bracket over the door and its hanging board (sways a hair) */
const Sign: React.FC<{ frame: number }> = ({ frame }) => {
  const sw = 1.6 * Math.sin(frame / 17);
  const hx = 150;
  const hy = 2150;
  return (
    <g>
      <path d={`M${HOUSE.x0} 2134H96M${HOUSE.x0} 2134Q${HOUSE.x0 - 20} 2184 ${HOUSE.x0 - 60} 2170Q${HOUSE.x0 - 90} 2160 ${HOUSE.x0 - 100} 2140`} stroke={DARK} strokeWidth={8} fill="none" />
      <path d={`M${HOUSE.x0} 2134H96M${HOUSE.x0} 2134Q${HOUSE.x0 - 20} 2184 ${HOUSE.x0 - 60} 2170Q${HOUSE.x0 - 90} 2160 ${HOUSE.x0 - 100} 2140`} stroke={cream(0.8)} strokeWidth={3} fill="none" />
      <g transform={`rotate(${sw.toFixed(3)} ${hx} ${hy - 16})`}>
        <path d={`M112 2134V2156M188 2134V2150`} stroke={cream(0.7)} strokeWidth={2.7} />
        <path d={`M104 2156L196 2150L196 2286L104 2296Z`} fill={TIMBER} stroke={cream(0.85)} strokeWidth={2.7} />
        <path d={`M114 2166L186 2161L186 2276L114 2284Z`} fill="none" stroke={cream(0.5)} strokeWidth={1.3} />
        <ellipse cx={150} cy={2223} rx={22} ry={36} fill="none" stroke={cream(0.55)} strokeWidth={2.1} />
      </g>
    </g>
  );
};

/** the first-floor window, live: the lower sash thrown up behind the upper sash, the dark room below it */
const TheWindow: React.FC<{ frame: number }> = ({ frame }) => {
  const a = SUB;
  const rise = (SASH_H - 8) * easeOut(lin(frame, T.sashUp[0], T.sashUp[1]));
  const ly0 = W1.y1 - SASH_H - rise;
  return (
    <g>
      <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} fill={TIMBER} stroke={cream(a)} strokeWidth={2.9} />
      <rect x={W1.x0} y={W1.y0} width={W1.x1 - W1.x0} height={W1.y1 - W1.y0} fill={ROOM} />
      {/* lower sash (inner) */}
      <rect x={W1.x0} y={ly0} width={W1.x1 - W1.x0} height={SASH_H} fill={TIMBER} stroke={cream(a)} strokeWidth={2.1} />
      <Panes x0={W1.x0 + 8} y0={ly0 + 8} x1={W1.x1 - 8} y1={ly0 + SASH_H - 10} cols={3} rows={2} a={a} />
      {/* upper sash (outer, fixed) */}
      <rect x={W1.x0} y={W1.y0} width={W1.x1 - W1.x0} height={SASH_H} fill={TIMBER} stroke={cream(a)} strokeWidth={2.1} />
      <Panes x0={W1.x0 + 8} y0={W1.y0 + 8} x1={W1.x1 - 8} y1={W1.y0 + SASH_H - 6} cols={3} rows={2} a={a} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STREET: cobbles in perspective (the far edge at the wall), the kennel with its sludge, the refuse heap
// ---------------------------------------------------------------------------
const rowH = (y: number) => 9 + 0.08 * (y - FOOT);
const Street: React.ReactElement = (() => {
  const cobbles: string[] = [];
  const lights: string[] = [];
  const rows: { y: number; h: number }[] = [];
  let y = FOOT + 6;
  while (y < 3800) {
    const h = rowH(y);
    if (y + h > KENNEL.y0 + 4 && y < KENNEL.y1) {
      y = KENNEL.y1;
      continue;
    }
    rows.push({ y, h });
    y += h;
  }
  rows.forEach(({ y: ry, h }, j) => {
    const w = 1.6 * h;
    let x = -300 - (j % 2) * w * 0.5 - random(`ro${j}`) * w * 0.4;
    let d = "";
    let l = "";
    let i = 0;
    while (x < 1400) {
      const ww = w * (0.65 + random(`cw${j}-${i}`) * 0.7);
      const g = h * 0.16;
      const x0 = x + g;
      const x1 = x + ww - g;
      const jy = (random(`cj${j}-${i}`) - 0.5) * h * 0.18;
      const y0 = ry + g * (0.6 + random(`ct${j}-${i}`) * 0.6) + jy;
      const y1 = ry + h - g * (0.4 + random(`cb${j}-${i}`) * 0.5) + jy;
      const rxx = Math.min((x1 - x0) / 2, h * 0.45);
      const ryy = (y1 - y0) / 2;
      d += `M${r2(x0 + rxx)} ${r2(y0)}H${r2(x1 - rxx)}A${r2(rxx)} ${r2(ryy)} 0 0 1 ${r2(x1 - rxx)} ${r2(y1)}H${r2(x0 + rxx)}A${r2(rxx)} ${r2(ryy)} 0 0 1 ${r2(x0 + rxx)} ${r2(y0)}Z`;
      if (random(`cl${j}-${i}`) < 0.55) l += `M${r2(x0 + rxx * 0.35)} ${r2(y0 + ryy * 0.9)}Q${r2(x0 + rxx * 0.4)} ${r2(y0 + ryy * 0.15)} ${r2(x0 + rxx * 1.3)} ${r2(y0 + ryy * 0.12)}`;
      x += ww;
      i++;
    }
    cobbles.push(d);
    lights.push(l);
  });
  const alphaFor = (ry: number) => (ry < KENNEL.y1 + 160 ? 0.42 : ry < 2950 ? 0.3 : 0.2);
  const K = KENNEL;
  // the channel's brimming surface: its edges wander a little over the setts
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
      {/* muck in every joint */}
      <rect x={-320} y={FOOT} width={1740} height={1400} fill="#1E1711" />
      {rows.map((r, j) => (
        <g key={j}>
          <path d={cobbles[j]} fill={STONE} stroke={cream(alphaFor(r.y))} strokeWidth={1.6} />
          <path d={lights[j]} stroke={cream(alphaFor(r.y) * 0.9)} strokeWidth={1.4} fill="none" />
        </g>
      ))}
      {/* THE KENNEL: the far setts, the channel brimming with sludge, the near setts */}
      <path d={`M-320 ${K.y0}H1420V${K.y0 + 16}H-320Z`} fill="#2A2118" stroke={cream(0.55)} strokeWidth={1.8} />
      <path d={surfD} fill={SLUDGE} stroke={DARK} strokeWidth={2.4} />
      <path d={`M-320 ${K.y0 + 22}H1420`} stroke="rgba(10,8,5,0.7)" strokeWidth={6} />
      <path d={sheen} stroke={cream(0.22)} strokeWidth={1.6} fill="none" />
      <path d={`M-320 ${K.y1 - 8}H1420V${K.y1}H-320Z`} fill="#2A2118" stroke={cream(0.5)} strokeWidth={1.6} />
    </g>
  );
})();

/** the old sludge in the kennel, alive: ripples, lumps, straw and bubbles drifting downhill (to the right) */
const Sludge: React.FC<{ frame: number }> = ({ frame }) => {
  const K = KENNEL;
  const span = 1760;
  const drift = (i: number, sp = 0.9) => ((random(`sx${i}`) * span + frame * sp) % span) - 330;
  const yIn = (i: number, m = 0) => K.y0 + 30 + m + random(`sy${i}`) * (K.y1 - K.y0 - 48 - 2 * m);
  let rip = "";
  for (let i = 0; i < 60; i++) {
    const x = drift(i, 0.8 + random(`sv${i}`) * 0.5);
    const w = 16 + random(`sw${i}`) * 30;
    rip += `M${r2(x)} ${r2(yIn(i))}q${r2(w / 2)} -3 ${r2(w)} 0`;
  }
  const lumps: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const x = drift(100 + i, 0.85);
    const yy = yIn(100 + i, 6);
    const r = 9 + random(`lr${i}`) * 10;
    lumps.push(
      <g key={i}>
        <path d={blobD(clotRing(x, yy, r, 1, 0, `lp${i}`))} fill="#3A2D20" stroke={DARK} strokeWidth={1.8} />
        <path d={`M${r2(x - r * 0.9)} ${r2(yy - r * 0.2)}q${r2(r * 0.6)} ${r2(-r * 0.55)} ${r2(r * 1.2)} ${r2(-r * 0.3)}`} stroke={cream(0.45)} strokeWidth={1.4} fill="none" />
      </g>,
    );
  }
  let bits = "";
  for (let i = 0; i < 16; i++) {
    const x = drift(200 + i, 0.9);
    const yy = yIn(200 + i);
    bits += random(`bk${i}`) < 0.6 ? `M${r2(x)} ${r2(yy)}l22 -4M${r2(x + 4)} ${r2(yy + 5)}l18 2` : `M${r2(x)} ${r2(yy)}q7 -8 14 0`;
  }
  // bubbles: each swells over 10 frames, then pops into a little ring
  const bub: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const per = 26 + Math.floor(random(`bp${i}`) * 14);
    const off = Math.floor(random(`bo${i}`) * per);
    const ph = (frame + off) % per;
    const cyc = Math.floor((frame + off) / per);
    const x = -100 + random(`bx${i}-${cyc}`) * 1300;
    const yy = yIn(300 + i, 8);
    if (ph < 10) bub.push(<circle key={i} cx={r2(x)} cy={r2(yy)} r={r2(2 + ph * 0.7)} fill="#2E2318" stroke={cream(0.5)} strokeWidth={1.2} />);
    else if (ph < 13) bub.push(<ellipse key={i} cx={r2(x)} cy={r2(yy)} rx={r2(9 + (ph - 10) * 5)} ry={r2(3 + (ph - 10) * 1.5)} fill="none" stroke={cream(0.4)} strokeWidth={1.2} />);
  }
  return (
    <g>
      <path d={rip} stroke={DEAD} strokeOpacity={0.6} strokeWidth={1.7} fill="none" />
      {lumps}
      <path d={bits} stroke={cream(0.55)} strokeWidth={1.9} fill="none" />
      {bub}
    </g>
  );
};

/** filth on the near stones (it climbs into view as the camera tilts down): dung, puddles with floating bits, straw,
 *  leaves, a broken crock. The legible pieces sit below the caption bands at the end; the bands hold only puddles and
 *  straw as context. */
const DUNG = [
  { x: 380, y: 2975, s: 1.6 },
  { x: 860, y: 3060, s: 1.35 },
  { x: 905, y: 2785, s: 0.75 },
  { x: 300, y: 2780, s: 0.7 },
];
const DUNG_BALLS = [
  [-34, 0, 20],
  [-6, 4, 24],
  [24, 0, 20],
  [-20, -22, 18],
  [10, -20, 19],
  [-4, -40, 15],
  [40, 10, 13],
];
const Dung: React.FC<{ x: number; y: number; s: number; k: string }> = ({ x, y, s: sc, k }) => (
  <g transform={`translate(${x} ${y}) scale(${sc})`}>
    <ellipse cx={0} cy={14} rx={64} ry={12} fill="rgba(10,8,5,0.6)" />
    {DUNG_BALLS.map(([bx, by, r], i) => (
      <g key={i}>
        <path d={blobD(clotRing(bx, by, r * 0.9, 1, 0.1, `${k}${i}`))} fill="#5C4934" stroke={DARK} strokeWidth={2.6} />
        <path d={`M${bx - r * 0.6} ${by - r * 0.2}q${r * 0.4} ${-r * 0.5} ${r * 0.9} ${-r * 0.35}`} stroke={cream(0.75)} strokeWidth={2.2} fill="none" />
      </g>
    ))}
    <path d="M-50 8l-22 6M44 4l24 -8M-10 -46l-6 -14" stroke={cream(0.55)} strokeWidth={1.8} />
  </g>
);
const PUDDLES = [
  { x: 640, y: 2920, rx: 130, ry: 30 },
  { x: 300, y: 2668, rx: 90, ry: 18, ctx: true },
  { x: 640, y: 2775, rx: 70, ry: 15 },
  { x: 180, y: 3120, rx: 120, ry: 32 },
];
const Filth: React.FC<{ frame: number }> = ({ frame }) => {
  const out: React.ReactNode[] = [];
  PUDDLES.forEach((q, i) => {
    const ring: [number, number][] = [];
    for (let j = 0; j < 10; j++) {
      const a = (j / 10) * Math.PI * 2;
      const rr = 0.8 + 0.35 * random(`pd${i}-${j}`);
      ring.push([q.x + Math.cos(a) * q.rx * rr, q.y + Math.sin(a) * q.ry * rr]);
    }
    // brown water: engraved with level lines, a bright glint where it catches the light
    const pid = `dl-pud${i}`;
    out.push(
      <g key={`p${i}`}>
        <clipPath id={pid}>
          <path d={blobD(ring)} />
        </clipPath>
        <path d={blobD(ring)} fill="#3A2E21" stroke={DARK} strokeWidth={2.6} />
        <path d={hatchD(q.x - q.rx * 1.3, q.y - q.ry * 1.3, q.x + q.rx * 1.3, q.y + q.ry * 1.3, 0, 5)} stroke={cream(0.22)} strokeWidth={1.3} clipPath={`url(#${pid})`} />
        <path d={`M${q.x - q.rx * 0.55} ${q.y - q.ry * 0.35}h${q.rx * 0.55}M${q.x - q.rx * 0.25} ${q.y + q.ry * 0.05}h${q.rx * 0.32}`} stroke={cream(0.7)} strokeWidth={2.4} strokeLinecap="round" />
      </g>,
    );
    // floating bits turning slowly in the puddle
    for (let b = 0; b < ((q as { ctx?: boolean }).ctx ? 0 : 3); b++) {
      const a = frame * 0.02 * (b % 2 ? 1 : -1) + b * 2.1 + i;
      const bx = q.x + Math.cos(a) * q.rx * 0.45;
      const by = q.y + Math.sin(a) * q.ry * 0.4;
        out.push(<path key={`pb${i}${b}`} d={b === 0 ? `M${r2(bx - 14)} ${r2(by)}q14 -12 28 0q-14 10 -28 0Z` : `M${r2(bx - 12)} ${r2(by)}l24 -4`} fill={b === 0 ? "#5C4934" : "none"} stroke={cream(0.7)} strokeWidth={2} />);
    }
  });
  DUNG.forEach((q, i) => out.push(<Dung key={`d${i}`} x={q.x} y={q.y} s={q.s} k={`dg${i}`} />));
  // straw strewn about, a broken crock, a cabbage leaf
  let straw = "";
  for (let i = 0; i < 40; i++) {
    const x = -200 + random(`stx${i}`) * 1400;
    const y = KENNEL.y1 + 20 + random(`sty${i}`) * 800;
    const sc = 0.7 + (y - KENNEL.y1) / 600;
    const a = random(`sta${i}`) * Math.PI;
    straw += `M${r2(x)} ${r2(y)}l${r2(Math.cos(a) * 26 * sc)} ${r2(Math.sin(a) * 8 * sc)}`;
  }
  out.push(<path key="straw" d={straw} stroke={cream(0.5)} strokeWidth={2} />);
  out.push(
    <g key="crock" transform="translate(560 2900) rotate(-12)">
      <path d="M-30 0a34 26 0 0 1 60 -10l-10 8l-8 -6l-8 10l-10 -6l-10 8Z" fill="#3A2F23" stroke={cream(0.7)} strokeWidth={2} />
    </g>,
  );
  out.push(
    <g key="leaf" transform="translate(860 2930) rotate(18)">
      <path d="M-30 0q30 -30 60 0q-30 24 -60 0Z" fill="#3A2F23" stroke={cream(0.65)} strokeWidth={1.8} />
      <path d="M-28 0h54M-6 0l10 -10M8 0l10 8" stroke={cream(0.45)} strokeWidth={1.3} />
    </g>,
  );
  return <g>{out}</g>;
};

/** the refuse heap against the wall: low and lumpy (a sack, rags, a broken basket, cabbage leaves, a fish skeleton,
 *  straw), no straight edge anywhere */
const HEAP_RING: [number, number][] = (() => {
  const { x0, x1, base, cx } = HEAP;
  const rx = (x1 - x0) / 2;
  const out: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const a = Math.PI + (i / 15) * Math.PI; // the upper half, left to right
    const bump = 1 + 0.22 * Math.sin(i * 2.3 + 0.4) + 0.12 * random(`hp${i}`);
    out.push([cx + Math.cos(a) * rx * (0.96 + 0.08 * random(`hq${i}`)), base - 4 + Math.sin(a) * 62 * bump]);
  }
  out.push([x1 - 6, base + 6], [cx + 30, base + 10], [cx - 40, base + 9], [x0 + 6, base + 6]);
  return out;
})();
const Heap: React.ReactElement = (() => {
  const { x0, base, cx } = HEAP;
  const d = blobD(HEAP_RING);
  const hh = hid();
  const sack = blobD(clotRing(cx - 52, base - 40, 30, 1, -0.15, "sack"));
  const basket = `M${cx + 18} ${base - 14}Q${cx + 22} ${base - 66} ${cx + 62} ${base - 70}L${cx + 70} ${base - 58}L${cx + 80} ${base - 72}L${cx + 92} ${base - 60}Q${cx + 100} ${base - 30} ${cx + 92} ${base - 10}Q${cx + 56} ${base + 2} ${cx + 18} ${base - 14}Z`;
  const bk = hid();
  return (
    <g>
      <path d={d} fill="#2B2219" stroke={cream(0.7)} strokeWidth={2.2} />
      <Hatch id={hh} clip={d} box={[cx - 10, base - 90, HEAP.x1, base + 10]} angle={-55} gap={4.5} w={1.1} color={cream(0.24)} />
      {/* a broken wicker basket on its side */}
      <path d={basket} fill="#3A2F23" stroke={cream(0.75)} strokeWidth={2} />
      <clipPath id={bk}>
        <path d={basket} />
      </clipPath>
      <g clipPath={`url(#${bk})`}>
        <path d={hatchD(cx + 10, base - 80, cx + 110, base + 10, 35, 7)} stroke={cream(0.4)} strokeWidth={1.4} />
        <path d={hatchD(cx + 10, base - 80, cx + 110, base + 10, -35, 7)} stroke={cream(0.4)} strokeWidth={1.4} />
      </g>
      {/* a tied sack */}
      <path d={sack} fill="#4A3D2E" stroke={cream(0.75)} strokeWidth={2} />
      <path d={`M${cx - 60} ${base - 72}q8 -10 16 0q-8 6 -16 0Z`} fill="#4A3D2E" stroke={cream(0.75)} strokeWidth={1.8} />
      <path d={`M${cx - 76} ${base - 44}q22 10 46 -2M${cx - 64} ${base - 22}q14 6 30 -2`} stroke={cream(0.45)} strokeWidth={1.4} fill="none" />
      {/* rags draped over the middle */}
      <path d={`M${cx - 30} ${base - 56}q14 -16 30 -8q12 -10 26 0q6 14 -4 24q-14 8 -24 2q-14 8 -28 -2q-8 -8 0 -16Z`} fill="#5A4A36" stroke={cream(0.7)} strokeWidth={1.8} />
      <path d={`M${cx - 18} ${base - 56}q6 12 2 22M${cx + 6} ${base - 60}q4 14 -2 24`} stroke={cream(0.45)} strokeWidth={1.3} fill="none" />
      {/* cabbage leaves */}
      <path d={`M${x0 + 10} ${base - 8}q18 -26 44 -14q-14 22 -44 14Z`} fill="#3A2F23" stroke={cream(0.7)} strokeWidth={1.7} />
      <path d={`M${x0 + 12} ${base - 9}q20 -8 40 -13`} stroke={cream(0.45)} strokeWidth={1.2} fill="none" />
      <path d={`M${cx + 6} ${base - 74}q20 -16 38 -2q-18 14 -38 2Z`} fill="#3A2F23" stroke={cream(0.7)} strokeWidth={1.6} />
      {/* a fish skeleton on top */}
      <g transform={`translate(${cx - 20} ${base - 64}) rotate(-8) scale(0.8)`}>
        <path d="M0 0H56" stroke={cream(0.85)} strokeWidth={2.2} />
        <path d="M10 0l-5 -10M10 0l-5 10M20 0l-5 -11M20 0l-5 11M30 0l-5 -11M30 0l-5 11M40 0l-5 -9M40 0l-5 9" stroke={cream(0.75)} strokeWidth={1.4} />
        <path d="M56 0L72 -9Q80 0 72 9Z" fill="#2B2219" stroke={cream(0.85)} strokeWidth={1.8} />
        <path d="M0 0L-12 -9L-9 0L-12 9Z" fill="#2B2219" stroke={cream(0.85)} strokeWidth={1.6} />
      </g>
      {/* straw */}
      <path d={`M${x0 + 4} ${base - 30}l30 -10M${cx + 60} ${base - 6}l34 4M${cx - 90} ${base - 4}l26 -6M${cx + 36} ${base - 80}l18 -10`} stroke={cream(0.6)} strokeWidth={1.6} />
    </g>
  );
})();

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
      <path d={hatchD(110, -70, 230, 80, -58, 5.2)} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.7} clipPath="url(#dl-pot-shade)" />
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
          <stop offset="0.3" stopColor={ROOM} stopOpacity={0.35} />
          <stop offset="0.5" stopColor={ROOM} stopOpacity={0} />
          <stop offset="1" stopColor={ROOM} stopOpacity={0} />
        </linearGradient>
        <clipPath id="dl-arm-clip">
          {/* never in front of the window's left jamb (the elbow is inside the room); and while the pot is still being
              lifted out of the room, nothing shows below the window's bottom rail (the wall below hides it) */}
          <rect x={lean(W1.x0, 1960) + 1} y={0} width={2000} height={frame < T.armOut[1] ? W1.y1 : 4000} />
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
        <path d={sleeve} fill="none" stroke={cream(0.8)} strokeWidth={2.1} />
        <path d={sh} stroke={cream(0.4)} strokeWidth={1.3} />
        <path d={folds} stroke={cream(0.55)} strokeWidth={1.5} fill="none" />
        <path d={sleeve} fill="url(#dl-arm-dark)" />
      </g>
      {/* the pot, turned about its pivot */}
      <g transform={`translate(${r2(piv[0])} ${r2(piv[1])}) rotate(${th.toFixed(3)})`}>
        <PotShape full={full} />
      </g>
      {/* the cuff: a ruffle at the wrist */}
      <g transform={`translate(${r2(wrist[0])} ${r2(wrist[1])}) rotate(${ang.toFixed(3)})`}>
        <path d="M-6 -23Q4 -16 -1 -8Q7 0 -1 8Q4 16 -6 23L8 22Q15 11 10 0Q15 -11 8 -22Z" fill={INK} stroke={DARK} strokeWidth={2.4} />
      </g>
      {/* the hand round the handle */}
      <g transform={`translate(${r2(g[0])} ${r2(g[1])}) rotate(${(ang + th * 0.35).toFixed(3)}) scale(1.3)`}>
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
const POUR_FULL_UNTIL = 81; // the pour runs full and unbroken until after contact (f79)
const fluxAt = (te: number) => {
  if (te < T.pour[0] || te > T.pour[1]) return 0;
  // a gulp out of the full pot, a steady stream, then (after contact) it runs dry
  const rise = Math.min(1, 0.4 + (te - T.pour[0]) / 1.0);
  if (te <= POUR_FULL_UNTIL) return rise;
  const u = (te - POUR_FULL_UNTIL) / (T.pour[1] - POUR_FULL_UNTIL);
  return Math.pow(Math.cos(u * (Math.PI / 2)), 1.3);
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
/** the splash droplets: thrown from the impacts of every third particle, landing on the stones about the kennel */
type Fleck = { t0: number; p0: [number, number]; v: [number, number]; tl: number; land: [number, number]; r: number };
const FLECKS: Fleck[] = (() => {
  const out: Fleck[] = [];
  STREAM.forEach((d, i) => {
    if (i % 2 || d.flux < 0.25) return;
    const n = 2;
    for (let j = 0; j < n; j++) {
      const s = `${i}-${j}`;
      const side = random(`fs${s}`) < 0.5 ? -1 : 1;
      const v: [number, number] = [side * (5 + random(`fv${s}`) * 9), -(3 + random(`fu${s}`) * 6) * Math.sqrt(d.flux)];
      const dyLand = -30 + random(`fd${s}`) * 110; // thrown toward us lands lower on screen
      const g = SLOP_G * 0.55;
      const tl = impactT(d.hit[1], v[1], g, d.hit[1] + dyLand);
      out.push({ t0: d.te + d.ti, p0: d.hit, v, tl, land: [d.hit[0] + v[0] * tl, d.hit[1] + dyLand], r: 2.6 + random(`fr${s}`) * 3 });
    }
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
    const w = (4 + 58 * d.flux) * Math.max(0.42, 1 - 0.036 * age) * (1 + Math.min(0.2, 0.025 * age) * Math.sin(d.te * 3.1) + 0.06 * Math.sin(d.te * 7.3 + 1));
    pts.push({ p, w, te: d.te, fl: d.flux, frac: (p[1] - d.p0[1]) / (KENNEL.surf - d.p0[1]), u: [vx / vl, vy / vl], i });
  });
  if (f >= T.pour[0] && f <= T.pour[1]) pts.push({ p: lipAt(f), w: 4 + 58 * fluxAt(f), te: f, fl: fluxAt(f), frac: 0, u: [0.6, 0.8], i: -1 });
  pts.sort((a, b) => b.te - a.te); // from the lip down to the head
  // after the pour has torn off at the lip (~f88) the tear runs down the falling remainder: it breaks into drops
  // from the top down instead of falling as one piece
  const tearTe = f <= 88 ? 99 : POUR_FULL_UNTIL - (f - 88) * 1.1;
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
      L.push([q.p[0] - nx * hw, q.p[1] - ny * hw]);
      R.push([q.p[0] + nx * hw, q.p[1] + ny * hw]);
      // the sheen runs only where the pour is full (never round a thinning end)
      if (q.fl >= 0.7) SH.push(`${r2(q.p[0] - nx * hw * 0.35)} ${r2(q.p[1] - ny * hw * 0.35)}`);
    });
    // the ends taper to a point along the fall: the foot where it is breaking up, the top once it has left the lip
    const head = run[run.length - 1];
    const ring: [number, number][] = [...L, [head.p[0] + head.u[0] * head.w * 0.8, head.p[1] + head.u[1] * head.w * 0.8], ...R.slice().reverse()];
    // its top is the lip while it pours; once it has torn off, the top has thinned to a thread (the drops above it)
    bodies.push(
      <g key={j}>
        <path d={blobD(ring)} fill={SLOP} stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
        {SH.length > 3 ? <path d={`M${SH.slice(1, -1).join("L")}`} stroke={SHEEN} strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
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
    const I = Math.min(1, rate / 9);
    // the splash at the foot of the stream: a churning, irregular mound of slop with short spurts
    const hw = 30 + 22 * I;
    const hh = 14 + 16 * I;
    let mound = `M${r2(cx - hw)} ${KENNEL.surf + 4}`;
    for (let i = 1; i < 12; i++) {
      const u = i / 12;
      const x = cx - hw + 2 * hw * u;
      const y = KENNEL.surf + 4 - hh * Math.sin(u * Math.PI) * (0.7 + 0.6 * random(`mn${i}-${f}`));
      mound += `L${r2(x)} ${r2(y)}`;
    }
    mound += `L${r2(cx + hw)} ${KENNEL.surf + 4}Z`;
    crown.push(<path key="mound" d={mound} fill={SLOP} stroke={DARK} strokeWidth={2} strokeLinejoin="round" />);
    [-0.8, -0.45, 0.4, 0.75].forEach((sv, i) => {
      const len = (12 + 16 * random(`sp${i}-${f}`)) * (0.6 + 0.4 * I);
      const bx = cx + sv * hw * 0.8;
      const by = KENNEL.surf - hh * 0.5;
      crown.push(<path key={`sp${i}`} d={`M${r2(bx)} ${r2(by)}L${r2(bx + sv * len * 0.9)} ${r2(by - len)}`} stroke={DARK} strokeWidth={7} strokeLinecap="round" />);
      crown.push(<path key={`sq${i}`} d={`M${r2(bx)} ${r2(by)}L${r2(bx + sv * len * 0.9)} ${r2(by - len)}`} stroke={SLOP} strokeWidth={4} strokeLinecap="round" />);
    });
    crown.unshift(<ellipse key="b" cx={r2(cx)} cy={KENNEL.surf + 4} rx={r2(48 + 26 * I)} ry={10} fill={SLOP} stroke={DARK} strokeWidth={2.1} />);
  }
  const flecks: React.ReactNode[] = [];
  const spatter: React.ReactNode[] = [];
  FLECKS.forEach((k, i) => {
    const t = f - k.t0;
    if (t < 0) return;
    if (t < k.tl) {
      const x = k.p0[0] + k.v[0] * t;
      const y = k.p0[1] + k.v[1] * t + 0.5 * FLECK_G * t * t;
      flecks.push(<circle key={i} cx={r2(x)} cy={r2(y)} r={r2(k.r)} fill={SLOP} stroke={DARK} strokeWidth={1.2} />);
    } else {
      const grow = Math.min(1, (t - k.tl) / 3);
      spatter.push(<ellipse key={i} cx={r2(k.land[0])} cy={r2(k.land[1])} rx={r2(k.r * (1.2 + 0.6 * grow))} ry={r2(k.r * 0.55)} fill={SLOP_D} stroke="rgba(23,18,13,0.6)" strokeWidth={0.8} />);
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
  const xR = cx + 24 + 90 * (1 - Math.exp(-t / 14));
  const xL = cx - 24 - 120 * (1 - Math.exp(-t / 12));
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
  // the wet stain on the stones about the impact
  const st = easeOut(t / 14);
  const stain: [number, number][] = [];
  for (let j = 0; j < 9; j++) {
    const a = (j / 9) * Math.PI * 2;
    const rr = 0.8 + 0.35 * random(`st${j}`);
    stain.push([cx + Math.cos(a) * (36 + 40 * st) * rr, KENNEL.surf + 6 + Math.sin(a) * (16 + 12 * st) * rr]);
  }
  return (
    <g>
      <path d={blobD(stain)} fill={SLOP_D} opacity={0.8} />
      <path d={d} fill={SLOP} />
      <path d={rip} stroke={SHEEN} strokeOpacity={0.8} strokeWidth={1.8} fill="none" />
      <path d={bits} stroke={cream(0.5)} strokeWidth={1.8} fill="none" />
    </g>
  );
};

/** drips: from the pot's lip after the pour and from the sill's edge; each falls and rings the slop */
const DRIPS: { from: "lip" | "sill"; t0: number }[] = [
  { from: "lip", t0: 92 },
  { from: "sill", t0: 85 },
  { from: "lip", t0: 99 },
  { from: "sill", t0: 97 },
  { from: "lip", t0: 108 },
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
const FLY_SWARMS = [
  { cx: HEAP.cx, cy: HEAP.top - 50, n: 6, rx: 70, ry: 34, seed: "h" },
  { cx: DUNG[0].x, cy: DUNG[0].y - 110, n: 4, rx: 70, ry: 28, seed: "d" },
  { cx: DUNG[1].x, cy: DUNG[1].y - 100, n: 3, rx: 60, ry: 24, seed: "e" },
];
const Flies: React.FC<{ frame: number }> = ({ frame }) => {
  const out: React.ReactNode[] = [];
  FLY_SWARMS.forEach((sw) => {
    for (let i = 0; i < sw.n; i++) {
      const k = `${sw.seed}${i}`;
      const w = 0.21 + random(`fw${k}`) * 0.12;
      const ph = random(`fp${k}`) * 6.28;
      const rx = sw.rx * (0.6 + random(`fx${k}`) * 0.7);
      const ry = sw.ry * (0.6 + random(`fy${k}`) * 0.7);
      const t = frame * w + ph;
      const x = sw.cx + rx * Math.sin(t) + 14 * Math.sin(2.7 * t + i);
      const y = sw.cy - random(`fh${k}`) * 30 + ry * Math.sin(2 * t + ph) + 6 * Math.cos(3.3 * t);
      const flap = Math.sin(frame * 2.9 + i) > 0 ? 1 : 0.4;
      out.push(
        <g key={k}>
          <ellipse cx={r2(x - 3)} cy={r2(y - 2.6)} rx={3} ry={r2(1.4 + flap * 1.2)} fill={cream(0.45)} />
          <ellipse cx={r2(x + 3)} cy={r2(y - 2.6)} rx={3} ry={r2(1.4 + flap * 1.2)} fill={cream(0.45)} />
          <circle cx={r2(x)} cy={r2(y)} r={3.6} fill={INK} stroke={DARK} strokeWidth={1.5} />
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
  const sl = labelSlide(frame, T.londonIn);
  if (sl.op <= 0.002) return null;
  const [sx, sy] = toScreen(cam, DOME.cx, LONDON_Y);
  if (sy < -120) return null;
  const size = 96;
  const sp = 0.42;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <text x={sx + (size * sp) / 2} y={sy + sl.dy} textAnchor="middle" opacity={sl.op} fill={INK} stroke={DARK} strokeOpacity={0.75} strokeWidth={size * 0.12} paintOrder="stroke" style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * sp }}>
        LONDON
      </text>
    </svg>
  );
};

const HOUSE_SKEW = `matrix(1 0 ${LEAN} 1 ${-LEAN * FOOT} 0)`;

const DisgustingLondon: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <defs>
          <linearGradient id="dl-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120E0A" stopOpacity={0} />
            <stop offset="0.5" stopColor="#120E0A" stopOpacity={0.2} />
            <stop offset="1" stopColor="#120E0A" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        {StPauls}
        {City}
        {Neighbours}
        <g transform={HOUSE_SKEW}>
          {HouseStatic}
          <TheWindow frame={frame} />
          <rect x={SILL.x0} y={SILL.y0} width={SILL.x1 - SILL.x0} height={SILL.y1 - SILL.y0} fill={PLANE} stroke={cream(SUB)} strokeWidth={2.7} />
          <rect x={SILL.x0 + 4} y={SILL.y1} width={SILL.x1 - SILL.x0 - 8} height={9} fill="rgba(12,9,6,0.55)" />
          <g transform="translate(0 16)">
            <Sign frame={frame} />
          </g>
        </g>
        {Street}
        <Filth frame={frame} />
        <rect x={-320} y={2980} width={1740} height={900} fill="url(#dl-near)" />
        <Sludge frame={frame} />
        {Heap}
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

export default DisgustingLondon;
