// ---------------------------------------------------------------------------
// FiftyBillion (sarah-gulf-war, cut 74). Dwarkesh 3D style (styles/dwarkesh-3d.md) as a FLAT 2D isotype ledger in
// the teal air, on the clip's shared troops-and-cash world burdenWorld.tsx (owner: cut 69 SmallPotatoes).
// Opaque 1080x1920, 24 fps, 127 frames. It opens on cut 69's last frame (world time wf = WF_74 + frame).
//
// CHECK LINE: "The allies handed America more than $50 billion, enough to cover its whole force."
//
// THE LINE: "They pay the United States over $50 billion to pay for all the U.S. troops (and other things)."
// (before it, cut 69: "... small potatoes." and on the speaker "Here are the big potatoes."; after it, cut 80:
// "Plus, they pay an additional $14 billion to various coalition partners ...")
// WORD -> FRAME (Whisper, ~5-9 f early): pay 1 · the 8 · United 16 · States 21 · over 33 · $50 48 · billion 57 · to 72 ·
// pay 90 · for 95 · all 100 · the 103 · U.S. 106 · troops 113 · and 119 (the slot ends at 127).
// DURATION: the slot 74.041667 -> 79.333333 s (00:01:14:01 - 00:01:19:08) = 5.2917 s x 24 = 127 frames (f0..f126).
//
// THE MOTION: one continuous pour and settle. f0 = cut 69's f86 (both troop blocks low and small on their plates,
// open air above). "They pay" (from f1): ACCENT banknote bundles (the allies' money) stream in from beyond the TOP
// frame edge, already falling and accelerating under one gravity, in two files onto a faint chart foot drawn out from
// its centre (f1-7) in the open air over the US block, and stack into one tall column that towers over the troops
// (layer by layer; each bundle touches the one below on its landing frame, a 4-frame squash). The camera carries cut
// 69's creep out, easing it, and trucks right to centre the ledger. As the pour ends its plate "Paid by allies" slides
// up over the column top with the number counting $0B -> $50B (decelerating) and the "+" easing in after it. "to pay
// for all the U.S. troops": the column, on its foot, slides down onto the US block (CONTACT: the foot touches the top
// rank's helmets on f97, CONTACT_F; FIRST REACTION f98: the three middle files of soldiers start to warm), its upper
// half sinks in front of the lower half (the stack settles to half its height, f98-107) and splits down the middle,
// each half sliding out one file over the outer soldiers (f103-112), so the cash slab, 4 bundles across, spans the
// whole US block; each soldier warms toward cream-orange as cash comes to rest over his file (the outer files from
// ~f109), top rank first, the warmth running down the ranks (all warm by ~f121). The camera eases down a touch and creeps in with the descent; the last frames
// are a settled living frame (the creep, the icons breathing). The allies' block stays uncovered (cut 80 covers it).
// Orange = the allies' cash (the accent's one meaning in the money cuts).
//
// CAMERA: d ln k / df continues cut 69's end slope (CAM_SLOPE_END) and eases to a slow creep out (f0-36), then to a
// gentle push in over the descent (f84-104) that eases to a creep in to the last frame; cx trucks from cut 69's end
// to the ledger's centre (one smootherstep, f0-70); the vertical is solved as cut 69's (the plates' bottom at screen
// END_ANCHOR), and that anchor eases up a touch (f84-116) with the descent. The kit's sway on top.
// FRAMING (user's note, Nov 1): the whole ledger sits LEDGER_DROP = 80 px lower, as in cut 69: the plates' bottom at
// screen y 1142 at the open, easing to 1108 by f116. The troop plates' number line therefore overlaps the top caption
// band (y 1080-1250) on purpose, the user's call; the band 1360-1460 and the frame bottom stay clear.
//
// SOURCES (COMMON.md, verified for the clip): Congress (Apr 1992) put the US cost of the Gulf War at $61.1B, of which
// about $52-54B was paid by other countries ($36B Kuwait, Saudi Arabia and the Gulf states; $16B Germany and Japan)
// -> "$50B+". The troop blocks: burdenWorld.tsx (CRS RL32492 Table 8).
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
  CAM_SLOPE_END,
  COL,
  CashCanvas,
  END_ANCHOR,
  END_CAM,
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
  drawTroops,
  enterText,
  iconAt,
  toScreen,
  troopOptsAt,
  useBurdenSprites,
  veilAt,
  type BundleDraw,
} from "./burdenWorld";

export const FPS = 24;
export const DURATION = 127;
export const schema = z.object({});
export const defaultProps = schema.parse({});

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

// ===================================================================================================================
// THE CAMERA (before swayCam). camAt74(0) === END_CAM (cut 69's camAt(86)).
// ===================================================================================================================
export const CAM74 = {
  /** the creep out it eases to after cut 69's end slope (d ln k / f), by f RA */
  sA: -0.001,
  RA: 36,
  /** the push in over the descent, and the creep in it eases to */
  sB: 0.0075,
  B0: 84,
  B1: 104,
  sC: 0.002,
  C0: 104,
  C1: 124,
  /** the truck right to the ledger's centre */
  X1: 70,
  /** the plates' bottom eases up by LIFT screen px over the descent */
  LIFT: 34,
  L0: 84,
  L1: 116,
};
const S0 = CAM_SLOPE_END.dlnk;
const rateAt = (f: number) =>
  S0 + (CAM74.sA - S0) * sst(f / CAM74.RA) + (CAM74.sB - CAM74.sA) * sst((f - CAM74.B0) / (CAM74.B1 - CAM74.B0)) + (CAM74.sC - CAM74.sB) * sst((f - CAM74.C0) / (CAM74.C1 - CAM74.C0));
// ln k integrated on a fine table (the rate is smooth; linear interpolation between 1/20-frame samples)
const STEP = 0.05;
const LNK_TAB: number[] = (() => {
  const n = Math.ceil((DURATION + 2) / STEP);
  const t = [Math.log(END_CAM.k)];
  for (let i = 1; i <= n; i++) t.push(t[i - 1] + 0.5 * (rateAt((i - 1) * STEP) + rateAt(i * STEP)) * STEP);
  return t;
})();
const lnkAt = (f: number) => {
  if (f <= 0) return LNK_TAB[0] + S0 * f;
  const x = f / STEP;
  const i = Math.min(Math.floor(x), LNK_TAB.length - 2);
  return LNK_TAB[i] + (LNK_TAB[i + 1] - LNK_TAB[i]) * (x - i);
};
const CX_T = (ALLIES.left + US.right) / 2;
const cxAt = (f: number) => END_CAM.cx + CAM_SLOPE_END.dcx * f * (1 - sst(f / 30)) + (CX_T - END_CAM.cx) * smoother(f / CAM74.X1);
export const anchorAt = (f: number) => END_ANCHOR - CAM74.LIFT * smoother((f - CAM74.L0) / (CAM74.L1 - CAM74.L0));
export const camAt74 = (f: number): Cam => {
  const k = Math.exp(lnkAt(f));
  return { k, cx: cxAt(f), cy: PLATE_BOTTOM - (anchorAt(f) - 960) / k };
};
const worldYAt = (cam: Cam, sy: number) => cam.cy + (sy - 960) / cam.k;

// ===================================================================================================================
// THE CASH: one column (C files x LC layers) on a foot over the US block -> one slab (S files x LS layers) on the
// block. Every size is solved from the world's constants and the camera, so it follows the world.
// ===================================================================================================================
const GAP_X = 4;
const PITCH_B = BUNDLE_W + GAP_X;
/** the slab's files: the fewest (even, so the column halves exactly) that span the US block's outer silhouette */
export const S_FILES = 2 * Math.ceil((US.right - US.left) / PITCH_B / 2);
export const C_FILES = S_FILES / 2;
/** the stream: the first bundle enters the frame top on f1; the last lands on POUR_END */
const POUR_END = 42;
/** the plate: slides up from PLATE_F, the count runs PLATE_F .. PLATE_F + COUNT_LEN, the "+" after it */
const PLATE_F = 41;
const COUNT_LEN = 13;
/** the descent: the column on its foot leaves on DESC_F and its foot touches the helmets on CONTACT_F */
export const DESC_F = 84;
export const CONTACT_F = 97;
/** the spread: on contact the column's upper half sinks down in front of the lower half (the stack settles to half its
 *  height), then splits down its middle and each half slides out one file over the helmets of the outer files */
const TOPPLE_LAG = 1;
const TOPPLE_LEN = 14;
const TILT = 1.5;
/** the plate's size (x TYPE): its name ~46 screen px on the held column (the camera at f60) */
const K_READ = Math.exp(lnkAt(60));
export const PLATE_SIZE = 46 / (TYPE.name * K_READ);
const P_SN = TYPE.name * PLATE_SIZE;
const P_SU = TYPE.num * PLATE_SIZE;
/** plate geometry from the top of its name line (as BurdenPlate): the number's baseline and the soft halo */
const P_NUM_DY = P_SN * 0.72 + P_SU * 1.02;
const P_HALO_UP = (34 - 2) * PLATE_SIZE;
/** the plate's halo top sits this far (screen px) under the frame top while the column is held; the ledger's drop keeps
 *  every world value of the cut as it was */
const TOP_MARGIN = 70 + LEDGER_DROP;
/** the column's top stands this far (world) under the number's baseline */
const NUM_TO_TOP = 46 * PLATE_SIZE;
/** the contact line: the top rank's helmet tops */
export const CONTACT_Y = US.top - 2;
// the column's height: from the foot (a clear gap of air over the helmets) up to the plate, on the held camera
const camRead = camAt74(84);
const PLATE_Y0 = worldYAt(camRead, TOP_MARGIN) + P_HALO_UP;
const COL_TOP_MAX = PLATE_Y0 + P_NUM_DY + NUM_TO_TOP;
const AIR_H = CONTACT_Y - COL_TOP_MAX;
/** the foot's gap over the helmets */
export const FOOT_GAP = Math.round(0.16 * AIR_H);
export const FOOT_Y0 = CONTACT_Y - FOOT_GAP;
/** the column's layers (even: it halves into the slab) */
export const LC = 2 * Math.floor((FOOT_Y0 - COL_TOP_MAX) / BUNDLE_H / 2);
export const LS = LC / 2;
export const N_BUNDLES = C_FILES * LC;
/** the plate rides the stack's top by this offset (world): name-top = top - PLATE_OFF */
const PLATE_OFF = P_NUM_DY + NUM_TO_TOP;
const fileX = (j: number, n: number) => US.cx + (j - (n - 1) / 2) * PITCH_B;
// the stream's landing frames: a rate that swells and thins (w' = 1 + a cos 2 pi u)
const LAND0 = 15;
const landBase = (i: number) => {
  const u = i / (N_BUNDLES - 1);
  return LAND0 + (POUR_END - LAND0) * (u - (0.38 * Math.sin(2 * Math.PI * u)) / (2 * Math.PI));
};
/** a hand-placed scatter of the landings (a third of a file's spacing, so each file still lands in order) */
const landAt = (i: number) => landBase(i) + (hash(i * 13.7 + 5.1) - 0.5) * 0.66 * (landBase(Math.min(i + C_FILES, N_BUNDLES - 1)) - landBase(i) || 1);
/** one gravity: world px / f^2, and the speed (world px / f) a bundle already has as it crosses the frame top */
const G = 4.2;
const V0 = 38;
if (C_FILES !== 2) throw new Error(`FiftyBillion: the topple splits a 2-file column; the world now gives ${C_FILES} files`);

// ---- the foot and the descent ---------------------------------------------------------------------------------------
/** the column's drop (world) from its foot's place: an accelerating slide that touches the helmets on CONTACT_F */
const dropAt = (f: number) => FOOT_GAP * Math.pow(c01((f - DESC_F) / (CONTACT_F - DESC_F)), 2);
/** the topple's progress 0..1 (eased: the halves start out slowly, land falling) */
const toppleAt = (f: number) => c01((f - CONTACT_F - TOPPLE_LAG) / TOPPLE_LEN);
/** a top-half bundle's offset (world) and tilt (deg) at topple progress u, for the side s (-1 left, +1 right):
 *  a rigid half-column leaning out a hair about its outer foot while it slides out one file and falls LS layers */
const toppleOf = (u: number, s: number, X: number, Y: number, pivX: number, pivY: number) => {
  const px = smoother((u - 0.38) / 0.62);
  const py = smoother(u / 0.62);
  const th = ((s * TILT * Math.sin(Math.PI * u)) * Math.PI) / 180;
  const dx = X - pivX;
  const dy = Y - pivY;
  const rx = pivX + dx * Math.cos(th) - dy * Math.sin(th);
  const ry = pivY + dx * Math.sin(th) + dy * Math.cos(th);
  return { X: rx + s * PITCH_B * px, Y: ry + LS * BUNDLE_H * py, rot: (th * 180) / Math.PI };
};
type Plan = { draws: BundleDraw[]; top: number; half: number };
/** every bundle on frame f (painter's order: column index, bottom layer first) */
export const planBundles = (f: number): Plan => {
  const draws: BundleDraw[] = [];
  const drop = dropAt(f);
  for (let i = 0; i < N_BUNDLES; i++) {
    const L = Math.floor(i / C_FILES);
    const c = i % C_FILES;
    const jx = (hash(i * 3.1 + 0.4) - 0.5) * 10;
    const rot0 = (hash(i * 7.7 + 1.3) - 0.5) * 3;
    // its place in the column (resting) and in the slab
    const Xc = fileX(c, C_FILES) + jx;
    const Yc = FOOT_Y0 - L * BUNDLE_H + drop;
    const T = landAt(i);
    if (f < T) {
      // falling: from above the frame top at the start time, under one gravity, landing exactly on T
      const dist = Yc - startY(i);
      const tf = fallTime(dist);
      const t = f - (T - tf);
      if (t < 0) continue;
      const tumble = (hash(i * 2.3 + 8.1) - 0.5) * 9 * (1 - t / tf);
      draws.push({ X: Xc, Y: startY(i) + V0 * t + 0.5 * G * t * t, rot: rot0 * (t / tf) + tumble, sy: 1 });
      continue;
    }
    const tl = f - T;
    const sq = tl >= 0 && tl < 4 ? 1 - 0.13 * Math.sin((Math.PI * (tl + 1)) / 5) : 1;
    if (L < LS) {
      // the lower half: rests on the foot, rides it down, a small squash on the contact
      const tc = f - CONTACT_F;
      const sc = tc >= 0 && tc < 5 ? 1 - 0.05 * Math.sin((Math.PI * (tc + 1)) / 6) : 1;
      draws.push({ X: Xc, Y: Yc, rot: rot0, sy: sq * sc });
      continue;
    }
    // the upper half: sinks in front of the lower half (a squash as it settles), then slides out beside it
    const u = toppleAt(f);
    const s = c === 0 ? -1 : 1;
    const pivX = fileX(c, C_FILES) + (s * PITCH_B) / 2;
    const pivY = FOOT_Y0 + drop - LS * BUNDLE_H;
    const q = toppleOf(u, s, Xc, Yc, pivX, pivY);
    const tlnd = f - (CONTACT_F + TOPPLE_LAG + 0.62 * TOPPLE_LEN);
    const sl = tlnd >= 0 && tlnd < 5 ? 1 - 0.08 * Math.sin((Math.PI * (tlnd + 1)) / 6) : 1;
    draws.push({ X: q.X, Y: q.Y, rot: rot0 + q.rot, sy: sq * sl });
  }
  const top = FOOT_Y0 + drop - LC * BUNDLE_H + LS * BUNDLE_H * smoother(toppleAt(f) / 0.62);
  const half = (C_FILES * PITCH_B) / 2 + ((S_FILES - C_FILES) * PITCH_B * smoother((toppleAt(f) - 0.38) / 0.62)) / 2;
  return { draws, top, half };
};
const fallTime = (dist: number) => (-V0 + Math.sqrt(V0 * V0 + 2 * G * dist)) / G;
// the start: 40 screen px above the frame top on the camera of the bundle's start frame (one refinement)
const START_Y: number[] = [];
const startY = (i: number) => {
  if (START_Y[i] !== undefined) return START_Y[i];
  const L = Math.floor(i / C_FILES);
  const Yc = FOOT_Y0 - L * BUNDLE_H;
  let y = worldYAt(camAt74(landAt(i) - 10), -40);
  for (let it = 0; it < 3; it++) y = worldYAt(camAt74(landAt(i) - fallTime(Yc - y)), -40);
  START_Y[i] = y;
  return y;
};

// ---- the soldiers warm as the slab spreads over their column ---------------------------------------------------------
const WARM = mixHex(COL.cream, ACCENT, 0.5);
const WARM_AMT = 0.36;
const WARM_LEN = 8;
const RANK_LAG = 1.2;
/** the frame cash first rests on an icon column at X: the lower half on the contact, the outer files on the landing
 *  of the toppled halves */
const coverF = (X: number) => (Math.abs(X - US.cx) <= (C_FILES * PITCH_B) / 2 ? CONTACT_F : CONTACT_F + TOPPLE_LAG + 0.75 * TOPPLE_LEN);
const COVER = Array.from({ length: US.cols }, (_, c) => coverF(US.x0 + c * PITCH_X));
const warmAt = (f: number, i: number) => {
  const q = iconAt(US, i);
  return WARM_AMT * sst((f - COVER[q.c] - 1 - RANK_LAG * q.r) / WARM_LEN);
};

// ---- the plate ------------------------------------------------------------------------------------------------------
const CashPlate: React.FC<{ uid: string; x: number; y: number; name: string; n: number; plus: number; o: number; lift: number; size: number }> = ({ uid, x, y, name, n, plus, o, lift, size }) => {
  if (o <= 0) return null;
  const sN = TYPE.name * size;
  const sU = TYPE.num * size;
  const yN = y + sN * 0.72;
  const yU = yN + sU * 1.02;
  const w = Math.max(name.length * sN * 0.62, "$50B+".length * sU * 0.56);
  const text = (yy: number, s: number, font: string, fill: string, spacing: number, body: React.ReactNode) => (
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
      {body}
    </text>
  );
  return (
    <g opacity={o} transform={`translate(0 ${n2(lift * sN)})`}>
      <ellipse cx={x} cy={(y + yU) / 2 + 2 * size} rx={w * 0.5 + 58 * size} ry={(yU - y) * 0.5 + 34 * size} fill={`url(#${uid}-plate)`} opacity={0.88} />
      {text(yN, sN, FONT.label, mixHex(COL.cream, COL.creamLo, 0.15), 0.02, name)}
      {text(
        yU,
        sU,
        FONT.num,
        COL.accentPale,
        0.01,
        <>
          <tspan>{`$${n}B`}</tspan>
          <tspan fillOpacity={plus} strokeOpacity={0.9 * plus}>
            +
          </tspan>
        </>,
      )}
    </g>
  );
};

// ===================================================================================================================
const FiftyBillion: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const wf = WF_74 + frame;
  const get = useBurdenSprites();
  const cam = swayCam(camAt74(frame), wf);
  const { v } = burdenAirOf(cam, REST_CAM, wf);
  // cut 69's end state of the troops, held (its drain and veil are flat from f82 on)
  const o = { ...troopOptsAt(wf, v), drain: drainAt(WF_74), veil: veilAt(WF_74) };
  const dim = 0.25 * drainAt(WF_74);
  const plan = planBundles(frame);
  // the foot: drawn out from its centre by two moving tips (f1-7), rides the column down, spreads with the slab
  const footU = out3((frame - 1) / 6);
  const footHalf = (plan.half + 6) * footU;
  const footY = FOOT_Y0 + dropAt(frame) + 3;
  // the plate rides the stack's top
  const pe = enterText(frame, PLATE_F, 11);
  const nCount = Math.round(50 * out3((frame - PLATE_F - 2) / COUNT_LEN));
  const plus = sst((frame - (PLATE_F + COUNT_LEN - 3)) / 10);
  const plateY = plan.top - PLATE_OFF;
  const warm = (ctx: CanvasRenderingContext2D) => {
    drawTroops(ctx, get, cam, wf, o);
    if (frame <= CONTACT_F) return;
    // the paid-for warmth, on the US icons' own pixels, cell by cell
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = WARM;
    for (let i = 0; i < US.n; i++) {
      const a = warmAt(frame, i);
      if (a <= 0.002) continue;
      const q = iconAt(US, i);
      const [x0, y0] = toScreen(cam, q.X - PITCH_X / 2, q.Y - ICON_H - 14);
      const [x1, y1] = toScreen(cam, q.X + PITCH_X / 2, q.Y + 8);
      ctx.globalAlpha = a;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    ctx.restore();
  };
  return (
    <AirStage v={v} bloom={0.22}>
      <Paint.FolkCanvas draw={warm} />
      <CashCanvas cam={cam} get={get} bundles={plan.draws} />
      <WorldSvg cam={cam}>
        <BurdenDefs uid="fb" />
        <BurdenPlate uid="fb" x={ALLIES.cx} y={PLATE_TOP} name="Allies" num="200,000+" o={1} lift={0} dim={dim} />
        <BurdenPlate uid="fb" x={US.cx} y={PLATE_TOP} name="U.S." num="700,000" o={1} lift={0} dim={dim} />
        {footU > 0 ? <line x1={US.cx - footHalf} x2={US.cx + footHalf} y1={footY} y2={footY} stroke={COL.creamLo} strokeOpacity={0.5} strokeWidth={4.5} strokeLinecap="round" /> : null}
        <CashPlate uid="fb" x={US.cx} y={plateY} name="Paid by allies" n={nCount} plus={plus} o={pe.o} lift={pe.lift} size={PLATE_SIZE} />
      </WorldSvg>
    </AirStage>
  );
};

export default FiftyBillion;
