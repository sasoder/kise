// ---------------------------------------------------------------------------
// StupidestPossibleSpecies (rsi-stupidest-species, cut 7), REVISION 1: THE STAIRS OF POSSIBLE SPECIES.
// Dwarkesh 3D style (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 220 frames. The world is this clip's
// stupidestStairs.tsx (written for this cut, reusable by C; STAIRS_READY.md); the human is covidFolk's Commuter v0,
// the chimp is W2's Chimp (stupidestFolk.tsx, read-only).
//
// CHECK LINE: "Line up every smart species that could ever exist: we are nowhere near the top - we are the lowest,
//   dimmest one that only just made it over the line where civilization starts."
//
// THE LINE: "Far from being the smartest possible biological species, we are probably better thought of as the
//   stupidest possible biological species capable of starting a technological civilization,"
// WORD -> FRAME: Far -4 · from 3 · being 6 · the 11 · smartest 15 · possible 25 · biological 31 · species 44 · we 65 ·
//   are 70 · probably 71 · better 77 · thought 84 · of 90 · as 95 · the 102 · stupidest 107 · possible 124 ·
//   biological 130 · species 142 · capable 154 · of 172 · starting 179 · a 186 · technological 190 · civilization 197
// DURATION: the slot 7.716 -> 16.892 s (sequence frames 185-405) = 220 frames (f0..f219).
//
// THE PICTURE: a long staircase of broad stone steps climbs away up and to the left into the bright high air. Each step
// above us holds one POSSIBLE species: a dashed orange outline figure with a glowing orange brain in its head, the body
// plans varied (slender, squat and broad, long-armed, crested), the heads growing fast and the brains brighter step by
// step (1.3 x the human's head on the first, domed 2.5-3 x and hot higher up), the top ones lost in the brightest haze.
// THE THRESHOLD of technological civilization is a row of small stone fire-bowls (a little cairn carrying a dish) along
// the front edge of the human's step, end to end and on out of frame with the step: cold stone with a faint cream rim
// until his fire lights them (the row reads as a line), then a line of small cream flames. The human (small, solid
// paint, the faintest mind-light in his head) stands on that step just behind the row; the chimp (fainter still) sits
// on the step below. No plates (the brief: try without first).
//
// THE MOTION (one continuous camera, a physical eye gliding down the stair at a constant distance):
//   f0-44   open high on the top figure in frame (step TOP_U, the biggest and brightest still clear of the haze); from
//           "from" the eye starts down the queue, gathering speed (peak ~f48) as the dashed species slide up past.
//   f65-102 the descent decelerates; the row of cold lamp bowls and the human behind it, the chimp below, come into view.
//   f104-147 settled on the human (~270 px): on "stupidest" he looks up at the much bigger species right above him
//           (f104-116, the camera tilts up a touch with him and back, f106-142), back down, then a small open-palms
//           shrug on "biological species" (f126-147). The chimp looks up at him.
//   f147-172 he crouches (facing the kindling beside him) and strikes two stones: sparks on f164 and f170; the second
//           falls into the kindling, an ember glows (f171), the fire catches and rises (f173-189, cream, never orange;
//           FIRE_SIZE 2.2 so the first flame reads at phone size).
//   f177-197 the lamp bowls kindle one after another outward from his fire both ways (f177 the nearest, f193 the
//           furthest, each a 4-frame flare that settles; all lit by "civilization", f197): the step edge becomes a line
//           of lights. Under it the camera pulls back a little (f150-206) to the resolved frame: the human ~210 px
//           around y 680-890, the fire, the chimp (~140 px) one step below, the lamp row across the frame at y ~900
//           (~88 px apart), four dashed species climbing away out of the top left.
//   f189-219 he stands up beside his fire (f189-201), hands out over it, then glances back up the stair at the queue
//           (f204-215); the chimp looks at the fire; the queue's glow breathes, the motes drift, a slow creep out.
// Cause before effect: stones -> spark -> ember -> flame -> the nearest lamps -> the row kindles outward.
// Orange = intelligence (the clip's rule): only the dashed species. The fire and the lamps are cream.
//
// CAMERA: stairCam specs (anchor, screen point, px per metre, the eye's distance and offset), interpolated by two
// designed lobes (each s(f) integrates t^A (1 - t)^B), log px/m; the descent's anchor runs down the queue's chest
// points (u = TOP_U -> 0), the pull-back keeps the human's chest and moves the spec. Plus the house sway (crop only).
// Checked per frame by scripts/clips/rsi-stupidest-species/check-stupidest-possible.ts (faces out of the bands and in
// the keep-in box from f107, the camera's speed profile, figure overlaps, the motes over faces; descent transits listed).
//
// SOURCES: Bostrom, Superintelligence (Oxford UP, 2014), ch. 2 (the quote as spoken). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirShadow, AirStage, WorldSvg, mixHex, swayCam, type AirView, type AirWorld, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as Covid from "../kyle-covid/covidFolk";
import { CHIMP_POSES, Chimp, chimpAnchors, type ChimpPose } from "./stupidestFolk";
import { Campfire, DashedSpecies, HeadGlow, LampRow, LightPool, inFront, lampXs, STAIRS, Spark, Stairs, U, speciesOf, stairCam, stairsAirOf, stepAnchor, stepOf, type StairCam, type StairCamSpec } from "./stupidestStairs";

export const FPS = 24000 / 1001;
export const DURATION = 220;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sst = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const m = (v: number) => v * U;

// ---- the cast's places ---------------------------------------------------------------------------------------------
/** the human on step 0 (his standing point), the kindling beside him (toward the chimp), the chimp on step -1 */
export const HUMAN_AT = stepAnchor(0, -0.25, STAIRS.STAND);
export const FIRE_AT = stepAnchor(0, 0.3, 0.5);
export const CHIMP_AT = stepAnchor(-1, -1.35, 1.05);
/** the chimp drawn a little over life size beside the man (a seated chimp reads ~0.6 of him, as the brief asks) */
export const CHIMP_SCALE = 1.2;
/** the queue: one species per step 1..TOP */
export const QUEUE = Array.from({ length: STAIRS.TOP }, (_, k) => k + 1);

// ---- the camera ----------------------------------------------------------------------------------------------------
/** the queue's chest point at a continuous step position u (0 = the human, k >= 1 = the k-th species) */
const chestAt = (u: number) => {
  const H = u >= 1 ? speciesOf(u).H : lerp(1.75, speciesOf(1).H, c01(u));
  const back = STAIRS.STAND;
  const s = stepOf(0);
  const X = s.XC - m(u * STAIRS.D) + (u < 1 ? (1 - u) * HUMAN_AT.X : 0);
  return { X, Y: -m(STAIRS.H0 + u * STAIRS.R + 0.58 * H), Z: m(u * STAIRS.T + back) };
};
export const TOP_U = 14;
type Spec = { u: number; sx: number; sy: number; pxm: number; dist: number; eyeRight: number; eyeUp: number };
export const OPEN: Spec = { u: TOP_U, sx: 560, sy: 820, pxm: 64, dist: 24, eyeRight: -1, eyeUp: -1.6 };
export const SETTLE: Spec = { u: 0, sx: 600, sy: 615, pxm: 150, dist: 8.5, eyeRight: -1, eyeUp: 1.6 };
export const RES: Spec = { u: 0, sx: 720, sy: 750, pxm: 124, dist: 8.5, eyeRight: -0.6, eyeUp: 1.2 };
/** the tilt up with his look at the species above (screen px added to the anchor's y), on "stupidest" and back */
export const TILT = { px: 46, up: [106, 120], down: [126, 142] };
export const LOBE1 = { A: 2.0, B: 2.7, F0: -10, F1: 126 };
export const LOBE2 = { A: 2.2, B: 2.4, F0: 150, F1: 206 };
/** slow creeps: in while settled (between the lobes) and out in the hold (fractions of px/m) */
export const CREEP = { settle: 0.03, hold: -0.02 };
const lobe = (L: { A: number; B: number; F0: number; F1: number }) => {
  const N = 1200;
  const tab = [0];
  const v = (i: number) => Math.pow(i / N, L.A) * Math.pow(1 - i / N, L.B);
  for (let i = 0; i < N; i++) tab.push(tab[i] + (v(i) + v(i + 1)) / 2);
  const T = tab.map((q) => q / tab[N]);
  return (f: number) => {
    const x = ((f - L.F0) / (L.F1 - L.F0)) * N;
    if (x <= 0) return 0;
    if (x >= N) return 1;
    const i = Math.floor(x);
    return T[i] + (T[i + 1] - T[i]) * (x - i);
  };
};
const s1Raw = lobe(LOBE1);
const S1_0 = s1Raw(0);
export const s1 = (f: number) => (s1Raw(f) - S1_0) / (1 - S1_0);
export const s2 = lobe(LOBE2);
const mixSpec = (a: Spec, b: Spec, t: number): Spec => ({
  u: lerp(a.u, b.u, t),
  sx: lerp(a.sx, b.sx, t),
  sy: lerp(a.sy, b.sy, t),
  pxm: Math.exp(lerp(Math.log(a.pxm), Math.log(b.pxm), t)),
  dist: lerp(a.dist, b.dist, t),
  eyeRight: lerp(a.eyeRight, b.eyeRight, t),
  eyeUp: lerp(a.eyeUp, b.eyeUp, t),
});
export const specAt = (f: number): Spec => {
  const a = mixSpec(OPEN, SETTLE, s1(f));
  const b = mixSpec(a, RES, s2(f));
  const creepIn = CREEP.settle * c01((f - 100) / (LOBE2.F0 + 20 - 100));
  const creepOut = CREEP.hold * c01((f - LOBE2.F1 + 14) / (DURATION - 1 - LOBE2.F1 + 14));
  const tilt = TILT.px * (sst(TILT.up[0], TILT.up[1], f) - sst(TILT.down[0], TILT.down[1], f));
  return { ...b, sy: b.sy + tilt, pxm: b.pxm * Math.exp(creepIn * (1 - s2(f)) + creepOut) };
};
export const camTrack = (f: number): StairCam => {
  const s = specAt(f);
  const a = chestAt(s.u);
  const spec: StairCamSpec = { X: a.X, Y: a.Y, Z: a.Z, sx: s.sx, sy: s.sy, pxm: s.pxm, dist: s.dist, eyeRight: s.eyeRight, eyeUp: s.eyeUp };
  return stairCam(spec);
};
export const camOf = (f: number): StairCam => {
  const c = camTrack(f);
  const w = swayCam(c, f);
  return { ...c, cx: w.cx, cy: w.cy };
};
const REST = camOf(0);
/** the motes' layout offset (y only), tuned by the check script so no front mote rides a face for long */
export const MOTE_OFFSET = { x: 0, y: 1.8 };
export const moteView = (v: AirView): AirView => ({ ...v, travel: { x: v.travel.x + MOTE_OFFSET.x, y: v.travel.y + MOTE_OFFSET.y, z: v.travel.z } });

// ---- the beats -------------------------------------------------------------------------------------------------------
export const CROUCH = { a: 147, b: 160 };
/** the strikes: contact frames, and each spark's life */
export const STRIKES = [164, 170];
export const SPARK_LIFE = 6;
/** the fire: the ember from the second spark landing (EMBER), the flames to full by FIRE.b */
export const FIRE = { ember: 171, a: 174, b: 189 };
export const FIRE_SIZE = 2.2;
export const fireAt = (f: number) => (f < FIRE.ember ? 0 : f < FIRE.a ? 0.12 * c01((f - FIRE.ember) / (FIRE.a - FIRE.ember)) : 0.12 + 0.88 * Math.pow(c01((f - FIRE.a) / (FIRE.b - FIRE.a)), 0.8));
/** THE THRESHOLD: a row of small stone fire-bowls along the front edge of his step (stupidestStairs LampRow), clear of
 *  his feet and his fire (the grid runs through the fire, so his fire takes the place of one lamp and he stands in the
 *  next). Cold until the fire has caught; on "technological civilization" they kindle one after another
 *  outward from his fire both ways at a constant speed (the nearest on f177, the furthest on KINDLE.last), each taking
 *  KINDLE.dur frames to flare and settle; all lit by "civilization" (f197) */
export const LAMP_XS = lampXs(
  [
    { x: HUMAN_AT.X, clear: 0.3 },
    { x: FIRE_AT.X, clear: 0.3 },
  ],
  FIRE_AT.X,
);
export const KINDLE = { first: 177, last: 193, dur: 4 };
const LAMP_D = LAMP_XS.map((x) => Math.abs(x - FIRE_AT.X));
const D_MIN = Math.min(...LAMP_D);
const D_MAX = Math.max(...LAMP_D);
export const lampStartAt = (k: number) => KINDLE.first + ((LAMP_D[k] - D_MIN) / (D_MAX - D_MIN)) * (KINDLE.last - KINDLE.first);
export const lampLitAt = (k: number, f: number) => c01((f - lampStartAt(k)) / KINDLE.dur);

// ---- the human ------------------------------------------------------------------------------------------------------
const HUMAN_KIND: Covid.CovidKind = "commuter";
/** standing: on "stupidest" he looks up at the much bigger species right above him (f106-118, the camera tilts up
 *  with him), back down (f122-128), then a small open-palms shrug (f126-146: up by 133, held, down by 146) on
 *  "biological species", then he crouches */
export const LOOKS = { up: [104, 116], back: [121, 128] };
export const SHRUG = { a: 126, up: 133, hold: 140, b: 147 };
const standPose = (frame: number): Covid.CovidPose => {
  const q = Covid.POSES.front();
  const up = sst(LOOKS.up[0], LOOKS.up[1], frame) - sst(LOOKS.back[0], LOOKS.back[1], frame);
  const yaw = lerp(-0.14, -0.4, up);
  const pitch = lerp(-2, -44, up);
  const look: P2 = [lerp(-0.1, -0.5, up), lerp(0, -1, up)];
  const sh = sst(SHRUG.a, SHRUG.up, frame) * (1 - sst(SHRUG.hold, SHRUG.b, frame));
  const base: Covid.CovidPose = { ...q, headYaw: yaw, pitch, look };
  if (sh <= 0) return base;
  const shrug: Covid.CovidPose = {
    ...base,
    armL: { w: [-78, -172], elbow: [-0.25, 1], fist: 0, hand: 46 },
    armR: { w: [78, -172], elbow: [0.25, 1], fist: 0, hand: -46 },
    hunch: 0.85,
    worry: 0.7,
    roll: (base.roll ?? 0) + 7,
    pitch: base.pitch - 4,
    look: [0.05, -0.05],
    headYaw: 0,
  };
  return Covid.lerpPose(base, shrug, sh);
};
/** squatting by the kindling (facing right), the near hand holding a stone low over it, the far hand striking */
const STRIKE_UP: P2 = [98, -118];
const STRIKE_HIT: P2 = [94, -70];
const strikeHand = (f: number): P2 => {
  // down to contact on each strike, back up between; rests at the hit point after the last one
  const s0 = 159;
  if (f <= s0) return STRIKE_UP;
  const hit = (a: number, b: number, t: number) => {
    const u = c01(t);
    return [lerp(a, b, u), 0] as const;
  };
  let y: number;
  if (f <= STRIKES[0]) y = hit(STRIKE_UP[1], STRIKE_HIT[1], Math.pow((f - s0) / (STRIKES[0] - s0), 1.8))[0];
  else if (f <= STRIKES[0] + 3) y = lerp(STRIKE_HIT[1], STRIKE_UP[1], sst(STRIKES[0], STRIKES[0] + 3, f));
  else if (f <= STRIKES[1]) y = hit(STRIKE_UP[1], STRIKE_HIT[1], Math.pow((f - STRIKES[0] - 3) / (STRIKES[1] - STRIKES[0] - 3), 1.8))[0];
  else y = lerp(STRIKE_HIT[1], -92, sst(STRIKES[1], STRIKES[1] + 6, f));
  const x = lerp(STRIKE_UP[0], STRIKE_HIT[0], c01((STRIKE_UP[1] - y) / (STRIKE_UP[1] - STRIKE_HIT[1])));
  return [x, y];
};
const crouchPose = (frame: number): Covid.CovidPose => {
  const q = Covid.POSES.sit(1, 22);
  const warm = sst(176, 188, frame);
  const glance = sst(200, 213, frame);
  const hand = strikeHand(frame);
  return {
    ...q,
    yaw: 0.86,
    headYaw: lerp(0.8, 0.25, glance),
    lean: 22 - 8 * warm,
    pitch: lerp(lerp(18, 10, warm), -18, glance),
    look: [lerp(0.55, -0.4, glance), lerp(0.55, -0.85, glance)],
    armL: { w: [lerp(92, 84, warm), lerp(-62, -84, warm)], elbow: [-0.2, 1], fist: lerp(0.95, 0.15, warm), hand: lerp(-20, 30, warm) },
    armR: { w: [lerp(hand[0], 92, warm), lerp(hand[1], -94, warm)], elbow: [-0.5, 0.8], fist: lerp(1, 0.15, warm), hand: lerp(6, 30, warm) },
  };
};
/** with the fire caught he stands up beside it (RISE), the near hand held out over the flames, looking down at it;
 *  then a glance back over his shoulder up the stair at the queue (GLANCE) */
export const RISE = { a: 189, b: 201 };
export const GLANCE = { a: 204, b: 215 };
const warmPose = (frame: number): Covid.CovidPose => {
  const q = Covid.POSES.turnTo(0.5);
  const g = sst(GLANCE.a, GLANCE.b, frame);
  return {
    ...q,
    headYaw: lerp(0.45, -0.25, g),
    pitch: lerp(12, -22, g),
    look: [lerp(0.5, -0.45, g), lerp(0.45, -0.85, g)],
    armL: { w: [104, -136], elbow: [-0.3, 1], fist: 0.05, hand: 40 },
    armR: { w: [84, -128], elbow: [-0.1, 1], fist: 0.05, hand: 36 },
    mouth: 0.3,
  };
};
export const humanPoseAt = (frame: number): Covid.CovidPose => {
  const t = sst(CROUCH.a, CROUCH.b, frame);
  const r = sst(RISE.a, RISE.b, frame);
  let q = t <= 0 ? standPose(frame) : t >= 1 ? crouchPose(frame) : Covid.lerpPose(standPose(frame), crouchPose(frame), t);
  if (r > 0) q = r >= 1 ? warmPose(frame) : Covid.lerpPose(q, warmPose(frame), r);
  return Covid.breathe(q, frame);
};
/** the ankles' screen drift between the stand and the squat, so the feet stay planted: shift `at` back by it */
const FEET_SHIFT = (() => {
  const a = Covid.covidAnchors(HUMAN_KIND, standPose(100), [0, 0], 1);
  const b = Covid.covidAnchors(HUMAN_KIND, crouchPose(170), [0, 0], 1);
  const ma = (a.ankleL[0] + a.ankleR[0]) / 2;
  const mb = (b.ankleL[0] + b.ankleR[0]) / 2;
  return mb - ma;
})();
export const humanAtShift = (frame: number) => -FEET_SHIFT * (sst(CROUCH.a, CROUCH.b, frame) - sst(RISE.a, RISE.b, frame));

// ---- the chimp ------------------------------------------------------------------------------------------------------
export const chimpPoseAt = (frame: number): ChimpPose => {
  const fireLook = sst(176, 190, frame);
  return CHIMP_POSES.sit(-1, frame, { headYaw: lerp(-0.62, -0.7, fireLook), look: [lerp(-0.7, -0.75, fireLook), lerp(-0.95, -0.35, fireLook)], pitch: lerp(-22, -8, fireLook) });
};

/** the faint light of a mind in the cast's heads: the human's the faintest of the minds on the stair, the chimp's
 *  fainter still */
export const HEAD_GLOW = { human: 0.2, chimp: 0.07 };

// ---- the scene --------------------------------------------------------------------------------------------------------
const HumanOnStep: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const X = HUMAN_AT.X + humanAtShift(frame);
  const at = P.p(X, HUMAN_AT.Y, HUMAN_AT.Z);
  const scale = P.r(HUMAN_AT.Z);
  const pose = humanPoseAt(frame);
  const fog = A.folkFog(HUMAN_AT.Z, -HUMAN_AT.Y);
  const an = Covid.covidAnchors(HUMAN_KIND, pose, at, scale);
  const crouched = sst(CROUCH.a + 6, CROUCH.b, frame);
  const stone = (p: P2, k: number) => <ellipse key={k} cx={p[0]} cy={p[1] + 3 * scale} rx={9 * scale} ry={6.5 * scale} fill={mixHex("#6B6157", "#3E372F", k * 0.5)} opacity={crouched} />;
  return (
    <g>
      <AirShadow A={A} X={X} Z={HUMAN_AT.Z} Y={HUMAN_AT.Y} w={62} d={30} uid="spsHs" amt={0.8} />
      <HeadGlow c={an.headC} rW={an.headR} amt={HEAD_GLOW.human} uid="spsHg" />
      <Covid.CovidFigure kind={HUMAN_KIND} variant={0} pose={pose} at={at} scale={scale} uid="spsHuman" fog={{ rgb: fog.rgb, amount: fog.amount }} unitPx={A.k} frame={frame} />
      {crouched > 0 ? [stone(an.mittenL, 0), stone(an.mittenR, 1)] : null}
    </g>
  );
};
/** the spark point: between the two stones at contact */
const sparkPoint = (A: AirWorld, frame: number): P2 => {
  const P = A.P;
  const at = P.p(HUMAN_AT.X + humanAtShift(frame), HUMAN_AT.Y, HUMAN_AT.Z);
  const an = Covid.covidAnchors(HUMAN_KIND, humanPoseAt(frame), at, P.r(HUMAN_AT.Z));
  return [(an.mittenL[0] + an.mittenR[0]) / 2, (an.mittenL[1] + an.mittenR[1]) / 2];
};

const StupidestPossibleSpecies: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = stairsAirOf({ cam, rest: REST, frame });
  const fire = fireAt(frame);
  const onStep = (i: number): React.ReactNode => {
    if (i >= 1) {
      if (!inFront(A, stepAnchor(i).Z)) return null;
      const sp = speciesOf(i);
      return <DashedSpecies A={A} at={stepAnchor(i)} H={sp.H} headR={sp.headR} glow={sp.glow} a={sp.a} frame={frame} uid={`spsQ${i}`} seed={i} shape={sp.shape} brain={sp.brain} />;
    }
    if (i === 0 && inFront(A, stepOf(0).Z0)) {
      const s0 = stepOf(0);
      return (
        <g>
          <LightPool A={A} X={HUMAN_AT.X + m(0.2)} Y={s0.Y} Z={HUMAN_AT.Z} rM={1.25} a={0.32} uid="spsPool" col={AIR.A.cream} />
          <Campfire A={A} X={FIRE_AT.X} Y={FIRE_AT.Y} Z={FIRE_AT.Z} t={fire} frame={frame} uid="spsFire" size={FIRE_SIZE} />
          <HumanOnStep A={A} frame={frame} />
          {STRIKES.map((f0, k) => (
            <Spark key={k} A={A} p={sparkPoint(A, f0)} t={(frame - f0) / SPARK_LIFE} r={A.P.r(HUMAN_AT.Z)} uid={`spsSp${k}`} seed={k + 1} drift={0.26} />
          ))}
          <LampRow A={A} xs={LAMP_XS} litOf={(k) => lampLitAt(k, frame)} frame={frame} uid="spsLamp" />
        </g>
      );
    }
    return null;
  };
  const cAt = A.P.p(CHIMP_AT.X, CHIMP_AT.Y, CHIMP_AT.Z);
  const cPose = chimpPoseAt(frame);
  const cAn = chimpAnchors(0, cPose, cAt, A.P.r(CHIMP_AT.Z) * CHIMP_SCALE);
  const chimp = !inFront(A, CHIMP_AT.Z) ? null : (
    <g>
      <HeadGlow c={cAn.headC} rW={cAn.headR} amt={HEAD_GLOW.chimp} uid="spsCg" />
      <Chimp variant={0} pose={cPose} at={cAt} scale={A.P.r(CHIMP_AT.Z) * CHIMP_SCALE} uid="spsChimp" fog={A.folkFog(CHIMP_AT.Z, -CHIMP_AT.Y)} unitPx={A.k} />
    </g>
  );
  return (
    <AirStage v={moteView(A.v)} bloom={0.22}>
      <WorldSvg cam={cam}>
        <Stairs A={A} onStep={onStep} uid="spsSt" afterLowAir={chimp} />
      </WorldSvg>
    </AirStage>
  );
};

export default StupidestPossibleSpecies;
