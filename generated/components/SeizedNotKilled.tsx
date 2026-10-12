// ---------------------------------------------------------------------------
// SeizedNotKilled (file 3_SeizedNotKilled; Dwarkesh Patel with Si Sheppard,
// "Capture, not kill"). Dwarkesh map style, the umber "page" (no map): engraved
// figures. Opaque 1080x1920, 23.976 fps.
//
// CHECK LINE: "The Aztec warriors had Cortes flat on the ground under their
// raised clubs, and instead of striking they lowered them and grabbed him to
// haul him off alive."
//
// THE MOTION (one move): Cortes (cream) is down on the ground from the first
// frame, propped on an elbow, one arm up to ward, his sword out of reach and
// his riderless horse bolting off behind him; four ORANGE warriors walk in from
// both frame edges and close a ring over him, their macuahuitls go up (highest
// f125-f146) and then come slowly down with no blow; two of them reach in, take
// him by the wrists (contact f236) and haul him up off the ground between them,
// and the whole party starts off to the right with him, alive. A slow camera
// push runs through it and drifts with the procession at the end.
// Orange = the Aztec side (the warriors); cream = Cortes, his horse, his sword.
// The only text is the name CORTES, on the word (f18).
//
// DURATION: sequence 3.670-14.723 s = 11.053 s x 23.976 = 265 frames (f0..f264).
// WORD -> FRAME: Cortes 18 · laying 49 · ground 63 · knocked 92 · horse 104 ·
//   But instead 114 · killing 125 · on the ground 137-146 · guarding 160 ·
//   advantage 188 · the Aztecs 201 · trying 221 · seize 234 · him 243.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { pchip, smoothstep } from "./incaShared";
import { CAST_SPECS, ORANGE, POSES, Warrior } from "./captureFigures";
import { CortesDown, FallenSword, GroundHatch, LooseHorse, cortesAnchors, type CortesPose } from "./seizedFigures";
import { mix, mix2, mul, norm, sub } from "./stringsMotion";
import { Figure, figureRig, toLocal, type ArmPose, type FigPose } from "./texcocoFigures";
import { FPS, Label, TexcocoPage, WALK, WorldSvg, idle, makeCamera, poseTrack, shadeInk, track, walkPose, type P2 } from "./texcocoShared";

export { FPS };
export const DURATION = 265;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
const T = {
  /** the name lands on its word */
  name: 18,
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
  far: { w: [-14, -204], elbow: [-1, 0.5], fist: 0, hand: 0 },
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
  far: { w: [-48, -214], elbow: [-1, 0.3], fist: 0.25, hand: 0 },
  near: { w: [150, -215], elbow: [1, 0.5], fist: 0.25, hand: 0 },
  legFar: { a: [-120, -12], knee: [0, -1], flex: -12 },
  legNear: { a: [-94, -12], knee: [0.1, -1], flex: -8 },
  brow: 0.9,
  lids: 0,
  mouth: -0.8,
};
const cortesKeys = cortesTrack([
  [0, PROP],
  [40, { ...PROP, hip: [3, -22], torso: 58, head: 24, headYaw: -0.86, far: { ...PROP.far, w: [10, -188] }, legNear: { ...PROP.legNear, a: [-90, -13] } }],
  [84, { ...PROP, hip: [5, -22], torso: 59, head: 32, headYaw: -0.6, far: { ...PROP.far, w: [34, -200] }, legNear: { ...PROP.legNear, a: [-86, -13] }, legFar: { ...PROP.legFar, a: [-126, -13] } }],
  [T.up, COWER],
  [T.hold, { ...COWER, torso: 64, far: { ...COWER.far, w: [60, -206] } }],
  [T.down - 6, PEER],
  [T.touch - 4, BOTH_UP],
  [T.touch, { ...BOTH_UP, torso: 41, far: { ...BOTH_UP.far, w: [-14, -206], fist: 0.1 }, near: { ...BOTH_UP.near, w: [124, -170], fist: 0.1 } }],
  [T.lifted, HAULED],
  [264, { ...HAULED, hip: [11, -71], torso: 24, far: { ...HAULED.far, w: [-47, -217] }, near: { ...HAULED.near, w: [151, -218] } }],
]);
const cortesAt = (f: number): P2 => [C_AT[0] + gone(f) * ADV, C_AT[1]];
const cortesPose = (f: number): CortesPose => {
  const q = cortesKeys(f);
  // alive: his chest and his head never quite still
  return { ...q, torso: q.torso + 0.5 * Math.sin(f / 9 + 1), head: q.head + 0.8 * Math.sin(f / 13) };
};

// ---------------------------------------------------------------------------
// THE WARRIORS
// ---------------------------------------------------------------------------
type Man = {
  id: string;
  dir: 1 | -1;
  /** where he stands in the ring, and the frame he gets there */
  at: P2;
  arrive: number;
  shield: boolean;
  /** which of Cortes' wrists he takes */
  takes?: "far" | "near";
  /** the frames his club starts up and starts down */
  rise: number;
  fall: number;
  seed: number;
  /** his own way of holding the club up: the fist this far forward (units), the club this much further back (deg) */
  fwd: number;
  tilt: number;
};
const MEN: Man[] = [
  { id: "w2", dir: -1, at: [524, 1138], arrive: 82, shield: false, takes: "far", rise: 100, fall: 150, seed: 2, fwd: 22, tilt: 14 },
  { id: "w3", dir: 1, at: [304, 1142], arrive: 76, shield: true, rise: 98, fall: 153, seed: 3, fwd: 30, tilt: 2 },
  { id: "w1", dir: -1, at: [888, 1150], arrive: 96, shield: false, takes: "near", rise: 103, fall: 156, seed: 1, fwd: 58, tilt: 10 },
  { id: "w4", dir: 1, at: [100, 1176], arrive: 99, shield: true, rise: 105, fall: 151, seed: 4, fwd: 54, tilt: 16 },
];
const stopAmount = (m: Man, f: number) => 1 - smoothstep((f - (m.arrive - 9)) / 9);
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
const manAt = (m: Man, f: number): P2 => {
  const left = WALKED[m.id][DURATION] - walked(m, f);
  return [m.at[0] - m.dir * left * ADV + gone(f) * ADV, m.at[1]];
};
/** the near arm hanging free (the two who will take him carry no shield) */
const freeArm = (dir: 1 | -1): ArmPose => POSES.stand(dir)[dir === 1 ? "armL" : "armR"];
const manTrack = (m: Man) => {
  const d = m.dir;
  const nearKey = d === 1 ? "armL" : "armR";
  const base = (q: FigPose): FigPose => (m.shield ? q : { ...q, [nearKey]: freeArm(d) });
  const farKey = d === 1 ? "armR" : "armL";
  const arm = (w: P2, elbow: P2, hand: number): ArmPose => ({ w: [d * w[0], w[1]], elbow: [d * elbow[0], elbow[1]], fist: 1, hand: d * hand });
  // carried on the way in: the club at his side, its blade ahead and down
  const low: FigPose = { ...base(POSES.clubLow(d)), [farKey]: arm([30, -152], [-0.6, 1], 92) };
  // the club up over him: the arm out in front of his face, so the fist does not hide behind his head
  const up: FigPose = { ...base(POSES.clubRaised(d)), [farKey]: arm([m.fwd, -322], [1, -0.3], 82 - 0.4 * m.tilt) };
  const over: FigPose = { ...low, lean: d * 5, pitch: 12, brow: 0.6 };
  const upLate: FigPose = { ...up, lean: up.lean - d * 2.5, pitch: 8, brow: 1, [farKey]: arm([m.fwd - 4, -328], [1, -0.3], 78 - 0.4 * m.tilt) };
  // ... and down at his side, the blade to the ground
  const down: FigPose = { ...low, lean: d * 9, crouch: 5, pitch: 14, brow: 0.3, mouth: 0, [farKey]: arm([26, -150], [-0.6, 1], 112) };
  const keys: [number, FigPose][] = [
    [0, low],
    [m.arrive - 6, low],
    [m.rise, over],
    [T.up, { ...up, pitch: 8 }],
    [T.hold, upLate],
    [m.fall, upLate],
    [T.down, down],
  ];
  if (m.takes) {
    keys.push([T.touch, { ...down, lean: d * (m.takes === "far" ? 2 : 16), crouch: m.takes === "far" ? 4 : 14, pitch: 16, brow: 0.5 }]);
    keys.push([T.lifted, { ...down, lean: -d * 7, crouch: 9, pitch: 9, brow: 0.6 }]);
    keys.push([264, { ...down, lean: -d * 8, crouch: 8, pitch: 9, brow: 0.6 }]);
  } else {
    keys.push([T.touch, { ...down, lean: d * 2, crouch: 3, pitch: 15 }]);
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

/** the walk's legs and bob only (captureFigures' walkLegs, with this cut's stride) */
const walkLegs = (q: FigPose, phase: number, amount: number): FigPose => ({ ...walkPose(q, phase, amount, STRIDE), armL: q.armL, armR: q.armR });
const manPose = (m: Man, f: number, grab: P2 | null): FigPose => {
  const at = manAt(m, f);
  let q = TRACKS[m.id](f);
  // the walk in (forward) and the walk off: the two who hold him back away, facing him
  const wIn = stopAmount(m, f);
  const wOut = goAmount(f);
  const phIn = walked(m, f) / CYCLE + m.seed * 0.37;
  const phEnd = WALKED[m.id][DURATION] / CYCLE + m.seed * 0.37;
  const phOut = phEnd + (m.dir === 1 ? 1 : -1) * (gone(f) / CYCLE);
  if (wIn > 0.001) q = walkLegs(q, phIn, wIn);
  else if (wOut > 0.001) q = walkLegs(q, phOut, wOut);
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

// ---------------------------------------------------------------------------
// THE HORSE: bolting off to the left behind him, constant speed, gone by ~f125
// ---------------------------------------------------------------------------
const HORSE = { x0: 690, y: 640, v: 6.6, size: 270, stride: 11 };
const HORSE_INK = shadeInk(0.74);

// ---------------------------------------------------------------------------
// THE CAMERA: a slow push through the whole of it; it drifts off with the party
// ---------------------------------------------------------------------------
const END_DX = gone(264) * ADV;
const camAt = makeCamera([
  { f: 0, k: 0.97, wx: 562, wy: 938, sx: 540, sy: 960 },
  { f: 60, k: 0.985, wx: 556, wy: 928, sx: 540, sy: 960 },
  { f: 104, k: 1.0, wx: 548, wy: 906, sx: 540, sy: 960 },
  { f: T.up, k: 1.01, wx: 544, wy: 888, sx: 540, sy: 960 },
  { f: T.hold, k: 1.04, wx: 546, wy: 892, sx: 540, sy: 960 },
  { f: T.down, k: 1.065, wx: 538, wy: 922, sx: 540, sy: 960 },
  { f: T.touch, k: 1.075, wx: 536, wy: 928, sx: 540, sy: 960 },
  { f: 264, k: 1.08, wx: 530 + END_DX, wy: 922, sx: 540, sy: 960 },
]);

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
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
  const horseX = HORSE.x0 - HORSE.v * f;
  const nameOut = smoothstep((f - 38) / 12);
  const draw = (id: string) => {
    const w = men.find((x) => x.m.id === id);
    if (!w) return null;
    return (
      <g key={id}>
        <GroundHatch x0={w.at[0] - 84} x1={w.at[0] + 84} y={w.at[1] + 16} depth={16} rows={3} seed={40 + w.m.seed} dark opacity={0.42} />
        <Warrior pose={w.pose} at={w.at} scale={SW} uid={`sz-${id}`} shield={w.m.shield} />
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          {/* the ground: a little hatching under the horse's run and under the fight */}
          <GroundHatch x0={-340} x1={1720} y={1176} depth={104} rows={7} seed={12} opacity={0.2} />
          {horseX > -320 ? (
            <>
              <GroundHatch x0={horseX - 130} x1={horseX + 130} y={HORSE.y + 8} depth={10} rows={2} seed={13} dark opacity={0.3} />
              <LooseHorse at={[horseX, HORSE.y]} size={HORSE.size} phase={f / HORSE.stride} uid="sz-horse" ink={HORSE_INK} />
            </>
          ) : null}
          {draw("w2")}
          {draw("w3")}
          {draw("w1")}
          {draw("w4")}
          <FallenSword at={[368, 1268]} scale={SC} turn={172} uid="sz-sword" />
          <GroundHatch x0={cAt[0] - 290 + 60 * lift} x1={cAt[0] + 250 - 80 * lift} y={cAt[1] + 12} depth={22} rows={4} seed={14} dark opacity={0.5 - 0.14 * lift} />
          <CortesDown pose={cPose} at={cAt} scale={SC} uid="sz-cortes" />
          {/* the hands that take him lie over him */}
          {f >= T.reach
            ? men
                .filter((w) => w.m.takes)
                .map((w) => <Figure key={w.m.id} spec={CAST_SPECS.warrior} pose={w.pose} at={w.at} scale={SW} uid={`sz-${w.m.id}-hand`} body={false} arms={w.m.dir === 1 ? "L" : "R"} ink={ORANGE} />)
            : null}
        </WorldSvg>
        <Label text="CORTÉS" x={C_AT[0] - 190} y={C_AT[1] - 176} cam={cam} frame={f} f0={T.name - 8} size={56} opacity={1 - nameOut} />
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
          <CortesDown pose={COWER} at={[300, 1300]} scale={1.5} uid="sh-c1" />
          <CortesDown pose={BOTH_UP} at={[800, 1300]} scale={1.5} uid="sh-c2" />
          <CortesDown pose={HAULED} at={[300, 1750]} scale={1.5} uid="sh-c3" />
          <FallenSword at={[900, 1700]} scale={1.8} turn={172} uid="sh-s" />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
