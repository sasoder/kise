// ---------------------------------------------------------------------------
// MachinesAndOutputEngine (kyle-london, cut 42 V1, kept buildable: the approved engine version, final delivered as 42_MachinesAndOutput.mov V1; V2 people version is MachinesAndOutput.tsx). Dwarkesh map style (styles/dwarkesh-map.md).
// Opaque 1080x1920, 29.97 fps, 336 frames. The umber page with no map (kits/maps TexcocoPage).
// Opens on cut 10's last frame (HowTheUniverseWorks f203) pixel for pixel and continues its world
// (./orbitWorld.tsx, read only); the chart's geometry, timeline and camera are in
// ./machinesAndOutputPlan.ts, the data in ./englandGdpData.ts.
//
// CHECK LINE: "Newton's discoveries (1687) and Watt's machines (1781) came before England's output per person
// climbed steeply."
//
// THE LINE: "you've got people who are making the most fundamental discoveries about the nature of the
// universe and inventing machines that will improve productivity and ultimately economic output."
// WORD -> FRAME: you've 13 · got 36 · people 39 · who 46 · are 51 · making 54 · the 76 · most 90 ·
// fundamental 94 · discoveries 104 · about 117 · the 127 · nature 132 · of 139 · the 150 · universe 165 ·
// and 177 · inventing 192 · machines 217 · that 226 · will 238 · improve 242 · productivity 257 · and 272 ·
// ultimately 286 · economic 295 · output 313 · (cut back to the speaker at 336)
// DURATION: the slot 42.109 -> 53.320 s (in frame 1262 -> out frame 1598) = 11.211 s x 29.97 = 336 frames.
//
// THE MOTION: one continuous camera story on cut 10's machine. f0 = cut 10's f203 (the same camera, its
// creep carried by a blend that starts flat, the house sway continued); the machine keeps turning
// (world frame 203 + g). One log-space pull-back (f0-165, a single deceleration lobe) lifts and drifts
// left down the machine to its cast bearing pedestal (orbitWorld); the pedestal's foot and the beam's
// tall cast column stand on ONE engine bed, a flat dark-umber slab whose underside sits on England's
// output line at 1781: Watt's beam-engine silhouette (cylinder on the bed under the beam's far end, its
// piston rod sliding in and out in step, the beam rocking on the column in its middle, the flywheel's
// connecting rod on its near end). The cream past runs in from the left (its end enters off frame ~f62, drawn from
// 1700, and slows in under the bed by f88), and the pull-back reveals it back to the 1650s, with cut
// 10's orbit (orange, e 0.55 so it reads elliptical when small, ~160 px wide at the end) circling on it at 1687 (legible by "universe" f165). The rod hangs from
// the beam. Years slide up as each settles: 1781 (f84, under the bed right of the 1781 point), 1687 (f132,
// under the orbit), 1650 (f146, at the line's left end, the 1650s mean). A slight push in toward the
// machine (f165-216, every label stays in frame); on "inventing" an orange nib leaves the engine (f196)
// and draws the line on through the decade means, out from behind the pedestal by "machines", climbing
// faster as it goes; the camera pulls back with the climb (f216-312) so the tip stays in frame and the
// whole line is in view as it reaches 1900 (f309, "1900" slides up f296). Settled f312-335: cream past,
// the engine standing at 1781, the orange climb to 1900; the orbit circles, the machine turns, the
// camera creeps in. Nothing fades.
// Orange = the new (the orbit at 1687, the machine's gears, the line after 1781); the line before 1781
// is cream; the flywheel and rod stay as in cut 10. No y-axis, gridlines, units or figures.
//
// SOURCES: England's real GDP per head 1650-1900, annual, GBP at 2013 prices: Bank of England, "A
// millennium of macroeconomic data for the UK" v3.1, sheet A21, England (full citation in
// englandGdpData.ts), plotted linear from 0 as DECADE MEANS of the BoE annual series (the annual values
// carry harvest noise): the mean of 1650-59 ... 1890-99 at mid-decade, plus the 1900 annual value as
// the end point, straight segments, no smoothing. The 1781 point (where the engine bed sits) lies on
// the straight segment between the 1770s and 1780s means (interpolated: it adds no value or bend).
// Newton's Principia 1687; Watt's sun-and-planet rotative engine patent 1781. The beam end, its column and the engine bed
// are illustrative (Watt's rotative engines hung the connecting rod from a rocking beam).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { FRAME_H, FRAME_W, labelSlide, mixColor, screenOf } from "../kits/maps/incaShared";
import { DURATION as CUT10_DURATION } from "./HowTheUniverseWorks";
import { ACCENT, ACCENT_DEEP, DARK, INK, LAND, MACHINE_END_CAM as WORLD_END_CAM, SPOKE_INK, SunAndPlanetMachine, cutCamAt, type Cam, type P2 } from "./orbitWorld";
import {
  A1781,
  BEAM_PIVOT,
  CYL_HW,
  CYL_TOP,
  CYL_X,
  pistonPinAt,
  GLYPH_A,
  GLYPH_E,
  GLYPH_SUN,
  GLYPH_W,
  LABEL_F0,
  MACHINE_YEAR,
  ORANGE_RUN,
  BED_T,
  BED_TOP,
  BED_X0,
  BED_X1,
  COLUMN_W,
  LINE_END_YEAR,
  LINE_START_YEAR,
  P_START,
  WORLD_OFFSET,
  camAtG,
  creamEndYear,
  glyphPlanetAt,
  orangeTipYear,
  pointAtYear,
  polyline,
  rodPinAt,
} from "./machinesAndOutputEnginePlan";

export const FPS = 30000 / 1001;
export const DURATION = 336;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the join: this cut's f0 is cut 10's last frame, under cut 10's camera exactly
if (WORLD_OFFSET !== CUT10_DURATION - 1) throw new Error("cut 42 opens on cut 10's last frame");
{
  const c0 = camAtG(0);
  const ref = cutCamAt(WORLD_OFFSET);
  if (c0.k !== ref.k || c0.cx !== ref.cx || c0.cy !== ref.cy || ref.k !== WORLD_END_CAM.k) throw new Error("cut 42's f0 camera must equal cut 10's f203");
}

const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400"], subsets: ["latin"] });

const fx = (v: number) => v.toFixed(3);
const dOf = (pts: P2[]) => (pts.length > 1 ? `M${pts.map(([x, y]) => `${fx(x)},${fx(y)}`).join("L")}` : "");

// line weights in screen px (a drawn chart line keeps its weight through the zoom)
const CREAM_W = 10;
const ORANGE_W = 12;
const CASE_W = 3;
const NIB_R = 9;
const CREAM_LINE = INK;

// ---------------------------------------------------------------------------
// THE CHART LINE (behind the machine): the cream past, the orange new, the nib
// ---------------------------------------------------------------------------
const ChartLine: React.FC<{ g: number; cam: Cam }> = ({ g, cam }) => {
  const k = cam.k;
  const cream = polyline(LINE_START_YEAR, creamEndYear(g));
  const tip = orangeTipYear(g);
  const orange = tip > MACHINE_YEAR + 1e-4 ? polyline(MACHINE_YEAR, tip) : [];
  const nibAt = pointAtYear(tip);
  const showNib = g >= ORANGE_RUN[0] && tip > MACHINE_YEAR + 1e-4;
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      {cream.length > 1 ? (
        <>
          <path d={dOf(cream)} stroke={DARK} strokeOpacity={0.85} strokeWidth={(CREAM_W + 2 * CASE_W) / k} />
          <path d={dOf(cream)} stroke={CREAM_LINE} strokeWidth={CREAM_W / k} />
        </>
      ) : null}
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
          <circle cx={nibAt[0] - (2.6 / k)} cy={nibAt[1] - (2.6 / k)} r={3 / k} fill={mixColor(ACCENT, INK, 0.6)} />
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ENGINE BED (world px): one flat slab, the pedestal's material (dark umber planes in the
// context cream line); its underside sits on the line at 1781, its top carries the pedestal's foot
// and the beam's column. Drawn over the chart line (the line runs in under its left end and the
// orange leaves from behind the engine on the right).
// ---------------------------------------------------------------------------
const STRUCT_FILL = "#2B231A"; // = orbitWorld's pedestal plane (PED_FILL, not exported)
const EngineBed: React.FC = () => {
  const y0 = BED_TOP;
  const y1 = BED_TOP + BED_T;
  const line = { fill: STRUCT_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };
  return (
    <g>
      <path d={`M${fx(BED_X0)} ${fx(y0)}L${fx(BED_X1)} ${fx(y0)}L${fx(BED_X1)} ${fx(y1)}L${fx(BED_X0)} ${fx(y1)}Z`} {...line} />
      <path d={`M${fx(BED_X0 + 14)} ${fx(y0 + 26)}L${fx(BED_X1 - 14)} ${fx(y0 + 26)}`} stroke={SPOKE_INK} strokeOpacity={0.45} strokeWidth={1.4} />
      {[0.18, 0.41, 0.64, 0.87].map((u) => (
        <path key={u} d={`M${fx(BED_X0 + (BED_X1 - BED_X0) * u)} ${fx(y0 + 26)}L${fx(BED_X0 + (BED_X1 - BED_X0) * u)} ${fx(y1)}`} stroke={SPOKE_INK} strokeOpacity={0.3} strokeWidth={1.4} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ORBIT GLYPH at 1687 (world px): cut 10's engraved Sun with its rays, the
// orange Kepler ellipse, the planet and the cream radius sweeping with it
// ---------------------------------------------------------------------------
const GLYPH_PTS: P2[] = (() => {
  const pts: P2[] = [];
  for (let i = 0; i <= 180; i++) {
    const th = (i / 180) * 2 * Math.PI;
    const r = (GLYPH_A * (1 - GLYPH_E * GLYPH_E)) / (1 + GLYPH_E * Math.cos(th));
    pts.push([GLYPH_SUN[0] + r * Math.cos(th + GLYPH_W), GLYPH_SUN[1] + r * Math.sin(th + GLYPH_W)]);
  }
  return pts;
})();
export const GLYPH_BOTTOM = Math.max(...GLYPH_PTS.map((p) => p[1])) - GLYPH_SUN[1];
const SUN_RAYS = 18;
const OrbitGlyph: React.FC<{ g: number }> = ({ g }) => {
  const p = glyphPlanetAt(g);
  const s = GLYPH_SUN;
  const d = `${dOf(GLYPH_PTS)}Z`;
  const rays = Array.from({ length: SUN_RAYS }, (_, i) => {
    const a = (i / SUN_RAYS) * 2 * Math.PI + g * 0.004;
    return `M${fx(s[0] + 74 * Math.cos(a))} ${fx(s[1] + 74 * Math.sin(a))}L${fx(s[0] + 136 * Math.cos(a))} ${fx(s[1] + 136 * Math.sin(a))}`;
  }).join("");
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d={d} fill={LAND} fillOpacity={0.62} stroke={DARK} strokeOpacity={0.85} strokeWidth={48} />
      <path d={d} fill="none" stroke={ACCENT} strokeWidth={32} />
      <path d={`M${fx(s[0])} ${fx(s[1])}L${fx(p[0])} ${fx(p[1])}`} stroke={INK} strokeOpacity={0.75} strokeWidth={10} />
      <path d={rays} stroke={DARK} strokeWidth={24} strokeOpacity={0.8} />
      <path d={rays} stroke={INK} strokeWidth={13} />
      <circle cx={s[0]} cy={s[1]} r={66} fill={INK} stroke={DARK} strokeWidth={10} paintOrder="stroke" />
      <circle cx={s[0]} cy={s[1]} r={36} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={6} />
      <circle cx={p[0]} cy={p[1]} r={58} fill={ACCENT} stroke={DARK} strokeWidth={12} paintOrder="stroke" />
      <path d={`M${fx(p[0] + 6)} ${fx(p[1] + 48)}A48 48 0 0 0 ${fx(p[0] + 48)} ${fx(p[1] + 6)}`} fill="none" stroke={ACCENT_DEEP} strokeWidth={12} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BEAM (world px, cut 10's cream at the rod's weight): the rod's top hangs from
// the end of a rocking beam that pivots on a tall cast column (left of the flywheel) standing on the engine bed
// ---------------------------------------------------------------------------
const Beam: React.FC<{ g: number }> = ({ g }) => {
  const E = rodPinAt(g); // the connecting rod's pin (flywheel end)
  const C = pistonPinAt(g); // the piston rod's pin (cylinder end)
  const P = BEAM_PIVOT;
  const L = Math.hypot(E[0] - P[0], E[1] - P[1]);
  const ux = (E[0] - P[0]) / L;
  const uy = (E[1] - P[1]) / L;
  // a point t along the beam from the pivot (+ towards the flywheel), w across it
  const q = (t: number, w: number): string => `${fx(P[0] + ux * t - uy * w)} ${fx(P[1] + uy * t + ux * w)}`;
  const hwP = 40;
  const hwE = 22;
  const end = L + 34;
  const beamD = `M${q(-end, -hwE)}L${q(0, -hwP)}L${q(end, -hwE)}A${hwE} ${hwE} 0 0 1 ${q(end, hwE)}L${q(0, hwP)}L${q(-end, hwE)}A${hwE} ${hwE} 0 0 1 ${q(-end, -hwE)}Z`;
  const rect = (cx: number, y0: number, w: number, h: number) => `M${fx(cx - w / 2)} ${fx(y0)}L${fx(cx + w / 2)} ${fx(y0)}L${fx(cx + w / 2)} ${fx(y0 + h)}L${fx(cx - w / 2)} ${fx(y0 + h)}Z`;
  const iron = { fill: STRUCT_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };
  const stroke = { stroke: DARK, strokeWidth: 3.4, strokeLinejoin: "round" as const, paintOrder: "stroke" as const };
  // the column under the pivot: capital, tall tapered shaft, plinth on the bed
  const top = P[1] + 30;
  const capH = 44;
  const shaftTop = top + capH;
  const plinthH = 50;
  const baseY = BED_TOP - plinthH;
  const shaftD = `M${fx(P[0] - COLUMN_W * 0.3)} ${fx(shaftTop)}L${fx(P[0] + COLUMN_W * 0.3)} ${fx(shaftTop)}L${fx(P[0] + COLUMN_W * 0.42)} ${fx(baseY)}L${fx(P[0] - COLUMN_W * 0.42)} ${fx(baseY)}Z`;
  // the cylinder: a tall cast body with rounded shoulders, a top cover, a stuffing box, a base flange, girth bands
  const cx = CYL_X;
  const coverY = CYL_TOP - 56;
  const r = 44;
  const bodyD = `M${fx(cx - CYL_HW)} ${fx(BED_TOP - 40)}L${fx(cx - CYL_HW)} ${fx(CYL_TOP + r)}Q${fx(cx - CYL_HW)} ${fx(CYL_TOP)} ${fx(cx - CYL_HW + r)} ${fx(CYL_TOP)}L${fx(cx + CYL_HW - r)} ${fx(CYL_TOP)}Q${fx(cx + CYL_HW)} ${fx(CYL_TOP)} ${fx(cx + CYL_HW)} ${fx(CYL_TOP + r)}L${fx(cx + CYL_HW)} ${fx(BED_TOP - 40)}Z`;
  const coverD = `M${fx(cx - CYL_HW - 26)} ${fx(CYL_TOP + 8)}L${fx(cx - CYL_HW + 10)} ${fx(coverY)}L${fx(cx + CYL_HW - 10)} ${fx(coverY)}L${fx(cx + CYL_HW + 26)} ${fx(CYL_TOP + 8)}Z`;
  const boxY = coverY - 70;
  const pistonTop = C[1];
  return (
    <g>
      {/* the column */}
      <path d={shaftD} {...iron} />
      <path d={`M${fx(P[0] + 14)} ${fx(shaftTop + 10)}L${fx(P[0] + 20)} ${fx(baseY - 10)}`} stroke={SPOKE_INK} strokeOpacity={0.45} strokeWidth={1.4} />
      <path d={rect(P[0], top, COLUMN_W * 1.05, capH)} {...iron} />
      <path d={rect(P[0], baseY, COLUMN_W * 1.25, plinthH)} {...iron} />
      {/* the piston rod (cream, the connecting rod's weight), sliding in the stuffing box */}
      <path d={rect(cx, pistonTop, 26, boxY + 10 - pistonTop)} fill={INK} {...stroke} />
      <path d={`M${fx(cx + 5)} ${fx(pistonTop + 30)}L${fx(cx + 5)} ${fx(boxY)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.4} />
      {/* the cylinder */}
      <path d={bodyD} {...iron} />
      {[0.22, 0.5, 0.78].map((u) => {
        const y = CYL_TOP + (BED_TOP - 40 - CYL_TOP) * u;
        return <path key={u} d={rect(cx, y - 14, CYL_HW * 2 + 16, 28)} {...iron} />;
      })}
      <path d={`M${fx(cx - CYL_HW + 36)} ${fx(CYL_TOP + 60)}L${fx(cx - CYL_HW + 36)} ${fx(BED_TOP - 60)}`} stroke={SPOKE_INK} strokeOpacity={0.35} strokeWidth={1.6} />
      <path d={rect(cx, BED_TOP - 44, CYL_HW * 2 + 60, 44)} {...iron} />
      <path d={coverD} {...iron} />
      <path d={rect(cx, boxY, 84, coverY - boxY + 2)} {...iron} />
      <path d={rect(cx, boxY - 14, 110, 18)} {...iron} />
      {/* the beam: fish-bellied, pivoting in its middle, a groove down its web */}
      <path d={beamD} fill={INK} {...stroke} />
      <path d={`M${q(-L + 30, 0)}L${q(L - 30, 0)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.6} />
      <path d={`M${q(-L + 40, 8)}L${q(L - 40, 7)}`} stroke={DARK} strokeOpacity={0.3} strokeWidth={1.4} />
      {/* the pins: piston rod, pivot boss, connecting rod */}
      {[C, E].map((pp, i) => (
        <g key={i}>
          <circle cx={pp[0]} cy={pp[1]} r={28} fill={INK} {...stroke} />
          <circle cx={pp[0]} cy={pp[1]} r={13} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={1.4} />
          <circle cx={pp[0]} cy={pp[1]} r={8} fill={DARK} />
        </g>
      ))}
      <circle cx={P[0]} cy={P[1]} r={44} fill={INK} {...stroke} />
      <circle cx={P[0]} cy={P[1]} r={26} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={1.6} />
      <circle cx={P[0]} cy={P[1]} r={11} fill={DARK} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// A YEAR: Libre Caslon Text lining figures, screen-sized at a world point, slides up as it fades in
// ---------------------------------------------------------------------------
const YEAR_SIZE = 46;
const Year: React.FC<{ text: string; at: P2; cam: Cam; frame: number; f0: number; dx?: number; dy?: number; anchor?: "start" | "middle" | "end" }> = ({
  text,
  at,
  cam,
  frame,
  f0,
  dx = 0,
  dy = 0,
  anchor = "middle",
}) => {
  const sl = labelSlide(frame, f0);
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

const MachinesAndOutputEngine: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const g = frame;
  const W = WORLD_OFFSET + g; // the machine's world frame: it keeps turning
  const cam = camAtG(g);
  // the rod ends at the beam: hide the machine layer above the rod's pin (its drawn rod runs on past it)
  const pinY = screenOf(rodPinAt(g), cam)[1];
  const clip = pinY > 0 ? { clipPath: `inset(${pinY.toFixed(2)}px 0px 0px 0px)` } : undefined;
  const yearAtMachine = A1781; // under the bed, just right of the 1781 point (the line comes up from the lower left)
  const glyphBottom: P2 = [GLYPH_SUN[0], GLYPH_SUN[1] + GLYPH_BOTTOM];
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <ChartLine g={g} cam={cam} />
        <EngineBed />
        <OrbitGlyph g={g} />
      </WorldSvg>
      <div style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, ...clip }}>
        <SunAndPlanetMachine frame={W} cam={cam} idPrefix="m42" />
      </div>
      <WorldSvg cam={cam}>
        <Beam g={g} />
      </WorldSvg>
      <Year text="1781" at={yearAtMachine} cam={cam} frame={g} f0={LABEL_F0.y1781} dx={14} dy={54} anchor="start" />
      <Year text="1687" at={glyphBottom} cam={cam} frame={g} f0={LABEL_F0.y1687} dy={50} />
      <Year text="1650" at={P_START} cam={cam} frame={g} f0={LABEL_F0.y1650} dx={-8} dy={-30} anchor="end" />
      <Year text="1900" at={pointAtYear(LINE_END_YEAR)} cam={cam} frame={g} f0={LABEL_F0.y1900} dx={-30} dy={16} anchor="end" />
    </TexcocoPage>
  );
};

export default MachinesAndOutputEngine;
