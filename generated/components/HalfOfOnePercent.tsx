import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { NumeralLabel } from "./incaShared";
import { CLIP_G0, DURATIONS, makeTrack, smoothstep, swayCam, type Cam, type P2 } from "./tlaxShared";
import { D_END, HostScene, bannerSize } from "./FlockingToHisBanner";
import { HEART, N_HOST, SLOT_X, SLOT_Y, makeMoveCamera, screenPt, type Creep, type Move } from "./tlaxHost";

// ---------------------------------------------------------------------------
// HalfOfOnePercent. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Tlaxcalans_thought_they_used_Cortes", cut E, on the Tlaxcala world
// with the allied host (tlaxHost; FlockingToHisBanner's HostScene). The line:
// "the conquistadors were maybe one half of one percent in raw numbers of that
// force."
//
// TIMELINE: in-point 59.799 s = f0; f = round((t - 59.799) * 24): the f0 ·
// conquistadors f3 · were f17 · maybe f26 · one f36 · half f58 · of one f68 ·
// percent f81 · in raw f91 · numbers f101 · of f110 · that f120 · force f125.
// DURATION: "the" 59.799 -> "force" ends 65.439: round(5.640 * 24) = 135, + the
// 16-frame house tail = 151 (DURATIONS.E). Clip clock G = 686 + f.
// JOIN: f0 = D f248 pixel for pixel (D_END: camera, mosaic rung, banner and
// D's labels (gone) on D's clock; the same HostScene tree).
//
// DWARKESH MAP STYLE, opaque 1080x1920, 24 fps. Orange = the Aztecs' enemies
// (the allied host); the 90 Spaniards are cream. The only type: "0.5%".
//
// THE GESTURES, each with its word (frames at 24 fps):
//   1. "the conquistadors" f0-40: one plunge (ease in and out) from D's wide
//      (k 6.2) onto the Spaniards (k 80, landing f40): their body ~120 px
//      across, dots 4 px, the banner ~120 px tall above it. On "conquistadors"
//      (f3-17) the spotlight: the map base dims to 0.7, the mosaic and the
//      allies to 0.45 (one eased layer); the 90 and the banner stay full. (D's
//      labels left at its pull-back: E opens clean.) The last columns (the
//      Totonacs, Toluca, Malinalco, Cuauhnahuac, Tlaxcala's tail) march into
//      the host's outer ring (all in place by f66).
//   2. "were maybe one half of one percent" f42-90: the hold, creeping in
//      (k 80 -> 84); "0.5%" (IM Fell English, 104 px, cream, full rung) slides
//      up above the banner from f70 (lands ~f81).
//   3. "in raw numbers of that force" f91-122: the pull-out to the whole force
//      (k 84 -> 36.1, landing f122, 3 f before "force"): the host ~70 % of the
//      frame width, the Spaniards a ~45 px speck at its heart; the dim lifts as
//      it pulls out (f95-111). Creep to f150.
// Nothing else.
//
// SOURCES: as FlockingToHisBanner / SP/FACTS.md (H): 900 Spaniards in a force
// of 180,000, exactly 1 : 200 = 0.5 %, 1 dot = 10 men.
//
// CHECKS (SP/h): camScan probe grid max 118 px/f (f18, the plunge's corners),
// max |dv| 9.0 px/f^2 (the plunge), no spikes; the pull-out <= 4.9 px/f^2; the
// heart <= 8.4 px/f. Every visible dot <= 43 px/f of its own motion (cap 45).
// The host level 1.07-1.13 texels/px at k 80-84; valley3 1.18 at k 36.
// Join D f248 -> E f0: 0 px (SP/h/join).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = DURATIONS.E; // 151
export const LAST = DURATION - 1;
/** the clip clock: G = G0 + f (E f0 = D f248 = G 686) */
export const G0 = CLIP_G0.E;
if (G0 !== D_END.g) throw new Error("E f0's clip clock must be D_END.g");
if (D_END.cortes.exit < 1 || D_END.tenoch.exit < 1) throw new Error("D must end with its labels gone");

/** word onsets, f = round((t - 59.799) * 24) (SP/frames.txt) */
export const W = {
  the: 0,
  conquistadors: 3,
  were: 17,
  maybe: 26,
  one: 36,
  half: 58,
  ofOne: 68,
  percent: 81,
  inRaw: 91,
  numbers: 101,
  of: 110,
  that: 120,
  force: 125,
};

// ---------------------------------------------------------------------------
// THE CAMERA (anchored on the banner's foot; f0 = D_END.cam exactly)
// ---------------------------------------------------------------------------
const D_END_CAM: Cam = D_END.cam;
/** the whole host (its slots' box) and its centre */
export const HOST_BB = (() => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i < N_HOST; i++) {
    x0 = Math.min(x0, SLOT_X[i]);
    x1 = Math.max(x1, SLOT_X[i]);
    y0 = Math.min(y0, SLOT_Y[i]);
    y1 = Math.max(y1, SLOT_Y[i]);
  }
  return { x0, x1, y0, y1, c: [(x0 + x1) / 2, (y0 + y1) / 2] as P2 };
})();
/** the close framing on the Spaniards (dots >= 4 px, their body >= 120 px) */
export const K_CLOSE = 80;
/** the whole force: the host ~70 % of the frame width, the Spaniards a ~45 px speck */
export const K_FORCE = (0.7 * 1080) / (HOST_BB.x1 - HOST_BB.x0);
const forceScreen = (k: number): P2 => [540 + (HEART[0] - HOST_BB.c[0]) * k, 835 + (HEART[1] - HOST_BB.c[1]) * k];
export const MOVES: Move[] = [
  { win: [-2, 40], taper: 1, to: { k: K_CLOSE, s: [540, 835] } }, // "the conquistadors": one plunge onto the Spaniards
  { win: [42, 90], taper: 1, to: { k: K_CLOSE * 1.05, s: [540, 842] } }, // "were maybe one half of one percent": the hold, creeping in
  { win: [91, 122], taper: 1, to: { k: K_FORCE, s: forceScreen(K_FORCE) } }, // "in raw numbers of that force": the pull-out to the whole force
];
export const CREEPS: Creep[] = [
  { win: [20, 64], dlnk: 0.01 },
  { win: [110, 220], dlnk: -0.03, dsy: -2 },
];
const camRun = makeMoveCamera(HEART, { k: D_END_CAM.k, s: screenPt(HEART, D_END_CAM) }, MOVES, CREEPS, makeTrack);
/** the authored camera (no sway); f0 = D's last camera exactly */
export const camAt = (f: number): Cam => (f === 0 ? { ...D_END_CAM } : camRun(f));
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

/** the spotlight: on "conquistadors" (f3, 14 f) everything but the Spaniards and the banner dims; it lifts as the camera pulls out (f95, 16 f) */
export const shadeAt = (f: number) => smoothstep((f - W.conquistadors) / 14) * (1 - smoothstep((f - 95) / 16));
/** "0.5%": above the banner's head (screen px from its foot) */
const pctDy = (k: number) => -(bannerSize(k) + 48);
export const PCT_F0 = 70;

const HalfOfOnePercent: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const g = G0 + frame;
  const cam = swayCam(CAM_TRACK[fi], g);
  // D's banner (and its labels, gone since D's pull-back), on D's clock, carried on
  const fD = D_END.f + frame;
  return (
    <HostScene
      cam={cam}
      g={g}
      vignette={vignette}
      mosaic={D_END.mosaic}
      banner={D_END.bannerProgress + frame / 16}
      cortes={{ ...D_END.cortes, frame: fD }}
      tenoch={{ ...D_END.tenoch, frame: fD }}
      shade={shadeAt(frame)}
    >
      <NumeralLabel text="0.5%" x={HEART[0]} y={HEART[1]} dy={pctDy(cam.k)} cam={cam} frame={frame} f0={PCT_F0} size={104} />
    </HostScene>
  );
};

export default HalfOfOnePercent;
