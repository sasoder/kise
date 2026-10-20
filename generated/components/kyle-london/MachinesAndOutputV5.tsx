// ---------------------------------------------------------------------------
// MachinesAndOutputV5 (kyle-london, cut 42): the DEPTH pass (notes/DEPTH.md) on V4 (V3's picture, V2-style camera).
// V5: one perspective camera rides on V4's approved 2D camera (the front plane = the data line, exact); the output line
// is the front edge of a landform receding to the VP; the slab, the bed, the table, the engine and the boiler are
// volumes on it; contact shadows and the cast's form shadow; parallax from the dolly (machinesAndOutputPlanV5.ts,
// THE DEPTH CAMERA; the shared kit ./londonDepth.tsx). Dwarkesh map style
// (styles/dwarkesh-map.md). Opaque 1080x1920, 29.97 fps, 336 frames, the umber page with no map
// (kits/maps TexcocoPage). The people come from the redesigned shared London cast (./londonCastV2.tsx, read
// only; V4 changes for it: Newton's eye solve and crouch, his far hand on the tube and near hand on the table at
// the eyepiece so no sleeve crosses his face, the engineer's pointing hand pulled clear of the flywheel rim);
// the chart world, the engine geometry, the timeline and the camera are in ./machinesAndOutputPlanV4.ts,
// the data in ./englandGdpData.ts. V1 (cut 10's machine pulling back onto the line) is kept buildable as
// ./MachinesAndOutputEngine.tsx.
//
// CHECK LINE: "Real people (astronomers at their telescopes, engineers at their engines) made the
// discoveries and the machines, and England's output per person climbed after them."
//
// THE LINE: "you've got people who are making the most fundamental discoveries about the nature of the
// universe and inventing machines that will improve productivity and ultimately economic output."
// WORD -> FRAME: you've 13 · got 36 · people 39 · who 46 · are 51 · making 54 · the 76 · most 90 ·
// fundamental 94 · discoveries 104 · about 117 · the 127 · nature 132 · of 139 · the 150 · universe 165 ·
// and 177 · inventing 192 · machines 217 · that 226 · will 238 · improve 242 · productivity 257 · and 272 ·
// ultimately 286 · economic 295 · output 313 · (cut back to the speaker at 336)
// DURATION: the slot 42.109 -> 53.320 s (in frame 1262 -> out frame 1598) = 11.211 s x 29.97 = 336 frames.
//
// V4 CAMERA (the user: V3's picture, V2's smoother camera): V3's pchip keys held twice (f140-158,
// f200-220), re-targeted mid-travel and overshot on the pull-back (~58 px/f peaks, a hard stop at f265).
// V4 runs one continuous move through V3's framings: four overlapping moves, each one smooth velocity lobe
// with pan and zoom on the same profile (machinesAndOutputPlanV4.ts); the pull-back now runs with the climb
// to ~f316, then a creep in. Timings below are V3's, except: travel f144-216, pull-back f204-318, "1687"
// returns f288. Everything else in the picture is V3's.
// THE MOTION: one continuous camera, the people are the subjects, England's output line is the ground
// they stand on. f0: close on Newton (orange coat, his own hair) bent to the eyepiece of his reflecting
// telescope (the 1668 shape: a short tube on a ball mount) on a small table, on a short floor slab whose
// underside sits on the line at 1687, a crescent and a few stars above; he straightens, writes on a page
// with a quill, looks up at the sky, bends to the eyepiece again (alive throughout). One log-space
// pull-back (f0-150) shows him standing on a long cream line coming up from the left; "1687" lands f146.
// f150-205 the camera travels right and up along the line to 1781: on a flat engine bed (its underside on
// the line) a crew works a Watt beam engine: a stoker shovels coal from a heap into the boiler's fire door
// (a cycle every 42 frames), the lever-man stands at the valve lever, the engineer (a Fellow, orange
// coat) watches. CAUSE FIRST: each throw feeds the fire (it flares a few frames after the blade swings
// in; roaring by f200); the lever-man pulls the lever down over f198-210 (it opens the steam); the
// engine starts on f211 (first reaction: the beam and flywheel move) and runs up to speed by ~f237.
// "1781" lands f210. The orange nib leaves the line's 1781 point under the bed at f199 and comes out of
// the bed's right end beside the engineer on "machines" (~f217), drawing the line on through the decade
// means and climbing faster as it goes; the camera pulls back up and right with the climb (f236-312) to
// the whole line (option A's end framing: start y~1040, tip y~105) as the tip reaches 1900 (f309,
// "1900" slides up f296, "1650" f284). Settled f312-335: the line, Newton at his telescope at 1687, the
// crew at their posts at 1781 (each man ~60 px tall), the orange climb to 1900; the shovel cycle, the
// beam rocking, Newton's small movements, a creep in. Nothing fades.
// Orange = the new: Newton's and the engineer's coats, the engine's two gears, the fire, the line after
// 1781. The workers, the line before 1781, the props and the structure are cream / dark umber.
//
// SOURCES: England's real GDP per head 1650-1900 (GBP at 2013 prices): Bank of England, "A millennium of
// macroeconomic data for the UK" v3.1, sheet A21, England (full citation in englandGdpData.ts), plotted
// linear from 0 as DECADE MEANS of the BoE annual series (mean of 1650-59 ... 1890-99 at mid-decade, plus
// the 1900 annual value as the end point), straight segments, no smoothing; the 1781 point lies on the
// segment between the 1770s and 1780s means (interpolated). Newton's reflecting telescope, 1668 (Royal
// Society; shape from the engraving in <working>/images/42.5_...NewtonReflectingTelescope1668.jpg);
// Principia 1687; Watt's rotative beam engine, sun-and-planet patent 1781 (the beam engine, the boiler and
// the crew are illustrative).
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { FRAME_H, FRAME_W, labelSlide, mixColor, screenOf } from "../kits/maps/incaShared";
import { ACCENT, ACCENT_DEEP, DARK, INK, SPOKE_INK, SunAndPlanetMachine, type Cam, type P2 } from "./orbitWorld";
import { CREAM, Fellow, Newton, ORANGE, POSES, Worker, castAnchors, headTurn, idle, lerpFig, scaleForPx, tableTop, type FigPose } from "./londonCastV2";
import { Box, ContactShadow, Cylinder, GroundPlane, perspective, type Persp, type VolInk } from "./londonDepth";
import {
  A1781,
  BEAM_PIVOT,
  BED_T,
  BED_TOP,
  BED_WX0,
  BED_WX1,
  BOILER,
  COAL_HEAP,
  COLUMN_W,
  CREW_FEET_Y,
  CREW_PX,
  CYL_HW,
  CYL_TOP,
  CYL_X,
  ENGINE_S,
  ENGINEER,
  FIRE_UP,
  LABEL_F0,
  LABEL_1687_BACK,
  LABEL_1687_OUT,
  LEVERMAN,
  LEVER_PULL,
  LINE_END_YEAR,
  LINE_START_YEAR,
  MACHINE_YEAR,
  ORANGE_RUN,
  P1687,
  SHOVEL_PERIOD,
  SHOVEL_THROW,
  SLAB_T,
  SLAB_TOP,
  SLAB_X0,
  SLAB_X1,
  SX,
  STOKER,
  camAtG,
  engineCam,
  engineFrameAt,
  engineToWorld,
  orangeTipYear,
  pistonPinAt,
  pointAtYear,
  polyline,
  rodPinAt,
  shovelPhase,
  BED_Z1,
  BOILER_Z,
  CYL_R_W,
  ENGINEER_FEET_Y,
  FOCAL,
  SERIES,
  SLAB_Z1,
  TABLE_Z,
  Z_CREW,
  Z_ENGINE,
  Z_FAR,
  Z_NEWTON,
  camAtZ,
  lineYAtX,
  viewAtG,
  type View,
} from "./machinesAndOutputPlanV5";

export const FPS = 30000 / 1001;
export const DURATION = 336;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400"], subsets: ["latin"] });

const fx = (v: number) => v.toFixed(3);
const dOf = (pts: P2[]) => (pts.length > 1 ? `M${pts.map(([x, y]) => `${fx(x)},${fx(y)}`).join("L")}` : "");
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};

// line weights in screen px (a drawn chart line keeps its weight through the zoom)
const CREAM_W = 10;
const ORANGE_W = 12;
const CASE_W = 3;
const NIB_R = 9;
/** structure: the dark-umber plane of orbitWorld's pedestal (PED_FILL, not exported) in the context cream line */
const STRUCT_FILL = "#2F261C"; // V5: cut 10's engine mid tone
const iron = { fill: STRUCT_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };
const SCALE = scaleForPx(CREW_PX);
/** the form shadow on every figure (the cast's `shade`, light from the upper left) */
const FIG_SHADE = 0.75;

// ---------------------------------------------------------------------------
// DEPTH (V5): one camera (machinesAndOutputPlanV5 THE DEPTH CAMERA) handed to the shared kit (londonDepth) as a
// Persp; everything below draws inside the front plane's WorldSvg with P.p(X, Y, Z).
// ---------------------------------------------------------------------------
const pt = (v: P2) => `${fx(v[0])} ${fx(v[1])}`;
/** the kit's persp with its floor (Y = 0) moved to the world height y0 (the kit's shadows and floors assume Y = 0) */
const onFloor = (P: Persp, y0: number): Persp => ({
  ...P,
  p: (X: number, Y: number, Z: number) => P.p(X, Y + y0, Z),
  at: (X: number, Z: number) => ({ at: P.p(X, y0, Z), scale: P.r(Z) }),
  horizonY: P.horizonY - y0,
});
/** draws a flat front-plane drawing (a figure, the sky, a door) at depth Z */
const planeT = (P: Persp, Z: number) => {
  const r = P.r(Z);
  const [vx, vy] = P.vp;
  return `translate(${fx(vx)} ${fx(vy)}) scale(${r.toFixed(6)}) translate(${fx(-vx)} ${fx(-vy)})`;
};
/** volume inks (lit top / left, mid front, dark right and undersides) */
/** cut 10's engine: lit tops, mid fronts, dark sides (cream engraved edges on the lit faces) */
const IRON: VolInk = { lit: "#5E4D38", mid: "#2F261C", dark: "#18130E" };
const STONE: VolInk = { lit: "#5E4E3B", mid: "#3A2F24", dark: "#221B14" };
const COAL: VolInk = { lit: "#2E261D", mid: DARK, dark: "#0F0C09" };
const CREAM_VOL: VolInk = { lit: INK, mid: CREAM.deep, dark: "#9C8F6E" };
/** a polygon pulled in toward its centroid by about 1.6 screen px (an engraved edge line just inside a face) */
const inset = (q: P2[], px = 1.6): P2[] => {
  const c: P2 = [q.reduce((a, v) => a + v[0], 0) / q.length, q.reduce((a, v) => a + v[1], 0) / q.length];
  return q.map((v) => {
    const d = Math.hypot(c[0] - v[0], c[1] - v[1]) || 1;
    const t = Math.min(0.25, px / d);
    return [v[0] + (c[0] - v[0]) * t, v[1] + (c[1] - v[1]) * t] as P2;
  });
};
type BoxArgs = React.ComponentProps<typeof Box>;
/** the kit's Box with cut 10's engine finish: cream engraved edges on its lit faces (the top and the left side) */
const IronBox: React.FC<BoxArgs> = (props) => {
  const { P, X0, X1, Y0, Y1, Z0, Z1 } = props;
  const p = P.p;
  const px = 1.6 / P.cam.k;
  let d = "";
  if (Y0 > P.horizonY) d += `M${inset([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y0, Z1), p(X0, Y0, Z1)], px).map(pt).join("L")}Z`;
  if (X0 > P.vp[0]) d += `M${inset([p(X0, Y0, Z0), p(X0, Y0, Z1), p(X0, Y1, Z1), p(X0, Y1, Z0)], px).map(pt).join("L")}Z`;
  return (
    <g>
      <Box {...props} />
      {d ? <path d={d} fill="none" stroke={SPOKE_INK} strokeWidth={1.5 / P.cam.k} strokeLinejoin="round" /> : null}
    </g>
  );
};
type CylArgs = React.ComponentProps<typeof Cylinder>;
/** the kit's Cylinder with a cream engraved line down its lit (left) side and round its top when seen */
const IronCylinder: React.FC<CylArgs> = (props) => {
  const { P, X, Z, R, Y0, Y1 } = props;
  const px = 2.4 / P.cam.k;
  const a = P.p(X - R, Y0, Z);
  const b = P.p(X - R, Y1, Z);
  const c = P.p(X, Y0, Z);
  const rx = R * P.r(Z) - px;
  const ry = Math.abs((P.p(X, Y0, Z - R)[1] - P.p(X, Y0, Z + R)[1]) / 2) - px * 0.5;
  return (
    <g>
      <Cylinder {...props} />
      <path d={`M${fx(a[0] + px)} ${fx(a[1])}L${fx(b[0] + px)} ${fx(b[1])}`} stroke={SPOKE_INK} strokeWidth={1.5 / P.cam.k} />
      {Y0 > P.horizonY && ry > 0.5 ? <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill="none" stroke={SPOKE_INK} strokeWidth={1.5 / P.cam.k} /> : null}
    </g>
  );
};
/** a polygon (front-plane world points) extruded back from z0 to z1: the side faces the eye sees, toned by the light
 *  from the upper left (top faces lit, right faces dark, the rest mid), then the front face; a faceted polygon (a few
 *  corners) gets hard edges and engraved receding lines on its dark faces, a round one only its silhouette */
const Prism: React.FC<{ P: Persp; poly: P2[]; z0: number; z1: number; ink: VolInk; front?: boolean; sw?: number; hatch?: boolean }> = ({ P, poly, z0, z1, ink, front = true, sw = 2.4, hatch = true }) => {
  const n = poly.length;
  let A = 0;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    A += a[0] * b[1] - b[0] * a[1];
  }
  const sg = A >= 0 ? 1 : -1;
  const [vx, vy] = P.vp;
  const F = poly.map(([x, y]) => P.p(x, y, z0));
  const B = poly.map(([x, y]) => P.p(x, y, z1));
  const w = sw * P.r((z0 + z1) / 2);
  const faceted = n <= 10;
  const vis: boolean[] = [];
  const tone: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = (sg * dy) / L;
    const ny = (-sg * dx) / L;
    vis.push((vx - (a[0] + b[0]) / 2) * nx + (vy - (a[1] + b[1]) / 2) * ny > 1e-6);
    const lit = nx * -0.55 + ny * -0.83;
    tone.push(lit > 0.3 ? ink.lit : lit < -0.25 ? ink.dark : ink.mid);
  }
  const faces: React.ReactNode[] = [];
  let creamD = "";
  let edges = "";
  let hatchD = "";
  const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  for (let i = 0; i < n; i++) {
    if (!vis[i]) continue;
    const j = (i + 1) % n;
    const quad = [F[i], F[j], B[j], B[i]];
    faces.push(<path key={i} d={`M${quad.map(pt).join("L")}Z`} fill={tone[i]} stroke={tone[i]} strokeWidth={0.6 * P.r(z0)} strokeLinejoin="round" />);
    if (tone[i] === ink.lit && ink === IRON) creamD += `M${inset(quad).map(pt).join("L")}Z`;
    edges += `M${pt(B[i])}L${pt(B[j])}`;
    if (faceted || !vis[(i + n - 1) % n]) edges += `M${pt(F[i])}L${pt(B[i])}`;
    if (faceted || !vis[j]) edges += `M${pt(F[j])}L${pt(B[j])}`;
    if (faceted && hatch && tone[i] === ink.dark) {
      for (const t of [0.3, 0.55, 0.8]) hatchD += `M${pt(lerp2(F[i], F[j], t))}L${pt(lerp2(B[i], B[j], t))}`;
    }
  }
  return (
    <g>
      {faces}
      {hatchD ? <path d={hatchD} fill="none" stroke={DARK} strokeOpacity={0.4} strokeWidth={1.1 * P.r(z0)} /> : null}
      <path d={edges} fill="none" stroke={DARK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
      {creamD ? <path d={creamD} fill="none" stroke={SPOKE_INK} strokeWidth={1.5 * P.r(z0)} strokeLinejoin="round" /> : null}
      {front ? <path d={`M${F.map(pt).join("L")}Z`} fill={ink.mid} stroke={DARK} strokeWidth={w} strokeLinejoin="round" /> : null}
    </g>
  );
};
/** a flat disc lying on a floor at height y0 (a foot, a base), as the eye sees it */
const FloorDisc: React.FC<{ P: Persp; X: number; y0: number; Z: number; R: number; fill: string }> = ({ P, X, y0, Z, R, fill }) => {
  const q = Array.from({ length: 28 }, (_, i) => P.p(X + R * Math.cos((i / 28) * Math.PI * 2), y0, Z + R * Math.sin((i / 28) * Math.PI * 2)));
  return <path d={`M${q.map(pt).join("L")}Z`} fill={fill} stroke={DARK} strokeWidth={2.4 * P.r(Z)} strokeLinejoin="round" />;
};

// ---------------------------------------------------------------------------
// THE LANDFORM (V5): the output line is the front edge of a ridge whose height is the data at each year, constant
// going back, to Z_FAR. Its top face is a lifted land tone near, the page far, in flat steps; rows parallel to the edge
// every 150 and joints back from every plotted point, all fading and thinning with depth; a dark face hangs below the
// edge. It grows with the orange nib. Built as depth bands so the painter's order interleaves it with the platforms,
// the engine and the crew (the ground under the platforms is drawn first).
// ---------------------------------------------------------------------------
type Layer = { key: number; el?: React.ReactNode; dom?: React.ReactNode };
/** mix two colours (#rrggbb or rgb()) -> #rrggbb (mixColor's rgb() output does not mix again) */
const rgbOf = (c: string) => (c.startsWith("#") ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : (c.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number));
const mixHex = (a: string, b: string, t: number) => {
  const pa = rgbOf(a);
  const pb = rgbOf(b);
  const u = c01(t);
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};
const LIT_TOP = mixHex("#3F3428", INK, 0.13); // one even ground tone, a step above the page
const CLIFF_FILL = "#1E1811";
const ROW_STEP = 70;
const Z_ROWS: number[] = (() => {
  const zs = new Set<number>([0, 20, 40, 60, 70, 120, 172, 200, 240, 300, 340, Z_FAR]);
  for (let z = ROW_STEP; z <= Z_FAR; z += ROW_STEP) zs.add(z);
  return [...zs].filter((z) => z <= Z_FAR).sort((a, b) => a - b);
})();
const yearOfX = (x: number) => MACHINE_YEAR + (x - A1781[0]) / SX;
const CLIFF = 170; // world: the dark face hanging below the edge
const landformLayers = (P: Persp, k: number, tipYear: number, keyOf: (z: number) => number): Layer[] => {
  const x0 = pointAtYear(LINE_START_YEAR)[0];
  const x1 = pointAtYear(tipYear)[0];
  // pieces of the x range: under a platform (drawn first) or open
  const cuts: [number, number, boolean][] = [];
  const spans: [number, number][] = [
    [SLAB_X0, SLAB_X1],
    [BED_WX0, BED_WX1],
  ];
  let x = x0;
  for (const [a, b] of spans) {
    if (b <= x || a >= x1) continue;
    if (a > x) cuts.push([x, Math.min(a, x1), false]);
    cuts.push([Math.max(a, x), Math.min(b, x1), true]);
    x = Math.min(b, x1);
  }
  if (x < x1) cuts.push([x, x1, false]);
  const pieces = cuts.filter(([a, b]) => b - a > 0.5).map(([a, b, under]) => ({ pts: polyline(yearOfX(a), yearOfX(b)), under, orange: a >= A1781[0] - 1 }));
  const out: Layer[] = [];
  for (let i = 0; i < Z_ROWS.length - 1; i++) {
    const za = Z_ROWS[i];
    const zb = Z_ROWS[i + 1];
    const zm = (za + zb) / 2;
    for (const under of [true, false]) {
      const els: React.ReactNode[] = [];
      pieces
        .filter((pc) => pc.under === under)
        .forEach((pc, j) => {
          const front = pc.pts.map(([px, py]) => P.p(px, py, za));
          const back = pc.pts.map(([px, py]) => P.p(px, py, zb));
          const fill = LIT_TOP;
          els.push(<path key={`b${j}`} d={`M${[...front, ...back.reverse()].map(pt).join("L")}Z`} fill={fill} stroke={fill} strokeWidth={0.8 / k} />);
          // the row at zb (every ROW_STEP), and the joints back from each plotted point
          const a = 0.3;
          {
            let dd = "";
            if (zb % ROW_STEP === 0 && zb < Z_FAR) dd += `M${pc.pts.map(([px, py]) => pt(P.p(px, py, zb))).join("L")}`;
            for (const [yr] of SERIES) {
              const px = pointAtYear(yr);
              if (px[0] < pc.pts[0][0] - 1e-6 || px[0] > pc.pts[pc.pts.length - 1][0] + 1e-6) continue;
              dd += `M${pt(P.p(px[0], px[1], za))}L${pt(P.p(px[0], px[1], zb))}`;
            }
            if (dd) els.push(<path key={`r${j}`} d={dd} fill="none" stroke={DARK} strokeOpacity={a} strokeWidth={(1.5 / k) * P.r(zm)} strokeLinejoin="round" />);
          }
        });
      if (els.length) out.push({ key: under ? 1e7 - za : keyOf(za), el: <g key={`land${i}${under}`}>{els}</g> });
    }
  }
  // the face below the edge: three flat steps darkening toward the edge
  const all = polyline(LINE_START_YEAR, tipYear);
  const steps: [number, number, number][] = [
    [0, 0.34, 0.96],
    [0.34, 0.68, 0.7],
    [0.68, 1, 0.4],
  ];
  // the end caps (at 1650 and at the tip; closed at 1900), where the eye sees them, in the face's three steps
  const caps: React.ReactNode[] = [];
  const ends: [P2, number][] = [
    [all[0], -1],
    [all[all.length - 1], 1],
  ];
  ends.forEach(([[ex, ey], side], ci) => {
    if ((P.vp[0] - ex) * side <= 0) return;
    steps.forEach(([a, b, op], i) => {
      const q = [P.p(ex, ey + a * CLIFF, 0), P.p(ex, ey + a * CLIFF, Z_FAR), P.p(ex, ey + b * CLIFF, Z_FAR), P.p(ex, ey + b * CLIFF, 0)];
      caps.push(<path key={`c${ci}${i}`} d={`M${q.map(pt).join("L")}Z`} fill={CLIFF_FILL} opacity={Math.min(1, op + 0.15)} />);
    });
  });
  // the back edge: the data again, at the ridge's depth (cream before 1781, orange after), and the two end edges
  const backOf = (a: number, b: number) => polyline(a, b).map(([px, py]) => P.p(px, py, Z_FAR));
  const rb = P.r(Z_FAR);
  const creamBack = backOf(LINE_START_YEAR, Math.min(tipYear, MACHINE_YEAR));
  const orangeBack = tipYear > MACHINE_YEAR + 1e-4 ? backOf(MACHINE_YEAR, tipYear) : [];
  const sideEdges = [all[0], all[all.length - 1]].map(([px, py]) => `M${pt(P.p(px, py, 0))}L${pt(P.p(px, py, Z_FAR))}`).join("");
  out.push({
    key: 345, // after the ridge's top bands, before the platforms (it is behind them)
    el: (
      <g key="backedge" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d={`M${creamBack.map(pt).join("L")}`} stroke={DARK} strokeOpacity={0.7} strokeWidth={(6 * rb) / k} />
        <path d={`M${creamBack.map(pt).join("L")}`} stroke={INK} strokeOpacity={0.75} strokeWidth={(3.4 * rb) / k} />
        {orangeBack.length > 1 ? (
          <>
            <path d={`M${orangeBack.map(pt).join("L")}`} stroke={DARK} strokeOpacity={0.7} strokeWidth={(6.6 * rb) / k} />
            <path d={`M${orangeBack.map(pt).join("L")}`} stroke={ACCENT_DEEP} strokeOpacity={0.9} strokeWidth={(4 * rb) / k} />
          </>
        ) : null}
      </g>
    ),
  });
  out.push({
    key: -0.4,
    el: (
      <g key="caps">
        {caps}
        <path d={sideEdges} fill="none" stroke={INK} strokeOpacity={0.7} strokeWidth={3 / k} strokeLinecap="round" />
      </g>
    ),
  });
  out.push({
    key: -0.5,
    el: (
      <g key="cliff">
        {steps.map(([a, b, op], i) => (
          <path key={i} d={`M${[...all.map(([px, py]) => [px, py + a * CLIFF] as P2), ...all.map(([px, py]) => [px, py + b * CLIFF] as P2).reverse()].map(pt).join("L")}Z`} fill={CLIFF_FILL} opacity={op} />
        ))}
      </g>
    ),
  });
  return out;
};

/** a footing's face (front-plane world): from a platform's underside down to the ground wherever the ground is lower */
const footingPoly = (x0: number, x1: number, under: number): P2[] => {
  const n = 48;
  const bot: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    bot.push([x, Math.max(under, lineYAtX(x) + 2)]);
  }
  return [[x0, under], [x1, under], ...bot.reverse()];
};

// ---------------------------------------------------------------------------
// THE CHART LINE (the ground): the cream past, the orange new and its nib
// ---------------------------------------------------------------------------
const ChartLine: React.FC<{ g: number; cam: Cam }> = ({ g, cam }) => {
  const k = cam.k;
  const cream = polyline(LINE_START_YEAR, MACHINE_YEAR);
  const tip = orangeTipYear(g);
  const orange = tip > MACHINE_YEAR + 1e-4 ? polyline(MACHINE_YEAR, tip) : [];
  const nibAt = pointAtYear(tip);
  const showNib = g >= ORANGE_RUN[0] && tip > MACHINE_YEAR + 1e-4;
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d={dOf(cream)} stroke={DARK} strokeOpacity={0.85} strokeWidth={(CREAM_W + 2 * CASE_W) / k} />
      <path d={dOf(cream)} stroke={INK} strokeWidth={CREAM_W / k} />
      {orange.length > 1 ? (
        <>
          <path d={dOf(orange)} stroke={DARK} strokeOpacity={0.9} strokeWidth={(ORANGE_W + 2 * CASE_W) / k} />
          <path d={dOf(orange)} stroke={ACCENT} strokeWidth={ORANGE_W / k} />
        </>
      ) : null}
      {showNib ? (
        <g>
          <circle cx={nibAt[0]} cy={nibAt[1]} r={(NIB_R + CASE_W) / k} fill={DARK} />
          <circle cx={nibAt[0]} cy={nibAt[1]} r={NIB_R / k} fill={ACCENT} />
          <circle cx={nibAt[0] - 2.6 / k} cy={nibAt[1] - 2.6 / k} r={3 / k} fill={mixColor(ACCENT, INK, 0.6)} />
        </g>
      ) : null}
    </g>
  );
};

/** a flat floor slab (world px): dark umber planes in the context cream line, a top edge line, joints */
const Slab: React.FC<{ x0: number; x1: number; top: number; t: number; joints: number }> = ({ x0, x1, top, t, joints }) => (
  <g>
    <path d={`M${fx(x0)} ${fx(top)}L${fx(x1)} ${fx(top)}L${fx(x1)} ${fx(top + t)}L${fx(x0)} ${fx(top + t)}Z`} {...iron} />
    <path d={`M${fx(x0 + 3)} ${fx(top + 3)}L${fx(x1 - 3)} ${fx(top + 3)}`} stroke={INK} strokeOpacity={0.6} strokeWidth={3} />
    <path d={`M${fx(x0 + 10)} ${fx(top + t * 0.26)}L${fx(x1 - 10)} ${fx(top + t * 0.26)}`} stroke={SPOKE_INK} strokeOpacity={0.45} strokeWidth={1.4} />
    {Array.from({ length: joints }, (_, i) => {
      const x = x0 + ((x1 - x0) * (i + 0.5)) / joints;
      return <path key={i} d={`M${fx(x)} ${fx(top + t * 0.26)}L${fx(x)} ${fx(top + t)}`} stroke={SPOKE_INK} strokeOpacity={0.3} strokeWidth={1.4} />;
    })}
  </g>
);

/** the footing's stone: the page lifted a step (lighter than the iron planes) */
const FOOT_FILL = "#4A3D2E";
/** a masonry footing that seats a platform on the line: from the platform's underside down to the line wherever the
 *  line runs below it (dark umber courses in the context cream line; the line is drawn over its foot) */
const Footing: React.FC<{ x0: number; x1: number; under: number }> = ({ x0, x1, under }) => {
  const n = 48;
  const bot: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    bot.push([x, Math.max(under, lineYAtX(x) + 2)]);
  }
  const d = `M${fx(x0)} ${fx(under)}L${fx(x1)} ${fx(under)}${bot
    .slice()
    .reverse()
    .map(([x, y]) => `L${fx(x)} ${fx(y)}`)
    .join("")}Z`;
  const depth = Math.max(...bot.map((p) => p[1])) - under;
  if (depth < 2) return null;
  const courses: React.ReactNode[] = [];
  for (let y = under + 34; y < under + depth; y += 34) {
    const xs = bot.filter((p) => p[1] > y + 4).map((p) => p[0]);
    if (xs.length < 2) continue;
    courses.push(<path key={y} d={`M${fx(xs[0] + 4)} ${fx(y)}L${fx(xs[xs.length - 1] - 4)} ${fx(y)}`} stroke={SPOKE_INK} strokeOpacity={0.35} strokeWidth={1.6} />);
  }
  // staggered vertical joints between the courses (stone, not a dark block)
  const joints: React.ReactNode[] = [];
  let row = 0;
  for (let y = under; y < under + depth - 10; y += 34, row++) {
    for (let x = x0 + 30 + (row % 2) * 40; x < x1 - 10; x += 80) {
      const yb = Math.max(under, lineYAtX(x));
      if (yb < y + 30) continue;
      joints.push(<path key={`${x}-${y}`} d={`M${fx(x)} ${fx(y + 3)}L${fx(x)} ${fx(Math.min(y + 31, yb))}`} stroke={SPOKE_INK} strokeOpacity={0.3} strokeWidth={1.4} />);
    }
  }
  return (
    <g>
      <path d={d} fill={FOOT_FILL} stroke={SPOKE_INK} strokeWidth={3} strokeLinejoin="round" />
      {courses}
      {joints}
      <path d={`M${fx(x0 + 3)} ${fx(under + 2)}L${fx(x0 + 3)} ${fx(bot[0][1] - 3)}`} stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
    </g>
  );
};
// ---------------------------------------------------------------------------
// 1687: NEWTON AT HIS REFLECTOR. A small table on the slab; at its left end the reflector (the 1668 shape:
// a short fat tube on a ball mount, drawn here so it can aim) points UP at the crescent in front of him;
// Newton stands left of the table, facing right, his eye at the tube's rear end. On "universe" a thin
// orange sight-line runs from the tube's mouth to the moon (f140-158) and stays.
// ---------------------------------------------------------------------------
const TBL_W = 250; // units
const TABLE_AT: P2 = [SLAB_X1 - 20 - (TBL_W / 2 + 10) * scaleForPx(CREW_PX), SLAB_TOP];
const TT = tableTop(TABLE_AT, SCALE);
const REFL_AT: P2 = [TT[0] - (TBL_W / 2 - 62) * SCALE, TT[1] - 12 * SCALE];
const TUBE_ANG = (-68 * Math.PI) / 180; // steeply up, at the crescent above him
const TUBE_U: P2 = [Math.cos(TUBE_ANG), Math.sin(TUBE_ANG)];
const TUBE_PIV: P2 = [REFL_AT[0], REFL_AT[1] - 104 * SCALE]; // the ball
const TUBE_BACK = 54; // units behind the pivot (the eyepiece end)
const TUBE_FRONT = 70; // units in front (the mouth)
const TUBE_R = 15;
const tubeAt = (t: number): P2 => [TUBE_PIV[0] + TUBE_U[0] * t * SCALE, TUBE_PIV[1] + TUBE_U[1] * t * SCALE];
const EYEPIECE: P2 = tubeAt(-TUBE_BACK - 8);
const MOUTH: P2 = tubeAt(TUBE_FRONT);
/** the crescent, straight up the tube's line */
export const MOON: P2 = tubeAt(TUBE_FRONT + 300);
/** Newton's poses (facing right): bent to the eyepiece, upright writing on the page, looking up at the moon */
// londonCastV2: the drawn eye sits at headC + EYE_OFF in this pose (measured on a still); the crouch takes up the
// difference from V1's head so his feet stay where they were
const N_BEND0: FigPose = { ...POSES.eyepiece(1), lean: 30, crouch: 21.5, pitch: 20, headYaw: 1.0 };
const EYE_OFF: P2 = [6, 6];
/** where his feet go so his eye is at the eyepiece in N_BEND (the head does not depend on the arms) */
const NEWTON_AT: P2 = (() => {
  const a = castAnchors("newton", N_BEND0, [0, 0], 1);
  const eye = [a.headC[0] + EYE_OFF[0], a.headC[1] + EYE_OFF[1]];
  return [EYEPIECE[0] - eye[0] * SCALE - 4 * SCALE, EYEPIECE[1] - eye[1] * SCALE + 2 * SCALE];
})();
const toFig = (w: P2): P2 => [(w[0] - NEWTON_AT[0]) / SCALE, (w[1] - NEWTON_AT[1]) / SCALE];
/** the page on the table (its middle): V4 moves it within his reach, on the front of the top just in front of the
 *  reflector's foot (it overlaps the foot, which stands behind it); the inkpot stays 66 units to its right */
const PAGE: P2 = [NEWTON_AT[0] + 88 * SCALE, TT[1] - 1 * SCALE];
/** the quill's nib on the page while he writes (world) */
const NIB_AT: P2 = [PAGE[0] - 2 * SCALE, PAGE[1] - 6 * SCALE];
/** the wrist target that puts the near hand's grip (the quill) on NIB_AT in pose q (a few fixed-point steps) */
const solveGrip = (q: FigPose, target: P2): P2 => {
  const t = toFig(target);
  let w: P2 = [t[0], t[1] + 8];
  for (let i = 0; i < 6; i++) {
    const a = castAnchors("newton", { ...q, armL: { ...q.armL, w } }, [0, 0], 1);
    w = [w[0] + t[0] - a.handL[0], w[1] + t[1] - a.handL[1]];
  }
  return w;
};
/** at the eyepiece (londonCastV2): the FAR hand steadies the tube above the ball and the near hand rests on the
 *  table's edge, so no sleeve crosses his face at the eyepiece */
const N_BEND: FigPose = {
  ...N_BEND0,
  armL: { w: toFig([REFL_AT[0] - 46 * SCALE, TT[1] - 2 * SCALE]), elbow: [-0.4, 1], fist: 0.9, hand: 0 }, // a loose fist on the edge
  armR: { w: toFig(tubeAt(8)), elbow: [0.3, 1], fist: 0.6, hand: -20 }, // drawn behind his head (onlyArm / hideArm)
};
const N_WRITE0: FigPose = { ...POSES.stand(1), lean: 26, crouch: 4, pitch: 22, headYaw: 0.9, armL: { w: [128, -176], elbow: [-0.4, 1], fist: 0.75, hand: 30 }, armR: { w: [104, -170], elbow: [-0.3, 1], fist: 0.8, hand: 0 }, brow: 0.4 };
/** writing: bent over the page, the quill hand on it (V4: solved, so the nib lands on the page) */
const N_WRITE: FigPose = { ...N_WRITE0, armL: { ...N_WRITE0.armL, w: solveGrip(N_WRITE0, NIB_AT) } };
const N_LOOK: FigPose = { ...POSES.stand(1), pitch: -24, headYaw: 0.8, armL: { w: [40, -150], elbow: [-0.4, 1], fist: 0.7, hand: 20 }, armR: { w: [70, -150], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, brow: -0.3, mouth: 0.2 };
/** [frame, pose]: eased crossfades between, holds where a pose repeats */
const NEWTON_KEYS: [number, FigPose][] = [
  [0, N_BEND],
  [34, N_BEND],
  [50, N_WRITE],
  [80, N_WRITE],
  [96, N_BEND], // the discovery look: the sight-line draws from the tube to the moon f104-165
  [166, N_BEND],
  [180, N_WRITE], // he notes it
  [216, N_WRITE],
  [230, N_LOOK],
  [256, N_LOOK],
  [272, N_BEND],
  [336, N_BEND],
];
const WRITE_SPANS: [number, number][] = [
  [52, 80],
  [182, 216],
];
const newtonPose = (g: number): FigPose => {
  let q = N_BEND;
  for (let i = 0; i < NEWTON_KEYS.length - 1; i++) {
    const [f0, a] = NEWTON_KEYS[i];
    const [f1, b] = NEWTON_KEYS[i + 1];
    if (g >= f0 && g <= f1) {
      q = a === b ? a : lerpFig(a, b, ease((g - f0) / (f1 - f0)));
      break;
    }
  }
  for (const [w0, w1] of WRITE_SPANS) {
    if (g > w0 && g < w1) {
      const s = Math.sin((g - w0) * 0.9) * 4;
      q = { ...q, armL: { ...q.armL, w: [q.armL.w[0] + s, q.armL.w[1] + Math.cos((g - w0) * 1.3) * 2] } };
    }
  }
  return idle(q, g, 3, 0.6);
};
const writingAt = (g: number) => WRITE_SPANS.some(([w0, w1]) => g > w0 - 4 && g < w1 + 6);
/** the sight-line's drawn fraction (it runs from the mouth to the moon) */
export const SIGHT_ON: readonly [number, number] = [104, 165];
/** the stars: [dx, dy] from the moon (world px), size, the frame each one fills in (a few at a time f108-160) */
const STARS: [number, number, number, number][] = [
  [-230, -40, 15, 108],
  [150, -170, 13, 116],
  [-110, 110, 11, 124],
  [230, 70, 12, 132],
  [-40, -200, 14, 140],
  [310, -60, 10, 148],
  [-300, 80, 10, 154],
  [60, 150, 9, 160],
];
const starD = (c: P2, R: number) => {
  // a 6-point engraved burst: long rays on the cardinal-ish axes, short between
  let d = "";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? R : R * 0.62;
    d += `M${fx(c[0] + Math.cos(a) * R * 0.18)} ${fx(c[1] + Math.sin(a) * R * 0.18)}L${fx(c[0] + Math.cos(a) * r)} ${fx(c[1] + Math.sin(a) * r)}`;
  }
  return d;
};
const MOON_R = 70;
const Sky: React.FC<{ g: number }> = ({ g }) => {
  const m = MOON;
  // the crescent: outer disc minus an offset disc (lit limb to the lower left)
  const R = MOON_R;
  const r2 = R * 0.84;
  const off: P2 = [R * 0.42, -R * 0.28];
  const crescent = `M${fx(m[0])} ${fx(m[1] - R)}A${R} ${R} 0 1 0 ${fx(m[0] + 0.001)} ${fx(m[1] - R)}Z`;
  const bite = `M${fx(m[0] + off[0])} ${fx(m[1] + off[1] - r2)}A${r2} ${r2} 0 1 0 ${fx(m[0] + off[0] + 0.001)} ${fx(m[1] + off[1] - r2)}Z`;
  const hatch: string[] = [];
  for (let k = -R; k <= R; k += 9) hatch.push(`M${fx(m[0] + k - R)} ${fx(m[1] + R)}L${fx(m[0] + k + R)} ${fx(m[1] - R)}`);
  return (
    <g>
      <defs>
        <mask id="m42moon">
          <path d={crescent} fill="#fff" />
          <path d={bite} fill="#000" />
        </mask>
      </defs>
      <g mask="url(#m42moon)">
        <path d={crescent} fill={INK} />
        <path d={hatch.join("")} stroke={DARK} strokeOpacity={0.32} strokeWidth={2.2} />
      </g>
      {/* the engraved outline of the crescent and its cream rim */}
      <path d={crescent} fill="none" stroke={DARK} strokeWidth={5} mask="url(#m42moon)" />
      <path d={`M${fx(m[0] - R * 0.2)} ${fx(m[1] + R * 0.94)}A${R - 6} ${R - 6} 0 0 1 ${fx(m[0] - R * 0.86)} ${fx(m[1] - R * 0.2)}`} fill="none" stroke={INK} strokeWidth={3} mask="url(#m42moon)" />
      {STARS.map(([x, y, sz, f0], i) => {
        const on = ease((g - f0) / 8);
        if (on <= 0.001) return null;
        const glint = Math.exp(-Math.pow((g - SIGHT_ON[1] - i * 1.5) / 4, 2)) * 0.5;
        const tw = 0.85 + 0.15 * Math.sin(g * 0.11 + i * 1.7) + glint;
        const c: P2 = [m[0] + x, m[1] + y];
        const Rr = sz * tw;
        const d = starD(c, Rr);
        return (
          <g key={i} opacity={on} strokeLinecap="round">
            <path d={d} stroke={DARK} strokeOpacity={0.8} strokeWidth={Rr * 0.32 + 3} />
            <path d={d} stroke={INK} strokeWidth={Rr * 0.32} />
          </g>
        );
      })}
    </g>
  );
};
/** the reflector: a turned stand with a ball mount on the table, the short fat tube on it aimed up the TUBE_U line */
const MyReflector: React.FC = () => {
  const s = SCALE;
  const n: P2 = [-TUBE_U[1], TUBE_U[0]];
  const q = (t: number, w: number): string => {
    const c = tubeAt(t);
    return `${fx(c[0] + n[0] * w * s)} ${fx(c[1] + n[1] * w * s)}`;
  };
  const b = REFL_AT;
  const line = { stroke: DARK, strokeWidth: 2.4, strokeLinejoin: "round" as const };
  return (
    <g>
      {/* the stand: a round foot, a turned stem, the cradle and the ball */}
      {/* (V5: its round foot is a disc on the table top, drawn with the table) */}
      <path d={`M${fx(b[0] - 7 * s)} ${fx(b[1] - 6 * s)}L${fx(b[0] - 5 * s)} ${fx(b[1] - 60 * s)}L${fx(b[0] + 5 * s)} ${fx(b[1] - 60 * s)}L${fx(b[0] + 7 * s)} ${fx(b[1] - 6 * s)}Z`} fill={CREAM.deep} {...line} />
      <ellipse cx={b[0]} cy={b[1] - 40 * s} rx={11 * s} ry={6 * s} fill={CREAM.deep} {...line} />
      <path d={`M${fx(b[0] - 24 * s)} ${fx(b[1] - 62 * s)}Q${fx(b[0] - 26 * s)} ${fx(b[1] - 86 * s)} ${fx(b[0] - 14 * s)} ${fx(b[1] - 98 * s)}M${fx(b[0] + 24 * s)} ${fx(b[1] - 62 * s)}Q${fx(b[0] + 26 * s)} ${fx(b[1] - 86 * s)} ${fx(b[0] + 14 * s)} ${fx(b[1] - 98 * s)}`} fill="none" stroke={DARK} strokeWidth={6 * s + 2} strokeLinecap="round" />
      <path d={`M${fx(b[0] - 24 * s)} ${fx(b[1] - 62 * s)}Q${fx(b[0] - 26 * s)} ${fx(b[1] - 86 * s)} ${fx(b[0] - 14 * s)} ${fx(b[1] - 98 * s)}M${fx(b[0] + 24 * s)} ${fx(b[1] - 62 * s)}Q${fx(b[0] + 26 * s)} ${fx(b[1] - 86 * s)} ${fx(b[0] + 14 * s)} ${fx(b[1] - 98 * s)}`} fill="none" stroke={CREAM.deep} strokeWidth={3 * s} strokeLinecap="round" />
      <circle cx={b[0]} cy={b[1] - 80 * s} r={17 * s} fill={INK} {...line} />
      <path d={`M${fx(b[0] + 4 * s)} ${fx(b[1] - 94 * s)}A15 15 0 0 1 ${fx(b[0] + 15 * s)} ${fx(b[1] - 74 * s)}`} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={2} />
      {/* the tube: the mirror cell at the back, bands, the open mouth; the eyepiece on the back */}
      <path d={`M${q(-TUBE_BACK, -TUBE_R)}L${q(TUBE_FRONT, -TUBE_R)}L${q(TUBE_FRONT, TUBE_R)}L${q(-TUBE_BACK, TUBE_R)}Z`} fill={CREAM.deep} {...line} />
      <path d={`M${q(-TUBE_BACK + 6, 6)}L${q(TUBE_FRONT - 6, 6)}M${q(-TUBE_BACK + 6, 10)}L${q(TUBE_FRONT - 6, 10)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.4} />
      {[-30, 10, 40].map((t) => (
        <path key={t} d={`M${q(t, -TUBE_R - 1)}L${q(t, TUBE_R + 1)}`} stroke={DARK} strokeWidth={2.2} />
      ))}
      <path d={`M${q(TUBE_FRONT - 3, -TUBE_R - 3)}L${q(TUBE_FRONT + 3, -TUBE_R - 3)}L${q(TUBE_FRONT + 3, TUBE_R + 3)}L${q(TUBE_FRONT - 3, TUBE_R + 3)}Z`} fill={INK} {...line} />
      <path d={`M${q(-TUBE_BACK - 9, -6)}L${q(-TUBE_BACK, -8)}L${q(-TUBE_BACK, 8)}L${q(-TUBE_BACK - 9, 6)}Z`} fill={INK} {...line} />
    </g>
  );
};
/** the sky and, from "discoveries", the sight-line from the tube's mouth to the moon (in Newton's plane) */
const NewtonSky: React.FC<{ g: number; kz: number }> = ({ g, kz }) => {
  // drawn at a steady pace by its moving end (eased only into the moon)
  const su = c01((g - SIGHT_ON[0]) / (SIGHT_ON[1] - SIGHT_ON[0]));
  const sight = su < 0.85 ? su : 0.85 + 0.15 * (1 - Math.pow(1 - (su - 0.85) / 0.15, 2));
  const sDist = Math.hypot(MOON[0] - MOUTH[0], MOON[1] - MOUTH[1]);
  const sReach = ((sDist - MOON_R - 14) / sDist) * sight; // it stops at the moon's limb
  const sEnd: P2 = [MOUTH[0] + (MOON[0] - MOUTH[0]) * sReach, MOUTH[1] + (MOON[1] - MOUTH[1]) * sReach];
  return (
    <g>
      <Sky g={g} />
      {sight > 0.001 ? (
        <g strokeLinecap="round">
          <path d={`M${fx(MOUTH[0])} ${fx(MOUTH[1])}L${fx(sEnd[0])} ${fx(sEnd[1])}`} stroke={DARK} strokeOpacity={0.7} strokeWidth={7 / kz} className="m42raw" />
          <path d={`M${fx(MOUTH[0])} ${fx(MOUTH[1])}L${fx(sEnd[0])} ${fx(sEnd[1])}`} stroke={ACCENT} strokeWidth={3.4 / kz} className="m42raw" />
        </g>
      ) : null}
    </g>
  );
};
/** the table as a volume in the slab's perspective: four square legs, the cloth (a box hanging from the top), the page
 *  lying on the top, the inkpot (a small box) and the reflector's round foot */
const TABLE_X0 = TT[0] - (TBL_W / 2) * SCALE;
const TABLE_X1 = TT[0] + (TBL_W / 2) * SCALE;
const CLOTH_DROP = 62 * SCALE;
const CLOTH_VOL: VolInk = { lit: INK, mid: CREAM.deep, dark: "#A3967A" };
const NewtonTable: React.FC<{ P: Persp }> = ({ P }) => {
  const s = SCALE;
  const [tz0, tz1] = TABLE_Z;
  const legY0 = TT[1] + CLOTH_DROP - 6 * s;
  const leg = (X: number, Z: number, key: string) => <Box key={key} P={P} X0={X - 6 * s} X1={X + 6 * s} Y0={legY0} Y1={SLAB_TOP} Z0={Z - 6 * s} Z1={Z + 6 * s} ink={CLOTH_VOL} uid={`m42tl${key}`} hatch={false} />;
  const lx0 = TABLE_X0 + 22 * s;
  const lx1 = TABLE_X1 - 22 * s;
  const floor = onFloor(P, SLAB_TOP);
  // the page: a sheet lying on the top, near its front edge, the nib's spot inside it
  const pz0 = Z_NEWTON - 26;
  const pz1 = Z_NEWTON + 18;
  const page = [P.p(PAGE[0] - 30 * s, TT[1], pz0), P.p(PAGE[0] + 30 * s, TT[1], pz0), P.p(PAGE[0] + 30 * s, TT[1], pz1), P.p(PAGE[0] - 30 * s, TT[1], pz1)];
  const lines = [0.3, 0.5, 0.7].map((u) => `M${pt(P.p(PAGE[0] - 22 * s, TT[1], pz0 + (pz1 - pz0) * u))}L${pt(P.p(PAGE[0] + 22 * s, TT[1], pz0 + (pz1 - pz0) * u))}`).join("");
  // the cloth's folds on its front face
  const folds = Array.from({ length: 9 }, (_, i) => {
    const X = TABLE_X0 + ((TABLE_X1 - TABLE_X0) * (i + 0.5)) / 9;
    return `M${pt(P.p(X, TT[1] + 4 * s, tz0 - 2))}L${pt(P.p(X + 2 * s, TT[1] + CLOTH_DROP - 2 * s, tz0 - 2))}`;
  }).join("");
  return (
    <g>
      {[lx0, lx1].map((X, i) => (
        <ContactShadow key={`s${i}`} P={floor} X={X} Z={tz0 + 10} w={16 * s} d={14} uid={`m42sh-tl${i}`} amt={0.8} />
      ))}
      {leg(lx0, tz1 - 10, "a")}
      {leg(lx1, tz1 - 10, "b")}
      {leg(lx0, tz0 + 10, "c")}
      {leg(lx1, tz0 + 10, "d")}
      <Box P={P} X0={TABLE_X0 - 5 * s} X1={TABLE_X1 + 5 * s} Y0={TT[1]} Y1={TT[1] + CLOTH_DROP} Z0={tz0 - 2} Z1={tz1 + 2} ink={CLOTH_VOL} uid="m42tcl" hatch={false} />
      <path d={folds} fill="none" stroke={DARK} strokeOpacity={0.35} strokeWidth={1.4 * P.r(tz0)} />
      <path d={`M${page.map(pt).join("L")}Z`} fill={INK} stroke={DARK} strokeWidth={2 * P.r(Z_NEWTON)} strokeLinejoin="round" />
      <path d={lines} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={1.3 * P.r(Z_NEWTON)} />
      <IronBox P={P} X0={PAGE[0] + 58 * s} X1={PAGE[0] + 74 * s} Y0={TT[1] - 16 * s} Y1={TT[1]} Z0={Z_NEWTON - 8 * s} Z1={Z_NEWTON + 8 * s} ink={IRON} uid="m42ink" hatch={false} />
      <FloorDisc P={P} X={REFL_AT[0]} y0={TT[1]} Z={Z_NEWTON} R={30 * s} fill={CREAM.deep} />
    </g>
  );
};
/** Newton in his plane: the reflector's stand and tube, his far arm behind him, himself, the quill */
const NewtonFigure: React.FC<{ g: number }> = ({ g }) => {
  const q = newtonPose(g);
  const a = castAnchors("newton", q, NEWTON_AT, SCALE);
  const hand = a.handL;
  const writing = writingAt(g);
  return (
    <g>
      <MyReflector />
      {/* the far arm (R: he faces right) goes BEHIND his head and body, so at the eyepiece the hand on the tube never
          crosses his face */}
      <Newton pose={q} at={NEWTON_AT} scale={SCALE} uid="m42nwa" coat={ORANGE} onlyArm="R" shade={FIG_SHADE} />
      <Newton pose={q} at={NEWTON_AT} scale={SCALE} uid="m42nwt" coat={ORANGE} hideArm="R" shade={FIG_SHADE} />
      {writing ? (
        <path d={`M${fx(hand[0])} ${fx(hand[1])}L${fx(hand[0] - 4 * SCALE)} ${fx(hand[1] - 34 * SCALE)}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      ) : (
        <path d={`M${fx(PAGE[0] + 66 * SCALE)} ${fx(PAGE[1] - 14 * SCALE)}L${fx(PAGE[0] + 54 * SCALE)} ${fx(PAGE[1] - 60 * SCALE)}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// 1781: THE ENGINE HOUSE as volumes (V5). The bed (a box on its masonry footing), the machine (orbitWorld's
// sun-and-planet + flywheel + pedestal + rod, drawn in its working plane Z_ENGINE with two darker layers behind it for
// the rim's and the legs' depth), the column (a square pillar), the steam cylinder (a vertical cylinder with its bands,
// flange and cover), the piston rod, the beam (an extruded plate) and its pins, the boiler (a brick setting box and a
// wagon drum extruded back from the fire door's face), the coal heap, the crew (world, in the plane Z_CREW).
// ---------------------------------------------------------------------------
/** machine units -> world (the front plane's coordinates of the engine's working plane) */
const mw = (m: P2): P2 => engineToWorld(m);
const EngineVolumes: React.FC<{ P: Persp; g: number }> = ({ P, g }) => {
  const S = ENGINE_S;
  const E = rodPinAt(g);
  const C = pistonPinAt(g);
  const Pv = BEAM_PIVOT;
  const L = Math.hypot(E[0] - Pv[0], E[1] - Pv[1]);
  const ux = (E[0] - Pv[0]) / L;
  const uy = (E[1] - Pv[1]) / L;
  const q = (t: number, w: number): P2 => mw([Pv[0] + ux * t - uy * w, Pv[1] + uy * t + ux * w]);
  const hwP = 40;
  const hwE = 22;
  const end = L + 34;
  // the beam's outline (machine units -> world), its rounded ends as arcs of points
  const beam: P2[] = [];
  const arc = (t: number, a0: number, a1: number) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + ((a1 - a0) * i) / 8;
      beam.push(q(t + Math.cos(a) * hwE, Math.sin(a) * hwE));
    }
  };
  beam.push(q(-end, -hwE), q(0, -hwP));
  arc(end, -Math.PI / 2, Math.PI / 2);
  beam.push(q(0, hwP));
  arc(-end, Math.PI / 2, (3 * Math.PI) / 2);
  const circ = (c: P2, r: number, n = 20): P2[] => Array.from({ length: n }, (_, i) => mw([c[0] + r * Math.cos((i / n) * Math.PI * 2), c[1] + r * Math.sin((i / n) * Math.PI * 2)]));
  const top = Pv[1] + 30;
  const capH = 44;
  const shaftTop = top + capH;
  const plinthH = 50;
  const baseY = BED_TOP - plinthH;
  const colX = mw(Pv)[0];
  const hw = (u: number) => u * COLUMN_W * S;
  const yW = (ym: number) => mw([0, ym])[1];
  const cylX = mw([CYL_X, 0])[0];
  const coverY = CYL_TOP - 56;
  const boxY = coverY - 70;
  const ZE = Z_ENGINE;
  return (
    <g>
      {/* the column: plinth, the square shaft, the capital */}
      <IronBox P={P} X0={colX - hw(0.625)} X1={colX + hw(0.625)} Y0={yW(baseY)} Y1={yW(BED_TOP)} Z0={ZE - hw(0.625)} Z1={ZE + hw(0.625)} ink={IRON} uid="m42cpl" />
      <IronBox P={P} X0={colX - hw(0.38)} X1={colX + hw(0.38)} Y0={yW(shaftTop)} Y1={yW(baseY)} Z0={ZE - hw(0.38)} Z1={ZE + hw(0.38)} ink={IRON} uid="m42csh" />
      <IronBox P={P} X0={colX - hw(0.525)} X1={colX + hw(0.525)} Y0={yW(top)} Y1={yW(shaftTop)} Z0={ZE - hw(0.525)} Z1={ZE + hw(0.525)} ink={IRON} uid="m42ccp" />
      {/* the steam cylinder: the base flange, the body with three bands, the cover and the valve box on it */}
      <IronCylinder P={P} X={cylX} Z={ZE} R={CYL_R_W + 30 * S} Y0={yW(BED_TOP - 44)} Y1={yW(BED_TOP)} ink={IRON} uid="m42cyf" />
      <IronCylinder P={P} X={cylX} Z={ZE} R={CYL_R_W} Y0={yW(CYL_TOP)} Y1={yW(BED_TOP - 44)} ink={IRON} uid="m42cyb" />
      {[0.22, 0.5, 0.78].map((u) => {
        const y = CYL_TOP + (BED_TOP - 40 - CYL_TOP) * u;
        return <IronCylinder key={u} P={P} X={cylX} Z={ZE} R={CYL_R_W + 8 * S} Y0={yW(y - 14)} Y1={yW(y + 14)} ink={IRON} uid={`m42cyr${u}`} />;
      })}
      <IronCylinder P={P} X={cylX} Z={ZE} R={CYL_R_W * 0.86} Y0={yW(coverY)} Y1={yW(CYL_TOP + 8)} ink={IRON} uid="m42cyc" />
      <IronBox P={P} X0={cylX - 42 * S} X1={cylX + 42 * S} Y0={yW(boxY)} Y1={yW(coverY + 2)} Z0={ZE - 42 * S} Z1={ZE + 42 * S} ink={IRON} uid="m42cyv" />
      <IronBox P={P} X0={cylX - 55 * S} X1={cylX + 55 * S} Y0={yW(boxY - 14)} Y1={yW(boxY + 4)} Z0={ZE - 55 * S} Z1={ZE + 55 * S} ink={IRON} uid="m42cyw" />
      {/* the piston rod, up from the valve box to the beam's far end */}
      <Box P={P} X0={mw(C)[0] - 9 * S} X1={mw(C)[0] + 9 * S} Y0={mw(C)[1]} Y1={yW(boxY - 14)} Z0={ZE - 9 * S} Z1={ZE + 9 * S} ink={CREAM_VOL} uid="m42prd" hatch={false} />
      {/* the beam (a plate with depth) and its three pins */}
      <Prism P={P} poly={beam} z0={ZE - 26 * S} z1={ZE + 26 * S} ink={CREAM_VOL} />
      <path d={`M${pt(P.p(...q(-L + 30, 0), ZE - 26 * S))}L${pt(P.p(...q(L - 30, 0), ZE - 26 * S))}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.6 * P.r(ZE)} />
      {[C, E].map((pp, i) => (
        <g key={i}>
          <Prism P={P} poly={circ(pp, 28)} z0={ZE - 40 * S} z1={ZE - 26 * S} ink={CREAM_VOL} />
          <circle cx={P.p(...mw(pp), ZE - 40 * S)[0]} cy={P.p(...mw(pp), ZE - 40 * S)[1]} r={8 * S * P.r(ZE)} fill={DARK} />
        </g>
      ))}
      <Prism P={P} poly={circ(Pv, 44, 24)} z0={ZE - 46 * S} z1={ZE - 26 * S} ink={CREAM_VOL} />
      <circle cx={P.p(...mw(Pv), ZE - 46 * S)[0]} cy={P.p(...mw(Pv), ZE - 46 * S)[1]} r={11 * S * P.r(ZE)} fill={DARK} />
    </g>
  );
};

/** the fire's strength 0..1 at frame g: banked low, then fed by every throw (a flare a few frames after the blade swings in) */
const THROW_FRAMES: number[] = (() => {
  const out: number[] = [];
  for (let g = -SHOVEL_PERIOD; g < 400; g++) {
    if (shovelPhase(g) < SHOVEL_THROW && shovelPhase(g + 1) >= SHOVEL_THROW) out.push(g + 1);
  }
  return out;
})();
const fireAt = (g: number) => {
  const base = 0.25 + 0.75 * ease((g - FIRE_UP[0]) / (FIRE_UP[1] - FIRE_UP[0]));
  let flare = 0;
  for (const t of THROW_FRAMES) {
    const d = g - (t + 3);
    if (d >= 0 && d < 14) flare = Math.max(flare, Math.exp(-d / 4) * (1 - d / 14));
  }
  const flick = 0.06 * (random(`fire-${Math.floor(g / 2)}`) - 0.5);
  return c01(base * (0.85 + 0.15 * flare) + 0.25 * flare + flick);
};
/** the boiler (a brick setting and a wagon drum, extruded back from the face that carries the fire door), its chimney
 *  stub and the coal heap, as volumes; the fire door is drawn on the setting's front face */
const BoilerVolumes: React.FC<{ P: Persp; g: number }> = ({ P, g }) => {
  const b = BOILER;
  const f = fireAt(g);
  const mid = (b.x0 + b.x1) / 2;
  const drumR = (b.x1 - b.x0) / 2 - 18;
  const d = b.door;
  const glow = mixColor("#5A3A16", ACCENT, f);
  const heap = COAL_HEAP;
  const [z0, z1] = BOILER_Z;
  // the wagon drum's face: straight sides up from the setting, a round top
  const drum: P2[] = [[b.x0 + 18, b.setTop]];
  const yTop = b.drumTop;
  const ry = drumR * 0.55;
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (Math.PI * i) / 16;
    drum.push([mid + Math.cos(a) * drumR, yTop + ry + Math.sin(a) * ry]);
  }
  drum.push([b.x1 - 18, b.setTop]);
  const mound: P2[] = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    mound.push([heap.cx - heap.hw - 14 + (2 * heap.hw + 28) * u, CREW_FEET_Y - heap.h * 1.0 * Math.sin(Math.PI * u)]);
  }
  const lumps = Array.from({ length: 14 }, (_, i) => {
    const u = (i + 0.5) / 14;
    const x = heap.cx - heap.hw + 2 * heap.hw * u;
    const hgt = heap.h * Math.sin(Math.PI * u);
    return [x + (random(`l${i}`) - 0.5) * 10, CREW_FEET_Y - hgt * (0.4 + 0.5 * random(`m${i}`))] as P2;
  });
  const fz = planeT(P, z0);
  return (
    <g>
      <ContactShadow P={onFloor(P, CREW_FEET_Y)} X={heap.cx} Z={z0 - 10} w={heap.hw * 1.5} d={50} uid="m42sh-coal" amt={0.8} />
      <ContactShadow P={onFloor(P, CREW_FEET_Y)} X={mid + 40} Z={(z0 + z1) / 2} w={(b.x1 - b.x0) * 0.75} d={(z1 - z0) * 0.6} uid="m42sh-boil" amt={0.7} />
      {/* the coal heap */}
      <Prism P={P} poly={mound} z0={z0 - 40} z1={z0 + 40} ink={COAL} hatch={false} />
      <g transform={planeT(P, z0 - 40)}>
        {lumps.map((pp, i) => (
          <path key={i} d={`M${fx(pp[0] - 7)} ${fx(pp[1] + 3)}L${fx(pp[0] - 2)} ${fx(pp[1] - 5)}L${fx(pp[0] + 7)} ${fx(pp[1] - 2)}L${fx(pp[0] + 4)} ${fx(pp[1] + 5)}Z`} fill={STRUCT_FILL} stroke={SPOKE_INK} strokeWidth={1.4} />
        ))}
      </g>
      {/* the chimney stub (behind the drum's crown), the drum, the brick setting */}
      <IronBox P={P} X0={b.x1 - 70} X1={b.x1 - 30} Y0={b.drumTop - 120} Y1={b.drumTop + 30} Z0={z1 - 90} Z1={z1 - 50} ink={IRON} uid="m42chm" />
      <Prism P={P} poly={drum} z0={z0} z1={z1} ink={IRON} />
      <path d={`M${pt(P.p(b.x0 + 34, b.drumTop + 70, z0))}L${pt(P.p(b.x1 - 34, b.drumTop + 70, z0))}`} stroke={SPOKE_INK} strokeOpacity={0.4} strokeWidth={1.4 * P.r(z0)} />
      <IronBox P={P} X0={b.x0} X1={b.x1} Y0={b.setTop} Y1={CREW_FEET_Y} Z0={z0} Z1={z1} ink={STONE} uid="m42set" />
      <g transform={fz}>
        {[0.25, 0.5, 0.75].map((u) => (
          <path key={u} d={`M${fx(b.x0 + 4)} ${fx(b.setTop + (CREW_FEET_Y - b.setTop) * u)}L${fx(b.x1 - 4)} ${fx(b.setTop + (CREW_FEET_Y - b.setTop) * u)}`} stroke={SPOKE_INK} strokeOpacity={0.3} strokeWidth={1.4} />
        ))}
        {/* the fire door: an open mouth glowing with the fire, an iron frame */}
        <path d={`M${fx(d.x0)} ${fx(d.y0)}L${fx(d.x1)} ${fx(d.y0)}L${fx(d.x1)} ${fx(d.y1)}L${fx(d.x0)} ${fx(d.y1)}Z`} fill={glow} stroke={DARK} strokeWidth={5} />
        <path d={`M${fx(d.x0 + 8)} ${fx(d.y1 - 6)}Q${fx(d.x0 + 22)} ${fx(d.y1 - 26 - 30 * f)} ${fx(d.x0 + 34)} ${fx(d.y1 - 8)}Q${fx(d.x0 + 48)} ${fx(d.y1 - 34 - 34 * f)} ${fx(d.x0 + 62)} ${fx(d.y1 - 8)}Q${fx(d.x0 + 74)} ${fx(d.y1 - 22 - 26 * f)} ${fx(d.x1 - 8)} ${fx(d.y1 - 6)}Z`} fill={mixColor(ACCENT_DEEP, "#FFE3A0", f * 0.6)} opacity={0.4 + 0.6 * f} />
        <path d={`M${fx(d.x0 - 8)} ${fx(d.y0 - 8)}L${fx(d.x1 + 8)} ${fx(d.y0 - 8)}L${fx(d.x1 + 8)} ${fx(d.y0)}L${fx(d.x0 - 8)} ${fx(d.y0)}Z`} {...iron} />
      </g>
    </g>
  );
};

/** the lever-man's fists (mid-grip) for lever t (0 high, 1 low) */
const leverFist = (t: number, g = 0): P2 => {
  const a = castAnchors("worker", idle(POSES.lever(LEVERMAN.dir, t), g, 17, 0.4), [LEVERMAN.x, CREW_FEET_Y], SCALE);
  return [(a.handL[0] + a.handR[0]) / 2, (a.handL[1] + a.handR[1]) / 2];
};
/** the hand lever's pivot: a bracket on the cylinder's side under the valve chest, level with the middle of its swing */
const CYL_RIGHT = engineToWorld([CYL_X + CYL_HW, 0])[0];
const LEVER_PIVOT: P2 = [CYL_RIGHT + 26, (leverFist(0)[1] + leverFist(1)[1]) / 2];
const VALVE_X = CYL_RIGHT + 30;
const VALVE_TOP = LEVER_PIVOT[1] - 250;
const LEVER_W = 24; // world px: the beam's weight at this scale
const leverT = (g: number) => ease((g - LEVER_PULL[0]) / (LEVER_PULL[1] - LEVER_PULL[0]));
const Crew: React.FC<{ g: number }> = ({ g }) => {
  // the stoker: the shovel cycle, always at work
  const sq = idle(POSES.shovel(STOKER.dir, shovelPhase(g)), g, 11, 0.3);
  // the lever-man: waits with his fists on the raised lever, pulls it down, holds; then watches the beam
  const lt = leverT(g);
  let lq = POSES.lever(LEVERMAN.dir, lt);
  if (g > LEVER_PULL[1] + 14) lq = headTurn(lq, LEVERMAN.dir * 0.5, -14 * ease((g - LEVER_PULL[1] - 14) / 20));
  lq = idle(lq, g, 17, 0.4);
  const la = castAnchors("worker", lq, [LEVERMAN.x, CREW_FEET_Y], SCALE);
  const fist: P2 = [(la.handL[0] + la.handR[0]) / 2, (la.handL[1] + la.handR[1]) / 2];
  const lu: P2 = [fist[0] - LEVER_PIVOT[0], fist[1] - LEVER_PIVOT[1]];
  const ll = Math.hypot(lu[0], lu[1]);
  const ux = lu[0] / ll;
  const uy = lu[1] / ll;
  /** a point t along the lever from the pivot (towards his fists), w across it */
  const lq2 = (t: number, w: number): string => `${fx(LEVER_PIVOT[0] + ux * t - uy * w)} ${fx(LEVER_PIVOT[1] + uy * t + ux * w)}`;
  const tail = -22;
  const head = ll + 34;
  const leverD = `M${lq2(tail, -LEVER_W / 2)}L${lq2(head - 6, -LEVER_W * 0.42)}A${LEVER_W * 0.42} ${LEVER_W * 0.42} 0 0 1 ${lq2(head - 6, LEVER_W * 0.42)}L${lq2(tail, LEVER_W / 2)}Z`;
  // the valve rod: from a pin on the lever near the pivot up into the valve chest's gland (it slides as the lever swings)
  const rodPin: P2 = [LEVER_PIVOT[0] + ux * 30, LEVER_PIVOT[1] + uy * 30];
  // the engineer: on "inventing" he turns to the engine and points up at the beam (f192-204), holds it while the
  // lever-man opens the steam and the engine starts, lowers his arm (f236-250) and watches; looks back up at f257
  const pt = ease((g - 192) / 12) * (1 - ease((g - 236) / 14));
  const look = ease((g - 192) / 12) * (1 - ease((g - 270) / 30)) + 0.6 * ease((g - 257) / 10) * (1 - ease((g - 290) / 30));
  const E_STAND = POSES.stand(ENGINEER.dir);
  const E_POINT: FigPose = {
    ...E_STAND,
    lean: E_STAND.lean,
    armL: { w: [-150, -292], elbow: [-0.2, 1], fist: 0.15, hand: -40 }, // londonCastV2: pulled in so the bigger hand stops short of the flywheel rim
    brow: -0.2,
  };
  let eq = lerpFig(E_STAND, E_POINT, pt);
  eq = headTurn(eq, ENGINEER.dir * 0.66, -24 * Math.min(1, look));
  eq = idle(eq, g, 23, 0.6);
  return (
    <g>
      <Worker pose={sq} at={[STOKER.x, CREW_FEET_Y]} scale={SCALE} uid="m42stk" tool="shovel" shade={FIG_SHADE} />
      {/* the steam valve: a valve chest on the cylinder's side; its rod runs down to a pin on the hand lever, which the lever-man hauls down */}
      <path d={`M${fx(rodPin[0])} ${fx(VALVE_TOP + 110)}L${fx(rodPin[0])} ${fx(rodPin[1])}`} stroke={DARK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${fx(rodPin[0])} ${fx(VALVE_TOP + 110)}L${fx(rodPin[0])} ${fx(rodPin[1])}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      {/* the bracket on the cylinder, the lever on its pin */}
      <path d={`M${fx(CYL_RIGHT - 4)} ${fx(LEVER_PIVOT[1] - 30)}L${fx(LEVER_PIVOT[0] + 10)} ${fx(LEVER_PIVOT[1] - 12)}L${fx(LEVER_PIVOT[0] + 10)} ${fx(LEVER_PIVOT[1] + 12)}L${fx(CYL_RIGHT - 4)} ${fx(LEVER_PIVOT[1] + 30)}Z`} {...iron} />
      <path d={leverD} fill={INK} stroke={DARK} strokeWidth={3.6} strokeLinejoin="round" paintOrder="stroke" />
      <path d={`M${lq2(12, 0)}L${lq2(head - 18, 0)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.6} />
      <circle cx={LEVER_PIVOT[0]} cy={LEVER_PIVOT[1]} r={10} fill={INK} stroke={DARK} strokeWidth={3} />
      <circle cx={LEVER_PIVOT[0]} cy={LEVER_PIVOT[1]} r={4} fill={DARK} />
      <circle cx={rodPin[0]} cy={rodPin[1]} r={6} fill={DARK} />
      <Worker pose={lq} at={[LEVERMAN.x, CREW_FEET_Y]} scale={SCALE} uid="m42lev" cap={false} shade={FIG_SHADE} />
      <Fellow pose={eq} at={[ENGINEER.x, ENGINEER_FEET_Y]} scale={SCALE} uid="m42eng" variant={4} coat={ORANGE} shade={FIG_SHADE} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// A YEAR: Libre Caslon Text lining figures, screen-sized at a world point, slides up as it fades in
// ---------------------------------------------------------------------------
const YEAR_SIZE = 46;
const Year: React.FC<{ text: string; at: P2; cam: Cam; frame: number; f0: number; out?: number; back?: number; dx?: number; dy?: number; anchor?: "start" | "middle" | "end" }> = ({
  text,
  at,
  cam,
  frame,
  f0,
  out,
  back,
  dx = 0,
  dy = 0,
  anchor = "middle",
}) => {
  let sl = labelSlide(frame, f0);
  if (out !== undefined && back !== undefined && frame >= out) {
    if (frame < back) {
      // it leaves before the camera carries it to the frame edge: the entrance played backwards
      const r = labelSlide(out + 14 - (frame - out), out);
      sl = frame - out > 14 ? { dy: 0, op: 0 } : r;
    } else {
      // the return: a short slide (40 % of the entrance travel), so it rises in just above the caption band
      const r = labelSlide(frame, back);
      sl = { dy: r.dy * 0.4, op: r.op };
    }
  }
  if (sl.op <= 0.002) return null;
  const [sx, sy] = screenOf(at, cam);
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + dx}
        y={sy + dy + sl.dy}
        textAnchor={anchor}
        opacity={sl.op}
        fill={INK}
        stroke={DARK}
        strokeOpacity={0.55}
        strokeWidth={YEAR_SIZE * 0.12}
        paintOrder="stroke"
        style={{ fontFamily: caslon, fontSize: YEAR_SIZE, letterSpacing: YEAR_SIZE * 0.04 }}
      >
        {text}
      </text>
    </svg>
  );
};
/** label anchors (world) and offsets (screen px), shared with the framing check */
export const LABELS = {
  y1687: { at: P1687, dx: 14, dy: 40, anchor: "start" as const }, // under the slab, right of the corner the line climbs from
  y1781: { at: A1781, dx: 14, dy: 48, anchor: "start" as const },
  y1900: { at: pointAtYear(LINE_END_YEAR), dx: -24, dy: 58, anchor: "end" as const }, // below-left of the tip, clear of the top edge
};

/** the steam valve's chest on the cylinder's side (a box) and its gland; its rod runs down to the hand lever */
const ValveChest: React.FC<{ P: Persp }> = ({ P }) => (
  <g>
    <IronBox P={P} X0={VALVE_X - 29} X1={VALVE_X + 29} Y0={VALVE_TOP} Y1={VALVE_TOP + 96} Z0={Z_CREW} Z1={Z_CREW + 50} ink={IRON} uid="m42vch" />
    <IronBox P={P} X0={VALVE_X - 15} X1={VALVE_X + 15} Y0={VALVE_TOP + 96} Y1={VALVE_TOP + 114} Z0={Z_CREW + 8} Z1={Z_CREW + 30} ink={IRON} uid="m42vgl" hatch={false} />
  </g>
);

/** ONE INK WEIGHT: the figures' and props' strokes are drawn in world units, so a close camera thickens them.
 *  Above INK_K0 (the crew framing) they are scaled back by inkFactor so the close shots' (and the crew's) line,
 *  outline and hatching keep about the crew's on-screen weight (typed CSS attr(), Chrome 133+; the sight-line opts out). */
const INK_K0 = 0.6;
const inkFactor = (k: number) => Math.min(1, Math.pow(INK_K0 / k, 0.75));
const INK_CSS = ".m42ink [stroke-width]:not(.m42raw){stroke-width:calc(attr(stroke-width type(<number>)) * var(--inkf))}";
const inkStyle = (k: number) => ({ ["--inkf" as string]: inkFactor(k).toFixed(4) }) as React.CSSProperties;

const MachinesAndOutputV5: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const g = frame;
  const cam = camAtG(g);
  const v: View = viewAtG(g);
  const k = cam.k;
  // the one camera, handed to the depth kit: eye at the horizon's world height, a dolly (D = FOCAL / k)
  const P = perspective(cam, { eyeY: v.Ye, dRef: FOCAL, kRef: 1, dolly: 1 });
  const tip = Math.max(MACHINE_YEAR, orangeTipYear(g));
  const keyOf = (z: number) => z + 1e-3;
  const layers: Layer[] = [];
  const add = (key: number, el: React.ReactNode) => layers.push({ key, el });
  const addDom = (key: number, dom: React.ReactNode) => layers.push({ key, dom });

  // the ground
  layers.push(...landformLayers(P, k, tip, keyOf));

  // 1687: the sky far behind, the slab on its footing, the table, the reflector and Newton
  const kN = k * P.r(Z_NEWTON);
  add(Z_FAR + 100, <g key="sky" transform={planeT(P, Z_NEWTON)}><NewtonSky g={g} kz={kN} /></g>);
  add(SLAB_Z1, (
    <g key="slab">
      <Prism P={P} poly={footingPoly(SLAB_X0, SLAB_X1, SLAB_TOP + SLAB_T)} z0={0} z1={SLAB_Z1} ink={STONE} front={false} />
      <Footing x0={SLAB_X0} x1={SLAB_X1} under={SLAB_TOP + SLAB_T} />
      <IronBox P={P} X0={SLAB_X0} X1={SLAB_X1} Y0={SLAB_TOP} Y1={SLAB_TOP + SLAB_T} Z0={0} Z1={SLAB_Z1} ink={IRON} uid="m42slab" />
      <Slab x0={SLAB_X0} x1={SLAB_X1} top={SLAB_TOP} t={SLAB_T} joints={3} />
      <GroundPlane P={onFloor(P, SLAB_TOP)} kind="flags" x0={SLAB_X0} x1={SLAB_X1} z0={0} zFar={SLAB_Z1 + 260} course={150} uid="m42slabf" tone={0.8} />
    </g>
  ));
  add(TABLE_Z[1], <NewtonTable key="table" P={P} />);
  add(Z_NEWTON + 0.01, <ContactShadow key="nsh" P={onFloor(P, SLAB_TOP)} X={NEWTON_AT[0] + 10 * SCALE} Z={Z_NEWTON} w={60 * SCALE} d={34} uid="m42sh-nwt" />);
  add(Z_NEWTON, (
    <g key="newton" transform={planeT(P, Z_NEWTON)} className="m42ink" style={inkStyle(kN)}>
      <NewtonFigure g={g} />
    </g>
  ));

  // 1781: the bed on its footing, the machine in its plane with its depth layers, the engine's volumes, the boiler,
  // the crew in front
  add(BED_Z1, (
    <g key="bed">
      <Prism P={P} poly={footingPoly(BED_WX0, BED_WX1, CREW_FEET_Y + BED_T * ENGINE_S)} z0={0} z1={BED_Z1} ink={STONE} front={false} />
      <Footing x0={BED_WX0} x1={BED_WX1} under={CREW_FEET_Y + BED_T * ENGINE_S} />
      <IronBox P={P} X0={BED_WX0} X1={BED_WX1} Y0={CREW_FEET_Y} Y1={CREW_FEET_Y + BED_T * ENGINE_S} Z0={0} Z1={BED_Z1} ink={IRON} uid="m42bed" />
      <Slab x0={BED_WX0} x1={BED_WX1} top={CREW_FEET_Y} t={BED_T * ENGINE_S} joints={6} />
      <GroundPlane P={onFloor(P, CREW_FEET_Y)} kind="flags" x0={BED_WX0} x1={BED_WX1} z0={0} zFar={BED_Z1 + 300} course={150} uid="m42bedf" tone={0.8} />
    </g>
  ));
  const bedFloor = onFloor(P, CREW_FEET_Y);
  const colX = engineToWorld(BEAM_PIVOT)[0];
  const cylX = engineToWorld([CYL_X, 0])[0];
  add(Z_ENGINE + 40, (
    <g key="eshadows">
      {[-1, 1].map((sg) => (
        <ContactShadow key={sg} P={bedFloor} X={A1781[0] + sg * 200} Z={Z_ENGINE} w={70} d={48} uid={`m42sh-leg${sg}`} amt={0.8} />
      ))}
      <ContactShadow P={bedFloor} X={colX} Z={Z_ENGINE} w={COLUMN_W * ENGINE_S * 0.9} d={60} uid="m42sh-col" amt={0.8} />
      <ContactShadow P={bedFloor} X={cylX} Z={Z_ENGINE} w={CYL_R_W + 40} d={CYL_R_W} uid="m42sh-cyl" amt={0.8} />
    </g>
  ));
  const machineAt = (z: number, dim: number, id: string) => {
    const mc = engineCam(camAtZ(v, z));
    const pinY = screenOf(rodPinAt(g), mc)[1];
    return (
      <div key={id} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, clipPath: `inset(${Math.max(0, pinY).toFixed(2)}px 0px 0px 0px)`, filter: dim < 1 ? `brightness(${dim})` : undefined }}>
        <SunAndPlanetMachine frame={engineFrameAt(g)} cam={mc} idPrefix={id} />
      </div>
    );
  };
  addDom(Z_ENGINE + 24, machineAt(Z_ENGINE + 24, 0.42, "m42mb"));
  addDom(Z_ENGINE + 12, machineAt(Z_ENGINE + 12, 0.6, "m42mm"));
  addDom(Z_ENGINE + 0.002, machineAt(Z_ENGINE, 1, "m42"));
  add(Z_ENGINE, <EngineVolumes key="engine" P={P} g={g} />);
  add(BOILER_Z[1] - 80, <BoilerVolumes key="boiler" P={P} g={g} />);
  add(Z_CREW + 0.02, <ValveChest key="valve" P={P} />);
  const kC = k * P.r(Z_CREW);
  add(Z_CREW + 0.01, (
    <g key="cshadows">
      <ContactShadow P={bedFloor} X={STOKER.x} Z={Z_CREW} w={58 * SCALE} d={32} uid="m42sh-stk" />
      <ContactShadow P={bedFloor} X={LEVERMAN.x} Z={Z_CREW} w={52 * SCALE} d={32} uid="m42sh-lev" />
      <ContactShadow P={onFloor(P, ENGINEER_FEET_Y)} X={ENGINEER.x} Z={Z_CREW} w={46 * SCALE} d={30} uid="m42sh-eng" />
    </g>
  ));
  add(Z_CREW, (
    <g key="crew" transform={planeT(P, Z_CREW)} className="m42ink" style={inkStyle(kC)}>
      <Crew g={g} />
    </g>
  ));
  // the front edge: the line over everything on the front plane
  add(-1, <ChartLine key="line" g={g} cam={cam} />);

  // painter's order: far to near (stable), in WorldSvg runs broken by the machine's DOM layers
  const sorted = layers.map((l, i) => ({ ...l, i })).sort((a, b) => b.key - a.key || a.i - b.i);
  const runs: React.ReactNode[] = [];
  let run: React.ReactNode[] = [];
  const flush = () => {
    if (!run.length) return;
    runs.push(
      <WorldSvg key={`run${runs.length}`} cam={cam}>
        <style>{INK_CSS}</style>
        {run}
      </WorldSvg>,
    );
    run = [];
  };
  for (const l of sorted) {
    if (l.dom) {
      flush();
      runs.push(l.dom);
    } else run.push(<React.Fragment key={`l${l.i}`}>{l.el}</React.Fragment>);
  }
  flush();
  return (
    <TexcocoPage cam={cam}>
      {runs}
      <Year text="1687" {...LABELS.y1687} cam={cam} frame={g} f0={LABEL_F0.y1687} out={LABEL_1687_OUT} back={LABEL_1687_BACK} />
      <Year text="1781" {...LABELS.y1781} cam={cam} frame={g} f0={LABEL_F0.y1781} />
      <Year text="1900" {...LABELS.y1900} cam={cam} frame={g} f0={LABEL_F0.y1900} />
    </TexcocoPage>
  );
};

export default MachinesAndOutputV5;
