// ---------------------------------------------------------------------------
// ThisSmall (sarah-gulf-war, cut 107). Dwarkesh 3D style (styles/dwarkesh-3d.md) as a FLAT 2D chart in the air, in the
// clip's death-toll chart family (gulfChart.tsx, shared with cuts 6 and 90). Opaque 1080x1920, 24 fps, 84 frames.
// It OPENS ON CUT 90's LAST FRAME EXACTLY (IraqisLost.tsx, f162): its layout, camera and scene state are imported and
// asserted below, and the join is proved by a still-vs-still difference image.
//
// CHECK LINE: "Next to Iraq's tens of thousands, the coalition's dead are a sliver you can barely see."
//
// THE LINE: "where the death rate for one side is this small." (before it, on the speaker: "Okay, coalition forces, 392
// total deaths. Of those, most of them are Americans. It's 258. I don't know of any wars that have a million
// belligerents"; the speaker's 392 / 258 do not match the sources, so no exact coalition number goes on screen)
// WORD -> FRAME (Whisper, ~5-9 f early): where -8 · the 3 · death 13 · rate 35 · for 41 · one 52 · side 56 · is 64 ·
// this 68 · small 71 (slot ends 84).
// DURATION: the slot 107.291667 -> 110.791667 s (00:01:47:07 - 00:01:50:19) = 3.5 s x 24 = 84 frames (f0..f83).
//
// THE MOTION: f0 is cut 90's settled chart (the Iraqi military bar solid to 20,000 with its hatched range to 35,000, the
// ~3,000 civilians bar) with the empty coalition slot at the right edge. One continuous camera move: it trucks right to
// bring the slot in (the group's right edge lands by ~f40) while, at the SAME px-per-death, the slot's foot draws out
// from its centre (f2-11) and the coalition's tiny ACCENT bar rises from it to its 8 px (fewer than 400; f8-24) with its
// glow; "Coalition" slides up under it (f20-30, "death") and "under 400" above it (f26-36, "death rate"). The zoom,
// already creeping in at cut 90's end slope, grows into one gentle push-in and drop toward the baseline (its lobe peaks
// ~f55, "for one side is", ~90 % by f72, "this small"), the right side holding while the push opens to the left, and it
// settles with the three-bar group (military, civilians, coalition) centred with even margins: k 1 -> 1.09, as far as
// the frame allows with the whole group in shot (its ink runs from world x 74, the left end of "20,000–35,000", to
// 1004, the right end of "under 400": 930 px, so ~33 px margins at k 1.09). The settled frame reads, side by side on
// one baseline: huge, smaller, barely there. f72-83: settled and alive (the creep, the house sway, motes).
// Orange = the coalition's dead (the family's rule); the Iraqi dead stay DEAD umber and creamLo, as in cut 90.
//
// CAMERA: three channels, each one beta-shaped velocity lobe integrated and normalised to land at f83: R, the screen x
// of the group's right ink (world 1004): 1146 -> 1047 (lobe x^1 (1-x)^1.8 on f0-40, then it holds); ln k: s0*f + a lobe
// x^2.2 (1-x)^2.8 on f28-92 (k 1 -> 1.09); yb, the baseline's screen y: 996 -> 982 with the zoom's progress. cx = 1004
// - (R - 540) / k follows (monotonic, 398 -> 539, the group's centre), cy = BASE - (yb - 960) / k. At f0 every value
// AND slope equals cut 90's last frame (it zooms about (GROUP_CX, BASE) at (540, 996) with (ln k)' = s0; R's join
// speed fades out over 16 f), so the join has no velocity step. Then swayCam(cam, f + 162) and the air at frame
// f + 162, so the sway, motes, shafts and grain carry straight on from cut 90.
//
// FRAMING: the lowest readable text (the name row, baseline BASE + NAME_DY) ends at screen y <= ~1060 + 5 sway on every
// frame; nothing readable in y 1080-1250 or 1360-1460. On the last frame everything is in shot: the title's top at
// screen y ~24, the military number's at ~148, the name row ends at ~1054.
//
// SOURCES (COMMON.md, gulfChart FIG): Iraqi military deaths 20,000-35,000 (Wikipedia, "Gulf War", casualty estimates;
// PDA 20,000-26,000); Iraqi civilians ~3,000 (Iraqi govt 2,300; PDA 3,664); coalition deaths 292-379 by source ->
// on screen "under 400", drawn at FIG.coalitionUnder = 400 x PX_PER = 8 px.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldSvg, c01, mixHex, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Bar, COL, CategoryLabel, ChartDefs, ChartStage, ChartText, ChartTitle, FIG, FONT, Foot, NumberLabel, Plate, chartAirOf, enter, fmt, grow } from "./gulfChart";
import { BAR_W, BASE, DURATION as DURATION_90, GROUP_CX, K_END, NAME_DY, NUM_GAP, PX_PER, SLOTS, TY, camAt as camAt90 } from "./IraqisLost";

export const FPS = 24;
export const DURATION = 84;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const UID = "il"; // cut 90's uid: the same defs ids, so the joined frame is byte-for-byte the same SVG
const F90 = DURATION_90 - 1; // cut 90's last frame = this cut's f0

// ---- the join: cut 90's constants (asserted, so a change there fails loudly here) ----------------------------------
if (SLOTS.coal !== 875 || BASE !== 996 || GROUP_CX !== 398 || K_END !== 1 || NAME_DY !== 54 || NUM_GAP !== 22 || Math.abs(PX_PER - 0.02) > 1e-12) {
  throw new Error("ThisSmall: cut 90 (IraqisLost) layout changed; re-check the join");
}
const C90 = camAt90(F90);
if (Math.abs(C90.k - 1) > 1e-9 || Math.abs(C90.cx - GROUP_CX) > 1e-9 || Math.abs(C90.cy - 960) > 1e-9) {
  throw new Error("ThisSmall: cut 90's last camera is not k 1 at (GROUP_CX, 960)");
}
/** cut 90's REST (its motes and shafts parallax against it) */
const REST90 = swayCam(camAt90(0), 0);
/** cut 90's ln-k slope on its last frame (its creep never stops): this cut's zoom starts at the same speed */
const S0 = (Math.log(camAt90(F90).k) - Math.log(camAt90(F90 - 0.001).k)) / 0.001;

// ---- camera -------------------------------------------------------------------------------------------------------
const F_END = DURATION - 1;
/** a velocity lobe x^a (1-x)^b on [t0, t1], integrated (midpoint rule) and normalised to 1 at F_END */
const lobe = (t0: number, t1: number, a: number, b: number) => {
  const raw = (f: number) => {
    const hi = Math.min(f, t1);
    if (hi <= t0) return 0;
    const n = 1200;
    const h = (hi - t0) / n;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * h / (t1 - t0);
      s += Math.pow(x, a) * Math.pow(1 - x, b) * h;
    }
    return s;
  };
  const norm = raw(F_END);
  return (f: number) => raw(f) / norm;
};
/** the three-bar group's ink: world x 74 (the left end of "20,000–35,000") to 1004 (the right end of "under 400") */
const INK_L = 74;
const INK_R = 1004;
const K_FIN = 1.09;
/** even margins at K_FIN: the group's right ink lands here on screen (and its left ink at 1080 - R_END) */
const R_END = 1080 - (1080 - (INK_R - INK_L) * K_FIN) / 2;
const YB_END = 982;
/** the right ink's screen x on cut 90's last frame, and its speed there (cut 90 zooms about screen x 540) */
const R0 = 540 + (INK_R - GROUP_CX) * C90.k;
const VR0 = (INK_R - GROUP_CX) * C90.k * S0;
/** that join speed, fading out over JOIN_T frames (integrated: so the right edge never drifts back after it lands) */
const JOIN_T = 16;
const joinDrift = (f: number) => ((VR0 * JOIN_T) / 3) * (1 - Math.pow(1 - Math.min(f, JOIN_T) / JOIN_T, 3));
const PR = lobe(0, 40, 1, 1.8); // the truck: the right ink slides in, peaks ~f12, lands by ~f40 and then holds
const PK = lobe(28, 92, 2.2, 2.8); // the push: peaks ~f55, ~90 % by f72, still creeping at f83
/** the camera's channels are the right ink's screen x R, ln k and the baseline's screen y; cx follows from R and k, so
 *  while the zoom grows the right side holds and the push opens to the left (everything on screen moves left or holds:
 *  nothing reverses) */
export const camAt = (f: number): Cam => {
  const pk = PK(f);
  const k = Math.exp(S0 * f + (Math.log(K_FIN) - S0 * F_END) * pk);
  const yb = BASE + (YB_END - BASE) * pk;
  const R = R0 + joinDrift(f) + (R_END - R0 - joinDrift(F_END)) * PR(f);
  return { k, cx: INK_R - (R - 540) / k, cy: BASE - (yb - 960) / k };
};
{
  const c = camAt(0);
  if (Math.abs(c.k - C90.k) > 1e-12 || Math.abs(c.cx - C90.cx) > 1e-12 || Math.abs(c.cy - C90.cy) > 1e-12) {
    throw new Error("ThisSmall: f0 camera differs from cut 90's last camera");
  }
}

// ---- cut 90's scene, settled (IraqisLost.tsx at f162; its local pieces copied at their final state) ----------------
const TITLE = { x: GROUP_CX, y: BASE - 700 - NUM_GAP - TY.num * 0.8 - 66 };
const ADV_A = 3.3;
const ADV_FULL = 7.31;

const DrawnFoot: React.FC<{ x: number; w: number; p: number }> = ({ x, w, p }) => {
  if (p <= 0) return null;
  const half = (w / 2 + 6) * p;
  return <rect x={x - half} y={BASE} width={2 * half} height={2.4} fill={COL.creamLo} opacity={0.42} />;
};

const RangeBlock: React.FC<{ x: number; w: number; y0: number; r: number }> = ({ x, w, y0, r }) => {
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

/** "20,000–35,000" as cut 90 leaves it (opened, both runs at rest) */
const MilNumber: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const S = TY.num;
  const a1 = ADV_A * S;
  const full = ADV_FULL * S;
  const left = x - (a1 / 2 + (full / 2 - a1 / 2));
  return (
    <g opacity={1} transform={`translate(0 ${(0).toFixed(3)})`}>
      <Plate uid={UID} cx={x} cy={y - S * 0.36} rx={full / 2 + 40} ry={S * 0.78} amt={0.75} />
      <ChartText x={left} y={y} size={S} font={FONT.num} text={fmt(FIG.iraqiMil.lo)} anchor="start" />
      <g opacity={1} transform={`translate(0 ${(0).toFixed(3)})`}>
        <ChartText x={left + a1} y={y} size={S} font={FONT.num} text={`–${fmt(FIG.iraqiMil.hi)}`} anchor="start" />
      </g>
    </g>
  );
};

// ---- the coalition ------------------------------------------------------------------------------------------------
const T = {
  coalFoot: [2, 9],
  coalBar: [8, 16], // lands f24
  coalName: [20, 10], // lands f30 ("death", real ~f20)
  coalNum: [26, 10], // lands f36 ("rate", real ~f41)
} as const;
/** "under 400": between the civilians' 62 (cut 90) and the 48 of the names, so it clears "~3,000" beside it and reads
 *  from the moment it lands (k ~1.0: 54 screen px) to the settled push (k 1.09: 59 px) */
const COAL_NUM = 54;
const COAL_TEXT = "under 400";
/** the number floats higher over the sliver than NUM_GAP (22): tight above an 8 px bar it read as underlined text */
const COAL_GAP = 44;

const ThisSmall: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f90 = frame + F90; // the sway, the motes and the grain carry on from cut 90
  const cam = swayCam(camAt(frame), f90);
  const A = chartAirOf(cam, REST90, f90);

  const hMil = FIG.iraqiMil.lo * PX_PER;
  const hRange = (FIG.iraqiMil.hi - FIG.iraqiMil.lo) * PX_PER;
  const hCiv = FIG.iraqiCiv * PX_PER;
  const milX0 = SLOTS.mil - BAR_W.mil / 2;
  const civX0 = SLOTS.civ - BAR_W.civ / 2;

  const coalFoot = grow(frame, T.coalFoot[0], T.coalFoot[1]);
  const pCoal = grow(frame, T.coalBar[0], T.coalBar[1]);
  const hCoal = FIG.coalitionUnder * PX_PER * pCoal;
  const coalName = enter(frame, T.coalName[0], T.coalName[1]);
  const coalNum = enter(frame, T.coalNum[0], T.coalNum[1]);
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
        <ChartTitle uid={UID} x={TITLE.x} y={TITLE.y} text="Gulf War deaths" o={1} lift={0} size={TY.title} />

        {/* Iraqi military (cut 90, settled) */}
        <Foot x={SLOTS.mil} w={BAR_W.mil} base={BASE} />
        <g>
          <rect x={milX0} y={BASE - hMil} width={BAR_W.mil} height={hMil} fill={`url(#${UID}-dead)`} />
          <rect x={milX0} y={BASE - 160} width={BAR_W.mil} height={160} fill={`url(#${UID}-foot)`} />
        </g>
        <RangeBlock x={SLOTS.mil} w={BAR_W.mil} y0={BASE - hMil} r={hRange} />
        <MilNumber x={SLOTS.mil} y={BASE - hMil - hRange - NUM_GAP} />
        <CategoryLabel uid={UID} x={SLOTS.mil} base={BASE} name="Iraqi military" o={1} lift={0} nameSize={TY.name} nameDy={NAME_DY} />

        {/* Iraqi civilians (cut 90, settled) */}
        <DrawnFoot x={SLOTS.civ} w={BAR_W.civ} p={1} />
        <rect x={civX0} y={BASE - hCiv} width={BAR_W.civ} height={hCiv} fill={`url(#${UID}-civ)`} />
        <rect x={civX0} y={BASE - hCiv} width={BAR_W.civ} height={hCiv} fill={`url(#${UID}-foot)`} />
        <NumberLabel uid={UID} x={SLOTS.civ} y={BASE - hCiv - NUM_GAP} size={TY.num} text={`~${fmt(FIG.iraqiCiv)}`} o={1} lift={0} />
        <CategoryLabel uid={UID} x={SLOTS.civ} base={BASE} name="Civilians" o={1} lift={0} nameSize={TY.name} nameDy={NAME_DY} />

        {/* the coalition, in the slot cut 90 kept empty: its foot draws out, the sliver rises from it at the same scale */}
        <DrawnFoot x={SLOTS.coal} w={BAR_W.coal} p={coalFoot} />
        <NumberLabel uid={UID} x={SLOTS.coal} y={BASE - hCoal - COAL_GAP} size={COAL_NUM} text={COAL_TEXT} fill={COL.accent} o={coalNum.o} lift={0.6 * coalNum.lift} />
        <CategoryLabel uid={UID} x={SLOTS.coal} base={BASE} name="Coalition" o={coalName.o} lift={coalName.lift} nameSize={TY.name} nameDy={NAME_DY} />
        {/* the sliver and its glow over the labels' soft plates, so the plates arriving do not muddy the glow */}
        <Bar uid={UID} x={SLOTS.coal} w={BAR_W.coal} base={BASE} h={hCoal} kind="accent" glow={pCoal} foot={false} />
      </WorldSvg>
    </ChartStage>
  );
};

export default ThisSmall;
