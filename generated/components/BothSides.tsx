// ---------------------------------------------------------------------------
// BothSides (file 13_BothSides; Dwarkesh Patel with Si Sheppard, "Texcoco").
// Dwarkesh map style, "beyond maps" umber page; the cast is texcocoFigures plus
// the two conquistadors of bothSidesFigures. Opaque 1080x1920, 23.976 fps,
// 126 frames (f0..f125). Continues GaveTheTitle: frame 0 = its last frame.
//
// CHECK LINE: "The brother who was passed over went straight to the Spaniards,
// so one royal family now stood on both sides of the war."
//
// THE LINE: "He immediately sides with them to get within his own family. His
// own family was on both sides of this war."
// WORD -> FRAME: He 0 · immediately 3 · sides 17 · with 25 · them 29 · to 35 ·
//   get 43 · within 51 · his 59 · own 63 · family 67 · His 78 · own 81 ·
//   family 83 · was 90 · on 93 · both 100 · sides 107 · of 113 · this 115 · war 118.
//
// THE MOTION (one move): the passed-over brother turns away from the crowning
// and walks off to the right (f0-f43), the camera travelling with him, to two
// Spaniards standing a short walk away; he turns back to face his brother,
// fist to his chest, and the captain's hand comes down on his shoulder (the
// gesture Moctezuma made to the other one). The camera pulls back to hold both
// groups facing each other across a gap; an ORANGE kin bracket draws itself
// from the crowned brother's head over the top to the other's (f76-f101), and a
// fine dashed line drops down the gap from its bar to the ground (f100-f114),
// the bar giving a few px under it. Then it holds, alive.
// Orange = Texcoco's own: the diadem and the kin bracket, nothing else. No text
// (the MOCTEZUMA label of the previous cut fades out over the first 8 frames).
//
// Everything is derived from GaveTheTitle's exported end state (GAVE_END), so
// the join stays exact whatever that cut's end framing is.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, DARK, INK, smoothstep } from "./incaShared";
import { DURATION as GAVE_DURATION, GAVE_END, GaveTableau, gaveState } from "./GaveTheTitle";
import { SPECS, figureAnchors, toLocal, type FigPose } from "./texcocoFigures";
import { FPS, Label, TexcocoPage, WALK, WorldSvg, makeCamera, poseTrack, shadeInk, track, walkPose, type P2 } from "./texcocoShared";
import { BEARER_STAND, CAPTAIN_STAND, Conquistador, conqRig, type ConqPose } from "./bothSidesFigures";
import { add, mix, mix2, mul, rot } from "./stringsMotion";

export { FPS };
export const DURATION = 126;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// LAYOUT, all of it measured from the previous cut's end state (world px)
// ---------------------------------------------------------------------------
const G0 = GAVE_DURATION - 1;
/** the size of the previous cut's MOCTEZUMA label (not exported there: keep in step with GaveTheTitle's <Label size>) */
const GAVE_LABEL_SIZE = 84;
const P0: FigPose = GAVE_END.b1.pose;
/** px per figure unit of the brother who walks */
const U = GAVE_END.b1.scale;
const [X0, Y0] = GAVE_END.b1.at;

// ---- the walk: a brisk step, the planted foot never sliding
const CYCLE = 20;
const STRIDE = 45;
const T = { go: 8, stop: 36, on: 45, tie: 76, tied: 101, cut: 100, cutDone: 114 };
const walkAmount = (f: number) => smoothstep((f - T.go) / 6) * (1 - smoothstep((f - T.stop) / 7));
/** frames' worth of full-speed walking done by frame f */
const WALKED = (() => {
  const out = [0];
  for (let f = 0; f < DURATION; f++) out.push(out[f] + (walkAmount(f) + walkAmount(f + 1)) / 2);
  return out;
})();
const ADV = WALK.advance(U, CYCLE, STRIDE);
const X1 = X0 + WALKED[DURATION] * ADV;

// ---- where the Spaniards stand (the brother ends in front of the captain)
const CAP_AT: P2 = [X1 + 116 * U, Y0 + 2 * U];
const CAP_S = U * 0.99;
const BEAR_AT: P2 = [X1 + 178 * U, Y0 - 5 * U];
const BEAR_S = U * 0.955;
const BEAR_INK = shadeInk(0.86);

// ---- brother 1: he turns away (the head leads), walks, turns back to face his brother
const WALK_BASE: FigPose = {
  ...P0,
  yaw: 1.2,
  headYaw: 1.25,
  pitch: 1,
  lean: 3,
  crouch: 0,
  brow: 0.85,
  lids: 0.1,
  mouth: -0.7,
  armL: { w: [-6, -152], elbow: [-0.6, 1], fist: 0.8, hand: 0 },
  armR: { w: [10, -152], elbow: [-0.6, 1], fist: 0.8, hand: 0 },
};
const STOOD: FigPose = {
  ...P0,
  yaw: -0.8,
  headYaw: -0.98,
  pitch: -8,
  roll: 0,
  lean: -1.2,
  crouch: 0,
  brow: 0.45,
  lids: 0,
  mouth: -0.25,
  armL: { w: [-32, -152], elbow: [-0.6, 1], fist: 0.5, hand: 0 },
  armR: { w: [1, -193], elbow: [1, 0.5], fist: 0.85, hand: -28 },
};
const b1Track = poseTrack([
  [0, P0],
  [5, { ...P0, yaw: -0.12, headYaw: 0.98, pitch: 9, lean: 2.6, crouch: 2.4, lids: 0.25, armL: { w: [-10, -151], elbow: [-0.5, 1], fist: 0.7, hand: 0 }, armR: { w: [14, -152], elbow: [0.2, 1], fist: 1, hand: 0 } }],
  [12, WALK_BASE],
  [39, { ...WALK_BASE, pitch: -1, brow: 0.7, mouth: -0.5 }],
  [46, { ...WALK_BASE, yaw: 0.1, headYaw: -0.5, pitch: -2, lean: 0.5, crouch: 2.2, brow: 0.6, lids: 0, mouth: -0.4, armL: { w: [-14, -152], elbow: [-0.6, 1], fist: 0.7, hand: 0 }, armR: { w: [14, -158], elbow: [0.6, 1], fist: 0.8, hand: 0 } }],
  [54, { ...STOOD, pitch: -5, armR: { w: [10, -180], elbow: [1, 0.7], fist: 0.85, hand: -16 } }],
  [63, STOOD],
  [125, { ...STOOD, pitch: -9.5, lean: -1.5 }],
]);
/** the previous cut's idle carried on, measured from its last frame (so f0 is that frame exactly) */
const idleOn = (q: FigPose, f: number, seed: number): FigPose => {
  const d = (per: number, ph: number) => Math.sin((G0 + f) / per + ph) - Math.sin(G0 / per + ph);
  return { ...q, hem: q.hem + 1.5 * d(10.5, seed * 2.1), roll: q.roll + 0.45 * d(16, seed * 1.3), lean: q.lean + 0.25 * d(21, seed * 0.7) };
};

// ---- Moctezuma's head comes round to watch him go, and stays on the other side
const mocHead = track([[0, 0], [10, 0], [36, 1], [125, 1]]);
// ---- the captain: his hand comes onto the brother's shoulder
const capOn = track([[T.on, 0], [58, 1]]);
const capHead = track([[0, -0.72], [30, -0.74], [56, -0.9], [125, -0.86]]);

// ---------------------------------------------------------------------------
// THE CAMERA: with him to the right, then back to hold both sides; a slow push to the end
// ---------------------------------------------------------------------------
const C0 = GAVE_END.cam;
const WORLD_L = GAVE_END.b0.at[0] - 67 * GAVE_END.b0.scale;
const WORLD_R = BEAR_AT[0] + 60 * BEAR_S;
const K_END = (1048 - 32) / (WORLD_R - WORLD_L);
const CX_END = (WORLD_L + WORLD_R) / 2;
/** the feet's screen y in the final wide, and the bracket bar's */
const FEET_SY = 1356;
const BAR_SY = 462;
const CY_END = Y0 - (FEET_SY - 960) / K_END;
const K_MID = Math.min(C0.k * 0.86, 0.94);
const camAt = makeCamera([
  { f: 0, k: C0.k, wx: C0.cx, wy: C0.cy, sx: 540, sy: 960 },
  { f: 5, k: C0.k * 0.997, wx: C0.cx + 12 * U, wy: C0.cy, sx: 540, sy: 960 },
  { f: 42, k: K_MID, wx: X1 + 44 * U, wy: mix(C0.cy, CY_END, 0.25), sx: 540, sy: 960 },
  { f: 94, k: K_END / 1.032, wx: CX_END, wy: CY_END, sx: 540, sy: 960 },
  { f: 125, k: K_END, wx: CX_END, wy: CY_END, sx: 540, sy: 960 },
]);
const BAR_Y = CY_END + (BAR_SY - 960) / K_END;
const GROUND_Y = Y0 + 30 * U;

// ---------------------------------------------------------------------------
// THE STATE AT A FRAME
// ---------------------------------------------------------------------------
const bothState = (f: number) => {
  const g = gaveState(G0 + f);
  // brother 1
  const w = WALKED[Math.max(0, Math.min(DURATION, Math.round(f)))];
  const b1At: P2 = [X0 + w * ADV, Y0];
  const b1Pose = walkPose(idleOn(b1Track(f), f, 2), Math.max(0, f - T.go) / CYCLE, walkAmount(f), STRIDE);
  const b1 = figureAnchors(SPECS.brother1, b1Pose, b1At, U);
  // Moctezuma: only his head turns (his hand stays on the crowned shoulder)
  const mh = mocHead(f);
  const mocPose: FigPose = { ...g.moc.pose, headYaw: mix(g.moc.pose.headYaw, 0.5, mh), pitch: mix(g.moc.pose.pitch, -2, mh), brow: mix(g.moc.pose.brow, 0.5, mh), mouth: mix(g.moc.pose.mouth, -0.3, mh) };
  // the captain and the bearer
  const on = capOn(f);
  const rest = toLocal(add(b1.shoulderR, [15 * U, 3 * U]), CAP_AT, CAP_S);
  const farW = add(mix2(CAPTAIN_STAND.far.w, rest, on), [-10 * Math.sin(Math.PI * on), -8 * Math.sin(Math.PI * on)]);
  const farElbow: P2 = [mix(-0.3, 0.5, on), 1];
  // the hand lies along the shoulder, whatever the forearm's angle
  const fore = conqRig("captain", { ...CAPTAIN_STAND, lean: -1.6 * on, far: { w: farW, elbow: farElbow, fist: 0, hand: 0 } }).far.dir;
  let turn = 168 - (Math.atan2(fore[1], fore[0]) * 180) / Math.PI;
  turn -= 360 * Math.round(turn / 360);
  const capPose: ConqPose = {
    ...CAPTAIN_STAND,
    headYaw: capHead(f) + 0.02 * Math.sin(f / 19),
    pitch: mix(-3, 3, on),
    roll: 0.5 * Math.sin(f / 17 + 1),
    lean: -1.6 * on + 0.25 * Math.sin(f / 23),
    far: {
      w: farW,
      elbow: farElbow,
      fist: mix(0.35, 0.1, on),
      hand: turn * smoothstep(on),
    },
  };
  const bearPose: ConqPose = { ...BEARER_STAND, headYaw: -0.68 + 0.03 * Math.sin(f / 21 + 2), roll: 0.5 * Math.sin(f / 15), lean: 0.3 * Math.sin(f / 25 + 1), wave: f / 5.2 };
  // the kin bracket: from the point of the diadem on one head to the topknot of the other
  const b0 = figureAnchors(SPECS.brother0, g.b0.pose, g.b0.at, g.b0.scale);
  const dy = Math.sin(g.diadem.yaw);
  const tip0 = add(g.diadem.at, rot(mul([17.5 * dy * Math.abs(dy), -61 - 2 * Math.abs(dy)], g.diadem.scale), g.diadem.rot));
  const tip1 = add(b1.crown.at, rot(mul([-5 * Math.sin(b1Pose.headYaw), -58], b1.crown.scale), b1.crown.rot));
  const gapX = mix(g.moc.at[0] + 58 * g.moc.scale, b1At[0] - 44 * U, 0.5);
  return {
    g: { ...g, cam: camAt(f), b1: { pose: b1Pose, at: b1At, scale: U }, moc: { ...g.moc, pose: mocPose } },
    cam: f <= 0 ? C0 : camAt(f),
    capPose,
    bearPose,
    b0Head: b0.headC,
    from: add(tip0, [0, -11 * U]) as P2,
    to: add(tip1, [0, -10 * U]) as P2,
    gapX,
  };
};

// ---------------------------------------------------------------------------
// THE KIN BRACKET AND THE CUT DOWN THE MIDDLE
// ---------------------------------------------------------------------------
const Bracket: React.FC<{ from: P2; to: P2; gapX: number; p: number; sag: number }> = ({ from, to, gapX, p, sag }) => {
  if (p <= 0.0005) return null;
  const r = 10 * U;
  const d =
    `M${from[0].toFixed(1)},${from[1].toFixed(1)}L${from[0].toFixed(1)},${(BAR_Y + r).toFixed(1)}Q${from[0].toFixed(1)},${BAR_Y.toFixed(1)} ${(from[0] + r).toFixed(1)},${BAR_Y.toFixed(1)}` +
    `Q${gapX.toFixed(1)},${(BAR_Y + 2 * sag).toFixed(1)} ${(to[0] - r).toFixed(1)},${BAR_Y.toFixed(1)}Q${to[0].toFixed(1)},${BAR_Y.toFixed(1)} ${to[0].toFixed(1)},${(BAR_Y + r).toFixed(1)}L${to[0].toFixed(1)},${to[1].toFixed(1)}`;
  const dash = `${p.toFixed(5)} 2`;
  const W = 4.9 * U;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} pathLength={1} strokeDasharray={dash} stroke={DARK} strokeOpacity={0.7} strokeWidth={W + 3.4 * U} />
      <path d={d} pathLength={1} strokeDasharray={dash} stroke={ACCENT_DEEP} strokeWidth={W} />
      <path d={d} pathLength={1} strokeDasharray={dash} stroke={ACCENT} strokeWidth={W * 0.62} />
    </g>
  );
};
const Divide: React.FC<{ x: number; y0: number; p: number }> = ({ x, y0, p }) => {
  if (p <= 0.0005) return null;
  const y1 = mix(y0, GROUND_Y, p);
  const on = 9.5 * U;
  const off = 7 * U;
  const segs: [number, number][] = [];
  for (let y = y0; y < y1; y += on + off) segs.push([y, Math.min(y + on, y1)]);
  const d = segs.map(([a, b]) => `M${x.toFixed(1)},${a.toFixed(1)}L${x.toFixed(1)},${b.toFixed(1)}`).join("");
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={DARK} strokeOpacity={0.55} strokeWidth={5.2 * U} />
      <path d={d} stroke={INK} strokeOpacity={0.95} strokeWidth={2.7 * U} />
    </g>
  );
};

const BothSides: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const s = bothState(frame);
  const cam = s.cam;
  const fade = smoothstep(frame / 8);
  const pTie = smoothstep((frame - T.tie) / (T.tied - T.tie));
  const pCut = smoothstep((frame - T.cut) / (T.cutDone - T.cut));
  const sag = 4.2 * U * pCut;
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Conquistador kind="bearer" pose={s.bearPose} at={BEAR_AT} scale={BEAR_S} ink={BEAR_INK} uid="bs-be" />
          <Conquistador kind="captain" pose={s.capPose} at={CAP_AT} scale={CAP_S} arms="near" uid="bs-ca" />
          <GaveTableau s={s.g} />
          <Conquistador kind="captain" pose={s.capPose} at={CAP_AT} scale={CAP_S} body={false} arms="far" uid="bs-cf" />
          <Divide x={s.gapX} y0={BAR_Y + sag * 0.9 + 9 * U} p={pCut} />
          <Bracket from={s.from} to={s.to} gapX={s.gapX} p={pTie} sag={sag} />
        </WorldSvg>
        <Label text="MOCTEZUMA" x={GAVE_END.label[0]} y={GAVE_END.label[1]} cam={cam} frame={99} f0={0} size={GAVE_LABEL_SIZE} opacity={1 - fade} dy={18 * fade} />
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default BothSides;

/** review sheet: the two conquistadors large (frame 0) */
export const BothSidesSheet: React.FC = () => {
  const cam = { k: 1, cx: 540, cy: 960 };
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Conquistador kind="bearer" pose={{ ...BEARER_STAND, wave: 1 }} at={[760, 1500]} scale={3.2} uid="sh-be" />
          <Conquistador kind="captain" pose={CAPTAIN_STAND} at={[330, 1500]} scale={3.2} uid="sh-ca" />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
