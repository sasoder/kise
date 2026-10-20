// ---------------------------------------------------------------------------
// sameRelationshipState: the resolved picture of cut B (SameRelationship.tsx), for the cut that opens on its
// last frame (C, DiseaseDidTheWork) and for B itself (B imports every constant here and asserts them).
//
// THE PICTURE AT B f160..f180 (the figures are resolved by f160: only idle life after it; the camera creeps in):
//   one ground line at y = SR_GROUND_Y; left, the Neolithic pair: a few orange wheat stalks behind the orange
//   FARMER (sickle held blade-up at his chest, sheaf on the far shoulder, facing right), the cream FORAGER (spear upright) stepped back in front of his hide
//   hut, turned partly away (body near frontal, head turned off to the right, chin down); right, the 1520 pair
//   staged the same: the orange SPANIARD (morion, sword in its sheath, the near hand resting on its hilt, facing right) and the
//   cream Aztec COMMONER (farmersFigures TilmaCommoner: fret-bordered tilmatli, tied hair, arms loose) turned
//   partly away the same way. Camera: the wide, centred on the group, still pushing in slowly
//   (SR_CREEP, 2.5 % of k per 30 frames); four figures ~375 px at f147, ~385 px at f180, outer margins ~75-85 px.
//
// HOW C CONTINUES IT: draw the same things in the same order (SR_SCENE_ORDER) with the same props, and run the
// idle life on g = SR_END_FRAME + (C's frame) so C f0 = B f180 pixel for pixel:
//   const g = SR_END_FRAME + frame;  <Farmer {...SR_FARMER} pose={srPose("farmer", g)} />  etc.; the commoner is
//   <TurnTilmaCommoner {...SR_COMMONER} pose={srPose("commoner", g)} /> (NOT captureFigures' Commoner), and the
//   forager <TurnForager {...SR_FORAGER} frontArms={SR_FORAGER_FRONT_ARMS} pose={srPose("forager", g)} />: B draws
//   both with the turn-safe cast (TURN_READY.md), so C must too for the pixel join.
//   WheatField g = g as well; the camera is srCam(SR_END_FRAME + frame) (C f0 = SR_CAM_END, moving at
//   SR_CAM_END_RATE), so the push-in carries on with no stop; C's own push-in can grow out of that rate.
// The figures' fall: TurnForager / TurnTilmaCommoner take fall={p} on SR_POSE.forager / .commoner (+ idle). Their bodies face
// nearly front (yaw -0.32), so by default they fall to the LEFT, toward the orange figure. A lying man covers
// ~310 units = 620 world px (~385 screen px in the wide) from his feet: falling left, the forager's head lies
// ~240 px past the farmer's feet (he falls at the farmer's feet); falling right (fallDir 1) he would reach
// XA + 1000, past the Spaniard's feet (XA + 930), and the commoner would leave the frame. Left is the one that fits.
// The forager's spear is ~430 units (860 world px) upright; it is let go at p 0.42 and falls on its own.
// ---------------------------------------------------------------------------
import { runCamera, type Cam, type CamKey, type P2 } from "./firstFarmersShared";
import { COMMONER_POSES, POSES, aimTool, idle, lerpFig, mirrorPose, turnPose, type FigPose } from "./farmersFigures";
import { SPANIARD_STAND } from "../kits/maps/texcocoFigures";

/** B's last frame (B runs f0..f180); C's frame f is B's g = SR_END_FRAME + f */
export const SR_END_FRAME = 180;
/** after this frame of B nothing changes but idle life (asserted in B) */
export const SR_SETTLED = 160;

// ---- the world (world px; the close at f0 is k ~0.96)
export const SR_GROUND_Y = 1050;
/** px per figure unit, all four figures (a man ~310 units: 620 world px; ~375-385 px on screen in the wide) */
export const SR_SCALE = 2.0;
/** the farmer's resting x; everything else is placed from it */
export const SR_XA = 400;
/** in-pair spacing (orange -> cream feet) and the offset of the second pair from the first */
export const SR_PAIR_GAP = 380;
export const SR_PAIR_OFFSET = 930;

export const SR_FARMER_AT: P2 = [SR_XA, SR_GROUND_Y];
export const SR_FORAGER_AT: P2 = [SR_XA + SR_PAIR_GAP, SR_GROUND_Y];
export const SR_SPANIARD_AT: P2 = [SR_XA + SR_PAIR_OFFSET, SR_GROUND_Y];
export const SR_COMMONER_AT: P2 = [SR_XA + SR_PAIR_OFFSET + SR_PAIR_GAP, SR_GROUND_Y];

// ---- the props and the ground (static; WheatField's wind runs on g)
export const SR_GROUND = { x0: SR_XA - 1500, x1: SR_XA + 2700, y: SR_GROUND_Y, depth: 80, weight: 3.4, seed: 17 };
export const SR_WHEAT = { x0: SR_XA - 470, x1: SR_XA - 70, y: SR_GROUND_Y - 22, scale: 1.3, rows: 3, depth: 12, spacing: 15, wind: 0.8, tone: 0.92, seed: 4 };
export const SR_HUT = { at: [SR_XA + SR_PAIR_GAP + 120, SR_GROUND_Y - 24] as P2, scale: 0.7, open: 0.55, tone: 1, seed: 2, uid: "sr-hut" };

// ---- the cast (props for farmersFigures' Farmer / Forager / Spaniard / Commoner, without pose)
export const SR_FARMER = { at: SR_FARMER_AT, scale: SR_SCALE, uid: "sr-farmer", hold: "sickle" as const, holdFar: "sheaf" as const };
export const SR_FORAGER = { at: SR_FORAGER_AT, scale: SR_SCALE, uid: "sr-forager", hold: "spear" as const };
export const SR_SPANIARD = { at: SR_SPANIARD_AT, scale: SR_SCALE, uid: "sr-spaniard", variant: 0 as const };
export const SR_COMMONER = { at: SR_COMMONER_AT, scale: SR_SCALE, uid: "sr-commoner" };
/** painter's order of the resolved picture (back to front) */
export const SR_SCENE_ORDER = ["wheat", "hut", "ground", "farmer", "forager", "spaniard", "commoner"] as const;

// ---- the poses
/** the farmer's sickle, held blade-up in his near fist at chest height, the crescent curving forward (deg from
 *  straight up). V1 carried it low at his front side (125 deg), which at phone size read as the wrong thing. */
export const SR_SICKLE_DEG = 0;
export const SR_SICKLE_ARM: FigPose["armL"] = { w: [52, -214], elbow: [-0.5, 1], fist: 1, hand: 0 };
/** the forager's spear angle (deg, 0 = straight up; mirrored for a left-facing man): upright, a hair back */
export const SR_SPEAR_DEG = 3;
/** turned partly away (built facing right, then mirrored): the body swung round toward us, the head turned off
 *  the other way and down, the brow knit, the mouth turned down; the arms re-placed for the frontal body */
const turnAway = (base: FigPose, armL: FigPose["armL"], armR: FigPose["armR"]): FigPose =>
  mirrorPose({ ...base, yaw: 0.32, headYaw: -0.62, pitch: 13, roll: -2, lean: -2.5, brow: 0.75, mouth: -0.75, armL, armR });
/** the starting poses (B only): facing each other, three-quarter */
export const SR_FORAGER_FACING: FigPose = aimTool(POSES.spear(-1), SR_SPEAR_DEG, "near", "forager");
/** the commoner facing the Spaniard, his arms loose at his sides (not clasped: clasped hands read as bound) */
export const SR_COMMONER_FACING: FigPose = mirrorPose({ ...COMMONER_POSES.stand(1), armL: { w: [-16, -147], elbow: [-0.6, 1], fist: 0.3, hand: 0 }, armR: { w: [30, -147], elbow: [-0.5, 1], fist: 0.3, hand: 0 } });
/** the resolved poses (before idle) */
export const SR_POSE: Record<"farmer" | "forager" | "spaniard" | "commoner", FigPose> = {
  // the sheaf in the crook of the far arm (the module's sheaf pose), the sickle up before his chest in the near fist
  farmer: aimTool({ ...POSES.sheaf(1), armL: SR_SICKLE_ARM }, SR_SICKLE_DEG, "near", "farmer"),
  // the spear drawn in before him, upright; the far arm hangs
  forager: aimTool(turnAway(POSES.spear(1), { w: [8, -168], elbow: [-0.6, 1], fist: 1, hand: 0 }, { w: [50, -143], elbow: [0.4, 1], fist: 0.3, hand: 0 }), SR_SPEAR_DEG, "near", "forager"),
  // texcoco's captain turned three-quarter right, the near hand resting on the hilt of the sheathed sword
  spaniard: { ...SPANIARD_STAND[0], yaw: 0.95, headYaw: 1.02, armL: { w: [16, -150], elbow: [-0.6, 1], fist: 0.6, hand: 0 } },
  // the arms hanging loose at his sides
  commoner: turnAway(COMMONER_POSES.stand(1), { w: [-38, -136], elbow: [-0.25, 1], fist: 0.25, hand: 0 }, { w: [40, -136], elbow: [0.25, 1], fist: 0.25, hand: 0 }),
};
/** the turn from facing to turned-away, t 0..1 (B's turn track; the forager's spear re-aimed every frame) */
/** LEGACY (B V1-V3, a 2D lerp; kept so nothing importing it breaks): use srTurnAt */
export const srTurn = (who: "forager" | "commoner", t: number): FigPose =>
  who === "forager" ? aimTool(lerpFig(SR_FORAGER_FACING, SR_POSE.forager, t), SR_SPEAR_DEG, "near", "forager") : lerpFig(SR_COMMONER_FACING, SR_POSE.commoner, t);
/** B's turn-aways (frames of B): the forager's on "foragers ... taking over", the commoner's as the camera lands */
export const SR_FORAGER_TURN: [number, number] = [18, 44];
export const SR_COMMONER_TURN: [number, number] = [100, 124];
/** the turn at B frame f (farmersFigures turnPose: the body turns round its own axis, the head leads; the forager's
 *  spear re-aimed upright every frame). It returns the facing pose before the turn and SR_POSE exactly after it.
 *  Draw these two with the turn-safe cast: <TurnForager frontArms={SR_FORAGER_FRONT_ARMS}> (the spear is held before
 *  him) and <TurnTilmaCommoner>; C draws them the same way (TurnForager / TurnTilmaCommoner, with its fall). */
export const srTurnAt = (who: "forager" | "commoner", f: number): FigPose =>
  who === "forager"
    ? aimTool(turnPose(SR_FORAGER_FACING, SR_POSE.forager, f, SR_FORAGER_TURN[0], SR_FORAGER_TURN[1]), SR_SPEAR_DEG, "near", "forager")
    : turnPose(SR_COMMONER_FACING, SR_POSE.commoner, f, SR_COMMONER_TURN[0], SR_COMMONER_TURN[1]);
export const SR_FORAGER_FRONT_ARMS: ("L" | "R")[] = ["L", "R"];
/** idle seeds (texcocoShared idle: hem, roll, lean on slow sines of g) */
export const SR_IDLE_SEED = { farmer: 1, forager: 2, spaniard: 3, commoner: 4 };
/** a figure's resolved pose with its idle life at global frame g (B: g = frame; C: g = SR_END_FRAME + frame) */
export const srPose = (who: "farmer" | "forager" | "spaniard" | "commoner", g: number): FigPose => idle(SR_POSE[who], g, SR_IDLE_SEED[who]);

// ---- the camera (B's keys, then a slow push-in that never stops; C carries it on with srCam(SR_END_FRAME + f))
/** feet at screen y ~1050 at every key: cam.y = ground - 90 / k */
const cy = (k: number) => SR_GROUND_Y - 90 / k;
const key = (f: number, x: number, k: number): CamKey => ({ f, x, y: cy(k), k });
export const SR_K_CLOSE = 1.0;
/** the wide where the pull-back lands (f147); the creep then pushes in from it */
export const SR_K_WIDE = 0.605;
/** the four figures' outer extents from the farmer's / the commoner's feet (world px, measured on the render):
 *  the farmer's back -74, the commoner's cloak +120; the wide is centred on that group (equal outer margins) */
export const SR_GROUP_X0 = SR_XA - 74;
export const SR_GROUP_X1 = SR_XA + SR_PAIR_OFFSET + SR_PAIR_GAP + 120;
export const SR_X_WIDE = (SR_GROUP_X0 + SR_GROUP_X1) / 2;
/** THE CREEP: after the pull-back the zoom eases into a steady push-in of SR_CREEP per frame in log k
 *  (2.5 % per 30 frames), centred on the group, the feet held at y ~1050. It runs on past B's end: the keys go
 *  to SR_CREEP_UNTIL, so srCam(g) for any g up to there is the same continuous camera (C: g = SR_END_FRAME + f;
 *  C may lay its own push-in over it from its own keys, starting from srCam's value and rate). */
export const SR_CREEP = Math.log(1.025) / 30;
export const SR_CREEP_UNTIL = 600;
const creepK = (f: number) => SR_K_WIDE * Math.exp(SR_CREEP * (f - 147));
export const SR_CAM_KEYS: CamKey[] = [
  key(0, SR_XA - 10, 0.96),
  key(44, SR_XA + 165, 0.99),
  key(68, SR_XA + 235, 1.01),
  key(90, SR_XA + 235 + SR_PAIR_OFFSET / 2, 0.95),
  key(112, SR_XA + 235 + SR_PAIR_OFFSET, 1.01),
  key(128, SR_XA + 255 + SR_PAIR_OFFSET, 1.03),
  key(147, SR_X_WIDE, SR_K_WIDE),
  // the creep: the pchip eases it in from rest at f147 (k turns from pulling back to pushing in), then a constant rate
  key(181, SR_X_WIDE, creepK(181)),
  key(300, SR_X_WIDE, creepK(300)),
  key(SR_CREEP_UNTIL, SR_X_WIDE, creepK(SR_CREEP_UNTIL)),
];
/** the one continuous camera of B and its continuation: g = B's frame (C's frame f = g SR_END_FRAME + f) */
export const srCam = (g: number): Cam => runCamera(SR_CAM_KEYS, g);
/** the camera on B's last frame (= C's frame 0) and its per-frame motion there (C's camera must start with both) */
export const SR_CAM_END: Cam = srCam(SR_END_FRAME);
const before = srCam(SR_END_FRAME - 1);
export const SR_CAM_END_RATE = { x: SR_CAM_END.x - before.x, y: SR_CAM_END.y - before.y, logK: Math.log(SR_CAM_END.k / before.k) };
