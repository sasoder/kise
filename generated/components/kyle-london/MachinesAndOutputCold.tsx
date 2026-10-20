// ---------------------------------------------------------------------------
// MachinesAndOutputCold (kyle-london, cut 42): the cold-review revision of MachinesAndOutput V2, "people working". Dwarkesh map style
// (styles/dwarkesh-map.md). Opaque 1080x1920, 29.97 fps, 336 frames, the umber page with no map
// (kits/maps TexcocoPage). The people come from the shared London cast (./londonCast.tsx, read only);
// the chart world, the engine geometry, the timeline and the camera are in ./machinesAndOutputPlan.ts,
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
import { CREAM, Fellow, Newton, ORANGE, POSES, Table, Worker, castAnchors, headTurn, idle, lerpFig, scaleForPx, tableTop, type FigPose } from "./londonCast";
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
} from "./machinesAndOutputPlanCold";

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
const rect = (cx: number, y0: number, w: number, h: number) => `M${fx(cx - w / 2)} ${fx(y0)}L${fx(cx + w / 2)} ${fx(y0)}L${fx(cx + w / 2)} ${fx(y0 + h)}L${fx(cx - w / 2)} ${fx(y0 + h)}Z`;

// line weights in screen px (a drawn chart line keeps its weight through the zoom)
const CREAM_W = 10;
const ORANGE_W = 12;
const CASE_W = 3;
const NIB_R = 9;
/** structure: the dark-umber plane of orbitWorld's pedestal (PED_FILL, not exported) in the context cream line */
const STRUCT_FILL = "#2B231A";
const iron = { fill: STRUCT_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };
const SCALE = scaleForPx(CREW_PX);

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
/** the line's world y at world x (on the plotted straight segments) */
const lineYAtX = (x: number) => pointAtYear(MACHINE_YEAR + (x - A1781[0]) / SX)[1];
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
/** an engraved lift for a dark mass: a light edge on its lit (upper-left) sides and hatching on its shaded right side */
const Lit: React.FC<{ x0: number; y0: number; x1: number; y1: number; u?: number; id: string }> = ({ x0, y0, x1, y1, u = 1, id }) => {
  const hx0 = x1 - (x1 - x0) * 0.38;
  const lines: string[] = [];
  for (let x = hx0 - (y1 - y0); x < x1; x += 10 * u) lines.push(`M${fx(x)} ${fx(y1)}L${fx(x + (y1 - y0) * 0.5)} ${fx(y0)}`);
  return (
    <g>
      <clipPath id={id}>
        <rect x={hx0} y={y0} width={x1 - hx0} height={y1 - y0} />
      </clipPath>
      <path d={lines.join("")} stroke={SPOKE_INK} strokeOpacity={0.5} strokeWidth={1.6 * u} clipPath={`url(#${id})`} />
      <path d={`M${fx(x0 + 3 * u)} ${fx(y1 - 4 * u)}L${fx(x0 + 3 * u)} ${fx(y0 + 3 * u)}L${fx(x1 - 4 * u)} ${fx(y0 + 3 * u)}`} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={3 * u} strokeLinejoin="round" />
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
const PAGE: P2 = [TT[0] + 40 * SCALE, TT[1] - 3 * SCALE]; // the page on the table (its middle)
/** Newton's poses (facing right): bent to the eyepiece, upright writing on the page, looking up at the moon */
const N_BEND0: FigPose = { ...POSES.eyepiece(1), lean: 30, crouch: 16, pitch: 20, headYaw: 1.0 };
/** where his feet go so his eye is at the eyepiece in N_BEND (the head does not depend on the arms) */
const NEWTON_AT: P2 = (() => {
  const a = castAnchors("newton", N_BEND0, [0, 0], 1);
  const eye = [a.headC[0] + 15, a.headC[1] - 1];
  return [EYEPIECE[0] - eye[0] * SCALE - 4 * SCALE, EYEPIECE[1] - eye[1] * SCALE + 2 * SCALE];
})();
const toFig = (w: P2): P2 => [(w[0] - NEWTON_AT[0]) / SCALE, (w[1] - NEWTON_AT[1]) / SCALE];
/** at the eyepiece: the near hand steadies the tube above the ball, the far hand rests on the table by the mount */
const N_BEND: FigPose = {
  ...N_BEND0,
  armL: { w: toFig(tubeAt(-36)), elbow: [-0.3, 1], fist: 0.55, hand: -20 },
  armR: { w: toFig([REFL_AT[0] + 34 * SCALE, TT[1] - 4 * SCALE]), elbow: [-0.4, 1], fist: 0.1, hand: 10 },
};
const N_WRITE: FigPose = { ...POSES.stand(1), lean: 14, crouch: 6, pitch: 22, headYaw: 0.9, armL: { w: [128, -176], elbow: [-0.4, 1], fist: 0.75, hand: 30 }, armR: { w: [104, -170], elbow: [-0.3, 1], fist: 0.2, hand: 10 }, brow: 0.4 };
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
      <ellipse cx={b[0]} cy={b[1] - 3 * s} rx={30 * s} ry={7 * s} fill={CREAM.deep} {...line} />
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
const NewtonScene: React.FC<{ g: number; cam: Cam }> = ({ g, cam }) => {
  const q = newtonPose(g);
  const a = castAnchors("newton", q, NEWTON_AT, SCALE);
  const hand = a.handL;
  const writing = writingAt(g);
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
          <path d={`M${fx(MOUTH[0])} ${fx(MOUTH[1])}L${fx(sEnd[0])} ${fx(sEnd[1])}`} stroke={DARK} strokeOpacity={0.7} strokeWidth={7 / cam.k} className="m42raw" />
          <path d={`M${fx(MOUTH[0])} ${fx(MOUTH[1])}L${fx(sEnd[0])} ${fx(sEnd[1])}`} stroke={ACCENT} strokeWidth={3.4 / cam.k} className="m42raw" />
        </g>
      ) : null}
      <Table at={TABLE_AT} scale={SCALE} uid="m42tbl" w={TBL_W} />
      <MyReflector />
      {/* the page on the table and the inkwell */}
      <path d={`M${fx(PAGE[0] - 30 * SCALE)} ${fx(PAGE[1])}L${fx(PAGE[0] + 34 * SCALE)} ${fx(PAGE[1])}L${fx(PAGE[0] + 44 * SCALE)} ${fx(PAGE[1] - 12 * SCALE)}L${fx(PAGE[0] - 20 * SCALE)} ${fx(PAGE[1] - 12 * SCALE)}Z`} fill={INK} stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={`M${fx(PAGE[0] - 16 * SCALE)} ${fx(PAGE[1] - 4 * SCALE)}L${fx(PAGE[0] + 18 * SCALE)} ${fx(PAGE[1] - 4 * SCALE)}M${fx(PAGE[0] - 12 * SCALE)} ${fx(PAGE[1] - 8 * SCALE)}L${fx(PAGE[0] + 24 * SCALE)} ${fx(PAGE[1] - 8 * SCALE)}`} stroke={DARK} strokeOpacity={0.5} strokeWidth={1.4} />
      <path d={rect(PAGE[0] + 66 * SCALE, PAGE[1] - 16 * SCALE, 16 * SCALE, 16 * SCALE)} fill={STRUCT_FILL} stroke={DARK} strokeWidth={2} />
      <Newton pose={q} at={NEWTON_AT} scale={SCALE} uid="m42nwt" coat={ORANGE} />
      {writing ? (
        <path d={`M${fx(hand[0])} ${fx(hand[1])}L${fx(hand[0] - 22 * SCALE)} ${fx(hand[1] - 44 * SCALE)}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      ) : (
        <path d={`M${fx(PAGE[0] + 66 * SCALE)} ${fx(PAGE[1] - 14 * SCALE)}L${fx(PAGE[0] + 54 * SCALE)} ${fx(PAGE[1] - 60 * SCALE)}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// 1781: THE ENGINE HOUSE. The bed (world), the machine (orbitWorld's sun-and-planet + flywheel + rod, drawn
// in machine units under engineCam), the column, cylinder, piston rod and beam (machine units, scaled by
// ENGINE_S about the 1781 point), the boiler with its fire door, the coal heap and the crew (world).
// ---------------------------------------------------------------------------
const ENGINE_G = `translate(${fx(A1781[0])} ${fx(A1781[1])}) scale(${ENGINE_S}) translate(${fx(-A1781[0])} ${fx(-A1781[1])})`;
const EngineParts: React.FC<{ g: number }> = ({ g }) => {
  const E = rodPinAt(g);
  const C = pistonPinAt(g);
  const P = BEAM_PIVOT;
  const L = Math.hypot(E[0] - P[0], E[1] - P[1]);
  const ux = (E[0] - P[0]) / L;
  const uy = (E[1] - P[1]) / L;
  const q = (t: number, w: number): string => `${fx(P[0] + ux * t - uy * w)} ${fx(P[1] + uy * t + ux * w)}`;
  const hwP = 40;
  const hwE = 22;
  const end = L + 34;
  const beamD = `M${q(-end, -hwE)}L${q(0, -hwP)}L${q(end, -hwE)}A${hwE} ${hwE} 0 0 1 ${q(end, hwE)}L${q(0, hwP)}L${q(-end, hwE)}A${hwE} ${hwE} 0 0 1 ${q(-end, -hwE)}Z`;
  const stroke = { stroke: DARK, strokeWidth: 3.4, strokeLinejoin: "round" as const, paintOrder: "stroke" as const };
  const top = P[1] + 30;
  const capH = 44;
  const shaftTop = top + capH;
  const plinthH = 50;
  const baseY = BED_TOP - plinthH;
  const shaftD = `M${fx(P[0] - COLUMN_W * 0.3)} ${fx(shaftTop)}L${fx(P[0] + COLUMN_W * 0.3)} ${fx(shaftTop)}L${fx(P[0] + COLUMN_W * 0.42)} ${fx(baseY)}L${fx(P[0] - COLUMN_W * 0.42)} ${fx(baseY)}Z`;
  const cx = CYL_X;
  const coverY = CYL_TOP - 56;
  const r = 44;
  const bodyD = `M${fx(cx - CYL_HW)} ${fx(BED_TOP - 40)}L${fx(cx - CYL_HW)} ${fx(CYL_TOP + r)}Q${fx(cx - CYL_HW)} ${fx(CYL_TOP)} ${fx(cx - CYL_HW + r)} ${fx(CYL_TOP)}L${fx(cx + CYL_HW - r)} ${fx(CYL_TOP)}Q${fx(cx + CYL_HW)} ${fx(CYL_TOP)} ${fx(cx + CYL_HW)} ${fx(CYL_TOP + r)}L${fx(cx + CYL_HW)} ${fx(BED_TOP - 40)}Z`;
  const coverD = `M${fx(cx - CYL_HW - 26)} ${fx(CYL_TOP + 8)}L${fx(cx - CYL_HW + 10)} ${fx(coverY)}L${fx(cx + CYL_HW - 10)} ${fx(coverY)}L${fx(cx + CYL_HW + 26)} ${fx(CYL_TOP + 8)}Z`;
  const boxY = coverY - 70;
  return (
    <g transform={ENGINE_G}>
      <path d={shaftD} {...iron} />
      <Lit x0={P[0] - COLUMN_W * 0.33} y0={shaftTop} x1={P[0] + COLUMN_W * 0.36} y1={baseY} u={1.67} id="m42col" />
      <path d={rect(P[0], top, COLUMN_W * 1.05, capH)} {...iron} />
      <path d={rect(P[0], baseY, COLUMN_W * 1.25, plinthH)} {...iron} />
      <path d={rect(cx, C[1], 26, boxY + 10 - C[1])} fill={INK} {...stroke} />
      <path d={bodyD} {...iron} />
      <Lit x0={cx - CYL_HW} y0={CYL_TOP + 20} x1={cx + CYL_HW} y1={BED_TOP - 44} u={1.67} id="m42cyl" />
      {[0.22, 0.5, 0.78].map((u) => {
        const y = CYL_TOP + (BED_TOP - 40 - CYL_TOP) * u;
        return <path key={u} d={rect(cx, y - 14, CYL_HW * 2 + 16, 28)} {...iron} />;
      })}
      <path d={rect(cx, BED_TOP - 44, CYL_HW * 2 + 60, 44)} {...iron} />
      <path d={coverD} {...iron} />
      <path d={rect(cx, boxY, 84, coverY - boxY + 2)} {...iron} />
      <path d={rect(cx, boxY - 14, 110, 18)} {...iron} />
      <path d={beamD} fill={INK} {...stroke} />
      <path d={`M${q(-L + 30, 0)}L${q(L - 30, 0)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.6} />
      {[C, E].map((pp, i) => (
        <g key={i}>
          <circle cx={pp[0]} cy={pp[1]} r={28} fill={INK} {...stroke} />
          <circle cx={pp[0]} cy={pp[1]} r={8} fill={DARK} />
        </g>
      ))}
      <circle cx={P[0]} cy={P[1]} r={44} fill={INK} {...stroke} />
      <circle cx={P[0]} cy={P[1]} r={11} fill={DARK} />
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
const BoilerAndCoal: React.FC<{ g: number }> = ({ g }) => {
  const b = BOILER;
  const f = fireAt(g);
  const mid = (b.x0 + b.x1) / 2;
  const drumR = (b.x1 - b.x0) / 2;
  const d = b.door;
  const glow = mixColor("#5A3A16", ACCENT, f);
  const heap = COAL_HEAP;
  const lumps = Array.from({ length: 14 }, (_, i) => {
    const u = (i + 0.5) / 14;
    const x = heap.cx - heap.hw + 2 * heap.hw * u;
    const hgt = heap.h * Math.sin(Math.PI * u);
    return [x + (random(`l${i}`) - 0.5) * 10, CREW_FEET_Y - hgt * (0.4 + 0.5 * random(`m${i}`))] as P2;
  });
  return (
    <g>
      {/* the coal heap */}
      <path d={`M${fx(heap.cx - heap.hw - 14)} ${fx(CREW_FEET_Y)}Q${fx(heap.cx)} ${fx(CREW_FEET_Y - heap.h * 2)} ${fx(heap.cx + heap.hw + 14)} ${fx(CREW_FEET_Y)}Z`} fill={DARK} stroke={SPOKE_INK} strokeWidth={2.6} />
      {lumps.map((p, i) => (
        <path key={i} d={`M${fx(p[0] - 7)} ${fx(p[1] + 3)}L${fx(p[0] - 2)} ${fx(p[1] - 5)}L${fx(p[0] + 7)} ${fx(p[1] - 2)}L${fx(p[0] + 4)} ${fx(p[1] + 5)}Z`} fill={STRUCT_FILL} stroke={SPOKE_INK} strokeWidth={1.4} />
      ))}
      {/* the boiler: a brick setting, the wagon drum on it, a flue to the chimney stub */}
      <path d={`M${fx(b.x0 + 18)} ${fx(b.setTop)}L${fx(b.x0 + 18)} ${fx(b.drumTop + drumR * 0.55)}Q${fx(b.x0 + 18)} ${fx(b.drumTop)} ${fx(mid)} ${fx(b.drumTop)}Q${fx(b.x1 - 18)} ${fx(b.drumTop)} ${fx(b.x1 - 18)} ${fx(b.drumTop + drumR * 0.55)}L${fx(b.x1 - 18)} ${fx(b.setTop)}Z`} {...iron} />
      <path d={`M${fx(b.x0 + 34)} ${fx(b.drumTop + 70)}L${fx(b.x1 - 34)} ${fx(b.drumTop + 70)}`} stroke={SPOKE_INK} strokeOpacity={0.4} strokeWidth={1.4} />
      <path d={rect(b.x1 - 50, b.drumTop - 120, 40, 120)} {...iron} />
      <Lit x0={b.x0 + 18} y0={b.drumTop + drumR * 0.3} x1={b.x1 - 18} y1={b.setTop} id="m42drum" />
      <path d={`M${fx(b.x0)} ${fx(b.setTop)}L${fx(b.x1)} ${fx(b.setTop)}L${fx(b.x1)} ${fx(CREW_FEET_Y)}L${fx(b.x0)} ${fx(CREW_FEET_Y)}Z`} {...iron} />
      <Lit x0={b.x0} y0={b.setTop} x1={b.x1} y1={CREW_FEET_Y} id="m42set" />
      {[0.25, 0.5, 0.75].map((u) => (
        <path key={u} d={`M${fx(b.x0 + 4)} ${fx(b.setTop + (CREW_FEET_Y - b.setTop) * u)}L${fx(b.x1 - 4)} ${fx(b.setTop + (CREW_FEET_Y - b.setTop) * u)}`} stroke={SPOKE_INK} strokeOpacity={0.3} strokeWidth={1.4} />
      ))}
      {/* the fire door: an open mouth glowing with the fire, an iron frame */}
      <path d={`M${fx(d.x0)} ${fx(d.y0)}L${fx(d.x1)} ${fx(d.y0)}L${fx(d.x1)} ${fx(d.y1)}L${fx(d.x0)} ${fx(d.y1)}Z`} fill={glow} stroke={DARK} strokeWidth={5} />
      <path d={`M${fx(d.x0 + 8)} ${fx(d.y1 - 6)}Q${fx(d.x0 + 22)} ${fx(d.y1 - 26 - 30 * f)} ${fx(d.x0 + 34)} ${fx(d.y1 - 8)}Q${fx(d.x0 + 48)} ${fx(d.y1 - 34 - 34 * f)} ${fx(d.x0 + 62)} ${fx(d.y1 - 8)}Q${fx(d.x0 + 74)} ${fx(d.y1 - 22 - 26 * f)} ${fx(d.x1 - 8)} ${fx(d.y1 - 6)}Z`} fill={mixColor(ACCENT_DEEP, "#FFE3A0", f * 0.6)} opacity={0.4 + 0.6 * f} />
      <path d={`M${fx(d.x0 - 8)} ${fx(d.y0 - 8)}L${fx(d.x1 + 8)} ${fx(d.y0 - 8)}L${fx(d.x1 + 8)} ${fx(d.y0)}L${fx(d.x0 - 8)} ${fx(d.y0)}Z`} {...iron} />
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
    armL: { w: [-150, -330], elbow: [-0.2, 1], fist: 0.15, hand: -40 },
    brow: -0.2,
  };
  let eq = lerpFig(E_STAND, E_POINT, pt);
  eq = headTurn(eq, ENGINEER.dir * 0.66, -24 * Math.min(1, look));
  eq = idle(eq, g, 23, 0.6);
  return (
    <g>
      <Worker pose={sq} at={[STOKER.x, CREW_FEET_Y]} scale={SCALE} uid="m42stk" tool="shovel" />
      {/* the steam valve: a valve chest on the cylinder's side; its rod runs down to a pin on the hand lever, which the lever-man hauls down */}
      <path d={rect(VALVE_X, VALVE_TOP, 58, 96)} {...iron} />
      <path d={rect(VALVE_X, VALVE_TOP + 96, 30, 18)} {...iron} />
      <path d={`M${fx(rodPin[0])} ${fx(VALVE_TOP + 110)}L${fx(rodPin[0])} ${fx(rodPin[1])}`} stroke={DARK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${fx(rodPin[0])} ${fx(VALVE_TOP + 110)}L${fx(rodPin[0])} ${fx(rodPin[1])}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      {/* the bracket on the cylinder, the lever on its pin */}
      <path d={`M${fx(CYL_RIGHT - 4)} ${fx(LEVER_PIVOT[1] - 30)}L${fx(LEVER_PIVOT[0] + 10)} ${fx(LEVER_PIVOT[1] - 12)}L${fx(LEVER_PIVOT[0] + 10)} ${fx(LEVER_PIVOT[1] + 12)}L${fx(CYL_RIGHT - 4)} ${fx(LEVER_PIVOT[1] + 30)}Z`} {...iron} />
      <path d={leverD} fill={INK} stroke={DARK} strokeWidth={3.6} strokeLinejoin="round" paintOrder="stroke" />
      <path d={`M${lq2(12, 0)}L${lq2(head - 18, 0)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.6} />
      <circle cx={LEVER_PIVOT[0]} cy={LEVER_PIVOT[1]} r={10} fill={INK} stroke={DARK} strokeWidth={3} />
      <circle cx={LEVER_PIVOT[0]} cy={LEVER_PIVOT[1]} r={4} fill={DARK} />
      <circle cx={rodPin[0]} cy={rodPin[1]} r={6} fill={DARK} />
      <Worker pose={lq} at={[LEVERMAN.x, CREW_FEET_Y]} scale={SCALE} uid="m42lev" cap={false} />
      <Fellow pose={eq} at={[ENGINEER.x, CREW_FEET_Y]} scale={SCALE} uid="m42eng" variant={4} coat={ORANGE} />
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
    } else sl = labelSlide(frame, back);
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

/** ONE INK WEIGHT: the figures' and props' strokes are drawn in world units, so a close camera thickens them.
 *  Above the crew's framing zoom (INK_K0) every stroke attribute inside .m42ink is scaled by (INK_K0 / k)^0.75 so the
 *  outline and hatching keep about the crew's on-screen weight (typed CSS attr(), Chrome 133+; the sight-line opts out). */
const INK_K0 = 0.6;
const inkFactor = (k: number) => Math.min(1, Math.pow(INK_K0 / k, 0.75));
const INK_CSS = ".m42ink [stroke-width]:not(.m42raw){stroke-width:calc(attr(stroke-width type(<number>)) * var(--inkf))}";
/** the engine bed rests on its footing only near the 1781 point; its left part (over the 1710s dip) is a cantilevered deck */
const BED_FOOT_X0 = A1781[0] - 420;

const MachinesAndOutputCold: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const g = frame;
  const cam = camAtG(g);
  const mcam = engineCam(cam);
  // the rod ends at the beam: hide the machine layer above the rod's pin (its drawn rod runs on past it)
  const pinY = screenOf(rodPinAt(g), mcam)[1];
  const inkStyle = { ["--inkf" as string]: inkFactor(cam.k).toFixed(4) } as React.CSSProperties;
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <style>{INK_CSS}</style>
        <Footing x0={SLAB_X0} x1={SLAB_X1} under={SLAB_TOP + SLAB_T} />
        <Footing x0={BED_FOOT_X0} x1={BED_WX1} under={CREW_FEET_Y + BED_T * ENGINE_S} />
        <Slab x0={SLAB_X0} x1={SLAB_X1} top={SLAB_TOP} t={SLAB_T} joints={3} />
        <Slab x0={BED_WX0} x1={BED_WX1} top={CREW_FEET_Y} t={BED_T * ENGINE_S} joints={6} />
        {/* the line over the slabs and the footing: one stroke that turns orange at 1781 on the bed's face */}
        <ChartLine g={g} cam={cam} />
        <g className="m42ink" style={inkStyle}>
          <NewtonScene g={g} cam={cam} />
        </g>
      </WorldSvg>
      <div style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, clipPath: `inset(${Math.max(0, pinY).toFixed(2)}px 0px 0px 0px)` }}>
        <SunAndPlanetMachine frame={engineFrameAt(g)} cam={mcam} idPrefix="m42" />
      </div>
      <WorldSvg cam={cam}>
        <EngineParts g={g} />
        <BoilerAndCoal g={g} />
        <g className="m42ink" style={inkStyle}>
          <Crew g={g} />
        </g>
      </WorldSvg>
      <Year text="1687" {...LABELS.y1687} cam={cam} frame={g} f0={LABEL_F0.y1687} out={LABEL_1687_OUT} back={LABEL_1687_BACK} />
      <Year text="1781" {...LABELS.y1781} cam={cam} frame={g} f0={LABEL_F0.y1781} />
      <Year text="1900" {...LABELS.y1900} cam={cam} frame={g} f0={LABEL_F0.y1900} />
    </TexcocoPage>
  );
};

export default MachinesAndOutputCold;
