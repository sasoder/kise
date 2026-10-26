// ---------------------------------------------------------------------------
// MostlyFarmers (kyle-rome-industrial, cut 13). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 138 frames.
// One stage inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective, from the
// kit kits/dwarkesh-3d/dwarkesh3d. The world is the clip's shared ROMAN FARM (./farmPlan + ./farmWorld, built with this
// cut; cut 20 ModernYieldsMissing reuses it).
//
// CHECK LINE: "in the Roman world almost everyone works the land, by hand, and each pair of hands brings in only a
// little grain."
//
// THE LINE: "[The] Roman world is still a pre-industrial economy. So agriculture is the dominant sector and
// [productivity is low.]"
// WORD -> FRAME (Whisper, heard ~6 frames later): Roman world 0-21 · is still a 21-37 · PRE-INDUSTRIAL 37-53 ·
// economy 53-64 · So 68-71 · AGRICULTURE 71-82 · is the DOMINANT 82-110 · SECTOR and 110-143 (to the cut)
// DURATION: the slot 13.380 -> 17.985 s in the sequence (frames 401 -> 539) = 138 frames at 30000/1001.
//
// THE MOTION: one crane. f0 close on one reaper stooped at the edge of his standing wheat (~660 px, face y ~465, his
// hands y ~700-870), the iron sickle in his near hand, his small pile of cut stalks beside his foot; the camera is already
// rising and drawing back. It pulls straight back and up along the line through his hands (the hands drift down to
// y ~1030 and stay above the bands, so neither face nor hands ever enters one), revealing his neighbours reaping in echelon in the same
// field (f37-60), a second team converging on the same strip of wheat, the ox team ploughing the next field and more
// teams (f50-75), then the whole valley: small fields to the haze, reaping teams in echelon in nearly every field
// (end frame: ~90 figures, 50 of them >= 40 px tall, all in fields but three at the town gate), binders, gleaners, a
// carrier, a cart of sheaves on the cross lane, the villa on the left, a small walled town far up the lane. The
// people are drawn 1.12x (farmPlan FIG_SCALE). The frame's foot sinks a little into the low air (FarmStage lowAir). The reveal lands by "dominant" (u 0.985 at f102) and
// creeps to the cut while everyone keeps working (sickles swinging, the oxen plodding, the cart creeping).
// Every reaper's harvest is a small pile (a handful laid on it per cycle: cause, the far hand opening at u 0.66 of his
// cycle; effect, the pile one handful bigger the same frame) and one or two sheaves behind him; stooks of two or three
// sheaves at the field edges. No orange: nothing here is technology (the clip's rule: orange = technology and ideas).
//
// DEPTH: farmPlan's eye (X, height H, depth Z, focal F 1500, horizon row hy): f0 H 270 (1.5 m), Z -536, hy 432 ->
// f138 H ~2170 (12 m), Z ~-4430, hy ~327; fog by world depth (FARM_SCENE: fogNear 600, fogVis 10500, max 0.9), the
// people's fog FARM_FIG_FOG (near 700, vis 11000, max 0.82). The hero at X 0, Z 0; the near field Z -2700..-1450; the
// valley to Z 22000; the town Z 24200..29500; hills Z 36000..78000.
//
// SOURCES: illustrative, nothing on screen. Roman grain harvest by hand with the iron sickle (falx messoria),
// handfuls cut below the ears, bound into sheaves (Varro, Res Rusticae I.50; Columella II.20); the ox-drawn ard
// (aratrum) with a wooden sole and iron share (Varro I.29); the villa rustica (Cato, De Agricultura; Columella I.6).
// Agriculture as the large majority of Roman employment and output (Scheidel, Morris & Saller, eds., The Cambridge
// Economic History of the Greco-Roman World, 2007): the speaker's point, not drawn as a number.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { swayCam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CART, OX_TEAM, cartX, cut13EyeAt, oxTeamX, FPS as PLAN_FPS, type FarmEye } from "./farmPlan";
import { FarmStage, FarmWorld, farmAirOf } from "./farmWorld";

export const FPS = PLAN_FPS;
export const DURATION = 138;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
  /** probe only: look at one thing of the world from close by */
  probe: z.enum(["none", "ox", "cart", "town", "near"]).default("none"),
});
export const defaultProps = schema.parse({});

const EYE0 = cut13EyeAt(0);

const PROBES: Record<string, (f: number) => FarmEye> = {
  ox: (f) => ({ X: oxTeamX(f) + 350, H: 330, Z: OX_TEAM.Z - 1500, F: 1500, hy: 640 }),
  cart: (f) => ({ X: cartX(f) + 300, H: 300, Z: CART.Z - 1300, F: 1500, hy: 700 }),
  town: () => ({ X: 1700, H: 700, Z: 16000, F: 1500, hy: 700 }),
  near: () => ({ X: 600, H: 500, Z: -3300, F: 1500, hy: 600 }),
};

const MostlyFarmers: React.FC<z.infer<typeof schema>> = ({ camFrame, probe }) => {
  const frame = useCurrentFrame();
  const eye = probe !== "none" ? PROBES[probe](frame) : cut13EyeAt(camFrame >= 0 ? camFrame : frame);
  const { A } = farmAirOf(eye, EYE0, frame, swayCam);
  return (
    <FarmStage A={A} lowAir={0.3}>
      <FarmWorld A={A} frame={frame} uid="mf" />
    </FarmStage>
  );
};

export default MostlyFarmers;
