// ---------------------------------------------------------------------------
// SameRelationship (kyle-first-farmers, cut 17; file 17_SameRelationship.mov). Dwarkesh map style
// (styles/dwarkesh-map.md), the umber page with no map. Opaque 1080x1920, 29.97 fps, 181 frames.
// Kit: firstFarmersShared (page, camera, ground) and farmersFigures (the cast, the hut, the wheat), read-only.
//
// CHECK LINE: "the first farmers displacing the foragers is staged exactly like the Spaniards meeting the
// Aztecs: the same pair twice."
//
// THE LINE: "foragers that they were taking over from was similar to the relationship the Europeans had to the
// Native Americans, where inadvertently"
// WORD -> FRAME: foragers 3 · that 14 · they 22 · were 29 · taking 36 · over 46 · from 55 · was 67 ·
//   similar 80 · to 87 · the 94 · relationship 96 · the 106 · Europeans 114 · had 121 · to 132 · the 135 ·
//   Native 136 · Americans 143 · where 158 · inadvertently 173.
// DURATION: the slot 17.4508 -> 23.4901 s = 6.0393 s x 29.97 = 181 frames (f0..f180).
//
// THE MOTION: one camera move along one ground line. Close on the Neolithic pair: the orange farmer (sickle,
// sheaf, his wheat behind him) walks in from the left; the cream forager in front of his hide hut gives ground,
// stepping back two paces (f4-f40) and turning partly away (f18-f44), so by "taking over" (f36-f46) the farmer
// stands on the ground he gave up. On "similar" the camera glides right along the same ground (f76-f112,
// a slight lift in the middle) to the second pair, staged the same: the orange Spaniard (morion, sword in
// its sheath) where the farmer stands, the cream Aztec commoner (a fret-bordered tilmatli, tied hair) where the forager stands; as the camera lands
// on "Europeans" (f114) the commoner makes the forager's move, a half pace back and the same turn away
// (f98-f124). On "Native Americans" the camera eases back (f132-f152) to both pairs side by side on the one
// ground line, the figures settled by f160; the camera does not stop but eases into a slow push-in
// (2.5 % of k per 30 frames) that C carries on; idle life to f180. The hand-off to C is sameRelationshipState.ts.
// Contact: none (nobody touches anybody: the farmer's advance is the cause of the forager's step back, which
// begins at f4, after the farmer is already walking on f0).
// Orange = the incoming side in both pairs (the farmers; their counterpart, the Europeans); cream = the
// foragers and the Aztec. No text, no arrows, no germs (they are C's).
//
// SOURCES: none on screen. Costume: LBK farmer / Mesolithic forager / conquistador / Aztec commoner, as drawn
// in farmersFigures, texcocoFigures, captureFigures.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS as CLIP_FPS, GroundLine, Page, WorldSvg, runCamera, smoothstep } from "./firstFarmersShared";
import { Farmer, Forager, HideTent, Spaniard, TilmaCommoner, WALK_CYCLE, WheatField, idle, walkPose, type FigPose } from "./farmersFigures";
import {
  SR_CAM_END,
  SR_CAM_KEYS,
  SR_COMMONER,
  SR_COMMONER_FACING,
  SR_CREEP,
  SR_END_FRAME,
  SR_FARMER,
  SR_FORAGER,
  SR_FORAGER_FACING,
  SR_GROUND,
  SR_HUT,
  SR_IDLE_SEED,
  SR_POSE,
  SR_SCALE,
  SR_SETTLED,
  SR_SPANIARD,
  SR_WHEAT,
  srPose,
  srTurn,
} from "./sameRelationshipState";

export const FPS = CLIP_FPS;
export const DURATION = 181;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ss = (u: number) => smoothstep(Math.max(0, Math.min(1, u)));

// ---------------------------------------------------------------------------
// THE WALKS: a speed profile v(f) 0..1; position and walk phase are both its integral, so the planted foot
// never slides; the phase is offset so each walk ends with the feet under him (phase 0.25 mod 0.5).
// ---------------------------------------------------------------------------
type Walk = { x: number[]; ph: number[]; amt: number[] };
const makeWalk = (v: (f: number) => number, xEnd: number, dirX: 1 | -1, stride: number, phaseSign: 1 | -1): Walk => {
  const adv = (2 * stride * SR_SCALE) / WALK_CYCLE;
  const s: number[] = [0];
  for (let f = 1; f <= DURATION; f++) s.push(s[f - 1] + v(f - 0.5));
  const total = s[DURATION];
  const endPh = (phaseSign * total) / WALK_CYCLE;
  const ph0 = 0.25 - (endPh - Math.floor(endPh));
  return {
    x: s.map((si) => xEnd - dirX * adv * (total - si)),
    ph: s.map((si) => ph0 + (phaseSign * si) / WALK_CYCLE),
    amt: s.map((_, f) => Math.min(1, 2.2 * v(f))),
  };
};
const legsOver = (base: FigPose, w: Walk, f: number, stride: number): FigPose => {
  const q = walkPose(base, w.ph[f], w.amt[f], stride);
  return { ...q, armL: base.armL, armR: base.armR };
};
/** the farmer: in his stride from before f0, slows and stops by ~f47 */
const FARMER_STRIDE = 44;
const farmerWalk = makeWalk((f) => 1 - ss((f - 33) / 14), SR_FARMER.at[0], 1, FARMER_STRIDE, 1);
/** the forager: two short paces backward, f4 - f40 */
const BACK_STRIDE = 36;
const foragerWalk = makeWalk((f) => ss((f - 4) / 8) * (1 - ss((f - 27) / 13)), SR_FORAGER.at[0], 1, BACK_STRIDE, -1);
const foragerTurn = (f: number) => ss((f - 18) / 26);
/** the commoner: half a pace back as the camera lands, f98 - f118, and the same turn f100 - f124 */
const commonerWalk = makeWalk((f) => ss((f - 98) / 6) * (1 - ss((f - 104) / 12)), SR_COMMONER.at[0], 1, BACK_STRIDE, -1);
const commonerTurn = (f: number) => ss((f - 100) / 24);

// ---------------------------------------------------------------------------
// THE JOIN: everything is resolved by SR_SETTLED; only idle life after it
// ---------------------------------------------------------------------------
{
  const last = (w: Walk) => w.x[DURATION];
  const near = (a: number, b: number, eps: number, what: string) => {
    if (Math.abs(a - b) > eps) throw new Error(`SameRelationship: ${what} ${a} != ${b}`);
  };
  for (const [w, at, n] of [
    [farmerWalk, SR_FARMER.at[0], "farmer"],
    [foragerWalk, SR_FORAGER.at[0], "forager"],
    [commonerWalk, SR_COMMONER.at[0], "commoner"],
  ] as const) {
    near(last(w), at, 1e-6, `${n} end x`);
    near(w.x[SR_SETTLED], at, 0.05, `${n} x at f${SR_SETTLED}`);
    near(w.amt[SR_SETTLED], 0, 1e-6, `${n} walk at f${SR_SETTLED}`);
  }
  near(foragerTurn(SR_SETTLED), 1, 1e-9, "forager turn");
  near(commonerTurn(SR_SETTLED), 1, 1e-9, "commoner turn");
  // the camera does not stop: the zoom turns from the pull-back at ~f158 and pushes in from f162 at 0.4 - 1.6x the
  // creep rate (the pchip eases it in, the damper settles it onto SR_CREEP by ~f190); C continues it from SR_CAM_END
  const c1 = runCamera(SR_CAM_KEYS, SR_END_FRAME);
  for (let f = SR_SETTLED + 2; f < SR_END_FRAME; f++) {
    const r = Math.log(runCamera(SR_CAM_KEYS, f + 1).k / runCamera(SR_CAM_KEYS, f).k);
    if (r < SR_CREEP * 0.4 || r > SR_CREEP * 1.6) throw new Error(`SameRelationship: camera creep at f${f} is ${r}, not ${SR_CREEP}`);
  }
  near(c1.x, SR_CAM_END.x, 1e-9, "camera end");
}

const SameRelationship: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = Math.max(0, Math.min(DURATION - 1, frame));
  const cam = runCamera(SR_CAM_KEYS, f);
  const g = f;
  // the farmer: the walk's legs under the carry pose, idle on top
  const farmerPose = idle(farmerWalk.amt[f] > 0 ? legsOver(SR_POSE.farmer, farmerWalk, f, FARMER_STRIDE) : SR_POSE.farmer, g, SR_IDLE_SEED.farmer);
  const fTurn = foragerTurn(f);
  const foragerBase = fTurn >= 1 ? SR_POSE.forager : fTurn <= 0 ? SR_FORAGER_FACING : srTurn("forager", fTurn);
  const foragerPose = idle(foragerWalk.amt[f] > 0 ? legsOver(foragerBase, foragerWalk, f, BACK_STRIDE) : foragerBase, g, SR_IDLE_SEED.forager);
  const cTurn = commonerTurn(f);
  const commonerBase = cTurn >= 1 ? SR_POSE.commoner : cTurn <= 0 ? SR_COMMONER_FACING : srTurn("commoner", cTurn);
  const commonerPose = idle(commonerWalk.amt[f] > 0 ? legsOver(commonerBase, commonerWalk, f, BACK_STRIDE) : commonerBase, g, SR_IDLE_SEED.commoner);
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={cam}>
          <WheatField {...SR_WHEAT} g={g} />
          <HideTent {...SR_HUT} />
          <GroundLine {...SR_GROUND} />
          <Farmer {...SR_FARMER} at={[farmerWalk.x[f], SR_FARMER.at[1]]} pose={farmerPose} />
          <Forager {...SR_FORAGER} at={[foragerWalk.x[f], SR_FORAGER.at[1]]} pose={foragerPose} />
          <Spaniard {...SR_SPANIARD} pose={srPose("spaniard", g)} />
          <TilmaCommoner {...SR_COMMONER} at={[commonerWalk.x[f], SR_COMMONER.at[1]]} pose={commonerPose} />
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

export default SameRelationship;
