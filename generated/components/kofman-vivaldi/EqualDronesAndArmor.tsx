// ---------------------------------------------------------------------------
// EqualDronesAndArmor (kofman-vivaldi, cut 50). ChinaTalk style (newsprint) (styles/chinatalk.md; kit API in
// generated/components/kits/chinatalk/chinatalkVintage.md).
// Opaque 1080x1920, 24 fps, 289 frames.
//
// CHECK LINE: "these new assault units are built with as many drone units as armoured assault units, paired one to
// one, and they move forward together."
//
// THE LINE (Michael Kofman, ChinaTalk, autumn 2026): "[…keep experimenting with ways to] combine mechanized maneuver
// and drones. And if you look at their force structure, they have like equal amounts of basically drones, supporting
// drone units alongside mechanized assault formations to try to get, bring that back to the battlefield."
// WORD -> FRAME: combine 1 · mechanized 9 · maneuver 21 · and 28 · drones 43 · And if you look at 57-69 · their 70 ·
// force 73 · structure 80 · they 97 · have 106 · like 109 · equal 112 · amounts 121 · of 131 · basically 138 ·
// drones 150 · supporting 153 · drone 163 · units 170 · mechanized 200 · assault 212 · formations 217 · to 229 ·
// try to 244-249 · get, bring 254-258 · that 264 · back 268 · to the 273-276 · battlefield 279 · (speaker at 289).
// DURATION: the slot 50.458 -> 62.500 s = 12.042 s x 24 = 289 frames (f0..f288).
//
// THE MOTION (revision 2: three pairs, ~1.4x bigger): a loose, uneven column of three armoured vehicles (solid ink
// IFV silhouettes, ifvPicto.ts), all fully in shot on f0, rolls in from the left along an ink ground rule at a constant
// 10 px/f, the camera following at k 0.76. Three red drones drop in from above the frame, one straight onto each
// vehicle, lead first (settled f40, 44.5, 49), and ride with it. From f62 the column halts like a column does, the
// lead braking first and each follower later, so the uneven gaps close into a tight, even order of battle (last
// vehicle at rest f121, on "equal amounts"): a rank of three drones over a rank of three vehicles, column-aligned,
// 3 = 3 read from the alignment alone, while the camera eases in (k 0.76 -> 0.95, the held formation ~86 % of the
// frame width, ground rule at screen y 990) and creeps. "Drone units" (f163) and "Mechanized assault" (f200) slide up
// over the drone rank and under the ground rule. From f190 the camera eases out and right, and a full-frame-height
// dashed ink front line comes in from the right edge (in shot from f~204, ahead of the block); from f220 the whole
// block rolls forward as one (drones over their vehicles) with the camera panning and pulling back with it, and the
// line is written solid from the ground outward (PlanMark solid, f234 -> f258) as the block crosses it. Settled by
// f279: the crossed line at screen x ~285, all three pairs past it, the lead's nose ~85 px from the right edge; then
// a slow creep and the drones' hover bob to f288.
// RED = the drones (drone units). Nothing else is red.
//
// SOURCES: none on screen. "Equal amounts" is Kofman's characterisation of drone-assault units such as CODE 9.2
// (grew out of Ukraine's 92nd Assault Brigade, now the 475th Assault Regiment); the counts drawn (3 drones, 3
// vehicles) are schematic, not data. Drone: Phosphor "drone" fill (MIT), vivaldiPictos.ts. Vehicle: drawn for this cut.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  HatchFill,
  INK_HI,
  INK_LO,
  Label,
  PlanMark,
  Pictogram,
  RED,
  RedGroup,
  Rule,
  VStage,
  clamp01,
  enterU,
  runVCamera,
} from "../kits/chinatalk/chinatalkVintage";
import type { VCamKey } from "../kits/chinatalk/chinatalkVintage";
import { IFV_BOTTOM, IFV_D, IFV_X0, IFV_X1 } from "./ifvPicto";
import { DRONE_D } from "./vivaldiPictos";

export const FPS = 24;
export const DURATION = 289;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the formation (world px) ------------------------------------------------------------------
/** the vehicle's 256 box, world px (the silhouette is (IFV_X1 - IFV_X0) / 256 of it long: 300 world px) */
const VEH_SIZE = 328;
const VEH_SC = VEH_SIZE / 256;
const VEH_HALF_L = ((IFV_X1 - IFV_X0) / 2) * VEH_SC;
/** the silhouette's own centre sits this far right of its box centre */
const VEH_DX = ((IFV_X0 + IFV_X1) / 2 - 128) * VEH_SC;
/** the drone's 256 box, world px (the Phosphor drone fills about 224 of 256: 240 world px) */
const DRONE_SIZE = 274;
/** the ground the tracks run on */
const GROUND_Y = 990;
/** box centre of every vehicle: its track bottom on the ground */
const VEH_Y = GROUND_Y - (IFV_BOTTOM - 128) * VEH_SC;
/** the drone rank hovers this far above the vehicles' box centre */
const DRONE_Y = VEH_Y - 285;
/** column pitch in the formation: a tight, even order of battle */
const FORM_PITCH = 340;
/** j = 0..2 left to right; j = 2 is the lead */
const N = 3;
const LEAD = N - 1;
const formX = (j: number) => 540 + (j - (N - 1) / 2) * FORM_PITCH;
/** the formation's left edge (the rear vehicle's tail): labels hang from it */
const FORM_LEFT = formX(0) + VEH_DX - VEH_HALF_L;

// --- the march and the halt -------------------------------------------------------------------
/** the column's road speed, world px per frame */
const V = 10;
/** the lead starts braking here; each braking takes BRAKE_D frames at a steady deceleration */
const BRAKE0 = 62;
const BRAKE_D = 44;
/** on the road the column is loose and uneven: each vehicle's distance behind the lead (j = 0..2) */
const ROAD_OFF = [830, 430, 0];
/** each follower brakes later by the time it takes to close its extra road gap at speed V */
const brakeStart = (j: number) => BRAKE0 + (ROAD_OFF[j] - (formX(LEAD) - formX(j))) / V;
/** a vehicle's x before the advance: constant speed, then a steady braking into its place in the formation */
const marchX = (j: number, S: number) => {
  const tb = brakeStart(j);
  const xb = formX(j) - (V * BRAKE_D) / 2;
  if (S <= tb) return xb - V * (tb - S);
  if (S < tb + BRAKE_D) {
    const t = S - tb;
    return xb + V * t - (V * t * t) / (2 * BRAKE_D);
  }
  return formX(j);
};

// --- the advance: the whole block rolls forward as one -----------------------------------------
/** the dashed front line ahead of them: full frame height, off the right frame edge while the formation holds */
const FRONT_X = 1150;
const FRONT_HALF = 1500;
/** the block starts from rest on ADV0 and reaches ADV_D world px on ADV1 still creeping at CREEP px/f */
const ADV0 = 220;
const ADV1 = 279;
const CREEP = 1.2;
/** at ADV1 the rear vehicle's tail is this far past the front line */
const PAST = 40;
const ADV_D = FRONT_X + PAST - FORM_LEFT;
const advance = (S: number) => {
  if (S <= ADV0) return 0;
  if (S >= ADV1) return ADV_D + CREEP * (S - ADV1);
  const T = ADV1 - ADV0;
  const u = (S - ADV0) / T;
  // cubic Hermite: leaves at rest, arrives at ADV_D still moving at CREEP
  const h01 = -2 * u * u * u + 3 * u * u;
  const h11 = u * u * u - u * u;
  return ADV_D * h01 + CREEP * T * h11;
};
const vehX = (j: number, S: number) => marchX(j, S) + advance(S);
/** the front line is written solid from the ground outward as the lead crosses it, done two pitches later */
const frontSolid = (S: number) => clamp01((vehX(LEAD, S) + VEH_DX + VEH_HALF_L - FRONT_X) / (2 * FORM_PITCH));

// --- the drones: they drop in from above the frame onto their vehicles, lead first ----------------
const LAND0 = 40;
const LAND_STEP = 4.5;
const DROP_F = 24;
const DROP_H = 1180;
const landAt = (j: number) => LAND0 + (LEAD - j) * LAND_STEP;
/** the drop decelerates into the hover (out fast from above the frame, settling soft) */
const dropEase = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
/** the hover bob after landing */
const BOB_A = 5;
const BOB_P = 46;
const BOB_IN = 14;
const BOB_PH = [0.0, 2.4, 4.6];
const droneY = (j: number, S: number) => {
  const L = landAt(j);
  const drop = DROP_H * (1 - dropEase((S - (L - DROP_F)) / DROP_F));
  const t = S - L;
  const ramp = clamp01(t / BOB_IN);
  const bob = t <= 0 ? 0 : BOB_A * ramp * ramp * Math.sin((2 * Math.PI * t) / BOB_P + BOB_PH[j]);
  return DRONE_Y - drop + bob;
};

// --- labels -------------------------------------------------------------------------------------
/** "Drone units" over the drone rank, "Mechanized assault" under the ground rule */
const DRONE_LABEL_Y = DRONE_Y - 120 - 52;
const VEH_LABEL_Y = GROUND_Y + 48;
const DRONE_LABEL_F = 163;
/** the earth under the ground rule: the house ink wash under a fine hatch, across the whole world and down past the
 *  bottom of the frame on every camera state (it moves with the world through the pan). The hatch lies at 22 deg, not
 *  the default 45: at 45 its horizontal period (~29 screen px) is under twice the pan's peak shift (~20 px/f), so it
 *  strobed backwards against the pan; at 22 deg the period is ~55 px and it reads moving the right way. */
const EARTH_HATCH_DEG = 22;
const EARTH: { x: number; y: number }[] = [
  { x: -1600, y: GROUND_Y },
  { x: 3600, y: GROUND_Y },
  { x: 3600, y: GROUND_Y + 2400 },
  { x: -1600, y: GROUND_Y + 2400 },
];
const VEH_LABEL_F = 200;

// --- the camera -----------------------------------------------------------------------------------
/** the ground rule sits at screen y GROUND_SY on every camera state */
const GROUND_SY = 990;
const camY = (k: number) => GROUND_Y - (GROUND_SY - 960) / k;
/** the held formation's zoom (about 86 % of the frame width) */
const CAM_REST_K = 0.95;
/** the end framing: the crossed front line at screen x FRONT_END_SX, all three pairs past it */
const CAM_END_K = 0.69;
const FRONT_END_SX = 282;
const CAM_END_X = FRONT_X - (FRONT_END_SX - 540) / CAM_END_K;
const key = (f: number, x: number, k: number, ease?: VCamKey["ease"]): VCamKey => ({ f, x, y: camY(k), k, ease });
const CAM_KEYS: VCamKey[] = [
  key(-24, -541, 0.76),
  key(25, -120, 0.76, "linear"),
  key(52, 150, 0.77, "linear"),
  key(66, 265, 0.785, "linear"),
  key(80, 400, 0.835, "linear"),
  key(95, 495, 0.9, "linear"),
  key(108, 535, 0.94, "linear"),
  key(122, 540, CAM_REST_K),
  key(188, 548, 0.955, "linear"),
  key(214, 598, 0.862),
  key(276, CAM_END_X - 4, CAM_END_K),
  key(DURATION, CAM_END_X, CAM_END_K - 0.002, "linear"),
];
export const camAt = runVCamera(CAM_KEYS, DURATION);

const EqualDronesAndArmor: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const A = advance(S);
  const labelX = FORM_LEFT + A;
  const solid = frontSolid(S);
  const js = Array.from({ length: N }, (_, j) => j);
  return (
    <VStage S={S} cam={cam}>
      {/* the earth and the ground rule */}
      <HatchFill id="eda-earth" region={EARTH} k={k} fill={0.1} lineOpacity={0.35} angleDeg={EARTH_HATCH_DEG} anchor={{ x: 0, y: GROUND_Y }} />
      <Rule from={{ x: -1600, y: GROUND_Y }} to={{ x: 3600, y: GROUND_Y }} k={k} kind="bold" rung={INK_LO} />

      {/* the front line ahead, the full frame height: dashed (the plan), written solid from the ground outward as the block crosses it */}
      <PlanMark from={{ x: FRONT_X, y: GROUND_Y }} to={{ x: FRONT_X, y: GROUND_Y - FRONT_HALF }} k={k} rung={INK_HI} solid={solid} />
      <PlanMark from={{ x: FRONT_X, y: GROUND_Y }} to={{ x: FRONT_X, y: GROUND_Y + FRONT_HALF }} k={k} rung={INK_HI} solid={solid} />

      {/* the armour: three solid ink vehicles */}
      {js.map((j) => (
        <Pictogram key={j} d={IFV_D} x={vehX(j, S)} y={VEH_Y} size={VEH_SIZE} rung={INK_HI} />
      ))}

      {/* the drones: three red, one over each vehicle */}
      <RedGroup k={k}>
        {js.map((j) =>
          S >= landAt(j) - DROP_F ? (
            <Pictogram key={j} d={DRONE_D} x={vehX(j, S) + VEH_DX} y={droneY(j, S)} size={DRONE_SIZE} color={RED} rung={1} />
          ) : null,
        )}
      </RedGroup>

      {/* the two ranks named, riding with the block */}
      <Label text="Drone units" x={labelX} y={DRONE_LABEL_Y} k={k} size="word" anchor="start" appear={enterU(S, DRONE_LABEL_F)} />
      <Label text="Mechanized assault" x={labelX} y={VEH_LABEL_Y} k={k} size="word" anchor="start" appear={enterU(S, VEH_LABEL_F)} />
    </VStage>
  );
};

export default EqualDronesAndArmor;
