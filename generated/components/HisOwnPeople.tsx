import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, camScan, clamp01, makeTrack, screenOf, smoothstep, swayCam, worldOf } from "./incaShared";
import { camAt as nrbCamAt, DURATION as NRB_DURATION } from "./NotRockTheBoat";
import { GripNoble, NobleFist, type Reach } from "./hisOwnPeopleFigures";
import {
  CaptorHand,
  Emperor,
  HAND_AT,
  Label,
  NOBLES,
  POSE_HANG,
  PuppetString,
  STRING_W,
  StringsPage,
  TONE,
  WorldSvg,
  add,
  camOf,
  emperorAnchors,
  fistOf,
  mix2,
  mul,
  nobleRig,
  norm,
  outsideRank,
  rot,
  stringPts,
  sub,
  type Cam,
  type EmperorPose,
  type P2,
  type StringGeom,
} from "./stringsShared";

// ---------------------------------------------------------------------------
// HisOwnPeople (36_HisOwnPeople). Dwarkesh Patel with Si Sheppard, clip "Why
// captured emperors cooperated", round 2 of the strings set (stringsShared).
//   "In the end, it wasn't Cortés who disposed of him. It was his own people,
//   because they realized that he had sold them out and he had to go."
// Dwarkesh map style, "beyond maps" page. Opaque 1080x1920, 24 fps, 152 f.
// In-point 36.119 s, back to back with 31_NotRockTheBoat: f0 IS that cut's
// last frame (its camera, its level bar, its highlights carried on at
// T = f + 112). Local frame = round((t - 36.119) * 24):
//   In 1 · the 8 · end 10 · it 17 · WASN'T 18 · CORTÉS 26 · who 38 ·
//   DISPOSED 40 · of 51 · him 53 · It 54 · was 57 · his 60 · OWN 64 ·
//   PEOPLE 69-77 · because 77 · they 83 · REALIZED 88-99 · that 99 · he 103 ·
//   had 109 · SOLD 114 · them 124 · OUT 128 · and 133 · he 136 · had 139 ·
//   to 144 · GO 143-148; the line ends f150 (f150-f151 = safety tail).
//
// ACCENT: orange = the live hold, a string being pulled BY whoever pulls it.
// In this cut the pull changes direction: it starts coming from below.
//
// THE GESTURES (each with the words it serves; nothing else):
//   1. "In the end, it wasn't Cortés who disposed of him" f0-f52: the hand and
//      the level bar, unmoved; only the slow highlights going down the three
//      orange strings and a < 2 % creep. "CORTÉS" (already there) drops to the
//      0.55 rung over f30-f44. From f40 ("disposed") ONE glide down the
//      strings, past Moctezuma, to the nobles (f40-f72, all but arrived f66).
//   2. "It was his own people" f58-f79: the seven nobles across the frame
//      (k 1.2, the row round screen y 880), Moctezuma whole above them holding
//      their seven taut orange strings. As the camera settles each noble's
//      face lifts to him and he brightens 0.72 -> 1.0, outside-in, 2 f apart.
//   3. "because they realized" f73-f111: each noble raises a hand and takes
//      hold of his own string above his head (arm starts f73 + 3 x rank,
//      outside-in; closes f80, 83, 86, 89 "realized", 92, 95, 98). From the
//      grip the orange DIES upward: a dead-cream front runs up the string to
//      Moctezuma's fist (13 f) and the string, no longer held, sags.
//   4. "that he had sold them out" f103-f132: they pull. Each hand yanks down
//      (f103 + 2 x rank) and a NEW orange front runs UP from the grip, a bright
//      head leading it, the string snapping straight behind it; the first
//      reaches his fist at f114 ("sold"), the last at f128 ("out"). Each
//      arrival drags that fist down and inward and tips him forward (head
//      down, shoulders dropped, sinking on the strings above, which stretch).
//      The camera eases back and up a little (k 1.15): he, the seven strings,
//      the nobles, and the lower part of Cortés's three strings above him.
//   5. "and he had to go" f128-end: they haul (the hands come down to the
//      shoulder). The captor's three strings stretch and let go one after
//      another (left wrist f135, right wrist f138, head f141, "go" f143): each
//      goes dead from HIS end upward and whips back up out of frame. He comes
//      down, toppling, the seven orange strings shortening as they take him
//      in; on the last frame he is still falling, about halfway down to them.
// Built locally (stringsShared untouched): the level cross-bar inside the
// still gauntlet (NotRockTheBoat's, which does not export it), the noble with
// a raised arm and a lifted face (hisOwnPeopleFigures), the fronts.
// Camera: its own C1 track (velocity bumps, incaShared makeTrack) starting on
// NotRockTheBoat's camAt(112) + the house sway carried on at f + 112; the
// focus is the world point held at screen (540, 835).
// Sources (nothing of it on screen): Moctezuma's death, late June 1520: by
// the Spanish accounts (Cortés's Second Letter; Bernal Díaz, ch. 126) he was
// brought out to calm the Mexica and was struck by stones thrown by his own
// people; native accounts (Sahagún, book 12) blame the Spaniards. The picture
// follows the speaker's reading.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 152;

export const schema = z.object({
  vignette: z.number(),
  /** his free fall after the last string lets go, world px / f^2 */
  gravity: z.number(),
  /** how far he has toppled on the last frame, deg */
  topple: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, gravity: 1.4, topple: 24 });

// ---- NotRockTheBoat's end state (this cut's f0) ------------------------------
const T0 = NRB_DURATION - 1;
const NRB_END = nrbCamAt(T0);
/** the nobles as that cut left them: 6 % taller, cream 1.0 */
const GROW = 1.06;
const BAR = { half: 180, pivot: [HAND_AT[0], HAND_AT[1] + 14] as P2 };
const BAR_FILL = "#D3C5A2";
const BAR_L: P2 = [BAR.pivot[0] - 168, BAR.pivot[1] + 11];
const BAR_R: P2 = [BAR.pivot[0] + 168, BAR.pivot[1] + 11];
const BAR_C: P2 = [HAND_AT[0], HAND_AT[1] + 25];
const GLINT = "#FFF3D2";
/** that cut's highlights, carried on (T = f + 112): down the three strings from the hand; down his seven */
const NRB_LAND = [20, 18, 16, 14, 22, 24, 26];
const downGlint = (j: number, T: number): number | null => {
  const u = ((T - [78, 80.5, 83][j]) % 27) / 20;
  return u <= 1.1 ? u : null;
};
const mGlintDown = (i: number, T: number) => (((T - (NRB_LAND[i] + 5 + ((i * 5) % 7) * 3)) / 46) % 1) * 1.5 - 0.25;

// ---- the timeline ----------------------------------------------------------
const rank = (i: number) => outsideRank(i);
/** gesture 2: the face lifts, the figure brightens */
const DIM = 0.72;
const lookAt = (i: number, f: number) => smoothstep((f - (58 + 2 * rank(i))) / 9);
const toneAt = (i: number, f: number) => 1 - (1 - DIM) * smoothstep((f - 4) / 34) + (1 - DIM) * lookAt(i, f);
/** gesture 3: the arm starts, the hand closes on the string, the hold from above dies upward */
const ARM_F = 7;
const armStart = (i: number) => 73 + 3 * rank(i);
const gripF = (i: number) => armStart(i) + ARM_F;
const DIE_F = 13;
/** gesture 4: the yank, the orange front from below, its arrival at his fist */
const pullStart = (i: number) => 103 + 2 * rank(i);
const pullLen = (i: number) => 11 + rank(i) / 3;
const arrive = (i: number) => pullStart(i) + pullLen(i);
/** gesture 5: the haul; the captor's strings let go (left wrist, right wrist, head) */
const haulStart = (i: number) => 130 + 1.2 * rank(i);
const REL = { L: 135, R: 138, H: 141 };
const STRETCH0 = 128;

// ---- the camera (focus = the world point at screen (540, 835)) --------------
const WY0 = worldOf([540, 835], NRB_END)[1];
const LK0 = Math.log(NRB_END.k);
const ROW_Y = 1010; // the middle of the nobles' row (world)
const K2 = 1.22;
const K4 = 1.17;
const F2 = ROW_Y - (880 - 835) / K2;
const F4 = ROW_Y - (905 - 835) / K4;
const WY = makeTrack(
  [
    [-34, 34, -10, 1],
    [40, 72, F2 - 3 - (WY0 - 5), 0.5],
    [62, 104, 3, 1],
    [100, 132, F4 - F2, 0.9],
    [126, 176, 30, 1],
  ],
  WY0,
  -40,
  200,
);
const LNK = makeTrack(
  [
    [-34, 34, 0.036, 1],
    [40, 72, Math.log(K2) - 0.01 - (LK0 + 0.018), 0.5],
    [62, 104, 0.01, 1],
    [100, 132, Math.log(K4 / K2), 0.9],
    [126, 176, 0.03, 1],
  ],
  LK0,
  -40,
  200,
);
export const camAt = (f: number): Cam => camOf({ focus: [540, WY(f)], k: Math.exp(LNK(f)) });
export const scanG = () => camScan(camAt, 0, DURATION - 1, [[540, 184]]);

// ---- Moctezuma ---------------------------------------------------------------
const LEFT = [0, 1, 2, 3];
const RIGHT = [4, 5, 6];
const dragOf = (ids: number[], f: number) => ids.reduce((s, i) => s + smoothstep((f - arrive(i)) / 6), 0) / ids.length;
/** his pose, the body's drop and turn, and his anchors (WORLD px) at frame f */
const bodyAt = (f: number, gravity: number, topple: number) => {
  const dL = dragOf(LEFT, f);
  const dR = dragOf(RIGHT, f);
  const d = (dL * 4 + dR * 3) / 7;
  // let go: each arm is hauled down ahead of him
  const gL = smoothstep((f - REL.L) / 15);
  const gR = smoothstep((f - REL.R) / 15);
  const tH = Math.max(0, f - REL.H);
  const pose: EmperorPose = {
    ...POSE_HANG,
    nod: 0.4 * d + 0.35 * smoothstep((f - REL.L) / 12),
    slump: 0.12 + 0.22 * d,
    wristL: [POSE_HANG.wristL[0] + 30 * dL + 24 * gL, POSE_HANG.wristL[1] + 40 * dL + 68 * gL],
    wristR: [POSE_HANG.wristR[0] - 30 * dR - 24 * gR, POSE_HANG.wristR[1] + 40 * dR + 68 * gR],
    fistL: 0.6 + 0.4 * dL,
    fistR: 0.6 + 0.4 * dR,
  };
  const a = emperorAnchors(pose, "aztec");
  const pivot = a.headTop;
  // the strings above stretch (he sinks), then he falls free
  const dy = 12 * d + 16 * smoothstep((f - STRETCH0) / 8) + 12 * smoothstep((f - REL.L) / 7) + 0.5 * gravity * tH * tH;
  const tMax = DURATION - 1 - REL.H;
  const turn = -7 * smoothstep((f - REL.L) / 6) + 2.5 * smoothstep((f - REL.R) / 5) - (topple - 4.5) * (tH / tMax) ** 2;
  const xf = (p: P2): P2 => add(add(pivot, rot(sub(p, pivot), turn)), [0, dy]);
  return { pose, pivot, dy, turn, xf, d, headTop: xf(a.headTop), wristL: xf(a.wristL), wristR: xf(a.wristR), fistL: a.fistL, fistR: a.fistR, feet: xf(a.feet) };
};

// ---- the nobles' hands -------------------------------------------------------
const NR = nobleRig(0);
const CROWN_Y = NR.crown[1];
const scaleOf = (i: number) => NOBLES[i].s * GROW;
const crownOf = (i: number): P2 => [NOBLES[i].x, NOBLES[i].y + CROWN_Y * scaleOf(i)];
/** the arm that reaches: the one toward the middle, where his string comes from */
const armSide = (i: number) => (i < 3 ? 1 : -1);
const toLocal = (i: number, p: P2): P2 => [(p[0] - NOBLES[i].x) / scaleOf(i), (p[1] - NOBLES[i].y) / scaleOf(i)];
const toWorld = (i: number, p: P2): P2 => [NOBLES[i].x + p[0] * scaleOf(i), NOBLES[i].y + p[1] * scaleOf(i)];
/** how far up his string (world px from the knot on his head) the hand closes */
const GRIP_UP = 26;

/** one noble's string at frame f: the hand, the reach, the two stretches of string and their looks */
const stringAt = (i: number, f: number, fistFrom: P2) => {
  const sg = armSide(i);
  const crown = crownOf(i);
  const e = smoothstep((f - armStart(i)) / ARM_F);
  const gripped = f >= gripF(i);
  // where the hand meets the string, then the yank (beside the headdress), then the haul (to the shoulder)
  const G = add(crown, mul(norm(sub(fistFrom, crown)), GRIP_UP));
  const Q1 = toWorld(i, [sg * 15, CROWN_Y - 2]);
  const Q2 = toWorld(i, [sg * 20, NR.shY + 10]);
  const ePull = smoothstep((f - pullStart(i)) / 5);
  const eHaul = smoothstep((f - haulStart(i)) / 10);
  const rest = toWorld(i, [sg * (NR.hw + 4), NR.hipY + 4]);
  const swing = mix2(rest, G, e);
  const hand: P2 = gripped ? mix2(mix2(G, Q1, ePull), Q2, eHaul) : [swing[0] + sg * 15 * Math.sin(Math.PI * e), swing[1]];
  const reach: Reach = { sgn: sg, e, W: toLocal(i, hand) };
  const side = i <= 3 ? -1 : 1;
  if (!gripped) {
    const main: StringGeom = { from: fistFrom, to: crown, slack: 0, side };
    return { reach, main, stub: null, live: [0, 1] as [number, number], base: 1, soft: mGlintDown(i, f + T0), head: null as number | null, hand };
  }
  const die = clamp01((f - gripF(i)) / DIE_F);
  const q = clamp01((f - pullStart(i)) / pullLen(i));
  // dead: the string sags from the grip upward; pulled: it straightens behind the new front
  const sagTo = 0.34 * smoothstep(die * 2.2) * (1 - smoothstep(q * 4));
  const sagFrom = 0.34 * smoothstep(die * 1.4 - 0.4) * (1 - smoothstep(q * 1.25 - 0.1));
  const main: StringGeom = { from: fistFrom, to: hand, slack: [sagFrom, sagTo], side };
  const stub: StringGeom = { from: hand, to: crown, slack: 0.5 * Math.max(ePull, eHaul), side: -sg };
  const live: [number, number] = q > 0 ? [1 - q, 1] : [0, 1 - die];
  // once it is taut from below, a faint highlight runs up it (the pull's direction now)
  const up = f > arrive(i) + 2 ? 1.25 - (((f + i * 9.7) / 30) % 1) * 1.5 : null;
  return { reach, main, stub, live, base: TONE.dead, soft: up, head: q > 0 && q < 1 ? 1 - q : null, hand };
};

/** a captor's string: taut and orange until it lets go, then dead from his end upward, whipping back up */
const captorString = (from: P2, toNow: P2, toAtRelease: P2, rel: number, f: number, side: number) => {
  if (f < rel) return { g: { from, to: toNow, slack: 0, side } as StringGeom, live: [0, 1] as [number, number], base: 1, on: true };
  const t = f - rel;
  const up = 1 - (1 - clamp01(t / 10)) ** 2.4;
  const to = mix2(toAtRelease, [from[0] + side * 26, from[1] - 6], up);
  return { g: { from, to, slack: Math.min(1, 0.25 + t / 4), sag: 0.3, side } as StringGeom, live: [0, 1 - clamp01((t + 1) / 4)] as [number, number], base: TONE.dead, on: false };
};

const Glint: React.FC<{ g: StringGeom; u: number | null; k: number; half: number; op: number; lo?: number; hi?: number }> = ({ g, u, k, half, op, lo = 0, hi = 1 }) => {
  if (u === null) return null;
  const a = Math.max(lo, u - half);
  const b = Math.min(hi, u + half);
  if (b - a < 0.004) return null;
  const d = `M${stringPts(g, a, b)
    .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join("L")}`;
  return <path d={d} fill="none" stroke={GLINT} strokeOpacity={op} strokeWidth={(STRING_W / k) * 0.95} strokeLinecap="butt" />;
};

/** the engraved wooden cross-bar, level in the fist (NotRockTheBoat's bar at tilt 0) */
const LevelBar: React.FC = () => {
  const h = BAR.half;
  const L = { fill: "none", stroke: DARK, strokeLinecap: "round" as const };
  return (
    <g transform={`translate(${BAR.pivot[0]} ${BAR.pivot[1]}) rotate(0.000)`}>
      <path d={`M${-h},-12L${h},-12L${h + 3},0L${h},12L${-h},12L${-h - 3},0Z`} fill={BAR_FILL} stroke={DARK} strokeWidth={2.3} strokeLinejoin="round" />
      <path d={`M${-h + 8},-6Q${-h * 0.4},-8.5 0,-6T${h - 8},-6.5M${-h + 14},-0.5Q${-h * 0.5},2 ${-h * 0.1},-1T${h - 10},0M${-h + 6},5Q0,7 ${h - 6},5`} {...L} strokeWidth={0.95} strokeOpacity={0.6} />
      <path d={`M${-h + 4},8.5L${h - 4},8.5`} {...L} strokeWidth={2.2} strokeOpacity={0.22} />
      {[-1, 1].map((sg) => (
        <path key={sg} d={[-3.4, 0, 3.4].map((o) => `M${sg * (h - 12) + o},-13L${sg * (h - 12) + o},13`).join("")} {...L} strokeWidth={1.5} strokeOpacity={0.9} />
      ))}
    </g>
  );
};

/** where things are on screen (for the checks and the report) */
export const framing = (f: number) => {
  const cam = camAt(f);
  const b = bodyAt(f, defaultProps.gravity, defaultProps.topple);
  const sy = (p: P2) => Math.round(screenOf(p, cam)[1]);
  const hs = NOBLES.map((n, i) => 152 * scaleOf(i) * cam.k);
  return {
    k: +cam.k.toFixed(3),
    bar: sy([540, 184]),
    headTop: sy(b.headTop),
    fistL: sy(b.xf(b.fistL)),
    feet: screenOf(b.feet, cam).map(Math.round),
    turn: +b.turn.toFixed(1),
    dy: +b.dy.toFixed(1),
    nobleHead: [sy(crownOf(0)), sy(crownOf(3))],
    nobleFeet: [sy([0, NOBLES[0].y]), sy([0, NOBLES[3].y])],
    nobleH: [Math.round(Math.min(...hs)), Math.round(Math.max(...hs))],
    outerX: Math.round(screenOf([NOBLES[0].x - 31 * scaleOf(0), 0], cam)[0]),
  };
};

const HisOwnPeople: React.FC<Props> = ({ vignette, gravity, topple }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame + T0);
  const k = cam.k;
  const T = frame + T0;

  const b = bodyAt(frame, gravity, topple);
  const fistFrom = (i: number): P2 => {
    const L = fistOf(i) === "L";
    const j = L ? i - 1.5 : i - 5;
    const fist = L ? b.fistL : b.fistR;
    return b.xf([fist[0] + j * 2.4, fist[1] + 8]);
  };
  const ms = NOBLES.map((_, i) => stringAt(i, frame, fistFrom(i)));

  const relBody = { L: bodyAt(REL.L, gravity, topple), R: bodyAt(REL.R, gravity, topple), H: bodyAt(REL.H, gravity, topple) };
  const cs = [
    { ...captorString(BAR_C, b.headTop, relBody.H.headTop, REL.H, frame, -1), j: 0 },
    { ...captorString(BAR_L, b.wristL, relBody.L.wristL, REL.L, frame, -1), j: 1 },
    { ...captorString(BAR_R, b.wristR, relBody.R.wristR, REL.R, frame, 1), j: 2 },
  ];
  const labelOp = 1 - (1 - TONE.second) * smoothstep((frame - 30) / 14);

  return (
    <StringsPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        {NOBLES.map((_, i) => (
          <GripNoble key={i} i={i} bow={0} tone={toneAt(i, frame)} scale={scaleOf(i)} look={lookAt(i, frame)} reach={ms[i].reach} uid={`hop-n${i}`} />
        ))}
        <g transform={`translate(0 ${b.dy.toFixed(2)}) rotate(${b.turn.toFixed(3)} ${b.pivot[0].toFixed(2)} ${b.pivot[1].toFixed(2)})`}>
          <Emperor pose={b.pose} variant="aztec" tone={1} uid="hop-e" />
        </g>
        {ms.map((s, i) => {
          return (
            <g key={i}>
              {s.stub ? <PuppetString {...s.stub} base={TONE.dead} live={null} k={k} /> : null}
              <PuppetString {...s.main} base={s.base} live={s.live} highlight={s.soft} k={k} />
              <Glint g={s.main} u={s.head === null ? null : s.head + 0.022} k={k} half={0.022} op={0.95} lo={s.head ?? 0} />
              {s.reach.e > 0.02 ? <NobleFist i={i} scale={scaleOf(i)} tone={toneAt(i, frame)} reach={s.reach} /> : null}
            </g>
          );
        })}
        {cs.map((s) => {
          const u = s.on ? downGlint(s.j, T) : null;
          return (
            <g key={s.j}>
              <PuppetString {...s.g} base={s.base} live={s.live} highlight={u} k={k} />
              <Glint g={s.g} u={u} k={k} half={0.07} op={0.9} />
            </g>
          );
        })}
        {/* the bar, level inside the fist; the gauntlet never moves */}
        <LevelBar />
        <CaptorHand bar={0} tilt={0} at={HAND_AT} tone={1} uid="hop-h" />
      </WorldSvg>
      <Label text="CORTÉS" x={770} y={22} cam={cam} frame={T} f0={78} size={44} opacity={labelOp} />
    </StringsPage>
  );
};

export default HisOwnPeople;
