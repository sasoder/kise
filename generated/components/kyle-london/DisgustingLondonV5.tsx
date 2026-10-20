// ---------------------------------------------------------------------------
// DisgustingLondonV5 (kyle-london, cut 2; the depth pass on the delivered V2, 2_DisgustingLondon.mov). Dwarkesh map
// style (styles/dwarkesh-map.md). Opaque 1080x1920, 29.97 fps, 115 frames. V2's concept, beats, word timing, camera
// path and one-subject-at-a-time simplicity are kept; V5 changes how the world is drawn in space (DEPTH.md): one
// pinhole camera (one VP on the frame's centre line, a horizon that comes down with the tilt), the house as a volume,
// the street as a ground plane, one light from the upper left, atmospheric depth and parallax from that one camera.
// World + camera + timeline + the perspective camera in disgustingLondonWorldV5.ts; V2 stays as DisgustingLondonV2.tsx.
//
// CHECK LINE: "London's streets were open sewers: people tipped chamber pots out of the window into the street."
//
// THE LINE: "...living in London in the 18th century and just like how disgusting it was."
// WORD -> FRAME: living 4 · in 12 · London 18 · in 25 · the 28 · 18th 32 · century 42 · and 52 · just 66 ·
//   like 71 · how 75 · disgusting 80 · it 91 · was 101 (the speaker goes on "Pretty disgusting" at 115, after the cut)
// DURATION: the slot 2.436 -> 6.273 s (in frame 73, out frame 188) = 115 frames (f0..f114).
//
// THE MOTION (V2's one continuous tilt down one street, skyline to gutter): f0 the camera is already moving on the
// skyline, the dome of St Paul's far off over the city roofs at V2's line contrast; LONDON slides up over the distant
// roofs on its word (f4 -> lands f18), stays whole and legible to ~f42, then the near house's roof rises over it in one
// clean pass (f43-f49; V5 has no chimney stacks, so nothing bites a letter). The far dome rides the horizon (~0.6 of
// the house's rate) and sinks toward the page tone as the house takes over (its haze 0 at f8 -> 0.62 at f58), until the
// house has risen in front of it (~f60). The tilt runs down the front of the leaning row house (k 0.84 -> 1.42, V2's keyed
// track through the house damped follow, now a real dolly toward the house). The lower sash, recessed in the thick wall,
// is thrown up (f45-51), a forearm brings the chamber pot up out of the dark room (f46-56), out in front of the wall
// (z -60: it throws its shadow on the house front), and tips it (f54-66); the slop leaves the lip from ~f62 (cause),
// thrown out over the street toward us and falling in one tapered pour (perspective widens it as it nears us) onto the
// kennel, the channel across the street 2.5 m out from the wall: CONTACT f79 (first reaction f79: the splash crown and
// drops on the sludge plane; the run along the channel from f80) on "disgusting". The pot runs dry after contact
// (f81-86), the pour tears off (~f88) and falls as drops; f80-114 the slop spreads in the channel, drips fall from the
// pot and the sill onto the cobbles at the wall's foot, the sludge drifts, flies circle the heap; the camera creeps on.
// The near cobbles are a step quieter than the far ones and sink into shadow toward the frame's bottom.
// CONTACT: the first slop meets the sludge surface on f79 (solved: gravity from the lip at f62 to SURF_Y in 17 f).
// Orange = the new science (the clip rule); this cut is the old London: no orange. The slop is DEAD #8A7B62 sunk in umber.
//
// DEPTH (the plan: <scratch>/dl5/DEPTH_PLAN.md): F = 1100, D = F / k, eye Ye 1700 -> 2170 (world y; street 2400);
// depths: dome 9000, city + LONDON 1500, ridge 300, sashes 46, door 44, house front 0, neighbours -30 / -50,
// eaves -40, sill -28, head -22, fascia -24, pot -60, kennel -215..-292, street 0..-700. Light L = (0.5, 1, 0.8).
//
// SOURCES: St Paul's Cathedral, Wren, completed 1710 (dome on a peristyle drum, stone gallery, lantern, golden ball
//   and cross: its well-known silhouette, here seen from below, drum rings curving over the eye). Emptying chamber pots
//   from windows into the street and the central "kennel": the speaker's claim, and Hogarth, "Night" (Four Times of the
//   Day, 1738), which shows a pot emptied from a window. No figures or dates on screen.
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
  HEAP3,
  HOUSE,
  KENNEL3,
  LEAN,
  LONDON_Y,
  ROOF,
  SILL,
  SKY_SHIFT,
  SLOP_V0,
  SURF_Y,
  T,
  WIN,
  Z,
  camAt,
  depthScale,
  depthTint,
  eyeAtFrame,
  eyeOf,
  gripAt,
  layerFrom,
  layerPoint,
  lean,
  lipAt,
  planeAt,
  potPoint,
  proj,
  tipAngle,
  wallShadowOffset,
  type Cam,
  type Eye,
  type P3,
} from "./disgustingLondonWorldV5";

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
const DOME_FILL = "#3B3127"; // the far cathedral: close to the page (atmospheric depth)
const NEIGH = "#3A2F24"; // the neighbouring houses
const PLANE = "#30271D"; // the house front: a step darker than the LAND sky
const TIMBER = "#241C14";
const GLASS = "#16110C";
const ROOM = "#100C08";
const COAT = "#4A3D2E"; // the sleeve of a brown coat
const SLUDGE = "#33281D"; // the kennel: darker than the street, lighter than fresh slop
const DEAD = "#8A7B62";
const SLOP = "#271E15"; // the slop: DEAD sunk in umber, the darkest thing in the street (its sheen is DEAD)
const SLOP_D = "#2C2218";
const SHEEN = DEAD; // the wet sheen on the slop
// V5: the faces of volumes under the one light (upper left): lit = turned to it (left sides, tops), shade = turned
// away (right sides, undersides; with the house hatch)
const LIT = "#4A3D2F";
const LIT_SOFT = "#3F3328";
const SHADE = "#1D1711";
const SLOPE = "#382D22"; // the roof's slope (turned up to the light)
const WALL_SHADOW = "rgba(10,8,5,0.42)";
const STREET = "#352A20";
const SETT = "#3C3125";
const SETT_SH = "#2C231A";
const STONE = "#4A3C2D"; // the kennel's dressed edge stones
const WALL_K = "#231C14"; // the kennel's far inner wall

const r2 = (v: number) => Math.round(v * 100) / 100;
const lin = (f: number, a: number, b: number) => Math.max(0, Math.min(1, (f - a) / (b - a)));
const sstep = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const easeOut = (u: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
type V2p = [number, number];
const pd = (pts: V2p[]) => `M${pts.map((p) => `${r2(p[0])} ${r2(p[1])}`).join("L")}Z`;
const bbox = (pts: V2p[]): [number, number, number, number] => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  pts.forEach(([x, y]) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  });
  return [x0 - 2, y0 - 2, x1 + 2, y1 + 2];
};
/** convex hull (monotone chain) */
const hull = (pts: V2p[]): V2p[] => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: V2p, a: V2p, b: V2p) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: V2p[] = [];
  p.forEach((q) => {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  });
  const hi: V2p[] = [];
  p.slice().reverse().forEach((q) => {
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  });
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};

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
/** a hatch clipped to a path */
const Hatch: React.FC<{ id: string; clip: string; box: [number, number, number, number]; angle: number; gap: number; w?: number; color?: string }> = ({ id, clip, box, angle, gap, w = 1.1, color = cream(0.3) }) => (
  <>
    <clipPath id={id}>
      <path d={clip} />
    </clipPath>
    <path d={hatchD(box[0], box[1], box[2], box[3], angle, gap)} stroke={color} strokeWidth={w} clipPath={`url(#${id})`} fill="none" />
  </>
);
const hid = () => `dl-h${CLIP_N++}`;
/** a closed outline through the points (midpoint quadratics: smooth, but the points themselves are ragged) */
const blobD = (ring: V2p[]) => {
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
const clotRing = (x: number, y: number, r: number, ux: number, uy: number, seed: string): V2p[] => {
  const out: V2p[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const rr = r * (0.7 + 0.6 * random(`${seed}-${i}`));
    const ca = Math.cos(a);
    const sa = Math.sin(a);
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
// DRAWING RULES (V2's): one hatch for every shaded plane (-56 deg, 5 px, cream 0.2, 1.1 px: light from the upper
// left); three line weights. V5 adds the faces of volumes (LIT / SHADE) and the atmospheric tint by depth.
// ---------------------------------------------------------------------------
const HATCH = { angle: -56, gap: 5, w: 1.1, color: cream(0.2) };
const LW = { subject: 3.2, house: 2.2, detail: 1.5, context: 1.2 };
const Shade: React.FC<{ clip: string; box: [number, number, number, number]; id?: string }> = ({ clip, box, id }) => (
  <Hatch id={id ?? hid()} clip={clip} box={box} angle={HATCH.angle} gap={HATCH.gap} w={HATCH.w} color={HATCH.color} />
);
/** one face of a volume: fill, the house hatch if it is turned away from the light, a cream edge */
const Face: React.FC<{ id: string; pts: V2p[]; fill: string; shade?: boolean; edge?: number; ew?: number }> = ({ id, pts, fill, shade, edge = 0, ew = LW.detail }) => {
  const d = pd(pts);
  return (
    <>
      <path d={d} fill={fill} />
      {shade ? <Shade id={id} clip={d} box={bbox(pts)} /> : null}
      {edge > 0 ? <path d={d} fill="none" stroke={cream(edge)} strokeWidth={ew} strokeLinejoin="round" /> : null}
    </>
  );
};
/** a point of the (leaning) house at depth z -> world */
const HP = (e: Eye, x: number, y: number, zz: number): V2p => proj(e, lean(x, y), y, zz);

/** a box standing proud of the house front (x0..x1, y0..y1, its front at depth zf < 0): the shadow it throws on the
 *  wall, the end / top / underside faces the eye can see, the front */
const Box: React.FC<{ id: string; e: Eye; x0: number; x1: number; y0: number; y1: number; zf: number; fill: string; edge?: number; shadow?: boolean }> = ({ id, e, x0, x1, y0, y1, zf, fill, edge = 0.72, shadow = true }) => {
  const [ox, oy] = wallShadowOffset(zf);
  const corners: V2p[] = [
    [lean(x0, y0), y0],
    [lean(x1, y0), y0],
    [lean(x1, y1), y1],
    [lean(x0, y1), y1],
  ];
  const sh = hull([...corners, ...corners.map(([x, y]) => [x + ox, y + oy] as V2p)]);
  const faces: React.ReactNode[] = [];
  if (e.Y < y0) faces.push(<Face key="t" id={`${id}t`} pts={[HP(e, x0, y0, zf), HP(e, x1, y0, zf), HP(e, x1, y0, 0), HP(e, x0, y0, 0)]} fill={LIT} edge={edge * 0.6} ew={LW.context} />);
  if (e.Y > y1) faces.push(<Face key="b" id={`${id}b`} pts={[HP(e, x0, y1, zf), HP(e, x1, y1, zf), HP(e, x1, y1, 0), HP(e, x0, y1, 0)]} fill={SHADE} shade />);
  if (e.X < lean(x0, y1)) faces.push(<Face key="l" id={`${id}l`} pts={[HP(e, x0, y0, zf), HP(e, x0, y0, 0), HP(e, x0, y1, 0), HP(e, x0, y1, zf)]} fill={LIT} />);
  if (e.X > lean(x1, y1)) faces.push(<Face key="r" id={`${id}r`} pts={[HP(e, x1, y0, zf), HP(e, x1, y0, 0), HP(e, x1, y1, 0), HP(e, x1, y1, zf)]} fill={SHADE} shade />);
  return (
    <g>
      {shadow ? <path d={pd(sh)} fill={WALL_SHADOW} /> : null}
      {faces}
      <path d={pd([HP(e, x0, y0, zf), HP(e, x1, y0, zf), HP(e, x1, y1, zf), HP(e, x0, y1, zf)])} fill={fill} stroke={cream(edge)} strokeWidth={LW.house} strokeLinejoin="round" />
    </g>
  );
};
/** the reveals of an opening (x0..x1, y0..y1) cut back into the wall to depth zb > 0: left and top in shade, right and
 *  bottom lit, each only if the eye can see it */
const Reveals: React.FC<{ id: string; e: Eye; x0: number; x1: number; y0: number; y1: number; zb: number }> = ({ id, e, x0, x1, y0, y1, zb }) => {
  const out: React.ReactNode[] = [];
  if (e.X > lean(x0, y1)) out.push(<Face key="l" id={`${id}l`} pts={[HP(e, x0, y0, 0), HP(e, x0, y0, zb), HP(e, x0, y1, zb), HP(e, x0, y1, 0)]} fill={SHADE} shade />);
  if (e.X < lean(x1, y1)) out.push(<Face key="r" id={`${id}r`} pts={[HP(e, x1, y0, 0), HP(e, x1, y0, zb), HP(e, x1, y1, zb), HP(e, x1, y1, 0)]} fill={LIT_SOFT} />);
  if (e.Y > y0) out.push(<Face key="t" id={`${id}t`} pts={[HP(e, x0, y0, 0), HP(e, x1, y0, 0), HP(e, x1, y0, zb), HP(e, x0, y0, zb)]} fill={SHADE} shade />);
  if (e.Y < y1) out.push(<Face key="b" id={`${id}b`} pts={[HP(e, x0, y1, 0), HP(e, x1, y1, 0), HP(e, x1, y1, zb), HP(e, x0, y1, zb)]} fill={LIT_SOFT} />);
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// ST PAUL'S (far: z 9000, it rides the horizon). V5: a small 3D model seen from below (orthographic, the eye's
// elevation ALPHA): the drum's rings and the dome's base curve over the eye, the colonnade's columns crowd toward the
// flanks, the right flank in shade; atmospheric: line and fill pulled toward the page, thinner line.
// ---------------------------------------------------------------------------
const ALPHA = 0.2;
const CA = Math.cos(ALPHA);
const SA = Math.sin(ALPHA);
const BASE_Y = 964; // the drum's foot (drawing coords)
/** model point (x from the axis, y drawing coords down, z toward us from the axis) -> drawing coords, seen from below */
const up = (x: number, y: number, zz: number): V2p => [DOME.cx + x, BASE_Y - ((BASE_Y - y) * CA + zz * SA)];
const ring = (r: number, y: number, n = 40): V2p[] => {
  const out: V2p[] = [];
  for (let i = 0; i <= n; i++) {
    const th = -Math.PI / 2 + (i / n) * Math.PI;
    out.push(up(r * Math.sin(th), y, r * Math.cos(th)));
  }
  return out;
};
const band = (r: number, yTop: number, yBot: number): V2p[] => [...ring(r, yTop), ...ring(r, yBot).reverse()];
/** the dome's line at V2's levels: at f0 it is the subject; its atmospheric depth is the haze (domeHaze) that grows
 *  as the camera tilts and the house takes over */
const domeLine = (a: number) => cream(a);
const StPauls: React.ReactElement = (() => {
  const { cx, spring, rx, ry } = DOME;
  // the dome (an ellipsoid on its base ring): the top envelope of its projected surface, closed by the front base arc
  const env = new Map<number, number>();
  for (let p = 0; p <= 90; p += 2) {
    for (let t = -180; t <= 180; t += 3) {
      const ph = (p * Math.PI) / 180;
      const th = (t * Math.PI) / 180;
      const q = up(rx * Math.cos(ph) * Math.sin(th), spring - ry * Math.sin(ph), rx * Math.cos(ph) * Math.cos(th));
      const b = Math.round((q[0] - cx) / 6);
      env.set(b, Math.min(env.get(b) ?? Infinity, q[1]));
    }
  }
  const top: V2p[] = [...env.entries()].sort((a, b) => a[0] - b[0]).map(([b, y]) => [cx + Math.max(-rx, Math.min(rx, b * 6)), y]);
  const domePts: V2p[] = [...top, ...ring(rx, spring).reverse()];
  const domeD = blobD(domePts);
  let ribs = "";
  for (let i = -3; i <= 3; i++) {
    const th = (i * 22.5 * Math.PI) / 180;
    for (let j = 0; j <= 24; j++) {
      const ph = (j / 24) * ((84 * Math.PI) / 180);
      const q = up(rx * Math.cos(ph) * Math.sin(th), spring - ry * Math.sin(ph), rx * Math.cos(ph) * Math.cos(th));
      ribs += `${j ? "L" : "M"}${r2(q[0])} ${r2(q[1])}`;
    }
  }
  // the colonnade: columns round the drum (r 410), crowding toward the flanks; those on the shaded right fainter
  const R_PER = 410;
  let colsLit = "";
  let colsSh = "";
  for (let th = -84; th <= 84; th += 12) {
    const a = (th * Math.PI) / 180;
    const p0 = up(R_PER * Math.sin(a), 830, R_PER * Math.cos(a));
    const p1 = up(R_PER * Math.sin(a), 944, R_PER * Math.cos(a));
    const seg = `M${r2(p0[0])} ${r2(p0[1])}L${r2(p1[0])} ${r2(p1[1])}`;
    if (th > 24) colsSh += seg;
    else colsLit += seg;
  }
  const shadeClip = `M${cx + 60} ${spring + 60}C${cx + 120} ${spring - 180} ${cx + 60} ${spring - 290} ${cx + 30} ${spring - ry - 20}L${cx + rx + 10} ${spring - ry - 20}L${cx + rx + 10} ${spring + 60}Z`;
  const dc = hid();
  const bandEl = (r: number, y0: number, y1: number, fill: string, a: number, key: string) => {
    const pts = band(r, y0, y1);
    const right = pts.map(([x, y]) => [Math.max(x, cx + 0.45 * r), y] as V2p);
    return (
      <g key={key}>
        <path d={pd(pts)} fill={fill} stroke={domeLine(a)} strokeWidth={LW.detail / 0.78} strokeLinejoin="round" />
        <Shade clip={pd(right)} box={bbox(right)} />
      </g>
    );
  };
  return (
    <g>
      {/* the lantern, the golden ball and the cross, set on the dome's crown (squashed by the view from below) */}
      <g transform={`matrix(1 0 0 ${CA} 0 ${BASE_Y * (1 - CA)})`}>
        <rect x={cx - 54} y={356} width={108} height={16} fill={DOME_FILL} stroke={domeLine(0.85)} strokeWidth={LW.house / 0.78} />
        <rect x={cx - 40} y={262} width={80} height={96} fill={DOME_FILL} stroke={domeLine(0.85)} strokeWidth={LW.house / 0.78} />
        <rect x={cx + 6} y={264} width={32} height={92} fill="rgba(16,12,8,0.4)" />
        <path d={`M${cx - 28} 266V354M${cx + 28} 266V354`} stroke={domeLine(0.5)} strokeWidth={LW.context} />
        <path d={`M${cx - 11} 350V298A11 11 0 0 1 ${cx + 11} 298V350Z`} fill={GLASS} stroke={domeLine(0.55)} strokeWidth={LW.context} />
        <rect x={cx - 50} y={250} width={100} height={13} fill={DOME_FILL} stroke={domeLine(0.85)} strokeWidth={LW.house / 0.78} />
        <path d={`M${cx - 36} 250A36 40 0 0 1 ${cx + 36} 250Z`} fill={DOME_FILL} stroke={domeLine(0.85)} strokeWidth={LW.house / 0.78} />
        <path d={`M${cx - 12} 212Q${cx - 4} 176 ${cx - 6} 142L${cx + 6} 142Q${cx + 4} 176 ${cx + 12} 212Z`} fill={DOME_FILL} stroke={domeLine(0.85)} strokeWidth={LW.house / 0.78} />
        <circle cx={cx} cy={126} r={16} fill={DOME_FILL} stroke={domeLine(0.9)} strokeWidth={LW.house / 0.78} />
        <path d={`M${cx - 9} 120A10 10 0 0 1 ${cx - 2} 113`} stroke={domeLine(0.7)} strokeWidth={1.6} fill="none" />
        <path d={`M${cx - 4} ${CROSS_TOP}H${cx + 4}V54H${cx + 20}V63H${cx + 4}V110H${cx - 4}V63H${cx - 20}V54H${cx - 4}Z`} fill={domeLine(0.85)} stroke={DARK} strokeWidth={1.1} />
      </g>
      {/* the dome */}
      <path d={domeD} fill={DOME_FILL} />
      <clipPath id={dc}>
        <path d={domeD} />
      </clipPath>
      <g clipPath={`url(#${dc})`}>
        <Shade clip={shadeClip} box={[cx, spring - ry - 30, cx + rx + 10, spring + 70]} />
      </g>
      <path d={ribs} stroke={domeLine(0.55)} strokeWidth={LW.detail / 0.78} fill="none" clipPath={`url(#${dc})`} />
      <path d={domeD} fill="none" stroke={domeLine(0.9)} strokeWidth={LW.subject / 0.78} />
      {/* the stone gallery, the attic, the entablature, the colonnade, the drum's foot: rings seen from below */}
      {bandEl(328, 700, 722, DOME_FILL, 0.6, "gal")}
      {bandEl(318, 722, 806, DOME_FILL, 0.5, "att")}
      {bandEl(416, 806, 828, DOME_FILL, 0.55, "ent")}
      <path d={pd(band(398, 828, 944))} fill="#251D15" />
      <path d={colsLit} stroke={domeLine(0.5)} strokeWidth={6} />
      <path d={colsLit} stroke="#251D15" strokeWidth={3} />
      <path d={colsSh} stroke={domeLine(0.3)} strokeWidth={6} />
      <path d={colsSh} stroke="#251D15" strokeWidth={3} />
      {bandEl(420, 944, 964, DOME_FILL, 0.5, "foot")}
    </g>
  );
})();

// THE DISTANT CITY (context, z 1500): one flat band of roofs in front of the drum, its skyline the only line
const CITY_T = depthTint(Z.city);
const City: React.ReactElement = (() => {
  let fill = `M-600 1700`;
  let edge = "";
  let x = -600;
  let i = 0;
  while (x < 1700) {
    const w = 80 + random(`cw${i}`) * 90;
    const top = 990 + random(`ct${i}`) * 34;
    const peak = top - (random(`cg${i}`) > 0.5 ? 18 + random(`cp${i}`) * 14 : 0);
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
  fill += "L1700 1700Z";
  return (
    <g>
      <path d={fill} fill={FAR} />
      <path d={edge} fill="none" stroke={cream(0.3 * CITY_T)} strokeWidth={LW.context} />
    </g>
  );
})();

/** the far layers: St Paul's from the eye of f0 (scaled to 0.82 of V2 about its upper drum: farther = smaller), the
 *  city and LONDON from the eye of f18 (LONDON lands on its word where V2 had it) */
const EYE_F0 = eyeAtFrame(0);
const EYE_F18 = eyeAtFrame(18);
const DOME_SCALE = 0.78;
/** V5: the far dome and the city sit a little higher than V2's, so the dome rises over the city roofs; LONDON lands over those roofs and sinks behind the near house before the sash goes up */
const DOME_LIFT = 70;
const CITY_LIFT = 125;
const LONDON_LIFT = 0;
/** V5: LONDON a little smaller and tighter than V2's (84 px, 0.42) so it sits well inside the roof's width: when the
 *  near roof rises over it, the ridge covers it in one clean pass (~f41-f48) */
const LONDON_SIZE = 72;
const LONDON_SP = 0.3;
const LONDON_DX = 10;
/** the far haze over St Paul's: none at f0 (V2's contrast), toward the page tone as the house takes over */
const domeHaze = (f: number) => 0.62 * sstep(lin(f, 8, 58));
const LAND_RGB = [0x3f / 255, 0x34 / 255, 0x28 / 255];
const DOME_PIVOT: V2p = [540, 540];
const FarLayers: React.FC<{ e: Eye; cam: Cam; frame: number }> = ({ e, cam, frame }) => {
  const sl = labelSlide(frame, T.londonIn);
  const [lx, ly] = layerPoint(e, EYE_F18, Z.city, DOME.cx, LONDON_Y - LONDON_LIFT);
  const size = LONDON_SIZE / cam.k;
  const sp = LONDON_SP;
  return (
    <g>
      <filter id="dl5-haze" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          {LAND_RGB.map((c, i) => {
            const h = domeHaze(frame);
            const F = i === 0 ? "feFuncR" : i === 1 ? "feFuncG" : "feFuncB";
            return React.createElement(F, { key: F, type: "linear", slope: r2(1 - h), intercept: Math.round(c * h * 1000) / 1000 });
          })}
        </feComponentTransfer>
      </filter>
      <g transform={layerFrom(e, EYE_F0, Z.dome)} filter={domeHaze(frame) > 0.002 ? "url(#dl5-haze)" : undefined}>
        <g transform={`translate(0 ${SKY_SHIFT - DOME_LIFT}) matrix(${DOME_SCALE} 0 0 ${DOME_SCALE} ${DOME_PIVOT[0] * (1 - DOME_SCALE)} ${DOME_PIVOT[1] * (1 - DOME_SCALE)})`}>{StPauls}</g>
      </g>
      <g transform={layerFrom(e, EYE_F18, Z.city)}>
        <g transform={`translate(0 ${SKY_SHIFT - CITY_LIFT})`}>{City}</g>
      </g>
      {/* LONDON: IM Fell English SC, widely spaced caps, slides up while fading in on its word; it lives over the
          distant roofs, so the near house rises in front of it */}
      {sl.op > 0.002 ? (
        <text x={lx + LONDON_DX + (size * sp) / 2} y={ly + sl.dy / cam.k} textAnchor="middle" opacity={sl.op} fill={INK} stroke={DARK} strokeOpacity={0.75} strokeWidth={size * 0.12} paintOrder="stroke" style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * sp }}>
          LONDON
        </text>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE NEIGHBOURS (context): flat dark fronts standing a little forward of our house (left -30, right -50), so their
// return walls show (the left one turned from the light, the right one lit); the left one throws a strip of shadow
// on our front
// ---------------------------------------------------------------------------
const NL = { x0: -700, x1: HOUSE.x0, top: 1690 };
const NR = { x0: HOUSE.x1, x1: 1800, top: 1560 };
const Neighbours: React.FC<{ e: Eye }> = ({ e }) => {
  const P = (x: number, y: number, zz: number) => proj(e, x, y, zz);
  const zl = Z.neighL;
  const zr = Z.neighR;
  const arch = (x0: number, x1: number, top: number) => {
    const s = depthScale(e, zr);
    const c = proj(e, (x0 + x1) / 2, top, zr);
    const a = proj(e, x0, FOOT, zr);
    const b = proj(e, x1, FOOT, zr);
    const r = ((x1 - x0) / 2) * s;
    return `M${r2(a[0])} ${r2(a[1])}V${r2(c[1])}A${r2(r)} ${r2(r)} 0 0 1 ${r2(b[0])} ${r2(c[1])}V${r2(b[1])}Z`;
  };
  return (
    <g>
      {/* left: its front, its return (in shade), its front corner */}
      <path d={pd([P(NL.x0, NL.top, zl), P(NL.x1, NL.top, zl), P(NL.x1, FOOT, zl), P(NL.x0, FOOT, zl)])} fill={NEIGH} />
      <Face id="nl-ret" pts={[P(NL.x1, NL.top, zl), P(NL.x1, NL.top, 0), P(NL.x1, FOOT, 0), P(NL.x1, FOOT, zl)]} fill={SHADE} shade />
      <path d={`M${pd([P(NL.x0, NL.top, zl), P(NL.x1, NL.top, zl)]).slice(1, -1)}`} stroke={cream(0.22)} strokeWidth={LW.context} fill="none" />
      <path d={`M${pd([P(NL.x1, NL.top, zl), P(NL.x1, FOOT, zl)]).slice(1, -1)}`} stroke={cream(0.3)} strokeWidth={LW.context} fill="none" />
      {/* right: its front (with its dark arched door), its lit return, its corner */}
      <path d={pd([P(NR.x0, NR.top, zr), P(NR.x1, NR.top, zr), P(NR.x1, FOOT, zr), P(NR.x0, FOOT, zr)])} fill={NEIGH} />
      <path d={arch(920, 1020, 2250)} fill="#211A13" />
      <path d={pd([P(NR.x0, NR.top, zr), P(NR.x0, NR.top, 0), P(NR.x0, FOOT, 0), P(NR.x0, FOOT, zr)])} fill={LIT_SOFT} />
      <path d={`M${pd([P(NR.x0, NR.top, zr), P(NR.x1, NR.top, zr)]).slice(1, -1)}`} stroke={cream(0.22)} strokeWidth={LW.context} fill="none" />
      <path d={`M${pd([P(NR.x0, NR.top, zr), P(NR.x0, FOOT, zr)]).slice(1, -1)}`} stroke={cream(0.3)} strokeWidth={LW.context} fill="none" />
    </g>
  );
};
/** the left neighbour's shadow on our front: its corner (x 235, 30 forward) cast down-right onto the wall */
const NeighShadow: React.ReactElement = (() => {
  const [ox, oy] = wallShadowOffset(Z.neighL);
  const x = HOUSE.x0;
  const pts: V2p[] = [
    [lean(x - 4, NL.top), NL.top],
    [x + ox, NL.top + oy],
    [x + ox, FOOT],
    [lean(x - 4, FOOT), FOOT],
  ];
  return <path d={pd(pts)} fill={WALL_SHADOW} />;
})();

// ---------------------------------------------------------------------------
// THE HOUSE: V2's front (fewer, bigger shapes; one clear window), now a volume: the roof a slope going back to its
// ridge (no stacks: LONDON passes behind it), the eaves, the window's head and sill, the shop fascia and the door step standing
// proud with their undersides / tops and their shadows on the wall, the window, the shop window and the door cut back
// into a thick wall with their reveals
// ---------------------------------------------------------------------------
const W1 = { x0: WIN.x0 + 14, x1: WIN.x1 - 14, y0: WIN.y0 + 14, y1: WIN.y1 - 6 }; // the opening inside the casing
const SASH_H = (W1.y1 - W1.y0) / 2 + 4;
const DOOR = { x0: 272, x1: 382, y0: 2214, y1: FOOT };
const SHOP = { x0: 432, x1: 650, y0: 2182, y1: 2300 };
const HEAD = { x0: WIN.x0 - 10, x1: WIN.x1 + 10, y0: WIN.y0 - 18, y1: WIN.y0 };
const EAVES = { x0: HOUSE.x0 - 14, x1: HOUSE.x1 + 14, y0: ROOF.eaves, y1: ROOF.eaves + 16 };
const STEP = { x0: DOOR.x0 - 16, x1: DOOR.x1 + 16, y0: FOOT - 14, y1: FOOT };
/** the house front itself (z 0; drawn inside the lean): the plaster storey with its timbers, the shop storey, the
 *  window's casing, the door's surround, the shop window's frame */
const HouseFront: React.ReactElement = (() => {
  const a = 0.72;
  const x0 = HOUSE.x0;
  const x1 = HOUSE.x1;
  const timber = (d: string, key: string) => (
    <g key={key}>
      <path d={d} stroke={cream(0.5)} strokeWidth={16} strokeLinecap="butt" fill="none" />
      <path d={d} stroke={TIMBER} strokeWidth={13} strokeLinecap="butt" fill="none" />
    </g>
  );
  const r = (DOOR.x1 - DOOR.x0) / 2;
  return (
    <g>
      <rect x={x0 - 4} y={ROOF.eaves} width={x1 - x0 + 8} height={FLOOR1.bottom - ROOF.eaves} fill={PLANE} stroke={cream(a)} strokeWidth={LW.house} />
      {timber(`M${x0 + 6} ${FLOOR1.top + 4}V${FLOOR1.bottom}`, "pL")}
      {timber(`M${x1 - 6} ${FLOOR1.top + 4}V${FLOOR1.bottom}`, "pR")}
      {timber(`M${x0 + 14} ${FLOOR1.bottom - 16}L${WIN.x0 - 14} ${FLOOR1.top + 40}`, "bL")}
      {timber(`M${WIN.x1 + 26} ${FLOOR1.bottom - 16}L${x1 - 16} ${FLOOR1.top + 40}`, "bR")}
      <rect x={x0} y={FASCIA.top} width={x1 - x0} height={FOOT - FASCIA.top} fill={PLANE} stroke={cream(a)} strokeWidth={LW.house} />
      {/* the door's surround (the opening itself is cut back: DoorRecess) */}
      <path d={`M${DOOR.x0 - 8} ${DOOR.y1}V${DOOR.y0}A${r + 8} ${r + 8} 0 0 1 ${DOOR.x1 + 8} ${DOOR.y0}V${DOOR.y1}Z`} fill={TIMBER} stroke={cream(a)} strokeWidth={LW.house} />
      {/* the shop window's frame and stallboard */}
      <rect x={SHOP.x0 - 10} y={SHOP.y0 - 10} width={SHOP.x1 - SHOP.x0 + 20} height={FOOT - SHOP.y0 + 10} fill={TIMBER} stroke={cream(a)} strokeWidth={LW.house} />
      {/* the window's casing (its opening is cut back: TheWindow) */}
      <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} fill={TIMBER} stroke={cream(0.95)} strokeWidth={LW.subject} />
    </g>
  );
})();
const HOUSE_SKEW = `matrix(1 0 ${LEAN} 1 ${-LEAN * FOOT} 0)`;
/** the front-plane outline of an opening, leaned (world coords: clip what is cut back into the wall to it) */
const leanRectD = (x0: number, y0: number, x1: number, y1: number) => pd([[lean(x0, y0), y0], [lean(x1, y0), y0], [lean(x1, y1), y1], [lean(x0, y1), y1]]);

/** the roof: the slope back from the eaves to the ridge, its courses (V5: no chimney stacks, so nothing on the ridge
 *  bites into LONDON as the roof rises over it) */
const Roof: React.FC<{ e: Eye }> = ({ e }) => {
  const a = 0.72;
  const x0 = HOUSE.x0;
  const x1 = HOUSE.x1;
  const zr = Z.ridge;
  const ze = Z.eaves;
  const slope = [HP(e, x0 - 10, ROOF.eaves, ze), HP(e, x1 + 10, ROOF.eaves, ze), HP(e, x1 - 16, ROOF.ridge, zr), HP(e, x0 + 16, ROOF.ridge, zr)];
  let tiles = "";
  [0.3, 0.55, 0.8].forEach((u) => {
    const y = ROOF.ridge + (ROOF.eaves - ROOF.ridge) * u;
    const zz = zr + (ze - zr) * u;
    const xa = x0 + 16 - 26 * u;
    const xb = x1 - 16 + 26 * u;
    const p = HP(e, xa + 6, y, zz);
    const q = HP(e, xb - 6, y, zz);
    tiles += `M${r2(p[0])} ${r2(p[1])}L${r2(q[0])} ${r2(q[1])}`;
  });
  return (
    <g>
      <path d={pd(slope)} fill={SLOPE} stroke={cream(a)} strokeWidth={LW.house} strokeLinejoin="round" />
      <path d={tiles} stroke={cream(0.16)} strokeWidth={LW.context} />
    </g>
  );
};

/** THE window, live: the casing (in the front), the opening cut back into the wall: the dark room and the two sashes
 *  at depth (the lower one thrown up behind the upper), the reveals; then the head and the sill standing proud */
const TheWindow: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => {
  const rise = (SASH_H - 8) * easeOut(lin(frame, T.sashUp[0], T.sashUp[1]));
  const ly0 = W1.y1 - SASH_H - rise;
  const sash = (y: number, key: string) => (
    <g key={key}>
      <rect x={W1.x0} y={y} width={W1.x1 - W1.x0} height={SASH_H} fill={TIMBER} stroke={cream(0.9)} strokeWidth={LW.house} />
      <Panes x0={W1.x0 + 10} y0={y + 10} x1={W1.x1 - 10} y1={y + SASH_H - 10} cols={2} rows={2} a={0.9} bar={5} />
    </g>
  );
  return (
    <g>
      <clipPath id="dl5-win-open">
        <path d={leanRectD(W1.x0, W1.y0, W1.x1, W1.y1)} />
      </clipPath>
      <g clipPath="url(#dl5-win-open)">
        <g transform={planeAt(e, Z.sash)}>
          <g transform={HOUSE_SKEW}>
            <rect x={W1.x0 - 60} y={W1.y0 - 60} width={W1.x1 - W1.x0 + 120} height={W1.y1 - W1.y0 + 120} fill={ROOM} />
            {sash(ly0, "lo")}
            {sash(W1.y0, "up")}
          </g>
        </g>
        <Reveals id="win-rev" e={e} x0={W1.x0} x1={W1.x1} y0={W1.y0} y1={W1.y1} zb={Z.sash} />
      </g>
    </g>
  );
};
/** the door and the shop window cut back into the wall */
const Openings: React.FC<{ e: Eye }> = ({ e }) => {
  const r = (DOOR.x1 - DOOR.x0) / 2;
  const doorD = `M${DOOR.x0} ${DOOR.y1}V${DOOR.y0}A${r} ${r} 0 0 1 ${DOOR.x1} ${DOOR.y0}V${DOOR.y1}Z`;
  return (
    <g>
      {/* the door: its reveal (the opening's jamb and arch, turned from the light), the leaf and fanlight set back */}
      <clipPath id="dl5-door-open">
        <path d={doorD} transform={HOUSE_SKEW} />
      </clipPath>
      <g clipPath="url(#dl5-door-open)">
        <path d={doorD} transform={HOUSE_SKEW} fill={SHADE} />
        <Shade id="door-rev" clip={doorD} box={[DOOR.x0 - 20, DOOR.y0 - r - 10, DOOR.x1 + 20, DOOR.y1]} />
        <g transform={planeAt(e, Z.door)}>
          <g transform={HOUSE_SKEW}>
            <path d={`M${DOOR.x0} ${DOOR.y0}A${r} ${r} 0 0 1 ${DOOR.x1} ${DOOR.y0}Z`} fill={GLASS} stroke={cream(0.45)} strokeWidth={LW.detail} />
            <rect x={DOOR.x0} y={DOOR.y0} width={DOOR.x1 - DOOR.x0} height={DOOR.y1 - DOOR.y0 + 30} fill={TIMBER} stroke={cream(0.55)} strokeWidth={LW.detail} />
            <rect x={DOOR.x0 + 14} y={DOOR.y0 + 16} width={DOOR.x1 - DOOR.x0 - 28} height={70} fill="none" stroke={cream(0.32)} strokeWidth={LW.context} />
            <rect x={DOOR.x0 + 14} y={DOOR.y0 + 100} width={DOOR.x1 - DOOR.x0 - 28} height={70} fill="none" stroke={cream(0.32)} strokeWidth={LW.context} />
          </g>
        </g>
      </g>
      {/* the shop window: the panes set back in the frame, its reveals */}
      <clipPath id="dl5-shop-open">
        <path d={leanRectD(SHOP.x0, SHOP.y0, SHOP.x1, SHOP.y1)} />
      </clipPath>
      <g clipPath="url(#dl5-shop-open)">
        <g transform={planeAt(e, Z.shopPanes)}>
          <g transform={HOUSE_SKEW}>
            <rect x={SHOP.x0 - 40} y={SHOP.y0 - 40} width={SHOP.x1 - SHOP.x0 + 80} height={SHOP.y1 - SHOP.y0 + 80} fill={GLASS} />
            <Panes x0={SHOP.x0} y0={SHOP.y0} x1={SHOP.x1} y1={SHOP.y1} cols={3} rows={2} a={0.6} bar={3} />
          </g>
        </g>
        <Reveals id="shop-rev" e={e} x0={SHOP.x0} x1={SHOP.x1} y0={SHOP.y0} y1={SHOP.y1} zb={Z.shopPanes} />
      </g>
    </g>
  );
};
/** the house, far to near: roof, front, openings, then what stands proud of the front */
const House: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => (
  <g>
    <Roof e={e} />
    <g transform={HOUSE_SKEW}>{HouseFront}</g>
    <TheWindow e={e} frame={frame} />
    <Openings e={e} />
    <Box id="eav" e={e} x0={EAVES.x0} x1={EAVES.x1} y0={EAVES.y0} y1={EAVES.y1} zf={Z.eaves} fill={PLANE} />
    <Box id="head" e={e} x0={HEAD.x0} x1={HEAD.x1} y0={HEAD.y0} y1={HEAD.y1} zf={Z.head} fill={PLANE} edge={0.9} />
    <Box id="sill" e={e} x0={SILL.x0} x1={SILL.x1} y0={SILL.y0} y1={SILL.y1} zf={Z.sill} fill={PLANE} edge={0.95} />
    <Box id="fas" e={e} x0={HOUSE.x0 - 6} x1={HOUSE.x1 + 6} y0={FASCIA.top} y1={FASCIA.bottom} zf={Z.fascia} fill={TIMBER} />
    <Box id="step" e={e} x0={STEP.x0} x1={STEP.x1} y0={STEP.y0} y1={STEP.y1} zf={Z.step} fill={PLANE} edge={0.5} shadow={false} />
    {NeighShadow}
  </g>
);

// ---------------------------------------------------------------------------
// THE STREET: one ground plane (y = FOOT) of setts from the house's foot toward us: rows compress toward the house,
// the joints run to the VP; the kennel a channel across it (its far inner wall lit, the sludge 14 below the street,
// the near lip); the near setts a little stronger than the far ones (atmospheric depth)
// ---------------------------------------------------------------------------
const SETT_W = 30;
const ROW_D = 23;
const K3 = KENNEL3;
/** the eq-space view box of the frame (world coords), with a margin */
const viewBox = (cam: Cam, m = 60) => ({ x0: cam.cx - 540 / cam.k - m, x1: cam.cx + 540 / cam.k + m, y1: cam.cy + 960 / cam.k + m });
/** the nearest street depth still in frame */
const zBottom = (e: Eye, cam: Cam) => {
  const yb = viewBox(cam).y1;
  return Math.max(-e.D + 40, (e.D * (FOOT - e.Y)) / (yb - e.Y) - e.D);
};
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
/** the setts of the rows between depths zA (far) and zB (near) */
const settRows = (e: Eye, cam: Cam, zA: number, zB: number, j0: number) => {
  const vb = viewBox(cam);
  const groups: { d: string; sh: string; t: number }[] = [0, 1, 2, 3].map((g) => ({ d: "", sh: "", t: g / 3 }));
  let j = j0;
  for (let zf = zA; zf > zB; zf -= ROW_D, j++) {
    const zn = Math.max(zB, zf - ROW_D);
    const s = depthScale(e, zf);
    const xa = e.X + (vb.x0 - e.X) / s;
    const xb = e.X + (vb.x1 - e.X) / s;
    const off = (j % 2) * SETT_W * 0.5;
    const g = groups[Math.max(0, Math.min(3, Math.floor((-zf / 260) * 3)))];
    for (let i = Math.floor((xa - off) / SETT_W) - 1; i <= Math.ceil((xb - off) / SETT_W); i++) {
      const x = i * SETT_W + off;
      const k = `${j}:${i}`;
      const gx0 = 1.5 + random(`ga${k}`) * 4.5;
      const gx1 = 1.5 + random(`gb${k}`) * 4.5;
      const gz = 2 + random(`gz${k}`) * 2.5;
      const X0 = x + gx0;
      const X1 = x + SETT_W - gx1;
      const Z0 = zf - gz;
      const Z1 = zn + gz;
      if (X1 - X0 < 6 || Z0 - Z1 < 4) continue;
      const c = 0.13;
      const oct = (dx: number, dz: number) => {
        const w = X1 - X0;
        const h = Z0 - Z1;
        const q: [number, number][] = [
          [X0 + w * c, Z0],
          [X1 - w * c, Z0],
          [X1, Z0 - h * c],
          [X1, Z1 + h * c],
          [X1 - w * c, Z1],
          [X0 + w * c, Z1],
          [X0, Z1 + h * c],
          [X0, Z0 - h * c],
        ];
        return pd(q.map(([xx, zz]) => proj(e, xx + dx, FOOT, zz + dz)));
      };
      g.sh += oct(1.6, -1.8);
      g.d += oct(0, 0);
    }
  }
  return groups;
};
const SettGroups: React.FC<{ groups: { d: string; sh: string; t: number }[]; quiet?: number }> = ({ groups, quiet = 1 }) => (
  <g>
    {groups.map((g, i) => {
      const sh = mix(STREET, SETT_SH, (0.45 + 0.55 * g.t) * quiet);
      const st = mix(STREET, SETT, (0.55 + 0.45 * g.t) * quiet);
      return (
        <g key={i}>
          <path d={g.sh} fill={sh} stroke={sh} strokeWidth={2.5} strokeLinejoin="round" />
          <path d={g.d} fill={st} stroke={st} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);
/** the street from the house to the kennel, the kennel's far wall and its sludge surface */
const StreetFar: React.FC<{ e: Eye; cam: Cam }> = ({ e, cam }) => {
  const vb = viewBox(cam, 80);
  const zb = zBottom(e, cam);
  const xr = (zz: number) => {
    const s = depthScale(e, zz);
    return [e.X + (vb.x0 - e.X) / s, e.X + (vb.x1 - e.X) / s];
  };
  const G = (x: number, y: number, zz: number) => proj(e, x, y, zz);
  const [ba, bb] = xr(zb);
  const [fa, fb] = xr(0);
  const base = pd([G(fa - 200, FOOT, 0), G(fb + 200, FOOT, 0), G(bb + 50, FOOT, zb), G(ba - 50, FOOT, zb)]);
  const [ka, kb] = xr(K3.zFar);
  const [na, nb] = xr(K3.zNear);
  const wall = pd([G(ka, FOOT, K3.zFar), G(kb, FOOT, K3.zFar), G(kb, SURF_Y, K3.zFar), G(ka, SURF_Y, K3.zFar)]);
  const surf = pd([G(ka, SURF_Y, K3.zFar), G(kb, SURF_Y, K3.zFar), G(nb, SURF_Y, K3.zNear), G(na, SURF_Y, K3.zNear)]);
  // the sheen along the sludge, and a dark wet line at the foot of the far wall
  let sheen = "";
  for (let x = Math.floor(ka / 30) * 30; x <= kb; x += 30) {
    const p = G(x, SURF_Y, K3.zFar - 16 - 3 * Math.sin(x * 0.05));
    sheen += `${sheen ? "L" : "M"}${r2(p[0])} ${r2(p[1])}`;
  }
  const foot = (z0: number, x0: number, x1: number) => pd([G(x0, FOOT, z0), G(x1, FOOT, z0), G(x1, FOOT, z0 - 16), G(x0, FOOT, z0 - 16)]);
  const groups = settRows(e, cam, 0, K3.zFar, 0);
  return (
    <g>
      <path d={base} fill={STREET} />
      <SettGroups groups={groups} />
      {/* contact: the street darkens where it meets the fronts */}
      <path d={foot(0, HOUSE.x0, HOUSE.x1 + 30)} fill="rgba(12,9,6,0.45)" />
      <path d={foot(Z.neighL, fa - 200, HOUSE.x0)} fill="rgba(12,9,6,0.4)" />
      <path d={foot(Z.neighR, HOUSE.x1, fb + 200)} fill="rgba(12,9,6,0.4)" />
      {/* the kennel: its far wall (lit, facing us), the sludge */}
      {/* the far inner wall (facing us, down in the channel's gloom) under the far lip's edge */}
      <path d={wall} fill={WALL_K} />
      <path d={`M${pd([G(ka, FOOT, K3.zFar), G(kb, FOOT, K3.zFar)]).slice(1, -1)}`} stroke={cream(0.5)} strokeWidth={LW.detail} fill="none" />
      <path d={surf} fill={SLUDGE} />
      <path d={`M${pd([G(ka, SURF_Y, K3.zFar), G(kb, SURF_Y, K3.zFar)]).slice(1, -1)}`} stroke="rgba(10,8,5,0.6)" strokeWidth={4} fill="none" />
      <path d={sheen} stroke={cream(0.2)} strokeWidth={1.6} fill="none" />
    </g>
  );
};
/** the street from the kennel's near lip toward us */
const StreetNear: React.FC<{ e: Eye; cam: Cam }> = ({ e, cam }) => {
  const zb = zBottom(e, cam);
  const vb = viewBox(cam, 80);
  const s = depthScale(e, K3.zNear);
  const ka = e.X + (vb.x0 - e.X) / s;
  const kb = e.X + (vb.x1 - e.X) / s;
  const G = (x: number, y: number, zz: number) => proj(e, x, y, zz);
  const lipBand = pd([G(ka, FOOT, K3.zNear), G(kb, FOOT, K3.zNear), G(kb, FOOT, K3.zNear - 12), G(ka, FOOT, K3.zNear - 12)]);
  const sb = depthScale(e, zb);
  const ba = e.X + (vb.x0 - e.X) / sb;
  const bb = e.X + (vb.x1 - e.X) / sb;
  const base = pd([G(ka, FOOT, K3.zNear), G(kb, FOOT, K3.zNear), G(bb + 50, FOOT, zb), G(ba - 50, FOOT, zb)]);
  const groups = settRows(e, cam, K3.zNear - 12, zb, 40);
  groups.forEach((g) => (g.t = 1));
  // the near street sinks into shadow toward the frame's bottom (the kennel and the splash stay the subject)
  const yLip = G(0, FOOT, K3.zNear)[1];
  const yTop = yLip + 90 / cam.k;
  const yBot = cam.cy + 960 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id="dl5-near-dark" gradientUnits="userSpaceOnUse" x1={0} y1={r2(yTop)} x2={0} y2={r2(yBot)}>
          <stop offset="0" stopColor="#0E0B08" stopOpacity={0} />
          <stop offset="0.55" stopColor="#0E0B08" stopOpacity={0.3} />
          <stop offset="1" stopColor="#0E0B08" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <path d={base} fill={STREET} />
      <SettGroups groups={groups} quiet={0.62} />
      {yBot > yTop ? <rect x={r2(cam.cx - 700 / cam.k)} y={r2(yTop)} width={r2(1400 / cam.k)} height={r2(yBot - yTop + 40)} fill="url(#dl5-near-dark)" /> : null}
      <path d={lipBand} fill={STONE} />
      <path d={`M${pd([G(ka, FOOT, K3.zNear), G(kb, FOOT, K3.zNear)]).slice(1, -1)}`} stroke={cream(0.45)} strokeWidth={LW.detail} fill="none" />
    </g>
  );
};

/** the sludge plane: a point on it (x, depth) -> world, and the scale of things lying on it (1 = V2's size at f79) */
const KS_REF = 1.42;
const onSludge = (e: Eye, x: number, zz: number) => proj(e, x, SURF_Y, zz);
const gsOf = (e: Eye, zz: number) => depthScale(e, zz) / KS_REF;
/** how open a circle lying on the plane y at depth z looks (ry / rx) */
const foreOf = (e: Eye, y: number, zz: number) => Math.max(0.05, (y - e.Y) / (e.D + zz));
const zInChannel = (u: number, m = 0) => K3.zFar - 8 - m - u * (K3.zFar - K3.zNear - 16 - 2 * m);

/** the sludge in the kennel, alive: slow ripples, a few lumps and straws, the odd bubble, all drifting downhill */
const Sludge: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => {
  const span = 1900;
  const drift = (i: number, sp = 0.6) => ((random(`sx${i}`) * span + frame * sp) % span) - 420;
  let rip = "";
  for (let i = 0; i < 36; i++) {
    const x = drift(i, 0.5 + random(`sv${i}`) * 0.3);
    const zz = zInChannel(random(`sy${i}`));
    const w = (18 + random(`sw${i}`) * 28) / KS_REF;
    const a = onSludge(e, x, zz);
    const b = onSludge(e, x + w, zz);
    const gs = gsOf(e, zz);
    rip += `M${r2(a[0])} ${r2(a[1])}Q${r2((a[0] + b[0]) / 2)} ${r2((a[1] + b[1]) / 2 - 3 * gs)} ${r2(b[0])} ${r2(b[1])}`;
  }
  const lumps: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const zz = zInChannel(random(`sy${100 + i}`), 6);
    const [x, yy] = onSludge(e, drift(100 + i, 0.55), zz);
    const gs = gsOf(e, zz);
    const r = (10 + random(`lr${i}`) * 8) * gs;
    lumps.push(
      <g key={i}>
        <path d={blobD(clotRing(x, yy - r * 0.3, r, 1, 0, `lp${i}`).map(([px, py]) => [px, yy - r * 0.3 + (py - (yy - r * 0.3)) * 0.7] as V2p))} fill="#4A3B2B" stroke={DARK} strokeWidth={1.8} />
        <path d={`M${r2(x - r * 0.9)} ${r2(yy - r * 0.5)}q${r2(r * 0.6)} ${r2(-r * 0.4)} ${r2(r * 1.2)} ${r2(-r * 0.2)}`} stroke={cream(0.4)} strokeWidth={1.4} fill="none" />
      </g>,
    );
  }
  let bits = "";
  for (let i = 0; i < 6; i++) {
    const x = drift(200 + i, 0.6);
    const zz = zInChannel(random(`sy${200 + i}`));
    const a = onSludge(e, x, zz);
    const b = onSludge(e, x + 22 / KS_REF, zz + 3);
    bits += `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}`;
  }
  const bub: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const per = 30 + Math.floor(random(`bp${i}`) * 14);
    const off = Math.floor(random(`bo${i}`) * per);
    const ph = (frame + off) % per;
    const cyc = Math.floor((frame + off) / per);
    const zz = zInChannel(random(`sy${300 + i}`), 6);
    const [x, yy] = onSludge(e, -100 + random(`bx${i}-${cyc}`) * 1300, zz);
    const gs = gsOf(e, zz);
    const fo = foreOf(e, SURF_Y, zz);
    if (ph < 10) bub.push(<circle key={i} cx={r2(x)} cy={r2(yy - (2 + ph * 0.7) * gs * 0.6)} r={r2((2 + ph * 0.7) * gs)} fill="#2E2318" stroke={cream(0.45)} strokeWidth={1.2} />);
    else if (ph < 13) bub.push(<ellipse key={i} cx={r2(x)} cy={r2(yy)} rx={r2((9 + (ph - 10) * 5) * gs)} ry={r2((9 + (ph - 10) * 5) * gs * fo)} fill="none" stroke={cream(0.35)} strokeWidth={1.2} />);
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

/** the refuse at the wall: one low mound (a volume: lit top-left, the right flank in shade, its shadow on the setts) */
const Heap: React.FC<{ e: Eye }> = ({ e }) => {
  const { cx, rx, z0, z1, h } = HEAP3;
  const zc = (z0 + z1) / 2;
  const rz = (z0 - z1) / 2;
  // the mound: height h * (1 - r^2)^0.7 over an ellipse footprint, gently lumpy; sampled, projected, its outline the
  // convex hull of the samples, nudged by a few low lumps
  const pts: V2p[] = [];
  for (let i = 0; i <= 28; i++) {
    for (let j = 0; j <= 8; j++) {
      const a = (i / 28) * Math.PI * 2;
      const rr = j / 8;
      const x = cx + Math.cos(a) * rx * rr;
      const zz = zc + Math.sin(a) * rz * rr;
      const y = FOOT - h * Math.pow(Math.max(0, 1 - rr * rr), 0.7);
      pts.push(proj(e, x, y, zz));
    }
  }
  const hl = hull(pts);
  const [hx0, , hx1] = bbox(hl);
  const outline: V2p[] = hl.map(([x, y], i) => {
    const u = (x - hx0) / Math.max(1, hx1 - hx0);
    const lump = y < proj(e, cx, FOOT, zc)[1] - 4 ? 5 * Math.sin(u * Math.PI * 3 + 0.6) * Math.sin(u * Math.PI) + 2 * random(`hp${i}`) : 0;
    return [x, y - lump];
  });
  const d = blobD(outline);
  // its shadow on the setts, offset to the right (the light from the upper left)
  const sh: V2p[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    sh.push(proj(e, cx + 34 + Math.cos(a) * rx * 1.08, FOOT, zc - 6 + Math.sin(a) * rz * 1.15));
  }
  const [bx0, by0, bx1, by1] = bbox(outline);
  const cxs = proj(e, cx, FOOT, zc)[0];
  return (
    <g>
      <path d={blobD(sh)} fill="rgba(12,9,6,0.42)" />
      <path d={d} fill="#2E241A" stroke={cream(0.32)} strokeWidth={LW.context} />
      <Shade id="heap-sh" clip={`${d}`} box={[cxs + 6, by0, bx1 + 4, by1]} />
      <clipPath id="heap-cl">
        <path d={d} />
      </clipPath>
      <path d={`M${r2(cxs + 4)} ${r2(by0 - 4)}H${r2(bx1 + 6)}V${r2(by1 + 4)}H${r2(cxs + 14)}Z`} fill="rgba(12,9,6,0.35)" clipPath="url(#heap-cl)" />
      <path d={`M${r2(bx0 + (cxs - bx0) * 0.25)} ${r2(by0 + (by1 - by0) * 0.35)}Q${r2(bx0 + (cxs - bx0) * 0.6)} ${r2(by0 + 2)} ${r2(cxs)} ${r2(by0 + 3)}`} stroke={cream(0.28)} strokeWidth={1.6} fill="none" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FOREARM AND THE CHAMBER POT (the live subject; V2's drawing, held out at depth Z.pot)
// ---------------------------------------------------------------------------
const POT_BODY = "M40 -60C6 -46 10 40 62 62H158C210 40 214 -46 180 -60Z";
const POT_CLIP = "dl-pot-body";
const PotShape: React.FC<{ full: number }> = ({ full }) => (
  <g>
    <path d="M44 -42C-10 -54 -20 26 44 22" stroke={DARK} strokeWidth={20} fill="none" />
    <path d="M44 -42C-10 -54 -20 26 44 22" stroke={INK_DEEP} strokeWidth={12} fill="none" />
    <path d="M30 -44C2 -44 -6 -8 4 6" stroke="#FFF7E2" strokeOpacity={0.6} strokeWidth={3} fill="none" strokeLinecap="round" />
    <rect x={62} y={56} width={96} height={14} rx={4} fill={INK_DEEP} stroke={DARK} strokeWidth={3.6} />
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
    <path d="M24 -34Q110 -20 196 -34" stroke={DARK} strokeOpacity={0.55} strokeWidth={2} fill="none" />
    <path d="M44 -26C30 -8 32 16 46 32" stroke="#FFF7E2" strokeOpacity={0.8} strokeWidth={6} fill="none" strokeLinecap="round" />
    <ellipse cx={110} cy={-66} rx={96} ry={17} fill={INK} stroke={DARK} strokeWidth={4} />
    <ellipse cx={110} cy={-66} rx={80} ry={11} fill={DARK} />
    {full > 0.02 ? <ellipse cx={110 + 22 * (1 - full)} cy={-65} rx={r2(72 * (0.4 + 0.6 * full))} ry={r2(8 * (0.5 + 0.5 * full))} fill={SLOP_D} /> : null}
    {full > 0.02 ? <path d={`M${r2(70 + 20 * (1 - full))} -68q22 -3 40 0`} stroke={cream(0.45)} strokeWidth={1.6} fill="none" /> : null}
  </g>
);
/** the arm and the pot in their own coordinates (= their 3D x, y at depth Z.pot); `pre` keeps the ids apart */
const ArmAndPotBody: React.FC<{ frame: number; pre: string }> = ({ frame, pre }) => {
  const g = gripAt(frame);
  const th = tipAngle(frame);
  const piv = potPoint(frame, [0, 0]);
  const elbow: V2p = [g[0] + ELBOW_OFF[0], g[1] + ELBOW_OFF[1]];
  const dx = g[0] - elbow[0];
  const dy = g[1] - elbow[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  const wrist: V2p = [g[0] - ux * 18, g[1] - uy * 18];
  const we = 40;
  const ww = 26;
  const mx = (elbow[0] + wrist[0]) / 2;
  const my = (elbow[1] + wrist[1]) / 2;
  const wm = (we + ww) / 2 + 5;
  const sleeve = `M${r2(elbow[0] + nx * we)} ${r2(elbow[1] + ny * we)}Q${r2(mx + nx * wm * 1.1)} ${r2(my + ny * wm * 1.1)} ${r2(wrist[0] + nx * ww)} ${r2(wrist[1] + ny * ww)}Q${r2(wrist[0] + ux * 6)} ${r2(wrist[1] + uy * 6)} ${r2(wrist[0] - nx * ww)} ${r2(wrist[1] - ny * ww)}Q${r2(mx - nx * wm * 1.15)} ${r2(my - ny * wm * 1.15)} ${r2(elbow[0] - nx * we)} ${r2(elbow[1] - ny * we)}Z`;
  let sh = "";
  for (let i = 0; i < 6; i++) {
    const t0 = 0.1 + i * 0.13;
    const p = [elbow[0] + dx * t0, elbow[1] + dy * t0];
    const wv = we + (ww - we) * t0;
    sh += `M${r2(p[0] - nx * wv * 0.15)} ${r2(p[1] - ny * wv * 0.15)}L${r2(p[0] - nx * wv * 0.95)} ${r2(p[1] - ny * wv * 0.95)}`;
  }
  let folds = "";
  [0.5, 0.7].forEach((t0) => {
    const p = [elbow[0] + dx * t0, elbow[1] + dy * t0];
    const wv = (we + (ww - we) * t0) * 0.85;
    folds += `M${r2(p[0] + nx * wv)} ${r2(p[1] + ny * wv)}Q${r2(p[0] + ux * 9)} ${r2(p[1] + uy * 9)} ${r2(p[0] - nx * wv * 0.6)} ${r2(p[1] - ny * wv * 0.6)}`;
  });
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  const full = frame < T.pour[0] ? 1 : 1 - lin(frame, T.pour[0], T.pour[1]);
  return (
    <g>
      <defs>
        <linearGradient id={`${pre}-arm-dark`} gradientUnits="userSpaceOnUse" x1={elbow[0]} y1={elbow[1]} x2={wrist[0]} y2={wrist[1]}>
          <stop offset="0" stopColor={ROOM} stopOpacity={1} />
          <stop offset="0.3" stopColor={ROOM} stopOpacity={0.35} />
          <stop offset="0.5" stopColor={ROOM} stopOpacity={0} />
          <stop offset="1" stopColor={ROOM} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={sleeve} fill={COAT} stroke={DARK} strokeWidth={3} />
      <path d={sleeve} fill="none" stroke={cream(0.8)} strokeWidth={2.1} />
      <path d={sh} stroke={cream(0.4)} strokeWidth={1.3} />
      <path d={folds} stroke={cream(0.55)} strokeWidth={1.5} fill="none" />
      <path d={sleeve} fill={`url(#${pre}-arm-dark)`} />
      <g transform={`translate(${r2(piv[0])} ${r2(piv[1])}) rotate(${th.toFixed(3)})`}>
        <PotShape full={full} />
      </g>
      <g transform={`translate(${r2(wrist[0])} ${r2(wrist[1])}) rotate(${ang.toFixed(3)})`}>
        <path d="M-6 -23Q4 -16 -1 -8Q7 0 -1 8Q4 16 -6 23L8 22Q15 11 10 0Q15 -11 8 -22Z" fill={INK} stroke={DARK} strokeWidth={2.4} />
      </g>
      <g transform={`translate(${r2(g[0])} ${r2(g[1])}) rotate(${(ang + th * 0.35).toFixed(3)}) scale(1.3)`}>
        <path d="M-20 -13Q-6 -19 6 -14Q16 -10 15 0Q16 10 6 14Q-6 18 -20 12Z" fill={INK_DEEP} stroke={DARK} strokeWidth={3.2} />
        <path d="M2 -12Q9 -7 8 -1M4 -2Q11 2 9 7M2 6Q8 10 5 13" stroke={DARK} strokeWidth={2.1} fill="none" />
        <path d="M-8 -14Q2 -24 12 -16" stroke={DARK} strokeWidth={2.9} fill={INK_DEEP} />
      </g>
    </g>
  );
};
/** the arm and pot at their depth, and (once out of the room) their soft shadow on the house front */
const ArmAndPot: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => {
  const out = lin(frame, T.armOut[0] - 1, T.armOut[1]);
  if (out <= 0) return null;
  const lit = sstep(out);
  const [ox, oy] = wallShadowOffset(Z.pot);
  // never in front of the window's left jamb (the elbow is in the room); while the pot is lifted out of the room,
  // nothing below the opening's bottom (the wall below hides it). World coords (the front plane).
  const clipX = lean(W1.x0, 1960) + 1;
  const clipY = frame < T.armOut[1] ? W1.y1 : 4000;
  return (
    <g>
      <defs>
        <clipPath id="dl5-arm-clip">
          <rect x={clipX} y={0} width={2400} height={clipY} />
        </clipPath>
        <clipPath id="dl5-front">
          <path d={leanRectD(HOUSE.x0, ROOF.eaves, HOUSE.x1, FOOT)} />
        </clipPath>
        <filter id="dl5-cast" x="-20%" y="-20%" width="140%" height="140%">
          <feColorMatrix type="matrix" values={`0 0 0 0 0.04  0 0 0 0 0.03  0 0 0 0 0.02  0 0 0 ${r2(0.4 * lit)} 0`} />
          <feGaussianBlur stdDeviation={2.5} />
        </filter>
        {lit < 1 ? (
          <filter id="dl-sunk">
            <feComponentTransfer>
              <feFuncR type="linear" slope={r2(0.25 + 0.75 * lit)} />
              <feFuncG type="linear" slope={r2(0.25 + 0.75 * lit)} />
              <feFuncB type="linear" slope={r2(0.25 + 0.75 * lit)} />
            </feComponentTransfer>
          </filter>
        ) : null}
      </defs>
      {/* the cast shadow on the wall (z 0): the drawing moved down-right by the light over its 60 px of depth */}
      {lit > 0.3 ? (
        <g clipPath="url(#dl5-front)">
          <g clipPath="url(#dl5-arm-clip)">
            <g transform={`translate(${r2(ox)} ${r2(oy)})`} filter="url(#dl5-cast)">
              <ArmAndPotBody frame={frame} pre="dl5s" />
            </g>
          </g>
        </g>
      ) : null}
      <g clipPath="url(#dl5-arm-clip)">
        <g transform={planeAt(e, Z.pot)} filter={lit < 1 ? "url(#dl-sunk)" : undefined}>
          <ArmAndPotBody frame={frame} pre="dl5a" />
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SLOP (V5: in 3D): one stream of particles thrown from the lip (at depth Z.pot) out over the street toward us,
// onto the sludge surface (SURF_Y) at the kennel's middle; gravity solved so the first slop meets it on T.contact
// ---------------------------------------------------------------------------
type Drop = { te: number; p0: P3; v: P3; ti: number; flux: number; hit: P3 };
const POUR_STEP = 0.25;
const POUR_FULL_UNTIL = 81;
const SLOP_VX = 7.5;
const SLOP_VZ = (K3.hitZ - Z.pot) / (T.contact - T.pour[0]);
const fluxAt = (te: number) => {
  if (te < T.pour[0] || te > T.pour[1]) return 0;
  const rise = Math.min(1, 0.4 + (te - T.pour[0]) / 1.0);
  if (te <= POUR_FULL_UNTIL) return rise;
  const u = (te - POUR_FULL_UNTIL) / (T.pour[1] - POUR_FULL_UNTIL);
  return Math.pow(Math.cos(u * (Math.PI / 2)), 1.3);
};
const impactT = (y0: number, vy: number, g: number, yS: number) => (-vy + Math.sqrt(vy * vy + 2 * g * (yS - y0))) / g;
const vyOf = (te: number) => {
  const p0 = lipAt(te);
  const p1 = lipAt(te + 0.5);
  return SLOP_V0[1] + 0.3 * (p1[1] - p0[1]) * 2 + 0.6 * Math.max(0, te - POUR_FULL_UNTIL);
};
const SLOP_G = (() => {
  const t = T.contact - T.pour[0];
  const p0 = lipAt(T.pour[0]);
  return (2 * (SURF_Y - p0[1] - vyOf(T.pour[0]) * t)) / (t * t);
})();
const STREAM: Drop[] = (() => {
  const out: Drop[] = [];
  for (let te = T.pour[0]; te <= T.pour[1] + 1e-6; te += POUR_STEP) {
    const l = lipAt(te);
    const p0: P3 = [l[0], l[1], Z.pot];
    const v: P3 = [SLOP_VX, vyOf(te), SLOP_VZ];
    const ti = impactT(p0[1], v[1], SLOP_G, SURF_Y);
    out.push({ te, p0, v, ti, flux: fluxAt(te), hit: [p0[0] + v[0] * ti, SURF_Y, p0[2] + v[2] * ti] });
  }
  return out;
})();
const dropPos = (d: Drop, f: number): P3 => {
  const t = f - d.te;
  return [d.p0[0] + d.v[0] * t, d.p0[1] + d.v[1] * t + 0.5 * SLOP_G * t * t, d.p0[2] + d.v[2] * t];
};
/** the splash droplets: thrown from the impacts, landing on the sludge or on the setts beside the kennel */
type Fleck = { t0: number; p0: P3; v: P3; tl: number; land: P3; r: number };
const FLECK_G = SLOP_G * 0.55;
const FLECKS: Fleck[] = (() => {
  const out: Fleck[] = [];
  STREAM.forEach((d, i) => {
    if (i % 2 || d.flux < 0.25) return;
    for (let j = 0; j < 2; j++) {
      const s = `${i}-${j}`;
      const side = random(`fs${s}`) < 0.5 ? -1 : 1;
      const v: P3 = [(side * (5 + random(`fv${s}`) * 9)) / KS_REF, (-(3 + random(`fu${s}`) * 6) * Math.sqrt(d.flux)) / 1.1, -2.2 + random(`fd${s}`) * 4.4];
      // first crossing of the street's level on the way down; if that is over the channel, on to the sludge
      let tl = impactT(d.hit[1], v[1], FLECK_G, FOOT);
      let zl = d.hit[2] + v[2] * tl;
      let yl = FOOT;
      if (!(zl > K3.zFar || zl < K3.zNear) || Number.isNaN(tl)) {
        tl = impactT(d.hit[1], v[1], FLECK_G, SURF_Y);
        zl = d.hit[2] + v[2] * tl;
        yl = SURF_Y;
      }
      out.push({ t0: d.te + d.ti, p0: d.hit, v, tl, land: [d.hit[0] + v[0] * tl, yl, zl], r: (2.6 + random(`fr${s}`) * 3) / 1.15 });
    }
  });
  return out;
})();
const IMPACT: P3 = (() => {
  let sx = 0;
  let sz = 0;
  let w = 0;
  STREAM.forEach((d) => {
    sx += d.hit[0] * d.flux;
    sz += d.hit[2] * d.flux;
    w += d.flux;
  });
  return [sx / w, SURF_Y, sz / w];
})();

/** THE POUR: V2's one continuous tapered pour, widest at the lip and thinning as it falls, now drawn from 3D: it comes
 *  toward us as it falls, so perspective widens and spreads it; it breaks into drops only near the sludge and, at the
 *  end, where the emptying pot gives only a dribble; the tail leaves the lip first and falls away */
const Stream: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => {
  const f = frame;
  type Pt = { p: V2p; w: number; te: number; fl: number; frac: number; u: V2p; i: number };
  const sPot = depthScale(e, Z.pot);
  const pts: Pt[] = [];
  STREAM.forEach((d, i) => {
    if (!(d.te <= f && f < d.te + d.ti)) return;
    const age = f - d.te;
    const q = dropPos(d, f);
    const q2 = dropPos(d, f + 0.25);
    const p = proj(e, q[0], q[1], q[2]);
    const p2 = proj(e, q2[0], q2[1], q2[2]);
    const vl = Math.hypot(p2[0] - p[0], p2[1] - p[1]) || 1;
    const persp = depthScale(e, q[2]) / sPot;
    const w = (4 + 58 * d.flux) * Math.max(0.42, 1 - 0.036 * age) * (1 + Math.min(0.12, 0.016 * age) * Math.sin(d.te * 2.2) + 0.025 * Math.sin(d.te * 5.3 + 1)) * persp;
    pts.push({ p, w, te: d.te, fl: d.flux, frac: (q[1] - d.p0[1]) / (SURF_Y - d.p0[1]), u: [(p2[0] - p[0]) / vl, (p2[1] - p[1]) / vl], i });
  });
  if (f >= T.pour[0] && f <= T.pour[1]) {
    const l = lipAt(f);
    pts.push({ p: proj(e, l[0], l[1], Z.pot), w: (4 + 58 * fluxAt(f)) * 1, te: f, fl: fluxAt(f), frac: 0, u: [0.6, 0.8], i: -1 });
  }
  pts.sort((a, b) => b.te - a.te);
  const tearTe = f <= 88 ? 99 : POUR_FULL_UNTIL - (f - 88) * 1.1;
  const inBody = (q: Pt) => q.frac < 0.92 && q.fl >= 0.3 && q.te < tearTe;
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
    if (q.i >= 0 && q.i % (q.te >= tearTe ? 3 : 4) === 0) {
      const r = Math.max(3, q.w * 0.3);
      drops.push(<ellipse key={`d${q.i}`} cx={r2(q.p[0])} cy={r2(q.p[1])} rx={r2(r)} ry={r2(r * 1.5)} transform={`rotate(${r2((Math.atan2(q.u[1], q.u[0]) * 180) / Math.PI - 90)} ${r2(q.p[0])} ${r2(q.p[1])})`} fill={SLOP} stroke={DARK} strokeWidth={1.6} />);
    }
  });
  if (cur.length) runs.push(cur);
  const bodies: React.ReactNode[] = [];
  runs.forEach((run, j) => {
    if (run.length < 2) return;
    const L: V2p[] = [];
    const R: V2p[] = [];
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
      if (q.fl >= 0.7) SH.push(`${r2(q.p[0] - nx * hw * 0.35)} ${r2(q.p[1] - ny * hw * 0.35)}`);
    });
    const head = run[run.length - 1];
    const ringPts: V2p[] = [...L, [head.p[0] + head.u[0] * head.w * 0.8, head.p[1] + head.u[1] * head.w * 0.8], ...R.slice().reverse()];
    bodies.push(
      <g key={j}>
        <path d={blobD(ringPts)} fill={SLOP} stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
        {SH.length > 3 ? <path d={`M${SH.slice(1, -1).join("L")}`} stroke={SHEEN} strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
      </g>,
    );
  });
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

/** the splash ON the plane: the wet patch, the rings running out across the sludge, the spatter (in or beside the
 *  channel: `where` picks the flecks that landed in the channel or on the setts) */
const SplashPlane: React.FC<{ e: Eye; frame: number; where: "channel" | "street" }> = ({ e, frame, where }) => {
  const f = frame;
  const spatter: React.ReactNode[] = [];
  FLECKS.forEach((k, i) => {
    const t = f - k.t0;
    if (t < k.tl) return;
    const inCh = k.land[1] === SURF_Y;
    if ((where === "channel") !== inCh) return;
    const grow = Math.min(1, (t - k.tl) / 3);
    const p = proj(e, k.land[0], k.land[1], k.land[2]);
    const s = depthScale(e, k.land[2]);
    const rx = k.r * (1.2 + 0.6 * grow) * s;
    spatter.push(<ellipse key={i} cx={r2(p[0])} cy={r2(p[1])} rx={r2(rx)} ry={r2(rx * foreOf(e, k.land[1], k.land[2]))} fill={SLOP_D} stroke="rgba(23,18,13,0.6)" strokeWidth={0.8} />);
  });
  if (where === "street") return <g>{spatter}</g>;
  const rings: React.ReactNode[] = [];
  STREAM.forEach((d, i) => {
    if (!(d.flux < 0.6 || i % 7 === 3)) return;
    const u = (f - (d.te + d.ti)) / 13;
    if (u < 0 || u >= 1) return;
    const p = onSludge(e, d.hit[0], d.hit[2]);
    const rx = (6 + 34 * u) * gsOf(e, d.hit[2]);
    rings.push(<ellipse key={`rg${i}`} cx={r2(p[0])} cy={r2(p[1])} rx={r2(rx)} ry={r2(rx * foreOf(e, SURF_Y, d.hit[2]))} fill="none" stroke={cream(0.5 * (1 - u))} strokeWidth={1.6} />);
  });
  [0, 5].forEach((lag) => {
    const u = (f - T.contact - lag) / 16;
    if (u < 0 || u >= 1) return;
    const p = onSludge(e, IMPACT[0], IMPACT[2]);
    const rx = (24 + 110 * u) * gsOf(e, IMPACT[2]);
    rings.push(<ellipse key={`hit${lag}`} cx={r2(p[0])} cy={r2(p[1])} rx={r2(rx)} ry={r2(rx * foreOf(e, SURF_Y, IMPACT[2]))} fill="none" stroke={cream(0.55 * (1 - u))} strokeWidth={2} />);
  });
  return (
    <g>
      {spatter}
      {rings}
    </g>
  );
};
/** the splash in the air: the churning crown where the stream lands, and the flecks thrown out */
const SplashAir: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => {
  const f = frame;
  let rate = 0;
  let hx = 0;
  let hz = 0;
  STREAM.forEach((d) => {
    const tl = d.te + d.ti;
    if (tl <= f && tl > f - 3) {
      rate += d.flux;
      hx += d.hit[0] * d.flux;
      hz += d.hit[2] * d.flux;
    }
  });
  const crown: React.ReactNode[] = [];
  if (rate > 0.01) {
    const zz = hz / rate;
    const [cx, cy] = onSludge(e, hx / rate, zz);
    const gs = gsOf(e, zz);
    const I = Math.min(1, rate / 9);
    const hw = (30 + 22 * I) * gs;
    const hh = (14 + 16 * I) * gs;
    const fo = foreOf(e, SURF_Y, zz);
    let mound = `M${r2(cx - hw)} ${r2(cy)}`;
    for (let i = 1; i < 12; i++) {
      const u = i / 12;
      const x = cx - hw + 2 * hw * u;
      const y = cy - hh * Math.sin(u * Math.PI) * (0.7 + 0.6 * random(`mn${i}-${f}`));
      mound += `L${r2(x)} ${r2(y)}`;
    }
    mound += `L${r2(cx + hw)} ${r2(cy)}Z`;
    crown.push(<ellipse key="b" cx={r2(cx)} cy={r2(cy)} rx={r2((48 + 26 * I) * gs)} ry={r2((48 + 26 * I) * gs * fo * 0.6)} fill={SLOP} stroke={DARK} strokeWidth={2.1} />);
    crown.push(<path key="mound" d={mound} fill={SLOP} stroke={DARK} strokeWidth={2} strokeLinejoin="round" />);
    [-0.7, 0.65].forEach((sv, i) => {
      const len = (12 + 16 * random(`sp${i}-${f}`)) * (0.6 + 0.4 * I) * gs;
      const bx = cx + sv * hw * 0.8;
      const by = cy - hh * 0.5;
      crown.push(<path key={`sp${i}`} d={`M${r2(bx)} ${r2(by)}L${r2(bx + sv * len * 0.9)} ${r2(by - len)}`} stroke={DARK} strokeWidth={7} strokeLinecap="round" />);
      crown.push(<path key={`sq${i}`} d={`M${r2(bx)} ${r2(by)}L${r2(bx + sv * len * 0.9)} ${r2(by - len)}`} stroke={SLOP} strokeWidth={4} strokeLinecap="round" />);
    });
  }
  const flecks: React.ReactNode[] = [];
  FLECKS.forEach((k, i) => {
    const t = f - k.t0;
    if (t < 0 || t >= k.tl) return;
    const q: P3 = [k.p0[0] + k.v[0] * t, k.p0[1] + k.v[1] * t + 0.5 * FLECK_G * t * t, k.p0[2] + k.v[2] * t];
    const p = proj(e, q[0], q[1], q[2]);
    flecks.push(<circle key={i} cx={r2(p[0])} cy={r2(p[1])} r={r2(k.r * depthScale(e, q[2]))} fill={SLOP} stroke={DARK} strokeWidth={1.2} />);
  });
  return (
    <g>
      {crown}
      {flecks}
    </g>
  );
};

/** the slop in the kennel: from the impact it runs on along the channel (mostly downhill, to the right); the wet patch */
const Run: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => {
  const t = frame - T.contact;
  if (t < 0) return null;
  const cx = IMPACT[0];
  const xR = cx + (24 + 90 * (1 - Math.exp(-t / 14))) / KS_REF;
  const xL = cx - (24 + 120 * (1 - Math.exp(-t / 12))) / KS_REF;
  const zm = (K3.zFar + K3.zNear) / 2;
  const half = (K3.zFar - K3.zNear) / 2 - 7;
  const N = 26;
  const far: V2p[] = [];
  const near: V2p[] = [];
  for (let i = 0; i <= N; i++) {
    const x = xL + ((xR - xL) * i) / N;
    const dist = x < cx ? (cx - x) / Math.max(1, cx - xL) : (x - cx) / Math.max(1, xR - cx);
    const hw = half * (0.2 + 0.8 * Math.sqrt(Math.max(0, 1 - dist * dist)));
    const lobe = (5 * Math.sin(i * 1.9 + 0.7) + 3 * Math.sin(i * 3.7 + t * 0.12)) * 0.7;
    far.push(onSludge(e, x, zm + hw - lobe));
    near.push(onSludge(e, x, zm - hw + lobe * 0.7));
  }
  const d = blobD([...far, ...near.reverse()]);
  let rip = "";
  for (let i = 0; i < 10; i++) {
    const span = xR - xL - 28;
    if (span <= 8) break;
    const u = (random(`rr${i}`) + (t * (0.6 + random(`rv${i}`) * 0.6)) / Math.max(42, span * KS_REF)) % 1;
    const x = xL + 14 + u * span;
    const zz = zm - 8 + random(`ry${i}`) * 16;
    const a = onSludge(e, x, zz);
    const b = onSludge(e, x + 16 / KS_REF, zz);
    rip += `M${r2(a[0])} ${r2(a[1])}Q${r2((a[0] + b[0]) / 2)} ${r2((a[1] + b[1]) / 2 - 2.5)} ${r2(b[0])} ${r2(b[1])}`;
  }
  let bits = "";
  for (let i = 0; i < 4; i++) {
    const x = cx + (-40 + random(`rb${i}`) * 100 + t * (0.5 + 0.3 * i)) / KS_REF;
    if (x > xR - 10) continue;
    const a = onSludge(e, x, zm + 8 - i * 5);
    const b = onSludge(e, x + 16 / KS_REF, zm + 6 - i * 5);
    bits += `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}`;
  }
  const st = easeOut(t / 14);
  const stain: V2p[] = [];
  for (let j = 0; j < 9; j++) {
    const a = (j / 9) * Math.PI * 2;
    const rr = 0.8 + 0.35 * random(`st${j}`);
    stain.push(onSludge(e, cx + (Math.cos(a) * (36 + 40 * st) * rr) / KS_REF, IMPACT[2] + Math.sin(a) * (14 + 10 * st) * rr));
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

/** drips: from the pot's lip after the pour and from the sill's front edge; each falls straight down onto the setts at
 *  the wall's foot and rings its little wet spot */
const DRIPS: { from: "lip" | "sill"; t0: number }[] = [
  { from: "lip", t0: 92 },
  { from: "sill", t0: 85 },
  { from: "lip", t0: 99 },
  { from: "sill", t0: 97 },
  { from: "lip", t0: 108 },
];
const SILL_DRIP_X = 606;
const Drips: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => {
  const out: React.ReactNode[] = [];
  const wet = easeOut(lin(frame, 64, 74));
  const sx = lean(SILL_DRIP_X, SILL.y1);
  if (wet > 0) {
    const zs = Z.sill;
    out.push(<path key="sw" d={pd([proj(e, sx - 34 * wet, SILL.y0 + 1, zs), proj(e, sx + 26 * wet, SILL.y0 + 1, zs), proj(e, sx + 26 * wet, SILL.y1, zs), proj(e, sx - 34 * wet, SILL.y1, zs)])} fill={SLOP} opacity={0.85} />);
    const b = proj(e, sx, SILL.y1, zs);
    out.push(<path key="sw2" d={`M${r2(b[0] - 3)} ${r2(b[1])}q3 ${r2(8 * wet)} 6 0`} fill={SLOP} />);
  }
  DRIPS.forEach((d, i) => {
    const grow = 5;
    const t = frame - d.t0;
    if (t < -grow) return;
    const l = lipAt(Math.min(frame, d.t0));
    const src: P3 = d.from === "lip" ? [l[0], l[1], Z.pot] : [sx, SILL.y1 + 2, Z.sill];
    const s = depthScale(e, src[2]);
    if (t < 0) {
      const g = (t + grow) / grow;
      const p = proj(e, src[0], src[1] + 3 * g, src[2]);
      out.push(<ellipse key={i} cx={r2(p[0])} cy={r2(p[1])} rx={r2((2 + 2 * g) * s)} ry={r2((2.5 + 3 * g) * s)} fill={SLOP} stroke={DARK} strokeWidth={1.1} />);
      return;
    }
    const tl = impactT(src[1], 0, SLOP_G, FOOT);
    if (t < tl) {
      const p = proj(e, src[0], src[1] + 0.5 * SLOP_G * t * t, src[2]);
      out.push(<ellipse key={i} cx={r2(p[0])} cy={r2(p[1])} rx={r2(3.6 * s)} ry={r2((4.5 + Math.min(5, t * 0.6)) * s)} fill={SLOP} stroke={DARK} strokeWidth={1.1} />);
      return;
    }
    const u = (t - tl) / 12;
    const p = proj(e, src[0], FOOT, src[2]);
    const fo = foreOf(e, FOOT, src[2]);
    out.push(<ellipse key={`w${i}`} cx={r2(p[0])} cy={r2(p[1])} rx={r2(7 * s)} ry={r2(7 * s * fo)} fill={SLOP_D} opacity={0.9} />);
    if (u < 1) out.push(<ellipse key={i} cx={r2(p[0])} cy={r2(p[1])} rx={r2((4 + 16 * u) * s)} ry={r2((4 + 16 * u) * s * fo)} fill="none" stroke={cream(0.45 * (1 - u))} strokeWidth={1.4} />);
  });
  return <g>{out}</g>;
};

/** flies: tiny cream specks on looping paths round the refuse heap (3D, so they swing nearer and farther) */
const Flies: React.FC<{ e: Eye; frame: number }> = ({ e, frame }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const k = `k${i}`;
    const w = 0.1 + random(`fw${k}`) * 0.05;
    const ph = random(`fp${k}`) * 6.28;
    const rx = 60 * (0.6 + random(`fx${k}`) * 0.7);
    const ry = 22 * (0.6 + random(`fy${k}`) * 0.7);
    const t = frame * w + ph;
    const x = 760 + rx * Math.sin(t) + 14 * Math.sin(2.7 * t + i);
    const y = FOOT - 58 - random(`fh${k}`) * 26 + ry * 0.8 * Math.sin(2 * t + ph) + 5 * Math.cos(3.3 * t);
    const zz = HEAP3.z1 * 0.5 - 40 * Math.cos(t);
    const [px, py] = proj(e, x, y, zz);
    const s = depthScale(e, zz);
    const flap = Math.sin(frame * 2.9 + i) > 0 ? 1 : 0.4;
    out.push(
      <g key={k} transform={`translate(${r2(px)} ${r2(py)}) scale(${r2(s)})`}>
        <ellipse cx={-2.4} cy={-2.2} rx={2.4} ry={r2(1.1 + flap)} fill={cream(0.4)} />
        <ellipse cx={2.4} cy={-2.2} rx={2.4} ry={r2(1.1 + flap)} fill={cream(0.4)} />
        <circle cx={0} cy={0} r={2.8} fill={INK} stroke={DARK} strokeWidth={1.3} />
      </g>,
    );
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// THE COMPOSITION: far to near (painter's order follows depth on every frame)
// ---------------------------------------------------------------------------
const DisgustingLondonV5: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const e = eyeOf(cam);
  return (
    <TexcocoPage cam={cam} vignette={0.3}>
      <WorldSvg cam={cam}>
        <FarLayers e={e} cam={cam} frame={frame} />
        <StreetFar e={e} cam={cam} />
        <Sludge e={e} frame={frame} />
        <Run e={e} frame={frame} />
        <SplashPlane e={e} frame={frame} where="channel" />
        <StreetNear e={e} cam={cam} />
        <SplashPlane e={e} frame={frame} where="street" />
        <House e={e} frame={frame} />
        <Neighbours e={e} />
        <Heap e={e} />
        <Drips e={e} frame={frame} />
        <ArmAndPot e={e} frame={frame} />
        <Stream e={e} frame={frame} />
        <SplashAir e={e} frame={frame} />
        <Flies e={e} frame={frame} />
      </WorldSvg>
    </TexcocoPage>
  );
};

export default DisgustingLondonV5;
