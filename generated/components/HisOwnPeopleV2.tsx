import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { camScan, clamp01, hash, makeTrack, pchip, screenOf, smoothstep, swayCam } from "./incaShared";
import { GripNoble, NobleFist, type Reach } from "./hisOwnPeopleFigures";
import { FallingEmperor } from "./hisOwnPeopleV2Figures";
import {
  HAND_AT,
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
  glintAt,
  mix,
  mix2,
  mul,
  nobleRig,
  norm,
  outsideRank,
  rot,
  stringPts,
  sub,
  vlen,
  type Cam,
  type EmperorPose,
  type P2,
  type StringGeom,
} from "./stringsShared";

// ---------------------------------------------------------------------------
// HisOwnPeopleV2 (38_HisOwnPeople). Dwarkesh Patel with Si Sheppard, clip "Why
// captured emperors cooperated", the strings set (stringsShared), ROUND 3: the
// editor trimmed the slot to 38.497-42.417 s and asked for the pull-down
// earlier and COMPLETE. Replaces 36_HisOwnPeople (HisOwnPeople.tsx, untouched).
//   "(In the end, it wasn't Cortés who disposed of him.) It was his own
//   people, because they realized that he had sold them out and he had to go."
// Dwarkesh map style, "beyond maps" page. Opaque 1080x1920, 24 fps, 97 f.
// Local frame = round((t - 38.497) * 24):
//   was 0 · his 3 · OWN 7 · PEOPLE 12-20 · because 20 · they 26 ·
//   REALIZED 31-42 · that 42 · he 46 · had 51 · SOLD 57 · them 67 · OUT 71 ·
//   and 76 · he 79 · had 82 · to 86 · GO 86-91; the line ends f94.
//
// ACCENT: orange = the live hold, a string being pulled BY whoever pulls it.
// Here the pull changes direction (it comes from below), and at the end there
// is nothing left to pull: no orange at all.
//
// It does not join the cut before it (the speaker is in between): it opens on
// state E3's cast framed on its lower two thirds, the nobles re-laid larger
// and nearer (their own row, x 60..1020 on screen): Moctezuma hanging in the
// upper part of frame (455 px), the lower ends of Cortés's three orange
// strings above him, his seven taut orange strings down to the nobles.
//
// THE GESTURES (each with the words it serves; nothing else):
//   1. "It was his own people" f0-f22: already moving at f0: the nobles' faces
//      lift and each raises a hand and takes hold of his own string above his
//      head (outside-in, 2 f apart: closed f2 .. f14; "own" f7, "people" f12).
//      From each grip the orange DIES upward: a dead-cream front runs up to
//      Moctezuma's fist (8 f; the last is done f22) and the string sags.
//   2. "because they realized" f20-f44: they pull. Each hand yanks down
//      (f20 + 1.5 x rank) and a NEW orange front runs UP from the grip, a
//      bright head leading it, the string snapping straight behind it; the
//      first reaches his fist f29, the last f40. Each arrival drags that fist
//      down and inward; his head goes down, his shoulders drop, he sinks, and
//      the three captor strings above him stretch taut and thin.
//   3. "that he had sold them out" f44-f72: they haul him down. The captor's
//      strings let go at f46 (left wrist), f50 (right wrist), f54 (head): each
//      goes dead from HIS end and whips back up. He comes down as a body: he
//      swings on what still holds him, the freed arm is drawn down ahead of
//      him, then the legs give and fold under him, the cloak's hem lifts, the
//      head lags back and then drops (pose keys f40, f46, f50, f54, f58, f62,
//      f66, f71). The camera follows and pushes in; the nobles close in from
//      both sides (f50-f64) and he reaches them on "out" (f71), the strings
//      short.
//   4. "and he had to go" f72-f80: he goes down behind the closed rank (his
//      diadem the last of him, f75-f77; out of sight f78), the orange in the
//      short strings dies from the hands, the nobles let go and straighten,
//      shoulder to shoulder, full cream (f80). f80-f96: the living hold: the
//      lower ends of Cortés's three dead strings swing empty above them, a
//      < 2 % creep.
// Built locally (stringsShared untouched): the noble with a raised arm
// (hisOwnPeopleFigures), the emperor whose legs fold and whose hem lifts
// (hisOwnPeopleV2Figures), the nobles' own row, the fronts, the horizon clip
// (he and the hauled strings are drawn only above the rank's shoulder line, so
// he goes down BEHIND the wall of cloaks).
// Camera: its own C1 track (velocity bumps, incaShared makeTrack) + the house
// sway; the focus is the world point held at screen (540, 835).
// Sources (nothing of it on screen): Moctezuma's death, late June 1520: by
// the Spanish accounts (Cortés's Second Letter; Bernal Díaz, ch. 126) he was
// brought out to calm the Mexica and was struck by stones thrown by his own
// people; native accounts (Sahagún, book 12) blame the Spaniards. The picture
// follows the speaker's reading.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 97;

export const schema = z.object({
  vignette: z.number(),
  /** the nobles' size against the shared layout's */
  nobleScale: z.number(),
  /** the opening zoom */
  k0: z.number(),
  /** the closing zoom */
  k1: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, nobleScale: 1.17, k0: 1.3, k1: 1.75 });

// ---- the nobles' own row -----------------------------------------------------
const FEET_Y = 1060;
const GAP0 = 111.5;
const GAP1 = 68;
const VAR = [2, 0, 3, 1, 2, 0, 3];
const rank = (i: number) => outsideRank(i);
const closeAt = (f: number) => smoothstep((f - 50) / 14);
const NR = nobleRig(0);
const CROWN_Y = NR.crown[1];
const sizeOf = (i: number, nobleScale: number) => nobleScale * (0.97 + 0.06 * hash(i, 911));
const feetOf = (i: number, f: number): P2 => {
  const c = closeAt(f);
  // closing in: a small step in each figure, not a slide
  const step = Math.sin(Math.PI * c) * Math.abs(Math.sin((f + i * 3) * 0.9)) * (i === 3 ? 0 : 3.5);
  return [540 + (i - 3) * mix(GAP0, GAP1, c), FEET_Y - step];
};
/** he and the hauled strings are drawn only above this line (behind the rank's shoulders) */
const CLIP_Y = FEET_Y - 92 * 1.135;

// ---- the timeline ----------------------------------------------------------
const ARM_F = 7;
const armStart = (i: number) => -5 + 2 * rank(i);
const gripF = (i: number) => armStart(i) + ARM_F;
const DIE_F = 8;
const pullStart = (i: number) => 20 + 1.5 * rank(i);
const pullLen = (i: number) => 9 + rank(i) / 3;
const arrive = (i: number) => pullStart(i) + pullLen(i);
const haulStart = (i: number) => 44 + rank(i);
const REL = { L: 46, R: 50, H: 54 };
/** the end: the orange dies from the hands, the arms come down, the faces level */
const lastDie = (i: number) => 70 + 0.5 * rank(i);
const downStart = (i: number) => 71 + 0.2 * rank(i);
const GONE = 78;
const lookAt = (i: number, f: number) => smoothstep((f + 6 - rank(i)) / 9) * (1 - smoothstep((f - 72) / 8));
const toneAt = (i: number, f: number) => 0.8 + 0.2 * smoothstep((f + 6 - rank(i)) / 9);

// ---- the camera (focus = the world point at screen (540, 835)) --------------
const HEAD0 = 415; // E3's head-top (world y)
const makeCam = (k0: number, k1: number) => {
  const wy0 = HEAD0 + (835 - 250) / k0;
  const wy1 = FEET_Y - 89 - (900 - 835) / k1;
  const WY = makeTrack(
    [
      [-20, 46, 6, 1],
      [46, 76, wy1 - wy0 - 4.5 - 2, 0.8],
      [70, 130, 4, 1],
    ],
    wy0,
    -30,
    140,
  );
  const LNK = makeTrack(
    [
      [-20, 46, 0.014, 1],
      [46, 76, Math.log(k1 / k0) - 0.0105 - 0.006, 0.8],
      [70, 130, 0.026, 1],
    ],
    Math.log(k0),
    -30,
    140,
  );
  return (f: number): Cam => camOf({ focus: [540, WY(f)], k: Math.exp(LNK(f)) });
};
export const camAt = makeCam(defaultProps.k0, defaultProps.k1);
export const scanV2 = () => camScan(camAt, 0, DURATION - 1, [[540, 900]]);

// ---- Moctezuma: a body coming down --------------------------------------------
const LEFT = [0, 1, 2, 3];
const RIGHT = [4, 5, 6];
const dragOf = (ids: number[], f: number) => ids.reduce((s, i) => s + smoothstep((f - arrive(i)) / 6), 0) / ids.length;
const key = (k: [number, number][]) => pchip(k, true);
const K_DY = key([[44, 0], [46, 6], [50, 22], [54, 55], [58, 125], [62, 205], [66, 290], [71, 380], [75, 455], [78, 505], [81, 520]]);
const K_TURN = key([[44, 0], [46, 0], [50, -14], [54, -8], [60, 12], [66, 5], [72, 0]]);
const K_LEAN = key([[44, 0], [50, 8], [58, -14], [66, -6], [72, 0]]);
const K_HEAD = key([[46, 0], [50, 10], [56, -16], [62, -10], [70, 0]]);
const K_NOD = key([[44, 0], [54, -0.15], [60, -0.3], [68, 0.3], [74, 0.6]]);
const K_SLUMP = key([[44, 0], [58, 0.16], [70, 0.66]]);
const K_KNEEL = key([[46, 0], [50, 0.2], [56, 0.6], [62, 0.9], [70, 1]]);
const K_HEM = key([[44, 0], [54, 14], [60, 40], [66, 28], [72, 10], [78, 0]]);
/** each freed arm is drawn down ahead of him by its strings (dx inward, dy down; figure px) */
const K_ARM_X = key([[0, 0], [6, 24], [14, 38], [24, 50]]);
const K_ARM_Y = key([[0, 0], [6, 52], [14, 84], [24, 94]]);

const bodyAt = (f: number) => {
  const dL = dragOf(LEFT, f);
  const dR = dragOf(RIGHT, f);
  const d = (dL * 4 + dR * 3) / 7;
  const tL = f - REL.L;
  const tR = f - REL.R;
  const pose: EmperorPose = {
    ...POSE_HANG,
    head: K_HEAD(f),
    nod: clamp01(0.4 * d + K_NOD(f)),
    slump: 0.12 + 0.22 * d + K_SLUMP(f),
    lean: K_LEAN(f),
    wristL: [POSE_HANG.wristL[0] + 30 * dL + K_ARM_X(tL), POSE_HANG.wristL[1] + 40 * dL + K_ARM_Y(tL)],
    wristR: [POSE_HANG.wristR[0] - 30 * dR - K_ARM_X(tR), POSE_HANG.wristR[1] + 40 * dR + K_ARM_Y(tR)],
    fistL: 0.6 + 0.4 * dL,
    fistR: 0.6 + 0.4 * dR,
  };
  const a = emperorAnchors(pose, "aztec");
  const pivot = a.chest;
  const dy = 12 * d + K_DY(f);
  const turn = K_TURN(f);
  const xf = (p: P2): P2 => add(add(pivot, rot(sub(p, pivot), turn)), [0, dy]);
  return { pose, pivot, dy, turn, xf, d, kneel: K_KNEEL(f), hemUp: K_HEM(f), headTop: xf(a.headTop), wristL: xf(a.wristL), wristR: xf(a.wristR), fistL: a.fistL, fistR: a.fistR };
};

// ---- the nobles' hands and strings ------------------------------------------
const armSide = (i: number) => (i < 3 ? 1 : -1);
const GRIP_UP = 28;

const stringAt = (i: number, f: number, fistFrom: P2, sc: number) => {
  const sg = armSide(i);
  const at = feetOf(i, f);
  const toWorld = (p: P2): P2 => [at[0] + p[0] * sc, at[1] + p[1] * sc];
  const toLocal = (p: P2): P2 => [(p[0] - at[0]) / sc, (p[1] - at[1]) / sc];
  const crown = toWorld([0, CROWN_Y]);
  const e = smoothstep((f - armStart(i)) / ARM_F);
  const gripped = f >= gripF(i);
  const G = add(crown, mul(norm(sub(fistFrom, crown)), GRIP_UP));
  const Q1 = toWorld([sg * 15, CROWN_Y - 2]);
  const Q2 = toWorld([sg * 20, NR.shY + 10]);
  const rest = toWorld([sg * (NR.hw + 4), NR.hipY + 4]);
  const ePull = smoothstep((f - pullStart(i)) / 5);
  const eHaul = smoothstep((f - haulStart(i)) / 10);
  const eDown = smoothstep((f - downStart(i)) / 7);
  const swing = mix2(rest, G, e);
  const held = mix2(mix2(G, Q1, ePull), Q2, eHaul);
  const hand: P2 = gripped ? mix2(held, rest, eDown) : [swing[0] + sg * 15 * Math.sin(Math.PI * e), swing[1]];
  const reach: Reach = { sgn: sg, e: e * (1 - eDown), W: toLocal(hand) };
  const side = i <= 3 ? -1 : 1;
  const behind = f >= haulStart(i);
  if (!gripped) {
    const main: StringGeom = { from: fistFrom, to: crown, slack: 0, side };
    return { reach, main, stub: null, live: [0, 1] as [number, number] | null, base: 1, soft: glintAt(f, i) as number | null, head: null as number | null, behind, at };
  }
  const die = clamp01((f - gripF(i)) / DIE_F);
  const q = clamp01((f - pullStart(i)) / pullLen(i));
  const sagTo = 0.34 * smoothstep(die * 2.2) * (1 - smoothstep(q * 4));
  const sagFrom = 0.34 * smoothstep(die * 1.4 - 0.4) * (1 - smoothstep(q * 1.25 - 0.1));
  const main: StringGeom = { from: fistFrom, to: hand, slack: [sagFrom, sagTo], side };
  const stub: StringGeom | null = eDown < 0.98 ? { from: hand, to: crown, slack: 0.5 * Math.max(ePull, eHaul), side: -sg } : null;
  // nothing left to pull: the last orange dies from the hand back along the short string
  const end = clamp01((f - lastDie(i)) / 5);
  const live: [number, number] | null = end >= 1 ? null : q > 0 ? [1 - q, 1 - end] : [0, 1 - die];
  const up = f > arrive(i) + 2 && end <= 0 ? 1.25 - (((f + i * 9.7) / 30) % 1) * 1.5 : null;
  return { reach, main, stub, live, base: TONE.dead, soft: up, head: q > 0 && q < 1 ? 1 - q : null, behind, at };
};

// ---- the captor's strings ----------------------------------------------------
const BAR_L: P2 = [HAND_AT[0] - 168, HAND_AT[1] + 25];
const BAR_R: P2 = [HAND_AT[0] + 168, HAND_AT[1] + 25];
const BAR_C: P2 = [HAND_AT[0], HAND_AT[1] + 25];
/** taut, orange and stretching thin until it lets go; then dead from his end, it whips up and hangs, swinging empty */
const captorString = (from: P2, toNow: P2, toAtRelease: P2, rel: number, f: number, side: number, j: number) => {
  const thin = 1 - 0.3 * smoothstep((f - 28) / 16);
  if (f < rel) return { g: { from, to: toNow, slack: 0, side } as StringGeom, live: [0, 1] as [number, number] | null, base: 1, on: true, width: STRING_W * thin };
  const t = f - rel;
  const v = sub(toAtRelease, from);
  const len0 = vlen(v);
  const ang0 = (Math.atan2(-v[0], v[1]) * 180) / Math.PI;
  const whip = t < 4 ? Math.sin((Math.PI * t) / 8) : 1 - smoothstep((t - 4) / 13);
  const len = len0 * (1 - 0.82 * whip);
  const ang = (ang0 + side * 3) * Math.cos(t / 5.2) * Math.exp(-t / 55) + 2.5 * Math.sin((f + j * 7) / 9);
  const to = add(from, rot([0, len], ang));
  const live: [number, number] | null = t + 1 < 4 ? [0, 1 - (t + 1) / 4] : null;
  return { g: { from, to, slack: 0.14 + 0.8 * whip, sag: 0.3, side } as StringGeom, live, base: TONE.dead, on: false, width: STRING_W * mix(thin, 1, clamp01(t / 4)) };
};

const GLINT = "#FFF3D2";
const Glint: React.FC<{ g: StringGeom; u: number | null; k: number; half: number; op: number; lo?: number }> = ({ g, u, k, half, op, lo = 0 }) => {
  if (u === null) return null;
  const a = Math.max(lo, u - half);
  const b = Math.min(1, u + half);
  if (b - a < 0.004) return null;
  const d = `M${stringPts(g, a, b)
    .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join("L")}`;
  return <path d={d} fill="none" stroke={GLINT} strokeOpacity={op} strokeWidth={(STRING_W / k) * 0.95} strokeLinecap="butt" />;
};

/** where things are on screen (for the checks and the report) */
export const framing = (f: number) => {
  const cam = camAt(f);
  const b = bodyAt(f);
  const sy = (p: P2) => Math.round(screenOf(p, cam)[1]);
  const sc = [0, 1, 2, 3, 4, 5, 6].map((i) => sizeOf(i, defaultProps.nobleScale));
  return {
    k: +cam.k.toFixed(3),
    bar: sy([540, 196]),
    headTop: sy(b.headTop),
    fistL: sy(b.xf(b.fistL)),
    dy: +b.dy.toFixed(0),
    clip: sy([0, CLIP_Y]),
    nobleHead: sy([0, FEET_Y + (CROWN_Y - 23) * sc[3]]),
    nobleFeet: sy([0, FEET_Y]),
    nobleH: [Math.round(152 * Math.min(...sc) * cam.k), Math.round(152 * Math.max(...sc) * cam.k)],
    rowX: [Math.round(screenOf([feetOf(0, f)[0] - 31 * sc[0], 0], cam)[0]), Math.round(screenOf([feetOf(6, f)[0] + 31 * sc[6], 0], cam)[0])],
  };
};

const HisOwnPeopleV2: React.FC<Props> = ({ vignette, nobleScale, k0, k1 }) => {
  const frame = useCurrentFrame();
  const track = React.useMemo(() => makeCam(k0, k1), [k0, k1]);
  const cam = swayCam(track(frame), frame);
  const k = cam.k;

  const b = bodyAt(frame);
  const fistFrom = (i: number): P2 => {
    const L = fistOf(i) === "L";
    const j = L ? i - 1.5 : i - 5;
    const fist = L ? b.fistL : b.fistR;
    return b.xf([fist[0] + j * 2.4, fist[1] + 8]);
  };
  const sc = NOBLES.map((_, i) => sizeOf(i, nobleScale));
  const ms = NOBLES.map((_, i) => stringAt(i, frame, fistFrom(i), sc[i]));

  const relBody = { L: bodyAt(REL.L), R: bodyAt(REL.R), H: bodyAt(REL.H) };
  const cs = [
    { ...captorString(BAR_C, b.headTop, relBody.H.headTop, REL.H, frame, -1, 0), j: 0 },
    { ...captorString(BAR_L, b.wristL, relBody.L.wristL, REL.L, frame, -1, 1), j: 1 },
    { ...captorString(BAR_R, b.wristR, relBody.R.wristR, REL.R, frame, 1, 2), j: 2 },
  ];
  const drawString = (i: number) => {
    const s = ms[i];
    return (
      <g key={i}>
        {s.stub ? <PuppetString {...s.stub} base={TONE.dead} live={null} k={k} /> : null}
        <PuppetString {...s.main} base={s.base} live={s.live} highlight={s.soft} k={k} />
        <Glint g={s.main} u={s.head === null ? null : s.head + 0.03} k={k} half={0.03} op={0.95} lo={s.head ?? 0} />
      </g>
    );
  };
  const ids = [0, 1, 2, 3, 4, 5, 6];

  return (
    <StringsPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <clipPath id="hop2-horizon">
          <rect x={-4000} y={-4000} width={9000} height={4000 + CLIP_Y} />
        </clipPath>
        {/* he, and the strings that haul him, are behind the rank: nothing of them below its shoulder line */}
        <g clipPath="url(#hop2-horizon)">
          {frame < GONE + 1 ? (
            <g transform={`translate(0 ${b.dy.toFixed(2)}) rotate(${b.turn.toFixed(3)} ${b.pivot[0].toFixed(2)} ${b.pivot[1].toFixed(2)})`}>
              <FallingEmperor pose={b.pose} variant="aztec" tone={1} uid="hop2-e" kneel={b.kneel} hemUp={b.hemUp} />
            </g>
          ) : null}
          {ids.filter((i) => ms[i].behind).map(drawString)}
        </g>
        {ids.map((i) => (
          <GripNoble key={i} i={i} at={ms[i].at} variant={VAR[i]} bow={0} tone={toneAt(i, frame)} scale={sc[i]} look={lookAt(i, frame)} reach={ms[i].reach} uid={`hop2-n${i}`} />
        ))}
        {ids.filter((i) => !ms[i].behind).map(drawString)}
        {ids.map((i) =>
          ms[i].reach.e > 0.02 ? (
            <g key={i} transform={`translate(${(ms[i].at[0] - NOBLES[i].x).toFixed(2)} ${(ms[i].at[1] - NOBLES[i].y).toFixed(2)})`}>
              <NobleFist i={i} scale={sc[i]} tone={toneAt(i, frame)} reach={ms[i].reach} />
            </g>
          ) : null,
        )}
        {cs.map((s) => {
          const u = s.on ? glintAt(frame, 7 + s.j, 30) : null;
          return (
            <g key={s.j}>
              <PuppetString {...s.g} base={s.base} live={s.live} highlight={u} k={k} width={s.width} />
            </g>
          );
        })}
      </WorldSvg>
    </StringsPage>
  );
};

export default HisOwnPeopleV2;
