// ---------------------------------------------------------------------------
// TooBigToFit (rsi-stupidest-species, cut 80). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 78 frames.
// Inside the misty teal air (AirStage, palette A, no floor: the air darkens to the ground below), the clip's shared
// BRAIN and PELVIS from ./brainShared (W3, read-only).
//
// CHECK LINE: "A bigger brain would not fit through the birth canal: the pelvis caps how big it can grow."
//
// THE LINE: "become so big that it no longer fits through the birth canal. And"
// WORD -> FRAME: become 6 · so 10 · big 17 · that 23 · it 31 · no 35 · longer 40 · fits 49 · through 57 · the 61 ·
//   birth 63 · canal 67 · And 76
// DURATION: the slot 80.122 -> 83.375 s = 3.253 s x 23.976 = 78 frames (f0..f77; sequence frames 1921-1999).
//
// THE MOTION: one continuous fall. f0: the small brain (276 px on screen, narrower than the 352 px inlet: it would
// drop through) hangs above the ring, already sinking and swelling. f0-35 ("become so big"): it falls straight down
// onto the opening while it swells past the inlet's width (wider by f17 "big"). CONTACT f35 ("no"): it lands in the
// opening, its two ends overhanging the rim left and right, cerebellum and stem over the dark hole; FIRST REACTION
// f36: a slight squash about the rim row (at most sx 1.03 / sy 0.97), the bone gives 2 px, the near rim's edge lights
// cream (peak f37-38) and fades to a faint rim. f48-55 ("fits"): a second, smaller press. f57-77: jammed, a living
// hold (a slow breath of the squash). At the end the brain is ~1.26x the inlet's width (517 vs 412 px) and a dark
// crescent of the opening shows in front of its lower edge, so the eye compares the two.
// Camera: tilts down with the fall and pushes in (k 1.0 -> 1.17), one lobe; the rim row ends at y ~900.
// No labels. No orange (orange = intelligence in this clip; the brain stays pink, glow 0: I2 opens on the same brain).
//
// VIEW AND DRAW ORDER (director, rev 3): the pelvis seen from above and in front: squashed to TILT 0.68 about the
// inlet, so the inlet is a flat ellipse (upper arc the far rim, lower arc the near rim) and the brain falls straight
// down into it. Back to front: the hole going down (dark depth + the lit far inner wall, behind the bone, seen only
// through the inlet); the whole pelvis in the module's cream-ivory (fog 0.06); the brain's soft shadow on the bone;
// the brain, the clean module drawing (tilted -9 deg so its cerebellum and stem stay over the opening, 22 px left of
// the axis), clipped only below the rim row beside the opening and below the near arc (nothing shows through the
// pubic arch or the obturator holes); the cream contact light on the near rim (bone only).
//
// SOURCES: none (no figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, MAT, WorldSvg, airWorldOf, makeCamera, mixHex, pchip, swayCam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Brain, Pelvis, brainBox, pelvisInlet } from "./brainShared";

export const FPS = 24000 / 1001;
export const DURATION = 78;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- the world (world units = screen px at k 1) --------------------------------------------------------------------
/** the pelvis: inlet centre and width; TILT squashes it vertically about the inlet centre so the ring reads as seen
 *  a little from above (the inlet an ellipse: its upper arc the far rim, its lower arc the near lip) */
export const PELVIS_C: [number, number] = [540, 900];
export const PELVIS_W = 800;
export const TILT = 0.68;
const INLET = pelvisInlet(PELVIS_W);
/** the inlet on screen-world: half-width R, half-height RY */
export const INLET_R = INLET.r;
export const INLET_RY = INLET.r * TILT;
/** the brain: width at swell 0 */
export const BRAIN_SIZE = 270;
/** the brain sits a little left of the inlet's axis, so its low cerebellum (at the back, the right) stays over the opening */
const BX = PELVIS_C[0] - 22;
/** the brain's anchor (bottom) at f0 and at contact (its sides on the rim, its stem tucked behind the near lip) */
const Y0 = PELVIS_C[1] - 190;
const YC = PELVIS_C[1] + 46;
/** the squash pivots about the rim row (the inlet's centre row: where its sides bear) */
const PIVOT_Y = PELVIS_C[1];
/** a small tilt (degrees, - = back end up) so the cerebellum and stem stay clear of the near rim */
const BRAIN_ROT = -9;
/** the frames */
export const F_CONTACT = 35;
const F_PRESS2 = 48;

// the air: horizon high above the frame, so the whole frame is the air sinking toward the ground
const DEPTH: DepthOpts = { eyeY: 200, dRef: 1800, kRef: 1, dolly: 0.5 };
const camAt = makeCamera(
  [
    { f: 0, k: 1.0, wx: 540, wy: 760, sy: 790 },
    { f: 46, k: 1.15, wx: 540, wy: 900, sy: 898 },
    { f: DURATION, k: 1.17, wx: 540, wy: 900, sy: 900 },
  ],
  false,
);
const REST = swayCam(camAt(0), 0);

// ---- the brain's motion (pure functions of the frame, exported for the checks) -------------------------------------
const SWELL = pchip(
  [
    [0, 0.04],
    [6, 0.12],
    [20, 0.62],
    [35, 0.9],
    [52, 0.96],
    [77, 0.99],
  ],
  false,
);
/** a damped press pulse: 0 at t <= 0, peak ~1 near t = 3.6, a small rebound below 0 near t = 13 */
const pulse = (t: number, tau = 7.5, per = 10) => {
  if (t <= 0) return 0;
  return (Math.exp(-t / tau) * Math.sin((Math.PI * t) / per)) / 0.58;
};
/** the press now: the contact press, the second press on "fits", a settled rest press, a slow breath */
export const pressAt = (f: number) => {
  const p1 = pulse(f - F_CONTACT);
  const p2 = 0.45 * pulse(f - F_PRESS2, 6.5, 9);
  const rest = f > F_CONTACT ? 0.32 * (1 - Math.exp(-(f - F_CONTACT) / 6)) : 0;
  const breath = f > 56 ? 0.13 * Math.sin((2 * Math.PI * (f - 56)) / 28) * Math.min(1, (f - 56) / 8) : 0;
  return p1 + p2 + rest + breath;
};
/** the brain's anchor (bottom centre, world y) */
export const brainY = (f: number) => {
  if (f <= F_CONTACT) {
    const t = f / F_CONTACT;
    return Y0 + (YC - Y0) * (0.8 * t + 0.2 * t * t);
  }
  // the bottom pushes a few px further into the opening while it squashes, then rides back
  return YC + 5 * pressAt(f);
};
export const brainState = (f: number) => {
  const press = Math.max(-0.2, pressAt(f));
  const sw = SWELL(f);
  return { y: brainY(f), swell: sw, sy: 1 - 0.025 * press, sx: 1 + 0.025 * press, press };
};
/** the brain's box in world units (after the squash about PIVOT_Y) */
export const brainWorldBox = (f: number) => {
  const s = brainState(f);
  const b = brainBox(BRAIN_SIZE, s.swell);
  const sqY = (y: number) => PIVOT_Y + (y - PIVOT_Y) * s.sy;
  return { left: BX - (b.w / 2) * s.sx, right: BX + (b.w / 2) * s.sx, top: sqY(s.y + b.top), bottom: sqY(s.y), w: b.w * s.sx };
};
export const camOf = (f: number) => swayCam(camAt(f), f);

// ---- the contact rim: a cream light on the inlet's edge where the brain bears -------------------------------------
const rimAmt = (f: number) => {
  const t1 = f - F_CONTACT;
  const t2 = f - F_PRESS2;
  const flash = (t: number, a: number) => (t <= 0 ? 0 : a * Math.min(1, t / 2.5) * Math.exp(-Math.max(0, t - 2.5) / 6));
  const floor = t1 > 0 ? 0.28 * Math.min(1, t1 / 8) : 0;
  return Math.min(1, Math.max(flash(t1, 1), flash(t2, 0.5), floor));
};
const n2 = (v: number) => v.toFixed(2);
/** an arc of the (tilted) inlet ellipse, a0 -> a1 degrees (0 = right, 90 = down) */
const ellArcD = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number) => {
  const p = (a: number) => `${n2(cx + rx * Math.cos((a * Math.PI) / 180))},${n2(cy + ry * Math.sin((a * Math.PI) / 180))}`;
  return `M${p(a0)}A${n2(rx)},${n2(ry)} 0 0 1 ${p(a1)}`;
};
/** where the brain may show (world units): everything above the rim row, plus the inlet's opening down to its near
 *  (lower) arc. Below the near arc the brain is inside the canal, and below the rim row beside the opening it would be
 *  inside the bone: both hidden, so nothing shows through the pubic arch or the obturator holes */
const visibleD = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n2(cx - 3000)},${n2(cy - 3000)}H${n2(cx + 3000)}V${n2(cy)}H${n2(cx + rx)}A${n2(rx)},${n2(ry)} 0 0 1 ${n2(cx - rx)},${n2(cy)}H${n2(cx - 3000)}Z`;
/** the inlet's ellipse (world units) */
const ellD = (cx: number, cy: number, rx: number, ry: number) => `M${n2(cx + rx)},${n2(cy)}A${n2(rx)},${n2(ry)} 0 1 1 ${n2(cx - rx)},${n2(cy)}A${n2(rx)},${n2(ry)} 0 1 1 ${n2(cx + rx)},${n2(cy)}Z`;
/** the far inner wall: the band under the inlet's upper arc, to the same arc dropped by `drop` */
const wallD = (cx: number, cy: number, rx: number, ry: number, drop: number) =>
  `M${n2(cx - rx)},${n2(cy)}A${n2(rx)},${n2(ry)} 0 0 1 ${n2(cx + rx)},${n2(cy)}L${n2(cx + rx)},${n2(cy + drop)}A${n2(rx)},${n2(ry)} 0 0 0 ${n2(cx - rx)},${n2(cy + drop)}Z`;

const TooBigToFit: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame });
  const s = brainState(frame);
  // the bone gives a hair under the press (one frame late)
  const give = 2 * Math.max(0, pressAt(frame - 1));
  const pc: [number, number] = [PELVIS_C[0], PELVIS_C[1] + give];
  const tiltT = `translate(0 ${n2(pc[1])}) scale(1 ${TILT}) translate(0 ${n2(-pc[1])})`;
  // the pelvis recedes a touch into the air so the pink brain separates from the cream bone
  const pFog = { rgb: MAT.ground.mid, amount: 0.06 };
  const sqT = `translate(${n2(BX)} ${n2(PIVOT_Y)}) scale(${s.sx.toFixed(5)} ${s.sy.toFixed(5)}) translate(${n2(-BX)} ${n2(-PIVOT_Y)})`;
  const bb = brainWorldBox(frame);
  const ra = rimAmt(frame);
  const R = INLET_R;
  const RY = INLET_RY;
  const wallLit = mixHex("#8C806A", A.airHex(900, 0), 0.25);
  const wallDark = mixHex("#3A3229", A.airHex(900, 0), 0.2);
  const deep = mixHex("#1B1D1A", A.airHex(900, 0), 0.25);
  return (
    <AirStage v={A.v} bloom={0.22} motes={0.6}>
      <WorldSvg cam={cam}>
        <defs>
          <mask id="pmask" maskUnits="userSpaceOnUse" x={-500} y={-500} width={2100} height={2400}>
            <rect x={-500} y={-500} width={2100} height={2400} fill="black" />
            <g transform={tiltT}>
              <Pelvis x={pc[0]} y={pc[1]} size={PELVIS_W} uid="pm" />
            </g>
          </mask>
          <radialGradient id="bshadow">
            <stop offset="0" stopColor="#22180F" stopOpacity={0.42} />
            <stop offset="0.55" stopColor="#22180F" stopOpacity={0.22} />
            <stop offset="1" stopColor="#22180F" stopOpacity={0} />
          </radialGradient>
          <clipPath id="vis" clipPathUnits="userSpaceOnUse">
            <path d={visibleD(pc[0], pc[1], R, RY)} />
          </clipPath>
          <clipPath id="hole" clipPathUnits="userSpaceOnUse">
            <path d={ellD(pc[0], pc[1], R, RY)} />
          </clipPath>
          <linearGradient id="wallg" gradientUnits="userSpaceOnUse" x1="0" y1={n2(pc[1] - RY)} x2="0" y2={n2(pc[1] + 0.2 * RY)}>
            <stop offset="0" stopColor={wallLit} />
            <stop offset="0.55" stopColor={wallDark} />
            <stop offset="1" stopColor={deep} />
          </linearGradient>
          <radialGradient id="deepg" gradientUnits="userSpaceOnUse" cx={pc[0]} cy={pc[1] + RY * 0.4} r={R}>
            <stop offset="0" stopColor={deep} />
            <stop offset="1" stopColor={mixHex(deep, wallDark, 0.5)} />
          </radialGradient>
          <filter id="rimblur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={2.4} />
          </filter>
        </defs>
        {/* the hole going down, behind the bone (it shows only through the inlet): dark depth and the far inner wall */}
        <g clipPath="url(#hole)">
          <path d={ellD(pc[0], pc[1], R + 2, RY + 2)} fill="url(#deepg)" />
          <path d={wallD(pc[0], pc[1], R + 2, RY + 2, RY * 0.95)} fill="url(#wallg)" />
        </g>
        <g transform={tiltT}>
          <Pelvis x={pc[0]} y={pc[1]} size={PELVIS_W} uid="pb" unitPx={cam.k} fog={pFog} />
        </g>
        {/* the brain's soft shadow on the bone behind it (light from the upper left) */}
        <g mask="url(#pmask)">
          <ellipse cx={(bb.left + bb.right) / 2 + 16} cy={(bb.top + bb.bottom) / 2 + 26} rx={bb.w * 0.56} ry={(bb.bottom - bb.top) * 0.6} fill="url(#bshadow)" />
        </g>
        {/* the brain: hidden below the near arc (in the canal) and below the rim row beside the opening (in the bone):
            the near half of the ring crosses its lower part */}
        <g clipPath="url(#vis)">
          <g transform={sqT}>
            <Brain x={BX} y={s.y} size={BRAIN_SIZE} swell={s.swell} uid="br" unitPx={cam.k} rot={BRAIN_ROT} />
          </g>
        </g>
        {/* the contact rim: the near rim's inner edge lights where the brain bears on it (on the bone only) */}
        {ra > 0.005 ? (
          <g mask="url(#pmask)">
            <g opacity={ra} filter="url(#rimblur)">
              <path d={ellArcD(pc[0], pc[1], R + 3, RY + 3, 0, 52)} fill="none" stroke="#F6EEDC" strokeWidth={9} strokeLinecap="round" />
              <path d={ellArcD(pc[0], pc[1], R + 3, RY + 3, 128, 180)} fill="none" stroke="#F6EEDC" strokeWidth={9} strokeLinecap="round" />
            </g>
          </g>
        ) : null}
      </WorldSvg>
    </AirStage>
  );
};

export default TooBigToFit;
