import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Bracket,
  DataFrame,
  INK,
  INK_HI,
  INK_LO,
  InkDiffuse,
  MLabel,
  MStage,
  MWetLine,
  M_TITLE_PX,
  ModelGlyph,
  PAPER,
  TargetSeal,
  clamp01,
  enterFrom,
  framePoints,
  huntPath,
  lerp,
  mCameraTrack,
  polyD,
  seedTargetPos,
  smoothstep,
  tileSeed,
} from "./mavenShared";
import type { Pt } from "./mavenShared";

// ---------------------------------------------------------------------------
// ContinuouslyCollect -- Bharat, "Project Maven's data problem" (ChinaTalk),
// cut C of five. 1920x1080, 24 fps, opaque. IN = 686 (sequence frame),
// DURATION = 133 (exact slot, no tail). SECOND PASS (director's review).
//
// LINE: "we have to continuously collect data and relevant data so then we
// could build some of those models."
// Local word frames: have 1 · to 6 · continuously 11-30 · collect 30 · data 42 ·
// and 53 · relevant 69 · data 76 · so 83 · then 93 · we 98 · could 101 ·
// build 103 · some 108 · of 112 · those 115 · models 119-127 · end 133.
//
// ONE MOTION: a collection loop that never stops turning; what it brings in
// changes from empty frames to frames with the target in them, and that is
// what finally builds the model. Accent: VERMILION = THE RELEVANT TARGET (solid
// seal = a target that is there; the bracket's dashed square = the target the
// model expects). Everything else is ink.
//
// THE MACHINE (world px = screen px at k 1; ring centre (960, 470), R 300):
// one conveyor turning clockwise at a steady 6.75 deg / frame (35 px / f).
// Frames come down a straight tangent lane from off-frame top-left, join the
// ring at 1 o'clock (300 deg), ride 285 deg round it, peel off its inside at
// 10:30 (225 deg) and spiral in to the model at the centre (10 f), shrinking
// to 45 % and diffusing on the way. Slots are 40.5 deg = 6 f apart, seven on
// the ring at once. Slot n joins the ring at f 46 + 6 n and reaches the model
// at f 98 + 6 n; slots < 0 are empty frames, slots >= 0 carry a solid red seal.
// Element types: the ring (+ lane), data frames (+ seal), the model glyph, the
// bracket, two labels.
//
// GESTURES (gesture -> word -> local frames)
// 1. THE LOOP -> "continuously" (11-30): the loop has been running before the
//    cut: at f0 seven empty frames ride the ring, which is 77 % written, the wet
//    tip just ahead of the leading frame; the line closes at 1 o'clock on f 12
//    and its bead dries away (f 12-24): from there the frames carry the turn.
// 2. COLLECT -> "collect" (30) / "data" (42): from f 4 a frame peels off at
//    10:30 every 6 f and spirals in to the model (arrivals f 14, 20, ... 92).
//    They are empty: the bracket keeps hunting over each small frame, finds
//    nothing, the frame diffuses like ink; the model's wash stays empty.
// 3. RELEVANT DATA -> "and relevant data" (53-83): frames coming down the lane
//    now carry a solid red seal (first one on the ring at f 46); by "relevant"
//    (69) four sealed frames follow the last empties round the ring: the
//    hand-over travelling round the loop is the beat. Label RELEVANT DATA lands
//    fully in on 69 (57-69), upper left, outside the lane.
// 4. BUILD -> "build" (103) ... "models" (119): sealed frames reach the model
//    at f 98, 104, 110, then every 6 f. Each frame's outline diffuses before it
//    is inside the inner ring; only its seal glides on into the bracket's
//    square. On the first the bracket stops hunting, centres and locks (f 90-98:
//    dashed expected square -> solid red); every seal after it merges into that
//    one square. The red-tinted wash rises a third per seal (full at f 118).
//    Label MODEL (under the glyph, inside the ring) is fully in on 119.
// 5. CAMERA: three superposed glides through the damped follower. Open a
//    little close on the left of the ring where the tip is closing and frames
//    peel in (k 1.13), glide 1 (f -10..40) pulls back to the whole ring (k 1.0),
//    glide 2 (36..92) a slow drift (k 1.03), glide 3 (80..150) creeps in on the
//    model (k ~1.10 on the last frame), tilting so the frames on the ring's
//    bottom stay above the caption line.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 133;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- geometry -----------------------------------------------------------------
const RX = 960;
const RY = 470;
const R = 300;
/** conveyor speed, deg / frame (clockwise on screen) */
const OMEGA = 6.75;
const DEG = Math.PI / 180;
const JOIN_A = 300; // 1 o'clock: the lane meets the ring
const PEEL_A = 585; // 10:30 (225 deg), 285 deg later: frames leave the ring's inside
const SLOT_F = 6;
const JOIN_S0 = 46; // slot 0 (the first sealed frame) joins the ring
const GLIDE_F = 10;
const FIRST_SLOT = -14; // the leading frame at f0
const TILE_W0 = 96;
const TILE_END = 0.45; // its scale by the model's inner ring
const U_INNER = 0.64; // glide progress at which it reaches the inner ring
const SEAL_W0 = 0.19 * TILE_W0;
const RING_PX = 5;
const TILE_PX = 3;
const MODEL_R = 120;
const MODEL_PX = 4.5;
const BRACKET_SIZE = 94;
/** the one red square at the centre: the bracket's own, and what every seal lands as */
const SEAL_C = 28;

const onRing = (a: number): Pt => ({ x: RX + R * Math.cos(a * DEG), y: RY + R * Math.sin(a * DEG) });
const JOIN = onRing(JOIN_A);
const LANE_DIR = { x: -Math.sin(JOIN_A * DEG), y: Math.cos(JOIN_A * DEG) }; // travel direction
const LANE_LEN = 900;
const LANE_PTS: Pt[] = [
  { x: JOIN.x - LANE_DIR.x * LANE_LEN, y: JOIN.y - LANE_DIR.y * LANE_LEN },
  { x: JOIN.x, y: JOIN.y },
];

const peelS = (n: number) => JOIN_S0 + SLOT_F * n + (PEEL_A - JOIN_A) / OMEGA;
const arriveS = (n: number) => peelS(n) + GLIDE_F;
const isRed = (n: number) => n >= 0;
const slotSeed = (n: number) => tileSeed(((n + 40) * 5 + 2) % 9, ((n + 40) * 3 + 1) % 4) + n * 7;
/** the ring's wet tip: 20 deg ahead of the leading frame, closing on the join at f ~12 */
const tipA = (S: number) => PEEL_A - OMEGA * (peelS(FIRST_SLOT) - S) + 20;
const CLOSE_S = (JOIN_A + 360 - tipA(0)) / OMEGA;

type SlotState = { x: number; y: number; scale: number; backing: number; diffuse: number; u: number; visible: boolean };
const slotAt = (n: number, S: number): SlotState => {
  const a = PEEL_A - OMEGA * (peelS(n) - S);
  if (a < JOIN_A) {
    const d = (JOIN_A - a) * DEG * R;
    return { x: JOIN.x - LANE_DIR.x * d, y: JOIN.y - LANE_DIR.y * d, scale: 1, backing: 1, diffuse: 0, u: 0, visible: d < LANE_LEN };
  }
  if (a <= PEEL_A) {
    const p = onRing(a);
    return { x: p.x, y: p.y, scale: 1, backing: 1, diffuse: 0, u: 0, visible: true };
  }
  const u = (S - peelS(n)) / GLIDE_F;
  const uc = clamp01(u);
  // spiral in: the radius eases to 0 (no radial speed at either end) while the
  // angle keeps turning at a speed that decays from the conveyor's to 0
  // (a sealed frame's seal dives into the square at speed; an empty frame settles)
  const r = R * (1 - (isRed(n) ? uc * uc * (2 - uc) : smoothstep(uc)));
  const th = PEEL_A + OMEGA * GLIDE_F * (uc - (uc * uc) / 2);
  // a sealed frame's outline is gone before the centre (only its seal goes on);
  // an empty one reaches the bracket small and diffuses under it
  const diffuse = isRed(n) ? clamp01((u - 0.56) / 0.42) : clamp01((u - 0.74) / 0.46);
  return {
    x: RX + r * Math.cos(th * DEG),
    y: RY + r * Math.sin(th * DEG),
    scale: lerp(1, TILE_END, smoothstep(uc / U_INNER)),
    backing: 1 - smoothstep((uc - 0.08) / 0.22),
    diffuse,
    u,
    visible: u < 1.25,
  };
};
/** slot n's seal: rides in the frame, then glides on alone into the centre square */
const sealOf = (n: number, st: SlotState) => {
  const tp = seedTargetPos(slotSeed(n));
  const off = st.scale * (1 - smoothstep((st.u - 0.45) / 0.55));
  const w = TILE_W0;
  return {
    x: st.x + (tp.tx - 0.5) * w * off,
    y: st.y + (tp.ty - 0.5) * w * 0.75 * off,
    side: lerp(SEAL_W0, SEAL_C, smoothstep(clamp01(st.u))),
  };
};

// --- the model's clocks ---------------------------------------------------------
/** the bracket locks as the first sealed frame's seal comes in (raw 0..1) */
const lockAt = (S: number) => clamp01((S - (arriveS(0) - 8)) / 8);
/** the model's wash: a third per seal, rising as each lands */
const fillAt = (S: number) => {
  let v = 0;
  for (let i = 0; i < 3; i++) v += (1 / 3) * smoothstep((S - (arriveS(i) - 1)) / 8);
  return v;
};
/** the bracket: hunting about the centre, then still on the centre once it has its target */
const bracketAt = (S: number): Pt => {
  const h = huntPath(7, S);
  const calm = 1 - smoothstep((S - (arriveS(0) - 12)) / 11);
  return { x: RX + h.x * 26 * calm, y: RY + h.y * 18 * calm };
};

// --- camera -------------------------------------------------------------------
const TRACK = mCameraTrack(
  { x: 880, y: 497, k: 1.13 },
  [
    { f0: -10, f1: 40, dx: 80, dy: -27, k: 1.0 },
    { f0: 36, f1: 92, k: 1.03 },
    { f0: 80, f1: 150, dy: 24, k: 1.12, warp: 0.9 },
  ],
  -16,
  DURATION + 2,
);
export const camAt = TRACK.camAt;

/** the written stretch of the ring ending at the tip, as a polyline */
const ringPoints = (S: number): Pt[] => {
  const a1 = tipA(S);
  const span = Math.min(a1 - JOIN_A, 359.4);
  const n = Math.max(2, Math.ceil(span / 2));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(onRing(a1 - span + (span * i) / n));
  return pts;
};

const TILE_BACK = (w: number) => polyD(framePoints(w, w * 0.75), true);

const Tile: React.FC<{ n: number; S: number; k: number }> = ({ n, S, k }) => {
  const st = slotAt(n, S);
  if (!st.visible) return null;
  const w = TILE_W0 * st.scale;
  const seal = sealOf(n, st);
  return (
    <g>
      {st.diffuse < 1 ? (
        <InkDiffuse u={st.diffuse} k={k} cx={st.x} cy={st.y}>
          {st.backing > 0.004 ? (
            <path d={TILE_BACK(w)} transform={`translate(${st.x.toFixed(3)} ${st.y.toFixed(3)})`} fill={PAPER} opacity={st.backing.toFixed(4)} />
          ) : null}
          <DataFrame x={st.x} y={st.y} w={w} k={k} seed={slotSeed(n)} strokePx={TILE_PX * lerp(1, 0.72, 1 - st.scale > 0 ? (1 - st.scale) / (1 - TILE_END) : 0)} />
        </InkDiffuse>
      ) : null}
      {isRed(n) && st.u < 1 ? <TargetSeal x={seal.x} y={seal.y} side={seal.side} k={k} /> : null}
    </g>
  );
};

const ContinuouslyCollect: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;

  const dry = smoothstep((S - CLOSE_S) / 12);
  const tip = onRing(tipA(S));
  const br = bracketAt(S);

  const riding: number[] = [];
  const inside: number[] = [];
  for (let n = FIRST_SLOT; n <= 14; n++) (S > peelS(n) ? inside : riding).push(n);

  return (
    <MStage S={S} cam={cam} rest={TRACK.last}>
      {/* the lane the frames are collected along (context) */}
      <MWetLine points={LANE_PTS} k={k} strokePx={RING_PX} rung={INK_LO} />
      {/* the loop: its last stretch written in wet ink, closing just ahead of the leading frame */}
      <MWetLine points={ringPoints(S)} k={k} strokePx={RING_PX} rung={INK_HI} wet={1 - dry} wetPx={130} />
      {dry < 0.995 ? (
        <g opacity={(1 - dry).toFixed(4)}>
          <circle cx={tip.x} cy={tip.y} r={(RING_PX * 3.4) / k} fill={INK} opacity={0.1} />
          <circle cx={tip.x} cy={tip.y} r={(RING_PX * 1.5) / k} fill={INK} />
          <circle cx={tip.x - (RING_PX * 0.54) / k} cy={tip.y - (RING_PX * 0.54) / k} r={(RING_PX * 0.42) / k} fill={PAPER} opacity={0.5} />
        </g>
      ) : null}

      {/* the model at the centre */}
      <ModelGlyph id="cc-model" x={RX} y={RY} r={MODEL_R} k={k} S={S} fill={fillAt(S)} tint={1} eye={false} strokePx={MODEL_PX} />

      {/* frames on the lane and the ring, then those spiralling in */}
      {riding.map((n) => (
        <Tile key={n} n={n} S={S} k={k} />
      ))}
      {inside.map((n) => (
        <Tile key={n} n={n} S={S} k={k} />
      ))}

      {/* the model's eye */}
      <Bracket x={br.x} y={br.y} size={BRACKET_SIZE} k={k} S={S} lock={lockAt(S)} sealSide={SEAL_C} strokePx={MODEL_PX} />

      <MLabel text="relevant data" x={690} y={118} k={k} px={M_TITLE_PX} anchor="end" appear={enterFrom(S, 57)} />
      <MLabel text="model" x={RX} y={RY + MODEL_R + 52} k={k} px={M_TITLE_PX} rung={INK_HI} appear={enterFrom(S, 106)} />
    </MStage>
  );
};

export default ContinuouslyCollect;
