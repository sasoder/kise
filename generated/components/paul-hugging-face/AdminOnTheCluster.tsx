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
//   f96-135 the other robot grips the white ADMIN key-badge standing in a card slot in the middle rack's front (f96-
//           104), pulls it out (f104-112), swings it round and holds it up to us (f110-124); orange spreads into it
//           from its mittens on "admin" (f112-121). Slight push-in on it.
//   f135-185 the camera eases right to the grader (cut B's machine at cut B's angle, flow "left", hood up): an orange
//           thread arcs from the cluster into its side opening (f144-156), orange runs from the plug (insides, arm,
//           body f156-170), the stamp comes down (contact f167) and prints a big orange tick, the belt steps the
//           ticked sheet up onto the tilted out-rack (f170-182); slow drift.
// CAUSE -> EFFECT: mitten on the rack f66 -> first lights f67; grip f104 -> the badge slides from f104; mittens on the
// badge -> orange from the grip f112; thread tip in the opening f156 -> orange from the plug f156; stamp contact f167 ->
// tick inked f167-168; belt f170 -> the sheet rides up.
// Orange = the AIs and what they have taken (lights, faceplates, badge, thread, grader); the rest off-white clay.
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
import { Decal, FloorShadow, HfStage, ROBOT_U, RobotAt, Svg, add, lerp, lerpV, mul, n2, ramp, robotFoot, sst, camAt, makeWorld, MATS, type CamKey, type P2, type V3, type World } from "./hfWorld";
import { AdminBadge, Grader, HFBox, OpenAIMark, RACK, RBox, Rack, Thread, beltSheets, boxFaces, graderPlugs, graderShadows, hfBoxGeom, sagPts, type CardFrame, type GraderOpts } from "./hfProps";

export const FPS = 24000 / 1001;
export const DURATION = 186;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ===================================================================================================================
// THE SET (metres, y up)
// ===================================================================================================================
/** the front row: three racks side by side, their slotted fronts (face "front", -z) toward us; a short row behind */
const FRONT = [-1.0, 0, 1.0].map((x) => [x, 0, 0] as V3);
const BACK = [-0.5, 0.5, 1.5].map((x) => [x, 0, 2.3] as V3);
const FACE_Z = -RACK.d / 2 - 0.006; // the front faces' plane
const LED = 2.1; // the unit lights' size (shared Rack prop)
const WARM = 0.5; // the taken faceplates' orange tint
/** the open Hugging Face box, as cut A left it */
const BOX = hfBoxGeom([-3.3, 0, -1.6], 0.9, 0.52, 0.64, -0.1);
/** the card slot in the middle rack's front, and the ADMIN key-badge (a key card standing in it, edge toward us) */
const SLOT: V3 = [-0.62, 1.08, FACE_Z];
const CARD = { w: 0.9, h: 0.523, out0: 0.4 };
/** the grader: cut B's machine (flow "left", the hood-door up), seen at cut B's angle in the end frame */
const GO: GraderOpts = { c: [3.55, 0, -1.25], s: 0.85, yaw: -0.55, flow: "left", door: "top", panel: 1, label: "GRADER" };
const BS = 1.18; // the robots' size (hero C)
/** the OpenAI fascia on top of the front row (the mark at its middle) */
const SIGN = { c: [0, RACK.h, -0.27] as V3, w: 3.0, h: 0.62, d: 0.12 };

// ===================================================================================================================
// THE CAMERA: close on the box, follow + pull back on the cluster, slight push-in on the badge, ease right to the
// grader, drift
// ===================================================================================================================
const KEYS: CamKey[] = [
  { f: -14, target: [-2.85, 0.5, -1.6], dist: 4.0, yaw: 0.12, pitch: 0.18, F: 1800, sy: 800 },
  { f: 36, target: [-2.0, 0.8, -1.3], dist: 5.6, yaw: 0.22, pitch: 0.2, sy: 780 },
  { f: 96, target: [-0.15, 1.15, -0.3], dist: 8.4, yaw: 0.4, pitch: 0.2, sy: 760 },
  { f: 126, target: [-0.55, 1.05, -1.0], dist: 5.6, yaw: 0.38, pitch: 0.2, sy: 740 },
  { f: 172, target: [2.2, 0.85, -1.2], dist: 9.6, yaw: 0.1, pitch: 0.42, sy: 740 },
  { f: 200, target: [2.26, 0.85, -1.2], dist: 9.3, yaw: 0.095, pitch: 0.42, sy: 740 },
];
/** the last lobe (review 2): the whole grader inside the keep-in box from ~f160 (centre-right, x ~330-1000), cut B's
 *  angle; blended in from f135 (zero velocity change there), so f0-135 are exactly the keys above */
const END_KEYS: CamKey[] = [
  ...KEYS.slice(0, 4),
  { f: 160, target: [2.7, 0.7, -2.0], dist: 11.75, yaw: 0.1, pitch: 0.42, sy: 760 },
  { f: 200, target: [2.8, 0.7, -2.0], dist: 11.6, yaw: 0.1, pitch: 0.42, sy: 760 },
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
/** the admin robot: to the middle rack, left of the card slot */
const W1: Walk = { p0: [-2.15, 0, -1.8], p1: [-0.3, 0, -0.95], f1: 66, stop: 12, seed: 0 };
/** the toucher: to the row's left end, its mitten on the first rack's end face near the front */
const W2: Walk = { p0: [-2.95, 0, -1.15], p1: [-2.02, 0, -0.32], f1: 58, stop: 12, seed: 1 };
/** the admin robot's second walk: badge held up, toward the grader (so it is still in at the left at the end) */
const W1B = { p0: W1.p1, p1: [0.42, 0, -1.3] as V3, f0: 130, f1: 183, acc: 9, dec: 11 };
/** distance fraction 0..1 and speed fraction 0..1 of a trapezoid walk (ease in over acc, out over dec) */
const trapAt = (w: typeof W1B, f: number) => {
  const T = w.f1 - w.f0;
  const t = Math.max(0, Math.min(T, f - w.f0));
  const area = T - w.acc / 2 - w.dec / 2;
  let a: number;
  let v: number;
  if (t < w.acc) {
    a = (t * t) / (2 * w.acc);
    v = t / w.acc;
  } else if (t < T - w.dec) {
    a = w.acc / 2 + (t - w.acc);
    v = 1;
  } else {
    const u = t - (T - w.dec);
    a = w.acc / 2 + (T - w.dec - w.acc) + u - (u * u) / (2 * w.dec);
    v = 1 - u / w.dec;
  }
  return { k: a / area, v: f <= w.f0 || f >= w.f1 ? 0 : v };
};
const TOUCH = { reach0: 57, contact: 66, at: [-RACK.w * 1.5 - 0.006, 1.0, -0.2] as V3 };
const GRIP = 104;
const c01r = (x: number) => Math.max(0, Math.min(1, x));

// the wave: every unit light lights by its distance from the touch (plus a little jitter)
const WAVE_SPEED = 0.072; // metres per frame
const lightOn = (p: V3, i: number, seed: number, f: number) => {
  const d = Math.hypot(p[0] - TOUCH.at[0], (p[1] - TOUCH.at[1]) * 0.8, p[2] - TOUCH.at[2]);
  const t = TOUCH.contact + 0.5 + d / WAVE_SPEED + (hash(seed * 13 + i) - 0.5) * 3;
  return sst(t, t + 4, f);
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
const mixP = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** the badge's frame at centre c, its plane at world yaw a (pi/2: edge toward us, standing in the slot; the camera's
 *  yaw: square to us). n points away from the camera side (the slab extrudes backward). */
const badgeFrame = (c: V3, a: number): CardFrame => {
  const u: V3 = [Math.cos(a), 0, -Math.sin(a)];
  const v: V3 = [0, 1, 0];
  const n: V3 = [Math.sin(a), 0, Math.cos(a)];
  return { c, u, v, n, w: CARD.w, h: CARD.h, tl: add(add(c, mul(u, -CARD.w / 2)), mul(v, CARD.h / 2)) };
};
/** a full-frame layer seen only inside a soft disc at (x, y) of radius r: orange spreading INTO a white thing */
const Spread: React.FC<{ x: number; y: number; r: number; soft: number; children: React.ReactNode }> = ({ x, y, r, soft, children }) => {
  if (r <= 0.5) return null;
  const m = `radial-gradient(circle ${n2(r + soft)}px at ${n2(x)}px ${n2(y)}px, #000 ${n2(Math.max(0, r - soft))}px, transparent ${n2(r + soft)}px)`;
  return <div style={{ position: "absolute", inset: 0, WebkitMaskImage: m, maskImage: m }}>{children}</div>;
};
/** convex hull of screen points (for the slot clip) */
const hull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const AdminOnTheCluster: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const W = cameraAt(frame);
  const camYaw = Math.atan2(W.f[0], W.f[2]);

  // ---- the toucher: walks, turns three-quarter to us (the rack at its right), lays its right mitten on the front ----
  const a2 = walkAt(W2, frame);
  const stand2: BotPose = BOT_POSES.turnTo(1.2, frame, W2.seed);
  const walk2 = BOT_POSES.walk(1, a2.clock, 1);
  let p2: BotPose = a2.v > a2.v0 * 0.45 ? walk2 : (lerpPose(walk2, stand2, sst(0.55, 1, 1 - a2.v / a2.v0)) as BotPose);
  if (frame > TOUCH.reach0 - 6) {
    const R = localOf(W, a2.p, W.project(TOUCH.at));
    const reach = botGripTo({ ...stand2, mouth: 0.7 }, { R });
    p2 = lerpPose(lerpPose(p2, stand2, sst(TOUCH.reach0 - 6, TOUCH.reach0, frame)) as BotPose, reach, sst(TOUCH.reach0, TOUCH.contact, frame)) as BotPose;
  }

  // ---- the admin robot: walks to the slot, grips the card, pulls it out, swings it round and holds it up -----------
  const a1 = walkAt(W1, frame);
  const b1 = trapAt(W1B, frame);
  const feet1 = frame <= W1B.f0 ? a1.p : lerpV(W1B.p0, W1B.p1, b1.k);
  const D1B = Math.hypot(W1B.p1[0] - W1B.p0[0], W1B.p1[2] - W1B.p0[2]);
  const walk1b = BOT_POSES.walk(1, (b1.k * D1B) / ADV + 3, 1);
  const walk1 = BOT_POSES.walk(1, a1.clock, 1);
  const stand1: BotPose = BOT_POSES.turnTo(-0.2, frame, 0);
  let p1: BotPose = a1.v > a1.v0 * 0.45 ? walk1 : (lerpPose(walk1, stand1, sst(0.55, 1, 1 - a1.v / a1.v0)) as BotPose);
  // the card: in the slot (edge toward us, CARD.out0 sticking out) -> slid out -> swung square to us, held up
  const pull = sst(GRIP, 112, frame);
  const carry = sst(110, 124, frame);
  const out = lerp(CARD.out0, CARD.w + 0.06, pull);
  const slotU: V3 = [0, 0, -1];
  const inSlotC = add(SLOT, mul(slotU, out - CARD.w / 2));
  const heldC: V3 = add(add(feet1, [0, 1.0, 0]), mul([W.f[0], 0, W.f[2]], -0.34));
  const cardC = lerpV(inSlotC, heldC, carry);
  const cardA = lerp(Math.PI / 2, camYaw, sst(110, 122, frame));
  const fr = badgeFrame(cardC, cardA);
  const onCard = (x: number, y: number) => W.project(add(add(cardC, mul(fr.u, x)), mul(fr.v, y)));
  const gL = onCard(CARD.w / 2 - 0.08, 0.08);
  const gR = onCard(CARD.w / 2 - 0.1, -0.16);
  if (frame >= 84) {
    const yaw = lerp(lerp(-0.2, -0.95, sst(84, 96, frame)), -0.1, sst(110, 124, frame));
    const turned: BotPose = { ...BOT_POSES.turnTo(yaw, frame, 0), mouth: lerp(0.4, 1, sst(112, 122, frame)) };
    const base: BotPose = b1.v > 0 ? (lerpPose(turned, { ...walk1b, mouth: 1 }, sst(0, 0.5, b1.v)) as BotPose) : turned;
    const held = { L: [-50, -150] as P2, R: [50, -154] as P2 };
    const L = mixP(localOf(W, feet1, gL), held.L, carry);
    const R = mixP(localOf(W, feet1, gR), held.R, carry);
    const grip = botGripTo(base, { L: mixP(localOf(W, feet1, gL), L, sst(100, 106, frame)), R });
    const reachT = sst(92, GRIP, frame);
    const q = lerpPose(base, grip, reachT) as BotPose;
    p1 = frame < 96 ? (lerpPose(p1, q, sst(84, 96, frame)) as BotPose) : q;
  }

  // ---- the racks and the grader, back to front by depth ----------------------------------------------------------
  type Item = { d: number; el: React.ReactNode };
  const items: Item[] = [];
  BACK.forEach((c, i) => {
    const seed = 20 + i;
    items.push({ d: W.depth(c), el: <Rack key={`b${i}`} W={W} c={c} uid={`rb${i}`} face="front" lit={(k, p) => lightOn(p, k, seed, frame)} led={LED} warm={WARM} /> });
  });
  FRONT.forEach((c, i) => {
    const seed = i;
    items.push({
      d: W.depth(c),
      el: (
        <React.Fragment key={`f${i}`}>
          <Rack W={W} c={c} uid={`rf${i}`} face="front" lit={(k, p) => lightOn(p, k, seed, frame)} led={LED} warm={WARM} />
          {i === 1 ? (
            <Svg id="slot">
              <RBox W={W} c={[SLOT[0], SLOT[1] - CARD.h / 2 - 0.07, FACE_Z - 0.02]} w={0.1} d={0.05} h={CARD.h + 0.14} r={0.02} mat={MATS.graphite} uid="slotP" ao={0.1} />
            </Svg>
          ) : null}
        </React.Fragment>
      ),
    });
  });

  // the OpenAI fascia on the row's top
  const sf = boxFaces(SIGN.c, SIGN.w, SIGN.h, SIGN.d).front;
  items.push({
    d: W.depth(add(SIGN.c, [0, 0, -0.3])),
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

  // the grader: the thread plugs into its side opening; orange runs from the plug; the stamp; the belt step
  const plug = graderPlugs(GO, 0.3)[1];
  const THREAD0 = 144;
  const THREAD1 = 156;
  const STAMP = 167;
  const press = ramp(frame, STAMP - 6, STAMP) * (1 - ramp(frame, STAMP + 1.5, STAMP + 8));
  const belt = ramp(frame, 170, 182);
  const sheets = beltSheets(belt, -2, 2, (i) => (i < 0 ? { mark: "x", markScale: 1.25 } : i === 0 ? { mark: "tick", ink: ramp(frame, STAMP - 0.5, STAMP + 1), orange: 1, markScale: 1.25, markWeight: 1.55, markStretch: 1.2 } : {}));
  const go: GraderOpts = { ...GO, stamp: press, belt, sheets, insides: ramp(frame, THREAD1, 161), arm: ramp(frame, 158, 165), body: ramp(frame, THREAD1 + 1, 170), from: plug, glow: 0.7 };
  items.push({ d: W.depth(GO.c), el: <Grader key="grader" W={W} o={go} uid="gC" /> });
  items.sort((a, b) => b.d - a.d);

  // ---- the badge: clipped to the part outside the rack face while it is in the slot; white -> orange from the grip -
  const inSlot = carry <= 0 && out < CARD.w + 0.02;
  let clip = "";
  if (inSlot) {
    const sIn = CARD.w / 2 - out; // the face plane's position along u from the centre (u points out of the rack)
    const pts: P2[] = [];
    for (const x of [sIn, CARD.w / 2 + 0.02])
      for (const y of [-CARD.h / 2 - 0.03, CARD.h / 2 + 0.03])
        for (const nn of [-0.02, 0.06]) pts.push(W.project(add(add(add(cardC, mul(fr.u, x)), mul(fr.v, y)), mul(fr.n, nn))));
    clip = `polygon(${hull(pts)
      .map((q) => `${n2(q[0])}px ${n2(q[1])}px`)
      .join(",")})`;
  }
  const gripS = mixP(gL, gR, 0.5);
  const cardR = frame < 112 ? 0 : 1.6 * CARD.w * W.scaleAt(cardC) * sst(112, 121, frame);
  const badge = (
    <>
      <AdminBadge W={W} fr={fr} uid="bW" orange={0} />
      {frame >= 121 ? (
        <AdminBadge W={W} fr={fr} uid="bO" orange={1} />
      ) : (
        <Spread x={gripS[0]} y={gripS[1]} r={cardR} soft={0.12 * W.scaleAt(cardC)}>
          <AdminBadge W={W} fr={fr} uid="bO" orange={1} />
        </Spread>
      )}
    </>
  );
  const front1 = carry > 0.45; // once swung round, the badge is in front of the robot

  // ---- the thread: from the last rack's top corner, arcing over the grader into its side opening ------------------
  const tA: V3 = [FRONT[2][0] + RACK.w / 2 - 0.06, RACK.h - 0.05, FACE_Z + 0.1];
  const tPts = sagPts(W, tA, plug, -1.1, 24);
  const kTh = W.scaleAt(plug);
  const draw = ramp(frame, THREAD0, THREAD1);

  // a robot well off the frame is not drawn (the bot's layers misplace when far outside the canvas)
  const onFrame = (p: V3) => {
    const q = W.project(add(p, [0, 0.7, 0]));
    return q[0] > -0.9 * W.scaleAt(p) && q[0] < 1080 + 0.9 * W.scaleAt(p);
  };
  const robot1 = !onFrame(feet1) ? null : (
    <Svg id="r1" glow={0.45}>
      <RobotAt W={W} p={feet1} pose={p1} uid="admin" size={BS} />
    </Svg>
  );
  const robot2 = !onFrame(a2.p) ? null : (
    <Svg id="r2" glow={0.4}>
      <RobotAt W={W} p={a2.p} pose={p2} uid="r2" variant={2} size={BS} />
    </Svg>
  );
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
  const badgeEl = inSlot ? <div style={{ position: "absolute", inset: 0, clipPath: clip }}>{badge}</div> : badge;
  return (
    <HfStage
      W={W}
      floor={{ pool: [0, 0, -0.6], poolR: 7 }}
      shadows={
        <>
          <FloorShadow W={W} pts={[[-1.5, 0, -0.43], [1.5, 0, -0.43], [1.5, 0, 0.43], [-1.5, 0, 0.43]]} uid="rsF" soft={0.3} reach={0.6} />
          <FloorShadow W={W} pts={[[-1.0, 0, 1.87], [2.0, 0, 1.87], [2.0, 0, 2.73], [-1.0, 0, 2.73]]} uid="rsB" soft={0.3} reach={0.6} />
          <FloorShadow W={W} pts={[add(BOX.c, [-0.48, 0, -0.35]), add(BOX.c, [0.48, 0, -0.35]), add(BOX.c, [0.48, 0, 0.35]), add(BOX.c, [-0.48, 0, 0.35])]} uid="boxS" soft={0.14} reach={0.25} />
          {graderShadows(W, go, "gS")}
          <FloorShadow W={W} pts={robotFoot(a2.p, 0.23)} uid="r2S" soft={0.1} reach={0.18} />
          <FloorShadow W={W} pts={robotFoot(feet1, 0.23)} uid="r1S" soft={0.1} reach={0.18} />
        </>
      }
    >
      <HFBox W={W} g={BOX} uid="hf" open={1} hinge="left" />
      {items.map((it) => it.el)}
      {robot2}
      {ring}
      {front1 ? null : badgeEl}
      {robot1}
      {front1 ? badgeEl : null}
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
