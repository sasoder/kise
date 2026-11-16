// ---------------------------------------------------------------------------
// TooBigToFit (rsi-stupidest-species, cut 80). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 78 frames.
// REVISION 1 (user: "more dynamic with the camera", "looks a bit unfinished"). Cut H's setting: the tiled sand floor,
// the horizon haze and the misty teal air (AirStage, palette A, fog by depth, motes), the clip's shared BRAIN and
// PELVIS from ./brainShared (W3, read-only); the pelvis stands on a low stone plinth (cut H's MAT.stone block).
//
// CHECK LINE: "A bigger brain would not fit through the birth canal: the pelvis caps how big it can grow."
//
// THE LINE: "become so big that it no longer fits through the birth canal. And"
// WORD -> FRAME: become 6 · so 10 · big 17 · that 23 · it 31 · no 35 · longer 40 · fits 49 · through 57 · the 61 ·
//   birth 63 · canal 67 · And 76
// DURATION: the slot 80.122 -> 83.375 s = 3.253 s x 23.976 = 78 frames (f0..f77; sequence frames 1921-1999).
//
// THE MOTION: one continuous fall. f0: close on the small brain (448 px) hanging above the dark opening, already
// sinking and swelling. f0-35 ("become so big"): it falls straight down onto the opening while it swells past the
// inlet's width. CONTACT f35 ("no"): it lands in the opening, its two ends overhanging the rim; a clear squash about
// the rim row (peak sx 1.065 / sy 0.915 at f38), the bone gives 2 units, a wobble (rot -9 +-4 deg, damped), the near
// rim lights cream. f43-49: it lifts a little (wind-up) and on "fits" (f49) pushes again (sy 0.92 at f52): it fails
// and settles back. f58-77: jammed, a living hold (a slow breath of the squash).
// CAMERA: opens close (k 1.62) and trucked right, follows the fall down (tilt and track, k -> 1.3 at contact), a jolt
// on the impact (7 px, damped, seek-safe) and a quick push-in to k 1.55-1.6 through the second push (smaller jolt on
// f49), then eases back to the resolved frame (k 1.12-1.13 from f66): the pelvis on its plinth, the brain ~1.27x the
// inlet's width (503 vs 397 px), a dark crescent of the opening in front of its lower edge; rim row y ~904.
// No labels. No orange (orange = intelligence in this clip; the brain stays pink, glow 0: I2 opens on the same brain).
//
// VIEW AND DRAW ORDER: the pelvis seen from above and in front: squashed to TILT 0.68 about the inlet, so the inlet
// is a flat ellipse (upper arc the far rim, lower arc the near rim). Back to front: floor, haze, the plinth and its
// shadows; the bone's thickness (the same pelvis, darker, 20 units lower); the hole going down (dark depth + the lit
// far inner wall, seen only through the inlet); the pelvis in cream-ivory (fog 0.06); the inlet's lit edges; the
// brain's soft shadow on the bone; the brain (tilted ~-9 deg, 22 units left of the axis) with a soft form light
// (cream upper left, warm shade lower right), clipped below the rim row beside the opening and below the near arc;
// the cream contact light on the near rim (bone only).
//
// SOURCES: none (no figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, makeCamera, mixHex, pchip, swayCam, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Brain, Pelvis, brainBox, pelvisInlet } from "./brainShared";

export const FPS = 24000 / 1001;
export const DURATION = 78;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const n2 = (v: number) => v.toFixed(2);
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const hump = (f: number, a: number, b: number) => Math.sin(Math.PI * c01((f - a) / (b - a)));

// ---- the world: X across (0 = the inlet's axis), Y height with the floor Y = 0 (up -), Z depth; the pelvis and the
// brain on the front plane Z = 0, drawn in world units under the camera (cut H's convention) --------------------------
/** the low stone plinth under the pelvis */
export const PLINTH = { top: -120, hw: 330, z: 110 };
/** the pelvis: width and TILT (squashed vertically about the inlet centre: seen from above and in front, the inlet a
 *  flat ellipse whose upper arc is the far rim and lower arc the near rim); it stands on the plinth's top */
export const PELVIS_W = 800;
export const TILT = 0.68;
const INLET = pelvisInlet(PELVIS_W);
export const INLET_R = INLET.r;
export const INLET_RY = INLET.r * TILT;
/** the inlet centre (world): the pelvis's lowest point (0.44 width below it, tilted) on the plinth top */
export const PELVIS_C: [number, number] = [0, PLINTH.top - 0.44 * PELVIS_W * TILT];
/** the brain: width at swell 0 */
export const BRAIN_SIZE = 270;
/** a little left of the inlet's axis, so its low cerebellum (at the back, the right) stays over the opening */
const BX = PELVIS_C[0] - 22;
/** the brain's anchor (bottom) at f0 and at contact */
const Y0 = PELVIS_C[1] - 190;
const YC = PELVIS_C[1] + 46;
/** the squash pivots about the rim row (the inlet's centre row: where its sides bear) */
const PIVOT_Y = PELVIS_C[1];
/** a small tilt (degrees, - = back end up) so the cerebellum and stem stay clear of the near rim */
const BRAIN_ROT = -9;
/** the frames */
export const F_CONTACT = 35;
export const F_PRESS2 = 49;
/** the bone's thickness under its top face (world units) */
const THICK = 20;

// ---- the camera: close on the small brain, follow it down, a quick push-in on the impact with a small jolt, hold
// close through the second push, then ease back to the resolved frame (pelvis on its plinth, the jammed brain) ------
export const DEPTH: DepthOpts = { eyeY: -640, dRef: 2200, kRef: 1, dolly: 0.4 };
const camKeys = makeCamera(
  [
    { f: 0, k: 1.62, wx: 40, wy: -549, sy: 752 },
    { f: 17, k: 1.5, wx: 14, wy: -446, sy: 900 },
    { f: 30, k: 1.34, wx: -6, wy: PELVIS_C[1], sy: 950 },
    { f: 35, k: 1.3, wx: -4, wy: PELVIS_C[1], sy: 945 },
    { f: 42, k: 1.55, wx: 0, wy: PELVIS_C[1], sy: 960 },
    { f: 53, k: 1.6, wx: 0, wy: PELVIS_C[1], sy: 955 },
    { f: 66, k: 1.12, wx: 0, wy: PELVIS_C[1], sy: 900 },
    { f: DURATION, k: 1.13, wx: 0, wy: PELVIS_C[1], sy: 900 },
  ],
  false,
);
/** the camera's jolt on each impact (screen px, damped, seek-safe) */
const jolt = (f: number) => {
  const j = (t: number, a: number) => (t <= 0 ? 0 : a * Math.exp(-t / 3) * Math.sin(1.7 * t));
  return j(f - F_CONTACT, 7) + j(f - F_PRESS2, 3.5);
};
export const camAt = (f: number): Cam => {
  const c = camKeys(f);
  return { ...c, cy: c.cy - jolt(f) / c.k };
};
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
/** the press now: the impact, a wind-up (it lifts a little) and the second push on "fits" that fails, a settled
 *  rest press, a slow breath */
export const pressAt = (f: number) => {
  const p1 = pulse(f - F_CONTACT);
  const wind = -0.4 * hump(f, 43, F_PRESS2);
  const p2 = 0.8 * pulse(f - F_PRESS2, 6.5, 9);
  const rest = f > F_CONTACT ? 0.32 * (1 - Math.exp(-(f - F_CONTACT) / 6)) : 0;
  const breath = f > 58 ? 0.13 * Math.sin((2 * Math.PI * (f - 58)) / 28) * Math.min(1, (f - 58) / 8) : 0;
  return p1 + wind + p2 + rest + breath;
};
/** the brain's anchor (bottom centre, world y) */
export const brainY = (f: number) => {
  if (f <= F_CONTACT) {
    const t = f / F_CONTACT;
    return Y0 + (YC - Y0) * (0.8 * t + 0.2 * t * t);
  }
  return YC + 5 * pressAt(f);
};
export const brainState = (f: number) => {
  const press = Math.max(-0.4, pressAt(f));
  const sw = SWELL(f);
  const wob = (t: number, a: number, w: number, tau: number) => (t <= 0 ? 0 : a * Math.exp(-t / tau) * Math.sin(w * t));
  const rot = BRAIN_ROT + wob(f - F_CONTACT, 4, 0.75, 7) + wob(f - F_PRESS2, 2.5, 0.8, 6);
  return { y: brainY(f), swell: sw, sy: 1 - 0.085 * press, sx: 1 + 0.065 * press, press, rot };
};
/** the brain's box in world units (after the squash about PIVOT_Y; rotation ignored) */
export const brainWorldBox = (f: number) => {
  const s = brainState(f);
  const b = brainBox(BRAIN_SIZE, s.swell);
  const sqY = (y: number) => PIVOT_Y + (y - PIVOT_Y) * s.sy;
  return { left: BX - (b.w / 2) * s.sx, right: BX + (b.w / 2) * s.sx, top: sqY(s.y + b.top), bottom: sqY(s.y), w: b.w * s.sx };
};
export const camOf = (f: number) => swayCam(camAt(f), f);

// ---- the contact rim: a cream light on the near rim's edge where the brain bears -----------------------------------
const rimAmt = (f: number) => {
  const t1 = f - F_CONTACT;
  const t2 = f - F_PRESS2;
  const flash = (t: number, a: number) => (t <= 0 ? 0 : a * Math.min(1, t / 2.5) * Math.exp(-Math.max(0, t - 2.5) / 6));
  const floor = t1 > 0 ? 0.28 * Math.min(1, t1 / 8) : 0;
  return Math.min(1, Math.max(flash(t1, 1), flash(t2, 0.7), floor));
};
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
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, fogBy: "depth" });
  const s = brainState(frame);
  // the bone gives a hair under each press (one frame late)
  const give = 2 * Math.max(0, pressAt(frame - 1));
  const pc: [number, number] = [PELVIS_C[0], PELVIS_C[1] + give];
  const tiltT = `translate(0 ${n2(pc[1])}) scale(1 ${TILT}) translate(0 ${n2(-pc[1])})`;
  const pFog = { rgb: MAT.ground.mid, amount: 0.06 };
  const sqT = `translate(${n2(BX)} ${n2(PIVOT_Y)}) scale(${s.sx.toFixed(5)} ${s.sy.toFixed(5)}) translate(${n2(-BX)} ${n2(-PIVOT_Y)})`;
  const bb = brainWorldBox(frame);
  const ra = rimAmt(frame);
  const R = INLET_R;
  const RY = INLET_RY;
  const air = A.airHex(0, 300);
  const wallLit = mixHex("#B8A98A", air, 0.15);
  const wallDark = mixHex("#4A4033", air, 0.15);
  const deep = mixHex("#1B1D1A", air, 0.2);
  const brainEl = (uid: string) => <Brain x={BX} y={s.y} size={BRAIN_SIZE} swell={s.swell} uid={uid} unitPx={cam.k} rot={s.rot} />;
  return (
    <AirStage v={A.v} bloom={0.22} motes={0.8}>
      <WorldSvg cam={cam}>
        <defs>
          <mask id="pmask" maskUnits="userSpaceOnUse" x={-1500} y={-1500} width={3000} height={3000}>
            <rect x={-1500} y={-1500} width={3000} height={3000} fill="black" />
            <g transform={tiltT}>
              <Pelvis x={pc[0]} y={pc[1]} size={PELVIS_W} uid="pm" />
            </g>
          </mask>
          <mask id="bmask" maskUnits="userSpaceOnUse" x={-1500} y={-1500} width={3000} height={3000}>
            <rect x={-1500} y={-1500} width={3000} height={3000} fill="black" />
            <g transform={sqT}>{brainEl("bm")}</g>
          </mask>
          <linearGradient id="bform" gradientUnits="userSpaceOnUse" x1={n2(bb.left)} y1={n2(bb.top)} x2={n2(bb.right)} y2={n2(bb.bottom)}>
            <stop offset="0" stopColor="#FFF4E4" stopOpacity={0.34} />
            <stop offset="0.42" stopColor="#FFF4E4" stopOpacity={0} />
            <stop offset="0.7" stopColor="#3A2218" stopOpacity={0} />
            <stop offset="1" stopColor="#3A2218" stopOpacity={0.36} />
          </linearGradient>
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
          <linearGradient id="wallg" gradientUnits="userSpaceOnUse" x1="0" y1={n2(pc[1] - RY)} x2="0" y2={n2(pc[1] + 0.25 * RY)}>
            <stop offset="0" stopColor={wallLit} />
            <stop offset="0.5" stopColor={wallDark} />
            <stop offset="1" stopColor={deep} />
          </linearGradient>
          <linearGradient id="wallx" gradientUnits="userSpaceOnUse" x1={n2(pc[0] - R)} y1="0" x2={n2(pc[0] + R)} y2="0">
            <stop offset="0" stopColor="#22180F" stopOpacity={0.35} />
            <stop offset="0.45" stopColor="#22180F" stopOpacity={0} />
            <stop offset="1" stopColor="#22180F" stopOpacity={0.15} />
          </linearGradient>
          <radialGradient id="deepg" gradientUnits="userSpaceOnUse" cx={pc[0]} cy={pc[1] + RY * 0.4} r={R}>
            <stop offset="0" stopColor={deep} />
            <stop offset="1" stopColor={mixHex(deep, wallDark, 0.5)} />
          </radialGradient>
          <filter id="rimblur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={2.4} />
          </filter>
          <filter id="edgeblur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={1.4} />
          </filter>
        </defs>
        {/* the setting: cut H's floor and air, a low stone plinth under the pelvis */}
        <AirFloor A={A} x0={-3600} x1={3600} z0={-3000} z1={6000} mat={MAT.ground} course={190} />
        <AirHorizonHazeW A={A} id="haze" />
        <AirShadow A={A} X={0} Z={0} w={PLINTH.hw * 1.12} d={PLINTH.z * 1.3} amt={0.85} uid="plS" />
        <AirBox A={A} X0={-PLINTH.hw} X1={PLINTH.hw} Y0={PLINTH.top} Y1={0} Z0={-PLINTH.z} Z1={PLINTH.z} mat={MAT.stone} uid="pl" />
        <AirShadow A={A} X={0} Z={0} Y={PLINTH.top} w={PELVIS_W * 0.4} d={PLINTH.z * 0.55} amt={0.8} uid="pvS" />
        {/* the bone's thickness: the same pelvis, darker, a little lower (its lower edges show under the bone) */}
        <g transform={`translate(0 ${THICK})`}>
          <g transform={tiltT}>
            <Pelvis x={pc[0]} y={pc[1]} size={PELVIS_W} uid="pt" unitPx={cam.k} fog={{ rgb: "#6E5F4B", amount: 0.5 }} />
          </g>
        </g>
        {/* the hole going down, behind the bone (it shows only through the inlet): dark depth, the far inner wall lit
            from the upper left and shaded at its sides */}
        <g clipPath="url(#hole)">
          <path d={ellD(pc[0], pc[1], R + 2, RY + 2)} fill="url(#deepg)" />
          <path d={wallD(pc[0], pc[1], R + 2, RY + 2, RY * 0.95)} fill="url(#wallg)" />
          <path d={wallD(pc[0], pc[1], R + 2, RY + 2, RY * 0.95)} fill="url(#wallx)" />
        </g>
        <g transform={tiltT}>
          <Pelvis x={pc[0]} y={pc[1]} size={PELVIS_W} uid="pb" unitPx={cam.k} fog={pFog} />
        </g>
        {/* the inlet's lit edges: the near rim's top edge and the far rim's inner lip (light from the upper left) */}
        <g mask="url(#pmask)" filter="url(#edgeblur)">
          <path d={ellArcD(pc[0], pc[1], R + 4, RY + 4, 30, 150)} fill="none" stroke="#FBF4E6" strokeWidth={5} strokeOpacity={0.55} strokeLinecap="round" />
        </g>
        <g clipPath="url(#hole)" filter="url(#edgeblur)">
          <path d={ellArcD(pc[0], pc[1], R - 2, RY - 2, 195, 300)} fill="none" stroke="#FBF4E6" strokeWidth={4} strokeOpacity={0.4} strokeLinecap="round" />
        </g>
        {/* the brain's soft shadow on the bone behind it */}
        <g mask="url(#pmask)">
          <ellipse cx={(bb.left + bb.right) / 2 + 16} cy={(bb.top + bb.bottom) / 2 + 26} rx={bb.w * 0.56} ry={(bb.bottom - bb.top) * 0.6} fill="url(#bshadow)" />
        </g>
        {/* the brain (the clean module drawing) with a soft form light over it; hidden below the near arc (in the
            canal) and below the rim row beside the opening (in the bone) */}
        <g clipPath="url(#vis)">
          <g transform={sqT}>{brainEl("br")}</g>
          <rect x={n2(bb.left - 60)} y={n2(bb.top - 60)} width={n2(bb.w + 120)} height={n2(bb.bottom - bb.top + 120)} fill="url(#bform)" mask="url(#bmask)" />
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
