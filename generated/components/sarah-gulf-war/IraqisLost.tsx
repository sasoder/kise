// ---------------------------------------------------------------------------
// IraqisLost (sarah-gulf-war, cut 90). Dwarkesh 3D style (styles/dwarkesh-3d.md) as a FLAT 2D chart in the air, in the
// clip's death-toll chart family (gulfChart.tsx, shared with cuts 6 and 107). Opaque 1080x1920, 24 fps, 254 frames.
//
// CHECK LINE: "Iraq lost somewhere between 20,000 and 35,000 soldiers and about 3,000 civilians to the bombing; the
// coalition lost fewer than 400, a sliver beside them."
//
// THE LINE: "The Iraqis lost between 20,000 and 35,000 military deaths and up to 3,000 civilians from the bombing. Okay,
// coalition forces, 392 total deaths." (the speaker's 392 does not match the sources, 292-379, so "<400" goes on screen;
// then cut 107 opens on this cut's last frame)
// WORD -> FRAME (Whisper, ~5-9 f early): Iraqis 1 · lost 14 · between 20 · 20,000 33 · and 54 · 35,000 56 · military 75 ·
// deaths 80 · and 93 · up 100 · to 105 · 3,000 110 · civilians 124 · from 137 · the 145 · bombing 149 · Okay 163 ·
// coalition 170 · forces 179 · 392 198 · total 218 · deaths 232 (slot ends 254). The user's shutter SFX is at f163.
// DURATION: the slot 90.5 -> 101.083333 s (00:01:30:12 - 00:01:41:02) = 10.583333 s x 24 = 254 frames (f0..f253).
//
// THE MOTION, f0-162 (the approved picture, unchanged): the title slides up f-3..8; one wide umber "Iraqi military" bar
// rises from its foot f1-38, its number riding its top and counting (in hundreds) to 20,000 (lands f38, "20,000"
// ~f39-42); from f40 it keeps rising as the uncertain range (pale, hatched, its dashed sides laid down from the solid top
// by the rising tip) to 35,000 by f61 ("35,000" ~f61-65) while the number opens into "20,000–35,000" (the 20,000 slides
// left as "–35,000" slides up beside it, counting on with the tip). Over "up to 3,000 civilians" a narrower creamLo bar's
// foot draws out f92-100, "Civilians" slides up f95-105 and the bar rises f98-116 to ~3,000 ("3,000" ~f115-119). The camera
// is one slow continuous drift-in (k 0.9 -> 1 about the group's foot) that keeps the two Iraqi bars and their labels one
// centred group with equal margins, decelerating into a creep that never stops.
// THE MOTION, f163-253 (the coalition reveal, moved here from cut 107 and re-timed to the words): the camera trucks right
// to bring the third slot in (the group's right edge lands by f202). Over "coalition forces" (real ~f176-186) the slot's
// foot draws out f168-177 and "Coalition" slides up f175-185; at the SAME px-per-death the ACCENT sliver rises from its
// foot f189-205 to its 8 px with its glow, and "<400" lands f205 ("392" real ~f204-207). Over "total deaths" one gentle
// push-in and drop (k 1 -> 1.09, its lobe peaks ~f227, ~90 % by ~f242) settles the three-bar group with even margins, side
// by side on one baseline: huge, smaller, barely there. To f253 it is settled and alive (the creep, sway, motes).
// Colour: the Iraqi dead are DEAD umber (soldiers) and creamLo (civilians); orange is the coalition's dead (the family's
// rule).
//
// CAMERA, f163-253: three channels, each one beta-shaped velocity lobe integrated and normalised to land at f253, in
// t = f - 162: R, the screen x of the group's right ink (world 1004): 1146 -> 1047 (lobe x^1 (1-x)^1.8 on t 0-40, then it
// holds); ln k: s0 * t + a lobe x^2.2 (1-x)^2.8 on t 34-104 (k 1 -> 1.09); yb, the baseline's screen y before CHART_DROP:
// 996 -> 982 with the zoom's progress. cx = 1004 - (R - 540) / k, cy = BASE - (yb - 960) / k. At t 0 every value AND slope
// equals the drift-in's last frame (it zooms about (GROUP_CX, BASE) at (540, 996) with (ln k)' = s0; R's join speed
// fades out over 16 f), so f162/163 has no velocity step; sway, motes, shafts and grain run on the same frame number.
//
// REV 3 (user's note, "move it down slightly"): the whole chart sits CHART_DROP (gulfChart) screen px lower on every
// frame via chartCamOf; the air, motes and grain stay on camAt. The user allows the name labels in the old caption band
// y 1080-1250. The screen ys in the next paragraph are the numbers BEFORE this drop.
//
// FRAMING (f0-162): linear and honest, ONE px-per-death for every bar: 35,000 = 700 px (PX_PER 0.02; 3,000 = 60 px; 400 = 8 px).
// Type at gulfChart rev 2's phone sizes on the settled frame (k 1: title 58, names 48, numbers 62 screen px). The
// baseline sits at screen y 996 (the zoom is anchored on it), so the one-line name row under it ends by y ~1070 with
// the sway; the range top is at y 296 and the title above it, so the chart fills y ~120-1070, the whole height above the
// first caption band (names under the bars cannot go lower without entering y 1080-1250). Nothing readable in y
// 1080-1250 or 1360-1460 on any frame; the lower frame sinks into the dense espresso air (styles/dwarkesh-3d.md).
//
// FRAMING (f253): the three-bar group's ink runs world x 74 .. ~976 at k 1.09 with even margins, as cut 107's settled frame.
//
// SOURCES (COMMON.md, gulfChart FIG): coalition deaths 292-379 by source -> on screen "<400", drawn at FIG.coalitionUnder =
// 400 x PX_PER = 8 px. Iraqi military deaths 20,000-35,000 (Wikipedia, "Gulf War", casualty estimates;
// Project on Defense Alternatives 20,000-26,000); Iraqi civilians killed by the bombing about 3,000 (Iraqi government
// 2,300; PDA 3,664) -> shown "~3,000".
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldSvg, c01, mixHex, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Bar, CHART_DROP, COL, CategoryLabel, ChartDefs, ChartStage, ChartText, ChartTitle, FIG, FONT, Foot, NumberLabel, Plate, chartAirOf, creep, enter, fmt, grow, typeAt } from "./gulfChart";

export const FPS = 24;
export const DURATION = 254;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const UID = "il";

// ---- layout (exported for cut 107, which opens on this cut's last frame) ------------------------------------------
/** px per death, the same for every bar (35,000 -> 700 px) */
export const PX_PER = 700 / FIG.iraqiMil.hi;
/** bar widths: the wide military bar, the narrower civilians bar, the reserved coalition slot */
export const BAR_W = { mil: 240, civ: 140, coal: 140 };
/** bar centres (world x; on f162 screen x = world x + 142): Iraqi military, the civilians, and the third slot, where the
 *  coalition's sliver rises from f189. Spaced by their labels at phone size: "20,000–35,000" (452 px at 62) starts
 *  at world 74, "Iraqi military" (293 at 48) ends at 447, "Civilians" (191) spans 530-721, the slot's label room
 *  starts ~760 */
export const SLOTS = { mil: 300, civ: 625, coal: 875 };
/** the baseline's world y (= its screen y: the zoom is anchored on it; the name row ends above y 1076 with the sway) */
export const BASE = 996;
/** the settled zoom and the type at it (gulfChart rev 2: TYPE_PHONE screen px at the settled frame) */
export const K_END = 1;
export const TY = typeAt(K_END);
/** name baseline under the base, number baseline above a bar top (cut 6 rev 2's 40 / 16 scaled to these sizes) */
export const NAME_DY = 54;
export const NUM_GAP = 22;
/** the two Iraqi bars and their labels as one group: ink x 73 ("20,000–35,000") .. 722 ("~3,000" / "Civilians") */
export const GROUP_CX = 398;
const TITLE = { x: GROUP_CX, y: BASE - 700 - NUM_GAP - TY.num * 0.8 - 66 };

// ---- camera -------------------------------------------------------------------------------------------------------
const K0 = 0.9;
const K1 = K_END;
/** the drift-in's last frame: its span is fixed here, NOT derived from DURATION, so f0-162 never changes */
export const F_DRIFT = 162;
/** f0-162: one slow continuous drift-in: the zoom on gulfChart's creep (end slope 0.3, never a dead stop) about the group's
 *  foot (GROUP_CX, BASE), which holds at screen (540, 996): the two Iraqi bars stay one centred group with equal margins */
const driftCam = (f: number): Cam => {
  const t = f / F_DRIFT;
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * creep(t, 0.3));
  return { k, cx: GROUP_CX, cy: BASE - (BASE - 960) / k };
};
/** the drift-in's ln-k slope on f162: the reveal's zoom starts at the same speed */
const S0 = (Math.log(driftCam(F_DRIFT).k) - Math.log(driftCam(F_DRIFT - 0.001).k)) / 0.001;
/** the reveal's last t (t = f - F_DRIFT) */
const T_END = DURATION - 1 - F_DRIFT;
/** a velocity lobe x^a (1-x)^b on [t0, t1], integrated (midpoint rule) and normalised to 1 at T_END */
const lobe = (t0: number, t1: number, a: number, b: number) => {
  const raw = (t: number) => {
    const hi = Math.min(t, t1);
    if (hi <= t0) return 0;
    const n = 1200;
    const h = (hi - t0) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) * h) / (t1 - t0);
      sum += Math.pow(x, a) * Math.pow(1 - x, b) * h;
    }
    return sum;
  };
  const norm = raw(T_END);
  return (t: number) => raw(t) / norm;
};
/** the camera's framing span: world x 74 (the left end of "20,000–35,000") to 1004 (kept from cut 107's first framing;
 *  the rightmost ink is now "Coalition", ~976) */
const INK_L = 74;
const INK_R = 1004;
export const K_FIN = 1.09;
/** even margins at K_FIN: the span's right end lands here on screen */
const R_END = 1080 - (1080 - (INK_R - INK_L) * K_FIN) / 2;
const YB_END = 982;
const R0 = 540 + (INK_R - GROUP_CX) * K_END;
const VR0 = (INK_R - GROUP_CX) * K_END * S0;
const JOIN_T = 16;
const joinDrift = (t: number) => ((VR0 * JOIN_T) / 3) * (1 - Math.pow(1 - Math.min(t, JOIN_T) / JOIN_T, 3));
const PR = lobe(0, 40, 1, 1.8); // the truck: peaks ~f176, lands by f202 and then holds
const PK = lobe(34, 104, 2.2, 2.8); // the push: starts f196, peaks ~f227, still creeping at f253
/** the camera: the drift-in to f162, then the reveal. While the zoom grows the right side holds and the push opens to the
 *  left. Cut 107 continues from camAt(LAST_FRAME). */
export const camAt = (f: number): Cam => {
  if (f <= F_DRIFT) return driftCam(f);
  const t = f - F_DRIFT;
  const pk = PK(t);
  const k = Math.exp(S0 * t + (Math.log(K_FIN) - S0 * T_END) * pk) * K_END;
  const yb = BASE + (YB_END - BASE) * pk;
  const R = R0 + joinDrift(t) + (R_END - R0 - joinDrift(T_END)) * PR(t);
  return { k, cx: INK_R - (R - 540) / k, cy: BASE - (yb - 960) / k };
};
/** this cut's last frame. Cut 107 opens on it: its f0 = camAt(LAST_FRAME), its sway and air run on frame f + LAST_FRAME
 *  (AIR_FRAME_OFFSET) against REST, and its chart is <IraqisChart frame={LAST_FRAME} /> under chartCamOf. */
export const LAST_FRAME = DURATION - 1;
export const AIR_FRAME_OFFSET = LAST_FRAME;
export const REST = swayCam(camAt(0), 0);
/** the camera the CHART is drawn with: the air's camera with the chart CHART_DROP screen px lower at any zoom. BASE, TY,
 *  SLOTS and camAt keep their first-delivery values: camAt still drives the air, this offsets only the drawing. */
export const chartCamOf = (cam: Cam): Cam => ({ ...cam, cy: cam.cy - CHART_DROP / cam.k });

// ---- timing -------------------------------------------------------------------------------------------------------
const T = {
  title: [-3, 11],
  milLabel: [-1, 10],
  milSolid: [1, 37], // lands f38 ("20,000" ~f39-42)
  milRange: [40, 21], // lands f61 ("35,000" ~f61-65)
  civFoot: [92, 8],
  civLabel: [95, 10],
  civBar: [98, 18], // lands f116 ("3,000" ~f115-119)
  coalFoot: [168, 9], // "coalition" real ~f176
  coalName: [175, 10], // lands f185 ("forces" real ~f185)
  coalBar: [189, 16], // lands f205 ("392" real ~f204-207)
  coalNum: [195, 10], // lands f205
} as const;

/** an estimate counts in hundreds (an exact-looking 23,417 would claim a precision the sources do not have) */
const count100 = (v: number) => fmt(Math.round(v / 100) * 100);

// Caslon lining figures, advance widths per font px (measured: "20,000" 3.30, "20,000–35,000" 7.31)
const ADV_A = 3.3;
const ADV_FULL = 7.31;

// ---- pieces -------------------------------------------------------------------------------------------------------
/** gulfChart's Foot (rev 2: w + 12 wide, 2.4 high, creamLo 0.42), drawn out from its centre by two tips */
export const DrawnFoot: React.FC<{ x: number; w: number; p: number }> = ({ x, w, p }) => {
  if (p <= 0) return null;
  const half = (w / 2 + 6) * p;
  return <rect x={x - half} y={BASE} width={2 * half} height={2.4} fill={COL.creamLo} opacity={0.42} />;
};

/** the uncertain range above the solid top: a pale fill, the hatch (fixed in world space, revealed as the top rises)
 *  and a dashed outline whose side dashes start at the solid top, so they are laid down by the rising tip */
const RangeBlock: React.FC<{ x: number; w: number; y0: number; r: number }> = ({ x, w, y0, r }) => {
  if (r <= 0.05) return null;
  const x0 = x - w / 2;
  const top = y0 - r;
  const edge = mixHex(COL.dead, COL.cream, 0.55);
  const lw = 3;
  const dash = "12 8";
  return (
    <g>
      <rect x={x0} y={top} width={w} height={r} fill={mixHex(COL.dead, COL.cream, 0.2)} opacity={0.26} />
      <rect x={x0} y={top} width={w} height={r} fill={`url(#${UID}-hatch-cream)`} opacity={0.5} />
      <path d={`M ${x0 + lw / 2} ${y0} V ${top + lw / 2}`} stroke={edge} strokeWidth={lw} strokeDasharray={dash} fill="none" />
      <path d={`M ${x0 + w - lw / 2} ${y0} V ${top + lw / 2}`} stroke={edge} strokeWidth={lw} strokeDasharray={dash} fill="none" />
      <path d={`M ${x0} ${top + lw / 2} H ${x0 + w}`} stroke={edge} strokeWidth={lw} strokeDasharray={dash} fill="none" opacity={c01(r / 6)} />
    </g>
  );
};

/** the military bar's number: "20,000" counting as the solid rises, then opening into "20,000–35,000": the 20,000
 *  slides left as "–35,000" slides up beside it, counting from 20,000 with the range's tip */
const MilNumber: React.FC<{ x: number; y: number; pSolid: number; pRange: number; frame: number }> = ({ x, y, pSolid, pRange, frame }) => {
  const S = TY.num;
  const a1 = ADV_A * S;
  const full = ADV_FULL * S;
  const open = enter(frame, T.milRange[0], 12);
  const e = open.o; // 0..1, the label opens over the range's first 12 frames
  const left = x - (a1 / 2 + (full / 2 - a1 / 2) * e);
  const ent = enter(frame, T.milSolid[0] + 0.5, 6);
  if (ent.o <= 0) return null;
  const text1 = pSolid >= 1 ? fmt(FIG.iraqiMil.lo) : count100(FIG.iraqiMil.lo * pSolid);
  const v2 = FIG.iraqiMil.lo + (FIG.iraqiMil.hi - FIG.iraqiMil.lo) * pRange;
  const text2 = `–${pRange >= 1 ? fmt(FIG.iraqiMil.hi) : count100(v2)}`;
  const wNow = a1 + (full - a1) * e;
  return (
    <g opacity={ent.o} transform={`translate(0 ${(0.25 * ent.lift * S).toFixed(3)})`}>
      <Plate uid={UID} cx={x} cy={y - S * 0.36} rx={wNow / 2 + 40} ry={S * 0.78} amt={0.75} />
      <ChartText x={left} y={y} size={S} font={FONT.num} text={text1} anchor="start" />
      {e > 0 ? (
        <g opacity={e} transform={`translate(0 ${(open.lift * S).toFixed(3)})`}>
          <ChartText x={left + a1} y={y} size={S} font={FONT.num} text={text2} anchor="start" />
        </g>
      ) : null}
    </g>
  );
};

/** the coalition's number: its size (between the civilians' 62 and the names' 48: 59 screen px settled at k 1.09), its
 *  text, and its gap above the sliver (tight above an 8 px bar it read as underlined text) */
export const COAL_NUM = 54;
export const COAL_TEXT = "<400";
export const COAL_GAP = 44;

/** the whole chart at a frame, inside a <WorldSvg cam={chartCamOf(cam)}>. Settled from f253 on: cut 107 draws it at
 *  frame={LAST_FRAME}. */
export const IraqisChart: React.FC<{ frame: number }> = ({ frame }) => {
  const title = enter(frame, T.title[0], T.title[1]);
  const milLab = enter(frame, T.milLabel[0], T.milLabel[1]);
  const pSolid = grow(frame, T.milSolid[0], T.milSolid[1]);
  const pRange = grow(frame, T.milRange[0], T.milRange[1]);
  const hSolid = FIG.iraqiMil.lo * PX_PER * pSolid;
  const hRange = (FIG.iraqiMil.hi - FIG.iraqiMil.lo) * PX_PER * pRange;

  const civFoot = grow(frame, T.civFoot[0], T.civFoot[1]);
  const civLab = enter(frame, T.civLabel[0], T.civLabel[1]);
  const pCiv = grow(frame, T.civBar[0], T.civBar[1]);
  const hCiv = FIG.iraqiCiv * PX_PER * pCiv;
  const civNum = enter(frame, T.civBar[0] + 1, 8);

  const coalFoot = grow(frame, T.coalFoot[0], T.coalFoot[1]);
  const pCoal = grow(frame, T.coalBar[0], T.coalBar[1]);
  const hCoal = FIG.coalitionUnder * PX_PER * pCoal;
  const coalName = enter(frame, T.coalName[0], T.coalName[1]);
  const coalNum = enter(frame, T.coalNum[0], T.coalNum[1]);

  const milX0 = SLOTS.mil - BAR_W.mil / 2;
  const civX0 = SLOTS.civ - BAR_W.civ / 2;
  return (
    <>
        <ChartDefs uid={UID} />
        <defs>
          <linearGradient id={`${UID}-civ`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={mixHex(COL.creamLo, COL.cream, 0.25)} />
            <stop offset="1" stopColor={mixHex(COL.creamLo, COL.shadow, 0.14)} />
          </linearGradient>
        </defs>
        <ChartTitle uid={UID} x={TITLE.x} y={TITLE.y} text="Gulf War deaths" o={title.o} lift={title.lift} size={TY.title} />

        {/* Iraqi military: the solid 20,000, then the uncertain range to 35,000 */}
        <Foot x={SLOTS.mil} w={BAR_W.mil} base={BASE} />
        {hSolid > 0 ? (
          <g>
            <rect x={milX0} y={BASE - hSolid} width={BAR_W.mil} height={hSolid} fill={`url(#${UID}-dead)`} />
            {hSolid > 40 ? <rect x={milX0} y={BASE - Math.min(hSolid, 160)} width={BAR_W.mil} height={Math.min(hSolid, 160)} fill={`url(#${UID}-foot)`} /> : null}
          </g>
        ) : null}
        <RangeBlock x={SLOTS.mil} w={BAR_W.mil} y0={BASE - hSolid} r={hRange} />
        <MilNumber x={SLOTS.mil} y={BASE - hSolid - hRange - NUM_GAP} pSolid={pSolid} pRange={pRange} frame={frame} />
        <CategoryLabel uid={UID} x={SLOTS.mil} base={BASE} name="Iraqi military" o={milLab.o} lift={milLab.lift} nameSize={TY.name} nameDy={NAME_DY} />

        {/* Iraqi civilians killed by the bombing */}
        <DrawnFoot x={SLOTS.civ} w={BAR_W.civ} p={civFoot} />
        {hCiv > 0 ? <rect x={civX0} y={BASE - hCiv} width={BAR_W.civ} height={hCiv} fill={`url(#${UID}-civ)`} /> : null}
        {hCiv > 40 ? <rect x={civX0} y={BASE - hCiv} width={BAR_W.civ} height={hCiv} fill={`url(#${UID}-foot)`} /> : null}
        <NumberLabel uid={UID} x={SLOTS.civ} y={BASE - hCiv - NUM_GAP} size={TY.num} text={`~${pCiv >= 1 ? fmt(FIG.iraqiCiv) : count100(FIG.iraqiCiv * pCiv)}`} o={civNum.o} lift={0.4 * civNum.lift} />
        <CategoryLabel uid={UID} x={SLOTS.civ} base={BASE} name="Civilians" o={civLab.o} lift={civLab.lift} nameSize={TY.name} nameDy={NAME_DY} />

        {/* the coalition, in the third slot: its foot draws out, the sliver rises from it at the same scale */}
        <DrawnFoot x={SLOTS.coal} w={BAR_W.coal} p={coalFoot} />
        <NumberLabel uid={UID} x={SLOTS.coal} y={BASE - hCoal - COAL_GAP} size={COAL_NUM} text={COAL_TEXT} fill={COL.accent} o={coalNum.o} lift={0.6 * coalNum.lift} />
        <CategoryLabel uid={UID} x={SLOTS.coal} base={BASE} name="Coalition" o={coalName.o} lift={coalName.lift} nameSize={TY.name} nameDy={NAME_DY} />
        {/* the sliver and its glow over the labels' soft plates, so the plates arriving do not muddy the glow */}
        <Bar uid={UID} x={SLOTS.coal} w={BAR_W.coal} base={BASE} h={hCoal} kind="accent" glow={pCoal} foot={false} />
    </>
  );
};

const IraqisLost: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const A = chartAirOf(cam, REST, frame);
  return (
    <ChartStage A={A}>
      <WorldSvg cam={chartCamOf(cam)}>
        <IraqisChart frame={frame} />
      </WorldSvg>
    </ChartStage>
  );
};

export default IraqisLost;
