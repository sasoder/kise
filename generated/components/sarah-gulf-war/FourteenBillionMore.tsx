// ---------------------------------------------------------------------------
// FourteenBillionMore (sarah-gulf-war, cut 80). Dwarkesh 3D style (styles/dwarkesh-3d.md) as a FLAT 2D isotype ledger
// in the teal air, on the clip's shared troops-and-cash world burdenWorld.tsx (owner: cut 69 SmallPotatoes).
// Opaque 1080x1920, 24 fps, 155 frames. It opens on cut 74 FiftyBillion's last frame (world time wf = WF_80 + frame).
//
// CHECK LINE: "On top of that, another $14 billion went to the other coalition partners, so the whole coalition was
// paid for."
//
// THE LINE: "Plus, they pay an additional $14 billion to various coalition partners to help them pay to do what they
// want to do." (before it, cut 74: "They pay the United States over $50 billion to pay for all the U.S. troops";
// after it, on the speaker: "So the United States didn't even pay for this war. Other people did.")
// WORD -> FRAME (Whisper, ~5-9 f early): Plus -3 · they 7 · pay 17 · an 23 · additional 25 · $14 33 · billion 53 · to 63 ·
// various 70 · coalition 74 · partners 85 · to 96 · help 104 · them 108 · pay 113 · to 118 · do 126 · what 131 ·
// they 134 · want 137 · to 142 · do 145 (the slot ends at 155).
// DURATION: the slot 80.083333 -> 86.541667 s (00:01:20:02 - 00:01:26:13) = 6.4583 s x 24 = 155 frames (f0..f154).
//
// THE MOTION: one continuous pour, settle and pull-back. f0 = cut 74's f126 (the US block under its "$50B+" slab, the
// allies' block bare). "Plus ... an additional $14 billion": a second chart foot draws out from its centre (f1-7) at
// the same height in the open air over the ALLIES' block, where cut 74's column stood, and a second, smaller stream of
// the same bundles falls in from beyond the top frame edge (one gravity, as cut 74) and stacks on it into a column as
// wide as cut 74's column (C_FILES files) and 14/50 of its height (L14 of LC layers: the same width, so height and
// area are both honest: 2 x 5 = 10 bundles against cut 74's 2 x 18 = 36, 0.28); its plate "Partners" slides up over the column top as the number counts +$0B -> +$14B
// (decelerating), landing by "billion" (f52). From f58 ("to various coalition partners") the column on its foot slides down
// (accelerating, f58-83) onto the allies' block under the same contact rule as cut 74 (the foot touches the top rank's helmets on CONTACT_A; first
// reaction CONTACT_A + 1: a small squash, and the soldiers warm toward cream-orange, the top rank first). The column
// already spans the allies' block (the fewest files over its silhouette = 2 = C_FILES), so it covers it as it lands,
// no topple. "to help them pay to do what they want to do": one slow, eased pull-back (one lobe in d ln k, f92-148)
// to the summing-up frame, both troop blocks under their cash, centred; then a living hold to f154 (the creep out, a
// slow cream sheen drifting over the cash, the icons breathing, motes).
// Orange = the allies' cash (the accent's one meaning in the money cuts).
//
// CAMERA: d ln k / df continues cut 74's end slope (+0.002 / f) and eases to a slow creep in (+0.0008 / f, f0-30); the
// pull-back is one sin^2 lobe over f92-148 (peak ~ -0.0055 / f) easing to a creep out (-0.0006 / f) that runs to the
// last frame (k 0.630 -> ~0.58); cx eases to the coalition's centre and the plates' bottom anchor (END_ANCHOR - 34 ->
// 1046 + LEDGER_DROP, i.e. 1108 -> 1126) with the same
// lobe; the vertical is solved as cut 69 / 74 (the plates' bottom at the screen anchor). The kit's sway on top (wf).
// FRAMING (user's note, Nov 1): the whole ledger sits LEDGER_DROP = 80 px lower, as in cuts 69 and 74: the plates' bottom
// ends at y 1126, so the troop plates overlap the top caption band (y 1080-1250), accepted because the user asked for
// this move; nothing reaches y 1360-1460. burdenAirOf keeps the air where it was.
// CONTACT: the allies' column foot touches the helmets (CONTACT_Y) on f83; first reaction f84 (squash, warmth).
//
// JOIN: f0 is rebuilt from cut 74's exports (camAt74, anchorAt, planBundles, CONTACT_Y, FOOT_Y0, PLATE_SIZE, ...);
// what cut 74 does not export (its warmth colour and amount, the cash plate, the foot's stroke, the fall's gravity)
// is copied below in C74 and proven by the f0-vs-cut-74-f126 difference image.
//
// SOURCES (COMMON.md, verified for the clip): the Gulf Crisis Financial Co-ordination Group's $14B of assistance to the
// frontline states (Egypt, Turkey, Jordan ...) -> "+$14B"; the $50B+ (cut 74): Congress (Apr 1992), about $52-54B of
// the US's $61.1B cost paid by other countries. The troop blocks: burdenWorld.tsx (CRS RL32492 Table 8).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, AirStage, Paint, WorldSvg, c01, mixHex, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  ALLIES,
  BUNDLE_H,
  BUNDLE_W,
  BurdenDefs,
  BurdenPlate,
  COL,
  FONT,
  ICON_H,
  LEDGER_DROP,
  PITCH_X,
  PLATE_BOTTOM,
  PLATE_TOP,
  REST_CAM,
  TYPE,
  US,
  WF_74,
  burdenAirOf,
  drainAt,
  drawCash,
  drawTroops,
  enterText,
  iconAt,
  toScreen,
  troopOptsAt,
  useBurdenSprites,
  veilAt,
  type BundleDraw,
  type SpriteGet,
} from "./burdenWorld";
import { CONTACT_Y, C_FILES, S_FILES, DURATION as DURATION_74, FOOT_GAP, FOOT_Y0, LC, PLATE_SIZE, anchorAt, camAt74, planBundles } from "./FiftyBillion";

export const FPS = 24;
export const DURATION = 155;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** cut 74's last frame, and this cut's world time: wf = WF_80 + frame */
const F74 = DURATION_74 - 1;
export const WF_80 = WF_74 + F74;

// ---- helpers ------------------------------------------------------------------------------------------------------
const sst = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
const smoother = (u: number) => {
  const v = c01(u);
  return v * v * v * (v * (6 * v - 15) + 10);
};
const out3 = (u: number) => 1 - Math.pow(1 - c01(u), 3);
const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 47.3) * 43758.5453;
  return s - Math.floor(s);
};
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const worldYAt = (cam: Cam, sy: number) => cam.cy + (sy - 960) / cam.k;

// ===================================================================================================================
// C74: what cut 74 draws on its last frame but does not export (copied from FiftyBillion.tsx; the f0 diff proves it)
// ===================================================================================================================
const C74 = {
  /** the bundles' file pitch, read off cut 74's settled slab (S_FILES files spanning 2 x half) */
  pitchB: (2 * planBundles(DURATION_74 - 1).half) / S_FILES,
  /** the paid-for warmth on the soldiers: saturated on every US icon by cut 74's last frame */
  warm: mixHex(COL.cream, ACCENT, 0.5),
  warmAmt: 0.36,
  warmLen: 8,
  rankLag: 1.6,
  /** one gravity (world px / f^2) and the speed a bundle has as it crosses the frame top */
  G: 4.2,
  V0: 38,
  /** the cash plate: the number's baseline under the name top, and the gap from the number to the stack top */
  numDy: TYPE.name * PLATE_SIZE * 0.72 + TYPE.num * PLATE_SIZE * 1.02,
  numToTop: 46 * PLATE_SIZE,
};
const PLATE_OFF = C74.numDy + C74.numToTop;

// ===================================================================================================================
// THE CAMERA (before swayCam): camAt80(0) === camAt74(F74)
// ===================================================================================================================
const CAM0 = camAt74(F74);
const S0 = Math.log(camAt74(F74 + 0.5).k) - Math.log(camAt74(F74 - 0.5).k);
export const CAM80 = {
  /** the creep in it eases to (d ln k / f) by f RA */
  sD: 0.0008,
  RA: 30,
  /** the pull-back: one sin^2 lobe of depth A over P0..P1, easing to the creep out sE */
  P0: 92,
  P1: 148,
  A: 0.0045,
  sE: -0.0006,
  /** the plates' bottom anchor at the end (screen y) */
  anchorEnd: 1046 + LEDGER_DROP,
};
const rateAt = (f: number) => {
  const u = (f - CAM80.P0) / (CAM80.P1 - CAM80.P0);
  const lobe = u > 0 && u < 1 ? Math.pow(Math.sin(Math.PI * u), 2) : 0;
  return S0 + (CAM80.sD - S0) * sst(f / CAM80.RA) + (CAM80.sE - CAM80.sD) * sst(u) - CAM80.A * lobe;
};
const STEP = 0.05;
const LNK_TAB: number[] = (() => {
  const n = Math.ceil((DURATION + 2) / STEP);
  const t = [Math.log(CAM0.k)];
  for (let i = 1; i <= n; i++) t.push(t[i - 1] + 0.5 * (rateAt((i - 1) * STEP) + rateAt(i * STEP)) * STEP);
  return t;
})();
const lnkAt = (f: number) => {
  if (f <= 0) return LNK_TAB[0] + S0 * f;
  const x = f / STEP;
  const i = Math.min(Math.floor(x), LNK_TAB.length - 2);
  return LNK_TAB[i] + (LNK_TAB[i + 1] - LNK_TAB[i]) * (x - i);
};
const pullU = (f: number) => smoother((f - CAM80.P0) / (CAM80.P1 - CAM80.P0));

// ===================================================================================================================
// THE +$14B: a column C_FILES wide (cut 74's column width) and L14 layers tall (14/50 of cut 74's LC) on its own foot at
// cut 74's foot height, over the allies' block; it slides down onto the helmets and rests there (it already spans
// the block: no topple)
// ===================================================================================================================
export const L14 = Math.round((LC * 14) / 50);
export const N14 = C_FILES * L14;
/** the allies' slab files by cut 74's rule (the fewest, even, that span the block's silhouette) */
const SA_FILES = 2 * Math.ceil((ALLIES.right - ALLIES.left) / C74.pitchB / 2);
if (SA_FILES > C_FILES) throw new Error(`FourteenBillionMore: the allies' block needs ${SA_FILES} files, the column has ${C_FILES}: add the topple`);
if (Math.abs(L14 / LC - 0.28) > 0.03) throw new Error(`FourteenBillionMore: ${L14}/${LC} layers is not ~14/50`);
if (ALLIES.top !== US.top) throw new Error("FourteenBillionMore: the contact line assumes both blocks share a top");
/** the stream: the first bundle crosses the frame top ~f3, the last lands on POUR_END */
const LAND0 = 13;
const POUR_END = 34;
/** the plate: slides up from PLATE_F; the count runs over COUNT_LEN from PLATE_F + 2 */
const PLATE_F = 35;
const COUNT_LEN = 15;
/** the descent: the column leaves on DESC_A, its foot touches the helmets on CONTACT_A (an accelerating slide, as cut 74, over 25 frames, starting imperceptibly, so the stretch after the count keeps moving) */
export const DESC_A = 58;
export const CONTACT_A = 83;
const fileXA = (j: number) => ALLIES.cx + (j - (C_FILES - 1) / 2) * C74.pitchB;
const landBase = (i: number) => {
  const u = i / (N14 - 1);
  return LAND0 + (POUR_END - LAND0) * (u - (0.3 * Math.sin(2 * Math.PI * u)) / (2 * Math.PI));
};
const landAt = (i: number) => landBase(i) + (hash(i * 13.7 + 905.1) - 0.5) * 0.66 * (landBase(Math.min(i + C_FILES, N14 - 1)) - landBase(i) || 1);
const fallTime = (dist: number) => (-C74.V0 + Math.sqrt(C74.V0 * C74.V0 + 2 * C74.G * dist)) / C74.G;
const dropAt = (f: number) => FOOT_GAP * Math.pow(c01((f - DESC_A) / (CONTACT_A - DESC_A)), 2);
// the start: 40 screen px above the frame top on this cut's camera at the bundle's start frame
const START_Y: number[] = [];
const startY = (i: number) => {
  if (START_Y[i] !== undefined) return START_Y[i];
  const Yc = FOOT_Y0 - Math.floor(i / C_FILES) * BUNDLE_H;
  let y = worldYAt(camAt80(landAt(i) - 10), -40);
  for (let it = 0; it < 3; it++) y = worldYAt(camAt80(landAt(i) - fallTime(Yc - y)), -40);
  START_Y[i] = y;
  return y;
};
/** the +$14B on frame f (bottom layer first), and its top */
export const planPartners = (f: number): { draws: BundleDraw[]; top: number } => {
  const draws: BundleDraw[] = [];
  const drop = dropAt(f);
  for (let i = 0; i < N14; i++) {
    const L = Math.floor(i / C_FILES);
    const c = i % C_FILES;
    const jx = (hash(i * 3.1 + 700.4) - 0.5) * 7;
    const rot0 = (hash(i * 7.7 + 701.3) - 0.5) * 3;
    const X = fileXA(c) + jx;
    const Y = FOOT_Y0 - L * BUNDLE_H + drop;
    const T = landAt(i);
    if (f < T) {
      const dist = Y - startY(i);
      const tf = fallTime(dist);
      const t = f - (T - tf);
      if (t < 0) continue;
      const tumble = (hash(i * 2.3 + 708.1) - 0.5) * 9 * (1 - t / tf);
      draws.push({ X, Y: startY(i) + C74.V0 * t + 0.5 * C74.G * t * t, rot: rot0 * (t / tf) + tumble, sy: 1 });
      continue;
    }
    const tl = f - T;
    const sq = tl >= 0 && tl < 4 ? 1 - 0.13 * Math.sin((Math.PI * (tl + 1)) / 5) : 1;
    // the contact squash, as cut 74's lower half
    const tc = f - CONTACT_A;
    const sc = tc >= 0 && tc < 5 ? 1 - 0.05 * Math.sin((Math.PI * (tc + 1)) / 6) : 1;
    draws.push({ X, Y, rot: rot0, sy: sq * sc });
  }
  return { draws, top: FOOT_Y0 + drop - L14 * BUNDLE_H };
};
const warmAllies = (f: number, i: number) => C74.warmAmt * sst((f - CONTACT_A - 1 - C74.rankLag * iconAt(ALLIES, i).r) / C74.warmLen);

// the camera needs the column's geometry only for its final centre
const CX_END = (fileXA(0) - BUNDLE_W / 2 + (US.cx + (S_FILES * C74.pitchB) / 2)) / 2;
export function camAt80(f: number): Cam {
  const k = Math.exp(lnkAt(f));
  const p = pullU(f);
  const anchor = anchorAt(F74) + (CAM80.anchorEnd - anchorAt(F74)) * p;
  return { k, cx: CAM0.cx + (CX_END - CAM0.cx) * p, cy: PLATE_BOTTOM - (anchor - 960) / k };
}

// ---- the sheen: a slow cream glint drifting over the cash once it rests ----------------------------------------------
const SHEEN = { f0: 100, len: 24, amp: 0.16, bands: 3, speed: 0.018 };
const sheen = (ctx: CanvasRenderingContext2D, f: number) => {
  const a = SHEEN.amp * sst((f - SHEEN.f0) / SHEEN.len);
  if (a <= 0.002) return;
  const g = ctx.createLinearGradient(-300, 200, 1380, 1100);
  for (let s = 0; s <= 48; s++) {
    const u = s / 48;
    const w = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * (u * SHEEN.bands - f * SHEEN.speed)), 12);
    g.addColorStop(u, `rgba(243,235,221,${(a * w).toFixed(4)})`);
  }
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.restore();
};

// ---- the cash plates ------------------------------------------------------------------------------------------------
type PlateProps = { uid: string; x: number; y: number; name: string; o: number; lift: number; size: number; body: React.ReactNode };
/** cut 74's CashPlate, with the number's body passed in */
const CashPlate: React.FC<PlateProps> = ({ uid, x, y, name, o, lift, size, body }) => {
  if (o <= 0) return null;
  const sN = TYPE.name * size;
  const sU = TYPE.num * size;
  const yN = y + sN * 0.72;
  const yU = yN + sU * 1.02;
  const w = Math.max(name.length * sN * 0.62, "$50B+".length * sU * 0.56);
  const text = (yy: number, s: number, font: string, fill: string, spacing: number, b: React.ReactNode) => (
    <text
      x={x + spacing * s * 0.5}
      y={yy}
      textAnchor="middle"
      fill={fill}
      stroke={COL.shadow}
      strokeOpacity={0.9}
      strokeWidth={s * 0.2}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ fontFamily: font, fontSize: s, letterSpacing: spacing * s, fontVariantNumeric: "lining-nums tabular-nums" }}
    >
      {b}
    </text>
  );
  return (
    <g opacity={o} transform={`translate(0 ${n2(lift * sN)})`}>
      <ellipse cx={x} cy={(y + yU) / 2 + 2 * size} rx={w * 0.5 + 58 * size} ry={(yU - y) * 0.5 + 34 * size} fill={`url(#${uid}-plate)`} opacity={0.88} />
      {text(yN, sN, FONT.label, mixHex(COL.cream, COL.creamLo, 0.15), 0.02, name)}
      {text(yU, sU, FONT.num, COL.accentPale, 0.01, body)}
    </g>
  );
};

// ---- the troops with the paid-for warmth (cut 74's US, saturated; the allies' from this cut's contact) ---------------
const drawWarmTroops = (ctx: CanvasRenderingContext2D, get: SpriteGet, cam: Cam, wf: number, f: number, o: ReturnType<typeof troopOptsAt>) => {
  drawTroops(ctx, get, cam, wf, o);
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = C74.warm;
  const cell = (X: number, Y: number, a: number) => {
    if (a <= 0.002) return;
    const [x0, y0] = toScreen(cam, X - PITCH_X / 2, Y - ICON_H - 14);
    const [x1, y1] = toScreen(cam, X + PITCH_X / 2, Y + 8);
    ctx.globalAlpha = a;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
  for (let i = 0; i < US.n; i++) {
    const q = iconAt(US, i);
    cell(q.X, q.Y, C74.warmAmt);
  }
  for (let i = 0; i < ALLIES.n; i++) {
    const q = iconAt(ALLIES, i);
    cell(q.X, q.Y, warmAllies(f, i));
  }
  ctx.restore();
};

// ===================================================================================================================
const FourteenBillionMore: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const wf = WF_80 + frame;
  const get = useBurdenSprites();
  const cam = swayCam(camAt80(frame), wf);
  const { v } = burdenAirOf(cam, REST_CAM, wf);
  // cut 69's end state of the troops, held (as cut 74)
  const o = { ...troopOptsAt(wf, v), drain: drainAt(WF_74), veil: veilAt(WF_74) };
  const dim = 0.25 * drainAt(WF_74);
  // cut 74's slab, carried on its own timeline (settled)
  const us = planBundles(F74 + frame);
  const usFootHalf = us.half + 6;
  const usFootY = CONTACT_Y + 3;
  // the +$14B
  const pa = planPartners(frame);
  const footU = out3((frame - 1) / 6);
  const footHalf = ((C_FILES * C74.pitchB) / 2 + 6) * footU;
  const footY = FOOT_Y0 + dropAt(frame) + 3;
  const pe = enterText(frame, PLATE_F, 11);
  const nCount = Math.round(14 * out3((frame - PLATE_F - 2) / COUNT_LEN));
  return (
    <AirStage v={v} bloom={0.22}>
      <Paint.FolkCanvas draw={(ctx) => drawWarmTroops(ctx, get, cam, wf, frame, o)} />
      <Paint.FolkCanvas
        draw={(ctx) => {
          drawCash(ctx, get, cam, us.draws);
          drawCash(ctx, get, cam, pa.draws);
          sheen(ctx, frame);
        }}
      />
      <WorldSvg cam={cam}>
        <BurdenDefs uid="fb" />
        <BurdenPlate uid="fb" x={ALLIES.cx} y={PLATE_TOP} name="Allies" num="200,000+" o={1} lift={0} dim={dim} />
        <BurdenPlate uid="fb" x={US.cx} y={PLATE_TOP} name="U.S." num="700,000" o={1} lift={0} dim={dim} />
        <line x1={US.cx - usFootHalf} x2={US.cx + usFootHalf} y1={usFootY} y2={usFootY} stroke={COL.creamLo} strokeOpacity={0.5} strokeWidth={4.5} strokeLinecap="round" />
        <CashPlate
          uid="fb"
          x={US.cx}
          y={us.top - PLATE_OFF}
          name="Paid by allies"
          o={1}
          lift={0}
          size={PLATE_SIZE}
          body={
            <>
              <tspan>{"$50B"}</tspan>
              <tspan fillOpacity={1} strokeOpacity={0.9}>
                +
              </tspan>
            </>
          }
        />
        {footU > 0 ? <line x1={ALLIES.cx - footHalf} x2={ALLIES.cx + footHalf} y1={footY} y2={footY} stroke={COL.creamLo} strokeOpacity={0.5} strokeWidth={4.5} strokeLinecap="round" /> : null}
        <CashPlate uid="fb" x={ALLIES.cx} y={pa.top - PLATE_OFF} name="Partners" o={pe.o} lift={pe.lift} size={PLATE_SIZE} body={<tspan>{`+$${nCount}B`}</tspan>} />
      </WorldSvg>
    </AirStage>
  );
};

export default FourteenBillionMore;
