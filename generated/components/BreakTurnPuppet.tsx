// ---------------------------------------------------------------------------
// BreakTurnPuppet (file 17_BreakTurnPuppet; replaces cuts 17 / 20 / 23 of the
// "strings" set; Dwarkesh Patel with Si Sheppard, "Why captured emperors
// cooperated"). Dwarkesh map style, "beyond maps" umber page; the world is
// stringsShared (frozen, used as-is); the turning figure is breakTurnFigure
// (local). Opaque 1080x1920, 24 fps, 218 frames (f0..f217). Slot 17.059 s.
// OPENS on state E1 (+ PsychologicalBreak's thin dead string from his head up
// out of frame), ENDS on exactly state E3 under CAM_E3 (f204-f217).
//
// THE LINE: "(...being told what to do) just led to a complete psychological
// break because once Cortés had hold of him, he seems to have pulled a
// complete 180 switch and become essentially, willingly, Cortés's puppet."
//
// WORD -> LOCAL FRAME: led 6 · complete 12 · psychological 24 · BREAK 38-47 ·
//   because 48 · once 54 · CORTÉS 62 · had 71 · HOLD 75 · of 80 · him 84 ·
//   he 90 · seems 92 · to 98 · have 101 · PULLED 106 · a 115 · COMPLETE 119 ·
//   180 130 · SWITCH 137-144 · and 144 · BECOME 151 · ESSENTIALLY 159-177 ·
//   WILLINGLY 185-192 · CORTÉS'S 196 · PUPPET 207-213 · ends f215.
//
// THE GESTURES (each with the words it serves; nothing else)
//  ACT 1 f0-f88 = PsychologicalBreak as built (its code, copied):
//   1. "led to a complete" f0-f22: E1 holding, the camera creeping in.
//   2. "psychological break" f23-f47: his fists open, the seven strings leave
//      his grip left to right, fall slack and go dead from his hand down; he
//      slumps; each noble sags and dims as its string's dead front arrives.
//   3. "because once Cortés" f43-f66: the camera rises up the head string; the
//      gauntlet comes down into frame; "CORTÉS" lands f62 (fades f88-f100).
//   4. "had hold of him" f68-f84: the head string lights orange from the hand
//      down and lifts him: he hangs from it.
//  ACT 2 f76-f146, the 180:
//   5. camera, f76-f108: one glide IN to him hanging on the string (k 2.0: he
//      is ~590 px tall, the string runs up out of the top of frame), then a
//      slow creep through the turn.
//   6. "pulled a complete 180 switch" f106-f142: he TURNS half a turn on the
//      string: a body in space (breakTurnFigure): the near shoulder leads, the
//      far arm tucks behind, edge-on f129 ("180" f130), his BACK to us by f142
//      ("switch"). The head leads by 3 f, the hem lags 2.5 f and flares, the
//      arms swing out and settle by ~f151; shade 0.78 edge-on. The string
//      winds two plies above his head and HOLDS them. His seven dead strings
//      go round with his hands: the two bundles cross below him (a half-twist).
//      f128-f146 his head lifts and tips back: he looks UP the string.
//   7. the nobles watch (f119-f145): bow 0.35 -> 0.2 -> 0.35, outside-in.
//  ACT 3 f144-f217, the puppet:
//   8. "and become essentially" f146-f178: the camera pulls back and up
//      (k 1.5): the gauntlet at the top, him large, back to us, the nobles
//      entering below. The bar draws out of the grip (f152-f166) and two
//      orange strings pay out from its ends and wait short of his wrists.
//   9. "willingly" f181-f190: from behind, HE raises his wrists to the waiting
//      ends; they fasten (f187-f190).
//  10. "Cortés's puppet" f190-f204: the hand turns the bar half a turn about
//      the vertical (it foreshortens through end-on, f191-f201.5) and he is
//      turned with it, half a frame behind (f191.5-f202): back -> front, the string's
//      wraps and his own strings' half-twist undone; he ends facing his people,
//      upright, hanging from three taut orange strings. From f194 the orange
//      runs down his seven strings hand -> noble (0.5 f apart), each pulling
//      taut; each noble straightens and brightens as it arrives; all by f204.
//      The camera eases to CAM_E3 (f190-f204).
//  11. f204-f217: exactly state E3 under CAM_E3, the highlights travelling.
// NOT DONE: the gauntlet itself does not rotate (the shared hand is one
//   drawing); the bar's foreshortening carries its turn.
// SOURCES: none on screen but the name. Moctezuma II held by Cortés in
//   Tenochtitlan from 14 Nov 1519 (Díaz del Castillo; Cortés, 2nd letter).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, DARK, clamp01, pchip, smootherstep, smoothstep } from "./incaShared";
import {
  CAM_E1,
  CAM_E2,
  CAM_E3,
  CaptorHand,

  Emperor,
  Label,

  N_NOBLES,
  Noble,
  POSE_HANG,
  POSE_SLUMP,
  POSE_UPRIGHT,
  PuppetString,
  STRING_W,
  StringsPage,
  TONE,
  Tableau,
  WorldSvg,
  add,
  camOf,
  fistOf,
  glintAt,
  handAnchors,
  HAND_AT,
  lerpPose,
  mix,
  mix2,
  mul,
  nobleHeadTop,
  norm,
  outsideRank,
  sub,
  type Cam,
  type EmperorPose,
  type P2,
  type StringGeom,
} from "./stringsShared";
import { TurnEmperor, turnAnchors, type Turn } from "./breakTurnFigure";

export const FPS = 24;
export const DURATION = 218;
const LAST = DURATION - 1;

export const schema = z.object({
  vignette: z.number(),
  /** the label's world anchor (baseline middle) beside the cuff */
  labelX: z.number(),
  labelY: z.number(),
  /** review only: draw the last hold with this file's own pieces instead of the shared Tableau */
  ownHold: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, labelX: 806, labelY: 31, ownHold: false });

// ---- timing -----------------------------------------------------------------
const T = {
  // act 1 (PsychologicalBreak)
  release0: 25,
  releaseStep: 1.6,
  slack: 14,
  front: 8,
  nobleLag: 7,
  noble: 8,
  hand: [32, 64] as [number, number],
  labelIn: 53,
  labelHold: 66,
  labelOut: [88, 100] as [number, number],
  light: [68, 75] as [number, number],
  lift: [74.5, 84] as [number, number],
  // act 2
  turn1: [106, 142] as [number, number],
  headLead: 3,
  hemLag: 2.5,
  lookUp: [128, 146] as [number, number],
  watch: 119,
  // act 3
  bar: [152, 166] as [number, number],
  pay: [160, 178] as [number, number],
  wrist: [181, 190] as [number, number],
  close: [186, 190] as [number, number],
  barTurn: [191, 201.5] as [number, number],
  turn2: [191.5, 202] as [number, number],
  hang: [189, 201] as [number, number],
  through: 194,
  throughStep: 0.5,
  hold: 204,
};
const span = (f: number, r: readonly [number, number]) => (f - r[0]) / (r[1] - r[0]);
const release = (i: number) => T.release0 + T.releaseStep * i;
const fall = (t: number) => smootherstep(Math.pow(clamp01(t), 1.25));

// ---- camera: one keyed C1 track; the focus is held at screen (540, 835) ------
const CLOSE = { y: 640, k: 2.0 }; // him hanging on the string, ~590 px tall
const WIDE = { y: 563, k: 1.5 }; // the gauntlet at the top, him large below
const K_IN = CAM_E1.k * 1.042;
const FOCUS_Y = pchip([
  [0, CAM_E1.focus[1]],
  [22, 737],
  [43, 729],
  [50, 650],
  [57, 590],
  [66, CAM_E2.focus[1] + 3],
  [76, CAM_E2.focus[1] + 1],
  [108, CLOSE.y],
  [142, CLOSE.y],
  [146, CLOSE.y - 1.5],
  [178, WIDE.y],
  [190, WIDE.y + 2],
  [T.hold, CAM_E3.focus[1]],
  [LAST, CAM_E3.focus[1]],
]);
const LOG_K = pchip([
  [0, Math.log(CAM_E1.k)],
  [23, Math.log(K_IN)],
  [43, Math.log(K_IN * 0.994)],
  [50, Math.log(mix(K_IN, CAM_E2.k, 0.48))],
  [57, Math.log(mix(K_IN, CAM_E2.k, 0.84))],
  [66, Math.log(CAM_E2.k * 1.004)],
  [76, Math.log(CAM_E2.k * 1.008)],
  [108, Math.log(CLOSE.k)],
  [142, Math.log(CLOSE.k * 1.035)],
  [146, Math.log(CLOSE.k * 1.032)],
  [178, Math.log(WIDE.k)],
  [190, Math.log(WIDE.k * 0.99)],
  [T.hold, Math.log(CAM_E3.k)],
  [LAST, Math.log(CAM_E3.k)],
]);
export const camAt = (f: number): Cam => {
  if (f >= T.hold) return camOf(CAM_E3);
  if (f <= 0) return camOf(CAM_E1);
  const k = Math.exp(LOG_K(f));
  return { k, cx: 540, cy: FOCUS_Y(f) - (835 - 960) / k };
};

// ---- act 1: the break (PsychologicalBreak's pose) ----------------------------
const POSE_DEEP: EmperorPose = { ...POSE_SLUMP, head: 31, slump: 1.5, lean: 4.5, wristL: [-56, -111], wristR: [68, -109] };
const breakPose = (f: number): EmperorPose => {
  const tH = fall((f - 23) / 18);
  const tS = fall((f - 25) / 19);
  const tL = fall((f - 26) / 17);
  const tR = fall((f - 31) / 14);
  const a = POSE_UPRIGHT;
  const b = POSE_DEEP;
  const broken: EmperorPose = {
    head: mix(a.head, b.head, tH),
    nod: mix(a.nod, b.nod, tH),
    slump: mix(a.slump, b.slump, tS),
    lean: mix(a.lean, b.lean, tS),
    wristL: mix2(a.wristL, b.wristL, tL),
    wristR: mix2(a.wristR, b.wristR, tR),
    fistL: 1 - smoothstep((f - 24) / 9),
    fistR: 1 - smoothstep((f - 31) / 8),
    hang: 0,
    limp: mix(a.limp, b.limp, Math.min(tL, tR)),
  };
  const lift = smootherstep(span(f, T.lift));
  return lift <= 0 ? broken : lerpPose(broken, POSE_SLUMP, lift);
};
const FIST_BOTTOM = 212;
const trap = (t: number) => {
  const a = 0.28;
  const u = clamp01(t);
  const h = 1 / (1 - a);
  if (u < a) return h * (u / 2 - (a / (2 * Math.PI)) * Math.sin((Math.PI * u) / a));
  if (u > 1 - a) return 1 - h * ((1 - u) / 2 - (a / (2 * Math.PI)) * Math.sin((Math.PI * (1 - u)) / a));
  return h * (u - a / 2);
};
/** the hand's dy: its fist's bottom follows ONE eased screen track down into the frame */
const handDy = (f: number, cam: Cam) => {
  if (f >= T.hand[1]) return 0;
  const end = camAt(T.hand[1]);
  const sEnd = 960 + (FIST_BOTTOM - end.cy) * end.k;
  const s = mix(-14, sEnd, trap(span(f, T.hand)));
  return (s - 960) / cam.k + cam.cy - FIST_BOTTOM;
};
const THIN = 2.2;

// ---- acts 2 and 3: the turns --------------------------------------------------
/** turn 1 (rad): weighty off the mark, edge-on f129, his back to us f142, no overshoot */
const TH1 = pchip([
  [0, 0],
  [T.turn1[0], 0],
  [116, 0.42],
  [124, 1.08],
  [129, Math.PI / 2],
  [134, 2.2],
  [139, 2.92],
  [T.turn1[1], Math.PI],
  [160, Math.PI],
]);
const th1 = (f: number) => (f <= T.turn1[0] ? 0 : f >= T.turn1[1] ? Math.PI : TH1(f));
/** turn 2: he comes round to the front again, led by the bar */
const th2 = (f: number, r: readonly [number, number]) => Math.PI * (1 - smootherstep(span(f, r)));
const MID = 165; // between the two turns
const bodyAngle = (f: number) => (f < MID ? th1(f) : th2(f, T.turn2));
const barAngle = (f: number) => (f < MID ? Math.PI : th2(f, T.barTurn));
const turnAt = (f: number): Turn => ({
  body: bodyAngle(f),
  head: f < MID ? th1(f + T.headLead) : th2(f + 1, T.turn2),
  hem: f < MID ? th1(f - T.hemLag) : th2(f - 1.5, T.turn2),
  flare: 0.14 * smoothstep((f - 112) / 12) * (1 - smootherstep((f - 139) / 12)) + 0.1 * smoothstep((f - 192) / 5) * (1 - smootherstep((f - 197) / 6.5)),
  look: smootherstep((f - 133) / 13) * (1 - smootherstep((f - 187) / 8)),
});
/** the arms' swing outward (figure px): grows with the turn, lags, settles by ~f151 */
const swingAt = (f: number) => 17 * smoothstep((f - 112) / 15) * (1 - smootherstep((f - 138) / 13));
/** the string's wraps above his head: wound by turn 1, HELD, unwound by turn 2 */
const twistAt = (f: number) => smoothstep((f - 109) / 31) * (1 - smoothstep(span(f, [190, 201.5])));

/** his back to us, head up: where turn 1 leaves him */
const POSE_BACK: EmperorPose = { ...POSE_SLUMP, head: 0, nod: 0, slump: 0.5, lean: 0 };
const BACK_TURN: Turn = { body: Math.PI, head: Math.PI, hem: Math.PI, flare: 0, look: 1 };
const BACK_AT = turnAnchors(POSE_BACK, BACK_TURN);
const BAR0 = handAnchors({ bar: 1, tilt: 0 });
/** a bar end at the bar's angle (it turns about the vertical through the grip) */
const barEnd = (p: P2, ang: number): P2 => [BAR0.barC[0] + (p[0] - BAR0.barC[0]) * Math.cos(ang), p[1]];
/** how far short of his hanging wrists the strings wait (world px) */
const GAP = 88;
const waitPoint = (bar: P2, wrist: P2): P2 => add(wrist, mul(norm(sub(bar, wrist)), GAP));
const WAIT_L = waitPoint(barEnd(BAR0.barL, Math.PI), BACK_AT.wristL);
const WAIT_R = waitPoint(barEnd(BAR0.barR, Math.PI), BACK_AT.wristR);
/** the figure-local wrist target that puts his wrist's string anchor at world p while his back is to us */
const targetFor = (p: P2): P2 => [-(p[0] - 540), p[1] - 760 + 7];
const REACH_L = targetFor(WAIT_L);
const REACH_R = targetFor(WAIT_R);

const poseAt = (f: number): EmperorPose => {
  if (f < 100) return breakPose(f);
  const up = smootherstep(span(f, T.lookUp));
  let q = lerpPose(POSE_SLUMP, POSE_BACK, up);
  const sw = swingAt(f);
  if (sw > 0) q = { ...q, wristL: [q.wristL[0] - sw, q.wristL[1] - 0.3 * sw], wristR: [q.wristR[0] + sw, q.wristR[1] - 0.3 * sw] };
  const w = smootherstep(span(f, T.wrist));
  if (w > 0) {
    const c = smootherstep(span(f, T.close));
    q = { ...q, wristL: mix2(q.wristL, REACH_L, w), wristR: mix2(q.wristR, REACH_R, w), fistL: 0.6 * c, fistR: 0.6 * c, limp: mix(q.limp, 0.12, w), slump: mix(q.slump, 0.4, w) };
  }
  const g = smootherstep(span(f, T.hang));
  return g > 0 ? lerpPose(q, POSE_HANG, g) : q;
};

/** the order the orange enters his seven strings (never a sweep) */
const THROUGH_ORDER = [1, 5, 3, 0, 6, 2, 4];
const throughT = (f: number, i: number) => f - T.through - T.throughStep * THROUGH_ORDER.indexOf(i);

/** the twisted stretch of the head string: two plies wound round each other */
const Twist: React.FC<{ g: StringGeom; tw: number; k: number; span: [number, number] }> = ({ g, tw, k, span: sp }) => {
  const at = (s: number): P2 => [g.from[0] + (g.to[0] - g.from[0]) * s, g.from[1] + (g.to[1] - g.from[1]) * s];
  const A = at(sp[0]);
  const B = at(sp[1]);
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
  const n: P2 = [-(B[1] - A[1]) / len, (B[0] - A[0]) / len];
  const wraps = 1 + 1.5 * tw;
  const amp = (6 * tw) / Math.sqrt(k / 1.12);
  const ply = (sgn: number): P2[] =>
    Array.from({ length: 57 }, (_, j) => {
      const v = j / 56;
      const o = sgn * amp * Math.sin(Math.PI * v) * Math.sin(2 * Math.PI * wraps * v);
      return [A[0] + (B[0] - A[0]) * v + n[0] * o, A[1] + (B[1] - A[1]) * v + n[1] * o] as P2;
    });
  const d = (pts: P2[]) => `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}`;
  const w = STRING_W / k;
  const back = d(ply(-1));
  const front = d(ply(1));
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="butt">
      <path d={back} stroke={DARK} strokeOpacity={0.5} strokeWidth={w + 2.6 / k} />
      <path d={back} stroke={ACCENT_DEEP} strokeWidth={w * 1.2} />
      <path d={front} stroke={DARK} strokeOpacity={0.5} strokeWidth={w + 2.6 / k} />
      <path d={front} stroke={ACCENT_DEEP} strokeWidth={w * 1.5} />
      <path d={front} stroke={ACCENT} strokeWidth={w * 0.92} />
    </g>
  );
};

const BreakTurnPuppet: React.FC<Props> = ({ vignette, labelX, labelY, ownHold }) => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = camAt(f);
  const k = cam.k;

  // ---- the last hold: exactly state E3 (the next cut opens on it) ----
  if (f >= T.hold && !ownHold) {
    return (
      <StringsPage cam={cam} vignette={vignette}>
        <Tableau state="E3" cam={cam} frame={frame} uid="btp" />
      </StringsPage>
    );
  }

  // ---- him ----
  const pose = poseAt(f);
  const turn = turnAt(f);
  const plain = turn.body === 0 && turn.head === 0 && turn.hem === 0 && turn.flare === 0 && turn.look === 0;
  const an = turnAnchors(pose, turn);
  const shade = 1 - 0.22 * Math.pow(Math.sin(turn.body), 2);

  // ---- his seven strings and their nobles ----
  const strings: { g: StringGeom; base: number; live: [number, number] | null; highlight: number | null }[] = [];
  const nobles: { bow: number; tone: number }[] = [];
  for (let i = 0; i < N_NOBLES; i++) {
    // act 1: it leaves his grip, falls slack, goes dead from his hand down
    const r = release(i);
    const sl = smootherstep((f - r) / T.slack);
    const pDead = clamp01((f - r) / T.front);
    const sagging = smoothstep((f - r - T.nobleLag) / T.noble);
    // act 2: the nobles watch him turn
    const tw = (f - T.watch - 1.6 * outsideRank(i)) / 16;
    const watch = tw <= 0 || tw >= 1 ? 0 : Math.pow(Math.sin(Math.PI * smoothstep(tw)), 2);
    // act 3: the orange comes down it, it pulls taut, the noble straightens
    const t3 = throughT(f, i);
    const p3 = clamp01(t3 / 5.5);
    const up = smoothstep((t3 - 2.5) / 4.5);
    const bow = (0.35 * sagging - 0.15 * watch) * (1 - up);
    nobles.push({ bow, tone: mix(mix(1, TONE.second, sagging), 0.8, up) });
    const period = 31 + 5.3 * ((i * 3) % 7);
    const slackFrom = sl * (1 - smoothstep((t3 - 0.3) / 5));
    const slackTo = sl * (1 - smoothstep((t3 - 1.5) / 5.5));
    const L = fistOf(i) === "L";
    const j = L ? i - 1.5 : i - 5;
    const fist = L ? an.fistL : an.fistR;
    const taut = slackFrom < 0.12 && slackTo < 0.12;
    const live: [number, number] | null = t3 > 0 ? (p3 > 0.002 ? [0, p3] : null) : pDead < 1 ? [pDead, 1] : null;
    strings.push({
      g: {
        from: [fist[0] + j * 2.4 * an.c, fist[1] + 8],
        to: nobleHeadTop(i, bow),
        slack: [slackFrom, slackTo],
        sag: 0.17 * (1 + 0.045 * sl * Math.sin((2 * Math.PI * (f - 90)) / period)),
        side: i < 3 ? -1 : i > 3 ? 1 : -1,
      },
      base: t3 > 0 ? mix(TONE.dead, 1, p3) : TONE.dead,
      live,
      highlight: live && (t3 > 0 ? taut : true) ? glintAt(frame, i) : null,
    });
  }

  // ---- the hand, the bar ----
  const barForm = smootherstep(span(f, T.bar));
  const bAng = barAngle(f);
  const handAt: P2 = [HAND_AT[0], HAND_AT[1] + handDy(f, cam)];
  const hand = handAnchors({ bar: barForm, tilt: 0 }, handAt);
  const barShown = barForm * Math.max(0.04, Math.abs(Math.cos(bAng)));
  const barL = barEnd(hand.barL, bAng);
  const barR = barEnd(hand.barR, bAng);

  // ---- the head string ----
  const top = mix2(hand.grip, hand.barC, Math.min(1, barForm * 1.5));
  const pLight = clamp01(span(f, T.light));
  const loose = 0.06 + 0.44 * fall((f - 24) / 18);
  const head: StringGeom = { from: top, to: an.headTop, slack: [loose * (1 - smoothstep((f - 68) / 6)), loose * (1 - smoothstep((f - 71) / 7))] };
  const tw = twistAt(f);
  // the wraps sit just above his head: a fixed length of string, whatever the string's length
  const headLen = Math.hypot(head.to[0] - head.from[0], head.to[1] - head.from[1]) || 1;
  const twSpan: [number, number] = [1 - 88 / headLen, 1 - 8 / headLen];

  // ---- the two wrist strings ----
  const pay = smootherstep(span(f, T.pay));
  const fasten = smoothstep((f - 187) / 3);
  const taut = smoothstep((f - 190) / 7);
  const wristString = (sd: -1 | 1): { g: StringGeom; drawn: [number, number] } | null => {
    if (pay <= 0.002) return null;
    const from = sd < 0 ? barL : barR;
    const wait = sd < 0 ? WAIT_L : WAIT_R;
    const wrist = sd < 0 ? an.wristL : an.wristR;
    const ph = sd < 0 ? 0.6 : 2.9;
    const sway: P2 = [7 * pay * Math.sin(0.23 * f + ph), 1.5 * Math.sin(0.31 * f + ph)];
    const to = mix2(add(wait, mul(sway, 1 - fasten)), wrist, fasten);
    const slack = (0.34 + 0.08 * Math.sin(0.19 * f + ph * 2)) * (1 - 0.35 * fasten) * (1 - taut);
    return { g: { from, to, slack, sag: 0.1, side: sd }, drawn: [0, pay] };
  };
  const wL = wristString(-1);
  const wR = wristString(1);

  // ---- the label: it stands at its screen place while the hand arrives, rides the world, then goes ----
  const labelCam = f < T.labelHold ? camAt(T.labelHold) : cam;
  const labelOut = smoothstep(span(f, T.labelOut));

  return (
    <StringsPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        {nobles.map((n, i) => (
          <Noble key={i} i={i} bow={n.bow} tone={n.tone} uid={`btp-n${i}`} />
        ))}
        {plain ? (
          <Emperor pose={pose} variant="aztec" tone={1} uid="btp-e" />
        ) : (
          <g style={shade < 0.999 ? { filter: `brightness(${shade.toFixed(3)})` } : undefined}>
            <TurnEmperor pose={pose} turn={turn} uid="btp-t" />
          </g>
        )}
        {strings.map((s, i) => (
          <PuppetString key={i} {...s.g} base={s.base} live={s.live} highlight={s.highlight} k={k} />
        ))}
        {pLight < 1 ? <PuppetString {...head} base={TONE.dead} live={null} drawn={[pLight, 1]} k={k} width={THIN} /> : null}
        {pLight > 0 ? (
          tw > 0.001 ? (
            <>
              <PuppetString {...head} base={1} live={[0, 1]} drawn={[0, twSpan[0]]} highlight={glintAt(frame, 7)} k={k} />
              <PuppetString {...head} base={1} live={[0, 1]} drawn={[twSpan[1], 1]} highlight={glintAt(frame, 7)} k={k} />
              <Twist g={head} tw={tw} k={k} span={twSpan} />
            </>
          ) : (
            <PuppetString {...head} base={1} live={[0, pLight]} drawn={[0, pLight]} highlight={glintAt(frame, 7)} k={k} />
          )
        ) : null}
        {wL ? <PuppetString {...wL.g} drawn={wL.drawn} base={1} live={[0, 1]} highlight={taut > 0.9 ? glintAt(frame, 8) : null} k={k} /> : null}
        {wR ? <PuppetString {...wR.g} drawn={wR.drawn} base={1} live={[0, 1]} highlight={taut > 0.9 ? glintAt(frame, 9) : null} k={k} /> : null}
        <CaptorHand bar={barShown} tilt={0} at={handAt} tone={1} uid="btp-h" />
      </WorldSvg>
      {labelOut < 1 ? (
        <Label text="CORTÉS" x={Math.min(labelX, 540 + 400 / labelCam.k)} y={labelY} cam={labelCam} frame={frame} f0={T.labelIn} size={44} opacity={1 - labelOut} dy={-18 * labelOut} />
      ) : null}
    </StringsPage>
  );
};

export default BreakTurnPuppet;
