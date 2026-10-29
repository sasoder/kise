// ---------------------------------------------------------------------------
// IraqisLost (sarah-gulf-war, cut 90). Dwarkesh 3D style (styles/dwarkesh-3d.md) as a FLAT 2D chart in the air, in the
// clip's death-toll chart family (gulfChart.tsx, shared with cuts 6 and 107). Opaque 1080x1920, 24 fps, 163 frames.
//
// CHECK LINE: "Iraq lost somewhere between 20,000 and 35,000 soldiers, and about 3,000 civilians to the bombing."
//
// THE LINE: "The Iraqis lost between 20,000 and 35,000 military deaths and up to 3,000 civilians from the bombing."
// (before it, on the speaker: "... Now let's look at the casualties."; after it: "Okay, coalition forces, 392 total
// deaths ...", then cut 107 opens on this cut's last frame and grows the coalition's sliver in the empty third slot)
// WORD -> FRAME (Whisper, ~5-9 f early): Iraqis 1 · lost 14 · between 20 · 20,000 33 · and 54 · 35,000 56 · military 75 ·
// deaths 80 · and 93 · up 100 · to 105 · 3,000 110 · civilians 124 · from 137 · the 145 · bombing 149 (slot ends 163).
// DURATION: the slot 90.5 -> 97.291667 s (00:01:30:12 - 00:01:37:07) = 6.791667 s x 24 = 163 frames (f0..f162).
//
// THE MOTION: the title slides up f-3..8; one wide umber "Iraqi military" bar rises from its foot f1-38, its number
// riding its top and counting (in hundreds) to 20,000 (lands f38, "20,000" ~f39-42); from f40 it keeps rising as the
// uncertain range (pale, hatched, its dashed sides laid down from the solid top by the rising tip) to 35,000 by f61
// ("35,000" ~f61-65) while the number opens into "20,000–35,000" (the 20,000 slides left as "–35,000" slides up beside
// it, counting on with the tip). Over "up to 3,000 civilians" a narrower creamLo bar's foot draws out f92-100, "Civilians"
// slides up f95-105 and the bar rises f98-116 to ~3,000 ("3,000" ~f115-119). The camera is one slow continuous drift-in
// (k 0.9 -> 1 about the group's foot) that keeps the two Iraqi bars and their labels one centred group with equal
// margins from f0 to the end, decelerating into a creep: f116-162 is settled and alive (creep, sway, motes). It frames
// only what exists; the coalition slot stays in the layout off frame right, and cut 107 trucks right to reveal it.
// Colour: the Iraqi dead are DEAD umber (soldiers) and creamLo (civilians); orange stays reserved for the coalition's
// sliver in cut 107. The third slot (SLOTS.coal) exists in the layout, at the right edge of the last frame, but nothing is drawn there.
//
// FRAMING: linear and honest, ONE px-per-death for every bar: 35,000 = 700 px (PX_PER 0.02; 3,000 = 60 px; 400 = 8 px).
// Type at gulfChart rev 2's phone sizes on the settled frame (k 1: title 58, names 48, numbers 62 screen px). The
// baseline sits at screen y 996 (the zoom is anchored on it), so the one-line name row under it ends by y ~1070 with
// the sway; the range top is at y 296 and the title above it, so the chart fills y ~120-1070, the whole height above the
// first caption band (names under the bars cannot go lower without entering y 1080-1250). Nothing readable in y
// 1080-1250 or 1360-1460 on any frame; the lower frame sinks into the dense espresso air (styles/dwarkesh-3d.md).
//
// SOURCES (COMMON.md, gulfChart FIG): Iraqi military deaths 20,000-35,000 (Wikipedia, "Gulf War", casualty estimates;
// Project on Defense Alternatives 20,000-26,000); Iraqi civilians killed by the bombing about 3,000 (Iraqi government
// 2,300; PDA 3,664) -> shown "~3,000".
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldSvg, c01, mixHex, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { COL, CategoryLabel, ChartDefs, ChartStage, ChartText, ChartTitle, FIG, FONT, Foot, NumberLabel, Plate, chartAirOf, creep, enter, fmt, grow, typeAt } from "./gulfChart";

export const FPS = 24;
export const DURATION = 163;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const UID = "il";

// ---- layout (exported for cut 107, which opens on this cut's last frame) ------------------------------------------
/** px per death, the same for every bar (35,000 -> 700 px) */
export const PX_PER = 700 / FIG.iraqiMil.hi;
/** bar widths: the wide military bar, the narrower civilians bar, the reserved coalition slot */
export const BAR_W = { mil: 240, civ: 140, coal: 140 };
/** bar centres (world x; on the last frame screen x = world x + 142): Iraqi military, the civilians, and the EMPTY
 *  third slot for the coalition (cut 107). Spaced by their labels at phone size: "20,000–35,000" (452 px at 62) starts
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
/** one slow continuous drift-in: the zoom on gulfChart's creep (end slope 0.3, never a dead stop) about the group's
 *  foot (GROUP_CX, BASE), which holds at screen (540, 996): the two Iraqi bars stay one centred group with equal
 *  margins (~215 px on the last frame) on every frame. The coalition slot (SLOTS.coal) is off frame right at the end;
 *  cut 107 continues this camera (camAt(DURATION - 1) is its first frame) and trucks right to reveal it. */
export const camAt = (f: number): Cam => {
  const t = f / (DURATION - 1);
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * creep(t, 0.3));
  return { k, cx: GROUP_CX, cy: BASE - (BASE - 960) / k };
};
const REST = swayCam(camAt(0), 0);

// ---- timing -------------------------------------------------------------------------------------------------------
const T = {
  title: [-3, 11],
  milLabel: [-1, 10],
  milSolid: [1, 37], // lands f38 ("20,000" ~f39-42)
  milRange: [40, 21], // lands f61 ("35,000" ~f61-65)
  civFoot: [92, 8],
  civLabel: [95, 10],
  civBar: [98, 18], // lands f116 ("3,000" ~f115-119)
} as const;

/** an estimate counts in hundreds (an exact-looking 23,417 would claim a precision the sources do not have) */
const count100 = (v: number) => fmt(Math.round(v / 100) * 100);

// Caslon lining figures, advance widths per font px (measured: "20,000" 3.30, "20,000–35,000" 7.31)
const ADV_A = 3.3;
const ADV_FULL = 7.31;

// ---- pieces -------------------------------------------------------------------------------------------------------
/** gulfChart's Foot (rev 2: w + 12 wide, 2.4 high, creamLo 0.42), drawn out from its centre by two tips */
const DrawnFoot: React.FC<{ x: number; w: number; p: number }> = ({ x, w, p }) => {
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

const IraqisLost: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const A = chartAirOf(cam, REST, frame);

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

  const milX0 = SLOTS.mil - BAR_W.mil / 2;
  const civX0 = SLOTS.civ - BAR_W.civ / 2;
  return (
    <ChartStage A={A}>
      <WorldSvg cam={cam}>
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

        {/* SLOTS.coal: reserved for the coalition's sliver (cut 107); nothing is drawn here */}
      </WorldSvg>
    </ChartStage>
  );
};

export default IraqisLost;
