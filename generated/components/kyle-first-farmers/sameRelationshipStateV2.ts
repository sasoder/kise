// ---------------------------------------------------------------------------
// sameRelationshipStateV2: the timeline and the resolved picture of cut B V2 (SameRelationshipV2.tsx), for B V2
// itself and for the cut that opens on its last frame (24 DiseaseDidTheWork V2). Copied from
// sameRelationshipState.ts (B V1, delivered; untouched) and redesigned over the cold-review rounds (r2).
//
// THE PICTURE: two rows stacked in the 9:16 frame, aligned top over bottom, the same takeover twice:
//   ROW 1 (top, ground SRV2_GROUND_Y1): the orange FARMER (sickle held blade-up at his chest, sheaf on the far
//   shoulder) walks in; orange ground and WHEAT rising stalk by stalk advance with him in a front that swallows the
//   forager's hide HUT; the cream FORAGER backs away, turning partly away, his spear upright.
//   ROW 2 (below, ground SRV2_GROUND_Y2), the same x positions, the same timing shape SRV2_ROW2_DELAY frames later:
//   the orange SPANIARD (sword in its sheath, near hand on the hilt) walks in; his orange ground and Spanish WHEAT
//   rise in the same front and swallow the Aztec's thatched HOUSE and his MAIZE; the cream Aztec COMMONER
//   (TilmaCommoner) backs off two steps and turns partly away, landing on "Native Americans".
//   Row 2 waits below the frame and rises into place as a whole row (ground, field, house, maize, men), f84-f130.
//   END (f145-f180): the wide, both rows filling the frame height (0-1060), a clear gap between them; both fronts
//   stand at the cream figures' toes; on "inadvertently" both orange men turn back to their own fields (f156-f178,
//   turned to face left, away from the men they displaced). The camera creeps in, never stopping.
//
// HOW 24 V2 CONTINUES IT: g = SRV2_END_FRAME + (24's frame); the camera is srCamV2(g); row 2's lift is 0.
//   Draw (back to front), every component from SameRelationshipV2.tsx / farmersFigures / firstFarmersShared:
//   row 1: <GroundLine {...SRV2_GROUND1}/> <OrangeGround {...SRV2_BAND1} front={SRV2_FRONT_END}/>
//          <RisingWheat {...SRV2_WHEAT1} front={SRV2_FRONT_END} g={g} which="back"/> <HideTent {...SRV2_HUT}/>
//          <RisingWheat {...SRV2_WHEAT1} front={SRV2_FRONT_END} g={g} which="front"/>
//          <TurnFarmer {...SRV2_FARMER} pose={srPoseV2("farmer", g)}/> <TurnForager {...SRV2_FORAGER} pose={srPoseV2("forager", g)}/>
//   row 2: <GroundLine {...SRV2_GROUND2}/> <OrangeGround {...SRV2_BAND2} front={SRV2_FRONT_END}/>
//          <RisingWheat {...SRV2_WHEAT2} front={SRV2_FRONT_END} g={g} which="back"/> <AztecHouse {...SRV2_HOUSE}/>
//          <Maize {...SRV2_MAIZE} g={g}/> <RisingWheat {...SRV2_WHEAT2} front={SRV2_FRONT_END} g={g} which="front"/>
//          <TurnSpaniard {...SRV2_SPANIARD} pose={srPoseV2("spaniard", g)}/> <TurnTilmaCommoner {...SRV2_COMMONER} pose={srPoseV2("commoner", g)}/>
//   The cream figures' fall starts from srPoseV2. They face nearly front (yaw -0.32): by default they fall LEFT,
//   toward the orange figure (a lying man covers ~620 world px from his feet; in-row spacing 640).
// ---------------------------------------------------------------------------
import { runCamera, type Cam, type CamKey, type P2 } from "./firstFarmersShared";
import { COMMONER_POSES, POSES, aimTool, aimToolSide, aimToolWorld, idle, mirrorPose, turnPose, type FigPose } from "./farmersFigures";
import { SPANIARD_STAND } from "../kits/maps/texcocoFigures";

export const SRV2_END_FRAME = 180;
/** the takeovers are resolved by this frame (only the orange men's turn-back and idle after it) */
export const SRV2_SETTLED = 150;
/** row 2's front runs row 1's this many frames later */
export const SRV2_ROW2_DELAY = 91;
/** the Spaniard's walk-in runs row 1's farmer timeline this many frames later (earlier than his front, so he is in
 *  frame when row 2 rises in; his front starts behind his heels and overtakes him, as the wheat does in row 1) */
export const SRV2_SPANIARD_DELAY = 76;

// ---- the world (world px)
/** px per figure unit, all four (a man ~310 units = 620 world px; ~400 px on screen in the wide) */
export const SRV2_SCALE = 2.0;
export const SRV2_GROUND_Y1 = 1000;
/** row 2's ground: the wide's row spacing (row 2's hats clear row 1's ground by ~65 px) */
export const SRV2_GROUND_Y2 = 1772;
/** in-row x: the orange figure's resting x; the cream figure's resting x; the forager's start x */
export const SRV2_X_ORANGE = 0;
export const SRV2_X_CREAM = 640;
export const SRV2_X_CREAM0 = 360;
export const SRV2_X_HOME = 450;
/** the orange fronts: start (at the walker's heels), end (at the cream figure's toes), frames */
export const SRV2_FRONT_START = -275;
export const SRV2_FRONT_END = 606;
export const SRV2_FRONT_FRAMES = 58;

export const SRV2_FARMER = { at: [SRV2_X_ORANGE, SRV2_GROUND_Y1] as P2, scale: SRV2_SCALE, uid: "srv2-farmer", hold: "sickle" as const, holdFar: "sheaf" as const, holdSide: "L" as const, holdFarSide: "R" as const, frontArms: ["L"] as ("L" | "R")[] };
export const SRV2_FORAGER = { at: [SRV2_X_CREAM, SRV2_GROUND_Y1] as P2, scale: SRV2_SCALE, uid: "srv2-forager", hold: "spear" as const, frontArms: ["L", "R"] as ("L" | "R")[] };
export const SRV2_SPANIARD = { at: [SRV2_X_ORANGE, SRV2_GROUND_Y2] as P2, scale: SRV2_SCALE, uid: "srv2-spaniard", variant: 0 as const };
export const SRV2_COMMONER = { at: [SRV2_X_CREAM, SRV2_GROUND_Y2] as P2, scale: SRV2_SCALE, uid: "srv2-commoner" };

// ---- the ground, the fields, the homes
export const SRV2_GROUND1 = { x0: -1700, x1: 2300, y: SRV2_GROUND_Y1, depth: 40, weight: 3.4, seed: 17 };
export const SRV2_GROUND2 = { x0: -1700, x1: 1000, y: SRV2_GROUND_Y2, depth: 40, weight: 3.4, seed: 23 };
export const SRV2_WHEAT1 = { x0: -1500, y: SRV2_GROUND_Y1 - 6, scale: 1.2, rows: 4, depth: 13, spacing: 15, ramp: 120, wind: 0.8, seed: 4 };
export const SRV2_WHEAT2 = { x0: -1500, y: SRV2_GROUND_Y2 - 6, scale: 1.2, rows: 4, depth: 13, spacing: 15, ramp: 120, wind: 0.8, seed: 9 };
export const SRV2_HUT = { at: [SRV2_X_HOME, SRV2_GROUND_Y1 - 30] as P2, scale: 0.8, open: 0.55, tone: 1, seed: 2, uid: "srv2-hut" };
export const SRV2_HOUSE = { at: [SRV2_X_HOME, SRV2_GROUND_Y2 - 30] as P2, scale: 0.8, uid: "srv2-house" };
/** the Aztec's maize patch: young plants before the house's left end (the front reaches them ~f120, the house ~f137) */
export const SRV2_MAIZE = { x0: 215, x1: 340, y: SRV2_GROUND_Y2 - 10, scale: 1.05, seed: 3 };
export const SRV2_BAND1 = { x0: -1700, y: SRV2_GROUND_Y1, depth: 18, back: 60, uid: "srv2-band1" };
export const SRV2_BAND2 = { x0: -1700, y: SRV2_GROUND_Y2, depth: 18, back: 60, uid: "srv2-band2" };

// ---- the poses
export const SRV2_SICKLE_ARM: FigPose["armL"] = { w: [52, -214], elbow: [-0.5, 1], fist: 1, hand: 0 };
/** the forager's spear stays upright in his fist (deg from up; r2 tried lowering it: it read as a jab at the farmer) */
export const SRV2_SPEAR_DEG = 3;
export const SRV2_SPEAR_LOWERED = 3;
const turnAway = (base: FigPose, armL: FigPose["armL"], armR: FigPose["armR"]): FigPose =>
  mirrorPose({ ...base, yaw: 0.32, headYaw: -0.62, pitch: 13, roll: -2, lean: -2.5, brow: 0.75, mouth: -0.75, armL, armR });
export const SRV2_FORAGER_FACING: FigPose = aimTool(POSES.spear(-1), SRV2_SPEAR_DEG, "near", "forager");
export const SRV2_COMMONER_FACING: FigPose = mirrorPose({ ...COMMONER_POSES.stand(1), armL: { w: [-16, -147], elbow: [-0.6, 1], fist: 0.3, hand: 0 }, armR: { w: [30, -147], elbow: [-0.5, 1], fist: 0.3, hand: 0 } });
const FARMER_FACING: FigPose = aimTool({ ...POSES.sheaf(1), armL: SRV2_SICKLE_ARM }, 0, "near", "farmer");
const SPANIARD_FACING: FigPose = { ...SPANIARD_STAND[0], yaw: 0.95, headYaw: 1.02, armL: { w: [16, -150], elbow: [-0.6, 1], fist: 0.6, hand: 0 } };
/** "inadvertently": the ONE pose both orange men turn into, on the same frames: three-quarter facing left (to their
 *  own fields), away from the men they displaced, the head a little down; the near arm (R, facing
 *  left) hangs at his side (the farmer's sheaf in it), the far arm (L) at the chest (the farmer's sickle, blade-up) */
const BACK_ARMS = {
  armL: { w: [-46, -214], elbow: [0.5, 1], fist: 1, hand: 0 } as FigPose["armL"],
  armR: { w: [-10, -148], elbow: [0.5, 1], fist: 0.6, hand: 0 } as FigPose["armR"],
};
/** both men end in the SAME plain three-quarter view facing LEFT (the rig's standard left three-quarter: face visible,
 *  nose pointing left toward their own fields), heads a little down. (A head yaw past the three-quarter makes the
 *  rig show the back of the hair on the leading side, which reads as facing the other way.) */
const BACK_BODY = { yaw: -0.95, headYaw: -1.02, pitch: 10, roll: -1.5, lean: -2, brow: 0.2, mouth: 0 };
/** the farmer keeps his sheaf on the shoulder through the turn (the near arm now; x mirrored), close to the body */
const mirrorArmX = (a: FigPose["armL"]): FigPose["armL"] => ({ ...a, w: [-a.w[0], a.w[1]], elbow: [-a.elbow[0], a.elbow[1]], hand: -a.hand });
const FARMER_BACK: FigPose = { ...FARMER_FACING, ...BACK_BODY, armL: BACK_ARMS.armL, armR: mirrorArmX(FARMER_FACING.armR), footL: [-FARMER_FACING.footR[0], FARMER_FACING.footR[1]], footR: [-FARMER_FACING.footL[0], FARMER_FACING.footL[1]] };
const SPANIARD_BACK: FigPose = { ...SPANIARD_FACING, ...BACK_BODY, ...BACK_ARMS, armL: { ...BACK_ARMS.armL, fist: 0.5 }, footL: FARMER_BACK.footL, footR: FARMER_BACK.footR };
/** the Aztec on "Native Americans": stepped back, the body turned away (to the right), looking back over his shoulder
 *  at his swallowed house */
const COMMONER_LOOKBACK: FigPose = {
  ...COMMONER_POSES.stand(1),
  yaw: 0.42,
  headYaw: -0.55,
  pitch: 9,
  roll: 2,
  lean: 2,
  brow: 0.8,
  mouth: -0.8,
  armL: { w: [-36, -138], elbow: [-0.3, 1], fist: 0.25, hand: 0 },
  armR: { w: [40, -136], elbow: [0.25, 1], fist: 0.25, hand: 0 },
};
export const SRV2_POSE_FACING = { farmer: FARMER_FACING, spaniard: SPANIARD_FACING, forager: SRV2_FORAGER_FACING, commoner: SRV2_COMMONER_FACING };
/** the resolved poses (before idle) */
export const SRV2_POSE: Record<"farmer" | "forager" | "spaniard" | "commoner", FigPose> = {
  farmer: aimToolSide(FARMER_BACK, 0, "L", "farmer"),
  forager: aimTool(turnAway(POSES.spear(1), { w: [8, -168], elbow: [-0.6, 1], fist: 1, hand: 0 }, { w: [50, -143], elbow: [0.4, 1], fist: 0.3, hand: 0 }), SRV2_SPEAR_DEG, "near", "forager"),
  spaniard: SPANIARD_BACK,
  commoner: COMMONER_LOOKBACK,
};

// ---- the timeline (frames of B)
/** the forager: backs away (f4-f38), stands, then one clear step back off the ground he lost (f48-f60); his turn */
export const SRV2_FORAGER_STEP: [number, number] = [48, 60];
export const SRV2_FORAGER_TURN: [number, number] = [26, 54];
/** the commoner: backs away (f100-f124), stands, then on "Native Americans" one clear step back (f132-f143) as he
 *  turns away and looks back at his house (f126-f143) */
export const SRV2_COMMONER_STEPS: [number, number] = [100, 124];
export const SRV2_COMMONER_STEP: [number, number] = [132, 143];
export const SRV2_COMMONER_TURN: [number, number] = [126, 143];
/** "inadvertently": both orange men turn to their fields, together */
export const SRV2_ORANGE_TURN: [number, number] = [158, 175];
const smooth = (u: number) => {
  const v = Math.max(0, Math.min(1, u));
  return v * v * v * (v * (6 * v - 15) + 10);
};
/** the sheaf's screen angle (deg) in the carry and in the back pose, read off the poses (aimToolWorld is linear in it) */
const worldAngleOf = (q: FigPose) => {
  const h0 = aimToolWorld(q, 0, "R", "farmer").armR.hand;
  const h1 = aimToolWorld(q, 1, "R", "farmer").armR.hand;
  return (q.armR.hand - h0) / (h1 - h0);
};
const SHEAF_W0 = worldAngleOf(FARMER_FACING);
const SHEAF_W1 = worldAngleOf(FARMER_BACK);
/** the base pose (before walk legs and idle) of a figure at frame g of B */
export const srBaseV2 = (who: "farmer" | "forager" | "spaniard" | "commoner", g: number): FigPose => {
  if (who === "forager") return aimTool(turnPose(SRV2_FORAGER_FACING, SRV2_POSE.forager, g, SRV2_FORAGER_TURN[0], SRV2_FORAGER_TURN[1]), SRV2_SPEAR_DEG, "near", "forager");
  if (who === "commoner") return turnPose(SRV2_COMMONER_FACING, SRV2_POSE.commoner, g, SRV2_COMMONER_TURN[0], SRV2_COMMONER_TURN[1], { step: 0 });
  if (who === "farmer") {
    const q = aimToolSide(turnPose(FARMER_FACING, FARMER_BACK, g, SRV2_ORANGE_TURN[0], SRV2_ORANGE_TURN[1]), 0, "L", "farmer");
    // the sheaf rides close in his fist through the turn: its screen angle eases from the carry's to the back pose's
    const t = smooth((g - (SRV2_ORANGE_TURN[0] - 5)) / (SRV2_ORANGE_TURN[1] - SRV2_ORANGE_TURN[0] + 5));
    return t <= 0 ? q : aimToolWorld(q, SHEAF_W0 + (SHEAF_W1 - SHEAF_W0) * t, "R", "farmer");
  }
  return turnPose(SPANIARD_FACING, SPANIARD_BACK, g, SRV2_ORANGE_TURN[0], SRV2_ORANGE_TURN[1]);
};
export const SRV2_IDLE_SEED = { farmer: 1, forager: 2, spaniard: 3, commoner: 4 };
/** a figure's pose with idle at frame g >= SRV2_END_FRAME (24 V2: g = 180 + f; every turn is finished by then) */
export const srPoseV2 = (who: "farmer" | "forager" | "spaniard" | "commoner", g: number): FigPose => idle(srBaseV2(who, g), g, SRV2_IDLE_SEED[who]);

// ---- the orange fronts. Row r's front at B frame g (row 1: local = g; row 2: local = g - SRV2_ROW2_DELAY): at the
// walker's heels before local 0; a cubic to SRV2_FRONT_MID by local SRV2_FRONT_FRAMES (it has rolled over the home
// and reached the ground the cream man stood on: he steps back off it); then a slow creep to the cream man's toes
// (SRV2_FRONT_END) by B frame SRV2_FRONT_CREEP_END, the same frame in both rows.
export const SRV2_FRONT_V0 = (2 * 44 * SRV2_SCALE) / 30;
export const SRV2_FRONT_MID = 528;
export const SRV2_FRONT_CREEP_END = 160;
const ease = (u: number) => {
  const v = Math.max(0, Math.min(1, u));
  return v * v * (3 - 2 * v);
};
const hermite = (t: number, p0: number, m0: number, p1: number, m1: number) =>
  (2 * t ** 3 - 3 * t ** 2 + 1) * p0 + (t ** 3 - 2 * t ** 2 + t) * m0 + (-2 * t ** 3 + 3 * t ** 2) * p1 + (t ** 3 - t ** 2) * m1;
export const srFrontRowV2 = (row: 1 | 2, g: number) => {
  const d = row === 1 ? 0 : SRV2_ROW2_DELAY;
  const l = g - d;
  if (l <= 0) return SRV2_FRONT_START + SRV2_FRONT_V0 * l;
  const T = SRV2_FRONT_CREEP_END - (SRV2_FRONT_FRAMES + d);
  // the speed where the sweep hands over to the creep (world px per frame)
  const s1 = (1.3 * (SRV2_FRONT_END - SRV2_FRONT_MID)) / T;
  if (l <= SRV2_FRONT_FRAMES) return hermite(l / SRV2_FRONT_FRAMES, SRV2_FRONT_START, SRV2_FRONT_V0 * SRV2_FRONT_FRAMES, SRV2_FRONT_MID, s1 * SRV2_FRONT_FRAMES);
  const u = Math.min(1, (l - SRV2_FRONT_FRAMES) / T);
  return hermite(u, SRV2_FRONT_MID, s1 * T, SRV2_FRONT_END, 0);
};
/** row 1's front (kept for older callers) */
export const srFrontV2 = (g: number) => srFrontRowV2(1, g);
/** how far a home has sunk into the field (0..1) once the front has rolled over it */
export const srSinkV2 = (front: number) => ease((front - (SRV2_X_HOME - 175)) / 230);
/** world px a home sinks (its base clipped at its own base line): only the roof peak stays above the stalks */
export const SRV2_SINK = 175;

// ---- the camera: close on row 1 (f0-f58), then ONE eased move (f58-f96) out and down to the wide of both rows,
// then a creep that never stops (about the content's middle, held at screen y 549)
const close = (f: number, x: number, gy: number, k = 1): CamKey => ({ f, x, y: gy - 90 / k, k });
/** the wide at f180: the forager's spear tip (~862 world px above row 1's ground) at screen y 40, row 2's feet at 1058 */
const CONTENT_TOP = SRV2_GROUND_Y1 - 862;
const CONTENT_MID = (CONTENT_TOP + SRV2_GROUND_Y2) / 2;
const MID_Y = (1058 + 40) / 2;
export const SRV2_K_END = (1058 - 40) / (SRV2_GROUND_Y2 - CONTENT_TOP);
export const SRV2_CREEP = Math.log(1.025) / 30;
const WIDE_F = 96;
export const SRV2_K_WIDE = SRV2_K_END / Math.exp(SRV2_CREEP * (SRV2_END_FRAME - WIDE_F));
export const SRV2_X_WIDE = (SRV2_X_ORANGE - 110 + SRV2_X_CREAM + 110) / 2;
const wide = (f: number, k: number): CamKey => ({ f, x: SRV2_X_WIDE, y: CONTENT_MID + (960 - MID_Y) / k, k });
export const SRV2_CREEP_UNTIL = 600;
const creepK = (f: number) => SRV2_K_WIDE * Math.exp(SRV2_CREEP * (f - WIDE_F));
export const SRV2_CAM_KEYS: CamKey[] = [
  close(0, 130, SRV2_GROUND_Y1),
  close(50, 290, SRV2_GROUND_Y1),
  close(58, 300, SRV2_GROUND_Y1),
  wide(WIDE_F, SRV2_K_WIDE),
  wide(181, creepK(181)),
  wide(300, creepK(300)),
  wide(SRV2_CREEP_UNTIL, creepK(SRV2_CREEP_UNTIL)),
];
export const srCamV2 = (g: number): Cam => runCamera(SRV2_CAM_KEYS, g);
export const SRV2_CAM_END: Cam = srCamV2(SRV2_END_FRAME);
const before = srCamV2(SRV2_END_FRAME - 1);
export const SRV2_CAM_END_RATE = { x: SRV2_CAM_END.x - before.x, y: SRV2_CAM_END.y - before.y, logK: Math.log(SRV2_CAM_END.k / before.k) };

// ---- ROW 2 SLIDES IN FROM THE LEFT at its final height (never through the caption bands): it waits off the frame's
// left edge until the camera has brought its final place above the bands (f94), then slides right, already moving,
// and decelerates into place by f132; 0 from then on (24 V2: none). Its ground line ends at x 1000 (the row's own
// width), so nothing of it shows before the slide.
export const SRV2_ROW2_SLIDE: [number, number] = [94, 132];
export const SRV2_ROW2_SLIDE0 = -1600;
export const srRow2SlideV2 = (g: number) => {
  if (g <= SRV2_ROW2_SLIDE[0]) return SRV2_ROW2_SLIDE0;
  const u = Math.min(1, (g - SRV2_ROW2_SLIDE[0]) / (SRV2_ROW2_SLIDE[1] - SRV2_ROW2_SLIDE[0]));
  return SRV2_ROW2_SLIDE0 * (1 - u) ** 1.6;
};

/** compat (r1-r2 API): row 2 no longer rises; it slides (srRow2SlideV2). Always 0. */
export const srRow2LiftV2 = (g: number) => (g < 0 ? 0 : 0);
