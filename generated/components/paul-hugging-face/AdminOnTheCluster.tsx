// ---------------------------------------------------------------------------
// AdminOnTheCluster (paul-hugging-face, cut 31). Look C "Graphite air" (notes/COMMON.md) on the shared world
// hfWorld.tsx + hfProps.tsx (notes/HF_WORLD_READY.md). Opaque 1080x1920, 23.976 fps, 186 frames.
//
// CHECK LINE: "the AIs broke into a real OpenAI computer cluster, made themselves its administrator, and took control
// of the grading itself."
//
// THE LINE: "And so during the Hugging Face incident, you did see systems ultimately compromising an OpenAI cluster,
// becoming admin on that cluster, and then taking over the evaluation process so"
// WORD -> FRAME: so 1 · during 4 · Hugging 14 · Face 20 · incident 22 · you 33 · see 39 · systems 44 · ultimately 57 ·
// compromising 66 · an 91 · open 93 · AI 96 · cluster 99 · becoming 109 · admin 113 · on 121 · that 126 · cluster 129 ·
// and 140 · then 142 · taking 144 · over 149 · the 154 · evaluation 157 · process 162 · so 171
// DURATION: the slot 31.156 -> 38.914 s = 7.758 s x 23.976 = 186 frames (f0..f185).
//
// THE MOTION (one camera, keys f-14..f200: moving at f0, drifting at f185):
//   f0-40   close on the open Hugging Face box (as cut A left it), two robots stepping away from it to the right; the
//           camera follows them.
//   f40-100 an eased pull-back reveals the white OpenAI cluster: one row of three big racks, slotted fronts toward us
//           (a short fogged row behind), the OpenAI mark on the left end-cap. The toucher, three-quarter to us, lays
//           its mitten on the first rack's front (contact f66); orange runs from there unit by unit, rack by rack
//           (lights + a warm tint on each taken faceplate), so by ~f104 the whole front is orange.
//   f80-135 the other robot stands on its mark RIGHT of the first rack's keyhole plate: a small open cache tray is
//           pulled out under the plate, a big chunky clay key (round bow, two-tooth bit, darker clay edge) lying in it.
//           Leaning in, its near mitten reaches across and down, picks the key up (grip f97, lift f97-106), carries it
//           flat and pushes it tip-first into the keyhole (f106-112); on "admin" it turns it a quarter (f113-119) so the
//           bow swings up broadside to us; key and plate go orange and orange floods out through the rack panels,
//           nearest first. It lets go and turns to us, pleased (f120-127). Its head stays clear of the plate and key.
//           The camera pushes in onto the keyhole f90-119 (most of it by f106, a slow creep through "admin"; the
//           plate ~260-300 px across), then pulls out and right into the move to the grader.
//   f135-185 the camera eases right and up to the grader (cut B's machine at about cut B's angle, readout "gauge",
//           hood up): an orange thread arcs from the cluster's last rack into its side opening (f144-156), orange runs
//           in from the plug (insides f156, feed f157-164), the gauge needle sweeps from X to the tick (f162-170) and
//           the tick zone lights (f167-172); slow drift.
// CAUSE -> EFFECT: mitten on the rack f66 -> first lights f67; grip f97 -> the key leaves the tray; key turned f113-119
// -> key, plate and panels orange; thread tip in the opening f156 -> orange from the plug; feed in -> needle sweeps.
// ROUND 2: painter's order every frame (racks, plate, tray, key, sign, HF box, grader and both robots sorted by depth);
// the key in a cache tray replaces the ADMIN card (the source fact); the grader shows the gauge, no stamp or sheets;
// the world sits SCREEN_DY = 190 px lower (hfWorld), the end camera re-fit so the whole grader is in x 65-1015.
// Orange = the AIs and what they have taken (lights, faceplates, key, keyhole, thread, grader); the rest off-white clay.
// Walks: planted feet, the walk clock follows the distance walked.
//
// SOURCES: the OpenAI report as quoted in notes/BRIEF_C.md: agents found keys left in a shared cache and gained
// administrator access to an OpenAI compute cluster. Marks: OPENAI, HUGGINGFACE (kits/dwarkesh/brandGlyphs via
// hfProps). Nothing numeric on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BOT_POSES, botGripTo, lerpPose, type BotPose } from "../rsi-ten-earths/tenEarthsBot";
import { Decal, FloorShadow, HfStage, Prism, ROBOT_U, RobotAt, Svg, add, camAt, circleOutline, cross, dot, lerp, norm, lerpV, makeWorld, mixMat, mul, n2, ramp, robotFoot, rrect, sst, sub, MATS, type CamKey, type P2, type V3, type World } from "./hfWorld";
import { Grader, HFBox, OpenAIMark, RACK, RBox, Rack, Thread, boxFaces, graderPlugs, graderShadows, hfBoxGeom, sagPts, type GraderOpts } from "./hfProps";

export const FPS = 24000 / 1001;
export const DURATION = 186;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (t: number) => t * t * (3 - 2 * t);
const ease5 = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const c01r = (x: number) => Math.max(0, Math.min(1, x));

// ===================================================================================================================
// THE SET (metres, y up)
// ===================================================================================================================
/** the front row: three racks side by side, their slotted fronts (face "front", -z) toward us; a short row behind */
const FRONT = [-1.0, 0, 1.0].map((x) => [x, 0, 0] as V3);
const BACK = [-0.5, 0.5, 1.5].map((x) => [x, 0, 2.3] as V3);
const FACE_Z = -RACK.d / 2 - 0.006; // the front faces' plane
const LED = 2.1; // the unit lights' size (shared Rack prop)
/** the open Hugging Face box, as cut A left it */
const BOX = hfBoxGeom([-3.3, 0, -1.6], 0.9, 0.52, 0.64, -0.1);
/** the big keyhole plate on the first rack's front (the keyhole's centre) */
const KH: V3 = [-1.0, 1.02, FACE_Z];
const PLATE = { w: 0.56, h: 0.7, d: 0.05 };
/** the keyhole cut's size (1 = a 0.055 m ring over a tapered slot) */
const KH_S = 1.4;
/** the open cache tray: a shallow drawer pulled out of the first rack's front under the keyhole, the key lying in it */
const TRAY = { x: -1.0, y: 0.42, w: 0.96, d: 0.46, rim: 0.05 };
/** the key (key-local: s along the shaft from the bow's centre to the tip, t across): a round bow with a hole, a
 *  square shaft, two teeth at the tip end; clay off-white, chunky */
const KEY = { r: 0.2, hole: 0.065, s0: 0.13, tip: 0.52, w: 0.12, th: 0.08 };
/** the bit: two chunky teeth hanging off the shaft's tip end (inside the rack once the key is in) */
const TEETH = [
  { s0: 0.33, s1: 0.41, t: 0.15 },
  { s0: 0.43, s1: 0.5, t: 0.1 },
];
/** how far the shaft goes into the rack face when the key is in (the bow stands out in front of the plate) */
const KEY_IN = 0.26;
/** the grader: cut B's gauge machine (the hood-door up, GRADER on its top), seen at cut B's angle in the end frame */
const GO: GraderOpts = { c: [3.55, 0, -1.25], s: 1.0, yaw: -0.55, flow: "right", door: "top", panel: 1, label: "GRADER", readout: "gauge" };
const BS = 1.18; // the robots' size (hero C)
/** the OpenAI fascia on top of the front row (the mark at its middle) */
const SIGN = { c: [0, RACK.h, -0.27] as V3, w: 3.0, h: 0.62, d: 0.12 };

// ===================================================================================================================
// THE CAMERA: close on the box, follow + pull back on the cluster, push in onto the keyhole, ease right to the
// grader, drift (the world projects SCREEN_DY = 190 px lower, automatically)
// ===================================================================================================================
/** the push-in onto the keyhole (f90 -> f119): most of the travel by f106, then a slow creep through "admin" (f113),
 *  settling at f119 (plate ~260 px across, the robot whole at its right, its head clear of the plate) */
const PUSH_IN: CamKey = { f: 106, target: [-0.47, 0.95, -0.63], dist: 4.4, yaw: 0.47, pitch: 0.13, sy: 724 };
const PUSH: CamKey = { f: 119, target: [-0.54, 0.92, -0.7], dist: 3.4, yaw: 0.5, pitch: 0.12, sy: 720 };
const KEYS: CamKey[] = [
  { f: -14, target: [-2.85, 0.5, -1.6], dist: 4.0, yaw: 0.12, pitch: 0.18, F: 1800, sy: 800 },
  { f: 36, target: [-2.0, 0.8, -1.3], dist: 5.6, yaw: 0.22, pitch: 0.2, sy: 780 },
  { f: 90, target: [-0.15, 1.15, -0.3], dist: 8.4, yaw: 0.4, pitch: 0.2, sy: 760 },
  PUSH_IN,
  PUSH,
  { f: 172, target: [2.2, 0.85, -1.2], dist: 9.6, yaw: 0.1, pitch: 0.42, sy: 740 },
  { f: 200, target: [2.26, 0.85, -1.2], dist: 9.3, yaw: 0.095, pitch: 0.42, sy: 740 },
];
/** the last lobe: the whole gauge grader, lifted hood included, inside x 65-1015 from ~f158 (x ~230-1000, y ~705-1160
 *  after SCREEN_DY), its dial ~270 px across, about cut B's angle (camera ~0.37 rad to its front-right); blended in from f135 (zero velocity change there), so f0-135 follow the keys above */
const END_KEYS: CamKey[] = [
  ...KEYS.slice(0, 5),
  { f: 160, target: [3.47, 0.8, -1.2], dist: 8.65, yaw: 0.18, pitch: 0.24, sy: 700 },
  { f: 200, target: [3.52, 0.8, -1.2], dist: 8.45, yaw: 0.18, pitch: 0.24, sy: 700 },
];
const LOBE0 = 135;
const LOBE1 = 152;
const CAM_REST = camAt(KEYS, KEYS[0].f);
const cameraAt = (frame: number): World => {
  const a = camAt(KEYS, frame);
  let c = a;
  if (frame > LOBE0) {
    const b = camAt(END_KEYS, frame);
    const k = sst(LOBE0, LOBE1, frame);
    c = { ...a, target: lerpV(a.target, b.target, k), dist: lerp(a.dist, b.dist, k), yaw: lerp(a.yaw, b.yaw, k), pitch: lerp(a.pitch, b.pitch, k), sy: lerp(a.sy, b.sy, k) };
  }
  const f0: V3 = [Math.sin(CAM_REST.yaw) * Math.cos(CAM_REST.pitch), -Math.sin(CAM_REST.pitch), Math.cos(CAM_REST.yaw) * Math.cos(CAM_REST.pitch)];
  return makeWorld({ target: c.target, dist: c.dist, yaw: c.yaw, pitch: c.pitch, F: c.F, sx: c.sx, sy: c.sy, sun: c.sun, frame, rest: { pos: add(CAM_REST.target, mul(f0, -CAM_REST.dist)), yaw: CAM_REST.yaw } });
};

// ===================================================================================================================
// THE ROBOTS: walkers with planted feet (the walk clock follows the distance walked), then each one's act
// ===================================================================================================================
const ADV = (1.54 / ROBOT_U) * BS; // metres per walk-clock frame at size BS
type Walk = { p0: V3; p1: V3; f1: number; stop: number; seed: number };
/** distance along the path at frame f: full speed from before f0, a linear velocity ramp to 0 over the last `stop` */
const walkAt = (w: Walk, f: number) => {
  const D = Math.hypot(w.p1[0] - w.p0[0], w.p1[2] - w.p0[2]);
  const v0 = D / (w.f1 - w.stop / 2);
  const fs = w.f1 - w.stop;
  let s: number;
  let v: number;
  if (f <= fs) {
    s = v0 * f;
    v = v0;
  } else if (f >= w.f1) {
    s = D;
    v = 0;
  } else {
    const u = f - fs;
    s = v0 * fs + v0 * u - (v0 * u * u) / (2 * w.stop);
    v = v0 * (1 - u / w.stop);
  }
  return { p: lerpV(w.p0, w.p1, s / D), v, v0, clock: s / ADV + w.seed * 5 };
};
/** the key robot: to its mark right of the keyhole and the cache tray under it */
const W1: Walk = { p0: [-2.15, 0, -1.8], p1: [-0.05, 0, -0.8], f1: 66, stop: 12, seed: 0 };
/** the toucher: to the row's left end, its mitten on the first rack's end face near the front */
const W2: Walk = { p0: [-2.95, 0, -1.15], p1: [-2.02, 0, -0.32], f1: 58, stop: 12, seed: 1 };
const TOUCH = { reach0: 57, contact: 66, at: [-RACK.w * 1.5 - 0.006, 1.0, -0.2] as V3 };
/** the key's clock: hands to the key, the grip, lift + carry to the keyhole, push in, the turn on "admin", let go */
const K = { reach0: 86, grip: 97, lift1: 106, in1: 112, turn0: 113, turn1: 119, rel0: 120, rel1: 127 };

// the wave: every unit light lights by its distance from the touch (plus a little jitter)
const WAVE_SPEED = 0.072; // metres per frame
const lightOn = (p: V3, i: number, seed: number, f: number) => {
  const d = Math.hypot(p[0] - TOUCH.at[0], (p[1] - TOUCH.at[1]) * 0.8, p[2] - TOUCH.at[2]);
  const t = TOUCH.contact + 0.5 + d / WAVE_SPEED + (hash(seed * 13 + i) - 0.5) * 3;
  return sst(t, t + 4, f);
};
/** the panels: from the key's turn, the faceplates take a strong orange tint rack by rack, out from the keyhole */
const panelWarm = (c: V3, f: number) => {
  const t0 = K.turn0 + 1 + Math.hypot(c[0] - KH[0], c[2] - KH[2]) * 3.4;
  return 0.12 + 0.46 * sst(t0, t0 + 6, f);
};

// ===================================================================================================================
// LOCAL HELPERS
// ===================================================================================================================
/** robot-local units (x right, y down) of a screen point, for a robot standing at feet */
const localOf = (W: World, feet: V3, S: P2): P2 => {
  const A = W.project(feet);
  const sc = (W.scaleAt(feet) / ROBOT_U) * BS;
  return [(S[0] - A[0]) / sc, (S[1] - A[1]) / sc];
};
/** the key's pose: B the bow's centre, a along the shaft (lying: -x; carried and in the keyhole: +z, into the rack),
 *  b the key plane's other axis (lying and carried flat: -z then -x; turned on "admin": up) */
const keyPose = (f: number) => {
  const rest: V3 = [TRAY.x + TRAY.w / 2 - 0.05 - KEY.r, TRAY.y + 0.012 + KEY.th / 2, FACE_Z - TRAY.d / 2];
  const pre: V3 = [KH[0], KH[1], FACE_Z - 0.06 - KEY.tip];
  const inn: V3 = [KH[0], KH[1], FACE_Z + KEY_IN - KEY.tip];
  const l = ease(sst(K.grip, K.lift1, f));
  let B = lerpV(rest, pre, l);
  B = add(B, [0, 0.06 * Math.sin(Math.PI * l), 0]);
  B = lerpV(B, inn, ease(sst(K.lift1, K.in1, f)));
  // lying flat in the tray (tip to the left) -> carried flat, tip into the keyhole -> on "admin" turned a quarter, so
  // the bow swings UP and stands broadside to the camera (the readable state)
  let a = norm(lerpV([-1, 0, 0], [0, 0, 1], l));
  let b: V3 = lerpV([0, 0, -1], [-1, 0, 0], l);
  b = norm(sub(b, mul(a, dot(b, a))));
  if (f > K.turn0) {
    const th = lerp(Math.PI, Math.PI / 2, ease5(sst(K.turn0, K.turn1, f)));
    a = [0, 0, 1];
    b = [Math.cos(th), Math.sin(th), 0];
  }
  return { B, a, b, n: cross(a, b) };
};
/** the chunky key (truncated where its shaft enters the rack face) */
const KeyEl: React.FC<{ W: World; B: V3; a: V3; b: V3; n: V3; glow: number }> = ({ W, B, a, b, n, glow }) => {
  const mat = mixMat(MATS.clayWarm, MATS.orange, glow);
  const o = add(B, mul(n, -KEY.th / 2));
  const smax = a[2] > 0.05 ? Math.min(KEY.tip, (FACE_Z - B[2]) / a[2] - 0.004) : KEY.tip;
  const common = { W, o, u: a, v: b, n, depth: KEY.th, mat, orange: glow > 0.5, emissive: 0.5 * glow, ao: 0, rim: 0.7 };
  const capN = dot(n, sub(W.pos, B)) > 0 ? n : mul(n, -1);
  const hole = circleOutline(KEY.hole, 20).map(([x, y]) => W.project(add(add(add(B, mul(a, x)), mul(b, y)), mul(capN, KEY.th / 2 + 0.003))));
  const edge = W.tone(mixMat(MATS.clayWarm, MATS.orange, glow).dark, B);
  const ew = Math.max(1.2, 0.011 * W.scaleAt(B));
  const fid = "keyEdge";
  return (
    <g filter={`url(#${fid})`}>
      <defs>
        <filter id={fid} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320} colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={n2(ew)} result="d" />
          <feFlood floodColor={edge} result="c" />
          <feComposite in="c" in2="d" operator="in" result="e" />
          <feMerge>
            <feMergeNode in="e" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {smax > KEY.s0 + 0.01 ? <Prism {...common} outline={rrect(smax - KEY.s0, KEY.w, 0.02, 5, (KEY.s0 + smax) / 2, 0)} uid="kShaft" /> : null}
      {TEETH.map((q, i) => (q.s1 < smax ? <Prism key={i} {...common} outline={rrect(q.s1 - q.s0, q.t, 0.012, 4, (q.s0 + q.s1) / 2, -KEY.w / 2 - q.t / 2 + 0.01)} uid={`kT${i}`} /> : null))}
      <Prism {...common} outline={circleOutline(KEY.r, 28)} uid="kBow" />
      <path d={`M${hole.map((q) => `${n2(q[0])},${n2(q[1])}`).join("L")}Z`} fill={W.tone(glow > 0.5 ? "#7A3A06" : "#55504A", B)} />
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const AdminOnTheCluster: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const W = cameraAt(frame);

  // ---- the toucher: walks, turns three-quarter to us (the rack at its right), lays its right mitten on the end ----
  const a2 = walkAt(W2, frame);
  const stand2: BotPose = BOT_POSES.turnTo(1.2, frame, W2.seed);
  const walk2 = BOT_POSES.walk(1, a2.clock, 1);
  let p2: BotPose = a2.v > a2.v0 * 0.45 ? walk2 : (lerpPose(walk2, stand2, sst(0.55, 1, 1 - a2.v / a2.v0)) as BotPose);
  if (frame > TOUCH.reach0 - 6) {
    const R = localOf(W, a2.p, W.project(TOUCH.at));
    const reach = botGripTo({ ...stand2, mouth: 0.7 }, { R });
    p2 = lerpPose(lerpPose(p2, stand2, sst(TOUCH.reach0 - 6, TOUCH.reach0, frame)) as BotPose, reach, sst(TOUCH.reach0, TOUCH.contact, frame)) as BotPose;
  }

  // ---- the key robot: walks to its mark, picks the key out of the tray, pushes it into the keyhole, turns it -------
  const a1 = walkAt(W1, frame);
  const feet1 = a1.p;
  const walk1 = BOT_POSES.walk(1, a1.clock, 1);
  const stand1: BotPose = BOT_POSES.turnTo(-0.2, frame, 0);
  let p1: BotPose = a1.v > a1.v0 * 0.45 ? walk1 : (lerpPose(walk1, stand1, sst(0.55, 1, 1 - a1.v / a1.v0)) as BotPose);
  const kp = keyPose(frame);
  const keyGlow = ease(sst(K.turn0, K.turn1 + 1, frame));
  if (frame >= 80) {
    // three-quarter to the keyhole (screen left), leaning in, a small dip for the tray; then back to us
    const yaw = lerp(lerp(-0.2, -0.65, ease(sst(80, 90, frame))), -0.1, ease(sst(K.rel0, K.rel1 + 2, frame)));
    const inLean = sst(K.reach0, K.grip - 3, frame) * (1 - sst(K.rel0, K.rel1 + 2, frame));
    const dip = sst(K.reach0 + 4, K.grip, frame) * (1 - sst(K.grip + 1, K.lift1, frame));
    const t0 = BOT_POSES.turnTo(yaw, frame, 0);
    const base: BotPose = {
      ...t0,
      lean: t0.lean - 10 * inLean,
      crouch: t0.crouch + 18 * dip,
      pitch: t0.pitch + 6 * dip,
      mouth: lerp(0.4, 1, sst(K.turn0, K.turn1 + 3, frame)),
    };
    // the near (screen-left) mitten on the bow's right edge, away from the plate; the other hand stays home
    const toBot = sub(add(feet1, [0, 1.0, 0]), kp.B);
    const rimDir = norm(sub(toBot, mul(kp.n, dot(toBot, kp.n))));
    const gL = W.project(add(kp.B, mul(rimDir, KEY.r * 0.85)));
    const grip = botGripTo(base, { L: localOf(W, feet1, gL) });
    const on = sst(K.reach0, K.grip, frame) * (1 - sst(K.rel0, K.rel1, frame));
    const q = lerpPose(base, grip, on) as BotPose;
    p1 = frame < 90 ? (lerpPose(p1, q, sst(80, 90, frame)) as BotPose) : q;
  }

  // ---- everything that stands in the scene, sorted far to near EVERY frame (robots and props alike) ----------------
  type Item = { d: number; el: React.ReactNode };
  const items: Item[] = [];
  const at = (p: V3) => W.depth(p);
  BACK.forEach((c, i) => {
    const seed = 20 + i;
    items.push({ d: at(c), el: <Rack key={`b${i}`} W={W} c={c} uid={`rb${i}`} face="front" lit={(k, p) => lightOn(p, k, seed, frame)} led={LED} warm={panelWarm(c, frame)} /> });
  });
  FRONT.forEach((c, i) => {
    const seed = i;
    items.push({ d: at(c), el: <Rack key={`f${i}`} W={W} c={c} uid={`rf${i}`} face="front" lit={(k, p) => lightOn(p, k, seed, frame)} led={LED} warm={panelWarm(c, frame)} /> });
  });
  // the keyhole plate on the first rack (glows orange as the key turns)
  const plateMat = mixMat(MATS.clayWarm, MATS.orange, keyGlow);
  const plateC: V3 = [KH[0], KH[1] - PLATE.h / 2, FACE_Z - PLATE.d / 2];
  const pf = boxFaces(plateC, PLATE.w, PLATE.h, PLATE.d).front;
  const khP = (x: number, y: number) => W.project([KH[0] + x * KH_S, KH[1] + y * KH_S, pf.o[2] - 0.002]);
  const holeD = (() => {
    const ring = circleOutline(0.055, 18).map(([x, y]) => khP(x, y + 0.035));
    const slot = [khP(-0.028, 0.01), khP(0.028, 0.01), khP(0.045, -0.13), khP(-0.045, -0.13)];
    return `M${ring.map((q) => `${n2(q[0])},${n2(q[1])}`).join("L")}ZM${slot.map((q) => `${n2(q[0])},${n2(q[1])}`).join("L")}Z`;
  })();
  items.push({
    d: at(plateC) - 0.3,
    el: (
      <Svg key="plate" id="plate" glow={0.8 * keyGlow}>
        <RBox W={W} c={plateC} w={PLATE.w} h={PLATE.h} d={PLATE.d} r={0.03} mat={plateMat} uid="plate" ao={0.2} orange={keyGlow > 0.5} emissive={0.45 * keyGlow} />
        <path d={holeD} fill={keyGlow > 0 ? W.toneO("#FFB000", KH) : W.tone("#3A3632", KH)} opacity={keyGlow > 0 ? 0.35 + 0.65 * keyGlow : 1} />
      </Svg>
    ),
  });
  // the open cache tray, pulled out of the first rack under the keyhole (dark floor so the clay key reads)
  const trayC: V3 = [TRAY.x, TRAY.y, FACE_Z - TRAY.d / 2];
  items.push({
    d: at(trayC),
    el: (
      <Svg key="tray" id="tray">
        <RBox W={W} c={[TRAY.x, TRAY.y - 0.02, FACE_Z - TRAY.d / 2]} w={TRAY.w + 0.04} d={TRAY.d} h={0.03} r={0.012} mat={MATS.graphite} uid="tB" ao={0.2} />
        <RBox W={W} c={[TRAY.x - TRAY.w / 2, TRAY.y, FACE_Z - TRAY.d / 2]} w={0.03} d={TRAY.d} h={TRAY.rim} r={0.01} mat={MATS.greige} uid="tL" ao={0.1} />
        <RBox W={W} c={[TRAY.x + TRAY.w / 2, TRAY.y, FACE_Z - TRAY.d / 2]} w={0.03} d={TRAY.d} h={TRAY.rim} r={0.01} mat={MATS.greige} uid="tR" ao={0.1} />
        <RBox W={W} c={[TRAY.x, TRAY.y, FACE_Z - TRAY.d + 0.015]} w={TRAY.w + 0.04} d={0.03} h={TRAY.rim + 0.02} r={0.01} mat={MATS.greige} uid="tF" ao={0.1} />
        <RBox W={W} c={[TRAY.x, TRAY.y + 0.012, FACE_Z - TRAY.d - 0.012]} w={0.14} d={0.03} h={0.03} r={0.012} mat={MATS.graphite} uid="tH" ao={0} />
      </Svg>
    ),
  });
  // the key: in the tray it lies ON it (just in front of the tray in the sort), later at the keyhole
  items.push({
    d: Math.min(at(kp.B) + 0.15, at(trayC) - 0.05, at(plateC) - 0.35), // over the tray and the plate, under the robot's mittens
    el: (
      <Svg key="key" id="key" glow={0.9 * keyGlow}>
        <KeyEl W={W} {...kp} glow={keyGlow} />
      </Svg>
    ),
  });
  // the OpenAI fascia on the row's top
  const sf = boxFaces(SIGN.c, SIGN.w, SIGN.h, SIGN.d).front;
  items.push({
    d: at(add(SIGN.c, [0, 0, -0.3])),
    el: (
      <React.Fragment key="sign">
        <Svg id="sign">
          <RBox W={W} c={SIGN.c} w={SIGN.w} h={SIGN.h} d={SIGN.d} r={0.04} mat={MATS.clay} uid="sign" ao={0.3} />
        </Svg>
        <Decal W={W} o={sf.o} u={sf.u} v={sf.v} w={sf.w} h={sf.h} res={300}>
          <OpenAIMark x={sf.w * 150} y={sf.h * 150} size={sf.h * 300 * 0.8} fill={W.tone("#3C3936", SIGN.c)} />
        </Decal>
      </React.Fragment>
    ),
  });
  // the HF box
  items.push({ d: at(add(BOX.c, [0, 0.26, 0])), el: <HFBox key="hf" W={W} g={BOX} uid="hf" open={1} hinge="left" /> });

  // the grader: the thread plugs into its side opening; orange runs through the insides, along the lead into the
  // gauge; the needle sweeps from X to the check, which lights orange
  const plug = graderPlugs(GO, 0.3)[1];
  const THREAD0 = 144;
  const THREAD1 = 156;
  const tremble = (1 - ramp(frame, 150, 160)) * (0.012 * Math.sin(frame * 0.9) + 0.008 * Math.sin(frame * 2.3 + 1));
  const go: GraderOpts = {
    ...GO,
    insides: ramp(frame, THREAD1, 161),
    gaugeFeed: ease(ramp(frame, 157, 164)),
    gauge: ease5(ramp(frame, 162, 170)) + (frame > 144 ? tremble : 0),
    gaugeLit: ease(ramp(frame, 167, 172)),
    glow: 0.7,
  };
  items.push({ d: at(GO.c), el: <Grader key="grader" W={W} o={go} uid="gC" /> });

  // the robots (a robot well off the frame is not drawn: the bot's layers misplace when far outside the canvas)
  const onFrame = (p: V3) => {
    const q = W.project(add(p, [0, 0.7, 0]));
    return q[0] > -0.9 * W.scaleAt(p) && q[0] < 1080 + 0.9 * W.scaleAt(p);
  };
  if (onFrame(a2.p))
    items.push({
      d: at(add(a2.p, [0, 0.7, 0])),
      el: (
        <Svg key="r2" id="r2" glow={0.4}>
          <RobotAt W={W} p={a2.p} pose={p2} uid="r2" variant={2} size={BS} />
        </Svg>
      ),
    });
  if (onFrame(feet1))
    items.push({
      d: at(add(feet1, [0, 0.7, 0])),
      el: (
        <Svg key="r1" id="r1" glow={0.45}>
          <RobotAt W={W} p={feet1} pose={p1} uid="admin" size={BS} />
        </Svg>
      ),
    });
  items.sort((a, b) => b.d - a.d);

  // ---- the thread: from the last rack's top corner, arcing over the grader into its side opening ------------------
  const tA: V3 = [FRONT[2][0] + RACK.w / 2 - 0.06, RACK.h - 0.05, FACE_Z + 0.1];
  const tPts = sagPts(W, tA, plug, -1.1, 24);
  const kTh = W.scaleAt(plug);
  const draw = ramp(frame, THREAD0, THREAD1);

  // the touch: a soft orange ring opening from the mitten on contact
  const tS = W.project(TOUCH.at);
  const ringT = c01r((frame - TOUCH.contact) / 14);
  const ring =
    frame >= TOUCH.contact && ringT < 1 ? (
      <Svg id="ring" glow={0.8}>
        <circle cx={n2(tS[0])} cy={n2(tS[1])} r={n2((0.08 + 0.45 * Math.sqrt(ringT)) * W.scaleAt(TOUCH.at))} fill="none" stroke="#FFB000" strokeWidth={n2(0.03 * W.scaleAt(TOUCH.at) * (1 - ringT))} opacity={n2(1 - ringT)} />
        <circle cx={n2(tS[0])} cy={n2(tS[1])} r={n2(0.07 * W.scaleAt(TOUCH.at))} fill="#FFB000" opacity={n2(0.9 * (1 - ringT))} />
      </Svg>
    ) : null;
  return (
    <HfStage
      W={W}
      floor={{ pool: [0, 0, -0.6], poolR: 7 }}
      shadows={
        <>
          <FloorShadow W={W} pts={[[-1.5, 0, -0.43], [1.5, 0, -0.43], [1.5, 0, 0.43], [-1.5, 0, 0.43]]} uid="rsF" soft={0.3} reach={0.6} />
          <FloorShadow W={W} pts={[[-1.0, 0, 1.87], [2.0, 0, 1.87], [2.0, 0, 2.73], [-1.0, 0, 2.73]]} uid="rsB" soft={0.3} reach={0.6} />
          <FloorShadow W={W} pts={[add(BOX.c, [-0.48, 0, -0.35]), add(BOX.c, [0.48, 0, -0.35]), add(BOX.c, [0.48, 0, 0.35]), add(BOX.c, [-0.48, 0, 0.35])]} uid="boxS" soft={0.14} reach={0.25} />
          <FloorShadow W={W} pts={[[TRAY.x - 0.2, 0, FACE_Z - TRAY.d], [TRAY.x + 0.2, 0, FACE_Z - TRAY.d], [TRAY.x + 0.2, 0, FACE_Z], [TRAY.x - 0.2, 0, FACE_Z]]} uid="trS" amt={0.45} soft={0.3} reach={0.3} />
          {graderShadows(W, go, "gS")}
          <FloorShadow W={W} pts={robotFoot(a2.p, 0.23)} uid="r2S" soft={0.1} reach={0.18} />
          <FloorShadow W={W} pts={robotFoot(feet1, 0.23)} uid="r1S" soft={0.1} reach={0.18} />
        </>
      }
    >
      {items.map((it) => it.el)}
      {ring}
      {draw > 0 ? (
        <Svg id="thread" glow={0.8}>
          <Thread pts={tPts} w={0.035 * kTh} draw={draw} />
          <circle cx={n2(tPts[0][0])} cy={n2(tPts[0][1])} r={n2(0.05 * W.scaleAt(tA))} fill="#FFB000" />
        </Svg>
      ) : null}
    </HfStage>
  );
};

export default AdminOnTheCluster;
