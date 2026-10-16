// ---------------------------------------------------------------------------
// SeizedNotKilled (file 3_SeizedNotKilled; Dwarkesh Patel with Si Sheppard,
// "Capture, not kill"). Dwarkesh map style, the umber "page" (no map): engraved
// figures. Opaque 1080x1920, 23.976 fps. No text.
//
// CHECK LINE: "The Aztec warriors had Cortes flat on the ground under their
// raised clubs, and instead of striking they lowered them and grabbed him to
// haul him off alive."
//
// THE MOTION (one move, round 2): it opens CLOSE on Cortes (cream) down on the
// ground, scrabbling back on his elbow and stretching for his sword; the camera
// eases back as four ORANGE warriors come in from both sides (the first plants
// his feet on the blade, the last two arrive at a jog) while his riderless horse
// bolts across behind. The clubs go up in a quick ripple and the camera pushes
// in and tilts up along them (tightest f125-f146); they come down with no blow,
// the two who will take him drop theirs, everybody crowds in, and the camera
// sinks back to the two hands that close on his wrists (contact f236) and then
// travels with the party as he is hauled up, kicking, and carried off alive.
// Orange = the Aztec side (the warriors); cream = Cortes, his horse, his sword.
//
// DURATION: sequence 3.670-14.723 s = 11.053 s x 23.976 = 265 frames (f0..f264).
// WORD -> FRAME: Cortes 18 · laying 49 · ground 63 · knocked 92 · horse 104 ·
//   But instead 114 · killing 125 · on the ground 137-146 · guarding 160 ·
//   advantage 188 · the Aztecs 201 · trying 221 · seize 234 · him 243.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { pchip, smoothstep } from "../kits/maps/incaShared";
import { CAST_SPECS, Macuahuitl, ORANGE, POSES, Warrior, captureAnchors } from "./captureFigures";
import { CortesDown, FallenSword, GroundHatch, LooseHorse, cortesAnchors, type CortesPose } from "./seizedFigures";
import { mix, mix2, mul, norm, sub } from "../kits/maps/stringsMotion";
import { Figure, figureRig, toLocal, type ArmPose, type FigPose } from "../kits/maps/texcocoFigures";
import { FPS, TexcocoPage, WALK, WorldSvg, idle, makeCamera, poseTrack, shadeInk, track, walkPose, type P2 } from "../kits/maps/texcocoShared";

export { FPS };
export const DURATION = 265;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
const T = {
  /** his fingers are at their furthest for the sword; the foot comes down on its blade */
  stretch: 50,
  stomp: 55,
  /** the clubs are at their highest */
  up: 124,
  hold: 147,
  /** ... and down at their sides */
  down: 208,
  /** the two hands start for him; they close on his wrists; the haul starts on the same frame */
  reach: 213,
  touch: 236,
  /** he is up off the ground; the party is walking */
  lifted: 254,
  go: 240,
};

// ---------------------------------------------------------------------------
// LAYOUT (world px = screen px at k = 1)
// ---------------------------------------------------------------------------
/** the ground under Cortes' hips, and his size (px per figure unit: ~560 px long) */
const C_AT: P2 = [585, 1185];
const SC = 1.8;
/** the warriors' size (~500 px tall) and their walk */
const SW = 1.6;
const CYCLE = 26;
const STRIDE = 42;
const ADV = WALK.advance(SW, CYCLE, STRIDE);

// ---- the party's travel at the end (everybody and Cortes share it)
const goAmount = (f: number) => smoothstep((f - T.go) / 9);
const GONE = (() => {
  const out = [0];
  for (let f = 0; f < DURATION + 2; f++) out.push(out[f] + (goAmount(f) + goAmount(f + 1)) / 2);
  return out;
})();
const gone = (f: number) => {
  const x = Math.max(0, Math.min(DURATION, f));
  const i = Math.floor(x);
  return mix(GONE[i], GONE[i + 1], x - i);
};

// ---------------------------------------------------------------------------
// CORTES: keyed poses, every channel a monotone cubic
// ---------------------------------------------------------------------------
const flatArm = (a: ArmPose) => [a.w[0], a.w[1], a.elbow[0], a.elbow[1], a.fist, a.hand];
const unArm = (v: number[], i: number): ArmPose => ({ w: [v[i], v[i + 1]], elbow: [v[i + 2], v[i + 3]], fist: v[i + 4], hand: v[i + 5] });
const flatC = (q: CortesPose) => [
  q.hip[0], q.hip[1], q.torso, q.head, q.headYaw,
  ...flatArm(q.far), ...flatArm(q.near),
  q.legFar.a[0], q.legFar.a[1], q.legFar.knee[0], q.legFar.knee[1], q.legFar.flex,
  q.legNear.a[0], q.legNear.a[1], q.legNear.knee[0], q.legNear.knee[1], q.legNear.flex,
  q.brow, q.lids, q.mouth,
];
const unflatC = (v: number[]): CortesPose => ({
  hip: [v[0], v[1]],
  torso: v[2],
  head: v[3],
  headYaw: v[4],
  far: unArm(v, 5),
  near: unArm(v, 11),
  legFar: { a: [v[17], v[18]], knee: [v[19], v[20]], flex: v[21] },
  legNear: { a: [v[22], v[23]], knee: [v[24], v[25]], flex: v[26] },
  brow: v[27],
  lids: v[28],
  mouth: v[29],
});
const cortesTrack = (keys: [number, CortesPose][]) => {
  const fl = keys.map(([f, q]) => [f, flatC(q)] as [number, number[]]);
  const ch = fl[0][1].map((_, i) => pchip(fl.map(([f, v]) => [f, v[i]] as [number, number]), false));
  const f0 = keys[0][0];
  const f1 = keys[keys.length - 1][0];
  return (f: number) => unflatC(ch.map((c) => c(Math.max(f0, Math.min(f1, f)))));
};

/** down on his back, propped on his left elbow, the right arm up to ward */
const PROP: CortesPose = {
  hip: [0, -22],
  torso: 56,
  head: 26,
  headYaw: -0.62,
  far: { w: [22, -196], elbow: [-1, 0.5], fist: 0, hand: -8 },
  near: { w: [50, -13], elbow: [1, 1], fist: 0.2, hand: 0 },
  legFar: { a: [-130, -13], knee: [0, -1], flex: -6 },
  legNear: { a: [-96, -13], knee: [0.2, -1], flex: 0 },
  brow: 0.7,
  lids: 0,
  mouth: -0.5,
};
/** the clubs are over him: he shrinks back under his arm */
const COWER: CortesPose = {
  ...PROP,
  hip: [6, -22],
  torso: 63,
  head: 40,
  headYaw: -0.52,
  far: { w: [56, -208], elbow: [-1, 0.4], fist: 0, hand: -14 },
  near: { w: [62, -13], elbow: [1, 1], fist: 0.2, hand: 0 },
  legFar: { a: [-122, -13], knee: [0, -1], flex: -4 },
  legNear: { a: [-84, -13], knee: [0.2, -1], flex: 0 },
  brow: 1,
  lids: 0.15,
  mouth: -0.9,
};
/** no blow comes: he looks out from under it */
const PEER: CortesPose = {
  ...PROP,
  hip: [4, -22],
  torso: 50,
  head: 22,
  headYaw: -0.7,
  far: { w: [20, -184], elbow: [-1, 0.5], fist: 0, hand: -4 },
  near: { w: [54, -13], elbow: [1, 1], fist: 0.2, hand: 0 },
  brow: 0.5,
  mouth: -0.4,
};
/** both hands up as theirs come down for him */
const BOTH_UP: CortesPose = {
  ...PEER,
  hip: [2, -22],
  torso: 42,
  head: 18,
  headYaw: -0.74,
  far: { w: [-34, -198], elbow: [-1, 0.5], fist: 0, hand: 0 },
  near: { w: [124, -168], elbow: [1, 0.6], fist: 0, hand: 0 },
  brow: 0.8,
  mouth: -0.7,
};
/** hauled up by the wrists, off the ground between them, his heels trailing */
const HAULED: CortesPose = {
  hip: [10, -68],
  torso: 26,
  head: 14,
  headYaw: -0.66,
  far: { w: [-78, -215], elbow: [-1, 0.3], fist: 0.25, hand: 0 },
  near: { w: [130, -215], elbow: [1, 0.5], fist: 0.25, hand: 0 },
  legFar: { a: [-120, -12], knee: [0, -1], flex: -12 },
  legNear: { a: [-94, -12], knee: [0.1, -1], flex: -8 },
  brow: 0.9,
  lids: 0,
  mouth: -0.8,
};
/** rolled toward us, his left hand stretched along the ground for the sword (the IK stops it at arm's length: just short) */
const REACH: CortesPose = {
  ...PROP,
  hip: [10, -22],
  torso: 66,
  head: 50,
  headYaw: -0.98,
  far: { w: [58, -150], elbow: [-1, 0.6], fist: 0.2, hand: 0 },
  near: { w: [-60, 30], elbow: [1, 1], fist: 0, hand: 0 },
  legFar: { a: [-118, -13], knee: [0, -1], flex: -4 },
  legNear: { a: [-78, -13], knee: [0.2, -1], flex: 0 },
  brow: 1,
  mouth: -0.8,
};
const cortesKeys = cortesTrack([
  [0, PROP],
  [22, { ...PROP, hip: [9, -22], torso: 60, head: 30, headYaw: -0.8, far: { ...PROP.far, w: [30, -176] } }],
  [T.stretch - 10, { ...REACH, torso: 63, near: { w: [-20, 4], elbow: [1, 1], fist: 0, hand: 0 } }],
  [T.stretch, REACH],
  [T.stomp, { ...REACH, torso: 65, head: 46 }],
  [T.stomp + 12, { ...PROP, hip: [12, -22], torso: 55, head: 24, headYaw: -0.9, far: { ...PROP.far, w: [-4, -186] }, near: { w: [60, -13], elbow: [1, 1], fist: 0.2, hand: 0 }, brow: 1, mouth: -0.8 }],
  [90, { ...PROP, hip: [13, -22], torso: 58, head: 32, headYaw: -0.6, far: { ...PROP.far, w: [34, -200] }, near: { w: [62, -13], elbow: [1, 1], fist: 0.2, hand: 0 } }],
  [T.up, { ...COWER, hip: [14, -22] }],
  [T.hold, { ...COWER, hip: [15, -22], torso: 64, far: { ...COWER.far, w: [60, -206] } }],
  [T.down - 30, { ...PEER, hip: [12, -22] }],
  [T.touch - 4, BOTH_UP],
  [T.touch, { ...BOTH_UP, torso: 41, far: { ...BOTH_UP.far, w: [-34, -200], fist: 0.1 }, near: { ...BOTH_UP.near, w: [124, -170], fist: 0.1 } }],
  [T.lifted, HAULED],
  [264, { ...HAULED, hip: [11, -72], torso: 23, far: { ...HAULED.far, w: [-77, -218] }, near: { ...HAULED.near, w: [131, -218] } }],
]);
const cortesAt = (f: number): P2 => [C_AT[0] + gone(f) * ADV, C_AT[1]];
const cortesPose = (f: number): CortesPose => {
  const q = cortesKeys(f);
  // he scrabbles back on his heels at the start, and kicks as he is hauled off
  const scr = 1 - smoothstep((f - 16) / 14);
  const kick = smoothstep((f - T.touch - 2) / 10);
  const a = scr + kick;
  const w = scr > 0 ? f / 2.6 : f / 1.9;
  const push = (ph: number): P2 => [9 * a * Math.cos(w + ph), -(4 * scr + 22 * kick) * Math.max(0, Math.sin(w + ph))];
  const pF = push(0);
  const pN = push(Math.PI);
  return {
    ...q,
    torso: q.torso + 0.5 * Math.sin(f / 9 + 1) + 2.6 * kick * Math.sin(f / 2.7),
    head: q.head + 0.8 * Math.sin(f / 13) + 5 * kick * Math.sin(f / 2.7 + 1),
    legFar: { ...q.legFar, a: [q.legFar.a[0] + pF[0], q.legFar.a[1] + pF[1]] },
    legNear: { ...q.legNear, a: [q.legNear.a[0] + pN[0], q.legNear.a[1] + pN[1]] },
  };
};

// ---------------------------------------------------------------------------
// THE WARRIORS
// ---------------------------------------------------------------------------
type Gait = { cycle: number; stride: number };
const WALKING: Gait = { cycle: CYCLE, stride: STRIDE };
const JOG: Gait = { cycle: 17, stride: 54 };
type Man = {
  id: string;
  dir: 1 | -1;
  /** where he stands in the ring, and the frame he gets there */
  at: P2;
  arrive: number;
  gait: Gait;
  shield: boolean;
  /** which of Cortes' wrists he takes (those two drop their clubs first) */
  takes?: "far" | "near";
  /** the frames his club starts up and starts down: a ripple round the ring */
  rise: number;
  fall: number;
  /** how far he crowds in once the clubs are down, px */
  crowd: number;
  seed: number;
  /** his own way of holding the club up: the fist this far forward (units), the club this much further back (deg) */
  fwd: number;
  tilt: number;
};
const MEN: Man[] = [
  // the first one in, on the near side: he stops with his feet on the blade of the sword
  { id: "w4", dir: 1, at: [214, 1232], arrive: T.stomp, gait: WALKING, shield: true, rise: 113, fall: 154, crowd: 0, seed: 4, fwd: 54, tilt: 16 },
  { id: "w2", dir: -1, at: [1036, 1128], arrive: 72, gait: WALKING, shield: true, rise: 100, fall: 148, crowd: 26, seed: 2, fwd: 40, tilt: 14 },
  // the last two come at a jog; they are the two who take him
  { id: "w3", dir: 1, at: [398, 1140], arrive: 88, gait: JOG, shield: false, takes: "far", rise: 109, fall: 152, crowd: 26, seed: 3, fwd: 34, tilt: 2 },
  { id: "w1", dir: -1, at: [872, 1150], arrive: 97, gait: JOG, shield: false, takes: "near", rise: 104, fall: 150, crowd: 24, seed: 1, fwd: 58, tilt: 10 },
];
const adv = (m: Man) => WALK.advance(SW, m.gait.cycle, m.gait.stride);
const stopAmount = (m: Man, f: number) => 1 - smoothstep((f - (m.arrive - 8)) / 8);
const WALKED = Object.fromEntries(
  MEN.map((m) => {
    const out = [0];
    for (let f = 0; f < DURATION + 2; f++) out.push(out[f] + (stopAmount(m, f) + stopAmount(m, f + 1)) / 2);
    return [m.id, out];
  }),
) as Record<string, number[]>;
const walked = (m: Man, f: number) => {
  const x = Math.max(0, Math.min(DURATION, f));
  const i = Math.floor(x);
  return mix(WALKED[m.id][i], WALKED[m.id][i + 1], x - i);
};
const crowdT = (m: Man, f: number) => smoothstep((f - (m.fall + 16)) / 24);
const manAt = (m: Man, f: number): P2 => {
  const left = WALKED[m.id][DURATION] - walked(m, f);
  return [m.at[0] - m.dir * left * adv(m) + m.dir * m.crowd * crowdT(m, f) + gone(f) * ADV, m.at[1]];
};
/** the frame the two who take him let their clubs go */
const dropAt = (m: Man) => m.fall + 11;
/** the near arm hanging free (the two who will take him carry no shield) */
const freeArm = (dir: 1 | -1): ArmPose => POSES.stand(dir)[dir === 1 ? "armL" : "armR"];
const manTrack = (m: Man) => {
  const d = m.dir;
  const nearKey = d === 1 ? "armL" : "armR";
  const farKey = d === 1 ? "armR" : "armL";
  // feet stay where they stand (a planted foot never slides between poses)
  const base = (q: FigPose): FigPose => ({ ...(m.shield ? q : { ...q, [nearKey]: freeArm(d) }), footL: [0, 0], footR: [0, 0] });
  const arm = (w: P2, elbow: P2, hand: number, fist = 1): ArmPose => ({ w: [d * w[0], w[1]], elbow: [d * elbow[0], elbow[1]], fist, hand: d * hand });
  // carried on the way in: the club at his side, its blade ahead and down
  const low: FigPose = { ...base(POSES.clubLow(d)), [farKey]: arm([30, -152], [-0.6, 1], 92) };
  // the wind-up: the club swung back and down behind him
  const wind: FigPose = { ...low, lean: d * 7, crouch: 5, pitch: 10, brow: 0.8, [farKey]: arm([2, -146], [-0.6, 1], 128) };
  // the club up over him: the arm out in front of his face, so the fist does not hide behind his head
  const up: FigPose = { ...base(POSES.clubRaised(d)), pitch: 8, [farKey]: arm([m.fwd, -322], [1, -0.3], 82 - 0.4 * m.tilt) };
  const upLate: FigPose = { ...up, lean: up.lean - d * 3.5, crouch: 3, brow: 1, [farKey]: arm([m.fwd - 6, -330], [1, -0.3], 76 - 0.4 * m.tilt) };
  // ... and down at his side, the blade to the ground (the two who take him open that hand: the club is gone)
  const down: FigPose = { ...low, lean: d * 6, crouch: 4, pitch: 14, brow: 0.3, mouth: 0, [farKey]: arm([26, -150], [-0.6, 1], 112, m.takes ? 0.3 : 1) };
  const inClose: FigPose = { ...down, lean: d * 11, crouch: 8, pitch: 16 };
  const keys: [number, FigPose][] = [
    [0, low],
    [m.rise - 5, { ...low, lean: d * 4, pitch: 10, brow: 0.6 }],
    [m.rise, wind],
    [m.rise + 10, up],
    [m.fall, upLate],
    [m.fall + 14, down],
    [T.reach - 4, inClose],
  ];
  if (m.takes) {
    keys.push([T.touch, { ...inClose, lean: d * 16, crouch: 13, brow: 0.5 }]);
    keys.push([T.lifted, { ...down, lean: -d * 7, crouch: 9, pitch: 9, brow: 0.6 }]);
    keys.push([264, { ...down, lean: -d * 8, crouch: 8, pitch: 9, brow: 0.6 }]);
  } else {
    keys.push([T.touch, { ...inClose, lean: d * 12 }]);
    keys.push([T.lifted + 4, { ...down, lean: d * 3, crouch: 0, pitch: 6 }]);
    keys.push([264, { ...down, lean: d * 3, crouch: 0, pitch: 5 }]);
  }
  return poseTrack(keys);
};
const TRACKS = Object.fromEntries(MEN.map((m) => [m.id, manTrack(m)])) as Record<string, (f: number) => FigPose>;
/** how far his free hand has gone to Cortes' wrist (1 = it has him: from T.touch on) */
const reachT = (f: number) => {
  const x = Math.max(0, Math.min(1, (f - T.reach) / (T.touch - T.reach)));
  return x * x * x * (x * (6 * x - 15) + 10);
};
const fistT = track([[T.touch - 6, 0.05], [T.touch + 2, 0.8]]);
/** the first man's last step: the near foot comes up and down onto the blade */
const stompUp = track([[T.stomp - 9, 0], [T.stomp - 4, 1], [T.stomp, 0]]);

/** the walk's legs and bob only (captureFigures' walkLegs, with a stride of its own) */
const walkLegs = (q: FigPose, phase: number, amount: number, stride: number): FigPose => ({ ...walkPose(q, phase, amount, stride), armL: q.armL, armR: q.armR });
const manPose = (m: Man, f: number, grab: P2 | null): FigPose => {
  const at = manAt(m, f);
  let q = TRACKS[m.id](f);
  // in (a walk or a jog), the half step that crowds him in, and off with the party: the one who backs away faces him
  const wIn = stopAmount(m, f);
  const wOut = goAmount(f);
  const ph0 = m.seed * 0.37;
  const phEnd = WALKED[m.id][DURATION] / m.gait.cycle + ph0;
  const cr = crowdT(m, f);
  if (wIn > 0.001) {
    const jog = m.gait === JOG ? wIn : 0;
    q = walkLegs({ ...q, lean: q.lean + m.dir * 7 * jog, crouch: q.crouch + 5 * jog }, walked(m, f) / m.gait.cycle + ph0, wIn, m.gait.stride);
  } else if (wOut > 0.001) q = walkLegs(q, phEnd + 0.5 + m.dir * (gone(f) / CYCLE), wOut, STRIDE);
  else if (m.crowd > 0 && cr > 0 && cr < 1) q = walkLegs(q, phEnd + 0.5 * cr, 0.75 * Math.sin(Math.PI * cr), 30);
  if (m.id === "w4") {
    const u = stompUp(f);
    q = { ...q, footL: [q.footL[0] + 8 * u, q.footL[1] - 34 * u], liftL: q.liftL - 16 * u };
  }
  q = idle(q, f, m.seed, 0.6);
  if (grab && m.takes) {
    const e = reachT(f);
    if (e > 0) {
      const nearKey = m.dir === 1 ? "armL" : "armR";
      const own = q[nearKey];
      // the wrist that puts his palm on the grab point (two passes: the palm sits ~9 units past the wrist)
      const tgt = toLocal(grab, at, SW);
      let w = tgt;
      for (let i = 0; i < 2; i++) {
        const r = figureRig(CAST_SPECS.warrior, { ...q, [nearKey]: { ...own, w, elbow: [m.dir * 0.6, 1], hand: 0 } });
        const ar = m.dir === 1 ? r.armL : r.armR;
        w = sub(tgt, mul(norm(sub(ar.W, ar.E)), 9));
      }
      const arm: ArmPose = { w: mix2(own.w, w, e), elbow: mix2(own.elbow, [m.dir * 0.6, 1], e), fist: mix(own.fist, fistT(f), e), hand: mix(own.hand, 0, e) };
      q = { ...q, [nearKey]: arm };
    }
  }
  return q;
};
/** the dropped clubs: where each left the hand, and where it comes to lie */
const DROPS = Object.fromEntries(
  MEN.filter((m) => m.takes).map((m) => {
    const f0 = dropAt(m);
    const a = captureAnchors("warrior", manPose(m, f0, null), manAt(m, f0), SW);
    let turn = m.dir * 97 - a.clubAngle;
    turn -= 360 * Math.round(turn / 360);
    return [m.id, { f0, grip: a.clubGrip, angle: a.clubAngle, turn, to: [a.clubGrip[0] + m.dir * 34, m.at[1] + 14] as P2 }];
  }),
) as Record<string, { f0: number; grip: P2; angle: number; turn: number; to: P2 }>;
const DROP_FRAMES = 8;

// ---------------------------------------------------------------------------
// THE HORSE: bolting across behind them to the left at a constant speed; it
// comes in over the right edge as the camera pulls back and crosses on "horse"
// ---------------------------------------------------------------------------
const HORSE = { xAt98: 330, y: 646, v: 17, size: 330, stride: 11 };
const HORSE_INK = shadeInk(0.86);

// ---------------------------------------------------------------------------
// THE CAMERA: one track, never parked. Close on him; back and up as the ring
// closes and the horse crosses; in and up along the raised clubs; down again
// with them to the hands; in on the grab; off with the party.
// ---------------------------------------------------------------------------
const END_DX = gone(264) * ADV;
const camAt = makeCamera([
  { f: 0, k: 1.62, wx: 592, wy: 1000, sx: 540, sy: 960 },
  { f: 30, k: 1.44, wx: 560, wy: 1012, sx: 540, sy: 960 },
  { f: 60, k: 1.2, wx: 548, wy: 960, sx: 540, sy: 960 },
  { f: 98, k: 1.08, wx: 562, wy: 850, sx: 540, sy: 960 },
  { f: 112, k: 1.16, wx: 580, wy: 900, sx: 540, sy: 960 },
  { f: T.up + 1, k: 1.26, wx: 596, wy: 960, sx: 540, sy: 960 },
  { f: T.hold - 1, k: 1.32, wx: 604, wy: 972, sx: 540, sy: 960 },
  { f: 160, k: 1.3, wx: 610, wy: 986, sx: 540, sy: 960 },
  { f: 176, k: 1.26, wx: 616, wy: 978, sx: 540, sy: 960 },
  { f: T.reach, k: 1.36, wx: 640, wy: 940, sx: 540, sy: 960 },
  { f: T.touch, k: 1.52, wx: 668, wy: 886, sx: 540, sy: 960 },
  { f: T.lifted, k: 1.44, wx: 650 + gone(T.lifted) * ADV, wy: 880, sx: 540, sy: 960 },
  { f: 264, k: 1.4, wx: 636 + END_DX, wy: 878, sx: 540, sy: 960 },
]);

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const SWORD_AT: P2 = [414, 1232];
const SeizedNotKilled: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const cAt = cortesAt(f);
  const cPose = cortesPose(f);
  const ca = cortesAnchors(cPose, cAt, SC);
  // the two hands close round his forearms just below the wrists
  const grabs = { far: mix2(ca.elbowFar, ca.wristFar, 0.84), near: mix2(ca.elbowNear, ca.wristNear, 0.84) };
  const men = MEN.map((m) => ({ m, at: manAt(m, f), pose: manPose(m, f, m.takes ? grabs[m.takes] : null) }));
  const lift = smoothstep((f - T.touch) / (T.lifted - T.touch));
  const horseX = HORSE.xAt98 + HORSE.v * (98 - f);
  const draw = (id: string) => {
    const w = men.find((x) => x.m.id === id);
    if (!w) return null;
    const dr = DROPS[id];
    // the dropped club falls from the hand (faster and faster, no bounce) and lies where it lands
    const t = dr ? Math.max(0, Math.min(1, (f - dr.f0) / DROP_FRAMES)) : 0;
    return (
      <g key={id}>
        <GroundHatch x0={w.at[0] - 84} x1={w.at[0] + 84} y={w.at[1] + 16} depth={16} rows={3} seed={40 + w.m.seed} dark opacity={0.42} />
        {dr && f >= dr.f0 ? <Macuahuitl at={[mix(dr.grip[0], dr.to[0], t), mix(dr.grip[1], dr.to[1], t * t)]} angle={dr.angle + dr.turn * t * t} scale={SW} uid={`sz-${id}-drop`} /> : null}
        <Warrior pose={w.pose} at={w.at} scale={SW} uid={`sz-${id}`} shield={w.m.shield} club={!dr || f < dr.f0} />
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          {/* the ground: a little hatching under the fight */}
          <GroundHatch x0={-340} x1={1720} y={1186} depth={124} rows={8} seed={12} opacity={0.2} />
          {horseX > -340 && horseX < 1700 ? (
            <>
              <GroundHatch x0={horseX - 150} x1={horseX + 150} y={HORSE.y + 8} depth={12} rows={2} seed={13} dark opacity={0.34} />
              <LooseHorse at={[horseX, HORSE.y]} size={HORSE.size} phase={f / HORSE.stride} uid="sz-horse" ink={HORSE_INK} />
            </>
          ) : null}
          {draw("w2")}
          {draw("w3")}
          {draw("w1")}
          <FallenSword at={SWORD_AT} scale={SC} turn={177} uid="sz-sword" />
          <GroundHatch x0={cAt[0] - 290 + 60 * lift} x1={cAt[0] + 250 - 80 * lift} y={cAt[1] + 12} depth={22} rows={4} seed={14} dark opacity={0.5 - 0.14 * lift} />
          <CortesDown pose={cPose} at={cAt} scale={SC} uid="sz-cortes" />
          {draw("w4")}
          {/* the hands that take him lie over him */}
          {f >= T.reach
            ? men
                .filter((w) => w.m.takes)
                .map((w) => <Figure key={w.m.id} spec={CAST_SPECS.warrior} pose={w.pose} at={w.at} scale={SW} uid={`sz-${w.m.id}-hand`} body={false} arms={w.m.dir === 1 ? "L" : "R"} ink={ORANGE} />)
            : null}
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default SeizedNotKilled;

/** review sheet: Cortes down, his horse and his sword, large */
export const SeizedSheet: React.FC = () => {
  const cam = { k: 1, cx: 540, cy: 960 };
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <LooseHorse at={[300, 420]} size={330} phase={0.05} uid="sh-h0" />
          <LooseHorse at={[800, 420]} size={330} phase={0.5} uid="sh-h1" />
          <CortesDown pose={PROP} at={[560, 900]} scale={2.6} uid="sh-c0" />
          <CortesDown pose={REACH} at={[300, 1300]} scale={1.5} uid="sh-c1" />
          <CortesDown pose={BOTH_UP} at={[800, 1300]} scale={1.5} uid="sh-c2" />
          <CortesDown pose={HAULED} at={[300, 1750]} scale={1.5} uid="sh-c3" />
          <FallenSword at={[900, 1700]} scale={1.8} turn={172} uid="sh-s" />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
