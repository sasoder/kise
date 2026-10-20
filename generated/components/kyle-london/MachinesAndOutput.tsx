// ---------------------------------------------------------------------------
// MachinesAndOutput V2 (kyle-london, cut 42), "people working". Dwarkesh map style
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
import { Fellow, Newton, ORANGE, POSES, Reflector, Table, Worker, castAnchors, headTurn, idle, lerpFig, scaleForPx, tableTop, type FigPose } from "./londonCast";
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
  ENGINE_START,
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
  P_START,
  SHOVEL_PERIOD,
  SHOVEL_THROW,
  SLAB_T,
  SLAB_TOP,
  SLAB_X0,
  SLAB_X1,
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
} from "./machinesAndOutputPlan";

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
    <path d={`M${fx(x0 + 10)} ${fx(top + t * 0.26)}L${fx(x1 - 10)} ${fx(top + t * 0.26)}`} stroke={SPOKE_INK} strokeOpacity={0.45} strokeWidth={1.4} />
    {Array.from({ length: joints }, (_, i) => {
      const x = x0 + ((x1 - x0) * (i + 0.5)) / joints;
      return <path key={i} d={`M${fx(x)} ${fx(top + t * 0.26)}L${fx(x)} ${fx(top + t)}`} stroke={SPOKE_INK} strokeOpacity={0.3} strokeWidth={1.4} />;
    })}
  </g>
);

// ---------------------------------------------------------------------------
// 1687: NEWTON AT HIS REFLECTOR. A small table on the slab, the reflector (dir -1: its open end and
// eyepiece up and to the left) at the table's left end, Newton left of the table facing right.
// ---------------------------------------------------------------------------
const TBL_W = 250; // units
const TABLE_AT: P2 = [SLAB_X1 - 20 - (TBL_W / 2 + 10) * scaleForPx(CREW_PX), SLAB_TOP];
const TT = tableTop(TABLE_AT, SCALE);
const REFL_AT: P2 = [TT[0] - (TBL_W / 2 - 52) * SCALE, TT[1] - 12 * SCALE];
/** the reflector's eyepiece (world): Reflector's tube (0,-70) rotated -14 deg, the eyepiece at (40, -20), mirrored */
const EYEPIECE: P2 = (() => {
  const a = (-14 * Math.PI) / 180;
  const lx = 40 * Math.cos(a) + 20 * Math.sin(a);
  const ly = 40 * Math.sin(a) - 20 * Math.cos(a) - 70;
  return [REFL_AT[0] - lx * SCALE, REFL_AT[1] + ly * SCALE];
})();
const PAGE: P2 = [TT[0] + 30 * SCALE, TT[1] - 3 * SCALE]; // the page on the table (its middle)
/** Newton's poses (facing right): bent to the eyepiece, upright writing on the page, looking up at the sky */
const N_BEND: FigPose = { ...POSES.eyepiece(1), lean: 30, crouch: 16, pitch: 26, headYaw: 1.0, armL: { w: [92, -196], elbow: [-0.2, 1], fist: 0.6, hand: -20 }, armR: { w: [128, -204], elbow: [-0.2, 1], fist: 0.6, hand: -10 } };
const N_WRITE: FigPose = { ...POSES.stand(1), lean: 14, crouch: 6, pitch: 22, headYaw: 0.9, armL: { w: [118, -176], elbow: [-0.4, 1], fist: 0.75, hand: 30 }, armR: { w: [96, -170], elbow: [-0.3, 1], fist: 0.2, hand: 10 }, brow: 0.4 };
const N_LOOK: FigPose = { ...POSES.stand(1), pitch: -22, headYaw: 0.75, armL: { w: [40, -150], elbow: [-0.4, 1], fist: 0.7, hand: 20 }, armR: { w: [70, -150], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, brow: -0.3, mouth: 0.2 };
/** where his feet go so his eye is at the eyepiece in N_BEND */
const NEWTON_AT: P2 = (() => {
  const a = castAnchors("newton", N_BEND, [0, 0], 1);
  const eye = [a.headC[0] + 15, a.headC[1] - 1];
  return [EYEPIECE[0] - eye[0] * SCALE - 6 * SCALE, EYEPIECE[1] - eye[1] * SCALE + 4 * SCALE];
})();
const NEWTON_KEYS: [number, FigPose, number][] = [
  // frame, pose, how far towards it (crossfades are eased; holds between)
  [0, N_BEND, 0],
  [36, N_BEND, 0],
  [52, N_WRITE, 0],
  [86, N_WRITE, 0],
  [100, N_LOOK, 0],
  [122, N_LOOK, 0],
  [138, N_BEND, 0],
];
const newtonPose = (g: number): FigPose => {
  // the cycle repeats after f138 every 200 frames (he is alive in the wide)
  const t = g <= 138 ? g : 138 + ((g - 138) % 200);
  let q = NEWTON_KEYS[NEWTON_KEYS.length - 1][1];
  if (t > 138 && t < 260) q = N_BEND;
  else if (t >= 260 && t < 276) q = lerpFig(N_BEND, N_LOOK, ease((t - 260) / 16));
  else if (t >= 276 && t < 300) q = N_LOOK;
  else if (t >= 300) q = lerpFig(N_LOOK, N_BEND, ease((t - 300) / 16));
  else {
    for (let i = 0; i < NEWTON_KEYS.length - 1; i++) {
      const [f0, a] = NEWTON_KEYS[i];
      const [f1, b] = NEWTON_KEYS[i + 1];
      if (t >= f0 && t <= f1) {
        q = lerpFig(a, b, ease((t - f0) / (f1 - f0)));
        break;
      }
    }
  }
  // the quill writes: a small scribble of the near hand while upright at the page
  if (t > 54 && t < 86) {
    const s = Math.sin((t - 54) * 0.9) * 4;
    q = { ...q, armL: { ...q.armL, w: [q.armL.w[0] + s, q.armL.w[1] + Math.cos((t - 54) * 1.3) * 2] } };
  }
  return idle(q, g, 3, 0.6);
};
const Sky: React.FC<{ g: number }> = ({ g }) => {
  const base: P2 = [SLAB_X0 + 230, SLAB_TOP - 330];
  const stars: [number, number, number][] = [
    [-170, -40, 9],
    [-60, -150, 6],
    [90, -110, 8],
    [210, -20, 5],
    [300, -170, 7],
    [-280, -130, 5],
  ];
  const moon: P2 = [base[0] + 300, base[1] - 40];
  return (
    <g>
      {stars.map(([x, y, r], i) => {
        const tw = 0.75 + 0.25 * Math.sin(g * 0.11 + i * 1.7);
        const c: P2 = [base[0] + x, base[1] + y];
        const R = r * tw;
        return (
          <path
            key={i}
            d={`M${fx(c[0] - R * 1.8)} ${fx(c[1])}L${fx(c[0] + R * 1.8)} ${fx(c[1])}M${fx(c[0])} ${fx(c[1] - R * 1.8)}L${fx(c[0])} ${fx(c[1] + R * 1.8)}`}
            stroke={INK}
            strokeOpacity={0.75}
            strokeWidth={R * 0.55}
            strokeLinecap="round"
          />
        );
      })}
      {/* the crescent */}
      <path
        d={`M${fx(moon[0])} ${fx(moon[1] - 40)}A40 40 0 1 0 ${fx(moon[0])} ${fx(moon[1] + 40)}A31 31 0 1 1 ${fx(moon[0])} ${fx(moon[1] - 40)}Z`}
        fill={INK}
        fillOpacity={0.85}
        stroke={DARK}
        strokeWidth={4}
        paintOrder="stroke"
      />
    </g>
  );
};
const NewtonScene: React.FC<{ g: number }> = ({ g }) => {
  const q = newtonPose(g);
  const a = castAnchors("newton", q, NEWTON_AT, SCALE);
  const writing = g > 50 && g < 92;
  const hand = a.handL;
  return (
    <g>
      <Sky g={g} />
      <Table at={TABLE_AT} scale={SCALE} uid="m42tbl" w={TBL_W} />
      <Reflector at={REFL_AT} scale={SCALE} uid="m42rfl" dir={-1} />
      {/* the page on the table and the inkwell */}
      <path d={`M${fx(PAGE[0] - 30 * SCALE)} ${fx(PAGE[1])}L${fx(PAGE[0] + 34 * SCALE)} ${fx(PAGE[1])}L${fx(PAGE[0] + 44 * SCALE)} ${fx(PAGE[1] - 12 * SCALE)}L${fx(PAGE[0] - 20 * SCALE)} ${fx(PAGE[1] - 12 * SCALE)}Z`} fill={INK} stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={`M${fx(PAGE[0] - 16 * SCALE)} ${fx(PAGE[1] - 4 * SCALE)}L${fx(PAGE[0] + 18 * SCALE)} ${fx(PAGE[1] - 4 * SCALE)}M${fx(PAGE[0] - 12 * SCALE)} ${fx(PAGE[1] - 8 * SCALE)}L${fx(PAGE[0] + 24 * SCALE)} ${fx(PAGE[1] - 8 * SCALE)}`} stroke={DARK} strokeOpacity={0.5} strokeWidth={1.4} />
      <path d={rect(PAGE[0] + 70 * SCALE, PAGE[1] - 16 * SCALE, 16 * SCALE, 16 * SCALE)} fill={STRUCT_FILL} stroke={DARK} strokeWidth={2} />
      <Newton pose={q} at={NEWTON_AT} scale={SCALE} uid="m42nwt" coat={ORANGE} />
      {/* the quill in his near hand while he writes; otherwise it stands in the inkwell */}
      {writing ? (
        <path d={`M${fx(hand[0])} ${fx(hand[1])}L${fx(hand[0] - 22 * SCALE)} ${fx(hand[1] - 44 * SCALE)}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      ) : (
        <path d={`M${fx(PAGE[0] + 70 * SCALE)} ${fx(PAGE[1] - 14 * SCALE)}L${fx(PAGE[0] + 58 * SCALE)} ${fx(PAGE[1] - 60 * SCALE)}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
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
      <path d={`M${fx(P[0] + 14)} ${fx(shaftTop + 10)}L${fx(P[0] + 20)} ${fx(baseY - 10)}`} stroke={SPOKE_INK} strokeOpacity={0.45} strokeWidth={1.4} />
      <path d={rect(P[0], top, COLUMN_W * 1.05, capH)} {...iron} />
      <path d={rect(P[0], baseY, COLUMN_W * 1.25, plinthH)} {...iron} />
      <path d={rect(cx, C[1], 26, boxY + 10 - C[1])} fill={INK} {...stroke} />
      <path d={bodyD} {...iron} />
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
      <path d={`M${fx(b.x0)} ${fx(b.setTop)}L${fx(b.x1)} ${fx(b.setTop)}L${fx(b.x1)} ${fx(CREW_FEET_Y)}L${fx(b.x0)} ${fx(CREW_FEET_Y)}Z`} {...iron} />
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
  // the engineer: stands watching the engine; when it starts he looks up at the beam, then back at the line
  const ret = ease((g - ENGINE_START) / 18);
  const back = ease((g - 250) / 24);
  let eq = POSES.stand(ENGINEER.dir);
  eq = headTurn(eq, ENGINEER.dir * (0.66 + 0.2 * ret) - ENGINEER.dir * 1.2 * back, -18 * ret * (1 - back) + 6 * back);
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
  y1687: { at: [P1687[0], SLAB_TOP + SLAB_T] as P2, dx: 6, dy: 52, anchor: "end" as const },
  y1781: { at: A1781, dx: 14, dy: 48, anchor: "start" as const },
  y1650: { at: P_START, dx: -8, dy: -30, anchor: "end" as const },
  y1900: { at: pointAtYear(LINE_END_YEAR), dx: -30, dy: 16, anchor: "end" as const },
};

const MachinesAndOutput: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const g = frame;
  const cam = camAtG(g);
  const mcam = engineCam(cam);
  // the rod ends at the beam: hide the machine layer above the rod's pin (its drawn rod runs on past it)
  const pinY = screenOf(rodPinAt(g), mcam)[1];
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <ChartLine g={g} cam={cam} />
        <Slab x0={SLAB_X0} x1={SLAB_X1} top={SLAB_TOP} t={SLAB_T} joints={3} />
        <Slab x0={BED_WX0} x1={BED_WX1} top={CREW_FEET_Y} t={(BED_T + 0) * ENGINE_S} joints={6} />
        <NewtonScene g={g} />
      </WorldSvg>
      <div style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, clipPath: `inset(${Math.max(0, pinY).toFixed(2)}px 0px 0px 0px)` }}>
        <SunAndPlanetMachine frame={engineFrameAt(g)} cam={mcam} idPrefix="m42" />
      </div>
      <WorldSvg cam={cam}>
        <EngineParts g={g} />
        <BoilerAndCoal g={g} />
        <Crew g={g} />
      </WorldSvg>
      <Year text="1687" {...LABELS.y1687} cam={cam} frame={g} f0={LABEL_F0.y1687} out={LABEL_1687_OUT} back={LABEL_1687_BACK} />
      <Year text="1781" {...LABELS.y1781} cam={cam} frame={g} f0={LABEL_F0.y1781} />
      <Year text="1650" {...LABELS.y1650} cam={cam} frame={g} f0={LABEL_F0.y1650} />
      <Year text="1900" {...LABELS.y1900} cam={cam} frame={g} f0={LABEL_F0.y1900} />
    </TexcocoPage>
  );
};

export default MachinesAndOutput;
